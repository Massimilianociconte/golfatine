#!/usr/bin/env python3
"""Trova e ritaglia la CLASSIFICA finale direttamente dal video YouTube.

Nessun download completo: solo la coda del video e pochi secondi in alta
risoluzione.

  1. yt-dlp -J            -> durata, stato (live/premiere/privato), titolo.
  2. coda a 360p          -> ultimi TAIL secondi (default 300, poi 900 se
                             non trova nulla), 2 frame/s analizzati in RAM.
  3. rilevamento          -> banda PAR verde chiara larga >= 45% del frame
                             (colore UI del gioco, diverso da fairway/erba).
                             L'ULTIMA sequenza continua di frame con la
                             classifica = classifica finale.
  4. finestra alta qualita' -> scarica solo [inizio-3s, fine+3s] della
                             sequenza a <=1440p, rileva di nuovo e salva
                             FRAMES ritagli (panel da BUCA a ultima riga).

I ritagli hanno lo stesso formato degli screenshot nel DOCX, quindi
scripts/extract_scoreboard.py e scripts/read_scoreboard_cells.py li leggono
senza modifiche.

Uso:
  python3 scripts/grab_scoreboard_frame.py <YOUTUBE_ID> --outdir DIR
  -> DIR/crop_1.png .. crop_N.png + DIR/grab.json
Exit: 0 ok, 3 classifica non trovata, 4 video non disponibile (live,
premiere, privato), 1 errore.
"""

import argparse
import json
import os
import shutil
import subprocess
import sys
import tempfile

import numpy as np

YTDLP = os.environ.get("YTDLP", "yt-dlp")
FFMPEG = os.environ.get("FFMPEG", "ffmpeg")
LOW_W, LOW_H = 640, 360


def log(msg):
    print(f"[grab] {msg}", file=sys.stderr, flush=True)


class GrabError(Exception):
    def __init__(self, msg, code=1):
        super().__init__(msg)
        self.code = code


def run(cmd, timeout=900):
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        raise GrabError(f"comando fallito ({r.returncode}): {' '.join(cmd[:3])}…\n"
                        f"{r.stderr[-1500:]}")
    return r.stdout


def ytdlp_base():
    cmd = [YTDLP, "--no-warnings", "--no-progress", "--no-playlist"]
    cookies = os.environ.get("YTDLP_COOKIES")
    if cookies and os.path.isfile(cookies):
        cmd += ["--cookies", cookies]
    extra = os.environ.get("YTDLP_EXTRA_ARGS")
    if extra:
        cmd += extra.split()
    return cmd


def video_info(yt_id):
    out = run(ytdlp_base() + ["-J", f"https://www.youtube.com/watch?v={yt_id}"], timeout=180)
    info = json.loads(out)
    live = info.get("live_status")
    if live in ("is_live", "is_upcoming", "post_live"):
        raise GrabError(f"{yt_id}: video non ancora disponibile (live_status={live})", 4)
    if info.get("availability") not in (None, "public", "unlisted"):
        raise GrabError(f"{yt_id}: availability={info.get('availability')}", 4)
    return {"id": yt_id, "title": info.get("title"), "duration": info.get("duration"),
            "upload_date": info.get("upload_date"), "channel": info.get("channel"),
            "timestamp": info.get("timestamp"), "width": info.get("width"),
            "height": info.get("height")}


def download_section(yt_id, section, fmt, out_path):
    run(ytdlp_base() + ["-f", fmt, "--download-sections", section,
                        "-o", out_path, f"https://www.youtube.com/watch?v={yt_id}"])
    if not os.path.isfile(out_path) or os.path.getsize(out_path) < 1000:
        raise GrabError(f"download vuoto: {section}")
    return out_path


def iter_frames(path, fps, width=None, height=None):
    """Frame RGB come np.uint8 (H,W,3) via pipe rawvideo (niente file)."""
    if width is None:
        probe = run([shutil.which("ffprobe") or "ffprobe", "-v", "error",
                     "-select_streams", "v:0", "-show_entries",
                     "stream=width,height", "-of", "csv=p=0", path])
        width, height = [int(x) for x in probe.strip().split(",")[:2]]
        vf = f"fps={fps}"
    else:
        vf = f"fps={fps},scale={width}:{height}"
    p = subprocess.Popen([FFMPEG, "-v", "error", "-i", path, "-vf", vf,
                          "-f", "rawvideo", "-pix_fmt", "rgb24", "-"],
                         stdout=subprocess.PIPE)
    size = width * height * 3
    i = 0
    try:
        while True:
            buf = p.stdout.read(size)
            if len(buf) < size:
                break
            yield i / fps, np.frombuffer(buf, np.uint8).reshape(height, width, 3)
            i += 1
    finally:
        p.stdout.close()
        p.wait()


def find_board(arr):
    """Classifica nel frame: {"box": (x0, y0, x1, y1), "rows": N, "final": bool}
    oppure None.

    Ancora: banda PAR (RGB ~126,203,133). Il fairway ha B molto piu' basso,
    il titolo verde chiaro ha B troppo alto: la combinazione e' univoca.
    Fondo: inizio della fascia verde col pulsante "Continua" (schermata di
    fine partita, final=True); in mancanza, ultima riga di celle scure.
    rows = numero di righe giocatore misurato in pixel: serve a scartare
    letture che hanno perso una riga (i checksum per riga non lo vedono)."""
    a = arr.astype(np.int16)
    R, G, B = a[:, :, 0], a[:, :, 1], a[:, :, 2]
    m = (G > 165) & (G - R > 45) & (G - B > 40) & (B > 95) & (R > 85)
    h, w = m.shape
    frac = m.mean(axis=1)
    rows = np.where(frac > 0.40)[0]
    if len(rows) == 0:
        return None
    runs, s, p = [], rows[0], rows[0]
    for y in rows[1:]:
        if y - p > 2:
            runs.append((s, p)); s = y
        p = y
    runs.append((s, p))
    # piu' bande candidate (es. titolo verde chiaro a bassa risoluzione):
    # vale la prima che ha sotto le righe giocatori
    for y0, y1 in sorted(runs, key=lambda r: -(r[1] - r[0])):
        board = _board_from_band(a, m, y0, y1)
        if board is not None:
            return board
    return None


ROW_PITCH = 1.145  # passo righe giocatore / altezza banda PAR (misurato)


def _board_from_band(a, m, y0, y1):
    h, w = m.shape
    bh = y1 - y0 + 1
    if not (0.022 * h <= bh <= 0.07 * h):
        return None
    cols = np.where(m[y0:y1 + 1].mean(axis=0) > 0.5)[0]
    if len(cols) < 0.40 * w:
        return None
    x0, x1 = int(cols[0]), int(cols[-1])
    # Il panel del gioco e' centrato: se a sinistra la webcam copre la banda
    # PAR (bordo sinistro rilevato troppo a destra), ricavo il bordo per
    # simmetria da quello destro, che la webcam (sempre a sinistra) non copre.
    x0_sym = w - 1 - x1
    if x0 > x0_sym + 0.01 * w:
        x0 = max(0, x0_sym)
    top = max(0, int(y0 - 1.25 * bh))          # header BUCA sopra il PAR
    pitch = ROW_PITCH * bh
    sub = a[y1 + 1:min(h, int(y1 + 1 + 9.6 * pitch)), x0:x1 + 1]
    if sub.shape[0] < 0.8 * pitch:
        return None
    r2, g2, b2 = sub[:, :, 0], sub[:, :, 1], sub[:, :, 2]
    footer = (g2 - r2 > 45) & (g2 - b2 > 22) & (g2 > 105) & (g2 < 180)
    cell = (b2 > r2 + 8) & (g2 > 45) & (g2 < 125) & (g2 - b2 < 25)
    ff, cf = footer.mean(axis=1), cell.mean(axis=1)
    if cf[:max(2, int(0.8 * pitch))].mean() < 0.35:
        return None                             # niente righe sotto il PAR
    need = max(3, int(0.4 * bh))
    region, final, run = None, False, 0
    for i, v in enumerate(ff):
        run = run + 1 if v > 0.6 else 0
        if run >= need:
            region, final = i - run + 1, True
            break
    if region is None:
        last, gap = None, 0
        for i, v in enumerate(cf):
            if v > 0.35:
                last, gap = i, 0
            else:
                gap += 1
                if last is not None and gap > 0.6 * pitch:
                    break
        region = (last or 0) + 1
    n = int(round(region / pitch))
    if n < 1:
        return None
    return {"box": (x0, top, x1 + 1, y1 + 1 + region), "rows": n, "final": final}


def board_runs(dets, step):
    """Sequenze continue [t0, t1] di frame con classifica (tollera 1 buco)."""
    ts = [t for t, b in dets if b is not None]
    if not ts:
        return []
    runs, s, p = [], ts[0], ts[0]
    for t in ts[1:]:
        if t - p > 2.5 * step:
            runs.append((s, p)); s = t
        p = t
    runs.append((s, p))
    return runs


def scan_tail(yt_id, duration, tail, workdir, fps=2.0):
    tail = min(tail, int(duration))
    low = os.path.join(workdir, f"low_{tail}.mp4")
    log(f"{yt_id}: coda {tail}s a 360p…")
    download_section(yt_id, f"*-{tail}-inf",
                     "bv*[height<=360][vcodec^=avc1]/bv*[height<=360]/wv*", low)
    dets = []
    for t, fr in iter_frames(low, fps, LOW_W, LOW_H):
        dets.append((t, find_board(fr)))
    clip_len = dets[-1][0] if dets else 0
    runs = board_runs(dets, 1 / fps)
    log(f"{yt_id}: {len(dets)} frame analizzati, sequenze classifica: "
        f"{[(round(a, 1), round(b, 1)) for a, b in runs]}")
    # offset assoluto: la clip termina alla fine del video
    off = duration - clip_len
    return [(off + a, off + b) for a, b in runs]


def crop_score(arr, box):
    x0, y0, x1, y1 = box
    return arr[y0:y1, x0:x1]


def grab(yt_id, outdir, tail=300, frames=5, max_height=1440, extend=True):
    os.makedirs(outdir, exist_ok=True)
    work = tempfile.mkdtemp(prefix=f"grab_{yt_id}_")
    try:
        info = video_info(yt_id)
        dur = info["duration"] or 0
        if dur < 120:
            raise GrabError(f"{yt_id}: durata {dur}s (Short?)", 3)
        runs = []
        for t in ((tail, 900) if extend else (tail,)):
            runs = scan_tail(yt_id, dur, t, work)
            if runs or t >= dur:
                break
        # scarta sequenze di 1 solo frame (falsi positivi)
        runs = [r for r in runs if r[1] - r[0] >= 0.9] or runs
        if not runs:
            raise GrabError(f"{yt_id}: classifica non trovata negli ultimi minuti", 3)
        t0, t1 = runs[-1]
        a, b = max(0, t0 - 3), min(dur, t1 + 3)
        hi = os.path.join(work, "hi.mp4")
        log(f"{yt_id}: classifica finale ~{t0:.0f}-{t1:.0f}s, scarico {a:.0f}-{b:.0f}s "
            f"a <= {max_height}p…")
        download_section(yt_id, f"*{a:.1f}-{b:.1f}",
                         f"bv*[height<={max_height}][height>=720]/bv*[height<={max_height}]", hi)
        hits, last_full = [], None  # solo i ritagli in RAM (frame 1440p ~11MB l'uno)
        for t, fr in iter_frames(hi, 4.0):
            board = find_board(fr)
            if board is not None:
                hits.append((t, board, crop_score(fr, board["box"]).copy()))
                last_full = fr.copy()
        if not hits:
            raise GrabError(f"{yt_id}: classifica non trovata nella finestra HQ", 3)
        # sequenza finale nella finestra HQ, scarta 0.5s ai bordi (animazioni)
        hruns = board_runs([(t, bx) for t, bx, _ in hits], 0.25)
        h0, h1 = hruns[-1]
        core = [h for h in hits if h0 + 0.5 <= h[0] <= h1 - 0.5] or \
               [h for h in hits if h0 <= h[0] <= h1]
        idx = np.linspace(0, len(core) - 1, min(frames, len(core))).round().astype(int)
        from PIL import Image
        crops = []
        for k, i in enumerate(sorted(set(idx.tolist())), 1):
            t, board, crop = core[i]
            path = os.path.join(outdir, f"crop_{k}.png")
            Image.fromarray(crop).save(path)
            crops.append({"path": path, "t": round(a + t, 2),
                          "box": list(map(int, board["box"])),
                          "rows": board["rows"], "final": board["final"]})
        full = os.path.join(outdir, "frame_full.png")
        Image.fromarray(last_full).save(full)
        rows = sorted(c["rows"] for c in crops)[len(crops) // 2]
        res = {"video": info, "final_window": [round(t0, 1), round(t1, 1)],
               "rows": rows, "final_screen": all(c["final"] for c in crops),
               "crops": crops, "frame_full": full,
               "frame_size": list(last_full.shape[1::-1])}
        with open(os.path.join(outdir, "grab.json"), "w", encoding="utf-8") as f:
            json.dump(res, f, indent=2, ensure_ascii=False)
        log(f"{yt_id}: {len(crops)} ritagli -> {outdir}")
        return res
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("youtube_id")
    ap.add_argument("--outdir", required=True)
    ap.add_argument("--tail", type=int, default=300)
    ap.add_argument("--frames", type=int, default=5)
    ap.add_argument("--max-height", type=int, default=1440)
    ap.add_argument("--no-extend", action="store_true",
                    help="non estendere la ricerca a 900s se la coda non ha la classifica")
    args = ap.parse_args(argv)
    try:
        res = grab(args.youtube_id, args.outdir, args.tail, args.frames, args.max_height,
                   extend=not args.no_extend)
    except GrabError as e:
        log(f"ERRORE: {e}")
        return e.code
    print(json.dumps(res, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
