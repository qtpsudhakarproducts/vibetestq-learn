## Chapter 9: Complete CSS Selector Reference

### 9.1 Basic Selectors Reference

| Selector | Description | Example |
| --- | --- | --- |
| `*` | Universal selector | `*` (all elements) |
| `element` | Type selector | `div`, `input`, `button` |
| `.class` | Class selector | `.btn`, `.error` |
| `#id` | ID selector | `#username`, `#submit` |
| `[attribute]` | Attribute exists | `[required]`, `[disabled]` |
| `[attr="value"]` | Exact attribute match | `[type="text"]` |
| `[attr^="value"]` | Starts with | `[id^="user"]` |
| `[attr$="value"]` | Ends with | `[src$=".jpg"]` |
| `[attr*="value"]` | Contains | `[class*="btn"]` |
| `[attr~="value"]` | Contains word | `[class~="active"]` |
| `[attr|="value"]` | Dash-prefix match | `[lang|="en"]` |

### 9.2 Combinators Reference

| Combinator | Description | Example |
| --- | --- | --- |
| `A B` | Descendant | `div input` |
| `A > B` | Direct child | `div > input` |
| `A + B` | Adjacent sibling | `label + input` |
| `A ~ B` | General sibling | `label ~ input` |
| `A, B` | Grouping | `input, button` |

### 9.3 Pseudo-classes Reference

| Pseudo-class | Description | Example |
| --- | --- | --- |
| `:first-child` | First child | `li:first-child` |
| `:last-child` | Last child | `li:last-child` |
| `:nth-child(n)` | Nth child | `li:nth-child(2)` |
| `:nth-last-child(n)` | Nth from last | `li:nth-last-child(2)` |
| `:first-of-type` | First of type | `p:first-of-type` |
| `:last-of-type` | Last of type | `p:last-of-type` |
| `:nth-of-type(n)` | Nth of type | `div:nth-of-type(2)` |
| `:nth-last-of-type(n)` | Nth from last of type | `div:nth-last-of-type(2)` |
| `:only-child` | Only child | `span:only-child` |
| `:only-of-type` | Only of type | `p:only-of-type` |
| `:empty` | No children | `div:empty` |
| `:not(selector)` | Negation | `input:not([type="hidden"])` |
| `:enabled` | Enabled input | `input:enabled` |
| `:disabled` | Disabled input | `input:disabled` |
| `:checked` | Checked input | `input:checked` |
| `:required` | Required input | `input:required` |
| `:optional` | Optional input | `input:optional` |
| `:valid` | Valid input | `input:valid` |
| `:invalid` | Invalid input | `input:invalid` |
| `:in-range` | In range | `input:in-range` |
| `:out-of-range` | Out of range | `input:out-of-range` |
| `:read-only` | Read-only | `input:read-only` |
| `:read-write` | Read-write | `input:read-write` |
| `:focus` | Focused element | `input:focus` |
| `:hover` | Hover state | `button:hover` |
| `:active` | Active state | `button:active` |
| `:target` | URL target | `div:target` |

### 9.4 Pseudo-elements Reference

| Pseudo-element | Description | Example |
| --- | --- | --- |
| `::before` | Before content | `div::before` |
| `::after` | After content | `div::after` |
| `::first-letter` | First letter | `p::first-letter` |
| `::first-line` | First line | `p::first-line` |
| `::placeholder` | Placeholder text | `input::placeholder` |
| `::selection` | Selected text | `::selection` |

### 9.5 nth-child() Formula Reference

| Formula | Matches | Description |
| --- | --- | --- |
| `:nth-child(2)` | 2nd element | Specific position |
| `:nth-child(odd)` | 1, 3, 5, 7... | Odd elements |
| `:nth-child(even)` | 2, 4, 6, 8... | Even elements |
| `:nth-child(3n)` | 3, 6, 9, 12... | Every 3rd element |
| `:nth-child(3n+1)` | 1, 4, 7, 10... | Every 3rd starting from 1st |
| `:nth-child(n+3)` | 3, 4, 5, 6... | 3rd element onwards |
| `:nth-child(-n+3)` | 1, 2, 3 | First 3 elements |

### 9.6 Common Pattern Quick Reference

| Pattern | CSS Selector | Description |
| --- | --- | --- |
| By ID | `#elementId` | Most specific |
| By Class | `.className` | Common selector |
| By Attribute | `[name="username"]` | Any attribute |
| By Type | `input[type="email"]` | Input type |
| Multiple Classes | `.btn.primary` | Both classes |
| Contains Class | `[class*="btn"]` | Partial class match |
| Starts With | `[id^="user"]` | Attribute starts with |
| Ends With | `[src$=".png"]` | Attribute ends with |
| First Element | `:first-child` | First child |
| Last Element | `:last-child` | Last child |
| Nth Element | `:nth-child(3)` | Specific position |
| Not Selector | `:not(.hidden)` | Exclude elements |
| Enabled | `:enabled` | Enabled inputs |
| Disabled | `:disabled` | Disabled inputs |
| Checked | `:checked` | Checked checkboxes |
| Required | `:required` | Required inputs |
| Valid | `:valid` | Valid inputs |
| Invalid | `:invalid` | Invalid inputs |
| Direct Child | `parent > child` | Immediate child |
| Descendant | `ancestor descendant` | Any descendant |
| Next Sibling | `element + next` | Adjacent sibling |
| All Siblings | `element ~ siblings` | General siblings |

### 9.7 Specificity Reference

CSS specificity determines which styles are applied when multiple rules target the same element. Higher specificity wins.

**Specificity Hierarchy**
1. Inline styles: `style="..."` (1,0,0,0)
2. IDs: `#id` (0,1,0,0)
3. Classes, attributes, pseudo-classes: `.class`, `[attr]`, `:hover` (0,0,1,0)
4. Elements, pseudo-elements: `div`, `::before` (0,0,0,1)

**Examples**
```css
div                          /* 0,0,0,1 */
.className                   /* 0,0,1,0 */
#id                          /* 0,1,0,0 */
div.className                /* 0,0,1,1 */
#id.className                /* 0,1,1,0 */
div > .className:hover       /* 0,0,2,1 */
#id div.className            /* 0,1,1,1 */
```

---
