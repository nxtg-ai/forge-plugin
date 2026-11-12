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
# `forge init`) that no other user can write, stopping below $HOME so forge-ui's global ~/.forge is never taken for a project.
# With no Forge project above, the session directory stands, as before.
# Both paths are resolved first (`pwd -P`): a relative value is taken from the working directory, so the
# walk always ends at "/", and a trailing slash or a symlink cannot hide $HOME from the comparison.
# Only an absolute result is walked: a shell started in a deleted directory resolves "." to "." (getcwd
# fails), and `dirname .` is ".", so the walk would never end.
# Forge state another local user can write is not this session's project (GHSA-27cj-q3j4-mfjx): on a shared host
# a user could create .forge/state.json in /tmp or another shared directory above a session and steer the
# orchestrator to it. A path is trusted when it is not a symlink, no other account can write it (through world or
# group write), and this user or root owns it. `stat` is GNU (-c) or BSD/macOS (-f).
foreign_writable() {
  local op uid gid perm me
  [[ -L "$1" ]] && return 0
  op="$(stat -c '%u %g %a' "$1" 2>/dev/null || stat -f '%u %g %Lp' "$1" 2>/dev/null)" || return 0
  uid="${op%% *}" perm="${op##* }" gid="${op#* }" gid="${gid%% *}"
  [[ "$uid" =~ ^[0-9]+$ && "$gid" =~ ^[0-9]+$ && "$perm" =~ ^[0-7]+$ ]] || return 0
  me="$(id -u 2>/dev/null)" || return 0
  (( 8#$perm & 8#002 )) && return 0
  [[ "$uid" == "$me" || "$uid" == 0 ]] || return 0
  (( (8#$perm & 8#020) == 0 )) && return 1
  # Group-writable: other accounts in that group can write it, unless the group is this user's own private group
  # (Ubuntu and Fedora give each user one, with umask 002). Root's files never get this exception.
  [[ "$uid" == "$me" ]] && private_group "$gid" && return 1
  return 0
}
# 0 when <gid> is this user's private group: the primary group, named after the user, with no other listed member.
# Without getent the member list cannot be read, so the answer is no.
private_group() {
  local name entry
  [[ "$1" == "$(id -g 2>/dev/null)" ]] || return 1
  name="$(id -un 2>/dev/null)" || return 1
  [[ -n "$name" && "$(id -gn 2>/dev/null)" == "$name" ]] || return 1
  entry="$(getent group "$1" 2>/dev/null)" || return 1
  entry="${entry##*:}"
  [[ -z "$entry" || "$entry" == "$name" ]]
}
# 0 when <dir> holds a Forge project whose state is trusted: .forge and .forge/state.json pass foreign_writable.
trusted_project() {
  [[ -d "$1/.forge" && -f "$1/.forge/state.json" ]] || return 1
  ! foreign_writable "$1/.forge" && ! foreign_writable "$1/.forge/state.json"
}
# Prints why <dir> must not be bound, or nothing: the directory, its .forge or its state.json can be written by
# another user. A path that does not resolve is left to forge, as before.
untrusted_root() {
  local p
  [[ "$1" == /* && -d "$1" ]] || return 1
  # Without stat and id nothing can be checked, so every path counts as another user's.
  if ! command -v stat >/dev/null 2>&1 || ! command -v id >/dev/null 2>&1; then
    printf '%s\n' "$1 (stat and id are needed to check who can write it, and one is missing)"; return 0
  fi
  for p in "$1" "$1/.forge" "$1/.forge/state.json"; do
    [[ -e "$p" || -L "$p" ]] || continue
    if foreign_writable "$p"; then printf '%s\n' "$p"; return 0; fi
  done
  return 1
}

bind_project_root() {
  local given="${FORGE_PROJECT_ROOT:-$PWD}" dir start home
  # CDPATH is cleared: with it set, `cd` to a relative name prints the directory it found, a second line.
  dir="$(CDPATH= cd -- "$given" >/dev/null 2>&1 && pwd -P)" || dir=""
  [[ "$dir" == /* ]] || { printf '%s\n' "$given"; return; }
  home="${HOME:-}"
  if [[ -z "$home" ]]; then
    # Launchers may omit HOME. Use the account database when available (getent is not on every host).
    home="$(getent passwd "$(id -u 2>/dev/null)" 2>/dev/null)" || home=""
    home="$(printf '%s\n' "$home" | cut -s -d: -f6)"
    [[ "$home" == /* ]] || { printf '%s\n' "$dir"; return; }
  fi
  home="$(CDPATH= cd -- "$home" >/dev/null 2>&1 && pwd -P)" || home=""
  # An unknown/unresolvable home is not /. Keep the resolved directory rather than walk without a boundary.
  [[ "$home" == /* ]] || { printf '%s\n' "$dir"; return; }
  start="$dir"
  while [[ "$dir" != "/" && "$dir" != "$home" ]]; do
    # A directory another user can write ends the walk: what lies above it is no evidence of this session's project.
    foreign_writable "$dir" && break
    if trusted_project "$dir"; then printf '%s\n' "$dir"; return; fi
    dir="$(dirname "$dir")"
  done
  printf '%s\n' "$start"
}

if locate_forge; then
  FORGE="$FORGE_FOUND"
  FORGE_PROJECT_ROOT="$(bind_project_root)"
  if bad="$(untrusted_root "$FORGE_PROJECT_ROOT")"; then
    exec bash "$HERE/../lib/unavailable-mcp.sh" orchestrator-mcp \
      "The Forge orchestrator was not started: $bad can be written by another user, or is a symlink, so the Forge state in $FORGE_PROJECT_ROOT may not be yours. Start the session in a directory you own, or set FORGE_PROJECT_ROOT to one."
  fi
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
