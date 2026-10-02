# Assignment: QE Fundamentals & TypeScript

**Topics Covered:** Quality Engineering, Manual vs Automation, Test Pyramid, Environment Setup, JS Recap, TypeScript Foundations, Functions/Interfaces/Classes, Arrays & Destructuring, Debugging, Practice drills  
**Difficulty:** Beginner to Intermediate  
**Estimated Time:** 4-6 hours  
**Reference:** `Week1-Day1-QE-Fundamentals-TypeScript.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Understand the difference between QE and QA
- ✅ Apply the Test Pyramid principle to real scenarios
- ✅ Master TypeScript fundamentals for test automation
- ✅ Create type-safe test utilities and helpers
- ✅ Build a foundation for modern test automation
- ✅ Implement practical QE workflows

---

## Instructions

- Use TypeScript for all code exercises
- Compile and run your code to verify correctness (`tsc filename.ts && node filename.js`)
- Use clear labels for printed outputs
- Include reasoning and explanations as comments
- Validate inputs and handle edge cases
- Follow TypeScript best practices (avoid `any`, use proper types)

---

## Part A: QE Foundations (25 points)

### Exercise 1: QE vs QA Comparison Table (6 points)
Create a comprehensive comparison between Quality Engineering and Quality Assurance.

**Task:** Write a detailed comparison covering at least 6 dimensions:

**Format your answer as:**
```
| Dimension      | Quality Engineering (QE)           | Quality Assurance (QA)              |
|----------------|-----------------------------------|-------------------------------------|
| Focus          | [Your answer]                     | [Your answer]                       |
| Timing         | [Your answer]                     | [Your answer]                       |
| Ownership      | [Your answer]                     | [Your answer]                       |
| Tooling        | [Your answer]                     | [Your answer]                       |
| Metrics        | [Your answer]                     | [Your answer]                       |
| Mindset        | [Your answer]                     | [Your answer]                       |
```

**Additional Questions:**
1. List 3 scenarios where manual QA is still required (and explain why automation isn't suitable)
2. Explain the concept of "shift-left testing" in 2-3 sentences
3. Why is QE considered a team responsibility while QA is often a dedicated role?

**Example Answer:**
```
Manual QA Still Required:
1. Usability Testing - Requires human judgment on user experience, subjective evaluation
2. Visual Design Review - Aesthetic decisions need human perception
3. Exploratory Testing - Creative thinking to find unexpected edge cases

Shift-left: Moving testing activities earlier in the development lifecycle, 
enabling developers to catch defects during coding rather than after deployment.
```

---

### Exercise 2: Manual vs Automation Decision Matrix (6 points)

**Task:** For each of the following 8 test scenarios, decide whether it should be **Manual**, **Automation**, or **Hybrid**. Provide detailed justification (minimum 2 reasons per decision).

**Test Scenarios:**
1. Login functionality (executed 1000+ times/day across regression)
2. Exploratory testing for a new checkout feature
3. API endpoint validation (50+ REST endpoints)
4. Visual design review for marketing landing page
5. Regression suite (500+ existing test cases)
6. Accessibility compliance testing (WCAG 2.1)
7. Performance testing under load (1000 concurrent users)
8. User acceptance testing with stakeholders

**Format your answer as:**
```
Scenario 1: Login functionality
Decision: [Manual/Automation/Hybrid]
Justification:
  - Reason 1: [Your reasoning]
  - Reason 2: [Your reasoning]
  - ROI: [Estimated time/cost savings]
  - Recommended Tools: [If automation, suggest tools]
```

**Evaluation Criteria:**
- Consider: frequency, complexity, ROI, stability, human judgment required
- Calculate ROI where applicable
- Suggest specific tools for automation scenarios

---

### Exercise 3: Test Pyramid Design (7 points)

**Task:** Design a test pyramid for a **login + checkout flow** application.

**Requirements:**
1. Propose specific test cases for each layer:
   - **Unit Tests** (60%): At least 6 test cases
   - **Integration Tests** (20%): At least 3 test cases
   - **API Tests** (15%): At least 2 test cases
   - **UI Tests** (5%): At least 1 test case

2. For each test case, specify:
   - Test name
   - What it validates
   - Estimated execution time
   - Why it belongs in that layer

3. Answer these questions:
   - Why is the 60:20:15:5 ratio optimal?
   - What happens if you have too many UI tests?
   - Why should unit tests be the foundation?
   - When would you violate the pyramid (anti-pattern)?

**Example Format:**
```
UNIT TESTS (60% - Fast, Isolated, Many)
1. validateEmailFormat()
   - Validates: Email regex pattern matching
   - Execution: <1ms
   - Why Unit: Pure function, no dependencies

2. calculateTotalPrice()
   - Validates: Price calculation with tax and discount
   - Execution: <1ms
   - Why Unit: Business logic, deterministic

[Continue with more...]

INTEGRATION TESTS (20% - Medium Speed, Component Interaction)
1. authServiceIntegration()
   - Validates: Auth service returns valid JWT token
   - Execution: ~100ms
   - Why Integration: Tests service interaction

[Continue...]

API TESTS (15% - Medium Speed, Contract Validation)
[Your tests...]

UI TESTS (5% - Slow, End-to-End, Critical Paths Only)
[Your tests...]

ANALYSIS:
- Total tests: [count]
- Total execution time: [estimate]
- Why this ratio is optimal: [explanation]
- Why NOT add more UI tests: [explanation]
```

---

### Exercise 4: QE Responsibilities & Tools Matrix (6 points)

**Task:** Create a comprehensive matrix of QE responsibilities mapped to tools and skills.

**Requirements:**
1. List at least 8 QE responsibilities
2. For each responsibility, specify:
   - Description
   - Required tools (2-3 per responsibility)
   - Skill level (Beginner/Intermediate/Advanced)
   - Frequency (Daily/Weekly/Monthly)
   - Category (Testing/Automation/CI-CD/Metrics)

**Format:**
```
| Responsibility          | Description                    | Tools                        | Skill Level  | Frequency | Category    |
|------------------------|--------------------------------|------------------------------|--------------|-----------|-------------|
| Automated UI Testing   | Create E2E test suites         | Playwright, Cypress          | Intermediate | Daily     | Automation  |
| API Testing            | [Your description]             | [Your tools]                 | [Level]      | [Freq]    | [Category]  |
| [Add 6 more...]        |                                |                              |              |           |             |
```

**Include responsibilities for:**
- UI automation
- API testing
- Unit testing
- CI/CD pipeline management
- Test reporting
- Code quality analysis
- Performance testing
- Security testing (bonus)

---

## Part B: Environment & TypeScript Basics (35 points)

### Exercise 5: Environment Setup Validator (8 points)
Create a setup validation script that checks all prerequisites.

**Implementation:**
```typescript
interface SetupRequirement {
  name: string;
  command: string;
  minVersion?: string;
  required: boolean;
  category: 'runtime' | 'package-manager' | 'ide' | 'tool';
}

interface ValidationResult {
  requirement: string;
  installed: boolean;
  version?: string;
  meetsMinVersion: boolean;
  message: string;
}

const requirements: SetupRequirement[] = [
  { name: "Node.js", command: "node --version", minVersion: "18.0.0", required: true, category: "runtime" },
  { name: "npm", command: "npm --version", minVersion: "9.0.0", required: true, category: "package-manager" },
  // Add more requirements
];

async function validateSetup(requirements: SetupRequirement[]): Promise<ValidationResult[]> {
  // Check each requirement
  // Verify version if applicable
  // Return validation results
}

function displaySetupReport(results: ValidationResult[]): void {
  // Display checklist format
  // Show passed/failed items
  // Provide installation instructions for missing items
}
```

**Requirements:**
- Check Node.js, npm, TypeScript, VS Code extensions
- Verify minimum versions
- Provide installation commands for missing items
- Display color-coded results (✓ for pass, ✗ for fail)

---

### Exercise 6: TypeScript Test Case Type System (10 points)
Create a comprehensive type system for test cases.

**Implementation:**
```typescript
type Severity = 'critical' | 'high' | 'medium' | 'low';
type Status = 'passed' | 'failed' | 'skipped' | 'blocked';
type TestType = 'smoke' | 'regression' | 'sanity' | 'exploratory';

interface TestCase {
  id: string;
  title: string;
  description: string;
  severity: Severity;
  status: Status;
  tags: TestType[];
  duration: number;
  retries: number;
  author: string;
  createdAt: Date;
}

interface TestSuite {
  name: string;
  tests: TestCase[];
  totalDuration: number;
  passRate: number;
}

// Create functions:
function createTestCase(params: Partial<TestCase>): TestCase {
  // Validate required fields
  // Set defaults
  // Return complete test case
}

function printTestSummary(test: TestCase): string {
  // Format: "TC-1 Login (high) [smoke, regression] - passed in 1.2s"
}

function calculateSuiteMetrics(suite: TestSuite): {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  passRate: number;
  avgDuration: number;
} {
  // Calculate all metrics
}
```

**Requirements:**
- Implement all functions with proper type safety
- Validate that title is not empty
- Calculate pass rate as percentage
- Handle edge cases (empty suite, all skipped)
- Create at least 5 test cases for testing

---

### Exercise 7: Test Reporter Interface & Implementation (9 points)
Define and implement multiple reporter types.

**Implementation:**
```typescript
interface Reporter {
  name: string;
  start(): void;
  logTest(test: TestCase): void;
  finish(): void;
  getReport(): string;
}

class ConsoleReporter implements Reporter {
  private startTime: number = 0;
  private tests: TestCase[] = [];
  
  name = "Console Reporter";
  
  start(): void {
    if (this.startTime > 0) {
      console.warn("Reporter already started!");
      return;
    }
    this.startTime = Date.now();
    console.log("=== Test Run Started ===");
  }
  
  logTest(test: TestCase): void {
    // Log test result
  }
  
  finish(): void {
    if (this.startTime === 0) {
      console.warn("Cannot finish - reporter not started!");
      return;
    }
    // Display summary
  }
  
  getReport(): string {
    // Return formatted report
  }
}

class JSONReporter implements Reporter {
  // Implement JSON output format
}

class HTMLReporter implements Reporter {
  // Implement HTML output format
}
```

**Requirements:**
- Implement all three reporters
- Handle edge case: finish() called before start()
- Track execution time
- Display test counts and pass rate
- Test with sample test cases

---

### Exercise 8: Generic Retry Function (8 points)
Create a type-safe retry mechanism for test operations.

**Implementation:**
```typescript
interface RetryOptions {
  maxAttempts: number;
  delayMs: number;
  backoff?: 'linear' | 'exponential';
  onRetry?: (attempt: number, error: Error) => void;
}

async function retry<T>(
  fn: () => Promise<T>,
  options: RetryOptions
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= options.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === options.maxAttempts) {
        throw new Error(`Failed after ${options.maxAttempts} attempts: ${lastError.message}`);
      }
      
      // Calculate delay based on backoff strategy
      let delay = options.delayMs;
      if (options.backoff === 'exponential') {
        delay = options.delayMs * Math.pow(2, attempt - 1);
      }
      
      // Call onRetry callback if provided
      if (options.onRetry) {
        options.onRetry(attempt, lastError);
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Test functions
async function flaky APICall(): Promise<string> {
  // Simulate flaky API (fails randomly)
  if (Math.random() < 0.7) {
    throw new Error("Network timeout");
  }
  return "Success";
}
```

**Requirements:**
- Implement both linear and exponential backoff
- Support custom retry callbacks
- Handle edge case: maxAttempts = 0 (should call once)
- Test with flaky function
- Log retry attempts

---

## Part C: Practical QE Scenarios (25 points)

### Exercise 9: CI/CD Test Pipeline Designer (8 points)
Design a complete CI/CD test pipeline with failure handling.

**Implementation:**
```typescript
type PipelineStage = 'install' | 'lint' | 'unit' | 'integration' | 'api' | 'ui' | 'report' | 'deploy';
type StageStatus = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';

interface PipelineStep {
  stage: PipelineStage;
  name: string;
  command: string;
  timeout: number;
  continueOnError: boolean;
  retryCount: number;
}

interface PipelineExecution {
  steps: PipelineStep[];
  currentStep: number;
  status: Map<PipelineStage, StageStatus>;
  failedStep?: string;
}

class CIPipeline {
  private steps: PipelineStep[] = [];
  
  addStep(step: PipelineStep): void {
    this.steps.push(step);
  }
  
  async execute(): Promise<boolean> {
    // Execute each step in order
    // Handle failures
    // Implement rollback logic
    // Return overall success/failure
  }
  
  rollback(): void {
    // Implement rollback when tests fail
  }
}
```

**Requirements:**
- Create 8-step pipeline (install → deploy)
- Include rollback step for failures
- Implement timeout handling
- Add retry logic for flaky steps
- Display execution progress

---

### Exercise 10: Test Data Strategy Implementation (9 points)
Design and implement a complete test data management system.

**Implementation:**
```typescript
interface TestData {
  id: string;
  type: 'user' | 'product' | 'order';
  data: Record<string, any>;
  createdAt: Date;
  expiresAt?: Date;
}

class TestDataManager {
  private data: Map<string, TestData> = new Map();
  
  seed(count: number, type: TestData['type']): TestData[] {
    // Create test data
    // Use faker or custom generators
    // Store in map
  }
  
  get(id: string): TestData | undefined {
    // Retrieve test data
    // Check expiration
  }
  
  reset(): void {
    // Delete all test data
    // Log cleanup actions
  }
  
  maskPII(data: TestData): TestData {
    // Mask email, phone, SSN
    // Return masked copy
  }
  
  handleCollision(id: string): string {
    // Generate unique ID if collision detected
    // Use UUID or timestamp
  }
}
```

**Requirements:**
- Implement seed, reset, and masking
- Handle data collisions with UUIDs
- Implement data expiration
- Create 3 user accounts for testing
- Demonstrate PII masking in logs

---

### Exercise 11: Debugging Workflow System (8 points)
Create a structured debugging workflow for test failures.

**Implementation:**
```typescript
interface DebugStep {
  step: number;
  action: string;
  tool: string;
  expectedOutcome: string;
}

interface FailureContext {
  testName: string;
  errorMessage: string;
  stackTrace: string;
  screenshot?: string;
  networkLogs?: string[];
  consoleErrors?: string[];
}

class DebugWorkflow {
  private steps: DebugStep[] = [
    {
      step: 1,
      action: "Re-run test locally with trace enabled",
      tool: "Playwright Trace Viewer",
      expectedOutcome: "Reproduce failure and capture detailed trace"
    },
    // Add more steps
  ];
  
  diagnose(failure: FailureContext): string[] {
    // Analyze failure context
    // Suggest relevant debug steps
    // Return prioritized recommendations
  }
  
  generateDebugReport(failure: FailureContext): string {
    // Create comprehensive debug report
    // Include all available context
    // Suggest fixes
  }
}
```

**Requirements:**
- Define 6-step debugging workflow
- Include trace, screenshots, logs, network analysis
- Implement failure diagnosis
- Generate actionable debug report
- Handle different failure types (timeout, assertion, network)

---

## Part D: Advanced TypeScript for Testing (20 points)

### Exercise 12: Type-Safe Test Configuration (10 points)
Create a configuration system with environment-specific overrides.

**Implementation:**
```typescript
interface BaseConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  headless: boolean;
  screenshot: 'on' | 'off' | 'only-on-failure';
  video: 'on' | 'off' | 'retain-on-failure';
}

interface EnvironmentConfig extends BaseConfig {
  env: 'dev' | 'qa' | 'staging' | 'prod';
  apiKey?: string;
  dbConnection?: string;
}

const defaultConfig: BaseConfig = {
  baseURL: "http://localhost:3000",
  timeout: 30000,
  retries: 2,
  headless: true,
  screenshot: 'only-on-failure',
  video: 'retain-on-failure'
};

function createConfig(env: EnvironmentConfig['env']): EnvironmentConfig {
  // Merge default with environment-specific config
  // Validate required fields
  // Return complete config
}

function validateConfig(config: EnvironmentConfig): boolean {
  // Check URL format
  // Validate timeout > 0
  // Ensure retries >= 0
  // Return validation result
}
```

**Requirements:**
- Create configs for dev, qa, staging, prod
- Implement validation logic
- Support environment variable overrides
- Handle missing required fields
- Test all environments

---

### Exercise 13: Test Metrics Calculator (10 points)
Build a comprehensive test metrics system.

**Implementation:**
```typescript
interface TestRun {
  id: string;
  timestamp: Date;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  duration: number;
}

interface QualityMetrics {
  passRate: number;
  flakeRate: number;
  defectEscapeRate: number;
  avgExecutionTime: number;
  trend: 'improving' | 'stable' | 'degrading';
}

class MetricsCalculator {
  private runs: TestRun[] = [];
  
  addRun(run: TestRun): void {
    this.runs.push(run);
  }
  
  calculateMetrics(): QualityMetrics {
    // Pass rate = passed / (total - skipped) * 100
    // Flake rate = flaky / total runs * 100
    // Calculate trends over last 10 runs
  }
  
  interpretMetrics(metrics: QualityMetrics): {
    passRateHealth: string;
    flakeRateHealth: string;
    recommendations: string[];
  } {
    // Interpret metrics
    // Provide recommendations
    // passRate >= 95%: Healthy
    // flakeRate <= 3%: Acceptable
    // flakeRate > 5%: Action needed
  }
  
  generateReport(metrics: QualityMetrics): string {
    // Create formatted report
    // Include trend analysis
    // Provide actionable recommendations
  }
}
```

**Requirements:**
- Implement all calculation methods
- Calculate trends over time
- Provide health status for each metric
- Generate actionable recommendations
- Test with sample data (10 test runs)

---

## Bonus Challenges (30 points)

### Exercise 14: Test Pyramid Validator (10 points)
Create a tool that validates if a test suite follows the pyramid principle.

```typescript
interface PyramidAnalysis {
  unitPercentage: number;
  integrationPercentage: number;
  apiPercentage: number;
  uiPercentage: number;
  isValid: boolean;
  violations: string[];
  recommendations: string[];
}

function analyzePyramid(pyramid: TestPyramid): PyramidAnalysis {
  // Calculate percentages
  // Check if ratios are correct (60:20:15:5)
  // Identify violations
  // Provide recommendations
}
```

---

### Exercise 15: Flake Detection System (10 points)
Build a system that detects and reports flaky tests.

```typescript
interface TestHistory {
  testId: string;
  executions: Array<{
    timestamp: Date;
    status: 'passed' | 'failed';
    duration: number;
  }>;
}

function detectFlaky(history: TestHistory, threshold: number = 0.2): boolean {
  // Calculate pass/fail ratio
  // If ratio is between 0.2 and 0.8, it's flaky
  // Return true if flaky
}

function suggestFix(testId: string): string[] {
  // Analyze common flake causes
  // Suggest fixes (add waits, improve selectors, etc.)
}
```

---

### Exercise 16: Complete QE Dashboard (10 points)
Create a comprehensive QE dashboard that combines all metrics.

```typescript
class QEDashboard {
  private testRuns: TestRun[] = [];
  private pyramid: TestPyramid;
  private flakyTests: string[] = [];
  
  generateDashboard(): string {
    // Combine all metrics
    // Display test pyramid health
    // Show flake rate
    // Display trends
    // Provide executive summary
  }
}
```

---

## Submission Guidelines

1. Create a folder `assignment01_yourname/`
2. Organize files by exercise:
   - `qe-foundations.ts` (Exercises 1-4)
   - `typescript-basics.ts` (Exercises 5-8)
   - `practical-scenarios.ts` (Exercises 9-11)
   - `advanced-typescript.ts` (Exercises 12-13)
   - `bonus-challenges.ts` (Exercises 14-16)
3. Include a `README.md` with:
   - How to compile and run each file
   - Sample outputs for each exercise
   - Any assumptions made
4. Ensure all files compile without errors: `tsc --strict *.ts`
5. Include `package.json` and `tsconfig.json`

---

## Grading Rubric

- **Correctness (40%)**: Accurate QE concepts and valid TypeScript
  - Type safety (10%)
  - Logic correctness (15%)
  - Edge case handling (15%)

- **Code Quality (30%)**: Clean, maintainable code
  - Proper typing (10%)
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

❌ Using `any` type without justification  
❌ Confusing QE with QA  
❌ Overusing UI tests (pyramid violation)  
❌ Skipping input validation  
❌ Not handling edge cases (empty arrays, null values)  
❌ Missing error handling in async functions  
❌ Hardcoding values instead of using configuration  
❌ Not testing your code before submission

---

## Tips for Success

✅ Use the test pyramid as a guide for all test planning  
✅ Keep outputs labeled and readable  
✅ Validate inputs early in functions  
✅ Use TypeScript's type system to catch errors at compile time  
✅ Test edge cases: empty arrays, null, undefined, zero, negative numbers  
✅ Add JSDoc comments for complex functions  
✅ Run `tsc --strict` to ensure type safety  
✅ Cross-check answers with the documentation examples  
✅ Use meaningful variable and function names  
✅ Break complex functions into smaller, testable units

---

## Quick Reference

### TypeScript Compilation
```bash
# Compile single file
tsc filename.ts

# Compile with strict mode
tsc --strict filename.ts

# Run TypeScript directly
ts-node filename.ts

# Watch mode
tsc --watch filename.ts
```

### Test Pyramid Ratios
- **Unit Tests**: 60% (fast, isolated, many)
- **Integration Tests**: 20% (medium speed, component interaction)
- **API Tests**: 15% (medium speed, contract validation)
- **UI Tests**: 5% (slow, end-to-end, critical paths only)

### Quality Metrics Thresholds
- **Pass Rate**: >= 95% (healthy)
- **Flake Rate**: <= 3% (acceptable), > 5% (action needed)
- **Defect Escape Rate**: <= 2% (good)

---

**Total Points: 105 + 30 Bonus = 135 points**

Build a strong foundation in QE and TypeScript! 🚀