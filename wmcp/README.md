# WebMCP Documentation

> A complete guide to **WebMCP** — the new browser standard that lets websites expose structured tools to AI agents — covering what it is, how it differs from other approaches, how developers implement it, how testers validate it, and how the **TAMASH** toolkit fits into the workflow.

---

## Who Is This For?

This documentation is written for a mixed audience. Use the path that fits you:

- **Developers** building products that should work with AI agents → start with chapters 1, 4, 7, 8
- **Testers / QA engineers** preparing for a new testing discipline → start with chapters 1, 5, 6, 7
- **Product owners / decision-makers** evaluating whether to invest in WebMCP → start with chapters 1, 2, 3, 8
- **Architects** comparing approaches → start with chapters 2 and 3

---

## Table of Contents

| # | Chapter | What's Inside |
|---|---------|---------------|
| 1 | [Introduction](./01-introduction.md) | What WebMCP is, where it came from, the core problem it solves |
| 2 | [Comparison](./02-comparison.md) | WebMCP vs Local MCP, Remote MCP, Browser Agents (Comet, Atlas), Playwright MCP |
| 3 | [Advantages](./03-advantages.md) | Technical and business advantages, the combined pitch, honest counterweights |
| 4 | [Developer Guide](./04-developer-guide.md) | Setup, both APIs, tool definitions, safety patterns, implementation checklist |
| 5 | [Tester Guide](./05-tester-guide.md) | What testers verify, manual and natural-language testing, edge cases |
| 6 | [WebMCP Testing as a Discipline](./06-webmcp-testing.md) | The new testing paradigm beyond UI and API testing |
| 7 | [TAMASH Toolkit](./07-tamash-tools.md) | TAMASH Chrome extension and `tamash-wmcp` MCP server — full setup |
| 8 | [Flows and Conclusion](./08-flows-and-conclusion.md) | End-to-end flows for developers, users, testers, IDE workflows |

---

## Quick Highlights

- **89% token reduction** vs screenshot-based agent automation
- **Zero AI infrastructure burden** — the user's agent does the LLM work, not your servers
- **No inference cost on your margin** — users bring their own AI subscription
- **Resilient to UI redesigns** — agent contracts are the tool definitions, not the layout
- **Works with the browser session the user already has** — no separate auth, no new threat model
- **Available now** in Chrome Canary 146+ behind a flag, with W3C governance behind the standard

---

## Status

WebMCP is in **Chrome Early Preview Program** (Canary only, behind a flag). The W3C spec is in active development and the API has shifted across versions. Use this documentation for prototyping, learning, and preparing your team — not yet for production deployment.

---

*Last updated: April 2026*
