# Chapter 102 — Variables, Scope & Data Types

This chapter covers how JavaScript stores and manages data. Interviewers
test this topic because weak understanding of `var`, `let`, `const`, and
scope is the root cause of many real bugs. Questions move from what each
keyword does through scope rules to the tricky behaviour that trips people up.

---

## Q102.1 — What is a variable in JavaScript?

A variable is a named container for a value. You declare it once and use
the name to read or update the value later.

```javascript
let score = 10;
score = 20;      // update
console.log(score); // 20
```

---

## Q102.2 — What is the difference between var, let, and const?

| | `var` | `let` | `const` |
|---|---|---|---|
| Scope | Function | Block | Block |
| Reassignable | Yes | Yes | No |
| Redeclarable | Yes | No | No |
| Hoisting | `undefined` | TDZ error | TDZ error |

```javascript
var x = 1;
var x = 2; // redeclared — no error (bad)

let a = 1;
let a = 2; // SyntaxError — cannot redeclare

const MAX = 100;
MAX = 200; // TypeError — cannot reassign
```

**Rule: use `const` by default. Use `let` when you need to reassign.
Never use `var`.**

---

## Q102.3 — When would you use let vs const in a project?

Use `const` for anything that does not change after assignment — URLs,
configuration values, object references, function references.

Use `let` only when the value genuinely needs to change — a counter, a
running total, a flag updated inside a condition.

```javascript
const baseUrl = "https://example.com"; // never changes
const items   = [];                    // reference is const, array can still grow

let count = 0;
count++;        // needs to change — let is correct
```

In practice, around 90% of variables should be `const`.

---

## Q102.4 — How do you use const and let in your automation project?

In our project every page object, locator, and helper reference is
`const` — they are assigned once and never reassigned. We use `let` only
in a test body when building a value conditionally across a few steps.

We enforce this with ESLint's `prefer-const` and `no-var` rules. Any
`let` that is never reassigned is flagged automatically in CI.

---

## Q102.5 — What are the primitive data types in JavaScript?

Seven primitives: `string`, `number`, `boolean`, `null`, `undefined`,
`bigint`, `symbol`.

```javascript
"hello"        // string
42             // number
true           // boolean
null           // intentional absence
undefined      // unassigned
9007199n       // bigint
Symbol("id")   // symbol
```

In test automation you mostly use `string` (URLs, expected text),
`number` (status codes, counts, timeouts), and `boolean` (flags).

---

## Q102.6 — What is the difference between null and undefined?

`undefined` — JavaScript's default empty state. A variable declared but
not yet assigned.

`null` — a deliberate choice by the programmer meaning "no value here".

```javascript
let x;          // undefined — not assigned yet
let y = null;   // null — intentionally empty
```

One quirk: `typeof null === "object"` — a historical JavaScript bug.
To check for null, always use `=== null`.

---

## Q102.7 — What is type coercion in JavaScript?

JavaScript automatically changes one type to match another when you mix
types together — for example, a string next to a number. This is called
type coercion.

```javascript
"5" + 3     // "53"  — number coerced to string
"5" - 3     // 2     — string coerced to number
true + 1    // 2     — boolean coerced to number
```

The `+` operator is the trap — it concatenates when either side is a
string instead of adding.

Always use `===` to avoid silent coercion bugs. `===` never converts types.

---

## Q102.8 — What is hoisting in JavaScript?

Hoisting means JavaScript moves your variable and function declarations
to the top before running any code.

`var` is hoisted and initialised to `undefined` — you can read it before
its line without an error (but get `undefined`).

`let` and `const` are hoisted but not initialised — reading them before
their declaration throws a `ReferenceError`. This gap — from the block
start to the declaration line — is called the TDZ (Temporal Dead Zone).

```javascript
console.log(a); // undefined — var hoisted
var a = 5;

console.log(b); // ReferenceError — TDZ
let b = 5;
```

---

## Q102.9 — What is scope in JavaScript? What are the three types?

Scope decides which code can see a variable.

**Global** — declared outside all functions and blocks. Visible everywhere.

**Function** — declared inside a function. Only visible inside that function.

**Block** — declared with `let` or `const` inside `{ }`. Only visible
inside that block.

```javascript
const appName = "MyApp";   // global

function greet() {
  const msg = "Hello";     // function scope
  console.log(appName);    // ✅ can see global
  console.log(msg);        // ✅ can see own scope
}

console.log(msg);          // ❌ ReferenceError
```

---

## Q102.10 — What is the Temporal Dead Zone (TDZ)?

TDZ stands for Temporal Dead Zone. It is the gap from the start of a
block until the line where `let` or `const` is declared. The variable
exists in memory but you cannot read it yet.

```javascript
console.log(name); // ReferenceError: Cannot access 'name' before initialization
const name = "Alice";
```

This is intentional — it prevents the silent `undefined` bug that `var`
hoisting creates. An error is better than a wrong value.

---

## Q102.11 — What is the difference between global scope and block scope?

Global scope — variable lives outside all blocks, accessible everywhere.

Block scope — variable lives inside `{ }`, dies when the block ends.

```javascript
const TAX = 0.20;          // global — accessible everywhere

if (true) {
  const discount = 0.10;   // block — only inside this { }
  console.log(TAX);        // ✅ can see global
  console.log(discount);   // ✅ can see block variable
}

console.log(TAX);          // ✅ 0.20
console.log(discount);     // ❌ ReferenceError — block is gone
```

---

## Q102.12 — What is wrong with using var in a loop — show the bug and fix it?

`var` is function-scoped. All iterations share the same variable. When a callback fires later, it reads the final value — not the value at
the time it was created.

```javascript
// ❌ var — all callbacks read i = 3
for (var i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// prints: 3, 3, 3

// ✅ let — each iteration gets its own i
for (let i = 0; i < 3; i++) {
  setTimeout(() => console.log(i), 0);
}
// prints: 0, 1, 2
```

---

## Q102.13 — Write code showing the difference between var, let, and const in a block

```javascript
// var leaks out of the if block
if (true) {
  var leaky = "I escaped";
}
console.log(leaky); // "I escaped" — bad

// let stays inside
if (true) {
  let contained = "I stay here";
}
console.log(contained); // ReferenceError — good

// const — cannot reassign
const MAX = 100;
MAX = 200; // TypeError
```

---

## Q102.14 — Write code that demonstrates the var loop bug vs the let fix

```javascript
// ❌ var bug — closures all share the same variable
const fns = [];
for (var i = 0; i < 3; i++) {
  fns.push(() => i);
}
console.log(fns[0](), fns[1](), fns[2]()); // 3, 3, 3

// ✅ let fix — each iteration has its own binding
const fns2 = [];
for (let j = 0; j < 3; j++) {
  fns2.push(() => j);
}
console.log(fns2[0](), fns2[1](), fns2[2]()); // 0, 1, 2
```

---

## Q102.15 — Describe a scope or type bug that broke something in your project

In our project an API was returning a status field as the string `"200"`
instead of the number `200`. Our assertion used `==`:

```javascript
// ❌ passed silently — coercion hid the type bug
expect(status == 200).toBeTruthy();
```

A discount calculation later broke because `"200" + 1` gives `"2001"`,
not `201`. We fixed assertions to use `===` and added the `eqeqeq` ESLint
rule to enforce it project-wide.

---

## Q102.16 — What is the difference between == and ===?

`==` is the loose equality operator. It coerces types before comparing.
`===` is the strict equality operator. It never converts types.

```javascript
0 == false          // true  — coercion
0 === false         // false — no coercion

null == undefined   // true  — special rule in the spec
null === undefined  // false

"1" == 1            // true  — string coerced to number
"1" === 1           // false
```

Always use `===`. The `==` coercion rules are complex enough that even
experienced engineers misremember them. ESLint's `eqeqeq` rule enforces
`===` project-wide — it belongs in every Playwright project's ESLint
config alongside `prefer-const` and `no-var`.

---

## Q102.17 — What is the difference between a primitive and a reference type?

**Primitives** (`string`, `number`, `boolean`, `null`, `undefined`,
`bigint`, `symbol`) are stored by value. Copying a primitive copies the
actual value.

**Reference types** (objects, arrays, functions) are stored by reference.
The variable holds a pointer to data in memory, not the data itself.

```javascript
// Primitive — copy by value
let a = 5;
let b = a;
b = 10;
console.log(a); // 5 — unchanged

// Reference — copy by reference
const arr = [1, 2, 3];
const arr2 = arr;
arr2.push(4);
console.log(arr); // [1, 2, 3, 4] — original changed!
```

This explains why `const arr = []` does not mean the array is immutable.
`const` prevents reassigning the variable — it does not prevent mutating
the object it points to. The binding is constant; the data is not.

---

## Q102.18 — What does typeof return and when would you use it?

`typeof` returns a string describing the runtime type of a value.

```javascript
typeof "hello"      // "string"
typeof 42           // "number"
typeof true         // "boolean"
typeof undefined    // "undefined"
typeof null         // "object"   ← historical bug — use === null instead
typeof {}           // "object"
typeof []           // "object"   ← arrays are also "object"
typeof function(){} // "function"
```

Use `typeof` in test helpers when reading values from environment variables
or configuration — those come in as strings and sometimes need to be
validated before use.

Two traps to know: `typeof null` returns `"object"` — always check for
null with `=== null`. And `typeof []` returns `"object"` — use
`Array.isArray()` to distinguish arrays from plain objects.

---

## Chapter Summary — Key Points for Your Interview

- `const` by default. `let` when you need to reassign. Never `var`.
- `var` is function-scoped and leaks from blocks. `let`/`const` are block-scoped.
- `undefined` = not yet assigned. `null` = deliberately empty.
- `===` never coerces types. Always use it over `==`. ESLint's `eqeqeq` enforces this.
- TDZ: `let`/`const` throw if read before their declaration line.
- The `var`-in-loop closure bug is a classic interview question — know it cold.
- Primitives are copied by value. Reference types (objects, arrays) are copied by reference — `const arr = []` does not make the array immutable.
- `typeof null` returns `"object"` (historical bug). Use `=== null` to check for null. Use `Array.isArray()` for arrays.
