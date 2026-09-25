"""Previsioni per la prossima golfatina con Google TimesFM-3.0 (foundation model).

Legge le serie storiche (diff dal par, ordine cronologico) da
src/data/golfatineData.ts, esegue TimesFMManager.forecast (horizon=1) per
ognuno dei 7 giocatori principali e scrive src/data/forecastingData.ts.

Uso:  /Users/massimilianociconte/Documents/prediction/.venv/bin/python \\
        scripts/generate_forecast_timesfm.py
"""

import json
import os
import re
import statistics
import sys

import numpy as np

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PREDICTION_ROOT = "/Users/massimilianociconte/Documents/prediction"
TS_DATA = os.path.join(PROJECT_ROOT, "src", "data", "golfatineData.ts")
TS_OUT = os.path.join(PROJECT_ROOT, "src", "data", "forecastingData.ts")

sys.path.insert(0, PREDICTION_ROOT)
from src.models_manager import TimesFMManager  # noqa: E402

MODEL = "google/timesfm-3.0-pytorch"
PLAYERS = ["Just Rohn", "Delux", "nonsonodread", "ilMasseo", "GaBBo", "Mollu", "JTaz"]
NEXT_MATCH_NUMBER = 93


def main():
    with open(TS_DATA, encoding="utf-8") as f:
        src = f.read()
    m = re.search(r"export const MATCHES_DATA: GolfatinaMatch\[\] = (\[.*?\]);", src, re.DOTALL)
    matches = json.loads(m.group(1))
    # Solo match con scorecard reale (esclude video-only 83-84 con players=[] / hasScorecard=false)
    matches = [x for x in matches if x.get("hasScorecard", True) is not False and len(x.get("players", [])) > 0 and int(x.get("totalPar", 0)) > 0]
    print(f"Match con scorecard: {len(matches)}")

    chrono = sorted(matches, key=lambda x: (x["date"], x["id"]))
    recent_pars = [x["totalPar"] for x in chrono[-10:]]
    par_upcoming = int(round(statistics.median(recent_pars)))
    print(f"Par mediano ultimi 10 match: {par_upcoming} (da {recent_pars})")

    forecasts = {}
    for p in PLAYERS:
        series = []
        hole_hist = {h: [] for h in range(1, 19)}
        hios, disasters = [], []
        for mt in chrono:
            entry = next((q for q in mt["players"] if q["name"] == p), None)
            if entry:
                series.append(float(entry["diffPar"]))
                hios.append(float(entry["hios"]))
                disasters.append(float(entry["disasters"]))
                for idx, val in enumerate(entry["holes"]):
                    if val is not None:
                        hole_hist[idx + 1].append(float(val))
        print(f"{p}: {len(series)} presenze")
        if len(series) < 5:
            raise RuntimeError(f"serie troppo corta per {p}")

        res = TimesFMManager.forecast(
            series_data=np.asarray(series, dtype=np.float32),
            horizon=1,
            model_name=MODEL,
            return_quantiles=True,
            device="cpu",
        )
        mean_diff = round(float(res["mean"][0]), 1)
        q = np.asarray(res["quantiles"])
        q10 = round(float(q[0, 0]), 1)
        q90 = round(float(q[0, 8]), 1)

        pred_holes = []
        for h in range(1, 19):
            vals = hole_hist[h]
            pred_holes.append(max(1.0, round(float(np.mean(vals[-8:])), 1)) if vals else 3.0)
        total = sum(pred_holes)
        if total > 0:
            target = par_upcoming + mean_diff
            pred_holes = [round(h * (target / total), 1) for h in pred_holes]

        mean_hist = float(np.mean(series))
        if series[-1] < mean_hist - 1:
            trend = "Crescente \U0001F4C8"
        elif series[-1] > mean_hist + 1:
            trend = "In calo \U0001F4C9"
        else:
            trend = "Stabile \u2696\uFE0F"

        forecasts[p] = {
            "playerName": p,
            "predictedScore": round(par_upcoming + mean_diff, 1),
            "predictedDiffPar": mean_diff,
            "q10Score": round(par_upcoming + q10, 1),
            "q90Score": round(par_upcoming + q90, 1),
            "q10DiffPar": q10,
            "q90DiffPar": q90,
            "predictedHoles": pred_holes,
            "expectedHIOs": round(float(np.mean(hios[-10:])), 1),
            "disasterRiskPercent": round(float(np.mean([1 if d > 0 else 0 for d in disasters[-10:]])) * 100, 1),
            "formTrend": trend,
        }
        print(f"  -> diff {mean_diff} (p10 {q10} / p90 {q90}), score {forecasts[p]['predictedScore']}")

    scores = np.array([forecasts[p]["predictedScore"] for p in PLAYERS])
    temperature = 4.5
    exp_scores = np.exp(-(scores - scores.min()) / temperature)
    win_probs = exp_scores / exp_scores.sum()
    for i, p in enumerate(PLAYERS):
        prob = float(win_probs[i])
        forecasts[p]["winProbabilityPercent"] = round(prob * 100, 1)
        forecasts[p]["bettingOdds"] = max(1.20, round(1.0 / max(prob, 0.02) * 0.92, 2))

    ranked = sorted(PLAYERS, key=lambda x: forecasts[x]["winProbabilityPercent"], reverse=True)
    fav, second = ranked[0], ranked[1]
    outsider = min(ranked, key=lambda x: forecasts[x]["disasterRiskPercent"])
    riskiest = max(ranked, key=lambda x: forecasts[x]["disasterRiskPercent"])
    analysis = (
        f"L'analisi TimesFM-3.0 su {len(matches)} match indica {fav} favorito "
        f"({forecasts[fav]['winProbabilityPercent']}% di probabilita' di vittoria) davanti a {second} "
        f"({forecasts[second]['winProbabilityPercent']}%). {outsider} e' il profilo piu' solido "
        f"(rischio disastro {forecasts[outsider]['disasterRiskPercent']}%), mentre su {riskiest} pesa "
        f"un rischio disastro del {forecasts[riskiest]['disasterRiskPercent']}%."
    )

    upcoming = {
        "matchNumber": NEXT_MATCH_NUMBER,
        "titleForecast": f"SDROGO GOLFATINA #{NEXT_MATCH_NUMBER}: LA SFIDA DEI GIGANTI",
        "totalPar": par_upcoming,
        "modelEngine": "Google TimesFM-3.0 (TimeSeries Foundation Model)",
        "dateEstimated": "Prossima Uscita",
        "playersForecast": [forecasts[p] for p in ranked],
        "aiAnalysis": analysis,
        "courseHolePars": [3, 4, 3, 4, 4, 3, 5, 3, 3, 4, 4, 3, 4, 4, 3, 5, 4, 4],
    }

    ts = """// Google TimesFM-3.0 AI Forecasting for Lo Sdrogo Golfometro

export interface PlayerForecast {
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
}

export interface UpcomingMatchForecast {
  matchNumber: number;
  titleForecast: string;
  totalPar: number;
  modelEngine: string;
  dateEstimated: string;
  playersForecast: PlayerForecast[];
  aiAnalysis: string;
  courseHolePars: number[];
}

export const UPCOMING_MATCH_FORECAST: UpcomingMatchForecast = %s;
""" % json.dumps(upcoming, indent=2, ensure_ascii=False)

    with open(TS_OUT, "w", encoding="utf-8") as f:
        f.write(ts)
    print(f"Scritto {TS_OUT} (match #{NEXT_MATCH_NUMBER}, par {par_upcoming})")


if __name__ == "__main__":
    main()
