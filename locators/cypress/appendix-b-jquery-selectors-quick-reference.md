## Appendix B: jQuery Selectors Quick Reference

| Selector | Description | Example |
| --- | --- | --- |
| `:visible` | Visible elements | `cy.get('button:visible')` |
| `:hidden` | Hidden elements | `cy.get('input:hidden')` |
| `:enabled` | Enabled elements | `cy.get('input:enabled')` |
| `:disabled` | Disabled elements | `cy.get('button:disabled')` |
| `:checked` | Checked inputs | `cy.get('input:checked')` |
| `:first` | First element | `cy.get('li:first')` |
| `:last` | Last element | `cy.get('li:last')` |
| `:eq(n)` | Element at index | `cy.get('li:eq(2)')` |
| `:contains(text)` | Contains text | `cy.get('div:contains("Welcome")')` |
| `:not(selector)` | Not matching | `cy.get('input:not(:disabled)')` |

---
