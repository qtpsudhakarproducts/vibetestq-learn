# 11 - Assertions

## Introduction to Cypress Assertions

Assertions are the foundation of test verification in Cypress. They describe the desired state of your application and automatically retry until the assertion passes or times out. Cypress uses Chai assertions along with Cypress-specific chainers.

## Assertion Styles

Cypress supports multiple assertion styles:

1. **Should assertions** (Cypress style - recommended)
2. **Expect assertions** (Chai BDD style)
3. **Assert assertions** (Chai TDD style)

### Should Assertions (Recommended)

```typescript
describe('Should Assertions', () => {
  it('uses should for assertions', () => {
    cy.visit('/users')
    
    // Single assertion
    cy.get('.user').should('have.length', 5)
    
    // Multiple assertions (chained)
    cy.get('.user').first()
      .should('be.visible')
      .and('have.class', 'active')
      .and('contain', 'John Doe')
    
    // Negative assertion
    cy.get('.error').should('not.exist')
  })
})
```

### Expect Assertions (Chai)

```typescript
describe('Expect Assertions', () => {
  it('uses expect for assertions', () => {
    cy.visit('/data')
    
    cy.get('.count').then(($count) => {
      const count = parseInt($count.text())
      expect(count).to.equal(10)
      expect(count).to.be.greaterThan(5)
      expect(count).to.be.lessThan(20)
    })
    
    cy.wrap({ name: 'Test', age: 25 }).then((obj) => {
      expect(obj).to.have.property('name')
      expect(obj.name).to.equal('Test')
      expect(obj.age).to.be.a('number')
    })
  })
})
```

## Common Assertions

### Existence Assertions

```typescript
describe('Existence', () => {
  it('checks element existence', () => {
    cy.visit('/page')
    
    // Element exists
    cy.get('.element').should('exist')
    
    // Element does not exist
    cy.get('.removed').should('not.exist')
    
    // Multiple elements exist
    cy.get('.item').should('have.length', 5)
    cy.get('.item').should('have.length.greaterThan', 3)
    cy.get('.item').should('have.length.lessThan', 10)
  })
})
```

### Visibility Assertions

```typescript
describe('Visibility', () => {
  it('checks element visibility', () => {
    cy.visit('/page')
    
    // Visible
    cy.get('.visible-element').should('be.visible')
    
    // Hidden (exists but not visible)
    cy.get('.hidden-element').should('not.be.visible')
    cy.get('.hidden-element').should('be.hidden')
    
    // Check if all elements are visible
    cy.get('.item').should('be.visible')  // All must be visible
    
    cy.get('.item').each(($el) => {
      cy.wrap($el).should('be.visible')
    })
  })
})
```

### Text Content Assertions

```typescript
describe('Text Content', () => {
  it('verifies text content', () => {
    cy.visit('/page')
    
    // Contains text
    cy.get('.title').should('contain', 'Welcome')
    cy.get('.title').should('include.text', 'Welcome')
    
    // Exact text
    cy.get('.title').should('have.text', 'Welcome to Cypress')
    
    // Multiple elements with text
    cy.get('.item').should('contain', 'Item')
    
    // Case insensitive
    cy.get('.message').should('match', /success/i)
    
    // Not contain
    cy.get('.result').should('not.contain', 'Error')
  })
})
```

### Value Assertions

```typescript
describe('Input Values', () => {
  it('checks input values', () => {
    cy.visit('/form')
    
    // Input has value
    cy.get('input[name="email"]').should('have.value', 'test@example.com')
    
    // Input is empty
    cy.get('input[name="username"]').should('have.value', '')
    
    // Contains value (partial match)
    cy.get('input[name="search"]').should('include.value', 'search')
    
    // Textarea value
    cy.get('textarea').should('have.value', 'Long text content')
  })
})
```

### Attribute Assertions

```typescript
describe('Attributes', () => {
  it('checks element attributes', () => {
    cy.visit('/page')
    
    // Has attribute
    cy.get('button').should('have.attr', 'type', 'submit')
    
    // Has attribute (any value)
    cy.get('a').should('have.attr', 'href')
    
    // Attribute contains
    cy.get('img').should('have.attr', 'src')
      .and('include', '/images/')
    
    // Data attributes
    cy.get('.element').should('have.attr', 'data-testid', 'my-element')
    
    // Multiple attributes
    cy.get('input')
      .should('have.attr', 'type', 'email')
      .and('have.attr', 'required')
      .and('have.attr', 'placeholder')
  })
})
```

### Class Assertions

```typescript
describe('CSS Classes', () => {
  it('checks CSS classes', () => {
    cy.visit('/page')
    
    // Has class
    cy.get('.button').should('have.class', 'btn-primary')
    
    // Does not have class
    cy.get('.button').should('not.have.class', 'disabled')
    
    // Multiple classes
    cy.get('.element')
      .should('have.class', 'active')
      .and('have.class', 'highlighted')
  })
})
```

### CSS Assertions

```typescript
describe('CSS Properties', () => {
  it('checks CSS properties', () => {
    cy.visit('/styled-page')
    
    // CSS property value
    cy.get('.red-text').should('have.css', 'color', 'rgb(255, 0, 0)')
    
    // Background color
    cy.get('.highlight').should('have.css', 'background-color', 'rgb(255, 255, 0)')
    
    // Display property
    cy.get('.visible').should('have.css', 'display', 'block')
    cy.get('.hidden').should('have.css', 'display', 'none')
    
    // Font size
    cy.get('h1').should('have.css', 'font-size', '32px')
  })
})
```

### State Assertions

```typescript
describe('Element State', () => {
  it('checks element states', () => {
    cy.visit('/form')
    
    // Disabled
    cy.get('button').should('be.disabled')
    cy.get('button').should('not.be.enabled')
    
    // Enabled
    cy.get('input').should('be.enabled')
    cy.get('input').should('not.be.disabled')
    
    // Checked (checkbox/radio)
    cy.get('input[type="checkbox"]').should('be.checked')
    cy.get('input[type="checkbox"]').should('not.be.checked')
    
    // Selected (option)
    cy.get('option:selected').should('have.value', 'option1')
    
    // Focused
    cy.get('input').focus().should('have.focus')
    cy.get('input').blur().should('not.have.focus')
  })
})
```

## Type-Safe Assertions

### Generic Type Assertions

```typescript
interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'user'
}

describe('Type-Safe Assertions', () => {
  it('uses typed assertions', () => {
    cy.visit('/api/users')
    
    cy.request<User[]>('/api/users').then((response) => {
      expect(response.status).to.equal(200)
      expect(response.body).to.be.an('array')
      
      const users = response.body
      expect(users).to.have.length.greaterThan(0)
      
      const firstUser = users[0]
      expect(firstUser).to.have.property('id')
      expect(firstUser).to.have.property('name')
      expect(firstUser).to.have.property('email')
      expect(firstUser.role).to.be.oneOf(['admin', 'user'])
    })
  })
})
```

### Custom Type Guards

```typescript
function isUser(obj: any): obj is User {
  return (
    typeof obj.id === 'string' &&
    typeof obj.name === 'string' &&
    typeof obj.email === 'string' &&
    ['admin', 'user'].includes(obj.role)
  )
}

describe('Type Guards in Assertions', () => {
  it('validates types with guards', () => {
    cy.fixture<User>('user.json').then((user) => {
      expect(isUser(user)).to.be.true
      
      if (isUser(user)) {
        // TypeScript knows user is User type here
        expect(user.name).to.be.a('string')
        expect(user.role).to.be.oneOf(['admin', 'user'])
      }
    })
  })
})
```

## Complex Assertions

### Callback Assertions

```typescript
describe('Callback Assertions', () => {
  it('uses callback for complex checks', () => {
    cy.visit('/products')
    
    cy.get('.product').should(($products) => {
      expect($products).to.have.length(10)
      
      // Check each product
      $products.each((i, el) => {
        expect(el).to.have.class('product-card')
        expect(Cypress.$(el).find('.price')).to.exist
      })
    })
  })
  
  it('validates data structure', () => {
    cy.request('/api/config').then((response) => {
      expect(response.body).to.have.all.keys(['apiUrl', 'timeout', 'features'])
      expect(response.body.features).to.be.an('object')
      expect(response.body.features).to.have.property('darkMode')
    })
  })
})
```

### Multiple Element Assertions

```typescript
describe('Multiple Elements', () => {
  it('asserts on element collections', () => {
    cy.visit('/list')
    
    // All elements have class
    cy.get('.item').should('have.class', 'list-item')
    
    // Specific count
    cy.get('.item').should('have.length', 5)
    
    // Each element individually
    cy.get('.item').each(($item, index) => {
      cy.wrap($item)
        .should('be.visible')
        .and('contain', `Item ${index + 1}`)
    })
  })
})
```

## Negative Assertions

```typescript
describe('Negative Assertions', () => {
  it('uses not assertions', () => {
    cy.visit('/page')
    
    // Element should not exist
    cy.get('.removed').should('not.exist')
    
    // Should not be visible
    cy.get('.hidden').should('not.be.visible')
    
    // Should not have class
    cy.get('.button').should('not.have.class', 'disabled')
    
    // Should not contain text
    cy.get('.message').should('not.contain', 'Error')
    
    // Should not have attribute
    cy.get('input').should('not.have.attr', 'disabled')
  })
})
```

## Chaining Assertions

```typescript
describe('Chaining', () => {
  it('chains multiple assertions', () => {
    cy.visit('/user-profile')
    
    cy.get('.profile')
      .should('exist')
      .and('be.visible')
      .and('have.class', 'active')
      .and('contain', 'John Doe')
      .within(() => {
        cy.get('.email').should('contain', '@example.com')
        cy.get('.role').should('have.text', 'Admin')
      })
  })
  
  it('chains with different subjects', () => {
    cy.get('input[name="email"]')
      .should('have.value', '')
      .type('test@example.com')
      .should('have.value', 'test@example.com')
      .and('have.attr', 'type', 'email')
  })
})
```

## Custom Assertions

### Custom Chai Assertions

```typescript
// cypress/support/assertions.ts
declare global {
  namespace Chai {
    interface Assertion {
      validEmail(): Assertion
      positiveNumber(): Assertion
      withinRange(min: number, max: number): Assertion
    }
  }
}

chai.use((_chai, utils) => {
  _chai.Assertion.addMethod('validEmail', function() {
    const email = utils.flag(this, 'object')
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    this.assert(
      emailRegex.test(email),
      'expected #{this} to be a valid email',
      'expected #{this} not to be a valid email'
    )
  })
  
  _chai.Assertion.addMethod('positiveNumber', function() {
    const num = utils.flag(this, 'object')
    
    this.assert(
      typeof num === 'number' && num > 0,
      'expected #{this} to be a positive number',
      'expected #{this} not to be a positive number'
    )
  })
  
  _chai.Assertion.addMethod('withinRange', function(min: number, max: number) {
    const num = utils.flag(this, 'object')
    
    this.assert(
      num >= min && num <= max,
      `expected #{this} to be within ${min} and ${max}`,
      `expected #{this} not to be within ${min} and ${max}`
    )
  })
})

// Usage
describe('Custom Assertions', () => {
  it('uses custom email assertion', () => {
    cy.get('input[name="email"]')
      .invoke('val')
      .should('be.validEmail')
  })
  
  it('uses custom number assertions', () => {
    cy.get('.price')
      .invoke('text')
      .then(parseFloat)
      .should('be.positiveNumber')
      .and('be.withinRange', 10, 100)
  })
})
```

### Custom Cypress Commands with Assertions

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      shouldBeValidForm(): Chainable<void>
      shouldHaveValidationError(field: string, message: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('shouldBeValidForm', { prevSubject: 'element' }, (subject) => {
  cy.wrap(subject).within(() => {
    cy.get('input, select, textarea').each(($field) => {
      cy.wrap($field).should('not.have.class', 'error')
    })
    cy.get('.error-message').should('not.exist')
    cy.get('button[type="submit"]').should('be.enabled')
  })
})

Cypress.Commands.add('shouldHaveValidationError', (field: string, message: string) => {
  cy.get(`[name="${field}"]`)
    .should('have.class', 'error')
    .closest('.form-group')
    .find('.error-message')
    .should('contain', message)
})

// Usage
describe('Custom Command Assertions', () => {
  it('validates form state', () => {
    cy.visit('/form')
    cy.get('form').shouldBeValidForm()
    
    cy.get('input[name="email"]').clear()
    cy.get('button[type="submit"]').click()
    
    cy.shouldHaveValidationError('email', 'Email is required')
  })
})
```

## Assertion Best Practices

### 1. Use Should for Auto-Retry

```typescript
// ✅ Good - Auto-retries
cy.get('.element').should('be.visible')

// ❌ Avoid - No retry
cy.get('.element').then(($el) => {
  expect($el).to.be.visible
})
```

### 2. Chain Related Assertions

```typescript
// ✅ Good - Efficient chaining
cy.get('.button')
  .should('be.visible')
  .and('be.enabled')
  .and('have.text', 'Submit')

// ❌ Avoid - Multiple queries
cy.get('.button').should('be.visible')
cy.get('.button').should('be.enabled')
cy.get('.button').should('have.text', 'Submit')
```

### 3. Use Specific Assertions

```typescript
// ✅ Good - Specific
cy.get('.count').should('have.text', '5')

// ❌ Avoid - Generic
cy.get('.count').should('exist')
```

### 4. Negative Assertions with Timeout

```typescript
// ✅ Good - Explicit timeout for not.exist
cy.get('.loading', { timeout: 10000 }).should('not.exist')

// ⚠️ May timeout unnecessarily
cy.get('.loading').should('not.exist')  // Uses default timeout
```

## Assertion Helpers

```typescript
// cypress/support/assertion-helpers.ts
export class AssertionHelper {
  static assertElementState(
    selector: string,
    states: {
      visible?: boolean
      enabled?: boolean
      focused?: boolean
      checked?: boolean
    }
  ): void {
    const element = cy.get(selector)
    
    if (states.visible !== undefined) {
      element.should(states.visible ? 'be.visible' : 'not.be.visible')
    }
    
    if (states.enabled !== undefined) {
      element.should(states.enabled ? 'be.enabled' : 'be.disabled')
    }
    
    if (states.focused !== undefined) {
      element.should(states.focused ? 'have.focus' : 'not.have.focus')
    }
    
    if (states.checked !== undefined) {
      element.should(states.checked ? 'be.checked' : 'not.be.checked')
    }
  }
  
  static assertFormValid(formSelector: string): void {
    cy.get(formSelector).within(() => {
      cy.get('.error').should('not.exist')
      cy.get('button[type="submit"]').should('be.enabled')
    })
  }
  
  static assertApiResponse<T>(
    response: Cypress.Response<T>,
    expectedStatus: number,
    validator?: (body: T) => void
  ): void {
    expect(response.status).to.equal(expectedStatus)
    expect(response.body).to.exist
    
    if (validator) {
      validator(response.body)
    }
  }
}

// Usage
describe('Assertion Helpers', () => {
  it('uses helper methods', () => {
    cy.visit('/form')
    
    AssertionHelper.assertElementState('button', {
      visible: true,
      enabled: false
    })
    
    cy.get('input').type('value')
    AssertionHelper.assertFormValid('form')
  })
})
```

## Summary

- Use `.should()` for auto-retrying assertions
- Chain assertions with `.and()` for efficiency
- Support multiple assertion styles: should, expect, assert
- Common assertions: existence, visibility, text, value, attributes, CSS
- TypeScript provides type-safe assertion patterns
- Custom assertions extend Chai and Cypress
- Negative assertions use `.not` modifier
- Callback assertions enable complex validation
- Always use specific, meaningful assertions
- Chain related assertions on same element

## Next Steps

- **09 - Waits and Timeouts**: Understanding assertion retry behavior
- **13 - Debugging Tools**: Debugging failed assertions
- **19 - API Testing**: API response assertions

## Quick Reference

```typescript
// Existence
.should('exist')
.should('not.exist')

// Visibility
.should('be.visible')
.should('be.hidden')

// Text
.should('contain', 'text')
.should('have.text', 'exact')

// Value
.should('have.value', 'value')

// Attributes
.should('have.attr', 'name', 'value')
.should('have.class', 'className')

// State
.should('be.enabled')
.should('be.disabled')
.should('be.checked')
.should('have.focus')

// Length
.should('have.length', 5)
.should('have.length.greaterThan', 3)

// Chaining
.should('be.visible')
.and('contain', 'text')
.and('have.class', 'active')
```
