#!/usr/bin/env bash
# Labels open issues and PRs from outside authors `community`, so the stale workflow never marks or closes
# them (`community` is in its exempt labels; emma-soul al:66c6c92e0cfbf5a2, DIRECTIVE-NXTG-20261105-02).
# Outside = author_association other than OWNER, MEMBER or COLLABORATOR. Bots (Dependabot) are not outside authors.
#
#   label-community.sh <owner/repo>            label for real (needs GH_TOKEN with issues: write)
#   label-community.sh --select <items.json>   print the numbers it would label, offline (used by the test)
set -euo pipefail

select_outside() {
  jq -r '.[]
    | select(.user.type != "Bot")
    | select((.author_association // "NONE") as $a | ["OWNER", "MEMBER", "COLLABORATOR"] | index($a) | not)
    | select([.labels[]?.name] | index("community") | not)
    | .number' "$1"
}

if [[ "${1:-}" == "--select" ]]; then select_outside "$2"; exit 0; fi

repo="${1:?usage: label-community.sh <owner/repo> | --select <items.json>}"
items="$(mktemp)"
trap 'rm -f "$items"' EXIT
# The issues endpoint lists open PRs too, each with its author_association.
gh api --paginate "repos/$repo/issues?state=open&per_page=100" | jq -s 'add // []' > "$items"
gh label create community --repo "$repo" --color 0e8a16 \
  --description "Opened by someone outside NXTG.ai; never closed as stale" >/dev/null 2>&1 || true
for n in $(select_outside "$items"); do
  gh api -X POST "repos/$repo/issues/$n/labels" -f "labels[]=community" >/dev/null
  echo "labelled #$n community"
done
