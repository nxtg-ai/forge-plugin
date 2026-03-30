#!/bin/bash
#
# NXTG-Forge Security: Command Guard
# PreToolUse hook for Bash — blocks dangerous shell commands
#
# BLOCKING: exit 2 = block tool call, exit 0 = allow
# Input: JSON on stdin with { tool_name, tool_input: { command } }
#

INPUT=$(cat 2>/dev/null || echo "{}")
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty' 2>/dev/null || echo "")

# No command or no jq = allow
[ -z "$COMMAND" ] && exit 0

# Normalize for matching (lowercase, collapse whitespace)
CMD_NORM=$(echo "$COMMAND" | tr '[:upper:]' '[:lower:]' | tr -s '[:space:]' ' ')

# ── L1: Destructive recursive deletion of root/home ──────────────
# Block: rm -rf /, rm -rf /*, rm -rf ~, rm -rf $HOME
# Allow: rm -rf node_modules/, rm -rf /tmp/build (has path suffix)
if echo "$CMD_NORM" | grep -qE 'rm\s+(-[a-z]*r[a-z]*\s+)*(-[a-z]*f[a-z]*\s+)*/\s*$'; then
    echo "SECURITY BLOCK: Recursive deletion of root filesystem (rm -rf /)" >&2
    echo "If you need to remove a specific directory, include the full path." >&2
    exit 2
fi
if echo "$CMD_NORM" | grep -qE 'rm\s+(-[a-z]*r[a-z]*\s+)*(-[a-z]*f[a-z]*\s+)*/\*\s*$'; then
    echo "SECURITY BLOCK: Recursive deletion of all root contents (rm -rf /*)" >&2
    exit 2
fi
if echo "$CMD_NORM" | grep -qE 'rm\s+(-[a-z]*r[a-z]*\s+)*(-[a-z]*f[a-z]*\s+)*(~|\$home)\s*$'; then
    echo "SECURITY BLOCK: Recursive deletion of home directory" >&2
    exit 2
fi

# ── L1: chmod 777 (world-writable) ───────────────────────────────
if echo "$CMD_NORM" | grep -qE 'chmod\s+(-r\s+)?777\b'; then
    echo "SECURITY BLOCK: chmod 777 makes files world-writable" >&2
    echo "Use specific permissions instead: 644 (files), 755 (dirs/scripts)." >&2
    exit 2
fi

# ── L1: Pipe-to-shell (remote code execution) ────────────────────
if echo "$CMD_NORM" | grep -qE '(curl|wget)\s+[^\|]+\|\s*(ba)?sh'; then
    echo "SECURITY BLOCK: Piping remote content directly to shell" >&2
    echo "Download the script first, review it, then execute." >&2
    exit 2
fi

# ── L1: Fork bomb ────────────────────────────────────────────────
if echo "$COMMAND" | grep -qE ':\(\)\s*\{.*\|.*&\s*\}'; then
    echo "SECURITY BLOCK: Fork bomb detected" >&2
    exit 2
fi

# ── L1: Disk destruction ─────────────────────────────────────────
if echo "$CMD_NORM" | grep -qE 'dd\s+if=.*of=/dev/[a-z]'; then
    echo "SECURITY BLOCK: Direct disk write via dd detected" >&2
    exit 2
fi
if echo "$CMD_NORM" | grep -qE 'mkfs\.[a-z]'; then
    echo "SECURITY BLOCK: Filesystem creation (mkfs) detected" >&2
    exit 2
fi

# ── L1: Force push to main/master ────────────────────────────────
if echo "$CMD_NORM" | grep -qE 'git\s+push\s+.*--force.*\b(main|master)\b'; then
    echo "SECURITY BLOCK: Force push to main/master rewrites shared history" >&2
    echo "Use --force-with-lease for safer force pushes, or push to a branch." >&2
    exit 2
fi
if echo "$CMD_NORM" | grep -qE 'git\s+push\s+.*\b(main|master)\b.*--force'; then
    echo "SECURITY BLOCK: Force push to main/master rewrites shared history" >&2
    exit 2
fi

# ── L1: Dangerous git reset ──────────────────────────────────────
if echo "$CMD_NORM" | grep -qE 'git\s+reset\s+--hard\s+origin/'; then
    echo "SECURITY BLOCK: git reset --hard to remote discards all local changes" >&2
    echo "Consider git stash first, or use git reset --soft." >&2
    exit 2
fi

# All checks passed — allow the command
exit 0
