## Chapter 2: Built-in Locator Strategies

### 2.1 getByRole() - Recommended Primary Strategy

`getByRole()` is the most resilient and accessible locator strategy. It queries elements by their ARIA role, which represents how elements appear to assistive technologies and users.

**Common ARIA Roles:**
- `button` - Buttons and clickable elements
- `link` - Hyperlinks  
- `textbox` - Text input fields
- `checkbox` - Checkboxes
- `radio` - Radio buttons
- `combobox` - Dropdown/select elements
- `listbox` - List boxes
- `option` - Dropdown options
- `heading` - Headings (h1-h6)
- `img` - Images
- `table` - Tables
- `row` - Table rows
- `cell` - Table cells
- `dialog` - Modal dialogs
- `alert` - Alert messages
- `alertdialog` - Alert dialogs
- `navigation` - Navigation sections
- `main` - Main content area
- `banner` - Header/banner
- `contentinfo` - Footer
- `form` - Forms
- `search` - Search regions
- `article` - Articles
- `list` - Lists (ul, ol)
- `listitem` - List items (li)

**Basic Usage:**
```javascript
// Simple role selection
await page.getByRole('button').click();
await page.getByRole('link').click();
await page.getByRole('textbox').fill('text');

// Role with accessible name
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByRole('link', { name: 'Sign Up' }).click();
await page.getByRole('textbox', { name: 'Email' }).fill('user@example.com');

// Checkboxes and radios
await page.getByRole('checkbox', { name: 'I agree' }).check();
await page.getByRole('radio', { name: 'Male' }).check();
```

**Advanced Options:**
```javascript
// Partial name match (regex)
await page.getByRole('button', { name: /submit/i }).click();
await page.getByRole('link', { name: /sign.?up/i }).click();

// State filters
await page.getByRole('checkbox', { checked: true }).count();
await page.getByRole('button', { disabled: true }).count();
await page.getByRole('button', { disabled: false }).click();

// Expanded state (for dropdowns, accordions)
await page.getByRole('button', { expanded: true }).click();
await page.getByRole('button', { expanded: false }).click();

// Pressed state (toggle buttons)
await page.getByRole('button', { pressed: true }).count();

// Selected state (for options, tabs)
await page.getByRole('option', { selected: true }).textContent();
await page.getByRole('tab', { selected: true }).getAttribute('aria-label');

// Heading levels
await page.getByRole('heading', { level: 1 }).textContent();
await page.getByRole('heading', { level: 2, name: 'Overview' }).click();
await page.getByRole('heading', { level: 3, name: /introduction/i }).isVisible();
```

**Real-world Examples:**
```javascript
// Login form using roles
await page.getByRole('textbox', { name: 'Username' }).fill('admin');
await page.getByRole('textbox', { name: 'Password' }).fill('password123');
await page.getByRole('button', { name: 'Login' }).click();

// Navigation menu
await page.getByRole('navigation').getByRole('link', { name: 'Products' }).click();
await page.getByRole('navigation').getByRole('link', { name: /contact/i }).click();

// Table interaction
const row = page.getByRole('row', { name: 'John Smith' });
await row.getByRole('button', { name: 'Edit' }).click();
await row.getByRole('cell').nth(2).textContent();

// Modal dialog
await page.getByRole('button', { name: 'Open Dialog' }).click();
await page.getByRole('dialog').getByRole('button', { name: 'Confirm' }).click();
await page.getByRole('dialog').getByRole('button', { name: 'Cancel' }).click();

// Form with multiple inputs
await page.getByRole('textbox', { name: 'First Name' }).fill('John');
await page.getByRole('textbox', { name: 'Last Name' }).fill('Doe');
await page.getByRole('textbox', { name: 'Email' }).fill('john@example.com');
await page.getByRole('checkbox', { name: 'Subscribe to newsletter' }).check();
await page.getByRole('button', { name: 'Register' }).click();
```

**Why getByRole() is Best:**
- Matches how users and assistive technologies perceive elements
- Encourages accessible web development
- Resilient to implementation changes
- Works with semantic HTML and ARIA attributes
- Clear and readable test code

### 2.2 getByLabel() - Form Elements

`getByLabel()` locates form controls by their associated label text. This is the preferred way to locate form inputs because it represents how users identify form fields.

**HTML Label Association Methods:**
```html
<!-- Method 1: for attribute (most common) -->
<label for="username">Username</label>
<input id="username" type="text">

<!-- Method 2: Wrapping label -->
<label>
  Username
  <input type="text">
</label>

<!-- Method 3: aria-labelledby -->
<span id="user-label">Username</span>
<input aria-labelledby="user-label" type="text">

<!-- Method 4: aria-label -->
<input aria-label="Username" type="text">
```

**Basic Usage:**
```javascript
// Exact label match
await page.getByLabel('Username').fill('admin');
await page.getByLabel('Password').fill('password123');
await page.getByLabel('Email Address').fill('user@example.com');

// Partial match with regex
await page.getByLabel(/user/i).fill('admin');
await page.getByLabel(/email/i).fill('user@example.com');

// Checkbox/radio with label
await page.getByLabel('I agree to terms and conditions').check();
await page.getByLabel('Remember me').check();
await page.getByLabel('Male').check();
await page.getByLabel('Female').check();

// Select/dropdown by label
await page.getByLabel('Country').selectOption('United States');
await page.getByLabel('Language').selectOption('English');

// Exact option (when multiple labels contain same text)
await page.getByLabel('Username', { exact: true }).fill('admin');
```

**Advanced Usage:**
```javascript
// Multiple fields with similar labels
await page.getByLabel('Street Address').fill('123 Main St');
await page.getByLabel('Billing Address').fill('456 Oak Ave');

// Label within specific container
await page.locator('.billing-section').getByLabel('Email').fill('billing@example.com');
await page.locator('.shipping-section').getByLabel('Email').fill('shipping@example.com');

// Label for textarea
await page.getByLabel('Comments').fill('This is a comment');

// Label for complex inputs
await page.getByLabel('Date of Birth').fill('01/15/1990');
await page.getByLabel('Phone Number').fill('555-123-4567');
```

**Real-world Examples:**
```javascript
// Registration form
await page.getByLabel('First Name').fill('John');
await page.getByLabel('Last Name').fill('Doe');
await page.getByLabel('Email').fill('john@example.com');
await page.getByLabel('Password').fill('SecurePass123');
await page.getByLabel('Confirm Password').fill('SecurePass123');
await page.getByLabel('Date of Birth').fill('01/15/1990');
await page.getByLabel('Gender').selectOption('Male');
await page.getByLabel('Country').selectOption('United States');
await page.getByLabel('I agree to terms and conditions').check();
await page.getByLabel('Subscribe to newsletter').check();
await page.getByRole('button', { name: 'Register' }).click();

// Search form with filters
await page.getByLabel('Search').fill('laptop');
await page.getByLabel('Category').selectOption('Electronics');
await page.getByLabel('Brand').selectOption('Apple');
await page.getByLabel('Min Price').fill('500');
await page.getByLabel('Max Price').fill('2000');
await page.getByLabel('In Stock Only').check();
await page.getByRole('button', { name: 'Search' }).click();

// Profile update form
await page.getByLabel('Display Name').fill('JohnD');
await page.getByLabel('Bio').fill('Software engineer and tech enthusiast');
await page.getByLabel('Website').fill('https://johndoe.com');
await page.getByLabel('Twitter Handle').fill('@johndoe');
await page.getByLabel('Public Profile').check();
await page.getByRole('button', { name: 'Save Changes' }).click();

// Credit card form
await page.getByLabel('Card Number').fill('4111 1111 1111 1111');
await page.getByLabel('Cardholder Name').fill('John Doe');
await page.getByLabel('Expiration Date').fill('12/25');
await page.getByLabel('CVV').fill('123');
await page.getByLabel('Billing ZIP Code').fill('12345');
```

**Best Practices:**
- Always prefer `getByLabel()` for form inputs
- Encourages proper labeling for accessibility
- More resilient than using IDs or names
- Matches how users understand forms
- Works well with internationalization (different languages)

### 2.3 getByPlaceholder() - Input Placeholders

`getByPlaceholder()` locates input elements by their placeholder attribute. This is useful when labels are not present or when placeholder text is the primary identifier.

**Basic Usage:**
```javascript
// Exact placeholder match
await page.getByPlaceholder('Enter username').fill('admin');
await page.getByPlaceholder('Search products...').fill('laptop');
await page.getByPlaceholder('you@example.com').fill('user@test.com');
await page.getByPlaceholder('Type your message').fill('Hello!');

// Partial match with regex
await page.getByPlaceholder(/search/i).fill('query');
await page.getByPlaceholder(/email/i).fill('user@example.com');

// Exact option
await page.getByPlaceholder('Enter username', { exact: true }).fill('admin');
```

**Real-world Examples:**
```javascript
// Search bar variations
await page.getByPlaceholder('Search for products').fill('iPhone 15');
await page.getByPlaceholder('Search').press('Enter');
await page.getByPlaceholder('What are you looking for?').fill('laptop');

// Quick filters in data tables
await page.getByPlaceholder('Filter by name').fill('John');
await page.getByPlaceholder('Filter by email').fill('@example.com');
await page.getByPlaceholder('Filter by date').fill('2024-01-15');
await page.getByPlaceholder('Filter by status').fill('active');

// Chat interfaces
await page.getByPlaceholder('Type a message...').fill('Hello, how can I help?');
await page.getByPlaceholder('Type a message...').press('Enter');
await page.getByPlaceholder('Search messages').fill('order status');

// Comment sections
await page.getByPlaceholder('Add a comment...').fill('Great article!');
await page.getByPlaceholder('Write a reply...').fill('Thanks for sharing');

// Inline editing
await page.getByPlaceholder('Enter task name').fill('Complete documentation');
await page.getByPlaceholder('Add notes').fill('Review by end of week');

// Search with suggestions
await page.getByPlaceholder('Search or enter URL').fill('playwright');
await page.getByPlaceholder('Search GitHub').fill('microsoft/playwright');
```

**When to Use Placeholders:**
- Input has meaningful placeholder but no label
- Quick search/filter fields
- Inline editing scenarios
- Chat and messaging interfaces
- When placeholder is the primary UX identifier

**Limitations:**
- Placeholders disappear when user types
- Not ideal for accessibility (prefer labels)
- May change more frequently than labels
- Not visible once field has value

### 2.4 getByText() - Text Content

`getByText()` locates elements containing specific text content. This is powerful for clicking links, buttons, or verifying content presence.

**Basic Usage:**
```javascript
// Exact text match
await page.getByText('Submit').click();
await page.getByText('Sign Up').click();
await page.getByText('Welcome, John!').isVisible();
await page.getByText('Total: $99.99').textContent();

// Partial match (substring)
await page.getByText('Submit', { exact: false }).click();
await page.getByText('Welcome').isVisible(); // Matches "Welcome, John!"

// Regex match (case-insensitive, partial)
await page.getByText(/sign up/i).click();
await page.getByText(/submit|send/i).click();
await page.getByText(/^error:/i).isVisible();
await page.getByText(/\d+ items/i).textContent();

// Text in specific element type
await page.locator('button').getByText('Submit').click();
await page.locator('a').getByText('Learn More').click();
await page.locator('.product-card').getByText('iPhone 15').click();
```

**Important Notes:**
- Matches text in element and all descendants
- Case-sensitive by default (use regex with `i` flag for case-insensitive)
- Trims leading/trailing whitespace automatically
- Normalizes whitespace within text
- Matches visible text only (ignores hidden elements)

**Real-world Examples:**
```javascript
// Navigation links
await page.getByText('Home').click();
await page.getByText('Products').click();
await page.getByText('Contact Us').click();
await page.getByText('My Account').click();

// Product selection
await page.getByText('iPhone 15 Pro').click();
await page.getByText('Add to Cart').click();
await page.getByText('View Details').click();
await page.getByText('Compare').click();

// Verify messages and notifications
await expect(page.getByText('Order placed successfully!')).toBeVisible();
await expect(page.getByText('Error: Invalid credentials')).toBeVisible();
await expect(page.getByText('Welcome back!')).toBeVisible();
await expect(page.getByText(/item.+added to cart/i)).toBeVisible();

// Click buttons by text
await page.getByText('Save Changes').click();
await page.getByText('Delete').click();
await page.getByText('Confirm').click();
await page.getByText('Cancel').click();

// Select items from lists
await page.getByText('Option 1').click();
await page.getByText('United States').click();
await page.getByText('English').click();

// Click text in specific context
await page.locator('.modal').getByText('Confirm').click();
await page.locator('.dropdown-menu').getByText('Logout').click();
await page.locator('.sidebar').getByText('Settings').click();
await page.locator('nav').getByText('Dashboard').click();

// Verify dynamic content
const orderNumber = await page.getByText(/Order #\d+/).textContent();
const totalPrice = await page.getByText(/Total: \$[\d.]+/).textContent();
const itemCount = await page.getByText(/\d+ items?/).textContent();

// Click partial text
await page.getByText('Show more', { exact: false }).click(); // Matches "Show more details"
await page.getByText('Read').click(); // Could match "Read more", "Read article", etc.
```

**Advanced Patterns:**
```javascript
// Multiple occurrences - use nth or filter
await page.getByText('Edit').nth(0).click(); // First Edit button
await page.getByText('Edit').last().click(); // Last Edit button

// Text with specific styling/class
await page.locator('.error-message').getByText('Invalid').isVisible();
await page.locator('.success').getByText('Saved').isVisible();

// Combining with other locators
await page.getByRole('button').getByText('Submit').click();
await page.getByRole('link').getByText('Learn More').click();

// Verify text NOT present
await expect(page.getByText('Loading...')).not.toBeVisible();
await expect(page.getByText('Error')).toHaveCount(0);
```

### 2.5 getByAltText() - Image Elements

`getByAltText()` locates images by their alt attribute, which describes images for accessibility and should represent the image's purpose or content.

**Basic Usage:**
```javascript
// Exact alt text match
await page.getByAltText('Company Logo').click();
await page.getByAltText('Product Image').isVisible();
await page.getByAltText('User Avatar').click();
await page.getByAltText('Profile Picture').getAttribute('src');

// Partial match with regex
await page.getByAltText(/logo/i).click();
await page.getByAltText(/product/i).isVisible();

// Exact option
await page.getByAltText('Product Image', { exact: true }).click();
```

**Real-world Examples:**
```javascript
// Click logo to go home
await page.getByAltText('Company Logo').click();
await page.getByAltText('Home').click();
await page.getByAltText('Back to homepage').click();

// Verify images loaded
await expect(page.getByAltText('Product Image')).toBeVisible();
await expect(page.getByAltText('Hero Banner')).toBeVisible();
await expect(page.getByAltText('Category Icon')).toBeVisible();

// Click product images
await page.getByAltText('iPhone 15 Pro').click();
await page.getByAltText('Samsung Galaxy S24').click();
await page.getByAltText('MacBook Pro').click();

// Gallery navigation
await page.getByAltText('Next slide').click();
await page.getByAltText('Previous slide').click();
await page.getByAltText('Close gallery').click();

// User profile interactions
await page.getByAltText('User Avatar').click();
await page.getByAltText('Change profile picture').click();
await page.getByAltText('User settings').click();

// Verify avatar/thumbnail
await expect(page.getByAltText('John Doe avatar')).toBeVisible();
const avatarSrc = await page.getByAltText('Profile picture').getAttribute('src');
expect(avatarSrc).toContain('avatars');

// Icon buttons
await page.getByAltText('Search icon').click();
await page.getByAltText('Menu icon').click();
await page.getByAltText('Cart icon').click();
```

**Best Practices:**
- Always provide meaningful alt text for images
- Alt text should describe the image's purpose, not just appearance
- For decorative images, use empty alt text (`alt=""`)
- Alt text helps with accessibility and SEO
- Can be used to verify image loaded correctly

### 2.6 getByTitle() - Title Attribute

`getByTitle()` locates elements by their title attribute, which typically provides tooltip text on hover.

**Basic Usage:**
```javascript
// Exact title match
await page.getByTitle('Close').click();
await page.getByTitle('Settings').click();
await page.getByTitle('Help').click();
await page.getByTitle('Open menu').click();

// Partial match with regex
await page.getByTitle(/close/i).click();
await page.getByTitle(/settings/i).click();

// Exact option
await page.getByTitle('Close', { exact: true }).click();
```

**Real-world Examples:**
```javascript
// Toolbar buttons with icons
await page.getByTitle('Save').click();
await page.getByTitle('Delete').click();
await page.getByTitle('Edit').click();
await page.getByTitle('Print').click();
await page.getByTitle('Share').click();

// Modal/dialog actions
await page.getByTitle('Close dialog').click();
await page.getByTitle('Minimize').click();
await page.getByTitle('Maximize').click();

// Icon-only buttons
await page.getByTitle('Search').click();
await page.getByTitle('Menu').click();
await page.getByTitle('User profile').click();
await page.getByTitle('Notifications').click();

// Social media buttons
await page.getByTitle('Share on Facebook').click();
await page.getByTitle('Share on Twitter').click();
await page.getByTitle('Share on LinkedIn').click();

// Navigation controls
await page.getByTitle('Next page').click();
await page.getByTitle('Previous page').click();
await page.getByTitle('First page').click();
await page.getByTitle('Last page').click();

// Verify tooltip presence
await expect(page.getByTitle('More information')).toBeVisible();
const titleText = await page.getByTitle('Download').getAttribute('title');
expect(titleText).toBe('Download');
```

**When to Use Title:**
- Icon-only buttons without visible text
- Elements with tooltip information
- When title is the primary identifier
- Toolbar and action buttons
- Close/minimize/maximize controls

### 2.7 getByTestId() - Test IDs

`getByTestId()` locates elements by their `data-testid` attribute (or custom configured attribute). This is useful when semantic locators are insufficient or for complex components.

**Default Attribute: `data-testid`**
```html
<button data-testid="submit-button">Submit</button>
<input data-testid="username-input" type="text">
<div data-testid="error-message">Error occurred</div>
```

**Basic Usage:**
```javascript
// Using default data-testid
await page.getByTestId('submit-button').click();
await page.getByTestId('username-input').fill('admin');
await page.getByTestId('error-message').textContent();
await page.getByTestId('user-profile-card').isVisible();

// Test IDs with numbers
await page.getByTestId('product-card-123').click();
await page.getByTestId('user-row-5').getByRole('button', { name: 'Edit' }).click();
```

**Configure Custom Attribute:**
```javascript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    testIdAttribute: 'data-test-id' // or 'data-test', 'data-automation-id', etc.
  }
});
```

**Real-world Examples:**
```javascript
// Form elements
await page.getByTestId('email-input').fill('user@example.com');
await page.getByTestId('password-input').fill('password123');
await page.getByTestId('remember-me-checkbox').check();
await page.getByTestId('submit-form').click();

// Navigation components
await page.getByTestId('nav-home').click();
await page.getByTestId('nav-products').click();
await page.getByTestId('nav-cart').click();
await page.getByTestId('nav-profile').click();

// Dynamic content
await page.getByTestId('user-profile-card').isVisible();
await page.getByTestId('product-list').getByTestId('product-card').count();
const productName = await page.getByTestId('product-name-123').textContent();

// Complex UI components
await page.getByTestId('date-picker').click();
await page.getByTestId('calendar-day-15').click();
await page.getByTestId('time-picker-hour').selectOption('10');
await page.getByTestId('modal-confirm').click();

// Lists and grids
await page.getByTestId('user-list').getByTestId('user-item-1').click();
await page.getByTestId('data-grid').getByTestId('row-5').getByTestId('edit-button').click();

// Status indicators
await expect(page.getByTestId('loading-spinner')).toBeHidden();
await expect(page.getByTestId('success-message')).toBeVisible();
await expect(page.getByTestId('error-banner')).not.toBeVisible();

// Combining with other locators
await page.getByTestId('product-card-123')
  .getByRole('button', { name: 'Add to Cart' })
  .click();

await page.getByTestId('user-form')
  .getByLabel('Email')
  .fill('user@example.com');
```

**When to Use Test IDs:**
- Complex component libraries (Material-UI, Ant Design, etc.)
- Dynamic IDs or classes that change frequently
- Elements without good semantic attributes
- Specific instances in lists or grids
- When you control the HTML markup
- Temporary solution during development

**Best Practices:**
- Use semantic locators first (getByRole, getByLabel)
- Test IDs should be descriptive and consistent
- Establish naming conventions (e.g., `component-action-id`)
- Don't overuse—prefer user-centric locators
- Great for temporary locators during rapid development
- Consider data attributes for identification rather than meaning

### 2.8 locator() - CSS and XPath

`page.locator()` accepts CSS selectors or XPath expressions. Use this when built-in locators are insufficient.

**CSS Selectors:**
```javascript
// By ID
await page.locator('#username').fill('admin');
await page.locator('#submit-btn').click();

// By class
await page.locator('.submit-button').click();
await page.locator('.product-card').first().click();

// By attribute
await page.locator('[type="email"]').fill('user@example.com');
await page.locator('[data-product="123"]').click();

// Complex CSS
await page.locator('.product-grid .product-card:first-child').click();
await page.locator('input[name="username"]').fill('admin');
await page.locator('button.primary:not(:disabled)').click();

// Descendant selectors
await page.locator('.modal .submit-button').click();
await page.locator('form.login-form input[type="text"]').fill('admin');

// Pseudo-classes
await page.locator('button:nth-child(2)').click();
await page.locator('input:first-of-type').fill('text');
await page.locator('li:last-child').click();
```

**XPath:**
```javascript
// Start XPath with '//' or 'xpath='
await page.locator('//button[text()="Submit"]').click();
await page.locator('xpath=//button[text()="Submit"]').click();

// By ID
await page.locator('//input[@id="username"]').fill('admin');

// By text
await page.locator('//div[text()="Welcome"]').isVisible();
await page.locator('//button[contains(text(), "Submit")]').click();

// Complex XPath
await page.locator('//div[@class="product"]//button').click();
await page.locator('//table//tr[3]//td[2]').textContent();

// Parent navigation (XPath advantage)
await page.locator('//button[@id="submit"]/..').getAttribute('class');
await page.locator('//input[@name="email"]/ancestor::form').getAttribute('id');

// Following/preceding siblings
await page.locator('//label[text()="Username"]/following-sibling::input').fill('admin');
```

**When to Use locator():**
- Complex CSS selectors needed
- XPath for parent navigation or advanced text matching
- Migrating from Selenium or other frameworks
- No suitable built-in locator available
- Working with legacy code

**Recommendation:**  
Always prefer built-in locators (`getByRole`, `getByLabel`, etc.) over CSS/XPath for:
- Better resilience to changes
- Improved accessibility
- Clearer test intent
- Easier maintenance

---