# Chapter 3 — POST: Creating Resources

---

## What You Will Learn

- How to build a POST endpoint in Express.js
- How validation and duplicate checking work
- Why POST returns 201 not 200
- How to write Playwright tests for happy path and error paths

---

## Build It

Add this route to `server.js` above the `app.listen` line:

```javascript
// POST /employees — create a new employee
app.post('/employees', (req, res) => {
  const data = req.body;

  // Step 1: Validate all required fields
  const errors = validateEmployee(data);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // Step 2: Reject duplicate email addresses
  const emailExists = employees.some(emp => emp.email === data.email);
  if (emailExists) {
    return res.status(400).json({
      error: 'Validation failed',
      details: ['email already exists'],
    });
  }

  // Step 3: Build the full employee object with server-generated fields
  const newEmployee = {
    id:         `emp-${String(nextId).padStart(3, '0')}`,  // emp-001, emp-002, ...
    firstName:  data.firstName,
    lastName:   data.lastName,
    email:      data.email,
    department: data.department,
    role:       data.role,
    createdAt:  new Date().toISOString(),
  };

  nextId++;
  employees.push(newEmployee);

  // Step 4: Return 201 with the created employee
  res.status(201).json(newEmployee);
});
```

---

## Understand It

**What you send:**

```
POST /employees
Content-Type: application/json
```

```json
{
  "firstName":  "Sarah",
  "lastName":   "Connor",
  "email":      "sarah.connor@company.com",
  "department": "Engineering",
  "role":       "Senior Engineer"
}
```

You send five fields. You do not send `id` or `createdAt`. The server generates both.

**What you get back — success:**

```
Status: 201 Created
```

```json
{
  "id":         "emp-001",
  "firstName":  "Sarah",
  "lastName":   "Connor",
  "email":      "sarah.connor@company.com",
  "department": "Engineering",
  "role":       "Senior Engineer",
  "createdAt":  "2025-03-10T09:00:00.000Z"
}
```

**What you get back — validation failure:**

```
Status: 400 Bad Request
```

```json
{
  "error":   "Validation failed",
  "details": ["email is required"]
}
```

**Code flow — what the server does in order:**

1. `validateEmployee(data)` checks all five required fields and the department value
2. If any validation fails — stop and return 400
3. Check for duplicate email — if found, stop and return 400
4. Build the new employee object with server-generated `id` and `createdAt`
5. Save to the array, increment the counter
6. Return 201 with the full employee object

**What to know as a tester:**

Validation runs before the duplicate check. If `email` is missing AND a duplicate exists, you get "email is required" — not "email already exists". The order of checks in the code determines which error you see first.

`id` is built from a counter: `emp-${String(nextId).padStart(3, '0')}`. The first employee is `emp-001`, the second is `emp-002`. You cannot predict this from outside the server. Always read the `id` from the response.

The success status is **201** — not 200. This is the most common mistake in API testing. 200 means "the request succeeded". 201 means "a new resource was created". These are different signals.

---

## Test It

```typescript
// tests/employees.spec.ts
import { test, expect } from '@playwright/test';

test('POST /employees — creates a new employee', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {
      firstName:  'Sarah',
      lastName:   'Connor',
      email:      'sarah.connor@company.com',
      department: 'Engineering',
      role:       'Senior Engineer',
    },
  });

  // Assert status FIRST — if this fails, the body may not have the right shape
  expect(response.status()).toBe(201);

  const body = await response.json();

  // Server-generated fields must exist
  expect(body.id).toBeTruthy();
  expect(body.createdAt).toBeTruthy();

  // Fields we sent must come back correctly
  expect(body.firstName).toBe('Sarah');
  expect(body.email).toBe('sarah.connor@company.com');
  expect(body.department).toBe('Engineering');
});

test('POST /employees — returns 400 when email is missing', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {
      firstName:  'No',
      lastName:   'Email',
      department: 'HR',
      role:       'Manager',
      // email intentionally omitted
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.error).toBe('Validation failed');
  expect(body.details).toContain('email is required');
});

test('POST /employees — returns 400 for invalid department', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {
      firstName:  'Bad',
      lastName:   'Dept',
      email:      'bad.dept@company.com',
      department: 'Sales',    // not a valid value
      role:       'Manager',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.details[0]).toContain('department must be one of');
});

test('POST /employees — returns 400 for duplicate email', async ({ request }) => {
  const sharedEmail = 'duplicate@company.com';

  // Create the first employee
  await request.post('/employees', {
    data: {
      firstName:  'First',
      lastName:   'Employee',
      email:      sharedEmail,
      department: 'HR',
      role:       'Manager',
    },
  });

  // Attempt to create a second with the same email
  const response = await request.post('/employees', {
    data: {
      firstName:  'Second',
      lastName:   'Employee',
      email:      sharedEmail,
      department: 'Finance',
      role:       'Analyst',
    },
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.details).toContain('email already exists');
});
```

---

## Interview Questions — Chapter 3

**Q1. Why does a successful POST return 201 and not 200?**

200 means "the request succeeded". 201 means "a new resource was created". They are different signals. A test that expects 200 from a POST will fail against a correctly built API. Always use 201 for create operations.

**Q2. What is `req.body` in Express and what must you do to use it?**

`req.body` is the parsed request body — the JSON data the client sent. To use it, you must add `app.use(express.json())` before your routes. Without it, `req.body` is always `undefined`.

**Q3. In your test, should you assert the status code or the body first? Why?**

Always assert the status code first. If the status is wrong — for example, you get 400 instead of 201 — the body will not have the shape your assertions expect. Asserting the body first gives you a confusing failure message. Asserting the status first gives you a clear failure: "expected 201, received 400".

**Q4. Why should you never hardcode an employee ID like `emp-001` in a test?**

The server generates IDs at runtime from a counter. If tests run in a different order, or if the server restarts, the counter resets and the IDs change. A hardcoded `emp-001` will point to the wrong employee or no employee at all. Always read the ID from the response body.

**Q5. How does the server ensure email addresses are unique?**

The endpoint uses `employees.some(emp => emp.email === data.email)` to scan the in-memory array before saving. If any existing employee has the same email, it returns a 400 with the message "email already exists". This check runs after field validation, so a missing email field is caught before the duplicate check runs.

**Q6. What does `String(nextId).padStart(3, '0')` do?**

It formats the counter as a three-digit string with leading zeros. `nextId = 1` becomes `"001"`, giving the ID `emp-001`. `nextId = 12` becomes `"012"`, giving `emp-012`. This keeps IDs consistently formatted regardless of how many employees have been created.

**Q7. In a test, how do you verify that `createdAt` was set by the server?**

Use `expect(body.createdAt).toBeTruthy()`. This confirms the field exists and is not empty, null, or undefined. You cannot assert the exact value because the timestamp is generated at the moment the request is processed and changes with every test run.

**Q8. How would you test that all five required fields are validated correctly?**

Write one test for each missing field. In each test, omit exactly one field and send the others. Assert a 400 response. Assert that `body.details` contains the specific error message for that field. This gives you five separate tests, each verifying one validation rule in isolation.

---
