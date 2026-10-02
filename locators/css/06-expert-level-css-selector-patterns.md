## Chapter 6: Expert-Level CSS Selector Patterns

### 6.1 Complex Table Selection

**Select Cell by Position**
```css
table tr:nth-child(3) td:nth-child(2)
/* Cell in 3rd row, 2nd column */

table tbody tr:first-child td:last-child
/* Last cell in first body row */
```

**Select Row by Content (Limited)**
CSS cannot directly select by text content, but you can use data attributes:
```css
tr[data-row-id="12345"]     /* Row with specific data attribute */
```

**Select Cells in Column**
```css
table td:nth-child(2)       /* All cells in 2nd column */
table td:nth-last-child(1)  /* All cells in last column */
```

### 6.2 Form Element Patterns

**Select All Form Controls**
```css
input, select, textarea, button
/* All form elements */
```

**Select Form by Type**
```css
form input[type="text"]     /* All text inputs in form */
form input:not([type="hidden"])  /* All visible form inputs */
```

**Select Inputs by State**
```css
input:valid                 /* Valid inputs */
input:invalid               /* Invalid inputs */
input:required:invalid      /* Required inputs that are invalid */
```

### 6.3 Dynamic Element Selection

**Elements with Dynamic Classes**
```css
[class*="dynamic"]          /* Class contains "dynamic" */
[id^="generated_"]          /* ID starts with "generated_" */
```

**Combine with Structure**
```css
div[class*="container"] > div[class^="item-"]
/* Divs with class starting with "item-" inside container */
```

### 6.4 Complex Navigation Patterns

**Navigate Through Multiple Levels**
```css
.page > .content .section:nth-child(2) article:first-of-type h2
/* Specific heading in nested structure */
```

**Combine Siblings and Children**
```css
.header + .content > .row:first-child .col-md-6:last-child
/* Last column in first row of content section following header */
```

### 6.5 Accessibility-Focused Selectors

**ARIA Attributes**
```css
[role="button"]             /* Elements with button role */
[aria-label="Search"]       /* Elements with specific aria-label */
[aria-hidden="false"]       /* Visible elements (aria-hidden) */
[aria-expanded="true"]      /* Expanded elements */
[aria-selected="true"]      /* Selected elements */
```

**Combine ARIA with Structure**
```css
nav [role="menuitem"][aria-current="page"]
/* Current page menu item */

button[aria-label*="Close"]:not(:disabled)
/* Enabled close buttons */
```

### 6.6 Shadow DOM Considerations

CSS selectors cannot penetrate Shadow DOM boundaries. To select elements inside Shadow DOM, you need to:
1. First select the shadow host
2. Use framework-specific APIs to access shadow root
3. Then query within the shadow root

**Example (Conceptual)**
```javascript
// This won't work with regular CSS selectors
const element = document.querySelector('my-component .inner-element');

// Need to access shadow root first
const shadowHost = document.querySelector('my-component');
const shadowRoot = shadowHost.shadowRoot;
const element = shadowRoot.querySelector('.inner-element');
```

### 6.7 Performance-Optimized Selectors

**Fast Selectors (Right-to-Left Matching)**
```css
#uniqueId                   /* Fastest - ID lookup */
.className                  /* Fast - class lookup */
tagName                     /* Fast - tag lookup */
```

**Slower Selectors**
```css
* .className                /* Slower - checks all elements */
div > * > * > span          /* Slower - deep nesting */
[class*="partial"]          /* Slower - partial attribute match */
```

**Optimization Strategy**
```css
/* Avoid */
div div div span

/* Better */
.specific-class span

/* Best */
#uniqueId span
```

---
