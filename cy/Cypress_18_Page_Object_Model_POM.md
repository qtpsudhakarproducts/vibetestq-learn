# 18 - Page Object Model (POM)

## Introduction to Page Object Model

The Page Object Model is a design pattern that creates an object repository for web elements, making tests more maintainable and readable. This module covers implementing POM with TypeScript in Cypress.

## Basic Page Object Pattern

### Simple Page Object

```typescript
// cypress/pages/LoginPage.ts
export class LoginPage {
  // Selectors
  private selectors = {
    usernameInput: '[data-cy="username"]',
    passwordInput: '[data-cy="password"]',
    submitButton: '[data-cy="submit"]',
    errorMessage: '.error-message',
    successMessage: '.success-message'
  }
  
  // Navigation
  visit(): void {
    cy.visit('/login')
  }
  
  // Actions
  enterUsername(username: string): this {
    cy.get(this.selectors.usernameInput).type(username)
    return this
  }
  
  enterPassword(password: string): this {
    cy.get(this.selectors.passwordInput).type(password)
    return this
  }
  
  clickSubmit(): this {
    cy.get(this.selectors.submitButton).click()
    return this
  }
  
  // Combined actions
  login(username: string, password: string): void {
    this.enterUsername(username)
      .enterPassword(password)
      .clickSubmit()
  }
  
  // Assertions
  shouldShowError(message: string): this {
    cy.get(this.selectors.errorMessage).should('contain', message)
    return this
  }
  
  shouldShowSuccess(): this {
    cy.get(this.selectors.successMessage).should('be.visible')
    return this
  }
}

// Usage in test
describe('Login Tests', () => {
  const loginPage = new LoginPage()
  
  beforeEach(() => {
    loginPage.visit()
  })
  
  it('logs in successfully', () => {
    loginPage
      .enterUsername('testuser')
      .enterPassword('password123')
      .clickSubmit()
      .shouldShowSuccess()
  })
  
  it('shows error on invalid credentials', () => {
    loginPage
      .login('invalid', 'wrong')
      .shouldShowError('Invalid credentials')
  })
})
```

### Type-Safe Selectors

```typescript
// cypress/pages/types.ts
export type Selector = string

export interface PageSelectors {
  [key: string]: Selector
}

// cypress/pages/BasePage.ts
export abstract class BasePage {
  protected abstract selectors: PageSelectors
  
  protected get(selector: Selector) {
    return cy.get(selector)
  }
  
  protected find(parent: Selector, child: Selector) {
    return cy.get(parent).find(child)
  }
  
  protected contains(text: string) {
    return cy.contains(text)
  }
}

// cypress/pages/DashboardPage.ts
export class DashboardPage extends BasePage {
  protected selectors = {
    header: '[data-cy="dashboard-header"]',
    userMenu: '[data-cy="user-menu"]',
    profileLink: '[data-cy="profile-link"]',
    logoutButton: '[data-cy="logout"]',
    notifications: '[data-cy="notifications"]'
  }
  
  visit(): this {
    cy.visit('/dashboard')
    return this
  }
  
  getHeader() {
    return this.get(this.selectors.header)
  }
  
  openUserMenu(): this {
    this.get(this.selectors.userMenu).click()
    return this
  }
  
  clickProfile(): this {
    this.get(this.selectors.profileLink).click()
    return this
  }
  
  logout(): this {
    this.openUserMenu()
    this.get(this.selectors.logoutButton).click()
    return this
  }
}
```

## Advanced Page Object Patterns

### Generic Base Page

```typescript
// cypress/pages/BasePage.ts
export abstract class BasePage<T extends PageSelectors> {
  protected abstract selectors: T
  protected abstract url: string
  
  visit(): this {
    cy.visit(this.url)
    this.waitForLoad()
    return this
  }
  
  protected waitForLoad(): void {
    // Override in child classes if needed
  }
  
  protected getElement(selector: keyof T) {
    return cy.get(this.selectors[selector] as string)
  }
  
  protected typeInto(selector: keyof T, text: string): this {
    this.getElement(selector).type(text)
    return this
  }
  
  protected clickOn(selector: keyof T): this {
    this.getElement(selector).click()
    return this
  }
  
  isVisible(selector: keyof T): this {
    this.getElement(selector).should('be.visible')
    return this
  }
  
  shouldContainText(selector: keyof T, text: string): this {
    this.getElement(selector).should('contain', text)
    return this
  }
}

// Implementation
interface ProductPageSelectors extends PageSelectors {
  title: string
  price: string
  addToCart: string
  description: string
  reviews: string
}

export class ProductPage extends BasePage<ProductPageSelectors> {
  protected url = '/product/:id'
  protected selectors: ProductPageSelectors = {
    title: '[data-cy="product-title"]',
    price: '[data-cy="product-price"]',
    addToCart: '[data-cy="add-to-cart"]',
    description: '[data-cy="description"]',
    reviews: '[data-cy="reviews"]'
  }
  
  visitProduct(id: string): this {
    cy.visit(`/product/${id}`)
    return this
  }
  
  addToCart(): this {
    this.clickOn('addToCart')
    return this
  }
  
  verifyPrice(expectedPrice: string): this {
    this.shouldContainText('price', expectedPrice)
    return this
  }
}
```

### Page Components

```typescript
// cypress/pages/components/NavigationComponent.ts
export class NavigationComponent {
  private selectors = {
    homeLink: '[data-cy="nav-home"]',
    productsLink: '[data-cy="nav-products"]',
    aboutLink: '[data-cy="nav-about"]',
    cartIcon: '[data-cy="cart-icon"]',
    cartCount: '[data-cy="cart-count"]'
  }
  
  clickHome(): this {
    cy.get(this.selectors.homeLink).click()
    return this
  }
  
  clickProducts(): this {
    cy.get(this.selectors.productsLink).click()
    return this
  }
  
  openCart(): this {
    cy.get(this.selectors.cartIcon).click()
    return this
  }
  
  verifyCartCount(count: number): this {
    cy.get(this.selectors.cartCount).should('contain', count.toString())
    return this
  }
}

// cypress/pages/HomePage.ts
import { NavigationComponent } from './components/NavigationComponent'

export class HomePage extends BasePage {
  protected selectors = {
    welcomeMessage: '[data-cy="welcome"]',
    featuredProducts: '[data-cy="featured"]'
  }
  
  protected url = '/'
  
  navigation = new NavigationComponent()
  
  verifyWelcomeMessage(): this {
    cy.get(this.selectors.welcomeMessage).should('be.visible')
    return this
  }
}

// Usage
describe('Navigation Tests', () => {
  const homePage = new HomePage()
  
  it('navigates to products', () => {
    homePage
      .visit()
      .navigation.clickProducts()
    
    cy.url().should('include', '/products')
  })
})
```

## Chainable Methods

### Fluent Interface

```typescript
export class FormPage {
  private selectors = {
    firstName: '#firstName',
    lastName: '#lastName',
    email: '#email',
    phone: '#phone',
    submit: '[type="submit"]'
  }
  
  visit(): this {
    cy.visit('/form')
    return this
  }
  
  fillFirstName(name: string): this {
    cy.get(this.selectors.firstName).type(name)
    return this
  }
  
  fillLastName(name: string): this {
    cy.get(this.selectors.lastName).type(name)
    return this
  }
  
  fillEmail(email: string): this {
    cy.get(this.selectors.email).type(email)
    return this
  }
  
  fillPhone(phone: string): this {
    cy.get(this.selectors.phone).type(phone)
    return this
  }
  
  submit(): this {
    cy.get(this.selectors.submit).click()
    return this
  }
  
  // Combined method
  fillForm(data: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }): this {
    return this
      .fillFirstName(data.firstName)
      .fillLastName(data.lastName)
      .fillEmail(data.email)
      .fillPhone(data.phone)
  }
}

// Usage with chaining
describe('Form Tests', () => {
  const formPage = new FormPage()
  
  it('fills and submits form', () => {
    formPage
      .visit()
      .fillForm({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '555-1234'
      })
      .submit()
  })
})
```

## Type-Safe Page Objects

### Interface-Based Approach

```typescript
// cypress/pages/interfaces.ts
export interface IPage {
  visit(): this
}

export interface IFormPage extends IPage {
  fillField(field: string, value: string): this
  submit(): this
  shouldShowError(message: string): this
}

export interface IListPage<T> extends IPage {
  getItems(): Cypress.Chainable<T[]>
  getItemByIndex(index: number): Cypress.Chainable<T>
  filterBy(criteria: string): this
  sortBy(field: keyof T): this
}

// Implementation
export class UserListPage implements IListPage<User> {
  protected url = '/users'
  
  visit(): this {
    cy.visit(this.url)
    return this
  }
  
  getItems(): Cypress.Chainable<User[]> {
    return cy.get('[data-cy="user-item"]').then(($items) => {
      const users: User[] = []
      $items.each((i, el) => {
        users.push({
          id: Cypress.$(el).data('id'),
          name: Cypress.$(el).find('.name').text(),
          email: Cypress.$(el).find('.email').text()
        })
      })
      return users
    })
  }
  
  getItemByIndex(index: number): Cypress.Chainable<User> {
    return cy.get('[data-cy="user-item"]').eq(index).then(($el) => ({
      id: $el.data('id'),
      name: $el.find('.name').text(),
      email: $el.find('.email').text()
    }))
  }
  
  filterBy(criteria: string): this {
    cy.get('[data-cy="filter"]').type(criteria)
    return this
  }
  
  sortBy(field: keyof User): this {
    cy.get(`[data-cy="sort-${String(field)}"]`).click()
    return this
  }
}
```

## Page Factory Pattern

```typescript
// cypress/pages/PageFactory.ts
export class PageFactory {
  static loginPage(): LoginPage {
    return new LoginPage()
  }
  
  static dashboardPage(): DashboardPage {
    return new DashboardPage()
  }
  
  static productPage(): ProductPage {
    return new ProductPage()
  }
  
  static cartPage(): CartPage {
    return new CartPage()
  }
}

// Usage
describe('E2E Flow', () => {
  it('completes purchase', () => {
    PageFactory.loginPage()
      .visit()
      .login('user', 'pass')
    
    PageFactory.productPage()
      .visitProduct('123')
      .addToCart()
    
    PageFactory.cartPage()
      .visit()
      .checkout()
  })
})
```

## Waiting and Loading States

```typescript
export class AsyncPage extends BasePage {
  protected selectors = {
    loadingSpinner: '.loading-spinner',
    content: '.content',
    errorBanner: '.error-banner'
  }
  
  protected url = '/async-page'
  
  protected waitForLoad(): void {
    cy.get(this.selectors.loadingSpinner, { timeout: 10000 })
      .should('not.exist')
    cy.get(this.selectors.content).should('be.visible')
  }
  
  waitForApiCall(alias: string): this {
    cy.wait(alias)
    return this
  }
  
  shouldNotShowError(): this {
    cy.get(this.selectors.errorBanner).should('not.exist')
    return this
  }
}
```

## Data-Driven Page Objects

```typescript
export class DataDrivenPage<T> {
  constructor(
    private url: string,
    private selectors: Record<keyof T, string>
  ) {}
  
  visit(): this {
    cy.visit(this.url)
    return this
  }
  
  fillField(field: keyof T, value: string): this {
    cy.get(this.selectors[field]).type(value)
    return this
  }
  
  getFieldValue(field: keyof T): Cypress.Chainable<string> {
    return cy.get(this.selectors[field]).invoke('val') as Cypress.Chainable<string>
  }
  
  fillAllFields(data: T): this {
    Object.entries(data).forEach(([key, value]) => {
      this.fillField(key as keyof T, value as string)
    })
    return this
  }
}

// Usage
interface RegistrationForm {
  username: string
  email: string
  password: string
}

const registrationPage = new DataDrivenPage<RegistrationForm>(
  '/register',
  {
    username: '#username',
    email: '#email',
    password: '#password'
  }
)

describe('Registration', () => {
  it('registers user', () => {
    registrationPage
      .visit()
      .fillAllFields({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
  })
})
```

## Best Practices

### 1. Single Responsibility

```typescript
// ✅ Good - focused page object
export class LoginPage {
  login(username: string, password: string): void {
    // Only login-related actions
  }
}

// ❌ Avoid - mixed responsibilities
export class LoginPage {
  login(): void { }
  createUser(): void { }  // Belongs in AdminPage
  sendEmail(): void { }    // Belongs in EmailPage
}
```

### 2. Return this for Chaining

```typescript
// ✅ Good - chainable
export class Page {
  action1(): this {
    // ...
    return this
  }
  
  action2(): this {
    // ...
    return this
  }
}

// ❌ Avoid - not chainable
export class Page {
  action1(): void {
    // ...
  }
}
```

### 3. Keep Selectors Private

```typescript
// ✅ Good - encapsulated
export class Page {
  private selectors = {
    button: '.button'
  }
  
  clickButton(): this {
    cy.get(this.selectors.button).click()
    return this
  }
}

// ❌ Avoid - exposed selectors
export class Page {
  public selectors = {
    button: '.button'
  }
}
```

### 4. Use TypeScript Features

```typescript
// ✅ Good - type-safe
interface UserData {
  username: string
  email: string
}

export class UserPage {
  createUser(data: UserData): this {
    // Type-safe
    return this
  }
}
```

## Page Object Utilities

```typescript
// cypress/pages/PageUtils.ts
export class PageUtils {
  static waitForUrl(url: string): void {
    cy.url().should('include', url)
  }
  
  static waitForElement(selector: string, timeout: number = 10000): void {
    cy.get(selector, { timeout }).should('exist')
  }
  
  static scrollToElement(selector: string): void {
    cy.get(selector).scrollIntoView()
  }
  
  static takeScreenshot(name: string): void {
    cy.screenshot(name)
  }
}

// Usage in page objects
export class MyPage extends BasePage {
  visit(): this {
    cy.visit('/page')
    PageUtils.waitForElement(this.selectors.content)
    return this
  }
}
```

## Summary

- Page Object Model organizes tests by pages
- Encapsulates selectors and actions
- TypeScript provides type safety
- Chainable methods enable fluent interface
- Components can be reused across pages
- Base classes reduce code duplication
- Keep selectors private, expose actions
- Return `this` for method chaining
- Use interfaces for contracts
- Generic base classes for flexibility

## Next Steps

- **16 - Parameterization**: Data-driven page objects
- **19 - API Testing**: Combine POM with API calls
- **24 - Best Practices**: POM best practices

## Quick Reference

```typescript
// Basic page object
export class LoginPage {
  private selectors = {
    username: '#username',
    password: '#password'
  }
  
  visit(): this {
    cy.visit('/login')
    return this
  }
  
  login(user: string, pass: string): this {
    cy.get(this.selectors.username).type(user)
    cy.get(this.selectors.password).type(pass)
    return this
  }
}

// Usage
const page = new LoginPage()
page.visit().login('user', 'pass')

// Base class
export abstract class BasePage {
  protected abstract selectors: PageSelectors
  protected abstract url: string
  
  visit(): this {
    cy.visit(this.url)
    return this
  }
}
```
