# Chapter 204 — Locators & Auto-Waiting


This is the most interview-tested chapter in Part 2. Interviewers ask locator
questions to determine how deeply a candidate understands Playwright versus just
having memorised commands. Questions progress from what a locator is through
the priority order to chaining, filtering, and real locator problems.

---

## Q204.1 — What is a locator in Playwright?

A locator is a description of how to find one or more elements on a page.
It is not a reference to an element — it is a query that finds the element
fresh every time an action runs.

```typescript
// A locator — lazy, finds element on action
const button = page.getByRole('button', { name: 'Submit' });

// Action — locator finds the element NOW and clicks it
await button.click();
```

Locators have three key properties:

**Lazy evaluation** — the element is not found until you perform an action.
This means locators never go stale — even if the page re-renders between when
you defined the locator and when you use it.

**Auto-waiting** — every action on a locator waits for the element to be
actionable before proceeding.

**Strict mode** — if a locator matches more than one element, Playwright throws
an error. This prevents accidentally acting on the wrong element.

---

## Q204.2 — What is the recommended locator strategy in Playwright and why?

Playwright's recommended priority order, from most to least preferred:

1. **`getByRole()`** — query by ARIA role and accessible name
2. **`getByLabel()`** — for form inputs associated with a label
3. **`getByPlaceholder()`** — for inputs identified by placeholder text
4. **`getByText()`** — for non-interactive elements by their visible text
5. **`getByAltText()`** — for images by their alt attribute
6. **`getByTitle()`** — by title attribute
7. **`getByTestId()`** — by `data-testid` attribute
8. **`page.locator(css/xpath)`** — last resort for structural queries

The priority order reflects how users find elements: by what something IS
(role, label) rather than what the developer called it (CSS class, ID).

Role-based locators are the most robust because:
- They survive CSS refactors (class names change, roles do not)
- They test accessibility simultaneously — if the test finds the element,
  a screen reader user can too
- They read like user intentions: "click the Submit button", not "click .btn-primary"

---

## Q204.3 — When do you use getByRole vs getByLabel vs getByTestId?

**`getByRole`** — for any interactive element that has an ARIA role and a
visible name: buttons, links, headings, checkboxes, menus, dialogs.

```typescript
await page.getByRole('button', { name: 'Sign In' }).click();
await page.getByRole('link',   { name: 'Dashboard' }).click();
await page.getByRole('heading', { level: 1 }).toHaveText('Welcome');
```

**`getByLabel`** — for form inputs that are labelled. It finds the input
associated with the label text, not the label itself.

```typescript
await page.getByLabel('Email address').fill('user@test.com');
await page.getByLabel('Password').fill('pass123');
```

**`getByTestId`** — when the element has no natural semantic role or label,
and the developer has added a `data-testid` attribute specifically for testing.

```typescript
await page.getByTestId('submit-button').click();
```

Decision rule: try `getByRole` first. If the element is a form field, use
`getByLabel`. If neither works (custom widgets, canvas elements, SVG
components without ARIA), use `getByTestId` if it exists, CSS as last resort.

---

## Q204.4 — What locator strategy does your project use and why?

In our project, we follow a strict locator priority policy documented in our
contributing guide:

**80% of locators use `getByRole` or `getByLabel`.** Our application is built
with React and standard HTML form elements. These almost always have accessible
roles and labels.

**15% use `getByTestId`.** For complex custom components — date pickers, rich
text editors, drag-and-drop lists — we coordinate with the development team to
add `data-testid` attributes. This is documented in our definition of done.

**5% use CSS selectors.** Only for structural queries that cannot be expressed
any other way — table cells by column position, or elements with a specific
attribute value that has no accessible equivalent.

XPath is banned by our ESLint config. Any locator using an XPath expression
fails the lint check.

We chose this strategy because our team's metrics showed locator maintenance
was the biggest cause of test failures after deployments. Role-based locators
survived 90% of UI refactors without any change. CSS class locators broke on
every Tailwind or CSS module rename.

---

## Q204.5 — What is getByRole and what accessibility roles can you use?

`getByRole(role, options?)` finds elements by their ARIA role. ARIA roles
describe what an element IS in terms of user interaction, not its appearance.

Common roles used in test automation:

| Role | Matches | Example |
|---|---|---|
| `button` | `<button>`, `[role=button]` | `getByRole('button', { name: 'Submit' })` |
| `link` | `<a href>` | `getByRole('link', { name: 'Home' })` |
| `textbox` | `<input type=text>` (generic) | `getByRole('textbox', { name: 'Search' })` |
| `checkbox` | `<input type=checkbox>` | `getByRole('checkbox', { name: 'Remember me' })` |
| `radio` | `<input type=radio>` | `getByRole('radio', { name: 'Option A' })` |
| `combobox` | `<select>` or custom select | `getByRole('combobox', { name: 'Country' })` |
| `heading` | `<h1>–<h6>` | `getByRole('heading', { level: 1 })` |
| `dialog` | `[role=dialog]`, `<dialog>` | `getByRole('dialog', { name: 'Confirm' })` |
| `row` | `<tr>` in a table | `getByRole('row', { name: 'Alice' })` |
| `tab` | Tab in a tab panel | `getByRole('tab', { name: 'Settings' })` |
| `alert` | `[role=alert]` | `getByRole('alert')` |

Options: `name` (accessible name, string or regex), `exact` (boolean),
`level` (for headings), `checked`, `disabled`, `expanded`, `selected`.

---

## Q204.6 — What is the difference between getByText and getByLabel?

`getByText` finds elements by their visible text content. It looks at the
element itself, not an associated label. It matches any element type.

`getByLabel` finds form inputs by the text of an associated `<label>` element
(or `aria-label` / `aria-labelledby`). It returns the input, not the label.

```typescript
// getByText — finds the element containing the text
await page.getByText('Submit Order').click(); // finds Submit Order
await page.getByText('Error: invalid email')  // finds any element with this text

// getByLabel — finds the INPUT associated with the label
await page.getByLabel('Email address').fill('user@test.com');
// Email address
//  ← this is what getByLabel returns
```

**Decision rule:**
- Form inputs → `getByLabel` (finds the input, not the label)
- Non-interactive content, buttons with text → `getByText` (or better, `getByRole`)
- Never use `getByText` as the primary locator for a button you are clicking —
  use `getByRole('button', { name: 'text' })` instead. Text locators are
  fragile when copy changes.

---

## Q204.7 — What is getByTestId and when is it appropriate to use it?

`getByTestId(id)` finds elements with a `data-testid` attribute matching the
given ID. By default it looks for `data-testid`, but this is configurable:

```typescript
// playwright.config.ts — change the attribute name
use: { testIdAttribute: 'data-pw' }

// Test code
await page.getByTestId('submit-button').click();
// Finds: 
```

**When to use `getByTestId`:**
- The element has no natural ARIA role or label
- It is a custom component (date picker, carousel, tree view) with complex
  internal structure
- The developer has explicitly added a test ID for automation purposes

**When NOT to use `getByTestId`:**
- The element is a standard HTML input, button, or link — use semantic locators
- The test ID duplicates semantic information — `getByTestId('submit-button')`
  when `getByRole('button', { name: 'Submit' })` also works

Over-reliance on `getByTestId` means your tests are not testing accessibility —
an element with a test ID but no accessible role or label is invisible to
screen reader users.

---

## Q204.8 — What is the difference between a strict locator and a non-strict one?

Playwright locators are **strict by default**: if a locator matches more than
one element, any action on it throws an error.

```typescript
// ❌ Throws if multiple buttons with name "Save" exist
await page.getByRole('button', { name: 'Save' }).click();
// Error: strict mode violation: getByRole('button', { name: 'Save' })
// resolved to 3 elements

// ✅ Disambiguate by scoping to a parent
await page.getByRole('dialog').getByRole('button', { name: 'Save' }).click();

// ✅ Or explicitly take the first
await page.getByRole('button', { name: 'Save' }).first().click();
```

Strict mode is a feature, not a bug. It prevents tests from silently clicking
the wrong element. When a strict locator fails, it means there is ambiguity in
the page that the test needs to resolve explicitly.

Non-strict behaviour can be accessed with `.first()`, `.last()`, `.nth(n)`,
or `.all()` — but these should only be used when position is semantically
meaningful (e.g., "click the first result in the search results list").

---

## Q204.9 — What is the difference between CSS selectors and semantic locators?

CSS selectors query the DOM by structure, class names, IDs, and attributes.
Semantic locators (`getByRole`, `getByLabel`) query the accessibility tree by
what the element means and what it is called.

```typescript
// CSS selector — depends on DOM structure and class names
await page.locator('form.login-form input.email-field').fill('user@test.com');

// Semantic locator — depends on the element's role and label
await page.getByLabel('Email').fill('user@test.com');
```

CSS selectors break when:
- Class names are renamed (CSS modules, Tailwind config change)
- The element moves to a different position in the DOM
- The developer restructures the HTML

Semantic locators survive these changes because they query what the element
IS (role) and what it says (accessible name) — neither of which typically
changes during a UI refactor.

The rule: CSS selectors test implementation details. Semantic locators test
user-visible behaviour. Prefer semantic locators.

---

## Q204.10 — What is the difference between page.locator() and page.getByRole()?

`page.locator(selector)` takes a CSS selector string (or XPath with `xpath=` prefix).
It is a general-purpose DOM query.

`page.getByRole(role, options)` queries the accessibility tree. It is a
specialised semantic locator.

```typescript
// page.locator — CSS
const button1 = page.locator('button[type="submit"]');
const button2 = page.locator('.btn-primary');

// page.getByRole — semantic
const button3 = page.getByRole('button', { name: 'Sign In' });
```

`page.getByRole()` is a specific, preferred locator for finding elements by
their accessibility role. Use `getByRole` when possible because it is more
readable, accessibility-aligned, and resilient to styling changes.

`page.locator()` is for cases where the semantic APIs cannot express the query
— structural selectors, attribute value matches, CSS pseudo-classes.

---

## Q204.11 — What is wrong with using XPath in a modern Playwright project?

XPath is not wrong in every case, but it has three problems that make it
a poor default choice:

**Fragility** — XPath paths that include position (e.g., `//div[3]/span[2]`)
break whenever the surrounding HTML structure changes. Position-based XPath
is the most brittle locator in any framework.

**Readability** — `//form[@class='login-form']//input[@type='email']` is much
harder to read and maintain than `page.getByLabel('Email')`.

**Semantic alternative exists** — for almost every case where XPath is used in
modern Playwright, a semantic locator or CSS selector expresses the same query
more clearly.

XPath still has legitimate uses:
- Parent-axis traversal — XPath can navigate to a parent element, which CSS
  cannot do natively (before `:has()` was widely supported)
- Text matching with normalisation — `normalize-space()` in XPath
- Attribute comparison — checking that an attribute contains a value

When you do use XPath in a page object, always add a comment explaining why
no semantic locator worked.

---

## Q204.12 — How does Playwright's locator approach compare to Selenium's By strategies?

Selenium's `By` strategies return an `WebElement` immediately — a direct
reference to the DOM element at that moment. If the DOM re-renders, the element
reference goes stale and throws `StaleElementReferenceException`.

Playwright's `Locator` is a lazy query. It never holds a direct element
reference. Each action re-queries the DOM. Stale element errors do not exist
in Playwright.

| | Playwright Locator | Selenium By / WebElement |
|---|---|---|
| Type | Lazy query | Direct element reference |
| Staleness | Never stale | Can throw StaleElementReferenceException |
| Auto-waiting | Yes — built into every action | No — must use `WebDriverWait` explicitly |
| Strict mode | Yes — error on multiple matches | No — returns first match silently |
| Semantic APIs | `getByRole`, `getByLabel` | By.xpath, By.cssSelector |

The practical result: Playwright tests rarely need explicit waits. Selenium
tests routinely need `WebDriverWait` around every action involving dynamic content.

---

## Q204.13 — Write locators for a login form using best-practice semantic locators

```typescript
import { test, expect } from '@playwright/test';

test('user can log in with valid credentials', async ({ page }) => {
  await page.goto('/login');

  // Form fields — getByLabel finds the input associated with each label
  await page.getByLabel('Email address').fill('user@test.com');
  await page.getByLabel('Password').fill('Test1234!');

  // Checkbox with visible label
  await page.getByLabel('Remember me').check();

  // Submit button — getByRole is preferred for interactive elements
  await page.getByRole('button', { name: 'Sign In' }).click();

  // Assertion — wait for redirect to dashboard
  await expect(page).toHaveURL('/dashboard');

  // Assert welcome heading appears
  await expect(
    page.getByRole('heading', { name: /Welcome/ })
  ).toBeVisible();
});
```

---

## Q204.14 — Write code using chaining and filter to locate a specific item in a list

```typescript
import { test, expect } from '@playwright/test';

test('user can delete a specific order', async ({ page }) => {
  await page.goto('/orders');

  // Locate the table row that contains order "ORD-00456"
  // getByRole('row') finds all rows, filter narrows to the one we need
  const targetRow = page.getByRole('row').filter({ hasText: 'ORD-00456' });

  // Verify the row shows the expected status before acting
  await expect(targetRow.getByRole('cell', { name: 'Pending' })).toBeVisible();

  // Click the Delete button specifically inside that row
  // Chaining ensures we click Delete in the correct row, not any Delete button
  await targetRow.getByRole('button', { name: 'Delete' }).click();

  // Handle the confirm dialog
  await page.getByRole('dialog', { name: 'Confirm Delete' })
    .getByRole('button', { name: 'Confirm' }).click();

  // Verify the row is gone from the table
  await expect(page.getByRole('row').filter({ hasText: 'ORD-00456' }))
    .toHaveCount(0);
});
```

Key patterns demonstrated:
- `filter({ hasText })` — narrow a set of locators by text content
- Chaining `.getByRole()` on a row locator — scope to that specific row
- `filter({ hasText }).toHaveCount(0)` — verify deletion

---

## Q204.15 — Describe a locator problem you solved in a real project

In our project we had a product listing page where each product card had an
"Add to Cart" button. The original test used:

```typescript
// ❌ Brittle — clicks first matching button, ignores which product
await page.getByRole('button', { name: 'Add to Cart' }).click();
```

This worked when there was only one product visible but failed in strict mode
when the page loaded multiple products. We were also not testing the right thing
— we needed to add a specific product, not just any product.

The developer added `data-testid="product-card"` to each card. The fix:

```typescript
// ✅ Find the specific product, then click its button
const productCard = page
  .getByTestId('product-card')
  .filter({ hasText: 'Premium Widget X' });

await productCard.getByRole('button', { name: 'Add to Cart' }).click();

// Verify that specific product is in the cart
await page.goto('/cart');
await expect(page.getByRole('row').filter({ hasText: 'Premium Widget X' }))
  .toBeVisible();
```

After the fix, strict mode actually helped us find two more places in other
test files where the same brittle pattern was used. The strict mode error
surfaced a real coverage gap — tests were not specifying which product they
were adding.

---

## Chapter Summary — Key Points for Your Interview

- A locator is a lazy query — it finds elements on action, not on creation.
  This means locators never go stale.
- Priority order: `getByRole` → `getByLabel` → `getByPlaceholder` →
  `getByText` → `getByTestId` → CSS/XPath.
- `getByRole` tests both automation AND accessibility. If the locator can't
  find the element, a screen reader user can't either.
- Strict mode is a feature. Multiple matches cause an error — resolve
  ambiguity with `filter()`, scoping, or explicit `.first()`.
- Use `filter({ hasText })` and locator chaining to locate elements in
  tables and lists without fragile index-based selectors.

---
