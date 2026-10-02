# Chapter 05: Advanced Interactions - Mouse & Keyboard

## The Concept of Advanced Interactions

While basic clicks and text inputs cover 90% of automation scenarios, modern web applications often require more complex user behaviors. Actions like hovering to reveal menus, dragging elements across the screen, or performing complex keyboard shortcuts are essential for testing rich, interactive UIs.

**Purpose**: Advanced interactions allow you to simulate high-fidelity user movements and shortcuts that go beyond simple form fills.

**Why are they required?**
1. **Rich UI Testing**: To test drag-and-drop file uploads, Kanban boards, or drawing canvases.
2. **Accessibility**: To verify that the application responds correctly to keyboard-only navigation.
3. **Menu Discovery**: To interact with tooltips, dropdown menus, and hover-triggered components.

## Keyboard Interactions

Playwright gives you full control over the virtual keyboard.

### Press Single Key

```typescript
// Press Enter
await page.press('#search', 'Enter');

// Press Tab
await page.press('#username', 'Tab');

// Press Arrow keys
await page.press('body', 'ArrowDown');
```

### Keyboard Shortcuts

```typescript
// Ctrl+A (Select All)
await page.press('#editor', 'Control+A');

// Ctrl+C (Copy)
await page.press('#editor', 'Control+C');

// Mac shortcuts (use Meta)
await page.press('#editor', 'Meta+A');
```

### Global Keyboard Shortcuts
To trigger shortcuts that don't depend on a focused element:
```typescript
await page.keyboard.press('Control+S');
```

---

## Mouse Interactions

### Hover
Crucial for checking tooltips or revealing menus.

```typescript
// Hover over element
await page.hover('#menu-item');
```

### Mouse Move & Click
For lower-level control (drawing on canvas, etc.):

```typescript
// Move mouse to coordinates
await page.mouse.move(100, 200);

// Mouse down (press and hold)
await page.mouse.down();

// Mouse up (release)
await page.mouse.up();
```

---

## Drag and Drop

### The Helper Method (Recommended)
This method is the most reliable way to perform drag and drop operations.

```typescript
await page.dragAndDrop('#source', '#target');

// With options
await page.dragAndDrop('#source', '#target', {
  sourcePosition: { x: 10, y: 10 },
  targetPosition: { x: 20, y: 20 }
});
```

### Manual Dragging
If the helper doesn't work (some complex UI libraries):

```typescript
await page.hover('#source');
await page.mouse.down();
await page.hover('#target');
await page.mouse.up();
```

---

## Focus and Blur

### Managing Focus

```typescript
// Focus on input
await page.focus('#username');
await expect(page.locator('#username')).toBeFocused();

// Remove focus (Blur)
await page.locator('#username').blur();
```

### Tab Navigation Simulation

```typescript
await page.focus('#first-input');
await page.keyboard.press('Tab');
// Focus shoud now be on #second-input
await expect(page.locator('#second-input')).toBeFocused();
```

---

## Force Actions

### When to use Force?
Sometimes an element is technically "hidden" or "covered" but you still want to interact with it.

**Examples:**
*   A custom checkbox that is visually hidden but receives events.
*   An overlay that Playwright detects as "blocking" but you know is actually transparent to clicks.

```typescript
// Force click (bypasses visibility/actionability checks)
await page.click('button', { force: true });

// Force fill
await page.fill('#input', 'value', { force: true });
```

**Warning:** Using `force: true` defeats the purpose of "testing like a user". Use it only as a last resort.

**Summary**: You can now handle complex user inputs involving the keyboard, mouse, and drag operations. Next, we will cover how to handle File Uploads and Downloads.
