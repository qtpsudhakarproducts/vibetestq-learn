# WF5 — Automation Generation

> Scenarios exist. Code exists. Nothing stops the test code from writing itself — if AI has both.

---

## 1. What it is

Given an approved scenario (from WF1) and the current code, AI generates executable Playwright (or Cypress / Selenium) test code. The test runs against the app, the Healer agent fixes immediate issues, and the test is committed with the linked REQ-ID.

The unlock: tests are no longer authored one-at-a-time by humans. Humans review — don't write.

---

## 2. Who owns it

**QA engineers own the review.** AI generates, humans verify. No auto-merge of AI-generated tests.

---

## 3. Tools needed

- **Category 2 — MCPs:** Playwright MCP to dry-run tests
- **Category 3 — AI IDE:** Cursor / Copilot / Antigravity — the generator lives here
- **Category 5 — Playwright Agents:** Planner + Generator + Healer
- **Category 6 — Cloud-Scale AI Testing:** BrowserStack for matrix runs (optional but recommended)

---

## 4. Step-by-step setup

### Step 1: Set up the test folder structure

```
tests/
├── fixtures/                    ← from WF3
├── pages/                       ← page objects (manual or AI-gen)
├── helpers/                     ← seed, cleanup, auth helpers
├── auth/                        ← grouped by area
│   └── password_reset.spec.ts
├── checkout/
└── e2e/
```

### Step 2: Define test conventions

Save as `.ai/conventions/test-conventions.md`:

```markdown
# Test conventions

## Naming
- File: {feature}.spec.ts (e.g., password_reset.spec.ts)
- Describe block: matches REQ-ID and title
- Test name: "Scenario N: {scenario title}" from the scenarios file

## Structure
- Use page objects, don't inline selectors
- Use test.beforeAll for fixture seeding (from WF3)
- Use test.afterAll for cleanup
- Every test must have a comment: // REQ-ID: REQ-142

## Selectors (priority order)
1. data-testid (preferred)
2. role-based (getByRole)
3. label-based (getByLabel)
4. text (last resort)
5. NEVER use CSS paths or XPaths

## Assertions
- expect(...).toBeVisible() instead of .waitFor()
- Always assert end state, not implementation detail
- No sleep(), no arbitrary waits — use Playwright's auto-waiting

## What NOT to test here
- Unit-level logic (belongs in dev-owned unit tests)
- Third-party integrations at the network level (use mocks or contract tests)
```

### Step 3: Create the generation prompt

Save as `.ai/prompts/wf5-generate-tests.md`:

```markdown
# Task: Generate Playwright tests from an approved scenario file

## Context files
1. .ai/conventions/test-conventions.md
2. scenarios/REQ-{id}-scenarios.md — APPROVED scenarios
3. .ai/graph.json — to find existing test files and avoid duplicates
4. tests/fixtures/REQ-{id}-data.json — from WF3 (if exists)
5. tests/pages/*.ts — existing page objects
6. The running app URL (e.g., http://localhost:3000 or staging)

## Your job
1. Read the approved scenarios. Do NOT change them.
2. For each scenario:
   - Write a Playwright test in TypeScript
   - Use existing page objects if they exist; create new ones if needed
   - Reference fixture data (don't inline test data)
   - Comment with // REQ-ID
3. After writing, dry-run each test via Playwright MCP against the app.
4. If any fails due to locator or timing issues, invoke Healer to fix.
5. Commit only tests that pass the dry-run.

## Rules
- NEVER modify or add scenarios. If scenarios are incomplete, stop and tell me.
- NEVER disable or skip tests to make them pass.
- Follow test-conventions.md strictly.
- Page objects go in tests/pages/, tests go in tests/{area}/.

## Output
- Create: tests/{area}/{feature}.spec.ts
- Update: tests/pages/*.ts as needed
- Update: graph.json → requirements[REQ-{id}].test_files
- Report: dry-run result for each test (passed / failed / healed)
```

### Step 4: Invoke from IDE

```
@prompt wf5-generate-tests.md for REQ-142
```

The IDE will:
- Read scenarios
- Generate test file
- Open Playwright MCP
- Dry-run each test
- Call Healer if needed
- Report back

### Step 5: Human review (non-negotiable)

Open the generated test file. Specifically check:

- [ ] Does each test actually validate the scenario's intent, not just complete without error?
- [ ] Are selectors using data-testid (preferred) or role-based?
- [ ] Are assertions meaningful, or just `expect(page).toBeTruthy()`-style weak checks?
- [ ] Is the REQ-ID comment present?
- [ ] Is fixture data referenced, not inlined?

If any check fails, refine the prompt or fix manually. **Do not auto-merge AI-generated tests.**

### Step 6: Run cross-browser (optional)

If you have BrowserStack AI:

```
@prompt wf5-matrix-run.md for REQ-142
```

The prompt tells BrowserStack to run the tests across Chrome, Firefox, Safari, mobile Chrome, mobile Safari. Failures on specific browsers feed into WF6 (maintenance) or WF7 (self-healing).

### Step 7: Commit

The PR includes:
- New test file
- New/updated page objects
- Updated `graph.json`
- Dry-run report as PR description

Reviewer checks the report, approves, merges. WF10 (CI Quality Gate) validates on merge.

---

## 5. Prompts & templates

### Minimum viable prompt

```
Read scenarios/REQ-142-scenarios.md.
Generate Playwright tests in tests/auth/password_reset.spec.ts.
Use tests/fixtures/REQ-142-data.json for test data.
Follow .ai/conventions/test-conventions.md.
Dry-run each test before finishing.
```

### Generator + Healer compose

```
Use the Playwright Planner agent to break down scenario 3 into test steps.
Use Generator to write code.
Use Healer if any locator fails in dry-run.
Stop if Healer can't fix within 3 attempts — tell me what's wrong.
```

### Page object first

```
Before generating tests for REQ-142:
1. Read the app at http://localhost:3000/reset-password
2. Generate a page object at tests/pages/ResetPasswordPage.ts
3. Cover: navigate, requestReset, submitNewPassword, readErrorMessage
Then generate tests that use this page object.
```

---

## 6. Success criteria

- [ ] Every approved scenario has a test in `tests/`
- [ ] Every test has the REQ-ID comment
- [ ] Tests pass dry-run before commit
- [ ] Page objects are reused, not duplicated across tests
- [ ] `graph.json` correctly lists all test files per REQ-ID
- [ ] Cross-browser matrix runs successfully on merge (if using BrowserStack)
- [ ] Human review catches at least 1 issue per 10 generated tests (if AI is perfect, something's wrong — usually the review is too shallow)

---

## 7. Common pitfalls

### 🚫 Auto-merging AI-generated tests
The #1 failure mode. Tests look green but validate nothing. Always human-review.

### 🚫 More code ≠ more coverage
200 AI-generated tests with the same weak assertions = 200 false signals. Quality over quantity.

### 🚫 Skipping dry-run
"Generate and commit" without running. You'll ship broken tests. The dry-run is non-negotiable.

### 🚫 Ignoring Healer's changes
When Healer fixes a locator, it often means the UI changed in an important way. That may indicate a real regression elsewhere. Review Healer's log as seriously as any PR.

### 🚫 Generating tests from unapproved scenarios
If scenarios aren't approved (WF1 incomplete), tests inherit the ambiguity. Enforce: no WF5 until WF1 is approved.

### 🚫 Not using page objects
Inline selectors scatter. When the UI changes, every test breaks individually. Require page objects from the first test.

---

## 8. Which SDLC type it fits

| Type | Fit | How it looks |
|------|-----|--------------|
| 1 — AI-Assisted | Partial | QA uses AI to draft test code, manually refines |
| 2 — Spec-Driven | **Core** | Tests generated from approved specs, reviewed, committed |
| 3 — Parallel Stream | **Core** | WF5 runs the moment WF1 approves, in the same sprint |
| 4 — Agentic | **Fully auto** | Generator + Healer run autonomously; human reviews PR only |
| 5 — Regulated | **Auto + audit** | Every generated test logged with prompt, model, reviewer, timestamp |

---

## 9. What to try next

- **WF6 (Test Maintenance)** — keep these generated tests current as code changes.
- **WF7 (Self-Healing)** — add runtime healing to reduce flaky failures.
- **WF8 (Coverage Audit)** — measure whether these tests actually cover what matters.
- **WF10 (CI Quality Gate)** — enforce that AI-generated tests pass review before merge.
