#!/bin/bash
#
# NXTG-Forge Hook Library
# Shared functions and config reading for all hooks
#

# Determine paths
if [ -n "$BASH_SOURCE" ]; then
    HOOKS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
else
    HOOKS_DIR="$(cd "$(dirname "$0")" && pwd)"
fi

# In plugin mode, Claude Code sets cwd to the user's project
export PROJECT_ROOT="$(pwd)"
export CLAUDE_DIR="$PROJECT_ROOT/.claude"
export CONFIG_FILE="$CLAUDE_DIR/config.json"
export PROJECT_STATE_FILE="$CLAUDE_DIR/project.json"
export GOVERNANCE_STATE_FILE="$CLAUDE_DIR/governance.json"

# Backward compatibility alias (deprecated - use PROJECT_STATE_FILE)
export STATE_FILE="$PROJECT_STATE_FILE"

# Colors for output
export RED='\033[0;31m'
export GREEN='\033[0;32m'
export YELLOW='\033[1;33m'
export BLUE='\033[0;34m'
export CYAN='\033[0;36m'
export NC='\033[0m' # No Color

# ===================================================================
# Config Reading Functions
# ===================================================================

# Check if hooks are enabled in config
hooks_enabled() {
    if [ ! -f "$CONFIG_FILE" ]; then
        echo "true"  # Default to enabled if no config
        return 0
    fi

    if command -v jq &> /dev/null; then
        local enabled=$(jq -r '.hooks.enabled // true' "$CONFIG_FILE" 2>/dev/null)
        echo "$enabled"
        [ "$enabled" = "true" ]
    else
        echo "true"
        return 0
    fi
}

# Get config value with default
get_config() {
    local key="$1"
    local default="${2:-null}"

    if [ ! -f "$CONFIG_FILE" ]; then
        echo "$default"
        return 1
    fi

    if command -v jq &> /dev/null; then
        jq -r "$key // $default" "$CONFIG_FILE" 2>/dev/null || echo "$default"
    else
        echo "$default"
        return 1
    fi
}

# Get testing configuration
get_test_coverage_target() {
    get_config '.testing.coverage_target' '86'
}

get_test_coverage_minimum() {
    get_config '.testing.coverage_minimum' '80'
}

# Get development tools
get_formatter() {
    get_config '.development.python.formatter' '"black"' | tr -d '"'
}

get_linter() {
    get_config '.development.python.linter' '"ruff"' | tr -d '"'
}

get_type_checker() {
    get_config '.development.python.type_checker' '"mypy"' | tr -d '"'
}

# Get safety settings
get_max_file_changes() {
    get_config '.safety.max_file_changes_per_commit' '50'
}

require_tests_for_commit() {
    local value=$(get_config '.safety.require_tests_for_commit' 'true')
    [ "$value" = "true" ]
}

prevent_force_push_main() {
    local value=$(get_config '.safety.prevent_force_push_main' 'true')
    [ "$value" = "true" ]
}

# ===================================================================
# Logging Functions
# ===================================================================

log_info() {
    echo -e "${BLUE}[Info]${NC} $*"
}

log_success() {
    echo -e "${GREEN}[Success]${NC} $*"
}

log_warning() {
    echo -e "${YELLOW}[Warning]${NC} $*"
}

log_error() {
    echo -e "${RED}[Error]${NC} $*"
}

log_debug() {
    if [ "${DEBUG:-0}" = "1" ]; then
        echo -e "${CYAN}[Debug]${NC} $*"
    fi
}

# ===================================================================
# State Management Functions
# ===================================================================

# Update state.json field
update_state() {
    local jq_filter="$1"

    if [ ! -f "$STATE_FILE" ]; then
        log_warning "state.json not found, cannot update"
        return 1
    fi

    if ! command -v jq &> /dev/null; then
        log_warning "jq not available, cannot update state"
        return 1
    fi

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    jq "$jq_filter | .project.last_updated = \"$timestamp\"" \
        "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
}

# Get state value
get_state() {
    local key="$1"
    local default="${2:-null}"

    if [ ! -f "$STATE_FILE" ]; then
        echo "$default"
        return 1
    fi

    if command -v jq &> /dev/null; then
        jq -r "$key // $default" "$STATE_FILE" 2>/dev/null || echo "$default"
    else
        echo "$default"
        return 1
    fi
}

# ===================================================================
# Governance State Functions
# ===================================================================

# Calculate and sync workstream progress from tasks
sync_governance_progress() {
    if [ ! -f "$GOVERNANCE_STATE_FILE" ]; then
        log_warning "Governance state file not found"
        return 1
    fi

    if ! command -v jq &> /dev/null; then
        log_warning "jq not available, cannot sync governance"
        return 1
    fi

    # Calculate progress for each workstream based on completed tasks
    local updated=$(jq '
        .workstreams = [.workstreams[] |
            . as $ws |
            ($ws.tasks | map(select(.status == "completed")) | length) as $completed |
            ($ws.tasks | length) as $total |
            (if $total > 0 then (($completed / $total) * 100 | floor) else 0 end) as $progress |
            .progress = $progress |
            .metrics.progress = $progress |
            .metrics.tasksCompleted = $completed |
            .metrics.totalTasks = $total
        ]
    ' "$GOVERNANCE_STATE_FILE")

    echo "$updated" > "$GOVERNANCE_STATE_FILE.tmp" && mv "$GOVERNANCE_STATE_FILE.tmp" "$GOVERNANCE_STATE_FILE"
    log_success "Synced governance workstream progress"
}

# Append entry to governance sentinel log
append_sentinel_log() {
    local log_type="$1"      # INFO, WARN, ERROR, SUCCESS, CRITICAL
    local message="$2"
    local category="${3:-governance}"
    local severity="${4:-low}"

    if [ ! -f "$GOVERNANCE_STATE_FILE" ]; then
        return 1
    fi

    if ! command -v jq &> /dev/null; then
        return 1
    fi

    local timestamp=$(date +%s)000
    local log_id="oracle-${timestamp}-$$"

    jq --arg id "$log_id" \
       --argjson ts "$timestamp" \
       --arg type "$log_type" \
       --arg sev "$severity" \
       --arg cat "$category" \
       --arg msg "$message" \
       '.sentinelLog += [{
           "id": $id,
           "timestamp": $ts,
           "type": $type,
           "severity": $sev,
           "category": $cat,
           "source": "forge-oracle",
           "message": $msg,
           "context": {},
           "actionRequired": false
       }]' "$GOVERNANCE_STATE_FILE" > "$GOVERNANCE_STATE_FILE.tmp" && mv "$GOVERNANCE_STATE_FILE.tmp" "$GOVERNANCE_STATE_FILE"
}

# Get governance workstream summary
get_governance_summary() {
    if [ ! -f "$GOVERNANCE_STATE_FILE" ] || ! command -v jq &> /dev/null; then
        echo "unknown"
        return 1
    fi

    jq -r '.workstreams | map("\(.id): \(.metrics.tasksCompleted)/\(.metrics.totalTasks) (\(.progress)%)") | join(", ")' "$GOVERNANCE_STATE_FILE" 2>/dev/null
}

# Check if governance progress changed and log it
check_and_log_governance_progress() {
    if [ ! -f "$GOVERNANCE_STATE_FILE" ] || ! command -v jq &> /dev/null; then
        return 1
    fi

    # Get current progress before sync
    local before=$(jq '[.workstreams[].progress] | add / length | floor' "$GOVERNANCE_STATE_FILE" 2>/dev/null)

    # Sync progress from tasks
    sync_governance_progress

    # Get progress after sync
    local after=$(jq '[.workstreams[].progress] | add / length | floor' "$GOVERNANCE_STATE_FILE" 2>/dev/null)

    # If progress changed significantly (>= 5%), log it
    if [ -n "$before" ] && [ -n "$after" ]; then
        local diff=$((after - before))
        if [ "$diff" -ge 5 ] || [ "$diff" -le -5 ]; then
            local summary=$(get_governance_summary)
            append_sentinel_log "INFO" "Governance status update: $summary" "governance" "low"
            log_info "Governance progress updated: $before% -> $after%"
        fi

        # Log completion milestone
        if [ "$after" -eq 100 ] && [ "$before" -lt 100 ]; then
            append_sentinel_log "SUCCESS" "All workstreams complete - ready to ship" "governance" "low"
            log_success "All governance workstreams at 100%!"
        fi
    fi
}

# ===================================================================
# Validation Functions
# ===================================================================

# Validate JSON file
validate_json() {
    local file="$1"

    if [ ! -f "$file" ]; then
        log_error "File not found: $file"
        return 1
    fi

    if ! command -v jq &> /dev/null; then
        log_warning "jq not available, cannot validate JSON"
        return 0
    fi

    if jq empty "$file" 2>/dev/null; then
        return 0
    else
        log_error "Invalid JSON in: $file"
        return 1
    fi
}

# Validate config.json against requirements
validate_config() {
    if [ ! -f "$CONFIG_FILE" ]; then
        log_warning "config.json not found at: $CONFIG_FILE"
        return 1
    fi

    if ! validate_json "$CONFIG_FILE"; then
        return 1
    fi

    # Check required sections
    local required_sections=("project" "development" "testing" "hooks")
    local missing=()

    for section in "${required_sections[@]}"; do
        if ! jq -e ".$section" "$CONFIG_FILE" > /dev/null 2>&1; then
            missing+=("$section")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_error "Missing required config sections: ${missing[*]}"
        return 1
    fi

    log_success "Config validation passed"
    return 0
}

# ===================================================================
# File System Functions
# ===================================================================

# Check if file is a Python file
is_python_file() {
    local file="$1"
    [[ "$file" == *.py ]]
}

# Check if file is in tests directory
is_test_file() {
    local file="$1"
    [[ "$file" == */tests/* ]] || [[ "$file" == *test_*.py ]]
}

# Get file extension
get_file_extension() {
    local file="$1"
    echo "${file##*.}"
}

# ===================================================================
# Tool Detection Functions
# ===================================================================

# Check if a command is available
has_command() {
    command -v "$1" &> /dev/null
}

# Check for required Python tools
check_python_tools() {
    local tools=($(get_formatter) $(get_linter) $(get_type_checker))
    local missing=()

    for tool in "${tools[@]}"; do
        if ! has_command "$tool"; then
            missing+=("$tool")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        log_warning "Missing Python tools: ${missing[*]}"
        log_info "Install with: pip install ${missing[*]}"
        return 1
    fi

    return 0
}

# ===================================================================
# Git Functions
# ===================================================================

# Check if in git repository
is_git_repo() {
    git rev-parse --git-dir > /dev/null 2>&1
}

# Get current branch
get_current_branch() {
    if is_git_repo; then
        git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown"
    else
        echo "not-a-repo"
    fi
}

# Check for uncommitted changes
has_uncommitted_changes() {
    if is_git_repo; then
        ! git diff-index --quiet HEAD -- 2>/dev/null
    else
        return 1
    fi
}

# Count uncommitted files
count_uncommitted_files() {
    if is_git_repo; then
        git status --porcelain 2>/dev/null | wc -l
    else
        echo "0"
    fi
}

# ===================================================================
# Testing Functions
# ===================================================================

# Run quick test validation
run_quick_tests() {
    local test_dir="$PROJECT_ROOT/tests"

    if [ ! -d "$test_dir" ]; then
        log_info "No tests directory found"
        return 0
    fi

    if ! has_command python; then
        log_warning "Python not available, skipping tests"
        return 0
    fi

    log_info "Running quick test validation..."

    # Run with timeout
    if timeout 10 python -m pytest "$test_dir" --tb=no -q --maxfail=1 2>/dev/null; then
        log_success "Quick tests passed"
        return 0
    else
        log_warning "Some tests failed (run 'make test' for details)"
        return 1
    fi
}

# Check test coverage
check_coverage() {
    local target=$(get_test_coverage_target)

    if ! has_command python; then
        log_warning "Python not available, skipping coverage check"
        return 0
    fi

    if ! has_command pytest; then
        log_warning "pytest not available, skipping coverage check"
        return 0
    fi

    log_info "Checking test coverage (target: $target%)..."

    # This is a placeholder - actual implementation would run coverage
    log_info "Run 'make test' for full coverage report"
}

# ===================================================================
# Code Quality Functions
# ===================================================================

# Format Python file
format_python_file() {
    local file="$1"
    local formatter=$(get_formatter)

    if [ ! -f "$file" ]; then
        return 1
    fi

    if has_command "$formatter"; then
        if [ "$formatter" = "black" ]; then
            black "$file" --quiet 2>/dev/null && return 0
        fi
    fi

    return 1
}

# Lint Python files
lint_python_files() {
    local linter=$(get_linter)

    if has_command "$linter"; then
        log_info "Running $linter..."
        if [ "$linter" = "ruff" ]; then
            # Only lint Python files if project has Python code
            if [ -d "$PROJECT_ROOT/src" ]; then
                ruff check "$PROJECT_ROOT/src" --quiet 2>/dev/null && return 0
            elif [ -d "$PROJECT_ROOT/forge" ]; then
                ruff check "$PROJECT_ROOT/forge" --quiet 2>/dev/null && return 0
            fi
        fi
    fi

    return 1
}

# Type check Python files
type_check_python() {
    local type_checker=$(get_type_checker)

    if has_command "$type_checker"; then
        log_info "Running $type_checker..."
        if [ "$type_checker" = "mypy" ]; then
            # Only type check if project has Python code
            if [ -d "$PROJECT_ROOT/src" ]; then
                mypy "$PROJECT_ROOT/src" --quiet 2>/dev/null && return 0
            elif [ -d "$PROJECT_ROOT/forge" ]; then
                mypy "$PROJECT_ROOT/forge" --quiet 2>/dev/null && return 0
            fi
        fi
    fi

    return 1
}

# ===================================================================
# Utility Functions
# ===================================================================

# Print a separator line
print_separator() {
    echo "────────────────────────────────────────────────────────────"
}

# Print header
print_header() {
    local title="$1"
    echo ""
    print_separator
    echo -e "${BLUE}$title${NC}"
    print_separator
}

# ===================================================================
# Sentinel API Functions
# ===================================================================

# Post event to sentinel log (direct file write — no API dependency)
post_sentinel_event() {
    local log_type="$1"      # INFO, WARN, ERROR, SUCCESS, CRITICAL
    local source="$2"        # e.g. "pre-task-hook", "post-task-hook"
    local message="$3"
    local severity="${4:-low}"

    # Write directly to governance.json sentinel log
    append_sentinel_log "$log_type" "$message" "session" "$severity"
}

# Export all functions for use in hooks
export -f hooks_enabled
export -f get_config
export -f get_test_coverage_target
export -f get_test_coverage_minimum
export -f get_formatter
export -f get_linter
export -f get_type_checker
export -f get_max_file_changes
export -f require_tests_for_commit
export -f prevent_force_push_main
export -f log_info
export -f log_success
export -f log_warning
export -f log_error
export -f log_debug
export -f update_state
export -f get_state
export -f validate_json
export -f validate_config
export -f is_python_file
export -f is_test_file
export -f get_file_extension
export -f has_command
export -f check_python_tools
export -f is_git_repo
export -f get_current_branch
export -f has_uncommitted_changes
export -f count_uncommitted_files
export -f run_quick_tests
export -f check_coverage
export -f format_python_file
export -f lint_python_files
export -f type_check_python
export -f print_separator
export -f print_header
export -f sync_governance_progress
export -f append_sentinel_log
export -f get_governance_summary
export -f check_and_log_governance_progress
export -f post_sentinel_event
