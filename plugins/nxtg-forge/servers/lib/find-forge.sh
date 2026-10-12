#!/usr/bin/env bash
# Prints the path of the forge orchestrator binary, or nothing. Exit 0 when found, 1 when not.
#
# Looks beyond PATH on purpose. The documented installer (https://forge.nxtg.ai/install.sh)
# puts forge in ~/.local/bin, which a fresh shell or the process that launches Claude Code may
# not have on its PATH. Order: $FORGE_BIN, PATH, $FORGE_INSTALL_DIR, ~/.local/bin, ~/.cargo/bin.
# Sourced by servers/orchestrator-mcp/start.sh and the pre-task hook, so both agree.

find_forge() {
  local candidate dir
  if [[ -n "${FORGE_BIN:-}" && -x "${FORGE_BIN}" ]]; then
    printf '%s\n' "$FORGE_BIN"; return 0
  fi
  if candidate="$(command -v forge 2>/dev/null)" && [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"; return 0
  fi
  for dir in "${FORGE_INSTALL_DIR:-}" "${HOME:-}/.local/bin" "${HOME:-}/.cargo/bin"; do
    [[ -n "$dir" && -x "$dir/forge" && ! -d "$dir/forge" ]] || continue
    printf '%s\n' "$dir/forge"; return 0
  done
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  find_forge
fi
