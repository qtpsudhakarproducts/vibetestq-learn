## Chapter 10: Cypress Locators Best Practices

### 10.1 Locator Strategy Priority

**Recommended Priority Order:**

1. **Data Attributes** (Best)
```javascript
cy.get('[data-cy="submit-button"]')
cy.get('[data-testid="product-card"]')
```

2. **Semantic HTML / Accessibility**
```javascript
cy.get('button[type="submit"]')
cy.get('[aria-label="Close dialog"]')
```

3. **Text Content**
```javascript
cy.contains('Submit')
cy.contains('button', 'Sign Up')
```

4. **Stable Attributes**
```javascript
cy.get('#username')  // If ID is stable
cy.get('input[name="email"]')
```

5. **CSS Selectors** (Use Carefully)
```javascript
cy.get('.submit-button')  // If class is stable
```

6. **XPath** (Last Resort)
```javascript
cy.xpath('//button[text()="Submit"]')
```

### 10.2 Maintainability Guidelines

**Page Object Pattern:**
```javascript
class LoginPage {
  get emailInput() { return cy.get('[data-cy="email-input"]') }
  get passwordInput() { return cy.get('[data-cy="password-input"]') }
  get submitButton() { return cy.get('[data-cy="login-button"]') }
  
  login(email, password) {
    this.emailInput.type(email)
    this.passwordInput.type(password)
    this.submitButton.click()
  }
}

const loginPage = new LoginPage()
loginPage.login('user@test.com', 'password')
```

### 10.3 Common Mistakes to Avoid

**Mistake 1: Using Dynamic Selectors**
```javascript
// ❌ Bad
cy.get('.css-1a2b3c4').click()  // Generated class

// ✅ Good
cy.getByCy('dropdown').click()
```

**Mistake 2: Overly Specific Selectors**
```javascript
// ❌ Bad
cy.get('body > div.app > div.container > form > button')

// ✅ Good
cy.get('form [data-cy="submit"]')
```

**Mistake 3: Breaking Command Chains**
```javascript
// ❌ Bad
cy.get('button')
cy.get('button').click()  // Re-queries DOM

// ✅ Good
cy.get('button').click()
```

### 10.4 Debugging Locators

```javascript
// Debug element
cy.get('[data-cy="element"]').debug()

// Pause execution
cy.get('[data-cy="element"]').pause()

// Log element details
cy.get('[data-cy="element"]').then($el => {
  console.log('Element:', $el)
  console.log('Text:', $el.text())
  cy.log('Element found', $el)
})
```

### 10.5 Performance Optimization

```javascript
// ✅ Fast - ID lookup
cy.get('#uniqueId')

// ✅ Fast - Data attribute
cy.get('[data-cy="element"]')

// ⚠️ Moderate - Class lookup
cy.get('.className')

// ❌ Slow - Complex selector
cy.get('div > div > div span.class[attr="value"]')
```

---
