# /nxtg-forge:integrate

> Set up third-party service integrations with scaffolded client code, environment variable guides, and connectivity testing.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Feature Development |
| **Syntax** | `/nxtg-forge:integrate [service-name] [--list] [--test] [--scaffold]` |

---

## What It Does

`/nxtg-forge:integrate` is the integration assistant for connecting your project to external services. It covers version control (GitHub, GitLab), monitoring (Sentry, Datadog), communication (Slack, Discord), databases (PostgreSQL, Redis, MongoDB), and cloud platforms (AWS, GCP, Vercel, Netlify). For each service, it checks your current setup, identifies what is already configured, and provides the exact npm packages, environment variables, configuration code, and testing instructions needed.

The command does not blindly generate boilerplate. It first reads your `package.json` for existing SDK packages, checks `.env` and `.env.example` for existing configuration, and scans `src/` for existing integration code. This means it only suggests what is actually missing and avoids duplicating what you already have.

Without this command, integrating a service means reading its documentation, figuring out which SDK to install, creating a client wrapper, setting up environment variables, and writing a connectivity test -- all separately. `/nxtg-forge:integrate` packages all of that into a single guided flow.

## Syntax & Options

```
/nxtg-forge:integrate [service-name] [--list] [--test] [--scaffold]
```

| Option | Description |
|--------|------------|
| `service-name` | The service to integrate (e.g., `github`, `sentry`, `postgres`, `vercel`) |
| `--list` | Show all available integration templates organized by category |
| `--test` | Test connectivity for existing integrations |
| `--scaffold` | Generate integration boilerplate code (client file, types, environment variables) |

## When to Use It

- **Adding a new service**: Need Sentry for error tracking? Run `/nxtg-forge:integrate sentry` to get the complete setup guide.
- **Verifying connections**: Run `/nxtg-forge:integrate --test` after configuring environment variables to verify everything connects.
- **Discovering options**: Run `/nxtg-forge:integrate --list` to see all supported services organized by category.

For deploying to a specific platform, use `/nxtg-forge:deploy` which handles the full deployment pipeline including pre-flight validation.

## Examples

### Example 1: Setting Up Sentry

```
/nxtg-forge:integrate sentry
```

```
INTEGRATION: sentry
========================

Required:
  npm install @sentry/node

Environment variables (.env):
  SENTRY_DSN=your-dsn-here

Configuration:
  import * as Sentry from '@sentry/node';
  Sentry.init({ dsn: process.env.SENTRY_DSN });

Test:
  Sentry.captureMessage('Test from NXTG-Forge');

Documentation:
  https://docs.sentry.io/platforms/node/
```

### Example 2: Listing Available Integrations

```
/nxtg-forge:integrate --list
```

Shows services grouped by category: Version Control, Monitoring, Communication, Databases, and Cloud.

## Power Use Cases

Use `--scaffold` to generate a typed client wrapper at `src/integrations/{service}-client.ts` with proper TypeScript interfaces. This gives you a clean abstraction layer instead of raw SDK calls scattered throughout your codebase.

Chain `/nxtg-forge:integrate postgres --scaffold` followed by `/nxtg-forge:test` to generate the integration code and immediately verify it compiles and any existing tests still pass.

## Combines With

| Feature | Synergy |
|---------|---------|
| **/nxtg-forge:feature** | Plan a feature that depends on an integration, then set up the integration first |
| **/nxtg-forge:deploy** | After integrating a cloud platform, use deploy for the full deployment pipeline |
| **/nxtg-forge:compliance** | Check that new dependencies introduced by integrations have compatible licenses |
| **integration agent** | For complex multi-service integrations, assign the integration agent directly |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | Full integration setup with package installation, config guides, and scaffold generation |
| **L2 Pro Builder** | Integration decisions recorded via `forge_capture_knowledge` for project memory |
| **L3 Ship Lord** | Integration status visible in the forge-ui dashboard service health panel |

## Tips & Gotchas

- The command checks existing setup before suggesting changes. If you already have `@sentry/node` in `package.json`, it skips the install step.
- Scaffold files are created at `src/integrations/{service}-client.ts`. Create the directory structure before running if it does not exist.
- The `--test` flag runs lightweight connectivity checks (e.g., `gh auth status` for GitHub, `npm ping` for npm). It does not send data to production services.
- Services not in the built-in list are handled gracefully -- the command suggests similar services and offers general integration guidance.

---

*See also: [deploy](../commands/deploy.md) | [compliance](../commands/compliance.md) | [feature](../commands/feature.md)*
