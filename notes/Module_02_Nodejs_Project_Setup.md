# Module 2 — Node.js Project Setup
### Project-Based Notes for OrangeHRM Automation Framework

---

## Table of Contents

1. [What Is Node.js and Why Playwright Needs It](#1-what-is-nodejs-and-why-playwright-needs-it)
2. [Installing Node.js](#2-installing-nodejs)
3. [What Is a Node.js Project](#3-what-is-a-nodejs-project)
4. [package.json — The Heart of the Project](#4-packagejson--the-heart-of-the-project)
5. [Dependencies vs devDependencies](#5-dependencies-vs-devdependencies)
6. [package-lock.json — The Exact Snapshot](#6-package-lockjson--the-exact-snapshot)
7. [node_modules — The Dependency Folder](#7-node_modules--the-dependency-folder)
8. [npm — The Package Manager](#8-npm--the-package-manager)
9. [Scripts — Running Commands in the Project](#9-scripts--running-commands-in-the-project)
10. [Environment Variables and .env Files](#10-environment-variables-and-env-files)
11. [TypeScript Configuration](#11-typescript-configuration)
12. [OrangeHRM Project Structure — Complete Setup](#12-orangehrm-project-structure--complete-setup)
13. [Onboarding a New Engineer](#13-onboarding-a-new-engineer)
14. [Common Problems and Root Causes](#14-common-problems-and-root-causes)
15. [Quick Reference Cheat Sheet](#15-quick-reference-cheat-sheet)

---

## 1. What Is Node.js and Why Playwright Needs It

Node.js is a JavaScript runtime — it lets you run JavaScript code outside the browser, directly on your operating system from the terminal.

**The key distinction:** Node.js is not a programming language. JavaScript is the language. Node.js is the environment that executes it on your machine, just like Python's interpreter executes `.py` files.

### Why Playwright Is a Node.js Application

Playwright is written in JavaScript and distributed as a Node.js package. When you run:

```bash
npx playwright test
```

What actually happens behind the scenes:

```
npx playwright test
   ↓
Node.js reads your playwright.config.ts
   ↓
Node.js compiles TypeScript → JavaScript
   ↓
Node.js loads the @playwright/test library
   ↓
@playwright/test launches Chromium/Firefox/WebKit
   ↓
Your tests run inside those browsers
   ↓
Results collected, reports generated
```

Without Node.js installed, none of this works. Playwright cannot install, cannot run, and cannot report.

### LTS vs Current — Which to Install

Node.js releases two types:

| Type | Meaning | When to Use |
|---|---|---|
| **LTS** (Long Term Support) | Stable, supported for 3 years | Always — for all automation projects |
| **Current** | Latest features, supported for 6 months only | Never — too risky for production tooling |

Always install the **LTS** version. At the time of writing, Node.js 20 LTS is the recommended version for Playwright projects.

### Checking Your Node.js Version

```bash
node --version
# v20.11.1

npm --version
# 10.2.4
```

If `node --version` returns an error, Node.js is not installed or not in your PATH.

---

## 2. Installing Node.js

### Windows

**Option 1 — Official installer (simplest):**
1. Go to https://nodejs.org
2. Download the LTS version (left button — the recommended one)
3. Run the installer with all defaults
4. Restart your terminal after installation

**Option 2 — winget (recommended for developers):**
```powershell
winget install OpenJS.NodeJS.LTS
```

**Option 3 — nvm-windows (best for managing multiple versions):**
```powershell
# Install nvm-windows from https://github.com/coreybutler/nvm-windows/releases
# Then use it to install Node:
nvm install lts
nvm use lts
```

### macOS

**Option 1 — Homebrew (recommended):**
```bash
brew install node@20
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

**Option 2 — nvm (best for managing multiple versions):**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.zshrc
nvm install --lts
nvm use --lts
```

**Option 3 — Official installer:**
Download from https://nodejs.org — LTS version.

### Linux (Ubuntu/Debian)

```bash
# Using NodeSource repository (recommended — gives latest LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify
node --version
npm --version
```

### Verify Installation (All OS)

```bash
node --version    # Should show v20.x.x or higher
npm --version     # Should show 10.x.x or higher
npx --version     # Should show same as npm
```

---

## 3. What Is a Node.js Project

A Node.js project is any folder that contains a `package.json` file. That single file transforms a plain folder into a recognised Node.js project.

### What Makes a Folder a Project

```
orangehrm-automation/
├── package.json          ← THIS FILE makes it a Node.js project
├── package-lock.json
├── node_modules/
├── tsconfig.json
├── playwright.config.ts
├── tests/
├── pages/
└── ...
```

Without `package.json`, the folder is just a folder. With it, tools like `npm`, `npx`, and Node.js itself know:
- What the project is called
- Which version it is
- What packages it depends on
- What commands can be run

### Initialising a New Project

```bash
# Navigate to your cloned repository
cd orangehrm-automation

# Create package.json interactively
npm init

# Or skip all prompts and create with defaults
npm init -y
```

`npm init -y` creates a minimal `package.json`:

```json
{
  "name": "orangehrm-automation",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "keywords": [],
  "author": "",
  "license": "ISC"
}
```

This is just a starting point. You will edit it extensively.

---

## 4. package.json — The Heart of the Project

`package.json` is a JSON file that describes your project. Every Node.js tool reads it to understand what your project is and what it needs.

### Fully Annotated package.json for OrangeHRM

```json
{
  "name": "orangehrm-automation",
  "version": "1.0.0",
  "description": "OrangeHRM E2E Automation Framework using Playwright and TypeScript",
  "private": true,
  "engines": {
    "node": ">=20.0.0"
  },
  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:chrome": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "test:webkit": "playwright test --project=webkit",
    "test:api": "playwright test --grep @api",
    "test:debug": "PWDEBUG=1 playwright test",
    "report": "playwright show-report",
    "codegen": "playwright codegen https://opensource-demo.orangehrmlive.com",
    "typecheck": "tsc --noEmit",
    "clean": "rm -rf test-results playwright-report"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@types/node": "^20.0.0",
    "dotenv": "^16.4.5",
    "typescript": "^5.4.5"
  }
}
```

### Every Field Explained

| Field | Purpose | Example |
|---|---|---|
| `name` | Project identifier — lowercase, no spaces | `"orangehrm-automation"` |
| `version` | Semantic version of the project | `"1.0.0"` |
| `description` | Human-readable description | `"OrangeHRM E2E..."` |
| `private` | Set to `true` — prevents accidental publish to npm registry | `true` |
| `engines` | Minimum Node.js version required — protects against running on wrong version | `{ "node": ">=20.0.0" }` |
| `scripts` | Commands you can run with `npm run` | See next section |
| `devDependencies` | Packages needed for development/testing only — not production runtime | Playwright, TypeScript |
| `dependencies` | Packages needed at runtime — not applicable for pure test projects | Not used here |

### Why `"private": true` Matters

If you run `npm publish` without `private: true`, npm will attempt to publish your project to the public npm registry. For a test automation project, this is almost never what you want. Setting `private: true` prevents this with an error before any damage is done.

### Semantic Versioning

Version numbers follow the format `MAJOR.MINOR.PATCH`:

```
1.44.0
│  │  └── PATCH — bug fixes, backward compatible
│  └───── MINOR — new features, backward compatible
└──────── MAJOR — breaking changes
```

### Version Range Symbols in package.json

```json
"@playwright/test": "^1.44.0"
```

| Symbol | Meaning | Example |
|---|---|---|
| `^` (caret) | Allow minor and patch updates | `^1.44.0` → accepts `1.44.x` and `1.45.x`, not `2.x.x` |
| `~` (tilde) | Allow patch updates only | `~1.44.0` → accepts `1.44.x` only |
| `>=` | This version or higher | `>=1.44.0` → any version 1.44.0+ |
| No symbol | Exact version only | `1.44.0` → only exactly 1.44.0 |
| `*` | Any version | `*` → latest always |

For automation frameworks, `^` is the standard — it allows non-breaking updates automatically.

---

## 5. Dependencies vs devDependencies

This is one of the most commonly misunderstood concepts for beginners.

### The Distinction

```json
{
  "dependencies": {
    "express": "^4.18.2"
  },
  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "typescript": "^5.4.5"
  }
}
```

| | `dependencies` | `devDependencies` |
|---|---|---|
| **What it is** | Code your app needs to RUN | Code you need to DEVELOP and TEST |
| **Installed by** | `npm install` always | `npm install` (but not `npm install --production`) |
| **Examples** | express, axios, lodash | Playwright, TypeScript, Jest, ESLint |
| **Deployed to production?** | Yes | No |
| **Saved with flag** | `npm install package` or `--save` | `npm install package --save-dev` or `-D` |

### For the OrangeHRM Project

Since this is a **test automation project** — it is not a running application — everything goes in `devDependencies`. There is nothing to deploy. Everything is development tooling.

```bash
# Install as devDependency (correct for test frameworks)
npm install @playwright/test --save-dev
npm install typescript --save-dev
npm install @types/node --save-dev
npm install dotenv --save-dev

# Shorthand
npm install @playwright/test typescript @types/node dotenv -D
```

### Installing All Dependencies

When you clone the repository for the first time:

```bash
npm install
# OR
npm ci     # preferred — see package-lock.json section
```

This reads `package.json` and installs everything in both `dependencies` and `devDependencies`.

---

## 6. package-lock.json — The Exact Snapshot

### The Problem It Solves

`package.json` says: `"@playwright/test": "^1.44.0"` — meaning version 1.44.0 or higher compatible version.

The problem: today `^1.44.0` resolves to `1.44.1`. Next week a new release comes out and `^1.44.0` resolves to `1.45.0`. Your teammate gets a different version than you. Tests that pass on your machine fail on theirs. The classic "works on my machine" problem.

`package-lock.json` solves this by recording the **exact version** that was actually installed:

```json
{
  "name": "orangehrm-automation",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "node_modules/@playwright/test": {
      "version": "1.44.1",
      "resolved": "https://registry.npmjs.org/@playwright/test/-/...",
      "integrity": "sha512-abc123..."
    }
  }
}
```

Now everyone who runs `npm ci` gets exactly `1.44.1` — not "compatible with 1.44.0". Same version. Always.

### npm install vs npm ci

This is a critical distinction for professional teams:

| | `npm install` | `npm ci` |
|---|---|---|
| **Reads** | `package.json` (ranges) | `package-lock.json` (exact versions) |
| **Updates lock file?** | Yes — may change it | Never — fails if it would change |
| **Deletes node_modules first?** | No | Yes — always fresh install |
| **Speed** | Slower | Faster (skips dependency resolution) |
| **When to use** | Adding/updating packages | CI/CD pipelines and cloning a repo |

```bash
# Use npm ci when:
# - Cloning the repo for the first time
# - Running in CI/CD (GitHub Actions)
# - You want guaranteed reproducibility

# Use npm install when:
# - Adding a new package to the project
# - Upgrading a specific package version
```

### Always Commit package-lock.json

```bash
# Both files belong in Git
git add package.json
git add package-lock.json
git commit -m "Update dependencies"
```

Never add `package-lock.json` to `.gitignore`. It is not generated output — it is a critical project file that guarantees reproducibility.

---

## 7. node_modules — The Dependency Folder

When you run `npm install` or `npm ci`, all packages are downloaded and extracted into the `node_modules/` folder.

### What It Contains

```
node_modules/
├── @playwright/
│   └── test/          ← the Playwright test runner
├── @types/
│   └── node/          ← TypeScript types for Node.js
├── typescript/        ← TypeScript compiler
├── dotenv/            ← dotenv for .env files
└── ... (hundreds more packages — Playwright's own dependencies)
```

Even though you only installed 4 packages, `node_modules` may contain 200+ packages because each package has its own dependencies.

### Why node_modules Is Never Committed to Git

```bash
# node_modules for a typical Playwright project
du -sh node_modules
# 500M+

# Playwright installs browser binaries too
~/.cache/ms-playwright/   # 300-500MB per browser
```

Reasons not to commit it:
- **Size** — hundreds of megabytes, sometimes gigabytes
- **OS-specific** — some packages compile native code differently per OS
- **Reproducible** — can be perfectly recreated from `package-lock.json` with `npm ci`
- **Slow Git** — thousands of tiny files destroy Git performance

Always in `.gitignore`:
```
node_modules/
```

### The .bin Folder

```
node_modules/.bin/
├── playwright   ← the playwright executable
├── tsc          ← TypeScript compiler
└── ts-node      ← TypeScript executor
```

When you run `npx playwright test`, Node.js finds `playwright` in `node_modules/.bin/`. This is why you do not need to install Playwright globally — it lives inside the project.

### npm vs npx

| Command | What It Does |
|---|---|
| `npm` | Package manager — installs, removes, updates packages |
| `npx` | Package executor — runs a package without installing it globally |

```bash
# npm — manages packages
npm install @playwright/test --save-dev
npm run test

# npx — executes a package binary
npx playwright test
npx playwright show-report
npx playwright codegen https://orangehrmlive.com

# npx can also run packages without installing them (one-off usage)
npx create-playwright@latest
```

### Global vs Local Installation

```bash
# Global — available anywhere on your machine
npm install -g typescript
tsc --version    # works from any folder

# Local — only available inside this project
npm install typescript --save-dev
npx tsc --version    # works from inside the project folder only
```

**Always prefer local installation for project tools.** If two projects need different versions of Playwright, local installation gives each project its own version independently.

---

## 8. npm — The Package Manager

### Installing Packages

```bash
# Install and add to devDependencies
npm install @playwright/test --save-dev
npm install @playwright/test -D           # shorthand

# Install and add to dependencies
npm install axios --save
npm install axios                          # shorthand (default is --save)

# Install a specific version
npm install @playwright/test@1.44.0 -D

# Install multiple packages at once
npm install @playwright/test typescript @types/node dotenv -D

# Install from package.json (all dependencies)
npm install
npm ci              # preferred — exact versions from lock file
```

### Removing Packages

```bash
npm uninstall @playwright/test
npm uninstall @playwright/test --save-dev   # also removes from devDependencies
```

### Updating Packages

```bash
# Check what is outdated
npm outdated
# Package        Current   Wanted   Latest
# @playwright/test  1.44.0  1.44.1  1.45.0

# Update to latest version allowed by version range
npm update

# Update to latest regardless of range
npm install @playwright/test@latest -D

# After updating, always run tests to verify nothing broke
npm run test:smoke
```

### Viewing Installed Packages

```bash
# List direct dependencies (depth 0)
npm list --depth=0
# orangehrm-automation@1.0.0
# ├── @playwright/test@1.44.1
# ├── @types/node@20.11.5
# ├── dotenv@16.4.5
# └── typescript@5.4.5

# Check a specific package version
npm list @playwright/test

# View a package's information
npm info @playwright/test
npm info @playwright/test version      # just the latest version number
```

### The npm Registry

By default, npm downloads packages from `https://registry.npmjs.org` — the public npm registry with over 2 million packages. In enterprise environments, companies sometimes use a private registry (Artifactory, Verdaccio) to host approved packages internally. You would configure this in `.npmrc`:

```
registry=https://your-company-registry.com/npm/
```

---

## 9. Scripts — Running Commands in the Project

The `scripts` section of `package.json` defines shortcuts for running commands. Instead of memorising long `npx playwright test --grep @smoke --project=chromium` commands, you define them once and run them with `npm run`.

### How Scripts Work

```json
"scripts": {
  "test:smoke": "playwright test --grep @smoke"
}
```

```bash
npm run test:smoke
# Equivalent to: npx playwright test --grep @smoke
```

When `npm run` executes a script, it temporarily adds `node_modules/.bin` to the PATH. This means you do not need `npx` inside scripts — `playwright` resolves directly to `node_modules/.bin/playwright`.

### Complete Scripts for OrangeHRM Project

```json
"scripts": {
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:ui": "playwright test --ui",
  "test:smoke": "playwright test --grep @smoke",
  "test:regression": "playwright test --grep @regression",
  "test:chrome": "playwright test --project=chromium",
  "test:firefox": "playwright test --project=firefox",
  "test:webkit": "playwright test --project=webkit",
  "test:api": "playwright test --grep @api",
  "test:hybrid": "playwright test --grep @hybrid",
  "test:debug": "PWDEBUG=1 playwright test",
  "test:single": "playwright test --headed --workers=1",
  "report": "playwright show-report",
  "report:open": "playwright show-report playwright-report",
  "codegen": "playwright codegen https://opensource-demo.orangehrmlive.com",
  "typecheck": "tsc --noEmit",
  "clean": "rm -rf test-results playwright-report",
  "setup:auth": "ts-node global-setup.ts"
}
```

### Running Scripts

```bash
npm run test
npm run test:smoke
npm run test:headed
npm run report
```

### Passing Additional Arguments

Arguments after `--` are forwarded to the script:

```bash
# Run only tests matching "login" in headed mode
npm run test -- --grep "login" --headed

# Run only the smoke suite on Firefox
npm run test:smoke -- --project=firefox

# Run with 1 worker (sequential)
npm run test -- --workers=1
```

### Chaining Commands

```bash
# Run typecheck THEN tests — stops if typecheck fails
"test:safe": "tsc --noEmit && playwright test"

# Run tests THEN open the report regardless of result
"test:report": "playwright test; playwright show-report"

# Cross-platform chaining (works on Windows too)
# Install npm-run-all: npm install npm-run-all -D
"test:full": "npm-run-all typecheck test"
```

### Pre and Post Hooks

Scripts named `pre<script>` and `post<script>` run automatically before and after:

```json
"scripts": {
  "pretest": "tsc --noEmit",
  "test": "playwright test",
  "posttest": "playwright show-report"
}
```

```bash
npm run test
# 1. Runs: tsc --noEmit
# 2. Runs: playwright test
# 3. Runs: playwright show-report
```

Useful for ensuring TypeScript is valid before running tests.

### Windows Compatibility Note

Some commands use Unix syntax that does not work in Windows Command Prompt:

```json
"test:debug": "PWDEBUG=1 playwright test"   // ← Unix syntax, fails on Windows CMD
```

**Solutions:**

```bash
# Option 1 — Use Git Bash on Windows (recommended — all Unix commands work)
# Option 2 — Install cross-env package
npm install cross-env -D
```

```json
"test:debug": "cross-env PWDEBUG=1 playwright test"  // ← works everywhere
```

---

## 10. Environment Variables and .env Files

### Why Environment Variables

Hardcoding values directly in your test files is a serious problem:

```typescript
// ❌ WRONG — never do this
await page.goto('https://opensource-demo.orangehrmlive.com');
await page.fill('#username', 'Admin');
await page.fill('#password', 'admin123');
```

Problems with hardcoding:
- Credentials appear in Git history permanently
- You cannot run the same tests against different environments (staging vs production) without editing code
- If the password changes, you have to find and update every file
- If someone accesses your repository, they get your credentials

Environment variables solve all of these by putting values outside the code.

### The .env File Pattern

```
.env             ← real values, NEVER committed to Git
.env.example     ← template with empty values, committed to Git
```

**.env (on your machine only — in .gitignore):**
```env
BASE_URL=https://opensource-demo.orangehrmlive.com
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=admin123
ESS_USERNAME=essuser
ESS_PASSWORD=esspass123
ENVIRONMENT=staging
RP_API_KEY=your-report-portal-api-key
```

**.env.example (committed to Git — shows structure without secrets):**
```env
BASE_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
ESS_USERNAME=
ESS_PASSWORD=
ENVIRONMENT=staging
RP_API_KEY=
```

When a new engineer joins, they:
1. Clone the repository
2. Copy `.env.example` to `.env`
3. Fill in the real values (get them from team lead or password manager)

### Installing dotenv

```bash
npm install dotenv --save-dev
```

### Loading Environment Variables — helpers/env.ts

Create a centralised file that loads and exports all environment variables with TypeScript types:

```typescript
// helpers/env.ts
import dotenv from 'dotenv';
import path from 'path';

// Load .env file from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Export typed environment variables with safe defaults
export const ENV = {
  BASE_URL: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
  ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? 'Admin',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'admin123',
  ESS_USERNAME: process.env.ESS_USERNAME ?? '',
  ESS_PASSWORD: process.env.ESS_PASSWORD ?? '',
  ENVIRONMENT: process.env.ENVIRONMENT ?? 'staging',
  IS_CI: !!process.env.CI,           // CI is set automatically in GitHub Actions
  RP_API_KEY: process.env.RP_API_KEY ?? '',
} as const;
```

### Using ENV in playwright.config.ts

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import { ENV } from './helpers/env';

export default defineConfig({
  use: {
    baseURL: ENV.BASE_URL,
  },
  retries: ENV.IS_CI ? 1 : 0,
  workers: ENV.IS_CI ? 4 : 2,
});
```

### Using ENV in Tests

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';
import { ENV } from '@helpers/env';

test('login as admin', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill(ENV.ADMIN_USERNAME);
  await page.getByPlaceholder('Password').fill(ENV.ADMIN_PASSWORD);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page).toHaveURL(/.*dashboard/);
});
```

### Setting Environment Variables Per OS

Sometimes you want to override a variable for a single command without editing `.env`:

```bash
# macOS / Linux (Git Bash on Windows)
BASE_URL=https://staging.orangehrmlive.com npm run test:smoke

# Windows — Command Prompt
set BASE_URL=https://staging.orangehrmlive.com && npm run test:smoke

# Windows — PowerShell
$env:BASE_URL="https://staging.orangehrmlive.com"; npm run test:smoke
```

### Validating Required Variables

Create a guard that fails fast if a required variable is missing:

```typescript
// helpers/verify-env.ts
import { ENV } from './env';

function requireEnv(key: keyof typeof ENV, value: string | boolean): void {
  if (!value) {
    throw new Error(
      `Missing required environment variable: ${key}\n` +
      `Copy .env.example to .env and fill in the values.`
    );
  }
}

requireEnv('ADMIN_USERNAME', ENV.ADMIN_USERNAME);
requireEnv('ADMIN_PASSWORD', ENV.ADMIN_PASSWORD);
requireEnv('BASE_URL', ENV.BASE_URL);

console.log('✅ All required environment variables are set');
console.log(`   BASE_URL: ${ENV.BASE_URL}`);
console.log(`   ADMIN_USERNAME: ${ENV.ADMIN_USERNAME}`);
console.log(`   ENVIRONMENT: ${ENV.ENVIRONMENT}`);
console.log(`   IS_CI: ${ENV.IS_CI}`);
```

Run it: `npx ts-node helpers/verify-env.ts`

### Environment Variables in CI/CD

In GitHub Actions, environment variables are set as **secrets** — never hardcoded in the YAML file:

```yaml
# .github/workflows/playwright.yml
- name: Run tests
  run: npm run test:smoke
  env:
    BASE_URL: ${{ secrets.BASE_URL }}
    ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
    ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
```

The `CI` variable is automatically set to `true` by GitHub Actions (and most CI systems). This is why `process.env.CI` works to detect CI environments without configuring it yourself.

---

## 11. TypeScript Configuration

### Why TypeScript for Test Automation

TypeScript adds static types to JavaScript. For test automation, this means:

- **Autocomplete** — your editor knows every method on `Page`, `Locator`, `Browser`
- **Compile-time errors** — typos in method names are caught before running tests
- **Refactoring safety** — rename a POM method and TypeScript shows every place it is used
- **Self-documenting code** — method signatures show what parameters are expected

```typescript
// Without TypeScript — no error until runtime
const locator = page.getByRol('button');  // typo: getByRol instead of getByRole
// Only fails when you run the test

// With TypeScript — error immediately in editor
const locator = page.getByRol('button');
// TS Error: Property 'getByRol' does not exist on type 'Page'
//           Did you mean 'getByRole'?
```

### tsconfig.json for OrangeHRM

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["pages/*"],
      "@helpers/*": ["helpers/*"],
      "@fixtures/*": ["fixtures/*"],
      "@data/*": ["data/*"]
    }
  },
  "include": [
    "tests/**/*.ts",
    "pages/**/*.ts",
    "helpers/**/*.ts",
    "fixtures/**/*.ts",
    "components/**/*.ts",
    "playwright.config.ts",
    "global-setup.ts",
    "global-teardown.ts"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "test-results",
    "playwright-report"
  ]
}
```

### Every Option Explained

| Option | Value | Why |
|---|---|---|
| `target` | `ES2022` | Compiles to modern JavaScript — async/await, optional chaining all supported |
| `module` | `commonjs` | Node.js module format — required for `require()` to work |
| `lib` | `["ES2022"]` | Enables modern JavaScript built-ins like `Array.at()`, `Object.hasOwn()` |
| `strict` | `true` | Enables all strict type checks — catches more bugs at compile time |
| `esModuleInterop` | `true` | Allows `import dotenv from 'dotenv'` style imports for CommonJS packages |
| `skipLibCheck` | `true` | Skips type checking of `.d.ts` files in node_modules — speeds up compilation |
| `moduleResolution` | `node` | Resolves imports the same way Node.js does |
| `resolveJsonModule` | `true` | Allows `import data from './data.json'` — needed for test data files |
| `baseUrl` | `"."` | Root folder for path aliases |
| `paths` | `{ "@pages/*": ... }` | Path aliases — `@pages/LoginPage` instead of `../../pages/LoginPage` |

### Path Aliases — Why They Matter

Without path aliases:
```typescript
// Deep inside tests/module/submodule/test.spec.ts
import { LoginPage } from '../../../pages/LoginPage';
import { ENV } from '../../../helpers/env';
```

With path aliases:
```typescript
// Works from anywhere — no relative paths to count
import { LoginPage } from '@pages/LoginPage';
import { ENV } from '@helpers/env';
```

Much cleaner. And if you move a file, you do not have to update the relative path in every import.

> ⚠️ **Important:** TypeScript path aliases only work for TypeScript compilation checks. For actual runtime execution, Playwright handles module resolution differently. Aliases in `tsconfig.json` are enough for Playwright projects — you do not need additional tools like `tsconfig-paths`.

### Running TypeScript Checks

```bash
# Check for TypeScript errors WITHOUT compiling
npx tsc --noEmit

# Should output nothing if there are no errors
# Errors look like:
# pages/LoginPage.ts:12:5 - error TS2339: Property 'usernameInpu' does not exist
```

Run this in CI before running tests:
```json
"scripts": {
  "pretest": "tsc --noEmit",
  "test": "playwright test"
}
```

### TypeScript Does NOT Run Your Tests

A common confusion: TypeScript does not execute your tests. Playwright executes them.

```bash
npx playwright test
# Playwright internally uses esbuild to compile TypeScript to JavaScript on-the-fly
# It does NOT run the TypeScript compiler (tsc)
# This is why TypeScript errors in your test files do NOT stop tests from running

npx tsc --noEmit
# This runs the actual TypeScript compiler
# This DOES catch all type errors
# You must run this separately to enforce TypeScript correctness
```

This is why adding `"pretest": "tsc --noEmit"` or running typecheck in CI is important — otherwise TypeScript errors go unnoticed.

---

## 12. OrangeHRM Project Structure — Complete Setup

After completing this module, your repository should have exactly this structure:

```
orangehrm-automation/
│
├── .github/
│   └── workflows/
│       └── playwright.yml          ← CI/CD pipeline (Module 13)
│
├── auth/                           ← session state files (gitignored)
│   ├── admin.json
│   └── ess-user.json
│
├── components/                     ← reusable UI component objects (Module 5)
│   ├── DataTable.ts
│   ├── NavigationMenu.ts
│   ├── Toast.ts
│   └── TopBar.ts
│
├── data/                           ← test data files (Module 9)
│   ├── employees.json
│   ├── invalid-logins.ts
│   └── config.ts
│
├── fixtures/                       ← custom Playwright fixtures (Module 4)
│   ├── pages.fixture.ts
│   ├── api.fixture.ts
│   └── index.ts
│
├── helpers/                        ← utility files
│   ├── env.ts                      ← environment variable loader
│   ├── verify-env.ts               ← env validation script
│   ├── ApiClient.ts                ← HTTP client (Module 11)
│   └── DataFactory.ts              ← test data factory (Module 12)
│
├── pages/                          ← page object models (Module 5)
│   ├── BasePage.ts
│   ├── LoginPage.ts
│   ├── DashboardPage.ts
│   ├── EmployeeListPage.ts
│   ├── AddEmployeePage.ts
│   ├── LeaveListPage.ts
│   └── AdminPage.ts
│
├── tests/                          ← test files (Module 6+)
│   ├── login.spec.ts
│   ├── employees.spec.ts
│   ├── leave.spec.ts
│   ├── admin.spec.ts
│   ├── api/
│   │   ├── auth.api.spec.ts
│   │   └── employees.api.spec.ts
│   └── hybrid/
│       └── api-setup-ui-verify.spec.ts
│
├── .env                            ← real values (gitignored)
├── .env.example                    ← template (committed)
├── .gitignore                      ← what not to commit
├── global-setup.ts                 ← creates auth state before tests
├── global-teardown.ts              ← cleans up after all tests
├── package.json                    ← project definition and scripts
├── package-lock.json               ← exact dependency versions
├── playwright.config.ts            ← Playwright configuration
├── README.md                       ← project documentation
└── tsconfig.json                   ← TypeScript configuration
```

### Setting Up from Scratch — Complete Command Sequence

```bash
# 1. Clone the repository (after Module 1 setup)
git clone git@github.com:your-username/orangehrm-automation.git
cd orangehrm-automation

# 2. Initialise the Node.js project
npm init -y

# 3. Install all dependencies
npm install @playwright/test typescript @types/node dotenv -D

# 4. Install Playwright browsers
npx playwright install --with-deps

# 5. Create tsconfig.json
# (create the file with the content shown above)

# 6. Create folder structure
mkdir -p tests/api tests/hybrid pages components helpers fixtures data auth

# 7. Create placeholder files
touch pages/.gitkeep components/.gitkeep helpers/.gitkeep fixtures/.gitkeep data/.gitkeep
echo '{}' > auth/.gitkeep

# 8. Create .env.example
cat > .env.example << 'EOF'
BASE_URL=
ADMIN_USERNAME=
ADMIN_PASSWORD=
ESS_USERNAME=
ESS_PASSWORD=
ENVIRONMENT=staging
RP_API_KEY=
EOF

# 9. Create .env with real values
cp .env.example .env
# Now fill in the real values in .env

# 10. Create helpers/env.ts
# (create the file with the content shown above)

# 11. Verify everything works
npx playwright --version
npx tsc --noEmit
npx ts-node helpers/verify-env.ts

# 12. Commit and push
git checkout -b feature/project-setup
git add package.json package-lock.json tsconfig.json .env.example .gitignore helpers/
git commit -m "Set up Node.js project with TypeScript and Playwright"
git push -u origin feature/project-setup
# Open PR on GitHub
```

---

## 13. Onboarding a New Engineer

One test of a well-configured project: a new engineer should be able to go from zero to running tests in under 10 minutes following only the README.

### What the README Must Cover

```markdown
# OrangeHRM Automation Framework

## Prerequisites
- Node.js v20 LTS or higher — https://nodejs.org
- Git — https://git-scm.com

## Setup

### 1. Clone the repository
git clone git@github.com:your-org/orangehrm-automation.git
cd orangehrm-automation

### 2. Install dependencies
npm ci

### 3. Install browsers
npx playwright install --with-deps

### 4. Configure environment
cp .env.example .env
# Open .env and fill in the values (get credentials from team lead or 1Password)

### 5. Verify setup
npx ts-node helpers/verify-env.ts

### 6. Run smoke tests
npm run test:smoke

## Running Tests

| Command | What It Does |
|---|---|
| `npm run test` | Run all tests |
| `npm run test:smoke` | Run smoke tests only |
| `npm run test:headed` | Run with visible browser |
| `npm run test:chrome` | Run on Chrome only |
| `npm run report` | Open last test report |
| `npm run typecheck` | Check TypeScript types |

## Environment Variables

See `.env.example` for all required variables.
Contact the team lead for the actual values.
```

### Testing the Onboarding Process

To verify your README works:
1. Delete `node_modules` and `auth/`
2. Start a timer
3. Follow only the README instructions — do not use your memory
4. If any step fails or is unclear, update the README before continuing
5. Stop the timer when `npm run test:smoke` produces a report

Target: under 10 minutes on a machine where Node.js is already installed.

---

## 14. Common Problems and Root Causes

| Problem | Root Cause | Solution |
|---|---|---|
| `node: command not found` | Node.js not installed or not in PATH | Install Node.js LTS; restart terminal |
| `npm: command not found` | npm not installed (comes with Node.js) | Reinstall Node.js; check PATH |
| `npx: command not found` | npx not installed (comes with npm 5.2+) | Update npm: `npm install -g npm` |
| `Cannot find module '@playwright/test'` | `npm install` not run yet | Run `npm ci` |
| `Cannot find module '@pages/LoginPage'` | TypeScript path aliases not configured | Check `tsconfig.json` `paths` section |
| `error TS2307: Cannot find module` | TypeScript cannot find a file | Check import path, check `include` in tsconfig.json |
| `npm ci` fails with lock file error | `package-lock.json` is out of sync with `package.json` | Run `npm install` to regenerate lock file, commit both |
| Tests run but TypeScript errors ignored | Running `npx playwright test` bypasses tsc | Run `npx tsc --noEmit` separately in CI |
| `.env` values not loading | dotenv.config() not called before accessing process.env | Import `helpers/env.ts` before using ENV |
| `.env` committed to Git | `.env` not in `.gitignore` before first commit | `git rm --cached .env` + add to `.gitignore` + rotate credentials |
| `process.env.X is undefined` | Variable not in `.env`, or `.env` not in project root | Check `.env` file location and variable name spelling |
| `engines` version mismatch warning | Running older Node.js than specified in `package.json` | Upgrade Node.js to LTS |
| `ENOENT: node_modules/.bin/playwright` | Playwright not installed | `npm ci` then `npx playwright install --with-deps` |
| Browser not found error | Playwright browsers not installed | `npx playwright install --with-deps` |
| `rm -rf` fails on Windows | `clean` script uses Unix command | Use `rimraf` package or `rd /s /q` on Windows; or use cross-platform tools |

---

## 15. Quick Reference Cheat Sheet

### Setup a New Project

```bash
npm init -y
npm install @playwright/test typescript @types/node dotenv -D
npx playwright install --with-deps
```

### Join an Existing Project

```bash
git clone git@github.com:org/orangehrm-automation.git
cd orangehrm-automation
npm ci
npx playwright install --with-deps
cp .env.example .env
# Fill in .env values
```

### Package Management

```bash
npm install <package> -D          # add devDependency
npm uninstall <package>            # remove package
npm ci                             # install exact versions from lock file
npm install                        # install from package.json ranges
npm outdated                       # check for updates
npm update                         # update within version ranges
npm list --depth=0                 # list installed packages
```

### Running Tests

```bash
npm run test                       # all tests
npm run test:smoke                 # smoke tests
npm run test:headed                # with visible browser
npm run test:chrome                # Chromium only
npm run test:debug                 # Playwright Inspector
npm run report                     # open HTML report
npm run typecheck                  # TypeScript check
```

### Environment Variables

```bash
# macOS / Linux / Git Bash
BASE_URL=https://staging.example.com npm run test

# Windows CMD
set BASE_URL=https://staging.example.com && npm run test

# Windows PowerShell
$env:BASE_URL="https://staging.example.com"; npm run test
```

### Key Files Summary

| File | Purpose | Committed? |
|---|---|---|
| `package.json` | Project definition and scripts | ✅ Yes |
| `package-lock.json` | Exact dependency versions | ✅ Yes |
| `tsconfig.json` | TypeScript compiler configuration | ✅ Yes |
| `.env.example` | Environment variable template | ✅ Yes |
| `.env` | Real environment values with secrets | ❌ No |
| `node_modules/` | Installed packages | ❌ No |
| `playwright-report/` | Generated test report | ❌ No |
| `test-results/` | Generated test artefacts | ❌ No |
| `auth/` | Session state files | ❌ No |

---

*Next: Module 3 — Playwright Configuration*
