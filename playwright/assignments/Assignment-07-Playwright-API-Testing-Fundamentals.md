# Assignment: API Testing Fundamentals

**Topics Covered:** HTTP Methods, Status Codes, Headers, Authentication, Pagination, Filtering, Idempotency, Error Handling  
**Difficulty:** Beginner to Intermediate  
**Estimated Time:** 4-5 hours  
**Reference:** `Week2-Day6-Playwright-API-Testing-Fundamentals.md`  

---

## 📋 Learning Objectives

- ✅ Understand HTTP methods and their proper usage
- ✅ Master status codes and their meanings
- ✅ Implement various authentication strategies
- ✅ Handle pagination and filtering
- ✅ Test idempotency and error scenarios
- ✅ Build comprehensive API test suites

---

## Part A: HTTP Fundamentals (25 points)

### Exercise 1: HTTP Methods & Use Cases (6 points)

**Task:** Create a comprehensive guide for HTTP methods.

**Implementation:**
```typescript
interface HTTPMethod {
  method: string;
  useCase: string;
  idempotent: boolean;
  safe: boolean;
  example: string;
}

const httpMethods: HTTPMethod[] = [
  {
    method: 'GET',
    useCase: 'Retrieve resource without modification',
    idempotent: true,
    safe: true,
    example: 'GET /api/users/123 - Fetch user details'
  },
  {
    method: 'POST',
    useCase: 'Create new resource',
    idempotent: false,
    safe: false,
    example: 'POST /api/users - Create new user'
  },
  {
    method: 'PUT',
    useCase: 'Replace entire resource',
    idempotent: true,
    safe: false,
    example: 'PUT /api/users/123 - Update all user fields'
  },
  {
    method: 'PATCH',
    useCase: 'Partially update resource',
    idempotent: true,
    safe: false,
    example: 'PATCH /api/users/123 - Update specific fields'
  },
  {
    method: 'DELETE',
    useCase: 'Remove resource',
    idempotent: true,
    safe: false,
    example: 'DELETE /api/users/123 - Delete user'
  }
];

// Common Misuse Example
const methodMisuse = {
  wrong: 'Using GET to delete resources: GET /api/users/123/delete',
  why: 'GET is safe and should not modify data. Use DELETE instead.',
  correct: 'DELETE /api/users/123'
};
```

---

### Exercise 2: Status Code Reference (6 points)

**Implementation:**
```typescript
interface StatusCode {
  code: number;
  category: string;
  meaning: string;
  scenario: string;
  action: string;
}

const statusCodes: StatusCode[] = [
  // 2xx Success
  { code: 200, category: '2xx Success', meaning: 'OK', 
    scenario: 'GET request successful', action: 'Process response data' },
  { code: 201, category: '2xx Success', meaning: 'Created', 
    scenario: 'POST created new resource', action: 'Extract created resource ID' },
  { code: 204, category: '2xx Success', meaning: 'No Content', 
    scenario: 'DELETE successful', action: 'Confirm deletion' },
  
  // 4xx Client Errors
  { code: 400, category: '4xx Client Error', meaning: 'Bad Request', 
    scenario: 'Invalid request payload', action: 'Fix request data' },
  { code: 401, category: '4xx Client Error', meaning: 'Unauthorized', 
    scenario: 'Missing or invalid auth token', action: 'Provide valid authentication' },
  { code: 403, category: '4xx Client Error', meaning: 'Forbidden', 
    scenario: 'Authenticated but no permission', action: 'Check user permissions' },
  { code: 404, category: '4xx Client Error', meaning: 'Not Found', 
    scenario: 'Resource does not exist', action: 'Verify resource ID' },
  { code: 429, category: '4xx Client Error', meaning: 'Too Many Requests', 
    scenario: 'Rate limit exceeded', action: 'Implement backoff and retry' },
  
  // 5xx Server Errors
  { code: 500, category: '5xx Server Error', meaning: 'Internal Server Error', 
    scenario: 'Server-side error', action: 'Retry with exponential backoff' },
  { code: 503, category: '5xx Server Error', meaning: 'Service Unavailable', 
    scenario: 'Server overloaded or maintenance', action: 'Retry after delay' }
];
```

---

### Exercise 3: HTTP Headers (5 points)

**Implementation:**
```typescript
interface Header {
  name: string;
  purpose: string;
  example: string;
  required: boolean;
}

const commonHeaders: Header[] = [
  {
    name: 'Content-Type',
    purpose: 'Specifies the media type of the request/response body',
    example: 'Content-Type: application/json',
    required: true
  },
  {
    name: 'Authorization',
    purpose: 'Contains credentials for authentication',
    example: 'Authorization: Bearer eyJhbGc...',
    required: false
  },
  {
    name: 'Accept',
    purpose: 'Specifies acceptable response formats',
    example: 'Accept: application/json',
    required: false
  },
  {
    name: 'User-Agent',
    purpose: 'Identifies the client application',
    example: 'User-Agent: Playwright/1.40.0',
    required: false
  },
  {
    name: 'Cache-Control',
    purpose: 'Directives for caching mechanisms',
    example: 'Cache-Control: no-cache',
    required: false
  }
];

// Missing Content-Type Impact
const missingContentType = {
  impact: 'Server may not parse request body correctly',
  result: 'Could return 400 Bad Request or parse as wrong format',
  solution: 'Always include Content-Type header for requests with body'
};
```

---

### Exercise 4: Authentication Strategies (8 points)

**Implementation:**
```typescript
// Basic Authentication
const basicAuth = {
  type: 'Basic',
  format: 'Basic base64(username:password)',
  example: 'Authorization: Basic dXNlcjpwYXNz',
  useCase: 'Simple authentication, less secure',
  implementation: `
    const credentials = Buffer.from('user:pass').toString('base64');
    headers: { 'Authorization': \`Basic \${credentials}\` }
  `
};

// Bearer Token
const bearerAuth = {
  type: 'Bearer',
  format: 'Bearer <token>',
  example: 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  useCase: 'JWT tokens, OAuth 2.0',
  implementation: `
    headers: { 'Authorization': \`Bearer \${token}\` }
  `
};

// API Key
const apiKeyAuth = {
  type: 'API Key',
  format: 'X-API-Key: <key> or as query parameter',
  example: 'X-API-Key: abc123xyz',
  useCase: 'Service-to-service authentication',
  implementation: `
    headers: { 'X-API-Key': apiKey }
    // or
    params: { api_key: apiKey }
  `
};

// Invalid Auth Examples
const invalidAuth = [
  { case: 'Missing token', header: 'Authorization: Bearer', status: 401 },
  { case: 'Expired token', header: 'Authorization: Bearer expired_token', status: 401 },
  { case: 'Wrong format', header: 'Authorization: InvalidFormat token', status: 401 }
];
```

---

## Part B: Practical API Testing (30 points)

### Exercise 5: Complete CRUD Implementation (30 points)

**Implementation:**
```typescript
import { test, expect } from '@playwright/test';

const BASE_URL = 'https://jsonplaceholder.typicode.com';

interface User {
  id?: number;
  name: string;
  email: string;
  username: string;
}

test.describe('Complete CRUD Operations', () => {
  let createdUserId: number;

  test('CREATE - POST new user', async ({ request }) => {
    const newUser: User = {
      name: 'Test User',
      email: 'test@example.com',
      username: 'testuser'
    };

    const response = await request.post(`${BASE_URL}/users`, {
      data: newUser
    });

    expect(response.status()).toBe(201);
    
    const created: User = await response.json();
    createdUserId = created.id!;
    
    expect(created.name).toBe(newUser.name);
    expect(created.email).toBe(newUser.email);
    
    console.log(`Created user ID: ${createdUserId}`);
  });

  test('READ - GET user', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users/1`);
    
    expect(response.status()).toBe(200);
    
    const user: User = await response.json();
    expect(user.id).toBe(1);
    expect(user).toHaveProperty('name');
    expect(user).toHaveProperty('email');
  });

  test('READ - GET with 404', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users/99999`);
    expect(response.status()).toBe(404);
  });

  test('UPDATE - PUT user', async ({ request }) => {
    const updatedUser: User = {
      id: 1,
      name: 'Updated Name',
      email: 'updated@example.com',
      username: 'updated'
    };

    const response = await request.put(`${BASE_URL}/users/1`, {
      data: updatedUser
    });

    expect(response.status()).toBe(200);
    
    const updated: User = await response.json();
    expect(updated.name).toBe(updatedUser.name);
  });

  test('DELETE - Remove user', async ({ request }) => {
    const response = await request.delete(`${BASE_URL}/users/1`);
    expect(response.status()).toBe(200);
  });

  test('Pagination - Fetch multiple pages', async ({ request }) => {
    const page1 = await request.get(`${BASE_URL}/users?_page=1&_limit=5`);
    const page2 = await request.get(`${BASE_URL}/users?_page=2&_limit=5`);

    const users1: User[] = await page1.json();
    const users2: User[] = await page2.json();

    expect(users1.length).toBeLessThanOrEqual(5);
    expect(users2.length).toBeLessThanOrEqual(5);

    // Verify no duplicates
    const ids1 = users1.map(u => u.id);
    const ids2 = users2.map(u => u.id);
    const duplicates = ids1.filter(id => ids2.includes(id));
    
    expect(duplicates.length).toBe(0);
  });

  test('Filtering - Query by parameter', async ({ request }) => {
    const response = await request.get(`${BASE_URL}/users?username=Bret`);
    
    const users: User[] = await response.json();
    
    if (users.length === 0) {
      console.log('No users found with this filter (expected for some filters)');
    } else {
      users.forEach(user => {
        expect(user.username).toContain('Bret');
      });
    }
  });
});
```

---

## Part C: Advanced Concepts (25 points)

### Exercise 6: Idempotency Testing (10 points)

**Implementation:**
```typescript
test.describe('Idempotency Tests', () => {
  test('PUT is idempotent', async ({ request }) => {
    const updateData = { name: 'Same Name' };

    // First PUT
    const response1 = await request.put(`${BASE_URL}/users/1`, {
      data: updateData
    });
    const result1 = await response1.json();

    // Second PUT with same data
    const response2 = await request.put(`${BASE_URL}/users/1`, {
      data: updateData
    });
    const result2 = await response2.json();

    // Results should be identical
    expect(result1.name).toBe(result2.name);
    console.log('PUT is idempotent - same result on multiple calls');
  });

  test('POST is NOT idempotent', async ({ request }) => {
    const newData = { name: 'New User', email: 'new@test.com' };

    // First POST
    const response1 = await request.post(`${BASE_URL}/users`, {
      data: newData
    });
    const result1 = await response1.json();

    // Second POST with same data
    const response2 = await request.post(`${BASE_URL}/users`, {
      data: newData
    });
    const result2 = await response2.json();

    // Different IDs (in real API)
    console.log('POST is NOT idempotent - creates multiple resources');
  });

  test('DELETE is idempotent', async ({ request }) => {
    // First DELETE
    const response1 = await request.delete(`${BASE_URL}/users/1`);
    expect(response1.status()).toBe(200);

    // Second DELETE (resource already deleted)
    const response2 = await request.delete(`${BASE_URL}/users/1`);
    // Should still return success or 404
    expect([200, 404]).toContain(response2.status());
  });
});
```

---

### Exercise 7: Error Handling & Rate Limiting (15 points)

**Implementation:**
```typescript
interface ErrorResponse {
  code: number;
  message: string;
  details?: any;
  timestamp: Date;
}

async function handleRateLimit(request: any, url: string, maxRetries: number = 3) {
  let retryCount = 0;
  let delay = 2000; // Start with 2 seconds

  while (retryCount < maxRetries) {
    const response = await request.get(url);

    if (response.status() === 429) {
      console.log(`Rate limited. Retry ${retryCount + 1}/${maxRetries} in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff: 2s → 4s → 8s
      retryCount++;
    } else {
      return response;
    }
  }

  throw new Error('Max retries exceeded for rate limit');
}

test.describe('Error Handling', () => {
  test('should handle 401 Unauthorized', async ({ request }) => {
    const response = await request.get('https://httpbin.org/bearer');
    
    const error: ErrorResponse = {
      code: response.status(),
      message: 'Unauthorized - Missing or invalid token',
      timestamp: new Date()
    };

    expect(error.code).toBe(401);
    console.log('Error response:', JSON.stringify(error, null, 2));
  });

  test('should implement token refresh on 401', async ({ request }) => {
    // Simulate token refresh workflow
    const refreshToken = async () => {
      // Call refresh endpoint
      const response = await request.post('https://httpbin.org/post', {
        data: { refresh_token: 'old_token' }
      });
      return 'new_token';
    };

    // If 401, refresh and retry
    let response = await request.get('https://httpbin.org/bearer');
    
    if (response.status() === 401) {
      console.log('Token expired, refreshing...');
      const newToken = await refreshToken();
      
      // Retry with new token
      response = await request.get('https://httpbin.org/bearer', {
        headers: { 'Authorization': `Bearer ${newToken}` }
      });
    }
  });
});
```

---

## Part D: Test Utilities & Reporting (20 points)

### Exercise 8: API Test Utilities (20 points)

**Implementation:**
```typescript
class APITestUtilities {
  private baseURL: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Logging utility
  logRequest(method: string, url: string, status: number, duration: number) {
    const log = {
      method,
      url,
      status,
      durationMs: duration,
      timestamp: new Date().toISOString()
    };
    console.log(JSON.stringify(log));
  }

  // Validate response schema
  validateSchema(data: any, requiredFields: string[]): boolean {
    return requiredFields.every(field => data.hasOwnProperty(field));
  }

  // Timeout strategy
  async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = 5000
  ): Promise<T> {
    const timeout = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
    });

    return Promise.race([promise, timeout]);
  }

  // Retry logic
  async retry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        if (i === maxRetries - 1) throw error;
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }
    throw new Error('Max retries exceeded');
  }
}
```

---

## Bonus Challenges (30 points)

### Exercise 9: API Health Monitor (15 points)
Build a comprehensive health monitoring system for API endpoints.

### Exercise 10: Performance Benchmarking (15 points)
Create performance benchmarks for critical API endpoints.

---

## Submission Guidelines

1. Create folder `assignment07_yourname/`
2. Include all test files and utilities
3. Provide comprehensive README
4. Include sample test reports

---

## Grading Rubric

- **HTTP Fundamentals (30%)**: Correct understanding of methods, status codes
- **Implementation (30%)**: Working CRUD and error handling
- **Advanced Concepts (25%)**: Idempotency, rate limiting
- **Code Quality (15%)**: Clean, reusable utilities

---

## Common Mistakes to Avoid

❌ Confusing PUT and PATCH  
❌ Not handling 429 rate limits  
❌ Missing Content-Type headers  
❌ No retry logic for 5xx errors  
❌ Ignoring idempotency  

---

## Tips for Success

✅ Understand HTTP method semantics  
✅ Always validate response schemas  
✅ Implement proper error handling  
✅ Use exponential backoff for retries  
✅ Log all API interactions  

---

**Total Points: 100 + 30 Bonus = 130 points**

Master API testing fundamentals! 🚀
