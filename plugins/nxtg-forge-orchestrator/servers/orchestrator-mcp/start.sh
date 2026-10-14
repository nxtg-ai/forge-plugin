#!/usr/bin/env bash
# NXTG-Forge orchestrator MCP launcher (L2).
# Starts `forge mcp` when the forge binary is installed, on PATH or not (lib/find-forge.sh).
# Without it, starts a stand-in that says how to install it. It never exits with an error:
# Claude Code caches a failed start for 15 minutes, which would keep the orchestrator dark
# after the user installs it.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"
source "$HERE/../lib/find-forge.sh"

# Bind the Forge project the session is in. Claude Code passes ${CLAUDE_PROJECT_DIR}, the directory the
# session started in, which can be a subdirectory of the project; `forge mcp` reads FORGE_PROJECT_ROOT
# as given and does not walk up. So use the nearest ancestor holding .forge/state.json (written by
# `forge init`), stopping below $HOME so forge-ui's global ~/.forge is never taken for a project.
# With no Forge project above, the session directory stands, as before.
bind_project_root() {
  local dir="${FORGE_PROJECT_ROOT:-$PWD}"
  local start="$dir"
  while [[ -n "$dir" && "$dir" != "/" && "$dir" != "${HOME:-/}" ]]; do
    if [[ -f "$dir/.forge/state.json" ]]; then printf '%s\n' "$dir"; return; fi
    dir="$(dirname "$dir")"
  done
  printf '%s\n' "$start"
}

if FORGE="$(find_forge)"; then
  FORGE_PROJECT_ROOT="$(bind_project_root)"
  export FORGE_PROJECT_ROOT
  cd "$FORGE_PROJECT_ROOT" 2>/dev/null || true
  exec "$FORGE" mcp
fi

exec bash "$HERE/../lib/unavailable-mcp.sh" orchestrator-mcp \
  "The Forge orchestrator (L2: tasks, knowledge, drift) is not installed. This is optional. To add it, run: curl -fsSL https://forge.nxtg.ai/install.sh | sh, then start a new Claude Code session."
