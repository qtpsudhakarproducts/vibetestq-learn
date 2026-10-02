# Assignment: Async JavaScript & Node.js

**Topics Covered:** Sync vs Async, Callbacks, Promises, async/await, Error Handling, Event Loop, Node Fundamentals, Modules, File System, npm, Environment Variables  
**Difficulty:** Intermediate  
**Estimated Time:** 5-7 hours  
**Reference:** `Week1-Day2-Async-JavaScript-Node.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Master asynchronous JavaScript patterns
- ✅ Understand the event loop and execution order
- ✅ Work with Promises and async/await effectively
- ✅ Handle errors in asynchronous code
- ✅ Build Node.js applications with proper module structure
- ✅ Manage environment configuration
- ✅ Work with the file system asynchronously

---

## Instructions

- Use TypeScript for all code exercises
- Compile and test your code: `tsc filename.ts && node filename.js`
- Label console outputs clearly with timestamps where relevant
- Use `async/await` unless a task specifically asks for callbacks or promises
- Handle all errors and invalid inputs gracefully
- Follow Node.js best practices

---

## Part A: Async Fundamentals (30 points)

### Exercise 1: Sync vs Async Demonstrator (8 points)
Create a program that demonstrates the difference between synchronous and asynchronous execution.

**Implementation:**
```typescript
// Synchronous example
function syncOperation(n: number): number {
  console.log(`[SYNC] Starting calculation for ${n}`);
  let result = 0;
  for (let i = 0; i < n; i++) {
    result += i;
  }
  console.log(`[SYNC] Finished calculation: ${result}`);
  return result;
}

// Asynchronous example
async function asyncOperation(n: number): Promise<number> {
  console.log(`[ASYNC] Starting calculation for ${n}`);
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = 0;
      for (let i = 0; i < n; i++) {
        result += i;
      }
      console.log(`[ASYNC] Finished calculation: ${result}`);
      resolve(result);
    }, 100);
  });
}

// Demonstrate blocking vs non-blocking
async function demonstrateBlocking(): Promise<void> {
  console.log("=== SYNCHRONOUS (Blocking) ===");
  const start1 = Date.now();
  syncOperation(1000000);
  syncOperation(1000000);
  console.log(`Total time: ${Date.now() - start1}ms\n`);
  
  console.log("=== ASYNCHRONOUS (Non-blocking) ===");
  const start2 = Date.now();
  await Promise.all([
    asyncOperation(1000000),
    asyncOperation(1000000)
  ]);
  console.log(`Total time: ${Date.now() - start2}ms`);
}
```

**Requirements:**
- Implement both sync and async versions
- Measure and compare execution times
- Demonstrate parallel execution with async
- Explain 3 key differences in comments
- Include one case where async is NOT needed (e.g., simple calculations)

**Expected Output:**
```
=== SYNCHRONOUS (Blocking) ===
[SYNC] Starting calculation for 1000000
[SYNC] Finished calculation: 499999500000
[SYNC] Starting calculation for 1000000
[SYNC] Finished calculation: 499999500000
Total time: 45ms

=== ASYNCHRONOUS (Non-blocking) ===
[ASYNC] Starting calculation for 1000000
[ASYNC] Starting calculation for 1000000
[ASYNC] Finished calculation: 499999500000
[ASYNC] Finished calculation: 499999500000
Total time: 105ms (but non-blocking!)

When async is NOT needed:
- Simple mathematical calculations
- Data transformations without I/O
- Synchronous array operations
```

---

### Exercise 2: Callback Pattern & Callback Hell (8 points)
Demonstrate callback patterns and the callback hell problem.

**Implementation:**
```typescript
// Basic callback pattern
type Callback<T> = (error: Error | null, result?: T) => void;

function fetchUser(userId: number, callback: Callback<{ id: number; name: string }>): void {
  setTimeout(() => {
    if (userId <= 0) {
      callback(new Error("Invalid user ID"));
    } else {
      callback(null, { id: userId, name: "Alice" });
    }
  }, 500);
}

function fetchPosts(userId: number, callback: Callback<string[]>): void {
  setTimeout(() => {
    callback(null, ["Post 1", "Post 2", "Post 3"]);
  }, 500);
}

function fetchComments(postId: string, callback: Callback<string[]>): void {
  setTimeout(() => {
    callback(null, ["Comment 1", "Comment 2"]);
  }, 500);
}

// Callback hell example
function callbackHellExample(): void {
  console.log("=== CALLBACK HELL ===");
  fetchUser(1, (err1, user) => {
    if (err1) {
      console.error("Error fetching user:", err1);
      return;
    }
    console.log("User:", user);
    
    fetchPosts(user!.id, (err2, posts) => {
      if (err2) {
        console.error("Error fetching posts:", err2);
        return;
      }
      console.log("Posts:", posts);
      
      fetchComments(posts![0], (err3, comments) => {
        if (err3) {
          console.error("Error fetching comments:", err3);
          return;
        }
        console.log("Comments:", comments);
        // This is callback hell - the pyramid of doom!
      });
    });
  });
}

// Promise-based solution
function fetchUserPromise(userId: number): Promise<{ id: number; name: string }> {
  return new Promise((resolve, reject) => {
    fetchUser(userId, (err, result) => {
      if (err) reject(err);
      else resolve(result!);
    });
  });
}

// Implement fetchPostsPromise and fetchCommentsPromise
// Then create an async/await version that's clean and readable
```

**Requirements:**
- Implement all callback functions
- Create callback hell example (3+ levels deep)
- Convert to Promise-based functions
- Create async/await version
- Explain why callback hell is problematic (2-3 sentences)

---

### Exercise 3: Promise States & Lifecycle (7 points)
Create a comprehensive demonstration of Promise states.

**Implementation:**
```typescript
type PromiseState = 'pending' | 'fulfilled' | 'rejected';

interface PromiseDemo {
  name: string;
  state: PromiseState;
  value?: any;
  reason?: Error;
}

class PromiseStateTracker {
  private demos: PromiseDemo[] = [];
  
  // Pending promise example
  createPendingPromise(): Promise<string> {
    const promise = new Promise<string>((resolve) => {
      // Never resolves - stays pending
      console.log("Promise created - State: pending");
    });
    
    this.demos.push({
      name: "API Call in Progress",
      state: 'pending',
      value: undefined
    });
    
    return promise;
  }
  
  // Fulfilled promise example
  createFulfilledPromise(): Promise<string> {
    const promise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.log("Promise resolved - State: fulfilled");
        resolve("Data received successfully");
      }, 1000);
    });
    
    return promise;
  }
  
  // Rejected promise example
  createRejectedPromise(): Promise<string> {
    const promise = new Promise<string>((_, reject) => {
      setTimeout(() => {
        console.log("Promise rejected - State: rejected");
        reject(new Error("Network timeout"));
      }, 1000);
    });
    
    return promise;
  }
  
  // Real-world examples
  async demonstrateRealWorldScenarios(): Promise<void> {
    // Pending: Waiting for API response
    console.log("\n=== PENDING ===");
    console.log("Real-world: API call in flight, user sees loading spinner");
    
    // Fulfilled: Successful API response
    console.log("\n=== FULFILLED ===");
    try {
      const data = await this.createFulfilledPromise();
      console.log("Real-world: API returned data, display to user");
      console.log("Value:", data);
    } catch (e) {
      // Won't execute
    }
    
    // Rejected: Failed API response
    console.log("\n=== REJECTED ===");
    try {
      await this.createRejectedPromise();
    } catch (error) {
      console.log("Real-world: API failed, show error message to user");
      console.log("Reason:", (error as Error).message);
    }
  }
}
```

**Requirements:**
- Demonstrate all 3 promise states
- Provide real-world examples for each state
- Show how to handle each state
- Include error reasons for rejected promises
- Test with actual promise executions

---

### Exercise 4: Async/Await vs Then Chains (7 points)
Compare and convert between .then() chains and async/await.

**Implementation:**
```typescript
// Mock API functions
function fetchUserData(id: number): Promise<{ id: number; name: string; email: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id, name: "John Doe", email: "john@example.com" });
    }, 500);
  });
}

function fetchUserOrders(userId: number): Promise<string[]> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(["Order-1", "Order-2", "Order-3"]);
    }, 500);
  });
}

function fetchOrderDetails(orderId: string): Promise<{ id: string; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ id: orderId, total: 99.99 });
    }, 500);
  });
}

// Using .then() chains
function getUserOrdersThen(userId: number): Promise<void> {
  console.log("=== USING .then() CHAINS ===");
  return fetchUserData(userId)
    .then((user) => {
      console.log("User:", user.name);
      return fetchUserOrders(user.id);
    })
    .then((orders) => {
      console.log("Orders:", orders);
      return fetchOrderDetails(orders[0]);
    })
    .then((details) => {
      console.log("First order total:", details.total);
    })
    .catch((error) => {
      console.error("Error:", error.message);
    })
    .finally(() => {
      console.log("Cleanup complete");
    });
}

// Using async/await
async function getUserOrdersAsync(userId: number): Promise<void> {
  console.log("\n=== USING ASYNC/AWAIT ===");
  try {
    const user = await fetchUserData(userId);
    console.log("User:", user.name);
    
    const orders = await fetchUserOrders(user.id);
    console.log("Orders:", orders);
    
    const details = await fetchOrderDetails(orders[0]);
    console.log("First order total:", details.total);
  } catch (error) {
    console.error("Error:", (error as Error).message);
  } finally {
    console.log("Cleanup complete");
  }
}

// Benefits comparison
function explainBenefits(): void {
  console.log("\n=== ASYNC/AWAIT BENEFITS ===");
  console.log("1. More readable - looks like synchronous code");
  console.log("2. Easier debugging - better stack traces");
  console.log("3. Simpler error handling - standard try/catch");
  console.log("4. Better IDE support - autocomplete works better");
  console.log("5. Easier to add conditional logic");
}
```

**Requirements:**
- Implement both .then() and async/await versions
- Ensure identical functionality
- Include error handling in both
- Use finally block in both
- List at least 3 benefits of async/await
- Test both implementations

---

## Part B: Event Loop & Execution Order (25 points)

### Exercise 5: Event Loop Visualizer (10 points)
Create a program that demonstrates event loop behavior.

**Implementation:**
```typescript
class EventLoopDemo {
  private logs: Array<{ time: number; message: string; type: string }> = [];
  
  logExecution(message: string, type: string): void {
    this.logs.push({
      time: Date.now(),
      message,
      type
    });
    console.log(`[${type}] ${message}`);
  }
  
  demonstrateEventLoop(): void {
    console.log("=== EVENT LOOP DEMONSTRATION ===\n");
    
    // Synchronous code
    this.logExecution("1. Synchronous code - Call Stack", "SYNC");
    
    // setTimeout (Macrotask)
    setTimeout(() => {
      this.logExecution("4. setTimeout 0ms - Macrotask Queue", "MACRO");
    }, 0);
    
    // Promise (Microtask)
    Promise.resolve().then(() => {
      this.logExecution("3. Promise.then - Microtask Queue", "MICRO");
    });
    
    // More synchronous code
    this.logExecution("2. More synchronous code - Call Stack", "SYNC");
    
    // Nested microtasks
    Promise.resolve().then(() => {
      this.logExecution("3a. First microtask", "MICRO");
      Promise.resolve().then(() => {
        this.logExecution("3b. Nested microtask", "MICRO");
      });
    });
    
    // setTimeout with delay
    setTimeout(() => {
      this.logExecution("5. setTimeout 100ms - Macrotask Queue", "MACRO");
    }, 100);
    
    // setImmediate (Node.js specific)
    setImmediate(() => {
      this.logExecution("6. setImmediate - Check Queue", "IMMEDIATE");
    });
    
    // process.nextTick (Node.js specific - highest priority)
    process.nextTick(() => {
      this.logExecution("2a. process.nextTick - Next Tick Queue", "NEXTTICK");
    });
  }
  
  explainEventLoop(): void {
    console.log("\n=== EVENT LOOP EXPLANATION ===");
    console.log("Execution Order:");
    console.log("1. Call Stack (synchronous code)");
    console.log("2. Next Tick Queue (process.nextTick)");
    console.log("3. Microtask Queue (Promises)");
    console.log("4. Macrotask Queue (setTimeout, setInterval)");
    console.log("5. Check Queue (setImmediate)");
    console.log("\nKey Concepts:");
    console.log("- Microtasks run BEFORE macrotasks");
    console.log("- All microtasks run before next macrotask");
    console.log("- process.nextTick has highest priority");
  }
}
```

**Requirements:**
- Demonstrate all queue types
- Show execution order clearly
- Explain microtask vs macrotask
- Include nested promises
- Test and verify output order

---

### Exercise 6: Promise Combinators (15 points)
Implement and compare all Promise combinator methods.

**Implementation:**
```typescript
// Mock async operations with different behaviors
function fastOperation(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("Fast result"), 100);
  });
}

function slowOperation(): Promise<string> {
  return new Promise((resolve) => {
    setTimeout(() => resolve("Slow result"), 1000);
  });
}

function failingOperation(): Promise<string> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error("Operation failed")), 500);
  });
}

class PromiseCombinators {
  // Promise.all - waits for all, fails fast
  async demonstrateAll(): Promise<void> {
    console.log("\n=== Promise.all ===");
    console.log("Use case: Need ALL results, fail if ANY fails");
    
    try {
      const start = Date.now();
      const results = await Promise.all([
        fastOperation(),
        slowOperation(),
        fastOperation()
      ]);
      console.log("Results:", results);
      console.log(`Time: ${Date.now() - start}ms`);
    } catch (error) {
      console.error("Failed:", (error as Error).message);
    }
    
    // With failure
    try {
      await Promise.all([
        fastOperation(),
        failingOperation(),
        slowOperation()
      ]);
    } catch (error) {
      console.log("Promise.all rejects immediately on first failure");
      console.error("Error:", (error as Error).message);
    }
  }
  
  // Promise.race - returns first settled (resolved or rejected)
  async demonstrateRace(): Promise<void> {
    console.log("\n=== Promise.race ===");
    console.log("Use case: Need FIRST result, timeout implementation");
    
    const start = Date.now();
    const result = await Promise.race([
      fastOperation(),
      slowOperation()
    ]);
    console.log("Winner:", result);
    console.log(`Time: ${Date.now() - start}ms (only waited for fastest)`);
    
    // Timeout implementation
    const timeout = (ms: number): Promise<never> => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error("Timeout")), ms);
      });
    };
    
    try {
      await Promise.race([
        slowOperation(),
        timeout(200)
      ]);
    } catch (error) {
      console.log("Timeout triggered:", (error as Error).message);
    }
  }
  
  // Promise.allSettled - waits for all, never rejects
  async demonstrateAllSettled(): Promise<void> {
    console.log("\n=== Promise.allSettled ===");
    console.log("Use case: Need ALL results, including failures");
    
    const results = await Promise.allSettled([
      fastOperation(),
      failingOperation(),
      slowOperation()
    ]);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        console.log(`Operation ${index + 1}: Success - ${result.value}`);
      } else {
        console.log(`Operation ${index + 1}: Failed - ${result.reason.message}`);
      }
    });
  }
  
  // Promise.any - returns first fulfilled, ignores rejections
  async demonstrateAny(): Promise<void> {
    console.log("\n=== Promise.any ===");
    console.log("Use case: Need FIRST successful result");
    
    try {
      const result = await Promise.any([
        failingOperation(),
        slowOperation(),
        fastOperation()
      ]);
      console.log("First success:", result);
    } catch (error) {
      console.log("All failed:", error);
    }
  }
  
  // Comparison table
  printComparison(): void {
    console.log("\n=== COMBINATOR COMPARISON ===");
    console.log("┌─────────────────┬──────────────────┬─────────────────┬──────────────┐");
    console.log("│ Method          │ Resolves When    │ Rejects When    │ Use Case     │");
    console.log("├─────────────────┼──────────────────┼─────────────────┼──────────────┤");
    console.log("│ Promise.all     │ All fulfill      │ Any rejects     │ Need all     │");
    console.log("│ Promise.race    │ First settles    │ First rejects   │ Timeout      │");
    console.log("│ Promise.allSet  │ All settle       │ Never           │ Batch jobs   │");
    console.log("│ Promise.any     │ First fulfills   │ All reject      │ Fallbacks    │");
    console.log("└─────────────────┴──────────────────┴─────────────────┴──────────────┘");
  }
}
```

**Requirements:**
- Implement all 4 combinator demonstrations
- Show success and failure cases for each
- Measure execution times
- Provide real-world use cases
- Create comparison table

---

## Part C: Node.js Fundamentals (30 points)

### Exercise 7: Module System & Project Structure (10 points)
Create a well-structured Node.js project with proper modules.

**File Structure:**
```
project/
├── src/
│   ├── utils/
│   │   ├── math.ts
│   │   ├── string.ts
│   │   └── validators.ts
│   ├── services/
│   │   ├── userService.ts
│   │   └── apiService.ts
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── package.json
├── tsconfig.json
└── .env
```

**Implementation:**

**src/utils/math.ts:**
```typescript
export function add(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error("Both arguments must be numbers");
  }
  return a + b;
}

export function subtract(a: number, b: number): number {
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error("Both arguments must be numbers");
  }
  return a - b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Cannot divide by zero");
  }
  return a / b;
}

// Default export
export default {
  add,
  subtract,
  multiply,
  divide
};
```

**src/utils/validators.ts:**
```typescript
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidEnv(env: string): env is 'dev' | 'qa' | 'staging' | 'prod' {
  return ['dev', 'qa', 'staging', 'prod'].includes(env);
}
```

**src/types/index.ts:**
```typescript
export interface User {
  id: number;
  name: string;
  email: string;
}

export interface Config {
  env: 'dev' | 'qa' | 'staging' | 'prod';
  apiURL: string;
  timeout: number;
  retries: number;
}

export type Environment = Config['env'];
```

**src/index.ts:**
```typescript
import mathUtils from './utils/math';
import { isValidEmail, isValidEnv } from './utils/validators';
import type { Config } from './types';

// Demonstrate module usage
console.log("=== MODULE SYSTEM DEMO ===");
console.log("Math operations:");
console.log("5 + 3 =", mathUtils.add(5, 3));
console.log("10 - 4 =", mathUtils.subtract(10, 4));

console.log("\nValidations:");
console.log("test@example.com is valid:", isValidEmail("test@example.com"));
console.log("invalid-email is valid:", isValidEmail("invalid-email"));
```

**Requirements:**
- Create all module files
- Use both named and default exports
- Implement proper type definitions
- Add input validation
- Test all modules

---

### Exercise 8: File System Operations (10 points)
Implement comprehensive file system utilities.

**Implementation:**
```typescript
import { promises as fs } from 'fs';
import path from 'path';

interface FileStats {
  path: string;
  size: number;
  created: Date;
  modified: Date;
  isDirectory: boolean;
}

class FileSystemManager {
  // Read file with error handling
  async readFile(filePath: string): Promise<string> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      console.log(`✓ Read file: ${filePath}`);
      return content;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      } else if ((error as NodeJS.ErrnoException).code === 'EACCES') {
        throw new Error(`Permission denied: ${filePath}`);
      }
      throw error;
    }
  }
  
  // Write file with directory creation
  async writeFile(filePath: string, content: string): Promise<void> {
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, content, 'utf-8');
      console.log(`✓ Wrote file: ${filePath}`);
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }
  
  // Write JSON with formatting
  async writeJSON(filePath: string, data: any): Promise<void> {
    const content = JSON.stringify(data, null, 2);
    await this.writeFile(filePath, content);
  }
  
  // Read JSON with parsing
  async readJSON<T>(filePath: string): Promise<T> {
    const content = await this.readFile(filePath);
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      throw new Error(`Invalid JSON in file: ${filePath}`);
    }
  }
  
  // Get file stats
  async getFileStats(filePath: string): Promise<FileStats> {
    try {
      const stats = await fs.stat(filePath);
      return {
        path: filePath,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime,
        isDirectory: stats.isDirectory()
      };
    } catch (error) {
      throw new Error(`Cannot get stats for: ${filePath}`);
    }
  }
  
  // List directory contents
  async listDirectory(dirPath: string): Promise<string[]> {
    try {
      const files = await fs.readdir(dirPath);
      console.log(`✓ Listed directory: ${dirPath}`);
      return files;
    } catch (error) {
      throw new Error(`Cannot list directory: ${dirPath}`);
    }
  }
  
  // Delete file with confirmation
  async deleteFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
      console.log(`✓ Deleted file: ${filePath}`);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.log(`File already deleted: ${filePath}`);
      } else {
        throw error;
      }
    }
  }
}

// Test the file system manager
async function testFileSystem(): Promise<void> {
  const fsManager = new FileSystemManager();
  
  // Write test file
  await fsManager.writeFile('test/sample.txt', 'Hello, World!');
  
  // Read test file
  const content = await fsManager.readFile('test/sample.txt');
  console.log("File content:", content);
  
  // Write JSON
  await fsManager.writeJSON('test/data.json', {
    name: "Test",
    timestamp: new Date(),
    count: 42
  });
  
  // Read JSON
  const data = await fsManager.readJSON('test/data.json');
  console.log("JSON data:", data);
  
  // Get stats
  const stats = await fsManager.getFileStats('test/sample.txt');
  console.log("File stats:", stats);
}
```

**Requirements:**
- Implement all file operations
- Handle all common errors (ENOENT, EACCES, etc.)
- Create directories if they don't exist
- Support JSON read/write
- Add retry logic for transient errors

---

### Exercise 9: Environment Configuration (10 points)
Create a robust configuration management system.

**Implementation:**
```typescript
import * as dotenv from 'dotenv';
import { isValidEnv, isValidURL } from './utils/validators';

interface AppConfig {
  env: 'dev' | 'qa' | 'staging' | 'prod';
  apiURL: string;
  apiKey: string;
  timeout: number;
  retries: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  features: {
    enableCache: boolean;
    enableMetrics: boolean;
  };
}

class ConfigManager {
  private config: AppConfig;
  
  constructor() {
    // Load .env file
    dotenv.config();
    
    // Build configuration with validation
    this.config = this.buildConfig();
  }
  
  private buildConfig(): AppConfig {
    const env = this.getEnv('NODE_ENV', 'dev');
    
    if (!isValidEnv(env)) {
      throw new Error(`Invalid environment: ${env}`);
    }
    
    const apiURL = this.getEnv('API_URL', this.getDefaultAPIURL(env));
    
    if (!isValidURL(apiURL)) {
      throw new Error(`Invalid API URL: ${apiURL}`);
    }
    
    return {
      env,
      apiURL,
      apiKey: this.getEnv('API_KEY', ''),
      timeout: this.getNumber('TIMEOUT', 30000),
      retries: this.getNumber('RETRIES', 3),
      logLevel: this.getEnv('LOG_LEVEL', 'info') as AppConfig['logLevel'],
      features: {
        enableCache: this.getBoolean('ENABLE_CACHE', true),
        enableMetrics: this.getBoolean('ENABLE_METRICS', false)
      }
    };
  }
  
  private getEnv(key: string, defaultValue: string): string {
    const value = process.env[key];
    if (value === undefined || value === '') {
      console.log(`Using default for ${key}: ${defaultValue}`);
      return defaultValue;
    }
    return value;
  }
  
  private getNumber(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    const num = parseInt(value, 10);
    if (isNaN(num)) {
      console.warn(`Invalid number for ${key}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return num;
  }
  
  private getBoolean(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (value === undefined || value === '') {
      return defaultValue;
    }
    return value.toLowerCase() === 'true';
  }
  
  private getDefaultAPIURL(env: string): string {
    const urls = {
      dev: 'http://localhost:3000',
      qa: 'https://api-qa.example.com',
      staging: 'https://api-staging.example.com',
      prod: 'https://api.example.com'
    };
    return urls[env as keyof typeof urls];
  }
  
  getConfig(): Readonly<AppConfig> {
    return Object.freeze({ ...this.config });
  }
  
  printConfig(): void {
    console.log("=== APPLICATION CONFIGURATION ===");
    console.log(JSON.stringify(this.config, null, 2));
  }
}

// CLI argument parser
class CLIParser {
  private args: Map<string, string> = new Map();
  
  constructor() {
    this.parseArgs();
  }
  
  private parseArgs(): void {
    const args = process.argv.slice(2);
    
    for (const arg of args) {
      if (arg.startsWith('--')) {
        const [key, value] = arg.substring(2).split('=');
        this.args.set(key, value || 'true');
      }
    }
  }
  
  get(key: string, defaultValue: string = ''): string {
    return this.args.get(key) || defaultValue;
  }
  
  has(key: string): boolean {
    return this.args.has(key);
  }
  
  printArgs(): void {
    console.log("=== CLI ARGUMENTS ===");
    this.args.forEach((value, key) => {
      console.log(`${key}: ${value}`);
    });
  }
}
```

**Requirements:**
- Load environment variables from .env
- Provide defaults for all config values
- Validate configuration values
- Support CLI argument overrides
- Handle type conversions (string, number, boolean)
- Print configuration on startup

---

## Part D: Error Handling & Best Practices (15 points)

### Exercise 10: Comprehensive Error Handling (15 points)
Implement a robust error handling system.

**Implementation:**
```typescript
// Custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

class NetworkError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
    this.name = 'NetworkError';
  }
}

class RetryableError extends Error {
  constructor(message: string, public retryAfter: number) {
    super(message);
    this.name = 'RetryableError';
  }
}

// Error handler with retry logic
class ErrorHandler {
  async withRetry<T>(
    fn: () => Promise<T>,
    maxRetries: number = 3,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        
        console.log(`Attempt ${attempt} failed: ${lastError.message}`);
        
        if (attempt === maxRetries) {
          throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
        }
        
        // Exponential backoff
        const delay = delayMs * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }
  
  handleError(error: Error): void {
    if (error instanceof ValidationError) {
      console.error(`Validation Error in field '${error.field}': ${error.message}`);
    } else if (error instanceof NetworkError) {
      console.error(`Network Error (${error.statusCode}): ${error.message}`);
    } else if (error instanceof RetryableError) {
      console.error(`Retryable Error: ${error.message} (retry after ${error.retryAfter}ms)`);
    } else {
      console.error(`Unexpected Error: ${error.message}`);
      console.error(error.stack);
    }
  }
}

// Demonstrate error handling
async function demonstrateErrorHandling(): Promise<void> {
  const handler = new ErrorHandler();
  
  // Validation error
  try {
    throw new ValidationError("Email format is invalid", "email");
  } catch (error) {
    handler.handleError(error as Error);
  }
  
  // Network error with retry
  let attempt = 0;
  try {
    await handler.withRetry(async () => {
      attempt++;
      if (attempt < 3) {
        throw new NetworkError("Connection timeout", 504);
      }
      return "Success!";
    });
  } catch (error) {
    handler.handleError(error as Error);
  }
}
```

**Requirements:**
- Create custom error classes
- Implement retry logic with exponential backoff
- Handle different error types appropriately
- Log errors with context
- Demonstrate all error scenarios

---

## Bonus Challenges (30 points)

### Exercise 11: Test Data Generator (10 points)
Create a test data generation system.

```typescript
interface TestUser {
  id: string;
  name: string;
  email: string;
  age: number;
  role: 'admin' | 'user' | 'guest';
}

class TestDataGenerator {
  generateUser(overrides?: Partial<TestUser>): TestUser {
    // Generate realistic test data
    // Support overrides
  }
  
  generateUsers(count: number): TestUser[] {
    // Generate multiple users
  }
}
```

---

### Exercise 12: Performance Monitor (10 points)
Build a performance monitoring utility.

```typescript
class PerformanceMonitor {
  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    // Measure execution time
    // Log performance metrics
  }
  
  generateReport(): string {
    // Generate performance report
  }
}
```

---

### Exercise 13: Async Queue Processor (10 points)
Implement a concurrent task queue.

```typescript
class AsyncQueue {
  async process<T>(tasks: Array<() => Promise<T>>, concurrency: number): Promise<T[]> {
    // Process tasks with limited concurrency
    // Return all results
  }
}
```

---

## Submission Guidelines

1. Create folder `assignment02_yourname/`
2. Organize files:
   - `async-fundamentals.ts`
   - `event-loop.ts`
   - `node-modules/` (folder with all modules)
   - `file-system.ts`
   - `config-manager.ts`
   - `error-handling.ts`
   - `bonus-challenges.ts` (if attempted)
3. Include:
   - `package.json` with all dependencies
   - `tsconfig.json`
   - `.env.example` (template)
   - `README.md` with run instructions
4. Ensure all files compile: `tsc --strict`
5. Test all functionality

---

## Grading Rubric

- **Correctness (40%)**: Proper async behavior and Node.js usage
  - Async patterns (15%)
  - Error handling (15%)
  - Node.js APIs (10%)

- **Code Quality (30%)**: Clean, maintainable code
  - Type safety (10%)
  - Code organization (10%)
  - Best practices (10%)

- **Completeness (20%)**: All tasks attempted
  - Main exercises (15%)
  - Bonus challenges (5%)

- **Documentation (10%)**: Clear explanations
  - Code comments (5%)
  - README quality (5%)

---

## Common Mistakes to Avoid

❌ Not awaiting promises (floating promises)  
❌ Swallowing errors silently (empty catch blocks)  
❌ Using sync FS APIs in async flows (`fs.readFileSync`)  
❌ Hardcoding environment values  
❌ Not handling promise rejections  
❌ Mixing callbacks and promises  
❌ Not using try/catch with async/await  
❌ Forgetting to create directories before writing files  
❌ Not validating environment variables  
❌ Using `any` type for errors

---

## Tips for Success

✅ Always use async/await over .then() chains  
✅ Use Promise.all for parallel operations  
✅ Implement exponential backoff for retries  
✅ Validate all environment variables on startup  
✅ Create custom error classes for different scenarios  
✅ Use fs/promises instead of callback-based fs  
✅ Test both success and failure paths  
✅ Use defaults for optional configuration  
✅ Log execution times for performance monitoring  
✅ Use TypeScript strict mode  
✅ Handle all error codes (ENOENT, EACCES, etc.)  
✅ Use process.nextTick sparingly  
✅ Understand the event loop execution order

---

## Quick Reference

### Async Patterns
```typescript
// Sequential
const a = await op1();
const b = await op2();

// Parallel
const [a, b] = await Promise.all([op1(), op2()]);

// Race
const first = await Promise.race([op1(), op2()]);
```

### Error Handling
```typescript
// Async/await
try {
  await operation();
} catch (error) {
  console.error(error);
}

// Promise
operation()
  .catch(error => console.error(error));
```

### File System
```typescript
import { promises as fs } from 'fs';

await fs.readFile('file.txt', 'utf-8');
await fs.writeFile('file.txt', 'content');
await fs.mkdir('dir', { recursive: true });
```

---

**Total Points: 100 + 30 Bonus = 130 points**

Master async JavaScript and build robust Node.js applications! ⚡
