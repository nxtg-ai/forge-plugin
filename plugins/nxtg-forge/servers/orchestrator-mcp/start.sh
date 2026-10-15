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
# Both paths are resolved first (`pwd -P`): a relative value is taken from the working directory, so the
# walk always ends at "/", and a trailing slash or a symlink cannot hide $HOME from the comparison.
# Only an absolute result is walked: a shell started in a deleted directory resolves "." to "." (getcwd
# fails), and `dirname .` is ".", so the walk would never end.
bind_project_root() {
  local given="${FORGE_PROJECT_ROOT:-$PWD}" dir start home
  dir="$(cd "$given" 2>/dev/null && pwd -P)" || dir=""
  [[ "$dir" == /* ]] || { printf '%s\n' "$given"; return; }
  home="$(cd "${HOME:-/}" 2>/dev/null && pwd -P)" || home="/"
  [[ "$home" == /* ]] || home="/"
  start="$dir"
  while [[ "$dir" != "/" && "$dir" != "$home" ]]; do
    if [[ -f "$dir/.forge/state.json" ]]; then printf '%s\n' "$dir"; return; fi
    dir="$(dirname "$dir")"
  done
  printf '%s\n' "$start"
}

if locate_forge; then
  FORGE="$FORGE_FOUND"
  FORGE_PROJECT_ROOT="$(bind_project_root)"
  export FORGE_PROJECT_ROOT
  cd "$FORGE_PROJECT_ROOT" 2>/dev/null || true
  exec "$FORGE" mcp
fi

INSTALL="To add it, run: curl -fsSL https://forge.nxtg.ai/install.sh | sh, then start a new Claude Code session."
if [[ -n "$FORGE_OTHER" ]]; then
  OTHER="$FORGE_OTHER"
  # A different program named forge (Atlassian's or Laravel's CLI, say) would fail on `forge mcp`.
  exec bash "$HERE/../lib/unavailable-mcp.sh" orchestrator-mcp \
    "The Forge orchestrator (L2: tasks, knowledge, drift) is not installed: $OTHER is not the NXTG Forge orchestrator, but a different program named forge. This is optional. $INSTALL If forge still finds the other program first, set FORGE_BIN to the NXTG forge path (the installer puts it in ~/.local/bin)."
fi
exec bash "$HERE/../lib/unavailable-mcp.sh" orchestrator-mcp \
  "The Forge orchestrator (L2: tasks, knowledge, drift) is not installed. This is optional. $INSTALL"
