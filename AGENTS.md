# Golfatine — Regola di aggiornamento nuova golfatina (root)

> Questa regola si applica OGNI volta che `lista-golfatine.docx` e/o `Lista-golfatine.pdf`
> nella root vengono aggiornati con una nuova golfatina. Va eseguita integralmente,
> senza saltare passi.
>
> **Esegui i passi 1–7 con la pipeline automatizzata** (stessi controlli, stesso
> formato commit messaggio):
> - `npm run update:check` → solo riverifica, nessuna modifica.
> - `npm run update:golfatina -- --yes`
>   → riverifica DOCX/PDF, oEmbed canale, estrazione scoreboard dallo screenshot
>   col VLM locale (Qwen2.5-VL-3B su MLX, `.venv-mlx`, gate checksum per riga),
>   integra, ricalcola stats/H2H/summary, aggiorna hardcoded, forecast TimesFM,
>   test+tsc, commit+push su `main` (redeploy Vercel automatico).
> - Override manuale se il VLM fallisce: trascrivere lo scoreboard in JSON
>   (`{"par": N, "players": [{"name","position","totalScore","diffPar","holes":[b1..b18]}]}`)
>   e passare `--scoreboard /tmp/sb<N>.json` (o `--no-extract`).
> - Dettaglio manuale dei passi sotto (riferimento / fallback se la pipeline fallisce).

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
  Altrimenti è quello da inserire (es. 87 già presente → inserire 88
  `LA GOLFATINA SURREALE … 2026-09-12 https://youtu.be/II1Wo61nTvc`, canale `Mollu`).

## 3. Estrarre scoreboard dallo screenshot
- Trascrivere per ogni riga: posizione, giocatore, b1..b18, totale.
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
    (88 → 88; missing #14–17 senza scorecard + #79 duplicato #30),
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
