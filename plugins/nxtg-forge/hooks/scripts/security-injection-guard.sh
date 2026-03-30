#!/bin/bash
#
# NXTG-Forge Security: Injection Guard
# PreToolUse hook for Write/Edit — blocks code with dangerous injection patterns
#
# BLOCKING: exit 2 = block tool call, exit 0 = allow
# Input: JSON on stdin with { tool_name, tool_input: { content/new_string, file_path } }
#

INPUT=$(cat 2>/dev/null || echo "{}")

# Extract the code content being written/edited
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

# ── Skip: test files, configs, documentation ──────────────────────
case "$FILE_PATH" in
    *__tests__*|*.test.*|*.spec.*|*/test/*|*/tests/*|*/fixtures/*)
        exit 0 ;;
    *.md|*.mdx|*.txt|*.rst|*.json|*.yaml|*.yml|*.toml|*.ini|*.cfg)
        exit 0 ;;
    *.sh|*.bash)
        # Shell scripts legitimately use eval/exec — skip
        exit 0 ;;
esac

FINDINGS=""

# ── L3: JavaScript/TypeScript eval() ─────────────────────────────
# Match eval( with user-controlled input patterns, not static strings
if echo "$CONTENT" | grep -qE '\beval\s*\(' 2>/dev/null; then
    # Allow: eval in comments
    REAL_EVAL=$(echo "$CONTENT" | grep -E '\beval\s*\(' | grep -cvE '^\s*(//|/\*|\*|#)' 2>/dev/null || echo "0")
    if [ "$REAL_EVAL" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - eval() detected: code execution vulnerability (CWE-95)\n"
    fi
fi

# ── L3: new Function() constructor ───────────────────────────────
if echo "$CONTENT" | grep -qE '\bnew\s+Function\s*\(' 2>/dev/null; then
    REAL_FUNC=$(echo "$CONTENT" | grep -E '\bnew\s+Function\s*\(' | grep -cvE '^\s*(//|/\*|\*|#)' 2>/dev/null || echo "0")
    if [ "$REAL_FUNC" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - new Function() detected: dynamic code generation (CWE-95)\n"
    fi
fi

# ── L3: Python os.system() ───────────────────────────────────────
if echo "$CONTENT" | grep -qE '\bos\.system\s*\(' 2>/dev/null; then
    REAL_OS=$(echo "$CONTENT" | grep -E '\bos\.system\s*\(' | grep -cvE '^\s*#' 2>/dev/null || echo "0")
    if [ "$REAL_OS" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - os.system() detected: use subprocess.run() with shell=False (CWE-78)\n"
    fi
fi

# ── L3: Python subprocess with shell=True ─────────────────────────
if echo "$CONTENT" | grep -qE '\bsubprocess\.(run|call|Popen|check_output)\s*\(.*shell\s*=\s*True' 2>/dev/null; then
    REAL_SUB=$(echo "$CONTENT" | grep -E 'shell\s*=\s*True' | grep -cvE '^\s*#' 2>/dev/null || echo "0")
    if [ "$REAL_SUB" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - subprocess with shell=True: command injection risk (CWE-78)\n"
    fi
fi

# ── L3: Node.js child_process.exec (unescaped shell) ─────────────
if echo "$CONTENT" | grep -qE '\bchild_process\.exec(Sync)?\s*\(' 2>/dev/null; then
    REAL_CP=$(echo "$CONTENT" | grep -E '\bchild_process\.exec' | grep -cvE '^\s*(//|/\*|\*|#)' 2>/dev/null || echo "0")
    if [ "$REAL_CP" -gt 0 ] 2>/dev/null; then
        FINDINGS="${FINDINGS}  - child_process.exec() detected: use execFile() or spawn() instead (CWE-78)\n"
    fi
fi

# ── L3: PHP system/exec/passthru ─────────────────────────────────
if echo "$CONTENT" | grep -qE '\b(system|passthru|shell_exec|popen)\s*\(' 2>/dev/null; then
    case "$FILE_PATH" in
        *.php)
            FINDINGS="${FINDINGS}  - PHP shell execution function detected (CWE-78)\n"
            ;;
    esac
fi

# ── Report findings ──────────────────────────────────────────────
if [ -n "$FINDINGS" ]; then
    echo "SECURITY BLOCK: Code injection patterns detected in $(basename "$FILE_PATH")" >&2
    echo -e "$FINDINGS" >&2
    echo "Use safe alternatives: parameterized commands, execFile(), subprocess.run(shell=False)." >&2
    exit 2
fi

exit 0
