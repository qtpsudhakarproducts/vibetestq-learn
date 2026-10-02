# 27 - Capstone Project: Complete E2E Test Suite

## Project Overview

This capstone project demonstrates building a complete, production-ready Cypress TypeScript test automation framework for an e-commerce application, incorporating all concepts from this documentation series.

## Project Scope

### Application Under Test

**E-Commerce Platform Features:**
- User authentication (login, registration, password reset)
- Product catalog (browse, search, filter)
- Shopping cart (add, remove, update quantities)
- Checkout process (shipping, payment, confirmation)
- User profile management
- Order history
- Admin panel (product management)

## Project Structure

### Complete Folder Organization

```
cypress-ecommerce-tests/
├── cypress/
│   ├── e2e/
│   │   ├── auth/
│   │   │   ├── login.cy.ts
│   │   │   ├── registration.cy.ts
│   │   │   └── password-reset.cy.ts
│   │   ├── products/
│   │   │   ├── browse.cy.ts
│   │   │   ├── search.cy.ts
│   │   │   └── filter.cy.ts
│   │   ├── cart/
│   │   │   ├── add-items.cy.ts
│   │   │   └── cart-operations.cy.ts
│   │   ├── checkout/
│   │   │   ├── shipping.cy.ts
│   │   │   ├── payment.cy.ts
│   │   │   └── confirmation.cy.ts
│   │   ├── profile/
│   │   │   ├── view-profile.cy.ts
│   │   │   └── edit-profile.cy.ts
│   │   └── admin/
│   │       ├── product-management.cy.ts
│   │       └── order-management.cy.ts
│   ├── fixtures/
│   │   ├── users/
│   │   │   ├── admin.json
│   │   │   ├── customer.json
│   │   │   └── guest.json
│   │   ├── products/
│   │   │   └── catalog.json
│   │   └── addresses/
│   │       └── shipping.json
│   ├── support/
│   │   ├── commands.ts
│   │   ├── e2e.ts
│   │   ├── pages/
│   │   │   ├── BasePage.ts
│   │   │   ├── LoginPage.ts
│   │   │   ├── ProductPage.ts
│   │   │   ├── CartPage.ts
│   │   │   └── CheckoutPage.ts
│   │   ├── api/
│   │   │   ├── AuthApi.ts
│   │   │   ├── ProductApi.ts
│   │   │   └── OrderApi.ts
│   │   ├── helpers/
│   │   │   ├── AuthHelper.ts
│   │   │   ├── CartHelper.ts
│   │   │   └── DataHelper.ts
│   │   └── types/
│   │       ├── user.types.ts
│   │       ├── product.types.ts
│   │       └── order.types.ts
│   └── downloads/
├── cypress.config.ts
├── package.json
└── tsconfig.json
```

## Type Definitions

### Core Types

```typescript
// cypress/support/types/user.types.ts
export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  role: 'customer' | 'admin'
  addresses: Address[]
}

export interface Address {
  id: string
  type: 'shipping' | 'billing'
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}

// cypress/support/types/product.types.ts
export interface Product {
  id: string
  name: string
  description: string
  price: number
  category: string
  inStock: boolean
  imageUrl: string
  rating: number
}

// cypress/support/types/order.types.ts
export interface Order {
  id: string
  userId: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered'
  shippingAddress: Address
  createdAt: string
}

export interface OrderItem {
  productId: string
  quantity: number
  price: number
}
```

## API Clients

### Authentication API

```typescript
// cypress/support/api/AuthApi.ts
import { User } from '../types/user.types'

export class AuthApi {
  private static baseUrl = '/api/auth'
  
  static login(email: string, password: string): Cypress.Chainable<string> {
    return cy.request<{ token: string }>({
      method: 'POST',
      url: `${this.baseUrl}/login`,
      body: { email, password }
    }).then(response => {
      const token = response.body.token
      localStorage.setItem('authToken', token)
      return token
    })
  }
  
  static register(user: Omit<User, 'id'>): Cypress.Chainable<User> {
    return cy.request<User>({
      method: 'POST',
      url: `${this.baseUrl}/register`,
      body: user
    }).its('body')
  }
  
  static logout(): Cypress.Chainable<void> {
    return cy.request({
      method: 'POST',
      url: `${this.baseUrl}/logout`,
      headers: this.getAuthHeaders()
    }).then(() => {
      localStorage.removeItem('authToken')
    })
  }
  
  private static getAuthHeaders(): Record<string, string> {
    const token = localStorage.getItem('authToken')
    return token ? { 'Authorization': `Bearer ${token}` } : {}
  }
}
```

## Page Objects

### Base Page

```typescript
// cypress/support/pages/BasePage.ts
export abstract class BasePage {
  protected abstract url: string
  
  visit(): this {
    cy.visit(this.url)
    this.waitForLoad()
    return this
  }
  
  protected waitForLoad(): void {
    cy.get('[data-cy="loading"]', { timeout: 1000 }).should('not.exist')
  }
  
  protected getElement(selector: string) {
    return cy.get(selector)
  }
}
```

### Login Page

```typescript
// cypress/support/pages/LoginPage.ts
import { BasePage } from './BasePage'

export class LoginPage extends BasePage {
  protected url = '/login'
  
  private selectors = {
    email: '[data-cy="email"]',
    password: '[data-cy="password"]',
    submit: '[data-cy="login-submit"]',
    error: '[data-cy="error-message"]',
    registerLink: '[data-cy="register-link"]'
  }
  
  fillEmail(email: string): this {
    this.getElement(this.selectors.email).type(email)
    return this
  }
  
  fillPassword(password: string): this {
    this.getElement(this.selectors.password).type(password)
    return this
  }
  
  submit(): this {
    this.getElement(this.selectors.submit).click()
    return this
  }
  
  login(email: string, password: string): this {
    return this.fillEmail(email).fillPassword(password).submit()
  }
  
  shouldShowError(message: string): this {
    this.getElement(this.selectors.error).should('contain', message)
    return this
  }
  
  goToRegister(): this {
    this.getElement(this.selectors.registerLink).click()
    return this
  }
}
```

### Product Page

```typescript
// cypress/support/pages/ProductPage.ts
import { BasePage } from './BasePage'
import { Product } from '../types/product.types'

export class ProductPage extends BasePage {
  protected url = '/products'
  
  private selectors = {
    productCard: '[data-cy="product-card"]',
    productName: '[data-cy="product-name"]',
    productPrice: '[data-cy="product-price"]',
    addToCart: '[data-cy="add-to-cart"]',
    searchInput: '[data-cy="search"]',
    categoryFilter: '[data-cy="category-filter"]',
    priceFilter: '[data-cy="price-filter"]'
  }
  
  searchProduct(query: string): this {
    this.getElement(this.selectors.searchInput).type(query)
    return this
  }
  
  filterByCategory(category: string): this {
    this.getElement(this.selectors.categoryFilter).select(category)
    return this
  }
  
  addToCart(productName: string): this {
    cy.contains(this.selectors.productCard, productName)
      .find(this.selectors.addToCart)
      .click()
    return this
  }
  
  getProductPrice(productName: string): Cypress.Chainable<number> {
    return cy.contains(this.selectors.productCard, productName)
      .find(this.selectors.productPrice)
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')))
  }
}
```

### Cart Page

```typescript
// cypress/support/pages/CartPage.ts
import { BasePage } from './BasePage'

export class CartPage extends BasePage {
  protected url = '/cart'
  
  private selectors = {
    cartItem: '[data-cy="cart-item"]',
    itemName: '[data-cy="item-name"]',
    quantity: '[data-cy="quantity"]',
    removeItem: '[data-cy="remove-item"]',
    total: '[data-cy="cart-total"]',
    checkout: '[data-cy="checkout-button"]',
    emptyCart: '[data-cy="empty-cart"]'
  }
  
  updateQuantity(productName: string, quantity: number): this {
    cy.contains(this.selectors.cartItem, productName)
      .find(this.selectors.quantity)
      .clear()
      .type(quantity.toString())
    return this
  }
  
  removeItem(productName: string): this {
    cy.contains(this.selectors.cartItem, productName)
      .find(this.selectors.removeItem)
      .click()
    return this
  }
  
  getTotal(): Cypress.Chainable<number> {
    return this.getElement(this.selectors.total)
      .invoke('text')
      .then(text => parseFloat(text.replace('$', '')))
  }
  
  proceedToCheckout(): this {
    this.getElement(this.selectors.checkout).click()
    return this
  }
  
  shouldBeEmpty(): this {
    this.getElement(this.selectors.emptyCart).should('be.visible')
    return this
  }
}
```

### Checkout Page

```typescript
// cypress/support/pages/CheckoutPage.ts
import { BasePage } from './BasePage'
import { Address } from '../types/user.types'

export class CheckoutPage extends BasePage {
  protected url = '/checkout'
  
  private selectors = {
    // Shipping form
    firstName: '[data-cy="shipping-first-name"]',
    lastName: '[data-cy="shipping-last-name"]',
    street: '[data-cy="shipping-street"]',
    city: '[data-cy="shipping-city"]',
    state: '[data-cy="shipping-state"]',
    zipCode: '[data-cy="shipping-zip"]',
    continueToPayment: '[data-cy="continue-payment"]',
    
    // Payment form
    cardNumber: '[data-cy="card-number"]',
    expiry: '[data-cy="card-expiry"]',
    cvv: '[data-cy="card-cvv"]',
    placeOrder: '[data-cy="place-order"]',
    
    // Confirmation
    orderNumber: '[data-cy="order-number"]',
    confirmationMessage: '[data-cy="confirmation"]'
  }
  
  fillShippingAddress(address: Partial<Address>): this {
    if (address.street) this.getElement(this.selectors.street).type(address.street)
    if (address.city) this.getElement(this.selectors.city).type(address.city)
    if (address.state) this.getElement(this.selectors.state).select(address.state)
    if (address.zipCode) this.getElement(this.selectors.zipCode).type(address.zipCode)
    return this
  }
  
  continueToPayment(): this {
    this.getElement(this.selectors.continueToPayment).click()
    return this
  }
  
  fillPaymentInfo(cardNumber: string, expiry: string, cvv: string): this {
    this.getElement(this.selectors.cardNumber).type(cardNumber)
    this.getElement(this.selectors.expiry).type(expiry)
    this.getElement(this.selectors.cvv).type(cvv)
    return this
  }
  
  placeOrder(): this {
    this.getElement(this.selectors.placeOrder).click()
    return this
  }
  
  getOrderNumber(): Cypress.Chainable<string> {
    return this.getElement(this.selectors.orderNumber).invoke('text')
  }
  
  shouldShowConfirmation(): this {
    this.getElement(this.selectors.confirmationMessage).should('be.visible')
    return this
  }
}
```

## Custom Commands

```typescript
// cypress/support/commands.ts
import { User } from './types/user.types'
import { AuthApi } from './api/AuthApi'

declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>
      loginAsCustomer(): Chainable<void>
      loginAsAdmin(): Chainable<void>
      addProductToCart(productId: string, quantity: number): Chainable<void>
      completeCheckout(address: any, payment: any): Chainable<string>
    }
  }
}

Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session([email, password], () => {
    AuthApi.login(email, password)
  })
})

Cypress.Commands.add('loginAsCustomer', () => {
  cy.fixture<User>('users/customer.json').then(user => {
    cy.login(user.email, user.password)
  })
})

Cypress.Commands.add('loginAsAdmin', () => {
  cy.fixture<User>('users/admin.json').then(user => {
    cy.login(user.email, user.password)
  })
})

Cypress.Commands.add('addProductToCart', (productId: string, quantity: number) => {
  cy.request('POST', '/api/cart/items', {
    productId,
    quantity
  })
})

Cypress.Commands.add('completeCheckout', (address, payment) => {
  cy.request('POST', '/api/checkout', {
    shippingAddress: address,
    paymentInfo: payment
  }).then(response => response.body.orderId)
})
```

## Test Implementation

### Complete E2E User Journey

```typescript
// cypress/e2e/complete-journey.cy.ts
import { LoginPage } from '../support/pages/LoginPage'
import { ProductPage } from '../support/pages/ProductPage'
import { CartPage } from '../support/pages/CartPage'
import { CheckoutPage } from '../support/pages/CheckoutPage'

describe('Complete E2E Shopping Journey', () => {
  const loginPage = new LoginPage()
  const productPage = new ProductPage()
  const cartPage = new CartPage()
  const checkoutPage = new CheckoutPage()
  
  let user: any
  let shippingAddress: any
  
  before(() => {
    cy.fixture('users/customer').then(data => { user = data })
    cy.fixture('addresses/shipping').then(data => { shippingAddress = data })
  })
  
  it('completes full shopping journey', () => {
    // 1. Login
    loginPage
      .visit()
      .login(user.email, user.password)
    
    cy.url().should('include', '/products')
    
    // 2. Browse and add products
    productPage
      .visit()
      .searchProduct('laptop')
      .addToCart('MacBook Pro')
      .addToCart('USB-C Adapter')
    
    // 3. Review cart
    cartPage
      .visit()
      .updateQuantity('USB-C Adapter', 2)
    
    cartPage.getTotal().should('be.greaterThan', 0)
    
    // 4. Checkout
    cartPage.proceedToCheckout()
    
    checkoutPage
      .fillShippingAddress(shippingAddress)
      .continueToPayment()
      .fillPaymentInfo('4242424242424242', '12/25', '123')
      .placeOrder()
      .shouldShowConfirmation()
    
    // 5. Verify order
    checkoutPage.getOrderNumber().should('match', /^ORD-/)
  })
})
```

### API + UI Testing

```typescript
// cypress/e2e/hybrid-testing.cy.ts
describe('Hybrid API + UI Testing', () => {
  let orderId: string
  
  it('creates order via API, verifies in UI', () => {
    // Setup via API (fast)
    cy.loginAsCustomer()
    cy.addProductToCart('prod-123', 2)
    cy.completeCheckout(shippingAddress, paymentInfo)
      .then(id => { orderId = id })
    
    // Verify in UI (what users see)
    cy.visit('/orders')
    cy.contains('[data-cy="order"]', orderId)
      .should('be.visible')
      .and('contain', 'Processing')
  })
})
```

## Configuration

### Cypress Config with Multiple Environments

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:4000'
  },
  staging: {
    baseUrl: 'https://staging.ecommerce.com',
    apiUrl: 'https://api-staging.ecommerce.com'
  },
  production: {
    baseUrl: 'https://ecommerce.com',
    apiUrl: 'https://api.ecommerce.com'
  }
}

const env = process.env.CYPRESS_ENV || 'local'

export default defineConfig({
  e2e: {
    ...environments[env],
    
    viewportWidth: 1280,
    viewportHeight: 720,
    
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    setupNodeEvents(on, config) {
      // Task implementations
      on('task', {
        log(message) {
          console.log(message)
          return null
        }
      })
      
      return config
    }
  }
})
```

## CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/cypress.yml
name: E2E Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        containers: [1, 2, 3, 4]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          record: true
          parallel: true
          group: 'E2E Tests'
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          CYPRESS_ENV: staging
      
      - name: Upload artifacts
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-artifacts
          path: |
            cypress/screenshots
            cypress/videos
```

## Reporting

### Mochawesome Report

```typescript
// reporter-config.json
{
  "reporterEnabled": "mochawesome",
  "mochawesomeReporterOptions": {
    "reportDir": "cypress/results",
    "overwrite": false,
    "html": true,
    "json": true,
    "charts": true
  }
}
```

## Summary

This capstone project demonstrates:
- ✅ Complete TypeScript type safety
- ✅ Page Object Model implementation
- ✅ API client pattern
- ✅ Custom commands and helpers
- ✅ Fixtures and test data management
- ✅ Hybrid API + UI testing
- ✅ Complete E2E user journeys
- ✅ Multi-environment configuration
- ✅ CI/CD integration
- ✅ Parallel execution
- ✅ Comprehensive reporting
- ✅ Best practices throughout

## Key Takeaways

1. **Organization**: Proper folder structure is crucial
2. **Type Safety**: TypeScript prevents errors
3. **Reusability**: Page Objects and helpers reduce duplication
4. **Speed**: API setup is faster than UI
5. **Reliability**: Proper waits and retries reduce flakiness
6. **Maintainability**: Clear patterns make updates easy
7. **Scalability**: Architecture supports growth
8. **CI/CD**: Automated testing provides confidence

## Next Steps

Use this project as a template for your own test automation:
1. Clone the structure
2. Adapt to your application
3. Add your page objects
4. Implement custom commands
5. Set up CI/CD
6. Run and maintain

**Congratulations on completing the Cypress TypeScript documentation series!** 🎉
