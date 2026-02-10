#!/bin/bash
#
# NXTG-Forge Post-Task Hook
# Runs after Claude Code completes a task
#
# Environment Variables:
#   TASK_ID - Unique identifier for the task
#   TASK_STATUS - Status of completed task (success, failed, cancelled)
#   TASK_DURATION - Duration in seconds
#   FILES_MODIFIED - Number of files modified
#

set -e

# Load shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# Check if hooks are enabled
if ! hooks_enabled; then
    exit 0
fi

log_info "Post-task hook triggered"

# 1. Update project.json with completion status
if [ -n "$TASK_ID" ] && has_command jq && [ -f "$PROJECT_STATE_FILE" ]; then
    CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    STATUS="${TASK_STATUS:-completed}"

    jq --arg status "$STATUS" \
       --arg time "$CURRENT_TIME" \
       '.last_session.status = $status |
        .last_session.completed = $time |
        .project.last_updated = $time' \
       "$PROJECT_STATE_FILE" > "$PROJECT_STATE_FILE.tmp" && mv "$PROJECT_STATE_FILE.tmp" "$PROJECT_STATE_FILE"

    if [ "$STATUS" = "success" ]; then
        log_success "Task completed successfully"
    elif [ "$STATUS" = "failed" ]; then
        log_error "Task failed"
    else
        log_info "Task status: $STATUS"
    fi
fi

# 2. Run quality checks only if test files were modified in this session
MODIFIED_TEST_FILES=$(git diff --name-only 2>/dev/null | grep -cE '\.(test|spec)\.' || true)
if [ "$MODIFIED_TEST_FILES" -gt 0 ] 2>/dev/null; then
    log_info "Test files modified — running quick validation..."
    if [ -f "$PROJECT_ROOT/package.json" ]; then
        if timeout 10 npx vitest run --reporter=dot 2>/dev/null; then
            log_success "Quick validation passed"
        else
            log_warning "Some tests may need attention"
        fi
    elif [ -f "$PROJECT_ROOT/pyproject.toml" ] || [ -d "$PROJECT_ROOT/tests" ]; then
        if has_command python; then
            if timeout 10 python -m pytest tests/ --tb=no -q --maxfail=1 2>/dev/null; then
                log_success "Quick validation passed"
            else
                log_warning "Some tests may need attention"
            fi
        fi
    fi
fi

# 3. Check code quality (if modified Python files)
if [ -n "$FILES_MODIFIED" ] && [ "$FILES_MODIFIED" -gt 0 ]; then
    LINTER=$(get_linter)
    if has_command "$LINTER"; then
        log_info "Running $LINTER on modified files..."
        if lint_python_files; then
            log_success "No linting issues found"
        else
            log_warning "Linting issues detected (run 'make lint' for details)"
        fi
    fi
fi

# 4. Sync governance progress and log changes
if [ -f "$GOVERNANCE_STATE_FILE" ]; then
    log_info "Syncing governance state..."
    check_and_log_governance_progress
fi

# 5. Update quality metrics in project.json
if [ -f "$PROJECT_STATE_FILE" ]; then
    # Count test files across languages
    TEST_COUNT=$(find "$PROJECT_ROOT" -name "*.test.ts" -o -name "*.test.js" -o -name "*.spec.ts" -o -name "*.spec.js" -o -name "test_*.py" -type f 2>/dev/null | wc -l)

    if has_command jq && [ "$TEST_COUNT" -gt 0 ]; then
        jq --argjson count "$TEST_COUNT" \
           '.quality.tests.unit.total = $count' \
           "$PROJECT_STATE_FILE" > "$PROJECT_STATE_FILE.tmp" && mv "$PROJECT_STATE_FILE.tmp" "$PROJECT_STATE_FILE"
    fi
fi

# 6. Check safety constraints
if [ -n "$FILES_MODIFIED" ] && [ "$FILES_MODIFIED" -gt 0 ]; then
    MAX_CHANGES=$(get_max_file_changes)
    if [ "$FILES_MODIFIED" -gt "$MAX_CHANGES" ]; then
        log_warning "Modified $FILES_MODIFIED files (limit: $MAX_CHANGES from config)"
        log_info "Consider breaking this into smaller commits"
    fi
fi

# 7. Suggest next steps based on task status
if [ "$TASK_STATUS" = "success" ]; then
    COVERAGE_TARGET=$(get_test_coverage_target)
    log_info "Consider running:"
    echo "  - make test    # Run full test suite (target: ${COVERAGE_TARGET}%)"
    echo "  - make quality # Run all quality checks"
    echo "  - git status   # Review changes"
fi

# 8. Create automatic checkpoint for major milestones
if [ -n "$TASK_ID" ] && [ "$TASK_STATUS" = "success" ]; then
    # Check if this is a significant task (more than 5 files modified)
    if [ -n "$FILES_MODIFIED" ] && [ "$FILES_MODIFIED" -gt 5 ]; then
        log_info "Major task completed. Consider creating a checkpoint:"
        echo "  - /[FRG]-checkpoint \"After $TASK_ID\""
    fi
fi

# 9. Documentation sync check
DOC_MAPPING_FILE="$CLAUDE_DIR/config/doc-mapping.json"

if [ -f "$DOC_MAPPING_FILE" ] && has_command jq; then
    # Get changed files (staged + unstaged)
    CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null || git diff --name-only 2>/dev/null || echo "")

    if [ -n "$CHANGED_FILES" ]; then
        DOC_UPDATES_NEEDED=()

        # Check each changed file against doc mappings
        while IFS= read -r file; do
            [ -z "$file" ] && continue

            # Get matching docs from mapping (check if file matches any pattern)
            MATCHED_DOCS=$(jq -r --arg f "$file" '
                .mappings[] |
                select(.action == "notify" or .action == "auto_update") |
                select(
                    (.code_pattern | gsub("\\*"; ".*") | gsub("/"; "\\/")) as $pattern |
                    ($f | test($pattern))
                ) |
                "[\(.priority)] \(.docs | join(", "))"
            ' "$DOC_MAPPING_FILE" 2>/dev/null || echo "")

            if [ -n "$MATCHED_DOCS" ]; then
                DOC_UPDATES_NEEDED+=("$file → $MATCHED_DOCS")
            fi
        done <<< "$CHANGED_FILES"

        if [ ${#DOC_UPDATES_NEEDED[@]} -gt 0 ]; then
            echo ""
            log_warning "Documentation may need updates:"
            for item in "${DOC_UPDATES_NEEDED[@]}"; do
                echo "    📄 $item"
            done
            echo ""
            log_info "Run '/docs-status' to review or '/docs-update' to auto-update"
        fi
    fi
fi

# 10. Post session completion to sentinel (non-blocking)
STATUS="${TASK_STATUS:-completed}"
FILES="${FILES_MODIFIED:-0}"
if [ "$STATUS" = "success" ] || [ "$STATUS" = "completed" ]; then
    post_sentinel_event "SUCCESS" "session-hook" "Session completed ($FILES files modified)" "low" &
elif [ "$STATUS" = "failed" ]; then
    post_sentinel_event "WARN" "session-hook" "Session ended with failures ($FILES files modified)" "medium" &
fi

log_success "Post-task checks complete"
exit 0
