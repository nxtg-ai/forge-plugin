#!/usr/bin/env bash
# NXTG-Forge orchestrator MCP launcher (L2).
# Starts `forge mcp` when the forge binary is installed, on PATH or not (lib/find-forge.sh).
# Without it, starts a stand-in that says how to install it. It never exits with an error:
# Claude Code caches a failed start for 15 minutes, which would keep the orchestrator dark
# after the user installs it.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
source "$HERE/../lib/find-forge.sh"

if FORGE="$(find_forge)"; then
  exec "$FORGE" mcp
fi

exec bash "$HERE/../lib/unavailable-mcp.sh" orchestrator-mcp \
  "The Forge orchestrator (L2: tasks, knowledge, drift) is not installed. This is optional. To add it, run: curl -fsSL https://forge.nxtg.ai/install.sh | sh, then start a new Claude Code session."
