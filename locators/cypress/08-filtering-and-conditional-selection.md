## Chapter 8: Filtering and Conditional Selection

### 8.1 filter() and not()

```javascript
// Filter by selector
cy.get('button').filter('.primary')
cy.get('.item').filter('.active')

// Filter by function
cy.get('.product').filter(($el) => {
  return $el.text().includes('iPhone')
})

// Exclude by selector
cy.get('button').not('.disabled')
cy.get('.item').not('.hidden')
cy.get('input').not('[type="hidden"]')
```

### 8.2 eq(), first(), last()

```javascript
// Zero-based index
cy.get('button').eq(0)  // First button
cy.get('button').eq(2)  // Third button
cy.get('button').eq(-1) // Last button

// Get first element
cy.get('button').first()
cy.get('.item').first()

// Get last element
cy.get('button').last()
cy.get('.item').last()
```

---
