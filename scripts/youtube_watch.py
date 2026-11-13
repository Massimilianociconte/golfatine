#!/usr/bin/env python3
"""Monitor dei 7 canali via feed RSS pubblici di YouTube (niente API key).

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


def classify(title):
    if STRONG_RE.search(title):
        return "strong"
    low = title.lower()
    hits = {w for w in ROSTER_WORDS if re.search(rf"\b{w}", low)}
    hits.discard("delu") if "delux" in hits else None
    return "weak" if len(hits) >= 2 else None


def candidates(ledger=None, ts_path=TS_PATH):
    ledger = ledger or load_ledger()
    since = ledger.get("since", "2026-10-01")
    have = integrated_ids(ts_path) | KNOWN_DUPLICATE_YT
    decided = {k for k, v in ledger.get("videos", {}).items()
               if v.get("status") not in ("retry",)}
    out, errors = [], []
    for ch, cid in CHANNEL_IDS.items():
        try:
            entries = fetch_feed(ch, cid)
        except Exception as e:  # un feed giu' non blocca gli altri
            errors.append(f"{ch}: {e}")
            continue
        for e in entries:
            kind = classify(e["title"])
            if not kind or e["date"] < since:
                continue
            if e["youtube_id"] in have or e["youtube_id"] in decided:
                continue
            e["kind"] = kind
            out.append(e)
    for err in errors:
        log(f"AVVISO feed non letto: {err}")
    if len(errors) == len(CHANNEL_IDS):
        raise RuntimeError("nessun feed RSS raggiungibile")
    out.sort(key=lambda e: (e["published"], e["youtube_id"]))
    return out


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
