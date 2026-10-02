## Appendix C: Playwright Configuration for Locators

**playwright.config.ts:**

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    // Custom test ID attribute
    testIdAttribute: 'data-testid',
    
    // Timeouts
    actionTimeout: 30000,
    navigationTimeout: 30000,
    
    // Auto-waiting
    waitForLoadState: 'domcontentloaded',
    
    // Screenshots
    screenshot: 'only-on-failure',
    
    // Video
    video: 'retain-on-failure',
    
    // Trace
    trace: 'on-first-retry',
  },
  
  // Assertion timeout
  expect: {
    timeout: 5000,
  },
  
  // Global timeout
  timeout: 60000,
});
```

---