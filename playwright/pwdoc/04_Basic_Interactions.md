# Chapter 04: Basic Interactions - Inputs & Clicks

## The Concept of Actionability

In real life, a user cannot click a button that is hidden behind a popup or type into a field that is disabled. Playwright mimics this perfectly through **Actionability**. Unlike older tools that might click a "hidden" element (causing a false pass), Playwright verifies the state of the element before acting.

**Purpose**: This chapter covers the fundamental actions—clicks, typing, checking boxes—and explains the automated checks Playwright performs to ensure reliability.

**Why is it required?**
1. **Flake Prevention**: To understand how auto-waiting for "visibility" and "stability" prevents tests from failing due to slow-loading UIs.
2. **Human-Centric Testing**: To ensure your tests interact with the application the same way a real user would, catching bugs related to blocked or disabled elements.
3. **Foundation**: To master the basic building blocks that will be used in every single automation script you write.

## Understanding Actionability

### What is Actionability?

Before Playwright performs any action, it automatically performs a series of **actionability checks** to ensure the action will succeed just like a real user interaction would.

### The Actionability Checks

Playwright performs these checks automatically:

| Check | Description | Example Scenario |
|-------|-------------|------------------|
| **Attached** | Element is in the DOM | Element wasn't removed |
| **Visible** | Element is visible | Not `display: none` or `visibility: hidden` |
| **Stable** | Element is not animating | Animation has completed |
| **Receives Events** | Element is not covered | No overlay blocking it |
| **Enabled** | Element is not disabled | Button is clickable |
| **Editable** | Element is not readonly | Input accepts text |

### Auto-Waiting Example

```typescript
// ❌ Selenium - Manual waiting needed
await driver.wait(until.elementLocated(By.id('button')), 5000);
await driver.findElement(By.id('button')).click();

// ✅ Playwright - Automatic waiting
await page.click('#button');
// Automatically waits for attachment, visibility, stability, enablement
```

---

## Clicking Elements

### Basic Click

```typescript
// Simple click
await page.click('#submit-button');

// Using locator
await page.locator('#submit-button').click();

// Using getByRole
await page.getByRole('button', { name: 'Submit' }).click();
```

### Click Variations

**1. Double Click**
```typescript
// Double-click to select word
await page.dblclick('text=Hello');
```

**2. Right Click (Context Menu)**
```typescript
await page.click('#file', { button: 'right' });
```

**3. Click Modifiers**
```typescript
// Ctrl+Click (Cmd+Click)
await page.click('a', { modifiers: ['Control'] });

// Shift+Click
await page.click('input', { modifiers: ['Shift'] });
```

**4. Force Click**
```typescript
// Skip checks (Use rarely!)
await page.click('button', { force: true });
```

---

## Text Input and Typing

### Fill Method (Recommended)

Use `fill()` for standard form inputs. It waits for actionability, clears the field, and enters text instantly.

```typescript
// Basic fill
await page.fill('#email', 'user@example.com');

// Using locator
await page.locator('#email').fill('user@example.com');

// Using getByLabel
await page.getByLabel('Email').fill('user@example.com');
```

### Type Method (Seqential)

Use `pressSequentially()` (formerly `type()`) when you need to simulate character-by-character typing (e.g., testing autocomplete).

```typescript
// Type character by character with delay
await page.locator('#search').pressSequentially('playwright', { delay: 100 });
```

### Clearing Inputs

```typescript
await page.fill('#email', '');
// OR
await page.locator('#email').clear();
```

---

## Checkboxes and Radio Buttons

### Checkbox Operations

```typescript
// Check
await page.check('#agree-terms');

// Uncheck
await page.uncheck('#agree-terms');

// Toggle based on boolean
await page.setChecked('#agree-terms', true);

// Verify State
const isChecked = await page.isChecked('#agree-terms');
```

### Radio Buttons

```typescript
// Select radio option
await page.check('#option-1');

// Using sematic locators
await page.getByRole('radio', { name: 'Option 1' }).check();
```

---

## Select Dropdowns

### Select by Value, Label, or Index

```typescript
// Select by 'value' attribute
await page.selectOption('select#country', 'us');

// Select by visible text (Label)
await page.selectOption('select#country', { label: 'United States' });

// Select by index
await page.selectOption('select#country', { index: 0 });
```

### Multi-Select

```typescript
await page.selectOption('select#skills', ['js', 'python', 'ruby']);
```

---

## Best Practices

### DO's and DON'Ts

```typescript
// ✅ DO: Use semantic locators with actions
await page.getByRole('button', { name: 'Submit' }).click();

// ✅ DO: Use fill() for most inputs
await page.fill('#email', 'test@test.com');

// ❌ DON'T: Use type() unless testing keystrokes
await page.type('#email', 'test@test.com'); // Slower, unnecessary

// ✅ DO: Let Playwright auto-wait
await page.click('#dynamic-button');

// ❌ DON'T: Add manual sleeps
await page.waitForTimeout(1000);
```

**Summary**: You have mastered the basic interactions: Clicking, Filling, Checking, and Selecting. These cover 90% of web automation needs. Next, we will cover advanced inputs like Drag & Drop and Keyboard shortcuts.
