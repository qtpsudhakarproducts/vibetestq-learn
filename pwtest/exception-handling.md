# Exception Handling — Complete Study Notes
### JavaScript · TypeScript · Playwright
> 📘 Written for beginners — every concept is explained from the ground up with real examples.

---

## Table of Contents

1. [What is an Exception?](#1-what-is-an-exception)
2. [JavaScript Exception Handling](#2-javascript-exception-handling)
   - 2.1 [What Goes Wrong in Code?](#21-what-goes-wrong-in-code)
   - 2.2 [try / catch / finally](#22-try--catch--finally)
   - 2.3 [The Error Object](#23-the-error-object)
   - 2.4 [Types of Built-in Errors](#24-types-of-built-in-errors)
   - 2.5 [Throwing Your Own Errors](#25-throwing-your-own-errors)
   - 2.6 [Custom Error Classes](#26-custom-error-classes)
   - 2.7 [Nested try/catch](#27-nested-trycatch)
   - 2.8 [Error Handling in Async Code](#28-error-handling-in-async-code)
   - 2.9 [Promise .catch()](#29-promise-catch)
   - 2.10 [Global Error Handlers](#210-global-error-handlers)
   - 2.11 [Common Mistakes](#211-common-mistakes)
3. [TypeScript Exception Handling](#3-typescript-exception-handling)
   - 3.1 [How TypeScript Differs from JavaScript](#31-how-typescript-differs-from-javascript)
   - 3.2 [The unknown Type in catch](#32-the-unknown-type-in-catch)
   - 3.3 [Type Narrowing](#33-type-narrowing)
   - 3.4 [Custom Typed Error Classes](#34-custom-typed-error-classes)
   - 3.5 [Error Hierarchies](#35-error-hierarchies)
   - 3.6 [Type Guard Utilities](#36-type-guard-utilities)
   - 3.7 [The Result Pattern](#37-the-result-pattern)
   - 3.8 [Async TypeScript Error Handling](#38-async-typescript-error-handling)
   - 3.9 [Common TypeScript Mistakes](#39-common-typescript-mistakes)
4. [Playwright Exception Handling](#4-playwright-exception-handling)
   - 4.1 [What is Playwright?](#41-what-is-playwright)
   - 4.2 [Why Errors Happen in Browser Automation](#42-why-errors-happen-in-browser-automation)
   - 4.3 [Playwright Error Types](#43-playwright-error-types)
   - 4.4 [Handling TimeoutError](#44-handling-timeouterror)
   - 4.5 [Element Not Found Errors](#45-element-not-found-errors)
   - 4.6 [Navigation Errors](#46-navigation-errors)
   - 4.7 [Page Event Listeners](#47-page-event-listeners)
   - 4.8 [Dialog Handling](#48-dialog-handling)
   - 4.9 [Network Request Failures](#49-network-request-failures)
   - 4.10 [Soft Assertions](#410-soft-assertions)
   - 4.11 [Retry Logic](#411-retry-logic)
   - 4.12 [Global Config in playwright.config.ts](#412-global-config-in-playwrightconfigts)
   - 4.13 [Custom Fixtures with Error Tracking](#413-custom-fixtures-with-error-tracking)
5. [Quick Reference Cheat Sheet](#5-quick-reference-cheat-sheet)

---

## 1. What is an Exception?

An **exception** (also called an **error**) is an unexpected event that happens while your program is running, which interrupts the normal flow of execution.

Think of it like this: imagine you're following a recipe and you get to step 3 — "add eggs" — but there are no eggs in the fridge. You can't continue. Something unexpected happened and you need to decide what to do next.

In programming, exceptions work the same way:

```
Program runs normally...
→ Something unexpected happens (file missing, network down, wrong data type)
→ An exception is "thrown"
→ If nobody "catches" it → program crashes
→ If it is "caught" → you handle it gracefully and continue
```

### Why Do We Need to Handle Exceptions?

Without exception handling:
- Your program **crashes completely** when something goes wrong
- Users see scary error messages or a blank screen
- Data can be lost or corrupted

With exception handling:
- Your program **recovers** or shows a helpful message
- You can **log** the error for debugging later
- The rest of the program **keeps working**

---

## 2. JavaScript Exception Handling

### 2.1 What Goes Wrong in Code?

Here are everyday examples of things that cause errors in JavaScript:

```javascript
// Trying to use a variable that doesn't exist
console.log(myVariable); // ❌ ReferenceError: myVariable is not defined

// Calling something that is not a function
let name = "Alice";
name();  // ❌ TypeError: name is not a function

// Parsing bad JSON data
JSON.parse("this is not json"); // ❌ SyntaxError: Unexpected token

// Accessing a property of null or undefined
let user = null;
console.log(user.name); // ❌ TypeError: Cannot read properties of null

// Dividing — JavaScript doesn't throw here, but logic errors are common
let result = 10 / 0; // Returns Infinity — not a crash, but may break your logic
```

Without any protection, any of these errors will **stop your program immediately**.

---

### 2.2 try / catch / finally

The most fundamental tool for handling errors in JavaScript is the `try/catch` block.

#### How it works — step by step:

1. Code inside `try` runs normally
2. If an error happens inside `try`, JavaScript **stops at that line** and jumps to `catch`
3. The `catch` block receives the error and lets you handle it
4. The `finally` block always runs — whether there was an error or not

```javascript
try {
  // Step 1: Put risky code here
  let data = JSON.parse("invalid json text");
  console.log(data); // This line is SKIPPED if the line above throws
} catch (error) {
  // Step 2: Handle the error — error is the Error object that was thrown
  console.log("Something went wrong:", error.message);
} finally {
  // Step 3: This runs no matter what — cleanup goes here
  console.log("Done trying.");
}
```

**Output:**
```
Something went wrong: Unexpected token 'i', "invalid json text" is not valid JSON
Done trying.
```

#### The `finally` block — when is it useful?

`finally` is perfect for cleanup work — things that must happen regardless of success or failure.

```javascript
let file = null;

try {
  file = openFile("data.txt");       // Imagine this opens a file
  let content = file.read();         // Read from the file
  processContent(content);           // Do something with the data
} catch (error) {
  console.error("Failed to read file:", error.message);
} finally {
  if (file) {
    file.close();  // ALWAYS close the file, even if an error happened
  }
}
```

#### Can you use try/catch without finally?

Yes! `finally` is optional. Use it only when you need guaranteed cleanup.

```javascript
// Totally valid — no finally needed here
try {
  let result = riskyOperation();
  return result;
} catch (error) {
  console.error("Operation failed:", error.message);
  return null;
}
```

---

### 2.3 The Error Object

When JavaScript throws an error, it creates an **Error object** that contains information about what went wrong. This object is passed to your `catch` block.

```javascript
try {
  null.toString(); // This throws a TypeError
} catch (error) {
  console.log(error.name);    // "TypeError"
  console.log(error.message); // "Cannot read properties of null"
  console.log(error.stack);   // Full stack trace showing where the error happened
}
```

#### Key properties of an Error object:

| Property  | Description                                              | Example                                |
|-----------|----------------------------------------------------------|----------------------------------------|
| `name`    | The type/name of the error                               | `"TypeError"`, `"ReferenceError"`      |
| `message` | A human-readable description of what went wrong         | `"Cannot read properties of null"`     |
| `stack`   | A trace showing which lines of code led to the error    | Multi-line string with file/line info  |

---

### 2.4 Types of Built-in Errors

JavaScript has several built-in error types. Knowing them helps you understand what went wrong.

#### `Error` — The base type
The generic error. All other errors extend this one.

```javascript
throw new Error("Something went wrong"); // Generic error
```

#### `TypeError` — Wrong type used
Happens when you use a value in a way that doesn't match its type.

```javascript
let num = 42;
num.toUpperCase(); // ❌ TypeError: num.toUpperCase is not a function
// Numbers don't have toUpperCase — that's a string method

null.name;         // ❌ TypeError: Cannot read properties of null
undefined.length;  // ❌ TypeError: Cannot read properties of undefined
```

#### `ReferenceError` — Variable doesn't exist
Happens when you try to use a variable that hasn't been declared.

```javascript
console.log(x); // ❌ ReferenceError: x is not defined
// You never wrote: let x = ...

myFunction();   // ❌ ReferenceError: myFunction is not defined
```

#### `SyntaxError` — Invalid code
Happens when JavaScript can't understand the code (usually at parse time, not runtime).

```javascript
JSON.parse("{ bad: json }"); // ❌ SyntaxError: Unexpected token 'b'
eval("if (");                // ❌ SyntaxError: Unexpected end of input
```

#### `RangeError` — Value out of allowed range
Happens when a number or value is outside an acceptable range.

```javascript
new Array(-1);             // ❌ RangeError: Invalid array length
(1.23456).toFixed(200);    // ❌ RangeError: toFixed() digits argument must be 0-100
```

#### `URIError` — Bad URI encoding
Happens with malformed URI encoding.

```javascript
decodeURIComponent('%');  // ❌ URIError: URI malformed
```

#### Summary Table

| Error Type       | Simple Explanation                          | Common Trigger                            |
|------------------|---------------------------------------------|-------------------------------------------|
| `Error`          | Generic error                               | `throw new Error("...")`                  |
| `TypeError`      | Used wrong type                             | Calling non-function, accessing null prop |
| `ReferenceError` | Variable not declared                       | Using `x` before `let x = ...`            |
| `SyntaxError`    | Invalid syntax or JSON                      | `JSON.parse()` with bad input             |
| `RangeError`     | Number out of valid range                   | `new Array(-5)`, bad `toFixed()` argument |
| `URIError`       | Bad URI encoding                            | `decodeURIComponent('%')`                 |

---

### 2.5 Throwing Your Own Errors

You're not limited to catching errors — you can also **throw** them yourself when something in your logic is wrong.

```javascript
// Without error throwing — silent failure
function getAge(age) {
  return age; // What if age is -5? The caller doesn't know something is wrong.
}

// With error throwing — explicit failure
function getAge(age) {
  if (typeof age !== "number") {
    throw new TypeError("Age must be a number, got: " + typeof age);
  }
  if (age < 0 || age > 150) {
    throw new RangeError("Age must be between 0 and 150, got: " + age);
  }
  return age;
}

// Now callers can handle bad input properly
try {
  let age = getAge(-5);
} catch (error) {
  if (error instanceof RangeError) {
    console.error("Invalid age range:", error.message);
  }
}
```

#### You can throw anything — but always throw an Error object

```javascript
// ❌ Bad practice — throwing a plain string gives you no stack trace
throw "Something went wrong";

// ✅ Good practice — always throw Error objects
throw new Error("Something went wrong");
throw new TypeError("Expected a string");
```

---

### 2.6 Custom Error Classes

When building applications, it helps to create your own error types so you can tell different kinds of errors apart.

```javascript
// Define a custom error class
class ValidationError extends Error {
  constructor(message, field) {
    super(message);               // Call the parent Error constructor
    this.name = "ValidationError"; // Give it a recognizable name
    this.field = field;           // Add extra info — which field failed
  }
}

class DatabaseError extends Error {
  constructor(message, query) {
    super(message);
    this.name = "DatabaseError";
    this.query = query;           // Which query caused the problem
  }
}

// Use them like built-in errors
function validateEmail(email) {
  if (!email.includes("@")) {
    throw new ValidationError("Email must contain @", "email");
  }
}

// Now you can handle each type differently
try {
  validateEmail("notanemail");
} catch (error) {
  if (error instanceof ValidationError) {
    console.error(`Validation failed on "${error.field}": ${error.message}`);
    // → Validation failed on "email": Email must contain @
  } else if (error instanceof DatabaseError) {
    console.error(`DB error for query "${error.query}": ${error.message}`);
  } else {
    console.error("Unexpected error:", error.message);
  }
}
```

---

### 2.7 Nested try/catch

You can nest try/catch blocks inside each other when different parts of code need different error handling.

```javascript
function processUserData(rawJson) {
  let user;

  // First try: parse the JSON
  try {
    user = JSON.parse(rawJson);
  } catch (parseError) {
    console.error("Could not parse input as JSON:", parseError.message);
    return null; // Return early — no point continuing
  }

  // Second try: validate and use the parsed data
  try {
    if (!user.name) {
      throw new ValidationError("Name is required", "name");
    }
    return saveUser(user);
  } catch (validationError) {
    if (validationError instanceof ValidationError) {
      console.error("Invalid user data:", validationError.message);
    } else {
      console.error("Unexpected error saving user:", validationError.message);
      throw validationError; // Re-throw unexpected errors
    }
  }
}
```

#### Re-throwing errors

Sometimes you catch an error, realize you can't handle it at this level, and want to pass it up:

```javascript
function loadConfig(path) {
  try {
    return readFile(path);
  } catch (error) {
    if (error.code === "ENOENT") {
      // File not found — we can handle this
      console.warn("Config file not found, using defaults.");
      return getDefaultConfig();
    }
    // Other errors — we don't know how to handle them, re-throw
    throw error;
  }
}
```

---

### 2.8 Error Handling in Async Code

Modern JavaScript uses `async/await` to handle asynchronous operations (like fetching data from an API). Error handling works the same way — just with `async` functions.

#### Basic async/await with try/catch

```javascript
// This function fetches user data from an API
async function fetchUser(userId) {
  try {
    // await pauses here until the fetch completes
    const response = await fetch(`https://api.example.com/users/${userId}`);

    // Check if the HTTP response was successful
    if (!response.ok) {
      // HTTP errors (404, 500, etc.) don't automatically throw — you must check
      throw new Error(`Server returned status: ${response.status}`);
    }

    // Parse the JSON response
    const user = await response.json();
    return user;

  } catch (error) {
    // This catches:
    // - Network failures (no internet, server down)
    // - The error we threw above for bad status codes
    // - JSON parsing errors
    console.error("Failed to fetch user:", error.message);
    throw error; // Re-throw so the caller knows it failed
  }
}

// Calling the async function
async function main() {
  try {
    const user = await fetchUser(123);
    console.log("Got user:", user.name);
  } catch (error) {
    console.error("Could not load user:", error.message);
    showErrorMessage("Failed to load user. Please try again.");
  }
}
```

#### Common mistake: forgetting await inside try/catch

```javascript
// ❌ WRONG — the error won't be caught because there's no await
async function badExample() {
  try {
    fetch("https://api.example.com/data") // Missing await!
      .then(res => res.json());
  } catch (error) {
    console.error(error); // This will NEVER run for fetch errors
  }
}

// ✅ CORRECT — always await async operations inside try/catch
async function goodExample() {
  try {
    const response = await fetch("https://api.example.com/data");
    const data = await response.json();
  } catch (error) {
    console.error(error); // This WILL catch network and JSON errors
  }
}
```

---

### 2.9 Promise .catch()

Before `async/await`, we used `.then()` and `.catch()` chains to handle async errors. You'll still see this pattern often.

```javascript
// .catch() at the end of a promise chain
fetch("https://api.example.com/data")
  .then(response => {
    if (!response.ok) throw new Error("Bad response: " + response.status);
    return response.json();
  })
  .then(data => {
    console.log("Data received:", data);
  })
  .catch(error => {
    // Catches errors from ANY step in the chain above
    console.error("Request failed:", error.message);
  })
  .finally(() => {
    // Runs after success or failure — like try/finally
    hideLoadingSpinner();
  });
```

#### Promise.all — handling multiple promises at once

```javascript
// If ANY promise fails, the whole thing fails
Promise.all([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/posts"),
])
  .then(([usersRes, postsRes]) => {
    // All succeeded
  })
  .catch(error => {
    // At least one failed
    console.error("One of the requests failed:", error.message);
  });

// Promise.allSettled — get results even if some fail
Promise.allSettled([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/might-fail"),
])
  .then(results => {
    results.forEach((result, index) => {
      if (result.status === "fulfilled") {
        console.log(`Request ${index} succeeded`);
      } else {
        console.error(`Request ${index} failed:`, result.reason.message);
      }
    });
  });
```

---

### 2.10 Global Error Handlers

Some errors happen outside of any try/catch block. Global handlers let you catch these as a last resort.

#### In the Browser

```javascript
// Catches any uncaught synchronous error on the page
window.onerror = function (message, source, lineno, colno, error) {
  console.error(`Error: ${message} at ${source}:${lineno}`);
  return true; // Prevents the browser from showing its default error
};

// Catches unhandled promise rejections in the browser
window.addEventListener("unhandledrejection", function (event) {
  console.error("Unhandled Promise rejection:", event.reason);
  event.preventDefault(); // Prevents console warning
});
```

#### In Node.js

```javascript
// Catches uncaught synchronous exceptions in Node.js
process.on("uncaughtException", (error) => {
  console.error("FATAL — Uncaught Exception:", error.message);
  // Always exit after this — the process state may be corrupted
  process.exit(1);
});

// Catches unhandled promise rejections in Node.js
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
```

> ⚠️ **Important:** Global handlers are a **last resort safety net**. Don't rely on them for normal error handling — always use try/catch where possible.

---

### 2.11 Common Mistakes

#### Mistake 1: Swallowing errors (empty catch)
```javascript
// BAD — the error disappears silently, no one knows anything failed
try {
  riskyOperation();
} catch (error) {
  // Nothing here — error is completely ignored!
}

// GOOD — at minimum, log the error
try {
  riskyOperation();
} catch (error) {
  console.error("riskyOperation failed:", error.message);
}
```

#### Mistake 2: Catching too broadly without re-throwing
```javascript
// BAD — catches everything, even errors you didn't expect
try {
  doThingA();
  doThingB();
  doThingC();
} catch (error) {
  console.error("Something failed"); // You don't even know which thing failed!
}

// BETTER — handle what you expect, re-throw what you don't
try {
  doThingA();
} catch (error) {
  if (error instanceof ExpectedError) {
    handleExpectedError(error);
  } else {
    throw error; // Not our problem — pass it up
  }
}
```

#### Mistake 3: Using error variable in finally scope
```javascript
// BAD — error is not defined in finally scope
try {
  riskyOperation();
} catch (error) {
  // handle...
} finally {
  console.log(error.message); // ❌ ReferenceError: error is not defined
}

// GOOD — capture error outside if needed in finally
let caughtError = null;
try {
  riskyOperation();
} catch (error) {
  caughtError = error;
} finally {
  if (caughtError) {
    console.log("Cleaning up after error:", caughtError.message);
  }
}
```

---

## 3. TypeScript Exception Handling

### 3.1 How TypeScript Differs from JavaScript

TypeScript is JavaScript with **static types** — types are checked before the code even runs. This prevents many bugs, but it also means error handling needs to be done differently in some cases.

Key differences:
- The caught `error` in a `catch` block is typed as `unknown` (not `any`) by default since TypeScript 4.0
- You must **check the type** of an error before using its properties
- TypeScript encourages more explicit, structured error handling

---

### 3.2 The `unknown` Type in catch

In TypeScript, the error in a `catch` block has type `unknown`. This is intentional — TypeScript doesn't know what kind of error was thrown, so it forces you to check before using it.

```typescript
// ❌ This causes a TypeScript error in strict mode
try {
  JSON.parse("bad");
} catch (error) {
  console.log(error.message); // TypeScript error: Object is of type 'unknown'
}

// ✅ Correct — check the type first
try {
  JSON.parse("bad");
} catch (error: unknown) {
  if (error instanceof Error) {
    console.log(error.message); // Safe! TypeScript knows it's an Error here
  } else {
    console.log("Unknown error:", String(error));
  }
}
```

#### Why not just use `any`?

```typescript
// ❌ Using any — works but skips all type safety
try {
  JSON.parse("bad");
} catch (error: any) {
  console.log(error.message);              // TypeScript won't warn you
  console.log(error.nonExistent.property); // TypeScript won't catch this bug!
}

// ✅ Using unknown forces you to verify the type before accessing properties
// This catches bugs at compile time rather than at runtime
```

---

### 3.3 Type Narrowing

**Type narrowing** means checking what type a value is at runtime so TypeScript understands what properties are available. After a successful check, TypeScript automatically knows the type.

```typescript
function handleError(error: unknown): void {
  // Narrowing with instanceof — checks the most specific types first
  if (error instanceof TypeError) {
    console.error("Type error:", error.message);
    // TypeScript now knows: error is TypeError
    // error.message, error.stack are all safely available
    return;
  }

  if (error instanceof RangeError) {
    console.error("Range error:", error.message);
    return;
  }

  if (error instanceof Error) {
    // Generic Error — has .name, .message, .stack
    console.error(`${error.name}: ${error.message}`);
    return;
  }

  // Fallback — could be a string, number, or anything else that was thrown
  if (typeof error === "string") {
    console.error("String error:", error);
    return;
  }

  // Last resort
  console.error("Unknown error type:", JSON.stringify(error));
}
```

---

### 3.4 Custom Typed Error Classes

TypeScript lets you create strongly-typed custom errors with defined, type-checked properties.

```typescript
// A base class for all application errors
class AppError extends Error {
  public readonly code: number;
  public readonly timestamp: Date;

  constructor(message: string, code: number) {
    super(message);           // Pass message to the parent Error class
    this.name = "AppError";
    this.code = code;
    this.timestamp = new Date();

    // ⚠️ This line is critical in TypeScript!
    // It fixes the prototype chain so instanceof works correctly.
    // Without this, `error instanceof AppError` might return false.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Specific error types that extend AppError
class NotFoundError extends AppError {
  public readonly resourceName: string;

  constructor(resourceName: string) {
    super(`${resourceName} was not found`, 404);
    this.name = "NotFoundError";
    this.resourceName = resourceName;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class ValidationError extends AppError {
  public readonly field: string;
  public readonly value: unknown;

  constructor(field: string, value: unknown, message: string) {
    super(message, 400);
    this.name = "ValidationError";
    this.field = field;
    this.value = value;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class UnauthorizedError extends AppError {
  constructor(message = "You are not authorized to perform this action") {
    super(message, 401);
    this.name = "UnauthorizedError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// Using custom errors
function getUser(id: string) {
  if (!id) {
    throw new ValidationError("id", id, "User ID cannot be empty");
  }
  // Simulate not found
  throw new NotFoundError("User");
}

try {
  getUser("");
} catch (error: unknown) {
  if (error instanceof ValidationError) {
    // TypeScript knows: error.field and error.value are available here
    console.error(`Field "${error.field}" is invalid: ${error.message}`);
  } else if (error instanceof NotFoundError) {
    // TypeScript knows: error.resourceName is available here
    console.error(`${error.resourceName} does not exist (404)`);
  } else if (error instanceof AppError) {
    // Generic app error — has .code and .timestamp
    console.error(`App error [${error.code}]: ${error.message}`);
  } else if (error instanceof Error) {
    // Unexpected system error
    console.error("Unexpected error:", error.message);
  }
}
```

> 📝 **Why `Object.setPrototypeOf`?**
> In TypeScript, when you extend built-in classes like `Error`, the prototype chain can break — meaning `instanceof` checks might return `false` even for the correct type. This one line fixes that problem.

---

### 3.5 Error Hierarchies

For larger applications, you can build a tree (hierarchy) of error types. This lets you handle errors at different levels of specificity.

```
Error (built-in)
└── AppError (your base)
    ├── NetworkError
    │   ├── RequestTimeoutError
    │   └── ConnectionError
    ├── DatabaseError
    │   ├── QueryError
    │   └── ConnectionError
    └── ValidationError
        ├── RequiredFieldError
        └── FormatError
```

```typescript
class NetworkError extends AppError {
  constructor(message: string) {
    super(message, 503);
    this.name = "NetworkError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

class RequestTimeoutError extends NetworkError {
  public readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = "RequestTimeoutError";
    this.timeoutMs = timeoutMs;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

// instanceof works up the entire chain
const error = new RequestTimeoutError(5000);
console.log(error instanceof RequestTimeoutError); // true — exact type
console.log(error instanceof NetworkError);        // true — parent class
console.log(error instanceof AppError);            // true — grandparent
console.log(error instanceof Error);               // true — root class

// This means you can catch broadly or narrowly:
try {
  throw new RequestTimeoutError(5000);
} catch (error: unknown) {
  if (error instanceof RequestTimeoutError) {
    // Handle specifically — you know the timeout duration
    console.error(`Timed out after ${error.timeoutMs}ms`);
  } else if (error instanceof NetworkError) {
    // Handle all network errors broadly
    console.error("A network error occurred:", error.message);
  }
}
```

---

### 3.6 Type Guard Utilities

Create reusable helper functions to safely work with caught errors anywhere in your code.

```typescript
// A type guard — the return type "value is Error" tells TypeScript:
// "if this function returns true, treat value as an Error from here on"
function isError(value: unknown): value is Error {
  return value instanceof Error;
}

function isAppError(value: unknown): value is AppError {
  return value instanceof AppError;
}

// A utility to always get a readable string message from any caught error
// Useful because catch blocks give you `unknown` — could be anything
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "An unknown error occurred";
}

// Usage — works with ANY type of thrown value
try {
  doSomethingRisky();
} catch (error: unknown) {
  // Always gives you a readable message, no matter what was thrown
  const message = getErrorMessage(error);
  console.error("Error:", message);
  showUserNotification(message);
}
```

---

### 3.7 The Result Pattern

Instead of throwing exceptions for **expected** failures, some developers prefer the `Result` pattern. This makes error handling explicit and visible in the function signature — the caller is forced to check for failure.

```typescript
// Define a Result type — either success with data, or failure with error
type Result<T, E extends Error = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

// A function that uses Result instead of throwing
async function fetchUserSafe(id: string): Promise<Result<User>> {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (response.status === 404) {
      return {
        success: false,
        error: new NotFoundError("User"),
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: new AppError(`Server error: ${response.status}`, response.status),
      };
    }

    const user = await response.json();
    return { success: true, data: user };

  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error : new Error("Network failure"),
    };
  }
}

// Calling the function — no try/catch needed at the call site!
const result = await fetchUserSafe("123");

if (result.success) {
  // TypeScript knows: result.data is User here
  console.log("Hello,", result.data.name);
} else {
  // TypeScript knows: result.error is Error here
  console.error("Could not load user:", result.error.message);
}
```

#### When to use Result vs throw?

| Use `throw` when...                             | Use `Result` when...                             |
|-------------------------------------------------|--------------------------------------------------|
| The error is truly unexpected / exceptional     | The failure is an expected possibility           |
| You want simple, readable code for happy path   | You want the caller forced to handle failure     |
| Dealing with lower-level errors (network, I/O)  | Building library/utility functions               |

---

### 3.8 Async TypeScript Error Handling

```typescript
// Define return types for async functions — makes errors visible in the signature
async function createOrder(
  userId: string,
  items: CartItem[]
): Promise<Order> {

  // Validate inputs first — throw specific errors
  if (!userId) {
    throw new ValidationError("userId", userId, "User ID is required");
  }
  if (items.length === 0) {
    throw new ValidationError("items", items, "Cart cannot be empty");
  }

  // Try to load the user
  let user: User;
  try {
    user = await fetchUser(userId);
  } catch (error: unknown) {
    if (error instanceof NotFoundError) {
      // Transform the error into something more meaningful for this context
      throw new ValidationError("userId", userId, "User does not exist");
    }
    throw error; // Re-throw unexpected errors — don't swallow them
  }

  // Try to create the order
  try {
    const order = await database.createOrder({ userId, items });
    await emailService.sendConfirmation(user.email, order);
    return order;
  } catch (error: unknown) {
    if (error instanceof DatabaseError) {
      console.error("DB error creating order:", error.message);
      // Wrap the technical DB error in a user-friendly error
      throw new AppError("Failed to save order. Please try again.", 500);
    }
    throw error;
  }
}
```

---

### 3.9 Common TypeScript Mistakes

#### Mistake 1: Using `any` in catch
```typescript
// BAD — defeats the purpose of TypeScript
try { ... } catch (e: any) {
  console.log(e.anything); // No type safety at all — bugs slip through
}

// GOOD — use unknown, then narrow
try { ... } catch (e: unknown) {
  if (e instanceof Error) console.log(e.message);
}
```

#### Mistake 2: Forgetting `Object.setPrototypeOf` in custom errors
```typescript
// BAD — instanceof may fail in TypeScript-compiled code
class MyError extends Error {
  constructor(msg: string) {
    super(msg);
    // Missing: Object.setPrototypeOf(this, new.target.prototype);
  }
}

const e = new MyError("test");
console.log(e instanceof MyError); // Might print false — this is a real bug!

// GOOD — always add this line after super()
class MyError extends Error {
  constructor(msg: string) {
    super(msg);
    Object.setPrototypeOf(this, new.target.prototype); // ✅ fixes instanceof
  }
}
```

#### Mistake 3: Not handling the fallback case
```typescript
// BAD — what if someone throws a number or a plain object?
try { ... } catch (error: unknown) {
  if (error instanceof Error) {
    // Handle it
  }
  // No fallback — if error is a string or number, nothing happens silently
}

// GOOD — always have a fallback
try { ... } catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  } else {
    // Could be a string, number, object — convert to string safely
    console.error("Unexpected throw value:", String(error));
  }
}
```

---

## 4. Playwright Exception Handling

### 4.1 What is Playwright?

**Playwright** is a tool for **browser automation and testing**. It lets you write code that controls a real web browser — clicking buttons, filling forms, navigating pages — just like a human user would.

It's commonly used for:
- **End-to-end testing** — checking that your whole web app works from the user's perspective
- **Web scraping** — extracting data from websites automatically
- **UI regression testing** — making sure code changes didn't break the user interface

Because Playwright controls a real browser, many things can go wrong: network delays, elements taking too long to load, popups appearing unexpectedly, pages crashing, etc. Good error handling is essential for reliable tests.

---

### 4.2 Why Errors Happen in Browser Automation

| Situation                               | What Happens                                                  |
|-----------------------------------------|---------------------------------------------------------------|
| Element doesn't exist on the page       | Playwright can't find it to click or type into               |
| Page takes too long to load             | Timeout expires before the action completes                   |
| Element exists but is hidden/disabled   | Playwright refuses to interact with invisible elements        |
| Network request fails                   | Page doesn't load correctly, content may be missing           |
| Unexpected popup or dialog appears      | Blocks further interaction until dismissed                    |
| Browser crashes                         | The entire session is lost                                    |
| Timing issues (flakiness)               | Element appears too slowly on some runs but not others        |

---

### 4.3 Playwright Error Types

Playwright uses the standard JavaScript `Error` class, plus its own specific error classes for automation-specific failures.

```typescript
import { errors } from "playwright";

// errors.TimeoutError  — action or wait exceeded the configured timeout
// Error (generic)      — element not found, page closed, context destroyed, etc.
```

#### How to import and use error types:
```typescript
import { test, expect } from "@playwright/test";
import { errors } from "playwright"; // Gives access to errors.TimeoutError
```

---

### 4.4 Handling TimeoutError

`TimeoutError` is the most common error in Playwright. It happens when an element doesn't appear, or an action doesn't complete, within the allowed time limit.

```typescript
import { test } from "@playwright/test";
import { errors } from "playwright";

test("wait for a button that might be slow to appear", async ({ page }) => {
  await page.goto("https://example.com");

  try {
    // Wait for the button — but only for 5 seconds (5000ms)
    await page.waitForSelector("#submit-button", { timeout: 5000 });
    await page.click("#submit-button");

  } catch (error: unknown) {
    if (error instanceof errors.TimeoutError) {
      // We expected this might happen — handle it gracefully
      console.warn("Submit button didn't appear within 5 seconds.");

      // Take a screenshot to help debug what the page looked like
      await page.screenshot({ path: "timeout-debug.png" });

      // Fail the test with a clear, human-readable message
      throw new Error(
        "Submit button was not found in time — page may not have loaded correctly."
      );
    }

    // Something else went wrong that we didn't expect — re-throw it
    throw error;
  }
});
```

#### Setting timeout per-action vs globally

```typescript
// Per action — only this specific click waits up to 10 seconds
await page.click("#slow-button", { timeout: 10000 });

// Per waitForSelector — wait up to 15 seconds for this element
await page.waitForSelector(".loading-done", { timeout: 15000 });

// Per navigation — wait up to 30 seconds for this page load
await page.goto("https://slow-site.com", { timeout: 30000 });

// In playwright.config.ts — applies as default to ALL tests
use: {
  actionTimeout: 5000,       // Every click, fill, etc. has 5 second timeout
  navigationTimeout: 15000   // Every page.goto() has 15 second timeout
}
```

---

### 4.5 Element Not Found Errors

When Playwright can't find an element on the page, it throws an error. Here's how to handle this gracefully:

```typescript
test("handle missing optional element", async ({ page }) => {
  await page.goto("https://example.com/dashboard");

  // ─── Option 1: Check if element exists BEFORE interacting ──────────
  // isVisible() returns true/false and never throws an error
  const banner = page.locator(".announcement-banner");
  const isBannerVisible = await banner.isVisible();

  if (isBannerVisible) {
    await banner.locator(".close-button").click();
    console.log("Dismissed announcement banner.");
  } else {
    console.log("No banner present — skipping dismissal.");
  }

  // ─── Option 2: Try to interact and catch if it fails ──────────────
  try {
    // Cookie consent might not always appear — give it only 3 seconds
    await page.locator(".cookie-consent").click({ timeout: 3000 });
    console.log("Dismissed cookie consent.");
  } catch (error: unknown) {
    // This is expected sometimes — not every run shows the cookie banner
    console.log("Cookie consent not shown on this run — continuing.");
  }

  // Continue with the actual test regardless
  await expect(page.locator("h1")).toBeVisible();
});
```

#### Checking element state without throwing

These methods return `true`/`false` and **never throw** — use them to safely check element state:

```typescript
// Returns true if the element is visible on screen
const exists = await page.locator("#element").isVisible();

// Returns true if the element is not disabled
const enabled = await page.locator("#button").isEnabled();

// Returns true if a checkbox or radio is checked
const checked = await page.locator("#checkbox").isChecked();

// Returns true if the element exists but is not visible
const hidden = await page.locator("#menu").isHidden();

// Returns the number of matching elements (0 if none found — no throw!)
const count = await page.locator(".list-item").count();
if (count === 0) {
  console.warn("No list items found — the list might be empty.");
}
```

---

### 4.6 Navigation Errors

Errors can occur when navigating to pages — especially if the site is slow, unavailable, or the URL is wrong.

```typescript
test("handle navigation failure", async ({ page }) => {
  try {
    // waitUntil: "networkidle" = wait until there are no network requests for 500ms
    // This is the most thorough option — good for pages that load data dynamically
    await page.goto("https://example.com/slow-page", {
      waitUntil: "networkidle",
      timeout: 20000  // Give it 20 seconds
    });

  } catch (error: unknown) {
    if (error instanceof errors.TimeoutError) {
      console.error("Page took too long to become idle.");
      await page.screenshot({ path: "nav-timeout.png" });
      throw error;
    }

    // Check for DNS / network-level errors (not HTTP errors)
    if (error instanceof Error) {
      if (error.message.includes("net::ERR_NAME_NOT_RESOLVED")) {
        throw new Error("DNS failure — the domain could not be resolved.");
      }
      if (error.message.includes("net::ERR_CONNECTION_REFUSED")) {
        throw new Error("Connection refused — is the server running?");
      }
      if (error.message.includes("net::ERR_INTERNET_DISCONNECTED")) {
        throw new Error("No internet connection available.");
      }
    }

    throw error; // Re-throw anything else unexpected
  }

  // Verify we actually landed on the right page
  await expect(page).toHaveURL(/example\.com\/slow-page/);
});
```

#### `waitUntil` options explained:

| Option               | Waits until...                                              | Speed     |
|----------------------|-------------------------------------------------------------|-----------|
| `"commit"`           | Response headers are received                               | Fastest   |
| `"domcontentloaded"` | The HTML is parsed (doesn't wait for images or scripts)    | Fast      |
| `"load"`             | The page's `load` event fires (default)                    | Medium    |
| `"networkidle"`      | No network requests for 500ms                              | Slowest   |

---

### 4.7 Page Event Listeners

Playwright lets you listen to events on the browser page. This is how you catch problems that happen in the background — not as a direct result of your test commands.

#### Catching uncaught JavaScript errors on the page

```typescript
test("monitor for JavaScript errors on the page", async ({ page }) => {
  const pageErrors: Error[] = [];

  // Set up the listener BEFORE navigating — you don't want to miss any errors
  // This fires when an uncaught error occurs in the browser page's own JavaScript
  page.on("pageerror", (error) => {
    console.error("❌ Uncaught JS error in page:", error.message);
    pageErrors.push(error);
  });

  await page.goto("https://example.com");
  await page.click("#do-something");
  await page.waitForSelector(".result");

  // After the test actions, assert that no JavaScript errors occurred on the page
  expect(pageErrors).toHaveLength(0);
  // If this fails, you'll see all the error messages collected above
});
```

#### Monitoring browser console output

```typescript
test("check for console errors during test", async ({ page }) => {
  const consoleErrors: string[] = [];

  // Listen to all console messages from the browser
  page.on("console", (msg) => {
    const type = msg.type(); // Can be: "log", "info", "warning", "error", "debug"
    const text = msg.text(); // The message content

    if (type === "error") {
      consoleErrors.push(`[ERROR] ${text}`);
      console.error("Browser console error:", text);
    } else if (type === "warning") {
      console.warn("Browser console warning:", text);
    }
  });

  await page.goto("https://example.com");
  await page.fill("#search", "test query");
  await page.press("#search", "Enter");
  await page.waitForSelector(".results");

  // Fail the test if any console errors occurred during the test
  if (consoleErrors.length > 0) {
    throw new Error(
      `${consoleErrors.length} console error(s) occurred:\n${consoleErrors.join("\n")}`
    );
  }
});
```

#### Handling page crashes

```typescript
test("handle browser renderer crash", async ({ page }) => {
  let crashed = false;

  // This event fires if the browser's renderer process crashes
  // (e.g., due to a memory-intensive operation or browser bug)
  page.on("crash", () => {
    crashed = true;
    console.error("💥 The page crashed unexpectedly!");
  });

  await page.goto("https://example.com");
  await page.click("#memory-intensive-feature");

  // Check if the page crashed at any point during the test
  if (crashed) {
    throw new Error("Page crashed during the test — possible memory or rendering issue.");
  }
});
```

---

### 4.8 Dialog Handling

Web browsers show dialogs like `alert()`, `confirm()`, and `prompt()`. If your test triggers a dialog and you don't handle it, Playwright will either dismiss it automatically or the test may hang. Always set up a handler before the action that triggers the dialog.

```typescript
test("handle different dialog types", async ({ page }) => {
  // ⚠️ Set up BEFORE triggering the dialog — not after!
  page.on("dialog", async (dialog) => {
    const type = dialog.type();       // "alert", "confirm", "prompt", "beforeunload"
    const message = dialog.message(); // The text displayed in the dialog

    console.log(`Dialog appeared — Type: ${type}, Message: "${message}"`);

    if (type === "alert") {
      // alert() just needs to be dismissed — there's no choice
      await dialog.accept();

    } else if (type === "confirm") {
      // confirm() expects accept() = "OK"/true or dismiss() = "Cancel"/false
      if (message.includes("Are you sure?")) {
        await dialog.accept();   // Click "OK"
      } else {
        await dialog.dismiss();  // Click "Cancel"
      }

    } else if (type === "prompt") {
      // prompt() expects text input, then accept or dismiss
      await dialog.accept("My answer text"); // Type text and click "OK"

    } else if (type === "beforeunload") {
      // Shows when user tries to leave the page with unsaved changes
      await dialog.dismiss(); // Stay on the page
    }
  });

  await page.goto("https://example.com");
  await page.click("#button-that-shows-confirm-dialog");

  // Test continues after the dialog has been handled
  await expect(page.locator(".success-message")).toBeVisible();
});
```

#### Auto-dismissing all dialogs (useful as a safety net)

```typescript
test("auto dismiss all dialogs to prevent test hanging", async ({ page }) => {
  // Dismiss every dialog automatically — good for tests where dialogs are side effects
  page.on("dialog", dialog => dialog.dismiss());

  await page.goto("https://example.com");
  // ... rest of test won't get stuck on unexpected dialogs
});
```

---

### 4.9 Network Request Failures

You can monitor all network activity during your tests to catch failed requests early and understand what your page is doing.

```typescript
test("monitor for failed network requests", async ({ page }) => {
  const failedRequests: string[] = [];

  // "requestfailed" fires when a request fails at the network level
  // (NOT for HTTP errors like 404 or 500 — those are "successful" at network level)
  page.on("requestfailed", (request) => {
    const failure = request.failure();
    const info = `${request.method()} ${request.url()} — ${failure?.errorText}`;
    failedRequests.push(info);
    console.warn("Network request failed:", info);
  });

  await page.goto("https://example.com");
  await page.click("#load-more-content");

  // Decide whether failures should fail the test
  if (failedRequests.length > 0) {
    // Only fail if API calls failed — static asset failures might be acceptable
    const criticalFailures = failedRequests.filter(r => r.includes("/api/"));
    if (criticalFailures.length > 0) {
      throw new Error(
        "Critical API requests failed:\n" + criticalFailures.join("\n")
      );
    }
  }
});
```

#### Intercepting and mocking requests to test error states

```typescript
test("verify UI handles API errors gracefully", async ({ page }) => {
  // Intercept the API call and return a fake error response
  // This lets you test error handling WITHOUT needing the server to actually fail
  await page.route("**/api/users", async (route) => {
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ error: "Internal Server Error" }),
    });
  });

  await page.goto("https://example.com/users");

  // Verify the UI shows a helpful error message (not a blank screen or crash)
  await expect(page.locator(".error-message")).toBeVisible();
  await expect(page.locator(".error-message")).toHaveText(/something went wrong/i);

  // Verify a retry button is available
  await expect(page.locator(".retry-button")).toBeVisible();
});
```

---

### 4.10 Soft Assertions

By default, when an assertion fails in Playwright, the test **stops immediately** at that line. Soft assertions let the test continue even when a check fails — collecting all failures to report them all together at the end.

```typescript
test("check multiple things on the page — see all failures at once", async ({ page }) => {
  await page.goto("https://example.com");

  // "Soft" assertions — a failure here does NOT stop the test immediately
  // The test continues to the next line
  await expect.soft(page.locator("h1")).toHaveText("Welcome to Example");
  await expect.soft(page.locator(".subtitle")).toBeVisible();
  await expect.soft(page.locator("nav")).toContainText("Home");
  await expect.soft(page.locator("nav")).toContainText("About");
  await expect.soft(page.locator("footer")).toBeVisible();
  await expect.soft(page.locator(".copyright")).toContainText("2024");

  // "Hard" assertion — if this fails, the test stops here
  // Use for things that absolutely must be true to continue
  await expect(page.locator("#main-content")).toBeVisible();

  // At the end of the test, Playwright reports ALL soft assertion failures together
  // Instead of seeing only the first failure, you see the full picture:
  // e.g. "3 out of 6 checks failed: subtitle not visible, About not in nav, copyright wrong"
});
```

**When to use soft assertions:**
- Checking multiple visual elements on a page at once
- Verifying that all required sections of a page are present
- Running a full audit of a page's content (SEO checks, accessibility text, etc.)
- When you want to see the full scope of breakage, not just the first failure

---

### 4.11 Retry Logic

Some test failures are caused by timing issues — called **flakiness**. The page might not have fully rendered yet, or a network request is still in progress when your test checks for a result. Retry logic helps handle this.

#### Built-in auto-waiting (Playwright already does this for you)

Playwright automatically retries most actions until they succeed or timeout. For example:

```typescript
// Playwright automatically waits and retries internally until:
// - The element exists in the DOM
// - The element is visible (not hidden)
// - The element is not disabled
// - The element is not covered by another element
// - The element is not animating
await page.click("#submit");
// You don't need to add any retry code for basic interactions!
```

#### Manual retry for complex multi-step scenarios

```typescript
import { Page } from "@playwright/test";

// A reusable helper that retries any async action a set number of times
async function retryAction(
  actionName: string,                  // Descriptive name for logging
  action: () => Promise<void>,         // The action to retry
  maxRetries: number = 3,              // How many attempts total
  delayBetweenTriesMs: number = 1000   // How long to wait between attempts
): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await action();
      console.log(`✅ "${actionName}" succeeded on attempt ${attempt}`);
      return; // Exit the loop — we succeeded
    } catch (error: unknown) {
      lastError = error;
      console.warn(`⚠️ "${actionName}" failed on attempt ${attempt}/${maxRetries}`);

      if (attempt < maxRetries) {
        console.log(`   Waiting ${delayBetweenTriesMs}ms before next attempt...`);
        await new Promise(resolve => setTimeout(resolve, delayBetweenTriesMs));
      }
    }
  }

  // All attempts failed — throw the error from the last attempt
  console.error(`❌ "${actionName}" failed after ${maxRetries} attempts`);
  throw lastError;
}

// Real usage in a test
test("retry clicking a flaky button", async ({ page }) => {
  await page.goto("https://example.com");

  await retryAction(
    "click submit and wait for confirmation",
    async () => {
      await page.locator("#submit").click({ timeout: 3000 });
      // Also check that the expected outcome happened
      await expect(page.locator(".success-message")).toBeVisible({ timeout: 3000 });
    },
    3,    // Try up to 3 times total
    2000  // Wait 2 seconds between each attempt
  );
});
```

---

### 4.12 Global Config in `playwright.config.ts`

The `playwright.config.ts` file is the central place to configure timeouts, retries, screenshots, and more for all tests in your project. Getting this right prevents many common issues.

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({

  // ─── Where to find test files ───────────────────────────────────────────
  testDir: "./tests",

  // ─── How long a single test can run ─────────────────────────────────────
  // If a test takes longer than this, it fails with a timeout error
  timeout: 30_000,  // 30 seconds per test

  // ─── Automatically retry failed tests ───────────────────────────────────
  // On CI/CD (like GitHub Actions): retry up to 2 times before marking as failed
  // Locally: don't retry — see failures immediately for faster debugging
  retries: process.env.CI ? 2 : 0,

  // ─── Run tests in parallel ───────────────────────────────────────────────
  // On CI: use 1 worker to avoid resource conflicts
  // Locally: use all available CPU cores (undefined = auto-detect)
  workers: process.env.CI ? 1 : undefined,

  // ─── Per-test browser/action settings ────────────────────────────────────
  use: {
    // Timeout for each individual action (click, fill, select, etc.)
    actionTimeout: 10_000,     // 10 seconds per action

    // Timeout for page navigation (page.goto, page.reload, etc.)
    navigationTimeout: 30_000, // 30 seconds per navigation

    // Base URL — lets you write page.goto("/login") instead of full URL
    baseURL: "https://example.com",

    // ─── Evidence collection on failure ─────────────────────────────────
    // Take a screenshot automatically when a test fails
    screenshot: "only-on-failure",

    // Record video — only on the first retry of a failing test
    // This saves disk space while still capturing evidence
    video: "on-first-retry",

    // Collect a full trace (timeline, screenshots, network, console) on first retry
    // Open with: npx playwright show-trace trace.zip
    trace: "on-first-retry",
  },

  // ─── Test Reporters ───────────────────────────────────────────────────────
  reporter: [
    ["html"],   // Creates a browsable HTML report in playwright-report/
    ["line"],   // Shows test results line-by-line in the terminal
  ],

  // ─── Run tests in multiple browsers ──────────────────────────────────────
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },         // Android phone
    },
    {
      name: "mobile-safari",
      use: { ...devices["iPhone 13"] },        // iPhone
    },
  ],
});
```

---

### 4.13 Custom Fixtures with Error Tracking

**Fixtures** in Playwright are reusable setup and teardown helpers that run before and after each test. You can create a custom `page` fixture that automatically tracks errors for every test — without adding any code to the tests themselves.

```typescript
// fixtures.ts — define your custom, error-tracking test fixture
import { test as baseTest, expect, Page } from "@playwright/test";

// Define the shape of what our custom fixture adds
type ErrorTrackingFixtures = {
  page: Page;           // We're overriding the default page fixture
  pageErrors: string[]; // Expose the list of collected errors to tests
};

export const test = baseTest.extend<ErrorTrackingFixtures>({

  // Override the default 'page' fixture to add automatic error tracking
  page: async ({ page }, use) => {
    const jsErrors: string[] = [];
    const consoleErrors: string[] = [];

    // Listen for uncaught JavaScript errors in the page
    page.on("pageerror", (error) => {
      jsErrors.push(`[JS Error] ${error.message}`);
    });

    // Listen for console.error() calls from the page's code
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        consoleErrors.push(`[Console Error] ${msg.text()}`);
      }
    });

    // Listen for page crashes
    page.on("crash", () => {
      jsErrors.push("[Crash] Page renderer crashed");
    });

    // ← Run the actual test here
    await use(page);

    // ← This runs AFTER the test, for cleanup and reporting
    const allErrors = [...jsErrors, ...consoleErrors];
    if (allErrors.length > 0) {
      console.warn(`\n⚠️  ${allErrors.length} browser error(s) during test:`);
      allErrors.forEach(e => console.warn("  " + e));
    }
  },
});

// Re-export expect so all test files only need to import from this file
export { expect };
```

```typescript
// my-feature.test.ts — using the custom fixture
// Just import from fixtures.ts instead of @playwright/test
import { test, expect } from "./fixtures";

test("login flow — errors tracked automatically", async ({ page }) => {
  // No extra error-tracking setup needed here!
  // All pageerror, console.error, and crash events are automatically collected.

  await page.goto("/login");
  await page.fill("#email", "user@example.com");
  await page.fill("#password", "password123");
  await page.click("#login-button");

  await expect(page.locator(".dashboard-header")).toBeVisible();
  // If any JS errors or console errors happened during this test,
  // they'll be printed in the test output automatically.
});

test("checkout flow — also tracked", async ({ page }) => {
  // Same automatic error tracking applies here — no extra code needed
  await page.goto("/cart");
  await page.click("#checkout");
  await expect(page).toHaveURL(/checkout/);
});
```

---

## 5. Quick Reference Cheat Sheet

### JavaScript Quick Reference

```javascript
// ── Basic try/catch/finally ─────────────────────────────────────────────────
try {
  // risky code
} catch (error) {
  console.error(error.name);    // "TypeError", "ReferenceError", etc.
  console.error(error.message); // Human-readable description
  console.error(error.stack);   // Full stack trace
} finally {
  // Always runs — use for cleanup
}

// ── Throw ──────────────────────────────────────────────────────────────────
throw new Error("generic message");
throw new TypeError("wrong type used");
throw new RangeError("value out of range");

// ── Custom error class ─────────────────────────────────────────────────────
class MyError extends Error {
  constructor(message, extra) {
    super(message);
    this.name = "MyError";
    this.extra = extra;
  }
}

// ── Async/await ────────────────────────────────────────────────────────────
async function fetchData() {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Failed:", error.message);
    throw error; // Re-throw if caller needs to know
  }
}

// ── Global handlers ────────────────────────────────────────────────────────
window.addEventListener("unhandledrejection", e => console.error(e.reason));
process.on("uncaughtException", err => { console.error(err); process.exit(1); });
```

---

### TypeScript Quick Reference

```typescript
// ── Always type caught errors as unknown ────────────────────────────────────
try { ... } catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message); // Safe after instanceof check
  } else {
    console.error("Unknown:", String(error));
  }
}

// ── Custom error with Object.setPrototypeOf (required!) ─────────────────────
class AppError extends Error {
  constructor(message: string, public code: number) {
    super(message);
    this.name = "AppError";
    Object.setPrototypeOf(this, new.target.prototype); // ← always include!
  }
}

// ── Type guard helper ───────────────────────────────────────────────────────
function getErrorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

// ── Result pattern (no throw needed) ────────────────────────────────────────
type Result<T> = { success: true; data: T } | { success: false; error: Error };

async function safeOperation(): Promise<Result<Data>> {
  try {
    return { success: true, data: await fetchData() };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e : new Error(String(e)) };
  }
}

const result = await safeOperation();
if (result.success) { use(result.data); }
else { handle(result.error); }
```

---

### Playwright Quick Reference

```typescript
import { test, expect } from "@playwright/test";
import { errors } from "playwright";

// ── Catch timeout specifically ──────────────────────────────────────────────
try {
  await page.waitForSelector(".el", { timeout: 5000 });
} catch (e: unknown) {
  if (e instanceof errors.TimeoutError) {
    console.warn("Element timed out");
    await page.screenshot({ path: "debug.png" });
  } else throw e;
}

// ── Check before interacting (never throws) ────────────────────────────────
const visible = await page.locator("#btn").isVisible();
const count   = await page.locator(".item").count();
if (visible) await page.click("#btn");

// ── Page event listeners ────────────────────────────────────────────────────
page.on("pageerror",     err => console.error("JS error:", err.message));
page.on("console",       msg => msg.type() === "error" && console.warn(msg.text()));
page.on("crash",         ()  => console.error("Page crashed!"));
page.on("dialog",        dlg => dlg.accept());
page.on("requestfailed", req => console.warn(req.url(), req.failure()?.errorText));

// ── Soft assertions (test continues after failure) ──────────────────────────
await expect.soft(page.locator("h1")).toHaveText("Title");
await expect.soft(page.locator(".sub")).toBeVisible();
// All failures reported at end of test

// ── playwright.config.ts key settings ──────────────────────────────────────
// use: {
//   actionTimeout: 10_000,
//   navigationTimeout: 30_000,
//   screenshot: "only-on-failure",
//   video: "on-first-retry",
//   trace: "on-first-retry",
// }
// retries: process.env.CI ? 2 : 0
// timeout: 30_000
```

---

> ✅ **You have now covered:**
> - How errors work and why we handle them
> - Every JavaScript error type and how to catch/throw/customize them
> - TypeScript's type-safe approach with `unknown`, type narrowing, and typed custom errors
> - The Result pattern as an alternative to throwing
> - Every major Playwright error scenario: timeouts, missing elements, navigation failures, page events, dialogs, network monitoring, and soft assertions
> - How to configure Playwright globally for reliable, well-evidenced test runs
