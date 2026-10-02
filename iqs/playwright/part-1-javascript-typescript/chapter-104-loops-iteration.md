# Chapter 104 — Loops & Iteration

This chapter covers every loop type JavaScript provides and how they behave
with async code. Interviewers test loops because `forEach` + `await` is one
of the most common bugs in Playwright tests — a test that silently does
nothing and still passes. Questions move from loop syntax through async
behaviour to short practical tasks.

---

## Q104.1 — What types of loops does JavaScript have?

- `for` — fixed number of iterations with a counter
- `while` — repeats while a condition is true (checked before)
- `do...while` — always runs once, then checks condition
- `for...of` — iterates over values of an array or any sequence
- `for...in` — iterates over keys of an object
- `forEach` — array method, calls a callback per element

---

## Q104.2 — What is the difference between for, while, and do...while?

```javascript
// for — when you know the count
for (let i = 0; i < 3; i++) {
  console.log(i); // 0, 1, 2
}

// while — when count is unknown, condition checked first
let n = 0;
while (n < 3) {
  console.log(n++);
}

// do...while — always runs at least once
let x = 5;
do {
  console.log(x); // prints 5 even though condition is false
} while (x < 3);
```

---

## Q104.3 — When do you use a loop in a Playwright test?

Loops appear in test automation in four situations:

- Iterating over test data — running the same steps for multiple inputs
- Collecting values from the page — reading text from a list of elements
- Retry logic — repeating a step until it succeeds or a limit is reached
- API setup — creating multiple test records before a test runs

The key rule: any loop that contains `await` must use `for...of`, not
`forEach`.

---

## Q104.4 — How do you use loops in your automation project?

In our project, `for...of` is the standard async loop. We iterate over
test data arrays, sets of URLs to check, and API records to clean up.

We have an ESLint rule that bans `forEach(async`. If anyone writes
`array.forEach(async () => ...)`, CI fails immediately.

---

## Q104.5 — What is the difference between for...of and for...in?

`for...of` gives you the **values** of a sequence (array, string, Set).
`for...in` gives you the **keys** of an object (or array indices as strings).

```javascript
const fruits = ["apple", "banana", "cherry"];

for (const fruit of fruits) {
  console.log(fruit);        // "apple", "banana", "cherry"
}

for (const index in fruits) {
  console.log(index);        // "0", "1", "2"  — strings!
}

const config = { timeout: 5000, retries: 2 };
for (const key in config) {
  console.log(key, config[key]); // "timeout" 5000, "retries" 2
}
```

Use `for...of` for arrays. Use `for...in` for plain objects.
Never use `for...in` on arrays in production code.

---

## Q104.6 — What is the difference between forEach and for...of?

Both iterate over array elements. The critical difference is how they
handle `await`.

`forEach` is a method. It calls a callback and ignores any Promise the
callback returns. `await` inside `forEach` does not pause the loop.

`for...of` is a built-in loop keyword. It respects `await` correctly —
the loop pauses until the promise finishes before moving to the next item.

```javascript
// ❌ forEach — await is ignored, all run at the same time
items.forEach(async (item) => {
  await save(item); // forEach doesn't wait for this
});

// ✅ for...of — awaits each one before continuing
for (const item of items) {
  await save(item); // loop pauses here
}
```

---

## Q104.7 — Why does await inside forEach not work? What is the fix?

`forEach` was designed before `async/await`. It calls each callback and
moves on immediately, ignoring the returned promise. Errors inside the
callback are silently lost. The code after `forEach` runs before any
async work finishes.

```javascript
// ❌ Broken — "Done" prints before any item saves
items.forEach(async (item) => {
  await save(item);
});
console.log("Done"); // runs immediately

// ✅ Fix with for...of
for (const item of items) {
  await save(item);
}
console.log("Done"); // runs after all saves complete
```

---

## Q104.8 — What are break and continue and when do you use them?

`break` exits the loop immediately.
`continue` skips the current iteration and moves to the next.

```javascript
// break — stop when first match found
for (const item of items) {
  if (item.status === "error") {
    console.log("Error found, stopping");
    break;
  }
}

// continue — skip items that don't qualify
for (const item of items) {
  if (!item.active) continue;
  process(item); // only active items reach here
}
```

---

## Q104.9 — What is the difference between for...of and forEach for async operations?

`for...of` pauses at `await` and waits for the promise before continuing.
`forEach` fires all callbacks at once and ignores their promises.

```javascript
const ids = [1, 2, 3];

// forEach — fires all three fetches simultaneously, returns immediately
ids.forEach(async (id) => {
  const data = await fetch(`/api/${id}`);
  console.log(data); // may print in any order
});

// for...of — fetches one at a time, in order
for (const id of ids) {
  const data = await fetch(`/api/${id}`);
  console.log(data); // always prints in order: 1, 2, 3
}
```

---

## Q104.10 — When should you use for...of vs Promise.all for async loops?

`for...of` — sequential. Each item waits for the previous to complete.
Use when operations depend on each other, share state, or must run in order.

`Promise.all` with `map` — parallel. All start at the same time.
Use when operations are independent and you want speed.

```javascript
// Sequential — order matters
for (const step of steps) {
  await runStep(step); // step 2 needs step 1 to finish
}

// Parallel — all independent
const results = await Promise.all(
  ids.map(id => fetchUser(id)) // all fetched simultaneously
);
```

---

## Q104.11 — What is wrong with this async loop — find the bug?

```javascript
// ❌ What is wrong?
const urls = ["/home", "/about", "/contact"];

urls.forEach(async (url) => {
  const response = await checkUrl(url);
  if (!response.ok) throw new Error(`Failed: ${url}`);
});
// Test passes even if all URLs fail — why?
```

`forEach` ignores the promises. Each callback throws but nobody is
listening. The code after `forEach` runs immediately and the test ends
without ever seeing the errors.

```javascript
// ✅ Fix
for (const url of urls) {
  const response = await checkUrl(url);
  if (!response.ok) throw new Error(`Failed: ${url}`);
}
```

---

## Q104.12 — What is an infinite loop and how do you prevent it in test code?

An infinite loop runs forever because its exit condition never becomes
true. It freezes the process.

```javascript
// ❌ Infinite — i decrements instead of increments
for (let i = 0; i < 10; i--) {
  console.log(i);
}
```

Prevention: always include a counter limit in `while` loops. Never rely
on an external condition alone.

```javascript
let attempts = 0;
while (!isReady && attempts < 10) {
  await delay(500);
  isReady = checkStatus();
  attempts++;
}
if (!isReady) throw new Error("Timed out waiting for ready state");
```

---

## Q104.13 — Write a loop that checks each URL in a list sequentially

```javascript
const urls = ["/", "/about", "/contact"];

for (const url of urls) {
  const res = await fetch(baseUrl + url);
  if (res.status !== 200) {
    throw new Error(`${url} returned ${res.status}`);
  }
  console.log(`${url} — OK`);
}
```

`for...of` with `await` ensures each request completes before the next
starts. A failure throws immediately with the URL that broke.

---

## Q104.14 — Write code that runs multiple tasks in parallel using Promise.all

```javascript
const userIds = [101, 102, 103];

// All three fetches run at the same time
const users = await Promise.all(
  userIds.map(id => fetchUser(id))
);

console.log(users); // [user101, user102, user103]
```

`Promise.all` finishes in the time of the slowest request, not the sum
of all three. Use it when tasks are independent.

---

## Q104.15 — Describe a loop-related bug you encountered in a Playwright test

In our project a test validated status badges in a results table. A team
member wrote:

```javascript
rows.forEach(async (row) => {
  const text = await row.getByTestId("status").textContent();
  expect(text).toMatch(/Active|Pending/);
});
```

The test always passed — even when badges were wrong. `forEach` returned
before any assertion ran. Errors were silently lost.

The fix was `for...of`. After that we added the ESLint rule banning
`forEach(async`. It has caught three similar bugs since.

---

## Q104.16 — What is the difference between map, filter, and reduce?

These are the three array methods that transform data without mutating
the original array. They appear constantly in test helpers, data
builders, and assertion preparation.

```javascript
const items = [
  { name: "login",    passed: true  },
  { name: "checkout", passed: false },
  { name: "search",   passed: true  },
];

// map — transforms each element, returns a same-length array
const names = items.map(item => item.name);
// ["login", "checkout", "search"]

// filter — keeps only elements matching the condition
const failures = items.filter(item => !item.passed);
// [{ name: "checkout", passed: false }]

// reduce — accumulates a single result from the array
const passCount = items.reduce((count, item) => count + (item.passed ? 1 : 0), 0);
// 2
```

Rule for test code: `map` and `filter` are safe with sync operations.
If you need `await` inside any of them, switch to `for...of` instead.

---

## Q104.17 — What is array destructuring in a loop and how do you use it?

Destructuring unpacks values directly inside the loop variable, avoiding
a separate access line. It is used constantly when iterating
`Object.entries()` or arrays of pairs.

```javascript
const config = { timeout: 5000, retries: 2, baseUrl: "https://example.com" };

// Object.entries() gives [key, value] pairs
for (const [key, value] of Object.entries(config)) {
  console.log(`${key}: ${value}`);
}
// timeout: 5000
// retries: 2
// baseUrl: https://example.com

// Destructuring an array of pairs
const testCases = [["admin", true], ["guest", false]];
for (const [role, canEdit] of testCases) {
  console.log(`${role} canEdit: ${canEdit}`);
}
```

This pattern appears in test helpers that log config, validate environment
variables, or iterate over parameterised test data.

---

## Chapter Summary — Key Points for Your Interview

- `forEach` + `await` = silent bug. `forEach` ignores promises. Always
  use `for...of` when the loop body has `await`.
- `for...of` gives values. `for...in` gives keys. Never `for...in` on arrays.
- Sequential async → `for...of`. Parallel async → `Promise.all` with `map`.
- Always add a counter limit to `while` loops in test code.
- The `forEach`/`await` trap is guaranteed to come up in a Playwright interview.
- `map` transforms, `filter` keeps, `reduce` accumulates. None of them
  honour `await` — use `for...of` if async work is needed inside.
- `for...of` with `Object.entries()` and destructuring is the clean way
  to iterate key/value pairs.
