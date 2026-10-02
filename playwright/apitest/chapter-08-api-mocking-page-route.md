# Chapter 8 — API Mocking with page.route()

---

## What You Will Learn

- What `page.route()` does and how it differs from the `request` fixture
- The three route actions: fulfill, continue, abort
- How to test UI error states without a real server
- URL pattern syntax for intercepting specific requests

---

## 8.1 What is page.route()?

`page.route()` intercepts HTTP requests made by the browser's JavaScript runtime. It runs at the browser level — inside the browser process. This is completely different from the `request` fixture, which makes direct HTTP calls from Node.js.

When your UI calls `fetch('/employees')`, `page.route()` intercepts that call before it reaches the server and lets you substitute your own response.

Use `page.route()` when:
- The API server is not running or not yet built
- You need to test how the UI handles specific errors (500, 404, network failure)
- You need deterministic data that is hard to produce from a real server
- You want to test the UI in isolation from the backend

---

## 8.2 The Three Route Actions

**`route.fulfill()`** — respond yourself, never hit the server:

```typescript
await page.route('**/employees', async (route) => {
  await route.fulfill({
    status:      200,
    contentType: 'application/json',
    body:        JSON.stringify([{ id: 'emp-001', firstName: 'Mocked', ... }]),
  });
});
```

**`route.continue()`** — let the real request go through:

```typescript
await page.route('**/employees', async (route) => {
  if (route.request().method() === 'GET') {
    await route.fulfill({ status: 200, body: JSON.stringify([]) });
  } else {
    await route.continue();  // POST, DELETE, etc. go through normally
  }
});
```

**`route.abort()`** — simulate a network failure:

```typescript
await page.route('**/employees', async (route) => {
  await route.abort();  // the browser gets a network error — no response at all
});
```

---

## 8.3 URL Pattern Syntax

| Pattern | What It Matches |
|---------|----------------|
| `**/employees` | Any URL ending in `/employees`, any domain |
| `**/employees/**` | `/employees/` followed by anything (e.g. individual IDs) |
| `https://api.company.com/employees` | Exact URL only |
| `**/employees?**` | Any URL with `/employees` and a query string |

---

## Build It / Understand It / Test It

```typescript
test('employee list — renders names returned by the API', async ({ page }) => {
  const mockEmployees = [
    { id: 'emp-001', firstName: 'Mocked', lastName: 'Alice', email: 'alice@company.com',
      department: 'Engineering', role: 'Engineer', createdAt: '2025-01-01T00:00:00Z' },
    { id: 'emp-002', firstName: 'Mocked', lastName: 'Bob',   email: 'bob@company.com',
      department: 'HR',          role: 'Manager',  createdAt: '2025-01-02T00:00:00Z' },
  ];

  // Intercept GET /employees and return mock data
  await page.route('**/employees', async (route) => {
    if (route.request().method() === 'GET') {
      await route.fulfill({
        status:      200,
        contentType: 'application/json',
        body:        JSON.stringify(mockEmployees),
      });
    } else {
      await route.continue();
    }
  });

  await page.goto('/employees');

  await expect(page.getByText('Mocked Alice')).toBeVisible();
  await expect(page.getByText('Mocked Bob')).toBeVisible();
});

test('employee list — shows error message when API returns 500', async ({ page }) => {
  await page.route('**/employees', async (route) => {
    await route.fulfill({
      status:      500,
      contentType: 'application/json',
      body:        JSON.stringify({ error: 'Internal Server Error' }),
    });
  });

  await page.goto('/employees');

  await expect(page.getByText('Something went wrong')).toBeVisible();
});

test('employee list — shows offline message on network failure', async ({ page }) => {
  await page.route('**/employees', async (route) => {
    await route.abort();  // simulate total network failure
  });

  await page.goto('/employees');

  await expect(page.getByText('Unable to connect')).toBeVisible();
});

test('employee list — shows loading state before data arrives', async ({ page }) => {
  // Delay the response to see the loading state
  await page.route('**/employees', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 2000));  // 2-second delay
    await route.fulfill({
      status:      200,
      contentType: 'application/json',
      body:        JSON.stringify([]),
    });
  });

  await page.goto('/employees');

  // Loading state should appear before data loads
  await expect(page.getByText('Loading...')).toBeVisible();
});
```

---

## Interview Questions — Chapter 8

**Q1. What is the difference between `page.route()` and the `request` fixture?**

`page.route()` intercepts HTTP requests made by the browser's JavaScript — `fetch()` or `XMLHttpRequest` calls inside your web page. The `request` fixture makes direct HTTP calls from Node.js, outside the browser. Use `page.route()` to mock API responses for the browser UI. Use `request` to call APIs directly in tests without a browser.

**Q2. When would you use `route.abort()` instead of `route.fulfill()`?**

Use `route.abort()` to simulate a total network failure — no response at all. This is different from a 500 error, which is a valid HTTP response with an error status. `route.abort()` mimics what happens when the server is unreachable: the browser gets a network error, not an HTTP response. Use it to test how the UI handles complete connectivity loss.

**Q3. How do you intercept only GET requests and let POST requests through?**

Check `route.request().method()` inside the route handler. Call `route.fulfill()` when the method is GET and `route.continue()` for all other methods.

**Q4. What is the URL pattern `**/employees` and what does it match?**

The `**` is a wildcard that matches any prefix. `**/employees` matches any URL that ends with `/employees` — regardless of domain, port, or preceding path. It matches `http://localhost:3000/employees`, `https://api.company.com/v1/employees`, and anything else ending in `/employees`.

**Q5. How would you use `page.route()` to test a 429 Too Many Requests response?**

Set up a route that returns `status: 429`. Assert that the UI displays an appropriate message — for example "You have sent too many requests. Please wait before trying again." This test verifies that the UI handles rate limiting gracefully without requiring a real rate-limited server.

**Q6. In your project, how did you decide when to use mocking vs a real API call?**

We used mocking for UI error states — 500, 404, network failures, slow responses — that are difficult to reliably reproduce from a real server. We used real API calls for everything else. Mocking too much removes confidence that the real integration works. The goal is to test UI error handling in isolation while keeping most tests end-to-end.

---
