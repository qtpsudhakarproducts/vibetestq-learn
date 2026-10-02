# Chapter 702 — Network Interception & Routing

This chapter covers `page.route()` — Playwright's API for intercepting,
mocking, modifying, and blocking network requests. Interviewers ask about
network interception to test whether candidates can isolate frontend behaviour
from backend dependency, simulate error states, and write fast deterministic
tests. Questions progress from basic mocking through dynamic handlers to
request modification and the difference between `fulfill`, `continue`, and
`abort`.

---

## Q702.1 — What is network interception in Playwright?

Network interception means sitting between the browser and the server.
When the browser makes a request that matches a registered route, Playwright
intercepts it before it leaves. You can then:

- **Fulfill** — return a fake response (mock the server)
- **Continue** — let the request pass through, optionally with modifications
- **Abort** — cancel the request entirely

```typescript
// Register a route that intercepts ALL requests matching the pattern
await page.route('**/api/users', async route => {
  await route.fulfill({
    status:      200,
    contentType: 'application/json',
    body:        JSON.stringify([{ id: 1, name: 'Mock User' }]),
  });
});

await page.goto('/dashboard');
// The page loads but /api/users returns fake data — no real server needed
```

The route registration is page-scoped. It applies to all requests from
that page for the lifetime of the registration (until `page.unroute()` is
called or the page is closed).

---

## Q702.2 — What are the three actions a route handler can take?

**`route.fulfill()`** — return a synthetic response. The browser receives
the response you provide. The real server is never contacted.

```typescript
await page.route('**/api/products', route =>
  route.fulfill({
    status:      200,
    contentType: 'application/json',
    body:        JSON.stringify(mockProducts),
  })
);
```

**`route.continue()`** — pass the request to the real server, optionally
modifying it first. Good for injecting headers or changing the payload.

```typescript
await page.route('**/*', async route => {
  const headers = { ...route.request().headers(), 'X-Test-Run': 'true' };
  await route.continue({ headers });
});
```

**`route.abort()`** — cancel the request. The browser receives a network
error. Good for blocking resources or simulating connection failures.

```typescript
await page.route('**/*.{png,jpg,jpeg,svg}', route => route.abort());
```

Every route handler must call exactly one of these three methods. Failing
to call any of them hangs the browser indefinitely.

---

## Q702.3 — How do you mock a JSON API response?

```typescript
test('dashboard shows mock data', async ({ page }) => {
  await page.route('**/api/user/profile', async route => {
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({ name: 'Test User', role: 'admin' }),
    });
  });

  await page.goto('/dashboard');
  await expect(page.getByText('Test User')).toBeVisible();
  await expect(page.getByText('admin')).toBeVisible();
});
```

For large JSON payloads, load from a fixture file instead of inlining:

```typescript
import path from 'path';

await page.route('**/api/products', route =>
  route.fulfill({
    path: path.join(__dirname, '../fixtures/products.json'),
  })
);
```

The `path` option reads the file and sets `Content-Type` based on the
file extension automatically.

---

## Q702.4 — How do you mock different responses based on request method or body?

Use a dynamic handler that inspects the request before deciding what to return:

```typescript
await page.route('**/api/todos', async route => {
  const req = route.request();

  if (req.method() === 'POST') {
    // Mock creation
    const body = req.postDataJSON();
    await route.fulfill({
      status: 201,
      body:   JSON.stringify({ id: 101, ...body }),
    });
  } else if (req.method() === 'GET') {
    // Mock list
    await route.fulfill({
      status: 200,
      body:   JSON.stringify([{ id: 1, title: 'First todo', done: false }]),
    });
  } else {
    // Let other methods (DELETE, PUT) go to the real server
    await route.continue();
  }
});
```

`route.request()` exposes: `.method()`, `.url()`, `.headers()`,
`.postDataJSON()`, `.resourceType()`. Inspect any of these to decide
which response to return.

---

## Q702.5 — How do you simulate API error states?

Error state simulation is one of the most valuable uses of network interception —
it tests UI error handling for scenarios that are hard to reproduce with a
real backend:

```typescript
test('shows error message on 500', async ({ page }) => {
  await page.route('**/api/submit', route =>
    route.fulfill({
      status:      500,
      contentType: 'application/json',
      body:        JSON.stringify({ error: 'Internal Server Error' }),
    })
  );

  await page.getByRole('button', { name: 'Submit' }).click();
  await expect(page.getByText('Something went wrong')).toBeVisible();
});

test('shows not found message on 404', async ({ page }) => {
  await page.route('**/api/product/99', route =>
    route.fulfill({ status: 404, body: 'Not found' })
  );

  await page.goto('/products/99');
  await expect(page.getByRole('heading', { name: 'Product Not Found' })).toBeVisible();
});

test('shows offline banner when connection is refused', async ({ page }) => {
  await page.route('**/api/data', route =>
    route.abort('connectionrefused')
  );

  await page.goto('/dashboard');
  await expect(page.getByText('Connection failed')).toBeVisible();
});
```

Common `abort()` reasons: `'failed'`, `'aborted'`, `'timedout'`,
`'accessdenied'`, `'connectionrefused'`, `'connectionreset'`.

---

## Q702.6 — How do you simulate slow API responses to test loading states?

```typescript
test('loading spinner appears during slow API', async ({ page }) => {
  await page.route('**/api/dashboard/data', async route => {
    // Simulate a 2-second API response
    await new Promise(resolve => setTimeout(resolve, 2000));
    await route.fulfill({
      status: 200,
      body:   JSON.stringify({ metrics: [] }),
    });
  });

  await page.goto('/dashboard');

  // Spinner should be visible while the request is in flight
  await expect(page.getByTestId('loading-spinner')).toBeVisible();

  // Spinner should disappear once the mock resolves
  await expect(page.getByTestId('loading-spinner')).not.toBeVisible();
  await expect(page.getByTestId('metrics-panel')).toBeVisible();
});
```

Delay mocking is the only reliable way to test loading states. Using
`waitForTimeout` in a test is an anti-pattern — it makes tests slow and
brittle. This approach makes the test fast (2 seconds of real delay only
while loading is being tested) and reliable.

---

## Q702.7 — How do you block resources to speed up tests?

```typescript
// Block images — speeds up page load for tests that don't test images
await page.route('**/*.{png,jpg,jpeg,gif,svg,webp}', route => route.abort());

// Block Google Analytics — prevents flaky waitForNetworkIdle timeouts
await page.route('**/google-analytics.com/**', route => route.abort());
await page.route('**/googletagmanager.com/**', route => route.abort());

// Block all fonts
await page.route('**/*.{woff,woff2,ttf,eot}', route => route.abort());
```

Blocking in `beforeEach` for a whole suite or in `playwright.config.ts`
is more efficient than per-test:

```typescript
// playwright.config.ts
use: {
  // Block tracking scripts for all tests
  extraHTTPHeaders: {},
},

// Or block in global setup via a custom fixture
```

Be careful with `**/*` — it captures HTML, CSS, and JavaScript too, which
breaks page loading. Always use specific patterns.

---

## Q702.8 — How do you modify a request before it reaches the server?

`route.continue()` with override options lets you change the request
before it goes through:

```typescript
// Inject an Authorization header into every API call
await page.route('**/api/**', async route => {
  const headers = {
    ...route.request().headers(),
    'Authorization': 'Bearer test-token-123',
  };
  await route.continue({ headers });
});

// Change the POST body
await page.route('**/api/login', async route => {
  const original = route.request().postDataJSON();
  await route.continue({
    postData: JSON.stringify({ ...original, role: 'super-admin' }),
  });
});

// Change the URL (redirect to a different endpoint)
await page.route('**/api/v1/users', async route => {
  await route.continue({ url: '/api/v2/users' });
});
```

`continue()` options: `url`, `method`, `headers`, `postData`. Passing
only the fields you want to change — the rest of the request is preserved.

---

## Q702.9 — How do you modify a response after it returns from the server?

Fetch the real response and then modify it before returning to the browser:

```typescript
await page.route('**/api/config', async route => {
  // Fetch the real response
  const response = await route.fetch();
  const body = await response.json();

  // Modify one field — enable a feature flag for this test
  body.featureFlags.darkMode = true;

  // Return the modified response
  await route.fulfill({
    response,                        // preserves headers, status
    body: JSON.stringify(body),
  });
});
```

This pattern is useful for:
- Enabling or disabling feature flags in tests without config changes
- Injecting specific data into an otherwise real API response
- Testing how the UI handles an extra or missing field

---

## Q702.10 — What is the difference between page.route and context.route?

**`page.route(pattern, handler)`** — intercepts requests from a single page.
Does not affect other pages in the same browser context.

**`context.route(pattern, handler)`** — intercepts requests from ALL pages
in the browser context, including new pages opened by the test.

```typescript
// Applies only to this page
await page.route('**/api/**', handler);

// Applies to every page in the context — including popups and new tabs
await page.context().route('**/api/**', handler);
```

Use `context.route()` when:
- The test opens new tabs or popups that also need mocking
- You want consistent mocking applied to an entire user session

Use `page.route()` when:
- Mocking is specific to one page
- You don't want it to affect other pages in the test

---

## Q702.11 — How do you remove a route handler?

`page.unroute()` removes a previously registered handler:

```typescript
const handler = async (route: Route) => route.fulfill({ status: 200 });

// Register
await page.route('**/api/data', handler);

// ... some tests use the mock ...

// Unregister — subsequent requests go to the real server
await page.unroute('**/api/data', handler);

// Or remove all handlers for a pattern:
await page.unroute('**/api/data');
```

This is useful when one test in a suite needs the real API while others
use a mock. Register the mock in `beforeEach`, unroute in the specific
test that needs real network.

---

## Q702.12 — How do you verify that a route was called a specific number of times?

Playwright does not have a built-in "call count" assertion on routes, but
you can track calls manually:

```typescript
test('submit button sends exactly one API call', async ({ page }) => {
  let callCount = 0;

  await page.route('**/api/submit', async route => {
    callCount++;
    await route.fulfill({ status: 200, body: '{}' });
  });

  await page.getByRole('button', { name: 'Submit' }).click();

  // Ensure the request fired
  await page.waitForResponse('**/api/submit');
  expect(callCount).toBe(1);

  // Click again — should still only be 1 (debounced button)
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.waitForTimeout(500); // brief wait for any second call
  expect(callCount).toBe(1);
});
```

---

## Q702.13 — What is the difference between page.route and page.waitForResponse?

**`page.route()`** — intercepts and controls requests. You decide what
the browser receives. The server may or may not be contacted.

**`page.waitForResponse()`** — passively waits for a response to arrive.
It does not intercept or mock. It resolves when a matching response is received.

```typescript
// waitForResponse — observe real network traffic
const responsePromise = page.waitForResponse(
  resp => resp.url().includes('/api/save') && resp.status() === 200
);
await page.getByRole('button', { name: 'Save' }).click();
const response = await responsePromise;
// Assert on the real API response
const body = await response.json();
expect(body.savedAt).toBeDefined();
```

Use `page.route()` when you want to control what the server returns.
Use `page.waitForResponse()` when you want to assert on what the real
server actually returned.

---

## Q702.14 — How do you use network interception for offline mode testing?

Offline mode requires the Chrome DevTools Protocol (CDP) since `page.route`
cannot simulate a network-level disconnection:

```typescript
test('shows offline banner when disconnected', async ({ page }) => {
  await page.goto('/dashboard');

  // Create a CDP session to control network at the OS level
  const client = await page.context().newCDPSession(page);

  // Set network to offline
  await client.send('Network.emulateNetworkConditions', {
    offline:             true,
    latency:             0,
    downloadThroughput:  0,
    uploadThroughput:    0,
  });

  // Reload — no network available
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.getByText('You are offline')).toBeVisible();

  // Restore network
  await client.send('Network.emulateNetworkConditions', {
    offline:             false,
    latency:             0,
    downloadThroughput: -1,
    uploadThroughput:   -1,
  });
});
```

CDP network emulation (`offline`, `Slow 3G`) works on Chromium only.
For cross-browser offline testing, use `page.route()` to abort all requests.

---

## Q702.15 — What are common mistakes when using page.route?

**Pattern too broad.** Using `'**/*'` captures HTML, CSS, and JS files
too. The page fails to load because the HTML itself is intercepted.
Always use specific patterns like `'**/api/**'`.

**Not calling fulfill/continue/abort.** Every handler must call exactly
one action. Forgetting this hangs the browser — the request is intercepted
but never resolved. The test times out with a cryptic message.

**Missing `async/await` inside the handler.** `route.fulfill()` is async.
Without `await`, the handler returns before the fulfillment completes.

```typescript
// ❌ Wrong — no await on fulfill
await page.route('**/api/data', route => {
  route.fulfill({ status: 200 }); // not awaited
});

// ✅ Correct
await page.route('**/api/data', async route => {
  await route.fulfill({ status: 200 });
});
```

**Route registered after navigation.** Routes must be registered before
the request fires. If you register a route after `page.goto()`, the
request may have already completed.

---

## Q702.16 — Write code to mock a paginated API response.

```typescript
test('pagination loads next page of results', async ({ page }) => {
  let currentPage = 1;

  await page.route('**/api/posts', async route => {
    const url   = new URL(route.request().url());
    const page  = parseInt(url.searchParams.get('page') ?? '1');
    const limit = parseInt(url.searchParams.get('limit') ?? '10');

    // Generate mock data for the requested page
    const items = Array.from({ length: limit }, (_, i) => ({
      id:    (page - 1) * limit + i + 1,
      title: `Post ${(page - 1) * limit + i + 1}`,
    }));

    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({
        items,
        total:   100,
        page,
        hasMore: page < 10,
      }),
    });
  });

  await page.goto('/posts');
  await expect(page.getByText('Post 1')).toBeVisible();

  // Click "Next Page"
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page.getByText('Post 11')).toBeVisible();
  await expect(page.getByText('Post 1')).not.toBeVisible();
});
```

---

## Q702.17 — How do you mock WebSocket connections in Playwright?

Playwright supports WebSocket route handlers with `page.routeWebSocket()`:

```typescript
test('real-time updates appear via WebSocket', async ({ page }) => {
  await page.routeWebSocket('wss://example.com/ws', ws => {
    ws.onMessage(message => {
      // Echo back or respond
      ws.send(JSON.stringify({ type: 'ack', id: message }));
    });

    // Push a message after the connection is established
    setTimeout(() => {
      ws.send(JSON.stringify({
        type:    'notification',
        message: 'New order received',
      }));
    }, 100);
  });

  await page.goto('/dashboard');
  await expect(page.getByText('New order received')).toBeVisible();
});
```

`routeWebSocket()` was introduced in Playwright 1.48. For older versions
the workaround is to mock the WebSocket-dependent API endpoints that the
server pushes data to, rather than the socket connection directly.

---

## Q702.18 — In your project, how did you use network interception?

In our OrangeHRM project, we used `page.route()` in two specific scenarios.

**Blocking third-party analytics.** The demo site sends requests to several
analytics and tracking endpoints on every page load. These requests were
causing intermittent failures in `waitForNetworkIdle`-based waits because
the tracking pixels sometimes took 3–4 seconds. We added a `context.route()`
in our base fixture that aborts all requests to `**/*.analytics.*` and
`**/gtm.js`. This cut suite execution time by about 15% and eliminated a
category of flakiness entirely.

**Testing API error handling.** The OrangeHRM demo site does not have a
way to simulate server errors — it is a live application. To test that our
custom `ErrorBoundary` component shows the correct message when an API
returns 500, we used `page.route('**/api/v2/pim/employees', ...)` to return
a 500 response on one specific test. The test verified the error toast appeared
and the page did not crash. Without route mocking, this scenario would have
been untestable against the demo application.

---

## Chapter Summary

- `page.route(pattern, handler)` intercepts matching requests before they leave the browser.
- Every handler must call exactly one action: `route.fulfill()` (mock response), `route.continue()` (pass through, optionally modified), or `route.abort()` (cancel).
- `route.fulfill()` returns a synthetic response; the real server is never contacted.
- `route.continue()` passes the request to the server, optionally modifying headers, method, body, or URL first.
- Dynamic handlers inspect `route.request().method()`, `.postDataJSON()`, and `.url()` to return different responses based on request content.
- Use `route.abort()` to block resources (images, analytics) and speed up tests, or to simulate connection failures.
- `page.context().route()` applies to all pages in the context; `page.route()` applies to one page only.
- `page.waitForResponse()` is passive observation — it waits for a real response but does not intercept. Use it with real network; use `page.route()` to control what is returned.
- `page.unroute()` removes a handler when a specific test needs real network while others use mocks.
- Offline mode simulation requires CDP (`Network.emulateNetworkConditions`) since `page.route` cannot simulate network-level disconnection.
