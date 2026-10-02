# Chapter 10 — Authentication Part 2: Bearer Token and JWT

---

## What You Will Learn

- How Bearer Token / JWT authentication works
- The two-step pattern: login then use
- How to decode JWT claims in a test
- How to build reusable auth fixtures

---

## Build It

```bash
npm install jsonwebtoken
```

```javascript
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'my-super-secret-key';

// Login endpoint — issues a JWT when credentials are correct
app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== 'admin' || password !== 'password123') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  const token = jwt.sign(
    { username, role: 'admin' },   // payload embedded in the token
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  res.status(200).json({ token });
});

// Middleware — verify a JWT on every request
function requireBearerToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];  // extract after "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;   // attach decoded payload — available in route handlers
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

app.use('/employees', requireBearerToken);
```

---

## Understand It

### What a JWT Is

A JWT (JSON Web Token) is a string in three Base64-encoded parts separated by dots:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9   ← header
.
eyJ1c2VybmFtZSI6ImFkbWluIiwicm9sZSI6ImFkbWluIn0  ← payload
.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c  ← signature
```

The **header** says which algorithm was used. The **payload** holds the data — `username`, `role`, `exp` (expiry). The **signature** is a cryptographic hash that prevents tampering.

Anyone can decode the header and payload — they are Base64-encoded, not encrypted. But changing any part of the token invalidates the signature. The server verifies the signature with `jwt.verify()`. A changed token always fails.

### The Two-Step Pattern

1. Call the login endpoint to get a token
2. Send the token in the `Authorization` header on every subsequent request

```
POST /login
{ "username": "admin", "password": "password123" }

→ { "token": "eyJhbGciOi..." }

GET /employees
Authorization: Bearer eyJhbGciOi...
```

The word `Bearer` and the space before the token are required. The middleware splits on the space: `authHeader.split(' ')[1]`.

---

## Decoding JWT Claims in Tests

The token payload is Base64-encoded. You can decode it in a test to verify the server embedded the right claims. This does not verify the signature — it only reads the data.

```typescript
function decodeJwtPayload(token: string): Record<string, unknown> {
  const payloadPart = token.split('.')[1];
  const decoded = Buffer.from(payloadPart, 'base64').toString('utf8');
  return JSON.parse(decoded);
}

test('Bearer Token — token contains expected claims', async ({ request }) => {
  const loginResponse = await request.post('/login', {
    data: { username: 'admin', password: 'password123' },
  });
  const { token } = await loginResponse.json();

  const payload = decodeJwtPayload(token);

  expect(payload.username).toBe('admin');
  expect(payload.role).toBe('admin');

  // Verify the token is not already expired
  const nowSeconds = Math.floor(Date.now() / 1000);
  expect(payload.exp as number).toBeGreaterThan(nowSeconds);
});
```

---

## Reusable Auth Fixtures

When many tests need a valid token, repeating the login call in every test is slow and duplicated. Playwright fixtures solve this by running setup once and making the result available to any test that uses it.

```typescript
// tests/auth-fixtures.ts
import { test as base, expect, APIRequestContext } from '@playwright/test';

type AuthFixtures = {
  authedRequest: APIRequestContext;
};

export const test = base.extend<AuthFixtures>({
  authedRequest: async ({ playwright }, use) => {
    // Log in once
    const tempContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
    });
    const loginResponse = await tempContext.post('/login', {
      data: { username: 'admin', password: 'password123' },
    });
    const { token } = await loginResponse.json();
    await tempContext.dispose();

    // Create a context that sends the token automatically on every request
    const authContext = await playwright.request.newContext({
      baseURL: 'http://localhost:3000',
      extraHTTPHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    await use(authContext);          // hand to the test
    await authContext.dispose();     // clean up after
  },
});

export { expect };
```

```typescript
// tests/employees-auth.spec.ts
import { test, expect } from './auth-fixtures';

test('get employees — authenticated via fixture', async ({ authedRequest }) => {
  const response = await authedRequest.get('/employees');
  expect(response.ok()).toBe(true);
});

test('create employee — authenticated via fixture', async ({ authedRequest }) => {
  const response = await authedRequest.post('/employees', {
    data: {
      firstName:  'Nick',
      lastName:   'Fury',
      email:      'nick.fury@company.com',
      department: 'HR',
      role:       'Director',
    },
  });
  expect(response.status()).toBe(201);
});
```

When the login endpoint changes, you update the fixture. Every test adapts automatically.

---

## Test It

```typescript
test('Bearer Token — login returns a token', async ({ request }) => {
  const response = await request.post('/login', {
    data: { username: 'admin', password: 'password123' },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(typeof body.token).toBe('string');
  expect(body.token.length).toBeGreaterThan(0);
});

test('Bearer Token — valid token allows access', async ({ request }) => {
  const loginResponse = await request.post('/login', {
    data: { username: 'admin', password: 'password123' },
  });
  const { token } = await loginResponse.json();

  const response = await request.get('/employees', {
    headers: { Authorization: `Bearer ${token}` },
  });

  expect(response.status()).toBe(200);
});

test('Bearer Token — wrong password returns 401', async ({ request }) => {
  const response = await request.post('/login', {
    data: { username: 'admin', password: 'wrongpassword' },
  });

  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBe('Invalid username or password');
});

test('Bearer Token — missing token returns 401', async ({ request }) => {
  const response = await request.get('/employees');
  expect(response.status()).toBe(401);
});

test('Bearer Token — tampered token returns 401', async ({ request }) => {
  const fakeToken = 'eyJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZmFrZSJ9.invalidsignature';

  const response = await request.get('/employees', {
    headers: { Authorization: `Bearer ${fakeToken}` },
  });

  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBe('Invalid or expired token');
});
```

---

## Interview Questions — Chapter 10

**Q1. What is a JWT and what are its three parts?**

A JWT (JSON Web Token) is a self-contained token with three Base64-encoded parts separated by dots. The header says which algorithm was used to sign the token. The payload holds the data — user ID, role, expiry time. The signature is a cryptographic hash that prevents tampering. Changing any part of the token invalidates the signature.

**Q2. If a JWT payload is Base64-encoded and not encrypted, is it safe to store sensitive data in it?**

No. Base64 is encoding — anyone can decode it. The payload of a JWT is readable by anyone who intercepts the token. Never store passwords, credit card numbers, or other sensitive data in a JWT payload. Store only non-sensitive identifiers like user ID, role, and expiry time.

**Q3. What does `jwt.verify()` do and what happens when it fails?**

`jwt.verify()` checks the token's signature using the server's secret key. If the signature is valid, it decodes and returns the payload. If the token is expired, malformed, or has been tampered with, `jwt.verify()` throws an exception. The `try/catch` block catches this exception and returns a 401 response.

**Q4. Why must you send the Authorization header on every request with JWT?**

JWT authentication is stateless. The server does not store sessions. There is no memory of previous requests. Each request must prove its own identity by including the token. The server verifies the signature on every request.

**Q5. What is a Playwright fixture and why is it useful for auth testing?**

A fixture is setup code that Playwright runs before a test and cleanup code it runs after. It makes the result — in this case, an authenticated request context — available as a parameter to any test that uses it. This eliminates the login call from every individual test, keeps tests focused on what they are testing, and centralises the auth logic so it only needs to change in one place.

**Q6. What is the difference between `response.ok()` and `response.status()`?**

`response.ok()` returns `true` for any status in the 2xx range (200–299). Use it when you only care that the request succeeded. `response.status()` returns the exact three-digit code. Use it when you need to distinguish 200 from 201 or confirm a 204.

**Q7. How would you decode a JWT payload in a Playwright test without verifying the signature?**

Split the token on `.`, take the second part (index 1), decode it from Base64: `Buffer.from(part, 'base64').toString('utf8')`, then parse as JSON. This reads the payload without verifying the signature. Use it to confirm the server embedded the right claims — username, role, and expiry time.

**Q8. How do you test that a token that has been tampered with is rejected?**

Construct a fake token string that looks like a JWT (three dot-separated parts) but has an invalid signature. Send it in the `Authorization: Bearer` header. Assert a 401 response and that `body.error` equals `'Invalid or expired token'`. This confirms the server is verifying the signature and not just checking that a token exists.

---

