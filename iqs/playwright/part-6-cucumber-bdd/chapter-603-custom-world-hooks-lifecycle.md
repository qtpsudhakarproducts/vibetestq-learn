# Chapter 603 — Custom World, Hooks & Lifecycle

This chapter covers the Custom World, all hook levels, screenshot-on-failure, and the `setDefaultTimeout` pattern. Interviewers focus here because World and hooks are where Cucumber's complexity lives — wiring Playwright's browser lifecycle into Cucumber's scenario lifecycle is where most BDD frameworks break down. Questions progress from what the World is, through hook ordering and scope, to the screenshot attachment pattern and real project debugging challenges.

---

## Q603.1 — What is the Cucumber World and why does it exist?

The World is a JavaScript class that Cucumber creates fresh for every scenario. It is the shared context for all step definitions in that scenario. Without a World, step definitions have no way to share state — one step cannot pass a `page` object to the next step.

Cucumber creates a new World instance at the start of each scenario and destroys it at the end. Every `Given`, `When`, `Then`, `And` step in a scenario runs as a method on that same World instance, with `this` pointing to it.

By default, Cucumber gives you an empty World. In a Playwright project, you extend it to hold your browser, context, and page:

```typescript
import { World, setWorldConstructor } from '@cucumber/cucumber';

export class OrangeHRMWorld extends World {
  browser!: Browser;
  context!: BrowserContext;
  page!: Page;
}

setWorldConstructor(OrangeHRMWorld);
```

Every step definition in this project can now access `this.browser`, `this.context`, and `this.page` — because they all run on the same World instance for their scenario.

---

## Q603.2 — Why does each scenario get its own World instance?

Test isolation. If scenarios shared a World, a test that fails halfway through could leave the browser in a broken state — logged in as the wrong user, on the wrong page, with a dirty form. The next scenario would start from that broken state and fail for the wrong reason.

Because Cucumber creates a new World per scenario:
- A fresh browser is opened for each scenario (`Before` hook calls `openBrowser()`)
- A fresh browser context means a clean cookie jar, fresh storage, no previous session
- A failed scenario cannot poison the next one

In the OrangeHRM project, the `Before` hook opens the browser on the fresh World instance, and `After` closes it:

```typescript
Before(async function (this: OrangeHRMWorld) {
  await this.openBrowser();   // opens browser on THIS scenario's World
});

After(async function (this: OrangeHRMWorld, scenario) {
  await this.closeBrowser();  // closes browser on THIS scenario's World
});
```

Scenario A's `page` and Scenario B's `page` are different objects. They cannot interfere.

---

## Q603.3 — What is setWorldConstructor and where must it be called?

`setWorldConstructor` tells Cucumber which class to instantiate as the World for every scenario. Without it, Cucumber uses the default built-in World class, which has no browser, page, or any custom properties.

```typescript
import { World, setWorldConstructor } from '@cucumber/cucumber';

export class OrangeHRMWorld extends World {
  // ... your properties and methods
}

setWorldConstructor(OrangeHRMWorld);  // ← must be at the module level, not inside a function
```

It must be called in a file that Cucumber requires before any scenarios run. In `cucumber.js`, the `require` array controls this:

```javascript
require: [
  'support/world.ts',    // ← setWorldConstructor is called here
  'support/hooks.ts',
  'step-definitions/**/*.ts',
],
```

If you define two World classes and call `setWorldConstructor` twice, the last call wins. In the OrangeHRM project, the `default` profile loads `world.ts` (which registers `OrangeHRMWorld`), and the `pom` profile loads `pom-world.ts` (which registers `POMWorld`). They never load both — the profile ensures only one World is active per run.

---

## Q603.4 — How did you use the World in your OrangeHRM BDD project?

In our project we had two World classes — one for each Cucumber profile.

`OrangeHRMWorld` (default profile) held `browser`, `context`, `page`, `baseUrl`, `headless`, and `slowMo`. Step definitions used `this.page` directly to interact with elements.

`POMWorld` (pom profile) held the same browser properties, plus all eight page objects: `loginPage`, `dashboardPage`, `employeeListPage`, `addEmployeePage`, `userManagementPage`, and `addUserPage`. After the browser opened, `initPages()` instantiated all page objects in one place:

```typescript
private initPages(): void {
  this.loginPage         = new LoginPage(this.page);
  this.dashboardPage     = new DashboardPage(this.page);
  this.employeeListPage  = new EmployeeListPage(this.page);
  this.addEmployeePage   = new AddEmployeePage(this.page);
  this.userManagementPage = new UserManagementPage(this.page);
  this.addUserPage       = new AddUserPage(this.page);
}
```

This meant step definitions in the pom profile never imported page objects directly. They just called `this.loginPage.clickLogin()` or `this.addEmployeePage.saveEmployee()`. Adding a new page object meant adding one line to `initPages()` and one property to `POMWorld` — nothing else changed.

---

## Q603.5 — What hook levels does Cucumber support and what is the order?

Cucumber has six hook types across three scope levels.

**Suite level** — runs once for the entire test run:
- `BeforeAll` — runs before any scenario starts
- `AfterAll` — runs after all scenarios finish

**Scenario level** — runs once per scenario:
- `Before` — runs before each scenario's first step
- `After` — runs after each scenario's last step (or after failure)

**Step level** — runs once per step:
- `BeforeStep` — runs before each individual step
- `AfterStep` — runs after each individual step

The execution order for a single scenario is:

```
BeforeAll (suite, once)
  └─ Before (scenario)
      └─ BeforeStep (step 1)
          └─ Given step 1 executes
      └─ AfterStep (step 1)
      └─ BeforeStep (step 2)
          └─ When step 2 executes
      └─ AfterStep (step 2)
      └─ ... (remaining steps)
  └─ After (scenario)
AfterAll (suite, once)
```

In the OrangeHRM project, all six hook types are used:
- `BeforeAll` / `AfterAll` print suite start/end banners to the console
- `Before` opens the browser
- `After` takes a failure screenshot and closes the browser
- `BeforeStep` logs the step text being executed
- `AfterStep` takes a screenshot when the step fails

---

## Q603.6 — How does setDefaultTimeout work and why can't it go in cucumber.js?

`setDefaultTimeout` sets the maximum time any individual step or hook can take before Cucumber marks it as timed out. The unit is milliseconds.

```typescript
import { setDefaultTimeout } from '@cucumber/cucumber';

setDefaultTimeout(60_000);  // 60 seconds per step
```

This must be called in a support file (hooks or world) that Cucumber loads before running any steps — not in `cucumber.js`. The reason is that `cucumber.js` is a Node.js module that Cucumber reads for configuration (which files to load, which formatters to use). It does not execute TypeScript step lifecycle calls. `setDefaultTimeout` is a runtime call that registers a timeout with the Cucumber runtime — it only works in a file that gets `require`d and executed.

The default timeout if you do not call `setDefaultTimeout` is 5000ms (5 seconds). For Playwright tests that include page navigation and `waitForLoadState('networkidle')`, 5 seconds is not enough. The OrangeHRM project sets `60_000` because some pages take several seconds to load.

> 💡 **Interview Tip:** "Where do you set the step timeout in Cucumber?" is a common interview question. The wrong answer is "in `cucumber.js`". The correct answer is `setDefaultTimeout()` in a hooks file that is required before tests run.

---

## Q603.7 — How do you take a screenshot on failure and attach it to the report?

You take the screenshot in the `After` hook, check the scenario status, and use `this.attach()` to add it to the Cucumber report:

```typescript
After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');           // attaches to Cucumber HTML report
    console.log(`\n[FAILED] Scenario: ${scenario.pickle.name}`);
  }
  await this.closeBrowser();
});
```

The `scenario` parameter gives you:
- `scenario.result?.status` — `Status.PASSED`, `Status.FAILED`, `Status.PENDING`, `Status.SKIPPED`
- `scenario.pickle.name` — the scenario name as written in the feature file
- `scenario.pickle.tags` — array of tags on this scenario

`this.attach()` is a method from the Cucumber `World` base class. It takes a buffer and a MIME type. Cucumber writes the attachment into the JSON report, and both the HTML reporter and Allure pick it up — the screenshot appears in the report next to the failed scenario.

The OrangeHRM project also takes a screenshot in `AfterStep` for step-level failure visibility:

```typescript
AfterStep(async function (this: OrangeHRMWorld, step) {
  if (step.result.status === Status.FAILED) {
    const screenshot = await this.page.screenshot({ fullPage: true });
    await this.attach(screenshot, 'image/png');
  }
});
```

This gives you a screenshot at the exact moment a step fails — more precise than the scenario-level screenshot.

---

## Q603.8 — What is the difference between AfterStep and After hooks for failure handling?

Both can capture screenshots, but they serve different purposes.

| | `AfterStep` | `After` |
|-|-------------|---------|
| Runs | After each step | After the whole scenario |
| Screenshot shows | Exact state when the step failed | State after all steps completed or aborted |
| Precision | High — captures the failing step's state | Lower — UI may have changed |
| Browser state | Page is still open | You close browser here |
| Use for | Debugging step-level failures | Cleanup and final scenario attachment |

The `After` hook is where you close the browser — you must always do this, even on failure. The `AfterStep` hook is for capturing diagnostic information at the step level.

In the OrangeHRM project, both are used together. `AfterStep` captures a screenshot after any failed step; `After` also captures one (for scenarios where the failure happened at the hook or scenario level rather than a step), then closes the browser.

One important rule: close the browser in `After`, not in `AfterStep`. If you close the browser in `AfterStep`, the remaining steps in the scenario cannot run because there is no browser anymore.

---

## Q603.9 — How do you log step execution to the console?

Use `BeforeStep` to log each step before it runs. The `step` parameter has `step.pickleStep.text` — the step text as written in the feature file.

```typescript
BeforeStep(async function (this: OrangeHRMWorld, step) {
  const stepText = step.pickleStep.text;
  console.log(`  → STEP: ${stepText}`);
});
```

Output for a login scenario:
```
  → STEP: the user navigates to OrangeHRM login page
  → STEP: the user enters username "testadmin"
  → STEP: the user enters password "Vibetestq@123"
  → STEP: the user clicks the login button
  → STEP: the user should be redirected to the dashboard
```

This logging is useful when running without a visual reporter — in CI, where you are reading raw console output, this trace tells you exactly which step was running when a timeout occurred.

Combined with `AfterStep`, you get before and after logging per step:
```typescript
BeforeStep(async function (this: OrangeHRMWorld, step) {
  console.log(`  → START: ${step.pickleStep.text}`);
});

AfterStep(async function (this: OrangeHRMWorld, step) {
  const status = step.result.status;
  console.log(`  ← ${status.toUpperCase()}: ${step.pickleStep.text}`);
});
```

---

## Q603.10 — What is the difference between BeforeAll/AfterAll and Before/After?

| | `BeforeAll` / `AfterAll` | `Before` / `After` |
|-|--------------------------|---------------------|
| Runs | Once per test run | Once per scenario |
| `this` context | NOT the World — `this` is a plain object | IS the World — `this` has browser, page etc. |
| Purpose | Suite-wide setup/teardown | Per-scenario browser lifecycle |
| Use for | Logging banners, global resources | Opening and closing browser |

In the OrangeHRM project:

```typescript
BeforeAll(async function () {
  // 'this' here is NOT OrangeHRMWorld — it's a plain Cucumber object
  // You cannot access this.page here
  console.log('\n=== OrangeHRM BDD Test Suite Starting ===\n');
});

Before(async function (this: OrangeHRMWorld) {
  // 'this' IS OrangeHRMWorld
  await this.openBrowser();   // opens browser for this scenario
});
```

The most common mistake is trying to open the browser in `BeforeAll` and use it across all scenarios. This breaks test isolation — all scenarios share one browser, one page, one session. If one scenario logs in as admin, every scenario after it starts as admin.

Always open and close the browser in `Before` and `After` — one browser per scenario.

---

## Q603.11 — What is wrong with this hooks setup?

```typescript
// ❌ COMMON MISTAKE — browser opened in BeforeAll, closed in AfterAll
let sharedPage: Page;

BeforeAll(async function () {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  sharedPage = await context.newPage();
});

AfterAll(async function () {
  await sharedPage.close();
});

Given('the user navigates to login page', async function () {
  await sharedPage.goto('https://app.example.com/login');
});
```

Three problems. First, `sharedPage` is shared across all scenarios — one scenario's actions affect the next. Second, `BeforeAll`'s `this` is not the World — you lose access to `this.baseUrl` and all World methods. Third, when a scenario fails midway, the browser is in an unknown state. The next scenario starts from that broken state — a logged-in session, a half-filled form, a previous URL.

```typescript
// ✅ CORRECT APPROACH — browser per scenario on the World
Before(async function (this: OrangeHRMWorld) {
  await this.openBrowser();   // fresh browser, fresh context, fresh page
});

After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
  }
  await this.closeBrowser();  // always close, even on failure
});
```

One browser per scenario. Clean state every time. The Cucumber World enforces this pattern.

---

## Q603.12 — How do you add a Playwright trace to Cucumber hooks for debugging?

```typescript
import { Before, After, Status } from '@cucumber/cucumber';
import { OrangeHRMWorld } from './world';
import * as fs from 'fs';
import * as path from 'path';

Before(async function (this: OrangeHRMWorld) {
  await this.openBrowser();
  // Start tracing after context is created
  await this.context.tracing.start({
    screenshots: true,
    snapshots: true,
    sources: true,
  });
});

After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const traceName = scenario.pickle.name.replace(/[^a-z0-9]/gi, '-');
    const tracePath = path.join('reports', 'traces', `${traceName}.zip`);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(tracePath), { recursive: true });

    await this.context.tracing.stop({ path: tracePath });
    console.log(`Trace saved: ${tracePath}`);

    // Also attach screenshot to report
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
  } else {
    await this.context.tracing.stop();   // stop without saving on pass
  }

  await this.closeBrowser();
});
```

Open the saved trace with:
```bash
npx playwright show-trace "reports/traces/Successful-login.zip"
```

The Playwright Trace Viewer shows every action, DOM snapshot, network request, and console log — exactly what happened before the failure.

---

## Q603.13 — How do you handle a scenario that needs a specific user role?

Use a tag to mark which scenarios need a specific role, and a tagged `Before` hook to set up that role:

```typescript
// All scenarios use the standard login
Before(async function (this: POMWorld) {
  await this.openBrowser();
});

// Scenarios tagged @admin get logged in as admin before steps run
Before({ tags: '@admin' }, async function (this: POMWorld) {
  await this.navigateTo('');
  await this.loginPage.login('testadmin', 'Vibetestq@123');
  await this.dashboardPage.verifyDashboardLoaded();
});

// Scenarios tagged @ess-user get logged in as ESS user
Before({ tags: '@ess-user' }, async function (this: POMWorld) {
  await this.navigateTo('');
  await this.loginPage.login('ess.user', 'EssUser@123');
  await this.dashboardPage.verifyDashboardLoaded();
});
```

Feature file:
```gherkin
@admin @employee
Scenario: Add a new employee
  When the user clicks on Add Employee button
  ...

@ess-user
Scenario: ESS user cannot access admin settings
  When the user tries to navigate to admin panel
  Then access should be denied
```

The tagged hooks run after the generic `Before` (which opens the browser). Cucumber runs `Before` hooks in the order they are registered. The generic browser-open hook must be registered before the role-specific login hooks.

---

## Q603.14 — Write a complete hooks file for the POM profile

```typescript
// support/pom-hooks.ts
import {
  Before,
  After,
  BeforeAll,
  AfterAll,
  BeforeStep,
  AfterStep,
  Status,
  setDefaultTimeout,
} from '@cucumber/cucumber';
import { POMWorld } from './pom-world';

// ─── Set step timeout — must be here, not in cucumber.js ─────────────────────
setDefaultTimeout(60_000);

// ─── Suite-level hooks (this = plain object, NOT POMWorld) ───────────────────

BeforeAll(async function () {
  console.log('\n========================================');
  console.log('  OrangeHRM BDD Test Suite Starting [POM]');
  console.log('========================================\n');
});

AfterAll(async function () {
  console.log('\n========================================');
  console.log('  OrangeHRM BDD Test Suite Completed [POM]');
  console.log('========================================\n');
});

// ─── Scenario-level hooks (this = POMWorld) ───────────────────────────────────

Before(async function (this: POMWorld) {
  await this.openBrowser();   // browser + context + page + all page objects
});

After(async function (this: POMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED) {
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
    console.log(`\n[FAILED] Scenario: ${scenario.pickle.name}`);
  }
  await this.closeBrowser();  // always runs, even on failure
});

// ─── Step-level hooks ─────────────────────────────────────────────────────────

BeforeStep(async function (this: POMWorld, step) {
  console.log(`  → STEP: ${step.pickleStep.text}`);
});

AfterStep(async function (this: POMWorld, step) {
  if (step.result.status === Status.FAILED) {
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
    // browser stays open — After hook will close it
  }
});
```

---

## Q603.15 — Describe a real World or hooks challenge from your project

In our OrangeHRM BDD project, we ran into a problem with the `BeforeStep` logging hook. When a step failed, `AfterStep` captured a screenshot and attached it to the report. But when the scenario had five steps and step 3 failed, the report showed two screenshots — one from `AfterStep` and one from `After`. This was confusing because both showed the same failed state.

We solved it by attaching the detailed screenshot only in `AfterStep`, and making the `After` screenshot conditional — only take the final screenshot if no `AfterStep` screenshot was already taken (which happens when the failure is at the scenario level, not a step):

```typescript
// Track whether a step-level screenshot was taken
let stepScreenshotTaken = false;

Before(async function (this: OrangeHRMWorld) {
  stepScreenshotTaken = false;
  await this.openBrowser();
});

AfterStep(async function (this: OrangeHRMWorld, step) {
  if (step.result.status === Status.FAILED) {
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
    stepScreenshotTaken = true;
  }
});

After(async function (this: OrangeHRMWorld, scenario) {
  if (scenario.result?.status === Status.FAILED && !stepScreenshotTaken) {
    // Only take scenario screenshot if no step screenshot was already taken
    const screenshot = await this.takeScreenshot();
    await this.attach(screenshot, 'image/png');
  }
  await this.closeBrowser();
});
```

The lesson: hook interactions are not always obvious. A screenshot from `AfterStep` and another from `After` both appear in the report, and duplicate screenshots add noise. Understanding the hook execution order lets you design clean, non-redundant diagnostic output.

---

## Chapter Summary — Key Points for Your Interview

- The World is a fresh class instance per scenario — it holds the browser, page, and all page objects. `setWorldConstructor` registers your custom class.
- `BeforeAll` / `AfterAll` run once per suite — `this` is not the World there. `Before` / `After` run per scenario — `this` IS the World.
- Always open the browser in `Before` and close it in `After` — never in `BeforeAll`. One browser per scenario guarantees isolation.
- `setDefaultTimeout(60_000)` must be called in a hooks or world file — not in `cucumber.js`. The default 5s is too short for Playwright tests.
- `this.attach(buffer, 'image/png')` attaches a screenshot to the Cucumber HTML and Allure report. Use it in `After` for scenario-level failures, in `AfterStep` for step-level precision.
- Tagged hooks (`Before({ tags: '@admin' })`) run only for scenarios with that tag — use this for role-specific login setup.
- In interviews: know the hook execution order, explain why per-scenario browsers give test isolation, and describe the `setDefaultTimeout` gotcha.
