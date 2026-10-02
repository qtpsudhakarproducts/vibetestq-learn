## Chapter 2: Core Cypress Commands for Element Selection

### 2.1 cy.get() - Primary Selection Command

`cy.get()` is the most fundamental Cypress command for selecting elements. It accepts CSS selectors and returns matching elements.

**Basic Usage:**
```javascript
// By ID
cy.get('#username')
cy.get('#submit-button')

// By class
cy.get('.btn')
cy.get('.product-card')

// By tag name
cy.get('input')
cy.get('button')
cy.get('div')

// By attribute
cy.get('[type="text"]')
cy.get('[name="email"]')
cy.get('[data-cy="login-button"]')

// By multiple classes
cy.get('.btn.btn-primary')
cy.get('.card.active')

// Complex CSS selectors
cy.get('input[type="text"].form-control')
cy.get('div.container > button')
cy.get('ul.menu li:first-child')
```

**Advanced Usage:**
```javascript
// Descendant selectors
cy.get('form input')
cy.get('.modal .submit-button')
cy.get('nav a')

// Direct child selector
cy.get('ul > li')
cy.get('.parent > .child')

// Attribute selectors
cy.get('[placeholder*="email"]')
cy.get('[id^="user"]')
cy.get('[class$="button"]')

// Pseudo-classes
cy.get('input:visible')
cy.get('button:enabled')
cy.get('li:first-child')
cy.get('div:nth-child(2)')
cy.get('input:not([type="hidden"])')

// Multiple selectors
cy.get('input, select, textarea')
cy.get('.error, .warning')
```

### 2.2 cy.contains() - Text-Based Selection

`cy.contains()` finds elements by their text content. This is extremely powerful for user-centric testing.

**Basic Usage:**
```javascript
// Find element containing text
cy.contains('Submit')
cy.contains('Sign Up')
cy.contains('Add to Cart')

// Case-sensitive by default
cy.contains('submit')     // Won't match "Submit"

// Partial match
cy.contains('Sign')       // Matches "Sign Up", "Sign In", etc.

// With selector
cy.contains('button', 'Submit')
cy.contains('a', 'Learn More')
cy.contains('.nav-item', 'Home')

// Multiple words
cy.contains('Welcome back!')
cy.contains('Your order has been placed')
```

**With Regular Expressions:**
```javascript
// Case-insensitive match
cy.contains(/submit/i)

// Pattern matching
cy.contains(/sign (in|up)/i)
cy.contains(/^order #\d+$/i)

// Multiple patterns
cy.contains(/price|cost|amount/i)

// With selector
cy.contains('button', /submit|send/i)
```

**Real-world Examples:**
```javascript
// Navigation
cy.contains('Home').click()
cy.contains('Products').click()
cy.contains('nav', 'Contact Us').click()

// Button actions
cy.contains('Save Changes').click()
cy.contains('Cancel').click()
cy.contains('button', /submit|send/i).click()

// Verification
cy.contains('Order placed successfully!').should('be.visible')
cy.contains('Invalid credentials').should('be.visible')

// List selection
cy.contains('li', 'United States').click()
cy.contains('.dropdown-item', 'English').click()

// Dynamic content
cy.contains('Loading...').should('not.exist')
cy.contains(/total: \$\d+/i).should('be.visible')
```

### 2.3 Data Attributes - Best Practice

Using data attributes is the recommended approach for test automation as they are less likely to change than IDs, classes, or text content.

**Common Data Attribute Patterns:**
```javascript
// data-cy (Cypress convention)
cy.get('[data-cy="submit-button"]')
cy.get('[data-cy="email-input"]')
cy.get('[data-cy="error-message"]')

// data-test
cy.get('[data-test="login-form"]')
cy.get('[data-test="product-card"]')

// data-testid
cy.get('[data-testid="user-profile"]')
cy.get('[data-testid="cart-icon"]')

// Custom data attributes
cy.get('[data-automation="checkout-btn"]')
cy.get('[data-qa="search-box"]')
```

**Custom Command for data-cy:**
```javascript
// cypress/support/commands.js
Cypress.Commands.add('getByCy', (selector, options) => {
  return cy.get(`[data-cy="${selector}"]`, options)
})

// Usage
cy.getByCy('submit-button').click()
cy.getByCy('email-input').type('user@example.com')
```

**Advantages of Data Attributes:**
- Dedicated for testing (won't change with styling)
- Clear intent (developers know it's for testing)
- Easy to search in codebase
- Consistent naming convention
- No conflicts with styling or functionality
- Works across locales (unlike text content)

---
