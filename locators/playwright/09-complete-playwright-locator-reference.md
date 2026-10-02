## Chapter 9: Complete Playwright Locator Reference

### All Locator Methods

**Built-in Locators:**

| Method | Description | Example |
|--------|-------------|---------|
| `getByRole()` | Locate by ARIA role | `page.getByRole('button', { name: 'Submit' })` |
| `getByLabel()` | Locate by label text | `page.getByLabel('Email')` |
| `getByPlaceholder()` | Locate by placeholder | `page.getByPlaceholder('Search...')` |
| `getByText()` | Locate by text content | `page.getByText('Welcome')` |
| `getByAltText()` | Locate by alt attribute | `page.getByAltText('Logo')` |
| `getByTitle()` | Locate by title attribute | `page.getByTitle('Close')` |
| `getByTestId()` | Locate by test ID | `page.getByTestId('submit-btn')` |
| `locator()` | CSS or XPath selector | `page.locator('.button')` |

**Locator Operators:**

| Method | Description | Example |
|--------|-------------|---------|
| `first()` | First matching element | `page.getByRole('button').first()` |
| `last()` | Last matching element | `page.getByRole('button').last()` |
| `nth(index)` | Element at index | `page.getByRole('button').nth(2)` |
| `filter()` | Filter by condition | `page.getByRole('button').filter({ hasText: 'Submit' })` |
| `and()` | Combine locators (AND) | `page.locator('button').and(page.locator('.primary'))` |
| `or()` | Combine locators (OR) | `page.getByRole('button').or(page.getByRole('link'))` |

**Locator Actions:**

| Method | Description |
|--------|-------------|
| `click()` | Click element |
| `dblclick()` | Double click |
| `fill()` | Fill input |
| `type()` | Type text |
| `press()` | Press key |
| `check()` | Check checkbox |
| `uncheck()` | Uncheck checkbox |
| `selectOption()` | Select dropdown option |
| `setInputFiles()` | Upload files |
| `hover()` | Hover over element |
| `focus()` | Focus element |
| `blur()` | Remove focus |
| `clear()` | Clear input |
| `dragTo()` | Drag and drop |

**Locator Queries:**

| Method | Returns |
|--------|---------|
| `textContent()` | Text content |
| `innerText()` | Visible text |
| `innerHTML()` | HTML content |
| `getAttribute()` | Attribute value |
| `inputValue()` | Input value |
| `isVisible()` | Boolean |
| `isHidden()` | Boolean |
| `isEnabled()` | Boolean |
| `isDisabled()` | Boolean |
| `isChecked()` | Boolean |
| `isEditable()` | Boolean |
| `count()` | Number of elements |
| `all()` | Array of locators |
| `boundingBox()` | Position and size |

**Locator Assertions:**

| Assertion | Description |
|-----------|-------------|
| `toBeVisible()` | Element is visible |
| `toBeHidden()` | Element is hidden |
| `toBeEnabled()` | Element is enabled |
| `toBeDisabled()` | Element is disabled |
| `toBeChecked()` | Checkbox is checked |
| `toBeEditable()` | Element is editable |
| `toBeFocused()` | Element has focus |
| `toHaveText()` | Has exact text |
| `toContainText()` | Contains text |
| `toHaveValue()` | Has input value |
| `toHaveAttribute()` | Has attribute |
| `toHaveClass()` | Has CSS class |
| `toHaveCount()` | Has element count |
| `toHaveCSS()` | Has CSS property |
| `toHaveId()` | Has ID |

---