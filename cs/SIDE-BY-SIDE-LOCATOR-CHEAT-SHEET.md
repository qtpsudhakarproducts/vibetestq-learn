# Complete Locator Cheat Sheet: XPath vs CSS vs Playwright

## Quick Reference Guide - Side-by-Side Comparison

This is a comprehensive one-stop reference showing how to accomplish the same task using XPath, CSS Selectors, and Playwright locators.

---

## Table of Contents
- [Basic Element Selection](#basic-element-selection)
- [Attribute Matching](#attribute-matching)
- [Text Content Selection](#text-content-selection)
- [Hierarchical Relationships](#hierarchical-relationships)
- [Sibling Relationships](#sibling-relationships)
- [Position-Based Selection](#position-based-selection)
- [State-Based Selection](#state-based-selection)
- [Form Elements](#form-elements)
- [Table Operations](#table-operations)
- [Visibility and Display](#visibility-and-display)
- [Advanced Techniques](#advanced-techniques)
- [Shadow DOM and Frames](#shadow-dom-and-frames)

---

## Basic Element Selection

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **By ID** | `//*[@id='username']`<br>`//input[@id='username']` | `#username`<br>`input#username` | `page.locator('#username')`<br>`page.getByTestId('username')` |
| **By Class** | `//*[@class='btn-primary']`<br>`//button[@class='btn-primary']` | `.btn-primary`<br>`button.btn-primary` | `page.locator('.btn-primary')`<br>`page.getByRole('button')` |
| **By Name** | `//input[@name='email']` | `input[name="email"]`<br>`[name="email"]` | `page.locator('[name="email"]')`<br>`page.getByLabel('Email')` |
| **By Type** | `//input[@type='password']` | `input[type="password"]` | `page.locator('input[type="password"]')`<br>`page.getByLabel('Password')` |
| **By Tag** | `//button`<br>`//input`<br>`//div` | `button`<br>`input`<br>`div` | `page.locator('button')`<br>`page.getByRole('button')` |
| **Any Element** | `//*`<br>`//*[@id='test']` | `*`<br>`*[id="test"]` | `page.locator('*')`<br>⚠️ Rarely needed |

---

## Attribute Matching

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Exact Match** | `//input[@type='text']`<br>`//div[@data-id='123']` | `input[type="text"]`<br>`div[data-id="123"]` | `page.locator('input[type="text"]')`<br>`page.locator('[data-id="123"]')` |
| **Contains** | `//div[contains(@class,'btn')]`<br>`//input[contains(@id,'user')]` | `div[class*="btn"]`<br>`input[id*="user"]` | `page.locator('div[class*="btn"]')`<br>`page.locator('input[id*="user"]')` |
| **Starts With** | `//input[starts-with(@id,'user')]`<br>`//div[starts-with(@class,'btn')]` | `input[id^="user"]`<br>`div[class^="btn"]` | `page.locator('input[id^="user"]')`<br>`page.locator('div[class^="btn"]')` |
| **Ends With** | ❌ Not in XPath 1.0 | `img[src$=".png"]`<br>`a[href$=".pdf"]` | `page.locator('img[src$=".png"]')`<br>`page.locator('a[href$=".pdf"]')` |
| **Multiple Attributes (AND)** | `//input[@type='text' and @name='user']`<br>`//input[@type='text'][@name='user']` | `input[type="text"][name="user"]` | `page.locator('input[type="text"][name="user"]')` |
| **Multiple Attributes (OR)** | `//input[@type='text' or @type='email']` | `input[type="text"], input[type="email"]` | `page.locator('input[type="text"]')`<br>`.or(page.locator('input[type="email"]'))` |
| **Attribute Exists** | `//input[@required]`<br>`//button[@disabled]` | `input[required]`<br>`button[disabled]` | `page.locator('input[required]')`<br>`page.locator('button[disabled]')` |
| **Attribute Not Exists** | `//input[not(@disabled)]` | `input:not([disabled])` | `page.locator('input:not([disabled])')` |
| **Contains Word** | `//div[contains(concat(' ',@class,' '),' active ')]` | `div[class~="active"]` | `page.locator('div[class~="active"]')` |
| **Data Attributes** | `//*[@data-testid='submit-btn']`<br>`//button[@data-action='delete']` | `[data-testid="submit-btn"]`<br>`button[data-action="delete"]` | `page.getByTestId('submit-btn')`<br>`page.locator('[data-action="delete"]')` |

---

## Text Content Selection

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Exact Text** | `//button[text()='Submit']`<br>`//div[text()='Welcome']` | ❌ Not available | `page.locator(':text("Submit")')`<br>`page.locator('button:text-is("Submit")')`<br>`page.getByText('Submit')` ✅ Best<br>`page.getByRole('button', { name: 'Submit' })` ✅ Best |
| **Contains Text** | `//div[contains(text(),'Welcome')]`<br>`//button[contains(text(),'Save')]` | ❌ Not available | `page.locator(':text("Welcome")')`<br>`page.locator('div:has-text("Welcome")')`<br>`page.locator('button:has-text("Save")')`<br>`page.getByText('Welcome', { exact: false })` ✅ Best |
| **Normalized Text** | `//p[normalize-space()='Hello World']`<br>`//div[normalize-space(text())='Text']` | ❌ Not available | `page.locator(':text("Hello World")')`<br>`page.getByText('Hello World')` ✅<br>✅ Auto-normalizes whitespace |
| **Regex Text** | ❌ Not in XPath 1.0 | ❌ Not available | `page.locator(':text-matches("submit\|save", "i")')`<br>`page.getByText(/submit\|save/i)` ✅ Best<br>`page.getByRole('button', { name: /^submit$/i })` ✅ |
| **Text in Child** | `//div[.//span[text()='Active']]`<br>`//tr[td[contains(text(),'John')]]` | ❌ Not available | `page.locator('div:has-text("Active")')`<br>`page.locator('tr:has-text("John")')`<br>`page.locator('div').filter({ hasText: 'Active' })` ✅ Best |
| **Case-Insensitive** | `//div[translate(text(),'ABC','abc')='submit']` | ❌ Not available | `page.locator(':text("submit")')`<br>`page.getByText(/submit/i)` ✅<br>✅ Default is case-insensitive |

**Playwright Text Pseudo-Classes:**
- `:text("substring")` - Contains text (case-insensitive, normalized)
- `:text-is("exact")` - Exact text match
- `:text-matches("regex", "flags")` - Regex matching
- `:has-text("text")` - Element or descendant contains text

---

## Hierarchical Relationships

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Direct Child** | `//div[@id='form']/input`<br>`//ul[@class='menu']/li` | `div#form > input`<br>`ul.menu > li` | `page.locator('div#form > input')`<br>`page.locator('ul.menu > li')` |
| **Any Descendant** | `//div[@id='container']//button`<br>`//form//input` | `div#container button`<br>`form input` | `page.locator('div#container button')`<br>`page.locator('form input')` |
| **Parent Element** | `//input[@id='username']/..`<br>`//button[@id='save']/parent::div` | ❌ Not available | `page.locator('#username').locator('..')`<br>`page.locator('xpath=//input[@id="username"]/..')` |
| **Ancestor** | `//input[@id='email']/ancestor::form`<br>`//button/ancestor::div[@class='modal']` | ❌ Not available | `page.locator('xpath=//input[@id="email"]/ancestor::form')` |
| **Specific Ancestor** | `//input/ancestor::div[@id='container']` | ❌ Not available | `page.locator('xpath=//input/ancestor::div[@id="container"]')` |
| **All Ancestors** | `//input[@id='field']/ancestor::*` | ❌ Not available | `page.locator('xpath=//input[@id="field"]/ancestor::*')` |
| **Has Child Element** | `//div[.//img]`<br>`//article[.//h2[text()='Title']]` | `div:has(img)`<br>`article:has(h2)` | `page.locator('div:has(img)')`<br>`page.locator('article:has(h2:text-is("Title"))')`<br>`page.locator('div').filter({ has: page.locator('img') })` ✅ Best |
| **Does Not Have Child** | `//div[not(.//img)]` | `div:not(:has(img))` | `page.locator('div:not(:has(img))')`<br>`page.locator('div').filter({ hasNot: page.locator('img') })` ✅ Best |
| **Has Text in Child** | `//div[.//span[contains(text(),'Active')]]` | ❌ Not available | `page.locator('div:has-text("Active")')`<br>`page.locator('div:has(span:text("Active"))')`<br>`page.locator('div').filter({ hasText: 'Active' })` ✅ Best |
| **Has Specific Descendant** | `//article[.//div[@class='promo']]` | `article:has(div.promo)` | `page.locator('article:has(div.promo)')`<br>`page.locator('article').filter({ has: page.locator('div.promo') })` ✅ |

**Playwright `:has()` Pseudo-Class:**
- `:has(selector)` - Matches if contains element matching selector
- `:not(:has(selector))` - Matches if does NOT contain element
- Can be combined: `article:has(div.promo):has-text("Sale")`

---

## Sibling Relationships

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Following Sibling** | `//label[@for='email']/following-sibling::input`<br>`//h2[@id='title']/following-sibling::p` | `label[for="email"] ~ input`<br>`h2#title ~ p` | `page.locator('label[for="email"] ~ input')`<br>`page.getByLabel('Email')` ✅ Better |
| **Adjacent Sibling (Next)** | `//label[@for='email']/following-sibling::input[1]`<br>`//h2/following-sibling::*[1]` | `label[for="email"] + input`<br>`h2 + *` | `page.locator('label[for="email"] + input')`<br>`page.getByLabel('Email')` ✅ Better |
| **Preceding Sibling** | `//input[@id='email']/preceding-sibling::label`<br>`//button/preceding-sibling::input` | ❌ Not available | `page.locator('xpath=//input[@id="email"]/preceding-sibling::label')` |
| **All Following Siblings** | `//h2[@id='title']/following-sibling::*` | `h2#title ~ *` | `page.locator('h2#title ~ *')` |
| **All Preceding Siblings** | `//div[@id='target']/preceding-sibling::*` | ❌ Not available | `page.locator('xpath=//div[@id="target"]/preceding-sibling::*')` |

---

## Position-Based Selection

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **First Element** | `(//li)[1]`<br>`//li[1]`<br>`//li[position()=1]` | `li:first-child`<br>`li:first-of-type` | `page.locator('li').first()`<br>`page.locator('li:first-child')` |
| **Last Element** | `(//li)[last()]`<br>`//li[last()]`<br>`//li[position()=last()]` | `li:last-child`<br>`li:last-of-type` | `page.locator('li').last()`<br>`page.locator('li:last-child')` |
| **Nth Element** | `(//li)[3]`<br>`//li[3]`<br>`//li[position()=3]` | `li:nth-child(3)`<br>`li:nth-of-type(3)` | `page.locator('li').nth(2)` ⚠️ 0-indexed<br>`page.locator('li:nth-child(3)')` ✅ 1-indexed |
| **Second Element** | `(//button)[2]`<br>`//button[2]` | `button:nth-child(2)`<br>`button:nth-of-type(2)` | `page.locator('button').nth(1)`<br>`page.locator('button:nth-child(2)')` |
| **Even Elements** | `//li[position() mod 2 = 0]` | `li:nth-child(even)` | `page.locator('li:nth-child(even)')` |
| **Odd Elements** | `//li[position() mod 2 = 1]` | `li:nth-child(odd)` | `page.locator('li:nth-child(odd)')` |
| **Every 3rd Element** | `//li[position() mod 3 = 0]` | `li:nth-child(3n)` | `page.locator('li:nth-child(3n)')` |
| **First 3 Elements** | `//li[position() <= 3]` | `li:nth-child(-n+3)` | `page.locator('li:nth-child(-n+3)')` |
| **After 3rd Element** | `//li[position() > 3]` | `li:nth-child(n+4)` | `page.locator('li:nth-child(n+4)')` |
| **Only Child** | `//div[count(*)=1]/span` | `span:only-child` | `page.locator('span:only-child')` |
| **Only of Type** | `//div[count(p)=1]/p` | `p:only-of-type` | `page.locator('p:only-of-type')` |

---

## State-Based Selection

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Enabled** | `//input[not(@disabled)]`<br>`//button[not(@disabled)]` | `input:enabled`<br>`button:enabled` | `page.locator('input:enabled')`<br>`page.getByRole('button', { disabled: false })` |
| **Disabled** | `//input[@disabled]`<br>`//button[@disabled]` | `input:disabled`<br>`button:disabled` | `page.locator('input:disabled')`<br>`page.getByRole('button', { disabled: true })` |
| **Checked (Checkbox)** | `//input[@type='checkbox' and @checked]` | `input[type="checkbox"]:checked` | `page.locator('input[type="checkbox"]:checked')`<br>`page.getByRole('checkbox', { checked: true })` |
| **Unchecked** | `//input[@type='checkbox' and not(@checked)]` | `input[type="checkbox"]:not(:checked)` | `page.locator('input[type="checkbox"]:not(:checked)')`<br>`page.getByRole('checkbox', { checked: false })` |
| **Selected (Option)** | `//option[@selected]` | `option:checked` | `page.locator('option:checked')` |
| **Required** | `//input[@required]` | `input:required` | `page.locator('input:required')` |
| **Optional** | `//input[not(@required)]` | `input:optional` | `page.locator('input:optional')` |
| **Valid** | ❌ Not in XPath | `input:valid` | `page.locator('input:valid')` |
| **Invalid** | ❌ Not in XPath | `input:invalid` | `page.locator('input:invalid')` |
| **Read-Only** | `//input[@readonly]` | `input:read-only` | `page.locator('input:read-only')` |
| **Read-Write** | `//input[not(@readonly)]` | `input:read-write` | `page.locator('input:read-write')` |
| **Focused** | ❌ Not in XPath | `input:focus` | `page.locator('input:focus')` |
| **Hover** | ❌ Not in XPath | `button:hover` | ❌ Use `page.locator('button').hover()` |

---

## Form Elements

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Text Input** | `//input[@type='text']` | `input[type="text"]` | `page.locator('input[type="text"]')`<br>`page.getByRole('textbox')` ✅ Better |
| **Password Input** | `//input[@type='password']` | `input[type="password"]` | `page.locator('input[type="password"]')`<br>`page.getByLabel('Password')` ✅ Better |
| **Email Input** | `//input[@type='email']` | `input[type="email"]` | `page.locator('input[type="email"]')`<br>`page.getByLabel('Email')` ✅ Better |
| **Checkbox** | `//input[@type='checkbox']` | `input[type="checkbox"]` | `page.locator('input[type="checkbox"]')`<br>`page.getByRole('checkbox')` ✅ Better |
| **Radio Button** | `//input[@type='radio']` | `input[type="radio"]` | `page.locator('input[type="radio"]')`<br>`page.getByRole('radio')` ✅ Better |
| **Radio by Value** | `//input[@type='radio' and @value='male']` | `input[type="radio"][value="male"]` | `page.locator('input[value="male"]')`<br>`page.getByRole('radio', { name: 'Male' })` ✅ Better |
| **Select Dropdown** | `//select[@name='country']` | `select[name="country"]` | `page.locator('select[name="country"]')`<br>`page.getByRole('combobox')` ✅ Better |
| **Select Option** | `//select[@id='country']/option[@value='US']` | `select#country option[value="US"]` | `page.locator('select#country option[value="US"]')` |
| **Textarea** | `//textarea[@name='comment']` | `textarea[name="comment"]` | `page.locator('textarea[name="comment"]')`<br>`page.getByLabel('Comment')` ✅ Better |
| **File Input** | `//input[@type='file']` | `input[type="file"]` | `page.locator('input[type="file"]')`<br>`page.getByLabel('Upload')` ✅ Better |
| **Submit Button** | `//button[@type='submit']`<br>`//input[@type='submit']` | `button[type="submit"]`<br>`input[type="submit"]` | `page.locator('button[type="submit"]')`<br>`page.getByRole('button', { name: 'Submit' })` ✅ Better |
| **Button by Text** | `//button[text()='Login']` | ❌ Not available | `page.getByRole('button', { name: 'Login' })` ✅ |
| **Input by Label** | `//label[text()='Username']/following-sibling::input`<br>`//label[@for='username']/following-sibling::input` | `label:has-text("Username") + input`<br>`label[for="username"] + input` | `page.getByLabel('Username')` ✅ Best |
| **Input by Placeholder** | `//input[@placeholder='Search...']` | `input[placeholder="Search..."]` | `page.getByPlaceholder('Search...')` ✅ Best |

---

## Table Operations

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **All Rows** | `//table//tr`<br>`//table/tbody/tr` | `table tr`<br>`table tbody tr` | `page.locator('table tr')`<br>`page.getByRole('row')` ✅ Better |
| **First Row** | `(//table//tr)[1]`<br>`//table//tr[1]` | `table tr:first-child`<br>`table tr:first-of-type` | `page.locator('table tr').first()`<br>`page.getByRole('row').first()` |
| **Last Row** | `(//table//tr)[last()]` | `table tr:last-child` | `page.locator('table tr').last()`<br>`page.getByRole('row').last()` |
| **Nth Row** | `(//table//tr)[3]` | `table tr:nth-child(3)` | `page.locator('table tr').nth(2)` ⚠️ 0-indexed<br>`page.getByRole('row').nth(2)` |
| **Cell in Row/Column** | `//table//tr[2]//td[3]`<br>`(//table//tr)[2]//td[3]` | `table tr:nth-child(2) td:nth-child(3)` | `page.locator('table tr:nth-child(2) td:nth-child(3)')`<br>`page.getByRole('row').nth(1).getByRole('cell').nth(2)` |
| **Row with Text** | `//tr[td[text()='John Smith']]`<br>`//tr[contains(.,'John')]` | ❌ Not available | `page.getByRole('row', { name: /John/ })` ✅ Best<br>`page.locator('tr:has-text("John")')` |
| **Cell with Text** | `//td[text()='Active']`<br>`//td[contains(text(),'Active')]` | ❌ Not available | `page.getByRole('cell', { name: 'Active' })`<br>`page.locator('td:has-text("Active")')` |
| **Header Cell** | `//th[text()='Name']` | `th:has-text("Name")` | `page.getByRole('columnheader', { name: 'Name' })` ✅ Best |
| **All Cells in Row** | `//tr[@data-id='123']//td` | `tr[data-id="123"] td` | `page.locator('tr[data-id="123"] td')`<br>`page.getByRole('row').filter({ has: page.getByRole('cell', { name: /123/ }) })` |
| **Even Rows** | `//tr[position() mod 2 = 0]` | `tr:nth-child(even)` | `page.locator('tr:nth-child(even)')` |
| **Odd Rows** | `//tr[position() mod 2 = 1]` | `tr:nth-child(odd)` | `page.locator('tr:nth-child(odd)')` |

---

## Visibility and Display

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Visible Elements** | `//div[not(contains(@style,'display: none'))]`<br>`//div[not(contains(@style,'display:none'))]` | `div:not([style*="display: none"])`<br>⚠️ Limited | `page.locator('div:visible')`<br>`page.locator('div >> visible=true')`<br>`page.locator('button:visible')` ✅ |
| **Hidden Elements** | `//div[contains(@style,'display: none')]` | `div[style*="display: none"]` | ⚠️ Not directly available<br>`page.locator('div').filter({ hasNot: page.locator(':visible') })`<br>💡 Use method: `await page.locator('div').isHidden()` |
| **Only Visible Buttons** | `//button[not(contains(@style,'display: none'))]` | `button:not([style*="display: none"])` | `page.locator('button:visible')`<br>`page.getByRole('button').filter({ visible: true })` ✅ |
| **Visible Inputs** | `//input[not(ancestor-or-self::*[contains(@style,'display: none')])]` | ⚠️ Complex | `page.locator('input:visible')`<br>`page.locator('input >> visible=true')` ✅ |
| **Any Visible Element** | `//div[not(contains(@style,'display: none'))]` | `div:not([style*="display: none"])` | `page.locator('div:visible')`<br>💡 Method for check: `await expect(page.locator('div')).toBeVisible()` |

**Notes:** 
- Playwright's `:visible` pseudo-class uses computed styles (not just inline styles)
- `:visible` checks: display, visibility, opacity, size, and more
- `>> visible=true` is an alternative syntax that works with any selector engine

---

## Advanced Techniques

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Empty Element** | `//div[not(node())]`<br>`//div[normalize-space()='']` | `div:empty` | `page.locator('div:empty')` |
| **Not Empty** | `//div[node()]` | `div:not(:empty)` | `page.locator('div:not(:empty)')` |
| **Count Children** | `//ul[count(li)=5]` | `ul:has(li:nth-child(5):last-child)` | `await expect(page.locator('ul li')).toHaveCount(5)` ✅ Better |
| **Has Specific Child** | `//div[.//span[@class='badge']]` | `div:has(span.badge)` | `page.locator('div').filter({ has: page.locator('.badge') })` ✅ Better<br>`page.locator('div:has(span.badge)')` |
| **Does Not Have Child** | `//div[not(.//span[@class='badge'])]` | `div:not(:has(span.badge))` | `page.locator('div').filter({ hasNot: page.locator('.badge') })` ✅ Better |
| **Multiple Classes** | `//div[contains(@class,'btn') and contains(@class,'primary')]` | `div.btn.primary` | `page.locator('div.btn.primary')` |
| **Exact Class Match** | `//div[contains(concat(' ',@class,' '),' active ')]` | `div[class~="active"]` | `page.locator('div[class~="active"]')` |
| **Exclude Class** | `//button[not(contains(@class,'disabled'))]` | `button:not(.disabled)` | `page.locator('button:not(.disabled)')` |
| **Exclude Multiple** | `//button[not(contains(@class,'disabled')) and not(contains(@class,'hidden'))]` | `button:not(.disabled):not(.hidden)` | `page.locator('button:not(.disabled):not(.hidden)')` |
| **Union (OR)** | `//button[@id='save'] \| //button[@id='submit']` | `button#save, button#submit` | `page.locator('button#save').or(page.locator('button#submit'))` ✅ |
| **Intersection (AND)** | `//button[@class='primary' and @type='submit']` | `button.primary[type="submit"]` | `page.locator('button.primary').and(page.locator('[type="submit"]'))` ✅ |
| **Filter by Text** | `//div[@class='card' and contains(.,'iPhone')]` | ❌ Not available | `page.locator('.card').filter({ hasText: 'iPhone' })` ✅ |
| **Filter by Not Text** | `//div[@class='card' and not(contains(.,'Sold Out'))]` | ❌ Not available | `page.locator('.card').filter({ hasNotText: 'Sold Out' })` ✅ |

---

## Shadow DOM and Frames

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Shadow DOM Element** | ❌ Cannot pierce | ⚠️ **Context-Dependent:**<br><br>**Standard Browser:**<br>❌ Cannot pierce<br><br>**Selenium (Programmatic):**<br>`WebElement host = driver.findElement(By.css("custom-element"));`<br>`SearchContext shadow = host.getShadowRoot();`<br>`shadow.findElement(By.css("button"))`<br><br>**Playwright (Direct Locator):**<br>✅ `custom-element button` | ✅ **Direct Locator:**<br>`page.locator('custom-element button')`<br>`page.locator('custom-element #btn')`<br>`page.locator('custom-element').getByRole('button')` ✅ Best |
| **Deep Shadow DOM** | ❌ Cannot pierce | ⚠️ **Selenium (Programmatic):**<br>Multiple `.getShadowRoot()` calls<br><br>**Playwright (Direct Locator):**<br>✅ `app-root custom-card button` | ✅ **Direct Locator:**<br>`page.locator('app-root custom-card button')`<br>Auto-pierces multiple levels! |
| **Legacy Shadow Syntax** | ❌ Not available | ❌ Not in standard CSS<br><br>**Playwright only:**<br>`custom-element >>> button` | `page.locator('custom-element >>> button')`<br>⚠️ Works but not needed anymore |
| **Element in IFrame** | `//iframe[@id='payment']`<br>Then switch context | `iframe#payment`<br>Then switch context<br><br>**Programmatic in Selenium:**<br>`driver.switchTo().frame("payment")` | ✅ **Direct Locator:**<br>`page.frameLocator('#payment')`<br>`.locator('input')`<br>No switching needed! |
| **Nested IFrames** | Switch multiple times | Switch multiple times<br><br>**Programmatic in Selenium:**<br>`driver.switchTo().frame(0)`<br>`driver.switchTo().frame(0)` | ✅ **Direct Locator:**<br>`page.frameLocator('#outer')`<br>`.frameLocator('#inner')`<br>`.locator('button')` |
| **IFrame by Name** | `//iframe[@name='payment']` | `iframe[name="payment"]` | `page.frameLocator('iframe[name="payment"]')` |
| **IFrame by Title** | `//iframe[@title='Payment Gateway']` | `iframe[title="Payment Gateway"]` | `page.frameLocator('iframe[title="Payment Gateway"]')` |
| **IFrame by Src** | `//iframe[contains(@src,'stripe')]` | `iframe[src*="stripe"]` | `page.frameLocator('iframe[src*="stripe"]')` |

**Key Understanding: Programmatic vs Direct Locator**

**Programmatic Approach** (Selenium, Puppeteer, vanilla JS):
- Write code logic to traverse shadow boundaries
- Manual `.getShadowRoot()` or `.switchTo().frame()` calls
- Multi-step process
- Complex for nested structures

```java
// Selenium Shadow DOM - Programmatic
WebElement host = driver.findElement(By.cssSelector("custom-element"));
SearchContext shadowRoot = host.getShadowRoot();  // Manual step
WebElement button = shadowRoot.findElement(By.cssSelector("button"));

// Selenium iFrame - Programmatic  
driver.switchTo().frame("payment");  // Manual switch
driver.findElement(By.id("cardNumber")).sendKeys("1234");
driver.switchTo().defaultContent();  // Manual switch back
```

**Direct Locator Approach** (Playwright):
- Single locator string handles everything
- Framework traverses automatically
- Simple syntax for nested structures

```javascript
// Playwright Shadow DOM - Direct Locator
await page.locator('custom-element button').click()

// Playwright iFrame - Direct Locator
await page.frameLocator('#payment').locator('#cardNumber').fill('1234')
```

---

## Special Playwright Features

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| **Layout: Right Of** | ❌ Not available | ❌ Not available | `page.locator('input:right-of(:text("Username"))')` ✅<br>⚠️ Deprecated |
| **Layout: Left Of** | ❌ Not available | ❌ Not available | `page.locator('label:left-of(input#email)')` ✅<br>⚠️ Deprecated |
| **Layout: Above** | ❌ Not available | ❌ Not available | `page.locator('h2:above(form)')` ✅<br>⚠️ Deprecated |
| **Layout: Below** | ❌ Not available | ❌ Not available | `page.locator('span:below(input)')` ✅<br>⚠️ Deprecated |
| **Layout: Near** | ❌ Not available | ❌ Not available | `page.locator('button:near(img)')` ✅<br>⚠️ Deprecated |
| **By Role** | ❌ Not available | ❌ Not available | `page.getByRole('button', { name: 'Submit' })` ✅ Best |
| **By Label** | Complex XPath | Complex CSS | `page.getByLabel('Email')` ✅ Best |
| **By Placeholder** | `//input[@placeholder='Search']` | `input[placeholder="Search"]` | `page.getByPlaceholder('Search')` ✅ Best |
| **By Alt Text** | `//img[@alt='Logo']` | `img[alt="Logo"]` | `page.getByAltText('Logo')` ✅ Best |
| **By Title** | `//*[@title='Close']` | `[title="Close"]` | `page.getByTitle('Close')` ✅ Best |
| **By Test ID** | `//*[@data-testid='submit']` | `[data-testid="submit"]` | `page.getByTestId('submit')` ✅ Best |
| **Filter Has** | ❌ Not available | `div:has(img)` | `page.locator('div').filter({ has: page.locator('img') })` ✅ Better |
| **Filter Has Not** | `//div[not(.//img)]` | `div:not(:has(img))` | `page.locator('div').filter({ hasNot: page.locator('img') })` ✅ Better |
| **Locator AND** | `//button[@class='btn' and @type='submit']` | `button.btn[type="submit"]` | `page.locator('button.btn').and(page.locator('[type="submit"]'))` ✅ |
| **Locator OR** | `//button \| //a` | `button, a` | `page.locator('button').or(page.locator('a'))` ✅ |

---

## Common Patterns Quick Reference

### Login Form
```
Element: Username input

XPath:     //input[@name='username']
CSS:       input[name="username"]
Playwright: page.getByLabel('Username')
```

### Product Card
```
Element: Add to Cart button in product card with "iPhone 15"

XPath:     //div[@class='product-card' and .//h3[text()='iPhone 15']]//button[text()='Add to Cart']
CSS:       ❌ Not available (cannot filter by text)
Playwright: page.locator('.product-card').filter({ hasText: 'iPhone 15' }).getByRole('button', { name: 'Add to Cart' })
```

### Table Row Action
```
Element: Edit button in row containing "John Smith"

XPath:     //tr[td[text()='John Smith']]//button[@class='btn-edit']
CSS:       ❌ Not available
Playwright: page.getByRole('row', { name: /John Smith/ }).getByRole('button', { name: 'Edit' })
```

### Modal Dialog
```
Element: Confirm button in modal with title "Delete Item"

XPath:     //div[@class='modal' and .//h2[text()='Delete Item']]//button[text()='Confirm']
CSS:       ❌ Not available
Playwright: page.getByRole('dialog', { name: 'Delete Item' }).getByRole('button', { name: 'Confirm' })
```

### Dynamic Element
```
Element: Button with dynamic ID starting with "btn-"

XPath:     //button[starts-with(@id,'btn-')]
CSS:       button[id^="btn-"]
Playwright: page.locator('button[id^="btn-"]')
           page.getByRole('button') ✅ Better if possible
```

---

## Performance Ranking

**Fastest to Slowest:**

1. ⚡ **ID Selector**: `#elementId` (all methods)
2. ⚡ **CSS Simple**: Class, attribute selectors
3. 🔸 **Playwright Semantic**: getByRole, getByLabel
4. 🔸 **XPath Simple**: Direct attribute matching
5. 🔶 **Complex CSS**: Multiple levels, pseudo-classes
6. 🔶 **XPath with Axes**: Parent, ancestor, sibling navigation
7. 🔴 **XPath Text Matching**: contains(text())
8. 🔴 **Deep Nested Selectors**: Many levels deep

---

## Recommendations

### ✅ Best Practices

| Scenario | Recommended Approach |
|----------|---------------------|
| **Form Input** | Playwright: `page.getByLabel('Email')` |
| **Button** | Playwright: `page.getByRole('button', { name: 'Submit' })` |
| **Link** | Playwright: `page.getByRole('link', { name: 'Home' })` |
| **Image** | Playwright: `page.getByAltText('Logo')` |
| **Parent Navigation** | XPath: `//input[@id='email']/..` |
| **Text Matching** | Playwright: `page.getByText('Welcome')` or XPath |
| **Simple Attribute** | CSS: `#id`, `.class`, `[name="value"]` |
| **Complex Filtering** | Playwright: `filter({ has: ... })` |
| **Table Operations** | Playwright: `getByRole('row')` with filters |
| **Dynamic IDs** | Add `data-testid`, use `getByTestId()` |

### ❌ Avoid

- Deep nested CSS selectors (`div > div > div > span`)
- Position-based selectors (unless position is meaningful)
- Class selectors for dynamic classes
- XPath text matching in tight loops (slow)
- Manual parent navigation when semantic locators work

---

## Legend

- ✅ **Recommended** - Best approach for this scenario
- ⚠️ **Acceptable** - Works but not ideal
- ❌ **Not Available** - Feature not supported
- 🔸 **Medium Performance** - Adequate speed
- 🔶 **Slower** - May impact test execution time
- 🔴 **Slowest** - Avoid in performance-critical scenarios

---

## Quick Tips

1. **Always prefer semantic locators** in Playwright (`getByRole`, `getByLabel`)
2. **Use data-testid** for elements you control
3. **XPath is best** for parent/ancestor navigation
4. **CSS is fastest** for simple attribute matching
5. **Playwright filters** are powerful for complex scenarios
6. **Avoid brittle selectors** based on DOM structure
7. **Test locators** in browser DevTools before coding
8. **Keep selectors simple** and readable
9. **Document complex selectors** with comments
10. **Regular review** and refactoring of locators

---

## Browser DevTools Testing

### Test XPath
```javascript
// In browser console
$x("//button[text()='Submit']")
$x("//button[text()='Submit']").length
$x("//button[text()='Submit']")[0].style.border = "3px solid red"
```

### Test CSS
```javascript
// In browser console
document.querySelector("#username")
document.querySelectorAll(".btn-primary")
document.querySelectorAll(".btn-primary").length
document.querySelector("#username").style.border = "3px solid red"
```

### Test Playwright
```javascript
// Use Playwright Inspector
await page.pause()  // Opens inspector

// Or use locator().highlight()
await page.locator('#username').highlight()
```

---

**Remember:** The best locator is one that:
1. ✅ Uniquely identifies the element
2. ✅ Survives UI changes  
3. ✅ Is readable by humans
4. ✅ Performs adequately
5. ✅ Encourages accessibility

---

## Playwright Pseudo-Classes Reference

Playwright extends CSS with custom pseudo-classes that make element selection more powerful:

### Text Matching Pseudo-Classes

| Pseudo-Class | Description | Example |
|--------------|-------------|---------|
| `:text("str")` | Contains text (case-insensitive, normalized) | `page.locator('button:text("Submit")')` |
| `:text-is("str")` | Exact text match | `page.locator('button:text-is("Submit")')` |
| `:text-matches("regex", "i")` | Regex matching | `page.locator('button:text-matches("^Submit$", "i")')` |
| `:has-text("str")` | Element or descendant contains text | `page.locator('article:has-text("Playwright")')` |

**Usage:**
```javascript
// Text contains "Submit" (flexible)
await page.locator('button:text("Submit")').click()

// Exact text "Submit" (strict)
await page.locator('button:text-is("Submit")').click()

// Regex: starts with Submit or Save
await page.locator('button:text-matches("^(Submit|Save)")').click()

// Article containing "Playwright" anywhere
await page.locator('article:has-text("Playwright")').textContent()
```

### Structural Pseudo-Classes

| Pseudo-Class | Description | Example |
|--------------|-------------|---------|
| `:has(selector)` | Contains matching element | `page.locator('div:has(img)')` |
| `:is(selector1, selector2)` | Matches any of the selectors | `page.locator('button:is(:text("Login"), :text("Sign in"))')` |
| `:nth-match(selector, n)` | Nth element matching selector | `page.locator(':nth-match(.product, 3)')` |

**Usage:**
```javascript
// Div containing an image
await page.locator('div:has(img)').click()

// Button with either text
await page.locator('button:is(:text("Login"), :text("Sign in"))').click()

// Third product in list
await page.locator(':nth-match(.product, 3)').click()
```

### Visibility Pseudo-Class

| Pseudo-Class | Description | Example |
|--------------|-------------|---------|
| `:visible` | Element is visible (actionable) | `page.locator('button:visible')` |

**Usage:**
```javascript
// Only visible buttons
await page.locator('button:visible').count()

// Visible input fields
await page.locator('input:visible').fill('text')

// Alternative syntax
await page.locator('button >> visible=true').click()
```

**Important:** `:visible` checks:
- Element has non-zero size
- `visibility` is not `hidden`
- `display` is not `none`
- `opacity` is not `0`
- Element is not obscured by other elements

### Layout Pseudo-Classes (⚠️ Deprecated)

| Pseudo-Class | Description | Example |
|--------------|-------------|---------|
| `:right-of(selector)` | To the right of element | `page.locator('input:right-of(:text("Username"))')` |
| `:left-of(selector)` | To the left of element | `page.locator('label:left-of(input)')` |
| `:above(selector)` | Above element | `page.locator('h2:above(form)')` |
| `:below(selector)` | Below element | `page.locator('span:below(input)')` |
| `:near(selector)` | Within 50px of element | `page.locator('button:near(img)')` |

**Warning:** Layout selectors are deprecated and may be removed. Use semantic locators instead.

### Combining Pseudo-Classes

```javascript
// Multiple pseudo-classes
await page.locator('button:visible:text("Submit")').click()

// Has text and has image
await page.locator('article:has-text("Featured"):has(img)').click()

// Visible button with text
await page.locator('button:visible:has-text("Save")').click()

// Complex combination
await page.locator('div:has(img):has-text("Product"):visible').click()
```

### Selector Engine Syntax

Playwright supports multiple selector engines that can be combined:

| Engine | Syntax | Example |
|--------|--------|---------|
| CSS | Default or `css=` | `page.locator('button')` or `page.locator('css=button')` |
| XPath | `xpath=` | `page.locator('xpath=//button')` |
| Text | `text=` | `page.locator('text=Submit')` |
| Chaining | `>>` | `page.locator('css=div >> text=Hello')` |
| Visibility | `>> visible=true` | `page.locator('button >> visible=true')` |

**Usage:**
```javascript
// CSS engine (default)
await page.locator('button.submit').click()

// XPath engine
await page.locator('xpath=//button[@id="submit"]').click()

// Text engine
await page.locator('text=Submit').click()

// Chaining engines
await page.locator('css=.modal >> text=Confirm').click()
await page.locator('xpath=//form >> css=button.submit').click()

// Visibility filter
await page.locator('input >> visible=true').fill('text')
```

### Filter vs Pseudo-Classes

Both approaches work, choose based on readability:

```javascript
// Using pseudo-classes (inline)
await page.locator('div:has(img)').click()
await page.locator('button:visible').click()
await page.locator('article:has-text("News")').click()

// Using filter() method (fluent)
await page.locator('div').filter({ has: page.locator('img') }).click()
await page.locator('button').filter({ visible: true }).click()
await page.locator('article').filter({ hasText: 'News' }).click()

// Complex scenarios - filter() is clearer
await page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .filter({ has: page.locator('button:text("Add to Cart")') })
  .first()
  .click()
```

### Best Practices for Pseudo-Classes

✅ **DO:**
- Use `:visible` to filter by visibility
- Use `:text()` for simple text matching
- Use `:has()` for structural relationships
- Combine pseudo-classes for specificity

❌ **DON'T:**
- Overuse layout pseudo-classes (deprecated)
- Create overly complex selector strings
- Use `:visible` in loops (slow)
- Rely on text matching for internationalized apps

**Happy Testing! 🚀**
