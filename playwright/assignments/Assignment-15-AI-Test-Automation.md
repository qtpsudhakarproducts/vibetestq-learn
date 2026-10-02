# Assignment: AI-Powered Test Automation

**Topics Covered:** AI Test Generation, Self-Healing Tests, Visual AI Testing, Intelligent Test Selection, ML for Test Optimization  
**Difficulty:** Advanced  
**Estimated Time:** 5-6 hours  
**Reference:** `Week3-Day14-AI-Test-Automation.md`  

---

## 📋 Learning Objectives

- ✅ Implement AI-powered test generation
- ✅ Build self-healing test mechanisms
- ✅ Use visual AI for testing
- ✅ Optimize test selection with ML
- ✅ Leverage AI for test maintenance
- ✅ Explore cutting-edge testing tools

---

## Part A: AI Test Generation (25 points)

### Exercise 1: Automated Test Creation (25 points)

**Implementation:**
```typescript
import { chromium } from 'playwright';

class AITestGenerator {
  async recordUserActions(url: string): Promise<string[]> {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();
    
    const actions: string[] = [];
    
    page.on('click', (element) => {
      actions.push(`await page.click('${element.selector}')`);
    });
    
    await page.goto(url);
    
    // Record actions for 30 seconds
    await page.waitForTimeout(30000);
    
    await browser.close();
    return actions;
  }

  generateTestCode(actions: string[]): string {
    return `
test('AI Generated Test', async ({ page }) => {
  ${actions.join('\n  ')}
});
    `;
  }
}
```

---

## Part B: Self-Healing Tests (25 points)

### Exercise 2: Intelligent Selector Recovery (25 points)

**Implementation:**
```typescript
class SelfHealingLocator {
  private fallbackStrategies = [
    (text: string) => `text=${text}`,
    (text: string) => `[aria-label="${text}"]`,
    (text: string) => `[title="${text}"]`,
    (text: string) => `button:has-text("${text}")`
  ];

  async findElement(page: any, primarySelector: string, text: string) {
    try {
      return await page.locator(primarySelector);
    } catch (error) {
      console.log('Primary selector failed, trying fallbacks...');
      
      for (const strategy of this.fallbackStrategies) {
        try {
          const fallbackSelector = strategy(text);
          const element = await page.locator(fallbackSelector);
          console.log(`Found element with fallback: ${fallbackSelector}`);
          return element;
        } catch (e) {
          continue;
        }
      }
      
      throw new Error('All selector strategies failed');
    }
  }
}
```

---

## Part C: Visual AI Testing (25 points)

### Exercise 3: Visual Regression with AI (25 points)

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Visual AI Tests', () => {
  test('should detect visual changes', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Take screenshot
    await expect(page).toHaveScreenshot('homepage.png', {
      maxDiffPixels: 100,
      threshold: 0.2
    });
  });

  test('should ignore dynamic content', async ({ page }) => {
    await page.goto('https://example.com');
    
    // Mask dynamic elements
    await expect(page).toHaveScreenshot({
      mask: [page.locator('.timestamp'), page.locator('.ad')]
    });
  });
});
```

---

## Part D: Intelligent Test Selection (25 points)

### Exercise 4: ML-Based Test Optimization (25 points)

**Implementation:**
```typescript
interface TestHistory {
  testName: string;
  duration: number;
  failureRate: number;
  lastRun: Date;
  codeChanges: string[];
}

class IntelligentTestSelector {
  selectTests(allTests: TestHistory[], changedFiles: string[]): string[] {
    // Prioritize tests based on:
    // 1. Related to changed files
    // 2. High failure rate
    // 3. Not run recently
    
    return allTests
      .filter(test => 
        test.codeChanges.some(file => changedFiles.includes(file))
      )
      .sort((a, b) => b.failureRate - a.failureRate)
      .slice(0, 20) // Run top 20 most relevant tests
      .map(test => test.testName);
  }
}
```

---

## Bonus Challenges (30 points)

### Exercise 5: Complete AI Testing Framework (30 points)
Build comprehensive AI-powered testing framework.

---

**Total Points: 100 + 30 Bonus = 130 points**

Master AI-powered test automation! 🤖
