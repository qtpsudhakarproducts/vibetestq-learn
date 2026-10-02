# Stage 17 — Modules: ES Modules & CommonJS

> Note: ES Module examples show the file structure. Run with Node.js using "type": "module" in package.json or .mjs extension.

---

## Q168. Write a program to export a function as named export and import it

**mathUtils.js**
```js
// named export: must import with { } and use the exact name
export function add(a, b) { return a + b; }
// named export: must import with { } and use the exact name
export function subtract(a, b) { return a - b; }
```

**main.js**
```js
import { add, subtract } from "./mathUtils.js";

console.log("add(5, 3)      =", add(5, 3));
console.log("subtract(10, 4)=", subtract(10, 4));
```

**Output:**
```
add(5, 3)       = 8
subtract(10, 4) = 6
```

---

## Q169. Write a program to import only specific named exports from a module

**stringUtils.js**
```js
// named export: must import with { } and use the exact name
export function reverse(str)     { return str.split("").reverse().join(""); }
// named export: must import with { } and use the exact name
export function capitalize(str)  { return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase(); }
// named export: must import with { } and use the exact name
export function countWords(str)  { return str.trim().split(/\s+/).length; }
// named export: must import with { } and use the exact name
export function isPalindrome(str){ return str === str.split("").reverse().join(""); }
```

**main.js**
```js
import { capitalize, countWords } from "./stringUtils.js";

console.log(capitalize("hello world"));
console.log(countWords("quick brown fox"));
```

**Output:**
```
Hello world
3
```

---

## Q170. Write a program to export a class as default export and import it

**Calculator.js**
```js
// default export: import without { }, can use any name
export default class Calculator {
    add(a, b)      { return a + b; }
    subtract(a, b) { return a - b; }
    multiply(a, b) { return a * b; }
    divide(a, b)   { return b !== 0 ? a / b : "Cannot divide by zero"; }
}
```

**main.js**
```js
import Calculator from "./Calculator.js";

const calc = new Calculator();
console.log("add:     ", calc.add(10, 5));
console.log("multiply:", calc.multiply(4, 6));
```

**Output:**
```
add:      15
multiply: 24
```

---

## Q171. Write a program to export both default and named exports from the same file

**testHelpers.js**
```js
export const DEFAULT_TIMEOUT = 5000;
// named export: must import with { } and use the exact name
export function formatSelector(sel) { return "[CSS] " + sel; }

// default export: import without { }, can use any name
export default function waitForElement(selector) {
    console.log("Waiting for:", selector, "(timeout:", DEFAULT_TIMEOUT + "ms)");
}
```

**main.js**
```js
import waitForElement, { DEFAULT_TIMEOUT, formatSelector } from "./testHelpers.js";

waitForElement("#submit");
console.log("DEFAULT_TIMEOUT:     ", DEFAULT_TIMEOUT);
console.log("formatSelector:      ", formatSelector(".btn.login"));
```

**Output:**
```
Waiting for: #submit (timeout: 5000ms)
DEFAULT_TIMEOUT:      5000
formatSelector:       [CSS] .btn.login
```

---

// namespace import: all exports bundled into one object
## Q172. Write a program to import all exports as a namespace using import * as

**validators.js**
```js
export const isEmail   = s => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
export const isPhone   = s => /^\d{10}$/.test(s);
export const isUrl     = s => s.startsWith("http");
export const isRequired = s => s !== null && s !== undefined && s !== "";
```

**main.js**
```js
// namespace import: all exports bundled into one object
import * as Validators from "./validators.js";

console.log(Validators.isEmail("test@example.com"));
console.log(Validators.isPhone("9876543210"));
console.log(Validators.isUrl("https://google.com"));
console.log(Validators.isRequired(""));
```

**Output:**
```
true
true
true
false
```

---

## Q173. Write a program to rename a named export during import

**dateUtils.js**
```js
// named export: must import with { } and use the exact name
export function format(date, fmt) {
    const d = String(date.getDate()).padStart(2,"0");
    const m = String(date.getMonth()+1).padStart(2,"0");
    const y = date.getFullYear();
    return fmt.replace("DD",d).replace("MM",m).replace("YYYY",y);
}
// named export: must import with { } and use the exact name
export function diff(d1, d2) {
    return Math.round(Math.abs(new Date(d2) - new Date(d1)) / 86400000);
}
```

**main.js**
```js
import { format as formatDate, diff as dateDiff } from "./dateUtils.js";

console.log(formatDate(new Date(), "DD-MM-YYYY"));
console.log(dateDiff("2024-01-01", "2024-12-31") + " days");
```

**Output:**
```
07-05-2025
365 days
```

---

## Q174. Write a program to re-export everything from multiple modules through an index file

**index.js**
```js
export * from "./arrayUtils.js";
export * from "./stringUtils.js";
export { default as Calculator } from "./Calculator.js";
```

**main.js**
```js
import { add, capitalize, Calculator } from "./index.js";

console.log(add(2, 3));
console.log(capitalize("hello"));
console.log(new Calculator().multiply(4, 5));
```

**Output:**
```
5
Hello
20
```

---

// dynamic import: loads module on demand, returns a Promise
## Q175. Write a program to load a module dynamically using import()

**heavyModule.js**
```js
// named export: must import with { } and use the exact name
export function runAnalysis() {
    return "Analysis complete: 42 results";
}
```

**main.js**
```js
async function main() {
    const condition = true;

    if (!condition) {
        console.log("Condition not met — module NOT loaded");
    } else {
        console.log("Condition met — loading module...");
        // dynamic import: loads module on demand, returns a Promise
        const module = await import("./heavyModule.js");
        console.log("Module loaded!");
        console.log(module.runAnalysis());
    }
}

main();
```

**Output:**
```
Condition met — loading module...
Module loaded!
Analysis complete: 42 results
```

---

## Q176. Write a program to create a side effect import that runs setup code on import

**setupGlobals.js**
```js
global.BASE_URL = "https://test.example.com";
console.log("Environment set up!");
```

**main.js**
```js
import "./setupGlobals.js";

console.log(global.BASE_URL);
```

**Output:**
```
Environment set up!
https://test.example.com
```

---

## Q177. Write a program to export a single function using CommonJS module.exports

**greet.js**
```js
function greet(name) {
    return "Hello, " + name + "!";
}
// CommonJS: set module.exports to whatever you want to export
// WRONG: this just reassigns the local variable — module.exports is unchanged
module.exports = greet;
```

**main.js**
```js
// require() synchronously loads the module file and returns module.exports
const greet = require("./greet");

console.log(greet("Sudhakar"));
console.log(greet("Alice"));
```

**Output:**
```
Hello, Sudhakar!
Hello, Alice!
```

---

## Q178. Write a program to export multiple functions using CommonJS module.exports

**browserUtils.js**
```js
function getBrowserName() { return "chromium"; }
function getVersion()     { return "119.0"; }
function isHeadless()     { return true; }

// CommonJS: set module.exports to whatever you want to export
// WRONG: this just reassigns the local variable — module.exports is unchanged
module.exports = { getBrowserName, getVersion, isHeadless };
```

**main.js**
```js
// require() synchronously loads the module file and returns module.exports
const { getBrowserName, getVersion, isHeadless } = require("./browserUtils");

console.log("Browser:", getBrowserName());
console.log("Version:", getVersion());
console.log("Headless:", isHeadless());
```

**Output:**
```
Browser: chromium
Version: 119.0
Headless: true
```

---

## Q179. Write a program to show the difference between module.exports and exports

**v1.js — works: exports.fn**
```js
exports.greet = function(name) { return "Hello, " + name; };
```

// CommonJS: set module.exports to whatever you want to export
// WRONG: this just reassigns the local variable — module.exports is unchanged
**v2.js — works: module.exports = fn**
```js
// CommonJS: set module.exports to whatever you want to export
// WRONG: this just reassigns the local variable — module.exports is unchanged
module.exports = function(name) { return "Hello, " + name; };
```

// WRONG: this just reassigns the local variable — module.exports is unchanged
**v3.js — BROKEN: exports = fn**
```js
// WRONG: this just reassigns the local variable — module.exports is unchanged
exports = function(name) { return "Hello, " + name; };
// This just reassigns the local variable, module.exports is unchanged
```

**main.js**
```js
// require() synchronously loads the module file and returns module.exports
const { greet } = require("./v1");
console.log(greet("Alice"));    // Hello, Alice

// require() synchronously loads the module file and returns module.exports
const greetV2 = require("./v2");
console.log(greetV2("Alice"));  // Hello, Alice

// require() synchronously loads the module file and returns module.exports
const greetV3 = require("./v3");
console.log(typeof greetV3);    // object — not a function!
```

**Output:**
```
Hello, Alice
Hello, Alice
object
```

---

## Q180. Write a program to use the built-in Node.js os module

```js
// require() synchronously loads the module file and returns module.exports
const os = require("os");

console.log("Platform:      ", os.platform());
console.log("Architecture:  ", os.arch());
console.log("Hostname:      ", os.hostname());
console.log("Home directory:", os.homedir());
console.log("CPUs:          ", os.cpus().length);
console.log("Total memory:  ", (os.totalmem() / 1024 ** 3).toFixed(2) + " GB");
console.log("Free memory:   ", (os.freemem()  / 1024 ** 3).toFixed(2) + " GB");
console.log("Node version:  ", process.version);
```

**Output:**
```
Platform:       linux
Architecture:   x64
Hostname:       my-machine
Home directory: /home/sudhakar
CPUs:           8
Total memory:   16.00 GB
Free memory:    8.43 GB
Node version:   v18.17.0
```

---

## Q181. Write a program to show the difference between ES Modules and CommonJS

**logger.mjs (ES Module)**
```js
export const LEVELS = { INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };
// named export: must import with { } and use the exact name
export function log(level, message) {
    console.log("[" + level + "] " + message);
}
```

**logger.cjs (CommonJS)**
```js
const LEVELS = { INFO: "INFO", WARN: "WARN", ERROR: "ERROR" };
function log(level, message) {
    console.log("[" + level + "] " + message);
}
// CommonJS: set module.exports to whatever you want to export
// WRONG: this just reassigns the local variable — module.exports is unchanged
module.exports = { LEVELS, log };
```

**ESM usage:**
```js
import { log, LEVELS } from "./logger.mjs";
log(LEVELS.INFO, "Test started");   // [INFO] Test started
```

**CJS usage:**
```js
// require() synchronously loads the module file and returns module.exports
const { log, LEVELS } = require("./logger.cjs");
log(LEVELS.INFO, "Test started");   // [INFO] Test started
```

---

## Q182. Write a complete module that exports a config object, a utility function and a class

**testUtils.js**
```js
export const config = { timeout: 30000, retries: 3, screenshotOnFail: true };

// named export: must import with { } and use the exact name
export function formatTestName(suite, test) {
    return "[" + suite + "] " + test;
}

export class TestReporter {
    constructor() { this.passed = 0; this.failed = 0; }
    pass(name) { this.passed++; console.log("✓", name); }
    fail(name, err) { this.failed++; console.log("✗", name, "→", err); }
    summary() { console.log("Results:", this.passed, "passed,", this.failed, "failed,", (this.passed + this.failed), "total"); }
}
```

**main.js**
```js
import { config, formatTestName, TestReporter } from "./testUtils.js";

console.log("Config timeout:", config.timeout);
console.log(formatTestName("Login", "valid credentials"));

const reporter = new TestReporter();
reporter.pass("Login test");
reporter.pass("Search test");
reporter.fail("Payment test", "Element not found");
reporter.summary();
```

**Output:**
```
Config timeout: 30000
[Login] valid credentials
✓ Login test
✓ Search test
✗ Payment test → Element not found
Results: 2 passed, 1 failed, 3 total
```
