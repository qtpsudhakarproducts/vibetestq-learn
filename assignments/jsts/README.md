# JavaScript & TypeScript — 210 Practice Questions
### For Test Automation Engineers

---

## 📖 What Is This?

This is a complete self-study resource for learning JavaScript, TypeScript and Node.js with a focus on test automation.

It contains **two sets of files** that work together:

| Folder | Purpose |
|--------|---------|
| `js-ts-questions/` | 20 question files — one per stage. Read these to practice. |
| `js-ts-answers/` | 20 answer files — one per stage. Check these after you attempt. |

**How to use:**
1. Open the question file for a stage (e.g. `stage-01-basics.md`)
2. Read each question and write the code yourself
3. Run your code in Node.js to verify the output
4. If stuck or done, open the matching answer file to compare
5. Every answer has inline comments explaining the logic

---

## ⚙️ Prerequisites

**To run JavaScript (Stages 1–17):**
```
node --version    # needs Node.js 16 or higher
```
Run any file with: `node filename.js`

**To run TypeScript (Stages 18–20):**
```
npm install -g ts-node typescript
ts-node filename.ts
```

**For Node.js stages (Stage 16):**
```
npm install dotenv    # for Q162 environment variables
```

---

## 📚 All 20 Stages

| Stage | Question File | Answer File | Topics | Questions |
|-------|--------------|-------------|--------|-----------|
| 1  | [stage-01-basics.md](./js-ts-questions/stage-01-basics.md) | [answers](./js-ts-answers/stage-01-basics.md) | Variables, scope, types, hoisting, pass by value/reference | Q1–Q12 |
| 2  | [stage-02-numbers.md](./js-ts-questions/stage-02-numbers.md) | [answers](./js-ts-answers/stage-02-numbers.md) | Factorial, Armstrong, perfect number, GCD/LCM, unique random | Q13–Q22 |
| 3  | [stage-03-strings-builtins.md](./js-ts-questions/stage-03-strings-builtins.md) | [answers](./js-ts-answers/stage-03-strings-builtins.md) | Built-in string methods, regex, frequency count | Q23–Q33 |
| 4  | [stage-04-strings-manual.md](./js-ts-questions/stage-04-strings-manual.md) | [answers](./js-ts-answers/stage-04-strings-manual.md) | Reverse, palindrome, anagram, compression without built-ins | Q34–Q43 |
| 5  | [stage-05-loops-patterns.md](./js-ts-questions/stage-05-loops-patterns.md) | [answers](./js-ts-answers/stage-05-loops-patterns.md) | for/while/do-while, break/continue, star/number/diamond patterns | Q44–Q54 |
| 6  | [stage-06-arrays-builtins.md](./js-ts-questions/stage-06-arrays-builtins.md) | [answers](./js-ts-answers/stage-06-arrays-builtins.md) | map, filter, reduce, find, flat, sort, slice, Array.from | Q55–Q64 |
| 7  | [stage-07-arrays-manual.md](./js-ts-questions/stage-07-arrays-manual.md) | [answers](./js-ts-answers/stage-07-arrays-manual.md) | Reverse, remove duplicates, bubble sort, selection sort, binary search | Q65–Q72 |
| 8  | [stage-08-functions.md](./js-ts-questions/stage-08-functions.md) | [answers](./js-ts-answers/stage-08-functions.md) | Default params, rest, destructuring, closures, memoize, debounce, throttle | Q73–Q91 |
| 9  | [stage-09-functional.md](./js-ts-questions/stage-09-functional.md) | [answers](./js-ts-answers/stage-09-functional.md) | Pure functions, immutability, compose, pipe, partial, deep merge | Q92–Q100 |
| 10 | [stage-10-objects-oop.md](./js-ts-questions/stage-10-objects-oop.md) | [answers](./js-ts-answers/stage-10-objects-oop.md) | Objects, classes, inheritance, private fields, method chaining, factories | Q101–Q115 |
| 11 | [stage-11-data-structures.md](./js-ts-questions/stage-11-data-structures.md) | [answers](./js-ts-answers/stage-11-data-structures.md) | Map, Set, WeakMap, JSON | Q116–Q122 |
| 12 | [stage-12-iterators-generators.md](./js-ts-questions/stage-12-iterators-generators.md) | [answers](./js-ts-answers/stage-12-iterators-generators.md) | Symbol.iterator, generators, yield, infinite sequences | Q123–Q127 |
| 13 | [stage-13-async-promises.md](./js-ts-questions/stage-13-async-promises.md) | [answers](./js-ts-answers/stage-13-async-promises.md) | Promises, chaining, async/await, Promise.all/race/any, retry | Q128–Q137 |
| 14 | [stage-14-error-handling.md](./js-ts-questions/stage-14-error-handling.md) | [answers](./js-ts-answers/stage-14-error-handling.md) | try/catch/finally, custom errors, re-throwing, async errors | Q138–Q144 |
| 15 | [stage-15-dates-time.md](./js-ts-questions/stage-15-dates-time.md) | [answers](./js-ts-answers/stage-15-dates-time.md) | Date formatting, arithmetic, comparison, timing, performance.now | Q145–Q157 |
| 16 | [stage-16-nodejs.md](./js-ts-questions/stage-16-nodejs.md) | [answers](./js-ts-answers/stage-16-nodejs.md) | fs, path, env, http, EventEmitter, npm scripts | Q158–Q167 |
| 17 | [stage-17-modules.md](./js-ts-questions/stage-17-modules.md) | [answers](./js-ts-answers/stage-17-modules.md) | Named/default exports, import * as, dynamic import, CommonJS | Q168–Q182 |
| 18 | [stage-18-typescript-basics.md](./js-ts-questions/stage-18-typescript-basics.md) | [answers](./js-ts-answers/stage-18-typescript-basics.md) | Types, interfaces, generics, utility types, type guards | Q183–Q191 |
| 19 | [stage-19-typescript-advanced.md](./js-ts-questions/stage-19-typescript-advanced.md) | [answers](./js-ts-answers/stage-19-typescript-advanced.md) | Discriminated unions, mapped types, conditional types, decorators | Q192–Q200 |
| 20 | [stage-20-typescript-test-automation.md](./js-ts-questions/stage-20-typescript-test-automation.md) | [answers](./js-ts-answers/stage-20-typescript-test-automation.md) | TestResult type, POM, factories, DeepReadonly, waitFor, satisfies | Q201–Q210 |

---

## 🗺️ Learning Path

Work through the stages in this exact order. Each stage builds on the previous one.

```
┌─────────────────────────────────────────────────────────────────┐
│                        JAVASCRIPT CORE                          │
│                                                                 │
│  Stage 1      Stage 2      Stage 3      Stage 4      Stage 5   │
│  Basics    →  Numbers   →  Strings   →  Strings   →  Loops    │
│  (Q1-12)      (Q13-22)    Built-in     Manual       Patterns  │
│                           (Q23-33)     (Q34-43)     (Q44-54)  │
│                                                                 │
│  Stage 6      Stage 7      Stage 8      Stage 9      Stage 10  │
│  Arrays    →  Arrays    →  Functions →  Functional→  Objects  │
│  Built-in     Manual       (Q73-91)    Patterns     & OOP     │
│  (Q55-64)     (Q65-72)                 (Q92-100)   (Q101-115) │
│                                                                 │
│  Stage 11     Stage 12     Stage 13     Stage 14     Stage 15  │
│  Data      →  Iterators →  Async     →  Error     →  Dates   │
│  Structures   Generators   Promises     Handling     & Time   │
│  (Q116-122)   (Q123-127)   (Q128-137)  (Q138-144)  (Q145-157)│
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                     NODE.JS & MODULES                           │
│                                                                 │
│  Stage 16     Stage 17                                          │
│  Node.js   →  Modules                                          │
│  (Q158-167)   (Q168-182)                                        │
└─────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────┐
│                        TYPESCRIPT                               │
│                                                                 │
│  Stage 18     Stage 19     Stage 20                             │
│  TypeScript→  TypeScript→  TypeScript                          │
│  Basics       Advanced     Test Auto                           │
│  (Q183-191)   (Q192-200)   (Q201-210)                          │
└─────────────────────────────────────────────────────────────────┘
```


