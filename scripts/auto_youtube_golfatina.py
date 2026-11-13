#!/usr/bin/env python3
"""Bot golfatine: YouTube -> classifica -> sito, senza DOCX/PDF e senza intervento.

Gira da solo sul Mac (launchd, vedi automation/README.md), in un clone
dedicato del repo, quindi non tocca mai la copia di lavoro di sviluppo.

Ogni esecuzione:
  1. git pull (ff-only) del clone bot su main.
  2. Feed RSS dei 7 canali -> candidati non ancora integrati/decisi
     (scripts/youtube_watch.py).
  3. Per ogni candidato, in ordine di pubblicazione:
       - classifica finale dal video (scripts/grab_scoreboard_frame.py):
         solo coda a 360p + pochi secondi in alta risoluzione;
       - lettura con il VLM locale (scripts/extract_scoreboard.py) su 2+
         frame diversi: si accetta solo se 2 letture coincidono cella per
         cella E passano i checksum (somma buche == totale, totale-par ==
         diff) E tutti i nomi sono canonici;
       - scarto dei doppioni (stessa classifica gia' presente).
  4. Integra i video accettati con numerazione progressiva (#N+1…),
     ricalcola statistiche/H2H/summary/hardcoded, forecast TimesFM,
     npm test + tsc, commit + push -> redeploy Vercel.
  5. Casi dubbi (classifica illeggibile, formati a squadre, giocatori
     nuovi, golfatina senza classifica): MAI pubblicati. Il bot salva
     ritaglio + bozza in automation/review|manual/, apre una Issue GitHub
     e notifica. Correggi automation/manual/<ID>.json (anche da GitHub
     web), metti "approved": true e al giro dopo viene integrato.
     Per scartarlo: "action": "skip".

Stato persistente: automation/ledger.json (decisione per ogni video).

Uso:
  python3 scripts/auto_youtube_golfatina.py            # giro completo
  python3 scripts/auto_youtube_golfatina.py --list     # solo candidati
  … --no-commit | --no-push | --only <YTID> | --limit N | --skip-weak
"""

import argparse
import datetime as dt
import fcntl
import json
import os
import re
import shutil
import subprocess
import sys
import tempfile
import time

SCRIPTS = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPTS)
sys.path.insert(0, SCRIPTS)

import auto_update_golfatina as auto  # noqa: E402
import youtube_watch as watch  # noqa: E402

AUTO_DIR = os.path.join(PROJECT_ROOT, "automation")
FRAMES_DIR = os.path.join(AUTO_DIR, "frames")
REVIEW_DIR = os.path.join(AUTO_DIR, "review")
MANUAL_DIR = os.path.join(AUTO_DIR, "manual")
GRAB_SCRIPT = os.path.join(SCRIPTS, "grab_scoreboard_frame.py")
BOT_MARKER = os.path.join(PROJECT_ROOT, ".golfatine-bot")  # solo nel clone bot
LOCK_PATH = os.path.join(os.path.expanduser("~"), ".golfatine-bot", "bot.lock")
REPO_URL = "https://github.com/Massimilianociconte/golfatine"
MAX_RETRY = 24          # ~1 giorno con giro orario
CONSENSUS_MAX_RUNS = 5  # letture VLM massime per video

BOT_COMMIT_FILES = [f for f in auto.COMMIT_FILES
                    if f not in ("lista-golfatine.docx", "Lista-golfatine.pdf")] + [
    "automation", "scripts/youtube_watch.py", "scripts/grab_scoreboard_frame.py",
    "scripts/auto_youtube_golfatina.py"]


class BotError(Exception):
    pass


def _raise(msg):
    raise BotError(msg)


# le funzioni della pipeline DOCX chiamano fail() -> sys.exit: qui eccezione
auto.fail = _raise


def log(msg):
    ts = dt.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[bot {ts}] {msg}", flush=True)


def sh(cmd, check=True, capture=True, timeout=1800, cwd=PROJECT_ROOT):
    r = subprocess.run(cmd, cwd=cwd, capture_output=capture, text=True, timeout=timeout)
    if check and r.returncode != 0:
        raise BotError(f"comando fallito ({r.returncode}): {' '.join(cmd)}\n"
                       f"{(r.stderr or '')[-2000:]}{(r.stdout or '')[-1000:]}")
    return r


def notify(title, msg):
    """Notifica macOS locale + (opzionale) ntfy se GOLFATINE_NTFY_TOPIC e' impostato."""
    if shutil.which("osascript"):
        safe = lambda s: s.replace('"', "'")[:200]
        subprocess.run(["osascript", "-e",
                        f'display notification "{safe(msg)}" with title "{safe(title)}"'],
                       capture_output=True)
    topic = os.environ.get("GOLFATINE_NTFY_TOPIC")
    if topic:
        try:
            import urllib.request
            req = urllib.request.Request(f"https://ntfy.sh/{topic}", data=msg.encode("utf-8"),
                                         headers={"Title": title.encode("utf-8")})
            urllib.request.urlopen(req, timeout=10)
        except Exception as e:
            log(f"ntfy fallito: {e}")


# ------------------------------------------------------------------ git
def git(*args, check=True):
    return sh(["git", *args], check=check)


def repo_prepare(pull=True):
    branch = git("branch", "--show-current").stdout.strip()
    if branch != "main":
        raise BotError(f"branch corrente {branch!r} != main")
    dirty = git("status", "--porcelain", "--untracked-files=no").stdout.strip()
    if dirty:
        raise BotError(f"modifiche locali non committate nel repo del bot:\n{dirty}")
    if pull:
        git("pull", "--ff-only", "-q", "origin", "main")


def repo_reset():
    """Annulla modifiche parziali dopo un errore (solo nel clone bot)."""
    if os.path.isfile(BOT_MARKER):
        git("reset", "--hard", "-q", "HEAD", check=False)
        git("clean", "-fdq", "automation", check=False)
        log("clone bot ripristinato a HEAD")
    else:
        log("NB: non sono nel clone bot: modifiche lasciate per ispezione (git diff)")


def commit_push(message, push=True):
    git("add", "--", *[p for p in BOT_COMMIT_FILES if os.path.exists(os.path.join(PROJECT_ROOT, p))])
    status = git("diff", "--cached", "--name-only").stdout
    if not status.strip():
        log("nessuna modifica da committare")
        return False
    if re.search(r"(^|/)\.env", status, re.M):
        raise BotError("file .env* nello stage: commit rifiutato")
    git("commit", "-q", "-m", message + "\n\nAutomated by scripts/auto_youtube_golfatina.py")
    if push:
        r = git("push", "-q", "origin", "main", check=False)
        if r.returncode != 0:
            log("push rifiutato, rebase su origin/main e riprovo")
            git("pull", "--rebase", "-q", "origin", "main")
            git("push", "-q", "origin", "main")
        log("push su main completato -> redeploy Vercel automatico")
    return True


# ---------------------------------------------------------- scoreboard
def norm_sb(sb):
    """Forma canonica confrontabile di uno scoreboard {par, players}."""
    return (int(sb["par"]), tuple(sorted(
        (int(p["position"]), auto.canon_player(p["name"]), int(p["totalScore"]),
         tuple(int(h) for h in p["holes"])) for p in sb["players"])))


def positions_consistent(players):
    """Posizioni coerenti coi totali: totale minore -> posizione minore,
    totali uguali -> stessa posizione (pari merito), si parte da 1."""
    ps = [(p.get("totalScore"), p.get("position")) for p in players]
    if not all(isinstance(t, int) and isinstance(q, int) and q >= 1 for t, q in ps):
        return False
    if min(q for _, q in ps) != 1:
        return False
    for t1, q1 in ps:
        for t2, q2 in ps:
            if (t1 < t2 and not q1 < q2) or (t1 == t2 and q1 != q2):
                return False
    return True


def normalize_positions(sb):
    """Posizioni SEMPRE ricavate dai totali, come le mostra il gioco
    (pari merito "denso": 1, 2, 3, 3, 4 — vedi #91, #97, #99).
    Il VLM legge male le posizioni a pari merito (tende a scrivere 1..N) e in
    modalita' a squadre il gioco mostra "1" su tutte le righe: i totali
    invece sono validati dai checksum, quindi sono la fonte affidabile."""
    players = sb.get("players") or []
    if not players or not all(isinstance(p.get("totalScore"), int) for p in players):
        return sb, None
    totals = sorted({p["totalScore"] for p in players})
    old = [p.get("position") for p in players]
    for p in players:
        p["position"] = 1 + totals.index(p["totalScore"])
    players.sort(key=lambda p: (p["position"], p["name"]))
    new = [p["position"] for p in players]
    return sb, (f"posizioni ricalcolate dai totali: lette {old} -> {new}"
                if sorted(old, key=lambda x: (x is None, x)) != new else None)


def validate_sb(sb):
    """Errori di validazione (lista vuota = ok). Stesse regole di load_scoreboard."""
    errs = []
    known = auto.csv_roster(auto.CSV_PATH) | set(auto.FIXED_PLAYERS) | set(auto.KNOWN_EXTRA_PLAYERS)
    try:
        par = int(sb["par"])
        players = sb["players"]
    except Exception:
        return ["formato JSON non valido (servono par e players)"]
    if not players:
        errs.append("nessun giocatore")
    positions = []
    for p in players:
        name = auto.canon_player(p.get("name"))
        if name not in known:
            errs.append(f"giocatore sconosciuto {p.get('name')!r}")
        holes = p.get("holes") or []
        # meno di 18 solo se approvato a mano (partita interrotta/ridotta):
        # la lettura automatica produce sempre 18 buche
        if not 1 <= len(holes) <= 18 or not all(isinstance(h, int) and h >= 1 for h in holes):
            errs.append(f"{name}: servono da 1 a 18 buche intere >= 1 (niente 0)")
            continue
        if sum(holes) != p.get("totalScore"):
            errs.append(f"{name}: somma buche {sum(holes)} != totale {p.get('totalScore')}")
        if p.get("diffPar") is None or p.get("totalScore", 0) - par != p.get("diffPar"):
            errs.append(f"{name}: diffPar incoerente col par {par}")
        positions.append(p.get("position"))
    if players and not positions_consistent(players):
        errs.append(f"posizioni incoerenti coi totali: {positions}")
    if len({len(p.get("holes") or []) for p in players}) > 1:
        errs.append("numero di buche diverso tra i giocatori")
    names = [auto.canon_player(p.get("name")) for p in players]
    if len(set(names)) != len(names):
        errs.append(f"nomi duplicati: {names}")
    return errs


def existing_keys():
    mod = auto.lazy_integrate()
    with open(auto.TS_PATH, encoding="utf-8") as f:
        matches = mod.extract_ts_const(f.read(), "MATCHES_DATA")
    keys = {}
    for m in matches:
        if m.get("players"):
            try:
                keys[norm_sb({"par": m["totalPar"], "players": m["players"]})] = m["id"]
            except Exception:
                pass
    return keys


def mlx_python():
    cand = os.environ.get("GOLFATINE_MLX_PYTHON") or auto.MLX_PYTHON
    if not (os.path.isfile(cand) and os.access(cand, os.X_OK)):
        raise BotError(f"venv MLX assente ({cand})")
    return cand


def read_crop(crop, workdir, tag):
    out = os.path.join(workdir, f"sb_{tag}.json")
    r = subprocess.run([mlx_python(), auto.EXTRACT_SCRIPT, crop, "--out", out,
                        "--workdir", os.path.join(workdir, f"w_{tag}")],
                       capture_output=True, text=True, timeout=1800)
    data = None
    if os.path.isfile(out):
        with open(out, encoding="utf-8") as f:
            data = json.load(f)
    tail = (r.stderr or "")[-600:]
    return (data if r.returncode == 0 else None), data, tail


def consensus(crops, workdir, expected_rows=None):
    """Scoreboard accettato solo se 2 letture di frame diversi coincidono e
    il numero di giocatori letti == righe misurate in pixel nel frame.
    Ritorna (sb|None, draft|None, note)."""
    order = [crops[0]] + ([crops[-1]] if len(crops) > 1 else []) + crops[1:-1]
    seen, draft, notes = [], None, []
    for i, c in enumerate(order[:CONSENSUS_MAX_RUNS]):
        ok, raw, tail = read_crop(c["path"], workdir, str(i))
        if raw and draft is None:
            draft = raw
        if not ok:
            notes.append(f"frame {os.path.basename(c['path'])}: lettura non valida "
                         f"({tail.strip().splitlines()[-1] if tail.strip() else '?'})")
            continue
        ok, pos_note = normalize_positions(ok)
        if pos_note:
            log(f"  {pos_note}")
        errs = validate_sb(ok)
        if any(len(p.get("holes") or []) != 18 for p in ok.get("players") or []):
            errs.append("lettura automatica: servono 18 buche (meno solo a mano)")
        if expected_rows and len(ok.get("players") or []) != expected_rows:
            errs.append(f"letti {len(ok.get('players') or [])} giocatori ma nel frame "
                        f"ci sono {expected_rows} righe")
        if errs:
            draft = ok
            notes.append(f"frame {os.path.basename(c['path'])}: {'; '.join(errs)}")
            continue
        key = norm_sb(ok)
        for prev_key, prev in seen:
            if prev_key == key:
                return ok, None, f"consenso su {len(seen) + 1} letture"
        seen.append((key, ok))
        draft = ok
        log(f"  lettura {i + 1}: valida, attendo conferma da un secondo frame")
    if len(seen) == 1 and len(crops) == 1:
        return seen[0][1], None, "un solo frame disponibile (lettura valida)"
    notes.append(f"{len(seen)} letture valide ma discordanti" if seen else "nessuna lettura valida")
    return None, draft, "; ".join(notes)


# ---------------------------------------------------------- per-video
def grab(yt_id, outdir, extend=True):
    env = dict(os.environ)
    cmd = [sys.executable, GRAB_SCRIPT, "--outdir", outdir]
    if not extend:
        cmd.append("--no-extend")
    cmd += ["--", yt_id]  # gli ID possono iniziare con "-" (es. -niH7IVcdqM)
    r = subprocess.run(cmd,
                       capture_output=True, text=True, timeout=3600, env=env)
    for line in (r.stderr or "").splitlines():
        if line.startswith("[grab]"):
            log("  " + line)
    if r.returncode == 0:
        return "ok", json.loads(r.stdout.strip().splitlines()[-1])
    reason = (r.stderr or "").strip().splitlines()[-1] if r.stderr else f"exit {r.returncode}"
    return {3: "noboard", 4: "unavailable"}.get(r.returncode, "error"), reason


_ytdlp_upgraded = False


def maybe_upgrade_ytdlp():
    """yt-dlp va aggiornato spesso (YouTube cambia): una volta per giro, su errore."""
    global _ytdlp_upgraded
    if _ytdlp_upgraded:
        return False
    _ytdlp_upgraded = True
    if shutil.which("brew") and shutil.which("yt-dlp", path="/opt/homebrew/bin"):
        r = subprocess.run(["brew", "upgrade", "yt-dlp"], capture_output=True, text=True, timeout=600)
        log(f"brew upgrade yt-dlp -> exit {r.returncode}")
        return True
    return False


def save_jpeg(src, dst):
    from PIL import Image
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.open(src).convert("RGB").save(dst, "JPEG", quality=92)
    return os.path.relpath(dst, PROJECT_ROOT)


def process(c, ledger, keys, work):
    """Ritorna dict risultato; status in {accepted, duplicate, not_golfatina,
    short, needs_review, retry}."""
    yt = c["youtube_id"]
    out = os.path.join(work, yt)
    manual = os.path.join(MANUAL_DIR, f"{yt}.json")
    prev = ledger["videos"].get(yt, {})
    # 1) correzione manuale approvata
    if os.path.isfile(manual):
        with open(manual, encoding="utf-8") as f:
            man = json.load(f)
        if man.get("action") == "skip":
            return {"status": "skipped", "reason": "scartato a mano (manual action=skip)"}
        if man.get("approved"):
            sb, _note = normalize_positions({"par": man["par"], "players": man["players"]})
            errs = validate_sb(sb)
            if errs:
                return {"status": "needs_review", "reason": "manuale non valido: " + "; ".join(errs),
                        "keep_manual": True}
            return {"status": "accepted", "scoreboard": sb, "note": "scoreboard manuale approvato",
                    "frame_src": None}
        if prev.get("status") == "needs_review":
            return {"status": "needs_review", "reason": prev.get("reason", ""), "unchanged": True}
    # 2) grab
    extend = c.get("kind") != "weak"
    status, res = grab(yt, out, extend)
    if status == "error" and maybe_upgrade_ytdlp():
        status, res = grab(yt, out, extend)
    if status == "unavailable" or status == "error":
        return {"status": "retry", "reason": str(res)}
    if status == "noboard":
        if "Short" in str(res):
            return {"status": "short", "reason": str(res)}
        if c["kind"] == "weak":
            return {"status": "not_golfatina", "reason": "nessuna classifica nel video"}
        return {"status": "needs_review", "reason": f"golfatina senza classifica leggibile: {res}"}
    crops = res["crops"]
    # 3) lettura con consenso
    sb, draft, note = consensus(crops, out, res.get("rows"))
    best_crop = crops[len(crops) // 2]["path"]
    if not sb:
        return {"status": "needs_review", "reason": note, "draft": draft, "frame_src": best_crop,
                "grab": res}
    key = norm_sb(sb)
    if key in keys:
        return {"status": "duplicate", "reason": f"stessa classifica del match #{keys[key]}",
                "duplicate_of": keys[key]}
    return {"status": "accepted", "scoreboard": sb, "note": note, "frame_src": best_crop,
            "grab": res}


# -------------------------------------------------------------- review
def open_issue(yt, c, result, frame_rel, manual_rel):
    if not shutil.which("gh"):
        return None
    body = (f"Il bot non ha potuto integrare in automatico questo video.\n\n"
            f"- Video: {c['url']} ({c['channel']}, {c['date']})\n"
            f"- Titolo: {c['title']}\n"
            f"- Motivo: {result['reason']}\n")
    if frame_rel:
        body += f"\nRitaglio classifica:\n\n![classifica]({REPO_URL}/blob/main/{frame_rel}?raw=true)\n"
    body += (f"\n**Come chiudere**\n"
             f"1. Apri `{manual_rel}` (bozza gia' compilata) e correggi le celle sbagliate: "
             f"{REPO_URL}/edit/main/{manual_rel}\n"
             f"2. Imposta `\"approved\": true` e salva (commit su main).\n"
             f"3. Al giro successivo il bot lo integra e chiude questa issue.\n\n"
             f"Se non e' una golfatina da integrare: imposta `\"action\": \"skip\"`.\n")
    r = subprocess.run(["gh", "issue", "create", "--repo", REPO_URL,
                        "--title", f"[bot] Golfatina da verificare: {c['title'][:70]}",
                        "--body", body], capture_output=True, text=True, cwd=PROJECT_ROOT)
    if r.returncode == 0:
        url = r.stdout.strip().splitlines()[-1]
        log(f"  issue aperta: {url}")
        return url
    log(f"  issue non creata: {r.stderr.strip()[-300:]}")
    return None


def close_issue(url, comment):
    if url and shutil.which("gh"):
        subprocess.run(["gh", "issue", "close", url, "--comment", comment],
                       capture_output=True, text=True, cwd=PROJECT_ROOT)


def write_manual_draft(yt, c, result):
    path = os.path.join(MANUAL_DIR, f"{yt}.json")
    if os.path.isfile(path):
        return os.path.relpath(path, PROJECT_ROOT)
    draft = result.get("draft") or {}
    players = draft.get("players") or [
        {"name": "", "position": 1, "totalScore": 0, "diffPar": 0, "holes": [0] * 18}]
    doc = {"_help": "Correggi le celle, poi approved=true. action=skip per scartare il video.",
           "youtube_id": yt, "title": c["title"], "url": c["url"],
           "reason": result.get("reason"), "approved": False, "action": "",
           "par": draft.get("par"), "players": players}
    os.makedirs(MANUAL_DIR, exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(doc, f, indent=2, ensure_ascii=False)
        f.write("\n")
    return os.path.relpath(path, PROJECT_ROOT)


# --------------------------------------------------------------- run
def run(args):
    if not args.list:
        repo_prepare(pull=not args.no_pull)
    ledger = watch.load_ledger()
    cands = watch.candidates(ledger)
    # anche i needs_review con manuale approvato vanno ripresi
    seen = {c["youtube_id"] for c in cands}
    for yt, v in ledger["videos"].items():
        if v.get("status") == "needs_review" and yt not in seen:
            mp = os.path.join(MANUAL_DIR, f"{yt}.json")
            if os.path.isfile(mp):
                with open(mp, encoding="utf-8") as f:
                    man = json.load(f)
                if man.get("approved") or man.get("action") == "skip":
                    # nel ledger l'ID e' la chiave, non un campo
                    cands.append({"youtube_id": yt, **{k: v[k] for k in (
                        "title", "channel", "published", "date", "url", "kind") if k in v}})
                    seen.add(yt)
    if args.only:
        cands = [c for c in cands if c["youtube_id"] in args.only]
    if args.skip_weak:
        cands = [c for c in cands if c["kind"] == "strong"]
    if args.limit:
        cands = cands[:args.limit]
    log(f"{len(cands)} candidati: " + ", ".join(f"{c['youtube_id']}({c['kind'][0]})" for c in cands))
    if args.list or not cands:
        for c in cands:
            print(f"  {c['published'][:16]} {c['kind']:6} {c['channel']:13} {c['youtube_id']} {c['title'][:70]}")
        return 0

    keys = existing_keys()
    work = tempfile.mkdtemp(prefix="golfatine_bot_")
    accepted, reviews, closed = [], [], []
    now = dt.datetime.now().isoformat(timespec="seconds")
    try:
        for c in cands:
            yt = c["youtube_id"]
            log(f"▶ {c['date']} {c['channel']} {yt} [{c['kind']}] {c['title'][:70]}")
            try:
                r = process(c, ledger, keys, work)
            except BotError as e:
                r = {"status": "retry", "reason": str(e)[-500:]}
            prev = ledger["videos"].get(yt, {})
            entry = {k: c.get(k) for k in ("title", "channel", "published", "date", "url", "kind")}
            entry.update({"status": r["status"], "reason": r.get("reason") or r.get("note"),
                          "checked_at": now})
            if prev.get("issue"):
                entry["issue"] = prev["issue"]
            if r["status"] == "retry":
                entry["attempts"] = prev.get("attempts", 0) + 1
                if entry["attempts"] >= MAX_RETRY:
                    r = {"status": "needs_review", "reason": f"{entry['attempts']} tentativi falliti: {r['reason']}"}
                    entry["status"], entry["reason"] = r["status"], r["reason"]
            log(f"  -> {entry['status']}: {entry['reason']}")
            if r["status"] == "accepted":
                key = norm_sb(r["scoreboard"])
                keys[key] = f"nuovo {yt}"
                accepted.append((c, r, entry))
            elif r["status"] == "needs_review" and not r.get("unchanged"):
                frame_rel = save_jpeg(r["frame_src"], os.path.join(REVIEW_DIR, f"{yt}.jpg")) \
                    if r.get("frame_src") else None
                manual_rel = write_manual_draft(yt, c, r)
                entry.update({"frame": frame_rel, "manual": manual_rel})
                reviews.append((c, r, entry, frame_rel, manual_rel))
            elif r["status"] == "needs_review":
                entry = {**prev, "checked_at": now}
            elif r["status"] == "skipped":
                closed.append((entry.get("issue"), "Scartato a mano (action=skip)."))
            ledger["videos"][yt] = entry

        msg_parts = []
        if accepted:
            accepted.sort(key=lambda t: (t[0]["published"], t[0]["youtube_id"]))
            base = max(max(auto.csv_ids(auto.CSV_PATH)), max(auto.ts_ids(auto.TS_PATH)))
            new_info, sbs = {}, {}
            for i, (c, r, entry) in enumerate(accepted, 1):
                mid = base + i
                _t, channel = auto.oembed_channel(c["youtube_id"])
                if channel not in auto.KNOWN_CHANNELS:
                    raise BotError(f"canale oEmbed sconosciuto {channel!r} per {c['youtube_id']}")
                new_info[mid] = {"title": c["title"], "date": c["date"], "url": c["url"],
                                 "youtube_id": c["youtube_id"], "channel": channel}
                tmp = os.path.join(work, f"sb_final_{mid}.json")
                with open(tmp, "w", encoding="utf-8") as f:
                    json.dump(r["scoreboard"], f)
                sbs.update(auto.load_scoreboard(tmp, [mid]))
                entry.update({"status": "integrated", "match_id": mid})
                rp = os.path.join(REVIEW_DIR, f"{c['youtube_id']}.jpg")
                src = r.get("frame_src") or (rp if os.path.isfile(rp) else None)
                if src:
                    entry["frame"] = save_jpeg(src, os.path.join(
                        FRAMES_DIR, f"{mid:03d}-{c['youtube_id']}.jpg"))
                mp = os.path.join(MANUAL_DIR, f"{c['youtube_id']}.json")
                for leftover in (mp, rp):
                    if os.path.isfile(leftover):
                        os.remove(leftover)
                entry.pop("manual", None)
                if entry.get("issue"):
                    closed.append((entry["issue"], f"Integrata come golfatina #{mid}."))
                log(f"  #{mid} = {c['youtube_id']} {c['title'][:60]}")
            summary = auto.integrate_matches(new_info, sbs)
            ids = sorted(new_info)
            auto.update_hardcoded(ids, {i: new_info[i]["channel"] for i in ids},
                                  max(v["date"] for v in new_info.values()), summary)
            if not args.no_forecast:
                auto.run_forecast(summary["totalVideos"] + 1)
            auto.run_checks()
            n = max(ids)
            if len(ids) == 1:
                msg_parts.append(f"feat: golfatina #{n} – {new_info[n]['title']} "
                                 f"({new_info[n]['date']}) + forecast TimesFM #{n + 1}")
            else:
                msg_parts.append(f"feat: golfatine #{min(ids)}-#{n} ({len(ids)} video) "
                                 f"+ forecast TimesFM #{n + 1}")
        if reviews:
            msg_parts.append(f"chore(bot): {len(reviews)} video da verificare a mano")
        watch.save_ledger(ledger)
        if args.no_commit:
            log("--no-commit: modifiche lasciate nel working tree")
        else:
            msg = msg_parts[0] if msg_parts else "chore(bot): aggiorna ledger video"
            if len(msg_parts) > 1:
                msg += "\n\n" + "\n".join(msg_parts[1:])
            pushed = commit_push(msg, push=not args.no_push)
            if pushed and not args.no_push:
                for c, r, entry, frame_rel, manual_rel in reviews:
                    if not entry.get("issue"):
                        entry["issue"] = open_issue(c["youtube_id"], c, r, frame_rel, manual_rel)
                for url, comment in closed:
                    close_issue(url, comment)
                if any(e.get("issue") for *_x, e, _f, _m in reviews):
                    watch.save_ledger(ledger)
                    commit_push("chore(bot): link issue nel ledger", push=True)
        if accepted:
            notify("Golfatine aggiornate",
                   f"{len(accepted)} nuove: " + ", ".join(f"#{e['match_id']}" for *_x, e in accepted))
        if reviews:
            notify("Golfatine da verificare", f"{len(reviews)} video richiedono un controllo (Issue GitHub)")
        return 0
    except BotError:
        if not args.no_commit:
            repo_reset()
        raise
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description="Bot golfatine YouTube -> sito (vedi docstring).")
    ap.add_argument("--list", action="store_true", help="mostra solo i candidati")
    ap.add_argument("--only", nargs="*", default=None, help="solo questi youtube id")
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--skip-weak", action="store_true", help="ignora i candidati senza 'golf' nel titolo")
    ap.add_argument("--no-forecast", action="store_true")
    ap.add_argument("--no-commit", action="store_true")
    ap.add_argument("--no-push", action="store_true")
    ap.add_argument("--no-pull", action="store_true")
    args = ap.parse_args(argv)
    os.makedirs(os.path.dirname(LOCK_PATH), exist_ok=True)
    lock = open(LOCK_PATH, "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log("altro giro in corso, esco")
        return 0
    started = time.time()
    try:
        rc = run(args)
    except BotError as e:
        log(f"ERRORE: {e}")
        notify("Bot golfatine: errore", str(e)[:180])
        rc = 1
    log(f"fine giro ({time.time() - started:.0f}s), exit {rc}")
    return rc


if __name__ == "__main__":
    sys.exit(main())
