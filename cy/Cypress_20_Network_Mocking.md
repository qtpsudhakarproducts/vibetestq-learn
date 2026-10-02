# 20 - Network Mocking and Interception

## Introduction to Network Mocking

Cypress's `cy.intercept()` allows you to stub, spy on, and modify network requests and responses. This enables testing without backend dependencies and simulating edge cases. This module covers comprehensive network mocking with TypeScript.

## cy.intercept() Basics

### Simple Interception

```typescript
describe('Basic Interception', () => {
  it('intercepts GET request', () => {
    cy.intercept('GET', '/api/users').as('getUsers')
    
    cy.visit('/users')
    cy.wait('@getUsers')
      .its('response.statusCode')
      .should('eq', 200)
  })
  
  it('intercepts with pattern', () => {
    cy.intercept('/api/**').as('apiCalls')
    cy.visit('/')
    cy.wait('@apiCalls')
  })
})
```

### Stubbing Responses

```typescript
describe('Stubbing', () => {
  it('stubs API response', () => {
    cy.intercept('GET', '/api/users', {
      statusCode: 200,
      body: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' }
      ]
    }).as('getUsers')
    
    cy.visit('/users')
    cy.get('.user-item').should('have.length', 2)
  })
  
  it('stubs with fixture', () => {
    cy.intercept('GET', '/api/users', {
      fixture: 'users.json'
    })
  })
})
```

## Type-Safe Interception

### Typed Responses

```typescript
interface User {
  id: number
  name: string
  email: string
}

interface ApiResponse<T> {
  data: T
  meta: {
    page: number
    total: number
  }
}

describe('Type-Safe Interception', () => {
  it('intercepts with types', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'John', email: 'john@example.com' },
      { id: 2, name: 'Jane', email: 'jane@example.com' }
    ]
    
    cy.intercept<User[]>('GET', '/api/users', {
      body: mockUsers
    }).as('getUsers')
    
    cy.visit('/users')
    cy.wait('@getUsers').then((interception) => {
      expect(interception.response?.body).to.deep.equal(mockUsers)
    })
  })
  
  it('intercepts paginated response', () => {
    const mockResponse: ApiResponse<User[]> = {
      data: [
        { id: 1, name: 'User 1', email: 'user1@example.com' }
      ],
      meta: {
        page: 1,
        total: 10
      }
    }
    
    cy.intercept<ApiResponse<User[]>>('GET', '/api/users', {
      body: mockResponse
    })
  })
})
```

## Request Matching

### URL Patterns

```typescript
describe('URL Matching', () => {
  it('matches exact URL', () => {
    cy.intercept('GET', '/api/users').as('exact')
  })
  
  it('matches with wildcards', () => {
    cy.intercept('GET', '/api/users/*').as('wildcard')
    cy.intercept('GET', '/api/**').as('allApi')
  })
  
  it('matches with regex', () => {
    cy.intercept('GET', /\/api\/users\/\d+/).as('userId')
  })
  
  it('matches query parameters', () => {
    cy.intercept({
      method: 'GET',
      url: '/api/users',
      query: {
        page: '1',
        limit: '10'
      }
    }).as('pagedRequest')
  })
})
```

### Method and Headers Matching

```typescript
describe('Advanced Matching', () => {
  it('matches specific method', () => {
    cy.intercept({
      method: 'POST',
      url: '/api/users'
    }).as('createUser')
  })
  
  it('matches headers', () => {
    cy.intercept({
      method: 'GET',
      url: '/api/users',
      headers: {
        'Authorization': /Bearer .*/
      }
    }).as('authenticatedRequest')
  })
  
  it('matches request body', () => {
    cy.intercept({
      method: 'POST',
      url: '/api/users',
      body: {
        role: 'admin'
      }
    }).as('createAdmin')
  })
})
```

## Response Manipulation

### Modifying Responses

```typescript
describe('Response Modification', () => {
  it('modifies response body', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.continue((res) => {
        res.body = res.body.map((user: User) => ({
          ...user,
          name: user.name.toUpperCase()
        }))
      })
    })
  })
  
  it('adds response headers', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.continue((res) => {
        res.headers['x-custom-header'] = 'custom-value'
      })
    })
  })
  
  it('changes status code', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.continue((res) => {
        res.statusCode = 500
      })
    })
  })
})
```

### Request Modification

```typescript
describe('Request Modification', () => {
  it('modifies request headers', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.headers['x-custom-header'] = 'modified'
      req.continue()
    })
  })
  
  it('modifies request body', () => {
    cy.intercept('POST', '/api/users', (req) => {
      req.body = {
        ...req.body,
        timestamp: new Date().toISOString()
      }
      req.continue()
    })
  })
})
```

## Simulating Network Conditions

### Delays

```typescript
describe('Network Delays', () => {
  it('adds delay to response', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.continue((res) => {
        res.delay = 2000  // 2 second delay
      })
    })
    
    cy.visit('/users')
    cy.get('.loading').should('be.visible')
    cy.get('.user-item', { timeout: 3000 }).should('exist')
  })
  
  it('simulates slow network', () => {
    cy.intercept('GET', '/api/**', (req) => {
      req.continue((res) => {
        res.delay = 1000
        res.throttleKbps = 100  // Throttle to 100 Kbps
      })
    })
  })
})
```

### Errors and Failures

```typescript
describe('Error Simulation', () => {
  it('simulates 404 error', () => {
    cy.intercept('GET', '/api/users/999', {
      statusCode: 404,
      body: {
        message: 'User not found'
      }
    })
    
    cy.visit('/users/999')
    cy.get('.error-message').should('contain', 'not found')
  })
  
  it('simulates 500 error', () => {
    cy.intercept('GET', '/api/users', {
      statusCode: 500,
      body: {
        error: 'Internal Server Error'
      }
    })
  })
  
  it('simulates network failure', () => {
    cy.intercept('GET', '/api/users', {
      forceNetworkError: true
    })
    
    cy.visit('/users')
    cy.get('.network-error').should('be.visible')
  })
})
```

## Dynamic Responses

### Conditional Responses

```typescript
describe('Conditional Responses', () => {
  it('returns different data based on request', () => {
    cy.intercept('GET', '/api/users/*', (req) => {
      const userId = req.url.split('/').pop()
      
      if (userId === '1') {
        req.reply({
          body: { id: 1, name: 'Admin', role: 'admin' }
        })
      } else {
        req.reply({
          body: { id: parseInt(userId!), name: 'User', role: 'user' }
        })
      }
    })
  })
  
  it('handles query parameters', () => {
    cy.intercept('GET', '/api/users*', (req) => {
      const url = new URL(req.url)
      const page = url.searchParams.get('page') || '1'
      
      req.reply({
        body: {
          data: generateUsers(parseInt(page)),
          page: parseInt(page)
        }
      })
    })
  })
})

function generateUsers(page: number): User[] {
  return Array.from({ length: 10 }, (_, i) => ({
    id: (page - 1) * 10 + i + 1,
    name: `User ${(page - 1) * 10 + i + 1}`,
    email: `user${(page - 1) * 10 + i + 1}@example.com`
  }))
}
```

## Spying on Requests

### Request Inspection

```typescript
describe('Request Spying', () => {
  it('spies on request without stubbing', () => {
    cy.intercept('POST', '/api/users').as('createUser')
    
    cy.visit('/register')
    cy.get('#name').type('Test User')
    cy.get('#email').type('test@example.com')
    cy.get('button').click()
    
    cy.wait('@createUser').then((interception) => {
      expect(interception.request.body).to.deep.include({
        name: 'Test User',
        email: 'test@example.com'
      })
    })
  })
  
  it('verifies request headers', () => {
    cy.intercept('GET', '/api/users').as('getUsers')
    
    cy.visit('/users')
    cy.wait('@getUsers').then((interception) => {
      expect(interception.request.headers).to.have.property('accept')
    })
  })
})
```

## Type-Safe Network Helper

```typescript
// cypress/support/network-helper.ts
export class NetworkHelper {
  static mockGetRequest<T>(url: string, body: T, alias?: string): void {
    const config: any = {
      method: 'GET',
      url,
      body
    }
    
    const intercept = cy.intercept(config)
    if (alias) {
      intercept.as(alias)
    }
  }
  
  static mockPostRequest<T>(url: string, response: T, statusCode: number = 201): void {
    cy.intercept('POST', url, {
      statusCode,
      body: response
    })
  }
  
  static mockError(url: string, statusCode: number, message: string): void {
    cy.intercept(url, {
      statusCode,
      body: { error: message }
    })
  }
  
  static mockDelay(url: string, delay: number): void {
    cy.intercept(url, (req) => {
      req.continue((res) => {
        res.delay = delay
      })
    })
  }
  
  static spyOnRequest(method: string, url: string, alias: string): void {
    cy.intercept(method, url).as(alias)
  }
}

// Usage
describe('Network Helper', () => {
  it('uses helper methods', () => {
    const mockUsers: User[] = [
      { id: 1, name: 'User 1', email: 'user1@example.com' }
    ]
    
    NetworkHelper.mockGetRequest('/api/users', mockUsers, 'getUsers')
    NetworkHelper.mockError('/api/error', 500, 'Server Error')
    NetworkHelper.mockDelay('/api/slow', 2000)
  })
})
```

## Fixture-Based Mocking

### Using Fixtures

```typescript
describe('Fixture Mocking', () => {
  it('uses fixture for response', () => {
    cy.intercept('GET', '/api/users', {
      fixture: 'users.json'
    }).as('getUsers')
    
    cy.visit('/users')
    cy.wait('@getUsers')
  })
  
  it('uses multiple fixtures', () => {
    cy.intercept('GET', '/api/users', { fixture: 'users.json' })
    cy.intercept('GET', '/api/products', { fixture: 'products.json' })
    cy.intercept('GET', '/api/orders', { fixture: 'orders.json' })
  })
  
  it('uses fixture with modifications', () => {
    cy.fixture('users.json').then((users) => {
      const modifiedUsers = users.map((u: User) => ({
        ...u,
        active: true
      }))
      
      cy.intercept('GET', '/api/users', {
        body: modifiedUsers
      })
    })
  })
})
```

## Testing Edge Cases

### Empty States

```typescript
describe('Empty States', () => {
  it('tests empty list', () => {
    cy.intercept('GET', '/api/users', {
      body: []
    })
    
    cy.visit('/users')
    cy.get('.empty-state').should('be.visible')
    cy.get('.user-item').should('not.exist')
  })
  
  it('tests null response', () => {
    cy.intercept('GET', '/api/user/1', {
      body: null
    })
  })
})
```

### Large Data Sets

```typescript
describe('Large Data', () => {
  it('handles large response', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`
    }))
    
    cy.intercept('GET', '/api/users', {
      body: largeDataset
    })
    
    cy.visit('/users')
    // Test pagination or virtualization
  })
})
```

### Race Conditions

```typescript
describe('Race Conditions', () => {
  it('handles concurrent requests', () => {
    cy.intercept('GET', '/api/users', (req) => {
      req.continue((res) => {
        res.delay = Math.random() * 1000
      })
    }).as('users')
    
    cy.intercept('GET', '/api/products', (req) => {
      req.continue((res) => {
        res.delay = Math.random() * 1000
      })
    }).as('products')
    
    cy.visit('/dashboard')
    cy.wait(['@users', '@products'])
  })
})
```

## Best Practices

### 1. Use Aliases

```typescript
// ✅ Good - with alias
cy.intercept('GET', '/api/users').as('getUsers')
cy.wait('@getUsers')

// ❌ Avoid - no alias
cy.intercept('GET', '/api/users')
cy.wait(1000)  // Arbitrary wait
```

### 2. Type Your Responses

```typescript
// ✅ Good - typed
interface User { id: number; name: string }
cy.intercept<User[]>('GET', '/api/users', {
  body: [{ id: 1, name: 'Test' }]
})

// ❌ Avoid - untyped
cy.intercept('GET', '/api/users', {
  body: [{ id: 1, name: 'Test' }]
})
```

### 3. Centralize Mocks

```typescript
// ✅ Good - reusable mocks
class ApiMocks {
  static mockUsers(users: User[]) {
    cy.intercept('GET', '/api/users', { body: users })
  }
  
  static mockError(url: string) {
    cy.intercept(url, { statusCode: 500 })
  }
}

// ❌ Avoid - scattered mocks
cy.intercept('GET', '/api/users', ...)
cy.intercept('GET', '/api/users', ...)  // Duplicated
```

### 4. Clean Intercepts

```typescript
// ✅ Good - clear between tests
beforeEach(() => {
  cy.intercept('/api/**').as('api')
})

// Intercepts are automatically cleared between tests
```

## Advanced Patterns

### Sequential Responses

```typescript
describe('Sequential Responses', () => {
  it('returns different responses on subsequent calls', () => {
    let callCount = 0
    
    cy.intercept('GET', '/api/status', (req) => {
      callCount++
      
      if (callCount === 1) {
        req.reply({ body: { status: 'pending' } })
      } else if (callCount === 2) {
        req.reply({ body: { status: 'processing' } })
      } else {
        req.reply({ body: { status: 'complete' } })
      }
    })
  })
})
```

### Request Counting

```typescript
describe('Request Counting', () => {
  it('counts API calls', () => {
    let requestCount = 0
    
    cy.intercept('GET', '/api/**', (req) => {
      requestCount++
      req.continue()
    })
    
    cy.visit('/dashboard')
    cy.then(() => {
      expect(requestCount).to.be.greaterThan(0)
      cy.log(`Total API calls: ${requestCount}`)
    })
  })
})
```

## Summary

- `cy.intercept()` stubs, spies on, and modifies network requests
- Full TypeScript support for request/response types
- Match requests by URL, method, headers, body
- Stub responses with static or dynamic data
- Simulate delays, errors, and network failures
- Spy on requests without stubbing
- Use fixtures for response data
- Test edge cases easily
- Combine with `cy.wait()` for synchronization
- Clean up automatically between tests
- Essential for isolated, fast, reliable tests

## Next Steps

- **19 - API Testing**: Complement with real API tests
- **21 - Authentication**: Mock auth endpoints
- **24 - Best Practices**: Network testing strategies

## Quick Reference

```typescript
// Basic intercept
cy.intercept('GET', '/api/users').as('getUsers')
cy.wait('@getUsers')

// Stub response
cy.intercept('GET', '/api/users', {
  body: [{ id: 1, name: 'User 1' }]
})

// Modify response
cy.intercept('GET', '/api/users', (req) => {
  req.continue((res) => {
    res.body = res.body.map(u => ({ ...u, active: true }))
  })
})

// Simulate error
cy.intercept('GET', '/api/users', {
  statusCode: 500,
  body: { error: 'Server Error' }
})

// Add delay
cy.intercept('GET', '/api/users', (req) => {
  req.continue((res) => {
    res.delay = 2000
  })
})

// Type-safe
cy.intercept<User[]>('GET', '/api/users', {
  body: mockUsers
})
```
