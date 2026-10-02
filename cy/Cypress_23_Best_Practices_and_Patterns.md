# 23 - Best Practices and Patterns

## Introduction to Cypress Best Practices

This module compiles proven patterns, anti-patterns, and best practices for writing maintainable, reliable, and scalable Cypress tests with TypeScript.

## Test Organization

### Folder Structure

```
cypress/
├── e2e/
│   ├── auth/
│   │   ├── login.cy.ts
│   │   ├── logout.cy.ts
│   │   └── password-reset.cy.ts
│   ├── dashboard/
│   │   ├── overview.cy.ts
│   │   └── widgets.cy.ts
│   └── admin/
│       └── user-management.cy.ts
├── fixtures/
│   ├── users/
│   │   ├── admin.json
│   │   └── regular.json
│   └── products/
│       └── catalog.json
├── support/
│   ├── commands.ts
│   ├── e2e.ts
│   ├── pages/
│   │   ├── LoginPage.ts
│   │   ├── DashboardPage.ts
│   │   └── BasePage.ts
│   ├── api/
│   │   └── ApiClient.ts
│   └── helpers/
│       ├── AuthHelper.ts
│       └── DataHelper.ts
└── tsconfig.json
```

### Naming Conventions

```typescript
// ✅ Good - descriptive, clear naming
describe('User Authentication', () => {
  describe('Login Flow', () => {
    it('should log in with valid credentials', () => {})
    it('should show error with invalid credentials', () => {})
    it('should redirect to MFA when enabled', () => {})
  })
})

// ❌ Avoid - vague, unclear naming
describe('Tests', () => {
  it('test1', () => {})
  it('works', () => {})
})
```

## Selector Best Practices

### Use data-* Attributes

```typescript
// ✅ Good - dedicated test attributes
cy.get('[data-cy="submit-button"]')
cy.get('[data-testid="user-menu"]')
cy.get('[data-test="login-form"]')

// ❌ Avoid - brittle selectors
cy.get('.btn.btn-primary.mt-3')
cy.get('div > div > button:nth-child(3)')
cy.get('#button-12345')
```

### Selector Priority

```typescript
// Priority order (best to worst):
// 1. data-* attributes
cy.get('[data-cy="element"]')

// 2. id attributes  
cy.get('#unique-id')

// 3. Other attributes
cy.get('[name="email"]')
cy.get('[aria-label="Close"]')

// 4. Class names (if stable)
cy.get('.user-profile')

// 5. Tag + class combination
cy.get('button.submit')

// Avoid: Complex CSS selectors, nth-child
```

### Type-Safe Selectors

```typescript
// ✅ Good - centralized selectors
enum Selectors {
  LOGIN_EMAIL = '[data-cy="login-email"]',
  LOGIN_PASSWORD = '[data-cy="login-password"]',
  LOGIN_SUBMIT = '[data-cy="login-submit"]'
}

cy.get(Selectors.LOGIN_EMAIL).type('user@example.com')

// Or use constants
const SELECTORS = {
  auth: {
    email: '[data-cy="login-email"]',
    password: '[data-cy="login-password"]',
    submit: '[data-cy="login-submit"]'
  }
} as const
```

## Waiting and Timing

### Avoid Arbitrary Waits

```typescript
// ❌ Bad - arbitrary wait
cy.wait(3000)
cy.get('.element').click()

// ✅ Good - wait for specific condition
cy.get('.element').should('be.visible').click()

// ✅ Good - wait for network
cy.intercept('GET', '/api/data').as('getData')
cy.wait('@getData')

// ✅ Good - custom timeout
cy.get('.slow-element', { timeout: 10000 }).should('exist')
```

### Auto-Wait Leverage

```typescript
// ✅ Good - Cypress auto-waits
cy.get('button').click()  // Waits for actionability
cy.get('.result').should('contain', 'Success')  // Retries assertion

// ❌ Avoid - manual waiting
cy.get('button').then($btn => {
  cy.wait(1000)
  $btn.click()
})
```

## Test Independence

### Independent Tests

```typescript
// ✅ Good - each test independent
describe('User Tests', () => {
  beforeEach(() => {
    cy.createUser()  // Fresh data each test
    cy.login()
  })
  
  it('test 1', () => {
    // Completely independent
  })
  
  it('test 2', () => {
    // Completely independent
  })
  
  afterEach(() => {
    cy.deleteUser()  // Clean up
  })
})

// ❌ Avoid - dependent tests
describe('User Tests', () => {
  it('creates user', () => {
    cy.createUser()
  })
  
  it('updates user', () => {
    // Depends on test above!
    cy.updateUser()
  })
})
```

### Isolation

```typescript
// ✅ Good - isolated data
it('creates product', () => {
  const uniqueId = `product-${Date.now()}`
  cy.createProduct({ id: uniqueId, name: 'Test Product' })
})

// ❌ Avoid - shared data
it('creates product', () => {
  cy.createProduct({ id: 'product-1', name: 'Test Product' })
  // Conflicts in parallel execution!
})
```

## Assertions

### Multiple Assertions

```typescript
// ✅ Good - chain assertions
cy.get('.user')
  .should('be.visible')
  .and('have.class', 'active')
  .and('contain', 'John Doe')

// ❌ Avoid - separate queries
cy.get('.user').should('be.visible')
cy.get('.user').should('have.class', 'active')
cy.get('.user').should('contain', 'John Doe')
```

### Specific Assertions

```typescript
// ✅ Good - specific assertion
cy.get('.count').should('have.text', '5')

// ❌ Avoid - vague assertion
cy.get('.count').should('exist')
```

## Custom Commands

### Reusable Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      createProduct(product: Product): Chainable<string>
      deleteProduct(id: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email, password) => {
  cy.session([email, password], () => {
    cy.request('POST', '/api/auth/login', { email, password })
      .then(res => localStorage.setItem('token', res.body.token))
  })
})

// ✅ Good - reusable across tests
it('test 1', () => {
  cy.login('user@example.com', 'password')
})

it('test 2', () => {
  cy.login('admin@example.com', 'adminpass')
})
```

### Custom Command Guidelines

```typescript
// ✅ Good - clear purpose, chainable
Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'adminpass')
})

// ✅ Good - returns element for chaining
Cypress.Commands.add('getByDataCy', (selector: string) => {
  return cy.get(`[data-cy="${selector}"]`)
})

// ❌ Avoid - doing too much
Cypress.Commands.add('doEverything', () => {
  cy.login()
  cy.visit('/dashboard')
  cy.createUser()
  cy.updateSettings()
  // Too much!
})
```

## API vs UI Testing

### When to Use Each

```typescript
// ✅ Good - API for setup, UI for user journey
describe('Product Management', () => {
  beforeEach(() => {
    // Setup via API (fast)
    cy.request('POST', '/api/products', productData)
  })
  
  it('displays product in UI', () => {
    // Test UI (what users see)
    cy.visit('/products')
    cy.get('.product-card').should('contain', 'Test Product')
  })
  
  afterEach(() => {
    // Cleanup via API (fast)
    cy.request('DELETE', `/api/products/${productId}`)
  })
})

// ❌ Avoid - UI for everything
describe('Product Management', () => {
  it('creates product', () => {
    cy.visit('/products/new')
    cy.get('#name').type('Product')
    cy.get('#price').type('99.99')
    cy.get('#description').type('Long description...')
    cy.get('button').click()
    // Slow!
  })
})
```

## Page Object Model

### Clean Page Objects

```typescript
// ✅ Good - focused, reusable
export class LoginPage {
  private selectors = {
    email: '[data-cy="email"]',
    password: '[data-cy="password"]',
    submit: '[data-cy="submit"]'
  }
  
  visit(): this {
    cy.visit('/login')
    return this
  }
  
  login(email: string, password: string): this {
    cy.get(this.selectors.email).type(email)
    cy.get(this.selectors.password).type(password)
    cy.get(this.selectors.submit).click()
    return this
  }
  
  shouldShowError(message: string): this {
    cy.contains(message).should('be.visible')
    return this
  }
}

// ❌ Avoid - mixed concerns
export class LoginPage {
  login() { }
  createUser() { }  // Belongs elsewhere
  sendEmail() { }   // Belongs elsewhere
}
```

## Error Handling

### Graceful Failures

```typescript
// ✅ Good - helpful error messages
cy.get('[data-cy="submit"]', { timeout: 5000 })
  .should('exist', 'Submit button not found. Check if form loaded correctly.')

// ✅ Good - conditional checks
cy.get('body').then($body => {
  if ($body.find('.modal').length > 0) {
    cy.get('.modal-close').click()
  }
})

// ❌ Avoid - silent failures
cy.get('[data-cy="optional"]').then($el => {
  if ($el.length > 0) {
    cy.wrap($el).click()
  }
})
```

## Performance Optimization

### Session Caching

```typescript
// ✅ Good - cache auth session
beforeEach(() => {
  cy.session('user-session', () => {
    cy.login('user@example.com', 'password')
  })
})

// ❌ Avoid - login every test
beforeEach(() => {
  cy.visit('/login')
  cy.get('#email').type('user@example.com')
  cy.get('#password').type('password')
  cy.get('button').click()
})
```

### Minimize Network Requests

```typescript
// ✅ Good - stub unnecessary requests
beforeEach(() => {
  cy.intercept('GET', '/api/analytics', { body: {} })
  cy.intercept('GET', '/api/tracking', { body: {} })
})

// ✅ Good - load fixtures once
before(() => {
  cy.fixture('users.json').as('users')
})

it('test', function() {
  // Use this.users
})
```

## Test Data Management

### Fixtures and Builders

```typescript
// ✅ Good - organized fixtures
// cypress/fixtures/users/admin.json
{
  "email": "admin@example.com",
  "role": "admin"
}

// ✅ Good - data builders
class UserBuilder {
  private user: Partial<User> = {}
  
  withEmail(email: string): this {
    this.user.email = email
    return this
  }
  
  withRole(role: UserRole): this {
    this.user.role = role
    return this
  }
  
  build(): User {
    return {
      id: Date.now().toString(),
      email: this.user.email || 'default@example.com',
      role: this.user.role || 'user',
      name: 'Test User'
    }
  }
}

// Usage
const admin = new UserBuilder()
  .withEmail('admin@example.com')
  .withRole('admin')
  .build()
```

## TypeScript Best Practices

### Strong Typing

```typescript
// ✅ Good - typed interfaces
interface User {
  id: string
  email: string
  role: 'admin' | 'user'
}

cy.request<User>('GET', '/api/user/1')
  .then(response => {
    const user = response.body
    expect(user.role).to.be.oneOf(['admin', 'user'])
  })

// ✅ Good - typed custom commands
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      getByTestId(testId: string): Chainable<JQuery<HTMLElement>>
    }
  }
}
```

## CI/CD Best Practices

### Parallel Execution

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    // Optimize for CI
    video: false,  // Save time/space
    screenshotOnRunFailure: true,
    numTestsKeptInMemory: 0,  // Reduce memory usage
    
    retries: {
      runMode: 2,  // Retry flaky tests
      openMode: 0
    }
  }
})
```

### Environment Configuration

```typescript
// ✅ Good - environment-aware config
const environments = {
  local: { baseUrl: 'http://localhost:3000' },
  ci: { baseUrl: 'https://staging.example.com' },
  prod: { baseUrl: 'https://example.com' }
}

const env = process.env.CYPRESS_ENV || 'local'
export default defineConfig({
  e2e: {
    ...environments[env]
  }
})
```

## Common Anti-Patterns

### Anti-Pattern 1: Using .then() When Not Needed

```typescript
// ❌ Avoid
cy.get('.element').then($el => {
  expect($el).to.be.visible
})

// ✅ Good
cy.get('.element').should('be.visible')
```

### Anti-Pattern 2: Conditional Testing

```typescript
// ❌ Avoid - conditional logic in tests
cy.get('body').then($body => {
  if ($body.find('.modal').length) {
    // Test scenario A
  } else {
    // Test scenario B
  }
})

// ✅ Good - separate tests
it('handles modal present', () => {
  cy.mockModalPresent()
  // Test scenario A
})

it('handles modal absent', () => {
  cy.mockModalAbsent()
  // Test scenario B
})
```

### Anti-Pattern 3: Chaining After Actions

```typescript
// ❌ Avoid - chaining after action
cy.get('button')
  .click()
  .should('have.class', 'clicked')  // Won't work as expected

// ✅ Good - separate query
cy.get('button').click()
cy.get('button').should('have.class', 'clicked')
```

## Testing Strategy

### Test Pyramid

```typescript
// Recommended distribution:
// - 70% API/Integration tests (fast, reliable)
// - 20% UI critical path tests (important user flows)
// - 10% E2E tests (complete workflows)

// ✅ Good - focus on critical paths
describe('Critical User Flows', () => {
  it('completes purchase flow', () => {
    cy.login()
    cy.visit('/products')
    cy.addToCart('product-1')
    cy.checkout()
    cy.confirmOrder()
  })
})

// ❌ Avoid - testing every detail via UI
describe('All UI Tests', () => {
  it('tests button color', () => { })
  it('tests font size', () => { })
  it('tests margin', () => { })
  // Use visual regression instead!
})
```

## Code Quality

### DRY Principle

```typescript
// ✅ Good - reusable helpers
class TestHelper {
  static setupAuthenticatedUser() {
    cy.login('user@example.com', 'password')
  }
  
  static createTestProduct() {
    return cy.request('POST', '/api/products', testProduct)
  }
}

// ❌ Avoid - repeated code
it('test 1', () => {
  cy.visit('/login')
  cy.get('#email').type('user@example.com')
  cy.get('#password').type('password')
  cy.get('button').click()
})

it('test 2', () => {
  cy.visit('/login')
  cy.get('#email').type('user@example.com')
  cy.get('#password').type('password')
  cy.get('button').click()
})
```

## Documentation

### Self-Documenting Tests

```typescript
// ✅ Good - clear, descriptive
describe('User Registration Flow', () => {
  describe('When user enters valid data', () => {
    it('should create account and redirect to dashboard', () => {
      cy.visit('/register')
      cy.fillRegistrationForm({
        email: 'new@example.com',
        password: 'SecurePass123!'
      })
      cy.submitForm()
      cy.url().should('include', '/dashboard')
    })
  })
  
  describe('When user enters invalid email', () => {
    it('should show validation error', () => {
      cy.visit('/register')
      cy.get('#email').type('invalid-email')
      cy.get('#submit').click()
      cy.get('.error').should('contain', 'Invalid email')
    })
  })
})
```

## Summary

**Key Best Practices:**
- Use data-* attributes for selectors
- Avoid arbitrary waits
- Keep tests independent
- Use API for setup/teardown
- Chain assertions efficiently
- Leverage cy.session() for performance
- Use TypeScript for type safety
- Organize tests logically
- Follow Page Object Model
- Test critical paths, not every detail
- Optimize for CI/CD
- Write self-documenting tests
- Avoid anti-patterns
- Keep code DRY
- Use proper error handling

**Remember:**
- Tests should be fast, reliable, and maintainable
- Optimize for developer experience
- Balance coverage with speed
- Prioritize critical user flows
- Use the right tool (API vs UI)

## Next Steps

- **31 - Capstone Project**: Apply all best practices
- **18 - Page Object Model**: Structural patterns
- **15 - Reporters and CI**: CI/CD optimization

## Quick Reference

```typescript
// Good patterns
cy.get('[data-cy="element"]')  // Data attributes
cy.session('key', () => {})     // Cache sessions
cy.request('POST', '/api')      // API for setup
cy.get('.el').should('exist')   // Chain assertions

// Avoid
cy.wait(3000)                   // Arbitrary waits
cy.get('.a > .b > .c')         // Brittle selectors
if (condition) { }              // Conditional testing
$el.click()                     // Direct jQuery
```
