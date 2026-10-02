# Tools Reference

> Comparison matrix for every tool category. Real names, real tradeoffs, no marketing.

---

## How to read this

Each category lists the main options with:
- **Best for** — the specific use case where this tool shines
- **Not ideal if** — situations where another tool fits better
- **Cost posture** — rough pricing category
- **Setup complexity** — hours to get it operational
- **Enterprise / SSO fit** — how well it fits larger orgs

Tool names evolve fast. Check vendor docs for current capabilities — the categories are stable, the specific tools are not.

---

## Category 1 — Browser Assistant Agents

### Perplexity Comet

- **Best for:** exploratory testing on standalone flows; "AI as a user" validation
- **Not ideal if:** you need CI-pipeline integration
- **Cost:** Subscription per user
- **Setup:** Install the browser; ~30 minutes to feel comfortable
- **Enterprise fit:** Growing; check for SSO support at purchase time

### Claude Chrome Extension

- **Best for:** AI co-pilot during manual exploration; reading a page and suggesting edges
- **Not ideal if:** you need a full browser replacement
- **Cost:** Free or bundled with Claude subscription
- **Setup:** Chrome extension install; ~10 minutes
- **Enterprise fit:** Strong — Claude has enterprise offerings including SSO, SOC 2

### Others to watch

- **Arc / Dia (from The Browser Company)** — emerging AI browsers
- **Opera Aria, Brave Leo** — built-in browser AI features

---

## Category 2 — MCPs (Model Context Protocol)

### Playwright MCP

- **Best for:** any workflow that needs AI to control Playwright
- **Not ideal if:** your stack is Cypress/Selenium (equivalent MCPs exist)
- **Cost:** Free / open-source
- **Setup:** 15 minutes for config; longer to write custom tool wrappers if needed
- **Enterprise fit:** Works in any environment that can run Node.js

### Chrome CDP MCP

- **Best for:** raw browser control (DOM, network, console) for custom validation logic
- **Not ideal if:** Playwright MCP already covers your needs
- **Cost:** Free / open-source
- **Setup:** ~30 minutes
- **Enterprise fit:** Works anywhere Chrome/Chromium can run

### Filesystem MCP

- **Best for:** letting AI read/write files in your repo (prompts, `graph.json`, test files)
- **Not ideal if:** you're using an AI IDE that already has file access
- **Cost:** Free / open-source
- **Setup:** Minutes
- **Enterprise fit:** Scope it tightly — don't expose the full filesystem

### Custom MCPs

For any internal system (proprietary CRM, internal task tracker, company auth service), write your own MCP server. The SDK is light; an MVP server is usually under 200 lines of code. Typical use: WF8 coverage audit, WF11 production feedback.

---

## Category 3 — AI IDE Browser Agents

### Cursor

- **Best for:** MCP-native composition; QA engineers stacking tools from multiple categories
- **Not ideal if:** your org mandates VS Code + Copilot (policy)
- **Cost:** $$ — subscription per user
- **Setup:** Zero if you know VS Code; <1 hour to feel native
- **Enterprise fit:** Solid; has team and enterprise plans
- **Best for workflows:** WF1, WF5, WF8, WF11 (anything composing MCPs)

### GitHub Copilot (Agent mode)

- **Best for:** teams already deep in GitHub; minimal friction adoption
- **Not ideal if:** you need cutting-edge MCP support (improving but not leader)
- **Cost:** $ if you already have Copilot
- **Setup:** Zero; already in VS Code
- **Enterprise fit:** Strongest — native GitHub Enterprise, Azure DevOps integration
- **Best for workflows:** WF6, WF10 (especially when tied to GitHub Actions)

### Google Antigravity

- **Best for:** browser-first validation; teams where the product is web/SaaS
- **Not ideal if:** your org is on Microsoft/GitHub stack primarily
- **Cost:** $$ — check current pricing
- **Setup:** Similar to VS Code; ~1 hour
- **Enterprise fit:** Growing; verify SSO at purchase
- **Best for workflows:** WF5, WF7 (browser-centric)

### Decision rule

If your team is 50%+ GitHub-native → Copilot. If MCP composition is your priority → Cursor. If browser validation is the core concern → Antigravity. When in doubt, run a 2-week bake-off on WF1 implementation across two options.

---

## Category 4 — Platform AI

### Atlassian Rovo

- **Best for:** teams on full Atlassian stack (Jira + Confluence + Bitbucket)
- **Not ideal if:** you use GitHub + Jira (only partial benefit)
- **Cost:** Add-on to existing Atlassian subscription
- **Setup:** ~1 day for admin config + team enablement
- **Enterprise fit:** Native — it's Atlassian
- **Best for workflows:** WF1 (Jira sync), WF4 (triage), WF9 (readiness posting), WF11 (ticket creation)

### Claude plugins / Connectors

- **Best for:** cross-platform reasoning (Jira + GitHub + Slack + Drive)
- **Not ideal if:** you need deep workflow automation inside one platform (Rovo is more integrated for Atlassian)
- **Cost:** Included with Claude subscription; API costs for heavy usage
- **Setup:** ~half day for connectors; prompting takes longer to refine
- **Enterprise fit:** Strong — enterprise Claude deployments support SSO, SOC 2
- **Best for workflows:** WF1, WF4, WF11 (anywhere you need to reason across tools)

### Custom MCP agents (you build)

- **Best for:** proprietary systems not covered by the vendors above
- **Not ideal if:** an off-the-shelf option already covers your case
- **Cost:** API costs for the LLM behind the agent; your engineering time to build
- **Setup:** 1–3 weeks for a production-grade agent
- **Enterprise fit:** Depends entirely on how you build it
- **Best for workflows:** WF8 (coverage audit), WF10 (quality gate), WF11 (production correlation)

---

## Category 5 — Playwright Agents

### Playwright Planner / Generator / Healer

- **Best for:** teams already using Playwright; WF5, WF6, WF7
- **Not ideal if:** your stack is Cypress or Selenium (equivalent agents exist or are emerging)
- **Cost:** Free / open-source; you pay for the LLM API calls
- **Setup:** ~half day to wire into an existing Playwright suite
- **Enterprise fit:** Playwright itself is strong in enterprise; the agents are still maturing

### Equivalents for other frameworks

- **Cypress:** emerging AI features, varies by version
- **Selenium:** community-built AI wrappers, less mature
- **WebdriverIO:** partial AI integration

If you're starting fresh and the choice is open, Playwright + agents is the most mature combination today.

---

## Category 6 — Cloud-Scale AI Testing

### BrowserStack AI Testing Agents

- **Best for:** cross-device / cross-browser matrix runs at scale; AI flakiness diagnosis
- **Not ideal if:** you only test one browser
- **Cost:** Cloud usage — per parallel session
- **Setup:** ~1 day to integrate with CI
- **Enterprise fit:** Strong — enterprise plans, SSO, private cloud options
- **Best for workflows:** WF5 (cross-browser test runs), WF8 (coverage across matrix)

### LambdaTest, Sauce Labs

- Similar category with emerging AI features
- Tradeoffs vary by pricing, browser inventory, and specific AI capabilities
- Do a spike test with your actual suite before committing

---

## Category 7 — Runtime Self-Healing

### Anthropic API (Claude)

- **Best for:** DOM reasoning, locator proposals, assertion suggestions
- **Not ideal if:** your use case is pure pattern matching (cheaper models suffice)
- **Cost:** Per API call; typically cents per heal
- **Setup:** ~1 hour to get the basic glue code in (see WF7 example)
- **Enterprise fit:** Strong — available on AWS Bedrock, Google Vertex, direct

### OpenAI API (GPT)

- **Best for:** similar capabilities to Claude; often interchangeable in WF7
- **Not ideal if:** your compliance team blocks OpenAI (rare, but happens)
- **Cost:** Per API call
- **Setup:** ~1 hour
- **Enterprise fit:** Strong — Azure OpenAI Service for compliant deployments

### Third-party wrappers

Various vendors sell "self-healing" as a standalone product. Usually they wrap Anthropic or OpenAI with extra UI. Evaluate: is the wrapper's value worth the middleman cost, or can you build the ~30 lines of glue yourself?

---

## Minimum viable stack

For a team just starting, here's a cost-effective baseline:

| Category | Tool | Approximate cost |
|----------|------|------------------|
| 3 — AI IDE | Cursor OR Copilot | ~$20/user/month |
| 2 — MCP | Playwright MCP + Filesystem MCP | Free |
| 4 — Platform AI | Rovo (if Atlassian) OR Claude plugins | $10–20/user/month |
| 5 — Playwright Agents | Playwright + agent libs | Free |
| 7 — Self-Healing | Anthropic API key | ~$5–20/month per team |

**Total:** ~$35–60 per user per month for full QA workflow capability.

Add category 6 (cloud-scale) when you need matrix testing.
Add category 1 (browser assistant agents) when WF2 becomes a focus.

---

## Tool decision heuristics

### If you're regulated (healthcare, finance, gov)
Prioritize tools with:
- SOC 2 Type 2 attestation
- Data residency options
- On-prem or private cloud deployment
- Audit logging
- No external LLM calls without explicit consent

Often this means: Azure OpenAI, AWS Bedrock Claude, enterprise Atlassian, on-prem MCP servers. The category stays the same; the vendor changes.

### If you're a startup with <20 engineers
Prioritize tools with:
- Usage-based pricing (not enterprise seat licenses)
- Fast setup
- Strong open-source defaults

Usually: Cursor + Playwright MCP + direct Anthropic API + custom lightweight agents.

### If you're mid-market (50–500 engineers)
Prioritize:
- Team plans with centralized billing
- SSO and basic governance
- Ability to standardize across teams

Usually: Copilot Enterprise + Rovo (if Atlassian) + Playwright agents + Anthropic Bedrock.

### If you're enterprise (500+)
Prioritize:
- Full compliance
- Procurement-friendly vendors
- Integration with existing stack

Usually: dedicated procurement; evaluate Cursor Enterprise, Copilot Enterprise, Atlassian Rovo, Claude via Bedrock, custom MCP agents for internal systems.

---

## Signals a tool isn't right for you

You've got the wrong tool in a category if:

- ⚠️ Your team doesn't use it unless forced
- ⚠️ Workarounds accumulate ("we use X, but for Y we have a separate script...")
- ⚠️ The tool claims to solve multiple categories but underdelivers on each
- ⚠️ Vendor lock-in (can't move a workflow to another tool without a rewrite)
- ⚠️ You're paying for features you never use

Tool decisions are not permanent. Every 12–18 months, re-evaluate.

---

## Resource links

Official documentation is where real detail lives. Check these first:

- **Cursor:** https://cursor.com/docs
- **GitHub Copilot:** https://docs.github.com/copilot
- **Google Antigravity:** https://antigravity.google
- **Atlassian Rovo:** https://www.atlassian.com/software/rovo
- **Claude / Anthropic:** https://docs.anthropic.com
- **Playwright:** https://playwright.dev
- **MCP spec:** https://modelcontextprotocol.io
- **BrowserStack:** https://www.browserstack.com/docs

URLs are accurate at time of writing; each vendor's homepage will redirect to current docs if paths change.

---

## Final word

The category is the contract. The vendor is the implementation.

If you internalize that, tool churn stops mattering. When Cursor gets replaced in 2028 by something better, your workflows still work — you just swap the implementation.

**Workflow composition is the durable skill.** Tools are replaceable.

---

## Next

- Back to `README.md`
- Pick a workflow from `01-workflows/` and start
