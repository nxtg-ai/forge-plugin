#!/usr/bin/env bash
# Semgrep MCP launcher (optional SAST tools).
# Runs semgrep-mcp if installed, else via uvx. With neither, starts a stand-in that says what
# to install instead of failing: Claude Code caches a failed start for 15 minutes.

set -u
HERE="$(cd "$(dirname "$0")" && pwd)"

if command -v semgrep-mcp >/dev/null 2>&1; then
  exec semgrep-mcp
fi
if command -v uvx >/dev/null 2>&1; then
  exec uvx semgrep-mcp
fi

exec bash "$HERE/../lib/unavailable-mcp.sh" semgrep-mcp \
  "Semgrep MCP tools are optional and need uv or semgrep-mcp. To add them, install uv (https://docs.astral.sh/uv/) or run: pip install semgrep-mcp, then start a new Claude Code session."
