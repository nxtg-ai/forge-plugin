---
name: Dev Environment Patterns
description: >
  Debug and configure local dev-server networking for multi-device access — Vite
  proxy, env-var URL priority, 0.0.0.0 binding, and WSL2 quirks. Use when API/fetch
  or WebSocket calls fail from a phone/tablet/other PC ("localhost refused", CORS
  blocked, NetworkError, WS won't connect), when a server is only reachable from
  localhost, when a leftover VITE_API_URL breaks dev, or when setting up network
  access on WSL2.
when_to_use: >
  Triggers: "works on my machine but not my phone", "CORS blocked localhost:5051",
  "NetworkError when attempting to fetch", "WebSocket connection failed", "can't
  reach dev server from another device", "vite proxy not working", "port 5050
  already in use", "how do I bind to 0.0.0.0", "WSL2 windows host can't reach
  vite", "VITE_API_URL keeps overriding".
allowed-tools: Read, Grep, Bash(lsof:*), Bash(ss:*), Bash(curl:*), Bash(cat:*)
---

# Development Environment Patterns

Institutional knowledge for local dev-server networking, learned from real
forge-ui debugging. All code here mirrors the live config in
`forge-ui/vite.config.ts` and `forge-ui/src/services/api-client.ts` (ports:
UI 5050 → proxies to API/WS 5051).

---

## Pattern: Multi-Device Development Access

**Severity**: Critical (blocks all functionality from non-localhost devices).

### Symptom

API/WS calls fail only when accessed from a phone, tablet, or another PC:
- `Cross-Origin Request Blocked: localhost:5051`
- `NetworkError when attempting to fetch resource`
- WebSocket connection failures

### Root cause

`localhost` on the remote device points at *that device*, not the dev server.
Any URL that names `localhost` (hardcoded or via `VITE_API_URL`) is unreachable
off-machine. The fix is relative URLs proxied by Vite, so the browser only ever
talks same-origin to whatever host it loaded the page from.

### Correct pattern (matches live source)

```ts
// src/services/api-client.ts — env var wins, else relative /api in dev
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL; // prod only
  if (import.meta.env.DEV) return "/api";                                // Vite proxies this
  const host = typeof window !== "undefined" ? window.location.hostname : "localhost";
  return `http://${host}:5051/api`;                                       // prod fallback
};
```

```ts
// vite.config.ts — bind all interfaces + proxy /api, /ws, /terminal to 5051
server: {
  host: "0.0.0.0",     // accept connections from any device
  port: 5050,
  strictPort: true,    // FAIL if taken — does NOT auto-increment
  proxy: {
    "/api":      { target: "http://localhost:5051", changeOrigin: true },
    "/ws":       { target: "ws://localhost:5051", ws: true, changeOrigin: true },
    "/terminal": { target: "ws://localhost:5051", ws: true },
  },
}
```

```bash
# .env — never hardcode localhost. Leave VITE_API_URL UNSET in dev.
# VITE_API_URL=http://localhost:5051/api   # WRONG — breaks every non-local device
```

### Why it works

Accessed via `http://192.168.1.206:5050`, a `/api/...` fetch resolves to
`http://192.168.1.206:5050/api/...` (relative to `window.location.host`). Vite's
dev server intercepts `/api`, `/ws`, `/terminal` and forwards to `localhost:5051`
server-side. The browser only sees same-origin requests, so there is no CORS.

### Worked example — "signup works on laptop, dead on phone"

1. `grep -rn "VITE_API_URL\|localhost:5051" .env* src/` → find `VITE_API_URL=http://localhost:5051/api` in `.env.local`.
2. That value wins over the `import.meta.env.DEV → "/api"` branch, so the bundle ships an absolute `localhost` URL. On the phone `localhost` = the phone → connection refused.
3. Comment it out, **restart Vite** (env is baked at startup, HMR won't pick it up), hard-refresh the phone (`Ctrl/Cmd+Shift+R`) to drop cached JS.
4. Confirm in the phone's console the request now hits `/api/...` (relative), not `localhost`.

### Anti-patterns

| Anti-pattern | Why it's wrong |
|--------------|----------------|
| `VITE_API_URL=http://localhost:5051` in dev | Overrides the relative-URL branch; only works on the dev machine |
| `fetch("http://localhost:5051/api")` | Hardcoded host; breaks every other device |
| `127.0.0.1` instead of `0.0.0.0` for server bind | Accepts local connections only |
| Skipping the Vite proxy | Forces manual CORS config on the API server |
| Omitting `changeOrigin: true` on the proxy | Target may reject the mismatched `Host` header |

### Debugging checklist

1. [ ] `grep -rn "VITE_" .env*` — any hardcoded `localhost`? Comment it out.
2. [ ] `vite.config.ts` has `host: "0.0.0.0"`.
3. [ ] Proxy blocks present for every path the app calls (`/api`, `/ws`, `/terminal`).
4. [ ] **Restart Vite** after any `.env` change (not just HMR).
5. [ ] Hard-refresh the remote browser to clear cached JS.
6. [ ] Read the actual failing URL in the remote device's console — is it relative or absolute?
7. [ ] `curl http://<dev-ip>:5050/api/health` from another box to isolate app vs network.

### Related files

- `forge-ui/.env*` — environment variables (build-time baked)
- `forge-ui/vite.config.ts` — bind + proxy config
- `forge-ui/src/services/api-client.ts` — `getApiBaseUrl()` URL construction

---

## Pattern: Server Binding for Network Access

Bind to `0.0.0.0` for any dev server that must be reachable off-machine:

```ts
server: { host: "0.0.0.0" }   // Vite
app.listen(port, "0.0.0.0")   // Express
server.listen(port, "0.0.0.0")// Node http
```

`0.0.0.0` exposes the server on all interfaces — appropriate for local
development on a trusted network and required for WSL2 → Windows-host access.
For production use a specific interface or a reverse proxy.

---

## Gotchas

Real, non-obvious failure modes for this stack:

- **Env var beats the dev branch, silently.** `getApiBaseUrl()` checks
  `VITE_API_URL` *before* `import.meta.env.DEV`. A stray value in `.env`,
  `.env.local`, `.env.development`, or the shell environment overrides the
  relative-URL logic — dev looks broken with no code change. `.env.local` is
  gitignored, so it survives `git status` clean and is the classic "works on my
  machine" culprit.
- **Vite bakes env vars at startup, not per-request.** Editing `.env` does
  nothing until you restart the Vite process; HMR will not pick it up. A stale
  `dist-ui/` production build carries the URL baked at *its* build time.
- **`strictPort: true` means no fallback port.** If 5050 is already in use Vite
  exits with an error instead of hopping to 5051/5052. Find the stale process
  (`lsof -i :5050` or `ss -ltnp | grep 5050`) and kill it — do not expect a new
  port.
- **WSL2 VM IP changes on reboot.** Under legacy NAT networking the WSL2 IP
  (e.g. `192.168.x.x` / `172.x.x.x`) is reassigned each boot, so a bookmarked
  `http://<old-ip>:5050` goes dead. Use WSL2 *mirrored* networking (Windows 11
  `.wslconfig` → `networkingMode=mirrored`) so `localhost` and the LAN IP work
  from the Windows host, or re-check the IP with `hostname -I` after each reboot.
- **Windows Firewall blocks the LAN even with `0.0.0.0`.** Binding all
  interfaces is necessary but not sufficient — a fresh Windows Firewall rule may
  still drop inbound 5050 from other LAN devices. If `0.0.0.0` is set and the
  Windows host still can't reach it, suspect the firewall before the app.
- **Three separate WS proxies, three separate failures.** `/ws` and `/terminal`
  are distinct proxy entries. A terminal/PTY feature can be dead while the main
  WebSocket works (or vice versa) if only one proxy block is present or `ws:
  true` is missing on it.
- **Prod fallback assumes API co-located on `:5051`.** The non-dev branch builds
  `http://${host}:5051/api`. Behind a reverse proxy that serves the API on the
  same origin/port, that hardcoded `:5051` is wrong — set `VITE_API_URL`
  explicitly for that deploy.

---

**Status**: Living document — update with new learnings.
