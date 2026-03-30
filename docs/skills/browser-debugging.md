# Browser Debugging

> Teaches agents to use Playwright MCP tools to inspect the running NXTG-Forge UI -- taking screenshots, reading console errors, monitoring network requests, and verifying visual changes directly from Claude Code.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Performance & Debugging |

---

## What It Provides

Browser Debugging gives agents the knowledge to use Playwright MCP as a visual debugging tool for the NXTG-Forge web dashboard. Instead of guessing whether a UI change renders correctly, agents can navigate pages, capture screenshots, read console output, inspect network requests, and evaluate JavaScript in the page context -- all without leaving Claude Code.

Without this skill, agents working on the forge-ui dashboard must rely on the developer to manually verify changes in a browser and report back. With it, agents can self-verify their React fixes, confirm that console errors are resolved, and provide visual proof that a change works as intended.

The skill covers Playwright's headless Chromium running inside WSL, which means no Windows Chrome dependency is required. It provides three complete debugging workflows: checking for console errors, testing the Command Center, and verifying React bug fixes.

## When It Activates

- When an agent has made UI changes and needs to verify they render correctly
- When the user reports browser console errors in the dashboard
- When debugging React infinite loops, state issues, or rendering bugs
- When testing interactive UI components like the Command Center

## The Knowledge Inside

### Navigation and Interaction Tools

The skill catalogs every available Playwright MCP tool: `browser_navigate` for URL navigation, `browser_click`/`browser_type`/`browser_press_key` for interaction, `browser_hover` for hover states, `browser_select_option` for dropdowns, and `browser_drag` for drag-and-drop. Agents learn the full interaction vocabulary for automated UI testing.

### Screenshot and DOM Inspection

Two complementary inspection methods: `browser_screenshot` captures the page as an image for visual verification, while `browser_snapshot` returns the accessibility tree as structured data for programmatic assertions. Agents learn to use screenshots for visual confirmation and snapshots for element discovery (finding nav items, buttons, or specific components).

### Console and Network Monitoring

`browser_console_messages` reads all console output (errors, warnings, logs), making it the primary tool for detecting React errors like "Maximum update depth exceeded." `browser_network_requests` lists all HTTP requests the page made, letting agents verify that API calls succeed and return expected status codes. `browser_evaluate` runs arbitrary JavaScript in the page context for deeper inspection.

### Connection Architecture

Playwright runs headless Chromium inside WSL with no Windows dependency. The NXTG-Forge UI runs on port 5050 (Vite dev server) with the API server on port 5051. Agents learn to check that both servers are running before attempting browser debugging, and how to troubleshoot connection failures.

## How to Leverage It

After making UI changes, ask the agent to verify them visually. The agent will navigate to the dashboard, take a screenshot, and check for console errors.

### Example: Verifying a React Fix
```
User: "Verify that the infinite loop fix is working"
What happens: The agent navigates to localhost:5050, waits for the page to
load, reads console messages looking for "Maximum update depth" warnings,
takes a screenshot for visual confirmation, and reports whether the fix
resolved the issue.
```

## Power Applications

- Combine with network monitoring to verify that API integration changes work end-to-end
- Use `browser_evaluate` to inspect React component state for debugging complex state management issues
- Capture before/after screenshots to document visual changes in pull request descriptions

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **optimization** | Browser debugging provides frontend performance measurement data |
| **agent-qa-sentinel** | QA Sentinel uses browser debugging for E2E test verification |
| **domain-knowledge** | Domain knowledge provides context about which UI components to test |

## Tips

- Always check that the Vite dev server (port 5050) and API server (port 5051) are running before browser debugging
- Use `browser_snapshot` (accessibility tree) to find elements by text, then `browser_click` to interact -- more reliable than CSS selectors
- Console messages accumulate across navigations; check them immediately after the action you want to verify

---

*See also: [optimization](optimization.md), [agent-qa-sentinel](agent-qa-sentinel.md)*
