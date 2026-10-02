# Chapter 18 — Contract Testing

---

## What You Will Learn

- What contract testing is and why schema validation is not enough
- Consumer-driven contracts
- How to keep the frontend and backend in sync
- How to use Ajv schemas as lightweight contracts

---

## 18.1 What Contract Testing Is

A **contract** is the agreement between two systems about what data they exchange. In a web application, the frontend is the **consumer** and the backend API is the **provider**. The contract defines what the API must return for the frontend to work correctly.

**Schema validation** verifies one response at a time. **Contract testing** verifies that the entire API still honours the contract that the frontend depends on — even after the backend changes.

Without contract testing, a backend change can silently break the frontend. The backend team renames `firstName` to `first_name`. The backend tests still pass — the API works. But the frontend stops showing names. There is no automated catch.

---

## 18.2 Consumer-Driven Contracts

In consumer-driven contract testing, the **consumer** (frontend) defines what it needs from the API. The **provider** (backend) runs those contract tests as part of its CI pipeline. If the API changes in a way that breaks the consumer's contract, the provider's CI fails.

The most common tool for this is **Pact**. For this book, we use Ajv schemas as a simpler lightweight alternative.

---

## 18.3 Defining Contracts with Ajv Schemas

Think of your Ajv schemas as the contract document. Define them in a shared location that both the API tests and UI tests reference.

```typescript
// contracts/employee-contract.ts

// This is the contract the frontend depends on.
// Any backend change that breaks this shape will break the frontend.
export const employeeContract = {
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

export const employeeListContract = {
  type: 'array',
  items: employeeContract,
};

export const errorContract = {
  type: 'object',
  properties: {
    error:   { type: 'string' },
    details: { type: 'array', items: { type: 'string' } },
  },
  required: ['error'],
};
```

---

## 18.4 Running Contract Tests

```typescript
// tests/advanced/contract.spec.ts
import { test, expect } from '@playwright/test';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { employeeContract, employeeListContract, errorContract } from '../../contracts/employee-contract';

const ajv = new Ajv();
addFormats(ajv);

const validateEmployee      = ajv.compile(employeeContract);
const validateEmployeeList  = ajv.compile(employeeListContract);
const validateError         = ajv.compile(errorContract);

test.describe('API Contract — Employee Endpoints', () => {
  test('POST /employees — response matches employee contract', async ({ request }) => {
    const response = await request.post('/employees', {
      data: {
        firstName:  'Contract',
        lastName:   'Test',
        email:      `contract.${Date.now()}@company.com`,
        department: 'Engineering',
        role:       'QA Engineer',
      },
    });

    expect(response.status()).toBe(201);

    const valid = validateEmployee(await response.json());
    if (!valid) console.error(validateEmployee.errors);
    expect(valid).toBe(true);
  });

  test('GET /employees — response matches employee list contract', async ({ request }) => {
    const response = await request.get('/employees');

    expect(response.status()).toBe(200);

    const valid = validateEmployeeList(await response.json());
    if (!valid) console.error(validateEmployeeList.errors);
    expect(valid).toBe(true);
  });

  test('GET /employees/:id — non-existent ID matches error contract', async ({ request }) => {
    const response = await request.get('/employees/emp-999');

    expect(response.status()).toBe(404);

    const valid = validateError(await response.json());
    if (!valid) console.error(validateError.errors);
    expect(valid).toBe(true);
  });

  test('POST /employees — validation error matches error contract', async ({ request }) => {
    const response = await request.post('/employees', {
      data: { firstName: 'Missing', lastName: 'Fields' },  // incomplete
    });

    expect(response.status()).toBe(400);

    const valid = validateError(await response.json());
    if (!valid) console.error(validateError.errors);
    expect(valid).toBe(true);
  });
});
```

---

## 18.5 What Contract Tests Catch

A backend developer renames `firstName` to `first_name`. The API tests pass — the field exists, just with a different name. The contract test fails:

```
Contract violation: required property 'firstName' is missing
```

The frontend team is alerted before their code breaks in production.

---

## Interview Questions — Chapter 18

**Q1. What is contract testing and how does it differ from schema validation?**

Schema validation checks that a specific response matches a shape. Contract testing checks that the entire API still honours the agreement that other systems depend on. Schema validation is test-scoped — it runs in individual tests. Contract testing is suite-scoped — it defines the full API surface that consumers rely on and runs as a dedicated check.

**Q2. What is a consumer-driven contract?**

A contract defined by the consumer — the system that uses the API. The consumer specifies exactly what fields, types, and formats it needs from the API. The provider runs these specifications as tests. If the provider's API changes in a way that breaks the consumer's needs, the provider's CI pipeline fails.

**Q3. What is the `additionalProperties: false` constraint in an Ajv schema?**

It means the response must not contain any properties other than the ones defined in the schema. Without it, a backend developer could add an `internalId` field or rename `firstName` to `first_name` and both changes would pass schema validation — even though the frontend would break. `additionalProperties: false` catches added or renamed fields.

**Q4. How would you detect a breaking change in the API without contract tests?**

You probably would not catch it until the frontend team reports bugs. API tests verify what the API returns. They do not verify what the frontend needs. Contract tests bridge this gap by testing the API against the exact requirements of its consumers.

**Q5. In your project, how did you prevent backend changes from silently breaking the frontend?**

We defined Ajv schemas in a shared `contracts/` folder and ran contract tests in CI on every pull request. Backend developers could not merge code that changed the response shape without the contract tests failing. This made breaking changes visible immediately — before they reached staging or production.

---

