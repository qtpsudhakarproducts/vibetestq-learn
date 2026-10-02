# Complete Locator Comparison: XPath vs CSS Selectors vs Playwright

## Side-by-Side Comparison for Common Scenarios

### 1. Basic Element Selection

#### By ID
```
HTML: <input id="username" type="text">

XPath:        //input[@id='username']
              //*[@id='username']
CSS:          #username
              input#username
Playwright:   page.locator('#username')
              page.getByTestId('username')  // if data-testid present
```

#### By Class Name
```
HTML: <button class="btn-primary">Submit</button>

XPath:        //button[@class='btn-primary']
              //button[contains(@class,'btn-primary')]  // partial match
CSS:          .btn-primary
              button.btn-primary
Playwright:   page.locator('.btn-primary')
              page.getByRole('button', { name: 'Submit' })  // preferred
```

#### By Name Attribute
```
HTML: <input name="email" type="email">

XPath:        //input[@name='email']
CSS:          [name="email"]
              input[name="email"]
Playwright:   page.locator('[name="email"]')
              page.getByLabel('Email')  // if label present
```

#### By Type Attribute
```
HTML: <input type="password">

XPath:        //input[@type='password']
CSS:          input[type="password"]
Playwright:   page.locator('input[type="password"]')
              page.getByRole('textbox')  // for type="text"
```

#### By Tag Name
```
HTML: <button>Click Me</button>

XPath:        //button
              //button[text()='Click Me']
CSS:          button
Playwright:   page.locator('button')
              page.getByRole('button', { name: 'Click Me' })  // preferred
```

### 2. Text Content Selection

#### Exact Text Match
```
HTML: <button>Submit Form</button>

XPath:        //button[text()='Submit Form']
              //button[.='Submit Form']
CSS:          N/A (cannot select by text)
Playwright:   page.getByText('Submit Form')
              page.getByRole('button', { name: 'Submit Form' })
```

#### Partial Text Match
```
HTML: <div>Welcome, John Smith!</div>

XPath:        //div[contains(text(),'Welcome')]
              //div[contains(text(),'John')]
CSS:          N/A
Playwright:   page.getByText('Welcome', { exact: false })
              page.getByText(/Welcome.*John/)
```

#### Normalized Text (Ignoring Whitespace)
```
HTML: <p>  Hello   World  </p>

XPath:        //p[normalize-space()='Hello World']
CSS:          N/A
Playwright:   page.getByText('Hello World')  // auto-normalizes
```

### 3. Multiple Attributes

#### AND Condition
```
HTML: <input id="search" type="text" class="form-control">

XPath:        //input[@id='search' and @type='text']
              //input[@id='search'][@type='text']
CSS:          input#search[type="text"]
              input[id="search"][type="text"]
Playwright:   page.locator('input#search[type="text"]')
```

#### OR Condition
```
HTML: <button id="submit" class="btn">Submit</button>
      <button id="cancel" class="btn">Cancel</button>

XPath:        //button[@id='submit' or @id='cancel']
CSS:          #submit, #cancel
              button#submit, button#cancel
Playwright:   page.locator('#submit, #cancel')
              page.getByRole('button', { name: /Submit|Cancel/ })
```

### 4. Partial Attribute Matching

#### Starts With
```
HTML: <input id="user-input-123">

XPath:        //input[starts-with(@id,'user-')]
CSS:          input[id^="user-"]
Playwright:   page.locator('input[id^="user-"]')
```

#### Ends With
```
HTML: <img src="image.png">

XPath:        N/A in XPath 1.0
CSS:          img[src$=".png"]
Playwright:   page.locator('img[src$=".png"]')
```

#### Contains
```
HTML: <div class="btn btn-primary btn-lg">

XPath:        //div[contains(@class,'btn-primary')]
CSS:          div[class*="primary"]
              .btn-primary
Playwright:   page.locator('.btn-primary')
              page.locator('[class*="primary"]')
```

### 5. Parent-Child Relationships

#### Direct Child
```
HTML: <div id="form">
          <input type="text">
      </div>

XPath:        //div[@id='form']/input
CSS:          div#form > input
Playwright:   page.locator('div#form > input')
```

#### Any Descendant
```
HTML: <div id="container">
          <div>
              <input type="text">
          </div>
      </div>

XPath:        //div[@id='container']//input
CSS:          div#container input
Playwright:   page.locator('div#container input')
```

#### Navigate to Parent
```
HTML: <div class="form-group">
          <input id="username">
      </div>

XPath:        //input[@id='username']/..
              //input[@id='username']/parent::div
CSS:          N/A (cannot traverse up)
Playwright:   page.locator('#username').locator('..')
              page.locator('#username').locator('xpath=..')
```

### 6. Sibling Relationships

#### Following Sibling
```
HTML: <label for="username">Username:</label>
      <input id="username" type="text">

XPath:        //label[@for='username']/following-sibling::input
CSS:          label[for="username"] + input
              label[for="username"] ~ input
Playwright:   page.locator('label[for="username"] + input')
              page.getByLabel('Username')  // preferred
```

#### Preceding Sibling
```
HTML: <input id="username">
      <label for="username">Username:</label>

XPath:        //input[@id='username']/preceding-sibling::label
CSS:          N/A (cannot select preceding siblings)
Playwright:   page.locator('input#username').locator('xpath=preceding-sibling::label')
```

#### All Following Siblings
```
HTML: <label>Select:</label>
      <input type="radio" name="choice" value="1">
      <input type="radio" name="choice" value="2">
      <input type="radio" name="choice" value="3">

XPath:        //label[text()='Select:']/following-sibling::input
CSS:          label ~ input[type="radio"]
Playwright:   page.locator('label:has-text("Select") ~ input[type="radio"]')
```

### 7. Position-Based Selection

#### First Element
```
HTML: <ul>
          <li>First</li>
          <li>Second</li>
          <li>Third</li>
      </ul>

XPath:        (//li)[1]
              //li[position()=1]
CSS:          li:first-child
              li:first-of-type
Playwright:   page.locator('li').first()
              page.locator('li:first-child')
```

#### Last Element
```
HTML: Same as above

XPath:        (//li)[last()]
              //li[position()=last()]
CSS:          li:last-child
              li:last-of-type
Playwright:   page.locator('li').last()
              page.locator('li:last-child')
```

#### Nth Element
```
HTML: Same as above

XPath:        (//li)[2]
              //li[position()=2]
CSS:          li:nth-child(2)
              li:nth-of-type(2)
Playwright:   page.locator('li').nth(1)  // 0-indexed
              page.locator('li:nth-child(2)')
```

#### Even/Odd Elements
```
HTML: Multiple <li> elements

XPath:        //li[position() mod 2 = 0]  // even
              //li[position() mod 2 = 1]  // odd
CSS:          li:nth-child(even)
              li:nth-child(odd)
Playwright:   page.locator('li:nth-child(even)')
              page.locator('li:nth-child(odd)')
```

### 8. Table Handling

#### Cell in Specific Row and Column
```
HTML: <table>
          <tr>
              <td>Row1Col1</td>
              <td>Row1Col2</td>
          </tr>
          <tr>
              <td>Row2Col1</td>
              <td>Row2Col2</td>
          </tr>
      </table>

XPath:        //table//tr[2]//td[2]
              (//table//tr)[2]//td[2]
CSS:          table tr:nth-child(2) td:nth-child(2)
Playwright:   page.locator('table tr:nth-child(2) td:nth-child(2)')
              page.getByRole('cell', { name: 'Row2Col2' })
```

#### Row Containing Specific Text
```
HTML: <table>
          <tr><td>John</td><td>Doe</td></tr>
          <tr><td>Jane</td><td>Smith</td></tr>
      </table>

XPath:        //tr[td[text()='John']]
              //tr[contains(.,'John')]
CSS:          N/A (cannot filter by text)
Playwright:   page.getByRole('row', { name: /John/ })
              page.locator('tr:has-text("John")')
```

#### All Cells in Row
```
HTML: Same as above

XPath:        //tr[td[text()='John']]/td
CSS:          tr:has(td:contains("John")) td  // :has not widely supported
Playwright:   page.locator('tr:has-text("John") td')
```

### 9. Form Elements

#### Checkbox (Checked/Unchecked)
```
HTML: <input type="checkbox" id="agree" checked>

XPath:        //input[@type='checkbox' and @checked]  // checked
              //input[@type='checkbox' and not(@checked)]  // unchecked
CSS:          input[type="checkbox"]:checked
              input[type="checkbox"]:not(:checked)
Playwright:   page.locator('input[type="checkbox"]:checked')
              page.getByRole('checkbox', { checked: true })
```

#### Radio Button by Value
```
HTML: <input type="radio" name="gender" value="male">
      <input type="radio" name="gender" value="female">

XPath:        //input[@type='radio' and @value='male']
CSS:          input[type="radio"][value="male"]
Playwright:   page.locator('input[type="radio"][value="male"]')
              page.getByRole('radio', { name: 'Male' })
```

#### Select Dropdown Option
```
HTML: <select id="country">
          <option value="US">United States</option>
          <option value="UK">United Kingdom</option>
      </select>

XPath:        //select[@id='country']//option[@value='US']
              //select[@id='country']//option[text()='United States']
CSS:          select#country option[value="US"]
Playwright:   page.locator('select#country')
              page.getByRole('combobox').selectOption('US')
```

#### Enabled/Disabled Inputs
```
HTML: <input type="text" id="name" disabled>
      <input type="text" id="email">

XPath:        //input[@disabled]  // disabled
              //input[not(@disabled)]  // enabled
CSS:          input:disabled
              input:enabled
Playwright:   page.locator('input:disabled')
              page.getByRole('textbox', { disabled: true })
```

### 10. Dynamic and Conditional Selection

#### Elements with Specific Child Count
```
HTML: <ul>
          <li>Item</li>
          <li>Item</li>
          <li>Item</li>
      </ul>

XPath:        //ul[count(li)=3]
CSS:          ul:has(li:nth-child(3):last-child)  // complex
Playwright:   page.locator('ul').filter({ has: page.locator('li') })
```

#### Elements Containing Specific Child
```
HTML: <div class="card">
          <span class="badge">New</span>
          <h3>Product</h3>
      </div>

XPath:        //div[@class='card' and .//span[@class='badge']]
CSS:          div.card:has(span.badge)
Playwright:   page.locator('div.card:has(span.badge)')
              page.locator('div.card').filter({ has: page.locator('.badge') })
```

#### Exclude Elements
```
HTML: <button class="btn">Normal</button>
      <button class="btn hidden">Hidden</button>

XPath:        //button[not(contains(@class,'hidden'))]
CSS:          button:not(.hidden)
Playwright:   page.locator('button:not(.hidden)')
              page.locator('button').filter({ hasNot: page.locator('.hidden') })
```

### 11. Visibility and Display

#### Only Visible Elements
```
HTML: <div style="display:none">Hidden</div>
      <div>Visible</div>

XPath:        //div[not(contains(@style,'display: none'))]
              //div[not(ancestor-or-self::*[contains(@style,'display: none')])]
CSS:          div:not([style*="display: none"])  // limited
Playwright:   page.locator('div >> visible=true')
              page.locator('div').filter({ hasNotText: /./ }) // complex
              await page.locator('div').isVisible()  // programmatic check
```

#### Hidden Elements
```
HTML: Same as above

XPath:        //div[contains(@style,'display: none')]
CSS:          div[style*="display: none"]
Playwright:   page.locator('div').filter({ hasNot: page.locator(':visible') })
```

### 12. Shadow DOM

#### Element Inside Shadow Root
```
HTML: <custom-element>
          #shadow-root (open)
              <button id="btn">Click</button>
      </custom-element>

XPath:        ❌ Cannot penetrate Shadow DOM

CSS:          ⚠️ DEPENDS ON CONTEXT:
              
              Standard CSS (Browser):
              ❌ Cannot pierce shadow DOM
              document.querySelector('custom-element button')  // Won't work
              
              Selenium CSS:
              ❌ Cannot pierce - Requires PROGRAMMATIC approach:
              WebElement host = driver.findElement(By.cssSelector("custom-element"));
              SearchContext shadow = host.getShadowRoot();  // Manual step
              shadow.findElement(By.cssSelector("button"))  // Then search inside
              
              Playwright CSS:
              ✅ DIRECT LOCATOR - Automatically pierces:
              custom-element button
              custom-element #btn

Playwright:   ✅ DIRECT LOCATOR APPROACH (Automatic Shadow Piercing):
              
              page.locator('custom-element button')  // Auto-pierces!
              page.locator('custom-element #btn')
              page.locator('custom-element').getByRole('button')  // Best - semantic
              
              // Legacy >>> syntax (still works but not needed):
              page.locator('custom-element >>> #btn')
              
              // Nested shadow DOM - still simple:
              page.locator('app-root custom-card button')  // Auto-pierces multiple levels!
```

**Critical Understanding:**

**Standard CSS** (in browsers) **CANNOT pierce Shadow DOM**. The shadow boundary is intentional encapsulation.

**Two Approaches to Handle Shadow DOM:**

1. **Programmatic Approach** (Selenium, Puppeteer, vanilla JS):
   - Write code to manually access shadow root
   - Multi-step process
   - Complex for nested shadow DOM
   
   ```java
   // Selenium - Manual steps required
   WebElement host = driver.findElement(By.cssSelector("custom-element"));
   SearchContext shadowRoot = host.getShadowRoot();  // Programmatic
   WebElement button = shadowRoot.findElement(By.cssSelector("button"));
   button.click();
   ```

2. **Direct Locator Approach** (Playwright):
   - Single locator string pierces automatically
   - Framework handles shadow traversal
   - Works seamlessly with nested shadow DOM
   
   ```javascript
   // Playwright - Automatic piercing
   await page.locator('custom-element button').click()
   ```

**Winner:** Playwright's direct locator approach - treats Shadow DOM like regular DOM!

---

## Understanding: Programmatic vs Direct Locator Approaches

This is a **fundamental concept** that differentiates Playwright from traditional frameworks:

### Programmatic Approach (Selenium, Puppeteer)

You write **code logic** to navigate through DOM boundaries:

```java
// Selenium - Shadow DOM (Programmatic)
WebElement shadowHost = driver.findElement(By.cssSelector("custom-element"));
SearchContext shadowRoot = shadowHost.getShadowRoot();  // Manual code step
WebElement button = shadowRoot.findElement(By.cssSelector("button"));
button.click();

// Selenium - iFrame (Programmatic)  
driver.switchTo().frame("payment");  // Manual switch
driver.findElement(By.id("cardNumber")).sendKeys("1234");
driver.switchTo().defaultContent();  // Manual switch back
```

**Characteristics:**
- ❌ Selector alone doesn't work across boundaries
- ✅ Requires explicit code (`.getShadowRoot()`, `.switchTo()`)
- ⚠️ Multi-step process
- 🐛 Error-prone (stale elements, forgetting to switch back)

### Direct Locator Approach (Playwright)

The **locator string** handles boundaries automatically:

```javascript
// Playwright - Shadow DOM (Direct Locator)
await page.locator('custom-element button').click()
// Single locator! Framework handles shadow piercing

// Playwright - iFrame (Direct Locator)
await page.frameLocator('#payment').locator('#cardNumber').fill('1234')
// Single chain! Framework handles frame switching
```

**Characteristics:**
- ✅ Locator handles boundaries transparently  
- ✅ No manual code for traversal
- ✅ Simple syntax even for nested structures
- 🎯 Framework abstracts complexity

### Real Example: Nested Shadow DOM

**HTML:**
```html
<app-root>
  #shadow-root
    <custom-card>
      #shadow-root
        <button>Click</button>
```

**Selenium (6 steps):**
```java
WebElement host1 = driver.findElement(By.cssSelector("app-root"));
SearchContext shadow1 = host1.getShadowRoot();
WebElement host2 = shadow1.findElement(By.cssSelector("custom-card"));
SearchContext shadow2 = host2.getShadowRoot();
WebElement button = shadow2.findElement(By.cssSelector("button"));
button.click();
```

**Playwright (1 step):**
```javascript
await page.locator('app-root custom-card button').click()
```

### Impact on Page Objects

**Selenium (Verbose):**
```java
public void clickButton() {
    WebElement host = driver.findElement(By.cssSelector("app-root"));
    SearchContext shadow = host.getShadowRoot();
    shadow.findElement(By.cssSelector("button")).click();
}
```

**Playwright (Clean):**
```javascript
async clickButton() {
    await this.page.locator('app-root button').click();
}
```

**The Innovation:** Playwright makes Shadow DOM and iFrames feel like regular DOM!

---

### 13. IFrames

#### Element Inside IFrame
```
HTML: <iframe id="payment">
          <input id="cardNumber">
      </iframe>

XPath:        //iframe[@id='payment']  // then switch context
              Then: //input[@id='cardNumber']
CSS:          iframe#payment  // then switch context
              Then: input#cardNumber
Playwright:   const frame = page.frame({ name: 'payment' });
              await frame.locator('#cardNumber').fill('1234');
              OR
              await page.frameLocator('#payment').locator('#cardNumber').fill('1234');
```

### 14. Complex Combinations

#### Product Card with Specific Name - Get Price
```
HTML: <div class="product-card">
          <h3>iPhone 15</h3>
          <span class="price">$999</span>
          <button>Add to Cart</button>
      </div>

XPath:        //div[@class='product-card' and .//h3[text()='iPhone 15']]//span[@class='price']
CSS:          N/A (cannot filter by text content of child)
Playwright:   page.locator('.product-card', { has: page.getByRole('heading', { name: 'iPhone 15' }) })
                 .locator('.price')
              OR
              page.locator('.product-card:has(h3:has-text("iPhone 15")) .price')
```

#### Table Row with Specific User - Click Edit
```
HTML: <tr>
          <td>John Smith</td>
          <td>john@example.com</td>
          <td><button class="btn-edit">Edit</button></td>
      </tr>

XPath:        //tr[td[text()='John Smith']]//button[@class='btn-edit']
CSS:          N/A
Playwright:   page.getByRole('row', { name: /John Smith/ })
                 .getByRole('button', { name: 'Edit' })
```

#### Modal with Specific Title - Click Confirm
```
HTML: <div class="modal">
          <h2 class="modal-title">Delete Item</h2>
          <button class="btn-confirm">Confirm</button>
      </div>

XPath:        //div[@class='modal' and .//h2[text()='Delete Item']]//button[@class='btn-confirm']
CSS:          N/A
Playwright:   page.getByRole('dialog', { name: 'Delete Item' })
                 .getByRole('button', { name: 'Confirm' })
```

---

### 15. State-Based Element Selection

State-based selection is crucial for testing form validation, UI states, and interactive elements.

#### Enabled vs Disabled Elements

```
HTML: <button id="submit" type="submit">Submit</button>
      <button id="cancel" type="button" disabled>Cancel</button>

XPath:        // Enabled elements
              //button[not(@disabled)]
              //input[not(@disabled)]
              
              // Disabled elements
              //button[@disabled]
              //input[@disabled]

CSS:          // Enabled
              button:enabled
              input:enabled
              
              // Disabled
              button:disabled
              input:disabled

Playwright:   // Enabled (locator)
              page.locator('button:enabled')
              page.locator('input:enabled')
              
              // Disabled (locator)
              page.locator('button:disabled')
              page.locator('input:disabled')
              
              // Best - using getByRole with state
              page.getByRole('button', { name: 'Submit', disabled: false })
              page.getByRole('button', { name: 'Cancel', disabled: true })
              
              // Assertions (recommended for checking state)
              await expect(page.getByRole('button', { name: 'Submit' })).toBeEnabled()
              await expect(page.getByRole('button', { name: 'Cancel' })).toBeDisabled()
```

#### Checked vs Unchecked (Checkboxes/Radio Buttons)

```
HTML: <input type="checkbox" id="agree" checked>
      <input type="checkbox" id="newsletter">
      <input type="radio" name="gender" value="male" checked>
      <input type="radio" name="gender" value="female">

XPath:        // Checked
              //input[@type='checkbox' and @checked]
              //input[@type='radio' and @checked]
              
              // Unchecked
              //input[@type='checkbox' and not(@checked)]
              //input[@type='radio' and not(@checked)]

CSS:          // Checked
              input[type="checkbox"]:checked
              input[type="radio"]:checked
              
              // Unchecked
              input[type="checkbox"]:not(:checked)
              input[type="radio"]:not(:checked)

Playwright:   // Checked (locator)
              page.locator('input[type="checkbox"]:checked')
              page.locator('input[type="radio"]:checked')
              
              // Unchecked (locator)
              page.locator('input[type="checkbox"]:not(:checked)')
              
              // Best - using getByRole with state
              page.getByRole('checkbox', { name: 'Agree', checked: true })
              page.getByRole('checkbox', { name: 'Newsletter', checked: false })
              page.getByRole('radio', { name: 'Male', checked: true })
              
              // Assertions (recommended)
              await expect(page.getByRole('checkbox', { name: 'Agree' })).toBeChecked()
              await expect(page.getByRole('checkbox', { name: 'Newsletter' })).not.toBeChecked()
```

#### Required vs Optional Fields

```
HTML: <input type="text" id="username" required>
      <input type="email" id="email">

XPath:        // Required
              //input[@required]
              
              // Optional (no required attribute)
              //input[not(@required)]

CSS:          // Required
              input:required
              
              // Optional
              input:optional

Playwright:   // Required (locator)
              page.locator('input:required')
              
              // Optional (locator)
              page.locator('input:optional')
              
              // Best - semantic locators don't need state
              page.getByLabel('Username')  // Just use the label
```

#### Valid vs Invalid Form Fields

```
HTML: <input type="email" id="email" value="invalid-email">
      <input type="email" id="valid-email" value="user@example.com">

XPath:        N/A - XPath cannot check validation state

CSS:          // Valid
              input:valid
              
              // Invalid
              input:invalid

Playwright:   // Valid (locator)
              page.locator('input:valid')
              
              // Invalid (locator)
              page.locator('input:invalid')
              
              // Best - use for validation testing
              await expect(page.locator('input#email')).toHaveClass(/invalid/)
              await page.locator('input:invalid').count()  // Count invalid fields
```

#### Read-Only vs Editable Fields

```
HTML: <input type="text" id="readonly-field" readonly value="Cannot edit">
      <input type="text" id="editable-field" value="Can edit">

XPath:        // Read-only
              //input[@readonly]
              
              // Editable (not read-only)
              //input[not(@readonly)]

CSS:          // Read-only
              input:read-only
              
              // Editable
              input:read-write

Playwright:   // Read-only (locator)
              page.locator('input:read-only')
              
              // Editable (locator)
              page.locator('input:read-write')
              
              // Assertions
              await expect(page.locator('#readonly-field')).not.toBeEditable()
              await expect(page.locator('#editable-field')).toBeEditable()
```

#### Focused Elements

```
HTML: <input type="text" id="search" autofocus>

XPath:        N/A - Cannot detect focus state with XPath

CSS:          input:focus

Playwright:   // Focus pseudo-class
              page.locator('input:focus')
              
              // Assertion (best for testing focus)
              await expect(page.locator('#search')).toBeFocused()
              
              // Action to focus
              await page.locator('#search').focus()
```

#### In-Range vs Out-of-Range (Number/Date Inputs)

```
HTML: <input type="number" id="quantity" min="1" max="10" value="5">
      <input type="number" id="invalid-qty" min="1" max="10" value="15">

XPath:        N/A - Cannot check range validation

CSS:          // In range
              input:in-range
              
              // Out of range
              input:out-of-range

Playwright:   // In range (locator)
              page.locator('input:in-range')
              
              // Out of range (locator)
              page.locator('input:out-of-range')
              
              // Best - for form validation testing
              await expect(page.locator('#quantity')).toHaveClass(/valid/)
```

**When to Use State-Based Selection:**

✅ **Use XPath/CSS pseudo-classes when:**
- Filtering elements by state before interaction
- Counting elements in specific states
- Selecting "all enabled buttons" or "all checked checkboxes"

✅ **Use Playwright assertions when:**
- Verifying element state (toBeEnabled, toBeChecked, toBeFocused)
- Test expectations (state should be X)
- Auto-waiting for state changes

✅ **Use getByRole with state when:**
- Semantic selection with state filtering
- Accessibility-first approach
- Combining role + state in one locator

**Winner for State Selection:** Playwright pseudo-classes + assertions - flexible locators with powerful state verification!

---

### 16. Advanced Filtering and Selection Techniques

These patterns handle complex DOM scenarios and edge cases.

#### Empty vs Non-Empty Elements

```
HTML: <div id="empty-div"></div>
      <div id="with-content">Has content</div>
      <ul id="empty-list"></ul>
      <ul id="with-items"><li>Item</li></ul>

XPath:        // Empty (no child nodes)
              //div[not(node())]
              //div[normalize-space()='']
              
              // Not empty (has content)
              //div[node()]
              //div[normalize-space()!='']

CSS:          // Empty
              div:empty
              
              // Not empty
              div:not(:empty)

Playwright:   // Empty (locator)
              page.locator('div:empty')
              
              // Not empty (locator)
              page.locator('div:not(:empty)')
              
              // Best - use for validation
              await expect(page.locator('#empty-list')).toBeEmpty()
              const emptyDivs = await page.locator('div:empty').count()
```

#### Elements with Specific Child Count

```
HTML: <ul id="three-items">
          <li>Item 1</li>
          <li>Item 2</li>
          <li>Item 3</li>
      </ul>

XPath:        // Exactly 3 children
              //ul[count(li)=3]
              
              // More than 2 children
              //ul[count(li)>2]
              
              // At least one child
              //ul[count(li)>=1]

CSS:          // Has exactly 3 children (complex)
              ul:has(li:nth-child(3):last-child)
              
              // Simpler: just check if 3rd exists and is last
              ul li:nth-child(3):last-child

Playwright:   // Count assertion (best approach)
              await expect(page.locator('#three-items li')).toHaveCount(3)
              
              // Filter by count
              const lists = await page.locator('ul').all()
              for (const list of lists) {
                  const count = await list.locator('li').count()
                  if (count === 3) {
                      await list.click()
                      break
                  }
              }
```

#### Multiple Class Matching

```
HTML: <button class="btn btn-primary btn-large active">Submit</button>

XPath:        // Has ALL these classes (order doesn't matter)
              //button[contains(@class,'btn') and contains(@class,'primary')]
              
              // Exact class match (fragile - order matters)
              //button[@class='btn btn-primary btn-large active']
              
              // Has specific class (safe)
              //button[contains(concat(' ',@class,' '),' btn-primary ')]

CSS:          // Has all classes (order doesn't matter)
              button.btn.btn-primary.btn-large.active
              
              // Just specific classes
              button.btn.primary
              
              // Has at least one class
              button.btn-primary

Playwright:   // Multiple classes (locator)
              page.locator('button.btn.primary')
              
              // Best - semantic, ignores classes
              page.getByRole('button', { name: 'Submit' })
              
              // Filter approach
              page.locator('button')
                  .filter({ hasClass: 'btn-primary' })  // Not standard, use CSS
              page.locator('button.btn-primary')
```

#### Excluding Elements by Class

```
HTML: <button class="btn">Normal</button>
      <button class="btn disabled">Disabled</button>
      <button class="btn hidden">Hidden</button>

XPath:        // Exclude specific class
              //button[not(contains(@class,'disabled'))]
              //button[not(contains(@class,'hidden'))]
              
              // Exclude multiple classes
              //button[not(contains(@class,'disabled')) and not(contains(@class,'hidden'))]

CSS:          // Exclude class
              button:not(.disabled)
              button:not(.hidden)
              
              // Exclude multiple
              button:not(.disabled):not(.hidden)

Playwright:   // Exclude class (locator)
              page.locator('button:not(.disabled)')
              page.locator('button:not(.hidden)')
              
              // Exclude multiple
              page.locator('button:not(.disabled):not(.hidden)')
              
              // Best - filter approach
              page.locator('button')
                  .filter({ hasNotText: 'Disabled' })
                  .filter({ hasNotText: 'Hidden' })
```

#### Union (OR) - Matching Multiple Conditions

```
HTML: <button id="save">Save</button>
      <button id="submit">Submit</button>
      <a id="cancel">Cancel</a>

XPath:        // Match save OR submit button
              //button[@id='save'] | //button[@id='submit']
              
              // Match button OR link
              //button | //a

CSS:          // Multiple selectors (comma)
              #save, #submit
              button, a

Playwright:   // OR operator (best)
              page.locator('#save').or(page.locator('#submit'))
              page.getByRole('button').or(page.getByRole('link'))
              
              // CSS grouping
              page.locator('#save, #submit')
              page.locator('button, a')
```

#### Intersection (AND) - Multiple Conditions

```
HTML: <button class="primary" type="submit">Submit</button>

XPath:        // Button with both attributes
              //button[@class='primary' and @type='submit']
              //button[@class='primary'][@type='submit']

CSS:          // Multiple attribute selectors
              button.primary[type="submit"]
              button[class="primary"][type="submit"]

Playwright:   // AND operator (best)
              page.locator('button.primary')
                  .and(page.locator('[type="submit"]'))
              
              // CSS combination
              page.locator('button.primary[type="submit"]')
```

#### Filter by Has/HasNot Child Element

```
HTML: <div class="card">
          <img src="product.jpg">
          <h3>Product Name</h3>
      </div>
      <div class="card">
          <h3>No Image Product</h3>
      </div>

XPath:        // Has child img
              //div[@class='card' and .//img]
              
              // Does NOT have img
              //div[@class='card' and not(.//img)]

CSS:          // Has img
              div.card:has(img)
              
              // Does NOT have img
              div.card:not(:has(img))

Playwright:   // Has img (pseudo-class)
              page.locator('div.card:has(img)')
              
              // Has img (filter - best)
              page.locator('div.card')
                  .filter({ has: page.locator('img') })
              
              // Does NOT have img
              page.locator('div.card:not(:has(img))')
              page.locator('div.card')
                  .filter({ hasNot: page.locator('img') })
```

#### Filter by Text Content

```
HTML: <div class="card">Product A - In Stock</div>
      <div class="card">Product B - Sold Out</div>
      <div class="card">Product C - In Stock</div>

XPath:        // Contains "In Stock"
              //div[@class='card' and contains(text(),'In Stock')]
              
              // Does NOT contain "Sold Out"
              //div[@class='card' and not(contains(text(),'Sold Out'))]

CSS:          N/A - Cannot filter by text

Playwright:   // Contains text (pseudo-class)
              page.locator('div.card:has-text("In Stock")')
              
              // Contains text (filter - best)
              page.locator('div.card')
                  .filter({ hasText: 'In Stock' })
              
              // Does NOT contain text
              page.locator('div.card')
                  .filter({ hasNotText: 'Sold Out' })
              
              // Regex matching
              page.locator('div.card')
                  .filter({ hasText: /In Stock|Available/ })
```

**When to Use Advanced Filtering:**

✅ **Empty/Not Empty:** Form validation, checking if lists populated
✅ **Child Count:** Grid layouts, pagination verification  
✅ **Multiple Classes:** Complex UI states, framework-generated classes
✅ **Excluding Elements:** Removing disabled/hidden from selection
✅ **Union (OR):** Flexible matching, fallback selectors
✅ **Intersection (AND):** Precise targeting, multiple criteria
✅ **Has/HasNot Child:** Component-based selection
✅ **Text Filtering:** Dynamic content, search results

**Winner for Advanced Filtering:** Playwright's `.filter()` method - most flexible and readable for complex scenarios!

---

## Performance Comparison

### Speed Rankings (Fastest to Slowest)

1. **ID** (all methods)
   - XPath: `//*[@id='username']`
   - CSS: `#username`
   - Playwright: `page.locator('#username')`

2. **CSS Selectors** (generally faster)
   - Native browser engine support
   - Optimized for rendering

3. **XPath with Axes** (slower)
   - More flexible but requires computation
   - Parent/sibling traversal adds overhead

4. **Complex Filters** (slowest)
   - Multiple conditions
   - Text matching
   - Descendant searches

### When Each Performs Best

**XPath Excels:**
- Parent navigation
- Sibling navigation (preceding)
- Text matching
- Complex boolean logic
- Flexibility in unknown structures

**CSS Excels:**
- Simple attribute matching
- Class and ID selection
- Child/descendant selection
- Pseudo-classes (enabled, disabled, checked)
- Native browser optimization

**Playwright Excels:**
- Auto-waiting for elements
- Retry logic built-in
- Accessibility-first locators
- Shadow DOM handling
- IFrame handling
- Modern web component support

## Maintenance and Readability

### Readability Score (1-10, 10 being most readable)

**Simple Scenarios:**
```
Select button by text "Submit"

Playwright: 10 - page.getByRole('button', { name: 'Submit' })
CSS:        N/A
XPath:      7  - //button[text()='Submit']
```

**Medium Complexity:**
```
Select input after label "Email"

Playwright: 10 - page.getByLabel('Email')
CSS:        7  - label:has-text("Email") + input
XPath:      8  - //label[text()='Email']/following-sibling::input
```

**High Complexity:**
```
Select Edit button in row containing "John Smith"

Playwright: 10 - page.getByRole('row', { name: /John/ }).getByRole('button', { name: 'Edit' })
CSS:        N/A
XPath:      6  - //tr[td[text()='John Smith']]//button[text()='Edit']
```

### Brittleness Assessment

**Most Brittle (Changes Break Easily):**
1. Complex CSS class combinations
2. Deep nested XPath paths
3. Position-based selectors (nth-child)
4. Style-dependent selectors

**Most Resilient:**
1. Playwright semantic locators (getByRole, getByLabel)
2. Data-testid attributes
3. ARIA attributes
4. Stable custom attributes

### Maintenance Cost

**Low Maintenance:**
- Playwright semantic locators
- Data-testid attributes
- ID selectors (when stable)

**Medium Maintenance:**
- CSS class selectors
- Name attributes
- Simple XPath

**High Maintenance:**
- Complex XPath with multiple axes
- Deep nested CSS selectors
- Position-based selectors
- Style-dependent selectors

## Recommendations by Use Case

### New Projects (Green Field)
1. **Playwright semantic locators** (getByRole, getByLabel)
2. Add `data-testid` attributes
3. Use CSS for simple cases
4. XPath only when needed (parent navigation)

### Legacy Projects
1. Keep existing locators if stable
2. Gradually migrate to Playwright
3. Use CSS where possible
4. XPath for complex scenarios

### Large Teams
1. Establish conventions
2. Prefer Playwright semantic locators
3. Document patterns
4. Code review for consistency

### Performance-Critical
1. Profile actual usage
2. Use CSS for simple cases
3. Optimize slow locators
4. Consider caching strategies

## Browser Compatibility

| Feature | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| Chrome | ✅ Full | ✅ Full | ✅ Full |
| Firefox | ✅ Full | ✅ Full | ✅ Full |
| Safari | ✅ Full | ✅ Full | ✅ Full |
| Edge | ✅ Full | ✅ Full | ✅ Full |
| IE11 | ✅ Full | ⚠️ Limited | ❌ Not Supported |
| Mobile Safari | ✅ Full | ✅ Full | ✅ Full |
| Mobile Chrome | ✅ Full | ✅ Full | ✅ Full |

**Notes:**
- IE11 lacks support for modern CSS selectors (`:has`, `:is`, etc.)
- Playwright drops IE11 support entirely
- XPath 1.0 is universally supported
- XPath 2.0/3.0 features not available in browsers

---

## Playwright's Exclusive Features

Playwright has many powerful features that go beyond standard XPath and CSS selectors:

### 1. Filter Methods (has, hasNot, hasText, hasNotText)

**filter({ has: locator })** - Find elements that contain specific child elements
```javascript
// Find product cards that have "Add to Cart" button
await page.locator('.product-card')
  .filter({ has: page.getByRole('button', { name: 'Add to Cart' }) })
  .first()
  .click()

// Find rows that have a specific cell
await page.locator('tr')
  .filter({ has: page.getByRole('cell', { name: 'John' }) })
  .getByRole('button', { name: 'Edit' })
  .click()
```

**filter({ hasNot: locator })** - Exclude elements that contain specific children
```javascript
// Find items that are NOT out of stock
await page.getByRole('listitem')
  .filter({ hasNot: page.getByText('Out of stock') })
  .count()
```

**filter({ hasText: string })** - Filter by text content
```javascript
// Find product by name
await page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Buy' })
  .click()
```

**XPath/CSS Equivalent:** Not available - would require complex custom logic

---

### 2. Logical Operators (and, or)

**locator.and()** - Match elements that satisfy BOTH conditions
```javascript
// Button that is both primary AND enabled
await page.locator('button')
  .and(page.locator('.primary'))
  .click()
```

**locator.or()** - Match elements that satisfy EITHER condition
```javascript
// Click either "Submit" or "Save" button
await page.getByRole('button', { name: 'Submit' })
  .or(page.getByRole('button', { name: 'Save' }))
  .click()
```

**XPath/CSS Equivalent:** Different behavior

---

### 3. Layout Pseudo-Classes (⚠️ Deprecated but still available)

**Note:** Layout selectors are deprecated. Prefer semantic locators.

**:right-of()**, **:left-of()**, **:above()**, **:below()**, **:near()**
```javascript
// Input to the right of "Username" label
await page.locator('input:right-of(:text("Username"))').fill('admin')
```

**XPath/CSS Equivalent:** Not available

---

### 4. Auto-Waiting and Retry Logic

Playwright automatically waits for elements to be actionable:
```javascript
// Waits automatically
await page.locator('#submit').click()
```

**XPath/CSS Equivalent:** Manual waiting required

---

### 5. Shadow DOM Piercing

Automatically pierces open shadow DOM:
```javascript
// Works through shadow boundaries automatically
await page.locator('custom-element button').click()
```

**XPath:** Cannot pierce shadow DOM  
**CSS:** Can pierce in Playwright context!

---

### 6. Frame Locators

Easy iframe handling:
```javascript
const frame = page.frameLocator('#payment-frame')
await frame.getByLabel('Card Number').fill('4111')
```

**XPath/CSS Equivalent:** Manual frame switching required

---

### 7. Chaining Different Locator Types

Mix CSS, semantic locators, and filters:
```javascript
await page
  .locator('.modal')                      // CSS
  .getByRole('dialog')                    // Semantic
  .getByLabel('Email')                    // Semantic
  .fill('user@example.com')
```

**XPath/CSS Equivalent:** Single selector type only

---

### 8. Rich Assertions

Auto-waiting assertions:
```javascript
await expect(page.locator('#status')).toHaveText('Success')
await expect(page.locator('button')).toBeEnabled()
await expect(page.locator('.items')).toHaveCount(5)
```

**XPath/CSS Equivalent:** Manual assertions

---

### 9. Strict Mode

Enforces single element matching:
```javascript
// ❌ Error if multiple buttons
await page.locator('button').click()

// ✅ Be explicit
await page.locator('button').first().click()
```

**XPath/CSS Equivalent:** Takes first silently

---

### 10. Accessibility-First Philosophy

Encourages accessible markup:
```javascript
await page.getByRole('button', { name: 'Submit' })
await page.getByLabel('Email Address')
// Tests become accessibility tests!
```

**XPath/CSS Equivalent:** No such encouragement

---

### Feature Comparison Summary

| Feature | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| Basic Selection | ✅ | ✅ | ✅ |
| Parent Navigation | ✅ | ❌ | ✅ (via XPath) |
| Text Matching | ✅ | ❌ | ✅ (better) |
| Filtering | ⚠️ Limited | ⚠️ Limited | ✅ Rich |
| has/hasNot | ❌ | ❌ | ✅ |
| Logical AND/OR | ⚠️ Different | ⚠️ Limited | ✅ |
| Layout Selectors | ❌ | ❌ | ✅ (deprecated) |
| Auto-waiting | ❌ | ❌ | ✅ |
| Shadow DOM | ❌ | ✅* | ✅ |
| Frame Handling | ⚠️ Manual | ⚠️ Manual | ✅ Auto |
| Chaining | ❌ | ❌ | ✅ |
| Semantic Locators | ❌ | ❌ | ✅ |
| Strict Mode | ❌ | ❌ | ✅ |
| Accessibility | ❌ | ❌ | ✅ |

*CSS can pierce shadow DOM in Playwright, not in standard CSS

---

## Final Recommendations

### Priority Order (Best to Worst)

**For New Playwright Projects:**
1. `page.getByRole()` - Most resilient
2. `page.getByLabel()` - Best for forms
3. `page.getByTestId()` - When you control markup
4. `page.getByText()` - For text content
5. CSS selectors - Simple attributes
6. XPath - Last resort (parent navigation only)

**For Selenium/Cypress Migration:**
1. Keep working locators
2. Add Playwright semantic locators
3. Migrate gradually
4. Test thoroughly

**General Principles:**
- ✅ Use semantic, user-facing identifiers
- ✅ Prefer accessibility attributes
- ✅ Add test IDs when needed
- ❌ Avoid implementation details (classes, structure)
- ❌ Avoid position-based selectors
- ❌ Avoid style-dependent selectors

Remember: **The best locator is one that:**
1. Uniquely identifies the element
2. Survives UI changes
3. Is readable by humans
4. Works across browsers
5. Performs adequately

---

## Appendix: Playwright Pseudo-Classes Complete Reference

Playwright extends CSS with powerful custom pseudo-classes that make element selection more expressive and reliable.

### Text Matching Pseudo-Classes

| Pseudo-Class | Behavior | Example |
|--------------|----------|---------|
| `:text("substring")` | Contains text (case-insensitive, normalized whitespace) | `page.locator('button:text("Submit")')` |
| `:text-is("exact")` | Exact text match (case-insensitive, normalized) | `page.locator('button:text-is("Submit")')` |
| `:text-matches("regex", "flags")` | Regex pattern matching | `page.locator('button:text-matches("^(Save\|Submit)$", "i")')` |
| `:has-text("substring")` | Element or any descendant contains text | `page.locator('article:has-text("Playwright")')` |

**Usage Examples:**

```javascript
// :text() - Contains substring (most common)
await page.locator('button:text("Submit")').click()
await page.locator('div:text("Welcome")').isVisible()

// :text-is() - Exact match (stricter)
await page.locator('button:text-is("Submit")').click()  // Won't match "Submit Form"
await page.locator('span:text-is("Active")').count()

// :text-matches() - Regex (most flexible)
await page.locator('button:text-matches("submit", "i")').click()  // Case-insensitive
await page.locator('div:text-matches("\\d+ items")').textContent()  // Match "5 items", "10 items"

// :has-text() - Search in descendants (powerful)
await page.locator('article:has-text("Breaking News")').click()
await page.locator('div.card:has-text("In Stock")').count()
```

**Important Notes:**
- All text matching is **case-insensitive** by default
- Whitespace is **automatically normalized** (multiple spaces → one space)
- `:text()` and `:text-is()` match direct text nodes
- `:has-text()` searches in descendants too

**When to Use:**
- ✅ `:text()` - Most cases, flexible substring matching
- ✅ `:text-is()` - When you need exact text to avoid false matches
- ✅ `:text-matches()` - Pattern matching, multiple variations
- ✅ `:has-text()` - When text might be in child elements

---

### Structural Pseudo-Classes

| Pseudo-Class | Behavior | Example |
|--------------|----------|---------|
| `:has(selector)` | Contains element matching selector | `page.locator('div:has(img)')` |
| `:is(sel1, sel2)` | Matches any of the selectors | `page.locator('button:is(:text("Login"), :text("Sign in"))')` |
| `:nth-match(selector, n)` | Nth element matching selector | `page.locator(':nth-match(.product, 3)')` |

**Usage Examples:**

```javascript
// :has() - Parent contains specific child
await page.locator('div:has(img)').click()  // Div containing image
await page.locator('article:has(h2:text("Title"))').click()  // Article with specific heading
await page.locator('div.card:has(span.badge)').count()  // Cards with badges

// :is() - Match any of multiple selectors
await page.locator('button:is(:text("Login"), :text("Sign in"))').click()
await page.locator(':is(button, a):text("Click")').click()  // Button OR link

// :nth-match() - Nth matching element
await page.locator(':nth-match(.product-card, 3)').click()  // 3rd product card
await page.locator(':nth-match(button:visible, 2)').click()  // 2nd visible button
```

**Combining Structural Pseudo-Classes:**

```javascript
// Complex combinations
await page.locator('div:has(img):has-text("Featured")').click()
await page.locator('article:has(h2):is(:text("News"), :text("Blog"))').count()
```

---

### Visibility Pseudo-Class

| Pseudo-Class | Behavior | Example |
|--------------|----------|---------|
| `:visible` | Element is visible and actionable | `page.locator('button:visible')` |

**What `:visible` Checks:**
1. Element has **non-zero size** (width and height > 0)
2. `display` is NOT `none`
3. `visibility` is NOT `hidden`  
4. `opacity` is NOT `0`
5. Element is NOT covered by other elements
6. Element is within viewport (for some actions)

**Usage Examples:**

```javascript
// Get only visible elements
await page.locator('button:visible').count()
await page.locator('input:visible').fill('text')
await page.locator('div.modal:visible').click()

// Combine with other pseudo-classes
await page.locator('button:visible:text("Submit")').click()
await page.locator('input:visible[type="text"]').fill('value')

// Alternative syntax with selector engine
await page.locator('button >> visible=true').click()
await page.locator('div >> visible=true').count()
```

**Important:**
- ⚠️ `:visible` forces a layout check (can be slow)
- ⚠️ For dynamic content, results may be unpredictable based on timing
- ✅ Playwright's auto-waiting handles visibility automatically in most cases
- ✅ Use `:visible` to **filter** elements, not to wait for visibility

**When to Use:**
- ✅ Filtering: Get count of visible buttons
- ✅ Selecting: Click first visible element in list
- ❌ Waiting: Use `waitFor({ state: 'visible' })` instead
- ❌ Assertions: Use `toBeVisible()` instead

---

### Layout Pseudo-Classes (⚠️ Deprecated)

| Pseudo-Class | Behavior | Example |
|--------------|----------|---------|
| `:right-of(selector)` | To the right of element | `page.locator('input:right-of(:text("Username"))')` |
| `:left-of(selector)` | To the left of element | `page.locator('label:left-of(input#email)')` |
| `:above(selector)` | Above element | `page.locator('h2:above(form)')` |
| `:below(selector)` | Below element | `page.locator('span:below(input)')` |
| `:near(selector)` | Within 50px of element | `page.locator('button:near(img)')` |

**⚠️ WARNING:**
- Layout selectors are **deprecated** and may be removed
- They calculate based on **bounding rectangles** (pixel positions)
- **Unreliable** when layout changes even slightly
- **Use semantic locators instead** whenever possible

**Usage Examples (use sparingly):**

```javascript
// :right-of() - Element to the right
await page.locator('input:right-of(:text("Username"))').fill('admin')

// :left-of() - Element to the left  
const label = await page.locator('label:left-of(input#email)').textContent()

// :above() - Element above
const heading = await page.locator('h2:above(form)').textContent()

// :below() - Element below
const error = await page.locator('span:below(input#email)').textContent()

// :near() - Within 50px
await page.locator('button:near(img.product)').first().click()
```

**Why Deprecated:**
- Layout changes break selectors
- Not accessible (relies on visual position)
- Semantic alternatives are better
- Performance overhead

**Recommended Alternatives:**
```javascript
// ❌ Avoid layout selectors
await page.locator('input:right-of(:text("Username"))').fill('text')

// ✅ Use semantic locators instead
await page.getByLabel('Username').fill('text')
```

---

### Combining Pseudo-Classes

Playwright pseudo-classes can be chained for powerful combinations:

```javascript
// Visible button with text
await page.locator('button:visible:text("Submit")').click()

// Article with image and specific text
await page.locator('article:has(img):has-text("Featured")').click()

// Nth visible product card
await page.locator(':nth-match(.product:visible, 2)').click()

// Visible input that's not disabled
await page.locator('input:visible:enabled').fill('text')

// Div with image, containing text "Sale", that's visible
await page.locator('div:has(img):has-text("Sale"):visible').count()
```

**Combination Best Practices:**
- ✅ Start with structural selectors (class, ID, tag)
- ✅ Add pseudo-classes for filtering
- ✅ Put `:visible` last (it's expensive)
- ✅ Keep combinations readable
- ❌ Don't overuse - simpler is better

---

### Selector Engine Syntax

Playwright supports multiple selector engines that can be combined:

| Engine | Prefix | Example |
|--------|--------|---------|
| **CSS** (default) | None or `css=` | `page.locator('button')` |
| **XPath** | `xpath=` | `page.locator('xpath=//button')` |
| **Text** | `text=` | `page.locator('text=Submit')` |
| **Chaining** | `>>` | `page.locator('div >> text=Hello')` |
| **Visibility** | `>> visible=true` | `page.locator('button >> visible=true')` |

**Engine Chaining Examples:**

```javascript
// CSS then text
await page.locator('css=.modal >> text=Confirm').click()
await page.locator('div.card >> text=In Stock').count()

// XPath then CSS
await page.locator('xpath=//form >> css=button.submit').click()

// Element then visibility filter
await page.locator('button >> visible=true').click()
await page.locator('input >> visible=true').fill('text')

// Complex chaining
await page.locator('css=.product-grid >> xpath=//div[@class="card"] >> text=iPhone').click()
```

**When to Chain:**
- ✅ Scope search to container
- ✅ Combine strengths of different engines
- ✅ Add visibility filtering
- ❌ Don't chain excessively (hurts readability)

---

### Filter Method vs Pseudo-Classes

Both approaches work - choose based on readability:

**Pseudo-Classes (Inline):**
```javascript
await page.locator('div:has(img)').click()
await page.locator('button:visible').click()
await page.locator('article:has-text("News")').click()
```

**Filter Method (Fluent):**
```javascript
await page.locator('div').filter({ has: page.locator('img') }).click()
await page.locator('button').filter({ visible: true }).click()
await page.locator('article').filter({ hasText: 'News' }).click()
```

**When to Use Each:**

| Scenario | Pseudo-Classes | Filter Method |
|----------|---------------|---------------|
| Simple filtering | ✅ Shorter, inline | ⚠️ More verbose |
| Complex filtering | ⚠️ Can get messy | ✅ More readable |
| Multiple conditions | ⚠️ Long selector | ✅ Chain filters |
| Dynamic conditions | ❌ Not possible | ✅ Use variables |
| Reusability | ⚠️ String only | ✅ Locator composition |

**Complex Example:**

```javascript
// Pseudo-classes - becomes hard to read
await page.locator('div.product-card:has(img):has-text("iPhone"):visible').click()

// Filter - clearer intent
await page.locator('div.product-card')
  .filter({ has: page.locator('img') })
  .filter({ hasText: 'iPhone' })
  .filter({ visible: true })
  .click()
```

---

### Best Practices for Pseudo-Classes

**✅ DO:**

1. **Use text pseudo-classes for content matching**
   ```javascript
   await page.locator('button:text("Submit")').click()
   ```

2. **Use :visible to filter element lists**
   ```javascript
   const visibleButtons = await page.locator('button:visible').count()
   ```

3. **Use :has() for structural relationships**
   ```javascript
   await page.locator('div:has(img)').click()
   ```

4. **Combine pseudo-classes logically**
   ```javascript
   await page.locator('article:has-text("News"):visible').count()
   ```

5. **Use :is() for multiple similar selectors**
   ```javascript
   await page.locator('button:is(:text("OK"), :text("Confirm"))').click()
   ```

**❌ DON'T:**

1. **Don't use layout pseudo-classes (deprecated)**
   ```javascript
   // ❌ Deprecated
   await page.locator('input:right-of(:text("Name"))').fill('text')
   
   // ✅ Better
   await page.getByLabel('Name').fill('text')
   ```

2. **Don't create overly complex selectors**
   ```javascript
   // ❌ Too complex
   page.locator('div:has(img):has-text("Sale"):visible:nth-match(.card, 3)')
   
   // ✅ Use filter() for clarity
   page.locator('div.card')
     .filter({ has: page.locator('img') })
     .filter({ hasText: 'Sale' })
     .nth(2)
   ```

3. **Don't use :visible for waiting**
   ```javascript
   // ❌ Don't do this
   await page.locator('button:visible').click()  // Might fail if not yet visible
   
   // ✅ Use proper waiting
   await page.locator('button').waitFor({ state: 'visible' })
   await page.locator('button').click()
   
   // ✅ Or rely on auto-waiting
   await page.locator('button').click()  // Waits automatically
   ```

4. **Don't rely on text matching for internationalized apps**
   ```javascript
   // ❌ Breaks with i18n
   await page.locator('button:text("Submit")').click()
   
   // ✅ Use test IDs or roles
   await page.getByTestId('submit-button').click()
   await page.getByRole('button', { name: 'Submit' }).click()  // If ARIA label is translated
   ```

---

### Performance Considerations

**Fast:**
- ⚡ `:has()` with simple selector: `div:has(img)`
- ⚡ `:text-is()` for exact match: `button:text-is("Submit")`
- ⚡ Structural pseudo-classes: `:is()`, `:nth-match()`

**Medium:**
- 🔸 `:text()` substring matching: `button:text("Sub")`
- 🔸 `:has-text()` descendant search: `article:has-text("News")`
- 🔸 `:text-matches()` regex: `button:text-matches("\\d+")`

**Slow:**
- 🔴 `:visible` (forces layout): `button:visible`
- 🔴 Layout pseudo-classes: `:right-of()`, `:near()`
- 🔴 Multiple chained pseudo-classes with :visible

**Optimization Tips:**

```javascript
// ❌ Slow - :visible on every element
for (const button of await page.locator('button:visible').all()) {
  await button.click()
}

// ✅ Faster - Get all, check visibility programmatically if needed
const buttons = await page.locator('button').all()
for (const button of buttons) {
  if (await button.isVisible()) {
    await button.click()
  }
}

// ✅ Best - Let Playwright handle it
await page.locator('button').nth(0).click()  // Auto-waits for visibility
```

---

### Summary: When to Use What

| Need | Solution | Example |
|------|----------|---------|
| **Find by text** | `:text()` or `getByText()` | `page.locator('button:text("Submit")')` |
| **Exact text** | `:text-is()` | `page.locator('span:text-is("Active")')` |
| **Text in child** | `:has-text()` | `page.locator('div:has-text("Error")')` |
| **Has child element** | `:has()` or `filter()` | `page.locator('div:has(img)')` |
| **Multiple options** | `:is()` | `page.locator(':is(button, a):text("Click")')` |
| **Nth matching** | `:nth-match()` | `page.locator(':nth-match(.card, 3)')` |
| **Only visible** | `:visible` | `page.locator('button:visible').count()` |
| **Layout position** | ❌ Use semantic instead | `page.getByLabel()` not `:right-of()` |
| **Complex filtering** | `filter()` method | `page.locator('div').filter({ has, hasText })` |

---

**Remember:** Playwright's pseudo-classes make selectors more powerful, but semantic locators (`getByRole`, `getByLabel`, etc.) should always be your first choice for maintainable, accessible tests!

