#!/usr/bin/env python3
"""Monitor dei 7 canali via feed RSS pubblici di YouTube (niente API key).

Se il feed RSS di un canale non risponde (YouTube a volte li manda in 404
per ore), ripiega sulla scheda "Video" del canale letta con yt-dlp
(--flat-playlist): titoli originali in italiano + data approssimativa,
poi data esatta con `yt-dlp -J` solo per i candidati nuovi.

Elenca i video candidati "golfatina" non ancora integrati in
src/data/golfatineData.ts e non gia' decisi nel ledger
(automation/ledger.json).

Regole candidato:
  - forte: titolo con golf* (golfatina, sdrogolfatina, golfata, mini-golf…)
  - debole: titolo con >= 2 nomi del roster (es. "con Delux, Dread…"):
            serve a non perdere titoli tipo "QUATTRO GOLFISTI…" o
            "L'ELENCO PIU' BELLO…"; se nel video non c'e' la classifica
            viene scartato in silenzio.
  - pubblicato da `since` (ledger) in poi.
Shorts e video troppo brevi vengono scartati dal grabber (durata).

Uso: python3 scripts/youtube_watch.py [--json]
"""

import argparse
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET
from zoneinfo import ZoneInfo

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "golfatineData.ts")
LEDGER_PATH = os.path.join(PROJECT_ROOT, "automation", "ledger.json")

# Canale (nome esatto oEmbed) -> channel_id (verificati il 2026-11-13).
CHANNEL_IDS = {
    "GaBBoDSQ": "UCck1Wrv-6h44db16OL4geOQ",
    "Delux": "UCOwBvtQrGrXzlzq2JaAIqmw",
    "Just Rohn JR": "UCFC5MMXpoLq4MTJpli_mXDg",
    "Around Dread": "UCW3E__9XjSlKvmX5PHH7hzg",
    "Mollu": "UCRpBCZHwzEdkuCyvbP5AvHg",
    "oessaM": "UCGWWQRvQoP2te6o15uvwXsg",
    "JTaz Extra": "UCCtG3gCdGtDVPPmJpmXkIuQ",
}
FEED = "https://www.youtube.com/feeds/videos.xml?channel_id={}"
TAB = "https://www.youtube.com/channel/{}/videos"
YTDLP = os.environ.get("YTDLP") or shutil.which("yt-dlp") or "/opt/homebrew/bin/yt-dlp"
NS = {"a": "http://www.w3.org/2005/Atom", "yt": "http://www.youtube.com/xml/schemas/2015",
      "media": "http://search.yahoo.com/mrss/"}
STRONG_RE = re.compile(r"golf", re.IGNORECASE)
ROSTER_WORDS = ["dread", "gabbo", "delux", "delu", "rohn", "mollu", "jtaz", "masseo"]
ROME = ZoneInfo("Europe/Rome")
KNOWN_DUPLICATE_YT = {"efppNZh_4UA"}  # #79 = duplicato del #30


def log(msg):
    print(f"[watch] {msg}", file=sys.stderr, flush=True)


def load_ledger(path=LEDGER_PATH):
    if os.path.isfile(path):
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    return {"since": "2026-10-01", "videos": {}}


def save_ledger(ledger, path=LEDGER_PATH):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    ledger["videos"] = dict(sorted(ledger["videos"].items(),
                                   key=lambda kv: (kv[1].get("published", ""), kv[0])))
    with open(path, "w", encoding="utf-8") as f:
        json.dump(ledger, f, indent=2, ensure_ascii=False)
        f.write("\n")


def integrated_ids(ts_path=TS_PATH):
    with open(ts_path, encoding="utf-8") as f:
        return set(re.findall(r'"youtubeId":\s*"([^"]+)"', f.read()))


def fetch_feed(channel, cid, timeout=20):
    req = urllib.request.Request(FEED.format(cid), headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        root = ET.fromstring(r.read())
    out = []
    for e in root.findall("a:entry", NS):
        vid = e.find("yt:videoId", NS).text
        title = (e.find("a:title", NS).text or "").strip()
        pub = dt.datetime.fromisoformat(e.find("a:published", NS).text)
        out.append({"youtube_id": vid, "title": title, "channel": channel,
                    "published": pub.astimezone(ROME).isoformat(timespec="seconds"),
                    "date": pub.astimezone(ROME).date().isoformat(),
                    "url": f"https://youtu.be/{vid}"})
    return out


def _ytdlp(args, timeout=120):
    r = subprocess.run([YTDLP, "--no-warnings", "--ignore-config", *args],
                       capture_output=True, text=True, timeout=timeout)
    if r.returncode != 0:
        err = (r.stderr or "").strip().splitlines()
        raise RuntimeError(f"yt-dlp exit {r.returncode}: {err[-1] if err else ''}")
    return json.loads(r.stdout)


def _entry(channel, vid, title, ts, approx):
    when = dt.datetime.fromtimestamp(ts, dt.timezone.utc).astimezone(ROME) if ts else None
    return {"youtube_id": vid, "title": title, "channel": channel,
            "published": when.isoformat(timespec="seconds") if when else "",
            "date": when.date().isoformat() if when else "",
            "url": f"https://youtu.be/{vid}", "approx_date": approx}


def fetch_tab(channel, cid, n=15):
    """Fallback senza RSS: scheda Video del canale (niente Shorts/live).

    Due letture: con lang=it i titoli sono quelli originali ma senza data;
    senza lang c'e' la data approssimativa ("3 giorni fa") ma i titoli
    possono essere tradotti in inglese. Si uniscono per ID.
    """
    url = TAB.format(cid)
    base = ["--flat-playlist", "-J", "--playlist-end", str(n)]
    titled = _ytdlp(base + ["--extractor-args", "youtube:lang=it", url])
    try:
        dated = _ytdlp(base + ["--extractor-args", "youtubetab:approximate_date", url])
        ts = {e.get("id"): e.get("timestamp") for e in dated.get("entries") or []}
    except Exception as e:  # senza date: ci pensa la data esatta per video
        log(f"AVVISO date approssimative non lette per {channel}: {e}")
        ts = {}
    return [_entry(channel, e["id"], (e.get("title") or "").strip(), ts.get(e["id"]), True)
            for e in titled.get("entries") or [] if e.get("id")]


def exact_published(c):
    """Data/ora e titolo originale esatti di un video (yt-dlp -J)."""
    info = _ytdlp(["-J", "--skip-download", f"https://www.youtube.com/watch?v={c['youtube_id']}"],
                  timeout=180)
    ts = info.get("release_timestamp") or info.get("timestamp")
    if ts:
        c.update(_entry(c["channel"], c["youtube_id"], (info.get("title") or c["title"]).strip(),
                        ts, False))
    return c


def classify(title):
    if STRONG_RE.search(title):
        return "strong"
    low = title.lower()
    hits = {w for w in ROSTER_WORDS if re.search(rf"\b{w}", low)}
    hits.discard("delu") if "delux" in hits else None
    return "weak" if len(hits) >= 2 else None


def candidates(ledger=None, ts_path=TS_PATH, precise=True):
    """precise=False (watchdog nel cloud): niente `yt-dlp -J` per video,
    vale la data approssimativa del fallback."""
    ledger = ledger or load_ledger()
    since = ledger.get("since", "2026-10-01")
    margin = (dt.date.fromisoformat(since) - dt.timedelta(days=2)).isoformat()
    have = integrated_ids(ts_path) | KNOWN_DUPLICATE_YT
    decided = {k for k, v in ledger.get("videos", {}).items()
               if v.get("status") not in ("retry",)}
    out, errors, fallback = [], [], []
    for ch, cid in CHANNEL_IDS.items():
        try:
            entries = fetch_feed(ch, cid)
        except Exception as e:  # RSS giu': scheda Video del canale
            try:
                entries = fetch_tab(ch, cid)
                fallback.append(ch)
            except Exception as e2:  # un canale giu' non blocca gli altri
                errors.append(f"{ch}: RSS {e}; scheda video {e2}")
                continue
        for e in entries:
            kind = classify(e["title"])
            if not kind:
                continue
            if e["youtube_id"] in have or e["youtube_id"] in decided:
                continue
            if e["date"] and e["date"] < (margin if e.get("approx_date") else since):
                continue
            e["kind"] = kind
            out.append(e)
    if fallback:
        log(f"AVVISO feed RSS giu', uso la scheda video per: {', '.join(fallback)}")
    for err in errors:
        log(f"AVVISO canale non letto: {err}")
    if len(errors) == len(CHANNEL_IDS):
        raise RuntimeError("nessun canale raggiungibile (RSS e scheda video)")
    final = []
    for e in out:
        if e.get("approx_date") and precise:
            try:
                exact_published(e)
            except Exception as ex:
                log(f"AVVISO data esatta non letta per {e['youtube_id']}: {ex}")
        if e["date"] and e["date"] < since:
            continue
        if not e["published"]:  # senza data non si puo' numerare: al prossimo giro
            log(f"AVVISO {e['youtube_id']} senza data di pubblicazione, rimandato")
            continue
        e["kind"] = classify(e["title"]) or e["kind"]
        final.append(e)
    final.sort(key=lambda e: (e["published"], e["youtube_id"]))
    return final


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--json", action="store_true")
    args = ap.parse_args(argv)
    c = candidates()
    if args.json:
        print(json.dumps(c, indent=2, ensure_ascii=False))
    else:
        for e in c:
            print(f"{e['published'][:16]} {e['kind']:6} {e['channel']:13} {e['youtube_id']} {e['title'][:70]}")
        print(f"{len(c)} candidati")
    return 0


if __name__ == "__main__":
    sys.exit(main())
