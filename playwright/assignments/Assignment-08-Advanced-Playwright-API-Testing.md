# Assignment: Advanced Playwright API Testing

**Topics Covered:** Contract Testing, Performance Testing, Security Testing, Rate Limiting, Caching, Observability, API Versioning  
**Difficulty:** Advanced  
**Estimated Time:** 5-6 hours  
**Reference:** `Week2-Day7-Advanced-Playwright-API-Testing.md`  

---

## 📋 Learning Objectives

- ✅ Implement contract testing for APIs
- ✅ Perform performance and load testing
- ✅ Test API security and authentication
- ✅ Handle rate limiting and caching
- ✅ Implement observability and tracing
- ✅ Test API versioning strategies

---

## Part A: Contract Testing (25 points)

### Exercise 1: Schema Validation (25 points)

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

interface OrderSchema {
  id: number;
  status: 'pending' | 'completed' | 'cancelled';
  total: number;
  items: Array<{
    id: number;
    name: string;
    quantity: number;
    price: number;
  }>;
  createdAt: string;
}

function validateOrderSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data.id !== 'number') errors.push('id must be number');
  if (!['pending', 'completed', 'cancelled'].includes(data.status)) {
    errors.push('status must be valid enum');
  }
  if (typeof data.total !== 'number') errors.push('total must be number');
  if (!Array.isArray(data.items)) errors.push('items must be array');

  return { valid: errors.length === 0, errors };
}

test('should validate order contract', async ({ request }) => {
  const response = await request.get('https://api.example.com/orders/1');
  const order = await response.json();

  const validation = validateOrderSchema(order);
  expect(validation.valid).toBeTruthy();
});
```

---

## Part B: Performance Testing (25 points)

### Exercise 2: Performance Budgets (25 points)

**Implementation:**
```typescript
class PerformanceTester {
  private budget: number = 2000; // 2 seconds

  async testPerformance(request: any, url: string): Promise<void> {
    const start = Date.now();
    const response = await request.get(url);
    const duration = Date.now() - start;

    console.log(`Duration: ${duration}ms`);

    if (duration > this.budget) {
      console.error(`BUDGET FAIL: ${duration}ms > ${this.budget}ms`);
    } else {
      console.log(`PASS: ${duration}ms <= ${this.budget}ms`);
    }

    expect(duration).toBeLessThan(this.budget);
  }

  async loadTest(request: any, url: string, iterations: number = 10): Promise<void> {
    const durations: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      await request.get(url);
      durations.push(Date.now() - start);
    }

    const avg = durations.reduce((a, b) => a + b) / durations.length;
    const p95 = durations.sort((a, b) => a - b)[Math.floor(durations.length * 0.95)];

    console.log(`Average: ${avg.toFixed(2)}ms`);
    console.log(`P95: ${p95}ms`);
  }
}
```

---

## Part C: Security Testing (25 points)

### Exercise 3: Security Test Suite (25 points)

**Implementation:**
```typescript
test.describe('API Security Tests', () => {
  test('should require authentication', async ({ request }) => {
    const response = await request.get('https://api.example.com/secure');
    expect(response.status()).toBe(401);
  });

  test('should validate token expiry', async ({ request }) => {
    const expiredToken = 'expired-token';
    const response = await request.get('https://api.example.com/secure', {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    expect(response.status()).toBe(401);
  });

  test('should enforce role-based access', async ({ request }) => {
    const userToken = 'user-token';
    const response = await request.get('https://api.example.com/admin', {
      headers: { 'Authorization': `Bearer ${userToken}` }
    });
    expect(response.status()).toBe(403);
  });
});
```

---

## Part D: Observability (25 points)

### Exercise 4: Tracing & Monitoring (25 points)

**Implementation:**
```typescript
interface RequestLog {
  requestId: string;
  method: string;
  url: string;
  status: number;
  durationMs: number;
  timestamp: string;
}

class APIObservability {
  private logs: RequestLog[] = [];

  async logRequest(
    request: any,
    method: string,
    url: string
  ): Promise<void> {
    const requestId = crypto.randomUUID();
    const start = Date.now();

    const response = await request.get(url, {
      headers: { 'X-Correlation-Id': requestId }
    });

    const log: RequestLog = {
      requestId,
      method,
      url,
      status: response.status(),
      durationMs: Date.now() - start,
      timestamp: new Date().toISOString()
    };

    this.logs.push(log);
    console.log(JSON.stringify(log));
  }

  generateReport(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}
```

---

## Bonus Challenges (30 points)

### Exercise 5: Complete API Test Framework (30 points)
Build a comprehensive API testing framework with all advanced features.

---

## Grading Rubric

- **Contract Testing (25%)**: Schema validation
- **Performance (25%)**: Load testing, budgets
- **Security (25%)**: Auth, authorization tests
- **Observability (25%)**: Logging, tracing

---

**Total Points: 100 + 30 Bonus = 130 points**

Master advanced API testing! 🚀
