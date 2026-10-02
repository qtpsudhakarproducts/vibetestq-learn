# 24 - Cypress Advanced Concepts and Deep Dives

## Introduction

This document covers advanced Cypress concepts that are essential for mastering the framework. If you're coming from Selenium or Playwright, these concepts explain behaviors that may seem unusual or confusing at first.

## Table of Contents

1. jQuery Relationship in Cypress
2. Custom Commands
3. Parent, Child, and Dual Commands
4. Retry-ability Deep Dive
5. Error Handling in Cypress
6. Test Execution Flow
7. Test Isolation and State Management
8. TypeScript Configuration for Cypress
9. Plugin System and setupNodeEvents
10. Test Retries and Flake Prevention

---

## 1. jQuery Relationship in Cypress

### What is jQuery in Cypress?

Cypress bundles jQuery and uses it internally. Every element you query with `cy.get()` returns a jQuery object, not a raw DOM element.

```typescript
// When you do this:
cy.get('.button')

// Cypress returns a jQuery object wrapping the DOM element
// Similar to: $('.button') in jQuery
```

### Understanding $el in .then()

```typescript
// The $el parameter is a jQuery object
cy.get('.button').then(($el) => {
  // $el is jQuery-wrapped
  console.log($el)              // jQuery object
  console.log($el[0])           // Raw DOM element
  console.log($el.text())       // jQuery method
  console.log($el.length)       // Number of elements
})

// The $ prefix is a naming convention (not required)
// It indicates "this is jQuery"
cy.get('.button').then((element) => {
  // Works the same, but less clear it's jQuery
})
```

### jQuery Methods Available

```typescript
cy.get('.items').then(($items) => {
  // jQuery methods work directly
  const count = $items.length
  const text = $items.text()
  const html = $items.html()
  const value = $items.val()
  const isVisible = $items.is(':visible')
  const hasClass = $items.hasClass('active')
  
  // jQuery traversal
  const parent = $items.parent()
  const children = $items.children()
  const first = $items.first()
  const last = $items.last()
  
  // jQuery filtering
  const filtered = $items.filter('.selected')
  const found = $items.find('.child')
})
```

### Accessing Raw DOM Elements

```typescript
// Method 1: Array index
cy.get('.button').then(($btn) => {
  const domElement = $btn[0]  // Raw HTMLElement
  domElement.click()          // Native DOM method
})

// Method 2: .get() jQuery method
cy.get('.button').then(($btn) => {
  const domElement = $btn.get(0)  // Same as $btn[0]
})

// Method 3: Access multiple elements
cy.get('.items').then(($items) => {
  $items.each((index, element) => {
    // element is raw DOM, not jQuery
    console.log(element.tagName)
  })
})
```

### When to Use jQuery vs Cypress Commands

```typescript
// ❌ WRONG - Using jQuery methods in chain
cy.get('.button')
  .text()  // ERROR - .text() is not a Cypress command

// ✅ CORRECT - Use .invoke() for jQuery methods
cy.get('.button')
  .invoke('text')  // Returns text as Cypress command

// ✅ CORRECT - Use .then() for jQuery
cy.get('.button').then(($btn) => {
  const text = $btn.text()  // jQuery method
  console.log(text)
})

// When to use what:
// - Cypress commands: For chaining and assertions
// - .invoke(): To call jQuery methods and continue chain
// - .then(): To access jQuery object directly
```

### jQuery Selectors

```typescript
// Cypress uses jQuery selectors
cy.get('.button:visible')        // jQuery pseudo-selector
cy.get('input:checked')          // jQuery pseudo-selector
cy.get('div:contains("text")')   // jQuery pseudo-selector
cy.get('li:first')               // jQuery pseudo-selector
cy.get('tr:even')                // jQuery pseudo-selector

// These work because Cypress uses jQuery under the hood
```

### Cypress.$ - Direct jQuery Access

```typescript
// Cypress.$ gives you direct jQuery access
const $body = Cypress.$('body')  // Synchronous jQuery query
const $buttons = Cypress.$('.button')

// Use in .then() for synchronous checks
cy.get('body').then(($body) => {
  const $modal = $body.find('.modal')
  if ($modal.length > 0) {
    cy.wrap($modal).find('.close').click()
  }
})

// Note: Cypress.$ queries immediately (no retry)
// cy.get() queries with retry
```

### Working with Multiple Elements

```typescript
// jQuery collections
cy.get('.items').then(($items) => {
  // $items is a jQuery collection
  console.log($items.length)  // Number of elements
  
  // Iterate with .each()
  $items.each((index, element) => {
    const $el = Cypress.$(element)  // Wrap in jQuery
    console.log($el.text())
  })
  
  // Map to array
  const texts = $items.map((i, el) => Cypress.$(el).text()).get()
  console.log(texts)  // Array of strings
})
```

### TypeScript with jQuery

```typescript
// Type jQuery elements properly
cy.get<HTMLButtonElement>('.button').then(($btn) => {
  // $btn is JQuery<HTMLButtonElement>
  const element: HTMLButtonElement = $btn[0]
  element.disabled = false
})

// For multiple elements
cy.get<HTMLInputElement>('input').then(($inputs) => {
  // $inputs is JQuery<HTMLInputElement>
  $inputs.each((i, input) => {
    // input is HTMLInputElement
    console.log(input.value)
  })
})
```

### Common Patterns

```typescript
describe('jQuery Patterns', () => {
  it('extracts data from elements', () => {
    cy.get('.products .product').then(($products) => {
      // Extract all prices
      const prices = $products
        .find('.price')
        .map((i, el) => parseFloat(Cypress.$(el).text().replace('$', '')))
        .get()
      
      const total = prices.reduce((sum, price) => sum + price, 0)
      expect(total).to.be.greaterThan(0)
    })
  })
  
  it('checks element state', () => {
    cy.get('.checkbox').then(($checkbox) => {
      const isChecked = $checkbox.is(':checked')
      const isVisible = $checkbox.is(':visible')
      const isDisabled = $checkbox.is(':disabled')
      
      cy.log(`Checked: ${isChecked}`)
    })
  })
  
  it('modifies elements', () => {
    cy.get('.button').then(($btn) => {
      // Direct DOM manipulation (use carefully!)
      $btn.addClass('custom-class')
      $btn.attr('data-test', 'value')
      $btn.css('background', 'red')
    })
  })
})
```

### Summary: jQuery in Cypress

- Cypress uses jQuery internally for DOM queries
- `cy.get()` returns jQuery objects, not raw DOM
- Use `$el[0]` to access raw DOM element
- jQuery methods available in `.then()` callbacks
- Use `.invoke()` to call jQuery methods in chains
- `Cypress.$` for synchronous jQuery queries
- Understanding this is critical for Cypress mastery

---

## 2. Custom Commands

### Why Custom Commands?

Custom commands let you create reusable test logic and extend Cypress's API.

```typescript
// Instead of repeating:
cy.get('[data-cy="email"]').type('user@example.com')
cy.get('[data-cy="password"]').type('password')
cy.get('[data-cy="submit"]').click()

// Create a custom command:
cy.login('user@example.com', 'password')
```

### Creating Custom Commands

```typescript
// cypress/support/commands.ts

// Declare TypeScript types first
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      getByDataCy(selector: string): Chainable<JQuery<HTMLElement>>
      loginAsAdmin(): Chainable<void>
    }
  }
}

// Add the commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.get('[data-cy="email"]').type(email)
  cy.get('[data-cy="password"]').type(password)
  cy.get('[data-cy="submit"]').click()
})

Cypress.Commands.add('getByDataCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`)
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'adminpass')
})
```

### Custom Commands with Options

```typescript
interface LoginOptions {
  email: string
  password: string
  rememberMe?: boolean
}

declare global {
  namespace Cypress {
    interface Chainable {
      loginWithOptions(options: LoginOptions): Chainable<void>
    }
  }
}

Cypress.Commands.add('loginWithOptions', (options: LoginOptions) => {
  cy.get('[data-cy="email"]').type(options.email)
  cy.get('[data-cy="password"]').type(options.password)
  
  if (options.rememberMe) {
    cy.get('[data-cy="remember-me"]').check()
  }
  
  cy.get('[data-cy="submit"]').click()
})

// Usage:
cy.loginWithOptions({
  email: 'user@example.com',
  password: 'password',
  rememberMe: true
})
```

### Chainable Custom Commands

```typescript
// Return this for chaining
declare global {
  namespace Cypress {
    interface Chainable {
      selectDropdown(value: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('selectDropdown', { prevSubject: 'element' }, (subject, value) => {
  cy.wrap(subject)
    .click()
    .get('.dropdown-menu')
    .contains(value)
    .click()
  
  return cy.wrap(subject)  // Return for chaining
})

// Usage:
cy.get('.dropdown')
  .selectDropdown('Option 1')
  .should('have.class', 'selected')
```

### Parent vs Child Commands

```typescript
// Parent command - starts new chain
declare global {
  namespace Cypress {
    interface Chainable {
      createUser(userData: User): Chainable<string>
    }
  }
}

Cypress.Commands.add('createUser', (userData: User) => {
  return cy.request('POST', '/api/users', userData)
    .its('body.id')
})

// Child command - continues chain (prevSubject: 'element')
declare global {
  namespace Cypress {
    interface Chainable {
      clearAndType(text: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('clearAndType', { prevSubject: 'element' }, (subject, text) => {
  return cy.wrap(subject).clear().type(text)
})

// Usage:
cy.createUser({ name: 'John' })  // Parent - starts chain

cy.get('input')
  .clearAndType('text')  // Child - continues chain
```

### Overriding Existing Commands

```typescript
// Override cy.visit to add default options
Cypress.Commands.overwrite('visit', (originalFn, url, options) => {
  const defaults = {
    onBeforeLoad: (win) => {
      // Set up test helpers
      win.testMode = true
    }
  }
  
  return originalFn(url, { ...defaults, ...options })
})

// Usage: cy.visit() now has default behavior
cy.visit('/page')  // Automatically includes onBeforeLoad
```

### Custom Query Commands

```typescript
// Query commands can be retried
declare global {
  namespace Cypress {
    interface Chainable {
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
      findByRole(role: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('getByTestId', (testId: string) => {
  return cy.get(`[data-testid="${testId}"]`)
})

Cypress.Commands.add('findByRole', { prevSubject: 'element' }, (subject, role) => {
  return cy.wrap(subject).find(`[role="${role}"]`)
})
```

### Best Practices for Custom Commands

```typescript
// ✅ GOOD - Single responsibility
Cypress.Commands.add('fillLoginForm', (email, password) => {
  cy.get('#email').type(email)
  cy.get('#password').type(password)
})

// ❌ AVOID - Too much in one command
Cypress.Commands.add('doEverything', () => {
  cy.visit('/')
  cy.login()
  cy.createUser()
  cy.goToDashboard()
  cy.updateSettings()
  // Too much!
})

// ✅ GOOD - Returns for chaining
Cypress.Commands.add('selectOption', { prevSubject: 'element' }, (subject, value) => {
  cy.wrap(subject).select(value)
  return cy.wrap(subject)  // Chainable
})

// ❌ AVOID - No return
Cypress.Commands.add('selectOption', { prevSubject: 'element' }, (subject, value) => {
  cy.wrap(subject).select(value)
  // Can't chain
})

// ✅ GOOD - Type-safe
interface User {
  email: string
  password: string
}

Cypress.Commands.add('loginUser', (user: User) => {
  cy.get('#email').type(user.email)
  cy.get('#password').type(user.password)
})

// ❌ AVOID - No types
Cypress.Commands.add('loginUser', (user) => {
  cy.get('#email').type(user.email)
  cy.get('#password').type(user.password)
})
```

### Custom Command Organization

```typescript
// Organize commands by feature
// cypress/support/commands/auth.ts
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email, password) => {
  // implementation
})

Cypress.Commands.add('logout', () => {
  // implementation
})

// cypress/support/commands/api.ts
export {}

declare global {
  namespace Cypress {
    interface Chainable {
      apiCreateUser(user: User): Chainable<string>
      apiDeleteUser(id: string): Chainable<void>
    }
  }
}

// Import all in cypress/support/commands.ts
import './commands/auth'
import './commands/api'
```

---

## 3. Parent, Child, and Dual Commands

### Understanding Command Types

Cypress commands fall into three categories based on how they interact with the command chain.

### Parent Commands

Parent commands start a new command chain and don't require a subject.

```typescript
// Examples of parent commands:
cy.visit('/')          // Starts new chain
cy.request('/api')     // Starts new chain
cy.exec('npm test')    // Starts new chain
cy.task('seedDB')      // Starts new chain
cy.clearCookies()      // Starts new chain

// They can be called directly:
cy.visit('/')
cy.request('/api/users')

// Not chained from another command:
// cy.get('.button').visit('/')  // ❌ Doesn't make sense
```

### Child Commands

Child commands require a subject from the previous command and continue the chain.

```typescript
// Examples of child commands:
.click()         // Requires element subject
.type('text')    // Requires element subject
.select('option') // Requires element subject
.check()         // Requires element subject
.invoke('method') // Requires subject
.its('property')  // Requires subject

// Must be chained:
cy.get('.button').click()  // ✅ Correct

// Cannot be called directly:
cy.click()  // ❌ ERROR - no subject
```

### Dual Commands

Dual commands can work both ways - they can start a new chain OR continue an existing one.

```typescript
// cy.get() is dual - can do both:

// 1. As parent - starts new chain
cy.get('.button')

// 2. As child - continues chain (rare usage)
cy.get('.container')
  .get('.button')  // Queries entire document, not container!

// cy.contains() is dual:

// 1. As parent
cy.contains('Submit')

// 2. As child
cy.get('.modal')
  .contains('Submit')  // Searches within modal

// cy.screenshot() is dual:
cy.screenshot()  // Parent - screenshots page
cy.get('.element').screenshot()  // Child - screenshots element
```

### Why This Matters

```typescript
// Understanding command types explains chain behavior:

// ❌ WRONG - visit() is parent, breaks chain
cy.get('.button')
  .visit('/')  // ERROR - can't chain visit()
  .should('be.visible')

// ✅ CORRECT - start new chain
cy.get('.button').click()
cy.visit('/page')  // New chain
cy.get('.result').should('be.visible')

// ❌ WRONG - click() is child, needs subject
cy.visit('/')
cy.click()  // ERROR - nothing to click

// ✅ CORRECT - provide subject
cy.visit('/')
cy.get('.button').click()  // Has subject
```

### Common Mistakes

```typescript
// Mistake 1: Chaining parent commands
cy.get('.button')
  .click()
  .request('/api')  // ❌ request() is parent, breaks chain

// Fix: Start new chain
cy.get('.button').click()
cy.request('/api')  // ✅ New chain

// Mistake 2: Using child without subject
cy.visit('/')
cy.type('text')  // ❌ type() needs element subject

// Fix: Provide subject
cy.visit('/')
cy.get('input').type('text')  // ✅ Has subject

// Mistake 3: Expecting dual command to query within
cy.get('.container')
  .get('.button')  // ❌ Queries whole document!

// Fix: Use .find() for scoped query
cy.get('.container')
  .find('.button')  // ✅ Queries within container
```

### Creating Custom Commands of Each Type

```typescript
// Parent command
declare global {
  namespace Cypress {
    interface Chainable {
      setupTest(): Chainable<void>
    }
  }
}

Cypress.Commands.add('setupTest', () => {
  // No prevSubject - parent command
  cy.visit('/')
  cy.clearCookies()
})

// Child command
declare global {
  namespace Cypress {
    interface Chainable {
      doubleClick(): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('doubleClick', { prevSubject: 'element' }, (subject) => {
  // Requires element - child command
  return cy.wrap(subject).dblclick()
})

// Dual command
declare global {
  namespace Cypress {
    interface Chainable {
      findByText(text: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('findByText', { prevSubject: 'optional' }, (subject, text) => {
  // prevSubject: 'optional' makes it dual
  if (subject) {
    // Acts as child - search within subject
    return cy.wrap(subject).contains(text)
  } else {
    // Acts as parent - search whole document
    return cy.contains(text)
  }
})
```

### Command Type Reference

| Command Type | prevSubject | Can start chain? | Needs subject? |
|-------------|-------------|------------------|----------------|
| Parent | `undefined` | ✅ Yes | ❌ No |
| Child | `'element'` or other | ❌ No | ✅ Yes |
| Dual | `'optional'` | ✅ Yes | ⚠️ Optional |

---

## 4. Retry-ability Deep Dive

### What is Retry-ability?

Cypress automatically retries certain commands until they succeed or timeout. This is one of Cypress's most powerful features.

### Commands That Retry

```typescript
// These commands retry automatically:
cy.get('.button')           // Retries until element exists
cy.contains('text')         // Retries until text found
cy.find('.child')          // Retries until child found

// With assertions, they retry together:
cy.get('.button')
  .should('be.visible')    // Retries get + assertion together
  .should('have.class', 'active')  // Retries again

// The ENTIRE chain retries:
cy.get('.container')
  .find('.button')
  .should('be.visible')
// If any part fails, entire chain retries
```

### Commands That Don't Retry

```typescript
// These commands run once and don't retry:
cy.request('/api')          // Runs once
cy.exec('command')          // Runs once
cy.task('doSomething')      // Runs once
cy.clearCookies()          // Runs once

// Actions run once:
cy.get('.button').click()   // click() runs once
cy.get('input').type('text')  // type() runs once

// But the query before it retries:
cy.get('.button')  // This retries
  .click()        // This runs once after button found
```

### .should() Retries vs .then() Doesn't

```typescript
// ✅ .should() retries until assertion passes
cy.get('.count').should('have.text', '5')
// Keeps checking .count until text is '5' or timeout

// ❌ .then() runs once with current value
cy.get('.count').then(($el) => {
  expect($el.text()).to.equal('5')  // Checks once, doesn't retry!
})

// This is critical difference:
// .should() = retriable assertion
// .then() = one-time callback
```

### Making Commands Retry-able

```typescript
// Pattern 1: Use .should() with callback
cy.get('.items').should(($items) => {
  // This callback runs repeatedly until it passes
  expect($items).to.have.length(3)
  expect($items.first()).to.contain('Item 1')
})

// Pattern 2: Chain queries before assertion
cy.get('.container')
  .find('.button')
  .should('be.visible')
// find() is part of retry chain

// Pattern 3: Wrap in custom retry-able command
Cypress.Commands.add('getWithRetry', (selector, expectedCount) => {
  return cy.get(selector).should('have.length', expectedCount)
})
```

### Debugging Retry Behavior

```typescript
// See retry in action:
cy.get('.button', { timeout: 10000 })  // Retries for 10 seconds
  .should('be.visible')

// Add .then() to see value at moment it passes
cy.get('.count')
  .should('have.text', '5')
  .then(($el) => {
    console.log('Final value:', $el.text())  // Logs when assertion passes
  })
```

### Common Retry Mistakes

```typescript
// ❌ WRONG - Assertion in .then() doesn't retry
cy.get('.count').then(($el) => {
  expect($el.text()).to.equal('5')  // Checks once only!
})

// ✅ CORRECT - Use .should() for retry
cy.get('.count').should('have.text', '5')

// ❌ WRONG - Breaking retry chain
cy.get('.button').then(($btn) => {
  cy.wrap($btn).should('be.visible')  // Creates new chain, loses retry
})

// ✅ CORRECT - Keep chain intact
cy.get('.button').should('be.visible')

// ❌ WRONG - Action breaks retry
cy.get('.button')
  .click()  // Runs once
  .should('not.exist')  // Button may not disappear immediately

// ✅ CORRECT - Separate assertions
cy.get('.button').click()
cy.get('.button').should('not.exist')  // New retry chain
```

### Retry-ability with Aliases

```typescript
// Aliases are retriable:
cy.get('.count').as('count')

cy.get('@count').should('have.text', '5')  // Retries

// But value stored in alias is snapshot:
cy.get('.count').invoke('text').as('countText')

cy.get('@countText').then((text) => {
  // text is the value when alias was created
  // Doesn't update if count changes
})
```

### Custom Retry Logic

```typescript
// For complex retry logic, use .should() with callback:
cy.get('.items').should(($items) => {
  const texts = $items.map((i, el) => Cypress.$(el).text()).get()
  const hasExpected = texts.some(text => text.includes('Expected'))
  expect(hasExpected).to.be.true
})

// Or use recursion pattern:
function checkUntilFound(selector: string, expectedText: string, attempts: number = 0) {
  if (attempts > 10) {
    throw new Error('Max attempts reached')
  }
  
  cy.get('body').then(($body) => {
    const $element = $body.find(selector)
    
    if ($element.text().includes(expectedText)) {
      cy.log('Found!')
    } else {
      cy.wait(1000)
      checkUntilFound(selector, expectedText, attempts + 1)
    }
  })
}
```

### Retry Summary

- Query commands (get, find, contains) retry automatically
- Assertions with .should() retry
- Actions (click, type) run once
- .then() callbacks run once
- Entire query chain retries together
- Use .should() for retriable assertions
- Use .then() for one-time operations

---

## 5. Error Handling in Cypress

### Try-Catch Doesn't Work

```typescript
// ❌ WRONG - try-catch doesn't work with Cypress commands
try {
  cy.get('.nonexistent').click()
} catch (error) {
  console.log('Element not found')  // This never runs!
}

// Why? Cypress commands are asynchronous and queued
// The try-catch executes immediately, before commands run
```

### Using cy.on('fail')

```typescript
// ✅ CORRECT - Handle test failures with cy.on('fail')
cy.on('fail', (error, runnable) => {
  // error: Error object
  // runnable: Test context
  
  console.log('Test failed:', error.message)
  
  // Return false to prevent test from failing
  if (error.message.includes('expected element')) {
    return false  // Swallow error, test continues
  }
  
  // Return true or don't return to let test fail normally
  return true
})

// Now test won't fail if element not found:
cy.get('.optional-element').click()
```

### Handling Expected Failures

```typescript
// Scenario: Check if element exists without failing
describe('Conditional Actions', () => {
  it('clicks element if it exists', () => {
    cy.get('body').then(($body) => {
      // Synchronous check - doesn't fail
      if ($body.find('.modal').length > 0) {
        cy.get('.modal .close').click()
      }
    })
  })
  
  it('uses cy.on for optional elements', () => {
    let errorOccurred = false
    
    cy.on('fail', (error) => {
      errorOccurred = true
      return false  // Don't fail test
    })
    
    cy.get('.optional-button').click()
    
    cy.then(() => {
      if (errorOccurred) {
        cy.log('Button was not found, continuing...')
      }
    })
  })
})
```

### failOnStatusCode for API

```typescript
// By default, Cypress fails on non-2xx status codes
cy.request('/api/users/999')  // Fails if 404

// Use failOnStatusCode: false to handle errors
cy.request({
  url: '/api/users/999',
  failOnStatusCode: false
}).then((response) => {
  if (response.status === 404) {
    cy.log('User not found, as expected')
  } else {
    cy.log('User found')
  }
})

// Useful for testing error scenarios:
cy.request({
  method: 'POST',
  url: '/api/users',
  body: { invalid: 'data' },
  failOnStatusCode: false
}).then((response) => {
  expect(response.status).to.equal(400)
  expect(response.body.error).to.exist
})
```

### Custom Error Messages

```typescript
// Add context to errors:
cy.get('.button', { timeout: 10000 })
  .should('be.visible')
  .and('not.be.disabled')
  .then(($btn) => {
    if (!$btn.hasClass('ready')) {
      throw new Error('Button is not in ready state')
    }
  })

// Use cy.log for debugging context:
cy.log('Starting checkout process')
cy.get('.checkout-button').click()
cy.log('Checkout button clicked')
```

### Retry Failed Commands

```typescript
// Pattern: Retry a flaky command
function clickWithRetry(selector: string, maxAttempts: number = 3) {
  let attempts = 0
  
  function attemptClick() {
    attempts++
    
    cy.get('body').then(($body) => {
      if ($body.find(selector).length > 0) {
        cy.get(selector).click()
      } else if (attempts < maxAttempts) {
        cy.wait(1000)
        attemptClick()
      } else {
        throw new Error(`Element ${selector} not found after ${maxAttempts} attempts`)
      }
    })
  }
  
  attemptClick()
}

// Usage:
clickWithRetry('.dynamic-button', 5)
```

### Graceful Degradation

```typescript
// Pattern: Try primary action, fallback if fails
describe('Graceful Degradation', () => {
  it('tries multiple strategies', () => {
    let strategyUsed = 'primary'
    
    cy.on('fail', (error) => {
      if (error.message.includes('primary-button')) {
        strategyUsed = 'fallback'
        return false  // Don't fail, try fallback
      }
      return true  // Fail on other errors
    })
    
    // Try primary
    cy.get('.primary-button').click()
    
    // If primary failed, try fallback
    cy.then(() => {
      if (strategyUsed === 'fallback') {
        cy.get('.fallback-button').click()
      }
    })
  })
})
```

### Error Handling Best Practices

```typescript
// ✅ GOOD - Use failOnStatusCode for API error testing
cy.request({
  url: '/api/endpoint',
  failOnStatusCode: false
}).then((response) => {
  // Handle all status codes
})

// ✅ GOOD - Synchronous checks in .then()
cy.get('body').then(($body) => {
  if ($body.find('.modal').length > 0) {
    // Handle modal
  }
})

// ✅ GOOD - cy.on('fail') for specific scenarios
cy.on('fail', (error) => {
  if (error.message.includes('specific error')) {
    return false  // Handle gracefully
  }
})

// ❌ AVOID - try-catch with Cypress commands
try {
  cy.get('.element').click()
} catch {
  // Never runs!
}

// ❌ AVOID - Swallowing all errors
cy.on('fail', () => {
  return false  // Bad - hides real failures
})
```

---

## 6. Test Execution Flow

### How Cypress Executes Tests

```typescript
// Cypress builds a command queue, then executes
describe('Execution Flow', () => {
  it('demonstrates command queue', () => {
    console.log('1 - Synchronous')  // Runs immediately
    
    cy.get('.button')  // Queued
    console.log('2 - Synchronous')  // Runs immediately
    
    cy.get('.input').type('text')  // Queued
    console.log('3 - Synchronous')  // Runs immediately
    
    cy.get('.result')  // Queued
    
    // Output order: 1, 2, 3, then Cypress commands execute
  })
})
```

### Mixing Sync and Async Code

```typescript
// ❌ WRONG - Variable not set when expected
let text
cy.get('.element').then(($el) => {
  text = $el.text()
})
console.log(text)  // undefined! Runs before .then()

// ✅ CORRECT - Use variable inside .then() or later cy command
cy.get('.element').then(($el) => {
  const text = $el.text()
  console.log(text)  // Works! Inside callback
})

// Or use in later cy command:
let text
cy.get('.element').then(($el) => {
  text = $el.text()
})

cy.then(() => {
  console.log(text)  // Works! Queued after previous cy command
})
```

### Hook Execution Order

```typescript
describe('Hook Order', () => {
  before(() => {
    console.log('1 - before (once before all tests)')
  })
  
  beforeEach(() => {
    console.log('2 - beforeEach (before each test)')
  })
  
  afterEach(() => {
    console.log('4 - afterEach (after each test)')
  })
  
  after(() => {
    console.log('5 - after (once after all tests)')
  })
  
  it('test 1', () => {
    console.log('3 - test 1')
  })
  
  it('test 2', () => {
    console.log('3 - test 2')
  })
})

// Output:
// 1 - before
// 2 - beforeEach
// 3 - test 1
// 4 - afterEach
// 2 - beforeEach
// 3 - test 2
// 4 - afterEach
// 5 - after
```

### Nested Describe Blocks

```typescript
describe('Outer', () => {
  before(() => console.log('Outer before'))
  beforeEach(() => console.log('Outer beforeEach'))
  
  describe('Inner', () => {
    before(() => console.log('Inner before'))
    beforeEach(() => console.log('Inner beforeEach'))
    
    it('test', () => console.log('Test'))
    
    afterEach(() => console.log('Inner afterEach'))
    after(() => console.log('Inner after'))
  })
  
  afterEach(() => console.log('Outer afterEach'))
  after(() => console.log('Outer after'))
})

// Output:
// Outer before
// Inner before
// Outer beforeEach
// Inner beforeEach
// Test
// Inner afterEach
// Outer afterEach
// Inner after
// Outer after
```

### cy.then() for Sync Points

```typescript
// Use cy.then() to execute code at specific point in queue
cy.get('.button').click()

cy.then(() => {
  // This runs AFTER click completes
  console.log('Button was clicked')
})

cy.get('.result').should('be.visible')
```

### Why console.log Runs First

```typescript
it('demonstrates timing', () => {
  console.log('Start')  // Runs immediately
  
  cy.visit('/')        // Queued
  console.log('After visit')  // Runs immediately (before visit!)
  
  cy.get('.button')    // Queued
  console.log('After get')  // Runs immediately (before get!)
  
  // All console.logs run first, then Cypress commands
})

// To log at correct time, use cy.then():
it('correct logging', () => {
  cy.visit('/')
  cy.then(() => console.log('After visit'))  // Queued correctly
  
  cy.get('.button')
  cy.then(() => console.log('After get'))  // Queued correctly
})
```

---

## 7. Test Isolation and State Management

### Test Isolation in Cypress

```typescript
// Each test SHOULD be isolated
describe('Test Isolation', () => {
  // ❌ WRONG - Tests depend on each other
  it('creates user', () => {
    cy.request('POST', '/api/users', { name: 'John' })
    // User created
  })
  
  it('updates user', () => {
    // Depends on previous test! Bad!
    cy.request('PUT', '/api/users/1', { name: 'Jane' })
  })
  
  // ✅ CORRECT - Tests are independent
  it('creates and updates user', () => {
    cy.request('POST', '/api/users', { name: 'John' })
      .then((response) => {
        const userId = response.body.id
        cy.request('PUT', `/api/users/${userId}`, { name: 'Jane' })
      })
  })
})
```

### cy.session() for State Management

```typescript
// cy.session() caches state between tests
describe('Session Management', () => {
  beforeEach(() => {
    // Cache login session
    cy.session('user-session', () => {
      cy.visit('/login')
      cy.get('#email').type('user@example.com')
      cy.get('#password').type('password')
      cy.get('button').click()
    }, {
      validate() {
        // Verify session is still valid
        cy.request('/api/me').its('status').should('eq', 200)
      }
    })
  })
  
  it('test 1', () => {
    cy.visit('/dashboard')
    // Already logged in from session
  })
  
  it('test 2', () => {
    cy.visit('/profile')
    // Already logged in from session
  })
})
```

### beforeEach vs before

```typescript
describe('Hook Differences', () => {
  // before: Runs ONCE before all tests
  before(() => {
    cy.task('seedDatabase')  // Expensive operation once
  })
  
  // beforeEach: Runs BEFORE EACH test
  beforeEach(() => {
    cy.visit('/')           // Fresh page for each test
    cy.clearCookies()      // Clean state for each test
  })
  
  it('test 1', () => {
    // Has clean state from beforeEach
  })
  
  it('test 2', () => {
    // Has clean state from beforeEach
    // Database still seeded from before
  })
})
```

### State Cleanup

```typescript
describe('State Cleanup', () => {
  afterEach(() => {
    // Clean up after each test
    cy.clearCookies()
    cy.clearLocalStorage()
    
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
  })
  
  after(() => {
    // Clean up after all tests
    cy.task('clearDatabase')
  })
})
```

### Shared Test Data

```typescript
// ✅ GOOD - Create fresh data for each test
describe('User Tests', () => {
  beforeEach(() => {
    cy.fixture('user.json').as('userData')
  })
  
  it('test 1', function() {
    // Fresh copy of userData
    cy.request('POST', '/api/users', this.userData)
  })
  
  it('test 2', function() {
    // Fresh copy of userData
    cy.request('POST', '/api/users', this.userData)
  })
})

// ❌ AVOID - Sharing mutable state
describe('User Tests', () => {
  let user  // Shared across tests!
  
  before(() => {
    cy.request('POST', '/api/users', {}).then((res) => {
      user = res.body  // All tests use same user
    })
  })
  
  it('test 1', () => {
    cy.request('PUT', `/api/users/${user.id}`, {})  // Modifies shared user!
  })
  
  it('test 2', () => {
    // Uses modified user from test 1!
  })
})
```

---

## 8. TypeScript Configuration for Cypress

### Basic TypeScript Setup

```json
// tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "types": ["cypress", "node"],
    "module": "ESNext",
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["cypress/*"]
    }
  },
  "include": [
    "cypress/**/*.ts",
    "cypress.config.ts"
  ]
}
```

### Typing Custom Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Login with email and password
       * @param email - User email
       * @param password - User password
       * @example cy.login('user@example.com', 'password')
       */
      login(email: string, password: string): Chainable<void>
      
      /**
       * Get element by data-cy attribute
       * @param selector - data-cy value
       * @example cy.getByDataCy('submit-button')
       */
      getByDataCy(selector: string): Chainable<JQuery<HTMLElement>>
      
      /**
       * Login as specific user type
       * @param userType - Type of user to login as
       */
      loginAs(userType: 'admin' | 'user' | 'guest'): Chainable<void>
    }
  }
}

export {}  // Make this a module
```

### Typing Fixtures

```typescript
// cypress/fixtures/types.ts
export interface User {
  id: number
  email: string
  name: string
  role: 'admin' | 'user'
}

export interface Product {
  id: string
  name: string
  price: number
  inStock: boolean
}

// In tests:
describe('Typed Fixtures', () => {
  it('uses typed fixture', () => {
    cy.fixture<User>('user.json').then((user) => {
      // user is typed as User
      expect(user.email).to.be.a('string')
      expect(user.role).to.be.oneOf(['admin', 'user'])
    })
  })
})
```

### Generic Types

```typescript
// Type-safe API helper
class TypedApi {
  static get<T>(url: string): Cypress.Chainable<T> {
    return cy.request<T>('GET', url).its('body')
  }
  
  static post<T, R = T>(url: string, body: T): Cypress.Chainable<R> {
    return cy.request<R>({
      method: 'POST',
      url,
      body
    }).its('body')
  }
}

// Usage:
interface CreateUserRequest {
  name: string
  email: string
}

interface CreateUserResponse {
  id: number
  name: string
  email: string
}

TypedApi.post<CreateUserRequest, CreateUserResponse>('/api/users', {
  name: 'John',
  email: 'john@example.com'
}).then((response) => {
  // response is typed as CreateUserResponse
  expect(response.id).to.be.a('number')
})
```

### Environment Variables Types

```typescript
// cypress.d.ts
declare namespace Cypress {
  interface Env {
    apiUrl: string
    apiKey: string
    testUser: {
      email: string
      password: string
    }
  }
}

// Usage with type safety:
const apiUrl = Cypress.env('apiUrl')  // string
const testUser = Cypress.env('testUser')  // { email: string, password: string }
```

---

## 9. Plugin System and setupNodeEvents

### Understanding setupNodeEvents

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // 'on' - register event listeners
      // 'config' - Cypress configuration
      
      // Tasks run in Node.js (not browser)
      on('task', {
        log(message: string) {
          console.log(message)
          return null  // Tasks must return value or null
        },
        
        readFileFromSystem(filePath: string) {
          const fs = require('fs')
          return fs.readFileSync(filePath, 'utf8')
        },
        
        queryDatabase(query: string) {
          // Database operations
          return { rows: [] }
        }
      })
      
      // Browser launch events
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage')
        }
        return launchOptions
      })
      
      // Spec events
      on('after:spec', (spec, results) => {
        console.log(`Finished: ${spec.name}`)
        console.log(`Tests: ${results.tests?.length}`)
      })
      
      return config  // Must return config
    }
  }
})
```

### Using Tasks in Tests

```typescript
// In tests, call tasks with cy.task()
describe('Tasks', () => {
  it('uses Node.js task', () => {
    cy.task('log', 'Running test')
    
    cy.task('readFileFromSystem', 'data.txt')
      .then((content) => {
        expect(content).to.include('expected text')
      })
  })
})
```

### Plugin Examples

```typescript
// Webpack preprocessor
on('file:preprocessor', require('@cypress/webpack-preprocessor'))

// Code coverage
require('@cypress/code-coverage/task')(on, config)

// Custom plugin
on('task', {
  'db:seed'() {
    // Seed database
    return null
  },
  
  'db:clear'() {
    // Clear database
    return null
  }
})
```

---

## 10. Test Retries and Flake Prevention

### Configuring Retries

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    retries: {
      runMode: 2,      // Retry twice in CI
      openMode: 0      // No retries when developing
    }
  }
})

// Per-test retries
it('flaky test', {
  retries: {
    runMode: 3,
    openMode: 1
  }
}, () => {
  // Test code
})
```

### Writing Retry-Safe Tests

```typescript
// ✅ GOOD - Idempotent tests
it('retry-safe test', () => {
  cy.visit('/')  // Can run multiple times
  cy.get('.button').click()  // Safe to retry
  cy.get('.result').should('exist')  // Assertion retries
})

// ❌ AVOID - Non-idempotent
it('not retry-safe', () => {
  cy.get('.counter').click()  // Increments each time!
  cy.get('.counter').should('have.text', '1')  // Fails on retry
})
```

### Preventing Flaky Tests

```typescript
// ✅ GOOD - Wait for stability
cy.get('.button')
  .should('be.visible')
  .and('not.be.disabled')
  .click()

// ✅ GOOD - Wait for network
cy.intercept('POST', '/api/save').as('save')
cy.get('.save-button').click()
cy.wait('@save')

// ✅ GOOD - Use proper waits
cy.get('.loading').should('not.exist')
cy.get('.content').should('be.visible')

// ❌ AVOID - Arbitrary waits
cy.wait(1000)  // Flaky!
cy.get('.content')
```

---

## Summary

This guide covered advanced Cypress concepts critical for mastery:

1. **jQuery Relationship** - Understanding `$el` and jQuery methods
2. **Custom Commands** - Creating reusable, type-safe commands
3. **Command Types** - Parent, child, and dual commands
4. **Retry-ability** - Which commands retry and why
5. **Error Handling** - cy.on('fail') and proper patterns
6. **Execution Flow** - How commands queue and execute
7. **State Management** - cy.session() and isolation
8. **TypeScript** - Complete type-safe configuration
9. **Plugins** - setupNodeEvents and tasks
10. **Flake Prevention** - Writing reliable tests

These concepts explain behaviors that confuse Selenium/Playwright users and are essential for writing maintainable Cypress tests.
