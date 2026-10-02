# Chapter 12 — Advanced Patterns

---

## What You Will Learn

- Schema validation with Ajv
- API chaining with the CMRV pattern
- Parallel calls with Promise.all
- Data-driven tests
- Response header and timing validation

---

## 12.1 Schema Validation with Ajv

Writing individual field assertions for every test does not scale. A response with 10 fields requires 10 `expect` lines per test. **Schema validation** defines the expected shape once and validates any response against it in a single call.

Schema validation catches:
- Missing required fields
- Wrong types (`"123"` instead of `123`)
- Values outside allowed enums
- Invalid formats (bad email, bad date)

```bash
npm install -D ajv ajv-formats
```

```typescript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv();
addFormats(ajv);

// Define the shape of a valid Employee response once
const employeeSchema = {
  type: 'object',
  properties: {
    id:         { type: 'string', pattern: '^emp-\\d{3}$' },
    firstName:  { type: 'string', minLength: 1 },
    lastName:   { type: 'string', minLength: 1 },
    email:      { type: 'string', format: 'email' },
    department: { type: 'string', enum: ['Engineering', 'HR', 'Finance', 'Marketing'] },
    role:       { type: 'string', minLength: 1 },
    createdAt:  { type: 'string', format: 'date-time' },
  },
  required: ['id', 'firstName', 'lastName', 'email', 'department', 'role', 'createdAt'],
  additionalProperties: false,
};

const validateEmployee      = ajv.compile(employeeSchema);
const validateEmployeeArray = ajv.compile({ type: 'array', items: employeeSchema });

test('POST /employees — response matches employee schema', async ({ request }) => {
  const response = await request.post('/employees', {
    data: {
      firstName:  'Schema',
      lastName:   'Test',
      email:      'schema.test@company.com',
      department: 'Engineering',
      role:       'QA Engineer',
    },
  });

  expect(response.status()).toBe(201);

  const body = await response.json();
  const valid = validateEmployee(body);

  if (!valid) console.error(validateEmployee.errors);   // readable in CI logs
  expect(valid).toBe(true);
});

test('GET /employees — all employees match schema', async ({ request }) => {
  const response = await request.get('/employees');
  const body = await response.json();

  const valid = validateEmployeeArray(body);
  if (!valid) console.error(validateEmployeeArray.errors);
  expect(valid).toBe(true);
});
```

Schema validation is powerful for **contract testing** — verifying that the API still returns the shape your frontend depends on, even after a backend change.

---

## 12.2 API Chaining — The CMRV Pattern

Many real operations require sequential API calls where the output of one step is the input of the next. The pattern is:

**Create → Modify → Read → Verify (CMRV)**

```typescript
test('full employee lifecycle — CMRV', async ({ request }) => {
  // Create
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Carol',
      lastName:   'Danvers',
      email:      'carol.danvers@company.com',
      department: 'Engineering',
      role:       'Engineer',
    },
  });
  expect(createResponse.status()).toBe(201);
  const { id, createdAt } = await createResponse.json();

  // Modify (PATCH)
  const patchResponse = await request.patch(`/employees/${id}`, {
    data: { role: 'Senior Engineer' },
  });
  expect(patchResponse.status()).toBe(200);

  // Modify again (PUT)
  const putResponse = await request.put(`/employees/${id}`, {
    data: {
      firstName:  'Carol',
      lastName:   'Danvers',
      email:      'carol.danvers@company.com',
      department: 'Engineering',
      role:       'Principal Engineer',
    },
  });
  expect(putResponse.status()).toBe(200);

  // Read
  const getResponse = await request.get(`/employees/${id}`);
  const final = await getResponse.json();

  // Verify
  expect(final.role).toBe('Principal Engineer');
  expect(final.id).toBe(id);
  expect(final.createdAt).toBe(createdAt);  // must never change through any update
});
```

---

## 12.3 Parallel Calls with Promise.all

When multiple independent requests can run at the same time, use `Promise.all`. This cuts test time proportionally to the number of calls.

```typescript
test('create three employees in parallel', async ({ request }) => {
  const [r1, r2, r3] = await Promise.all([
    request.post('/employees', {
      data: { firstName: 'Peter', lastName: 'Parker', email: 'peter.parker@company.com',
              department: 'Engineering', role: 'Developer' },
    }),
    request.post('/employees', {
      data: { firstName: 'Wanda', lastName: 'Maximoff', email: 'wanda.maximoff@company.com',
              department: 'HR', role: 'Manager' },
    }),
    request.post('/employees', {
      data: { firstName: 'Sam', lastName: 'Wilson', email: 'sam.wilson@company.com',
              department: 'Finance', role: 'Analyst' },
    }),
  ]);

  expect(r1.status()).toBe(201);
  expect(r2.status()).toBe(201);
  expect(r3.status()).toBe(201);
});
```

**`Promise.all` vs `Promise.allSettled`:**

`Promise.all` — fails immediately if any call fails. Use when all calls must succeed.

`Promise.allSettled` — waits for all calls to finish, success or failure, and gives you each result individually. Use when partial failure is acceptable and you want to inspect which calls succeeded.

---

## 12.4 Data-Driven Tests

When the same test logic applies to multiple input/output pairs, write the logic once and drive it with data. Adding a new case means adding one row to an array.

```typescript
const validEmployees = [
  { firstName: 'Alice', lastName: 'Smith', email: 'alice.smith@company.com',
    department: 'Engineering', role: 'Engineer' },
  { firstName: 'Bob',   lastName: 'Jones', email: 'bob.jones@company.com',
    department: 'HR', role: 'Recruiter' },
  { firstName: 'Carol', lastName: 'White', email: 'carol.white@company.com',
    department: 'Finance', role: 'Accountant' },
];

for (const emp of validEmployees) {
  test(`POST /employees — creates ${emp.firstName} ${emp.lastName}`, async ({ request }) => {
    const response = await request.post('/employees', { data: emp });

    expect(response.status()).toBe(201);

    const body = await response.json();
    expect(body.email).toBe(emp.email);
    expect(body.department).toBe(emp.department);
  });
}

const invalidInputs = [
  { data: { lastName: 'X', email: 'a@b.com', department: 'HR', role: 'Manager' },
    error: 'firstName is required' },
  { data: { firstName: 'Y', email: 'a@b.com', department: 'HR', role: 'Manager' },
    error: 'lastName is required' },
  { data: { firstName: 'Z', lastName: 'X', department: 'HR', role: 'Manager' },
    error: 'email is required' },
];

for (const { data, error } of invalidInputs) {
  test(`POST /employees — rejects: ${error}`, async ({ request }) => {
    const response = await request.post('/employees', { data });

    expect(response.status()).toBe(400);

    const body = await response.json();
    const hasError = body.details.some((d: string) => d.includes(error));
    expect(hasError).toBe(true);
  });
}
```

---

## 12.5 Response Header and Timing Validation

**Headers:**

```typescript
test('GET /employees — correct content-type header', async ({ request }) => {
  const response = await request.get('/employees');
  const headers = response.headers();   // all headers, keys lowercase

  expect(headers['content-type']).toContain('application/json');
});
```

**Timing:**

```typescript
test('GET /employees — responds within 500ms', async ({ request }) => {
  const start = Date.now();
  const response = await request.get('/employees');
  const duration = Date.now() - start;

  expect(response.status()).toBe(200);
  expect(duration).toBeLessThan(500);
});

test('GET /employees — detailed timing breakdown', async ({ request }) => {
  const response = await request.get('/employees');
  const t = response.timing();

  // responseStart - requestStart = time to first byte (server processing time)
  const ttfb = t.responseStart - t.requestStart;
  console.log(`TTFB: ${ttfb}ms | Total: ${t.responseEnd}ms`);

  expect(t.responseEnd).toBeLessThan(500);
});
```

---

## Interview Questions — Chapter 12

**Q1. What is schema validation and what does it catch that field-by-field assertions miss?**

Schema validation defines the expected shape of a response and validates the entire response against it in one call. It catches: missing required fields, wrong data types, values outside allowed enums, and invalid formats like a bad email or date string. Field-by-field assertions only check the specific fields you listed — they miss anything you forgot to assert.

**Q2. What is the CMRV pattern?**

Create → Modify → Read → Verify. A test creates a resource via POST, modifies it via PATCH or PUT, reads the final state via GET, and verifies the outcome. This pattern tests the full lifecycle of a resource and confirms that state changes persist correctly.

**Q3. When is `Promise.all` the right choice and when is `Promise.allSettled` better?**

`Promise.all` is right when all requests must succeed — it fails immediately if any one call fails. Use it for parallel setup where every call is required. `Promise.allSettled` is better when some calls can fail — it waits for all calls to finish and gives you each result individually. Use it when you want to inspect which calls succeeded and which did not.

**Q4. What is the advantage of data-driven tests over writing each test individually?**

Adding a new test case means adding one row to a data array — not writing a new test function. The test logic is written once and reused for every entry. This reduces duplication, makes edge cases easier to add, and keeps the test file from growing with repeated boilerplate.

**Q5. Why is testing response time important?**

A slow API is a defect. A checkout flow that takes 3 seconds instead of 300ms will lose customers even if the data is correct. Adding timing assertions to your test suite catches performance regressions before they reach production. Without automated timing checks, performance degradation often goes unnoticed until users report it.

**Q6. What does `response.timing()` return in Playwright?**

An object with timing data for the request lifecycle — including when the request was sent, when the first byte of the response arrived, and when the full response was received. `t.responseStart - t.requestStart` gives time to first byte (TTFB) — a measure of server processing time. `t.responseEnd` gives the total response time.

---

