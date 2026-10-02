# Chapter 701 — API Testing with Playwright

This chapter covers Playwright's built-in API testing capability through
`APIRequestContext` and the `request` fixture. Interviewers ask these
questions to judge whether candidates understand that Playwright is more
than a browser tool — it has a first-class HTTP client that enables pure
API tests, hybrid UI+API tests, and fast test data setup without touching
the browser. Questions at senior level focus on the UI+API hybrid pattern
and the architectural decision of when to test at which layer.

---

## Q701.1 — What is the request fixture in Playwright?

The `request` fixture is a built-in Playwright fixture that provides an
`APIRequestContext` — an HTTP client for making REST API calls without
opening a browser. It is injected automatically like `page`:

```typescript
import { test, expect } from '@playwright/test';

test('API is reachable', async ({ request }) => {
  const response = await request.get('/api/health');
  expect(response.status()).toBe(200);
});
```

`APIRequestContext` supports all HTTP methods, reads `baseURL` from
`playwright.config.ts`, handles cookies and redirects automatically, and
parses JSON responses. No external libraries (Axios, node-fetch, Supertest)
are needed — the HTTP client is built into Playwright.

---

## Q701.2 — Why use Playwright for API testing instead of a dedicated tool?

Four reasons to keep API tests inside the Playwright framework:

**Same infrastructure.** No context switching between Playwright (E2E) and
a separate tool (Jest+Axios, Supertest, Postman). Fixtures, config, reporters,
and CI setup are shared.

**Hybrid tests.** The `request` fixture and the `page` fixture can be used
in the same test. API setup → UI verification → API assertion is the most
powerful pattern in the framework.

**Unified reporting.** All test results — API and UI — appear in one HTML
report. One CI pipeline. One failure format.

**Shared auth context.** A `page.request` context shares cookies with the
browser page it belongs to. Logging in via the browser automatically
authenticates `page.request` calls for the same session.

---

## Q701.3 — How do you make GET, POST, PUT, and DELETE requests?

```typescript
import { test, expect } from '@playwright/test';

test.describe('Users API', () => {

  test('GET returns a list', async ({ request }) => {
    const response = await request.get('/api/users');
    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
  });

  test('POST creates a user', async ({ request }) => {
    const response = await request.post('/api/users', {
      data: {
        name:  'Test User',
        email: `test-${Date.now()}@example.com`,
        role:  'user',
      },
    });
    expect(response.status()).toBe(201);
    const created = await response.json();
    expect(created.id).toBeDefined();
  });

  test('PUT updates a user', async ({ request }) => {
    const response = await request.put('/api/users/1', {
      data: { name: 'Updated Name' },
    });
    expect(response.ok()).toBe(true);
  });

  test('DELETE removes a user', async ({ request }) => {
    const response = await request.delete('/api/users/1');
    expect(response.status()).toBe(204);
  });

});
```

The `data` option automatically serialises as JSON and sets
`Content-Type: application/json`. For form data use `form:`. For
multipart file upload use `multipart:`.

---

## Q701.4 — How do you send query parameters and custom headers?

```typescript
// Query parameters — appended to URL automatically
const response = await request.get('/api/products', {
  params: { category: 'electronics', limit: 20, sort: 'price_asc' },
  // Becomes: /api/products?category=electronics&limit=20&sort=price_asc
});

// Custom headers
const response = await request.get('/api/admin/users', {
  headers: {
    'Authorization': `Bearer ${authToken}`,
    'X-Api-Version':  '2',
    'Accept':         'application/json',
  },
});

// Both together
const response = await request.get('/api/data', {
  params:  { page: 1 },
  headers: { 'Authorization': `Bearer ${token}` },
});
```

For requests that always need the same headers (auth tokens, tenant IDs),
create a pre-configured `APIRequestContext` with `request.newContext()`:

```typescript
const authRequest = await request.newContext({
  baseURL: process.env.API_BASE_URL,
  extraHTTPHeaders: {
    'Authorization': `Bearer ${token}`,
    'X-Tenant-ID':   process.env.TENANT_ID,
  },
});
// All requests from authRequest include these headers automatically
await authRequest.dispose(); // clean up in afterAll
```

---

## Q701.5 — How do you assert API responses?

Playwright provides several assertion methods on the `APIResponse` object:

```typescript
test('comprehensive response assertions', async ({ request }) => {
  const response = await request.get('/api/users/1');

  // Status assertions
  expect(response.status()).toBe(200);
  expect(response.ok()).toBe(true);         // true for 200–299 range
  expect(response.statusText()).toBe('OK');

  // Header assertions
  expect(response.headers()['content-type']).toContain('application/json');
  expect(response.headers()['x-request-id']).toBeDefined();

  // Body assertions
  const body = await response.json();       // parse as JSON
  expect(body).toHaveProperty('id', 1);
  expect(body).toHaveProperty('email');

  // Partial match — other fields are acceptable
  expect(body).toMatchObject({
    id:    1,
    email: 'user@example.com',
  });

  // Array response
  const list = await request.get('/api/users');
  const users = await list.json();
  expect(users).toHaveLength(10);
  expect(users[0]).toHaveProperty('id');
});
```

`response.ok()` is the most common assertion — it passes for any status
in the 200–299 range. Use `response.status()` when you need a specific
code (201 for creation, 204 for deletion).

---

## Q701.6 — What is the difference between page.request and the request fixture?

Both provide an `APIRequestContext`, but they differ in scope:

**`request` fixture** — a standalone HTTP client created per test file.
It does not share cookies or auth state with the browser. Use it for pure
API tests and `beforeAll`/`afterAll` setup/cleanup that is independent
of any browser session.

**`page.request`** — the HTTP client attached to a specific `page`. It
shares the browser context's cookies and auth state. When a user logs in
via the browser, `page.request` calls are automatically authenticated with
the same session cookies.

```typescript
test('page.request shares auth with the browser', async ({ page }) => {
  // Log in via browser
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.waitForURL('/dashboard');

  // page.request is now authenticated — same cookies as the browser
  const response = await page.request.get('/api/user/me');
  expect(response.status()).toBe(200);   // not 401
  const user = await response.json();
  expect(user.email).toBe('admin@example.com');
});
```

Use `request` (standalone) for independent API tests and setup.
Use `page.request` when you need the browser's auth session.

---

## Q701.7 — What is the UI+API hybrid test pattern and why is it valuable?

The hybrid pattern combines three layers in one test:
1. **API setup** — create preconditions fast without browser interaction
2. **UI test** — the actual scenario under test
3. **API verify/cleanup** — check data was saved correctly, then clean up

```typescript
test('order placed via UI is saved in the database', async ({ page, request }) => {

  // SETUP via API (fast — no browser navigation needed)
  const userRes = await request.post('/api/test/users', {
    data: { email: `shopper-${Date.now()}@test.com`, password: 'pass123' },
  });
  const { userId } = await userRes.json();

  // UI TEST (the scenario)
  await page.goto('/login');
  await page.getByLabel('Email').fill(`shopper-${Date.now()}@test.com`);
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  await page.getByRole('button', { name: 'Place Order' }).click();
  await page.waitForURL('**/order-confirmation/**');

  const orderIdText = await page.getByTestId('order-number').textContent();
  const orderId = orderIdText!.trim();

  // VERIFY via API (independent of UI rendering)
  const orderRes = await request.get(`/api/orders/${orderId}`);
  expect(orderRes.status()).toBe(200);
  const order = await orderRes.json();
  expect(order.status).toBe('confirmed');

  // CLEANUP via API
  await request.delete(`/api/test/orders/${orderId}`);
  await request.delete(`/api/test/users/${userId}`);
});
```

The two-layer assertion is the key value: a UI bug could show wrong data
even if the backend stores the right value, or a backend bug could store
wrong data even if the UI displays what was sent. Testing both catches both.

---

## Q701.8 — How do you build a reusable API client as a fixture?

Wrapping `APIRequestContext` in a typed client class and exposing it as a
fixture keeps test bodies clean and ensures consistent error handling:

```typescript
// fixtures/ApiClient.ts
import { APIRequestContext } from '@playwright/test';

export class ApiClient {
  constructor(private request: APIRequestContext) {}

  async getUsers() {
    const res = await this.request.get('/api/users');
    expect(res.ok()).toBe(true);
    return res.json();
  }

  async createUser(data: { name: string; email: string }) {
    const res = await this.request.post('/api/users', { data });
    expect(res.status()).toBe(201);
    return res.json() as Promise<{ id: string; name: string }>;
  }

  async deleteUser(id: string) {
    const res = await this.request.delete(`/api/users/${id}`);
    expect(res.status()).toBe(204);
  }
}

// fixtures/index.ts
export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  },
});

// test file
test('create and delete user', async ({ api }) => {
  const user = await api.createUser({ name: 'Alice', email: 'alice@test.com' });
  await api.deleteUser(user.id);
});
```

---

## Q701.9 — How do you use the API to set up test preconditions quickly?

API setup in `beforeAll` is the fastest way to create test preconditions.
It avoids the browser entirely and runs in seconds instead of minutes:

```typescript
test.describe('User Search', () => {
  let userId: string;

  test.beforeAll(async ({ request }) => {
    // Create a known user via API
    const res = await request.post('/api/users', {
      data: { name: 'Known User', email: `known-${Date.now()}@test.com` },
    });
    const user = await res.json();
    userId = user.id;
  });

  test.afterAll(async ({ request }) => {
    if (userId) await request.delete(`/api/users/${userId}`);
  });

  test('user appears in search results', async ({ page }) => {
    await page.goto('/admin/users');
    await page.getByPlaceholder('Search users').fill('Known User');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Known User')).toBeVisible();
  });
});
```

Compared to creating the user via UI (navigate → fill form → submit →
wait for confirmation), API setup is typically 5–10× faster and eliminates
a potential point of flakiness.

---

## Q701.10 — How does CORS behave differently for the request fixture vs page.request?

CORS is a browser security feature — it only applies to requests made from
within a browser page.

**`request` fixture** runs in Node.js, not in a browser. There is no
`Origin` header restriction. CORS does not apply. Any API endpoint is
reachable regardless of CORS configuration.

**`page.request`** runs in the browser context. CORS applies because the
browser enforces origin restrictions. If the API does not include the
correct `Access-Control-Allow-Origin` header, the browser blocks the request.

This distinction matters for testing CORS itself:

```typescript
// Testing that CORS is configured correctly — needs page.request (browser)
test('API allows our origin', async ({ page }) => {
  await page.goto('/');
  const response = await page.request.get('/api/data');
  // If CORS is broken, this fails even though the API works fine from Node.js
  expect(response.status()).toBe(200);
});
```

Use the `request` fixture (no CORS) for all setup, teardown, and pure API
tests. Use `page.request` only when testing that your CORS configuration
is correct from a browser origin.

---

## Q701.11 — How do you handle multipart file uploads in API tests?

```typescript
test('upload a profile image via API', async ({ request }) => {
  const imageBuffer = Buffer.from(
    await readFile(path.join(__dirname, 'fixtures/test-image.png'))
  );

  const response = await request.post('/api/users/1/avatar', {
    multipart: {
      file: {
        name:     'avatar.png',
        mimeType: 'image/png',
        buffer:   imageBuffer,
      },
      userId: '1',
    },
  });

  expect(response.status()).toBe(200);
  const body = await response.json();
  expect(body.avatarUrl).toMatch(/\.png$/);
});
```

The `multipart` option sends `Content-Type: multipart/form-data` automatically.
The `form` option sends `Content-Type: application/x-www-form-urlencoded`.
The `data` option (default) sends `Content-Type: application/json`.

---

## Q701.12 — How did you use the API testing layer in your project?

In our OrangeHRM project, we use API calls in three places.

**`beforeAll` setup** — every test that needs an employee record creates one
via `EmployeeApi.create()`. The entire employee creation takes under 200ms
via API. Creating the same employee through the UI takes 8–12 seconds.

**`afterAll` cleanup** — API cleanup is guarded: `if (empNumber) await employeeApi.delete(empNumber)`. This prevents double-delete failures when a test itself fails before the employee number is assigned.

**Cross-layer verification** — for a test that verifies the PIM module saves
employee data correctly, we fill the UI form, click Save, then immediately
call the API to read the saved record. This catches bugs where the UI shows
a success toast but the backend silently discarded a field — a failure mode
that a pure UI assertion would miss.

Our `ApiClient` class wraps `request.newContext()` with Basic Auth headers
pre-configured. The fixture system injects it at both `beforeAll` scope
(worker-level for shared data) and test scope (for data unique to one test).

---

## Q701.13 — How do you write schema validation for API responses?

Playwright does not include a JSON schema library, but you can integrate
one easily:

```typescript
// Using Zod for schema validation
import { z } from 'zod';

const UserSchema = z.object({
  id:    z.number(),
  name:  z.string().min(1),
  email: z.string().email(),
  role:  z.enum(['admin', 'user', 'viewer']),
});

test('GET /api/users/:id response matches schema', async ({ request }) => {
  const response = await request.get('/api/users/1');
  const body = await response.json();

  // Schema validation — throws a descriptive error if structure is wrong
  const result = UserSchema.safeParse(body);
  expect(result.success).toBe(true);
  if (!result.success) {
    console.log('Schema errors:', result.error.issues);
  }
});
```

Schema validation catches API contract breakage — when the backend changes
a field name, removes a required field, or changes a type. A `toHaveProperty`
assertion on a specific value misses structural regressions. Schema validation
catches them.

---

## Q701.14 — What is the test pyramid and how does it apply to Playwright API testing?

The test pyramid says: many fast unit tests at the bottom, fewer integration
tests in the middle, fewest UI tests at the top. Playwright spans two layers:

**API tests (middle layer):**
- No browser → runs in milliseconds
- No UI rendering → no flakiness from CSS, layout, or animation
- Tests the contract between frontend and backend
- Good for: CRUD validation, error codes, schema, authentication

**UI tests (top layer):**
- Requires browser → slower (seconds per test)
- Validates the complete user-facing flow
- Good for: critical paths, visual output, user-facing error messages

In practice, I run API tests on every commit (fast, cheap) and UI tests on
pull requests (slower but essential). The hybrid pattern sits between — it
uses API setup to get to the interesting state fast, then validates the UI
renders it correctly. This gives the coverage of UI tests at closer to API
test speed for the setup phase.

---

## Q701.15 — How do you verify that a UI action triggered the correct API request?

```typescript
test('cart update sends the correct API request', async ({ page }) => {
  await page.goto('/products/laptop-pro');

  // Start capturing BEFORE the click
  const requestPromise = page.waitForRequest(
    req => req.url().includes('/api/cart') && req.method() === 'POST'
  );

  await page.getByRole('button', { name: 'Add to Cart' }).click();
  const req = await requestPromise;

  // Verify the request payload
  const payload = req.postDataJSON();
  expect(payload).toMatchObject({
    productId: 'laptop-pro',
    quantity:  1,
  });
});
```

`page.waitForRequest()` captures the outgoing request before it leaves the
browser. `page.waitForResponse()` captures the response after it arrives.
Both must be started before the action that triggers them — use `Promise.all`
or declare the promise before the click to avoid missing fast responses.

---

## Q701.16 — Write a complete API test for creating and deleting a user with cleanup.

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Management API', () => {

  let userId: string;

  test.afterAll(async ({ request }) => {
    // Safety net — delete even if the test itself fails partway through
    if (userId) {
      await request.delete(`/api/users/${userId}`);
    }
  });

  test('POST creates user and DELETE removes it', async ({ request }) => {

    // CREATE
    const createRes = await request.post('/api/users', {
      data: {
        name:  'Temp User',
        email: `temp-${Date.now()}@test.com`,
        role:  'viewer',
      },
    });
    expect(createRes.status()).toBe(201);
    const user = await createRes.json();
    userId = user.id;
    expect(userId).toBeDefined();

    // VERIFY EXISTS
    const getRes = await request.get(`/api/users/${userId}`);
    expect(getRes.ok()).toBe(true);
    const fetched = await getRes.json();
    expect(fetched.name).toBe('Temp User');

    // DELETE
    const deleteRes = await request.delete(`/api/users/${userId}`);
    expect(deleteRes.status()).toBe(204);

    // VERIFY GONE
    const goneRes = await request.get(`/api/users/${userId}`);
    expect(goneRes.status()).toBe(404);

    // Clear the safety net — already deleted
    userId = '';
  });

});
```

The `afterAll` guard ensures cleanup happens even if the test fails before
the delete step. Setting `userId = ''` after successful deletion prevents
the `afterAll` from attempting a double-delete on a 404 endpoint.

---

## Q701.17 — How do you handle API tests for endpoints that require authentication?

Three approaches, from simplest to most robust:

**Option 1 — Inline headers:** Add `Authorization` to every call. Simple but
repetitive.

```typescript
const token = process.env.API_TOKEN!;
const response = await request.get('/api/users', {
  headers: { 'Authorization': `Bearer ${token}` },
});
```

**Option 2 — Pre-configured context:** Create an `APIRequestContext` with
`extraHTTPHeaders` set once; every call from that context is authenticated.

```typescript
const authCtx = await request.newContext({
  extraHTTPHeaders: { 'Authorization': `Bearer ${process.env.API_TOKEN}` },
});
const response = await authCtx.get('/api/users');
await authCtx.dispose();
```

**Option 3 — Login and use cookies:** Call the login endpoint, let Playwright
save the session cookie in the context, then use the same context for
subsequent calls.

```typescript
test('authenticated API calls', async ({ request }) => {
  // Login to get session cookies
  await request.post('/api/auth/login', {
    data: { email: 'admin@test.com', password: 'pass123' },
  });
  // Session cookie is now stored in the request context
  const response = await request.get('/api/admin/users');
  expect(response.ok()).toBe(true);
});
```

---

## Q701.18 — In your project, when did you need API testing and what value did it provide?

In our OrangeHRM framework, API testing provided value in three distinct
scenarios.

**Speed.** Before adding API setup, the suite's `beforeEach` created an
employee via UI for each test. Login, navigate, fill form, submit — 15 seconds
per test. With 40 tests in the PIM suite, that was 10 minutes of setup.
Moving to `EmployeeApi.create()` in `beforeAll` cut setup to under 2 seconds
for the whole suite.

**Reliability.** Leave module tests were failing intermittently because the
leave request form's date picker was slow to render. The test was spending
half its time fighting the date picker just to set up a precondition. Moving
leave request creation to `LeaveApi.createRequest()` eliminated those failures
entirely — the test starts directly at the assertion.

**Cross-layer verification.** When the OrangeHRM demo site had a bug where the
UI showed "Successfully Saved" but the employee record was not persisted, our
hybrid tests caught it: the UI assertion passed but the immediate API read
returned 404. Without the API layer, we would have had a green test suite
against a broken backend.

---

## Chapter Summary

- The `request` fixture provides an `APIRequestContext` — a Node.js HTTP client with Playwright conveniences (baseURL, cookies, JSON parsing).
- `request` (standalone) has no browser cookies. `page.request` shares cookies with the browser session it belongs to.
- CORS does not apply to `request` (Node.js); it does apply to `page.request` (browser context).
- The UI+API hybrid pattern — API setup → UI test → API assertion — is the most valuable pattern: fast precondition creation, UI coverage, and cross-layer data verification.
- `response.ok()` is true for any 200–299 status. `response.status()` gives the exact code.
- `data:` sends JSON; `form:` sends URL-encoded; `multipart:` sends multipart form data.
- Use `page.waitForRequest()` or `page.waitForResponse()` to capture and assert on network traffic triggered by UI actions.
- API setup in `beforeAll` is typically 5–10× faster than equivalent UI setup for creating test preconditions.
- Schema validation with Zod or similar catches API contract breakage that `toHaveProperty` assertions miss.
- Cleanup in `afterAll` should be guarded: `if (id) await api.delete(id)` prevents double-delete failures when the test fails before the ID is assigned.
