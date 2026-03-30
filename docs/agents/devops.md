# DevOps

> Automates infrastructure as code -- Docker multi-stage builds, GitHub Actions pipelines, environment management, and monitoring setup that makes deployments reproducible and reversible.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Domain Specialist |
| **Model** | Sonnet |

---

## What It Does

The DevOps agent handles everything between "it works on my machine" and "it works in production." It creates Docker configurations with multi-stage builds for minimal images, GitHub Actions workflows for automated testing and deployment, environment variable management with template files and secret handling, and monitoring setups with health endpoints and structured logging.

What makes this agent valuable is the operational knowledge it encodes. It knows that Docker images should use multi-stage builds (build stage with dev dependencies, runtime stage with only production artifacts). It knows GitHub Actions should cache npm dependencies and run lint, typecheck, and tests as separate steps for clear failure signals. It knows environment variables belong in `.env.example` (committed template) and `.env` (gitignored actual values), never hardcoded in source. These are the practices that experienced DevOps engineers enforce through PRs -- the DevOps agent makes them automatic.

The agent understands the NXTG-Forge infrastructure specifically: WSL2 development environment, Vite dev server on port 5050, Express API on port 5051, npm as the package manager, and GitHub Actions for CI/CD. It creates configurations that work in this specific environment, not generic templates that need extensive modification.

## When to Use It

- **Setting up CI/CD**: When you need GitHub Actions workflows for automated testing, linting, type checking, and deployment on push or PR.
- **Containerizing the application**: When you need a Docker setup with multi-stage builds, proper base images, security considerations, and docker-compose for development.
- **Managing environments**: When you need to organize environment variables, create template files, separate development from production config, and handle secrets safely.
- **Setting up monitoring**: When you need health endpoints, structured logging, error tracking integration (Sentry), and uptime monitoring.

Do not use the DevOps agent for application code (use Builder), API design (use API), or security auditing (use Security). The DevOps agent operates at the infrastructure and deployment layer.

## How It Works

The DevOps agent operates across four infrastructure domains:

1. **CI/CD Pipelines** -- Creates GitHub Actions workflows with proper job structure: checkout, setup Node with caching, install dependencies (`npm ci` not `npm install`), run lint, typecheck, and tests as separate steps. Configures triggers (push to main, pull requests) and environments (staging, production).

2. **Containerization** -- Builds multi-stage Dockerfiles: builder stage installs all dependencies and compiles, runtime stage copies only production artifacts and minimal dependencies. Uses Alpine base images for small footprint. Configures docker-compose for development with volume mounts and hot reload.

3. **Environment Management** -- Creates `.env.example` with all required variables (empty values for secrets, defaults for non-sensitive config). Ensures `.env` is in `.gitignore`. Documents which variables are required vs. optional and what valid values look like.

4. **Monitoring and Observability** -- Implements `/api/health` endpoint returning service status, dependency availability, and uptime. Configures structured JSON logging (not console.log). Sets up error tracking integration. Defines alert thresholds for CPU, memory, disk, and error rate.

The agent targets CI runs under 5 minutes, immutable deployments (build once, deploy anywhere), and rollback-ready releases (every deploy can be reverted).

## Examples

### Example 1: Complete GitHub Actions Setup

```
User: "Set up CI for the project"

DevOps:
  - Creates: .github/workflows/ci.yml
    - Trigger: push to main, pull requests to main
    - Job: test (ubuntu-latest, Node 20)
    - Steps: checkout, setup-node with npm cache, npm ci, npm run lint,
             npx tsc --noEmit, npm test -- --coverage
    - Artifacts: coverage report uploaded
  - Creates: .github/workflows/release.yml
    - Trigger: tag push (v*)
    - Steps: build, create GitHub release, attach artifacts
  - Result: Full CI pipeline running lint, types, and tests in under 3 minutes
```

### Example 2: Production Docker Configuration

```
User: "Containerize the app for production deployment"

DevOps:
  - Creates Dockerfile:
    - Stage 1 (builder): node:20-alpine, npm ci, npm run build
    - Stage 2 (runtime): node:20-alpine, copy dist + node_modules + package.json
    - EXPOSE 5051, CMD ["node", "dist/index.js"]
  - Creates .dockerignore: node_modules, .git, .env, dist-ui, coverage
  - Creates docker-compose.yml: app service + volume mount for dev
  - Creates docker-compose.prod.yml: production overrides (no volumes, resource limits)
  - Result: 45MB production image (vs. 1.2GB without multi-stage)
```

### Example 3: Environment and Monitoring Setup

```
User: "Set up proper environment management and monitoring"

DevOps:
  - Creates .env.example:
    NODE_ENV=development
    PORT=5051
    VITE_API_URL=        (leave empty for relative URLs)
    SENTRY_DSN=          (optional: error tracking)
  - Verifies: .env in .gitignore
  - Implements: /api/health endpoint
    { status: 'ok', uptime: 12345, version: '3.1.0',
      services: { api: 'healthy', websocket: 'healthy' } }
  - Adds: Structured JSON logger (replaces console.log)
  - Result: Production-ready environment config with health monitoring
```

## Power Use Cases

**Planner Infrastructure Routing**: When the Planner detects a feature involves deployment or CI changes, it routes to the DevOps agent. Docker configurations, workflow files, and environment templates are created alongside the feature implementation.

**Security + DevOps Pipeline**: Combine Security scanning with DevOps CI configuration. Security identifies what needs to be checked; DevOps adds those checks to the GitHub Actions pipeline so they run automatically on every push.

**Multi-Environment Promotion**: For projects with staging and production environments, the DevOps agent creates promotion workflows: merge to main deploys to staging, tag creation deploys to production. Each stage runs the full test suite before proceeding.

## Combines With

| Feature | Synergy |
|---------|---------|
| **Planner** | Planner routes infrastructure features to DevOps. CI/CD setup happens alongside feature development. |
| **Security** | Security defines what to scan; DevOps adds scans to the CI pipeline for automated enforcement. |
| **Guardian** | Guardian's quality gates can be mirrored in CI -- the same checks run locally and in the pipeline. |
| **/forge:deploy** | The `/forge:deploy` command triggers the deployment workflow. DevOps creates and maintains those workflows. |

## Level Progression

| Level | What You Get |
|-------|-------------|
| **L1 Vibe Coder** | GitHub Actions workflow creation. Docker multi-stage builds. Environment variable management. Health endpoint implementation. Structured logging setup. |
| **L2 Pro Builder** | CI/CD status tracked as part of `forge_get_health` scores. Infrastructure decisions recorded via `forge_capture_knowledge`. |
| **L3 Ship Lord** | CI/CD status, deployment history, and health endpoint data visible in the forge-ui dashboard. Build status indicators on the task board. |

## Tips & Gotchas

- **Do**: Use `npm ci` in CI pipelines, not `npm install`. `ci` installs from lockfile exactly, which is faster and deterministic.
- **Don't**: Store secrets in CI workflow files. Use GitHub Actions secrets and reference them with `${{ secrets.NAME }}`.
- **Do**: Use multi-stage Docker builds. The build stage can be 1GB+; the runtime stage should be under 100MB.
- **Don't**: Skip the `.dockerignore` file. Without it, your Docker context includes node_modules, .git, and other large directories that slow builds and bloat images.
- **Do**: Target CI runs under 5 minutes. Developers skip slow CI. Cache dependencies, parallelize jobs, and trim unnecessary steps.

---

*See also: [Security](security.md) | [Guardian](guardian.md) | [/forge:deploy](../commands/deploy.md)*
