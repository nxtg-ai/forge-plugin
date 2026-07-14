---
name: Browser Debugging
description: >
  Debug the running NXTG-Forge web dashboard by driving a headless Chromium via the
  Playwright MCP server — read console errors, take screenshots, inspect the DOM
  accessibility tree, and watch network requests. Use when the dashboard renders blank
  or broken after a UI change, when the user reports browser console errors, after fixing
  a React bug (infinite loop, "Maximum update depth", stale state) to confirm it's gone,
  or when verifying a visual/interactive change (Command Center, Infinity Terminal) in the
  real running app rather than from tests alone.
when_to_use: >
  "blank page", "white screen", "console errors", "check the browser", "take a screenshot
  of the UI", "does the dashboard render", "verify the React fix", "Maximum update depth",
  "did my UI change work", "test Command Center", "network request failing in the browser".
allowed-tools: Bash(curl *), Bash(npm run *), mcp__playwright__browser_navigate, mcp__playwright__browser_snapshot, mcp__playwright__browser_take_screenshot, mcp__playwright__browser_console_messages, mcp__playwright__browser_network_requests, mcp__playwright__browser_click, mcp__playwright__browser_type, mcp__playwright__browser_wait_for, mcp__playwright__browser_evaluate
---

# Browser Debugging Skill

Drive a real (headless) Chromium against the running NXTG-Forge dashboard from inside
Claude Code, using the **Playwright MCP** server. No Windows Chrome dependency — Playwright
launches its own headless Chromium inside WSL.

## Where the tools come from (read first)

The Playwright MCP server is registered in **`forge-ui/.mcp.json`**, NOT in the plugin's
`.mcp.json` (which only registers governance / orchestrator / semgrep). The `browser_*` tools
only exist when a Claude Code session has `forge-ui/.mcp.json` loaded — i.e. you are working in
the `forge-ui/` repo. From the plugin repo alone they are unavailable. Config as shipped:

```jsonc
"playwright": { "command": "npx", "args": ["@playwright/mcp@latest", "--headless", "--console-level", "debug"] }
```

Two consequences of that exact config:
- `--console-level debug` → `browser_console_messages` returns **verbose debug logs**, not just
  errors. Filter for `error`/`warning` yourself; do not assume a clean-looking tail means no errors.
- **No `--caps`** flag → the `pdf`, `vision` (coordinate clicks/screenshots), and `devtools`
  capabilities are OFF. `browser_pdf_save` and coordinate-based interaction are not available here.

## Prerequisites

Start both servers from `forge-ui/` (one command starts Vite :5050 + Express API :5051):

```bash
cd forge-ui && npm run dev
```

Confirm they're up before driving the browser:

```bash
curl -sf http://localhost:5050 >/dev/null && echo "UI up"
curl -sf http://localhost:5051/api/health >/dev/null && echo "API up"
```

## Core tools (Playwright MCP)

| Task | Tool |
|------|------|
| Go to a URL | `browser_navigate` |
| Get the DOM as an accessibility tree (**+ element refs**) | `browser_snapshot` |
| Capture the page as an image | `browser_take_screenshot` |
| Read console output | `browser_console_messages` |
| List HTTP requests the page made | `browser_network_requests` |
| Wait for text / state (not a fixed sleep) | `browser_wait_for` |
| Click / type on a snapshot element | `browser_click` / `browser_type` (need a `ref`) |
| Run JS in page context | `browser_evaluate` |
| Multiple tabs | `browser_tabs` (single tool, `action` arg) |

The interaction model is **snapshot-first**: `browser_snapshot` returns the accessibility
tree with an element `ref` for each node; `browser_click` / `browser_type` operate on those
refs. You cannot click by raw CSS selector or by pixel coordinates in this config — snapshot,
find the element, then act on its ref.

## Workflow: dashboard is blank / has console errors

1. `browser_navigate` → `http://localhost:5050`
2. `browser_console_messages` → scan for `error` entries (React errors, failed imports,
   `Maximum update depth`, uncaught exceptions). Debug-level noise is expected — grep for `error`.
3. `browser_network_requests` → any `4xx`/`5xx`? A failed `/api/*` call (API server down or
   route 500) is the most common cause of a blank data panel.
4. `browser_take_screenshot` → capture the rendered state for the report.

## Workflow: verify a React fix (infinite loop / stale state)

1. `browser_navigate` → `http://localhost:5050` (fresh navigate reloads the Vite bundle — do
   NOT reuse a stale open page after an HMR edit).
2. `browser_wait_for` → wait for a stable element/text instead of guessing a sleep.
3. `browser_console_messages` → confirm no `Maximum update depth exceeded` / `Warning:` reappears.
4. `browser_take_screenshot` → visual confirmation.

## Workflow: test Command Center interaction

1. `browser_navigate` → `http://localhost:5050`
2. `browser_snapshot` → locate the "Command" nav item, grab its `ref`
3. `browser_click` (that `ref`) → open Command Center
4. `browser_snapshot` again → grab the `ref` of a command button (e.g. "Forge Status")
5. `browser_click` (that `ref`)
6. `browser_console_messages` → check for errors triggered by the action
7. `browser_network_requests` → confirm the backing API call returned `2xx`
8. `browser_take_screenshot` → verify the result rendered

## Gotchas

- **The tools live in `forge-ui/.mcp.json`, not the plugin.** A session opened only in
  `forge-plugin/` has no `browser_*` tools. Work from `forge-ui/`.
- **Headless Chromium is a fresh, isolated session — it is NOT the user's browser.** No user
  cookies, auth, or localStorage carry over. A screenshot shows what a clean anonymous session
  renders, not "what the user sees" in their logged-in Windows Chrome. If a bug depends on auth
  state you must reproduce that state in the headless session first.
- **`--console-level debug` means console output is noisy.** Absence of a visible error at the
  tail of `browser_console_messages` is not proof of no error — filter the full list for `error`.
- **Snapshot before you interact.** `browser_click`/`browser_type` require a `ref` from
  `browser_snapshot`. Clicking "by text" or by coordinates does not work in this config
  (no `--caps vision`). Re-snapshot after any navigation or DOM change — refs go stale.
- **`browser_pdf_save` is unavailable** here (needs `--caps pdf`); so is coordinate-based
  screenshotting/clicking (`--caps vision`). Don't reach for them.
- **Tab tools are consolidated.** Current Playwright MCP exposes a single `browser_tabs` tool
  with an `action` argument — the old `browser_tab_list` / `browser_tab_new` / `browser_tab_select`
  / `browser_tab_close` names do not exist.
- **Re-navigate after an HMR edit.** A page left open from before your code change may still show
  the old bundle; `browser_navigate` fresh to force the current build.
- **`forge-ui/.mcp.json` also pins a stale `forge` server path** (`--project .../v3`, the old
  pre-rename directory). Unrelated to browser debugging, but don't be surprised the orchestrator
  MCP there points at a dead path.

## Troubleshooting

If Playwright can't reach the UI:
1. `curl -sf http://localhost:5050` — Vite up?
2. `curl -sf http://localhost:5051/api/health` — API up?
3. Restart with `cd forge-ui && npm run dev` if either fails.
4. If the `browser_*` tools themselves are missing, confirm the session loaded
   `forge-ui/.mcp.json` (you're in the `forge-ui/` repo), then reconnect the MCP server.
