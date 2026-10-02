# 06 - Basic Interactions

## Introduction to Cypress Interactions

Cypress provides intuitive commands for interacting with web elements. All interactions in Cypress are automatically retried until they succeed or timeout, making tests more reliable.

## Click Actions

### Basic Click

```typescript
describe('Click Interactions', () => {
  it('performs basic clicks', () => {
    cy.visit('/buttons')
    
    // Simple click
    cy.get('[data-cy="submit-btn"]').click()
    
    // Click with options
    cy.get('button').click({ force: true })  // Click even if covered
    cy.get('button').click({ multiple: true }) // Click all matched elements
    
    // Click at specific position
    cy.get('.canvas').click(100, 200)  // x, y coordinates
    cy.get('button').click('topLeft')
    cy.get('button').click('center')
    cy.get('button').click('bottomRight')
  })
})
```

### Type-Safe Click Options

```typescript
interface ClickOptions {
  force?: boolean
  multiple?: boolean
  timeout?: number
}

describe('Type-Safe Clicks', () => {
  it('uses typed click options', () => {
    const options: Partial<Cypress.ClickOptions> = {
      force: true,
      timeout: 5000
    }
    
    cy.get<HTMLButtonElement>('button').click(options)
  })
})
```

### Double Click and Right Click

```typescript
describe('Advanced Clicks', () => {
  it('performs double and right clicks', () => {
    cy.visit('/interactions')
    
    // Double click
    cy.get('.editable').dblclick()
    cy.get('.item').dblclick({ force: true })
    
    // Right click (context menu)
    cy.get('.context-menu-trigger').rightclick()
    cy.get('.file').rightclick({ force: true })
  })
})
```

## Type and Input Actions

### Basic Typing

```typescript
describe('Typing Text', () => {
  it('types into input fields', () => {
    cy.visit('/form')
    
    // Type text
    cy.get('#username').type('testuser')
    
    // Type with delay
    cy.get('#search').type('query', { delay: 100 })
    
    // Clear and type
    cy.get('#email').clear().type('new@email.com')
    
    // Type special characters
    cy.get('#password').type('Pass{shift}word123!')
  })
})
```

### Special Key Combinations

```typescript
describe('Special Keys', () => {
  it('uses special key combinations', () => {
    cy.visit('/editor')
    
    // Single special keys
    cy.get('textarea').type('{enter}')
    cy.get('input').type('{esc}')
    cy.get('input').type('{backspace}')
    cy.get('input').type('{del}')
    cy.get('input').type('{selectall}')
    
    // Arrow keys
    cy.get('input').type('{uparrow}')
    cy.get('input').type('{downarrow}')
    cy.get('input').type('{leftarrow}')
    cy.get('input').type('{rightarrow}')
    
    // Modifiers
    cy.get('textarea').type('{ctrl}a')  // Select all
    cy.get('textarea').type('{cmd}c')   // Copy (Mac)
    cy.get('textarea').type('{shift}{enter}')  // Shift + Enter
    
    // Multiple keys
    cy.get('input').type('{ctrl}{shift}k')
  })
})
```

### Type Options

```typescript
describe('Type Options', () => {
  it('uses various type options', () => {
    cy.visit('/form')
    
    // Delay between keystrokes
    cy.get('input').type('slow typing', { delay: 100 })
    
    // Don't trigger blur
    cy.get('input').type('text', { force: true })
    
    // Parse special char sequences
    cy.get('input').type('literal{enter}', { parseSpecialCharSequences: false })
    
    // Type into hidden or covered elements
    cy.get('input.hidden').type('text', { force: true })
  })
})
```

### Type-Safe Typing

```typescript
interface FormData {
  username: string
  email: string
  password: string
}

describe('Type-Safe Form Input', () => {
  it('fills form with typed data', () => {
    const formData: FormData = {
      username: 'testuser',
      email: 'test@example.com',
      password: 'SecurePass123!'
    }
    
    cy.visit('/register')
    
    cy.get<HTMLInputElement>('[data-cy="username"]')
      .type(formData.username)
      .should('have.value', formData.username)
    
    cy.get<HTMLInputElement>('[data-cy="email"]')
      .type(formData.email)
      .should('have.value', formData.email)
    
    cy.get<HTMLInputElement>('[data-cy="password"]')
      .type(formData.password)
      .should('have.value', formData.password)
  })
})
```

## Clear Input

```typescript
describe('Clear Input', () => {
  it('clears input fields', () => {
    cy.visit('/form')
    
    // Clear single input
    cy.get('#search').type('old text')
    cy.get('#search').clear()
    cy.get('#search').should('have.value', '')
    
    // Clear and type new value
    cy.get('#username')
      .type('olduser')
      .clear()
      .type('newuser')
      .should('have.value', 'newuser')
  })
  
  it('clears with options', () => {
    cy.get('input').clear({ force: true })  // Clear even if not visible
  })
})
```

## Select Dropdowns

### Select by Value, Text, or Index

```typescript
describe('Select Dropdowns', () => {
  it('selects dropdown options', () => {
    cy.visit('/form')
    
    // Select by value attribute
    cy.get('select#country').select('usa')
    
    // Select by visible text
    cy.get('select#country').select('United States')
    
    // Select by index (0-based)
    cy.get('select#country').select(0)
    
    // Select multiple (for multi-select)
    cy.get('select#languages')
      .select(['english', 'spanish', 'french'])
  })
})
```

### Type-Safe Selects

```typescript
type Country = 'usa' | 'uk' | 'canada' | 'australia'

describe('Type-Safe Selects', () => {
  it('uses typed select values', () => {
    const country: Country = 'usa'
    
    cy.visit('/form')
    cy.get<HTMLSelectElement>('select#country')
      .select(country)
      .should('have.value', country)
  })
})
```

### Custom Dropdowns (Non-Native)

```typescript
describe('Custom Dropdowns', () => {
  it('interacts with custom dropdowns', () => {
    cy.visit('/custom-dropdowns')
    
    // Click to open dropdown
    cy.get('[data-cy="country-dropdown"]').click()
    
    // Wait for options to appear
    cy.get('[data-cy="dropdown-option"]').should('be.visible')
    
    // Click specific option
    cy.contains('[data-cy="dropdown-option"]', 'United States').click()
    
    // Verify selection
    cy.get('[data-cy="country-dropdown"]')
      .should('contain', 'United States')
  })
})
```

## Checkboxes and Radio Buttons

### Checkboxes

```typescript
describe('Checkboxes', () => {
  it('checks and unchecks checkboxes', () => {
    cy.visit('/form')
    
    // Check checkbox
    cy.get('[type="checkbox"]#terms').check()
    cy.get('#terms').should('be.checked')
    
    // Uncheck checkbox
    cy.get('#terms').uncheck()
    cy.get('#terms').should('not.be.checked')
    
    // Check specific value
    cy.get('[type="checkbox"][value="newsletter"]').check()
    
    // Check multiple
    cy.get('[type="checkbox"]').check(['option1', 'option2'])
    
    // Force check
    cy.get('#hidden-checkbox').check({ force: true })
  })
})
```

### Radio Buttons

```typescript
describe('Radio Buttons', () => {
  it('selects radio buttons', () => {
    cy.visit('/form')
    
    // Check radio by value
    cy.get('[type="radio"][value="male"]').check()
    cy.get('[value="male"]').should('be.checked')
    
    // Check radio and verify others unchecked
    cy.get('[type="radio"][value="female"]').check()
    cy.get('[value="female"]').should('be.checked')
    cy.get('[value="male"]').should('not.be.checked')
    
    // Force check
    cy.get('[type="radio"]').first().check({ force: true })
  })
})
```

### Type-Safe Checkbox/Radio

```typescript
type Gender = 'male' | 'female' | 'other'
type Interests = 'sports' | 'music' | 'reading' | 'travel'

describe('Type-Safe Checkboxes and Radios', () => {
  it('uses typed values', () => {
    const gender: Gender = 'female'
    const interests: Interests[] = ['music', 'travel']
    
    cy.visit('/profile')
    
    cy.get<HTMLInputElement>(`[type="radio"][value="${gender}"]`)
      .check()
      .should('be.checked')
    
    interests.forEach(interest => {
      cy.get<HTMLInputElement>(`[type="checkbox"][value="${interest}"]`)
        .check()
        .should('be.checked')
    })
  })
})
```

## Focus and Blur

```typescript
describe('Focus and Blur', () => {
  it('focuses and blurs elements', () => {
    cy.visit('/form')
    
    // Focus element
    cy.get('#email').focus()
    cy.get('#email').should('have.focus')
    
    // Blur element
    cy.get('#email').type('test@example.com')
    cy.get('#email').blur()
    cy.get('#email').should('not.have.focus')
    
    // Focus and type
    cy.get('#password').focus().type('password123')
  })
  
  it('triggers validation on blur', () => {
    cy.visit('/form')
    
    cy.get('#email').focus().blur()
    cy.get('.error-message').should('contain', 'Email is required')
  })
})
```

## Submit Forms

```typescript
describe('Form Submission', () => {
  it('submits forms', () => {
    cy.visit('/login')
    
    // Submit by clicking button
    cy.get('#username').type('user')
    cy.get('#password').type('pass')
    cy.get('[type="submit"]').click()
    
    // Submit form directly
    cy.get('form').submit()
  })
  
  it('handles form submission with validation', () => {
    cy.visit('/form')
    
    cy.get('form').submit()
    cy.get('.error').should('be.visible')
    
    cy.get('#required-field').type('value')
    cy.get('form').submit()
    cy.url().should('include', '/success')
  })
})
```

## Scrolling

```typescript
describe('Scrolling', () => {
  it('scrolls elements into view', () => {
    cy.visit('/long-page')
    
    // Scroll to element
    cy.get('#footer').scrollIntoView()
    cy.get('#footer').should('be.visible')
    
    // Scroll with options
    cy.get('.section').scrollIntoView({ duration: 1000 })
    cy.get('.section').scrollIntoView({ offset: { top: -100, left: 0 } })
  })
  
  it('scrolls window', () => {
    cy.visit('/page')
    
    // Scroll window to position
    cy.scrollTo(0, 500)
    cy.scrollTo('bottom')
    cy.scrollTo('top')
    cy.scrollTo('center')
    
    // Scroll with options
    cy.scrollTo('bottom', { duration: 2000 })
    cy.scrollTo('50%', '50%')
  })
  
  it('scrolls specific element', () => {
    cy.visit('/scrollable')
    
    cy.get('.scrollable-container').scrollTo('bottom')
    cy.get('.scrollable-container').scrollTo(0, 250)
  })
})
```

## Hover (Workarounds)

Cypress doesn't have a native hover command, but you can trigger hover effects:

```typescript
describe('Hover Effects', () => {
  it('triggers hover using events', () => {
    cy.visit('/hover-menu')
    
    // Method 1: Trigger mouseover
    cy.get('.menu-item').trigger('mouseover')
    cy.get('.submenu').should('be.visible')
    
    // Method 2: Force show
    cy.get('.tooltip-trigger').click({ force: true })
    
    // Method 3: Invoke show (if element has show method)
    cy.get('.dropdown').invoke('show')
  })
  
  it('simulates hover with multiple events', () => {
    cy.get('.hover-target')
      .trigger('mouseenter')
      .trigger('mouseover')
    
    cy.get('.hover-result').should('be.visible')
    
    cy.get('.hover-target')
      .trigger('mouseleave')
      .trigger('mouseout')
  })
})
```

## Trigger Events

```typescript
describe('Trigger Custom Events', () => {
  it('triggers various events', () => {
    cy.visit('/events')
    
    // Mouse events
    cy.get('.element').trigger('mousedown')
    cy.get('.element').trigger('mouseup')
    cy.get('.element').trigger('mouseover')
    cy.get('.element').trigger('mouseout')
    cy.get('.element').trigger('mouseenter')
    cy.get('.element').trigger('mouseleave')
    
    // Keyboard events
    cy.get('input').trigger('keydown', { keyCode: 13 })
    cy.get('input').trigger('keyup')
    cy.get('input').trigger('keypress')
    
    // Focus events
    cy.get('input').trigger('focus')
    cy.get('input').trigger('blur')
    
    // Form events
    cy.get('input').trigger('change')
    cy.get('form').trigger('submit')
    
    // Custom events
    cy.get('.element').trigger('custom-event')
  })
  
  it('triggers with options', () => {
    cy.get('.draggable').trigger('mousedown', {
      which: 1,
      pageX: 100,
      pageY: 200
    })
  })
})
```

## Invoke Methods

```typescript
describe('Invoke Element Methods', () => {
  it('invokes jQuery methods', () => {
    cy.visit('/page')
    
    // Show/hide
    cy.get('.element').invoke('show')
    cy.get('.element').invoke('hide')
    
    // Add/remove class
    cy.get('.element').invoke('addClass', 'active')
    cy.get('.element').invoke('removeClass', 'hidden')
    
    // Get/set attributes
    cy.get('input').invoke('val', 'new value')
    cy.get('img').invoke('attr', 'src').should('include', 'image.png')
    
    // Text operations
    cy.get('.element').invoke('text', 'New text')
    cy.get('.element').invoke('text').should('equal', 'New text')
  })
  
  it('invokes custom methods', () => {
    cy.visit('/page')
    
    cy.window().then((win) => {
      // Invoke method on window object
      cy.wrap(win).invoke('customMethod', 'arg1', 'arg2')
    })
  })
})
```

## Type-Safe Custom Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      fillLoginForm(username: string, password: string): Chainable<void>
      selectDropdownByText(selector: string, text: string): Chainable<void>
      typeWithDelay(text: string, delay?: number): Chainable<void>
    }
  }
}

Cypress.Commands.add('fillLoginForm', (username: string, password: string) => {
  cy.get('[data-cy="username"]').type(username)
  cy.get('[data-cy="password"]').type(password)
  cy.get('[data-cy="submit"]').click()
})

Cypress.Commands.add('selectDropdownByText', (selector: string, text: string) => {
  cy.get(selector).click()
  cy.contains('[data-cy="dropdown-option"]', text).click()
})

Cypress.Commands.add('typeWithDelay', { prevSubject: 'element' }, 
  (subject, text: string, delay: number = 50) => {
    cy.wrap(subject).type(text, { delay })
  }
)

// Usage
describe('Custom Commands', () => {
  it('uses custom interaction commands', () => {
    cy.visit('/login')
    cy.fillLoginForm('testuser', 'password123')
    
    cy.visit('/form')
    cy.selectDropdownByText('[data-cy="country"]', 'United States')
    
    cy.get('#search').typeWithDelay('slow search', 100)
  })
})
```

## Best Practices

### 1. Wait for Actionability

```typescript
// ✅ Cypress automatically waits
describe('Automatic Waiting', () => {
  it('waits for elements to be actionable', () => {
    cy.visit('/dynamic')
    
    // Cypress waits for button to be:
    // - visible, not hidden, not covered
    // - not disabled, not animating
    cy.get('button').click()  // Automatically waits
  })
})
```

### 2. Chain Commands

```typescript
// ✅ Good - chained commands
cy.get('input')
  .clear()
  .type('new value')
  .should('have.value', 'new value')

// ❌ Avoid - separate commands for same element
cy.get('input').clear()
cy.get('input').type('new value')
cy.get('input').should('have.value', 'new value')
```

### 3. Use Force Sparingly

```typescript
// ⚠️ Use force only when necessary
describe('Force Option', () => {
  it('should prefer natural interactions', () => {
    // ✅ Better - element is naturally clickable
    cy.get('button').click()
    
    // ❌ Only if absolutely necessary
    cy.get('button').click({ force: true })
  })
})
```

### 4. Type-Safe Interactions

```typescript
interface UserInput {
  email: string
  password: string
  remember: boolean
}

describe('Type-Safe Interactions', () => {
  it('uses typed input', () => {
    const input: UserInput = {
      email: 'test@example.com',
      password: 'SecurePass123',
      remember: true
    }
    
    cy.visit('/login')
    cy.get<HTMLInputElement>('[name="email"]').type(input.email)
    cy.get<HTMLInputElement>('[name="password"]').type(input.password)
    
    if (input.remember) {
      cy.get<HTMLInputElement>('[name="remember"]').check()
    }
  })
})
```

## Summary

- Cypress provides intuitive commands for all basic interactions
- All commands automatically wait for elements to be actionable
- TypeScript adds type safety to interactions
- Commands can be chained for cleaner code
- Special keys and modifiers are supported in type command
- Custom commands can encapsulate complex interactions
- Avoid force option unless absolutely necessary
- Native form elements (select, checkbox, radio) have dedicated commands

## Next Steps

- **05 - Advanced Interactions**: Drag and drop, file uploads, complex gestures
- **09 - Waits and Timeouts**: Understanding automatic waiting in depth
- **11 - Assertions**: Verifying interaction results

## Quick Reference

```typescript
// Click
cy.get('button').click()
cy.get('button').dblclick()
cy.get('button').rightclick()

// Type
cy.get('input').type('text')
cy.get('input').type('{enter}')
cy.get('input').clear()

// Select
cy.get('select').select('value')
cy.get('select').select(['val1', 'val2'])

// Check/Uncheck
cy.get('[type="checkbox"]').check()
cy.get('[type="checkbox"]').uncheck()
cy.get('[type="radio"]').check()

// Focus/Blur
cy.get('input').focus()
cy.get('input').blur()

// Submit
cy.get('form').submit()

// Scroll
cy.get('.element').scrollIntoView()
cy.scrollTo('bottom')

// Trigger
cy.get('.element').trigger('mouseover')
```
