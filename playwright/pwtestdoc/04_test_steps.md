# 04 — Test Steps

## The Scenario

You are writing an end-to-end test for the full employee creation workflow in OrangeHRM. The workflow covers navigating to the Add Employee form, filling in basic information, saving, then verifying the employee appears in the employee list. Here is what the test looks like:

```typescript
test('add employee end-to-end @e2e', async ({ page }) => {
  await page.goto('/web/index.php/auth/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
  await page.goto('/web/index.php/pim/addEmployee');
  await expect(page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
  await page.getByPlaceholder('First Name').fill('Priya');
  await page.getByPlaceholder('Last Name').fill('Sharma');
  await page.getByLabel('Employee Id').fill('EMP0099');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.getByText('Successfully Saved')).toBeVisible();
  const employeeId = await page.getByLabel('Employee Id').inputValue();
  await page.goto('/web/index.php/pim/viewEmployeeList');
  await page.getByPlaceholder('Type for hints...').fill('Priya');
  await page.getByRole('button', { name: 'Search' }).click();
  await expect(page.getByText('Priya Sharma')).toBeVisible();
  await expect(page.getByText(employeeId)).toBeVisible();
});
```

The test works. But when it fails, the error report looks like this:

```
Error: locator.fill: Error: strict mode violation: getByLabel('Employee Id') 
resolved to 2 elements
  at tests/pim/add-employee.spec.ts:11:46
```

Line 11. You open the file, count to line 11, and try to figure out what phase of the workflow that line belongs to. Was it during the fill phase? The save phase? The verification phase? You have to mentally parse 20 lines to understand what part of the workflow broke.

Now multiply this by a suite of 40 end-to-end tests. Every failure requires this same archaeology.

---

## What test.step() Does

`test.step()` breaks a test into named, labelled phases. Each phase appears as a distinct entry in the HTML report and trace viewer — with its own name, its own pass/fail status, and its own timing.

When a test fails, instead of seeing "line 11", you see:

```
Add employee end-to-end
  ✅ Log in as Admin                          (1.2s)
  ✅ Navigate to Add Employee form            (0.4s)
  ✅ Fill employee details                    (0.8s)
  ❌ Save and verify success message          (5.0s)   ← exactly where it failed
  ⏭ Verify employee appears in list          (skipped)
```

You know immediately: the failure is in the save step. The navigation, fill, and login all worked. The list verification never ran. The error is in the save operation — probably the form, not the list.

---

## Basic test.step()

```typescript
test('add employee end-to-end @e2e', async ({ page }) => {

  await test.step('Log in as Admin', async () => {
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);
  });

  await test.step('Navigate to Add Employee form', async () => {
    await page.goto('/web/index.php/pim/addEmployee');
    await expect(page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
  });

  await test.step('Fill employee details', async () => {
    await page.getByPlaceholder('First Name').fill('Priya');
    await page.getByPlaceholder('Last Name').fill('Sharma');
    await page.getByLabel('Employee Id').fill('EMP0099');
  });

  await test.step('Save and verify success message', async () => {
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();
  });

  await test.step('Verify employee appears in list', async () => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await page.getByPlaceholder('Type for hints...').fill('Priya');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Priya Sharma')).toBeVisible();
  });

});
```

The code does exactly the same thing as before. The only difference is the labelling. But the failure report is now dramatically more useful.

---

## Signature

```typescript
test.step(title: string, body: () => Promise<T>): Promise<T>
test.step(title: string, body: () => Promise<T>, options?: StepOptions): Promise<T>
```

`test.step` is async and returns a Promise. You must `await` it — just like any other Playwright operation. If you forget the `await`, the step starts but the test continues before it finishes.

```typescript
// ❌ Missing await — test continues before the step completes
test.step('Fill form', async () => {
  await page.getByPlaceholder('First Name').fill('Priya');
});

// ✅ Correct
await test.step('Fill form', async () => {
  await page.getByPlaceholder('First Name').fill('Priya');
});
```

---

## Steps Can Return Values

A step can return a value that subsequent steps use. This is useful when one step produces data that the next step needs.

```typescript
test('create employee and verify @e2e', async ({ page }) => {

  const employeeId = await test.step('Create employee and capture ID', async () => {
    await page.goto('/web/index.php/pim/addEmployee');
    await page.getByPlaceholder('First Name').fill('Ravi');
    await page.getByPlaceholder('Last Name').fill('Kumar');
    await page.getByRole('button', { name: 'Save' }).click();
    await expect(page.getByText('Successfully Saved')).toBeVisible();

    // Return the generated employee ID for use in subsequent steps
    return await page.getByLabel('Employee Id').inputValue();
  });

  await test.step(`Search for employee ID: ${employeeId}`, async () => {
    await page.goto('/web/index.php/pim/viewEmployeeList');
    await page.getByLabel('Employee Id').fill(employeeId);
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page.getByText('Ravi Kumar')).toBeVisible();
  });

  await test.step('Delete employee and verify removal', async () => {
    await page.getByRole('checkbox').first().check();
    await page.getByRole('button', { name: 'Delete Selected' }).click();
    await page.getByRole('button', { name: 'Yes, Delete' }).click();
    await expect(page.getByText('Ravi Kumar')).not.toBeVisible();
  });

});
```

The step title even includes the returned value — `Search for employee ID: EMP0099` — making the report self-documenting.

---

## Steps in the HTML Report and Trace Viewer

When a test fails, the HTML report shows the step breakdown with:
- Each step's name
- Pass ✅ / Fail ❌ status
- Time taken for each step
- The error message under the failing step

In the Playwright trace viewer (opened with `npx playwright show-trace`), steps appear as collapsible sections in the timeline. You can click on a step and see the exact browser state at that moment — the screenshot, the DOM, the network calls. This makes debugging end-to-end tests significantly faster.

---

## Nesting Steps

Steps can be nested inside other steps. Use this when a phase of the workflow has sub-phases that are worth tracking individually.

```typescript
test('full leave application workflow @e2e', async ({ page }) => {

  await test.step('Log in as employee', async () => {
    await page.goto('/login');
    await page.getByPlaceholder('Username').fill('john.smith');
    await page.getByPlaceholder('Password').fill('Pass@123');
    await page.getByRole('button', { name: 'Login' }).click();
    await page.waitForURL(/dashboard/);
  });

  await test.step('Apply for leave', async () => {

    await test.step('Navigate to Apply Leave form', async () => {
      await page.goto('/web/index.php/leave/applyLeave');
      await expect(page.getByRole('heading', { name: 'Apply Leave' })).toBeVisible();
    });

    await test.step('Fill leave details', async () => {
      await page.getByLabel('Leave Type').selectOption('Annual');
      await page.getByLabel('From Date').fill('2026-04-01');
      await page.getByLabel('To Date').fill('2026-04-03');
      await page.getByLabel('Comment').fill('Family vacation');
    });

    await test.step('Submit application', async () => {
      await page.getByRole('button', { name: 'Apply' }).click();
      await expect(page.getByText('Successfully Applied')).toBeVisible();
    });

  });

  await test.step('Verify leave appears in My Leave list', async () => {
    await page.goto('/web/index.php/leave/viewMyLeaveList');
    await expect(page.getByText('Annual')).toBeVisible();
    await expect(page.getByText('Pending Approval')).toBeVisible();
  });

});
```

Report output:
```
Full leave application workflow
  ✅ Log in as employee                        (1.3s)
  ✅ Apply for leave                           (3.2s)
       ✅ Navigate to Apply Leave form         (0.6s)
       ✅ Fill leave details                   (0.9s)
       ✅ Submit application                   (1.7s)
  ✅ Verify leave appears in My Leave list     (0.8s)
```

Keep nesting shallow — one level of nesting is usually enough. Deep nesting (3+ levels) makes the step hierarchy hard to read in the report.

---

## Steps in Page Objects

Steps are not just for spec files. They work inside page objects too, making trace output much more informative. When you call a page object method, the trace shows which method was called and what happened inside it.

```typescript
// pages/AddEmployeePage.ts
import { Page, expect } from '@playwright/test';
import { test } from '@playwright/test';

export class AddEmployeePage {
  constructor(private page: Page) {}

  async goto() {
    await test.step('AddEmployeePage: navigate to form', async () => {
      await this.page.goto('/web/index.php/pim/addEmployee');
      await expect(this.page.getByRole('heading', { name: 'Add Employee' })).toBeVisible();
    });
  }

  async fillBasicInfo(firstName: string, lastName: string, employeeId: string) {
    await test.step(`AddEmployeePage: fill basic info — ${firstName} ${lastName}`, async () => {
      await this.page.getByPlaceholder('First Name').fill(firstName);
      await this.page.getByPlaceholder('Last Name').fill(lastName);
      await this.page.getByLabel('Employee Id').fill(employeeId);
    });
  }

  async save() {
    await test.step('AddEmployeePage: click Save', async () => {
      await this.page.getByRole('button', { name: 'Save' }).click();
      await expect(this.page.getByText('Successfully Saved')).toBeVisible();
    });
  }
}
```

Now when a test calls `addEmployeePage.save()` and it fails, the trace shows:

```
AddEmployeePage: click Save
  → click on button 'Save'                   ← exactly where it failed
  → wait for text 'Successfully Saved'        ← never reached
```

Without steps in page objects, the trace just shows raw Playwright actions with no context about which page object method they came from.

---

## The box Option — Hiding Step Internals

By default, if a step fails, the report shows the step's internal actions in detail — every `click`, `fill`, and `expect` inside the step. Sometimes you want to hide these internals, treating the step as a black box that either passes or fails as a unit.

```typescript
await test.step('Login as Admin', async () => {
  await page.goto('/login');
  await page.getByPlaceholder('Username').fill('Admin');
  await page.getByPlaceholder('Password').fill('admin123');
  await page.getByRole('button', { name: 'Login' }).click();
  await page.waitForURL(/dashboard/);
}, { box: true });
// If this step fails, the report shows "Login as Admin — failed"
// Not the individual fill/click actions inside it
```

**When to use `box: true`:**
- The step is a utility operation (login, navigation) that you do not want cluttering the report
- The step's internal details are not relevant to the test being investigated
- The step is a reusable helper used across many tests — its internals are already tested elsewhere

**When not to use `box: true`:**
- The step contains the core logic of what the test is verifying
- You need to see which internal action failed to debug the issue

---

## Steps vs describe — What Is the Difference

Both steps and describes group test code under a name. They serve different purposes.

| | `test.describe` | `test.step` |
|---|---|---|
| **Purpose** | Groups multiple tests | Breaks one test into phases |
| **Scope** | Multiple `test()` calls | Inside one `test()` call |
| **Hooks** | Can have `beforeEach`, `beforeAll` | No hooks |
| **Parallel execution** | Can run in parallel | Always sequential within the test |
| **Report** | Groups tests in the report tree | Shows phases within one test |
| **When a phase fails** | Other tests still run | Subsequent steps do not run |

Use `describe` to organise tests that each verify one thing. Use `step` to document the phases of a single test that verifies a multi-step workflow.

---

## When to Use Steps

Steps add value in specific situations. They are not needed for every test.

**Use steps when:**

The test covers a multi-step workflow where knowing which step failed is the difference between a 2-minute debug and a 20-minute debug:

```typescript
// ✅ Steps add real diagnostic value here
test('full leave application and approval workflow @e2e', async ({ page }) => {
  await test.step('Employee applies for leave', ...);
  await test.step('Manager approves leave', ...);
  await test.step('Employee verifies approved status', ...);
  await test.step('Leave balance is updated', ...);
});
```

The test is long enough that the line number in the error is not enough context:

```typescript
// ✅ 25+ lines — steps turn line numbers into meaningful phase names
test('onboarding wizard completes successfully @e2e', async ({ page }) => {
  await test.step('Step 1: Personal details', ...);
  await test.step('Step 2: Employment details', ...);
  await test.step('Step 3: User account setup', ...);
  await test.step('Step 4: Confirm and submit', ...);
  await test.step('Verify employee record created', ...);
});
```

**Do not use steps when:**

The test is simple and already maps to Arrange/Act/Assert clearly:

```typescript
// ❌ Steps add noise here — the test is already 5 lines and self-explanatory
test('invalid password shows error @regression', async ({ loginPage }) => {
  await test.step('Go to login page', async () => {
    await loginPage.goto();
  });
  await test.step('Enter invalid credentials', async () => {
    await loginPage.login('Admin', 'wrong');
  });
  await test.step('Verify error message', async () => {
    await loginPage.expectInvalidCredentialsError();
  });
});

// ✅ This is cleaner without steps
test('invalid password shows error @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', 'wrong');
  await loginPage.expectInvalidCredentialsError();
});
```

The rule: add steps when the test is complex enough that the step names genuinely help you debug. Do not add steps for the sake of it.

---

## A Practical Step Pattern for OrangeHRM E2E Tests

Here is a complete realistic example showing steps used appropriately for a full workflow test:

```typescript
// tests/e2e/employee-onboarding.spec.ts
import { test, expect } from '../../fixtures/baseFixture';

test.describe('Employee Onboarding E2E', () => {

  test(
    'new employee is created, assigned, and can log in @e2e',
    { tag: '@e2e', timeout: 120_000 },
    async ({ page, adminPage, employeeListPage }) => {

      let newEmployeeId: string;

      await test.step('Admin creates employee record', async () => {
        await adminPage.goto('/web/index.php/pim/addEmployee');
        await page.getByPlaceholder('First Name').fill('Nisha');
        await page.getByPlaceholder('Last Name').fill('Patel');
        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page.getByText('Successfully Saved')).toBeVisible();
        newEmployeeId = await page.getByLabel('Employee Id').inputValue();
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

      await test.step(`Employee ${newEmployeeId} appears in employee list`, async () => {
        await employeeListPage.goto();
        await employeeListPage.searchById(newEmployeeId);
        await expect(page.getByText('Nisha Patel')).toBeVisible();
      });

      await test.step('Employee can log in with created credentials', async () => {
        await page.goto('/web/index.php/auth/logout');
        await page.goto('/web/index.php/auth/login');
        await page.getByPlaceholder('Username').fill('nisha.patel');
        await page.getByPlaceholder('Password').fill('Employee@123');
        await page.getByRole('button', { name: 'Login' }).click();
        await expect(page).toHaveURL(/dashboard/);
        await expect(page.getByText('Nisha Patel')).toBeVisible();
      });

    }
  );

});
```

---

## Key Points

- `test.step()` labels phases of a test — they appear in HTML reports and trace viewer with individual pass/fail status and timing
- Always `await` `test.step()` — it is an async operation
- Steps can return values — use this when one step produces data the next step needs
- Steps can be nested — keep nesting to one level; deep nesting clutters the report
- The `box: true` option hides internal step details — use for utility steps (login, navigation) not for the core test logic
- Steps work inside page objects — wrap page object methods in steps for richer trace output
- Steps vs describe: `describe` groups multiple tests; `step` phases one test; they are not interchangeable
- Use steps for multi-step workflows where the phase name is more useful than a line number in debugging
- Do not use steps for simple tests — they add noise without adding value
- The trace viewer (`npx playwright show-trace`) shows steps as collapsible timeline sections with browser state at each point
