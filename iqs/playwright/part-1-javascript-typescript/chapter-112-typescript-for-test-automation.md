# Chapter 112 — TypeScript for Test Automation

This chapter covers the TypeScript features that matter most in a
Playwright project. Interviewers test TypeScript because it is the
default language for production Playwright test suites — and because
TypeScript catches whole categories of bugs before any test ever runs.
Questions build from what TypeScript is through generics, strict mode,
and utility types to code that demonstrates TypeScript working in
a real framework context.

> Note: This chapter has 22 questions. Q12.16–Q12.22 were added to cover
> topics that senior and architect-level interviewers consistently ask
> about: compile-time vs runtime types, utility types (Partial, Pick, Omit),
> typing async functions, tsconfig setup, declaration merging, and extending
> Playwright types.

---

## Q112.1 — What is TypeScript and why was it created?

TypeScript is a programming language created by Microsoft and released in
2012. It adds a static type system to JavaScript.

JavaScript is dynamic — types are checked only at runtime. TypeScript
adds type annotations to variables, function parameters, and return values.
A TypeScript compiler (`tsc`) checks these types before the code runs
and reports any mismatches as errors.

TypeScript was created to make large JavaScript codebases maintainable.
Without types, refactoring a shared function in a big codebase means
checking every caller manually. With types, the compiler checks them all
instantly and flags anything that breaks.

For test automation, TypeScript provides:
- IDE autocomplete for Playwright's entire API
- Compile-time detection of typos in method names
- Type-safe test data objects (wrong shape = error before tests run)
- Self-documenting code — function signatures tell you what they expect

---

## Q112.2 — What is the difference between a type and an interface in TypeScript?

Both define the shape of an object. They are nearly identical for most
use cases.

```typescript
// interface
interface TestUser {
  email: string;
  role: "admin" | "viewer";
  active: boolean;
}

// type alias
type TestUser = {
  email: string;
  role: "admin" | "viewer";
  active: boolean;
};
```

Key differences:

| | `interface` | `type` |
|---|---|---|
| Extension | `extends` keyword | `&` intersection |
| Declaration merging | Yes — can add fields across files | No |
| Union types | No | Yes — `type ID = string \| number` |
| Primitive aliases | No | Yes — `type Name = string` |

**Use `interface` for object shapes** that represent data or classes —
especially in page objects and test data definitions.

**Use `type` for unions, intersections, and aliases** — `type Status = "pass" \| "fail"`,
`type PageFixture = Page & { isAdmin: boolean }`.

---

## Q112.3 — When do you use TypeScript features in Playwright test code?

TypeScript features appear in every file of a Playwright project:

**Interfaces** — for test data shapes, API response shapes, fixture types.

**Union types** — for status enums, role names, environment strings:
`"admin" | "viewer"`, `"staging" | "production"`.

**Generics** — for factory functions that return typed data, for typed
`Promise<T>` return values, and for Playwright's own typed APIs like
`page.evaluate<T>()`.

**Type guards** — when handling errors (`error instanceof Error`), when
narrowing API response fields, when checking if an optional value exists.

**Utility types** — `Partial<T>` in factory functions that accept
optional overrides, `Pick<T, K>` to select a subset of an interface for
a specific context.

---

## Q112.4 — How does your project use TypeScript to improve test reliability?

In our project, TypeScript works as a first line of defence at three levels.

**Typed test data** — every test data factory function has a return type.
If a test passes the wrong field or the wrong type, the compiler catches
it before the test ever runs.

**Typed API responses** — every API response is cast to a typed interface.
If the API shape changes, TypeScript flags every place that reads the
changed field.

**Strict mode + no-any** — `tsconfig.json` has `"strict": true` and our
ESLint config bans `any`. This means no implicit type holes. Every function
parameter and return value is typed.

In practice, TypeScript has caught: wrong method names on page objects
(typos that would have been runtime errors), wrong number of arguments
to helper functions, and missing required fields in test data objects —
all before any test ran.

---

## Q112.5 — What are generics in TypeScript?

Generics are placeholders for a type that is specified when the function,
class, or interface is used. They let you write reusable code that works
with any type while remaining type-safe.

```typescript
// Without generics — returns any, loses type information
function getFirst(array: any[]): any {
  return array[0];
}

// With generics — type is preserved
function getFirst<T>(array: T[]): T {
  return array[0];
}

const firstName = getFirst(["Alice", "Bob"]); // type: string
const firstNum  = getFirst([1, 2, 3]);        // type: number
```

In Playwright projects, generics appear in:

**Factory functions:**
```typescript
function createData<T>(base: T, overrides?: Partial<T>): T {
  return { ...base, ...overrides };
}
```

**Typed API calls:**
```typescript
async function getJson<T>(request: APIRequestContext, url: string): Promise<T> {
  const response = await request.get(url);
  return response.json() as T;
}
const user = await getJson<TestUser>(request, "/api/users/1");
```

---

## Q112.6 — What are enums in TypeScript?

Enums define a set of named constants. They make code more readable
when a variable can only hold one of a fixed set of values.

```typescript
enum UserRole {
  Admin   = "admin",
  Viewer  = "viewer",
  Manager = "manager",
}

interface TestUser {
  email: string;
  role: UserRole;
}

const admin: TestUser = {
  email: "alice@test.com",
  role:  UserRole.Admin, // ✅ — correct
};

const broken: TestUser = {
  email: "bob@test.com",
  role:  "superadmin", // ❌ TypeScript error — not a valid UserRole
};
```

**String enums** (as shown above) are the most common in test automation.
They keep values readable in reports and logs.

An alternative to enums is a union type:
```typescript
type UserRole = "admin" | "viewer" | "manager";
```

Union types are lighter weight and do not produce any runtime code.
Use enums when you want the named constant syntax (`UserRole.Admin`)
and when refactoring the string value everywhere would be error-prone.

---

## Q112.7 — What is the difference between any, unknown, and never?

**`any`** — opt out of type checking entirely. A variable typed `any`
can be assigned anything and TypeScript will not check what you do with
it. It is a type hole — avoid it.

**`unknown`** — a safer alternative to `any`. A value typed `unknown`
can hold anything, but you cannot use it without first checking its type.

**`never`** — a type that should never have a value. A function that
always throws or loops forever returns `never`. It appears in exhaustive
checks.

```typescript
// any — no safety
let x: any = "hello";
x.toFixed(2); // TypeScript allows this — no error at compile time, crashes at runtime

// unknown — safe
let y: unknown = "hello";
y.toFixed(2);              // ❌ TypeScript error — must check type first
if (typeof y === "string") {
  y.toUpperCase();         // ✅ — TypeScript knows it's a string now
}

// never — exhaustiveness check
type Env = "staging" | "production";
function getUrl(env: Env): string {
  switch (env) {
    case "staging":    return "https://staging.example.com";
    case "production": return "https://app.example.com";
    default:
      const _check: never = env; // TypeScript errors if Env has unhandled cases
      throw new Error(`Unhandled env: ${env}`);
  }
}
```

---

## Q112.8 — What are type guards and when do you use them?

A type guard is a runtime check that narrows a value from a wider type
to a more specific one. After a type guard passes, TypeScript knows the
more specific type and allows you to use it safely.

```typescript
// instanceof type guard
function handleError(error: unknown): string {
  if (error instanceof Error) {
    return error.message; // TypeScript knows error is Error here
  }
  return String(error);
}

// typeof type guard
function formatTimeout(value: string | number): number {
  if (typeof value === "string") {
    return parseInt(value, 10);
  }
  return value; // TypeScript knows value is number here
}

// Custom type guard — function that returns type predicate
interface TestUser { email: string; role: string; }
function isTestUser(value: unknown): value is TestUser {
  return (
    typeof value === "object" &&
    value !== null &&
    "email" in value &&
    "role" in value
  );
}
```

In test automation, type guards appear when: processing API responses
that might have different shapes, narrowing `unknown` in catch blocks,
and validating parsed JSON before using it.

---

## Q112.9 — What is the difference between type and interface in practice?

For object shapes in a test project, the practical difference is small.
Both work. The choice to make:

**Use `interface` for** page object types, test data shapes, fixture
types, and any object that might need to be extended or merged across
files.

**Use `type` for** union types, intersection types, primitive aliases,
and mapped types. Things you cannot express with `interface`.

```typescript
// Things only type can do:
type Status   = "pass" | "fail" | "skip";  // union
type ID       = string | number;           // union of primitives
type LogLevel = "debug" | "info" | "warn" | "error";

// Either works — choose interface for objects, type for everything else
interface CheckoutData { shipping: Address; payment: Card; }
type CheckoutData = { shipping: Address; payment: Card; }; // also valid
```

The popular guideline: start with `interface`. Only switch to `type`
when you need something `interface` cannot express.

---

## Q112.10 — When should you use generics vs union types?

**Use union types** when the type can be one of a fixed, known set of
specific types:

```typescript
type Status   = "pass" | "fail" | "skip";
type Response = SuccessResponse | ErrorResponse;
```

**Use generics** when you are writing a function or class that should
work with any type, and the caller provides the specific type:

```typescript
// Generic — works with any type T
function getFirst<T>(items: T[]): T | undefined {
  return items[0];
}

// Not generic — would need separate overloads for each type
function getFirstUser(users: User[]): User | undefined { ... }
function getFirstOrder(orders: Order[]): Order | undefined { ... }
```

**The decision rule:** if the type is determined by the caller at the
call site, use generics. If the type is a fixed set of known options,
use a union type.

---

## Q112.11 — What is wrong with using any — show the problem and the typed alternative?

```typescript
// ❌ Using any — completely bypasses type checking
async function getOrderStatus(orderId: any): Promise<any> {
  const response = await request.get(`/api/orders/${orderId}`);
  const body: any = await response.json();
  return body.status; // TypeScript cannot check if .status exists
}

// Problems:
// 1. orderId accepts anything — a number, an object, undefined
// 2. body is any — .status could be undefined, a typo, anything
// 3. The return type is any — callers get no type safety
// 4. Refactoring the API response shape = silent runtime failures
```

```typescript
// ✅ Typed alternative
interface OrderResponse {
  id:        string;
  status:    "pending" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

async function getOrderStatus(orderId: string): Promise<OrderResponse["status"]> {
  const response = await request.get(`/api/orders/${orderId}`);

  if (!response.ok()) {
    throw new Error(`Failed to get order ${orderId}: ${response.status()}`);
  }

  const body = await response.json() as OrderResponse;
  return body.status; // TypeScript knows this is a valid status string
}
```

The typed version catches: wrong orderId type, wrong property name on
response, and any change to the `OrderResponse` shape that breaks callers.

---

## Q112.12 — What TypeScript strict mode options matter most for test automation?

`"strict": true` in `tsconfig.json` enables a group of checks. The
ones that matter most for test automation:

**`strictNullChecks`** — variables cannot be `null` or `undefined` unless
the type says so. Catches `locator.textContent()` returning `string | null`
without a null check.

**`noImplicitAny`** — parameters and return values without a type
annotation are not silently `any`. They are an error. Forces all
function signatures to be typed.

**`strictFunctionTypes`** — function parameters are checked more strictly
for assignability. Prevents subtle callback type mismatches.

**`strictPropertyInitialization`** — class properties must be initialised
in the constructor. Catches page object locators that are declared but
never assigned.

```json
// tsconfig.json — minimum config for a Playwright project
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "outDir": "./dist",
    "rootDir": "./tests"
  }
}
```

---

## Q112.13 — Write a typed page object using an interface to define its shape

```typescript
// File: tests/pages/types.ts
import { Locator } from '@playwright/test';

// Interface defines the contract — what every page object must expose
interface IPage {
  goto(): Promise<void>;
}

interface ILoginPage extends IPage {
  login(email: string, password: string): Promise<void>;
  getErrorText(): Promise<string | null>;
}

// File: tests/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';
import { ILoginPage } from './types';

export class LoginPage implements ILoginPage {
  private readonly emailInput:    Locator;
  private readonly passwordInput: Locator;
  private readonly submitButton:  Locator;
  private readonly errorAlert:    Locator;

  constructor(private readonly page: Page) {
    this.emailInput    = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton  = page.getByRole("button", { name: "Sign In" });
    this.errorAlert    = page.getByRole("alert");
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async login(email: string, password: string): Promise<void> {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  async getErrorText(): Promise<string | null> {
    return this.errorAlert.textContent();
  }
}
```

---

## Q112.14 — Write a generic data factory function using TypeScript generics

```typescript
// File: tests/data/factory.ts

/**
 * Creates a test data object by merging base defaults with optional overrides.
 * Generic so it works with any typed data shape.
 */
function createData<T>(base: T, overrides?: Partial<T>): T {
  return { ...base, ...overrides };
}

// Specific factories use the generic — typed and reusable
interface TestUser {
  email:    string;
  password: string;
  role:     "admin" | "viewer";
  active:   boolean;
}

function createTestUser(overrides?: Partial<TestUser>): TestUser {
  return createData<TestUser>(
    {
      email:    `user+${Date.now()}@test.example.com`,
      password: "Test1234!",
      role:     "viewer",
      active:   true,
    },
    overrides
  );
}

interface TestOrder {
  productId: string;
  quantity:  number;
  promoCode?: string;
}

function createTestOrder(overrides?: Partial<TestOrder>): TestOrder {
  return createData<TestOrder>(
    { productId: "P001", quantity: 1 },
    overrides
  );
}

// Usage
const admin       = createTestUser({ role: "admin" });
const bulkOrder   = createTestOrder({ quantity: 10, promoCode: "BULK10" });
```

---

## Q112.15 — Describe a TypeScript type error that caught a real bug before a test ran

In our project we had a helper that was supposed to return a user's
`id` as a `string`. We used it to build API URLs:

```typescript
const userId = await createUser(); // inferred as User object, not string
await request.delete(`/api/users/${userId}`); // URL: /api/users/[object Object]
```

The function signature returned `Promise<User>` but the test was treating
the result as a `string`. The URL was being built with
`[object Object]` because JavaScript converts an object to a string that
way.

The API returned a 404 for `[object Object]` — not the TypeError we
expected. The test passed. The user was never deleted.

After we added the return type annotation properly:

```typescript
async function createUser(): Promise<User> { ... }
const user = await createUser(); // TypeScript knows type is User
await request.delete(`/api/users/${user.id}`); // .id is the string
```

TypeScript immediately flagged every place where we were using `user`
as if it were a string. Two tests that were silently never cleaning up
their test data were fixed in that one pass.

---

## Q112.16 — What is the difference between compile-time and runtime type checking?

**Compile-time checking** — TypeScript checks types when you build the
code. The compiler analyses your source files and reports errors before
any code runs. Types exist only in the source — they are erased in the
compiled JavaScript.

**Runtime checking** — JavaScript actually executes and checks values
as they appear. Runtime types can be anything — TypeScript's types are
gone. API responses, user inputs, and environment variables can all
hold unexpected types at runtime.

```typescript
// TypeScript says this is a string — but what does the API actually return?
const status: string = await response.json(); // compile-time: string
// At runtime, the API might return { status: "shipped" } — an object, not a string!

// Runtime check — validate what you actually receive
const body = await response.json();
if (typeof body.status !== "string") {
  throw new Error(`Unexpected status type: ${typeof body.status}`);
}
```

In test automation: TypeScript protects you from your own code. Runtime
checks protect you from external systems (APIs, databases, environment
variables) that can return anything regardless of your TypeScript types.

---

## Q112.17 — What are utility types in TypeScript — Partial, Required, Pick, Omit?

Utility types transform existing types. They are built into TypeScript.

**`Partial<T>`** — makes all properties of `T` optional. Used in factory
function overrides.

```typescript
function createUser(overrides?: Partial<TestUser>): TestUser { ... }
// overrides can have any subset of TestUser's fields
```

**`Required<T>`** — makes all properties required. The opposite of Partial.

**`Pick<T, K>`** — create a new type with only the specified keys from `T`.

```typescript
type UserCredentials = Pick<TestUser, "email" | "password">;
// { email: string; password: string } — only these two fields
```

**`Omit<T, K>`** — create a new type with specified keys removed.

```typescript
type UserWithoutPassword = Omit<TestUser, "password">;
// TestUser minus the password field
```

**`Readonly<T>`** — makes all properties readonly.

```typescript
const config: Readonly<TestConfig> = buildConfig();
config.timeout = 5000; // ❌ TypeScript error — cannot assign to readonly
```

---

## Q112.18 — How do you type an async function that returns a Playwright Locator?

```typescript
import { Page, Locator } from '@playwright/test';

// Return type is Locator — not Promise<Locator> — because
// Playwright locators are lazy: they don't query the DOM until used
function getSubmitButton(page: Page): Locator {
  return page.getByRole("button", { name: "Submit" });
}

// If the helper does async work (waits, navigates) before returning the locator:
async function getFirstResultRow(page: Page): Promise<Locator> {
  await page.waitForSelector("[data-testid='result-row']");
  return page.getByTestId("result-row").first();
}

// Typed helper that finds a row containing specific text
async function findTableRow(page: Page, text: string): Promise<Locator> {
  const rows = page.getByRole("row");
  // filter() returns a Locator — no await needed
  return rows.filter({ hasText: text });
}
```

Key point: `Locator` objects themselves do not query the DOM when
created. They query on action (`click`, `fill`) or assertion
(`toBeVisible`). So a function that just creates and returns a locator
is synchronous and returns `Locator`, not `Promise<Locator>`.

---

## Q112.19 — Write a typed environment config reader using TypeScript interfaces

```typescript
// File: tests/config/env.ts

type Environment = "dev" | "staging" | "production";

interface EnvConfig {
  readonly baseUrl:     string;
  readonly apiUrl:      string;
  readonly environment: Environment;
  readonly timeout:     number;
  readonly retries:     number;
  readonly headless:    boolean;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Required env var "${name}" is missing`);
  return value;
}

function readEnvConfig(): EnvConfig {
  const env = (process.env.TEST_ENV ?? "staging") as Environment;

  const urls: Record<Environment, { baseUrl: string; apiUrl: string }> = {
    dev:        { baseUrl: "https://localhost:3000",         apiUrl: "http://localhost:4000" },
    staging:    { baseUrl: "https://staging.example.com",    apiUrl: "https://api.staging.example.com" },
    production: { baseUrl: "https://app.example.com",        apiUrl: "https://api.example.com" },
  };

  const rawTimeout = process.env.TIMEOUT;
  const timeout = rawTimeout ? Number(rawTimeout) : 30_000;

  return Object.freeze({
    ...urls[env],
    environment: env,
    timeout,
    retries:  Number(process.env.RETRIES ?? "0"),
    headless: process.env.HEADLESS !== "false",
  });
}

export const envConfig: EnvConfig = readEnvConfig();
```

---

## Q112.20 — How does your team configure tsconfig.json for a Playwright project and why?

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": ".",
    "baseUrl": ".",
    "paths": {
      "@pages/*":   ["tests/pages/*"],
      "@helpers/*": ["tests/helpers/*"],
      "@data/*":    ["tests/data/*"]
    }
  },
  "include": ["tests/**/*", "playwright.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

**Why each setting:**

- `"strict": true` — enables all strict checks. The most important
  setting for catching real bugs.
- `"target": "ES2020"` — modern output. Supports optional chaining
  and nullish coalescing natively.
- `"esModuleInterop": true` — allows `import x from 'module'` to work
  correctly for CommonJS modules.
- `"resolveJsonModule": true` — allows importing JSON files directly
  (test data, config files).
- `"paths"` — short imports. `import { LoginPage } from '@pages/LoginPage'`
  instead of `../../pages/LoginPage`.

---

## Q112.21 — What is declaration merging and when would a test framework engineer use it?

Declaration merging is TypeScript's ability to combine multiple declarations
of the same name into one type. It works for interfaces, namespaces, and
module augmentation.

In test automation, the most important use is extending Playwright's
built-in fixture types when you create custom fixtures:

```typescript
// Without declaration merging — test() only knows about built-in fixtures
test("example", async ({ page }) => { ... });

// With declaration merging — test() knows about your custom fixtures too
type TestFixtures = {
  loginPage:    LoginPage;
  dashboardPage: DashboardPage;
  testUser:     TestUser;
};

// Extend Playwright's test with custom fixtures
const test = base.extend<TestFixtures>({ ... });

// Now TypeScript autocompletes your fixtures
test("example", async ({ page, loginPage, testUser }) => { ... });
//                                ^^^^^^^^^ — TypeScript knows the type
```

This is standard in every mature Playwright TypeScript project. The
extended `test` function carries the full type information for all
custom fixtures.

---

## Q112.22 — How do you extend Playwright's built-in types in your framework?

Two main scenarios: adding custom fixture types and augmenting Playwright's
existing interfaces.

**Scenario 1 — Custom fixture types (most common):**

```typescript
// File: tests/fixtures/index.ts
import { test as base, expect } from '@playwright/test';
import { LoginPage }    from '@pages/LoginPage';
import { DashboardPage } from '@pages/DashboardPage';

type Fixtures = {
  loginPage:     LoginPage;
  dashboardPage: DashboardPage;
  authenticatedPage: Page;
};

export const test = base.extend<Fixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  dashboardPage: async ({ page }, use) => {
    await use(new DashboardPage(page));
  },
  authenticatedPage: async ({ page }, use) => {
    // Perform login and provide the authenticated page
    const loginPage = new LoginPage(page);
    await loginPage.login(process.env.TEST_EMAIL!, process.env.TEST_PASSWORD!);
    await use(page);
  },
});

export { expect };
```

```typescript
// Tests import from fixtures, not from @playwright/test directly
import { test, expect } from '../fixtures';

test("authenticated user sees dashboard", async ({ authenticatedPage, dashboardPage }) => {
  await dashboardPage.goto();
  await expect(dashboardPage.heading).toBeVisible();
});
```

**Scenario 2 — Augmenting TestInfo** (adding custom annotation helpers):

```typescript
// Extend TestInfo to add a typed helper method
declare module '@playwright/test' {
  interface TestInfo {
    attachScreenshotOnFailure(): Promise<void>;
  }
}
```

This pattern uses TypeScript module augmentation — adding properties
to an existing interface from an external module.

---

## Chapter Summary — Key Points for Your Interview

- TypeScript adds compile-time type checking to JavaScript. Types are
  erased at runtime — they only exist in the source code.
- `interface` is for object shapes. `type` is for unions, intersections,
  and aliases. In practice, use interface for data shapes in test code.
- `any` removes type safety. Use `unknown` when a type is genuinely
  unknown — it forces you to check the type before using the value.
- `Partial<T>` makes all fields optional — perfect for factory function
  overrides. `Pick` and `Omit` select or remove fields from a type.
- Enable `"strict": true` in `tsconfig.json`. The most important checks
  are `strictNullChecks` (catches null misses) and `noImplicitAny`
  (forces typed signatures).
- Extend Playwright's `test` with custom fixtures using `base.extend<T>()`.
  TypeScript carries full type information through to every test that
  imports your extended test function.

---

# Part 1 — Chapter Summary

Part 1 covered the JavaScript and TypeScript foundation every test
automation engineer needs. Here is what to know for your interview:

**Language foundations (Ch 1–3):** JavaScript runs in Node.js. ES6
added everything you write daily. TypeScript is the default for production
suites. Always use `===`, `const` first, `let` when needed, never `var`.

**Data structures and iteration (Ch 4–5):** `for...of` + `await` is the
correct async loop. `forEach` + `await` silently ignores the async work.
`map`, `filter`, `find`, and spread are the essential array tools.

**Functions and objects (Ch 6–7):** Arrow functions inherit `this`. Regular
methods have their own `this`. Closures capture references. Never mutate
shared objects between tests — use factory functions.

**Strings and regex (Ch 8):** Normalise DOM text before asserting. Use
regex for patterns with variable parts. `test()` for checking existence,
`match()` for extracting values.

**Async (Ch 9):** The most important chapter. Every Playwright action
returns a Promise. Always `await` it. `Promise.all` for parallel, `for...of`
for sequential. Start `waitForResponse` listeners inside `Promise.all`
with the triggering click.

**Classes and modules (Ch 10–11):** Page objects are classes. Utilities
are modules. Never put assertions inside page objects. Custom error classes
give structured context. Never swallow errors silently.

**TypeScript (Ch 12):** `strict: true`, typed data factories with
`Partial<T>`, generics for reusable helpers, and `base.extend<T>()` to
carry fixture types across your test suite.
