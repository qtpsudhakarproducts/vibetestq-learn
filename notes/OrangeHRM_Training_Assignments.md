# OrangeHRM Automation – Complete Training Assignments
### Project-Based Training Plan with Playwright + TypeScript

---

## Training Overview

**Project:** OrangeHRM (https://opensource-demo.orangehrmlive.com)
**Default Credentials:** Admin / admin123
**Stack:** Playwright + TypeScript + Node.js + Git + GitHub

### Why OrangeHRM

OrangeHRM is a real-world HR management application with:
- Authentication with role-based access (Admin, ESS User)
- Multiple modules — Employee, Leave, Recruitment, Admin, Time, Performance
- A full REST API alongside the UI
- Enough complexity to cover every real-world automation pattern
- A stable demo environment suitable for training

### Training Philosophy

The goal is not just to write tests — it is to build a **production-grade automation framework** that mirrors what professional teams use in the real world. By the end of this training, the repository built around OrangeHRM will be a portfolio piece that demonstrates real engineering skill.

**Students already know:**
- JavaScript and TypeScript fundamentals
- Playwright basics — locators, elements, pages, frames, windows, alerts
- How to write automation code and automate a functionality

**What this training adds:**
- Professional project structure and framework design
- Version control and team collaboration workflows
- Real-world patterns — POM, data driven testing, BDD, hybrid testing
- CI/CD integration and automated pipeline execution
- Centralised reporting and test analytics
- Scalable parallel execution
- AI-assisted automation practices

---

## Table of Contents

1. [Module 1 — Git and GitHub](#module-1--git-and-github)
2. [Module 2 — Node.js Project Setup](#module-2--nodejs-project-setup)
3. [Module 3 — Playwright Configuration](#module-3--playwright-configuration)
4. [Module 4 — Playwright Framework Features](#module-4--playwright-framework-features)
5. [Module 5 — Page Object Model](#module-5--page-object-model)
6. [Module 6 — Writing Tests Using POM](#module-6--writing-tests-using-pom)
7. [Module 7 — Debugging POM Tests](#module-7--debugging-pom-tests)
8. [Module 8 — HTML Reports](#module-8--html-reports)
9. [Module 9 — Data Driven Testing](#module-9--data-driven-testing)
10. [Module 10 — BDD with Cucumber](#module-10--bdd-with-cucumber)
11. [Module 11 — API Testing](#module-11--api-testing)
12. [Module 12 — Hybrid Tests (API + UI)](#module-12--hybrid-tests-api--ui)
13. [Module 13 — CI/CD with GitHub Actions and Docker](#module-13--cicd-with-github-actions-and-docker)
14. [Module 14 — Report Portal Integration](#module-14--report-portal-integration)
15. [Module 15 — Parallel and Distributed Execution](#module-15--parallel-and-distributed-execution)
16. [Module 16 — AI in Test Automation](#module-16--ai-in-test-automation)
17. [Final Capstone Project](#final-capstone-project)

---

## Module 1 — Git and GitHub

### Learning Objectives
- Understand version control and why it matters in a team
- Set up Git on a local machine (Windows, macOS, Linux)
- Authenticate with GitHub using SSH
- Follow the feature branch workflow used by professional teams
- Work with Pull Requests and code review
- Understand rebasing vs merging
- Use Git history tools confidently

---

### Assignment 1.1 — Machine Setup and First Repository

**Objective:** Set up Git, configure identity, authenticate with GitHub, and create the project repository.

**Tasks:**
- Install Git on your local machine (Windows / macOS / Linux — use the appropriate method for your OS)
- Configure Git identity:
  ```bash
  git config --global user.name "Your Full Name"
  git config --global user.email "your-github-email@example.com"
  ```
- Configure line endings (Windows only): `git config --global core.autocrlf true`
- Set VS Code as the default Git editor: `git config --global core.editor "code --wait"`
- Set default branch name: `git config --global init.defaultBranch main`
- Generate an SSH key pair on your local machine: `ssh-keygen -t ed25519 -C "your-email@example.com"`
- Add the SSH key to the SSH agent (OS-specific steps)
- Copy the public key and add it to GitHub → Settings → SSH and GPG Keys
- Test the connection: `ssh -T git@github.com`
- Create a new **private** repository on GitHub called `orangehrm-automation`
- Clone the repository to your local machine using the SSH URL
- Create a `README.md` with a project description
- Create a `.gitignore` with all correct entries for a Playwright project
- Commit both files with a meaningful commit message
- Push to `origin/main`

**Verification:**
- `git log --oneline` — should show your first commit
- `git remote -v` — should show the SSH URL
- Visit the repository on GitHub — README and .gitignore should be visible

---

### Assignment 1.2 — Feature Branch Workflow

**Objective:** Practise the complete day-to-day Git workflow used in professional teams.

**Tasks:**
- Pull latest `main`: `git pull origin main`
- Create a branch: `git checkout -b feature/initial-project-structure`
- Create the following empty folders with a `.gitkeep` file in each: `tests/`, `pages/`, `helpers/`, `fixtures/`, `data/`, `auth/`
- Stage and commit: `git add . && git commit -m "Add initial project folder structure"`
- Push the branch: `git push -u origin feature/initial-project-structure`
- Go to GitHub and open a Pull Request — write a meaningful PR description
- Merge the PR
- Switch back to `main` and pull: `git checkout main && git pull origin main`
- Delete the local feature branch: `git branch -d feature/initial-project-structure`

**Repeat this workflow** for at least 3 more branches covering small changes to different files. Each must have its own PR.

**Verification:**
- `git log --oneline --graph` — shows merge commits for all branches
- GitHub Pull Requests tab shows all PRs as merged

---

### Assignment 1.3 — Commit Best Practices

**Objective:** Write professional commit messages and understand atomic commits.

**Tasks:**
- Read the conventional commit message format — imperative mood, max 72 chars, present tense
- Make 5 commits with well-structured messages using the format:
  ```
  Add login page tests for invalid credential scenarios

  - Test empty username returns 'Required' validation
  - Test empty password returns 'Required' validation
  - Test wrong password shows 'Invalid credentials' error

  Closes #12
  ```
- Make 3 intentionally bad commits (vague messages, too many changes in one commit)
- Amend the last bad commit: `git commit --amend -m "Better message"`
- Use `git log --oneline` to compare good vs bad commit history
- Use interactive rebase to squash the remaining 2 bad commits into one clean commit:
  ```bash
  git rebase -i HEAD~3
  ```
- Verify the cleaned history with `git log --oneline`

**Key Learning:**
- One commit = one logical change
- The commit message explains WHY, the diff shows WHAT
- Future team members (including you in 6 months) will thank you

---

### Assignment 1.4 — Handling Merge Conflicts

**Objective:** Understand and resolve a merge conflict — one of the most common real-world Git problems.

**Tasks:**
- Create branch A: `git checkout -b branch-a`
- Edit `README.md` — change the description line to "Version A description"
- Add a new line in `README.md` on branch A: "Branch A added this"
- Commit on branch A
- Switch to `main` and create branch B: `git checkout main && git checkout -b branch-b`
- Edit the same description line in `README.md` — "Version B description"
- Add a different new line: "Branch B added this"
- Commit on branch B
- Merge branch A into `main`: `git checkout main && git merge branch-a`
- Now merge branch B into `main`: `git merge branch-b` — conflict appears
- Open the conflicted file, resolve it — keep both new lines, use B's description
- Stage and complete the merge: `git add README.md && git commit`
- View the result: `git log --oneline --graph`

**Verification:**
- `README.md` has the resolved content with both new lines
- `git log --oneline --graph` shows a merge commit with two parent lines

---

### Assignment 1.5 — Rebase Workflow

**Objective:** Understand rebasing and when to use it instead of merging.

**Tasks:**
- Create branch `feature/rebase-practice` from `main`
- Make 2 commits on the branch (small changes to any file)
- Meanwhile make 1 commit on `main` (simulate a teammate's commit)
- Now rebase the feature branch onto main:
  ```bash
  git checkout feature/rebase-practice
  git rebase main
  ```
- View `git log --oneline --graph` — notice the linear history vs merge commit
- Push the rebased branch: `git push --force-with-lease origin feature/rebase-practice`
- Open a PR and verify the PR diff is clean (no merge commits)

**Compare:**
- Create a second branch `feature/merge-practice` from the same point
- Make the same 2 commits
- This time merge main into the branch: `git merge main`
- View `git log --oneline --graph` — compare the graph with the rebase version
- Answer in a comment: which produces cleaner history? When should you rebase vs merge?

---

### Assignment 1.6 — Git Recovery Scenarios

**Objective:** Practise recovering from common Git mistakes without panicking.

**Scenario 1 — Undo last commit (not pushed):**
- Make a commit with a typo in the message
- Fix it: `git commit --amend -m "Correct message"`
- Verify with `git log --oneline`

**Scenario 2 — Unstage a file:**
- Stage two files accidentally
- Unstage one: `git restore --staged filename`
- Verify `git status`

**Scenario 3 — Discard working directory changes:**
- Edit a file, then decide to throw away changes
- Restore: `git restore filename.ts`
- Verify the file reverted

**Scenario 4 — Stash and restore:**
- Start editing a test file without committing
- Urgently switch to fix something on another branch
- Stash: `git stash push -m "WIP: login tests"`
- Fix and come back — restore: `git stash pop`
- List stashes: `git stash list`

**Scenario 5 — Recover a deleted branch:**
- Create a branch, commit, delete: `git branch -D my-branch`
- Find it in reflog: `git reflog`
- Recover: `git checkout -b recovered <hash>`

**Scenario 6 — Revert a pushed commit:**
- Push a commit you want to undo
- Safely revert without rewriting history: `git revert HEAD`
- Push the revert commit — verify the original commit still exists in history

**Scenario 7 — Reset to a previous commit:**
- Make 3 test commits on a local branch (not pushed)
- Reset to 2 commits ago keeping changes: `git reset HEAD~2`
- Verify files are unstaged but not deleted
- Reset hard to discard all changes: `git reset --hard HEAD~1` (from clean state)

---

### Assignment 1.7 — GitHub Collaboration Features

**Objective:** Use GitHub's collaboration tools the way a professional team does.

**Tasks:**
- Enable **branch protection** on `main`:
  - Go to Settings → Branches → Add Rule for `main`
  - Enable: "Require pull request before merging"
  - Enable: "Require status checks to pass"
  - Enable: "Require at least 1 approval"
- Attempt to push directly to `main` — verify it is rejected
- Create a PR and try to merge without approval — verify it is blocked
- Open a PR and add a review comment on a specific line of code (use your own PR)
- Use the **Suggestion** feature in a review comment:
  ```
  ```suggestion
  await page.getByRole('button', { name: 'Save' }).click();
  ```
  ```
- Accept the suggestion directly from the GitHub UI — verify the commit is added
- Use GitHub's **Compare** view to diff two branches
- Use **Blame** view on a file — understand who changed each line and when
- Archive an old branch on GitHub after merging

---

## Module 2 — Node.js Project Setup

### Learning Objectives
- Understand what a Node.js project is and how it is structured
- Read and write `package.json` confidently
- Understand `dependencies` vs `devDependencies`
- Use `npm ci` vs `npm install` correctly
- Set up environment variables with `.env` and `dotenv`
- Understand `package-lock.json` and why it matters

---

### Assignment 2.1 — Initialise the Project

**Objective:** Transform the cloned repository into a fully configured Node.js project.

**Tasks:**
- Navigate into the cloned `orangehrm-automation` folder
- Run `npm init -y` to create `package.json`
- Install all required dev dependencies:
  ```bash
  npm install @playwright/test typescript @types/node dotenv --save-dev
  ```
- Run `npx playwright install --with-deps`
- Manually edit `package.json` to add:
  - `"private": true`
  - `"description": "OrangeHRM E2E Automation Framework"`
  - `"engines": { "node": ">=18.0.0" }`
- Verify `package-lock.json` was created
- Verify `node_modules/@playwright` folder exists
- Commit `package.json` and `package-lock.json` — verify `node_modules` is NOT in the diff

**Verification:**
- `npm list --depth=0` shows all installed packages
- `npx playwright --version` returns a version number

---

### Assignment 2.2 — Configure TypeScript

**Objective:** Set up TypeScript correctly for a Playwright project.

**Tasks:**
- Create `tsconfig.json`:
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
      "playwright.config.ts",
      "global-setup.ts"
    ],
    "exclude": ["node_modules", "dist", "test-results", "playwright-report"]
  }
  ```
- Run `npx tsc --noEmit` — verify no errors
- Create a temporary test file that uses the `@pages/*` alias — verify TypeScript resolves it
- Delete the temp file and run `npx tsc --noEmit` again — verify it still passes

---

### Assignment 2.3 — npm Scripts

**Objective:** Build a complete and useful scripts section.

**Tasks:**
- Add all scripts to `package.json`:
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
- Verify each script runs without error (use placeholder tests where needed)
- Demonstrate passing extra args: `npm run test -- --grep "login" --headed`

---

### Assignment 2.4 — Environment Variables

**Objective:** Set up a professional environment variable system.

**Tasks:**
- Create `.env.example`:
  ```env
  BASE_URL=https://opensource-demo.orangehrmlive.com
  ADMIN_USERNAME=
  ADMIN_PASSWORD=
  ESS_USERNAME=
  ESS_PASSWORD=
  ENVIRONMENT=staging
  RP_API_KEY=
  RP_PROJECT=orangehrm-automation
  ```
- Create `.env` with real values — verify it is in `.gitignore`
- Create `helpers/env.ts`:
  ```ts
  import dotenv from 'dotenv';
  dotenv.config();

  export const ENV = {
    BASE_URL: process.env.BASE_URL ?? 'https://opensource-demo.orangehrmlive.com',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME ?? 'Admin',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD ?? 'admin123',
    ESS_USERNAME: process.env.ESS_USERNAME ?? '',
    ESS_PASSWORD: process.env.ESS_PASSWORD ?? '',
    ENVIRONMENT: process.env.ENVIRONMENT ?? 'staging',
    IS_CI: !!process.env.CI,
  };
  ```
- Write `helpers/verify-env.ts` that checks all required variables are set and throws a clear error if any are missing
- Run it: `npx ts-node helpers/verify-env.ts`

---

### Assignment 2.5 — Understanding package-lock.json

**Objective:** Deeply understand what `package-lock.json` does and why it matters.

**Tasks:**
- Open `package-lock.json` — find the exact installed version of `@playwright/test`
- Compare it to the version range in `package.json` — note the difference
- Delete `node_modules` and run `npm ci` — verify exact same versions reinstall
- Run `npm install @playwright/test@latest --save-dev` to get a newer version
- Run `git diff package-lock.json` — observe the changes
- Revert: `git restore package-lock.json && npm ci`
- Run `npm outdated` — see which packages have newer versions available

**Reflection (write in README.md):**
- What is the difference between `npm install` and `npm ci`?
- Why must `package-lock.json` be committed to Git?
- When should you run `npm install` vs `npm ci`?
- What happens when two team members have different versions of a package?

---

### Assignment 2.6 — Project Onboarding Simulation

**Objective:** Simulate what a new engineer does when joining the project.

**Tasks:**
- Delete your entire `node_modules` folder and `auth/` folder
- Pretend you are a new engineer who just cloned the repository
- Follow only the README instructions to set up and run the tests
- If any step fails or is unclear, update the README to fix it
- Time how long it takes from `git clone` to `npx playwright test` running successfully
- The target is under 10 minutes for any engineer on any OS

---

## Module 3 — Playwright Configuration

### Learning Objectives
- Understand every section of `playwright.config.ts`
- Configure multiple browser projects
- Set up `globalSetup` and `globalTeardown`
- Configure reporters, screenshots, videos and traces
- Use environment variables in configuration
- Understand project dependencies and filtering

---

### Assignment 3.1 — Basic Playwright Configuration

**Objective:** Create a well-structured `playwright.config.ts` from scratch.

**Tasks:**
- Create `playwright.config.ts` with:
  - `baseURL` loaded from `ENV.BASE_URL`
  - `testDir: './tests'`
  - `timeout: 30000`
  - `expect.timeout: 5000`
  - `retries: ENV.IS_CI ? 1 : 0`
  - `workers: ENV.IS_CI ? 2 : undefined`
  - `fullyParallel: false` initially
  - Three projects: `chromium`, `firefox`, `webkit`
  - A `smoke` project using only Chromium
  - `use` block: `headless: true`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'retain-on-failure'`, `actionTimeout: 10000`, `navigationTimeout: 15000`
  - HTML reporter with `open: 'never'`
- Verify each project runs independently with `--project=chromium`, `--project=firefox`

---

### Assignment 3.2 — Global Setup and Auth State

**Objective:** Configure authentication state so tests never repeat the login flow.

**Tasks:**
- Create `global-setup.ts` that:
  - Launches a browser using Playwright's `chromium.launch()`
  - Logs in as admin and saves `auth/admin.json`
  - Logs in as an ESS user and saves `auth/ess-user.json`
  - Logs in as a second ESS user and saves `auth/ess-user2.json`
  - Closes the browser
- Add `globalSetup: './global-setup.ts'` and `globalTeardown: './global-teardown.ts'` to config
- Create `global-teardown.ts` that deletes any employees created with a `TEST_` prefix name (cleanup)
- Configure projects:
  - `admin-tests` — loads `auth/admin.json`
  - `ess-tests` — loads `auth/ess-user.json`
- Write verification tests that assert the correct user is logged in for each project
- Add `auth/` to `.gitignore`

---

### Assignment 3.3 — Project Dependencies

**Objective:** Use Playwright's project dependencies to chain setup and test projects.

**Tasks:**
- Configure a `setup` project that runs `global-setup.ts` as a test:
  ```ts
  {
    name: 'setup',
    testMatch: /global.setup\.ts/,
  },
  {
    name: 'admin-tests',
    dependencies: ['setup'],
    use: { storageState: 'auth/admin.json' }
  }
  ```
- This way `setup` always runs before `admin-tests` in `--project=admin-tests`
- Verify the order: setup → admin tests → teardown
- Compare this approach with `globalSetup` — understand when each is better

---

### Assignment 3.4 — Reporters and Artefacts

**Objective:** Configure multiple reporters and understand each format.

**Tasks:**
- Configure three reporters simultaneously:
  ```ts
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['list'],
    ['dot']
  ]
  ```
- Run the suite with intentional failures in 2–3 tests
- Open HTML report — navigate failed tests, view screenshots, open traces
- Open `results.xml` — identify `testcase`, `failure`, `system-out` elements
- Temporarily set `trace: 'on'` — run one test and open the trace:
  ```bash
  npx playwright show-trace test-results/trace.zip
  ```
- Explore the trace: DOM snapshots, network requests, console logs, screenshots at each step
- Set trace back to `'retain-on-failure'`

---

### Assignment 3.5 — Multiple Config Files

**Objective:** Manage different configurations for different purposes.

**Tasks:**
- Create three config files:
  - `playwright.config.ts` — default, used for normal test runs
  - `playwright.config.ci.ts` — CI-specific: no headed, workers=4, retries=2, all reporters
  - `playwright.config.debug.ts` — debug: workers=1, headed, timeout=120000, trace='on'
- Add npm scripts:
  ```json
  "test:ci": "playwright test --config=playwright.config.ci.ts",
  "test:debug-config": "playwright test --config=playwright.config.debug.ts"
  ```
- Run all three and compare output format and timing

---

## Module 4 — Playwright Framework Features

### Learning Objectives
- Use all built-in fixtures and create custom ones
- Master all test lifecycle hooks
- Use every test annotation type correctly
- Write assertions confidently with auto-retry and soft assertions
- Use `test.step` for structured, readable tests
- Control timeouts at every level
- Handle network requests — intercept, mock and inspect
- Work with multiple pages, contexts and browser instances
- Use `page.evaluate` and `page.exposeFunction`
- Handle file uploads and downloads
- Work with dialogs — alert, confirm, prompt
- Use the `request` fixture for in-test API calls
- Understand worker fixtures vs test fixtures

---

### Assignment 4.1 — Built-in Fixtures

**Objective:** Understand and use all Playwright built-in fixtures.

**Tasks:**

**`page` fixture:**
- Navigate to OrangeHRM and verify the title with `expect(page).toHaveTitle('OrangeHRM')`
- Listen to console events: `page.on('console', msg => console.log(msg.text()))`
- Listen to page errors: `page.on('pageerror', err => console.log(err.message))`

**`context` fixture:**
- Create a second page in the same context: `const page2 = await context.newPage()`
- Log in on page1 — verify page2 also has the session (same cookies)
- Open a new page from a link click — capture it with `context.waitForEvent('page')`

**`browser` fixture:**
- Create two completely separate contexts — admin and ESS user
- Verify each context has independent sessions (log in on one, the other is not logged in)
- Verify cookies do not bleed between contexts

**`request` fixture:**
- Make a GET request to `/api/v2/pim/employees` using `request.get()`
- Log the status code and response body
- Make an authenticated POST request to create an employee

**`browserName` fixture:**
- Write a test that skips on Firefox: `test.skip(browserName === 'firefox', 'Skip on Firefox')`
- Write a test that runs different code per browser:
  ```ts
  test('browser-specific', async ({ page, browserName }) => {
    if (browserName === 'webkit') {
      // Safari-specific steps
    } else {
      // Other browsers
    }
  });
  ```

---

### Assignment 4.2 — Custom Fixtures

**Objective:** Build a complete custom fixture layer for the OrangeHRM framework.

**Tasks:**
- Create `fixtures/pages.fixture.ts` providing all page objects as fixtures:
  ```ts
  import { test as base } from '@playwright/test';
  import { LoginPage } from '@pages/LoginPage';
  import { DashboardPage } from '@pages/DashboardPage';
  import { EmployeeListPage } from '@pages/EmployeeListPage';
  import { AddEmployeePage } from '@pages/AddEmployeePage';
  import { LeaveListPage } from '@pages/LeaveListPage';
  import { AdminPage } from '@pages/AdminPage';

  type PageFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    employeeListPage: EmployeeListPage;
    addEmployeePage: AddEmployeePage;
    leaveListPage: LeaveListPage;
    adminPage: AdminPage;
  };

  export const test = base.extend<PageFixtures>({
    loginPage: async ({ page }, use) => use(new LoginPage(page)),
    dashboardPage: async ({ page }, use) => {
      const p = new DashboardPage(page);
      await p.navigate();
      await use(p);
    },
    employeeListPage: async ({ page }, use) => use(new EmployeeListPage(page)),
    addEmployeePage: async ({ page }, use) => use(new AddEmployeePage(page)),
    leaveListPage: async ({ page }, use) => use(new LeaveListPage(page)),
    adminPage: async ({ page }, use) => use(new AdminPage(page)),
  });

  export { expect } from '@playwright/test';
  ```
- Create `fixtures/api.fixture.ts` providing an authenticated `ApiClient`:
  ```ts
  type ApiFixtures = {
    apiClient: ApiClient;
  };

  export const test = base.extend<ApiFixtures>({
    apiClient: async ({ request }, use) => {
      const client = new ApiClient(request);
      await client.authenticate(ENV.ADMIN_USERNAME, ENV.ADMIN_PASSWORD);
      await use(client);
    }
  });
  ```
- Create `fixtures/index.ts` that merges all fixture sets:
  ```ts
  import { mergeTests } from '@playwright/test';
  import { test as pageTest } from './pages.fixture';
  import { test as apiTest } from './api.fixture';

  export const test = mergeTests(pageTest, apiTest);
  export { expect } from '@playwright/test';
  ```
- Rewrite 5 existing tests to use the merged fixtures — verify test code is minimal

---

### Assignment 4.3 — Worker Fixtures vs Test Fixtures

**Objective:** Understand the difference between worker-scoped and test-scoped fixtures.

**Tasks:**
- Create a worker-scoped fixture for the authenticated API client (shared across all tests in the worker):
  ```ts
  type WorkerFixtures = {
    sharedApiClient: ApiClient;
  };

  export const test = base.extend<{}, WorkerFixtures>({
    sharedApiClient: [async ({ playwright }, use) => {
      const request = await playwright.request.newContext({ baseURL: ENV.BASE_URL });
      const client = new ApiClient(request);
      await client.authenticate(ENV.ADMIN_USERNAME, ENV.ADMIN_PASSWORD);
      await use(client);
      await request.dispose();
    }, { scope: 'worker' }]
  });
  ```
- Write tests that use `sharedApiClient` for setup and teardown
- Add `console.log` to see that authentication happens ONCE per worker, not once per test
- Compare: a test-scoped `apiClient` fixture (new auth per test) vs worker-scoped (one auth per worker)
- Measure the time difference across 10 tests

---

### Assignment 4.4 — Test Hooks and Lifecycle

**Objective:** Use all test hooks correctly and understand their scope.

**Tasks:**
- Write a test file with all four hooks and `console.log` in each to observe order:
  ```ts
  test.beforeAll(async () => console.log('BEFORE ALL'));
  test.afterAll(async () => console.log('AFTER ALL'));
  test.beforeEach(async () => console.log('BEFORE EACH'));
  test.afterEach(async ({ page }, testInfo) => {
    console.log(`AFTER EACH — Test: ${testInfo.title} — Status: ${testInfo.status}`);
    if (testInfo.status === 'failed') {
      await page.screenshot({ path: `screenshots/${testInfo.title}.png` });
    }
  });
  ```
- Verify hooks run in the correct order: `beforeAll` → `beforeEach` → test → `afterEach` → `beforeEach` → test → `afterEach` → `afterAll`
- Demonstrate `afterAll` runs even when a test fails — introduce a forced failure
- Use `testInfo.status` in `afterEach` to only take screenshots on failure
- Create nested `describe` blocks and verify inner hooks run after outer hooks
- Use `test.use()` inside a `describe` block to change a fixture for that group only:
  ```ts
  test.describe('Admin tests', () => {
    test.use({ storageState: 'auth/admin.json' });
    // tests here start authenticated as admin
  });
  ```

---

### Assignment 4.5 — Test Annotations and Tags

**Objective:** Use every annotation type in a real scenario.

**Tasks:**
- Tag all existing tests appropriately:
  - `@smoke` — login, dashboard, basic employee search
  - `@regression` — all detailed scenarios
  - `@api` — API-only tests
  - `@ui` — UI-only tests
  - `@hybrid` — hybrid API+UI tests

- Write `tests/annotations-demo.spec.ts` demonstrating:
  ```ts
  // Skip — not implemented yet
  test.skip('Recruitment module tests', async ({ page }) => {
    // TODO: implement when recruitment POM is ready
  });

  // Fixme — known bug, do not run
  test.fixme('Leave balance not updating — OHR-123', async ({ page }) => {
    // fails due to a bug in the application
  });

  // Fail — expected to fail, considered passing if it does fail
  test('Login with 100 char username fails', async ({ page }) => {
    test.fail();
    await loginPage.login('A'.repeat(100), 'admin123');
    await expect(page).toHaveURL(/.*dashboard/); // this will fail, test passes
  });

  // Slow — triple the configured timeout
  test('Full employee lifecycle — slow', async ({ page }) => {
    test.slow();
    // create, update, search, delete
  });

  // Conditional skip based on environment
  test('Only runs on staging environment', async ({ page }) => {
    test.skip(ENV.ENVIRONMENT !== 'staging', 'This test only applies to staging');
    // staging-specific test
  });

  // Skip based on browser
  test('Chrome-only feature', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'Chrome-only');
    // chromium-specific
  });
  ```

- Run filtered sets:
  ```bash
  npx playwright test --grep @smoke
  npx playwright test --grep @regression
  npx playwright test --grep-invert @api         # everything except API tests
  npx playwright test --grep "@smoke|@regression" # smoke OR regression
  ```

---

### Assignment 4.6 — Assertions Deep Dive

**Objective:** Use every type of Playwright assertion in OrangeHRM context.

**Tasks:**

**Page assertions:**
```ts
await expect(page).toHaveURL(/.*dashboard/);
await expect(page).toHaveURL('https://opensource-demo.orangehrmlive.com/web/index.php/dashboard/index');
await expect(page).toHaveTitle('OrangeHRM');
```

**Locator assertions — visibility and state:**
```ts
await expect(locator).toBeVisible();
await expect(locator).toBeHidden();
await expect(locator).toBeEnabled();
await expect(locator).toBeDisabled();
await expect(locator).toBeChecked();
await expect(locator).toBeFocused();
await expect(locator).toBeEmpty();
await expect(locator).toBeAttached();
```

**Locator assertions — content:**
```ts
await expect(locator).toHaveText('Welcome Admin');
await expect(locator).toHaveText(/Welcome/);
await expect(locator).toContainText('Admin');
await expect(locator).toHaveValue('Admin');
await expect(locator).toHaveValues(['Option 1', 'Option 2']);
await expect(locator).toHaveAttribute('type', 'submit');
await expect(locator).toHaveClass(/active/);
await expect(locator).toHaveCSS('color', 'rgb(255, 0, 0)');
await expect(locator).toHaveId('main-content');
await expect(locator).toHaveCount(5);
```

**Screenshot assertions:**
```ts
// Visual regression testing
await expect(page).toHaveScreenshot('dashboard.png');
await expect(locator).toHaveScreenshot('login-button.png', { threshold: 0.1 });
```

**Soft assertions — all run even if one fails:**
```ts
await expect.soft(page).toHaveURL(/.*dashboard/);
await expect.soft(page).toHaveTitle('OrangeHRM');
await expect.soft(locator).toHaveText('Welcome Admin');
// Even if first assertion fails, all three run
// Check at the end:
expect(test.info().errors).toHaveLength(0);
```

**Custom assertion messages:**
```ts
await expect(loginButton, 'Login button should be visible before attempting login').toBeVisible();
await expect(dashboardHeading, `Dashboard heading should show after login as ${username}`).toBeVisible();
```

**Non-locator assertions (immediate, no retry):**
```ts
expect(response.status()).toBe(200);
expect(employees.length).toBeGreaterThan(0);
expect(employeeName).toBe('John Smith');
expect(list).toContain('Alice Johnson');
expect(obj).toMatchObject({ firstName: 'John', lastName: 'Smith' });
```

Write one test for each category above using OrangeHRM elements.

---

### Assignment 4.7 — test.step for Structured Tests

**Objective:** Use `test.step` to organise complex tests and produce clear reports.

**Tasks:**
- Rewrite the "Add and verify employee" test using steps:
  ```ts
  test('Add new employee and verify in list @smoke', async ({ page, addEmployeePage, employeeListPage }) => {
    const employeeName = `Test Employee ${Date.now()}`;

    await test.step('Navigate to Add Employee page', async () => {
      await addEmployeePage.navigate();
    });

    await test.step('Fill in employee details', async () => {
      await addEmployeePage.fillFirstName('Test');
      await addEmployeePage.fillLastName(`Employee ${Date.now()}`);
    });

    await test.step('Save the employee', async () => {
      await addEmployeePage.save();
      await addEmployeePage.verifySuccessfullySaved();
    });

    await test.step('Search for employee in list', async () => {
      await employeeListPage.navigate();
      await employeeListPage.searchByName(employeeName);
    });

    await test.step('Verify employee appears in results', async () => {
      await employeeListPage.verifyEmployeeExists(employeeName);
    });
  });
  ```
- Create nested steps where useful:
  ```ts
  await test.step('Complete login flow', async () => {
    await test.step('Enter credentials', async () => { ... });
    await test.step('Submit form', async () => { ... });
    await test.step('Verify redirect', async () => { ... });
  });
  ```
- Run the test and open the HTML report — verify each step appears as a collapsible item with timing
- Open the trace — verify each step has its own DOM snapshot

---

### Assignment 4.8 — Timeouts — All Levels

**Objective:** Understand and control timeouts at every level of Playwright.

**Tasks:**
- Map the full timeout hierarchy:
  ```
  playwright.config.ts
    └── timeout: 30000           (global test timeout)
         └── actionTimeout: 10000    (per action — click, fill, etc.)
              └── navigationTimeout: 15000  (page.goto, page.waitForURL)
                   └── expect.timeout: 5000  (assertion auto-retry timeout)
  ```

- Write tests demonstrating each level:
  ```ts
  // Override test timeout for a single test
  test('slow test', async ({ page }) => {
    test.setTimeout(60000);
    // ...
  });

  // Increase timeout for a specific action
  await page.getByRole('button').click({ timeout: 20000 });

  // Increase timeout for a specific assertion
  await expect(locator).toBeVisible({ timeout: 15000 });

  // Override action timeout for the page
  page.setDefaultTimeout(20000);
  ```

- Intentionally trigger each type of timeout and read the error:
  - Global test timeout — add `await page.waitForTimeout(999999)`
  - Action timeout — look for a non-existent element with a short timeout
  - Assertion timeout — assert on a condition that never becomes true
  - Navigation timeout — navigate to a URL that never loads

- Document the error message for each type — how do you tell them apart?

---

### Assignment 4.9 — Network Interception and Mocking

**Objective:** Intercept, modify and mock network requests in tests.

**Tasks:**

**Block requests:**
```ts
// Block all images from loading (speeds up test)
await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => route.abort());
```

**Mock an API response:**
```ts
// Return a fake employee list
await page.route('**/api/v2/pim/employees**', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      data: [
        { empNumber: 1, firstName: 'Mocked', lastName: 'Employee' }
      ],
      total: 1
    })
  });
});
await page.goto('/web/index.php/pim/viewEmployeeList');
// The table should show "Mocked Employee"
```

**Intercept and modify:**
```ts
// Intercept the response and modify it before it reaches the page
await page.route('**/api/v2/pim/employees**', async route => {
  const response = await route.fetch();
  const body = await response.json();
  body.data[0].firstName = 'Modified';
  await route.fulfill({ response, json: body });
});
```

**Simulate error states:**
```ts
// Simulate a 500 server error for one specific endpoint
await page.route('**/api/v2/pim/employees', route => {
  route.fulfill({ status: 500, body: 'Internal Server Error' });
});
// Then verify your application shows a proper error state in the UI
```

**Inspect requests made by the page:**
```ts
// Collect all API calls made during a UI action
const requests: string[] = [];
page.on('request', request => {
  if (request.url().includes('/api/')) {
    requests.push(request.url());
  }
});

await employeeListPage.searchByName('Admin');
console.log('API calls made:', requests);
```

Write 4 tests using the above techniques against OrangeHRM.

---

### Assignment 4.10 — Multiple Pages and Contexts

**Objective:** Handle scenarios involving multiple pages and browser contexts.

**Tasks:**

**Multiple pages in same context:**
```ts
test('Open employee profile in new tab', async ({ context, page }) => {
  await page.goto('/web/index.php/pim/viewEmployeeList');

  // Capture the new tab that opens when clicking a link
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: 'Admin' }).click()
  ]);

  await newPage.waitForLoadState();
  await expect(newPage).toHaveURL(/.*viewPersonalDetails/);
  await newPage.close();
});
```

**Multiple contexts (independent sessions):**
```ts
test('Admin and ESS user simultaneously', async ({ browser }) => {
  const adminContext = await browser.newContext({ storageState: 'auth/admin.json' });
  const essContext = await browser.newContext({ storageState: 'auth/ess-user.json' });

  const adminPage = await adminContext.newPage();
  const essPage = await essContext.newPage();

  await adminPage.goto('/web/index.php/dashboard/index');
  await essPage.goto('/web/index.php/dashboard/index');

  // Admin sees full navigation menu
  await expect(adminPage.getByRole('link', { name: 'Admin' })).toBeVisible();
  // ESS user does not see Admin menu
  await expect(essPage.getByRole('link', { name: 'Admin' })).toBeHidden();

  await adminContext.close();
  await essContext.close();
});
```

Write 3 tests using multiple pages and 2 tests using multiple contexts.

---

### Assignment 4.11 — File Upload and Download

**Objective:** Handle file upload and download interactions.

**Tasks:**

**File upload:**
```ts
test('Upload employee profile photo', async ({ page }) => {
  await page.goto('/web/index.php/pim/viewPersonalDetails/empNumber/1');

  // Trigger file input
  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles('tests/fixtures/sample-photo.jpg');

  // Verify upload preview appears
  await expect(page.getByRole('img', { name: 'profile photo' })).toBeVisible();
});
```

**File download:**
```ts
test('Download employee data CSV', async ({ page }) => {
  // Wait for download to start
  const downloadPromise = page.waitForEvent('download');

  await page.getByRole('button', { name: 'Export' }).click();

  const download = await downloadPromise;

  // Verify file name
  expect(download.suggestedFilename()).toContain('employees');

  // Save to disk and verify
  await download.saveAs(`test-results/downloads/${download.suggestedFilename()}`);
  expect(download.suggestedFilename()).toMatch(/\.csv$/);
});
```

Create test fixtures in `tests/fixtures/` — a sample image and a small CSV file.
Write one upload test and one download test for OrangeHRM.

---

### Assignment 4.12 — Dialog Handling

**Objective:** Handle browser dialogs — alert, confirm, and prompt.

**Tasks:**
```ts
// Auto-accept all dialogs
page.on('dialog', dialog => dialog.accept());

// Auto-dismiss all dialogs
page.on('dialog', dialog => dialog.dismiss());

// Inspect dialog before acting
page.on('dialog', async dialog => {
  console.log('Type:', dialog.type());       // 'alert', 'confirm', 'prompt'
  console.log('Message:', dialog.message()); // dialog text
  if (dialog.type() === 'confirm') {
    await dialog.accept();
  } else {
    await dialog.dismiss();
  }
});

// Fill a prompt dialog
page.on('dialog', dialog => dialog.accept('User input text'));
```

- Find or trigger a dialog in OrangeHRM (delete confirmation dialogs)
- Write a test that:
  - Clicks delete on a record
  - Accepts the confirmation dialog
  - Verifies the record was deleted
- Write a test that:
  - Clicks delete
  - Dismisses the confirmation
  - Verifies the record was NOT deleted

---

### Assignment 4.13 — page.evaluate and JavaScript Execution

**Objective:** Execute JavaScript in the browser context from tests.

**Tasks:**
```ts
// Read a value from the DOM
const title = await page.evaluate(() => document.title);

// Read localStorage
const token = await page.evaluate(() => localStorage.getItem('authToken'));

// Set localStorage
await page.evaluate((value) => localStorage.setItem('key', value), 'test-value');

// Scroll to bottom of page
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Get all visible text on page
const allText = await page.evaluate(() => document.body.innerText);

// Count elements matching a selector (useful when locators have limitations)
const rowCount = await page.evaluate(() =>
  document.querySelectorAll('.oxd-table-row').length
);

// Trigger a custom event
await page.evaluate(() => {
  document.dispatchEvent(new CustomEvent('app:ready', { detail: { loaded: true } }));
});
```

Write 5 tests that use `page.evaluate` for things that are difficult or impossible through normal Playwright interactions.

---

### Assignment 4.14 — Visual Testing

**Objective:** Use Playwright's screenshot comparison for visual regression testing.

**Tasks:**
- Enable visual testing in `playwright.config.ts`:
  ```ts
  expect: {
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.1,
    }
  }
  ```
- Write visual tests:
  ```ts
  test('Login page visual regression', async ({ page }) => {
    await page.goto('/web/index.php/auth/login');
    await expect(page).toHaveScreenshot('login-page.png');
  });

  test('Dashboard visual regression', async ({ page }) => {
    await page.goto('/web/index.php/dashboard/index');
    // Mask dynamic content that changes every load
    await expect(page).toHaveScreenshot('dashboard.png', {
      mask: [page.locator('.oxd-userdropdown-name')]
    });
  });
  ```
- Generate baseline screenshots: `npx playwright test --update-snapshots`
- Verify the snapshots were created in `tests/__screenshots__/`
- Intentionally change a CSS value and run the test — observe the failure diff
- Update snapshots: `npx playwright test --update-snapshots`

---

### Assignment 4.15 — API Requests Inside Tests

**Objective:** Use the `request` fixture for API calls within UI tests.

**Tasks:**
```ts
test('Verify employee via API after UI creation', async ({ page, request }) => {
  // Create via UI
  await page.goto('/web/index.php/pim/addEmployee');
  await page.getByName('firstName').fill('APITest');
  await page.getByName('lastName').fill('Employee');
  await page.getByRole('button', { name: 'Save' }).click();

  // Get the employee ID from URL
  const url = page.url();
  const empId = url.match(/empNumber\/(\d+)/)?.[1];

  // Verify via API
  const response = await request.get(`/api/v2/pim/employees/${empId}`, {
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  const data = await response.json();

  expect(response.status()).toBe(200);
  expect(data.data.firstName).toBe('APITest');
  expect(data.data.lastName).toBe('Employee');
});
```

Write 3 tests that combine UI actions with `request` fixture API verification.

---

## Module 5 — Page Object Model

### Learning Objectives
- Understand why POM exists and the problem it solves
- Build a clean POM hierarchy with a BasePage
- Build component objects for repeated UI elements
- Keep all selectors inside page objects
- Follow naming and structure conventions consistently

---

### Assignment 5.1 — BasePage

**Objective:** Create the foundation all page objects inherit from.

**Tasks:**
- Create `pages/BasePage.ts`:
  ```ts
  import { Page, Locator, expect } from '@playwright/test';

  export class BasePage {
    constructor(protected page: Page) {}

    async navigate(path: string): Promise<void> {
      await this.page.goto(path);
      await this.waitForPageLoad();
    }

    async getTitle(): Promise<string> {
      return this.page.title();
    }

    async getURL(): Promise<string> {
      return this.page.url();
    }

    async waitForPageLoad(): Promise<void> {
      await this.page.waitForLoadState('domcontentloaded');
    }

    async waitForNetworkIdle(): Promise<void> {
      await this.page.waitForLoadState('networkidle');
    }

    async takeScreenshot(name: string): Promise<void> {
      await this.page.screenshot({ path: `screenshots/${name}-${Date.now()}.png` });
    }

    async verifyURL(pattern: string | RegExp): Promise<void> {
      await expect(this.page).toHaveURL(pattern);
    }

    async getToastMessage(): Promise<string> {
      const toast = this.page.locator('.oxd-toast');
      await expect(toast).toBeVisible({ timeout: 5000 });
      const text = await toast.textContent();
      return text?.trim() ?? '';
    }

    async waitForToastToDisappear(): Promise<void> {
      await this.page.locator('.oxd-toast').waitFor({ state: 'hidden' });
    }

    async scrollToBottom(): Promise<void> {
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
  }
  ```

---

### Assignment 5.2 — Core Page Objects

**Objective:** Build page objects for all main OrangeHRM modules.

Create each of the following, all extending `BasePage`:

**`pages/LoginPage.ts`:**
- `navigate()` — go to `/web/index.php/auth/login`
- `enterUsername(username: string)`
- `enterPassword(password: string)`
- `clickLoginButton()`
- `login(username: string, password: string)` — combines the three above
- `clickForgotPassword()`
- `getErrorMessage(): Promise<string>`
- `verifyLoginPageVisible(): Promise<void>`
- `verifyValidationMessage(field: 'username' | 'password'): Promise<void>`

**`pages/DashboardPage.ts`:**
- `navigate()`
- `getWelcomeMessage(): Promise<string>`
- `verifyDashboardLoaded()`
- `navigateToModule(moduleName: string)`
- `getQuickLaunchItems(): Promise<string[]>`
- `verifyModuleVisible(moduleName: string)`

**`pages/EmployeeListPage.ts`:**
- `navigate()`
- `searchByName(name: string)`
- `searchByEmployeeId(id: string)`
- `searchByJobTitle(title: string)`
- `clickSearch()`
- `clickReset()`
- `getEmployeeCount(): Promise<number>`
- `clickAddEmployee()`
- `getEmployeeRow(name: string): Locator`
- `clickEmployee(name: string)`
- `verifyEmployeeExists(name: string)`
- `verifyEmployeeNotExists(name: string)`

**`pages/AddEmployeePage.ts`:**
- `navigate()`
- `fillFirstName(name: string)`
- `fillMiddleName(name: string)`
- `fillLastName(name: string)`
- `fillEmployeeId(id: string)`
- `toggleCreateLoginDetails()`
- `fillUsername(username: string)`
- `fillPassword(password: string)`
- `fillConfirmPassword(password: string)`
- `save()`
- `cancel()`
- `verifySuccessfullySaved()`

**`pages/LeaveListPage.ts`:**
- `navigate()`
- `filterByEmployee(name: string)`
- `filterByLeaveType(type: string)`
- `filterByFromDate(date: string)`
- `filterByToDate(date: string)`
- `filterByStatus(status: string)`
- `clickSearch()`
- `clickReset()`
- `getLeaveRecordCount(): Promise<number>`
- `verifyNoRecordsFound()`
- `getLeaveStatus(row: number): Promise<string>`

**`pages/AdminPage.ts`:**
- `navigate()`
- `clickUserManagement()`
- `searchUserByUsername(username: string)`
- `searchUserByRole(role: string)`
- `getResultCount(): Promise<number>`
- `clickAddUser()`
- `getUserRole(username: string): Promise<string>`
- `getUserStatus(username: string): Promise<string>`
- `verifyUserExists(username: string)`
- `clickDeleteUser(username: string)`
- `clickEditUser(username: string)`

**`pages/RecruitmentPage.ts`:**
- `navigate()`
- `clickAddVacancy()`
- `fillVacancyName(name: string)`
- `selectJobTitle(title: string)`
- `fillNumberOfPositions(count: number)`
- `saveVacancy()`
- `searchVacancy(name: string)`
- `verifyVacancyExists(name: string)`

**Rules for all page objects:**
- No raw locator strings in test files — all locators live in page objects
- Use `getByRole`, `getByLabel`, `getByPlaceholder` preferentially — avoid CSS and XPath
- All methods return `Promise<void>` or typed `Promise<T>`
- No assertions (`expect`) inside page objects — only in test files
- All class properties are `private` or `protected`

---

### Assignment 5.3 — Component Objects

**Objective:** Build reusable component objects for repeated UI patterns.

**Tasks:**

Create these component objects in `components/`:

**`components/NavigationMenu.ts`:**
```ts
export class NavigationMenu {
  constructor(private page: Page) {}

  async clickModule(name: string): Promise<void> {
    await this.page.getByRole('link', { name }).click();
  }

  async getActiveModule(): Promise<string> {
    return this.page.locator('.oxd-main-menu-item--active').textContent() ?? '';
  }

  async isModuleVisible(name: string): Promise<boolean> {
    return this.page.getByRole('link', { name }).isVisible();
  }
}
```

**`components/TopBar.ts`:**
- `getUserName(): Promise<string>`
- `clickLogout()`
- `clickUserDropdown()`
- `navigateToProfile()`

**`components/DataTable.ts`:**
```ts
export class DataTable {
  constructor(private page: Page, private tableSelector: string) {}

  async getRowCount(): Promise<number> {
    return this.page.locator(`${this.tableSelector} .oxd-table-body .oxd-table-row`).count();
  }

  async getCellText(row: number, col: number): Promise<string> {
    const cell = this.page.locator(`${this.tableSelector} .oxd-table-row`).nth(row)
      .locator('.oxd-table-cell').nth(col);
    return cell.textContent() ?? '';
  }

  async clickRowAction(row: number, action: string): Promise<void> {
    await this.page.locator(`${this.tableSelector} .oxd-table-row`).nth(row)
      .getByRole('button', { name: action }).click();
  }

  async getColumnValues(col: number): Promise<string[]> {
    const cells = this.page.locator(`${this.tableSelector} .oxd-table-row`);
    const count = await cells.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const text = await cells.nth(i).locator('.oxd-table-cell').nth(col).textContent();
      values.push(text?.trim() ?? '');
    }
    return values;
  }
}
```

**`components/Toast.ts`:**
- `waitForSuccess(): Promise<string>`
- `waitForError(): Promise<string>`
- `getMessage(): Promise<string>`
- `close()`

**`components/Pagination.ts`:**
- `getRecordCount(): Promise<number>`
- `getTotalPages(): Promise<number>`
- `clickNextPage()`
- `clickPreviousPage()`
- `goToPage(pageNumber: number)`

**Use all components inside page objects** — do not duplicate logic.

---

### Assignment 5.4 — POM Refactoring Exercise

**Objective:** Identify and eliminate duplication in an existing test suite.

**Tasks:**
- Take 3 test files written in earlier assignments
- Identify any:
  - Repeated locators defined in multiple places
  - Repeated setup code in `beforeEach` that could be a fixture
  - Repeated assertion patterns that could be a page object method
  - Tests that call `page.locator()` directly instead of using a page object
- Refactor all findings:
  - Move all locators into page objects
  - Extract repeated setup into fixtures
  - Create helper methods for repeated assertion patterns
- Run all tests after refactoring — verify nothing broke
- Count lines of code in test files before and after — aim for test files to be shorter and cleaner

---

## Module 6 — Writing Tests Using POM

### Learning Objectives
- Write clean tests that delegate all interaction to page objects
- Organise tests into logical suites with correct hooks
- Cover positive, negative and edge cases
- Write tests that are independent and can run in any order

---

### Assignment 6.1 — Login Tests

**Test file: `tests/login.spec.ts`**

Write the following (minimum 12 tests):
- `@smoke` Valid login with admin credentials — lands on dashboard
- `@smoke` Valid login with ESS user credentials — lands on dashboard
- `@regression` Invalid login — wrong password — error message shown
- `@regression` Invalid login — wrong username — error message shown
- `@regression` Login with empty username — "Required" validation shown
- `@regression` Login with empty password — "Required" validation shown
- `@regression` Login with both fields empty — validations on both fields
- `@regression` Page title is "OrangeHRM"
- `@regression` OrangeHRM logo is visible on login page
- `@regression` "Forgot your password?" link is visible and navigates correctly
- `@regression` Login page URL is correct after navigation
- `@regression` Login button is disabled until both fields have values (if applicable)
- `@regression` After logout, accessing dashboard URL redirects to login

---

### Assignment 6.2 — Employee Management Tests

**Test file: `tests/employees.spec.ts`** (minimum 15 tests)

- `@smoke` Add new employee — verify success toast
- `@smoke` Search for employee by name — verify appears in results
- `@regression` Add employee — verify appears in employee list
- `@regression` Add employee with login credentials — verify user can log in with those credentials
- `@regression` Search by Employee ID — correct employee returned
- `@regression` Search with non-existent name — "No Records Found" shown
- `@regression` Reset search — all employees shown
- `@regression` Employee count increases by 1 after adding
- `@regression` Add employee with minimum required fields only
- `@regression` Cancel button on Add Employee returns to Employee List
- `@regression` Employee first name field accepts 30 characters maximum
- `@regression` Employee ID is auto-generated and unique
- `@regression` Add employee and edit their job details
- `@regression` Add employee and assign them to a supervisor
- `@regression` Delete employee — verify removed from list

**Hooks:** `afterEach` deletes any employees created with `TEST_` prefix via API.

---

### Assignment 6.3 — Leave Management Tests

**Test file: `tests/leave.spec.ts`** (minimum 12 tests)

- `@smoke` Leave module loads from navigation
- `@smoke` Leave List page displays records
- `@regression` Filter by employee name — results update
- `@regression` Filter by leave type — results update
- `@regression` Filter by from date — results update
- `@regression` Filter by date range — only records in range shown
- `@regression` Filter by status "Pending Approval"
- `@regression` Clear all filters — all records return
- `@regression` No records found for invalid combination
- `@regression` Leave entitlement page loads
- `@regression` Leave balance is visible for current user
- `@regression` Leave types list is not empty

---

### Assignment 6.4 — Admin Module Tests

**Test file: `tests/admin.spec.ts`** (minimum 12 tests)

- `@smoke` Admin module loads
- `@smoke` User Management page loads with a list of users
- `@regression` Search for "Admin" user — exists with Admin role
- `@regression` Search for non-existent user — no records
- `@regression` Add new ESS user — verify saved
- `@regression` Add user with duplicate username — verify error
- `@regression` Disable a user — status changes to Disabled
- `@regression` Enable a previously disabled user
- `@regression` Reset the search — all users shown
- `@regression` Delete a user — removed from list
- `@regression` Edit user role — role updated
- `@regression` Admin user count is at least 1

**Hooks:** `beforeAll` creates test users via API. `afterAll` deletes them.

---

### Assignment 6.5 — Dashboard Tests

**Test file: `tests/dashboard.spec.ts`** (minimum 8 tests)

- `@smoke` Dashboard loads after login
- `@smoke` Welcome message shows the logged-in username
- `@regression` All expected modules are visible in the navigation
- `@regression` Admin user sees Admin module in navigation
- `@regression` ESS user does NOT see Admin module in navigation
- `@regression` Quick Launch panel is visible
- `@regression` Clicking each navigation item lands on the correct page
- `@regression` Logout from the top bar returns to login page

---

### Assignment 6.6 — Cross-Module Tests

**Test file: `tests/cross-module.spec.ts`** (minimum 6 tests)

These tests span multiple modules to verify end-to-end workflows:

- `@regression` Add employee → assign leave entitlement → verify employee appears in leave list
- `@regression` Create system user → log in as that user → verify they can only see ESS modules
- `@regression` Create employee with login → update their profile → verify changes visible in employee list
- `@regression` Admin adds an employee → ESS user (manager) searches for them in leave module
- `@regression` Log out and back in — verify session is properly restored
- `@regression` Navigate through all 5 main modules without any errors

---

## Module 7 — Debugging POM Tests

### Learning Objectives
- Use the Playwright Inspector to step through tests
- Use `page.pause()` strategically
- Read the Trace Viewer effectively
- Debug with VS Code
- Identify the root cause of the 5 most common failure patterns

---

### Assignment 7.1 — Playwright Inspector

**Objective:** Step through a test interactively using PWDEBUG.

**Tasks:**
- Run an employee test with the inspector: `PWDEBUG=1 npx playwright test tests/employees.spec.ts --headed`
- Step through each action
- Hover over locators — observe the element highlight
- Use "Pick locator" to generate a locator for an element not yet in the page object
- Identify one fragile CSS selector in the test suite — refactor it using the inspector
- Use the inspector console to run `playwright.$(selector)` to test locators manually

---

### Assignment 7.2 — page.pause() Debugging

**Objective:** Use `page.pause()` to inspect state at a specific point.

**Tasks:**
- Introduce a bug: change a locator in `AddEmployeePage.ts` to a wrong selector
- Add `await page.pause()` before the failing action
- Run headed: `npx playwright test --headed tests/employees.spec.ts`
- In the paused state:
  - Use the DevTools Elements tab to find the correct selector
  - Test the fix in the Playwright Inspector console
  - Verify it highlights the right element
- Fix the page object, remove `page.pause()`, verify test passes

---

### Assignment 7.3 — Trace Viewer Deep Dive

**Objective:** Use the Trace Viewer for post-run failure analysis.

**Tasks:**
- Run with `trace: 'on'`: `npx playwright test --trace on`
- Open a trace: `npx playwright show-trace test-results/.../trace.zip`
- In the trace:
  - Identify each test step in the timeline
  - Click a step — inspect the DOM snapshot
  - View network requests — read the request and response
  - View console messages — identify any JavaScript errors
- Introduce a race condition (remove an `await`) — run the test until it fails
- Open the failure trace — pinpoint the exact step where the race condition caused the failure
- Fix the missing `await` — verify the test is stable across 5 consecutive runs

---

### Assignment 7.4 — VS Code Debugging

**Objective:** Debug tests inside VS Code.

**Tasks:**
- Install the Playwright VS Code extension
- Run a single test from the editor gutter (green play icon)
- Set a breakpoint inside a test and run in debug mode
- When paused, inspect the `page` object in the Variables panel
- Step over (F10) and step into (F11) through the test
- Use the Watch panel to evaluate `page.url()` and `page.title()` live
- Use the Debug Console to call `await page.locator('#submit').isVisible()`

---

### Assignment 7.5 — Diagnosing Common Failures

**Objective:** Recognise and fix the 5 most common Playwright failure patterns.

For each pattern below — intentionally introduce it, observe the error, fix it:

**Pattern 1 — Selector not found:**
```
Error: locator.click: Timeout 10000ms exceeded
waiting for getByRole('button', { name: 'Savee' })
```
Cause: Typo in selector. Fix: correct the locator.

**Pattern 2 — Element not visible:**
```
Error: locator.click: Element is not visible
```
Cause: Element exists in DOM but is hidden by CSS. Fix: scroll to it or wait for it to be visible.

**Pattern 3 — Race condition (missing await):**
```
Error: locator('...').click: Cannot read properties of undefined
```
Cause: Missing `await` before a navigation. Fix: add the `await`.

**Pattern 4 — Strict mode violation:**
```
Error: locator.click: strict mode violation, locator resolved to 3 elements
```
Cause: Selector matches more than one element. Fix: make the selector more specific (use `.first()`, `.nth()`, or a more precise locator).

**Pattern 5 — Test state pollution:**
One test creates data, the next test fails because the data from the first test was not cleaned up. Fix: use `afterEach` to clean up, or use unique names per test with `Date.now()`.

---

## Module 8 — HTML Reports

### Learning Objectives
- Configure multiple reporters simultaneously
- Generate reports with full artefacts
- Enrich reports with annotations and attachments
- Understand what each reporter format is used for

---

### Assignment 8.1 — Multi-Reporter Configuration

**Objective:** Set up professional-grade reporting.

**Tasks:**
- Configure all four reporters:
  ```ts
  reporter: [
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/results.xml' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list']
  ]
  ```
- Run the suite with 2–3 intentional failures
- Open HTML report — navigate failed tests, screenshots, traces, retries
- Open `results.xml` — identify `testcase`, `failure`, `skipped` elements
- Open `results.json` — understand the data structure (useful for custom dashboards)
- Write a brief explanation of when each format is appropriate

---

### Assignment 8.2 — Custom Report Annotations and Attachments

**Objective:** Enrich test reports with metadata and custom artefacts.

**Tasks:**
- Add test management annotations:
  ```ts
  test('Add new employee @smoke @regression', async ({ page }) => {
    test.info().annotations.push(
      { type: 'TestRail', description: 'TC-1042' },
      { type: 'Jira', description: 'OHR-245' },
      { type: 'Priority', description: 'Critical' },
      { type: 'Module', description: 'Employee Management' }
    );
  });
  ```
- Attach screenshots at key steps:
  ```ts
  await test.info().attach('Employee form filled', {
    body: await page.screenshot(),
    contentType: 'image/png'
  });
  ```
- Attach API responses:
  ```ts
  const response = await request.get('/api/v2/pim/employees');
  await test.info().attach('API Response - Employee List', {
    body: JSON.stringify(await response.json(), null, 2),
    contentType: 'application/json'
  });
  ```
- Attach test data used:
  ```ts
  await test.info().attach('Test Data', {
    body: JSON.stringify(testEmployee, null, 2),
    contentType: 'application/json'
  });
  ```
- Run and verify all annotations and attachments appear in the HTML report

---

### Assignment 8.3 — Report Analysis

**Objective:** Read and interpret test reports like a QA professional.

**Tasks:**
- Run the full test suite
- From the HTML report, write a test execution summary covering:
  - Total tests: passed, failed, skipped
  - Which module had the most failures?
  - What is the slowest test? What is the fastest?
  - Are there any flaky tests (passed on retry)?
  - What is the total execution time?
- From `results.xml`, write a brief analysis as if you were sending it to a development team
- Identify 2 tests that should be marked `@fixme` based on the failures being application bugs vs test code bugs

---

## Module 9 — Data Driven Testing

### Learning Objectives
- Externalise test data from test code
- Use JSON, TypeScript and CSV as data sources
- Parameterise tests using loops and `test.each` patterns
- Use environment-based data configuration

---

### Assignment 9.1 — JSON Data Files

**Objective:** Drive tests from external JSON data.

**Tasks:**
- Create `data/employees.json` with 5 employee records
- Write data-driven tests that loop through each:
  ```ts
  import employees from '@data/employees.json';

  for (const employee of employees) {
    test(`Add employee: ${employee.firstName} ${employee.lastName} @regression`, async ({ page }) => {
      await addEmployeePage.navigate();
      await addEmployeePage.fillFirstName(employee.firstName);
      await addEmployeePage.fillLastName(employee.lastName);
      await addEmployeePage.fillEmployeeId(employee.employeeId);
      await addEmployeePage.save();
      await addEmployeePage.verifySuccessfullySaved();
    });
  }
  ```
- Verify 5 separate test entries appear in the report with individual names

---

### Assignment 9.2 — TypeScript Data with Interfaces

**Objective:** Use typed TypeScript data objects.

**Tasks:**
- Create `data/invalid-logins.ts` with an `InvalidLoginScenario` interface and 7+ scenarios including SQL injection and XSS attempts
- Create `data/leave-requests.ts` with different leave types, durations, and statuses
- Create `data/admin-users.ts` with different user roles (Admin, ESS, Supervisor)
- Write data-driven tests for each data file
- Verify TypeScript catches type errors if the data structure is wrong

---

### Assignment 9.3 — CSV Data Source

**Objective:** Read test data from a CSV file — common in enterprise environments.

**Tasks:**
- Create `data/employees.csv`:
  ```csv
  firstName,lastName,employeeId,jobTitle,department
  Alice,Johnson,E001,QA Engineer,IT
  Bob,Williams,E002,Developer,IT
  Carol,Davis,E003,HR Manager,HR
  ```
- Create `helpers/csv-reader.ts` that reads and parses CSV files:
  ```ts
  import * as fs from 'fs';
  import * as path from 'path';

  export function readCSV(filePath: string): Record<string, string>[] {
    const content = fs.readFileSync(path.resolve(filePath), 'utf-8');
    const lines = content.trim().split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return headers.reduce((obj, header, i) => {
        obj[header.trim()] = values[i]?.trim() ?? '';
        return obj;
      }, {} as Record<string, string>);
    });
  }
  ```
- Write data-driven tests using the CSV data
- Verify the same tests work with both JSON and CSV sources by swapping the data source

---

### Assignment 9.4 — Environment-Based Data

**Objective:** Use different data for different environments.

**Tasks:**
- Create `data/config.ts`:
  ```ts
  const configs = {
    staging: {
      adminUser: { username: ENV.ADMIN_USERNAME, password: ENV.ADMIN_PASSWORD },
      baseEmployee: { firstName: 'Staging', lastName: 'TestUser' },
      apiEndpoint: '/api/v2'
    },
    local: {
      adminUser: { username: 'Admin', password: 'admin123' },
      baseEmployee: { firstName: 'Local', lastName: 'TestUser' },
      apiEndpoint: '/api/v2'
    }
  };

  export const Config = configs[(ENV.ENVIRONMENT as keyof typeof configs) ?? 'local'];
  ```
- Replace all hardcoded credentials and test data in tests with `Config.adminUser` and `Config.baseEmployee`
- Verify running with different `ENVIRONMENT` values uses the correct data

---

### Assignment 9.5 — Test Data Builder Pattern

**Objective:** Use a builder pattern for flexible test data creation.

**Tasks:**
- Create `data/EmployeeBuilder.ts`:
  ```ts
  export class EmployeeBuilder {
    private data = {
      firstName: 'Test',
      lastName: `Employee${Date.now()}`,
      employeeId: `E${Math.floor(Math.random() * 9000) + 1000}`,
      jobTitle: 'QA Engineer',
      department: 'IT',
    };

    withFirstName(name: string): this {
      this.data.firstName = name;
      return this;
    }

    withLastName(name: string): this {
      this.data.lastName = name;
      return this;
    }

    withJobTitle(title: string): this {
      this.data.jobTitle = title;
      return this;
    }

    withUniqueTimestamp(): this {
      this.data.lastName = `${this.data.lastName}-${Date.now()}`;
      this.data.employeeId = `E${Date.now()}`;
      return this;
    }

    build() {
      return { ...this.data };
    }
  }
  ```
- Use in tests:
  ```ts
  const employee = new EmployeeBuilder()
    .withFirstName('John')
    .withJobTitle('Developer')
    .withUniqueTimestamp()
    .build();
  ```
- Write 3 tests using the builder — verify each creates unique test data safely

---

## Module 10 — BDD with Cucumber

### Learning Objectives
- Write Gherkin feature files readable by non-technical stakeholders
- Implement step definitions using existing POM classes
- Use Background, Scenario Outline, and Data Tables
- Understand BDD as a communication tool, not just a test runner

---

### Assignment 10.1 — Feature Files

**Objective:** Write complete feature files for core OrangeHRM scenarios.

Create the following feature files:

**`features/login.feature`** — minimum 5 scenarios:
- Successful admin login
- Successful ESS user login
- Invalid credentials
- Empty field validations (Scenario Outline with Examples table)
- Logout from dashboard

**`features/employee.feature`** — minimum 5 scenarios:
- Add employee with all fields
- Search employee by name
- Search employee by ID
- No results for non-existent employee
- Delete employee

**`features/leave.feature`** — minimum 4 scenarios:
- Filter leave by employee
- Filter leave by date range
- Clear filters
- No records for invalid filter

**`features/admin.feature`** — minimum 4 scenarios:
- Add system user
- Search for user
- Disable user
- Delete user

Each feature file must use:
- Feature description with business persona (`As a... I want to... So that...`)
- `Background` for repeated setup steps
- `@smoke` and `@regression` tags
- At least one `Scenario Outline` with an `Examples` table

---

### Assignment 10.2 — Step Definitions

**Objective:** Implement step definitions that reuse existing POM classes.

**Tasks:**
- Create step definition files under `steps/`
- Reuse POM classes inside steps — do not duplicate interaction logic:
  ```ts
  Given('I am on the OrangeHRM login page', async function() {
    this.loginPage = new LoginPage(this.page);
    await this.loginPage.navigate();
  });

  When('I enter username {string} and password {string}', async function(username, password) {
    await this.loginPage.enterUsername(username);
    await this.loginPage.enterPassword(password);
  });

  When('I click the login button', async function() {
    await this.loginPage.clickLoginButton();
  });

  Then('I should be on the dashboard', async function() {
    await this.dashboardPage.verifyDashboardLoaded();
  });

  Then('I should see the error message {string}', async function(message) {
    const error = await this.loginPage.getErrorMessage();
    expect(error).toContain(message);
  });
  ```
- Create `steps/common.steps.ts` for shared steps used across multiple features
- Create a world object with `page`, `context`, `browser`, and all page objects

---

### Assignment 10.3 — BDD Reports

**Objective:** Generate readable BDD test reports.

**Tasks:**
- Configure Cucumber HTML reporter
- Run all BDD tests
- Verify the report shows:
  - Feature names
  - Scenario names
  - Step-by-step pass/fail with timing
  - Scenario Outline examples expanded
  - Tags visible per scenario
- Compare the Cucumber HTML report with Playwright's HTML report — understand which is better for which audience (business stakeholders vs engineers)

---

### Assignment 10.4 — BDD and POM Integration Assessment

**Objective:** Demonstrate mastery of the BDD + POM integration.

**Tasks:**
- Write a new feature file for a module not previously covered: **Time module** or **Performance module**
- Write the Gherkin scenarios without being given step definitions
- Implement the step definitions and any required page objects independently
- Run the full BDD suite — all scenarios must pass
- Write a short comparison (half page): when would you use BDD feature files over plain Playwright tests in a real project?

---

## Module 11 — API Testing

### Learning Objectives
- Use Playwright's `request` context for pure API testing
- Test all HTTP methods — GET, POST, PUT, PATCH, DELETE
- Validate status codes, response structure and data
- Build a reusable API client
- Test API authentication and error responses

---

### Assignment 11.1 — API Client Setup

**Objective:** Build a production-quality reusable API client.

**Tasks:**
- Create `helpers/ApiClient.ts` with:
  - `authenticate(username, password)` — stores token
  - `get(endpoint)` — authenticated GET
  - `post(endpoint, data)` — authenticated POST
  - `put(endpoint, data)` — authenticated PUT
  - `patch(endpoint, data)` — authenticated PATCH
  - `delete(endpoint)` — authenticated DELETE
  - Private `getHeaders()` — returns Authorization header
  - `getToken(): string` — returns current token
- Add error handling — throw descriptive errors when auth fails
- Write a test that verifies the client authenticates correctly

---

### Assignment 11.2 — Auth API Tests

**Test file: `tests/api/auth.api.spec.ts`** (minimum 6 tests)

- `@api` POST valid credentials — 200 and token in response
- `@api` POST invalid password — 401 with error message
- `@api` POST empty username — 400 with validation error
- `@api` POST empty password — 400 with validation error
- `@api` Use returned token in subsequent request — 200
- `@api` Use expired/invalid token — 401

---

### Assignment 11.3 — Employee API Tests

**Test file: `tests/api/employees.api.spec.ts`** (minimum 12 tests)

- `@api` GET `/api/v2/pim/employees` — 200, data array present
- `@api` GET employees with pagination — `limit` and `offset` params work
- `@api` GET employees with name filter
- `@api` POST create employee — 200, ID in response
- `@api` GET created employee by ID — all fields match
- `@api` PUT update employee name — 200, change verified
- `@api` GET after PUT — updated value persisted
- `@api` DELETE employee — 200
- `@api` GET deleted employee — 404 or empty result
- `@api` POST employee with missing required field — 400 with field error
- `@api` POST with invalid data type — 400
- `@api` GET non-existent employee ID — 404

---

### Assignment 11.4 — Leave API Tests

**Test file: `tests/api/leave.api.spec.ts`** (minimum 8 tests)

- `@api` GET leave types — list is not empty
- `@api` GET holidays — list present
- `@api` GET leave entitlements for an employee
- `@api` POST leave request — 200
- `@api` GET leave list — created request appears
- `@api` PUT update leave status to Approved
- `@api` GET after status change — Approved status returned
- `@api` DELETE leave request

---

### Assignment 11.5 — Admin API Tests

**Test file: `tests/api/admin.api.spec.ts`** (minimum 6 tests)

- `@api` GET users list — Admin user exists
- `@api` POST create user with ESS role — 200
- `@api` GET user by ID — role matches
- `@api` PUT update user status to Disabled — 200
- `@api` GET after disable — status is Disabled
- `@api` DELETE user — 200

---

### Assignment 11.6 — API Response Schema Validation

**Objective:** Validate API response schemas to catch contract changes early.

**Tasks:**
- Install `zod` for schema validation: `npm install zod --save-dev`
- Define schemas for API responses:
  ```ts
  import { z } from 'zod';

  const EmployeeSchema = z.object({
    empNumber: z.number(),
    firstName: z.string(),
    lastName: z.string(),
    employeeId: z.string(),
    terminationId: z.null().optional(),
  });

  const EmployeeListResponseSchema = z.object({
    data: z.array(EmployeeSchema),
    meta: z.object({
      total: z.number(),
    })
  });
  ```
- Write tests that validate the response matches the schema:
  ```ts
  const response = await request.get('/api/v2/pim/employees');
  const body = await response.json();
  const result = EmployeeListResponseSchema.safeParse(body);
  expect(result.success, `Schema validation failed: ${JSON.stringify(result.error)}`).toBe(true);
  ```
- Intentionally change a schema field — verify the validation catches the mismatch

---

## Module 12 — Hybrid Tests (API + UI)

### Learning Objectives
- Combine API and UI in the same test strategically
- Use API for fast, reliable setup and teardown
- Use UI only for what users actually see
- Build a centralised Data Factory

---

### Assignment 12.1 — Data Factory

**Objective:** Build a centralised factory for test data management.

**Tasks:**
- Create `helpers/DataFactory.ts`:
  ```ts
  export class DataFactory {
    private api: ApiClient;

    constructor(request: APIRequestContext) {
      this.api = new ApiClient(request);
    }

    async init(): Promise<void> {
      await this.api.authenticate(ENV.ADMIN_USERNAME, ENV.ADMIN_PASSWORD);
    }

    async createEmployee(overrides: Partial<Employee> = {}): Promise<Employee> {
      const defaults = new EmployeeBuilder().withUniqueTimestamp().build();
      const data = { ...defaults, ...overrides };
      const response = await this.api.post('/api/v2/pim/employees', data);
      const body = await response.json();
      return body.data;
    }

    async deleteEmployee(empNumber: number): Promise<void> {
      await this.api.post('/api/v2/pim/employees', { ids: [empNumber] });
    }

    async createSystemUser(overrides: Partial<SystemUser> = {}): Promise<SystemUser> {
      const response = await this.api.post('/api/v2/admin/users', overrides);
      return (await response.json()).data;
    }

    async deleteSystemUser(userId: number): Promise<void> {
      await this.api.delete(`/api/v2/admin/users/${userId}`);
    }

    async cleanupTestData(prefix: string = 'TEST_'): Promise<void> {
      const response = await this.api.get('/api/v2/pim/employees?limit=100');
      const employees = (await response.json()).data;
      const testEmployees = employees.filter((e: Employee) =>
        e.firstName.startsWith(prefix) || e.lastName.startsWith(prefix)
      );
      for (const emp of testEmployees) {
        await this.deleteEmployee(emp.empNumber);
      }
    }
  }
  ```

---

### Assignment 12.2 — API Setup, UI Verify

**Test file: `tests/hybrid/api-setup-ui-verify.spec.ts`** (minimum 6 tests)

- `@hybrid` Create employee via API → search in UI → verify in table
- `@hybrid` Create employee via API → navigate to profile in UI → verify all fields displayed correctly
- `@hybrid` Create system user via API → search in Admin → verify role and status
- `@hybrid` Create leave assignment via API → verify appears in Leave List UI
- `@hybrid` Create employee via API with specific job title → filter by job title in UI → verify appears
- `@hybrid` Create 3 employees via API → verify UI shows correct total count

---

### Assignment 12.3 — UI Action, API Verify

**Test file: `tests/hybrid/ui-action-api-verify.spec.ts`** (minimum 6 tests)

- `@hybrid` Add employee through UI form → GET via API → verify all fields match
- `@hybrid` Update employee job title via UI → GET via API → verify job title updated
- `@hybrid` Delete employee via UI → GET via API → verify 404
- `@hybrid` Disable user via UI → GET via API → verify status is Disabled
- `@hybrid` Add system user via UI → GET via API → verify role matches what was selected in UI
- `@hybrid` Change employee supervisor via UI → GET via API → verify supervisor relationship saved

---

### Assignment 12.4 — Parallel Hybrid Tests with Independent Data

**Objective:** Write hybrid tests that are safe to run in parallel.

**Tasks:**
- Review all hybrid tests for shared state issues
- Ensure every test:
  - Creates its own test data in `beforeEach` (not `beforeAll`)
  - Uses unique names with `Date.now()` or `crypto.randomUUID()`
  - Deletes its own data in `afterEach` (not `afterAll`)
- Enable `fullyParallel: true` and run the hybrid suite 5 times
- Verify all tests pass consistently (no shared state failures)
- Measure execution time with 1 worker vs 4 workers

---

## Module 13 — CI/CD with GitHub Actions and Docker

### Learning Objectives
- Build a complete GitHub Actions pipeline for Playwright
- Use secrets and environment variables in CI
- Run different test sets on different triggers
- Build and run tests in Docker
- Upload and access artefacts from CI

---

### Assignment 13.1 — Basic GitHub Actions Workflow

**Objective:** Run smoke tests automatically on every PR.

**Tasks:**
- Create `.github/workflows/playwright.yml`:
  ```yaml
  name: Playwright Tests

  on:
    push:
      branches: [main]
    pull_request:
      branches: [main]

  jobs:
    smoke:
      name: Smoke Tests (PR Gate)
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4

        - uses: actions/setup-node@v4
          with:
            node-version: 20
            cache: 'npm'

        - name: Install dependencies
          run: npm ci

        - name: Install Playwright browsers
          run: npx playwright install --with-deps chromium

        - name: Run smoke tests
          run: npx playwright test --grep @smoke --project=chromium
          env:
            BASE_URL: ${{ secrets.BASE_URL }}
            ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
            ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
            CI: true

        - name: Upload HTML Report
          uses: actions/upload-artifact@v4
          if: always()
          with:
            name: smoke-test-report
            path: playwright-report/
            retention-days: 14

        - name: Upload JUnit Results
          uses: actions/upload-artifact@v4
          if: always()
          with:
            name: junit-results
            path: test-results/results.xml
  ```
- Add secrets to the GitHub repository
- Push to a branch and raise a PR — verify the workflow runs
- Fail a test intentionally — verify the PR check turns red
- Fix and verify the PR check turns green

---

### Assignment 13.2 — Full Regression Pipeline

**Objective:** Add a multi-stage regression pipeline that runs on merge.

**Tasks:**
- Add a `regression` job to the workflow:
  ```yaml
  regression:
    name: Full Regression Suite
    needs: smoke
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - name: Run regression on ${{ matrix.browser }}
        run: npx playwright test --grep @regression --project=${{ matrix.browser }}
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
          ADMIN_USERNAME: ${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
          CI: true
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: regression-report-${{ matrix.browser }}
          path: playwright-report/
  ```
- Verify that after merging a PR, the smoke job runs first and the regression job runs after
- Verify regression runs on both Chromium and Firefox in parallel

---

### Assignment 13.3 — Scheduled Nightly Run

**Objective:** Configure tests to run automatically on a schedule.

**Tasks:**
- Add a scheduled trigger to run the full suite every night:
  ```yaml
  on:
    schedule:
      - cron: '0 0 * * *'  # midnight UTC every day
    push:
      branches: [main]
    pull_request:
      branches: [main]
  ```
- Configure the nightly run to run ALL tests (not just smoke) across all browsers
- Send a Slack notification if the nightly run fails (use `slackapi/slack-github-action`)
- Verify the workflow appears in the Actions tab with a calendar icon

---

### Assignment 13.4 — Docker

**Objective:** Package the test suite in Docker for portable execution.

**Tasks:**
- Create `Dockerfile`:
  ```dockerfile
  FROM mcr.microsoft.com/playwright:v1.44.0-jammy

  WORKDIR /app

  COPY package*.json ./
  RUN npm ci

  COPY . .

  RUN npx playwright install --with-deps

  ENTRYPOINT ["npx", "playwright", "test"]
  ```
- Build: `docker build -t orangehrm-tests .`
- Run with environment variables:
  ```bash
  # macOS / Linux
  docker run --rm \
    -e BASE_URL=https://opensource-demo.orangehrmlive.com \
    -e ADMIN_USERNAME=Admin \
    -e ADMIN_PASSWORD=admin123 \
    -v $(pwd)/playwright-report:/app/playwright-report \
    orangehrm-tests --grep @smoke

  # Windows PowerShell
  docker run --rm `
    -e BASE_URL=https://opensource-demo.orangehrmlive.com `
    -e ADMIN_USERNAME=Admin `
    -e ADMIN_PASSWORD=admin123 `
    -v ${PWD}/playwright-report:/app/playwright-report `
    orangehrm-tests --grep @smoke
  ```
- Create `docker-compose.yml`:
  ```yaml
  version: '3.8'
  services:
    playwright:
      build: .
      environment:
        - BASE_URL=${BASE_URL}
        - ADMIN_USERNAME=${ADMIN_USERNAME}
        - ADMIN_PASSWORD=${ADMIN_PASSWORD}
      volumes:
        - ./playwright-report:/app/playwright-report
        - ./test-results:/app/test-results
      command: ["--grep", "@smoke"]
  ```
- Run: `docker-compose up`
- Verify the HTML report is accessible after the container exits

---

### Assignment 13.5 — CI Pipeline Analysis

**Objective:** Understand and optimise the pipeline.

**Tasks:**
- Measure total pipeline execution time from push to results available
- Identify the slowest step — is it installing browsers, running tests, or something else?
- Optimise by caching Playwright browsers:
  ```yaml
  - name: Cache Playwright browsers
    uses: actions/cache@v4
    id: playwright-cache
    with:
      path: ~/.cache/ms-playwright
      key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

  - name: Install Playwright browsers
    if: steps.playwright-cache.outputs.cache-hit != 'true'
    run: npx playwright install --with-deps
  ```
- Compare pipeline time before and after caching
- Document which steps benefit most from caching

---

## Module 14 — Report Portal Integration

### Learning Objectives
- Understand centralised reporting vs individual HTML reports
- Connect Playwright to Report Portal
- Analyse test quality trends over multiple runs
- Classify defects and identify flaky tests

---

### Assignment 14.1 — Report Portal Setup

**Objective:** Set up Report Portal and connect the test suite.

**Tasks:**
- Set up Report Portal locally using Docker Compose
- Log in and create project: `orangehrm-automation`
- Generate an API key for your user
- Install: `npm install @reportportal/agent-js-playwright --save-dev`
- Configure `playwright.config.ts`:
  ```ts
  reporter: [
    ['html'],
    ['@reportportal/agent-js-playwright', {
      apiKey: process.env.RP_API_KEY,
      endpoint: 'http://localhost:8080/api/v1',
      project: 'orangehrm-automation',
      launch: `OrangeHRM - ${process.env.CI ? 'CI' : 'Local'} - ${new Date().toISOString().split('T')[0]}`,
      attributes: [
        { key: 'env', value: process.env.ENVIRONMENT ?? 'staging' },
        { key: 'branch', value: process.env.GITHUB_REF_NAME ?? 'local' },
        { key: 'os', value: process.platform }
      ],
      description: 'OrangeHRM automation framework run'
    }]
  ]
  ```
- Add `RP_API_KEY` to `.env` and `.env.example`
- Run the full suite — verify results appear in Report Portal dashboard

---

### Assignment 14.2 — Report Portal Analysis

**Objective:** Use Report Portal to understand test quality over time.

**Tasks:**
- Run the suite 5 times, introducing different failures in each run:
  - Run 1: All passing
  - Run 2: 3 employee tests failing
  - Run 3: 2 login tests failing
  - Run 4: 1 API test failing
  - Run 5: All passing
- In Report Portal, analyse:
  - Launch history — trend chart (improving, degrading, stable)
  - Open a failed launch — view screenshots and error messages
  - Mark 1 failure as "Product Bug" (application issue)
  - Mark 1 failure as "Automation Bug" (test code issue)
  - Mark 1 failure as "No Defect" (environment issue)
  - View the "Flaky Tests" widget — any tests that pass sometimes and fail others?
  - View "Most Failing Tests" widget
- Add the Report Portal reporter to the GitHub Actions workflow using `RP_API_KEY` as a GitHub Secret

---

### Assignment 14.3 — Report Portal Dashboards

**Objective:** Build a custom dashboard for the OrangeHRM project.

**Tasks:**
- In Report Portal, create a custom dashboard with these widgets:
  - "Overall Statistics" — pass rate, failures, skipped across all launches
  - "Launches Execution" — bar chart of pass/fail per launch
  - "Most Failed" — which tests fail most frequently
  - "Investigated Percentage" — how many failures have been classified
  - "Activity Stream" — recent team actions on defects
- Export a screenshot of the dashboard
- Write a short explanation of each widget and what information it provides to the team

---

## Module 15 — Parallel and Distributed Execution

### Learning Objectives
- Configure Playwright workers for parallel execution
- Write tests that are safe to run in parallel
- Use sharding for distributed CI execution
- Merge shard reports into a single report
- Measure and demonstrate performance improvements

---

### Assignment 15.1 — Enabling Parallel Execution

**Objective:** Enable parallel execution and verify test isolation.

**Tasks:**
- Update `playwright.config.ts`:
  ```ts
  workers: process.env.CI ? 4 : 2,
  fullyParallel: true,
  ```
- Record execution time with `workers: 1`
- Record execution time with `workers: 2`
- Record execution time with `workers: 4`
- Create a comparison table:

| Workers | Execution Time | Notes |
|---------|---------------|-------|
| 1 | ? | Baseline |
| 2 | ? | Expected ~50% faster |
| 4 | ? | Depends on CPU cores |

- Identify tests that fail in parallel — these have shared state issues
- Fix each one: unique names with `Date.now()`, independent data per test, proper `afterEach` cleanup

---

### Assignment 15.2 — Test Isolation for Parallel Safety

**Objective:** Make every test safe to run in parallel.

**Tasks:**
- Audit all tests for these parallel safety problems:
  - **Shared employee names** — two tests creating "Test Employee" at the same time
  - **Dependency on previous test** — test B needs data created by test A
  - **Global state mutation** — changing a setting that affects other tests
  - **No cleanup** — test leaves behind data that confuses other tests

- Fix each problem:
  ```ts
  // BEFORE — not parallel safe
  const employeeName = 'Test Employee';

  // AFTER — parallel safe
  const uniqueId = Date.now();
  const employeeName = `Test Employee ${uniqueId}`;
  ```

- Write a `test.describe.configure({ mode: 'parallel' })` for each test file
- Run with `--workers=4` 10 times — all runs must pass

---

### Assignment 15.3 — Test Sharding in CI

**Objective:** Split the suite across multiple CI jobs.

**Tasks:**
- Update the GitHub Actions regression job to use sharding:
  ```yaml
  strategy:
    matrix:
      shard: [1, 2, 3, 4]

  steps:
    - name: Run tests (shard ${{ matrix.shard }}/4)
      run: npx playwright test --shard=${{ matrix.shard }}/4

    - uses: actions/upload-artifact@v4
      if: always()
      with:
        name: blob-report-${{ matrix.shard }}
        path: blob-report/
  ```
- Add a `merge-reports` job:
  ```yaml
  merge-reports:
    needs: regression
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: final-merged-report
          path: playwright-report/
  ```
- Compare execution time:
  - Without sharding: 1 job, sequential
  - With 4 shards: 4 parallel jobs

---

### Assignment 15.4 — Worker Configuration Strategies

**Objective:** Choose the right worker configuration for different scenarios.

**Tasks:**
- Create configuration files:
  - `playwright.config.local.ts` — `workers: 2`, headed, retries 0
  - `playwright.config.ci.ts` — `workers: 4`, headless, retries 1
  - `playwright.config.debug.ts` — `workers: 1`, headed, timeout 120000, trace on

- Add npm scripts for each
- Run the same 10-test suite with each config — document:
  - Execution time
  - Whether any tests flake
  - Output format differences

---

## Module 16 — AI in Test Automation

### Learning Objectives
- Use AI tools to accelerate test writing
- Critically evaluate AI-generated code
- Use Playwright codegen and understand its output
- Know where AI helps and where it falls short

---

### Assignment 16.1 — AI-Assisted Page Object Generation

**Objective:** Use AI to generate a page object and evaluate the output critically.

**Tasks:**
- Automate the **Recruitment module** (Job Vacancies, Candidates, Interviews)
- Use GitHub Copilot or ChatGPT with a detailed prompt specifying your project conventions
- Review the AI's output:
  - Which selectors are correct vs fragile?
  - Any TypeScript errors?
  - Missing methods?
  - Convention violations?
- Fix all issues, integrate, write tests, verify they pass
- Document what AI got right and what required manual correction

---

### Assignment 16.2 — Playwright Codegen Evaluation

**Objective:** Record test flows with codegen and evaluate the locator quality.

**Tasks:**
- Run codegen: `npx playwright codegen https://opensource-demo.orangehrmlive.com`
- Record: login, add employee, apply leave filter
- Analyse: which locators are fragile, which are good
- Refactor every fragile locator to role/label-based alternatives
- Verify refactored tests pass
- Write a table: before vs after locator type distribution

---

### Assignment 16.3 — AI-Assisted Debugging

**Objective:** Use AI to diagnose failures and evaluate the suggestions.

**Tasks:**
- Take a genuinely failing test
- Provide AI with the full error, stack trace, and test code
- Evaluate the AI response: correct root cause? Good fix? Missing anything?
- Implement the fix (AI's or your own)
- Document the outcome

---

### Assignment 16.4 — AI Test Data Generation

**Objective:** Use AI to generate comprehensive, realistic test data.

**Tasks:**
- Generate `data/employees.json` with 20 diverse employee records using AI
- Review for realism, edge cases, missing fields
- Add 5 edge cases manually that AI would not generate:
  - Hyphenated names
  - Non-ASCII characters
  - Maximum field lengths
  - Minimum required fields only
  - Duplicate name scenario

---

### Assignment 16.5 — AI for Test Coverage Analysis

**Objective:** Use AI to identify test coverage gaps.

**Tasks:**
- Provide AI with your complete `tests/employees.spec.ts` file
- Ask: "What test scenarios are missing from this test suite for an Employee Management module?"
- Evaluate the suggestions:
  - Are they valid scenarios?
  - Are they already covered by existing tests?
  - Which ones would add real value?
- Implement the 3 most valuable suggestions AI identifies
- Verify they pass

---

### Assignment 16.6 — Critical Evaluation of AI Limitations

**Objective:** Understand where AI falls short in test automation.

**Tasks:**
- Attempt to use AI to:
  - Generate a step definition that uses your existing POM classes — observe whether it knows your project structure
  - Fix a selector that requires understanding the live OrangeHRM DOM — observe whether AI can do this without seeing the actual HTML
  - Write a test for a scenario that requires understanding a business rule specific to OrangeHRM
- Document in 1 page:
  - Where AI is genuinely useful in your workflow
  - Where AI consistently gets things wrong
  - What AI cannot do that still requires a human engineer
  - How you use AI as a tool, not as a replacement for engineering judgement

---

## Final Capstone Project

### Objective

Build and present a complete, production-grade automation framework independently — without guidance during execution.

---

### Deliverables

**Repository:** A public GitHub repository `orangehrm-automation-capstone`

**Required Test Coverage:**

| Area | Minimum |
|---|---|
| UI Tests | 50+ tests across at minimum 5 modules |
| API Tests | 25+ tests covering all main endpoints |
| Hybrid Tests | 15+ tests (API setup + UI verify AND UI action + API verify) |
| BDD Feature Files | 3 complete feature files with full step definitions |
| Data Driven Tests | 4 test suites using external data sources (JSON, TypeScript, CSV) |

**Framework Requirements:**

| Component | Requirement |
|---|---|
| `playwright.config.ts` | Multi-browser, environment config, global setup, reporters |
| POM | All 5 modules have page objects extending BasePage, at least 3 component objects |
| Fixtures | Merged fixture file (pages + API) used across all test files |
| `global-setup.ts` | Generates auth for admin and ESS user |
| `global-teardown.ts` | Cleans up test data with TEST_ prefix |
| `DataFactory.ts` | All test data creation and deletion via factory |
| `ApiClient.ts` | All API calls go through the client with auth |
| `EmployeeBuilder.ts` | Builder pattern for creating test data |
| Visual Tests | At least 2 screenshot comparison tests |
| Network Mocking | At least 1 test using `page.route()` to mock an API |
| Multiple Contexts | At least 1 test verifying admin vs ESS user differences |

**CI/CD:**

| Requirement | Detail |
|---|---|
| GitHub Actions | Smoke on PR, regression on merge, nightly scheduled run |
| Secrets | All credentials in GitHub Secrets |
| Artefacts | HTML report, JUnit XML, trace on failure |
| Docker | `Dockerfile` + `docker-compose.yml` that runs tests |
| Sharding | Regression uses 4 shards with merged report |
| Caching | Playwright browsers cached to speed up pipeline |

**Reporting:**
- Report Portal: 10+ historical runs, defects classified, custom dashboard built
- HTML report: annotations with Jira/TestRail IDs on all tests
- JUnit XML: parseable by CI system

**README.md must include:**
- Project description and scope
- Prerequisites with exact versions
- Complete setup guide (works from clone to running in under 10 minutes)
- Environment variable documentation with `.env.example` reference
- All available `npm run` commands with descriptions
- CI/CD pipeline diagram or description
- Folder structure with explanation of each directory
- Known limitations or open issues

---

### Evaluation Criteria

| Criteria | Weight |
|---|---|
| Framework structure and code organisation | 20% |
| Test quality — coverage, assertions, independence | 20% |
| POM quality — clean separation, no duplication | 15% |
| CI/CD pipeline running correctly with all features | 15% |
| API and hybrid test quality | 10% |
| README and documentation | 10% |
| Report Portal integration and analysis quality | 5% |
| Advanced features (visual, network mocking, multi-context) | 5% |

---

*This repository is your professional portfolio piece. Treat it as if a senior engineer at your first employer will review it on day one. Make it something you are proud to show.*
