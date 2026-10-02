## Appendix A: Cypress Configuration

```javascript
// cypress.config.js
export default {
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 8000,
    pageLoadTimeout: 60000,
    video: true,
    screenshotOnRunFailure: true,
  }
}
```

---
