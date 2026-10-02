# Chapter 1: Introduction to WebMCP

## What is WebMCP?

WebMCP — short for **Web Model Context Protocol** — is a proposed browser standard that lets a website declare its capabilities as structured tools that AI agents can call directly. Instead of an agent having to read pixels, interpret a layout, and guess which button to click, the website tells the agent exactly what actions are available, what parameters they take, and what they return.

A travel website with WebMCP can publish a tool called `searchFlights` that takes typed parameters for origin, destination, dates, and passenger count. When an AI agent visits the site, it discovers that tool, calls it like an API, and gets back structured data. No screenshots. No DOM scraping. No fragile selectors.

WebMCP shipped as an early preview in **Chrome 146** in February 2026 and has continued in subsequent Canary builds. It is co-authored by Google and Microsoft under the **W3C Web Machine Learning Community Group**, which means it has a credible path to becoming a stable web standard rather than a single-vendor experiment.

## The Core Problem It Solves

Today, when an AI agent tries to use a website, it operates with severely limited information. It looks at a screenshot, runs that through a vision model, infers which input fields correspond to which concepts, generates clicks and keystrokes, and then takes another screenshot to verify the result.

This process is slow because every step requires another round trip through an LLM. It is expensive because vision tokens are not cheap. It is fragile because the smallest UI change breaks the agent's understanding of the page. And it is unreliable because the agent is fundamentally guessing — guessing which field is for the email address, guessing which button submits the form, guessing whether the operation succeeded.

The shift WebMCP introduces is small in code but large in implication: instead of the agent guessing what your site can do, your site tells the agent. The agent calls a named function with typed parameters. The site executes its existing business logic. The result comes back as structured data. Everything that used to be inference becomes contract.

## Where WebMCP Fits

WebMCP is one piece of a larger picture for how AI agents interact with the web. The broader landscape includes Model Context Protocol (MCP) servers running on backend services, browser-based agents like Perplexity Comet and ChatGPT Atlas, automation frameworks like Playwright, and now WebMCP for in-page cooperation.

The crucial mental model: **MCP runs on a server, WebMCP runs in the browser tab.** WebMCP tools are ephemeral — they exist only while the user has your page open, share the user's existing session and cookies, and disappear when the tab closes. This makes WebMCP fundamentally a tool for *in-session, cooperative interaction* between a user, an AI agent, and the website they are both looking at.

Chapter 2 covers exactly how WebMCP differs from each of these neighbouring approaches and when you would choose one over another.

## How It Works at a Glance

WebMCP exposes itself in the browser through a new JavaScript interface called `navigator.modelContext`. A website registers tools either declaratively (by adding attributes to HTML forms) or imperatively (by calling `navigator.modelContext.registerTool()` from JavaScript). Each tool has four parts:

- A **name** that the agent uses to invoke it
- A **description** in plain language that helps the agent decide when to use it
- An **input schema** in JSON Schema format that defines what parameters are valid
- An **execute function** that does the actual work and returns a structured response

The browser acts as the broker between the website and any AI agent that wants to use the site. When the user has the page open, the browser's built-in agent — or any agent the user has connected — can discover the tools, see their schemas, and call them with parameters. The browser also enforces safety rules, like making sure the user has to confirm destructive actions before they execute.

## Why Now?

Three trends are converging to make WebMCP timely. First, AI agents are moving from chat boxes into browsers — Comet, Atlas, Claude in Chrome, and the agents inside Edge and Chrome itself are all reaching general availability. Second, the cost of doing agent-driven web automation through screenshots has become prohibitive at scale, both in tokens and in latency. Third, websites have realized they cannot control how agents use them if they are passive participants — and that being agent-aware is going to be a differentiator soon.

WebMCP is the standard the web is converging on as a way to give agents a clean, fast, reliable contract instead of forcing them to scrape. Spending time with it now means understanding the patterns that will define agent-aware web development for the next decade.