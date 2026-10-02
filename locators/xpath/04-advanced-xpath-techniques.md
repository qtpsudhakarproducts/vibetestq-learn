## Chapter 4: Advanced XPath Techniques

### 4.1 XPath Axes in Depth
**Ancestor Axis**
```text
//input[@id='username']/ancestor::form
//input[@id='username']/ancestor::*
//input[@id='username']/ancestor::div[@id='section']
```
**Following Axis**
```text
//h4/following::div
//label[@for='username']/following::input[1]
```
**Preceding Axis**
```text
//button[@id='submit']/preceding::input
//div[@class='footer']/preceding::*
```

### 4.2 Position and Index
**Using position()**
```text
(//input[@type='text'])[position()=2]
(//div[@class='item'])[position()>2]
```
**Using Index Directly**
Important Note: Without parentheses, `//input[1]` selects the first input of EACH parent.
```text
//input[1]  // First input of each parent
```
With grouping parentheses, select the first element globally:
```text
(//input)[1]  // First input in entire page
(//button[@type='submit'])[2]  // Second submit button
```
**Using last()**
```text
(//div[@class='item'])[last()]
//table//tr[last()]
(//input[@type='text'])[last()-1]  // Second to last
```

### 4.3 Complex Navigation Patterns
**Combining Axes and Functions**
```text
//div[@class='srvceNO' and normalize-space()='1067']/../..//input
```
**Navigate up to specific ancestor, then down**
```text
//div[@class='srvceNO' and normalize-space()='1067']/ancestor::div[@class='row']//input
```
**Use following with position**
```text
//div[@class='srvceNO' and normalize-space()='1067']/following::input[@value='Select Seats'][1]
```
**Finding Elements with Specific Children**
```text
//div[@class='row' and descendant::div[@class='srvceNO' and normalize-space()='1067']]//input
```
**Using dot (.) for current node context**
```text
//div[@class='row' and .//div[@class='srvceNO' and normalize-space()='1067']]//input
```
**Using preceding/following with Conditions**
```text
(//input[@value='Select Seats' and preceding::div[normalize-space()='1067']])[1]
```

### 4.4 NOT Operator
The not() function excludes elements matching the condition:
```text
//input[@type='text' and not(@disabled)]
//div[not(@class='hidden')]
```

### 4.5 Finding Only Visible Elements
A critical challenge in test automation is handling duplicate elements where only one is visible. Use the not() function with ancestor-or-self to exclude hidden elements:
```text
//*[@id='fname' and not(ancestor-or-self::*[contains(@style,'display: none;')])]
//div[@class='srvceNO' and not(ancestor-or-self::*[contains(@style,'display: none;')])]
```
This technique checks if the element or any of its ancestors has `display:none` in the `style` attribute.

### 4.6 Visibility Caveats (Hidden, aria-hidden, CSS Classes)
`display: none` is only one way an element can be hidden. Consider other patterns commonly used in UI frameworks:
```text
//div[not(@hidden)]
//div[not(@aria-hidden='true')]
//div[not(contains(@class,'hidden'))]
//div[not(contains(@class,'sr-only'))]   // screen-reader-only utilities
```
Use these sparingly and prefer stable locators; visibility logic often belongs in your test framework’s visibility checks.

### 4.7 Shadow DOM Limitation
XPath does not pierce shadow roots. For Shadow DOM elements, use your framework’s shadow DOM APIs (e.g., Playwright `page.locator("css=...")` with `>>` or Selenium’s `getShadowRoot()`), then apply XPath within that shadow root if supported.

---
