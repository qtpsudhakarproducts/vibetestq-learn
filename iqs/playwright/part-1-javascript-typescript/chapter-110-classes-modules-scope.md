# Chapter 110 — Classes, Modules & Scopes

This chapter covers JavaScript classes and the ES Module system — the two
foundations of every page object framework. Interviewers test classes
because the POM (Page Object Model) is built on them, and modules because
import/export errors are a common setup mistake. Questions move from class
syntax through inheritance to the module system and how both are used in
a real Playwright project.

---

## Q110.1 — What is a class in JavaScript?

A class is a template for creating objects. It defines the properties
and methods that every instance of that class will have.

```javascript
class LoginPage {
  constructor(page) {
    this.page = page; // each instance gets its own page reference
  }

  async login(email, password) {
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }
}

const login = new LoginPage(page); // create an instance
await login.login("user@test.com", "pass123");
```

JavaScript classes were added in ES6. They are syntactic sugar over the
prototype-based system described in Chapter 7. Under the hood, a class
creates a constructor function and puts methods on its prototype — but
the class syntax is much cleaner to read and write.

---

## Q110.2 — What is the difference between a class and a function?

Both can produce objects. The difference is intent, syntax, and what
they support.

A **class** is designed to be a blueprint. It has a `constructor`, can be
`extends`ed, supports `private` and `protected` fields, and is used to
create multiple objects with the same shape.

A **function** is a reusable block of code. It can be called, passed
around, and used as a constructor with `new` — but the class syntax
is more explicit and TypeScript understands it better.

```javascript
// Function factory — creates objects
function createPage(page) {
  return {
    goto: async () => page.goto("/login"),
    login: async (e, p) => { /* ... */ },
  };
}

// Class — cleaner, TypeScript-friendly, supports inheritance
class LoginPage {
  constructor(private page: Page) {}
  async goto()       { await this.page.goto("/login"); }
  async login(e, p)  { /* ... */ }
}
```

In Playwright projects, always use classes for page objects. Functions
are for utilities and helpers that do not need to maintain state or
support inheritance.

---

## Q110.3 — When do you use classes in test automation?

Classes appear in two specific contexts in a Playwright project:

**Page objects** — each page or component in the application becomes a
class. The class owns the locators for that page and the methods that
perform actions on it.

**Base classes** — a `BasePage` class that holds shared setup (URL,
page reference, common navigation methods). Other page classes extend it.

Everything else in a test suite — helpers, data factories, config readers
— is usually a module of exported functions, not a class. A class makes
sense when you have related state (the `page` reference) and multiple
methods that operate on that state together.

---

## Q110.4 — How do you use classes and modules in your automation project?

In our project, classes and modules work together at every level.

**Classes** — one class per page or major component. `LoginPage`,
`DashboardPage`, `CheckoutPage`, `ProductCard`. Each class lives in its
own file under `tests/pages/`.

**Modules** — helper functions, data factories, and config readers are
plain modules. They export named functions. Nothing in them needs state
or inheritance.

**Barrel exports** — `tests/pages/index.ts` re-exports all page classes.
A test imports from one place: `import { LoginPage, DashboardPage }
from '../pages'`.

**Fixtures** — Playwright fixtures instantiate page objects and inject
them into tests. Tests never call `new LoginPage()` directly — the
fixture does it.

---

## Q110.5 — What is inheritance and how does it work with the extends keyword?

Inheritance lets one class (subclass) reuse methods and properties
from another class (superclass). The subclass gets everything the
superclass has, plus its own additions.

```typescript
class BasePage {
  constructor(protected page: Page) {}

  async goto(path: string) {
    await this.page.goto(path);
  }

  async waitForLoad() {
    await this.page.waitForLoadState("networkidle");
  }
}

class LoginPage extends BasePage {
  private readonly url = "/login";

  // Inherits goto() and waitForLoad() from BasePage
  // Adds its own login-specific method
  async login(email: string, password: string) {
    await this.goto(this.url);        // from BasePage
    await this.page.getByLabel("Email").fill(email);
    await this.page.getByLabel("Password").fill(password);
    await this.page.getByRole("button", { name: "Sign In" }).click();
  }
}
```

`super()` must be called in the subclass constructor before using `this`.
If the subclass has no constructor, JavaScript calls `super()` automatically.

---

## Q110.6 — What is a constructor?

A constructor is a special method that runs automatically when you create
a new instance of a class with `new`. It initialises the instance's
properties.

```typescript
class CheckoutPage {
  private readonly page: Page;
  private readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    // Store locators as instance properties — created once in the constructor
    this.submitButton = page.getByRole("button", { name: "Place Order" });
  }

  async placeOrder() {
    await this.submitButton.click();
  }
}
```

In TypeScript, you can use the shorthand constructor parameter syntax
to declare and assign properties in one step:

```typescript
class CheckoutPage {
  constructor(
    private readonly page: Page,
    private readonly baseUrl: string = "/checkout"
  ) {}
  // this.page and this.baseUrl are automatically created
}
```

Each call to `new CheckoutPage(page)` runs the constructor and creates
a fresh instance with its own `this.page`.

---

## Q110.7 — What are ES Modules and how do import and export work?

ES Modules are the standard module system in modern JavaScript and
TypeScript. Each file is its own module with its own scope. To share
code between files, you export from one file and import in another.

**Named exports** — export one or more specific values:

```typescript
// File: tests/helpers/wait.ts
export async function waitForApiIdle(page: Page) { /* ... */ }
export const DEFAULT_TIMEOUT = 30_000;

// Import
import { waitForApiIdle, DEFAULT_TIMEOUT } from './helpers/wait';
```

**Default export** — one main export per file:

```typescript
// File: tests/pages/LoginPage.ts
export default class LoginPage { /* ... */ }

// Import — can use any name
import LoginPage from './pages/LoginPage';
import Login from './pages/LoginPage'; // also valid
```

In a Playwright TypeScript project, use **named exports** for everything
except page object classes where the default export is natural. Avoid
mixing default and named exports in the same file — it creates confusion.

---

## Q110.8 — What is the difference between default export and named export?

| | Default export | Named export |
|---|---|---|
| Syntax (export) | `export default class X {}` | `export class X {}` |
| Syntax (import) | `import X from './file'` | `import { X } from './file'` |
| Name on import | Any name is valid | Must match the exported name |
| Per file | Only one allowed | Many allowed |
| Refactor safety | Riskier (name can drift) | Safer (name is enforced) |

```typescript
// Named export — import must match
export function createUser() { ... }
import { createUser } from './users'; // ✅
import { makeUser } from './users';   // ❌ Error — no export called makeUser

// Default export — import can use any name
export default function createUser() { ... }
import createUser from './users';  // ✅
import buildUser  from './users';  // ✅ also valid — any name works
```

For test projects, named exports are preferred for utilities. Many
teams use default exports for page object classes as a convention
(one class per file, imported with the class name).

---

## Q110.9 — What is the difference between import/export and require/module.exports?

`import/export` is the ES Module (ESM) syntax — modern, standard,
TypeScript-native.

`require/module.exports` is the CommonJS (CJS) syntax — older, Node.js
default before ESM was standardised.

```javascript
// CommonJS (CJS)
const { test } = require('@playwright/test');
module.exports = { LoginPage };

// ES Modules (ESM)
import { test } from '@playwright/test';
export { LoginPage };
```

In a Playwright TypeScript project, always use `import/export`. The
TypeScript compiler handles everything. Your `tsconfig.json` sets
`"module": "commonjs"` or `"module": "ESNext"` to control how TypeScript
compiles the imports, but you always write `import` in your source.

`require()` appears in old JavaScript code and in config files that
Node.js runs directly before compilation. Never mix `import` and `require`
in the same file — it creates confusing errors.

---

## Q110.10 — What is lexical scope and how does it relate to classes?

Lexical scope means a variable's scope is determined by where it is
written in the source code — not where the function is called from.

```javascript
const appUrl = "https://example.com"; // outer scope

function navigate() {
  // appUrl is accessible here — it is in the lexical scope
  console.log(appUrl);
}
```

In classes, lexical scope determines what a method can access. A class
method can access:
- The instance's own properties via `this.property`
- Any variable in the outer scope where the class is defined (module
  scope or function scope)

Arrow function class properties use lexical scope for `this`:

```typescript
class LoginPage {
  constructor(private page: Page) {}

  // Arrow property — this is always the LoginPage instance (lexical binding)
  login = async () => {
    await this.page.goto("/login"); // this refers to the LoginPage instance
  };
}

const loginPage = new LoginPage(page);
const fn = loginPage.login; // detach the method
await fn(); // this still refers to loginPage — lexical binding preserved
```

---

## Q110.11 — What is wrong with putting test logic inside a page object class?

A page object class should only contain: locators and methods that
perform actions on the page. It should not contain assertions or test
decision logic.

```typescript
// ❌ Test logic inside a page object — wrong
class DashboardPage {
  async validateDashboard() {
    // This is an assertion — it belongs in the test, not the page object
    await expect(this.page.getByRole("heading")).toHaveText("Dashboard");
    await expect(this.page.getByTestId("user-count")).toBeVisible();
    if (process.env.ROLE === "admin") {
      await expect(this.page.getByTestId("admin-panel")).toBeVisible();
    }
  }
}
```

Problems:
- The page object makes assumptions about what the test should assert
- The `if` condition hides conditional behaviour — the test cannot see it
- Reusing the page object in a test that checks a different condition
  requires modifying the class instead of the test

```typescript
// ✅ Page object — actions only
class DashboardPage {
  readonly heading   = this.page.getByRole("heading");
  readonly userCount = this.page.getByTestId("user-count");
  readonly adminPanel = this.page.getByTestId("admin-panel");

  async goto() { await this.page.goto("/dashboard"); }
}

// ✅ Test — assertions stay in the test
test("admin sees admin panel", async ({ page }) => {
  const dashboard = new DashboardPage(page);
  await dashboard.goto();
  await expect(dashboard.heading).toHaveText("Dashboard");
  await expect(dashboard.adminPanel).toBeVisible();
});
```

---

## Q110.12 — What is the difference between extends and composition?

**Inheritance (`extends`)** — one class is built on top of another.
The subclass gets all the superclass's methods and can override them.

**Composition** — a class holds a reference to another object and delegates
work to it. The class "has a" helper, rather than "is a" type of helper.

```typescript
// Inheritance — LoginPage IS A BasePage
class LoginPage extends BasePage {
  async login() { await this.goto(); /* ... */ }
}

// Composition — LoginPage HAS A FormHelper
class LoginPage {
  private readonly form: FormHelper;
  constructor(page: Page) {
    this.form = new FormHelper(page);
  }
  async login(email: string, password: string) {
    await this.form.fill("Email", email);
    await this.form.fill("Password", password);
  }
}
```

**Use `extends`** for `BasePage` → specific page — when the relationship
is genuinely "is a type of" and shared methods make sense.

**Use composition** for mixing in helpers (form filling, table reading,
date picker) — these are capabilities, not types. Prefer composition
when the relationship is "uses a" rather than "is a". Deeply nested
inheritance chains become hard to reason about quickly.

---

## Q110.13 — Write a simple page object class with a constructor, locators, and methods

```typescript
// File: tests/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  // Locators defined as readonly properties — created once, reused in methods
  private readonly emailInput:    Locator;
  private readonly passwordInput: Locator;
  private readonly signInButton:  Locator;
  private readonly errorMessage:  Locator;

  constructor(private readonly page: Page) {
    this.emailInput    = page.getByLabel("Email");
    this.passwordInput = page.getByLabel("Password");
    this.signInButton  = page.getByRole("button", { name: "Sign In" });
    this.errorMessage  = page.getByRole("alert");
  }

  async goto() {
    await this.page.goto("/login");
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  async getErrorText(): Promise<string | null> {
    return this.errorMessage.textContent();
  }
}
```

---

## Q110.14 — Write a module that exports shared test utilities

```typescript
// File: tests/helpers/api.ts
// Shared API utilities — named exports only, no class needed

import { APIRequestContext } from '@playwright/test';

interface CreateUserPayload {
  email: string;
  role?: "admin" | "viewer";
}

export async function createUser(
  request: APIRequestContext,
  payload: CreateUserPayload
): Promise<{ id: string; email: string }> {
  const response = await request.post("/api/users", { data: payload });

  if (!response.ok()) {
    throw new Error(`createUser failed: ${response.status()} ${await response.text()}`);
  }

  return response.json();
}

export async function deleteUser(
  request: APIRequestContext,
  userId: string
): Promise<void> {
  const response = await request.delete(`/api/users/${userId}`);

  if (!response.ok()) {
    throw new Error(`deleteUser failed: ${response.status()}`);
  }
}

export function generateEmail(prefix = "user"): string {
  return `${prefix}+${Date.now()}@test.example.com`;
}
```

```typescript
// Usage in tests
import { createUser, deleteUser, generateEmail } from '../helpers/api';

test("admin can view new users", async ({ request, page }) => {
  const email = generateEmail("testadmin");
  const user  = await createUser(request, { email, role: "admin" });

  await page.goto(`/admin/users/${user.id}`);
  await expect(page.getByText(email)).toBeVisible();

  await deleteUser(request, user.id); // cleanup
});
```

---

## Q110.15 — Describe how your project uses classes and modules to organise test code

In our project, the code is organised into four layers, each with a clear
responsibility.

**Pages layer (`tests/pages/`)** — one TypeScript class per page or major
component. Each class has private locators and public methods. All page
classes extend `BasePage` which holds the `page` reference and a common
`goto()` method. Page objects never contain assertions.

**Helpers layer (`tests/helpers/`)** — plain modules with named exported
functions. `api.ts` for request helpers, `text.ts` for text normalisation,
`retry.ts` for backoff utilities. No classes here — functions are enough.

**Data layer (`tests/data/`)** — factory functions that return typed
data objects. `createUser()`, `createOrder()`. TypeScript interfaces
define every shape.

**Fixtures layer (`tests/fixtures/`)** — Playwright fixtures that
instantiate page objects and inject them into tests. The fixture is the
only code that calls `new LoginPage(page)`. Tests receive the instance
ready to use.

When a new team member joins, the rule is simple: test logic in test
files, page actions in page classes, utilities in helpers, data in
data files. No cross-contamination. This structure means any test file
can be read and understood without knowing the rest of the codebase.

---

## Chapter Summary — Key Points for Your Interview

- Classes are blueprints for objects. In test automation, one class per
  page object. Use `extends` for BasePage inheritance.
- Constructors run when you call `new`. Store the `page` reference and
  create locators in the constructor.
- Page objects own locators and actions. They do not own assertions. Keep
  assertions in test files.
- ES Modules: `export` to share, `import` to use. Named exports are safer
  for refactoring. Default exports work well for classes (one per file).
- Use `extends` when the relationship is genuinely "is a type of". Use
  composition when the class "uses a" helper — avoid deep inheritance chains.
- `import/export` is the standard. Never mix with `require/module.exports`
  in TypeScript files.

---

