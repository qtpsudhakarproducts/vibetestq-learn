# Level 1 — Chapter 5: VS Code, GitHub Copilot & Skills.md

## What This Chapter Is About

This chapter sets up your AI-powered workspace — the environment where everything you build across Level 2 and Level 3 will live. You will install VS Code, configure GitHub Copilot, get an overview of Cursor IDE as an alternative, and most importantly, write your first Skills.md file. The Skills.md is what solves the context window problem from Chapter 3 — it makes your project context available to AI automatically, every session, without you having to repeat yourself.

---

## Why It Matters for QA

Until now, every AI interaction you have had was in the browser at Claude.ai. That is useful — but it is disconnected from your actual work. Your test files are in VS Code. Your feature files, your automation scripts, your project structure — all of it lives on your file system, not in a chat window.

VS Code with GitHub Copilot and Claude MCP (covered in Level 2) connects AI directly to where your work lives. Instead of copying code into a chat window, AI can read your files, suggest test additions, explain what your code does, and generate automation that follows your project's actual patterns — because it can see your project.

---

## VS Code — Your AI-Powered Workspace

### Plain Explanation

VS Code (Visual Studio Code) is a code editor made by Microsoft. It is free, cross-platform (Windows, macOS, Linux), and has become the standard editor for most software development and test automation work. For QA professionals, it is not just where you write code — it is the hub where your AI tools, test files, feature files, test data, and project configuration all live together.

### Why VS Code for QA (Not Just Developers)

Even if you have never written code, VS Code is valuable as a QA professional because:

- You can view and edit Gherkin .feature files with syntax highlighting
- You can run terminal commands (npm, git, Playwright) without leaving the editor
- GitHub Copilot lives inside it — suggestions appear as you type
- Claude connects to your file system through VS Code via MCP in Level 2
- Your entire AI testing toolkit — Skills.md files, prompts, feature files, test data — is organised and accessible in one place
- The integrated terminal means you can run tests and see results without switching windows

### Key VS Code Concepts for QA

**Workspace:** A folder (or collection of folders) you have opened in VS Code. Everything in the workspace is accessible to AI tools configured for that project.

**Explorer Panel:** The file tree on the left side. Your project structure lives here — tests, features, test data, prompts, skills files.

**Terminal:** An integrated command-line panel at the bottom of VS Code. You run npm commands, Playwright test runs, and git commands from here.

**Extensions:** Add-on capabilities. GitHub Copilot is an extension. There are extensions for Cucumber syntax highlighting, Playwright test running, and more.

**Command Palette:** Accessed with `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (macOS). The fastest way to run any VS Code command — open a file, run a task, install an extension.

---

## GitHub Copilot — AI Inside Your Editor

### Plain Explanation

GitHub Copilot is an AI code completion tool that lives inside VS Code. It reads what you are typing and the context around it — your file name, existing code, comments — and suggests what comes next. It appears as grey "ghost text" after your cursor. Press Tab to accept the suggestion. Keep typing to ignore it.

Copilot is powered by an LLM similar to Claude — it has read an enormous amount of code from public repositories and has learned the patterns of how code is written. When you start writing a Playwright test, it has seen enough Playwright tests to suggest what the next line should be.

### QA Analogy

Copilot is like having an autocomplete that understands what you are trying to do, not just what you are typing. Normal autocomplete suggests words based on the first few letters. Copilot suggests entire lines, functions, and test blocks based on your intent — inferred from the comment you wrote, the function name you started, and the existing code in the file.

When you type a comment like `// test that login fails with incorrect password`, Copilot will often suggest the complete test structure — the `test()` call, the page navigation, the form interaction, and the assertion — before you have typed a single line of test code.

### Three Ways to Use Copilot

**Inline suggestions:** The most common mode. As you type, grey suggestions appear. Tab to accept, Escape to dismiss, Alt+] to see the next suggestion.

**Copilot Chat:** A chat panel inside VS Code, similar to Claude.ai but with access to your open files. You can ask questions about your code, request changes, ask for explanations, or generate new code — while Copilot can see the files you have open.

**Slash commands in Copilot Chat:**
| Command | What it does |
|---|---|
| `/explain` | Explain what the selected code does in plain English |
| `/fix` | Suggest a fix for the selected code or error |
| `/tests` | Generate tests for the selected code |
| `/doc` | Generate documentation comments for the selected code |

### Practical Copilot Use for QA

**Completing a Playwright test from a comment:**
```typescript
// Test that adding more than 10 of the same item shows a quantity limit error
```
Copilot will often suggest the full test implementation based on this comment and the surrounding test file.

**Explaining a test you did not write:**
Select a function in a test file → Right-click → "Copilot: Explain" → Copilot explains what it does, what it tests, and what scenarios it covers.

**Fixing a failing test:**
When a test fails with an error, select the error message and the failing code → Open Copilot Chat → Type `/fix` → Copilot suggests what is wrong and how to fix it.

### What to Watch Out For

Copilot suggestions are generated from patterns in public code — they are not guaranteed to match your application or your conventions. Always read the suggestion before accepting it. A suggestion that looks right may assert the wrong value, use a selector that does not exist in your app, or miss an important await.

Apply the same review mindset from Chapter 1: Copilot generates the first draft. You review before accepting.

---

## Cursor IDE — Overview

### Plain Explanation

Cursor is a code editor built on the same foundation as VS Code — it looks and feels nearly identical, and supports the same extensions. The difference is that AI is built into the core of Cursor rather than added as an extension. Cursor's AI model can read your entire codebase, not just the files you have open, and can make changes across multiple files simultaneously.

### VS Code + Copilot vs Cursor

| Feature | VS Code + Copilot | Cursor |
|---|---|---|
| Inline suggestions | ✅ | ✅ |
| Chat inside editor | ✅ | ✅ |
| Whole-project context | ⚠️ Limited — open files only | ✅ Reads entire codebase |
| Multi-file edits | ⚠️ Growing | ✅ Native capability |
| Learning curve | Lower — familiar VS Code | Similar, slightly higher for advanced features |
| Cost | GitHub Copilot subscription | Cursor subscription |

### When to Consider Cursor

Cursor becomes more valuable when:
- Your project has grown large and you want AI to have context across many files
- You need to make coordinated changes across multiple test files simultaneously
- You prefer a more deeply integrated AI experience than Copilot provides

For this program, VS Code + Copilot is the primary setup. Cursor is covered so you can make an informed choice and explore it if your needs evolve.

---

## Skills.md — Your AI's Briefing Document

### Plain Explanation

Skills.md is a markdown file you write and store in your project. When AI reads it before responding, it has the context it needs to give you relevant, project-specific output — without you having to repeat that context in every prompt.

It is the solution to the context window problem from Chapter 3. Rather than starting every conversation with "we are building an e-commerce application, our tests use TypeScript, our convention for naming files is..." — you write all of that once in Skills.md and either paste it at the start of a conversation or (in Level 2) let Claude read it automatically via the Filesystem MCP.

### QA Analogy

Skills.md is your team's Definition of Done — but written for AI.

When a new developer joins your team, you give them a document: here is how we work, here are our coding standards, here is our naming convention, here is the Definition of Done for a feature. That document means every developer on the team produces work that follows the same conventions.

Skills.md does the same for AI. It tells Claude and Copilot: here is our project, here is our tech stack, here are our conventions, here are the rules to follow when generating output for us. Every AI-generated output that reads Skills.md first follows the same conventions.

### What Goes in a Skills.md File

A Skills.md file has four sections:

**1. Project Context** — What the application does, who uses it, what technology it uses.

**2. Test Conventions** — Naming patterns, folder structure, language (TypeScript or JavaScript), which framework is used.

**3. AI Rules** — Always, never, and always-include instructions for every AI interaction on this project.

**4. Examples** — 1–2 sample test cases or scenarios that show exactly the style and structure AI should follow.

### Your First Skills.md

Here is a template for a generic QA project Skills.md:

```markdown
# QA Skills — [Project Name]

## Project Context
[Project Name] is a [type of application] used by [type of users].
The frontend uses [technology]. The backend uses [technology].
The database is [type].

Key features we test:
- [Feature 1]
- [Feature 2]
- [Feature 3]

## Test Conventions
- Language: TypeScript
- Framework: Playwright
- Test files: /tests/specs/ — named [feature].spec.ts
- Page Object Models: /tests/pages/ — named [Feature]Page.ts
- Test data: /tests/data/ — JSON files named [feature]-data.json
- Feature files: /features/ — named [feature].feature

## AI Rules
- Always use TypeScript — never JavaScript
- Always use async/await — never .then() chains
- Always use Page Object Model — never inline selectors in spec files
- Always add assertions — never an action without a verification
- Always include both positive and negative scenarios
- Never hardcode test data — use test data files
- Never use fixed wait times (page.waitForTimeout) — use auto-waiting assertions

## Example Test Structure
[Paste 1-2 representative test cases from your project here]
```

### How Skills.md Evolves Across the Program

Skills.md is not written once and forgotten. It grows with your project and your understanding.

| Level | What Gets Added |
|---|---|
| Level 1 | Basic QA role, prompt preferences, output formats |
| Level 2 | MCP rules, Gherkin conventions, test data format, Veg Cart application context |
| Level 3 | Playwright patterns, POM structure, Cucumber configuration, CI rules |
| Level 4 | Coverage governance rules, exploration capture format, sprint workflow expectations |

By Level 4, your Skills.md is a comprehensive document that gives any AI agent full context about your project, your conventions, and your quality standards. It is the foundation of the compounding intelligence advantage described in Level 4.

### Skills.md vs Prompt Context

| Skills.md | Prompt Context |
|---|---|
| Written once, reused always | Written per prompt for the specific task |
| Provides project-level conventions | Provides task-specific information |
| Loaded automatically via MCP (Level 2) | Pasted or typed into each relevant prompt |
| Evolves across sprints | Changes per task |
| Ensures consistency across all AI interactions | Ensures accuracy for this specific interaction |

Both are necessary. Skills.md handles the standing context. Prompt context handles the task-specific detail.

---

## Setting Up Your Workspace

### VS Code Installation

1. Download VS Code from code.visualstudio.com
2. Install it with default settings
3. Open VS Code
4. Create a new folder for your QA toolkit: `[ProjectName]-qa-toolkit`
5. Open that folder in VS Code: File → Open Folder

### GitHub Copilot Setup

1. In VS Code, click the Extensions icon (left sidebar, looks like four squares)
2. Search "GitHub Copilot"
3. Click Install
4. When prompted, sign in with your GitHub account
5. Accept the Copilot access request
6. You will see the Copilot icon in the status bar at the bottom of VS Code when it is active

### Creating Your First Skills.md

1. In VS Code, right-click in the Explorer panel
2. Select "New Folder" → name it `.claude`
3. Inside `.claude`, right-click → "New File" → name it `skills.md`
4. Use the template from this chapter to write your first Skills.md
5. Save it

Your initial Skills.md for Level 1 will be short — a few sentences about your role and your preferred output formats. It will grow substantially in Level 2.

---

## Practice Tasks

### Task 1 — VS Code setup
Install VS Code. Create a folder called `qa-toolkit`. Open it in VS Code. Explore the Explorer panel, the terminal, and the command palette.

### Task 2 — Your first Copilot interaction
Open a new TypeScript file in VS Code. Type this comment:

```typescript
// Test that login fails when the password is incorrect
```

Press Enter and wait for Copilot's suggestion. Tab to accept it. Then write a follow-up comment:

```typescript
// Test that login succeeds with valid credentials
```

Notice how Copilot suggests a complete test based on the previous one.

### Task 3 — Write your first Skills.md
Using the template from this chapter, write a Skills.md file for a real project you have worked on or are currently working on. Write:
- Project context (3–5 sentences)
- Test conventions (folder structure, language, framework)
- 3–5 AI rules specific to your project
- One example test case or scenario

### Task 4 — Test your Skills.md
Open Claude.ai. Start a new conversation. Paste the contents of your Skills.md at the top of the conversation. Then ask for test cases for a feature of your application. Compare the output to what you would get without the Skills.md context.

---

## Key Takeaways

- VS Code is your AI-powered QA workspace — not just a code editor but the hub where your test files, AI tools, and project context all connect
- GitHub Copilot provides three modes of AI assistance: inline suggestions (as you type), Copilot Chat (conversation about your code), and slash commands (/explain, /fix, /tests)
- Always review Copilot suggestions before accepting — they are first drafts, not guaranteed-correct implementations
- Cursor IDE is an AI-native VS Code alternative with stronger whole-project context awareness — worth exploring as your project grows
- Skills.md is the solution to the context window problem — it stores your project context so AI does not need it repeated every session
- A Skills.md has four sections: Project Context, Test Conventions, AI Rules, and Examples
- Skills.md evolves across all four levels — it starts simple in Level 1 and becomes a comprehensive project knowledge document by Level 4
- The combination of Skills.md (standing context) and prompt context (task-specific detail) gives AI everything it needs to produce relevant, convention-following output

---

## Common Questions

**Q: Do I need to know how to code to use VS Code?**

A: For Level 1, no — you are using it as a file organiser and an environment to explore Copilot. The coding comes in Level 3. Level 2 uses VS Code for Gherkin files and MCP configuration, which does not require coding knowledge.

**Q: What is the difference between Skills.md and the Context component of a prompt?**

A: Skills.md is reusable, project-level context. The Context component of a prompt is task-specific context for one interaction. You use both: Skills.md loads your standing conventions; your prompt context describes the specific feature or task at hand. Think of Skills.md as your team handbook and prompt context as your sprint ticket.

**Q: Can I use multiple Skills.md files?**

A: Yes. You might have a project-level Skills.md (application context and conventions) and a level-specific Skills.md (the tools and patterns introduced at each level of this program). The Filesystem MCP in Level 2 can read multiple files — you reference which ones to load.

**Q: If Copilot sees my code, is it storing it somewhere?**

A: GitHub Copilot has privacy settings worth reviewing. For enterprise accounts, GitHub offers options to disable telemetry. For individual accounts, code used for suggestions may be transmitted to GitHub's servers for processing. Apply the same data sensitivity rules as any external tool: do not work on highly sensitive proprietary code with Copilot enabled unless you have verified your organisation's policy.

**Q: How is Skills.md different from a README?**

A: A README is written for humans — it explains what a project does. Skills.md is written for AI — it explains how to work on a project. They can coexist. Many teams have both: README explains the project to new team members, Skills.md explains the conventions to AI tools. They overlap in the project context section but diverge significantly in the AI Rules and Examples sections.
