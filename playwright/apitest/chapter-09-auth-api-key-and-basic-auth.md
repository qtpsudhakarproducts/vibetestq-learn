# Chapter 9 — Authentication Part 1: API Key and Basic Auth

---

## What You Will Learn

- What authentication is and why APIs need it
- How API Key authentication works — header and query param
- How Basic Auth works and what Base64 encoding means
- How Playwright handles each type natively

---

## 9.1 What Authentication Does

Every endpoint built so far is open. Anyone who knows the URL can call it. Real APIs are not like that. They require the caller to prove who they are before allowing access.

Authentication is enforced by **middleware** — a function that runs before every route handler. If the middleware rejects the request, the route handler never runs.

A rejected request returns:

```
Status: 401 Unauthorized
```

401 means the caller did not provide valid credentials. 403 means the caller is authenticated but does not have permission for this specific resource.

---

## 9.2 API Key Authentication

### Build It

```javascript
const VALID_API_KEYS = ['key-abc-123', 'key-xyz-789'];

function requireApiKey(req, res, next) {
  const key = req.headers['x-api-key'] || req.query.apiKey;

  if (!key || !VALID_API_KEYS.includes(key)) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }

  next();
}

app.use('/employees', requireApiKey);
```

### Understand It

Keys can be sent two ways:

```
GET /employees
X-API-Key: key-abc-123
```

or

```
GET /employees?apiKey=key-abc-123
```

Headers are standard. Query params work but URLs are often logged by servers and proxies — making query param keys visible in logs.

**What to know as a tester:** The middleware runs before the route handler. A wrong key never reaches the employee logic. You are testing the security gate, not what is behind it. Test with a valid key, a wrong key, and no key.

### Test It

```typescript
const VALID_KEY   = 'key-abc-123';
const INVALID_KEY = 'wrong-key';

test('API Key — valid key in header succeeds', async ({ request }) => {
  const response = await request.get('/employees', {
    headers: { 'X-API-Key': VALID_KEY },
  });
  expect(response.status()).toBe(200);
});

test('API Key — valid key as query param succeeds', async ({ request }) => {
  const response = await request.get('/employees', {
    params: { apiKey: VALID_KEY },
  });
  expect(response.status()).toBe(200);
});

test('API Key — wrong key returns 401', async ({ request }) => {
  const response = await request.get('/employees', {
    headers: { 'X-API-Key': INVALID_KEY },
  });
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBe('Invalid or missing API key');
});

test('API Key — no key returns 401', async ({ request }) => {
  const response = await request.get('/employees');
  expect(response.status()).toBe(401);
});
```

---

## 9.3 Basic Auth

### Build It

No extra libraries. Node.js decodes Base64 natively.

```javascript
function requireBasicAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Employee API"');
    return res.status(401).json({ error: 'Basic authentication required' });
  }

  const base64Credentials = authHeader.split(' ')[1];
  const decoded = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = decoded.split(':');

  if (username !== 'admin' || password !== 'password123') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  next();
}

app.use('/employees', requireBasicAuth);
```

### Understand It

The Authorization header for Basic Auth looks like:

```
Authorization: Basic YWRtaW46cGFzc3dvcmQxMjM=
```

`YWRtaW46cGFzc3dvcmQxMjM=` is the Base64 encoding of `admin:password123`. The format is always `username:password` encoded as one string.

**How encoding works:**

```
"admin:password123"
        ↓ Base64 encode
"YWRtaW46cGFzc3dvcmQxMjM="
```

The server reverses it: decode from Base64, split on `:`, check username and password.

**What to know:** Base64 is encoding — not encryption. If the connection is not HTTPS, the credentials are exposed. Anyone who intercepts the request can decode the Base64 string in seconds. Basic Auth is only safe over HTTPS.

The `WWW-Authenticate` header in a 401 response tells the browser what auth scheme to use. Browsers use it to show a login popup automatically.

Playwright handles Basic Auth natively with `httpCredentials`. You pass plain text username and password. Playwright encodes them automatically.

### Test It

```typescript
test('Basic Auth — valid credentials allow access', async ({ playwright }) => {
  const authContext = await playwright.request.newContext({
    baseURL: 'http://localhost:3000',
    httpCredentials: {
      username: 'admin',
      password: 'password123',
    },
  });

  const response = await authContext.get('/employees');
  expect(response.status()).toBe(200);

  await authContext.dispose();
});

test('Basic Auth — wrong password returns 401', async ({ playwright }) => {
  const authContext = await playwright.request.newContext({
    baseURL: 'http://localhost:3000',
    httpCredentials: {
      username: 'admin',
      password: 'wrongpassword',
    },
  });

  const response = await authContext.get('/employees');
  expect(response.status()).toBe(401);

  await authContext.dispose();
});

test('Basic Auth — no credentials returns 401', async ({ request }) => {
  const response = await request.get('/employees');
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBe('Basic authentication required');
});
```

---

## Interview Questions — Chapter 9

**Q1. What is the difference between 401 Unauthorized and 403 Forbidden?**

401 means no valid credentials were provided — the server does not know who is asking. 403 means credentials are valid but the server is refusing the request — the caller is known but does not have permission. A user asking for another user's private data would get 403, not 401.

**Q2. Where can an API key be sent in a request?**

In a request header (most common — e.g. `X-API-Key: key-abc-123`) or as a URL query parameter (`?apiKey=key-abc-123`). Headers are preferred because URLs are often logged by servers, proxies, and browsers — making query param keys visible in logs.

**Q3. What is Base64 and is it secure?**

Base64 is an encoding scheme that converts binary or text data into a string of ASCII characters. It is not encryption. Anyone can decode a Base64 string in seconds without any key or password. Basic Auth is only secure over HTTPS — the encrypted transport layer protects the credentials, not the Base64 encoding.

**Q4. How does Playwright handle Basic Auth without you manually encoding the credentials?**

Use `playwright.request.newContext({ httpCredentials: { username, password } })`. Playwright encodes the credentials as `Base64(username:password)`, constructs the `Authorization: Basic ...` header, and sends it on every request made by that context.

**Q5. Why must you call `authContext.dispose()` after a Basic Auth test?**

Each `newContext()` creates a new request context with its own cookie jar and headers. If you do not dispose it, it stays in memory for the duration of the test run. Calling `dispose()` releases the resources and closes the context. This prevents memory leaks and ensures isolated state between tests.

**Q6. In your project, when did you use API Key authentication vs Basic Auth?**

API keys were used for machine-to-machine integrations — scheduled jobs and internal services calling the API. Basic Auth was used for legacy systems that did not support JWT. For user-facing applications, we used JWT Bearer tokens because they support expiry and embedded claims.

---

