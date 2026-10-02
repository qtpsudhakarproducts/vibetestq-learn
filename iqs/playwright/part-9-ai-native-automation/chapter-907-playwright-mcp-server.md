# Chapter 907 — Playwright MCP Server

The Playwright MCP server (`@playwright/mcp`) gives AI agents direct control of a real
browser through the Model Context Protocol. This chapter covers installation, configuration
for all major AI tools, the full tool set, browser_snapshot vs browser_screenshot,
practical locator discovery, and test generation by demonstration.

---

## Q907.1 — What is the Playwright MCP server?

The Playwright MCP server is an official Microsoft package (`@playwright/mcp`) that runs a
Playwright browser and exposes it as an MCP server. When an AI agent connects to it, the
agent can navigate pages, click elements, fill forms, take screenshots, and read the
accessibility tree — all through MCP tool calls in a live browser session.

Traditional workflow: Human writes code → runs it → reads output → adjusts.

Playwright MCP workflow: Agent calls browser_navigate → reads snapshot → calls
browser_click → reads updated snapshot → generates correct locator → writes test.

The agent acts on a live browser in real time and uses what it observes to generate
accurate code. Locators come from the actual page structure, not from guessing.

---

## Q907.2 — How do you install and start the Playwright MCP server?

```bash
# Run directly — no install needed
npx @playwright/mcp@latest

# Options
npx @playwright/mcp --headed                       # visible browser
npx @playwright/mcp --browser firefox              # use Firefox
npx @playwright/mcp --browser webkit               # use WebKit
npx @playwright/mcp --viewport-size '1280,720'     # custom viewport
npx @playwright/mcp --base-url 'http://localhost:4200'  # base URL
npx @playwright/mcp --device 'iPhone 14'           # mobile emulation
```

---

## Q907.3 — How do you configure the server for VS Code, Cursor, and Claude?

VS Code Copilot — `.vscode/mcp.json`:
```json
{
  "servers": {
    "playwright": {
      "type": "stdio",
      "command": "npx",
      "args": ["@playwright/mcp", "--browser", "chromium"]
    }
  }
}
```

Cursor — Settings → MCP Servers:
```json
{
  "playwright": {
    "command": "npx",
    "args": ["@playwright/mcp", "--headed"]
  }
}
```

Claude Desktop — `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

Docker/SSE (for CI or shared environments):
```json
{
  "playwright": {
    "type": "sse",
    "url": "http://localhost:3001/sse"
  }
}
```

---

## Q907.4 — What interaction tools does the Playwright MCP server expose?

Navigation tools:
- `browser_navigate` — go to a URL
- `browser_go_back` / `browser_go_forward` — browser history navigation
- `browser_reload` — reload the current page
- `browser_wait_for_page_with_url` — wait until URL matches a pattern

Interaction tools:
- `browser_click` — click an element by description or ref
- `browser_type` — type text character by character (triggers key events)
- `browser_fill` — fill a field directly (faster, for value assignment)
- `browser_clear` — clear an input field
- `browser_hover` — hover over an element
- `browser_check` / `browser_uncheck` — toggle checkboxes
- `browser_select_option` — select a dropdown value
- `browser_press_key` — press a keyboard key (Enter, Tab, Escape, ArrowDown, etc.)
- `browser_drag` — drag an element to a target position

Observation tools:
- `browser_snapshot` — return the accessibility tree (primary observation tool)
- `browser_screenshot` — take a screenshot as base64 PNG
- `browser_get_visible_text` — return all visible text on the page
- `browser_get_visible_html` — return the page's HTML

Tab and dialog tools:
- `browser_new_tab` / `browser_close_tab` / `browser_switch_to_tab`
- `browser_handle_dialog` — accept, dismiss, or fill browser alerts

Network and console tools:
- `browser_network_requests` — list recent network requests
- `browser_console_messages` — return browser console output

File and state tools:
- `browser_upload_file` — upload a file via a file input element
- `browser_save_as_pdf` — save the current page as PDF
- `browser_close` — close the browser
- `browser_frame_locator` — switch to an iframe context

---

## Q907.5 — What is browser_snapshot and why is it preferred over browser_screenshot?

`browser_snapshot` returns the accessibility tree as structured text with element
references. It is the primary page observation tool for most agent tasks.

Sample snapshot output:
```
navigation [landmark]:
  link 'Dashboard' [href=/dashboard, ref=e1]
  link 'Employee List' [href=/employees, ref=e2]
main [landmark]:
  heading 'Employee List' [level=1]
  button 'Add Employee' [ref=e3]
  table [ref=e4]:
    row [ref=e5]: 'John Smith | QA Lead | Active'
    row [ref=e6]: 'Jane Doe | Developer | Active'
```

The `ref` values let the agent call tools precisely:
```json
{ "name": "browser_click", "arguments": { "ref": "e3" } }
```

Snapshot vs screenshot comparison:

| Feature | browser_snapshot | browser_screenshot |
|---------|-----------------|-------------------|
| Token cost | ~300-800 tokens | ~3,000-15,000 tokens |
| Vision model needed | No | Yes |
| Returns element refs | Yes | No |
| Shows accessibility info | Yes | No |
| Works in headless | Yes | Yes |

Use `browser_screenshot` only to verify visual appearance. Use `browser_snapshot`
for navigation, interaction, and locator discovery.

---

## Q907.6 — How do you use Playwright MCP for locator discovery?

```
Human: What is the correct Playwright locator for the 'Apply' button on the leave form?

Agent: [calls browser_navigate to /leave/applyLeave]
Agent: [calls browser_snapshot]
Snapshot: button 'Apply' [role=button, name='Apply', ref=e12]
Agent: The correct locator is: page.getByRole('button', { name: 'Apply' })
```

This produces more reliable locators than guessing from code because the agent reads
the actual accessibility tree of the live page.

---

## Q907.7 — How does test generation by demonstration work?

You walk the agent through a flow step by step. The agent navigates and observes
each step. Then you ask it to generate the test.

```
Human: Navigate to the leave application page.
Agent: [navigates] I see: Leave Type dropdown, From Date, To Date, Comment, Apply button.

Human: Select 'Annual Leave' from Leave Type.
Agent: [calls browser_select_option on Leave Type with value 'Annual Leave']

Human: Set From Date to 2026-03-15 and To Date to 2026-03-16.
Agent: [fills date fields]

Human: Click Apply.
Agent: [clicks Apply button] Page shows: 'Successfully Saved' message.

Human: Now generate the Playwright test for this flow.
Agent: [generates complete TypeScript test using the observed locators and steps]
```

The agent uses refs from snapshots for reliable locators and structures the test
to match the observed flow exactly.

---

## Q907.8 — How do you use Playwright MCP for debugging a failing test?

When a test fails because a locator has changed, use the MCP server to find the new one:

```
Human: This test is failing — the locator page.getByTestId('save-btn') no longer works.
       Navigate to the employee edit page and find the current Save button locator.

Agent: [navigates to employee edit page]
Agent: [calls browser_snapshot]
Snapshot: button 'Save' [role=button, name='Save', ref=e8]
Agent: The save button no longer has a data-testid attribute.
       Use: page.getByRole('button', { name: 'Save' })
       This is also a more stable locator — no dependency on data-testid.
```

---

## Q907.9 — How do you use Playwright MCP in headless vs headed mode and when to choose each?

**Headless (default):** No visible browser window. Faster to start, works in CI and Docker.
Use for: bulk locator discovery, automated test generation pipelines, CI-integrated tasks.

**Headed:** Browser window is visible. Slower to start but the agent can see and describe
exactly what the user would see.
Use for: demonstrations, debugging visual issues, generating tests for visual flows
where appearance matters, initial exploration of a new application.

```bash
npx @playwright/mcp --headed   # for interactive debugging sessions
npx @playwright/mcp            # headless (default) for automated tasks
```

---

## Q907.10 — How do you handle authentication when using the Playwright MCP server?

Option 1 — Log in through MCP before each session:
```
Human: Log in with username 'admin' and password 'admin123'.
Agent: [navigates to login page, fills credentials, clicks Login]
Agent: Login successful. Now on dashboard.
```

Option 2 — Start with saved browser storage state:
```bash
# Start server with pre-authenticated storage state
npx @playwright/mcp --storage-state ./auth/admin.json
```

You generate the storage state file once:
```typescript
// scripts/save-auth.ts
const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();
await page.goto('/login');
await page.fill('[name=username]', 'admin');
await page.fill('[name=password]', 'admin123');
await page.click('[type=submit]');
await context.storageState({ path: './auth/admin.json' });
await browser.close();
```

Option 2 is faster for repeated sessions — the agent starts already authenticated.

---

## Q907.11 — How does the Playwright MCP server work in Docker for CI?

For CI pipelines or team-shared access, run the MCP server in Docker with SSE transport:

```dockerfile
# Dockerfile
FROM mcr.microsoft.com/playwright:v1.50.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
EXPOSE 3001
CMD ["npx", "@playwright/mcp", "--port", "3001"]
```

```yaml
# docker-compose.yml
services:
  playwright-mcp:
    build: .
    ports:
      - '3001:3001'
    environment:
      - BASE_URL=http://app:4200
```

AI agents connect via SSE URL:
```json
{
  "playwright": {
    "type": "sse",
    "url": "http://localhost:3001/sse"
  }
}
```

---

## Q907.12 — What are the network monitoring capabilities of the Playwright MCP server?

`browser_network_requests` returns a list of recent HTTP requests and responses.
This lets the agent observe API calls made by the application during a flow:

```
Human: After clicking Apply on the leave form, what API call was made?

Agent: [calls browser_click on Apply button]
Agent: [calls browser_network_requests]
Result:
  POST /api/v2/leave/applyLeave
  Status: 200
  Request body: { leaveTypeId: 1, fromDate: '2026-03-15', toDate: '2026-03-16' }
  Response: { id: 12345, status: 'Pending Approval' }

Agent: The leave application API is POST /api/v2/leave/applyLeave.
       I can generate both a UI test and an API test from this information.
```

This is useful for: discovering API endpoints to use in API-first test setup,
understanding what the UI does behind the scenes, and debugging network errors.

---

## Q907.13 — What are the main use cases for Playwright MCP in a test automation team?

**Use case 1 — New feature coverage (most common).**
Developer delivers a new feature. QA engineer connects Playwright MCP to an AI agent,
walks through the feature, gets locators and flow description, generates the first draft
test. Saves 1–2 hours per feature compared to manual test authoring.

**Use case 2 — Regression repair.**
UI changes break existing locators. Agent navigates to affected pages, reads new
accessibility tree, suggests updated locators. Saves 30 minutes per broken test.

**Use case 3 — Accessibility audit.**
`browser_snapshot` produces the accessibility tree for every page. If an element is
missing from the tree, it is inaccessible. The agent can identify accessibility gaps
by comparing what is visible in the browser against what appears in the snapshot.

**Use case 4 — Exploratory test generation.**
For a page with no existing tests, the agent navigates, explores, and generates
a set of test scenarios based on what it finds — without a human describing each step.

**Use case 5 — Training and onboarding.**
New engineers use the MCP server to learn the application — they describe what they
want to find and the agent shows them the correct locators and page structure.

---

## Q907.14 — What are the limitations of the Playwright MCP server?

**Context window consumption.** The server exposes 30+ tools. Each tool schema uses
~200–250 tokens. Connecting the server costs ~7,500 tokens before the first message.
For pure code-generation tasks in a large codebase, this competes with the tokens
needed for source file context.

**Not for CI test execution.** The MCP server is an authoring and debugging tool.
Production CI tests should run as stable Playwright code — not via MCP tool calls.
MCP sessions are non-deterministic and tool call overhead makes them too slow for CI.

**Security.** An AI agent with a connected Playwright MCP server has full browser
control. Point it at test environments only. Never connect it to production without
explicit permission and access controls.

**Session state.** The browser session is stateful. If a previous agent action leaves
the browser in an unexpected state, subsequent tool calls may fail in confusing ways.
Use `browser_navigate` to reset to a known URL at the start of each task.

---

## Q907.15 — How do you use browser_upload_file and browser_handle_dialog?

`browser_upload_file` uploads a file to a file input element:
```
Human: Upload the file '/home/user/test-contract.pdf' to the attachment field.
Agent: [calls browser_upload_file with element description and file path]
Agent: File uploaded. The attachment field shows 'test-contract.pdf'.
```

`browser_handle_dialog` handles browser-native dialogs (alert, confirm, prompt):
```
Human: Click Delete Employee, then accept the confirmation dialog.
Agent: [calls browser_click on Delete Employee button]
Agent: [calls browser_handle_dialog with action='accept']
Agent: Employee deleted. Page shows: 'Successfully Deleted'.
```

---

## Q907.16 — In your project, how do you use the Playwright MCP server?

In our OrangeHRM framework, the Playwright MCP server is a developer tool used in three
scenarios:

First, when a new page or form is added, a developer starts a Playwright MCP session in
Cursor, navigates to the new page, reads the snapshot, and asks the agent to generate the
page object. The snapshot-based locators are more reliable than writing them by hand from
reading HTML source.

Second, after a UI update that breaks locators, we connect the server and navigate to the
affected pages. The agent reads the new accessibility tree and suggests updated locators.
For a recent redesign that changed 8 form labels, using MCP to rediscover all 8 locators
took 12 minutes. Doing it manually by inspecting elements would have taken 45 minutes.

Third, during accessibility review sessions, we use `browser_snapshot` on every page and
check whether all interactive elements appear in the accessibility tree. Elements that are
visually present but missing from the tree are flagged as accessibility issues.

We never use the MCP server as the test runner — all actual test execution uses the
standard Playwright test runner with stable TypeScript tests.

---

## Chapter Summary

- The Playwright MCP server (`@playwright/mcp`) exposes a real browser as an MCP server. AI agents connect to it to navigate, interact, observe, and generate locators on live pages.
- Install via `npx @playwright/mcp`. Configure with `--headed`, `--browser`, `--base-url`, `--device` options. Connect via stdio (local) or SSE (Docker/remote).
- Configure in VS Code via `.vscode/mcp.json`, Cursor via Settings > MCP Servers, Claude Desktop via `claude_desktop_config.json`.
- Tool categories: navigation, interaction, observation, tabs/dialogs, network/console, files/state.
- `browser_snapshot` returns the accessibility tree with element refs. Preferred over `browser_screenshot` — uses 10–20x fewer tokens, needs no vision model, returns actionable refs.
- Key use cases: locator discovery, test generation by demonstration, regression locator repair, accessibility audit, new feature coverage.
- Authentication: log in through MCP or start with `--storage-state` pointing to a saved auth file.
- Docker/SSE: run the server in Docker for CI and team-shared access, connect via SSE URL.
- Limitations: 30+ tools = ~7,500 tokens on session start; not suitable for CI test execution; security risk if pointed at production.
