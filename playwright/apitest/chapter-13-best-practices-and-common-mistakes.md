# Chapter 13 — Best Practices and Common Mistakes

---

## What You Will Learn

- The five rules that every API test suite must follow
- The six most common mistakes and how to avoid them
- The complete cleanup pattern with afterEach

---

## 13.1 Best Practices

**Rule 1 — Assert status before body.**

If the status code is wrong, the body may not have the shape you expect. Asserting body fields when the status is wrong gives confusing failure messages.

```typescript
// ✅ Status first — clear failure message if code is wrong
expect(response.status()).toBe(201);
const body = await response.json();
expect(body.id).toBeTruthy();
```

**Rule 2 — Make every test self-contained.**

Each test creates its own data. Never rely on a previous test having run first. Never share state between tests through a module-level variable.

```typescript
// ✅ Each test creates what it needs
test('update employee role', async ({ request }) => {
  const createResponse = await request.post('/employees', { data: { ... } });
  const { id } = await createResponse.json();
  // now use id...
});
```

**Rule 3 — Clean up after your tests.**

If a test creates an employee, delete it when the test finishes. Use `afterEach` to keep state clean between runs.

```typescript
let createdId = '';

test.afterEach(async ({ request }) => {
  if (createdId) {
    await request.delete(`/employees/${createdId}`);
    createdId = '';
  }
});

test('create and store id for cleanup', async ({ request }) => {
  const response = await request.post('/employees', { data: { ... } });
  const body = await response.json();
  createdId = body.id;   // captured for afterEach
  expect(response.status()).toBe(201);
});
```

**Rule 4 — Test the sad path, not just the happy path.**

Every `if` block in the server code is a test case. The validation check, the 404 check, the duplicate email check — each is a branch that must be covered.

**Rule 5 — Never hardcode server-generated values.**

`id`, `createdAt`, and tokens are generated at runtime. Always read them from the response. Never assume what they will be.

---

## 13.2 Common Mistakes

**Mistake 1 — Expecting 200 from a POST:**

```typescript
// ❌ Wrong
expect(response.status()).toBe(200);

// ✅ Correct
expect(response.status()).toBe(201);
```

**Mistake 2 — Calling `response.json()` after a 204:**

```typescript
// ❌ Wrong — throws an error, DELETE returns no body
const body = await response.json();

// ✅ Correct — assert status only
expect(response.status()).toBe(204);
```

**Mistake 3 — Hardcoding an ID:**

```typescript
// ❌ Fragile — breaks when server restarts or tests run in different order
const response = await request.get('/employees/emp-001');

// ✅ Resilient — always uses a real ID from the server
const created = await request.post('/employees', { data: { ... } });
const { id } = await created.json();
const response = await request.get(`/employees/${id}`);
```

**Mistake 4 — Sending only the changed field in a PUT:**

```typescript
// ❌ Wrong — all other fields become undefined
await request.put(`/employees/${id}`, {
  data: { role: 'Staff Engineer' },
});

// ✅ Correct — send all fields
await request.put(`/employees/${id}`, {
  data: {
    firstName:  'Sarah',
    lastName:   'Connor',
    email:      'sarah@company.com',
    department: 'Engineering',
    role:       'Staff Engineer',
  },
});
```

**Mistake 5 — Using `data:` instead of `form:` for OAuth:**

```typescript
// ❌ Wrong — sends JSON, OAuth spec requires form encoding
await request.post('/oauth/token', { data: { grant_type: 'client_credentials', ... } });

// ✅ Correct — sends form-encoded data
await request.post('/oauth/token', { form: { grant_type: 'client_credentials', ... } });
```

**Mistake 6 — Not following up a DELETE with a GET:**

```typescript
// ❌ Incomplete — only confirms the server accepted the delete request
expect(deleteResponse.status()).toBe(204);

// ✅ Complete — confirms the record is actually gone
expect(deleteResponse.status()).toBe(204);
const getResponse = await request.get(`/employees/${id}`);
expect(getResponse.status()).toBe(404);
```

---

## Interview Questions — Chapter 13

**Q1. Why should you assert the status code before the response body?**

If the status code is wrong — for example, 400 instead of 201 — the body will not have the shape your assertions expect. Asserting `body.id` when the body is an error object gives a confusing "cannot read property id of undefined" error. Asserting the status first gives a clear "expected 201, received 400" failure.

**Q2. What does a self-contained test mean?**

A test that creates everything it needs and does not depend on other tests having run first. It can run in any order, in isolation, or in parallel, and produce the same result every time. Tests that share state through module-level variables or depend on execution order are fragile — one change breaks multiple tests.

**Q3. Why is it important to clean up test data?**

Tests that leave data behind accumulate state. Later tests may find more employees than they expect, duplicate email errors on employee creation, or wrong totals on paginated endpoints. Clean test state means each test starts from a known baseline. Cleanup in `afterEach` runs even when a test fails, so orphaned data is always removed.

**Q4. What is the "happy path" and what is the "sad path" in API testing?**

The happy path is the successful flow — valid data, correct credentials, resource exists. The sad path is everything else — missing fields, wrong credentials, non-existent IDs, duplicate emails, invalid department values. Every `if` block in the server code is a branch. Testing only the happy path means half the server code is never verified.

---
