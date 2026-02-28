#!/bin/bash
# NXTG-Forge Governance MCP Server Launcher
# Installs dependencies on first run, then starts the server
# Exits cleanly (0) if prerequisites are missing — prevents MCP "failed" status for L1-only users
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# Exit cleanly if node is not installed
command -v node >/dev/null 2>&1 || exit 0

# If node_modules missing, install (may take a few seconds on first run)
if [ ! -d node_modules ]; then
    # Try fast install with npm ci if lock file exists, otherwise npm install
    if [ -f package-lock.json ]; then
        timeout 30 npm ci --silent 2>/dev/null
    else
        timeout 30 npm install --silent 2>/dev/null
    fi
    # If install failed or timed out, exit cleanly (not an error)
    if [ ! -d node_modules ]; then
        exit 0
    fi
fi

exec node index.mjs
