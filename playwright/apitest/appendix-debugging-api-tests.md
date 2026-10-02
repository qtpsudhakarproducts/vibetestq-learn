# Debugging API Tests

---

## D.1 Using --debug Mode

Playwright's debug mode pauses execution and opens the inspector. For API tests (no browser), it outputs each request and response to the terminal with full headers and body.

```bash
npx playwright test --debug
```

For a specific test:

```bash
npx playwright test tests/employees.spec.ts --debug
```

---

## D.2 Reading Trace Files

Playwright records a trace file for every failed test (configured with `trace: 'on-first-retry'`). The trace shows every request, response, headers, body, and timing.

```typescript
// playwright.config.ts
export default defineConfig({
  use: {
    trace: 'on-first-retry',
  },
});
```

View the trace:

```bash
npx playwright show-trace trace.zip
```

The trace viewer shows a timeline of all network calls with full request and response details. Click any call to see the full headers and body.

---

## D.3 Logging Requests and Responses

Add logging to debug a specific test without running the full suite in debug mode:

```typescript
test('debug logging example', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {
      firstName:  'Debug',
      lastName:   'Test',
      email:      'debug@company.com',
      department: 'Engineering',
      role:       'Engineer',
    },
  });

  // Log the full response for debugging
  console.log('Status:', response.status());
  console.log('Headers:', response.headers());
  console.log('Body:', await response.text());    // use .text() to see raw body
});
```

Use `response.text()` instead of `response.json()` when you are not sure the body is valid JSON — `.json()` throws on invalid JSON, `.text()` always returns the raw string.

---

## D.4 Common Error Messages and What They Mean

| Error | Cause | Fix |
|-------|-------|-----|
| `Connection refused` | Server is not running | Start `node server.js` before running tests |
| `SyntaxError: Unexpected end of JSON input` | Called `.json()` on a 204 response | Remove the `.json()` call after DELETE |
| `Error: expected 201, received 400` | Validation failed or body was wrong | Log the response body to see which field failed |
| `Error: read ECONNRESET` | Server crashed during the request | Check server logs for unhandled exceptions |
| `Timeout exceeded while waiting for event` | Request took longer than timeout | Increase `timeout` in config or fix the slow endpoint |

---

## D.5 Inspecting Headers in the Terminal

```typescript
test('inspect all response headers', async ({ request }) => {
  const response = await request.get('/employees');

  const headers = response.headers();
  console.log('Response headers:');
  for (const [key, value] of Object.entries(headers)) {
    console.log(`  ${key}: ${value}`);
  }
});
```

---

## D.6 Checking What Was Actually Sent

Playwright does not expose the request body directly after sending. To debug what you sent, log it before the call:

```typescript
const requestBody = {
  firstName:  'Debug',
  lastName:   'Employee',
  email:      'debug@company.com',
  department: 'Engineering',
  role:       'Engineer',
};

console.log('Sending:', JSON.stringify(requestBody, null, 2));

const response = await request.post('/employees', { data: requestBody });

console.log('Received:', response.status(), await response.text());
```

---
