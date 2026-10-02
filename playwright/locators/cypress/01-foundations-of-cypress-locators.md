## Chapter 1: Foundations of Cypress Locators

### 1.1 Understanding Cypress Commands

Cypress uses a unique command chaining API that looks synchronous but is actually asynchronous. Each command yields a subject that can be chained with other commands.

**Command Structure:**
```javascript
cy.get('selector')      // Query command - yields element(s)
  .click()              // Action command - yields same element
  .should('be.visible') // Assertion - yields same element
```

**Key Concepts:**
- **Commands are not Promises**: Don't use `await` or `.then()` for control flow
- **Automatic Retry**: Cypress automatically retries queries until timeout
- **Command Queue**: Commands are enqueued and executed sequentially
- **Yielding**: Each command yields a subject for the next command

```javascript
// ❌ Wrong - Cypress commands are not Promises
const element = cy.get('button')
element.click() // This won't work

// ✅ Correct - Chain commands
cy.get('button').click()

// ✅ Correct - Use .then() to work with yielded subject
cy.get('button').then($button => {
  // $button is a jQuery element
  expect($button.text()).to.include('Submit')
})
```

### 1.2 Cypress and jQuery

Cypress uses jQuery under the hood, which means you get access to all jQuery selectors and methods. When Cypress queries the DOM, it returns jQuery objects.

**jQuery Integration:**
```javascript
// Cypress returns jQuery objects
cy.get('button').then($button => {
  // $button is a jQuery object
  console.log($button.text())
  console.log($button.attr('class'))
  console.log($button.is(':visible'))
})

// jQuery methods work directly
cy.get('input').eq(0)     // jQuery's .eq()
cy.get('div').first()     // jQuery's .first()
cy.get('div').last()      // jQuery's .last()
cy.get('li').filter('.active')  // jQuery's .filter()
```

**Advantages:**
- Familiar syntax for web developers
- Powerful selector engine
- Rich set of DOM manipulation methods
- Extensive pseudo-class support

### 1.3 Automatic Waiting and Retry

Cypress automatically waits for elements to exist, be visible, and be actionable. This is one of its most powerful features.

**What Cypress Waits For:**
- Element to exist in DOM
- Element to be visible
- Element not to be disabled
- Element not to be covered
- Element not to be animating
- Element to receive events

```javascript
// No explicit wait needed - Cypress handles it
cy.get('button').click()

// Cypress will retry this query until element appears or timeout
cy.get('.dynamic-content', { timeout: 10000 })
  .should('be.visible')

// Custom timeout for specific command
cy.get('.slow-element', { timeout: 15000 })
  .click()
```

**Default Timeouts:**
- Command timeout: 4 seconds
- Page load timeout: 60 seconds
- Network request timeout: 5 seconds

**Configure Timeouts:**
```javascript
// cypress.config.js
export default {
  defaultCommandTimeout: 8000,
  pageLoadTimeout: 90000,
  requestTimeout: 10000
}

// Per test file
Cypress.config('defaultCommandTimeout', 10000)

// Per command
cy.get('.element', { timeout: 15000 })
```

---
