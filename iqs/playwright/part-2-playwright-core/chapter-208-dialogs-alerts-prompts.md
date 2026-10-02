# Chapter 208 — Dialogs — Alerts, Confirms & Prompts


This chapter covers page navigation and multi-tab/multi-window handling.
Interviewers test this because multi-tab scenarios (links that open new tabs,
OAuth popups) are a common source of test failures in automation suites that
were not designed to handle them.

---

## Q208.1 — How do you navigate to a URL in Playwright?

```typescript
// Navigate to an absolute URL
await page.goto('https://example.com/login');

// Navigate using baseURL from playwright.config.ts (relative path)
await page.goto('/login'); // resolves to baseURL + /login

// With options
await page.goto('/dashboard', {
  waitUntil: 'domcontentloaded', // don't wait for all resources
  timeout:   30_000,
});

// Navigate and wait for a specific API call to complete
await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/init')),
  page.goto('/dashboard'),
]);
```

Always set `baseURL` in `playwright.config.ts`. Using relative paths in
`goto()` makes tests portable — change the base URL in one place, not in
every test file.

---

## Q208.2 — What is the difference between page.goto and page.reload?

`page.goto(url)` navigates to a new URL. The current page is replaced.

`page.reload()` refreshes the current page — same as pressing F5.
It reloads all resources for the current URL.

```typescript
await page.goto('/settings');        // navigate to settings
await page.reload();                 // refresh settings page

// Reload options
await page.reload({ waitUntil: 'networkidle' });

// Going back/forward in history
await page.goBack();    // browser back button
await page.goForward(); // browser forward button
```

Use `reload()` in tests that verify cache behaviour, session restoration
after refresh, or form state persistence. Most tests use `goto()`.

---

## Q208.3 — When do new tabs or popup windows appear in test automation?

New tabs or popup windows appear in three situations:

**Links with `target="_blank"`** — clicking a link opens a new tab.

**`window.open()` calls** — JavaScript that programmatically opens a new window.

**OAuth and SSO flows** — clicking "Login with Google" often opens a popup
window for authentication.

**Payment providers** — checkout flows that redirect to Stripe, PayPal, or
similar providers sometimes open in a popup.

All of these require `context.waitForEvent('page')` to capture the new page
before it opens.

---

## Q208.4 — How does your project handle multi-page or multi-tab scenarios?

In our project, multi-tab scenarios appear in two places: OAuth login and
invoice preview (which opens in a new tab).

For OAuth, we skip the actual OAuth flow in most tests by using
`storageState` — pre-authenticated sessions stored on disk. The OAuth
popup test exists as a dedicated test in the auth suite.

For invoice preview:

```typescript
// Page object method that handles the new tab
async openInvoicePreview(orderId: string): Promise {
  const newTabPromise = this.page.context().waitForEvent('page');
  await this.page.getByTestId(`invoice-${orderId}`).click();
  const invoicePage = await newTabPromise;
  await invoicePage.waitForLoadState('domcontentloaded');
  return invoicePage;
}

// In the test
const invoicePage = await ordersPage.openInvoicePreview('ORD-001');
await expect(invoicePage.getByRole('heading')).toHaveText(/Invoice #ORD-001/);
await invoicePage.close();
```

---

## Q208.5 — What is waitForNavigation and when is it needed?

`page.waitForNavigation()` was the older API for waiting after an action
that causes a navigation (like clicking a submit button that redirects).

In current Playwright, it has been superseded by more explicit alternatives:

```typescript
// Old way — waitForNavigation (still works but discouraged)
await Promise.all([
  page.waitForNavigation(),
  page.getByRole('button', { name: 'Sign In' }).click(),
]);

// Better — waitForURL
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('/dashboard');

// Best — expect assertion that retries
await page.getByRole('button', { name: 'Sign In' }).click();
await expect(page).toHaveURL('/dashboard');
```

`waitForNavigation()` is still in Playwright's API but the docs recommend
`waitForURL` or `expect(page).toHaveURL()` instead. They are more explicit
about what URL you are waiting for.

---

## Q208.6 — What does the waitUntil option in page.goto control?

`waitUntil` defines what Playwright waits for before `goto()` resolves:

**`'load'`** (default) — waits for the `load` event. All resources (images,
scripts, CSS) have been downloaded.

**`'domcontentloaded'`** — waits for the DOM to be parsed. Faster than `load`
because it does not wait for images and third-party scripts.

**`'networkidle'`** — waits until there are no more than 0 network requests
for 500ms. Can be slow or unreliable on apps with polling or WebSocket connections.

**`'commit'`** — waits only for the initial response to arrive. The page is
not yet loaded. Fastest option.

```typescript
await page.goto('/dashboard');                                  // default: load
await page.goto('/dashboard', { waitUntil: 'domcontentloaded' }); // faster
await page.goto('/dashboard', { waitUntil: 'networkidle' });       // slowest
await page.goto('/dashboard', { waitUntil: 'commit' });            // fastest
```

**Recommended:** use `'domcontentloaded'` for most pages and follow with an
explicit assertion on a key element. Avoid `'networkidle'` — it is
unreliable on apps with background network activity.

---

## Q208.7 — What is the difference between page.waitForURL and expect(page).toHaveURL?

Both wait for the page URL to match a pattern. The difference is in what
they represent in the test.

`page.waitForURL(pattern)` — a navigation utility. It waits for the URL
to change and match the pattern. Does not make an assertion about the test.

`expect(page).toHaveURL(pattern)` — a test assertion. It retries until the
URL matches or times out. If it times out, the test fails with an assertion
error.

```typescript
// waitForURL — utility wait, not an assertion
await page.getByRole('button', { name: 'Sign In' }).click();
await page.waitForURL('/dashboard');

// toHaveURL — assertion, explicitly part of the test contract
await page.getByRole('button', { name: 'Sign In' }).click();
await expect(page).toHaveURL(/\/dashboard/);
```

**Use `expect(page).toHaveURL()`** when the URL is something the test should
verify. Use `waitForURL()` when you just need to wait for navigation to
complete before interacting with the new page.

In practice, `expect(page).toHaveURL()` is preferred because it also serves
as documentation of what the test expects to happen.

---

## Q208.8 — What is the difference between page.goBack and page.goto?

`page.goBack()` — equivalent to pressing the browser's Back button.
Navigates to the previous URL in the browser history.

`page.goto(url)` — navigates to a new URL regardless of history.

```typescript
await page.goto('/products');      // navigate to products
await page.goto('/products/123');  // navigate to product detail

await page.goBack();               // back to /products
// Same as user clicking back button

await page.goto('/orders');        // navigate directly (history irrelevant)
```

`goBack()` tests browser history behaviour — for example, verifying that
a form is correctly restored when navigating back, or that authentication
state persists across history navigation. Most tests use `goto()`.

---

## Q208.9 — What is the difference between a new tab and a popup in Playwright?

Both are captured using `context.waitForEvent('page')` or `page.waitForEvent('popup')`.
The distinction is in how they are opened:

**New tab** — opened from the context (e.g., link click, `window.open()`).
Captured by `context.waitForEvent('page')`.

**Popup** — specifically a window opened with restricted dimensions (e.g.,
a login popup, payment form). Captured by `page.waitForEvent('popup')`.

In practice, Playwright treats both as new `Page` objects. The capture pattern
is the same:

```typescript
// New tab (any new page in the context)
const newPage = await context.waitForEvent('page');

// Popup specifically from this page
const popup = await page.waitForEvent('popup');
```

Both return a `Page` object. After capturing, use the same assertions and
interactions as any other page.

---

## Q208.10 — When do you need to handle multiple pages explicitly?

You need explicit multi-page handling when:

- A link or button opens a new browser tab (`target="_blank"`)
- An action opens a popup window (`window.open()` with size constraints)
- An OAuth or SSO flow redirects to a third-party authentication page
- A payment flow opens a provider page in a new window

You do NOT need explicit handling when:
- Navigation happens in the same tab (normal SPA navigation, form submissions)
- The test uses `storageState` to bypass OAuth (no popup is opened)

```typescript
// When new tab is opened — must capture it
const [newTab] = await Promise.all([
  context.waitForEvent('page'),
  page.getByRole('link', { name: 'Open Preview' }).click(),
]);
await newTab.waitForLoadState();
```

---

## Q208.11 — What is BrowserContext and how does it relate to Page?

A `BrowserContext` is an isolated browser session. It has its own cookies,
local storage, session storage, and cache — completely separate from other
contexts. It works like an incognito window.

A `Page` is a single browser tab inside a context. One context can hold
multiple pages (tabs).

```
Browser (one process)
└── BrowserContext A (isolated session — User 1)
    ├── Page 1 (tab 1)
    └── Page 2 (tab 2)
└── BrowserContext B (isolated session — User 2)
    └── Page 1 (tab 1)
```

By default, Playwright creates one fresh `BrowserContext` per test. This means
every test starts with clean cookies and storage — no test contaminates another.

You rarely create contexts manually. The `context` fixture from `@playwright/test`
manages it automatically.

---

## Q208.12 — How do you get all open pages in a BrowserContext?

`context.pages()` returns an array of all `Page` objects currently open
in the context.

```typescript
// Get all open pages
const pages = context.pages();
console.log(`Open tabs: ${pages.length}`);

// Find a specific page by URL
const dashboard = pages.find(p => p.url().includes('/dashboard'));

// Iterate through all pages
for (const p of pages) {
  console.log(p.url());
}
```

This is useful when multiple tabs are opened during a test and you need to
switch focus to a specific one. In most tests, you work with a single page
and use `context.waitForEvent('page')` to capture new ones as they open.

---

## Q208.13 — What is waitForLoadState and when should you use it?

`page.waitForLoadState(state)` waits for the page to reach a specific
loading stage after navigation.

```typescript
await page.goto('/dashboard');
await page.waitForLoadState('networkidle'); // no network requests for 500ms
```

The available states are the same as `waitUntil` in `goto()`:
- `'load'` — fires when all resources are downloaded
- `'domcontentloaded'` — fires when HTML is parsed
- `'networkidle'` — fires when the network is idle for 500ms

**When to use it:** After actions that trigger background navigation (like
clicking a link without using `goto()`), or when you need to wait for all
API calls to complete before asserting:

```typescript
// After clicking a link
await page.getByRole('link', { name: 'Reports' }).click();
await page.waitForLoadState('domcontentloaded');
await expect(page.getByRole('heading')).toHaveText('Reports');
```

**When NOT to use it:** Do not default to `waitForLoadState('networkidle')` on
every page. Apps with WebSocket connections or background polling will never
reach networkidle — the call will time out.

---

## Q208.14 — How do you close pages and contexts properly?

Close pages and contexts explicitly in tests to free browser resources.

```typescript
// Close a page
await newTab.close();

// Close a context (closes all pages in it)
await context.close();
```

In `@playwright/test`, the default `page` and `context` fixtures are
automatically closed after each test. You only need explicit `close()` calls
for extra pages or contexts you create manually inside the test.

```typescript
test('handles invoice tab', async ({ page, context }) => {
  // Open invoice in new tab
  const newTabPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'View Invoice' }).click();
  const invoiceTab = await newTabPromise;

  await expect(invoiceTab.getByRole('heading')).toContainText('Invoice');

  // Close the extra tab explicitly — the main page fixture is closed automatically
  await invoiceTab.close();
});
```

---

## Q208.15 — What is the page.on('popup') event?

`page.on('popup')` listens for windows opened via `window.open()` from the
current page. It fires with the new `Page` object before the popup has loaded.

```typescript
// Listen for popup
const popupPromise = page.waitForEvent('popup');
await page.getByRole('button', { name: 'Open Help' }).click();
const popup = await popupPromise;
await popup.waitForLoadState();

// Now interact with popup
await expect(popup).toHaveURL(/\/help/);
await popup.close();
```

The key rule: **register the listener before the action that opens the popup**,
not after. If you register it after, the popup may already have opened and
fired before your listener was attached — and you will miss it.

---

## Q208.16 — How do you handle an OAuth popup in Playwright?

OAuth popups are the most common multi-page scenario. The best practice is
to avoid them in most tests by using `storageState` for pre-authenticated
sessions. For the dedicated auth test that actually tests OAuth:

```typescript
test('OAuth login via popup', async ({ page, context }) => {
  await page.goto('/login');

  // Capture the popup before clicking
  const popupPromise = context.waitForEvent('page');
  await page.getByRole('button', { name: 'Login with Google' }).click();
  const oauthPopup = await popupPromise;

  // Wait for OAuth page to load
  await oauthPopup.waitForLoadState('domcontentloaded');

  // Fill OAuth form in popup
  await oauthPopup.getByLabel('Email').fill('testuser@gmail.com');
  await oauthPopup.getByRole('button', { name: 'Next' }).click();
  await oauthPopup.getByLabel('Password').fill('test-password');
  await oauthPopup.getByRole('button', { name: 'Sign in' }).click();

  // Popup should close after OAuth completes
  // Main page should redirect to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

In practice, OAuth login is tested once. All other tests use `storageState`
to skip the OAuth popup entirely.

---

## Q208.17 — What is page.waitForEvent and when do you use it?

`page.waitForEvent(eventName)` returns a Promise that resolves when the
specified event fires. It is the primary way to capture dynamically opened
pages, popups, downloads, and dialogs.

```typescript
// Wait for a new page (new tab)
const newPage = await page.waitForEvent('page');

// Wait for a popup
const popup = await page.waitForEvent('popup');

// Wait for a download
const download = await page.waitForEvent('download');

// Wait for a specific dialog
const dialog = await page.waitForEvent('dialog');
await dialog.accept();
```

**Always combine with the triggering action** using `Promise.all` or the
promise-before-click pattern:

```typescript
// CORRECT — start listening BEFORE the action
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

// WRONG — might miss the event if it fires before you listen
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await page.waitForEvent('download'); // may time out
```

---

## Q208.18 — In your project, what was the most complex navigation scenario you handled?

In our project, the most complex scenario was a checkout flow that spanned
three pages and opened a payment popup.

The flow:
1. Cart page → click "Proceed to Checkout" → navigate to checkout page
2. Checkout page → click "Pay with Stripe" → opens Stripe popup
3. Fill card details in popup → submit → popup closes → main page redirects
   to order confirmation

```typescript
async completeCheckout(cardDetails: CardDetails): Promise<string> {
  // Step 1: Navigate from cart to checkout
  await this.page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await expect(this.page).toHaveURL(/\/checkout/);

  // Step 2: Capture Stripe popup before clicking Pay
  const stripePopup = this.page.context().waitForEvent('page');
  await this.page.getByRole('button', { name: 'Pay with Stripe' }).click();
  const stripe = await stripePopup;
  await stripe.waitForLoadState('domcontentloaded');

  // Step 3: Fill card details in Stripe popup
  const cardFrame = stripe.frameLocator('iframe[name="card-element"]');
  await cardFrame.getByLabel('Card number').fill(cardDetails.number);
  await cardFrame.getByLabel('Expiration date').fill(cardDetails.expiry);
  await cardFrame.getByLabel('CVC').fill(cardDetails.cvc);
  await stripe.getByRole('button', { name: 'Pay' }).click();

  // Step 4: Wait for popup to close and main page to redirect
  await stripe.waitForEvent('close');
  await expect(this.page).toHaveURL(/\/order-confirmation/);

  // Return order ID from confirmation page
  return await this.page.getByTestId('order-id').textContent() ?? '';
}
```

The key lesson: always capture popups with `waitForEvent` before clicking,
and chain `waitForLoadState` after capture before interacting.

---

## Chapter Summary

- `page.goto(url)` is the primary navigation method. Always set `baseURL` in config and use relative paths.
- `waitUntil` on `goto()` controls what load stage Playwright waits for. Prefer `'domcontentloaded'` over `'networkidle'` for most pages.
- New tabs and popups are captured with `context.waitForEvent('page')` or `page.waitForEvent('popup')` — register the listener BEFORE the click.
- `BrowserContext` is an isolated session (cookies, storage). One context per test is the default in `@playwright/test`.
- `expect(page).toHaveURL()` is preferred over `waitForURL()` because it also acts as an assertion.
- For OAuth and SSO: test the flow once using popup capture; bypass it in all other tests using `storageState`.
