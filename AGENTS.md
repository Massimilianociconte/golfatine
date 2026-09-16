# Golfatine — Istruzioni agente AI (root)

> Applica questa regola OGNI volta che `lista-golfatine.docx` e/o `Lista-golfatine.pdf`
> nella root vengono aggiornati con una nuova golfatina. Eseguila integralmente,
> senza saltare passi. Via prioritaria = pipeline automatizzata qui sotto.

## 0. Via prioritaria: pipeline automatizzata

- `npm run update:check` → solo riverifica DOCX/PDF vs CSV/TS, nessuna modifica.
- `npm run update:golfatina -- --yes`
  → riverifica, canale via oEmbed, **estrazione scoreboard dallo screenshot col
  VLM locale**, integrazione dati, ricalcolo stats/H2H/summary, hardcoded,
  forecast TimesFM, `npm test` + `tsc`, commit + push su `main`
  (redeploy Vercel automatico via integrazione GitHub).
- Flag utili: `--scoreboard /tmp/sb<N>.json` (scoreboard manuale, formato §3),
  `--no-extract` (salta il VLM), `--check`, `--self-test` (pattern hardcoded),
  `--no-commit` / `--no-push`, `--watch SEC` (resta in attesa di modifiche).
- Se la pipeline fallisce su uno step, usa il dettaglio manuale §§1–7 qui sotto
  (riferimento + fallback), poi rifai comunque verifica §6 e commit §7.

## Setup ambienti (non committare mai venv, pesi, .env — vedi `.gitignore`)

- Node: `npm install`, `npm test` (vitest), `npx tsc --noEmit`, `npm run build`.
- Forecast: venv esterno `/Users/massimilianociconte/Documents/prediction/.venv`
  (Google TimesFM-3.0, CPU). Mai installare torch nel repo.
- Estrazione screenshot: `.venv-mlx` del repo
  (`python3 -m venv .venv-mlx && .venv-mlx/bin/pip install mlx-vlm pillow torchvision`),
  modello `mlx-community/Qwen2.5-VL-3B-Instruct-4bit` (scaricato in cache HF al
  primo uso, ~2GB). NB: SmolVLM 256M/500M provati e **scartati** (fondono le
  cifre adiacenti della griglia); non reinstallarli.

## Mappa repo (cosa è corrente, cosa è stato rimosso)

- Sorgenti verità: `lista-golfatine.docx`, `Lista-golfatine.pdf` (root).
- Dati sito: `golfatine_clean.csv` + `src/data/golfatineData.ts`
  (`MATCHES_DATA`, `PLAYERS_DATA`, `H2H_DATA`, `GLOBAL_SUMMARY`),
  `src/data/forecastingData.ts` (forecast), `src/data/channels.ts` (publisher).
- Script correnti: `scripts/auto_update_golfatina.py` (pipeline),
  `scripts/extract_scoreboard.py` (VLM screenshot→JSON),
  `scripts/generate_forecast_timesfm.py` (TimesFM, `NEXT_MATCH_NUMBER`),
  `scripts/integrate_golfatine_62_82.py` (libreria riusata dalla pipeline:
  `enrich_match`, `recompute_player_stats`, `recompute_h2h`, `TS_TEMPLATE`
  — NON eseguirlo direttamente).
- Rimossi perché superati/deprecati (recuperabili da git history):
  `raw_golfatine.csv`, `scripts/generate_data.py`,
  `scripts/generate_verified_data.py`, `scripts/generate_forecast.py` (deprecated),
  `scripts/generate_avatars.py`, `scripts/audit_live_db.js`,
  `scripts/test_auth_lifecycle.js`.
- Mai committare: `.env*`, `.venv-mlx/`, `__pycache__/`, `*.pyc`, `dist/`,
  `supabase/.temp/`, lock Word `~$*.docx`.

## 1. Sorgenti verità
- Root: `lista-golfatine.docx`, `Lista-golfatine.pdf` (titolo, data, link YouTube).
- Screenshot classifica finale: immagini `word/media/*.png` dentro il `.docx`
  (unzip) + `pdf2md` per il PDF:
  - `/Users/massimilianociconte/.cargo/bin/detect-pdf "Lista-golfatine.pdf" --analyze --json`
  - `/Users/massimilianociconte/.cargo/bin/pdf2md "Lista-golfatine.pdf" --compact --pages`
- Verifica canale publisher via oEmbed (MAI dedurre dal titolo):
  - `https://www.youtube.com/oembed?url=https://youtu.be/<YOUTUBE_ID>&format=json`
  - `author_name` = canale esatto (`Just Rohn JR`, `oessaM`, `Mollu`, `Delux`,
    `GaBBoDSQ`, `Around Dread`, `JTaz Extra`).

## 2. Determinare il vero ultimo video
- NON fidarsi del numero detto a voce: confrontare:
  - `cut -d, -f1 golfatine_clean.csv | sort -n | uniq | tail`
  - `grep -n '"id":' src/data/golfatineData.ts | tail`
  - coda testo estratto da DOCX/PDF.
- Se l'ultimo del DOCX/PDF è già in `MATCHES_DATA` + CSV → solo riverifica.
  Altrimenti è quello da inserire (mai fidarsi del numero detto a voce).

## 3. Estrarre scoreboard dallo screenshot
- Via prioritaria: VLM locale (`scripts/extract_scoreboard.py`, vedi §0):
  cascata full-image → terzi a confini esatti → singole celle, con gate
  checksum per riga. Mai accettare righe che non validano.
- Fallback manuale: trascrivere per ogni riga posizione, giocatore, b1..b18,
  totale, in JSON `{"par": N, "players": [{"name","position","totalScore",`
  `"diffPar","holes":[b1..b18]}]}` e passare `--scoreboard`.
- PAR riga verde = `totalPar`. Verifiche obbligatorie per ogni giocatore:
  - `sum(b1..b18) == punteggio_totale`
  - `punteggio_totale - par_totale == diff_par`
- Derivati (stessa logica di `scripts/integrate_golfatine_62_82.py`):
  - `holeCount=18`, `hios=count(1)`, `disasters=count(>=10)`,
    `capped=count(>=14)`, `bestHole=min`, `worstHole=max`
  - `winner/mvp` = posizione 1, `asino` = ultimo, `totalHIOs=sum`,
    `maxHoleScore=max(worst)`, `sdrogoCommentary` con template esistente.

## 4. Integrazione dati sito
- Aggiungere match a `src/data/golfatineData.ts` (`MATCHES_DATA`, ordinato per `id`)
  e righe a `golfatine_clean.csv` (`match_id,data_video,titolo_video,url_video,`
  `par_totale,posizione,giocatore,punteggio_totale,diff_par,b1..b18`).
- Ricalcolare (mai a mano):
  - `PLAYERS_DATA` stats (`matchesPlayed,wins,winRate,podiums,podiumRate,avgScore,`
    `avgDiffPar,best/worstScore,best/worstDiffPar,totalHoles,totalHIOs,hioRate,`
    `totalTwos,totalThrees,totalDisasters,totalCapped,nemesis`)
  - `H2H_DATA` matrice completa
  - `GLOBAL_SUMMARY`: `totalMatches=len(matches)`, `totalVideos=max(id ufficiale)`
    (missing #14–17 senza scorecard + #79 duplicato #30),
    `totalScorecards`, `totalHolesPlayed`, `totalHIOs`, `totalDisasters`,
    `mostWinsPlayer`, `bestDiffParRecord`, `worstScoreRecord`.
- Aggiornare testi hardcoded:
  - `src/components/GolfatineGrid.tsx` → `(N episodi ufficiali #1–#N)`,
    `Numerazione ufficiale episodi #1–#N • … • M scorecard complete`
  - `src/data/channels.ts` commento `tutti gli N video al YYYY-MM-DD`
  - `tests/golfatineData.test.ts` conteggi + spot-check canale nuovo video
  - `scripts/generate_forecast_timesfm.py` → `NEXT_MATCH_NUMBER = N+1`
- Scoreboard, profili giocatore, stats generali, storici, archivio video,
  conteggi e filtri video si aggiornano da soli via `MATCHES_DATA`/`GLOBAL_SUMMARY`;
  verificare comunque `LeaderboardView`, `PlayerProfilesView`, `HeadToHeadView`,
  `GolfatineGrid` (filtri canale/mese/search), `RouletteView`.

## 5. Forecasting betting (TimesFM-3.0)
- Usare SEMPRE venv prediction:
  - `/Users/massimilianociconte/Documents/prediction/.venv/bin/python scripts/generate_forecast_timesfm.py`
- Legge serie `diffPar` cronologiche da `golfatineData.ts`, horizon=1, 7 giocatori
  fissi, par mediano ultimi 10, `temperature=4.5` per winProb, odds=`1/prob*0.92`
  (min 1.20). Rigenera `src/data/forecastingData.ts` (`matchNumber=N+1`,
  quote, percentuali, probabilità reali, `aiAnalysis`, `predictedHoles[18]`).
- Sezione betting (`PredictionsAndBetView`) non ha hardcoded da toccare:
  legge `UPCOMING_MATCH_FORECAST`; verificare somma winProb ≈100 e `q10<=mean<=q90`.

## 6. Verifica prima del commit
- `npm test` (vitest, 23 test) verde.
- `npx tsc --noEmit` verde se toccati tipi.
- Controllo diff: nuovo `id`, 5 righe CSV, summary, forecast `#N+1`.

## 7. Commit & push
- Repo `Documents/golfatine` → branch `main`, commit
  `feat: golfatina #N – <TITOLO> (<DATA>) + forecast TimesFM #N+1`.
- Push `main` su GitHub. Mai committare `.env*` (vedi `.gitignore`).
