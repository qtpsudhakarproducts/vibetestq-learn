# 19 — Docker

## The Scenario

Your tests pass on your MacBook. They fail on your colleague's Windows machine. They fail differently on the Linux CI server. The browser version is different. The fonts are different. The timezone is different.

You spend more time debugging environment differences than debugging actual test failures.

Docker solves this by packaging the entire environment — Node.js, browsers, OS libraries, fonts, timezone — into a container image. Everyone runs the same container. The CI server runs the same container. The tests either pass everywhere or fail everywhere for the same reason.

---

## What Docker Does for Playwright

Playwright tests require:

- A specific Node.js version
- Specific browser binaries (Chromium, Firefox, WebKit)
- OS-level libraries that browsers depend on (libglib, libnss, libatk, fonts, and dozens more)
- A display server on Linux (or Playwright's built-in headless mode)

On macOS and Windows these are managed by the OS. On Linux CI servers they must be explicitly installed. The list of required libraries is long and version-sensitive. The official Playwright Docker image handles all of this — you get a pre-configured environment with everything installed.

---

## The Official Playwright Docker Image

Microsoft maintains official Docker images for Playwright:

```
mcr.microsoft.com/playwright:v1.52.0-jammy
```

- `v1.52.0` — the Playwright version (pin this to your project's version)
- `jammy` — Ubuntu 22.04 LTS base image

The image includes:
- Ubuntu 22.04
- Node.js 20
- Chromium, Firefox, and WebKit binaries
- All required OS libraries
- All required fonts

```bash
# Check which Playwright version your project uses
cat package.json | grep playwright
```

Always pin the image to the same version as your `package.json`. Mismatched versions cause subtle failures.

---

## Running Tests in Docker Locally

### Basic run — mount your project into the container

```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  npx playwright test
```

`--rm` — removes the container after it finishes. No cleanup needed.

`-v $(pwd):/app` — mounts your current directory into the container at `/app`. The container sees your test files, config, and `node_modules`.

`-w /app` — sets the working directory inside the container.

### With environment variables

```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  -e CI=true \
  -e BASE_URL=https://demo.orangehrmlive.com \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  npx playwright test
```

### Install dependencies first

If you have not run `npm ci` locally, or want a clean install inside the container:

```bash
docker run --rm \
  -v $(pwd):/app \
  -w /app \
  mcr.microsoft.com/playwright:v1.52.0-jammy \
  bash -c "npm ci && npx playwright test"
```

---

## Writing a Dockerfile for Your Project

For reproducible builds — and for teams where everyone should use the same environment — write a `Dockerfile`:

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.52.0-jammy

# Set working directory
WORKDIR /app

# Copy dependency files first (better layer caching)
COPY package*.json ./

# Install Node dependencies
RUN npm ci

# Copy the rest of the project
COPY . .

# Default command — run all tests
CMD ["npx", "playwright", "test"]
```

Build and run:

```bash
# Build the image
docker build -t orangehrm-playwright .

# Run all tests
docker run --rm orangehrm-playwright

# Run a specific file
docker run --rm orangehrm-playwright npx playwright test tests/auth/login.spec.ts

# Run with env vars
docker run --rm \
  -e BASE_URL=https://staging.orangehrmlive.com \
  orangehrm-playwright

# Run with a mounted report output directory
docker run --rm \
  -v $(pwd)/playwright-report:/app/playwright-report \
  orangehrm-playwright
```

**Layer caching** — copying `package*.json` and running `npm ci` before copying the rest of the project means Docker reuses the cached `npm ci` layer on subsequent builds as long as `package.json` and `package-lock.json` have not changed. A change to a test file does not trigger `npm ci` again.

---

## Docker Compose — Multi-Service Testing

When your tests run against a local application (not a remote URL), Docker Compose lets you start the application and run the tests together:

```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    image: orangehrm/orangehrm:latest
    ports:
      - "80:80"
    environment:
      - DB_HOST=db
    depends_on:
      - db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/web/index.php/auth/login"]
      interval: 10s
      timeout: 5s
      retries: 10

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: orangehrm

  playwright:
    build: .
    depends_on:
      app:
        condition: service_healthy   # wait until app passes healthcheck
    environment:
      - BASE_URL=http://app
      - CI=true
    volumes:
      - ./playwright-report:/app/playwright-report
```

```bash
# Start everything and run tests
docker compose up --abort-on-container-exit --exit-code-from playwright

# Clean up
docker compose down
```

`--abort-on-container-exit` — stops all containers when any one exits. When the playwright container finishes, the app and db containers stop too.

`--exit-code-from playwright` — the `docker compose up` command exits with the same code as the playwright container. A non-zero exit code (test failures) propagates to CI correctly.

---

## Using Docker in GitHub Actions

With the official Playwright image, you skip browser installation entirely:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    container:
      image: mcr.microsoft.com/playwright:v1.52.0-jammy

    steps:
      - uses: actions/checkout@v4

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npx playwright test
        env:
          CI: true
          HOME: /root    # required when running as root in the container

      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

**`HOME: /root`** — when GitHub Actions runs a container as root, the `HOME` variable may not be set correctly. Setting it explicitly prevents browser launch errors related to missing profile directories.

Using the container approach means no `npx playwright install --with-deps` step — browsers are already in the image. The tradeoff is that pulling the image takes time, but this is usually comparable to the installation step and the result is more consistent.

---

## Docker vs Local — When to Use Each

| Situation | Recommendation |
|-----------|---------------|
| Active development, writing tests | Run locally — faster feedback, easier debugging |
| Verifying tests before pushing | Run locally or in Docker — your choice |
| CI pipeline | Always use Docker or install browsers explicitly |
| Debugging CI failures locally | Run in Docker — reproduces the CI environment exactly |
| Onboarding new team members | Docker removes environment setup entirely |
| Testing against a local app | Docker Compose — run app and tests together |

---

## Common Docker Issues

**"browserType.launch: Executable doesn't exist"**
The browser binaries are not in the expected location. This happens when you use a plain Node image instead of the Playwright image. Use `mcr.microsoft.com/playwright` or run `npx playwright install --with-deps`.

**Tests pass locally, fail in Docker**
Check: timezone (`-e TZ=Asia/Kolkata`), locale, font availability, and whether your app is reachable from inside the container (use the service name in Docker Compose, not `localhost`).

**`localhost` not reachable from container**
Inside a Docker container, `localhost` refers to the container itself — not the host machine. Use `host.docker.internal` to reach the host, or use Docker Compose service names.

**Report not available after run**
Mount the report directory: `-v $(pwd)/playwright-report:/app/playwright-report`. Without a volume mount, files written inside the container disappear when the container stops.

---

## Key Points

- Docker packages the entire environment — Node, browsers, OS libraries, fonts — into one image
- The official Playwright image `mcr.microsoft.com/playwright:v1.52.0-jammy` has everything pre-installed
- Pin the image version to match your project's `package.json` Playwright version exactly
- `docker run --rm -v $(pwd):/app -w /app mcr.microsoft.com/playwright:v1.52.0-jammy npx playwright test` — run tests locally in Docker
- `Dockerfile` — copy `package*.json` and run `npm ci` before copying the project for better layer caching
- Docker Compose — coordinate app + database + playwright containers; use `service_healthy` conditions to wait for the app to be ready
- `--abort-on-container-exit --exit-code-from playwright` — stops all services when tests finish and propagates the exit code
- GitHub Actions `container:` key — runs the job inside the Playwright image; no browser installation step needed
- `HOME: /root` in GitHub Actions container jobs — prevents browser launch errors
- `localhost` inside a container refers to the container, not the host — use `host.docker.internal` or Docker Compose service names
- Mount the report directory as a volume — otherwise files written inside the container are lost when it stops
