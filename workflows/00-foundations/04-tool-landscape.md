# The 7 Categories of AI Validation Tools

> No single vendor sells all seven. Composition is the skill.

---

## The mental model

There are **7 distinct categories** of AI tools useful for QA. Each solves a specific problem. Each workflow in this guide pulls tools from 2–5 of these categories.

You don't need all 7 on Day 1. You need to know what each does so you can compose.

| # | Category | Primary job |
|---|----------|-------------|
| 1 | Browser Assistant Agents | Use the page like a real user |
| 2 | MCPs | Give any AI direct, standard access to browsers/tools |
| 3 | AI IDE Browser Agents | Run validation from the IDE |
| 4 | Platform AI | Tie Jira / Confluence / code together |
| 5 | Playwright Agents | Autonomous test lifecycle (plan, write, heal) |
| 6 | Cloud-Scale AI Testing | AI testing at device/browser scale |
| 7 | Runtime Self-Healing | Heal tests at runtime with an API key |

---

## 1. Browser Assistant Agents

**What they do:** Embed an AI agent into a browser that can *use* the page — click, fill, navigate — the way a human tester would.

**Examples:**
- **Perplexity Comet** — AI-first browser with a built-in assistant
- **Claude Chrome Extension** — Claude inside any Chrome tab
- (Others emerging — Arc, Dia, etc.)

**When to use:**
- Exploratory testing (WF2)
- User journey validation
- "AI-as-a-user" sanity checks before automation

**When NOT to use:**
- Deterministic regression (they're non-deterministic)
- CI pipelines (they need a browser UI)

**Cost posture:** Subscription per user.

---

## 2. MCPs — Model Context Protocol

**What they do:** A standardized way for AI models to talk to external tools. Think of it as USB-C for AI.

**Examples:**
- **Playwright MCP** — lets any AI control Playwright
- **Chrome CDP MCP** — raw Chrome DevTools Protocol access
- **Filesystem MCP** — read/write repo files
- **Jira MCP** — read/write tickets
- **Custom MCPs** — your team writes them for internal systems

**When to use:**
- Any workflow where AI needs to *do* something, not just read
- When you want vendor-neutral tool access (run the same prompt on Claude or Copilot)

**When NOT to use:**
- For single-vendor use cases where the vendor's native tool is simpler
- Until you have an MCP-compatible IDE or runtime

**Cost posture:** Free / open-source. You pay for the AI model that uses them.

---

## 3. AI IDE Browser Agents

**What they do:** IDEs that can read code, run tests, and drive browsers from one surface.

**Examples:**
- **Cursor** — MCP-native, browser tools via MCP
- **GitHub Copilot Agent mode** — growing browser capabilities
- **Google Antigravity** — browser-first IDE design

**When to use:**
- Every workflow. This is your command center.
- Especially when Dev and QA work in the same IDE (Type 3 SDLC)

**When NOT to use:**
- Rarely. The only reason not to use an AI IDE for QA workflows today is corporate policy — and that's a fixable problem.

**Cost posture:** $15–40/user/month typical.

Full comparison in `03-ai-ide-selection.md`.

---

## 4. Platform AI

**What they do:** AI that ties together your SDLC platforms — Jira, Confluence, Bitbucket, GitHub, Slack.

**Examples:**
- **Atlassian Rovo** — AI across Jira, Confluence, Bitbucket
- **Claude plugins / connectors** — Claude reasons across Jira, GitHub, Drive, Slack
- **Custom agents (on MCP)** — you build your own

**When to use:**
- Any workflow that spans "a Jira ticket came in" → "code was written" → "tests exist"
- Operationalizing the Project Repository across tool boundaries
- Most obviously: WF1, WF4, WF9, WF11

**When NOT to use:**
- When the workflow stays within one tool (pure code-level workflows)

**Cost posture:** Per-user subscription (Rovo, Copilot Enterprise) or API cost (custom).

---

## 5. Playwright Agents

**What they do:** Playwright's own agentic capabilities — the test lifecycle as composable agents.

**Examples:**
- **Planner Agent** — proposes test scenarios from a spec
- **Generator Agent** — writes executable Playwright code
- **Healer Agent** — fixes broken locators and timing at runtime

**When to use:**
- WF5 (automation generation)
- WF6 (test maintenance)
- WF7 (self-healing)

**When NOT to use:**
- If your stack isn't Playwright. Equivalent agents exist for Cypress, Selenium, etc. — use the ones that match your tool.
- For authoring UX of first-time test writers — they may need more guidance than the agent provides.

**Cost posture:** Free / open-source.

---

## 6. Cloud-Scale AI Testing

**What they do:** Run AI-authored or AI-executed tests across real device/browser matrices at scale.

**Examples:**
- **BrowserStack AI Testing Agents** — low-code authoring + cloud execution + AI flakiness diagnosis
- **LambdaTest / Sauce Labs AI features** — similar posture, different UX

**When to use:**
- When validation needs to run on 40+ device-browser combos
- When local AI IDE validation can't scale
- For flakiness diagnosis (they see patterns across thousands of runs)

**When NOT to use:**
- When your product has one browser target
- For exploratory (too structured for that)

**Cost posture:** Cloud usage — typically per parallel session.

---

## 7. Runtime Self-Healing

**What they do:** Inside your existing framework (Playwright / Selenium / Cypress), catch failures at runtime and call an AI API to fix them before the test fails.

**Examples:**
- Your framework + **Anthropic API** (Claude)
- Your framework + **OpenAI API** (GPT)
- Third-party wrappers that package this

**When to use:**
- WF7 (self-healing) — that's what this category is for
- Any existing framework you can't replace but want to make smarter

**When NOT to use:**
- As the *only* validation strategy — self-healing is a patch, not a cure
- Without a heal log — silent healing hides real regressions

**Cost posture:** Pay per API call. Typically a few cents per heal.

---

## Which categories are needed for each workflow

Quick reference. Full detail in each workflow file.

| Workflow | Categories used |
|----------|-----------------|
| WF1  Requirements → Scenarios | 2, 3, 4 |
| WF2  Exploratory Planning | 1, 3, 4 |
| WF3  Test Data Design | 2, 3 |
| WF4  Bug Triage | 3, 4 |
| WF5  Automation Generation | 2, 3, 5, 6 |
| WF6  Test Maintenance | 2, 3, 5 |
| WF7  Self-Healing Tests | 7 |
| WF8  Coverage Audit | 2, 3, 4 |
| WF9  Feature Readiness Gate | 3, 4 |
| WF10 CI Quality Gate | 2, 3, 4 |
| WF11 Production Feedback Loop | 3, 4, 5 + observability |

Notice: **Categories 3 (AI IDE) and 4 (Platform AI) show up in almost everything.** If you invest in two, invest in those.

---

## Picking your starter stack

You don't need everything on Day 1. A minimum viable setup:

- **1 AI IDE** (Cursor / Copilot / Antigravity)
- **2 MCPs** (Playwright MCP + one more)
- **1 Platform AI connector** (Rovo if on Atlassian, Claude plugin otherwise)
- **Your existing test framework** (Playwright / Cypress / Selenium)
- **1 AI API key** (Claude or OpenAI) for self-healing and custom agents

That's ~$100/user/month of tooling for full capability.

Add cloud-scale (category 6) only when you need matrix testing.
Add browser assistants (category 1) only when you start exploratory work.

---

## Common pitfalls

### 🚫 "We'll buy the end-to-end AI QA platform"

There isn't one. Vendors claiming this either lock you into their stack or under-deliver on one category. Composition is the skill.

### 🚫 "We'll only use Cursor" (or any single tool)

No single tool covers all 7 categories. Cursor is excellent for categories 2, 3 — not 5, 6, 7. Plan for composition.

### 🚫 "We'll build our own custom version of every category"

You won't have time. Build custom only where the market gap is real (usually in category 4 for niche platforms). Use off-the-shelf everywhere else.

### 🚫 "Free only"

Reasonable for learning, not for production. The AI API costs are trivial compared to the engineering time you're saving. Pay for the tools; they earn it back inside one sprint.

---

## What's next

You now have the foundations:
1. Project Repository structure
2. `graph.json` traceability
3. AI IDE picked and configured
4. Tool categories understood

**Pick one workflow from `01-workflows/` and start.** The natural first ones are:

- **WF1** — if requirements are your biggest pain
- **WF8** — if you don't trust your test coverage
- **WF11** — if production bugs keep repeating

Read the corresponding file and implement it.
