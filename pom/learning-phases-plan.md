# Learning Path: POM Framework Levels

## Overview

This learning path progresses through 11 levels of Page Object Model (POM) framework development, integrated with Playwright test framework concepts at each stage. Levels build on each other — do not skip ahead.

## Read Order

At each level:
1. **Read the POM level content first** — it provides practical framework context
2. **Study the linked Playwright test topics second** — they deepen understanding of the framework features you just used

## Quick Reference
> Available at any level — refer to this at any point: [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc)

---

## Foundations

### Level 0 — Theory & Foundations
**Duration:** 1 week  
**Prerequisites:** Basic TypeScript/JavaScript knowledge

**Goal:** Understand why POM exists, how the framework is structured, and the design principles behind every decision that follows.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Defining Tests
- Grouping Tests

**Learning Objectives:**
- Understand separation of concerns in test automation
- Read the Level Map to know where the full path leads
- Set up the project structure and tooling

**Deliverable:** Project scaffolded; Level Map understood.

---

### Level 1 — Basic Page Object Model
**Duration:** 1 week  
**Prerequisites:** Level 0

**Goal:** Implement the fundamental POM pattern — page classes with locators and action methods, consumed by test files.

**Learning Objectives:**
- Create page objects for OrangeHRM login and dashboard
- Write tests that use page objects without touching locators directly

**Deliverable:** Working login automation using a proper POM structure.

---

## Core POM

### Level 2 — BasePage & Inheritance
**Duration:** 1 week  
**Prerequisites:** Level 1

**Goal:** Eliminate duplication across page classes with a shared BasePage and inheritance.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Hooks
- Test Steps

**Learning Objectives:**
- Implement BasePage with common utilities (navigate, waitForLoad, etc.)
- Extend BasePage in all page classes
- Understand what belongs in BasePage vs. individual pages

**Deliverable:** BasePage in use; no duplicated wait/navigate logic across page classes.

---

### Level 3 — Fixtures & Shared State
**Duration:** 1-2 weeks  
**Prerequisites:** Level 2

> ⚠️ **This is the steepest level.** It introduces session storage, Playwright's custom fixture API, multi-role setups, and the Leave module simultaneously. Allocate the majority of this level's time to understanding fixtures before moving on.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Fixtures

**Learning Objectives:**
- Build custom Playwright fixtures that inject authenticated page objects
- Share browser state across tests without repeating login
- Understand fixture scope (test vs. worker)

**Deliverable:** Fixture-injected auth; no login repetition in test files.

---

## Advanced POM

### Level 4 — Test Independence & State Setup
**Duration:** 1-2 weeks  
**Prerequisites:** Level 3

**Goal:** Ensure every test can run in isolation — no test should rely on another having run first.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Global Setup & Teardown

> 💡 If your application has an API layer, studying API testing ([vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc)) before or during this level makes state setup significantly faster.

**Learning Objectives:**
- Diagnose cascade failures caused by shared state
- Set up preconditions via `beforeAll` UI flows or API calls
- Use global setup for one-time environment prerequisites

**Deliverable:** No cascade failures; every test passes in isolation.

---

### Level 5 — Test Data Management
**Duration:** 1-2 weeks  
**Prerequisites:** Level 4

**Goal:** Replace hardcoded test data with dynamic, generated data that is unique per run.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Parameterised Tests

**Learning Objectives:**
- Generate dynamic test data with Faker
- Separate data concerns from test logic
- Implement parameterized tests for data-driven scenarios

**Deliverable:** Unique data per test run; no hardcoded strings in test bodies.

---

## Enterprise POM

### Level 6 — Web Action Helpers
**Duration:** 1-2 weeks  
**Prerequisites:** Level 5

**Goal:** Abstract repetitive UI interactions into a reusable helper layer.

> 💡 **Why helpers come after data:** Level 5 exposes exactly which UI interactions repeat across data-driven scenarios. Building helpers *after* that exposure means abstracting what you *know* is repetitive, not what you *guess* might be.

**Learning Objectives:**
- Build a generic `WebActions` helper for common browser interactions
- Build `OrangeHRMControls` for application-specific UI patterns
- Refactor data-driven tests to use the helper layer

**Deliverable:** Helper layer in place; test bodies visibly shorter and DRY.

---

### Level 7 — Reporting & Organisation
**Duration:** 1-2 weeks  
**Prerequisites:** Level 6

**Goal:** Make test results meaningful, actionable, and navigable for all audiences.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Test Info
- Annotations
- Tags & Filtering
- Configuration
- Projects
- Timeouts
- CLI Usage
- Reporters

**Learning Objectives:**
- Annotate and tag tests for targeted execution (smoke, regression, sanity)
- Configure Playwright projects for different environments
- Build a custom reporter with structured, grouped output

**Deliverable:** Tagged suites with targeted run commands; report readable by devs, QA leads, and managers.

---

### Level 8 — CI/CD Integration
**Duration:** 2 weeks  
**Prerequisites:** Level 7; basic GitHub Actions familiarity

**Goal:** Run the framework reliably at scale in a CI pipeline.

**Playwright Test Content** — [vibetestq.com/docs/pwtestdoc](https://vibetestq.com/docs/pwtestdoc):
- Parallelism
- Retries
- Sharding
- CI Integration
- Docker

**Learning Objectives:**
- Set up GitHub Actions workflows for PR checks and nightly regression
- Configure parallel execution, retries, and sharding
- Deploy test execution in Docker containers

**Deliverable:** Full CI/CD pipeline; Allure reports published to GitHub Pages.

---

### Level 9 — AI Agents & Test Generation
**Duration:** 1-2 weeks  
**Prerequisites:** Level 8; familiarity with LLM concepts helpful

**Goal:** Use AI agents to scale test authoring without sacrificing framework standards.

**Learning Objectives:**
- Write a `STANDARDS.md` encoding all POM and naming conventions for agent use
- Run the full planner → generator → healer cycle on a real feature
- Review AI-generated tests against the framework code standard

**Deliverable:** AI-generated tests that pass framework code review; documented agent workflow.

---

### Level 10 — Runtime Self-Healing
**Duration:** 1 week  
**Prerequisites:** Level 6 (WebActions helper layer)  
**Status:** Optional

**Goal:** Build LLM-powered locator recovery into the framework so tests survive minor UI changes.

**Learning Objectives:**
- Implement runtime locator healing using an LLM
- Understand advanced failure recovery patterns

**Deliverable:** Self-healing framework integration; locator failures recovered at runtime.

---

## Integration: POM ↔ Playwright Test Framework

| Level | Playwright Topics Covered |
|-------|---------------------------|
| Level 0–1 | Defining Tests, Grouping Tests |
| Level 2 | Hooks, Test Steps |
| Level 3 | Fixtures |
| Level 4 | Global Setup & Teardown |
| Level 5 | Parameterised Tests |
| Level 6 | *(architectural pause — no new Playwright topics)* |
| Level 7 | Annotations, Tags, Configuration, Projects, Timeouts, CLI, Reporters |
| Level 8 | Parallelism, Retries, Sharding, CI Integration, Docker |
| Level 9–10 | AI Agents, Self-Healing (advanced) |

## Assessment Milestones

| Level | Milestone |
|-------|-----------|
| Level 0 | Project scaffolded; Level Map understood |
| Level 1 | OrangeHRM login automation working end-to-end |
| Level 2 | BasePage in use; no duplicated wait/navigate logic |
| Level 3 | Fixture-injected auth; no login repetition in test files |
| Level 4 | No cascade failures; every test passes in isolation |
| Level 5 | Unique data per test run; no hardcoded strings in test bodies |
| Level 6 | Helper layer in place; test bodies visibly shorter and DRY |
| Level 7 | Tagged suites; report readable by devs, QA leads, and managers |
| Level 8 | Full CI/CD pipeline; results published to GitHub Pages |
| Level 9 | AI-generated tests pass framework code review |
| Level 10 | Self-healing locators recover from failures at runtime |