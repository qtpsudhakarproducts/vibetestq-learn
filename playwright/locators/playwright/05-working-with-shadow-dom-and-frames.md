## Chapter 5: Working with Frames and Shadow DOM

### 5.1 Understanding Frames and iFrames

**What are iFrames?**

iFrames (inline frames) are HTML elements that embed another HTML document within the current page. They create separate browsing contexts with their own DOM, window, and document objects.

**Why iFrames are Used:**
- **Security isolation**: Payment forms (Stripe, PayPal) use iframes to protect sensitive data
- **Third-party content**: Chat widgets, social media buttons, advertisements
- **Code isolation**: Prevents CSS and JavaScript conflicts
- **Cross-origin content**: Safely embed content from different domains

**Common iframe Scenarios in Testing:**
1. **Payment gateways** - Credit card forms (Stripe, Braintree, Square)
2. **Chat widgets** - Intercom, Zendesk, Drift, LiveChat
3. **Maps** - Google Maps, Mapbox embeds
4. **Social media** - Facebook Like buttons, Twitter embeds
5. **reCAPTCHA** - Google's verification widget
6. **Video players** - YouTube, Vimeo embeds
7. **Document viewers** - PDF viewers, Google Docs embeds

**HTML Structure:**
```html
<html>
  <body>
    <h1>Main Page Content</h1>
    <p>This is the parent page</p>
    
    <!-- iFrame starts here -->
    <iframe id="payment-frame" src="https://secure-payment.com/checkout">
      <!-- Separate DOM inside iframe -->
      <html>
        <body>
          <input name="cardNumber" placeholder="Card Number" />
          <input name="cvv" placeholder="CVV" />
          <button>Pay Now</button>
        </body>
      </html>
    </iframe>
  </body>
</html>
```

**Key Concepts:**
- iFrames have their own `document` and `window` objects
- Elements inside iframes cannot be accessed directly from parent page
- Must explicitly switch context to interact with iframe content
- iFrames can be nested (iframes within iframes)

### 5.2 Frame Locators (frameLocator)

Playwright's `frameLocator()` method creates a locator that can interact with elements inside an iframe.

**Basic Syntax:**
```javascript
const frame = page.frameLocator('iframe-selector');
await frame.locator('element-in-iframe').click();
```

**Locating iFrames:**

```javascript
// By ID attribute
const frame = page.frameLocator('iframe#payment-frame');

// By name attribute
const frame = page.frameLocator('iframe[name="checkout-frame"]');

// By title attribute
const frame = page.frameLocator('iframe[title="Secure Payment Gateway"]');

// By src attribute (exact)
const frame = page.frameLocator('iframe[src="https://payment.example.com"]');

// By src attribute (partial match)
const frame = page.frameLocator('iframe[src*="stripe.com"]');

// By class
const frame = page.frameLocator('iframe.payment-iframe');

// By data attribute
const frame = page.frameLocator('iframe[data-payment-frame]');
```

**Interacting with iframe Elements:**

```javascript
// Using frameLocator with Playwright's built-in locators
const paymentFrame = page.frameLocator('iframe#payment');

// getByLabel works inside iframe
await paymentFrame.getByLabel('Card Number').fill('4111111111111111');

// getByRole works inside iframe
await paymentFrame.getByRole('button', { name: 'Pay Now' }).click();

// getByPlaceholder works inside iframe
await paymentFrame.getByPlaceholder('CVV').fill('123');

// getByText works inside iframe
await expect(paymentFrame.getByText('Payment Successful')).toBeVisible();
```

**Complete Example:**
```javascript
import { test, expect } from '@playwright/test';

test('complete payment in iframe', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  // Fill main page form
  await page.getByLabel('Email').fill('customer@example.com');
  await page.getByLabel('Shipping Address').fill('123 Main St');
  
  // Access payment iframe
  const paymentFrame = page.frameLocator('iframe[title="Secure Payment"]');
  
  // Fill payment details inside iframe
  await paymentFrame.getByLabel('Card Number').fill('4242424242424242');
  await paymentFrame.getByLabel('Expiration Date').fill('12/25');
  await paymentFrame.getByLabel('CVC').fill('123');
  await paymentFrame.getByLabel('Cardholder Name').fill('John Doe');
  await paymentFrame.getByLabel('ZIP Code').fill('12345');
  
  // Submit payment (button inside iframe)
  await paymentFrame.getByRole('button', { name: /pay|submit/i }).click();
  
  // Verify success message on main page (outside iframe)
  await expect(page.getByText('Order Confirmed')).toBeVisible();
  await expect(page.getByText(/thank you/i)).toBeVisible();
});
```

**Legacy vs Modern Approach:**

```javascript
// OLD WAY (deprecated - don't use)
const frame = page.frame('frame-name');
await frame.locator('input').fill('text');

// NEW WAY (recommended - use this)
const frame = page.frameLocator('iframe[name="frame-name"]');
await frame.getByLabel('Input').fill('text');
```

**Why frameLocator is Better:**
- Works with Playwright's auto-waiting
- Compatible with all built-in locators (getByRole, getByLabel, etc.)
- No stale element issues
- Better error messages
- Encourages modern test practices

### 5.3 Nested Frames

**What are Nested Frames?**

Nested frames occur when an iframe contains another iframe inside it. This creates multiple levels of browsing contexts.

**Common Scenarios:**
- Ad networks with multiple layers
- Complex third-party widgets
- Legacy applications with framesets
- Embedded applications within portals

**Accessing Nested Frames:**

```javascript
// Level 1: Parent iframe
const level1Frame = page.frameLocator('iframe#parent-frame');

// Level 2: Child iframe within parent
const level2Frame = level1Frame.frameLocator('iframe#child-frame');

// Level 3: Grandchild iframe
const level3Frame = level2Frame.frameLocator('iframe#grandchild-frame');

// Interact with element in deeply nested frame
await level3Frame.getByLabel('Username').fill('admin');
await level3Frame.getByRole('button', { name: 'Login' }).click();
```

**Real-world Example:**

```javascript
test('interact with nested payment iframe', async ({ page }) => {
  await page.goto('https://marketplace.example.com');
  
  // First level: Marketplace iframe
  const marketplaceFrame = page.frameLocator('iframe#marketplace-widget');
  
  // Click "Buy Now" in marketplace iframe
  await marketplaceFrame.getByRole('button', { name: 'Buy Now' }).click();
  
  // Second level: Payment iframe within marketplace iframe
  const paymentFrame = marketplaceFrame.frameLocator('iframe[title="Payment"]');
  
  // Fill payment details in nested iframe
  await paymentFrame.getByLabel('Card Number').fill('4111111111111111');
  await paymentFrame.getByLabel('CVV').fill('123');
  await paymentFrame.getByRole('button', { name: 'Pay' }).click();
  
  // Verify success back in marketplace iframe
  await expect(marketplaceFrame.getByText('Purchase Complete')).toBeVisible();
});
```

**Deep Nesting (3+ levels):**

```javascript
test('handle deeply nested frames', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Navigate through multiple iframe levels
  const frame1 = page.frameLocator('iframe#level-1');
  const frame2 = frame1.frameLocator('iframe#level-2');
  const frame3 = frame2.frameLocator('iframe#level-3');
  const frame4 = frame3.frameLocator('iframe#level-4');
  
  // Interact with element in 4th level iframe
  await frame4.getByRole('button', { name: 'Submit' }).click();
  
  // Verify result (could be at any level)
  await expect(frame3.getByText('Success')).toBeVisible();
});
```

**Tips for Nested Frames:**
- Store frame locators in variables for reusability
- Use descriptive variable names (`checkoutFrame`, `paymentFrame`)
- Test each level independently when debugging
- Consider page load times for deeply nested frames

### 5.4 Waiting for Frames

Frames often load asynchronously, requiring explicit waits to ensure content is ready.

**Wait for Frame to Attach:**

```javascript
// Wait for iframe itself to be in DOM
await page.locator('iframe#payment').waitFor({ state: 'attached' });

// Then access frame content
const frame = page.frameLocator('iframe#payment');
await frame.getByLabel('Card Number').fill('4111111111111111');
```

**Wait for Content Inside Frame:**

```javascript
// Wait for specific element inside frame to be visible
const frame = page.frameLocator('iframe#widget');
await frame.getByRole('heading').waitFor({ state: 'visible' });

// Then interact
await frame.getByRole('button').click();
```

**Wait for Frame to Load Completely:**

```javascript
// Method 1: Wait for specific content
const chatFrame = page.frameLocator('iframe#chat');
await chatFrame.locator('.chat-loaded').waitFor({ state: 'visible' });

// Method 2: Wait for multiple elements
await chatFrame.getByRole('textbox').waitFor({ state: 'visible' });
await chatFrame.getByRole('button', { name: 'Send' }).waitFor({ state: 'enabled' });

// Then proceed
await chatFrame.getByRole('textbox').fill('Hello!');
```

**Custom Timeouts:**

```javascript
// Wait longer for slow-loading iframes
const frame = page.frameLocator('iframe#slow-widget');
await frame.locator('body').waitFor({ 
  state: 'attached',
  timeout: 30000  // 30 seconds
});

// Wait for specific element with custom timeout
await frame.getByRole('button').waitFor({
  state: 'visible',
  timeout: 15000  // 15 seconds
});
```

**Dynamic Frame Loading:**

```javascript
test('wait for dynamically loaded iframe', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Click button that loads iframe dynamically
  await page.getByRole('button', { name: 'Load Payment Form' }).click();
  
  // Wait for iframe to appear in DOM
  await page.locator('iframe#payment').waitFor({ 
    state: 'attached',
    timeout: 10000 
  });
  
  // Wait for iframe content to load
  const paymentFrame = page.frameLocator('iframe#payment');
  await paymentFrame.getByLabel('Card Number').waitFor({ state: 'visible' });
  
  // Now safe to interact
  await paymentFrame.getByLabel('Card Number').fill('4111111111111111');
});
```

**Waiting for Frame Network Activity:**

```javascript
// Wait for frame and its network requests
await page.goto('https://example.com');

// Wait for frame to load and stabilize
const frame = page.frameLocator('iframe#payment');
await page.waitForLoadState('networkidle');  // Wait for all network activity

await frame.getByLabel('Card Number').fill('4111111111111111');
```

### 5.5 Common Frame Scenarios

**Payment Gateways:**

**Stripe Payment Form:**
```javascript
test('Stripe payment in iframe', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  // Stripe creates iframe elements dynamically
  const cardNumberFrame = page.frameLocator('iframe[name*="__privateStripeFrame"]').first();
  
  await cardNumberFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
  await cardNumberFrame.locator('[placeholder="MM / YY"]').fill('12/25');
  await cardNumberFrame.locator('[placeholder="CVC"]').fill('123');
  
  await page.getByRole('button', { name: 'Pay' }).click();
});
```

**PayPal:**
```javascript
test('PayPal checkout', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  await page.getByRole('button', { name: 'PayPal' }).click();
  
  // PayPal opens in iframe
  const paypalFrame = page.frameLocator('iframe[title*="PayPal"]');
  await paypalFrame.getByLabel('Email or mobile number').fill('buyer@example.com');
  await paypalFrame.getByLabel('Password').fill('password123');
  await paypalFrame.getByRole('button', { name: 'Log In' }).click();
  
  // Confirm payment
  await paypalFrame.getByRole('button', { name: 'Pay Now' }).click();
});
```

**Chat Widgets:**

**Intercom:**
```javascript
test('Intercom chat widget', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Click chat button
  await page.locator('#intercom-container').click();
  
  // Access Intercom iframe
  const chatFrame = page.frameLocator('iframe[name="intercom-messenger-frame"]');
  
  // Type message
  await chatFrame.getByPlaceholder('Type a message').fill('I need help with my order');
  await chatFrame.getByRole('button', { name: 'Send' }).click();
  
  // Verify message sent
  await expect(chatFrame.getByText('I need help with my order')).toBeVisible();
});
```

**Zendesk:**
```javascript
test('Zendesk support chat', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Open chat widget
  await page.locator('#launcher').click();
  
  const chatFrame = page.frameLocator('iframe#webWidget');
  await chatFrame.getByLabel('Name').fill('John Doe');
  await chatFrame.getByLabel('Email').fill('john@example.com');
  await chatFrame.getByLabel('Message').fill('Need support');
  await chatFrame.getByRole('button', { name: 'Send' }).click();
});
```

**Google Maps:**
```javascript
test('Google Maps embed', async ({ page }) => {
  await page.goto('https://example.com/contact');
  
  const mapFrame = page.frameLocator('iframe[src*="google.com/maps"]');
  
  // Interact with map
  await mapFrame.getByRole('button', { name: 'Directions' }).click();
  await mapFrame.getByPlaceholder('Choose starting point').fill('New York, NY');
  await mapFrame.getByRole('button', { name: 'Search' }).click();
});
```

**reCAPTCHA:**
```javascript
test('handle reCAPTCHA', async ({ page }) => {
  await page.goto('https://example.com/signup');
  
  // Fill form
  await page.getByLabel('Email').fill('user@example.com');
  
  // reCAPTCHA iframe
  const recaptchaFrame = page.frameLocator('iframe[title="reCAPTCHA"]');
  await recaptchaFrame.getByRole('checkbox', { name: "I'm not a robot" }).click();
  
  // Note: In real tests, you'd use test keys or mock reCAPTCHA
});
```

**YouTube Embeds:**
```javascript
test('YouTube video controls', async ({ page }) => {
  await page.goto('https://example.com/video');
  
  const youtubeFrame = page.frameLocator('iframe[src*="youtube.com/embed"]');
  
  // Click play button
  await youtubeFrame.getByRole('button', { name: 'Play' }).click();
  
  // Wait for video to start
  await page.waitForTimeout(2000);
  
  // Pause video
  await youtubeFrame.getByRole('button', { name: 'Pause' }).click();
});
```

### 5.6 Switching Between Frame and Main Page

With Playwright's `frameLocator`, you don't need to explicitly "switch back" - you simply use `page` for main content and `frame` for iframe content.

**Pattern:**
```javascript
// Main page
await page.getByRole('button', { name: 'Open Widget' }).click();

// Inside iframe
const widgetFrame = page.frameLocator('iframe#widget');
await widgetFrame.getByPlaceholder('Enter text').fill('Hello');
await widgetFrame.getByRole('button', { name: 'Submit' }).click();

// Back to main page (no explicit "switch" needed!)
await expect(page.getByText('Widget submitted')).toBeVisible();
await page.getByRole('button', { name: 'Close Widget' }).click();

// Back to iframe if needed
await widgetFrame.getByRole('button', { name: 'New Message' }).click();

// Main page again
await expect(page.getByText('New message sent')).toBeVisible();
```

**Complete Example:**
```javascript
test('checkout flow with iframe payment', async ({ page }) => {
  // 1. Main page: Add item to cart
  await page.goto('https://shop.example.com/products');
  await page.getByRole('button', { name: 'Add to Cart' }).click();
  
  // 2. Main page: Go to checkout
  await page.getByRole('link', { name: 'Cart' }).click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  
  // 3. Main page: Fill shipping info
  await page.getByLabel('Full Name').fill('John Doe');
  await page.getByLabel('Address').fill('123 Main St');
  await page.getByLabel('City').fill('New York');
  
  // 4. Main page: Continue to payment
  await page.getByRole('button', { name: 'Continue to Payment' }).click();
  
  // 5. iframe: Fill payment details
  const paymentFrame = page.frameLocator('iframe[title="Payment"]');
  await paymentFrame.getByLabel('Card Number').fill('4111111111111111');
  await paymentFrame.getByLabel('Expiry').fill('12/25');
  await paymentFrame.getByLabel('CVV').fill('123');
  await paymentFrame.getByRole('button', { name: 'Pay Now' }).click();
  
  // 6. Back to main page: Verify order confirmation
  await expect(page.getByRole('heading', { name: 'Order Confirmed' })).toBeVisible();
  await expect(page.getByText(/order number/i)).toBeVisible();
  
  // 7. Main page: Download receipt
  await page.getByRole('link', { name: 'Download Receipt' }).click();
});
```

**Key Points:**
- Use `page.` for main page elements
- Use `frame.` for iframe elements
- No need to call "switchTo" or "switchBack"
- Can alternate between page and frame freely
- Each has independent context

### 5.7 Shadow DOM (automatic piercing)

**What is Shadow DOM?**

Shadow DOM is a web standard that allows developers to encapsulate HTML, CSS, and JavaScript within a component, hiding implementation details from the rest of the page.

**Common Use Cases:**
- Web Components (custom elements)
- Component libraries (Material-UI, Lit, Shoelace)
- Browser native elements (video players, input controls)
- Micro-frontends
- Widget isolation

**The Good News: Playwright Pierces Shadow DOM Automatically!**

Unlike Selenium or Cypress, Playwright automatically finds elements inside Shadow DOM - no special syntax needed!

**Example:**
```javascript
// HTML with Shadow DOM:
// <custom-button>
//   #shadow-root
//     <button>Click Me</button>
// </custom-button>

// Playwright finds it automatically!
await page.locator('custom-button button').click();

// Or use semantic locators (recommended)
await page.getByRole('button', { name: 'Click Me' }).click();
```

**Real-world Examples:**

**Material-UI Components:**
```javascript
test('interact with Material-UI', async ({ page }) => {
  await page.goto('https://material-ui.example.com');
  
  // Material-UI uses Shadow DOM internally
  // Playwright handles it automatically!
  
  // Click Material button
  await page.locator('mwc-button').click();
  
  // Fill Material text field
  await page.locator('mwc-textfield').fill('input text');
  
  // Select from Material dropdown
  await page.locator('mwc-select').click();
  await page.getByRole('option', { name: 'Option 1' }).click();
  
  // Better: Use role-based locators
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByLabel('Email').fill('user@example.com');
});
```

**Custom Web Components:**
```javascript
test('custom dropdown component', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Custom component with Shadow DOM
  // <custom-dropdown>
  //   #shadow-root
  //     <button class="dropdown-toggle">Select</button>
  //     <ul class="options">
  //       <li>Option 1</li>
  //     </ul>
  // </custom-dropdown>
  
  // Playwright pierces shadow DOM automatically
  await page.locator('custom-dropdown button').click();
  await page.locator('custom-dropdown li').first().click();
  
  // Better with semantic locators
  await page.locator('custom-dropdown').getByRole('button').click();
  await page.locator('custom-dropdown').getByText('Option 1').click();
});
```

**Nested Shadow DOM:**
```javascript
test('nested shadow roots', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Multiple levels of Shadow DOM
  // <app-root>
  //   #shadow-root
  //     <app-header>
  //       #shadow-root
  //         <custom-menu>
  //           #shadow-root
  //             <button>Menu</button>
  
  // Playwright pierces all levels automatically!
  await page.locator('app-root app-header custom-menu button').click();
  
  // Or chain locators
  await page
    .locator('app-root')
    .locator('app-header')
    .locator('custom-menu')
    .getByRole('button', { name: 'Menu' })
    .click();
});
```

**Shoelace Components:**
```javascript
test('Shoelace UI library', async ({ page }) => {
  await page.goto('https://shoelace-example.com');
  
  // Shoelace uses Shadow DOM heavily
  await page.locator('sl-button').click();
  await page.locator('sl-input').fill('text');
  await page.locator('sl-checkbox').check();
  
  // Using semantic locators (works through shadow DOM)
  await page.getByRole('button', { name: 'Submit' }).click();
  await page.getByLabel('Username').fill('admin');
  await page.getByRole('checkbox', { name: 'Remember me' }).check();
});
```

**Why Playwright's Shadow DOM Support is Superior:**

1. **No special syntax** - Works like regular elements
2. **Works with all locators** - getByRole, getByLabel, etc. all pierce shadow DOM
3. **Auto-waiting works** - Full auto-waiting support through shadow boundaries
4. **Nested shadow DOM** - Handles any depth automatically
5. **No performance penalty** - Efficient shadow DOM traversal

**Comparison with Other Tools:**

```javascript
// SELENIUM (painful!)
WebElement host = driver.findElement(By.cssSelector("custom-element"));
SearchContext shadowRoot = host.getShadowRoot();
shadowRoot.findElement(By.cssSelector("button")).click();

// CYPRESS (requires plugin and special commands)
cy.get('custom-element').shadow().find('button').click();

// PLAYWRIGHT (just works!)
await page.locator('custom-element button').click();
// Or better:
await page.getByRole('button').click();  // Finds it automatically!
```

### 5.8 Combining Frames and Shadow DOM

**Shadow DOM Inside iFrame:**

When Shadow DOM components are inside iframes, Playwright handles both automatically!

```javascript
test('shadow DOM in iframe', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Frame contains web components with Shadow DOM
  const widgetFrame = page.frameLocator('iframe#widget');
  
  // Playwright pierces both frame AND shadow DOM
  await widgetFrame.locator('custom-button').click();
  await widgetFrame.locator('custom-input').fill('text');
  
  // Using semantic locators (recommended)
  await widgetFrame.getByRole('button', { name: 'Submit' }).click();
  await widgetFrame.getByLabel('Email').fill('user@example.com');
});
```

**Complex Example:**

```javascript
test('nested frames with shadow DOM', async ({ page }) => {
  await page.goto('https://example.com');
  
  // Level 1: iframe
  const appFrame = page.frameLocator('iframe#app');
  
  // Level 2: Shadow DOM inside iframe
  await appFrame.locator('app-root').getByRole('button').click();
  
  // Level 3: Another iframe inside the shadow DOM component
  const nestedFrame = appFrame
    .locator('app-root')
    .frameLocator('iframe#nested');
  
  // Level 4: Shadow DOM inside nested iframe
  await nestedFrame.locator('custom-form').getByLabel('Name').fill('John');
  
  // Playwright handles all of this automatically!
});
```

**Payment Widget Example:**

```javascript
test('Stripe Elements with Shadow DOM', async ({ page }) => {
  await page.goto('https://example.com/checkout');
  
  // Stripe uses iframes with Shadow DOM
  const cardFrame = page.frameLocator('iframe[title*="Secure card"]');
  
  // Shadow DOM inside frame - Playwright handles both
  await cardFrame.locator('[placeholder="Card number"]').fill('4242424242424242');
  await cardFrame.locator('[placeholder="MM / YY"]').fill('12/25');
  await cardFrame.locator('[placeholder="CVC"]').fill('123');
  
  await page.getByRole('button', { name: 'Pay' }).click();
});
```

### 5.9 Debugging Frame/Shadow DOM Issues

**Check if Element is in Frame:**

```javascript
// Take screenshot of main page
await page.screenshot({ path: 'main-page.png' });

// Take screenshot of frame content
const frame = page.frameLocator('iframe#payment');
await frame.locator('body').screenshot({ path: 'frame-content.png' });

// Log frame HTML
const frameHTML = await frame.locator('body').innerHTML();
console.log('Frame content:', frameHTML);
```

**Verify Frame Loaded:**

```javascript
// Check if iframe exists
const frameExists = await page.locator('iframe#payment').count();
console.log('Frame exists:', frameExists > 0);

// Check if iframe is visible
const frameVisible = await page.locator('iframe#payment').isVisible();
console.log('Frame visible:', frameVisible);

// Get iframe src
const frameSrc = await page.locator('iframe#payment').getAttribute('src');
console.log('Frame source:', frameSrc);
```

**Debug Shadow DOM:**

```javascript
// Check if element has shadow root
const hasShadowRoot = await page.evaluate(() => {
  const element = document.querySelector('custom-element');
  return element && element.shadowRoot !== null;
});
console.log('Has shadow root:', hasShadowRoot);

// Get shadow DOM content
const shadowContent = await page.evaluate(() => {
  const element = document.querySelector('custom-element');
  return element?.shadowRoot?.innerHTML;
});
console.log('Shadow content:', shadowContent);
```

**Common Issues and Solutions:**

**Issue 1: "Element not found" in frame**
```javascript
// Problem: Frame not loaded yet
await page.goto('https://example.com');
const frame = page.frameLocator('iframe');
await frame.locator('button').click();  // ❌ May fail

// Solution: Wait for frame content
await page.goto('https://example.com');
const frame = page.frameLocator('iframe');
await frame.locator('body').waitFor({ state: 'attached' });  // ✅ Wait first
await frame.locator('button').click();
```

**Issue 2: "Strict mode violation" with multiple frames**
```javascript
// Problem: Multiple iframes match selector
const frame = page.frameLocator('iframe');  // ❌ Multiple matches

// Solution: Be more specific
const frame = page.frameLocator('iframe#payment');  // ✅ Specific selector
// Or:
const frame = page.frameLocator('iframe[title="Payment"]');
// Or:
const frame = page.frameLocator('iframe').first();
```

**Issue 3: Can't find element in Shadow DOM**
```javascript
// This should work automatically, but if it doesn't:

// Make sure you're using correct selector
await page.locator('custom-element button').click();  // ✅ Correct

// Not:
await page.locator('custom-element').locator('button').click();  // Sometimes needed

// Best: Use semantic locators
await page.getByRole('button', { name: 'Click' }).click();  // ✅ Most reliable
```

### 5.10 Best Practices for Frames and Shadow DOM

**✅ DO:**

1. **Use frameLocator over legacy frame() method**
```javascript
// Good
const frame = page.frameLocator('iframe#payment');

// Avoid
const frame = page.frame('payment');
```

2. **Use semantic locators that work across boundaries**
```javascript
// Good - works through frames and shadow DOM
await frame.getByRole('button', { name: 'Submit' }).click();

// Less good - might break with shadow DOM
await frame.locator('button.submit').click();
```

3. **Wait for frames to load**
```javascript
const frame = page.frameLocator('iframe#widget');
await frame.locator('body').waitFor({ state: 'attached' });
await frame.getByRole('button').click();
```

4. **Store frame locators in variables for reuse**
```javascript
const paymentFrame = page.frameLocator('iframe#payment');
await paymentFrame.getByLabel('Card').fill('4111111111111111');
await paymentFrame.getByLabel('CVV').fill('123');
await paymentFrame.getByRole('button').click();
```

5. **Test frame content in isolation during development**
```javascript
// Navigate directly to frame URL for debugging
await page.goto('https://payment-frame-url.com');
await page.getByLabel('Card Number').fill('4111111111111111');
```

**❌ DON'T:**

1. **Don't use deprecated frame() API**
```javascript
// Deprecated
const frame = page.frame('name');
```

2. **Don't manually pierce shadow DOM (Playwright does it)**
```javascript
// Unnecessary - Playwright handles this
const shadowRoot = await page.evaluateHandle(() => 
  document.querySelector('custom-element').shadowRoot
);
```

3. **Don't forget to wait for dynamic frames**
```javascript
// Bad - may fail if frame loads slowly
await page.goto('https://example.com');
const frame = page.frameLocator('iframe');
await frame.locator('button').click();  // ❌

// Good - wait first
await page.goto('https://example.com');
await page.locator('iframe').waitFor({ state: 'attached' });
const frame = page.frameLocator('iframe');
await frame.locator('button').click();  // ✅
```

4. **Don't use complex CSS selectors for shadow DOM**
```javascript
// Works but fragile
await page.locator('app-root > #shadow > div > button').click();

// Better
await page.getByRole('button', { name: 'Submit' }).click();
```

**Performance Tips:**

```javascript
// Bad: Multiple frame queries
const frame = page.frameLocator('iframe');
await frame.locator('input').fill('text');
await page.frameLocator('iframe').locator('button').click();  // Queries frame again

// Good: Reuse frame locator
const frame = page.frameLocator('iframe');
await frame.locator('input').fill('text');
await frame.locator('button').click();  // Reuses frame reference
```

**Naming Conventions:**

```javascript
// Use descriptive names
const paymentFrame = page.frameLocator('iframe#payment');
const chatFrame = page.frameLocator('iframe#chat-widget');
const checkoutFrame = page.frameLocator('iframe[title="Checkout"]');

// Avoid generic names
const frame1 = page.frameLocator('iframe');  // Not descriptive
const f = page.frameLocator('iframe#payment');  // Too short
```

---