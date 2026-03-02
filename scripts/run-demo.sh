#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"
RUNTIME_DIR="$ROOT_DIR/.demo"

mkdir -p "$RUNTIME_DIR"

BACKEND_PID_FILE="$RUNTIME_DIR/backend.pid"
FRONTEND_PID_FILE="$RUNTIME_DIR/frontend.pid"
PORTS_FILE="$RUNTIME_DIR/ports.env"
BACKEND_LOG="$RUNTIME_DIR/backend.log"
FRONTEND_LOG="$RUNTIME_DIR/frontend.log"
BACKEND_PID=""
FRONTEND_PID=""

if [[ -f "$BACKEND_PID_FILE" || -f "$FRONTEND_PID_FILE" ]]; then
  "$ROOT_DIR/scripts/stop-demo.sh" >/dev/null 2>&1 || true
fi

ensure_env_file() {
  local app_dir="$1"
  local env_file="$app_dir/.env"
  local env_example="$app_dir/.env.example"

  if [[ ! -f "$env_file" && -f "$env_example" ]]; then
    cp "$env_example" "$env_file"
  fi
}

ensure_dependencies() {
  local app_dir="$1"
  if [[ ! -d "$app_dir/node_modules" ]]; then
    (cd "$app_dir" && npm install)
  fi
}

find_free_port() {
  local port="$1"
  while lsof -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; do
    port=$((port + 1))
  done
  echo "$port"
}

wait_for_url() {
  local url="$1"
  local timeout="$2"
  local waited=0

  while [[ $waited -lt $timeout ]]; do
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    waited=$((waited + 1))
  done
  return 1
}

ensure_env_file "$BACKEND_DIR"
ensure_env_file "$FRONTEND_DIR"
ensure_dependencies "$BACKEND_DIR"
ensure_dependencies "$FRONTEND_DIR"

BACKEND_PORT="$(find_free_port 4000)"
FRONTEND_PORT="$(find_free_port 5173)"

: >"$BACKEND_LOG"
: >"$FRONTEND_LOG"

cleanup() {
  if [[ -n "$BACKEND_PID" ]] && kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    kill "$BACKEND_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$FRONTEND_PID" ]] && kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    kill "$FRONTEND_PID" >/dev/null 2>&1 || true
  fi
  rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE" "$PORTS_FILE"
}

trap cleanup EXIT INT TERM

(
  cd "$BACKEND_DIR"
  env PORT="$BACKEND_PORT" FRONTEND_ORIGIN="http://127.0.0.1:${FRONTEND_PORT},http://localhost:${FRONTEND_PORT}" npm run dev >"$BACKEND_LOG" 2>&1
) &
BACKEND_PID=$!
echo "$BACKEND_PID" >"$BACKEND_PID_FILE"

(
  cd "$FRONTEND_DIR"
  env VITE_API_URL="http://127.0.0.1:${BACKEND_PORT}/api" npm run dev -- --host 127.0.0.1 --port "$FRONTEND_PORT" --strictPort >"$FRONTEND_LOG" 2>&1
) &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >"$FRONTEND_PID_FILE"

if ! wait_for_url "http://127.0.0.1:${BACKEND_PORT}/health" 45; then
  echo "Backend failed to start. Check: $BACKEND_LOG"
  "$ROOT_DIR/scripts/stop-demo.sh" >/dev/null 2>&1 || true
  exit 1
fi

if ! wait_for_url "http://127.0.0.1:${FRONTEND_PORT}" 45; then
  echo "Frontend failed to start. Check: $FRONTEND_LOG"
  "$ROOT_DIR/scripts/stop-demo.sh" >/dev/null 2>&1 || true
  exit 1
fi

cat >"$PORTS_FILE" <<EOF
BACKEND_PORT=$BACKEND_PORT
FRONTEND_PORT=$FRONTEND_PORT
EOF

echo "Demo started successfully."
echo "Frontend: http://127.0.0.1:${FRONTEND_PORT}"
echo "Backend health: http://127.0.0.1:${BACKEND_PORT}/health"
echo "Backend meta: http://127.0.0.1:${BACKEND_PORT}/api/meta"
echo "Login: retired.officer@example.com / ChangeMe123!"
echo "Press Ctrl+C to stop both services."
echo "Or from another terminal: npm run demo:stop"

while true; do
  if ! kill -0 "$BACKEND_PID" >/dev/null 2>&1; then
    echo "Backend exited. Check log: $BACKEND_LOG"
    exit 1
  fi
  if ! kill -0 "$FRONTEND_PID" >/dev/null 2>&1; then
    echo "Frontend exited. Check log: $FRONTEND_LOG"
    exit 1
  fi
  sleep 1
done
