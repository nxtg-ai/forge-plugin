#!/bin/bash
#
# NXTG-Forge Security: Semgrep Auto-Scan
# PostToolUse hook for Write/Edit — runs Semgrep SAST on modified files
#
# NON-BLOCKING: always exit 0 (advisory only)
# Input: JSON on stdin with { tool_name, tool_input: { file_path, ... } }
#

INPUT=$(cat 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

# No file path = skip
[ -z "$FILE_PATH" ] && exit 0
# File doesn't exist (deleted) = skip
[ ! -f "$FILE_PATH" ] && exit 0

# ── Skip: non-source files ───────────────────────────────────────
case "$FILE_PATH" in
    *.ts|*.tsx|*.js|*.jsx|*.py|*.rs|*.go|*.java|*.rb|*.php|*.c|*.cpp|*.cs)
        ;; # Source files — scan
    *)
        exit 0 ;; # Markdown, JSON, YAML, etc — skip
esac

# ── Skip: test files (reduce noise) ──────────────────────────────
case "$FILE_PATH" in
    *__tests__*|*.test.*|*.spec.*|*/test/*|*/tests/*|*/fixtures/*)
        exit 0 ;;
esac

# ── Check: is Semgrep installed? ─────────────────────────────────
if ! command -v semgrep &>/dev/null; then
    # Only show install hint once per session (use a temp marker)
    MARKER="/tmp/.forge-semgrep-hint-$$"
    if [ ! -f "$MARKER" ]; then
        echo -e "\033[0;34m[Info]\033[0m Install Semgrep for automatic SAST scanning: pip install semgrep"
        touch "$MARKER" 2>/dev/null
    fi
    exit 0
fi

# ── Run Semgrep on the single file ───────────────────────────────
FILENAME=$(basename "$FILE_PATH")
RESULTS=$(semgrep scan --config auto --quiet --json "$FILE_PATH" 2>/dev/null)

if [ $? -ne 0 ] || [ -z "$RESULTS" ]; then
    # Semgrep failed or no output — don't block
    exit 0
fi

# Count findings
FINDING_COUNT=$(echo "$RESULTS" | jq '.results | length' 2>/dev/null || echo "0")

if [ "$FINDING_COUNT" -gt 0 ] 2>/dev/null; then
    echo -e "\033[1;33m[Semgrep]\033[0m $FINDING_COUNT finding(s) in $FILENAME:"

    # Show top 5 findings (severity + rule + line)
    echo "$RESULTS" | jq -r '.results[:5][] |
        "  [\(.extra.severity // "warning" | ascii_upcase)] \(.check_id) (line \(.start.line))"
    ' 2>/dev/null

    if [ "$FINDING_COUNT" -gt 5 ]; then
        echo "  ... and $((FINDING_COUNT - 5)) more. Run: semgrep scan --config auto $FILE_PATH"
    fi
fi

# Always advisory — never block
exit 0
