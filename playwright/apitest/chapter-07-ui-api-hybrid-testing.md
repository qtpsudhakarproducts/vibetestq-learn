# Chapter 7 — UI + API Hybrid Testing

---

## What You Will Learn

- Why API setup is faster than form navigation
- How to set up state via the API and verify via the UI
- How to trigger UI actions and verify results via the API
- The three-step hybrid test pattern

---

## 7.1 Why Hybrid Testing Matters

A Playwright test can use both `page` (for the browser UI) and `request` (for the API) in the same test. This combination is more powerful than either alone.

**Pure UI tests are slow.** Navigating forms takes 10–15 seconds per test. Creating 10 employees through a UI form takes 2 minutes. Creating them through the API takes 2 seconds.

**Pure API tests miss UI bugs.** An API test confirms the backend works. It does not confirm the frontend displays the data correctly.

**Hybrid tests get the best of both.** Use the API for speed. Use the UI for what only the UI can verify.

---

## 7.2 Pattern 1 — Set Up via API, Verify via UI

Create test data through the API. Open the UI page. Assert what the user would see.

```typescript
import { test, expect } from '@playwright/test';

test('employee created via API appears on the list page', async ({ request, page }) => {
  // Create through the API — fast and controlled
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Diana',
      lastName:   'Prince',
      email:      'diana.prince@company.com',
      department: 'Engineering',
      role:       'Tech Lead',
    },
  });
  expect(createResponse.status()).toBe(201);

  // Open the UI and verify
  await page.goto('/employees');
  await expect(page.getByText('Diana Prince')).toBeVisible();
  await expect(page.getByText('Tech Lead')).toBeVisible();
});
```

This pattern is useful when:
- Testing that a newly created record appears in a list
- Testing how the UI displays data from the API
- Setting up preconditions without slow form navigation

---

## 7.3 Pattern 2 — Act via UI, Verify via API

Perform an action in the browser. Then call the API to confirm the backend processed it.

The UI may show a success message even when the backend failed. The API does not lie — if the record is gone from the API, the delete truly happened.

```typescript
test('deleting via the UI removes the employee from the API', async ({ request, page }) => {
  // Create a known employee via the API
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Delete',
      lastName:   'Me',
      email:      'delete.me@company.com',
      department: 'Finance',
      role:       'Analyst',
    },
  });
  const { id } = await createResponse.json();

  // Use the UI to delete the employee
  await page.goto(`/employees/${id}`);
  await page.getByRole('button', { name: 'Delete Employee' }).click();
  await page.getByRole('button', { name: 'Confirm' }).click();

  // Verify via the API — not just the UI success message
  const getResponse = await request.get(`/employees/${id}`);
  expect(getResponse.status()).toBe(404);
});
```

This pattern is useful when:
- Verifying a UI action actually changed the backend state
- Testing that form submissions saved correct data
- Confirming UI delete operations removed the record

---

## 7.4 Pattern 3 — API Setup, UI Action, API Verification

The most complete hybrid pattern. Set up via API, interact via UI, verify outcome via API.

```typescript
test('editing role via UI updates the API record', async ({ request, page }) => {
  // Step 1: Create via API
  const createResponse = await request.post('/employees', {
    data: {
      firstName:  'Bruce',
      lastName:   'Wayne',
      email:      'bruce.wayne@company.com',
      department: 'Finance',
      role:       'Analyst',
    },
  });
  const { id } = await createResponse.json();

  // Step 2: Edit via UI
  await page.goto(`/employees/${id}/edit`);
  await page.getByLabel('Role').clear();
  await page.getByLabel('Role').fill('Senior Analyst');
  await page.getByRole('button', { name: 'Save' }).click();

  // Step 3: Verify via API
  const getResponse = await request.get(`/employees/${id}`);
  const body = await getResponse.json();
  expect(body.role).toBe('Senior Analyst');
});
```

---

## Interview Questions — Chapter 7

**Q1. Why is it faster to set up test data through the API rather than the UI?**

An API call takes under 1 second. Navigating a form — finding fields, filling them, clicking submit, waiting for navigation — takes 10–15 seconds. At 10 tests, that is 2 minutes of extra runtime just for setup. API setup also does not depend on the UI being functional, making the setup step more reliable.

**Q2. Why is it not enough to check the UI success message after a delete action?**

The UI success message is controlled by frontend JavaScript. It can display "Deleted successfully" even if the API call failed, the network request timed out, or the backend returned an error. Calling the API directly after the UI action confirms the actual backend state. The API response cannot be faked by frontend code.

**Q3. In a hybrid test, which assertion comes first — UI or API?**

It depends on the pattern. In Pattern 1 (set up via API, verify via UI), the UI assertion comes after the API setup. In Pattern 2 (act via UI, verify via API), the API assertion comes after the UI action. The rule is: use the tool that is closest to what you are verifying. UI for visible behaviour, API for backend state.

**Q4. How do you access both `request` and `page` in a single Playwright test?**

Destructure both from the test callback: `async ({ request, page }) => { ... }`. Playwright provides them as separate fixtures. They share the same browser context, so cookies set by the page are available to the request fixture and vice versa.

**Q5. Describe a real scenario where a hybrid test would catch a bug that a pure UI test would miss.**

A UI test clicks "Delete Employee" and sees "Employee deleted successfully". The test passes. But the backend had a bug — the delete endpoint returned 200 with the employee still in the database. A pure UI test would pass because the success message appeared. A hybrid test would call `GET /employees/:id` after the UI action and see a 200 — not the expected 404. The bug is caught.

---

