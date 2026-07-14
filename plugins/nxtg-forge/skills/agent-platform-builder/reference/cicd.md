# CI/CD Reference (GitHub Actions)

Full build → test → push → deploy pipeline. Pin action major versions; regenerate
when Actions releases a new major.

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install ruff black mypy
      - run: |
          ruff check .
          black --check .
          mypy .

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      - run: pip install -r requirements.txt
      - name: Run tests
        env:
          DATABASE_URL: postgresql://postgres:testpass@localhost:5432/testdb
        run: pytest --cov --cov-report=xml
      - uses: codecov/codecov-action@v4
        with:
          token: ${{ secrets.CODECOV_TOKEN }}

  build-and-push:
    needs: [lint, test]
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write          # required for GHCR push — omitting it 403s
    steps:
      - uses: actions/checkout@v4
      - uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}
      - id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
      - uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy:
    needs: build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    environment: production      # gate with required reviewers in repo settings
    steps:
      - name: Deploy to production
        run: |
          # kubectl set image / helm upgrade / etc.
          echo "Deploying..."
```

## Non-obvious traps

- **`packages: write` permission is mandatory** to push to GHCR with the default
  `GITHUB_TOKEN`. Without it the push fails with a 403, not a clear error.
- **`cache-from/to: type=gha`** requires the docker/build-push-action buildx
  driver (it sets one up automatically) and only works inside GitHub-hosted
  runners with the GHA cache backend. Self-hosted runners need a different cache
  backend (`type=registry` or `type=local`).
- **`environment: production`** does nothing to protect the deploy unless you
  configure required reviewers / wait timers on that environment in repo settings.
  The keyword alone is not a gate.
- **`if: github.event_name == 'push'`** on build-and-push means PRs lint+test but
  never build — intentional, but easy to misread as "PRs are fully validated."
