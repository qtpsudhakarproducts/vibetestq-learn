# Chapter 11 — Authentication Part 3: Cookie/Session and OAuth 2.0

---

## What You Will Learn

- How cookie-based session authentication works
- How Playwright's cookie jar handles sessions automatically
- How OAuth 2.0 differs from direct authentication
- The two grant types and when each is used
- Why OAuth token requests use `form:` not `data:`

---

## 11.1 Cookie / Session Authentication

### Build It

```bash
npm install express-session
```

```javascript
const session = require('express-session');

app.use(session({
  secret:            'session-secret-key',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,   // not accessible from JavaScript
    maxAge:   3600000, // 1 hour
  },
}));

app.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (username !== 'admin' || password !== 'password123') {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  req.session.user = { username, role: 'admin' };
  res.status(200).json({ message: 'Logged in successfully' });
  // express-session sends Set-Cookie automatically
});

app.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ error: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.status(200).json({ message: 'Logged out successfully' });
  });
});

function requireSession(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not authenticated. Please log in.' });
  }
  next();
}

app.use('/employees', requireSession);
```

### Understand It

**Login response:**

```
Status: 200 OK
Set-Cookie: connect.sid=s%3Axxx...; Path=/; HttpOnly
```

The server sends `Set-Cookie`. The browser (or Playwright) stores the cookie. Every subsequent request automatically includes:

```
Cookie: connect.sid=s%3Axxx...
```

The `requireSession` middleware reads the cookie, looks up the session, and checks `req.session.user`. If it exists, the request proceeds.

**Playwright's advantage:** The `request` fixture has a built-in cookie jar. A single `request` instance shares cookies across all calls in the same test. You do not manage cookies manually. After login, every subsequent call in the same test automatically carries the session cookie.

After logout, the session is destroyed server-side. The cookie in the client is no longer valid. Any subsequent request returns 401.

### Test It

```typescript
test('Cookie Auth — login creates session and allows access', async ({ request }) => {
  const loginResponse = await request.post('/login', {
    data: { username: 'admin', password: 'password123' },
  });
  expect(loginResponse.status()).toBe(200);

  // Cookie is automatically carried on this next request
  const getResponse = await request.get('/employees');
  expect(getResponse.status()).toBe(200);
});

test('Cookie Auth — no login returns 401', async ({ request }) => {
  const response = await request.get('/employees');
  expect(response.status()).toBe(401);

  const body = await response.json();
  expect(body.error).toBe('Not authenticated. Please log in.');
});

test('Cookie Auth — after logout returns 401', async ({ request }) => {
  await request.post('/login', { data: { username: 'admin', password: 'password123' } });

  const before = await request.get('/employees');
  expect(before.status()).toBe(200);

  await request.post('/logout');

  const after = await request.get('/employees');
  expect(after.status()).toBe(401);
});
```

---

## 11.2 OAuth 2.0

### What OAuth 2.0 Is

OAuth 2.0 is a delegation framework. A client application obtains a short-lived **access token** that proves it has been granted specific **scopes** (permissions). The access token is then used exactly like a Bearer token.

OAuth is for third-party access. Instead of giving a third-party app your password, you grant it a token with limited permissions. The app can access only what the token allows.

**Two grant types you will encounter in testing:**

| Grant Type | Who Uses It | When |
|---|---|---|
| client_credentials | Machine-to-machine | A backend service calling another service |
| password | Client on behalf of a user | A trusted client submitting user credentials |

### Build It

```javascript
app.post('/oauth/token', (req, res) => {
  const { grant_type, client_id, client_secret, username, password, scope } = req.body;

  const validClients = { 'client-app-001': 'client-secret-abc' };

  if (!validClients[client_id] || validClients[client_id] !== client_secret) {
    return res.status(401).json({
      error:             'invalid_client',
      error_description: 'Client authentication failed',
    });
  }

  if (grant_type === 'client_credentials') {
    const accessToken = jwt.sign(
      { client_id, scope: scope || 'read' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    return res.status(200).json({
      access_token: accessToken,
      token_type:   'Bearer',
      expires_in:   3600,
      scope:        scope || 'read',
    });
  }

  if (grant_type === 'password') {
    if (username !== 'admin' || password !== 'password123') {
      return res.status(401).json({
        error:             'invalid_grant',
        error_description: 'Invalid username or password',
      });
    }
    const accessToken  = jwt.sign({ username, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    const refreshToken = jwt.sign({ username, type: 'refresh_token' }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(200).json({
      access_token:  accessToken,
      refresh_token: refreshToken,
      token_type:    'Bearer',
      expires_in:    3600,
    });
  }

  res.status(400).json({ error: 'unsupported_grant_type' });
});
```

### Understand It

**The OAuth token request must be form-encoded — not JSON.**

This is the OAuth 2.0 specification. The content type must be `application/x-www-form-urlencoded`. In Playwright, use `form:` instead of `data:`. Using `data:` sends JSON — the token endpoint will reject it.

```typescript
// ❌ Wrong — sends JSON, OAuth spec requires form encoding
await request.post('/oauth/token', {
  data: { grant_type: 'client_credentials', ... }
});

// ✅ Correct — sends form-encoded data
await request.post('/oauth/token', {
  form: { grant_type: 'client_credentials', ... }
});
```

**Token response (both grant types):**

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type":   "Bearer",
  "expires_in":   3600,
  "scope":        "read"
}
```

**The password grant also returns a refresh token:**

```json
{
  "access_token":  "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiJ9...",
  "token_type":    "Bearer",
  "expires_in":    3600
}
```

A **refresh token** lets the client get a new access token when the current one expires — without asking the user to log in again.

### Test It

```typescript
test('OAuth — client credentials returns access token', async ({ request }) => {
  const response = await request.post('/oauth/token', {
    form: {
      grant_type:    'client_credentials',
      client_id:     'client-app-001',
      client_secret: 'client-secret-abc',
      scope:         'read',
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(typeof body.access_token).toBe('string');
  expect(body.token_type).toBe('Bearer');
  expect(body.expires_in).toBe(3600);
});

test('OAuth — invalid client secret returns 401', async ({ request }) => {
  const response = await request.post('/oauth/token', {
    form: {
      grant_type:    'client_credentials',
      client_id:     'client-app-001',
      client_secret: 'wrong-secret',
    },
  });

  expect(response.status()).toBe(401);
  expect((await response.json()).error).toBe('invalid_client');
});

test('OAuth — password grant returns access and refresh tokens', async ({ request }) => {
  const response = await request.post('/oauth/token', {
    form: {
      grant_type:    'password',
      client_id:     'client-app-001',
      client_secret: 'client-secret-abc',
      username:      'admin',
      password:      'password123',
    },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(typeof body.access_token).toBe('string');
  expect(typeof body.refresh_token).toBe('string');
});

test('OAuth — access token works on protected endpoint', async ({ request }) => {
  const tokenResponse = await request.post('/oauth/token', {
    form: {
      grant_type:    'client_credentials',
      client_id:     'client-app-001',
      client_secret: 'client-secret-abc',
    },
  });
  const { access_token } = await tokenResponse.json();

  const apiResponse = await request.get('/employees', {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  expect(apiResponse.status()).toBe(200);
});
```

---

## Auth Comparison Table

| | API Key | Bearer/JWT | Basic Auth | Cookie/Session | OAuth 2.0 |
|---|---|---|---|---|---|
| Login step? | No | Yes | No | Yes | Yes (token endpoint) |
| State on server? | No | No | No | Yes | No |
| Token expiry? | No | Yes | No | Yes (session) | Yes (short-lived) |
| Playwright sends via | `headers:` or `params:` | `headers: { Authorization }` | `httpCredentials:` | Automatic cookie jar | `headers:` after token fetch |
| Best for | Simple M2M | Mobile/SPA | Legacy systems | Browser apps | Third-party integrations |

---

## Interview Questions — Chapter 11

**Q1. How does Playwright handle session cookies without you manually copying them between requests?**

Playwright's `APIRequestContext` has a built-in cookie jar. When a response includes `Set-Cookie`, the context stores the cookie automatically. Every subsequent request from the same context includes the cookie in the `Cookie` header. You do not read, store, or send cookies manually.

**Q2. What is a refresh token and why is it useful?**

A refresh token is a long-lived token returned alongside an access token in some OAuth flows. When the access token expires (typically in 1 hour), the client uses the refresh token to request a new access token without asking the user to log in again. This keeps sessions alive without requiring repeated authentication.

**Q3. Why does the OAuth token endpoint require `form:` instead of `data:` in Playwright?**

The OAuth 2.0 specification requires token requests to use `application/x-www-form-urlencoded` encoding. This is form encoding — not JSON. `data:` in Playwright sends JSON with `Content-Type: application/json`. The token endpoint expects form data and will reject a JSON body. Using `form:` sends the correct encoding.

**Q4. What is a scope in OAuth 2.0?**

A scope defines what the access token is allowed to do. Common scopes are `read`, `write`, `admin`. An access token with scope `read` can call GET endpoints but not POST or DELETE. The client requests scopes when getting a token. The server grants only the scopes it allows. This implements the principle of least privilege.

**Q5. What is the difference between the client_credentials grant and the password grant?**

`client_credentials` is for machine-to-machine access. The client authenticates itself using a client ID and secret. No user is involved. `password` is for when a user provides credentials directly to a trusted client. The client sends both client credentials and user credentials. The response includes a refresh token because a human is involved.

**Q6. After calling the logout endpoint, what two things happen?**

The session is destroyed on the server — `req.session.destroy()` removes the session data from server memory. The session cookie is cleared on the client — `res.clearCookie('connect.sid')` sends a cookie with an expired date, telling the browser to delete it. After this, the cookie is invalid even if the client sends it again.

---
