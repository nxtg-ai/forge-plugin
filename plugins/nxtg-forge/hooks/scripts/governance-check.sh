#!/bin/bash
#
# NXTG-Forge Governance Check
# PostToolUse hook for Edit/Write - enforces code quality rules
# NON-BLOCKING advisory (exit 0 always) - logs violations to sentinel
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# Get file path from environment or stdin
FILE_PATH="${CLAUDE_FILE_PATH:-}"
if [ -z "$FILE_PATH" ]; then
    INPUT=$(cat 2>/dev/null || echo "")
    if [ -n "$INPUT" ] && command -v jq &>/dev/null; then
        FILE_PATH=$(echo "$INPUT" | jq -r '.file_path // empty' 2>/dev/null || echo "")
    fi
fi

# If no file path, skip
[ -z "$FILE_PATH" ] && exit 0

# Only check TypeScript/JavaScript/Python/Rust/Go source files
case "$FILE_PATH" in
    */src/*|*/app/*|*/lib/*|*/source/*) ;;
    *.ts|*.tsx|*.js|*.jsx|*.py|*.rs|*.go) ;;
    *) exit 0 ;;
esac

# Skip test files - they may need looser rules
case "$FILE_PATH" in
    *__tests__*|*.test.*|*.spec.*) exit 0 ;;
esac

# Skip if file doesn't exist (deleted)
[ ! -f "$FILE_PATH" ] && exit 0

VIOLATIONS=0
WARNINGS=""

# ============================================================
# RULE 1: No 'as any' in production code
# ============================================================
ANY_COUNT=$(grep -c 'as any' "$FILE_PATH" 2>/dev/null || true)
ANY_COUNT=${ANY_COUNT:-0}
if [ "$ANY_COUNT" -gt 0 ] 2>/dev/null; then
    VIOLATIONS=$((VIOLATIONS + ANY_COUNT))
    LINES=$(grep -n 'as any' "$FILE_PATH" | head -5 | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
    WARNINGS="${WARNINGS}\n  [ANY] $ANY_COUNT 'as any' cast(s) at line(s): $LINES"
fi

# ============================================================
# RULE 2: No unwrapErr() - use .error property
# ============================================================
UNWRAP_COUNT=$(grep -c 'unwrapErr()' "$FILE_PATH" 2>/dev/null || true)
UNWRAP_COUNT=${UNWRAP_COUNT:-0}
if [ "$UNWRAP_COUNT" -gt 0 ] 2>/dev/null; then
    VIOLATIONS=$((VIOLATIONS + UNWRAP_COUNT))
    LINES=$(grep -n 'unwrapErr()' "$FILE_PATH" | head -5 | cut -d: -f1 | tr '\n' ',' | sed 's/,$//')
    WARNINGS="${WARNINGS}\n  [API] $UNWRAP_COUNT 'unwrapErr()' call(s) at line(s): $LINES - use .error property"
fi

# ============================================================
# RULE 3: No console.log in production (use logger)
# ============================================================
CONSOLE_COUNT=$(grep -c 'console\.log\b' "$FILE_PATH" 2>/dev/null || true)
CONSOLE_COUNT=${CONSOLE_COUNT:-0}
if [ "$CONSOLE_COUNT" -gt 0 ] 2>/dev/null; then
    REAL_COUNT=$(grep 'console\.log\b' "$FILE_PATH" | grep -cv '^\s*//' 2>/dev/null || true)
    REAL_COUNT=${REAL_COUNT:-0}
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        VIOLATIONS=$((VIOLATIONS + REAL_COUNT))
        WARNINGS="${WARNINGS}\n  [LOG] $REAL_COUNT console.log(s) - use structured logger"
    fi
fi

# ============================================================
# RULE 4: No hardcoded localhost URLs
# ============================================================
LOCALHOST_COUNT=$(grep -c 'localhost:[0-9]' "$FILE_PATH" 2>/dev/null || true)
LOCALHOST_COUNT=${LOCALHOST_COUNT:-0}
if [ "$LOCALHOST_COUNT" -gt 0 ] 2>/dev/null; then
    REAL_COUNT=$(grep 'localhost:[0-9]' "$FILE_PATH" | grep -cv '^\s*//' 2>/dev/null || true)
    REAL_COUNT=${REAL_COUNT:-0}
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        WARNINGS="${WARNINGS}\n  [URL] $REAL_COUNT hardcoded localhost URL(s) - use env config"
    fi
fi

# ============================================================
# Report Results
# ============================================================
if [ $VIOLATIONS -gt 0 ]; then
    FILENAME=$(basename "$FILE_PATH")
    log_warning "GOVERNANCE: $VIOLATIONS violation(s) in $FILENAME"
    echo -e "$WARNINGS"

    # Log to governance sentinel
    append_sentinel_log "WARN" \
        "Code governance: $VIOLATIONS violation(s) in $FILENAME" \
        "code-quality" "medium" 2>/dev/null || true
fi

# Always exit 0 - governance is advisory, not blocking
exit 0
