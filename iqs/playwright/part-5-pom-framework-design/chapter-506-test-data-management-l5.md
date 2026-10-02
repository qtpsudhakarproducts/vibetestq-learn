# Chapter 506 — Test Data Management (L5)

This chapter covers the test data layer — the three files (`types.ts`,
`generate.ts`, `readers.ts`) that replace all hardcoded values in test files
with generated, unique, type-safe data. Interviewers ask about test data
to assess whether candidates understand the difference between generation
and reading, can explain why unique data prevents collisions on shared
environments, and know how to make generators composable with overrides.
A candidate who can also describe environment-specific credential management
via `readEnv()` is showing production-level framework thinking.

---

## Q506.1 — What problem does the test data layer solve?

After Level 4, every test file still has hardcoded data at the top:

```typescript
const newEmployee = {
  firstName:  'Bob',
  lastName:   'Williams',
  employeeId: 'EMP-L3-001',
};

const newUser = {
  role:         'ESS',
  employeeName: 'Alice Johnson',
  username:     'alice.johnson2',
  password:     'Alice@1234',
};
```

Three problems compound:

**Data collisions on shared environments.** Two developers running tests
simultaneously both try to create `alice.johnson2`. One succeeds; the other
fails for a reason unrelated to the feature being tested.

**Brittle cross-file dependencies.** `user.spec.ts` hardcodes
`employeeName: 'Alice Johnson'` assuming `employee.spec.ts` created that
exact name. One rename breaks the other silently.

**Scattered maintenance.** When OrangeHRM's password policy changes,
every test file with a hardcoded password must be found and updated.
Miss one and it fails at runtime with no obvious connection to the policy
change.

The Level 5 data layer eliminates all three.

---

## Q506.2 — What are the two types of test data and how are they handled differently?

**Generated data** — data that must be unique per run. Employee names,
usernames, IDs — anything created in the application. Generated data
is produced by Faker-based factory functions in `generate.ts`. Each run
produces different values; no two runs create the same employee name.

**Read data** — data that lives in files. Large datasets for data-driven
tests, environment credentials, leave policy configuration. File-based
data is stable across runs — it represents known, controlled scenarios
or environment-specific configuration.

```typescript
// Generated — unique every run
const employee = generateEmployee();    // produces 'Liam Nguyen', then 'Sarah Patel'...
const leave    = generateLeave();       // produces future dates, random leave type

// Read — stable across runs
const employees = readEmployees();      // same 5 rows from employees.csv every run
const policy    = readLeavePolicy();    // same policy from leave-policy.json every run
const env       = readEnv();            // credentials from .env.dev or .env.staging
```

The decision rule: if the data is created in the application (and must
be unique to avoid conflicts), generate it. If the data represents a
known dataset or configuration, read it from a file.

---

## Q506.3 — What is the data layer structure?

Three files, flat layout:

```
data/
  types.ts      ← type definitions for all data shapes
  generate.ts   ← all generator functions — one per scenario
  readers.ts    ← all file reader functions — one per file format/source

test-data/      ← actual data files (not code)
  employees.csv
  leave-policy.json
  bulk-import.xlsx
  .env.dev       ← gitignored — contains credentials
  .env.staging   ← gitignored — contains credentials
```

**No generics.** Every function returns a concrete type. A test author
reads the function name and knows exactly what they get.

**No sub-folders.** Three files, one import path. The data layer is small
enough to stay flat.

**Specific function names.** `generateLeave()` not `generate({ entity: 'leave' })`.
The scenario is encoded in the name.

---

## Q506.4 — What do the type definitions in types.ts look like?

```typescript
// data/types.ts

export interface EmployeeData {
  firstName:   string;
  lastName:    string;
  fullName:    string;      // computed: `${firstName} ${lastName}`
  employeeId:  string;
  gender:      'Male' | 'Female';
  nationality: string;
  dob:         string;      // OrangeHRM format: yyyy-dd-mm
}

export interface UserData {
  role:         'Admin' | 'ESS';
  employeeName: string;     // must match an existing employee fullName in OrangeHRM
  status:       'Enabled' | 'Disabled';
  username:     string;
  password:     string;
}

export interface LeaveData {
  leaveType: string;
  fromDate:  string;        // OrangeHRM format: yyyy-dd-mm
  toDate:    string;
  comment:   string;
}

export interface EnvConfig {
  baseURL:       string;
  adminUsername: string;
  adminPassword: string;
  essUsername:   string;
  essPassword:   string;
}

export interface LeavePolicy {
  leaveTypes:           string[];
  maxConsecutiveDays:   number;
  minAdvanceNoticeDays: number;
  allowHalfDay:         boolean;
}
```

TypeScript enforces these types across generators, readers, page objects,
and test files. Adding a field to `EmployeeData` causes a compile error
in every generator and reader that does not return the new field — the
framework tells you every place that needs updating before any test runs.

---

## Q506.5 — What does the generateEmployee() function look like?

```typescript
// data/generate.ts
import { faker } from '@faker-js/faker';
import { EmployeeData } from './types';

export function generateEmployee(overrides?: Partial<EmployeeData>): EmployeeData {
  const firstName = overrides?.firstName ?? faker.person.firstName();
  const lastName  = overrides?.lastName  ?? faker.person.lastName();
  const dobDate   = faker.date.birthdate({ min: 22, max: 55, mode: 'age' });

  return {
    firstName,
    lastName,
    fullName:    `${firstName} ${lastName}`,
    employeeId:  `EMP-${faker.string.alphanumeric(8).toUpperCase()}`,
    gender:      faker.helpers.arrayElement(['Male', 'Female'] as const),
    nationality: faker.location.country(),
    dob:         formatToOrangeHRM(dobDate),
    ...overrides,
    // Recompute fullName after spread — handles firstName/lastName override
    fullName: `${overrides?.firstName ?? firstName} ${overrides?.lastName ?? lastName}`,
  };
}
```

**Key design decisions:**

`Partial<EmployeeData>` overrides — tests pass only the fields they care about.
Everything else stays random and unique. Most tests call `generateEmployee()`
with no arguments.

`fullName` computed from `firstName` and `lastName` — ensures it stays
consistent even when overrides change first or last name. The post-spread
recomputation handles the edge case where the override provides one name
part but not the other.

`EMP-${faker.string.alphanumeric(8).toUpperCase()}` — employee IDs are unique
per run. Two simultaneous test runs will not create the same employee ID.

---

## Q506.6 — How does generateUser() link a user to an employee?

`generateUser()` accepts an `EmployeeData` object and uses it to set
the `employeeName` field — the field OrangeHRM uses to link a system
user to an employee record:

```typescript
export function generateUser(employee: EmployeeData, overrides?: Partial<UserData>): UserData {
  const username =
    `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}`
      .replace(/[^a-z.]/g, '')       // remove characters OrangeHRM doesn't allow
    + `.${faker.number.int({ min: 1000, max: 9999 })}`;  // suffix for uniqueness

  return {
    role:         'ESS',
    employeeName: employee.fullName, // links to the existing employee
    status:       'Enabled',
    username,
    password:     generatePassword(),
    ...overrides,
  };
}
```

The suffix `.${faker.number.int(...)}` guarantees the username is unique
even when two tests generate users for employees with the same name.

The design forces the caller to pass the employee — it is impossible to
generate a user without an employee to link to. This mirrors the application
constraint (a system user must be linked to an employee in OrangeHRM) and
prevents tests from creating users with orphaned `employeeName` strings.

---

## Q506.7 — How does generatePassword() enforce the application's password policy?

```typescript
export const PASSWORD_POLICY = {
  minLength:        8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumber:    true,
  requireSpecial:   true,
  specialChars:     '!@#$%^&*',
};

export function generatePassword(): string {
  const upper   = faker.string.alpha({ length: 1, casing: 'upper' });
  const lower   = faker.word.noun().toLowerCase().slice(0, 6).padEnd(4, 'x');
  const number  = faker.number.int({ min: 10, max: 99 });
  const special = faker.helpers.arrayElement(PASSWORD_POLICY.specialChars.split(''));
  return `${upper}${lower}${number}${special}`;
  // Example output: 'Brave42wolf!'
}
```

The `PASSWORD_POLICY` constant is exported — tests that verify password
validation rules can import it and assert against the same values. When
OrangeHRM's password policy changes, updating `PASSWORD_POLICY` in one
place updates both the generator and any policy-validation tests.

The generator constructs the password structurally — one of each required
component — rather than generating random strings and filtering. Structural
generation guarantees every output satisfies all constraints without retries.

---

## Q506.8 — How does generateLeave() handle the future-date constraint?

OrangeHRM rejects leave applications with past dates. The generator
enforces this constraint internally:

```typescript
export function generateLeave(overrides?: Partial<LeaveData>): LeaveData {
  // Always in the future — minimum 7 days ahead to avoid same-day edge cases
  const fromDate = faker.date.soon({ days: 60 });
  fromDate.setDate(fromDate.getDate() + 7);
  const toDate = new Date(fromDate);  // same day by default

  return {
    leaveType: faker.helpers.arrayElement(LEAVE_TYPES),
    fromDate:  DateHelpers.formatToOrangeHRM(fromDate),
    toDate:    DateHelpers.formatToOrangeHRM(toDate),
    comment:   faker.lorem.sentence(),
    ...overrides,
  };
}
```

Tests never think about date ranges or date formatting. They call
`generateLeave()` and receive a valid, future-dated leave application.
The generator owns all OrangeHRM-specific constraints.

For a test that needs specific dates:
```typescript
const leave = generateLeave({
  leaveType: 'Annual Leave',
  fromDate:  DateHelpers.fromISO('2025-12-01'),
  toDate:    DateHelpers.fromISO('2025-12-05'),
});
```

The override provides what the test cares about; the comment is still
generated randomly.

---

## Q506.9 — How does the overrides pattern work and when do you use it?

The `Partial<T>` overrides pattern lets tests declare exactly which fields
they care about. Everything else stays random:

```typescript
// Most tests — no overrides needed
const employee = generateEmployee();

// Test that checks gender-specific behaviour
const employee = generateEmployee({ gender: 'Female' });

// Test that verifies Admin role permissions
const user = generateUser(employee, { role: 'Admin' });

// Test that verifies disabled user cannot log in
const user = generateUser(employee, { status: 'Disabled' });

// Test that verifies multi-day leave balance deduction
const leave = generateLeave({ leaveType: 'Annual Leave', fromDate: '...', toDate: '...' });
```

The principle: a test communicates exactly what it depends on by
specifying only those fields as overrides. Any field left to the
generator is not relevant to the test scenario — if it were, the test
would override it. This makes tests self-documenting about their data
dependencies.

---

## Q506.10 — What does readEnv() do and why is it better than hardcoding credentials?

```typescript
export function readEnv(): EnvConfig {
  const environment = process.env.TEST_ENV ?? 'dev';
  const filePath    = resolvePath(`test-data/.env.${environment}`);

  if (!fs.existsSync(filePath)) {
    throw new Error(
      `readEnv: environment file not found: "${filePath}".\n` +
      `Set TEST_ENV to a valid environment name (dev, staging) ` +
      `and ensure test-data/.env.${environment} exists.`
    );
  }

  const content  = fs.readFileSync(filePath, 'utf-8');
  const parsed   = parseEnvFile(content);
  const required = ['BASE_URL', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'ESS_USERNAME', 'ESS_PASSWORD'];
  const missing  = required.filter(key => !parsed[key]);

  if (missing.length > 0) {
    throw new Error(
      `readEnv: missing required variables in ".env.${environment}": ${missing.join(', ')}`
    );
  }

  return {
    baseURL:       parsed['BASE_URL'],
    adminUsername: parsed['ADMIN_USERNAME'],
    adminPassword: parsed['ADMIN_PASSWORD'],
    essUsername:   parsed['ESS_USERNAME'],
    essPassword:   parsed['ESS_PASSWORD'],
  };
}
```

**Why it is better than hardcoding:**

Switching environments is one command:
```bash
TEST_ENV=staging npx playwright test  # uses .env.staging
TEST_ENV=dev     npx playwright test  # uses .env.dev (default)
```

Credentials are in `.gitignored` files — never committed to version control.

Missing variables fail immediately with a clear message listing exactly what
is missing — not at runtime 3 minutes into the test run when the first
login fails.

---

## Q506.11 — How does readEmployees() enable data-driven testing?

```typescript
export function readEmployees(): EmployeeData[] {
  const filePath = resolvePath('test-data/employees.csv');
  assertFileExists(filePath, 'readEmployees');

  const content = fs.readFileSync(filePath, 'utf-8');
  const rows    = parse(content, {
    columns:          true,
    skip_empty_lines: true,
    trim:             true,
  }) as Array<{ firstName: string; lastName: string; employeeId: string;
                gender: 'Male' | 'Female'; nationality: string }>;

  return rows.map(row => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
    dob:      '1990-15-06',  // default — CSV does not include dob
  }));
}
```

Usage in a data-driven test:

```typescript
// tests/pim/employee.spec.ts
import { readEmployees } from '../../data/readers';

const employeeDataset = readEmployees();

test.describe('PIM — Data-Driven Employee Creation', () => {

  for (const emp of employeeDataset) {
    test(`can add employee: ${emp.firstName} ${emp.lastName}`, async ({ addEmployeePage }) => {
      await addEmployeePage.addEmployee(emp);
      await addEmployeePage.assertEmployeeSavedSuccessfully();
    });
  }

});
```

Five rows in `employees.csv` produce five independent tests. Adding a
sixth row to the CSV adds a sixth test with no code change. This is
the data-driven pattern: one test implementation, N data sets, N test runs.

---

## Q506.12 — How does readLeavePolicy() enable policy-driven assertions?

```typescript
// data/readers.ts
export function readLeavePolicy(): LeavePolicy {
  const filePath = resolvePath('test-data/leave-policy.json');
  assertFileExists(filePath, 'readLeavePolicy');
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as LeavePolicy;
}
```

```json
// test-data/leave-policy.json
{
  "leaveTypes": ["Annual Leave", "Casual Leave", "Sick Leave"],
  "maxConsecutiveDays": 14,
  "minAdvanceNoticeDays": 1,
  "allowHalfDay": true
}
```

```typescript
// test that validates generated leave is policy-compliant
const policy = readLeavePolicy();
const leave  = generateLeave();

test('generated leave type is valid per policy', () => {
  expect(policy.leaveTypes).toContain(leave.leaveType);
});

test('leave duration is within policy maximum', () => {
  const days = DateHelpers.daysBetween(leave.fromDate, leave.toDate);
  expect(days).toBeLessThanOrEqual(policy.maxConsecutiveDays);
});
```

When the leave policy changes (a new leave type is added, the maximum
duration changes), only `leave-policy.json` needs updating. The tests
re-validate against the new policy automatically on the next run.

---

## Q506.13 — How does updating page object methods to accept data objects improve the API?

Before Level 5, composite page object methods accept individual parameters:

```typescript
// Old — AddUserPage.ts
async addUser(
  role: 'Admin' | 'ESS',
  employeeName: string,
  status: 'Enabled' | 'Disabled',
  username: string,
  password: string
): Promise<void>

// Old call site — positional, fragile, verbose
await addUserPage.addUser(user.role, user.employeeName, user.status, user.username, user.password);
```

After Level 5, they accept the data object directly:

```typescript
// New — AddUserPage.ts
import { UserData } from '../../data/types';

async addUser(user: UserData): Promise<void> {
  await this.selectUserRole(user.role);
  await this.fillEmployeeName(user.employeeName);
  await this.selectStatus(user.status);
  await this.fillUsername(user.username);
  await this.fillPassword(user.password);
  await this.fillConfirmPassword(user.password);
  await this.saveUser();
}

// New call site — clean, self-documenting
await addUserPage.addUser(user);
```

Adding a new field to `UserData` (for example `middleName`) requires updating
`UserData` in `types.ts`, the generator in `generate.ts`, and the page object
method implementation — but NOT the call site. The call site is always
`addUser(user)` regardless of how many fields `UserData` contains.

---

## Q506.14 — How does Faker seeding enable reproducible test runs?

By default Faker generates different data every run — which prevents
collisions. When a test fails and you need to reproduce it with the same
data, seed Faker:

```typescript
// global-setup.ts
import { faker } from '@faker-js/faker';

if (process.env.FAKER_SEED) {
  faker.seed(Number(process.env.FAKER_SEED));
  console.log(`🌱 Faker seed: ${process.env.FAKER_SEED} (reproducible run)`);
} else {
  console.log(`🌱 Faker seed: none (random run)`);
}
```

```bash
# Normal run — random data, no collisions
npx playwright test

# Reproduce a specific failing run (seed logged from the failed run's output)
FAKER_SEED=12345 npx playwright test
```

The seed is logged at the start of every run. When a CI run fails, the
seed appears in the pipeline logs. Copy the seed value, run locally with
`FAKER_SEED=<value>`, and get identical test data. This makes debugging
random-data failures practical rather than guesswork.

---

## Q506.15 — What sample data files does the framework use?

```csv
# test-data/employees.csv
firstName,lastName,employeeId,gender,nationality
Sarah,Mitchell,EMP-FILE-001,Female,American
James,Okafor,EMP-FILE-002,Male,Nigerian
Mei,Zhang,EMP-FILE-003,Female,Chinese
Carlos,Rivera,EMP-FILE-004,Male,Mexican
Priya,Sharma,EMP-FILE-005,Female,Indian
```

```json
// test-data/leave-policy.json
{
  "leaveTypes": ["Annual Leave", "Casual Leave", "Maternity Leave", "Personal Leave", "Sick Leave"],
  "maxConsecutiveDays": 14,
  "minAdvanceNoticeDays": 1,
  "allowHalfDay": true
}
```

```
# test-data/.env.dev  (gitignored)
BASE_URL=https://opensource-demo.orangehrmlive.com
ADMIN_USERNAME=Admin
ADMIN_PASSWORD=admin123
ESS_USERNAME=alice.johnson
ESS_PASSWORD=Alice@1234
```

```
# test-data/.env.staging  (gitignored)
BASE_URL=https://staging.orangehrmlive.com
ADMIN_USERNAME=staging.admin
ADMIN_PASSWORD=Staging@SecurePass1
```

CSV, JSON, and Excel files can be committed — they contain test data,
not secrets. Only `.env.*` files are gitignored.

---

## Q506.16 — How does readBulkEmployees() demonstrate the Excel reader pattern?

```typescript
export function readBulkEmployees(): EmployeeData[] {
  const filePath = resolvePath('test-data/bulk-import.xlsx');
  assertFileExists(filePath, 'readBulkEmployees');

  const workbook = XLSX.readFile(filePath);
  const sheet    = workbook.Sheets['Employees'];

  if (!sheet) {
    throw new Error(
      `readBulkEmployees: sheet "Employees" not found.\n` +
      `Available sheets: ${workbook.SheetNames.join(', ')}`
    );
  }

  const rows = XLSX.utils.sheet_to_json<{
    firstName: string; lastName: string; employeeId: string;
    gender: 'Male' | 'Female'; nationality: string;
  }>(sheet, { defval: '' });

  return rows.map(row => ({
    ...row,
    fullName: `${row.firstName} ${row.lastName}`,
    dob:      '1990-15-06',
  }));
}
```

The error handling for the missing sheet demonstrates a pattern used
throughout `readers.ts`: errors are descriptive — they tell you exactly
what is missing and what alternatives exist. Discovering that the sheet
name in the Excel file has a typo is instant; diagnosing it from a generic
`TypeError: Cannot read property of undefined` takes minutes.

---

## Q506.17 — What changed in global-setup.ts at Level 5?

Before Level 5, `global-setup.ts` hardcoded credentials:

```typescript
// Level 3/4 — hardcoded
await adminPage.getByPlaceholder('Username').fill('Admin');
await adminPage.getByPlaceholder('Password').fill('admin123');
```

After Level 5, credentials come from `readEnv()`:

```typescript
// Level 5 — environment-aware
import { readEnv } from './data/readers';

async function globalSetup(config: FullConfig): Promise<void> {
  const env = readEnv();  // reads from test-data/.env.dev (or .env.staging)

  await adminPage.getByPlaceholder('Username').fill(env.adminUsername);
  await adminPage.getByPlaceholder('Password').fill(env.adminPassword);
  // ...
  await essPage.getByPlaceholder('Username').fill(env.essUsername);
  await essPage.getByPlaceholder('Password').fill(env.essPassword);
}
```

Running against staging:
```bash
TEST_ENV=staging npx playwright test
# global-setup reads .env.staging credentials
# auth state saved for staging users
# all tests run against staging URL
```

No code changes needed to switch environments — only the `TEST_ENV`
variable changes.

---

## Q506.18 — What does Level 5 not solve?

Level 5 eliminates hardcoded data and introduces environment-aware
configuration. The remaining problems:

**Complex UI interaction patterns are still duplicated.** Date pickers,
autocomplete fields, and custom dropdowns in OrangeHRM each have their
own interaction logic written independently in each page object.
`AddEmployeePage` fills dates one way; `ApplyLeavePage` fills them another.
Level 6 (Web Action Helpers) extracts these into shared helpers — one
implementation of "fill an OrangeHRM date picker", "select from OrangeHRM
dropdown", "handle autocomplete" — used across all page objects.

**Test results lack organisation at scale.** With the full framework in
place, the suite is approaching 40+ tests. When 10 fail in CI, there is
no immediate way to see: are these all smoke tests? All in PIM? All related
to one UI component? Level 7 introduces tagging by module and severity,
structured runs, and reporting for different audiences.

---

## Chapter Summary

- Two types of test data: generated (unique per run, uses Faker) and read (stable from files, uses readers).
- Three-file data layer: `types.ts` (interfaces), `generate.ts` (factory functions), `readers.ts` (file loaders).
- `EmployeeData`, `UserData`, `LeaveData`, `EnvConfig`, `LeavePolicy` — typed interfaces enforced across generators, readers, page objects, and tests.
- `generateEmployee(overrides?)` — uses Faker for random realistic data; `Partial<T>` overrides let tests specify only the fields they care about.
- `generateUser(employee, overrides?)` — requires an employee argument to enforce the OrangeHRM constraint that users must be linked to employees.
- `generatePassword()` — structurally builds a compliant password; `PASSWORD_POLICY` exported for policy-validation tests.
- `generateLeave(overrides?)` — always produces future dates; the generator owns the "no past dates" constraint so tests never think about it.
- `readEmployees()` — parses CSV; used for data-driven tests where each row becomes a test case.
- `readLeavePolicy()` — loads JSON; policy-driven assertions validate against the file, not hardcoded strings.
- `readBulkEmployees()` — reads Excel; descriptive error when sheet name is missing.
- `readEnv()` — loads `.env.{TEST_ENV}` file; throws immediately with named missing variables; enables `TEST_ENV=staging npx playwright test`.
- Faker seeding: logged at run start; `FAKER_SEED=<value>` reproduces failed runs with identical data.
- Page object composite methods accept data objects (`addUser(user: UserData)`) not individual parameters — call sites never change when new fields are added.
- `.env.*` files are gitignored; CSV/JSON/Excel files can be committed.
- Level 5 solves data management; it leaves duplicated UI patterns (Level 6) and test organisation at scale (Level 7) for subsequent levels.
