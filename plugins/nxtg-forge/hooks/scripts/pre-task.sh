#!/bin/bash
#
# NXTG-Forge Pre-Task Hook
# Runs before Claude Code starts executing a task
#
# Environment Variables:
#   TASK_ID - Unique identifier for the task
#   TASK_DESCRIPTION - Description of the task
#   AGENT_TYPE - Type of agent handling the task (if applicable)
#

set -e

# Load shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib.sh"

# Check if hooks are enabled
if ! hooks_enabled; then
    log_info "Hooks are disabled in config.json"
    exit 0
fi

log_info "Pre-task hook triggered"

# 1. Validate config.json
validate_config || log_warning "Config validation failed"

# 2. Ensure project.json exists
if [ ! -f "$PROJECT_STATE_FILE" ]; then
    log_warning "project.json not found, creating from template..."
    if [ -f "$PROJECT_STATE_FILE.template" ]; then
        cp "$PROJECT_STATE_FILE.template" "$PROJECT_STATE_FILE"
        # Update timestamps
        CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
        if has_command jq; then
            jq --arg time "$CURRENT_TIME" \
                '.project.created_at = $time | .project.last_updated = $time' \
                "$PROJECT_STATE_FILE" > "$PROJECT_STATE_FILE.tmp" && mv "$PROJECT_STATE_FILE.tmp" "$PROJECT_STATE_FILE"
        fi
        log_success "Created project.json from template"
    else
        log_warning "project.json.template not found"
    fi
fi

# 3. Update last session info
if [ -n "$TASK_ID" ] && has_command jq && [ -f "$PROJECT_STATE_FILE" ]; then
    CURRENT_TIME=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq --arg id "$TASK_ID" \
       --arg time "$CURRENT_TIME" \
       --arg task "${TASK_DESCRIPTION:-Unknown task}" \
       --arg agent "${AGENT_TYPE:-general}" \
       '.last_session.id = $id |
        .last_session.started = $time |
        .last_session.task = $task |
        .last_session.agent = $agent |
        .last_session.status = "in_progress" |
        .project.last_updated = $time' \
       "$PROJECT_STATE_FILE" > "$PROJECT_STATE_FILE.tmp" && mv "$PROJECT_STATE_FILE.tmp" "$PROJECT_STATE_FILE"

    log_success "Updated project.json with task info"
fi

# 4. Check for uncommitted changes
if has_uncommitted_changes; then
    log_info "You have uncommitted changes. Consider committing before major tasks."
fi

# 5. Validate project structure
REQUIRED_DIRS=("forge" ".claude/skills" ".claude/commands")
for dir in "${REQUIRED_DIRS[@]}"; do
    if [ ! -d "$PROJECT_ROOT/$dir" ]; then
        log_warning "Required directory missing: $dir"
    fi
done

# 6. Check Python tools
check_python_tools || log_info "Install tools with: pip install $(get_formatter) $(get_linter) $(get_type_checker)"

# 7. Post session start to sentinel (non-blocking)
BRANCH=$(get_current_branch)
UNCOMMITTED=$(count_uncommitted_files)
post_sentinel_event "INFO" "session-hook" "Session started on branch $BRANCH ($UNCOMMITTED uncommitted files)" "low" &

log_success "Pre-task checks complete"
exit 0
