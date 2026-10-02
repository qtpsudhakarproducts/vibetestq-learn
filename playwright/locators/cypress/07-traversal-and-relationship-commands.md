## Chapter 7: Traversal and Relationship Commands

### 7.1 Parent and Ancestors

```javascript
// Get immediate parent
cy.get('button').parent()
cy.get('.child-element').parent('.form-group')

// Get all ancestors
cy.get('input').parents('form')

// Get closest ancestor
cy.get('button').closest('form')
cy.contains('Delete').closest('.product-card')
```

### 7.2 Children and Descendants

```javascript
// Get direct children
cy.get('ul').children()
cy.get('.parent').children('.item')

// Get all descendants
cy.get('form').find('input')
cy.get('.container').find('button')
```

### 7.3 Siblings

```javascript
// Get all siblings
cy.get('.active-tab').siblings()

// Get next sibling
cy.get('label').next()
cy.get('label').next('input')

// Get previous sibling
cy.get('input').prev('label')

// Get all next siblings
cy.get('.first-item').nextAll()
```

---
