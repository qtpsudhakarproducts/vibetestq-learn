# 25 - Cypress Agents and AI-Powered Testing

## Introduction to Cypress Agents

Cypress agents are AI-powered tools that can autonomously write, execute, and maintain tests. This module covers integrating AI agents with Cypress for intelligent test automation using TypeScript.

## What Are Cypress Agents?

### Agent Capabilities

```typescript
// AI Agent can:
// - Generate test cases from requirements
// - Write Cypress test code automatically
// - Identify selectors intelligently
// - Fix flaky tests
// - Suggest test improvements
// - Maintain tests as UI changes
// - Generate Page Objects
// - Create comprehensive test suites
```

## AI-Powered Test Generation

### Using AI to Generate Tests

```typescript
// Example: AI-generated test from natural language
// Input: "Test user login with valid and invalid credentials"

// AI Output:
describe('User Login', () => {
  it('should login with valid credentials', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('user@example.com')
    cy.get('[data-cy="password"]').type('password123')
    cy.get('[data-cy="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
  
  it('should show error with invalid credentials', () => {
    cy.visit('/login')
    cy.get('[data-cy="email"]').type('wrong@example.com')
    cy.get('[data-cy="password"]').type('wrongpass')
    cy.get('[data-cy="submit"]').click()
    cy.get('[data-cy="error"]').should('contain', 'Invalid credentials')
  })
})
```

### Prompt Engineering for Test Generation

```typescript
// Good prompts for AI test generation:

const prompts = {
  // ✅ Good - specific, structured
  specific: `
    Create Cypress tests for user registration flow:
    - Test successful registration with valid data
    - Test validation errors for invalid email
    - Test password strength requirements
    - Test duplicate email handling
    Use TypeScript and data-cy attributes for selectors
  `,
  
  // ✅ Good - includes context
  withContext: `
    Generate Cypress tests for e-commerce checkout:
    Context: Multi-step checkout (cart -> shipping -> payment)
    Requirements:
    - Validate cart items before checkout
    - Test shipping address form validation
    - Test payment processing with mock API
    - Verify order confirmation
    Use Page Object Model pattern
  `,
  
  // ❌ Avoid - vague
  vague: "Write some tests for login"
}
```

## Intelligent Selector Generation

### AI-Powered Selector Suggestions

```typescript
class SelectorAgent {
  static async suggestSelector(
    elementDescription: string,
    context: string
  ): Promise<string> {
    // AI analyzes page structure and suggests best selector
    
    // Example inputs:
    // elementDescription: "Submit button on login form"
    // context: HTML structure of page
    
    // AI output prioritizes:
    // 1. data-* attributes
    // 2. Unique IDs
    // 3. ARIA labels
    // 4. Stable class names
    
    return '[data-cy="login-submit"]'  // AI-generated selector
  }
  
  static async generatePageSelectors(
    pageUrl: string
  ): Promise<Record<string, string>> {
    // AI crawls page and generates selector map
    return {
      emailInput: '[data-cy="email"]',
      passwordInput: '[data-cy="password"]',
      submitButton: '[data-cy="submit"]',
      errorMessage: '[data-cy="error"]'
    }
  }
}

// Usage
describe('AI-Assisted Selectors', () => {
  it('uses AI-generated selectors', async () => {
    const selectors = await SelectorAgent.generatePageSelectors('/login')
    
    cy.visit('/login')
    cy.get(selectors.emailInput).type('user@example.com')
    cy.get(selectors.passwordInput).type('password')
    cy.get(selectors.submitButton).click()
  })
})
```

## Self-Healing Tests

### Auto-Fixing Broken Selectors

```typescript
class SelfHealingAgent {
  private selectorHistory: Map<string, string[]> = new Map()
  
  get(selector: string, options?: any) {
    return cy.get(selector, { ...options, timeout: 5000 })
      .then(
        ($el) => $el,  // Selector works
        (error) => {
          // Selector failed, attempt healing
          return this.healSelector(selector)
        }
      )
  }
  
  private healSelector(brokenSelector: string) {
    // AI analyzes DOM and suggests alternative selectors
    const alternatives = this.findAlternativeSelectors(brokenSelector)
    
    // Try alternatives
    for (const alternative of alternatives) {
      try {
        return cy.get(alternative)
      } catch {
        continue
      }
    }
    
    throw new Error(`Could not heal selector: ${brokenSelector}`)
  }
  
  private findAlternativeSelectors(selector: string): string[] {
    // AI suggests alternatives based on:
    // - Similar elements in DOM
    // - Element attributes
    // - Position in DOM tree
    // - Historical successful selectors
    
    return [
      selector.replace('login-button', 'submit-button'),
      '[data-testid="login-submit"]',
      'button[type="submit"]'
    ]
  }
}

// Usage
const agent = new SelfHealingAgent()

describe('Self-Healing Tests', () => {
  it('automatically fixes broken selectors', () => {
    cy.visit('/login')
    agent.get('[data-cy="old-selector"]')  // Auto-heals if broken
      .type('test@example.com')
  })
})
```

## AI Test Maintenance

### Detecting Flaky Tests

```typescript
interface TestRun {
  testName: string
  passed: boolean
  duration: number
  timestamp: Date
}

class FlakeDetector {
  private testHistory: TestRun[] = []
  
  analyzeFlakiness(testName: string): {
    isFlaky: boolean
    confidence: number
    suggestion: string
  } {
    const runs = this.testHistory.filter(r => r.testName === testName)
    const passRate = runs.filter(r => r.passed).length / runs.length
    
    if (passRate < 1.0 && passRate > 0.0) {
      return {
        isFlaky: true,
        confidence: 1.0 - passRate,
        suggestion: this.generateFix(testName, runs)
      }
    }
    
    return { isFlaky: false, confidence: 0, suggestion: '' }
  }
  
  private generateFix(testName: string, runs: TestRun[]): string {
    // AI analyzes failure patterns and suggests fixes
    // Common suggestions:
    return `
      Add explicit wait before assertion:
      cy.get('.element', { timeout: 10000 }).should('be.visible')
      
      Or use cy.wait() for network request:
      cy.intercept('GET', '/api/data').as('getData')
      cy.wait('@getData')
    `
  }
}

// Usage in CI
describe('Flake Detection', () => {
  const detector = new FlakeDetector()
  
  afterEach(function() {
    const analysis = detector.analyzeFlakiness(this.currentTest!.title)
    
    if (analysis.isFlaky) {
      console.log(`⚠️ Flaky Test Detected: ${this.currentTest!.title}`)
      console.log(`Suggestion: ${analysis.suggestion}`)
    }
  })
})
```

## AI-Generated Page Objects

### Automatic POM Generation

```typescript
class PageObjectGenerator {
  static async generateFromUrl(url: string): Promise<string> {
    // AI crawls URL and generates Page Object class
    
    // AI Output:
    return `
      export class LoginPage {
        private selectors = {
          email: '[data-cy="email"]',
          password: '[data-cy="password"]',
          submit: '[data-cy="submit"]',
          error: '.error-message'
        }
        
        visit(): this {
          cy.visit('/login')
          return this
        }
        
        login(email: string, password: string): this {
          cy.get(this.selectors.email).type(email)
          cy.get(this.selectors.password).type(password)
          cy.get(this.selectors.submit).click()
          return this
        }
        
        shouldShowError(message: string): this {
          cy.get(this.selectors.error).should('contain', message)
          return this
        }
      }
    `
  }
  
  static async updatePageObject(
    existingCode: string,
    changedElements: string[]
  ): Promise<string> {
    // AI updates Page Object when UI changes
    return updatedCode
  }
}

// Usage
describe('AI-Generated Page Objects', () => {
  it('generates Page Object from URL', async () => {
    const code = await PageObjectGenerator.generateFromUrl('/login')
    
    // Save to file
    cy.writeFile('cypress/pages/LoginPage.ts', code)
  })
})
```

## Visual AI Testing

### AI-Powered Visual Validation

```typescript
class VisualAIAgent {
  static async compareScreenshots(
    baseline: string,
    current: string
  ): Promise<{
    match: boolean
    differences: string[]
    severity: 'low' | 'medium' | 'high'
  }> {
    // AI analyzes visual differences
    // Ignores: dynamic content, timestamps, ads
    // Flags: layout shifts, missing elements, color changes
    
    return {
      match: false,
      differences: [
        'Header logo shifted 5px right',
        'Button color changed from blue to green'
      ],
      severity: 'medium'
    }
  }
  
  static async validateAccessibility(
    screenshot: string
  ): Promise<{
    issues: Array<{
      type: string
      severity: string
      element: string
      suggestion: string
    }>
  }> {
    // AI detects accessibility issues
    return {
      issues: [
        {
          type: 'color-contrast',
          severity: 'high',
          element: 'button.submit',
          suggestion: 'Increase contrast ratio to 4.5:1'
        }
      ]
    }
  }
}

// Usage
describe('Visual AI Testing', () => {
  it('detects visual regressions', () => {
    cy.visit('/page')
    cy.screenshot('current')
    
    VisualAIAgent.compareScreenshots('baseline.png', 'current.png')
      .then(result => {
        expect(result.match).to.be.true
      })
  })
})
```

## Conversational Test Creation

### Natural Language to Tests

```typescript
interface ConversationalAgent {
  generateTest(conversation: string[]): string
}

// Example conversation:
const conversation = [
  "User: I need tests for login functionality",
  "Agent: What scenarios should I cover?",
  "User: Valid login, invalid password, and locked account",
  "Agent: Should I include MFA?",
  "User: Yes, include TOTP MFA",
  "Agent: Generated tests with all scenarios including MFA"
]

// AI-generated output:
const generatedTests = `
describe('Login Functionality', () => {
  it('logs in with valid credentials', () => {
    cy.login('user@example.com', 'password123')
    cy.url().should('include', '/dashboard')
  })
  
  it('shows error for invalid password', () => {
    cy.visit('/login')
    cy.get('#email').type('user@example.com')
    cy.get('#password').type('wrongpassword')
    cy.get('button').click()
    cy.get('.error').should('contain', 'Invalid password')
  })
  
  it('handles locked account', () => {
    cy.visit('/login')
    cy.get('#email').type('locked@example.com')
    cy.get('#password').type('password123')
    cy.get('button').click()
    cy.get('.error').should('contain', 'Account locked')
  })
  
  it('completes MFA with TOTP', () => {
    cy.login('user@example.com', 'password123')
    cy.get('#mfa-code').type('123456')
    cy.get('#verify').click()
    cy.url().should('include', '/dashboard')
  })
})
`
```

## Test Coverage Analysis

### AI-Driven Coverage Suggestions

```typescript
class CoverageAgent {
  static async analyzeCoverage(
    appUrl: string,
    existingTests: string[]
  ): Promise<{
    coverage: number
    untested: string[]
    suggestions: string[]
  }> {
    // AI analyzes app and existing tests
    return {
      coverage: 65,
      untested: [
        'Password reset flow',
        'Email verification',
        'Profile update',
        'Account deletion'
      ],
      suggestions: [
        'Add tests for password reset user journey',
        'Test email verification with expired tokens',
        'Cover edge cases in profile update (file uploads, validation)',
        'Test account deletion with data cleanup verification'
      ]
    }
  }
  
  static async generateMissingTests(
    untested: string[]
  ): Promise<Record<string, string>> {
    // AI generates tests for untested scenarios
    return {
      'password-reset': `
        describe('Password Reset', () => {
          it('sends reset email', () => {
            cy.visit('/forgot-password')
            cy.get('#email').type('user@example.com')
            cy.get('button').click()
            cy.get('.success').should('be.visible')
          })
        })
      `
    }
  }
}
```

## Agent Integration Patterns

### CI/CD Integration

```typescript
// GitHub Actions workflow with AI agent
const workflow = `
name: AI-Powered Testing

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: AI Test Generation
        run: |
          # AI agent analyzes code changes
          # Generates new tests for modified components
          npm run ai:generate-tests
      
      - name: Run Tests
        run: npm run cypress:run
      
      - name: AI Flake Detection
        if: failure()
        run: |
          # AI analyzes failures
          # Suggests fixes for flaky tests
          npm run ai:analyze-failures
`
```

## Best Practices for AI Agents

### Effective AI Integration

```typescript
// ✅ Good - Human oversight
describe('AI-Generated Tests', () => {
  // Review AI-generated tests before merging
  // Validate test logic and assertions
  // Ensure tests follow project conventions
})

// ✅ Good - Hybrid approach
class HybridTesting {
  static writeTest(scenario: string) {
    // AI generates initial test
    const aiGenerated = AIAgent.generate(scenario)
    
    // Human reviews and refines
    return humanReview(aiGenerated)
  }
}

// ✅ Good - Use AI for maintenance
afterEach(() => {
  // AI monitors test health
  AIAgent.detectFlakiness()
  AIAgent.suggestImprovements()
})

// ❌ Avoid - Blind trust
// Don't deploy AI-generated tests without review
// Don't rely solely on AI for critical tests
```

## Summary

- AI agents can generate Cypress tests from requirements
- Intelligent selector generation reduces brittleness
- Self-healing tests automatically fix broken selectors
- AI detects and suggests fixes for flaky tests
- Automatic Page Object generation saves time
- Visual AI validates UI without pixel-perfect matching
- Conversational interfaces simplify test creation
- Coverage analysis identifies untested scenarios
- Integration with CI/CD for continuous improvement
- Always combine AI with human oversight
- Use AI for test generation and maintenance
- TypeScript ensures type-safe AI integrations

## Next Steps

- **29 - Testing AI Apps**: Test AI-powered applications
- **26 - Prompt Engineering**: Optimize AI prompts
- **31 - Capstone Project**: Apply AI agents

## Quick Reference

```typescript
// AI test generation
const tests = AIAgent.generateFrom(requirements)

// Self-healing selector
agent.get('[data-cy="element"]')  // Auto-heals

// Flake detection
const analysis = detector.analyzeFlakiness(testName)

// Generate Page Object
const code = await PageObjectGenerator.generateFromUrl(url)

// Visual AI
VisualAIAgent.compareScreenshots(baseline, current)

// Coverage analysis
const coverage = await CoverageAgent.analyzeCoverage(url, tests)
```
