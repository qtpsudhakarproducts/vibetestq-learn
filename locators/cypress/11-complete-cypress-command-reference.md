## Chapter 11: Complete Cypress Command Reference

### 11.1 Querying Commands

| Command | Description | Example |
| --- | --- | --- |
| `cy.get()` | Get elements by selector | `cy.get('.button')` |
| `cy.contains()` | Get element containing text | `cy.contains('Submit')` |
| `cy.within()` | Scope commands to element | `cy.get('.form').within(...)` |
| `cy.find()` | Get descendants | `cy.get('.parent').find('.child')` |
| `cy.children()` | Get direct children | `cy.get('ul').children()` |
| `cy.parent()` | Get parent | `cy.get('button').parent()` |
| `cy.parents()` | Get ancestors | `cy.get('span').parents()` |
| `cy.closest()` | Get closest ancestor | `cy.get('input').closest('form')` |
| `cy.siblings()` | Get siblings | `cy.get('.item').siblings()` |
| `cy.next()` | Get next sibling | `cy.get('label').next()` |
| `cy.prev()` | Get previous sibling | `cy.get('input').prev()` |

### 11.2 Filtering Commands

| Command | Description | Example |
| --- | --- | --- |
| `cy.filter()` | Filter elements | `cy.get('.item').filter('.active')` |
| `cy.not()` | Exclude elements | `cy.get('button').not(':disabled')` |
| `cy.eq()` | Get element at index | `cy.get('li').eq(2)` |
| `cy.first()` | Get first element | `cy.get('button').first()` |
| `cy.last()` | Get last element | `cy.get('button').last()` |

### 11.3 Action Commands

| Command | Description | Example |
| --- | --- | --- |
| `cy.click()` | Click element | `cy.get('button').click()` |
| `cy.type()` | Type into input | `cy.get('input').type('text')` |
| `cy.clear()` | Clear input | `cy.get('input').clear()` |
| `cy.check()` | Check checkbox/radio | `cy.get('[type="checkbox"]').check()` |
| `cy.uncheck()` | Uncheck checkbox | `cy.get('[type="checkbox"]').uncheck()` |
| `cy.select()` | Select dropdown option | `cy.get('select').select('option1')` |
| `cy.selectFile()` | Select file(s) | `cy.get('[type="file"]').selectFile('file.pdf')` |

---
