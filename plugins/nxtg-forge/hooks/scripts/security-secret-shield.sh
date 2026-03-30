#!/bin/bash
#
# NXTG-Forge Security: Secret Shield
# PreToolUse hook for Read/Write/Edit — blocks access to sensitive files
#
# BLOCKING: exit 2 = block tool call, exit 0 = allow
# Input: JSON on stdin with { tool_name, tool_input: { file_path, ... } }
#

INPUT=$(cat 2>/dev/null || echo "{}")
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // empty' 2>/dev/null || echo "")

# No file path or no jq = allow
[ -z "$FILE_PATH" ] && exit 0

# Get just the filename for pattern matching
FILENAME=$(basename "$FILE_PATH")
FILENAME_LOWER=$(echo "$FILENAME" | tr '[:upper:]' '[:lower:]')

# ── Allow-list: safe files that match sensitive patterns ──────────
case "$FILENAME_LOWER" in
    .env.example|.env.sample|.env.template|.env.test|.env.development.example)
        exit 0 ;;
    *.example|*.sample|*.template)
        exit 0 ;;
esac

# Skip test fixtures and documentation
case "$FILE_PATH" in
    *__tests__*|*/test/*|*/tests/*|*/fixtures/*|*/testdata/*)
        exit 0 ;;
    *.md|*.mdx|*.txt|*.rst)
        exit 0 ;;
esac

# ── L2: Environment files with secrets ────────────────────────────
case "$FILENAME_LOWER" in
    .env|.env.local|.env.production|.env.staging|.env.development)
        echo "SECURITY BLOCK: Direct access to $FILENAME" >&2
        echo "Environment files may contain secrets. Use .env.example as a template." >&2
        exit 2 ;;
    .env.*)
        # Catch remaining .env variants (but .env.example already allowed above)
        if ! echo "$FILENAME_LOWER" | grep -qE '\.(example|sample|template|test)$'; then
            echo "SECURITY BLOCK: Access to environment file $FILENAME" >&2
            echo "This file may contain secrets. Use .env.example instead." >&2
            exit 2
        fi ;;
esac

# ── L2: Private keys and certificates ────────────────────────────
case "$FILENAME_LOWER" in
    *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore)
        echo "SECURITY BLOCK: Access to private key/certificate $FILENAME" >&2
        echo "Private keys should never be read or modified by AI agents." >&2
        exit 2 ;;
    id_rsa|id_ed25519|id_ecdsa|id_dsa)
        echo "SECURITY BLOCK: Access to SSH private key $FILENAME" >&2
        exit 2 ;;
esac

# ── L2: Credential files ─────────────────────────────────────────
case "$FILENAME_LOWER" in
    credentials|credentials.*|*credentials*.json|*credentials*.yml|*credentials*.yaml)
        echo "SECURITY BLOCK: Access to credentials file $FILENAME" >&2
        exit 2 ;;
    *secret*key*|*api*key*.json|*token*.json)
        echo "SECURITY BLOCK: Access to secret/token file $FILENAME" >&2
        exit 2 ;;
esac

# ── L2: SSH/AWS/GnuPG directories ────────────────────────────────
case "$FILE_PATH" in
    */.ssh/*|*/.gnupg/*|*/.aws/credentials|*/.aws/config)
        echo "SECURITY BLOCK: Access to sensitive config directory" >&2
        echo "Path: $FILE_PATH" >&2
        exit 2 ;;
esac

# ── L2: Kubernetes secrets ────────────────────────────────────────
case "$FILENAME_LOWER" in
    kubeconfig|.kubeconfig)
        echo "SECURITY BLOCK: Access to Kubernetes config $FILENAME" >&2
        exit 2 ;;
esac

# All checks passed — allow access
exit 0
