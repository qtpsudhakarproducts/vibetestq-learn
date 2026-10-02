# 13 - Test Configuration

## Introduction to Cypress Configuration

Cypress configuration controls how your tests run, what browsers to use, timeouts, base URLs, and much more. Understanding configuration is essential for customizing Cypress to fit your project needs with TypeScript.

## cypress.config.ts

### Basic Configuration Structure

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    // E2E testing configuration
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      return config
    },
  },
  
  component: {
    // Component testing configuration
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
  
  // Global configuration
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
})
```

### Type-Safe Configuration

```typescript
import { defineConfig } from 'cypress'

interface CustomConfig {
  apiUrl: string
  adminUsername: string
  testTimeout: number
}

export default defineConfig<CustomConfig>({
  e2e: {
    baseUrl: 'http://localhost:3000',
    
    // Custom properties
    env: {
      apiUrl: 'http://localhost:4000/api',
      adminUsername: 'admin@example.com',
      testTimeout: 10000,
    },
    
    setupNodeEvents(on, config) {
      // Access custom config
      console.log('API URL:', config.env.apiUrl)
      return config
    },
  },
})
```

## Configuration Options

### Timeouts

```typescript
export default defineConfig({
  e2e: {
    // Command timeout (most commands)
    defaultCommandTimeout: 4000,
    
    // Page load timeout
    pageLoadTimeout: 60000,
    
    // Request timeout
    requestTimeout: 5000,
    
    // Response timeout
    responseTimeout: 30000,
    
    // Task timeout
    taskTimeout: 60000,
    
    // Command execution timeout
    execTimeout: 60000,
  },
})
```

### Viewport Configuration

```typescript
export default defineConfig({
  e2e: {
    // Default viewport size
    viewportWidth: 1280,
    viewportHeight: 720,
    
    // Or use named viewports in tests:
    // cy.viewport('iphone-6')
    // cy.viewport('ipad-2')
  },
})
```

### Base URL

```typescript
export default defineConfig({
  e2e: {
    // Base URL for cy.visit()
    baseUrl: 'http://localhost:3000',
    
    setupNodeEvents(on, config) {
      // Override based on environment
      const environment = config.env.ENVIRONMENT || 'local'
      
      const baseUrls: Record<string, string> = {
        local: 'http://localhost:3000',
        dev: 'https://dev.example.com',
        staging: 'https://staging.example.com',
        production: 'https://example.com',
      }
      
      config.baseUrl = baseUrls[environment]
      return config
    },
  },
})
```

### File Patterns

```typescript
export default defineConfig({
  e2e: {
    // Test file pattern
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    
    // Exclude patterns
    excludeSpecPattern: [
      '**/snapshots/*',
      '**/node_modules/*',
      '**/__fixtures__/*',
    ],
    
    // Support file
    supportFile: 'cypress/support/e2e.ts',
    
    // Fixtures folder
    fixturesFolder: 'cypress/fixtures',
    
    // Screenshots folder
    screenshotsFolder: 'cypress/screenshots',
    
    // Videos folder
    videosFolder: 'cypress/videos',
    
    // Downloads folder
    downloadsFolder: 'cypress/downloads',
  },
})
```

## Environment Variables

### Using env Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    env: {
      apiUrl: 'http://localhost:4000',
      username: 'testuser',
      password: 'testpass',
      feature_flags: {
        newUI: true,
        betaFeature: false,
      },
    },
  },
})

// In tests
describe('Environment Variables', () => {
  it('accesses env variables', () => {
    const apiUrl = Cypress.env('apiUrl')
    const username = Cypress.env('username')
    
    cy.log(`API URL: ${apiUrl}`)
    cy.log(`Username: ${username}`)
  })
  
  it('accesses nested env', () => {
    const flags = Cypress.env('feature_flags')
    expect(flags.newUI).to.be.true
  })
})
```

### Type-Safe Environment Variables

```typescript
// cypress/support/env.d.ts
declare namespace Cypress {
  interface Env {
    apiUrl: string
    username: string
    password: string
    feature_flags: {
      newUI: boolean
      betaFeature: boolean
    }
  }
}

// In tests with type safety
describe('Type-Safe Env', () => {
  it('uses typed env variables', () => {
    const apiUrl: string = Cypress.env('apiUrl')
    const flags = Cypress.env('feature_flags')
    
    expect(apiUrl).to.be.a('string')
    expect(flags.newUI).to.be.a('boolean')
  })
})
```

### Environment-Specific Config Files

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'
import * as fs from 'fs'
import * as path from 'path'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Load environment-specific config
      const environment = config.env.ENVIRONMENT || 'local'
      const configFile = path.join(
        __dirname,
        'cypress',
        'config',
        `${environment}.json`
      )
      
      if (fs.existsSync(configFile)) {
        const envConfig = JSON.parse(fs.readFileSync(configFile, 'utf-8'))
        config = { ...config, ...envConfig }
      }
      
      return config
    },
  },
})

// cypress/config/local.json
{
  "baseUrl": "http://localhost:3000",
  "env": {
    "apiUrl": "http://localhost:4000"
  }
}

// cypress/config/staging.json
{
  "baseUrl": "https://staging.example.com",
  "env": {
    "apiUrl": "https://api-staging.example.com"
  }
}
```

### Command Line Environment Variables

```bash
# Set single variable
npx cypress run --env apiUrl=http://example.com

# Set multiple variables
npx cypress run --env apiUrl=http://example.com,username=admin

# Set from OS environment
export CYPRESS_BASE_URL=http://localhost:3000
npx cypress run

# Override in package.json
{
  "scripts": {
    "test:local": "cypress run --env ENVIRONMENT=local",
    "test:staging": "cypress run --env ENVIRONMENT=staging",
    "test:prod": "cypress run --env ENVIRONMENT=production"
  }
}
```

## Browser Configuration

### Default Browser

```typescript
export default defineConfig({
  e2e: {
    // Default browser (if not specified on command line)
    browser: 'chrome',
    
    setupNodeEvents(on, config) {
      // Customize browser launch
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome') {
          // Chrome-specific flags
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--no-sandbox')
          
          // Set download directory
          launchOptions.preferences.default = {
            'download': {
              'default_directory': 'cypress/downloads',
            },
          }
        }
        
        if (browser.name === 'firefox') {
          // Firefox-specific preferences
          launchOptions.preferences['browser.download.dir'] = 'cypress/downloads'
        }
        
        return launchOptions
      })
      
      return config
    },
  },
})
```

### Headless Configuration

```typescript
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('before:browser:launch', (browser, launchOptions) => {
        // Add headless flags for CI
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--disable-gpu')
        }
        
        return launchOptions
      })
      
      return config
    },
  },
})
```

## Retry Configuration

### Test Retries

```typescript
export default defineConfig({
  e2e: {
    // Retry failed tests
    retries: {
      runMode: 2,      // Retry twice in cypress run
      openMode: 0,     // No retries in cypress open
    },
    
    // Or simple number for both modes
    // retries: 2,
  },
})

// Per-test retry configuration
describe('Flaky Tests', () => {
  it('may fail sometimes', {
    retries: 3
  }, () => {
    // Test code
  })
  
  it('should not retry', {
    retries: 0
  }, () => {
    // Test code
  })
})
```

## Screenshots and Videos

### Screenshot Configuration

```typescript
export default defineConfig({
  e2e: {
    // Screenshot settings
    screenshotOnRunFailure: true,
    screenshotsFolder: 'cypress/screenshots',
    
    // Trash assets before test run
    trashAssetsBeforeRuns: true,
    
    setupNodeEvents(on, config) {
      on('after:screenshot', (details) => {
        console.log('Screenshot taken:', details.path)
        
        // Can modify screenshot details
        return details
      })
      
      return config
    },
  },
})
```

### Video Configuration

```typescript
export default defineConfig({
  e2e: {
    // Video settings
    video: true,
    videoCompression: 32,  // 0-51, lower = better quality
    videosFolder: 'cypress/videos',
    
    // Upload videos on failure only
    videoUploadOnPasses: false,
  },
})
```

## Node Events

### Setting Up Event Listeners

```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Before browser launch
      on('before:browser:launch', (browser, launchOptions) => {
        console.log('Launching browser:', browser.name)
        return launchOptions
      })
      
      // Before spec file
      on('before:spec', (spec) => {
        console.log('Running spec:', spec.name)
      })
      
      // After spec file
      on('after:spec', (spec, results) => {
        console.log('Spec complete:', spec.name)
        console.log('Tests:', results.tests?.length)
        console.log('Passes:', results.stats?.passes)
        console.log('Failures:', results.stats?.failures)
      })
      
      // Before run
      on('before:run', (details) => {
        console.log('Starting test run')
        console.log('Specs:', details.specs?.length)
      })
      
      // After run
      on('after:run', (results) => {
        console.log('Test run complete')
        console.log('Total tests:', results.totalTests)
        console.log('Total passed:', results.totalPassed)
        console.log('Total failed:', results.totalFailed)
      })
      
      return config
    },
  },
})
```

## Tasks

### Custom Tasks

```typescript
import { defineConfig } from 'cypress'
import * as fs from 'fs'
import * as path from 'path'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        // Read file task
        readFile(filePath: string): string | null {
          try {
            return fs.readFileSync(filePath, 'utf-8')
          } catch (e) {
            return null
          }
        },
        
        // Write file task
        writeFile({ filePath, content }: { filePath: string; content: string }): null {
          fs.writeFileSync(filePath, content)
          return null
        },
        
        // Database query task
        async queryDatabase(query: string): Promise<any[]> {
          // Your database logic here
          return []
        },
        
        // Seed database task
        async seedDatabase(): Promise<null> {
          // Seed logic here
          return null
        },
        
        // Log task
        log(message: string): null {
          console.log('CYPRESS LOG:', message)
          return null
        },
        
        // Generate data task
        generateTestData(count: number): any[] {
          return Array.from({ length: count }, (_, i) => ({
            id: i + 1,
            name: `User ${i + 1}`,
            email: `user${i + 1}@example.com`,
          }))
        },
      })
      
      return config
    },
  },
})

// Using tasks in tests
describe('Custom Tasks', () => {
  it('uses custom tasks', () => {
    cy.task('log', 'Starting test')
    
    cy.task<string>('readFile', 'data.json')
      .then((content) => {
        expect(content).to.not.be.null
      })
    
    cy.task('generateTestData', 5)
      .then((data) => {
        expect(data).to.have.length(5)
      })
  })
})
```

### Type-Safe Tasks

```typescript
// cypress/support/tasks.ts
export interface CypressTasks {
  readFile(filePath: string): string | null
  writeFile(params: { filePath: string; content: string }): null
  log(message: string): null
  queryDatabase(query: string): Promise<any[]>
  generateTestData(count: number): any[]
}

declare global {
  namespace Cypress {
    interface Chainable {
      task<T = any>(
        event: keyof CypressTasks,
        arg?: any,
        options?: Partial<Loggable & Timeoutable>
      ): Chainable<T>
    }
  }
}

// In tests with full type safety
describe('Type-Safe Tasks', () => {
  it('uses typed tasks', () => {
    cy.task<string>('readFile', 'config.json')
      .then((content) => {
        // content is typed as string | null
        expect(content).to.be.a('string')
      })
    
    cy.task<any[]>('generateTestData', 10)
      .should('have.length', 10)
  })
})
```

## Plugin Configuration

### Using Cypress Plugins

```typescript
import { defineConfig } from 'cypress'
import webpackPreprocessor from '@cypress/webpack-preprocessor'

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Webpack preprocessor
      const options = {
        webpackOptions: {
          resolve: {
            extensions: ['.ts', '.tsx', '.js'],
          },
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                loader: 'ts-loader',
                options: { transpileOnly: true },
              },
            ],
          },
        },
      }
      
      on('file:preprocessor', webpackPreprocessor(options))
      
      return config
    },
  },
})
```

## Configuration Best Practices

### Environment-Based Configuration

```typescript
interface EnvironmentConfig {
  baseUrl: string
  apiUrl: string
  timeout: number
}

const environments: Record<string, EnvironmentConfig> = {
  local: {
    baseUrl: 'http://localhost:3000',
    apiUrl: 'http://localhost:4000',
    timeout: 10000,
  },
  staging: {
    baseUrl: 'https://staging.example.com',
    apiUrl: 'https://api-staging.example.com',
    timeout: 15000,
  },
  production: {
    baseUrl: 'https://example.com',
    apiUrl: 'https://api.example.com',
    timeout: 20000,
  },
}

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const env = config.env.ENVIRONMENT || 'local'
      const envConfig = environments[env]
      
      config.baseUrl = envConfig.baseUrl
      config.env.apiUrl = envConfig.apiUrl
      config.defaultCommandTimeout = envConfig.timeout
      
      return config
    },
  },
})
```

### Secrets Management

```typescript
import { defineConfig } from 'cypress'
import * as dotenv from 'dotenv'

// Load .env file
dotenv.config()

export default defineConfig({
  e2e: {
    env: {
      // Don't commit secrets to config file
      // Load from environment variables
      adminPassword: process.env.ADMIN_PASSWORD,
      apiKey: process.env.API_KEY,
      dbConnectionString: process.env.DB_CONNECTION,
    },
    
    setupNodeEvents(on, config) {
      // Validate required secrets
      const requiredEnvVars = ['ADMIN_PASSWORD', 'API_KEY']
      
      requiredEnvVars.forEach((varName) => {
        if (!process.env[varName]) {
          throw new Error(`Missing required environment variable: ${varName}`)
        }
      })
      
      return config
    },
  },
})
```

## Dynamic Configuration

### Modifying Config at Runtime

```typescript
export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      // Modify based on browser
      on('before:browser:launch', (browser) => {
        if (browser.name === 'chrome') {
          config.chromeWebSecurity = false
        }
        return config
      })
      
      // Modify based on spec
      on('before:spec', (spec) => {
        if (spec.name.includes('slow')) {
          config.defaultCommandTimeout = 10000
        }
      })
      
      return config
    },
  },
})
```

## Multiple Configuration Files

### Config Per Environment

```typescript
// cypress.config.ts (base)
import { defineConfig } from 'cypress'
import { local } from './cypress/config/local.config'
import { staging } from './cypress/config/staging.config'
import { production } from './cypress/config/production.config'

const configs = { local, staging, production }

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      const env = config.env.ENVIRONMENT || 'local'
      const envConfig = configs[env as keyof typeof configs]
      
      return { ...config, ...envConfig }
    },
  },
})

// cypress/config/local.config.ts
export const local = {
  baseUrl: 'http://localhost:3000',
  env: {
    apiUrl: 'http://localhost:4000',
  },
}

// cypress/config/staging.config.ts
export const staging = {
  baseUrl: 'https://staging.example.com',
  env: {
    apiUrl: 'https://api-staging.example.com',
  },
}
```

## Configuration Helpers

```typescript
// cypress/support/config-helpers.ts
export class ConfigHelper {
  static getBaseUrl(): string {
    return Cypress.config('baseUrl') || ''
  }
  
  static getEnv<T = any>(key: string): T {
    return Cypress.env(key) as T
  }
  
  static isEnvironment(env: string): boolean {
    return Cypress.env('ENVIRONMENT') === env
  }
  
  static getTimeout(type: 'command' | 'page' | 'request'): number {
    switch (type) {
      case 'command':
        return Cypress.config('defaultCommandTimeout')
      case 'page':
        return Cypress.config('pageLoadTimeout')
      case 'request':
        return Cypress.config('requestTimeout')
      default:
        return 4000
    }
  }
}

// Usage in tests
describe('Config Helpers', () => {
  it('uses config helpers', () => {
    const baseUrl = ConfigHelper.getBaseUrl()
    const apiUrl = ConfigHelper.getEnv<string>('apiUrl')
    
    if (ConfigHelper.isEnvironment('production')) {
      // Production-specific logic
    }
  })
})
```

## Summary

- `cypress.config.ts` is the main configuration file
- Environment variables accessed via `Cypress.env()`
- Node events allow server-side customization
- Tasks enable Node.js code execution from tests
- Browser launch can be customized per browser
- Configuration can be environment-specific
- TypeScript provides type-safe configuration
- Secrets should be loaded from environment variables
- Retries help with flaky tests
- Screenshots and videos configurable per environment

## Next Steps

- **13 - Debugging Tools**: Debug with proper configuration
- **15 - Reporters and CI**: Configure for CI/CD pipelines
- **21 - Authentication**: Environment-specific auth configuration

## Quick Reference

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    defaultCommandTimeout: 4000,
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    
    env: {
      apiUrl: 'http://localhost:4000'
    },
    
    setupNodeEvents(on, config) {
      on('task', {
        log(msg) { console.log(msg); return null }
      })
      return config
    }
  }
})

// In tests
Cypress.env('apiUrl')
Cypress.config('baseUrl')
cy.task('log', 'message')
```
