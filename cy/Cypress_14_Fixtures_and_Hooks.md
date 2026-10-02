# 14 - Fixtures and Hooks

## Introduction to Fixtures and Hooks

Fixtures provide test data, while hooks organize test setup and teardown. This module covers comprehensive fixture patterns and all hook types with TypeScript.

## Fixtures

### Loading Fixtures

```typescript
describe('Loading Fixtures', () => {
  it('loads fixture data', () => {
    cy.fixture('users.json').then((users) => {
      expect(users).to.be.an('array')
      expect(users[0]).to.have.property('username')
    })
  })
  
  it('uses fixture in test', () => {
    cy.fixture('user.json').then((user) => {
      cy.visit('/login')
      cy.get('#username').type(user.username)
      cy.get('#password').type(user.password)
      cy.get('button').click()
    })
  })
})
```

### Fixture Aliases

```typescript
describe('Fixture Aliases', () => {
  beforeEach(() => {
    // Load fixture once, use in multiple tests
    cy.fixture('users.json').as('users')
    cy.fixture('products.json').as('products')
  })
  
  it('uses aliased fixture', function() {
    // Access via this.users
    const users = this.users
    cy.log(`Loaded ${users.length} users`)
  })
  
  it('uses multiple fixtures', function() {
    cy.visit('/dashboard')
    cy.get('#user-count').should('contain', this.users.length)
    cy.get('#product-count').should('contain', this.products.length)
  })
})
```

### Type-Safe Fixtures

```typescript
// cypress/fixtures/types.ts
export interface User {
  id: string
  username: string
  email: string
  password: string
  role: 'admin' | 'user' | 'guest'
}

export interface Product {
  id: string
  name: string
  price: number
  category: string
  inStock: boolean
}

export interface Config {
  apiUrl: string
  timeout: number
  retries: number
  features: {
    darkMode: boolean
    notifications: boolean
  }
}

// In tests
describe('Type-Safe Fixtures', () => {
  it('uses typed fixtures', () => {
    cy.fixture<User>('user.json').then((user) => {
      // user is typed as User
      expect(user.username).to.be.a('string')
      expect(user.role).to.be.oneOf(['admin', 'user', 'guest'])
    })
  })
  
  it('uses typed fixture array', () => {
    cy.fixture<User[]>('users.json').then((users) => {
      users.forEach((user) => {
        expect(user).to.have.property('id')
        expect(user).to.have.property('email')
      })
    })
  })
})
```

### Dynamic Fixtures

```typescript
describe('Dynamic Fixtures', () => {
  it('generates fixture at runtime', () => {
    const dynamicUser = {
      id: `user-${Date.now()}`,
      username: `testuser-${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Date.now()}@example.com`,
      createdAt: new Date().toISOString()
    }
    
    cy.writeFile('cypress/fixtures/dynamic-user.json', dynamicUser)
    
    cy.fixture('dynamic-user.json').then((user) => {
      expect(user.id).to.include('user-')
    })
  })
  
  it('modifies existing fixture', () => {
    cy.fixture('template.json').then((template) => {
      const customized = {
        ...template,
        timestamp: Date.now(),
        customField: 'custom value'
      }
      
      cy.writeFile('cypress/fixtures/customized.json', customized)
    })
  })
})
```

### Fixture Helper Class

```typescript
class FixtureHelper {
  static load<T>(name: string): Cypress.Chainable<T> {
    return cy.fixture<T>(name)
  }
  
  static loadMultiple<T extends Record<string, any>>(
    names: string[]
  ): Cypress.Chainable<T> {
    const promises = names.map(name => cy.fixture(name))
    
    return cy.wrap(
      Promise.all(promises).then((results) => {
        const combined: any = {}
        names.forEach((name, index) => {
          combined[name] = results[index]
        })
        return combined as T
      })
    )
  }
  
  static create<T>(name: string, data: T): void {
    cy.writeFile(`cypress/fixtures/${name}.json`, data)
  }
  
  static update<T>(name: string, updater: (data: T) => T): void {
    cy.fixture<T>(name).then((data) => {
      const updated = updater(data)
      cy.writeFile(`cypress/fixtures/${name}.json`, updated)
    })
  }
}

describe('Fixture Helper', () => {
  it('loads single fixture', () => {
    FixtureHelper.load<User>('user.json').then((user) => {
      expect(user.username).to.exist
    })
  })
  
  it('loads multiple fixtures', () => {
    interface Fixtures {
      users: User[]
      products: Product[]
    }
    
    FixtureHelper.loadMultiple<Fixtures>(['users', 'products'])
      .then((fixtures) => {
        expect(fixtures.users).to.be.an('array')
        expect(fixtures.products).to.be.an('array')
      })
  })
})
```

## Hooks

### before()

```typescript
describe('before() Hook', () => {
  // Runs once before all tests in the describe block
  before(() => {
    cy.log('Setting up test suite')
    cy.task('seedDatabase')
    cy.task('clearCache')
  })
  
  it('test 1', () => {
    cy.visit('/')
  })
  
  it('test 2', () => {
    cy.visit('/about')
  })
})
```

### beforeEach()

```typescript
describe('beforeEach() Hook', () => {
  // Runs before each test
  beforeEach(() => {
    cy.log('Setting up individual test')
    cy.visit('/')
    cy.clearCookies()
    cy.clearLocalStorage()
  })
  
  it('test 1', () => {
    cy.get('h1').should('be.visible')
  })
  
  it('test 2', () => {
    cy.get('h1').should('be.visible')
  })
})
```

### after()

```typescript
describe('after() Hook', () => {
  // Runs once after all tests in the describe block
  after(() => {
    cy.log('Cleaning up test suite')
    cy.task('clearDatabase')
    cy.task('deleteTestFiles')
  })
  
  it('test 1', () => {
    cy.visit('/')
  })
  
  it('test 2', () => {
    cy.visit('/about')
  })
})
```

### afterEach()

```typescript
describe('afterEach() Hook', () => {
  // Runs after each test
  afterEach(() => {
    cy.log('Cleaning up individual test')
    
    // Clear session data
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Reset application state
    cy.window().then((win) => {
      win.sessionStorage.clear()
    })
  })
  
  it('test 1', () => {
    cy.visit('/')
    cy.get('button').click()
  })
  
  it('test 2', () => {
    cy.visit('/page')
    cy.get('input').type('test')
  })
})
```

### Hook Order

```typescript
describe('Hook Execution Order', () => {
  before(() => {
    cy.log('1. before - runs once before all tests')
  })
  
  beforeEach(() => {
    cy.log('2. beforeEach - runs before each test')
  })
  
  afterEach(() => {
    cy.log('3. afterEach - runs after each test')
  })
  
  after(() => {
    cy.log('4. after - runs once after all tests')
  })
  
  it('test 1', () => {
    cy.log('Test 1 executing')
  })
  
  it('test 2', () => {
    cy.log('Test 2 executing')
  })
})

// Execution order:
// 1. before
// 2. beforeEach
// Test 1 executing
// 3. afterEach
// 2. beforeEach
// Test 2 executing
// 3. afterEach
// 4. after
```

### Nested Hooks

```typescript
describe('Outer Suite', () => {
  before(() => {
    cy.log('Outer before')
  })
  
  beforeEach(() => {
    cy.log('Outer beforeEach')
  })
  
  describe('Inner Suite', () => {
    before(() => {
      cy.log('Inner before')
    })
    
    beforeEach(() => {
      cy.log('Inner beforeEach')
    })
    
    it('test in inner suite', () => {
      cy.log('Inner test')
    })
    
    // Execution order:
    // Outer before
    // Inner before
    // Outer beforeEach
    // Inner beforeEach
    // Inner test
  })
})
```

### Type-Safe Hooks

```typescript
interface TestContext {
  user: User
  authToken: string
  testData: any[]
}

describe('Type-Safe Hooks', () => {
  beforeEach(function() {
    // Set up test context with types
    const context: TestContext = {
      user: {
        id: '1',
        username: 'testuser',
        email: 'test@example.com',
        password: 'password',
        role: 'user'
      },
      authToken: 'abc123',
      testData: []
    }
    
    // Attach to test context
    Object.assign(this, context)
  })
  
  it('uses typed context', function(this: TestContext) {
    cy.log(`User: ${this.user.username}`)
    cy.log(`Token: ${this.authToken}`)
    expect(this.user.role).to.equal('user')
  })
})
```

### Hooks with Fixtures

```typescript
describe('Hooks with Fixtures', () => {
  let users: User[]
  let products: Product[]
  
  before(() => {
    cy.fixture<User[]>('users.json').then((data) => {
      users = data
    })
    
    cy.fixture<Product[]>('products.json').then((data) => {
      products = data
    })
  })
  
  beforeEach(() => {
    cy.log(`Testing with ${users.length} users`)
    cy.log(`Testing with ${products.length} products`)
  })
  
  it('uses fixture data', () => {
    expect(users).to.have.length.greaterThan(0)
    expect(products).to.have.length.greaterThan(0)
  })
})
```

## Advanced Hook Patterns

### Conditional Hooks

```typescript
describe('Conditional Hooks', () => {
  beforeEach(() => {
    const shouldSeed = Cypress.env('SEED_DATABASE')
    
    if (shouldSeed) {
      cy.task('seedDatabase')
    }
  })
  
  afterEach(function() {
    // Only screenshot on failure
    if (this.currentTest?.state === 'failed') {
      cy.screenshot(`failed-${this.currentTest.title}`)
    }
  })
})
```

### Async Hooks

```typescript
describe('Async Hooks', () => {
  before(() => {
    return cy.task('asyncSetup').then((result) => {
      cy.log('Async setup complete', result)
    })
  })
  
  beforeEach(() => {
    return cy.request('/api/reset').then((response) => {
      expect(response.status).to.equal(200)
    })
  })
})
```

### Hook Helper Class

```typescript
class HookHelper {
  static setupTest(options: {
    clearStorage?: boolean
    seedData?: boolean
    login?: boolean
  } = {}): void {
    if (options.clearStorage) {
      cy.clearCookies()
      cy.clearLocalStorage()
    }
    
    if (options.seedData) {
      cy.task('seedDatabase')
    }
    
    if (options.login) {
      cy.fixture<User>('user.json').then((user) => {
        cy.request({
          method: 'POST',
          url: '/api/login',
          body: {
            username: user.username,
            password: user.password
          }
        })
      })
    }
  }
  
  static teardownTest(options: {
    clearStorage?: boolean
    screenshot?: boolean
  } = {}): void {
    if (options.clearStorage) {
      cy.clearCookies()
      cy.clearLocalStorage()
    }
    
    if (options.screenshot) {
      cy.screenshot(`test-${Date.now()}`)
    }
  }
}

describe('Hook Helper Usage', () => {
  beforeEach(() => {
    HookHelper.setupTest({
      clearStorage: true,
      seedData: true,
      login: true
    })
  })
  
  afterEach(() => {
    HookHelper.teardownTest({
      clearStorage: true
    })
  })
  
  it('runs with setup', () => {
    cy.visit('/dashboard')
  })
})
```

## Fixture Organization

### Fixture Structure

```
cypress/
  fixtures/
    users/
      admin.json
      regular-user.json
      guest.json
    products/
      electronics.json
      clothing.json
    config/
      local.json
      staging.json
      production.json
    templates/
      user-template.json
      order-template.json
```

### Fixture Factory

```typescript
class FixtureFactory {
  static createUser(overrides: Partial<User> = {}): User {
    const defaultUser: User = {
      id: `user-${Date.now()}`,
      username: `user${Math.random().toString(36).substr(2, 9)}`,
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'user'
    }
    
    return { ...defaultUser, ...overrides }
  }
  
  static createProduct(overrides: Partial<Product> = {}): Product {
    const defaultProduct: Product = {
      id: `prod-${Date.now()}`,
      name: 'Test Product',
      price: 99.99,
      category: 'electronics',
      inStock: true
    }
    
    return { ...defaultProduct, ...overrides }
  }
  
  static createUsers(count: number, overrides: Partial<User> = {}): User[] {
    return Array.from({ length: count }, () => this.createUser(overrides))
  }
}

describe('Fixture Factory', () => {
  it('creates user', () => {
    const user = FixtureFactory.createUser({
      role: 'admin'
    })
    
    expect(user.role).to.equal('admin')
    expect(user.id).to.exist
  })
  
  it('creates multiple users', () => {
    const users = FixtureFactory.createUsers(5, { role: 'user' })
    expect(users).to.have.length(5)
    users.forEach(user => {
      expect(user.role).to.equal('user')
    })
  })
})
```

## Hook Best Practices

### 1. Keep Hooks Focused

```typescript
// ✅ Good - single responsibility
describe('Focused Hooks', () => {
  beforeEach(() => {
    cy.clearCookies()
  })
  
  beforeEach(() => {
    cy.fixture('user.json').as('user')
  })
  
  beforeEach(() => {
    cy.visit('/')
  })
})

// ❌ Avoid - doing too much
describe('Unfocused Hooks', () => {
  beforeEach(() => {
    cy.clearCookies()
    cy.fixture('user.json').as('user')
    cy.visit('/')
    cy.get('button').click()
    cy.wait(1000)
  })
})
```

### 2. Use Appropriate Hook Type

```typescript
// ✅ Good - use before for one-time setup
describe('Database Seeding', () => {
  before(() => {
    cy.task('seedDatabase')  // Expensive operation, once is enough
  })
  
  it('test 1', () => { })
  it('test 2', () => { })
})

// ❌ Avoid - unnecessary repetition
describe('Database Seeding', () => {
  beforeEach(() => {
    cy.task('seedDatabase')  // Runs before EACH test (wasteful)
  })
})
```

### 3. Clean Up After Tests

```typescript
// ✅ Good - proper cleanup
describe('With Cleanup', () => {
  beforeEach(() => {
    cy.visit('/')
  })
  
  afterEach(() => {
    cy.clearCookies()
    cy.clearLocalStorage()
  })
})
```

### 4. Type-Safe Context

```typescript
// ✅ Good - typed context
interface MyTestContext {
  users: User[]
  token: string
}

describe('Typed Context', () => {
  beforeEach(function(this: MyTestContext) {
    this.users = []
    this.token = 'abc123'
  })
  
  it('uses context', function(this: MyTestContext) {
    expect(this.token).to.equal('abc123')
  })
})
```

## Combined Patterns

### Complete Test Setup

```typescript
interface TestSetup {
  users: User[]
  products: Product[]
  authToken: string
}

describe('Complete Test Suite', () => {
  // Suite-level setup
  before(() => {
    cy.task('resetDatabase')
    cy.task('seedDatabase')
  })
  
  // Test-level setup
  beforeEach(function(this: TestSetup) {
    // Load fixtures
    cy.fixture<User[]>('users.json').then((users) => {
      this.users = users
    })
    
    cy.fixture<Product[]>('products.json').then((products) => {
      this.products = products
    })
    
    // Login and get token
    cy.request({
      method: 'POST',
      url: '/api/login',
      body: { username: 'admin', password: 'admin' }
    }).then((response) => {
      this.authToken = response.body.token
    })
    
    // Clear state
    cy.clearCookies()
    cy.clearLocalStorage()
    
    // Navigate
    cy.visit('/')
  })
  
  // Test-level teardown
  afterEach(function() {
    if (this.currentTest?.state === 'failed') {
      cy.screenshot(`failed-${this.currentTest.title}`)
      cy.task('log', {
        test: this.currentTest.title,
        error: this.currentTest.err?.message
      })
    }
  })
  
  // Suite-level teardown
  after(() => {
    cy.task('cleanupTestData')
  })
  
  it('test with full setup', function(this: TestSetup) {
    expect(this.users).to.have.length.greaterThan(0)
    expect(this.authToken).to.exist
  })
})
```

## Summary

- Fixtures provide test data from JSON files
- `cy.fixture()` loads fixture data
- Aliases (`as()`) make fixtures reusable across tests
- TypeScript interfaces ensure fixture type safety
- `before()` runs once before all tests
- `beforeEach()` runs before each test
- `after()` runs once after all tests
- `afterEach()` runs after each test
- Hooks can be nested and scoped
- Test context provides data sharing between hooks and tests
- Fixture factories generate dynamic test data
- Proper cleanup in hooks prevents test pollution

## Next Steps

- **12 - Test Configuration**: Configure fixture folders
- **16 - Parameterization**: Data-driven testing with fixtures
- **18 - Page Object Model**: Combine fixtures with POM

## Quick Reference

```typescript
// Load fixture
cy.fixture('data.json')
cy.fixture<Type>('data.json')

// Alias
cy.fixture('data.json').as('data')
// Use: this.data or cy.get('@data')

// Hooks
before(() => { })      // Once before all
beforeEach(() => { })  // Before each test
afterEach(() => { })   // After each test
after(() => { })       // Once after all

// Typed context
interface Context { user: User }
beforeEach(function(this: Context) {
  this.user = { ... }
})
```
