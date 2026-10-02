## Appendix C: Testing Library Integration

```bash
npm install -D @testing-library/cypress
```

```javascript
// cypress/support/e2e.js
import '@testing-library/cypress/add-commands'

// Usage
cy.findByRole('button', { name: 'Submit' })
cy.findByLabelText('Email')
cy.findByPlaceholderText('Search')
cy.findByText('Welcome')
```

---
