## Chapter 4: Advanced CSS Selector Techniques

### 4.1 Structural Pseudo-classes

**:first-child**
```css
li:first-child              /* First li among siblings */
div > p:first-child         /* First p that is direct child of div */
.item:first-child           /* First element with class "item" among siblings */
```

**:last-child**
```css
li:last-child               /* Last li among siblings */
tr:last-child               /* Last table row */
```

**:nth-child(n)**
```css
li:nth-child(2)             /* Second li among siblings */
tr:nth-child(3)             /* Third table row */
div:nth-child(odd)          /* Odd positioned divs */
div:nth-child(even)         /* Even positioned divs */
li:nth-child(3n)            /* Every 3rd li (3, 6, 9...) */
li:nth-child(3n+1)          /* Every 3rd li starting from 1st (1, 4, 7...) */
```

**:nth-last-child(n)**
```css
li:nth-last-child(2)        /* Second to last li */
tr:nth-last-child(1)        /* Same as :last-child */
```

**:first-of-type**
```css
p:first-of-type             /* First p element among siblings */
input:first-of-type         /* First input among siblings */
```

**:last-of-type**
```css
p:last-of-type              /* Last p element among siblings */
button:last-of-type         /* Last button among siblings */
```

**:nth-of-type(n)**
```css
div:nth-of-type(2)          /* Second div among sibling divs */
input:nth-of-type(3)        /* Third input among sibling inputs */
```

**:nth-last-of-type(n)**
```css
p:nth-last-of-type(2)       /* Second to last p among siblings */
```

**:only-child**
```css
li:only-child               /* Li that is the only child of its parent */
span:only-child             /* Span that is the only child */
```

**:only-of-type**
```css
p:only-of-type              /* Only p element among siblings */
button:only-of-type         /* Only button among siblings */
```

### 4.2 State Pseudo-classes

**:enabled and :disabled**
```css
input:enabled               /* All enabled inputs */
button:disabled             /* All disabled buttons */
input[type="text"]:disabled /* Disabled text inputs */
```

**:checked**
```css
input:checked               /* Checked checkboxes and radio buttons */
input[type="checkbox"]:checked  /* Only checked checkboxes */
```

**:required and :optional**
```css
input:required              /* All required inputs */
input:optional              /* All optional inputs */
```

**:read-only and :read-write**
```css
input:read-only             /* Read-only inputs */
input:read-write            /* Editable inputs */
```

**:valid and :invalid**
```css
input:valid                 /* Inputs with valid values */
input:invalid               /* Inputs with invalid values */
```

**:in-range and :out-of-range**
```css
input:in-range              /* Number inputs within min/max range */
input:out-of-range          /* Number inputs outside min/max range */
```

### 4.3 Negation Pseudo-class

**:not()**
```css
input:not([type="hidden"])  /* All inputs except hidden */
div:not(.inactive)          /* Divs without "inactive" class */
li:not(:first-child)        /* All lis except the first */
button:not(:disabled)       /* All enabled buttons */
input:not([readonly])       /* All inputs that are not readonly */
```

**Complex :not() patterns**
```css
input:not([type="submit"]):not([type="button"])
/* Inputs that are neither submit nor button type */

div:not(.hidden):not([style*="display: none"])
/* Divs that are not hidden by class or inline style */
```

### 4.4 Content Pseudo-classes

**:empty**
```css
div:empty                   /* Divs with no children or text */
td:empty                    /* Empty table cells */
```

**:target**
```css
div:target                  /* Element targeted by URL fragment */
```

### 4.5 Multiple Attribute Conditions

**Combining Attributes**
```css
input[type="text"][required]
/* Text input that is required */

button[type="submit"][disabled]
/* Disabled submit button */

a[href^="https"][target="_blank"]
/* External links that open in new tab */

input[type="text"][name^="user"][required]
/* Required text input with name starting with "user" */
```

### 4.6 Case-Insensitive Attribute Matching

**Using `i` flag (CSS4)**
```css
[type="TEXT" i]             /* Matches type="text", type="TEXT", type="Text" */
[class*="BTN" i]            /* Case-insensitive class contains "btn" */
```
Note: Browser support varies for this feature.

---
