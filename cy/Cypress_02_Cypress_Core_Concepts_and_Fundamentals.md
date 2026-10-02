# 02 - Cypress Core Concepts and Fundamentals

## Introduction for Selenium/Playwright Users

If you're coming from Selenium or Playwright, Cypress works fundamentally differently. This guide explains Cypress-specific concepts that are critical to understand before writing tests.

## Table of Contents

1. Global Objects (Cypress, cy, expect)
2. Command Chaining
3. Querying Commands (get, find, within, contains)
4. Storing and Reusing Values
5. Aliasing (.as() and @)
6. cy.wrap() - Wrapping Values
7. .then() and Closures
8. Subject Yielding
9. Asynchronous Nature
10. Variable Patterns
11. Common Migration Patterns

---

## 1. Global Objects

### The `cy` Object

```typescript
// Cypress provides cy globally - no imports needed!
// ❌ Not needed in Cypress:
// import { cy } from 'cypress'

// ✅ Just use cy directly:
cy.visit('/')
cy.get('.button')

// cy is the main command API
// Every test command starts with cy
```

### The `Cypress` Object

```typescript
// Cypress (capital C) is for configuration and utilities
Cypress.config('baseUrl')           // Get config value
Cypress.env('API_KEY')              // Get environment variable
Cypress.isBrowser('chrome')         // Check browser
Cypress.version                     // Cypress version

// Example:
if (Cypress.env('ENVIRONMENT') === 'staging') {
  cy.visit('/staging-only-page')
}
```

### The `expect` Object

```typescript
// Chai's expect is available globally
expect(true).to.be.true
expect([1, 2, 3]).to.have.length(3)

// Used inside .then() for synchronous assertions:
cy.get('.count').then(($el) => {
  const count = parseInt($el.text())
  expect(count).to.be.greaterThan(0)
})
```

### Comparison with Selenium/Playwright

```typescript
// Selenium (Java)
WebDriver driver = new ChromeDriver();
driver.get("https://example.com");
WebElement element = driver.findElement(By.id("button"));

// Playwright
const { chromium } = require('playwright');
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto('https://example.com');
const element = await page.locator('#button');

// Cypress - No imports, no initialization needed!
cy.visit('https://example.com')
cy.get('#button')
```

---

## 2. Command Chaining

### How Chaining Works

```typescript
// Cypress commands are chainable
cy.get('.button')
  .click()
  .should('have.class', 'active')
  .parent()
  .should('be.visible')

// Each command yields a subject to the next command
// The chain reads naturally top to bottom
```

### Comparison: Selenium vs Cypress

```typescript
// Selenium - separate statements
WebElement button = driver.findElement(By.cssSelector(".button"));
button.click();
WebElement parent = button.findElement(By.xpath(".."));
Assert.assertTrue(parent.isDisplayed());

// Playwright - await on each step
const button = await page.locator('.button');
await button.click();
const parent = button.locator('..');
await expect(parent).toBeVisible();

// Cypress - fluid chaining
cy.get('.button')
  .click()
  .parent()
  .should('be.visible')
```

### Chain Breaks

```typescript
// Some commands end the chain and start a new one:

// ✅ These continue the chain:
cy.get('.button')      // Returns button element
  .click()            // Returns same button element
  .should('exist')    // Returns same button element

// ❌ These start a new chain:
cy.visit('/')         // Returns window
cy.request('/api')    // Returns response
cy.wrap({ id: 1 })    // Returns wrapped object

// After a chain break, start a new chain:
cy.visit('/')
cy.get('.button').click()  // New chain
```

---

## 3. Querying Commands: get, find, within, contains

### cy.get() - Query from Document

```typescript
// cy.get() always queries from the entire document
cy.get('.button')              // Finds .button anywhere in DOM
cy.get('[data-cy="submit"]')  // Finds element with data-cy attribute

// Similar to:
// Selenium: driver.findElement(By.cssSelector(".button"))
// Playwright: page.locator('.button')
```

### .find() - Query from Parent

```typescript
// .find() queries within the parent element (chain continues)
cy.get('.container')           // Get container
  .find('.button')            // Find button INSIDE container

// Similar to:
// Selenium: container.findElement(By.cssSelector(".button"))
// Playwright: container.locator('.button')

// ⚠️ Important difference:
cy.get('.container')
  .get('.button')             // ❌ WRONG - queries whole document again!

cy.get('.container')
  .find('.button')            // ✅ CORRECT - queries within container
```

### cy.within() - Scope Commands

```typescript
// cy.within() scopes ALL commands to an element
cy.get('.form').within(() => {
  cy.get('input[name="email"]').type('test@example.com')
  cy.get('input[name="password"]').type('password')
  cy.get('button').click()
  // All cy.get() calls are scoped to .form
})

// Without within:
cy.get('.form input[name="email"]').type('test@example.com')
cy.get('.form input[name="password"]').type('password')
cy.get('.form button').click()
```

### cy.contains() - Find by Text

```typescript
// cy.contains() finds elements by text content
cy.contains('Submit')                    // Any element with "Submit"
cy.contains('button', 'Submit')          // <button> with "Submit"
cy.contains('.button', 'Submit')         // .button with "Submit"

// Can be chained:
cy.get('.modal')
  .contains('Confirm')                   // Find "Confirm" within modal
  .click()

// Similar to:
// Selenium: driver.findElement(By.linkText("Submit"))
// Playwright: page.getByText('Submit')
```

### Complete Comparison Table

```typescript
// CYPRESS vs SELENIUM vs PLAYWRIGHT

// 1. Query entire document
cy.get('.button')
// Selenium: driver.findElement(By.cssSelector(".button"))
// Playwright: page.locator('.button')

// 2. Query within element
cy.get('.container').find('.button')
// Selenium: container.findElement(By.cssSelector(".button"))
// Playwright: container.locator('.button')

// 3. Scope multiple queries
cy.get('.form').within(() => {
  cy.get('input').type('text')
  cy.get('button').click()
})
// Selenium: WebElement form = driver.findElement(By.cssSelector(".form"))
//           form.findElement(By.tagName("input")).sendKeys("text")
//           form.findElement(By.tagName("button")).click()
// Playwright: const form = page.locator('.form')
//             await form.locator('input').fill('text')
//             await form.locator('button').click()

// 4. Find by text
cy.contains('Submit')
// Selenium: driver.findElement(By.linkText("Submit"))
// Playwright: page.getByText('Submit')
```

### Practical Examples

```typescript
describe('Query Command Examples', () => {
  it('demonstrates get vs find', () => {
    cy.visit('/form')
    
    // cy.get - searches entire page
    cy.get('[data-cy="submit"]').click()
    
    // .find - searches within parent
    cy.get('.user-profile')
      .find('.edit-button')
      .click()
    
    // Common mistake:
    cy.get('.container')
      .get('.button')  // ❌ BAD - searches whole page again!
    
    // Correct:
    cy.get('.container')
      .find('.button')  // ✅ GOOD - searches within container
  })
  
  it('demonstrates within', () => {
    cy.visit('/dashboard')
    
    // Without within - verbose
    cy.get('.sidebar .nav-item').first().click()
    cy.get('.sidebar .nav-item').eq(1).click()
    
    // With within - scoped and cleaner
    cy.get('.sidebar').within(() => {
      cy.get('.nav-item').first().click()
      cy.get('.nav-item').eq(1).click()
      // All cy.get() are scoped to .sidebar
    })
  })
  
  it('demonstrates contains', () => {
    cy.visit('/products')
    
    // Find by text
    cy.contains('Add to Cart').click()
    
    // Within a specific element
    cy.get('.product-card')
      .contains('MacBook Pro')
      .click()
    
    // With element selector
    cy.contains('button', 'Submit').click()
  })
})
```

---

## 4. Storing and Reusing Values

### Problem: Cypress Commands are Asynchronous

```typescript
// ❌ WRONG - This doesn't work in Cypress!
const button = cy.get('.button')  // Returns Chainable, not element!
button.click()                     // ERROR!

// ❌ WRONG - Can't store values directly
let text = cy.get('.count').text()  // Returns Chainable, not text!
console.log(text)                    // Won't show text!
```

### Solution 1: Use .then()

```typescript
// ✅ CORRECT - Use .then() to access the value
cy.get('.count').then(($el) => {
  const text = $el.text()
  console.log(text)  // Now this works!
})

// Store and reuse:
cy.get('.count').then(($el) => {
  const count = parseInt($el.text())
  
  cy.get('.increment').click()
  
  cy.get('.count').should(($newEl) => {
    const newCount = parseInt($newEl.text())
    expect(newCount).to.equal(count + 1)
  })
})
```

### Solution 2: Use Aliasing (.as())

```typescript
// ✅ CORRECT - Use aliases
cy.get('.count').invoke('text').as('originalCount')

cy.get('.increment').click()

cy.get('@originalCount').then((originalCount) => {
  cy.get('.count').should(($el) => {
    expect(parseInt($el.text())).to.be.greaterThan(parseInt(originalCount))
  })
})
```

### Solution 3: Use Closures with let

```typescript
// ✅ CORRECT - Use closures
let count: number

cy.get('.count')
  .invoke('text')
  .then((text) => {
    count = parseInt(text)
  })

cy.get('.increment').click()

cy.get('.count').should(($el) => {
  const newCount = parseInt($el.text())
  expect(newCount).to.equal(count + 1)
})
```

### Comparison: Variable Storage

```typescript
// SELENIUM - Synchronous, straightforward
WebElement element = driver.findElement(By.cssSelector(".count"));
String text = element.getText();
int count = Integer.parseInt(text);
System.out.println(count);  // Works immediately

// PLAYWRIGHT - Async/await, straightforward
const element = await page.locator('.count');
const text = await element.textContent();
const count = parseInt(text);
console.log(count);  // Works after await

// CYPRESS - Asynchronous commands, use .then()
cy.get('.count').then(($el) => {
  const text = $el.text()
  const count = parseInt(text)
  console.log(count)  // Works inside .then()
})

// Or use invoke:
cy.get('.count')
  .invoke('text')
  .then((text) => {
    const count = parseInt(text)
    console.log(count)
  })
```

---

## 5. Aliasing (.as() and @)

### What is Aliasing?

Aliasing lets you store references to elements, requests, or values and access them later using `@` syntax.

### Basic Aliasing

```typescript
// Store element reference
cy.get('.button').as('submitButton')

// Reuse later with @
cy.get('@submitButton').click()
cy.get('@submitButton').should('have.class', 'active')

// Similar to Selenium:
// WebElement submitButton = driver.findElement(By.cssSelector(".button"));
// submitButton.click();
// Assert.assertTrue(submitButton.getAttribute("class").contains("active"));
```

### Aliasing DOM Elements

```typescript
describe('DOM Aliasing', () => {
  beforeEach(() => {
    cy.visit('/form')
    
    // Create aliases
    cy.get('[data-cy="email"]').as('emailInput')
    cy.get('[data-cy="password"]').as('passwordInput')
    cy.get('[data-cy="submit"]').as('submitButton')
  })
  
  it('uses aliased elements', () => {
    cy.get('@emailInput').type('user@example.com')
    cy.get('@passwordInput').type('password123')
    cy.get('@submitButton').click()
  })
})
```

### Aliasing Network Requests

```typescript
// Alias a network request
cy.intercept('GET', '/api/users').as('getUsers')

cy.visit('/users')

// Wait for the aliased request
cy.wait('@getUsers')

// Access request details
cy.wait('@getUsers').then((interception) => {
  expect(interception.response.statusCode).to.equal(200)
  expect(interception.response.body).to.have.length.greaterThan(0)
})

// Similar to Playwright:
// await page.route('/api/users', route => route.continue());
// const response = await page.waitForResponse('/api/users');
```

### Aliasing Fixture Data

```typescript
// Alias fixture data
before(() => {
  cy.fixture('users.json').as('users')
  cy.fixture('products.json').as('products')
})

it('uses aliased fixtures', function() {
  // Access via this.aliasName
  const users = this.users
  expect(users).to.be.an('array')
  
  cy.log(`Testing with ${users.length} users`)
})
```

### Aliasing Values

```typescript
// Alias any value
cy.wrap({ id: 123, name: 'John' }).as('user')

cy.get('@user').then((user) => {
  expect(user.id).to.equal(123)
  expect(user.name).to.equal('John')
})

// Alias computed values
cy.get('.count')
  .invoke('text')
  .then((text) => parseInt(text))
  .as('originalCount')

cy.get('@originalCount').should('be.greaterThan', 0)
```

### TypeScript with Aliases

```typescript
interface User {
  id: number
  name: string
}

describe('Type-Safe Aliasing', () => {
  before(() => {
    cy.fixture<User[]>('users.json').as('users')
  })
  
  it('uses typed alias', function() {
    const users = this.users as User[]
    users.forEach(user => {
      expect(user.id).to.be.a('number')
      expect(user.name).to.be.a('string')
    })
  })
})
```

### Alias Best Practices

```typescript
// ✅ GOOD - Descriptive alias names
cy.get('.submit-button').as('submitBtn')
cy.intercept('GET', '/api/users').as('getUsersRequest')

// ❌ AVOID - Vague names
cy.get('.submit-button').as('btn')
cy.intercept('GET', '/api/users').as('req')

// ✅ GOOD - Use aliases for repeated elements
cy.get('[data-cy="complex-selector-that-repeats"]').as('element')
cy.get('@element').click()
cy.get('@element').should('be.visible')

// ❌ AVOID - Repeat complex selectors
cy.get('[data-cy="complex-selector-that-repeats"]').click()
cy.get('[data-cy="complex-selector-that-repeats"]').should('be.visible')
```

---

## 6. cy.wrap() - Wrapping Values

### What is cy.wrap()?

`cy.wrap()` converts non-Cypress values into Cypress commands so you can chain Cypress commands on them.

### Basic Usage

```typescript
// Wrap a plain value
cy.wrap('Hello').should('equal', 'Hello')

// Wrap an object
cy.wrap({ name: 'John', age: 30 })
  .should('have.property', 'name', 'John')
  .and('have.property', 'age', 30)

// Wrap an array
cy.wrap([1, 2, 3])
  .should('have.length', 3)
  .and('include', 2)
```

### Wrapping jQuery Elements

```typescript
// Get DOM element, then wrap for Cypress commands
cy.get('.button').then(($btn) => {
  // $btn is a jQuery object
  const text = $btn.text()
  
  // Wrap to use Cypress commands
  cy.wrap($btn).click()
  cy.wrap($btn).should('be.visible')
})
```

### Wrapping Promises

```typescript
// Wrap a Promise to use in Cypress chain
const promise = new Promise((resolve) => {
  setTimeout(() => resolve('Done'), 1000)
})

cy.wrap(promise).should('equal', 'Done')

// Practical example - wrapping async function
function fetchData(): Promise<{ id: number }> {
  return Promise.resolve({ id: 123 })
}

cy.wrap(fetchData()).should('have.property', 'id', 123)
```

### Wrapping to Continue Chains

```typescript
// Problem: Want to use a value in multiple places
cy.get('.count').then(($el) => {
  const count = parseInt($el.text())
  
  // ❌ Can't use cy commands here directly after non-cy code
  if (count > 5) {
    // Need to get back into cy chain
    cy.wrap(count).should('be.greaterThan', 5)
  }
})

// ✅ Better pattern:
cy.get('.count')
  .invoke('text')
  .then(parseInt)
  .then((count) => {
    cy.wrap(count).should('be.greaterThan', 0)
    
    if (count > 5) {
      cy.get('.warning').should('be.visible')
    }
  })
```

### Wrapping for Assertions

```typescript
// Wrap computed values for assertions
cy.get('.items .item').then(($items) => {
  const count = $items.length
  const texts = $items.map((i, el) => Cypress.$(el).text()).get()
  
  cy.wrap(count).should('be.greaterThan', 0)
  cy.wrap(texts).should('include', 'Item 1')
})
```

### cy.wrap() vs Direct Assignment

```typescript
// WRONG - Can't use Cypress commands on regular variables
let value = 'test'
value.should('equal', 'test')  // ❌ ERROR

// CORRECT - Wrap the value first
let value = 'test'
cy.wrap(value).should('equal', 'test')  // ✅ Works

// COMPARISON to Selenium/Playwright
// Selenium - direct assertions
String value = "test";
Assert.assertEquals("test", value);

// Playwright - direct expect
const value = 'test';
expect(value).toBe('test');

// Cypress - wrap non-Cypress values
const value = 'test'
cy.wrap(value).should('equal', 'test')
```

### Practical Examples

```typescript
describe('cy.wrap() Examples', () => {
  it('wraps object for chaining', () => {
    const user = {
      id: 1,
      name: 'John',
      email: 'john@example.com'
    }
    
    cy.wrap(user)
      .should('have.property', 'id', 1)
      .and('have.property', 'name', 'John')
  })
  
  it('wraps array for iteration', () => {
    const numbers = [1, 2, 3, 4, 5]
    
    cy.wrap(numbers)
      .should('have.length', 5)
      .and('include', 3)
  })
  
  it('wraps to continue chain after then', () => {
    cy.get('.price')
      .invoke('text')
      .then((text) => {
        const price = parseFloat(text.replace('$', ''))
        
        // Wrap to continue Cypress chain
        cy.wrap(price).should('be.greaterThan', 0)
        
        if (price > 100) {
          cy.get('.expensive-badge').should('be.visible')
        }
      })
  })
})
```

---

## 7. .then() and Closures

### Understanding .then()

```typescript
// .then() gives you access to the yielded subject
cy.get('.button').then(($button) => {
  // $button is the jQuery element
  const text = $button.text()
  const isVisible = $button.is(':visible')
  
  console.log(text, isVisible)
})

// Similar to Playwright's evaluate:
// await page.locator('.button').evaluate(button => {
//   console.log(button.textContent)
// })
```

### .then() vs .should()

```typescript
// .should() - for assertions (auto-retries)
cy.get('.button').should('be.visible')
cy.get('.button').should('have.text', 'Click me')

// .then() - for accessing values (no auto-retry)
cy.get('.button').then(($btn) => {
  const text = $btn.text()
  console.log(text)  // Just access, no assertion
})

// KEY DIFFERENCE:
// .should() retries if assertion fails
// .then() runs once with current value
```

### Closures for Storing Values

```typescript
// Use closures to store values across commands
describe('Closures Example', () => {
  it('stores value with closure', () => {
    let userId: string
    
    // Store value in outer scope
    cy.request('POST', '/api/users', { name: 'John' })
      .then((response) => {
        userId = response.body.id
      })
    
    // Use stored value later
    cy.request('GET', `/api/users/${userId}`)  // ❌ Incorrect - runs before assignment!
  })
  
  it('correctly uses closure', () => {
    let userId: string
    
    cy.request('POST', '/api/users', { name: 'John' })
      .then((response) => {
        userId = response.body.id
      })
      .then(() => {
        // ✅ Correct - use in another .then()
        cy.request('GET', `/api/users/${userId}`)
      })
  })
})
```

### Nesting .then()

```typescript
// You can nest .then() for complex logic
cy.get('.count')
  .invoke('text')
  .then((text) => {
    const count = parseInt(text)
    
    cy.get('.increment').click()
    
    cy.get('.count')
      .invoke('text')
      .then((newText) => {
        const newCount = parseInt(newText)
        expect(newCount).to.equal(count + 1)
      })
  })
```

### Common Patterns

```typescript
// Pattern 1: Store and compare
let originalValue: number

cy.get('.counter')
  .invoke('text')
  .then(parseInt)
  .then((value) => {
    originalValue = value
  })

cy.get('.increment').click()

cy.get('.counter').should(($el) => {
  const newValue = parseInt($el.text())
  expect(newValue).to.equal(originalValue + 1)
})

// Pattern 2: Conditional logic
cy.get('.status').then(($status) => {
  const status = $status.text()
  
  if (status === 'Active') {
    cy.get('.deactivate-button').click()
  } else {
    cy.get('.activate-button').click()
  }
})

// Pattern 3: Complex calculations
cy.get('.items .item').then(($items) => {
  const prices = $items.map((i, el) => {
    return parseFloat(Cypress.$(el).find('.price').text().replace('$', ''))
  }).get()
  
  const total = prices.reduce((sum, price) => sum + price, 0)
  
  cy.wrap(total).should('be.greaterThan', 0)
})
```

### TypeScript with .then()

```typescript
interface User {
  id: number
  name: string
}

cy.request<User>('GET', '/api/users/1')
  .then((response) => {
    // response.body is typed as User
    expect(response.body.id).to.be.a('number')
    expect(response.body.name).to.be.a('string')
  })

cy.get<HTMLInputElement>('.email')
  .then(($input) => {
    // $input is typed as JQuery<HTMLInputElement>
    const value = $input.val()
    expect(value).to.include('@')
  })
```

---

## 8. Subject Yielding

### What is Subject Yielding?

Each Cypress command yields a subject that becomes the input for the next command in the chain.

### How Subjects Flow

```typescript
cy.get('.button')        // Yields: jQuery element (.button)
  .click()              // Yields: same jQuery element
  .should('be.visible') // Yields: same jQuery element
  .parent()             // Yields: parent jQuery element
  .find('.icon')        // Yields: jQuery element (.icon)
```

### Commands That Change Subject

```typescript
// Commands that yield DIFFERENT subjects:

cy.get('.button')       // Yields: .button element
  .click()             // Yields: .button element (same)
  .parent()            // Yields: parent element (DIFFERENT)

cy.get('.container')    // Yields: .container element
  .find('.button')     // Yields: .button element (DIFFERENT)

cy.get('.text')         // Yields: .text element
  .invoke('text')      // Yields: string value (DIFFERENT TYPE)
```

### Subject Types

```typescript
// Different subject types:

// jQuery element
cy.get('.button')  // Subject: JQuery<HTMLElement>

// String
cy.get('.text').invoke('text')  // Subject: string

// Number
cy.get('.count').invoke('text').then(parseInt)  // Subject: number

// Object
cy.request('/api/user')  // Subject: Response object

// Array
cy.get('.items').find('.item')  // Subject: JQuery<HTMLElement> (multiple)

// Null/undefined
cy.visit('/')  // Subject: undefined
cy.clearCookies()  // Subject: null
```

### Understanding yield with Examples

```typescript
describe('Subject Yielding', () => {
  it('demonstrates yield flow', () => {
    cy.get('.container')           // Yields: .container element
      .should('be.visible')        // Yields: same .container element
      .find('.button')             // Yields: .button element (NEW)
      .should('have.class', 'btn') // Yields: same .button element
      .click()                     // Yields: same .button element
      .invoke('text')              // Yields: string (NEW TYPE)
      .should('include', 'Submit') // Yields: same string
  })
  
  it('shows subject changes', () => {
    cy.get('.form')                // Subject: .form
      .within(() => {
        cy.get('input')            // Subject: input (within .form)
          .type('test')            // Subject: same input
      })
    // After within, subject is still .form
  })
})
```

### Debugging Subjects

```typescript
// Use .then() to see what subject is yielded
cy.get('.button')
  .then((subject) => {
    console.log('Subject:', subject)  // See what's yielded
    debugger  // Pause to inspect
  })

// Use cy.log() to log subject
cy.get('.count')
  .invoke('text')
  .then((text) => {
    cy.log('Count value:', text)
  })
```

### Comparison with Other Tools

```typescript
// SELENIUM - Each call returns specific type
WebElement element = driver.findElement(By.cssSelector(".button"));
element.click();  // Returns void
String text = element.getText();  // Returns String
WebElement parent = element.findElement(By.xpath(".."));  // Returns WebElement

// PLAYWRIGHT - Similar but with Locator
const button = page.locator('.button');
await button.click();  // Returns void
const text = await button.textContent();  // Returns string | null
const parent = button.locator('..');  // Returns Locator

// CYPRESS - Chained, each yields to next
cy.get('.button')   // Yields jQuery element
  .click()         // Yields same element
  .parent()        // Yields parent element
  .invoke('text')  // Yields string
```

---

## 9. Asynchronous Nature of Cypress

### Cypress Commands are Promises

```typescript
// ❌ WRONG - Cypress commands don't return values immediately
const button = cy.get('.button')  // Returns Chainable, not element!
button.click()  // ERROR!

const text = cy.get('.text').text()  // Returns Chainable, not string!
console.log(text)  // Won't work!

// ✅ CORRECT - Use .then() to access values
cy.get('.button').then(($button) => {
  $button.click()  // Use jQuery click
})

cy.get('.text').then(($el) => {
  const text = $el.text()
  console.log(text)  // Now it works
})
```

### Command Queue

```typescript
// Cypress builds a command queue, then executes
console.log('1')       // Executes immediately

cy.get('.button')     // Queued
  .click()           // Queued

console.log('2')       // Executes immediately

cy.get('.result')     // Queued
  .should('exist')   // Queued

console.log('3')       // Executes immediately

// Output order: 1, 2, 3, then Cypress commands execute
```

### Using .then() for Synchronous Code

```typescript
// Mix synchronous and Cypress code correctly
cy.get('.count').then(($el) => {
  const count = parseInt($el.text())  // Synchronous
  console.log('Count:', count)        // Synchronous
  
  // Back to Cypress commands
  cy.get('.increment').click()
  
  cy.get('.count').should(($newEl) => {
    const newCount = parseInt($newEl.text())
    expect(newCount).to.equal(count + 1)
  })
})
```

### Comparison: Cypress vs Playwright

```typescript
// PLAYWRIGHT - async/await (looks synchronous)
async function test() {
  await page.goto('/')
  await page.locator('.button').click()
  const text = await page.locator('.result').textContent()
  console.log(text)  // Simple!
}

// CYPRESS - promise chain (different mental model)
function test() {
  cy.visit('/')
  cy.get('.button').click()
  cy.get('.result').then(($el) => {
    const text = $el.text()
    console.log(text)
  })
}
```

### Why Cypress Works This Way

```typescript
// Cypress retries commands automatically
cy.get('.button')        // Retries until found or timeout
  .should('be.visible')  // Retries assertion until true

// This wouldn't work with async/await:
// await page.locator('.button')  // No retry
// expect(await page.locator('.button').isVisible()).toBe(true)  // No retry

// Cypress's approach enables built-in retry logic
```

---

## 10. Variable Patterns in Cypress

### let and const

```typescript
// ✅ CORRECT - Declare outside, assign in .then()
let userId: string
let userName: string

cy.request('POST', '/api/users', { name: 'John' })
  .then((response) => {
    userId = response.body.id
    userName = response.body.name
  })

// Use in later commands
cy.then(() => {
  cy.visit(`/users/${userId}`)
  cy.contains(userName).should('be.visible')
})
```

### this Context

```typescript
// Use this.* to share between hooks and tests
describe('Using this Context', () => {
  before(function() {
    // Store in this
    cy.request('GET', '/api/config').then((response) => {
      this.config = response.body
    })
  })
  
  it('uses stored config', function() {
    // Access via this
    expect(this.config).to.exist
    cy.log(this.config.apiUrl)
  })
})

// ⚠️ Important: Don't use arrow functions!
it('test', function() {  // ✅ Use function()
  this.value = 123
})

it('test', () => {  // ❌ Arrow function - this doesn't work!
  this.value = 123  // ERROR!
})
```

### Aliases as Variables

```typescript
// Aliases are like variables
cy.wrap('test value').as('myValue')
cy.get('@myValue').should('equal', 'test value')

// For elements
cy.get('.button').as('btn')
cy.get('@btn').click()

// For requests
cy.intercept('GET', '/api/users').as('getUsers')
cy.wait('@getUsers')
```

### When to Use Each Pattern

```typescript
// Pattern 1: let/const - Simple values
let count: number
cy.get('.count')
  .invoke('text')
  .then(parseInt)
  .then((value) => { count = value })

// Pattern 2: this - Share between hooks and tests
beforeEach(function() {
  this.user = { id: 1, name: 'John' }
})
it('test', function() {
  expect(this.user.name).to.equal('John')
})

// Pattern 3: Aliases - DOM elements and requests
cy.get('.button').as('submitButton')
cy.get('@submitButton').click()

// Pattern 4: Wrap - Convert to Cypress chain
const data = { id: 1 }
cy.wrap(data).should('have.property', 'id', 1)
```

### Type Safety with Variables

```typescript
interface User {
  id: number
  name: string
  email: string
}

describe('Type-Safe Variables', () => {
  let user: User
  
  before(() => {
    cy.fixture<User>('user.json').then((data) => {
      user = data
    })
  })
  
  it('uses typed variable', () => {
    cy.then(() => {
      expect(user.id).to.be.a('number')
      expect(user.name).to.be.a('string')
    })
  })
})
```

---

## 11. Common Migration Patterns

### Selenium → Cypress

```typescript
// SELENIUM
WebDriver driver = new ChromeDriver();
driver.get("https://example.com");
WebElement element = driver.findElement(By.id("button"));
element.click();
String text = element.getText();
Assert.assertEquals("Expected", text);

// CYPRESS
cy.visit('https://example.com')
cy.get('#button').click()
cy.get('#button').should('have.text', 'Expected')
```

### Playwright → Cypress

```typescript
// PLAYWRIGHT
const page = await browser.newPage();
await page.goto('https://example.com');
const element = page.locator('#button');
await element.click();
const text = await element.textContent();
expect(text).toBe('Expected');

// CYPRESS
cy.visit('https://example.com')
cy.get('#button').click()
cy.get('#button').should('have.text', 'Expected')
```

### Common Patterns Comparison

```typescript
// 1. WAITING FOR ELEMENT
// Selenium
WebDriverWait wait = new WebDriverWait(driver, 10);
wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("element")));

// Playwright
await page.locator('#element').waitFor({ state: 'visible' });

// Cypress (automatic!)
cy.get('#element')  // Automatically waits up to 4 seconds

// 2. CONDITIONAL LOGIC
// Selenium
if (driver.findElements(By.cssSelector(".modal")).size() > 0) {
    driver.findElement(By.cssSelector(".close")).click();
}

// Playwright
if (await page.locator('.modal').count() > 0) {
    await page.locator('.close').click();
}

// Cypress
cy.get('body').then($body => {
    if ($body.find('.modal').length > 0) {
        cy.get('.close').click()
    }
})

// 3. STORING VALUES
// Selenium
String value = driver.findElement(By.cssSelector(".text")).getText();
System.out.println(value);

// Playwright
const value = await page.locator('.text').textContent();
console.log(value);

// Cypress
cy.get('.text').then($el => {
    const value = $el.text()
    console.log(value)
})
```

### Key Differences Summary

| Concept | Selenium | Playwright | Cypress |
|---------|----------|------------|---------|
| **Execution** | Synchronous | Async/await | Promise chain |
| **Waiting** | Explicit waits | await | Automatic |
| **Element** | WebElement | Locator | jQuery |
| **Value Storage** | Direct assignment | await result | .then() callback |
| **Retry** | Manual | Manual | Automatic |
| **Scope** | Driver instance | Page instance | Global cy |

---

## Summary

**Key Concepts for Selenium/Playwright Users:**

1. **Global Objects**: `cy`, `Cypress`, `expect` available globally
2. **Chaining**: Commands chain naturally, each yields to next
3. **Queries**: `get` (document), `find` (parent), `within` (scope), `contains` (text)
4. **Storage**: Use `.then()`, aliases, or closures - not direct assignment
5. **Aliasing**: `.as()` and `@` for reusable references
6. **Wrapping**: `cy.wrap()` to use Cypress commands on non-Cypress values
7. **then()**: Access yielded values, mix with synchronous code
8. **Subjects**: Each command yields subject to next command
9. **Async**: Commands queue then execute, not immediate
10. **Variables**: Use `let` with `.then()`, `this` context, or aliases

**Mental Model Shift:**

- Selenium: Synchronous, explicit waits, direct assignment
- Playwright: Async/await, looks synchronous, await results
- **Cypress: Promise chain, automatic retry, access via .then()**

**Next Steps:**

Practice these concepts! The Cypress way feels different at first but becomes natural with use. The automatic retry and waiting make tests more reliable than traditional approaches.

---

## Quick Reference

```typescript
// Global objects
cy.get('.button')
Cypress.config('baseUrl')
expect(value).to.equal(123)

// Queries
cy.get('.button')              // Document
cy.get('.form').find('input')  // Parent
cy.get('.form').within(() => {})  // Scope
cy.contains('Submit')          // Text

// Storage
let value: string
cy.get('.text').then($el => { value = $el.text() })
cy.get('.button').as('btn')
cy.get('@btn').click()

// Wrapping
cy.wrap({ id: 1 }).should('have.property', 'id')

// then()
cy.get('.count').then($el => {
  const count = parseInt($el.text())
  console.log(count)
})

// Variables
let myVar: string
this.myVar = 'value'
cy.wrap('value').as('myAlias')
```
