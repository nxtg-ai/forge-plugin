#!/bin/bash
#
# NXTG-Forge Security: SQL Injection Guard
# PreToolUse hook for Write/Edit — detects string concatenation with SQL keywords
#
# BLOCKING: exit 2 = block tool call, exit 0 = allow
# Input: JSON on stdin with { tool_name, tool_input: { content/new_string, file_path } }
#

INPUT=$(cat 2>/dev/null || echo "{}")

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null || echo "")
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

if [ "$TOOL_NAME" = "Write" ]; then
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.content // empty' 2>/dev/null || echo "")
elif [ "$TOOL_NAME" = "Edit" ]; then
    CONTENT=$(echo "$INPUT" | jq -r '.tool_input.new_string // empty' 2>/dev/null || echo "")
else
    exit 0
fi

# No content = nothing to check
[ -z "$CONTENT" ] && exit 0

# ── Skip: test files, configs, documentation, SQL migrations ─────
case "$FILE_PATH" in
    *__tests__*|*.test.*|*.spec.*|*/test/*|*/tests/*|*/fixtures/*)
        exit 0 ;;
    *.md|*.mdx|*.txt|*.rst|*.json|*.yaml|*.yml|*.toml)
        exit 0 ;;
    *.sql|*/migrations/*|*/seeds/*)
        # Pure SQL files and migrations use SQL directly — that's fine
        exit 0 ;;
    *.sh|*.bash)
        exit 0 ;;
esac

FINDINGS=""

# ── L4: String concatenation + SQL keywords ───────────────────────
# Pattern: SQL keyword followed by string concat operators
# Detects: "SELECT * FROM users WHERE id = " + userId
#          `SELECT * FROM users WHERE id = ${userId}`
#          f"SELECT * FROM users WHERE id = {user_id}"

# Check for template literal SQL injection (JavaScript/TypeScript)
if echo "$CONTENT" | grep -qE '`\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|EXEC|EXECUTE)\b[^`]*\$\{' 2>/dev/null; then
    REAL_COUNT=$(echo "$CONTENT" | grep -E '`\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE)\b[^`]*\$\{' | grep -cvE '^\s*(//|/\*|\*|#)' 2>/dev/null || echo "0")
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - Template literal SQL with interpolation detected (CWE-89)\n"
    fi
fi

# Check for string concatenation SQL injection (JS/TS/Java)
if echo "$CONTENT" | grep -qiE '("|'"'"')\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*\1\s*\+' 2>/dev/null; then
    REAL_COUNT=$(echo "$CONTENT" | grep -iE '".*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b.*"\s*\+' | grep -cvE '^\s*(//|/\*|\*|#)' 2>/dev/null || echo "0")
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - String concatenation with SQL keyword detected (CWE-89)\n"
    fi
fi

# Check for Python f-string SQL injection
if echo "$CONTENT" | grep -qE 'f("|'"'"')\s*(SELECT|INSERT|UPDATE|DELETE|DROP|ALTER)\b.*\{' 2>/dev/null; then
    REAL_COUNT=$(echo "$CONTENT" | grep -E 'f("|'"'"').*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b.*\{' | grep -cvE '^\s*#' 2>/dev/null || echo "0")
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - Python f-string SQL injection detected (CWE-89)\n"
    fi
fi

# Check for Python %-format SQL injection
if echo "$CONTENT" | grep -qiE '("|'"'"')\s*(SELECT|INSERT|UPDATE|DELETE|DROP)\b.*\1\s*%' 2>/dev/null; then
    REAL_COUNT=$(echo "$CONTENT" | grep -iE '".*\b(SELECT|INSERT|UPDATE|DELETE|DROP)\b.*"\s*%' | grep -cvE '^\s*#' 2>/dev/null || echo "0")
    if [ "$REAL_COUNT" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - Python %-format SQL injection detected (CWE-89)\n"
    fi
fi

# ── Report findings ──────────────────────────────────────────────
if [ -n "$FINDINGS" ]; then
    echo "SECURITY BLOCK: SQL injection patterns detected in $(basename "$FILE_PATH")" >&2
    echo -e "$FINDINGS" >&2
    echo "Use parameterized queries instead:" >&2
    echo "  JS/TS: db.query('SELECT * FROM users WHERE id = ?', [userId])" >&2
    echo "  Python: cursor.execute('SELECT * FROM users WHERE id = %s', (user_id,))" >&2
    echo "  Rust: sqlx::query!(\"SELECT * FROM users WHERE id = $1\", user_id)" >&2
    exit 2
fi

exit 0
