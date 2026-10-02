## Chapter 3: CSS Selectors in Cypress

### 3.1 Basic CSS Selectors

**Element Selectors:**
```javascript
// By tag name
cy.get('input')
cy.get('button')
cy.get('div')

// By ID
cy.get('#username')
cy.get('#submit-button')

// By class
cy.get('.btn')
cy.get('.product-card')

// Multiple classes
cy.get('.btn.btn-primary')
cy.get('.card.active.featured')
```

**Attribute Selectors:**
```javascript
// Has attribute
cy.get('[required]')
cy.get('[disabled]')

// Exact attribute value
cy.get('[type="text"]')
cy.get('[name="email"]')

// Attribute contains
cy.get('[class*="btn"]')
cy.get('[id*="user"]')

// Attribute starts with
cy.get('[class^="btn-"]')
cy.get('[id^="input-"]')

// Attribute ends with
cy.get('[class$="primary"]')
cy.get('[src$=".jpg"]')
```

### 3.2 Combinators

**Descendant Combinator (space):**
```javascript
cy.get('form input')
cy.get('.container button')
cy.get('nav a')
```

**Child Combinator (>):**
```javascript
cy.get('ul > li')
cy.get('.parent > .child')
```

**Adjacent Sibling (+):**
```javascript
cy.get('label + input')
cy.get('h2 + p')
```

**General Sibling (~):**
```javascript
cy.get('label ~ input')
cy.get('h2 ~ p')
```

### 3.3 Pseudo-classes

```javascript
// Position-based
cy.get('li:first-child')
cy.get('li:last-child')
cy.get('li:nth-child(2)')
cy.get('li:nth-child(odd)')

// State-based
cy.get('input:enabled')
cy.get('input:disabled')
cy.get('input:checked')
cy.get('input:required')

// Negation
cy.get('input:not([type="hidden"])')
cy.get('button:not(:disabled)')
```

---
