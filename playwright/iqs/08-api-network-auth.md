# API Testing, Network & Authentication — Interview Questions

---

## Q: Can Playwright be used to test APIs?

**A:** Yes. Playwright includes a built-in `APIRequestContext` that lets you send HTTP requests and assert responses — without opening a browser. You can use it to test REST APIs standalone, or combine it with browser tests to set up data via API, run the UI flow, and clean up via API — giving you faster and more reliable test setup.

---

## Q: What is APIRequestContext?

**A:** `APIRequestContext` is Playwright's HTTP client. It supports GET, POST, PUT, PATCH, DELETE, and HEAD methods. It handles cookies, authentication headers, and respects the `baseURL` configuration. You can get it from the `request` fixture in tests, or create a standalone context with `playwright.request.newContext()` for use outside test files.

---

## Q: How do you send a GET request with the request fixture?

**A:** Call `request.get(url)`, then check the response. `response.status()` gives the HTTP status code, `await response.json()` parses the JSON body, and `response.ok()` returns `true` for 2xx status codes.

```typescript
test('GET users returns 200', async ({ request }) => {
  const response = await request.get('/api/users');
  expect(response.ok()).toBeTruthy();
  const users = await response.json();
  expect(users.length).toBeGreaterThan(0);
});
```

---

## Q: How do you send a POST request?

**A:** Call `request.post(url, { data: body })` where `body` is the request payload — a plain object (serialised to JSON) or a string. Use the `headers` option to set `Content-Type` if the endpoint requires a specific format.

```typescript
const response = await request.post('/api/users', {
  data: { name: 'Alice', email: 'alice@example.com' }
});
expect(response.status()).toBe(201);
```

---

## Q: What is the request fixture in tests?

**A:** `request` is a built-in test fixture that provides a configured `APIRequestContext`. It automatically uses the `baseURL` from your config, so you only need to write path-relative URLs. It is created fresh per test and cleaned up automatically after the test ends.

---

## Q: What is schema validation in API testing?

**A:** Schema validation checks that an API response matches the expected structure — the right fields exist, have the correct types, and required fields are not missing. Use a validation library like `zod` or `ajv` alongside Playwright to parse and validate JSON responses. This catches contract violations between services before they cause UI bugs.

```typescript
import { z } from 'zod';
const UserSchema = z.object({ id: z.number(), name: z.string(), email: z.string().email() });
const user = await response.json();
UserSchema.parse(user); // throws if shape is wrong
```

---

## Q: What is the difference between UI testing and API testing?

**A:** UI testing exercises the full stack through the browser — it validates real user experience, visual rendering, and end-to-end flows. API testing calls the backend directly — it validates business logic, data operations, and response contracts faster and without rendering. API tests are faster, more stable, and less affected by front-end changes. Use both: API for data validation, UI for user experience.

---

## Q: What is network interception in Playwright?

**A:** Network interception lets you observe, modify, or block HTTP requests made by the browser during a test. You register a route handler for a URL pattern. When a matching request is made, Playwright calls your handler instead of forwarding the request normally. You can then fulfill with mock data, abort the request, or continue it unchanged.

---

## Q: What is page.route()?

**A:** `page.route(urlPattern, handler)` registers a request interceptor. The `urlPattern` can be a string with `*` glob wildcards, a regex, or a function. The `handler` receives a `Route` object with methods `fulfill()`, `abort()`, and `continue()`. Use `context.route()` to intercept across all pages in a context.

```typescript
await page.route('**/api/products', route =>
  route.fulfill({ json: [{ id: 1, name: 'Widget', price: 9.99 }] })
);
```

---

## Q: What is route.fulfill()?

**A:** `route.fulfill()` responds to the intercepted request with a custom response — your chosen HTTP status code, headers, and body — without the request ever reaching a real server. Use it to serve mock data, simulate specific server states, test empty results, or test error handling without causing real side effects.

---

## Q: What is route.abort()?

**A:** `route.abort()` cancels the intercepted request immediately. The browser sees the request as failed (network error). Use it to test how the application handles complete network failures — for example, verifying that an error message appears when a critical API call cannot reach the server.

---

## Q: What is route.continue()?

**A:** `route.continue()` allows the request to proceed to the actual server, optionally modifying the request headers, URL, or post data before it's sent. Use it when you need to observe or lightly modify requests without mocking the full response.

---

## Q: When should you mock APIs in tests?

**A:** Mock when: the real API is unstable, slow, or not available in the test environment. You need to test specific response states (empty lists, server errors, rate limits). The API has side effects you want to avoid (sending emails, processing payments). You need deterministic, fast test runs without external dependencies.

---

## Q: What is a HAR file and how does Playwright use it?

**A:** A HAR (HTTP Archive) file is a JSON log of all network requests made by a browser. Playwright can record network traffic to a HAR file during a session. In subsequent tests, you can configure Playwright to serve responses from the recorded HAR instead of making real requests — replaying exactly the same API responses captured from the live application.

---

## Q: What is authentication testing?

**A:** Authentication testing verifies that login, logout, session management, and access control behave correctly. It covers: valid credentials succeed, invalid credentials fail with the correct error, sessions expire correctly, protected pages reject unauthenticated requests, and different user roles see appropriate content and are denied inappropriate access.

---

## Q: What is storageState in Playwright?

**A:** `storageState` is a JSON snapshot of browser state: cookies, `localStorage`, and `sessionStorage`. You save it after a successful login with `await context.storageState({ path: 'auth.json' })`. Load it in tests via the `storageState` option in `playwright.config.ts` or in a fixture. Tests start with a fully authenticated session without going through the login UI.

---

## Q: How do you set up once and reuse authentication across all tests?

**A:** Create a `global.setup.ts` file that logs in once (via UI or API), saves the state with `storageState()`, and exits. Register it as `globalSetup` in `playwright.config.ts`. Set `storageState: 'auth.json'` in the `use` block. Every test starts authenticated. For tests that need to be unauthenticated, override `storageState: undefined` in that test or project.

---

## Q: How do you handle multiple user roles in authentication?

**A:** Create one `auth.json` file per role by running multiple setup steps in global setup — log in as admin, save admin state; log in as viewer, save viewer state. Create one Playwright project per role in `playwright.config.ts`, each pointing to its role's state file. Run role-specific tests in the matching project.

---

## Q: What is OAuth and how do you handle it in Playwright tests?

**A:** OAuth is an authorisation protocol where users are redirected to a provider's login page, authenticate there, and the provider sends an auth code back to your application. For testing OAuth flows: redirect handling works natively in Playwright. For speed and reliability, prefer bypassing the OAuth UI in setup by exchanging credentials directly with the provider's token endpoint and injecting the resulting token into the browser state.

---

## Q: What is JWT authentication and how do tests use it?

**A:** JWT (JSON Web Token) is a compact token containing user identity and claims, signed by the server. Apps include the JWT in request headers (`Authorization: Bearer <token>`). In tests, obtain the JWT by calling the login API directly, then inject it into the browser's storage or set it as a request header in `APIRequestContext` for API tests.

---

## Q: How do you handle MFA (multi-factor authentication) in tests?

**A:** Options in order of preference: ask the team to create test accounts with MFA disabled for the test environment. Use `storageState` to log in once manually with MFA and reuse the saved session. Call the backend API directly (if available) to get tokens, bypassing MFA entirely. Use a TOTP library with the test account's shared secret to generate one-time codes programmatically.

---

## Q: Why should you avoid logging in via UI in every test?

**A:** UI login is slow (multiple page loads and form submissions every time), brittle (any change to the login page breaks all tests), and wasteful (all that work just to get past authentication). With `storageState`, one login at the start of the suite covers everything. Tests run faster and the login form is only tested in dedicated authentication tests.

---

## Q: What is token injection?

**A:** Token injection means programmatically adding an authentication token to the browser without going through the login UI. After obtaining a token via a direct API call, you set it in `localStorage`, cookies, or as an initial script with `page.addInitScript()`. The test starts on any page fully authenticated, with no login navigation required.

---

## Q: How do you store authentication secrets securely in CI?

**A:** Store usernames, passwords, API keys, and tokens as encrypted secrets in your CI platform (GitHub Actions Secrets, environment variables in Jenkins, Azure Key Vault). Reference them in your code via `process.env.TEST_PASSWORD`. Never hardcode credentials or commit them to the repository. Rotate secrets periodically and audit who has access.

---
