## Appendix D: Migration from Selenium

| Selenium | Cypress |
| --- | --- |
| `driver.findElement(By.id("id"))` | `cy.get('#id')` |
| `driver.findElement(By.className("class"))` | `cy.get('.class')` |
| `element.click()` | `cy.get('element').click()` |
| `element.sendKeys("text")` | `cy.get('element').type('text')` |
| `element.getText()` | `cy.get('element').invoke('text')` |
| `new WebDriverWait()` | Automatic waiting |

---
