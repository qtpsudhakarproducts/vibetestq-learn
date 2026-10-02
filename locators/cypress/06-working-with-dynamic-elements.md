## Chapter 6: Working with Dynamic Elements

### 6.1 Handling Dynamic IDs and Classes

```javascript
// Use attribute starts-with
cy.get('[id^="user-"]')
cy.get('[id^="product-"]')

// Use attribute contains
cy.get('[id*="dynamic"]')
cy.get('[class*="btn-"]')

// Use data attributes instead
cy.get('[data-cy="user-item"]')
cy.get('[data-id="123"]')
```

### 6.2 Waiting for Dynamic Content

```javascript
// Cypress waits automatically
cy.get('.dynamic-content').should('be.visible')
cy.contains('Data loaded').should('exist')

// Custom timeout
cy.get('.slow-element', { timeout: 10000 }).should('exist')

// Wait for element to disappear
cy.get('.loading-spinner').should('not.exist')

// Wait for requests
cy.intercept('GET', '/api/data').as('getData')
cy.visit('/dashboard')
cy.wait('@getData')
cy.get('.data-loaded').should('be.visible')
```

---
