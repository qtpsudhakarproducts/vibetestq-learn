# Chapter 4 — GET: Reading Resources

---

## What You Will Learn

- How to build GET endpoints for a list and a single resource
- The difference between path parameters and query parameters
- How filtering works with query strings
- How to handle the 404 case correctly
- Pagination and sorting patterns

---

## Build It

Add both GET routes to `server.js`:

```javascript
// GET /employees — return all employees, with an optional department filter
app.get('/employees', (req, res) => {
  const { department } = req.query;

  if (department) {
    const filtered = employees.filter(emp => emp.department === department);
    return res.status(200).json(filtered);
  }

  res.status(200).json(employees);
});

// GET /employees/:id — return a single employee by ID
app.get('/employees/:id', (req, res) => {
  const { id } = req.params;

  const employee = employees.find(emp => emp.id === id);

  if (!employee) {
    return res.status(404).json({ error: 'Employee not found', id });
  }

  res.status(200).json(employee);
});
```

---

## Understand It

### Path Parameters vs Query Parameters

These are two different ways to pass data in a URL.

**Path parameters** are part of the URL path itself:

```
GET /employees/emp-001
```

Here `emp-001` is a path parameter. It is captured in Express with `:id` in the route definition. The value is available at `req.params.id`. Path parameters identify a specific resource.

**Query parameters** follow a `?` at the end of the URL:

```
GET /employees?department=Engineering
```

Here `department=Engineering` is a query parameter. Express parses it automatically and makes it available at `req.query.department`. Query parameters modify or filter a request — they do not identify a resource.

| | Path Parameter | Query Parameter |
|---|---|---|
| URL format | `/employees/emp-001` | `/employees?department=Engineering` |
| Express access | `req.params.id` | `req.query.department` |
| Used for | Identifying a specific resource | Filtering, sorting, pagination |

### List Response

```
Status: 200 OK
```

```json
[
  {
    "id": "emp-001",
    "firstName": "Sarah",
    "lastName": "Connor",
    "email": "sarah.connor@company.com",
    "department": "Engineering",
    "role": "Senior Engineer",
    "createdAt": "2025-03-10T09:00:00.000Z"
  }
]
```

The response is always a **JSON array** — even when there is only one employee. An empty database returns `[]` with status 200 — not a 404. An empty array is a valid response.

### Single Resource Response

**Found:**

```
Status: 200 OK
```

```json
{
  "id": "emp-001",
  "firstName": "Sarah",
  ...
}
```

**Not found:**

```
Status: 404 Not Found
```

```json
{
  "error": "Employee not found",
  "id": "emp-999"
}
```

### Filter Behaviour

The department filter is case-sensitive. `Engineering` works. `engineering` returns an empty array. This is not a bug — it is the expected behaviour of a strict string comparison. Your tests must verify this.

---

## 4.1 Pagination

Real APIs rarely return all records in one response. A database with 50,000 employees cannot send all of them at once. APIs use **pagination** to return data in pages.

**Offset-based pagination:**

```
GET /employees?limit=10&offset=0    ← first 10 employees
GET /employees?limit=10&offset=10   ← next 10 employees
GET /employees?limit=10&offset=20   ← next 10 employees
```

The server returns the requested slice and tells the client how many total records exist.

Add pagination to the list endpoint:

```javascript
app.get('/employees', (req, res) => {
  const { department, limit = 20, offset = 0 } = req.query;

  let result = employees;

  if (department) {
    result = result.filter(emp => emp.department === department);
  }

  const total  = result.length;
  const page   = result.slice(Number(offset), Number(offset) + Number(limit));

  res.status(200).json({
    data:   page,
    total:  total,
    limit:  Number(limit),
    offset: Number(offset),
  });
});
```

**What testers check on paginated responses:**

- `data` is an array
- `total` reflects the actual count of all matching records
- `data.length` is at most `limit`
- Requesting `offset=total` returns an empty `data` array — not a 404
- The filter and pagination work together correctly

---

## 4.2 Sorting

APIs often support sorting via query parameters:

```
GET /employees?sort=lastName&order=asc
GET /employees?sort=createdAt&order=desc
```

As a tester, verify:
- The default sort order when no `sort` param is provided
- Both `asc` and `desc` directions work
- Sorting on a non-existent field returns an error or falls back to the default

---

## Test It

```typescript
test('GET /employees — returns an array', async ({ request }) => {
  const response = await request.get('/employees');

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
});

test('GET /employees — returns empty array when no employees exist', async ({ request }) => {
  const response = await request.get('/employees');

  expect(response.status()).toBe(200);    // 200, not 404

  const body = await response.json();
  expect(Array.isArray(body)).toBe(true);
  // Array may be empty — that is valid
});

test('GET /employees?department=Engineering — returns only Engineering employees', async ({ request }) => {
  // Create test data first
  await request.post('/employees', {
    data: {
      firstName:  'Diana',
      lastName:   'Prince',
      email:      'diana.prince@company.com',
      department: 'Engineering',
      role:       'Tech Lead',
    },
  });

  // params: appends to the URL as a query string automatically
  const response = await request.get('/employees', {
    params: { department: 'Engineering' },
  });

  expect(response.status()).toBe(200);

  const body = await response.json();

  // Every employee in the result must be from Engineering
  for (const employee of body) {
    expect(employee.department).toBe('Engineering');
  }
});

test('GET /employees?department=engineering — case sensitivity returns empty array', async ({ request }) => {
  const response = await request.get('/employees', {
    params: { department: 'engineering' },   // lowercase — no match
  });

  expect(response.status()).toBe(200);

  const body = await response.json();
  expect(body).toHaveLength(0);   // empty array, not 404
});

test('GET /employees/:id — returns the correct employee', async ({ request }) => {
  // Create an employee to get a known ID
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'James',
      lastName:   'Rhodes',
      email:      'james.rhodes@company.com',
      department: 'HR',
      role:       'HR Manager',
    },
  });
  const { id } = await createResponse.json();

  const getResponse = await request.get(`/employees/${id}`);

  expect(getResponse.status()).toBe(200);

  const body = await getResponse.json();
  expect(body.id).toBe(id);
  expect(body.firstName).toBe('James');
  expect(body.email).toBe('james.rhodes@company.com');
});

test('GET /employees/:id — returns 404 for non-existent ID', async ({ request }) => {
  const response = await request.get('/employees/emp-999');

  expect(response.status()).toBe(404);

  const body = await response.json();
  expect(body.error).toBe('Employee not found');
});
```

---

## Interview Questions — Chapter 4

**Q1. What is the difference between a path parameter and a query parameter?**

A path parameter is part of the URL path: `/employees/emp-001`. It identifies a specific resource. In Express it is defined with a colon: `:id`, and accessed at `req.params.id`. A query parameter follows a `?` in the URL: `/employees?department=Engineering`. It filters or modifies the request. In Express it is accessed at `req.query.department`.

**Q2. If the database has no employees, what should GET /employees return?**

It should return an empty array `[]` with status 200. An empty array is a valid response — it means the resource exists but has no data. Returning 404 would be wrong because 404 means the resource itself does not exist. The `/employees` collection exists — it just happens to be empty.

**Q3. A GET /employees?department=Engineering test is passing locally but failing in CI. What could cause this?**

The filter is case-sensitive. Local test data might always use `Engineering` with a capital E. In CI, if test data is generated differently or if an earlier test created an employee with `engineering` (lowercase), the filter would return fewer results. Always verify case-sensitivity explicitly in your tests.

**Q4. How does Playwright append query parameters to a GET request?**

Using the `params:` option: `request.get('/employees', { params: { department: 'Engineering' } })`. Playwright serialises the object and appends it to the URL as `?department=Engineering`. This is cleaner than building the URL string manually and handles encoding automatically.

**Q5. What is pagination and why do APIs use it?**

Pagination returns data in pages instead of all at once. A database with thousands of records cannot send all of them in one response — the payload would be too large and the response too slow. Pagination gives the client control over how much data it receives. Common implementations use `limit` and `offset` query parameters.

**Q6. What should a test verify when testing a paginated endpoint?**

The `data` field is an array. `data.length` is at most `limit`. `total` reflects the real count of all matching records. Requesting `offset` equal to `total` returns an empty `data` array — not a 404. The filter and pagination work correctly when combined.

**Q7. How would you test that GET /employees/:id returns the right employee and not just any employee?**

Create an employee in the test and capture its ID from the response. Then call GET with that exact ID. In the response, assert `body.id` equals the captured ID and assert specific field values like `body.email` or `body.firstName` that you set during creation. This confirms the right record was returned.

**Q8. When would a GET request return a 404?**

When the specific resource identified by the ID does not exist. For example, `GET /employees/emp-999` returns 404 if no employee has that ID. A list endpoint like `GET /employees` should never return 404 — even an empty list returns 200.

---
