# Chapter 107 — Objects & Prototypes

This chapter covers JavaScript objects — the data structure behind every
page object, test config, and test data record. Interviewers test objects
because shared mutable state is one of the most common causes of flaky
tests. Questions move from object basics through spread/freeze to practical
data patterns.

---

## Q107.1 — What is an object in JavaScript?

An object is a collection of key-value pairs. Keys are strings. Values
can be any type.

```javascript
const user = {
  name:  "Alice",
  role:  "admin",
  active: true,
};

console.log(user.name);    // "Alice"
console.log(user["role"]); // "admin"
```

---

## Q107.2 — What is the prototype chain in JavaScript?

Every object has a hidden link to another object called its prototype.
When you access a property the object doesn't have, JavaScript looks up
the chain until it finds it or reaches `null`.

```javascript
const animal = { breathes: true };
const dog    = Object.create(animal);

dog.name = "Rex";
console.log(dog.name);     // "Rex"    — own property
console.log(dog.breathes); // true     — found on prototype
```

Classes use this mechanism under the hood. For everyday work you don't
interact with prototypes directly — but understanding the chain helps
when debugging inherited behaviour.

---

## Q107.3 — When do you use objects in test automation?

Objects represent test data (users, orders, products), configuration, and
API request/response bodies. Page object instances are also objects.

```javascript
const testUser = { email: "test@example.com", role: "admin" };
const config   = { timeout: 30000, retries: 2 };
const headers  = { "Content-Type": "application/json" };
```

---

## Q107.4 — How do you use objects in your automation project?

Every test data shape is an object returned by a factory function. We
use `Object.freeze` on shared constants. We use spread to apply overrides
without mutating the original.

We never put shared mutable objects at module level — a test that
modifies such an object corrupts the data for all subsequent tests.

---

## Q107.5 — What are Object.assign, Object.freeze, and Object.keys?

**`Object.assign(target, source)`** — copies properties from source into
target. Mutates target and returns it.

**`Object.freeze(obj)`** — makes an object immutable. Any write attempt
is silently ignored (or throws in strict mode).

**`Object.keys(obj)`** — returns an array of the object's own property names.

```javascript
const a = { x: 1 };
const b = Object.assign({}, a, { y: 2 }); // { x: 1, y: 2 }

const ROLES = Object.freeze({ ADMIN: "admin", VIEWER: "viewer" });
ROLES.ADMIN = "superadmin"; // silently ignored

Object.keys({ a: 1, b: 2 }); // ["a", "b"]
```

---

## Q107.6 — What is object destructuring?

Destructuring extracts properties into named variables in one statement.

```javascript
const user = { name: "Alice", role: "admin", active: true };

const { name, role } = user;
console.log(name); // "Alice"
console.log(role); // "admin"

// Rename while destructuring
const { name: userName } = user;
console.log(userName); // "Alice"

// Default value
const { timeout = 5000 } = config;
```

---

## Q107.7 — What is the spread operator for objects?

`...` copies all own enumerable properties of an object into a new object.
It is a shallow copy — nested objects are still shared by reference.

```javascript
const defaults = { timeout: 5000, retries: 0 };
const custom   = { ...defaults, retries: 3 }; // { timeout: 5000, retries: 3 }

console.log(defaults.retries); // 0 — unchanged
```

Later properties override earlier ones when keys clash. This is the
standard pattern for applying overrides in factory functions.

---

## Q107.8 — What is the this keyword in JavaScript and what does it refer to?

`this` refers to the object that is executing the current function.
What it points to depends on how the function is called.

```javascript
const counter = {
  count: 0,
  increment() {
    this.count++; // this = counter
  },
};

counter.increment();
console.log(counter.count); // 1

// Detach the method — this is lost
const fn = counter.increment;
fn(); // TypeError: Cannot read properties of undefined
```

Arrow functions do not have their own `this` — they inherit it from the
surrounding scope.

---

## Q107.9 — What is the difference between Object.assign and the spread operator?

Both copy properties. The key difference:

`Object.assign(target, source)` — **mutates** the target and returns it.

Spread `{ ...source }` — always creates a **new object**, never mutates.

```javascript
const a = { x: 1 };

// Object.assign — a is mutated
const b = Object.assign(a, { y: 2 });
console.log(a); // { x: 1, y: 2 } — a changed

// Spread — a is untouched
const c = { ...a, y: 2 };
console.log(a); // { x: 1 } — unchanged
```

Use spread in modern code. Use `Object.assign` only when you explicitly
need to mutate an existing object.

---

## Q107.10 — What is the difference between dot notation and bracket notation?

Dot notation — `obj.key` — works for valid identifier names known at
write time.

Bracket notation — `obj["key"]` — works for any string, including names
with special characters or names stored in a variable.

```javascript
const cfg = { timeout: 5000, "base-url": "https://example.com" };

cfg.timeout;        // 5000 — dot notation
cfg["base-url"];    // "https://example.com" — must use brackets (hyphen)

const key = "timeout";
cfg[key];           // 5000 — dynamic key via variable
```

---

## Q107.11 — What is wrong with mutating a shared object in tests — show the bug?

```javascript
// ❌ Shared object — mutation persists
const config = { retries: 0, timeout: 5000 };

test("slow test", () => {
  config.timeout = 60000; // mutates the shared object
});

test("normal test", () => {
  console.log(config.timeout); // 60000 — wrong! previous test changed it
});
```

```javascript
// ✅ Fix — factory function returns a fresh object each time
function getConfig(overrides = {}) {
  return { retries: 0, timeout: 5000, ...overrides };
}

test("slow test", () => {
  const cfg = getConfig({ timeout: 60000 }); // own copy
});
```

---

## Q107.12 — When does this cause problems in test code?

When a class method is detached from its object and called as a plain
function, `this` is lost.

```javascript
class Timer {
  constructor() { this.elapsed = 0; }
  tick()        { this.elapsed++; }
}

const t = new Timer();

// ❌ Detached — this is undefined inside tick
setTimeout(t.tick, 1000); // TypeError

// ✅ Wrap in arrow function — preserves this
setTimeout(() => t.tick(), 1000);

// ✅ Or bind
setTimeout(t.tick.bind(t), 1000);
```

---

## Q107.13 — Write a config builder using spread and Object.freeze

```javascript
const DEFAULTS = Object.freeze({
  host:    "localhost",
  port:    3000,
  debug:   false,
});

function buildConfig(overrides = {}) {
  return { ...DEFAULTS, ...overrides };
}

const dev  = buildConfig({ debug: true });
const prod = buildConfig({ host: "api.example.com", port: 443 });

console.log(dev.host);  // "localhost"
console.log(prod.port); // 443
// DEFAULTS is frozen — cannot be accidentally changed
```

---

## Q107.14 — Write a test data object with nested structure and destructuring

```javascript
function createOrder(overrides = {}) {
  return {
    id:       `ORD-${Date.now()}`,
    status:   "pending",
    customer: { name: "Test User", city: "London" },
    total:    49.99,
    ...overrides,
  };
}

const order = createOrder({ total: 99.99 });

// Destructure what you need
const { id, total, customer: { name, city } } = order;
console.log(id, total, name, city);
// "ORD-1234" 99.99 "Test User" "London"
```

---

## Q107.15 — Describe a bug caused by shared object state between tests

In our project a shared `config` object was declared at module level.
One test modified `config.headers` by pushing a new header. Every test
that ran after it picked up that extra header — causing unexpected 401
errors because a test-specific auth token was being sent to the wrong API.

The fix: factory function. `getConfig()` returns a fresh object with a
new `headers` array each time. Mutations in one test no longer affect
others. This one change eliminated a class of intermittent failures.

---

## Chapter Summary — Key Points for Your Interview

- Objects are key-value pairs. Use dot notation for known keys, bracket
  notation for dynamic or special-character keys.
- Spread `{...obj}` creates a new object — never mutates. `Object.assign`
  mutates the target.
- `Object.freeze` prevents all mutations — use for shared constants.
- Never put mutable shared objects at module level. Use factory functions.
- `this` in a regular method refers to the calling object. Arrow functions
  inherit `this` from their outer scope.
