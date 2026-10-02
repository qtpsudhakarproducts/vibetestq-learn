# JavaScript Fundamentals — Interview Questions

---

## Q: What is JavaScript and why is it widely used in test automation?

**A:** JavaScript is a programming language that runs in browsers and on servers via Node.js. It is widely used in test automation because the most popular modern frameworks — Playwright and Cypress — are built with it. Tests written in JavaScript interact with browsers natively, and the language handles asynchronous operations well, which is critical when automating web interactions that involve network calls, animations, and dynamic content.

---

## Q: What is Node.js and why does Playwright depend on it?

**A:** Node.js is a runtime that lets JavaScript run outside the browser, on your machine or a server. Playwright depends on Node.js because the entire library runs as a Node.js process. You install it via npm, the test runner executes as a Node process, and all code that controls browsers runs inside Node.js.

---

## Q: What is the difference between JavaScript and ECMAScript?

**A:** ECMAScript is the official specification that defines how JavaScript should work. JavaScript is the actual implementation that follows that specification. When you hear "ES6" or "ES2020", those are version names of the ECMAScript standard — not separate languages.

---

## Q: What is the difference between JavaScript and TypeScript?

**A:** TypeScript is JavaScript with static type annotations added on top. You declare types for variables, function parameters, and return values. The TypeScript compiler checks your code for type errors before it runs, then produces plain JavaScript. For test automation, TypeScript helps catch mistakes early, provides better editor completion, and makes large codebases easier to navigate.

---

## Q: What are primitive data types in JavaScript?

**A:** The primitive types are `string`, `number`, `bigint`, `boolean`, `undefined`, `null`, and `symbol`. Primitives are immutable and compared by value. Everything else — objects, arrays, functions — is a reference type that lives on the heap and is compared by reference.

---

## Q: What is the difference between null and undefined?

**A:** `undefined` means a variable has been declared but not yet assigned a value. JavaScript sets it automatically. `null` means a variable has been deliberately assigned an empty value — you set it explicitly. Both represent the absence of a value, but `undefined` is unintentional absence and `null` is intentional.

---

## Q: What is type coercion in JavaScript?

**A:** Type coercion is when JavaScript automatically converts a value from one type to another during an operation. For example, `"5" + 3` gives `"53"` because 3 is converted to a string. `"5" - 3` gives `2` because `"5"` is converted to a number. This implicit conversion is a frequent source of bugs and the reason you should use `===` instead of `==`.

---

## Q: What is hoisting?

**A:** Hoisting is JavaScript's behaviour of moving declarations to the top of their scope before the code executes. Function declarations are fully hoisted — you can call them before they appear in the source. Variables declared with `var` are hoisted but initialised as `undefined`. Variables declared with `let` and `const` are hoisted but not initialised, so accessing them before their declaration throws a `ReferenceError`.

---

## Q: What is the Temporal Dead Zone?

**A:** The Temporal Dead Zone (TDZ) is the period between when a `let` or `const` variable is hoisted and when it actually appears in the code. If you try to access the variable during this window, JavaScript throws a `ReferenceError`. It exists to prevent the confusing behaviour of `var`, where you could read a variable before its declaration and get `undefined`.

---

## Q: What is the difference between var, let, and const?

**A:** `var` is function-scoped and can be re-declared in the same scope. `let` is block-scoped, can be reassigned, but cannot be re-declared in the same block. `const` is block-scoped, cannot be reassigned after initial binding — though objects and arrays declared with `const` can still have their contents mutated. In modern code, default to `const` and use `let` only when reassignment is needed. Avoid `var`.

---

## Q: What is the difference between == and ===?

**A:** `==` checks for equality with type coercion — it converts both values to the same type before comparing. `===` is strict equality — both the value and the type must match exactly. Always use `===` in practice. `5 == "5"` is `true`, but `5 === "5"` is `false`.

---

## Q: What are truthy and falsy values in JavaScript?

**A:** Falsy values are values that evaluate to `false` in a boolean context: `false`, `0`, `-0`, `0n`, `""`, `null`, `undefined`, and `NaN`. Every other value is truthy. This matters in conditions — `if (value)` skips the block for any falsy value, not just the literal `false`.

---

## Q: What is optional chaining (?.) and when do you use it?

**A:** Optional chaining lets you safely read a property on an object that might be `null` or `undefined`. Instead of `if (user && user.address && user.address.city)`, you write `user?.address?.city`. If any part of the chain is `null` or `undefined`, the expression short-circuits and returns `undefined` instead of throwing a `TypeError`.

---

## Q: What is the nullish coalescing operator (??) and how is it different from ||?

**A:** `??` returns the right-hand value only when the left-hand value is `null` or `undefined`. `||` returns the right-hand value for any falsy left-hand value — including `0`, `""`, and `false`. Use `??` when `0` or an empty string are valid values you want to preserve. For example, `count ?? 0` returns the actual count even if it is `0`, whereas `count || 0` would return `0` even when count is already `0`.

---

## Q: What is the difference between || and ?? in practical use?

**A:** Use `||` when you want to fall back for any falsy value (blank strings, zero, NaN all trigger the fallback). Use `??` when you only want to fall back for truly absent values — where `null` or `undefined` means "not set" but `0` or `""` are legitimate values that should not be replaced.

---
