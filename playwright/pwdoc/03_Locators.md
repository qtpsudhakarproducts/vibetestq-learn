# Chapter 03: Core Concepts - Locators (Complete Guide)



## The Concept of Locators

In automation, the first step to any interaction is finding the element you want to act upon. Whether it's a "Login" button, a "Username" field, or a "Success" message, you need a reliable way to point Playwright to that specific part of the DOM.

**Purpose**: Locators provide a robust, resilient way to find and interact with elements. They are the bridge between your test logic and the application's user interface.

**Why are they required?**
1. **Precision**: To ensure you are clicking the *correct* button when multiple exist.
2. **Resilience**: To handle dynamic IDs and changing HTML structures without breaking tests.
3. **Consistency**: To provide a unified API for finding elements regardless of the browser or platform.

### Definition

**Locators** are Playwright's way of finding elements on a web page. Unlike traditional element selectors that return a static reference, Playwright locators are:

- **Lazy**: They don't find the element until an action is performed.
- **Strict**: If a locator matches multiple elements, Playwright will throw a `Strictness Violation` error. This prevents interacting with the wrong element by accident.
- **Auto-retrying**: They keep looking (up to the timeout) if the element isn't found immediately.
- **Auto-waiting**: They wait for actionability (Visible, Stable, Enabled, Editable) before acting.

### Locator Priority (Recommended Order)

Playwright recommends finding elements in this specific order to ensure accessibility and resilience:
1.  **🥇 getByRole()**: Mimics how screen readers identify elements (e.g., `button`, `heading`).
2.  **🥈 getByLabel()**: Best for forms (e.g., `<label for="email">`).
3.  **🥉 getByPlaceholder()**: When no label is present.
4.  **🏅 getByText()**: For finding non-interactive content.
5.  **🎖️ getByTestId()**: The "contract" between developer and tester (e.g., `data-testid`).
6.  **⚠️ locator('css/xpath')**: Use only as a last resort for complex structural logic.

### Why Playwright Locators are Special

**Comparison: Traditional vs Playwright Locators**

| Aspect | Traditional (Selenium) | Playwright Locators |
|--------|----------------------|-------------------|
| **Element Finding** | Immediate (at time of call) | Lazy (at time of action) |
| **Stale Elements** | Common issue | Never stale |
| **Multiple Matches** | Returns first | Throws error (strict mode) |
| **Waiting** | Manual waits needed | Automatic |
| **Re-querying** | Must re-query manually | Auto re-queries |
| **Actionability** | Must check manually | Built-in checks |

**Example:**
```typescript
// ❌ Selenium - Element can become stale
WebElement button = driver.findElement(By.id("submit"));
// ... page re-renders ...
button.click(); // ❌ StaleElementReferenceException

// ✅ Playwright - Always fresh
const button = page.locator('#submit');
// ... page re-renders ...
await button.click(); // ✅ Works! Re-queries automatically
```

---

## Selector Decision Matrix

### Choosing the Right Selector

Use this matrix to decide which selector type to use:

| Scenario | Recommended Selector | Why | Example |
|----------|---------------------|-----|---------|
| **Element has stable test ID** | `data-testid` | Most reliable, test-specific | `page.getByTestId('submit-btn')` |
| **Interactive element** | `getByRole` | Semantic, accessible | `page.getByRole('button', { name: 'Submit' })` |
| **User-visible text** | `getByText` | User-centric, intuitive | `page.getByText('Welcome')` |
| **Form field with label** | `getByLabel` | Semantic relationship | `page.getByLabel('Email')` |
| **Element in container** | CSS with scope | Scoped selection | `page.locator('.container .item')` |
| **Dynamic content** | Multiple fallback selectors | Robust against changes | `page.locator('button, [role=button]')` |
| **Table cell operations** | Text-based filtering | Content-based selection | `page.locator('tr:has-text("John")')` |
| **Complex parent relationships** | XPath | Powerful navigation | `xpath=//input/parent::form` |
| **Placeholder text** | `getByPlaceholder` | Input-specific | `page.getByPlaceholder('Search...')` |
| **Alt text (images)** | `getByAltText` | Image identification | `page.getByAltText('Logo')` |
| **Title attribute** | `getByTitle` | Tooltip text | `page.getByTitle('Close')` |

---

## Element Stability Ranking

### From Most Stable (Preferred) to Least Stable

```
1. 🥇 Data Attributes (data-testid, data-*)
   └─ Designed specifically for testing
   └─ Won't change with styling or content
   └─ Example: data-testid="login-button"

2. 🥈 ARIA Roles/Labels
   └─ Semantic meaning
   └─ Accessibility-focused
   └─ Example: role="button" aria-label="Submit"

3. 🥉 User-Visible Text
   └─ What users actually see
   └─ Changes less frequently
   └─ Example: text="Submit Form"

4. 📌 Stable CSS Classes
   └─ Intentional, component-based
   └─ Example: .primary-button, .card-header

5. 🆔 IDs
   └─ Can change with refactoring
   └─ Example: #submit-btn

6. 🔧 Specific XPath
   └─ Powerful but complex
   └─ Example: //form[@id="login"]//button

7. 🎨 Generic CSS
   └─ Tied to styling
   └─ Example: .btn.btn-primary

8. 🏷️ Tag Names
   └─ Too generic
   └─ Example: button, div, span

9. ⚠️ Position-based XPath
   └─ Fragile, position-dependent
   └─ Example: //div[3]/button[1]
```

### Stability Score Examples

```typescript
// 🥇 MOST STABLE - Test ID
await page.getByTestId('submit-button').click();
// Pros: Won't change, explicit test contract
// Cons: Requires adding data-testid to HTML

// 🥈 VERY STABLE - Role + Name
await page.getByRole('button', { name: 'Submit' }).click();
// Pros: Semantic, accessible, user-facing
// Cons: Text changes break tests

// 🥉 STABLE - User Text
await page.getByText('Submit Form').click();
// Pros: User-centric, readable
// Cons: Internationalization issues

// 📌 MODERATE - CSS Class
await page.locator('.submit-button').click();
// Pros: Familiar, concise
// Cons: Styling changes break tests

// 🆔 MODERATE - ID
await page.locator('#submit').click();
// Pros: Unique, fast
// Cons: IDs can change

// ⚠️ LEAST STABLE - Position
await page.locator('div:nth-child(3) button:first-child').click();
// Pros: None
// Cons: Breaks with any layout change
```

---

## Built-in Locator Methods

### Complete Reference

Playwright provides these built-in locator methods:

| Method | Purpose | When to Use | Example |
|--------|---------|-------------|---------|
| `getByRole()` | Find by ARIA role | Interactive elements | `page.getByRole('button', { name: 'Submit' })` |
| `getByText()` | Find by text content | Visible text | `page.getByText('Welcome')` |
| `getByLabel()` | Find by label text | Form inputs | `page.getByLabel('Email')` |
| `getByPlaceholder()` | Find by placeholder | Inputs without labels | `page.getByPlaceholder('Search...')` |
| `getByAltText()` | Find by alt attribute | Images | `page.getByAltText('Logo')` |
| `getByTitle()` | Find by title attribute | Tooltips | `page.getByTitle('Close')` |
| `getByTestId()` | Find by test ID | Test-specific | `page.getByTestId('submit-btn')` |
| `locator()` | CSS/XPath selector | Complex selectors | `page.locator('.container > button')` |

---

## CSS Selectors

### Purpose
Leverage familiar CSS syntax to select elements based on structure, styling, and attributes.

### When to Use
- When you need precise control over element selection
- For elements with stable CSS classes or IDs
- When working with existing CSS knowledge
- For selecting multiple related elements

### Best For
Static elements, styled components, structural navigation

### Basic CSS Selectors

```typescript
// 1. Select by ID - Use when element has unique, stable identifier
await page.locator('#submit-button').click();
// HTML: <button id="submit-button">Submit</button>
// Pros: Fast, unique
// Cons: IDs can change

// 2. Select by class - Use for styled components
await page.locator('.btn-primary').click();
// HTML: <button class="btn-primary">Submit</button>
// Pros: Reusable, familiar
// Cons: Styling changes break tests

// 3. Select by tag - Use for generic element types
await page.locator('input').fill('Hello World');
// HTML: <input type="text">
// Pros: Simple
// Cons: Too generic, often matches multiple elements

// 4. Select by attribute - Use for stable data attributes
await page.locator('[data-testid="login-form"]').click();
// HTML: <form data-testid="login-form">
// Pros: Stable, test-specific
// Cons: Requires adding attributes

// 5. Select by type attribute
await page.locator('input[type="email"]').fill('user@example.com');
// HTML: <input type="email">
// Pros: Specific input type
// Cons: Multiple inputs of same type
```

### Advanced CSS Selectors

```typescript
// Descendant selector - Find nested elements
await page.locator('form input[type="email"]').fill('user@example.com');
// Finds: <form><div><input type="email"></div></form>
// Use: When element is inside specific container

// Child selector - Direct parent-child relationship
await page.locator('nav > ul > li').first().click();
// Finds: <nav><ul><li>Item</li></ul></nav>
// Use: When you need direct children only

// Adjacent sibling - Next sibling element
await page.locator('label + input').fill('value');
// Finds: <label>Name</label><input>
// Use: When element follows another

// General sibling - Any following sibling
await page.locator('h2 ~ p').first().textContent();
// Finds: <h2>Title</h2><div></div><p>Text</p>
// Use: When element is somewhere after another

// Attribute contains
await page.locator('[class*="button"]').click();
// Finds: <button class="primary-button">
// Use: When class name contains specific text

// Attribute starts with
await page.locator('[id^="submit"]').click();
// Finds: <button id="submit-form-btn">
// Use: When ID starts with specific text

// Attribute ends with
await page.locator('[href$=".pdf"]').click();
// Finds: <a href="document.pdf">
// Use: When attribute ends with specific text

// Multiple classes
await page.locator('.btn.primary.large').click();
// Finds: <button class="btn primary large">
// Use: When element has all specified classes

// Pseudo-classes
await page.locator('li:first-child').click();
await page.locator('li:last-child').click();
await page.locator('li:nth-child(3)').click();
await page.locator('input:checked').count();
await page.locator('button:disabled').count();
await page.locator('input:focus').fill('text');

---

## Shadow DOM: The 'Deep' Control

One of Playwright's most powerful features is its ability to **pierce the Shadow DOM** automatically. Traditional tools require complex JavaScript execution to find elements inside a shadow root, but Playwright locators work across shadow boundaries by default.

### Transparent Piercing
```typescript
// Even if the input is inside a #shadow-root (open), this works:
await page.locator('input').fill('Hello'); 
```

### Deep Selectors
If you need to be explicit about piercing shadow roots, use the `>>` separator:
```typescript
// Explicitly pierce shadow roots
await page.locator('my-component >> #inner-button').click();
```

---
```

### CSS Selector Combinations

```typescript
// Complex combination example
await page.locator('form.login-form input[type="email"]:not([disabled])').fill('user@example.com');
// Breakdown:
// - form.login-form: Form with class "login-form"
// - input[type="email"]: Email input inside form
// - :not([disabled]): That is not disabled
```

---

## Text-based Selectors

### Purpose
Select elements based on their visible text content, mimicking how users identify elements.

### When to Use
- For user-facing elements (buttons, links, labels)
- When visual text is more stable than structure
- For internationalization testing
- When implementing user-centric scenarios

### Best For
Buttons, links, navigation items, form labels, content verification

### Text Selector Variations

```typescript
// 1. Exact text match - Use when text is precise
await page.getByText('Submit').click();
await page.locator('text=Submit').click(); // Alternative syntax
// Matches: <button>Submit</button>
// Doesn't match: <button>Submit Form</button>

// 2. Partial text match - Use when only part is stable
await page.getByText('Sub', { exact: false }).click();
await page.locator('text=Sub').click();
// Matches: <button>Submit</button>
// Matches: <button>Subscribe</button>

// 3. Case-insensitive match
await page.getByText(/submit/i).click();
// Matches: <button>Submit</button>
// Matches: <button>SUBMIT</button>
// Matches: <button>submit</button>

// 4. Regular expression match
await page.getByText(/^Submit/).click();
// Matches: <button>Submit Form</button>
// Doesn't match: <button>Form Submit</button>

// 5. Contains text (has-text)
await page.locator('div:has-text("Welcome")').click();
// Matches: <div>Welcome to our site</div>
// Matches: <div><span>Welcome</span> user</div>

// 6. Exact text in container
await page.locator('div', { hasText: 'Welcome' }).click();
// More flexible than :has-text
```

### Text Selector Best Practices

```typescript
// ✅ DO: Use exact text for buttons
await page.getByText('Submit', { exact: true }).click();

// ❌ DON'T: Use partial text for buttons (ambiguous)
await page.getByText('Sub').click(); // Matches "Submit", "Subscribe", etc.

// ✅ DO: Use regex for dynamic content
await page.getByText(/Order #\d+/).click();
// Matches: "Order #12345"

// ❌ DON'T: Use text selectors for non-visible text
await page.getByText('hidden-value').click(); // Won't work if display:none

// ✅ DO: Combine with other selectors for precision
await page.locator('button:has-text("Submit")').click();
```

---

## Role-based Selectors

### Purpose
Find elements by their ARIA role and accessible name, reflecting how assistive technologies perceive the page.

### When to Use
- For interactive elements (buttons, links, inputs)
- When building accessible applications
- For semantic element selection
- When you want user-centric selectors

### Best For
Buttons, links, form controls, navigation, headings, lists

### Available Roles

| Role | HTML Elements | Example |
|------|--------------|---------|
| `button` | `<button>`, `<input type="button">` | `getByRole('button', { name: 'Submit' })` |
| `link` | `<a href>` | `getByRole('link', { name: 'Home' })` |
| `textbox` | `<input type="text">`, `<textarea>` | `getByRole('textbox', { name: 'Email' })` |
| `checkbox` | `<input type="checkbox">` | `getByRole('checkbox', { name: 'Agree' })` |
| `radio` | `<input type="radio">` | `getByRole('radio', { name: 'Option 1' })` |
| `heading` | `<h1>` to `<h6>` | `getByRole('heading', { name: 'Title' })` |
| `list` | `<ul>`, `<ol>` | `getByRole('list')` |
| `listitem` | `<li>` | `getByRole('listitem')` |
| `navigation` | `<nav>` | `getByRole('navigation')` |
| `main` | `<main>` | `getByRole('main')` |
| `banner` | `<header>` | `getByRole('banner')` |
| `contentinfo` | `<footer>` | `getByRole('contentinfo')` |
| `table` | `<table>` | `getByRole('table')` |
| `row` | `<tr>` | `getByRole('row')` |
| `cell` | `<td>` | `getByRole('cell')` |

### Role Selector Examples

```typescript
// Basic role selection
await page.getByRole('button').click();
// Matches any button

// Role with name
await page.getByRole('button', { name: 'Submit' }).click();
// Matches: <button>Submit</button>
// Matches: <button aria-label="Submit">Send</button>

// Role with regex name
await page.getByRole('button', { name: /submit/i }).click();
// Case-insensitive match

// Role with exact name
await page.getByRole('button', { name: 'Submit', exact: true }).click();
// Only matches exact text

// Heading with level
await page.getByRole('heading', { level: 1 }).textContent();
// Matches: <h1>Title</h1>

// Checkbox with checked state
await page.getByRole('checkbox', { checked: true }).count();
// Counts checked checkboxes

// Button with pressed state
await page.getByRole('button', { pressed: true }).click();
// Matches: <button aria-pressed="true">

// Link with href
await page.getByRole('link', { name: 'Home' }).click();
// Matches: <a href="/">Home</a>
```

### Role Selector with Options

```typescript
// All available options
await page.getByRole('button', {
  name: 'Submit',           // Accessible name
  exact: true,              // Exact name match
  disabled: false,          // Not disabled
  pressed: false,           // Not pressed (toggle buttons)
  checked: false,           // Not checked (checkboxes/radios)
  selected: false,          // Not selected (options)
  expanded: false,          // Not expanded (accordions)
  level: 1,                 // Heading level (h1-h6)
  includeHidden: false,     // Exclude hidden elements
});
```

---

## XPath Selectors

### Purpose
Powerful bidirectional navigation with rich function library for complex DOM relationships.

### Advantages
- Extremely powerful
- Bidirectional navigation (parent/ancestor)
- Rich function library
- Precise positioning

### Disadvantages
- Less readable
- More brittle
- Performance overhead
- Harder to maintain

### When XPath is the Best Choice

```typescript
// 1. Complex parent/ancestor relationships
// Find the form containing a specific error message
const errorForm = page.locator('xpath=//span[@class="error"][text()="Invalid email"]/ancestor::form');

// 2. Multiple conditions with AND/OR logic
// Find buttons that are either "Save" or "Submit" and not disabled
const actionButtons = page.locator('xpath=//button[(text()="Save" or text()="Submit") and not(@disabled)]');

// 3. Complex sibling relationships
// Find the input that comes after a label containing "Password"
const passwordInput = page.locator('xpath=//label[contains(text(), "Password")]/following-sibling::*[1][self::input]');

// 4. Position-based complex selection
// Select every 3rd item in a list, starting from the 2nd
const specificItems = page.locator('xpath=//ul[@class="items"]/li[position() mod 3 = 2]');

// 5. Advanced text matching
// Find elements with specific text patterns
const phoneNumbers = page.locator('xpath=//span[matches(text(), "\\d{3}-\\d{3}-\\d{4}")]');

// 6. Multiple level navigation
// Find a table cell's value based on header and row identifier
const cellValue = page.locator(
  'xpath=//table//tr[td[1][text()="John"]]/td[count(//table//th[text()="Email"]/preceding-sibling::th) + 1]'
);
```

### XPath vs CSS Comparison

| Scenario | XPath | CSS Equivalent | Recommendation |
|----------|-------|----------------|----------------|
| Select by class | `//div[@class="item"]` | `.item` | Use CSS - simpler |
| Parent selection | `//input/parent::div` | Not possible directly | Use XPath when needed |
| Text content | `//button[text()="Save"]` | Not possible directly | Use XPath or `text=` |
| Following sibling | `//label/following-sibling::input` | `label + input` (adjacent only) | XPath for non-adjacent |
| Nth element | `(//button)[3]` | `button:nth-child(3)` | CSS usually better |
| Contains text | `//span[contains(text(), "error")]` | `:has-text("error")` | Use Playwright's has-text |

### XPath Best Practices

```typescript
// ✅ DO: Use specific, readable XPath expressions
await page.locator('xpath=//form[@id="login"]//button[text()="Submit"]').click();

// ❌ DON'T: Use overly complex, brittle paths
await page.locator('xpath=/html/body/div[3]/div[2]/form/div[4]/button[1]').click();

// ✅ DO: Combine with other Playwright features
const form = page.locator('xpath=//form[contains(@class, "login")]');
await form.getByRole('button', { name: 'Submit' }).click();

// ❌ DON'T: Use XPath when simpler selectors work
await page.locator('xpath=//button[@id="submit"]').click();
// Better: await page.locator('#submit').click();
```

---

## Chaining and Filtering

### Chaining Locators

```typescript
// Find button inside specific form
await page
  .locator('form#login')
  .locator('button[type="submit"]')
  .click();

// Chain with built-in methods
await page
  .getByRole('navigation')
  .getByRole('link', { name: 'Products' })
  .click();

// Multiple levels of nesting
await page
  .locator('.container')
  .locator('.card')
  .locator('button.primary')
  .click();
```

### Filtering Locators

```typescript
// Filter by text
await page
  .getByRole('listitem')
  .filter({ hasText: 'Product 123' })
  .getByRole('button', { name: 'Delete' })
  .click();

// Filter by another locator
await page
  .getByRole('listitem')
  .filter({ has: page.getByRole('img') })
  .click();

// Filter with NOT
await page
  .getByRole('button')
  .filter({ hasNotText: 'Cancel' })
  .first()
  .click();

// Multiple filters
await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .filter({ has: page.locator('.badge') })
  .count();
```

### Handling Multiple Elements

```typescript
// Get first matching element
await page.locator('button').first().click();

// Get last matching element
await page.locator('button').last().click();

// Get nth element (0-indexed)
await page.locator('button').nth(2).click(); // 3rd button

// Get all matching elements
const buttons = await page.locator('button').all();
for (const button of buttons) {
  await button.click();
}

// Count matching elements
const count = await page.locator('button').count();
console.log(`Found ${count} buttons`);
```

---

## Best Practices

### Selector Priority (Recommended Order)

```typescript
// 1. 🥇 BEST: Test ID (most stable)
await page.getByTestId('submit-button').click();

// 2. 🥈 GREAT: Role + Name (semantic)
await page.getByRole('button', { name: 'Submit' }).click();

// 3. 🥉 GOOD: Label (for form inputs)
await page.getByLabel('Email').fill('test@example.com');

// 4. 👍 GOOD: Placeholder (for inputs without labels)
await page.getByPlaceholder('Search...').fill('query');

// 5. 👍 GOOD: Text (for user-visible content)
await page.getByText('Welcome').click();

// 6. 👌 OK: CSS (when above don't work)
await page.locator('.submit-button').click();

// 7. ⚠️ LAST RESORT: XPath (only for complex cases)
await page.locator('xpath=//button/parent::form').click();
```

### DO's and DON'Ts

```typescript
// ✅ DO: Use user-facing selectors
await page.getByRole('button', { name: 'Submit' }).click();

// ❌ DON'T: Use implementation details
await page.locator('div.MuiButton-root.MuiButton-contained').click();

// ✅ DO: Use test IDs for dynamic content
await page.getByTestId('user-profile-card').click();

// ❌ DON'T: Use brittle position-based selectors
await page.locator('div:nth-child(3) > button:first-child').click();

// ✅ DO: Combine selectors for precision
await page.locator('form').getByRole('button', { name: 'Submit' }).click();

// ❌ DON'T: Use overly generic selectors
await page.locator('button').click(); // Which button?

// ✅ DO: Use filters for complex scenarios
await page
  .getByRole('row')
  .filter({ hasText: 'John' })
  .getByRole('button', { name: 'Edit' })
  .click();

// ❌ DON'T: Chain too many locators
await page.locator('div').locator('div').locator('div').locator('button').click();
```

**Summary**: You now understand all locator types, when to use each, and how to build resilient selectors. The next chapter covers how to interact with the elements you've located.
