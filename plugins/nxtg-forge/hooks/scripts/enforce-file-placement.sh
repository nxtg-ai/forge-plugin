#!/bin/bash
#
# NXTG-Forge File Placement Enforcement
# Prevents documentation sprawl by validating file locations
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

# If no file path, allow
[ -z "$FILE_PATH" ] && exit 0

FILENAME=$(basename "$FILE_PATH")

# Only check .md files
case "$FILENAME" in
    *.md) ;;
    *) exit 0 ;;
esac

# Get directory - only enforce on project root
FILE_DIR=$(dirname "$FILE_PATH")
case "$FILE_DIR" in
    "$PROJECT_ROOT"|".")
        # File is in project root - check it
        ;;
    *)
        # File is in a subdirectory - that's fine
        exit 0
        ;;
esac

# Allowed root files (whitelist)
case "$FILENAME" in
    README.md|CLAUDE.md|CONTRIBUTING.md|CHANGELOG.md) exit 0 ;;
    LICENSING.md|LICENSE.md|SECURITY.md|SBOM.md) exit 0 ;;
    GETTING-STARTED.md|ACTION-PLAN.md) exit 0 ;;
    CODE_OF_CONDUCT.md|SUPPORT.md) exit 0 ;;
esac

# If we get here, the file is NOT in the whitelist
# Determine where it should go based on name patterns
UPPER=$(echo "$FILENAME" | tr '[:lower:]' '[:upper:]')
SUGGESTED="docs/"

case "$UPPER" in
    *AUDIT*|*REPORT*|*SYNTHESIS*|*CANONICAL*|*EMERGENCY*|*TACTICAL*|*STATUS*|*DELIVERABLE*|*HONEST*)
        SUGGESTED="docs/reports/"
        ;;
    *TEST-COVERAGE*|*TESTING-*|*TEST-GENERATION*|*TEST-PLAN*)
        SUGGESTED="docs/reports/"
        ;;
    *FIX-SUMMARY*|*FIX-GUIDE*|*PRIORITY*|*ROADMAP*)
        SUGGESTED="docs/operations/"
        ;;
    *SPEC*|*MARKETPLACE*|*SKILL-PACK*)
        SUGGESTED="docs/specs/"
        ;;
    *ARCHITECTURE*)
        SUGGESTED="docs/architecture/"
        ;;
    *TUTORIAL*)
        SUGGESTED="docs/tutorials/"
        ;;
    *BEST-PRACTICE*)
        SUGGESTED="docs/best-practices/"
        ;;
esac

log_warning "FILE PLACEMENT: $FILENAME in project root — consider moving to $SUGGESTED"

# Log to governance
append_sentinel_log "WARN" \
    "File placement violation: $FILENAME written to root instead of $SUGGESTED" \
    "file-placement" "medium" 2>/dev/null || true

# Advisory only — do not block the Write tool
exit 0
