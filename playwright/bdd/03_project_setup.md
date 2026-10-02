# 03 — Project Setup

## What You Need

To use Cucumber with Playwright you need three things:

1. A Playwright project (already set up with `npm init playwright`)
2. The Cucumber packages installed
3. A configuration file that tells Cucumber where to find your feature files and step definitions

---

## Install Packages

```bash
npm install --save-dev @cucumber/cucumber
npm install --save-dev @playwright/test
npm install --save-dev ts-node
npm install --save-dev @types/node
npm install --save-dev typescript
```

Or in one command:

```bash
npm install --save-dev @cucumber/cucumber @playwright/test ts-node @types/node typescript
```

`@cucumber/cucumber` is the official Cucumber runner. It works with Playwright directly —
no adapter or bridge package is needed. `ts-node` allows Cucumber to run TypeScript step
definitions without a separate compile step.

---

## Folder Structure

Create this folder structure in your project:

```
project-root/
├── features/                  ← feature files live here
│   ├── login.feature
│   ├── employee.feature
│   └── leave.feature
├── steps/                     ← step definitions live here
│   ├── login.steps.ts
│   ├── employee.steps.ts
│   └── common.steps.ts
├── support/                   ← world object and hooks live here
│   ├── world.ts
│   └── hooks.ts
├── pages/                     ← your existing POM classes
│   ├── LoginPage.ts
│   └── EmployeePage.ts
├── cucumber.json              ← Cucumber configuration
├── tsconfig.json
└── package.json
```

---

## cucumber.json — Configuration File

Create `cucumber.json` at the project root:

```json
{
  "default": {
    "require": [
      "support/world.ts",
      "support/hooks.ts",
      "steps/**/*.ts"
    ],
    "requireModule": [
      "ts-node/register"
    ],
    "format": [
      "progress-bar",
      "html:reports/cucumber-report.html",
      "json:reports/cucumber-report.json"
    ],
    "formatOptions": {
      "snippetInterface": "async-await"
    },
    "publishQuiet": true
  }
}
```

What each option does:

| Option | Purpose |
|---|---|
| `require` | Files to load before running tests — world, hooks, step definitions |
| `requireModule` | Enables TypeScript via `ts-node` |
| `format` | Output formats — progress in terminal, HTML and JSON reports |
| `formatOptions.snippetInterface` | Generated code snippets use async/await |
| `publishQuiet` | Suppresses the "publish your results" message |

---

## tsconfig.json — TypeScript Configuration

If you do not have one already, create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./",
    "baseUrl": ".",
    "paths": {
      "@pages/*": ["pages/*"],
      "@support/*": ["support/*"],
      "@steps/*": ["steps/*"]
    }
  },
  "include": [
    "features/**/*.ts",
    "steps/**/*.ts",
    "support/**/*.ts",
    "pages/**/*.ts"
  ]
}
```

---

## package.json — Add Test Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "test:bdd:smoke": "cucumber-js --tags @smoke",
    "test:bdd:regression": "cucumber-js --tags @regression",
    "test:bdd:report": "cucumber-js --format html:reports/cucumber-report.html"
  }
}
```

Run all BDD tests:
```bash
npm run test:bdd
```

Run only smoke tests:
```bash
npm run test:bdd:smoke
```

---

## Verify the Setup

Create a simple feature file to verify everything works.

`features/hello.feature`:
```gherkin
Feature: Setup verification

  Scenario: Cucumber is working
    Given the setup is complete
    Then Cucumber should run without errors
```

Create matching step definitions:

`steps/hello.steps.ts`:
```typescript
import { Given, Then } from '@cucumber/cucumber';

Given('the setup is complete', async function() {
  // nothing to do — just verifying the step runs
});

Then('Cucumber should run without errors', async function() {
  // nothing to do — if we reach here, it works
});
```

Run:
```bash
npm run test:bdd
```

You should see:
```
1 scenario (1 passed)
2 steps (2 passed)
```

---

## Playwright Browser Setup

Cucumber does not manage browsers — Playwright does. You need to launch a browser in a hook
and make it available to your steps via the World object. This is covered in detail in
`05_world_object.md` and `06_hooks.md`.

The short version: you launch a browser in `BeforeAll`, create a page in `Before`,
store them on `this` (the World), and close them in `After` and `AfterAll`.

```typescript
// support/hooks.ts — minimal example
import { Before, After, BeforeAll, AfterAll } from '@cucumber/cucumber';
import { chromium, Browser, Page } from '@playwright/test';

let browser: Browser;

BeforeAll(async function() {
  browser = await chromium.launch({ headless: true });
});

Before(async function() {
  const context = await browser.newContext();
  this.page = await context.newPage();
});

After(async function() {
  await this.page.close();
});

AfterAll(async function() {
  await browser.close();
});
```

---

## VS Code — Cucumber Extension

Install the **Cucumber (Gherkin) Full Support** extension by Alexander Krechik.

Search for it in the VS Code Extensions panel:
```
Cucumber (Gherkin) Full Support
```

Or install via the command line:
```bash
code --install-extension alexkrechik.cucumberautocomplete
```

### What it does

- **Autocomplete in feature files** — as you type a step, VS Code suggests matching step definitions from your `steps/` folder
- **Highlights undefined steps** — steps with no matching step definition are underlined in red
- **Go to definition** — `Ctrl + click` (or `F12`) on any Gherkin step jumps directly to the matching step definition in TypeScript
- **Step usage** — right-click a step definition and select "Find All References" to see every feature file that uses it

### Configure the extension

Add this to your VS Code `settings.json` (workspace settings):

```json
{
  "cucumberautocomplete.steps": [
    "steps/**/*.ts"
  ],
  "cucumberautocomplete.syncfeatures": "features/**/*.feature",
  "cucumberautocomplete.strictGherkinCompletion": true
}
```

`cucumberautocomplete.steps` tells the extension where to find your step definitions.
`cucumberautocomplete.syncfeatures` tells it where your feature files are.

Without this config, the extension will not find your step definitions and autocomplete
will not work.

---

## Installed Packages Summary

| Package | Purpose |
|---|---|
| `@cucumber/cucumber` | BDD test runner — reads feature files and runs step definitions |
| `@playwright/test` | Browser automation |
| `ts-node` | Runs TypeScript without compiling first |
| `typescript` | TypeScript language support |
| `@types/node` | Node.js type definitions for TypeScript |

---

## Summary

- Install `@cucumber/cucumber`, `@playwright/test`, and `ts-node` — no Cypress adapter needed
- Create the `features/`, `steps/`, and `support/` folders
- Create `cucumber.json` to tell Cucumber where to find files
- Add scripts to `package.json` for running tests
- Install the **Cucumber (Gherkin) Full Support** VS Code extension and configure `settings.json`
- Verify with a simple hello-world feature file
- Browser lifecycle is managed via hooks — covered in `06_hooks.md`

Next: [04 — Step Definitions](./04_step_definitions.md)
