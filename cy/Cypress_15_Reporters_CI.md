# 22 - Reporters and CI/CD

## Introduction to Reporters and CI

Cypress integrates seamlessly with CI/CD pipelines and supports various reporters for generating test reports. This module covers reporter configuration, CI/CD setup, and TypeScript integration.

## Built-in Reporters

### Spec Reporter (Default)

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    reporter: 'spec',  // Default, shows detailed test output
  }
})
```

### JSON Reporter

```typescript
export default defineConfig({
  e2e: {
    reporter: 'json',
    reporterOptions: {
      toConsole: true,
      output: 'cypress/results/output.json'
    }
  }
})
```

### JUnit Reporter

```typescript
export default defineConfig({
  e2e: {
    reporter: 'junit',
    reporterOptions: {
      mochaFile: 'cypress/results/junit/results-[hash].xml',
      toConsole: true,
      attachments: true,
      suiteTitleSeparatedBy: ' > ',
      testCaseSwitchClassnameAndName: false
    }
  }
})
```

## Custom Reporters

### Mochawesome Reporter

```bash
npm install --save-dev mochawesome mochawesome-merge mochawesome-report-generator
```

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'cypress/results/mochawesome',
      overwrite: false,
      html: true,
      json: true,
      charts: true,
      reportPageTitle: 'Cypress Test Report',
      embeddedScreenshots: true,
      inlineAssets: true
    }
  }
})
```

### Multiple Reporters

```bash
npm install --save-dev cypress-multi-reporters mocha-junit-reporter
```

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    reporter: 'cypress-multi-reporters',
    reporterOptions: {
      configFile: 'reporter-config.json'
    }
  }
})

// reporter-config.json
{
  "reporterEnabled": "spec, mocha-junit-reporter, mochawesome",
  "mochaJunitReporterReporterOptions": {
    "mochaFile": "cypress/results/junit/results.xml"
  },
  "mochawesomeReporterOptions": {
    "reportDir": "cypress/results/mochawesome",
    "overwrite": false,
    "html": true,
    "json": true
  }
}
```

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/cypress.yml
name: Cypress Tests

on: [push, pull_request]

jobs:
  cypress-run:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        browser: [chrome, firefox, edge]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run Cypress tests
        uses: cypress-io/github-action@v5
        with:
          browser: ${{ matrix.browser }}
          record: true
          parallel: true
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-screenshots
          path: cypress/screenshots
      
      - name: Upload videos
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: cypress-videos
          path: cypress/videos
      
      - name: Generate test report
        if: always()
        run: npm run report:generate
      
      - name: Upload test report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: cypress/results
```

### GitLab CI

```yaml
# .gitlab-ci.yml
image: cypress/browsers:node18.12.0-chrome107

stages:
  - test
  - report

cache:
  paths:
    - node_modules/
    - .npm/

cypress-test:
  stage: test
  script:
    - npm ci
    - npm run cypress:run
  artifacts:
    when: always
    paths:
      - cypress/screenshots
      - cypress/videos
      - cypress/results
    expire_in: 1 week
  parallel: 3

generate-report:
  stage: report
  script:
    - npm run report:merge
    - npm run report:generate
  artifacts:
    paths:
      - cypress/results/mochawesome-report
    expire_in: 1 month
  when: always
```

### Jenkins

```groovy
// Jenkinsfile
pipeline {
    agent {
        docker {
            image 'cypress/browsers:node18.12.0-chrome107'
        }
    }
    
    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }
        
        stage('Test') {
            parallel {
                stage('Chrome') {
                    steps {
                        sh 'npm run cypress:run:chrome'
                    }
                }
                stage('Firefox') {
                    steps {
                        sh 'npm run cypress:run:firefox'
                    }
                }
            }
        }
        
        stage('Report') {
            steps {
                sh 'npm run report:generate'
                publishHTML([
                    reportDir: 'cypress/results/mochawesome-report',
                    reportFiles: 'index.html',
                    reportName: 'Cypress Test Report'
                ])
            }
        }
    }
    
    post {
        always {
            archiveArtifacts artifacts: 'cypress/screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'cypress/videos/**/*.mp4', allowEmptyArchive: true
            junit 'cypress/results/junit/*.xml'
        }
    }
}
```

### CircleCI

```yaml
# .circleci/config.yml
version: 2.1

orbs:
  cypress: cypress-io/cypress@3

workflows:
  build:
    jobs:
      - cypress/run:
          parallelism: 4
          cypress-command: 'npx cypress run --record --parallel'
          post-steps:
            - store_test_results:
                path: cypress/results
            - store_artifacts:
                path: cypress/screenshots
            - store_artifacts:
                path: cypress/videos
```

## Package.json Scripts

```json
{
  "scripts": {
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "cypress:run:chrome": "cypress run --browser chrome",
    "cypress:run:firefox": "cypress run --browser firefox",
    "cypress:run:headed": "cypress run --headed",
    "cypress:run:record": "cypress run --record --key $CYPRESS_RECORD_KEY",
    "test": "cypress run",
    "test:ci": "cypress run --browser chrome --headless --record",
    "report:merge": "mochawesome-merge cypress/results/mochawesome/*.json > cypress/results/mochawesome/report.json",
    "report:generate": "marge cypress/results/mochawesome/report.json -f report -o cypress/results/mochawesome-report",
    "report:open": "open cypress/results/mochawesome-report/report.html"
  }
}
```

## Environment-Specific Configuration

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

const environments = {
  local: {
    baseUrl: 'http://localhost:3000',
    video: false,
  },
  ci: {
    baseUrl: 'https://staging.example.com',
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
  },
  production: {
    baseUrl: 'https://example.com',
    video: true,
    retries: 2,
  }
}

export default defineConfig({
  e2e: {
    ...environments[process.env.CYPRESS_ENV || 'local'],
    
    setupNodeEvents(on, config) {
      // CI-specific configuration
      if (process.env.CI) {
        config.video = true
        config.videoCompression = 32
        config.numTestsKeptInMemory = 0
        config.defaultCommandTimeout = 10000
      }
      
      return config
    }
  }
})
```

## TypeScript Reporter Configuration

```typescript
// cypress/support/reporter-types.ts
export interface ReporterConfig {
  reportDir: string
  overwrite: boolean
  html: boolean
  json: boolean
  charts: boolean
}

export interface TestResult {
  title: string
  state: 'passed' | 'failed' | 'pending'
  duration: number
  error?: string
}

// cypress.config.ts
const reporterConfig: ReporterConfig = {
  reportDir: 'cypress/results/mochawesome',
  overwrite: false,
  html: true,
  json: true,
  charts: true
}

export default defineConfig({
  e2e: {
    reporter: 'mochawesome',
    reporterOptions: reporterConfig
  }
})
```

## Custom Reporter Events

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Before spec
      on('before:spec', (spec) => {
        console.log(`Running: ${spec.name}`)
      })
      
      // After spec
      on('after:spec', (spec, results) => {
        console.log(`Finished: ${spec.name}`)
        console.log(`Tests: ${results.tests?.length}`)
        console.log(`Passed: ${results.stats.passes}`)
        console.log(`Failed: ${results.stats.failures}`)
      })
      
      // After run
      on('after:run', (results) => {
        console.log('=== Test Run Complete ===')
        console.log(`Total Duration: ${results.totalDuration}ms`)
        console.log(`Total Tests: ${results.totalTests}`)
        console.log(`Passed: ${results.totalPassed}`)
        console.log(`Failed: ${results.totalFailed}`)
      })
      
      return config
    }
  }
})
```

## Parallel Execution

### Cypress Cloud (Dashboard)

```bash
# Record to Cypress Dashboard
npx cypress run --record --key <record-key>

# Parallel execution
npx cypress run --record --parallel --group "CI"
```

```yaml
# GitHub Actions with parallelism
jobs:
  cypress-run:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        containers: [1, 2, 3, 4]
    steps:
      - uses: cypress-io/github-action@v5
        with:
          record: true
          parallel: true
          group: 'GitHub Actions'
        env:
          CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

### Manual Parallelization

```typescript
// split-specs.ts
import * as fs from 'fs'
import * as path from 'path'

const getAllSpecs = (dir: string): string[] => {
  const files: string[] = []
  const items = fs.readdirSync(dir)
  
  items.forEach(item => {
    const fullPath = path.join(dir, item)
    if (fs.statSync(fullPath).isDirectory()) {
      files.push(...getAllSpecs(fullPath))
    } else if (item.endsWith('.cy.ts')) {
      files.push(fullPath)
    }
  })
  
  return files
}

const specs = getAllSpecs('cypress/e2e')
const totalMachines = parseInt(process.env.TOTAL_MACHINES || '1')
const machineIndex = parseInt(process.env.MACHINE_INDEX || '0')

const specsPerMachine = Math.ceil(specs.length / totalMachines)
const startIndex = machineIndex * specsPerMachine
const endIndex = startIndex + specsPerMachine

const specsForThisMachine = specs.slice(startIndex, endIndex)

console.log(specsForThisMachine.join(','))
```

## CI Best Practices

### 1. Fail Fast Configuration

```typescript
export default defineConfig({
  e2e: {
    exitOnFail: true,  // Stop on first failure
    
    setupNodeEvents(on, config) {
      // Fail fast in CI
      if (process.env.CI) {
        config.bail = true
      }
      return config
    }
  }
})
```

### 2. Retry Failed Tests

```typescript
export default defineConfig({
  e2e: {
    retries: {
      runMode: 2,      // Retry twice in CI
      openMode: 0      // No retries locally
    }
  }
})
```

### 3. Record Videos Only on Failure

```typescript
export default defineConfig({
  e2e: {
    video: true,
    videoUploadOnPasses: false,  // Only upload failed test videos
    
    setupNodeEvents(on, config) {
      on('after:spec', (spec, results) => {
        if (results && results.stats.failures === 0) {
          // Delete video if all tests passed
          const videoPath = results.video
          if (videoPath && fs.existsSync(videoPath)) {
            fs.unlinkSync(videoPath)
          }
        }
      })
      
      return config
    }
  }
})
```

### 4. Cache Dependencies

```yaml
# GitHub Actions
- name: Cache dependencies
  uses: actions/cache@v3
  with:
    path: |
      ~/.npm
      ~/.cache/Cypress
    key: ${{ runner.os }}-cypress-${{ hashFiles('**/package-lock.json') }}
```

## Test Result Aggregation

```typescript
// aggregate-results.ts
import * as fs from 'fs'
import * as path from 'path'

interface TestResults {
  totalTests: number
  passed: number
  failed: number
  pending: number
  duration: number
}

const aggregateResults = (resultsDir: string): TestResults => {
  const results: TestResults = {
    totalTests: 0,
    passed: 0,
    failed: 0,
    pending: 0,
    duration: 0
  }
  
  const files = fs.readdirSync(resultsDir)
  
  files.forEach(file => {
    if (file.endsWith('.json')) {
      const filePath = path.join(resultsDir, file)
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      
      results.totalTests += data.stats.tests
      results.passed += data.stats.passes
      results.failed += data.stats.failures
      results.pending += data.stats.pending
      results.duration += data.stats.duration
    }
  })
  
  return results
}

const results = aggregateResults('cypress/results')
console.log(JSON.stringify(results, null, 2))

// Write summary
fs.writeFileSync(
  'cypress/results/summary.json',
  JSON.stringify(results, null, 2)
)
```

## Slack/Email Notifications

```typescript
// cypress.config.ts
import axios from 'axios'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('after:run', async (results) => {
        const message = `
          Cypress Test Run Complete
          Total: ${results.totalTests}
          Passed: ${results.totalPassed}
          Failed: ${results.totalFailed}
          Duration: ${results.totalDuration}ms
        `
        
        // Send to Slack
        if (process.env.SLACK_WEBHOOK_URL) {
          await axios.post(process.env.SLACK_WEBHOOK_URL, {
            text: message
          })
        }
      })
      
      return config
    }
  }
})
```

## Summary

- Multiple reporter options: spec, json, junit, mochawesome
- CI/CD integration with GitHub Actions, GitLab, Jenkins, CircleCI
- TypeScript configuration for reporters
- Parallel execution for faster test runs
- Environment-specific configurations
- Test result aggregation and notifications
- Best practices: retries, video management, caching
- Custom reporter events for advanced workflows

## Next Steps

- **12 - Test Configuration**: Advanced config for CI
- **17 - Parallelism**: Detailed parallel execution
- **24 - Best Practices**: CI/CD optimization

## Quick Reference

```typescript
// Reporter config
export default defineConfig({
  e2e: {
    reporter: 'mochawesome',
    reporterOptions: {
      reportDir: 'results',
      overwrite: false,
      html: true,
      json: true
    }
  }
})

// Run commands
npx cypress run --record --parallel
npx cypress run --browser chrome --headless

// Package.json
{
  "scripts": {
    "test:ci": "cypress run --record",
    "report": "marge results/*.json"
  }
}
```
