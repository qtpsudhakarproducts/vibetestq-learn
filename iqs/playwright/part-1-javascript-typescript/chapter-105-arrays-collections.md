# Chapter 105 — Arrays & Collections

This chapter covers JavaScript arrays and the methods used most in test
automation. Interviewers test arrays because `map`, `filter`, `find`,
and mutation bugs appear constantly in test data handling. Questions move
from what an array is through method differences to short practical code.

---

## Q105.1 — What is an array in JavaScript?

An array is an ordered list of values. Each value has an index starting
at zero. Arrays can hold any type.

```javascript
const colours   = ["red", "green", "blue"];
const numbers   = [1, 2, 3, 4, 5];
const mixed     = ["Alice", 30, true];

console.log(colours[0]);     // "red"
console.log(colours.length); // 3
```

---

## Q105.2 — What is the difference between map, filter, and reduce?

`map` — transforms every element, returns a new array of the same length.
`filter` — keeps only matching elements, returns a shorter (or same) array.
`reduce` — collapses the array into a single value.

```javascript
const prices = [10, 20, 30];

const doubled  = prices.map(p => p * 2);       // [20, 40, 60]
const over15   = prices.filter(p => p > 15);    // [20, 30]
const total    = prices.reduce((s, p) => s + p, 0); // 60
```

None of them modify the original array.

---

## Q105.3 — When do you use array methods in test automation?

- `map` — extract one field from a list of objects (names, IDs, statuses)
- `filter` — select a subset of test records by role, status, or tag
- `find` — get the first record matching a condition
- `forEach` — when you just want to do something with each item, like
  print or log it (never with `await`)
- Spread and destructuring — build test data objects cleanly

---

## Q105.4 — How do you use arrays in your Playwright project?

In our project, arrays hold test data sets. We use `filter` to pick the
records relevant to a specific test, `map` to extract the values we want
to assert on, and `find` to locate a specific record by ID.

We never mutate shared arrays — every test calls a factory function that
returns a fresh copy.

---

## Q105.5 — What does the find method do? How is it different from filter?

`find` returns the **first** matching element, or `undefined`.
`filter` returns **all** matching elements as a new array (possibly empty).

```javascript
const users = [
  { name: "Alice", role: "admin" },
  { name: "Bob",   role: "viewer" },
  { name: "Carol", role: "admin" },
];

users.find(u => u.role === "admin");    // { name: "Alice", ... } — first match
users.filter(u => u.role === "admin");  // [{ name: "Alice" }, { name: "Carol" }]
```

Use `find` when you expect one result. Use `filter` when you expect many.

---

## Q105.6 — What is array destructuring?

Destructuring unpacks array values into named variables in one statement.

```javascript
const [first, second, third] = ["chromium", "firefox", "webkit"];
console.log(first);  // "chromium"
console.log(third);  // "webkit"

// Skip elements with empty comma
const [, , safari] = ["chromium", "firefox", "webkit"];
console.log(safari); // "webkit"
```

---

## Q105.7 — What is the spread operator and how does it work with arrays?

`...` expands an array into individual elements. Used to copy or combine
arrays without mutating the original.

```javascript
const a = [1, 2, 3];
const b = [...a, 4, 5]; // [1, 2, 3, 4, 5] — a is unchanged

const combined = [...a, ...b]; // merge two arrays

// Copy without sharing a reference
const copy = [...a];
copy.push(99);
console.log(a); // [1, 2, 3] — original untouched
```

---

## Q105.8 — What is the rest parameter?

`...` in a function parameter list collects all remaining arguments into
an array. It must be the last parameter.

```javascript
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}

console.log(sum(1, 2, 3));       // 6
console.log(sum(1, 2, 3, 4, 5)); // 15
```

---

## Q105.9 — What is the difference between map and forEach?

`map` returns a **new array** with the transformed values.
`forEach` returns **nothing** — use it only when you want to do something
with each item, like printing or saving.

```javascript
const nums = [1, 2, 3];

const doubled = nums.map(n => n * 2);  // [2, 4, 6]
nums.forEach(n => console.log(n));     // prints 1, 2, 3 — returns undefined
```

Use `map` when you need the result array. Use `forEach` when you just want
to do something with each item — and never with `await` (see Chapter 4).

---

## Q105.10 — What is the difference between find and filter?

`find` → one element or `undefined`. Stops at first match.
`filter` → always an array. Checks every element.

```javascript
[1, 2, 3, 4].find(n => n > 2);    // 3
[1, 2, 3, 4].filter(n => n > 2);  // [3, 4]
```

---

## Q105.11 — What is wrong with mutating an array directly — show the anti-pattern and fix it?

Mutating a shared array affects every part of the code that holds a
reference to it, including other tests running in the same worker.

```javascript
// ❌ Shared array — mutation persists between tests
const sharedUsers = ["alice", "bob"];

function testA() {
  sharedUsers.push("carol"); // modifies sharedUsers permanently
}

function testB() {
  console.log(sharedUsers); // ["alice", "bob", "carol"] — unexpected
}
```

```javascript
// ✅ Factory function — each caller gets a fresh copy
function getUsers() {
  return ["alice", "bob"];
}

function testA() {
  const users = getUsers();
  users.push("carol"); // only affects this local copy
}
```

---

## Q105.12 — What is flat and when is it useful in test data processing?

`flat()` turns a nested array into a single-level array.

```javascript
const nested = [[1, 2], [3, 4], [5]];
nested.flat(); // [1, 2, 3, 4, 5]

// Deeper nesting
[[1, [2, 3]], [4]].flat(2); // [1, 2, 3, 4]
```

Useful when you collect results from multiple sources (each returning
an array) and need to process them all in one flat list.

---

## Q105.13 — Write code that filters and transforms a list of test records

```javascript
const records = [
  { id: 1, status: "pass",   duration: 1200 },
  { id: 2, status: "fail",   duration: 3400 },
  { id: 3, status: "pass",   duration: 800  },
  { id: 4, status: "skip",   duration: 0    },
];

// Get IDs of failed tests
const failedIds = records
  .filter(r => r.status === "fail")
  .map(r => r.id);

console.log(failedIds); // [2]

// Average duration of passing tests
const passDurations = records
  .filter(r => r.status === "pass")
  .map(r => r.duration);

const avg = passDurations.reduce((s, d) => s + d, 0) / passDurations.length;
console.log(avg); // 1000
```

---

## Q105.14 — Write a test data factory using array methods and destructuring

```javascript
const catalogue = [
  { id: "P1", name: "Widget A", price: 29.99 },
  { id: "P2", name: "Widget B", price: 14.99 },
  { id: "P3", name: "Widget C", price: 49.99 },
];

function buildOrder(productIds) {
  const items   = catalogue.filter(p => productIds.includes(p.id));
  const total   = items.reduce((s, p) => s + p.price, 0);
  return { items, total: total.toFixed(2) };
}

const order = buildOrder(["P1", "P3"]);
console.log(order.total); // "79.98"

// Destructure what you need
const { items: [first], total } = order;
console.log(first.name, total); // "Widget A" "79.98"
```

---

## Q105.15 — Describe a scenario where you used array methods to process test results

In our project the test run produced an array of result objects. We needed
a summary: how many passed, how many failed, and which test names failed.

```javascript
const results = await getTestResults();

const failed    = results.filter(r => r.status === "fail");
const failNames = failed.map(r => r.name);
const passCount = results.filter(r => r.status === "pass").length;

console.log(`Passed: ${passCount}, Failed: ${failed.length}`);
console.log("Failed tests:", failNames);
```

This replaced a `for` loop with counters and a separate push array —
cleaner, less error-prone, and easier to read in code review.

---

## Q105.16 — What do some() and every() do?

`some()` returns `true` if **at least one** element passes the test.
`every()` returns `true` only if **all** elements pass the test.
Both stop early as soon as the outcome is determined.

```javascript
const results = ["pass", "pass", "fail", "pass"];

results.some(r => r === "fail");   // true  — at least one failed
results.every(r => r === "pass");  // false — not all passed
results.every(r => r !== "error"); // true  — none have status "error"
```

In test automation, `every` checks whether all records meet a condition
before asserting. `some` is used as a guard — "does this list contain
any failures before we proceed?"

---

## Q105.17 — What is the difference between indexOf, findIndex, and find?

`indexOf` — finds the index of a **value** using strict equality. Works
for primitives. Returns `-1` if not found.

`findIndex` — finds the index of the **first element matching a callback**.
Works for objects.

`find` — returns the **element itself** (not the index) of the first match.

```javascript
const nums = [10, 20, 30];
nums.indexOf(20);              // 1
nums.indexOf(99);              // -1

const users = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" },
];
users.findIndex(u => u.id === 2); // 1   — index
users.find(u => u.id === 2);      // { id: 2, name: "Bob" } — element
```

Use `indexOf` for primitive arrays. Use `findIndex` when you need the
position in an object array. Use `find` when you need the object itself.

---

## Q105.18 — What is the difference between slice and splice?

`slice` — **non-mutating**. Returns a shallow copy of a portion of the array.
`splice` — **mutating**. Removes, replaces, or inserts elements in place.

```javascript
const arr = [1, 2, 3, 4, 5];

// slice(start, end) — does not change arr
const portion = arr.slice(1, 3); // [2, 3]
console.log(arr);                // [1, 2, 3, 4, 5] — unchanged

// splice(start, deleteCount) — modifies arr
const removed = arr.splice(1, 2); // removes 2 elements at index 1
console.log(removed); // [2, 3]
console.log(arr);     // [1, 4, 5] — arr is changed!
```

The interview trap: both sound similar. The key: `slice` is safe, `splice`
mutates. In test code, prefer `slice` — never mutate shared data.

---

## Q105.19 — What is the sort() gotcha in JavaScript?

`sort()` mutates the original array and by default converts elements to
strings before comparing. This produces wrong results for numbers.

```javascript
// ❌ Default sort — compares as strings
[10, 2, 1, 20].sort();         // [1, 10, 2, 20] — wrong!

// ✅ Numeric sort — pass a comparator
[10, 2, 1, 20].sort((a, b) => a - b);  // [1, 2, 10, 20] — correct
[10, 2, 1, 20].sort((a, b) => b - a);  // [20, 10, 2, 1] — descending
```

Two traps to know: the default string comparison silently gives wrong
results for numbers, and `sort()` mutates the original array. To sort
without mutation, spread first: `[...arr].sort((a, b) => a - b)`.

---

## Q105.20 — What is Array.from() and when do you use it in Playwright?

`Array.from()` creates a real array from any array-like or iterable value.
In Playwright, `locator.all()` already returns an array — but
`page.$$()` and some DOM APIs return NodeList or similar iterables that
lack array methods. `Array.from()` converts them.

```javascript
// Convert a string to an array of characters
Array.from("hello"); // ["h", "e", "l", "l", "o"]

// Convert a Set to an array
const unique = Array.from(new Set([1, 2, 2, 3])); // [1, 2, 3]

// In Playwright — evaluate returns a NodeList, Array.from converts it
const texts = await page.evaluate(() =>
  Array.from(document.querySelectorAll(".item")).map(el => el.textContent)
);
```

`Array.from()` also accepts a mapping function as a second argument,
making it a compact alternative to `new Array(n).fill(0).map(...)`:

```javascript
// Create 5 sequential IDs
Array.from({ length: 5 }, (_, i) => i + 1); // [1, 2, 3, 4, 5]
```

---

## Chapter Summary — Key Points for Your Interview

- `map` transforms, `filter` selects, `find` gets the first match, `reduce` collapses. None mutate the original.
- `find` returns one element or `undefined`. `filter` always returns an array.
- `forEach` returns nothing. Never use it with `await` — use `for...of`.
- Spread `[...arr]` copies without sharing a reference.
- Never mutate shared arrays between tests — use factory functions.
- `some` → at least one matches. `every` → all match. Both stop early.
- `indexOf` for primitive values. `findIndex` for object arrays (returns index). `find` returns the element.
- `slice` is safe (non-mutating). `splice` mutates. Prefer `slice` in test code.
- `sort()` compares as strings by default — always pass `(a, b) => a - b` for numbers. Spread before sorting to avoid mutation.
- `Array.from()` converts iterables and NodeLists to real arrays. Essential inside `page.evaluate()` calls.
