# Chapter 19: API Testing (Complete Guide)

## The Concept of API Testing

Modern web applications are powered by APIs. Testing only through the UI is like checking a car's dashboard without looking under the hood. **API Testing** allows you to verify the application's core logic, data integrity, and security without the overhead of a browser.

**Purpose**: This chapter explores how Playwright's built-in API client allows you to perform CRUD operations and handle test data management efficiently.

**Why is it required?**
1. **Speed**: To verify back-end logic in milliseconds compared to seconds for UI interactions.
2. **Setup & Teardown**: To create or delete test data (like users or orders) via API before running a UI test to ensure a clean state.
3. **Reliability**: To isolate the back-end issues from UI issues, making it easier to pinpoint the root cause of failures.

### REST API Fundamentals

Before automating, you must understand the **REST (Representational State Transfer)** architecture:
*   **Resources**: Everything is a resource (e.g., `/users`, `/orders`).
*   **Methods**: 
    - `GET`: Read data.
    - `POST`: Create data.
    - `PUT`: Update entire resource.
    - `PATCH`: Update partial resource.
    - `DELETE`: Remove resource.
*   **Status Codes**:
    - `200/201`: Success/Created.
    - `400/401/403/404`: Client Errors (Bad Request, Unauth, Forbidden, Not Found).
    - `500`: Server Error.

---

### Beyond UI Testing

Playwright is unique because it ships with a full-fidelity API Client. It’s not just for "API testing"; it’s for **Test Data Management**.

**Why use Playwright for API (vs Axios/Supertest)?**
1. **Unified Context**: It shares cookies/storage automatically with the Browser context.
2. **Unified Config**: Use the same `playwright.config.ts` (BaseURL, Auth, Proxies).
3. **Unified Reporting**: API steps appear in the Trace Viewer alongside UI steps.

---

## The `APIRequestContext` Fixture

Playwright provides `request` as a default fixture.

```typescript
import { test, expect } from '@playwright/test';

test('simple api check', async ({ request }) => {
  const response = await request.get('https://api.github.com/zen');
  expect(response.ok()).toBeTruthy();
});
```

### Context Isolation

Like `page`, `request` creates a fresh storage context. It won't share state between tests unless configured.

---

## CRUD Operations Deep Dive

### GET (Read)

```typescript
test('GET users', async ({ request }) => {
  const response = await request.get('/api/users', {
    params: { page: 2 }, // Query params ?page=2
    headers: { 'Accept': 'application/json' }
  });
  
  expect(response.status()).toBe(200);
  
  // Body parsing
  const body = await response.json();
  expect(body.data.length).toBeGreaterThan(0);
});
```

### POST (Create)

Sending data often requires correct `Content-Type`. Playwright handles JSON automatic serialization.

```typescript
test('POST create user', async ({ request }) => {
  const response = await request.post('/api/users', {
    data: {
      name: 'Morpheus',
      job: 'Leader'
    }
  });
  
  expect(response.status()).toBe(201);
  const resData = await response.json();
  expect(resData.name).toBe('Morpheus');
});
```

### POST (Form/Multipart)

Uploading files via API (bypassing UI).

```typescript
test('POST file upload', async ({ request }) => {
  const response = await request.post('/api/upload', {
    multipart: {
      fileField: {
        name: 'test.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from('Hello World')
      },
      description: 'Upload Test'
    }
  });
  expect(response.ok()).toBeTruthy();
});
```

### PUT/PATCH & DELETE

```typescript
// Update
await request.put('/api/users/2', {
  data: { job: 'Zion Resident' }
});

// Delete
const delRes = await request.delete('/api/users/2');
expect(delRes.status()).toBe(204);
```

---

## Validating Responses (Schema & Headers)

Use standard Jest/Playwright matchers to validate structure.

### Complex JSON Validation

```typescript
test('validate structure', async ({ request }) => {
  const res = await request.get('/api/users/2');
  const body = await res.json();
  
  // Jest objectContaining for partial matching
  expect(body).toEqual(expect.objectContaining({
    data: expect.objectContaining({
      id: 2,
      email: expect.stringMatching(/@reqres.in$/), // Regex
      first_name: expect.any(String)
    })
  }));
});
```

### Header Validation

Ensure security headers or specific content types.

```typescript
const headers = response.headers();
const headers = response.headers();
expect(headers['content-type']).toContain('application/json');
expect(headers['cache-control']).toBe('max-age=14400');

---

## 2. Professional Implementation: Schema Validation

In enterprise projects, checking `status === 200` isn't enough. You must verify the **JSON Schema** to ensure the API response structure hasn't changed.

### Installation
```bash
npm install ajv
```

### Schema Validation Utility
```typescript
import Ajv from 'ajv';
import { expect } from '@playwright/test';

const ajv = new Ajv();

export function validateSchema(data: any, schema: object) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
        throw new Error(`Schema validation failed: ${JSON.stringify(validate.errors)}`);
    }
}
```

### Usage in Test
```typescript
test('validate user schema', async ({ request }) => {
    const response = await request.get('/api/users/1');
    const body = await response.json();
    
    const userSchema = {
        type: 'object',
        properties: {
            id: { type: 'number' },
            email: { type: 'string' },
            first_name: { type: 'string' }
        },
        required: ['id', 'email']
    };
    
    validateSchema(body.data, userSchema);
});
```

---
```

---

## Hybrid Testing: The Superpower

This is the **Killer Feature**. Use API to set up state (fast), then test UI.

**Scenario**: Test the "Delete Item" UI logic.
**Slow way**: UI Login -> UI Create Item -> UI Delete Item.
**Playwright way**: API Create Item -> UI Login -> UI Delete Item.

```typescript
test('hybrid delete test', async ({ page, request }) => {
  // 1. Arrange: Create data via API (ms)
  const createRes = await request.post('/api/products', {
    data: { name: 'To Be Deleted' }
  });
  const product = await createRes.json();
  
  // 2. Act: Delete via UI
  await page.goto(`/products/${product.id}`);
  await page.getByRole('button', { name: 'Delete' }).click();
  
  // 3. Assert: Verify via API (or UI) that it's gone
  const check = await request.get(`/api/products/${product.id}`);
  expect(check.status()).toBe(404);
});
```

---

## Pattern: The API Object Model (AOM)

Just like POM for UI, maintain reusable API clients.

```typescript
// fixtures/api/UserAPI.ts
import { APIRequestContext, expect } from '@playwright/test';

export class UserAPI {
  constructor(private request: APIRequestContext) {}

  async create(name: string) {
    const res = await this.request.post('/api/users', { data: { name } });
    expect(res.ok(), 'User creation failed').toBeTruthy();
    return await res.json();
  }

  async delete(id: string) {
    const res = await this.request.delete(`/api/users/${id}`);
    expect(res.status()).toBe(204);
  }
}
```

Use it in tests:

```typescript
test('lifecycle', async ({ request }) => {
  const api = new UserAPI(request);
  
  const user = await api.create('Neo');
  await api.delete(user.id);
});
```

---

## Best Practices

| Tip | Detail |
|-----|--------|
| **Use `response.ok()`** | `expect(res.ok()).toBeTruthy()` is a quick sanity check for 2xx status codes. |
| **Debug Failure** | If API fails, `console.log(await res.text())` immediately to see the server error message. |
| **Share State** | Pass `storageState` to new API contexts if you need to use the browser's cookies for API calls. |
| **Cleanup** | Use `test.afterAll` to delete data created via API to keep environments clean. |
| **Don't hardcode URLs** | Use `baseURL` in config so you can switch between dev/staging/prod easily. |

**Summary**: You've seen how Playwright can be used for robust API testing, including the powerful hybrid model where API setup meets UI testing. The next chapter takes this further by showing how to intercept and mock network traffic for edge-case testing.
