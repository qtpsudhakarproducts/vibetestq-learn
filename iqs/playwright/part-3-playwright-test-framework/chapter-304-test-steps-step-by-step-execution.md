# Chapter 304 — Test Steps — Step-by-Step Execution

This chapter covers `test.step()` — Playwright's mechanism for labelling
phases inside a single test. Interviewers ask about steps when testing
debugging and reporting skills. Candidates who use steps well write tests
where a failure report tells you exactly what broke and where in the workflow
it happened, without opening a file or reproducing the failure locally.

---

## Q304.1 — What is test.step() and why does it exist?

`test.step()` wraps a block of test code under a named label. Each step
appears in the HTML report and trace viewer with its own name, pass/fail
status, and timing. When a test fails, instead of seeing "error at line 47",
you see which named phase of the workflow failed.

```typescript
// Without steps — failure shows "error at line 22"
test('employee onboarding @e2e', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  // ... 20 more lines
  await page.getByRole('button', { name: 'Save' }).click();
  // line 22 — but which phase of the workflow is this?
});

// With steps — failure shows "❌ Save and verify success message"
test('employee onboarding @e2e', async ({ page }) => {
  await test.step('Log in as Admin', async () => { ... });
  await test.step('Fill employee details', async () => { ... });
  await test.step('Save and verify success message', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
    // failure here is labelled — no archaeology required
  });
  await test.step('Verify employee in list', async () => { ... });
});
```

The report shows exactly which phase failed and which phases passed before
it — making multi-step workflow failures debuggable in seconds.

---

## Q304.2 — What is the signature of test.step()?

```typescript
test.step(title: string, body: () => Promise<T>): Promise<T>
test.step(title: string, body: () => Promise<T>, options?: { box?: boolean }): Promise<T>
```

`test.step()` is async and returns a Promise. You must always `await` it.
The body function is also async. Missing `await` on either causes the test
to continue before the step finishes — a silent race condition.

```typescript
// ❌ Missing outer await — test continues before step completes
test.step('Fill form', async () => {
  await page.getByLabel('Name').fill('Alice');
});

// ✅ Correct — await the step itself
await test.step('Fill form', async () => {
  await page.getByLabel('Name').fill('Alice');
});
```

---

## Q304.3 — When should you use test.step() and when should you not?

**Use steps when:**
- The test covers a multi-step workflow where knowing which phase failed
  changes the debugging approach significantly
- The test body is long enough (15+ lines) that a line number gives little context
- You are writing an E2E test that spans multiple pages or feature areas

**Do not use steps when:**
- The test is short and already maps to AAA clearly — steps add visual noise
  without adding diagnostic value
- Every test in a suite gets wrapped in steps mechanically — this is ceremony,
  not communication

```typescript
// ❌ Steps add noise — 3-line test is already self-explanatory
test('invalid password shows error @regression', async ({ loginPage }) => {
  await test.step('Go to login', async () => { await loginPage.goto(); });
  await test.step('Enter bad password', async () => { await loginPage.login('Admin', 'wrong'); });
  await test.step('Verify error', async () => { await loginPage.expectError(); });
});

// ✅ No steps needed here
test('invalid password shows error @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', 'wrong');
  await loginPage.expectError();
});

// ✅ Steps add real value in a 25-line workflow test
test('full leave application workflow @e2e', async ({ page }) => {
  await test.step('Employee applies for annual leave', async () => { ... });
  await test.step('Manager approves the request', async () => { ... });
  await test.step('Leave balance is deducted', async () => { ... });
});
```

---

## Q304.4 — How do steps appear in the HTML report?

When a test with steps runs, the HTML report shows each step as a collapsible
entry under the test, with:
- The step name
- A ✅ / ❌ status icon
- The time the step took

When a step fails, subsequent steps show as skipped (⏭). The error message
appears under the failing step — not buried in a stack trace at the bottom
of the page.

Example report output for a failing test:
```
Employee onboarding end-to-end
  ✅ Log in as Admin                     (1.2s)
  ✅ Navigate to Add Employee form        (0.4s)
  ✅ Fill employee details                (0.8s)
  ❌ Save and verify success message      (5.0s)
       Error: Timeout 5000ms exceeded waiting for 'Successfully Saved'
  ⏭ Verify employee appears in list      (skipped)
```

Without steps, the same failure would show a single error at line 22 with no
context about what the test had already completed.

---

## Q304.5 — How do steps appear in the trace viewer?

The Playwright trace viewer (`npx playwright show-trace trace.zip`) shows
steps as collapsible sections in the timeline on the left side. Clicking a
step shows the browser state at that exact moment — the screenshot, the DOM
snapshot, and the network requests that occurred during that step.

This makes trace-based debugging work at the step level rather than the
action level. You click "Save and verify success message" in the trace,
see the page at the moment the step failed, and identify the issue without
replaying the entire test.

Steps are one of the primary reasons trace debugging in Playwright is
significantly faster than screenshot-based debugging in Selenium.

---

## Q304.6 — Can test.step() return a value? When is this useful?

Yes. The body function can return a value, and `test.step()` passes it
through. This is useful when one step produces data that subsequent steps
need:

```typescript
test('create employee and verify @e2e', async ({ page }) => {

  // Step 1 returns the generated employee ID
  const employeeId = await test.step('Create employee', async () => {
    await page.goto('/employees/add');
    await page.getByLabel('First Name').fill('Ravi');
    await page.getByLabel('Last Name').fill('Kumar');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
    return await page.getByLabel('Employee Id').inputValue(); // return value
  });

  // Step 2 uses the returned value — also appears in its title
  await test.step(`Search for employee ${employeeId}`, async () => {
    await page.goto('/employees');
    await page.getByLabel('Employee Id').fill(employeeId);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Ravi Kumar')).toBeVisible();
  });

  await test.step(`Delete employee ${employeeId}`, async () => {
    await page.getByRole('row', { name: /Ravi Kumar/ })
               .getByRole('button', { name: 'Delete' }).click();
    page.once('dialog', d => d.accept());
    await expect(page.getByText('Ravi Kumar')).not.toBeVisible();
  });
});
```

Including the returned value in subsequent step titles makes the report
self-documenting — the step title shows exactly which employee ID was
being searched for or deleted.

---

## Q304.7 — What is the box option in test.step()?

`{ box: true }` hides the internal actions of a step from the report and
trace. The step appears as a single pass/fail entry without showing the
individual `click`, `fill`, and `expect` calls inside it.

```typescript
// Without box — report shows all internal actions
await test.step('Log in as Admin', async () => {
  await page.goto('/login');               // visible in report
  await page.getByLabel('Username').fill('Admin'); // visible in report
  await page.getByLabel('Password').fill('admin123'); // visible in report
  await page.getByRole('button', { name: 'Login' }).click(); // visible in report
});

// With box — report shows only "Log in as Admin: passed/failed"
await test.step('Log in as Admin', async () => {
  await page.goto('/login');
  await page.getByLabel('Username').fill('Admin');
  await page.getByLabel('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
}, { box: true });
```

**Use `box: true` for:** utility steps that are incidental to the test —
login, navigation to a starting state, teardown. These are tested elsewhere
and their internals are not relevant when investigating failures in the
current test.

**Do not use `box: true` for:** steps that contain the core logic being
tested — you need to see those internals when they fail.

---

## Q304.8 — Can you nest test.step() calls? What is the recommended depth?

Yes. Steps can be nested inside other steps. The report and trace viewer
show the hierarchy:

```typescript
test('full leave workflow @e2e', async ({ page }) => {

  await test.step('Apply for leave', async () => {

    await test.step('Navigate to Apply Leave form', async () => {
      await page.goto('/leave/apply');
      await expect(page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
    });

    await test.step('Fill leave details', async () => {
      await page.getByLabel('Leave Type').selectOption('Annual');
      await page.getByLabel('From Date').fill('2026-04-01');
      await page.getByLabel('To Date').fill('2026-04-03');
    });

    await test.step('Submit application', async () => {
      await page.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByText('Successfully Applied')).toBeVisible();
    });

  });

  await test.step('Verify leave in My Leave list', async () => {
    await page.goto('/leave/my-leave');
    await expect(page.getByText('Pending Approval')).toBeVisible();
  });

});
```

Report output:
```
Full leave workflow
  ✅ Apply for leave                        (3.2s)
       ✅ Navigate to Apply Leave form      (0.6s)
       ✅ Fill leave details                (0.9s)
       ✅ Submit application                (1.7s)
  ✅ Verify leave in My Leave list          (0.8s)
```

**Recommended maximum depth: one level of nesting.** Two levels (step inside
a step) is occasionally useful. Three levels makes the report hierarchy hard
to read and suggests the test is covering too much — consider splitting it.

---

## Q304.9 — How do you use test.step() inside page objects?

Steps work inside page object methods. Wrapping methods in steps makes trace
output more informative — instead of seeing a list of raw `click` and `fill`
actions, you see which page object method they came from.

```typescript
// pages/AddEmployeePage.ts
import { test, expect, Page } from '@playwright/test';

export class AddEmployeePage {
  constructor(private readonly page: Page) {}

  async goto() {
    await test.step('AddEmployeePage.goto', async () => {
      await this.page.goto('/employees/add');
      await expect(this.page.getByRole('heading', { name: 'Add Employee' }))
        .toBeVisible();
    });
  }

  async fillBasicInfo(firstName: string, lastName: string) {
    await test.step(`AddEmployeePage.fillBasicInfo(${firstName} ${lastName})`, async () => {
      await this.page.getByLabel('First Name').fill(firstName);
      await this.page.getByLabel('Last Name').fill(lastName);
    });
  }

  async save(): Promise<string> {
    return await test.step('AddEmployeePage.save', async () => {
      await this.page.getByRole('button', { name: 'Save' }).click();
      await expect(this.page.getByText('Successfully Saved')).toBeVisible();
      return await this.page.getByLabel('Employee Id').inputValue();
    });
  }
}
```

When `addEmployeePage.save()` fails, the trace shows:

```
AddEmployeePage.save
  → click on button 'Save'
  → wait for text 'Successfully Saved' ← timed out here
```

Without steps, the trace just shows anonymous `click` and `waitFor` actions
with no context about which page object method they came from.

---

## Q304.10 — What is the difference between test.step() and test.describe()?

Both group code under a name, but they serve completely different purposes:

| | `test.describe` | `test.step` |
|---|---|---|
| **Purpose** | Groups multiple tests | Phases one test |
| **Scope** | Multiple `test()` calls | Inside a single `test()` call |
| **Can have hooks** | Yes — `beforeEach`, `beforeAll` | No hooks |
| **Parallel execution** | Can be parallelised | Always sequential |
| **When one fails** | Other tests still run | Subsequent steps are skipped |

```typescript
// describe — use for grouping independent tests
test.describe('Login', () => {
  test('valid credentials succeed @smoke', async ({ page }) => { ... });
  test('invalid password shows error @regression', async ({ page }) => { ... });
  // If test 1 fails, test 2 still runs
});

// step — use for phases of one sequential workflow
test('full checkout workflow @e2e', async ({ page }) => {
  await test.step('Add item to cart', async () => { ... });
  await test.step('Proceed to checkout', async () => { ... });
  await test.step('Complete payment', async () => { ... });
  // If step 1 fails, steps 2 and 3 are skipped
});
```

**Use describe** to organise tests that each verify one independent behaviour.
**Use step** to document the phases of a single test that verifies a workflow.

---

## Q304.11 — What happens when a step fails? Do subsequent steps run?

No. When a step fails, Playwright marks it as failed and skips all subsequent
steps in the test. The test is reported as failed.

```
test('checkout @e2e', ...) → FAILED
  ✅ Add item to cart         (0.8s)
  ✅ Proceed to checkout      (0.5s)
  ❌ Complete payment         (5.0s)  ← failed here
  ⏭ View confirmation         (skipped)
```

This behaviour is correct — subsequent steps depend on previous steps
completing successfully. Running "view confirmation" after "payment" failed
would produce meaningless results.

---

## Q304.12 — How do you handle a step that might fail without failing the test?

Wrap it in a try/catch. This lets you run a best-effort step (like cleanup
inside a workflow test) without failing the test if it fails:

```typescript
test('create and verify employee @e2e', async ({ page }) => {
  let employeeId: string;

  await test.step('Create employee', async () => {
    // ... create logic
    employeeId = await page.getByLabel('Employee Id').inputValue();
  });

  await test.step('Verify in list', async () => {
    // ... verification
  });

  // Best-effort cleanup step — should not fail the test if it breaks
  try {
    await test.step('Cleanup: delete test employee', async () => {
      await deleteEmployee(employeeId);
    });
  } catch {
    console.log(`Cleanup failed for ${employeeId} — may need manual removal`);
  }
});
```

Use this sparingly. If cleanup is critical, do it in `afterEach` instead —
hooks are the correct mechanism for cleanup, not try/catch inside steps.

---

## Q304.13 — Write a complete E2E test for an employee onboarding workflow using test.step().

```typescript
import { test, expect } from '../fixtures/baseFixture';

test(
  'new employee is created, assigned, and can log in @e2e',
  { tag: '@e2e', timeout: 120_000 },
  async ({ page }) => {

    let employeeId: string;

    await test.step('Admin creates employee record', async () => {
      await page.goto('/employees/add');
      await page.getByLabel('First Name').fill('Nisha');
      await page.getByLabel('Last Name').fill('Patel');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Successfully Saved')).toBeVisible();
      employeeId = await page.getByLabel('Employee Id').inputValue();
    });

    await test.step('Admin assigns employee to department', async () => {
      await page.getByLabel('Department').selectOption('Engineering');
      await page.getByLabel('Job Title').selectOption('QA Engineer');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Successfully Saved')).toBeVisible();
    });

    await test.step('Admin creates login credentials', async () => {
      await page.getByRole('tab', { name: 'Account' }).click();
      await page.getByLabel('Enable Login').check();
      await page.getByLabel('Username').fill('nisha.patel');
      await page.getByLabel('Password').fill('Employee@123');
      await page.getByLabel('Confirm Password').fill('Employee@123');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByText('Successfully Saved')).toBeVisible();
    });

    await test.step(`Employee ${employeeId} appears in employee list`, async () => {
      await page.goto('/employees');
      await page.getByLabel('Employee Id').fill(employeeId);
      await page.getByRole('button', { name: 'Search' }).click();
      await expect(page.getByText('Nisha Patel')).toBeVisible();
    });

    await test.step('Employee can log in with new credentials', async () => {
      await page.goto('/logout');
      await page.goto('/login');
      await page.getByLabel('Username').fill('nisha.patel');
      await page.getByLabel('Password').fill('Employee@123');
      await page.getByRole('button', { name: 'Login' }).click();
      await expect(page).toHaveURL(/dashboard/);
      await expect(page.getByText('Nisha Patel')).toBeVisible();
    });
  }
);
```

---

## Q304.14 — How did your project use test.step() and what impact did it have?

In our project, we introduced `test.step()` specifically for E2E tests in
the checkout and onboarding flows. These tests span 4–6 pages and 25–40
lines of actions. Before steps, a failure in CI showed something like:

```
Error: locator.click: Element not found
  at tests/e2e/checkout.spec.ts:34:10
```

Line 34. We had to open the file, count lines, understand context. For a
test that long, that took 10 minutes minimum.

After wrapping each phase in a step:

```
❌ Step 3: Complete payment (5.0s)
   Error: Timeout waiting for 'Payment Confirmed'
```

Immediately obvious. The payment step failed. No file opening needed.

We also added steps to page object methods. When a page object method fails
in a step-decorated form, the trace shows the method name alongside the
raw action — cutting trace review time roughly in half.

The rule we settled on: any E2E test with 4+ pages or 20+ lines gets steps.
Shorter unit-style tests do not.

---

## Q304.15 — What is the relationship between test.step() and the trace viewer?

The trace viewer (`npx playwright show-trace`) shows steps as collapsible
sections in the timeline panel on the left. Each step has:

- A label with pass/fail indicator
- A timestamp showing when it started and ended
- Expandable child entries for each Playwright action inside the step

Clicking a step shows the browser screenshot at that exact moment — the
visual state of the application when that step was executing.

```bash
# Record traces in CI
npx playwright test --trace on

# Open trace locally after CI failure
npx playwright show-trace test-results/checkout-e2e/trace.zip
```

Without steps, the trace timeline shows a flat list of raw actions —
`click`, `fill`, `navigate`, `waitFor`. With steps, the timeline shows
named phases that map to the workflow. You navigate the trace at the workflow
level rather than the action level.

This is the primary reason to use steps in page objects: every page object
method call becomes a named entry in the trace, making the trace read like
the test's narrative rather than a log of low-level browser events.

---

## Q304.16 — How do you handle variable data between steps?

Variables shared between steps must be declared outside all steps at the test
level. JavaScript closure gives each step access to those variables:

```typescript
test('create and verify order @e2e', async ({ page }) => {
  // Declare variables at test level — accessible in all steps
  let orderId: string;
  let orderTotal: string;

  await test.step('Place order', async () => {
    await page.goto('/cart');
    await page.getByRole('button', { name: 'Checkout' }).click();
    await page.getByRole('button', { name: 'Place Order' }).click();
    await expect(page.getByTestId('order-confirmation')).toBeVisible();
    // Read and store values for use in later steps
    orderId    = await page.getByTestId('order-id').textContent() ?? '';
    orderTotal = await page.getByTestId('order-total').textContent() ?? '';
  });

  await test.step(`Verify order ${orderId} in order history`, async () => {
    await page.goto('/orders');
    await expect(page.getByText(orderId)).toBeVisible();
    await expect(page.getByText(orderTotal)).toBeVisible();
  });

  await test.step('Email confirmation is sent', async () => {
    // Check email API using orderId
    const email = await getLastEmailForOrder(orderId);
    expect(email.subject).toContain(orderId);
  });
});
```

This is the correct pattern — declare shared variables at the test scope,
mutate them inside steps, read them in later steps.

---

## Q304.17 — What is the step title naming convention your team follows?

In our project, step titles follow this convention:

- For user-action steps: **verb + noun** describing what the user does:
  `'Apply for annual leave'`, `'Admin approves the request'`
- For verification steps: **noun + assertion** describing what is verified:
  `'Leave balance reflects approved days'`, `'Confirmation email is sent'`
- For page object steps: **ClassName.methodName** with key parameters:
  `'PaymentPage.fillCard(4242...)'`, `'OrdersPage.searchById(ORD-001)'`
- For setup/teardown steps inside tests: prefix with `'Setup:'` or
  `'Teardown:'` to signal they are not the core test logic

Consistent naming means any team member reading a failure report can
understand which phase broke and what the test was attempting — without
opening the source file.

---

## Q304.18 — When would you choose test.step over splitting the test into multiple tests?

Use `test.step` when the steps are **genuinely sequential and interdependent**
— when step 2 only makes sense if step 1 succeeded, and step 3 only makes
sense if step 2 succeeded.

Split into multiple tests when steps are **independent** — when the outcome
of one does not determine whether the others should run.

```typescript
// ✅ Use steps — steps are sequential and interdependent
test('checkout workflow @e2e', async ({ page }) => {
  await test.step('Add to cart', async () => { ... });
  await test.step('Enter shipping', async () => { ... }); // meaningless without cart
  await test.step('Complete payment', async () => { ... }); // meaningless without shipping
  await test.step('View confirmation', async () => { ... }); // meaningless without payment
});

// ✅ Split — these are independent outcomes of the same action
test('save shows success message @smoke', async ({ page }) => { ... });
test('saved employee appears in list @regression', async ({ page }) => { ... });
test('form resets after save @regression', async ({ page }) => { ... });
// All three can fail independently — splitting gives clearer failure signals
```

The practical test: if step 2 failing tells you nothing about whether step 3
would pass independently, they should be separate tests. If step 2 failing
makes step 3 meaningless, keep them as steps in one test.

---

## Chapter Summary

- `test.step(title, body)` labels a phase of a test. It appears in HTML reports and the trace viewer with its own name, status, and timing.
- Always `await` both the step call and the body's async operations.
- Steps can return values — use this when one step produces data the next step needs.
- When a step fails, subsequent steps are skipped. The report shows exactly which phase broke.
- Use `{ box: true }` to hide step internals for utility steps (login, navigation).
- Nest steps at most one level deep. Two levels is occasionally useful; three levels is too much.
- Use steps in page objects to make traces readable at the method level, not just the action level.
- Steps are for sequential, interdependent workflow phases. Independent outcomes belong in separate tests.
- The trace viewer shows steps as collapsible timeline sections with browser state at each step.
