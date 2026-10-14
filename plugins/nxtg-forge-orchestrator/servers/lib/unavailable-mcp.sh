#!/usr/bin/env bash
# Stand-in MCP server for a plugin server that cannot start on this machine.
#
# Usage: unavailable-mcp.sh <server-name> <reason>
#
# Why it exists: when a stdio MCP server exits during startup, Claude Code caches the failure
# and skips that server for 15 minutes, across sessions. A user who installs the missing piece
# (Node, the forge binary, uv) would then see the server stay dark with no hint why. This
# stand-in completes the MCP handshake instead, so nothing is cached: the next session, after
# the user installs what is missing, starts the real server.
#
# It offers no tools, so commands that look for a server's tools still see it as absent. The
# reason travels in the initialize result's `instructions` (Claude reads it) and on stderr.
# Pure bash on purpose: a clean machine may have no node, python or jq.

set -u

NAME="${1:-forge-mcp}"
REASON="${2:-This server is unavailable on this machine.}"

json_escape() {
  local s="$1"
  s="${s//\\/\\\\}"
  s="${s//\"/\\\"}"
  s="${s//$'\n'/\\n}"
  s="${s//$'\r'/}"
  s="${s//$'\t'/ }"
  printf '%s' "$s"
}

NAME_J="$(json_escape "$NAME")"
REASON_J="$(json_escape "$NAME is not running. $REASON")"

echo "[$NAME] not started: $REASON" >&2

reply() {  # reply <id> <result-json>
  printf '{"jsonrpc":"2.0","id":%s,"result":%s}\n' "$1" "$2"
}

reply_error() {  # reply_error <id> <code> <message>
  printf '{"jsonrpc":"2.0","id":%s,"error":{"code":%s,"message":"%s"}}\n' "$1" "$2" "$(json_escape "$3")"
}

ws='[[:space:]]*'
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "${line//[[:space:]]/}" ]] && continue

  method=""
  if [[ "$line" =~ \"method\"${ws}:${ws}\"([^\"]*)\" ]]; then
    method="${BASH_REMATCH[1]}"
  fi

  id=""
  if [[ "$line" =~ \"id\"${ws}:${ws}(\"[^\"]*\"|-?[0-9]+) ]]; then
    id="${BASH_REMATCH[1]}"
  fi

  # Notifications (no id) never get a reply.
  [[ -z "$id" ]] && continue

  case "$method" in
    initialize)
      version="2024-11-05"
      if [[ "$line" =~ \"protocolVersion\"${ws}:${ws}\"([^\"]*)\" ]]; then
        version="${BASH_REMATCH[1]}"
      fi
      reply "$id" "{\"protocolVersion\":\"$(json_escape "$version")\",\"capabilities\":{\"tools\":{\"listChanged\":false}},\"serverInfo\":{\"name\":\"$NAME_J\",\"version\":\"unavailable\"},\"instructions\":\"$REASON_J\"}"
      ;;
    ping)
      reply "$id" '{}'
      ;;
    tools/list)
      reply "$id" '{"tools":[]}'
      ;;
    resources/list)
      reply "$id" '{"resources":[]}'
      ;;
    prompts/list)
      reply "$id" '{"prompts":[]}'
      ;;
    *)
      reply_error "$id" -32601 "$NAME is not running: $REASON"
      ;;
  esac
done
