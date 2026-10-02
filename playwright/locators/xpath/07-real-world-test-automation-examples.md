## Chapter 7: Real-World Test Automation Examples

### 7.1 Login Form Automation
```text
// Username field
//input[@id='username' or @name='username']

// Password field
//input[@type='password']

// Submit button
//button[text()='Login' or text()='Sign In']

// Error message
//div[contains(@class,'error') and contains(text(),'Invalid')]
```

### 7.2 E-commerce Product Selection
```text
// Select product by name
//div[@class='product' and .//h3[text()='iPhone 15']]

// Add to cart button for specific product
//div[.//h3[text()='iPhone 15']]//button[text()='Add to Cart']

// Product price
//div[@class='product' and .//h3[text()='iPhone 15']]//span[@class='price']

// Filter by price range
//div[@class='product' and number(.//span[@class='price']) < 1000]
```

### 7.3 Dynamic Dropdown Selection
```text
// Open dropdown
//div[@class='dropdown']//button

// Select option by text
//ul[@class='dropdown-menu']//li[text()='United States']

// Select option by partial text
//ul[@class='dropdown-menu']//li[contains(text(),'United')]
```

### 7.4 Calendar Date Selection
```text
// Select specific date in calendar
//div[@class='calendar']//td[text()='15' and not(contains(@class,'disabled'))]

// Next month button
//div[@class='calendar']//button[@aria-label='Next month']

// Current selected month
//div[@class='calendar']//span[@class='current-month']
```

### 7.5 File Upload Scenarios
```text
// File input
//input[@type='file']

// Upload button
//button[text()='Upload' or contains(text(),'Choose File')]

// Uploaded file name display
//div[@class='uploaded-files']//span[@class='filename']
```

### 7.6 Modal Dialog Handling
```text
// Wait for modal to appear
//div[@class='modal' and not(contains(@style,'display: none'))]

// Modal close button
//div[@class='modal']//button[@class='close' or @aria-label='Close']

// Modal confirm button
//div[@class='modal']//button[text()='Confirm' or text()='OK']
```

### 7.7 Navigation Menu Testing
```text
// Main navigation item
//nav//a[text()='Products']

// Submenu item
//nav//a[text()='Products']/following-sibling::ul//a[text()='Electronics']

// Active menu item
//nav//a[contains(@class,'active')]
```

### 7.8 Testing Checkboxes and Radio Buttons
```text
// Select unchecked checkbox
//input[@type='checkbox' and not(@checked)]

// Select checked checkbox
//input[@type='checkbox' and @checked]

// Select checkbox by label text
//label[text()='Remember me']/input[@type='checkbox']

// Alternative: checkbox following a label
//label[text()='Remember me']/following-sibling::input[@type='checkbox']

// Select radio button by value
//input[@type='radio' and @value='male']

// Select checked radio button in a group
//input[@type='radio' and @name='gender' and @checked]

// All checkboxes in a form
//form[@id='signup']//input[@type='checkbox']
```

### 7.9 Working with iFrames
Locate iFrame elements (note: you still need to switch context in your test code):
```text
// iFrame by ID
//iframe[@id='payment-frame']

// iFrame by name
//iframe[@name='content-frame']

// iFrame by partial src
//iframe[contains(@src,'payment')]

// iFrame by title attribute
//iframe[@title='Payment Gateway']

// Nested iFrame
//iframe[@id='outer']//iframe[@id='inner']
```

### 7.10 Extracting All Text Content
Extract all text nodes from a page or section (useful for content validation):
```text
// All text nodes on page
//text()

// All text nodes within specific div
//div[@id='content']//text()

// Non-empty text nodes (excludes whitespace-only nodes)
//text()[normalize-space()]

// Get all text from an element and its children
//div[@id='article']/descendant-or-self::text()

// Practical example: verify specific text exists on page
//text()[contains(.,'Thank you for your order')]
```

**Use Case Example:**
```text
// HTML structure
<div id="article">
  <h1>Welcome</h1>
  <p>This is <strong>important</strong> content.</p>
</div>

// Extract all text
//div[@id='article']//text()
// Returns: ["Welcome", "This is ", "important", " content."]

// Get concatenated text
normalize-space(//div[@id='article'])
// Returns: "Welcome This is important content."
```


---
