import csv
import json
import re
import os

with open('golfatine_clean.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

matches_dict = {}

player_lore = {
    'Just Rohn': {
        'nickname': 'Il Cecchino Sdrogo',
        'badge': 'Dominatore Assoluto',
        'color': '#3b82f6', # Blue
        'accent': 'from-blue-500 to-indigo-600',
        'avatar': '🎯',
        'quote': "Regaz, non ci credo... ho preso la traiettoria quantistica!",
        'bio': "Macchina da hole-in-one e recordman assoluto di vittorie. Quando il Rohnnino si concentra non ce n'è per nessuno, tranne quando la fisica di Golf With Your Friends decide di spedire la sua palla nello spazio.",
        'radar': {'precisione': 96, 'clutch': 92, 'sdroganza': 88, 'tiltControl': 78, 'fortuna': 85}
    },
    'Delux': {
        'nickname': 'Il Chirurgo delle Buche',
        'badge': 'Precisione Millimetrica',
        'color': '#10b981', # Emerald
        'accent': 'from-emerald-500 to-teal-600',
        'avatar': '🏌️‍♂️',
        'quote': "Pazienza, studio della pendenza e tocco morbido. È pura geometria applicata.",
        'bio': "Maestro indiscusso della regolarità e dei tiri chirurgici. Detiene il record assoluto di -30 sotto il par nella leggendaria Golfatina Invernale (#29). Letale e glaciale.",
        'radar': {'precisione': 98, 'clutch': 89, 'sdroganza': 82, 'tiltControl': 94, 'fortuna': 80}
    },
    'nonsonodread': {
        'nickname': 'Il Padrino dello Sdrogo',
        'badge': 'Creatore dell\'Universo',
        'color': '#8b5cf6', # Violet
        'accent': 'from-purple-500 to-violet-700',
        'avatar': '🍈',
        'quote': "QUESTA È LA SDROGO GOLFATINA RAGAZZI! Benvenuti all'inferno!",
        'bio': "Il cuore pulsante del gruppo e presentatore supremo di ogni Golfatina. Sempre presente su 56 match su 57, capace di tiri celestiali o disastri atomici da 16 colpi con risata isterica annessa.",
        'radar': {'precisione': 85, 'clutch': 84, 'sdroganza': 99, 'tiltControl': 75, 'fortuna': 86}
    },
    'ilMasseo': {
        'nickname': 'La Furia Veneta',
        'badge': 'Bestemmia Tattica',
        'color': '#f97316', # Orange
        'accent': 'from-orange-500 to-amber-600',
        'avatar': '⚡',
        'quote': "MA COME FA A USCIREEE?! ERA DENTRO! MANNAGGIA LA***",
        'bio': "Pura energia, decibel altissimi e imprevedibilità totale. Quando è in partita può piazzare una serie devastante di Hole-in-One o subire un tilt da 16 colpi che fa tremare i muri di casa.",
        'radar': {'precisione': 82, 'clutch': 88, 'sdroganza': 95, 'tiltControl': 55, 'fortuna': 84}
    },
    'GaBBo': {
        'nickname': 'Il Martire del Gabbiness',
        'badge': 'Progetto Gabbiness',
        'color': '#ef4444', # Red
        'accent': 'from-red-500 to-rose-700',
        'avatar': '👑',
        'quote': "Io credo fermamente nel Progetto Gabbiness, anche con 19 colpi su una buca.",
        'bio': "Eroe indiscusso dei momenti comici più leggendari. Nonostante le difficoltà su certe mappe infernali (fino a 181 colpi!), non molla mai e regala perle di intrattenimento immortali.",
        'radar': {'precisione': 70, 'clutch': 79, 'sdroganza': 96, 'tiltControl': 60, 'fortuna': 72}
    },
    'Mollu': {
        'nickname': 'Lo Stratega Silenzioso',
        'badge': 'Cecchino a Sorpresa',
        'color': '#06b6d4', # Cyan
        'accent': 'from-cyan-500 to-blue-600',
        'avatar': '🧠',
        'quote': "Voi urlate, io intanto imbucata in 1 colpo con rimbalzo a sponda.",
        'bio': "Freddo, calcolatore e incredibilmente efficace. Vanta ben 6 vittorie su sole 20 partite giocate con un win rate altissimo del 30%. Quando gioca Mollu, tutti tremano.",
        'radar': {'precisione': 90, 'clutch': 86, 'sdroganza': 78, 'tiltControl': 90, 'fortuna': 88}
    },
    'JTaz': {
        'nickname': 'L\'Outsider delle Buche',
        'badge': 'Anarchia Pura',
        'color': '#ec4899', # Pink
        'accent': 'from-pink-500 to-rose-600',
        'avatar': '🎲',
        'quote': "Tiro forte verso il vuoto e spero che la provvidenza mi aiuti.",
        'bio': "Protagonista di colpi al limite delle leggi della fisica e ribaltamenti improvvisi. Vanta una vittoria iconica nel match #13 e performance al cardiopalma.",
        'radar': {'precisione': 72, 'clutch': 76, 'sdroganza': 89, 'tiltControl': 68, 'fortuna': 82}
    },
    'Just Marzaa': {
        'nickname': 'Il Maestro Supremo',
        'badge': 'Guest Star Speciale',
        'color': '#eab308', # Yellow
        'accent': 'from-yellow-400 to-amber-600',
        'avatar': '⭐',
        'quote': "Basta poco, tocco nobile e stile napoletano sulla buca!",
        'bio': "Apparizione epica nella Golfatina #19 dei Maestri di Mazze e Palle: conquista un 2° posto leggendario a -9 con 45 colpi totali.",
        'radar': {'precisione': 88, 'clutch': 85, 'sdroganza': 92, 'tiltControl': 85, 'fortuna': 85}
    },
    'nbayungchape': {
        'nickname': 'Lo Sdrogo Acrobat',
        'badge': 'Pazzo Scatenato',
        'color': '#14b8a6', # Teal
        'accent': 'from-teal-400 to-emerald-600',
        'avatar': '🔥',
        'quote': "Saltiamo l'intera rampa e andiamo direttamente al green!",
        'bio': "Protagonista della spettacolare Golfatina #57 dove ottiene un clamoroso 2° posto a -9 dal par.",
        'radar': {'precisione': 84, 'clutch': 80, 'sdroganza': 90, 'tiltControl': 82, 'fortuna': 86}
    },
    'Fava': {
        'nickname': 'L\'Ardito del Green',
        'badge': 'Spirito Combattivo',
        'color': '#a855f7', # Purple
        'accent': 'from-purple-500 to-pink-600',
        'avatar': '🛡️',
        'quote': "Non importa quanti colpi prendo, l'importante è lo sdrogo!",
        'bio': "Ha affrontato la difficilissima mappa della Golfatina #57 con coraggio e tenacia tra rimbalzi impossibili.",
        'radar': {'precisione': 68, 'clutch': 70, 'sdroganza': 85, 'tiltControl': 75, 'fortuna': 70}
    }
}

for r in rows:
    m_id = int(r['match_id'])
    if m_id not in matches_dict:
        url_raw = r['url_video'].strip().replace(' ', '')
        yt_id_match = re.search(r'(?:youtu\.be\/|v=)([a-zA-Z0-9_-]+)', url_raw)
        yt_id = yt_id_match.group(1) if yt_id_match else ''
        
        matches_dict[m_id] = {
            'id': m_id,
            'date': r['data_video'].strip(),
            'title': r['titolo_video'].strip(),
            'url': url_raw,
            'youtubeId': yt_id,
            'totalPar': int(r['par_totale']),
            'players': []
        }
    
    holes = []
    for i in range(1, 19):
        val = r[f'b{i}'].strip()
        if val != '':
            holes.append(int(val))
        else:
            holes.append(None)
            
    non_null_holes = [h for h in holes if h is not None]
    
    p_data = {
        'name': r['giocatore'].strip(),
        'position': int(r['posizione']),
        'totalScore': int(r['punteggio_totale']),
        'diffPar': int(r['diff_par']),
        'holes': holes,
        'holeCount': len(non_null_holes),
        'hios': sum(1 for h in non_null_holes if h == 1),
        'disasters': sum(1 for h in non_null_holes if h >= 10),
        'capped': sum(1 for h in non_null_holes if h >= 14),
        'bestHole': min(non_null_holes) if non_null_holes else None,
        'worstHole': max(non_null_holes) if non_null_holes else None,
    }
    matches_dict[m_id]['players'].append(p_data)

# Process match level metadata & commentary
matches_list = []
for m_id in sorted(matches_dict.keys()):
    m = matches_dict[m_id]
    # sort players by position, then totalScore
    m['players'].sort(key=lambda p: (p['position'], p['totalScore']))
    
    winners = [p['name'] for p in m['players'] if p['position'] == 1]
    winner_str = " e ".join(winners)
    
    # MVP calculation: winner or player with most HIOs / best score
    best_player = m['players'][0]
    # Asino della partita: worst player / highest single hole
    worst_player = m['players'][-1]
    
    # Count total HIOs across all players
    total_hios = sum(p['hios'] for p in m['players'])
    
    # Worst hole score in the match
    max_hole_score = max(p['worstHole'] for p in m['players'] if p['worstHole'] is not None)
    
    # Generate custom witty commentary in authentic Italian Mela Godo lore
    diff_text = f"{best_player['diffPar']:+d}" if best_player['diffPar'] != 0 else "PAR"
    
    if m_id == 1:
        comment = f"Trionfo inaugurale di Delux con un favoloso {diff_text}! Dread e GaBBo pagano dazio con buche da 14 colpi alla ricerca disperata del Progetto Gabbiness."
    elif m_id == 2:
        comment = f"La partita dei record folli con il nuovo standard di regole! GaBBo chiude a 181 colpi (+95) entrando nella leggenda dello sdrogo, vince Just Rohn."
    elif m_id == 3:
        comment = f"Compleanno memorabile con GaBBo che domina a sorpresa a -5 dal par (38 colpi)! Mollu in tilt completo a buca 13."
    elif m_id == 11:
        comment = f"La primissima Golfatina non si scorda mai: Masseo detta legge a -14 (45 colpi) e piazza buche perfette sul green."
    elif m_id == 29:
        comment = f"Prestazione mostruosa di Delux che sigla il record storico di -30 sotto il par (44 colpi su par 74)! Giocata da cineteca."
    elif m_id == 38:
        comment = f"Tensione alle stelle e frecciatine: Just Rohn vince a -12 al fotofinish su Dread e Delux appaiati al 2° posto a -11."
    elif m_id == 56:
        comment = f"Delux in stato di grazia nella mappa del castello chiude con uno sbalorditivo 35 (-24 dal par) e una precisione da manuale."
    elif len(winners) > 1:
        comment = f"Pareggio epico al vertice tra {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)! Finale al cardiopalma."
    elif max_hole_score >= 14:
        comment = f"Vittoria di {winner_str} ({diff_text}). Partita segnata da buche maledette con picchi fino a {max_hole_score} colpi per {worst_player['name']}!"
    elif total_hios >= 5:
        comment = f"Festival dell'Hole-in-One! Ben {total_hios} buche in 1 colpo registrate in totale. {winner_str} chiude al 1° posto."
    else:
        comment = f"Grande scontro su mappa da par {m['totalPar']}: vince {winner_str} con {best_player['totalScore']} colpi ({diff_text} dal par)."

    m['winner'] = winner_str
    m['winningScore'] = best_player['totalScore']
    m['winningDiffPar'] = best_player['diffPar']
    m['mvp'] = best_player['name']
    m['asino'] = worst_player['name']
    m['totalHIOs'] = total_hios
    m['maxHoleScore'] = max_hole_score
    m['sdrogoCommentary'] = comment
    
    matches_list.append(m)

# Compute global stats per player
player_stats_map = {}
for p_name in player_lore.keys():
    # find all matches containing this player
    p_matches = []
    for m in matches_list:
        for p in m['players']:
            if p['name'] == p_name:
                p_matches.append((m, p))
                break
                
    if not p_matches:
        continue
        
    total_played = len(p_matches)
    wins = sum(1 for m, p in p_matches if p['position'] == 1)
    podiums = sum(1 for m, p in p_matches if p['position'] in [1, 2, 3])
    total_score = sum(p['totalScore'] for m, p in p_matches)
    total_diff_par = sum(p['diffPar'] for m, p in p_matches)
    
    best_score = min(p['totalScore'] for m, p in p_matches)
    worst_score = max(p['totalScore'] for m, p in p_matches)
    best_diff_par = min(p['diffPar'] for m, p in p_matches)
    worst_diff_par = max(p['diffPar'] for m, p in p_matches)
    
    all_holes = []
    for m, p in p_matches:
        all_holes.extend([h for h in p['holes'] if h is not None])
        
    total_holes = len(all_holes)
    hios = sum(1 for h in all_holes if h == 1)
    twos = sum(1 for h in all_holes if h == 2)
    threes = sum(1 for h in all_holes if h == 3)
    fours_to_nines = sum(1 for h in all_holes if 4 <= h <= 9)
    disasters = sum(1 for h in all_holes if h >= 10)
    capped = sum(1 for h in all_holes if h >= 14)
    
    lore = player_lore[p_name]
    
    # Calculate head to head nemeses
    # Who beat this player the most times?
    nemesis_counts = {}
    for m, p in p_matches:
        p_pos = p['position']
        for other in m['players']:
            if other['name'] != p_name and other['position'] < p_pos:
                nemesis_counts[other['name']] = nemesis_counts.get(other['name'], 0) + 1
    
    nemesis = max(nemesis_counts.items(), key=lambda x: x[1])[0] if nemesis_counts else "Nessuno (Dominatore)"
    
    player_stats_map[p_name] = {
        'name': p_name,
        'nickname': lore['nickname'],
        'badge': lore['badge'],
        'color': lore['color'],
        'accent': lore['accent'],
        'avatar': lore['avatar'],
        'quote': lore['quote'],
        'bio': lore['bio'],
        'radar': lore['radar'],
        'matchesPlayed': total_played,
        'wins': wins,
        'winRate': round((wins / total_played) * 100, 1),
        'podiums': podiums,
        'podiumRate': round((podiums / total_played) * 100, 1),
        'avgScore': round(total_score / total_played, 1),
        'avgDiffPar': round(total_diff_par / total_played, 1),
        'bestScore': best_score,
        'worstScore': worst_score,
        'bestDiffPar': best_diff_par,
        'worstDiffPar': worst_diff_par,
        'totalHoles': total_holes,
        'totalHIOs': hios,
        'hioRate': round((hios / total_holes) * 100, 1) if total_holes > 0 else 0,
        'totalTwos': twos,
        'totalThrees': threes,
        'totalDisasters': disasters,
        'totalCapped': capped,
        'nemesis': nemesis
    }

# Head-to-head records calculation
h2h_matrix = {}
players_list = list(player_stats_map.keys())
for p1 in players_list:
    h2h_matrix[p1] = {}
    for p2 in players_list:
        if p1 == p2:
            continue
        # Find shared matches
        shared = []
        p1_ahead = 0
        p2_ahead = 0
        draws = 0
        p1_total_score = 0
        p2_total_score = 0
        for m in matches_list:
            p1_entry = next((p for p in m['players'] if p['name'] == p1), None)
            p2_entry = next((p for p in m['players'] if p['name'] == p2), None)
            if p1_entry and p2_entry:
                shared.append(m['id'])
                p1_total_score += p1_entry['totalScore']
                p2_total_score += p2_entry['totalScore']
                if p1_entry['position'] < p2_entry['position']:
                    p1_ahead += 1
                elif p2_entry['position'] < p1_entry['position']:
                    p2_ahead += 1
                else:
                    draws += 1
        
        h2h_matrix[p1][p2] = {
            'sharedMatches': len(shared),
            'p1Wins': p1_ahead,
            'p2Wins': p2_ahead,
            'draws': draws,
            'p1AvgScore': round(p1_total_score / len(shared), 1) if shared else 0,
            'p2AvgScore': round(p2_total_score / len(shared), 1) if shared else 0,
            'sharedMatchIds': shared
        }

# Global series summary
global_summary = {
    'totalMatches': len(matches_list),
    'totalVideos': 61,
    'totalScorecards': sum(len(m['players']) for m in matches_list),
    'totalHolesPlayed': sum(p['totalHoles'] for p in player_stats_map.values()),
    'totalHIOs': sum(p['totalHIOs'] for p in player_stats_map.values()),
    'totalDisasters': sum(p['totalDisasters'] for p in player_stats_map.values()),
    'mostWinsPlayer': max(player_stats_map.values(), key=lambda p: p['wins'])['name'],
    'bestDiffParRecord': min(m['winningDiffPar'] for m in matches_list),
    'worstScoreRecord': max(p['worstScore'] for p in player_stats_map.values())
}

# Write TypeScript file
os.makedirs('src/data', exist_ok=True)
ts_content = f'''// Generated Data for Lo Sdrogo Golfometro

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

export const GLOBAL_SUMMARY: GlobalSummary = {json.dumps(global_summary, indent=2, ensure_ascii=False)};

export const PLAYERS_DATA: Record<string, PlayerProfile> = {json.dumps(player_stats_map, indent=2, ensure_ascii=False)};

export const H2H_DATA: Record<string, Record<string, H2HRecord>> = {json.dumps(h2h_matrix, indent=2, ensure_ascii=False)};

export const MATCHES_DATA: GolfatinaMatch[] = {json.dumps(matches_list, indent=2, ensure_ascii=False)};
'''

with open('src/data/golfatineData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"Generated src/data/golfatineData.ts with {len(matches_list)} matches and {len(player_stats_map)} players!")
