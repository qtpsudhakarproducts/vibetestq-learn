# Chapter 309 — Parameterized Tests

This chapter covers how Playwright implements parameterised testing using
standard JavaScript `for...of` loops. Interviewers ask about parameterisation
to test DRY thinking and data-driven design: a candidate who parameterises
correctly writes test logic once and separates data from code, making suites
that scale without copy-paste.

---

## Q309.1 — How does Playwright implement parameterised tests?

Playwright does not have a dedicated `test.each()` function. Instead, it uses
standard JavaScript: a `for...of` loop over a data array, calling `test()`
for each item. Each iteration generates one fully independent test — with its
own title, its own worker, its own pass/fail result.

```typescript
const cases = [
  { description: 'empty username shows Required', username: '', password: 'admin123' },
  { description: 'empty password shows Required', username: 'Admin', password: '' },
  { description: 'wrong password shows Invalid credentials', username: 'Admin', password: 'wrong' },
];

test.describe('Login Validation', () => {
  for (const tc of cases) {
    test(`${tc.description} @regression`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectError();
    });
  }
});
```

This is deliberate design. Using plain JavaScript gives you full language
power to construct titles, compose data, and apply conditions — without
learning a framework-specific API.

---

## Q309.2 — What problem does parameterisation solve?

When the same test structure repeats with different inputs, copy-paste creates
maintenance debt. A change to the test logic — a new method name, a changed
assertion — must be applied in every copy. Miss one and a test silently
diverges.

```typescript
// ❌ Before — same structure, copy-pasted five times
test('empty username shows Required @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('', 'admin123');
  await loginPage.expectRequiredError('Username');
});

test('empty password shows Required @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', '');
  await loginPage.expectRequiredError('Password');
});
// ... 3 more copies

// ✅ After — structure written once, data drives repetition
for (const tc of requiredFieldCases) {
  test(`${tc.description} @regression`, async ({ loginPage }) => {
    await loginPage.goto();
    await loginPage.login(tc.username, tc.password);
    await loginPage.expectRequiredError(tc.field);
  });
}
```

When the `loginPage` API changes, you update one loop body. Adding a sixth
case is one more object in the array.

---

## Q309.3 — How do you design a well-structured data array?

Each item in the data array should be a self-contained description of one
scenario. It should include the description, all inputs, and the expected
outcome — everything the test body needs, with no external logic required.

```typescript
// ❌ Vague — you cannot tell what broke from the title alone
{ description: 'test 1', username: '', password: 'admin123' }

// ✅ Self-explanatory — reads as a proper test title
{
  description: 'empty username shows Required validation',
  username: '',
  password: 'admin123',
  expectedField: 'Username',
}
```

```typescript
// ❌ Test body must contain branching logic to decide what to check
const cases = [
  { username: '', password: 'admin123', type: 'required' },
  { username: 'Admin', password: 'wrong', type: 'invalid' },
];
// → test body needs an if/else on `type`

// ✅ Expected outcome is explicit in the data — test body stays clean
const cases = [
  {
    description: 'empty username shows Required',
    username: '',
    password: 'admin123',
    expectRequired: true,
    requiredField: 'Username',
  },
  {
    description: 'wrong password shows Invalid credentials',
    username: 'Admin',
    password: 'wrong',
    expectRequired: false,
    requiredField: null,
  },
];
```

The rule: if reading the data row tells you exactly what the test does and
what it expects — the structure is good.

---

## Q309.4 — How do tags work inside parameterised loops?

Tags work in parameterised tests the same way as in regular tests. You can
include the tag in the details object, or include it as a field in the data
row when different cases need different tags:

```typescript
const cases = [
  {
    description: 'valid login redirects to dashboard',
    tag: '@smoke',
    username: 'Admin',
    password: 'admin123',
  },
  {
    description: 'invalid password shows error',
    tag: '@regression',
    username: 'Admin',
    password: 'wrongpassword',
  },
];

for (const tc of cases) {
  test(
    tc.description,
    { tag: [tc.tag, '@auth'] }, // per-row tier tag + fixed module tag
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
    }
  );
}
```

`npx playwright test --grep @smoke` runs only the first case.
`npx playwright test --grep @auth` runs both.

---

## Q309.5 — How do you use for...of with describe to run multiple tests per data item?

When each data item needs more than one test, nest the loop inside a `describe`
call per item. This creates a named group for each data item in the report:

```typescript
const employees = [
  { name: 'Linda Anderson', id: 'EMP001', department: 'Engineering' },
  { name: 'Ravi Kumar',     id: 'EMP042', department: 'HR' },
  { name: 'Priya Sharma',   id: 'EMP099', department: 'Finance' },
];

for (const emp of employees) {
  test.describe(`Employee: ${emp.name}`, () => {

    test('appears in search results @regression', async ({ employeeListPage }) => {
      await employeeListPage.goto();
      await employeeListPage.searchByName(emp.name);
      await expect(employeeListPage.getResultRow(emp.name)).toBeVisible();
    });

    test('profile page loads correctly @regression', async ({ employeeProfilePage }) => {
      await employeeProfilePage.openById(emp.id);
      await expect(employeeProfilePage.getHeader()).toContainText(emp.name);
    });

    test('department is displayed correctly @regression', async ({ employeeProfilePage }) => {
      await employeeProfilePage.openById(emp.id);
      await expect(employeeProfilePage.getDepartment()).toHaveText(emp.department);
    });

  });
}
```

Report output:
```
Employee: Linda Anderson
  ✅ appears in search results
  ✅ profile page loads correctly
  ✅ department is displayed correctly

Employee: Ravi Kumar
  ✅ appears in search results
  ✅ profile page loads correctly
  ❌ department is displayed correctly   ← precise failure: which employee, which check
```

Without parameterisation, nine separate tests with less obvious grouping.
With parameterisation, the failure pinpoints exactly which employee and which
assertion failed.

---

## Q309.6 — How do you load test data from external files?

**From a JSON file** — best for developer-maintained data:

```typescript
// data/employees.json
[
  { "name": "Linda Anderson", "id": "EMP001", "department": "Engineering" },
  { "name": "Ravi Kumar",     "id": "EMP042", "department": "HR" }
]

// tests/pim/employee-list.spec.ts
import employees from '../../data/employees.json';
// TypeScript type-checks the JSON structure if resolveJsonModule: true in tsconfig.json

test.describe('Employee List', () => {
  for (const emp of employees) {
    test(`${emp.name} appears in search results @regression`, async ({ employeeListPage }) => {
      await employeeListPage.goto();
      await employeeListPage.searchByName(emp.name);
      await expect(employeeListPage.getResultRow(emp.name)).toBeVisible();
    });
  }
});
```

**From a CSV file** — best for non-developer-maintained data (BAs, PMs,
QA leads who manage test data in spreadsheets):

```bash
npm install csv-parse
```

```csv
// data/leave-types.csv
type,maxDays,carryForward
Annual,20,true
Sick,14,false
Casual,10,false
```

```typescript
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const leaveTypes = parse(
  fs.readFileSync(path.join(__dirname, '../../data/leave-types.csv'), 'utf-8'),
  { columns: true, skip_empty_lines: true, cast: true }
);

test.describe('Leave Types', () => {
  for (const lt of leaveTypes) {
    test(`${lt.type} leave has correct configuration @regression`, async ({ adminPage }) => {
      await adminPage.openLeaveTypes();
      await expect(adminPage.getMaxDays(lt.type)).toHaveText(String(lt.maxDays));
      await expect(adminPage.getCarryForward(lt.type)).toHaveText(lt.carryForward ? 'Yes' : 'No');
    });
  }
});
```

When the max days for Annual leave changes from 20 to 25, update the CSV.
The test automatically picks up the change — no test file modification required.

---

## Q309.7 — How are Playwright projects a form of parameterisation?

Projects in `playwright.config.ts` run the same tests with different
configurations — a higher-level form of parameterisation:

```typescript
export default defineConfig({
  projects: [
    {
      name: 'admin-role',
      use: {
        storageState: '.auth/admin.json',
        baseURL: 'https://demo.orangehrmlive.com',
      },
    },
    {
      name: 'employee-role',
      use: {
        storageState: '.auth/employee.json',
        baseURL: 'https://demo.orangehrmlive.com',
      },
    },
  ],
});
```

The same tests run twice — once as admin, once as employee. Different auth
state, same test code. This is role-based parameterisation at the
configuration level — no changes to test files, no loops.

```bash
npx playwright test --project=admin-role    # run as admin
npx playwright test --project=employee-role # run as employee
npx playwright test                          # run both
```

---

## Q309.8 — How do you parameterise by viewport using test.use() inside describe?

`test.use()` inside a `describe` block scopes browser settings to that group.
Combining it with a loop produces viewport-parameterised tests:

```typescript
const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet',  width: 768,  height: 1024 },
  { name: 'Mobile',  width: 390,  height: 844 },
];

for (const vp of viewports) {
  test.describe(`Login Page — ${vp.name}`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('login form is fully visible @regression', async ({ page }) => {
      await page.goto('/login');
      await expect(page.getByLabel('Username')).toBeVisible();
      await expect(page.getByLabel('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('login completes successfully @smoke', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
      await loginPage.expectDashboard();
    });
  });
}
```

Report:
```
Login Page — Desktop
  ✅ login form is fully visible
  ✅ login completes successfully

Login Page — Mobile
  ✅ login form is fully visible
  ❌ login completes successfully   ← mobile-specific failure
```

---

## Q309.9 — When should you use parameterisation and when should you not?

**Use parameterisation when:**
- The test logic is identical across cases — only inputs and expected outputs differ
- You have four or more cases with the same structure
- The data changes independently of the test logic (managed externally via JSON/CSV)

```typescript
// ✅ Same structure, pure data variation — parameterise
const validationCases = [
  { input: '',        error: 'Required' },
  { input: 'a',      error: 'Too short' },
  { input: 'a'.repeat(256), error: 'Too long' },
  { input: '<script>', error: 'Invalid characters' },
];
```

**Do not use parameterisation when:**
- The test logic diverges significantly per case — the body needs complex if/else
- You have only two or three cases — the loop overhead adds more code than it saves
- The cases are not independent — if case 3 depends on case 2 having run first,
  use `describe.serial` instead

```typescript
// ❌ Logic diverges per case — separate tests are cleaner
const cases = [
  { type: 'empty',   action: 'skip form',   expect: 'Required message' },
  { type: 'invalid', action: 'submit form', expect: 'Error toast' },
  { type: 'valid',   action: 'submit form', expect: 'Redirect to dashboard' },
];
// → test body needs 3 different code paths — not a true parameterisation use case
```

---

## Q309.10 — How do you handle cases where some data rows need test.skip or test.fail?

Include the modifier as a field in the data row, and apply it inside the test body:

```typescript
const cases = [
  {
    description: 'Annual leave applies successfully',
    leaveType: 'Annual',
    shouldSkip: false,
    skipReason: '',
  },
  {
    description: 'Maternity leave applies successfully',
    leaveType: 'Maternity',
    shouldSkip: true,
    skipReason: 'Maternity leave not enabled in test environment',
  },
];

for (const tc of cases) {
  test(`${tc.description} @regression`, async ({ leavePage }) => {
    test.skip(tc.shouldSkip, tc.skipReason);

    await leavePage.goto();
    await leavePage.selectLeaveType(tc.leaveType);
    await leavePage.setDates('2026-06-01', '2026-06-03');
    await leavePage.clickApply();
    await leavePage.expectSuccess();
  });
}
```

This keeps all cases in one array — the report shows which are skipped and
why — without splitting the dataset across multiple files.

---

## Q309.11 — How do you write test titles in parameterised tests for maximum clarity?

The test title is what appears in the report when a test fails. It must tell
you which scenario broke — without opening the file.

```typescript
// ❌ Opaque — 'Test 3 failed' tells you nothing
for (let i = 0; i < cases.length; i++) {
  test(`test ${i}`, async ({ page }) => { ... });
}

// ❌ Too terse — 'empty / admin123' needs context to interpret
for (const tc of cases) {
  test(`${tc.username} / ${tc.password}`, async ({ page }) => { ... });
}

// ✅ Self-explanatory — reads as a sentence about the test's intent
for (const tc of cases) {
  test(`${tc.description} @regression`, async ({ loginPage }) => { ... });
}
// → 'empty username shows Required validation @regression'
```

The title should read as a sentence: subject (what input), verb (what happens),
object (what is expected). Write titles as if you are writing a specification
— someone reading the failure report should understand the failed scenario
without opening the spec file.

---

## Q309.12 — What is the difference between Playwright parameterisation and Jest's test.each?

Jest's `test.each` is a dedicated API with its own template string syntax:

```typescript
// Jest — framework-specific API
test.each([
  ['empty username', '', 'admin123', 'Required'],
  ['wrong password', 'Admin', 'wrong', 'Invalid credentials'],
])('%s shows error', (desc, username, password, error) => {
  // ...
});
```

Playwright uses plain JavaScript `for...of`:

```typescript
// Playwright — standard JavaScript
for (const tc of cases) {
  test(tc.description, async ({ page }) => {
    // ...
  });
}
```

The Playwright approach is more flexible and more readable for complex data
shapes. The Jest approach is more concise for simple tuples. In Playwright,
you have the full language available — destructuring, computed properties,
conditional titles, data transformation — without learning a template DSL.

If you use `test.each` from Jest's API inside a Playwright project (via
vitest or jest integration), it works, but it is not idiomatic. The canonical
Playwright way is `for...of`.

---

## Q309.13 — How do you group parameterised tests to avoid cluttering the report?

When many parameterised tests exist in one file, group them in `describe`
blocks by behaviour or by data category:

```typescript
const requiredFieldCases = [
  { description: 'empty username shows Required', username: '', password: 'x', field: 'Username' },
  { description: 'empty password shows Required', username: 'Admin', password: '', field: 'Password' },
];

const invalidCredentialsCases = [
  { description: 'wrong password shows Invalid credentials', username: 'Admin', password: 'wrong' },
  { description: 'unknown user shows Invalid credentials',   username: 'ghost', password: 'x' },
];

test.describe('Login — Required Field Validation', () => {
  for (const tc of requiredFieldCases) {
    test(`${tc.description} @regression`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectRequiredError(tc.field);
    });
  }
});

test.describe('Login — Invalid Credentials', () => {
  for (const tc of invalidCredentialsCases) {
    test(`${tc.description} @regression`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectInvalidCredentialsError();
    });
  }
});
```

Report output is cleanly segmented. Each describe group shows as a collapsible
section — two groups of two instead of four flat tests with no context about
what they share.

---

## Q309.14 — Write a complete real-world parameterised test for leave validation.

```typescript
import { test, expect } from '../../fixtures/baseFixture';

const leaveValidationCases = [
  {
    description: 'past date is rejected',
    fromDate: '2020-01-01',
    toDate:   '2020-01-03',
    leaveType: 'Annual',
    expectedError: 'Date should be after today',
    tag: '@regression',
  },
  {
    description: 'end date before start date is rejected',
    fromDate: '2026-05-10',
    toDate:   '2026-05-05',
    leaveType: 'Annual',
    expectedError: 'To date should be after from date',
    tag: '@regression',
  },
  {
    description: 'overlapping leave request is rejected',
    fromDate: '2026-04-01',
    toDate:   '2026-04-03',
    leaveType: 'Annual',
    expectedError: 'Overlapping leave request found',
    tag: '@regression',
  },
  {
    description: 'leave type not selected shows Required',
    fromDate: '2026-06-01',
    toDate:   '2026-06-02',
    leaveType: '',
    expectedError: 'Required',
    tag: '@regression',
  },
];

test.describe('Apply Leave — Validation', () => {

  test.beforeEach(async ({ leavePage }) => {
    await leavePage.goto();
  });

  for (const tc of leaveValidationCases) {
    test(
      tc.description,
      { tag: [tc.tag, '@leave'] },
      async ({ leavePage }) => {
        if (tc.leaveType) {
          await leavePage.selectLeaveType(tc.leaveType);
        }
        await leavePage.setFromDate(tc.fromDate);
        await leavePage.setToDate(tc.toDate);
        await leavePage.clickApply();
        await leavePage.expectValidationError(tc.expectedError);
      }
    );
  }

});
```

The `beforeEach` handles navigation once — not repeated in each data row.
The test body is 6 lines. Adding a fifth validation case is one more object
in the array. Tags are per-row so different tiers can coexist in the same array.

---

## Q309.15 — How do parameterised tests run in parallel?

Each test generated by a `for...of` loop is an independent test. Playwright
schedules them across workers the same way as any other test — they run in
parallel by default (up to the configured worker count).

This means parameterised tests get the full benefit of parallel execution.
Five data rows with `--workers=5` can run all five cases simultaneously.

However: if your parameterised tests share state (write to the same database
record, use the same test user), they will interfere. The solution is either:
- Worker isolation — each worker uses its own test data (via `workerIndex`)
- Sequential execution — wrap in `describe.serial` if order and shared state are unavoidable

```typescript
// If cases share state — force sequential execution
test.describe.serial('Leave module state-dependent cases', () => {
  for (const tc of cases) {
    test(tc.description, async ({ page }) => { ... });
  }
});
```

Generally, parameterised test cases should be designed to be independent.
If they cannot be, reconsider whether they should be parameterised at all.

---

## Q309.16 — How do you TypeScript-type a data array for parameterised tests?

Define an interface for the data row and type the array. This catches typos
in the data at compile time:

```typescript
interface LoginCase {
  description: string;
  username:    string;
  password:    string;
  expectField: string | null;
  expectError: 'required' | 'invalid';
  tag:         string;
}

const loginCases: LoginCase[] = [
  {
    description: 'empty username shows Required',
    username:    '',
    password:    'admin123',
    expectField: 'Username',
    expectError: 'required',
    tag:         '@regression',
  },
  {
    description: 'wrong password shows Invalid credentials',
    username:    'Admin',
    password:    'wrong',
    expectField: null,
    expectError: 'invalid',
    tag:         '@regression',
  },
];

for (const tc of loginCases) {
  test(tc.description, { tag: [tc.tag, '@auth'] }, async ({ loginPage }) => {
    await loginPage.login(tc.username, tc.password);
    if (tc.expectError === 'required') {
      await loginPage.expectRequiredError(tc.expectField!);
    } else {
      await loginPage.expectInvalidCredentialsError();
    }
  });
}
```

The `LoginCase` interface documents the data structure. TypeScript reports
an error if a data row has the wrong type for `expectError` or is missing
a required field — at write time, not at runtime.

---

## Q309.17 — How did parameterisation reduce maintenance burden in your project?

In our OrangeHRM project, leave type configuration was tested manually.
When the product team changed the carry-forward rules for three leave types,
we had to update three separate test files. Each change required a pull request
review, CI run, and merge — three times.

After parameterising to a JSON data file:

```json
[
  { "type": "Annual",    "maxDays": 20, "carryForward": true  },
  { "type": "Sick",      "maxDays": 14, "carryForward": false },
  { "type": "Casual",    "maxDays": 10, "carryForward": false },
  { "type": "Maternity", "maxDays": 90, "carryForward": false }
]
```

When the carry-forward rule for Annual leave changed, we updated one value
in one JSON file. One PR, one review, one CI run. The same test code covered
the new expected value automatically.

For the login validation tests specifically, we had started with 12 separate
test functions — all structurally identical. After parameterisation, the
same coverage was achieved with a 12-item array and a 6-line loop body.
When the `loginPage` API was refactored three weeks later, we updated two
method calls instead of 12.

---

## Q309.18 — What is the most common mistake with parameterised tests in team code?

The most common mistake is **building branching logic into the loop body**
instead of making the data rows self-contained.

```typescript
// ❌ Loop body has to decode the 'type' field — messy and hard to read
for (const tc of cases) {
  test(tc.description, async ({ loginPage }) => {
    await loginPage.login(tc.username, tc.password);
    if (tc.type === 'required') {
      await expect(page.getByText('Required')).toBeVisible();
    } else if (tc.type === 'invalid') {
      await expect(page.getByText('Invalid credentials')).toBeVisible();
    } else if (tc.type === 'success') {
      await expect(page).toHaveURL(/dashboard/);
    }
    // Adding a new case type requires modifying the test body
  });
}

// ✅ Each data row is a complete specification — loop body is clean
for (const tc of cases) {
  test(tc.description, async ({ loginPage }) => {
    await loginPage.login(tc.username, tc.password);
    await expect(loginPage.getErrorLocator(tc.errorType)).toHaveText(tc.expectedText);
    // Adding a new case type is a new data row — no change to test body
  });
}
```

When the loop body branches significantly on data row values, that is a signal
the cases are not truly parallel — they should be separate tests or separate
loops with separate data arrays for each behaviour.

---

## Chapter Summary

- Playwright parameterisation uses `for...of` over a data array — one `test()` per iteration.
- Each iteration produces an independent test with its own title, worker, and pass/fail result.
- Design data rows to be self-contained: description, inputs, and expected outcomes — all in the row.
- Tags work inside parameterised loops. Include the tag in the data row when different cases need different tiers.
- Use `for...of` + `describe` when each data item needs multiple tests — gives named groups in the report.
- Load from JSON for developer-maintained data; CSV for spreadsheet-managed data.
- Projects are a config-level form of parameterisation — same tests, different environments or roles.
- `test.use()` inside `for...of describe` blocks parameterises by viewport, locale, or other settings.
- Use parameterisation when logic is identical and data varies. Separate tests when logic diverges per case.
- Type the data array with an interface — TypeScript catches typos in data rows at compile time.
- The most common mistake: branching on data row type in the loop body. Fix it by putting expected outcomes in the data.
