# Stage 20 — TypeScript: Test Automation Specific

---

## Q201. Write a program to define a TestResult type and print a summary

```ts
type TestResult = {
    name: string;
    // Union type: status can ONLY be one of these three string values — TypeScript blocks other values
    status: "pass" | "fail" | "skip";
    duration: number;
    error?: string;
};

function printSummary(results: TestResult[]): void {
    const passed  = results.filter(r => r.status === "pass").length;
    const failed  = results.filter(r => r.status === "fail").length;
    const skipped = results.filter(r => r.status === "skip").length;
    const total   = results.reduce((acc, r) => acc + r.duration, 0);
    const failures = results.filter(r => r.status === "fail");

    console.log("Total:   ", results.length);
    console.log("Passed:  ", passed);
    console.log("Failed:  ", failed);
    console.log("Skipped: ", skipped);
    console.log("Duration:", total + "ms");
    if (failures.length > 0) {
        console.log("Failed tests:");
        failures.forEach(r => console.log("  -", r.name + ":", r.error));
    }
}

const results: TestResult[] = [
    { name: "Login",   status: "pass", duration: 120 },
    { name: "Logout",  status: "fail", duration: 340, error: "Element not found" },
    { name: "Search",  status: "pass", duration: 89  },
    { name: "Payment", status: "fail", duration: 560, error: "Timeout" },
    { name: "Profile", status: "skip", duration: 0   },
];

printSummary(results);
```

**Output:**
```
Total:    5
Passed:   2
Failed:   2
Skipped:  1
Duration: 1109ms
Failed tests:
  - Logout:   Element not found
  - Payment:  Timeout
```

---

## Q202. Write a program to extend an interface from TestCase to ApiTestCase

```ts
interface TestCase {
    id: string;
    title: string;
    tags?: string[];
    priority?: "low" | "medium" | "high";
}

interface ApiTestCase extends TestCase {
    url: string;
    method: "GET" | "POST" | "PUT" | "DELETE";
    expectedStatus: number;
    requestBody?: object;
}

function printTestCase(tc: TestCase): void {
    console.log("ID:", tc.id, "| Title:", tc.title, "| Priority:", tc.priority ?? "none");
}

function runApiTest(tc: ApiTestCase): void {
    console.log(tc.method, tc.url, "| Expected:", tc.expectedStatus);
}

const basic: TestCase = { id: "TC-001", title: "Login test", priority: "high" };
const api: ApiTestCase = { id: "TC-002", title: "Get users", url: "/api/users", method: "GET", expectedStatus: 200 };

printTestCase(basic);
printTestCase(api);  // ApiTestCase can be passed as TestCase
runApiTest(api);
// runApiTest(basic); // TypeScript Error — basic is not ApiTestCase
```

**Output:**
```
ID: TC-001 | Title: Login test  | Priority: high
ID: TC-002 | Title: Get users   | Priority: none
GET /api/users | Expected: 200
```

---

// as const makes array readonly and preserves literal types — "chromium" not widened to string
## Q203. Write a program to use as const for a browser configuration list

```ts
// as const makes array readonly and preserves literal types — "chromium" not widened to string
const BROWSERS = ["chromium", "firefox", "webkit"] as const;
type Browser = typeof BROWSERS[number];

function validateBrowser(b: string): b is Browser {
    return (BROWSERS as readonly string[]).includes(b);
}

function runOn(browser: Browser): void {
    console.log("Running on:", browser);
}

console.log(validateBrowser("chromium"));
console.log(validateBrowser("edge"));

runOn("chromium");
runOn("firefox");
// runOn("safari"); // TypeScript Error

// BROWSERS.push("edge"); // TypeScript Error — readonly
console.log("Browsers:", BROWSERS);
```

**Output:**
```
true
false
Running on: chromium
Running on: firefox
Browsers: ["chromium", "firefox", "webkit"]
```

---

## Q204. Write a program to use an index signature for page locators

```ts
// Index signature: allows any string key with string value — like a dictionary type
type PageLocators = { [key: string]: string };

const loginLocators: PageLocators = {
    usernameField: "#username",
    passwordField: "#password",
    loginButton:   ".btn-login",
    errorMessage:  ".error-msg"
};

function getLocator(page: PageLocators, name: string): string {
    if (!page[name]) throw new Error('Locator "' + name + '" not found');
    return page[name];
}

console.log(getLocator(loginLocators, "loginButton"));
console.log(getLocator(loginLocators, "usernameField"));

try {
    getLocator(loginLocators, "submitBtn");
} catch (e) {
    console.log((e as Error).message);
}
```

**Output:**
```
.btn-login
#username
Locator "submitBtn" not found
```

---

## Q205. Write a program to create a generic waitFor function

```ts
async function waitFor<T>(
    // Generic return type T is inferred from what fn() returns
    fn: () => Promise<T>,
    timeout: number = 3000,
    interval: number = 100
// Generic return type T is inferred from what fn() returns
): Promise<T> {
    const start = Date.now();
    let lastError: Error | undefined;

    while (Date.now() - start < timeout) {
        try {
            return await fn();
        } catch (e) {
            lastError = e as Error;
            console.log("Not ready...");
            await new Promise(r => setTimeout(r, interval));
        }
    }
    throw new Error("Timeout after " + timeout + "ms. Last error: " + lastError?.message);
}

let attempts = 0;
async function flakyCheck(): Promise<string> {
    attempts++;
    if (attempts < 3) throw new Error("not ready");
    return "element found";
}

waitFor(flakyCheck, 3000, 100)
    .then(r => console.log("Result:", r))
    .catch(e => console.log("Error:", e.message));
```

**Output:**
```
Not ready...
Not ready...
Result: element found
```

---

## Q206. Write a program to create a Config type where only baseUrl is required

```ts
interface FullConfig {
    baseUrl: string;
    browser: string;
    headless: boolean;
    timeout: number;
    retries: number;
}

// Required removes optional (?) from fields, Pick selects specific fields
type TestConfig = Required<Pick<FullConfig, "baseUrl">> & Partial<Omit<FullConfig, "baseUrl">>;

function buildConfig(config: TestConfig): FullConfig {
    return {
        baseUrl:  config.baseUrl,
        browser:  config.browser  ?? "chromium",
        headless: config.headless ?? true,
        timeout:  config.timeout  ?? 30000,
        retries:  config.retries  ?? 0,
    };
}

console.log(buildConfig({ baseUrl: "https://example.com" }));
console.log(buildConfig({ baseUrl: "https://prod.com", browser: "firefox", timeout: 60000 }));
// buildConfig({}); // TypeScript Error — baseUrl is missing
```

**Output:**
```
{ baseUrl: "https://example.com", browser: "chromium", headless: true, timeout: 30000, retries: 0 }
{ baseUrl: "https://prod.com",    browser: "firefox",  headless: true, timeout: 60000, retries: 0 }
```

---

## Q207. Write a program to create an overloaded function

```ts
function getElement(selector: string): { type: "css";   selector: string };
function getElement(index: number):    { type: "index";  index: number    };
function getElement(input: string | number) {
    if (typeof input === "string") return { type: "css",   selector: input };
    else                            return { type: "index", index: input };
}

console.log(getElement("#login-btn"));
console.log(getElement(0));
console.log(getElement(".active"));
console.log(getElement(3));
```

**Output:**
```
{ type: "css",   selector: "#login-btn" }
{ type: "index", index: 0 }
{ type: "css",   selector: ".active" }
{ type: "index", index: 3 }
```

---

## Q208. Write a program to create a DeepReadonly utility type

```ts
type DeepReadonly<T> = {
    // Recursion: if value is an object, apply DeepReadonly to it too
    readonly [K in keyof T]: T[K] extends object ? DeepReadonly<T[K]> : T[K];
};

interface Config {
    server: { host: string; port: number };
    flags:  { headless: boolean };
}

const shallow: Readonly<Config> = {
    server: { host: "localhost", port: 3000 },
    flags:  { headless: true }
};
// shallow.server = {}; // Error — top-level readonly
shallow.server.port = 9000; // NO ERROR — nested not protected!
console.log("Shallow nested port changed to:", shallow.server.port);

const deep: DeepReadonly<Config> = {
    server: { host: "localhost", port: 3000 },
    flags:  { headless: true }
};
// deep.server = {};      // Error
// deep.server.port = 9000; // Error — nested IS protected
console.log("DeepReadonly protects all levels");
```

**Output:**
```
Shallow nested port changed to: 9000
DeepReadonly protects all levels
```

---

## Q209. Write a program to create a typed test data factory

```ts
interface User {
    id: number;
    name: string;
    email: string;
    role: "admin" | "user" | "guest";
    active: boolean;
}

function createFactory<T>(defaults: T): (overrides?: Partial<T>) => T {
    return function (overrides: Partial<T> = {}): T {
        return { ...defaults, ...overrides };
    };
}

const createUser = createFactory<User>({
    id: 1, name: "Test User", email: "test@example.com", role: "user", active: true
});

console.log(createUser());
console.log(createUser({ role: "admin" }));
console.log(createUser({ name: "Alice", email: "alice@example.com", active: false }));
```

**Output:**
```
{ id: 1, name: "Test User", email: "test@example.com", role: "user",  active: true }
{ id: 1, name: "Test User", email: "test@example.com", role: "admin", active: true }
{ id: 1, name: "Alice",     email: "alice@example.com", role: "user", active: false }
```

---

## Q210. Write a complete Page Object Model class in TypeScript

```ts
// In a real Playwright project, import from "@playwright/test"
// For this example we define a minimal Page type
interface Locator {
    fill(text: string): Promise<void>;
    click(): Promise<void>;
    textContent(): Promise<string | null>;
    isVisible(): Promise<boolean>;
}
interface Page {
    goto(url: string): Promise<void>;
    locator(selector: string): Locator;
}

class LoginPage {
    private readonly usernameInput = "#username";
    private readonly passwordInput = "#password";
    private readonly loginButton   = ".btn-login";
    private readonly errorMessage  = ".error-msg";
    private readonly dashboard     = ".dashboard";

    constructor(private page: Page) {}

    async navigate(): Promise<void> {
        await this.page.goto("https://example.com/login");
        console.log("Navigated to login page");
    }

    async login(username: string, password: string): Promise<void> {
        await this.page.locator(this.usernameInput).fill(username);
        await this.page.locator(this.passwordInput).fill(password);
        await this.page.locator(this.loginButton).click();
        console.log("Logged in as:", username);
    }

    async getErrorMessage(): Promise<string> {
        const text = await this.page.locator(this.errorMessage).textContent();
        return text ?? "";
    }

    async isLoggedIn(): Promise<boolean> {
        return this.page.locator(this.dashboard).isVisible();
    }
}

// Usage example:
// const loginPage = new LoginPage(page);
// await loginPage.navigate();
// await loginPage.login("admin", "password");
// const error = await loginPage.getErrorMessage();
// const loggedIn = await loginPage.isLoggedIn();

console.log("LoginPage POM class defined with typed locators and methods");
console.log("Methods: navigate(), login(username, password), getErrorMessage(), isLoggedIn()");
```

**Output:**
```
LoginPage POM class defined with typed locators and methods
Methods: navigate(), login(username, password), getErrorMessage(), isLoggedIn()
```
