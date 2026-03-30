# Dev Environment Patterns

> Institutional knowledge from real debugging sessions -- multi-device access patterns, WSL2 networking, server binding, and Vite proxy configuration that prevent hours of debugging common development environment issues.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Workflow |

---

## What It Provides

This skill is a living document of hard-won lessons from real development environment debugging sessions. It encodes the specific patterns that prevent multi-device access failures (mobile, tablet, other PCs), CORS errors, WebSocket disconnections, and the invisible `.env` override trap where environment variables compiled into the bundle override runtime URL detection. These are not theoretical concerns -- each pattern was documented after a real incident cost hours of debugging.

Without this skill, agents set up development environments that work on localhost but break everywhere else. They hardcode `localhost:5051` in environment variables, bind servers to `127.0.0.1` instead of `0.0.0.0`, skip Vite proxy configuration, and generate CORS configuration that is unnecessary when proxying is done correctly. The skill teaches agents to avoid these traps by encoding the correct patterns and their rationale.

The knowledge is narrow and deep: it covers the specific problem of multi-device development access in detail, with root cause analysis, correct patterns, anti-patterns, and a debugging checklist. This depth makes it immediately actionable rather than theoretically interesting.

## When It Activates

- When setting up a Vite, Express, or Node.js development server
- When configuring multi-device access for development (mobile testing, WSL2)
- When debugging CORS errors, connection refused, or WebSocket failures in dev mode
- When writing `.env` files or configuring API URL construction

Skills load automatically based on context. The user does not invoke them -- they activate when relevant.

## The Knowledge Inside

### The .env Override Trap

The most insidious pattern: `.env` files with `VITE_API_URL=http://localhost:5051/api` are injected into the JavaScript bundle at build time. Code that checks `import.meta.env.VITE_API_URL` uses the hardcoded value, making the app work on the dev machine but fail on every other device. From a mobile phone, `localhost` refers to the phone itself, not the dev server. The fix: never set `VITE_API_URL` in development `.env` files. Use relative URLs (`/api`) in dev mode, which Vite's proxy forwards to the correct backend.

### The Correct URL Construction Pattern

A three-tier fallback: if `VITE_API_URL` is set (production builds), use it. If `DEV` mode is detected, use relative URLs (`/api`). Otherwise, construct the URL dynamically from `window.location.hostname`. This pattern works on localhost, on LAN IP addresses, and in production -- without any environment-specific configuration in development.

### Server Binding for Network Access

`0.0.0.0` accepts connections from all network interfaces. `127.0.0.1` only accepts connections from the local machine. For development servers that need network access (WSL2, mobile testing, multi-device), always bind to `0.0.0.0`. The Vite config needs `server: { host: '0.0.0.0' }`, Express needs `app.listen(port, '0.0.0.0')`. Security note: this is appropriate for local development on trusted networks, not for production.

### Vite Proxy as CORS Elimination

When the frontend proxies API requests through Vite (`/api` -> `localhost:5051`), the browser sees same-origin requests. No CORS headers needed. No preflight requests. No `Access-Control-Allow-Origin` configuration. The proxy handles the cross-origin concern at the dev server level, eliminating an entire category of development environment bugs.

## How to Leverage It

When setting up a new project with a frontend dev server and backend API, follow the patterns in this skill from the start. When debugging "connection refused" or CORS errors in development, run through the debugging checklist before investigating further.

### Example: Dev Server Setup

```
User: "Set up the Vite dev server to work from my phone for mobile testing"

What happens: The skill activates and the agent configures Vite with host: '0.0.0.0',
sets up proxy rules for /api and /ws, removes any hardcoded localhost URLs from .env,
and implements the three-tier URL construction pattern in the API client. The result
works on localhost, LAN IPs, and any device on the network.
```

## Power Applications

The debugging checklist is the most immediately valuable part of this skill. When multi-device access fails: check .env for hardcoded localhost URLs, verify Vite config has `host: '0.0.0.0'`, verify proxy configuration, restart Vite after env changes, hard refresh browser to clear cached JS, check browser console for the actual URL being requested. This ordered checklist resolves most issues in under 5 minutes.

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **claude-code-framework** | Platform architecture that these dev environment patterns support |
| **coding-standards** | Code patterns (URL construction, config management) applied to dev setup |
| **security** | Security considerations for network-exposed dev servers |

## Tips

- This is a living document. New patterns are added after real debugging sessions.
- The `.env` override trap is the most common issue. If something works on localhost but fails on other devices, check `.env` first.

---

*See also: [security](security.md) | [claude-code-framework](claude-code-framework.md)*
