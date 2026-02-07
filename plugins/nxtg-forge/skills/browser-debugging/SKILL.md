---
name: Browser Debugging
description: Use Playwright MCP to see browser console errors, take screenshots, monitor network requests, and debug UI issues in the NXTG-Forge web dashboard. Activate when debugging UI bugs, verifying visual changes, or checking for console errors after code changes.
---

# Browser Debugging Skill

Use Playwright MCP tools to inspect the running NXTG-Forge UI directly from Claude Code.
Playwright runs its own headless Chromium inside WSL — no Windows Chrome dependency.

## When to Use This Skill

- After making UI changes — verify they render correctly
- When the user reports browser console errors
- After fixing React bugs (infinite loops, state issues) — confirm they're resolved
- When testing Command Center or any interactive UI component
- When you need to see what the user sees in their browser

## Prerequisites

The NXTG-Forge servers must be running:
- Vite dev server on port 5050: `npx vite --host 0.0.0.0 --port 5050`
- API server on port 5051: `npx tsx src/server/api-server.ts`

Playwright MCP is configured in `.mcp.json` and starts automatically.

## Available Tools (via Playwright MCP)

### Navigation & Interaction
- `browser_navigate` — Go to a URL (e.g., http://localhost:5050)
- `browser_click` — Click an element by text, selector, or coordinates
- `browser_type` — Type text into an input field
- `browser_press_key` — Press a keyboard key
- `browser_hover` — Hover over an element
- `browser_select_option` — Select from a dropdown
- `browser_drag` — Drag and drop

### Screenshots & DOM
- `browser_screenshot` — Capture the current page as an image
- `browser_snapshot` — Get accessibility tree snapshot (structured DOM)

### Console & JavaScript
- `browser_console_messages` — Read console output (errors, warnings, logs)
- `browser_evaluate` — Run JavaScript in the page context

### Network
- `browser_network_requests` — List all HTTP requests the page made

### Tab Management
- `browser_tab_list` — List all open tabs
- `browser_tab_new` — Open a new tab
- `browser_tab_select` — Switch to a different tab
- `browser_tab_close` — Close a tab

### File Operations
- `browser_file_upload` — Upload a file to an input
- `browser_pdf_save` — Save page as PDF

## Workflow: Check for Console Errors

1. Navigate to the NXTG-Forge UI:
   ```
   browser_navigate → http://localhost:5050
   ```

2. Wait for page to load, then check console:
   ```
   browser_console_messages
   ```

3. Take a screenshot to see current state:
   ```
   browser_screenshot
   ```

## Workflow: Test Command Center

1. `browser_navigate` → http://localhost:5050
2. `browser_snapshot` → find the "Command" nav item
3. `browser_click` → click "Command"
4. `browser_click` → click a command button (e.g., "Forge Status")
5. `browser_console_messages` → check for errors
6. `browser_screenshot` → verify result displayed
7. `browser_network_requests` → verify API call succeeded

## Workflow: Verify React Fix

After fixing a React infinite loop or state bug:
1. `browser_navigate` → http://localhost:5050
2. Wait 5 seconds (use browser_evaluate with setTimeout or just proceed)
3. `browser_console_messages` → look for "Maximum update depth" or "Warning"
4. If no errors, the fix is confirmed
5. `browser_screenshot` → visual confirmation

## Connection Details

- Playwright runs headless Chromium inside WSL (no Windows dependency)
- Configured with `--console-level error` to capture console errors
- NXTG-Forge UI at `http://localhost:5050` (Vite dev server)
- API server at `http://localhost:5051`

## Troubleshooting

If Playwright can't reach the UI:
1. Check Vite is running: `curl -sf http://localhost:5050`
2. Check API is running: `curl -sf http://localhost:5051/api/health`
3. Restart servers if needed
