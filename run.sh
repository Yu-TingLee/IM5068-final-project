#!/usr/bin/env bash
# Starts the server and the ngrok tunnel.
set -euo pipefail

cd "$(dirname "$0")"

PORT="${PORT:-8000}"
NGROK_URL="${NGROK_URL:-https://flint-jovial-rethink.ngrok-free.dev}"
export CLIENT_ORIGINS="${CLIENT_ORIGINS:-https://yu-tinglee.github.io,http://localhost:5173}"

ngrok http "$PORT" --url "$NGROK_URL" --log stdout > ngrok.log 2>&1 &
NGROK_PID=$!
trap 'kill "$NGROK_PID" 2>/dev/null || true' EXIT

sleep 2
if ! kill -0 "$NGROK_PID" 2>/dev/null; then
  echo "ngrok failed to start:" >&2
  tail -n 20 ngrok.log >&2
  exit 1
fi
echo "Tunnel: $NGROK_URL -> localhost:$PORT (log: ngrok.log, inspector: http://localhost:4040)"

cd server
uv run uvicorn app.main:app --port "$PORT"
