## Chapter 7: Real-World Test Automation Examples

This chapter provides comprehensive, production-ready examples of common test automation scenarios using Playwright locators.

### 7.1 Login Form Automation

**Basic Login Form:**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Login Form Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('https://example.com/login');
  });

  test('successful login with valid credentials', async ({ page }) => {
    // Fill login form using semantic locators
    await page.getByLabel('Username').fill('testuser@example.com');
    await page.getByLabel('Password').fill('SecurePass123!');
    
    // Check "Remember me" if present
    const rememberMe = page.getByRole('checkbox', { name: /remember me/i });
    if (await rememberMe.isVisible()) {
      await rememberMe.check();
    }
    
    // Submit form
    await page.getByRole('button', { name: /log in|sign in/i }).click();
    
    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.getByText(/welcome/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /logout|sign out/i })).toBeVisible();
  });

  test('login fails with invalid credentials', async ({ page }) => {
    await page.getByLabel('Username').fill('invalid@example.com');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Verify error message
    await expect(page.getByRole('alert')).toContainText(/invalid credentials|login failed/i);
    await expect(page).toHaveURL(/.*login/);
    
    // Verify form fields are cleared or retain username
    const usernameValue = await page.getByLabel('Username').inputValue();
    const passwordValue = await page.getByLabel('Password').inputValue();
    expect(passwordValue).toBe('');  // Password should be cleared
  });

  test('validation errors for empty fields', async ({ page }) => {
    // Try to submit without filling fields
    await page.getByRole('button', { name: /log in/i }).click();
    
    // Check for validation messages
    await expect(page.getByText(/username is required|email is required/i)).toBeVisible();
    await expect(page.getByText(/password is required/i)).toBeVisible();
    
    // Verify fields have aria-invalid attribute
    await expect(page.getByLabel('Username')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByLabel('Password')).toHaveAttribute('aria-invalid', 'true');
  });

  test('forgot password link navigation', async ({ page }) => {
    await page.getByRole('link', { name: /forgot password/i }).click();
    await expect(page).toHaveURL(/.*forgot-password|reset-password/);
    await expect(page.getByRole('heading', { name: /reset password|forgot password/i })).toBeVisible();
  });

  test('show/hide password toggle', async ({ page }) => {
    const passwordInput = page.getByLabel('Password');
    const toggleButton = page.getByRole('button', { name: /show password|toggle password/i });
    
    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');
    
    // Click toggle to show
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    
    // Click again to hide
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });
});
```

**SSO/OAuth Login:**

```javascript
test('login with Google OAuth', async ({ page, context }) => {
  await page.goto('https://example.com/login');
  
  // Click Google login button
  await page.getByRole('button', { name: /sign in with google|continue with google/i }).click();
  
  // Wait for OAuth popup/redirect
  const googlePage = await context.waitForEvent('page');
  
  // Fill Google credentials (in popup or redirected page)
  await googlePage.getByLabel('Email or phone').fill('testuser@gmail.com');
  await googlePage.getByRole('button', { name: 'Next' }).click();
  
  await googlePage.getByLabel('Enter your password').fill('GooglePass123');
  await googlePage.getByRole('button', { name: 'Next' }).click();
  
  // Wait for redirect back to main app
  await page.waitForURL(/.*dashboard/);
  await expect(page.getByText(/welcome/i)).toBeVisible();
});
```

### 7.2 E-commerce Product Selection

**Product Listing and Filtering:**

```javascript
test.describe('E-commerce Product Selection', () => {
  test('browse and filter products', async ({ page }) => {
    await page.goto('https://shop.example.com/products');
    
    // Verify products loaded
    await expect(page.locator('.product-card')).toHaveCount.toBeGreaterThan(0);
    
    // Apply category filter
    await page.getByRole('combobox', { name: /category/i }).selectOption('Electronics');
    await expect(page.locator('.product-card')).toHaveCount.toBeGreaterThan(0);
    
    // Apply price range filter
    await page.getByLabel('Min Price').fill('100');
    await page.getByLabel('Max Price').fill('500');
    await page.getByRole('button', { name: /apply filters|filter/i }).click();
    
    // Verify filtered results
    const products = await page.locator('.product-card').all();
    for (const product of products) {
      const priceText = await product.locator('.price').textContent();
      const price = parseFloat(priceText?.replace(/[^0-9.]/g, '') || '0');
      expect(price).toBeGreaterThanOrEqual(100);
      expect(price).toBeLessThanOrEqual(500);
    }
  });

  test('select product and view details', async ({ page }) => {
    await page.goto('https://shop.example.com/products');
    
    // Find specific product
    const product = page.locator('.product-card').filter({ hasText: 'iPhone 15 Pro' });
    
    // Verify product information
    await expect(product.locator('.product-name')).toContainText('iPhone 15 Pro');
    await expect(product.locator('.product-price')).toBeVisible();
    
    // Click to view details
    await product.getByRole('link', { name: /view details|learn more/i }).click();
    
    // Verify product detail page
    await expect(page).toHaveURL(/.*product.*iphone-15-pro/i);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('iPhone 15 Pro');
    await expect(page.locator('.product-description')).toBeVisible();
    await expect(page.locator('.product-images')).toBeVisible();
  });

  test('add product to cart', async ({ page }) => {
    await page.goto('https://shop.example.com/product/iphone-15-pro');
    
    // Select product options
    await page.getByLabel('Color').selectOption('Space Black');
    await page.getByLabel('Storage').selectOption('256GB');
    
    // Select quantity
    await page.getByLabel('Quantity').fill('2');
    
    // Add to cart
    const initialCartCount = await page.getByTestId('cart-count').textContent();
    await page.getByRole('button', { name: /add to cart/i }).click();
    
    // Verify cart updated
    await expect(page.getByRole('alert')).toContainText(/added to cart/i);
    await expect(page.getByTestId('cart-count')).not.toHaveText(initialCartCount || '0');
    
    // Verify cart icon shows updated count
    const newCartCount = await page.getByTestId('cart-count').textContent();
    expect(parseInt(newCartCount || '0')).toBeGreaterThan(parseInt(initialCartCount || '0'));
  });

  test('product comparison', async ({ page }) => {
    await page.goto('https://shop.example.com/products');
    
    // Select multiple products for comparison
    await page.locator('.product-card').nth(0).getByRole('checkbox', { name: /compare/i }).check();
    await page.locator('.product-card').nth(1).getByRole('checkbox', { name: /compare/i }).check();
    await page.locator('.product-card').nth(2).getByRole('checkbox', { name: /compare/i }).check();
    
    // Open comparison view
    await page.getByRole('button', { name: /compare selected|compare products/i }).click();
    
    // Verify comparison table
    await expect(page.getByRole('table', { name: /product comparison/i })).toBeVisible();
    await expect(page.getByRole('row')).toHaveCount.toBeGreaterThanOrEqual(4);  // Header + 3 products
  });
});
```

### 7.3 Dynamic Dropdown Selection

**Standard Dropdown:**

```javascript
test('select from standard dropdown', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Select by visible text
  await page.getByLabel('Country').selectOption('United States');
  await expect(page.getByLabel('Country')).toHaveValue('US');
  
  // Select by value
  await page.getByLabel('State').selectOption({ value: 'CA' });
  await expect(page.getByLabel('State')).toHaveValue('CA');
  
  // Select by index
  await page.getByLabel('City').selectOption({ index: 1 });
});
```

**Custom Dropdown (React Select, Material-UI, etc.):**

```javascript
test('select from custom dropdown', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Click to open dropdown
  await page.getByRole('combobox', { name: 'Country' }).click();
  
  // Wait for options to appear
  await page.getByRole('option', { name: 'United States' }).waitFor({ state: 'visible' });
  
  // Select option
  await page.getByRole('option', { name: 'United States' }).click();
  
  // Verify selection
  await expect(page.getByRole('combobox', { name: 'Country' })).toContainText('United States');
});
```

**Searchable Dropdown:**

```javascript
test('search and select from dropdown', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Click dropdown to open
  await page.getByLabel('Select Country').click();
  
  // Type to search
  await page.getByPlaceholder('Search countries').fill('United');
  
  // Wait for filtered results
  await page.getByRole('option', { name: 'United States' }).waitFor({ state: 'visible' });
  
  // Verify other options are filtered out
  await expect(page.getByRole('option', { name: 'Canada' })).not.toBeVisible();
  
  // Select from filtered results
  await page.getByRole('option', { name: 'United States' }).click();
});
```

**Multi-select Dropdown:**

```javascript
test('select multiple options from dropdown', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Open multi-select dropdown
  await page.getByLabel('Select Skills').click();
  
  // Select multiple options
  await page.getByRole('option', { name: 'JavaScript' }).click();
  await page.getByRole('option', { name: 'Python' }).click();
  await page.getByRole('option', { name: 'TypeScript' }).click();
  
  // Verify all selected
  await expect(page.locator('.selected-skill')).toHaveCount(3);
  await expect(page.locator('.selected-skill')).toContainText(['JavaScript', 'Python', 'TypeScript']);
  
  // Remove one selection
  await page.locator('.selected-skill').filter({ hasText: 'Python' })
    .getByRole('button', { name: /remove|delete/i }).click();
  
  await expect(page.locator('.selected-skill')).toHaveCount(2);
});
```

**Cascading Dropdowns:**

```javascript
test('cascading dropdown selection', async ({ page }) => {
  await page.goto('https://example.com/form');
  
  // Select country
  await page.getByLabel('Country').selectOption('United States');
  
  // Wait for state dropdown to populate
  await page.getByLabel('State').waitFor({ state: 'enabled' });
  await expect(page.getByLabel('State').locator('option')).toHaveCount.toBeGreaterThan(1);
  
  // Select state
  await page.getByLabel('State').selectOption('California');
  
  // Wait for city dropdown to populate
  await page.getByLabel('City').waitFor({ state: 'enabled' });
  await expect(page.getByLabel('City').locator('option')).toHaveCount.toBeGreaterThan(1);
  
  // Select city
  await page.getByLabel('City').selectOption('Los Angeles');
  
  // Verify all selections
  await expect(page.getByLabel('Country')).toHaveValue('US');
  await expect(page.getByLabel('State')).toHaveValue('CA');
  await expect(page.getByLabel('City')).toHaveValue('Los Angeles');
});
```

### 7.4 Calendar Date Selection

**Date Picker Input:**

```javascript
test('select date using date picker', async ({ page }) => {
  await page.goto('https://example.com/booking');
  
  // Click date input to open calendar
  await page.getByLabel('Check-in Date').click();
  
  // Wait for calendar to appear
  await page.locator('.calendar').waitFor({ state: 'visible' });
  
  // Navigate to specific month if needed
  while (await page.getByRole('heading', { name: /december 2024/i }).isHidden()) {
    await page.getByRole('button', { name: /next month/i }).click();
  }
  
  // Select date
  await page.getByRole('button', { name: '15', exact: true }).click();
  
  // Verify date selected
  await expect(page.getByLabel('Check-in Date')).toHaveValue(/12\/15\/2024|2024-12-15/);
});
```

**Date Range Selection:**

```javascript
test('select date range', async ({ page }) => {
  await page.goto('https://example.com/booking');
  
  // Open date range picker
  await page.getByLabel('Select Dates').click();
  
  // Select start date
  await page.getByRole('button', { name: '10' }).first().click();
  
  // Select end date
  await page.getByRole('button', { name: '15' }).first().click();
  
  // Verify range selected
  await expect(page.getByLabel('Check-in')).toHaveValue(/12\/10\/2024/);
  await expect(page.getByLabel('Check-out')).toHaveValue(/12\/15\/2024/);
  
  // Verify nights calculated
  await expect(page.getByText(/5 nights/i)).toBeVisible();
});
```

**Time Picker:**

```javascript
test('select time from picker', async ({ page }) => {
  await page.goto('https://example.com/appointment');
  
  // Open time picker
  await page.getByLabel('Appointment Time').click();
  
  // Select hour
  await page.getByRole('option', { name: '10 AM' }).click();
  
  // Select minutes
  await page.getByRole('option', { name: '30' }).click();
  
  // Verify time selected
  await expect(page.getByLabel('Appointment Time')).toHaveValue('10:30 AM');
});
```

### 7.5 File Upload Scenarios

**Single File Upload:**

```javascript
test('upload single file', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Upload file
  const fileInput = page.getByLabel('Choose file');
  await fileInput.setInputFiles('path/to/document.pdf');
  
  // Verify file name displayed
  await expect(page.getByText('document.pdf')).toBeVisible();
  
  // Submit upload
  await page.getByRole('button', { name: /upload|submit/i }).click();
  
  // Verify success
  await expect(page.getByText(/upload successful|file uploaded/i)).toBeVisible();
});
```

**Multiple File Upload:**

```javascript
test('upload multiple files', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Upload multiple files
  await page.getByLabel('Choose files').setInputFiles([
    'path/to/file1.jpg',
    'path/to/file2.jpg',
    'path/to/file3.jpg'
  ]);
  
  // Verify all files listed
  await expect(page.locator('.file-list-item')).toHaveCount(3);
  await expect(page.getByText('file1.jpg')).toBeVisible();
  await expect(page.getByText('file2.jpg')).toBeVisible();
  await expect(page.getByText('file3.jpg')).toBeVisible();
});
```

**Drag and Drop Upload:**

```javascript
test('drag and drop file upload', async ({ page }) => {
  await page.goto('https://example.com/upload');
  
  // Create file buffer
  const buffer = Buffer.from('Test file content');
  
  // Simulate drag and drop
  const dataTransfer = await page.evaluateHandle((data) => {
    const dt = new DataTransfer();
    const file = new File([data], 'test.txt', { type: 'text/plain' });
    dt.items.add(file);
    return dt;
  }, buffer);
  
  await page.dispatchEvent('.drop-zone', 'drop', { dataTransfer });
  
  // Verify file added
  await expect(page.getByText('test.txt')).toBeVisible();
});
```

### 7.6 Modal Dialog Handling

**Basic Modal:**

```javascript
test('interact with modal dialog', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Verify modal not visible initially
  await expect(page.getByRole('dialog')).not.toBeVisible();
  
  // Open modal
  await page.getByRole('button', { name: /open modal|show dialog/i }).click();
  
  // Verify modal visible
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('heading', { name: /confirm action/i })).toBeVisible();
  
  // Interact with modal content
  await page.getByRole('dialog').getByLabel('Reason').fill('Testing purposes');
  
  // Confirm action
  await page.getByRole('dialog').getByRole('button', { name: /confirm|ok/i }).click();
  
  // Verify modal closed
  await expect(page.getByRole('dialog')).not.toBeVisible();
  
  // Verify action completed
  await expect(page.getByText(/action completed/i)).toBeVisible();
});
```

**Modal with Form:**

```javascript
test('submit form in modal', async ({ page }) => {
  await page.goto('https://example.com/users');
  
  // Open add user modal
  await page.getByRole('button', { name: /add user/i }).click();
  
  const modal = page.getByRole('dialog', { name: /add user/i });
  
  // Fill form in modal
  await modal.getByLabel('First Name').fill('John');
  await modal.getByLabel('Last Name').fill('Doe');
  await modal.getByLabel('Email').fill('john.doe@example.com');
  await modal.getByLabel('Role').selectOption('Admin');
  
  // Submit form
  await modal.getByRole('button', { name: /save|add/i }).click();
  
  // Verify modal closed and user added
  await expect(modal).not.toBeVisible();
  await expect(page.getByText('John Doe')).toBeVisible();
});
```

**Close Modal Methods:**

```javascript
test('close modal using different methods', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Method 1: Close button
  await page.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /close|×/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  
  // Method 2: Cancel button
  await page.getByRole('button', { name: 'Open' }).click();
  await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  
  // Method 3: Escape key
  await page.getByRole('button', { name: 'Open' }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).not.toBeVisible();
  
  // Method 4: Click backdrop
  await page.getByRole('button', { name: 'Open' }).click();
  await page.locator('.modal-backdrop').click({ position: { x: 10, y: 10 } });
  await expect(page.getByRole('dialog')).not.toBeVisible();
});
```

### 7.7 Navigation Menu Testing

**Horizontal Navigation:**

```javascript
test('navigate using top menu', async ({ page }) => {
  await page.goto('https://example.com');
  
  const nav = page.getByRole('navigation', { name: /main|primary/i });
  
  // Click each menu item and verify navigation
  await nav.getByRole('link', { name: 'Home' }).click();
  await expect(page).toHaveURL('/');
  
  await nav.getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL('/products');
  
  await nav.getByRole('link', { name: 'About' }).click();
  await expect(page).toHaveURL('/about');
  
  await nav.getByRole('link', { name: 'Contact' }).click();
  await expect(page).toHaveURL('/contact');
});
```

**Dropdown Menu:**

```javascript
test('navigate using dropdown menu', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Hover over parent menu item
  await page.getByRole('button', { name: 'Products' }).hover();
  
  // Wait for submenu to appear
  await page.getByRole('menu').waitFor({ state: 'visible' });
  
  // Click submenu item
  await page.getByRole('menuitem', { name: 'Electronics' }).click();
  
  // Verify navigation
  await expect(page).toHaveURL('/products/electronics');
});
```

**Mobile Menu (Hamburger):**

```javascript
test('navigate using mobile menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('https://example.com');
  
  // Open mobile menu
  await page.getByRole('button', { name: /menu|navigation/i }).click();
  
  // Verify menu visible
  await expect(page.getByRole('navigation')).toBeVisible();
  
  // Navigate
  await page.getByRole('link', { name: 'Products' }).click();
  await expect(page).toHaveURL('/products');
});
```

### 7.8 Testing Checkboxes and Radio Buttons

**Checkbox Groups:**

```javascript
test('select multiple checkboxes', async ({ page }) => {
  await page.goto('https://example.com/preferences');
  
  // Check multiple options
  await page.getByRole('checkbox', { name: 'Email Notifications' }).check();
  await page.getByRole('checkbox', { name: 'SMS Notifications' }).check();
  await page.getByRole('checkbox', { name: 'Push Notifications' }).check();
  
  // Verify all checked
  await expect(page.getByRole('checkbox', { name: 'Email Notifications' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'SMS Notifications' })).toBeChecked();
  await expect(page.getByRole('checkbox', { name: 'Push Notifications' })).toBeChecked();
  
  // Uncheck one
  await page.getByRole('checkbox', { name: 'SMS Notifications' }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'SMS Notifications' })).not.toBeChecked();
});
```

**Radio Button Groups:**

```javascript
test('select from radio button group', async ({ page }) => {
  await page.goto('https://example.com/survey');
  
  // Select option
  await page.getByRole('radio', { name: 'Excellent' }).check();
  
  // Verify selected
  await expect(page.getByRole('radio', { name: 'Excellent' })).toBeChecked();
  
  // Verify others not selected
  await expect(page.getByRole('radio', { name: 'Good' })).not.toBeChecked();
  await expect(page.getByRole('radio', { name: 'Fair' })).not.toBeChecked();
  
  // Select different option
  await page.getByRole('radio', { name: 'Good' }).check();
  
  // Verify new selection
  await expect(page.getByRole('radio', { name: 'Good' })).toBeChecked();
  await expect(page.getByRole('radio', { name: 'Excellent' })).not.toBeChecked();
});
```

### 7.9 Working with iFrames

**Payment Gateway in iFrame:**

```javascript
test('complete payment in iframe', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  // Fill main page form
  await page.getByLabel('Email').fill('customer@example.com');
  
  // Access payment iframe
  const paymentFrame = page.frameLocator('iframe[title="Secure payment"]');
  
  // Fill payment details
  await paymentFrame.getByLabel('Card number').fill('4242424242424242');
  await paymentFrame.getByLabel('Expiry date').fill('12/25');
  await paymentFrame.getByLabel('CVC').fill('123');
  
  // Submit payment
  await paymentFrame.getByRole('button', { name: /pay|submit/i }).click();
  
  // Verify success on main page
  await expect(page.getByText(/payment successful/i)).toBeVisible();
});
```

### 7.10 Table Data Extraction

**Extract Table Data:**

```javascript
test('extract and validate table data', async ({ page }) => {
  await page.goto('https://example.com/users');
  
  // Get all table rows
  const rows = await page.getByRole('row').all();
  
  // Extract data from each row
  const userData = [];
  for (const row of rows.slice(1)) {  // Skip header row
    const cells = await row.getByRole('cell').all();
    const name = await cells[0].textContent();
    const email = await cells[1].textContent();
    const role = await cells[2].textContent();
    
    userData.push({ name, email, role });
  }
  
  // Verify data
  expect(userData.length).toBeGreaterThan(0);
  expect(userData[0].email).toContain('@');
});
```

**Sort Table:**

```javascript
test('sort table by column', async ({ page }) => {
  await page.goto('https://example.com/users');
  
  // Click column header to sort
  await page.getByRole('columnheader', { name: 'Name' }).click();
  
  // Get sorted data
  const names = await page.getByRole('cell', { name: /^[A-Z]/ }).allTextContents();
  
  // Verify sorted alphabetically
  const sortedNames = [...names].sort();
  expect(names).toEqual(sortedNames);
});
```

**Filter Table:**

```javascript
test('filter table data', async ({ page }) => {
  await page.goto('https://example.com/users');
  
  // Apply filter
  await page.getByPlaceholder('Search users').fill('John');
  
  // Verify filtered results
  const rows = await page.getByRole('row').all();
  for (const row of rows.slice(1)) {
    const text = await row.textContent();
    expect(text?.toLowerCase()).toContain('john');
  }
});
```

**Pagination:**

```javascript
test('navigate table pagination', async ({ page }) => {
  await page.goto('https://example.com/users');
  
  // Verify first page
  await expect(page.getByText('Page 1 of')).toBeVisible();
  
  // Go to next page
  await page.getByRole('button', { name: /next|›/i }).click();
  await expect(page.getByText('Page 2 of')).toBeVisible();
  
  // Go to specific page
  await page.getByRole('button', { name: '5' }).click();
  await expect(page.getByText('Page 5 of')).toBeVisible();
  
  // Go to last page
  await page.getByRole('button', { name: /last|»/i }).click();
  await expect(page.getByText(/Page \d+ of \d+/)).toBeVisible();
});
```

---