# Assignment: Playwright Advanced Scenarios

**Topics Covered:** Event Handling, Network Monitoring, Request Interception, Iframes & Shadow DOM, File Upload/Download, Dialogs, Authentication & Cookies  
**Difficulty:** Intermediate to Advanced  
**Estimated Time:** 5-7 hours  
**Reference:** `Week1-Day5-Playwright-Advanced-Scenarios.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Master Playwright event handling (console, requests, responses, popups)
- ✅ Intercept and mock network requests
- ✅ Work with iframes and Shadow DOM
- ✅ Handle file uploads and downloads
- ✅ Manage browser dialogs (alert, confirm, prompt)
- ✅ Implement authentication strategies
- ✅ Monitor and validate network performance

---

## Instructions

- Use Playwright Test with TypeScript
- Capture and handle all relevant events
- Intercept network requests where needed
- Include comprehensive assertions
- Handle edge cases and errors gracefully
- Test on provided demo applications

---

## Part A: Event Handling (25 points)

### Exercise 1: Console Event Monitoring (6 points)

Capture and analyze console messages from the browser.

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Console Event Handling', () => {
  test('should capture all console messages', async ({ page }) => {
    const consoleMessages: Array<{ type: string; text: string }> = [];
    
    // Listen to console events
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text()
      });
      console.log(`[${msg.type()}] ${msg.text()}`);
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    await page.evaluate(() => {
      console.log('Page loaded successfully');
      console.warn('This is a warning');
      console.error('This is an error');
    });
    
    // Verify messages captured
    expect(consoleMessages.length).toBeGreaterThan(0);
    
    const logMessages = consoleMessages.filter(m => m.type === 'log');
    const warnings = consoleMessages.filter(m => m.type === 'warning');
    const errors = consoleMessages.filter(m => m.type === 'error');
    
    expect(logMessages.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
    expect(errors.length).toBeGreaterThan(0);
  });

  test('should filter console errors only', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    await page.evaluate(() => {
      console.error('Critical error occurred');
    });
    
    expect(errors).toContain('Critical error occurred');
  });
});
```

**Requirements:**
- Capture all console message types
- Filter by message type (log, warn, error)
- Store messages for later analysis
- Assert specific messages were logged

---

### Exercise 2: Page Error Handling (5 points)

**Implementation:**
```typescript
test.describe('Page Error Handling', () => {
  test('should capture JavaScript errors', async ({ page }) => {
    const pageErrors: Error[] = [];
    
    page.on('pageerror', error => {
      console.error('Page error:', error.message);
      console.error('Stack:', error.stack);
      pageErrors.push(error);
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Trigger a JavaScript error
    await page.evaluate(() => {
      // @ts-ignore
      nonExistentFunction();
    });
    
    // Verify error was captured
    expect(pageErrors.length).toBeGreaterThan(0);
    expect(pageErrors[0].message).toContain('nonExistentFunction');
  });

  test('should fail test on unexpected page errors', async ({ page }) => {
    let errorOccurred = false;
    
    page.on('pageerror', error => {
      console.error('Unexpected error:', error.message);
      errorOccurred = true;
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // This test should pass (no errors)
    expect(errorOccurred).toBe(false);
  });
});
```

---

### Exercise 3: Request Event Monitoring (7 points)

**Implementation:**
```typescript
test.describe('Request Monitoring', () => {
  test('should capture all network requests', async ({ page }) => {
    const requests: Array<{ url: string; method: string }> = [];
    
    page.on('request', request => {
      requests.push({
        url: request.url(),
        method: request.method()
      });
      console.log(`→ ${request.method()} ${request.url()}`);
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    expect(requests.length).toBeGreaterThan(0);
    
    // Verify main document request
    const htmlRequest = requests.find(r => r.url().includes('todomvc'));
    expect(htmlRequest).toBeDefined();
  });

  test('should filter API requests only', async ({ page }) => {
    const apiRequests: string[] = [];
    
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        apiRequests.push(request.url());
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Trigger API call
    await page.evaluate(() => {
      fetch('/api/todos').catch(() => {});
    });
    
    await page.waitForTimeout(1000);
    
    console.log('API requests:', apiRequests);
  });

  test('should exclude analytics requests', async ({ page }) => {
    const requests: string[] = [];
    const analyticsPatterns = ['analytics', 'tracking', 'gtag', 'ga.js'];
    
    page.on('request', request => {
      const url = request.url();
      const isAnalytics = analyticsPatterns.some(pattern => url.includes(pattern));
      
      if (!isAnalytics) {
        requests.push(url);
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Verify no analytics URLs in filtered list
    requests.forEach(url => {
      analyticsPatterns.forEach(pattern => {
        expect(url).not.toContain(pattern);
      });
    });
  });
});
```

---

### Exercise 4: Response Event Monitoring (7 points)

**Implementation:**
```typescript
test.describe('Response Monitoring', () => {
  test('should capture response status codes', async ({ page }) => {
    const responses: Array<{ url: string; status: number }> = [];
    
    page.on('response', response => {
      responses.push({
        url: response.url(),
        status: response.status()
      });
      console.log(`← ${response.status()} ${response.url()}`);
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Verify successful responses
    const successResponses = responses.filter(r => r.status >= 200 && r.status < 300);
    expect(successResponses.length).toBeGreaterThan(0);
  });

  test('should detect 5xx server errors', async ({ page }) => {
    const serverErrors: Array<{ url: string; status: number }> = [];
    
    page.on('response', response => {
      if (response.status() >= 500) {
        serverErrors.push({
          url: response.url(),
          status: response.status()
        });
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Assert no server errors
    expect(serverErrors.length).toBe(0);
  });

  test('should validate response bodies', async ({ page }) => {
    const apiResponses: any[] = [];
    
    page.on('response', async response => {
      if (response.url().includes('/api/')) {
        try {
          const body = await response.json();
          apiResponses.push(body);
        } catch (e) {
          // Not JSON
        }
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    console.log('API responses:', apiResponses);
  });
});
```

---

## Part B: Network Interception & Mocking (30 points)

### Exercise 5: Request Interception (10 points)

**Implementation:**
```typescript
test.describe('Request Interception', () => {
  test('should mock API response', async ({ page }) => {
    // Mock API endpoint
    await page.route('**/api/todos', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 1, title: 'Mocked Todo 1', completed: false },
          { id: 2, title: 'Mocked Todo 2', completed: true },
          { id: 3, title: 'Mocked Todo 3', completed: false }
        ])
      });
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Verify mocked data appears
    const todos = page.locator('.todo-list li');
    await expect(todos).toHaveCount(3);
  });

  test('should modify request headers', async ({ page }) => {
    await page.route('**/*', route => {
      const headers = route.request().headers();
      route.continue({
        headers: {
          ...headers,
          'X-Custom-Header': 'test-value'
        }
      });
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
  });

  test('should simulate slow network', async ({ page }) => {
    await page.route('**/*', async route => {
      // Delay response by 2 seconds
      await new Promise(resolve => setTimeout(resolve, 2000));
      await route.continue();
    });
    
    const startTime = Date.now();
    await page.goto('https://demo.playwright.dev/todomvc');
    const loadTime = Date.now() - startTime;
    
    expect(loadTime).toBeGreaterThan(2000);
  });
});
```

---

### Exercise 6: Request Blocking (8 points)

**Implementation:**
```typescript
test.describe('Request Blocking', () => {
  test('should block image requests', async ({ page }) => {
    let blockedCount = 0;
    
    await page.route('**/*.{png,jpg,jpeg,gif,svg}', route => {
      blockedCount++;
      route.abort();
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    console.log(`Blocked ${blockedCount} image requests`);
    
    // Verify page still loads
    await expect(page.getByRole('heading')).toBeVisible();
  });

  test('should block third-party scripts', async ({ page }) => {
    const blockedDomains = ['analytics.com', 'ads.com', 'tracking.com'];
    let blockedCount = 0;
    
    await page.route('**/*', route => {
      const url = route.request().url();
      const shouldBlock = blockedDomains.some(domain => url.includes(domain));
      
      if (shouldBlock) {
        blockedCount++;
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    console.log(`Blocked ${blockedCount} third-party requests`);
  });
});
```

---

### Exercise 7: Network Performance Monitoring (12 points)

**Implementation:**
```typescript
test.describe('Network Performance', () => {
  test('should measure request timings', async ({ page }) => {
    const timings: Array<{ url: string; duration: number }> = [];
    
    page.on('response', async response => {
      const request = response.request();
      const timing = response.request().timing();
      
      if (timing) {
        const duration = timing.responseEnd - timing.requestStart;
        timings.push({
          url: request.url(),
          duration
        });
      }
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Find slowest request
    const slowest = timings.reduce((prev, current) => 
      current.duration > prev.duration ? current : prev
    , { url: '', duration: 0 });
    
    console.log(`Slowest request: ${slowest.url} (${slowest.duration}ms)`);
    
    // Flag slow requests
    const slowRequests = timings.filter(t => t.duration > 1000);
    slowRequests.forEach(req => {
      console.warn(`Slow request detected: ${req.url} (${req.duration}ms)`);
    });
  });

  test('should detect failed requests', async ({ page }) => {
    const failedRequests: string[] = [];
    
    page.on('requestfailed', request => {
      const failure = request.failure();
      console.error(`Request failed: ${request.url()}`);
      console.error(`Reason: ${failure?.errorText}`);
      failedRequests.push(request.url());
    });
    
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Trigger failed request
    await page.evaluate(() => {
      fetch('/nonexistent-endpoint').catch(() => {});
    });
    
    await page.waitForTimeout(1000);
    
    console.log('Failed requests:', failedRequests);
  });
});
```

---

## Part C: Iframes & Shadow DOM (25 points)

### Exercise 8: Iframe Interaction (10 points)

**Implementation:**
```typescript
test.describe('Iframe Handling', () => {
  test('should interact with iframe content', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/frames');
    
    // Get iframe using frameLocator
    const iframe = page.frameLocator('iframe[name="frame1"]');
    
    // Interact with elements inside iframe
    const button = iframe.getByRole('button', { name: 'Click me' });
    await button.click();
    
    // Verify interaction
    const result = iframe.getByText('Button clicked');
    await expect(result).toBeVisible();
  });

  test('should handle nested iframes', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/nested-frames');
    
    // Access nested iframe
    const outerFrame = page.frameLocator('iframe#outer');
    const innerFrame = outerFrame.frameLocator('iframe#inner');
    
    const content = innerFrame.getByText('Inner content');
    await expect(content).toBeVisible();
  });

  test('should handle missing iframe gracefully', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    
    try {
      const iframe = page.frameLocator('iframe#nonexistent');
      const element = iframe.getByRole('button');
      await expect(element).toBeVisible({ timeout: 2000 });
    } catch (error) {
      console.log('Iframe not found (expected)');
      expect(error).toBeDefined();
    }
  });
});
```

---

### Exercise 9: Shadow DOM (8 points)

**Implementation:**
```typescript
test.describe('Shadow DOM', () => {
  test('should pierce shadow DOM', async ({ page }) => {
    await page.setContent(`
      <div id="host"></div>
      <script>
        const host = document.getElementById('host');
        const shadow = host.attachShadow({ mode: 'open' });
        shadow.innerHTML = '<button id="shadow-button">Shadow Button</button>';
      </script>
    `);
    
    // Pierce shadow DOM
    const shadowButton = page.locator('#host >> button');
    await expect(shadowButton).toBeVisible();
    await shadowButton.click();
  });

  test('should work with nested shadow DOM', async ({ page }) => {
    await page.setContent(`
      <div id="outer-host"></div>
      <script>
        const outer = document.getElementById('outer-host');
        const outerShadow = outer.attachShadow({ mode: 'open' });
        outerShadow.innerHTML = '<div id="inner-host"></div>';
        
        const inner = outerShadow.getElementById('inner-host');
        const innerShadow = inner.attachShadow({ mode: 'open' });
        innerShadow.innerHTML = '<span id="deep-content">Deep Content</span>';
      </script>
    `);
    
    const deepContent = page.locator('#outer-host >> #inner-host >> span');
    await expect(deepContent).toHaveText('Deep Content');
  });
});
```

---

### Exercise 10: File Operations (7 points)

**Implementation:**
```typescript
test.describe('File Upload & Download', () => {
  test('should upload file', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/file-upload');
    
    // Create test file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content')
    });
    
    // Verify upload
    const fileName = page.locator('.file-name');
    await expect(fileName).toHaveText('test.pdf');
  });

  test('should download file', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/file-download');
    
    // Start waiting for download
    const downloadPromise = page.waitForEvent('download');
    
    // Click download button
    await page.getByRole('button', { name: 'Download' }).click();
    
    // Wait for download
    const download = await downloadPromise;
    
    // Verify filename
    expect(download.suggestedFilename()).toBe('report.csv');
    
    // Save file
    await download.saveAs(`./downloads/${download.suggestedFilename()}`);
  });

  test('should handle multiple downloads', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/file-download');
    
    const downloads: string[] = [];
    
    page.on('download', async download => {
      downloads.push(download.suggestedFilename());
      await download.saveAs(`./downloads/${download.suggestedFilename()}`);
    });
    
    // Trigger multiple downloads
    await page.getByRole('button', { name: 'Download CSV' }).click();
    await page.getByRole('button', { name: 'Download PDF' }).click();
    
    await page.waitForTimeout(2000);
    
    expect(downloads.length).toBe(2);
    console.log('Downloaded files:', downloads);
  });
});
```

---

## Part D: Dialogs & Authentication (20 points)

### Exercise 11: Dialog Handling (10 points)

**Implementation:**
```typescript
test.describe('Dialog Handling', () => {
  test('should handle alert dialog', async ({ page }) => {
    let alertMessage = '';
    
    page.on('dialog', dialog => {
      console.log(`Alert: ${dialog.message()}`);
      alertMessage = dialog.message();
      dialog.accept();
    });
    
    await page.goto('https://demo.playwright.dev/dialogs');
    await page.getByRole('button', { name: 'Show Alert' }).click();
    
    expect(alertMessage).toContain('This is an alert');
  });

  test('should handle confirm dialog', async ({ page }) => {
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('confirm');
      dialog.accept(); // or dialog.dismiss()
    });
    
    await page.goto('https://demo.playwright.dev/dialogs');
    await page.getByRole('button', { name: 'Show Confirm' }).click();
    
    const result = page.getByText('Confirmed');
    await expect(result).toBeVisible();
  });

  test('should handle prompt dialog', async ({ page }) => {
    page.on('dialog', dialog => {
      expect(dialog.type()).toBe('prompt');
      dialog.accept('Hello World');
    });
    
    await page.goto('https://demo.playwright.dev/dialogs');
    await page.getByRole('button', { name: 'Show Prompt' }).click();
    
    const result = page.getByText('Hello World');
    await expect(result).toBeVisible();
  });

  test('should dismiss dialog', async ({ page }) => {
    page.on('dialog', dialog => {
      dialog.dismiss();
    });
    
    await page.goto('https://demo.playwright.dev/dialogs');
    await page.getByRole('button', { name: 'Show Confirm' }).click();
    
    const result = page.getByText('Cancelled');
    await expect(result).toBeVisible();
  });
});
```

---

### Exercise 12: Authentication & Cookies (10 points)

**Implementation:**
```typescript
test.describe('Authentication', () => {
  test('should set authentication cookie', async ({ page, context }) => {
    // Set auth cookie
    await context.addCookies([{
      name: 'auth_token',
      value: 'test-token-123',
      domain: 'demo.playwright.dev',
      path: '/'
    }]);
    
    await page.goto('https://demo.playwright.dev/dashboard');
    
    // Verify logged in
    const userAvatar = page.getByRole('img', { name: 'User avatar' });
    await expect(userAvatar).toBeVisible();
    
    // Verify cookie exists
    const cookies = await context.cookies();
    const authCookie = cookies.find(c => c.name === 'auth_token');
    expect(authCookie).toBeDefined();
    expect(authCookie?.value).toBe('test-token-123');
  });

  test('should save and reuse storage state', async ({ browser }) => {
    // Login and save state
    const context1 = await browser.newContext();
    const page1 = await context1.newPage();
    
    await page1.goto('https://demo.playwright.dev/login');
    await page1.getByLabel('Username').fill('testuser');
    await page1.getByLabel('Password').fill('password');
    await page1.getByRole('button', { name: 'Login' }).click();
    
    // Save storage state
    await context1.storageState({ path: './auth-state.json' });
    await context1.close();
    
    // Reuse state in new context
    const context2 = await browser.newContext({
      storageState: './auth-state.json'
    });
    const page2 = await context2.newPage();
    
    await page2.goto('https://demo.playwright.dev/dashboard');
    
    // Should be logged in
    await expect(page2).toHaveURL(/dashboard/);
    
    await context2.close();
  });

  test('should handle expired auth', async ({ page }) => {
    // Set expired cookie
    await page.context().addCookies([{
      name: 'auth_token',
      value: 'expired-token',
      domain: 'demo.playwright.dev',
      path: '/',
      expires: Date.now() / 1000 - 3600 // Expired 1 hour ago
    }]);
    
    await page.goto('https://demo.playwright.dev/dashboard');
    
    // Should redirect to login
    await expect(page).toHaveURL(/login/);
  });
});
```

---

## Bonus Challenges (30 points)

### Exercise 13: Advanced Network Monitoring Dashboard (10 points)

Create a comprehensive network monitoring utility.

---

### Exercise 14: Custom Event Recorder (10 points)

Build a custom event recording system that captures all page events.

---

### Exercise 15: Performance Testing Suite (10 points)

Implement performance benchmarking for critical user flows.

---

## Submission Guidelines

1. Create folder `assignment05_yourname/`
2. Include:
   - All test files organized by topic
   - Helper utilities for event handling
   - Sample files for upload/download tests
   - Storage state examples
   - `README.md` with setup and run instructions
3. Provide test execution report
4. Include sample artifacts (traces, screenshots)

---

## Grading Rubric

- **Event Handling (25%)**: Proper event listeners and handling
- **Network Monitoring (30%)**: Interception, mocking, performance
- **Iframes & Files (25%)**: Correct iframe/shadow DOM/file handling
- **Dialogs & Auth (20%)**: Proper dialog and authentication handling

---

## Common Mistakes to Avoid

❌ Not awaiting event promises (download, popup)  
❌ Missing event listeners before navigation  
❌ Ignoring failed requests  
❌ Hardcoding auth tokens  
❌ Not cleaning up event listeners  
❌ Blocking critical resources  
❌ Not validating response bodies  
❌ Improper iframe selector usage  

---

## Tips for Success

✅ **Set up event listeners before navigation**  
✅ **Use `page.waitForEvent()` for async events**  
✅ **Validate response status and body**  
✅ **Use `frameLocator` for iframes**  
✅ **Store auth in storage state for reuse**  
✅ **Monitor network performance**  
✅ **Handle dialogs before they appear**  
✅ **Test file operations with real files**  

---

**Total Points: 100 + 30 Bonus = 130 points**

Master advanced Playwright scenarios and build robust test automation! 🎭
