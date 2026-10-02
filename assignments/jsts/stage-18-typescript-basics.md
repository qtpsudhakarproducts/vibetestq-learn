# Stage 18 — TypeScript Basics

> Save files as .ts and run with: npx ts-node filename.ts

---

## Q183. Write a program to declare variables with explicit TypeScript types

```ts
let username: string   = "Sudhakar";
let age: number        = 30;
let isLoggedIn: boolean = true;
let data: any          = "can be anything";
data = 42;
data = true;

let safeInput: unknown = "hello";
// safeInput.toUpperCase(); // Error: Object is of type unknown

if (typeof safeInput === "string") {
    console.log(safeInput.toUpperCase()); // OK after type check
}

function printLog(msg: string): void {
    console.log("Log:", msg);
}

function crash(msg: string): never {
    throw new Error(msg);
}

printLog("Test started");
console.log(username, age, isLoggedIn);
```

**Output:**
```
HELLO
Log: Test started
Sudhakar 30 true
```

---

## Q184. Write a program to show the difference between any and unknown

```ts
function processAny(value: any) {
    console.log(value.toUpperCase()); // no TypeScript error, may crash at runtime
}

function processUnknown(value: unknown) {
    // console.log(value.toUpperCase()); // TypeScript Error!
    if (typeof value === "string") {
        console.log(value.toUpperCase()); // OK after type narrowing
    } else {
        console.log("Not a string:", value);
    }
}

processAny("hello");
processUnknown("hello");
processUnknown(42);
```

**Output:**
```
HELLO
HELLO
Not a string: 42
```

---

## Q185. Write a program to create an interface and a type alias and show the difference

```ts
interface UserInterface {
    id: number;
    name: string;
}
interface UserInterface {
    email: string;  // declaration merging — adds to existing interface
}

type UserType = {
    id: number;
    name: string;
};

const u1: UserInterface = { id: 1, name: "Alice", email: "a@b.com" };
const u2: UserType      = { id: 2, name: "Bob" };

interface AdminInterface extends UserInterface { role: string; }
type AdminType = UserType & { role: string };

const admin1: AdminInterface = { id: 3, name: "Carol", email: "c@b.com", role: "admin" };
const admin2: AdminType      = { id: 4, name: "Dave",  role: "superadmin" };

console.log(u1, u2, admin1.role, admin2.role);
```

**Output:**
```
{ id: 1, name: "Alice", email: "a@b.com" }
{ id: 2, name: "Bob" }
admin
superadmin
```

---

## Q186. Write a program to use optional, readonly and default properties in an interface

```ts
interface BrowserConfig {
    readonly browser: string;
    headless: boolean;
    timeout?: number;
    viewport?: { width: number; height: number };
}

function createConfig(browser: string, headless: boolean): BrowserConfig {
    return { browser, headless };
}

const config = createConfig("chromium", true);
console.log("browser: ", config.browser);
console.log("headless:", config.headless);
console.log("timeout: ", config.timeout);

config.headless = false;
// config.browser = "firefox"; // Error: readonly

const config2: BrowserConfig = {
    browser: "webkit",
    headless: false,
    timeout: 30000,
    viewport: { width: 1280, height: 720 }
};
console.log("config2 timeout:  ", config2.timeout);
console.log("config2 viewport: ", config2.viewport);
```

**Output:**
```
browser:  chromium
headless: true
timeout:  undefined
config2 timeout:   30000
config2 viewport:  { width: 1280, height: 720 }
```

---

## Q187. Write a program to create a generic function

```ts
function getFirst<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[0] : undefined;
}

function getLast<T>(arr: T[]): T | undefined {
    return arr.length > 0 ? arr[arr.length - 1] : undefined;
}

function contains<T>(arr: T[], item: T): boolean {
    return arr.includes(item);
}

// Generic constraint: T must have this property/extend this type
function getLongest<T extends { length: number }>(a: T, b: T): T {
    return a.length >= b.length ? a : b;
}

console.log(getFirst(["chromium", "firefox", "webkit"]));
console.log(getFirst([10, 20, 30]));
console.log(getLast(["a", "b", "c"]));
console.log(contains([1, 2, 3, 4, 5], 3));
console.log(contains(["pass", "fail"], "skip"));
console.log(getLongest("hello", "hi"));
```

**Output:**
```
chromium
10
c
true
false
hello
```

---

## Q188. Write a program to create a generic Stack class

```ts
class Stack<T> {
    private items: T[] = [];

    push(item: T): void        { this.items.push(item); }
    pop(): T | undefined       { return this.items.pop(); }
    peek(): T | undefined      { return this.items[this.items.length - 1]; }
    get size(): number         { return this.items.length; }
    isEmpty(): boolean         { return this.items.length === 0; }
}

const numStack = new Stack<number>();
numStack.push(1);
numStack.push(2);
numStack.push(3);
console.log("peek:", numStack.peek());
console.log("size:", numStack.size);
numStack.pop();
console.log("after pop size:", numStack.size);

const strStack = new Stack<string>();
strStack.push("login");
strStack.push("search");
console.log("str peek:", strStack.peek());
// numStack.push("hello"); // TypeScript Error
```

**Output:**
```
peek: 3
size: 3
after pop size: 2
str peek: search
```

---

## Q189. Write a program to use union types and intersection types

```ts
type Status = "pass" | "fail" | "skip";

function printStatus(status: Status): void {
    if (status === "pass")      console.log("✓ Test passed");
    else if (status === "fail") console.log("✗ Test failed");
    else                        console.log("○ Test skipped");
}

type ID = string | number;
function printId(id: ID): void {
    console.log("ID:", id);
}

interface HasName  { name: string; }
interface HasEmail { email: string; }
interface HasRole  { role: string; }
type FullUser = HasName & HasEmail & HasRole;

const user: FullUser = { name: "Alice", email: "a@b.com", role: "admin" };

printStatus("pass");
printStatus("fail");
printStatus("skip");
printId("TEST-001");
printId(42);
console.log(user.name, user.role);
```

**Output:**
```
✓ Test passed
✗ Test failed
○ Test skipped
ID: TEST-001
ID: 42
Alice admin
```

---

## Q190. Write a program to use utility types Partial, Pick, Omit and Record

```ts
interface TestConfig {
    id: number;
    name: string;
    browser: string;
    headless: boolean;
    timeout: number;
}

// Partial<T> makes every property optional (adds ? to all fields)
function updateConfig(existing: TestConfig, changes: Partial<TestConfig>): TestConfig {
    return { ...existing, ...changes };
}

// Pick<T, keys> creates a new type with only the specified fields
type ConfigSummary = Pick<TestConfig, "name" | "browser">;
// Omit<T, keys> creates a new type WITHOUT the specified fields
type NewConfig     = Omit<TestConfig, "id">;
// Record<K, V> creates a type that maps keys of type K to values of type V
type BrowserResults = Record<string, number>;

const base: TestConfig = { id: 1, name: "Smoke Tests", browser: "chromium", headless: true, timeout: 30000 };
const updated = updateConfig(base, { browser: "firefox", timeout: 60000 });

const summary: ConfigSummary = { name: "Smoke", browser: "webkit" };
const results: BrowserResults = { chromium: 45, firefox: 38, webkit: 42 };

console.log("Updated browser:", updated.browser);
console.log("Updated timeout:", updated.timeout);
console.log("Summary:        ", summary);
console.log("Results:        ", results);
```

**Output:**
```
Updated browser: firefox
Updated timeout: 60000
Summary:         { name: "Smoke", browser: "webkit" }
Results:         { chromium: 45, firefox: 38, webkit: 42 }
```

---

## Q191. Write a program to create type guard functions

```ts
interface TestResult { name: string; status: string; }

// "value is string" is a type predicate — tells TypeScript what type the value is after this check
function isString(value: unknown): value is string   { return typeof value === "string"; }
function isNumber(value: unknown): value is number   { return typeof value === "number"; }
function isTestResult(value: unknown): value is TestResult {
    return typeof value === "object" && value !== null && "name" in value && "status" in value;
}

const mixed: unknown[] = ["pass", 42, { name: "Login", status: "pass" }, null, true];

mixed.forEach(item => {
    if (isString(item))          console.log("String:    ", item.toUpperCase());
    else if (isNumber(item))     console.log("Number:    ", item * 2);
    else if (isTestResult(item)) console.log("TestResult:", item.name, item.status);
    else                         console.log("Unknown:   ", item);
});
```

**Output:**
```
String:     PASS
Number:     84
TestResult: Login pass
Unknown:    null
Unknown:    true
```
