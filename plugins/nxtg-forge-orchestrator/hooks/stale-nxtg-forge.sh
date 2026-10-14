#!/usr/bin/env bash
# Once per session: say so when the installed nxtg-forge is a release that still registers its own
# orchestrator-mcp (3.13.1 and earlier). With this companion also installed, the session then has two
# orchestrator-mcp servers and every forge_* orchestrator tool twice, and the old copy binds the
# directory the session started in rather than the project root. Its own hook cannot say so, because it
# predates the companion, so this one does. Advisory only: it always exits 0.
#
# Installed plugins are listed in <config>/plugins/installed_plugins.json. This plugin's root is
# <config>/plugins/cache/<marketplace>/<plugin>/<version>, so the file is found from it; a --plugin-dir
# checkout falls back to $CLAUDE_CONFIG_DIR or ~/.claude. Pure bash: no jq, node or python needed.

set -u

input=""
[ -t 0 ] || input="$(cat 2>/dev/null || true)"
sid="unknown"
if [[ "$input" =~ \"session_id\"[[:space:]]*:[[:space:]]*\"([A-Za-z0-9_-]+)\" ]]; then sid="${BASH_REMATCH[1]}"; fi
mark_dir="${TMPDIR:-/tmp}/nxtg-forge-orchestrator-$(id -u 2>/dev/null || echo 0)"
mark="$mark_dir/stale-$sid"
if [ "$sid" != "unknown" ] && [ -e "$mark" ]; then exit 0; fi
mkdir -p "$mark_dir" 2>/dev/null && : > "$mark" 2>/dev/null || true

root="${CLAUDE_PLUGIN_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." 2>/dev/null && pwd)}"
list="${CLAUDE_CONFIG_DIR:-${HOME:-}/.claude}/plugins/installed_plugins.json"
[[ "$root" == */plugins/cache/*/*/* ]] && list="${root%/cache/*}/installed_plugins.json"
[ -f "$list" ] || exit 0

# installPath of every nxtg-forge@<marketplace> install.
in_forge=0
while IFS= read -r line; do
  if [[ "$line" =~ \"([^\"]+@[^\"]+)\"[[:space:]]*: ]]; then
    [[ "${BASH_REMATCH[1]}" == nxtg-forge@* ]] && in_forge=1 || in_forge=0
  elif ((in_forge)) && [[ "$line" =~ \"installPath\"[[:space:]]*:[[:space:]]*\"([^\"]+)\" ]]; then
    if grep -q '"orchestrator-mcp"' "${BASH_REMATCH[1]}/.mcp.json" 2>/dev/null; then
      echo "[Warning] The installed nxtg-forge plugin is out of date: it still registers its own orchestrator-mcp, so the orchestrator tools are listed twice and the old copy may not see the Forge project from a subdirectory. Use the nxtg-forge-orchestrator tools. To fix it, run: claude plugin update nxtg-forge@nxtg-forge, then start a new Claude Code session."
      exit 0
    fi
  fi
done < "$list"
exit 0
