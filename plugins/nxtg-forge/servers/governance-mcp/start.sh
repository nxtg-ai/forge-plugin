#!/bin/bash
# NXTG-Forge Governance MCP Server Launcher
# Auto-installs dependencies on first run
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"
[ -d node_modules ] || npm install --silent 2>/dev/null
exec node index.mjs
