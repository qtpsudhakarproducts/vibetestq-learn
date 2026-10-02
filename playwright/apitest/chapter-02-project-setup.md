# Chapter 2 — Project Setup

---

## What You Will Learn

- How to create an Express.js API server from scratch
- How to set up a Playwright test project
- How to run both side by side during development
- The shared foundation code all subsequent chapters build on

---

## 2.1 The Two Projects

You will build two things side by side throughout this book.

The **API server** is built with Express.js. It stores employee data in memory and exposes endpoints for creating, reading, updating, and deleting employees.

The **test suite** is built with Playwright. It sends real HTTP requests to the API server and verifies the responses.

Running them together is simple. The server runs in one terminal. Playwright runs in another.

---

## 2.2 Setting Up the API Server

Create a new folder and initialise a Node.js project:

```bash
mkdir employee-api
cd employee-api
npm init -y
npm install express
```

Create a file called `server.js`. This file holds the entire API. Start with the foundation — you will add endpoints one by one in later chapters.

```javascript
// server.js

const express = require('express');
const app = express();

// Parse incoming request bodies as JSON.
// Without this line, req.body is always undefined on POST and PUT requests.
app.use(express.json());

// In-memory storage.
// This array resets every time you restart the server.
// A real application would use a database.
let employees = [];
let nextId = 1;

// Valid department names.
// Any other value is rejected during validation.
const VALID_DEPARTMENTS = ['Engineering', 'HR', 'Finance', 'Marketing'];

// Shared validation function.
// Called by POST and PUT before saving anything.
// Returns an array of error messages. An empty array means all fields are valid.
function validateEmployee(data) {
  const errors = [];

  if (!data.firstName)  errors.push('firstName is required');
  if (!data.lastName)   errors.push('lastName is required');
  if (!data.email)      errors.push('email is required');
  if (!data.department) errors.push('department is required');
  if (!data.role)       errors.push('role is required');

  if (data.department && !VALID_DEPARTMENTS.includes(data.department)) {
    errors.push(`department must be one of: ${VALID_DEPARTMENTS.join(', ')}`);
  }

  return errors;
}

// Endpoints go here — added in later chapters

app.listen(3000, () => {
  console.log('Employee API running at http://localhost:3000');
});
```

Start the server:

```bash
node server.js
# Employee API running at http://localhost:3000
```

---

## 2.3 Setting Up the Playwright Test Project

Create a second folder in a separate terminal:

```bash
mkdir employee-tests
cd employee-tests
npm init playwright@latest
```

When prompted:
- Choose **TypeScript**
- Place tests in the `tests` folder
- Do not add a GitHub Actions workflow yet — that comes in Chapter 19

Open `playwright.config.ts` and set the base URL:

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'http://localhost:3000',
  },
  // Run tests sequentially during development to keep output readable
  workers: 1,
});
```

Create your first test file:

```bash
touch tests/employees.spec.ts
```

All test code in Chapters 3 through 11 goes in this file.

---

## 2.4 Running Both Together

Open two terminals side by side.

**Terminal 1 — API server:**

```bash
cd employee-api
node server.js
# Employee API running at http://localhost:3000
```

**Terminal 2 — Playwright:**

```bash
cd employee-tests
npx playwright test
```

Playwright reads `baseURL` from the config. Every `request.get('/employees')` call in a test becomes a real HTTP request to `http://localhost:3000/employees`.

---

## 2.5 Understanding the Foundation Code

Before writing any endpoints, understand what the foundation code does.

**`app.use(express.json())`**

This is middleware. It runs on every incoming request before any route handler. It reads the raw request body and parses it as JSON, making it available at `req.body`. Without this line, `req.body` is always `undefined` on POST and PUT requests.

**`let employees = []`**

This is the in-memory database. It is a plain JavaScript array. Every employee you create is stored here. When the server restarts, it resets to empty. A real application would use a database like PostgreSQL or MongoDB.

**`function validateEmployee(data)`**

This shared function runs before saving anything. It checks that all required fields are present and that the department is one of the four valid values. It returns an array of error messages. An empty array means validation passed.

**Why in-memory storage?**

A real database adds complexity — installation, connection strings, migrations, seed data. In-memory storage lets this book focus on API testing concepts without database setup. The API behaviour is identical either way.

---

## 2.6 The Employee Data Shape

Every employee in this API has exactly these fields:

| Field | Type | Who Sets It | Description |
|-------|------|-------------|-------------|
| `id` | string | Server | Auto-generated. Format: `emp-001`, `emp-002`, ... |
| `firstName` | string | Client | Required |
| `lastName` | string | Client | Required |
| `email` | string | Client | Required. Must be unique. |
| `department` | string | Client | Required. Must be one of the four valid values. |
| `role` | string | Client | Required |
| `createdAt` | string | Server | ISO timestamp. Set at creation, never changes. |

The client sends five fields. The server adds `id` and `createdAt` and returns all seven.

As a tester, never send `id` or `createdAt` in a request. Never hardcode them in an assertion. Always read them from the response.

---

## Interview Questions — Chapter 2

**Q1. What is Express.js and why is it used in API testing?**

Express.js is a Node.js web framework for building APIs. It is used in API testing courses because it is simple to set up, requires minimal configuration, and produces a real HTTP server that Playwright can send requests to. It lets learners see both sides of the API interaction in one place.

**Q2. What does `app.use(express.json())` do and why is it required?**

It is middleware that parses the raw HTTP request body as JSON and makes it available at `req.body`. Without it, `req.body` is `undefined` on every POST and PUT request. This means the server cannot read any data the client sends. It must be added before any route handlers.

**Q3. What is `baseURL` in `playwright.config.ts` and what does it do?**

`baseURL` is the root URL that Playwright prepends to every relative path in a test. Setting it to `http://localhost:3000` means `request.get('/employees')` in a test becomes `request.get('http://localhost:3000/employees')`. It lets you change the target environment — from local to staging to production — by changing one value in the config file.

**Q4. Why does the employee API use in-memory storage instead of a real database?**

In-memory storage (a JavaScript array) eliminates the need to install, configure, and connect to a database. This lets the course focus on API testing concepts without database setup complexity. The API behaviour — endpoints, request formats, response shapes, status codes — is the same regardless of how data is stored.

**Q5. What are the two server-generated fields in the employee API and why does the client not send them?**

`id` and `createdAt`. The `id` is generated by the server to ensure uniqueness and correct formatting. The `createdAt` timestamp records when the record was created — only the server knows the exact time. Letting the client set these values would allow tampering and inconsistency.

**Q6. In a test, when should you read the employee ID from the response rather than hardcode it?**

Always. The server generates IDs at runtime. They increment with each new record. If tests run in a different order, or if the server restarts between runs, hardcoded IDs like `emp-001` will point to the wrong employee or no employee at all. Reading the ID from the response makes the test independent of server state.

---
