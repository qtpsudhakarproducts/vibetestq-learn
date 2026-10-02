## Chapter 2: Basic XPath Syntax

### 2.1 Standard XPath Syntax
The standard XPath syntax follows this pattern:
```text
//tagname[@attribute='value']
//tagname[function()='value']
```

### 2.2 Absolute vs Relative XPath
**Absolute XPath (Single Slash /)**  
Absolute XPath starts from the root node and follows the complete hierarchy. It uses a single forward slash (`/`).
```text
/html/body/div/form/input
```
Disadvantages:
- Breaks easily when the page structure changes
- Long and difficult to maintain
- Not recommended for test automation

**Relative XPath (Double Slash //)**  
Relative XPath can start from anywhere in the document. It uses a double forward slash (`//`).
```text
//input[@id='username']
```
Advantages:
- More resilient to page structure changes
- Shorter and easier to write
- Recommended for test automation

### 2.3 Locating Elements by Attributes
**Using ID Attribute**
```text
//*[@id='fname']
//input[@id='fname']
```
**Using Other Attributes**
```text
//input[@name='username']
//button[@type='submit']
//input[@placeholder='Enter email']
//div[@class='container']
```

### 2.4 Using Text to Locate Elements
**Exact Text Match**
```text
//li[text()='India']
//button[text()='Submit']
```
**Using Dot (.) for Current Node**
```text
//li[.='India']
```
**Using normalize-space()**
```text
//li[normalize-space()='India']
//div[normalize-space()='Welcome User']
```

### 2.5 text() vs . (When Elements Have Nested Nodes)
When an element contains nested tags, `text()` only matches direct text nodes. The dot `.` returns the full string-value of the element (including nested text), which is often more reliable in web UIs.

**HTML**
```html
<button class="btn">
  Sign <span>In</span>
</button>
```

**XPath examples**
```text
//button[text()='Sign In']          // May fail (text split by <span>)
//button[.='Sign In']               // Works (string-value)
//button[normalize-space(.)='Sign In']
```

### 2.6 Escaping Quotes in XPath Strings
XPath 1.0 uses string literals in either single or double quotes. If your text contains both, use `concat()`.

**Examples**
```text
//div[@title="Bob's Account"]                 // Use double quotes outside
//div[@title='He said "Hello"']               // Use single quotes outside
//div[@title=concat("Bob", "'", "s Account")] // Mixed quotes
```

### HTML + UI Example for XPath (Attribute + Text)
**HTML**
```html
<div class="login">
  <label for="username">Username</label>
  <input id="username" type="text" placeholder="Email or username">
  <button type="submit">Login</button>
</div>
```

**UI (simplified)**
```text
+-----------------------+
| Username [__________] |
| [ Login ]             |
+-----------------------+
```

**XPath examples for the UI**
- `//input[@id='username']` selects the Username input
- `//button[text()='Login']` selects the Login button

---
