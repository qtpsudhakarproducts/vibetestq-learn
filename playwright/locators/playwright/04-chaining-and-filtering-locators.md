## Chapter 4: Chaining and Filtering Locators

### 4.1 Complex Chaining Patterns

Combine multiple locators to create precise element selection with multiple levels of context.

```javascript
// Multi-level DOM navigation
await page
  .getByRole('main')
  .locator('section.products')
  .getByRole('article')
  .filter({ hasText: 'Featured' })
  .getByRole('button', { name: 'View Details' })
  .click();

// Product card with multiple filters
await page
  .locator('.product-grid')
  .locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .filter({ has: page.locator('.in-stock') })
  .filter({ hasNot: page.locator('.discontinued') })
  .getByRole('button', { name: 'Add to Cart' })
  .click();

// Form in specific dialog
await page
  .getByRole('dialog', { name: 'Edit Profile' })
  .getByLabel('First Name')
  .fill('John');

await page
  .getByRole('dialog', { name: 'Edit Profile' })
  .getByLabel('Last Name')
  .fill('Doe');

await page
  .getByRole('dialog')
  .getByRole('button', { name: 'Save Changes' })
  .click();

// Table cell in specific row
const cellValue = await page
  .getByRole('table')
  .getByRole('row', { name: /John Smith/i })
  .getByRole('cell')
  .nth(2)
  .textContent();

// Nested navigation menus
await page
  .getByRole('navigation', { name: 'Main' })
  .getByRole('button', { name: 'Categories' })
  .click();

await page
  .getByRole('menu')
  .getByRole('menuitem', { name: 'Electronics' })
  .hover();

await page
  .getByRole('menu')
  .getByRole('menuitem', { name: 'Laptops' })
  .click();
```

### 4.2 Advanced Filtering

Combine multiple filter conditions for highly specific targeting.

```javascript
// Multiple text filters
await page
  .getByRole('listitem')
  .filter({ hasText: 'Active' })
  .filter({ hasText: 'Priority' })
  .filter({ hasText: /high/i })
  .click();

// Nested locator filters
await page
  .locator('.product-card')
  .filter({ has: page.locator('.badge-new') })
  .filter({ has: page.locator('.rating-5-stars') })
  .filter({ hasText: 'iPhone' })
  .filter({ hasNot: page.locator('.out-of-stock') })
  .first()
  .click();

// Complex filter chains
await page
  .getByRole('row')
  .filter({ hasText: 'Completed' })
  .filter({ has: page.getByRole('button', { name: 'Download' }) })
  .filter({ hasNot: page.locator('.expired') })
  .filter({ hasNot: page.locator('.deleted') })
  .getByRole('button', { name: 'Download' })
  .click();

// Combining filters with locator chains
await page
  .getByRole('main')
  .locator('.card-container')
  .locator('.card')
  .filter({ hasText: 'Premium' })
  .filter({ has: page.locator('.badge-recommended') })
  .filter({ hasNot: page.locator('[disabled]') })
  .getByRole('button', { name: 'Subscribe' })
  .click();
```

### 4.3 Scoping Searches

Limit locator scope to specific page regions for better performance and specificity.

```javascript
// Search within main content
const mainContent = page.getByRole('main');
const heading = await mainContent.getByRole('heading', { level: 1 }).textContent();
await mainContent.getByRole('button', { name: 'Submit' }).click();
const paragraph = await mainContent.locator('p').first().textContent();

// Search within navigation
const nav = page.getByRole('navigation');
await nav.getByRole('link', { name: 'Home' }).click();
await nav.getByRole('link', { name: 'Products' }).click();
await nav.getByRole('button', { name: 'Menu' }).click();

// Search within specific section
const profileSection = page.locator('section[data-section="profile"]');
await profileSection.getByLabel('Username').fill('johndoe');
await profileSection.getByLabel('Email').fill('john@example.com');
await profileSection.getByRole('button', { name: 'Save' }).click();

// Search within modal dialog
const modal = page.getByRole('dialog', { name: 'Confirm Action' });
await modal.getByLabel('Reason').fill('Testing purposes');
await modal.getByRole('button', { name: 'Confirm' }).click();

// Search within specific form
const loginForm = page.locator('form.login-form');
await loginForm.getByLabel('Username').fill('admin');
await loginForm.getByLabel('Password').fill('password123');
await loginForm.getByRole('button', { name: 'Login' }).click();
```

**Real-world Examples:**
```javascript
// Product filters in sidebar
const sidebar = page.locator('.sidebar-filters');
await sidebar.getByLabel('Category').selectOption('Electronics');
await sidebar.getByLabel('Price Range').fill('500-1500');
await sidebar.getByLabel('Brand').selectOption('Apple');
await sidebar.getByRole('checkbox', { name: 'Free Shipping' }).check();
await sidebar.getByRole('button', { name: 'Apply Filters' }).click();

// Actions within specific product card
const productCard = page
  .locator('.product-card')
  .filter({ hasText: 'iPhone 15 Pro' });
  
await productCard.getByRole('button', { name: 'Add to Wishlist' }).click();
const price = await productCard.locator('.price').textContent();
const rating = await productCard.locator('.rating').textContent();
const availability = await productCard.locator('.stock-status').textContent();

console.log({ price, rating, availability });

// Form within specific tab panel
const settingsTab = page.getByRole('tabpanel', { name: 'Settings' });
await settingsTab.getByLabel('Email Notifications').check();
await settingsTab.getByLabel('SMS Notifications').uncheck();
await settingsTab.getByLabel('Language').selectOption('English');
await settingsTab.getByLabel('Timezone').selectOption('America/New_York');
await settingsTab.getByRole('button', { name: 'Save Settings' }).click();

// Table operations within specific container
const dataTable = page.getByRole('table', { name: 'User Data' });
const rowCount = await dataTable.getByRole('row').count();
await dataTable.getByRole('row', { name: /John/i }).getByRole('button', { name: 'Edit' }).click();
await dataTable.getByRole('columnheader', { name: 'Name' }).click(); // Sort by name
```

### 4.4 Combining with Other Selectors

Mix different locator strategies for optimal results in complex scenarios.

```javascript
// Role + CSS
await page
  .getByRole('navigation')
  .locator('.user-menu')
  .getByRole('button', { name: 'Logout' })
  .click();

// Label + TestId + Role
await page.getByLabel('Search').fill('laptop');
await page.getByTestId('search-button').click();
await page.getByTestId('results').getByRole('heading').textContent();

// Text + Role within TestId
await page
  .getByTestId('product-card-123')
  .getByText('iPhone 15')
  .click();
  
await page
  .getByTestId('product-card-123')
  .getByRole('button', { name: 'Buy' })
  .click();

// XPath + Role (when necessary)
await page
  .locator('//div[@class="complex-container"]')
  .getByRole('button', { name: 'Submit' })
  .click();

// Multiple strategies in sequence
await page
  .locator('form#checkout')
  .getByLabel('Credit Card Number')
  .fill('4111111111111111');

await page
  .getByRole('dialog')
  .locator('.payment-section')
  .getByTestId('cvv-input')
  .fill('123');

// Combining CSS pseudo-classes with roles
await page
  .locator('.product-list')
  .locator('.product-card:not(.sold-out)')
  .getByRole('button', { name: 'Add to Cart' })
  .first()
  .click();
```