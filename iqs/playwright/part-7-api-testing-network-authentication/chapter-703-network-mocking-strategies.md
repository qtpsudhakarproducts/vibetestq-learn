# Chapter 703 — Network Mocking Strategies

This chapter covers the strategic layer above individual route handlers —
HAR files, mock server patterns, intercept strategies, and when to use
mocking vs real APIs. Interviewers ask these questions at senior level to
test whether candidates can articulate a mocking strategy for a team, not
just use `route.fulfill()` in a single test. Questions cover HAR recording
and replay, the offline testing pattern, mock organisation, and the
mocking vs integration testing decision.

---

## Q703.1 — What are the three main network mocking strategies in Playwright?

**In-test mocking with `page.route()`** — mock individual endpoints inside
test functions or `beforeEach`. The mock is defined alongside the test,
making it obvious what is being controlled. Best for: edge cases, error
states, specific data configurations.

**HAR recording and replay** — record real network traffic once, commit
the HAR file, replay in CI. The mock data matches what a real server
returns, so it is realistic. Best for: stable third-party APIs, offline
testing, reproducing production data shapes.

**Fixture files with `route.fulfill({ path: ... })`** — store mock
responses as JSON files in a `fixtures/` or `mocks/` directory. Load them
by path in route handlers. Best for: large response payloads, reusable mock
data shared across multiple tests.

Each strategy suits different scenarios. Most frameworks use all three.

---

## Q703.2 — What is a HAR file and what does it contain?

HAR stands for HTTP Archive. It is a JSON file that records all network
requests and responses made during a browser session — URLs, methods,
headers, request bodies, response bodies, timing data, and cookies.

Playwright can generate a HAR file while your tests run, and later replay
it: instead of making real HTTP requests, Playwright reads matching entries
from the HAR and returns them as responses.

A HAR entry looks like:

```json
{
  "request": {
    "method": "GET",
    "url": "https://api.example.com/users",
    "headers": [{ "name": "Accept", "value": "application/json" }]
  },
  "response": {
    "status": 200,
    "headers": [{ "name": "content-type", "value": "application/json" }],
    "content": {
      "mimeType": "application/json",
      "text": "[{\"id\":1,\"name\":\"Alice\"}]"
    }
  }
}
```

HAR files are tool-agnostic — Chrome DevTools, Fiddler, and Postman all
export HAR format. You can record traffic in your browser, save the HAR,
and use it in Playwright tests.

---

## Q703.3 — How do you record and replay a HAR file?

**Record mode** — run once against the real application with `update: true`.
The HAR file is written to disk.

```typescript
test('record HAR', async ({ page }) => {
  // update: true means record real network traffic to this file
  await page.routeFromHAR('./fixtures/api-responses.har', {
    url:    '**/api/**',
    update: true,
  });

  await page.goto('/dashboard');
  // All /api/** requests are recorded to api-responses.har
});
```

**Replay mode** — subsequent runs use `update: false` (the default).
The file is read instead of contacting the real server.

```typescript
test('replay from HAR', async ({ page }) => {
  await page.routeFromHAR('./fixtures/api-responses.har', {
    url:    '**/api/**',
    // update: false is the default
  });

  await page.goto('/dashboard');
  // /api/** requests are served from the HAR — no real network
});
```

Commit the HAR file to the repository. CI runs never need the real API.

---

## Q703.4 — When should you use HAR replay vs explicit route.fulfill() mocks?

**Use HAR replay when:**
- Testing against a third-party API that you do not control
- The API response shape is large and complex — writing it manually is error-prone
- You want realistic test data that matches production response shapes
- You need offline, deterministic tests from a real user session

**Use explicit `route.fulfill()` mocks when:**
- Testing specific error states (500, 404, timeout) that you cannot record
- The response must vary based on test input
- Testing feature flags or conditional logic that requires specific field values
- The API changes frequently and HAR files would become stale quickly

**Use fixture JSON files when:**
- Multiple tests share the same large mock response
- The mock data represents a known domain object (product catalogue, user list)
  that is maintained separately from the tests

In practice: use HAR for stable external APIs, explicit mocks for edge cases,
fixture files for shared domain data.

---

## Q703.5 — How do you update a HAR file when the API changes?

HAR files become stale when the API changes — new fields, changed field names,
different response structures. Three approaches:

**Manual re-record:** Set `update: true` in the test, run once against the
real API, commit the updated file.

**Scheduled CI re-record:** A weekly CI job runs with `update: true` against
staging and commits the result. This keeps HAR files fresh without developer
action.

**Selective invalidation:** Add a HAR file age check to a CI step. If the
file's last-commit date is more than 30 days ago, flag it as stale and require
a review.

For APIs that change frequently (weekly breaking changes), HAR is not suitable
— use explicit `route.fulfill()` mocks that you control and update explicitly.

---

## Q703.6 — How do you organise mock data for a large test suite?

A maintainable mock organisation follows the same structure as the tests:

```
tests/
  fixtures/                 ← mock data
    api/
      users/
        get-all.json        ← GET /api/users response
        get-by-id.json      ← GET /api/users/:id response
        create-201.json     ← POST /api/users 201 response
        create-400.json     ← POST /api/users 400 validation error
      products/
        list.json
        detail.json
    har/
      checkout-flow.har     ← recorded HAR for checkout
      product-search.har    ← recorded HAR for search
```

Load fixture files by path in route handlers:

```typescript
const FIXTURES = path.join(__dirname, '../fixtures/api');

await page.route('**/api/users', route =>
  route.fulfill({
    status: 200,
    path:   path.join(FIXTURES, 'users/get-all.json'),
  })
);
```

A `MockServer` helper class centralises common patterns:

```typescript
class MockServer {
  constructor(private page: Page) {}

  async mockUsers(status = 200) {
    await this.page.route('**/api/users', route =>
      route.fulfill({
        status,
        path: path.join(FIXTURES, status === 200
          ? 'users/get-all.json'
          : 'users/error.json'
        ),
      })
    );
  }

  async mockNetworkError(pattern: string) {
    await this.page.route(pattern, route =>
      route.abort('connectionrefused')
    );
  }
}
```

---

## Q703.7 — How do you test your application in fully offline mode?

Full offline testing means no requests reach the network at all. Two
levels:

**Level 1 — route-based offline:** Abort all API requests. HTML, CSS,
and JS still load from the real server but API calls fail:

```typescript
test('shows offline message when API is unreachable', async ({ page }) => {
  await page.goto('/dashboard'); // HTML loads normally

  // Now block all API calls
  await page.route('**/api/**', route => route.abort('connectionrefused'));

  await page.reload();
  await expect(page.getByText('Unable to load data')).toBeVisible();
});
```

**Level 2 — HAR-based offline:** Route all requests (including page HTML)
from HAR files. The page never contacts the network:

```typescript
await page.routeFromHAR('./fixtures/full-session.har');
await page.goto('/dashboard'); // Everything from HAR — fully offline
```

Level 2 enables running tests with zero network access — useful in
air-gapped CI environments or for making tests 100% deterministic with
no external dependency.

---

## Q703.8 — When should you use real APIs in tests vs mocked APIs?

**Use real APIs for:**
- Happy-path E2E tests that validate the complete integration (frontend
  to backend to database)
- Authentication and session management tests — mock auth often hides
  real problems
- Tests that verify data is persisted correctly
- Contract tests that confirm the frontend and backend API agree

**Use mocked APIs for:**
- Edge cases and error states that are hard to reproduce with a real server
  (specific 4xx/5xx responses, timeouts, partial data)
- Tests that run in environments without a backend (PR preview builds,
  frontend-only deployments)
- Performance testing where API latency would make tests slow and variable
- Tests for third-party APIs where you cannot control the data

The best strategy is not "mock everything" or "use real everything" — it
is layered. The test pyramid has API tests at the base (real API, fast),
hybrid tests in the middle (real setup, UI assertion), and pure UI tests
at the top (mocked for specific edge cases where the backend cannot help).

---

## Q703.9 — How do you handle dynamic URLs in route patterns?

`page.route()` accepts glob patterns, regular expressions, and URL predicates:

```typescript
// Glob with wildcard segment
await page.route('**/api/users/*/profile', handler);
// Matches: /api/users/123/profile, /api/users/abc/profile

// Regular expression
await page.route(/\/api\/orders\/\d+/, handler);
// Matches: /api/orders/1, /api/orders/42

// Function predicate — most flexible
await page.route(
  url => url.includes('/api/') && url.includes('/settings'),
  handler
);
// Matches any URL containing both /api/ and /settings
```

For routes with IDs that vary, extract the ID from the URL inside the handler:

```typescript
await page.route(/\/api\/users\/(\d+)/, async route => {
  const url    = route.request().url();
  const userId = url.match(/\/api\/users\/(\d+)/)?.[1];

  await route.fulfill({
    status: 200,
    body:   JSON.stringify({ id: userId, name: `User ${userId}` }),
  });
});
```

---

## Q703.10 — How do you test rate limiting and retry behaviour?

Simulate rate limit responses on the first N calls, then allow through:

```typescript
test('retries automatically on 429', async ({ page }) => {
  let callCount = 0;

  await page.route('**/api/data', async route => {
    callCount++;
    if (callCount <= 2) {
      // First two calls get rate limited
      await route.fulfill({
        status:  429,
        headers: { 'Retry-After': '1' },
        body:    'Too Many Requests',
      });
    } else {
      // Third call succeeds
      await route.fulfill({
        status: 200,
        body:   JSON.stringify({ data: 'success' }),
      });
    }
  });

  await page.goto('/data-page');

  // The page should eventually show the data after retries
  await expect(page.getByTestId('data-content')).toBeVisible({ timeout: 10000 });
  expect(callCount).toBe(3);
});
```

---

## Q703.11 — How do you share mock handlers across multiple test files?

Define route handlers in a shared fixture or helper module and compose them:

```typescript
// fixtures/mocks.ts
import { Page } from '@playwright/test';

export async function mockUserAPI(page: Page) {
  await page.route('**/api/users', route =>
    route.fulfill({
      status: 200,
      body:   JSON.stringify(defaultUsers),
    })
  );
}

export async function mockEmptyUserAPI(page: Page) {
  await page.route('**/api/users', route =>
    route.fulfill({ status: 200, body: '[]' })
  );
}

// In test files
import { mockUserAPI } from '../fixtures/mocks';

test.beforeEach(async ({ page }) => {
  await mockUserAPI(page);
});
```

Or create a typed fixture that exposes mock helpers:

```typescript
export const test = base.extend<{ mock: MockHelpers }>({
  mock: async ({ page }, use) => {
    await use(new MockHelpers(page));
  },
});

// In tests
test('shows user list', async ({ page, mock }) => {
  await mock.users();
  await page.goto('/users');
  await expect(page.getByRole('list')).toBeVisible();
});
```

---

## Q703.12 — How do you assert on request content captured by a route handler?

```typescript
test('POST request contains correct payload', async ({ page }) => {
  const capturedRequests: ReturnType<typeof route.request>[] = [];

  await page.route('**/api/checkout', async route => {
    capturedRequests.push(route.request());
    await route.fulfill({ status: 200, body: '{"orderId":"ORD-001"}' });
  });

  await page.getByRole('button', { name: 'Place Order' }).click();
  await page.waitForResponse('**/api/checkout');

  expect(capturedRequests).toHaveLength(1);
  const payload = capturedRequests[0].postDataJSON();
  expect(payload).toMatchObject({
    cartId:  expect.any(String),
    address: expect.objectContaining({ postcode: expect.any(String) }),
  });
});
```

Capture the request inside the handler (synchronous, always available),
then assert after the response is received.

---

## Q703.13 — What is the fallback behaviour when a HAR entry does not match?

When `routeFromHAR()` cannot find a matching entry for a request, the
default behaviour depends on the `fallback` option:

```typescript
await page.routeFromHAR('./fixtures/partial.har', {
  url:      '**/api/**',
  fallback: 'abort',    // abort unmatched requests (default)
  // fallback: 'continue'  // pass unmatched requests to the real server
});
```

**`abort`** (default) — unmatched requests are aborted. Tests fail loudly
if the HAR is missing an entry. Good for fully offline tests where any
real network call indicates an incomplete HAR.

**`continue`** — unmatched requests pass through to the real server. Good
for partially mocked scenarios where only some endpoints are recorded.

---

## Q703.14 — How do you test authentication headers are sent correctly?

```typescript
test('API calls include Authorization header after login', async ({ page }) => {
  const capturedHeaders: Record<string, string>[] = [];

  // Capture headers on every API call
  await page.route('**/api/**', async route => {
    capturedHeaders.push(route.request().headers());
    await route.continue(); // let the real request through
  });

  // Log in
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');

  // Trigger an API call
  await page.goto('/api-page');
  await page.waitForResponse('**/api/data');

  // Assert the header is present
  const dataCallHeaders = capturedHeaders[capturedHeaders.length - 1];
  expect(dataCallHeaders['authorization']).toMatch(/^Bearer /);
});
```

---

## Q703.15 — What is the impact of not cleaning up route handlers between tests?

Route handlers persist on the `page` until explicitly removed or the page
is closed. If you register a route in a test and do not unroute it, it
can leak into subsequent tests in the same worker — if Playwright reuses
the same page instance (which it does not by default, but can in shared
contexts).

The more common problem is registering routes in `beforeEach` without
unregistering in `afterEach` or between test phases. Best practices:

- Register routes inside the test or in `beforeEach` — they are scoped
  to the page's lifetime
- If using a shared `BrowserContext` across tests, explicitly call
  `page.unroute()` or `context.unroute()` in `afterEach`
- For the default Playwright test runner setup, each test gets a fresh page
  and context — route handlers do not persist across tests

---

## Q703.16 — Write code to mock a search API with results that vary by query.

```typescript
test('search returns relevant results', async ({ page }) => {
  const searchResults: Record<string, object[]> = {
    'playwright': [
      { id: 1, title: 'Playwright Docs', url: 'playwright.dev' },
      { id: 2, title: 'Playwright GitHub', url: 'github.com/microsoft/playwright' },
    ],
    'selenium': [
      { id: 3, title: 'Selenium HQ', url: 'selenium.dev' },
    ],
    '': [],
  };

  await page.route('**/api/search', async route => {
    const url   = new URL(route.request().url());
    const query = url.searchParams.get('q') ?? '';
    const results = searchResults[query.toLowerCase()] ?? [];

    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify({ results, total: results.length }),
    });
  });

  await page.goto('/search');

  // Search for playwright
  await page.getByPlaceholder('Search').fill('playwright');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Playwright Docs')).toBeVisible();
  await expect(page.getByText('Selenium HQ')).not.toBeVisible();

  // Search for empty
  await page.getByPlaceholder('Search').clear();
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('No results found')).toBeVisible();
});
```

---

## Q703.17 — How do you implement a "mock server" pattern for a team?

A team-wide mock server is a shared fixture module that provides consistent
mock behaviour across the entire suite:

```typescript
// fixtures/MockServer.ts
export class MockServer {
  private routes: (() => Promise<void>)[] = [];

  constructor(private page: Page) {}

  async users(override?: Partial<User>[]) {
    await this.page.route('**/api/users', route =>
      route.fulfill({
        status: 200,
        body:   JSON.stringify(override ?? defaultUsers),
      })
    );
  }

  async apiError(pattern: string, status = 500, message = 'Server Error') {
    await this.page.route(pattern, route =>
      route.fulfill({ status, body: JSON.stringify({ error: message }) })
    );
  }

  async networkFailure(pattern: string) {
    await this.page.route(pattern, route => route.abort('connectionrefused'));
  }

  async slowResponse(pattern: string, delayMs = 2000) {
    await this.page.route(pattern, async route => {
      await new Promise(r => setTimeout(r, delayMs));
      await route.continue();
    });
  }
}

// In test fixture
export const test = base.extend<{ mock: MockServer }>({
  mock: async ({ page }, use) => {
    await use(new MockServer(page));
  },
});

// In tests
test('shows error state', async ({ page, mock }) => {
  await mock.apiError('**/api/dashboard', 503, 'Service Unavailable');
  await page.goto('/dashboard');
  await expect(page.getByRole('alert')).toContainText('Service Unavailable');
});
```

---

## Q703.18 — In your project, how did you structure your mocking strategy?

In our OrangeHRM project, the mocking strategy was deliberately limited.
OrangeHRM is a live demo server, so we used real API calls for the majority
of tests — especially the POM framework levels 4–8 which depended on real
API responses for setup and assertion.

We used mocking in two specific areas:

**Third-party blocking.** A context-level route in the base fixture blocks
analytics and tracking endpoints. This is not "mocking" in the traditional
sense — it is performance and reliability engineering. Analytics calls were
adding 2–4 seconds of network noise and causing `waitForNetworkIdle` to be
unreliable.

**Error scenario tests.** For tests that verify the application handles
server errors gracefully, we used `page.route()` to return 500 responses
on specific API endpoints. These tests live in a dedicated `error-handling/`
folder and are tagged `@smoke @critical` because if error handling is broken,
the entire user experience degrades.

For teams working against unstable or unavailable backends, we would add
HAR recording as a third tier — recording realistic responses against
staging and committing them for CI replay. The 30-day staleness check
would be a CI step that alerts when HAR files need re-recording.

---

## Chapter Summary

- Three mocking strategies: in-test `page.route()` for edge cases, HAR recording/replay for stable external APIs, fixture JSON files for shared domain data.
- HAR files record all network traffic (requests, responses, headers, timing); `routeFromHAR(path, { update: true })` records; `{ update: false }` (default) replays.
- HAR `fallback: 'abort'` (default) fails loudly on unmatched requests; `fallback: 'continue'` passes them to the real server.
- Use real APIs for happy-path E2E tests and auth tests; use mocks for error states, third-party APIs, and frontend-only environments.
- Organise mocks by mirroring the API structure: `fixtures/api/users/get-all.json`, separate error and success responses.
- A `MockServer` helper class centralises route patterns and makes tests read like business scenarios: `await mock.apiError('**/api/dashboard', 503)`.
- Capture `route.request()` inside the handler synchronously, then assert on `postDataJSON()`, `headers()`, or `url()` after the response is received.
- HAR staleness is a real maintenance concern — schedule weekly re-recording against staging or use APIs that change infrequently.
- Route handlers should be registered before the navigation that triggers the requests — Playwright cannot intercept a request that has already fired.
- For WebSocket mocking use `page.routeWebSocket()` (Playwright 1.48+); for older versions mock the WebSocket-dependent REST polling endpoints instead.
