#!/usr/bin/env bash
# Serve the peeps site locally.
#   ./server.sh          → http://localhost:8000
#   ./server.sh 3000     → http://localhost:3000
#   ./server.sh 3000 --no-open
#
# A server is needed (rather than opening index.html directly) because copy-to-PNG,
# SVG copy and Download All fetch the local SVGs, which browsers block on file://.

set -euo pipefail

PORT="${1:-8000}"
OPEN_BROWSER=true
[[ "${2:-}" == "--no-open" || "${1:-}" == "--no-open" ]] && OPEN_BROWSER=false
[[ "${1:-}" == "--no-open" ]] && PORT=8000

cd "$(dirname "$0")"

if lsof -iTCP:"$PORT" -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Port $PORT is already in use. Try: ./server.sh $((PORT + 1))"
  exit 1
fi

URL="http://localhost:$PORT"
echo "Serving peeps at $URL  (Ctrl+C to stop)"

if $OPEN_BROWSER; then
  ( sleep 1
    if command -v open >/dev/null 2>&1; then open "$URL"
    elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$URL"
    fi ) >/dev/null 2>&1 &
fi

if command -v python3 >/dev/null 2>&1; then
  exec python3 -m http.server "$PORT" --bind 127.0.0.1
elif command -v npx >/dev/null 2>&1; then
  exec npx --yes http-server -p "$PORT" -a 127.0.0.1 -c-1
else
  echo "Need python3 or node (npx) to run a local server." >&2
  exit 1
fi
