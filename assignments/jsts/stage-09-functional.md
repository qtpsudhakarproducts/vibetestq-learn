# Stage 9 — Functional Programming Patterns

---

## Q92. Write a program to show the difference between a pure function and an impure function

```js
// IMPURE function: modifies external state — unpredictable and hard to test
let discountLog = [];
function applyDiscountImpure(product) {
    product.price = product.price * 0.9;          // mutates the input object!
    discountLog.push(product.name + " discounted"); // changes external variable!
}

const p1 = { name: "Laptop", price: 1000 };
applyDiscountImpure(p1);
console.log("Impure - product price:", p1.price);  // 900 — original mutated
console.log("Impure - log:", discountLog);          // external state changed

// PURE function: same input always gives same output, no side effects
// Returns a NEW object instead of modifying the input
function applyDiscountPure(product, percent) {
    return { ...product, price: product.price * (1 - percent / 100) };
}

const p2 = { name: "Laptop", price: 1000 };
const discounted = applyDiscountPure(p2, 10);
console.log("Pure - original price:", p2.price);    // 1000 — unchanged
console.log("Pure - new price:", discounted.price); // 900 — new object
```

**Output:**
```
Impure - product price: 900
Impure - log: ["Laptop discounted"]
Pure - original price: 1000
Pure - new price: 900
```

---

## Q93. Write a program to show how to avoid mutating an array

```js
const original = ["alice", "bob", "carol"];

// WRONG — push modifies the original array directly
function addWrong(arr, item) { arr.push(item); return arr; }

// RIGHT — spread creates a new array, original stays unchanged
function addRight(arr, item) { return [...arr, item]; }

// WRONG — splice removes from original
function removeWrong(arr, i) { arr.splice(i, 1); return arr; }

// RIGHT — filter returns new array excluding the item at index i
function removeRight(arr, i) { return arr.filter((_, idx) => idx !== i); }

// WRONG — direct assignment mutates original
function updateWrong(arr, i, val) { arr[i] = val; return arr; }

// RIGHT — map returns new array, replacing item at index i
function updateRight(arr, i, val) { return arr.map((item, idx) => idx === i ? val : item); }

console.log("Add right:   ", addRight(original, "dave"),      "| original:", original);
console.log("Remove right:", removeRight(original, 1),        "| original:", original);
console.log("Update right:", updateRight(original, 1, "eve"), "| original:", original);
```

**Output:**
```
Add right:    ["alice","bob","carol","dave"] | original: ["alice","bob","carol"]
Remove right: ["alice","carol"]             | original: ["alice","bob","carol"]
Update right: ["alice","eve","carol"]       | original: ["alice","bob","carol"]
```

---

## Q94. Write a program to show how to avoid mutating an object

```js
// WRONG — modifies the passed-in object directly
function activateWrong(user) { user.active = true; return user; }

// RIGHT — creates a new object using spread, original untouched
// {...user} copies all properties, then active: true overrides the active property
function activateRight(user) { return { ...user, active: true }; }

const user = { name: "Alice", active: false, score: 50 };

const rightResult = activateRight(user);
console.log("activateRight result:", rightResult);
console.log("Original unchanged:  ", user);
```

**Output:**
```
activateRight result: { name: "Alice", active: true, score: 50 }
Original unchanged:   { name: "Alice", active: false, score: 50 }
```

---

## Q95. Write a program to create a compose function that applies functions right to left

```js
// compose(f, g)(x) = f(g(x)) — g runs first, then f
// Right-to-left order (mathematical notation)
function compose(f, g) {
    return function (x) { return f(g(x)); };
}

// composeMany applies all functions right to left using reduceRight
function composeMany(...fns) {
    return function (x) { return fns.reduceRight((acc, fn) => fn(acc), x); };
}

const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

// compose(addOne, double)(5): double runs first (5→10), then addOne (10→11)
console.log(compose(addOne, double)(5));           // 11
// composeMany(square, double, addOne)(3): addOne(3=4), double(4=8), square(8=64)
console.log(composeMany(square, double, addOne)(3)); // 64
```

**Output:**
```
11
64
```

---

## Q96. Write a program to create a pipe function that applies functions left to right

```js
// pipe is like compose but in the opposite direction — left to right
// pipe(f, g)(x) = g(f(x)) — f runs first, then g
// More natural to read: data flows left to right through the pipeline
function pipe(...fns) {
    return function (x) { return fns.reduce((acc, fn) => fn(acc), x); };
}

const double = x => x * 2;
const addOne = x => x + 1;
const square = x => x * x;

// pipe(addOne, double)(5): addOne(5=6), then double(6=12)
console.log(pipe(addOne, double)(5));            // 12
// pipe(addOne, double, square)(3): addOne(3=4), double(4=8), square(8=64)
console.log(pipe(addOne, double, square)(3));    // 64
```

**Output:**
```
12
64
```

---

## Q97. Write a program to create a partial application function

```js
// partial locks in some arguments now and returns a function for the rest later
// Different from curry: partial takes any number of pre-set args at once
function partial(fn, ...presetArgs) {
    return function (...laterArgs) {
        // Combine pre-set args with the new args when called later
        return fn(...presetArgs, ...laterArgs);
    };
}

function multiply(a, b) { return a * b; }
function greet(greeting, name) { return greeting + ", " + name + "!"; }

// Lock in the first argument, leave the second for later
const triple   = partial(multiply, 3); // a=3 is locked in
const sayHello = partial(greet, "Hello"); // greeting="Hello" is locked in

console.log(triple(5));        // multiply(3, 5) = 15
console.log(triple(10));       // multiply(3, 10) = 30
console.log(sayHello("Alice")); // greet("Hello", "Alice") = "Hello, Alice!"
```

**Output:**
```
15
30
Hello, Alice!
```

---

## Q98. Write a program to process test results using map, filter and reduce

```js
const results = [
    { name: "Login test",   status: "pass", duration: 120 },
    { name: "Logout test",  status: "fail", duration: 340 },
    { name: "Search test",  status: "pass", duration: 89  },
    { name: "Payment test", status: "fail", duration: 560 },
    { name: "Profile test", status: "pass", duration: 200 },
    { name: "Cart test",    status: "fail", duration: 410 },
];

// Chain: filter failed → extract just the names
const failedNames = results
    .filter(r => r.status === "fail")
    .map(r => r.name);

// Chain: filter passed → sum their durations
const passedTotal = results
    .filter(r => r.status === "pass")
    .reduce((acc, r) => acc + r.duration, 0);

// All tests average duration
const avg = results.reduce((acc, r) => acc + r.duration, 0) / results.length;

// Find slowest test: compare each with current max
const slowest = results.reduce((max, r) => r.duration > max.duration ? r : max);

console.log("Failed names:   ", failedNames);
console.log("Passed total:   ", passedTotal + "ms");
console.log("Average:        ", avg.toFixed(1) + "ms");
console.log("Slowest:        ", slowest.name + " (" + slowest.duration + "ms)");
```

**Output:**
```
Failed names:    ["Logout test", "Payment test", "Cart test"]
Passed total:    409ms
Average:         286.5ms
Slowest:         Payment test (560ms)
```

---

## Q99. Write a program to deep merge two objects recursively

```js
function deepMerge(target, source) {
    const result = { ...target }; // start with a copy of target

    for (const key in source) {
        // If both sides have an object at this key, merge them recursively
        if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])
            && target[key] && typeof target[key] === "object") {
            result[key] = deepMerge(target[key], source[key]);
        } else {
            // Otherwise source value wins (overrides target)
            result[key] = source[key];
        }
    }
    return result;
}

const defaults = {
    server:   { host: "localhost", port: 3000, timeout: 5000 },
    database: { name: "testdb", pool: 5 },
    retries:  3
};
const overrides = { server: { port: 8080 }, database: { pool: 10 }, headless: true };

console.log("Deep merge:");
console.log(JSON.stringify(deepMerge(defaults, overrides), null, 2));

// Shallow merge would LOSE host and timeout — only port survives
console.log("Shallow merge server:", { ...defaults, ...overrides }.server);
```

**Output:**
```
Deep merge:
{
  "server":   { "host": "localhost", "port": 8080, "timeout": 5000 },
  "database": { "name": "testdb", "pool": 10 },
  "retries":  3,
  "headless": true
}
Shallow merge server: { "port": 8080 }
```

---

## Q100. Write a program to flatten a nested object into dot notation keys

```js
function flattenObject(obj, prefix = "") {
    const result = {};

    for (const key in obj) {
        // Build the full dotted key: "server" + "." + "host" = "server.host"
        const fullKey = prefix ? prefix + "." + key : key;

        if (typeof obj[key] === "object" && obj[key] !== null && !Array.isArray(obj[key])) {
            // Value is a nested object — recurse deeper, passing fullKey as new prefix
            Object.assign(result, flattenObject(obj[key], fullKey));
        } else {
            // Value is a primitive — store with full dotted key
            result[fullKey] = obj[key];
        }
    }
    return result;
}

const config = {
    server:   { host: "localhost", port: 3000, ssl: { enabled: true, cert: "cert.pem" } },
    database: { name: "testdb" },
    retries:  3
};

console.log(flattenObject(config));
```

**Output:**
```
{
  "server.host":        "localhost",
  "server.port":        3000,
  "server.ssl.enabled": true,
  "server.ssl.cert":    "cert.pem",
  "database.name":      "testdb",
  "retries":            3
}
```
