# 08 — Parameterised Tests

## The Scenario

You are writing tests for the OrangeHRM login page validation. The login form has two fields — username and password. Both are required. When submitted empty, each shows a "Required" message. When submitted with invalid credentials, the form shows "Invalid credentials".

You sit down and write the tests:

```typescript
test('empty username shows Required validation @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('', 'admin123');
  await loginPage.expectRequiredError('Username');
});

test('empty password shows Required validation @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', '');
  await loginPage.expectRequiredError('Password');
});

test('both fields empty shows Required validation @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('', '');
  await loginPage.expectRequiredError('Username');
});

test('wrong password shows Invalid credentials @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('Admin', 'wrongpassword');
  await loginPage.expectInvalidCredentialsError();
});

test('unknown username shows Invalid credentials @regression', async ({ loginPage }) => {
  await loginPage.goto();
  await loginPage.login('nobody', 'admin123');
  await loginPage.expectInvalidCredentialsError();
});
```

Five tests. The structure is identical across all five — `goto`, `login`, `expect`. Only the inputs and the expected outcome change. You have written the same test five times with different data.

Now imagine the login page gets a new validation rule — the username must be at least 3 characters. You need to add tests for that. The same structure again. Copy, paste, change data. And when the `loginPage` API changes, you update it in 10 places instead of one.

Parameterisation solves this. Instead of writing the same test structure N times, you write it once and provide the data as an array.

---

## What Parameterisation Is

Parameterised tests run the same test logic with multiple different inputs. You define the test structure once and provide a dataset. Playwright generates one test per data row — each with its own title, its own isolated execution, and its own pass/fail result in the report.

Playwright does not have a dedicated `test.each()` function like some frameworks. Instead, it uses standard JavaScript — a `for...of` loop over a data array, calling `test()` for each item. This is deliberate: it is more readable, more flexible, and gives you full JavaScript to construct titles and data.

---

## Basic Parameterisation with for...of

```typescript
import { test, expect } from '../../fixtures/baseFixture';

const loginValidationCases = [
  {
    description: 'empty username shows Required validation',
    username: '',
    password: 'admin123',
    expectedError: 'required',
    errorField: 'Username',
  },
  {
    description: 'empty password shows Required validation',
    username: 'Admin',
    password: '',
    expectedError: 'required',
    errorField: 'Password',
  },
  {
    description: 'both fields empty shows Required on username',
    username: '',
    password: '',
    expectedError: 'required',
    errorField: 'Username',
  },
  {
    description: 'wrong password shows Invalid credentials',
    username: 'Admin',
    password: 'wrongpassword',
    expectedError: 'invalid',
    errorField: null,
  },
  {
    description: 'unknown username shows Invalid credentials',
    username: 'nobody',
    password: 'admin123',
    expectedError: 'invalid',
    errorField: null,
  },
];

test.describe('Login Validation', () => {

  for (const tc of loginValidationCases) {
    test(`${tc.description} @regression`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);

      if (tc.expectedError === 'required') {
        await loginPage.expectRequiredError(tc.errorField!);
      } else {
        await loginPage.expectInvalidCredentialsError();
      }
    });
  }

});
```

Playwright generates 5 tests — each with the `description` as its title. In the HTML report:

```
Login Validation
  ✅ empty username shows Required validation
  ✅ empty password shows Required validation
  ✅ both fields empty shows Required on username
  ✅ wrong password shows Invalid credentials
  ✅ unknown username shows Invalid credentials
```

If the `loginPage` API changes, you update it in one place — the loop body. The data stays separate from the test logic. Adding a sixth case is one more row in the array.

---

## The Data Array — Designing It Well

The quality of your parameterised tests depends heavily on how you structure the data array. Each item should be a self-contained description of one scenario.

### Make descriptions specific and complete

```typescript
// ❌ Vague description — you cannot tell what broke from the title alone
{ description: 'test 1', username: '', password: 'admin123' }

// ✅ Self-explanatory — reads like a proper test title
{ description: 'empty username shows Required validation', username: '', password: 'admin123' }
```

### Include everything the test needs in the data row

```typescript
// ❌ The test has to contain logic to decide what to check — messy
const cases = [
  { username: '', password: 'admin123', type: 'required' },
  { username: 'Admin', password: 'wrong', type: 'invalid' },
];

// ✅ The expected outcome is explicit in the data — the test body is clean
const cases = [
  {
    description: 'empty username shows Required validation',
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

### Group related cases or keep them flat — your choice

For a small, coherent set of cases (all about login validation), a flat array is fine. For larger datasets spanning multiple behaviours, consider grouping by describe:

```typescript
const requiredFieldCases = [
  { description: 'empty username shows Required', username: '', password: 'x', field: 'Username' },
  { description: 'empty password shows Required', username: 'Admin', password: '', field: 'Password' },
];

const invalidCredentialsCases = [
  { description: 'wrong password shows Invalid credentials', username: 'Admin', password: 'wrong' },
  { description: 'unknown user shows Invalid credentials', username: 'ghost', password: 'admin123' },
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

---

## Parameterising with Tags

Tags work inside parameterised tests just like regular tests:

```typescript
const smokeCases = [
  { description: 'valid credentials redirect to dashboard', username: 'Admin', password: 'admin123' },
];

const regressionCases = [
  { description: 'empty username shows Required', username: '', password: 'admin123' },
  { description: 'empty password shows Required', username: 'Admin', password: '' },
  { description: 'wrong password shows Invalid credentials', username: 'Admin', password: 'wrong' },
];

for (const tc of smokeCases) {
  test(
    tc.description,
    { tag: ['@smoke', '@auth'] },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectDashboard();
    }
  );
}

for (const tc of regressionCases) {
  test(
    tc.description,
    { tag: ['@regression', '@auth'] },
    async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(tc.username, tc.password);
      await loginPage.expectValidationError();
    }
  );
}
```

You can also include the tag in the data row itself if different cases in the same loop need different tags:

```typescript
const cases = [
  { description: 'valid login redirects to dashboard', tag: '@smoke', username: 'Admin', password: 'admin123' },
  { description: 'invalid password shows error', tag: '@regression', username: 'Admin', password: 'wrong' },
];

for (const tc of cases) {
  test(
    tc.description,
    { tag: [tc.tag, '@auth'] },
    async ({ loginPage }) => { ... }
  );
}
```

---

## Multiple Tests per Data Row — for...of with describe

Sometimes each data item needs more than one test. For example, you want to test each employee in the system with multiple assertions — search finds them, their profile loads, their details are correct.

Wrap the loop in a `describe` call for each data item:

```typescript
const employees = [
  { name: 'Linda Anderson', id: 'EMP001', department: 'Engineering', jobTitle: 'Software Engineer' },
  { name: 'Ravi Kumar',     id: 'EMP042', department: 'HR',          jobTitle: 'HR Manager' },
  { name: 'Priya Sharma',   id: 'EMP099', department: 'Finance',     jobTitle: 'Finance Analyst' },
];

for (const employee of employees) {
  test.describe(`Employee: ${employee.name}`, () => {

    test('appears in search results @regression', async ({ employeeListPage }) => {
      await employeeListPage.goto();
      await employeeListPage.searchByName(employee.name);
      await expect(employeeListPage.getResultRow(employee.name)).toBeVisible();
    });

    test('profile page loads correctly @regression', async ({ employeeListPage, employeeProfilePage }) => {
      await employeeListPage.goto();
      await employeeListPage.openEmployee(employee.name);
      await expect(employeeProfilePage.getHeader()).toContainText(employee.name);
    });

    test('department and job title are correct @regression', async ({ employeeProfilePage }) => {
      await employeeProfilePage.openById(employee.id);
      await expect(employeeProfilePage.getDepartment()).toHaveText(employee.department);
      await expect(employeeProfilePage.getJobTitle()).toHaveText(employee.jobTitle);
    });

  });
}
```

Report output:
```
Employee: Linda Anderson
  ✅ appears in search results
  ✅ profile page loads correctly
  ✅ department and job title are correct

Employee: Ravi Kumar
  ✅ appears in search results
  ✅ profile page loads correctly
  ❌ department and job title are correct   ← one employee has wrong data

Employee: Priya Sharma
  ✅ appears in search results
  ✅ profile page loads correctly
  ✅ department and job title are correct
```

The failure is immediately specific: Ravi Kumar's department or job title is wrong. Without parameterisation you would have 9 separate tests with less obvious grouping.

---

## Loading Test Data from External Files

For large datasets, keeping test data in the spec file becomes unwieldy. Load it from JSON or CSV files instead.

### From a JSON file

```typescript
// data/employees.json
[
  { "name": "Linda Anderson", "id": "EMP001", "department": "Engineering" },
  { "name": "Ravi Kumar",     "id": "EMP042", "department": "HR" },
  { "name": "Priya Sharma",   "id": "EMP099", "department": "Finance" }
]
```

```typescript
// tests/pim/employee-list.spec.ts
import { test, expect } from '../../fixtures/baseFixture';
import employees from '../../data/employees.json';

test.describe('Employee List', () => {

  for (const employee of employees) {
    test(`${employee.name} appears in search results @regression`, async ({ employeeListPage }) => {
      await employeeListPage.goto();
      await employeeListPage.searchByName(employee.name);
      await expect(employeeListPage.getResultRow(employee.name)).toBeVisible();
    });
  }

});
```

TypeScript will type-check the JSON structure if you have `resolveJsonModule: true` in your `tsconfig.json`. Add it if it is not there:

```json
// tsconfig.json
{
  "compilerOptions": {
    "resolveJsonModule": true
  }
}
```

### From a CSV file

CSV is common for test data managed by non-developers — BAs, product managers, or QA leads who maintain test data in spreadsheets.

Install `csv-parse`:
```bash
npm install csv-parse
```

```csv
// data/leave-types.csv
type,maxDays,carryForward
Annual,20,true
Sick,14,false
Casual,10,false
Maternity,90,false
```

```typescript
import { test, expect } from '../../fixtures/baseFixture';
import { parse } from 'csv-parse/sync';
import * as fs from 'fs';
import * as path from 'path';

const csvContent = fs.readFileSync(
  path.join(__dirname, '../../data/leave-types.csv'),
  'utf-8'
);

const leaveTypes = parse(csvContent, {
  columns: true,           // first row is header
  skip_empty_lines: true,
  cast: true,              // auto-cast numbers and booleans
});

test.describe('Leave Types', () => {

  for (const leaveType of leaveTypes) {
    test(`${leaveType.type} leave type has correct configuration @regression`, async ({ adminPage }) => {
      await adminPage.openLeaveTypes();
      const row = adminPage.getLeaveTypeRow(leaveType.type);
      await expect(row.getMaxDays()).toHaveText(String(leaveType.maxDays));
      await expect(row.getCarryForward()).toHaveText(leaveType.carryForward ? 'Yes' : 'No');
    });
  }

});
```

The CSV is the single source of truth for leave type configuration. If the max days for Annual leave changes from 20 to 25, the CSV is updated and the test automatically picks it up — without touching the test file.

---

## Parameterisation via Projects

Projects in `playwright.config.ts` are another form of parameterisation — the same tests running against different environments or configurations.

```typescript
// playwright.config.ts
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

The same tests now run twice — once as admin, once as employee. Different role, different permissions, same test code. This is role-based parameterisation without any changes to the test files themselves.

From the CLI:
```bash
npx playwright test --project=admin-role    # run as admin
npx playwright test --project=employee-role # run as employee
npx playwright test                          # run both
```

---

## Parameterisation via test.use() and describe

For lighter-weight parameterisation within a file — running the same tests with different viewport or locale settings:

```typescript
const viewports = [
  { name: 'Desktop', width: 1280, height: 720 },
  { name: 'Tablet',  width: 768,  height: 1024 },
  { name: 'Mobile',  width: 390,  height: 844 },
];

for (const viewport of viewports) {
  test.describe(`Login Page — ${viewport.name}`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('login form is fully visible @regression', async ({ page }) => {
      await page.goto('/web/index.php/auth/login');
      await expect(page.getByPlaceholder('Username')).toBeVisible();
      await expect(page.getByPlaceholder('Password')).toBeVisible();
      await expect(page.getByRole('button', { name: 'Login' })).toBeVisible();
    });

    test('login completes successfully @regression', async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login('Admin', 'admin123');
      await loginPage.expectDashboard();
    });

  });
}
```

Report output:
```
Login Page — Desktop
  ✅ login form is fully visible
  ✅ login completes successfully

Login Page — Tablet
  ✅ login form is fully visible
  ✅ login completes successfully

Login Page — Mobile
  ✅ login form is fully visible
  ❌ login completes successfully   ← fails on mobile viewport
```

---

## When Parameterisation Helps and When It Does Not

Parameterisation is a tool. Like all tools, it helps in the right situation and hurts in the wrong one.

### When it helps

**The test logic is identical across cases — only inputs and expected outputs differ:**
```typescript
// ✅ Same structure, different data — perfect for parameterisation
const cases = [
  { input: '', expectedError: 'Required' },
  { input: 'a', expectedError: 'Too short' },
  { input: 'a'.repeat(256), expectedError: 'Too long' },
];
```

**You have many cases and the alternative is obvious copy-paste:**
If you are about to write the same test five times with only the data changing, parameterise.

**The data changes independently of the test logic:**
If product managers maintain a spreadsheet of test cases, loading from CSV means they can add cases without touching the test code.

### When it does not help

**The test logic is different for each case:**
```typescript
// ❌ The test body would need if/else for every case — better as separate tests
const cases = [
  { type: 'empty', action: 'skip', expectedError: 'Required' },
  { type: 'invalid', action: 'submit', expectedError: 'Invalid' },
  { type: 'valid', action: 'submit', expectRedirect: '/dashboard' },
];
```

When the test body has complex branching based on the data, it is harder to read than separate tests. Write them separately.

**You have only two or three cases:**
The overhead of defining a data array and a loop adds more code than it saves. Just write the tests directly.

**The cases are not truly parallel — order matters:**
Parameterised tests should be independent of each other. If case 3 depends on case 2 having run first, they should not be parameterised — use `describe.serial` instead.

---

## A Complete Real-World Example

Leave application validation — multiple combinations of dates, leave types, and expected outcomes:

```typescript
// tests/leave/apply-leave-validation.spec.ts
import { test, expect } from '../../fixtures/baseFixture';

const leaveValidationCases = [
  {
    description: 'past date is rejected',
    fromDate: '2020-01-01',
    toDate: '2020-01-03',
    leaveType: 'Annual',
    expectedError: 'Date should be after today',
    tag: '@regression',
  },
  {
    description: 'end date before start date is rejected',
    fromDate: '2026-05-10',
    toDate: '2026-05-05',
    leaveType: 'Annual',
    expectedError: 'To date should be after from date',
    tag: '@regression',
  },
  {
    description: 'overlapping leave request is rejected',
    fromDate: '2026-04-01',
    toDate: '2026-04-03',
    leaveType: 'Annual',
    expectedError: 'Overlapping leave request found',
    tag: '@regression',
  },
  {
    description: 'leave type not selected shows Required',
    fromDate: '2026-06-01',
    toDate: '2026-06-02',
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

Clean. The test body is 6 lines. Adding a new validation case is one more object in the array. The `beforeEach` navigation happens once per test without being part of the loop.

---

## Key Points

- Playwright parameterisation uses standard `for...of` over a data array — one `test()` call per iteration
- Each iteration produces an independent test with its own title, isolated execution, and individual pass/fail in the report
- Design data rows to be self-contained — description, inputs, and expected outcomes all in the row
- Tags work inside parameterised tests — include them in the data row when different cases need different tags
- Use `for...of` with `describe` when each data item needs multiple tests
- Load from JSON for developer-maintained test data; load from CSV for non-developer-maintained data
- Projects are a form of parameterisation at the environment/role level — same tests, different configs
- `test.use()` inside `for...of describe` blocks is a lightweight way to parameterise by viewport, locale, or other settings
- Use parameterisation when logic is identical and only data differs; use separate tests when logic diverges per case
- Two or three cases do not justify parameterisation — write them directly
- Parameterised tests must be independent — if order matters, use `describe.serial` instead
