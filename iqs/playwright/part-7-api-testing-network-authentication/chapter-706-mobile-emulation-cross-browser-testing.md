# Chapter 706 — Mobile Emulation & Cross-Browser

This chapter covers Playwright's device emulation system, the `devices`
preset catalogue, the cross-browser projects matrix, locale and timezone
testing, geolocation, and the Clock API. Interviewers ask these questions
to judge whether candidates can configure a realistic cross-browser and
cross-device strategy without tripling test execution time. Questions at
senior level focus on the projects matrix design decision — which tests run
on which browsers and why.

---

## Q706.1 — What does Playwright emulate when you set a device?

Playwright device emulation is not just window resizing. Setting a device
preset configures five properties simultaneously:

**Viewport** — the pixel dimensions of the browser window content area.

**User Agent** — the browser string sent in every HTTP request. Mobile
User Agents tell the server the device type, which can affect which HTML
or content is returned.

**Device Scale Factor (DPR)** — the ratio of CSS pixels to physical pixels.
iPhone 14 has DPR 3 — one CSS pixel = three physical pixels. Affects image
resolution, canvas rendering, and screenshot quality.

**Touch support (`hasTouch`)** — tells the browser that touch events are
available. Affects how JavaScript gesture libraries behave and how the
browser handles `click` vs `tap`.

**`isMobile` flag** — a browser flag that JavaScript can query. Affects
CSS media queries (`@media (pointer: coarse)`) and JavaScript that checks
`navigator.maxTouchPoints`.

A 375px-wide window with desktop DPR and no touch events does not correctly
emulate an iPhone. The `devices` preset sets all five together correctly.

---

## Q706.2 — How do you use the devices preset?

```typescript
import { test, expect, devices } from '@playwright/test';

// Per-file — applies to all tests in this file
test.use({ ...devices['iPhone 14'] });

test('mobile hamburger menu opens', async ({ page }) => {
  await page.goto('/');
  await page.tap('.hamburger-icon'); // tap, not click — touch event
  await expect(page.locator('.mobile-nav')).toBeVisible();
});
```

The spread operator (`...devices['iPhone 14']`) expands all five properties
into the `use` block. Check the full device list in the Playwright source
or by running:

```bash
npx playwright show-devices
```

Commonly used presets:

```
Desktop Chrome       → 1280×720, Chrome engine
Desktop Firefox      → 1280×720, Firefox engine
Desktop Safari       → 1280×720, WebKit engine
iPhone 14            → 390×844, WebKit mobile
iPhone 14 Pro        → 393×852, WebKit mobile
Pixel 7              → 412×915, Chrome mobile
Galaxy S9+           → 320×658, Chrome mobile
iPad Pro 11          → 834×1194, WebKit tablet
```

---

## Q706.3 — How do you configure a cross-browser projects matrix?

The `projects` array in `playwright.config.ts` is the cross-browser matrix.
Each project runs the full test suite with different browser settings:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  projects: [
    // Desktop browsers
    { name: 'chromium',       use: { ...devices['Desktop Chrome']  } },
    { name: 'firefox',        use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',         use: { ...devices['Desktop Safari']  } },

    // Mobile devices
    { name: 'mobile-chrome',  use: { ...devices['Pixel 7']    } },
    { name: 'mobile-safari',  use: { ...devices['iPhone 14']  } },

    // Tablet
    { name: 'tablet',         use: { ...devices['iPad Pro 11'] } },
  ],
});
```

Running `npx playwright test` executes all tests on all six projects.
Running `npx playwright test --project=chromium` runs on Chrome only.

---

## Q706.4 — How do you avoid tripling test execution time with cross-browser testing?

Running every test on three browsers triples execution time. The practical
strategy is to run different test scopes per browser using `grep` per project:

```typescript
projects: [
  {
    name: 'chromium-full',
    use:  { ...devices['Desktop Chrome'] },
    // No grep — runs everything: smoke + regression + edge cases
  },
  {
    name: 'firefox-smoke',
    use:  { ...devices['Desktop Firefox'] },
    grep: /@smoke/,          // Only critical-path tests on Firefox
  },
  {
    name: 'webkit-smoke',
    use:  { ...devices['Desktop Safari'] },
    grep: /@smoke/,          // Only critical-path tests on WebKit
  },
  {
    name: 'mobile-smoke',
    use:  { ...devices['iPhone 14'] },
    grep: /@smoke.*@mobile/, // Only tests tagged for both smoke and mobile
  },
],
```

Result: Chrome runs 200 tests, Firefox/WebKit run 20, mobile runs 10.
Total: 250 test executions instead of 800. You still get meaningful
cross-browser coverage on the flows that matter most.

The rule: run everything on your primary browser (Chrome), run smoke tests
on secondary browsers, run touch-specific tests on mobile.

---

## Q706.5 — What is the difference between tap and click in mobile emulation?

`click()` dispatches a mouse click event. On desktop this is correct.
On a mobile-emulated page, `click()` still works for most elements — Playwright
synthesises a tap from the click.

`tap()` dispatches a genuine touch event sequence: `touchstart`, `touchend`.
Use `tap()` when:
- Testing gesture libraries that specifically listen for touch events
- The element has a `touchstart` handler that differs from the `click` handler
- You are testing swipe detection or multi-touch interactions

```typescript
test.use({ ...devices['iPhone 14'] });

test('tap and click both work for buttons', async ({ page }) => {
  await page.goto('/');

  // Both work for standard buttons
  await page.getByRole('button', { name: 'Submit' }).click();  // works
  await page.getByRole('button', { name: 'Submit' }).tap();    // also works

  // Use tap for touch-specific interactions
  await page.locator('.swipeable-card').tap();
});
```

---

## Q706.6 — How do you test locale and timezone?

Use `test.use()` or project-level `use` to set locale and timezone. These
affect JavaScript's `Intl` API — date formatting, number formatting, and
currency display:

```typescript
test.describe('German locale', () => {
  test.use({
    locale:     'de-DE',
    timezoneId: 'Europe/Berlin',
  });

  test('prices show German number format', async ({ page }) => {
    await page.goto('/pricing');
    // In de-DE: 1.000,99 (period for thousands, comma for decimal)
    await expect(page.locator('.price')).toContainText('1.000');
  });

  test('dates use German format', async ({ page }) => {
    await page.goto('/orders');
    // In de-DE: DD.MM.YYYY
    await expect(page.locator('.order-date').first()).toContainText(/\d{2}\.\d{2}\.\d{4}/);
  });
});
```

Configure locale and timezone per project for a full internationalisation matrix:

```typescript
projects: [
  { name: 'en-US', use: { locale: 'en-US', timezoneId: 'America/New_York' } },
  { name: 'de-DE', use: { locale: 'de-DE', timezoneId: 'Europe/Berlin'    } },
  { name: 'ja-JP', use: { locale: 'ja-JP', timezoneId: 'Asia/Tokyo'       } },
],
```

---

## Q706.7 — How do you test geolocation features?

Set `geolocation` and grant the `geolocation` permission in `test.use()`.
Playwright automatically accepts the browser's "Allow location" prompt:

```typescript
test.use({
  geolocation: { latitude: 51.5074, longitude: -0.1278 }, // London
  permissions:  ['geolocation'],
});

test('store locator shows nearby London stores', async ({ page }) => {
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Use My Location' }).click();

  // The browser returns the mocked geolocation
  await expect(page.locator('.store-list')).toContainText('London');
});
```

For tests that need to change location mid-test:

```typescript
test('location updates when moving', async ({ page, context }) => {
  test.use({
    geolocation: { latitude: 51.5074, longitude: -0.1278 },
    permissions: ['geolocation'],
  });

  await page.goto('/map');

  // Change location during the test
  await context.setGeolocation({ latitude: 48.8566, longitude: 2.3522 }); // Paris

  await page.getByRole('button', { name: 'Refresh Location' }).click();
  await expect(page.locator('.current-city')).toContainText('Paris');
});
```

---

## Q706.8 — What permissions can Playwright grant or deny?

`context.grantPermissions()` or the `permissions` option in `test.use()`
grants browser permissions automatically without prompting the user:

```typescript
test.use({
  permissions: ['geolocation', 'notifications', 'camera', 'microphone'],
});
```

Available permissions include: `'geolocation'`, `'notifications'`,
`'camera'`, `'microphone'`, `'background-sync'`, `'accelerometer'`,
`'gyroscope'`, `'magnetometer'`, `'clipboard-read'`, `'clipboard-write'`,
`'payment-handler'`.

To test the denied state (user clicks "Block"):

```typescript
test('shows fallback when location is denied', async ({ browser }) => {
  const context = await browser.newContext({
    // Do not include geolocation in permissions — it will be denied
  });
  const page = await context.newPage();
  await page.goto('/stores');
  await page.getByRole('button', { name: 'Use My Location' }).click();

  // App should show fallback search instead of auto-locating
  await expect(page.getByPlaceholder('Enter your postcode')).toBeVisible();
  await context.close();
});
```

---

## Q706.9 — How do you test dark mode and color scheme preferences?

```typescript
test.describe('Dark mode', () => {
  test.use({ colorScheme: 'dark' });

  test('dark theme is applied', async ({ page }) => {
    await page.goto('/');
    // Check that dark styles are active
    const bgColor = await page.evaluate(
      () => window.getComputedStyle(document.body).backgroundColor
    );
    expect(bgColor).not.toBe('rgb(255, 255, 255)'); // not white
  });

  test('dark mode screenshot matches baseline', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveScreenshot('dashboard-dark.png');
  });
});

test.describe('Light mode', () => {
  test.use({ colorScheme: 'light' });

  test('light theme is applied', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('html')).not.toHaveClass(/dark/);
  });
});
```

`colorScheme` options: `'light'`, `'dark'`, `'no-preference'`.

---

## Q706.10 — What is the Clock API and when do you use it?

`page.clock` controls the browser's concept of time — `Date.now()`,
`setTimeout`, `setInterval`, and `requestAnimationFrame`. It is used to
test time-dependent behaviour without waiting for real time to pass.

**Without Clock API:**
```typescript
test('idle timeout shows warning after 10 minutes', async ({ page }) => {
  await page.goto('/dashboard');
  await page.waitForTimeout(600_000); // ← 10 minutes! Test is unusable.
  await expect(page.getByText('Session expiring')).toBeVisible();
});
```

**With Clock API:**
```typescript
test('idle timeout shows warning after 10 minutes', async ({ page }) => {
  // Freeze time at a known point
  await page.clock.install({ time: new Date('2025-01-01T09:00:00') });
  await page.goto('/dashboard');

  // Jump forward 10 minutes instantly
  await page.clock.fastForward('10:00');

  // Assert — no real waiting
  await expect(page.getByText('Session expiring')).toBeVisible();
});
```

The test runs in milliseconds instead of 10 minutes.

---

## Q706.11 — What are the Clock API methods and what does each do?

```typescript
// Install — freeze time at a specific point, take control of all timers
await page.clock.install({ time: new Date('2025-06-15T12:00:00') });

// fastForward — advance time by duration (fires all elapsed timers instantly)
await page.clock.fastForward(5000);        // advance by 5 seconds
await page.clock.fastForward('02:30');     // advance by 2 minutes 30 seconds

// tick — same as fastForward but processes timers at each millisecond step
// (more realistic for animations and micro-timers)
await page.clock.tick(500);

// setSystemTime — move the clock to a specific moment (doesn't fire timers)
await page.clock.setSystemTime(new Date('2025-12-31T23:59:00'));

// runFor — run timers for a specified duration
await page.clock.runFor(1000);

// resume — let real time continue after installation
await page.clock.resume();
```

`fastForward` is the most common method — it fires all timers that would
have fired in the elapsed period. `setSystemTime` moves the clock without
firing timers — useful for testing date-display logic without triggering
timeout-based side effects.

---

## Q706.12 — How do you test a debounced search with the Clock API?

```typescript
test('search triggers after user stops typing', async ({ page }) => {
  await page.clock.install();
  await page.goto('/search');

  const searchInput = page.getByPlaceholder('Search products');
  await searchInput.pressSequentially('playwright');

  // Results should NOT be visible yet — debounce hasn't fired
  await expect(page.locator('.search-results')).not.toBeVisible();

  // Advance clock past the debounce window (500ms)
  await page.clock.fastForward(500);

  // Results should now appear
  await expect(page.locator('.search-results')).toBeVisible();
  await expect(page.getByText('playwright')).toBeVisible();
});
```

Without the Clock API, this test would require a real `page.waitForTimeout(500)` —
which is an anti-pattern because it adds real wait time and is fragile if
the debounce period changes.

---

## Q706.13 — How do you test date-sensitive UI features?

The Clock API lets you pin the date to test features like "Today's deals",
"Coming soon" countdowns, or date-range validation:

```typescript
test('New Year banner appears on 31 December', async ({ page }) => {
  // Set system time to New Year's Eve
  await page.clock.install({ time: new Date('2025-12-31T20:00:00') });
  await page.goto('/home');
  await expect(page.getByTestId('new-year-banner')).toBeVisible();
});

test('New Year banner is hidden in January', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-01-02T10:00:00') });
  await page.goto('/home');
  await expect(page.getByTestId('new-year-banner')).not.toBeVisible();
});

test('cannot book a date in the past', async ({ page }) => {
  await page.clock.install({ time: new Date('2025-06-15') });
  await page.goto('/bookings/new');

  const yesterday = page.getByLabel('Date');
  await yesterday.fill('2025-06-14');
  await page.getByRole('button', { name: 'Book' }).click();

  await expect(page.getByText('Date must be today or later')).toBeVisible();
});
```

---

## Q706.14 — How do you simulate network throttling for mobile performance tests?

Network throttling requires the Chrome DevTools Protocol (CDP) — Chromium only:

```typescript
test('shows loading spinner on slow connection', async ({ page }) => {
  test.use({ ...devices['Pixel 7'] });

  const cdp = await page.context().newCDPSession(page);

  // Emulate Slow 3G
  await cdp.send('Network.emulateNetworkConditions', {
    offline:             false,
    latency:             400,                       // 400ms RTT
    downloadThroughput:  ((500 * 1024) / 8),        // 500 kbps
    uploadThroughput:    ((500 * 1024) / 8),
  });

  await page.goto('/dashboard');

  // Spinner should be visible on slow connection
  await expect(page.getByTestId('loading-spinner')).toBeVisible();

  // Content should eventually load
  await expect(page.getByTestId('main-content')).toBeVisible({ timeout: 15000 });
});
```

Common presets:
- **Slow 3G:** latency 400ms, 500 kbps down/up
- **Fast 3G:** latency 100ms, 1.5 Mbps down/up
- **Offline:** `offline: true`, 0 throughput

---

## Q706.15 — How do you override a device preset for a custom viewport?

Spread the preset and override only the properties you want to change:

```typescript
// Custom large-screen iPhone
test.use({
  ...devices['iPhone 14'],
  viewport: { width: 430, height: 932 }, // iPhone 14 Pro Max size
});

// Desktop Chrome with 1440px width
test.use({
  ...devices['Desktop Chrome'],
  viewport: { width: 1440, height: 900 },
});

// Desktop Chrome with forced touch support (for hybrid touch/pointer devices)
test.use({
  ...devices['Desktop Chrome'],
  hasTouch: true,
  viewport: { width: 1280, height: 800 },
});
```

Custom device in `playwright.config.ts`:

```typescript
{
  name: 'custom-mobile',
  use: {
    viewport:          { width: 360, height: 780 },
    userAgent:         'Mozilla/5.0 (Android 13; Mobile)',
    deviceScaleFactor: 2,
    hasTouch:          true,
    isMobile:          true,
  },
}
```

---

## Q706.16 — What is the difference between chromium, Chrome, and Chrome Canary in Playwright?

Playwright ships its own browser builds called "browser engines". The
`channel` option selects an installed system browser instead:

```typescript
// Playwright's own Chromium build (default, no install needed)
{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }

// Installed Google Chrome (must be installed on the machine)
{ name: 'chrome', use: { channel: 'chrome', ...devices['Desktop Chrome'] } }

// Microsoft Edge (must be installed)
{ name: 'edge', use: { channel: 'msedge', ...devices['Desktop Chrome'] } }

// Chrome Beta channel
{ name: 'chrome-beta', use: { channel: 'chrome-beta' } }
```

Use Playwright's Chromium for CI — it is pinned to a known version that
is always available. Use `channel: 'chrome'` for tests that must verify
behaviour on the exact Chrome version your users have. Use `channel: 'msedge'`
for enterprises where Edge is the standard browser.

---

## Q706.17 — Write a complete cross-browser projects matrix for a production team.

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

const isCI = !!process.env.CI;

export default defineConfig({
  workers: isCI ? 4 : 2,
  retries: isCI ? 1 : 0,

  projects: [
    // ── Auth setup (runs before all test projects) ────────────────────
    {
      name:      'setup',
      testMatch: /.*\.setup\.ts/,
    },

    // ── Primary browser — full suite ──────────────────────────────────
    {
      name:         'chromium',
      use:          { ...devices['Desktop Chrome'],   storageState: 'playwright/.auth/user.json' },
      dependencies: ['setup'],
    },

    // ── Secondary browsers — smoke tests only ─────────────────────────
    {
      name:         'firefox',
      use:          { ...devices['Desktop Firefox'],  storageState: 'playwright/.auth/user.json' },
      grep:         /@smoke/,
      dependencies: ['setup'],
    },
    {
      name:         'webkit',
      use:          { ...devices['Desktop Safari'],   storageState: 'playwright/.auth/user.json' },
      grep:         /@smoke/,
      dependencies: ['setup'],
    },

    // ── Mobile — touch-tagged tests only ──────────────────────────────
    {
      name:         'mobile-chrome',
      use:          { ...devices['Pixel 7'],          storageState: 'playwright/.auth/user.json' },
      grep:         /@mobile/,
      dependencies: ['setup'],
    },
    {
      name:         'mobile-safari',
      use:          { ...devices['iPhone 14'],        storageState: 'playwright/.auth/user.json' },
      grep:         /@mobile/,
      dependencies: ['setup'],
    },

    // ── Localisation projects (nightly only) ──────────────────────────
    ...(isCI ? [{
      name: 'de-DE',
      use:  { ...devices['Desktop Chrome'], locale: 'de-DE', timezoneId: 'Europe/Berlin',
               storageState: 'playwright/.auth/user.json' },
      grep: /@i18n/,
      dependencies: ['setup'] as string[],
    }] : []),
  ],
});
```

---

## Q706.18 — In your project, how did you configure the cross-browser matrix?

In our OrangeHRM framework, the cross-browser matrix was deliberately
minimal for the demo project context. We ran three projects: `chromium`
(full suite, every test), `firefox` (smoke tests tagged `@smoke`), and
`mobile-chrome` using `Pixel 7` (mobile-tagged tests for the responsive
layout verification of the Leave module).

The key decision was not to run the full 180-test regression suite on
Firefox and WebKit. OrangeHRM is a server-rendered application with minimal
JavaScript — the main cross-browser risk is CSS layout, not JavaScript
behaviour. Running the 20 smoke tests on Firefox gave 95% of the cross-browser
value at 10% of the cost.

For the mobile project, we had to adjust two page object methods. The
date picker in the Leave module uses a different tap interaction on mobile —
the dropdown did not open on a standard `click()`. Switching to `tap()`
in the `MobileLeavePage` subclass fixed it. This is the exact kind of
platform-specific difference that justifies having a mobile project at all.

The Clock API was used in one test: verifying that a leave request with a
past date is rejected. Instead of relying on today's date (which changes
daily and makes tests brittle), we use `page.clock.install()` to pin the
date to a known value, then assert that a date one day prior is rejected.

---

## Chapter Summary

- Device emulation sets five properties simultaneously: viewport, User Agent, Device Scale Factor (DPR), `hasTouch`, and `isMobile` — not just window size.
- Use `...devices['iPhone 14']` (spread) to apply a full device preset; override individual properties as needed.
- The cross-browser projects matrix in `playwright.config.ts` defines which browsers and devices run which tests.
- Use `grep: /@smoke/` per project to avoid running every test on every browser — run full suite on Chrome, smoke only on Firefox/WebKit.
- `tap()` fires touch events; `click()` fires mouse events. Use `tap()` for touch-specific interactions and gesture libraries.
- `locale` and `timezoneId` control JavaScript's `Intl` API output — date formatting, number formatting, currency display.
- `geolocation` + `permissions: ['geolocation']` mocks the browser location API; use `context.setGeolocation()` to change location mid-test.
- The Clock API (`page.clock.install()`, `fastForward()`, `setSystemTime()`) controls `Date.now()` and all browser timers — eliminates `waitForTimeout` for time-based tests.
- `fastForward` fires all elapsed timers instantly; `setSystemTime` moves the clock without firing timers.
- Network throttling requires CDP (`Network.emulateNetworkConditions`) and only works on Chromium.
