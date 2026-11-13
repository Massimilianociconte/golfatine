# Bot golfatine (aggiornamento automatico da YouTube)

Il bot sostituisce il giro manuale DOCX/PDF: controlla i canali, trova la
classifica finale nel video, la legge, aggiorna dati + forecast, testa e
pubblica. Gira da solo sul Mac ogni ora (launchd), gratis.

## Perché sul Mac e non nel cloud

Provato il 2026-11-13 su GitHub Actions: YouTube blocca i download dagli IP
dei datacenter (`Sign in to confirm you're not a bot`). Dal Mac (IP di casa)
funziona, e il Mac ha già il VLM MLX e il venv TimesFM. Serve solo che il Mac
sia acceso: se dorme, il giro parte al risveglio/login.

## Installazione (una volta)

```bash
bash automation/setup_bot.sh
```

Crea un clone dedicato in `~/.golfatine-bot/repo` (la copia di sviluppo non
viene mai toccata), collega `.venv-mlx`, installa `node_modules` e attiva
l'agente `com.golfatine.bot` (ogni ora + al login).

- Log: `~/Library/Logs/golfatine-bot.log`
- Giro a mano: `bash ~/.golfatine-bot/run.sh` (accetta i flag sotto)
- Solo candidati: `bash ~/.golfatine-bot/run.sh --list`
- Disattivare: `bash automation/setup_bot.sh --uninstall`

Dopo un giro del bot, nella copia di sviluppo fai `git pull` prima di lavorare.

## Cosa fa ogni giro

1. `git pull` del clone bot.
2. Feed RSS dei 7 canali (`scripts/youtube_watch.py`, nessuna API key).
   Candidato **forte** = titolo con "golf…"; **debole** = titolo con almeno 2
   nomi del roster (per titoli senza "golf": se non c'è classifica viene
   scartato in silenzio). Shorts scartati per durata.
3. `scripts/grab_scoreboard_frame.py`: scarica solo gli ultimi 5 minuti a 360p,
   trova l'ultima apparizione della CLASSIFICA (banda PAR verde), scarica
   pochi secondi in alta risoluzione e ritaglia 5 frame.
4. `scripts/extract_scoreboard.py` (VLM MLX) su almeno 2 frame diversi:
   accettato **solo** se due letture coincidono cella per cella, ogni riga
   passa i checksum (somma buche = totale, totale − par = diff), i nomi
   sono canonici e il numero di giocatori letti è uguale al numero di righe
   misurato in pixel nel frame (i checksum non vedono una riga mancante).
   Classifica identica a un match esistente = doppione.
5. Numerazione progressiva (#N+1…) in ordine di pubblicazione, ricalcolo
   statistiche/H2H/summary/testi, forecast TimesFM, `npm test` + `tsc`,
   commit + push su `main` → redeploy Vercel.

## Quando il bot non è sicuro

Non pubblica mai un dato dubbio. Casi tipici: classifica coperta o
illeggibile, partite a squadre, giocatori nuovi, golfatina senza classifica.

Allora salva `automation/review/<ID>.jpg` (ritaglio) e
`automation/manual/<ID>.json` (bozza), apre una **Issue GitHub** (notifica
sul telefono) e una notifica macOS. Per chiuderla, anche da GitHub web:

1. correggi le celle in `automation/manual/<ID>.json`;
2. imposta `"approved": true` (oppure `"action": "skip"` se non va integrato);
3. commit su `main`: al giro successivo il bot integra e chiude l'issue.

Un nuovo giocatore va prima aggiunto a `PLAYER_ALIASES`/`KNOWN_EXTRA_PLAYERS`
(`scripts/auto_update_golfatina.py`) e `CANONICAL` (`scripts/extract_scoreboard.py`).

## File

- `ledger.json`: decisione per ogni video visto (`integrated`, `duplicate`,
  `not_golfatina`, `short`, `skipped`, `needs_review`, `retry`). Un video
  già deciso non viene più riscaricato. `since` = data da cui guardare.
- `frames/<N>-<ID>.jpg`: ritaglio della classifica usata per il match #N
  (sostituisce lo screenshot nel DOCX).
- `review/`, `manual/`: casi da verificare (si svuotano da soli dopo l'integrazione).

I commit che toccano solo `automation/` non rifanno il deploy Vercel
(`ignoreCommand` in `vercel.json`).

## Flag

`--list`, `--only ID…`, `--limit N`, `--skip-weak`, `--no-forecast`,
`--no-commit`, `--no-push`, `--no-pull`.

Notifiche push sul telefono opzionali: imposta `GOLFATINE_NTFY_TOPIC` in
`~/.golfatine-bot/run.sh` (servizio gratuito ntfy.sh; il topic è pubblico,
sceglilo lungo e casuale).
