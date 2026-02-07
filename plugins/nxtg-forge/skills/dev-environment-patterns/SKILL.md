---
name: Dev Environment Patterns
description: Documents development environment setup, WSL2 patterns, and tooling configuration.
---

# Development Environment Patterns

## Purpose

Institutional knowledge for common development environment configurations and pitfalls learned from real-world debugging sessions.

---

## Pattern: Multi-Device Development Access

**Date Learned**: 2026-01-31
**Severity**: Critical (blocks all functionality from non-localhost devices)

### Problem

When accessing the development server from mobile devices, tablets, or other PCs on the network, API calls fail with:
- `Cross-Origin Request Blocked: localhost:5051`
- `NetworkError when attempting to fetch resource`
- WebSocket connection failures

### Root Cause Analysis

1. **Environment Variables Override Code Logic**: `.env` files with `VITE_API_URL=http://localhost:5051/api` are injected into the bundle at build time
2. **Priority Matters**: Code checks `import.meta.env.VITE_API_URL` first, uses it if set
3. **localhost Is Not Reachable**: From another device, `localhost` refers to *that* device, not the dev server

### Correct Pattern

```bash
# .env - DO NOT hardcode localhost
# VITE_API_URL=http://localhost:5051/api  # WRONG
# VITE_WS_URL=ws://localhost:5051/ws      # WRONG
```

```typescript
// api-client.ts - Use relative URLs in dev mode
const getApiBaseUrl = () => {
  // Env var takes priority - only set for production builds
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;

  // Development: use relative URLs (proxied by Vite)
  if (import.meta.env.DEV) return '/api';

  // Production fallback: dynamic host detection
  const host = window.location.hostname;
  return `http://${host}:5051/api`;
};
```

```typescript
// vite.config.ts - Proxy API and bind to all interfaces
export default defineConfig({
  server: {
    host: '0.0.0.0',  // Accept connections from any device
    port: 5050,
    proxy: {
      '/api': {
        target: 'http://localhost:5051',
        changeOrigin: true
      },
      '/ws': {
        target: 'ws://localhost:5051',
        ws: true
      }
    }
  }
});
```

### Why This Works

1. **Relative URLs** (`/api/...`) are relative to `window.location.host`
2. When accessed via `http://192.168.1.206:5050`, requests go to `http://192.168.1.206:5050/api/...`
3. **Vite's proxy** intercepts these and forwards to `localhost:5051`
4. No CORS issues because browser sees same-origin requests

### Anti-Patterns to Avoid

| Anti-Pattern | Why It's Wrong |
|--------------|----------------|
| `VITE_API_URL=http://localhost:5051` | Only works on the dev machine |
| `fetch('http://localhost:5051/api')` | Hardcoded, breaks multi-device |
| Using `127.0.0.1` instead of `0.0.0.0` for server binding | Only accepts local connections |
| Not using Vite proxy | Forces CORS configuration complexity |

### Debugging Checklist

When multi-device access fails:

1. [ ] Check `.env` for hardcoded localhost URLs - comment them out
2. [ ] Verify `vite.config.ts` has `host: '0.0.0.0'`
3. [ ] Verify proxy configuration in `vite.config.ts`
4. [ ] Restart Vite after env changes
5. [ ] Hard refresh browser (Ctrl+Shift+R) to clear cached JS
6. [ ] Check browser console for the actual URL being requested

### Related Files

- `.env` - Environment variables
- `vite.config.ts` - Vite configuration
- `src/services/api-client.ts` - API URL construction
- `src/App.tsx` - WebSocket URL construction

---

## Pattern: Server Binding for Network Access

### Problem

Development servers only accessible from `localhost`, not from other devices.

### Solution

Always bind to `0.0.0.0` for development servers that need network access:

```typescript
// Vite
server: { host: '0.0.0.0' }

// Express
app.listen(port, '0.0.0.0')

// Node http
server.listen(port, '0.0.0.0')
```

### Security Note

`0.0.0.0` binding exposes the server to all network interfaces. This is appropriate for:
- Local development on trusted networks
- WSL2 development (required for Windows host access)

For production, use specific interfaces or reverse proxies.

---

**Last Updated**: 2026-01-31
**Version**: 1.0.0
**Status**: Living Document - Update with new learnings
