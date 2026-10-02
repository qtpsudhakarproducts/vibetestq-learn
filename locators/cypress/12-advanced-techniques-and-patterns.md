## Chapter 12: Advanced Techniques and Patterns

### 12.1 Custom jQuery Selectors

```javascript
// Add custom jQuery selector
$.expr[':'].actionable = function(el) {
  return $(el).is(':visible:not(:disabled)')
}

cy.get('button:actionable')
```

### 12.2 Shadow DOM Handling

```javascript
// Access shadow DOM
cy.get('custom-element')
  .shadow()
  .find('.inner-element')
  .click()

// Custom command
Cypress.Commands.add('shadow', { prevSubject: true }, ($el) => {
  return cy.wrap($el[0].shadowRoot)
})

cy.get('web-component').shadow().find('.button').click()
```

### 12.3 Conditional Testing

```javascript
// Close modal if open
cy.get('body').then($body => {
  if ($body.find('.modal:visible').length > 0) {
    cy.get('.modal-close').click()
  }
})

// Login if not logged in
cy.get('body').then($body => {
  if ($body.find('[data-cy="login-button"]').length > 0) {
    cy.getByCy('username').type('admin')
    cy.getByCy('password').type('password')
    cy.getByCy('login-button').click()
  }
})
```

---
