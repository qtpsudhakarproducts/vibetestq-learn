# Chapter 101 — JS for Automation — Introduction & History

This chapter builds your understanding of JavaScript from the ground up —
starting with what it is, how it runs, and why it became the language of
choice for modern test automation. Read the questions in order: each answer
builds on the previous one.

---

## Q101.1 — What is JavaScript?

JavaScript is a programming language created in 1995 to make web pages
interactive. It started as a browser-only language — making buttons click,
forms validate, and pages update without a full reload.

Today JavaScript is the world's most widely used programming language. It
runs inside every web browser, on servers via Node.js, on desktop apps via
Electron, and in test automation tools like Playwright and Cypress.

For a test automation engineer, two things matter most:

- It is **asynchronous** — it can start an action (like a page load or API
  call), wait for it to finish, and continue without blocking. Every browser
  interaction takes time. JavaScript handles that naturally with `await`.
- It runs **natively in every browser** — tools like Playwright use browser
  protocols built for JavaScript, not a slow HTTP driver sitting in between.

---

## Q101.2 — Why do we need Node.js?

Before Node.js, JavaScript could only run inside a web browser. This made
it impossible to use for test automation because:

- It could not read or write files (no test data, no reports, no screenshots)
- It could not launch browsers from the command line
- It could not run in a CI/CD pipeline
- It could not install packages or manage dependencies

**Node.js (2009)** solved this. Ryan Dahl took the V8 JavaScript engine
from Chrome and wrapped it in a system that could access the operating system.

With Node.js, JavaScript can:

- **Read and write files** — save screenshots, test reports, and test data
- **Launch browsers** — Playwright uses Node.js to start Chrome, Firefox, and WebKit
- **Run from the terminal** — `npx playwright test` is a Node.js command
- **Install packages** — npm (Node Package Manager) comes with Node.js
- **Run in CI/CD** — Node.js is lightweight and works on every CI platform

Without Node.js, Playwright cannot run. When you install Playwright, you
are installing a Node.js library.

---

## Q101.3 — How was JavaScript executed before Node.js?

Before Node.js (before 2009), JavaScript ran **only inside web browsers**.
When a user visited a web page, the browser downloaded the HTML file. If
the HTML included a `<script>` tag, the browser's JavaScript engine would
read and execute that script.

```html
<!-- Before Node.js: JavaScript only ran inside this browser context -->
<html>
  <body>
    <button onclick="alert('Hello!')">Click me</button>
    <script>
      // This runs inside the browser — nowhere else
      function validate() {
        return document.getElementById('email').value !== '';
      }
    </script>
  </body>
</html>
```

The JavaScript could manipulate the page — change text, handle button clicks,
validate forms — but nothing more.

**What JavaScript could NOT do before Node.js:**

- Access the file system (no reading CSV, no saving screenshots)
- Launch a browser (it was already inside one)
- Run from a terminal or command line
- Install packages or libraries

This is why test automation in the pre-2009 era used Java (Selenium), Python,
or C# — languages that could access files, launch processes, and run from
the command line. JavaScript simply did not have those capabilities yet.

---

## Q101.4 — What is the difference between a browser JS engine and Node.js?

Both use JavaScript to run code, but their purpose and capabilities are
very different.

| | Browser JS Engine | Node.js |
|-|-------------------|---------|
| Purpose | Run JS inside a web page | Run JS as a standalone program |
| JS Engine | V8 (Chrome/Edge), SpiderMonkey (Firefox), JavaScriptCore (Safari) | V8 only |
| Can access DOM | ✅ Yes | ❌ No — no web page |
| Can access file system | ❌ No | ✅ Yes |
| Can run from terminal | ❌ No | ✅ Yes — `node script.js` |
| Has `window`/`document` | ✅ Yes | ❌ No |
| Has `fs`, `path`, `http` | ❌ No | ✅ Yes |
| Used for | Making web pages interactive | Test automation, servers, CLI tools |

The browser wraps its JS engine with web APIs (DOM, fetch, localStorage).
Node.js wraps V8 with system APIs (file system, OS, network).

For test automation: you write your Playwright test in JavaScript, Node.js
runs it, and Node.js instructs Playwright to launch and control the browser.
Your test code itself never runs inside the browser.

---

## Q101.5 — What is ECMAScript and how is it linked with JavaScript?

ECMAScript is the **official specification** for JavaScript. JavaScript is
the **implementation** of that specification.

ECMAScript is the rulebook. It defines what the language must do — syntax,
built-in methods, and how the engine should behave. JavaScript is the
language developers write and engines execute.

**Why is it not just called "JavaScript"?**
When Netscape handed JavaScript to ECMA International for standardisation
in 1997, they could not use the name "JavaScript" — Sun Microsystems (later
Oracle) owned the trademark. So the standard was named **ECMAScript** —
named after the standards body.

**Who decides what goes into ECMAScript?**
The **TC39 committee** (Technical Committee 39) manages the standard. TC39
reviews proposals, runs them through stages (Stage 1 → Stage 4), and decides
what features go into each yearly release.

**Key versions for test automation:**

| Version | Year | Key additions |
|---------|------|---------------|
| ES5 | 2009 | Baseline — `forEach`, `map`, `filter`, strict mode |
| ES6 / ES2015 | 2015 | `let`/`const`, arrow functions, Promises, classes, modules |
| ES2017 | 2017 | `async/await` — made sequential async code possible |
| ES2018 | 2018 | `for await...of` — async loops |
| ES2020 | 2020 | Optional chaining `?.`, nullish coalescing `??` |

> 💡 **Interview Tip:** "ES6 and ES2015 are the same version." ES6 was the
> informal name. ES2015 is the official name used after TC39 switched to
> yearly releases in 2015.

---

## Q101.6 — What is the difference between Node.js and JavaScript?

JavaScript is the **language** — the syntax, keywords, and rules you write
code with.

Node.js is the **runtime** — the environment that reads your JavaScript file
and runs it outside the browser.

**Analogy:** Think of Java the language vs the JVM (Java Virtual Machine).
You write Java; the JVM executes it. You write JavaScript; Node.js executes
it outside the browser.

| | JavaScript | Node.js |
|-|------------|---------|
| What it is | A programming language | A runtime environment |
| Purpose | Define what to do (the code) | Execute the code outside a browser |
| Created by | Brendan Eich / Netscape (1995) | Ryan Dahl (2009) |
| Example | `await page.goto('/login')` | `node script.js` or `npx playwright test` |

In short: you write JavaScript, Node.js runs it.

---

## Q101.7 — What is the difference between Node.js and JDK?

Both Node.js and JDK (Java Development Kit) are **runtime platforms** —
you install them so that code can run on your machine. But they run different
languages and work differently.

| | Node.js | JDK (Java) |
|-|---------|------------|
| Language | JavaScript | Java |
| Typing | Dynamic — types checked at runtime | Static — types declared and checked at compile time |
| Compile step | None for the developer | Required — `javac` compiles `.java` to bytecode |
| Package manager | npm / yarn | Maven / Gradle |
| Test framework | `@playwright/test`, Jest, Mocha | TestNG, JUnit |
| Concurrency | Single-threaded, event loop | Multi-threaded |
| Run a file | `node script.js` | `java MyApp` (after `javac MyApp.java`) |
| Version check | `node --version` | `java --version` |

**For test automation:**

- Install Node.js → run Playwright, Cypress, Jest
- Install JDK → run Selenium with TestNG or JUnit

Both are cross-platform (Windows, Mac, Linux). The choice usually comes
down to which language your team already uses.

---

## Q101.8 — What is the difference between JavaScript and other languages like Java, Python, and C#?

All four are used for test automation. The key differences are typing,
execution model, concurrency, and the test tools they support.

| | JavaScript | Java | Python | C# |
|-|------------|------|--------|----||
| Created | 1995 | 1995 | 1991 | 2000 |
| Typing | Dynamic | Static | Dynamic | Static |
| Compile step | None (JIT at runtime) | Yes (`javac`) | None | Yes (`csc`) |
| Runs on | Node.js / Browser | JVM | Python interpreter | .NET runtime |
| Concurrency | Single-threaded, event loop | Multi-threaded | Multi-threaded (GIL) | Multi-threaded |
| `await` needed | ✅ Yes — must write it | ❌ No — threads block | ✅ Yes (asyncio) | ✅ Yes (async/await) |
| Test tools | Playwright, Cypress, Jest | Selenium, TestNG, JUnit | Playwright, pytest, Robot | Playwright, NUnit, MSTest |

**The most important difference for automation — waiting:**

Java, Python (sync), and C# block their thread automatically. Each line
waits for the previous line to finish:

```java
// Java Selenium — lines wait automatically
driver.get("https://example.com");
driver.findElement(By.id("username")).sendKeys("admin");
driver.findElement(By.id("submit")).click();
```

JavaScript does not block by default. You must write `await` on every action:

```javascript
// Playwright — await is required on every browser action
await page.goto('https://example.com');
await page.fill('#username', 'admin');
await page.click('#submit');
```

Forget `await` in JavaScript and the next line runs before the action
finishes — the test breaks without an obvious error message.

---

## Q101.9 — Why was JavaScript not the first choice for test automation before 2017?

Before 2017, test automation teams mostly chose Java, Python, or C# — not
JavaScript. The reason was how each language handles waiting.

Java, Python, and C# are **synchronous by default**. Every line waits for
the previous line to finish. A Selenium test in Java just works:

```java
// Java Selenium — each line waits automatically
driver.get("https://example.com/login");
driver.findElement(By.id("username")).sendKeys("admin");
driver.findElement(By.id("submit")).click();
// Predictable. No surprises.
```

**JavaScript did not wait by default.** Before `async/await`, every browser
operation was asynchronous. You had to nest callbacks to handle each result:

```javascript
// ❌ Before async/await — callback hell
openBrowser(function(browser) {
  browser.navigateTo('login', function() {
    browser.fill('username', 'admin', function() {
      browser.fill('password', 'secret', function() {
        browser.click('submit', function() {
          // Done — buried 5 levels deep, unreadable
        });
      });
    });
  });
});
```

This is called **callback hell** — deeply nested callbacks that are
unreadable, hard to debug, and break easily.

Two things were missing: a platform to run JavaScript outside the browser,
and a clean way to write sequential code. Both arrived:

1. **Node.js (2009)** — gave JavaScript a runtime outside the browser.
2. **Promises (ES6, 2015)** — made chaining async operations cleaner, but
   code was still not truly sequential.
3. **`async/await` (ES2017)** — the real game changer. Async code now looks
   and behaves exactly like synchronous code:

```javascript
// ✅ With async/await — clean and sequential, just like Java
test('login', async ({ page }) => {
  await page.goto('https://example.com/login');
  await page.fill('#username', 'admin');
  await page.fill('#password', 'secret');
  await page.click('#submit');
  await expect(page).toHaveURL('/dashboard');
});
```

From 2017 onwards, JavaScript test code reads like Java or Python. That is
when Playwright, Cypress, and modern tools took off.

---

## Q101.10 — What does "interpreted" mean? How does JavaScript execute code?

A compiled language — like Java or C# — converts all your code into
machine instructions before it runs. The compiler catches many errors
before execution starts.

An interpreted language has no separate compile step visible to the
developer. The engine reads your source code, parses it, and executes it
directly. JavaScript follows this model — modern engines like V8 also apply
JIT (Just-In-Time) compilation internally to optimise hot code paths, but
that happens transparently.

What this means for you as a developer: there is no step where you compile
your code before running it. You write the test, run `npx playwright test`,
and Node.js starts executing your file line by line from top to bottom.

If you have a typo on line 50, lines 1 to 49 run fine — then the test
crashes at line 50. In Java, the compiler would have flagged that typo
before the program ever started.

```javascript
// This error only appears when this line executes
await loginPage.clikc(); // typo — TypeError at runtime
```

This is the main reason the Playwright team recommends TypeScript. TypeScript
adds a compile step that catches typos, wrong method names, and type
mismatches before the test ever runs.

```typescript
// TypeScript catches this before any browser opens
await loginPage.clikc();
// ❌ Property 'clikc' does not exist on type 'LoginPage'
```

---

## Q101.11 — What is the difference between JavaScript and TypeScript?

JavaScript is dynamically typed — you do not say what type a variable holds,
and the type can change while the code runs.

TypeScript adds a type system on top of JavaScript. You declare what type
each variable, parameter, and return value holds. The TypeScript compiler
checks these types before the code runs and reports any mistakes.

TypeScript is a superset of JavaScript — it extends JavaScript and adds a
type system on top. When the code runs, TypeScript types are stripped away —
the browser or Node.js only ever sees plain JavaScript.

| | JavaScript | TypeScript |
|-|------------|------------|
| Type checking | At runtime | Before the code runs |
| Variable | `let name = 'test'` | `let name: string = 'test'` |
| Errors found | When the test runs | When you save the file |
| IDE support | Basic | Full autocomplete and refactoring |
| Playwright default | Supported | Recommended |

**Use JavaScript when** you are writing a quick script or a small project
where TypeScript setup adds more work than value.

**Use TypeScript when** you are building a team test suite or using the
Page Object Model. TypeScript catches mistakes like calling a method that
does not exist or passing the wrong type of argument — before the test
ever runs.

---

## Q101.12 — What is the difference between npm, npx, and yarn?

**npm** installs and manages packages. `npm install` downloads packages
into `node_modules`. `npm run test` runs a script from `package.json`.

**npx** runs a package without installing it globally. `npx playwright test`
runs Playwright from the local `node_modules` folder. You also use it for
one-off commands like `npx playwright codegen https://example.com`.

**yarn** is an alternative to npm, created by Facebook. It does the same
job but uses a `yarn.lock` file instead of `package-lock.json`. Some teams
prefer it for speed or consistency with their frontend setup.

| | npm | npx | yarn |
|-|-----|-----|------|
| Purpose | Install packages | Run packages | Install packages |
| Install | `npm install` | — | `yarn install` |
| Run script | `npm run test` | `npx playwright test` | `yarn test` |
| Lock file | `package-lock.json` | — | `yarn.lock` |

Most Playwright projects use npm and npx. Use yarn if your project already
uses it — the Playwright commands are the same either way.

---

## Q101.13 — Is JavaScript case sensitive? What naming conventions does it use?

Yes. JavaScript treats uppercase and lowercase letters as different
characters everywhere — in variable names, function names, and keywords.

```javascript
let userName = "Alice";
let UserName = "Bob";   // completely different variable
let USERNAME = "Carol"; // also different
```

Keywords are always lowercase. Writing `Let` or `FUNCTION` causes a
syntax error.

The conventions are:

- **camelCase** for variables and functions: `loginPage`, `getUserData`, `isVisible`
- **PascalCase** for classes: `LoginPage`, `BasePage`, `TestHelper`
- **UPPER_SNAKE_CASE** for constants that never change: `MAX_RETRIES`, `BASE_URL`

In test automation, a wrong capital letter in a variable name or method
call breaks the test at runtime in JavaScript. TypeScript catches this at
compile time — it will flag `loginPage.Click()` as an error because the
method is `click()`, not `Click()`.

---

## Q101.14 — What are semicolons in JavaScript and do you need them?

A semicolon marks the end of a statement. In most languages this is
mandatory. In JavaScript it is technically optional because of a feature
called **Automatic Semicolon Insertion (ASI)**.

ASI means the JavaScript engine adds semicolons for you in most cases.
This code works without them:

```javascript
let name = "Alice"
let age = 30
console.log(name)
```

But ASI has edge cases that cause hard-to-find bugs. The most common is
a line starting with `(` or `[`:

```javascript
// ❌ ASI fails here — JavaScript reads this as one statement
let a = 1
(function() { console.log(a) })()
// Interpreted as: let a = 1(...) — TypeError
```

```javascript
// ✅ Semicolon makes the intent clear
let a = 1;
(function() { console.log(a) })();
```

The standard in professional JavaScript and TypeScript projects is to
**always use semicolons**. ESLint enforces this with the `semi` rule.
Write them consistently and you avoid all ASI edge cases.

---

## Q101.15 — What is strict mode in JavaScript?

Strict mode is a way to opt in to a stricter version of JavaScript.
You enable it by adding `"use strict"` at the top of a file or function.

```javascript
"use strict";

x = 10; // ❌ ReferenceError: x is not defined
let x = 10; // ✅ correct
```

Without strict mode, writing `x = 10` without declaring `x` first creates
a global variable silently. Strict mode turns that silent mistake into a
visible error.

Strict mode also prevents:

- Using duplicate parameter names in functions
- Writing to read-only properties without an error
- Deleting variables or functions with `delete`

In modern JavaScript and TypeScript projects you rarely add `"use strict"`
manually. Two things enable it automatically:

1. **ES Modules** — any file using `import` or `export` runs in strict
   mode by default.
2. **TypeScript** — enforces strict mode behaviour when `"strict": true`
   is set in `tsconfig.json`.

In a Playwright TypeScript project, strict mode is always active. This is
why TypeScript catches undeclared variables, wrong types, and unsafe
operations before the test ever runs.

---

## Q101.16 — How do you initialise Node.js to use JavaScript?

Before writing any JavaScript for automation, you set up a Node.js project.
This creates the `package.json` file — the central config that tracks your
project name, scripts, and installed packages.

**Step 1: Check Node.js is installed**

```bash
node --version
# v22.14.0  (must be 20, 22, or 24 for Playwright)
npm --version
# 10.9.2
```

**Step 2: Create a project folder and initialise**

```bash
mkdir my-automation-project
cd my-automation-project
npm init -y
```

`npm init -y` creates `package.json` instantly with default values. The
`-y` flag skips the interactive questions.

**Step 3: Install Playwright**

```bash
npm install @playwright/test
npx playwright install
```

The first command downloads Playwright into `node_modules`. The second
downloads the browser binaries (Chromium, Firefox, WebKit).

**Your project folder now looks like:**

```
my-automation-project/
├── package.json          ← project config, scripts, dependencies
├── package-lock.json     ← exact versions of every installed package
└── node_modules/         ← all installed packages (do not edit manually)
```

**Step 4: Add a test script to `package.json`**

```json
{
  "scripts": {
    "test": "npx playwright test"
  }
}
```

Now `npm test` runs your Playwright suite.

---

## Q101.17 — How do you execute JavaScript code using Node.js?

There are two main ways to run JavaScript with Node.js.

**Method 1: Run a JavaScript file directly**

Create a file `hello.js`:

```javascript
console.log('Hello from Node.js');
const sum = 2 + 3;
console.log('Sum:', sum);
```

Run it from the terminal:

```bash
node hello.js
# Hello from Node.js
# Sum: 5
```

**Method 2: Run Playwright tests via npx**

```bash
# Run all tests
npx playwright test

# Run a specific test file
npx playwright test tests/login.spec.ts

# Run tests with browser visible
npx playwright test --headed

# Run with a specific browser
npx playwright test --project=chromium
```

**What happens when you run `npx playwright test`:**

1. Node.js starts
2. npx locates Playwright in `node_modules`
3. Playwright reads `playwright.config.ts`
4. Playwright launches browser processes
5. Node.js executes each test file
6. Playwright sends commands to the browser and collects results
7. HTML report is generated in `playwright-report/`

---

## Q101.18 — Why is Node.js the preferred environment for Playwright test automation?

Node.js is not just a way to run JavaScript — it is the reason modern
browser test automation became practical. Here is why it is the preferred
environment for Playwright:

**`@playwright/test` is a Node.js package only**

Playwright's full test framework — fixtures, retries, parallelism, HTML
reports, and the trace viewer — exists only as a Node.js package. Java and
Python get the browser automation library, but not the complete framework.

```bash
npm install @playwright/test  # One command = complete testing platform
```

**npm gives you everything you need**

| Need | Package |
|------|---------|
| Fake test data | `faker-js` |
| PDF reading | `pdf-parse` |
| Database queries | `pg`, `mysql2` |
| Excel/CSV files | `xlsx`, `csv-parse` |
| API mocking | `msw` |

**File system access for test artefacts**

Playwright saves screenshots, videos, and traces to disk. Node.js file
system APIs make this possible.

```javascript
// Node.js lets Playwright save evidence on failure
await page.screenshot({ path: 'screenshots/failure.png' });
await page.video().saveAs('videos/test-run.webm');
```

**Runs everywhere CI/CD runs**

Every major CI platform (GitHub Actions, Jenkins, GitLab CI, Azure DevOps)
supports Node.js natively. A single `npm ci && npx playwright test` command
is all you need in any pipeline.

**Single language across the project**

If your web application is built with React, Vue, or Angular, your frontend
code is already in JavaScript or TypeScript. Using the same language for
tests means developers can read and write tests, and utilities can be
shared between app code and test code.

---

## Chapter Summary — Key Points for Your Interview

- JavaScript started as a browser-only language in 1995. Node.js (2009)
  broke it free and made test automation possible.
- Before Node.js, JS ran only inside browsers — no file access, no command
  line, no CI/CD. Node.js gave JavaScript all of that.
- A browser JS engine (V8, SpiderMonkey, JavaScriptCore) runs JS inside a
  web page with DOM access. Node.js wraps V8 with file system and OS access
  to run JS as a standalone program.
- ECMAScript is the official language specification. JavaScript is the
  implementation. TC39 manages the standard with yearly releases.
- Node.js is to JavaScript what JDK is to Java — the runtime you install
  to execute code. npm is to Node.js what Maven/Gradle is to Java.
- Before ES2017, async JavaScript required deeply nested callbacks (callback
  hell). `async/await` made async code sequential — the turning point for
  JavaScript test automation.
- JavaScript is interpreted — errors only appear at runtime. TypeScript adds
  a compile step that catches typos and type errors before any test runs.
- `@playwright/test` is available only in JavaScript and TypeScript. It
  gives a complete test framework — fixtures, reports, traces — in one package.
- Initialise a project: `npm init -y`. Install Playwright: `npm install @playwright/test`. Run tests: `npx playwright test`.

---

