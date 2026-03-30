# Platform Builder Agent

> Encodes platform engineering expertise -- containerization, CI/CD pipelines, cloud infrastructure, monitoring, and the discipline of automated, resilient deployments.

| | |
|---|---|
| **Level** | L1 Vibe Coder |
| **Category** | Agent Roles |

---

## What It Provides

The Platform Builder skill equips agents with infrastructure and DevOps knowledge spanning containerization (Docker, Kubernetes), CI/CD platforms (GitHub Actions, GitLab CI, Jenkins, CircleCI), cloud providers (AWS, GCP, Azure), infrastructure as code (Terraform, Ansible, CloudFormation), and observability (Prometheus, Grafana, ELK, Jaeger, Sentry).

Without this skill, agents produce Dockerfiles without multi-stage builds, CI pipelines without caching or proper secrets management, and deployment configurations without health checks, resource limits, or rollback procedures. With it, agents follow a systematic approach: review requirements, design the infrastructure, implement with security and reliability built in, and document the deployment process.

The skill covers the full deployment lifecycle from local Docker Compose development environments to production Kubernetes clusters with horizontal pod autoscaling, along with the decision framework for choosing between VPS, container platforms, Kubernetes, and serverless architectures.

## When It Activates

- When setting up Docker, Docker Compose, or Kubernetes configurations
- When designing or implementing CI/CD pipelines
- When configuring cloud infrastructure, monitoring, or alerting
- When choosing deployment strategies or infrastructure architecture

## The Knowledge Inside

### Docker Best Practices

Multi-stage builds are mandatory -- the builder stage installs dependencies, the runtime stage copies only what is needed, producing minimal final images. Every Dockerfile must include health checks, non-root user creation, proper layer ordering for cache efficiency, and a `.dockerignore` file. Agents learn the contrast: a multi-stage Python image at ~150MB vs. a single-stage image at ~1GB.

### CI/CD Pipeline Design

The skill teaches a four-stage pipeline: lint (ruff, black, mypy), test (pytest with coverage, service containers for databases), build-and-push (Docker image with GitHub Container Registry), and deploy (environment-gated production deployment). Each stage includes caching configuration, proper secrets handling, and failure notifications. Matrix builds for multi-version testing are covered.

### Deployment Strategy Selection

A decision framework maps project characteristics to deployment approaches. VPS for small projects that are cost-sensitive. Container platforms (ECS, Cloud Run) for moderate scale with managed infrastructure. Kubernetes for large-scale, complex deployments needing full control. Serverless for event-driven workloads with variable traffic. Agents learn that Kubernetes is not the default answer -- it is the right answer only when the scale and complexity justify it.

### Security and Reliability

Three hard rules: secrets never appear in code or configuration files (use secrets management), health checks are always configured (liveness and readiness probes in Kubernetes), and automated backups are non-negotiable. The skill provides Kubernetes manifests with resource requests/limits, liveness/readiness probes, and horizontal pod autoscaler configuration as the baseline, not the aspirational target.

## How to Leverage It

Describe your deployment requirements and the agent will design the complete infrastructure -- Docker configuration, CI/CD pipeline, and deployment manifests.

### Example: Production Kubernetes Setup
```
User: "Set up production deployment for our API"
What happens: The agent creates a multi-stage Dockerfile, Docker Compose
for local development, a GitHub Actions pipeline with lint/test/build/deploy
stages, and Kubernetes manifests with Deployment (3 replicas, resource limits,
probes), Service, and HPA (auto-scaling at 70% CPU).
```

## Power Applications

- Combine local Docker Compose with production Kubernetes manifests sharing the same Dockerfile
- Use infrastructure as code (Terraform) to make cloud configuration reproducible and reviewable
- Implement zero-downtime deployments with rolling updates and automatic rollback on health check failure

## Related Skills

| Skill | Relationship |
|-------|-------------|
| **agent-lead-architect** | Provides infrastructure requirements and scaling specifications |
| **agent-backend-master** | Receives deployment URLs and environment configuration |
| **agent-qa-sentinel** | Uses staging environments for integration and E2E testing |
| **optimization** | Applies performance insights to infrastructure sizing decisions |

## Tips

- Container build time under 5 minutes and deployment time under 10 minutes are the performance targets
- Zero-downtime deployments are not optional for production -- rolling updates with readiness probes achieve this
- Never commit secrets to version control, even in encrypted form; use your CI/CD platform's secrets management

---

*See also: [agent-lead-architect](agent-lead-architect.md), [agent-qa-sentinel](agent-qa-sentinel.md)*
