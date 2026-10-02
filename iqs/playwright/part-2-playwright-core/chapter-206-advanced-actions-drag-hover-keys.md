# Chapter 206 — Advanced Actions — Drag, Hover & Keys


This chapter covers interactions that go beyond clicking and filling — hover,
keyboard shortcuts, drag and drop, mouse control, and scrolling. Interviewers
test this topic at mid-level and above, where complex UIs with custom components
require more than basic actions.

---

## Q206.1 — What advanced interaction methods does Playwright provide?

Beyond basic click and fill, Playwright provides:

| Method | Action |
|---|---|
| `locator.hover()` | Move mouse over element without clicking |
| `locator.press(key)` | Press a key while element is focused |
| `locator.dragTo(target)` | Drag element to target |
| `page.keyboard.press(key)` | Press a key globally |
| `page.keyboard.type(text)` | Type text globally character by character |
| `page.keyboard.down(key)` | Hold a key down |
| `page.keyboard.up(key)` | Release a held key |
| `page.mouse.move(x, y)` | Move mouse to coordinates |
| `page.mouse.down()` | Press mouse button |
| `page.mouse.up()` | Release mouse button |
| `page.mouse.click(x, y)` | Click at coordinates |
| `page.mouse.wheel(x, y)` | Scroll with mouse wheel |
| `locator.scrollIntoViewIfNeeded()` | Scroll element into viewport |

---

## Q206.2 — What is the difference between hover and click?

`hover()` moves the mouse cursor over the element's centre point and dispatches
`mouseover`, `mouseenter`, and `mousemove` events. It does NOT click. It does
NOT dispatch `mousedown`, `mouseup`, or `click` events.

`click()` moves the mouse to the element, dispatches `mousedown`, `mouseup`,
`click`, and related events.

```typescript
// Reveal a dropdown menu by hovering
await page.getByRole('navigation').getByText('Products').hover();
// Menu appears — now click an item inside it
await page.getByRole('link', { name: 'Electronics' }).click();

// versus
// Regular click on a button — triggers the click event
await page.getByRole('button', { name: 'Submit' }).click();
```

Use `hover()` when the UI requires a hover state to reveal content (dropdown
menus, tooltips, hover cards). Use `click()` for all other interactions.

---

## Q206.3 — When do you need keyboard interactions in test automation?

Keyboard interactions are needed in three situations:

**Keyboard accessibility testing** — verify that users who navigate by keyboard
(Tab, Enter, Arrow keys, Escape) can complete all critical flows.

**Rich text editors** — editors like Quill, Draft.js, and TipTap often require
keyboard shortcuts (Ctrl+B for bold, Ctrl+Z for undo) that are not exposed
through standard click/fill actions.

**Custom component interactions** — date pickers, autocomplete lists, tree views,
and drag-and-drop interfaces often require arrow key navigation after the
component is opened.

---

## Q206.4 — How do you handle drag and drop in your project?

In our project, drag and drop is used in a Kanban board feature. We tested
three approaches and settled on `dragTo()`:

```typescript
// Method 1 — dragTo() (recommended for most cases)
await page.getByTestId('card-ORD-001').dragTo(
  page.getByTestId('column-done')
);

// Method 2 — dragTo with position options (when default centre point fails)
await source.dragTo(target, {
  sourcePosition: { x: 15, y: 15 },
  targetPosition: { x: 50, y: 50 },
});

// Method 3 — Manual mouse control (for libraries that don't respond to dragTo)
await source.hover();
await page.mouse.down();
await target.hover();
await page.mouse.up();
```

`dragTo()` works for standard HTML5 drag and drop. For custom JavaScript
drag libraries (React DnD, Sortable.js), the manual mouse method or
`dispatchEvent` with a `DataTransfer` object is sometimes needed.

---

## Q206.5 — What is the keyboard API and what are the most useful keyboard actions?

The `page.keyboard` API dispatches keyboard events globally — without needing
a specific focused element.

```typescript
// Press a single key
await page.keyboard.press('Enter');
await page.keyboard.press('Escape');
await page.keyboard.press('Tab');
await page.keyboard.press('ArrowDown');

// Key combination (modifier + key)
await page.keyboard.press('Control+a');  // select all
await page.keyboard.press('Control+c');  // copy
await page.keyboard.press('Control+v');  // paste
await page.keyboard.press('Control+z');  // undo
await page.keyboard.press('Meta+s');     // save (Mac)

// Hold key for a sequence of presses
await page.keyboard.down('Shift');
await page.keyboard.press('Tab');        // shift+tab (go backward)
await page.keyboard.press('Tab');
await page.keyboard.up('Shift');

// Type text globally
await page.keyboard.type('Hello World', { delay: 50 });
```

On macOS, use `Meta` for Cmd. On Windows/Linux, use `Control`.

---

## Q206.6 — What is the mouse API and how do you perform custom mouse movements?

`page.mouse` provides low-level mouse control for scenarios that need
precise coordinate-based interaction.

```typescript
// Move mouse to specific coordinates
await page.mouse.move(300, 400);

// Click at coordinates
await page.mouse.click(300, 400);
await page.mouse.click(300, 400, { button: 'right' }); // right click

// Manual drag
await page.mouse.move(100, 100);    // starting position
await page.mouse.down();            // press mouse button
await page.mouse.move(300, 300, { steps: 10 }); // move in steps (smoother drag)
await page.mouse.up();              // release

// Scroll at position
await page.mouse.wheel(0, 500); // scroll down 500px
```

The `steps` option in `mouse.move()` makes the move happen in discrete
increments — useful for drag-and-drop libraries that track mouse movement
events and need intermediate positions.

Use `page.mouse` for: canvas interactions, custom drawing components,
games, or any component that responds to specific coordinate-based events.

---

## Q206.7 — What is the difference between page.keyboard.press and page.keyboard.type?

`page.keyboard.press(key)` presses a single key or key combination. It
dispatches `keydown`, `keypress` (for printable keys), and `keyup` events.

`page.keyboard.type(text, options?)` types a string character by character.
Each character dispatches its own keydown/keypress/keyup cycle.

```typescript
// press — single key or combination
await page.keyboard.press('Enter');
await page.keyboard.press('Control+a');
await page.keyboard.press('Escape');

// type — multiple characters, character by character
await page.keyboard.type('Hello World');
await page.keyboard.type('Alice Johnson', { delay: 50 }); // 50ms between keys
```

Use `press` for control keys and shortcuts. Use `type` when you need
character-by-character input (for example, testing an autocomplete that
requires each keystroke to trigger a search).

For standard form inputs, neither is usually needed — use `locator.fill()`
instead. It is faster and more reliable.

---

## Q206.8 — What is drag and drop in Playwright — what methods are available?

Three methods are available for drag and drop:

**`locator.dragTo(target)`** — the high-level helper. Moves the element
to the target locator's position. Handles the full drag lifecycle automatically.

**`locator.dragTo(target, options)`** — same but with control over source
and target positions within each element.

**Manual drag using `page.mouse`** — full control, necessary when `dragTo`
does not work with a specific drag library.

```typescript
// High-level (preferred)
await page.getByTestId('item-1').dragTo(page.getByTestId('zone-B'));

// With positions
await page.getByTestId('item-1').dragTo(page.getByTestId('zone-B'), {
  sourcePosition: { x: 10, y: 10 },
  targetPosition: { x: 200, y: 50 },
});

// Manual
const source = page.getByTestId('item-1');
const target = page.getByTestId('zone-B');
await source.hover();
await page.mouse.down();
await target.hover();
await page.mouse.up();
```

---

## Q206.9 — What is the difference between dragTo and the manual mouse drag approach?

`dragTo()` is a high-level abstraction. It:
- Waits for source actionability
- Moves to the element centre
- Dispatches the full drag event sequence (`dragstart`, `drag`, `dragenter`,
  `dragover`, `drop`, `dragend`)
- Handles the entire lifecycle in one operation

The manual approach (`mouse.down/move/up`) dispatches raw mouse events.
Some JavaScript drag libraries (like React DnD) respond to HTML5 drag events
(`dragstart`, `drop`). Others respond to mouse events (`mousedown`, `mousemove`,
`mouseup`). The two are different event systems.

**Decision rule:**
- Try `dragTo()` first — it is cleaner and handles most HTML5 drag scenarios
- If `dragTo()` does not work with a specific library, switch to manual
  mouse control
- If neither works, the component may need `dispatchEvent` with a
  `DataTransfer` object

---

## Q206.10 — When should you use dispatchEvent instead of the built-in interaction methods?

`dispatchEvent` fires a synthetic JavaScript event directly on the element
without going through Playwright's actionability checks or the browser's
natural event dispatching path.

Use it only when:

1. **The element is intentionally non-interactive for visual users** — a
   hidden input that receives programmatic events but is not visually actionable.

2. **You need a custom event** — firing a custom event that the application
   listens for but that cannot be triggered by normal user interaction.

3. **Testing event handlers directly** — unit-test-style verification that
   a specific event handler responds correctly.

```typescript
// Custom event
await page.getByTestId('chart').dispatchEvent('chartUpdated', {
  detail: { dataPoint: { x: 5, y: 10 } }
});

// Drag with DataTransfer for HTML5 DnD
const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
await page.getByTestId('drop-zone').dispatchEvent('drop', { dataTransfer });
```

Do NOT use `dispatchEvent` to bypass an actionability failure. If `click()`
times out, the problem is the element state — not the event system.

---

## Q206.11 — What is wrong with relying on hover to reveal elements before clicking them?

Hover-revealed UI (menus that appear on hover) creates a fragile dependency
in tests:

```typescript
// ❌ Fragile — the second getByRole must locate within the hover-revealed state
await page.getByText('Products').hover();
await page.getByRole('link', { name: 'Electronics' }).click();
// If hover state disappears before click executes, the link is not found
```

Problems:
- Timing-sensitive — the hover must remain active long enough for the click
- Not accessible — a keyboard user cannot hover with a mouse
- Fragile in headless mode — some hover effects behave differently without
  a visible browser window

Better approaches:
- Use `getByRole('menu')` or `getByRole('navigation')` to scope to the
  revealed container, then chain to the item
- Request the developer add a keyboard-accessible version of the same
  navigation — if it is not keyboard accessible, it is an accessibility bug
- If hover is unavoidable, verify the menu container is visible before
  proceeding: `await expect(dropdownMenu).toBeVisible()`

---

## Q206.12 — How do advanced Playwright interactions compare to Selenium Actions class?

Selenium uses an `ActionChains` (Python) or `Actions` class (Java) object
to chain complex interactions: `Actions.moveToElement().click().build().perform()`.

Playwright does not have a chain builder — each method is awaited individually:

```typescript
// Selenium Actions (Java)
new Actions(driver)
  .moveToElement(element)
  .click()
  .sendKeys("text")
  .perform();

// Playwright — sequential awaits
await element.hover();
await element.click();
await element.fill('text');
```

Playwright's approach is simpler and more readable. The downside is no
built-in action batching — each action is a separate protocol round-trip.
In practice this is not a performance problem because each action is fast.

For keyboard modifiers during a click, Playwright supports inline options
rather than a chain:

```typescript
await page.getByText('Item').click({ modifiers: ['Control'] }); // Ctrl+Click
await page.getByText('Item').click({ button: 'right' });        // Right click
```

---

## Q206.13 — Write code to drag an item from one list to another

```typescript
import { test, expect } from '@playwright/test';

test('user can move item between kanban columns', async ({ page }) => {
  await page.goto('/kanban');

  // Verify item is in the "To Do" column before dragging
  const todoColumn = page.getByRole('region', { name: 'To Do' });
  const doneColumn = page.getByRole('region', { name: 'Done' });

  await expect(todoColumn.getByText('Write tests')).toBeVisible();

  // Drag the item card to the Done column
  await page.getByText('Write tests')
    .dragTo(doneColumn);

  // Verify the item moved to Done and is no longer in To Do
  await expect(doneColumn.getByText('Write tests')).toBeVisible();
  await expect(todoColumn.getByText('Write tests')).toHaveCount(0);
});
```

---

## Q206.14 — Write code to use keyboard shortcuts in a rich text editor

```typescript
import { test, expect } from '@playwright/test';

test('user can format text with keyboard shortcuts', async ({ page }) => {
  await page.goto('/editor');

  const editor = page.getByRole('textbox', { name: 'Document content' });

  // Click to focus the editor
  await editor.click();

  // Type some content
  await editor.fill('This text should be bold.');

  // Select all content
  await page.keyboard.press('Control+a');

  // Apply bold formatting
  await page.keyboard.press('Control+b');

  // Assert the bold button is now active (toggled state)
  await expect(
    page.getByRole('button', { name: 'Bold' })
  ).toHaveAttribute('aria-pressed', 'true');

  // Undo the bold formatting
  await page.keyboard.press('Control+z');

  // Type at the end of the text
  await page.keyboard.press('End');
  await page.keyboard.type(' And this is italic.');

  // Select the last sentence
  await page.keyboard.press('Home');
  await page.keyboard.down('Shift');
  await page.keyboard.press('End');
  await page.keyboard.up('Shift');

  // Apply italic
  await page.keyboard.press('Control+i');
});
```

---

## Q206.15 — Describe an advanced interaction challenge you solved

In our project we had a test for a reorder page where users drag products
to sort them by priority. The page used a custom React drag library
(react-beautiful-dnd) that dispatched custom JavaScript events rather
than native HTML5 drag events.

`dragTo()` moved the element visually but the list did not reorder because
the library was not listening to HTML5 `dragstart`/`drop` — it used pointer
events and a custom event system.

We solved it using keyboard accessibility: react-beautiful-dnd supports
keyboard drag:

```typescript
// Keyboard drag — works reliably with react-beautiful-dnd
const item = page.getByRole('listitem', { name: 'Product Alpha' });

// Start drag by pressing Space
await item.focus();
await page.keyboard.press('Space'); // initiates keyboard drag

// Move down with arrow keys
await page.keyboard.press('ArrowDown');
await page.keyboard.press('ArrowDown');

// Drop by pressing Space again
await page.keyboard.press('Space');

// Verify new position
const listItems = await page.getByRole('listitem').all();
const texts = await Promise.all(listItems.map(i => i.textContent()));
expect(texts[2]).toContain('Product Alpha'); // moved from position 0 to 2
```

This was also a better test — it verified the accessibility of the reorder
feature, not just the mouse interaction.

---

## Q206.16 — What is scrollIntoViewIfNeeded and when does Playwright call it automatically?

`scrollIntoViewIfNeeded()` scrolls the page until the element is within the
visible viewport. Playwright calls it automatically as part of its actionability
check — before clicking or filling, it ensures the element is in view.

You rarely need to call it manually. The automatic scroll happens as part
of every action.

```typescript
// Playwright auto-scrolls before click
await page.getByRole('button', { name: 'Submit' }).click();
// No need to scroll manually first

// Manual scroll — only when you need the element to be visible for a visual
// assertion, not for an action
await page.getByTestId('lazy-image').scrollIntoViewIfNeeded();
await expect(page.getByTestId('lazy-image')).toBeInViewport();
```

Manual use cases: checking that lazy-loaded content appears when scrolled
into view, verifying sticky elements' behaviour, or capturing a screenshot
of a specific element that is below the fold.

---

## Q206.17 — How do you scroll to a specific position on a page?

```typescript
// Scroll to coordinates
await page.evaluate(() => window.scrollTo(0, 500)); // x, y in pixels

// Scroll to bottom of page
await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

// Scroll using mouse wheel at a position
await page.mouse.wheel(0, 300); // scroll down 300px

// Scroll a specific scrollable container
await page.evaluate(() => {
  const container = document.querySelector('.scroll-container');
  container?.scrollTo(0, 200);
});

// Scroll element into view
await page.getByTestId('footer-element').scrollIntoViewIfNeeded();
```

For most test scenarios — clicking elements below the fold — Playwright's
automatic `scrollIntoViewIfNeeded` before actions handles scrolling. Manual
scroll is only needed for testing scroll-triggered behaviour (lazy loading,
infinite scroll, sticky headers).

---

## Q206.18 — What is the difference between page.mouse.move and locator.hover?

`locator.hover()` is the semantic, high-level approach. It:
- Waits for the element to be visible (actionability check)
- Scrolls the element into view if needed
- Moves the mouse to the element's centre (by default)
- Dispatches `mouseover`, `mouseenter`, `mousemove` events

`page.mouse.move(x, y)` is the raw, coordinate-based approach. It:
- Moves the mouse to the exact pixel coordinates
- Dispatches `mousemove` events at intermediate positions
- Performs no actionability checks
- Does not auto-scroll

```typescript
// locator.hover — semantic, preferred
await page.getByRole('navigation').getByText('Products').hover();

// page.mouse.move — coordinate-based, for precise control
await page.mouse.move(450, 230); // specific pixel position
```

Use `locator.hover()` for application testing. Use `page.mouse.move()` for
canvas interactions, drawing tools, or precise coordinate-dependent tests.

---

## Chapter Summary — Key Points for Your Interview

- `hover()` reveals hover-dependent UI. `click()` triggers the click event.
  Use hover only when the UI explicitly requires it.
- `keyboard.press()` for single keys and combinations. `keyboard.type()` for
  character-by-character typing. For standard forms, use `fill()`.
- `dragTo()` for standard HTML5 drag. Manual `mouse.down/move/up` for custom
  drag libraries. If the library uses keyboard drag, that is the most reliable
  approach.
- `dispatchEvent` bypasses actionability — use only for custom events or
  programmatic testing, never to bypass a failing `click()`.
- Playwright auto-scrolls elements into view before actions. Manual
  `scrollIntoViewIfNeeded` is only needed for visual verification of
  scroll-triggered behaviour.

---
