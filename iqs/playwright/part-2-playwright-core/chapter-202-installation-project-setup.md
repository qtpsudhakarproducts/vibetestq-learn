# Chapter 202 — Installation & Directory Structure


This chapter covers setting up a Playwright project from scratch. Interviewers
test this because setup mistakes cause real problems in teams — wrong Node.js
versions, missing browser installs, missing `package-lock.json` in CI. Questions
build from install commands through folder structure to a real setup story.

---

## Q202.1 — How do you install Playwright in a new project?

There are two ways: the interactive init command and manual installation.

**The init command (recommended for new projects):**

```bash
npm init playwright@latest
```

This starts an interactive prompt. It asks:
- JavaScript or TypeScript
- Where to put tests
- Whether to add a GitHub Actions workflow
- Whether to download browsers

After completing, the project is ready to run.

**Manual installation (for adding to an existing project):**

```bash
npm install --save-dev @playwright/test
npx playwright install
```

`npm install --save-dev @playwright/test` installs the package.
`npx playwright install` downloads the browser binaries (Chromium, Firefox,
WebKit). Without this second step, tests will fail with a browser-not-found
error.

---

## Q202.2 — What does npm init playwright@latest create?

The init command creates a minimal but complete project structure:

```
playwright.config.ts     — test runner configuration
tests/
  example.spec.ts        — sample test to verify the setup works
tests-examples/
  demo-todo-app.spec.ts  — example tests against a real demo app
package.json             — project manifest with @playwright/test as a devDependency
.gitignore               — ignores node_modules, playwright-report, test-results
```

If you chose GitHub Actions, it also creates:
```
.github/workflows/playwright.yml  — a complete GitHub Actions CI workflow
```

The sample tests run against `https://playwright.dev` and
`https://demo.playwright.dev/todomvc` — both public URLs so they work
immediately after install.

---

## Q202.3 — When do you need to run playwright install?

You need `npx playwright install` in three situations:

**After first installing @playwright/test.** The npm package does not
include browser binaries — they are downloaded separately by this command.

**After upgrading Playwright.** New Playwright versions require new browser
builds. Run `npx playwright install` after every version update.

**On a fresh CI machine.** CI runners do not have Playwright's browsers
pre-installed. Your CI workflow must call `npx playwright install --with-deps`
before running tests. The `--with-deps` flag also installs system-level
dependencies (fonts, libraries) that the browsers need on Linux.

```yaml
# GitHub Actions — correct browser install step
- name: Install Playwright browsers
  run: npx playwright install --with-deps
```

Without `--with-deps` on Ubuntu/Debian CI runners, browser launches often fail
with missing shared library errors.

---

## Q202.4 — How did you set up Playwright in your current project?

In our project, Playwright was set up with `npm init playwright@latest` choosing
TypeScript, and then immediately customised:

**`playwright.config.ts`** was updated with our baseURL, per-environment
configuration read from environment variables, and `retries: process.env.CI ? 2 : 0`.

**Folder structure** was adjusted from the default: tests under `tests/e2e/`,
page objects under `tests/pages/`, helpers under `tests/helpers/`, data factories
under `tests/data/`.

**CI workflow** was extended with browser caching to avoid downloading browsers
on every run:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
```

**ESLint** was configured with `@typescript-eslint/no-floating-promises` and
the custom `no-restricted-syntax` rule for `forEach(async`. These run in CI
before tests.

---

## Q202.5 — What is the folder structure of a standard Playwright project?

A well-organised Playwright project structure:

```
playwright.config.ts          — runner configuration
package.json
package-lock.json
tsconfig.json

tests/
  e2e/                        — test files (*.spec.ts)
    auth.spec.ts
    checkout.spec.ts
  pages/                      — page object classes
    BasePage.ts
    LoginPage.ts
    CheckoutPage.ts
    index.ts                  — barrel re-export
  helpers/                    — shared utility functions
    api.ts
    text.ts
    retry.ts
  fixtures/                   — custom fixture definitions
    index.ts
  data/                       — test data factories
    users.ts
    orders.ts
  config/                     — environment config reader
    env.ts

test-results/                 — playwright output (gitignored)
playwright-report/            — HTML report (gitignored)
```

The key principle: tests only import from `pages/`, `helpers/`, `fixtures/`,
and `data/`. No test file directly instantiates page objects — fixtures do that.

---

## Q202.6 — What is playwright.config.ts used for?

`playwright.config.ts` is the central configuration file for the entire test
suite. It controls:

- **`baseURL`** — the base URL all relative `page.goto()` calls resolve against
- **`testDir`** — where to find test files
- **`timeout`** — maximum time per test
- **`retries`** — how many times to retry a failing test
- **`workers`** — how many parallel worker processes to use
- **`use`** — global browser/context settings (viewport, screenshot, video, trace)
- **`projects`** — run the same tests in multiple browser/device configurations
- **`reporter`** — which reporters to use and where to save output

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['html'], ['list']],
  use: {
    baseURL: process.env.BASE_URL ?? 'https://staging.example.com',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
  ],
});
```

---

## Q202.7 — What is the purpose of package.json in a Playwright project?

`package.json` serves three purposes in a Playwright project:

**Dependency management** — declares `@playwright/test` as a devDependency so
any developer (or CI machine) can install the exact same version with `npm install`.

**Script shortcuts** — defines convenient aliases for common commands:

```json
{
  "scripts": {
    "test":        "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui":     "playwright test --ui",
    "test:debug":  "playwright test --debug",
    "report":      "playwright show-report"
  }
}
```

**Project metadata** — name, version, and `engines` to specify the minimum
Node.js version required.

---

## Q202.8 — What does the node_modules folder contain and should you commit it?

`node_modules` contains all installed npm packages — the compiled code of
`@playwright/test` and every other dependency. It is rebuilt from `package.json`
and `package-lock.json` by `npm install`.

**Never commit `node_modules` to version control.** It is large (hundreds of MB),
platform-specific in some packages, and completely reproducible from
`package-lock.json`. The `.gitignore` created by `npm init playwright@latest`
includes `node_modules` by default.

Similarly, the `playwright-report/` directory and `test-results/` directory
(where screenshots, videos, and traces are saved) should also be gitignored —
they are generated output, not source code.

---

## Q202.9 — What is the difference between npm install and npm ci?

**`npm install`** — reads `package.json`, resolves versions, installs packages,
and updates `package-lock.json` if any version resolutions changed.

**`npm ci`** — reads `package-lock.json` exactly and installs the exact versions
locked there. It fails if `package.json` and `package-lock.json` are out of sync.
It also deletes `node_modules` and reinstalls from scratch.

**Use `npm ci` in CI pipelines.** It is deterministic — guaranteed to install
the exact same versions that passed locally. `npm install` might silently upgrade
a transitive dependency and introduce a subtle difference.

```yaml
# GitHub Actions — use npm ci, not npm install
- run: npm ci
```

---

## Q202.10 — When should you use --save-dev vs --save when installing packages?

**`--save-dev` (`-D`)** — adds the package to `devDependencies`. Use this for
tools that are only needed during development and testing — `@playwright/test`,
`typescript`, `eslint`.

**`--save` (or no flag)** — adds the package to `dependencies`. Use this for
packages that the application needs at runtime — web frameworks, database
clients, utility libraries used by the application code.

In a test automation project, almost everything is a devDependency:
```bash
npm install --save-dev @playwright/test typescript @types/node eslint
```

The distinction matters because `npm install --production` (used to install
only what a production server needs) skips devDependencies. A test automation
project is entirely devDependencies because the tests never run in production.

---

## Q202.11 — What is wrong with not committing package-lock.json?

`package-lock.json` locks every dependency to an exact version — including
transitive dependencies (dependencies of dependencies).

Without it:
- `npm install` on two machines may produce different `node_modules` trees
- A transitive dependency could be silently upgraded between developer installs
- A Playwright upgrade in a transitive dependency could change browser behaviour

**Always commit `package-lock.json`.** It is the contract that guarantees
every developer and every CI run uses the same package versions.

If you are using `yarn`, commit `yarn.lock`. If using `pnpm`, commit `pnpm-lock.yaml`.

---

## Q202.12 — How do you upgrade Playwright to a newer version safely?

```bash
# 1. Update the package version
npm install --save-dev @playwright/test@latest

# 2. Download the new browser binaries
npx playwright install

# 3. Run the full test suite
npx playwright test

# 4. Review failures — especially visual snapshots
# Regenerate baselines if visual diffs are expected after the upgrade
npx playwright test --update-snapshots

# 5. Commit
git add package.json package-lock.json tests/  # include updated snapshots
git commit -m "chore: upgrade Playwright to 1.x.y"
```

Read the Playwright changelog before upgrading. Breaking changes are documented
there. Most version bumps are safe, but new browser builds occasionally change
visual rendering slightly — update snapshots when that happens.

---

## Q202.13 — Write the commands to set up a new Playwright project from scratch

```bash
# 1. Create and enter a new project directory
mkdir my-playwright-project && cd my-playwright-project

# 2. Initialise a new Node.js project
npm init -y

# 3. Install Playwright and initialise the project structure
npm init playwright@latest
# Choose: TypeScript, tests/ folder, GitHub Actions: Yes, Download browsers: Yes

# 4. Verify the installation — run the sample tests
npx playwright test

# 5. Open the HTML report to confirm tests passed
npx playwright show-report

# 6. View the project in VS Code
code .
```

After this you have a working TypeScript Playwright project with sample tests,
a config file, and a GitHub Actions workflow. Customise `playwright.config.ts`
with your `baseURL` and any project-specific settings.

---

## Q202.14 — Write a .gitignore file for a Playwright project

```gitignore
# Node
node_modules/
npm-debug.log*

# Playwright output — generated, not source
test-results/
playwright-report/
blob-report/
playwright/.cache/

# Browser binaries — downloaded by npx playwright install, not committed
/ms-playwright/

# Environment variables — contains secrets
.env
.env.local
.env.*.local

# TypeScript build output
dist/
*.js.map

# OS files
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Playwright visual snapshot baselines — DO commit these
# tests/**/*.png-snapshots/  — intentionally NOT gitignored
```

Note: `*.spec.ts-snapshots/` directories containing visual baselines should
be committed. They are the source of truth for visual regression tests.

---

## Q202.15 — Describe a setup or dependency issue you encountered when starting a Playwright project

When we set up Playwright on our Ubuntu CI runners, the first test run failed
with:

```
Error: browserType.launch: Host system is missing dependencies!
    chromium
      ✗ libnss3.so
      ✗ libnspr4.so
```

The browsers were installed (we ran `npx playwright install`) but the required
system libraries were missing on the fresh Ubuntu runner.

The fix was changing from `npx playwright install` to `npx playwright install --with-deps`.
The `--with-deps` flag calls the system package manager (`apt-get`) to install
every OS-level dependency the browser needs.

```yaml
# Before — browser installed but missing OS dependencies
- run: npx playwright install

# After — installs browsers AND their dependencies
- run: npx playwright install --with-deps
```

We also added browser caching to avoid the 2-minute download on every CI run:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ hashFiles('package-lock.json') }}
- run: npx playwright install --with-deps
```

With caching, if `package-lock.json` has not changed, the browser download
is skipped and only the OS dependencies are reinstalled. This cut our CI
setup time from 3 minutes to 20 seconds.

---

## Chapter Summary — Key Points for Your Interview

- `npm init playwright@latest` creates a complete project. `npx playwright install`
  downloads the browsers. Both are required for a working setup.
- On CI, always use `npx playwright install --with-deps` (system dependencies)
  and `npm ci` (deterministic install).
- Always commit `package-lock.json`. Never commit `node_modules`.
- `playwright.config.ts` controls everything — baseURL, timeouts, retries,
  workers, browsers, reporters.
- All test tooling is a `devDependency`. Use `npm install --save-dev` for
  test packages.

---
