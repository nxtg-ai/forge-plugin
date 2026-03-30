# /forge:dashboard

> Open the visual governance dashboard in your browser -- a self-contained HTML snapshot of project health, metrics, and status powered by Tailwind CSS.

| | |
|---|---|
| **Level** | L3 Ship Lord |
| **Category** | Governance |
| **Syntax** | `/forge:dashboard` |

---

## What It Does

`/forge:dashboard` generates and opens a visual HTML dashboard in your browser. The dashboard is created by the governance MCP server's `forge_open_dashboard` tool, which reads live project data (health scores, governance state, git status, code metrics) at generation time and produces a self-contained HTML file with Tailwind CSS styling. No running server is required -- it is a static snapshot that opens as a local file.

The dashboard shows your project name, health score with letter grade, and detailed metrics in a visually designed interface. It works across platforms: on WSL2 it opens via the Windows browser, on macOS via the default browser, and on Linux via xdg-open. If auto-open fails, the command displays a clickable file URL you can copy into your browser.

Without this command, visualizing project health means reading terminal output from `/forge:status` and mentally mapping numbers to a picture. The dashboard gives you an at-a-glance visual representation that is easier to scan, share with stakeholders, and screenshot for reports.

## Syntax & Options

```
/forge:dashboard
```

This command takes no arguments. It generates and opens the dashboard.

## When to Use It

- **Stakeholder demos**: Open the dashboard to show project health visually instead of sharing terminal output.
- **Team standups**: Display the dashboard on a shared screen for a quick visual status check.
- **Personal orientation**: When you want a graphical overview instead of a text-based one.

For text-based status that stays in the terminal, use `/forge:status`. For the full React-based dashboard with real-time updates and the Infinity Terminal, install forge-ui and visit localhost:5050.

## Examples

### Example 1: Open Dashboard

```
/forge:dashboard
```

```
## Dashboard opened!

**my-api** - Health: 84/100 (B)

Open: file:///tmp/forge-dashboard-my-api.html
```

The dashboard opens in your default browser showing health scores, project metadata, and governance state in a styled layout.

### Example 2: Fallback Mode

If the MCP server is unavailable, the command falls back to a text-based health summary using governance.json and git status data directly.

## Power Use Cases

Generate the dashboard before a sprint review or stakeholder meeting. The HTML file is self-contained -- you can email it, attach it to a Slack message, or embed it in a wiki. Each generation is a fresh snapshot, so generating at sprint boundaries creates a visual history.

On WSL2, the dashboard opens in your Windows browser automatically. This bridge between your Linux development environment and Windows desktop makes the dashboard accessible without additional configuration.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/forge:status** | Text-based alternative that stays in the terminal |
| **/forge:status-enhanced** | Deeper metrics that feed into the dashboard's data |
| **/forge:gap-analysis** | Run analysis first, then open the dashboard to see the updated health score |
| **forge-ui** | The full React dashboard at localhost:5050 provides real-time updates; this command provides static snapshots |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Fallback text-based health summary when MCP server is available |
| **L2 Pro Builder** | HTML dashboard generation via governance MCP with health scoring |
| **L3 Ship Lord** | Full forge-ui React dashboard at localhost:5050 with real-time WebSocket updates and Infinity Terminal |

## Tips & Gotchas

- The dashboard is a static HTML snapshot. It does not update in real-time. Regenerate it to see current data.
- The output includes a `url` field (file:// URL) and a `path` field. Always use the URL to open in a browser -- the path would open in your code editor.
- The Tailwind CSS is loaded from CDN, so you need internet connectivity for proper styling on first view (subsequent views are cached).
- On WSL2, browser opening uses the `open` npm package which handles the Windows bridge automatically.

---

*See also: [status](../commands/status.md) | [status-enhanced](../commands/status-enhanced.md) | [gap-analysis](../commands/gap-analysis.md)*
