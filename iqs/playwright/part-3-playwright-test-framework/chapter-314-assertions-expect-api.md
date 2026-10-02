# Chapter 314 — Assertions & Expect API

This chapter covers Playwright's `expect` API — the assertion system that
turns test actions into pass/fail verdicts. Assertions are the most frequently
used concept in any test suite and one of the most heavily tested topics in
interviews. A candidate who understands web-first assertions, soft assertions,
polling, and the `.not` modifier — and can explain why locator assertions
auto-retry — is ready to answer assertion questions at any level.

---

## Q314.1 — What is an assertion in Playwright?

An assertion is a statement that says "I expect this to be true." If the
condition is not true, the test fails. Assertions are how a test communicates
its verdict — pass or fail.

```typescript
// The basic pattern: expect(actual).toMatcherName(expected)
await expect(page.locator('h1')).toHaveText('Welcome to the Dashboard');
//     ↑           ↑                           ↑
//  assertion   what you're               what you expect
//  function    checking                  it to be
```

Playwright's assertion system is built on top of Jest's `expect` — extended
with Playwright-specific matchers for browser elements. The critical
difference from Jest: assertions on locators **automatically retry** until
the condition passes or the timeout expires. This eliminates manual wait
calls before assertions.

---

## Q314.2 — What is the difference between a web-first assertion and a value assertion?

**Web-first assertions** operate on locators. They auto-retry the condition
repeatedly until it passes or the timeout expires (default 5 seconds). They
always need `await`:

```typescript
// Auto-retries until visible or timeout
await expect(page.locator('.success-banner')).toBeVisible();

// Auto-retries until text matches or timeout
await expect(page.getByRole('heading')).toHaveText('Dashboard');
```

**Value assertions** operate on plain JavaScript values. They check once,
immediately — no retry, no `await`:

```typescript
// Checks once — no retry
expect(2 + 2).toBe(4);
expect({ name: 'Alice' }).toEqual({ name: 'Alice' });

const count = await page.locator('.item').count();
expect(count).toBe(3); // count() resolves to a number — assert the number
```

**Decision rule:** Use web-first assertions (`await expect(locator).toX()`)
when checking UI state — they are safer because they wait for the UI to
settle. Use value assertions (`expect(value).toX()`) when checking plain
values extracted from the page or computed in the test.

---

## Q314.3 — What are the most important locator visibility assertions?

```typescript
// toBeVisible() — element exists in DOM AND is visible on screen
// Fails if: element does not exist, has display:none, visibility:hidden, opacity:0
await expect(page.locator('.success-banner')).toBeVisible();

// toBeHidden() — element does NOT exist OR is visually hidden
// Passes if element has display:none, visibility:hidden, or does not exist at all
await expect(page.locator('.loading-spinner')).toBeHidden();

// toBeAttached() — element exists in the DOM (may be hidden)
// Use when you need to confirm presence without caring about visibility
await expect(page.locator('#hidden-input')).toBeAttached();

// toBeEmpty() — element has no text content or child elements
await expect(page.locator('.notifications-list')).toBeEmpty();
```

**The key distinction:**
- `toBeVisible()` — exists AND is visible (the most common assertion)
- `toBeHidden()` — does NOT exist OR is hidden (for asserting absence)
- `toBeAttached()` — exists in DOM, regardless of visibility

---

## Q314.4 — How do you use text assertions in your OrangeHRM project?

In our project, we used text assertions for confirming form submissions,
validating error messages, and verifying navigation:

```typescript
// toHaveText() — exact match (use for headings, labels, status messages)
await expect(page.getByRole('heading', { name: 'Employee List' }))
  .toHaveText('Employee List');

// toHaveText() with regex — for dynamic text with known patterns
await expect(page.locator('.employee-id'))
  .toHaveText(/^EMP-\d{4}$/);  // Matches 'EMP-1234', 'EMP-9999', etc.

// toContainText() — for partial matches (element may have more text)
await expect(page.locator('.success-toast'))
  .toContainText('Successfully Saved');
// Passes even if the full message is 'Record Successfully Saved'

// Checking multiple list items at once
await expect(page.locator('.side-nav-item')).toHaveText([
  'Admin',
  'PIM',
  'Leave',
  'Time',
  'Recruitment',
]);
// Each locator match must correspond to each array entry in order
```

We preferred `toContainText()` for toast messages and dynamic feedback
because the surrounding text could change (timestamps, counts) but the
key phrase stayed constant.

---

## Q314.5 — What form element assertions are available?

```typescript
// toHaveValue() — current value of input, select, or textarea
await expect(page.getByLabel('First Name')).toHaveValue('Priya');
await expect(page.getByLabel('Department')).toHaveValue('Engineering');

// toBeEnabled() / toBeDisabled() — for form validation states
await expect(page.getByRole('button', { name: 'Save' })).toBeEnabled();
await expect(page.getByRole('button', { name: 'Save' })).toBeDisabled();

// toBeChecked() — for checkboxes and radio buttons
await expect(page.getByLabel('Accept Terms')).toBeChecked();
await expect(page.getByLabel('Newsletter')).not.toBeChecked();

// toHaveValues() — for multi-select elements
await expect(page.locator('select[multiple]'))
  .toHaveValues(['Engineering', 'Product']);

// toBeEditable() — element can be typed into (enabled + not readonly)
await expect(page.getByLabel('Username')).toBeEditable();
```

---

## Q314.6 — What page-level assertions are available?

Page assertions check properties of the entire page rather than individual
elements:

```typescript
// toHaveURL() — verify navigation completed to the right URL
await expect(page).toHaveURL('https://demo.orangehrmlive.com/dashboard');
await expect(page).toHaveURL(/\/dashboard/);           // regex for partial match
await expect(page).toHaveURL(/checkout\/step-\d+/);   // dynamic path segment

// toHaveTitle() — verify the browser tab title
await expect(page).toHaveTitle('OrangeHRM');
await expect(page).toHaveTitle(/OrangeHRM/);           // partial match

// toHaveScreenshot() — visual comparison (see Ch 64 for full coverage)
await expect(page).toHaveScreenshot('dashboard.png');
// Compares against a stored baseline image
```

`toHaveURL()` is one of the most important assertions for navigation
verification. After clicking a login button, asserting `toHaveURL(/dashboard/)`
confirms the redirect completed — far more reliable than checking for a
heading that might briefly appear on an intermediate page.

---

## Q314.7 — How do count and attribute assertions work?

```typescript
// toHaveCount() — checks how many elements match the locator
await expect(page.locator('.employee-row')).toHaveCount(10);
await expect(page.locator('.validation-error')).toHaveCount(0); // None present

// toHaveAttribute() — check an HTML attribute value
await expect(page.locator('img.company-logo'))
  .toHaveAttribute('alt', 'OrangeHRM Logo');
await expect(page.locator('a.help-link'))
  .toHaveAttribute('href', '/help');

// toHaveAttribute() with regex
await expect(page.locator('.employee-link'))
  .toHaveAttribute('href', /\/employee\/\d+/);

// toHaveClass() — check for CSS class
await expect(page.locator('.tab-item.active')).toHaveClass(/active/);
await expect(page.locator('.alert')).toHaveClass('alert alert-danger');

// toHaveCSS() — check computed CSS property
await expect(page.locator('.required-field label'))
  .toHaveCSS('color', 'rgb(255, 0, 0)');

// toBeFocused() — element currently has keyboard focus
await page.getByLabel('Search').click();
await expect(page.getByLabel('Search')).toBeFocused();
```

---

## Q314.8 — How does auto-retry work in web-first assertions?

Web-first assertions do not check once and fail immediately. They
enter a retry loop:

```
1. Evaluate the condition (is element visible? does text match?)
2. If passes → assertion succeeds, test continues
3. If fails → wait a short interval and retry
4. Repeat until: condition passes (✅) OR timeout expires (❌)
```

The default retry timeout is 5 seconds (`expect.timeout` in config).
The retry interval starts short and grows slightly with each attempt.

**Why this matters:** In a real application, an element might take
200ms to appear after a button click. Without auto-retry, an assertion
immediately after the click would fail because the element is not there
yet. With auto-retry, the assertion keeps checking for up to 5 seconds —
finding the element as soon as it appears.

```typescript
await page.getByRole('button', { name: 'Search' }).click();

// Without auto-retry: might fail if results take 300ms to appear
// With auto-retry: keeps checking for up to 5 seconds
await expect(page.getByRole('row')).toHaveCount(5);
```

This is the core reason web-first assertions replace `page.waitForSelector()`
in modern Playwright tests. The assertion itself is the wait.

---

## Q314.9 — What is the .not modifier and when do you use it?

`.not` before any matcher asserts the opposite condition:

```typescript
// After successful login — error message should NOT appear
await page.getByLabel('Username').fill('Admin');
await page.getByLabel('Password').fill('admin123');
await page.getByRole('button', { name: 'Login' }).click();

await expect(page.locator('.login-error')).not.toBeVisible();
await expect(page).toHaveURL(/dashboard/);

// After form submission — submit button should not be disabled
await expect(page.getByRole('button', { name: 'Save' })).not.toBeDisabled();

// After deleting a record — it should not appear in the list
await expect(page.locator(`[data-id="${deletedId}"]`)).not.toBeAttached();

// After clearing a field — value should not remain
await page.getByLabel('First Name').clear();
await expect(page.getByLabel('First Name')).not.toHaveValue('Priya');
```

`.not` assertions also auto-retry — they keep checking until the condition
is false (the element disappears, text changes) or the timeout expires.
Use `.not.toBeVisible()` instead of a hard wait when waiting for something
to disappear (loading spinner, toast message).

---

## Q314.10 — What are soft assertions and when do you use them?

By default, a failing assertion immediately stops the test. Soft assertions
let the test continue collecting multiple failures, reporting all of them
at the end:

```typescript
test('verify leave application confirmation page @regression', async ({ page }) => {
  await leavePage.submitLeaveApplication();
  await expect(page).toHaveURL(/\/leave\/confirmation/);

  // Use expect.soft() — test continues even if any of these fail
  await expect.soft(page.locator('.leave-type')).toHaveText('Annual Leave');
  await expect.soft(page.locator('.leave-dates')).toBeVisible();
  await expect.soft(page.locator('.leave-status')).toHaveText('Pending');
  await expect.soft(page.locator('.approver-name')).toBeVisible();
  await expect.soft(page.locator('.manager-email')).toContainText('@');

  // Hard assertion at the end — stops if this fails
  // If soft assertions failed, the test is already marked as failed
  await expect(page.getByRole('button', { name: 'Cancel Request' }))
    .toBeEnabled();
});
```

**When to use soft assertions:**
- Checking multiple independent elements on the same page
- Page-level audits (SEO, accessibility attributes, analytics tags)
- Regression tests where you want the full picture of what broke

**When NOT to use soft assertions:**
- When later actions depend on earlier elements being present (use hard
  assertions to fail fast and avoid cascading errors)
- When one failure makes the remaining assertions meaningless

---

## Q314.11 — What is expect.poll() and when do you need it?

`expect.poll()` repeatedly calls a function until the return value matches
the expected condition or the timeout expires. Use it for things that are
not Playwright locators — API responses, database state, background jobs:

```typescript
// Poll an API until a background job completes
test('bulk import completes within 60 seconds @regression', async ({ request }) => {
  const { jobId } = await (await request.post('/api/import/start', {
    data: { file: 'employees.csv' },
  })).json();

  // Keep calling the API and checking status
  await expect.poll(
    async () => {
      const res = await request.get(`/api/import/status/${jobId}`);
      const body = await res.json();
      return body.status;  // Returns 'pending', 'running', or 'completed'
    },
    {
      message: `Import job ${jobId} should complete within 60 seconds`,
      timeout:   60_000,
      intervals: [1000, 2000, 5000], // check after 1s, 2s, then every 5s
    }
  ).toBe('completed');
});
```

**`expect.poll()` vs `expect(locator)` auto-retry:**
- `expect(locator).toX()` — for DOM elements; Playwright controls the retry
- `expect.poll(fn)` — for any async value; you control what is checked

Use `expect.poll()` when the thing you are waiting for is not directly
observable in the DOM — a backend job, an email arrival, a cache update,
a database record.

---

## Q314.12 — What is the difference between toHaveText() and toContainText()?

Both assert text content, but with different strictness:

```typescript
// Suppose the element's actual text is: "Your order (3 items) is confirmed"

// toHaveText() — matches the COMPLETE text of the element
await expect(locator).toHaveText('Your order (3 items) is confirmed'); // ✅ passes
await expect(locator).toHaveText('confirmed');                          // ❌ fails

// toContainText() — checks that the element CONTAINS this text
await expect(locator).toContainText('confirmed');       // ✅ passes
await expect(locator).toContainText('3 items');         // ✅ passes
await expect(locator).toContainText('cancelled');       // ❌ fails
```

**Decision rule:**
- Use `toHaveText()` when you know the complete text and want an exact match
- Use `toContainText()` when the text has dynamic parts (timestamps, counts,
  usernames) but you only care about a stable phrase within it

`toHaveText()` accepts regex too: `toHaveText(/\d+ items/)` — this is the
cleanest option for dynamic text with a known pattern.

---

## Q314.13 — What is the difference between toBeVisible() and toBeAttached()?

```typescript
// toBeAttached() — element exists in the DOM tree
// Passes even if element is hidden with display:none or visibility:hidden
await expect(page.locator('#hidden-field')).toBeAttached();

// toBeVisible() — element exists AND is displayed
// Fails if element has display:none, visibility:hidden, opacity:0, or zero dimensions
await expect(page.locator('.success-banner')).toBeVisible();
```

A common situation in OrangeHRM: a modal dialog exists in the DOM at all
times but is hidden until triggered:

```typescript
// Modal exists in DOM but is hidden — these behave differently:
await expect(page.locator('#leave-modal')).toBeAttached();    // ✅ passes (in DOM)
await expect(page.locator('#leave-modal')).toBeVisible();     // ❌ fails (hidden)

// After clicking "Apply Leave" to open the modal:
await page.getByRole('button', { name: 'Apply Leave' }).click();
await expect(page.locator('#leave-modal')).toBeVisible();     // ✅ now passes
```

**Decision rule:**
- Use `toBeVisible()` for confirming that the user can see and interact
  with an element (the common case)
- Use `toBeAttached()` when you need to verify DOM presence for elements
  that are legitimately hidden — like validating a hidden input's presence

---

## Q314.14 — How do you add custom messages to assertions for clearer failures?

Pass a custom message as the second argument to `expect()`. It appears in
the failure output when the assertion fails:

```typescript
// Default failure output — generic:
// "Error: expect(locator).toHaveText() - expected 'Error' to equal 'Dashboard'"

// Custom message — specific and diagnostic:
await expect(
  page.getByRole('heading'),
  'After login redirect, the dashboard heading should read "Dashboard"'
).toHaveText('Dashboard');

// For assertions in page object methods — the method name becomes the context
await expect(
  this.saveButton,
  `saveButton should be enabled before submitting the ${formName} form`
).toBeEnabled();

// For data-driven tests — include the data in the message
await expect(
  page.locator('.employee-name'),
  `Employee "${employeeName}" should appear in the search results`
).toContainText(employeeName);
```

Custom messages are particularly valuable in page object methods, where the
assertion failure would otherwise not tell you which action triggered it.
The custom message adds that context directly to the failure report.

---

## Q314.15 — What are the most common assertion mistakes?

**Mistake 1 — Missing `await` on locator assertions:**
```typescript
// ❌ Silent failure — passes immediately without actually checking
expect(page.locator('h1')).toHaveText('Dashboard');

// ✅ Correct
await expect(page.locator('h1')).toHaveText('Dashboard');
```
This is the most common mistake. The assertion without `await` resolves
to a Promise object which is always truthy — the check is silently skipped.
TypeScript with strict settings will warn about this; always enable it.

**Mistake 2 — Using `toBe()` for object comparison:**
```typescript
// ❌ Fails — toBe() uses === (reference equality)
expect({ id: 1 }).toBe({ id: 1 });  // different objects, different references

// ✅ Use toEqual() for deep comparison
expect({ id: 1 }).toEqual({ id: 1 });
```

**Mistake 3 — Using `toHaveText()` for partial matches:**
```typescript
// ❌ Fails if full text is 'Successfully Saved — 3 records updated'
await expect(page.locator('.toast')).toHaveText('Successfully Saved');

// ✅ Use toContainText() for partial matches
await expect(page.locator('.toast')).toContainText('Successfully Saved');
```

**Mistake 4 — Asserting count on shared database data:**
```typescript
// ❌ Flaky in parallel — other tests may add records
await expect(page.locator('.employee-row')).toHaveCount(5);

// ✅ Search for known specific data instead
await employeeListPage.searchByName('Linda Anderson');
await expect(page.locator('.employee-row')).toHaveCount(1);
```

---

## Q314.16 — Write assertions for a complete OrangeHRM login flow.

```typescript
test('valid credentials redirect to dashboard @smoke', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  // Verify the login page loaded
  await expect(page).toHaveTitle(/OrangeHRM/);
  await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible();

  // Fill the form
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();

  // Verify successful login and redirect
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();

  // Verify no error message appeared
  await expect(page.locator('.oxd-alert-content')).not.toBeVisible();
});

test('invalid credentials show error @smoke', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');

  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('wrong-password');
  await page.getByRole('button', { name: 'Login' }).click();

  // Stay on login page
  await expect(page).toHaveURL(/\/auth\/login/);

  // Error message appears
  await expect(page.locator('.oxd-alert-content'))
    .toBeVisible();
  await expect(page.locator('.oxd-alert-content'))
    .toContainText('Invalid credentials');

  // Fields remain visible — not cleared
  await expect(page.getByPlaceholder('Username'))
    .toBeVisible();
});
```

---

## Q314.17 — How do you use assertions with value assertions from the page?

When you extract a value from the page and want to assert on it with
non-Playwright matchers:

```typescript
test('employee count matches search results @regression', async ({ page, employeeListPage }) => {
  await employeeListPage.searchByDepartment('Engineering');

  // Extract a number from the page, then assert on the number
  const countText = await page.locator('.oxd-table-header .orangehrm-count').textContent();
  const count = parseInt(countText!.replace(/[^0-9]/g, ''), 10);
  expect(count).toBeGreaterThan(0);
  expect(count).toBeLessThan(200);

  // Verify that the table row count matches the displayed count
  const rowCount = await page.locator('.oxd-table-body .oxd-table-row').count();
  expect(rowCount).toBe(count);
});

test('leave balance is a valid number @smoke', async ({ page, leavePage }) => {
  await leavePage.goto();

  const balanceText = await page.locator('.leave-balance-days').textContent();
  const balance = parseFloat(balanceText!.trim());

  // Value assertions on extracted data
  expect(balance).toBeGreaterThanOrEqual(0);
  expect(balance).toBeLessThanOrEqual(365);
  expect(Number.isFinite(balance)).toBe(true);
});
```

The pattern: use web-first assertions (`await expect(locator)`) for UI
state checks; use value assertions (`expect(value)`) for numbers, strings,
and objects extracted from the page or API responses.

---

## Q314.18 — How did you handle assertion strategy in your project?

In our OrangeHRM project, we established three assertion conventions that
reduced flakiness and improved failure messages significantly.

**Convention 1 — Use `toContainText()` for all toast and alert messages.**
Our toast messages included timestamps and record IDs. Using `toHaveText()`
caused failures whenever the message format changed. Switching to
`toContainText()` for the stable key phrase meant format changes no longer
broke tests.

**Convention 2 — Soft assertions for page-level audits.**
We had regression tests that verified the full state of a form page — all
field labels, help text, placeholder values, and button states. Using hard
assertions meant the first field mismatch stopped the test. Switching to
soft assertions for the field checks (with one final hard assertion on
the primary action) gave us complete failure reports — useful when a
deployment changed multiple labels at once.

**Convention 3 — Custom messages in all page object assertions.**
Every assertion inside a page object method now includes a custom message
identifying the method and the expected state. Before this change, a
failure in `leavePage.verifyConfirmation()` said "expected 'pending' to
equal 'approved'". After: "verifyConfirmation(): leave status should be
'Pending' after initial submission." The extra context cut average
investigation time in half.

The combined effect: 23% fewer flaky assertions in the first month, and
average failure diagnosis time dropped from 8 minutes to 3.

---

## Chapter Summary

- An assertion is a pass/fail statement. Playwright's `expect` API extends Jest with browser-specific matchers.
- Web-first assertions (`await expect(locator).toX()`) auto-retry until the condition passes or times out. No manual waits needed.
- Value assertions (`expect(value).toX()`) check once immediately — use for numbers and objects extracted from the page.
- `toBeVisible()` — exists AND visible. `toBeHidden()` — does not exist OR hidden. `toBeAttached()` — in DOM regardless of visibility.
- `toHaveText()` — exact match. `toContainText()` — partial match. Use regex with `toHaveText(/pattern/)` for dynamic content.
- `toHaveURL()` and `toHaveTitle()` are page-level assertions — essential for verifying navigation.
- `.not` modifier asserts the opposite. `.not.toBeVisible()` also auto-retries — use it to wait for elements to disappear.
- Soft assertions (`expect.soft()`) continue the test after failure, collecting all failures for a combined report at the end.
- `expect.poll(fn)` retries a custom async function — use for API responses, database state, background jobs.
- Always `await` locator assertions — omitting `await` silently skips the check.
- Use `toContainText()` for messages with dynamic parts; `toHaveText()` with regex for known patterns; exact string only when fully stable.
