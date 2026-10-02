# Node.js Project – Detailed Notes
### Understanding Node.js Projects for Test Automation Engineers

---

## Table of Contents
1. [What Is Node.js?](#1-what-is-nodejs)
2. [How Node.js Works](#2-how-nodejs-works)
3. [What Is a Node.js Project?](#3-what-is-a-nodejs-project)
4. [package.json – The Heart of a Node.js Project](#4-packagejson--the-heart-of-a-nodejs-project)
5. [package-lock.json – The Exact Snapshot](#5-package-lockjson--the-exact-snapshot)
6. [node_modules – The Dependency Folder](#6-node_modules--the-dependency-folder)
7. [npm – The Package Manager](#7-npm--the-package-manager)
8. [Scripts – Running Commands in a Project](#8-scripts--running-commands-in-a-project)
9. [Environment Variables and .env Files](#9-environment-variables-and-env-files)
10. [TypeScript in a Node.js Project](#10-typescript-in-a-nodejs-project)
11. [Project Structure for a Playwright Automation Project](#11-project-structure-for-a-playwright-automation-project)
12. [Common Problems and Root Causes](#12-common-problems-and-root-causes)
13. [Quick Reference Cheat Sheet](#13-quick-reference-cheat-sheet)

---

## 1. What Is Node.js?

Node.js is a **JavaScript runtime environment** — it lets you run JavaScript code outside of a browser, directly on your operating system. Before Node.js existed, JavaScript could only run inside a browser (Chrome, Firefox, Safari). Node.js changed that by taking the V8 JavaScript engine (the same engine Chrome uses) and making it available as a standalone tool you can run from the terminal.

**Key concept:** Node.js is not a programming language. JavaScript is the language. Node.js is the environment that executes it on your machine, just like Python's interpreter executes `.py` files or Java's JVM executes `.class` files.

### Why Test Automation Engineers Use Node.js

Playwright is a Node.js library. When you install Playwright, run tests, or write TypeScript test files, everything happens inside a Node.js runtime. You do not need to be a Node.js developer to use it — but you need to understand the project structure well enough to:

- Install and manage dependencies
- Run the right commands
- Understand why things fail when versions do not match
- Navigate `package.json` and know what each section means
- Configure the project for your environment

### What Node.js Enables

Without Node.js, none of these would be possible on the command line:

```bash
npx playwright test          # runs Playwright tests
npm install                  # installs project dependencies
npx ts-node script.ts        # runs a TypeScript file directly
node server.js               # runs a JavaScript file
```

All of these work because Node.js is installed on your machine and knows how to execute JavaScript/TypeScript outside the browser.

### Node.js Versions

Node.js has a versioned release cycle:

- **LTS (Long Term Support)** — even-numbered versions (18, 20, 22). Stable, supported for 3 years. Use these for projects.
- **Current** — odd-numbered versions (19, 21). Latest features but shorter support window. Not recommended for production projects.

Most Playwright projects specify a minimum Node.js version. Always check `package.json` for an `"engines"` field or look for an `.nvmrc` file before installing.

```bash
# Check your current Node.js version
node --version     # e.g. v20.11.0

# Check npm version (comes bundled with Node.js)
npm --version      # e.g. 10.2.4
```

> 💡 **Mental Model:** Node.js is to JavaScript what the JVM is to Java — it is the runtime that takes your code and executes it on the operating system. Without it, your `.ts` and `.js` files are just text files.

---

## 2. How Node.js Works

Understanding the basics of how Node.js works helps you make sense of why Playwright projects are structured the way they are.

### The Event Loop

Node.js runs on a **single thread** but handles multiple operations concurrently using an **event loop**. Instead of waiting for one operation to finish before starting the next (like traditional synchronous code), Node.js registers callbacks and moves on. When an operation completes, its callback is put on the event loop queue and executed.

This is why Playwright code uses `async/await`:

```ts
// Without await — Node.js would not wait for the page to load
page.goto('https://myapp.com');         // starts loading, moves on immediately
page.click('button');                    // tries to click before page is ready — fails

// With await — execution pauses until each operation completes
await page.goto('https://myapp.com');   // waits for page to load
await page.click('button');             // then clicks — works correctly
```

Every Playwright action is asynchronous under the hood — it sends a command to the browser and waits for a response. `async/await` is what makes this readable and correct.

### The Module System

Node.js organises code into **modules** — separate files that export functionality and import from other files. There are two module systems in use:

**CommonJS (older — `.js` files by default in most Node.js projects):**
```js
// Exporting
module.exports = { loginAs };

// Importing
const { loginAs } = require('./helpers/auth');
```

**ES Modules (modern — used when `"type": "module"` is in package.json, or with `.mjs` files):**
```js
// Exporting
export function loginAs() { ... }

// Importing
import { loginAs } from './helpers/auth.js';
```

**TypeScript (what most Playwright projects use):**
```ts
// Exporting
export function loginAs() { ... }

// Importing
import { loginAs } from './helpers/auth';
// TypeScript resolves the file extension automatically
```

Playwright TypeScript projects use ES Module syntax (`import`/`export`) because TypeScript compiles it down to whichever module format the project is configured for.

### How Files Are Resolved

When you write `import { something } from './helpers/auth'`, Node.js (via TypeScript) looks for:
1. `./helpers/auth.ts`
2. `./helpers/auth.js`
3. `./helpers/auth/index.ts`
4. `./helpers/auth/index.js`

This is why you do not need to write the file extension in TypeScript imports — the resolver tries common extensions automatically.

---

## 3. What Is a Node.js Project?

A **Node.js project** is any folder that contains a `package.json` file. That single file is what tells Node.js (and npm) that this directory is a project — not just a random folder of files.

### Initialising a New Project from Scratch

```bash
# Create a new directory and enter it
mkdir my-playwright-tests
cd my-playwright-tests

# Initialise a Node.js project — creates package.json
npm init

# Or skip all the questions and create with sensible defaults
npm init -y
```

`npm init -y` creates a minimal `package.json`:

```json
{
  "name": "my-playwright-tests",
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

This is your starting point. Everything else — dependencies, test configuration, TypeScript setup — is added on top of this.

### What Makes a Folder a Node.js Project

```
my-playwright-tests/
  ├── package.json          ← THIS file makes it a Node.js project
  ├── package-lock.json     ← auto-generated when you install packages
  ├── node_modules/         ← auto-generated, contains all dependencies
  ├── playwright.config.ts  ← Playwright-specific configuration
  ├── tsconfig.json         ← TypeScript configuration
  └── tests/
       └── login.spec.ts
```

If you delete `package.json`, Node.js and npm no longer know this is a project. It becomes a plain folder of files.

---

## 4. package.json – The Heart of a Node.js Project

`package.json` is the most important file in any Node.js project. It defines everything about the project — its name, version, what packages it depends on, what commands can be run, and what environment it requires. Every time you run `npm install`, `npm run test`, or `npx playwright test`, npm reads `package.json` to understand what to do.

### A Full Annotated package.json for a Playwright Project

```json
{
  "name": "playwright-automation",
  "version": "1.0.0",
  "description": "End-to-end test suite for MyApp using Playwright",
  "private": true,

  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },

  "scripts": {
    "test": "playwright test",
    "test:headed": "playwright test --headed",
    "test:ui": "playwright test --ui",
    "test:smoke": "playwright test --grep @smoke",
    "test:regression": "playwright test --grep @regression",
    "test:chrome": "playwright test --project=chromium",
    "test:firefox": "playwright test --project=firefox",
    "report": "playwright show-report",
    "codegen": "playwright codegen",
    "lint": "eslint tests/ pages/ helpers/",
    "typecheck": "tsc --noEmit"
  },

  "dependencies": {
  },

  "devDependencies": {
    "@playwright/test": "^1.44.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.4.0",
    "dotenv": "^16.0.0",
    "eslint": "^8.0.0"
  }
}
```

### Every Field Explained

**`name`** — the project name. Must be lowercase, no spaces. Used internally by npm. For private projects this is just a label.

**`version`** — the project version using semantic versioning (`major.minor.patch`). For internal automation projects this is informational only — you are not publishing a package.

**`description`** — a human-readable description. Useful when multiple people work on the project.

**`private: true`** — prevents this package from being accidentally published to the public npm registry. Always set this to `true` for automation projects. Without it, running `npm publish` would publish your test code publicly.

**`engines`** — specifies which versions of Node.js and npm the project requires. If someone tries to run the project with an incompatible version, npm warns them. This is how teams communicate the required Node.js version without everyone reading documentation.

```json
"engines": {
  "node": ">=20.0.0"
}
```

**`scripts`** — defines command shortcuts (covered in detail in Section 8).

**`dependencies`** — packages required for the application to run in production. For a pure test automation project this is usually empty — tests are not shipped to production.

**`devDependencies`** — packages required only during development and testing. Playwright, TypeScript, ESLint all go here. When you run `npm ci --production` in a production environment, dev dependencies are skipped.

### dependencies vs devDependencies

This distinction matters when you are reading a project's `package.json` to understand what it uses:

| `dependencies` | `devDependencies` |
|---|---|
| Required at runtime | Required only during development/testing |
| Installed in production | Skipped in production installs |
| e.g. Express, React, Axios | e.g. Playwright, TypeScript, ESLint, Jest |
| Added with `npm install package-name` | Added with `npm install package-name --save-dev` |

For a Playwright automation project, **everything goes in `devDependencies`** because tests are never deployed to production.

### Version Ranges — What `^` and `~` Mean

The version numbers in `package.json` are not always exact — they use range specifiers:

| Symbol | Meaning | Example | Installs |
|---|---|---|---|
| `^` (caret) | Compatible with version | `^1.44.0` | 1.44.0 up to but not including 2.0.0 |
| `~` (tilde) | Approximately equal | `~1.44.0` | 1.44.0 up to but not including 1.45.0 |
| No symbol | Exact version | `1.44.0` | Exactly 1.44.0 only |
| `>=` | Greater than or equal | `>=18.0.0` | 18.0.0 or any newer version |
| `*` | Any version | `*` | Latest available (avoid this) |

In practice, `^` is the most common. It allows minor and patch updates (bug fixes and backwards-compatible features) while blocking major version updates that could contain breaking changes.

> ⚠️ **Important:** `package.json` version ranges tell npm what versions are acceptable. `package-lock.json` records the exact version that was actually installed. This is why two engineers running `npm install` at different times can get slightly different versions — but `npm ci` always installs exactly what is in the lock file.

---

## 5. package-lock.json – The Exact Snapshot

`package-lock.json` is automatically generated and updated by npm every time you install or update packages. You never edit it manually.

### What It Does

While `package.json` says "install Playwright version 1.44 or newer", `package-lock.json` says "install Playwright version **exactly** 1.44.1 and all of its dependencies at these exact versions". It locks the entire dependency tree — not just your direct dependencies but every dependency of every dependency.

```json
{
  "name": "playwright-automation",
  "version": "1.0.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "devDependencies": {
        "@playwright/test": "^1.44.0"
      }
    },
    "node_modules/@playwright/test": {
      "version": "1.44.1",       ← exact version installed
      "resolved": "https://registry.npmjs.org/@playwright/test/-/...",
      "integrity": "sha512-..."  ← checksum to verify the file is genuine
    }
  }
}
```

### Why package-lock.json Matters for Teams

Without the lock file, two engineers on the same team running `npm install` a month apart might get different versions of the same package (because `^1.44.0` could resolve to `1.44.1` for one engineer and `1.45.0` for another after a new release). This causes the classic problem: "it works on my machine but not yours."

The lock file solves this:
- **`npm ci`** — installs exactly what is in `package-lock.json`. Use this when joining a project or in CI pipelines.
- **`npm install`** — may update `package-lock.json` and install newer compatible versions.

### Rules for package-lock.json

- **Always commit it to Git** — it should be in version control alongside `package.json`
- **Never manually edit it** — let npm manage it
- **Never delete it** unless you intentionally want to resolve all dependencies fresh
- **If it goes out of sync with `package.json`**, `npm ci` will fail — run `npm install` to regenerate it

> 💡 **Mental Model:** `package.json` is your shopping list that says "I need milk — any brand from 2024 works." `package-lock.json` is the receipt that says "I bought exactly this carton of Amul milk, batch number XYZ, on this date." `npm ci` uses the receipt; `npm install` uses the shopping list.

---

## 6. node_modules – The Dependency Folder

`node_modules` is the folder where npm physically downloads and stores all the packages your project depends on. It is created automatically when you run `npm install` or `npm ci`.

### What It Contains

For a Playwright project, `node_modules` can easily contain **thousands of folders**. Playwright itself depends on many other packages, each of which may depend on more packages. This is normal.

```
node_modules/
  ├── @playwright/
  │    └── test/           ← Playwright test runner
  ├── @types/
  │    └── node/           ← TypeScript types for Node.js built-ins
  ├── typescript/          ← TypeScript compiler
  ├── dotenv/              ← .env file loader
  └── ... hundreds more
```

### Why node_modules Is Never Committed to Git

The `node_modules` folder is always listed in `.gitignore` because:

- It is **enormous** — a typical Playwright project's `node_modules` is 300MB to 1GB
- It is **reproducible** — anyone can regenerate it exactly by running `npm ci` with the `package-lock.json`
- It is **OS-specific** — some packages contain compiled native binaries that only work on the OS they were installed on. A `node_modules` installed on Windows cannot be used on Linux.
- It is **not source code** — you did not write it; it is third-party code fetched from the internet

When someone clones your repository, they get `package.json` and `package-lock.json` but not `node_modules`. They regenerate it with `npm ci`. This is the correct and intended workflow.

### Checking What Is Installed

```bash
# List all top-level installed packages and their versions
npm list --depth=0

# Check if a specific package is installed
npm list @playwright/test

# See why a package is installed (what depends on it)
npm why some-package

# Check for outdated packages
npm outdated
```

### The .bin Folder

Inside `node_modules` there is a hidden `.bin` folder:

```
node_modules/
  └── .bin/
       ├── playwright       ← the playwright CLI
       ├── ts-node          ← TypeScript executor
       └── tsc              ← TypeScript compiler
```

This is why you can run `npx playwright test` — `npx` looks in `node_modules/.bin/` for the `playwright` executable and runs it. Without `node_modules/.bin/playwright` existing, the command fails with "command not found."

---

## 7. npm – The Package Manager

npm (Node Package Manager) is the command-line tool that comes bundled with Node.js. It manages installing, updating, and removing packages in your project. It is also how you run scripts defined in `package.json`.

### Installing Packages

```bash
# Install a package as a dev dependency (most common for automation)
npm install @playwright/test --save-dev
# shorthand
npm install @playwright/test -D

# Install a package as a regular dependency
npm install axios

# Install a specific version
npm install @playwright/test@1.44.0 --save-dev

# Install multiple packages at once
npm install typescript @types/node dotenv --save-dev

# Install all dependencies from package.json (when joining a project)
npm install

# Install exact versions from package-lock.json (preferred for teams and CI)
npm ci
```

### Removing Packages

```bash
# Remove a package and update package.json
npm uninstall some-package

# Remove a dev dependency
npm uninstall some-package --save-dev
```

### Updating Packages

```bash
# Check which packages have newer versions available
npm outdated

# Update all packages within their allowed version ranges
npm update

# Update a specific package
npm update @playwright/test

# Update to a version outside the current range (manual)
npm install @playwright/test@latest --save-dev
```

### npm vs npx

These two commands are often confused:

| `npm` | `npx` |
|---|---|
| Package manager — installs, updates, removes packages and runs scripts | Package executor — runs a CLI tool from `node_modules/.bin/` or downloads and runs it temporarily |
| `npm install` — installs packages | `npx playwright test` — runs the playwright binary |
| `npm run test` — runs a script from package.json | `npx ts-node script.ts` — runs ts-node without installing it globally |
| `npm list` — lists installed packages | `npx create-playwright` — downloads and runs a package without installing it |

In practice:
- Use `npm` when **managing** packages (installing, updating, removing)
- Use `npx` when **executing** a tool that lives in `node_modules` or a one-off command

### Global vs Local Installation

Packages can be installed **globally** (available system-wide) or **locally** (only available in the current project).

```bash
# Local install (recommended — goes into project's node_modules)
npm install @playwright/test --save-dev

# Global install (available from any directory)
npm install -g playwright
```

**Always prefer local installation for project dependencies.** Global installs create version conflicts — if Project A needs Playwright 1.40 and Project B needs Playwright 1.44, you cannot have both globally. Local installs are isolated per project.

The only things worth installing globally are version-agnostic utilities like `nvm`, `npx` itself, or `npm`.

### npm Registry

When you run `npm install`, npm downloads packages from the **npm registry** — a public database of open-source JavaScript packages hosted at `https://registry.npmjs.org`. Playwright, TypeScript, and all their dependencies are downloaded from here.

Some companies use a **private registry** (like Artifactory or Verdaccio) that proxies the public npm registry and adds internal private packages. If you are in a corporate environment and `npm install` fails with authentication errors, a private registry is likely the cause — ask your DevOps team for the registry URL and credentials.

```bash
# Check which registry npm is currently pointing to
npm config get registry

# Set a custom registry
npm config set registry https://your-company-registry.com

# Or use a specific registry for one install only
npm install some-package --registry https://your-company-registry.com
```

---

## 8. Scripts – Running Commands in a Project

The `"scripts"` section of `package.json` defines shortcut commands you can run with `npm run`. This is how teams standardise the commands everyone uses — instead of remembering long Playwright flags, you run `npm run test:smoke`.

### Defining Scripts

```json
"scripts": {
  "test": "playwright test",
  "test:headed": "playwright test --headed",
  "test:ui": "playwright test --ui",
  "test:smoke": "playwright test --grep @smoke",
  "test:regression": "playwright test --grep @regression",
  "test:chrome": "playwright test --project=chromium",
  "test:debug": "playwright test --debug",
  "report": "playwright show-report",
  "lint": "eslint tests/ pages/ helpers/ --ext .ts",
  "typecheck": "tsc --noEmit",
  "setup": "ts-node global-setup.ts"
}
```

### Running Scripts

```bash
# Run a script
npm run test
npm run test:headed
npm run test:smoke
npm run report

# Special case — 'test' and 'start' can be run without 'run'
npm test        # equivalent to npm run test
npm start       # equivalent to npm run start
```

### The PATH Advantage of npm Scripts

When npm runs a script, it temporarily adds `node_modules/.bin/` to the system PATH. This means inside a script you can write just `playwright test` instead of `./node_modules/.bin/playwright test`. Without npm scripts, you would need the full path or `npx` every time.

```json
"scripts": {
  "test": "playwright test"
  // npm knows to look in node_modules/.bin/ for 'playwright'
  // You don't need: "./node_modules/.bin/playwright test"
}
```

### Passing Extra Arguments to Scripts

```bash
# Pass additional flags after -- (double dash)
npm run test -- --headed
npm run test -- --grep "login"
npm run test -- tests/login.spec.ts
npm run test -- --project=firefox --headed

# These are equivalent to:
# playwright test --headed
# playwright test --grep "login"
# playwright test tests/login.spec.ts
# playwright test --project=firefox --headed
```

### Chaining Scripts

Scripts can run other scripts or chain commands:

```json
"scripts": {
  "setup": "ts-node global-setup.ts",
  "test": "playwright test",
  "test:full": "npm run setup && npm run test",
  "ci": "npm run typecheck && npm run lint && npm run test:full"
}
```

`&&` runs the next command only if the previous one succeeded. `&` runs both in parallel. `||` runs the next command only if the previous one failed.

### Pre and Post Hooks

npm automatically runs scripts named `pre<scriptname>` before and `post<scriptname>` after any script:

```json
"scripts": {
  "pretest": "tsc --noEmit",       ← runs before 'npm run test'
  "test": "playwright test",
  "posttest": "playwright show-report"  ← runs after 'npm run test'
}
```

This is useful for automatically type-checking before running tests or automatically opening the report after.

---

## 9. Environment Variables and .env Files

Environment variables are key-value pairs that exist in the operating system's environment and can be read by any running process. In Playwright projects they store values that change between environments or machines — base URLs, credentials, API keys, feature flags.

### Why Environment Variables Instead of Hardcoding

```ts
// ❌ Hardcoded — only works on staging, breaks in CI or production
await page.goto('https://staging.myapp.com/login');

// ✅ Environment variable — works anywhere
await page.goto(process.env.BASE_URL + '/login');
```

Hardcoding URLs and credentials creates three problems: you cannot run the same tests against different environments, credentials end up in source code (a security risk), and changing a URL requires editing test files instead of just changing a config value.

### How Node.js Reads Environment Variables

Node.js exposes all environment variables through the global `process.env` object:

```ts
// Read an environment variable
const baseURL = process.env.BASE_URL;

// With a fallback for local development
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

// Use in playwright.config.ts
export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
  }
});
```

### The .env File

A `.env` file is a plain text file that stores environment variables in a simple format. It lives in the root of your project and is loaded at runtime by the `dotenv` package.

```env
# .env — NOT committed to Git
BASE_URL=https://staging.myapp.com
TEST_USER_EMAIL=testuser@myapp.com
TEST_USER_PASSWORD=SecurePassword123
API_KEY=sk-1234567890abcdef
ENVIRONMENT=staging
```

**Install dotenv:**
```bash
npm install dotenv --save-dev
```

**Load `.env` in `playwright.config.ts`:**
```ts
import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

// Load .env file before anything else
dotenv.config();

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL,
  }
});
```

Once `dotenv.config()` is called, all variables from `.env` are available via `process.env` throughout the entire test run.

### The .env.example File

`.env.example` is a template file that **is** committed to Git. It lists all the variable names the project needs, with empty values or placeholder values — never real secrets:

```env
# .env.example — committed to Git, shows what variables are needed
BASE_URL=https://staging.myapp.com
TEST_USER_EMAIL=
TEST_USER_PASSWORD=
API_KEY=
```

When a new engineer joins the project, they:
1. See `.env.example` in the repository
2. Copy it: `cp .env.example .env` (macOS/Linux) or `copy .env.example .env` (Windows)
3. Fill in the real values (obtained from the team)

### Setting Environment Variables Without a .env File

Sometimes the project does not use `dotenv`. You set variables in the shell before running tests:

**macOS / Linux:**
```bash
export BASE_URL=https://staging.myapp.com
export TEST_USER_PASSWORD=mypassword
npm run test
```

**Windows PowerShell:**
```powershell
$env:BASE_URL = "https://staging.myapp.com"
$env:TEST_USER_PASSWORD = "mypassword"
npm run test
```

**Windows Command Prompt:**
```cmd
set BASE_URL=https://staging.myapp.com
set TEST_USER_PASSWORD=mypassword
npm run test
```

**Inline (all OS — applies only to that one command):**
```bash
BASE_URL=https://staging.myapp.com npm run test
```

> ⚠️ **Windows note:** The inline syntax (`VAR=value command`) does not work in PowerShell or cmd.exe natively — it only works in Git Bash or Unix-like shells. Use `$env:VAR = "value"` in PowerShell instead.

### What Gets Committed and What Does Not

| File | Committed to Git | Reason |
|---|---|---|
| `.env.example` | ✅ Yes | Template showing what variables are needed — no real values |
| `.env` | ❌ No | Contains real secrets — in `.gitignore` |
| `.env.local` | ❌ No | Local overrides — in `.gitignore` |
| `.env.staging` | ❌ No | Environment-specific values — in `.gitignore` |

---

## 10. TypeScript in a Node.js Project

Playwright projects are almost always written in TypeScript rather than plain JavaScript. TypeScript adds static typing on top of JavaScript — it catches errors before you run the code rather than at runtime.

### tsconfig.json – TypeScript Configuration

`tsconfig.json` tells the TypeScript compiler how to compile your code. Every TypeScript project needs one.

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
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["pages/*"],
      "@helpers/*": ["helpers/*"],
      "@fixtures/*": ["fixtures/*"]
    }
  },
  "include": [
    "tests/**/*.ts",
    "pages/**/*.ts",
    "helpers/**/*.ts",
    "fixtures/**/*.ts",
    "playwright.config.ts"
  ],
  "exclude": [
    "node_modules",
    "dist"
  ]
}
```

### Key tsconfig.json Fields for Playwright Projects

**`target`** — what JavaScript version to compile to. `ES2022` is modern and supported by current Node.js versions.

**`strict`** — enables all strict type checks. Catches common errors like accessing properties on potentially `null` or `undefined` values. Always set to `true` — it prevents real bugs in test code.

**`esModuleInterop`** — allows cleaner imports of CommonJS packages: `import dotenv from 'dotenv'` instead of `import * as dotenv from 'dotenv'`. Set to `true`.

**`moduleResolution: "node"`** — tells TypeScript to resolve modules the same way Node.js does. Required for most projects.

**`paths`** — defines import aliases. Instead of `../../helpers/auth`, you can write `@helpers/auth`. Makes imports cleaner as projects grow.

**`include`** — which files TypeScript should compile. Explicit is better — list your directories rather than relying on TypeScript to find everything.

**`exclude`** — which directories to skip. Always exclude `node_modules`.

### Running TypeScript

TypeScript files (`.ts`) must be compiled to JavaScript (`.js`) before Node.js can run them — or you use a tool that handles it on the fly.

```bash
# Compile TypeScript to JavaScript
npx tsc

# Type-check without producing output files
npx tsc --noEmit

# Run a TypeScript file directly without compiling first (development use)
npx ts-node script.ts

# Playwright handles TypeScript internally — no compilation step needed for tests
npx playwright test
```

Playwright has **built-in TypeScript support** — it compiles your `.ts` test files internally using `esbuild` when you run `npx playwright test`. You do not need to run `tsc` before running Playwright tests. This is why there is no "compile first" step in the test workflow.

### Type Checking vs Running

There is an important distinction:

- **`npx playwright test`** — compiles and runs your tests, but does NOT do full type checking. It uses a fast transpiler that strips types without verifying them.
- **`npx tsc --noEmit`** — does full type checking but does not run tests. Use this to catch type errors before pushing to GitHub.

A good CI pipeline runs both:
```bash
npx tsc --noEmit    # catch type errors
npx playwright test  # run tests
```

---

## 11. Project Structure for a Playwright Automation Project

A well-organised Playwright project follows a consistent structure that the whole team understands. Here is the structure and the reasoning behind each folder and file.

```
playwright-automation/
  │
  ├── tests/                     ← all test files
  │    ├── login.spec.ts
  │    ├── checkout.spec.ts
  │    └── smoke/
  │         └── homepage.spec.ts
  │
  ├── pages/                     ← Page Object Models
  │    ├── LoginPage.ts
  │    ├── CheckoutPage.ts
  │    └── BasePage.ts
  │
  ├── helpers/                   ← shared utility functions
  │    ├── auth.ts               ← login/logout helpers
  │    ├── api.ts                ← direct API call helpers
  │    └── date.ts               ← date formatting helpers
  │
  ├── fixtures/                  ← custom Playwright fixtures
  │    └── index.ts
  │
  ├── data/                      ← test data
  │    ├── users.json
  │    └── products.ts
  │
  ├── .github/
  │    └── workflows/
  │         └── playwright.yml   ← CI pipeline
  │
  ├── auth/                      ← storageState files (in .gitignore)
  │    ├── admin.json
  │    └── user.json
  │
  ├── test-results/              ← generated by Playwright (in .gitignore)
  ├── playwright-report/         ← generated HTML report (in .gitignore)
  ├── node_modules/              ← installed packages (in .gitignore)
  │
  ├── playwright.config.ts       ← Playwright configuration
  ├── global-setup.ts            ← runs once before all tests (auth setup)
  ├── tsconfig.json              ← TypeScript configuration
  ├── package.json               ← project definition and scripts
  ├── package-lock.json          ← exact dependency versions
  ├── .env                       ← environment variables (in .gitignore)
  ├── .env.example               ← template showing required variables
  └── .gitignore                 ← files Git should ignore
```

### What Each File Does

**`playwright.config.ts`** — the central configuration file for the entire test suite. Controls browsers, base URL, timeouts, retries, reporters, storage state, and parallel execution. This is the first file to read when joining a project.

**`global-setup.ts`** — runs once before any test in the suite. Used to generate `storageState` files (saved auth states) by logging in once and saving the session, so individual tests do not need to log in themselves.

**`tsconfig.json`** — TypeScript compiler configuration. Defines how `.ts` files are compiled, which files are included, and import path aliases.

**`.gitignore`** — tells Git which files and folders to never track. For a Playwright project:

```gitignore
node_modules/
test-results/
playwright-report/
blob-report/
.playwright/
auth/
.env
.env.local
.DS_Store
dist/
```

---

## 12. Common Problems and Root Causes

| Problem | Root Cause | Solution |
|---|---|---|
| `Cannot find module '@playwright/test'` | `node_modules` missing | Run `npm ci` |
| `npx playwright test` — command not found | Playwright not installed or `node_modules` deleted | Run `npm ci` then `npx playwright install` |
| Tests fail with `process.env.BASE_URL is undefined` | `.env` not created or `dotenv` not loaded | Copy `.env.example` to `.env`, fill in values, confirm `dotenv.config()` is called in `playwright.config.ts` |
| `npm ci` fails with "Missing: lockfile" | `package-lock.json` does not exist | Run `npm install` once to generate it, then commit it |
| `npm ci` fails with "package-lock.json out of date" | `package.json` changed but lock file not updated | Run `npm install` to sync them, then commit the updated lock file |
| TypeScript errors but tests still run | Playwright uses fast transpiler — does not do full type checking | Run `npx tsc --noEmit` separately to catch type errors |
| `node_modules` is huge — 500MB+ | Normal for Playwright projects | Do not commit it — it is in `.gitignore` by design |
| Version conflict between team members | `npm install` used instead of `npm ci` | Always use `npm ci` when joining or pulling latest; only use `npm install` when adding new packages |
| `Cannot use import statement` error | Module system mismatch (`import` used in CommonJS context) | Check `tsconfig.json` module setting; ensure `esModuleInterop: true` |
| `npm run test` says "Missing script: test" | Script not defined in `package.json` | Add the script to `package.json` `"scripts"` section |
| `npx playwright install` downloads wrong browser version | Multiple Playwright versions on the machine | Run `npx playwright install` inside the project folder where the correct version is in `node_modules` |
| `.env` values not loading | `dotenv.config()` not called before `process.env` is accessed | Call `dotenv.config()` at the very top of `playwright.config.ts` before `defineConfig()` |
| `error TS2304: Cannot find name 'require'` | `@types/node` not installed | Run `npm install @types/node --save-dev` |

---

## 13. Quick Reference Cheat Sheet

### Starting a New Project from Scratch

```bash
mkdir my-playwright-project
cd my-playwright-project
npm init -y
npm install @playwright/test typescript @types/node dotenv --save-dev
npx playwright install --with-deps
npx tsc --init                          # create tsconfig.json
```

### Joining an Existing Project

```bash
git clone git@github.com:org/repo.git
cd repo
npm ci                                  # install exact locked versions
npx playwright install --with-deps      # download browser binaries
cp .env.example .env                    # create env file (fill in values)
npx playwright test --headed            # verify setup works
```

### Package Management

```bash
npm ci                                  # install exact versions (joining/CI)
npm install                             # install from package.json (updating)
npm install package-name --save-dev     # add a new dev dependency
npm uninstall package-name              # remove a package
npm outdated                            # check for available updates
npm update                              # update within version ranges
npm list --depth=0                      # list installed top-level packages
```

### Running Tests via npm Scripts

```bash
npm run test                            # run all tests
npm run test:headed                     # visible browser
npm run test:ui                         # Playwright UI mode
npm run test:smoke                      # smoke tests only
npm run report                          # open HTML report
npm run typecheck                       # type check without running tests
npm run lint                            # check code quality
```

### Passing Extra Flags

```bash
npm run test -- --headed
npm run test -- --grep "login"
npm run test -- tests/login.spec.ts
npm run test -- --project=firefox
npm run test -- --debug
```

### Environment Variables

```bash
# macOS / Linux — set for session
export BASE_URL=https://staging.myapp.com

# Windows PowerShell — set for session
$env:BASE_URL = "https://staging.myapp.com"

# Inline — applies to one command only (macOS/Linux/Git Bash)
BASE_URL=https://staging.myapp.com npm run test
```

### Checking the Project

```bash
node --version                          # Node.js version
npm --version                           # npm version
npx playwright --version                # Playwright version
npm list --depth=0                      # all installed packages
cat package.json                        # read project config
cat .env.example                        # see required env variables
npx tsc --noEmit                        # type check all TypeScript files
```

### Summary — Key Files and Their Purpose

| File | Purpose | Committed to Git |
|---|---|---|
| `package.json` | Project definition, dependencies, scripts | ✅ Yes |
| `package-lock.json` | Exact locked dependency versions | ✅ Yes |
| `tsconfig.json` | TypeScript compiler configuration | ✅ Yes |
| `playwright.config.ts` | Playwright test configuration | ✅ Yes |
| `.env.example` | Template showing required env variables | ✅ Yes |
| `.env` | Real environment variable values | ❌ No — contains secrets |
| `node_modules/` | Downloaded packages | ❌ No — too large, OS-specific |
| `test-results/` | Playwright test output | ❌ No — generated at runtime |
| `playwright-report/` | HTML test report | ❌ No — generated at runtime |
| `auth/*.json` | Saved browser auth state | ❌ No — contains real session tokens |

> 📌 **Final Note:** A Node.js project is ultimately just a `package.json` file and the code around it. Everything else — `node_modules`, `test-results`, `playwright-report` — is generated and disposable. If something breaks, the fastest recovery is often: delete `node_modules`, run `npm ci`, run `npx playwright install --with-deps`, and try again. The project's real state is only in the files that are committed to Git.

---

*Reference: [Node.js Documentation](https://nodejs.org/docs) • [npm Documentation](https://docs.npmjs.com) • [TypeScript Documentation](https://www.typescriptlang.org/docs) • [Playwright Docs](https://playwright.dev/docs/intro)*
