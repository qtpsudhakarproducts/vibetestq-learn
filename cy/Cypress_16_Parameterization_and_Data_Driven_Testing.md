# 16 - Parameterization and Data-Driven Testing

## Introduction to Parameterization

Parameterization allows running the same test with different data sets, enabling data-driven testing. This module covers all parameterization techniques with TypeScript.

## Basic Parameterization

### Array Iteration

```typescript
describe('Basic Parameterization', () => {
  const users = ['user1', 'user2', 'user3']
  
  users.forEach((username) => {
    it(`logs in as ${username}`, () => {
      cy.visit('/login')
      cy.get('#username').type(username)
      cy.get('#password').type('password123')
      cy.get('button').click()
      cy.url().should('include', '/dashboard')
    })
  })
})
```

### Object Array Iteration

```typescript
interface UserData {
  username: string
  password: string
  expectedUrl: string
}

describe('Object Parameterization', () => {
  const testData: UserData[] = [
    { username: 'admin', password: 'admin123', expectedUrl: '/admin' },
    { username: 'user', password: 'user123', expectedUrl: '/dashboard' },
    { username: 'guest', password: 'guest123', expectedUrl: '/home' },
  ]
  
  testData.forEach((data) => {
    it(`logs in as ${data.username}`, () => {
      cy.visit('/login')
      cy.get('#username').type(data.username)
      cy.get('#password').type(data.password)
      cy.get('button').click()
      cy.url().should('include', data.expectedUrl)
    })
  })
})
```

## Fixture-Based Parameterization

### Loading Test Data from Fixtures

```typescript
// cypress/fixtures/users.json
[
  {
    "username": "user1",
    "email": "user1@example.com",
    "role": "admin"
  },
  {
    "username": "user2",
    "email": "user2@example.com",
    "role": "user"
  }
]

describe('Fixture Parameterization', () => {
  let testData: UserData[]
  
  before(() => {
    cy.fixture<UserData[]>('users.json').then((data) => {
      testData = data
    })
  })
  
  it('tests all users', () => {
    testData.forEach((user) => {
      cy.visit('/profile')
      cy.get('#username').clear().type(user.username)
      cy.get('#email').clear().type(user.email)
      cy.get('button').click()
      cy.contains(`Welcome ${user.username}`).should('be.visible')
    })
  })
})
```

### Multiple Test Cases from Fixture

```typescript
interface TestCase {
  description: string
  input: string
  expected: string
}

describe('Test Cases from Fixture', () => {
  let testCases: TestCase[]
  
  before(() => {
    cy.fixture<TestCase[]>('search-test-cases.json').then((cases) => {
      testCases = cases
    })
  })
  
  beforeEach(() => {
    cy.visit('/search')
  })
  
  it('runs all test cases', () => {
    testCases.forEach((testCase) => {
      cy.log(`Testing: ${testCase.description}`)
      cy.get('#search').clear().type(testCase.input)
      cy.get('button').click()
      cy.get('.result').should('contain', testCase.expected)
    })
  })
})
```

## CSV Data

### Reading CSV Files

```typescript
// cypress/support/csv-parser.ts
import * as Papa from 'papaparse'
import * as fs from 'fs'

export function parseCSV<T>(filePath: string): Promise<T[]> {
  return new Promise((resolve, reject) => {
    const csvContent = fs.readFileSync(filePath, 'utf-8')
    
    Papa.parse<T>(csvContent, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data)
      },
      error: (error) => {
        reject(error)
      }
    })
  })
}

// cypress.config.ts
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        async parseCSV(filePath: string) {
          return parseCSV(filePath)
        }
      })
      
      return config
    }
  }
})

// In tests
describe('CSV Parameterization', () => {
  let testData: any[]
  
  before(() => {
    cy.task('parseCSV', 'cypress/fixtures/users.csv')
      .then((data: any) => {
        testData = data
      })
  })
  
  it('tests with CSV data', () => {
    testData.forEach((row) => {
      cy.visit('/form')
      cy.get('#name').type(row.name)
      cy.get('#email').type(row.email)
      cy.get('button').click()
    })
  })
})
```

## Type-Safe Parameterization

### Generic Test Runner

```typescript
interface TestData<T> {
  description: string
  data: T
  expected: any
}

class ParameterizedTest<T> {
  constructor(private testCases: TestData<T>[]) {}
  
  run(testFunction: (data: T, expected: any) => void): void {
    this.testCases.forEach((testCase) => {
      it(testCase.description, () => {
        testFunction(testCase.data, testCase.expected)
      })
    })
  }
}

// Usage
interface LoginData {
  username: string
  password: string
}

describe('Type-Safe Parameterized Tests', () => {
  const testCases: TestData<LoginData>[] = [
    {
      description: 'Admin login',
      data: { username: 'admin', password: 'admin123' },
      expected: { url: '/admin', role: 'admin' }
    },
    {
      description: 'User login',
      data: { username: 'user', password: 'user123' },
      expected: { url: '/dashboard', role: 'user' }
    }
  ]
  
  const paramTest = new ParameterizedTest(testCases)
  
  paramTest.run((data, expected) => {
    cy.visit('/login')
    cy.get('#username').type(data.username)
    cy.get('#password').type(data.password)
    cy.get('button').click()
    cy.url().should('include', expected.url)
  })
})
```

### Data Provider Pattern

```typescript
type DataProvider<T> = () => T[]

function parameterized<T>(
  dataProvider: DataProvider<T>,
  testFunction: (data: T, index: number) => void
): void {
  const data = dataProvider()
  
  data.forEach((item, index) => {
    testFunction(item, index)
  })
}

// Data providers
const validEmails: DataProvider<string> = () => [
  'test@example.com',
  'user.name@example.com',
  'user+tag@example.com'
]

const invalidEmails: DataProvider<string> = () => [
  'invalid',
  '@example.com',
  'user@',
  'user@.com'
]

describe('Email Validation', () => {
  it('accepts valid emails', () => {
    parameterized(validEmails, (email) => {
      cy.visit('/register')
      cy.get('#email').clear().type(email)
      cy.get('#email').should('not.have.class', 'error')
    })
  })
  
  it('rejects invalid emails', () => {
    parameterized(invalidEmails, (email) => {
      cy.visit('/register')
      cy.get('#email').clear().type(email)
      cy.get('#email').blur()
      cy.get('.error-message').should('be.visible')
    })
  })
})
```

## Dynamic Test Generation

### Creating Tests Dynamically

```typescript
interface DynamicTestConfig {
  browsers: string[]
  viewports: Array<{ width: number; height: number }>
  users: Array<{ username: string; role: string }>
}

const config: DynamicTestConfig = {
  browsers: ['chrome', 'firefox'],
  viewports: [
    { width: 1920, height: 1080 },
    { width: 1366, height: 768 },
    { width: 375, height: 667 }
  ],
  users: [
    { username: 'admin', role: 'admin' },
    { username: 'user', role: 'user' }
  ]
}

// Generate tests for all combinations
config.viewports.forEach((viewport) => {
  config.users.forEach((user) => {
    describe(`${user.role} at ${viewport.width}x${viewport.height}`, () => {
      beforeEach(() => {
        cy.viewport(viewport.width, viewport.height)
      })
      
      it('can navigate dashboard', () => {
        cy.visit('/login')
        cy.get('#username').type(user.username)
        cy.get('button').click()
        cy.get('.dashboard').should('be.visible')
      })
    })
  })
})
```

## Environment-Based Parameterization

```typescript
interface EnvironmentConfig {
  baseUrl: string
  apiUrl: string
  credentials: {
    username: string
    password: string
  }
}

const environments: Record<string, EnvironmentConfig> = {
  dev: {
    baseUrl: 'https://dev.example.com',
    apiUrl: 'https://api-dev.example.com',
    credentials: { username: 'dev-user', password: 'dev-pass' }
  },
  staging: {
    baseUrl: 'https://staging.example.com',
    apiUrl: 'https://api-staging.example.com',
    credentials: { username: 'staging-user', password: 'staging-pass' }
  }
}

describe('Environment Parameterization', () => {
  const env = Cypress.env('ENVIRONMENT') || 'dev'
  const config = environments[env]
  
  beforeEach(() => {
    cy.visit(config.baseUrl)
  })
  
  it('tests with environment config', () => {
    cy.get('#username').type(config.credentials.username)
    cy.get('#password').type(config.credentials.password)
    cy.get('button').click()
  })
})
```

## Excel/XLSX Data

```typescript
// Using xlsx library
import * as XLSX from 'xlsx'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        parseXLSX(filePath: string) {
          const workbook = XLSX.readFile(filePath)
          const sheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[sheetName]
          const data = XLSX.utils.sheet_to_json(worksheet)
          return data
        }
      })
      
      return config
    }
  }
})

// In tests
describe('Excel Data', () => {
  let testData: any[]
  
  before(() => {
    cy.task('parseXLSX', 'cypress/fixtures/test-data.xlsx')
      .then((data: any) => {
        testData = data
      })
  })
  
  it('runs tests from Excel', () => {
    testData.forEach((row) => {
      cy.visit('/form')
      Object.keys(row).forEach((key) => {
        cy.get(`#${key}`).type(row[key])
      })
      cy.get('button').click()
    })
  })
})
```

## API-Driven Test Data

```typescript
interface ApiTestData {
  id: string
  name: string
  email: string
}

describe('API-Driven Data', () => {
  let testUsers: ApiTestData[]
  
  before(() => {
    cy.request<ApiTestData[]>('GET', '/api/test-users')
      .then((response) => {
        testUsers = response.body
      })
  })
  
  testUsers?.forEach((user) => {
    it(`tests user ${user.id}`, () => {
      cy.visit(`/user/${user.id}`)
      cy.get('.user-name').should('contain', user.name)
      cy.get('.user-email').should('contain', user.email)
    })
  })
})
```

## Parameterization Helper

```typescript
class TestDataHelper {
  static fromFixture<T>(fixtureName: string): Cypress.Chainable<T[]> {
    return cy.fixture<T[]>(fixtureName)
  }
  
  static fromCSV(filePath: string): Cypress.Chainable<any[]> {
    return cy.task('parseCSV', filePath)
  }
  
  static fromAPI<T>(endpoint: string): Cypress.Chainable<T[]> {
    return cy.request<T[]>(endpoint).its('body')
  }
  
  static fromArray<T>(data: T[]): T[] {
    return data
  }
  
  static runParameterized<T>(
    data: T[],
    testFn: (item: T, index: number) => void
  ): void {
    data.forEach((item, index) => {
      testFn(item, index)
    })
  }
}

describe('Test Data Helper', () => {
  it('loads from fixture', () => {
    TestDataHelper.fromFixture<User>('users').then((users) => {
      TestDataHelper.runParameterized(users, (user) => {
        cy.visit('/profile')
        cy.get('#username').type(user.username)
      })
    })
  })
})
```

## Nested Parameterization

```typescript
interface TestMatrix {
  browsers: string[]
  viewports: string[]
  users: string[]
}

const matrix: TestMatrix = {
  browsers: ['chrome', 'firefox'],
  viewports: ['desktop', 'mobile'],
  users: ['admin', 'user']
}

matrix.browsers.forEach((browser) => {
  describe(`Browser: ${browser}`, () => {
    matrix.viewports.forEach((viewport) => {
      describe(`Viewport: ${viewport}`, () => {
        matrix.users.forEach((user) => {
          it(`User: ${user}`, () => {
            if (viewport === 'mobile') {
              cy.viewport('iphone-x')
            } else {
              cy.viewport(1920, 1080)
            }
            
            cy.visit('/login')
            cy.get('#username').type(user)
            cy.get('button').click()
          })
        })
      })
    })
  })
})
```

## Data Builders

```typescript
class UserBuilder {
  private user: Partial<User> = {}
  
  withUsername(username: string): this {
    this.user.username = username
    return this
  }
  
  withEmail(email: string): this {
    this.user.email = email
    return this
  }
  
  withRole(role: 'admin' | 'user' | 'guest'): this {
    this.user.role = role
    return this
  }
  
  build(): User {
    return {
      id: `user-${Date.now()}`,
      username: this.user.username || 'defaultuser',
      email: this.user.email || 'default@example.com',
      password: 'password123',
      role: this.user.role || 'user'
    }
  }
  
  buildMany(count: number): User[] {
    return Array.from({ length: count }, () => this.build())
  }
}

describe('Data Builders', () => {
  it('creates users with builder', () => {
    const users = [
      new UserBuilder().withUsername('admin').withRole('admin').build(),
      new UserBuilder().withUsername('user1').withRole('user').build(),
      new UserBuilder().withUsername('guest').withRole('guest').build()
    ]
    
    users.forEach((user) => {
      cy.visit('/register')
      cy.get('#username').type(user.username)
      cy.get('#email').type(user.email)
      cy.get('button').click()
    })
  })
})
```

## Best Practices

### 1. Use Descriptive Test Names

```typescript
// ✅ Good - clear what's being tested
testData.forEach((data) => {
  it(`should validate email: ${data.email} (expected: ${data.valid})`, () => {
    // test
  })
})

// ❌ Avoid - unclear
testData.forEach((data, index) => {
  it(`test ${index}`, () => {
    // test
  })
})
```

### 2. Keep Data Organized

```typescript
// ✅ Good - organized data structure
interface TestData {
  description: string
  input: LoginCredentials
  expected: ExpectedResult
}

// ❌ Avoid - unstructured arrays
const data = [
  ['user1', 'pass1', '/dashboard'],
  ['user2', 'pass2', '/home']
]
```

### 3. Validate Test Data

```typescript
// ✅ Good - validate before use
before(() => {
  cy.fixture<User[]>('users').then((users) => {
    users.forEach((user) => {
      expect(user).to.have.property('username')
      expect(user).to.have.property('email')
    })
    testData = users
  })
})
```

### 4. Type-Safe Parameters

```typescript
// ✅ Good - type-safe
interface TestCase {
  input: string
  expected: number
}

const testCases: TestCase[] = [
  { input: '1+1', expected: 2 }
]

// ❌ Avoid - no types
const testCases = [
  ['1+1', 2]
]
```

## Summary

- Parameterization enables data-driven testing
- Multiple data sources: arrays, fixtures, CSV, Excel, APIs
- TypeScript ensures type-safe parameterization
- forEach creates separate test for each data item
- Data providers separate data from test logic
- Builders create complex test data dynamically
- Nested parameterization tests multiple dimensions
- Keep test names descriptive and data organized
- Validate test data before use

## Next Steps

- **14 - Fixtures and Hooks**: Loading fixture data
- **18 - Page Object Model**: Parameterized page objects
- **19 - API Testing**: API-driven test data

## Quick Reference

```typescript
// Basic parameterization
const data = ['test1', 'test2']
data.forEach(item => {
  it(`tests ${item}`, () => { })
})

// Fixture data
cy.fixture<Type[]>('data').then(items => {
  items.forEach(item => { })
})

// Type-safe
interface TestCase { input: string; expected: string }
const cases: TestCase[] = [...]
cases.forEach(tc => {
  it(`${tc.input} -> ${tc.expected}`, () => { })
})

// CSV
cy.task('parseCSV', 'file.csv').then(data => { })

// Builder
new UserBuilder()
  .withUsername('test')
  .withRole('admin')
  .build()
```
