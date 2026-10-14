#!/usr/bin/env bash
# NXTG-Forge Governance MCP Server Launcher
#
# This server needs Node.js 20 or newer and nothing else: it has no npm dependencies, so there is no
# install step on first launch (DIRECTIVE-NXTG-20261014-01). Claude Code lists a plugin MCP server as
# "pending", without its tools, if it has not answered within about 1.5-2 s of launch, and a first-run
# `npm install` missed that window on a cold npm cache. When Node is missing (checked here) or too old
# (checked in index.mjs), a stand-in (../lib/unavailable-mcp.sh) answers and says what is needed,
# instead of exiting: Claude Code caches a failed start for 15 minutes, which would keep health scoring
# dark after the user installs Node.

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

# Node's version is checked inside index.mjs, not with a separate `node -p` here: that probe was a second
# Node startup on every launch, the costliest step on a busy machine (DIRECTIVE-NXTG-20261014-09, L1).
# On a Node older than ${NODE_MIN}, index.mjs hands stdin/stdout to the same stand-in.

if [[ ! -f index.mjs ]]; then
  echo "[governance-mcp] ERROR: index.mjs not found" >&2
  exit 1
fi

exec node index.mjs
