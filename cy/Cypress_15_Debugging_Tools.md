# 15 - Debugging Tools

## Introduction to Cypress Debugging

Cypress provides powerful debugging tools that make it easy to understand and fix test failures. This module covers all debugging techniques, from basic console logging to advanced debugging with TypeScript.

## Console Logging

### cy.log()

```typescript
describe('Console Logging', () => {
  it('uses cy.log for custom messages', () => {
    cy.visit('/')
    
    // Basic log
    cy.log('Starting test')
    
    // Log with variables
    const username = 'testuser'
    cy.log(`Logging in as: ${username}`)
    
    // Multiple logs
    cy.log('Step 1: Navigate')
    cy.visit('/login')
    cy.log('Step 2: Enter credentials')
    cy.get('#username').type(username)
    cy.log('Step 3: Submit')
    cy.get('button').click()
  })
})
```

### console.log() in Tests

```typescript
describe('Browser Console', () => {
  it('uses console.log', () => {
    cy.visit('/')
    
    cy.get('.element').then(($el) => {
      // Logs to browser console
      console.log('Element:', $el)
      console.log('Text:', $el.text())
      console.log('Classes:', $el.attr('class'))
      
      // Console methods
      console.table({
        tag: $el.prop('tagName'),
        id: $el.attr('id'),
        classes: $el.attr('class')
      })
      
      console.group('Element Details')
      console.log('Visible:', $el.is(':visible'))
      console.log('Enabled:', !$el.is(':disabled'))
      console.groupEnd()
    })
  })
})
```

### Type-Safe Logging Helper

```typescript
class Logger {
  static info(message: string, data?: any): void {
    cy.log(`ℹ️ ${message}`)
    if (data) {
      console.log(`[INFO] ${message}`, data)
    }
  }
  
  static success(message: string): void {
    cy.log(`✅ ${message}`)
    console.log(`[SUCCESS] ${message}`)
  }
  
  static error(message: string, error?: Error): void {
    cy.log(`❌ ${message}`)
    console.error(`[ERROR] ${message}`, error)
  }
  
  static step(stepNumber: number, description: string): void {
    cy.log(`📍 Step ${stepNumber}: ${description}`)
  }
  
  static data(label: string, data: any): void {
    cy.log(`📊 ${label}`)
    console.table(data)
  }
}

describe('Type-Safe Logging', () => {
  it('uses logging helper', () => {
    Logger.step(1, 'Visit homepage')
    cy.visit('/')
    
    Logger.step(2, 'Fill form')
    cy.get('input').type('test')
    
    Logger.success('Form filled successfully')
  })
})
```

## cy.debug()

### Basic Debugging

```typescript
describe('cy.debug()', () => {
  it('pauses and logs subject', () => {
    cy.visit('/page')
    
    // Debug pauses and logs the element
    cy.get('button')
      .debug()  // Opens debugger with button element
      .click()
  })
  
  it('debugs at specific points', () => {
    cy.visit('/form')
    
    cy.get('input').type('test').debug()
    cy.get('button').debug().click()
    cy.get('.result').debug()
  })
})
```

### Debugging with Conditions

```typescript
describe('Conditional Debugging', () => {
  it('debugs on condition', () => {
    cy.get('.items').then(($items) => {
      if ($items.length < 5) {
        cy.wrap($items).debug()  // Debug when condition met
      }
    })
  })
  
  it('debugs failed assertions', () => {
    cy.get('.element')
      .should(($el) => {
        if (!$el.hasClass('active')) {
          cy.wrap($el).debug()  // Debug when assertion would fail
        }
        expect($el).to.have.class('active')
      })
  })
})
```

## cy.pause()

### Interactive Debugging

```typescript
describe('cy.pause()', () => {
  it('pauses test execution', () => {
    cy.visit('/')
    cy.pause()  // Test pauses here, click Resume to continue
    cy.get('button').click()
  })
  
  it('pauses at specific steps', () => {
    cy.visit('/multi-step')
    
    cy.log('Step 1')
    cy.get('.step-1').click()
    cy.pause()  // Inspect after step 1
    
    cy.log('Step 2')
    cy.get('.step-2').click()
    cy.pause()  // Inspect after step 2
  })
})
```

## Debugger Statement

### Using JavaScript Debugger

```typescript
describe('Debugger Statement', () => {
  it('uses debugger keyword', () => {
    cy.visit('/')
    
    cy.get('button').then(($btn) => {
      debugger  // Breaks in DevTools
      
      // Inspect variables in DevTools
      const text = $btn.text()
      const isVisible = $btn.is(':visible')
      
      console.log({ text, isVisible })
    })
  })
  
  it('conditional debugger', () => {
    cy.get('.items').then(($items) => {
      const count = $items.length
      
      if (count < 5) {
        debugger  // Only break when condition is met
      }
    })
  })
})
```

## Screenshots

### Manual Screenshots

```typescript
describe('Screenshots', () => {
  it('takes manual screenshots', () => {
    cy.visit('/')
    
    // Full page screenshot
    cy.screenshot('homepage')
    
    // Screenshot after action
    cy.get('button').click()
    cy.screenshot('after-click')
  })
  
  it('screenshots specific elements', () => {
    cy.visit('/page')
    
    // Screenshot single element
    cy.get('.modal').screenshot('modal')
    
    // Screenshot with options
    cy.get('.chart').screenshot('chart', {
      capture: 'viewport',  // 'fullPage', 'viewport', 'runner'
      clip: { x: 0, y: 0, width: 500, height: 300 }
    })
  })
})
```

### Automatic Screenshots on Failure

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
  }
})

describe('Automatic Screenshots', () => {
  it('automatically screenshots on failure', () => {
    cy.visit('/')
    cy.get('.nonexistent').should('exist')  // Fails and screenshots
  })
})
```

### Type-Safe Screenshot Helper

```typescript
interface ScreenshotOptions {
  name?: string
  folder?: string
  fullPage?: boolean
  clip?: { x: number; y: number; width: number; height: number }
}

class ScreenshotHelper {
  static capture(options: ScreenshotOptions = {}): void {
    const name = options.name || `screenshot-${Date.now()}`
    const capture = options.fullPage ? 'fullPage' : 'viewport'
    
    cy.screenshot(name, {
      capture,
      clip: options.clip
    })
  }
  
  static captureElement(selector: string, name?: string): void {
    cy.get(selector).screenshot(name || selector.replace(/[^a-z0-9]/gi, '-'))
  }
  
  static captureOnCondition(condition: boolean, name: string): void {
    if (condition) {
      cy.screenshot(name)
    }
  }
}

describe('Screenshot Helper', () => {
  it('uses screenshot helper', () => {
    cy.visit('/')
    
    ScreenshotHelper.capture({ name: 'homepage', fullPage: true })
    ScreenshotHelper.captureElement('.modal', 'modal-view')
  })
})
```

## Error Messages

### Custom Error Messages

```typescript
describe('Custom Error Messages', () => {
  it('provides clear error messages', () => {
    cy.visit('/page')
    
    // Default error (less helpful)
    // cy.get('.element').should('exist')
    
    // Custom error (more helpful)
    cy.get('.element', { timeout: 5000 })
      .should('exist')
      .should(() => {
        throw new Error('Element .element not found. Check if page loaded correctly.')
      })
  })
  
  it('uses assertion messages', () => {
    cy.get('.count').should(($el) => {
      const count = parseInt($el.text())
      expect(count, 'Item count should be at least 5').to.be.at.least(5)
    })
  })
})
```

### Type-Safe Error Helper

```typescript
class ErrorHelper {
  static assertWithMessage<T>(
    value: T,
    condition: (val: T) => boolean,
    message: string
  ): void {
    if (!condition(value)) {
      throw new Error(message)
    }
  }
  
  static logAndThrow(message: string, data?: any): never {
    cy.log(`❌ Error: ${message}`)
    console.error(message, data)
    throw new Error(message)
  }
}

describe('Error Helper', () => {
  it('uses error helper', () => {
    cy.get('.items').then(($items) => {
      ErrorHelper.assertWithMessage(
        $items.length,
        (count) => count >= 5,
        'Expected at least 5 items but found ' + $items.length
      )
    })
  })
})
```

## Inspecting Elements

### Get Element Information

```typescript
describe('Element Inspection', () => {
  it('inspects element details', () => {
    cy.visit('/')
    
    cy.get('.element').then(($el) => {
      // Element properties
      console.log('Tag:', $el.prop('tagName'))
      console.log('ID:', $el.attr('id'))
      console.log('Classes:', $el.attr('class'))
      console.log('Text:', $el.text())
      console.log('HTML:', $el.html())
      
      // Element state
      console.log('Visible:', $el.is(':visible'))
      console.log('Hidden:', $el.is(':hidden'))
      console.log('Enabled:', !$el.is(':disabled'))
      console.log('Focused:', $el.is(':focus'))
      
      // Dimensions
      console.log('Width:', $el.width())
      console.log('Height:', $el.height())
      console.log('Offset:', $el.offset())
      
      // CSS
      console.log('Color:', $el.css('color'))
      console.log('Display:', $el.css('display'))
    })
  })
})
```

### Type-Safe Element Inspector

```typescript
interface ElementInfo {
  tag: string
  id: string | undefined
  classes: string[]
  text: string
  visible: boolean
  enabled: boolean
  dimensions: {
    width: number
    height: number
  }
}

class ElementInspector {
  static inspect(selector: string): Cypress.Chainable<ElementInfo> {
    return cy.get(selector).then(($el) => {
      const info: ElementInfo = {
        tag: $el.prop('tagName') as string,
        id: $el.attr('id'),
        classes: ($el.attr('class') || '').split(' ').filter(Boolean),
        text: $el.text(),
        visible: $el.is(':visible'),
        enabled: !$el.is(':disabled'),
        dimensions: {
          width: $el.width() || 0,
          height: $el.height() || 0
        }
      }
      
      console.table(info)
      return cy.wrap(info)
    })
  }
  
  static logElementChain(selector: string): void {
    cy.get(selector).then(($el) => {
      const chain: string[] = []
      let current = $el[0]
      
      while (current && current !== document.body) {
        let selector = current.tagName.toLowerCase()
        if (current.id) selector += `#${current.id}`
        if (current.className) selector += `.${current.className.split(' ').join('.')}`
        chain.unshift(selector)
        current = current.parentElement as HTMLElement
      }
      
      console.log('Element chain:', chain.join(' > '))
    })
  }
}

describe('Element Inspector', () => {
  it('inspects element', () => {
    cy.visit('/')
    ElementInspector.inspect('button').then((info) => {
      expect(info.visible).to.be.true
    })
  })
})
```

## Network Debugging

### Inspecting Network Requests

```typescript
describe('Network Debugging', () => {
  it('logs network requests', () => {
    cy.intercept('GET', '/api/**', (req) => {
      console.log('Request:', {
        url: req.url,
        method: req.method,
        headers: req.headers,
        body: req.body
      })
      
      req.continue((res) => {
        console.log('Response:', {
          status: res.statusCode,
          headers: res.headers,
          body: res.body
        })
      })
    }).as('apiRequests')
    
    cy.visit('/')
    cy.wait('@apiRequests')
  })
  
  it('debugs failed requests', () => {
    cy.intercept('GET', '/api/data', (req) => {
      req.continue((res) => {
        if (res.statusCode !== 200) {
          debugger  // Break on error responses
        }
      })
    })
  })
})
```

### Type-Safe Network Logger

```typescript
interface NetworkLog {
  timestamp: string
  method: string
  url: string
  status?: number
  duration?: number
}

class NetworkLogger {
  private static logs: NetworkLog[] = []
  
  static setup(): void {
    cy.intercept('**', (req) => {
      const startTime = Date.now()
      const log: NetworkLog = {
        timestamp: new Date().toISOString(),
        method: req.method,
        url: req.url
      }
      
      req.continue((res) => {
        log.status = res.statusCode
        log.duration = Date.now() - startTime
        this.logs.push(log)
        
        console.log('Network:', log)
      })
    })
  }
  
  static getLogs(): NetworkLog[] {
    return this.logs
  }
  
  static clearLogs(): void {
    this.logs = []
  }
  
  static logSummary(): void {
    console.table(this.logs)
  }
}

describe('Network Logger', () => {
  beforeEach(() => {
    NetworkLogger.setup()
  })
  
  it('tracks network activity', () => {
    cy.visit('/')
    cy.wait(1000)
    NetworkLogger.logSummary()
  })
})
```

## Time Travel Debugging

### Using Test Runner Time Travel

```typescript
describe('Time Travel', () => {
  it('demonstrates time travel debugging', () => {
    cy.visit('/')
    
    // Each command creates a snapshot
    cy.get('input').type('test')     // Snapshot 1
    cy.get('button').click()         // Snapshot 2
    cy.get('.result').should('exist') // Snapshot 3
    
    // Hover over commands in Test Runner to time travel
    // and see application state at that moment
  })
})
```

## Command Log Customization

### Custom Commands with Logging

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
  // Custom command appears in command log
  cy.log(`🔐 Logging in as ${username}`)
  
  cy.visit('/login')
  cy.get('[data-cy="username"]').type(username)
  cy.get('[data-cy="password"]').type(password)
  cy.get('[data-cy="submit"]').click()
  
  cy.log('✅ Login successful')
})

describe('Custom Command Logging', () => {
  it('shows custom commands in log', () => {
    cy.loginViaUI('testuser', 'password')
    // Shows as single expandable command in log
  })
})
```

## Debugging Failed Tests

### Failure Analysis

```typescript
describe('Debugging Failures', () => {
  afterEach(function() {
    // Access test state
    if (this.currentTest?.state === 'failed') {
      cy.log('❌ Test failed')
      cy.screenshot(`failed-${this.currentTest.title}`)
      
      // Log additional debug info
      cy.task('log', {
        test: this.currentTest.title,
        error: this.currentTest.err?.message,
        timestamp: new Date().toISOString()
      })
    }
  })
  
  it('captures failure context', () => {
    cy.visit('/')
    cy.get('.element').should('have.class', 'active')
  })
})
```

### Type-Safe Failure Handler

```typescript
interface FailureInfo {
  testName: string
  error: string
  screenshot: string
  timestamp: string
  url: string
}

class FailureHandler {
  static handle(test: Mocha.Test): void {
    if (test.state === 'failed') {
      const info: FailureInfo = {
        testName: test.title,
        error: test.err?.message || 'Unknown error',
        screenshot: `failed-${Date.now()}.png`,
        timestamp: new Date().toISOString(),
        url: ''
      }
      
      cy.url().then((url) => {
        info.url = url
        cy.screenshot(info.screenshot)
        cy.task('log', JSON.stringify(info, null, 2))
      })
    }
  }
}

describe('Failure Handler', () => {
  afterEach(function() {
    FailureHandler.handle(this.currentTest!)
  })
  
  it('test that might fail', () => {
    // Test code
  })
})
```

## Browser Console Errors

### Capturing Console Errors

```typescript
describe('Console Error Tracking', () => {
  beforeEach(() => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Capture console errors
        cy.stub(win.console, 'error').as('consoleError')
        cy.stub(win.console, 'warn').as('consoleWarn')
      }
    })
  })
  
  it('tracks console errors', () => {
    // Perform actions
    cy.get('button').click()
    
    // Check for console errors
    cy.get('@consoleError').should('not.have.been.called')
    cy.get('@consoleWarn').should('not.have.been.called')
  })
})
```

## Performance Debugging

### Measuring Test Performance

```typescript
describe('Performance Debugging', () => {
  it('measures command duration', () => {
    const startTime = Date.now()
    
    cy.visit('/')
    cy.then(() => {
      const visitDuration = Date.now() - startTime
      cy.log(`Visit took ${visitDuration}ms`)
    })
    
    const actionStart = Date.now()
    cy.get('button').click()
    cy.then(() => {
      const actionDuration = Date.now() - actionStart
      cy.log(`Action took ${actionDuration}ms`)
    })
  })
})
```

## Debugging Best Practices

### 1. Use Descriptive Logs

```typescript
// ✅ Good - descriptive logging
cy.log('Step 1: Navigate to login page')
cy.visit('/login')
cy.log('Step 2: Enter valid credentials')
cy.get('#username').type('testuser')

// ❌ Avoid - no context
cy.visit('/login')
cy.get('#username').type('testuser')
```

### 2. Strategic Pauses

```typescript
// ✅ Good - pause at critical points
cy.log('About to submit form')
cy.pause()  // Inspect form state
cy.get('form').submit()

// ❌ Avoid - pause everywhere
cy.pause()
cy.visit('/')
cy.pause()
cy.get('button').pause().click()
```

### 3. Conditional Debugging

```typescript
// ✅ Good - debug only when needed
cy.get('.items').then(($items) => {
  if ($items.length === 0) {
    cy.wrap($items).debug()
  }
})

// ❌ Avoid - always debug
cy.get('.items').debug()
```

## Debugging Helpers Collection

```typescript
// cypress/support/debug-helpers.ts
export class DebugHelpers {
  static logStep(step: number, description: string): void {
    cy.log(`📍 Step ${step}: ${description}`)
  }
  
  static logSuccess(message: string): void {
    cy.log(`✅ ${message}`)
  }
  
  static logError(message: string): void {
    cy.log(`❌ ${message}`)
  }
  
  static inspectElement(selector: string): void {
    cy.get(selector).then(($el) => {
      console.group(`Inspecting: ${selector}`)
      console.log('Element:', $el[0])
      console.log('Text:', $el.text())
      console.log('Visible:', $el.is(':visible'))
      console.log('Classes:', $el.attr('class'))
      console.groupEnd()
    })
  }
  
  static takeDebugScreenshot(name: string): void {
    cy.screenshot(`debug-${name}-${Date.now()}`)
  }
  
  static logNetworkActivity(): void {
    cy.window().then((win) => {
      // @ts-ignore
      const resources = win.performance.getEntriesByType('resource')
      console.table(resources.map(r => ({
        name: r.name,
        duration: r.duration,
        type: r.initiatorType
      })))
    })
  }
}
```

## Summary

- `cy.log()` for custom messages in command log
- `cy.debug()` to inspect elements and pause
- `cy.pause()` for interactive debugging
- `debugger` statement for DevTools breakpoints
- `cy.screenshot()` for visual debugging
- Console methods for detailed logging
- Time travel in Test Runner shows past states
- Network interception for API debugging
- Custom error messages improve troubleshooting
- Type-safe helpers organize debugging code
- Screenshots automatically taken on failure
- Element inspection reveals detailed state

## Next Steps

- **10 - Test Runner Intro**: Visual debugging tools
- **15 - Reporters and CI**: Debug info in CI/CD
- **24 - Best Practices**: Debugging strategies

## Quick Reference

```typescript
// Logging
cy.log('message')
console.log('data')

// Debugging
cy.debug()
cy.pause()
debugger

// Screenshots
cy.screenshot()
cy.screenshot('name')
cy.get('.element').screenshot()

// Element inspection
cy.get('.el').then($el => {
  console.log($el)
  console.table({...})
})

// Network
cy.intercept('**', req => {
  console.log(req)
})
```
