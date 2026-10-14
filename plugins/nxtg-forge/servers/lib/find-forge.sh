#!/usr/bin/env bash
# Prints the path of the NXTG forge orchestrator binary, or nothing. Exit 0 when found, 1 when not.
#
# Looks beyond PATH on purpose. The documented installer (https://forge.nxtg.ai/install.sh)
# puts forge in ~/.local/bin, which a fresh shell or the process that launches Claude Code may
# not have on its PATH. Order: $FORGE_BIN, PATH, $FORGE_INSTALL_DIR, ~/.local/bin, ~/.cargo/bin.
# Sourced by servers/orchestrator-mcp/start.sh and the pre-task hook, so both agree.

# Only NXTG forge counts. Other CLIs are also named forge (Atlassian's prints a bare version number,
# Laravel's names itself), and `forge mcp` fails in them, which Claude Code shows as a failed server.
# Every NXTG forge release prints `forge X.Y.Z` for --version.
is_nxtg_forge() {
  local v
  v="$("$1" --version 2>/dev/null </dev/null)" || return 1
  [[ "$v" =~ ^forge\ [0-9]+\.[0-9]+ ]]
}

# Every executable named forge, in search order.
forge_candidates() {
  local candidate dir
  [[ -n "${FORGE_BIN:-}" && -x "${FORGE_BIN}" ]] && printf '%s\n' "$FORGE_BIN"
  if candidate="$(command -v forge 2>/dev/null)" && [[ -n "$candidate" ]]; then
    printf '%s\n' "$candidate"
  fi
  for dir in "${FORGE_INSTALL_DIR:-}" "${HOME:-}/.local/bin" "${HOME:-}/.cargo/bin"; do
    [[ -n "$dir" && -x "$dir/forge" && ! -d "$dir/forge" ]] && printf '%s\n' "$dir/forge"
  done
  return 0
}

find_forge() {
  local candidate
  while IFS= read -r candidate; do
    if is_nxtg_forge "$candidate"; then printf '%s\n' "$candidate"; return 0; fi
  done < <(forge_candidates)
  return 1
}

# The first executable named forge that is not NXTG forge, or nothing. For the stand-in's message.
foreign_forge() {
  local candidate
  while IFS= read -r candidate; do
    is_nxtg_forge "$candidate" || { printf '%s\n' "$candidate"; return 0; }
  done < <(forge_candidates)
  return 1
}

if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
  find_forge
fi
