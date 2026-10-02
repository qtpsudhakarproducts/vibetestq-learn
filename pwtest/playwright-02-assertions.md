---
# Part 02: Assertions — The expect API
> 📂 Playwright Test Framework Notes — Part 02 of 11

## 3. Assertions — The expect API

### 3.1 What is an Assertion?

An **assertion** is a statement that says: "I expect this to be true." If it's not true, the test fails. Assertions are how your test communicates pass or fail.

```typescript
// The pattern: expect(actual).toMatcherName(expected)
await expect(page.locator("h1")).toHaveText("Welcome");
//     ↑           ↑                    ↑
//  assertion   what you're       what you expect
//  function    checking          it to be
```

**Why Playwright's expect is special:**
- Assertions on locators **automatically retry** — if the element isn't ready yet, Playwright keeps retrying until the assertion passes or the timeout expires
- This eliminates dozens of manual `waitFor` calls
- The default assertion timeout is **5 seconds** (configurable in `playwright.config.ts`)

---

### 3.2 Locator Assertions — UI Checks

These assertions check the state of elements on the page. **They all require `await`** and all auto-retry.

#### Visibility and Presence

```typescript
// toBeVisible() — element exists AND is visible on screen
await expect(page.locator(".success-banner")).toBeVisible();
await expect(page.locator(".error-message")).toBeVisible();

// toBeHidden() — element doesn't exist OR is hidden (display:none, visibility:hidden)
await expect(page.locator(".loading-spinner")).toBeHidden();
await expect(page.locator("#modal")).toBeHidden();

// toBeAttached() — element exists in the DOM (may still be hidden)
await expect(page.locator("#hidden-input")).toBeAttached();

// toBeEmpty() — element has no child elements or text
await expect(page.locator(".notifications-list")).toBeEmpty();
```

#### Text Content

```typescript
// toHaveText() — exact text match (case sensitive)
await expect(page.locator("h1")).toHaveText("Welcome to the Dashboard");

// toHaveText() with regex — partial match or pattern
await expect(page.locator(".price")).toHaveText(/\$\d+\.\d{2}/); // Matches "$29.99"
await expect(page.locator(".greeting")).toHaveText(/Welcome/i);   // Case insensitive

// toContainText() — checks that element CONTAINS this text (not exact match)
await expect(page.locator(".summary")).toContainText("3 items");
// Passes even if the full text is "Your cart has 3 items in total"

// Checking multiple list items at once
await expect(page.locator(".menu-item")).toHaveText([
  "Home",      // First .menu-item must have text "Home"
  "Products",  // Second must have "Products"
  "About",     // Third must have "About"
  "Contact"    // Fourth must have "Contact"
]);
```

#### Form Elements

```typescript
// toHaveValue() — the current value of an input/select/textarea
await expect(page.locator("#email")).toHaveValue("user@example.com");
await expect(page.locator("#country")).toHaveValue("US");
await expect(page.locator("textarea")).toHaveValue("Hello World");

// toBeEnabled() / toBeDisabled()
await expect(page.locator("#submit-btn")).toBeEnabled();
await expect(page.locator("#submit-btn")).toBeDisabled();
// Useful for checking form validation (button disabled until form is valid)

// toBeChecked() — for checkboxes and radio buttons
await expect(page.locator("#accept-terms")).toBeChecked();
await expect(page.locator("#newsletter")).not.toBeChecked();

// toHaveValues() — for multi-select elements
await expect(page.locator("select[multiple]")).toHaveValues(["option1", "option2"]);
```

#### Attributes and CSS

```typescript
// toHaveAttribute() — check an HTML attribute
await expect(page.locator("img.logo")).toHaveAttribute("alt", "Company Logo");
await expect(page.locator("a.docs-link")).toHaveAttribute("href", "/docs");
await expect(page.locator("input#email")).toHaveAttribute("type", "email");

// toHaveAttribute() with regex
await expect(page.locator(".product-link")).toHaveAttribute("href", /\/products\/\d+/);

// toHaveClass() — checks the element has this CSS class
await expect(page.locator(".btn")).toHaveClass(/active/);
await expect(page.locator(".alert")).toHaveClass("alert alert-danger");

// toHaveCSS() — checks a computed CSS property value
await expect(page.locator(".hero")).toHaveCSS("display", "flex");
await expect(page.locator(".error-text")).toHaveCSS("color", "rgb(255, 0, 0)");
```

#### Count and Focus

```typescript
// toHaveCount() — checks how many elements match the locator
await expect(page.locator(".cart-item")).toHaveCount(3);
await expect(page.locator(".notification")).toHaveCount(0); // None present
await expect(page.locator("tr.data-row")).toHaveCount(10);

// toBeFocused() — checks that the element currently has keyboard focus
await page.click("#search");
await expect(page.locator("#search-input")).toBeFocused();

// toBeInViewport() — checks element is visible in the browser viewport
await expect(page.locator("#footer")).toBeInViewport();
```

---

### 3.3 Page Assertions

These check properties of the entire page, not individual elements.

```typescript
// toHaveURL() — the current URL matches exactly or by pattern
await expect(page).toHaveURL("https://example.com/dashboard");
await expect(page).toHaveURL(/\/dashboard/);          // Regex
await expect(page).toHaveURL(/checkout\/step-\d+/);   // More complex pattern

// toHaveTitle() — the page's <title> tag content
await expect(page).toHaveTitle("My App - Dashboard");
await expect(page).toHaveTitle(/My App/);             // Partial match

// toHaveScreenshot() — visual comparison (covered in section 9)
await expect(page).toHaveScreenshot("homepage.png");
```

---

### 3.4 Value Assertions (non-Playwright)

These assertions check plain JavaScript values — strings, numbers, booleans, objects. They do NOT auto-retry and do NOT need `await`.

```typescript
// Basic equality
expect(2 + 2).toBe(4);                           // Strict equality (===)
expect({ name: "Alice" }).toEqual({ name: "Alice" }); // Deep equality for objects

// Truthiness
expect(true).toBeTruthy();
expect(null).toBeFalsy();
expect(undefined).toBeUndefined();
expect("value").toBeDefined();
expect(null).toBeNull();

// Numbers
expect(5).toBeGreaterThan(3);
expect(5).toBeGreaterThanOrEqual(5);
expect(3).toBeLessThan(5);
expect(10).toBeLessThanOrEqual(10);
expect(0.1 + 0.2).toBeCloseTo(0.3); // For floating point comparisons

// Strings
expect("Hello World").toContain("World");
expect("Hello World").toMatch(/^Hello/);

// Arrays
expect([1, 2, 3]).toContain(2);
expect([1, 2, 3]).toHaveLength(3);
expect([1, 2, 3]).toEqual(expect.arrayContaining([1, 3])); // Contains these items

// Real test automation usage — reading values from the page then asserting
const itemCount = await page.locator(".cart-item").count();
expect(itemCount).toBe(3);

const priceText = await page.locator(".total-price").textContent();
const price = parseFloat(priceText!.replace("$", ""));
expect(price).toBeGreaterThan(0);
expect(price).toBeLessThan(10000);
```

---

### 3.5 Negating Assertions with .not

Add `.not` before any matcher to assert the opposite:

```typescript
// Negating locator assertions
await expect(page.locator(".error-message")).not.toBeVisible();
await expect(page.locator("#submit")).not.toBeDisabled();
await expect(page.locator("h1")).not.toHaveText("Error");
await expect(page.locator(".results")).not.toBeEmpty();

// Negating value assertions
expect(result).not.toBe(null);
expect(response.status).not.toBe(500);
expect(items).not.toHaveLength(0);

// Real example — after successful login, error message should NOT appear
await page.fill("#email", "valid@example.com");
await page.fill("#password", "correctpassword");
await page.click("#login");
await expect(page.locator(".login-error")).not.toBeVisible();
await expect(page).toHaveURL(/dashboard/);
```

---

### 3.6 Soft Assertions

By default, a failing assertion **immediately stops the test**. Soft assertions let the test continue collecting multiple failures, all reported at the end.

```typescript
test("verify complete checkout confirmation page", async ({ page }) => {
  await page.goto("/order-confirmation/12345");

  // Use expect.soft() — test continues even if these fail
  await expect.soft(page.locator(".order-number")).toBeVisible();
  await expect.soft(page.locator(".order-number")).toHaveText(/ORD-\d+/);
  await expect.soft(page.locator(".customer-name")).toHaveText("John Doe");
  await expect.soft(page.locator(".delivery-address")).toBeVisible();
  await expect.soft(page.locator(".estimated-delivery")).toBeVisible();
  await expect.soft(page.locator(".order-items")).toHaveCount(2);
  await expect.soft(page.locator(".total-price")).toHaveText(/\$\d+\.\d{2}/);
  await expect.soft(page.locator(".confirmation-email-note")).toContainText(
    "confirmation email"
  );

  // If ANY soft assertion failed, the test fails here at the end
  // But you'll see ALL failures, not just the first one
  // Hard assertion — if this fails, test stops immediately
  await expect(page.locator("#track-order-button")).toBeEnabled();
});
```

**When to use soft assertions:**
- Checking multiple independent elements on a page
- Page-level audits (SEO checks, accessibility text, analytics attributes)
- Regression tests where you want the full picture of what broke

---

### 3.7 Polling Assertions

`expect.poll()` repeatedly calls a function until it returns the expected value or times out. Useful for checking things that aren't Playwright locators.

```typescript
// Poll an API endpoint until a background job is complete
test("background job completes within 30 seconds", async ({ request }) => {
  const jobId = "job-123";

  // Keep calling the API and checking the status until it says "completed"
  await expect.poll(
    async () => {
      const response = await request.get(`/api/jobs/${jobId}`);
      const body = await response.json();
      return body.status; // Returns "pending", "running", or "completed"
    },
    {
      message: `Job ${jobId} should complete within 30 seconds`,
      timeout: 30000,   // Total timeout: 30 seconds
      intervals: [1000, 2000, 5000]  // Retry after 1s, then 2s, then every 5s
    }
  ).toBe("completed");
});

// Poll a database record
await expect.poll(async () => {
  const user = await db.getUser(userId);
  return user.emailVerified;
}, { timeout: 10000 }).toBe(true);
```

---

### 3.8 Custom Assertion Messages

Add a custom message to any assertion to make failures easier to understand.

```typescript
// Default failure message — generic, hard to understand
// "Error: Locator expected to have text 'Welcome' but received 'Error'"

// Custom message — tells you exactly what context the failure happened in
await expect(
  page.locator(".page-heading"),
  "After successful login, the dashboard heading should say Welcome"
).toHaveText("Welcome to the Dashboard");

// More examples
await expect(
  page.locator(".cart-count"),
  "Cart count should show 1 after adding first item"
).toHaveText("1");

await expect(
  page.locator("#payment-form"),
  "Payment form should be visible after clicking Checkout"
).toBeVisible();
```

---

### 3.9 Common Assertion Mistakes

#### Mistake 1: Forgetting await on locator assertions
```typescript
// ❌ WRONG — silently passes without actually checking anything
expect(page.locator("h1")).toHaveText("Title");     // Missing await!

// ✅ CORRECT
await expect(page.locator("h1")).toHaveText("Title");
```

#### Mistake 2: Using toBe() for deep object comparison
```typescript
// ❌ WRONG — toBe() uses === which fails for objects (different references)
expect({ name: "Alice" }).toBe({ name: "Alice" }); // FAILS — different objects

// ✅ CORRECT — toEqual() does deep comparison
expect({ name: "Alice" }).toEqual({ name: "Alice" }); // PASSES
```

#### Mistake 3: Using toHaveText() when you want partial match
```typescript
// ❌ FAILS if full text is "Welcome back, Alice!" but you write:
await expect(page.locator(".greeting")).toHaveText("Welcome");

// ✅ Use toContainText() for partial matches
await expect(page.locator(".greeting")).toContainText("Welcome");
```

---


---
← **Previous:** Part 01 — Test Structure `playwright-01-intro-and-test-structure.md`
→ **Next:** Part 03 — Fixtures `playwright-03-fixtures.md`
