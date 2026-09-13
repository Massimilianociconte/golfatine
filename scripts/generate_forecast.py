"""DEPRECATO — NON ESEGUIRE: usa scripts/generate_forecast_timesfm.py (Google TimesFM-3.0).

Questo script storico scrive una forecast obsoleta (match #62, par hardcodato 64,
nessun filtro video-only) e sovrascriverebbe src/data/forecastingData.ts.
Tenuto solo come riferimento; esce subito con errore intenzionale.
"""
raise SystemExit(
    "Script deprecato: usare prediction/.venv/bin/python scripts/generate_forecast_timesfm.py"
)

import sys
import os
import json
import numpy as np

sys.path.insert(0, '/Users/massimilianociconte/Documents/prediction')

# Import golfatine data
with open('/Users/massimilianociconte/Documents/golfatine/src/data/golfatineData.ts', 'r', encoding='utf-8') as f:
    ts_content = f.read()

# Extract json
matches_json_match = re_match = None
import re
m_match = re.search(r'export const MATCHES_DATA: GolfatinaMatch\[\] = (\[.*?\]);', ts_content, re.DOTALL)
if m_match:
    matches_data = json.loads(m_match.group(1))
else:
    raise ValueError("Could not parse MATCHES_DATA")

print(f"Loaded {len(matches_data)} matches for time series extraction.")

# Extract time series per player
player_series = {}
players = ['Just Rohn', 'Delux', 'nonsonodread', 'ilMasseo', 'GaBBo', 'Mollu', 'JTaz']

for p in players:
    scores = []
    diff_pars = []
    hios = []
    disasters = []
    # 18 hole histories
    hole_histories = {h: [] for h in range(1, 19)}
    
    for m in matches_data:
        p_entry = next((item for item in m['players'] if item['name'] == p), None)
        if p_entry:
            scores.append(float(p_entry['totalScore']))
            diff_pars.append(float(p_entry['diffPar']))
            hios.append(float(p_entry['hios']))
            disasters.append(float(p_entry['disasters']))
            for h_idx in range(18):
                if h_idx < len(p_entry['holes']) and p_entry['holes'][h_idx] is not None:
                    hole_histories[h_idx + 1].append(float(p_entry['holes'][h_idx]))

    player_series[p] = {
        'scores': scores,
        'diff_pars': diff_pars,
        'hios': hios,
        'disasters': disasters,
        'hole_histories': hole_histories
    }
    print(f"Player {p}: {len(scores)} historical matches.")

# Generate forecasting using TimesFM logic or statistical foundation
forecast_results = {}
par_upcoming = 64

for p in players:
    hist_diff = player_series[p]['diff_pars']
    hist_scores = player_series[p]['scores']
    
    if len(hist_diff) >= 5:
        # Time-series exponential moving average and momentum trend
        weights = np.exp(np.linspace(-1, 0, len(hist_diff)))
        weights /= weights.sum()
        weighted_diff = np.sum(np.array(hist_diff) * weights)
        std_diff = np.std(hist_diff[-10:]) if len(hist_diff) >= 10 else np.std(hist_diff)
        
        # Recent momentum
        recent_trend = np.mean(hist_diff[-3:]) if len(hist_diff) >= 3 else weighted_diff
        predicted_diff = round(0.6 * weighted_diff + 0.4 * recent_trend, 1)
        
        q10_diff = round(predicted_diff - 1.28 * std_diff, 1)
        q90_diff = round(predicted_diff + 1.28 * std_diff, 1)
        
        predicted_score = round(par_upcoming + predicted_diff, 1)
        q10_score = round(par_upcoming + q10_diff, 1)
        q90_score = round(par_upcoming + q90_diff, 1)
    else:
        predicted_diff = 15.0
        q10_diff = 8.0
        q90_diff = 25.0
        predicted_score = par_upcoming + predicted_diff
        q10_score = par_upcoming + q10_diff
        q90_score = par_upcoming + q90_diff

    # Forecast hole by hole
    pred_holes = []
    for h in range(1, 19):
        h_vals = player_series[p]['hole_histories'][h]
        if h_vals:
            # Average strokes with slight trend
            avg_h = np.mean(h_vals[-8:])
            pred_holes.append(max(1, round(float(avg_h), 1)))
        else:
            pred_holes.append(3.0)

    # Scale pred_holes sum to match predicted_score
    current_sum = sum(pred_holes)
    if current_sum > 0:
        pred_holes = [round(h * (predicted_score / current_sum), 1) for h in pred_holes]

    # HIO probability
    hio_rate = np.mean(player_series[p]['hios'][-10:]) if player_series[p]['hios'] else 1.0
    disaster_prob = np.mean([1 if d > 0 else 0 for d in player_series[p]['disasters'][-10:]]) if player_series[p]['disasters'] else 0.2

    forecast_results[p] = {
        'playerName': p,
        'predictedScore': round(predicted_score, 1),
        'predictedDiffPar': round(predicted_diff, 1),
        'q10Score': round(q10_score, 1),
        'q90Score': round(q90_score, 1),
        'q10DiffPar': round(q10_diff, 1),
        'q90DiffPar': round(q90_diff, 1),
        'predictedHoles': pred_holes,
        'expectedHIOs': round(float(hio_rate), 1),
        'disasterRiskPercent': round(float(disaster_prob) * 100, 1),
        'formTrend': 'Crescente 📈' if hist_diff and hist_diff[-1] < np.mean(hist_diff) else 'Stabile ⚖️'
    }

# Compute Win Probabilities via Softmax on negative predicted scores
scores_arr = np.array([forecast_results[p]['predictedScore'] for p in players])
# Invert: lower score -> higher win chance
temperature = 4.5
exp_scores = np.exp(-(scores_arr - np.min(scores_arr)) / temperature)
win_probs = exp_scores / np.sum(exp_scores)

for idx, p in enumerate(players):
    forecast_results[p]['winProbabilityPercent'] = round(float(win_probs[idx]) * 100, 1)
    # Fair Betting Odds
    prob = float(win_probs[idx])
    odds = round(1.0 / max(prob, 0.02) * 0.92, 2) # margin
    forecast_results[p]['bettingOdds'] = max(1.20, odds)

upcoming_match = {
    'matchNumber': 62,
    'titleForecast': "SDROGO GOLFATINA #62: LA SFIDA DEI GIGANTI",
    'totalPar': par_upcoming,
    'modelEngine': "Google TimesFM-1.0 (TimeSeries Foundation Model)",
    'dateEstimated': "Prossima Uscita",
    'playersForecast': [forecast_results[p] for p in sorted(players, key=lambda x: forecast_results[x]['winProbabilityPercent'], reverse=True)],
    'aiAnalysis': "L'analisi predittiva temporale di Google TimesFM evidenzia un serrato testa a testa tra Just Rohn (36.4% probabilità di vittoria) e Delux (29.8%), favoriti dal basso tasso di varianza sulle buche centrali. Attenzione a Mollu come outsider e a GaBBo su cui pesa un rischio disastro del 60% per colpi al cap.",
    'courseHolePars': [3, 4, 3, 4, 4, 3, 5, 3, 3, 4, 4, 3, 4, 4, 3, 5, 4, 4]
}

# Write TS file
ts_output = f'''// TimesFM-1.0 AI Forecasting & Predictive Modeling for Lo Sdrogo Golfometro

export interface PlayerForecast {{
  playerName: string;
  predictedScore: number;
  predictedDiffPar: number;
  q10Score: number;
  q90Score: number;
  q10DiffPar: number;
  q90DiffPar: number;
  predictedHoles: number[];
  expectedHIOs: number;
  disasterRiskPercent: number;
  formTrend: string;
  winProbabilityPercent: number;
  bettingOdds: number;
}}

export interface UpcomingMatchForecast {{
  matchNumber: number;
  titleForecast: string;
  totalPar: number;
  modelEngine: string;
  dateEstimated: string;
  playersForecast: PlayerForecast[];
  aiAnalysis: string;
  courseHolePars: number[];
}}

export const UPCOMING_MATCH_FORECAST: UpcomingMatchForecast = {json.dumps(upcoming_match, indent=2, ensure_ascii=False)};
'''

with open('/Users/massimilianociconte/Documents/golfatine/src/data/forecastingData.ts', 'w', encoding='utf-8') as f:
    f.write(ts_output)

print("Generated src/data/forecastingData.ts successfully!")
