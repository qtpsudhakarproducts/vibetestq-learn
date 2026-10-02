# Playwright Core — Interview Questions

---

## Q: What is Playwright?

**A:** Playwright is an open source browser automation library created by Microsoft. It lets you write code that controls Chromium, Firefox, and WebKit browsers. You can navigate pages, click elements, fill forms, intercept network requests, and verify that the application behaves correctly. It is designed to be fast, reliable, and work across all three major browser engines from a single API.

---

## Q: What problem does Playwright solve compared to Selenium?

**A:** Playwright addresses the main pain points of Selenium: it builds in auto-waiting (no manual sleeps needed), communicates with browsers using modern native protocols (faster and more stable), supports multiple browser types from one install, handles iframes and Shadow DOM more cleanly, has built-in network interception, and generates richer debugging artifacts (traces, videos, screenshots) out of the box. The result is fewer flaky tests and less boilerplate.

---

## Q: What browsers does Playwright support?

**A:** Playwright supports **Chromium** (covers Chrome and Edge), **Firefox**, and **WebKit** (covers Safari). Playwright bundles its own tested versions of these browsers — you do not need separate browser installations. This gives reliable cross-browser coverage without managing browser drivers or version conflicts.

---

## Q: What are the key features of Playwright?

**A:** Auto-waiting before every action. Cross-browser support from a single install. Isolated browser contexts for test independence. Rich locator strategies aligned to accessibility attributes. Network interception and mocking. Full API testing via `APIRequestContext`. Mobile emulation. Parallel and sharded test execution. Trace viewer for visual test replay. Screenshot and video capture.

---

## Q: What is the difference between Playwright and Cypress?

**A:** Playwright runs in Node.js, outside the browser, and communicates through browser protocols. Cypress runs tests inside the browser itself. Playwright supports all three major browser engines natively; Cypress only recently added limited Firefox and WebKit support. Playwright handles multiple tabs, multiple origins, and iframe interactions natively. Playwright's network interception is more powerful and works at the browser context level. Cypress has a more opinionated, batteries-included feel; Playwright gives more control.

---

## Q: What is the Browser → BrowserContext → Page hierarchy?

**A:** **Browser** is the browser process itself (Chromium, Firefox, or WebKit). **BrowserContext** is an isolated session inside that browser — like a separate user profile with its own cookies, localStorage, and authentication state. **Page** is a single tab inside a context. One Browser can have multiple contexts, and each context can have multiple pages. Tests get fresh contexts to ensure isolation.

---

## Q: What is a BrowserContext?

**A:** A BrowserContext is an isolated browser session. It has its own cookies, localStorage, sessionStorage, and network settings. Think of it as opening an incognito window that is completely isolated from all other windows. Because tests each get their own context, they cannot accidentally contaminate each other's state.

---

## Q: Why is BrowserContext important for test isolation?

**A:** All session state — cookies, local storage, auth tokens — is scoped to a context. When each test gets a fresh context, it starts clean. Tests run independently and in any order without leftover state from previous tests. This is what makes parallel execution safe and reliable.

---

## Q: How does Playwright communicate with browsers?

**A:** Playwright communicates with Chromium and Edge using the **Chrome DevTools Protocol (CDP)**. For Firefox it uses a protocol based on Firefox's remote debugging interface. For WebKit it uses WebKit's remote debugging protocol. All communication happens over WebSockets. These direct protocol connections are faster and more capable than older HTTP-based approaches like Selenium WebDriver.

---

## Q: What is the Chrome DevTools Protocol (CDP)?

**A:** CDP is a low-level protocol that Chrome exposes for remote debugging and automation. Playwright sends CDP commands to navigate pages, simulate user events, intercept network requests, capture screenshots, read console logs, and much more — all without any browser driver in the middle. This direct access is why Playwright is fast and enables features like network mocking that are difficult in older frameworks.

---

## Q: What is auto-waiting in Playwright?

**A:** Auto-waiting means Playwright automatically checks that an element is in the correct state before performing an action on it. Before clicking, it waits for the element to become attached to the DOM, visible, stable (not animating), enabled, and in the viewport. You do not need to add `waitForSelector()` or `sleep()` calls before standard interactions.

---

## Q: Why is auto-waiting important for test reliability?

**A:** Web applications load dynamically — elements appear, fade in, and change state while data loads. Without auto-waiting, a click might fire before the element is ready, causing a false failure. Auto-waiting makes tests resilient to normal timing variations without requiring you to guess and hardcode wait durations.

---

## Q: What are actionability checks?

**A:** Before performing any user action (click, fill, hover, press), Playwright runs a set of actionability checks. These verify the element is: attached to the DOM, visible (non-zero bounding box, not hidden), stable (bounding box hasn't moved in the last two animation frames), enabled (not disabled), and part of the viewport. All checks must pass or the action times out.

---

## Q: What is a locator in Playwright?

**A:** A locator is a lazy description of how to find an element. Unlike `querySelector` which finds the element once and stores a reference, a locator re-queries the DOM every time you use it. This means locators are always fresh — they automatically retry when the element is not yet available, which is what powers auto-waiting.

---

## Q: What is the recommended locator strategy?

**A:** Use user-facing attributes in this order: `getByRole()` (ARIA role and accessible name), `getByText()` (visible text), `getByLabel()` (form input label), `getByPlaceholder()`, `getByTestId()` (dedicated test attribute). Avoid CSS class selectors and XPath as primary strategies because they are fragile and tied to implementation details that change with refactoring.

---

## Q: What is getByRole() and why is it preferred?

**A:** `getByRole()` finds elements by their ARIA role and, optionally, accessible name. For example, `page.getByRole('button', { name: 'Submit' })` finds the Submit button. This mirrors how screen readers identify elements, making tests both robust to HTML changes and aligned with accessibility expectations. It is Playwright's most recommended locator strategy.

---

## Q: What is getByTestId()?

**A:** `getByTestId()` finds elements by a dedicated test attribute like `data-testid`. It's a good option when there is no suitable role or visible text to use, or when working with a codebase that already has test IDs stamped on elements. The attribute name used is configurable in `playwright.config.ts` — the default is `data-testid`.

---

## Q: What is strict mode for locators?

**A:** Strict mode means that if a locator matches more than one element, most actions throw an error instead of silently acting on the first match. This prevents subtle bugs where a locator is accidentally too broad. If multiple matches are expected, you handle them explicitly using `.first()`, `.last()`, `.nth(index)`, or `.filter()`.

---

## Q: What is the difference between click, fill, and type?

**A:** `click()` simulates a mouse click. `fill()` clears the existing value and sets a new one — it is the recommended way to set form input values, as it fires the appropriate change events. `type()` simulates key-by-key typing and triggers keydown/keypress/keyup events per character — use it when you need to test character-by-character input event handling.

---

## Q: What happens when you call fill() on an input with existing text?

**A:** `fill()` clears the existing value first, then sets the new value. This is intentional — it replaces the current content entirely. If you need to append text rather than replace, position the cursor at the end first using `locator.press('End')` and then use `type()`.

---

## Q: What is selectOption()?

**A:** `selectOption()` selects one or more options in a `<select>` element. You can select by option value, by visible label text, or by index. It fires all appropriate DOM events (`input`, `change`). For multi-select elements, pass an array of values.

```javascript
await page.getByLabel('Country').selectOption('AU');
await page.getByLabel('Tags').selectOption(['js', 'playwright']);
```

---

## Q: What is dispatchEvent()?

**A:** `dispatchEvent()` programmatically fires a DOM event on an element without going through Playwright's normal interaction flow. It bypasses actionability checks — the element does not need to be visible or enabled. Use it only when a standard action is not applicable and you specifically need to trigger a custom or synthetic event. Prefer the built-in action methods for standard interactions.

---

## Q: What is page.goto()?

**A:** `page.goto(url)` navigates the page to a URL and waits for the navigation to complete. By default it waits for the `load` event. You can change when it considers navigation done via the `waitUntil` option: `'networkidle'`, `'domcontentloaded'`, or `'commit'` (first byte received). It returns a `Response` object with the HTTP status and headers.

---

## Q: What is waitForURL()?

**A:** `waitForURL()` waits until the page's current URL matches a given string, regex, or predicate function. Use it after actions that trigger redirects or navigation — for example, after submitting a login form, `await page.waitForURL('/dashboard')` confirms the redirect completed.

---

## Q: How do you handle multiple browser tabs in Playwright?

**A:** When an action opens a new tab, capture it with `context.waitForEvent('page')` — run this alongside the action to avoid a race condition. Each new tab is an independent `Page` object. You can also open tabs programmatically with `context.newPage()`. Playwright handles multiple tabs natively with no special configuration.

```javascript
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.getByRole('link', { name: 'Open' }).click()
]);
await newPage.waitForLoadState();
```

---

## Q: What is an iframe and how do you interact with elements inside one?

**A:** An iframe embeds another HTML document inside the current page. It has its own separate DOM. To interact with elements inside an iframe, use `page.frameLocator('iframe selector')` to get a frame locator, then use locator methods on it exactly as you would on a page. Playwright handles the context switch automatically.

```javascript
await page.frameLocator('#payment-frame').getByLabel('Card Number').fill('4242424242424242');
```

---

## Q: How do you handle browser dialogs (alert, confirm, prompt)?

**A:** Register a listener with `page.on('dialog', handler)` before triggering the dialog. The handler receives a `Dialog` object — call `dialog.accept()` or `dialog.dismiss()`. You can also use `page.waitForEvent('dialog')` to wait for a specific dialog. If no handler is registered, Playwright automatically dismisses dialogs.

```javascript
page.on('dialog', dialog => dialog.accept());
await page.getByRole('button', { name: 'Delete' }).click();
```

---

## Q: What is waitForSelector()?

**A:** `waitForSelector()` waits until an element matching a CSS selector appears in (or disappears from) the DOM and returns an `ElementHandle`. For most scenarios, using auto-waiting locators is preferred over `waitForSelector()`. Use `waitForSelector()` when you specifically need to check for the presence or absence of an element before deciding what to do next.

---

## Q: What is waitForResponse()?

**A:** `waitForResponse()` waits for a specific network response matching a URL string, regex, or predicate. It returns the `Response` object once matched. Always call it alongside (not after) the action that triggers the request to avoid missing the response. Use it to wait for an API call to complete before asserting on the result.

```javascript
const [response] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/save') && r.status() === 200),
  page.getByRole('button', { name: 'Save' }).click()
]);
```

---

## Q: What is waitForFunction()?

**A:** `waitForFunction()` runs a JavaScript expression inside the browser page repeatedly until it returns a truthy value. Use it for conditions that don't have a direct Playwright API — for example, waiting until a global JavaScript variable reaches a certain value or a custom animation class is removed.

```javascript
await page.waitForFunction(() => window.appReady === true);
```

---

## Q: Why should you avoid waitForTimeout()?

**A:** `waitForTimeout()` is a fixed sleep that always waits the full duration regardless of the page's actual state. It makes tests slow (you always wait the maximum), fragile (if the page is slower than expected the test still fails), and creates false confidence. Replace it with semantic waits: `waitForURL()`, `waitForResponse()`, `waitForSelector()`, or auto-waiting locators.

---

## Q: What commonly causes flaky Playwright tests?

**A:** Missing `await` on async operations. Shared state between tests. Race conditions from non-deterministic page loads. Hardcoded timeouts that don't match real timing. Locators matching multiple elements. Tests that depend on execution order. External API slowness or unreliability. Animation transitions not completing before assertions.

---

## Q: What are common Playwright anti-patterns?

**A:** Using `waitForTimeout()` as a wait strategy. Hardcoding XPath selectors tied to DOM structure. Not using fixtures for shared setup and teardown. Running tests in a shared browser context. Writing assertions inside page objects. Using `page.evaluate()` when a built-in locator action exists. Not handling errors in `page.route()` handlers. Skipping tests on failures instead of fixing the root cause.

---

## Q: How do you debug a failing locator?

**A:** Run with `--debug` to open the Playwright Inspector and hover over elements to see their suggested locators. Use `page.pause()` inside the test to stop at that point and explore interactively. Use `locator.highlight()` to visually mark a located element. Use the trace viewer to replay every step of a recorded test run and inspect the DOM at each action.

---

## Q: What is the Playwright Trace Viewer?

**A:** The Trace Viewer is a visual tool that replays a full test recording. It shows a timeline of every action, a DOM snapshot of the page at each step, network requests, console output, and screenshots. You open a trace file with `npx playwright show-trace trace.zip`. It is the most powerful tool for diagnosing intermittent and CI-only failures.

---
