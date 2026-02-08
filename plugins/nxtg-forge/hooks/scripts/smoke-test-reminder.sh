#!/bin/bash
# Smoke Test Reminder Hook
# Triggers on Stop event to remind about real integration testing.
#
# This hook exists because on 2026-02-06, an agent spent an entire day
# writing 2326 mock unit tests while the actual product was broken.
# A duplicate placeholder route intercepted all real requests.
# Nobody caught it because nobody started the actual server.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
# In plugin mode, Claude Code sets cwd to the user's project
PROJECT_ROOT="$(pwd)"

# Check if test files were modified in this session
MODIFIED_TEST_FILES=$(git diff --name-only 2>/dev/null | grep -c '\.test\.' || true)
MODIFIED_SERVER_FILES=$(git diff --name-only 2>/dev/null | grep -c 'api-server\|server/' || true)

if [ "$MODIFIED_TEST_FILES" -gt 3 ] || [ "$MODIFIED_SERVER_FILES" -gt 0 ]; then
  echo ""
  echo -e "\033[1;33m[Smoke Test Reminder]\033[0m Server or test files were modified."
  echo -e "  Run: \033[1m./scripts/smoke-test.sh\033[0m"
  echo -e "  Quick: \033[1m./scripts/smoke-test.sh --quick\033[0m"
  echo ""
  echo "  Mock unit tests DO NOT verify the real server works."
  echo "  Smoke tests start the real server and hit real endpoints."
fi
