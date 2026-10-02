# 12 - Waits and Timeouts

## Introduction to Cypress Waiting

One of Cypress's most powerful features is its automatic waiting mechanism. Unlike other testing frameworks, Cypress automatically waits for elements and assertions to pass before moving forward. This module covers automatic waiting, explicit waits, timeout configuration, and retry logic with TypeScript.

## Automatic Waiting

### Built-in Auto-Waiting

Cypress automatically waits for:
- Elements to exist in the DOM
- Elements to be visible
- Elements to not be disabled
- Elements to not be covered
- Elements to not be animating

```typescript
describe('Automatic Waiting', () => {
  it('waits automatically for elements', () => {
    cy.visit('/dynamic-content')
    
    // Cypress waits up to 4 seconds (default) for button to exist
    cy.get('button').click()
    
    // Waits for element to be visible
    cy.get('.result').should('be.visible')
    
    // Waits for element to contain text
    cy.get('.message').should('contain', 'Success')
  })
  
  it('waits for actionability', () => {
    cy.visit('/animations')
    
    // Waits for element to stop animating
    cy.get('.animated-button').click()
    
    // Waits for element to not be disabled
    cy.get('input').type('text')
    
    // Waits for element to not be covered
    cy.get('.behind-overlay').click()
  })
})
```

### Commands That Auto-Wait

```typescript
describe('Commands with Auto-Waiting', () => {
  it('demonstrates auto-waiting commands', () => {
    cy.visit('/page')
    
    // These all auto-wait:
    cy.get('.element')        // Waits to exist
    cy.contains('text')       // Waits to exist
    cy.click()               // Waits for actionability
    cy.type('text')          // Waits for actionability
    cy.select('value')       // Waits for actionability
    cy.check()               // Waits for actionability
    cy.should('be.visible')  // Retries assertion
  })
})
```

## Default Timeouts

### Timeout Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Global defaults
    defaultCommandTimeout: 4000,      // Most commands
    pageLoadTimeout: 60000,           // cy.visit(), cy.go()
    requestTimeout: 5000,             // cy.request(), cy.wait(@alias)
    responseTimeout: 30000,           // cy.request()
    execTimeout: 60000,               // cy.exec()
    taskTimeout: 60000,               // cy.task()
  }
})
```

### Timeout Hierarchy

```typescript
describe('Timeout Hierarchy', () => {
  it('uses global timeout (4000ms)', () => {
    cy.get('.element')  // Uses defaultCommandTimeout: 4000
  })
  
  it('overrides with command timeout', () => {
    // Override for single command
    cy.get('.slow-element', { timeout: 10000 })
  })
  
  it('overrides with assertion timeout', () => {
    cy.get('.element', { timeout: 5000 })
      .should('be.visible')  // Inherits 5000ms
      .and('contain', 'text', { timeout: 8000 })  // Override to 8000ms
  })
})
```

## Explicit Waits

### cy.wait() with Time

```typescript
describe('Explicit Time Waits', () => {
  it('waits for specific milliseconds', () => {
    cy.visit('/page')
    
    // Wait 1 second
    cy.wait(1000)
    
    cy.get('.element').click()
  })
  
  it('waits between actions', () => {
    cy.get('#field1').type('value1')
    cy.wait(500)  // Wait for debounce
    cy.get('#field2').type('value2')
  })
})
```

**⚠️ Warning**: Avoid using `cy.wait(ms)` unless absolutely necessary. It makes tests slower and more brittle.

### cy.wait() with Aliases (Network)

```typescript
describe('Wait for Network Requests', () => {
  it('waits for API response', () => {
    // Setup intercept
    cy.intercept('GET', '/api/users').as('getUsers')
    
    cy.visit('/users')
    
    // Wait for the intercepted request
    cy.wait('@getUsers')
      .its('response.statusCode')
      .should('eq', 200)
  })
  
  it('waits for multiple requests', () => {
    cy.intercept('GET', '/api/users').as('users')
    cy.intercept('GET', '/api/posts').as('posts')
    
    cy.visit('/dashboard')
    
    // Wait for both
    cy.wait(['@users', '@posts'])
  })
  
  it('waits with timeout', () => {
    cy.intercept('GET', '/api/slow').as('slow')
    cy.visit('/page')
    
    // Wait up to 10 seconds
    cy.wait('@slow', { timeout: 10000 })
  })
})
```

### Type-Safe Network Waits

```typescript
interface ApiResponse<T> {
  statusCode: number
  body: T
}

interface User {
  id: string
  name: string
  email: string
}

describe('Type-Safe Network Waits', () => {
  it('waits with typed responses', () => {
    cy.intercept('GET', '/api/users').as('getUsers')
    cy.visit('/users')
    
    cy.wait<User[]>('@getUsers')
      .then((interception) => {
        expect(interception.response?.statusCode).to.eq(200)
        const users = interception.response?.body
        expect(users).to.be.an('array')
        expect(users?.[0]).to.have.property('id')
      })
  })
})
```

## Custom Waiting Strategies

### Wait for Element State

```typescript
describe('Wait for Element State', () => {
  it('waits for element to have class', () => {
    cy.get('.button').click()
    
    cy.get('.button')
      .should('have.class', 'active')
  })
  
  it('waits for element attribute', () => {
    cy.get('input')
      .should('have.attr', 'disabled')
      .and('have.value', '')
  })
  
  it('waits for element to be removed', () => {
    cy.get('.loading').should('exist')
    cy.get('.loading').should('not.exist')
  })
})
```

### Wait for Text Content

```typescript
describe('Wait for Text', () => {
  it('waits for specific text', () => {
    cy.get('.status')
      .should('contain', 'Complete')
  })
  
  it('waits for text to change', () => {
    cy.get('.counter').should('contain', '0')
    cy.get('.increment').click()
    cy.get('.counter').should('contain', '1')
  })
  
  it('waits for text with regex', () => {
    cy.get('.message')
      .should('match', /success|complete/i)
  })
})
```

### Wait for Visibility

```typescript
describe('Wait for Visibility', () => {
  it('waits for element to be visible', () => {
    cy.get('.modal')
      .should('be.visible')
      .and('not.be.hidden')
  })
  
  it('waits for element to be hidden', () => {
    cy.get('.close-modal').click()
    cy.get('.modal')
      .should('not.be.visible')
  })
  
  it('waits for element to exist but be hidden', () => {
    cy.get('.hidden-field')
      .should('exist')
      .and('not.be.visible')
  })
})
```

## Custom Wait Helpers

### Type-Safe Wait Helpers

```typescript
interface WaitOptions {
  timeout?: number
  interval?: number
  errorMessage?: string
}

class WaitHelper {
  static waitForCondition(
    condition: () => boolean | Cypress.Chainable<boolean>,
    options: WaitOptions = {}
  ): void {
    const timeout = options.timeout || 5000
    const startTime = Date.now()
    
    const checkCondition = () => {
      const result = condition()
      
      if (result === true || (result as any).then) {
        return
      }
      
      if (Date.now() - startTime > timeout) {
        throw new Error(options.errorMessage || 'Timeout waiting for condition')
      }
      
      cy.wait(100).then(checkCondition)
    }
    
    checkCondition()
  }
  
  static waitForElementCount(
    selector: string,
    count: number,
    timeout: number = 5000
  ): void {
    cy.get(selector, { timeout })
      .should('have.length', count)
  }
  
  static waitForElementText(
    selector: string,
    text: string,
    timeout: number = 5000
  ): void {
    cy.get(selector, { timeout })
      .should('contain', text)
  }
  
  static waitForUrl(
    url: string | RegExp,
    timeout: number = 5000
  ): void {
    cy.url({ timeout }).should('match', 
      typeof url === 'string' ? new RegExp(url) : url
    )
  }
  
  static waitForNetworkIdle(timeout: number = 5000): void {
    let requestCount = 0
    
    cy.intercept('**', () => {
      requestCount++
    }).as('anyRequest')
    
    cy.window({ timeout }).then(() => {
      return new Cypress.Promise((resolve) => {
        const checkIdle = () => {
          if (requestCount === 0) {
            resolve()
          } else {
            requestCount = 0
            setTimeout(checkIdle, 500)
          }
        }
        setTimeout(checkIdle, 500)
      })
    })
  }
}

describe('Custom Wait Helpers', () => {
  it('waits for element count', () => {
    cy.visit('/list')
    WaitHelper.waitForElementCount('.item', 10)
  })
  
  it('waits for text', () => {
    WaitHelper.waitForElementText('.status', 'Complete', 10000)
  })
  
  it('waits for URL', () => {
    cy.visit('/page1')
    cy.get('.next').click()
    WaitHelper.waitForUrl('/page2')
  })
  
  it('waits for network idle', () => {
    cy.visit('/dashboard')
    WaitHelper.waitForNetworkIdle(10000)
    cy.get('.data-loaded').should('be.visible')
  })
})
```

## Retry Logic

### Understanding Retry

```typescript
describe('Retry Behavior', () => {
  it('retries assertions until timeout', () => {
    cy.visit('/counter')
    cy.get('.increment').click()
    
    // Retries every 50ms until timeout or passes
    cy.get('.count')
      .should('have.text', '1')  // Retries automatically
  })
  
  it('does not retry between commands', () => {
    cy.visit('/page')
    
    // This gets element once, no retry
    cy.get('.element').then(($el) => {
      expect($el).to.have.class('active')  // No retry!
    })
    
    // This retries
    cy.get('.element')
      .should('have.class', 'active')  // Retries!
  })
})
```

### Retriable vs Non-Retriable

```typescript
describe('Retriable Commands', () => {
  it('understands retriable commands', () => {
    // ✅ Retriable - queries DOM each retry
    cy.get('.element')
    cy.find('.child')
    cy.contains('text')
    
    // ✅ Retriable assertions
    cy.should('be.visible')
    cy.and('have.text', 'value')
    
    // ❌ Not retriable - action commands
    cy.click()
    cy.type('text')
    cy.select('value')
  })
})
```

## Handling Animations

### Wait for Animations to Complete

```typescript
describe('Animation Handling', () => {
  it('waits for CSS animations', () => {
    cy.get('.animate-in')
      .should('be.visible')
      .and('have.css', 'opacity', '1')
  })
  
  it('waits for transitions', () => {
    cy.get('.element')
      .should('have.css', 'transition-duration')
      .then((duration) => {
        const ms = parseFloat(duration as string) * 1000
        cy.wait(ms)
      })
  })
  
  it('uses waitForAnimations option', () => {
    cy.get('.animated-button')
      .click({ waitForAnimations: true })
  })
  
  it('disables animation wait', () => {
    cy.get('.button')
      .click({ waitForAnimations: false })
  })
})
```

## Timeout Strategies

### Progressive Timeouts

```typescript
describe('Progressive Timeouts', () => {
  it('uses increasing timeouts', () => {
    // Quick elements
    cy.get('.fast', { timeout: 1000 })
    
    // Normal elements
    cy.get('.normal', { timeout: 4000 })
    
    // Slow elements
    cy.get('.slow', { timeout: 10000 })
    
    // Very slow (page load, etc)
    cy.get('.very-slow', { timeout: 30000 })
  })
})
```

### Environment-Based Timeouts

```typescript
// cypress.config.ts
const getTimeout = (env: string) => {
  const timeouts = {
    local: 4000,
    ci: 10000,
    slow: 15000
  }
  return timeouts[env as keyof typeof timeouts] || 4000
}

export default defineConfig({
  e2e: {
    defaultCommandTimeout: getTimeout(process.env.ENV || 'local')
  }
})
```

## Best Practices

### 1. Avoid Fixed Time Waits

```typescript
// ❌ Bad - arbitrary wait
cy.wait(3000)
cy.get('.element').click()

// ✅ Good - wait for specific condition
cy.get('.element').should('be.visible').click()
```

### 2. Use Appropriate Timeouts

```typescript
// ✅ Good - specific timeout for slow operations
cy.get('.slow-loader', { timeout: 10000 })
  .should('not.exist')

// ✅ Good - reasonable default
cy.get('.normal-element')  // Uses default 4000ms
```

### 3. Wait for Network Instead of Time

```typescript
// ❌ Bad
cy.get('.submit').click()
cy.wait(2000)  // Hope API responds in 2 seconds

// ✅ Good
cy.intercept('POST', '/api/submit').as('submit')
cy.get('.submit').click()
cy.wait('@submit')
```

### 4. Chain Assertions for Auto-Retry

```typescript
// ✅ Good - assertions chain and retry together
cy.get('.status')
  .should('be.visible')
  .and('contain', 'Success')
  .and('have.class', 'complete')

// ❌ Avoid - breaks retry chain
cy.get('.status').should('be.visible')
cy.get('.status').should('contain', 'Success')
```

## Custom Commands for Waiting

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      waitForLoad(timeout?: number): Chainable<void>
      waitUntilVisible(selector: string, timeout?: number): Chainable<JQuery>
      waitForApiResponse(alias: string, timeout?: number): Chainable<any>
    }
  }
}

Cypress.Commands.add('waitForLoad', (timeout = 10000) => {
  cy.document({ timeout }).its('readyState').should('eq', 'complete')
})

Cypress.Commands.add('waitUntilVisible', 
  (selector: string, timeout = 5000) => {
    return cy.get(selector, { timeout }).should('be.visible')
  }
)

Cypress.Commands.add('waitForApiResponse',
  (alias: string, timeout = 10000) => {
    return cy.wait(`@${alias}`, { timeout })
      .its('response.statusCode')
      .should('be.oneOf', [200, 201, 204])
  }
)

describe('Custom Wait Commands', () => {
  it('uses custom wait commands', () => {
    cy.visit('/page')
    cy.waitForLoad()
    
    cy.waitUntilVisible('.content')
    
    cy.intercept('GET', '/api/data').as('getData')
    cy.get('.load-data').click()
    cy.waitForApiResponse('getData')
  })
})
```

## Summary

- Cypress automatically waits for elements and assertions
- Default timeouts: 4000ms for commands, 60000ms for page loads
- `cy.wait(ms)` for explicit time waits (use sparingly)
- `cy.wait(@alias)` for network request waits
- Assertions automatically retry until timeout
- Commands can override timeout: `{ timeout: ms }`
- Custom wait helpers encapsulate complex wait logic
- Always prefer conditional waits over fixed time waits
- Chain assertions for better retry behavior
- TypeScript ensures type-safe wait configurations

## Next Steps

- **10 - Test Runner Intro**: Using Test Runner to debug waits
- **11 - Assertions**: Assertions that trigger retries
- **20 - Network Mocking**: Wait for intercepted requests

## Quick Reference

```typescript
// Auto-wait (preferred)
cy.get('.element').should('be.visible')

// Time wait (avoid)
cy.wait(1000)

// Network wait (good)
cy.intercept('GET', '/api').as('api')
cy.wait('@api')

// Custom timeout
cy.get('.slow', { timeout: 10000 })

// Multiple waits
cy.wait(['@api1', '@api2', '@api3'])

// Chained assertions (retries together)
cy.get('.el')
  .should('be.visible')
  .and('contain', 'text')
```
