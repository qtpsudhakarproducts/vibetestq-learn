# Stage 19 — TypeScript Advanced

---

## Q192. Write a program to use a discriminated union for test steps

```ts
// The "kind" field is the discriminant — TypeScript uses it to narrow the union type
type NavigateStep = { kind: "navigate"; url: string };
type ClickStep    = { kind: "click";    selector: string };
type TypeStep     = { kind: "type";     selector: string; text: string };
type AssertStep   = { kind: "assert";   expected: string; actual: string };
type TestStep     = NavigateStep | ClickStep | TypeStep | AssertStep;

function executeStep(step: TestStep): string {
    switch (step.kind) {
        case "navigate": return "Navigating to " + step.url;
        case "click":    return "Clicking " + step.selector;
        case "type":     return "Typing '" + step.text + "' into " + step.selector;
        case "assert":   return step.expected === step.actual
            ? "Assert passed: " + step.expected + " === " + step.actual
            : "Assert FAILED: expected " + step.expected + " got " + step.actual;
        default:
            // Exhaustive check: TypeScript errors here if a new case is added but not handled
            const _check: never = step;
            return _check;
    }
}

console.log(executeStep({ kind: "navigate", url: "https://example.com" }));
console.log(executeStep({ kind: "click",    selector: "#login-btn" }));
console.log(executeStep({ kind: "type",     selector: "#username", text: "admin" }));
console.log(executeStep({ kind: "assert",   expected: "Welcome", actual: "Welcome" }));
```

**Output:**
```
Navigating to https://example.com
Clicking #login-btn
Typing 'admin' into #username
Assert passed: Welcome === Welcome
```

---

## Q193. Write a program to use numeric and string enums

```ts
enum TestStatus {
    Passed  = "PASSED",
    Failed  = "FAILED",
    Skipped = "SKIPPED",
    Pending = "PENDING"
}

function getStatusIcon(status: TestStatus): string {
    switch (status) {
        case TestStatus.Passed:  return "✓";
        case TestStatus.Failed:  return "✗";
        case TestStatus.Skipped: return "○";
        case TestStatus.Pending: return "◌";
    }
}

function getStatusLabel(status: TestStatus): string {
    if (status === TestStatus.Failed) return "Test Failed — check logs";
    return status.toString();
}

console.log(getStatusIcon(TestStatus.Passed));
console.log(getStatusIcon(TestStatus.Failed));
console.log(getStatusIcon(TestStatus.Skipped));
console.log(getStatusLabel(TestStatus.Failed));
console.log(getStatusLabel(TestStatus.Passed));
```

**Output:**
```
✓
✗
○
Test Failed — check logs
PASSED
```

---

## Q194. Write a program to use keyof to create a type-safe property accessor

```ts
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
}

function setProperty<T, K extends keyof T>(obj: T, key: K, value: T[K]): T {
    return { ...obj, [key]: value };
}

const config = { browser: "chromium", timeout: 30000, headless: true };

console.log(getProperty(config, "browser"));
console.log(getProperty(config, "timeout"));
// getProperty(config, "speed"); // TypeScript Error

const updated = setProperty(config, "browser", "firefox");
console.log(updated.browser);
```

**Output:**
```
chromium
30000
firefox
```

---

## Q195. Write a program to create mapped types

```ts
type Optional<T>   = { [K in keyof T]?: T[K] };
type Nullable<T>   = { [K in keyof T]: T[K] | null };
type Stringify<T>  = { [K in keyof T]: string };

interface TestResult {
    name: string;
    status: string;
    duration: number;
}

const partial:    Optional<TestResult>  = { name: "Login" };
const nullable:   Nullable<TestResult>  = { name: null, status: null, duration: null };
const stringified: Stringify<TestResult> = { name: "Login", status: "pass", duration: "120" };

console.log("partial:    ", partial);
console.log("nullable:   ", nullable);
console.log("stringified:", stringified);
```

**Output:**
```
partial:     { name: "Login" }
nullable:    { name: null, status: null, duration: null }
stringified: { name: "Login", status: "pass", duration: "120" }
```

---

## Q196. Write a program to use conditional types

```ts
// Conditional type: evaluated at compile time based on whether T extends the condition
type IsString<T> = T extends string ? "yes" : "no";
type IsArray<T>  = T extends any[]  ? "yes" : "no";
// infer R captures the type inside Promise<R> — TypeScript figures out R from the actual type
type Unwrap<T>   = T extends Promise<infer R> ? R : T;

type T1 = IsString<string>;    // "yes"
type T2 = IsString<number>;    // "no"
type T3 = IsArray<string[]>;   // "yes"
type T4 = IsArray<string>;     // "no"
type T5 = Unwrap<Promise<string>>; // string
type T6 = Unwrap<number>;          // number

function checkString<T>(val: T): IsString<T> {
    return (typeof val === "string" ? "yes" : "no") as IsString<T>;
}

console.log(checkString("hello"));
console.log(checkString(42));
console.log("Types verified at compile time");
```

**Output:**
```
yes
no
Types verified at compile time
```

---

## Q197. Write a program to create a class decorator that logs instance creation

```ts
function Logger(target: Function) {
    const original = target as any;
    const wrapped: any = function (...args: any[]) {
        console.log("[Logger] Creating " + original.name + " with args:", JSON.stringify(args));
        return new original(...args);
    };
    wrapped.prototype = original.prototype;
    return wrapped;
}

// Apply decorator manually (@ syntax needs tsconfig experimentalDecorators: true)
let TestRunner = class TestRunner {
    constructor(public suiteName: string, public browser: string) {}
    run() { console.log("Running " + this.suiteName + " on " + this.browser); }
};

TestRunner = Logger(TestRunner) as typeof TestRunner;

const t1 = new TestRunner("Smoke Tests", "chromium");
t1.run();
const t2 = new TestRunner("Regression", "firefox");
t2.run();
```

**Output:**
```
[Logger] Creating TestRunner with args: ["Smoke Tests","chromium"]
Running Smoke Tests on chromium
[Logger] Creating TestRunner with args: ["Regression","firefox"]
Running Regression on firefox
```

---

## Q198. Write a program to use ReturnType and Parameters utility types

```ts
function createTestResult(name: string, status: "pass" | "fail", duration: number) {
    return { name, status, duration };
}

function parseConfig(json: string, strict: boolean) {
    return { json, strict };
}

type TestResultShape = ReturnType<typeof createTestResult>;
type CreateParams    = Parameters<typeof createTestResult>;
type ParseParams     = Parameters<typeof parseConfig>;

function wrapWithLogging<T extends (...args: any[]) => any>(fn: T): T {
    return function (...args: Parameters<T>): ReturnType<T> {
        console.log("Calling " + fn.name + " with", args);
        const result = fn(...args);
        console.log("Result:", result);
        return result;
    } as T;
}

const loggedCreate = wrapWithLogging(createTestResult);
loggedCreate("Login test", "pass", 120);
```

**Output:**
```
Calling createTestResult with ["Login test", "pass", 120]
Result: { name: "Login test", status: "pass", duration: 120 }
```

---

## Q199. Write a program to use template literal types

```ts
type EventName  = `on${string}`;
type CSSMargin  = `margin-${"top" | "right" | "bottom" | "left"}`;
type HttpMethod = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

function addListener(event: EventName, handler: () => void) {
    console.log("Listening to:", event);
    handler();
}

function applyMargin(prop: CSSMargin, value: string) {
    console.log(prop + ":", value);
}

addListener("onClick",  () => console.log("clicked!"));
addListener("onChange", () => console.log("changed!"));
// addListener("click", () => {}); // TypeScript Error

applyMargin("margin-top",    "10px");
applyMargin("margin-bottom", "20px");
// applyMargin("margin-center", "0"); // TypeScript Error
```

**Output:**
```
Listening to: onClick
clicked!
Listening to: onChange
changed!
margin-top:    10px
margin-bottom: 20px
```

---

## Q200. Write a program to use the satisfies operator

```ts
type Config = {
    browser: "chromium" | "firefox" | "webkit";
    timeout: number;
    headless: boolean;
};

// Without satisfies — browser type becomes string (widened)
const c1: Config = { browser: "chromium", timeout: 30000, headless: true };
// c1.browser is "chromium" | "firefox" | "webkit"

// With satisfies — browser keeps literal type "chromium"
// satisfies validates against Config but preserves literal types (better than "as Config")
const c2 = { browser: "chromium", timeout: 30000, headless: true } satisfies Config;
// c2.browser is "chromium" (not widened)

// satisfies also catches errors
try {
    // const c3 = { browser: "edge", timeout: 30000, headless: true } satisfies Config;
    // TypeScript Error: "edge" is not assignable
    console.log("satisfies validates at compile time");
} catch (e) {}

console.log("c1.browser type: string literal union");
console.log("c2.browser type: 'chromium' (preserved)");
console.log("c2.browser value:", c2.browser);
```

**Output:**
```
satisfies validates at compile time
c1.browser type: string literal union
c2.browser type: 'chromium' (preserved)
c2.browser value: chromium
```
