#!/usr/bin/env bash
set -euo pipefail

# ─── Config ───
API_DIR="$(cd "$(dirname "$0")/API" && pwd)"
WEB_DIR="$(cd "$(dirname "$0")/WEB" && pwd)"
API_PORT=8001
WEB_PORT=8000

# ─── Colors ───
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

API_PID=""
WEB_PID=""

cleanup() {
    echo ""
    echo -e "${YELLOW}⏳ Shutting down...${NC}"

    if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
        kill "$WEB_PID" 2>/dev/null
        wait "$WEB_PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} Vite stopped"
    fi

    if [[ -n "$API_PID" ]] && kill -0 "$API_PID" 2>/dev/null; then
        kill "$API_PID" 2>/dev/null
        wait "$API_PID" 2>/dev/null
        echo -e "${GREEN}✓${NC} FastAPI stopped"
    fi

    echo -e "${GREEN}✅ All services stopped.${NC}"
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

echo -e "${GREEN}🚀 RegimeMaker${NC}"
echo "────────────────────────────"

# ─── Start API ───
echo -e "${YELLOW}▶ Starting API on :${API_PORT}...${NC}"
cd "$API_DIR"
python3 web.py &
API_PID=$!
sleep 1

if ! kill -0 "$API_PID" 2>/dev/null; then
    echo -e "${RED}✗ API failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ API running${NC}  →  http://127.0.0.1:${API_PORT}"

# ─── Start WEB ───
echo -e "${YELLOW}▶ Starting WEB on :${WEB_PORT}...${NC}"
cd "$WEB_DIR"
npx vite --port "$WEB_PORT" 2>&1 &
WEB_PID=$!
sleep 2

if ! kill -0 "$WEB_PID" 2>/dev/null; then
    echo -e "${RED}✗ WEB failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ WEB running${NC}  →  http://127.0.0.1:${WEB_PORT}"

echo "────────────────────────────"
echo -e "${GREEN}✅ All services running. Press Ctrl+C to stop.${NC}"
echo ""

wait
