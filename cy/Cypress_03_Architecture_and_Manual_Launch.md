# 03 - Architecture and Manual Launch

## Cypress Architecture

Understanding Cypress architecture is crucial for effective test writing and debugging. Unlike traditional testing tools, Cypress has a unique architectural approach.

### Traditional Testing Architecture (Selenium)

```
Test Code → WebDriver → Browser
```

Problems:
- Network commands between test and browser
- Commands can be dropped or delayed
- No direct access to browser internals
- Difficult to debug

### Cypress Architecture

```
Test Code ←→ Cypress (runs inside browser) ←→ Application
```

Cypress executes directly in the browser alongside your application.

## Key Architectural Components

### 1. Node Process

The Node process is responsible for:
- Reading and parsing configuration
- Managing file system operations
- Launching the browser
- Processing tasks that can't run in the browser
- Network proxy for traffic control
- Running plugins and custom tasks

```typescript
// cypress.config.ts - Runs in Node
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // This runs in Node process
      on('task', {
        log(message: string) {
          console.log(message)
          return null
        }
      })
    }
  }
})
```

### 2. Browser Process

The browser process contains:
- Your application code
- Test code
- Cypress runtime
- Cypress Test Runner UI (in interactive mode)

```typescript
// This runs in the browser
describe('Browser Process', () => {
  it('runs in the same context as the app', () => {
    cy.visit('https://example.com')
    // Cypress and your app share the same browser context
    cy.window().then((win) => {
      // Direct access to window object
      console.log(win.location.href)
    })
  })
})
```

### 3. Communication Between Processes

Node and Browser communicate via WebSocket:

```typescript
// Browser → Node
cy.task('readFile', 'data.json')  // Browser requests Node to read file

// Node → Browser
// Results sent back through WebSocket
```

## How Cypress Executes Tests

### 1. Command Queue

Cypress commands are enqueued, not executed immediately:

```typescript
describe('Command Queue', () => {
  it('demonstrates async execution', () => {
    console.log('1. Start')
    
    cy.visit('/')                    // Queued
    cy.get('button').click()         // Queued
    cy.get('.result').should('exist') // Queued
    
    console.log('2. All commands queued')
    // Commands haven't executed yet!
  })
})
```

Execution order:
```
1. Start
2. All commands queued
3. cy.visit executes
4. cy.get().click() executes
5. cy.get().should() executes
```

### 2. Promises vs Commands

Cypress doesn't use Promises directly:

```typescript
// ❌ This doesn't work as expected
it('wrong approach', () => {
  const element = cy.get('button')  // Returns Chainable, not element
  element.click()  // Error!
})

// ✅ Correct approach
it('correct approach', () => {
  cy.get('button').click()  // Commands chain together
})

// ✅ Using .then() for values
it('accessing values', () => {
  cy.get('button').then(($btn) => {
    // $btn is the actual jQuery element
    const text = $btn.text()
    expect(text).to.equal('Submit')
  })
})
```

### 3. Automatic Retry and Waiting

Cypress automatically retries commands until they succeed or timeout:

```typescript
it('demonstrates automatic retry', () => {
  cy.visit('/')
  
  // Cypress will retry this for 4 seconds (default timeout)
  cy.get('.dynamic-content')
    .should('be.visible')
  
  // Each retry re-queries the DOM
  // No need for manual waits!
})
```

## The Run Loop

### Command Lifecycle

1. **Enqueue**: Command is added to queue
2. **Execute**: Command runs when previous commands complete
3. **Snapshot**: DOM snapshot taken before command
4. **Retry**: If assertion fails, command retries
5. **Complete**: Command succeeds or times out

```typescript
it('shows run loop', () => {
  cy.log('Command 1 queued')
  cy.get('input').type('test')  // Queues: get, type
  cy.log('Command 2 queued')
  cy.get('button').click()       // Queues: get, click
  cy.log('Command 3 queued')
  // All logs appear first, then commands execute
})
```

### TypeScript Types in Run Loop

```typescript
// Cypress provides full type information
cy.get<HTMLInputElement>('#email')
  .should('have.value', '')
  .type('test@example.com')
  .should('have.value', 'test@example.com')

// Type-safe with custom types
interface Product {
  id: string
  name: string
  price: number
}

cy.request<Product>('/api/products/1')
  .its('body')
  .should((product) => {
    expect(product.name).to.be.a('string')
    expect(product.price).to.be.a('number')
  })
```

## Manual Browser Launch

### Understanding Launch Modes

Cypress can launch browsers in different modes:

#### 1. Interactive Mode (cypress open)

```bash
npx cypress open
```

Features:
- Visual Test Runner
- Time travel through commands
- Live reload on file changes
- Selector playground
- Great for development and debugging

#### 2. Run Mode (cypress run)

```bash
npx cypress run
```

Features:
- Headless by default
- Records videos
- Takes screenshots on failure
- Suitable for CI/CD
- Faster execution

### Launching Specific Browsers

```bash
# Chrome
npx cypress open --browser chrome

# Firefox
npx cypress open --browser firefox

# Edge
npx cypress open --browser edge

# Electron (default)
npx cypress open --browser electron
```

### Programmatic Browser Launch

You can launch Cypress programmatically:

```typescript
// launch.ts
import cypress from 'cypress'

async function runTests() {
  const results = await cypress.run({
    browser: 'chrome',
    spec: './cypress/e2e/login.cy.ts',
    config: {
      baseUrl: 'http://localhost:3000',
      video: false
    }
  })
  
  console.log('Tests completed:', results)
  
  if (results.totalFailed > 0) {
    process.exit(1)
  }
}

runTests()
```

Run with:
```bash
npx ts-node launch.ts
```

### Browser Launch Options

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Customize browser launch
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          // Add Chrome flags
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
          
          // Modify preferences
          launchOptions.preferences.default = {
            'download': {
              'default_directory': '/path/to/downloads'
            }
          }
        }
        
        return launchOptions
      })
    }
  }
})
```

## Browser Interaction

### Direct Window Access

```typescript
describe('Window Access', () => {
  it('accesses window object', () => {
    cy.visit('/')
    
    cy.window().then((win) => {
      // Full access to window
      console.log(win.location.href)
      console.log(win.localStorage)
      
      // Type-safe with TypeScript
      expect(win.navigator.userAgent).to.be.a('string')
    })
  })
})
```

### Document Access

```typescript
describe('Document Access', () => {
  it('accesses document', () => {
    cy.visit('/')
    
    cy.document().then((doc) => {
      // Full access to document
      expect(doc.title).to.equal('My App')
      expect(doc.readyState).to.equal('complete')
    })
  })
})
```

### Custom Window Properties

```typescript
describe('Custom Properties', () => {
  it('sets and uses custom window properties', () => {
    cy.visit('/')
    
    // Set custom property
    cy.window().then((win) => {
      (win as any).testData = { user: 'testuser' }
    })
    
    // Use in application
    cy.window().its('testData').should('deep.equal', {
      user: 'testuser'
    })
  })
})
```

## Network Layer Control

Cypress sits between your application and the network:

```
Application → Cypress Proxy → Network
```

### Intercepting Requests

```typescript
describe('Network Control', () => {
  it('intercepts and modifies requests', () => {
    // Intercept before visit
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: 'Test User' }
      ]
    }).as('getUsers')
    
    cy.visit('/')
    
    // Wait for intercepted request
    cy.wait('@getUsers')
      .its('response.statusCode')
      .should('equal', 200)
  })
  
  it('modifies response on the fly', () => {
    cy.intercept('GET', '/api/products', (req) => {
      req.continue((res) => {
        // Modify response before it reaches the app
        res.body = res.body.map((product: any) => ({
          ...product,
          price: product.price * 0.5  // 50% discount
        }))
      })
    })
    
    cy.visit('/products')
  })
})
```

## Performance Considerations

### 1. Command Overhead

Each Cypress command has overhead. Minimize unnecessary commands:

```typescript
// ❌ Inefficient
it('inefficient', () => {
  cy.get('button').should('exist')
  cy.get('button').should('be.visible')
  cy.get('button').should('be.enabled')
  cy.get('button').click()
})

// ✅ Efficient
it('efficient', () => {
  cy.get('button')
    .should('be.visible')
    .and('be.enabled')
    .click()
})
```

### 2. Test Isolation

Each test should be isolated:

```typescript
describe('Test Isolation', () => {
  beforeEach(() => {
    // Fresh start for each test
    cy.visit('/')
    cy.clearCookies()
    cy.clearLocalStorage()
  })
  
  it('test 1', () => {
    // Runs independently
  })
  
  it('test 2', () => {
    // Doesn't depend on test 1
  })
})
```

### 3. Avoid Conditional Testing

```typescript
// ❌ Anti-pattern - flaky
it('conditional test', () => {
  cy.get('button').then(($btn) => {
    if ($btn.is(':visible')) {
      cy.wrap($btn).click()
    }
  })
})

// ✅ Better - deterministic
it('deterministic test', () => {
  cy.get('button').should('be.visible').click()
})
```

## Debugging Architecture

### 1. Console Logs

```typescript
describe('Debugging', () => {
  it('uses console logs', () => {
    cy.log('Starting test')  // Appears in Test Runner
    
    cy.get('button').then(($btn) => {
      console.log($btn)  // Browser console
      console.log('Button text:', $btn.text())
    })
  })
})
```

### 2. Debugger

```typescript
describe('Using Debugger', () => {
  it('pauses execution', () => {
    cy.visit('/')
    cy.get('button').debug()  // Pauses and logs element
    cy.get('button').click()
  })
  
  it('uses JavaScript debugger', () => {
    cy.visit('/')
    cy.get('button').then(() => {
      debugger  // Pauses in browser DevTools
    })
  })
})
```

### 3. Pause Command

```typescript
describe('Pause Command', () => {
  it('pauses test execution', () => {
    cy.visit('/')
    cy.pause()  // Pauses test, click Resume to continue
    cy.get('button').click()
  })
})
```

## Advanced Launch Configuration

### Custom Browser Profiles

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.family === 'chromium') {
          // Custom user data directory for persistent sessions
          launchOptions.args.push(
            '--user-data-dir=/path/to/profile'
          )
          
          // Enable specific features
          launchOptions.args.push(
            '--enable-features=NetworkService,NetworkServiceInProcess'
          )
          
          // Extension support
          launchOptions.extensions.push(
            '/path/to/extension'
          )
        }
        
        return launchOptions
      })
    }
  }
})
```

### Environment-Specific Launch

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Different configs per environment
      const environment = config.env.environment || 'local'
      
      const configs = {
        local: {
          baseUrl: 'http://localhost:3000',
          video: false
        },
        staging: {
          baseUrl: 'https://staging.example.com',
          video: true
        },
        production: {
          baseUrl: 'https://example.com',
          video: true,
          videoCompression: 32
        }
      }
      
      return {
        ...config,
        ...configs[environment as keyof typeof configs]
      }
    }
  }
})
```

Run with:
```bash
npx cypress run --env environment=staging
```

## TypeScript Configuration for Architecture

```typescript
// cypress.d.ts - Custom type definitions
declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command that understands architecture
     */
    waitForNetworkIdle(): Chainable<void>
  }
  
  interface ApplicationWindow {
    // Extend window type
    myApp?: {
      version: string
      config: Record<string, any>
    }
  }
}

// Implementation in commands.ts
Cypress.Commands.add('waitForNetworkIdle', () => {
  let requestCount = 0
  
  cy.intercept('**', () => {
    requestCount++
  }).as('anyRequest')
  
  cy.window().then({ timeout: 10000 }, (win) => {
    return new Cypress.Promise((resolve) => {
      const checkIdle = () => {
        if (requestCount === 0) {
          resolve()
        } else {
          requestCount = 0
          setTimeout(checkIdle, 500)
        }
      }
      checkIdle()
    })
  })
})
```

## Summary

- Cypress runs inside the browser, providing direct access to application and DOM
- Two processes: Node (file system, tasks) and Browser (test execution)
- Commands are enqueued and executed asynchronously
- Automatic retry and waiting built into the architecture
- Network proxy allows request/response interception
- Multiple browser launch options: interactive and headless
- TypeScript provides full type safety throughout the architecture
- Understanding the architecture helps write more effective and reliable tests

## Next Steps

Now that you understand Cypress architecture, move on to:
- **03 - Locators**: Learn how to find elements effectively
- **04 - Basic Interactions**: Master fundamental interactions with elements
- **05 - Advanced Interactions**: Complex interactions and gestures

## Quick Reference

```typescript
// Command chaining
cy.get('button').should('be.visible').click()

// Window access
cy.window().then((win) => { /* use win */ })

// Document access
cy.document().then((doc) => { /* use doc */ })

// Network intercept
cy.intercept('GET', '/api/data').as('getData')

// Browser launch
npx cypress open --browser chrome

// Programmatic launch
cypress.run({ browser: 'chrome', spec: 'test.cy.ts' })
```
