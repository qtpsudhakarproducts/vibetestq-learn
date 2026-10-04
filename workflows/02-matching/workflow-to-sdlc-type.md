# Matching Workflows to Your SDLC Type

> Start with the workflow your team actually follows.

---

## Why this matters

Implementing WF10 (CI Quality Gate) in a Type 1 team will fail. The culture isn't ready. Developers will override it. QA will give up.

Implementing WF1 (Requirements → Scenarios) only manually in a Type 3 team is leaving value on the table. You have the tools and culture — use them.

**Match the workflow to the type.** Mismatches are the single biggest reason these workflows fail in the field.

---

## Before you pick workflows: be honest about your type

Quick self-diagnosis.

### You are Type 1 (AI-Assisted) if:
- Your team "uses Cursor / Copilot" but sprint ceremonies are identical to 2021
- Code is in GitHub, tests in TestRail, requirements in Jira, docs in Confluence — all disconnected
- `graph.json` doesn't exist yet
- Tests are still authored manually; AI maybe drafts them in the IDE

### You are Type 2 (Spec-Driven) if:
- Requirements go through a testability gate before dev starts
- WF1 (scenarios from requirements) is active and approved before code
- Tests often derive from the approved scenarios
- You have a Project Repository — but not yet tight graph.json automation

### You are Type 3 (Parallel Stream) if:
- Dev and QA start at the same sprint moment, on the same spec
- WF1, WF5, WF8 are all active
- `graph.json` is maintained automatically on commits
- Both streams sync at defined gates, not at the end

### You are Type 4 (Agentic) if:
- Agents execute most of the lifecycle: plan, code, test, heal
- Humans review and govern; they don't author routinely
- WF4, WF6, WF9, WF10, WF11 all run automatically
- The CI pipeline contains AI-generated updates daily

### You are Type 5 (Regulated) if:
- All of Type 4, PLUS
- Every AI decision is logged with model, prompt, reviewer, timestamp
- Audit trail is preserved for 1+ year by policy
- Compliance team signs off on AI usage patterns

---

## The full matching matrix

For each workflow, the recommended level of automation by type:

| Workflow | Type 1 | Type 2 | Type 3 | Type 4 | Type 5 |
|----------|--------|--------|--------|--------|--------|
| **Foundations** | | | | | |
| Project Repository | Partial | Set up | Set up + automated | Set up + enforced | Set up + audited |
| graph.json | Manual | Manual | **Auto-updated** | **Auto + enforced** | **Auto + audited** |
| AI IDE | Individual | Standardized | Standardized | Standardized | Standardized + audited |
| **Design workflows** | | | | | |
| WF1 — Req → Scenarios | Ad-hoc | **Core gate** | **Core gate** | Automated | Core + audit |
| WF2 — Exploratory | Manual | Semi-structured | **Core** | Enhanced | Core + audit |
| WF3 — Test Data | Manual | Semi-auto | Auto | Fully auto | Auto + audit |
| WF4 — Bug Triage | Manual | Semi-auto | **Core** | **Fully auto** | Auto + audit |
| **Execution workflows** | | | | | |
| WF5 — Automation Gen | Partial | **Core** | **Core** | Fully auto | Auto + audit |
| WF6 — Maintenance | Ad-hoc | Manual proposals | **Core** | Fully auto | Auto + audit |
| WF7 — Self-Healing | Optional | Optional | Recommended | **Core** | Core + strict audit |
| WF8 — Coverage Audit | Occasional | Yes | **Core** | Automated loop | Core + mandatory |
| **Intelligence workflows** | | | | | |
| WF9 — Feature Gate | Manual | Checklist | **Core** | Auto gate | Core + strict audit |
| WF10 — CI Gate | Minimal | Rules active | **Core** | Core + auto-fix | Core + no override |
| WF11 — Prod Feedback | Ad-hoc | Partial | **Core** | Closed loop | Core + strict audit |

Read any column top-to-bottom to see what your type should be doing.

---

## Recommended starting workflow by type

### Type 1 — Start small, prove value
**Start with:** WF1 only.

Why: WF1 delivers immediate value (faster requirement-to-scenario), doesn't require graph.json to be live, and creates natural demand for the Project Repository. Once your team sees the scenario quality improve, they'll ask "what's next?"

**Don't try yet:** WF9, WF10, WF11. These require infrastructure and discipline Type 1 doesn't have.

### Type 2 — Build the backbone
**Start with:** foundations (Project Repository, graph.json) + WF1 + WF5.

Why: Type 2 already has spec-driven culture. Make WF1 mandatory, add WF5 to generate tests from specs, and your pipeline is half built. Add WF8 once graph.json is populated.

### Type 3 — Close the loop
**Start with:** WF1, WF5, WF8, WF11, in that order.

Why: Type 3 needs the full loop or parallel streams disconnect. WF11 is crucial — production must feed back into the sprint, otherwise "parallel" just means "faster generation, same validation debt."

### Type 4 — Governance and measurement
**Start with:** everything active, focus on WF9, WF10, and the governance files.

Why: When agents run most of the work, measurement and anti-patterns become the critical surface. Without WF9 and WF10, agent drift goes undetected.

### Type 5 — Audit and compliance
**Same as Type 4, PLUS:**
- Every workflow must log to a tamper-evident audit store
- Human review identities are cryptographically bound to the artifact
- Retention policies align with regulatory requirements
- External auditors receive read-only access

---

## When you're between types

Most teams aren't cleanly one type. You might be:

- Type 1 in your legacy codebase, Type 3 in the new microservice
- Type 2 on greenfield features, Type 1 on bug fixes
- Type 3 for the main product, Type 1 for the admin tools

**That's normal.** Pick the type *per codebase or per team*, not for the whole company.

---

## Anti-patterns in matching

### 🚫 "We're Type 3" (but you're actually Type 1)

The most common anti-pattern. Teams aspire to Type 3, describe themselves as Type 3, and adopt Type 3 workflows. Then WF10 blocks every PR, WF11 overwhelms the backlog, and the team reverts.

Be honest. You earn your way up, not describe your way up.

### 🚫 "We'll skip to Type 5 because we're regulated"

Regulated ≠ skipping steps. Type 5 is Type 4 + audit trail. You still need graph.json to be real, agents to be tested, reviewers to be trained. Regulation adds discipline — it doesn't shortcut capability.

### 🚫 "We'll do all 11 workflows at once"

You won't. Pick 1–3 and deliver them completely before adding more. Half-done workflows are worse than no workflows — they produce false signals.

### 🚫 "Type doesn't matter, just use AI tools"

Tools are replaceable. Workflow composition isn't. The type determines which workflows compose correctly. Ignoring it produces tool sprawl with no improvement in quality.

### 🚫 Moving up types to "look modern"

Don't adopt Type 4 workflows because a blog post said so. Adopt them because your type demands them and your team is ready.

---

## The one question that matters

> If I looked at your team on a random Wednesday, would `graph.json` be accurate?

- **If yes**, you're at least Type 2.
- **If no**, you're Type 1 — regardless of what tools you're using.

Fix graph.json first. Then the rest follows.

---

## Next

Now that you know your type:

1. Go to the workflow file for the workflow you chose to start with
2. Read its "Which SDLC type it fits" section
3. Implement the level of automation that matches your type
4. Revisit this file in 6 months — your type may have shifted
