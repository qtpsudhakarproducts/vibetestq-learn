# 05 - Locators

## Introduction to Cypress Locators

Locators are the foundation of test automation. In Cypress with TypeScript, you have multiple ways to locate elements on a page. Understanding which locator strategy to use is crucial for writing maintainable, reliable tests.

## Locator Strategies in Cypress

### 1. CSS Selectors (Primary Method)

Cypress primarily uses CSS selectors through the `cy.get()` command:

```typescript
describe('CSS Selectors', () => {
  it('demonstrates various CSS selectors', () => {
    cy.visit('/login')
    
    // By ID
    cy.get('#username')
    
    // By class
    cy.get('.form-input')
    
    // By tag
    cy.get('button')
    
    // By attribute
    cy.get('[type="email"]')
    cy.get('[data-testid="submit-btn"]')
    
    // Descendant combinator
    cy.get('form input')
    
    // Child combinator
    cy.get('div > button')
    
    // Pseudo-classes
    cy.get('button:first')
    cy.get('li:nth-child(2)')
    cy.get('input:disabled')
  })
})
```

### 2. Data Attributes (Best Practice)

Using `data-*` attributes is the recommended approach:

```typescript
// HTML
// <button data-cy="submit">Submit</button>
// <input data-testid="email-input" />
// <div data-test="error-message">Error</div>

describe('Data Attributes', () => {
  it('uses data-cy attributes', () => {
    cy.visit('/form')
    
    cy.get('[data-cy="email-input"]').type('test@example.com')
    cy.get('[data-cy="password-input"]').type('password123')
    cy.get('[data-cy="submit-btn"]').click()
    cy.get('[data-cy="success-message"]').should('be.visible')
  })
})

// TypeScript helper for type safety
type DataCy = 
  | 'email-input'
  | 'password-input'
  | 'submit-btn'
  | 'success-message'

function getByDataCy(selector: DataCy) {
  return cy.get(`[data-cy="${selector}"]`)
}

// Usage
getByDataCy('email-input').type('test@example.com')
```

**Why data attributes?**
- Not affected by CSS changes
- Not affected by text changes
- Clear intent for testing
- Doesn't pollute production code

### 3. cy.contains() - Text Content

Find elements by text content:

```typescript
describe('Text Content Locators', () => {
  it('finds elements by text', () => {
    cy.visit('/products')
    
    // Find any element containing text
    cy.contains('Add to Cart')
    
    // Find specific element type with text
    cy.contains('button', 'Add to Cart')
    
    // Partial text match
    cy.contains('Welcome')  // Matches "Welcome, User!"
    
    // With regex
    cy.contains(/^Submit$/)  // Exact match
    cy.contains(/welcome/i)  // Case insensitive
  })
  
  it('combines with other selectors', () => {
    cy.get('.product-card')
      .contains('iPhone')
      .find('button')
      .click()
  })
})
```

### 4. cy.get() with Complex Selectors

```typescript
describe('Complex CSS Selectors', () => {
  it('uses advanced CSS selectors', () => {
    cy.visit('/dashboard')
    
    // Multiple classes
    cy.get('.btn.btn-primary')
    
    // Multiple attributes
    cy.get('[type="submit"][disabled]')
    
    // Attribute contains
    cy.get('[class*="button"]')  // Contains "button"
    cy.get('[id^="user-"]')      // Starts with "user-"
    cy.get('[href$=".pdf"]')     // Ends with ".pdf"
    
    // Not selector
    cy.get('input:not([type="hidden"])')
    
    // Multiple selectors
    cy.get('button, a.btn')  // button OR a.btn
  })
})
```

### 5. xpath (with Plugin)

While Cypress doesn't support XPath natively, you can add it:

```bash
npm install --save-dev cypress-xpath
```

```typescript
// cypress/support/e2e.ts
import 'cypress-xpath'

describe('XPath Selectors', () => {
  it('uses xpath when needed', () => {
    cy.visit('/page')
    
    // Basic xpath
    cy.xpath('//button[@type="submit"]')
    
    // Text matching
    cy.xpath('//button[text()="Submit"]')
    
    // Ancestor/descendant
    cy.xpath('//form//input[@type="email"]')
    
    // Following sibling
    cy.xpath('//label[text()="Email"]/following-sibling::input')
  })
})
```

## Chainable Locator Methods

### cy.find()

Find descendants of a specific element:

```typescript
describe('cy.find()', () => {
  it('finds within a parent element', () => {
    cy.visit('/products')
    
    // Find button within a specific card
    cy.get('.product-card').first()
      .find('button.add-to-cart')
      .click()
    
    // Multiple finds
    cy.get('form')
      .find('.input-group')
      .find('input[type="email"]')
      .type('test@example.com')
  })
})
```

### cy.filter()

Filter elements by selector or function:

```typescript
describe('cy.filter()', () => {
  it('filters element collection', () => {
    cy.visit('/users')
    
    // Filter by selector
    cy.get('.user-row')
      .filter('.active')
      .should('have.length', 3)
    
    // Filter by attribute
    cy.get('input')
      .filter('[required]')
      .should('have.length', 5)
    
    // Filter with function
    cy.get('.product')
      .filter((index, el) => {
        return Cypress.$(el).find('.price').text().includes('$99')
      })
      .should('have.length', 2)
  })
})
```

### cy.not()

Exclude elements from selection:

```typescript
describe('cy.not()', () => {
  it('excludes elements', () => {
    cy.visit('/form')
    
    // Exclude hidden inputs
    cy.get('input')
      .not('[type="hidden"]')
      .should('be.visible')
    
    // Exclude by class
    cy.get('button')
      .not('.disabled')
      .first()
      .click()
  })
})
```

### cy.eq()

Get element at specific index:

```typescript
describe('cy.eq()', () => {
  it('selects element by index', () => {
    cy.visit('/items')
    
    // Zero-based index
    cy.get('.item').eq(0)  // First item
    cy.get('.item').eq(2)  // Third item
    cy.get('.item').eq(-1) // Last item
  })
})
```

### cy.first(), cy.last()

```typescript
describe('First and Last', () => {
  it('selects first and last elements', () => {
    cy.visit('/list')
    
    // First element
    cy.get('li').first().should('contain', 'Item 1')
    
    // Last element
    cy.get('li').last().should('contain', 'Item 10')
  })
})
```

### cy.parent(), cy.parents()

```typescript
describe('Parent Navigation', () => {
  it('navigates to parent elements', () => {
    cy.visit('/form')
    
    // Direct parent
    cy.get('input').parent().should('have.class', 'form-group')
    
    // All parents up to selector
    cy.get('input').parents('form').should('exist')
    
    // Closest parent matching selector
    cy.get('input').closest('.container')
  })
})
```

### cy.children()

```typescript
describe('Children', () => {
  it('selects child elements', () => {
    cy.visit('/menu')
    
    // All children
    cy.get('ul.menu').children().should('have.length', 5)
    
    // Filtered children
    cy.get('ul.menu').children('.active')
  })
})
```

### cy.siblings()

```typescript
describe('Siblings', () => {
  it('selects sibling elements', () => {
    cy.visit('/page')
    
    // All siblings
    cy.get('.selected').siblings()
    
    // Filtered siblings
    cy.get('.item-1').siblings('.item')
  })
})
```

### cy.next(), cy.prev()

```typescript
describe('Next and Previous', () => {
  it('navigates siblings', () => {
    cy.visit('/list')
    
    // Next sibling
    cy.get('.item-2').next().should('have.class', 'item-3')
    
    // All next siblings
    cy.get('.item-2').nextAll()
    
    // Previous sibling
    cy.get('.item-3').prev().should('have.class', 'item-2')
    
    // All previous siblings
    cy.get('.item-3').prevAll()
  })
})
```

## TypeScript Type Safety for Locators

### Generic Type Parameters

```typescript
describe('Type-Safe Locators', () => {
  it('uses generic types for elements', () => {
    cy.visit('/form')
    
    // Type as specific element
    cy.get<HTMLInputElement>('#email')
      .should('have.value', '')
      .invoke('val', 'test@example.com')
    
    cy.get<HTMLButtonElement>('button[type="submit"]')
      .should('not.be.disabled')
      .click()
    
    cy.get<HTMLSelectElement>('select#country')
      .select('USA')
  })
})
```

### Custom Type Helpers

```typescript
// cypress/support/locators.ts
type LocatorStrategy = 'id' | 'class' | 'data-cy' | 'data-testid'

class TypeSafeLocator {
  static byId(id: string) {
    return cy.get(`#${id}`)
  }
  
  static byClass(className: string) {
    return cy.get(`.${className}`)
  }
  
  static byDataCy(value: string) {
    return cy.get(`[data-cy="${value}"]`)
  }
  
  static byDataTestId(value: string) {
    return cy.get(`[data-testid="${value}"]`)
  }
  
  static byRole(role: string, name?: string) {
    return name
      ? cy.get(`[role="${role}"][aria-label="${name}"]`)
      : cy.get(`[role="${role}"]`)
  }
}

// Usage
describe('Type-Safe Locators', () => {
  it('uses type-safe helpers', () => {
    TypeSafeLocator.byDataCy('login-form').should('be.visible')
    TypeSafeLocator.byDataCy('email-input').type('test@example.com')
    TypeSafeLocator.byRole('button', 'Submit').click()
  })
})
```

### Interface for Page Elements

```typescript
interface LoginPageElements {
  emailInput: string
  passwordInput: string
  submitButton: string
  errorMessage: string
  rememberMeCheckbox: string
}

const loginSelectors: LoginPageElements = {
  emailInput: '[data-cy="email"]',
  passwordInput: '[data-cy="password"]',
  submitButton: '[data-cy="submit"]',
  errorMessage: '[data-cy="error"]',
  rememberMeCheckbox: '#remember-me'
}

describe('Login with Type-Safe Selectors', () => {
  it('performs login', () => {
    cy.visit('/login')
    cy.get(loginSelectors.emailInput).type('user@example.com')
    cy.get(loginSelectors.passwordInput).type('password')
    cy.get(loginSelectors.submitButton).click()
  })
})
```

## Best Practices for Locators

### 1. Priority Order

Use locators in this priority:

1. **data-cy** or **data-testid**: Most reliable
2. **ID**: Unique and fast
3. **Class**: Good if stable
4. **Text content**: Good for buttons/links
5. **CSS selectors**: Complex but powerful
6. **XPath**: Last resort

```typescript
describe('Locator Priority', () => {
  it('demonstrates priority', () => {
    // ✅ Best - data attribute
    cy.get('[data-cy="submit-btn"]')
    
    // ✅ Good - ID
    cy.get('#submit')
    
    // ⚠️ OK - stable class
    cy.get('.submit-button')
    
    // ⚠️ OK - text content
    cy.contains('button', 'Submit')
    
    // ❌ Avoid - complex CSS (fragile)
    cy.get('div.container > form > div:nth-child(3) > button')
  })
})
```

### 2. Avoid Fragile Selectors

```typescript
// ❌ Fragile - depends on structure
cy.get('body > div > div > form > button')

// ❌ Fragile - depends on styling
cy.get('.btn-primary.btn-lg.mt-3')

// ✅ Robust - semantic selector
cy.get('[data-cy="submit-form-btn"]')

// ✅ Robust - unique ID
cy.get('#submit-button')
```

### 3. Use Cypress Testing Library

For better accessibility and semantics:

```bash
npm install --save-dev @testing-library/cypress
```

```typescript
// cypress/support/e2e.ts
import '@testing-library/cypress/add-commands'

describe('Testing Library Commands', () => {
  it('finds elements by role and label', () => {
    cy.visit('/form')
    
    // By role
    cy.findByRole('button', { name: /submit/i }).click()
    
    // By label text
    cy.findByLabelText('Email Address').type('test@example.com')
    
    // By placeholder
    cy.findByPlaceholderText('Enter your email')
    
    // By text
    cy.findByText('Welcome back!')
    
    // All variants
    cy.findAllByRole('listitem').should('have.length', 5)
  })
})
```

### 4. Aliasing for Reuse

```typescript
describe('Aliasing', () => {
  it('uses aliases for complex selectors', () => {
    cy.visit('/dashboard')
    
    // Create alias
    cy.get('[data-cy="user-profile"]').as('profile')
    cy.get('[data-cy="settings-panel"]').as('settings')
    
    // Reuse aliases
    cy.get('@profile').should('be.visible')
    cy.get('@profile').find('.username').should('contain', 'John')
    
    cy.get('@settings').click()
    cy.get('@settings').find('input').should('be.visible')
  })
  
  it('aliases persist across test', () => {
    // Note: Aliases don't persist between tests
    // They're recreated in beforeEach
  })
})
```

### 5. Custom Commands for Common Patterns

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      getByDataCy(selector: string): Chainable<JQuery<HTMLElement>>
      getByTestId(selector: string): Chainable<JQuery<HTMLElement>>
      findByAriaLabel(label: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('getByDataCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`)
})

Cypress.Commands.add('getByTestId', (selector: string) => {
  return cy.get(`[data-testid="${selector}"]`)
})

Cypress.Commands.add('findByAriaLabel', (label: string) => {
  return cy.get(`[aria-label="${label}"]`)
})

// Usage
describe('Custom Commands', () => {
  it('uses custom locator commands', () => {
    cy.visit('/page')
    cy.getByDataCy('submit-btn').click()
    cy.getByTestId('error-msg').should('not.exist')
    cy.findByAriaLabel('Close dialog').click()
  })
})
```

## Shadow DOM

Cypress 10+ has better Shadow DOM support:

```typescript
describe('Shadow DOM', () => {
  it('accesses shadow DOM elements', () => {
    cy.visit('/shadow-dom-page')
    
    // Traverse shadow root
    cy.get('my-component')
      .shadow()
      .find('button')
      .click()
    
    // Multiple shadow roots
    cy.get('parent-component')
      .shadow()
      .find('child-component')
      .shadow()
      .find('input')
      .type('text')
  })
})
```

## Dynamic Elements

Handling dynamically loaded elements:

```typescript
describe('Dynamic Elements', () => {
  it('waits for dynamic elements', () => {
    cy.visit('/ajax-page')
    
    // Cypress automatically retries
    cy.get('.dynamic-content', { timeout: 10000 })
      .should('be.visible')
      .and('contain', 'Loaded!')
    
    // Wait for element to be removed
    cy.get('.loading-spinner').should('not.exist')
  })
  
  it('handles elements added by JavaScript', () => {
    cy.visit('/dynamic')
    cy.get('#add-item').click()
    
    // New element should appear
    cy.get('.item').should('have.length', 1)
    
    cy.get('#add-item').click()
    cy.get('.item').should('have.length', 2)
  })
})
```

## Within Context

Scope commands to specific element:

```typescript
describe('Within Context', () => {
  it('scopes commands to element', () => {
    cy.visit('/users')
    
    cy.get('.user-card').first().within(() => {
      // All commands here are scoped to .user-card
      cy.get('.name').should('contain', 'John')
      cy.get('.email').should('contain', 'john@example.com')
      cy.get('button.edit').click()
    })
    
    // Back to global scope
    cy.get('.modal').should('be.visible')
  })
})
```

## Summary

- Cypress uses CSS selectors as primary locator strategy
- `data-cy` and `data-testid` attributes are recommended for reliability
- Multiple traversal methods: find, filter, parent, children, siblings
- TypeScript provides type safety for element interactions
- Avoid fragile selectors based on structure or styling
- Use aliases for complex, reused selectors
- Custom commands can encapsulate common locator patterns
- Cypress automatically retries assertions on located elements

## Next Steps

- **04 - Basic Interactions**: Learn to interact with located elements
- **05 - Advanced Interactions**: Complex interactions and gestures
- **11 - Assertions**: Verify located elements have expected properties

## Quick Reference

```typescript
// Basic selectors
cy.get('#id')
cy.get('.class')
cy.get('[data-cy="value"]')
cy.contains('text')

// Traversal
cy.get('.parent').find('.child')
cy.get('.element').parent()
cy.get('.element').siblings()
cy.get('.list').children()

// Filtering
cy.get('button').filter('.active')
cy.get('input').not('[type="hidden"]')
cy.get('li').eq(2)
cy.get('item').first()
cy.get('item').last()

// Type-safe
cy.get<HTMLInputElement>('#email')

// Custom commands
cy.getByDataCy('submit')
cy.getByTestId('error')
```
