# Playwright TypeScript — Daily Step-Up Practice Program

## From Zero to Test Lead | Hands-On Progressive Practice

**Practice Applications:** OrangeHRM → SuiteCRM → AssetExplorer
**Stack:** Playwright Test + TypeScript
**Approach:** Every day builds on the previous. No day is a repeat. Code every single day.

---

## How This Program Works

Each day has one clear focus. You practice on live applications. You write code, run it, break it, fix it. The progression is deliberate:

**Locators → Actions → Assertions → Tests → POM → Framework → CI/CD → AI**

Once you know how to find an element, everything else is just calling the right method on it. A file input is an element — `setInputFiles()` is its method. A checkbox is an element — `check()` is its method. A dialog is a context — once you are inside it, everything is normal locators and actions. This is the mindset the entire program is built on.

**The rule: do not move to the next day until today's practice works.**

---

## Daily Lab Structure

Every single day follows this structure:

**Warm-up (15 min):** A quick task on something already practised. Builds confidence and muscle memory.

**Core Practice (45 min):** The main new skill for the day. Focused, specific, hands-on.

**Open Challenge (30 min):** No guided steps. A task that requires combining today's skill with previous knowledge. Figure it out alone.

---

## Week 1 — Core Playwright Skills

**Goal:** Be completely comfortable with locators, all element actions, special contexts, assertions, and TypeScript. No page objects yet. Raw exploration and interaction on live applications.

---

### Day 1 — Playwright Architecture & Project Setup

**Focus:** Understand how Playwright works before writing a single test.

**What to Study:**
- Browser → BrowserContext → Page hierarchy and why it matters
- How Playwright communicates with browsers (CDP — Chrome DevTools Protocol)
- Why Playwright is faster and more reliable than Selenium
- Context-based vs Browser-based execution
- What test isolation means — why each test gets a fresh context
- The generated project structure — every file and what it does

**Warm-up:**
Run `npm init playwright@latest`. Open `playwright.config.ts` and read every line. Look up any option you do not understand.

**Core Practice:**
1. Run `npx playwright test --headed` — watch the generated example tests run
2. Run `npx playwright test --ui` — explore UI mode, understand every panel
3. Run `npx playwright show-report` — understand what the HTML report shows
4. Delete `example.spec.ts` and create your own `tests/first.spec.ts`
5. Navigate to `https://opensource-demo.orangehrmlive.com` and write one test that asserts the page title
6. Run it headed, run it headless — observe the difference

**Open Challenge:**
Run the same test against Firefox and WebKit using `--project`. Understand what changes in the config to make this work.

**Commit:** Working Playwright project pushed to GitHub.

**Step-Up:** Nothing existed. Now you have a running project you understand from the inside.

---

### Day 2 — Git & Node.js Project Foundation

**Focus:** Every day ends with a commit. Learn Git properly before Day 3.

**What to Study:**
- `git init`, `config`, `add`, `commit`, `push`, `pull`, `status`, `log`
- Branching — `checkout -b`, `merge`, `branch -d`
- `.gitignore` — what never goes into version control (`node_modules`, `.env`, `test-results`, `.auth`)
- Node.js runtime and npm ecosystem
- `package.json` — scripts, dependencies, devDependencies, semantic versioning
- `.env` and `dotenv` — storing credentials outside the codebase
- Project folder organisation — what goes where and why

**Warm-up:**
Check your Day 1 repo — is `.gitignore` correct? Is `node_modules` tracked? Fix anything wrong.

**Core Practice:**
1. Create `.gitignore` properly — add `node_modules/`, `test-results/`, `playwright-report/`, `.env`, `.auth/`
2. Create `.env` file — store OrangeHRM URL and credentials
3. Create `.env.example` with placeholder values — this gets committed, `.env` does not
4. Install `dotenv` — load env vars in `playwright.config.ts`
5. Add these `package.json` scripts: `test`, `test:headed`, `test:ui`, `test:report`
6. Create a `feature/day2-setup` branch — make a change — merge it back to main

**Open Challenge:**
Set up a second remote branch called `develop`. Configure your local repo so `main` is protected and all work goes through `develop` first.

**Commit:** Clean project structure with proper `.gitignore`, `.env.example`, npm scripts.

**Step-Up:** Yesterday you had a project. Today it is version-controlled and environment-aware.

---

### Day 3 — Locators: Finding Any Element

**Focus:** This is the most important day. Given any element on any page, find it confidently using the right strategy.

**What to Study:**
- `getByRole()` — semantic, based on ARIA roles — the preferred approach
- `getByLabel()` — form fields via associated label text
- `getByPlaceholder()` — inputs via placeholder attribute
- `getByText()` — elements by visible text content
- `getByTestId()` — stable `data-testid` attributes
- `locator('css')` — CSS selectors when semantic methods don't work
- `locator('xpath')` — XPath as a genuine last resort
- Chaining — `page.locator('.container').getByRole('button')`
- `filter()` — narrowing multiple matches by text or child element
- `nth()`, `first()`, `last()` — picking from a list of matches
- `locator.and()` — combining two locators on the same element
- `locator.or()` — matching either of two locators
- Locator priority: role → label → placeholder → text → testId → CSS → XPath

**Warm-up:**
Open OrangeHRM login page. Without writing any code, identify which locator strategy is best for every element on the page. Write your reasoning in a comment file.

**Core Practice on OrangeHRM and `https://demoqa.com`:**
1. Find the username input 5 different ways — role, label, placeholder, CSS, XPath
2. Find the login button 3 different ways — identify which is most stable and why
3. Navigate to Employee List — find the search field, the table rows, the Add button
4. Find an element that appears multiple times — use `nth()`, `filter()`, `first()` to target specific ones
5. On `demoqa.com/elements` — find elements inside nested containers using chaining
6. Run `npx playwright codegen https://opensource-demo.orangehrmlive.com` — observe Codegen output — manually improve every generated locator

**Open Challenge:**
On OrangeHRM's Employee List page, write a locator that finds the Edit button for a specific employee by their name — without using position-based selectors like `nth()`.

**Commit:** Locator practice file with comments explaining each choice.

**Step-Up:** Yesterday you had a project structure. Today you can find any element on any page.

---

### Day 4 — Actions: Every Method on Every Element

**Focus:** Once found, what do you call? All element actions in one day because the pattern is always the same — find it, call the method.

**What to Study:**

**Click Actions:**
- `click()`, `dblclick()`, `rightClick()`
- Click options — `{ button: 'right' }`, `{ modifiers: ['Shift'] }`, `{ force: true }`

**Input Actions:**
- `fill()` — sets the value directly, clears first
- `type()` — types character by character, respects existing content
- `clear()` — empties a field
- `press()` — a keyboard key on a specific element
- `pressSequentially()` — types with delay between characters

**Selection Actions:**
- `selectOption()` — dropdowns by value, label, or index
- `check()`, `uncheck()`, `setChecked()` — checkboxes and radio buttons

**Pointer Actions:**
- `hover()` — triggers hover state
- `focus()`, `blur()` — focus management
- `tap()` — mobile tap
- `dragAndDrop()` — drag from one element to another

**File Input Actions:**
- `setInputFiles()` — this is how you handle file upload inputs
- A file input is just an element. `setInputFiles()` is just its method. Nothing special.
- Single file, multiple files, clearing files

**Scroll Actions:**
- `scrollIntoViewIfNeeded()` — scroll to element before interacting
- `page.mouse.wheel()` — scroll the page

**Global Keyboard & Mouse:**
- `page.keyboard.press()` — global key press
- `page.keyboard.type()` — type a string globally
- `page.keyboard.down()`, `keyboard.up()` — hold modifier keys
- `page.keyboard.insertText()` — insert text bypassing key events
- `page.mouse.move()`, `mouse.click()`, `mouse.down()`, `mouse.up()`

**Warm-up:**
On OrangeHRM login, perform a full login using only `fill()` and `click()`. Assert you reach the dashboard.

**Core Practice on OrangeHRM and `https://demoqa.com`:**
1. Navigate to Add Employee — `fill()` each field, `selectOption()` on any dropdown, `check()` the create login toggle
2. On `demoqa.com/elements` — interact with text inputs, checkboxes, radio buttons, buttons — one test for each
3. On `demoqa.com/widgets` — find a dropdown — select using value, then by label, then by index
4. On `demoqa.com/upload-download` — upload a file using `setInputFiles()` — assert the filename appears
5. On OrangeHRM Recruitment — upload a resume in the candidate form
6. Use only `page.keyboard` to complete the entire OrangeHRM login — no `fill()`, no `click()`
7. Find an element that requires scrolling — use `scrollIntoViewIfNeeded()` then interact

**Open Challenge:**
On `demoqa.com/droppable` — implement a drag and drop test using both `dragAndDrop()` and the manual `mouse.down()` + `mouse.move()` + `mouse.up()` approach. Understand when each is needed.

**Commit:** Actions practice file covering every method.

**Step-Up:** Yesterday you found elements. Today you can perform any action on any element.

---

### Day 5 — Special Contexts: Dialogs, Frames, Windows & Shadow DOM

**Focus:** These are not special element types. They are special **contexts**. Once you are inside the right context, everything is normal locators and actions.

**What to Study:**

**Browser Dialogs:**
- `page.on('dialog', handler)` — set up the listener BEFORE triggering the dialog
- `dialog.accept()` — clicking OK/Confirm
- `dialog.dismiss()` — clicking Cancel
- `dialog.message()` — reading the dialog text
- `dialog.defaultValue()` — for prompt dialogs
- Alert vs Confirm vs Prompt — how each behaves and how each is handled

**iFrames & Frames:**
- `page.frameLocator('iframe')` — the modern way — gives you a locator scoped to the frame
- `frameLocator().locator()` — everything inside is normal Playwright
- Chaining frameLocators for nested iframes
- Named frames vs iframe by index vs iframe by URL pattern
- The key insight: once you have the frame context, you use the exact same locators and actions as always

**Multiple Tabs & Windows:**
- `context.waitForEvent('page')` — capture a new tab before clicking the trigger
- `page.waitForEvent('popup')` — capture popup windows
- Working with the returned page object — same API as any other page
- Closing tabs and returning focus to the original

**Downloads:**
- `page.waitForDownload()` — intercept before triggering the download
- `download.path()` — where the file was saved
- `download.saveAs(path)` — save to a specific location

**Shadow DOM:**
- Playwright automatically pierces Shadow DOM — in most cases nothing special is needed
- Understanding when auto-piercing applies and when it does not
- `>>` combinator for explicit shadow DOM traversal when needed

**Warm-up:**
On `the-internet.herokuapp.com/javascript_alerts` — manually trigger each alert type. Write down what you expect before automating.

**Core Practice:**
1. On `the-internet.herokuapp.com/javascript_alerts` — handle all three alert types (alert, confirm, prompt) — assert the result message changes correctly
2. On OrangeHRM — trigger the delete confirmation dialog — accept it and verify deletion — then repeat and dismiss it and verify the record survives
3. On `the-internet.herokuapp.com/iframe` — use `frameLocator()` to locate the editor inside the iframe and type text into it
4. On `the-internet.herokuapp.com/windows` — click the link that opens a new tab — capture the new page — assert its content — close it — assert you are back on the original
5. On `demoqa.com/upload-download` — download the sample file — assert the downloaded file exists on disk
6. Find any page with Shadow DOM (try `demoqa.com` web components) — access an element inside it using Playwright's automatic piercing

**Open Challenge:**
On OrangeHRM, find a workflow where a user action triggers a dialog. Write a test where you first assert the dialog message, then accept it, then assert the resulting state. Then write the negative path — dismiss and assert nothing changed.

**Commit:** Special contexts practice file.

**Step-Up:** Yesterday was actions on normal elements. Today you handle every context those elements can live inside.

---

### Day 6 — Assertions & Wait Strategies

**Focus:** Verify outcomes correctly. Understand Playwright's auto-waiting so your tests never need arbitrary sleeps.

**What to Study:**

**Web-First Assertions (auto-retry until timeout):**
- `toBeVisible()`, `toBeHidden()`
- `toBeEnabled()`, `toBeDisabled()`
- `toBeChecked()`, `toBeEditable()`
- `toHaveText()`, `toContainText()`
- `toHaveValue()`, `toHaveValues()`
- `toHaveCount()`
- `toHaveAttribute()`, `toHaveClass()`, `toHaveId()`
- `toHaveURL()`, `toHaveTitle()`
- `toHaveScreenshot()` — visual regression
- `toBeOK()` — API response assertion

**Soft Assertions:**
- `expect.soft()` — records failure but continues test execution
- When to use soft assertions vs hard assertions
- Reviewing all soft assertion failures at the end of a test

**Wait Strategies:**
- Why auto-waiting works — Playwright retries assertions until they pass or timeout
- `waitForLoadState()` — `load`, `domcontentloaded`, `networkidle`
- `waitForURL()` — wait for navigation to a specific URL
- `waitForSelector()` — wait for an element to exist in DOM
- `waitForResponse()` — wait for a specific network response
- `waitForFunction()` — wait for a JavaScript expression to be truthy
- `page.waitForTimeout()` — exists but should never appear in production tests — understand why

**Test & Describe Structure:**
- `test.describe()` — grouping related tests
- `test.beforeAll()` — expensive setup once per describe block
- `test.afterAll()` — cleanup once per describe block
- `test.beforeEach()` — setup before every test
- `test.afterEach()` — cleanup after every test
- When to use `beforeAll` vs fixtures for shared state

**Warm-up:**
Go back to your Day 4 login test — count how many assertions it has. It probably has one or none. Add five meaningful assertions about the dashboard state after login.

**Core Practice on OrangeHRM:**
1. Write a test with at least 6 different assertion types on the dashboard after login
2. Search for a non-existent employee — assert `toContainText('No Records Found')` using `waitForResponse` before asserting
3. Create an employee — assert with `toHaveURL`, `toContainText` on success message, `toBeVisible` on the employee record
4. Use `expect.soft()` for three field validations in one test — introduce one failure — verify the test reports all three results
5. Write a describe block with `beforeEach` login and `afterEach` screenshot — add three tests inside it
6. Intentionally write an assertion that will timeout — read the error message — understand what it tells you

**Open Challenge:**
Write a test that uses `waitForResponse()` to intercept the employee search API call, then asserts both the API response status and the UI results match — two layers of assertion in one test.

**Commit:** Assertions and wait strategy practice file.

**Step-Up:** Yesterday was special contexts. Today you verify outcomes with precision and understand exactly how Playwright waits.

---

### Day 7 — TypeScript for Playwright

**Focus:** The TypeScript features that make your Playwright code maintainable. Not a full language course — only what you actually need.

**What to Study:**
- `interface` — defining the shape of test data objects
- `type` — aliases and union types
- `enum` — for environments, user roles, leave types, status values
- Generics — `T` in reusable utility functions like `readJson<T>()`
- `async/await` with proper return types — `Promise<void>`, `Promise<string>`
- Optional properties — `firstName?: string`
- Readonly properties — `readonly locator: Locator`
- `strict: true` in `tsconfig.json` — what it enforces and why
- Module imports and exports — named vs default
- `as const` — for constant objects
- Type assertions — when and how to use them safely

**Warm-up:**
Open your best test file from this week. Count every place `any` appears or where a type is implied but not declared. These are today's targets.

**Core Practice:**
1. Create `src/models/Employee.ts` — define the `Employee` interface with all fields typed correctly
2. Create `src/models/LeaveRequest.ts` — typed interface
3. Create `src/models/Candidate.ts` — typed interface
4. Create a `UserRole` enum — Admin, Employee, Manager
5. Create an `Environment` type — dev, staging, prod
6. Enable `strict: true` in `tsconfig.json` — fix every error that surfaces
7. Rewrite all Week 1 test files to use proper TypeScript types — zero `any`
8. Write a generic utility function `readJson<T>(filePath: string): T` — use it to read a JSON file

**Open Challenge:**
Write a `TestDataFactory` class that has static methods for generating typed test objects — `TestDataFactory.employee()` returns a fully typed `Employee`. All fields should have sensible defaults that can be overridden.

**Commit:** All Week 1 code converted to strict TypeScript with proper interfaces.

**Step-Up:** Yesterday was assertions. Today your code is type-safe — every method, every data object, every return value has a declared type.

---

## Week 2 — Page Object Model & Framework Foundation

**Goal:** Transform raw typed test code into a clean, structured, maintainable framework. Every piece built this week stays in the framework for the rest of the program.

---

### Day 8 — Why POM & BasePage

**Focus:** Feel the pain of unstructured code first. Then understand exactly what POM solves. Build the foundation everything extends.

**What to Study:**
- The problem POM solves — duplicated locators, duplicated actions, unreadable tests
- POM rules: locators in page classes, methods represent user actions, no assertions inside page objects, no test logic in page objects
- `BasePage` — the class all page objects extend
- Common base methods — `navigate()`, `waitForNetworkIdle()`, `isVisible()`, `getText()`
- `readonly` locators as class properties — why readonly
- Constructor pattern — `readonly page: Page`
- Returning values from page methods so tests can assert them
- Method naming — name what the user does, not what the code does

**Warm-up:**
Open your Day 3, 4, and 5 test files. Find every duplicated locator — the same element defined in multiple files. Count them. That number is the cost of not having POM.

**Core Practice:**
1. Create `src/pages/BasePage.ts` — constructor accepts `Page`, stores it as `readonly`
2. Add to BasePage: `navigate(url: string)`, `waitForNetworkIdle()`, `getTitle()`, `isElementVisible(locator: Locator)`, `waitForElement(locator: Locator)`
3. Create `src/pages/LoginPage.ts` extending BasePage — all locators as `readonly` properties
4. Add to LoginPage: `goto()`, `login(username: string, password: string)`, `isLoggedIn(): Promise<boolean>`, `getErrorMessage(): Promise<string>`
5. Rewrite your login tests from Week 1 to use only LoginPage — zero raw locators in the test file
6. The test should read like plain English: `await loginPage.goto()`, `await loginPage.login(user, pass)`, `expect(await loginPage.isLoggedIn()).toBeTruthy()`

**Open Challenge:**
Write a test that verifies the error message for five different invalid login combinations — driven by a data array — using only the LoginPage class. The test file must contain no locators.

**Commit:** BasePage and LoginPage — all login tests rewritten.

**Step-Up:** Yesterday was TypeScript. Today raw locators disappear from test files.

---

### Day 9 — Feature Page Objects

**Focus:** Build page objects for every OrangeHRM module. Practice designing methods that are user actions, not code descriptions.

**What to Study:**
- One class per page or major component — not one class per module
- Method naming: `createEmployee()` not `fillFormAndClickSave()`
- Handling page transitions — when a method navigates, document it
- Returning meaningful values — employee ID after creation, status text, count
- Page objects that depend on each other — NavigationPage as a dependency
- Avoiding assertion logic inside page objects — return values, let tests assert

**Warm-up:**
Read LoginPage from Day 8. Apply its structure as a template for every page object you build today.

**Core Practice:**
1. Create `src/pages/NavigationPage.ts` — all sidebar and top nav interactions — `goToEmployeeList()`, `goToAddEmployee()`, `goToLeaveList()`, `goToApplyLeave()`, `goToRecruitment()`
2. Create `src/pages/EmployeePage.ts` — `createEmployee(employee: Employee): Promise<string>` returns employee ID, `searchByName(name: string)`, `searchById(id: string)`, `openEmployee(name: string)`, `deleteEmployee(name: string)`, `getEmployeeCount(): Promise<number>`
3. Create `src/pages/LeavePage.ts` — `applyLeave(request: LeaveRequest)`, `approveLeave(employeeName: string)`, `rejectLeave(employeeName: string, reason: string)`, `getLeaveStatus(employeeName: string): Promise<string>`, `getLeaveBalance(type: string): Promise<number>`
4. Rewrite all employee and leave tests from Week 1 using page objects — no raw locators in any test file
5. Every test file must read like a business scenario, not technical code

**Open Challenge:**
Write a test that creates an employee, applies leave for them, and verifies the leave balance decreased. It should use three page objects working together. The test reads in 10 lines of plain business logic.

**Commit:** NavigationPage, EmployeePage, LeavePage — all tests rewritten.

**Step-Up:** Yesterday was BasePage and Login. Today every OrangeHRM module has a page object.

---

### Day 10 — Data Models & Test Data Design

**Focus:** Design the data contracts the entire framework is built on. Done wrong now, every page object and test inherits the problem.

**What to Study:**
- Interfaces as contracts — everyone on a team agrees on the shape
- Required vs optional fields — not every test needs every field
- Nested interfaces — `Employee` containing `Address`, `ContactDetails`
- Builder pattern — creating test objects with `build()` method
- `@faker-js/faker` — generating realistic, unique test data
- Seeded Faker — `faker.seed(123)` for reproducible data when needed
- Where models live — `src/models/` — and why separate from pages
- Why hardcoded test data causes test collision — two tests creating "John Doe" will conflict

**Warm-up:**
Open your `Employee` interface from Day 7. How many fields are missing? Check the actual OrangeHRM Add Employee form and add every missing field.

**Core Practice:**
1. Install `@faker-js/faker`
2. Refine all three models from Day 7 — `Employee`, `LeaveRequest`, `Candidate` — add every field the real forms require
3. Create `src/data/EmployeeBuilder.ts` — builds a complete `Employee` with Faker-generated defaults, has override methods `withFirstName(name)`, `withLastName(name)`, `withEmployeeId(id)`, returns `this` for chaining, has `build()` method
4. Create `src/data/LeaveRequestBuilder.ts` with the same pattern
5. Create `src/data/CandidateBuilder.ts`
6. Replace every hardcoded test data value in your tests with builder-generated data
7. Run your tests 3 times — verify each run uses different names and no collisions occur

**Open Challenge:**
Write a `DataFactory` class with static methods — `DataFactory.newEmployee()`, `DataFactory.newLeaveRequest()`, `DataFactory.newCandidate()`. Each returns a fully built object. All tests should use this factory going forward.

**Commit:** Refined models, Builder classes, DataFactory, all tests using dynamic data.

**Step-Up:** Yesterday was page objects. Today every test creates its own unique data — no more hardcoded names.

---

### Day 11 — Playwright Fixtures & Dependency Injection

**Focus:** Stop repeating `beforeEach` login setup. Fixtures are the clean, composable way to share state.

**What to Study:**
- What fixtures are — setup and teardown wrapped in a function
- Built-in fixtures: `page`, `context`, `browser`, `request`, `browserName`
- `test.extend<T>()` — creating custom fixtures
- The `use` callback — providing the fixture value to the test
- Test scope vs Worker scope — when state resets
- Fixtures composing other fixtures — `authenticatedPage` depends on `page`
- Auto-use fixtures — run without being declared in test arguments
- Fixture vs `beforeEach` — fixtures are composable, `beforeEach` is not

**Warm-up:**
Count how many test files have a `beforeEach` that logs in. That number is how many places you need to update if the login flow ever changes. Fixtures fix this.

**Core Practice:**
1. Create `src/fixtures/base.ts` — define the custom fixture types
2. Create `authenticatedPage` fixture — logs in before test, provides authenticated page
3. Create `loginPage`, `employeePage`, `leavePage` fixtures — each provides a pre-instantiated, properly typed page object
4. Create `testEmployee` fixture — creates an employee via UI before the test, yields the employee data, deletes the employee after the test
5. Rewrite 5 existing tests to use fixtures — compare before and after — the tests should become 30% shorter
6. Create a worker-scoped fixture for something expensive that should be shared across all tests in a file

**Open Challenge:**
Compose fixtures — write a `leaveApplicationFixture` that depends on `authenticatedPage` and `testEmployee` — it creates the employee, then yields everything the test needs. The test body becomes just the action and assertion.

**Commit:** Fixtures file, all tests updated to use fixtures.

**Step-Up:** Yesterday was data. Today test setup is composable and reusable.

---

### Day 12 — Framework Architecture & Project Structure

**Focus:** Before writing more tests, establish the structure that holds the entire framework. Everything built from here goes into the right place.

**What to Study:**
- Why structure matters — a new team member should navigate without asking questions
- Complete folder layout for a production framework
- TypeScript path aliases — `@pages/*`, `@utils/*`, `@fixtures/*` — no `../../..` imports
- ESLint for Playwright — `eslint-plugin-playwright`
- Prettier — consistent formatting across the team
- npm scripts — `test:smoke`, `test:regression`, `test:chrome`, `test:ci`
- `README.md` — any engineer must be able to run tests in under 5 minutes
- `CONTRIBUTING.md` — how new team members write tests in this framework

**Warm-up:**
Look at your current folder structure. How many files are in the wrong place? How many imports use `../../`? Today you fix all of it.

**Core Practice:**

Establish this structure — move every existing file to its correct location:
```
playwright-framework/
├── src/
│   ├── pages/          ← page objects only
│   ├── api/            ← API client classes
│   ├── fixtures/       ← custom fixtures
│   ├── utils/          ← helper utilities
│   ├── data/           ← builders and factories
│   ├── models/         ← TypeScript interfaces
│   └── config/         ← environment and constants
├── tests/
│   ├── orangehrm/
│   │   ├── employee/
│   │   ├── leave/
│   │   └── recruitment/
│   ├── suitecrm/
│   └── assetexplorer/
├── test-data/          ← JSON, CSV files
├── .auth/              ← storageState files (gitignored)
├── .github/workflows/
├── .env
├── .env.example
├── .gitignore
├── playwright.config.ts
├── tsconfig.json
├── .eslintrc.json
├── .prettierrc
├── README.md
└── CONTRIBUTING.md
```

1. Set up TypeScript path aliases in `tsconfig.json` and `playwright.config.ts`
2. Update all imports to use aliases — zero relative path climbing
3. Install and configure ESLint with `eslint-plugin-playwright`
4. Install and configure Prettier with `.prettierrc`
5. Add `lint`, `format`, `type-check` scripts to `package.json`
6. Write `README.md` — setup steps, how to run, project structure explanation
7. Write `CONTRIBUTING.md` — naming conventions, where files go, PR process

**Open Challenge:**
Add a `pre-commit` check using `npm scripts` — running `type-check` and `lint` together. Document in `CONTRIBUTING.md` that this must pass before any commit.

**Commit:** Complete restructured project with aliases, lint, format, README, CONTRIBUTING.

**Step-Up:** Yesterday was fixtures. Today the framework has a home for everything — any team member can navigate it.

---

### Day 13 — Playwright Config Mastery & Multi-Environment

**Focus:** One config that handles every environment, browser, and scenario cleanly.

**What to Study:**
- `playwright.config.ts` in full depth — every option and what it does
- `use` block — global defaults vs project overrides
- Defining multiple projects — browsers, environments, mobile devices
- `baseURL` — every project should have one so tests use relative paths
- `storageState` at project level — pre-authenticated contexts
- `retries` — `0` locally, `2` in CI — using `process.env.CI`
- `workers` — parallel execution count
- `timeout` and `expect.timeout` — action timeout vs assertion timeout
- `testDir`, `testMatch`, `testIgnore` — controlling what runs per project
- Device emulation — `devices['Pixel 5']`, `devices['iPhone 13']`
- Configuring multiple reporters simultaneously

**Warm-up:**
Open your current `playwright.config.ts`. How many of the available options are you using? List every option you don't understand and look each one up.

**Core Practice:**
1. Define three browser projects: `chromium`, `firefox`, `webkit`
2. Define an `orangehrm` project with `baseURL` from `.env`, proper `storageState` path, `retries: process.env.CI ? 2 : 0`
3. Define a `mobile` project using `devices['Pixel 5']`
4. Configure three reporters simultaneously: `html`, `json`, `list`
5. Set `fullyParallel: true` and `workers: process.env.CI ? 4 : 2`
6. Add `globalSetup` and `globalTeardown` paths — even if empty files for now
7. Run `npx playwright test --project=chromium` and `--project=firefox` — both should pass

**Open Challenge:**
Add a `smoke` project that runs only tests tagged `@smoke` across all three browsers using `testMatch` or `grep`. Running `npx playwright test --project=smoke` should execute only smoke-tagged tests.

**Commit:** Complete multi-project playwright.config.ts.

**Step-Up:** Yesterday was structure. Today the framework runs any combination of browser, environment, and test subset.

---

### Day 14 — Authentication State & Session Management

**Focus:** Stop logging in on every test. Save auth state once, reuse it everywhere. The technique that cuts suite time by 30–50%.

**What to Study:**
- `storageState` — captures cookies, localStorage, sessionStorage
- `context.storageState({ path })` — saving state after login
- `globalSetup` — code that runs once before all tests start
- `globalTeardown` — code that runs once after all tests finish
- Using `storageState` in config so all tests in a project start pre-authenticated
- Per-role storage states — `admin.json`, `manager.json`, `employee.json`
- When storage state expires and how to handle it
- Tests that must test login — how to exclude them from storageState
- The `.auth/` folder — gitignored, generated fresh each run

**Warm-up:**
Time your current test suite from start to finish. Note the number. Today's work will reduce it.

**Core Practice:**
1. Create `globalSetup.ts` — instantiate a browser, log in as Admin, save storageState to `.auth/admin.json`, close the browser
2. Reference `globalSetup` in `playwright.config.ts`
3. Set `storageState: '.auth/admin.json'` on the `orangehrm` project
4. Run the full suite — verify no test performs a login anymore
5. Create a second globalSetup for an employee-role account — save to `.auth/employee.json`
6. Create an `orangehrm-employee` project using the employee storageState
7. Write one test specifically for the login page that has `storageState: undefined` to override the project setting
8. Time your suite again — document the improvement

**Open Challenge:**
Add storageState expiry detection to `globalSetup` — check if `.auth/admin.json` is older than 1 hour, and if so re-authenticate. This prevents CI failures when auth tokens expire.

**Commit:** globalSetup with per-role auth, config updated, all auth tests documented.

**Step-Up:** Yesterday was config. Today the suite runs significantly faster and no test repeats login setup.

---

## Week 3 — Data, API & Reporting

**Goal:** Tests that drive from files, tests that work at the API layer, and professional reporting visible to the whole team.

---

### Day 15 — Debugging: Inspector, Trace Viewer & UI Mode

**Focus:** A professional does not guess why tests fail. Before adding more features, master every debugging tool — you will need them for everything from here forward.

**What to Study:**
- `--ui` mode — time-travel debugging, replay actions, inspect DOM at each step
- `--debug` flag — opens Playwright Inspector alongside the browser
- `PWDEBUG=1` — environment variable for Inspector
- Playwright Inspector — stepping through test execution line by line
- VS Code Playwright extension — breakpoints, run/debug from editor
- `--trace on` — captures full trace for every test
- `--trace retain-on-failure` — only captures traces when tests fail (use in CI)
- Trace Viewer — screenshots, DOM snapshots, network requests, console at every step
- `page.pause()` — pause mid-test to inspect live browser state
- `--headed --slowmo=1000` — slow execution to observe it
- `page.on('console', msg => ...)` — capture browser console messages
- `page.on('request', req => ...)` and `page.on('response', res => ...)` — observe network

**Warm-up:**
Intentionally break one of your existing tests by changing a locator slightly. Then fix it using only the Trace Viewer — no looking at the code until you know the cause.

**Core Practice:**
1. Run `npx playwright test --ui` — use time-travel to step through your most complex test
2. Run `npx playwright test --debug` — step through the employee creation test line by line
3. Run with `--trace on` — open the resulting trace — navigate all panels: actions, network, console, DOM snapshots
4. Add `page.pause()` inside the leave application test — run it, inspect live browser state at that point, resume
5. Add a console listener to any test — log every browser console message during execution
6. Add a network listener — log every API request made during the employee creation flow
7. Run with `--trace retain-on-failure` — this is the CI configuration — understand why

**Open Challenge:**
Take the most intermittently failing test in your suite. Run it 10 times with `--trace retain-on-failure`. Analyse the trace from a failed run. Document exactly what caused the failure and fix it.

**Commit:** Debugging notes, fixed tests, trace configuration added to CI config.

**Step-Up:** Yesterday was auth state. Today you can diagnose any failure without guessing.

---

### Day 16 — Data-Driven Testing

**Focus:** One test function covering many scenarios. Drive tests from external files.

**What to Study:**
- `test.each()` — parameterised tests in Playwright
- Naming data-driven tests — include the scenario name in the test title
- Reading JSON files — `fs.readFileSync` + `JSON.parse` with generic type
- Reading CSV files — `csv-parse/sync` library
- When to use JSON vs CSV — structured objects vs tabular data
- Test data organisation — `test-data/` folder, one file per feature
- Testing both valid and invalid scenarios — positive and negative in same data file
- Data isolation — each row creates unique data, does not depend on another row

**Warm-up:**
Open your `DataFactory` from Day 10. Add a method that returns an array of 5 different employee objects with varied data. This is your first data set.

**Core Practice:**
1. Install `csv-parse`
2. Create `test-data/employees.json` — 5 valid employee records with varied data
3. Create `test-data/invalid-employees.json` — 3 records with missing required fields
4. Write a `test.each()` test that creates each valid employee — test names must include the employee name
5. Write a `test.each()` test that attempts each invalid record and asserts the correct validation error
6. Create `test-data/leave-requests.csv` — 6 leave scenarios including a past date that should fail
7. Create `src/utils/CsvReader.ts` — generic typed CSV reader utility
8. Write a `test.each()` leave test driven by the CSV file

**Open Challenge:**
Write a data-driven test that reads from both a JSON and a CSV file, combines the data, and generates a test for every combination. Understand when combinatorial testing is valuable and when it becomes noise.

**Commit:** CsvReader utility, test data files, data-driven tests.

**Step-Up:** Yesterday was debugging. Today one test covers multiple scenarios automatically.

---

### Day 17 — API Testing with Playwright

**Focus:** Test the API layer directly. Playwright has a built-in API testing context — no extra tools needed.

**What to Study:**
- `request` fixture — built-in `APIRequestContext`
- `request.get()`, `request.post()`, `request.put()`, `request.patch()`, `request.delete()`
- `response.ok()`, `response.status()`, `response.json()`, `response.text()`
- `expect(response).toBeOK()` — API-level assertion
- Request headers — Authorization, Content-Type, Accept
- Request body — JSON payloads with typed interfaces
- JSON Schema validation — verifying response structure matches expected shape
- `APIRequestContext` in `globalSetup` — creating data before the suite starts
- Building a reusable `ApiClient` class — typed methods, proper error handling

**Warm-up:**
Open OrangeHRM in the browser. Open DevTools Network tab. Log in and navigate. Look at the API calls made — URL patterns, request headers, response shapes. These are what you will test today.

**Core Practice:**
1. Create `src/api/ApiClient.ts` — constructor accepts `APIRequestContext`, stores it
2. Implement `authenticate(username, password): Promise<string>` — returns token
3. Implement typed methods: `getEmployees()`, `createEmployee(data: Employee)`, `getEmployee(id: string)`, `updateEmployee(id: string, data: Partial<Employee>)`, `deleteEmployee(id: string)`
4. Write a test that authenticates, creates an employee via API, asserts response is 200 and body matches input
5. Write a test that fetches a list of employees and asserts the count is greater than zero
6. Write a test that attempts to create an employee with missing required fields and asserts the 400 response with correct error message
7. Create an `api` fixture that provides a pre-authenticated `ApiClient` instance

**Open Challenge:**
Write a test that creates 5 employees via API in parallel using `Promise.all()` — then queries the list and asserts all 5 appear. Clean them up via API after. Measure the time vs creating them sequentially.

**Commit:** ApiClient, api fixture, API test suite.

**Step-Up:** Yesterday was data-driven UI tests. Today you test the API layer directly.

---

### Day 18 — Hybrid UI + API Testing

**Focus:** The most powerful testing technique — API for setup, UI for verification, and vice versa.

**What to Study:**
- Why hybrid tests are superior — API setup is 10x faster than UI setup
- The pattern: create data via API → test behaviour in UI → verify via API
- Bypassing UI login — get token via API, inject as cookie/storage, land directly on dashboard
- Data consistency validation — create in UI, verify via API response matches
- API cleanup — deleting test data after UI tests without needing to navigate
- Measuring performance impact — how much faster is API setup vs UI setup

**Warm-up:**
Take your most complex UI test — the one with the most beforeEach setup. Count how many UI interactions are setup vs actual test. That ratio is what hybrid testing improves.

**Core Practice:**
1. Write a test: create employee via API → login UI using storageState → search for employee in UI → assert all fields match what the API created
2. Write a test: apply leave in UI → call leave API to get the record → assert API response matches UI data exactly
3. Write a test: update employee in UI → fetch employee via API → assert API response reflects the UI change
4. Rewrite your `testEmployee` fixture from Day 11 — create via API instead of UI — verify it is 5x faster
5. Write a `cleanup` utility that deletes all test-created employees via API — run it in `afterAll`
6. Measure: 10 tests with UI-only setup vs same 10 with API setup — document the time

**Open Challenge:**
Write a complete test that bypasses the login page entirely — get the auth token via API, set it as a cookie on the browser context, navigate directly to the employee list, and perform a UI action. Zero visits to the login page.

**Commit:** Hybrid test suite, updated testEmployee fixture, cleanup utility, performance measurements.

**Step-Up:** Yesterday was API testing. Today UI and API work together for speed and reliability.

---

### Day 19 — Network Interception & API Mocking

**Focus:** Control what the application receives from the server. Test error states, slow responses, and third-party failures without needing those conditions to exist.

**What to Study:**
- `page.route(url, handler)` — intercept matching requests
- `route.fulfill({ status, body, headers })` — return a custom response
- `route.abort()` — simulate network failure
- `route.continue()` — let request through, optionally modified
- `route.continue({ headers })` — modify request headers in flight
- Mocking with JSON — `route.fulfill({ json: { ... } })`
- Simulating error states — 500, 401, 404, 503 responses
- Simulating slow responses — fulfill with a delay
- `page.routeFromHAR(harFile)` — replay recorded network traffic
- Glob patterns for route matching — `**/api/employees**`
- When to mock vs when to use real API — the trade-offs

**Warm-up:**
Think of 3 error states in OrangeHRM that are hard to trigger naturally — server error on save, session timeout, network failure during search. These are what mocking makes testable.

**Core Practice:**
1. Intercept the employee list API — return exactly 2 mocked employees — assert the UI shows exactly 2 rows
2. Mock a 401 on the employee endpoint — assert the UI redirects to login
3. Mock a 500 on the create employee endpoint — assert the UI shows an error notification
4. Mock a network abort on any request — assert the UI handles it gracefully
5. Add a 3-second delay to the employee search response — assert a loading indicator appears
6. Record a real session using `--save-har=session.har` — replay it using `routeFromHAR` — run tests without hitting the real server

**Open Challenge:**
Write a test that intercepts an API call, modifies the response by adding extra fields to the JSON, and asserts the UI handles unexpected extra data gracefully without breaking.

**Commit:** Network interception and mocking test suite.

**Step-Up:** Yesterday was hybrid testing. Today you control the network layer and can test any scenario.

---

### Day 20 — Mid-Program Checkpoint

**Focus:** No new topics. Consolidate everything from Days 1–19 before the second half.

**This day is a gate. Do not proceed until every item below is true.**

**Framework Checklist:**
- [ ] All page objects exist for OrangeHRM — Login, Employee, Leave, Navigation
- [ ] BasePage with common methods
- [ ] TypeScript strict mode — zero `any` types
- [ ] DataFactory with Builder classes
- [ ] Fixtures for auth, page objects, and test data
- [ ] Framework folder structure with path aliases
- [ ] `playwright.config.ts` with multi-project setup
- [ ] StorageState via globalSetup — login is not repeated in any test
- [ ] Data-driven tests with JSON and CSV
- [ ] ApiClient with typed methods
- [ ] At least 3 hybrid UI + API tests
- [ ] At least 2 network mocking tests

**CI/CD Checklist:**
- [ ] GitHub repository with proper `.gitignore`
- [ ] All tests passing locally
- [ ] At least basic GitHub Actions workflow running

**Practice Tasks:**
1. Run your full suite — every test must pass 3 consecutive times
2. Fix every failing or intermittent test before continuing
3. Review every file for TypeScript errors — `npx tsc --noEmit`
4. Run ESLint — `npm run lint` — fix all errors
5. Review your folder structure — everything in its correct location
6. Update `README.md` to reflect the current state of the project

**If anything above is incomplete — spend today finishing it. The second half of the program builds on this foundation.**

---

### Day 21 — Built-in Reporting & Report Portal

**Focus:** Professional reporting visible to the whole team. Playwright's built-in reporters for local use. Report Portal for centralised, historical, team-wide visibility.

**What to Study:**

**Playwright Built-in Reporters:**
- `html` — interactive local report, fully navigable
- `list` — real-time console output during execution
- `dot` — minimal CI-friendly output
- `json` — machine-readable results for integrations
- `junit` — XML format for Jenkins and other CI tools
- `line` — one line per test result
- Configuring multiple reporters simultaneously in `playwright.config.ts`
- `--reporter` CLI flag to override config per run

**Report Portal:**
- What Report Portal is — centralised test execution dashboard for teams
- Why Report Portal over Allure — team visibility, historical trends, launch analytics, integrations
- `@reportportal/agent-js-playwright` — the official Playwright integration
- Setting up Report Portal locally with Docker
- `rp.config.js` — endpoint, project, launch name, API key
- Launches, test items, logs — Report Portal's data model
- Attaching screenshots to failed test items in Report Portal
- Filtering, analysing, and comparing launches

**Warm-up:**
Run your suite and open the HTML report. How much useful information does it give you? Now think about a team of 5 people running tests daily — the HTML report is per-run, local, temporary. Report Portal solves this.

**Core Practice:**
1. Configure `html`, `json`, `list`, and `junit` reporters simultaneously — run the suite — open each output
2. Pull Report Portal Docker image: `docker pull reportportal/reportportal`
3. Start Report Portal: `docker-compose up -d` using the official compose file
4. Access Report Portal at `http://localhost:8080` — create a project called `playwright-practice`
5. Install `@reportportal/agent-js-playwright`
6. Create `rp.config.js` pointing to your local instance with your project and API key
7. Add Report Portal as a reporter in `playwright.config.ts`
8. Run your suite — view the launch in Report Portal — explore test items, logs, and statistics
9. Configure failed tests to attach screenshots to their Report Portal items

**Open Challenge:**
Run your suite 3 times. View the three launches in Report Portal side by side. Filter by failed tests across all launches. Understand what "flaky" looks like in Report Portal's view — a test that passes in some launches and fails in others.

**Commit:** Reporter configuration, Report Portal docker-compose file, rp.config.js.

**Step-Up:** Yesterday was mid-program consolidation. Today test results are visible to the whole team in one centralised place.

---

## Week 4 — CI/CD, Parallelism & Specialised Testing

**Goal:** Automated pipelines that run on every push, tests that run fast with parallelism, and specialised testing techniques.

---

### Day 22 — GitHub Actions CI/CD Pipeline

**Focus:** Build a pipeline that runs tests automatically on every code change.

**What to Study:**
- GitHub Actions fundamentals — workflows, jobs, steps, runners
- `on:` triggers — `push`, `pull_request`, `schedule`, `workflow_dispatch`
- `actions/checkout`, `actions/setup-node`, `actions/upload-artifact`
- `npx playwright install --with-deps` — installing browsers in CI
- Environment secrets — `${{ secrets.VARIABLE_NAME }}`
- `if: always()` — upload reports even when tests fail
- Matrix strategy — running across multiple browsers in parallel
- Caching `node_modules` with `actions/cache` for speed
- `continue-on-error` — not blocking pipeline on known flaky tests
- Artifact retention — keeping reports accessible after pipeline completes

**Warm-up:**
Look at your current GitHub repo. What happens when someone pushes code right now? Nothing automated. Today that changes.

**Core Practice:**
1. Create `.github/workflows/playwright.yml`
2. Trigger on push to `main` and on pull requests to `main`
3. Set up Node.js, cache `node_modules`, install dependencies, install Playwright browsers
4. Run the full test suite with `--reporter=junit,html`
5. Upload HTML report as an artifact — retained for 30 days — `if: always()`
6. Upload `test-results/` including traces — `if: always()`
7. Add matrix strategy for chromium, firefox, webkit running in parallel
8. Add OrangeHRM credentials as GitHub repository secrets — use them in the workflow
9. Push and watch the pipeline run — fix any CI-specific issues

**Open Challenge:**
Add a scheduled run to your pipeline — `cron: '0 6 * * 1-5'` — runs your smoke tests Monday to Friday at 6am. Add a Slack or email notification on failure.

**Commit:** `.github/workflows/playwright.yml` — pipeline passing.

**Step-Up:** Yesterday was reporting. Today tests run automatically on every code push.

---

### Day 23 — Docker & Containerisation

**Focus:** Run tests in identical environments everywhere. Docker eliminates environment-specific failures.

**What to Study:**
- Why Docker for testing — reproducible, consistent environments
- Official Playwright Docker image — `mcr.microsoft.com/playwright`
- Writing a `Dockerfile` for a Playwright project
- `COPY`, `RUN`, `CMD`, `ENV`, `WORKDIR` — Dockerfile instructions
- Volume mounts — accessing test results outside the container
- Environment variables in Docker — `-e` flag and `--env-file`
- `docker-compose.yml` — orchestrating containers
- Multi-stage builds — keeping image size small
- Running Docker inside GitHub Actions — replacing the runner's OS

**Warm-up:**
Pull the official image: `docker pull mcr.microsoft.com/playwright`. Run a container from it and confirm Playwright is installed inside.

**Core Practice:**
1. Write a `Dockerfile` — base from `mcr.microsoft.com/playwright`, copy project, install npm deps, set entry point to run tests
2. Build: `docker build -t playwright-tests .`
3. Run: `docker run --rm -v $(pwd)/test-results:/app/test-results playwright-tests`
4. Verify `test-results/` is populated after the run with reports and traces
5. Create `docker-compose.yml` — defines the test service with env vars from `.env`
6. Run with: `docker-compose run --rm tests`
7. Update GitHub Actions to optionally run via Docker instead of directly on the runner

**Open Challenge:**
Add a `docker-compose.yml` that spins up both a local OrangeHRM instance (if a Docker image exists) and your test container — tests run against a containerised application with zero external dependencies.

**Commit:** `Dockerfile`, `docker-compose.yml`, updated GitHub Actions.

**Step-Up:** Yesterday was GitHub Actions. Today tests run identically in any environment.

---

### Day 24 — Parallel Execution & Sharding

**Focus:** Make the suite fast. Parallelism and sharding cut execution time from 30 minutes to under 5 minutes.

**What to Study:**
- `workers` — parallel test file execution
- `fullyParallel: true` — parallelise within test files too
- Test isolation requirements — why parallel tests must be independent
- `--shard=1/4` — splitting tests across machines
- `--grep` and `--grep-invert` — running test subsets
- Test tagging — `@smoke`, `@regression`, `@critical`, `@slow`
- `test.describe.parallel()` — forcing parallel within a describe block
- `test.describe.serial()` — forcing serial when tests must be ordered
- Merging shard reports — `npx playwright merge-reports`
- Diagnosing parallel failures — shared state, race conditions

**Warm-up:**
Time your suite with `workers: 1`. This is your baseline. Every step today improves on it.

**Core Practice:**
1. Tag every test — at minimum `@smoke` for critical path, `@regression` for everything else
2. Run only smoke tests: `npx playwright test --grep @smoke` — verify the right tests run
3. Set `workers: 4` — run the suite — identify any tests that fail due to shared state — fix them
4. Set `fullyParallel: true` — re-run — measure improvement
5. Split into 4 shards: run `--shard=1/4`, `--shard=2/4`, `--shard=3/4`, `--shard=4/4` separately
6. Merge shard results: `npx playwright merge-reports ./all-blob-reports --reporter html`
7. Update GitHub Actions to run 4 shards in 4 parallel jobs — merge results in a final job

**Open Challenge:**
Identify your three slowest tests using the HTML report timing data. Investigate why each is slow. Fix at least two of them — either by using API setup instead of UI setup, or by parallelising within the test.

**Commit:** Tagged tests, sharding configuration, updated pipeline with parallel shards.

**Step-Up:** Yesterday was Docker. Today the suite runs in a fraction of the previous time.

---

### Day 25 — Jenkins & Azure DevOps

**Focus:** Enterprise teams use Jenkins and Azure DevOps. Know how to deliver into both.

**What to Study:**

**Jenkins:**
- `Jenkinsfile` — declarative pipeline syntax
- `pipeline` → `stages` → `stage` → `steps` structure
- `nodejs` tool configuration in Jenkins
- `junit` step — publishing test results from XML
- `publishHTML` step — archiving the HTML report
- Jenkins credentials store — secrets without hardcoding
- Parameterised builds — running specific tags from the Jenkins UI
- `catchError` and `post { always { } }` blocks

**Azure DevOps:**
- `azure-pipelines.yml` — YAML pipeline
- `NodeTool@0` task — Node.js setup
- `PublishTestResults@2` — publishing JUnit XML
- `PublishPipelineArtifact@1` — saving HTML reports
- Variable groups — team-shared secrets
- Pipeline triggers and PR validation gates

**Warm-up:**
Read your GitHub Actions workflow. Understand its structure. A Jenkinsfile and Azure pipeline YAML do the same job — just different syntax. Keep that in mind.

**Core Practice:**
1. Create `Jenkinsfile` with stages: Checkout, Install, Test, Report
2. Configure it to use `junit` for test results and `publishHTML` for the report
3. Add `post { always { junit 'test-results/junit.xml' } }` block
4. Create `azure-pipelines.yml` with equivalent stages
5. Configure Azure pipeline to publish JUnit results and HTML artifact
6. Add parameterised build to Jenkinsfile — a `TAGS` parameter that passes to `--grep`
7. If you have access to a Jenkins or Azure DevOps instance — connect and run

**Open Challenge:**
Configure both pipelines to run only `@smoke` tests on PRs but the full `@regression` suite on merges to main. This saves CI time on every pull request.

**Commit:** `Jenkinsfile`, `azure-pipelines.yml`.

**Step-Up:** Yesterday was sharding. Today you can deliver into any enterprise CI system.

---

### Day 26 — Visual Regression & Accessibility Testing

**Focus:** Two categories that catch what functional tests miss — visual changes and accessibility violations.

**What to Study:**

**Visual Regression — Built-in:**
- `expect(page).toHaveScreenshot('name.png')` — full page comparison
- `expect(locator).toHaveScreenshot('name.png')` — component comparison
- `--update-snapshots` — updating baselines when changes are intentional
- `maxDiffPixels` and `maxDiffPixelRatio` — tolerance options
- `mask: [locator]` — hiding dynamic areas from comparison
- `animations: 'disabled'` — preventing animation differences
- Committing baseline images — they must be in version control for CI

**Accessibility:**
- `@axe-core/playwright` — WCAG-based accessibility auditing
- `checkA11y(page)` — full page audit
- WCAG violation levels — critical, serious, moderate, minor
- `disableRules` — excluding known false positives
- Targeting specific components — `checkA11y(locator)`
- Integrating accessibility results into Report Portal

**Warm-up:**
Visit OrangeHRM login page in a browser. Without any tools, identify 3 elements that might have accessibility issues — missing labels, low contrast, no keyboard focus. Write them down. Today you will confirm them programmatically.

**Core Practice:**
1. Write a screenshot test for the login page — run it — commit the baseline image
2. Write a screenshot test for the employee list — mask the employee names (dynamic content)
3. Intentionally change a CSS property — run screenshot tests — observe the diff report
4. Update the baseline: `--update-snapshots` — understand what this means for CI
5. Install `@axe-core/playwright`
6. Run an accessibility audit on the login page — read every violation
7. Run an audit on the dashboard and employee form
8. Write a test that fails if any `critical` accessibility violations are introduced

**Open Challenge:**
Run your visual tests across three viewport sizes — desktop, tablet, mobile. Write a separate baseline for each. This creates a responsive design regression test suite.

**Commit:** Visual baseline images (committed), accessibility tests, viewport configurations.

**Step-Up:** Yesterday was enterprise CI. Today you catch visual regressions and accessibility violations automatically.

---

### Day 27 — `page.evaluate()` & Browser Context Mastery

**Focus:** Execute JavaScript directly in the browser for things the normal Playwright API cannot reach.

**What to Study:**
- `page.evaluate(fn, arg)` — run a function in the browser context, returns serialisable value
- `page.evaluateHandle(fn, arg)` — run in browser, returns a JSHandle for further use
- `locator.evaluate(fn)` — run JS on a specific element
- `locator.evaluateAll(fn)` — run JS on all matching elements, returns array
- Passing arguments into `evaluate()` — serialisable types only
- Getting computed CSS styles — `window.getComputedStyle(el).getPropertyValue('color')`
- Reading from complex JavaScript objects not in the DOM
- `page.exposeFunction(name, fn)` — expose a Node.js function to the browser
- `page.addInitScript(fn)` — inject a script before every page load
- Manipulating `localStorage` and `sessionStorage` via evaluate
- Reading canvas element data
- Use cases: SPA internal state, JS-driven components, bypassing DOM limitations

**Warm-up:**
Think of three things you want to verify in OrangeHRM that are not visible in the DOM — internal state, computed styles, localStorage values. These are today's targets.

**Core Practice:**
1. Use `page.evaluate()` to read `window.location.href` — assert it matches `page.url()`
2. Use `locator.evaluate()` to get the computed font-size of the page heading
3. Use `page.evaluate()` to set a value in `localStorage` before a test runs — verify it persists
4. Use `page.evaluate()` to call a function defined on the page's `window` object
5. Use `page.evaluateHandle()` to get a JSHandle to a complex DOM node — read its properties
6. Use `page.addInitScript()` to inject a mock object before every page load — verify the mock is available

**Open Challenge:**
Use `page.evaluate()` to read the entire application state from a JavaScript framework (React state, Vue data, Angular scope) if the application exposes it. Extract data that is not rendered in the DOM and use it in an assertion.

**Commit:** page.evaluate practice tests.

**Step-Up:** Yesterday was visual and accessibility. Today you can reach anything inside the browser.

---

## Week 5 — AI-Native Testing

**Goal:** Integrate AI into every part of the workflow. Use Playwright's AI capabilities. Accelerate test writing. Build self-healing. Test AI-powered applications.

> **Prerequisite Gate:** Before starting Week 5, your OrangeHRM framework must be complete, all tests passing, and the CI/CD pipeline green. If not — go back and finish it. AI tools on a broken foundation produce broken tests faster.

---

### Day 28 — Playwright AI Locators & Accessibility Intelligence

**Focus:** Playwright's intelligence layer. How it uses the accessibility tree and what that means for locator strategy.

**What to Study:**
- `page.accessibility.snapshot()` — the full accessibility tree as a data structure
- How Playwright uses the accessibility tree for `getByRole`, `getByLabel`, `getByText`
- Why semantic locators survive UI changes that break CSS selectors
- `getByAI()` — Playwright's experimental AI-powered locator (describe the element in plain text)
- How AI locators use vision models to match elements by description
- The accessibility tree as an LLM-friendly representation of the page
- Aria roles — the full list and which elements each applies to
- `aria-label`, `aria-labelledby`, `aria-describedby` — how they affect locator strategies
- Building a fully semantic test suite — zero CSS or XPath

**Warm-up:**
Run `page.accessibility.snapshot()` on the OrangeHRM login page. Read the output. Map every element in the tree to the locator you would use for it. This is what Playwright "sees."

**Core Practice:**
1. Call `page.accessibility.snapshot()` on 3 different OrangeHRM pages — read the tree for each
2. Rewrite 5 existing tests so every locator is semantic — `getByRole`, `getByLabel`, `getByText` only — zero CSS
3. Simulate a developer renaming a CSS class — verify your semantic tests still pass, your old CSS tests break
4. Use `getByAI()` if available in your Playwright version — describe 3 elements in plain English and test the results
5. Identify which OrangeHRM elements cannot be found semantically and document why
6. Write a locator audit script that flags any `locator('css')` or `locator('xpath')` usage in your test files

**Open Challenge:**
Write a utility that takes a page and returns a structured summary of all interactive elements found via the accessibility tree. Use it to auto-generate a list of "what can be tested" on any page.

**Commit:** Semantic test suite, accessibility snapshot examples, locator audit script.

**Step-Up:** Yesterday was page.evaluate. Today you understand what Playwright's intelligence layer sees.

---

### Day 29 — Prompt Engineering & AI-Assisted Development

**Focus:** LLMs as force multipliers. Not to write tests for you — to write them faster while you stay in control.

**What to Study:**
- Why LLMs make mistakes in Playwright code — hallucinated locators, wrong API methods, missing await
- Context Engineering — giving the LLM exactly what it needs: page object, interface, scenario
- The review mindset — every AI-generated line must be verified before committing
- Prompt structure for page object generation — role, context, interface, constraints
- Prompt structure for test generation — scenario description, page objects available, expected result
- GitHub Copilot — in-editor autocomplete, chat, inline generation
- Cursor IDE — chat with codebase context, multi-file edits
- When AI saves time vs when it wastes it
- Building your own prompt library — reusable templates for common generation tasks

**Warm-up:**
Ask an LLM to generate a Playwright test for OrangeHRM employee creation. Do not give it any context. Review the output — count the errors. This is the baseline.

**Core Practice:**
1. Build a reusable prompt template for page object generation — it includes: page URL, key elements, expected methods, TypeScript interface, your BasePage signature
2. Use this template to generate `RecruitmentPage.ts` — review every line — fix what is wrong
3. Build a prompt template for test generation — it includes: the page objects available, the scenario, the expected assertions
4. Generate 5 test cases for the Leave module using your template — review, fix, run
5. Use Cursor or Copilot to autocomplete 3 complex test methods — observe what context it uses from your files
6. Document: what did the AI get right, what did it get wrong, what context made it more accurate

**Open Challenge:**
Give an LLM a screenshot of OrangeHRM's recruitment page. Ask it to generate a complete page object with locators. Compare the locators it generates to the real ones. Document the accuracy rate and what context improved it.

**Commit:** AI-generated page objects and tests — reviewed and corrected — with notes.

**Step-Up:** Yesterday was AI locators. Today AI accelerates your entire development cycle.

---

### Day 30 — Self-Healing Tests

**Focus:** Tests that survive UI changes. Build the mechanism, understand when it helps, and know its limits.

**What to Study:**
- Why locators break — developers renaming classes, restructuring DOM, changing IDs
- The self-healing concept — try primary locator, fall back to alternatives, log what was used
- Building a `HealingLocator` utility — wraps `page.locator()` with fallback chain
- Integrating an AI API to suggest new locators when all fallbacks fail
- `playwright-self-healing` and similar libraries — what they do and how
- The risks of self-healing — masking real bugs, hiding genuine UI changes
- Self-healing as a bridge, not a permanent solution
- Team policy for self-healing — when to fix the locator vs rely on healing

**Warm-up:**
Change one CSS class in your mental model of OrangeHRM. How many tests would break? How long would it take to fix them all? Self-healing is the answer to that question.

**Core Practice:**
1. Create `src/utils/HealingLocator.ts` — accepts a primary locator and an array of fallback locators
2. `HealingLocator.find(page)` — tries primary first, then each fallback, logs which succeeded
3. If all fail — logs a detailed error with all attempted strategies
4. Update 3 page objects to use `HealingLocator` for their most fragile locators
5. Intentionally break those locators — verify the fallbacks kick in and tests still pass
6. Integrate an AI API call as the last resort — when all locators fail, ask the AI for a suggestion based on the element description

**Open Challenge:**
Simulate a major UI refactor — rename 5 CSS classes across 3 pages. Run your suite with and without `HealingLocator`. Document: which tests failed without healing, which were rescued by healing, which needed manual fixes regardless.

**Commit:** HealingLocator utility, updated page objects, refactor simulation results.

**Step-Up:** Yesterday was AI-assisted writing. Today tests repair themselves when the UI changes.

---

### Day 31 — Testing AI Applications

**Focus:** Your application under test may itself be powered by AI. Non-deterministic outputs require specialised testing strategies.

**What to Study:**
- The core challenge — LLM responses are never identical, so exact text matching breaks
- Testing intent not content — `toContainText` over `toHaveText`, semantic matching
- Response quality validation — length, structure, key terms present
- `waitForResponse()` — waiting for AI API calls to complete before asserting
- Testing chatbot UIs — sending messages, identifying the response element, asserting quality
- RAG system testing — verifying retrieved context is relevant
- Hallucination testing — facts that must not appear in responses
- LLM-as-judge pattern — use one LLM to evaluate another's output
- Performance testing AI features — response time thresholds
- Non-determinism strategy — run tests multiple times, track pass rate over time

**Warm-up:**
Think about what makes an AI response "correct." It is not the exact words. It is whether the response is relevant, factually accurate, appropriately structured, and within expected length. Write these criteria down before automating.

**Core Practice:**
1. Find or use any chatbot demo (try `https://www.chatbase.co/chatbot-iframe/...` or similar public AI demo)
2. Write a test that sends a message and asserts the response is not empty
3. Write a test that asserts the response length is between a minimum and maximum character count
4. Write a test that asserts the response contains specific key terms related to the question
5. Use `page.waitForResponse()` to capture the AI API response and validate the raw payload structure
6. Write a test using the LLM-as-judge pattern — pass the chatbot's response to a second API call that evaluates if it is relevant — assert the evaluation is positive

**Open Challenge:**
Design a test strategy for a non-deterministic feature — document: how you define "correct," how you handle variability, how many runs constitute a valid sample, and what percentage pass rate is acceptable. This is a design exercise as much as a coding one.

**Commit:** AI application tests, LLM-as-judge implementation, test strategy document.

**Step-Up:** Yesterday was self-healing. Today you can test applications built on AI.

---

### Day 32 — AI Agents: Planner, Generator & Healer

**Focus:** Orchestrating AI agents in your testing workflow. The frontier of modern test automation.

**What to Study:**
- What an AI Agent is — an LLM that can take actions and use tools in a loop
- Playwright MCP (Model Context Protocol) — connects a browser-capable agent to Playwright
- Setting up `@playwright/mcp` — the official Playwright MCP server
- Planner Agent — takes requirements, produces test plan and coverage matrix
- Generator Agent — takes the test plan, produces Playwright TypeScript code
- Healer Agent — takes broken tests, repairs locators and assertions
- Agent orchestration — chaining agents in a pipeline: requirements → plan → code → run → heal
- AI Governance — reviewing agent output, catching mistakes, maintaining control
- When to trust agents vs when human review is mandatory

**Warm-up:**
Read the Playwright MCP documentation at `https://playwright.dev/docs/mcp`. Understand what the MCP server exposes — browser navigation, element interaction, screenshot capture.

**Core Practice:**
1. Install and start the Playwright MCP server: `npx @playwright/mcp@latest`
2. Connect an MCP-compatible LLM client (Claude Desktop, Cursor with MCP support)
3. Use the Planner Agent — give it the OrangeHRM leave module requirements — review the generated test plan
4. Use the Generator Agent — take one item from the test plan — generate the Playwright TypeScript code — review, fix, run
5. Intentionally break 3 tests — use the Healer Agent to repair them — document what it fixed correctly vs incorrectly
6. Design an agent pipeline document: inputs at each stage, outputs, human review points

**Open Challenge:**
Build a simple orchestration script — it reads a `requirements.txt` file, calls the Planner to generate a test plan, calls the Generator to produce code for each test, saves the code to the correct file, and runs the tests. Full pipeline, one command.

**Commit:** MCP configuration, agent experiment results, orchestration script.

**Step-Up:** Yesterday was testing AI apps. Today AI agents build and repair your tests.

---

### Day 33 — Vibe Testing: AI-Augmented Exploratory Testing

**Focus:** Exploratory testing elevated by AI. How Test Leads think about coverage beyond scripted tests.

**What to Study:**
- Session-based exploratory testing — structured exploration with time-boxes
- Test Charters — a mission statement for an exploratory session: what, where, how long
- The difference between scripted tests (verify known behaviour) and exploratory sessions (discover unknown behaviour)
- AI as exploration partner — give it the feature, ask for attack ideas, edge cases, boundary conditions
- Recording exploratory sessions with Playwright `--trace on` — reviewing the trace after
- Converting discoveries into regression tests — the most valuable output of exploration
- Bug hunting mindset vs confirmation mindset
- How Vibe Testing fits alongside a scripted test suite — they find different things

**Warm-up:**
Write a Test Charter for today's session: "Explore the OrangeHRM Leave application feature to find edge cases, validation gaps, and unexpected behaviour. Duration: 30 minutes."

**Core Practice:**
1. Conduct a 30-minute time-boxed exploratory session on the Leave module — record with `--trace on`
2. Ask an LLM to generate 20 attack ideas for the employee creation form — try the 5 most interesting
3. Document every finding — bugs, inconsistencies, missing validations, unexpected behaviour
4. Review the trace after your session — identify moments you should have tested differently
5. Convert your top 3 findings into automated regression tests
6. Conduct a second session on the Recruitment module — compare: what your scripted tests cover vs what you found in exploration

**Open Challenge:**
Write a formal exploratory session report — Charter, environment, areas explored, findings, risks identified, recommended regression tests. This is what a Test Lead delivers after an exploratory session.

**Commit:** Regression tests from exploration, exploratory session report.

**Step-Up:** Yesterday was AI agents. Today you combine structured exploration with AI-powered attack generation.

---

## Week 6 — Cloud, Multi-Application & Consolidation

**Goal:** Run on real cloud devices, apply all skills to two more applications, consolidate into one unified framework.

---

### Day 34 — Cloud Execution: LambdaTest & BrowserStack

**Focus:** Test on real devices and browsers you don't have locally. This is how enterprise teams get true cross-browser coverage.

**What to Study:**
- Why cloud grids — real device testing, browser versions, OS combinations
- LambdaTest HyperExecute for Playwright — native integration, fast parallelism
- BrowserStack Automate — Playwright integration via WebSocket endpoint
- Capabilities JSON — OS, browser, version, device, resolution
- `connectOverCDP()` — connecting Playwright to cloud browsers
- Cloud session videos, logs, and network traces on the cloud dashboard
- Integrating cloud results with Report Portal — same launch, different source
- Cost vs coverage trade-offs — which tests need cloud, which can stay local

**Core Practice:**
1. Sign up for LambdaTest free tier
2. Configure a Playwright project to connect to LambdaTest — Chrome on Windows
3. Run smoke tests on LambdaTest — view video recording on their dashboard
4. Add Firefox on macOS capability — run same smoke tests
5. Sign up for BrowserStack free tier
6. Run smoke tests on BrowserStack — compare dashboard UX and results
7. Add a real mobile device — run on iPhone in the cloud
8. Configure both cloud runs to report to your Report Portal instance

**Commit:** Cloud configuration files, test results from both platforms.

**Step-Up:** Yesterday was exploratory testing. Today your tests run on real cloud devices.

---

### Days 35 & 36 — SuiteCRM: Apply All Skills

**Day 35 — Foundation:**
1. Analyse SuiteCRM login, Accounts, and Contacts pages — identify all elements using only semantic locators
2. Create `src/pages/suitecrm/LoginPage.ts`, `AccountsPage.ts`, `ContactsPage.ts` following your BasePage structure
3. Add SuiteCRM as a project in `playwright.config.ts` with its own `baseURL` and `storageState`
4. Write globalSetup for SuiteCRM authentication
5. Write data-driven account creation tests using your DataFactory pattern

**Day 36 — Workflows & Integration:**
1. Build `LeadsPage.ts` and `OpportunitiesPage.ts`
2. Automate the Lead → Opportunity conversion flow end-to-end
3. Build `CasesPage.ts` — create, update, resolve a case
4. Write API tests for SuiteCRM's API layer using your ApiClient pattern
5. Add SuiteCRM tests to CI/CD pipeline
6. Verify SuiteCRM launches appear in Report Portal alongside OrangeHRM

**Commit each day.** The goal is to prove that your framework skills transfer to any application.

---

### Days 37 & 38 — AssetExplorer: Apply All Skills

**Day 37 — Asset Management:**
1. Build page objects for Asset management, Software Licensing modules
2. Write end-to-end asset lifecycle test — create, assign to user, transfer location, retire
3. Write compliance tests — verify software license count does not exceed allocated seats
4. Add AssetExplorer as a project in `playwright.config.ts`

**Day 38 — Procurement & Consolidation:**
1. Build `PurchaseOrderPage.ts` — create PO, approval workflow, receive goods
2. Write procurement workflow end-to-end test
3. All three applications — OrangeHRM, SuiteCRM, AssetExplorer — reporting to one Report Portal dashboard
4. Run the full suite — all three apps, all browsers — view consolidated Report Portal dashboard

**Commit each day.**

---

## Week 7 — Test Lead Skills & Capstone

**Goal:** Operate as a Test Lead. Review, maintain, and deliver at team scale.

---

### Day 39 — Framework Architecture Review & Code Quality

**Focus:** Step back and review everything. A lead sees the whole picture and makes architectural decisions.

**Warm-up:**
Open your oldest test file. Read it. Would a new team member understand it immediately? That is the standard.

**Core Practice:**
1. Full framework audit — identify duplication, poor naming, missing documentation
2. Write a code review checklist — what must pass before a PR is merged into this repo
3. Refactor the 3 most poorly structured files
4. Add JSDoc comments to every page object and utility class
5. Run: total tests, pass rate, average execution time, flaky test count — document these
6. Update `CONTRIBUTING.md` with everything a new team member needs to know

**Commit:** Refactored files, code review checklist, updated CONTRIBUTING.

---

### Day 40 — Advanced Git & Team Practices

**Core Practice:**
1. Set up branch protection — require PR review before merging to main
2. Install Husky — pre-commit hook runs `tsc --noEmit` and `eslint` — commit fails if either fails
3. Create a feature branch, make a change, open a PR, review it, merge it
4. Simulate a merge conflict in a spec file — resolve it properly
5. Tag the current framework: `git tag v1.0.0`
6. Configure GitHub Actions as a required status check — no merge without green pipeline
7. Practice `git bisect` — introduce a bug, then use bisect to find the commit that broke it

**Commit:** Husky config, branch protection documentation, `v1.0.0` tag.

---

### Day 41 — Maintenance Strategies & Suite Health

**Core Practice:**
1. Identify every flaky test — mark with `test.fixme('reason: ...')` and a GitHub issue link
2. Configure Dependabot — weekly PRs for dependency updates
3. Write `scripts/suite-health.ts` — reports total tests, skipped count, fixme count, average execution time, slowest 5 tests
4. Simulate a performance regression — identify which test became 3x slower and why
5. Delete all unused page objects, utilities, and test data files
6. Apply the 1-in-1-out rule: for every new test added, review and improve one existing test

---

### Day 42 — Capstone Delivery

**The final deliverable. Every skill from every week represented. Tag `v1.0.0-capstone`.**

**Framework Checklist:**
- [ ] Three applications: OrangeHRM, SuiteCRM, AssetExplorer
- [ ] Complete POM — BasePage, feature page objects for every module
- [ ] Custom fixtures — auth, page objects, test data
- [ ] ApiClient with hybrid UI + API tests
- [ ] Data-driven tests — JSON and CSV — using Builder/DataFactory
- [ ] Network interception and mocking tests
- [ ] Visual regression tests with committed baselines
- [ ] Accessibility tests

**Configuration:**
- [ ] Multi-project `playwright.config.ts` — 3 apps × 3 browsers
- [ ] StorageState for all user roles
- [ ] `.env` based credentials — nothing hardcoded
- [ ] TypeScript path aliases — zero relative path climbing
- [ ] ESLint + Prettier — lint passes clean

**CI/CD:**
- [ ] GitHub Actions — matrix strategy, parallel shards
- [ ] Docker container execution
- [ ] Report Portal integration — all three apps in one dashboard
- [ ] Artifacts: HTML report, traces on failure, junit XML
- [ ] Husky pre-commit hooks — commits fail on type errors or lint errors

**AI Integration:**
- [ ] AI-generated page objects — reviewed, corrected, documented
- [ ] HealingLocator utility in use
- [ ] Playwright MCP configured
- [ ] At least one test for a non-deterministic AI feature

**Documentation:**
- [ ] README — any engineer running in under 5 minutes
- [ ] CONTRIBUTING.md — naming, structure, PR process
- [ ] Code review checklist
- [ ] Suite health report
- [ ] Architecture decision records for key choices

**Final commit:** `git tag v1.0.0-capstone` and push.

---

## Daily Practice Rules

**Rule 1:** Code every single day. No reading-only days.

**Rule 2:** Every day's work is committed to GitHub before you stop.

**Rule 3:** Do not move to the next day until the current day's practice works completely.

**Rule 4:** When something breaks, debug it yourself for 20 minutes before asking for help. Use the tools — Trace Viewer, Inspector, UI mode.

**Rule 5:** After each day, write 3 sentences in `JOURNAL.md` — what you learned, what was hard, what you will do differently.

**Rule 6:** No copy-paste. Type every line. Understand every character.

**Rule 7:** Tests must pass 3 consecutive times before moving on. Once is luck.

**Rule 8:** At the end of each week, re-read the code from Day 1 of that week. If you would write it differently now — rewrite it. This is how you pay down technical debt as you learn.

---

## Skill Progression Summary

| Week | Core Skill Unlocked |
|------|-------------------|
| Week 1 | Locators, all element actions, special contexts, assertions, TypeScript |
| Week 2 | POM, data models, fixtures, framework architecture, config, auth state |
| Week 3 | Debugging, data-driven testing, API testing, hybrid testing, mocking, reporting |
| Week 4 | GitHub Actions, Docker, parallelism, sharding, Jenkins/Azure, visual, accessibility |
| Week 5 | AI locators, prompt engineering, self-healing, AI app testing, agents, MCP, exploratory |
| Week 6 | Cloud execution, SuiteCRM automation, AssetExplorer automation |
| Week 7 | Test Lead practices, code quality, maintenance, capstone delivery |

---

## Practice Application Reference

| Application | URL | Purpose |
|-------------|-----|---------|
| OrangeHRM | opensource-demo.orangehrmlive.com | Primary practice application — all weeks |
| demoqa.com | demoqa.com | Clean element practice — Day 3, 4, 5 |
| The Internet | the-internet.herokuapp.com | Dialogs, frames, windows — Day 5 |
| SuiteCRM | suitecrm.com/demo | CRM domain — Week 6 |
| AssetExplorer | ManageEngine trial | ITAM domain — Week 6 |
