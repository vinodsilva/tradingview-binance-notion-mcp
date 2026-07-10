#!/bin/bash
# Watchdog — keeps TradingView Desktop + MCP server running 24/7
# Usage: ./scripts/watchdog.sh start|stop|status|restart

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
LOGS_DIR="$PROJECT_DIR/logs"
WATCHDOG_LOG="$LOGS_DIR/watchdog.log"
PID_FILE="$LOGS_DIR/watchdog.pid"
TV_PID_FILE="$LOGS_DIR/tradingview.pid"
MCP_PID_FILE="$LOGS_DIR/mcp.pid"
VSCODE_PID_FILE="$LOGS_DIR/vscode.pid"

PORT=9222
CHECK_INTERVAL=15
MAX_RESTARTS=5
RESTART_WINDOW=600
PROJECT_NAME="tradingview-mcp"

mkdir -p "$LOGS_DIR"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$WATCHDOG_LOG"
}

find_tradingview() {
  LOCATIONS=(
    "/Applications/TradingView.app/Contents/MacOS/TradingView"
    "$HOME/Applications/TradingView.app/Contents/MacOS/TradingView"
  )
  for loc in "${LOCATIONS[@]}"; do
    if [ -f "$loc" ]; then
      echo "$loc"
      return 0
    fi
  done
  APP=$(mdfind "kMDItemCFBundleIdentifier == 'com.niceincontact.TradingView'" 2>/dev/null | head -1)
  if [ -n "$APP" ] && [ -f "$APP/Contents/MacOS/TradingView" ]; then
    echo "$APP/Contents/MacOS/TradingView"
    return 0
  fi
  APP=$(find /Applications "$HOME/Applications" -name "TradingView.app" -maxdepth 2 2>/dev/null | head -1)
  if [ -n "$APP" ] && [ -f "$APP/Contents/MacOS/TradingView" ]; then
    echo "$APP/Contents/MacOS/TradingView"
    return 0
  fi
  return 1
}

is_tv_running() {
  if [ -f "$TV_PID_FILE" ]; then
    local pid
    pid=$(cat "$TV_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  local pids
  pids=$(pgrep -f "TradingView.*remote-debugging" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    local first
    first=$(echo "$pids" | head -1)
    echo "$first" > "$TV_PID_FILE"
    return 0
  fi
  return 1
}

is_cdp_alive() {
  curl -s "http://localhost:$PORT/json/version" > /dev/null 2>&1
  return $?
}

is_mcp_running() {
  if [ -f "$MCP_PID_FILE" ]; then
    local pid
    pid=$(cat "$MCP_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  return 1
}

start_tradingview() {
  local app
  app=$(find_tradingview)
  if [ -z "$app" ]; then
    log "ERROR: TradingView not found. Cannot start."
    return 1
  fi

  log "Starting TradingView from: $app"
  "$app" --remote-debugging-port="$PORT" &
  local pid=$!
  echo "$pid" > "$TV_PID_FILE"
  log "TradingView PID: $pid"

  for i in $(seq 1 30); do
    if is_cdp_alive; then
      log "CDP ready at http://localhost:$PORT (after ${i}s)"
      return 0
    fi
    sleep 1
  done

  log "WARNING: CDP not responding after 30s — TV may still be loading"
  return 0
}

start_mcp() {
  log "Starting MCP server: node src/server.js"
  cd "$PROJECT_DIR"
  nohup node src/server.js > "$LOGS_DIR/mcp.log" 2>&1 &
  local pid=$!
  echo "$pid" > "$MCP_PID_FILE"
  log "MCP server PID: $pid"
  sleep 2

  if kill -0 "$pid" 2>/dev/null; then
    log "MCP server started successfully"
    return 0
  else
    log "ERROR: MCP server failed to start"
    return 1
  fi
}

stop_tradingview() {
  log "Stopping TradingView..."
  if [ -f "$TV_PID_FILE" ]; then
    local pid
    pid=$(cat "$TV_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
      for i in $(seq 1 10); do
        if ! kill -0 "$pid" 2>/dev/null; then break; fi
        
        sleep 1
      done
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  pkill -f "TradingView.*remote-debugging" 2>/dev/null || true
  rm -f "$TV_PID_FILE"
  log "TradingView stopped"
}

stop_mcp() {
  log "Stopping MCP server..."
  if [ -f "$MCP_PID_FILE" ]; then
    local pid
    pid=$(cat "$MCP_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ]; then
      kill "$pid" 2>/dev/null || true
      for i in $(seq 1 5); do
        if ! kill -0 "$pid" 2>/dev/null; then break; fi
        sleep 1
      done
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi
  rm -f "$MCP_PID_FILE"
  log "MCP server stopped"
}

find_vscode() {
  local paths=(
    "/Applications/Visual Studio Code.app/Contents/MacOS/Electron"
    "/Applications/VSCodium.app/Contents/MacOS/Electron"
    "/usr/local/bin/code"
    "/opt/homebrew/bin/code"
  )
  for loc in "${paths[@]}"; do
    if [ -f "$loc" ]; then
      echo "$loc"
      return 0
    fi
  done
  which code 2>/dev/null || return 1
}

is_vscode_running() {
  if [ -f "$VSCODE_PID_FILE" ]; then
    local pid
    pid=$(cat "$VSCODE_PID_FILE" 2>/dev/null)
    if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
      return 0
    fi
  fi
  local pids
  pids=$(pgrep -f "Visual Studio Code" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    local first
    first=$(echo "$pids" | head -1)
    echo "$first" > "$VSCODE_PID_FILE"
    return 0
  fi
  pids=$(pgrep -f "Electron.*tradingview-mcp" 2>/dev/null || true)
  if [ -n "$pids" ]; then
    local first
    first=$(echo "$pids" | head -1)
    echo "$first" > "$VSCODE_PID_FILE"
    return 0
  fi
  return 1
}

start_vscode() {
  local app
  app=$(find_vscode)
  if [ -z "$app" ]; then
    log "VS Code not found. Skipping restart."
    return 1
  fi
  log "Restarting VS Code..."
  if [[ "$app" == *"/Electron" ]]; then
    open -a "Visual Studio Code" "$PROJECT_DIR"
  else
    "$app" "$PROJECT_DIR" &
  fi
  local pid=$!
  echo "$pid" > "$VSCODE_PID_FILE"
  log "VS Code restart initiated"
  return 0
}

crash_loop_detected() {
  local recent
  recent=$(grep "Restarting TradingView" "$WATCHDOG_LOG" 2>/dev/null | tail -"$MAX_RESTARTS" | head -1)
  if [ -z "$recent" ]; then
    return 1
  fi
  local recent_time
  recent_time=$(echo "$recent" | sed 's/\[\(.*\)\].*/\1/')
  local now
  now=$(date '+%Y-%m-%d %H:%M:%S')
  local diff_sec
  if date --version >/dev/null 2>&1; then
    local r_epoch n_epoch
    r_epoch=$(date -d "$recent_time" +%s 2>/dev/null || echo 0)
    n_epoch=$(date -d "$now" +%s 2>/dev/null || echo 0)
    diff_sec=$((n_epoch - r_epoch))
  else
    local r_epoch_ms n_epoch_ms
    r_epoch_ms=$(date -j -f "%Y-%m-%d %H:%M:%S" "$recent_time" +%s 2>/dev/null || echo 0)
    n_epoch_ms=$(date -j -f "%Y-%m-%d %H:%M:%S" "$now" +%s 2>/dev/null || echo 0)
    diff_sec=$((n_epoch_ms - r_epoch_ms))
  fi

  if [ "$diff_sec" -lt "$RESTART_WINDOW" ]; then
    local count
    count=$(grep "Restarting TradingView" "$WATCHDOG_LOG" 2>/dev/null | tail -"$MAX_RESTARTS" | wc -l | tr -d ' ')
    if [ "$count" -ge "$MAX_RESTARTS" ]; then
      return 0
    fi
  fi
  return 1
}

watchdog_loop() {
  log "==================================="
  log "Watchdog started"
  log "Check interval: ${CHECK_INTERVAL}s"
  log "Max restarts: $MAX_RESTARTS in ${RESTART_WINDOW}s"
  log "==================================="

  local tv_ok=false
  local mcp_ok=false
  local vscode_ok=false

  while true; do
    if ! is_tv_running; then
      if crash_loop_detected; then
        log "CRASH LOOP DETECTED — too many restarts. Watchdog stopping."
        log "Manually check TradingView and restart watchdog."
        exit 1
      fi
      log "TradingView not running. Restarting..."
      start_tradingview
      tv_ok=true
    elif ! is_cdp_alive; then
      log "TradingView process exists but CDP port $PORT not responding. Restarting..."
      stop_tradingview
      sleep 3
      if crash_loop_detected; then
        log "CRASH LOOP DETECTED — too many restarts. Watchdog stopping."
        exit 1
      fi
      start_tradingview
    else
      if [ "$tv_ok" = false ]; then
        log "TradingView OK (PID: $(cat "$TV_PID_FILE" 2>/dev/null || echo 'unknown'))"
        tv_ok=true
      fi
    fi

    if ! is_mcp_running; then
      log "MCP server not running. Restarting..."
      start_mcp
      mcp_ok=true
    else
      if [ "$mcp_ok" = false ]; then
        log "MCP server OK (PID: $(cat "$MCP_PID_FILE" 2>/dev/null || echo 'unknown'))"
        mcp_ok=true
      fi
    fi

    if ! is_vscode_running; then
      log "VS Code not running. Restarting..."
      start_vscode
      vscode_ok=true
    else
      if [ "$vscode_ok" = false ]; then
        log "VS Code OK (PID: $(cat "$VSCODE_PID_FILE" 2>/dev/null || echo 'unknown'))"
        vscode_ok=true
      fi
    fi

    sleep "$CHECK_INTERVAL"
  done
}

cleanup() {
  log ""
  log "Shutting down watchdog..."
  stop_mcp
  log "Watchdog stopped"
  rm -f "$PID_FILE"
  exit 0
}

case "${1:-}" in
  start)
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
      echo "Watchdog already running (PID: $(cat "$PID_FILE"))"
      exit 1
    fi
    trap cleanup SIGINT SIGTERM
    nohup "$0" _loop > /dev/null 2>&1 &
    pid=$!
    echo "$pid" > "$PID_FILE"
    echo "Watchdog started (PID: $pid)"
    echo "Logs: $WATCHDOG_LOG"
    ;;
  stop)
    stop_tradingview
    stop_mcp
    if [ -f "$PID_FILE" ]; then
      pid=$(cat "$PID_FILE" 2>/dev/null)
      kill "$pid" 2>/dev/null || true
      rm -f "$PID_FILE"
    fi
    echo "Watchdog stopped"
    ;;
  status)
    echo "=== Watchdog Status ==="
    if [ -f "$PID_FILE" ] && kill -0 "$(cat "$PID_FILE" 2>/dev/null)" 2>/dev/null; then
      echo "Watchdog: RUNNING (PID: $(cat "$PID_FILE"))"
    else
      echo "Watchdog: STOPPED"
    fi
    echo ""
    echo "--- TradingView ---"
    if is_tv_running; then
      tv_pid=$(cat "$TV_PID_FILE" 2>/dev/null || echo 'unknown')
      if is_cdp_alive; then
        echo "Status: RUNNING (PID: $tv_pid, CDP: OK)"
      else
        echo "Status: RUNNING (PID: $tv_pid, CDP: DOWN)"
      fi
    else
      echo "Status: STOPPED"
    fi
    echo ""
    echo "--- MCP Server ---"
    if is_mcp_running; then
      mcp_pid=$(cat "$MCP_PID_FILE" 2>/dev/null || echo 'unknown')
      echo "Status: RUNNING (PID: $mcp_pid)"
    else
      echo "Status: STOPPED"
    fi
    echo ""
    echo "--- VS Code ---"
    if is_vscode_running; then
      vs_pid=$(cat "$VSCODE_PID_FILE" 2>/dev/null || echo 'unknown')
      echo "Status: RUNNING (PID: $vs_pid)"
    else
      echo "Status: STOPPED"
    fi
    echo ""
    echo "--- Recent Log ---"
    tail -10 "$WATCHDOG_LOG" 2>/dev/null || echo "(no logs yet)"
    ;;
  restart)
    "$0" stop
    sleep 2
    "$0" start
    ;;
  _loop)
    watchdog_loop
    ;;
  *)
    echo "Usage: $0 start|stop|status|restart"
    exit 1
    ;;
esac
