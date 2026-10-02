# 19 - API Testing with Cypress

## Introduction to API Testing

Cypress excels at API testing with its `cy.request()` command. This module covers REST API testing, GraphQL, authentication, and combining API calls with UI testing using TypeScript.

## cy.request() Basics

### Simple GET Request

```typescript
describe('Basic API Requests', () => {
  it('makes GET request', () => {
    cy.request('GET', '/api/users')
      .its('status')
      .should('eq', 200)
  })
  
  it('verifies response body', () => {
    cy.request('/api/users/1')
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.have.property('id', 1)
        expect(response.body).to.have.property('name')
      })
  })
})
```

### Type-Safe API Requests

```typescript
interface User {
  id: number
  name: string
  email: string
  role: 'admin' | 'user'
}

describe('Type-Safe API Testing', () => {
  it('tests with typed response', () => {
    cy.request<User>('GET', '/api/users/1')
      .then((response) => {
        const user = response.body
        
        expect(user.id).to.be.a('number')
        expect(user.name).to.be.a('string')
        expect(user.email).to.include('@')
        expect(user.role).to.be.oneOf(['admin', 'user'])
      })
  })
  
  it('validates user array', () => {
    cy.request<User[]>('GET', '/api/users')
      .then((response) => {
        expect(response.body).to.be.an('array')
        
        response.body.forEach((user) => {
          expect(user).to.have.all.keys('id', 'name', 'email', 'role')
        })
      })
  })
})
```

## Request Methods

### POST Requests

```typescript
describe('POST Requests', () => {
  it('creates new resource', () => {
    const newUser = {
      name: 'John Doe',
      email: 'john@example.com',
      role: 'user'
    }
    
    cy.request('POST', '/api/users', newUser)
      .then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body).to.have.property('id')
        expect(response.body.name).to.eq(newUser.name)
      })
  })
  
  it('sends JSON data', () => {
    cy.request({
      method: 'POST',
      url: '/api/users',
      body: {
        name: 'Jane Doe',
        email: 'jane@example.com'
      },
      headers: {
        'Content-Type': 'application/json'
      }
    }).its('status').should('eq', 201)
  })
})
```

### PUT/PATCH Requests

```typescript
describe('Update Requests', () => {
  it('updates resource with PUT', () => {
    cy.request('PUT', '/api/users/1', {
      name: 'Updated Name',
      email: 'updated@example.com'
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.name).to.eq('Updated Name')
    })
  })
  
  it('partially updates with PATCH', () => {
    cy.request('PATCH', '/api/users/1', {
      email: 'newemail@example.com'
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body.email).to.eq('newemail@example.com')
    })
  })
})
```

### DELETE Requests

```typescript
describe('DELETE Requests', () => {
  it('deletes resource', () => {
    cy.request('DELETE', '/api/users/1')
      .its('status')
      .should('eq', 204)
  })
  
  it('verifies deletion', () => {
    cy.request('DELETE', '/api/users/1')
    
    cy.request({
      url: '/api/users/1',
      failOnStatusCode: false
    }).its('status').should('eq', 404)
  })
})
```

## Request Configuration

### Headers and Authentication

```typescript
describe('Headers and Auth', () => {
  it('sends custom headers', () => {
    cy.request({
      url: '/api/users',
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'value'
      }
    })
  })
  
  it('uses basic auth', () => {
    cy.request({
      url: '/api/protected',
      auth: {
        username: 'admin',
        password: 'secret'
      }
    })
  })
  
  it('sends bearer token', () => {
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
    
    cy.request({
      url: '/api/users',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  })
})
```

### Query Parameters

```typescript
describe('Query Parameters', () => {
  it('sends query params', () => {
    cy.request({
      url: '/api/users',
      qs: {
        page: 1,
        limit: 10,
        sort: 'name',
        filter: 'active'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
    })
  })
})
```

### Timeout and Retries

```typescript
describe('Timeout Configuration', () => {
  it('sets custom timeout', () => {
    cy.request({
      url: '/api/slow-endpoint',
      timeout: 30000  // 30 seconds
    })
  })
  
  it('retries failed request', () => {
    cy.request({
      url: '/api/flaky',
      retryOnStatusCodeFailure: true,
      retryOnNetworkFailure: true
    })
  })
})
```

## Type-Safe API Client

### Creating API Client Class

```typescript
// cypress/support/api/ApiClient.ts
interface RequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  headers?: Record<string, string>
  body?: any
  qs?: Record<string, any>
}

export class ApiClient {
  private baseUrl: string
  private defaultHeaders: Record<string, string>
  
  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    }
  }
  
  setAuthToken(token: string): this {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`
    return this
  }
  
  request<T = any>(
    endpoint: string,
    config: RequestConfig = {}
  ): Cypress.Chainable<Cypress.Response<T>> {
    return cy.request<T>({
      method: config.method || 'GET',
      url: `${this.baseUrl}${endpoint}`,
      headers: { ...this.defaultHeaders, ...config.headers },
      body: config.body,
      qs: config.qs
    })
  }
  
  get<T = any>(
    endpoint: string,
    qs?: Record<string, any>
  ): Cypress.Chainable<Cypress.Response<T>> {
    return this.request<T>(endpoint, { method: 'GET', qs })
  }
  
  post<T = any>(
    endpoint: string,
    body: any
  ): Cypress.Chainable<Cypress.Response<T>> {
    return this.request<T>(endpoint, { method: 'POST', body })
  }
  
  put<T = any>(
    endpoint: string,
    body: any
  ): Cypress.Chainable<Cypress.Response<T>> {
    return this.request<T>(endpoint, { method: 'PUT', body })
  }
  
  patch<T = any>(
    endpoint: string,
    body: any
  ): Cypress.Chainable<Cypress.Response<T>> {
    return this.request<T>(endpoint, { method: 'PATCH', body })
  }
  
  delete<T = any>(
    endpoint: string
  ): Cypress.Chainable<Cypress.Response<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// Usage
describe('API Client Tests', () => {
  const api = new ApiClient('/api')
  
  before(() => {
    api.setAuthToken('token123')
  })
  
  it('uses typed API client', () => {
    api.get<User[]>('/users')
      .then((response) => {
        expect(response.status).to.eq(200)
        expect(response.body).to.be.an('array')
      })
  })
  
  it('creates user', () => {
    const newUser = {
      name: 'Test User',
      email: 'test@example.com'
    }
    
    api.post<User>('/users', newUser)
      .then((response) => {
        expect(response.status).to.eq(201)
        expect(response.body.id).to.exist
      })
  })
})
```

## Response Validation

### Schema Validation

```typescript
interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    total: number
  }
}

describe('Response Validation', () => {
  it('validates response structure', () => {
    cy.request<ApiResponse<User[]>>('/api/users')
      .then((response) => {
        expect(response.body).to.have.property('data')
        expect(response.body).to.have.property('meta')
        expect(response.body.meta).to.have.all.keys('page', 'total')
      })
  })
  
  it('validates with custom matcher', () => {
    cy.request('/api/users/1').should((response) => {
      expect(response.status).to.eq(200)
      expect(response.headers['content-type']).to.include('application/json')
      expect(response.duration).to.be.lessThan(500)
    })
  })
})
```

### Error Handling

```typescript
describe('Error Handling', () => {
  it('handles 404 errors', () => {
    cy.request({
      url: '/api/users/99999',
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(404)
      expect(response.body).to.have.property('error')
    })
  })
  
  it('handles validation errors', () => {
    cy.request({
      method: 'POST',
      url: '/api/users',
      body: { invalid: 'data' },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400)
      expect(response.body.errors).to.be.an('array')
    })
  })
})
```

## Combining API and UI Testing

### Setup via API, Test UI

```typescript
describe('Combined API and UI', () => {
  let userId: number
  
  before(() => {
    // Create user via API
    cy.request('POST', '/api/users', {
      name: 'Test User',
      email: 'test@example.com'
    }).then((response) => {
      userId = response.body.id
    })
  })
  
  it('tests UI with API-created data', () => {
    cy.visit(`/users/${userId}`)
    cy.contains('Test User').should('be.visible')
  })
  
  after(() => {
    // Cleanup via API
    cy.request('DELETE', `/api/users/${userId}`)
  })
})
```

### Verify UI Changes via API

```typescript
describe('UI to API Verification', () => {
  it('updates via UI, verifies via API', () => {
    cy.visit('/users/1/edit')
    cy.get('#name').clear().type('Updated Name')
    cy.get('button[type="submit"]').click()
    
    // Verify via API
    cy.request<User>('/api/users/1')
      .its('body.name')
      .should('eq', 'Updated Name')
  })
})
```

## GraphQL Testing

### GraphQL Queries

```typescript
describe('GraphQL Testing', () => {
  it('executes GraphQL query', () => {
    const query = `
      query GetUser($id: ID!) {
        user(id: $id) {
          id
          name
          email
        }
      }
    `
    
    cy.request({
      method: 'POST',
      url: '/graphql',
      body: {
        query,
        variables: { id: '1' }
      }
    }).then((response) => {
      expect(response.body.data.user).to.exist
      expect(response.body.data.user.id).to.eq('1')
    })
  })
  
  it('executes GraphQL mutation', () => {
    const mutation = `
      mutation CreateUser($input: CreateUserInput!) {
        createUser(input: $input) {
          id
          name
          email
        }
      }
    `
    
    cy.request({
      method: 'POST',
      url: '/graphql',
      body: {
        query: mutation,
        variables: {
          input: {
            name: 'New User',
            email: 'new@example.com'
          }
        }
      }
    }).then((response) => {
      expect(response.body.data.createUser).to.exist
    })
  })
})
```

## API Test Patterns

### CRUD Operations

```typescript
describe('Complete CRUD Flow', () => {
  let createdId: number
  
  it('creates resource', () => {
    cy.request('POST', '/api/products', {
      name: 'Test Product',
      price: 99.99
    }).then((response) => {
      expect(response.status).to.eq(201)
      createdId = response.body.id
    })
  })
  
  it('reads resource', () => {
    cy.request(`/api/products/${createdId}`)
      .its('body.name')
      .should('eq', 'Test Product')
  })
  
  it('updates resource', () => {
    cy.request('PUT', `/api/products/${createdId}`, {
      name: 'Updated Product',
      price: 149.99
    }).its('status').should('eq', 200)
  })
  
  it('deletes resource', () => {
    cy.request('DELETE', `/api/products/${createdId}`)
      .its('status')
      .should('eq', 204)
  })
})
```

### Data Fixtures for API

```typescript
// cypress/fixtures/api/users.ts
export const validUser = {
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
}

export const adminUser = {
  name: 'Admin User',
  email: 'admin@example.com',
  role: 'admin'
}

// In tests
import { validUser, adminUser } from '../fixtures/api/users'

describe('User API Tests', () => {
  it('creates regular user', () => {
    cy.request('POST', '/api/users', validUser)
      .its('status')
      .should('eq', 201)
  })
  
  it('creates admin user', () => {
    cy.request('POST', '/api/users', adminUser)
      .its('status')
      .should('eq', 201)
  })
})
```

## Performance Testing

### Response Time Assertions

```typescript
describe('API Performance', () => {
  it('responds within acceptable time', () => {
    cy.request('/api/users').should((response) => {
      expect(response.duration).to.be.lessThan(500)
    })
  })
  
  it('measures multiple endpoints', () => {
    const endpoints = ['/api/users', '/api/products', '/api/orders']
    
    endpoints.forEach((endpoint) => {
      cy.request(endpoint).should((response) => {
        expect(response.duration).to.be.lessThan(1000)
        cy.log(`${endpoint}: ${response.duration}ms`)
      })
    })
  })
})
```

## Best Practices

### 1. Use Type-Safe Responses

```typescript
// ✅ Good - typed response
cy.request<User[]>('/api/users').then((response) => {
  const users = response.body
  users.forEach(user => {
    expect(user.id).to.be.a('number')
  })
})

// ❌ Avoid - untyped
cy.request('/api/users').then((response: any) => {
  // No type safety
})
```

### 2. Separate API and UI Tests

```typescript
// ✅ Good - organized
describe('API Tests', () => {
  // Pure API tests
})

describe('UI Tests', () => {
  // UI tests with API setup
})

// ❌ Avoid - mixed
describe('Tests', () => {
  it('api test', () => { })
  it('ui test', () => { })
})
```

### 3. Reuse API Client

```typescript
// ✅ Good - centralized client
const api = new ApiClient()
describe('Tests', () => {
  it('test 1', () => api.get('/users'))
  it('test 2', () => api.post('/users', data))
})

// ❌ Avoid - repeated configuration
describe('Tests', () => {
  it('test 1', () => {
    cy.request({ url: '/users', headers: {...} })
  })
})
```

## Summary

- `cy.request()` enables comprehensive API testing
- TypeScript provides type-safe API responses
- Combine API and UI testing for efficiency
- Custom API client centralizes configuration
- GraphQL testing supported with POST requests
- Validate response structure and performance
- Use API for test setup and teardown
- Keep API tests separate from UI tests
- Handle errors with `failOnStatusCode: false`
- Test complete CRUD operations

## Next Steps

- **20 - Network Mocking**: Stub API responses
- **21 - Authentication**: API authentication patterns
- **18 - Page Object Model**: Combine with POM

## Quick Reference

```typescript
// Basic request
cy.request('GET', '/api/users')
  .its('status')
  .should('eq', 200)

// Typed request
cy.request<User>('/api/users/1')
  .then(response => {
    expect(response.body.name).to.exist
  })

// POST with body
cy.request('POST', '/api/users', {
  name: 'User',
  email: 'user@example.com'
})

// With headers
cy.request({
  url: '/api/users',
  headers: {
    'Authorization': 'Bearer token'
  }
})

// API Client
const api = new ApiClient('/api')
api.get<User[]>('/users')
api.post<User>('/users', userData)
```
