#!/usr/bin/env bash
# NXTG-Forge Governance MCP Server Launcher
# Installs dependencies on first run, then starts the server

set -euo pipefail

# Project root: honor FORGE_PROJECT_ROOT from .mcp.json (${CLAUDE_PROJECT_DIR}) when set;
# fall back to cwd for direct runs. Must resolve BEFORE the `cd` below, which moves us into
# the server dir. (tools.mjs also defaults to process.cwd() if this stays unset.)
export FORGE_PROJECT_ROOT="${FORGE_PROJECT_ROOT:-$(pwd)}"

cd "$(dirname "$0")"

if [[ ! -d node_modules ]]; then
  echo "[governance-mcp] Installing dependencies..." >&2
  npm install --silent || { echo "[governance-mcp] ERROR: npm install failed" >&2; exit 1; }
fi

if [[ ! -f index.mjs ]]; then
  echo "[governance-mcp] ERROR: index.mjs not found" >&2
  exit 1
fi

exec node index.mjs
