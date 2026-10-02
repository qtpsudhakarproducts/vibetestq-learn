## Chapter 3: Advanced Locator Techniques

### 3.1 Chaining Locators

Chain locators to narrow down search scope and create more precise element selection. This is one of Playwright's most powerful features.

**Basic Chaining:**
```javascript
// Chain locators to search within context
await page
  .locator('.product-card')
  .getByRole('button', { name: 'Add to Cart' })
  .click();

// Multiple chaining levels
await page
  .getByRole('article')
  .locator('.header')
  .getByRole('heading')
  .textContent();

// Chain with getByTestId
await page
  .getByTestId('user-profile')
  .getByRole('button', { name: 'Edit' })
  .click();

// Navigation menu chaining
await page
  .getByRole('navigation')
  .getByRole('link', { name: 'Products' })
  .click();
```

**Complex Chaining Patterns:**
```javascript
// Navigate through DOM hierarchy
await page
  .getByRole('main')
  .locator('section.content')
  .getByRole('article')
  .getByRole('button', { name: 'Read More' })
  .click();

// Product card interaction with multiple chains
await page
  .locator('.product-grid')
  .locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Add to Cart' })
  .click();

// Form in specific modal
await page
  .getByRole('dialog', { name: 'Edit Profile' })
  .getByLabel('First Name')
  .fill('John');

await page
  .getByRole('dialog', { name: 'Edit Profile' })
  .getByRole('button', { name: 'Save' })
  .click();

// Table cell in specific row
const cellText = await page
  .getByRole('table')
  .getByRole('row', { name: /John Smith/i })
  .getByRole('cell')
  .nth(2)
  .textContent();
```

**Real-world Examples:**
```javascript
// Multi-level navigation
await page
  .getByRole('navigation', { name: 'Main' })
  .getByRole('button', { name: 'Products' })
  .click();

await page
  .getByRole('menu')
  .getByRole('menuitem', { name: 'Electronics' })
  .click();

// Card-based layouts
await page
  .locator('.product-grid')
  .locator('.product-card')
  .filter({ hasText: 'MacBook Pro' })
  .locator('.price')
  .textContent();

// Nested forms
await page
  .locator('form.checkout-form')
  .locator('.billing-section')
  .getByLabel('Street Address')
  .fill('123 Main St');

// Tab panels
await page
  .getByRole('tab', { name: 'Settings' })
  .click();

await page
  .getByRole('tabpanel', { name: 'Settings' })
  .getByLabel('Email Notifications')
  .check();
```

### 3.2 Filtering Locators

Use `filter()` to narrow down locators based on specific conditions. This is extremely powerful for working with lists and dynamic content.

**Filter by Text:**
```javascript
// Exact text
await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .click();

// Regex text
await page
  .getByRole('listitem')
  .filter({ hasText: /active/i })
  .click();

// Multiple filters
await page
  .getByRole('button')
  .filter({ hasText: 'Submit' })
  .filter({ has: page.locator('.icon-check') })
  .click();
```

**Filter by Nested Elements:**
```javascript
// Has specific child element
await page
  .getByRole('listitem')
  .filter({ has: page.getByRole('button', { name: 'Delete' }) })
  .click();

// Has specific descendant
await page
  .locator('.product-card')
  .filter({ has: page.locator('.badge-new') })
  .first()
  .click();

// Complex filtering with multiple conditions
await page
  .getByRole('article')
  .filter({ 
    has: page.locator('.author', { hasText: 'John Doe' }),
    hasText: 'JavaScript'
  })
  .click();
```

**Filter by Exclusion:**
```javascript
// Exclude elements with specific text
await page
  .getByRole('listitem')
  .filter({ hasNotText: 'Inactive' })
  .count();

// Exclude elements with nested element
await page
  .getByRole('listitem')
  .filter({ hasNot: page.locator('.badge-deleted') })
  .count();

// Combined inclusion and exclusion
await page
  .getByRole('row')
  .filter({ hasText: 'Completed' })
  .filter({ hasNot: page.locator('.cancelled') })
  .count();
```

**Real-world Examples:**
```javascript
// Find active tab in tab list
await page
  .getByRole('tab')
  .filter({ hasText: 'Settings' })
  .filter({ has: page.locator('[aria-selected="true"]') })
  .click();

// Find product with specific features
await page
  .locator('.product-card')
  .filter({ hasText: 'Free Shipping' })
  .filter({ has: page.locator('.rating-5-stars') })
  .filter({ hasNot: page.locator('.out-of-stock') })
  .getByRole('button', { name: 'Add to Cart' })
  .click();

// Find unchecked checkbox in list
await page
  .getByRole('checkbox')
  .filter({ hasNot: page.locator('[checked]') })
  .first()
  .check();

// Filter table rows by status
const completedRows = await page
  .getByRole('row')
  .filter({ hasText: 'Completed' })
  .filter({ hasNot: page.getByText('Cancelled') })
  .count();

// Find button in specific card
await page
  .locator('.card')
  .filter({ hasText: 'Premium Plan' })
  .filter({ has: page.locator('.badge-recommended') })
  .getByRole('button', { name: 'Subscribe' })
  .click();

// Filter list items by multiple criteria
await page
  .getByRole('listitem')
  .filter({ hasText: /priority/i })
  .filter({ has: page.locator('.icon-flag') })
  .filter({ hasNot: page.locator('.completed') })
  .first()
  .click();
```

### 3.3 Locator Operators

Use operators to get specific elements from collections.

**first():**
```javascript
// Get first matching element
await page.getByRole('button').first().click();
await page.locator('.product-card').first().click();
await page.getByText('Edit').first().click();

// First with filters
await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .first()
  .click();

// First in specific context
await page
  .locator('.modal')
  .getByRole('button')
  .first()
  .click();
```

**last():**
```javascript
// Get last matching element
await page.getByRole('button').last().click();
await page.locator('.product-card').last().textContent();
await page.getByText('View More').last().click();

// Last with filter
await page
  .getByRole('tab')
  .filter({ hasText: /settings|profile/i })
  .last()
  .click();

// Last in pagination
await page
  .locator('.pagination-link')
  .last()
  .click();
```

**nth(index):**
```javascript
// Zero-based indexing
await page.getByRole('button').nth(0).click(); // First
await page.getByRole('button').nth(1).click(); // Second
await page.getByRole('button').nth(2).click(); // Third

// Get specific product in list
await page.locator('.product-card').nth(5).click();

// Negative indexing (from end)
await page.getByRole('button').nth(-1).click(); // Last
await page.getByRole('button').nth(-2).click(); // Second to last

// nth with filters
await page
  .getByRole('row')
  .filter({ hasText: 'Active' })
  .nth(2)
  .click();
```

**Real-world Examples:**
```javascript
// Click first search result
await page.locator('.search-result').first().click();

// Get last error message shown
const lastError = await page.locator('.error-message').last().textContent();

// Click 3rd product in list
await page.locator('.product-item').nth(2).click();

// Select first available option
await page
  .getByRole('option')
  .filter({ hasNot: page.locator('[disabled]') })
  .first()
  .click();

// Get last page in pagination
await page.locator('.pagination-link').last().click();

// Click second tab
await page.getByRole('tab').nth(1).click();

// Get nth item in filtered list
await page
  .getByRole('listitem')
  .filter({ hasText: 'Pending' })
  .nth(0)
  .click();

// Click last button in modal
await page
  .getByRole('dialog')
  .getByRole('button')
  .last()
  .click();
```

### 3.4 Counting and Iterating

**count():**
```javascript
// Count matching elements
const buttonCount = await page.getByRole('button').count();
const productCount = await page.locator('.product-card').count();

// Count with filter
const activeCount = await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .count();

// Use in assertions
await expect(page.getByRole('button')).toHaveCount(3);
await expect(page.locator('.product-card')).toHaveCount(10);

// Conditional logic based on count
const count = await page.getByRole('option').count();
if (count > 0) {
  await page.getByRole('option').first().click();
}
```

**all():**
```javascript
// Get all matching elements as array
const buttons = await page.getByRole('button').all();
for (const button of buttons) {
  console.log(await button.textContent());
}

// Get all product names
const products = await page.locator('.product-card h3').all();
const names = [];
for (const product of products) {
  const name = await product.textContent();
  names.push(name);
}

// Conditional actions on all elements
const items = await page.getByRole('listitem').all();
for (const item of items) {
  const text = await item.textContent();
  if (text?.includes('Active')) {
    await item.click();
    break;
  }
}

// Process all elements
const checkboxes = await page.getByRole('checkbox').all();
for (const checkbox of checkboxes) {
  if (!(await checkbox.isChecked())) {
    await checkbox.check();
  }
}
```

**Real-world Examples:**
```javascript
// Verify product count in results
const productCount = await page.locator('.product-card').count();
expect(productCount).toBeGreaterThan(0);
expect(productCount).toBeLessThanOrEqual(20);

// Check all unchecked checkboxes
const checkboxes = await page.getByRole('checkbox').all();
for (const checkbox of checkboxes) {
  await checkbox.check();
}

// Extract all prices from page
const priceElements = await page.locator('.product-price').all();
const prices = [];
for (const element of priceElements) {
  const priceText = await element.textContent();
  const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
  prices.push(price);
}
console.log('Average price:', prices.reduce((a, b) => a + b, 0) / prices.length);

// Verify all items loaded
const expectedCount = 20;
await expect(page.locator('.product-item')).toHaveCount(expectedCount);

// Find and click specific item in list
const listItems = await page.getByRole('listitem').all();
for (const item of listItems) {
  const text = await item.textContent();
  if (text?.includes('Target Item')) {
    await item.click();
    break;
  }
}

// Collect all error messages
const errors = await page.locator('.error-message').all();
const errorMessages = [];
for (const error of errors) {
  errorMessages.push(await error.textContent());
}

// Verify dynamic list length
const initialCount = await page.locator('.item').count();
await page.getByRole('button', { name: 'Load More' }).click();
const newCount = await page.locator('.item').count();
expect(newCount).toBeGreaterThan(initialCount);
```

### 3.5 Locator Methods

**Get Element Properties:**
```javascript
// Text content (including hidden text)
const text = await page.getByRole('heading').textContent();
const buttonText = await page.getByRole('button').first().textContent();

// Inner text (visible text only)
const visibleText = await page.locator('.article').innerText();
const paragraph = await page.locator('p').innerText();

// Inner HTML
const html = await page.locator('.content').innerHTML();
const divContent = await page.locator('div.rich-text').innerHTML();

// Get attribute value
const href = await page.getByRole('link').getAttribute('href');
const className = await page.locator('button').getAttribute('class');
const dataId = await page.locator('div').getAttribute('data-id');
const ariaLabel = await page.getByRole('button').getAttribute('aria-label');

// Get input value
const value = await page.getByLabel('Username').inputValue();
const email = await page.locator('input[type="email"]').inputValue();

// Check states
const isChecked = await page.getByRole('checkbox').isChecked();
const isDisabled = await page.getByRole('button').isDisabled();
const isEnabled = await page.getByRole('button').isEnabled();
const isVisible = await page.getByRole('dialog').isVisible();
const isHidden = await page.locator('.modal').isHidden();
const isEditable = await page.getByLabel('Email').isEditable();
const isFocused = await page.getByLabel('Search').isFocused();

// Bounding box and position
const box = await page.getByRole('button').boundingBox();
// Returns: { x, y, width, height }
```

**Real-world Examples:**
```javascript
// Verify button state before interaction
const submitDisabled = await page
  .getByRole('button', { name: 'Submit' })
  .isDisabled();
if (!submitDisabled) {
  await page.getByRole('button', { name: 'Submit' }).click();
}

// Extract and validate product details
const productName = await page.locator('.product-name').textContent();
const productPrice = await page.locator('.product-price').textContent();
const productId = await page.locator('.product-card').getAttribute('data-id');
const productInStock = await page.locator('.in-stock').isVisible();

expect(productName).toContain('iPhone');
expect(productPrice).toMatch(/\$\d+/);
expect(productId).toBeTruthy();
expect(productInStock).toBe(true);

// Check form state
const termsChecked = await page
  .getByLabel('I agree to terms')
  .isChecked();
expect(termsChecked).toBe(true);

const emailValue = await page.getByLabel('Email').inputValue();
expect(emailValue).toContain('@');

// Verify modal state
const modalVisible = await page.getByRole('dialog').isVisible();
expect(modalVisible).toBe(true);

const modalTitle = await page
  .getByRole('dialog')
  .getByRole('heading')
  .textContent();
expect(modalTitle).toBe('Confirm Action');

// Get navigation state
const activeLink = await page
  .getByRole('link', { name: 'Products' })
  .getAttribute('aria-current');
expect(activeLink).toBe('page');

// Extract data from table
const cells = await page
  .getByRole('row', { name: /John/i })
  .getByRole('cell')
  .all();

const rowData = [];
for (const cell of cells) {
  rowData.push(await cell.textContent());
}

// Check element dimensions
const buttonBox = await page.getByRole('button').boundingBox();
expect(buttonBox?.width).toBeGreaterThan(0);
expect(buttonBox?.height).toBeGreaterThan(0);
```

### 3.6 Waiting for Elements

Playwright auto-waits by default, but sometimes explicit waiting is useful for specific states or conditions.

**waitFor() with States:**
```javascript
// Wait for element to be visible
await page.getByRole('button').waitFor({ state: 'visible' });
await page.locator('.content').waitFor({ state: 'visible' });

// Wait for element to be hidden
await page.locator('.loading-spinner').waitFor({ state: 'hidden' });
await page.getByText('Loading...').waitFor({ state: 'hidden' });

// Wait for element to be attached to DOM
await page.getByRole('dialog').waitFor({ state: 'attached' });
await page.locator('.dynamic-content').waitFor({ state: 'attached' });

// Wait for element to be detached from DOM
await page.locator('.notification').waitFor({ state: 'detached' });
await page.getByRole('alert').waitFor({ state: 'detached' });

// Wait with custom timeout
await page.getByRole('button').waitFor({ 
  state: 'visible', 
  timeout: 10000 // 10 seconds
});
```

**Real-world Examples:**
```javascript
// Wait for loading to complete
await page.locator('.loading-spinner').waitFor({ state: 'hidden' });
await page.getByText('Loading...').waitFor({ state: 'detached' });

// Wait for modal to appear and be ready
await page.getByRole('dialog').waitFor({ state: 'visible' });
await page.getByRole('dialog').waitFor({ state: 'attached' });

// Wait for dynamic content to load
await page.getByTestId('product-list').waitFor({ state: 'attached' });
await page.locator('.product-card').first().waitFor({ state: 'visible' });

// Wait for notification to disappear
await page.locator('.success-message').waitFor({ 
  state: 'detached',
  timeout: 5000 
});

// Wait for animation to complete
await page.locator('.modal').waitFor({ state: 'visible' });
await page.waitForTimeout(300); // Wait for CSS animation
await page.locator('.modal .content').waitFor({ state: 'visible' });

// Wait for element before interaction
const button = page.getByRole('button', { name: 'Submit' });
await button.waitFor({ state: 'visible' });
await button.waitFor({ state: 'enabled' }); // Note: Not a valid state, use isEnabled()
await button.click();

// Wait for multiple conditions
await page.getByRole('button').waitFor({ state: 'visible' });
await expect(page.getByRole('button')).toBeEnabled();
await page.getByRole('button').click();
```

**Available States:**
- `'attached'` - Element is attached to DOM
- `'detached'` - Element is detached from DOM
- `'visible'` - Element is visible
- `'hidden'` - Element is hidden

**Note:** For checking enabled/disabled state, use assertions:
```javascript
await expect(page.getByRole('button')).toBeEnabled();
await expect(page.getByRole('button')).not.toBeDisabled();
```

---