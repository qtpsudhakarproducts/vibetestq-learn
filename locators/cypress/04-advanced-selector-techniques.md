## Chapter 4: Advanced Selector Techniques

### 4.1 Chaining Selectors

```javascript
// Chain with find()
cy.get('.product-card')
  .find('button')
  .click()

// Multiple chains
cy.get('.container')
  .find('.product-list')
  .find('.product-card')
  .first()
  .click()

// Chain with contains()
cy.get('.nav')
  .contains('Products')
  .click()
```

### 4.2 Using within() for Scoping

```javascript
// Scope to specific container
cy.get('.modal').within(() => {
  cy.get('input[name="email"]').type('user@example.com')
  cy.get('button').contains('Submit').click()
})

// Scope to form
cy.get('form.login').within(() => {
  cy.get('#username').type('admin')
  cy.get('#password').type('password')
  cy.get('button[type="submit"]').click()
})
```

### 4.3 Aliases for Element Reuse

```javascript
// Create alias with .as()
cy.get('.product-card').as('products')
cy.get('input[name="email"]').as('emailInput')

// Use alias with @
cy.get('@products').should('have.length', 10)
cy.get('@emailInput').type('user@example.com')

// Alias persists across commands
cy.get('@products').first().click()
cy.get('@products').last().should('be.visible')
```

---
