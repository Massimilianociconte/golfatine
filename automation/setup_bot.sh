#!/bin/bash
# Installa (o aggiorna) il bot golfatine sul Mac. Idempotente: rilancialo quando vuoi.
#
#   bash automation/setup_bot.sh            # installa + attiva il giro orario
#   bash automation/setup_bot.sh --no-load  # prepara tutto ma non attiva launchd
#   bash automation/setup_bot.sh --uninstall
#
# Cosa fa:
#   - clone dedicato del repo in ~/.golfatine-bot/repo (la tua copia di
#     sviluppo non viene mai toccata dal bot);
#   - collega il venv MLX di questa copia (.venv-mlx) e installa node_modules;
#   - scrive ~/.golfatine-bot/run.sh e l'agente launchd com.golfatine.bot
#     (ogni GOLFATINE_BOT_INTERVAL secondi, default 3600, e al login).
# Log: ~/Library/Logs/golfatine-bot.log
set -euo pipefail

DEV_REPO="$(cd "$(dirname "$0")/.." && pwd)"
BOT_HOME="$HOME/.golfatine-bot"
BOT_REPO="$BOT_HOME/repo"
LABEL="com.golfatine.bot"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/golfatine-bot.log"
INTERVAL="${GOLFATINE_BOT_INTERVAL:-3600}"
REPO_URL="https://github.com/Massimilianociconte/golfatine.git"
UID_NUM="$(id -u)"

if [ "${1:-}" = "--uninstall" ]; then
  launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
  rm -f "$PLIST"
  echo "agente $LABEL rimosso (il clone in $BOT_REPO resta: rm -rf $BOT_HOME per eliminarlo)"
  exit 0
fi

for bin in git python3 ffmpeg ffprobe yt-dlp deno; do
  command -v "$bin" >/dev/null || { echo "manca $bin (brew install $bin)"; exit 1; }
done
[ -x "$DEV_REPO/.venv-mlx/bin/python" ] || {
  echo "manca $DEV_REPO/.venv-mlx (vedi AGENTS.md: python3 -m venv .venv-mlx && .venv-mlx/bin/pip install mlx-vlm pillow torchvision)"; exit 1; }
NPM_BIN="$(command -v npm || true)"
[ -n "$NPM_BIN" ] || { echo "manca npm"; exit 1; }
NODE_DIR="$(dirname "$NPM_BIN")"

mkdir -p "$BOT_HOME" "$(dirname "$PLIST")" "$(dirname "$LOG")"
if [ ! -d "$BOT_REPO/.git" ]; then
  git clone -q "$REPO_URL" "$BOT_REPO"
fi
git -C "$BOT_REPO" checkout -q main
git -C "$BOT_REPO" pull -q --ff-only origin main
touch "$BOT_REPO/.golfatine-bot"
ln -sfn "$DEV_REPO/.venv-mlx" "$BOT_REPO/.venv-mlx"
(cd "$BOT_REPO" && npm ci --no-audit --no-fund --silent)
shasum "$BOT_REPO/package-lock.json" | cut -d' ' -f1 > "$BOT_HOME/.lockhash"

cat > "$BOT_HOME/run.sh" <<EOF
#!/bin/bash
# Generato da automation/setup_bot.sh — un giro del bot golfatine.
export PATH="$NODE_DIR:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="$HOME"
LOG="$LOG"
if [ -f "\$LOG" ] && [ "\$(stat -f%z "\$LOG")" -gt 5000000 ]; then
  tail -c 2000000 "\$LOG" > "\$LOG.tmp" && mv "\$LOG.tmp" "\$LOG"
fi
cd "$BOT_REPO" || exit 1
git pull -q --ff-only origin main || echo "[run] git pull fallito, proseguo"
NEW_HASH="\$(shasum package-lock.json | cut -d' ' -f1)"
if [ "\$NEW_HASH" != "\$(cat "$BOT_HOME/.lockhash" 2>/dev/null)" ]; then
  npm ci --no-audit --no-fund --silent && echo "\$NEW_HASH" > "$BOT_HOME/.lockhash"
fi
exec "$BOT_REPO/.venv-mlx/bin/python" scripts/auto_youtube_golfatina.py "\$@"
EOF
chmod +x "$BOT_HOME/run.sh"

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>/bin/bash</string><string>$BOT_HOME/run.sh</string></array>
  <key>StartInterval</key><integer>$INTERVAL</integer>
  <key>RunAtLoad</key><true/>
  <key>Nice</key><integer>5</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF

if [ "${1:-}" = "--no-load" ]; then
  echo "pronto (non attivato): $BOT_REPO, $BOT_HOME/run.sh, $PLIST"
  exit 0
fi
launchctl bootout "gui/$UID_NUM/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$UID_NUM" "$PLIST"
echo "bot attivo: giro ogni $INTERVAL s (+ al login). Log: $LOG"
echo "giro manuale: bash $BOT_HOME/run.sh   |   stato: launchctl print gui/$UID_NUM/$LABEL | head"
