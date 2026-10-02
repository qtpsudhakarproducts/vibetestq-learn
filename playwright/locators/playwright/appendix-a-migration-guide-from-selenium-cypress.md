## Appendix A: Migration Guide from Selenium/Cypress

### From Selenium to Playwright

**Element Location:**

```javascript
// Selenium
driver.findElement(By.id("username")).sendKeys("admin");
driver.findElement(By.cssSelector(".submit-btn")).click();

// Playwright
await page.getByLabel('Username').fill('admin');
await page.getByRole('button', { name: 'Submit' }).click();
```

**Waits:**

```javascript
// Selenium
WebDriverWait wait = new WebDriverWait(driver, 10);
wait.until(ExpectedConditions.visibilityOfElementLocated(By.id("result")));

// Playwright (automatic)
await page.getByTestId('result').waitFor({ state: 'visible' });
// Or just interact - auto-waits
await page.getByTestId('result').click();
```

**Assertions:**

```javascript
// Selenium + JUnit
String text = driver.findElement(By.id("message")).getText();
assertEquals("Success", text);

// Playwright
await expect(page.getByTestId('message')).toHaveText('Success');
```

### From Cypress to Playwright

**Element Selection:**

```javascript
// Cypress
cy.get('[data-cy="username"]').type('admin');
cy.contains('Submit').click();

// Playwright
await page.getByTestId('username').fill('admin');
await page.getByRole('button', { name: 'Submit' }).click();
```

**Chaining:**

```javascript
// Cypress
cy.get('.product-card')
  .find('button')
  .contains('Add to Cart')
  .click();

// Playwright
await page
  .locator('.product-card')
  .getByRole('button', { name: 'Add to Cart' })
  .click();
```

**Assertions:**

```javascript
// Cypress
cy.get('.message').should('be.visible');
cy.get('.message').should('contain', 'Success');

// Playwright
await expect(page.locator('.message')).toBeVisible();
await expect(page.locator('.message')).toContainText('Success');
```

---