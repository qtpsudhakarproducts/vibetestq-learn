# 21 — Quick Reference

All essential Playwright syntax, CLI flags, and config options in one place. Use this as a daily lookup — not a learning resource.

---

## CLI

```bash
# Run
npx playwright test                          # all tests
npx playwright test tests/auth/              # directory
npx playwright test login                    # filename pattern
npx playwright test --grep @smoke            # by tag
npx playwright test --grep "@smoke|@login"   # OR
npx playwright test --grep "(?=.*@smoke)(?=.*@auth)"  # AND

# Target
npx playwright test --project=chromium
npx playwright test --project=chromium --project=firefox

# Debug
npx playwright test --headed
npx playwright test --debug                  # opens Inspector (implies --headed --workers=1)
npx playwright test --slow-mo=500            # 500ms delay between actions
npx playwright test --workers=1              # sequential — easier to debug

# Filters
npx playwright test --grep-invert @slow      # exclude tag
npx playwright test --list                   # list matching tests without running
npx playwright test --last-failed            # re-run only previously failed tests

# Flakiness
npx playwright test --repeat-each=20        # run each test 20 times
npx playwright test --retries=3             # override config retries

# Reports
npx playwright show-report                   # open HTML report
npx playwright show-report playwright-report # from specific folder
npx playwright show-trace trace.zip          # open trace file

# Sharding
npx playwright test --shard=1/4             # run first quarter
npx playwright merge-reports --reporter html ./blob-report  # merge shards

# Codegen
npx playwright codegen https://example.com  # record test actions
npx playwright codegen --device="iPhone 13" https://example.com

# Other
npx playwright install                       # install browsers
npx playwright install --with-deps          # + OS dependencies
npx playwright install chromium             # single browser
```

---

## Test Structure

```typescript
import { test, expect } from '@playwright/test';

test('title', async ({ page }) => { });
test.only('title', async ({ page }) => { });    // run only this
test.skip('title', async ({ page }) => { });    // skip this
test.fail('title', async ({ page }) => { });    // expect failure
test.slow('title', async ({ page }) => { });    // 3× timeout

test.describe('group', () => {
  test.beforeAll(async ({ request }) => { });
  test.afterAll(async ({ request }) => { });
  test.beforeEach(async ({ page }) => { });
  test.afterEach(async ({ page }) => { });
});

test.describe.only('group', () => { });   // only this group
test.describe.skip('group', () => { });   // skip group
test.describe.serial('group', () => { }); // sequential, skip rest on failure
test.describe.parallel('group', () => { }); // parallel within group

// Per-test config
test('title', { timeout: 60_000, retries: 3 }, async ({ page }) => { });
test.describe.configure({ mode: 'serial', retries: 2 });
```

---

## Locators

```typescript
// Preferred — semantic
page.getByRole('button', { name: 'Save' })
page.getByRole('textbox', { name: 'Username' })
page.getByRole('heading', { name: 'Employee List' })
page.getByRole('row', { name: 'Linda Anderson' })
page.getByLabel('First Name')
page.getByPlaceholder('Type for hints...')
page.getByText('Successfully Saved')
page.getByText('Submit', { exact: true })
page.getByAltText('Profile photo')
page.getByTitle('Close dialog')
page.getByTestId('employee-id')     // data-testid attribute

// CSS / XPath — last resort
page.locator('.class-name')
page.locator('#id')
page.locator('input[type="email"]')
page.locator('xpath=//button[@type="submit"]')

// Chaining
page.getByRole('row', { name: 'Linda' }).getByRole('button', { name: 'Edit' })
page.locator('.list').getByRole('listitem').first()

// Filters
page.getByRole('listitem').filter({ hasText: 'Active' })
page.getByRole('listitem').filter({ has: page.getByRole('checkbox') })

// nth / first / last
page.getByRole('row').first()
page.getByRole('row').last()
page.getByRole('row').nth(2)        // 0-indexed

// Frame
page.frameLocator('#iframe').getByRole('button', { name: 'Submit' })
```

---

## Actions

```typescript
await locator.click()
await locator.click({ button: 'right' })
await locator.click({ modifiers: ['Shift'] })
await locator.dblclick()
await locator.hover()
await locator.focus()

await locator.fill('text')            // clears and fills
await locator.type('text')            // types character by character
await locator.clear()
await locator.press('Enter')
await locator.press('Control+A')
await locator.selectOption('value')
await locator.selectOption({ label: 'Option Text' })
await locator.check()
await locator.uncheck()
await locator.setInputFiles('path/to/file.pdf')

await page.goto('/path')
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' })
await page.goBack()
await page.reload()
await page.waitForURL('**/dashboard')
await page.waitForURL(/dashboard/)
await page.waitForLoadState('networkidle')
await page.waitForLoadState('domcontentloaded')

await page.keyboard.press('Escape')
await page.keyboard.type('text')
await page.mouse.move(100, 200)
await page.mouse.click(100, 200)
```

---

## Assertions — expect()

```typescript
// Locator assertions — auto-retry until timeout
await expect(locator).toBeVisible()
await expect(locator).toBeHidden()
await expect(locator).toBeEnabled()
await expect(locator).toBeDisabled()
await expect(locator).toBeChecked()
await expect(locator).toBeFocused()
await expect(locator).toBeEmpty()
await expect(locator).toHaveText('exact text')
await expect(locator).toHaveText(/regex/)
await expect(locator).toContainText('partial')
await expect(locator).toHaveValue('input value')
await expect(locator).toHaveAttribute('href', '/path')
await expect(locator).toHaveClass('active')
await expect(locator).toHaveCSS('color', 'rgb(0, 0, 0)')
await expect(locator).toHaveCount(5)

// Page assertions
await expect(page).toHaveURL('/dashboard')
await expect(page).toHaveURL(/dashboard/)
await expect(page).toHaveTitle('OrangeHRM')

// Negation
await expect(locator).not.toBeVisible()
await expect(locator).not.toHaveText('Error')

// Custom timeout
await expect(locator).toBeVisible({ timeout: 10_000 })

// Soft assertions — continue on failure
const soft = expect.soft;
await soft(locator).toBeVisible();
await soft(locator).toHaveText('Expected');
expect(soft).toHaveNoSoftAssertionErrors();

// Polling
await expect.poll(async () => {
  const count = await page.getByRole('row').count();
  return count;
}).toBeGreaterThan(0);

// Screenshot assertion
await expect(page).toHaveScreenshot('name.png')
await expect(locator).toHaveScreenshot('name.png')
await expect(page).toHaveScreenshot('name.png', {
  maxDiffPixelRatio: 0.01,
  mask: [page.locator('.timestamp')],
  animations: 'disabled',
})
```

---

## Fixtures

```typescript
// Extend base test
import { test as base } from '@playwright/test';

const test = base.extend<{
  loginPage: LoginPage;
  adminUser: { username: string; password: string };
}>({
  // Function fixture — runs per test by default
  loginPage: async ({ page }, use) => {
    const lp = new LoginPage(page);
    await use(lp);
    // teardown after use()
  },

  // Worker-scoped fixture — runs once per worker
  adminUser: [async ({}, use) => {
    await use({ username: 'Admin', password: 'admin123' });
  }, { scope: 'worker' }],
});

export { test };
```

---

## TestInfo

```typescript
test('title', async ({ page }, testInfo) => {
  testInfo.title          // 'title'
  testInfo.titlePath      // ['describe', 'title']
  testInfo.file           // absolute path to spec file
  testInfo.status         // 'passed' | 'failed' | 'timedOut' | 'skipped'
  testInfo.retry          // 0 on first run, 1 on first retry
  testInfo.timeout        // current timeout in ms
  testInfo.outputDir      // unique dir for this test's artefacts
  testInfo.outputPath('screenshot.png')  // path within outputDir

  test.setTimeout(60_000)               // extend at runtime
  testInfo.setTimeout(testInfo.timeout + 15_000)  // extend by 15s

  await testInfo.attach('screenshot', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  testInfo.annotations.push({
    type: 'issue',
    description: 'https://jira.example.com/OHR-123',
  });
});
```

---

## Annotations

```typescript
test('title', { tag: ['@smoke', '@auth'] }, async ({ page }) => { });

test.fixme('title', async ({ page }) => { });     // mark as fixme
test.fixme(condition, 'reason');                  // conditional fixme

test('title', async ({ page }, testInfo) => {
  test.skip(condition, 'reason');                 // conditional skip
  test.fail(condition, 'reason');                 // conditional expect failure
});

// In describe
test.describe('group', () => {
  test.skip(({ browserName }) => browserName === 'webkit', 'Safari not supported');
});
```

---

## Configuration — playwright.config.ts

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  maxFailures: process.env.CI ? 10 : undefined,
  timeout: 30_000,                // per-test timeout
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  outputDir: 'test-results',
  snapshotDir: 'snapshots',

  expect: {
    timeout: 5_000,               // assertion timeout
  },

  use: {
    baseURL: process.env.BASE_URL ?? 'https://demo.orangehrmlive.com',
    headless: true,
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
    storageState: '.auth/admin.json',
    locale: 'en-US',
    timezoneId: 'Asia/Kolkata',
    geolocation: { longitude: 78.4867, latitude: 17.3850 },
    permissions: ['geolocation'],
    colorScheme: 'dark',
    ignoreHTTPSErrors: true,
    bypassCSP: false,
    extraHTTPHeaders: { 'X-Test': 'playwright' },
  },

  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'on-failure' }],
    ['junit', { outputFile: 'results/junit.xml' }],
    ['list'],
  ],

  projects: [
    {
      name: 'setup',
      testMatch: /global.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
```

---

## API Testing

```typescript
test('api', async ({ request }) => {
  const get  = await request.get('/api/v2/pim/employees', { params: { limit: 10 } });
  const post = await request.post('/api/v2/pim/employees', { data: { firstName: 'Test' } });
  const put  = await request.put('/api/v2/pim/employees/1', { data: { firstName: 'New' } });
  const del  = await request.delete('/api/v2/pim/employees', { data: { ids: [1] } });

  expect(get.status()).toBe(200);
  expect(get.ok()).toBe(true);
  const body = await get.json();
  const text = await get.text();

  // With headers
  const auth = await request.get('/api', {
    headers: { Authorization: `Bearer ${token}` },
  });

  // Separate context
  const ctx = await request.newContext({ baseURL: 'https://api.example.com' });
  await ctx.get('/endpoint');
  await ctx.dispose();
});
```

---

## Global Setup

```typescript
// global-setup.ts
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.context().storageState({ path: '.auth/admin.json' });
  await browser.close();
}

export default globalSetup;
```

---

## Sharding

```bash
npx playwright test --shard=1/4   # shard 1 of 4
npx playwright test --shard=2/4
npx playwright test --shard=3/4
npx playwright test --shard=4/4

# Merge blob reports after all shards complete
npx playwright merge-reports --reporter html ./blob-report
```

```typescript
// playwright.config.ts — blob reporter for sharded runs
reporter: process.env.CI
  ? [['blob', { outputDir: 'blob-report' }]]
  : [['html', { open: 'on-failure' }], ['list']],
```

---

## Common Patterns

```typescript
// Wait for network request
const [response] = await Promise.all([
  page.waitForResponse('**/api/v2/pim/employees'),
  page.getByRole('button', { name: 'Search' }).click(),
]);
const data = await response.json();

// Intercept and mock a request
await page.route('**/api/v2/pim/employees', route => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ data: [] }),
  });
});

// Download
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export' }).click();
const download = await downloadPromise;
await download.saveAs('/tmp/export.csv');

// Dialog handling
page.on('dialog', dialog => dialog.accept());
page.on('dialog', dialog => dialog.dismiss());
page.once('dialog', async dialog => {
  expect(dialog.message()).toContain('Are you sure');
  await dialog.accept();
});

// New tab / window
const pagePromise = page.waitForEvent('popup');
await page.getByRole('link', { name: 'Open' }).click();
const newPage = await pagePromise;
await expect(newPage).toHaveURL(/expected/);

// Evaluate in browser
const title = await page.evaluate(() => document.title);
await page.evaluate(([a, b]) => window.doSomething(a, b), ['arg1', 'arg2']);

// Screenshot
await page.screenshot({ path: 'screenshot.png', fullPage: true });
await locator.screenshot({ path: 'element.png' });
```

---

## Devices (Selection)

```typescript
import { devices } from '@playwright/test';

devices['Desktop Chrome']          // 1280×720, Chrome
devices['Desktop Firefox']         // 1280×720, Firefox
devices['Desktop Safari']          // 1280×720, WebKit
devices['Pixel 5']                 // 393×851, mobile Chrome
devices['iPhone 12']               // 390×844, mobile Safari
devices['iPad (gen 7)']            // 810×1080, tablet Safari
devices['Galaxy S9+']              // 320×658, mobile Chrome
```

---

## Tags — Recommended Conventions

```
@smoke          — critical path, runs on every push (~10 tests)
@regression     — full coverage, runs nightly or pre-release
@auth           — authentication flows
@pim            — PIM module
@leave          — Leave module
@api            — API-only tests
@visual         — visual regression tests
@slow           — tests that take over 30s
@flaky          — known flaky, isolated for investigation
```

---

## File Structure Convention

```
playwright.config.ts
tests/
  auth/
    login.spec.ts
  pim/
    add-employee.spec.ts
    employee-list.spec.ts
  leave/
    apply-leave.spec.ts
  api/
    employees-api.spec.ts
fixtures/
  base.fixture.ts
pages/
  LoginPage.ts
  pim/
    EmployeeListPage.ts
components/
  ConfirmationDialog.ts
.auth/
  admin.json            ← gitignored
snapshots/              ← committed to git
playwright-report/      ← gitignored
test-results/           ← gitignored
```
