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

[ "${FORGE_HOOK_VERBOSE:-0}" = "1" ] && log_info "Pre-task hook triggered"

# 1. Validate config.json (skip silently if not present — it's optional)
if [ -f "$CONFIG_FILE" ]; then
    validate_config || log_warning "Config validation failed"
fi

# 2. Check for project.json (optional — session tracking)
if [ -f "$PROJECT_STATE_FILE" ]; then
    log_debug "project.json found"
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

# 4. Check for uncommitted changes — advisory fires only on meaningful staleness
# (>10 dirty files or any tracked modified file older than 30 min)
if has_meaningful_uncommitted_changes; then
    log_info "You have uncommitted changes. Consider committing before major tasks."
fi

# 5. Check that either init has run (/nxtg-forge:init or `forge init`; see governance_file)
if ! governance_file >/dev/null; then
    log_info "No governance.json found in .claude/ or .forge/. Run /nxtg-forge:init or forge init to set up Forge."
fi

# 5b. Say once per session which plugin MCP servers are off on this machine, and why.
# Each one runs a stand-in when its runtime is missing (servers/lib/unavailable-mcp.sh), so it
# never shows as a failed server; this is the user-facing line that names the fix.
HOOK_INPUT=""
[ -t 0 ] || HOOK_INPUT="$(cat 2>/dev/null || true)"
SESSION_ID="unknown"
if [[ "$HOOK_INPUT" =~ \"session_id\"[[:space:]]*:[[:space:]]*\"([A-Za-z0-9_-]+)\" ]]; then
    SESSION_ID="${BASH_REMATCH[1]}"
fi
NOTICE_DIR="${TMPDIR:-/tmp}/nxtg-forge-$(id -u)"
NOTICE_MARK="$NOTICE_DIR/deps-$SESSION_ID"
if [ "$SESSION_ID" = "unknown" ] || [ ! -e "$NOTICE_MARK" ]; then
    mkdir -p "$NOTICE_DIR" 2>/dev/null && : > "$NOTICE_MARK" 2>/dev/null || true
    NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]' 2>/dev/null || echo 0)"
    if [[ ! "$NODE_MAJOR" =~ ^[0-9]+$ ]] || [ "$NODE_MAJOR" -lt 20 ]; then
        log_warning "Health scoring is off: the governance MCP server needs Node.js 20 or newer (https://nodejs.org). Install it, then start a new Claude Code session."
    fi
    if ! has_command jq && ! has_command awk; then
        log_warning "The 4 blocking security guards cannot read tool input (they need jq or awk), so they block every call they cover. Install jq (apt install jq / brew install jq)."
    fi
    FIND_FORGE="$SCRIPT_DIR/../../servers/lib/find-forge.sh"
    if [ -f "$FIND_FORGE" ] && ! bash "$FIND_FORGE" >/dev/null 2>&1; then
        log_info "Optional orchestrator (L2) not installed: curl -fsSL https://forge.nxtg.ai/install.sh | sh, then start a new Claude Code session."
    fi
    if ! has_command semgrep-mcp && ! has_command uvx; then
        log_info "Optional Semgrep MCP tools are off: install uv (https://docs.astral.sh/uv/) or pip install semgrep-mcp."
    fi
fi

# 6. Check Python tools (only for Python projects)
if [ -f "$PROJECT_ROOT/pyproject.toml" ] || [ -f "$PROJECT_ROOT/setup.py" ] || [ -f "$PROJECT_ROOT/requirements.txt" ]; then
    check_python_tools || log_info "Install tools with: pip install $(get_formatter) $(get_linter) $(get_type_checker)"
fi

# 7. Post session start to sentinel (non-blocking)
BRANCH=$(get_current_branch)
UNCOMMITTED=$(count_uncommitted_files)
post_sentinel_event "INFO" "session-hook" "Session started on branch $BRANCH ($UNCOMMITTED uncommitted files)" "low" &

[ "${FORGE_HOOK_VERBOSE:-0}" = "1" ] && log_success "Pre-task checks complete"
exit 0
