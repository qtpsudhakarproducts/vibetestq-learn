# Chapter 205 — Actions — Clicks, Typing & Checkboxes


This chapter covers the fundamental browser interactions in Playwright — the
actions you use in every test. Interviewers test interactions because fill,
click, and select have subtleties (actionability, clearing, type vs fill)
that distinguish experienced engineers from those who just follow tutorials.

---

## Q205.1 — What are the basic interaction methods in Playwright?

The most commonly used interaction methods:

| Method | Action |
|---|---|
| `locator.click()` | Single click on element |
| `locator.fill(text)` | Clear and fill an input |
| `locator.check()` | Check a checkbox or radio |
| `locator.uncheck()` | Uncheck a checkbox |
| `locator.selectOption(value)` | Select a `<select>` option |
| `locator.press(key)` | Press a keyboard key |
| `locator.clear()` | Clear an input field |
| `locator.focus()` | Move focus to an element |
| `locator.blur()` | Remove focus from an element |
| `locator.hover()` | Hover the mouse over an element |
| `locator.dblclick()` | Double click |
| `locator.setInputFiles(path)` | Upload a file |

All of these perform actionability checks before executing. They return Promises
and must be awaited.

---

## Q205.2 — What is the difference between click and fill?

`click()` simulates a mouse click. It works on any visible, enabled element.
It performs all six actionability checks (attached, visible, stable, receives
events, enabled).

`fill(text)` is specifically for text inputs. It:
1. Focuses the element
2. Clears any existing content
3. Types the new text value in one operation

`fill` is not character-by-character — it sets the input value directly and
triggers the necessary input/change events. This makes it fast and reliable
for form automation.

```typescript
await page.getByRole('button', { name: 'Submit' }).click();   // mouse click
await page.getByLabel('Email').fill('user@test.com');         // set input value
```

The key difference: `click` is for elements you interact with by pointer.
`fill` is for text fields you populate with data.

---

## Q205.3 — When do you use check, uncheck, and selectOption?

**`check()`** — for `<input type="checkbox">` and `<input type="radio">`.
It clicks the element if it is not already checked. Does nothing if already
checked.

**`uncheck()`** — for checkboxes only. Clicks to uncheck if currently checked.

```typescript
await page.getByLabel('Accept terms').check();
await page.getByLabel('Newsletter').uncheck();
await page.getByLabel('Subscribe').setChecked(true); // set to a specific state
```

**`selectOption(value)`** — for `<select>` elements. Can select by value
attribute, visible text, or index:

```typescript
await page.getByLabel('Country').selectOption('GB');                    // by value
await page.getByLabel('Country').selectOption({ label: 'United Kingdom' }); // by visible text
await page.getByLabel('Country').selectOption({ index: 0 });            // by index
// Multi-select
await page.getByLabel('Skills').selectOption(['js', 'ts', 'python']);
```

Use `check/uncheck` for checkbox state where the final state matters.
Use `selectOption` for native `<select>` dropdowns. For custom dropdowns
(not `<select>`), use `click` to open and `getByRole('option')` to pick.

---

## Q205.4 — How do you perform basic interactions in your automation project?

In our project, basic interactions live inside page object methods. Tests never
call `page.fill()` or `page.click()` directly — they call semantic methods on
page objects.

```typescript
// ❌ Interactions scattered in test code
test('user logs in', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('user@test.com');
  await page.getByLabel('Password').fill('pass123');
  await page.getByRole('button', { name: 'Sign In' }).click();
});

// ✅ Interactions in page object method
test('user logs in', async ({ loginPage }) => {
  await loginPage.login('user@test.com', 'pass123');
});
```

Each page object method encapsulates the locators and the interaction sequence
for one user action. If the login form adds a 2FA step, we update `login()` in
one place.

For complex interactions (file uploads, drag and drop, multi-step forms), we
have helper methods in `tests/helpers/` that page objects delegate to.

---

## Q205.5 — What actionability checks does Playwright run before a click?

Before clicking, Playwright verifies the element is:

1. **Attached** — exists in the DOM
2. **Visible** — not hidden by CSS (no `display:none`, `visibility:hidden`,
   `opacity:0`, zero dimensions)
3. **Stable** — position not changing (animation completed)
4. **Receives pointer events** — not covered by another element (no modal
   overlay, no tooltip blocking)
5. **Enabled** — no `disabled` attribute

If any check fails, Playwright retries the entire check set every ~100ms until
the action timeout is reached. This is why you rarely need explicit `waitFor`
calls before clicks — the click itself waits.

The only checks that do NOT run before `click()` are `editable` checks —
those apply to `fill()` and similar input methods.

---

## Q205.6 — What happens when you call fill on an input that already has a value?

`fill(text)` always clears the current value before entering the new one.
You do not need to call `clear()` before `fill()`.

```typescript
// Equivalent — both result in "new@test.com" in the field
await page.getByLabel('Email').fill('new@test.com');

// Redundant clear — fill already clears
await page.getByLabel('Email').clear();
await page.getByLabel('Email').fill('new@test.com');
```

`fill()` triggers:
- `focus` event
- `input` event (with the new value)
- `change` event

These are the events that React, Vue, and Angular listen to for controlled input
updates. `fill()` reliably triggers reactive form updates in all major frameworks.

---

## Q205.7 — What is the difference between type and fill?

`fill(text)` — sets the input value in one operation. Fast, reliable for most
inputs. Triggers input/change events.

`pressSequentially(text, options?)` (formerly `type()`) — types character by
character, dispatching individual keydown/keypress/input/keyup events for each
character.

```typescript
// fill — fast, sets value directly
await page.getByLabel('Search').fill('playwright testing');

// pressSequentially — character by character, like a real user typing
await page.getByLabel('Search').pressSequentially('playwright', { delay: 100 });
```

**Use `fill` for 99% of inputs.** It is faster and more reliable.

**Use `pressSequentially` for:**
- Autocomplete inputs that trigger on each keystroke (the suggestions only
  appear while the user is actively typing)
- Applications that have JavaScript keystroke handlers that behave differently
  for character-by-character input vs paste operations
- Testing typeahead/autocomplete behaviour specifically

---

## Q205.8 — What is the difference between click and dblclick and tap?

**`click()`** — single left mouse button click with actionability checks.

**`dblclick()`** — double click (two rapid clicks). Used for opening files,
editing inline text, selecting words.

**`tap()`** — simulates a touch event (touchstart + touchend). Used when
testing mobile emulation where the device has touch enabled.

```typescript
await page.getByRole('button', { name: 'Select' }).click();    // single click
await page.getByText('File Name.doc').dblclick();               // open file
await page.getByRole('button', { name: 'Submit' }).tap();       // touch event
```

On desktop browsers, `tap()` maps to a click. It becomes meaningful when
testing with mobile device emulation where some UI elements only respond to
touch events.

---

## Q205.9 — What is the difference between focus and click?

`focus()` moves keyboard focus to an element without clicking it. It triggers
the `focus` event and activates the element for keyboard interaction.

`click()` simulates a complete mouse interaction: mousedown + mouseup + click.
A click also gives the element focus as a side effect.

```typescript
// focus — keyboard navigation testing
await page.getByLabel('Email').focus();
await expect(page.getByLabel('Email')).toBeFocused();
await page.keyboard.press('Tab'); // move focus to next field

// click — user interaction testing
await page.getByLabel('Email').click(); // focuses AND triggers click event
await page.getByLabel('Email').fill('user@test.com');
```

Use `focus()` when testing keyboard navigation or accessibility (tab order),
or when you need to trigger a focus-dependent UI state (like a tooltip or
dropdown) without clicking.

---

## Q205.10 — When should you use clear before fill?

Almost never. `fill()` clears the input automatically before entering new text.

The one case where `clear()` alone is useful: you want to clear a field without
entering new content — for example, testing that a form validates an empty
required field.

```typescript
// Test empty field validation
await page.getByLabel('Email').fill('user@test.com'); // fill with valid value
await page.getByLabel('Email').clear();               // clear without re-filling
await page.getByRole('button', { name: 'Submit' }).click();
await expect(page.getByRole('alert')).toHaveText('Email is required');
```

For everything else — including replacing an existing value with a new one —
`fill(newValue)` is sufficient.

---

## Q205.11 — What is wrong with using page.click(selector) instead of locator.click()?

`page.click(selector)` is an older API that takes a CSS selector string. It
works but bypasses the locator's explicit type and the readability that comes
with semantic locator methods.

```typescript
// ❌ Old API — string selector, no semantic meaning
await page.click('button[type="submit"]');

// ✅ Locator API — semantic, self-documenting
await page.getByRole('button', { name: 'Sign In' }).click();
```

Problems with `page.click(selector)`:
- Uses a CSS selector string — fragile, not semantic
- Less readable — the intent is buried in the selector
- Does not benefit from the locator's chainability, filtering, or strict mode

The `page.click()` string API still works and is not removed, but Playwright's
documentation and best practices recommend the locator API. In new code, always
use `locator.click()`.

---

## Q205.12 — How do Playwright interactions differ from Selenium interactions?

| | Playwright | Selenium |
|---|---|---|
| Auto-waiting before action | Yes — built-in actionability checks | No — manual `WebDriverWait` needed |
| Fill / clear | `fill()` clears and fills in one step | `clear()` then `sendKeys()` |
| Stale elements | Never — locator re-queries on action | Common — requires try/catch and re-find |
| Checkbox | `check()` / `uncheck()` semantic methods | `click()` (must check current state manually) |
| Select | `selectOption()` with semantic options | `Select` class with `selectByVisibleText()` |
| File upload | `setInputFiles()` with buffer support | `sendKeys()` with absolute file path |
| Keyboard | `press()`, `keyboard.down()` | `sendKeys(Keys.CONTROL, 'a')` |

The most practical difference: Playwright actions almost never need a preceding
wait. Selenium actions on dynamic pages almost always do.

---

## Q205.13 — Write code to fill a registration form with multiple field types

```typescript
import { test, expect } from '@playwright/test';

test('user can complete registration', async ({ page }) => {
  await page.goto('/register');

  // Text inputs — getByLabel finds the associated input
  await page.getByLabel('First Name').fill('Alice');
  await page.getByLabel('Last Name').fill('Johnson');
  await page.getByLabel('Email').fill('alice.johnson@test.com');
  await page.getByLabel('Password').fill('SecurePass1!');
  await page.getByLabel('Confirm Password').fill('SecurePass1!');

  // Select dropdown — by visible text
  await page.getByLabel('Country').selectOption({ label: 'United Kingdom' });

  // Radio button — semantic check
  await page.getByRole('radio', { name: 'Individual' }).check();

  // Checkbox
  await page.getByLabel('I accept the Terms and Conditions').check();
  await page.getByLabel('Subscribe to newsletter').uncheck(); // ensure unchecked

  // Submit
  await page.getByRole('button', { name: 'Create Account' }).click();

  // Assert success
  await expect(page).toHaveURL('/registration-success');
  await expect(
    page.getByRole('heading', { name: /Account Created/ })
  ).toBeVisible();
});
```

---

## Q205.14 — Write code to select an option from a dropdown by visible text and by value

```typescript
import { test, expect } from '@playwright/test';

test('all selectOption modes', async ({ page }) => {
  await page.goto('/shipping-form');

  // ---- Native  elements ----

  // By value attribute
  await page.getByLabel('Country').selectOption('GB');
  // United Kingdom

  // By visible label text
  await page.getByLabel('Shipping Method').selectOption({ label: 'Express (2-3 days)' });

  // By index (use sparingly — position is fragile)
  await page.getByLabel('Size').selectOption({ index: 2 });

  // Multi-select
  await page.getByLabel('Preferred Days').selectOption(['mon', 'wed', 'fri']);

  // ---- Custom dropdown (not a ) ----
  // Open the dropdown by clicking
  await page.getByRole('combobox', { name: 'Currency' }).click();
  // Select option by role inside the expanded listbox
  await page.getByRole('option', { name: 'GBP — British Pound' }).click();

  // Verify the selected value
  await expect(page.getByLabel('Country')).toHaveValue('GB');
});
```

---

## Q205.15 — Describe an interaction bug — a click or fill that was not working and how you fixed it

In our project we had a test that clicked a "Save" button in a settings form.
The test was reliably failing with `TimeoutError: locator.click — Timeout 30000ms
exceeded`. The button was visible on the page. No overlay was blocking it.

I opened the trace and saw that the button had `disabled` attribute for the
first 2 seconds after page load. A JavaScript initialisation script validated
the form state asynchronously and only removed `disabled` after the validation
completed.

Playwright's actionability check for `enabled` was correctly waiting — but
the test was timing out before the button became enabled. The root cause was
that the page's initial load triggered two asynchronous API calls to populate
form fields, and the Save button stayed disabled until both completed.

The fix: wait for the API calls to complete before attempting to click.

```typescript
// ✅ Fixed — wait for both API calls before clicking Save
await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/settings/profile')),
  page.waitForResponse(r => r.url().includes('/api/settings/preferences')),
  page.goto('/settings'),
]);

// Now the button is enabled
await page.getByRole('button', { name: 'Save' }).click();
```

The lesson: when an actionability check times out on `enabled`, look for
JavaScript that enables the element asynchronously. Playwright correctly
waited for the condition — the problem was upstream: the form needed API data
before it could be ready.

---

## Q205.16 — What is the selectOption method and what are its different selection modes?

`selectOption()` interacts with native `<select>` elements. It accepts four
selection modes:

```typescript
const country = page.getByLabel('Country');

// String — matches the value attribute
await country.selectOption('US');

// Object with label — matches visible text
await country.selectOption({ label: 'United States' });

// Object with index — matches position (0-based)
await country.selectOption({ index: 0 });

// Object with value — explicit value match
await country.selectOption({ value: 'US' });

// Array — for multi-select
await page.getByLabel('Tags').selectOption(['javascript', 'typescript', 'playwright']);
```

After selection, `selectOption()` dispatches `input` and `change` events,
so reactive forms update correctly.

`selectOption()` does not work on custom-built dropdowns (styled divs acting
as selects). For those, click to open, then click the option.

---

## Q205.17 — How do you interact with a checkbox group?

```typescript
// Check by label text
await page.getByLabel('Email notifications').check();
await page.getByLabel('SMS notifications').uncheck();

// Set to explicit state — useful when you don't know the current state
await page.getByLabel('Marketing emails').setChecked(true);
await page.getByLabel('Marketing emails').setChecked(false);

// Check all checkboxes in a group
const group = page.getByRole('group', { name: 'Notification Preferences' });
const checkboxes = await group.getByRole('checkbox').all();
for (const checkbox of checkboxes) {
  await checkbox.check();
}

// Assert checked state
await expect(page.getByLabel('Email notifications')).toBeChecked();
await expect(page.getByLabel('SMS notifications')).not.toBeChecked();
```

Use `setChecked(boolean)` when the test needs to guarantee a specific final
state regardless of the current state. `check()` and `uncheck()` are
idempotent — they only click if the state needs to change.

---

## Q205.18 — What is the dispatchEvent method and when do you use it instead of click?

`dispatchEvent(type, eventInit?)` dispatches a synthetic event on an element
without going through Playwright's actionability checks.

```typescript
// Normal click — goes through actionability checks
await button.click();

// dispatchEvent — bypasses actionability, fires the event directly
await button.dispatchEvent('click');

// Custom event
await element.dispatchEvent('customEvent', { detail: { value: 42 } });
```

Use `dispatchEvent` only when:

- The element is technically invisible or disabled by CSS, but your application
  has JavaScript that listens for the event regardless — testing a non-standard
  interaction pattern
- You are testing how the application responds to a specific JavaScript event
  that cannot be triggered by normal user actions

Do NOT use `dispatchEvent` to bypass actionability checks because your locator
is wrong. If `click()` fails because the element is covered or disabled, that
is the real issue — the element is not ready. Fix the locator or the wait,
not the interaction method.

---

## Q205.19 — Write code to interact with a multi-select dropdown

```typescript
import { test, expect } from '@playwright/test';

test('user can select multiple skills', async ({ page }) => {
  await page.goto('/profile/edit');

  // Native multi-select
  await page.getByLabel('Skills').selectOption([
    'javascript',
    'typescript',
    'playwright',
  ]);

  // Verify all three are selected
  await expect(page.getByLabel('Skills')).toHaveValues([
    'javascript',
    'typescript',
    'playwright',
  ]);

  // Custom multi-select (checkbox-based dropdown)
  await page.getByRole('button', { name: 'Select Frameworks' }).click();

  // Each option in the dropdown is a checkbox
  const dropdown = page.getByRole('listbox', { name: 'Select Frameworks' });
  await dropdown.getByRole('option', { name: 'React' }).click();
  await dropdown.getByRole('option', { name: 'Vue' }).click();
  await dropdown.getByRole('option', { name: 'Angular' }).click();

  // Close dropdown
  await page.keyboard.press('Escape');

  // Verify selected tags appear
  await expect(page.getByRole('button', { name: 'React' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vue' })).toBeVisible();
});
```

---

## Q205.20 — How do you verify that a form interaction was successful?

Verification after a form interaction depends on what the application shows:

```typescript
// Pattern 1 — URL change after submit
await page.getByRole('button', { name: 'Create Account' }).click();
await expect(page).toHaveURL('/dashboard');

// Pattern 2 — Success message appears
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByRole('alert')).toHaveText(/Saved successfully/);

// Pattern 3 — Specific element updates
await page.getByLabel('Display Name').fill('Alice Johnson');
await page.getByRole('button', { name: 'Save' }).click();
await expect(page.getByTestId('profile-name')).toHaveText('Alice Johnson');

// Pattern 4 — Wait for API and then assert
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/profile') && r.status() === 200),
  page.getByRole('button', { name: 'Save' }).click(),
]);
const body = await response.json();
expect(body.displayName).toBe('Alice Johnson');
```

Always assert something after an action. A test that clicks Submit and then
ends without an assertion is testing nothing.

---

## Chapter Summary — Key Points for Your Interview

- `fill()` clears and fills in one step. `pressSequentially()` types character
  by character — only needed for autocomplete and keystroke-sensitive inputs.
- `check()` and `uncheck()` are idempotent — they only act if the state
  needs to change. `setChecked(bool)` forces a specific state.
- `selectOption()` works on native `<select>`. For custom dropdowns, click
  to open then click the option.
- All actions perform actionability checks and auto-wait. When an action
  times out, the check that failed tells you what the element's state is.
- Always assert after a form interaction. Never end a test with an action
  as the final line.

---
