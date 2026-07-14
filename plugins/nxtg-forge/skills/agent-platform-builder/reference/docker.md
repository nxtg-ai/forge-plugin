# Docker & Compose Reference

## Multi-stage Dockerfile (Python FastAPI)

```dockerfile
# Stage 1: Build
FROM python:3.11-slim AS builder
WORKDIR /app
RUN apt-get update && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*
COPY requirements.txt .
# Install into a non-root-owned prefix so the runtime USER can read it (see Gotcha #1)
RUN pip install --prefix=/install --no-cache-dir -r requirements.txt

# Stage 2: Runtime
FROM python:3.11-slim
WORKDIR /app
# curl is NOT in slim images — install it if HEALTHCHECK uses it (Gotcha #2)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=builder /install /usr/local
COPY . .
RUN useradd -m -u 1000 appuser && chown -R appuser:appuser /app
USER appuser
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Why `--prefix=/install` not `--user`:** `pip install --user` writes to `/root/.local`.
If the runtime stage switches to a non-root `USER appuser`, that user cannot read
`/root/.local` — the app fails at import time. Install to a shared prefix (`/usr/local`)
that every user can read.

## docker-compose (development)

```yaml
# NOTE: the top-level `version:` key is obsolete in Compose v2+ and is ignored.
# Omit it. A leftover `version: '3.8'` only emits a deprecation warning.
services:
  api:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "8000:8000"
    volumes:
      - .:/app
      - /app/__pycache__          # anonymous volume masks host __pycache__
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/devdb
      - REDIS_URL=redis://redis:6379
      - DEBUG=true
    depends_on:
      db: { condition: service_healthy }   # waits for healthcheck, not just start
      redis: { condition: service_started }
    command: uvicorn main:app --reload --host 0.0.0.0

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: pass
      POSTGRES_DB: devdb
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U user"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]
    volumes: [redis_data:/data]

volumes:
  postgres_data:
  redis_data:
```

**`depends_on` with `condition: service_healthy`** waits for the target's own
`healthcheck` to pass before starting the dependent. A bare `depends_on: [db]`
only waits for the container to *start*, not for Postgres to accept connections —
the classic "connection refused on first boot" race.

## Secrets in Compose — real syntax

Compose does NOT understand GitHub Actions `${{ secrets.X }}` syntax. Inside a
compose file, `${VAR}` interpolates from the shell env / `.env` file, or use the
native `secrets:` block:

```yaml
# ✅ interpolated from host env / .env
environment:
  - DATABASE_URL=${DATABASE_URL}

# ❌ WRONG — ${{ ... }} is GitHub Actions templating, invalid in compose
environment:
  - DATABASE_URL=${{ secrets.DATABASE_URL }}
```
