## Chapter 7: Real-World Test Automation Examples

### 7.1 Login Form Automation

**HTML Structure**
```html
<form id="loginForm" class="auth-form">
  <div class="form-group">
    <label for="username">Username</label>
    <input id="username" name="username" type="text" class="form-control" required>
  </div>
  <div class="form-group">
    <label for="password">Password</label>
    <input id="password" name="password" type="password" class="form-control" required>
  </div>
  <div class="form-actions">
    <button type="submit" class="btn btn-primary">Login</button>
    <a href="/forgot-password" class="forgot-link">Forgot Password?</a>
  </div>
  <div class="error-message" style="display:none"></div>
</form>
```

**CSS Selectors**
```css
/* Form elements */
#loginForm                              /* The form itself */
#username                               /* Username input by ID */
input[name="username"]                  /* Username input by name */
input[type="text"]                      /* Username input by type */
#password                               /* Password input by ID */
input[type="password"]                  /* Password input by type */

/* Submit button */
button[type="submit"]                   /* Submit button */
.btn.btn-primary                        /* Submit button by classes */
.form-actions button                    /* Button inside form actions */

/* Links */
.forgot-link                            /* Forgot password link */
a[href="/forgot-password"]              /* Link by href */

/* Error messages */
.error-message:not([style*="display: none"])
/* Visible error messages */
```

### 7.2 E-commerce Product Selection

**HTML Structure**
```html
<div class="product-grid">
  <div class="product-card" data-product-id="123">
    <img src="iphone.jpg" alt="iPhone 15" class="product-image">
    <h3 class="product-title">iPhone 15</h3>
    <span class="product-price" data-price="999">$999</span>
    <button class="add-to-cart btn-primary" data-product="123">Add to Cart</button>
    <span class="stock-status in-stock">In Stock</span>
  </div>
  <div class="product-card" data-product-id="124">
    <img src="samsung.jpg" alt="Samsung Galaxy" class="product-image">
    <h3 class="product-title">Samsung Galaxy S24</h3>
    <span class="product-price" data-price="899">$899</span>
    <button class="add-to-cart btn-primary" data-product="124">Add to Cart</button>
    <span class="stock-status out-of-stock">Out of Stock</span>
  </div>
</div>
```

**CSS Selectors**
```css
/* Product cards */
.product-card                           /* All product cards */
.product-card:first-child               /* First product */
.product-card:nth-child(2)              /* Second product */
.product-card[data-product-id="123"]    /* Specific product by ID */

/* Product details */
.product-card .product-title            /* Product titles */
.product-card .product-price            /* Product prices */
.product-card img                       /* Product images */

/* Specific product by data attribute */
[data-product-id="123"] .product-title  /* Title of specific product */
[data-product-id="123"] button          /* Button for specific product */

/* Add to cart buttons */
.add-to-cart                            /* All add to cart buttons */
button.btn-primary                      /* Primary buttons */
button[data-product="123"]              /* Button for specific product */

/* Stock status */
.stock-status.in-stock                  /* In stock products */
.stock-status.out-of-stock              /* Out of stock products */

/* Products in stock */
.product-card:has(.stock-status.in-stock)
/* Products with in-stock status (CSS4) */
```

**Advanced Selection**
```css
/* Products under $1000 - requires data attribute */
.product-card [data-price]              /* All priced products */

/* Products with specific attributes */
.product-card[data-product-id^="12"]    /* Products with ID starting with "12" */

/* Interaction elements */
.product-card:hover                     /* Product card on hover */
.product-card:first-child button        /* Button in first product */
```

### 7.3 Dynamic Dropdown Selection

**HTML Structure**
```html
<div class="dropdown" data-testid="country-selector">
  <button class="dropdown-toggle" aria-expanded="false">Select Country</button>
  <ul class="dropdown-menu" style="display:none">
    <li class="dropdown-item" data-value="us">United States</li>
    <li class="dropdown-item" data-value="uk">United Kingdom</li>
    <li class="dropdown-item" data-value="ca">Canada</li>
    <li class="dropdown-item active" data-value="in">India</li>
  </ul>
</div>
```

**CSS Selectors**
```css
/* Dropdown components */
.dropdown                               /* Dropdown container */
[data-testid="country-selector"]        /* By test ID */
.dropdown-toggle                        /* Dropdown button */
button[aria-expanded="false"]           /* Closed dropdown */
button[aria-expanded="true"]            /* Open dropdown */

/* Dropdown menu */
.dropdown-menu                          /* Menu container */
.dropdown-menu:not([style*="display: none"])
/* Visible menu */

/* Menu items */
.dropdown-item                          /* All menu items */
.dropdown-item:first-child              /* First item */
.dropdown-item:last-child               /* Last item */
.dropdown-item:nth-child(2)             /* Second item */
.dropdown-item.active                   /* Currently selected item */

/* Select by data value */
.dropdown-item[data-value="us"]         /* United States option */
.dropdown-item[data-value="uk"]         /* United Kingdom option */

/* Items excluding active */
.dropdown-item:not(.active)             /* Non-active items */
```

### 7.4 Calendar Date Selection

**HTML Structure**
```html
<div class="calendar-widget">
  <div class="calendar-header">
    <button class="prev-month" aria-label="Previous month">←</button>
    <span class="current-month">January 2024</span>
    <button class="next-month" aria-label="Next month">→</button>
  </div>
  <table class="calendar-grid">
    <thead>
      <tr>
        <th>Sun</th><th>Mon</th><th>Tue</th><th>Wed</th><th>Thu</th><th>Fri</th><th>Sat</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td class="day disabled">31</td>
        <td class="day">1</td>
        <td class="day">2</td>
        <td class="day today">3</td>
        <td class="day">4</td>
        <td class="day">5</td>
        <td class="day">6</td>
      </tr>
      <!-- More rows -->
    </tbody>
  </table>
</div>
```

**CSS Selectors**
```css
/* Calendar components */
.calendar-widget                        /* Calendar container */
.calendar-header                        /* Header section */
.current-month                          /* Month display */

/* Navigation buttons */
.prev-month                             /* Previous month button */
.next-month                             /* Next month button */
button[aria-label="Previous month"]     /* Previous by ARIA label */
button[aria-label="Next month"]         /* Next by ARIA label */

/* Date grid */
.calendar-grid                          /* Calendar table */
.calendar-grid tbody tr                 /* Calendar rows */
.day                                    /* All date cells */
.day:not(.disabled)                     /* Enabled dates */
.day.disabled                           /* Disabled dates */
.day.today                              /* Today's date */
.day.selected                           /* Selected date */

/* Specific dates */
.calendar-grid tbody tr:nth-child(1) td:nth-child(4)
/* First week, Wednesday */

.day:not(.disabled):not(.today)         /* Enabled dates excluding today */
```

### 7.5 File Upload Scenarios

**HTML Structure**
```html
<div class="file-upload-widget">
  <input type="file" id="fileInput" name="document" accept=".pdf,.doc,.docx" multiple>
  <label for="fileInput" class="upload-label">
    <span class="upload-icon">📁</span>
    <span class="upload-text">Choose files or drag here</span>
  </label>
  <div class="file-list">
    <div class="file-item" data-filename="document1.pdf">
      <span class="filename">document1.pdf</span>
      <span class="filesize">2.5 MB</span>
      <button class="remove-file" data-file="document1.pdf">✕</button>
    </div>
  </div>
  <button class="upload-button btn-primary" disabled>Upload Files</button>
</div>
```

**CSS Selectors**
```css
/* File input */
input[type="file"]                      /* File input element */
#fileInput                              /* By ID */
input[name="document"]                  /* By name */
input[accept*=".pdf"]                   /* Inputs accepting PDFs */
input[multiple]                         /* Multiple file inputs */

/* Upload label/trigger */
.upload-label                           /* Upload label */
label[for="fileInput"]                  /* Label for file input */

/* File list */
.file-list                              /* Files container */
.file-item                              /* Individual file items */
.file-item:first-child                  /* First uploaded file */
.file-item:last-child                   /* Last uploaded file */

/* Specific file */
.file-item[data-filename="document1.pdf"]
/* File by filename */

/* File details */
.file-item .filename                    /* Filenames */
.file-item .filesize                    /* File sizes */

/* Remove buttons */
.remove-file                            /* All remove buttons */
button[data-file="document1.pdf"]       /* Remove button for specific file */
.file-item:first-child .remove-file     /* Remove button for first file */

/* Upload button */
.upload-button                          /* Upload button */
button.btn-primary:not(:disabled)       /* Enabled upload button */
.upload-button:disabled                 /* Disabled upload button */
```

### 7.6 Modal Dialog Handling

**HTML Structure**
```html
<div class="modal-overlay" style="display:none">
  <div class="modal-dialog" role="dialog" aria-modal="true">
    <div class="modal-header">
      <h2 class="modal-title">Confirm Action</h2>
      <button class="modal-close" aria-label="Close">✕</button>
    </div>
    <div class="modal-body">
      <p>Are you sure you want to proceed?</p>
    </div>
    <div class="modal-footer">
      <button class="btn-secondary" data-action="cancel">Cancel</button>
      <button class="btn-primary" data-action="confirm">Confirm</button>
    </div>
  </div>
</div>
```

**CSS Selectors**
```css
/* Modal components */
.modal-overlay                          /* Modal overlay */
.modal-overlay:not([style*="display: none"])
/* Visible modal */
.modal-dialog                           /* Modal dialog */
[role="dialog"]                         /* By ARIA role */
[aria-modal="true"]                     /* Active modal */

/* Modal sections */
.modal-header                           /* Modal header */
.modal-title                            /* Modal title */
.modal-body                             /* Modal body */
.modal-footer                           /* Modal footer */

/* Modal buttons */
.modal-close                            /* Close button */
button[aria-label="Close"]              /* Close by ARIA label */
.modal-footer button                    /* All footer buttons */
button[data-action="cancel"]            /* Cancel button */
button[data-action="confirm"]           /* Confirm button */

/* Combined selectors */
.modal-dialog .btn-primary              /* Primary button in modal */
.modal-footer button:first-child        /* First footer button */
.modal-footer button:last-child         /* Last footer button */

/* State-based selection */
.modal-overlay:not([style*="display: none"]) .modal-dialog
/* Dialog in visible modal */
```

### 7.7 Navigation Menu Testing

**HTML Structure**
```html
<nav class="main-navigation">
  <ul class="nav-menu">
    <li class="nav-item">
      <a href="/home" class="nav-link active">Home</a>
    </li>
    <li class="nav-item has-submenu">
      <a href="/products" class="nav-link">Products</a>
      <ul class="submenu">
        <li class="submenu-item">
          <a href="/products/electronics" class="submenu-link">Electronics</a>
        </li>
        <li class="submenu-item">
          <a href="/products/clothing" class="submenu-link">Clothing</a>
        </li>
      </ul>
    </li>
    <li class="nav-item">
      <a href="/about" class="nav-link">About</a>
    </li>
  </ul>
</nav>
```

**CSS Selectors**
```css
/* Navigation structure */
.main-navigation                        /* Nav container */
.nav-menu                               /* Main menu */
.nav-item                               /* Menu items */
.nav-link                               /* Menu links */

/* Active states */
.nav-link.active                        /* Active menu item */
.nav-item > .nav-link.active            /* Direct active link */

/* Specific menu items */
.nav-item:first-child                   /* First menu item */
.nav-item:last-child                    /* Last menu item */
.nav-item:nth-child(2)                  /* Second menu item */

/* Menu items with submenus */
.nav-item.has-submenu                   /* Items with submenus */
.has-submenu > .nav-link                /* Links with submenus */

/* Submenu */
.submenu                                /* Submenu container */
.submenu-item                           /* Submenu items */
.submenu-link                           /* Submenu links */

/* Select specific links */
a[href="/home"]                         /* Home link */
a[href*="/products"]                    /* Product-related links */
a[href^="/products/"]                   /* Product category links */

/* Nested navigation */
.nav-item .submenu .submenu-item        /* Submenu items */
.has-submenu .submenu-link:first-child  /* First submenu link */

/* Combined patterns */
.nav-menu > .nav-item > .nav-link       /* Direct menu links only */
.nav-item:not(.has-submenu)             /* Menu items without submenus */
```

### 7.8 Testing Checkboxes and Radio Buttons

**HTML Structure**
```html
<form class="preferences-form">
  <fieldset>
    <legend>Newsletter Preferences</legend>
    <label class="checkbox-label">
      <input type="checkbox" name="newsletter" value="daily" checked>
      <span>Daily Newsletter</span>
    </label>
    <label class="checkbox-label">
      <input type="checkbox" name="newsletter" value="weekly">
      <span>Weekly Newsletter</span>
    </label>
    <label class="checkbox-label">
      <input type="checkbox" name="newsletter" value="monthly" disabled>
      <span>Monthly Newsletter</span>
    </label>
  </fieldset>
  
  <fieldset>
    <legend>Gender</legend>
    <label class="radio-label">
      <input type="radio" name="gender" value="male" required>
      <span>Male</span>
    </label>
    <label class="radio-label">
      <input type="radio" name="gender" value="female" required>
      <span>Female</span>
    </label>
    <label class="radio-label">
      <input type="radio" name="gender" value="other" required checked>
      <span>Other</span>
    </label>
  </fieldset>
</form>
```

**CSS Selectors**
```css
/* Checkboxes */
input[type="checkbox"]                  /* All checkboxes */
input[type="checkbox"][name="newsletter"]
/* Newsletter checkboxes */
input[type="checkbox"]:checked          /* Checked checkboxes */
input[type="checkbox"]:not(:checked)    /* Unchecked checkboxes */
input[type="checkbox"]:disabled         /* Disabled checkboxes */
input[type="checkbox"]:enabled          /* Enabled checkboxes */

/* Specific checkbox by value */
input[type="checkbox"][value="daily"]   /* Daily newsletter checkbox */
input[type="checkbox"][value="weekly"]  /* Weekly newsletter checkbox */

/* Radio buttons */
input[type="radio"]                     /* All radio buttons */
input[type="radio"][name="gender"]      /* Gender radio group */
input[type="radio"]:checked             /* Checked radio button */
input[type="radio"][value="male"]       /* Male radio button */

/* Required inputs */
input[type="radio"]:required            /* Required radio buttons */
input[type="checkbox"]:required         /* Required checkboxes */

/* Labels */
.checkbox-label                         /* Checkbox labels */
.radio-label                            /* Radio labels */
label:has(input[type="checkbox"])       /* Labels containing checkboxes */
label:has(input[type="radio"])          /* Labels containing radio buttons */

/* Checked state labels */
label:has(input:checked)                /* Labels of checked inputs */
label:has(input[type="checkbox"]:checked)
/* Labels of checked checkboxes */

/* Fieldsets */
fieldset:first-of-type                  /* First fieldset */
fieldset:nth-of-type(2)                 /* Second fieldset */

/* All inputs in first fieldset */
fieldset:first-of-type input            /* Inputs in first fieldset */
```

### 7.9 Working with iFrames

**HTML Structure**
```html
<div class="page-content">
  <iframe id="payment-frame" 
          name="payment-iframe" 
          src="https://payment.example.com" 
          class="payment-iframe"
          title="Payment Gateway">
  </iframe>
  
  <iframe id="ad-frame"
          src="https://ads.example.com"
          class="ad-iframe"
          style="display:none">
  </iframe>
</div>
```

**CSS Selectors for iFrame Elements**
```css
/* Select iFrame elements */
iframe                                  /* All iframes */
#payment-frame                          /* iFrame by ID */
iframe[name="payment-iframe"]           /* iFrame by name */
.payment-iframe                         /* iFrame by class */
iframe[src*="payment"]                  /* iFrame by partial src */
iframe[title="Payment Gateway"]         /* iFrame by title */

/* iFrame states */
iframe:not([style*="display: none"])    /* Visible iframes */
iframe[style*="display: none"]          /* Hidden iframes */

/* Multiple iframes */
iframe:first-of-type                    /* First iframe */
iframe:last-of-type                     /* Last iframe */
iframe:nth-of-type(2)                   /* Second iframe */
```

**Note**: To interact with elements inside an iframe, you need to switch context:
```javascript
// Playwright example
const frame = page.frame({ name: 'payment-iframe' });
await frame.locator('button#submit').click();

// Selenium example
driver.switchTo().frame("payment-iframe");
driver.findElement(By.cssSelector("button#submit")).click();
```

### 7.10 Form Validation Testing

**HTML Structure**
```html
<form class="registration-form" novalidate>
  <div class="form-group">
    <label for="email">Email</label>
    <input id="email" type="email" class="form-control" required 
           pattern="[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$">
    <span class="error-message">Please enter a valid email</span>
    <span class="success-message">Email is valid</span>
  </div>
  
  <div class="form-group">
    <label for="age">Age</label>
    <input id="age" type="number" class="form-control" 
           min="18" max="120" required>
    <span class="error-message">Age must be between 18 and 120</span>
  </div>
  
  <div class="form-group">
    <label for="password">Password</label>
    <input id="password" type="password" class="form-control" 
           required minlength="8">
    <span class="error-message">Password must be at least 8 characters</span>
  </div>
  
  <button type="submit" class="btn-submit">Register</button>
</form>
```

**CSS Selectors**
```css
/* Form validation states */
input:valid                             /* Valid inputs */
input:invalid                           /* Invalid inputs */
input:required                          /* Required inputs */
input:optional                          /* Optional inputs */

/* Combined validation states */
input:required:valid                    /* Required and valid */
input:required:invalid                  /* Required and invalid */

/* Specific input validations */
input[type="email"]:valid               /* Valid email */
input[type="email"]:invalid             /* Invalid email */
input:in-range                          /* Number in range */
input:out-of-range                      /* Number out of range */

/* Pattern matching */
input[pattern]:valid                    /* Inputs with pattern that are valid */
input[pattern]:invalid                  /* Inputs with pattern that are invalid */

/* Error and success messages */
.error-message                          /* All error messages */
.success-message                        /* All success messages */
.form-group:has(input:invalid) .error-message
/* Error for invalid input (CSS4) */

/* Form groups with errors */
.form-group:has(input:invalid)          /* Groups with invalid inputs */
.form-group:has(input:valid)            /* Groups with valid inputs */

/* Submit button states */
button[type="submit"]                   /* Submit button */
button[type="submit"]:disabled          /* Disabled submit */
.btn-submit:not(:disabled)              /* Enabled submit */

/* Specific field validations */
#email:invalid                          /* Invalid email field */
#age:out-of-range                       /* Age out of range */
#password:invalid                       /* Invalid password */

/* Min/max length */
input[minlength]:invalid                /* Inputs below min length */
input[maxlength]                        /* Inputs with max length */
```

---
