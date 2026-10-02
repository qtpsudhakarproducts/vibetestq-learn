## Chapter 5: CSS Pseudo-classes and Pseudo-elements

### 5.1 UI State Pseudo-classes

**:hover**
```css
button:hover                /* Button when mouse hovers over it */
```
Note: Not commonly used in automation tests, but can be useful for detecting hover states.

**:focus**
```css
input:focus                 /* Currently focused input */
button:focus                /* Currently focused button */
```

**:active**
```css
button:active               /* Button while being clicked */
```

### 5.2 Link Pseudo-classes

**:link and :visited**
```css
a:link                      /* Unvisited links */
a:visited                   /* Visited links */
```

### 5.3 Pseudo-elements (::)

**Note**: Pseudo-elements use double colons `::` but most browsers also support single colon `:` for backward compatibility.

**::before and ::after**
```css
div::before                 /* Generated content before element */
div::after                  /* Generated content after element */
```
Note: Pseudo-elements cannot be directly selected in most automation tools as they are not real DOM elements.

**::first-letter**
```css
p::first-letter             /* First letter of paragraph */
```

**::first-line**
```css
p::first-line               /* First line of paragraph */
```

**::placeholder**
```css
input::placeholder          /* Input placeholder text */
```

**::selection**
```css
::selection                 /* Text selected by user */
```

### 5.4 Functional Pseudo-classes

**:is()** (formerly :matches() and :any())
```css
:is(h1, h2, h3)             /* Any h1, h2, or h3 */
:is(.btn, .button)          /* Element with "btn" or "button" class */
```

**:where()**
```css
:where(article, section) p  /* Paragraphs in article or section */
```
Note: `:where()` has zero specificity, unlike `:is()`.

**:has()** (CSS4 - Limited support)
```css
div:has(> img)              /* Div that contains an img as direct child */
form:has(input[required])   /* Form that contains required input */
```
Note: Browser support for `:has()` is still evolving. Check compatibility before use.

---
