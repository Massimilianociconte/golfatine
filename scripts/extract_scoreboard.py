#!/usr/bin/env python3
"""Estrae lo scoreboard classifica da uno screenshot con VLM locale su MLX.

Modello: Qwen2.5-VL-3B-Instruct-4bit (mlx-community) — il piu' leggero che
trascrive correttamente la griglia 18 buche (SmolVLM 256M/500M falliscono:
fondono le cifre adiacenti; SmolVLM2-2.2B bf16 troppo pesante a pari qualita').

Strategia a cascata (validata sullo screenshot #89: 108/108 celle):
  1. Passata full-image -> nomi/posizioni/totali + bozza 18 buche per riga.
  2. Gate di validazione per riga: len==18 e sum==totale (par: sum==par_total).
  3. Righe fallite -> terzi esatti (confini = gap inter-cella rilevati
     via analisi proiezione) ritrascritti e ricongiunti.
  4. Se restano righe invalide -> exit 2 con draft JSON + diagnosi (l'umano
     corregge solo quelle celle, mai indovinare).

Uso (con il venv MLX del repo):
  .venv-mlx/bin/python scripts/extract_scoreboard.py IMG.png --out /tmp/sb.json

Output --out (formato pipeline --scoreboard):
  {"par": 45, "players": [{"name":..,"position":..,"totalScore":..,"diffPar":..,
   "holes":[b1..b18]}, ...]}
"""

import argparse
import json
import os
import re
import sys

import numpy as np
from PIL import Image

MODEL_DEFAULT = "mlx-community/Qwen2.5-VL-3B-Instruct-4bit"

CANONICAL = {
    "justrohn": "Just Rohn", "justrohnjr": "Just Rohn",
    "justfinalmentecivedorohn": "Just Rohn",
    "delux": "Delux", "delu": "Delux",
    "nonsonodread": "nonsonodread", "dread": "nonsonodread",
    "ilmasseo": "ilMasseo", "masseo": "ilMasseo",
    "gabbo": "GaBBo", "gabb0": "GaBBo", "gab0": "GaBBo", "gabbbo": "GaBBo",
    "gabbines": "GaBBo",
    "mollu": "Mollu",
    "jtaz": "JTaz", "jtazz": "JTaz",
    "fava": "Fava",
    "justmarzaa": "Just Marzaa", "marzaa": "Just Marzaa",
    "nbayungchape": "nbayungchape",
}
# Roster reale con scoreboard (MATCHES_DATA): fallback per varianti di
# maiuscole/spazi di nomi noti non mappati sopra. Nomi mai visti passano
# invariati e la pipeline li rifiuta con fail (fail-closed: estendere qui +
# PLAYER_ALIASES/KNOWN_EXTRA_PLAYERS in auto_update_golfatina.py).
ROSTER = {"Just Rohn", "Delux", "nonsonodread", "ilMasseo", "GaBBo",
          "Mollu", "JTaz", "Fava", "Just Marzaa", "nbayungchape"}
_ROSTER_NORM = {re.sub(r"[^a-z0-9]", "", r.lower()): r for r in ROSTER}

PROMPT_FULL = (
    "You are transcribing a minigolf videogame scoreboard. Columns are holes "
    "BUCA 1 to 18. The green row is PAR. Below it are player rows, each ending "
    "with a TOTALE column. Read cell by cell, do not skip or merge cells. "
    "Output ONLY JSON, no other text: "
    '{"par": [18 ints], "par_total": int, "players": '
    '[{"name": str, "position": int, "total": int, "holes": [18 ints]}]}.'
)
# Variante corta: su alcuni screenshot il prompt lungo destabilizza il modello
PROMPT_FULL_SHORT = (
    "Read this minigolf videogame scoreboard. Columns BUCA 1-18, green row PAR, "
    "then player rows with TOTALE at right. Output ONLY JSON, no other text: "
    '{"par": [18 ints], "par_total": int, "players": '
    '[{"name": str, "position": int, "total": int, "holes": [18 ints]}]}.'
)
PROMPTS_FULL = (PROMPT_FULL, PROMPT_FULL_SHORT)
PROMPT_THIRD = 'Transcribe these numbers left to right. Output ONLY JSON: {"values": [ints]}'


def log(msg):
    print(f"[extract] {msg}", flush=True)


def parse_json(text):
    text = re.sub(r"```(?:json)?", "", text)
    m = re.search(r"\{.*\}", text, re.DOTALL)
    if not m:
        return None
    try:
        return json.loads(m.group(0))
    except Exception:
        return None


class Reader:
    def __init__(self, model):
        from mlx_vlm import load
        from mlx_vlm.prompt_utils import apply_chat_template
        from mlx_vlm.utils import load_config
        log(f"carico {model}…")
        self.model, self.processor = load(model)
        self.config = load_config(model)
        self._apply = apply_chat_template

    def ask(self, image, prompt, max_tokens, temp=0.0):
        from mlx_vlm import generate
        formatted = self._apply(self.processor, self.config, prompt,
                                num_images=1)
        # stessi default della CLI (image come lista, top_p/k/min_p espliciti)
        res = generate(self.model, self.processor, formatted, [image],
                       max_tokens=max_tokens, temperature=temp, top_p=1.0,
                       top_k=0, min_p=0.0, verbose=False)
        return res.text if hasattr(res, "text") else str(res)


def canon(name):
    key = re.sub(r"[^a-z0-9]", "", (name or "").lower())
    if key in CANONICAL:
        return CANONICAL[key]
    return _ROSTER_NORM.get(key, name)


def detect_par(arr):
    """Ritorna (y0, y1) della banda PAR verde (riga piena)."""
    h, w, _ = arr.shape
    R, G, B = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2]
    green = (G - (R + B) // 2).mean(axis=1)
    cand = np.where(green > 40)[0]
    if len(cand) == 0:
        raise RuntimeError("banda PAR non trovata")
    runs, s, p = [], cand[0], cand[0]
    for y in cand[1:]:
        if y - p > 3:
            runs.append((s, p)); s = y
        p = y
    runs.append((s, p))
    return max(runs, key=lambda r: r[1] - r[0])


def row_bands(arr, par, n):
    """Bande riga dai separatori reali: minimi locali della varianza per-riga
    nella striscia numeri (riga separatore = uniforme, riga cifre = varianza
    alta). Generico per N righe e qualsiasi risoluzione."""
    h, w, _ = arr.shape
    top = par[1]
    strip = arr[top:h, int(w * 0.30):int(w * 0.95)].mean(axis=2)
    v = strip.var(axis=1)
    content = np.where(v > 20)[0]
    if len(content) == 0:
        raise RuntimeError("nessun contenuto righe sotto il PAR")
    c0, c1 = int(content[0]) + top, int(content[-1]) + top
    # separatori = minimi di varianza FULL-width (la riga separatore e'
    # uniforme su tutta la larghezza; i gap fra cifre no)
    full = arr[top:h].mean(axis=2).var(axis=1)
    mind = max(20, h // 40)
    cands = []
    for y in range(2, len(full) - 2):
        if full[y] < 200 and full[y] == full[y - 2:y + 3].min():
            if not cands or (y + top) - cands[-1] >= mind:
                cands.append(y + top)
    seps = [s for s in cands if c0 < s < c1]
    bounds = [c0] + seps + [c1]
    if len(bounds) - 1 != n:
        # fallback: split uguale (validato poi dal gate)
        step = (c1 - c0) / n
        return [(int(c0 + i * step), int(c0 + (i + 1) * step)) for i in range(n)]
    return [(bounds[i], bounds[i + 1]) for i in range(n)]


def gap_runs(arr, y0, y1, x0f=0.28, x1f=0.995):
    """Centri-x (assoluti) e larghezze dei gap verticali nella banda."""
    h, w = arr.shape[:2]
    x0, x1 = int(w * x0f), int(w * x1f)
    strip = arr[y0:y1, x0:x1]
    inner = strip[int(strip.shape[0] * 0.2):int(strip.shape[0] * 0.8)]
    lum = inner.mean(axis=2)
    bg = float(np.median(lum[:, :20]))
    fg = (np.abs(lum - bg) > 40).sum(axis=0)
    is_gap = fg < 2
    runs, s = [], None
    for x, g in enumerate(is_gap):
        if g and s is None:
            s = x
        if not g and s is not None:
            runs.append((s, x)); s = None
    if s is not None:
        runs.append((s, len(is_gap)))
    return [(x0 + (a + b) // 2, b - a) for a, b in runs if b - a >= 3]


def cell_gaps(band, x0f=0.28, x1f=0.995, pitch_tol=0.25):
    """19 bordi cella [b0..b18] (coordinate assolute) oppure [].

    Fit su griglia uniforme: pitch da autocorrelazione del profilo gap,
    offset da miglior allineamento dei 18 confini (robusto a gap mancanti,
    bordi nome/TOTALE parziali e screenshot di qualsiasi larghezza)."""
    h, w = band["h"], band["w"]
    arr = band["arr"]
    y0, y1 = band["y0"], band["y1"]
    x0, x1 = int(w * x0f), int(w * x1f)
    strip = arr[y0:y1, x0:x1]
    inner = strip[int(strip.shape[0] * 0.2):int(strip.shape[0] * 0.8)]
    lum = inner.mean(axis=2)
    bg = float(np.median(lum[:, :20]))
    fg = (np.abs(lum - bg) > 40).sum(axis=0)
    gap = (fg < 2).astype(float)
    W = len(gap)
    # pitch: picco autocorrelazione in [w/40, w/28] (~33px per cella a 1910)
    lo, hi = max(20, int(w / 40)), int(w / 28)
    ac = [(float(np.correlate(gap, np.roll(gap, -lag))[0]), lag) for lag in range(lo, hi)]
    pitch = max(ac)[1]
    # offset: massimizza gap-ness alle posizioni o+k*pitch (k=0..17)
    hw = max(3, int(pitch * 0.12))
    kernel = np.ones(2 * hw + 1)
    gsum = np.convolve(gap, kernel, mode="same")
    start = int(W * 0.02)
    scored = []
    for o in range(start, max(start + 1, W - 19 * pitch)):
        s = sum(gsum[min(max(int(o + k * pitch), 0), W - 1)] for k in range(19))
        scored.append((s, o))
    # disambiguazione ±1 cella: bonus dominanti se b0 e' subito a destra del
    # gap largo del nome e b18 dentro il gap largo del TOTALE
    runs_w = []
    s = None
    for x, g in enumerate((fg < 2)):
        if g and s is None:
            s = x
        if not g and s is not None:
            runs_w.append((s, x)); s = None
    if s is not None:
        runs_w.append((s, len(fg)))
    left_wide = [(a, b) for a, b in runs_w
                 if b - a >= 60 and (a + b) // 2 < W * 0.45]
    right_wide = [(a, b) for a, b in runs_w
                  if b - a >= 60 and (a + b) // 2 > W * 0.55]
    # b0 = subito a destra della fine del gap nome; b18 = inizio gap TOTALE
    nam_zone = (left_wide[-1][1] - pitch * 0.2, left_wide[-1][1] + pitch * 0.6) if left_wide else None
    tot_zone = None
    if right_wide:
        a, b = right_wide[0]
        tot_zone = (a - pitch * 0.2, a + pitch * 0.5)

    def bonus(o):
        b0, b18 = o, o + 18 * pitch
        s = 0.0
        if nam_zone and nam_zone[0] <= b0 <= nam_zone[1]:
            s += 100.0
        if tot_zone and tot_zone[0] <= b18 <= tot_zone[1]:
            s += 100.0
        return s

    start = int(W * 0.02)
    best_o, best_s = start, -1e18
    for o in range(start, max(start + 1, W - 19 * pitch)):
        s = sum(gsum[min(max(int(o + k * pitch), 0), W - 1)] for k in range(19))
        s += bonus(o)
        if s > best_s:
            best_s, best_o = s, o
    borders = [x0 + best_o + k * pitch for k in range(19)]
    if borders[-1] > x1 + pitch * 0.5 or borders[0] < x0 - pitch:
        return []
    return [int(round(b)) for b in borders]


def save_crop(arr, box, path, scale_w=2, scale_h=3):
    x0, y0, x1, y1 = box
    im = Image.fromarray(arr[y0:y1, x0:x1].astype("uint8"))
    im = im.resize((im.width * scale_w, im.height * scale_h))
    im.save(path)
    return path


def valid_row(values, total):
    return (isinstance(values, list) and len(values) == 18
            and all(isinstance(v, int) and v >= 1 for v in values)
            and sum(values) == total)


def ask_values(reader, crop, expect, tag, temp=0.0, feedback=None):
    prompt = (f"Your previous answer had {feedback} numbers but there are exactly {expect} numbers here. "
              f"Count them one by one left to right. Output ONLY JSON: {{\"values\": [{expect} ints]}}"
              if feedback else 'Transcribe these numbers left to right. Output ONLY JSON: {"values": [ints]}')
    # temp>0 via generate kwargs: mlx_vlm generate accetta temp come parametro
    from mlx_vlm import generate
    formatted = reader._apply(reader.processor, reader.config, prompt, num_images=1)
    res = generate(reader.model, reader.processor, formatted, crop,
                   max_tokens=200, temp=temp, verbose=False)
    r = parse_json(res.text if hasattr(res, "text") else str(res))
    v = r.get("values") if r else None
    return v if isinstance(v, list) and all(isinstance(x, int) for x in v) else None


def transcribe_singles(reader, arr, borders, y0, y1, workdir, tag):
    """Ultima spiaggia: una cella alla volta (cifra isolata = quasi 100%)."""
    vals = []
    for k in range(18):
        b = (max(0, borders[k] - 2), max(0, y0), borders[k + 1] + 2, y1)
        cp = save_crop(arr, b, os.path.join(workdir, f"{tag}_c{k}.png"),
                       scale_w=3, scale_h=4)
        v = ask_values(reader, cp, 1, tag)
        if not isinstance(v, list) or len(v) != 1 or not isinstance(v[0], int):
            v = ask_values(reader, cp, 1, tag, temp=0.5, feedback="1")
        vals.append(v[0] if isinstance(v, list) and len(v) == 1 and isinstance(v[0], int) else None)
    if any(v is None or v < 1 for v in vals):
        return None
    return vals


def full_borders(arr, y0, y1):
    """19 bordi celle (18 celle) oppure []."""
    h, w, _ = arr.shape
    m = int((y1 - y0) * 0.10)
    b = cell_gaps({"arr": arr, "y0": y0 + m, "y1": y1 - m, "h": h, "w": w,
                   "x1": int(w * 0.995)})
    return b if len(b) == 19 else []


def assemble_overlap(t0, t1, t2, total):
    """Assembla terzi sovrapposti (8+8+6) cercando l'incastro sulle celle
    comuni. Ritorna la sequenza da 18 con somma==totale oppure None."""
    if not all(isinstance(t, list) and all(isinstance(v, int) for v in t)
               for t in (t0, t1, t2)):
        return None
    for o1 in (2, 1):
        if len(t0) < o1 or len(t1) < o1 or t0[-o1:] != t1[:o1]:
            continue
        for o2 in (2, 1):
            if len(t1) < o2 or len(t2) < o2 or t1[-o2:] != t2[:o2]:
                continue
            seq = t0 + t1[o1:] + t2[o2:]
            if len(seq) == 18 and sum(seq) == total and all(v >= 1 for v in seq):
                return seq
    return None


def transcribe_thirds(reader, arr, borders, y0, y1, workdir, tag, total):
    """Terzi sovrapposti (celle 1-8, 7-14, 13-18) + assemblaggio sull'incastro
    + voto a maggioranza con selezione via checksum. Ritorna (values|None, voting)."""
    import itertools
    bounds = [borders[k] for k in (0, 8, 6, 14, 12, 18)]
    expects = (8, 8, 6)
    crops = [save_crop(arr, (bounds[2 * j], y0, bounds[2 * j + 1], y1),
                       os.path.join(workdir, f"{tag}_{j}.png")) for j in range(3)]
    base = [ask_values(reader, crops[j], expects[j], tag) for j in range(3)]
    seq = assemble_overlap(base[0], base[1], base[2], total)
    if seq:
        return seq, False
    log(f"{tag}: voto a maggioranza (checksum {total})")
    cands = []
    for j in range(3):
        opts = []
        if isinstance(base[j], list):
            opts.append(base[j])
        for _ in range(2):
            v = ask_values(reader, crops[j], expects[j], tag, temp=0.5,
                           feedback=len(base[j]) if isinstance(base[j], list) else "?")
            if isinstance(v, list) and v not in opts:
                opts.append(v)
        cands.append(opts or [None])
    for combo in itertools.product(*cands):
        if any(c is None for c in combo):
            continue
        seq = assemble_overlap(*combo, total)
        if seq:
            agree = sum(1 for j in range(3) if combo[j] == base[j])
            log(f"{tag}: combo valida via voto (accordo temp-0: {agree}/3)")
            return seq, True
    return None, True


def extract(image_path, out_path, model=MODEL_DEFAULT, workdir="/tmp/sb_extract"):
    os.makedirs(workdir, exist_ok=True)
    arr = np.array(Image.open(image_path).convert("RGB")).astype(int)
    h, w, _ = arr.shape
    reader = Reader(model)

    full, full_raw = None, ""
    tries = [(p, a) for a in (1, 2) for p in PROMPTS_FULL]
    for prompt, attempt in tries:
        full_raw = reader.ask(image_path, prompt, 1500)
        with open(os.path.join(workdir, f"full_raw_{attempt}.txt"), "w", encoding="utf-8") as f:
            f.write(full_raw)
        full = parse_json(full_raw)
        if full and full.get("players"):
            if (prompt, attempt) != tries[0]:
                log("full-image riuscita (prompt alternativo/tentativo successivo)")
            break
        log(f"full-image senza JSON valido (tentativo {attempt}), riprovo…")
        full = None
    if not full or "players" not in full or not full["players"]:
        raise RuntimeError("passata full-image senza JSON valido")
    players = full["players"]
    n = len(players)
    log(f"full-image: {n} giocatori, totali={[p.get('total') for p in players]}")

    par = detect_par(arr)
    bands = row_bands(arr, par, n)
    problems = []

    par_vals, par_total = full.get("par"), full.get("par_total")
    if not valid_row(par_vals, par_total):
        # ritenta PAR via terzi esatti sulla fascia cifre (niente header BUCA)
        band = arr[par[0]:par[1]]
        lum = band.mean(axis=2)
        bg = float(np.median(lum[:, :20]))
        rows = np.where((np.abs(lum - bg) > 40).sum(axis=1) > w * 0.02)[0]
        if len(rows):
            t0, t1 = par[0] + int(rows[0]), par[0] + int(rows[-1])
            bd = full_borders(arr, t0, t1)
            if len(bd) == 19:
                holes, _ = transcribe_thirds(reader, arr, bd, t0, t1, workdir, "par", par_total)
                if valid_row(holes, par_total):
                    par_vals = holes
                    log("PAR recuperato via terzi esatti")
    if not valid_row(par_vals, par_total):
        problems.append(f"PAR invalido: {par_vals} tot={par_total}")

    final_players = []
    for i, p in enumerate(players):
        name, pos, total = canon(p.get("name")), p.get("position"), p.get("total")
        holes = p.get("holes")
        if valid_row(holes, total):
            log(f"{name}: full-image OK ({total})")
        else:
            log(f"{name}: full-image invalido (len={len(holes) if isinstance(holes, list) else '?'}) -> terzi esatti")
            y0, y1 = bands[i]
            y0c, y1c = max(0, y0), min(arr.shape[0], y1)
            bd = full_borders(arr, y0c, y1c)
            if len(bd) != 19:
                problems.append(f"{name}: terzi non ritagliabili")
                final_players.append({"name": name, "position": pos,
                                      "totalScore": total, "diffPar": None,
                                      "holes": holes})
                continue
            holes, voted = transcribe_thirds(reader, arr, bd, y0c, y1c, workdir, f"row{i}", total)
            if valid_row(holes, total):
                log(f"{name}: terzi OK ({total})")
                if voted:
                    log(f"{name}: nota — riga risolta via voto, ricontrollare le celle in review")
            else:
                # ultima spiaggia: singole celle (stessi bordi)
                log(f"{name}: terzi falliti -> singole celle")
                holes = transcribe_singles(reader, arr, bd, y0c, y1c, workdir, f"cell{i}")
                if valid_row(holes, total):
                    log(f"{name}: singole OK ({total})")
                else:
                    problems.append(f"{name}: riga invalida len={len(holes) if isinstance(holes, list) else '?'} sum={sum(holes) if isinstance(holes, list) and all(isinstance(v, int) for v in holes) else '?'} tot={total}")
        final_players.append({"name": name, "position": pos, "totalScore": total,
                              "diffPar": (total - par_total) if isinstance(total, int) and isinstance(par_total, int) else None,
                              "holes": holes})

    if problems or not isinstance(par_total, int):
        draft = {"par": par_total, "players": final_players}
        with open(out_path, "w", encoding="utf-8") as f:
            json.dump(draft, f, indent=2, ensure_ascii=False)
        raise RuntimeError("estrazione incompleta: " + "; ".join(problems)
                           + f" | draft salvato in {out_path} (correggere le celle e riprovare con --scoreboard)")

    # gate finale: diff_par coerente col par
    for p in final_players:
        if p["totalScore"] - par_total != p["diffPar"]:
            raise RuntimeError(f"{p['name']}: diff_par incoerente col PAR")
    out = {"par": par_total, "players": final_players}
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    log(f"OK validato (108 celle: par + {len(final_players)}x18) -> {out_path}")
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description="Estrae scoreboard da screenshot (VLM locale MLX).")
    ap.add_argument("image")
    ap.add_argument("--out", required=True)
    ap.add_argument("--model", default=MODEL_DEFAULT)
    ap.add_argument("--workdir", default="/tmp/sb_extract")
    args = ap.parse_args(argv)
    try:
        extract(args.image, args.out, args.model, args.workdir)
    except RuntimeError as e:
        print(f"[extract] ERRORE: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
