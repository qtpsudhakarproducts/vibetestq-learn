# Chapter 16 — Environment Configuration

---

## What You Will Learn

- How to use `.env` files for configuration
- How to switch between local, staging, and production
- How to use Playwright projects for multiple environments
- How to keep secrets out of source code

---

## 16.1 Why Environment Configuration Matters

The same tests must run against different environments:
- **Local** — your machine, during development
- **Staging** — a shared server that mirrors production
- **Production** — the live system (read-only tests only)

The API URLs, credentials, and feature flags are different in each environment. Hard-coding them in test files means editing code to change environments. Configuration files solve this.

---

## 16.2 Environment Variables with dotenv

```bash
npm install -D dotenv
```

Create `.env.local`:

```
BASE_URL=http://localhost:3000
API_KEY=key-abc-123
JWT_SECRET=my-super-secret-key
TEST_USERNAME=admin
TEST_PASSWORD=password123
```

Create `.env.staging`:

```
BASE_URL=https://staging.company.com
API_KEY=staging-key-xyz-789
JWT_SECRET=staging-secret-key
TEST_USERNAME=staging-admin
TEST_PASSWORD=staging-password456
```

**Important:** Add all `.env.*` files to `.gitignore`. Never commit secrets to source control.

---

## 16.3 Loading Configuration

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';
import * as dotenv from 'dotenv';

// Load the right .env file based on the TEST_ENV variable
const env = process.env.TEST_ENV || 'local';
dotenv.config({ path: `.env.${env}` });

export default defineConfig({
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    extraHTTPHeaders: {
      'X-API-Key': process.env.API_KEY || '',
    },
  },
});
```

Run tests against different environments:

```bash
TEST_ENV=local   npx playwright test
TEST_ENV=staging npx playwright test
```

---

## 16.4 Playwright Projects for Multiple Environments

Playwright `projects` let you define multiple configurations in a single config file. Each project runs the same tests with different settings.

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  projects: [
    {
      name: 'local',
      use: {
        baseURL: 'http://localhost:3000',
        extraHTTPHeaders: { 'X-API-Key': 'key-abc-123' },
      },
    },
    {
      name: 'staging',
      use: {
        baseURL: 'https://staging.company.com',
        extraHTTPHeaders: { 'X-API-Key': process.env.STAGING_API_KEY || '' },
      },
    },
    {
      name: 'production',
      // Only run read-only tests in production
      testMatch: '**/readonly/**/*.spec.ts',
      use: {
        baseURL: 'https://api.company.com',
        extraHTTPHeaders: { 'X-API-Key': process.env.PROD_API_KEY || '' },
      },
    },
  ],
});
```

Run a specific project:

```bash
npx playwright test --project=staging
npx playwright test --project=local
```

---

## 16.5 Accessing Configuration in Tests

```typescript
// tests/employees.spec.ts
import { test, expect } from '@playwright/test';

test('environment-aware test', async ({ request }) => {
  // baseURL and headers come from the project config
  // The test itself does not know which environment it is running against
  const response = await request.get('/employees');

  expect(response.status()).toBe(200);

  // Optional: log which environment is being tested
  console.log(`Running against: ${process.env.BASE_URL}`);
});
```

Tests that are environment-aware use `process.env` directly:

```typescript
test('admin login', async ({ request }) => {
  const response = await request.post('/login', {
    data: {
      username: process.env.TEST_USERNAME,
      password: process.env.TEST_PASSWORD,
    },
  });

  expect(response.status()).toBe(200);
});
```

---

## Interview Questions — Chapter 16

**Q1. Why should API credentials and secrets never be hardcoded in test files?**

Test files are committed to source control. Hardcoded secrets — API keys, passwords, JWT secrets — are visible to anyone with access to the repository. If the repository is public, secrets are exposed to everyone. Even in private repositories, secrets should be managed separately from code so they can be rotated without changing source files.

**Q2. How do you switch between local and staging environments in a Playwright test suite?**

Use an environment variable like `TEST_ENV` to select which `.env` file to load. The `playwright.config.ts` reads `BASE_URL` and other settings from the loaded env file. Tests do not change — only the config changes. Run `TEST_ENV=staging npx playwright test` to target staging.

**Q3. What is a Playwright project and when would you use multiple projects?**

A project is a named configuration within `playwright.config.ts` with its own `use` settings. You would use multiple projects to run the same tests against different environments — local, staging, production — or to run tests with different auth configurations (admin vs read-only user). Each project can also restrict which test files it runs, so production projects can exclude destructive tests.

**Q4. How do you store secrets in CI without committing them to source control?**

Use the CI platform's secret management — GitHub Actions Secrets, GitLab CI Variables, or AWS Secrets Manager. Secrets are stored encrypted in the CI platform and injected as environment variables at runtime. Test code reads them from `process.env` — the same way it reads from `.env` files locally.

---
