# Chapter 209 — iFrames — frameLocator & Frames

This chapter covers two types of "scoped" content that require special
handling in Playwright: iframes (embedded documents with their own DOM)
and browser dialogs (alert, confirm, prompt). Both topics appear frequently
in interviews because they represent common real-world scenarios —
payment widgets, chat widgets, and delete confirmations — where automation
tools often fail silently.

---

## Q209.1 — What is an iframe and why does it require special handling?

An iframe (inline frame) is an HTML element that embeds a separate HTML
document inside the current page. The embedded document has its own DOM,
its own JavaScript context, and its own origin.

```html
<!-- Stripe payment widget in an iframe -->
<iframe id="card-element" src="https://js.stripe.com/v3/..."></iframe>
```

This requires special handling because Playwright's page-level locators
only search the main page's DOM. Locators do not cross iframe boundaries
automatically. If you try to use `page.getByLabel('Card Number')` to target
an input inside an iframe, Playwright cannot find it — it is in a different
document.

To interact with elements inside an iframe, you must first switch scope
into the iframe using `page.frameLocator()`.

---

## Q209.2 — What is the difference between frameLocator and page.frame?

Playwright provides two ways to work with iframes:

**`page.frameLocator(selector)`** — returns a `FrameLocator`. This is the
recommended API for interacting with elements inside an iframe. It is lazy
(no immediate DOM access), supports Playwright's auto-waiting, and is
composable with all locator methods.

**`page.frame(options)`** — returns a `Frame` object directly. This is the
lower-level API. A `Frame` has page-like methods: `goto()`, `evaluate()`,
`waitForSelector()`, and so on. It gives you access to the iframe as a
document, not just as a set of elements.

```typescript
// frameLocator — recommended for element interaction
const cardFrame = page.frameLocator('iframe#card-element');
await cardFrame.getByLabel('Card Number').fill('4111111111111111');
await cardFrame.getByLabel('Expiry Date').fill('12/28');

// page.frame — for page-level operations inside the iframe
const frameObj = page.frame({ name: 'payment' });        // by name attribute
const frameByUrl = page.frame({ url: /stripe\.com/ });  // by URL pattern
await frameObj?.goto('https://payment.example.com');
await frameObj?.evaluate(() => document.title);
```

**Use `frameLocator` for filling forms and clicking buttons.**
**Use `page.frame()` for navigation or evaluate inside the frame.**

---

## Q209.3 — When do you encounter iframes in real projects?

iframes appear in three common situations:

**Payment widgets** — Stripe, Braintree, and PayPal embed their card input
fields in iframes to isolate PCI-sensitive data from the merchant's page.

**Chat and support widgets** — Intercom, Zendesk, and similar tools render
their UI inside an iframe to prevent CSS conflicts.

**Embedded content** — YouTube embeds, Google Maps, and third-party forms
often live inside iframes.

In our project, the main iframe scenario is the Stripe payment form at checkout.
Every credit card input (card number, expiry, CVC) lives in a separate iframe.

---

## Q209.4 — How did your project handle iframes in tests?

In our project, all iframe interactions are encapsulated inside page object
methods. Tests never call `frameLocator()` directly.

```typescript
// payment.page.ts
export class PaymentPage {
  private readonly cardNumberFrame: FrameLocator;
  private readonly expiryFrame: FrameLocator;
  private readonly cvcFrame: FrameLocator;

  constructor(private readonly page: Page) {
    // Each Stripe input lives in its own iframe
    this.cardNumberFrame = page.frameLocator('iframe[name="card-number"]');
    this.expiryFrame     = page.frameLocator('iframe[name="card-expiry"]');
    this.cvcFrame        = page.frameLocator('iframe[name="card-cvc"]');
  }

  async fillCard(number: string, expiry: string, cvc: string): Promise<void> {
    await this.cardNumberFrame.getByPlaceholder('Card number').fill(number);
    await this.expiryFrame.getByPlaceholder('MM / YY').fill(expiry);
    await this.cvcFrame.getByPlaceholder('CVC').fill(cvc);
  }
}

// In the test — no iframe knowledge required
const paymentPage = new PaymentPage(page);
await paymentPage.fillCard('4242424242424242', '12/28', '123');
```

This approach means iframe selectors live in one place. If Stripe changes
their iframe names, only the page object needs updating.

---

## Q209.5 — How do you handle nested iframes?

Nested iframes are iframes inside other iframes. Chain `frameLocator()`
calls to navigate into each level:

```typescript
// Outer iframe contains an inner iframe
const outerFrame = page.frameLocator('#outer-widget');
const innerFrame = outerFrame.frameLocator('#inner-form');

// Interact with elements inside the inner iframe
await innerFrame.getByLabel('Email').fill('user@example.com');
await innerFrame.getByRole('button', { name: 'Submit' }).click();
```

Each `frameLocator()` call scopes the search into that iframe's document.
The chain mirrors the iframe nesting in the HTML.

In practice, nested iframes beyond two levels are uncommon. When they appear,
it is usually in third-party widget integrations where you cannot control the
HTML structure.

---

## Q209.6 — How do you get all frames on a page?

`page.frames()` returns an array of all `Frame` objects for every iframe
currently in the page's DOM, including the main frame.

```typescript
const frames = page.frames();
console.log(`Total frames: ${frames.length}`);

for (const frame of frames) {
  console.log(`Frame URL: ${frame.url()}`);
  console.log(`Frame name: ${frame.name()}`);
}

// Find a specific frame by URL pattern
const paymentFrame = frames.find(f => f.url().includes('stripe.com'));
```

The first element in `page.frames()` is always the main frame (the page
itself). Additional entries are iframes in document order.

This is useful for debugging — logging all frame URLs helps you identify
the right selector to use with `frameLocator()`.

---

## Q209.7 — What are the three types of dialogs in Playwright?

**Alert** — shows a message with one button (OK). Cannot be dismissed with
Escape. Blocks page execution until handled. Returns no value.

```javascript
alert('Your session has expired.');
```

**Confirm** — shows a message with OK and Cancel. Returns `true` when
accepted (OK) and `false` when dismissed (Cancel).

```javascript
const confirmed = confirm('Delete this record?');
```

**Prompt** — shows a message with a text input, OK, and Cancel. Returns
the entered text on accept, or `null` on dismiss.

```javascript
const name = prompt('Enter your name:', 'Default Value');
```

All three block page execution until handled. If a test triggers a dialog
and no handler is registered, Playwright auto-dismisses it by default.
This is safe but may cause unexpected behaviour if the application logic
depends on the dialog's return value.

---

## Q209.8 — How do you handle a dialog in Playwright?

Register a `page.on('dialog')` listener **before** the action that triggers
the dialog, then call `dialog.accept()` or `dialog.dismiss()` inside it:

```typescript
// Handle an alert — accept it
page.on('dialog', dialog => dialog.accept());
await page.getByRole('button', { name: 'Reset' }).click();

// Handle a confirm — accept (returns true to the app)
page.on('dialog', dialog => dialog.accept());
await page.getByRole('button', { name: 'Delete' }).click();

// Handle a confirm — dismiss (returns false to the app)
page.on('dialog', dialog => dialog.dismiss());
await page.getByRole('button', { name: 'Delete' }).click();

// Handle a prompt — provide input text
page.on('dialog', dialog => dialog.accept('Alice Johnson'));
await page.getByRole('button', { name: 'Set Name' }).click();

// Verify dialog message before responding
page.on('dialog', async dialog => {
  expect(dialog.type()).toBe('confirm');
  expect(dialog.message()).toContain('Are you sure');
  await dialog.accept();
});
await page.getByRole('button', { name: 'Delete Account' }).click();
```

---

## Q209.9 — What happens if you don't handle a dialog?

If a test triggers a dialog and no `page.on('dialog')` handler is registered,
Playwright auto-dismisses it. This means:

- An `alert` is dismissed (OK is clicked automatically)
- A `confirm` returns `false` (Cancel is clicked automatically)
- A `prompt` returns `null` (Cancel is clicked automatically)

Auto-dismissal prevents the test from hanging but can cause failures if
the application's next step depends on the user confirming (accepting) the
dialog. For example, if "Delete" shows a confirm dialog and expects OK to
proceed, auto-dismissal will cancel the delete — and the item will not be
deleted — causing subsequent assertions to fail.

Always register a handler for dialogs your test triggers intentionally.

---

## Q209.10 — What is the difference between dialog.accept and dialog.dismiss?

`dialog.accept(promptText?)` — simulates clicking OK. For a confirm, this
returns `true` to the application. For a prompt, you can pass the text to
return as the string argument.

`dialog.dismiss()` — simulates clicking Cancel (or pressing Escape). For
a confirm, this returns `false`. For a prompt, this returns `null`.

```typescript
// accept with no argument — same as clicking OK
await dialog.accept();

// accept with text — for prompt dialogs
await dialog.accept('My typed input');

// dismiss — same as clicking Cancel
await dialog.dismiss();
```

For alert dialogs, `accept()` and `dismiss()` have the same effect because
an alert only has one button (OK). Both close the dialog.

---

## Q209.11 — How do you handle a beforeunload dialog?

The `beforeunload` dialog appears when the user tries to navigate away from
a page with unsaved changes. It is browser-native and typically shows a
generic message ("Leave site?").

```typescript
// Handle beforeunload — accept means "Leave", dismiss means "Stay"
page.on('dialog', async dialog => {
  if (dialog.type() === 'beforeunload') {
    await dialog.accept(); // Accept = leave the page
  }
});

// Navigate away — this will trigger beforeunload if the page has unsaved changes
await page.goto('/other-page');
```

In most automation scenarios you want to leave the page, so you accept the
beforeunload dialog. If you are testing the "Stay" path, call `dismiss()`.

Note: many applications implement their own "unsaved changes" modals using
custom HTML dialogs rather than `beforeunload`. Those are regular page elements
and do not require `page.on('dialog')`.

---

## Q209.12 — What is dialog.message() and dialog.defaultValue()?

`dialog.message()` — returns the text displayed in the dialog. Use this to
verify that the correct dialog appeared before accepting or dismissing:

```typescript
page.on('dialog', async dialog => {
  // Verify the correct message before accepting
  expect(dialog.message()).toBe('Are you sure you want to delete this item?');
  await dialog.accept();
});
```

`dialog.defaultValue()` — returns the default text pre-filled in a prompt
dialog's input field. This is the value specified in the second argument of
`prompt('message', 'defaultValue')` in the application code:

```typescript
page.on('dialog', async dialog => {
  if (dialog.type() === 'prompt') {
    console.log('Default value:', dialog.defaultValue()); // e.g., "John Doe"
    await dialog.accept('New Name');  // Replace default with new text
  }
});
```

---

## Q209.13 — How do you handle multiple dialogs in a single test?

Register one `page.on('dialog')` listener that handles all dialogs using
conditional logic:

```typescript
let dialogCount = 0;

page.on('dialog', async dialog => {
  dialogCount++;
  console.log(`Dialog ${dialogCount}: ${dialog.type()} — "${dialog.message()}"`);

  if (dialog.type() === 'alert') {
    await dialog.accept();
  } else if (dialog.message().includes('delete')) {
    await dialog.accept();   // Confirm deletions
  } else {
    await dialog.dismiss();  // Cancel everything else
  }
});

// These actions each trigger a dialog
await page.getByRole('button', { name: 'Notify' }).click(); // triggers alert
await page.getByRole('button', { name: 'Delete All' }).click(); // triggers confirm
```

The `page.on('dialog')` listener persists for the life of the page. You do
not need to re-register it for each dialog that appears.

---

## Q209.14 — How do you use page.once('dialog') for a single dialog?

`page.once('dialog', handler)` registers a one-time listener that fires
once and then removes itself automatically.

```typescript
// One-time handler — fires for the next dialog only
page.once('dialog', dialog => dialog.accept());
await page.getByRole('button', { name: 'Confirm Action' }).click();
// Handler is automatically removed after firing
```

Use `page.once()` when you expect exactly one dialog from a specific action
and do not want the handler to interfere with dialogs from later actions.
Use `page.on()` when dialogs can appear throughout the test.

---

## Q209.15 — Write code to test a delete confirmation flow with a dialog.

This pattern tests that a confirm dialog appears when deleting, and that
the item is removed after confirming:

```typescript
test('delete item with confirmation dialog', async ({ page }) => {
  await page.goto('/items');

  // Verify item exists before deletion
  await expect(page.getByTestId('item-001')).toBeVisible();

  // Set up handler for the confirm dialog
  page.once('dialog', async dialog => {
    expect(dialog.type()).toBe('confirm');
    expect(dialog.message()).toContain('Are you sure');
    await dialog.accept(); // Click OK
  });

  // Click delete — triggers the confirm dialog
  await page.getByTestId('item-001').getByRole('button', { name: 'Delete' }).click();

  // Dialog was accepted — item should be removed
  await expect(page.getByTestId('item-001')).not.toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Item deleted');
});
```

---

## Q209.16 — Write code to interact with a payment form inside an iframe.

```typescript
test('complete payment with Stripe iframe', async ({ page }) => {
  await page.goto('/checkout');
  await page.getByRole('button', { name: 'Proceed to Payment' }).click();

  // Each Stripe field lives in a separate iframe
  const cardNumberFrame = page.frameLocator('iframe[name="card-number"]');
  const expiryFrame     = page.frameLocator('iframe[name="card-expiry"]');
  const cvcFrame        = page.frameLocator('iframe[name="card-cvc"]');

  // Fill card details inside their respective iframes
  await cardNumberFrame.getByPlaceholder('Card number').fill('4242424242424242');
  await expiryFrame.getByPlaceholder('MM / YY').fill('12/28');
  await cvcFrame.getByPlaceholder('CVC').fill('123');

  // Submit button is on the main page — no frame scope needed
  await page.getByRole('button', { name: 'Pay Now' }).click();

  // Assert on the main page
  await expect(page).toHaveURL(/\/order-confirmation/);
  await expect(page.getByRole('heading')).toContainText('Payment Successful');
});
```

Key points:
- Each `frameLocator()` call scopes to that specific iframe
- The submit button on the main page uses `page.getByRole()` (no frame)
- After the payment, assertions return to the main page context

---

## Q209.17 — What iframe and dialog challenges have you encountered in your project?

In our project, the main iframe challenge was Stripe's dynamic iframe names.
Early in the project, Stripe changed the `name` attribute format during a
version upgrade, breaking all our payment tests at once.

We fixed this by switching from `name` attribute selectors to `src`-based
pattern matching, which is more stable across Stripe versions:

```typescript
// Fragile — name attribute changes between Stripe versions
page.frameLocator('iframe[name="card-number"]');

// Stable — src pattern is consistent
page.frameLocator('iframe[src*="stripe.com/elements/card-number"]');
```

For dialogs, the challenge was an "unsaved changes" confirm that appeared
on navigation in our settings pages. Tests were auto-dismissing it (returning
false, meaning "stay"), so `page.goto()` was completing but the page was not
actually changing. We fixed this with a beforeEach hook in the settings test
file:

```typescript
test.beforeEach(async ({ page }) => {
  // Accept all beforeunload/confirm dialogs to allow navigation
  page.on('dialog', async dialog => {
    if (dialog.type() === 'beforeunload' || dialog.type() === 'confirm') {
      await dialog.accept();
    }
  });
});
```

---

## Q209.18 — What is the difference between frameLocator and locator when targeting iframe content?

`page.locator(selector)` searches only the main page DOM.
If the selector matches an element inside an iframe, it will not be found —
Playwright does not cross iframe boundaries with a regular locator.

`page.frameLocator(iframeSelector).locator(elementSelector)` first targets
the iframe, then searches for elements inside that iframe's DOM.

```typescript
// WRONG — searches main page only, won't find input inside iframe
await page.getByLabel('Card Number').fill('4242424242424242');

// CORRECT — searches inside the iframe
await page.frameLocator('#card-element').getByLabel('Card Number').fill('4242424242424242');
```

A frameLocator is not a locator for the iframe element itself — it is a
scope that all subsequent locator calls are resolved within. You cannot
use a frameLocator to assert on the iframe's visibility or dimensions.
For that, use `page.locator('iframe#card-element')` to target the iframe
element in the main DOM.

---

## Chapter Summary

- `page.frameLocator(selector)` scopes all subsequent locator calls into the iframe's DOM. Use it for element interaction.
- `page.frame(options)` returns the lower-level `Frame` object for navigation or `evaluate()` inside the frame.
- Nest `frameLocator()` calls to reach elements in nested iframes.
- Register `page.on('dialog')` **before** the action that triggers the dialog — never after.
- `dialog.accept()` clicks OK. `dialog.dismiss()` clicks Cancel. For prompts, pass text to `accept('text')`.
- If no handler is registered, Playwright auto-dismisses dialogs — which returns `false` for confirm and `null` for prompt.
- Encapsulate all `frameLocator()` calls inside page object methods to protect tests from iframe selector changes.
