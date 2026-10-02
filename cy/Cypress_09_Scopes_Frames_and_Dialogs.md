# 09 - Scopes, Frames, and Dialogs

## Introduction

This module covers working with scoped contexts using `cy.within()`, handling iframes, managing browser dialogs (alerts, confirms, prompts), and dealing with modals in Cypress with TypeScript.

## Scoped Commands with cy.within()

### Basic Scoping

```typescript
describe('cy.within() Scoping', () => {
  it('scopes commands to specific element', () => {
    cy.visit('/users')
    
    // Scope all commands to first user card
    cy.get('[data-cy="user-card"]').first().within(() => {
      cy.get('[data-cy="username"]').should('contain', 'John')
      cy.get('[data-cy="email"]').should('contain', 'john@example.com')
      cy.get('[data-cy="edit-btn"]').click()
    })
    
    // Back to global scope
    cy.get('.modal').should('be.visible')
  })
  
  it('works with multiple scopes', () => {
    cy.visit('/dashboard')
    
    // First scope
    cy.get('.sidebar').within(() => {
      cy.contains('Users').click()
    })
    
    // Second scope
    cy.get('.content').within(() => {
      cy.get('h1').should('contain', 'Users')
    })
  })
})
```

### Nested Scopes

```typescript
describe('Nested Scoping', () => {
  it('nests within contexts', () => {
    cy.visit('/products')
    
    cy.get('.product-list').within(() => {
      cy.get('.product-card').first().within(() => {
        cy.get('.product-name').should('be.visible')
        cy.get('.add-to-cart').click()
      })
    })
  })
  
  it('breaks out of scope when needed', () => {
    cy.get('.container').within(() => {
      cy.get('.item').should('exist')
      
      // This still works - references global scope
      cy.root().find('.header').should('be.visible')
    })
  })
})
```

### Type-Safe Scoping

```typescript
interface UserCard {
  username: string
  email: string
  role: 'admin' | 'user'
}

class ScopeHelper {
  static withinCard<T = void>(
    cardSelector: string,
    callback: () => T
  ): Cypress.Chainable<T> {
    return cy.get(cardSelector).within(callback)
  }
  
  static withinFirst<T = void>(
    selector: string,
    callback: () => T
  ): Cypress.Chainable<T> {
    return cy.get(selector).first().within(callback)
  }
  
  static withinEach(
    selector: string,
    callback: (index: number, element: JQuery<HTMLElement>) => void
  ): void {
    cy.get(selector).each((el, index) => {
      cy.wrap(el).within(() => callback(index, cy.$$(el)))
    })
  }
}

describe('Type-Safe Scoping', () => {
  it('uses scope helper', () => {
    cy.visit('/users')
    
    ScopeHelper.withinFirst('[data-cy="user-card"]', () => {
      cy.get('[data-cy="username"]').should('be.visible')
      cy.get('[data-cy="edit"]').click()
    })
  })
  
  it('iterates with scoped context', () => {
    ScopeHelper.withinEach('[data-cy="product"]', (index) => {
      cy.get('.product-name').should('be.visible')
      cy.log(`Verified product ${index}`)
    })
  })
})
```

## Working with iframes

### Basic iframe Access

```typescript
describe('iframe Handling', () => {
  it('accesses iframe content', () => {
    cy.visit('/page-with-iframe')
    
    // Get iframe's document
    cy.get('iframe#myframe')
      .its('0.contentDocument')
      .should('exist')
      .its('body')
      .should('not.be.undefined')
      .then(cy.wrap)
      .find('#button-in-iframe')
      .click()
  })
  
  it('waits for iframe to load', () => {
    cy.get('iframe')
      .its('0.contentDocument.readyState')
      .should('eq', 'complete')
    
    cy.get('iframe')
      .its('0.contentDocument.body')
      .should('not.be.empty')
  })
})
```

### Custom iframe Command

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      iframe(selector: string): Chainable<JQuery<HTMLElement>>
      getInIframe(iframeSelector: string, elementSelector: string): Chainable<JQuery<HTMLElement>>
    }
  }
}

Cypress.Commands.add('iframe', (selector: string) => {
  return cy.get(selector)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
})

Cypress.Commands.add('getInIframe', 
  (iframeSelector: string, elementSelector: string) => {
    return cy.iframe(iframeSelector).find(elementSelector)
  }
)

describe('iframe with Custom Commands', () => {
  it('uses iframe command', () => {
    cy.visit('/iframe-page')
    
    cy.iframe('#myframe')
      .find('#username')
      .type('testuser')
    
    cy.iframe('#myframe')
      .find('#submit')
      .click()
  })
  
  it('uses getInIframe command', () => {
    cy.getInIframe('#myframe', '#button').click()
    cy.getInIframe('#myframe', '.result').should('contain', 'Success')
  })
})
```

### iframe with cy.origin()

```typescript
describe('Cross-Origin iframes', () => {
  it('handles cross-origin iframe', () => {
    cy.visit('/page-with-iframe')
    
    // For same-origin iframes
    cy.get('iframe[src*="same-domain.com"]')
      .its('0.contentDocument.body')
      .then(cy.wrap)
      .find('button')
      .click()
    
    // For cross-origin iframes (Cypress 12+)
    cy.origin('https://other-domain.com', () => {
      cy.get('button').click()
    })
  })
})
```

### Type-Safe iframe Helper

```typescript
interface IframeOptions {
  timeout?: number
  waitForLoad?: boolean
}

class IframeHelper {
  static getIframeBody(
    selector: string,
    options: IframeOptions = {}
  ): Cypress.Chainable<JQuery<HTMLElement>> {
    const timeout = options.timeout || 10000
    
    return cy.get(selector, { timeout })
      .its('0.contentDocument.body')
      .should('not.be.empty')
      .then(cy.wrap)
  }
  
  static getInIframe<E extends HTMLElement = HTMLElement>(
    iframeSelector: string,
    elementSelector: string
  ): Cypress.Chainable<JQuery<E>> {
    return this.getIframeBody(iframeSelector)
      .find<E>(elementSelector)
  }
  
  static waitForIframeLoad(selector: string): void {
    cy.get(selector)
      .should('have.attr', 'src')
      .its('0.contentDocument.readyState')
      .should('eq', 'complete')
  }
  
  static withinIframe(
    selector: string,
    callback: () => void
  ): void {
    this.getIframeBody(selector).within(callback)
  }
}

describe('Type-Safe iframe Operations', () => {
  it('uses iframe helper', () => {
    cy.visit('/iframe-test')
    
    IframeHelper.waitForIframeLoad('#myframe')
    
    IframeHelper.getInIframe<HTMLInputElement>('#myframe', '#email')
      .type('test@example.com')
    
    IframeHelper.withinIframe('#myframe', () => {
      cy.get('#submit').click()
      cy.get('.success').should('be.visible')
    })
  })
})
```

## Browser Alerts

### Handling Alerts

```typescript
describe('Alert Dialogs', () => {
  it('accepts alert automatically', () => {
    cy.visit('/alerts')
    
    // Cypress automatically accepts alerts
    cy.get('#alert-button').click()
    
    // Alert is auto-accepted, continue testing
    cy.get('.result').should('contain', 'Alert was shown')
  })
  
  it('verifies alert text', () => {
    cy.visit('/alerts')
    
    // Create stub before alert
    cy.on('window:alert', cy.stub().as('alertStub'))
    
    cy.get('#alert-button').click()
    
    // Verify alert was called with correct text
    cy.get('@alertStub')
      .should('have.been.calledOnce')
      .and('have.been.calledWith', 'This is an alert!')
  })
  
  it('handles multiple alerts', () => {
    cy.on('window:alert', cy.stub().as('alert'))
    
    cy.get('#show-alerts').click()
    
    cy.get('@alert')
      .should('have.been.calledTwice')
  })
})
```

### Type-Safe Alert Handling

```typescript
type AlertMessage = string

class AlertHelper {
  static setupAlertSpy(): void {
    cy.on('window:alert', cy.stub().as('windowAlert'))
  }
  
  static verifyAlertCalled(expectedMessage?: string): void {
    if (expectedMessage) {
      cy.get('@windowAlert')
        .should('have.been.calledWith', expectedMessage)
    } else {
      cy.get('@windowAlert')
        .should('have.been.called')
    }
  }
  
  static verifyAlertCount(count: number): void {
    cy.get('@windowAlert')
      .should('have.callCount', count)
  }
}

describe('Type-Safe Alerts', () => {
  beforeEach(() => {
    AlertHelper.setupAlertSpy()
  })
  
  it('verifies alert message', () => {
    cy.visit('/alerts')
    cy.get('#show-alert').click()
    
    AlertHelper.verifyAlertCalled('Welcome!')
  })
})
```

## Confirm Dialogs

### Handling Confirms

```typescript
describe('Confirm Dialogs', () => {
  it('accepts confirm by default', () => {
    cy.visit('/confirms')
    
    // Cypress auto-accepts confirms
    cy.get('#confirm-button').click()
    cy.get('.result').should('contain', 'Confirmed!')
  })
  
  it('verifies confirm text', () => {
    cy.on('window:confirm', cy.stub().as('confirmStub'))
    
    cy.get('#confirm-button').click()
    
    cy.get('@confirmStub')
      .should('have.been.calledWith', 'Are you sure?')
  })
  
  it('cancels confirm dialog', () => {
    cy.on('window:confirm', () => false)
    
    cy.get('#confirm-button').click()
    cy.get('.result').should('contain', 'Cancelled')
  })
  
  it('conditionally accepts/rejects', () => {
    cy.on('window:confirm', (text) => {
      if (text === 'Delete item?') {
        return false  // Cancel
      }
      return true  // Accept
    })
    
    cy.get('#delete-button').click()
    cy.get('.item').should('exist')  // Not deleted
    
    cy.get('#save-button').click()
    cy.get('.success').should('be.visible')  // Saved
  })
})
```

### Type-Safe Confirm Handling

```typescript
interface ConfirmOptions {
  accept?: boolean
  expectedMessage?: string
}

class ConfirmHelper {
  static setupConfirm(options: ConfirmOptions = {}): void {
    const accept = options.accept !== false
    
    cy.on('window:confirm', (text: string) => {
      if (options.expectedMessage) {
        expect(text).to.equal(options.expectedMessage)
      }
      return accept
    })
  }
  
  static setupConditionalConfirm(
    condition: (message: string) => boolean
  ): void {
    cy.on('window:confirm', condition)
  }
  
  static verifyConfirmCalled(expectedMessage: string): void {
    cy.on('window:confirm', cy.stub().as('confirm'))
    cy.get('@confirm')
      .should('have.been.calledWith', expectedMessage)
  }
}

describe('Type-Safe Confirms', () => {
  it('accepts confirm', () => {
    ConfirmHelper.setupConfirm({
      accept: true,
      expectedMessage: 'Proceed with action?'
    })
    
    cy.get('#action-button').click()
  })
  
  it('rejects confirm', () => {
    ConfirmHelper.setupConfirm({ accept: false })
    cy.get('#delete-button').click()
    cy.get('.item').should('exist')
  })
  
  it('uses conditional confirm', () => {
    ConfirmHelper.setupConditionalConfirm((msg) => {
      return !msg.includes('delete')
    })
    
    cy.get('#save-button').click()  // Accepted
    cy.get('#delete-button').click()  // Rejected
  })
})
```

## Prompt Dialogs

### Handling Prompts

```typescript
describe('Prompt Dialogs', () => {
  it('handles prompt with input', () => {
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns('Test Input')
    })
    
    cy.get('#prompt-button').click()
    cy.get('.result').should('contain', 'Test Input')
  })
  
  it('cancels prompt', () => {
    cy.window().then((win) => {
      cy.stub(win, 'prompt').returns(null)
    })
    
    cy.get('#prompt-button').click()
    cy.get('.result').should('contain', 'Cancelled')
  })
  
  it('verifies prompt message', () => {
    cy.visit('/prompts')
    
    cy.window().then((win) => {
      cy.stub(win, 'prompt')
        .withArgs('Enter your name:')
        .returns('John Doe')
        .as('promptStub')
    })
    
    cy.get('#name-prompt').click()
    
    cy.get('@promptStub')
      .should('have.been.calledWith', 'Enter your name:')
  })
})
```

### Type-Safe Prompt Handling

```typescript
interface PromptOptions {
  returnValue: string | null
  expectedMessage?: string
}

class PromptHelper {
  static setupPrompt(options: PromptOptions): void {
    cy.window().then((win) => {
      const stub = cy.stub(win, 'prompt').as('promptStub')
      
      if (options.expectedMessage) {
        stub.withArgs(options.expectedMessage)
          .returns(options.returnValue)
      } else {
        stub.returns(options.returnValue)
      }
    })
  }
  
  static setupConditionalPrompt(
    handler: (message: string) => string | null
  ): void {
    cy.window().then((win) => {
      cy.stub(win, 'prompt').callsFake(handler)
    })
  }
  
  static verifyPromptCalled(expectedMessage?: string): void {
    if (expectedMessage) {
      cy.get('@promptStub')
        .should('have.been.calledWith', expectedMessage)
    } else {
      cy.get('@promptStub')
        .should('have.been.called')
    }
  }
}

describe('Type-Safe Prompts', () => {
  it('provides prompt input', () => {
    PromptHelper.setupPrompt({
      returnValue: 'John Doe',
      expectedMessage: 'Enter your name:'
    })
    
    cy.get('#prompt-button').click()
    cy.get('.name-display').should('contain', 'John Doe')
  })
  
  it('cancels prompt', () => {
    PromptHelper.setupPrompt({ returnValue: null })
    cy.get('#prompt-button').click()
    cy.get('.cancelled').should('be.visible')
  })
  
  it('conditionally handles prompts', () => {
    PromptHelper.setupConditionalPrompt((msg) => {
      if (msg.includes('email')) {
        return 'test@example.com'
      }
      if (msg.includes('phone')) {
        return '555-1234'
      }
      return null
    })
    
    cy.get('#email-prompt').click()
    cy.get('.email').should('contain', 'test@example.com')
  })
})
```

## Modal Dialogs

### Custom Modal Handling

```typescript
describe('Modal Dialogs', () => {
  it('opens and closes modal', () => {
    cy.visit('/modals')
    
    // Open modal
    cy.get('[data-cy="open-modal"]').click()
    cy.get('.modal').should('be.visible')
    
    // Close modal
    cy.get('.modal-close').click()
    cy.get('.modal').should('not.be.visible')
  })
  
  it('interacts within modal', () => {
    cy.get('[data-cy="open-modal"]').click()
    
    cy.get('.modal').within(() => {
      cy.get('input[name="username"]').type('testuser')
      cy.get('input[name="email"]').type('test@example.com')
      cy.get('button[type="submit"]').click()
    })
    
    cy.get('.modal').should('not.exist')
    cy.get('.success-message').should('be.visible')
  })
  
  it('closes modal with ESC key', () => {
    cy.get('[data-cy="open-modal"]').click()
    cy.get('.modal').should('be.visible')
    
    cy.get('body').type('{esc}')
    cy.get('.modal').should('not.be.visible')
  })
  
  it('closes modal by clicking backdrop', () => {
    cy.get('[data-cy="open-modal"]').click()
    cy.get('.modal').should('be.visible')
    
    cy.get('.modal-backdrop').click({ force: true })
    cy.get('.modal').should('not.be.visible')
  })
})
```

### Type-Safe Modal Helper

```typescript
interface ModalSelectors {
  modal: string
  openButton: string
  closeButton?: string
  backdrop?: string
}

class ModalHelper {
  private selectors: ModalSelectors
  
  constructor(selectors: ModalSelectors) {
    this.selectors = selectors
  }
  
  open(): void {
    cy.get(this.selectors.openButton).click()
    cy.get(this.selectors.modal).should('be.visible')
  }
  
  close(): void {
    if (this.selectors.closeButton) {
      cy.get(this.selectors.closeButton).click()
    } else {
      cy.get('body').type('{esc}')
    }
    cy.get(this.selectors.modal).should('not.be.visible')
  }
  
  closeViaBackdrop(): void {
    if (this.selectors.backdrop) {
      cy.get(this.selectors.backdrop).click({ force: true })
      cy.get(this.selectors.modal).should('not.be.visible')
    }
  }
  
  within(callback: () => void): void {
    cy.get(this.selectors.modal).within(callback)
  }
  
  shouldBeVisible(): void {
    cy.get(this.selectors.modal).should('be.visible')
  }
  
  shouldNotExist(): void {
    cy.get(this.selectors.modal).should('not.exist')
  }
}

describe('Type-Safe Modal Operations', () => {
  const loginModal = new ModalHelper({
    modal: '[data-cy="login-modal"]',
    openButton: '[data-cy="open-login"]',
    closeButton: '[data-cy="close-login"]',
    backdrop: '.modal-backdrop'
  })
  
  it('manages modal lifecycle', () => {
    loginModal.open()
    
    loginModal.within(() => {
      cy.get('#username').type('testuser')
      cy.get('#password').type('password')
      cy.get('button[type="submit"]').click()
    })
    
    loginModal.shouldNotExist()
  })
  
  it('closes modal multiple ways', () => {
    loginModal.open()
    loginModal.close()
    
    loginModal.open()
    loginModal.closeViaBackdrop()
  })
})
```

## Shadow DOM

### Accessing Shadow DOM

```typescript
describe('Shadow DOM', () => {
  it('accesses shadow root', () => {
    cy.visit('/shadow-dom')
    
    // Access shadow DOM
    cy.get('custom-element')
      .shadow()
      .find('button')
      .click()
  })
  
  it('works with nested shadow DOM', () => {
    cy.get('parent-component')
      .shadow()
      .find('child-component')
      .shadow()
      .find('input')
      .type('text')
  })
})
```

## Best Practices

### 1. Use cy.within() for Scoping

```typescript
// ✅ Good - Scoped to specific context
cy.get('.user-card').first().within(() => {
  cy.get('.name').should('contain', 'John')
  cy.get('.email').should('contain', 'john@example.com')
})

// ❌ Avoid - No scoping
cy.get('.user-card').first().find('.name').should('contain', 'John')
cy.get('.user-card').first().find('.email').should('contain', 'john@example.com')
```

### 2. Create Reusable iframe Commands

```typescript
// ✅ Good - Reusable command
Cypress.Commands.add('iframe', (selector) => {
  return cy.get(selector)
    .its('0.contentDocument.body')
    .should('not.be.empty')
    .then(cy.wrap)
})

// Usage
cy.iframe('#myframe').find('button').click()
```

### 3. Handle Dialogs Consistently

```typescript
// ✅ Good - Centralized dialog handling
class DialogHelper {
  static acceptAll(): void {
    cy.on('window:alert', () => true)
    cy.on('window:confirm', () => true)
  }
  
  static rejectAll(): void {
    cy.on('window:confirm', () => false)
  }
}

beforeEach(() => {
  DialogHelper.acceptAll()
})
```

### 4. Type-Safe Modal Patterns

```typescript
// ✅ Good - Type-safe modal class
class Modal<T extends string = string> {
  constructor(private selector: T) {}
  
  open(): this {
    cy.get(this.selector).should('be.visible')
    return this
  }
  
  close(): this {
    cy.get(this.selector).should('not.exist')
    return this
  }
}
```

## Summary

- `cy.within()` scopes commands to specific elements
- iframes require accessing contentDocument
- Browser dialogs (alert, confirm, prompt) are auto-handled by Cypress
- Stubs and event listeners verify and control dialog behavior
- Custom modals use standard Cypress commands
- Shadow DOM accessible via `.shadow()` method
- TypeScript ensures type-safe scoping and dialog handling
- Custom commands and helpers encapsulate common patterns

## Next Steps

- **09 - Waits and Timeouts**: Understanding timing in scoped contexts
- **11 - Assertions**: Assertions within scoped elements
- **20 - Network Mocking**: Mocking in iframes

## Quick Reference

```typescript
// Scoping
cy.get('.container').within(() => {
  cy.get('.item').click()
})

// iframe
cy.iframe('#myframe').find('button').click()

// Alerts
cy.on('window:alert', cy.stub().as('alert'))

// Confirms
cy.on('window:confirm', () => false)

// Prompts
cy.window().then(win => {
  cy.stub(win, 'prompt').returns('input')
})

// Modal
cy.get('.modal').should('be.visible')
cy.get('.modal').within(() => {
  cy.get('input').type('text')
})
```
