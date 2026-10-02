# QA Workflows for the AI SDLC — Implementation Guide

> A learner's guide to implementing AI-native QA workflows in real projects.
> By **Sudhakar Kakunuri** · VibeTestQ · [vibetestq.com](https://vibetestq.com)

---

## Who this is for

You're a QA engineer, QA lead, or automation specialist. You've heard the buzzwords — Cursor, Playwright MCP, agentic testing, self-healing. Now you want to know *what to actually do on Monday*.

This guide is that.

It doesn't tell you when to do things. It tells you **what to set up, what to try, and what breaks first time.** You decide the pace.

---

## The core idea

> **Validation is a generation behind generation.**

AI code generation is 2026. AI validation is still 2023. That gap is the territory you get to own — if you know how to close it.

These workflows are how you close it.

---

## How to use this guide

**Start with Foundations.** Without the Project Repository and `graph.json`, no workflow works properly. Read `00-foundations/` in order.

**Then pick one workflow.** Not all 11. Just one. The one that hurts the most on your project today.

- Requirements take forever to test? → **WF1**
- Production bugs keep repeating? → **WF11**
- Tests pass but real coverage is unknown? → **WF8**
- Maintenance eats your sprint? → **WF6**

Implement it. Get it working. Then read the next workflow.

**When you've got 3–4 workflows running**, read `03-governance/` to learn how to measure them and avoid the anti-patterns.

---

## Folder map

```
📁 00-foundations/          ← Read first. No skipping.
   01-project-repository.md
   02-graph-json-setup.md
   03-ai-ide-selection.md
   04-tool-landscape.md

📁 01-workflows/            ← The 11 workflows. Pick one to start.
   WF1-requirements-to-scenarios.md
   WF2-exploratory-planning.md
   WF3-test-data-design.md
   WF4-bug-triage-design.md
   WF5-automation-generation.md
   WF6-test-maintenance.md
   WF7-self-healing-tests.md
   WF8-coverage-audit.md
   WF9-feature-readiness-gate.md
   WF10-ci-quality-gate.md
   WF11-production-feedback-loop.md

📁 02-matching/             ← Map workflows to your SDLC maturity
   workflow-to-sdlc-type.md

📁 03-governance/           ← Once 3–4 workflows run
   measurement.md
   anti-patterns.md

📁 04-appendix/             ← Lookup reference
   glossary.md
   tools-reference.md
```

---

## Workflow file structure

Every workflow file follows the same 9-part template so you always know where to look:

1. **What it is** — the one-paragraph summary
2. **Who owns it** — QA role clarity
3. **Tools needed** — which of the 7 categories
4. **Step-by-step setup** — concrete steps
5. **Prompts & templates** — actual prompts you feed AI
6. **Success criteria** — how to know it works
7. **Common pitfalls** — what breaks first time
8. **Which SDLC type it fits** — so you don't waste effort
9. **What to try next** — logical next workflow

---

## The 5 AI SDLC Types (quick reference)

| Type | Driver | What it means |
|------|--------|---------------|
| 1. AI-Assisted | Tools | AI added to existing SDLC, no structural change |
| 2. Spec-Driven | Specifications | AI works off testable specs, QA approves the spec |
| 3. Parallel Stream | Workflows | Dev and QA run simultaneously on the same spec |
| 4. Agentic | AI autonomy | Agents execute, humans govern |
| 5. Regulated | Governance | Agentic + full audit trail for compliance industries |

Most teams are Type 1 — dressed up as Type 3. Be honest about where you are before picking workflows.

---

## The 7 Tool Categories (quick reference)

1. **Browser Assistant Agents** — Perplexity Comet, Claude Chrome Extension
2. **MCPs (Model Context Protocol)** — Playwright MCP, Chrome CDP MCP
3. **AI IDE Browser Agents** — Cursor, GitHub Copilot, Google Antigravity
4. **Platform AI** — Atlassian Rovo, Claude plugins, custom agents
5. **Playwright Agents** — Planner, Generator, Healer
6. **Cloud-Scale AI Testing** — BrowserStack AI
7. **Runtime Self-Healing** — your existing framework + AI API key

Full breakdown in `00-foundations/04-tool-landscape.md`.

---

## A note on scope

This guide doesn't tell you to use a specific vendor. Tool names appear throughout because examples are more useful than abstractions — but the **categories** are what matter. If Cursor isn't in your organization, use Copilot. If Rovo isn't, build a custom MCP agent. The workflow is the constant, not the vendor.

---

## Licence & contribution

This guide is maintained by VibeTestQ. If you find gaps, broken prompts, or workflow patterns that worked for your team — send them in. Every real-world report makes the next revision sharper.

> *"AI didn't break QA. It exposed a debt we refused to pay.*
> *Generation is 2026. Validation is 2023.*
> *That gap is not a problem. It's a career."*

Good luck. Go build.

— Sudhakar
