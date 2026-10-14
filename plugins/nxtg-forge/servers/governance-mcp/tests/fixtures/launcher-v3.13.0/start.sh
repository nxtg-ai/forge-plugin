#!/usr/bin/env bash
# NXTG-Forge Governance MCP Server Launcher
# Installs dependencies on first run, then starts the server.
#
# This server needs Node.js 20 or newer (and npm on first run). When either is missing, or the
# first-run install fails, it starts a stand-in (../lib/unavailable-mcp.sh) that says what is
# needed, instead of exiting: Claude Code caches a failed start for 15 minutes, which would
# keep health scoring dark after the user installs Node.

set -euo pipefail

# Project root: honor FORGE_PROJECT_ROOT from .mcp.json (${CLAUDE_PROJECT_DIR}) when set;
# fall back to cwd for direct runs. Must resolve BEFORE the `cd` below, which moves us into
# the server dir. (tools.mjs also defaults to process.cwd() if this stays unset.)
export FORGE_PROJECT_ROOT="${FORGE_PROJECT_ROOT:-$(pwd)}"

cd "$(dirname "$0")"

NODE_MIN=20
unavailable() {
  exec bash ../lib/unavailable-mcp.sh governance-mcp \
    "$1 Without it there is no health score or grade, and the forge_* governance tools are missing. After installing, start a new Claude Code session."
}

if ! command -v node >/dev/null 2>&1; then
  unavailable "Health scoring needs Node.js ${NODE_MIN} or newer, and node was not found on the PATH. Install it from https://nodejs.org (or your package manager)."
fi

NODE_VERSION="$(node -p 'process.versions.node' 2>/dev/null || echo unknown)"
if [[ ! "${NODE_VERSION%%.*}" =~ ^[0-9]+$ ]] || (( ${NODE_VERSION%%.*} < NODE_MIN )); then
  unavailable "Health scoring needs Node.js ${NODE_MIN} or newer; this machine has ${NODE_VERSION}. Upgrade from https://nodejs.org."
fi

if [[ ! -d node_modules ]]; then
  if ! command -v npm >/dev/null 2>&1; then
    unavailable "The first start installs this server's packages with npm, and npm was not found on the PATH. Install npm (it ships with Node.js from https://nodejs.org)."
  fi
  echo "[governance-mcp] Installing dependencies..." >&2
  if ! npm install --silent --omit=dev >&2; then
    rm -rf node_modules
    unavailable "The first-run 'npm install' in $(pwd) failed (offline, or a registry or permission error). Run it there yourself to see the error."
  fi
fi

if [[ ! -f index.mjs ]]; then
  echo "[governance-mcp] ERROR: index.mjs not found" >&2
  exit 1
fi

exec node index.mjs
