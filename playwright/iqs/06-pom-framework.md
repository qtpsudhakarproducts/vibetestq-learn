# Page Object Model (POM) Framework — Interview Questions

---

## Q: What is the Page Object Model?

**A:** The Page Object Model (POM) is a design pattern where each page or significant component of your web application is represented by a class. The class contains the locators and action methods for that page. Tests interact with pages through these classes instead of directly writing selectors and interactions inline.

---

## Q: What problem does POM solve?

**A:** As a test suite grows, locator strings and interaction steps get duplicated across many test files. One UI change — a button text change, a renamed input — requires updating every file that uses it. POM centralises all page interactions in one class. One UI change requires one update in one place.

---

## Q: What are the benefits of using POM?

**A:** **Maintainability** — UI changes are fixed in one place. **Readability** — tests read like user actions rather than low-level DOM operations. **Reusability** — the same page methods are shared across all tests that use that page. **Separation of concerns** — tests contain the test logic, page objects contain the technical UI details.

---

## Q: When is POM not worth adding?

**A:** For very small test suites — a handful of tests across one or two files — POM adds class boilerplate without clear benefit. For one-off scripts or quick exploratory checks, writing tests directly is faster. POM pays off when duplication becomes a real maintenance problem across multiple files.

---

## Q: What should a page object contain?

**A:** Locators for the page's interactive elements, and methods that represent user actions on that page (`login()`, `addToCart()`, `submitForm()`). Action methods should reflect what a user does — not how the DOM is structured. The class should model one page or one reusable component.

---

## Q: What should NOT be inside a page object?

**A:** Assertions, test data, test logic, and business rule validation. Keeping assertions in the test files and data out of page objects makes page objects reusable for tests with different expectations. A page object's only job is to perform interactions — not to decide whether the result is correct.

---

## Q: What does Single Responsibility mean for page objects?

**A:** Each page object class should have one focus — the interactions of one page or one component. It should not handle navigation for multiple pages, contain assertions, or store test state. When a class starts handling multiple unrelated concerns, split it.

---

## Q: What is a BasePage class and what should it contain?

**A:** `BasePage` is a superclass that all page objects extend. It holds utilities that every page needs: a reference to the `page` fixture, common navigation helpers, methods that wait for global loading indicators to disappear, or wrappers for repeated patterns. Do not add page-specific logic to `BasePage`.

---

## Q: When should you create a BasePage?

**A:** Create it when two or more page objects share the same repeated code. Do not create it preemptively — wait until the duplication is real and measurable. An empty or trivial `BasePage` adds abstraction without value.

---

## Q: What is the difference between inheritance and composition in POM?

**A:** **Inheritance** — a page class extends `BasePage` (`class LoginPage extends BasePage`). It gets all `BasePage` methods automatically. **Composition** — a page class holds an instance of another class and delegates to it (`this.header = new HeaderComponent(page)`). Composition is more flexible when components are shared across many pages. Inheritance through a single `BasePage` is common and practical; avoid deep inheritance chains.

---

## Q: What is a page component object?

**A:** A component object represents a reusable UI component that appears on multiple pages — a navigation header, a product card, a modal dialog, a data table, a date picker. Instead of duplicating the same locators and methods on every page that uses the component, you create one component class and include it where needed.

---

## Q: What is a helper class in an automation framework?

**A:** A helper class (or utility class) provides logic that is not tied to any one page. Examples: a `DataGenerator` that creates random test data with Faker.js, a `FileHelper` that manages file downloads, an `ApiHelper` that makes direct API requests, or a `DateHelper` that formats dates. If logic is reusable and page-independent, it belongs in a helper.

---

## Q: When should you create a helper instead of a page method?

**A:** If the logic doesn't involve navigating or interacting with a page's DOM — generating data, making API calls, formatting values — it belongs in a helper. Page methods should be about what users do on the page. Helpers are about technical or data utilities that serve tests regardless of which page they're on.

---

## Q: How do fixtures integrate with page objects?

**A:** Create a custom fixture using `test.extend()` that instantiates a page object and optionally navigates to the starting page. Tests that need the page object declare it as a fixture parameter and receive a ready-to-use instance. This removes setup code from test bodies and ensures teardown runs correctly even when tests fail.

---

## Q: How do you create a page object fixture?

**A:** Use `test.extend()` and define a fixture function that receives the built-in `page` fixture, creates a page object instance, optionally performs navigation, then calls `await use(pageObject)`. Code after `use()` is the teardown.

```typescript
export const test = base.extend<{ loginPage: LoginPage }>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  }
});
```

---

## Q: How do you manage authentication in a POM framework?

**A:** Use Playwright's `storageState` feature. Run a global setup script that logs in once via the UI or API, then saves the browser state to a JSON file with `await context.storageState({ path: 'auth.json' })`. Set `storageState: 'auth.json'` in the `use` block of `playwright.config.ts`. All tests start pre-authenticated without going through the login UI.

---

## Q: What is test independence and why does it matter?

**A:** Test independence means each test creates its own preconditions, runs without relying on state from other tests, and cleans up after itself. Independent tests can run in any order, in parallel, and be retried without side effects. Tests that depend on each other produce cascading failures, are hard to debug, and cannot run in parallel.

---

## Q: Why must tests not depend on each other's output?

**A:** If test B relies on data created by test A, it fails whenever A fails, runs in a different order, or runs in a different parallel worker. This creates unpredictable, cascading failures. The root cause of a failure may be in test A, but test B appears broken, misleading the investigation.

---

## Q: What is API-based test setup and why is it better than UI-based setup?

**A:** API-based setup means calling the application's API directly to create the data a test needs — creating a user, seeding an order, setting up a product — instead of navigating through the UI to do it. API calls are much faster (milliseconds vs seconds), more reliable (no rendering or animation dependencies), and don't require UI flows to work correctly before the test can even start.

---

## Q: What is test data management?

**A:** Test data management is the practice of creating, controlling, and cleaning up the data that tests need. Good management ensures data is isolated per test, starts in a known state, doesn't accumulate between runs, and doesn't conflict with data created by other parallel tests.

---

## Q: What is dynamic test data?

**A:** Dynamic test data is generated fresh for each test run rather than hardcoded. A randomly generated unique email address, user name, or order number ensures tests don't conflict with each other in shared environments and don't break when pre-existing data gets deleted or modified.

---

## Q: What is a data factory?

**A:** A data factory is a helper function or class that produces test data objects with sensible defaults and allows selective overrides. Instead of constructing test objects inline every time, you call `UserFactory.create({ role: 'admin' })` and get a fully populated user object. It centralises data shape definitions and reduces duplication.

---

## Q: What is Faker.js and why is it used in tests?

**A:** Faker.js is a library that generates realistic fake data: names, email addresses, phone numbers, addresses, companies, product names, and more. Using it avoids hardcoded values that can cause test conflicts, get deleted from databases, or become invalid over time.

---

## Q: How do you clean up test data after tests?

**A:** Run cleanup in the fixture's teardown section (after `await use()`), or in an `afterEach` hook. Use direct API calls to delete created records — this is faster and more reliable than navigating the UI to delete them. For database-level tests, use transactions that roll back automatically. Avoid skipping cleanup — accumulated data slows down environments and causes false test failures.

---

## Q: What is shared state in tests and why is it a problem?

**A:** Shared state is any data or session that multiple tests access or modify — a shared database record, a shared browser context, a global variable. Tests that share state can interfere with each other unpredictably, especially when running in parallel. One test's mutation can corrupt another test's inputs.

---

## Q: Why does shared state break parallel tests?

**A:** When tests run simultaneously in parallel workers, two tests might read and write shared state at the same time. The order of operations is non-deterministic, so results vary between runs. Each parallel test needs completely isolated state — its own data, its own browser context, its own API credentials.

---

## Q: What are the key components of a scalable test framework?

**A:** Fixtures for all shared setup and teardown. Page objects for UI interactions. Data factories for test data. API helpers for direct data setup. Tests that are fully independent. Feature-based folder organisation. Multiple projects for different environments and browsers. Parallel execution with sharding for CI. Automated artifact upload in the CI pipeline.

---

## Q: What are common POM anti-patterns?

**A:** Putting assertions inside page objects — they should be in tests. Creating one massive god-class for the whole application. Adding pages to `BasePage` instead of keeping it generic. Making methods too granular (one method per click instead of one method per user action). Storing test-specific state in page object fields. Using page objects for every small test that doesn't need them.

---

## Q: When should a page object be split into multiple classes?

**A:** Split when a page has distinct, independently used sections — for example, a search interface, a results list, and a pagination control, each used in different testing scenarios. Also split when a class exceeds about 150–200 lines, or when different parts of the page will evolve and change independently.

---

## Q: What makes a test framework architecture good?

**A:** Clear separation: tests express intent, page objects handle interactions, fixtures manage lifecycle, helpers provide utilities. Dependencies are injected via fixtures, not hidden in global state. API calls handle setup and teardown for speed. The design scales to hundreds of tests without slowing down. Naming is consistent. Configuration is centralised and environment-driven.

---
