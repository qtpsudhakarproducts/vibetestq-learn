# Chapter 17 — Error Handling and Edge Cases

---

## What You Will Learn

- How to test network failures and timeouts
- How to handle rate limiting (429)
- How to test large payloads and empty bodies
- How to handle malformed JSON responses

---

## 17.1 Network Failures and Timeouts

Playwright throws an error when a request times out. Wrap calls in try/catch when testing timeout behaviour.

```typescript
test('request times out after configured limit', async ({ playwright }) => {
  const context = await playwright.request.newContext({
    baseURL: 'http://localhost:3000',
    timeout: 100,   // 100ms timeout — very aggressive for testing
  });

  let timedOut = false;
  try {
    await context.get('/employees');
  } catch (err) {
    timedOut = true;
    expect((err as Error).message).toContain('timeout');
  }

  expect(timedOut).toBe(true);
  await context.dispose();
});
```

For UI tests, simulate a slow server with `page.route()`:

```typescript
test('UI shows loading state during slow response', async ({ page }) => {
  await page.route('**/employees', async (route) => {
    await new Promise(resolve => setTimeout(resolve, 3000));  // 3-second delay
    await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
  });

  await page.goto('/employees');
  await expect(page.getByText('Loading...')).toBeVisible();
  await expect(page.getByText('Loading...')).not.toBeVisible({ timeout: 5000 });
});
```

---

## 17.2 Rate Limiting — 429 Too Many Requests

A well-built API limits how many requests a client can make in a given time window. When the limit is exceeded, it returns 429 with a `Retry-After` header.

**Add rate limiting to the server:**

```bash
npm install express-rate-limit
```

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute window
  max:      100,          // 100 requests per window
  message:  { error: 'Too many requests', retryAfter: 60 },
  standardHeaders: true,
  legacyHeaders:   false,
});

app.use('/employees', limiter);
```

**Test 429 behaviour via mocking:**

```typescript
test('UI shows retry message when rate limited', async ({ page }) => {
  await page.route('**/employees', async (route) => {
    await route.fulfill({
      status:  429,
      headers: { 'Retry-After': '60' },
      body:    JSON.stringify({ error: 'Too many requests', retryAfter: 60 }),
    });
  });

  await page.goto('/employees');
  await expect(page.getByText('Too many requests')).toBeVisible();
});

test('API returns 429 when rate limit is exceeded', async ({ request }) => {
  // In a real suite, you would configure the limiter to a low limit for testing
  // Here we verify the response shape when we get a 429
  const response = await request.get('/employees');

  if (response.status() === 429) {
    const body = await response.json();
    expect(body.error).toBeDefined();

    const headers = response.headers();
    expect(headers['retry-after']).toBeDefined();
  }
});
```

---

## 17.3 Large Payloads

Test that the API handles unusually large inputs gracefully.

```typescript
test('POST /employees — very long role string is accepted', async ({ request }) => {
  const longRole = 'A'.repeat(500);  // 500-character role

  const response = await request.post('/employees', {
    data: {
      firstName:  'Long',
      lastName:   'Role',
      email:      'long.role@company.com',
      department: 'Engineering',
      role:       longRole,
    },
  });

  // The API should either accept it (200/201) or reject it with a clear error (400)
  // It must not crash (500)
  expect([201, 400]).toContain(response.status());

  if (response.status() === 400) {
    const body = await response.json();
    expect(body.error).toBeDefined();  // clear error message, not a stack trace
  }
});

test('POST /employees — empty body returns 400', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {},
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.error).toBe('Validation failed');
  expect(body.details.length).toBeGreaterThan(0);
});
```

---

## 17.4 Malformed JSON and Missing Content-Type

```typescript
test('POST /employees — non-JSON body returns 400', async ({ request }) => {
  const response = await request.post('/employees', {
    headers: { 'Content-Type': 'text/plain' },
    data:    'this is not json',
  });

  // Server should reject non-JSON bodies gracefully
  expect([400, 415]).toContain(response.status());
});

test('GET /employees/:id — non-existent ID format returns 404', async ({ request }) => {
  const response = await request.get('/employees/not-a-valid-id');

  expect(response.status()).toBe(404);

  const body = await response.json();
  expect(body.error).toBe('Employee not found');
});
```

---

## 17.5 Boundary Values

Test values at the edges of what the API accepts.

```typescript
test.describe('email edge cases', () => {
  test('email with special characters is accepted', async ({ request }) => {
    const response = await request.post('/employees', {
      data: {
        firstName:  'Plus',
        lastName:   'Email',
        email:      'user+tag@company.co.uk',
        department: 'Engineering',
        role:       'Engineer',
      },
    });
    expect(response.status()).toBe(201);
  });

  test('email without @ symbol returns 400', async ({ request }) => {
    const response = await request.post('/employees', {
      data: {
        firstName:  'Bad',
        lastName:   'Email',
        email:      'notanemailaddress',
        department: 'Engineering',
        role:       'Engineer',
      },
    });
    expect(response.status()).toBe(400);
  });
});
```

---

## Interview Questions — Chapter 17

**Q1. How do you test a timeout in a Playwright API test?**

Create a request context with a very short `timeout` value. Wrap the request in `try/catch`. If the request times out, Playwright throws an error. In the `catch` block, set a flag and assert on the error message. Assert the flag is `true` after the try/catch to confirm the timeout occurred.

**Q2. What is the 429 status code and what should a well-built API return with it?**

429 Too Many Requests means the client has exceeded the rate limit. A well-built API returns 429 with a `Retry-After` header that tells the client how many seconds to wait before retrying, and a response body with a human-readable error message.

**Q3. How do you test 429 behaviour without actually hitting a rate limit?**

Use `page.route()` to simulate a 429 response. Intercept the request and call `route.fulfill({ status: 429, headers: { 'Retry-After': '60' }, body: ... })`. This tests how the UI handles rate limiting without requiring a real rate limiter or making enough requests to trigger it.

**Q4. Why is it important to test empty bodies and malformed JSON?**

These are the inputs that crash poorly written APIs. A server that crashes on an empty body returns a 500 (or no response at all) instead of a clean 400. Testing these edge cases confirms the API handles unexpected inputs gracefully — returning a useful error message instead of exposing a stack trace.

**Q5. What is a boundary value test?**

A test that uses values at the edge of what the API accepts or rejects. Examples: a string at exactly the maximum length, a number at the minimum allowed value, an email address with unusual but valid characters. Boundary values are where bugs are most likely to appear — the code that validates lengths and formats often has off-by-one errors or misses edge cases.

---

