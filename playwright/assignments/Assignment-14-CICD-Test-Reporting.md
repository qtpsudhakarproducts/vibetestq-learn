# Assignment: CI/CD & Test Reporting

**Topics Covered:** GitHub Actions, Jenkins, Test Reports, Allure, HTML Reports, Slack Notifications, Test Metrics  
**Difficulty:** Intermediate to Advanced  
**Estimated Time:** 4-5 hours  
**Reference:** `Week3-Day13-CICD-Test-Reporting.md`  

---

## 📋 Learning Objectives

- ✅ Set up CI/CD pipelines for test automation
- ✅ Generate comprehensive test reports
- ✅ Implement test notifications
- ✅ Track test metrics and trends
- ✅ Integrate with reporting tools
- ✅ Build automated testing workflows

---

## Part A: GitHub Actions (25 points)

### Exercise 1: CI Pipeline (25 points)

**.github/workflows/tests.yml:**
```yaml
name: Test Automation
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        browser: [chromium, firefox, webkit]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=${{ matrix.browser }}
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Part B: Test Reporting (25 points)

### Exercise 2: HTML & Allure Reports (25 points)

**playwright.config.ts:**
```typescript
export default defineConfig({
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['allure-playwright']
  ]
});
```

---

## Part C: Notifications (25 points)

### Exercise 3: Slack Integration (25 points)

**Implementation:**
```typescript
async function sendSlackNotification(results: any) {
  const webhook = process.env.SLACK_WEBHOOK_URL;
  
  await fetch(webhook, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `Test Results: ${results.passed}/${results.total} passed`
    })
  });
}
```

---

## Part D: Metrics & Dashboards (25 points)

### Exercise 4: Test Metrics (25 points)

**Implementation:**
```typescript
interface TestMetrics {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  passRate: number;
}

function calculateMetrics(results: any[]): TestMetrics {
  return {
    totalTests: results.length,
    passed: results.filter(r => r.status === 'passed').length,
    failed: results.filter(r => r.status === 'failed').length,
    skipped: results.filter(r => r.status === 'skipped').length,
    duration: results.reduce((sum, r) => sum + r.duration, 0),
    passRate: (results.filter(r => r.status === 'passed').length / results.length) * 100
  };
}
```

---

## Bonus Challenges (30 points)

### Exercise 5: Complete CI/CD Pipeline (30 points)
Build end-to-end CI/CD pipeline with all integrations.

---

**Total Points: 100 + 30 Bonus = 130 points**

Master CI/CD for test automation! 🚀
