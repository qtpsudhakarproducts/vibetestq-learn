## Chapter 5: Cypress-Specific Locator Strategies

### 5.1 Custom Commands

```javascript
// cypress/support/commands.js

// Get by data-cy attribute
Cypress.Commands.add('getByCy', (selector, options) => {
  return cy.get(`[data-cy="${selector}"]`, options)
})

// Get by label text
Cypress.Commands.add('getByLabel', (labelText) => {
  return cy.contains('label', labelText).invoke('attr', 'for').then(id => {
    return cy.get(`#${id}`)
  })
})

// Get by placeholder
Cypress.Commands.add('getByPlaceholder', (placeholderText) => {
  return cy.get(`[placeholder="${placeholderText}"]`)
})

// Get by aria-label
Cypress.Commands.add('getByAriaLabel', (label) => {
  return cy.get(`[aria-label="${label}"]`)
})

// Usage
cy.getByCy('submit-button').click()
cy.getByLabel('Username').type('admin')
cy.getByPlaceholder('Search products').type('iPhone')
cy.getByAriaLabel('Close dialog').click()
```

### 5.2 Testing Library Integration

**Installation:**
```bash
npm install -D @testing-library/cypress
```

**Configuration:**
```javascript
// cypress/support/e2e.js
import '@testing-library/cypress/add-commands'
```

**Available Commands:**
```javascript
// findByRole
cy.findByRole('button', { name: 'Submit' }).click()
cy.findByRole('textbox', { name: 'Email' }).type('user@example.com')

// findByLabelText
cy.findByLabelText('Username').type('admin')
cy.findByLabelText('Password').type('password123')

// findByPlaceholderText
cy.findByPlaceholderText('Search').type('query')

// findByText
cy.findByText('Submit').click()
cy.findByText(/sign up/i).click()

// findByTestId
cy.findByTestId('submit-button').click()
```

---
