# The Project Repository Model

> **Read this first.** Nothing downstream works without it.

---

## The shift in one line

> Your repo used to hold only code. Now it holds the entire project — and AI can read all of it.

---

## The problem with how we worked for 20 years

For two decades, we split a software project across disconnected tools:

- **Requirements** → Jira / Confluence
- **Code** → GitHub / Bitbucket / GitLab
- **Test cases** → TestRail / Zephyr / Excel
- **Bugs** → Jira / Azure DevOps
- **Decisions** → Slack / email / someone's memory
- **Documentation** → Confluence / wiki / nowhere

Humans bridged these systems with meetings, hand-offs, tribal knowledge.

Then AI showed up. And AI doesn't attend stand-ups.

AI can only reason about what's *in front of it*. If your test cases live in TestRail and your code lives in GitHub, AI sees two fragments — not one project.

**That's the traceability debt.** The Project Repository model pays it.

---

## What a Project Repository actually is

Not a new tool. Not something you buy.

It's a **posture**: your existing Git repo becomes the source of truth for *everything* about the project — not just source code.

Everything that used to live outside the repo now lives inside it, version-controlled, machine-readable, AI-queryable.

### Before (disconnected)

```
Your repo:
└── src/                    ← only code

Jira:           ← requirements (disconnected)
TestRail:       ← test cases (disconnected)
Confluence:     ← docs (disconnected)
Slack:          ← decisions (disappearing)
```

### After (Project Repository)

```
Your repo:
├── src/                    ← code
├── tests/                  ← test code
├── requirements/           ← user stories as markdown
├── scenarios/              ← test scenarios as structured files
├── docs/
│   ├── architecture.md
│   ├── decisions/          ← ADRs (architecture decision records)
│   └── runbooks/
├── .ai/                    ← AI-specific context
│   ├── project-context.md  ← what this product does, for AI
│   ├── conventions.md      ← coding and testing conventions
│   └── graph.json          ← living traceability file
└── README.md
```

Every artifact has a file. Every file is version-controlled. AI can read the whole thing.

---

## What stays outside the repo (important nuance)

Keep Jira for planning and tracking work; connect its requirements to executable specifications in the repository.

Keep using your existing tools for:

- **Human process ceremonies** — sprint boards, ticket workflows, approvals
- **Cross-team visibility** — executives reading dashboards
- **Compliance & audit** — ticket history for regulators

Jira, TestRail, Confluence still own the **human process layer**.

The repo now owns the **machine context layer** — what AI reads to reason about your project.

Both are true at the same time. Nothing is thrown away.

```
┌─────────────────────────────────────────┐
│  HUMAN PROCESS LAYER                    │
│  Jira · Confluence · TestRail           │
│  (ceremonies, approvals, dashboards)    │
└─────────────────────────────────────────┘
                    ▲
                    │ syncs / links
                    ▼
┌─────────────────────────────────────────┐
│  MACHINE CONTEXT LAYER                  │
│  Your Git repo with everything in it    │
│  (what AI reads)                        │
└─────────────────────────────────────────┘
```

---

## Minimum viable Project Repository — what to set up

You don't need all of this at once. Start with these five:

### 1. A `requirements/` folder

One markdown file per user story. Named by ID.

```
requirements/
├── REQ-142-password-reset.md
├── REQ-143-2fa-login.md
└── REQ-144-session-timeout.md
```

Each file has a consistent structure:

```markdown
# REQ-142: Password Reset via Email

**Status:** In development
**Linked Jira:** PROJ-142
**Owner:** @sudhakar

## User story
As a registered user, I want to reset my password via email so I can recover access.

## Acceptance criteria
- User requests reset on login page
- Email sent within 60 seconds
- Reset link valid for 30 minutes
- Rate limit: 5 requests per user per hour

## Decisions
- Use JWT with 30min TTL (decided 2026-03-14)
- No SMS fallback in v1 (decided 2026-03-15)

## Linked artifacts
- Code: src/auth/password_reset.ts
- Tests: tests/auth/password_reset.spec.ts
```

AI can now answer: *"What does REQ-142 require?"* by reading one file.

### 2. A `scenarios/` folder

Test scenarios as structured files, linked to requirement IDs.

```
scenarios/
├── REQ-142-scenarios.md
└── REQ-143-scenarios.md
```

Not test cases in a tool. Scenarios in the repo.

### 3. A `.ai/` folder

This is new. It's where you tell AI how your project thinks.

```
.ai/
├── project-context.md      ← the 1-page product overview AI should read first
├── conventions.md          ← your naming, folder, testing conventions
├── known-pitfalls.md       ← things that always bite this codebase
└── graph.json              ← see next foundation file
```

**`project-context.md`** is the most important file you'll write. One page. What does the product do? Who uses it? What's critical? What's trivial? AI reads this to calibrate everything else.

### 4. A `docs/decisions/` folder (ADRs)

Architecture Decision Records. Every significant decision gets a short markdown file.

```
docs/decisions/
├── 001-use-jwt-for-auth.md
├── 002-rate-limit-password-reset.md
└── 003-no-sms-fallback-v1.md
```

Why this matters: AI can regenerate *what* was built. It cannot regenerate *why*. ADRs capture the why.

### 5. Continue using your `tests/` folder

Your existing test structure is fine. Just make sure tests are linked back to requirements (through filename conventions or frontmatter).

---

## Who sets this up?

**QA leads should drive this.** Not developers.

Reason: developers will set up `src/` perfectly. They won't set up `requirements/`, `.ai/`, or `docs/decisions/` — those aren't their pain.

If QA doesn't own the Project Repository structure, nobody will.

---

## Common pitfalls

### 🚫 "We'll migrate everything from Jira into the repo"

Don't. Jira still owns the human process layer. You're *adding* a machine-readable copy to the repo — not migrating away from Jira.

The sync between the two is automated (Rovo, custom agents, webhooks). More on this in tool-specific workflows.

### 🚫 "We put everything in Confluence instead"

Confluence is not version-controlled. AI can't always read it. Developers don't touch it.

The repo is where code lives. Put context with code.

### 🚫 "Let the tooling dictate the structure"

Wrong order. Decide your folder structure first. Then pick tools that work with it. The structure is what AI reads — the tools are interchangeable.

### 🚫 "We'll set it up once and maintain it manually"

You won't. Manual maintenance decays within 3 sprints. The Project Repository works because AI maintains it (see `02-graph-json-setup.md`).

---

## What "working" looks like

You've got a Project Repository when these are true:

- [ ] Every user story in active development has a `requirements/REQ-*.md` file
- [ ] AI (Cursor, Copilot, Claude) can answer: *"What does REQ-X require?"* by reading the repo alone — not asking you
- [ ] Your `.ai/project-context.md` exists and is under 500 lines
- [ ] At least 3 ADRs exist in `docs/decisions/`
- [ ] Developers commit changes to requirements *and* code in the same PR

If all five are true, you have a foundation. Now you can implement any workflow.

---

## What's next

Read **`02-graph-json-setup.md`** — the living file that links requirements, code, and tests together. That's what makes the Project Repository queryable.
