# 08 - Navigation and Pages

## Introduction to Navigation

Cypress provides comprehensive navigation commands for controlling browser behavior, managing URLs, handling page reloads, and configuring viewports. This module covers all navigation-related functionality with TypeScript.

## cy.visit()

### Basic Navigation

```typescript
describe('Basic Navigation', () => {
  it('visits a URL', () => {
    // Visit absolute URL
    cy.visit('https://example.com')
    
    // Visit relative URL (uses baseUrl from config)
    cy.visit('/')
    cy.visit('/login')
    cy.visit('/products/123')
  })
  
  it('visits with options', () => {
    cy.visit('/dashboard', {
      timeout: 30000,
      onBeforeLoad(win) {
        // Runs before page load
        win.localStorage.setItem('token', 'abc123')
      },
      onLoad(win) {
        // Runs after page load
        cy.log('Page loaded!')
      }
    })
  })
})
```

### Visit Options

```typescript
interface VisitOptions {
  url: string
  method?: 'GET' | 'POST'
  body?: any
  headers?: Record<string, string>
  qs?: Record<string, any>
  timeout?: number
  onBeforeLoad?: (win: Window) => void
  onLoad?: (win: Window) => void
  retryOnStatusCodeFailure?: boolean
  retryOnNetworkFailure?: boolean
  auth?: { username: string; password: string }
  failOnStatusCode?: boolean
}

describe('Visit with Options', () => {
  it('visits with query parameters', () => {
    cy.visit('/search', {
      qs: {
        q: 'cypress',
        page: 1,
        limit: 10
      }
    })
    
    // URL becomes: /search?q=cypress&page=1&limit=10
    cy.url().should('include', 'q=cypress')
  })
  
  it('visits with custom headers', () => {
    cy.visit('/api-page', {
      headers: {
        'Accept-Language': 'en-US',
        'X-Custom-Header': 'value'
      }
    })
  })
  
  it('visits with basic auth', () => {
    cy.visit('/protected', {
      auth: {
        username: 'admin',
        password: 'secret'
      }
    })
  })
  
  it('visits with POST method', () => {
    cy.visit('/form-submit', {
      method: 'POST',
      body: {
        username: 'testuser',
        password: 'testpass'
      }
    })
  })
})
```

### Type-Safe Visit

```typescript
interface QueryParams {
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
  filter?: string
}

class NavigationHelper {
  static visitWithParams(path: string, params: QueryParams) {
    cy.visit(path, { qs: params })
  }
  
  static visitWithAuth(path: string, username: string, password: string) {
    cy.visit(path, {
      auth: { username, password }
    })
  }
  
  static visitAndWait(path: string, alias: string) {
    cy.visit(path)
    cy.wait(alias)
  }
}

describe('Type-Safe Navigation', () => {
  it('uses navigation helper', () => {
    const params: QueryParams = {
      page: 1,
      limit: 20,
      sort: 'desc'
    }
    
    NavigationHelper.visitWithParams('/products', params)
    cy.url().should('include', 'page=1')
  })
})
```

### Visit with Viewport

```typescript
describe('Visit with Viewport', () => {
  it('sets viewport before visit', () => {
    cy.viewport(1920, 1080)
    cy.visit('/')
  })
  
  it('visits mobile view', () => {
    cy.viewport('iphone-x')
    cy.visit('/')
  })
  
  it('visits responsive breakpoints', () => {
    const breakpoints = [
      { width: 320, height: 568 },   // Mobile
      { width: 768, height: 1024 },  // Tablet
      { width: 1920, height: 1080 }  // Desktop
    ]
    
    breakpoints.forEach(({ width, height }) => {
      cy.viewport(width, height)
      cy.visit('/')
      cy.get('.responsive-element').should('be.visible')
    })
  })
})
```

## Browser History Navigation

### cy.go()

```typescript
describe('Browser History', () => {
  it('navigates using go()', () => {
    cy.visit('/page1')
    cy.visit('/page2')
    cy.visit('/page3')
    
    // Go back
    cy.go('back')
    cy.url().should('include', '/page2')
    
    // Go forward
    cy.go('forward')
    cy.url().should('include', '/page3')
    
    // Go back 2 pages
    cy.go(-2)
    cy.url().should('include', '/page1')
    
    // Go forward 1 page
    cy.go(1)
    cy.url().should('include', '/page2')
  })
  
  it('navigates with options', () => {
    cy.visit('/page1')
    cy.visit('/page2')
    
    cy.go('back', {
      timeout: 10000
    })
  })
})
```

### cy.reload()

```typescript
describe('Page Reload', () => {
  it('reloads the page', () => {
    cy.visit('/')
    cy.get('input').type('test')
    
    // Simple reload
    cy.reload()
    
    cy.get('input').should('have.value', '')
  })
  
  it('reloads without cache', () => {
    cy.visit('/')
    
    // Force reload (bypass cache)
    cy.reload(true)
  })
  
  it('reloads with options', () => {
    cy.reload({
      timeout: 10000
    })
  })
})
```

## URL Assertions

### cy.url()

```typescript
describe('URL Assertions', () => {
  it('checks current URL', () => {
    cy.visit('/login')
    
    // Full URL
    cy.url().should('eq', 'http://localhost:3000/login')
    
    // Contains
    cy.url().should('include', '/login')
    
    // Regex
    cy.url().should('match', /\/login$/)
  })
  
  it('chains URL assertions', () => {
    cy.visit('/products/123')
    
    cy.url()
      .should('include', '/products')
      .and('include', '123')
      .and('not.include', 'edit')
  })
})
```

### cy.location()

```typescript
describe('Location Object', () => {
  it('gets location properties', () => {
    cy.visit('/search?q=cypress&page=1#results')
    
    // Get entire location object
    cy.location().should((loc) => {
      expect(loc.pathname).to.eq('/search')
      expect(loc.search).to.eq('?q=cypress&page=1')
      expect(loc.hash).to.eq('#results')
      expect(loc.host).to.include('localhost')
    })
  })
  
  it('gets specific location properties', () => {
    cy.visit('/products/123?view=grid#top')
    
    // pathname
    cy.location('pathname').should('eq', '/products/123')
    
    // search (query string)
    cy.location('search').should('eq', '?view=grid')
    
    // hash
    cy.location('hash').should('eq', '#top')
    
    // protocol
    cy.location('protocol').should('eq', 'http:')
    
    // host
    cy.location('host').should('include', 'localhost')
    
    // hostname
    cy.location('hostname').should('eq', 'localhost')
    
    // port
    cy.location('port').should('eq', '3000')
  })
})
```

### Type-Safe Location

```typescript
interface PageLocation {
  pathname: string
  search: string
  hash: string
  href: string
}

describe('Type-Safe Location', () => {
  it('uses typed location checks', () => {
    cy.visit('/products?category=electronics#featured')
    
    cy.location().then((loc: Location) => {
      const pageLocation: PageLocation = {
        pathname: loc.pathname,
        search: loc.search,
        hash: loc.hash,
        href: loc.href
      }
      
      expect(pageLocation.pathname).to.include('/products')
      expect(pageLocation.search).to.include('category=electronics')
      expect(pageLocation.hash).to.eq('#featured')
    })
  })
})
```

## Viewport Management

### cy.viewport()

```typescript
describe('Viewport Sizing', () => {
  it('sets custom viewport', () => {
    // Width x Height
    cy.viewport(1280, 720)
    cy.visit('/')
  })
  
  it('uses preset viewports', () => {
    // Mobile devices
    cy.viewport('iphone-6')
    cy.viewport('iphone-x')
    cy.viewport('samsung-s10')
    
    // Tablets
    cy.viewport('ipad-2')
    cy.viewport('ipad-mini')
    
    // Desktop
    cy.viewport('macbook-11')
    cy.viewport('macbook-13')
    cy.viewport('macbook-15')
  })
  
  it('sets viewport with orientation', () => {
    cy.viewport('iphone-6', 'landscape')
    cy.viewport('ipad-2', 'portrait')
  })
})
```

### Responsive Testing

```typescript
describe('Responsive Design Testing', () => {
  const viewports = [
    { name: 'mobile', width: 375, height: 667 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1920, height: 1080 }
  ]
  
  viewports.forEach(({ name, width, height }) => {
    it(`displays correctly on ${name}`, () => {
      cy.viewport(width, height)
      cy.visit('/')
      
      if (name === 'mobile') {
        cy.get('.mobile-menu').should('be.visible')
        cy.get('.desktop-menu').should('not.be.visible')
      } else if (name === 'desktop') {
        cy.get('.mobile-menu').should('not.be.visible')
        cy.get('.desktop-menu').should('be.visible')
      }
    })
  })
})
```

### Type-Safe Viewport Helper

```typescript
type ViewportPreset = 
  | 'iphone-6' 
  | 'iphone-x'
  | 'ipad-2'
  | 'macbook-13'
  | 'macbook-15'

type ViewportOrientation = 'portrait' | 'landscape'

interface CustomViewport {
  width: number
  height: number
  name?: string
}

class ViewportHelper {
  static setPreset(preset: ViewportPreset, orientation?: ViewportOrientation) {
    if (orientation) {
      cy.viewport(preset, orientation)
    } else {
      cy.viewport(preset)
    }
  }
  
  static setCustom(viewport: CustomViewport) {
    cy.viewport(viewport.width, viewport.height)
  }
  
  static testMultiple(viewports: CustomViewport[], testFn: () => void) {
    viewports.forEach((viewport) => {
      cy.viewport(viewport.width, viewport.height)
      testFn()
    })
  }
}

describe('Type-Safe Viewport', () => {
  it('uses viewport helper', () => {
    ViewportHelper.setPreset('iphone-x', 'portrait')
    cy.visit('/')
    
    const desktop: CustomViewport = {
      width: 1920,
      height: 1080,
      name: 'desktop'
    }
    
    ViewportHelper.setCustom(desktop)
  })
})
```

## Hash Navigation

```typescript
describe('Hash Navigation', () => {
  it('navigates to hash fragments', () => {
    cy.visit('/docs')
    
    // Navigate to hash
    cy.get('a[href="#section-1"]').click()
    cy.location('hash').should('eq', '#section-1')
    
    // Element should be in view
    cy.get('#section-1').should('be.visible')
  })
  
  it('visits URL with hash', () => {
    cy.visit('/page#section-2')
    cy.location('hash').should('eq', '#section-2')
  })
  
  it('updates hash programmatically', () => {
    cy.visit('/page')
    
    cy.window().then((win) => {
      win.location.hash = '#new-section'
    })
    
    cy.location('hash').should('eq', '#new-section')
  })
})
```

## Query Parameters

### Working with Query Strings

```typescript
describe('Query Parameters', () => {
  it('visits with query params', () => {
    cy.visit('/search', {
      qs: {
        q: 'cypress testing',
        category: 'automation',
        page: 2
      }
    })
    
    cy.location('search')
      .should('include', 'q=cypress')
      .and('include', 'category=automation')
      .and('include', 'page=2')
  })
  
  it('parses query parameters', () => {
    cy.visit('/products?sort=price&order=asc')
    
    cy.location('search').then((search) => {
      const params = new URLSearchParams(search)
      expect(params.get('sort')).to.eq('price')
      expect(params.get('order')).to.eq('asc')
    })
  })
  
  it('updates query parameters', () => {
    cy.visit('/list')
    
    cy.window().then((win) => {
      const url = new URL(win.location.href)
      url.searchParams.set('filter', 'active')
      url.searchParams.set('page', '3')
      win.history.pushState({}, '', url)
    })
    
    cy.location('search')
      .should('include', 'filter=active')
      .and('include', 'page=3')
  })
})
```

### Type-Safe Query Parameters

```typescript
interface SearchParams {
  query?: string
  category?: string
  page?: number
  limit?: number
  sort?: 'asc' | 'desc'
}

class QueryParamHelper {
  static buildUrl(path: string, params: SearchParams): string {
    const url = new URL(path, Cypress.config('baseUrl'))
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    })
    
    return url.pathname + url.search
  }
  
  static visitWithParams(path: string, params: SearchParams) {
    cy.visit(path, { qs: params })
  }
  
  static parseCurrentParams(): Cypress.Chainable<URLSearchParams> {
    return cy.location('search').then((search) => {
      return new URLSearchParams(search)
    })
  }
}

describe('Type-Safe Query Params', () => {
  it('uses query param helper', () => {
    const params: SearchParams = {
      query: 'test',
      category: 'electronics',
      page: 1,
      sort: 'asc'
    }
    
    QueryParamHelper.visitWithParams('/search', params)
    
    QueryParamHelper.parseCurrentParams().then((urlParams) => {
      expect(urlParams.get('query')).to.eq('test')
      expect(urlParams.get('page')).to.eq('1')
    })
  })
})
```

## Base URL Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // Modify baseUrl based on environment
      const environment = config.env.environment || 'local'
      
      const baseUrls = {
        local: 'http://localhost:3000',
        dev: 'https://dev.example.com',
        staging: 'https://staging.example.com',
        prod: 'https://example.com'
      }
      
      config.baseUrl = baseUrls[environment as keyof typeof baseUrls]
      
      return config
    }
  }
})

describe('Base URL Usage', () => {
  it('uses baseUrl for relative paths', () => {
    // Uses baseUrl from config
    cy.visit('/')
    cy.visit('/login')
    cy.visit('/dashboard')
    
    // Full URL overrides baseUrl
    cy.visit('https://other-site.com')
  })
})
```

## Page Load Events

### Handling Page Load

```typescript
describe('Page Load Events', () => {
  it('executes code before page load', () => {
    cy.visit('/', {
      onBeforeLoad(win) {
        // Mock APIs before page loads
        win.fetch = cy.stub().as('fetch')
        
        // Set local storage
        win.localStorage.setItem('token', 'abc123')
        
        // Spy on methods
        cy.spy(win.console, 'log').as('consoleLog')
      }
    })
    
    cy.get('@fetch').should('have.been.called')
  })
  
  it('executes code after page load', () => {
    cy.visit('/', {
      onLoad(win) {
        // Page is fully loaded
        expect(win.document.readyState).to.eq('complete')
        
        // Access loaded elements
        const title = win.document.title
        expect(title).to.not.be.empty
      }
    })
  })
})
```

### Type-Safe Page Load Handlers

```typescript
interface PageLoadOptions {
  setupLocalStorage?: Record<string, string>
  mockApis?: boolean
  spyConsole?: boolean
}

class PageLoadHelper {
  static visitWithSetup(path: string, options: PageLoadOptions = {}) {
    cy.visit(path, {
      onBeforeLoad(win) {
        // Setup local storage
        if (options.setupLocalStorage) {
          Object.entries(options.setupLocalStorage).forEach(([key, value]) => {
            win.localStorage.setItem(key, value)
          })
        }
        
        // Mock APIs
        if (options.mockApis) {
          win.fetch = cy.stub().as('fetchStub')
        }
        
        // Spy console
        if (options.spyConsole) {
          cy.spy(win.console, 'log').as('consoleLog')
          cy.spy(win.console, 'error').as('consoleError')
        }
      }
    })
  }
}

describe('Type-Safe Page Load', () => {
  it('uses page load helper', () => {
    PageLoadHelper.visitWithSetup('/dashboard', {
      setupLocalStorage: {
        'auth_token': 'token123',
        'user_id': 'user456'
      },
      mockApis: true,
      spyConsole: true
    })
    
    cy.get('@fetchStub').should('exist')
  })
})
```

## Multi-Domain Testing

```typescript
describe('Multi-Domain Navigation', () => {
  it('visits different domains', () => {
    // Visit first domain
    cy.visit('https://example.com')
    cy.get('.logo').should('be.visible')
    
    // Visit second domain
    cy.visit('https://another-site.com')
    cy.get('.header').should('be.visible')
  })
  
  it('handles domain change within test', () => {
    cy.visit('https://site1.com')
    
    // Click link to external site
    cy.origin('https://site2.com', () => {
      cy.visit('/')
      cy.get('.content').should('be.visible')
    })
  })
})
```

## Redirects and Navigation Events

```typescript
describe('Redirect Handling', () => {
  it('follows redirects automatically', () => {
    // Visit URL that redirects
    cy.visit('/old-url')
    
    // Should be redirected to new URL
    cy.url().should('include', '/new-url')
  })
  
  it('prevents redirect', () => {
    cy.visit('/redirect', {
      failOnStatusCode: false
    })
  })
  
  it('waits for navigation to complete', () => {
    cy.get('a[href="/next-page"]').click()
    
    // Wait for URL change
    cy.url().should('include', '/next-page')
    
    // Wait for page to load
    cy.get('.page-content').should('be.visible')
  })
})
```

## Custom Navigation Commands

```typescript
// cypress/support/commands.ts
declare global {
  namespace Cypress {
    interface Chainable {
      visitAndWaitForLoad(path: string): Chainable<void>
      navigateToSection(sectionId: string): Chainable<void>
      visitWithAuth(path: string, token: string): Chainable<void>
      checkCurrentPage(expectedPath: string): Chainable<void>
    }
  }
}

Cypress.Commands.add('visitAndWaitForLoad', (path: string) => {
  cy.visit(path)
  cy.document().its('readyState').should('eq', 'complete')
  cy.get('body').should('be.visible')
})

Cypress.Commands.add('navigateToSection', (sectionId: string) => {
  cy.get(`a[href="#${sectionId}"]`).click()
  cy.location('hash').should('eq', `#${sectionId}`)
  cy.get(`#${sectionId}`).should('be.visible')
})

Cypress.Commands.add('visitWithAuth', (path: string, token: string) => {
  cy.visit(path, {
    onBeforeLoad(win) {
      win.localStorage.setItem('auth_token', token)
    }
  })
})

Cypress.Commands.add('checkCurrentPage', (expectedPath: string) => {
  cy.location('pathname').should('eq', expectedPath)
})

// Usage
describe('Custom Navigation Commands', () => {
  it('uses custom commands', () => {
    cy.visitAndWaitForLoad('/dashboard')
    cy.navigateToSection('profile')
    cy.visitWithAuth('/admin', 'secret-token')
    cy.checkCurrentPage('/admin')
  })
})
```

## Best Practices

### 1. Use BaseURL for Relative Paths

```typescript
// ✅ Good - Uses baseUrl
cy.visit('/')
cy.visit('/login')

// ❌ Avoid - Hardcoded full URLs
cy.visit('http://localhost:3000/')
cy.visit('http://localhost:3000/login')
```

### 2. Wait for Page Load

```typescript
// ✅ Good - Wait for specific element
cy.visit('/dashboard')
cy.get('[data-cy="dashboard-content"]').should('be.visible')

// ✅ Good - Use onLoad callback
cy.visit('/', {
  onLoad(win) {
    expect(win.document.readyState).to.eq('complete')
  }
})
```

### 3. Use Type-Safe Helpers

```typescript
// ✅ Good - Type-safe navigation
interface NavOptions {
  path: string
  params?: QueryParams
  auth?: boolean
}

function navigateTo(options: NavOptions) {
  if (options.params) {
    cy.visit(options.path, { qs: options.params })
  } else {
    cy.visit(options.path)
  }
}
```

### 4. Handle Different Environments

```typescript
// cypress.config.ts
const environments = {
  local: 'http://localhost:3000',
  staging: 'https://staging.example.com',
  prod: 'https://example.com'
}

const env = process.env.CYPRESS_ENV || 'local'
config.baseUrl = environments[env as keyof typeof environments]
```

## Summary

- `cy.visit()` navigates to URLs with extensive options
- `cy.go()` navigates browser history (back, forward)
- `cy.reload()` reloads the current page
- `cy.url()` and `cy.location()` verify current URL
- `cy.viewport()` controls browser window size
- Query parameters can be passed via `qs` option
- BaseURL simplifies relative path navigation
- Page load hooks allow setup before/after load
- TypeScript ensures type-safe navigation patterns
- Custom commands encapsulate common navigation flows

## Next Steps

- **08 - Scopes, Frames, Dialogs**: Working with iframes and dialogs
- **09 - Waits and Timeouts**: Understanding navigation timing
- **12 - Test Configuration**: Advanced baseUrl configuration

## Quick Reference

```typescript
// Visit
cy.visit('/')
cy.visit('/page', { qs: { id: 123 } })

// History
cy.go('back')
cy.go('forward')
cy.go(-2)

// Reload
cy.reload()
cy.reload(true)  // Force reload

// URL assertions
cy.url().should('include', '/dashboard')
cy.location('pathname').should('eq', '/users')
cy.location('search').should('include', 'page=1')

// Viewport
cy.viewport(1920, 1080)
cy.viewport('iphone-x')

// Custom
cy.visitAndWaitForLoad('/page')
```
