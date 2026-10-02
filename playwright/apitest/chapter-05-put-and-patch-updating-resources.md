# Chapter 5 — PUT and PATCH: Updating Resources

---

## What You Will Learn

- The exact difference between PUT and PATCH
- Why PUT requires all fields and PATCH does not
- How both endpoints preserve `id` and `createdAt`
- When to choose PUT vs PATCH in tests

---

## Build It

```javascript
// PUT /employees/:id — replace an employee record entirely
app.put('/employees/:id', (req, res) => {
  const { id } = req.params;
  const data = req.body;

  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found', id });
  }

  const errors = validateEmployee(data);
  if (errors.length > 0) {
    return res.status(400).json({ error: 'Validation failed', details: errors });
  }

  // Full replacement — every field comes from the request body
  // Only id and createdAt are preserved from the original record
  employees[index] = {
    id:         employees[index].id,
    firstName:  data.firstName,
    lastName:   data.lastName,
    email:      data.email,
    department: data.department,
    role:       data.role,
    createdAt:  employees[index].createdAt,
  };

  res.status(200).json(employees[index]);
});

// PATCH /employees/:id — update only the fields provided
app.patch('/employees/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const index = employees.findIndex(emp => emp.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Employee not found', id });
  }

  if (updates.department && !VALID_DEPARTMENTS.includes(updates.department)) {
    return res.status(400).json({
      error: 'Validation failed',
      details: [`department must be one of: ${VALID_DEPARTMENTS.join(', ')}`],
    });
  }

  // Spread merge — keep all existing fields, overwrite only what was sent
  employees[index] = {
    ...employees[index],   // keep everything
    ...updates,            // overwrite only what was sent
    id:        employees[index].id,        // id can never change
    createdAt: employees[index].createdAt, // createdAt can never change
  };

  res.status(200).json(employees[index]);
});
```

---

## Understand It

### The Critical Difference

Look at the two assignments side by side:

**PUT:**
```javascript
employees[index] = {
  id:        employees[index].id,
  firstName: data.firstName,    // from request
  lastName:  data.lastName,     // from request
  email:     data.email,        // from request
  department:data.department,   // from request
  role:      data.role,         // from request
  createdAt: employees[index].createdAt,
};
```

**PATCH:**
```javascript
employees[index] = {
  ...employees[index],    // all existing fields
  ...updates,             // overwrite only what was sent
  id:        employees[index].id,
  createdAt: employees[index].createdAt,
};
```

In PUT, every field comes from `data` — the request body. If you send only `{ role: 'Staff Engineer' }`, the stored record gets `firstName: undefined`, `lastName: undefined`, `email: undefined`. The record is corrupted.

In PATCH, the spread `{ ...employees[index], ...updates }` merges. The existing record's fields stay unless you explicitly overwrite them. Sending `{ role: 'Staff Engineer' }` changes only `role`. Everything else stays exactly as it was.

### When to Use Each

| | PUT | PATCH |
|---|---|---|
| What you send | All fields | Only the fields that changed |
| Omitted fields | Become `undefined` — data loss | Stay unchanged |
| Validation | Full validation runs | Only validates fields you sent |
| Use when | Replacing the whole record | Changing one or two specific fields |

### Status Codes

Both PUT and PATCH return `200` on success with the full updated record in the body.

Both return `404` if the ID does not exist.

PUT also returns `400` if validation fails.

PATCH returns `400` only if a sent field fails validation — for example, an invalid department value.

### `id` and `createdAt` are Protected

In both PUT and PATCH, the code re-applies `id` and `createdAt` from the stored record after the merge. This means you cannot change them — even if you include them in the request body.

```javascript
// The re-application after spread prevents tampering:
id:        employees[index].id,        // ignores anything the client sent
createdAt: employees[index].createdAt, // ignores anything the client sent
```

---

## Test It

```typescript
test('PUT /employees/:id — updates the employee role', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Sarah',
      lastName:   'Connor',
      email:      'sarah.put@company.com',
      department: 'Engineering',
      role:       'Senior Engineer',
    },
  });
  const created = await createResponse.json();

  // PUT requires ALL fields — only role is different here
  const updateResponse = await request.put(`/employees/${created.id}`, {
    data: {
      firstName:  'Sarah',
      lastName:   'Connor',
      email:      'sarah.put@company.com',
      department: 'Engineering',
      role:       'Staff Engineer',
    },
  });

  expect(updateResponse.status()).toBe(200);

  const body = await updateResponse.json();
  expect(body.role).toBe('Staff Engineer');
  expect(body.id).toBe(created.id);
  expect(body.createdAt).toBe(created.createdAt);  // must not change
});

test('PUT /employees/:id — data loss when omitting fields', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Tony',
      lastName:   'Stark',
      email:      'tony.puttest@company.com',
      department: 'Engineering',
      role:       'Senior Engineer',
    },
  });
  const { id } = await createResponse.json();

  // Only send role — all other fields will become undefined
  const updateResponse = await request.put(`/employees/${id}`, {
    data: {
      role: 'Staff Engineer',   // incomplete PUT — data loss
    },
  });

  // Validation catches this — firstName, lastName, email, department are all required
  expect(updateResponse.status()).toBe(400);

  const body = await updateResponse.json();
  expect(body.error).toBe('Validation failed');
});

test('PUT /employees/:id — 404 for non-existent employee', async ({ request }) => {
  const response = await request.put('/employees/emp-999', {
    data: {
      firstName:  'Ghost',
      lastName:   'Employee',
      email:      'ghost@company.com',
      department: 'Finance',
      role:       'Analyst',
    },
  });

  expect(response.status()).toBe(404);
});

test('PATCH /employees/:id — updates only the specified field', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Tony',
      lastName:   'Stark',
      email:      'tony.stark@company.com',
      department: 'Engineering',
      role:       'Senior Engineer',
    },
  });
  const created = await createResponse.json();

  // PATCH — only change role
  const patchResponse = await request.patch(`/employees/${created.id}`, {
    data: { role: 'Principal Engineer' },
  });

  expect(patchResponse.status()).toBe(200);

  const body = await patchResponse.json();

  // Role changed
  expect(body.role).toBe('Principal Engineer');

  // Everything else must be unchanged — this is the PATCH guarantee
  expect(body.firstName).toBe('Tony');
  expect(body.email).toBe('tony.stark@company.com');
  expect(body.department).toBe('Engineering');
  expect(body.id).toBe(created.id);
  expect(body.createdAt).toBe(created.createdAt);
});

test('PATCH /employees/:id — 400 for invalid department', async ({ request }) => {
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Bruce',
      lastName:   'Banner',
      email:      'bruce.banner@company.com',
      department: 'Engineering',
      role:       'Research Scientist',
    },
  });
  const { id } = await createResponse.json();

  const response = await request.patch(`/employees/${id}`, {
    data: { department: 'Quantum Physics' },   // not a valid department
  });

  expect(response.status()).toBe(400);

  const body = await response.json();
  expect(body.details[0]).toContain('department must be one of');
});

test('PATCH /employees/:id — 404 for non-existent employee', async ({ request }) => {
  const response = await request.patch('/employees/emp-999', {
    data: { role: 'Ghost' },
  });

  expect(response.status()).toBe(404);
});
```

---

## Interview Questions — Chapter 5

**Q1. What is the key difference between PUT and PATCH?**

PUT replaces the entire resource. You must send all fields. Any field you omit becomes undefined in the stored record — this is data loss. PATCH updates only the fields you send. Omitted fields stay unchanged. Use PUT when replacing a whole record. Use PATCH when changing one or two specific fields.

**Q2. If you send only `{ role: 'Staff Engineer' }` in a PUT request, what happens to firstName and email?**

They become `undefined` in the stored record. The PUT code does `employees[index] = { firstName: data.firstName, ... }`. Since `data.firstName` is undefined (you did not send it), the stored value becomes undefined. The full validation step should catch this — but if the API does not validate properly, the data is silently corrupted.

**Q3. How does the spread operator make PATCH safe?**

The code does `{ ...employees[index], ...updates }`. The first spread copies all existing fields. The second spread overwrites only the fields present in `updates`. Any field not in `updates` keeps its original value from `employees[index]`. This is the merge operation that makes partial updates safe.

**Q4. What status code do PUT and PATCH return on success?**

Both return 200 with the full updated record in the response body. Neither returns 204 — 204 is for DELETE where no body is returned.

**Q5. Can a PATCH request change the employee's `id` or `createdAt`?**

No. The code explicitly re-applies them after the merge: `id: employees[index].id, createdAt: employees[index].createdAt`. Even if the client sends `{ id: 'emp-999' }` in a PATCH body, the stored ID stays unchanged.

**Q6. In a PATCH test, how do you verify that unchanged fields were not affected?**

After the PATCH, assert each field that should not have changed. For example, if you patched only `role`, assert `body.firstName`, `body.email`, `body.department`, `body.id`, and `body.createdAt` all equal their original values from the create response. This is the core guarantee of PATCH — only sent fields change.

**Q7. How would you describe the difference between PUT and PATCH to a non-technical stakeholder?**

PUT is like replacing a whole form. You fill in every field even if most of them did not change. If you leave a field blank, that field gets cleared. PATCH is like editing just one line on a form. You only write what changed. Everything else stays as it was.

**Q8. What does a PUT request return when the employee ID does not exist?**

404 Not Found. The code checks for the employee before running validation. If the ID is not found, it returns 404 immediately. Validation never runs.

---
