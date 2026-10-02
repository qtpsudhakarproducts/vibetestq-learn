# Chapter 7: The TAMASH Toolkit


TAMASH is a two-piece toolkit purpose-built for working with WebMCP. The first piece is a **Chrome extension** called **Tamash — AI Web Agent Bridge**, which connects your active browser tab to AI assistants and gives testers a powerful Tool Tester for inspecting WebMCP tools. The second piece is **`tamash-wmcp`**, an npm-distributed MCP server that bridges the extension's tool detection into MCP-compatible IDEs like Cursor, VS Code, and Claude Desktop. Together they cover the testing, debugging, and IDE-driven development workflows that the official Model Context Tool Inspector does not address.

This chapter covers both, with installation steps and configuration examples for each.

## Part A: The TAMASH Chrome Extension

### What It Does

The TAMASH extension makes any web app AI-agent-ready by automatically scanning the active page and turning its interactive controls into callable tools. When a website declares its own tools using the WebMCP standard, TAMASH discovers and exposes those first — giving AI assistants a clean, semantic interface that the site itself defined. When a site does not yet have WebMCP, TAMASH can still help by exposing DOM-derived tools as a fallback, which makes it useful even on legacy applications.

The extension has three operating modes that serve different audiences.

### Mode 1: Tool Tester — For Testers and Developers

The Tool Tester tab is the most valuable feature for QA engineers and for developers iterating on tool definitions. Open it on any page and TAMASH lists every tool it has discovered, along with the input schema for each. You can select a tool, fill in parameters, execute it manually, and see the response.

This is essentially a more capable version of the Model Context Tool Inspector. The advantages are that it handles both WebMCP tools and DOM-derived fallbacks, it integrates with the other TAMASH modes seamlessly, and it works on local files and on any deployed site without configuration changes.

For the workflow described in Chapter 5 — verifying registration, executing manually with hand-crafted parameters, isolating bugs between the `execute` function and the description — Tool Tester is the primary tool. Spend a session getting comfortable with it before moving to natural-language testing or IDE integration.

### Mode 2: MCP Mode — For IDE Integration

In MCP Mode, TAMASH runs a local Model Context Protocol server on a WebSocket. Any MCP-compatible AI IDE — VS Code Copilot, Cursor, Claude Desktop — can connect to that server and call the page's tools directly. The connection happens over localhost; nothing leaves your machine.

This is where TAMASH becomes a genuinely novel development tool. While you have a page open in Chrome with WebMCP tools registered, you can ask Claude Desktop to call those tools, get the results back inside your IDE, and reason about them in your editor. This pairs especially well with the `tamash-wmcp` npm package described in Part B, which is the MCP server you point your IDE at.

The privacy story matters: all credentials and tokens stay locally on your device and are never synced or transmitted to TAMASH's servers. This is the same model as a local MCP server — the bridge runs entirely on your hardware.

### Mode 3: Agent Mode — For End Users and PMs

In Agent Mode, TAMASH runs a built-in AI agent inside the extension sidebar. You connect your own OpenAI, Anthropic, Google, or Ollama account by pasting an API key, describe a goal in plain language, and the agent navigates pages, fills forms, and completes multi-step tasks while logging every tool call.

This mode is useful for two audiences. End users get a browser agent that respects WebMCP tools when sites provide them and falls back to DOM automation when they do not. Product owners, designers, and non-developers get a way to evaluate their own product through an agent's eyes — running real prompts and watching whether the agent picks the right tools is the fastest way to find out whether your tool descriptions are good enough.

Because TAMASH supports bring-your-own-key across multiple providers, it is also useful for the cross-model compatibility testing described in Chapter 6. The same prompt, the same tool surface, run against four different LLMs — that comparison is otherwise tedious to set up, and TAMASH handles it natively.

### Remote MCP Server Connectivity

In Agent Mode, TAMASH can also connect to remote MCP servers such as Jira and GitHub. This means an agent running inside TAMASH can combine live page actions (via WebMCP tools or DOM scraping) with external system operations (via remote MCP) in a single run. A common workflow is "look at this bug report on the support page and create a Jira ticket for it" — the page reading happens through WebMCP, the ticket creation happens through Atlassian's remote MCP, and TAMASH orchestrates both.

### Installation

The extension is on the Chrome Web Store at the URL provided in the documentation source. Installation is the standard Chrome extension flow:

1. Open the Chrome Web Store listing for **Tamash — AI Web Agent Bridge**
2. Click **Add to Chrome** and confirm the permissions prompt
3. Pin the extension to your toolbar for easy access

After installation, open any WebMCP-enabled page (the [Google flight search demo](https://googlechromelabs.github.io/webmcp-tools/demos/react-flightsearch/) is a good starting point) and click the TAMASH icon to verify the extension detects tools on the page.

### Configuration

TAMASH's three modes have separate configuration. Tool Tester needs no configuration — open it and it works.

For **MCP Mode**, you need to start the local server from the extension UI (a toggle in the MCP Mode tab) and note the WebSocket URL it exposes. Then configure your IDE to connect to that URL — the exact format depends on your IDE and is covered below in the `tamash-wmcp` section, since that npm package is the recommended bridge.

For **Agent Mode**, paste an API key from your preferred provider (OpenAI, Anthropic, Google, or Ollama) into the extension's settings. Multiple providers can be configured at once and switched between for comparison testing. Optionally, configure remote MCP server credentials for Jira, GitHub, or any other supported remote MCP service.

All credentials stay local. Nothing is synced to TAMASH or third-party servers.

## Part B: `tamash-wmcp` — The MCP Server for IDE Access

### What It Is

`tamash-wmcp` is an npm-distributed MCP server that exposes the WebMCP tools detected by the TAMASH extension to any MCP-compatible client. The package URL is `https://www.npmjs.com/package/tamash-wmcp`.

In plain terms: it is the bridge that lets your IDE call live page tools while you are developing. You install the package, run it, point your IDE's MCP configuration at it, and suddenly Cursor or Claude Desktop can call any tool registered on whatever page you have open in Chrome.

### Why It Matters

Traditional WebMCP development looks like this: write tool code in the IDE, switch to Chrome, refresh the page, open the inspector, manually call the tool, look at the response, switch back to the IDE, fix something, repeat. The context-switching tax is significant.

With `tamash-wmcp`, the loop becomes: write tool code in the IDE, ask the IDE's AI to test it. The IDE calls the live tool through `tamash-wmcp`, gets the response, and you can reason about it without leaving your editor. For test development, you can have the IDE generate test cases by inspecting tool schemas. For debugging, you can have the IDE compare expected and actual responses side by side. For exploration, you can ask the IDE "what tools are on this page?" and get back a structured list.

This is the IDE-driven development flow the TAMASH ecosystem unlocks, and it is the main reason to use both the extension and the npm server together.

### Installation

`tamash-wmcp` is published to npm. Install it globally so you can run it from any project, or install it locally per project — both work.

```bash
# Global install (recommended for most workflows)
npm install -g tamash-wmcp

# Or local install
npm install --save-dev tamash-wmcp
```

After install, you can run the server with:

```bash
npx tamash-wmcp
```

The server starts and listens on a default port (check the package's README for the current default — it has historically been a port in the 12000s range). Leave it running in a terminal while you work.

### Configuring Claude Desktop

Claude Desktop reads its MCP configuration from a JSON file. The location depends on your operating system:

- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`
- Linux: `~/.config/Claude/claude_desktop_config.json`

Add a `tamash-wmcp` entry under `mcpServers`:

```json
{
  "mcpServers": {
    "tamash-wmcp": {
      "command": "npx",
      "args": ["-y", "tamash-wmcp"]
    }
  }
}
```

Restart Claude Desktop. The Claude interface should now show `tamash-wmcp` in its tools list, and any tools registered on whatever page you have open in Chrome with the TAMASH extension running will be callable from Claude Desktop.

### Configuring Cursor

Cursor reads MCP configuration from `.cursor/mcp.json` either at the user level or per-project. Create the file (or edit it) with:

```json
{
  "mcpServers": {
    "tamash-wmcp": {
      "command": "npx",
      "args": ["-y", "tamash-wmcp"]
    }
  }
}
```

Restart Cursor or reload the MCP configuration from the Cursor command palette. The tools become available to Cursor's AI, and you can ask Cursor questions about the live page state directly from the editor.

### Configuring VS Code with Copilot

VS Code with Copilot's MCP support (or with the equivalent extension) uses a similar JSON configuration. Refer to your specific extension's documentation for the exact configuration file path, but the entry follows the same pattern as Cursor and Claude Desktop:

```json
{
  "mcpServers": {
    "tamash-wmcp": {
      "command": "npx",
      "args": ["-y", "tamash-wmcp"]
    }
  }
}
```

### Verifying the Connection

After configuring your IDE, the verification steps are the same regardless of which IDE you use:

1. Make sure the TAMASH Chrome extension is installed and MCP Mode is enabled
2. Open a WebMCP-enabled page in Chrome (the flight search demo is fine for testing)
3. Confirm TAMASH's Tool Tester shows the page's tools
4. Open your IDE's AI chat and ask "what tools are available?" or "what tools does the current page expose?"
5. The AI should respond with a list that includes the WebMCP tools from your open browser tab

If the AI does not see the tools, the most common causes are: TAMASH MCP Mode is not running, the IDE's MCP configuration points to the wrong place, or the IDE has not picked up the configuration change (restart it).

### Use Cases

A few concrete workflows that `tamash-wmcp` enables:

**Iterative tool development.** You are writing a new tool definition. Each save reloads the page. You ask Claude in the IDE to call the tool with various parameters and report results. No tab switching.

**Test case generation.** You have a tool with a complex schema. You ask Cursor "generate ten test cases that exercise this tool's edge cases" and Cursor inspects the schema through `tamash-wmcp`, generates test inputs, and runs them. You get back a report of which inputs succeeded and which failed.

**Cross-tool debugging.** Your application has two related tools that interact through shared state. You ask the IDE to call them in various sequences and report any inconsistencies. This is especially powerful for catching the kind of state-leak bug that single-tool tests miss.

**Documentation drafting.** You ask the IDE to call each tool, observe the response, and generate user-facing documentation that matches the actual behaviour. Great for keeping docs in sync with implementation.

**Ad hoc exploration.** Someone hands you a WebMCP-enabled site you have never seen before. You open it, run TAMASH, and ask your IDE "summarize what this site can do." The response comes from inspecting the actual tool surface, which is more accurate than reading the README.

## How TAMASH Fits Into the Tester's Workflow

For QA engineers, the practical integration with Chapter 5's testing methodology is:

- **Step 1 (Verify Registration)** uses TAMASH's Tool Tester to confirm tools appear with correct names, descriptions, and schemas.
- **Step 2 (Manual Execution)** uses Tool Tester's input field to run tools with hand-crafted JSON.
- **Step 3 (Natural-Language Testing)** uses TAMASH's Agent Mode with multiple LLM providers to test description quality across models.
- **Step 4 (Edge Cases)** combines Tool Tester for direct execution with Agent Mode for end-to-end scenarios.
- **Step 5 (Safety Patterns)** uses Agent Mode to drive realistic interactions and verify the human-in-the-loop guardrails fire correctly.

The `tamash-wmcp` MCP server is the right tool when testing crosses into automation territory. Pair it with Playwright in CI to drive a browser, register tools, and have an IDE-orchestrated AI verify responses match expectations. This is roughly where automated WebMCP regression testing is heading as a discipline.

## Privacy and Security

A note on the trust model. TAMASH stores all credentials and tokens locally on the user's device and does not sync or transmit them to TAMASH servers. The MCP bridge in `tamash-wmcp` runs locally and exposes only the tools on pages the user has explicitly opened. The architecture is identical in shape to running any other local MCP server — your code, your browser, your machine.

This matters when evaluating TAMASH for use in environments with strict data handling rules. If your team can use Claude Desktop or Cursor with local MCP servers, it can use TAMASH on the same basis.
