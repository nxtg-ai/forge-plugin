#!/bin/bash
# NXTG-Forge Governance MCP Server Launcher
# Installs dependencies on first run, then starts the server
DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# If node_modules missing, install (may take a few seconds on first run)
if [ ! -d node_modules ]; then
    # Try fast install with npm ci if lock file exists, otherwise npm install
    if [ -f package-lock.json ]; then
        npm ci --silent 2>/dev/null
    else
        npm install --silent 2>/dev/null
    fi
    # If install failed or timed out, exit cleanly (not an error)
    if [ ! -d node_modules ]; then
        echo '{"error":"Dependencies not installed. Run: cd '"$DIR"' && npm install"}' >&2
        exit 0
    fi
fi

exec node index.mjs
