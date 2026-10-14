#!/usr/bin/env bash
# Creates the orchestrator task for one feature; called by /nxtg-forge:feature.
#
#   feature-task.sh "<feature title>" "<one-paragraph description>"
#
# Run from the project root. It writes a spec with exactly one `## <title>` heading to
# .forge/feature-requests/F-NNN.md and runs `forge plan --generate --spec <that file>`, with
# stdin closed. The rule-based brain makes one task per `## ` heading, so this yields exactly one
# task, titled with the feature. It never runs a bare `plan --generate`: that plans from the
# README's headings, and those tasks are not the user's feature (alpha run 2, F-H).
#
# The task id is not printed by forge as data; the caller reads it with forge_get_tasks,
# matching on the title, then claims and completes it.
#
# `plan --generate` rewrites .forge/plan.md with only this run's tasks. This script keeps the
# user's plan: it saves a copy next to the spec (F-NNN.plan-before.md), and after forge runs it
# writes the earlier plan back with this run's output appended below it. The task files under
# .forge/tasks/ are never touched.
#
# Output: key=value lines on stdout.
#   status=created   title=…  spec=…  [task_id=T-NNN]  [plan_backup=…]   (exit 0)
#   task_id is printed when exactly one new task file appeared under .forge/tasks/.
# Run from anywhere in the project: the .forge/ it uses is found as in project_root below. Paths it
# prints (spec, plan_backup) are relative to that project root, which it prints as project=.
#   status=no-forge                     (exit 10)  forge is not installed
#   status=no-forge-dir                 (exit 11)  `forge init` has not run here
# Any other exit is an error; forge's output is on stderr.

set -euo pipefail

TITLE="${1:-}"
DESCRIPTION="${2:-}"

# One line, no leading `#`s, so the spec holds exactly one heading.
TITLE="$(printf '%s' "$TITLE" | tr '\r\n\t' '   ' | sed -e 's/^[#[:space:]]*//' -e 's/[[:space:]]*$//')"
if [[ -z "$TITLE" ]]; then
  echo "usage: feature-task.sh \"<feature title>\" \"<description>\"" >&2
  exit 2
fi
# One paragraph: newlines become spaces, so no line of the description can start a heading.
DESCRIPTION="$(printf '%s' "$DESCRIPTION" | tr '\r\n' '  ' | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')"
[[ -n "$DESCRIPTION" ]] || DESCRIPTION="$TITLE"

PLUGIN_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
# shellcheck source=../servers/lib/find-forge.sh
source "$PLUGIN_ROOT/servers/lib/find-forge.sh"

if ! FORGE="$(find_forge)"; then
  echo "status=no-forge"
  exit 10
fi
# The project is the session's (CLAUDE_PROJECT_DIR) when it has a .forge/, else the nearest directory at or
# above the shell's cwd that has one: the model may have run `cd src` earlier in the session. The same rule
# as the Stop gate (scripts/required-output.mjs projectRoot).
project_root() {
  if [[ -n "${CLAUDE_PROJECT_DIR:-}" && -d "$CLAUDE_PROJECT_DIR/.forge" ]]; then printf '%s\n' "$CLAUDE_PROJECT_DIR"; return 0; fi
  local d="$PWD"
  while :; do
    [[ -d "$d/.forge" ]] && { printf '%s\n' "$d"; return 0; }
    [[ "$d" == "/" || -z "$d" ]] && return 1
    d="$(dirname "$d")"
  done
}
if ! ROOT="$(project_root)"; then
  echo "status=no-forge-dir"
  exit 11
fi
cd "$ROOT"

mkdir -p .forge/feature-requests
last=0
for f in .forge/feature-requests/F-[0-9][0-9][0-9]*.md; do
  [[ -e "$f" ]] || continue
  n="${f##*/F-}"; n="${n%.md}"
  [[ "$n" =~ ^[0-9]+$ ]] || continue
  (( 10#$n > last )) && last=$((10#$n))
done
SPEC="$(printf '.forge/feature-requests/F-%03d.md' $((last + 1)))"
printf '## %s\n\n%s\n' "$TITLE" "$DESCRIPTION" > "$SPEC"

PLAN=.forge/plan.md
BACKUP=""
if [[ -s "$PLAN" ]]; then
  BACKUP="${SPEC%.md}.plan-before.md"
  cp -p "$PLAN" "$BACKUP"
fi

tasks_before="$(ls .forge/tasks/ 2>/dev/null | grep -E '^T-[0-9]+\.json$' | sort || true)"

if ! out="$("$FORGE" plan --generate --spec "$SPEC" --project "$PWD" </dev/null 2>&1)"; then
  [[ -n "$BACKUP" ]] && cp -p "$BACKUP" "$PLAN"
  printf '%s\n' "$out" >&2
  echo "forge plan --generate --spec $SPEC failed" >&2
  exit 1
fi

# Put the user's plan back, with this run's plan below it.
if [[ -n "$BACKUP" ]]; then
  generated="$(cat "$PLAN" 2>/dev/null || true)"
  if ! { cat "$BACKUP"
         printf '\n\n---\n\n<!-- Added by /nxtg-forge:feature (%s): forge plan --generate --spec output. The plan above is kept as it was. -->\n\n' "$SPEC"
         printf '%s\n' "$generated"; } > "$PLAN.tmp" || ! mv "$PLAN.tmp" "$PLAN"; then
    echo "could not restore $PLAN; the plan as it was is saved at $BACKUP" >&2
    exit 1
  fi
fi

echo "status=created"
echo "project=$ROOT"
echo "title=$TITLE"
echo "spec=$SPEC"
new_tasks="$(comm -13 <(printf '%s\n' "$tasks_before") <(ls .forge/tasks/ 2>/dev/null | grep -E '^T-[0-9]+\.json$' | sort || true) | grep -v '^$' || true)"
if [[ -n "$new_tasks" && "$(printf '%s\n' "$new_tasks" | wc -l)" -eq 1 ]]; then echo "task_id=${new_tasks%.json}"; fi
[[ -n "$BACKUP" ]] && echo "plan_backup=$BACKUP"
exit 0
