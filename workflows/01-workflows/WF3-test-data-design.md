# WF3 — Test Data Design

> Test data setup is the quiet sprint killer. AI makes it generation-speed — if you keep the data safe and realistic.

---

## 1. What it is

Given a test scenario, AI generates synthetic test data matching the shape, constraints, and edge cases required. The data is PII-safe, edge-cases are seeded intentionally, and cleanup happens automatically after the test.

No more "the test worked yesterday because Anil's user account still existed."

---

## 2. Who owns it

**QA engineers own generation.** QA leads own the data safety rules (PII, GDPR, test env policies).

Dev owns the schema the data conforms to — QA/AI reads it, doesn't invent it.

---

## 3. Tools needed

- **Category 2 — MCPs:** Filesystem MCP to read schema, Database MCP (if you have one) to seed
- **Category 3 — AI IDE:** for generation
- Optional: your own test-data seeding library

---

## 4. Step-by-step setup

### Step 1: Define data safety rules

Save as `.ai/conventions/test-data-rules.md`:

```markdown
# Test data rules — non-negotiable

## Never use
- Real customer names
- Real email addresses (even if hashed)
- Real phone numbers
- Real credit card PANs (use BIN-safe test numbers only)
- Real addresses

## Always use
- Faker patterns: "Test_{uuid}@example.com" for emails
- Prefix all test records with "TEST_" so they're identifiable
- Use the documented test card numbers (e.g., 4242 4242 4242 4242)

## Environment rules
- Test data in staging only — never in prod
- Clean up within 24 hours unless feature under test requires aging
- No cross-tenant data leaks in multi-tenant tests

## Compliance
- GDPR: no EU personal data, even synthetic-looking
- PCI: no card tokens outside certified test ranges
```

Every AI prompt in this workflow must reference this file.

### Step 2: Define the generation prompt

Save as `.ai/prompts/wf3-generate-data.md`:

```markdown
# Task: Generate test data for a scenario

## Context files
1. .ai/conventions/test-data-rules.md — SAFETY RULES, non-negotiable
2. scenarios/REQ-{id}-scenarios.md — the scenario needing data
3. src/models/ or wherever schemas live — the data shape
4. .ai/known-pitfalls.md — past data issues

## Your job
1. Read the scenario.
2. Identify what data is needed (users, products, orders, sessions, etc.)
3. For each data type:
   - Generate realistic but synthetic records
   - Cover edge cases the scenario requires (empty strings, max length, unicode, etc.)
   - Apply test-data-rules (PII-safe, TEST_ prefix, etc.)
4. Output as a seed file that can be loaded by the test.

## Rules
- NEVER generate real PII patterns, even if fake
- ALWAYS use the TEST_ prefix
- For boundary tests, generate exactly at-boundary and one-past-boundary values
- Include a "cleanup" section describing how to remove the data

## Output format
Write to: tests/fixtures/REQ-{id}-data.{json|sql|yaml}
Update graph.json → requirements[REQ-{id}].fixtures to reference the file.
```

### Step 3: Build a seed script (once, reusable)

```javascript
// tests/helpers/seed.js
const fs = require('fs');
const db = require('../db');

async function seed(fixturePath) {
  const data = JSON.parse(fs.readFileSync(fixturePath));

  // 1. Safety check — every record must have TEST_ prefix
  for (const record of data.users || []) {
    if (!record.email?.startsWith('TEST_') && !record.email?.includes('@example.com')) {
      throw new Error(`Unsafe test data: ${record.email}`);
    }
  }

  // 2. Seed
  for (const table in data) {
    await db.table(table).insert(data[table]);
  }

  return data;
}

async function cleanup(fixturePath) {
  const data = JSON.parse(fs.readFileSync(fixturePath));
  for (const table in data) {
    const ids = data[table].map(r => r.id);
    await db.table(table).whereIn('id', ids).del();
  }
}

module.exports = { seed, cleanup };
```

### Step 4: Use in tests

```javascript
// tests/auth/password_reset.spec.ts
import { test, expect } from '@playwright/test';
import { seed, cleanup } from '../helpers/seed';

let fixture;

test.beforeAll(async () => {
  fixture = await seed('tests/fixtures/REQ-142-data.json');
});

test.afterAll(async () => {
  await cleanup('tests/fixtures/REQ-142-data.json');
});

test('password reset happy path', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name=email]', fixture.users[0].email);
  // ...
});
```

### Step 5: Update graph.json

```json
{
  "id": "REQ-142",
  "fixtures": [
    "tests/fixtures/REQ-142-data.json"
  ]
}
```

---

## 5. Prompts & templates

### Generate data for boundary testing

```
Read scenarios/REQ-142-scenarios.md.

For Scenario 2 (rate limit boundary at 5 requests/hour), generate:
- 1 user record with TEST_ prefix
- a state where this user has made exactly 4 reset requests in the last 60 minutes
- Include the timestamps of those 4 requests

Follow .ai/conventions/test-data-rules.md strictly.

Output as JSON fixture at tests/fixtures/REQ-142-rate-limit-data.json.
```

### Generate a multi-tenant isolation fixture

```
Generate 3 tenants in staging:
- TEST_tenant_alpha (premium plan, 5 users)
- TEST_tenant_beta (free plan, 2 users)
- TEST_tenant_gamma (enterprise, 20 users)

Each tenant's users must have TEST_ prefix emails (e.g., TEST_user1@alpha.example.com).

The test verifies tenant_alpha's user CANNOT see tenant_beta's data.

Output: tests/fixtures/tenant-isolation-data.json
```

---

## 6. Success criteria

- [ ] Every scenario needing data has a fixture file in `tests/fixtures/`
- [ ] All fixtures pass the safety check (TEST_ prefix, no real PII)
- [ ] Cleanup runs successfully — no stale data in staging after test runs
- [ ] Fixtures are linked in `graph.json`
- [ ] Boundary cases are represented (exactly at-limit and one-past-limit)
- [ ] Tests run without requiring any hand-crafted data from the engineer

---

## 7. Common pitfalls

### 🚫 Real PII sneaks in via AI
AI has seen real data in training. Without strict prompt rules, it may generate realistic-sounding names and emails that are plausibly real. **Always** enforce TEST_ prefixes and validate with a safety check script.

### 🚫 Cleanup doesn't run
If `afterAll` fails (test timeout, early exit), data lingers. Have a weekly cron that sweeps anything TEST_-prefixed older than 7 days.

### 🚫 Data drift
AI generates data for schema v1. Schema moves to v2. Old fixtures break silently. **Fix:** regenerate fixtures as part of WF6 (Test Maintenance) when the schema changes.

### 🚫 Generating massive datasets for trivial tests
"Generate 10,000 users" when the test uses 3. AI over-generates. Specify counts in the prompt — `generate 3 users, 1 product, 1 order`.

### 🚫 No isolation between parallel test runs
If two CI runs share a fixture, they collide. Prefix the TEST_ records with a run UUID: `TEST_{runId}_user1@example.com`.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Manual | QA asks ChatGPT for a data block, copies into fixture file |
| 2 — Spec-Driven | Semi-auto | Fixture generated when scenarios are approved |
| 3 — Parallel Stream | **Auto** | Fixture generated as part of WF5 pipeline |
| 4 — Agentic | Fully auto | Agent detects new scenario, generates fixture, validates safety, commits |
| 5 — Regulated | **Auto + audit** | Every generation logged, safety-check result archived for compliance |

---

## 9. What to try next

- **WF5 (Automation Generation)** — tests and fixtures generated together as a unit
- **WF6 (Test Maintenance)** — keep fixtures current when schemas change
- **WF10 (CI Quality Gate)** — the gate refuses PRs with fixtures that fail safety checks
