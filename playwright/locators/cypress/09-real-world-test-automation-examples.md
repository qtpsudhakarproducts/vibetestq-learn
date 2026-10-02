## Chapter 9: Real-World Test Automation Examples

### 9.1 Login Form Automation

```javascript
describe('Login Form', () => {
  beforeEach(() => {
    cy.visit('/login')
  })

  it('should login successfully', () => {
    cy.getByCy('username-input').type('admin')
    cy.getByCy('password-input').type('password123')
    cy.getByCy('remember-checkbox').check()
    cy.getByCy('login-button').click()
    
    cy.url().should('include', '/dashboard')
    cy.contains('Welcome, admin').should('be.visible')
  })

  it('should show error with invalid credentials', () => {
    cy.getByCy('username-input').type('invalid')
    cy.getByCy('password-input').type('wrong')
    cy.getByCy('login-button').click()
    
    cy.getByCy('error-message')
      .should('be.visible')
      .and('contain', 'Invalid credentials')
  })
})
```

### 9.2 E-commerce Product Selection

```javascript
describe('Product Selection', () => {
  it('should add product to cart', () => {
    cy.visit('/products')
    
    cy.get('[data-product-id="123"]').within(() => {
      cy.get('.product-title').should('contain', 'iPhone 15')
      cy.get('.product-price').should('contain', '$999')
      cy.get('.add-to-cart').click()
    })
    
    cy.get('.cart-count').should('contain', '1')
  })

  it('should select product by name', () => {
    cy.visit('/products')
    
    cy.contains('.product-card', 'iPhone 15').within(() => {
      cy.get('.add-to-cart').click()
    })
    
    cy.get('.cart-notification').should('be.visible')
  })
})
```

### 9.3 Dynamic Dropdown Selection

```javascript
describe('Dropdown Selection', () => {
  it('should select option from dropdown', () => {
    cy.visit('/form')
    
    cy.getByCy('dropdown-button').click()
    cy.getByCy('dropdown-menu').should('be.visible')
    cy.contains('.dropdown-item', 'United States').click()
    cy.getByCy('dropdown-button').should('contain', 'United States')
  })
})
```

### 9.4 Table Data Extraction

```javascript
describe('Table Operations', () => {
  it('should extract all table data', () => {
    cy.visit('/users')
    
    const tableData = []
    cy.get('table tbody tr').each($row => {
      const rowData = []
      cy.wrap($row).find('td').each($cell => {
        rowData.push($cell.text())
      })
      tableData.push(rowData)
    })
    
    cy.wrap(tableData).should('have.length.at.least', 1)
  })

  it('should find row by cell content', () => {
    cy.contains('table tbody tr', 'john@example.com').within(() => {
      cy.get('button.edit').click()
    })
  })
})
```

### 9.5 File Upload

```javascript
describe('File Upload', () => {
  it('should upload a file', () => {
    cy.visit('/upload')
    
    cy.get('input[type="file"]')
      .selectFile('cypress/fixtures/test-file.pdf')
    
    cy.get('.file-name').should('contain', 'test-file.pdf')
    cy.get('.upload-button').click()
    cy.get('.upload-status').should('contain', 'Upload complete')
  })
})
```

### 9.6 Modal Dialog Handling

```javascript
describe('Modal Dialogs', () => {
  it('should interact with modal', () => {
    cy.visit('/dashboard')
    
    cy.contains('button', 'Open Dialog').click()
    cy.get('.modal-overlay').should('be.visible')
    
    cy.get('.modal-dialog').within(() => {
      cy.get('h2').should('contain', 'Confirm Action')
      cy.contains('button', 'Confirm').click()
    })
    
    cy.get('.success-message').should('be.visible')
  })
})
```

### 9.7 Form Validation

```javascript
describe('Form Validation', () => {
  it('should show validation errors', () => {
    cy.visit('/registration')
    
    cy.get('button[type="submit"]').click()
    
    cy.contains('.error-message', 'Email is required')
      .should('be.visible')
    cy.contains('.error-message', 'Password is required')
      .should('be.visible')
  })

  it('should validate email format', () => {
    cy.get('#email').type('invalid-email')
    cy.get('#email').blur()
    
    cy.get('#email')
      .siblings('.error-message')
      .should('contain', 'valid email')
  })
})
```

---
