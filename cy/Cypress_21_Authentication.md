# 21 - Authentication and Session Management

## Introduction to Authentication Testing

Authentication is fundamental to web application testing. This module covers login patterns, session management, cookies, tokens, SSO, and authentication best practices with TypeScript in Cypress.

## Basic Login Patterns

### Simple Login Test

```typescript
describe('Basic Login', () => {
  it('logs in with valid credentials', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('[data-cy="user-menu"]').should('be.visible')
  })
  
  it('shows error with invalid credentials', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('wrong@example.com')
    cy.get('[data-cy="password"]').type('wrongpass')
    cy.get('[data-cy="submit"]').click()
    
    cy.get('[data-cy="error"]').should('contain', 'Invalid credentials')
    cy.url().should('include', '/login')
  })
})
```

### Type-Safe Login

```typescript
interface LoginCredentials {
  email: string
  password: string
}

interface User {
  id: string
  email: string
  name: string
  role: 'admin' | 'user' | 'guest'
}

describe('Type-Safe Login', () => {
  const credentials: LoginCredentials = {
    email: 'test@example.com',
    password: 'securePassword123'
  }
  
  it('logs in with typed credentials', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type(credentials.email)
    cy.get('[data-cy="password"]').type(credentials.password)
    cy.get('[data-cy="submit"]').click()
    
    cy.window().its('localStorage.user').should('exist')
  })
})
```

## Login via API

### API-Based Login

```typescript
describe('API Login', () => {
  it('logs in via API', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'user@example.com',
        password: 'password123'
      }
    }).then((response) => {
      expect(response.status).to.eq(200)
      expect(response.body).to.have.property('token')
      
      // Save token
      window.localStorage.setItem('authToken', response.body.token)
    })
    
    // Now visit authenticated page
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
})
```

### Type-Safe API Login

```typescript
interface LoginResponse {
  token: string
  user: User
  expiresAt: string
}

class AuthApi {
  static login(credentials: LoginCredentials): Cypress.Chainable<LoginResponse> {
    return cy.request<LoginResponse>({
      method: 'POST',
      url: '/api/auth/login',
      body: credentials
    }).its('body')
  }
  
  static logout(): Cypress.Chainable<void> {
    return cy.request({
      method: 'POST',
      url: '/api/auth/logout',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      }
    }).then(() => {})
  }
}

describe('Type-Safe API Login', () => {
  it('uses API login helper', () => {
    AuthApi.login({
      email: 'test@example.com',
      password: 'password123'
    }).then((response) => {
      expect(response.token).to.be.a('string')
      expect(response.user.role).to.be.oneOf(['admin', 'user', 'guest'])
      
      localStorage.setItem('authToken', response.token)
    })
    
    cy.visit('/dashboard')
  })
})
```

## Session Management

### Cookie-Based Sessions

```typescript
describe('Cookie Sessions', () => {
  it('sets session cookie on login', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    
    // Verify session cookie
    cy.getCookie('sessionId').should('exist')
    cy.getCookie('sessionId').should('have.property', 'httpOnly', true)
  })
  
  it('preserves session across pages', () => {
    cy.login('user@example.com', 'password123')
    
    cy.visit('/dashboard')
    cy.getCookie('sessionId').should('exist')
    
    cy.visit('/profile')
    cy.getCookie('sessionId').should('exist')
  })
  
  it('clears session on logout', () => {
    cy.login('user@example.com', 'password123')
    cy.getCookie('sessionId').should('exist')
    
    cy.get('[data-cy="logout"]').click()
    cy.getCookie('sessionId').should('not.exist')
  })
})
```

### localStorage Sessions

```typescript
describe('localStorage Sessions', () => {
  it('stores auth token in localStorage', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    
    cy.window().its('localStorage.authToken').should('exist')
  })
  
  it('removes token on logout', () => {
    cy.login('user@example.com', 'password123')
    
    cy.window().its('localStorage.authToken').should('exist')
    cy.get('[data-cy="logout"]').click()
    cy.window().its('localStorage.authToken').should('not.exist')
  })
})
```

### sessionStorage Sessions

```typescript
describe('sessionStorage Sessions', () => {
  it('uses sessionStorage for temporary auth', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    
    cy.window().then((win) => {
      expect(win.sessionStorage.getItem('authToken')).to.exist
    })
  })
})
```

## Custom Login Commands

### Basic Login Command

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsAdmin(): Chainable<void>
      loginAsUser(): Chainable<void>
      logout(): Chainable<void>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type(email)
    cy.get('[data-cy="password"]').type(password)
    cy.get('[data-cy="submit"]').click()
    cy.url().should('not.include', '/login')
  })
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.login('admin@example.com', 'adminPassword')
})

Cypress.Commands.add('loginAsUser', () => {
  cy.login('user@example.com', 'userPassword')
})

Cypress.Commands.add('logout', () => {
  cy.get('[data-cy="logout"]').click()
  cy.url().should('include', '/login')
})

// Usage
describe('Custom Login Commands', () => {
  it('uses login command', () => {
    cy.login('user@example.com', 'password123')
    cy.visit('/dashboard')
  })
  
  it('logs in as admin', () => {
    cy.loginAsAdmin()
    cy.visit('/admin')
  })
})
```

### API-Based Login Command

```typescript
Cypress.Commands.add('loginViaApi', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password }
  }).then((response) => {
    window.localStorage.setItem('authToken', response.body.token)
  })
})

// Usage
describe('API Login Command', () => {
  it('logs in via API', () => {
    cy.loginViaApi('user@example.com', 'password123')
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
})
```

## cy.session() for Performance

### Using cy.session()

```typescript
describe('Session Caching', () => {
  it('caches login session', () => {
    cy.session('user-session', () => {
      cy.visit('/login')
      cy.get('[data-cy="email"]').type('user@example.com')
      cy.get('[data-cy="password"]').type('password123')
      cy.get('[data-cy="submit"]').click()
      cy.url().should('include', '/dashboard')
    })
    
    // Session is now cached
    cy.visit('/dashboard')
    cy.get('[data-cy="dashboard"]').should('be.visible')
  })
  
  it('reuses cached session', () => {
    // This will reuse the session from previous test
    cy.session('user-session', () => {
      cy.visit('/login')
      cy.get('[data-cy="email"]').type('user@example.com')
      cy.get('[data-cy="password"]').type('password123')
      cy.get('[data-cy="submit"]').click()
    })
    
    cy.visit('/profile')
  })
})
```

### Session Validation

```typescript
describe('Session with Validation', () => {
  it('validates session is still active', () => {
    cy.session(
      'user-session',
      () => {
        // Login logic
        cy.loginViaApi('user@example.com', 'password123')
      },
      {
        validate() {
          // Verify session is still valid
          cy.request('/api/auth/me').its('status').should('eq', 200)
        }
      }
    )
  })
})
```

## JWT Token Authentication

### Storing and Using JWT

```typescript
describe('JWT Authentication', () => {
  it('stores JWT token', () => {
    cy.request({
      method: 'POST',
      url: '/api/auth/login',
      body: {
        email: 'user@example.com',
        password: 'password123'
      }
    }).then((response) => {
      const token = response.body.token
      localStorage.setItem('jwtToken', token)
      
      // Verify token structure
      const parts = token.split('.')
      expect(parts).to.have.length(3)
    })
  })
  
  it('includes JWT in requests', () => {
    cy.loginViaApi('user@example.com', 'password123')
    
    cy.request({
      url: '/api/user/profile',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      }
    }).its('status').should('eq', 200)
  })
  
  it('handles expired token', () => {
    localStorage.setItem('jwtToken', 'expired.token.here')
    
    cy.request({
      url: '/api/user/profile',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
      },
      failOnStatusCode: false
    }).its('status').should('eq', 401)
  })
})
```

### JWT Helper Class

```typescript
class JwtHelper {
  static setToken(token: string): void {
    localStorage.setItem('jwtToken', token)
  }
  
  static getToken(): string | null {
    return localStorage.getItem('jwtToken')
  }
  
  static clearToken(): void {
    localStorage.removeItem('jwtToken')
  }
  
  static decodeToken(token: string): any {
    const base64Url = token.split('.')[1]
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    )
    return JSON.parse(jsonPayload)
  }
  
  static isExpired(token: string): boolean {
    const decoded = this.decodeToken(token)
    return decoded.exp * 1000 < Date.now()
  }
}

describe('JWT Helper', () => {
  it('manages JWT tokens', () => {
    cy.loginViaApi('user@example.com', 'password123')
    
    const token = JwtHelper.getToken()
    expect(token).to.exist
    
    const decoded = JwtHelper.decodeToken(token!)
    expect(decoded).to.have.property('email')
    expect(JwtHelper.isExpired(token!)).to.be.false
  })
})
```

## OAuth and Social Login

### Google OAuth

```typescript
describe('Google OAuth', () => {
  it('logs in with Google', () => {
    cy.visit('/login')
    cy.get('[data-cy="google-login"]').click()
    
    // OAuth flow redirects to Google
    cy.origin('https://accounts.google.com', () => {
      cy.get('input[type="email"]').type('user@gmail.com')
      cy.get('button').contains('Next').click()
      cy.get('input[type="password"]').type('password')
      cy.get('button').contains('Next').click()
    })
    
    // Redirected back to app
    cy.url().should('include', '/dashboard')
  })
})
```

### Mocking OAuth

```typescript
describe('Mock OAuth', () => {
  it('mocks OAuth response', () => {
    cy.intercept('POST', '/api/auth/google', {
      statusCode: 200,
      body: {
        token: 'mock-google-token',
        user: {
          id: '123',
          email: 'user@gmail.com',
          name: 'Test User'
        }
      }
    }).as('googleAuth')
    
    cy.visit('/login')
    cy.get('[data-cy="google-login"]').click()
    cy.wait('@googleAuth')
    
    cy.url().should('include', '/dashboard')
  })
})
```

## Multi-Factor Authentication (MFA)

### TOTP/SMS Verification

```typescript
describe('MFA Authentication', () => {
  it('requires MFA code after login', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    
    // MFA page
    cy.url().should('include', '/mfa')
    cy.get('[data-cy="mfa-code"]').type('123456')
    cy.get('[data-cy="verify"]').click()
    
    cy.url().should('include', '/dashboard')
  })
  
  it('handles invalid MFA code', () => {
    cy.login('user@example.com', 'password123')
    
    cy.get('[data-cy="mfa-code"]').type('000000')
    cy.get('[data-cy="verify"]').click()
    
    cy.get('[data-cy="error"]').should('contain', 'Invalid code')
  })
})
```

### Bypassing MFA in Tests

```typescript
Cypress.Commands.add('loginBypassMFA', (email: string, password: string) => {
  cy.request({
    method: 'POST',
    url: '/api/auth/login',
    body: { email, password },
    headers: { 'X-Skip-MFA': 'true' }  // Test-only header
  }).then((response) => {
    localStorage.setItem('authToken', response.body.token)
  })
})
```

## Role-Based Authentication

### Testing Different Roles

```typescript
describe('Role-Based Access', () => {
  it('admin can access admin panel', () => {
    cy.loginAsAdmin()
    cy.visit('/admin')
    cy.get('[data-cy="admin-panel"]').should('be.visible')
  })
  
  it('regular user cannot access admin panel', () => {
    cy.loginAsUser()
    cy.visit('/admin')
    cy.url().should('include', '/unauthorized')
  })
  
  it('guest has limited access', () => {
    cy.visit('/')
    cy.get('[data-cy="login-required"]').should('be.visible')
  })
})
```

### Type-Safe Role Checking

```typescript
type UserRole = 'admin' | 'user' | 'guest'

interface RolePermissions {
  canAccessAdmin: boolean
  canEdit: boolean
  canDelete: boolean
}

const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: { canAccessAdmin: true, canEdit: true, canDelete: true },
  user: { canAccessAdmin: false, canEdit: true, canDelete: false },
  guest: { canAccessAdmin: false, canEdit: false, canDelete: false }
}

describe('Role Permissions', () => {
  (['admin', 'user', 'guest'] as UserRole[]).forEach((role) => {
    it(`tests ${role} permissions`, () => {
      cy.loginAs(role)
      
      const permissions = rolePermissions[role]
      
      if (permissions.canAccessAdmin) {
        cy.visit('/admin')
        cy.get('[data-cy="admin-panel"]').should('be.visible')
      } else {
        cy.visit('/admin')
        cy.url().should('include', '/unauthorized')
      }
    })
  })
})
```

## Password Reset Flow

### Testing Password Reset

```typescript
describe('Password Reset', () => {
  it('requests password reset', () => {
    cy.visit('/forgot-password')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="submit"]').click()
    
    cy.get('[data-cy="success"]')
      .should('contain', 'Reset email sent')
  })
  
  it('resets password with token', () => {
    const resetToken = 'valid-reset-token'
    
    cy.visit(`/reset-password?token=${resetToken}`)
    cy.get('[data-cy="new-password"]').type('newPassword123')
    cy.get('[data-cy="confirm-password"]').type('newPassword123')
    cy.get('[data-cy="submit"]').click()
    
    cy.url().should('include', '/login')
    cy.get('[data-cy="success"]').should('contain', 'Password updated')
  })
})
```

## SSO (Single Sign-On)

### SAML Authentication

```typescript
describe('SAML SSO', () => {
  it('initiates SAML login', () => {
    cy.visit('/login')
    cy.get('[data-cy="sso-login"]').click()
    
    // Redirected to IdP
    cy.url().should('include', 'idp.example.com')
  })
  
  it('completes SAML flow', () => {
    // Mock SAML response
    cy.intercept('POST', '/api/auth/saml/callback', {
      statusCode: 200,
      body: {
        token: 'saml-token',
        user: { id: '1', email: 'user@company.com' }
      }
    })
    
    cy.visit('/login/saml/callback')
    cy.url().should('include', '/dashboard')
  })
})
```

## Auth Testing Best Practices

### 1. Use cy.session() for Performance

```typescript
// ✅ Good - sessions cached
beforeEach(() => {
  cy.session('user', () => {
    cy.loginViaApi('user@example.com', 'password')
  })
})

// ❌ Avoid - login every test
beforeEach(() => {
  cy.visit('/login')
  cy.get('#email').type('user@example.com')
  // Slow!
})
```

### 2. Login via API When Possible

```typescript
// ✅ Good - fast API login
cy.request('POST', '/api/login', credentials)
  .then(res => localStorage.setItem('token', res.body.token))

// ❌ Avoid - slow UI login
cy.visit('/login')
cy.get('#email').type('...')
cy.get('#password').type('...')
cy.get('button').click()
```

### 3. Separate Auth Tests from Feature Tests

```typescript
// ✅ Good - dedicated auth tests
describe('Authentication', () => {
  it('logs in', () => { })
  it('logs out', () => { })
})

describe('Dashboard Features', () => {
  beforeEach(() => cy.login('user', 'pass'))
  it('feature test', () => { })
})
```

## Complete Auth Helper

```typescript
// cypress/support/auth-helper.ts
export class AuthHelper {
  static login(email: string, password: string): void {
    cy.session([email, password], () => {
      cy.request({
        method: 'POST',
        url: '/api/auth/login',
        body: { email, password }
      }).then((response) => {
        localStorage.setItem('authToken', response.body.token)
        localStorage.setItem('user', JSON.stringify(response.body.user))
      })
    })
  }
  
  static loginAsRole(role: UserRole): void {
    const credentials = {
      admin: { email: 'admin@example.com', password: 'adminpass' },
      user: { email: 'user@example.com', password: 'userpass' },
      guest: { email: 'guest@example.com', password: 'guestpass' }
    }
    
    const creds = credentials[role]
    this.login(creds.email, creds.password)
  }
  
  static logout(): void {
    cy.clearLocalStorage()
    cy.clearCookies()
  }
  
  static getAuthToken(): Cypress.Chainable<string | null> {
    return cy.window().then((win) => {
      return win.localStorage.getItem('authToken')
    })
  }
  
  static isAuthenticated(): Cypress.Chainable<boolean> {
    return this.getAuthToken().then((token) => {
      return token !== null
    })
  }
}

// Usage
describe('Auth Helper Usage', () => {
  it('uses auth helper', () => {
    AuthHelper.login('user@example.com', 'password123')
    AuthHelper.isAuthenticated().should('be.true')
    
    cy.visit('/dashboard')
    
    AuthHelper.logout()
    AuthHelper.isAuthenticated().should('be.false')
  })
  
  it('logs in as admin', () => {
    AuthHelper.loginAsRole('admin')
    cy.visit('/admin')
  })
})
```

## Summary

- Use `cy.session()` for performant login caching
- Login via API is faster than UI login
- Support multiple authentication methods
- Handle JWT tokens, cookies, and localStorage
- Test different user roles and permissions
- Mock OAuth and SSO for testing
- Handle MFA and password reset flows
- Type-safe authentication patterns
- Separate auth tests from feature tests
- Custom commands for reusable auth logic

## Next Steps

- **19 - API Testing**: API authentication patterns
- **20 - Network Mocking**: Mock auth endpoints
- **24 - Best Practices**: Auth security practices

## Quick Reference

```typescript
// Custom login command
cy.login('user@example.com', 'password')

// API login
cy.request('POST', '/api/login', { email, password })
  .then(res => localStorage.setItem('token', res.body.token))

// Session caching
cy.session('user', () => {
  cy.loginViaApi('user@example.com', 'password')
})

// Role-based
cy.loginAsAdmin()
cy.loginAsUser()

// JWT
localStorage.setItem('jwtToken', token)
cy.request({
  url: '/api/endpoint',
  headers: { 'Authorization': `Bearer ${token}` }
})

// Logout
cy.logout()
cy.clearLocalStorage()
cy.clearCookies()
```
