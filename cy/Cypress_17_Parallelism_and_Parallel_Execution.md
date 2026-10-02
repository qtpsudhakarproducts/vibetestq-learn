# 17 - Parallelism and Parallel Execution

## Introduction to Parallel Testing

Parallel test execution runs multiple tests simultaneously, dramatically reducing overall test execution time. This module covers parallel testing strategies with Cypress and TypeScript.

## Understanding Parallelization

### Serial vs Parallel Execution

```
Serial:
Test1 → Test2 → Test3 → Test4
Total Time: 40 minutes

Parallel (4 machines):
Machine 1: Test1
Machine 2: Test2
Machine 3: Test3
Machine 4: Test4
Total Time: 10 minutes
```

### Benefits of Parallelization

- **Faster feedback**: Reduce test suite execution time by 75%+
- **Efficient CI/CD**: Run tests in minutes instead of hours
- **Better resource utilization**: Utilize multiple CI runners
- **Scalability**: Handle growing test suites

## Cypress Cloud Parallelization

### Setting Up Cypress Cloud

```bash
# Install Cypress
npm install cypress --save-dev

# Set up project in Cypress Cloud (https://cloud.cypress.io)
# Get your projectId and record key

# Run with recording
npx cypress run --record --key <record-key>
```

### Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  projectId: 'abc123',  // From Cypress Cloud
  e2e: {
    baseUrl: 'http://localhost:3000',
  }
})
```

### Running in Parallel

```bash
# Single machine (records results)
npx cypress run --record --key <record-key>

# Multiple machines in parallel
npx cypress run --record --key <record-key> --parallel

# With specific group
npx cypress run --record --parallel --group "E2E Tests"

# With CI build ID
npx cypress run --record --parallel --ci-build-id $CI_BUILD_ID
```

## CI/CD Parallel Configuration

### GitHub Actions Parallelization

```yaml
# .github/workflows/cypress-parallel.yml
name: Cypress Parallel Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        containers: [1, 2, 3, 4]  # 4 parallel containers
    
    steps:
      - name: Checkout
        uses: actions/checkout@v3
      
      - name: Cypress run
        uses: cypress-io/github-action@v5
        with:
          record: true
          parallel: true
          group: 'GitHub Actions'
          ci-build-id: '${{ github.sha }}-${{ github.workflow }}-${{ github.event_name }}'
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### GitLab CI Parallelization

```yaml
# .gitlab-ci.yml
cypress-parallel:
  image: cypress/browsers:node18.12.0-chrome107
  stage: test
  
  parallel: 5  # Run on 5 parallel jobs
  
  script:
    - npm ci
    - npx cypress run --record --parallel --ci-build-id $CI_PIPELINE_ID
  
  variables:
    CYPRESS_RECORD_KEY: $CYPRESS_RECORD_KEY
  
  artifacts:
    when: always
    paths:
      - cypress/screenshots
      - cypress/videos
    expire_in: 1 week
```

### Jenkins Parallelization

```groovy
// Jenkinsfile
pipeline {
    agent none
    
    stages {
        stage('Parallel Cypress Tests') {
            parallel {
                stage('Batch 1') {
                    agent {
                        docker {
                            image 'cypress/browsers:node18.12.0-chrome107'
                        }
                    }
                    steps {
                        sh 'npm ci'
                        sh 'npx cypress run --record --parallel --ci-build-id ${BUILD_ID}'
                    }
                }
                stage('Batch 2') {
                    agent {
                        docker {
                            image 'cypress/browsers:node18.12.0-chrome107'
                        }
                    }
                    steps {
                        sh 'npm ci'
                        sh 'npx cypress run --record --parallel --ci-build-id ${BUILD_ID}'
                    }
                }
                stage('Batch 3') {
                    agent {
                        docker {
                            image 'cypress/browsers:node18.12.0-chrome107'
                        }
                    }
                    steps {
                        sh 'npm ci'
                        sh 'npx cypress run --record --parallel --ci-build-id ${BUILD_ID}'
                    }
                }
            }
        }
    }
}
```

### CircleCI Parallelization

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  cypress: cypress-io/cypress@3

workflows:
  parallel-workflow:
    jobs:
      - cypress/run:
          name: 'Cypress Parallel Tests'
          parallelism: 4
          cypress-command: 'npx cypress run --record --parallel --ci-build-id $CIRCLE_WORKFLOW_ID'
          post-steps:
            - store_test_results:
                path: cypress/results
            - store_artifacts:
                path: cypress/videos
            - store_artifacts:
                path: cypress/screenshots
```

## Manual Parallelization (Without Cypress Cloud)

### Split Specs Strategy

```typescript
// split-specs.ts
import * as glob from 'glob'

interface SplitConfig {
  totalMachines: number
  machineIndex: number
  specPattern: string
}

function splitSpecs(config: SplitConfig): string[] {
  const allSpecs = glob.sync(config.specPattern)
  const specsPerMachine = Math.ceil(allSpecs.length / config.totalMachines)
  const startIndex = config.machineIndex * specsPerMachine
  const endIndex = startIndex + specsPerMachine
  
  return allSpecs.slice(startIndex, endIndex)
}

// Usage
const specs = splitSpecs({
  totalMachines: parseInt(process.env.TOTAL_MACHINES || '1'),
  machineIndex: parseInt(process.env.MACHINE_INDEX || '0'),
  specPattern: 'cypress/e2e/**/*.cy.ts'
})

console.log(specs.join(','))
```

### Running Split Specs

```bash
# Machine 1
export TOTAL_MACHINES=4
export MACHINE_INDEX=0
SPECS=$(node split-specs.ts)
npx cypress run --spec "$SPECS"

# Machine 2
export MACHINE_INDEX=1
SPECS=$(node split-specs.ts)
npx cypress run --spec "$SPECS"

# etc...
```

### GitHub Actions Manual Split

```yaml
name: Manual Parallel

jobs:
  cypress-test:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        machine: [0, 1, 2, 3]
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm ci
      
      - name: Get specs for this machine
        id: specs
        run: |
          SPECS=$(node split-specs.ts)
          echo "specs=$SPECS" >> $GITHUB_OUTPUT
        env:
          TOTAL_MACHINES: 4
          MACHINE_INDEX: ${{ matrix.machine }}
      
      - name: Run Cypress
        run: npx cypress run --spec "${{ steps.specs.outputs.specs }}"
```

## Load Balancing

### Duration-Based Splitting

```typescript
// duration-split.ts
import * as fs from 'fs'

interface SpecDuration {
  spec: string
  duration: number
}

function loadBalancedSplit(
  specs: SpecDuration[],
  machines: number
): string[][] {
  // Sort by duration (longest first)
  const sorted = [...specs].sort((a, b) => b.duration - a.duration)
  
  // Initialize machine buckets
  const buckets: { specs: string[]; totalDuration: number }[] = 
    Array.from({ length: machines }, () => ({ 
      specs: [], 
      totalDuration: 0 
    }))
  
  // Assign specs to least-loaded machine
  sorted.forEach(spec => {
    const leastLoaded = buckets.reduce((min, bucket, index) => 
      bucket.totalDuration < buckets[min].totalDuration ? index : min
    , 0)
    
    buckets[leastLoaded].specs.push(spec.spec)
    buckets[leastLoaded].totalDuration += spec.duration
  })
  
  return buckets.map(b => b.specs)
}

// Load previous test durations
const durations: SpecDuration[] = JSON.parse(
  fs.readFileSync('test-durations.json', 'utf-8')
)

const machineIndex = parseInt(process.env.MACHINE_INDEX || '0')
const totalMachines = parseInt(process.env.TOTAL_MACHINES || '1')

const splits = loadBalancedSplit(durations, totalMachines)
console.log(splits[machineIndex].join(','))
```

## TypeScript Configuration for Parallel Tests

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // Optimize for parallel execution
    numTestsKeptInMemory: 0,  // Reduce memory usage
    
    setupNodeEvents(on, config) {
      // Parallel-specific configuration
      if (process.env.CI && process.env.PARALLEL) {
        config.video = false  // Disable video in parallel to save time
        config.screenshotOnRunFailure = true
        config.defaultCommandTimeout = 10000
      }
      
      // Record test durations for load balancing
      const durations: Record<string, number> = {}
      
      on('after:spec', (spec, results) => {
        if (results && results.stats) {
          durations[spec.relative] = results.stats.duration
        }
      })
      
      on('after:run', () => {
        // Save durations for next run
        const fs = require('fs')
        fs.writeFileSync(
          'test-durations.json',
          JSON.stringify(durations, null, 2)
        )
      })
      
      return config
    }
  }
})
```

## Grouping Tests

### Browser-Based Groups

```yaml
# GitHub Actions
jobs:
  chrome-tests:
    strategy:
      matrix:
        containers: [1, 2, 3]
    steps:
      - uses: cypress-io/github-action@v5
        with:
          record: true
          parallel: true
          group: 'Chrome'
          browser: chrome
  
  firefox-tests:
    strategy:
      matrix:
        containers: [1, 2, 3]
    steps:
      - uses: cypress-io/github-action@v5
        with:
          record: true
          parallel: true
          group: 'Firefox'
          browser: firefox
```

### Feature-Based Groups

```bash
# E2E Tests
npx cypress run --record --parallel --group "E2E" --spec "cypress/e2e/**/*.cy.ts"

# API Tests
npx cypress run --record --parallel --group "API" --spec "cypress/api/**/*.cy.ts"

# Component Tests
npx cypress run --record --parallel --group "Component" --component
```

## Parallel Test Best Practices

### 1. Test Independence

```typescript
// ✅ Good - independent tests
describe('User Tests', () => {
  beforeEach(() => {
    // Fresh state for each test
    cy.task('resetDatabase')
    cy.clearCookies()
  })
  
  it('test 1', () => {
    // Runs independently
  })
  
  it('test 2', () => {
    // Runs independently
  })
})

// ❌ Avoid - dependent tests
describe('User Tests', () => {
  it('creates user', () => {
    // Creates user in DB
  })
  
  it('updates user', () => {
    // Depends on test above
  })
})
```

### 2. Isolated Data

```typescript
// ✅ Good - unique test data
describe('Product Tests', () => {
  it('creates product', () => {
    const uniqueId = `product-${Date.now()}`
    cy.request('POST', '/api/products', {
      id: uniqueId,
      name: 'Test Product'
    })
  })
})

// ❌ Avoid - shared data
describe('Product Tests', () => {
  it('creates product', () => {
    cy.request('POST', '/api/products', {
      id: 'product-1',  // Conflict in parallel
      name: 'Test Product'
    })
  })
})
```

### 3. No Shared State

```typescript
// ✅ Good - no shared files
it('downloads report', () => {
  const filename = `report-${Date.now()}.pdf`
  cy.get('.download').click()
  cy.readFile(`cypress/downloads/${filename}`)
})

// ❌ Avoid - shared filename
it('downloads report', () => {
  cy.get('.download').click()
  cy.readFile('cypress/downloads/report.pdf')  // Conflict
})
```

## Monitoring Parallel Execution

### Custom Metrics

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const metrics = {
        machineId: process.env.MACHINE_INDEX,
        startTime: Date.now(),
        specsRun: 0,
        totalDuration: 0
      }
      
      on('before:spec', (spec) => {
        console.log(`[Machine ${metrics.machineId}] Starting: ${spec.name}`)
      })
      
      on('after:spec', (spec, results) => {
        metrics.specsRun++
        metrics.totalDuration += results?.stats?.duration || 0
        
        console.log(`[Machine ${metrics.machineId}] Completed: ${spec.name}`)
        console.log(`Duration: ${results?.stats?.duration}ms`)
      })
      
      on('after:run', () => {
        const totalTime = Date.now() - metrics.startTime
        console.log(`\n[Machine ${metrics.machineId}] Summary:`)
        console.log(`Specs run: ${metrics.specsRun}`)
        console.log(`Test duration: ${metrics.totalDuration}ms`)
        console.log(`Total time: ${totalTime}ms`)
      })
      
      return config
    }
  }
})
```

## Debugging Parallel Tests

### Identifying Flaky Tests

```typescript
// flaky-test-detector.ts
interface TestResult {
  spec: string
  passed: boolean
  attempt: number
}

const results: TestResult[] = []

export default defineConfig({
  e2e: {
    retries: {
      runMode: 2
    },
    
    setupNodeEvents(on, config) {
      on('after:spec', (spec, results) => {
        results?.tests?.forEach(test => {
          if (test.attempts.length > 1) {
            console.warn(`⚠️  Flaky test detected: ${spec.name} - ${test.title}`)
            console.log(`Attempts: ${test.attempts.length}`)
          }
        })
      })
      
      return config
    }
  }
})
```

## Cost Optimization

### Dynamic Parallelization

```typescript
// dynamic-parallel.ts
function calculateOptimalParallelism(
  totalSpecs: number,
  avgSpecDuration: number,
  targetDuration: number
): number {
  const totalDuration = totalSpecs * avgSpecDuration
  const optimalMachines = Math.ceil(totalDuration / targetDuration)
  
  // Cap at reasonable maximum
  return Math.min(optimalMachines, 10)
}

// Usage
const optimal = calculateOptimalParallelism(
  100,    // 100 spec files
  120000, // 2 minutes average per spec
  600000  // Target: 10 minutes total
)

console.log(`Optimal parallelism: ${optimal} machines`)
```

## Summary

- Parallel execution dramatically reduces test time
- Cypress Cloud provides automatic load balancing
- Manual parallelization possible with spec splitting
- Tests must be independent for parallel execution
- Use unique identifiers for test data
- Group tests by browser, feature, or type
- Monitor and optimize parallelization strategy
- CI/CD platforms support parallel execution
- Load balancing based on test duration
- TypeScript enables type-safe parallel configuration

## Next Steps

- **15 - Reporters and CI**: CI/CD integration
- **18 - Page Object Model**: Parallel-safe page objects
- **24 - Best Practices**: Parallel test optimization

## Quick Reference

```bash
# Cypress Cloud parallel
npx cypress run --record --parallel --key <key>

# With group
npx cypress run --record --parallel --group "E2E"

# With CI build ID
npx cypress run --record --parallel --ci-build-id $BUILD_ID
```

```typescript
// cypress.config.ts
export default defineConfig({
  projectId: 'abc123',
  e2e: {
    numTestsKeptInMemory: 0,  // Optimize for parallel
  }
})
```

```yaml
# GitHub Actions
strategy:
  matrix:
    containers: [1, 2, 3, 4]
steps:
  - uses: cypress-io/github-action@v5
    with:
      record: true
      parallel: true
```
