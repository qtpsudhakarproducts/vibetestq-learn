# Chapter 2: How WebMCP Differs From Other Approaches


The agent-and-web ecosystem has accumulated a lot of overlapping vocabulary in a short time. Local MCP, Remote MCP, browser agents, browser automation frameworks, WebMCP — they all sound similar and all involve agents interacting with applications, but they are solving different problems at different layers. This chapter walks through each one and explains where WebMCP fits.

## At a Glance

| Approach | Where It Runs | Who Calls It | When To Use |
|----------|---------------|--------------|-------------|
| **Local MCP** | A process on the user's machine | An MCP-aware app like Claude Desktop or Cursor | Personal tools, file system access, local databases |
| **Remote MCP** | A cloud server | Any MCP client over the network | Public APIs, shared services like Jira or GitHub |
| **Browser Agent** (Comet, Atlas, Claude in Chrome) | A whole browser, or as a feature inside one | The end user, conversationally | Cross-site autonomous tasks; sites that aren't agent-aware |
| **Playwright MCP** | A controlled, often headless browser | A developer or an agent acting as developer | Deterministic automation, testing, no end user present |
| **WebMCP** | Inside the page itself, in JavaScript | A browser agent, while the user is on the page | Cooperative real-time interaction, agent-aware sites |

These categories overlap a little in practice, but the distinctions matter when you are choosing what to build with.

## Local MCP

A Local MCP server is a process running on the user's own machine. The most common pattern is a small Python or Node program that exposes file system access, a local database, or a custom tool to an MCP-aware application like Claude Desktop, Cursor, or VS Code. The MCP client launches the server as a subprocess and communicates with it over standard input and output.

Local MCP is excellent when the data or capability you want to expose is already on the user's machine. Reading files in a specific folder, querying a local SQLite database, calling a CLI tool — all of these fit naturally. The trust model is simple: the user installed the server, the user runs the client, everything stays on their hardware.

The limits are equally clear. A local MCP server cannot help when the user is on a website. It cannot see what is on screen. It cannot use the user's logged-in session on a SaaS app. It is invisible to the website itself. If you are building a SaaS product and you want agents to be able to use your product, a local MCP server is not the answer — your customers would each have to install something, configure it, and the server still would not have any privileged context about what the user is currently doing.

WebMCP is different because it lives where the user already is — inside the browser tab — and it works without any installation step on the user's side beyond enabling the browser feature.

## Remote MCP

A Remote MCP server runs in the cloud and serves multiple users over the network, typically over Streamable HTTP or Server-Sent Events. Atlassian's Rovo MCP, GitHub's MCP server, and Linear's MCP server are well-known examples. The agent connects, authenticates, and calls tools just as it would with a local server, except the server is on someone else's infrastructure.

Remote MCP is the right choice when you have a backend service and you want agents to be able to use it from anywhere — from a Claude Desktop install, from a Cursor IDE, from a Slack bot, from a terminal. The server is always available, it has its own authentication, and it can serve any MCP-compatible client.

The trade-off is that Remote MCP servers are isolated from the user's browsing context. When an agent calls Atlassian's remote MCP to create a Jira ticket, the agent has to know which project, which assignee, which fields. If the user is currently looking at a sprint board in their browser and says "create a ticket for this bug," a remote MCP cannot see what "this" refers to without the agent having to describe the page back to the server, usually by means of additional tool calls or context-passing.

WebMCP and Remote MCP are not competing — they are layered. A mature agentic product often uses both: Remote MCP for backend operations that should be available everywhere, WebMCP for in-page operations that need live context. Chapter 3 expands on this partnership.

## Browser Agents (Comet, Atlas, Claude in Chrome)

A browser agent is an AI agent built into a web browser, with privileged access to read DOM content, take screenshots, and drive the browser's UI on the user's behalf. Perplexity's Comet, OpenAI's ChatGPT Atlas, and Anthropic's Claude in Chrome are the prominent examples in 2026, and Edge and Chrome are both shipping their own first-party agents.

A browser agent is the *consumer* in the WebMCP relationship — it is the thing that calls WebMCP tools when it finds them. So WebMCP and browser agents are not alternatives; they are complementary halves of the same workflow. The browser agent provides the LLM, the user-facing chat interface, and the orchestration logic. WebMCP provides the structured contract between that agent and a specific website.

Without WebMCP, a browser agent has to fall back to its general-purpose toolkit: take a screenshot, identify the relevant UI element with a vision model, generate a click or a keystroke, screenshot again to check whether it worked. This works, but it is slow, expensive, and fragile. With WebMCP, the same browser agent can call `searchFlights(...)` directly and skip all the inference.

There is a privacy and security angle worth flagging. Browser agents like Comet have had publicly documented prompt injection vulnerabilities — a malicious page can include hidden text that hijacks the agent's behaviour. WebMCP does not eliminate this risk entirely, but it shifts the agent's primary mode of interaction from "read whatever is on the page and decide what to do" to "call defined tools." The attack surface narrows because the agent's actions are more constrained.

## Playwright and Playwright MCP

Playwright is a widely used browser automation framework from Microsoft. It drives a browser programmatically through scripts written by a developer. Playwright MCP wraps Playwright behind an MCP server, so an agent can drive a browser using Playwright as its actuator — clicking, typing, navigating, screenshotting — all through MCP tool calls.

Playwright (and Playwright MCP) excel when there is no live user, when the workflow needs to be deterministic and repeatable, and when the developer is willing to write or maintain selectors. It is the standard tool for end-to-end testing and for automation pipelines. An agent driving Playwright is essentially a smart QA engineer — it can adapt to changes, retry intelligently, and reason about results — but it is still operating from outside the page, treating the page as a black box.

WebMCP differs in three meaningful ways. First, WebMCP runs *inside* the page, not outside it, so it has direct access to application state without going through the DOM. Second, WebMCP assumes a real user is present and watching, with safety guardrails designed around that assumption. Third, WebMCP is something the website provides to the agent, whereas Playwright is something the developer writes against the website. A WebMCP-enabled site is cooperating with the agent; a site automated through Playwright has no idea it is being automated.

The two also coexist. Playwright is the right tool for testing your WebMCP integration in CI — you can use it to drive a browser and verify that your tools register correctly, that they execute as expected, and that the safety patterns work. Chapter 6 returns to this in the context of WebMCP testing.

## So Where Does WebMCP Sit?

WebMCP fills a specific gap that none of the other approaches address well: cooperative, in-page, real-time interaction between a website and a browser agent while a real user is present. It assumes the user has a browser, has an agent, has the page open, and wants the agent to help them accomplish something on this specific site. In that scenario, none of the other tools are the right fit — Local MCP cannot see the page, Remote MCP cannot see the session, browser agents alone are reduced to scraping, and Playwright is for headless automation without a user.

You will most likely use several of these together in any serious product. Remote MCP for your backend services that should work from anywhere. WebMCP for the live page when the user is browsing. Playwright for testing both. The browser agent is the orchestrator that ties them together. The chapters that follow focus on how to do the WebMCP piece well.
