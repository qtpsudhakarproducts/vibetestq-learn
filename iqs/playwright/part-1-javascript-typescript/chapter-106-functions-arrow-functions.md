# Chapter 106 — Functions & Arrow Functions

This chapter covers JavaScript functions — the building block of every
page object method and test helper. Interviewers test functions because
closures, `this` binding, and callback patterns cause real bugs. Questions
move from function syntax through closures to short, focused code tasks.

---

## Q106.1 — What is a function in JavaScript?

A function is a reusable block of code that performs a specific task.
Define it once, call it many times.

```javascript
function add(a, b) {
  return a + b;
}

console.log(add(3, 4)); // 7
console.log(add(10, 5)); // 15
```

---

## Q106.2 — What is an arrow function and how does it differ from a regular function?

An arrow function is a shorter syntax for writing functions.

```javascript
// Regular function
function double(n) { return n * 2; }

// Arrow function — same behaviour, shorter syntax
const double = n => n * 2;

// Multi-line arrow function
const greet = (name) => {
  const msg = `Hello, ${name}`;
  return msg;
};
```

The key difference: arrow functions do not have their own `this`. They
inherit `this` from the surrounding scope.

---

## Q106.3 — When do you use arrow functions vs regular functions in test code?

Use **arrow functions** for:
- Callbacks passed to `map`, `filter`, `forEach`
- Short inline expressions
- Class properties where you want guaranteed `this` binding

Use **regular functions or methods** for:
- Class methods where `this` refers to the class instance
- Functions used as constructors

```javascript
// Arrow callback — idiomatic
const names = users.map(u => u.name);

// Class method — regular function
class Cart {
  addItem(item) {
    this.items.push(item); // this = Cart instance
  }
}
```

---

## Q106.4 — How do you use functions in your automation project?

In our project, functions appear at two levels: page object methods
(one per user action) and shared helpers (retry, API calls, data factories).
Each function has one job and a clear name. We avoid functions longer
than 20 lines.

---

## Q106.5 — What is a closure and how does it work?

A closure is a function that remembers variables from its outer scope
even after the outer function has returned.

```javascript
function makeCounter() {
  let count = 0;           // outer variable

  return function () {
    count++;               // inner function closes over count
    return count;
  };
}

const counter = makeCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

`count` survives because the inner function holds a reference to it.

---

## Q106.6 — What is a callback function?

A callback is a function passed as an argument to another function. The
receiving function calls it later.

```javascript
function greet(name, callback) {
  const msg = `Hello, ${name}`;
  callback(msg);
}

greet("Alice", msg => console.log(msg)); // "Hello, Alice"
```

Every `array.map(fn)`, `array.filter(fn)`, and `setTimeout(fn, ms)` uses
a callback. In Playwright, the test body itself is a callback passed to `test()`.

---

## Q106.7 — What is an IIFE and when would you use one?

An IIFE (Immediately Invoked Function Expression) is a function that runs
the moment it is defined.

```javascript
const result = (() => {
  const base = 100;
  return base * 1.2;
})();

console.log(result); // 120
```

Useful for creating a local scope to compute a value without polluting
the surrounding scope. Common in config files where you need a `switch`
or `if` to produce a single value.

---

## Q106.8 — What are default parameters and rest parameters?

**Default parameter** — a fallback value when the argument is not provided.

```javascript
function connect(host, port = 3000) {
  return `${host}:${port}`;
}
connect("localhost");       // "localhost:3000"
connect("localhost", 8080); // "localhost:8080"
```

**Rest parameter** — collects remaining arguments into an array.

```javascript
function log(level, ...messages) {
  messages.forEach(m => console.log(`[${level}] ${m}`));
}
log("INFO", "Started", "Listening", "Ready");
```

---

## Q106.9 — What is the difference between arrow functions and regular functions regarding the this keyword?

Regular functions get their own `this` — it depends on how the function
is called.

Arrow functions have no `this` — they inherit it from the enclosing scope.

```javascript
const obj = {
  name: "Alice",
  regular: function () { return this.name; }, // this = obj
  arrow:   ()         => this.name,           // this = outer scope (not obj)
};

console.log(obj.regular()); // "Alice"
console.log(obj.arrow());   // undefined
```

---

## Q106.10 — When should you NOT use an arrow function?

When `this` must refer to the object the method belongs to.

```javascript
const cart = {
  items: [],
  // ❌ Arrow — this is outer scope, not cart
  add: (item) => { this.items.push(item); }, // TypeError

  // ✅ Regular method — this is cart
  add(item) { this.items.push(item); },
};
```

Also: arrow functions cannot be used as constructors (`new arrowFn()`
throws a TypeError).

---

## Q106.11 — What is wrong with this function — show a closure bug and fix it?

```javascript
// ❌ var closure bug
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i); // all capture the same var i
}
console.log(fns[0](), fns[1](), fns[2]()); // 3, 3, 3

// ✅ Fix — let creates a new binding per iteration
const fns2 = [];
for (let i = 0; i < 3; i++) {
  fns2.push(() => i);
}
console.log(fns2[0](), fns2[1](), fns2[2]()); // 0, 1, 2
```

---

## Q106.12 — What is the difference between a named function and an anonymous function?

A named function has an identifier. An anonymous function does not.

```javascript
// Named — appears in stack traces with its name
function calculate(x) { return x * 2; }

// Named function expression
const calc = function calculate(x) { return x * 2; };

// Anonymous function expression
const calc2 = function (x) { return x * 2; };

// Arrow — always anonymous (variable name is not the function's name)
const calc3 = x => x * 2;
```

Named functions are easier to debug because stack traces show the name.
Name any function that is not a trivial one-liner.

---

## Q106.13 — Write a simple retry wrapper function

```javascript
async function retry(fn, maxAttempts = 3) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      console.log(`Attempt ${attempt} failed, retrying...`);
      await new Promise(r => setTimeout(r, 500));
    }
  }
}

// Usage
const data = await retry(() => fetch("/api/users").then(r => r.json()));
```

Short, one job, reusable. The caller provides the operation; `retry`
handles the loop and delay.

---

## Q106.14 — Write a counter using closures to encapsulate private state

```javascript
function makeCounter(start = 0) {
  let count = start; // private — not accessible outside

  return {
    increment: () => ++count,
    decrement: () => --count,
    reset:     () => { count = start; },
    value:     () => count,
  };
}

const c = makeCounter();
c.increment();
c.increment();
console.log(c.value()); // 2
c.reset();
console.log(c.value()); // 0
```

`count` cannot be read or modified directly — only through the returned
interface. This is the closure pattern for private state.

---

## Q106.15 — Describe a time when a function design choice improved your test maintainability

In our project, the login steps were copied inline across 40 test files.
When a 2FA step was added to the login flow, we had to update 40 files.

After that we extracted login to a single function and called it
everywhere. When the login flow changed again, one function changed —
zero test files needed updating.

The lesson: any sequence of steps repeated more than twice should be a
named function. The naming also documents intent clearly.

---

## Chapter Summary — Key Points for Your Interview

- Arrow functions inherit `this` from their outer scope. Regular functions
  get their own `this` based on how they are called.
- Closures capture a reference to the outer variable, not a copy.
- `forEach` with `await` silently ignores promises — always `for...of`.
- Callbacks are functions passed as arguments — every `map`/`filter`/
  `test()` uses them.
- Keep functions small and single-purpose. Name them clearly.
