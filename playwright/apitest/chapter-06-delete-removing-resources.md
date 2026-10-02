# Chapter 6 — DELETE: Removing Resources

---

## What You Will Learn

- How to build a DELETE endpoint
- Why DELETE returns 204 and not 200
- Why you must never call `response.json()` after a 204
- How to confirm deletion with a follow-up GET

---

## Build It

```javascript
// DELETE /employees/:id — remove an employee record
app.delete('/employees/:id', (req, res) => {
  const { id } = req.params;

  const index = employees.findIndex(emp => emp.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found', id });
  }

  employees.splice(index, 1);  // remove the employee from the array

  res.status(204).send();      // 204 = success, no body
});
```

---

## Understand It

**What you send:**

```
DELETE /employees/emp-001
```

No body. No required headers beyond authentication.

**What you get back — success:**

```
Status: 204 No Content
(no response body)
```

**What you get back — not found:**

```
Status: 404 Not Found
```

```json
{
  "error": "Employee not found",
  "id":    "emp-999"
}
```

### Why 204 and Not 200?

204 means "the request succeeded but there is nothing to return". When you delete a resource, it no longer exists. There is nothing meaningful to send back. 200 implies a body. 204 explicitly says: no body, by design.

### The Most Important Rule for DELETE

**Never call `response.json()` after a 204 response.**

The server sends no body. Calling `.json()` on an empty response throws an error in your test. The test fails — not because the deletion failed, but because you tried to parse something that does not exist.

```typescript
// ❌ Wrong — throws an error because there is no body
const deleteResponse = await request.delete(`/employees/${id}`);
const body = await deleteResponse.json();   // ERROR

// ✅ Correct — only assert the status code
const deleteResponse = await request.delete(`/employees/${id}`);
expect(deleteResponse.status()).toBe(204);
```

### Why a 204 Is Not Enough

A 204 tells you the server accepted the delete request. It does not tell you the record is actually gone. Network middleware, caching, or a buggy server could return 204 without removing anything.

Always follow a DELETE with a GET to confirm the record is gone:

```typescript
// Delete
const deleteResponse = await request.delete(`/employees/${id}`);
expect(deleteResponse.status()).toBe(204);

// Confirm deletion
const getResponse = await request.get(`/employees/${id}`);
expect(getResponse.status()).toBe(404);
```

### Idempotency

DELETE is idempotent — the end result of deleting a non-existent resource is the same as deleting it when it existed: the resource is gone. However, the response code changes. The first delete returns 204. The second delete returns 404 because the resource is already gone. This is expected and worth testing explicitly.

---

## Test It

```typescript
test('DELETE /employees/:id — removes the employee', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Temp',
      lastName:   'Employee',
      email:      'temp.delete@company.com',
      department: 'Finance',
      role:       'Analyst',
    },
  });
  const { id } = await createResponse.json();

  // Delete the employee
  const deleteResponse = await request.delete(`/employees/${id}`);

  // 204 = success. Do NOT call response.json() here — there is no body.
  expect(deleteResponse.status()).toBe(204);

  // Confirm the record is actually gone
  const getResponse = await request.get(`/employees/${id}`);
  expect(getResponse.status()).toBe(404);
});

test('DELETE /employees/:id — 404 for non-existent ID', async ({ request }) => {
  const response = await request.delete('/employees/emp-999');

  expect(response.status()).toBe(404);

  const body = await response.json();
  expect(body.error).toBe('Employee not found');
});

test('DELETE /employees/:id — 404 on second delete attempt', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Once',
      lastName:   'Only',
      email:      'once.only@company.com',
      department: 'Marketing',
      role:       'Designer',
    },
  });
  const { id } = await createResponse.json();

  // First delete — succeeds
  const firstDelete = await request.delete(`/employees/${id}`);
  expect(firstDelete.status()).toBe(204);

  // Second delete — employee is already gone
  const secondDelete = await request.delete(`/employees/${id}`);
  expect(secondDelete.status()).toBe(404);
});

test('DELETE /employees/:id — employee is gone from GET /employees list', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'List',
      lastName:   'Test',
      email:      'list.delete@company.com',
      department: 'HR',
      role:       'Coordinator',
    },
  });
  const { id } = await createResponse.json();

  await request.delete(`/employees/${id}`);

  // Confirm it no longer appears in the list
  const listResponse = await request.get('/employees');
  const allEmployees = await listResponse.json();

  const stillExists = allEmployees.some((emp: { id: string }) => emp.id === id);
  expect(stillExists).toBe(false);
});
```

---

## Interview Questions — Chapter 6

**Q1. What status code does a successful DELETE return and why?**

204 No Content. The request succeeded but there is nothing to return — the resource has been removed. 200 implies a response body. 204 explicitly states: success, no body.

**Q2. Why must you never call `response.json()` after a 204 response?**

The server sends no body with a 204. Calling `.json()` tries to parse an empty response, which throws a parsing error. Your test fails — not because the deletion failed but because you tried to parse nothing. After a 204, only assert the status code.

**Q3. Is a 204 response sufficient to confirm that an employee was deleted?**

No. A 204 confirms the server accepted the delete request. It does not confirm the record is actually removed from storage. Always follow a DELETE with a GET to the same URL and assert a 404 response. This verifies the record is truly gone.

**Q4. What happens when you delete an employee that does not exist?**

The server returns 404 Not Found. The `findIndex` call returns -1 (no match), and the code returns `res.status(404).json({ error: 'Employee not found', id })`. The `splice` line never runs.

**Q5. Is DELETE idempotent? Explain.**

In terms of end state, yes — after a DELETE, the resource is gone whether you call it once or ten times. But the response code changes. The first call returns 204. Subsequent calls return 404 because the resource no longer exists. The end state is the same; the response signal is different.

**Q6. How would you test that a deleted employee no longer appears in the GET /employees list?**

Create the employee, capture its ID. Delete it. Call GET /employees. Parse the response array. Use `array.some(emp => emp.id === id)` to check if the deleted ID appears. Assert the result is `false`.

**Q7. In your project, how did you handle cleanup after a DELETE test?**

We captured the employee ID in the test setup, ran the test, then verified deletion via a follow-up GET. For tests that create employees without explicitly deleting them, we used an `afterEach` hook to call DELETE on any IDs created during the test. This kept the server state clean between tests.

---
