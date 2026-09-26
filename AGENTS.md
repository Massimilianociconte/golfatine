# Golfatine — Istruzioni agente AI (root)

> Applica questa regola OGNI volta che `lista-golfatine.docx` e/o `Lista-golfatine.pdf`
> nella root vengono aggiornati con una nuova golfatina. Eseguila integralmente,
> senza saltare passi. Via prioritaria = pipeline automatizzata qui sotto (§0).
>
> Basta dire **"lancia la pipeline"**: numero del video, titolo, data, link,
> canale, scoreboard, forecast e commit vengono rilevati/calcolati da soli.
> NON serve specificare a voce numero, file, modello o passaggi: la pipeline
> auto-rileva tutto con `update:check` e abortisce se qualcosa non valida.

## 0. Via prioritaria: pipeline automatizzata (1 comando)

```bash
npm run update:check                 # solo riverifica DOCX/PDF vs CSV/TS, nessuna modifica
npm run update:golfatina -- --yes    # TUTTO: riverifica → oEmbed → VLM → dati → forecast → test → commit + push
```

Cosa fa `update:golfatina -- --yes`, sempre negli stessi 8 passi (vedi
`scripts/auto_update_golfatina.py`):
1. Riverifica DOCX + PDF (titolo, data, link) vs CSV vs `golfatineData.ts`.
   Se l'ultimo video è già integrato → solo riverifica, nessuna modifica.
2. Estrae titolo/data/link del video nuovo; verifica il canale publisher
   via oEmbed (mai dedotto dal titolo).
3. Estrae dallo `.docx` l'ultimo screenshot classifica e lo trascrive da solo
   col VLM locale (Qwen2.5-VL-3B su MLX, `scripts/extract_scoreboard.py`):
   validazione checksum per riga (`sum==totale`), retry su terzi/celle,
   mai indovinare (fallback: draft + abort).
4. Integra `MATCHES_DATA` + `golfatine_clean.csv` e ricalcola `PLAYERS_DATA`,
   `H2H_DATA`, `GLOBAL_SUMMARY` (stessa logica di `integrate_golfatine_62_82.py`).
5. Aggiorna gli hardcoded (`GolfatineGrid`, `channels.ts`, test, `NEXT_MATCH_NUMBER`).
6. Rigenera il forecast TimesFM-3.0 col venv di `Documents/prediction` e lo valida.
7. Verifica con `npm test` + `npx tsc --noEmit`.
8. Commit + push su `main` (mai `.env*`/pycache) → redeploy Vercel automatico.

- Flag utili: `--scoreboard /tmp/sb<N>.json` (scoreboard manuale, formato §3),
  `--image <png>` (usa uno screenshot diverso dall'ultimo embed),
  `--ocr-draft` (stampa bozza tesseract da verificare a mano),
  `--no-extract` (salta il VLM: richiede `--scoreboard` manuale),
  `--check` (+ `--verify` = check + test/tsc), `--self-test` (pattern hardcoded),
  `--no-commit` / `--no-push`, `--no-forecast`,
  `--watch SEC` (resta in attesa e rilancia quando DOCX/PDF cambiano).
- Se la pipeline fallisce su uno step, usare il dettaglio manuale §§1–7 qui sotto
  (riferimento + fallback), poi rifare comunque verifica §6 e commit §7.
- L'estrazione automatica gestisce **un video nuovo alla volta**; con più video
  nuovi passare `--scoreboard` JSON mappato per id (`{"89": {...}, "90": {...}}`).

## Setup ambienti (non committare mai venv, pesi, .env — vedi `.gitignore`)

- Node: `npm install`, `npm test` (vitest), `npx tsc --noEmit`, `npm run build`.
- Forecast: venv esterno `/Users/massimilianociconte/Documents/prediction/.venv`
  (Google TimesFM-3.0, CPU). Mai installare torch nel repo.
- Estrazione screenshot: `.venv-mlx` del repo
  (`python3 -m venv .venv-mlx && .venv-mlx/bin/pip install mlx-vlm pillow torchvision`),
  modello `mlx-community/Qwen2.5-VL-3B-Instruct-4bit` (scaricato in cache HF al
  primo uso, ~2GB). NB: SmolVLM 256M/500M provati e **scartati** (fondono le
  cifre adiacenti della griglia); non reinstallarli.
- Opzionale per bozza OCR: `tesseract` con lingue `ita+eng` (solo `--ocr-draft`,
  output sempre da verificare a mano).

## Mappa repo (cosa è corrente, cosa è stato rimosso)

- Sorgenti verità: `lista-golfatine.docx`, `Lista-golfatine.pdf` (root).
- Dati sito: `golfatine_clean.csv` + `src/data/golfatineData.ts`
  (`MATCHES_DATA`, `PLAYERS_DATA`, `H2H_DATA`, `GLOBAL_SUMMARY`),
  `src/data/forecastingData.ts` (forecast), `src/data/channels.ts` (publisher).
- Thumbnail/card video: derivate da sole dallo `youtubeId`
  (`MatchCard.tsx` → `https://i.ytimg.com/vi/<ID>/mqdefault.jpg`,
  `MatchModal.tsx` embed `youtube-nocookie`, `SocialShareModal.tsx`).
  Nessun file immagine da produrre o committare per i nuovi video.
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
- Untracked ricorrenti dopo ogni run (ignorare, sono in `.gitignore`):
  `supabase/.temp/`, `~$sta-golfatine.docx` (lock di Word: chiudere Word se resta).

## 1. Sorgenti verità

### Passo 1 — Analizzare `lista-golfatine.docx` (titolo, data, link YouTube)

1. Il `.docx` è uno zip: il testo sta in `word/document.xml` (tag `<w:t>`).
   La pipeline lo legge con `docx_raw_text()`; a mano:
   `python3 -c "import zipfile,re; z=zipfile.ZipFile('lista-golfatine.docx'); ..."`
2. Le voci sono numerate `N. TITOLO … DATA … LINK`. La pipeline le parsa con
   `parse_entries()`: regex YouTube `(youtu.be/|youtube.com/watch?v=)`,
   data italiana `D Mese YYYY` (se manca l'anno → anno corrente `2026`),
   titolo = testo prima del link ripulito da data e prefisso `Canale:`.
3. Annotarsi per **ogni voce nuova**: numero ufficiale, titolo pulito,
   data ISO, URL canonico `https://youtu.be/<ID>`, YouTube ID.

### Passo 2 — Analizzare `Lista-golfatine.pdf` e confrontarlo col DOCX

1. Classificare/convertire col tool PDF Inspector (default per i PDF locali):
   - `/Users/massimilianociconte/.cargo/bin/detect-pdf "Lista-golfatine.pdf" --analyze --json`
   - `/Users/massimilianociconte/.cargo/bin/pdf2md "Lista-golfatine.pdf" --compact --pages`
   (la pipeline usa solo il secondo via `pdf_raw_text()`, con fallback "solo DOCX"
   se `pdf2md` manca o fallisce).
2. Parsare le voci con le stesse regole del Passo 1.
3. Confrontare DOCX vs PDF voce per voce: a parità di numero lo `youtube_id`
   deve coincidere, altrimenti è errore nei sorgenti → correggere il documento
   e NON proseguire. Nota: il PDF può essere indietro di qualche voce
   (es. 22 voci vs 26 nel DOCX): vale il DOCX; se una voce manca nel PDF,
   la pipeline logga `avviso: #N assente nel PDF (uso DOCX)` e prosegue.
4. Controllo anti-buco (indipendente dalla numerazione): ogni URL nei documenti
   deve esistere nei dati, a parte i duplicati noti (§"Casi speciali") e le voci
   numerate oltre `max(CSV,TS)` (= quelle da integrare). URL orfani → aggiungere
   la voce numerata nel DOCX oppure estendere `KNOWN_DUPLICATE_YT` nello script.

### Passo 3 — Determinare il vero ultimo video (MAI fidarsi del numero detto a voce)

Confrontare tutti e tre:
- `cut -d, -f1 golfatine_clean.csv | sort -n | uniq | tail`
- `grep -n '"id":' src/data/golfatineData.ts | tail`
- coda testo estratto da DOCX/PDF (Passi 1–2).
- Se l'ultimo del DOCX/PDF è già in `MATCHES_DATA` + CSV → solo riverifica,
  nessuna modifica. Altrimenti è quello da inserire.

### Passo 4 — Verificare il canale publisher via oEmbed (MAI dedurre dal titolo)

- `https://www.youtube.com/oembed?url=https://youtu.be/<YOUTUBE_ID>&format=json`
- `author_name` = canale esatto. Canali noti (`KNOWN_CHANNELS`):
  `Just Rohn JR`, `oessaM`, `Mollu`, `Delux`, `GaBBoDSQ`, `Around Dread`, `JTaz Extra`.
- Fallback manuale: se oEmbed è irraggiungibile o il canale è nuovo/sconosciuto,
  aprire il video e leggere il canale dalla pagina YouTube; se è un canale nuovo
  legittimo, aggiungerlo a `KNOWN_CHANNELS` in `scripts/auto_update_golfatina.py`
  e alla lista qui sopra, poi rilanciare.

## 2. Screenshot classifica: estrazione scoreboard col modello di visione

### Passo 5 — Estrarre lo screenshot classifica dal DOCX

- Le immagini stanno in `word/media/*.png` dentro il `.docx`. Fa fede **l'ordine
  di embed** (`word/_rels/document.xml.rels` + `r:embed` in `document.xml`,
  funzione `docx_embed_order()`), NON l'ordine alfabetico dei file:
  l'ultimo embed = classifica del video più recente.
- La pipeline lo salva in `/tmp/golfatine_pipe/scoreboard_ultima.png`
  (`extract_latest_image()`); con `--image <png>` se ne usa un altro.
- Lo screenshot del PDF NON si usa per l'estrazione (risoluzione inferiore):
  il PDF serve solo per titolo/data/link (Passo 2).

### Passo 6 — Trascrivere punteggio totale + ogni buca per ogni giocatore (VLM)

- Via prioritaria: VLM locale (`scripts/extract_scoreboard.py` via `.venv-mlx`):
  ```bash
  .venv-mlx/bin/python scripts/extract_scoreboard.py <screenshot.png> --out /tmp/sb<N>.json
  ```
  Cascata full-image → terzi a confini esatti → singole celle, con gate
  checksum per riga. Mai accettare righe che non validano (mai indovinare).
- Fallback manuale (`--scoreboard` + `--no-extract`, oppure `--ocr-draft` come
  base da correggere a mano): trascrivere per ogni riga posizione, giocatore,
  b1..b18, totale, in JSON:
  `{"par": N, "players": [{"name","position","totalScore","diffPar","holes":[b1..b18]}]}`
  (più video: `{"89": {...}, "90": {...}}`).
- PAR = riga verde in alto = `totalPar`.
- Nomi giocatori: usare SEMPRE i canonici (§"Nomi canonici"). La pipeline
  NON normalizza: se VLM/trascrizione produce varianti, correggere il JSON
  prima di integrare.

### Passo 7 — Validare lo scoreboard (checksum obbligatori, per ogni giocatore)

- Esattamente 18 valori buca per giocatore.
- `sum(b1..b18) == punteggio_totale`, altrimenti riga da rifare.
- `punteggio_totale - par_totale == diff_par`, altrimenti riga da rifare.
- Derivati calcolati da `enrich_match` (stessa logica di
  `scripts/integrate_golfatine_62_82.py`, mai a mano):
  - `holeCount=18`, `hios=count(1)`, `disasters=count(>=10)`,
    `capped=count(>=14)`, `bestHole=min`, `worstHole=max`
  - `winner/mvp` = posizione 1, `asino` = ultimo, `totalHIOs=sum`,
    `maxHoleScore=max(worst)`, `sdrogoCommentary` con template esistente.

## 3. Integrazione dati sito (CSV storico + TS + ricalcoli)

### Passo 8 — Aggiornare `golfatine_clean.csv` (storico di tutte le buche)

- Una riga per giocatore: `match_id,data_video,titolo_video,url_video,`
  `par_totale,posizione,giocatore,punteggio_totale,diff_par,b1..b18`.
- Righe ordinate per `(match_id, posizione)`. Mai duplicare un `match_id`
  esistente (la pipeline abortisce se già presente).
- Il CSV è lo storico completo buca-per-buca di tutti i giocatori di tutti
  i video: ogni nuova golfatina aggiunge solo le sue N righe giocatore.

### Passo 9 — Aggiungere il match a `MATCHES_DATA` in `src/data/golfatineData.ts`

- Oggetto match ordinato per `id`: `id, date, title, url, youtubeId, channel,
  totalPar, players[]` + derivati di `enrich_match` (Passo 7).
- Mai riusare uno `youtubeId` già presente (abort).
- `title` = titolo pulito dal DOCX (fallback: titolo oEmbed se vuoto).

### Passo 10 — Ricalcolare statistiche (MAI a mano, sempre via script)

- `PLAYERS_DATA`: `matchesPlayed,wins,winRate,podiums,podiumRate,avgScore,`
  `avgDiffPar,best/worstScore,best/worstDiffPar,totalHoles,totalHIOs,hioRate,`
  `totalTwos,totalThrees,totalDisasters,totalCapped,nemesis`
  (`recompute_player_stats`).
- `H2H_DATA`: matrice completa (`recompute_h2h`).
- `GLOBAL_SUMMARY`: `totalMatches=len(matches)`, `totalVideos=max(id ufficiale)`
  (vedi casi speciali), `totalScorecards`, `totalHolesPlayed`, `totalHIOs`,
  `totalDisasters`, `mostWinsPlayer`, `bestDiffParRecord`, `worstScoreRecord`.
- Da questi discendono da soli, senza toccare codice: scoreboard del video
  (`MatchCard`/`MatchModal`), profili giocatore (`PlayerProfilesView`), stats
  generali, leaderboard, storici, H2H, conteggi e filtri archivio
  (`LeaderboardView`, `HeadToHeadView`, `GolfatineGrid`, `RouletteView`).

### Passo 11 — Aggiornare i testi hardcoded (pattern in `update_hardcoded()`)

- `src/components/GolfatineGrid.tsx` → `(N episodi ufficiali #1–#N)`,
  `Numerazione ufficiale episodi #1–#N • … • M scorecard complete`
  (nota: `M` = scorecard complete, non video).
- `src/data/channels.ts` commento `tutti gli N video al YYYY-MM-DD`.
- `tests/golfatineData.test.ts`: id attesi + spot-check canale nuovo video
  + `matchNumber` forecast `#N+1`.
- `scripts/generate_forecast_timesfm.py` → `NEXT_MATCH_NUMBER = N+1`.
- Verifica pattern: `npm run update:golfatina -- --self-test` (tutto OK, nessuna modifica).

## 4. Forecasting betting (TimesFM-3.0 in `Documents/prediction`)

### Passo 12 — Lanciare il modello e aggiornare quote + dati predetti

```bash
/Users/massimilianociconte/Documents/prediction/.venv/bin/python scripts/generate_forecast_timesfm.py
```

- Usa SEMPRE il venv di `Documents/prediction` (mai installare torch nel repo).
- Parametri fissi: modello `google/timesfm-3.0-pytorch` (CPU), serie `diffPar`
  cronologiche da `golfatineData.ts`, `horizon=1`, 7 giocatori fissi
  (`Just Rohn, Delux, nonsonodread, ilMasseo, GaBBo, Mollu, JTaz`),
  par upcoming = mediano `totalPar` ultimi 10 match, `temperature=4.5` per winProb,
  odds = `1/prob*0.92` (min 1.20). Esclusi i match video-only senza scorecard
  (`hasScorecard=false` / `players=[]`).
- Rigenera `src/data/forecastingData.ts` (`matchNumber=N+1`, quote, percentuali,
  probabilità reali `q10/mean/q90`, `aiAnalysis`, `predictedHoles[18]`,
  `expectedHIOs` = media ultimi 10, `disasterRiskPercent` = % match con
  disastri ultimi 10).
- La sezione betting (`PredictionsAndBetView`) non ha hardcoded: legge
  `UPCOMING_MATCH_FORECAST`. Verifiche: somma winProb ≈100 (99–101),
  `q10<=mean<=q90` per ogni giocatore, `predictedHoles==18`.

## 5. Card video, thumbnail, verifica, commit

### Passo 13 — Verificare la card del nuovo video (thumbnail, click, stats)

- La card si genera da sola dal nuovo oggetto `MATCHES_DATA`: thumbnail
  `https://i.ytimg.com/vi/<youtubeId>/mqdefault.jpg`, click → modale con
  scoreboard buca-per-buca, filtri canale/mese/search.
- Verifiche manuali (sito locale `npm run dev` o deploy preview):
  1. la card del video #N è in archivio con thumbnail corretta e caricata
     (se 404: `youtubeId` errato o video privato/non elencato → verificare);
  2. il click apre scoreboard con totali e buche corrette (confronto §Passo 7);
  3. profili giocatori, H2H, stats generali e sezione betting riflettono il
     nuovo match; conteggi episodi/scorecard aggiornati.

### Passo 14 — Verifica prima del commit (obbligatoria)

- `npm test` (vitest, 23 test) verde.
- `npx tsc --noEmit` verde se toccati tipi.
- Controllo diff: nuovo `id`, N righe CSV (= n° giocatori), summary,
  forecast `#N+1`, hardcoded §Passo 11. Mai `.env*` nello stage
  (la pipeline rifiuta il commit se presenti).

## 6. Commit & push

- Repo `Documents/golfatine` → branch `main` (la pipeline abortisce se non sei su `main`).
- Commit: `feat: golfatina #N – <TITOLO> (<DATA>) + forecast TimesFM #N+1`
  (più video: `feat: golfatine #A-#B (K video) + forecast TimesFM #B+1`).
- File committati (`COMMIT_FILES`): `golfatine_clean.csv`, `lista-golfatine.docx`,
  `Lista-golfatine.pdf`, `scripts/generate_forecast_timesfm.py`,
  `scripts/extract_scoreboard.py`, `src/components/GolfatineGrid.tsx`,
  `src/data/channels.ts`, `src/data/forecastingData.ts`,
  `src/data/golfatineData.ts`, `tests/golfatineData.test.ts`,
  `scripts/auto_update_golfatina.py`, `package.json`.
- Push `main` su GitHub → redeploy Vercel automatico via integrazione GitHub.
- Dopo il push, verificare sul dashboard Vercel che il deploy dal nuovo commit
  sia andato a verde (build log in caso di rosso).

### Rollback (se qualcosa è andato storto dopo il push)

```bash
git revert HEAD --no-edit && git push origin main   # via sicura (redeploy automatico)
```
Mai `reset --force` su `main` condiviso col deploy.

## Nomi canonici giocatori (alias visti nei titoli)

Canonica → varianti da normalizzare nello scoreboard JSON prima di integrare:
- `Just Rohn` ← Rohn nei titoli (canale video: `Just Rohn JR`)
- `nonsonodread` ← Dread nei titoli (canale video: `Around Dread`)
- `GaBBo` ← Gabbo nei titoli (canale video: `GaBBoDSQ`)
- `ilMasseo` ← Masseo nei titoli
- `Delux` (canale video: `Delux`), `Mollu` (canale video: `Mollu`),
  `JTaz` (canale video: `JTaz Extra`); canale video `oessaM` = archivio Masseo
- Comparse extra non fisse (es. `CannucciaBianca`, Paolo, Cannuccia): entrano nello
  scoreboard del singolo match ma NON nei 7 fissi del forecast.
- Canale video ≠ nome giocatore: il canale si verifica via oEmbed (Passo 4), mai dal titolo.

## Casi speciali noti (non sono bug)

- #14–17: video senza scorecard (mai integrati come match con buche).
- #79 = duplicato del video #30 (`KNOWN_DUPLICATE_YT = {"efppNZh_4UA"}`): escluso
  dai controlli anti-buco, NON reinserire.
- Video-only senza scorecard (es. #83–84: `players=[]`, `hasScorecard=false`):
  contano in `totalMatches`/`totalVideos` ma sono esclusi dal forecast TimesFM.
- `totalPar` storici anomali (es. 45, 145: formati speciali a squadre/buche ridotte):
  il par upcoming è la mediana degli ultimi 10, robusta agli outlier — non correggerli.
- Formati non a 18 buche: `load_scoreboard` richiede 18 valori (abort); se un futuro
  video ha un formato diverso, aggiornare validazione + `enrich_match` prima di integrare.
