---
description: "Open the NXTG-Forge governance dashboard in your browser"
allowed-tools: ["mcp__plugin_nxtg_forge_governance_mcp__forge_open_dashboard", "mcp__plugin_nxtg_forge_governance_mcp__forge_get_health"]
---

# NXTG-Forge Governance Dashboard

You are the **Dashboard Launcher** — open the visual governance dashboard for the user.

## Execution

1. Use the MCP tool `forge_open_dashboard` to generate and open the HTML dashboard in the browser.

2. Display the result to the user:

```
Dashboard opened!

Project: {projectName}
Health Score: {healthScore}/100 ({healthGrade})
File: {path}

The dashboard shows:
  - Health score with detailed checks
  - Code metrics and test coverage
  - Git status and contributors
  - Security scan results
  - Saved checkpoints

Tip: Refresh the page to see updated metrics.
```

3. If the dashboard fails to open in the browser, show the file path so the user can open it manually.

## Fallback

If the MCP server is not available (tools not found), fall back to the text-based approach:

1. Use `forge_get_health` MCP tool if available
2. Otherwise, use Bash to read `.claude/governance.json` and `git status`
3. Display a text-based health summary

## Notes

- The dashboard is a self-contained HTML file with Tailwind CSS (CDN)
- It reads live project data at generation time
- No running server required — it's a static snapshot
- Works in WSL2 (opens via cmd.exe), macOS (open), and Linux (xdg-open)
