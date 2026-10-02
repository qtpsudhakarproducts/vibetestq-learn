# Playwright Test Framework — Interview Questions

---

## Q: What is @playwright/test?

**A:** `@playwright/test` is the official test runner built specifically for Playwright. It is a complete testing framework that provides the `test()` function, the `expect()` assertion library, fixtures, hooks, parallel execution, reporters, and configuration. You do not need a separate runner like Jest or Mocha — everything is included and configured to work together with the Playwright automation library.

---

## Q: What does a basic Playwright test file look like?

**A:** A test file imports `test` and `expect` from `@playwright/test`, then calls `test('description', async ({ page }) => { ... })` with an async test function. The `page` fixture is injected automatically. Inside, you navigate, interact, and assert.

```typescript
import { test, expect } from '@playwright/test';

test('home page shows logo', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('img', { name: 'Logo' })).toBeVisible();
});
```

---

## Q: What fixtures are provided by default in @playwright/test?

**A:** The built-in fixtures are: `page` (a fresh browser page), `context` (the isolated browser context for that test), `browser` (the browser instance), `request` (an API request context), and `browserName` (the name of the browser being tested, e.g. `'chromium'`). They are injected automatically into any test function that declares them.

---

## Q: What is the difference between page, browser, and context fixtures?

**A:** `browser` is the browser process, shared across tests in the same worker. `context` is an isolated browser session (fresh cookies, localStorage, auth state) — each test gets its own by default. `page` is a tab inside a context — also fresh per test. This layering ensures test isolation while reusing the expensive browser process.

---

## Q: What is test.describe()?

**A:** `test.describe()` groups related tests under a named block. Hooks (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`) placed inside a `describe` block apply only to tests within that group. The HTML report displays grouped tests together, making it easier to see which feature or page the tests cover.

---

## Q: What is test.only()?

**A:** `test.only()` marks a single test or describe block to run exclusively, skipping all others in that file. It is useful during development to focus on one test. Never commit code with `.only` — it silently skips the rest of your tests in CI.

---

## Q: What is test.skip()?

**A:** `test.skip()` marks a test to be skipped entirely. Skipped tests appear in the report with a skip status but do not run. You can skip conditionally by passing a condition and a reason string. Use it for temporarily disabled tests rather than deleting them, so the intent is documented.

---

## Q: What is test.fixme()?

**A:** `test.fixme()` marks a test as known-broken and expected to fail. Unlike `skip`, it signals that the test exists and should be fixed. If a `fixme` test unexpectedly passes, the framework reports it as an unexpected pass, prompting you to remove the annotation.

---

## Q: What is beforeEach() and when do you use it?

**A:** `beforeEach()` runs a setup function before every test in its scope. Use it for actions every test in the group needs — navigating to a starting page, creating test-specific data, or initialising shared state. The setup runs inside the same test context, so state carries through to the test.

---

## Q: What is beforeAll() and how is it different from beforeEach()?

**A:** `beforeAll()` runs once before all tests in its scope, not before each one. Use it for expensive setup that only needs to happen once and whose effects are safe to share across tests (for example, starting a test server or seeding a database). Since all tests in the scope share the resulting state, be careful about test independence.

---

## Q: What is the difference between hooks and fixtures?

**A:** Hooks (`beforeEach`, `afterEach`) are procedural — they run in order and share scope with all tests in the block. Fixtures are declarative — a test says what it needs, and the framework creates it and tears it down. Fixtures are reusable across files, composable with each other, and easier to test in isolation. For complex shared setup, fixtures are the better tool.

---

## Q: What is a fixture in Playwright?

**A:** A fixture is a piece of reusable setup/teardown code that tests declare as a dependency. When a test lists a fixture in its arguments, the framework instantiates it, provides it to the test, and disposes of it after the test ends. Built-in examples are `page`, `context`, and `request`. You can define custom fixtures to provide page objects, API clients, or test data.

---

## Q: What problem do fixtures solve?

**A:** Fixtures eliminate boilerplate setup. Instead of writing login steps and page navigation in every `beforeEach`, you write them once in a fixture and any test that needs them just declares the fixture. Fixtures also ensure teardown runs reliably even when tests fail, and they can be composed — one fixture can depend on another.

---

## Q: What is test.extend()?

**A:** `test.extend()` creates a new `test` function with additional custom fixtures. You pass an object where each key is a fixture name and the value is an async function that receives existing fixtures and a `use` function. Call `await use(value)` to provide the fixture value to the test. Code after `await use()` is the teardown.

```typescript
const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await lp.goto();
    await use(lp);
    // teardown (if needed) goes here
  }
});
```

---

## Q: What is a worker-scoped fixture?

**A:** A worker-scoped fixture is created once per worker process and shared by all tests running in that worker. Use it for resources that are expensive to create repeatedly — like a database connection or a long-running server. Worker-scoped fixtures must be stateless with respect to individual tests, because all tests in the worker share the same instance.

---

## Q: What is a test-scoped fixture?

**A:** A test-scoped fixture is created fresh for each test and destroyed after it ends. This is the default scope. It guarantees that every test gets a clean instance with no carried-over state from other tests. Most custom fixtures should be test-scoped.

---

## Q: How do you create data-driven (parameterised) tests in Playwright?

**A:** Loop over a data array and call `test()` for each entry. Each iteration creates a separate test with its own name and data set.

```typescript
const users = [
  { role: 'admin', path: '/admin' },
  { role: 'viewer', path: '/dashboard' }
];

for (const { role, path } of users) {
  test(`${role} is redirected to ${path}`, async ({ page }) => {
    await loginAs(page, role);
    await expect(page).toHaveURL(path);
  });
}
```

---

## Q: What is the expect API?

**A:** `expect()` is the assertion library built into `@playwright/test`. Pass a value or a locator to `expect()` and chain assertion methods like `toBe()`, `toEqual()`, `toBeVisible()`, `toHaveText()`. When you pass a locator, the assertion retries automatically until it passes or times out — this is called a web-first assertion.

---

## Q: What are web-first assertions?

**A:** Web-first assertions are assertions that accept a locator and automatically retry until the condition is met or the timeout expires. Instead of waiting for an element and then asserting, you just assert and Playwright handles the polling. `expect(locator).toBeVisible()` will keep checking until the element is visible or the assertion times out.

---

## Q: What is toBeVisible()?

**A:** `toBeVisible()` asserts that an element is rendered on the page — it is attached to the DOM, is not hidden by CSS (`display:none`, `visibility:hidden`), and has a non-zero bounding box. It retries automatically. It does not require the element to be in the viewport.

---

## Q: What is toHaveText()?

**A:** `toHaveText()` asserts that an element's text content matches the expected string or regular expression. For a locator matching a list of elements, it compares each item against an array of expected values. It normalises whitespace by default and retries until the assertion passes.

---

## Q: What is a soft assertion?

**A:** A soft assertion (`expect.soft()`) records a failure but lets the test continue running. All soft assertion failures are collected and reported at the end. Use it when you want to capture multiple validation failures in a single test run rather than stopping at the first problem.

```typescript
await expect.soft(page.getByTestId('title')).toHaveText('Welcome');
await expect.soft(page.getByTestId('subtitle')).toBeVisible();
// test continues even if assertions above fail
```

---

## Q: What is test.step()?

**A:** `test.step()` groups a block of test code under a descriptive label that appears in reports, the trace viewer, and CI output. Steps make long tests readable by showing logical phases. They can be nested and their pass/fail status is tracked independently.

```typescript
await test.step('Login', async () => {
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Password').fill('secret');
  await page.getByRole('button', { name: 'Sign in' }).click();
});
```

---

## Q: When should you use test steps?

**A:** Use steps when a test covers multiple distinct phases and you want granular failure reporting. Write step names as user actions — "Add item to cart", "Proceed to checkout", "Complete payment". Keep step names meaningful and avoid creating a step for every single line of code.

---

## Q: What is the testInfo object?

**A:** `testInfo` is a built-in fixture that provides information about the running test: title, status, retry number, output directory path, and more. You can use it to attach files, add custom annotations, skip tests conditionally at runtime, or adjust timeout dynamically inside the test.

---

## Q: How do you attach files using testInfo.attach()?

**A:** Call `await testInfo.attach('label', { path: 'filepath' })` or `await testInfo.attach('label', { body: buffer, contentType: 'image/png' })`. Attachments appear alongside the test in the HTML report and are included in trace zip files. Use it to attach API response bodies, generated PDFs, or any diagnostic file.

---

## Q: What is playwright.config.ts?

**A:** `playwright.config.ts` is the central configuration file for all Playwright settings. It controls: base URL, timeouts, retries, number of workers, test directory, reporters, global setup and teardown scripts, and the list of browser projects. All tests in the suite share the same config, making it easy to change behaviour across all tests at once.

---

## Q: What is the baseURL option?

**A:** `baseURL` sets a prefix for all `page.goto()` calls. If `baseURL` is `'https://app-staging.example.com'`, then `page.goto('/login')` navigates to the full URL. This lets you change the target environment (staging, production, local) without touching any test file — just update `baseURL`.

---

## Q: What is the use block in playwright.config.ts?

**A:** The `use` block sets default options applied to every test in the project. Common settings: `baseURL`, `viewport`, `screenshot: 'only-on-failure'`, `video: 'retain-on-failure'`, `trace: 'on-first-retry'`, `storageState` for pre-authenticated tests, and `locale`/`timezone` for regional testing.

---

## Q: What are Playwright projects?

**A:** Projects are named test run configurations inside `playwright.config.ts`. Each project specifies its browser, viewport, and `use` settings. For example, projects named `chromium`, `firefox`, and `mobile-chrome` run the same tests with different configurations. You can also use projects for environments (staging vs production) or user roles.

---

## Q: Why run tests across multiple browser projects?

**A:** Different browsers have different rendering engines and interpret some CSS, JavaScript, and web APIs differently. A layout bug, a missing Web API, or a font rendering issue may only appear in one browser. Running across all supported browsers catches these differences before users do.

---

## Q: What built-in reporters does Playwright provide?

**A:** `list` (line per test, default), `dot` (minimal dots), `html` (full interactive HTML report), `json` (machine-readable), `junit` (for CI systems like Jenkins and Azure DevOps), `github` (PR annotations for GitHub Actions). Multiple reporters can be active simultaneously.

---

## Q: What does the HTML report show?

**A:** The HTML report shows all tests with pass/fail/skip status, duration, retry attempts, test steps, error messages, screenshots taken on failure, traces, and any attachments. Tests are filterable by status, project, and search term. Clicking a failed test shows the full error, the test code, and all visual evidence.

---

## Q: What is the trace viewer?

**A:** The trace viewer is a browser-based tool that replays a complete recording of a test run. It displays every action on a timeline, DOM snapshots of the page at each step, network requests, console messages, and screenshots. Open a trace with `npx playwright show-trace playwright-report/trace.zip`. It is the most effective tool for diagnosing failures that only appear in CI.

---

## Q: How do you investigate a failing test?

**A:** Run with `--debug` to step through the test in the Inspector. In CI, download the `playwright-report` artifact and open the trace viewer. Check screenshots and videos attached to the failure. Add `page.pause()` to freeze the test at a point of interest. Run the failing test in headed mode locally to watch the browser. Check for missing `await`, locator mismatches, or environment differences between local and CI.

---

## Q: What makes a test title effective?

**A:** A good test title describes a user behaviour or a system outcome — not an implementation detail. Write it as a statement: `'user can log in with a valid password'`, `'cart total updates when quantity changes'`. Avoid `'test 1'`, `'check login'`, or titles that duplicate the file name.

---

## Q: What is a flaky test and how do you approach fixing it?

**A:** A flaky test passes sometimes and fails other times without any code change. Common causes: missing `await`, timing issues, shared mutable state, hardcoded timeouts, non-deterministic data, or external service variability. Approach: run the test many times to confirm flakiness, enable traces to catch the exact failure point, add proper semantic waits, isolate state, and remove hardcoded sleeps.

---
