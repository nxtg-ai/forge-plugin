#!/bin/bash
#
# NXTG-Forge required-output gate: Stop hook entry for scripts/required-output.mjs
# (DIRECTIVE-NXTG-20261013-21). Refuses to end a /nxtg-forge:status, /nxtg-forge:gap-analysis or
# /nxtg-forge:feature turn until the output an alpha criterion reads is there; prints
# {"decision":"block","reason":"FORGE REQUIRED OUTPUT: ..."} while it is not.
#
# A no-op, without starting node, when the session has never run one of those commands.
# Without node it allows: the commands' computed steps need node too, so there is nothing to check.

INPUT=$(cat)
TP=$(printf '%s' "$INPUT" | grep -o '"transcript_path"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*:[[:space:]]*"\(.*\)"$/\1/')
[ -n "$TP" ] && [ -f "$TP" ] || exit 0
grep -qE 'nxtg-forge:(status|gap-analysis|feature)</command-name>' "$TP" 2>/dev/null || exit 0
command -v node >/dev/null 2>&1 || exit 0
ENGINE="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts/required-output.mjs"
printf '%s' "$INPUT" | exec node "$ENGINE" hook
