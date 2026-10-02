# Level 2 — Chapter 5: AI Testing Toolkit Organisation

## What This Chapter Is About

This chapter organises everything you have built across Level 2 into a coherent, repository-first AI testing toolkit. It covers the recommended folder structure, prompt versioning as a professional practice, the evolution of your Skills.md across the program, and — most importantly — how the toolkit you build now becomes the direct input for Level 3 automation generation. By the end of this chapter, your Veg Cart project will be a structured, AI-ready repository that compounds in intelligence every sprint.

---

## Why It Matters for QA

At the end of Level 1, you had a Skills.md file and a prompt library. At the end of Level 2, you have feature files, test data, exploration findings, bug reports, and MCP configuration. Without organisation, this is a collection of files. With the right structure, it is a quality intelligence system — one that AI agents can read, understand, and use to generate better output with each passing sprint.

The difference between a folder of files and a quality intelligence system is structure, naming conventions, and the discipline of committing everything to the repository.

---

## What You Have Built Across Level 2

Before organising, take stock of what exists:

| Artifact | Created in | Description |
|---|---|---|
| MCP configuration | Chapter 1 | Claude Desktop config with Filesystem and Playwright MCP |
| Skills.md (updated) | Chapter 1 | Now includes Veg Cart context and MCP conventions |
| Feature files | Chapter 2 | Gherkin .feature files for add-to-cart, coupon, checkout |
| Test cases (tabular) | Chapter 2 | Markdown tables for Jira |
| Exploration sessions | Chapter 3 | Structured markdown logs of AI-assisted exploration |
| Test data | Chapter 4 | vegetables.json, users.csv, coupons.sql |
| Bug reports | Chapter 4 | Structured Jira-ready reports |
| Prompt library | All chapters | The prompts that worked — ready to reuse |

This is your Level 2 toolkit. Every piece of it has a specific place in the organised repository structure.

---

## The Recommended Folder Structure

### Plain Explanation

The folder structure is not arbitrary. It is designed so that:
- Every AI agent knows where to find things
- Every team member can navigate without asking
- Every artifact is traceable to what it relates to
- The structure scales cleanly from a solo project to a team project

### The Veg Cart Project Structure

```
vegcart-qa/
├── .claude/
│   └── skills.md                    # AI reads this first — always
│
├── requirements/                    # Versioned requirements
│   ├── REQ-001-add-to-cart.md
│   ├── REQ-002-coupon-codes.md
│   └── REQ-003-checkout-flow.md
│
├── features/                        # Gherkin feature files
│   ├── add-to-cart.feature
│   ├── coupon-codes.feature
│   └── checkout.feature
│
├── test-cases/                      # Tabular test cases for Jira
│   ├── add-to-cart-test-cases.md
│   └── coupon-codes-test-cases.md
│
├── test-data/                       # All synthetic test data
│   ├── vegetables.json
│   ├── users.csv
│   └── coupons.sql
│
├── exploration/                     # Structured exploration logs
│   ├── sprint-01-coupon-exploration.md
│   ├── sprint-01-add-to-cart-exploration.md
│   └── template-exploration-session.md
│
├── bugs/                            # Bug reports
│   ├── BUG-001-coupon-minimum-order.md
│   └── BUG-002-quantity-limit-not-enforced.md
│
├── prompts/                         # Versioned prompt library
│   ├── requirements-analysis.md
│   ├── gherkin-from-requirement.md
│   ├── test-data-generation.md
│   └── bug-report-writing.md
│
└── quality-docs/                    # Coverage maps, decisions, notes
    ├── coverage-sprint-01.md
    └── risk-register.md
```

Level 3 will add:

```
vegcart-qa/
├── tests/
│   ├── pages/                       # Page Object Models (Level 3)
│   └── specs/                       # Playwright spec tests (Level 3)
├── step-definitions/                # Cucumber step definitions (Level 3)
└── .github/
    ├── workflows/                   # CI pipeline (Level 3)
    └── agents/                      # AI agent instructions (Level 3)
```

### Why This Structure Matters for AI

When Filesystem MCP is configured, Claude can navigate this structure. When you ask Claude to "generate test scenarios for the coupon feature," it can:
- Read `requirements/REQ-002-coupon-codes.md` for the business rules
- Read `features/coupon-codes.feature` for what is already covered
- Read `exploration/sprint-01-coupon-exploration.md` for what was observed during testing
- Read `.claude/skills.md` for the project conventions

Without a structured repository, Claude cannot do any of this automatically. You would have to paste every piece of context manually, every time.

### The Repository-First Principle

Everything belongs in the repository. Not just code. Not just feature files. Everything:

- **Requirements:** Versioned in `/requirements/`. When a requirement changes, the old version is in git history.
- **Test decisions:** Coverage maps, risk acceptance decisions, sprint testing notes — all in `/quality-docs/`.
- **Exploration findings:** Saved in `/exploration/` after every significant session.
- **Prompts:** In `/prompts/`. Treated like code — reviewed, improved, committed.
- **Bug reports:** In `/bugs/`. Even after they are fixed, they are a record of what was found and when.

Git is not just for code. It is the version-controlled brain of your quality system.

### QA Analogy

A hospital keeps comprehensive patient records. Every consultation, every test result, every prescription is documented — not because the doctor will remember everything, but because the record is the system. A new doctor picking up the case has everything they need. An AI agent picking up the project has everything it needs.

A QA team that only commits code to the repository is like a hospital that only files surgical reports but discards all consultation notes. The record is incomplete. The intelligence is lost.

---

## Prompt Versioning

### Plain Explanation

A prompt that produced excellent Gherkin output last sprint is a professional asset. If you cannot find it next sprint, you will spend 30 minutes recreating it — or produce lower-quality output because you cannot remember exactly what made it work.

Prompt versioning is the practice of treating your prompts like code: saving them, naming them clearly, improving them over time, and committing changes to the repository.

### The Prompt Library Structure

Each prompt in your `/prompts/` folder is a markdown file with:
- The prompt itself (ready to copy and use)
- When to use it
- What context to add at the top when using it
- Version notes (what changed from the previous version)

**Example: `prompts/gherkin-from-requirement.md`**

```markdown
# Prompt: Generate Gherkin Feature File from Requirement

## When to Use
When you have a finalised, ambiguity-checked requirement and need to
generate a complete Gherkin .feature file for Cucumber BDD.

## Context to Add Before Using
- The requirement text
- Any clarifications or business rules not in the requirement
- A reference to the existing feature files if you want the new one
  to follow the same style

## The Prompt

Act as a BDD practitioner writing Gherkin feature files for the
Veg Cart application — an Indian vegetable ordering platform.

[Paste requirement and rules here]

Write a complete Gherkin .feature file covering:
- The main happy path scenario
- All validation error scenarios
- Boundary value scenarios for any numeric or date fields
- Empty/null state handling

Rules for this project:
- Use a Background for preconditions shared by all scenarios
- Use Scenario Outline with Examples table for data-driven tests
- Then steps must be specific enough to become Playwright assertions
- Do not reference specific UI elements (buttons, selectors) in steps
- Always include the exact expected error messages in Then steps

## Version Notes
v1: Initial version
v2: Added rule about not referencing UI elements in steps (after review)
v3: Added instruction to always include exact error messages
```

### Why Version Notes Matter

Version notes record why the prompt was changed. When a future sprint produces worse output, you can look at the version history and understand what changed. When a new team member asks why a certain rule is in the prompt, the version note explains it.

This is exactly how code comments work. "// This check is necessary because of the edge case in BUG-042" is more valuable than just the check itself. Same principle for prompts.

### The Iterative Improvement Pattern

```
Sprint 1: Use prompt → Output is 80% good
          → Note what was wrong in version notes
          → Improve the prompt
Sprint 2: Use improved prompt → Output is 90% good
          → Note what was still missing
          → Improve again
Sprint 3: Use prompt → Output requires minimal editing
```

This is compounding prompt quality. Each sprint, your prompts get better. The output requires less review. Your time goes further.

---

## Skills.md Evolution

### How Skills.md Grows Across the Program

Your Skills.md starts simple in Level 1. By Level 4, it is a comprehensive document that gives any AI agent full context to work on your project as a well-briefed team member.

**Level 1 Skills.md (what you wrote in Level 1):**
```markdown
# QA Skills

## My Role
Senior QA engineer. Focus on web application testing.

## Output Preferences
- Use TypeScript for any code examples
- Format test cases as markdown tables by default
- Include both positive and negative scenarios
```

**Level 2 Skills.md (what you add now):**
```markdown
# QA Skills — Veg Cart

## Project Context
Veg Cart is an online vegetable ordering platform for Indian consumers.
Users browse vegetables, add to cart, apply coupon codes, and checkout
with delivery address and slot selection. Guest checkout is supported.

Key features:
- Vegetable catalogue with categories (leafy, root, fruit-vegetable, exotic)
- Cart with quantity limits (max 10 per vegetable type)
- Coupon codes (10% discount on subtotal, min ₹200 order, one per order)
- Delivery slots (Monday–Saturday, minimum ₹200 order)
- Registered user and guest checkout

## Test Conventions
- Feature files: /features/[feature-name].feature
- Test data: /test-data/[type].json|csv|sql
- Exploration logs: /exploration/[sprint]-[feature]-exploration.md
- Prompts: /prompts/[task-name].md

## MCP Configuration
- Filesystem MCP points to /vegcart-qa/
- Playwright MCP available for live app exploration
- Staging URL: [your staging URL]
- Test account: test@vegcarttest.com / TestPass123

## Gherkin Conventions
- Background for preconditions shared by all scenarios
- Scenario Outline for data-driven tests
- Then steps must specify exact values and messages
- Steps describe behaviour, not UI elements

## AI Rules
- Always reference existing feature files before generating new ones
- Always match the naming convention in existing files
- Never reference UI selectors in Gherkin steps
- Always include error message text in Then steps
- For test data: use /test-data/ files rather than hardcoded values
```

**Level 3 addition (preview):**
```markdown
## Test Automation Conventions
- Language: TypeScript
- Framework: Playwright
- Page Objects: /tests/pages/[Feature]Page.ts
- Spec Tests: /tests/specs/[feature].spec.ts
- Always use Page Object Model — never inline selectors in specs
- Always use async/await — never .then() chains
- Always include assertions — never an action without a verify
```

**Level 4 addition (preview):**
```markdown
## Coverage Governance
- Coverage audits happen every sprint — check /quality-docs/coverage-[sprint].md
- Green CI is not sufficient — must confirm coverage intent
- Exploration findings must be committed before sprint close
- Any coverage gap accepted must be documented with risk rationale
```

---

## This Toolkit Is the Foundation for Level 3

The single most important thing to understand about Day 5 is this: you are not organising files. You are building the launchpad for Level 3 automation.

### How Each Artifact Feeds Level 3

| Level 2 Artifact | How It Is Used in Level 3 |
|---|---|
| `.feature` files | Direct input to Cucumber BDD — the Cucumber runner reads these files |
| Exploration logs | Input to Planner agent — it reads what you explored and generates test strategies |
| `test-data/*.json` | Playwright test data files — imported directly into spec tests as fixtures |
| `test-data/*.csv` | Data-driven test inputs — used in Scenario Outline Examples |
| `test-data/*.sql` | Database seed data — run before API tests to set up state |
| `skills.md` | Loaded by Filesystem MCP — every agent reads it before generating code |
| `prompts/*.md` | Reused and extended — the automation generation prompts build on these |
| Bug reports | Regression test cases — each bug becomes a test case that must never regress |

### The Compounding Intelligence Cycle

```
Level 2 exploration → captures HOW the app behaves
        ↓
Level 3 agents read the exploration logs
        ↓
Generate Page Object Models for the pages you explored
        ↓
Generate spec tests that match your observed scenarios
        ↓
Generate step definitions that connect Gherkin to the POM
        ↓
Coverage audit identifies what is still missing
        ↓
Next sprint exploration captures the new features
        ↓
Cycle repeats — getting smarter each sprint
```

This cycle does not start in Level 3. It starts now. The quality of your Level 2 exploration logs determines the quality of the Level 3 automation that AI generates from them. Structured, detailed, specific exploration findings produce accurate, relevant automation. Vague findings produce generic automation that misses your application's specific behaviour.

---

## Practice Tasks

### Task 1 — Create the folder structure
In your VS Code workspace, create the complete folder structure from this chapter. Create a `.gitkeep` file in each empty folder so they are tracked by git.

### Task 2 — Organise your Level 2 artifacts
Move every artifact you created in Level 2 into the correct folder. Rename files to follow the naming convention. After organising, do a final check: is every artifact in the right place? Is the naming consistent?

### Task 3 — Update your Skills.md
Add the Level 2 content to your Skills.md using the template from this chapter. Test it: open Claude Desktop, start a new conversation, and ask Claude to read your skills.md and confirm it understands the project. Ask it to generate a test scenario for the coupon feature. Compare the output to what you would get without the Skills.md loaded.

### Task 4 — Version your best prompts
Choose the 3 prompts from Level 2 that produced the best output. Save each as a `.md` file in `/prompts/` following the format from this chapter. Include: when to use it, what context to add, the prompt itself, and version notes.

### Task 5 — Initialise git
If you have not already, initialise a git repository in your project folder:
```bash
git init
git add .
git commit -m "Level 2 complete: AI testing toolkit organised"
```

This is the first commit of what will become your complete QA project repository by the end of Level 3.

---

## Key Takeaways

- Organisation transforms a collection of files into a quality intelligence system that AI agents can navigate and learn from
- The repository-first principle means everything belongs in the repo: requirements, test decisions, exploration logs, prompts, and bug reports — not just code and feature files
- The recommended folder structure (`.claude/`, `requirements/`, `features/`, `test-data/`, `exploration/`, `bugs/`, `prompts/`, `quality-docs/`) gives every artifact a predictable home
- Prompt versioning — treating prompts like code with a name, description, and version history — prevents the loss of high-performing prompts and enables continuous improvement
- Skills.md evolves across all four levels, growing from basic preferences to a comprehensive project knowledge document that any AI agent can use to work effectively on your project
- The Level 2 toolkit is the direct input for Level 3 automation: feature files feed Cucumber, exploration logs feed the Planner agent, test data feeds Playwright fixtures, and Skills.md guides every agent
- The compounding intelligence cycle starts now — structured Level 2 output produces better Level 3 automation, and better Level 3 automation produces more valuable Level 4 governance

---

## Common Questions

**Q: How strictly do I need to follow the folder structure?**

A: The specific folder names are less important than the principle — every artifact type has its own location, the structure is consistent, and AI agents can predict where things are. If your organisation has an existing folder convention, adapt the principle to your structure. The key requirements are: test data is separated from test code, exploration findings are distinct from test cases, and the Skills.md is in a location Claude Desktop can find it.

**Q: Should I commit prompt files to the team repository?**

A: Yes — if you are working on a team. Shared prompt libraries are one of the highest-value collaborative assets a QA team can build. When a team member discovers a prompt that produces significantly better output for a specific task, committing it to the shared repository means everyone benefits. Treat it the same as sharing a useful testing technique or a reusable test utility.

**Q: How do I handle prompts that work for some scenarios but not others?**

A: Document the limitations in the "When to Use" section: "Works well for features with clearly defined validation rules. Less effective for complex multi-step workflows — use the [other prompt name] for those." This prevents the wrong prompt from being used in the wrong context.

**Q: My exploration logs are getting long. How do I keep them manageable?**

A: One file per exploration session, not one file per feature forever. At the start of each sprint, create a new exploration log file for that sprint's sessions. Archive older logs by moving them to an `/exploration/archive/` subfolder. The current sprint's logs are what AI agents use most actively — older logs are historical record.

**Q: At what point does the repository become too large for practical use?**

A: For a typical QA project running 6–12 sprints, the repository stays very manageable. The largest files are usually test data files and exploration logs. Neither grows as fast as code. If the repository becomes unwieldy, the fix is usually in test data (switch from committing large data files to generating them from smaller seed scripts) rather than in the structure itself.
