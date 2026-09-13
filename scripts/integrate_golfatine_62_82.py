"""Integra le golfatine 62-82 in src/data/golfatineData.ts e golfatine_clean.csv.

Sorgenti:
- Downloads/dati-golfatine-62-82-nuove.csv (score, stesso formato delle 1-61)
- Downloads/lista-golfatine.docx / Lista-golfatine.pdf (titolo, data, link, Canale/publisher)

Regole applicate (verificate contro la lista):
- Le date e gli youtubeId del CSV devono coincidere con la lista; mismatch = errore.
- Il campo `channel` usa il nome publisher ESATTO di YouTube (verificato via oEmbed:
   'Just Rohn JR' e 'oessaM', anche se la lista li chiama 'Just Rohn'/'ilMasseo').
- Match 79 escluso: stesso youtubeId di un match esistente (duplicato).
- Valori buca '' e '0' = buca non giocata (stessa convenzione dei match 13/44/59).
- I match 1-61 restano invariati a parte l'aggiunta di `channel`.

Uso:  python3 scripts/integrate_golfatine_62_82.py
"""

import csv
import io
import json
import os
import re
import sys

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TS_PATH = os.path.join(PROJECT_ROOT, "src", "data", "golfatineData.ts")
CLEAN_CSV_PATH = os.path.join(PROJECT_ROOT, "golfatine_clean.csv")
NEW_CSV_PATH = "/Users/massimilianociconte/Downloads/dati-golfatine-62-82-nuove.csv"

YOUTUBE_RE = re.compile(r"(?:youtu\.be\/|v=)([a-zA-Z0-9_-]+)")

# Canali publisher 1-61 (da lista-golfatine: voce "Canale:" di ogni video).
CHANNEL_BY_YOUTUBE_ID_OLD = {
    "-VpgGrDbnx0": "GaBBoDSQ", "9Ht6yvEN_Pg": "Delux", "VydxAl_uxBI": "GaBBoDSQ",
    "K7ObaKsIbM0": "Just Rohn JR", "LMg9XwLmyhs": "Delux", "xC_YNHOFDE4": "GaBBoDSQ",
    "XXTN5QD3PXc": "Just Rohn JR", "HQalUVkaCS8": "Around Dread", "LC3bdmO-AGI": "Mollu",
    "PXNSIH3FsTE": "Around Dread", "EJMEBEJzjGo": "oessaM", "St2VvfXHwpE": "Just Rohn JR",
    "5S6Dq7LAFNA": "GaBBoDSQ", "80BMUVxCM9o": "Delux", "nORFy_eGVDA": "Around Dread",
    "KadhcxiF6Io": "Around Dread", "qX7wKf7uupY": "Just Rohn JR", "fWl8BCgXTxQ": "GaBBoDSQ",
    "4j9iPqrWtw0": "Delux", "6rJWPcxFRiM": "Around Dread", "CULR32YN7mM": "Just Rohn JR",
    "u9_inJEE6JA": "Delux", "97Z5oHEr8-4": "GaBBoDSQ", "G10APU6StfY": "Around Dread",
    "rOYOAVS4H54": "Just Rohn JR", "efppNZh_4UA": "Delux", "sEUHEXe3iwM": "Around Dread",
    "YcdQ2kgViqM": "Just Rohn JR", "aY8s3zHX0Qk": "Just Rohn JR", "1SoHXNKL53o": "GaBBoDSQ",
    "sXtQUINYS8Y": "Around Dread", "DtzjUGyzg0I": "Just Rohn JR", "K6XbosbFIjg": "Around Dread",
    "ZKEYfCubz1k": "GaBBoDSQ", "_uvZcJiAq5I": "Just Rohn JR", "0E5bB60k9YI": "Delux",
    "a6IGtNxVAGM": "Around Dread", "2zdkusQJBbU": "Just Rohn JR", "54RjIkAC8g4": "GaBBoDSQ",
    "-NC4P43jSLs": "Just Rohn JR", "YleYm6W8AU4": "GaBBoDSQ", "la960Us8FWQ": "Just Rohn JR",
    "x9M1RflGCE4": "oessaM", "XWkrat_kXCw": "Around Dread", "Hu7tK5NXzrU": "Delux",
    "Msk6dgjsLLc": "Just Rohn JR", "SjL8fdo25HY": "Just Rohn JR", "VOkBVCSZfPU": "Around Dread",
    "PhqKCnbBATg": "GaBBoDSQ", "GAJyP4Qc5Es": "oessaM", "drFF-_eNNJE": "Delux",
    "CS8kqLYXJZo": "Just Rohn JR", "pehCX9kJwbI": "GaBBoDSQ", "As94bosHv14": "Delux",
    "hJpkPpCW4xI": "Around Dread", "uNAW22mWuuw": "Delux", "6Gg12l2y3G4": "GaBBoDSQ",
}

# Attesi 62-82 da lista-golfatine (data, youtubeId, canale). La 79 e' esclusa:
# stesso youtubeId della 30 (efppNZh_4UA) = stesso video contato due volte.
EXPECTED_NEW = {
    62: ("2026-08-31", "UiuVahUOQWM", "JTaz Extra"),
    63: ("2026-04-30", "kO4zxE6BXPA", "JTaz Extra"),
    64: ("2026-05-23", "E6I5NOp2yKQ", "JTaz Extra"),
    65: ("2026-07-13", "lwXehBrxT98", "JTaz Extra"),
    66: ("2026-06-26", "-FYK0fm5JjU", "Just Rohn JR"),
    67: ("2026-07-10", "iHz3SBcySM8", "Just Rohn JR"),
    68: ("2026-07-31", "3BTlussfTgQ", "Just Rohn JR"),
    69: ("2026-07-17", "Utm999peUYg", "Just Rohn JR"),
    70: ("2026-07-29", "JNd8kXdBYGM", "GaBBoDSQ"),
    71: ("2026-08-26", "1mMxDTw_ytQ", "Around Dread"),
    72: ("2026-06-18", "wwmsp8CASPU", "Delux"),
    73: ("2026-04-23", "24gIGkEHAfw", "Delux"),
    74: ("2026-07-30", "KGLtpDUYIYc", "Delux"),
    75: ("2026-07-02", "dx51mfR2QP4", "Delux"),
    76: ("2026-07-16", "ZSNlke35wvY", "Delux"),
    77: ("2026-05-28", "lj5-ddG4zTM", "Delux"),
    78: ("2026-05-19", "cWkIOXTKNK8", "Delux"),
    80: ("2026-07-27", "x73ua8AMuTc", "oessaM"),
    81: ("2026-08-31", "vwu4uBpJpGY", "oessaM"),
    82: ("2026-07-06", "jy7RzcCAIXg", "oessaM"),
}

SKIPPED_DUPLICATES = {
    # match_id nuovo: (youtubeId esistente, match esistente)
    79: ("efppNZh_4UA", 30),
}

TOTAL_VIDEOS = 82  # numerazione ufficiale 1-82 (14-17 senza scorecard)


def fail(msg):
    print(f"ERRORE: {msg}", file=sys.stderr)
    sys.exit(1)


def youtube_id(url):
    m = YOUTUBE_RE.search((url or "").strip())
    return m.group(1) if m else ""


def load_new_csv(path):
    """Il CSV 62-82 ha ogni riga wrappata in una singola stringa quotata."""
    with open(path, encoding="utf-8-sig") as f:
        raw = f.read().splitlines()
    lines = []
    for ln in raw:
        ln = ln.strip()
        if ln.startswith('"') and ln.endswith('"'):
            ln = ln[1:-1].replace('""', '"')
        lines.append(ln)
    return list(csv.DictReader(io.StringIO("\n".join(lines))))


def parse_holes(row):
    """'' e '0' = buca non giocata (viene droppata, come match 13/44/59)."""
    holes = []
    for i in range(1, 19):
        val = (row.get(f"b{i}") or "").strip()
        if val == "" or val == "0":
            continue
        holes.append(int(val))
    return holes


def validate_and_group_new(rows, existing_youtube_ids):
    by_match = {}
    for r in rows:
        try:
            mid = int(r["match_id"])
        except (ValueError, TypeError):
            fail(f"match_id non numerico: {r!r}")
        by_match.setdefault(mid, []).append(r)

    new_matches = []
    for mid in sorted(by_match):
        if mid in SKIPPED_DUPLICATES:
            dup_yt, dup_of = SKIPPED_DUPLICATES[mid]
            actual_yt = youtube_id(by_match[mid][0]["url_video"])
            if actual_yt != dup_yt:
                fail(f"match {mid}: atteso duplicato di {dup_yt}, trovato {actual_yt}")
            if dup_yt not in existing_youtube_ids:
                fail(f"match {mid}: il duplicato {dup_yt} non esiste nei dati 1-61")
            print(f"  - match {mid} ESCLUSO (duplicato del video {dup_yt}, gia' presente come match {dup_of})")
            continue
        if mid not in EXPECTED_NEW:
            fail(f"match {mid} inatteso: non in EXPECTED_NEW")
        exp_date, exp_yt, exp_channel = EXPECTED_NEW[mid]
        sub = by_match[mid]
        first = sub[0]
        if first["data_video"].strip() != exp_date:
            fail(f"match {mid}: data CSV {first['data_video']} != lista {exp_date}")
        actual_yt = youtube_id(first["url_video"])
        if actual_yt != exp_yt:
            fail(f"match {mid}: youtubeId CSV {actual_yt} != lista {exp_yt}")
        if actual_yt in existing_youtube_ids:
            fail(f"match {mid}: youtubeId {actual_yt} gia' presente nei dati 1-61")
        for r in sub:
            if r["data_video"].strip() != exp_date or youtube_id(r["url_video"]) != exp_yt:
                fail(f"match {mid}: righe incoerenti tra loro")
            if int(r["par_totale"]) <= 0:
                fail(f"match {mid}: par non valido")
            holes_all = [(r.get(f"b{i}") or "").strip() for i in range(1, 19)]
            played = [int(v) for v in holes_all if v not in ("", "0")]
            if sum(played) != int(r["punteggio_totale"]):
                fail(f"match {mid} {r['giocatore']}: somma buche != totale")
            if int(r["punteggio_totale"]) - int(r["par_totale"]) != int(r["diff_par"]):
                fail(f"match {mid} {r['giocatore']}: diff_par incoerente")
        positions = [int(r["posizione"]) for r in sub]
        if 1 not in positions:
            fail(f"match {mid}: nessun vincitore (posizione 1)")
        new_matches.append((mid, exp_date, first["titolo_video"].strip(),
                            f"https://youtu.be/{exp_yt}", exp_yt,
                            int(first["par_totale"]), exp_channel, sub))
        existing_youtube_ids.add(exp_yt)

    missing = sorted(set(EXPECTED_NEW) - {m[0] for m in new_matches})
    if missing:
        fail(f"match attesi ma assenti nel CSV: {missing}")
    return new_matches


def extract_ts_const(src, name):
    m = re.search(r"export const " + name + r"[^=]*= (\{.*?\}|\[.*?\]);", src, re.DOTALL)
    if not m:
        fail(f"costante {name} non trovata in golfatineData.ts")
    return json.loads(m.group(1))


def enrich_match(m):
    """Stessa derivazione di scripts/generate_verified_data.py + channel."""
    m_id = m["id"]
    for p in m["players"]:
        non_null = [h for h in p["holes"] if h is not None]
        p["holeCount"] = len(non_null)
        p["hios"] = sum(1 for h in non_null if h == 1)
        p["disasters"] = sum(1 for h in non_null if h >= 10)
        p["capped"] = sum(1 for h in non_null if h >= 14)
        p["bestHole"] = min(non_null) if non_null else None
        p["worstHole"] = max(non_null) if non_null else None

    m["players"].sort(key=lambda p: (p["position"], p["totalScore"]))
    winners = [p["name"] for p in m["players"] if p["position"] == 1]
    winner_str = " e ".join(winners)
    best_player = m["players"][0]
    worst_player = m["players"][-1]
    total_hios = sum(p["hios"] for p in m["players"])
    max_hole = max(p["worstHole"] for p in m["players"] if p["worstHole"] is not None)
    diff_text = f"{best_player['diffPar']:+d}" if best_player["diffPar"] != 0 else "PAR"

    if m_id == 1:
        comment = f"Trionfo inaugurale di Delux con un favoloso {diff_text}! Dread e GaBBo pagano dazio con buche da 14 colpi alla ricerca disperata del Progetto Gabbiness."
    elif m_id == 2:
        comment = "La partita dei record folli con il nuovo standard di regole! GaBBo chiude a 181 colpi (+95) entrando nella leggenda dello sdrogo, vince Just Rohn."
    elif m_id == 3:
        comment = "Compleanno memorabile con GaBBo che domina a sorpresa a -5 dal par (38 colpi)! Mollu in tilt completo a buca 13."
    elif m_id == 11:
        comment = "La primissima Golfatina non si scorda mai: Masseo detta legge a -14 (45 colpi) e piazza buche perfette sul green."
    elif m_id == 29:
        comment = "Prestazione mostruosa di Delux che sigla il record storico di -30 sotto il par (44 colpi su par 74)! Giocata da cineteca."
    elif m_id == 38:
        comment = "Tensione alle stelle e frecciatine: Just Rohn vince a -12 al fotofinish su Dread e Delux appaiati al 2° posto a -11."
    elif m_id == 56:
        comment = "Delux in stato di grazia nella mappa del castello chiude con uno sbalorditivo 35 (-24 dal par) e una precisione da manuale."
    elif len(winners) > 1:
        comment = f"Pareggio epico al vertice tra {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)! Finale al cardiopalma."
    elif max_hole >= 14:
        comment = f"Vittoria di {winner_str} ({diff_text}). Partita segnata da buche maledette con picchi fino a {max_hole} colpi per {worst_player['name']}!"
    elif total_hios >= 5:
        comment = f"Festival dell'Hole-in-One! Ben {total_hios} buche in 1 colpo registrate in totale. {winner_str} chiude al 1° posto."
    else:
        comment = f"Grande scontro su mappa da par {m['totalPar']}: vince {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)."

    m["winner"] = winner_str
    m["winningScore"] = best_player["totalScore"]
    m["winningDiffPar"] = best_player["diffPar"]
    m["mvp"] = best_player["name"]
    m["asino"] = worst_player["name"]
    m["totalHIOs"] = total_hios
    m["maxHoleScore"] = max_hole
    m["sdrogoCommentary"] = comment
    return m


def build_new_match(mid, date, title, url, yt_id, par, channel, rows):
    players = []
    for r in rows:
        players.append({
            "name": r["giocatore"].strip(),
            "position": int(r["posizione"]),
            "totalScore": int(r["punteggio_totale"]),
            "diffPar": int(r["diff_par"]),
            "holes": parse_holes(r),
        })
    return enrich_match({
        "id": mid,
        "date": date,
        "title": title,
        "url": url,
        "youtubeId": yt_id,
        "channel": channel,
        "totalPar": par,
        "players": players,
    })


# Chiavi statistiche ricalcolate (le chiavi lore restano intoccate).
STAT_KEYS = ["matchesPlayed", "wins", "winRate", "podiums", "podiumRate", "avgScore",
             "avgDiffPar", "bestScore", "worstScore", "bestDiffPar", "worstDiffPar",
             "totalHoles", "totalHIOs", "hioRate", "totalTwos", "totalThrees",
             "totalDisasters", "totalCapped", "nemesis"]


def recompute_player_stats(players_data, matches_list):
    for p_name, entry in players_data.items():
        p_matches = []
        for m in matches_list:
            for p in m["players"]:
                if p["name"] == p_name:
                    p_matches.append((m, p))
                    break
        if not p_matches:
            entry.update({k: 0 for k in STAT_KEYS if k != "nemesis"})
            entry["winRate"] = 0.0
            entry["podiumRate"] = 0.0
            entry["hioRate"] = 0
            entry["nemesis"] = "Nessuno (Dominatore)"
            continue
        total_played = len(p_matches)
        wins = sum(1 for _, p in p_matches if p["position"] == 1)
        podiums = sum(1 for _, p in p_matches if p["position"] in [1, 2, 3])
        total_score = sum(p["totalScore"] for _, p in p_matches)
        total_diff = sum(p["diffPar"] for _, p in p_matches)
        all_holes = [h for _, p in p_matches for h in p["holes"] if h is not None]
        nemesis_counts = {}
        for m, p in p_matches:
            for other in m["players"]:
                if other["name"] != p_name and other["position"] < p["position"]:
                    nemesis_counts[other["name"]] = nemesis_counts.get(other["name"], 0) + 1
        total_holes = len(all_holes)
        hios = sum(1 for h in all_holes if h == 1)
        entry["matchesPlayed"] = total_played
        entry["wins"] = wins
        entry["winRate"] = round(wins / total_played * 100, 1)
        entry["podiums"] = podiums
        entry["podiumRate"] = round(podiums / total_played * 100, 1)
        entry["avgScore"] = round(total_score / total_played, 1)
        entry["avgDiffPar"] = round(total_diff / total_played, 1)
        entry["bestScore"] = min(p["totalScore"] for _, p in p_matches)
        entry["worstScore"] = max(p["totalScore"] for _, p in p_matches)
        entry["bestDiffPar"] = min(p["diffPar"] for _, p in p_matches)
        entry["worstDiffPar"] = max(p["diffPar"] for _, p in p_matches)
        entry["totalHoles"] = total_holes
        entry["totalHIOs"] = hios
        entry["hioRate"] = round(hios / total_holes * 100, 1) if total_holes else 0
        entry["totalTwos"] = sum(1 for h in all_holes if h == 2)
        entry["totalThrees"] = sum(1 for h in all_holes if h == 3)
        entry["totalDisasters"] = sum(1 for h in all_holes if h >= 10)
        entry["totalCapped"] = sum(1 for h in all_holes if h >= 14)
        entry["nemesis"] = max(nemesis_counts.items(), key=lambda x: x[1])[0] if nemesis_counts else "Nessuno (Dominatore)"
    # Nuovi giocatori mai visti: profilo base (non atteso per 62-82).
    seen = set()
    for m in matches_list:
        for p in m["players"]:
            seen.add(p["name"])
    for name in sorted(seen - set(players_data)):
        fail(f"giocatore sconosciuto senza lore: {name}")
    return players_data


def recompute_h2h(players_data, matches_list):
    matrix = {}
    plist = list(players_data.keys())
    for p1 in plist:
        matrix[p1] = {}
        for p2 in plist:
            if p1 == p2:
                continue
            shared, w1, w2, draws, s1, s2 = [], 0, 0, 0, 0, 0
            for m in matches_list:
                e1 = next((p for p in m["players"] if p["name"] == p1), None)
                e2 = next((p for p in m["players"] if p["name"] == p2), None)
                if e1 and e2:
                    shared.append(m["id"])
                    s1 += e1["totalScore"]
                    s2 += e2["totalScore"]
                    if e1["position"] < e2["position"]:
                        w1 += 1
                    elif e2["position"] < e1["position"]:
                        w2 += 1
                    else:
                        draws += 1
            matrix[p1][p2] = {
                "sharedMatches": len(shared),
                "p1Wins": w1,
                "p2Wins": w2,
                "draws": draws,
                "p1AvgScore": round(s1 / len(shared), 1) if shared else 0,
                "p2AvgScore": round(s2 / len(shared), 1) if shared else 0,
                "sharedMatchIds": shared,
            }
    return matrix


TS_TEMPLATE = """// Master Verified Dataset for Lo Sdrogo Golfometro (Synchronized with Official PDF)

export interface PlayerScorecard {{
  name: string;
  position: number;
  totalScore: number;
  diffPar: number;
  holes: (number | null)[];
  holeCount: number;
  hios: number;
  disasters: number;
  capped: number;
  bestHole: number | null;
  worstHole: number | null;
}}

export interface GolfatinaMatch {{
  id: number;
  date: string;
  title: string;
  url: string;
  youtubeId: string;
  channel: string;
  totalPar: number;
  winner: string;
  winningScore: number;
  winningDiffPar: number;
  mvp: string;
  asino: string;
  totalHIOs: number;
  maxHoleScore: number;
  sdrogoCommentary: string;
  players: PlayerScorecard[];
}}

export interface PlayerProfile {{
  name: string;
  nickname: string;
  badge: string;
  color: string;
  accent: string;
  avatar: string;
  quote: string;
  bio: string;
  radar: {{
    precisione: number;
    clutch: number;
    sdroganza: number;
    tiltControl: number;
    fortuna: number;
  }};
  matchesPlayed: number;
  wins: number;
  winRate: number;
  podiums: number;
  podiumRate: number;
  avgScore: number;
  avgDiffPar: number;
  bestScore: number;
  worstScore: number;
  bestDiffPar: number;
  worstDiffPar: number;
  totalHoles: number;
  totalHIOs: number;
  hioRate: number;
  totalTwos: number;
  totalThrees: number;
  totalDisasters: number;
  totalCapped: number;
  nemesis: string;
  aliases?: string[];
  iconicMemes?: string[];
}}

export interface H2HRecord {{
  sharedMatches: number;
  p1Wins: number;
  p2Wins: number;
  draws: number;
  p1AvgScore: number;
  p2AvgScore: number;
  sharedMatchIds: number[];
}}

export interface GlobalSummary {{
  totalMatches: number;
  totalVideos: number;
  totalScorecards: number;
  totalHolesPlayed: number;
  totalHIOs: number;
  totalDisasters: number;
  mostWinsPlayer: string;
  bestDiffParRecord: number;
  worstScoreRecord: number;
}}

export const GLOBAL_SUMMARY: GlobalSummary = {summary};

export const PLAYERS_DATA: Record<string, PlayerProfile> = {players};

export const H2H_DATA: Record<string, Record<string, H2HRecord>> = {h2h};

export const PLAYERS_LIST: PlayerProfile[] = Object.values(PLAYERS_DATA);

export const MATCHES_DATA: GolfatinaMatch[] = {matches};
"""


def with_channel(old_matches):
    """Aggiunge channel ai match 1-61 in posizione stabile (dopo youtubeId)."""
    for m in old_matches:
        yt = m.get("youtubeId") or youtube_id(m.get("url", ""))
        if yt not in CHANNEL_BY_YOUTUBE_ID_OLD:
            fail(f"canale sconosciuto per match {m['id']} (youtubeId {yt})")
        new_m = {}
        for k, v in m.items():
            new_m[k] = v
            if k == "youtubeId":
                new_m["channel"] = CHANNEL_BY_YOUTUBE_ID_OLD[yt]
        m.clear()
        m.update(new_m)
    return old_matches


def order_match_keys(m):
    order = ["id", "date", "title", "url", "youtubeId", "channel", "totalPar",
             "players", "winner", "winningScore", "winningDiffPar", "mvp",
             "asino", "totalHIOs", "maxHoleScore", "sdrogoCommentary"]
    return {k: m[k] for k in order if k in m}


def update_clean_csv(new_matches):
    with open(CLEAN_CSV_PATH, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = list(reader.fieldnames or [])
        rows = list(reader)
    # Fix URL corrotte (underscore diventato spazio in 5 video).
    fixed = 0
    for r in rows:
        yt = youtube_id(r["url_video"])
        for full_id in list(CHANNEL_BY_YOUTUBE_ID_OLD) + [e[1] for e in EXPECTED_NEW.values()]:
            if full_id.startswith(yt) and full_id != yt and " " in r["url_video"]:
                r["url_video"] = f"https://youtu.be/{full_id}"
                fixed += 1
                break
    existing_ids = {int(r["match_id"]) for r in rows}
    added = 0
    for (mid, date, title, url, yt_id, par, channel, sub) in new_matches:
        if mid in existing_ids:
            fail(f"golfatine_clean.csv contiene gia' il match {mid}")
        for r in sub:
            out = {k: (r.get(k) or "") for k in fieldnames}
            out["match_id"] = str(mid)
            out["data_video"] = date
            out["titolo_video"] = title
            out["url_video"] = url
            out["par_totale"] = str(par)
            for i in range(1, 19):
                val = (r.get(f"b{i}") or "").strip()
                out[f"b{i}"] = val if val not in ("", "0") else ""
            rows.append(out)
            added += 1
    rows.sort(key=lambda r: (int(r["match_id"]), int(r["posizione"])))
    clean_rows = [{k: (r.get(k) if r.get(k) is not None else "") for k in fieldnames} for r in rows]
    with open(CLEAN_CSV_PATH, "w", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        w.writeheader()
        w.writerows(clean_rows)
    return fixed, added


def main():
    print("1) Carico golfatineData.ts attuale...")
    with open(TS_PATH, encoding="utf-8") as f:
        src = f.read()
    old_summary = extract_ts_const(src, "GLOBAL_SUMMARY")
    players_data = extract_ts_const(src, "PLAYERS_DATA")
    old_matches = extract_ts_const(src, "MATCHES_DATA")
    print(f"   {len(old_matches)} match, {len(players_data)} giocatori")

    print("2) Valido il CSV 62-82 contro la lista-golfatine...")
    new_rows = load_new_csv(NEW_CSV_PATH)
    existing_yt = {m.get("youtubeId") or youtube_id(m.get("url", "")) for m in old_matches}
    new_matches = validate_and_group_new(new_rows, set(existing_yt))
    print(f"   OK: {len(new_matches)} nuovi match validati")

    print("3) Aggiungo channel ai match 1-61 e integro i nuovi...")
    old_matches = with_channel(old_matches)
    built = [build_new_match(*nm) for nm in new_matches]
    matches_list = sorted(old_matches + built, key=lambda m: m["id"])
    matches_list = [order_match_keys(m) for m in matches_list]

    print("4) Ricalcolo statistiche giocatori, H2H e riepilogo...")
    players_data = recompute_player_stats(players_data, matches_list)
    h2h = recompute_h2h(players_data, matches_list)
    summary = {
        "totalMatches": len(matches_list),
        "totalVideos": TOTAL_VIDEOS,
        "totalScorecards": sum(len(m["players"]) for m in matches_list),
        "totalHolesPlayed": sum(p["totalHoles"] for p in players_data.values()),
        "totalHIOs": sum(p["totalHIOs"] for p in players_data.values()),
        "totalDisasters": sum(p["totalDisasters"] for p in players_data.values()),
        "mostWinsPlayer": max(players_data.values(), key=lambda p: p["wins"])["name"],
        "bestDiffParRecord": min(m["winningDiffPar"] for m in matches_list),
        "worstScoreRecord": max(p["worstScore"] for p in players_data.values()),
    }

    print("5) Scrivo golfatineData.ts...")
    dump = lambda o: json.dumps(o, indent=2, ensure_ascii=False)
    with open(TS_PATH, "w", encoding="utf-8") as f:
        f.write(TS_TEMPLATE.format(summary=dump(summary), players=dump(players_data),
                                   h2h=dump(h2h), matches=dump(matches_list)))

    print("6) Aggiorno golfatine_clean.csv...")
    fixed, added = update_clean_csv(new_matches)

    print(f"FATTO: {len(matches_list)} match con scorecard ({old_summary['totalMatches']} -> {len(matches_list)}), "
          f"{summary['totalScorecards']} scorecard, {added} righe aggiunte al CSV, {fixed} URL storiche corrette.")
    print(f"Riepilogo: vittorie leader {summary['mostWinsPlayer']}, record {summary['bestDiffParRecord']} dal par.")


if __name__ == "__main__":
    main()
