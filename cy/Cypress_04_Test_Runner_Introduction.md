# 04 - Test Runner Introduction

## Introduction to Cypress Test Runner

The Cypress Test Runner is an interactive application that runs your tests in a visible browser. It provides a rich interface for developing, debugging, and understanding your tests with features like time travel, command logs, and the selector playground.

## Opening the Test Runner

### Launch Methods

```bash
# Interactive mode (Test Runner)
npx cypress open

# Headless mode (CI/CD)
npx cypress run

# Open specific browser
npx cypress open --browser chrome
npx cypress open --browser firefox
npx cypress open --browser edge

# Open to specific test
npx cypress open --spec "cypress/e2e/login.cy.ts"
```

### Configuration for Test Runner

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,  // Disable for Test Runner
    screenshotOnRunFailure: true,
    
    setupNodeEvents(on, config) {
      // Event listeners
      return config
    }
  }
})
```

## Test Runner Interface

### Main Components

1. **Test List Panel** (Left): Shows all test files
2. **Command Log** (Left): Lists executed commands
3. **App Preview** (Right): Your application under test
4. **URL Bar** (Top): Current application URL
5. **Viewport Controls** (Top): Resize viewport
6. **Selector Playground** (Top): Interactive element selector

### Test List Panel

```typescript
describe('Test Organization', () => {
  // This appears in Test List with icon
  it('passes successfully', () => {
    cy.visit('/')
    cy.get('h1').should('exist')
  })
  
  it('demonstrates failure', () => {
    cy.visit('/')
    cy.get('.nonexistent').should('exist')  // Will fail
  })
  
  it.skip('skipped test', () => {
    // This test won't run
  })
  
  it.only('only this test runs', () => {
    // Only this test executes when .only is used
  })
})
```

## Command Log

### Understanding Command Log

The Command Log shows every command Cypress executes:

```typescript
describe('Command Log Features', () => {
  it('demonstrates command log', () => {
    cy.visit('/')              // 1. VISIT
    cy.get('[data-cy="btn"]')  // 2. GET
    cy.contains('Click me')    // 3. CONTAINS
    cy.click()                 // 4. CLICK
    cy.url()                   // 5. URL
    cy.should('include', '/success')  // 6. ASSERT
  })
})
```

### Command Log Features

- **Click any command**: Pin command and see DOM snapshot
- **Hover command**: See command details
- **Expandable**: Click to see sub-commands
- **Time Travel**: Hover to see application state at that moment
- **Before/After**: See snapshots before and after command

## Time Travel Debugging

### How Time Travel Works

```typescript
describe('Time Travel', () => {
  it('allows inspection at any point', () => {
    cy.visit('/')
    cy.get('input').type('test')     // Hover in log to see input state
    cy.get('button').click()         // See button click moment
    cy.get('.result').should('exist') // See result appearance
  })
})
```

### Debugging with Time Travel

```typescript
describe('Debug with Time Travel', () => {
  it('finds issues by hovering commands', () => {
    cy.visit('/form')
    
    // Type into wrong field
    cy.get('input').first().type('wrong@email.com')
    
    // Hover over this command in log to see which input was selected
    cy.get('[name="email"]').should('have.value', 'wrong@email.com')
    
    // By hovering, you'll see the first input wasn't the email field!
  })
})
```

## Selector Playground

### Using Selector Playground

The Selector Playground helps you find the best selector for elements:

1. Click the crosshair icon in Test Runner
2. Hover over elements in your app
3. Click an element to get its selector
4. Copy the selector to use in your test

```typescript
describe('Selector Playground Usage', () => {
  it('uses selectors from playground', () => {
    cy.visit('/')
    
    // Open Selector Playground
    // Click on element
    // Get suggested selector: [data-cy="submit-button"]
    
    cy.get('[data-cy="submit-button"]').click()
  })
})
```

### Customizing Selector Preferences

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    // Customize selector priority
    experimentalStudio: true,
    
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        // Custom selector preferences
        return launchOptions
      })
      
      return config
    }
  }
})
```

## Browser DevTools Integration

### Opening DevTools

```typescript
describe('Using DevTools', () => {
  it('debugs with browser DevTools', () => {
    cy.visit('/')
    
    // Add debugger statement
    cy.get('button').then(($btn) => {
      debugger  // Pauses in DevTools
      console.log($btn)
    })
    
    // Or use .debug() command
    cy.get('button').debug()
  })
})
```

### Console Logging

```typescript
describe('Console Logging', () => {
  it('logs to browser console', () => {
    cy.visit('/')
    
    // Cypress command log
    cy.log('Custom log message')
    
    // Browser console (visible in DevTools)
    cy.get('button').then(($btn) => {
      console.log('Button element:', $btn)
      console.table({ text: $btn.text(), visible: $btn.is(':visible') })
    })
  })
})
```

## Viewport Controls

### Changing Viewport in Test Runner

```typescript
describe('Viewport Testing', () => {
  it('tests different viewports', () => {
    // Use viewport menu in Test Runner
    // Or set programmatically
    
    cy.viewport(375, 667)  // Mobile
    cy.visit('/')
    cy.get('.mobile-menu').should('be.visible')
    
    cy.viewport(1920, 1080)  // Desktop
    cy.get('.desktop-menu').should('be.visible')
  })
})
```

## Test Runner Screenshots

### Taking Screenshots

```typescript
describe('Screenshots in Test Runner', () => {
  it('captures screenshots', () => {
    cy.visit('/')
    
    // Manual screenshot
    cy.screenshot('homepage')
    
    // Screenshot specific element
    cy.get('.modal').screenshot('modal-view')
    
    // Screenshots on failure (automatic)
    cy.get('.nonexistent').should('exist')  // Fails and screenshots
  })
})
```

## Pinning Commands

### Pin for Inspection

```typescript
describe('Pinning Commands', () => {
  it('pins commands for inspection', () => {
    cy.visit('/form')
    
    cy.get('input[name="email"]')  // Click to pin this
    cy.get('input[name="password"]')  // Click to pin this
    
    // Both pinned commands visible in app preview
    // Can inspect both elements simultaneously
  })
})
```

## Test Status Indicators

### Understanding Test States

```typescript
describe('Test States', () => {
  it('passes - green checkmark', () => {
    cy.visit('/')
    expect(true).to.be.true
  })
  
  it('fails - red X', () => {
    cy.visit('/')
    expect(true).to.be.false  // Fails
  })
  
  it('pending - gray dot', function() {
    // Test with no body is pending
  })
  
  it.skip('skipped - gray dash', () => {
    // Skipped test
  })
})
```

## Running Tests

### Run Options

```typescript
// Run all tests
describe('All Tests', () => {
  it('test 1', () => { /* ... */ })
  it('test 2', () => { /* ... */ })
  it('test 3', () => { /* ... */ })
})

// Run specific test
describe('Run Specific', () => {
  it.only('only this runs', () => {
    // Only this test executes
  })
  
  it('this is skipped', () => {
    // Skipped when .only is present
  })
})

// Run test suite
describe.only('Only This Suite', () => {
  it('test 1', () => { /* runs */ })
  it('test 2', () => { /* runs */ })
})

describe('Other Suite', () => {
  it('test', () => { /* skipped */ })
})
```

## Auto-Reload on File Changes

### Live Reload

```typescript
describe('Auto-Reload Feature', () => {
  it('automatically reruns on file save', () => {
    cy.visit('/')
    cy.get('h1').should('contain', 'Title')
    
    // Save this file - test automatically reruns
  })
})
```

### Watch Mode Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    watchForFileChanges: true,  // Enable/disable auto-reload
    
    setupNodeEvents(on, config) {
      // Files to watch
      on('file:preprocessor', (file) => {
        // Custom watch logic
        return file
      })
      
      return config
    }
  }
})
```

## Test Runner Settings

### Accessing Settings

Settings available in Test Runner:
- **Viewport**: Change viewport size
- **Theme**: Light/Dark mode
- **Experimental Features**: Enable beta features
- **Project Settings**: Configuration options

### TypeScript in Test Runner

```typescript
// Test Runner has full TypeScript support
interface TestData {
  username: string
  password: string
}

describe('TypeScript in Test Runner', () => {
  it('uses TypeScript features', () => {
    const user: TestData = {
      username: 'testuser',
      password: 'testpass'
    }
    
    cy.visit('/login')
    cy.get<HTMLInputElement>('#username').type(user.username)
    cy.get<HTMLInputElement>('#password').type(user.password)
  })
})
```

## Best Practices for Test Runner

### 1. Use Test Runner for Development

```typescript
// ✅ Good - Develop with Test Runner
// Run: npx cypress open
describe('Development', () => {
  it('develops with visual feedback', () => {
    cy.visit('/')
    // See instant feedback
    // Use time travel
    // Inspect elements
  })
})
```

### 2. Use Cypress Run for CI/CD

```bash
# ✅ Good - CI/CD uses headless mode
npx cypress run --browser chrome --headless
```

### 3. Leverage Selector Playground

```typescript
// ✅ Good - Use Selector Playground to find selectors
describe('Find Selectors', () => {
  it('uses optimal selectors', () => {
    cy.visit('/')
    
    // Use Selector Playground to find this:
    cy.get('[data-cy="submit-button"]')  // From playground
    
    // Instead of brittle:
    // cy.get('div > form > button:nth-child(3)')
  })
})
```

### 4. Use Time Travel for Debugging

```typescript
// ✅ Good - Debug by hovering commands
describe('Debug Tests', () => {
  it('finds issues with time travel', () => {
    cy.visit('/')
    cy.get('.item').first()  // Hover to see which item
    cy.click()
    cy.get('.result')  // Hover to see result state
  })
})
```

### 5. Pin Multiple Commands

```typescript
// ✅ Good - Pin related commands together
describe('Multi-Element Debugging', () => {
  it('compares multiple elements', () => {
    cy.get('.element-1')  // Pin this
    cy.get('.element-2')  // Pin this
    cy.get('.element-3')  // Pin this
    
    // All three visible simultaneously in preview
  })
})
```

## Keyboard Shortcuts

### Test Runner Shortcuts

- **r**: Rerun tests
- **s**: Stop tests
- **f**: Open Selector Playground
- **Cmd/Ctrl + k**: Clear command log
- **Cmd/Ctrl + l**: Toggle Test Runner settings

## Troubleshooting in Test Runner

### Common Issues

```typescript
describe('Troubleshooting', () => {
  it('element not found', () => {
    cy.visit('/')
    
    // Use Selector Playground to verify selector
    // Hover command to see what was found
    // Check timing - might need to wait
    
    cy.get('[data-cy="element"]', { timeout: 10000 })
      .should('exist')
  })
  
  it('element not visible', () => {
    // Hover command to see element state
    // Check if covered by another element
    // Check if element is in viewport
    
    cy.get('.element')
      .should('be.visible')
      .scrollIntoView()
  })
  
  it('intermittent failure', () => {
    // Use time travel to see state when failed
    // Check for race conditions
    // Add appropriate waits
    
    cy.intercept('GET', '/api/data').as('data')
    cy.visit('/')
    cy.wait('@data')
    cy.get('.loaded-content').should('exist')
  })
})
```

## Custom Commands in Test Runner

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      loginViaUI(username: string, password: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('loginViaUI', (username: string, password: string) => {
  cy.log(`Logging in as ${username}`)  // Shows in command log
  cy.visit('/login')
  cy.get('[data-cy="username"]').type(username)
  cy.get('[data-cy="password"]').type(password)
  cy.get('[data-cy="submit"]').click()
})

describe('Custom Commands in Test Runner', () => {
  it('shows custom commands in log', () => {
    cy.loginViaUI('testuser', 'testpass')
    // Shows as single command in log
    // Expandable to see sub-commands
  })
})
```

## Summary

- Test Runner provides visual, interactive test execution
- Command Log shows every command with time travel debugging
- Selector Playground helps find optimal element selectors
- Time travel allows inspection of app state at any command
- Pin commands to inspect multiple elements simultaneously
- Auto-reload reruns tests on file changes
- Browser DevTools integration for advanced debugging
- Use Test Runner for development, `cypress run` for CI/CD
- Screenshots and videos capture test execution
- TypeScript fully supported with IntelliSense

## Next Steps

- **11 - Assertions**: Understanding assertions in Command Log
- **13 - Debugging Tools**: Advanced debugging techniques
- **15 - Reporters and CI**: Headless execution for automation

## Quick Reference

```bash
# Open Test Runner
npx cypress open

# Run specific browser
npx cypress open --browser chrome

# Run specific test
npx cypress open --spec "cypress/e2e/test.cy.ts"

# Headless run
npx cypress run

# Run with specific browser
npx cypress run --browser firefox
```

```typescript
// Test Runner features
cy.log('Message')          // Command log entry
cy.screenshot('name')      // Take screenshot
cy.debug()                 // Pause in DevTools
it.only('test', () => {})  // Run only this test
it.skip('test', () => {})  // Skip this test
```
