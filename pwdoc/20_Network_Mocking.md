# Chapter 20: Network Mocking & Interception (Complete Guide)

## The Concept of Network Interception

Playwright sits between the browser and the internet. This unique position allows you to intercept every network request and response. **Network Mocking** lets you simulate different server behaviors, block heavy resources, or "mock" responses to test the UI in isolation.

**Purpose**: This chapter covers how to control the network layer to speed up tests, simulate edge cases (like 500 errors), and test the frontend without a live backend.

**Why is it required?**
1. **Isolation**: To test the UI logic independently of the backend being available or stable.
2. **Edge Case Coverage**: To simulate rare scenarios like network timeouts, DNS failures, or specific API error codes without manual server configuration.
3. **Speed**: To block heavy resources like images, advertisements, or tracking scripts that don't add value to the automation.

### Network Monitoring & Analysis

Passive network monitoring allows you to observe traffic without interfering. This is useful for performance checks or verifying analytics calls.

```typescript
test('monitor network performance', async ({ page }) => {
    // Listen to all requests
    page.on('request', request => {
        console.log(`>> Request: ${request.method()} ${request.url()}`);
    });

    // Listen to responses and check timing
    page.on('response', response => {
        const timing = response.timing();
        console.log(`<< Response: ${response.url()} took ${timing.responseEnd - timing.requestStart}ms`);
    });

    await page.goto('https://example.com');
});
```

### The Power of Network Control

Playwright sits between the browser and the internet. Use this to:
1. **Speed up tests**: Block images/analytics.
2. **Deflake tests**: Wait for specific API calls (`waitForResponse`).
3. **Test Edge Cases**: Simulate 500 Errors or delayed APIs.
4. **Isolate Frontend**: Test UI logic without a real backend.

---

## Mocking Responses (The 'route' Method)

You can tell Playwright: "If the browser asks for URL X, don't go to the internet. Give it this JSON instead."

### Basic JSON Mocking

```typescript
test('mock user profile', async ({ page }) => {
  // Intecept GET requests to */api/user
  await page.route('**/api/user', async route => {
    // Fulfill with fake data
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ name: 'Test User', role: 'admin' })
    });
  });

  await page.goto('/profile');
  await expect(page.getByText('Test User')).toBeVisible();
});
```

### Mocking from Files (Fixtures)

For large JSONs, don't inline them. Load from a file.

```typescript
import path from 'path';

await page.route('**/api/products', route => {
  route.fulfill({
    path: path.join(__dirname, 'mocks/products.json')
  });
});
```

### Aborting Requests (Blocking)

Speed up tests by blocking heavy resources (images, fonts, trackers).

```typescript
// Block all images
await page.route('**/*.{png,jpg,jpeg,svg}', route => route.abort());

// Block Google Analytics
await page.route('**/google-analytics.com/**', route => route.abort());
```

---

## Advanced Mocking Patterns

### Dynamic Mocking (Logic inside handlers)

You can decide what to return based on the request method or body.

```typescript
await page.route('**/api/todos', async route => {
  const request = route.request();
  
  if (request.method() === 'POST') {
    // Mock the Creation
    const postData = request.postDataJSON();
    await route.fulfill({ 
      status: 201, 
      body: JSON.stringify({ id: 101, ...postData }) 
    });
  } else {
    // Allow GET to pass through to real server?
    // Or mock GET too.
    await route.continue();
  }
});
```

### Delaying Responses (Simulating Latency)

Test your loading spinners!

```typescript
await page.route('**/api/slow-endpoint', async route => {
  // Wait 2 seconds before responding
  await new Promise(f => setTimeout(f, 2000));
  await route.fulfill({ status: 200, body: 'Done' });
});
// Assert spinner is visible during that time...
```

### Simulating Errors (chaos testing)

Test how the UI handles outages.

```typescript
test('show error message on 500', async ({ page }) => {
  await page.route('**/api/submit', route => route.fulfill({
    status: 500,
    body: 'Internal Server Error'
  }));
  
  await page.click('#submit');
  await expect(page.getByText('Something went wrong')).toBeVisible();
});

test('network connection lost', async ({ page }) => {
  await page.route('**/api/data', route => route.abort('connectionrefused'));
});
```

---

## Modifying Traffic (Interception)

Sometimes you don't want to *replace* the server, just *tweak* the request sent to it.

### Adding Headers (Auth Injection)

Inject an Authorization header into every request (bypass login UI).

```typescript
await page.route('**/*', async route => {
  const headers = route.request().headers();
  headers['Authorization'] = 'Bearer fake-token-123';
  
  await route.continue({ headers });
});
```

### Overriding POST Data

Change the payload being sent.

```typescript
await page.route('**/api/login', async route => {
  const overrides = { role: 'super-admin' }; // Inject extra field
  const postData = { ...route.request().postDataJSON(), ...overrides };
  
  await route.continue({ postData: JSON.stringify(postData) });
});
```

---

## Network Simulation (Throttling & Offline)

Playwright connects to the Chrome DevTools Protocol (CDP) for low-level network control.

### Offline Mode

```typescript
test('offline behavior', async ({ page }) => {
  await page.goto('/dashboard');
  
  // Create CDP Session
  const client = await page.context().newCDPSession(page);
  
  // Go Offline
  await client.send('Network.emulateNetworkConditions', {
    offline: true,
    latency: 0,
    downloadThroughput: 0,
    uploadThroughput: 0,
  });
  
  await page.reload();
  await expect(page.getByText('You are offline')).toBeVisible();
});
```

### Slow 3G

```typescript
await client.send('Network.emulateNetworkConditions', {
  offline: false,
  latency: 500, // 500ms lag
  downloadThroughput: ((500 * 1000) / 8), // 500 kbps
  uploadThroughput: ((500 * 1000) / 8),
});
```

---

## HAR Recording & Replay

**HAR (HTTP Archive)** files record all network traffic.
- **Record Mode**: You interact with the real site; Playwright saves traffic to `trace.har`.
- **Replay Mode**: Playwright mocks *everything* using `trace.har`. No server usage!

**Why?** Create purely offline, deterministic tests from real user sessions.

### Recording

```typescript
// Record
await page.routeFromHAR('mocks/user-flow.har', {
  url: '**/api/**', // Only record API, let HTML/CSS/JS load for real
  update: true      // Overwrite file
});

await page.goto('/');
// ... perform actions ...
```

### Replaying

```typescript
// Replay
await page.routeFromHAR('mocks/user-flow.har', {
  url: '**/api/**',
  update: false      // Read-only
});

await page.goto('/');
```

---

## Best Practices

| Pattern | Recommendation |
|---------|----------------|
| **Mocking vs Real** | Use Real APIs for E2E/Integration tests (Happy Path). Use Mocking for Edge cases (Errors, specific states). |
| **Route Specificity** | Be specific! `page.route('**')` captures HTML/CSS/JS and breaks the page. Use `**/api/**`. |
| **Unroute** | If you define a route in `beforeEach`, you can `page.unroute()` it later if a specific test needs real network. |
| **Wait for Response** | Instead of `waitForTimeout`, use `page.waitForResponse()`. It's the cleanest way to sync with backend. |

```typescript
// ✅ Good Sync Pattern
const responsePromise = page.waitForResponse(resp => 
  resp.url().includes('/save') && resp.status() === 200
);
await page.click('#save');
await responsePromise; // Waits exactly until the server replies
```

**Summary**: You've mastered how to manipulate network traffic to simulate complex scenarios and record deterministic tests using HAR files. The next chapter covers one of the biggest time-savers in Playwright: bypassing the login screen using Storage State.
