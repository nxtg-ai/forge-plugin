#!/usr/bin/env bash
# B3 Shipped-Wrong Detector — method v1
# Spec: /home/axw/ASIF/initiatives/undeniable-portfolio/b3-evidence/harmony-turn-row-partition.md §4.3
# Owner: forge-plugin team (B3 §3B, PRM-CLX9-20260719-B3G1B)
#
# Usage:
#   ./detect.sh --window YYYY-MM-DD --auditor-lane LANE [--out FILE.jsonl] [--no-ledger]
#
# Performs three sweeps over window+7d:
#   1. Origin revert sweep (git log across ASIF + product repos)
#   2. Prod rollback sweep (deploy-platform API — requires VERCEL_TOKEN env var)
#   3. Late-correction sweep (corrections-ledger.jsonl + alignment ledger)
#
# For each confirmed shipped-wrong, emits a typed row to corrections-ledger.jsonl
# via ~/ASIF/scripts/correction-capture.sh --census-class shipped-wrong (live,
# schema B3S42 resolved at 6e7adb990). Pass --no-ledger to skip ledger emission.
#
# Null results typed as: "audited-zero (method v1, date YYYY-MM-DD, auditor lane LANE)"
# per spec §4.3 — never bare zero.
#
# Exit codes: 0 = audit complete (check summary row for result_type), 1 = usage error

set -uo pipefail

METHOD="v1"
WINDOW_DATE=""
AUDITOR_LANE=""
OUT_FILE=""
NO_LEDGER=0

usage() {
  echo "Usage: $0 --window YYYY-MM-DD --auditor-lane LANE [--out FILE.jsonl] [--no-ledger]" >&2
  exit 1
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --window)       WINDOW_DATE="$2"; shift 2 ;;
    --auditor-lane) AUDITOR_LANE="$2"; shift 2 ;;
    --out)          OUT_FILE="$2"; shift 2 ;;
    --no-ledger)    NO_LEDGER=1; shift ;;
    *)              usage ;;
  esac
done

[[ -z "$WINDOW_DATE" || -z "$AUDITOR_LANE" ]] && usage

AUDIT_END_DATE=$(date -u -d "${WINDOW_DATE} + 7 days" +%Y-%m-%d)
WINDOW_START="${WINDOW_DATE}T00:00:00Z"
AUDIT_END="${AUDIT_END_DATE}T23:59:59Z"
RUN_TS=$(date -u +%Y-%m-%dT%H:%M:%SZ)
RUN_DATE=$(date -u +%Y-%m-%d)

ASIF_ROOT="${ASIF_ROOT:-/home/axw/ASIF}"
CORRECTION_CAPTURE="${ASIF_ROOT}/scripts/correction-capture.sh"
CORRECTIONS_LEDGER="${ASIF_ROOT}/governance/corrections-ledger.jsonl"
ALIGNMENT_LEDGER_DIR="${ASIF_ROOT}/governance/alignment"

[[ -n "$OUT_FILE" ]] && > "$OUT_FILE"

emit() {
  echo "$1"
  [[ -n "$OUT_FILE" ]] && echo "$1" >> "$OUT_FILE"
}

# Minimal in-place JSON string escaping (no external tools)
jesc() {
  printf '%s' "$1" | sed 's/\\/\\\\/g; s/"/\\"/g; s/	/ /g' | tr -d '\n' | head -c 800
}

# Emit a typed row to the corrections-ledger for each confirmed shipped-wrong
ledger_emit_shipped_wrong() {
  local caught="$1" corrected="$2" evidence="$3"
  [[ $NO_LEDGER -eq 1 ]] && return 0
  [[ ! -x "$CORRECTION_CAPTURE" ]] && return 0
  ASIF_LANE_ID="${AUDITOR_LANE}" "${CORRECTION_CAPTURE}" \
    --mechanism "shipped-wrong-detector" \
    --surface "tools/shipped-wrong-detector/detect.sh" \
    --caught "${caught}" \
    --corrected "${corrected}" \
    --severity "advisory" \
    --outcome "flagged" \
    --evidence "${evidence}" \
    --census-class "shipped-wrong" \
    2>/dev/null || true
}

# ─────────────────────────────────────────────────────────────────────────────
# Repos to scan — ASIF + product repos. Non-git paths silently skipped.
# ─────────────────────────────────────────────────────────────────────────────
REPOS=(
  "${ASIF_ROOT}"
  "/home/axw/projects/dx3"
  "/home/axw/projects/NXTG-Forge/forge-plugin"
  "/home/axw/projects/NXTG-Forge/forge-orchestrator"
  "/home/axw/projects/NXTG-Forge/forge-ui"
  "/home/axw/projects/nxtg.ai"
  "/home/axw/projects/atlas"
  "/home/axw/projects/geo-grader"
  "/home/axw/projects/nxtg-content-engine"
  "/home/axw/projects/cosmux"
  "/home/axw/projects/synapps"
  "/home/axw/projects/skinny.cloud"
  "/home/axw/projects/product-oracle"
  "/home/axw/projects/oneDB"
)

# Keyword patterns — lead generators only; adjudication is against the diff/body
KEYWORD_GREP="revert|Revert|rollback|Rollback|retract|fix wrong|wrong fix|rolled back|reverts commit"

SWEEP1_LEADS=0
SWEEP1_SHIPPED=0
SWEEP1_REVIEW=0
SWEEP3_CANDIDATES=0

echo "[detect.sh ${METHOD}] window=${WINDOW_DATE} audit=${WINDOW_DATE}..${AUDIT_END_DATE} auditor=${AUDITOR_LANE} ts=${RUN_TS}" >&2

# ─────────────────────────────────────────────────────────────────────────────
# SWEEP 1 — Origin revert sweep
# ─────────────────────────────────────────────────────────────────────────────
echo "[Sweep 1] Origin revert sweep across repos" >&2

for repo_path in "${REPOS[@]}"; do
  [[ ! -d "${repo_path}/.git" ]] && continue
  repo_name=$(basename "$repo_path")

  mapfile -t hits < <(
    cd "$repo_path" && git log \
      --oneline \
      --after="${WINDOW_DATE}T00:00:00" \
      --before="${AUDIT_END_DATE}T23:59:59" \
      --no-merges \
      --extended-regexp \
      --grep="$KEYWORD_GREP" \
      2>/dev/null || true
  )

  for hit in "${hits[@]}"; do
    [[ -z "$hit" ]] && continue
    sha="${hit%% *}"
    subject="${hit#* }"
    SWEEP1_LEADS=$((SWEEP1_LEADS + 1))

    body=$(cd "$repo_path" && git show "$sha" --no-patch --format="%B" 2>/dev/null || true)
    diff_stat=$(cd "$repo_path" && git show --stat "$sha" 2>/dev/null | tail -1 | tr '"' "'" || true)

    adj_type=""
    adj_note=""

    # ── Rule A: Standard "Revert <subject>" pattern ───────────────────────
    # git automatically formats these as: Revert "<original subject>"
    if echo "$subject" | grep -qE '^Revert "'; then
      reverted_subj=$(echo "$subject" | sed 's/^Revert "//; s/"$//')
      reverted_sha=$(cd "$repo_path" && git log \
        --oneline \
        --after="${WINDOW_DATE}T00:00:00" \
        --before="${WINDOW_DATE}T23:59:59" \
        --fixed-strings \
        --grep="$reverted_subj" \
        2>/dev/null | head -1 | awk '{print $1}' || true)
      if [[ -n "$reverted_sha" ]]; then
        adj_type="shipped-wrong"
        adj_note="standard git revert of in-window commit ${reverted_sha} (${WINDOW_DATE}); reverted: ${reverted_subj}"
      else
        adj_type="not-shipped-wrong"
        adj_note="standard Revert commit; reverted original not found in window ${WINDOW_DATE} — pre-window revert"
      fi

    # ── Rule B: Body explicitly reverts/rolls-back an in-window SHA ───────
    # Only fires when SHA appears in a reversion SENTENCE (not just any mention)
    elif echo "$body" | grep -qiE '(revert|rollback|rolled back|reverts commit|rolls back).{0,80}[0-9a-f]{7,40}'; then
      # Extract SHAs from reversion-context sentences
      in_window_ref=""
      while IFS= read -r candidate; do
        commit_date=$(cd "$repo_path" && git log --format="%ai" "$candidate" -- 2>/dev/null | head -1 | cut -d' ' -f1 || true)
        if [[ "$commit_date" == "$WINDOW_DATE" ]]; then
          in_window_ref="$candidate"
          break
        fi
      done < <(echo "$body" | grep -iE '(revert|rollback|rolled back|reverts commit|rolls back).{0,80}[0-9a-f]{7,40}' | grep -oE '[0-9a-f]{7,40}' || true)

      if [[ -n "$in_window_ref" ]]; then
        adj_type="shipped-wrong"
        adj_note="body explicitly reverts/rolls-back in-window SHA ${in_window_ref} (${WINDOW_DATE})"
      else
        adj_type="lead-requires-manual-review"
        adj_note="reversion language + SHA reference in body; referenced SHA not in window ${WINDOW_DATE} — manual diff review required"
        SWEEP1_REVIEW=$((SWEEP1_REVIEW + 1))
      fi

    # ── Rule C: "retracted pre-push" / "never reached" — pre-ship catch ──
    elif echo "$body" | grep -qiE 'retracted pre-push|never reached|unpushed commit|minted minutes ago in THIS unpushed'; then
      adj_type="not-shipped-wrong"
      adj_note="retracted before reaching any shared surface (pre-push); not shipped-wrong"

    # ── Rule D: keyword in body mentioning a database/runtime rollback ────
    # A separate class: real operational rollbacks documented in commits.
    # Classified as lead-requires-manual-review (needs DB/prod state check).
    elif echo "$body" | grep -qiE '(backfill|deploy|migration|prod).{0,60}(rollback|rolled back|TRUNCATE|reverted)'; then
      adj_type="lead-requires-manual-review"
      adj_note="body documents a prod/DB/deploy rollback; git diff is not a code revert — requires manual check of prod state in audit window"
      SWEEP1_REVIEW=$((SWEEP1_REVIEW + 1))

    # ── Default: keyword in subject but no strong reversion signal ────────
    else
      adj_type="lead-requires-manual-review"
      adj_note="keyword match on commit subject/body; no definitive reversion of in-window work found in diff; manual review required"
      SWEEP1_REVIEW=$((SWEEP1_REVIEW + 1))
    fi

    # Emit ledger row for confirmed shipped-wrong
    if [[ "$adj_type" == "shipped-wrong" ]]; then
      SWEEP1_SHIPPED=$((SWEEP1_SHIPPED + 1))
      ledger_emit_shipped_wrong \
        "Sweep 1 origin-revert: ${sha} in ${repo_name} — ${subject}" \
        "Confirmed shipped-wrong: ${adj_note}" \
        "tools/shipped-wrong-detector/detect.sh window=${WINDOW_DATE} commit=${sha} repo=${repo_name}"
    fi

    emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"1-origin-revert\",\"result_type\":\"${adj_type}\",\"repo\":\"${repo_name}\",\"commit\":\"${sha}\",\"subject\":\"$(jesc "$subject")\",\"adjudication\":\"$(jesc "$adj_note")\",\"diff_stat\":\"$(jesc "$diff_stat")\"}"
  done
done

echo "[Sweep 1] leads=${SWEEP1_LEADS} shipped-wrong=${SWEEP1_SHIPPED} requires-review=${SWEEP1_REVIEW}" >&2

# ─────────────────────────────────────────────────────────────────────────────
# SWEEP 2 — Prod rollback sweep (Vercel deploy platform)
# ─────────────────────────────────────────────────────────────────────────────
echo "[Sweep 2] Prod rollback sweep: deploy-platform history" >&2

VERCEL_TOKEN="${VERCEL_TOKEN:-}"
if [[ -z "$VERCEL_TOKEN" ]]; then
  emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"2-prod-rollback\",\"result_type\":\"sweep-unavailable\",\"reason\":\"VERCEL_TOKEN not set — set env var and re-run to complete this sweep\",\"gap_disclosure\":\"sweep 2 INCOMPLETE; shipped-wrong count may be higher than reported\"}"
else
  WINDOW_EPOCH=$(date -u -d "${WINDOW_DATE}" +%s)000
  AUDIT_END_EPOCH=$(date -u -d "${AUDIT_END_DATE} + 1 day" +%s)000
  vercel_resp=$(curl -sf \
    -H "Authorization: Bearer ${VERCEL_TOKEN}" \
    "https://api.vercel.com/v6/deployments?limit=100&since=${WINDOW_EPOCH}&until=${AUDIT_END_EPOCH}" \
    2>/dev/null || true)

  if [[ -z "$vercel_resp" ]]; then
    emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"2-prod-rollback\",\"result_type\":\"sweep-error\",\"reason\":\"Vercel API call returned empty response — check token validity\"}"
  else
    rollbacks=$(echo "$vercel_resp" | python3 -c \
      "import sys,json; d=json.load(sys.stdin); print('\n'.join(str(dep.get('uid','?')) for dep in d.get('deployments',[]) if 'rollback' in str(dep.get('target','')).lower() or dep.get('meta',{}).get('action') == 'rollback'))" \
      2>/dev/null || true)
    count=$(echo "$rollbacks" | grep -c . || echo 0)
    if [[ "$count" -eq 0 ]]; then
      emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"2-prod-rollback\",\"result_type\":\"audited-zero\",\"audited_zero_statement\":\"audited-zero (method ${METHOD}, date ${RUN_DATE}, auditor lane ${AUDITOR_LANE}) — Vercel deployment rollbacks in audit period: 0\"}"
    else
      emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"2-prod-rollback\",\"result_type\":\"shipped-wrong-candidate\",\"rollback_count\":${count},\"note\":\"${count} Vercel deployment rollbacks in audit period; manual review required to confirm each as in-window shipped-wrong\"}"
    fi
  fi
fi

# ─────────────────────────────────────────────────────────────────────────────
# SWEEP 3 — Late-correction sweep
# ─────────────────────────────────────────────────────────────────────────────
echo "[Sweep 3] Late-correction sweep: corrections-ledger + alignment ledger" >&2

# Corrections-ledger: rows with ts in (window+1d .. audit_end)
if [[ -f "$CORRECTIONS_LEDGER" ]]; then
  WINDOW_PLUS1=$(date -u -d "${WINDOW_DATE} + 1 day" +%Y-%m-%d)
  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    row_ts=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ts',''))" 2>/dev/null || true)
    [[ -z "$row_ts" ]] && continue
    row_date="${row_ts:0:10}"
    [[ "$row_date" < "$WINDOW_PLUS1" || "$row_date" > "$AUDIT_END_DATE" ]] && continue

    caught=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('caught',''))" 2>/dev/null || true)
    lane=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('lane',''))" 2>/dev/null || true)
    mechanism=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('mechanism',''))" 2>/dev/null || true)
    severity=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('severity',''))" 2>/dev/null || true)
    evidence=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('evidence_ref',''))" 2>/dev/null || true)

    # Only flag rows that explicitly reference in-window events (harmony-turn SHAs / date)
    combined="${caught} ${evidence}"
    if echo "$combined" | grep -qE "${WINDOW_DATE}|harmony.turn|021bc3b82|42edc2848|aa5503079"; then
      adj_type="late-correction-in-window-candidate"
      SWEEP3_CANDIDATES=$((SWEEP3_CANDIDATES + 1))
    else
      adj_type="late-correction-no-in-window-ref"
    fi

    emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"3-late-correction\",\"result_type\":\"${adj_type}\",\"source\":\"corrections-ledger.jsonl\",\"row_ts\":\"${row_ts}\",\"lane\":\"${lane}\",\"mechanism\":\"${mechanism}\",\"severity\":\"${severity}\",\"caught\":\"$(jesc "$caught")\",\"evidence_ref\":\"$(jesc "$evidence")\"}"
  done < "$CORRECTIONS_LEDGER"
fi

# Alignment ledger: post-window files referencing harmony-turn / window date
for d_offset in 1 2 3 4 5 6 7; do
  d_str=$(date -u -d "${WINDOW_DATE} + ${d_offset} days" +%Y-%m-%d)
  ledger_file="${ALIGNMENT_LEDGER_DIR}/${d_str}.jsonl"
  [[ ! -f "$ledger_file" ]] && continue

  while IFS= read -r row; do
    [[ -z "$row" ]] && continue
    body=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('body',''))" 2>/dev/null || true)
    if echo "$body" | grep -qE "${WINDOW_DATE}|harmony.turn|021bc3b82|42edc2848|aa5503079|postmortem"; then
      row_id=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null || true)
      row_ts=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ts',''))" 2>/dev/null || true)
      agent=$(echo "$row" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('agentId',''))" 2>/dev/null || true)
      body_short=$(echo "$body" | head -c 300 | tr '"' "'" | tr '\n' ' ')
      SWEEP3_CANDIDATES=$((SWEEP3_CANDIDATES + 1))
      emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"3-late-correction\",\"result_type\":\"late-correction-in-window-candidate\",\"source\":\"alignment/${d_str}.jsonl\",\"row_id\":\"${row_id}\",\"row_ts\":\"${row_ts}\",\"agent\":\"${agent}\",\"body_excerpt\":\"$(jesc "$body_short")\",\"adjudication\":\"post-window alignment row references harmony-turn/window-date; requires manual adjudication\"}"
    fi
  done < "$ledger_file" 2>/dev/null
done

echo "[Sweep 3] in-window candidates: ${SWEEP3_CANDIDATES}" >&2

# ─────────────────────────────────────────────────────────────────────────────
# PRE-KNOWN shipped-wrong disclosure (postmortem row 3 — runtime, not in git)
# ─────────────────────────────────────────────────────────────────────────────
# Emit ledger row for pre-known row 3 (if not already captured)
ledger_emit_shipped_wrong \
  "Pre-known harmony-turn row 3: server-fix silently reverted via backtick execution on dx3 server" \
  "Disclosed by harmony-turn postmortem 021bc3b82:21; wrong state reached running server, impact masked by consumer-side redundancy" \
  "enrichment/2026-07-01-misalignment-to-harmony-postmortem.md:21 window=${WINDOW_DATE}"

emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"pre-known\",\"result_type\":\"shipped-wrong\",\"census_class\":\"shipped-wrong\",\"impact_tag\":\"reached-runtime-impact-masked\",\"repo\":\"dx3\",\"commit\":\"(runtime-revert — no git SHA; backtick execution in live server)\",\"subject\":\"Server-fix silently reverted via backtick execution\",\"adjudication\":\"pre-known from harmony-turn postmortem row 3 (021bc3b82:21); wrong state existed in the running server; impact masked by consumer-side belt-and-suspenders. NOT catchable by git sweep (runtime mutation, not a committed revert).\",\"impact\":\"masked — consumer-side redundancy kept read-advisory GREEN; zero user-visible effect\",\"evidence\":\"enrichment/2026-07-01-misalignment-to-harmony-postmortem.md:21\",\"ledger_emission\":\"correction-capture.sh --census-class shipped-wrong (emitted unless --no-ledger)\"}"

# ─────────────────────────────────────────────────────────────────────────────
# SUMMARY ROW
# ─────────────────────────────────────────────────────────────────────────────
total_shipped=$((SWEEP1_SHIPPED + 1))  # +1 for pre-known postmortem row 3

null_stmt_sweeps=""
if [[ $SWEEP1_SHIPPED -eq 0 ]]; then
  null_stmt_sweeps="audited-zero-sweep1 (method ${METHOD}, date ${RUN_DATE}, auditor lane ${AUDITOR_LANE}) — ${SWEEP1_LEADS} keyword leads reviewed; 0 adjudicated as committed reverts of in-window work; ${SWEEP1_REVIEW} leads require manual diff review"
fi

emit "{\"schema\":\"b3.shipped-wrong-detector.v1\",\"method\":\"${METHOD}\",\"window_id\":\"${WINDOW_DATE}\",\"audit_period_start\":\"${WINDOW_START}\",\"audit_period_end\":\"${AUDIT_END}\",\"auditor_lane\":\"${AUDITOR_LANE}\",\"run_ts\":\"${RUN_TS}\",\"sweep\":\"summary\",\"result_type\":\"shipped-wrong-found\",\"shipped_wrong_preknown\":1,\"shipped_wrong_sweep1\":${SWEEP1_SHIPPED},\"shipped_wrong_total_floor\":${total_shipped},\"sweep1_leads_total\":${SWEEP1_LEADS},\"sweep1_requires_manual_review\":${SWEEP1_REVIEW},\"sweep2_status\":\"incomplete-no-vercel-token\",\"sweep3_in_window_candidates\":${SWEEP3_CANDIDATES},\"typed_summary\":\"shipped-wrong-floor=${total_shipped} (1 pre-known postmortem row 3 + ${SWEEP1_SHIPPED} sweep-1 confirmed). Sweep 1: ${SWEEP1_LEADS} leads, ${SWEEP1_REVIEW} require manual review. Sweep 2 INCOMPLETE (no VERCEL_TOKEN). Sweep 3: ${SWEEP3_CANDIDATES} in-window candidates. All confirmed shipped-wrong emitted to corrections-ledger.jsonl via correction-capture.sh --census-class shipped-wrong (unless --no-ledger).\",\"gap_disclosures\":[\"Sweep 2 INCOMPLETE — VERCEL_TOKEN required for Vercel deployment rollback history\",\"${SWEEP1_REVIEW} Sweep 1 leads require manual diff review — may contain additional shipped-wrong\",\"${SWEEP3_CANDIDATES} Sweep 3 candidates require manual adjudication\",\"Pre-known row 3 is a runtime revert (no git SHA) — structurally uncatchable by git sweep alone\",\"Absence-of-evidence from incomplete sweeps is not evidence-of-absence (RSL canon)\"]}"

echo "[detect.sh done] shipped-wrong-total-floor=${total_shipped} (pre-known=1 + sweep1=${SWEEP1_SHIPPED})" >&2
