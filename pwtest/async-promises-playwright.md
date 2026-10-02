# Asynchronous JavaScript — Complete Study Notes
### Callbacks · Promises · Async/Await · Playwright Test Automation
> 📘 Written from a **Test Automation perspective** — because in testing, steps must execute in the correct order, one after another.

---

## Table of Contents

1. [What Does Asynchronous Mean?](#1-what-does-asynchronous-mean)
   - 1.1 [Synchronous vs Asynchronous — The Core Difference](#11-synchronous-vs-asynchronous--the-core-difference)
   - 1.2 [Why Asynchronous Exists in JavaScript](#12-why-asynchronous-exists-in-javascript)
   - 1.3 [Why This Matters Critically in Test Automation](#13-why-this-matters-critically-in-test-automation)
   - 1.4 [The JavaScript Event Loop — Simple Explanation](#14-the-javascript-event-loop--simple-explanation)
2. [Callbacks](#2-callbacks)
   - 2.1 [What is a Callback?](#21-what-is-a-callback)
   - 2.2 [Synchronous Callbacks](#22-synchronous-callbacks)
   - 2.3 [Asynchronous Callbacks](#23-asynchronous-callbacks)
   - 2.4 [Callback Hell — The Big Problem](#24-callback-hell--the-big-problem)
   - 2.5 [Why Callbacks Are Problematic in Test Automation](#25-why-callbacks-are-problematic-in-test-automation)
   - 2.6 [Error Handling in Callbacks](#26-error-handling-in-callbacks)
3. [Promises](#3-promises)
   - 3.1 [What is a Promise?](#31-what-is-a-promise)
   - 3.2 [Promise States](#32-promise-states)
   - 3.3 [Creating a Promise](#33-creating-a-promise)
   - 3.4 [Consuming a Promise — .then() and .catch()](#34-consuming-a-promise----then-and-catch)
   - 3.5 [Promise Chaining](#35-promise-chaining)
   - 3.6 [Promise Methods — Complete Reference](#36-promise-methods--complete-reference)
      - Promise.all()
      - Promise.allSettled()
      - Promise.race()
      - Promise.any()
      - Promise.resolve()
      - Promise.reject()
   - 3.7 [Error Handling in Promises](#37-error-handling-in-promises)
   - 3.8 [Promises in Test Automation Context](#38-promises-in-test-automation-context)
4. [Async / Await](#4-async--await)
   - 4.1 [What is Async/Await?](#41-what-is-asyncawait)
   - 4.2 [The async Keyword](#42-the-async-keyword)
   - 4.3 [The await Keyword](#43-the-await-keyword)
   - 4.4 [Sequential Execution with await](#44-sequential-execution-with-await)
   - 4.5 [Parallel Execution with Promise.all](#45-parallel-execution-with-promiseall)
   - 4.6 [Error Handling with Async/Await](#46-error-handling-with-asyncawait)
   - 4.7 [Common Async/Await Mistakes](#47-common-asyncawait-mistakes)
5. [How Playwright Handles Asynchronous Operations](#5-how-playwright-handles-asynchronous-operations)
   - 5.1 [Why Playwright is Fully Async](#51-why-playwright-is-fully-async)
   - 5.2 [Every Playwright Action Returns a Promise](#52-every-playwright-action-returns-a-promise)
   - 5.3 [await Makes Tests Run Step by Step](#53-await-makes-tests-run-step-by-step)
   - 5.4 [What Happens if You Forget await](#54-what-happens-if-you-forget-await)
   - 5.5 [Playwright's Built-in Auto-Waiting](#55-playwrights-built-in-auto-waiting)
   - 5.6 [waitFor Methods — Explicit Waiting](#56-waitfor-methods--explicit-waiting)
   - 5.7 [Sequential Test Steps — The Right Way](#57-sequential-test-steps--the-right-way)
   - 5.8 [Running Steps in Parallel — When It's Safe](#58-running-steps-in-parallel--when-its-safe)
   - 5.9 [Page Object Model with Async Methods](#59-page-object-model-with-async-methods)
   - 5.10 [Async in beforeEach, afterEach, beforeAll, afterAll](#510-async-in-beforeeach-aftereach-beforeall-afterall)
   - 5.11 [Handling Async in Test Data Setup](#511-handling-async-in-test-data-setup)
   - 5.12 [Common Playwright Async Mistakes](#512-common-playwright-async-mistakes)
6. [Quick Reference Cheat Sheet](#6-quick-reference-cheat-sheet)

---

## 1. What Does Asynchronous Mean?

### 1.1 Synchronous vs Asynchronous — The Core Difference

Before writing a single line of test code, you need to understand this fundamental concept.

**Synchronous** means tasks happen **one at a time, in order**. The next task cannot start until the current one finishes.

Think of it like a single checkout lane at a grocery store:
```
Customer 1 checks out → Customer 2 checks out → Customer 3 checks out
(Customer 2 must wait for Customer 1 to fully finish before starting)
```

**Asynchronous** means tasks can be started and then set aside while waiting, allowing other things to happen in the meantime.

Think of it like a restaurant:
```
Waiter takes Table 1's order → Kitchen starts cooking Table 1's food
Waiter takes Table 2's order → Kitchen starts cooking Table 2's food
Table 1's food is ready → Waiter delivers it
Table 2's food is ready → Waiter delivers it
(The waiter doesn't stand at the kitchen waiting while food is cooked)
```

#### In code — Synchronous example:

```javascript
// Each line waits for the previous one to finish
console.log("Step 1: Open browser");  // Runs first
console.log("Step 2: Go to login page");  // Runs second
console.log("Step 3: Enter username");    // Runs third
console.log("Step 4: Click login");       // Runs fourth

// Output (always in this order):
// Step 1: Open browser
// Step 2: Go to login page
// Step 3: Enter username
// Step 4: Click login
```

#### In code — Asynchronous example (without proper handling):

```javascript
// setTimeout simulates a delayed operation (like a network call)
console.log("Step 1: Open browser");

setTimeout(function() {
  console.log("Step 2: Page loaded");  // This is delayed by 2 seconds
}, 2000);

console.log("Step 3: Click the button"); // THIS RUNS BEFORE STEP 2!

// Actual output:
// Step 1: Open browser
// Step 3: Click the button   ← WRONG ORDER! Ran before page loaded
// Step 2: Page loaded         ← 2 seconds later
```

This is the core problem that async handling solves.

---

### 1.2 Why Asynchronous Exists in JavaScript

JavaScript runs in a **single thread** — meaning it can only do one thing at a time. However, many real-world operations take time:

| Operation                   | Why It Takes Time                           | Typical Duration   |
|-----------------------------|---------------------------------------------|--------------------|
| Fetching data from an API   | Network round-trip to a server              | 100ms – 5 seconds  |
| Reading a file from disk    | Disk I/O is slow compared to memory         | 1ms – 100ms        |
| Waiting for a page to load  | Browser must download, parse, render HTML   | 500ms – 10 seconds |
| Waiting for a UI animation  | CSS transitions take time                   | 200ms – 2 seconds  |
| Database query              | DB must process and return results          | 5ms – 2 seconds    |

If JavaScript **blocked** (waited) during each of these, the browser would freeze. Nothing could respond — no clicks, no scrolling, nothing.

Asynchronous design lets JavaScript **start** an operation, continue doing other things, and then come back when the operation completes.

---

### 1.3 Why This Matters Critically in Test Automation

In test automation, **test steps MUST execute in a specific, predictable order**. This is non-negotiable because:

```
❌ WRONG test execution order:
1. Navigate to login page
3. Click "Login" button       ← Clicked before filling in credentials!
2. Fill in username/password   ← Form filled after clicking login

This test will fail because the button was clicked before the form was filled.
```

```
✅ CORRECT test execution order:
1. Navigate to login page
2. Fill in username
3. Fill in password
4. Click "Login" button
5. Wait for dashboard to load
6. Assert dashboard is visible

Every step completes fully before the next one begins.
```

The challenge is: **browser automation is inherently asynchronous**. Every Playwright command (click, fill, navigate) involves:
- Sending a command to the browser
- Waiting for the browser to execute it
- Receiving confirmation

Without proper async handling, your test steps would fire in unpredictable order and produce unreliable results.

**The solution JavaScript gives us: async/await** — which makes asynchronous code look and behave like synchronous code.

---

### 1.4 The JavaScript Event Loop — Simple Explanation

Understanding the event loop helps you understand *why* async works the way it does.

```
┌─────────────────────────────────────────────────────────────┐
│                    JavaScript Engine                         │
│                                                             │
│  ┌──────────────────┐     ┌──────────────────────────────┐  │
│  │   Call Stack      │     │        Web APIs              │  │
│  │  (runs code now)  │     │  (handles: timers, fetch,    │  │
│  │                   │     │   DOM events, file I/O)      │  │
│  │  main()           │     │                              │  │
│  │  fetchUser()      │────▶│  fetch("api/users") ──────── │  │
│  │  ...              │     │  setTimeout(fn, 2000) ──────  │  │
│  └──────────────────┘     └──────────────────────────────┘  │
│          ▲                              │                    │
│          │                             ▼                    │
│          │              ┌──────────────────────────────┐    │
│          │              │       Callback Queue          │    │
│          └──────────────│  (results waiting to run)    │    │
│       Event Loop        │  [fetchUser result]           │    │
│    picks next task      │  [setTimeout callback]        │    │
│    when stack is empty  └──────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

**In plain English:**
1. JavaScript runs code line by line (the **call stack**)
2. When it hits something async (like `fetch()`), it hands it to the **Web APIs** and moves on
3. When the async work finishes, the result goes into the **Callback Queue**
4. The **Event Loop** watches: when the call stack is empty, it picks the next result from the queue and runs it

This is why `await` is so important — it tells JavaScript: "**pause here** and wait for this async result before moving to the next line."

---

## 2. Callbacks

### 2.1 What is a Callback?

A **callback** is a function that you pass as an argument to another function, with the instruction: "call this function when you're done."

Simple analogy: You order a pizza online and give them your phone number. "Call me when the pizza is ready." Your phone number is the callback — it gets "called back" when the work is done.

```javascript
// A simple callback example
function doSomethingAsync(callback) {
  // Simulate async work (like a network call taking 1 second)
  setTimeout(function() {
    const result = "work done!";
    callback(result); // "Call back" the function with the result
  }, 1000);
}

// Pass a function as the callback
doSomethingAsync(function(result) {
  console.log("Got result:", result); // This runs after 1 second
});

console.log("This runs immediately, before the callback");

// Output:
// This runs immediately, before the callback
// Got result: work done!  ← (1 second later)
```

---

### 2.2 Synchronous Callbacks

Not all callbacks are asynchronous. Some callbacks are called immediately, right there and then.

```javascript
// Array methods use synchronous callbacks — called immediately for each element
const numbers = [1, 2, 3, 4, 5];

// forEach — callback is called right now, for each element, in order
numbers.forEach(function(number) {
  console.log("Number:", number);
});
// Output: Number: 1, Number: 2, Number: 3, Number: 4, Number: 5
// All in order, all synchronous

// map — transforms each element using a callback
const doubled = numbers.map(function(number) {
  return number * 2;
});
console.log(doubled); // [2, 4, 6, 8, 10]

// filter — keeps elements where callback returns true
const evens = numbers.filter(function(number) {
  return number % 2 === 0;
});
console.log(evens); // [2, 4]
```

In test automation, you use synchronous callbacks constantly — for example, when mapping test data or filtering results.

---

### 2.3 Asynchronous Callbacks

Asynchronous callbacks are called **later**, after some operation completes.

```javascript
// Reading a file (Node.js) — the callback is called when file reading is done
const fs = require("fs");

console.log("Starting to read file...");

fs.readFile("testData.json", "utf8", function(error, content) {
  // This callback runs LATER, when the file has been read
  if (error) {
    console.error("Failed to read file:", error.message);
    return;
  }
  console.log("File content:", content);
});

console.log("This runs BEFORE the file content is printed!");

// Output:
// Starting to read file...
// This runs BEFORE the file content is printed!
// File content: { ... }   ← runs when file reading is complete
```

---

### 2.4 Callback Hell — The Big Problem

When you need multiple async operations in sequence, callbacks get deeply nested. This is called **"Callback Hell"** or the **"Pyramid of Doom"**.

Imagine a test that needs to:
1. Log in to get an auth token
2. Use the token to fetch user data
3. Use the user data to load their orders
4. Verify the orders

```javascript
// ❌ CALLBACK HELL — deeply nested, hard to read, hard to maintain
loginUser("admin", "password123", function(error, token) {
  if (error) {
    console.error("Login failed:", error.message);
    return;
  }

  fetchUserData(token, function(error, user) {
    if (error) {
      console.error("User fetch failed:", error.message);
      return;
    }

    fetchUserOrders(user.id, function(error, orders) {
      if (error) {
        console.error("Orders fetch failed:", error.message);
        return;
      }

      verifyOrders(orders, function(error, result) {
        if (error) {
          console.error("Verification failed:", error.message);
          return;
        }

        console.log("All steps completed:", result);
        // ← This is 5 levels deep! And it only gets worse as steps are added.
        //   Imagine adding 3 more steps...
      });
    });
  });
});
```

**Problems with callback hell:**
- Code reads from left to right *and* top to bottom — hard to follow
- Error handling must be duplicated at every level
- Adding or removing a step requires restructuring everything
- Very difficult to debug
- Extremely hard to understand for someone reading your code

---

### 2.5 Why Callbacks Are Problematic in Test Automation

In test automation, callback hell creates specific problems:

```javascript
// ❌ A test written with callbacks — notice how hard it is to follow the test flow
test("user can complete purchase", function(done) {
  navigateToShop(function(err) {
    if (err) { done(err); return; }

    searchForProduct("laptop", function(err, product) {
      if (err) { done(err); return; }

      addToCart(product.id, function(err) {
        if (err) { done(err); return; }

        proceedToCheckout(function(err) {
          if (err) { done(err); return; }

          fillPaymentDetails(cardInfo, function(err) {
            if (err) { done(err); return; }

            submitOrder(function(err, order) {
              if (err) { done(err); return; }

              verifyOrderConfirmation(order.id, function(err, confirmed) {
                if (err) { done(err); return; }
                assert(confirmed === true);
                done(); // Test is complete
              });
            });
          });
        });
      });
    });
  });
});

// Can you easily tell what this test is doing? 
// Can you easily add a step in the middle? 
// This is why Promises and async/await were created.
```

---

### 2.6 Error Handling in Callbacks

The traditional callback pattern uses an **"error-first"** convention: the first argument to any callback is always the error (or `null` if no error occurred).

```javascript
// The Node.js convention: callback(error, result)
function readTestData(filePath, callback) {
  fs.readFile(filePath, "utf8", function(error, content) {
    if (error) {
      // First argument is the error — check it first
      callback(error, null);
      return;
    }
    // No error — first arg is null, second is the result
    callback(null, JSON.parse(content));
  });
}

// Usage
readTestData("users.json", function(error, data) {
  if (error) {
    // ALWAYS check the error first in a callback
    console.error("Could not load test data:", error.message);
    return; // Stop here — don't try to use data
  }
  // Safe to use data here
  console.log("Test data loaded:", data.length, "users");
});
```

---

## 3. Promises

### 3.1 What is a Promise?

A **Promise** is an object that represents the **eventual result** of an asynchronous operation. It's a commitment that a value will be provided in the future — either successfully or with an error.

Real-world analogy: When you order something online, you get an **order confirmation number**. That number is a *promise* — it represents a delivery that hasn't happened yet, but is on its way. You can use that number to track the delivery, and when it arrives, you take action.

```javascript
// A Promise object looks like this:
const myPromise = fetch("https://api.example.com/users");

// myPromise is not the data yet — it's a PROMISE that data will arrive.
// Right now, it's "pending."
// Later it will either be "fulfilled" (success) or "rejected" (error).

console.log(myPromise); // Promise { <pending> }
```

---

### 3.2 Promise States

A Promise can only ever be in **one of three states**:

```
                    ┌─────────────────┐
                    │                 │
                    │    PENDING      │  ← Initial state — work is in progress
                    │                 │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
              ▼                             ▼
   ┌──────────────────┐         ┌──────────────────┐
   │                  │         │                  │
   │   FULFILLED      │         │    REJECTED      │
   │   (resolved)     │         │    (failed)      │
   │                  │         │                  │
   │  .then() runs    │         │  .catch() runs   │
   └──────────────────┘         └──────────────────┘
```

| State         | Meaning                                        | What runs          |
|---------------|------------------------------------------------|--------------------|
| **Pending**   | The async operation is still in progress       | Nothing yet        |
| **Fulfilled** | The operation completed successfully           | `.then()` callback |
| **Rejected**  | The operation failed with an error             | `.catch()` callback |

**Important rules:**
- Once a Promise moves from pending to fulfilled or rejected, it **cannot change state again**
- A fulfilled promise **always delivers the same value** if you call `.then()` again later

---

### 3.3 Creating a Promise

You create a Promise using `new Promise()`, passing a function with two parameters: `resolve` (call this on success) and `reject` (call this on failure).

```javascript
// Basic Promise creation
const myPromise = new Promise(function(resolve, reject) {
  // The executor function runs immediately
  // You do your async work here

  const success = true; // Pretend this is the result of some operation

  if (success) {
    resolve("Operation succeeded!"); // Fulfill the promise with this value
  } else {
    reject(new Error("Operation failed!")); // Reject the promise with this error
  }
});

// A real example — wrapping a timer in a Promise
function waitFor(milliseconds) {
  return new Promise(function(resolve) {
    setTimeout(function() {
      resolve(); // Resolves after the specified time
    }, milliseconds);
  });
}

// Another real example — wrapping a file read in a Promise
function readFileSafe(filePath) {
  return new Promise(function(resolve, reject) {
    fs.readFile(filePath, "utf8", function(error, content) {
      if (error) {
        reject(error);        // Something went wrong — reject with the error
      } else {
        resolve(content);     // Success — resolve with the file content
      }
    });
  });
}
```

---

### 3.4 Consuming a Promise — .then() and .catch()

Once you have a Promise, you use `.then()` to handle success and `.catch()` to handle errors.

```javascript
// .then(onFulfilled) — runs when the promise resolves successfully
// .catch(onRejected) — runs when the promise rejects with an error

fetch("https://api.example.com/users/1")
  .then(function(response) {
    // .then receives the fulfilled value
    console.log("Got response, status:", response.status);
    return response.json(); // This returns ANOTHER promise
  })
  .then(function(user) {
    // This .then receives the result of response.json()
    console.log("User name:", user.name);
  })
  .catch(function(error) {
    // Runs if ANY of the above steps throws or rejects
    console.error("Something went wrong:", error.message);
  })
  .finally(function() {
    // Runs regardless of success or failure — like try/finally
    console.log("Request finished (success or failure)");
  });
```

#### .then() with both callbacks

`.then()` actually accepts two arguments: success handler and error handler.

```javascript
fetch("https://api.example.com/data")
  .then(
    function(response) {
      // First argument: success handler
      console.log("Success:", response.status);
    },
    function(error) {
      // Second argument: error handler (only for THIS step)
      console.error("This specific step failed:", error.message);
    }
  );

// However, it's cleaner to use .catch() at the end for all errors
```

---

### 3.5 Promise Chaining

The key power of Promises is **chaining** — each `.then()` can return a new value or a new Promise, and the next `.then()` receives that.

```javascript
// Each step flows into the next — much cleaner than callback hell!
loginUser("admin", "password123")
  .then(function(token) {
    // Step 1 complete: got a token
    console.log("Logged in, got token");
    return fetchUserData(token); // Return a NEW promise
  })
  .then(function(user) {
    // Step 2 complete: got user data (from the promise returned above)
    console.log("Got user:", user.name);
    return fetchUserOrders(user.id); // Return ANOTHER new promise
  })
  .then(function(orders) {
    // Step 3 complete: got orders
    console.log("Got", orders.length, "orders");
    return verifyOrders(orders);
  })
  .then(function(result) {
    // Step 4 complete: verified
    console.log("All verified:", result);
  })
  .catch(function(error) {
    // ONE catch at the end handles errors from ANY step above
    console.error("Something failed:", error.message);
  });
```

Compare this to the callback hell version earlier — same logic, much more readable.

**Important rules for chaining:**
- If a `.then()` returns a plain value (not a Promise), the next `.then()` receives that value directly
- If a `.then()` returns a Promise, the next `.then()` waits for that Promise to resolve
- If any `.then()` throws an error, execution skips to the nearest `.catch()`

---

### 3.6 Promise Methods — Complete Reference

JavaScript has six static methods on the `Promise` object for working with multiple promises. Here's each one explained with test automation context.

---

#### `Promise.all(promises)` — All must succeed

Waits for **all promises** to fulfill. If **any one fails**, the whole thing fails immediately.

**Use in test automation:** Load multiple independent pieces of test data at the same time, then proceed when all are ready.

```javascript
// ✅ Run multiple API calls in parallel — but wait for ALL before proceeding
Promise.all([
  fetch("https://api.example.com/users"),
  fetch("https://api.example.com/products"),
  fetch("https://api.example.com/categories")
])
  .then(function([usersRes, productsRes, categoriesRes]) {
    // All three succeeded — we get all results at once
    console.log("All data loaded, starting tests");
  })
  .catch(function(error) {
    // If ANY one fails, we get here
    console.error("Failed to load test data:", error.message);
    // Note: you don't know WHICH one failed without more work
  });

// Test automation example — loading test fixtures in parallel
async function loadAllTestData() {
  const [users, products, orders] = await Promise.all([
    loadTestUsers(),     // Returns a promise
    loadTestProducts(),  // Returns a promise
    loadTestOrders()     // Returns a promise
  ]);
  // All three are ready here — we can set up tests
  return { users, products, orders };
}
```

**Behavior:**
```
Promise 1: ──────────✓ (3 seconds)
Promise 2: ──────✓     (2 seconds)
Promise 3: ────────────────✓ (5 seconds)
                         ↑
               Promise.all resolves here (waits for the slowest)
               Total time: 5 seconds (not 3+2+5=10!)
```

---

#### `Promise.allSettled(promises)` — Wait for all, regardless of outcome

Waits for **all promises to finish** — whether they succeed or fail. Unlike `Promise.all`, it **never rejects**. Instead, you get an array of result objects, each telling you if it succeeded or failed.

**Use in test automation:** When you want to run multiple checks and see ALL results, even if some fail.

```javascript
Promise.allSettled([
  checkUserExists("user123"),
  checkProductExists("prod456"),
  checkOrderExists("order789")
])
  .then(function(results) {
    // results is an array of { status, value } or { status, reason }
    results.forEach(function(result, index) {
      if (result.status === "fulfilled") {
        console.log(`Check ${index + 1} passed:`, result.value);
      } else {
        // status === "rejected"
        console.error(`Check ${index + 1} failed:`, result.reason.message);
      }
    });
  });

// Test data setup — try to create test records, see which ones failed
async function setupTestData(items) {
  const results = await Promise.allSettled(
    items.map(item => createTestRecord(item))
  );

  const failures = results
    .filter(r => r.status === "rejected")
    .map(r => r.reason.message);

  if (failures.length > 0) {
    console.warn("Some test data failed to create:", failures);
  }

  return results
    .filter(r => r.status === "fulfilled")
    .map(r => r.value);
}
```

---

#### `Promise.race(promises)` — First one wins (success OR failure)

Resolves or rejects with **whichever promise settles first** — whether that's success or failure.

**Use in test automation:** Implementing timeouts, or racing a slow operation against a timer.

```javascript
// Implement a custom timeout for an operation
function withTimeout(promise, timeoutMs, description) {
  const timeoutPromise = new Promise(function(_, reject) {
    setTimeout(function() {
      reject(new Error(`"${description}" timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  // Race the actual operation against the timeout
  return Promise.race([promise, timeoutPromise]);
}

// Usage in tests
withTimeout(
  fetchUserProfile("user123"),   // The actual operation
  5000,                          // 5 second timeout
  "fetchUserProfile"
)
  .then(function(profile) {
    console.log("Got profile before timeout:", profile.name);
  })
  .catch(function(error) {
    // Either the fetch failed, OR the timeout fired first
    console.error("Failed:", error.message);
  });
```

---

#### `Promise.any(promises)` — First SUCCESS wins

Resolves with **the first promise that succeeds**. Only rejects if **ALL promises fail**.

**Use in test automation:** Try multiple endpoints or approaches, use whichever responds first.

```javascript
// Try to reach the app on multiple possible base URLs (e.g., for different environments)
Promise.any([
  fetch("https://staging.example.com/health"),
  fetch("https://dev.example.com/health"),
  fetch("https://localhost:3000/health")
])
  .then(function(response) {
    console.log("Server is reachable at:", response.url);
    // Use this URL for the rest of the tests
  })
  .catch(function(error) {
    // This is AggregateError — contains ALL individual errors
    console.error("All servers unreachable. Errors:", error.errors);
  });
```

---

#### `Promise.resolve(value)` — Create an already-fulfilled promise

Creates a Promise that is **already resolved** with the given value. Useful when you need to return a Promise but already have the value.

```javascript
// Useful for returning consistent types
function getUser(id) {
  if (id === "default") {
    // Return an already-resolved promise with a default user
    return Promise.resolve({ id: "default", name: "Guest User" });
  }
  // Otherwise fetch from API
  return fetch(`/api/users/${id}`).then(r => r.json());
}

// In test setup — return cached test data as a promise
function getCachedTestData() {
  if (cache.has("testData")) {
    return Promise.resolve(cache.get("testData")); // Already have it
  }
  return loadTestDataFromFile(); // Need to load it
}
```

---

#### `Promise.reject(error)` — Create an already-rejected promise

Creates a Promise that is **already rejected** with the given error.

```javascript
// Useful for early validation
function processOrder(order) {
  if (!order.userId) {
    // Return a rejected promise instead of throwing
    return Promise.reject(new Error("Order must have a userId"));
  }
  return submitOrderToAPI(order);
}

// In tests — mock a failing API call
function mockFailingApi() {
  return Promise.reject(new Error("Simulated API failure"));
}
```

---

#### Promise Methods Comparison Table

| Method                  | Waits for          | Resolves when                 | Rejects when              |
|-------------------------|--------------------|-------------------------------|---------------------------|
| `Promise.all()`         | All promises       | ALL succeed                   | ANY one fails             |
| `Promise.allSettled()`  | All promises       | ALL finish (any outcome)      | Never rejects             |
| `Promise.race()`        | First to settle    | First one succeeds            | First one fails           |
| `Promise.any()`         | First success      | ANY one succeeds              | ALL fail                  |
| `Promise.resolve()`     | Immediately        | Always (already resolved)     | Never                     |
| `Promise.reject()`      | Immediately        | Never                         | Always (already rejected) |

---

### 3.7 Error Handling in Promises

```javascript
// ── Pattern 1: .catch() at the end (most common) ──────────────────────────
fetchUser(1)
  .then(user => fetchOrders(user.id))
  .then(orders => displayOrders(orders))
  .catch(error => {
    // Catches errors from ALL steps above
    console.error("Pipeline failed at some step:", error.message);
  });

// ── Pattern 2: .catch() in the middle to recover ──────────────────────────
fetchPrimaryData()
  .catch(function(error) {
    // Primary data failed — try backup
    console.warn("Primary data failed, trying backup:", error.message);
    return fetchBackupData(); // Recovery — return a new promise
  })
  .then(function(data) {
    // This runs with EITHER primary OR backup data
    process(data);
  });

// ── Pattern 3: .finally() for cleanup ─────────────────────────────────────
showLoadingSpinner();

fetchData()
  .then(data => displayData(data))
  .catch(error => showError(error.message))
  .finally(() => {
    hideLoadingSpinner(); // Always hide the spinner, success or failure
  });
```

---

### 3.8 Promises in Test Automation Context

Before Playwright switched to `async/await`, tests were written with Promise chains. You'll still encounter this in older codebases.

```javascript
// Old-style Playwright test with Promises (you may see this in legacy code)
test("user can login", function() {
  return page.goto("https://example.com/login")     // Returns a Promise
    .then(() => page.fill("#username", "admin"))    // Each action is chained
    .then(() => page.fill("#password", "secret"))
    .then(() => page.click("#login-button"))
    .then(() => page.waitForURL("**/dashboard"))
    .then(() => expect(page.locator("h1")).toHaveText("Welcome"))
    .catch(error => {
      console.error("Login test failed:", error.message);
      throw error; // Re-throw so the test is marked as failed
    });
  // ← Note: the test function must RETURN the promise chain
  //   so the test runner knows when it's done
});
```

---

## 4. Async / Await

### 4.1 What is Async/Await?

`async/await` is **syntax sugar built on top of Promises**. It doesn't replace Promises — it makes them much easier to write and read. Under the hood, everything is still a Promise.

The key benefit: **async/await makes asynchronous code look like synchronous code**.

Compare the same logic written two ways:

```javascript
// ── With Promises (chaining) ───────────────────────────────────────────────
function runTest() {
  return page.goto("/login")
    .then(() => page.fill("#username", "admin"))
    .then(() => page.fill("#password", "secret"))
    .then(() => page.click("#submit"))
    .then(() => expect(page).toHaveURL("/dashboard"))
    .catch(error => { throw error; });
}

// ── With async/await (same logic, much cleaner) ────────────────────────────
async function runTest() {
  await page.goto("/login");
  await page.fill("#username", "admin");
  await page.fill("#password", "secret");
  await page.click("#submit");
  await expect(page).toHaveURL("/dashboard");
}
// Reads exactly like a numbered list of test steps!
```

---

### 4.2 The `async` Keyword

The `async` keyword placed before a function does two things:
1. It marks the function as asynchronous — you can use `await` inside it
2. It makes the function **always return a Promise** (even if you return a plain value)

```javascript
// Declaring async functions
async function myTest() {
  // You can use await inside here
}

const myArrowTest = async () => {
  // Arrow function version — also valid
};

// An async function ALWAYS returns a Promise
async function getValue() {
  return 42; // Looks like it returns 42
}

// But actually returns Promise<42>
getValue().then(value => console.log(value)); // 42

// This is why test functions in Playwright must be async:
// The test runner knows to wait for the Promise to resolve
test("my test", async ({ page }) => {
  // ← async here means the test runner waits for this function to complete
  await page.goto("https://example.com");
});
```

---

### 4.3 The `await` Keyword

The `await` keyword pauses execution of an `async` function until the Promise resolves, then returns the resolved value.

```javascript
async function example() {
  console.log("1. Start");

  // await pauses HERE — the function is suspended until the fetch completes
  const response = await fetch("https://api.example.com/data");
  // ← Execution resumes here only after fetch is done

  console.log("2. Fetch complete, status:", response.status);

  // await again — pauses until JSON parsing is done
  const data = await response.json();

  console.log("3. JSON parsed, got:", data.length, "items");

  return data;
}

// Output (always in this order):
// 1. Start
// 2. Fetch complete, status: 200
// 3. JSON parsed, got: 42 items
```

#### What `await` actually does under the hood:

```javascript
// These two are equivalent:

// With await:
const user = await fetchUser(1);
console.log(user.name);

// Without await (raw Promise):
fetchUser(1).then(function(user) {
  console.log(user.name);
});

// await just makes the promise chain look linear — same behavior underneath
```

---

### 4.4 Sequential Execution with await

This is the **most important concept for test automation**. Using `await` on each step ensures steps run one at a time, in order.

```javascript
// ✅ CORRECT — each step finishes before the next begins
test("complete purchase flow", async ({ page }) => {
  // Step 1 — Navigate (waits for page to load)
  await page.goto("https://shop.example.com");
  console.log("✓ Step 1: Navigated to shop");

  // Step 2 — Search for product (waits for search to complete)
  await page.fill("#search-input", "laptop");
  await page.press("#search-input", "Enter");
  console.log("✓ Step 2: Searched for laptop");

  // Step 3 — Wait for results and click the first product
  await page.waitForSelector(".product-card");
  await page.locator(".product-card").first().click();
  console.log("✓ Step 3: Clicked first product");

  // Step 4 — Add to cart
  await page.click("#add-to-cart");
  console.log("✓ Step 4: Added to cart");

  // Step 5 — Go to cart
  await page.click("#cart-icon");
  console.log("✓ Step 5: Opened cart");

  // Step 6 — Verify item is in cart
  await expect(page.locator(".cart-item")).toHaveText(/laptop/i);
  console.log("✓ Step 6: Verified item in cart");

  // Steps CANNOT overlap because of await — they are truly sequential
});
```

Without `await`, all steps would fire at the same time and overlap — tests would fail unpredictably.

---

### 4.5 Parallel Execution with Promise.all

Sometimes in test automation, you have operations that are **independent of each other** and can safely run at the same time. `Promise.all` with `await` lets you do both in parallel.

```javascript
// ✅ Parallel — when operations are INDEPENDENT of each other
test("setup and verify multiple independent data sets", async ({ page }) => {

  // These three API calls are completely independent — run them in parallel
  const [users, products, config] = await Promise.all([
    apiClient.getUsers(),       // Doesn't depend on products or config
    apiClient.getProducts(),    // Doesn't depend on users or config
    apiClient.getConfig()       // Doesn't depend on users or products
  ]);
  // ← All three run simultaneously, then we wait for ALL to finish

  console.log("Loaded:", users.length, "users,", products.length, "products");

  // Now proceed with the test using all three pieces of data
  await page.goto("/dashboard");
  await expect(page.locator(".user-count")).toHaveText(String(users.length));
});

// ❌ WRONG — do NOT use Promise.all for steps that depend on each other
// This is WRONG because the login token is needed for the next steps:
await Promise.all([
  loginUser(),              // Gets a token
  fetchUserData(token),     // Needs the token from loginUser() — won't have it yet!
  fetchOrders(userId)       // Needs userId from fetchUserData() — won't have it yet!
]);

// ✅ CORRECT — sequential when steps depend on each other
const token = await loginUser();
const user = await fetchUserData(token);
const orders = await fetchOrders(user.id);
```

**Rule of thumb for test automation:**
- Test STEPS that must happen in order → use sequential `await`
- Independent SETUP operations (loading test data, seeding DB) → can use `Promise.all`

---

### 4.6 Error Handling with Async/Await

With `async/await`, you use standard `try/catch` blocks — just like synchronous code.

```javascript
// Basic error handling
test("login with invalid credentials shows error", async ({ page }) => {
  try {
    await page.goto("https://example.com/login");
    await page.fill("#username", "wrong@example.com");
    await page.fill("#password", "wrongpassword");
    await page.click("#login-button");

    // Expect an error message to appear
    await expect(page.locator(".error-message"))
      .toBeVisible({ timeout: 5000 });

    await expect(page.locator(".error-message"))
      .toHaveText("Invalid credentials");

  } catch (error) {
    console.error("Test step failed:", error.message);
    await page.screenshot({ path: "login-failure-debug.png" });
    throw error; // Re-throw so the test is marked as FAILED
  }
});

// Multiple error handling levels
async function loginAndNavigate(page, username, password, targetUrl) {
  // Level 1: Login errors
  try {
    await page.goto("/login");
    await page.fill("#username", username);
    await page.fill("#password", password);
    await page.click("#submit");
    await page.waitForURL("**/dashboard", { timeout: 10000 });
  } catch (error) {
    throw new Error(`Login failed for user "${username}": ${error.message}`);
  }

  // Level 2: Navigation errors (only runs if login succeeded)
  try {
    await page.goto(targetUrl);
    await page.waitForLoadState("networkidle");
  } catch (error) {
    throw new Error(`Navigation to "${targetUrl}" failed: ${error.message}`);
  }
}
```

---

### 4.7 Common Async/Await Mistakes

#### Mistake 1: Forgetting `await` — most dangerous mistake

```javascript
// ❌ WRONG — missing await means the action is fired but not waited for
test("broken test", async ({ page }) => {
  page.goto("https://example.com");  // ← No await! Page might not be loaded yet
  page.click("#button");             // ← No await! Clicks before page is ready
  expect(page.locator("h1")).toHaveText("Title"); // ← No await! Check happens immediately
  // Test "passes" but didn't actually test anything reliably
});

// ✅ CORRECT
test("working test", async ({ page }) => {
  await page.goto("https://example.com");    // Wait for navigation to complete
  await page.click("#button");               // Wait for click to complete
  await expect(page.locator("h1")).toHaveText("Title"); // Wait for assertion
});
```

#### Mistake 2: Using `await` outside an `async` function

```javascript
// ❌ WRONG — await can only be used inside async functions
function myTest() {
  const result = await fetchData(); // SyntaxError: await is only valid in async functions
}

// ✅ CORRECT
async function myTest() {
  const result = await fetchData(); // Fine — function is async
}
```

#### Mistake 3: `await` in a loop — not awaiting each iteration

```javascript
// ❌ WRONG — forEach does not work with async/await
// All iterations fire at the same time!
const items = ["item1", "item2", "item3"];
items.forEach(async (item) => {
  await page.click(`#${item}`); // These all run in parallel, not in sequence!
});
// The test continues before any clicks are done

// ✅ CORRECT — use a regular for loop
for (const item of items) {
  await page.click(`#${item}`); // Each click waits for the previous to finish
}

// ✅ ALSO CORRECT — use for...of
for (const item of items) {
  await processItem(item);
}
```

#### Mistake 4: Not returning/awaiting async calls in setup functions

```javascript
// ❌ WRONG — beforeEach is async but the function isn't awaited
beforeEach(function() {
  page.goto("https://example.com"); // Not awaited! Page may not load before test starts
});

// ✅ CORRECT
beforeEach(async function() {
  await page.goto("https://example.com"); // Awaited — page is loaded before test starts
});
```

---

## 5. How Playwright Handles Asynchronous Operations

### 5.1 Why Playwright is Fully Async

Playwright controls a real browser process. Every command you send (click, navigate, type) involves:

1. Your test code sends a message to the browser
2. The browser processes the command (may take time)
3. The browser sends back confirmation or a result
4. Your test code receives the result and moves on

This communication is inherently asynchronous — it's network-like communication between processes. Therefore, **every single Playwright method returns a Promise**.

```
Your Test Code               Browser (Chromium/Firefox/WebKit)
      │                              │
      │──── "navigate to /login" ───▶│
      │                              │ (loading page...)
      │                              │ (parsing HTML...)
      │                              │ (loading resources...)
      │◀───── "navigation done" ─────│
      │                              │
      │──── "click #submit" ────────▶│
      │                              │ (finding element...)
      │                              │ (clicking element...)
      │◀───── "click done" ──────────│
      │                              │
  (each arrow is async communication)
```

---

### 5.2 Every Playwright Action Returns a Promise

```typescript
import { test, expect } from "@playwright/test";

test("understanding Playwright promises", async ({ page }) => {

  // Every one of these returns a Promise
  const p1 = page.goto("https://example.com");          // Promise<Response>
  const p2 = page.locator("h1").textContent();           // Promise<string | null>
  const p3 = page.locator("#btn").isVisible();           // Promise<boolean>
  const p4 = page.locator("input").count();              // Promise<number>
  const p5 = page.title();                               // Promise<string>
  const p6 = page.url();                                 // NOT a promise — returns string directly

  // Without await, p1-p5 are just pending Promises — nothing has happened yet!

  // WITH await — actually executes and gets the result
  await page.goto("https://example.com");           // Wait for navigation to complete
  const heading = await page.locator("h1").textContent(); // Wait for text, get the string
  const buttonVisible = await page.locator("#btn").isVisible(); // Wait, get boolean
  const inputCount = await page.locator("input").count();       // Wait, get number
  const title = await page.title();                             // Wait, get string

  console.log("Heading:", heading);         // "Welcome to Example"
  console.log("Button visible:", buttonVisible); // true or false
  console.log("Inputs found:", inputCount); // 3 (or however many)
  console.log("Page title:", title);        // "Example Domain"
});
```

---

### 5.3 await Makes Tests Run Step by Step

This is the fundamental principle of Playwright test automation. Every step uses `await` to ensure the previous step is fully complete before moving forward.

```typescript
test("full login flow — step by step with await", async ({ page }) => {

  // ─── STEP 1: Navigate ─────────────────────────────────────────────────
  // await ensures the page is FULLY loaded before proceeding to step 2
  await page.goto("https://example.com/login");
  // ← Only moves to step 2 when navigation is complete

  // ─── STEP 2: Find the form and verify it's visible ────────────────────
  await expect(page.locator("#login-form")).toBeVisible();
  // ← Only moves to step 3 when this assertion passes (or times out and fails)

  // ─── STEP 3: Fill username ────────────────────────────────────────────
  await page.fill("#username", "testuser@example.com");
  // ← Only moves to step 4 when the field is filled

  // ─── STEP 4: Fill password ────────────────────────────────────────────
  await page.fill("#password", "SecurePassword123");
  // ← Only moves to step 5 when the field is filled

  // ─── STEP 5: Click submit ─────────────────────────────────────────────
  await page.click("#login-button");
  // ← Only moves to step 6 when the click action is complete

  // ─── STEP 6: Wait for navigation to dashboard ─────────────────────────
  await page.waitForURL("**/dashboard");
  // ← Only moves to step 7 when the URL matches the pattern

  // ─── STEP 7: Verify successful login ──────────────────────────────────
  await expect(page.locator(".welcome-message")).toBeVisible();
  await expect(page.locator(".welcome-message")).toContainText("Welcome, testuser");
  // ← Test completes here — all steps ran in perfect sequence
});
```

---

### 5.4 What Happens if You Forget `await`

This is the #1 cause of flaky (unreliable) Playwright tests. Here's exactly what goes wrong:

```typescript
// ❌ BROKEN TEST — missing await on critical steps
test("broken login test", async ({ page }) => {
  page.goto("https://example.com/login"); // 🔴 No await!
  // JavaScript immediately moves to the next line
  // The browser is STILL loading the page

  page.fill("#username", "testuser"); // 🔴 No await!
  // Tries to fill a field on a page that may not have loaded yet
  // Playwright might not find #username yet → the fill may fail silently or timeout

  page.click("#login-button"); // 🔴 No await!
  // Tries to click before the form is filled → wrong behavior

  expect(page.locator(".welcome")).toBeVisible(); // 🔴 No await!
  // Checks immediately — before login could possibly complete → FAILS

  // The test function ends, but all the async operations are still running
  // in the background. Results are completely unpredictable.
});

// ✅ FIXED — every step awaited
test("working login test", async ({ page }) => {
  await page.goto("https://example.com/login");      // ✅ Wait for page load
  await page.fill("#username", "testuser");           // ✅ Wait for fill
  await page.fill("#password", "password");           // ✅ Wait for fill
  await page.click("#login-button");                  // ✅ Wait for click
  await expect(page.locator(".welcome")).toBeVisible(); // ✅ Wait for assertion
  // Every step completes before the next starts — test is reliable
});
```

**TypeScript/ESLint helps catch this:** Many teams use the `@typescript-eslint/no-floating-promises` ESLint rule to catch missing `await` at compile time.

---

### 5.5 Playwright's Built-in Auto-Waiting

Even though you must `await` every action, Playwright is smart about what it waits for internally. Before executing most actions, Playwright automatically waits for conditions to be met — this is called **auto-waiting**.

When you write `await page.click("#submit")`, Playwright internally waits until:

```
┌─────────────────────────────────────────────────────────────┐
│ Playwright Auto-Waiting Checklist for click("#submit")      │
│                                                             │
│  ☐ 1. Element exists in the DOM (attached)                  │
│  ☐ 2. Element is visible (not hidden or display:none)       │
│  ☐ 3. Element is enabled (not disabled attribute)           │
│  ☐ 4. Element is stable (not moving/animating)              │
│  ☐ 5. Element receives events (not obscured by overlay)     │
│  ☐ 6. Element is in viewport (scrolled into view)           │
│                                                             │
│  Only after ALL conditions are met → click is performed     │
└─────────────────────────────────────────────────────────────┘
```

This auto-waiting replaces many manual `waitForSelector` calls you'd need in older tools:

```typescript
// ❌ Old approach (Selenium-style) — manual waiting everywhere
await driver.wait(until.elementLocated(By.id("submit")), 10000);
await driver.wait(until.elementIsVisible(submitBtn), 10000);
await driver.wait(until.elementIsEnabled(submitBtn), 10000);
await submitBtn.click();

// ✅ Playwright — auto-waiting handles all of this for you
await page.click("#submit"); // All the waiting above happens automatically
```

---

### 5.6 waitFor Methods — Explicit Waiting

Sometimes you need to wait for something specific that Playwright can't automatically detect. These methods give you fine-grained control.

#### `page.waitForSelector()` — Wait for an element to appear

```typescript
test("wait for dynamic content to load", async ({ page }) => {
  await page.goto("https://example.com/dashboard");

  // Wait until the data table appears (loaded dynamically via API)
  // Without this, we might try to interact before the table loads
  await page.waitForSelector(".data-table", {
    state: "visible",  // Wait until it's visible (default)
    timeout: 10000     // Wait up to 10 seconds
  });

  // Now safely interact with the table
  const rows = await page.locator(".data-table tr").count();
  console.log("Table has", rows, "rows");

  // waitForSelector state options:
  // "attached"  — element exists in DOM (may still be hidden)
  // "detached"  — element is removed from DOM
  // "visible"   — element is visible on screen (default)
  // "hidden"    — element is hidden or removed
});
```

#### `page.waitForURL()` — Wait for navigation to a specific URL

```typescript
test("wait for redirect after login", async ({ page }) => {
  await page.goto("https://example.com/login");
  await page.fill("#email", "user@test.com");
  await page.fill("#password", "password");
  await page.click("#login");

  // After clicking login, the app redirects — wait for the redirect to complete
  await page.waitForURL("**/dashboard", {
    timeout: 15000,
    waitUntil: "networkidle"  // Also wait for the dashboard to finish loading
  });

  // Now we're on the dashboard
  await expect(page.locator("h1")).toHaveText("Dashboard");
});
```

#### `page.waitForLoadState()` — Wait for page load state

```typescript
test("wait for page to fully load", async ({ page }) => {
  await page.goto("https://example.com");

  // Wait states (from fastest to slowest):
  await page.waitForLoadState("domcontentloaded"); // HTML parsed, scripts starting
  await page.waitForLoadState("load");             // Images and stylesheets loaded
  await page.waitForLoadState("networkidle");      // No network requests for 500ms

  // Use networkidle for pages that load data dynamically via API
  await page.goto("https://example.com/reports");
  await page.waitForLoadState("networkidle"); // Wait for all API calls to finish
  // Now all report data has been loaded
});
```

#### `page.waitForResponse()` — Wait for a specific network response

```typescript
test("wait for API call to complete before asserting", async ({ page }) => {
  await page.goto("https://example.com/products");

  // Click "Load More" and wait for the API call that loads more products
  const [response] = await Promise.all([
    // Start waiting for the response BEFORE clicking
    // (if you click first, you might miss the response)
    page.waitForResponse("**/api/products*"),
    page.click("#load-more-button")
  ]);

  // Verify the API returned successfully
  expect(response.status()).toBe(200);

  // Now assert the new products appeared in the UI
  const productCount = await page.locator(".product-card").count();
  expect(productCount).toBeGreaterThan(10);
});
```

#### `page.waitForFunction()` — Wait for a custom JavaScript condition

```typescript
test("wait for a custom JavaScript condition in the page", async ({ page }) => {
  await page.goto("https://example.com/upload");

  // Trigger a file upload
  await page.setInputFiles("#file-input", "test-file.pdf");
  await page.click("#upload-button");

  // Wait until the upload progress (tracked by a JS variable in the page) reaches 100%
  await page.waitForFunction(() => {
    // This code runs IN THE BROWSER — can access window, document, etc.
    return (window as any).uploadProgress === 100;
  }, {
    timeout: 30000 // Uploads can take time — 30 second timeout
  });

  // Upload is 100% complete
  await expect(page.locator(".upload-success")).toBeVisible();
});
```

#### `locator.waitFor()` — Wait on a specific locator

```typescript
test("wait for specific element state", async ({ page }) => {
  await page.goto("https://example.com/checkout");

  // Click "Apply Coupon" which triggers an async coupon validation
  await page.fill("#coupon-code", "SAVE20");
  await page.click("#apply-coupon");

  // Wait for the loading spinner to disappear (validation in progress)
  await page.locator(".spinner").waitFor({ state: "hidden", timeout: 10000 });

  // Wait for the success or error message to appear
  await page.locator(".coupon-result").waitFor({ state: "visible" });

  // Now read the result
  const result = await page.locator(".coupon-result").textContent();
  console.log("Coupon result:", result); // "Coupon applied! 20% off"
});
```

---

### 5.7 Sequential Test Steps — The Right Way

Here's a complete, real-world example showing how to write reliable sequential test steps for a complex flow:

```typescript
import { test, expect } from "@playwright/test";

test("complete e-commerce checkout flow", async ({ page }) => {

  // ══════════════════════════════════════════════════════════════
  // PHASE 1: BROWSE AND SELECT A PRODUCT
  // ══════════════════════════════════════════════════════════════

  // Navigate to homepage
  await page.goto("https://shop.example.com");
  await expect(page).toHaveTitle(/Example Shop/);

  // Navigate to electronics category
  await page.click("nav >> text=Electronics");
  await page.waitForURL("**/electronics");

  // Wait for product grid to load (it loads via API call)
  await page.waitForSelector(".product-grid", { state: "visible" });

  // Select the first laptop
  await page.locator(".product-card").filter({ hasText: "Laptop" }).first().click();
  await page.waitForLoadState("networkidle"); // Wait for product page API calls

  // Verify we're on the correct product page
  await expect(page.locator("h1")).toContainText("Laptop");
  await expect(page.locator(".price")).toBeVisible();

  // ══════════════════════════════════════════════════════════════
  // PHASE 2: ADD TO CART
  // ══════════════════════════════════════════════════════════════

  // Select quantity
  await page.selectOption("#quantity", "2");

  // Add to cart — wait for the cart count to update (confirms the add worked)
  await page.click("#add-to-cart");
  await expect(page.locator(".cart-count")).toHaveText("2");

  // ══════════════════════════════════════════════════════════════
  // PHASE 3: CHECKOUT
  // ══════════════════════════════════════════════════════════════

  // Go to cart
  await page.click("#cart-icon");
  await page.waitForURL("**/cart");

  // Verify cart contents
  await expect(page.locator(".cart-item")).toHaveCount(1);
  await expect(page.locator(".cart-item")).toContainText("Laptop");
  await expect(page.locator(".cart-total")).toBeVisible();

  // Proceed to checkout
  await page.click("#proceed-to-checkout");
  await page.waitForURL("**/checkout");

  // Fill shipping details — each field awaited individually
  await page.fill("#first-name", "John");
  await page.fill("#last-name", "Doe");
  await page.fill("#email", "john.doe@test.com");
  await page.fill("#address", "123 Test Street");
  await page.fill("#city", "Test City");
  await page.selectOption("#country", "US");
  await page.fill("#zip", "12345");

  // Fill payment details
  await page.fill("#card-number", "4111111111111111");
  await page.fill("#expiry", "12/26");
  await page.fill("#cvv", "123");

  // ══════════════════════════════════════════════════════════════
  // PHASE 4: PLACE ORDER AND VERIFY
  // ══════════════════════════════════════════════════════════════

  // Wait for the API confirmation response AND click at the same time
  const [orderResponse] = await Promise.all([
    page.waitForResponse("**/api/orders"),   // Wait for the order API call
    page.click("#place-order")               // Click the button
  ]);

  // Verify the order was accepted by the API
  expect(orderResponse.status()).toBe(201); // 201 Created

  // Wait for the confirmation page
  await page.waitForURL("**/order-confirmation/**");

  // Verify order confirmation details
  await expect(page.locator(".order-number")).toBeVisible();
  await expect(page.locator(".confirmation-message")).toHaveText(
    /Thank you for your order/i
  );

  // Store the order number for future reference
  const orderNumber = await page.locator(".order-number").textContent();
  console.log("Order placed successfully:", orderNumber);
});
```

---

### 5.8 Running Steps in Parallel — When It's Safe

Not everything needs to be sequential. Here are safe opportunities to use parallel execution in tests:

```typescript
test("parallel operations where order doesn't matter", async ({ page, context }) => {

  // ── SAFE: Load independent test data in parallel ──────────────────────
  const [users, products] = await Promise.all([
    apiClient.getTestUsers(),    // No dependency on products
    apiClient.getTestProducts()  // No dependency on users
  ]);
  // Both loaded simultaneously — faster setup

  // ── SAFE: Assert multiple independent things at once ──────────────────
  // These assertions check different elements that don't depend on each other
  await Promise.all([
    expect(page.locator("header")).toBeVisible(),
    expect(page.locator("nav")).toBeVisible(),
    expect(page.locator("footer")).toBeVisible(),
    expect(page.locator("main")).toBeVisible()
  ]);

  // ── SAFE: Open multiple tabs for independent scenarios ─────────────────
  const [page1, page2] = await Promise.all([
    context.newPage(),  // Open tab 1
    context.newPage()   // Open tab 2
  ]);

  // Navigate both tabs in parallel (they're independent)
  await Promise.all([
    page1.goto("https://example.com/page1"),
    page2.goto("https://example.com/page2")
  ]);

  // ── NOT SAFE: Steps that depend on each other ─────────────────────────
  // Do NOT parallelize:
  // await Promise.all([
  //   page.goto("/login"),           // Must complete before fill
  //   page.fill("#username", "admin") // Depends on navigation being done
  // ]);
});
```

---

### 5.9 Page Object Model with Async Methods

The **Page Object Model (POM)** is a design pattern for organizing Playwright tests. It groups related page actions into classes. Since Playwright is async, all methods must be `async` and all actions must be `awaited`.

```typescript
// pages/LoginPage.ts — encapsulates all login page interactions
import { Page, expect } from "@playwright/test";

export class LoginPage {
  // Store the page reference
  constructor(private page: Page) {}

  // ── Navigation ─────────────────────────────────────────────────────────
  async navigate(): Promise<void> {
    await this.page.goto("/login");
    // Wait for the login form to be ready before returning
    await this.page.waitForSelector("#login-form", { state: "visible" });
  }

  // ── Actions ────────────────────────────────────────────────────────────
  async fillEmail(email: string): Promise<void> {
    await this.page.fill("#email", email);
  }

  async fillPassword(password: string): Promise<void> {
    await this.page.fill("#password", password);
  }

  async clickLoginButton(): Promise<void> {
    await this.page.click("#login-button");
  }

  // ── Compound action (combines multiple steps) ──────────────────────────
  async login(email: string, password: string): Promise<void> {
    // Each step is awaited — sequential execution guaranteed
    await this.navigate();
    await this.fillEmail(email);
    await this.fillPassword(password);
    await this.clickLoginButton();
    // Wait for successful navigation to dashboard
    await this.page.waitForURL("**/dashboard", { timeout: 10000 });
  }

  // ── Assertions (also async — must await Playwright expectations) ────────
  async expectErrorMessage(expectedText: string): Promise<void> {
    await expect(this.page.locator(".error-message")).toBeVisible();
    await expect(this.page.locator(".error-message")).toHaveText(expectedText);
  }

  async expectLoginFormVisible(): Promise<void> {
    await expect(this.page.locator("#login-form")).toBeVisible();
    await expect(this.page.locator("#email")).toBeVisible();
    await expect(this.page.locator("#password")).toBeVisible();
  }

  // ── Getters (for reading page state) ───────────────────────────────────
  async getPageTitle(): Promise<string> {
    return await this.page.title();
  }
}

// pages/DashboardPage.ts
export class DashboardPage {
  constructor(private page: Page) {}

  async isLoaded(): Promise<boolean> {
    try {
      await this.page.waitForSelector(".dashboard-header", {
        state: "visible",
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  async getWelcomeMessage(): Promise<string> {
    return await this.page.locator(".welcome-message").textContent() ?? "";
  }

  async navigateTo(section: string): Promise<void> {
    await this.page.click(`nav >> text=${section}`);
    await this.page.waitForLoadState("networkidle");
  }
}

// tests/login.test.ts — using the Page Object Model
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";

test.describe("Login functionality", () => {

  test("successful login redirects to dashboard", async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Use the page object methods — clean, readable test steps
    await loginPage.login("admin@example.com", "password123");

    // Verify we're on the dashboard
    const loaded = await dashboardPage.isLoaded();
    expect(loaded).toBe(true);

    const welcomeMsg = await dashboardPage.getWelcomeMessage();
    expect(welcomeMsg).toContain("Welcome, admin");
  });

  test("invalid credentials show error message", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.fillEmail("wrong@example.com");
    await loginPage.fillPassword("wrongpassword");
    await loginPage.clickLoginButton();

    await loginPage.expectErrorMessage("Invalid email or password");
  });

  test("empty form shows validation errors", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.navigate();
    await loginPage.clickLoginButton(); // Click without filling anything

    // Both validation errors should appear
    await expect(page.locator(".validation-error")).toHaveCount(2);
  });
});
```

---

### 5.10 Async in beforeEach, afterEach, beforeAll, afterAll

Playwright's test hooks (`beforeEach`, `afterEach`, `beforeAll`, `afterAll`) all support async operations. They must also use `async/await` to ensure setup completes before tests run.

```typescript
import { test, expect } from "@playwright/test";
import { LoginPage } from "../pages/LoginPage";

test.describe("Tests that require login", () => {

  // ── beforeAll: Runs ONCE before all tests in this describe block ────────
  // Use for expensive one-time setup (creating test data, seeding a database)
  test.beforeAll(async ({ request }) => {
    // Create a test user via API before any tests run
    // This runs only ONCE — not before each test
    const response = await request.post("/api/test/users", {
      data: {
        email: "testuser@example.com",
        password: "TestPass123",
        role: "admin"
      }
    });
    expect(response.ok()).toBeTruthy();
    console.log("✓ Test user created");
  });

  // ── beforeEach: Runs before EVERY test in this describe block ──────────
  // Use for per-test setup (login, navigate to starting page)
  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    // Log in before every test — each test starts from the dashboard
    await loginPage.login("testuser@example.com", "TestPass123");
    console.log("✓ Logged in for test");
    // Each test function only runs AFTER login is complete
  });

  // ── afterEach: Runs after EVERY test in this describe block ────────────
  // Use for per-test cleanup (logout, reset data changed by the test)
  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== "passed") {
      // Take a screenshot if the test failed — for debugging
      await page.screenshot({
        path: `screenshots/failure-${testInfo.title}.png`,
        fullPage: true
      });
      console.log(`✗ Test failed: ${testInfo.title}`);
    }
    // Log out after every test — clean slate for the next test
    await page.click("#logout-button").catch(() => {
      // Logout might fail if test navigated away — that's okay
    });
  });

  // ── afterAll: Runs ONCE after all tests in this describe block ──────────
  // Use for expensive one-time cleanup (deleting test data, closing connections)
  test.afterAll(async ({ request }) => {
    // Delete the test user after all tests are done
    await request.delete("/api/test/users/testuser@example.com");
    console.log("✓ Test user cleaned up");
  });

  // ── The actual tests ────────────────────────────────────────────────────
  // By the time these run, beforeAll and beforeEach have both completed
  test("can access the admin panel", async ({ page }) => {
    // loginPage.login() already ran in beforeEach — we're already on dashboard
    await page.click("nav >> text=Admin");
    await expect(page).toHaveURL("**/admin");
    await expect(page.locator("h1")).toHaveText("Admin Panel");
  });

  test("can view user list", async ({ page }) => {
    await page.goto("/admin/users");
    await expect(page.locator(".user-table")).toBeVisible();
    const userCount = await page.locator(".user-table tr").count();
    expect(userCount).toBeGreaterThan(0);
  });
});
```

---

### 5.11 Handling Async in Test Data Setup

Real tests often need complex setup — creating records, seeding a database, or calling APIs. Here's how to handle async setup properly.

```typescript
import { test, expect } from "@playwright/test";

// ── Utility: Create test data via API ─────────────────────────────────────
interface TestUser {
  id: string;
  email: string;
  password: string;
}

async function createTestUser(request: any): Promise<TestUser> {
  const uniqueEmail = `test-${Date.now()}@example.com`;

  const response = await request.post("/api/users", {
    data: { email: uniqueEmail, password: "TestPass123", role: "user" }
  });

  if (!response.ok()) {
    throw new Error(`Failed to create test user: ${response.status()}`);
  }

  const user = await response.json();
  return { id: user.id, email: uniqueEmail, password: "TestPass123" };
}

async function deleteTestUser(request: any, userId: string): Promise<void> {
  await request.delete(`/api/users/${userId}`);
}

// ── Test using async setup and teardown ────────────────────────────────────
test("user profile can be updated", async ({ page, request }) => {
  let testUser: TestUser | null = null;

  try {
    // SETUP: Create a test user via API
    testUser = await createTestUser(request);
    console.log("Created test user:", testUser.email);

    // STEP 1: Log in as the test user
    await page.goto("/login");
    await page.fill("#email", testUser.email);
    await page.fill("#password", testUser.password);
    await page.click("#login-button");
    await page.waitForURL("**/dashboard");

    // STEP 2: Navigate to profile settings
    await page.goto(`/profile/${testUser.id}`);
    await page.waitForLoadState("networkidle");

    // STEP 3: Update the display name
    await page.fill("#display-name", "Updated Test Name");
    await page.click("#save-profile");

    // STEP 4: Verify the change was saved
    await expect(page.locator(".success-toast")).toBeVisible();
    await expect(page.locator("#display-name")).toHaveValue("Updated Test Name");

  } finally {
    // CLEANUP: Always delete the test user, even if the test fails
    if (testUser) {
      await deleteTestUser(request, testUser.id);
      console.log("Cleaned up test user:", testUser.id);
    }
  }
});

// ── Create multiple test records in parallel ───────────────────────────────
test("admin can view all users", async ({ page, request }) => {
  // Create 5 test users in parallel — much faster than sequential
  const createdUsers = await Promise.all([
    createTestUser(request),
    createTestUser(request),
    createTestUser(request),
    createTestUser(request),
    createTestUser(request)
  ]);

  try {
    // Navigate to admin panel and verify all users are listed
    await page.goto("/admin/users");
    await page.waitForLoadState("networkidle");

    // Verify each created user appears in the list
    for (const user of createdUsers) {
      await expect(page.locator(`.user-table >> text=${user.email}`)).toBeVisible();
    }

    const totalCount = await page.locator(".user-table tbody tr").count();
    expect(totalCount).toBeGreaterThanOrEqual(createdUsers.length);

  } finally {
    // Clean up all created users in parallel
    await Promise.all(
      createdUsers.map(user => deleteTestUser(request, user.id))
    );
    console.log(`Cleaned up ${createdUsers.length} test users`);
  }
});
```

---

### 5.12 Common Playwright Async Mistakes

#### Mistake 1: Missing `await` on assertions

```typescript
// ❌ WRONG — expect() in Playwright also returns a Promise and must be awaited
test("broken assertion", async ({ page }) => {
  await page.goto("https://example.com");
  expect(page.locator("h1")).toHaveText("Welcome"); // ← Missing await!
  // The assertion fires and the test appears to "pass" without actually checking
});

// ✅ CORRECT
test("correct assertion", async ({ page }) => {
  await page.goto("https://example.com");
  await expect(page.locator("h1")).toHaveText("Welcome"); // ← Awaited!
});
```

#### Mistake 2: Not awaiting in Page Object methods

```typescript
// ❌ WRONG — a Page Object method that doesn't await internally
class ProductPage {
  async addToCart(): Promise<void> {
    this.page.click("#add-to-cart"); // ← Missing await!
    this.page.waitForSelector(".cart-updated"); // ← Missing await!
    // Method returns before either action completes
  }
}

// ✅ CORRECT
class ProductPage {
  async addToCart(): Promise<void> {
    await this.page.click("#add-to-cart"); // ✅ Awaited
    await this.page.waitForSelector(".cart-updated"); // ✅ Awaited
    // Method only returns after both actions complete
  }
}
```

#### Mistake 3: Mixing await with .then()

```typescript
// ❌ CONFUSING — mixing styles leads to errors and hard-to-read code
test("mixed style — avoid this", async ({ page }) => {
  await page.goto("/login")
    .then(() => page.fill("#username", "admin")) // ← Mixing await and .then()
    .then(() => page.click("#submit"));
  // This works but is inconsistent and hard to read
});

// ✅ CONSISTENT — stick to one style: async/await
test("consistent style", async ({ page }) => {
  await page.goto("/login");
  await page.fill("#username", "admin");
  await page.click("#submit");
});
```

#### Mistake 4: Race condition — clicking before waiting for navigation

```typescript
// ❌ WRONG — the waitForURL starts AFTER the click, and might miss the navigation
test("race condition", async ({ page }) => {
  await page.click("#checkout");           // Navigation starts here
  await page.waitForURL("**/checkout");    // Too late — navigation may have already happened
});

// ✅ CORRECT — start waiting for the navigation BEFORE clicking
test("no race condition", async ({ page }) => {
  // Start both simultaneously — waitForURL is registered first
  await Promise.all([
    page.waitForURL("**/checkout"),  // Registered first
    page.click("#checkout")          // Then click
  ]);
});
```

#### Mistake 5: Using async inside forEach for sequential steps

```typescript
// ❌ WRONG — forEach with async doesn't wait between iterations
const formFields = [
  { selector: "#name", value: "John Doe" },
  { selector: "#email", value: "john@test.com" },
  { selector: "#phone", value: "555-1234" }
];

formFields.forEach(async (field) => {
  await page.fill(field.selector, field.value); // Fires all simultaneously!
});
// Test continues before any field is filled

// ✅ CORRECT — use for...of to ensure sequential execution
for (const field of formFields) {
  await page.fill(field.selector, field.value); // One at a time, in order
}
```

---

## 6. Quick Reference Cheat Sheet

### Callbacks
```javascript
// Synchronous callback
array.forEach(item => console.log(item));         // Runs immediately for each item
array.map(item => item * 2);                      // Transforms and returns new array
array.filter(item => item > 0);                   // Returns matching items

// Asynchronous callback (error-first convention)
fs.readFile("file.txt", "utf8", (error, data) => {
  if (error) { /* handle error */ return; }
  // use data
});

// ❌ Callback Hell — avoid nested callbacks, use Promises or async/await instead
```

---

### Promises
```javascript
// Create
const p = new Promise((resolve, reject) => {
  // async work...
  if (success) resolve(value);
  else reject(new Error("failed"));
});

// Consume
p.then(value => console.log(value))
 .catch(error => console.error(error))
 .finally(() => console.log("done"));

// Chain
fetchUser()
  .then(user => fetchOrders(user.id))  // Each .then can return a new Promise
  .then(orders => displayOrders(orders))
  .catch(error => console.error(error));

// Static methods
Promise.all([p1, p2, p3])          // Wait for ALL, fail if any fails
Promise.allSettled([p1, p2, p3])   // Wait for ALL, never fails, check each result
Promise.race([p1, p2, p3])         // First to settle (success or failure) wins
Promise.any([p1, p2, p3])          // First to SUCCEED wins
Promise.resolve(value)             // Already-fulfilled promise
Promise.reject(new Error("..."))   // Already-rejected promise
```

---

### Async / Await
```javascript
// Declare
async function myFunction() {
  const result = await somePromise();    // Pauses until resolved
  return result;                         // Automatically wrapped in a Promise
}

// Sequential (test steps — use this for ordered actions)
async function runTest() {
  await step1();   // Completes fully
  await step2();   // Then this runs
  await step3();   // Then this runs
}

// Parallel (independent operations)
const [a, b, c] = await Promise.all([step1(), step2(), step3()]);

// Error handling
try {
  await riskyOperation();
} catch (error) {
  console.error(error.message);
}

// Loop — use for...of, NOT forEach
for (const item of items) {
  await processItem(item); // Awaits each one
}
```

---

### Playwright Async Quick Reference
```typescript
// Every action MUST be awaited
await page.goto("/url");
await page.click("#selector");
await page.fill("#input", "value");
await page.selectOption("#dropdown", "option");
await page.press("#input", "Enter");

// Assertions — MUST be awaited
await expect(page.locator("h1")).toBeVisible();
await expect(page.locator("h1")).toHaveText("Title");
await expect(page).toHaveURL("/expected-url");

// Explicit waits
await page.waitForSelector(".element");
await page.waitForURL("**/target-page");
await page.waitForLoadState("networkidle");
await page.waitForResponse("**/api/endpoint");
await locator.waitFor({ state: "visible" });

// Test structure
test("name", async ({ page }) => { /* all steps awaited */ });
test.beforeEach(async ({ page }) => { /* setup awaited */ });
test.afterEach(async ({ page }) => { /* cleanup awaited */ });

// Page Object Model — all methods async, all actions awaited
class MyPage {
  constructor(private page: Page) {}
  async doAction(): Promise<void> {
    await this.page.click("#btn"); // ← await inside POM methods
  }
}

// Race condition fix — register listener BEFORE triggering the event
await Promise.all([
  page.waitForURL("**/target"),   // Registered first
  page.click("#navigate-button")  // Then trigger
]);

// Sequential loop
for (const item of items) { await page.click(`#${item}`); }
// ❌ NEVER: items.forEach(async item => await page.click(...))
```

---

> ✅ **You have now covered:**
> - What synchronous and asynchronous mean, and why async exists in JavaScript
> - Callbacks — what they are, how they work, and why callback hell is a problem
> - Promises — all three states, creation, consumption, chaining, and all 6 static methods
> - Async/Await — how it makes async code sequential, error handling, and common mistakes
> - How Playwright uses async under the hood for every browser interaction
> - How `await` enforces sequential test step execution
> - Playwright's auto-waiting and all waitFor methods
> - Page Object Model patterns with proper async usage
> - beforeEach/afterEach async setup and teardown
> - Every common async mistake in Playwright and how to avoid it
