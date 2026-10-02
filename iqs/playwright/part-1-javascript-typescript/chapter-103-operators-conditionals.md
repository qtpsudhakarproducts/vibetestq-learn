# Chapter 103 — Operators & Conditionals

This chapter covers how JavaScript makes decisions. Interviewers test
operators and conditionals because `==` vs `===`, `??` vs `||`, and
truthy/falsy behaviour cause real bugs in test code. Questions move from
operator basics through edge cases to small, focused code tasks.

---

## Q103.1 — What are the categories of operators in JavaScript?

**Arithmetic** — `+`, `-`, `*`, `/`, `%`, `**`

**Comparison** — `==`, `===`, `!=`, `!==`, `<`, `>`, `<=`, `>=`

**Logical** — `&&`, `||`, `!`, `??`

**Assignment** — `=`, `+=`, `-=`, `*=`

**Ternary** — `condition ? valueIfTrue : valueIfFalse`

**Optional chaining** — `?.`

---

## Q103.2 — What is the difference between == and ===?

`==` (loose equality) converts types before comparing.
`===` (strict equality) never converts — types must match.

```javascript
"5" == 5    // true  — string coerced to number
"5" === 5   // false — different types

0 == false  // true  — both coerced to 0
0 === false // false — number vs boolean

null == undefined  // true
null === undefined // false
```

**Always use `===` in JavaScript code.** Coercion hides bugs.

---

## Q103.3 — When do you use comparison operators in JavaScript?

Wherever a decision depends on a value — validating input, checking
a status, deciding which path to take.

```javascript
const age = 20;

if (age >= 18) {
  console.log("Adult");
} else {
  console.log("Minor");
}

const fee = age >= 65 ? 0 : 5.99; // ternary
```

In test automation, `===` comparisons appear in assertions and in
conditional setup logic (e.g., running extra steps only on certain
environments).

---

## Q103.4 — How does your team enforce === usage across the project?

We use ESLint's `eqeqeq` rule, which bans `==` and `!=` everywhere. It
runs on every pull request. The only exception we allow is `== null`
because it matches both `null` and `undefined` in one check, which is
occasionally useful.

```javascript
// == null catches both null and undefined in one check
if (value == null) { /* value is null or undefined */ }

// Equivalent explicit form
if (value === null || value === undefined) { /* same result, more verbose */ }
```

---

## Q103.5 — What is the ternary operator and when should you use it?

The ternary is a one-line if-else for simple value decisions.

```javascript
const label = isLoggedIn ? "Log out" : "Log in";
const price = isMember  ? 9.99     : 14.99;
```

Use it when each branch returns a single value and both branches are
short. If either branch needs more than one step, use `if-else` instead.

---

## Q103.6 — What is the nullish coalescing operator (??) and how does it work?

`??` returns the right side only when the left side is `null` or `undefined`.
It does not trigger on `0`, `false`, or `""`.

```javascript
const timeout = userTimeout ?? 30000;
// If userTimeout is null or undefined → 30000
// If userTimeout is 0 → 0  (kept — it is a valid value)

null      ?? "default"  // "default"
undefined ?? "default"  // "default"
0         ?? "default"  // 0
""        ?? "default"  // ""
false     ?? "default"  // false
```

---

## Q103.7 — What is optional chaining (?.) and what problem does it solve?

`?.` stops evaluation and returns `undefined` if the value before it is
`null` or `undefined`, instead of throwing a `TypeError`.

```javascript
const user = null;

// ❌ Without ?.
console.log(user.address.city); // TypeError: Cannot read properties of null

// ✅ With ?.
console.log(user?.address?.city); // undefined — no error
```

Useful when reading deeply nested data that may not exist.

---

## Q103.8 — What are truthy and falsy values? Name the falsy values.

JavaScript has six falsy values:

```javascript
false, 0, "", null, undefined, NaN
```

Everything else is truthy — including `[]`, `{}`, and `"0"`.

```javascript
if ("") { }         // does not run — empty string is falsy
if ("hello") { }    // runs — non-empty string is truthy
if (0) { }          // does not run
if ([]) { }         // runs — empty array is truthy
```

This matters in conditionals that check whether a variable has a usable
value.

---

## Q103.9 — What is the difference between ?? and ||?

`||` falls back when the left side is **falsy** (includes `0`, `""`, `false`).
`??` falls back only when the left side is **null or undefined**.

```javascript
const retries = 0;

retries || 3   // 3 — 0 is falsy, fallback triggered (wrong!)
retries ?? 3   // 0 — 0 is not null/undefined, kept (correct)
```

Use `??` when `0`, `false`, or `""` are valid values you want to keep.
Use `||` when any falsy value should trigger the fallback.

---

## Q103.10 — What is the difference between if-else and switch?

Both choose a branch based on a condition. The difference is readability
when comparing one variable against many values.

```javascript
// if-else — good for ranges and complex conditions
if (score >= 90)      grade = "A";
else if (score >= 70) grade = "B";
else                  grade = "C";

// switch — good for one variable vs many exact values
switch (status) {
  case "active":   label = "Active";   break;
  case "pending":  label = "Pending";  break;
  case "archived": label = "Archived"; break;
  default:         label = "Unknown";
}
```

Use `if-else` for conditions involving ranges or multiple variables.
Use `switch` when a single variable is compared against a list of values.

---

## Q103.11 — What is wrong with this code — show the bug and fix it?

```javascript
// ❌ Bug — == with 0 behaves unexpectedly
const retries = 0;
if (retries == false) {
  console.log("No retries"); // prints — 0 == false is true
}

// ❌ Bug — || swallows valid 0
const timeout = userSetting || 5000;
// If userSetting is 0, timeout becomes 5000 — wrong
```

```javascript
// ✅ Fix
if (retries === 0) {
  console.log("No retries"); // explicit, no coercion
}

const timeout = userSetting ?? 5000; // 0 is preserved
```

---

## Q103.12 — When should you NOT use the ternary operator?

When either branch has side effects, is multi-step, or the condition is
complex. In these cases `if-else` is clearer.

```javascript
// ❌ Hard to read
const result = isReady ? (start(), processData()) : (log("not ready"), null);

// ✅ Clearer as if-else
if (isReady) {
  start();
  processData();
} else {
  log("not ready");
}
```

The rule: ternary for selecting a value, `if-else` for executing steps.

---

## Q103.13 — Write a function that builds a config using ??, ||, and ternary

```javascript
function buildConfig(options = {}) {
  return {
    host:    options.host    || "localhost",       // || — empty string falls back
    port:    options.port    ?? 3000,              // ?? — 0 is a valid port
    debug:   options.debug   ?? false,             // ?? — false is valid
    label:   options.debug   ? "debug" : "prod",  // ternary — picks label
  };
}

console.log(buildConfig({ port: 0, debug: false }));
// { host: "localhost", port: 0, debug: false, label: "prod" }
```

---

## Q103.14 — Write a URL router using a switch statement

```javascript
function getApiUrl(env) {
  switch (env) {
    case "dev":        return "http://localhost:4000";
    case "staging":    return "https://api.staging.example.com";
    case "production": return "https://api.example.com";
    default:           throw new Error(`Unknown env: ${env}`);
  }
}

console.log(getApiUrl("staging")); // "https://api.staging.example.com"
```

The `default` clause throws — a clear error is better than silently
returning the wrong URL.

---

## Q103.15 — Describe a bug caused by == vs === or || vs ?? in your project

In our project a timeout value of `0` was valid (meaning "no timeout").
A helper was using `||` as a fallback:

```javascript
const timeout = options.timeout || 30000;
// When options.timeout was 0, this fell back to 30000 — wrong
```

Tests that were supposed to run without a timeout were silently getting
a 30-second limit. We fixed it to `??` and added a lint rule to flag
`||` in default-value patterns where zero is a valid input.

---

## Q103.16 — What are logical assignment operators and when would you use them?

Added in ES2021, logical assignment operators combine a logical check
with assignment. They only assign when the condition is met.

```javascript
// ||= assigns only if the left side is falsy
options.timeout ||= 5000;
// equivalent to: options.timeout = options.timeout || 5000;

// ??= assigns only if the left side is null or undefined
options.retries ??= 3;
// equivalent to: options.retries = options.retries ?? 3;

// &&= assigns only if the left side is truthy
user.name &&= user.name.trim();
// equivalent to: user.name = user.name && user.name.trim();
```

The same `??` vs `||` rule applies here. Use `??=` when `0`, `false`,
or `""` are valid values you want to preserve. Use `||=` only when
any falsy value should be replaced.

Not yet common in test code, but increasingly seen in config builders
and helper utilities. Knowing the pattern signals awareness of the
modern language.

---

## Chapter Summary — Key Points for Your Interview

- `===` never coerces. `==` does. Always use `===`.
- `??` falls back on `null`/`undefined` only. `||` falls back on any falsy.
  Use `??` when `0`, `false`, or `""` are valid values.
- `?.` stops on `null`/`undefined` instead of throwing.
- Six falsy values: `false`, `0`, `""`, `null`, `undefined`, `NaN`.
  Everything else is truthy — including `[]` and `{}`.
- Ternary for selecting a value. `if-else` for executing steps.
- `switch` for one variable vs many values. `if-else` for ranges.
- `??=` assigns only when `null`/`undefined`. `||=` assigns on any falsy.
  Same rule as `??` vs `||` — use `??=` when `0` or `false` are valid.
