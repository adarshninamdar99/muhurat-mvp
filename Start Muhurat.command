#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Double-click this file (in Finder) to start Muhurat for a demo.
# It updates the app, prepares it, and opens it in your browser.
# Keep the Terminal window open while you present. Close it to stop.
# ─────────────────────────────────────────────────────────────

cd "$(dirname "$0")" || exit 1

# Find Node.js (Homebrew, nvm or the nodejs.org installer).
export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" >/dev/null 2>&1

stop() {
  echo
  echo "Something went wrong (see the message above)."
  read -r -p "Press Enter to close this window."
  exit 1
}

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js is not installed. Install the LTS version from https://nodejs.org, then double-click this file again."
  stop
fi

echo "Starting Muhurat…"
echo

# Stop any earlier copy of the app still running.
pkill -f "next-server" >/dev/null 2>&1
pkill -f "next dev" >/dev/null 2>&1
pkill -f "next start" >/dev/null 2>&1

# Settings file: created from the example the first time (demo mode).
[ -f .env.local ] || cp .env.example .env.local

echo "1/3  Getting the latest version…"
git pull --ff-only || echo "     (Couldn't update. Using the copy already on this Mac.)"

echo "2/3  Installing…"
npm install --no-audit --no-fund --loglevel=error || stop

echo "3/3  Preparing the app (about a minute)…"
npm run build >/tmp/muhurat-build.log 2>&1 || { tail -30 /tmp/muhurat-build.log; stop; }

echo
echo "Ready. Opening http://localhost:3000"
echo "Keep this window open while you present. Close it to stop the app."
echo
(sleep 4 && open "http://localhost:3000") &
npm start
