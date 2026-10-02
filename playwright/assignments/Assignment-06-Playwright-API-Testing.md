# Assignment: Playwright API Testing

**Topics Covered:** APIRequestContext, HTTP Methods, Headers & Auth, Request/Response Validation, Test Data Management, Environment Configuration, Negative Testing  
**Difficulty:** Intermediate to Advanced  
**Estimated Time:** 5-6 hours  
**Reference:** `Week2-Day6-Playwright-API-Testing.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Master Playwright's APIRequestContext for API testing
- ✅ Test all HTTP methods (GET, POST, PUT, PATCH, DELETE)
- ✅ Implement authentication and authorization testing
- ✅ Validate request/response schemas
- ✅ Handle test data lifecycle
- ✅ Implement comprehensive error handling
- ✅ Build reusable API test utilities

---

## Instructions

- Use Playwright's `request.newContext()` for API calls
- Define TypeScript interfaces for all request/response bodies
- Include comprehensive negative test cases
- Implement proper test data cleanup
- Use environment variables for configuration
- Test against JSONPlaceholder or similar public API

---

## Part A: API Fundamentals (25 points)

### Exercise 1: APIRequestContext Setup (6 points)

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = process.env.API_BASE_URL || 'https://jsonplaceholder.typicode.com';

test.describe('API Request Context', () => {
  test('should create request context and make GET call', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    
    expect(response.ok()).toBeTruthy();
    expect(response.status()).toBe(200);
    
    const data = await response.json();
    console.log('Response:', data);
    
    expect(data).toHaveProperty('id');
    expect(data).toHaveProperty('title');
    expect(data).toHaveProperty('body');
  });

  test('should handle non-2xx responses', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`);
    
    if (!response.ok()) {
      console.error(`Error: ${response.status()} ${response.statusText()}`);
    }
    
    expect(response.status()).toBe(404);
  });
});
```

---

### Exercise 2: HTTP Methods (7 points)

**Implementation:**
```typescript
interface Post {
  id?: number;
  title: string;
  body: string;
  userId: number;
}

test.describe('HTTP Methods', () => {
  let createdPostId: number;

  test('GET - should fetch resource', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    expect(response.status()).toBe(200);
    
    const post: Post = await response.json();
    expect(post.id).toBe(1);
  });

  test('POST - should create resource', async ({ request }) => {
    const newPost: Post = {
      title: 'Test Post',
      body: 'Test Body',
      userId: 1
    };

    const response = await request.post(`${BASE_URL}/posts`, {
      data: newPost
    });

    expect(response.status()).toBe(201);
    
    const created: Post = await response.json();
    createdPostId = created.id!;
    
    expect(created.title).toBe(newPost.title);
    expect(created.body).toBe(newPost.body);
  });

  test('PUT - should update entire resource', async ({ request }) => {
    const updatedPost: Post = {
      id: 1,
      title: 'Updated Title',
      body: 'Updated Body',
      userId: 1
    };

    const response = await request.put(`${BASE_URL}/posts/1`, {
      data: updatedPost
    });

    expect(response.status()).toBe(200);
    
    const updated: Post = await response.json();
    expect(updated.title).toBe(updatedPost.title);
  });

  test('PATCH - should partially update resource', async ({ request }) => {
    const response = await request.patch(`${BASE_URL}/posts/1`, {
      data: { title: 'Patched Title' }
    });

    expect(response.status()).toBe(200);
    
    const patched: Post = await response.json();
    expect(patched.title).toBe('Patched Title');
  });

  test('DELETE - should remove resource', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/posts/1`);
    expect(response.status()).toBe(200);
  });
});
```

---

### Exercise 3: Headers & Authentication (6 points)

**Implementation:**
```typescript
test.describe('Headers and Authentication', () => {
  test('should send custom headers', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'test-value',
        'User-Agent': 'Playwright-Test'
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should send Bearer token', async ({ request }) => {
    const token = 'test-token-123';
    
    const response = await request.get(`${BASE_URL}/posts`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    expect(response.ok()).toBeTruthy();
  });

  test('should handle missing authentication', async ({ request }) => {
    // Simulate protected endpoint
    const response = await request.get('https://httpbin.org/bearer', {
      headers: {
        // No Authorization header
      }
    });

    expect(response.status()).toBe(401);
  });

  test('should handle invalid token', async ({ request }) => {
    const response = await request.get('https://httpbin.org/bearer', {
      headers: {
        'Authorization': 'Bearer invalid-token'
      }
    });

    expect(response.status()).toBe(401);
  });
});
```

---

### Exercise 4: Request Validation (6 points)

**Implementation:**
```typescript
interface CreateUserRequest {
  name: string;
  email: string;
  age?: number;
}

function validateUserRequest(data: CreateUserRequest): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.name || data.name.trim().length === 0) {
    errors.push('Name is required');
  }

  if (!data.email || !data.email.includes('@')) {
    errors.push('Valid email is required');
  }

  if (data.age !== undefined && data.age < 0) {
    errors.push('Age must be positive');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

test.describe('Request Validation', () => {
  test('should validate and send valid payload', async ({ request }) => {
    const userData: CreateUserRequest = {
      name: 'John Doe',
      email: 'john@example.com',
      age: 30
    };

    const validation = validateUserRequest(userData);
    expect(validation.valid).toBeTruthy();

    const response = await request.post(`${BASE_URL}/users`, {
      data: userData
    });

    expect(response.status()).toBe(201);
  });

  test('should reject invalid payload', async () => {
    const invalidData: CreateUserRequest = {
      name: '',
      email: 'invalid-email'
    };

    const validation = validateUserRequest(invalidData);
    expect(validation.valid).toBeFalsy();
    expect(validation.errors).toContain('Name is required');
    expect(validation.errors).toContain('Valid email is required');
  });
});
```

---

## Part B: Advanced API Testing (30 points)

### Exercise 5: Test Data Management (8 points)

**Implementation:**
```typescript
class TestDataManager {
  private createdResources: Array<{ type: string; id: number }> = [];

  async createPost(request: any, data: Post): Promise<Post> {
    const response = await request.post(`${BASE_URL}/posts`, { data });
    const created: Post = await response.json();
    
    this.createdResources.push({ type: 'post', id: created.id! });
    return created;
  }

  async cleanup(request: any): Promise<void> {
    console.log(`Cleaning up ${this.createdResources.length} resources`);
    
    for (const resource of this.createdResources) {
      try {
        await request.delete(`${BASE_URL}/${resource.type}s/${resource.id}`);
        console.log(`Deleted ${resource.type} ${resource.id}`);
      } catch (error) {
        console.error(`Failed to delete ${resource.type} ${resource.id}`);
      }
    }
    
    this.createdResources = [];
  }
}

test.describe('Test Data Management', () => {
  let dataManager: TestDataManager;

  test.beforeEach(() => {
    dataManager = new TestDataManager();
  });

  test.afterEach(async ({ request }) => {
    await dataManager.cleanup(request);
  });

  test('should create and cleanup test data', async ({ request }) => {
    const post = await dataManager.createPost(request, {
      title: 'Test',
      body: 'Body',
      userId: 1
    });

    expect(post.id).toBeDefined();
    // Cleanup happens in afterEach
  });
});
```

---

### Exercise 6: Query Parameters & Pagination (10 points)

**Implementation:**
```typescript
test.describe('Query Parameters and Pagination', () => {
  test('should filter with query params', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`, {
      params: {
        userId: 1
      }
    });

    const posts: Post[] = await response.json();
    
    console.log(`Found ${posts.length} posts for userId=1`);
    
    posts.forEach(post => {
      expect(post.userId).toBe(1);
    });
  });

  test('should handle pagination', async ({ request }) => {
    const page1 = await request.get(`${BASE_URL}/posts`, {
      params: { _page: 1, _limit: 10 }
    });

    const page2 = await request.get(`${BASE_URL}/posts`, {
      params: { _page: 2, _limit: 10 }
    });

    const posts1: Post[] = await page1.json();
    const posts2: Post[] = await page2.json();

    console.log(`Page 1 IDs: ${posts1.map(p => p.id).join(',')}`);
    console.log(`Page 2 IDs: ${posts2.map(p => p.id).join(',')}`);

    // Verify no duplicates
    const ids1 = new Set(posts1.map(p => p.id));
    const ids2 = new Set(posts2.map(p => p.id));
    
    const intersection = [...ids1].filter(id => ids2.has(id));
    expect(intersection.length).toBe(0);
  });

  test('should handle empty results', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`, {
      params: { userId: 99999 }
    });

    const posts: Post[] = await response.json();
    
    if (posts.length === 0) {
      console.log('No posts found for this user (expected)');
    }
    
    expect(Array.isArray(posts)).toBeTruthy();
  });
});
```

---

### Exercise 7: Error Handling & Retry Logic (12 points)

**Implementation:**
```typescript
interface APIError {
  status: number;
  statusText: string;
  message: string;
  timestamp: Date;
}

async function makeRequestWithRetry(
  request: any,
  url: string,
  options: any = {},
  maxRetries: number = 3
): Promise<any> {
  let lastError: APIError | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const response = await request.get(url, options);
      
      if (response.ok()) {
        return response;
      }

      // Retry on 5xx errors
      if (response.status() >= 500 && attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed with ${response.status()}, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }

      // Don't retry on 4xx errors
      if (response.status() >= 400 && response.status() < 500) {
        throw {
          status: response.status(),
          statusText: response.statusText(),
          message: 'Client error - not retrying',
          timestamp: new Date()
        };
      }

      return response;
    } catch (error) {
      lastError = error as APIError;
      if (attempt === maxRetries) {
        throw lastError;
      }
    }
  }

  throw lastError;
}

test.describe('Error Handling', () => {
  test('should handle 404 errors', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/99999`);
    
    expect(response.status()).toBe(404);
    
    const error: APIError = {
      status: response.status(),
      statusText: response.statusText(),
      message: 'Resource not found',
      timestamp: new Date()
    };
    
    console.log('Structured error:', JSON.stringify(error, null, 2));
  });

  test('should retry on server errors', async ({ request }) => {
    // This would retry on 5xx errors
    try {
      await makeRequestWithRetry(request, 'https://httpbin.org/status/500');
    } catch (error) {
      console.log('Failed after retries:', error);
      expect(error).toBeDefined();
    }
  });

  test('should not retry on client errors', async ({ request }) => {
    try {
      await makeRequestWithRetry(request, `${BASE_URL}/invalid-endpoint`);
    } catch (error) {
      const apiError = error as APIError;
      expect(apiError.status).toBe(404);
      expect(apiError.message).toContain('not retrying');
    }
  });
});
```

---

## Part C: Schema Validation & Contract Testing (25 points)

### Exercise 8: Response Schema Validation (15 points)

**Implementation:**
```typescript
interface PostSchema {
  id: number;
  title: string;
  body: string;
  userId: number;
}

function validatePostSchema(data: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (typeof data.id !== 'number') errors.push('id must be number');
  if (typeof data.title !== 'string') errors.push('title must be string');
  if (typeof data.body !== 'string') errors.push('body must be string');
  if (typeof data.userId !== 'number') errors.push('userId must be number');

  return { valid: errors.length === 0, errors };
}

test.describe('Schema Validation', () => {
  test('should validate response schema', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts/1`);
    const data = await response.json();

    const validation = validatePostSchema(data);
    
    expect(validation.valid).toBeTruthy();
    if (!validation.valid) {
      console.error('Schema validation errors:', validation.errors);
    }
  });

  test('should validate array response schema', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/posts`);
    const posts: any[] = await response.json();

    posts.slice(0, 5).forEach((post, index) => {
      const validation = validatePostSchema(post);
      expect(validation.valid).toBeTruthy();
    });
  });
});
```

---

### Exercise 9: Security Testing (10 points)

**Implementation:**
```typescript
test.describe('API Security Tests', () => {
  test('should require authentication', async ({ request }) => {
    const response = await request.get('https://httpbin.org/bearer');
    expect(response.status()).toBe(401);
  });

  test('should validate token format', async ({ request }) => {
    const response = await request.get('https://httpbin.org/bearer', {
      headers: { 'Authorization': 'InvalidFormat' }
    });
    expect(response.status()).toBe(401);
  });

  test('should handle SQL injection attempts', async ({ request }) => {
    const maliciousInput = "1' OR '1'='1";
    const response = await request.get(`${BASE_URL}/posts`, {
      params: { userId: maliciousInput }
    });
    
    // Should handle safely
    expect([200, 400]).toContain(response.status());
  });
});
```

---

## Part D: Performance & Reporting (20 points)

### Exercise 10: Performance Monitoring (10 points)

**Implementation:**
```typescript
interface PerformanceMetrics {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: Date;
}

class APIPerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];

  async measureRequest(
    request: any,
    method: string,
    url: string,
    options: any = {}
  ): Promise<any> {
    const start = Date.now();
    
    let response;
    if (method === 'GET') {
      response = await request.get(url, options);
    } else if (method === 'POST') {
      response = await request.post(url, options);
    }
    
    const duration = Date.now() - start;
    
    this.metrics.push({
      endpoint: url,
      method,
      status: response.status(),
      duration,
      timestamp: new Date()
    });
    
    if (duration > 1000) {
      console.warn(`Slow request: ${url} took ${duration}ms`);
    }
    
    return response;
  }

  getReport(): string {
    const avgDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0) / this.metrics.length;
    
    return `
Performance Report:
- Total Requests: ${this.metrics.length}
- Average Duration: ${avgDuration.toFixed(2)}ms
- Slowest: ${Math.max(...this.metrics.map(m => m.duration))}ms
- Fastest: ${Math.min(...this.metrics.map(m => m.duration))}ms
    `.trim();
  }
}
```

---

### Exercise 11: Test Reporting (10 points)

**Implementation:**
```typescript
interface TestResult {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  passed: boolean;
  error?: string;
}

class APITestReporter {
  private results: TestResult[] = [];

  addResult(result: TestResult) {
    this.results.push(result);
  }

  generateReport(): string {
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;

    let report = `
API Test Report
===============
Total Tests: ${this.results.length}
Passed: ${passed}
Failed: ${failed}
Pass Rate: ${((passed / this.results.length) * 100).toFixed(2)}%

Details:
`;

    this.results.forEach(result => {
      const status = result.passed ? '✓' : '✗';
      report += `${status} ${result.method} ${result.endpoint} - ${result.status} (${result.duration}ms)\n`;
      if (result.error) {
        report += `  Error: ${result.error}\n`;
      }
    });

    return report;
  }
}
```

---

## Bonus Challenges (30 points)

### Exercise 12: API Test Framework (15 points)
Build a reusable API testing framework with base classes and utilities.

### Exercise 13: Contract Testing Suite (15 points)
Implement comprehensive contract testing for a REST API.

---

## Submission Guidelines

1. Create folder `assignment06_yourname/`
2. Include:
   - All test files
   - Utilities and helpers
   - Environment configuration
   - Test data files
   - README with setup instructions
3. Provide test execution report

---

## Grading Rubric

- **API Coverage (30%)**: All HTTP methods tested
- **Validation (25%)**: Schema and error validation
- **Error Handling (20%)**: Comprehensive error scenarios
- **Code Quality (15%)**: TypeScript types, organization
- **Performance (10%)**: Monitoring and reporting

---

## Common Mistakes to Avoid

❌ Only checking status codes  
❌ Hardcoding URLs and tokens  
❌ No test data cleanup  
❌ Missing negative tests  
❌ Not validating response schemas  
❌ Ignoring performance metrics  

---

## Tips for Success

✅ Use TypeScript interfaces for all payloads  
✅ Implement proper test data lifecycle  
✅ Validate both request and response schemas  
✅ Monitor API performance  
✅ Test all error scenarios  
✅ Use environment variables for configuration  

---

**Total Points: 100 + 30 Bonus = 130 points**

Master API testing with Playwright! 🚀
