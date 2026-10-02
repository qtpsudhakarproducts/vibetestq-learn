# Choosing Your AI IDE

> The AI IDE is becoming the OS of your project. Pick the right one before you build workflows on top.

---

## Why this matters

The AI IDE is where every workflow runs from. It:

- Reads your Project Repository
- Queries `graph.json`
- Talks to Playwright via MCP
- Drafts tests, generates scenarios, reviews PRs
- Connects to Jira, Slack, Confluence

If you pick the wrong IDE, workflows that depend on MCPs, plugins, or agent orchestration won't work. You'll be fighting the tool instead of building workflows.

This guide covers the three IDEs worth evaluating today.

---

## The three contenders

### 1. Cursor

- **Built from the ground up for AI.** Forked from VS Code, but AI is native — not a plugin.
- **MCP support:** excellent. First-class. Cursor was early to MCP and uses it as the primary way to connect tools (Playwright, Chrome CDP, Jira, etc.).
- **Context window:** large. Reads most of your repo without hitting limits.
- **Best for:** teams who want MCP-based composition. Strong for QA engineers stacking tools.

### 2. GitHub Copilot (Agent Mode)

- **The familiar choice.** Same VS Code you already use.
- **MCP support:** growing. Not as early as Cursor, but improving fast.
- **Enterprise fit:** strongest here — integrates with GitHub Enterprise, GitHub Actions, Azure DevOps natively.
- **Context window:** capable but depends on model plan.
- **Best for:** teams already deep in GitHub ecosystem. Low friction adoption.

### 3. Google Antigravity

- **Browser-first IDE.** Built with AI-generates-and-tests-in-browser as a primary use case.
- **MCP support:** yes, plus native browser tools.
- **Differentiator:** validation feels built-in, not bolted on. Useful for WF5 and WF6.
- **Best for:** teams whose product is browser-centric (most SaaS teams).

---

## The decision matrix

| Criterion | Cursor | Copilot | Antigravity |
|-----------|--------|---------|-------------|
| MCP composability | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |
| Enterprise / SSO fit | ⭐⭐ | ⭐⭐⭐ | ⭐ |
| Browser-native validation | ⭐⭐ | ⭐ | ⭐⭐⭐ |
| Price per seat | $$ | $ (if already on Copilot) | $$ |
| Learning curve for VS Code users | Low | None | Low |
| Good for WF1 (requirements → scenarios) | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐ |
| Good for WF5 (automation generation) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐ |
| Good for WF8 (coverage audit) | ⭐⭐⭐ | ⭐⭐ | ⭐⭐ |

---

## How to choose

### If your team already uses GitHub Copilot
Start with **Copilot Agent mode**. Zero adoption friction. You'll hit limits on MCP composition eventually — at that point, some power users can move to Cursor alongside, but Copilot is a fine starting point for most workflows.

### If your product is browser-heavy and validation matters most
Try **Antigravity**. The browser-first design means WF5 and WF7 feel natural instead of engineered.

### If QA engineers want to compose MCPs seriously
**Cursor.** The MCP ecosystem is most mature here. If you're planning to stack Playwright MCP, Chrome CDP MCP, Jira MCP, and custom MCPs — Cursor will be least painful.

### If you can't pick
Run a 2-week bake-off: same WF1 implementation in Cursor and Copilot. Whichever produces better scenarios with less prompting wins for your team.

---

## Setting up any AI IDE for QA workflows

Whichever IDE you pick, these are the common setup steps.

### Step 1: Point the IDE at your Project Repository

Open the repo root. Let the IDE index the full tree — including `.ai/`, `requirements/`, `scenarios/`, `docs/`.

### Step 2: Feed it your project context

Every AI IDE has a way to load persistent context. Use it:

- **Cursor:** `.cursor/rules/` files
- **Copilot:** `.github/copilot-instructions.md`
- **Antigravity:** project-level system prompt

In that file, reference your `.ai/project-context.md` and establish ground rules:

```markdown
# Project context for AI

Always read .ai/project-context.md before answering project questions.
Always read .ai/graph.json before claiming which tests cover which code.
Never invent file paths. If you don't know, say "I don't know, let me search."
Never remove entries from graph.json — only update.
When generating tests, reference the linked REQ-ID in a comment.
```

### Step 3: Connect your MCP servers

MCPs are how the IDE talks to external tools. Minimum useful set:

- **Playwright MCP** — for browser automation
- **Chrome CDP MCP** — for raw browser control
- **Jira MCP** or **Atlassian Rovo** (if on Atlassian stack) — for ticket sync

Follow each MCP server's installation guide. For most MCPs, it's:

```json
// IDE config (Cursor example — .cursor/mcp.json)
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp-server"]
    },
    "chrome-cdp": {
      "command": "npx",
      "args": ["@chromedevtools/mcp-server"]
    }
  }
}
```

### Step 4: Test the setup

Ask your IDE three questions. All should work:

1. *"Read REQ-142 and tell me what it requires."* → should summarize the markdown file
2. *"Which test files are linked to REQ-142?"* → should read `graph.json` and answer
3. *"Open google.com in Playwright and take a screenshot."* → should execute via MCP

If all three work, your foundation is ready for workflows.

---

## What about Claude Code / Windsurf / other IDEs?

They exist. They're improving fast. The criteria above still apply — evaluate on MCP support, enterprise fit, and fit with your browser needs.

The category is `AI IDE Browser Agents`. The vendor is replaceable. Your workflows should not depend on a specific vendor.

---

## Common pitfalls

### 🚫 "Each team member uses a different IDE"

Allowed — but your prompts, rules, and conventions must be in the repo, not in IDE-specific settings. Keep `.ai/` as the source of truth. Each IDE points to it.

### 🚫 "We'll use the AI IDE through the web interface"

Workflows require file-system access, MCP execution, and git integration. The desktop/local install is required for most workflows in this guide.

### 🚫 "Company policy blocks external AI"

Then use on-prem models (Claude via AWS Bedrock, Azure OpenAI, self-hosted). The IDE is the interface; the model behind it is replaceable. Plan for this upfront — don't let it block the Project Repository work.

### 🚫 "We picked an IDE without a plan"

Then workflows won't compose. Rebuild the foundation before doing more. It's cheaper now than after 5 sprints of sunk cost.

---

## What "working" looks like

- [ ] Every QA team member has the same AI IDE installed
- [ ] The IDE reads `.ai/project-context.md` automatically
- [ ] At least 2 MCP servers are installed and functional
- [ ] AI correctly answers: *"Which tests cover REQ-X?"* by querying `graph.json`
- [ ] AI correctly executes: *"Run a Playwright test against the staging URL"* via MCP

---

## What's next

Read **`04-tool-landscape.md`** — the 7 categories of AI validation tools, and which ones you'll use for which workflows.
