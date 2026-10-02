# iFrames – Detailed Notes
### Test Automation with Playwright + TypeScript

---

## Table of Contents
1. [What Is an iFrame?](#1-what-is-an-iframe)
2. [Why iFrames Exist](#2-why-iframes-exist)
3. [Types of iFrames](#3-types-of-iframes)
4. [iFrames vs. Shadow DOM vs. Dynamic Elements](#4-iframes-vs-shadow-dom-vs-dynamic-elements)
5. [Inspecting iFrames in DevTools (Elements Tab)](#5-inspecting-iframes-in-devtools-elements-tab)
6. [Same-Origin vs. Cross-Origin iFrames](#6-same-origin-vs-cross-origin-iframes)
7. [Playwright and iFrames](#7-playwright-and-iframes)
8. [Nested iFrames](#8-nested-iframes)
9. [Common Automation Failures & Root Causes](#9-common-automation-failures--root-causes)
10. [Quick Reference Cheat Sheet](#10-quick-reference-cheat-sheet)

---

## 1. What Is an iFrame?

An iFrame (`<iframe>`) is an HTML element that **embeds a completely separate HTML document** inside the current page. It is not just an isolated DOM subtree — it is a full, independent browsing context with its own `window`, `document`, `history`, and DOM tree.

**Key terms:**
- **Host page** — the main page that contains the `<iframe>` element
- **Frame document** — the separate document loaded inside the iframe
- **Browsing context** — the independent environment the iframe creates (its own window, DOM, JS scope)
- **Origin** — the combination of protocol + domain + port (e.g. `https://example.com:443`)

The iframe element itself lives in the host page's DOM, but **everything inside it belongs to a completely different document**.

### Visual Structure

```
Host Page Document (https://myapp.com)
  └── body
       └── div.content
            └── <iframe src="https://payment.com/form">
                  └── Frame Document (https://payment.com)
                        └── html
                             └── body
                                  └── form
                                       └── input   ← separate document
                                       └── button
```

> 💡 **Mental Model:** An iframe is like a picture frame hanging on a wall. The wall is your page. The picture inside is a completely different document — it has its own rules, its own DOM, and its own JavaScript. The frame itself (the `<iframe>` tag) is part of your wall, but what's inside the frame is not.

---

## 2. Why iFrames Exist

iFrames were introduced in HTML 4 (1997) and remain in widespread use today for specific legitimate purposes.

### Original Use Cases
- Embedding content from external sources without reloading the whole page (predates AJAX)
- Sandboxing third-party content so it cannot access the host page's data
- Loading separate documents that have independent scroll, history, and state

### Modern Real-World Usage

iFrames are still actively used in:
- **Payment forms** — Stripe, PayPal, Braintree all render card input fields inside iframes so the host page never touches raw card data
- **Authentication widgets** — Google reCAPTCHA, Auth0, login widgets
- **Embedded maps** — Google Maps, Mapbox embeds
- **Video players** — YouTube, Vimeo, Wistia embedded players
- **Chat widgets** — Intercom, Zendesk, Freshdesk support widgets
- **Rich text editors** — TinyMCE, CKEditor render their editable area inside an iframe
- **Analytics / A-B testing tools** — Optimizely, VWO inject content via iframes
- **Ad units** — banner ads are almost always in iframes to isolate them from the host page
- **Micro-frontend architectures** — some enterprise apps compose independent team-owned apps using iframes

> 📌 **Note:** You will encounter iframes most often in payment flows, third-party widgets, and embedded media. Any time you see a form or interactive element that "feels separate" from the rest of the page, suspect an iframe.

---

## 3. Types of iFrames

Understanding the type of iframe you are dealing with is the first step in deciding how to automate it.

### Standard iFrame

A regular embed with a `src` attribute pointing to a URL:
```html
<iframe src="https://payment.com/card-form" width="400" height="300"></iframe>
```
- Can be same-origin or cross-origin
- Most common type in real applications

### Sandboxed iFrame

Has the `sandbox` attribute which restricts what the frame can do:
```html
<iframe src="https://widget.com" sandbox="allow-scripts allow-forms"></iframe>
```

Common sandbox restrictions relevant to automation:
| Attribute | What it blocks if absent |
|---|---|
| `allow-scripts` | JavaScript execution inside the frame |
| `allow-forms` | Form submission |
| `allow-same-origin` | Treating the frame as same-origin even if it technically is |
| `allow-popups` | Opening new windows |

> ⚠️ If `allow-scripts` is missing, no JavaScript runs inside the frame — which means Playwright's `evaluate()` calls inside that frame will also fail.

### Srcdoc iFrame

Content is defined inline using the `srcdoc` attribute rather than loaded from a URL:
```html
<iframe srcdoc="<p>Hello <b>world</b></p>"></iframe>
```
- Treated as same-origin
- Common in email preview renderers, template editors, documentation tools

### Dynamic iFrame

Created and injected into the page at runtime via JavaScript:
```js
const frame = document.createElement('iframe');
frame.src = 'https://widget.com/embed';
document.body.appendChild(frame);
```
- Common in third-party scripts (chat widgets, analytics)
- The iframe may not be present in the DOM on page load — it appears after JS executes
- Requires waiting before Playwright can access it

### Hidden iFrame

Has `display: none`, `visibility: hidden`, or zero dimensions:
```html
<iframe src="/auth-check" style="display:none"></iframe>
```
- Often used for background tasks (silent authentication, token refresh, cross-tab communication)
- Not interactable — Playwright will throw if you try to interact with elements inside
- Usually not a target for test automation unless testing the background behavior

---

## 4. iFrames vs. Shadow DOM vs. Dynamic Elements

These three are the most commonly confused concepts in test automation. Each requires a fundamentally different approach.

### iFrame
- **Completely separate document** with its own `window` and `document`
- The `<iframe>` tag exists in the host DOM; everything inside it does not
- Cross-origin frames: restricted by the browser's same-origin policy
- Requires explicit frame switching in Playwright — `page.frameLocator()`

### Shadow DOM
- **Same document**, isolated subtree
- No separate window or document object — same JS context
- Playwright auto-pierces open shadow roots with no extra code
- Closed shadow roots: not accessible

### Dynamic DOM Elements
- Part of the **main document**, added at runtime by JavaScript
- Fully accessible with standard locators
- Playwright handles them with built-in auto-waiting

### Comparison Table

| Feature | iFrame | Shadow DOM | Dynamic DOM |
|---|---|---|---|
| Separate `document` object | ✅ Yes | ❌ No | ❌ No |
| Separate `window` object | ✅ Yes | ❌ No | ❌ No |
| Same DOM tree as host | ❌ No | Sub-tree | ✅ Yes |
| `querySelector` from host works | ❌ No | ❌ No | ✅ Yes |
| Playwright auto-handles | ❌ No — `frameLocator` needed | ✅ (open only) | ✅ Yes |
| Cross-origin restrictions | ✅ Yes | ❌ N/A | ❌ N/A |
| XPath works inside | ✅ Yes (within frame) | ❌ No | ✅ Yes |
| CSS selectors work inside | ✅ Yes (within frame) | ✅ (with Playwright) | ✅ Yes |

---

## 5. Inspecting iFrames in DevTools (Elements Tab)

Most testers use the **Elements tab** as their primary inspection tool. iFrames present unique inspection challenges that are different from — and in some ways harder than — Shadow DOM.

---

### How the Elements Tab Shows iFrames

In the Elements tab, an iframe appears as a self-contained node. When you expand it, you see the frame's document structure rendered inline:

```html
<iframe src="https://payment.com/card-form" id="payment-frame">
  ▼ #document
      <html>
        <head>...</head>
        <body>
          <form class="card-form">
            <input type="text" name="cardNumber">
            <button type="submit">Pay</button>
          </form>
        </body>
      </html>
</iframe>
```

This looks inspectable and straightforward — but the problems begin as soon as you try to use what you see.

---

### Challenge 1 — "Copy XPath" Produces a Path That Only Works Inside the Frame

When you right-click an element inside an iframe in the Elements tab and choose **Copy → Copy XPath**, you get a path like:

```
/html/body/form/input[@name='cardNumber']
```

or

```
//*[@id="card-number-field"]
```

**This XPath is only valid within the frame's document.** If you use it directly in Playwright without first switching to the frame context, it will return zero results. There is no error message that tells you the element is in an iframe — it simply is not found.

> ❌ **Rule: XPath copied from inside an iframe is scoped to that frame's document. It will not work on the host page directly. You must switch to the frame context first, then apply the XPath.**

Unlike Shadow DOM where XPath always fails at the boundary, XPath **does work inside iframes** — but only after you have switched context. This inconsistency is a common source of confusion.

---

### Challenge 2 — "Copy Selector" Produces a Host-Page Selector, Not a Frame Selector

The **Copy → Copy selector** option behaves differently from Shadow DOM. When you right-click an element inside an iframe, DevTools sometimes generates a CSS selector that targets the **iframe element on the host page**, not the element inside the frame:

```css
#payment-frame
```

This is the selector for the `<iframe>` tag itself — not the input field you wanted. When you paste this into Playwright as `page.locator('#payment-frame')` it finds the iframe container, not the button inside it.

Other times it generates a CSS path for the internal element that only works within the frame's own document context:

```css
form.card-form > input[name="cardNumber"]
```

Neither output is immediately usable. You have to interpret which context the selector belongs to before using it.

---

### Challenge 3 — Cross-Origin iFrames Show as Empty or Blocked in Elements Tab

This is the most frustrating scenario in real-world automation. When an iframe loads content from a **different origin** (different domain, subdomain, or port), the Elements tab cannot render its contents:

```html
<iframe src="https://stripe.com/v3/elements/card-form">
  ▼ #document
      <!-- Content blocked by cross-origin policy -->
</iframe>
```

In Chrome DevTools, the frame document either appears empty or shows a blocked content notice. You cannot see the internal HTML, class names, IDs, input names, or any attributes of the elements inside. This means you **cannot use the Elements tab at all** to discover locators for cross-origin frame content.

> ⚠️ **This affects the most common real-world iframes:** Stripe, PayPal, reCAPTCHA, Google Maps, YouTube players, and most third-party widgets are all cross-origin. Their internals are invisible in DevTools.

---

### Challenge 4 — The Frame Context Is Not Obvious From the Elements Tab

When you click an element inside an iframe in the Elements tab, the breadcrumb at the bottom of DevTools updates to show you are inside a frame context. But this is easy to miss. Many testers copy selectors or XPaths without noticing that the element belongs to a frame document, then spend time debugging why their locator finds nothing.

The Elements tab gives no prominent visual banner that says "you are now inside a separate document." The frame content renders inline with the host DOM, making it look like a deeply nested structure rather than a completely separate document.

---

### Challenge 5 — Dynamic iFrames May Not Appear Until You Interact With the Page

Third-party iframes (chat widgets, A-B testing tools, ad networks) are often injected into the DOM by a JavaScript snippet that runs after the page loads. When you open DevTools immediately on page load, the iframe may not be in the DOM yet.

If you search for the iframe in the Elements tab too early, you will not find it. You may incorrectly conclude the element is not an iframe, or that the structure is different from what it actually is at test execution time. You need to trigger the condition that causes the iframe to appear (scrolling to it, clicking something, waiting a few seconds) before inspecting.

---

### Challenge 6 — Nested iFrames Are Extremely Hard to Navigate

When an iframe contains another iframe (an outer widget frame that contains an inner card input frame, for example), the Elements tab requires you to expand each document level manually:

```
<iframe id="payment-widget">
  ▼ #document
      <body>
        <iframe id="card-input-frame">
          ▼ #document            ← second separate document
              <body>
                <input type="text">   ← target
```

Each `#document` boundary is a complete context switch. Copying XPath at the innermost level only gives you the path within the innermost frame — which is only the last step of what you need. Your Playwright code must mirror every context switch.

---

### Challenge 7 — Sandboxed iFrames May Block DevTools Interaction

If a frame has `sandbox` without `allow-same-origin`, the browser treats it as cross-origin even if it is served from the same domain. DevTools may block inspection of its contents. This is rare but appears in tightly secured enterprise apps and occasionally in embedded documentation tools.

---

### When Elements Tab Inspection DOES Work Well for iFrames

Despite these challenges, the Elements tab is valuable in specific situations:

| Situation | Why It Works |
|---|---|
| **Same-origin iframes** | Full document tree is visible and expandable; all selectors, XPath, and attributes are readable |
| **Identifying the iframe itself** | The `id`, `name`, `src`, `title`, and `data-testid` attributes on the `<iframe>` tag are always visible — these are what you pass to `frameLocator()` |
| **Confirming an iframe exists** | Useful to verify whether a suspected iframe is actually a frame or just a component with Shadow DOM |
| **Reading the frame's `title` attribute** | `frameLocator('[title="Payment Form"]')` is often the most stable Playwright selector — the title is readable in Elements tab |
| **Srcdoc iframes** | These are always treated as same-origin so full inspection is available |
| **Dynamic frame timing** | You can watch the iframe get injected in real time in the Elements tab by leaving it open while triggering the page action |
| **Verifying frame structure after a fix** | Checking that a developer changed a frame's `title` or added a `data-testid` on the iframe element |

---

### The Correct Mental Model for Elements Tab + iFrames

The Elements tab is useful for two specific things with iframes:

1. **Inspecting the `<iframe>` element itself** — read its `id`, `name`, `title`, `src` attributes to build your `frameLocator()` selector
2. **Inspecting the frame's internal content** — only works reliably for same-origin frames

For cross-origin frames (Stripe, reCAPTCHA, YouTube, etc.), the Elements tab gives you nothing about the internals. In those cases, you must rely on public documentation, the provider's testing sandbox, or official test libraries.

> ⚠️ **Key Takeaway:** Unlike Shadow DOM, where XPath always fails, XPath works inside iframes once you switch context. But you must switch context first. The Elements tab makes this context switch invisible, which is the root cause of most iframe-related locator bugs.

---

## 6. Same-Origin vs. Cross-Origin iFrames

This distinction is the single most important thing to understand about iframe automation, because it determines what is possible.

### Same-Origin iFrame

The iframe's `src` has the **same protocol, domain, and port** as the host page.

```
Host page: https://myapp.com/checkout
Frame src: https://myapp.com/components/card-form   ✅ Same origin
```

- Full DOM access from host page
- JavaScript can communicate freely across the boundary
- DevTools shows full frame content
- Playwright can interact with frame content via `frameLocator()`
- XPath and CSS selectors both work inside the frame

### Cross-Origin iFrame

The iframe's `src` has a **different domain, subdomain, or port**.

```
Host page:  https://myapp.com/checkout
Frame src:  https://js.stripe.com/v3/card-form   ❌ Cross-origin
```

- Browser blocks direct DOM access from host page (Same-Origin Policy)
- JavaScript on the host page cannot read the frame's DOM
- DevTools shows empty or blocked content for the frame
- Playwright can still **interact** with cross-origin frames but cannot run `evaluate()` inside them
- You can click, type, and assert — but you cannot execute arbitrary JS inside the frame

### The Same-Origin Policy in Practice

| Action | Same-Origin | Cross-Origin |
|---|---|---|
| Read frame's DOM via JS | ✅ Yes | ❌ Blocked |
| Run `evaluate()` inside frame | ✅ Yes | ❌ Blocked |
| Click elements inside frame | ✅ Yes | ✅ Yes (Playwright) |
| Fill inputs inside frame | ✅ Yes | ✅ Yes (Playwright) |
| Read element text inside frame | ✅ Yes | ✅ Yes (Playwright) |
| DevTools shows frame content | ✅ Yes | ❌ Blocked |
| `window.postMessage()` communication | ✅ Yes | ✅ Yes (with listener) |

> 💡 **Playwright exception:** Playwright operates at the browser protocol level (CDP), which allows it to interact with cross-origin frames for actions like click, fill, and assertions — even though normal JavaScript cannot. This is one of Playwright's key advantages over Selenium for cross-origin scenarios.

---

## 7. Playwright and iFrames

Playwright requires explicit frame context switching for all iframe interactions. Unlike Shadow DOM (which Playwright handles automatically), iframes always need deliberate handling.

### frameLocator() — The Primary Tool

`frameLocator()` creates a locator scoped to a specific frame. All subsequent locator calls on it target the frame's document:

```ts
// By CSS selector targeting the iframe element
const frame = page.frameLocator('#payment-frame');
await frame.getByLabel('Card Number').fill('4242424242424242');
await frame.getByRole('button', { name: 'Pay' }).click();
```

### Ways to Identify a Frame

Use whichever attribute is most stable for your iframe:

```ts
// By id attribute on the <iframe> tag
page.frameLocator('#payment-frame')

// By name attribute
page.frameLocator('[name="payment"]')

// By title attribute (most stable for third-party widgets)
page.frameLocator('[title="Secure payment input frame"]')

// By src (fragile — avoid if URL changes frequently)
page.frameLocator('[src*="stripe.com"]')

// By data-testid (best if developers add one)
page.frameLocator('[data-testid="card-frame"]')
```

> 💡 **Best Practice:** Prefer `title` attribute for third-party frames (Stripe, reCAPTCHA) because providers keep titles stable across version changes. IDs and names in third-party embeds can change with library updates.

### Chaining Locators Inside a Frame

Once you have a `frameLocator`, use all standard Playwright locators inside it:

```ts
const frame = page.frameLocator('[title="Payment Form"]');

// All standard locators work inside the frame
await frame.getByRole('textbox', { name: 'Card number' }).fill('4242 4242 4242 4242');
await frame.getByLabel('Expiry').fill('12/26');
await frame.getByLabel('CVC').fill('123');
await frame.getByRole('button', { name: 'Pay now' }).click();

// Assertions also work inside the frame
await expect(frame.getByText('Payment successful')).toBeVisible();
```

### Accessing the Frame Object (for evaluate())

`frameLocator()` is locator-only. If you need to run JavaScript inside a same-origin frame, use `page.frame()` instead:

```ts
// page.frame() returns the Frame object (allows evaluate)
const frame = page.frame({ name: 'payment' });
// or
const frame = page.frame({ url: /myapp\.com\/card-form/ });

// Now you can run evaluate() inside the frame
const value = await frame.evaluate(() => document.querySelector('input').value);
```

> ⚠️ `page.frame()` only works for same-origin frames. For cross-origin frames, `evaluate()` will throw a security error.

### Waiting for a Frame to Load

Frames load asynchronously. Always ensure the frame is ready before interacting:

```ts
// Wait for the iframe element to appear in the host DOM
await page.waitForSelector('#payment-frame');

// frameLocator() itself doesn't wait — the locator inside it does
const frame = page.frameLocator('#payment-frame');

// This waits automatically (Playwright auto-waits on locator actions)
await frame.getByLabel('Card Number').fill('4242424242424242');
```

For dynamically injected iframes (chat widgets, analytics), you may need to trigger the condition first:

```ts
// Trigger the iframe to appear
await page.getByRole('button', { name: 'Contact support' }).click();

// Then wait for it
await page.waitForSelector('[title="Support Chat"]');
const frame = page.frameLocator('[title="Support Chat"]');
await frame.getByRole('textbox', { name: 'Message' }).fill('Hello');
```

### Playwright vs. Selenium for iFrames

| Capability | Selenium / WebDriver | Playwright |
|---|---|---|
| Frame switching syntax | `driver.switchTo().frame()` — must switch back manually | `frameLocator()` — scoped, no switching back needed |
| Cross-origin interaction | Blocked or requires workarounds | ✅ Supported natively |
| Auto-waiting inside frames | ❌ Manual `WebDriverWait` | ✅ Auto-waits on all locator actions |
| Nested frame handling | Manual — switch at each level | Chain `frameLocator().frameLocator()` |
| Frame identification options | Index, name, element | CSS, name, title, URL pattern |
| Code readability | Lower — context switches hidden in code | Higher — scope is explicit in locator chain |

---

## 8. Nested iFrames

Nested iframes (an iframe inside another iframe) appear in payment flows, embedded document editors, and some A-B testing implementations. They are the most complex iframe scenario.

### Structure Example

```
Host page
  └── <iframe id="payment-widget">   (outer frame — same origin)
        └── Frame Document
             └── <iframe id="card-input">  (inner frame — cross origin, e.g. Stripe)
                   └── Frame Document
                        └── input[name="cardNumber"]  ← target
```

### Playwright Approach — Chain frameLocator()

```ts
// Outer frame → inner frame → element
await page
  .frameLocator('#payment-widget')          // switch to outer frame
  .frameLocator('#card-input')              // switch to inner frame
  .getByLabel('Card number')                // target element
  .fill('4242424242424242');
```

Each `frameLocator()` in the chain adds one level of frame context. Playwright handles the nesting automatically.

### Important Rules for Nested Frames

- **Each frame in the chain is independent** — same-origin rules apply separately at each level
- **If the outer frame is cross-origin**, Playwright can still interact but cannot run `evaluate()` at any level below it
- **If the inner frame is cross-origin but the outer is same-origin**, `evaluate()` works in the outer frame but not the inner
- **DevTools inspection becomes unreliable** at nesting level 2 and beyond for cross-origin frames

### Debugging Nested Frames

```ts
// List all frames on the page (useful for debugging)
const frames = page.frames();
frames.forEach(f => console.log(f.name(), f.url()));

// Find a specific frame by URL pattern
const innerFrame = page.frames().find(f => f.url().includes('stripe.com'));
```

> ⚠️ **Challenge:** At nesting level 3 or deeper, even Playwright's frame chaining can become unclear. At that point, restructure your test to use helper functions that encapsulate each frame level. Deeply nested iframes are usually a sign of a problematic architecture — raise it with the development team.

---

## 9. Common Automation Failures & Root Causes

| Symptom | Likely Root Cause | Solution |
|---|---|---|
| Element not found | Locator used on host page, element is inside a frame | Identify the iframe and use `frameLocator()` |
| Element not found | Frame has not loaded yet | `waitForSelector` on the iframe, then interact |
| Element not found | Dynamic iframe not yet injected | Trigger the condition that creates the iframe first |
| Element not found | Wrong frame identified | Log all frames with `page.frames()` and match by URL or name |
| `evaluate()` throws security error | Cross-origin frame | `evaluate()` not allowed; use locator interactions only |
| Click has no effect | Sandboxed frame blocks scripts | Check sandbox attributes; `allow-scripts` must be present |
| Works locally, fails in CI | Cross-origin blocked by test environment network rules | Check network policies; some CI environments block third-party domains |
| XPath returns no results | XPath used on host page scope for an element inside a frame | Switch to frame context with `frameLocator()` first |
| `frameLocator()` finds no frame | iframe not in DOM yet | Add `waitForSelector` before calling `frameLocator()` |
| Assertion fails intermittently | Frame content loads slower than main page | Use `expect(locator).toBeVisible()` which auto-waits |
| Nested frame element not found | Only switched to outer frame, not inner | Chain `.frameLocator().frameLocator()` for each level |

---

## 10. Quick Reference Cheat Sheet

### Identifying the Right Frame

```ts
// List all frames to find the right one
page.frames().forEach(f => console.log(f.name(), f.url()));

// Check if a specific frame exists
const exists = page.frames().some(f => f.url().includes('stripe.com'));
```

### frameLocator() Patterns

```ts
// Most common patterns
page.frameLocator('#frame-id')
page.frameLocator('[name="frame-name"]')
page.frameLocator('[title="Frame Title"]')       // best for third-party
page.frameLocator('[src*="domain.com"]')          // partial URL match
page.frameLocator('[data-testid="my-frame"]')     // if devs add test IDs
```

### Full Interaction Examples

```ts
// Basic frame interaction
const frame = page.frameLocator('[title="Payment Form"]');
await frame.getByLabel('Card Number').fill('4242424242424242');
await frame.getByRole('button', { name: 'Pay' }).click();
await expect(frame.getByText('Success')).toBeVisible();

// Waiting for a dynamic iframe
await page.getByRole('button', { name: 'Open chat' }).click();
await page.waitForSelector('[title="Chat Widget"]');
const chat = page.frameLocator('[title="Chat Widget"]');
await chat.getByRole('textbox').fill('Hello');

// Nested iframes
await page
  .frameLocator('#outer-frame')
  .frameLocator('#inner-frame')
  .getByLabel('Input field')
  .fill('value');

// Running evaluate() in same-origin frame
const frame = page.frame({ url: /myapp\.com/ });
const text = await frame.evaluate(() => document.title);

// Asserting frame count
expect(page.frames().length).toBe(3);
```

### Summary

| Scenario | Difficulty | Playwright Approach |
|---|---|---|
| Same-origin single iframe | ✅ Easy | `frameLocator()` + standard locators |
| Cross-origin single iframe (click/fill) | ✅ Easy | `frameLocator()` — Playwright handles it |
| Cross-origin iframe (evaluate) | ❌ Blocked | Not possible — interact only via locators |
| Dynamic iframe | ⚠️ Medium | `waitForSelector` before `frameLocator()` |
| Nested same-origin iframes | ⚠️ Medium | Chain `.frameLocator().frameLocator()` |
| Nested cross-origin iframes | ⚠️ Hard | Chain `frameLocator()`, no `evaluate()` at any level |
| Sandboxed iframe | ⚠️ Situational | Check sandbox attributes; interaction depends on permissions |
| Third-party widget (Stripe, reCAPTCHA) | ⚠️ Medium | Use `[title]` selector; consult provider's testing docs |

> 📌 **Final Note:** Unlike Shadow DOM (which Playwright makes nearly transparent), iframes always require deliberate handling because they are architecturally separate documents. The most important habit is to **identify the iframe in the Elements tab first** (read its `id`, `name`, `title`) and **then** write your `frameLocator()`. Never try to locate elements inside a frame using host-page selectors.

---

*Reference: [Playwright Docs – Frames](https://playwright.dev/docs/frames) • [MDN Web Docs – iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/iframe) • [Same-Origin Policy – MDN](https://developer.mozilla.org/en-US/docs/Web/Security/Same-origin_policy)*
