# Chapter 24: Best Practices & Design Patterns (Complete Guide)

## The Concept of Sustainable Automation

Writing a test is easy; maintaining a suite of thousands of tests is hard. **Best Practices** are the industry-standard rules and patterns that ensure your automation code is as robust and clean as your production code. Without these, your test suite will eventually become "Technical Debt."

**Purpose**: This chapter consolidates the "Playwright Way" of doing things—focusing on locators, isolation, and stability.

**Why is it required?**
1. **Resilience**: To minimize flakiness by using auto-waiting and semantic locators instead of brittle CSS/XPath paths.
2. **Portability**: To ensure that tests run consistently across all environments (Local, CI, Docker).
3. **Scalability**: To build a framework that is easy for new team members to contribute to without breaking existing logic.

## The Playwright Philosophy

Playwright is designed to be **Resilient**. If your tests are flaky, you are likely fighting against the tool (forcing waits) instead of working with it (auto-waiting).

## Locator Strategy (The Foundation)

**Rule #1: User-Facing Locators First.**
Tests should resemble how a user interacts with the page.

1.  **`page.getByRole('button', { name: 'Submit' })`** (🥇 Gold Standard)
    *   Ensures accessibility.
    *   Resilient to layout changes (div vs span).
2.  **`page.getByText('Welcome')`**
3.  **`page.getByTestId('submit-btn')`** (If no semantic role exists)
4.  **`page.locator('#submit')`** (CSS - Avoid if possible)
5.  **`page.locator('xpath=//div[3]/span')`** (💀 The Danger Zone)

**Why?**
If you refactor the CSS class but keep the button labeled "Submit", a CSS-based test breaks. A Role-based test passes.

---

## Assertion Strategy (The Verification)

**Rule #2: Use Web-First Assertions.**
Never use synchronous assertions (`expect(val).toBe()`) on dynamic web elements.

**❌ Bad:**
```typescript
const isVisible = await page.locator('.modal').isVisible();
expect(isVisible).toBe(true); // Fails if modal takes 50ms to fade in
```

**✅ Good:**
```typescript
await expect(page.locator('.modal')).toBeVisible(); // Retries until timeout
```

**Rule #3: Soft Assertions for Non-Critical Checks.**
If you are checking 50 text labels, don't stop at the first failure.
```typescript
await expect.soft(row).toContainText('Data');
```

---

## Test Isolation (The Stability)

**Rule #4: Every Test is an Island.**
*   **No Shared State**: Test B should not depend on Test A creating a user.
*   **No Order Dependency**: Tests should pass even if run in random order.
*   **Fresh Context**: Playwright gives you a fresh context (cookies cleared) by default. Don't fight it.

**Pattern:**
```typescript
test('edit post', async ({ page }) => {
  // 1. Create Data (API)
  const post = await api.createPost();
  
  // 2. Perform Action (UI)
  await page.goto(`/post/${post.id}/edit`);
  // ...
});
```

---

## Maintainability Patterns

**Rule #5: Use Page Objects (POM) for Logic.**
Keep your spec files clean.
```typescript
// Spec
await loginPage.login('user', 'pass');

// Page Object
async login(user, pass) {
    await this.email.fill(user);
    // ...
}
```

**Rule #6: Use Fixtures for Setup.**
Don't use `beforeEach` for complex setup. Use Fixtures.
```typescript
test('admin dashboard', async ({ adminPage }) => {
  // adminPage fixture handles login, state loading, and navigation
});
```

---

## Optimization & CI

**Rule #7: Don't Wait for Time.**
`waitForTimeout(5000)` is a "smell". It means you don't know what you are waiting for.
*   Waiting for API? -> `waitForResponse`
*   Waiting for Visibility? -> `expect(loc).toBeVisible()`

**Rule #8: Lint Your Tests.**
Use `eslint-plugin-playwright`. It catches:
*   `await` missing before expect.
*   skipped tests committed by accident.
*   usage of `.first()` or `.nth()` which causes flakiness.

---

## The Golden Rules

1.  **Test behavior, not implementation.**
2.  **Isolate everything.**
3.  **Use auto-waiting.**
4.  **Generate data dynamically.**
5.  **Run in parallel.**
**Summary**: You've completed the core Playwright curriculum, mastering best practices and design patterns used by high-performing teams. The next module leaps into the future, exploring how Generative AI is transforming the role of the modern Quality Engineer.

**Happy Testing! 🎭**
