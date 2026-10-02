# 01 - Introduction and Installation

## What is Cypress?

Cypress is a next-generation front-end testing tool built for the modern web. It is a JavaScript-based end-to-end testing framework that doesn't use Selenium. Cypress runs directly in the browser, providing fast, reliable testing for anything that runs in a browser.

### Key Features

- **Time Travel**: Cypress takes snapshots as tests run, allowing you to hover over commands in the Test Runner to see exactly what happened at each step
- **Debuggability**: Readable errors and stack traces make debugging fast and easy
- **Automatic Waiting**: Never add waits or sleeps to tests - Cypress automatically waits for commands and assertions
- **Spies, Stubs, and Clocks**: Verify and control the behavior of functions, server responses, and timers
- **Network Traffic Control**: Easily control, stub, and test edge cases without involving your server
- **Screenshots and Videos**: View screenshots automatically taken on failure, or videos of entire test suite when run headlessly
- **Cross-browser Testing**: Run tests within Chrome, Edge, Firefox, and Electron browsers

### Cypress Architecture

Unlike Selenium-based tools, Cypress has a unique architecture:

- **Runs in the same run-loop**: Cypress executes in the same run-loop as your application
- **Direct access to DOM**: Can directly access all DOM objects and browser APIs
- **Network layer access**: Can read and alter network traffic on the fly
- **Real-time reloads**: Automatically reloads when you save test files

### Why TypeScript with Cypress?

TypeScript adds significant value to Cypress testing:

1. **Type Safety**: Catch errors at compile-time rather than runtime
2. **IntelliSense**: Better autocomplete and documentation in your IDE
3. **Refactoring**: Safer refactoring with type checking
4. **Code Quality**: Enforces better coding practices
5. **Team Collaboration**: Makes code more maintainable and understandable

## Installation

### Prerequisites

Before installing Cypress, ensure you have:

- **Node.js**: Version 18.x, 20.x, 22.x or higher
- **npm** or **yarn**: Package manager
- **Operating System**: macOS, Linux, or Windows

Check your Node.js version:
```bash
node --version
```

### Step 1: Create a New Project

```bash
# Create project directory
mkdir my-cypress-project
cd my-cypress-project

# Initialize npm project
npm init -y
```

### Step 2: Install Cypress

```bash
# Using npm
npm install --save-dev cypress

# Using yarn
yarn add --dev cypress
```

### Step 3: Install TypeScript

```bash
# Install TypeScript and types
npm install --save-dev typescript @types/node

# Install Cypress TypeScript definitions (included with Cypress 10+)
```

### Step 4: Configure TypeScript

Create a `tsconfig.json` file in your project root:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "commonjs",
    "moduleResolution": "node",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "types": ["cypress", "node"]
  },
  "include": [
    "cypress/**/*.ts",
    "cypress.config.ts"
  ],
  "exclude": [
    "node_modules"
  ]
}
```

### Step 5: Open Cypress for First Time

```bash
# Open Cypress Test Runner
npx cypress open
```

This will:
1. Create the default Cypress folder structure
2. Add example test files
3. Create `cypress.config.js` (which we'll convert to TypeScript)

### Step 6: Convert to TypeScript Configuration

Rename `cypress.config.js` to `cypress.config.ts`:

```typescript
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // implement node event listeners here
    },
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
  },
  viewportWidth: 1280,
  viewportHeight: 720,
  video: false,
  screenshotOnRunFailure: true,
})
```

## Project Structure

After installation and configuration, your project structure should look like:

```
my-cypress-project/
├── node_modules/
├── cypress/
│   ├── e2e/
│   │   └── spec.cy.ts          # Test files
│   ├── fixtures/
│   │   └── example.json        # Test data
│   ├── support/
│   │   ├── commands.ts         # Custom commands
│   │   └── e2e.ts             # Support file
│   └── downloads/              # Downloaded files during tests
├── cypress.config.ts           # Cypress configuration
├── tsconfig.json              # TypeScript configuration
└── package.json               # Project dependencies
```

### Key Folders Explained

**cypress/e2e/**: Contains your test specification files
- Test files should end with `.cy.ts` or `.cy.tsx`
- Organized by feature or page

**cypress/fixtures/**: Test data in JSON format
- Used for stubbing network requests
- Provides consistent test data

**cypress/support/**: Custom commands and global configurations
- `commands.ts`: Define reusable custom commands
- `e2e.ts`: Runs before every test file

**cypress/downloads/**: Automatically created for downloaded files during tests

## First Test in TypeScript

Create your first test file at `cypress/e2e/first-test.cy.ts`:

```typescript
describe('My First Test', () => {
  it('Visits the app and checks title', () => {
    cy.visit('https://example.cypress.io')
    cy.contains('type').click()
    cy.url().should('include', '/commands/actions')
    cy.get('.action-email')
      .type('test@email.com')
      .should('have.value', 'test@email.com')
  })
})
```

### Understanding TypeScript in Cypress

1. **Type Inference**: Cypress provides built-in types for all commands
```typescript
cy.get('button')        // Chainable<JQuery<HTMLElement>>
cy.contains('Submit')   // Chainable<JQuery<HTMLElement>>
```

2. **Custom Types**: You can create interfaces for your data
```typescript
interface User {
  username: string
  email: string
  password: string
}

const user: User = {
  username: 'testuser',
  email: 'test@example.com',
  password: 'securePass123'
}

cy.get('#username').type(user.username)
```

3. **Type-safe Fixtures**:
```typescript
// cypress/fixtures/users.json
interface UserFixture {
  name: string
  email: string
}

cy.fixture<UserFixture>('users').then((users) => {
  cy.get('#email').type(users.email)
})
```

## Running Tests

### Interactive Mode (Test Runner)

```bash
# Open Cypress Test Runner
npx cypress open

# Or add to package.json scripts
npm run cypress:open
```

### Headless Mode (CI/CD)

```bash
# Run all tests headlessly
npx cypress run

# Run specific test file
npx cypress run --spec "cypress/e2e/login.cy.ts"

# Run in specific browser
npx cypress run --browser chrome

# Or add to package.json scripts
npm run cypress:run
```

### Package.json Scripts

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "cypress:run:chrome": "cypress run --browser chrome",
    "cypress:run:firefox": "cypress run --browser firefox",
    "test": "cypress run",
    "test:headed": "cypress run --headed"
  }
}
```

## Cypress vs Other Tools

| Feature | Cypress | Selenium | Playwright |
|---------|---------|----------|------------|
| Language | JavaScript/TypeScript | Multiple | JavaScript/TypeScript, Python, Java, C# |
| Architecture | Runs in browser | WebDriver protocol | Browser control API |
| Setup | Simple | Complex | Moderate |
| Speed | Fast | Slower | Fast |
| Debugging | Excellent | Moderate | Excellent |
| Auto-waiting | Yes | No | Yes |
| Network stubbing | Built-in | Requires proxy | Built-in |
| Multi-tab | Limited | Yes | Yes |

## Common Installation Issues

### Issue 1: Cypress Binary Not Found
```bash
# Clear cache and reinstall
npx cypress cache clear
npm install --save-dev cypress
```

### Issue 2: TypeScript Errors
```bash
# Ensure types are installed
npm install --save-dev @types/node

# Add to tsconfig.json
"types": ["cypress", "node"]
```

### Issue 3: Module Resolution Issues
```typescript
// In tsconfig.json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "esModuleInterop": true
  }
}
```

## Best Practices for Getting Started

1. **Use TypeScript from the start**: Don't convert later; start with TS
2. **Keep tests independent**: Each test should run in isolation
3. **Use data attributes**: Add `data-cy` attributes for reliable selectors
4. **Organize by feature**: Structure tests by application features
5. **Use fixtures**: Store test data in fixture files
6. **Custom commands**: Create reusable commands in `commands.ts`
7. **Page objects**: Consider using page object pattern for complex apps

## Next Steps

Now that you have Cypress with TypeScript installed:

1. Explore the Test Runner interface
2. Learn about Cypress architecture and command execution
3. Understand locator strategies
4. Master basic and advanced interactions
5. Learn about assertions and waits

Continue to **02 - Architecture and Manual Launch** to understand how Cypress works under the hood.

## Quick Reference

```bash
# Installation
npm install --save-dev cypress typescript @types/node

# Open Test Runner
npx cypress open

# Run all tests
npx cypress run

# Run specific test
npx cypress run --spec "cypress/e2e/test.cy.ts"

# Run in specific browser
npx cypress run --browser chrome

# Clear cache
npx cypress cache clear
```

## Summary

- Cypress is a modern JavaScript testing framework that runs in the browser
- TypeScript adds type safety and better developer experience
- Installation is straightforward with npm/yarn
- Project structure is organized and conventional
- Tests are written in TypeScript with full type support
- Multiple run modes: interactive (open) and headless (run)
- Built-in features like automatic waiting, time travel, and debugging make testing easier
