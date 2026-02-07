#!/bin/bash
#
# NXTG-Forge Root Cleanliness Audit
# Runs at end of every session to catch any misplaced files
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

VIOLATIONS=0

for file in "$PROJECT_ROOT"/*.md; do
    [ -f "$file" ] || continue
    filename=$(basename "$file")

    case "$filename" in
        README.md|CLAUDE.md|CONTRIBUTING.md|CHANGELOG.md) continue ;;
        LICENSING.md|LICENSE.md|SECURITY.md|SBOM.md) continue ;;
        GETTING-STARTED.md|ACTION-PLAN.md) continue ;;
        CODE_OF_CONDUCT.md|SUPPORT.md) continue ;;
        *)
            log_warning "MISPLACED: $filename should not be in project root"
            VIOLATIONS=$((VIOLATIONS + 1))
            ;;
    esac
done

if [ $VIOLATIONS -gt 0 ]; then
    log_error "$VIOLATIONS misplaced .md file(s) in project root!"
    log_info "Run: git mv <file> docs/reports/ to fix"
else
    log_success "Root directory clean - no misplaced files"
fi

exit 0
