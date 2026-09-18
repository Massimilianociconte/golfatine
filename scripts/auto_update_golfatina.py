#!/usr/bin/env python3
"""Pipeline automatizzata: nuova golfatina da DOCX/PDF -> sito -> forecast -> commit/push.

Replica integralmente la regola di root `AGENTS.md` in un unico comando:

    python3 scripts/auto_update_golfatina.py [--yes] [--scoreboard FILE.json]
    npm run update:golfatina -- --yes --scoreboard /tmp/sb89.json

Passi eseguiti (gli stessi sempre):
  1. Riverifica DOCX + PDF (titolo, data, link) vs CSV vs golfatineData.ts.
     Se l'ultimo video e' gia' integrato -> solo riverifica, nessuna modifica.
  2. Estrae titolo/data/link del video nuovo; verifica il canale publisher
     via oEmbed (mai dedotto dal titolo).
  3. Estrae dallo .docx l'ultimo screenshot classifica e lo trascrive da solo
     col VLM locale (Qwen2.5-VL-3B su MLX, scripts/extract_scoreboard.py):
     validazione checksum per riga (sum==totale), retry su terzi/celle,
     mai indovinare (fallback: draft + abort).
     Flag --scoreboard per fornire lo scoreboard a mano, --no-extract per
     saltare il VLM.
  4. Integra MATCHES_DATA + golfatine_clean.csv e ricalcola PLAYERS_DATA,
     H2H_DATA, GLOBAL_SUMMARY (stessa logica di integrate_golfatine_62_82.py).
  5. Aggiorna gli hardcoded (GolfatineGrid, channels.ts, tests, NEXT_MATCH_NUMBER).
  6. Rigenera il forecast TimesFM-3.0 con il venv di Documents/prediction e lo valida.
  7. Verifica con `npm test` + `npx tsc --noEmit`.
  8. Commit + push su main (mai .env*/pycache) -> Vercel redeploy automatico.

Formato --scoreboard (singolo video nuovo):
  {"par": 45, "players": [
    {"name": "Mollu", "position": 1, "totalScore": 47, "diffPar": 2,
     "holes": [2,4,3,1,1,2,2,2,2,3,1,3,4,2,3,5,2,5]}, ... ]}
Con piu' video nuovi: {"89": {...}, "90": {...}} (chiave = id, valore come sopra).
"""

import argparse
import csv
import json
import os
import re
import shutil
import subprocess
import sys
import time
import urllib.request
import zipfile

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DOCX_PATH = os.path.join(PROJECT_ROOT, "lista-golfatine.docx")
PDF_PATH = os.path.join(PROJECT_ROOT, "Lista-golfatine.pdf")
CSV_PATH = os.path.join(PROJECT_ROOT, "golfatine_clean.csv")
TS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "golfatineData.ts")
FORECAST_TS = os.path.join(PROJECT_ROOT, "src", "data", "forecastingData.ts")
FORECAST_SCRIPT = os.path.join(PROJECT_ROOT, "scripts", "generate_forecast_timesfm.py")
GRID_PATH = os.path.join(PROJECT_ROOT, "src", "components", "GolfatineGrid.tsx")
CHANNELS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "channels.ts")
TESTS_PATH = os.path.join(PROJECT_ROOT, "tests", "golfatineData.test.ts")
PREDICTION_PYTHON = "/Users/massimilianociconte/Documents/prediction/.venv/bin/python"
MLX_PYTHON = os.path.join(PROJECT_ROOT, ".venv-mlx", "bin", "python")
EXTRACT_SCRIPT = os.path.join(PROJECT_ROOT, "scripts", "extract_scoreboard.py")
PDF2MD_CANDIDATES = [
    shutil.which("pdf2md") or "",
    "/Users/massimilianociconte/.cargo/bin/pdf2md",
    os.path.expanduser("~/.cargo/bin/pdf2md"),
]

KNOWN_CHANNELS = {"GaBBoDSQ", "Delux", "Just Rohn JR", "Around Dread",
                  "oessaM", "Mollu", "JTaz Extra"}
MONTHS = {"gennaio": "01", "febbraio": "02", "marzo": "03", "aprile": "04",
          "maggio": "05", "giugno": "06", "luglio": "07", "agosto": "08",
          "settembre": "09", "ottobre": "10", "novembre": "11", "dicembre": "12"}
YOUTUBE_RE = re.compile(r"(?:https?://)?(?:www\.)?(?:youtu\.be/|youtube\.com/watch\?[^ ]*?v=)([A-Za-z0-9_-]{6,})")
DATE_RE = re.compile(r"(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)\s+(\d{4})", re.IGNORECASE)
DATE_NOYEAR_RE = re.compile(r"(\d{1,2})\s+(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?!\s+\d{4})", re.IGNORECASE)
DEFAULT_YEAR = "2026"

KNOWN_DUPLICATE_YT = {"efppNZh_4UA"}  # #79 = duplicato del video #30
COMMIT_FILES = ["golfatine_clean.csv", "lista-golfatine.docx", "Lista-golfatine.pdf",
                 "scripts/generate_forecast_timesfm.py",
                "scripts/extract_scoreboard.py",
                "src/components/GolfatineGrid.tsx", "src/data/channels.ts",
                "src/data/forecastingData.ts", "src/data/golfatineData.ts",
                "tests/golfatineData.test.ts", "scripts/auto_update_golfatina.py",
                "package.json"]


def all_youtube_ids(text):
    return {m.group(1).split("?")[0].split("&")[0].split(" ")[0]
            for m in YOUTUBE_RE.finditer(text)}


def log(msg):
    print(f"[golfatina] {msg}", flush=True)


def fail(msg):
    print(f"[golfatina] ERRORE: {msg}", file=sys.stderr, flush=True)
    sys.exit(1)


def run(cmd, cwd=PROJECT_ROOT, capture=False):
    log("$ " + " ".join(cmd))
    r = subprocess.run(cmd, cwd=cwd, capture_output=capture, text=True)
    if r.returncode != 0:
        if capture:
            print(r.stdout[-3000:], file=sys.stderr)
            print(r.stderr[-3000:], file=sys.stderr)
        fail(f"comando fallito (exit {r.returncode}): {' '.join(cmd)}")
    return r.stdout if capture else ""


# ---------------------------------------------------------------- sorgenti
def docx_raw_text(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
    return " ".join(re.findall(r"<w:t[^>]*>(.*?)</w:t>", xml, re.DOTALL))


def parse_entries(text):
    """Estrae {num, title, date_iso, url, youtube_id} in ordine di documento."""
    text = re.sub(r"\s+", " ", text).replace("&amp;", "&")
    marks = list(re.finditer(r"(?:^|\s)(\d{1,3})\.\s", text))
    entries = []
    for i, m in enumerate(marks):
        num = int(m.group(1))
        seg = text[m.end():marks[i + 1].start() if i + 1 < len(marks) else len(text)]
        um = YOUTUBE_RE.search(seg)
        if not um:
            continue
        url = um.group(0)
        if not url.startswith("http"):
            url = "https://" + url
        yt = um.group(1).split("?")[0].split("&")[0].split(" ")[0]
        dm = DATE_RE.search(seg)
        date_iso = None
        if dm:
            date_iso = f"{dm.group(3)}-{MONTHS[dm.group(2).lower()]}-{int(dm.group(1)):02d}"
        else:
            dn = DATE_NOYEAR_RE.search(seg)
            if dn:
                date_iso = f"{DEFAULT_YEAR}-{MONTHS[dn.group(2).lower()]}-{int(dn.group(1)):02d}"
        title = seg[:um.start()]
        if dm:
            title = title.replace(dm.group(0), " ")
        else:
            dn2 = DATE_NOYEAR_RE.search(title)
            if dn2:
                title = title.replace(dn2.group(0), " ")
        title = re.sub(r"\s+", " ", re.sub(r"^(Canale:\s*\S+\s*)?", "", title)).strip(" -–—|")
        entries.append({"num": num, "title": title.strip(), "date": date_iso,
                        "url": f"https://youtu.be/{yt}", "youtube_id": yt})
    dedup = {}
    for e in entries:
        dedup[e["num"]] = e  # un numero puo' comparire sia in tabella che nel testo
    return [dedup[k] for k in sorted(dedup)]


def pdf_raw_text(path):
    for cand in PDF2MD_CANDIDATES:
        if cand and os.path.isfile(cand) and os.access(cand, os.X_OK):
            r = subprocess.run([cand, path, "--compact", "--pages"],
                               capture_output=True, text=True)
            if r.returncode == 0 and r.stdout.strip():
                return r.stdout
            log(f"pdf2md fallito ({cand}), uso solo DOCX")
            return None
    log("pdf2md non trovato, uso solo DOCX come sorgente")
    return None


def csv_ids(path):
    with open(path, encoding="utf-8") as f:
        return sorted({int(r["match_id"]) for r in csv.DictReader(f)})


def ts_ids(path):
    with open(path, encoding="utf-8") as f:
        src = f.read()
    return sorted({int(x) for x in re.findall(r'"id":\s*(\d+)', src)})


def oembed_channel(youtube_id):
    url = f"https://www.youtube.com/oembed?url=https://youtu.be/{youtube_id}&format=json"
    try:
        with urllib.request.urlopen(url, timeout=20) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        fail(f"oEmbed irraggiungibile per {youtube_id}: {e}")
    return data.get("title", ""), data.get("author_name", "")


# --------------------------------------------------------------- scoreboard
def docx_embed_order(path):
    with zipfile.ZipFile(path) as z:
        xml = z.read("word/document.xml").decode("utf-8", errors="ignore")
        rels = z.read("word/_rels/document.xml.rels").decode("utf-8", errors="ignore")
    rmap = dict(re.findall(r'Id="(rId\d+)"[^>]*Target="([^"]+)"', rels))
    return [rmap[e] for e in re.findall(r'r:embed="(rId\d+)"', xml) if e in rmap]


def extract_latest_image(docx_path, outdir):
    ordered = [p for p in docx_embed_order(docx_path) if p.startswith("media/")]
    if not ordered:
        fail("nessuna immagine in word/media/*.png dentro il .docx")
    latest = ordered[-1]
    os.makedirs(outdir, exist_ok=True)
    with zipfile.ZipFile(docx_path) as z:
        data = z.read("word/" + latest)
    ext = os.path.splitext(latest)[1] or ".png"
    out = os.path.join(outdir, "scoreboard_ultima" + ext)
    with open(out, "wb") as f:
        f.write(data)
    log(f"screenshot classifica (ultimo embed: {latest}) -> {out} "
        f"({len(ordered)} immagini totali; --image per usarne un'altra)")
    return out


def ocr_draft(image_path):
    t = shutil.which("tesseract")
    if not t:
        log("tesseract assente: trascrizione manuale dello screenshot richiesta")
        return
    r = subprocess.run([t, image_path, "stdout", "--psm", "6", "-l", "ita+eng"],
                       capture_output=True, text=True)
    print("---- bozza OCR (da verificare a mano) ----")
    print(r.stdout[:3000] if r.returncode == 0 else "(OCR fallito: trascrivere a mano)")
    print("------------------------------------------")


def load_scoreboard(path, new_ids):
    with open(path, encoding="utf-8") as f:
        sb = json.load(f)
    if set(sb.keys()) == set(map(str, new_ids)) | {"par", "players"} and len(new_ids) == 1:
        pass  # singolo video: {"par":..,"players":[...]}
    elif all(str(i) in sb for i in new_ids):
        sb = {i: sb[str(i)] for i in new_ids}
        single = None
    else:
        single = sb
        sb = None
    out = {}
    items = [(new_ids[0], single)] if sb is None else sb.items()
    for mid, entry in items:
        par = int(entry["par"])
        rows = []
        for p in entry["players"]:
            holes = [int(h) for h in p["holes"]]
            if len(holes) != 18:
                fail(f"match {mid} {p['name']}: attese 18 buche, trovate {len(holes)}")
            if sum(holes) != int(p["totalScore"]):
                fail(f"match {mid} {p['name']}: sum(buche)={sum(holes)} != totale={p['totalScore']}")
            if int(p["totalScore"]) - par != int(p["diffPar"]):
                fail(f"match {mid} {p['name']}: diff_par incoerente")
            rows.append({"giocatore": p["name"], "posizione": int(p["position"]),
                         "punteggio_totale": int(p["totalScore"]),
                         "diff_par": int(p["diffPar"]), "holes": holes})
        out[int(mid)] = {"par": par, "rows": rows}
    return out


# -------------------------------------------------------------- integrazione
def lazy_integrate():
    sys.path.insert(0, os.path.join(PROJECT_ROOT, "scripts"))
    import integrate_golfatine_62_82 as mod
    return mod


def integrate_matches(new_info, scoreboards):
    """new_info: {id: entry(docx)+channel}; scoreboards: {id: {par, rows}}."""
    mod = lazy_integrate()
    with open(TS_PATH, encoding="utf-8") as f:
        src = f.read()
    players_data = mod.extract_ts_const(src, "PLAYERS_DATA")
    old_matches = mod.extract_ts_const(src, "MATCHES_DATA")
    have_yt = {m.get("youtubeId") for m in old_matches}
    built = []
    for mid in sorted(new_info):
        info = new_info[mid]
        if info["youtube_id"] in have_yt:
            fail(f"match {mid}: youtubeId {info['youtube_id']} gia' presente")
        players = [{"name": r["giocatore"], "position": r["posizione"],
                    "totalScore": r["punteggio_totale"], "diffPar": r["diff_par"],
                    "holes": r["holes"]} for r in scoreboards[mid]["rows"]]
        m = mod.enrich_match({"id": mid, "date": info["date"], "title": info["title"],
                              "url": info["url"], "youtubeId": info["youtube_id"],
                              "channel": info["channel"],
                              "totalPar": scoreboards[mid]["par"], "players": players})
        log(f"#{mid} {info['title']} ({info['date']}) [{info['channel']}] "
            f"vince {m['winner']} ({m['winningDiffPar']:+d}), HIO={m['totalHIOs']}, max={m['maxHoleScore']}")
        built.append(m)
        have_yt.add(info["youtube_id"])
    matches = sorted(old_matches + built, key=lambda m: m["id"])
    matches = [mod.order_match_keys(m) for m in matches]
    players_data = mod.recompute_player_stats(players_data, matches)
    h2h = mod.recompute_h2h(players_data, matches)
    summary = {
        "totalMatches": len(matches),
        "totalVideos": max(m["id"] for m in matches),
        "totalScorecards": sum(len(m["players"]) for m in matches),
        "totalHolesPlayed": sum(p["totalHoles"] for p in players_data.values()),
        "totalHIOs": sum(p["totalHIOs"] for p in players_data.values()),
        "totalDisasters": sum(p["totalDisasters"] for p in players_data.values()),
        "mostWinsPlayer": max(players_data.values(), key=lambda p: p["wins"])["name"],
        "bestDiffParRecord": min(m["winningDiffPar"] for m in matches),
        "worstScoreRecord": max(p["worstScore"] for p in players_data.values()),
    }
    dump = lambda o: json.dumps(o, indent=2, ensure_ascii=False)
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(mod.TS_TEMPLATE.format(summary=dump(summary), players=dump(players_data),
                                       h2h=dump(h2h), matches=dump(matches)))
    log(f"golfatineData.ts: {summary['totalMatches']} match, "
        f"{summary['totalVideos']} video, {summary['totalScorecards']} scorecard")

    with open(CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    if any(int(r["match_id"]) in new_info for r in rows):
        fail("golfatine_clean.csv contiene gia' uno dei nuovi match")
    for mid in sorted(new_info):
        info = new_info[mid]
        for r in scoreboards[mid]["rows"]:
            out = {k: "" for k in fieldnames}
            out.update({"match_id": str(mid), "data_video": info["date"],
                        "titolo_video": info["title"], "url_video": info["url"],
                        "par_totale": str(scoreboards[mid]["par"]),
                        "posizione": str(r["posizione"]), "giocatore": r["giocatore"],
                        "punteggio_totale": str(r["punteggio_totale"]),
                        "diff_par": str(r["diff_par"])})
            for i, v in enumerate(r["holes"], 1):
                out[f"b{i}"] = str(v)
            rows.append(out)
    rows.sort(key=lambda r: (int(r["match_id"]), int(r["posizione"])))
    with open(CSV_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(rows)
    log(f"golfatine_clean.csv: {len(rows)} righe (+{sum(len(scoreboards[i]['rows']) for i in new_info)})")
    return summary


def sub_file(path, pattern, repl, desc):
    with open(path, encoding="utf-8") as f:
        src = f.read()
    new, n = re.subn(pattern, repl, src)
    if n == 0:
        fail(f"{desc}: pattern non trovato in {os.path.basename(path)} (formato cambiato?)")
    with open(path, "w", encoding="utf-8") as f:
        f.write(new)
    log(f"{desc}: {n} sostituzione/i in {os.path.basename(path)}")


def update_hardcoded(new_ids, channels, last_date, summary):
    n = max(new_ids + [summary["totalVideos"]])
    m = summary["totalMatches"]
    sub_file(GRID_PATH, r"\d+ episodi ufficiali #1–#\d+",
             f"{n} episodi ufficiali #1–#{n}", "contatore episodi")
    sub_file(GRID_PATH, r"official episodes are #1–#\d+",
             f"official episodes are #1–#{n}", "commento episodi")
    sub_file(GRID_PATH, r"Numerazione ufficiale episodi #1–#\d+",
             f"Numerazione ufficiale episodi #1–#{n}", "nota numerazione")
    sub_file(GRID_PATH, r"• \d+ scorecard complete", f"• {m} scorecard complete",
             "contatore scorecard")
    sub_file(CHANNELS_PATH, r"tutti gli \d+ video al \d{4}-\d{2}-\d{2}",
             f"tutti gli {n} video al {last_date}", "commento canali")

    with open(TESTS_PATH, encoding="utf-8") as f:
        tsrc = f.read()
    em = re.search(r"for \(const expected of \[([\d,\s]+)\]\)", tsrc)
    if not em:
        fail("lista expected assente nei test")
    have = sorted({int(x) for x in re.findall(r"\d+", em.group(1))} | set(new_ids))
    tsrc = tsrc[:em.start(1)] + ", ".join(map(str, have)) + tsrc[em.end(1):]
    with open(TESTS_PATH, "w", encoding="utf-8") as f:
        f.write(tsrc)
    log(f"test expected ids: +{sorted(new_ids)}")
    sub_file(TESTS_PATH, r"golfatine 62-\d+ integration",
             f"golfatine 62-{n} integration", "titolo suite test")
    sub_file(TESTS_PATH, r"has \d+ scorecards with official numbering",
             f"has {m} scorecards with official numbering", "titolo conteggio test")
    sub_file(TESTS_PATH, r"totalMatches\)\.toBe\(\d+\)",
             f"totalMatches).toBe({summary['totalMatches']})", "test totalMatches")
    sub_file(TESTS_PATH, r"totalVideos\)\.toBe\(\d+\)",
             f"totalVideos).toBe({summary['totalVideos']})", "test totalVideos")
    sub_file(TESTS_PATH, r"totalScorecards\)\.toBe\(\d+\)",
             f"totalScorecards).toBe({summary['totalScorecards']})", "test totalScorecards")
    fl = re.search(r"for \(const vid of \[([\d,\s]+)\]\)", tsrc)
    if fl:
        have2 = sorted({int(x) for x in re.findall(r"\d+", fl.group(1))} | set(new_ids))
        sub_file(TESTS_PATH, r"for \(const vid of \[[\d,\s]+\]\)",
                 f"for (const vid of [{', '.join(map(str, have2))}])",
                 "test scorecard complete")
    for mid in sorted(new_ids):
        with open(TESTS_PATH, encoding="utf-8") as f:
            cur = f.read()
        if f"byId.get({mid})" not in cur:
            anchor = "expect(byId.get(88)?.channel).toBe('Mollu');"
            ins = anchor + f"\n    expect(byId.get({mid})?.channel).toBe('{channels[mid]}');"
            if anchor in cur:
                cur = cur.replace(anchor, ins)
            else:
                anchor2 = "expect(byId.get(87)?.channel).toBe('Just Rohn JR');"
                cur = cur.replace(anchor2, anchor2 + f"\n    expect(byId.get({mid})?.channel).toBe('{channels[mid]}');")
            with open(TESTS_PATH, "w", encoding="utf-8") as f:
                f.write(cur)
            log(f"test spot-check canale #{mid} = {channels[mid]}")
    sub_file(TESTS_PATH, r"forecasts match #\d+",
             f"forecasts match #{n + 1}", "titolo test forecast")
    sub_file(TESTS_PATH, r"matchNumber\)\.toBe\(\d+\)",
             f"matchNumber).toBe({n + 1})", "test matchNumber forecast")
    sub_file(FORECAST_SCRIPT, r"NEXT_MATCH_NUMBER\s*=\s*\d+",
             f"NEXT_MATCH_NUMBER = {n + 1}", "NEXT_MATCH_NUMBER")


# ------------------------------------------------------------------ forecast
def run_forecast(expected_match):
    if not (os.path.isfile(PREDICTION_PYTHON) and os.access(PREDICTION_PYTHON, os.X_OK)):
        fail(f"venv prediction assente: {PREDICTION_PYTHON}")
    run([PREDICTION_PYTHON, FORECAST_SCRIPT])
    with open(FORECAST_TS, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"UPCOMING_MATCH_FORECAST[^=]*= (\{.*?\});", src, re.DOTALL)
    if not m:
        fail("UPCOMING_MATCH_FORECAST non trovato dopo il forecast")
    d = json.loads(m.group(1))
    if d["matchNumber"] != expected_match:
        fail(f"forecast #{d['matchNumber']} != atteso #{expected_match}")
    s = sum(p["winProbabilityPercent"] for p in d["playersForecast"])
    if not (99 < s < 101):
        fail(f"somma winProb = {s}, attesa ~100")
    for p in d["playersForecast"]:
        if not (p["q10DiffPar"] <= p["predictedDiffPar"] <= p["q90DiffPar"]):
            fail(f"quantili incoerenti per {p['playerName']}")
        if len(p["predictedHoles"]) != 18:
            fail(f"predictedHoles != 18 per {p['playerName']}")
    log(f"forecast #{expected_match}: winProb somma={s:.1f}, {len(d['playersForecast'])} giocatori OK")


# -------------------------------------------------------------------- verifica
def run_checks():
    run(["npm", "test"])
    run(["npx", "tsc", "--noEmit"])


# ---------------------------------------------------------------- commit/push
def commit_push(new_ids, titles):
    r = subprocess.run(["git", "branch", "--show-current"], cwd=PROJECT_ROOT,
                       capture_output=True, text=True)
    if r.stdout.strip() != "main":
        fail("branch corrente non e' main: commit/push annullati")
    if subprocess.run(["git", "diff", "--quiet"], cwd=PROJECT_ROOT).returncode == 0 \
            and not subprocess.run(["git", "status", "--porcelain", *COMMIT_FILES],
                                   cwd=PROJECT_ROOT, capture_output=True,
                                   text=True).stdout.strip():
        log("nessuna modifica da committare")
        return
    run(["git", "add"] + COMMIT_FILES)
    status = subprocess.run(["git", "status", "--porcelain"], cwd=PROJECT_ROOT,
                            capture_output=True, text=True).stdout
    if re.search(r"\.env(\.|$|\s)", status):
        fail("file .env* nello stage: rifiuto il commit")
    n = max(new_ids)
    # titolo commit in formato AGENTS.md: feat: golfatina #N – <TITOLO> (<DATA>) + forecast TimesFM #N+1
    info_dates = commit_push.dates
    msg = f"feat: golfatina #{n} – {titles[n]} ({info_dates[n]}) + forecast TimesFM #{n + 1}"
    if len(new_ids) > 1:
        msg = (f"feat: golfatine #{min(new_ids)}-#{n} "
               f"({len(new_ids)} video) + forecast TimesFM #{n + 1}")
    run(["git", "commit", "-m", msg])
    run(["git", "push", "origin", "main"])
    log("push su main completato -> redeploy Vercel automatico via integrazione GitHub")


# ------------------------------------------------------------------- pipeline
def riverifica():
    if not os.path.isfile(DOCX_PATH):
        fail("lista-golfatine.docx assente")
    docx_text = docx_raw_text(DOCX_PATH)
    doc_entries = parse_entries(docx_text)
    if not doc_entries:
        fail("nessun video parsato dal DOCX")
    pdf_entries, pdf_text = [], None
    if os.path.isfile(PDF_PATH):
        pdf_text = pdf_raw_text(PDF_PATH)
        if pdf_text:
            pdf_entries = parse_entries(pdf_text)
    csv_max = csv_ids(CSV_PATH)
    ts_max = ts_ids(TS_PATH)
    log(f"DOCX: {len(doc_entries)} voci numerate, ultimo #{doc_entries[-1]['num']} "
        f"({doc_entries[-1]['date']}) {doc_entries[-1]['url']}")
    if pdf_entries:
        log(f"PDF:  {len(pdf_entries)} voci numerate, ultimo #{pdf_entries[-1]['num']} "
            f"({pdf_entries[-1]['date']}) {pdf_entries[-1]['url']}")
    else:
        log("PDF: non confrontabile (pdf2md assente o fallito)")
    log(f"CSV: max #{max(csv_max)} ({len(csv_max)} id) | TS: max #{max(ts_max)}")
    # Controllo indipendente dalla numerazione: tutti gli URL dei documenti
    # devono esistere nei dati (a parte i duplicati noti e le nuove voci
    # numerate oltre max(CSV,TS), che sono proprio quelle da integrare).
    with open(TS_PATH, encoding="utf-8") as f:
        ts_yt = set(re.findall(r'"youtubeId":\s*"([^"]+)', f.read()))
    doc_yt = all_youtube_ids(docx_text)
    if pdf_text:
        doc_yt |= all_youtube_ids(pdf_text)
    last_known = max(max(csv_max), max(ts_max))
    new_numbered_yt = {e["youtube_id"] for e in doc_entries if e["num"] > last_known}
    missing = sorted(doc_yt - ts_yt - KNOWN_DUPLICATE_YT - new_numbered_yt)
    if missing:
        fail(f"URL nei documenti ma assenti nei dati: {missing} "
             "(aggiungere la voce numerata nel DOCX o estendere KNOWN_DUPLICATE_YT)")
    pending = sorted(doc_yt - ts_yt - KNOWN_DUPLICATE_YT)
    if pending:
        log(f"nuovi URL da integrare: {pending}")
    else:
        log(f"URL documenti: {len(doc_yt)} tutti presenti nei dati OK")
    return doc_entries, pdf_entries, csv_max, ts_max


def run_pipeline(args):
    doc_entries, pdf_entries, csv_max, ts_max = riverifica()
    doc_by_num = {e["num"]: e for e in doc_entries}
    last_doc = doc_entries[-1]["num"]
    last_known = max(max(csv_max), max(ts_max))
    new_ids = [i for i in range(last_known + 1, last_doc + 1) if i in doc_by_num]
    if not new_ids:
        log(f"già aggiornato: ultimo DOCX/PDF #{last_doc} già in MATCHES_DATA + CSV. Solo riverifica.")
        if args.verify:
            run_checks()
        return 0

    log(f"nuovi video da integrare: {new_ids}")
    new_info = {}
    for mid in new_ids:
        e = doc_by_num[mid]
        if not e["date"] or not e["youtube_id"]:
            fail(f"#{mid}: titolo/data/link incompleti nel DOCX ({e})")
        if pdf_entries:
            p = next((x for x in pdf_entries if x["num"] == mid), None)
            if not p:
                log(f"avviso: #{mid} assente nel PDF (uso DOCX)")
            elif p["youtube_id"] != e["youtube_id"]:
                fail(f"#{mid}: mismatch DOCX {e['youtube_id']} vs PDF {p['youtube_id']}")
        title, channel = oembed_channel(e["youtube_id"])
        if channel not in KNOWN_CHANNELS:
            fail(f"#{mid}: canale oEmbed sconosciuto: {channel!r}")
        final_title = e["title"] or title
        log(f"#{mid} {final_title} ({e['date']}) {e['url']} canale={channel}")
        new_info[mid] = {"title": final_title, "date": e["date"],
                         "url": e["url"], "youtube_id": e["youtube_id"],
                         "channel": channel}

    img = args.image or extract_latest_image(DOCX_PATH, "/tmp/golfatine_pipe")
    if args.ocr_draft:
        ocr_draft(img)
    if not args.scoreboard:
        if len(new_ids) != 1:
            fail(f"{len(new_ids)} video nuovi: estrazione automatica supportata per un video alla volta "
                 f"(passa --scoreboard JSON mappato per id, vedi docstring)")
        if args.no_extract:
            fail(f"serve --scoreboard FILE.json (screenshot: {img})")
        if not (os.path.isfile(MLX_PYTHON) and os.access(MLX_PYTHON, os.X_OK)):
            fail(f"venv MLX assente: crealo con\n"
                 f"  python3 -m venv .venv-mlx && .venv-mlx/bin/pip install mlx-vlm pillow torchvision\n"
                 f"oppure passa --scoreboard FILE.json (screenshot: {img})")
        sb_out = f"/tmp/sb_golfatina_{new_ids[0]}.json"
        log(f"estrazione automatica scoreboard con VLM locale (MLX) da {img}…")
        r = subprocess.run([MLX_PYTHON, EXTRACT_SCRIPT, img, "--out", sb_out])
        if r.returncode != 0:
            fail(f"estrazione automatica fallita: correggi il draft {sb_out} e riprova con --scoreboard {sb_out}")
        args.scoreboard = sb_out
        log(f"scoreboard auto-estratto e validato: {sb_out}")
    scoreboards = load_scoreboard(args.scoreboard, new_ids)
    log("scoreboard validati (somme e diff_par OK)")

    if not args.yes and sys.stdin.isatty():
        ans = input(f"[golfatina] integrare {new_ids} + forecast + test + commit/push? [s/N] ").strip().lower()
        if ans not in ("s", "si", "y", "yes"):
            fail("annullato dall'utente")

    summary = integrate_matches(new_info, scoreboards)
    update_hardcoded(new_ids, {i: new_info[i]["channel"] for i in new_ids},
                     max(v["date"] for v in new_info.values()), summary)
    if not args.no_forecast:
        run_forecast(summary["totalVideos"] + 1)
    run_checks()
    if not args.no_commit:
        commit_push.dates = {i: new_info[i]["date"] for i in new_ids}
        commit_push(new_ids, {i: new_info[i]["title"] for i in new_ids})
    elif not args.no_push:
        log("--no-commit: push saltato (niente da pushare senza commit)")
    log("pipeline completata")
    return 0


def self_test():
    """Verifica che i pattern degli hardcoded corrispondano ai file attuali."""
    checks = [
        (GRID_PATH, r"\d+ episodi ufficiali #1–#\d+"),
        (GRID_PATH, r"official episodes are #1–#\d+"),
        (GRID_PATH, r"Numerazione ufficiale episodi #1–#\d+"),
        (GRID_PATH, r"• \d+ scorecard complete"),
        (CHANNELS_PATH, r"tutti gli \d+ video al \d{4}-\d{2}-\d{2}"),
        (TESTS_PATH, r"for \(const expected of \[[\d,\s]+\]"),
        (TESTS_PATH, r"golfatine 62-\d+ integration"),
        (TESTS_PATH, r"forecasts match #\d+"),
        (TESTS_PATH, r"matchNumber\)\.toBe\(\d+\)"),
        (FORECAST_SCRIPT, r"NEXT_MATCH_NUMBER\s*=\s*\d+"),
    ]
    ok = True
    for path, pat in checks:
        with open(path, encoding="utf-8") as f:
            src = f.read()
        found = re.search(pat, src) is not None
        print(f"[self-test] {'OK ' if found else 'KO '} {os.path.relpath(path, PROJECT_ROOT)} :: {pat}")
        ok = ok and found
    doc_entries = parse_entries(docx_raw_text(DOCX_PATH))
    print(f"[self-test] DOCX: {len(doc_entries)} voci numerate, ultimo #{doc_entries[-1]['num']}")
    print(f"[self-test] CSV max #{max(csv_ids(CSV_PATH))} | TS max #{max(ts_ids(TS_PATH))}")
    return 0 if ok and doc_entries else 1


def main(argv=None):
    ap = argparse.ArgumentParser(description="Pipeline automatizzata nuova golfatina (vedi AGENTS.md).")
    ap.add_argument("--yes", action="store_true", help="non chiedere conferme")
    ap.add_argument("--scoreboard", default="", help="JSON con par + scorecard (vedi docstring)")
    ap.add_argument("--image", default="", help="screenshot classifica da usare (default: ultimo embed del DOCX)")
    ap.add_argument("--ocr-draft", action="store_true", help="stampa bozza OCR dello screenshot (tesseract, da verificare)")
    ap.add_argument("--no-extract", action="store_true", help="non usare il VLM locale: richiede --scoreboard manuale")
    ap.add_argument("--check", action="store_true", help="solo riverifica DOCX/PDF vs CSV/TS, nessuna modifica")
    ap.add_argument("--verify", action="store_true", help="con --check esegue anche npm test + tsc")
    ap.add_argument("--no-forecast", action="store_true", help="salta il forecast TimesFM")
    ap.add_argument("--no-commit", action="store_true", help="non committare (salta anche il push)")
    ap.add_argument("--no-push", action="store_true", help="committa ma non pushare")
    ap.add_argument("--self-test", action="store_true", help="verifica i pattern degli hardcoded, nessuna modifica")
    ap.add_argument("--watch", type=int, default=0, metavar="SEC",
                    help="resta in attesa e rilancia la pipeline quando DOCX/PDF cambiano")
    args = ap.parse_args(argv)
    if args.self_test:
        return self_test()
    if args.check:
        riverifica()
        if args.verify:
            run_checks()
        return 0
    if args.watch > 0:
        last = (os.path.getmtime(DOCX_PATH), os.path.getmtime(PDF_PATH))
        log(f"watch ogni {args.watch}s su lista-golfatine.docx / Lista-golfatine.pdf (Ctrl-C per uscire)")
        try:
            while True:
                time.sleep(args.watch)
                cur = (os.path.getmtime(DOCX_PATH), os.path.getmtime(PDF_PATH))
                if cur != last:
                    last = cur
                    log("modifica rilevata, avvio pipeline…")
                    try:
                        run_pipeline(args)
                    except SystemExit as e:
                        log(f"pipeline terminata con exit {e.code}, continuo il watch")
        except KeyboardInterrupt:
            log("watch interrotto")
            return 0
    return run_pipeline(args)


if __name__ == "__main__":
    sys.exit(main())
