# Level 2 — Chapter 1: MCP in VS Code

## What This Chapter Is About

This chapter introduces the Model Context Protocol (MCP) — the technology that transforms Claude from a chat tool into a true QA collaborator that can read your project files and browse your live application. By the end of this chapter, you will have Local MCP configured with two servers (Filesystem and Playwright MCP), and you will understand the three types of MCP and when to use each.

---

## Why It Matters for QA

In Level 1, every AI interaction required you to copy-paste content into a chat window. Your feature files, your test data, your application — none of it was directly accessible to Claude. You were bridging the gap manually, every time.

MCP removes that gap. With Filesystem MCP configured, Claude can read your Veg Cart project files directly — your feature files, your skills.md, your test data — without you pasting anything. With Playwright MCP configured, Claude can open a browser, navigate to Veg Cart, interact with it, and report what it finds. You give it a charter; it explores.

This is the difference between AI as a writing assistant and AI as a QA collaborator.

---

## What is MCP?

### Plain Explanation

MCP stands for Model Context Protocol. It is an open standard — developed by Anthropic and now adopted by OpenAI, Google, and Microsoft — that defines how AI models connect to external tools, data sources, and environments.

Before MCP, every AI integration was custom-built. If you wanted Claude to read files, someone had to write a specific integration. If you wanted it to connect to Jira, someone had to write a different integration. Every tool required a different connector. This was the "N×M problem" — N AI models × M tools = a huge number of custom integrations to maintain.

MCP solves this with a single standard. Any tool that implements MCP can be connected to any AI that supports MCP. You configure it once — and it works.

### QA Analogy

MCP is like USB-C for AI. Before USB-C, every device had a different cable — your phone charger did not fit your laptop, which did not fit your camera. You carried multiple cables everywhere. USB-C standardised the connection — one cable, every device.

MCP does the same for AI tools. Before MCP: every AI-to-tool connection was custom. After MCP: one standard, every tool. Claude connects to your filesystem. Claude connects to Jira. Claude connects to GitHub. Same protocol, different servers.

---

## The Three Types of MCP

Understanding the three types clarifies when to use each and why.

### Type 1: Local MCP

**What it is:** An MCP server that runs on your machine, communicates through standard input/output (STDIO transport), and is configured in Claude Desktop's config file.

**Who can use it:** Only you — it runs on your local machine. Your team members do not have access to your local MCP servers.

**How to connect:** Edit Claude Desktop's configuration file (`claude_desktop_config.json`) to add server entries. Claude Desktop launches the server process when it starts.

**Transport:** STDIO — direct process communication on your machine. Fast, no network required, no authentication needed.

**Best for:**
- Filesystem access — reading and writing files in your project
- Playwright MCP — browsing your local or staging application
- Any tool that needs access to your local environment
- Learning and development

**Veg Cart example:** You configure Filesystem MCP pointing at your `/vegcart-qa` folder. Now Claude can read your feature files, your skills.md, and your test data without you pasting anything.

### Type 2: Remote MCP

**What it is:** An MCP server hosted on a server on the internet, using Streamable HTTP transport. It runs independently of your machine and can be accessed by multiple users.

**Who can use it:** Anyone with the URL and appropriate permissions. A Remote MCP server can serve your entire team.

**How to connect:** You or your team hosts the server on the internet. Claude Desktop or Claude.ai connects to it via URL.

**Transport:** Streamable HTTP — network communication over the internet. Supports authentication via OAuth or API keys.

**Best for:**
- Team-shared tools and context
- APIs that need to be accessible from multiple machines
- Services with authentication requirements
- Custom integrations your team builds and hosts

**Example:** Your team builds a Remote MCP server that connects to your internal test management database. Every team member connects to the same server URL and gets the same access.

### Type 3: Web Connectors (Remote MCP brokered by Anthropic)

**What it is:** Pre-built Remote MCP servers for popular tools (Jira, GitHub, Confluence, Slack, Zapier, Linear) that connect through Claude.ai's browser interface. Anthropic acts as the broker — the connection request comes from Anthropic's cloud infrastructure, not from your machine.

**Who can use it:** Any claude.ai user. No Claude Desktop required. No local configuration required.

**How to connect:** claude.ai Settings → Connectors → Add URL → Enter the MCP server URL provided by the tool vendor. Authenticate via OAuth. Done.

**Important technical detail:** Even though you connect from claude.ai in your browser, the actual requests to the MCP server come from Anthropic's cloud infrastructure — not from your machine. This means the MCP server must be reachable over the public internet. A server behind a corporate firewall will not work unless you allowlist Anthropic's IP ranges.

**Best for:**
- Jira — create tickets directly from Claude, read requirements from Jira
- GitHub — read issues, create PRs, read code
- Confluence — read documentation and requirement pages
- Slack — send test result summaries, read discussion threads
- Any vendor-provided MCP server

**Veg Cart example:** In Level 2 Day 1, you connect Confluence via Web Connectors. When you are writing requirements test cases, you ask Claude to "read the checkout requirements page from Confluence and generate test scenarios." Claude reads the page directly — you do not paste anything.

### Comparison Table

| | Local MCP | Remote MCP | Web Connectors |
|---|---|---|---|
| **Transport** | STDIO | Streamable HTTP | Streamable HTTP (brokered by Anthropic) |
| **Runs on** | Your machine | Internet-hosted server | Anthropic's cloud (connects to internet server) |
| **Connect via** | Claude Desktop config file | URL in config or Claude.ai | claude.ai Settings → Connectors |
| **Requires Claude Desktop** | Yes | Optional | No |
| **Who can access** | Just you | Anyone with URL | Any claude.ai user |
| **Setup** | Edit config JSON | Build or find a server | Paste URL, authenticate |
| **Best for** | Local files, Playwright, learning | Team-shared tools, custom APIs | Jira, GitHub, Slack, vendor tools |

---

## npm, npx & package.json — Just Enough

### Plain Explanation

To install and run Local MCP servers, you need Node.js and npm. You do not need to understand how Node.js works — you need to be able to run three commands confidently.

**npm (Node Package Manager):** An app store for code tools. When you need a new tool or library, npm downloads it from a public registry and installs it on your machine.

**npx:** Runs a package directly without installing it permanently. Useful for one-off runs or for packages you want to run without cluttering your system.

**package.json:** A file that lists what your project depends on — which tools and libraries it needs. When you share your project with someone else, they run `npm install` and everything listed in package.json is downloaded automatically.

### QA Analogy

**npm** is like an app store. You find the app (package) you need, and npm downloads and installs it.

**npx** is like food delivery. Instead of buying groceries and cooking, you order a meal. It arrives ready to use, and there is no leftover to store. You use it once and it is gone.

**package.json** is your shopping list. When you share your project, you do not share all the downloaded tools (that would be too large). You share the list. The other person runs `npm install` to download everything on the list themselves.

### The Three Commands You Need

```bash
# Install a package and save it to your project
npm install @playwright/mcp

# Run a package once without installing it permanently
npx @playwright/mcp

# See what packages are currently installed in your project
npm list
```

For MCP server configuration, you will mostly use `npx` — Claude Desktop runs the MCP server via npx each time it starts, without requiring a permanent install.

### Node.js Installation

Before npm works, you need Node.js installed. Download it from nodejs.org and choose the LTS (Long-Term Support) version. The installation includes npm automatically.

To verify the installation worked:
```bash
node --version    # Should show a version number like v20.11.0
npm --version     # Should show a version number like 10.2.4
```

---

## Claude Desktop & MCP Server Configuration

### Plain Explanation

Claude Desktop is the desktop application version of Claude. It supports Local MCP server configuration through a JSON config file. When Claude Desktop starts, it reads this file and launches the MCP servers you have configured.

### Step-by-Step Configuration

**Step 1: Install Claude Desktop**
Download from claude.ai/download. Install with default settings.

**Step 2: Find the config file**
- macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
- Windows: `%APPDATA%\Claude\claude_desktop_config.json`

If the file does not exist, create it.

**Step 3: Edit the config file**
Open it in VS Code (drag it to the VS Code window, or `code ~/Library/Application\ Support/Claude/claude_desktop_config.json` from the terminal).

**Step 4: Add your MCP servers**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/yourname/vegcart-qa"
      ]
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

Replace `/Users/yourname/vegcart-qa` with the actual path to your project folder.

**Step 5: Restart Claude Desktop**
Close and reopen Claude Desktop. If the servers are configured correctly, you will see a hammer icon (🔨) in the Claude interface indicating tools are available.

**Step 6: Verify**
Open a new conversation in Claude Desktop. Ask: "What files are in my project?" Claude should list the contents of your configured folder.

### Troubleshooting

| Problem | Likely Cause | Fix |
|---|---|---|
| Tools icon does not appear | Config file has a JSON syntax error | Validate JSON at jsonlint.com |
| "Server failed to start" | Node.js or npm not installed | Run `node --version` in terminal |
| No files listed | Wrong folder path in config | Check the path exists and is spelled correctly |
| Permission error | MCP server cannot read the folder | Ensure the folder has read permissions |

---

## Filesystem MCP — Claude Reads Your Project

### Plain Explanation

The Filesystem MCP server gives Claude read (and optionally write) access to a folder on your machine. Once configured, you can ask Claude to read any file in that folder without copying its contents into the chat.

### What This Changes for QA

| Before Filesystem MCP | After Filesystem MCP |
|---|---|
| Copy feature file contents → paste into Claude → ask question | "Read add-to-cart.feature and suggest 3 more edge case scenarios" |
| Copy skills.md → paste at start of every conversation | Skills.md is read automatically when you reference it |
| Copy test data file → paste → ask for analysis | "Read vegetables.json and identify any missing test categories" |
| Context limited to what you paste | Context available from the entire project folder |

### Veg Cart Example Prompts (with Filesystem MCP)

```
Read the file features/coupon.feature and identify which negative scenarios
are missing based on these coupon rules:
- Codes expire after 30 days
- Each code can only be used once per account
- Codes cannot be stacked
```

```
Read the test-data/vegetables.json file and generate 5 additional vegetable
records that cover boundary values for the price and stock fields.
```

```
Read the skills.md file in .claude/ and confirm you understand the testing
conventions for this project before we start today's session.
```

### Security Note

The Filesystem MCP gives Claude access to the folder you specify. Configure it to point at your project folder — not your home directory, not your Documents folder, not your Desktop. The principle of least privilege applies: give AI access only to what it needs for the task.

Never point Filesystem MCP at a folder containing:
- SSH keys or certificates
- `.env` files with production credentials
- Personal documents unrelated to the project
- System directories

---

## Playwright MCP — Claude Browses Your Application

### Plain Explanation

The Playwright MCP server opens a real browser and lets Claude interact with your application. Claude can navigate to URLs, click elements, fill in forms, take screenshots, and report what it observes. This powers AI-assisted exploratory testing (covered in Chapter 3).

### What This Enables for QA

This is not automated testing. Claude is not running a predefined script. It is exploring your application the way a tester would — noticing what it sees, trying interactions, and reporting observations.

When you give Claude a testing charter — "explore the checkout flow and report any unusual behaviour" — it opens Veg Cart in a browser, navigates through checkout, tries various inputs, observes the results, and gives you a structured report of what it found.

### Veg Cart Example

```
Open vegcart.com. Navigate to the checkout page.
Try applying the coupon code SAVE10. Note what happens.
Then try an invalid coupon code BADCODE. Note the error message and behaviour.
Try applying an empty coupon code. Note the behaviour.
Return a structured report of what you observed, including screenshots
of any unexpected behaviour.
```

Claude will:
1. Open a browser window
2. Navigate to vegcart.com
3. Go to the checkout page
4. Try each coupon scenario
5. Screenshot and report what it sees

You review the report and decide what warrants a bug report.

### This is Exploration, Not Automation

It is important to understand the distinction. Playwright MCP Claude is not running a pass/fail test. It is doing what you would do in an exploratory testing session — interacting with the application, observing, and reporting. The testing judgement still belongs to you.

The output from a Playwright MCP exploration session feeds:
- Your bug reports (for issues Claude found)
- Your test case design (for scenarios Claude tried that should become automated)
- Level 3 automation generation (exploration findings become the input for the Planner and Generator agents)

---

## The MCP Ecosystem

MCP has grown significantly since its launch. There is now a growing ecosystem of pre-built MCP servers for the tools QA teams use most.

| Tool | MCP Type | What You Can Do |
|---|---|---|
| Filesystem | Local | Read/write project files |
| Playwright | Local | Browse and interact with live apps |
| GitHub | Web Connector | Read issues, create PRs, read code |
| Jira | Web Connector | Create tickets, read requirements, update status |
| Confluence | Web Connector | Read documentation and requirement pages |
| Slack | Web Connector | Read threads, post summaries |
| Linear | Web Connector | Read and create issues |
| Notion | Web Connector | Read and write pages |

New MCP servers are published regularly. Check the MCP registry (mcp.so or the Anthropic documentation) for the latest available servers.

---

## Practice Tasks

### Task 1 — Install and configure
Install Node.js, Claude Desktop, and configure Filesystem MCP pointing at a project folder. Verify by asking Claude to list the files in the folder.

### Task 2 — Filesystem exploration
With Filesystem MCP configured, ask Claude to:
- Read your skills.md and confirm it understands the project conventions
- List all files in your features folder
- Read a specific feature file and suggest improvements

### Task 3 — Playwright MCP first use
Configure Playwright MCP. Give Claude this prompt:
```
Open google.com. Search for "Playwright testing tutorial".
Report the first 3 results including their titles and URLs.
```
This verifies Playwright MCP is working without needing your actual application.

### Task 4 — Understand which type to use
For each scenario below, identify which MCP type (Local, Remote, or Web Connector) is most appropriate:
- You want Claude to read your local Gherkin feature files
- Your team wants to share a Claude connection to your Jira instance
- You want Claude to browse your staging application
- You want to connect Claude to GitHub from your browser without installing anything

---

## Key Takeaways

- MCP (Model Context Protocol) is the universal standard for connecting AI to external tools — adopted by Anthropic, OpenAI, Google, and Microsoft
- There are three types: Local MCP (STDIO, your machine, Claude Desktop), Remote MCP (Streamable HTTP, internet-hosted), and Web Connectors (Remote MCP brokered by Anthropic via claude.ai)
- Local MCP is what you configure today — Filesystem MCP and Playwright MCP
- Filesystem MCP gives Claude read access to your project folder — no more copy-pasting file contents
- Playwright MCP gives Claude a real browser to explore your application — powering AI-assisted exploratory testing
- npm is the package manager for Node.js tools; npx runs packages without permanent installation; package.json lists your project's dependencies
- Configure Local MCP by editing Claude Desktop's `claude_desktop_config.json` — add server entries, restart, verify
- Web Connectors (Jira, GitHub, Slack, Confluence) are connected through claude.ai Settings → Connectors — no Claude Desktop required, but the MCP server must be reachable over the public internet
- Always apply the principle of least privilege — point Filesystem MCP only at your project folder, not your entire file system

---

## Common Questions

**Q: Do I need to understand JSON to edit the config file?**

A: Basic JSON is straightforward — it is just nested key-value pairs with specific punctuation rules. The most common error is a missing comma or a mismatched brace. VS Code highlights JSON errors as you type. Use jsonlint.com to validate if you are unsure.

**Q: What is the difference between Playwright MCP and running Playwright tests?**

A: Playwright tests are automated scripts that follow a predetermined sequence of steps and pass or fail based on assertions. Playwright MCP Claude is exploratory — it makes decisions about what to try next, adapts based on what it sees, and reports observations rather than pass/fail results. Tests are for regression; Playwright MCP is for exploration.

**Q: Can the Playwright MCP Agent access applications that require login?**

A: Yes. You can provide credentials in your prompt and Claude will log in as part of the exploration. Be careful with this — follow the data privacy rules from Level 1 Chapter 3. Use test account credentials, never production account credentials.

**Q: If Web Connectors are easier, why use Local MCP at all?**

A: Web Connectors only work for tools that have published a public Remote MCP server. Your local file system does not have a public MCP server — only Local MCP can access it. Similarly, Playwright MCP needs to run locally because it needs to control a browser on your machine. Local MCP is for local resources; Web Connectors are for cloud-based tools.

**Q: My organisation uses Jira but it is behind a firewall. Can I use the Jira Web Connector?**

A: Not directly — Web Connectors connect from Anthropic's cloud, not your machine, so firewall-protected Jira instances are not reachable. Solutions include: allowlisting Anthropic's IP ranges in your firewall, setting up a Remote MCP proxy that is publicly accessible, or using Claude Desktop with a Jira MCP server configured locally via the Jira API token.
