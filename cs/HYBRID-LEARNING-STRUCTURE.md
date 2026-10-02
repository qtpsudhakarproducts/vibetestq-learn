# Web Locators: Complete Guide
## XPath, CSS Selectors & Playwright - Hybrid Learning Structure

---

## 📖 Table of Contents

### ⚡ QUICK ACCESS
- [🎯 I Need to Find... (Task-Based Index)](#task-based-index)
- [🚨 My Locator Isn't Working (Troubleshooting)](#troubleshooting)
- [📋 Cheat Sheet (All 3 Side-by-Side)](#cheat-sheet)

### 📚 LEARNING PATH
- [🌱 Beginner Level](#beginner-level)
- [🌿 Intermediate Level](#intermediate-level)
- [🌳 Advanced Level](#advanced-level)
- [🚀 Playwright Mastery](#playwright-mastery)

### 🎯 BY SCENARIO (Quick Lookup)
- [Scenario-Based Examples](#scenarios)

### 📖 REFERENCE
- [Complete References](#reference)

---

# ⚡ QUICK ACCESS

## 🎯 Task-Based Index: "I Need to Find..."

Jump directly to what you need:

| I Need To... | Difficulty | Go To |
|--------------|-----------|-------|
| Find a button | 🟢 Easy | [Finding Buttons](#finding-buttons) |
| Find an input field | 🟢 Easy | [Finding Input Fields](#finding-input-fields) |
| Find element by text | 🟢 Easy | [By Text Content](#by-text-content) |
| Find element by label | 🟢 Easy | [By Label](#by-label) |
| Find a link | 🟢 Easy | [Finding Links](#finding-links) |
| Find an image | 🟢 Easy | [Finding Images](#finding-images) |
| Find by ID/Class | 🟢 Easy | [By ID/Class/Name](#by-id-class-name) |
| Find element inside container | 🟡 Medium | [Parent-Child Relationships](#parent-child) |
| Find element next to another | 🟡 Medium | [Sibling Relationships](#siblings) |
| Find element in table | 🟡 Medium | [Working with Tables](#tables) |
| Find nth element (3rd, 5th, etc.) | 🟡 Medium | [Position-Based](#position-based) |
| Find visible/hidden elements | 🟡 Medium | [By State](#by-state) |
| Find enabled/disabled elements | 🟡 Medium | [By State](#by-state) |
| Find element with dynamic ID | 🔴 Advanced | [Dynamic IDs](#dynamic-ids) |
| Find element in Shadow DOM | 🔴 Advanced | [Shadow DOM](#shadow-dom) |
| Find element in iframe | 🔴 Advanced | [IFrames](#iframes) |
| Combine multiple conditions | 🔴 Advanced | [Complex Filtering](#complex-filtering) |

---

## 🚨 Troubleshooting: "My Locator Isn't Working"

Quick fixes for common issues:

| Problem | Most Likely Cause | Quick Fix | Details |
|---------|-------------------|-----------|---------|
| "Element not found" | Wrong selector | Verify in DevTools | [Link](#element-not-found) |
| "Element not found" | Not loaded yet | Add wait | [Link](#timing-issues) |
| "Element not found" | Inside iframe | Use frameLocator | [Link](#iframe-issues) |
| "Element not found" | Inside Shadow DOM | Check shadow root | [Link](#shadow-dom-issues) |
| "Multiple elements match" | Too generic selector | Add specificity | [Link](#multiple-matches) |
| "Element not clickable" | Overlapping elements | Wait for visibility | [Link](#not-clickable) |
| "Works in console, fails in test" | Timing issue | Use proper waits | [Link](#console-vs-test) |
| Locator is too slow | Inefficient selector | Optimize | [Link](#performance-issues) |

---

## 📋 Cheat Sheet

Quick reference for all three approaches side-by-side.

**Most Common Patterns:**

| Pattern | XPath | CSS | Playwright |
|---------|-------|-----|------------|
| By ID | `//*[@id='username']` | `#username` | `page.locator('#username')` |
| By Class | `//button[@class='btn']` | `button.btn` | `page.locator('button.btn')` |
| By Name | `//input[@name='email']` | `input[name="email"]` | `page.locator('input[name="email"]')` |
| By Text | `//button[text()='Submit']` | ❌ | `page.getByText('Submit')` |
| Contains Text | `//div[contains(text(),'Hello')]` | ❌ | `page.locator('div:has-text("Hello")')` |
| By Label | Complex XPath | Complex CSS | `page.getByLabel('Email')` ✅ |
| By Role | ❌ | ❌ | `page.getByRole('button')` ✅ |
| First Element | `(//li)[1]` | `li:first-child` | `page.locator('li').first()` |
| Visible Only | Complex | `button:visible` | `page.locator('button:visible')` |
| Parent Element | `//input/..` | ❌ | `page.locator('xpath=//input/..')` |

[See Complete Cheat Sheet →](#complete-cheat-sheet)

---

# 📚 LEARNING PATH

## 🌱 Beginner Level (Start Here)

**Goal:** Master the fundamentals - find elements using visible attributes  
**Time:** 2-3 hours  
**Prerequisites:** Basic HTML knowledge

---

### Lesson 1: Using Visible Attributes (ID, Class, Name)

**📝 What You'll Learn:**
- The easiest and most reliable way to find elements
- When to use ID vs Class vs Name
- Best practices for stable locators

**Why This Matters:**  
90% of your locators will use these simple attributes. Master this, and you're already productive!

#### Finding by ID

IDs should be unique on the page - the simplest locator.

```html
<!-- HTML Example -->
<input id="username" type="text">
<button id="submit-btn">Submit</button>
```

**XPath:**
```xpath
//*[@id='username']
//input[@id='username']
//button[@id='submit-btn']
```

**CSS:**
```css
#username
input#username
#submit-btn
```

**Playwright:**
```javascript
page.locator('#username')
page.locator('input#username')
page.locator('#submit-btn')

// Best Practice - Semantic locators
page.getByRole('textbox', { name: 'Username' })
page.getByRole('button', { name: 'Submit' })
```

**✅ When to Use:**
- Element has a unique, stable ID
- ID doesn't change between page loads
- ID isn't dynamically generated (like `item-12345`)

**❌ When NOT to Use:**
- ID changes (dynamic IDs like `user_7849`)
- No ID attribute exists
- Multiple elements have same ID (bad HTML, but happens)

---

#### Finding by Class

Classes can be shared by multiple elements - less specific than ID.

```html
<!-- HTML Example -->
<button class="btn-primary">Save</button>
<button class="btn-primary">Submit</button>
<button class="btn-secondary">Cancel</button>
```

**XPath:**
```xpath
//button[@class='btn-primary']
//button[contains(@class,'btn-primary')]  // Safer for multiple classes
```

**CSS:**
```css
button.btn-primary
.btn-primary
button.btn-secondary
```

**Playwright:**
```javascript
page.locator('button.btn-primary')
page.locator('.btn-primary')

// Best Practice - Use text to differentiate
page.getByRole('button', { name: 'Save' })
page.getByRole('button', { name: 'Submit' })
```

**✅ When to Use:**
- Element has a descriptive class
- Class is stable (not dynamically generated)
- You need to find multiple similar elements

**❌ When NOT to Use:**
- Class is for styling only (like `mt-4`, `flex`, `red`)
- Class changes frequently
- Need to select specific instance (use text or other attribute)

---

#### Finding by Name

Common for form inputs.

```html
<!-- HTML Example -->
<input name="email" type="email">
<input name="password" type="password">
<select name="country">
```

**XPath:**
```xpath
//input[@name='email']
//input[@name='password']
//select[@name='country']
```

**CSS:**
```css
input[name="email"]
input[name="password"]
select[name="country"]
```

**Playwright:**
```javascript
page.locator('input[name="email"]')
page.locator('input[name="password"]')

// Best Practice - Use labels
page.getByLabel('Email')
page.getByLabel('Password')
page.getByLabel('Country')
```

**✅ When to Use:**
- Form elements
- Name attribute is stable
- Working with form submission

**❌ When NOT to Use:**
- Element has no name attribute
- Name is dynamically generated
- Better semantic option exists (label, placeholder)

---

#### 🎯 Practice Exercise 1: Login Form

**Task:** Locate all elements in this login form using ID, Class, and Name.

```html
<form id="login-form" class="auth-form">
  <h2 class="form-title">Login</h2>
  
  <input id="username" name="username" type="text" class="form-input">
  <input id="password" name="password" type="password" class="form-input">
  
  <button id="login-btn" class="btn-primary" type="submit">Login</button>
  <button class="btn-secondary" type="button">Cancel</button>
</form>
```

**Your Mission:**
1. Find the form container
2. Find the username input
3. Find the password input  
4. Find the Login button
5. Find the Cancel button
6. Find all inputs with class "form-input"

<details>
<summary>💡 Click to See Solutions</summary>

**1. Form Container:**
```javascript
// XPath
//form[@id='login-form']
//form[@class='auth-form']

// CSS
form#login-form
form.auth-form

// Playwright (Best)
page.locator('form#login-form')
page.getByRole('form')
```

**2. Username Input:**
```javascript
// XPath
//input[@id='username']
//input[@name='username']

// CSS
input#username
input[name="username"]

// Playwright (Best)
page.getByLabel('Username')
page.getByRole('textbox', { name: 'Username' })
```

**3. Password Input:**
```javascript
// XPath
//input[@id='password']
//input[@name='password']

// CSS
input#password
input[name="password"]

// Playwright (Best)
page.getByLabel('Password')
```

**4. Login Button:**
```javascript
// XPath
//button[@id='login-btn']
//button[@type='submit']

// CSS
button#login-btn
button[type="submit"]

// Playwright (Best)
page.getByRole('button', { name: 'Login' })
```

**5. Cancel Button:**
```javascript
// XPath
//button[@class='btn-secondary']
//button[text()='Cancel']

// CSS
button.btn-secondary

// Playwright (Best)
page.getByRole('button', { name: 'Cancel' })
```

**6. All Form Inputs:**
```javascript
// XPath
//input[@class='form-input']

// CSS
input.form-input

// Playwright
page.locator('input.form-input')
// Returns all matching elements
```

</details>

---

### Lesson 2: Finding by Text

**📝 What You'll Learn:**
- How to find elements by their visible text
- Exact vs partial text matching
- When text matching is the best approach

**Why This Matters:**  
Users see text, not IDs or classes. Text-based locators are often the most stable!

#### Exact Text Match

Find elements with specific text content.

```html
<!-- HTML Example -->
<button>Submit</button>
<button>Submit Form</button>
<a href="/home">Home</a>
<span>Welcome</span>
```

**XPath:**
```xpath
//button[text()='Submit']
//a[text()='Home']
//span[text()='Welcome']

// Case-sensitive and exact!
//button[text()='submit']  // ❌ Won't match 'Submit'
```

**CSS:**
```css
❌ Standard CSS cannot select by text
```

**Playwright:**
```javascript
page.getByText('Submit')  // Default: partial match
page.getByText('Submit', { exact: true })  // Exact match

page.getByRole('button', { name: 'Submit' })  // Best for buttons
page.getByRole('link', { name: 'Home' })      // Best for links

// Playwright normalizes whitespace automatically!
page.getByText('Welcome')  // Matches '  Welcome  '
```

**✅ When to Use:**
- Text is stable (not changing frequently)
- Text is unique on the page
- User-facing elements (buttons, links, labels)

**❌ When NOT to Use:**
- Text changes (translations, A/B testing)
- Text is very common ('OK', 'Cancel')
- Text contains dynamic data ('Item count: 5')

---

#### Partial Text Match (Contains)

Find elements containing specific text.

```html
<!-- HTML Example -->
<div>Total: $99.99</div>
<button>Click here to submit</button>
<p>Welcome back, John Smith</p>
```

**XPath:**
```xpath
//div[contains(text(),'Total')]
//button[contains(text(),'submit')]
//p[contains(text(),'Welcome')]

// Case-sensitive!
//div[contains(text(),'total')]  // ❌ Won't match 'Total'
```

**CSS:**
```css
❌ Cannot select by text content
```

**Playwright:**
```javascript
// Default behavior - contains (case-insensitive)
page.getByText('Total')      // Matches 'Total: $99.99'
page.getByText('submit')     // Matches 'Click here to submit'
page.getByText('Welcome')    // Matches 'Welcome back, John Smith'

// Pseudo-class alternative
page.locator('div:has-text("Total")')
page.locator('button:has-text("submit")')

// Regex for complex patterns
page.getByText(/Total: \$\d+\.\d+/)
page.getByText(/Welcome back, .+/)
```

**✅ When to Use:**
- Text has dynamic parts ('Total: $99')
- Want flexible matching
- Text is long and you only care about part of it

**❌ When NOT to Use:**
- Need exact match for precision
- Partial text appears in many places
- Performance is critical (slower than attribute matching)

---

#### Text in Descendant Elements

Find parent elements by text in their children.

```html
<!-- HTML Example -->
<div class="product-card">
  <h3>iPhone 15</h3>
  <span class="price">$999</span>
  <button>Add to Cart</button>
</div>
```

**XPath:**
```xpath
// Find card containing "iPhone 15"
//div[@class='product-card' and .//h3[text()='iPhone 15']]

// Find card containing "iPhone" anywhere
//div[@class='product-card' and contains(.,'iPhone')]
```

**CSS:**
```css
❌ Cannot filter by descendant text
```

**Playwright:**
```javascript
// Find card by text in descendant
page.locator('.product-card:has-text("iPhone 15")')

// Filter approach (more readable)
page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })

// Then find button inside that card
page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Add to Cart' })
```

---

#### 🎯 Practice Exercise 2: Text-Based Selection

**Task:** Find elements by text in this navigation menu.

```html
<nav class="main-nav">
  <a href="/">Home</a>
  <a href="/products">Our Products</a>
  <a href="/about">About Us</a>
  <a href="/contact">Contact Support</a>
  
  <div class="user-info">
    Welcome back, Sarah
    <button>Logout</button>
  </div>
</nav>
```

**Your Mission:**
1. Find the "Home" link (exact text)
2. Find any link containing "Products"
3. Find the div containing "Welcome"
4. Find the "Logout" button
5. Find the link containing "Contact"

<details>
<summary>💡 Click to See Solutions</summary>

**1. "Home" Link (Exact):**
```javascript
// XPath
//a[text()='Home']

// Playwright (Best)
page.getByRole('link', { name: 'Home' })
page.getByText('Home', { exact: true })
```

**2. Link Containing "Products":**
```javascript
// XPath
//a[contains(text(),'Products')]

// Playwright (Best)
page.getByRole('link', { name: /Products/ })
page.getByText('Products')  // Partial match by default
```

**3. Div Containing "Welcome":**
```javascript
// XPath
//div[contains(text(),'Welcome')]
//div[@class='user-info' and contains(.,'Welcome')]

// Playwright (Best)
page.locator('div:has-text("Welcome")')
page.locator('.user-info:has-text("Welcome")')
```

**4. "Logout" Button:**
```javascript
// XPath
//button[text()='Logout']

// Playwright (Best)
page.getByRole('button', { name: 'Logout' })
```

**5. Link Containing "Contact":**
```javascript
// XPath
//a[contains(text(),'Contact')]

// Playwright (Best)
page.getByRole('link', { name: /Contact/ })
page.getByText('Contact')
```

</details>

---

### Lesson 3: Single vs Multiple Attributes

**📝 What You'll Learn:**
- When one attribute is enough
- Combining multiple attributes for precision
- AND vs OR conditions

**Why This Matters:**  
More specific locators = more stable tests. Learn when to add more conditions!

#### Single Attribute (Simple Cases)

When one attribute uniquely identifies the element.

```html
<!-- HTML Example -->
<input id="email" type="email" name="user-email" class="form-input">
```

**When Single Attribute is Enough:**
```javascript
// ID is unique - use only ID
page.locator('#email')  ✅

// Don't overcomplicate!
page.locator('input#email[type="email"][name="user-email"]')  ❌ Too much!
```

**Rule:** Use the **minimum specificity** needed to uniquely identify the element.

---

#### Multiple Attributes (AND Condition)

When you need multiple attributes to be specific.

```html
<!-- HTML Example -->
<input type="text" name="first-name" class="form-input">
<input type="text" name="last-name" class="form-input">
<input type="email" name="email" class="form-input">
```

**XPath - Multiple Attributes:**
```xpath
// Both conditions must be true (AND)
//input[@type='text' and @name='first-name']
//input[@type='text'][@name='first-name']  // Alternative syntax

// Three conditions
//input[@type='text' and @name='first-name' and @class='form-input']
```

**CSS - Multiple Attributes:**
```css
/* Both conditions must be true (AND) */
input[type="text"][name="first-name"]

/* Three conditions */
input[type="text"][name="first-name"].form-input
```

**Playwright:**
```javascript
// CSS syntax (AND)
page.locator('input[type="text"][name="first-name"]')

// Best Practice - Use semantic locator
page.getByLabel('First Name')
```

**✅ When to Use Multiple Attributes:**
- Single attribute isn't specific enough
- Multiple similar elements exist
- Need to be very precise

---

#### Multiple Attributes (OR Condition)

When element might have one attribute OR another.

```html
<!-- HTML Example -->
<button id="submit">Submit</button>
<button id="save">Save</button>
```

**XPath - OR Condition:**
```xpath
// Match if has id='submit' OR id='save'
//button[@id='submit' or @id='save']

// Match button OR input
//button | //input
```

**CSS - OR Condition:**
```css
/* Comma-separated (OR) */
button#submit, button#save

/* Match button OR input */
button, input
```

**Playwright - OR Condition:**
```javascript
// CSS grouping
page.locator('button#submit, button#save')

// Playwright .or() method (best)
page.locator('#submit').or(page.locator('#save'))

// Semantic approach
page.getByRole('button', { name: 'Submit' })
  .or(page.getByRole('button', { name: 'Save' }))
```

---

#### 🎯 Practice Exercise 3: Multiple Attributes

```html
<form>
  <input type="text" name="username" class="required" placeholder="Username">
  <input type="password" name="password" class="required" placeholder="Password">
  <input type="email" name="email" placeholder="Email (optional)">
  
  <button type="submit" class="btn-primary">Login</button>
  <button type="button" class="btn-secondary">Cancel</button>
</form>
```

**Your Mission:**
1. Find the required text input (type="text" AND class="required")
2. Find the required password input
3. Find the submit button (type="submit")
4. Find any button (submit OR button type)
5. Find any required input (class="required")

<details>
<summary>💡 Click to See Solutions</summary>

**1. Required Text Input:**
```javascript
// XPath (AND)
//input[@type='text' and @class='required']

// CSS (AND)
input[type="text"].required

// Playwright
page.locator('input[type="text"].required')
page.getByPlaceholder('Username')  // Best
```

**2. Required Password Input:**
```javascript
// XPath
//input[@type='password' and @class='required']

// CSS
input[type="password"].required

// Playwright
page.getByLabel('Password')  // Best
```

**3. Submit Button:**
```javascript
// XPath
//button[@type='submit']

// CSS
button[type="submit"]

// Playwright
page.getByRole('button', { name: 'Login' })  // Best
```

**4. Any Button (OR):**
```javascript
// XPath
//button[@type='submit' or @type='button']
//button  // Simpler - just get any button

// CSS
button[type="submit"], button[type="button"]
button  // Simpler

// Playwright
page.locator('button')
page.getByRole('button')  // Best
```

**5. Any Required Input:**
```javascript
// XPath
//input[@class='required']

// CSS
input.required

// Playwright
page.locator('input.required')
```

</details>

---

### ✅ Beginner Level Complete!

**🎉 Congratulations!** You've mastered:
- Finding by ID, Class, Name
- Finding by text (exact and partial)
- Single vs multiple attributes
- AND vs OR conditions

**📊 Progress:** 25% Complete

**➡️ Next:** [Intermediate Level - Relationships](#intermediate-level)

---

## 🌿 Intermediate Level

**Goal:** Navigate relationships between elements  
**Time:** 3-4 hours  
**Prerequisites:** Complete Beginner Level

---

### Lesson 4: Parent-Child Relationships

**📝 What You'll Learn:**
- Finding children inside a parent
- Finding parent from a child
- Direct vs descendant relationships

**Why This Matters:**  
Real-world pages are hierarchical. Master navigation to find elements in context!

#### Finding Child Inside Parent (Going Down)

Most common relationship - find element inside a container.

```html
<!-- HTML Example -->
<div id="user-card">
  <h3>John Smith</h3>
  <span class="email">john@example.com</span>
  <button>Edit</button>
</div>
```

**Direct Child (>):**
Only immediate children, not grandchildren.

```html
<div id="container">
  <span>Direct child</span>
  <div>
    <span>Grandchild (not direct)</span>
  </div>
</div>
```

**XPath:**
```xpath
// Direct child (/)
//div[@id='container']/span

// Descendant (//) - any level deep
//div[@id='container']//span  // Matches both
```

**CSS:**
```css
/* Direct child (>) */
div#container > span

/* Descendant (space) - any level deep */
div#container span  /* Matches both */
```

**Playwright:**
```javascript
// Direct child
page.locator('div#container > span')

// Descendant (any level)
page.locator('div#container span')

// Scoped search (best practice)
const container = page.locator('#user-card')
await container.getByRole('heading')  // Find h3
await container.getByRole('button', { name: 'Edit' })
```

**Real Example - User Card:**
```javascript
// Find Edit button inside John Smith's card
const userCard = page.locator('#user-card')
  .filter({ hasText: 'John Smith' })

await userCard.getByRole('button', { name: 'Edit' }).click()
```

---

#### Finding Parent from Child (Going Up)

Harder - CSS can't do this natively!

```html
<!-- HTML Example -->
<div class="form-group">
  <label>Email</label>
  <input id="email" type="email">
  <span class="error">Invalid email</span>
</div>
```

**Goal:** From the input, find the parent form-group div.

**XPath:**
```xpath
// Parent (..)
//input[@id='email']/..

// Parent with condition
//input[@id='email']/parent::div[@class='form-group']

// Any ancestor
//input[@id='email']/ancestor::div[@class='form-group']
```

**CSS:**
```css
❌ Cannot select parent in standard CSS
```

**Playwright:**
```javascript
// XPath approach
page.locator('xpath=//input[@id="email"]/..')

// Better - find parent directly
page.locator('.form-group').filter({
  has: page.locator('#email')
})

// Best - select parent first
const formGroup = page.locator('.form-group')
await formGroup.locator('input#email').fill('test@example.com')
```

**💡 Pro Tip:** In Playwright, it's usually better to select the parent first, then find children!

---

#### 🎯 Practice Exercise 4: Parent-Child

```html
<div class="product-grid">
  <div class="product-card" data-id="1">
    <img src="phone.jpg" alt="Phone">
    <h3>iPhone 15</h3>
    <span class="price">$999</span>
    <button class="add-to-cart">Add to Cart</button>
  </div>
  
  <div class="product-card" data-id="2">
    <img src="laptop.jpg" alt="Laptop">
    <h3>MacBook Pro</h3>
    <span class="price">$1,999</span>
    <button class="add-to-cart">Add to Cart</button>
  </div>
</div>
```

**Your Mission:**
1. Find all product cards
2. Find the heading inside first product card
3. Find "Add to Cart" button in iPhone card
4. Find the price in MacBook card
5. Find parent div of the iPhone heading

<details>
<summary>💡 Click to See Solutions</summary>

**1. All Product Cards:**
```javascript
// Any approach
page.locator('.product-card')
```

**2. Heading in First Card:**
```javascript
// XPath
(//div[@class='product-card'])[1]//h3

// CSS
.product-card:first-child h3

// Playwright (Best)
page.locator('.product-card').first().getByRole('heading')
```

**3. Button in iPhone Card:**
```javascript
// XPath
//div[@class='product-card' and .//h3[text()='iPhone 15']]//button

// Playwright (Best)
page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })
  .getByRole('button', { name: 'Add to Cart' })
```

**4. Price in MacBook Card:**
```javascript
// Playwright (Best)
page.locator('.product-card')
  .filter({ hasText: 'MacBook Pro' })
  .locator('.price')
```

**5. Parent of iPhone Heading:**
```javascript
// XPath
//h3[text()='iPhone 15']/ancestor::div[@class='product-card']

// Playwright
page.locator('.product-card')
  .filter({ has: page.getByRole('heading', { name: 'iPhone 15' }) })
```

</details>

---

### Lesson 5: Working with Siblings

**📝 What You'll Learn:**
- Finding next/previous siblings
- Finding all siblings
- When to use sibling navigation

**Why This Matters:**  
Form labels, error messages, and horizontal layouts use sibling relationships!

#### Next Sibling (Following)

Find element that comes after another.

```html
<!-- HTML Example -->
<label for="email">Email</label>
<input id="email" type="email">
<span class="error">Invalid email</span>
```

**Goal:** From label, find the input. From input, find error message.

**XPath:**
```xpath
// Immediate next sibling
//label[@for='email']/following-sibling::input[1]

// Any following sibling (all that come after)
//label[@for='email']/following-sibling::input

// Specific following sibling
//input[@id='email']/following-sibling::span[@class='error']
```

**CSS:**
```css
/* Immediate next sibling (+) */
label[for="email"] + input

/* Any following sibling (~) */
label[for="email"] ~ input
label[for="email"] ~ span.error
```

**Playwright:**
```javascript
// CSS approach
page.locator('label[for="email"] + input')
page.locator('input#email ~ span.error')

// Better - find by label
page.getByLabel('Email')  // Automatically finds associated input!

// Error message after input
page.locator('input#email ~ span.error')
```

---

#### Previous Sibling (Preceding)

Find element that comes before another.

```html
<!-- HTML Example -->
<span class="icon">📧</span>
<input id="email" type="email">
```

**Goal:** From input, find the icon before it.

**XPath:**
```xpath
// Immediate previous sibling
//input[@id='email']/preceding-sibling::span[1]

// Any preceding sibling
//input[@id='email']/preceding-sibling::span
```

**CSS:**
```css
❌ Cannot select preceding siblings
```

**Playwright:**
```javascript
// XPath only option
page.locator('xpath=//input[@id="email"]/preceding-sibling::span[1]')

// Better - select icon directly
page.locator('.icon')
```

**💡 Pro Tip:** Preceding sibling selection is rare. If you need it often, reconsider your strategy!

---

#### 🎯 Practice Exercise 5: Siblings

```html
<div class="form-row">
  <label for="username">Username</label>
  <input id="username" type="text">
  <span class="help-text">Must be 3-20 characters</span>
</div>

<div class="form-row">
  <label for="password">Password</label>
  <input id="password" type="password">
  <span class="help-text">Must include numbers</span>
  <span class="error" style="display:none">Password too weak</span>
</div>
```

**Your Mission:**
1. Find input next to "Username" label
2. Find help text after username input
3. Find help text after password input
4. Find error message after password help text
5. Find label before username input

<details>
<summary>💡 Click to See Solutions</summary>

**1. Input Next to Username Label:**
```javascript
// XPath
//label[@for='username']/following-sibling::input

// CSS
label[for="username"] + input

// Playwright (Best)
page.getByLabel('Username')
```

**2. Help Text After Username Input:**
```javascript
// XPath
//input[@id='username']/following-sibling::span[@class='help-text']

// CSS
input#username ~ span.help-text

// Playwright
page.locator('input#username ~ span.help-text')
```

**3. Help Text After Password Input:**
```javascript
// Playwright (with filter to get right one)
page.locator('input#password ~ span.help-text')
```

**4. Error After Help Text:**
```javascript
// XPath
//input[@id='password']/following-sibling::span[@class='error']

// CSS
input#password ~ span.error

// Playwright
page.locator('input#password ~ span.error')
```

**5. Label Before Username Input:**
```javascript
// XPath
//input[@id='username']/preceding-sibling::label

// Playwright
page.locator('xpath=//input[@id="username"]/preceding-sibling::label')
// Or better: select label directly
page.locator('label[for="username"]')
```

</details>

---

### Lesson 6: Element States

**📝 What You'll Learn:**
- Enabled vs Disabled
- Visible vs Hidden
- Checked vs Unchecked
- Valid vs Invalid

**Why This Matters:**  
Test the right element states - critical for form validation and UI testing!

#### Enabled vs Disabled

```html
<!-- HTML Example -->
<button id="submit" type="submit">Submit</button>
<button id="cancel" disabled>Cancel</button>
<input id="email" type="email">
<input id="phone" type="tel" disabled>
```

**XPath:**
```xpath
// Enabled (no disabled attribute)
//button[not(@disabled)]
//input[not(@disabled)]

// Disabled
//button[@disabled]
//input[@disabled]
```

**CSS:**
```css
/* Enabled */
button:enabled
input:enabled

/* Disabled */
button:disabled
input:disabled
```

**Playwright:**
```javascript
// Enabled locators
page.locator('button:enabled')
page.locator('input:enabled')

// Disabled locators
page.locator('button:disabled')
page.locator('input:disabled')

// Best - Use assertions to verify state
await expect(page.locator('#submit')).toBeEnabled()
await expect(page.locator('#cancel')).toBeDisabled()

// Best - Use role with state
page.getByRole('button', { name: 'Submit', disabled: false })
page.getByRole('button', { name: 'Cancel', disabled: true })
```

---

#### Visible vs Hidden

```html
<!-- HTML Example -->
<div id="visible">I am visible</div>
<div id="hidden" style="display: none">I am hidden</div>
<div id="invisible" style="visibility: hidden">I am invisible</div>
```

**XPath:**
```xpath
// XPath cannot reliably detect visibility
// Can only check style attribute (not computed styles)
//div[not(contains(@style,'display: none'))]
```

**CSS:**
```css
/* CSS cannot reliably detect visibility in standard CSS */
div:not([style*="display: none"])  /* Only inline styles */
```

**Playwright:**
```javascript
// :visible pseudo-class (checks computed styles!)
page.locator('div:visible')

// Visibility filter
page.locator('div >> visible=true')

// Best - Use assertions
await expect(page.locator('#visible')).toBeVisible()
await expect(page.locator('#hidden')).toBeHidden()

// Check visibility before interaction
if (await page.locator('#modal').isVisible()) {
  await page.locator('#modal button').click()
}
```

**What `:visible` Checks:**
1. Element has non-zero size
2. `display` is not `none`
3. `visibility` is not `hidden`
4. `opacity` is not `0`
5. Not covered by other elements

---

#### Checked vs Unchecked

```html
<!-- HTML Example -->
<input type="checkbox" id="agree" checked>
<input type="checkbox" id="newsletter">
<input type="radio" name="gender" value="male" checked>
<input type="radio" name="gender" value="female">
```

**XPath:**
```xpath
// Checked
//input[@type='checkbox' and @checked]
//input[@type='radio' and @checked]

// Unchecked
//input[@type='checkbox' and not(@checked)]
```

**CSS:**
```css
/* Checked */
input[type="checkbox"]:checked
input[type="radio"]:checked

/* Unchecked */
input[type="checkbox"]:not(:checked)
```

**Playwright:**
```javascript
// Checked locators
page.locator('input[type="checkbox"]:checked')
page.locator('input[type="radio"]:checked')

// Unchecked
page.locator('input[type="checkbox"]:not(:checked)')

// Best - Use assertions
await expect(page.locator('#agree')).toBeChecked()
await expect(page.locator('#newsletter')).not.toBeChecked()

// Best - Use role with state
page.getByRole('checkbox', { name: 'Agree', checked: true })
page.getByRole('radio', { name: 'Male', checked: true })
```

---

#### 🎯 Practice Exercise 6: States

```html
<form>
  <input type="text" id="username" value="John">
  <input type="text" id="readonly-field" readonly value="Read only">
  <input type="email" id="email" required>
  
  <input type="checkbox" id="terms" checked>
  <input type="checkbox" id="marketing">
  
  <button id="submit" type="submit">Submit</button>
  <button id="reset" type="reset" disabled>Reset</button>
</form>
```

**Your Mission:**
1. Find all enabled inputs
2. Find all checked checkboxes
3. Find the disabled button
4. Find the readonly input
5. Find the required input

<details>
<summary>💡 Click to See Solutions</summary>

**1. All Enabled Inputs:**
```javascript
// CSS
input:enabled

// Playwright
page.locator('input:enabled')
```

**2. All Checked Checkboxes:**
```javascript
// CSS
input[type="checkbox"]:checked

// Playwright
page.locator('input[type="checkbox"]:checked')
// Count: await page.locator('input:checked').count()
```

**3. Disabled Button:**
```javascript
// CSS
button:disabled

// Playwright (Best)
page.getByRole('button', { name: 'Reset', disabled: true })
await expect(page.locator('#reset')).toBeDisabled()
```

**4. Readonly Input:**
```javascript
// CSS
input:read-only

// Playwright
page.locator('input:read-only')
await expect(page.locator('#readonly-field')).not.toBeEditable()
```

**5. Required Input:**
```javascript
// CSS
input:required

// Playwright
page.locator('input:required')
```

</details>

---

### Lesson 7: Lists & Tables

**📝 What You'll Learn:**
- Finding first, last, nth elements
- Working with table rows and cells
- Filtering lists

**Why This Matters:**  
Most applications display data in lists and tables. Master these patterns!

#### Position-Based Selection

```html
<!-- HTML Example -->
<ul id="menu">
  <li>Home</li>
  <li>Products</li>
  <li>About</li>
  <li>Contact</li>
</ul>
```

**First Element:**
```javascript
// XPath
(//ul[@id='menu']/li)[1]
//ul[@id='menu']/li[1]

// CSS
ul#menu li:first-child

// Playwright (Best)
page.locator('ul#menu li').first()
```

**Last Element:**
```javascript
// XPath
(//ul[@id='menu']/li)[last()]
//ul[@id='menu']/li[last()]

// CSS
ul#menu li:last-child

// Playwright (Best)
page.locator('ul#menu li').last()
```

**Nth Element:**
```javascript
// XPath (1-indexed)
(//ul[@id='menu']/li)[3]  // 3rd element

// CSS (1-indexed)
ul#menu li:nth-child(3)  // 3rd element

// Playwright (0-indexed!)
page.locator('ul#menu li').nth(2)  // ⚠️ 0-indexed! 3rd element
```

**Even/Odd:**
```javascript
// XPath
//li[position() mod 2 = 0]  // Even (2nd, 4th, 6th...)
//li[position() mod 2 = 1]  // Odd (1st, 3rd, 5th...)

// CSS
li:nth-child(even)
li:nth-child(odd)

// Playwright
page.locator('li:nth-child(even)')
page.locator('li:nth-child(odd)')
```

---

#### Working with Tables

```html
<!-- HTML Example -->
<table id="users">
  <thead>
    <tr>
      <th>Name</th>
      <th>Email</th>
      <th>Actions</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>John Smith</td>
      <td>john@example.com</td>
      <td><button>Edit</button></td>
    </tr>
    <tr>
      <td>Jane Doe</td>
      <td>jane@example.com</td>
      <td><button>Edit</button></td>
    </tr>
  </tbody>
</table>
```

**All Rows:**
```javascript
// XPath
//table[@id='users']//tr

// CSS
table#users tr

// Playwright (Best)
page.getByRole('row')
```

**Specific Cell:**
```javascript
// XPath - 2nd row, 1st cell
(//table[@id='users']//tr)[2]//td[1]

// CSS
table#users tr:nth-child(2) td:nth-child(1)

// Playwright
page.locator('table#users tr').nth(1).locator('td').first()
```

**Row by Content:**
```javascript
// XPath - Row containing "John Smith"
//tr[td[text()='John Smith']]

// Playwright (Best)
page.getByRole('row', { name: /John Smith/ })
```

**Edit Button in Specific Row:**
```javascript
// XPath
//tr[td[text()='John Smith']]//button[text()='Edit']

// Playwright (Best)
page.getByRole('row', { name: /John Smith/ })
  .getByRole('button', { name: 'Edit' })
```

---

#### 🎯 Practice Exercise 7: Tables

```html
<table id="products">
  <tr>
    <td>iPhone 15</td>
    <td>$999</td>
    <td><button>Buy</button></td>
  </tr>
  <tr>
    <td>iPad Pro</td>
    <td>$799</td>
    <td><button>Buy</button></td>
  </tr>
  <tr>
    <td>MacBook</td>
    <td>$1,999</td>
    <td><button>Buy</button></td>
  </tr>
</table>
```

**Your Mission:**
1. Find first product row
2. Find last product row
3. Find second row's price
4. Find row containing "iPad Pro"
5. Find Buy button in MacBook row

<details>
<summary>💡 Click to See Solutions</summary>

**1. First Product Row:**
```javascript
// Playwright
page.locator('table#products tr').first()
```

**2. Last Product Row:**
```javascript
// Playwright
page.locator('table#products tr').last()
```

**3. Second Row Price:**
```javascript
// XPath
(//table[@id='products']//tr)[2]//td[2]

// Playwright
page.locator('table#products tr').nth(1).locator('td').nth(1)
// Or by row content:
page.getByRole('row', { name: /iPad Pro/ }).locator('td').nth(1)
```

**4. Row with iPad Pro:**
```javascript
// XPath
//tr[td[text()='iPad Pro']]

// Playwright (Best)
page.getByRole('row', { name: /iPad Pro/ })
```

**5. Buy Button in MacBook Row:**
```javascript
// XPath
//tr[td[text()='MacBook']]//button

// Playwright (Best)
page.getByRole('row', { name: /MacBook/ })
  .getByRole('button', { name: 'Buy' })
```

</details>

---

### ✅ Intermediate Level Complete!

**🎉 Congratulations!** You've mastered:
- Parent-child relationships
- Sibling navigation
- Element states (enabled, visible, checked)
- Lists and tables

**📊 Progress:** 50% Complete

**➡️ Next:** [Advanced Level](#advanced-level)

---

## 🌳 Advanced Level

**Goal:** Handle dynamic content and complex scenarios  
**Time:** 4-5 hours  
**Prerequisites:** Complete Intermediate Level

---

### Lesson 8: Dynamic IDs & Partial Matching

**📝 What You'll Learn:**
- Handling elements with changing IDs
- Partial attribute matching (starts-with, ends-with, contains)
- Building flexible locators

**Why This Matters:**  
Modern frameworks generate dynamic IDs. You need flexible strategies!

#### Dynamic IDs Problem

```html
<!-- HTML changes on each page load -->
<!-- Load 1: -->
<div id="user-card-7849">
  <h3>John Smith</h3>
</div>

<!-- Load 2: -->
<div id="user-card-1234">
  <h3>John Smith</h3>
</div>
```

**❌ This Fails:**
```javascript
page.locator('#user-card-7849')  // Only works on first load
```

**✅ Solutions:**

---

#### Starts-With (Prefix Matching)

When ID starts with predictable pattern.

**XPath:**
```xpath
//div[starts-with(@id,'user-card-')]
//button[starts-with(@id,'btn-')]
```

**CSS:**
```css
div[id^="user-card-"]
button[id^="btn-"]
```

**Playwright:**
```javascript
page.locator('div[id^="user-card-"]')
page.locator('button[id^="btn-"]')

// Best - avoid dynamic IDs entirely
page.locator('[data-testid="user-card"]')  // Add stable test ID
```

---

#### Ends-With (Suffix Matching)

When ID ends with predictable pattern.

**XPath:**
```xpath
❌ Not available in XPath 1.0
// XPath 2.0: ends-with(@id,'-submit')
```

**CSS:**
```css
button[id$="-submit"]
input[id$="-email"]
```

**Playwright:**
```javascript
page.locator('button[id$="-submit"]')
page.locator('input[id$="-email"]')
```

---

#### Contains (Substring Matching)

When ID contains predictable part.

**XPath:**
```xpath
//div[contains(@id,'user-card')]
//button[contains(@class,'primary')]
```

**CSS:**
```css
div[id*="user-card"]
button[class*="primary"]
```

**Playwright:**
```javascript
page.locator('div[id*="user-card"]')
page.locator('button[class*="primary"]')

// Better - combine with other attributes
page.locator('button[class*="primary"][type="submit"]')
```

---

#### Best Practices for Dynamic IDs

**❌ Don't:**
```javascript
// Hardcode dynamic ID
page.locator('#item-78493')

// Over-rely on partial matching
page.locator('[id*="item"]')  // Too generic
```

**✅ Do:**
```javascript
// Add stable test IDs
<div data-testid="user-card">
page.getByTestId('user-card')

// Use semantic attributes
page.getByRole('button', { name: 'Submit' })

// Use text content
page.getByText('John Smith')

// Combine stable attributes
page.locator('[data-component="user-card"][data-user="john"]')
```

---

#### 🎯 Practice Exercise 8: Dynamic IDs

```html
<!-- This HTML changes on each load -->
<div id="product-card-RANDOM123" class="product">
  <h3>iPhone 15</h3>
  <span class="price" id="price-RANDOM456">$999</span>
  <button id="btn-buy-RANDOM789">Buy Now</button>
</div>
```

**Your Mission:**
1. Find the product card (dynamic ID)
2. Find the price span (dynamic ID)
3. Find the buy button (dynamic ID)
4. Suggest better approach

<details>
<summary>💡 Click to See Solutions</summary>

**1. Product Card (starts-with):**
```javascript
// XPath
//div[starts-with(@id,'product-card-')]

// CSS
div[id^="product-card-"]

// Playwright
page.locator('div[id^="product-card-"]')

// Better
page.locator('div.product')  // Use class
```

**2. Price Span:**
```javascript
// Partial matching
page.locator('span[id^="price-"]')

// Better - use class
page.locator('span.price')

// Best - get by card context
page.locator('.product').locator('.price')
```

**3. Buy Button:**
```javascript
// Partial matching
page.locator('button[id^="btn-buy-"]')

// Better - use text
page.getByRole('button', { name: 'Buy Now' })
```

**4. Best Approach - Add Test IDs:**
```html
<div data-testid="product-card" class="product">
  <h3>iPhone 15</h3>
  <span data-testid="product-price">$999</span>
  <button data-testid="buy-button">Buy Now</button>
</div>
```

```javascript
page.getByTestId('product-card')
page.getByTestId('product-price')
page.getByTestId('buy-button')
```

</details>

---

### Lesson 9: Shadow DOM & IFrames

**📝 What You'll Learn:**
- What Shadow DOM is and why it exists
- How to access Shadow DOM elements
- Working with iframes
- Nested structures

**Why This Matters:**  
Modern web components use Shadow DOM. Payment widgets use iframes. You must handle both!

#### Understanding Shadow DOM

**What is Shadow DOM?**
Encapsulated DOM tree attached to an element.

```html
<!-- Regular DOM (you can see this) -->
<custom-element>
  #shadow-root (open)
    <!-- Shadow DOM (encapsulated) -->
    <button>Click Me</button>
    <style>/* Isolated styles */</style>
</custom-element>
```

**Why Shadow DOM?**
- Style isolation (component CSS doesn't leak)
- DOM encapsulation (internal structure hidden)
- Used by Web Components, Lit, Material Design

---

#### Accessing Shadow DOM Elements

**The Problem:**
```javascript
// ❌ This doesn't work - can't pierce shadow boundary
document.querySelector('custom-element button')  // Returns null
```

**Solution Depends on Framework:**

**Standard JavaScript/Selenium (Manual):**
```javascript
// Must manually access shadow root
const host = document.querySelector('custom-element')
const shadowRoot = host.shadowRoot  // Get shadow root
const button = shadowRoot.querySelector('button')  // Then search inside
```

**Selenium (Programmatic):**
```java
WebElement host = driver.findElement(By.cssSelector("custom-element"));
SearchContext shadowRoot = host.getShadowRoot();  // Manual step
WebElement button = shadowRoot.findElement(By.cssSelector("button"));
```

**Playwright (Automatic - Direct Locator!):**
```javascript
// ✅ Playwright automatically pierces open shadow DOM!
await page.locator('custom-element button').click()

// Works with nested shadow DOM too!
await page.locator('app-root custom-card button').click()

// Works with semantic locators
await page.locator('custom-element').getByRole('button').click()
```

**Key Insight:**
- **Selenium/Puppeteer**: Programmatic (manual `.getShadowRoot()` calls)
- **Playwright**: Direct Locator (automatic piercing!)

---

#### Shadow DOM Example

```html
<payment-widget>
  #shadow-root (open)
    <div class="payment-form">
      <input id="card-number" placeholder="Card Number">
      <input id="cvv" placeholder="CVV">
      <button class="submit">Pay Now</button>
    </div>
</payment-widget>
```

**Playwright (Easy!):**
```javascript
// Direct access - Playwright pierces automatically
await page.locator('payment-widget input#card-number').fill('4111111111111111')
await page.locator('payment-widget input#cvv').fill('123')
await page.locator('payment-widget button.submit').click()

// Or with semantic locators
await page.locator('payment-widget')
  .getByPlaceholder('Card Number')
  .fill('4111111111111111')
```

**Selenium (Complex):**
```java
// Manual shadow root access required
WebElement widget = driver.findElement(By.cssSelector("payment-widget"));
SearchContext shadow = widget.getShadowRoot();
shadow.findElement(By.id("card-number")).sendKeys("4111111111111111");
shadow.findElement(By.id("cvv")).sendKeys("123");
shadow.findElement(By.cssSelector("button.submit")).click();
```

---

#### Working with IFrames

**What are IFrames?**
Separate HTML documents embedded in a page.

```html
<!-- Main page -->
<body>
  <h1>Main Page</h1>
  
  <!-- Separate document inside iframe -->
  <iframe id="payment-frame" src="https://payment.example.com">
    <!-- Separate DOM inside -->
    <html>
      <body>
        <input id="cardNumber">
        <button>Pay</button>
      </body>
    </html>
  </iframe>
</body>
```

**The Problem:**
```javascript
// ❌ Can't access iframe content directly
page.locator('input#cardNumber')  // Not in main page!
```

---

#### Accessing IFrame Elements

**Selenium (Programmatic - Manual Switching):**
```java
// Must switch to iframe context
driver.switchTo().frame("payment-frame");  // Manual switch
driver.findElement(By.id("cardNumber")).sendKeys("1234");
driver.switchTo().defaultContent();  // Switch back
```

**Playwright (Direct Locator):**
```javascript
// frameLocator creates locator for iframe content
const paymentFrame = page.frameLocator('#payment-frame')

// Now find elements inside iframe
await paymentFrame.locator('#cardNumber').fill('4111111111111111')
await paymentFrame.getByRole('button', { name: 'Pay' }).click()

// No manual switching needed!
```

---

#### Nested IFrames

```html
<iframe id="outer">
  <iframe id="inner">
    <button>Click Me</button>
  </iframe>
</iframe>
```

**Selenium (Multiple Switches):**
```java
driver.switchTo().frame("outer");
driver.switchTo().frame("inner");
driver.findElement(By.tagName("button")).click();
driver.switchTo().defaultContent();
```

**Playwright (Chain frameLocators):**
```javascript
// Chain frameLocators - no switching!
await page
  .frameLocator('#outer')
  .frameLocator('#inner')
  .getByRole('button')
  .click()
```

---

#### 🎯 Practice Exercise 9: Shadow DOM & IFrames

```html
<!-- Page with both Shadow DOM and IFrame -->
<custom-widget>
  #shadow-root
    <iframe id="payment">
      <form>
        <input id="card" placeholder="Card Number">
        <button>Submit</button>
      </form>
    </iframe>
</custom-widget>
```

**Your Mission (Playwright):**
1. Access the iframe inside shadow DOM
2. Fill the card number input
3. Click the submit button

<details>
<summary>💡 Click to See Solutions</summary>

```javascript
// Playwright handles Shadow DOM automatically,
// then use frameLocator for iframe

// Access iframe inside shadow DOM
const paymentFrame = page
  .locator('custom-widget')  // Shadow host
  .frameLocator('#payment')  // IFrame inside shadow

// Fill input inside iframe (which is inside shadow DOM!)
await paymentFrame.locator('#card').fill('4111111111111111')

// Click button
await paymentFrame.getByRole('button', { name: 'Submit' }).click()

// That's it! Playwright handles:
// 1. Shadow DOM piercing (automatic)
// 2. IFrame context (via frameLocator)
```

**Key Takeaway:**
- Playwright makes complex structures simple
- Shadow DOM: automatic piercing
- IFrames: use frameLocator()
- Can be combined seamlessly

</details>

---

### Lesson 10: Complex Filtering

**📝 What You'll Learn:**
- Empty vs non-empty elements
- Counting children
- Complex AND/OR conditions
- Multiple filters

**Why This Matters:**  
Real applications need sophisticated filtering. Master these advanced patterns!

#### Empty vs Non-Empty Elements

```html
<div id="empty"></div>
<div id="has-content">Text here</div>
<ul id="empty-list"></ul>
<ul id="has-items">
  <li>Item 1</li>
</ul>
```

**XPath:**
```xpath
// Empty (no children)
//div[not(node())]
//ul[not(node())]

// Not empty (has children)
//div[node()]
//ul[li]
```

**CSS:**
```css
/* Empty */
div:empty
ul:empty

/* Not empty */
div:not(:empty)
ul:not(:empty)
```

**Playwright:**
```javascript
// Empty
page.locator('div:empty')
page.locator('ul:empty')

// Not empty
page.locator('div:not(:empty)')

// Best - assertion
await expect(page.locator('#empty-list')).toBeEmpty()
```

**Use Cases:**
- Verify list loaded (not empty)
- Check error message container (empty = no errors)
- Validate forms cleared

---

#### Counting Children

```html
<ul id="three-items">
  <li>One</li>
  <li>Two</li>
  <li>Three</li>
</ul>
```

**XPath:**
```xpath
// Exactly 3 children
//ul[count(li)=3]

// At least 2 children
//ul[count(li)>=2]

// More than 5 children
//ul[count(li)>5]
```

**CSS:**
```css
/* Complex - check if 3rd exists and is last */
ul:has(li:nth-child(3):last-child)
```

**Playwright:**
```javascript
// Best - assertion
await expect(page.locator('#three-items li')).toHaveCount(3)

// Conditional logic
const count = await page.locator('ul li').count()
if (count > 5) {
  // Handle pagination
}
```

---

#### Complex AND Conditions

Multiple conditions all must be true.

```html
<button class="btn-primary" type="submit" data-action="save">
  Save
</button>
```

**XPath:**
```xpath
// All conditions must match
//button[@class='btn-primary' and @type='submit' and @data-action='save']
```

**CSS:**
```css
/* All conditions must match */
button.btn-primary[type="submit"][data-action="save"]
```

**Playwright:**
```javascript
// CSS approach
page.locator('button.btn-primary[type="submit"][data-action="save"]')

// .and() operator
page.locator('button.btn-primary')
  .and(page.locator('[type="submit"]'))
  .and(page.locator('[data-action="save"]'))

// Best - semantic
page.getByRole('button', { name: 'Save' })
```

---

#### Complex OR Conditions

Any condition can be true.

```html
<button id="submit">Submit</button>
<button id="save">Save</button>
```

**XPath:**
```xpath
// Match either
//button[@id='submit' or @id='save']
```

**CSS:**
```css
/* Comma-separated */
button#submit, button#save
```

**Playwright:**
```javascript
// CSS grouping
page.locator('button#submit, button#save')

// .or() operator (best)
page.locator('#submit').or(page.locator('#save'))

// Semantic
page.getByRole('button', { name: 'Submit' })
  .or(page.getByRole('button', { name: 'Save' }))
```

---

#### Multiple Filters

Chain filters for complex scenarios.

```html
<div class="product-card">
  <img src="phone.jpg">
  <h3>iPhone 15</h3>
  <span class="badge">Sale</span>
  <span class="price">$999</span>
  <button>Add to Cart</button>
</div>
```

**Task:** Find product cards that:
1. Have an image AND
2. Contain text "iPhone" AND
3. Have a "Sale" badge AND
4. Are visible

**Playwright (Chained Filters):**
```javascript
const productCard = page.locator('.product-card')
  .filter({ has: page.locator('img') })           // Has image
  .filter({ hasText: 'iPhone' })                   // Contains "iPhone"
  .filter({ has: page.locator('.badge:text-is("Sale")') })  // Has Sale badge
  .locator(':visible')                             // Is visible

await productCard.getByRole('button', { name: 'Add to Cart' }).click()
```

**Why This is Powerful:**
- Each filter narrows down results
- Readable and maintainable
- Easy to debug (remove filters one by one)
- Can be reused

---

#### 🎯 Practice Exercise 10: Complex Filtering

```html
<div class="product-grid">
  <div class="product-card">
    <h3>iPhone 15</h3>
    <span class="price">$999</span>
  </div>
  
  <div class="product-card sold-out">
    <h3>iPad Pro</h3>
    <span class="price">$799</span>
    <span class="badge">Sold Out</span>
  </div>
  
  <div class="product-card">
    <img src="macbook.jpg">
    <h3>MacBook Pro</h3>
    <span class="price">$1,999</span>
    <span class="badge">Sale</span>
    <button>Buy</button>
  </div>
</div>
```

**Your Mission:**
1. Find all products that are NOT sold out
2. Find all products with images
3. Find products with "Sale" badge
4. Find products with images AND sale badge
5. Find products that are available (not sold out) AND have buy button

<details>
<summary>💡 Click to See Solutions</summary>

**1. NOT Sold Out:**
```javascript
// CSS
page.locator('.product-card:not(.sold-out)')

// Playwright filter
page.locator('.product-card')
  .filter({ hasNotText: 'Sold Out' })
```

**2. With Images:**
```javascript
// Playwright
page.locator('.product-card:has(img)')
// Or
page.locator('.product-card')
  .filter({ has: page.locator('img') })
```

**3. With Sale Badge:**
```javascript
// Playwright
page.locator('.product-card')
  .filter({ has: page.locator('.badge:text-is("Sale")') })
```

**4. Images AND Sale (Multiple Conditions):**
```javascript
// Playwright chained filters
page.locator('.product-card')
  .filter({ has: page.locator('img') })
  .filter({ has: page.locator('.badge:text-is("Sale")') })
```

**5. Available AND Has Buy Button:**
```javascript
// Playwright
page.locator('.product-card')
  .filter({ hasNotText: 'Sold Out' })
  .filter({ has: page.locator('button') })

// Count them
const availableWithButton = await page.locator('.product-card')
  .filter({ hasNotText: 'Sold Out' })
  .filter({ has: page.locator('button') })
  .count()
// Result: 1 (MacBook Pro)
```

</details>

---

### ✅ Advanced Level Complete!

**🎉 Congratulations!** You've mastered:
- Dynamic IDs and partial matching
- Shadow DOM and IFrames
- Complex filtering and conditions
- Advanced selection strategies

**📊 Progress:** 75% Complete

**➡️ Next:** [Playwright Mastery](#playwright-mastery)

---

## 🚀 Playwright Mastery

**Goal:** Master Playwright-specific features and best practices  
**Time:** 3-4 hours  
**Prerequisites:** Complete Advanced Level

---

### Lesson 11: Semantic Locators

**📝 What You'll Learn:**
- getByRole and accessibility
- getByLabel for forms
- getByPlaceholder, getByText
- When to use each

**Why This Matters:**  
Semantic locators are the most stable! They align with how users interact with your app.

#### getByRole - The King of Locators

Based on ARIA roles and HTML semantics.

**Common Roles:**
- `button` - <button>, <input type="button">, role="button"
- `link` - <a href="...">
- `textbox` - <input type="text">, <textarea>
- `checkbox` - <input type="checkbox">
- `radio` - <input type="radio">
- `combobox` - <select>
- `heading` - <h1>, <h2>, etc.
- `img` - <img>
- `table`, `row`, `cell` - Table elements

**Basic Usage:**
```javascript
// Find any button
page.getByRole('button')

// Find specific button by name
page.getByRole('button', { name: 'Submit' })

// Find link
page.getByRole('link', { name: 'Home' })

// Find heading
page.getByRole('heading', { name: 'Login' })
```

**With State:**
```javascript
// Enabled button
page.getByRole('button', { name: 'Submit', disabled: false })

// Checked checkbox
page.getByRole('checkbox', { name: 'Agree', checked: true })

// Specific heading level
page.getByRole('heading', { level: 2, name: 'Products' })
```

**Real Example:**
```html
<form>
  <h2>Login</h2>
  <input type="text" aria-label="Username">
  <input type="password" aria-label="Password">
  <button type="submit">Sign In</button>
  <a href="/forgot">Forgot Password?</a>
</form>
```

```javascript
// Perfect semantic locators
await expect(page.getByRole('heading', { name: 'Login' })).toBeVisible()
await page.getByRole('textbox', { name: 'Username' }).fill('john')
await page.getByRole('textbox', { name: 'Password' }).fill('secret')
await page.getByRole('button', { name: 'Sign In' }).click()
await page.getByRole('link', { name: 'Forgot Password?' }).click()
```

**Why getByRole is Best:**
- ✅ Tests accessibility (if role works, screen readers work)
- ✅ Independent of implementation (doesn't care about classes/IDs)
- ✅ Matches how users see the page
- ✅ Most stable across refactoring

---

#### getByLabel - Perfect for Forms

Finds input by its associated label.

```html
<!-- Explicit association -->
<label for="email">Email Address</label>
<input id="email" type="email">

<!-- Implicit association -->
<label>
  Password
  <input type="password">
</label>
```

**Usage:**
```javascript
// Finds input by label text
await page.getByLabel('Email Address').fill('user@example.com')
await page.getByLabel('Password').fill('secret123')

// Partial match
await page.getByLabel(/email/i).fill('user@example.com')

// Exact match
await page.getByLabel('Email', { exact: true }).fill('user@example.com')
```

**Why getByLabel is Great:**
- ✅ How users identify form fields
- ✅ Tests that labels exist (accessibility!)
- ✅ Doesn't depend on IDs or names
- ✅ Works with any input type

---

#### getByPlaceholder

Finds input by placeholder text.

```html
<input type="text" placeholder="Search products...">
<input type="email" placeholder="Enter your email">
```

**Usage:**
```javascript
await page.getByPlaceholder('Search products...').fill('iPhone')
await page.getByPlaceholder('Enter your email').fill('user@example.com')

// Partial match
await page.getByPlaceholder(/search/i).fill('MacBook')
```

**When to Use:**
- ✅ Input has placeholder but no label
- ✅ Placeholder is descriptive and stable
- ⚠️ Less ideal than label (labels are better for accessibility)

---

#### getByText

Finds element by its text content.

```html
<button>Submit Form</button>
<span>Welcome, John</span>
<div>Total: $99.99</div>
```

**Usage:**
```javascript
// Exact match
await page.getByText('Submit Form', { exact: true }).click()

// Partial match (default)
await page.getByText('Welcome').isVisible()
await page.getByText('John').isVisible()

// Regex
await page.getByText(/Total: \$\d+/).isVisible()
```

**When to Use:**
- ✅ Element has unique text
- ✅ No better semantic locator available
- ⚠️ Be careful with dynamic text

---

#### getByAltText (Images)

Finds images by alt attribute.

```html
<img src="logo.png" alt="Company Logo">
<img src="user.jpg" alt="Profile Picture">
```

**Usage:**
```javascript
await page.getByAltText('Company Logo').isVisible()
await page.getByAltText('Profile Picture').click()
```

**Why Important:**
- ✅ Tests that images have alt text (accessibility!)
- ✅ Stable locator for images

---

#### getByTitle

Finds element by title attribute.

```html
<button title="Close dialog">×</button>
<span title="Click for more info">ℹ️</span>
```

**Usage:**
```javascript
await page.getByTitle('Close dialog').click()
await page.getByTitle('Click for more info').hover()
```

---

#### getByTestId

Finds element by data-testid (or custom attribute).

```html
<button data-testid="submit-button">Submit</button>
<div data-testid="error-message">Error!</div>
```

**Usage:**
```javascript
await page.getByTestId('submit-button').click()
await expect(page.getByTestId('error-message')).toBeVisible()
```

**When to Use:**
- ✅ When you control the markup
- ✅ For stable, test-specific identifiers
- ✅ When semantic locators aren't possible
- ⚠️ Last resort (semantic locators better)

---

#### Decision Tree: Which Locator to Use?

```
Is it a button/link/input?
  └─Yes─> Use getByRole()
  
Is it a form field with label?
  └─Yes─> Use getByLabel()
  
Is it an image?
  └─Yes─> Use getByAltText()
  
Is it identified by visible text?
  └─Yes─> Use getByText()
  
Can you add data-testid?
  └─Yes─> Use getByTestId()
  
Last resort?
  └─Yes─> Use locator() with CSS/XPath
```

---

#### 🎯 Practice Exercise 11: Semantic Locators

```html
<form>
  <h2>Contact Us</h2>
  
  <label for="name">Full Name</label>
  <input id="name" type="text" data-testid="name-input">
  
  <label for="email">Email</label>
  <input id="email" type="email" placeholder="your@email.com">
  
  <label for="message">Message</label>
  <textarea id="message" placeholder="Type your message..."></textarea>
  
  <button type="submit">Send Message</button>
  <a href="/">Cancel</a>
</form>
```

**Your Mission:** Use the BEST semantic locator for each.

<details>
<summary>💡 Click to See Solutions</summary>

```javascript
// 1. Heading - getByRole
await expect(page.getByRole('heading', { name: 'Contact Us' })).toBeVisible()

// 2. Name input - getByLabel (best for labeled inputs)
await page.getByLabel('Full Name').fill('John Smith')
// Alternative: getByTestId('name-input')

// 3. Email input - getByLabel
await page.getByLabel('Email').fill('john@example.com')
// Alternative: getByPlaceholder('your@email.com')

// 4. Message textarea - getByLabel
await page.getByLabel('Message').fill('Hello!')
// Alternative: getByPlaceholder('Type your message...')

// 5. Submit button - getByRole
await page.getByRole('button', { name: 'Send Message' }).click()

// 6. Cancel link - getByRole
await page.getByRole('link', { name: 'Cancel' }).click()
```

**Key Takeaways:**
- getByLabel for form inputs (best)
- getByRole for buttons/links/headings
- getByPlaceholder when no label
- getByTestId only when needed
</details>

---

### Lesson 12: Pseudo-Classes & Filters

**📝 What You'll Learn:**
- :text(), :has-text(), :visible
- filter() method
- has, hasNot, hasText
- Chaining filters

**Why This Matters:**  
Playwright's pseudo-classes enable powerful filtering beyond standard CSS!

#### Text Pseudo-Classes

**:text("substring")** - Contains text
```javascript
page.locator('button:text("Submit")')      // Any button containing "Submit"
page.locator('div:text("Welcome")')        // Div containing "Welcome"
```

**:text-is("exact")** - Exact text match
```javascript
page.locator('button:text-is("Submit")')   // Exactly "Submit"
page.locator('span:text-is("Active")')     // Exactly "Active"
```

**:has-text("substring")** - Descendant contains text
```javascript
page.locator('article:has-text("Breaking News")')
page.locator('div.card:has-text("In Stock")')
```

**Example:**
```html
<div class="card">
  <h3>iPhone 15</h3>
  <span>In Stock</span>
  <button>Buy Now</button>
</div>
```

```javascript
// Find card containing "iPhone"
page.locator('.card:has-text("iPhone")')

// Find button with exact text
page.locator('button:text-is("Buy Now")')

// Combining
page.locator('.card:has-text("iPhone") button:text("Buy")').click()
```

---

#### Filter Method

More powerful and readable than pseudo-classes.

**filter({ hasText })**
```javascript
page.locator('.product-card')
  .filter({ hasText: 'iPhone 15' })

// Regex
page.locator('.product-card')
  .filter({ hasText: /iPhone (14|15)/ })
```

**filter({ has })**
```javascript
// Find cards that have an image
page.locator('.product-card')
  .filter({ has: page.locator('img') })

// Find rows with Edit button
page.locator('tr')
  .filter({ has: page.getByRole('button', { name: 'Edit' }) })
```

**filter({ hasNot })**
```javascript
// Find cards without "Sold Out"
page.locator('.product-card')
  .filter({ hasNot: page.locator('.sold-out-badge') })

// Products not sold out
page.locator('.product-card')
  .filter({ hasNotText: 'Sold Out' })
```

---

#### Chaining Filters

Combine multiple conditions.

```html
<div class="product-grid">
  <div class="product-card">
    <img src="iphone.jpg">
    <h3>iPhone 15</h3>
    <span class="badge">Sale</span>
    <span class="price">$999</span>
    <button>Add to Cart</button>
  </div>
  <!-- More products... -->
</div>
```

**Find product that:**
1. Has an image AND
2. Contains "iPhone" AND
3. Has "Sale" badge

```javascript
const product = page.locator('.product-card')
  .filter({ has: page.locator('img') })          // Has image
  .filter({ hasText: 'iPhone' })                  // Contains "iPhone"
  .filter({ has: page.locator('.badge:text-is("Sale")') })  // Sale badge

// Then interact with it
await product.getByRole('button', { name: 'Add to Cart' }).click()
```

**Why Chaining is Powerful:**
- Each filter narrows results
- Easy to read and understand
- Simple to debug (remove filters one by one)
- Can reuse filter chains

---

#### :visible Pseudo-Class

Find only visible elements.

```javascript
// All visible buttons
page.locator('button:visible')

// Visible modal
page.locator('.modal:visible')

// Alternative syntax
page.locator('button >> visible=true')
```

**When to Use:**
```javascript
// Count visible items
const visibleProducts = await page.locator('.product:visible').count()

// Click first visible button
await page.locator('button:visible').first().click()

// Filter to visible
page.locator('.card')
  .filter({ visible: true })  // Not standard, use :visible
```

**Important:**
- `:visible` checks computed styles (not just inline)
- Checks: display, visibility, opacity, size
- Can be slow - use sparingly

---

#### 🎯 Practice Exercise 12: Filters

```html
<div class="products">
  <div class="product-card">
    <h3>iPhone 15</h3>
    <span class="stock">In Stock</span>
    <button>Buy</button>
  </div>
  
  <div class="product-card">
    <h3>iPad Pro</h3>
    <span class="stock">Sold Out</span>
  </div>
  
  <div class="product-card" style="display:none">
    <h3>MacBook</h3>
    <span class="stock">In Stock</span>
    <button>Buy</button>
  </div>
</div>
```

**Your Mission:**
1. Find all products that are in stock
2. Find in-stock products with Buy button
3. Find visible in-stock products
4. Click Buy on first available product

<details>
<summary>💡 Click to See Solutions</summary>

```javascript
// 1. All in-stock products
page.locator('.product-card')
  .filter({ hasText: 'In Stock' })

// 2. In-stock with Buy button
page.locator('.product-card')
  .filter({ hasText: 'In Stock' })
  .filter({ has: page.getByRole('button', { name: 'Buy' }) })

// 3. Visible in-stock
page.locator('.product-card:visible')
  .filter({ hasText: 'In Stock' })

// 4. Click first available
await page.locator('.product-card:visible')
  .filter({ hasText: 'In Stock' })
  .filter({ has: page.getByRole('button') })
  .first()
  .getByRole('button', { name: 'Buy' })
  .click()
```

</details>

---

### Lesson 13: Chaining & Composition

**📝 What You'll Learn:**
- Combining different locator types
- Building complex selectors
- Reusable locator patterns
- Page Object patterns

**Why This Matters:**  
Real tests need complex locators. Learn to build them maintainably!

#### Combining Locator Types

Mix CSS, semantic, and filters.

```javascript
// CSS + semantic
page.locator('.product-grid')
  .getByRole('button', { name: 'Add to Cart' })

// CSS + filter + semantic
page.locator('.modal')
  .filter({ hasText: 'Confirm' })
  .getByRole('button', { name: 'OK' })

// XPath + CSS
page.locator('xpath=//div[@id="container"]')
  .locator('css=button.submit')
```

---

#### Scoped Searches

Limit search to container.

```html
<div class="user-card" data-user="john">
  <h3>John Smith</h3>
  <button>Edit</button>
  <button>Delete</button>
</div>

<div class="user-card" data-user="jane">
  <h3>Jane Doe</h3>
  <button>Edit</button>
  <button>Delete</button>
</div>
```

```javascript
// Find John's card, then click Edit
const johnCard = page.locator('.user-card[data-user="john"]')
await johnCard.getByRole('button', { name: 'Edit' }).click()

// Or with filter
const janeCard = page.locator('.user-card')
  .filter({ hasText: 'Jane Doe' })
await janeCard.getByRole('button', { name: 'Delete' }).click()
```

---

#### Reusable Locator Patterns

```javascript
// Define reusable locators
class ProductCard {
  constructor(page, productName) {
    this.card = page.locator('.product-card')
      .filter({ hasText: productName })
  }
  
  get heading() {
    return this.card.getByRole('heading')
  }
  
  get price() {
    return this.card.locator('.price')
  }
  
  get addButton() {
    return this.card.getByRole('button', { name: 'Add to Cart' })
  }
}

// Usage
const iphone = new ProductCard(page, 'iPhone 15')
await iphone.addButton.click()
await expect(iphone.price).toHaveText('$999')
```

---

#### Page Object Model

```javascript
class LoginPage {
  constructor(page) {
    this.page = page
    this.usernameInput = page.getByLabel('Username')
    this.passwordInput = page.getByLabel('Password')
    this.submitButton = page.getByRole('button', { name: 'Sign In' })
    this.errorMessage = page.locator('.error-message')
  }
  
  async login(username, password) {
    await this.usernameInput.fill(username)
    await this.passwordInput.fill(password)
    await this.submitButton.click()
  }
  
  async expectError(message) {
    await expect(this.errorMessage).toHaveText(message)
  }
}

// Test usage
test('login with invalid credentials', async ({ page }) => {
  const loginPage = new LoginPage(page)
  await page.goto('/login')
  await loginPage.login('invalid', 'wrong')
  await loginPage.expectError('Invalid credentials')
})
```

---

### ✅ Playwright Mastery Complete!

**🎉 Congratulations!** You've mastered:
- Semantic locators (getByRole, getByLabel, etc.)
- Pseudo-classes and filters
- Chaining and composition
- Page Object patterns

**📊 Progress:** 100% Complete!

**🏆 You are now a Locator Expert!**

---

# 🎯 SCENARIOS (Quick Lookup)

## Working with Forms

[Full content for each scenario would follow the same pattern as lessons above]

## Working with Tables

[Detailed examples...]

## Working with Modals/Dialogs

[Detailed examples...]

## Working with Navigation Menus

[Detailed examples...]

## Working with Dynamic Content

[Detailed examples...]

## Working with Shadow DOM/IFrames

[Detailed examples...]

---

# 📖 REFERENCE

## Complete XPath Reference

[Link to XPath reference document]

## Complete CSS Reference

[Link to CSS reference document]

## Complete Playwright Reference

[Link to Playwright reference document]

## Side-by-Side Comparison

[Link to comparison document]

## Performance Guide

[Link to performance document]

## Best Practices

[Link to best practices document]

---

# 🎓 Completion Certificate

**Congratulations on completing the Web Locators Guide!**

You have mastered:
- ✅ Beginner: Visible attributes, text, single/multiple attributes
- ✅ Intermediate: Relationships, states, lists, tables
- ✅ Advanced: Dynamic IDs, Shadow DOM, complex filtering
- ✅ Expert: Playwright semantic locators, filters, composition

**Next Steps:**
1. Practice on real applications
2. Build Page Object Models
3. Share knowledge with your team
4. Contribute to testing best practices

---

**Happy Testing! 🚀**
