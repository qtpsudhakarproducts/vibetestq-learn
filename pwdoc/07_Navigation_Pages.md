# Chapter 07: Navigation & Working with Pages (Complete Guide)

## The Concept of Navigation & Pages

The web is a collection of pages linked together. A typical user journey involves moving between different URLs, opening new tabs, and managing multiple windows. In automation, handling these transitions reliably is crucial for building end-to-end flows.

**Purpose**: This chapter covers how to move between pages, manage multiple tabs/contexts, and ensure the browser state is correctly tracked during complex journeys.

**Why is it required?**
1. **User Flow Simulation**: To test multi-step processes like "Sign Up -> Email Verification -> Login".
2. **Performance**: To understand and wait for the correct "Load States" (DOMContentLoaded vs Load vs NetworkIdle).
3. **Isolation**: To leverage Playwright's "Browser Contexts" for testing multiple users or incognito-like fresh starts.

## Basic Navigation

### page.goto()

The most common way to navigate to a URL:

```typescript
// Basic navigation
await page.goto('https://example.com');

// Navigate to relative URL (requires baseURL in config)
await page.goto('/dashboard');

// Navigate with full URL
await page.goto('https://example.com/products?category=books');
```

### When Navigation Completes

By default, `goto()` waits until the page reaches the `load` event:

```
Timeline of page load:
├─ 0ms:    Navigation starts
├─ 100ms:  HTML downloaded
├─ 500ms:  DOM constructed (domcontentloaded)
├─ 1000ms: Images/CSS loaded (load) ← goto() returns here
└─ 1500ms: All resources loaded (networkidle)
```

---

## Navigation Options

### waitUntil Option

Control when navigation is considered complete:

```typescript
// Wait for 'load' event (default)
await page.goto('https://example.com', { waitUntil: 'load' });
// Waits for: window.onload event

// Wait for 'domcontentloaded' (faster)
await page.goto('https://example.com', { waitUntil: 'domcontentloaded' });
// Waits for: DOMContentLoaded event
// Use when: You don't need images/stylesheets

// Wait for 'networkidle' (slowest, most complete)
await page.goto('https://example.com', { waitUntil: 'networkidle' });
// Waits for: No network connections for 500ms
// Use when: Page has delayed requests, analytics

// Wait for 'commit' (fastest, least reliable)
await page.goto('https://example.com', { waitUntil: 'commit' });
// Waits for: Navigation committed (response received)
// Use when: You'll wait for specific elements anyway
```

### waitUntil Comparison

| Option | Speed | Reliability | Use Case |
|--------|-------|-------------|----------|
| `commit` | ⚡ Fastest | ⚠️ Least reliable | When you'll wait for elements |
| `domcontentloaded` | 🏃 Fast | ✅ Good | Most SPAs, fast pages |
| `load` | 🚶 Medium | ✅ Very good | Default, balanced |
| `networkidle` | 🐌 Slow | ✅ Most reliable | Analytics, delayed requests |

### Timeout Option

```typescript
// Custom navigation timeout
await page.goto('https://slow-site.com', { timeout: 60000 });
// Waits up to 60 seconds

// Disable timeout (not recommended)
await page.goto('https://example.com', { timeout: 0 });

// Default timeout: 30 seconds (from config)
```

### referer Option

```typescript
// Set referer header
await page.goto('https://example.com', {
  referer: 'https://google.com'
});

// Use case: Testing referral tracking, analytics
```

---

## Waiting for Navigation

### waitForURL()

Wait for URL to match a pattern:

```typescript
// Wait for exact URL
await page.waitForURL('https://example.com/dashboard');

// Wait for URL pattern
await page.waitForURL('**/dashboard');

// Wait for regex
await page.waitForURL(/\/dashboard$/);

// With timeout
await page.waitForURL('**/dashboard', { timeout: 10000 });
```

### Navigation After Actions

```typescript
// Click link and wait for navigation
await page.click('a[href="/next-page"]');
await page.waitForURL('**/next-page');

// Modern approach (preferred)
await page.getByRole('link', { name: 'Next Page' }).click();
await expect(page).toHaveURL(/\/next-page$/);

// Form submission
await page.click('button[type="submit"]');
await page.waitForURL('**/success');
```

### waitForLoadState()

Wait for specific load state:

```typescript
// Wait for page to be fully loaded
await page.waitForLoadState('load');

// Wait for DOM to be ready
await page.waitForLoadState('domcontentloaded');

// Wait for no network activity
await page.waitForLoadState('networkidle');

// Common pattern: Wait after navigation
await page.goto('/');
await page.waitForLoadState('networkidle');
await page.click('button');
```

---

## Multiple Pages and Tabs

### Opening New Pages

```typescript
// Create new page in same context
const newPage = await context.newPage();
await newPage.goto('https://example.com');

// Use the new page
await newPage.fill('#search', 'query');

// Close when done
await newPage.close();
```

### Handling Popups

```typescript
// Listen for popup before clicking
const popupPromise = page.waitForEvent('popup');
await page.click('a[target="_blank"]');
const popup = await popupPromise;

// Interact with popup
await popup.waitForLoadState();
await popup.fill('#username', 'user');
await popup.click('#submit');

// Close popup
await popup.close();
```

### Multiple Pages Example

```typescript
test('compare products in multiple tabs', async ({ context, page }) => {
  // Main page
  await page.goto('/products');
  
  // Open product 1 in new tab
  const product1Promise = context.waitForEvent('page');
  await page.click('a[data-product="1"]');
  const product1Page = await product1Promise;
  await product1Page.waitForLoadState();
  
  // Open product 2 in new tab
  const product2Promise = context.waitForEvent('page');
  await page.click('a[data-product="2"]');
  const product2Page = await product2Promise;
  await product2Page.waitForLoadState();
  
  // Compare prices
  const price1 = await product1Page.locator('.price').textContent();
  const price2 = await product2Page.locator('.price').textContent();
  
  console.log('Product 1:', price1);
  console.log('Product 2:', price2);
  
  // Cleanup
  await product1Page.close();
  await product2Page.close();
});
```

### Getting All Pages

```typescript
// Get all open pages
const pages = context.pages();
console.log('Open pages:', pages.length);

// Iterate through pages
for (const page of pages) {
  console.log('URL:', page.url());
  console.log('Title:', await page.title());
}

// Find specific page
const dashboardPage = pages.find(p => p.url().includes('/dashboard'));
```

---

## Browser Contexts

### What is a Browser Context?

A browser context is like an **incognito window**—isolated from other contexts with its own:
- Cookies
- Local storage
- Session storage
- Cache
- Permissions

### Context Hierarchy

```
Browser (Shared)
├── Context 1 (Isolated)
│   ├── Page 1
│   ├── Page 2
│   └── Page 3
├── Context 2 (Isolated)
│   ├── Page 1
│   └── Page 2
└── Context 3 (Isolated)
    └── Page 1
```

### Creating Contexts

```typescript
// Create new context
const context = await browser.newContext();

// Create page in context
const page = await context.newPage();

// Use the page
await page.goto('https://example.com');

// Close context (closes all pages)
await context.close();
```

### Context Options

```typescript
// Create context with options
const context = await browser.newContext({
  // Viewport size
  viewport: { width: 1280, height: 720 },
  
  // User agent
  userAgent: 'My Custom User Agent',
  
  // Geolocation
  geolocation: { longitude: -122.4194, latitude: 37.7749 },
  permissions: ['geolocation'],
  
  // Locale and timezone
  locale: 'de-DE',
  timezoneId: 'Europe/Berlin',
  
  // Color scheme
  colorScheme: 'dark',
  
  // HTTP credentials
  httpCredentials: {
    username: 'user',
    password: 'pass'
  },
  
  // Extra HTTP headers
  extraHTTPHeaders: {
    'X-Custom-Header': 'value'
  },
  
  // Offline mode
  offline: false,
  
  // Storage state (cookies, localStorage)
  storageState: 'auth.json'
});
```

### Multiple Logged-In Users

```typescript
test('multiple users simultaneously', async ({ browser }) => {
  // User 1 context
  const user1Context = await browser.newContext({
    storageState: 'user1-auth.json'
  });
  const user1Page = await user1Context.newPage();
  await user1Page.goto('/dashboard');
  
  // User 2 context
  const user2Context = await browser.newContext({
    storageState: 'user2-auth.json'
  });
  const user2Page = await user2Context.newPage();
  await user2Page.goto('/dashboard');
  
  // Both users are logged in simultaneously!
  await expect(user1Page.locator('.username')).toHaveText('User 1');
  await expect(user2Page.locator('.username')).toHaveText('User 2');
  
  // Cleanup
  await user1Context.close();
  await user2Context.close();
});
```

---

## Page Events

### Listening to Events

```typescript
// Page load event
page.on('load', () => {
  console.log('Page loaded!');
});

// DOM content loaded
page.on('domcontentloaded', () => {
  console.log('DOM ready!');
});

// Console messages
page.on('console', msg => {
  console.log('Browser console:', msg.text());
});

// Page errors
page.on('pageerror', error => {
  console.error('Page error:', error);
});

// Request events
page.on('request', request => {
  console.log('Request:', request.url());
});

// Response events
page.on('response', response => {
  console.log('Response:', response.url(), response.status());
});

// Dialog events (alert, confirm, prompt)
page.on('dialog', async dialog => {
  console.log('Dialog:', dialog.message());
  await dialog.accept();
});

// Popup events
page.on('popup', async popup => {
  console.log('Popup opened:', popup.url());
});

// Close event
page.on('close', () => {
  console.log('Page closed!');
});
```

### Event Example: Log All Requests

```typescript
test('log all network requests', async ({ page }) => {
  const requests: string[] = [];
  
  page.on('request', request => {
    requests.push(request.url());
  });
  
  await page.goto('https://example.com');
  
  console.log('Total requests:', requests.length);
  console.log('Requests:', requests);
});
```

---

## Navigation Methods

### Basic Navigation

```typescript
// Go to URL
await page.goto('https://example.com');

// Go back
await page.goBack();

// Go forward
await page.goForward();

// Reload page
await page.reload();

// Reload with options
await page.reload({ waitUntil: 'networkidle' });
```

### Navigation with Options

```typescript
// Go back and wait
await page.goBack({ waitUntil: 'networkidle' });

// Go forward with timeout
await page.goForward({ timeout: 10000 });

// Reload ignoring cache
await page.reload({ waitUntil: 'load' });
```

### Checking Navigation State

```typescript
// Get current URL
const url = page.url();
console.log('Current URL:', url);

// Get page title
const title = await page.title();
console.log('Page title:', title);

// Check if navigated
if (page.url().includes('/dashboard')) {
  console.log('On dashboard');
}
```

---

## Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO: Use baseURL in config
// playwright.config.ts
export default defineConfig({
  use: {
    baseURL: 'https://example.com'
  }
});
// Test file
await page.goto('/dashboard'); // Clean!

// ❌ DON'T: Hardcode full URLs everywhere
await page.goto('https://example.com/dashboard');

// ✅ DO: Wait for specific elements after navigation
await page.goto('/dashboard');
await expect(page.locator('.dashboard')).toBeVisible();

// ❌ DON'T: Assume page is ready after goto
await page.goto('/dashboard');
await page.click('.button'); // Might fail!

// ✅ DO: Use waitForURL for navigation assertions
await page.click('a[href="/next"]');
await page.waitForURL('**/next');

// ❌ DON'T: Use hard waits
await page.click('a[href="/next"]');
await page.waitForTimeout(1000);

// ✅ DO: Handle popups before triggering them
const popupPromise = page.waitForEvent('popup');
await page.click('a[target="_blank"]');
const popup = await popupPromise;

// ❌ DON'T: Click then try to get popup
await page.click('a[target="_blank"]');
const popup = await page.waitForEvent('popup'); // Too late!

// ✅ DO: Close contexts/pages when done
await context.close();

// ❌ DON'T: Leave contexts open
// Memory leak!
```

### Navigation Patterns

**Pattern 1: Login and Navigate**
```typescript
test('login and navigate to dashboard', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'user');
  await page.fill('#password', 'pass');
  await page.click('button[type="submit"]');
  
  // Wait for navigation
  await page.waitForURL('**/dashboard');
  await expect(page.locator('.welcome')).toBeVisible();
});
```

**Pattern 2: Multi-Step Navigation**
```typescript
test('navigate through wizard', async ({ page }) => {
  await page.goto('/wizard/step1');
  await page.fill('#name', 'John');
  await page.click('button:has-text("Next")');
  
  await page.waitForURL('**/step2');
  await page.fill('#email', 'john@example.com');
  await page.click('button:has-text("Next")');
  
  await page.waitForURL('**/step3');
  await page.click('button:has-text("Submit")');
  
  await page.waitForURL('**/success');
  await expect(page.locator('.success')).toBeVisible();
});
```

**Pattern 3: Handle External Links**
```typescript
test('handle external link', async ({ context, page }) => {
  await page.goto('/');
  
  const [newPage] = await Promise.all([
    context.waitForEvent('page'),
    page.click('a[href="https://external.com"]')
  ]);
  
  await newPage.waitForLoadState();
  expect(newPage.url()).toContain('external.com');
  await newPage.close();
});
```

**Summary**: You now understand navigation, multiple pages, browser contexts, and how to handle complex navigation scenarios. The next chapter covers iframes and browser dialogs.
