# Setting Up `graph.json` — The Living Traceability File

> The file that connects requirements, code, and tests. AI maintains it. You commit it.

---

## Why this file exists

Every AI tool that reasons about your project asks the same three questions:

1. *Which code implements requirement X?*
2. *Which tests cover code file Y?*
3. *What decisions shaped this feature?*

For 20 years, nobody could answer these without a human. Because nobody linked them.

`graph.json` is the link. It's a single file, in your repo, that maps every requirement to its code and tests, plus decisions and coverage.

**AI writes it. AI reads it. You commit it alongside code.**

---

## What it looks like

Minimum viable structure:

```json
{
  "version": "1.0",
  "last_updated": "2026-04-17T10:23:00Z",
  "requirements": [
    {
      "id": "REQ-142",
      "title": "Password reset via email",
      "status": "in_development",
      "linked_jira": "PROJ-142",
      "code_files": [
        "src/auth/password_reset.ts",
        "src/email/reset_template.ts"
      ],
      "test_files": [
        "tests/auth/password_reset.spec.ts",
        "tests/e2e/reset_flow.spec.ts"
      ],
      "decisions": [
        { "ref": "docs/decisions/002-rate-limit-password-reset.md", "summary": "Rate limit: 5/hour" },
        { "ref": "docs/decisions/003-no-sms-fallback-v1.md", "summary": "No SMS in v1" }
      ],
      "coverage": {
        "lines": 94,
        "branches": 88,
        "last_measured": "2026-04-17T10:20:00Z"
      }
    }
  ]
}
```

That's one requirement. A real project will have dozens. The file grows naturally.

---

## Full schema

Copy this as your starter. Save it as `.ai/graph.schema.json` for validation.

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Project Repository graph.json",
  "type": "object",
  "required": ["version", "requirements"],
  "properties": {
    "version":       { "type": "string" },
    "last_updated":  { "type": "string", "format": "date-time" },
    "requirements": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "title", "status"],
        "properties": {
          "id":           { "type": "string", "pattern": "^REQ-[0-9]+$" },
          "title":        { "type": "string" },
          "status":       { "enum": ["draft", "approved", "in_development", "done", "archived"] },
          "linked_jira":  { "type": "string" },
          "linked_slack": { "type": "string" },
          "code_files":   { "type": "array", "items": { "type": "string" } },
          "test_files":   { "type": "array", "items": { "type": "string" } },
          "decisions": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "ref":     { "type": "string" },
                "summary": { "type": "string" }
              }
            }
          },
          "coverage": {
            "type": "object",
            "properties": {
              "lines":         { "type": "number", "minimum": 0, "maximum": 100 },
              "branches":      { "type": "number", "minimum": 0, "maximum": 100 },
              "last_measured": { "type": "string", "format": "date-time" }
            }
          },
          "last_updated_by": { "enum": ["human", "ai-agent"] }
        }
      }
    }
  }
}
```

---

## How it gets created (automatically)

You don't write this file by hand. AI maintains it. Here's the rhythm:

### 1. On every commit

A pre-commit hook or CI step runs an AI agent that:

- Reads the commit diff
- Detects which REQ-IDs are affected (from branch name, commit message, or file paths)
- Updates `code_files`, `test_files`, and `coverage` for those requirements
- Re-commits `graph.json` with the change

### 2. On every requirement created

When a new `requirements/REQ-*.md` file is added, an agent:

- Extracts the REQ-ID and title from the markdown frontmatter
- Appends a new entry to `graph.json` with status `draft`
- Stays empty until code and tests link back

### 3. On every PR review

Reviewers see `graph.json` changes in the diff. If the linkage looks wrong (e.g., a REQ with zero code files after a feature claim), the PR is rejected.

---

## Setting it up — the actual steps

### Step 1: Create the starter file

```bash
mkdir -p .ai
cat > .ai/graph.json <<'EOF'
{
  "version": "1.0",
  "last_updated": "2026-01-01T00:00:00Z",
  "requirements": []
}
EOF
```

### Step 2: Add the schema

Save the schema from above as `.ai/graph.schema.json`.

### Step 3: Add a validation script

```bash
# package.json
{
  "scripts": {
    "validate-graph": "ajv validate -s .ai/graph.schema.json -d .ai/graph.json"
  }
}
```

Now `npm run validate-graph` fails the build if the file is malformed.

### Step 4: Write a prompt file for the AI updater

Create `.ai/prompts/update-graph.md`:

```markdown
# Task: Update graph.json

You are maintaining the Project Repository's graph.json file.

## Context files
- .ai/graph.json (current state)
- .ai/graph.schema.json (structure to follow)
- The current git diff

## Rules
1. Never invent REQ-IDs. Only use IDs that exist in requirements/REQ-*.md
2. For each changed file in the diff:
   - If it's in src/, add it to code_files of the relevant REQ
   - If it's in tests/, add it to test_files of the relevant REQ
3. Update the "last_updated" timestamp to current UTC time
4. Set last_updated_by to "ai-agent"
5. Never remove a linked file unless it no longer exists on disk
6. Validate the output against graph.schema.json before writing

## Output
Write the updated graph.json. Nothing else.
```

### Step 5: Wire into a pre-commit hook or CI

**Option A — Cursor / Copilot locally**

Add a git hook that runs before commit:

```bash
# .git/hooks/pre-commit
#!/bin/bash
# Ask the AI IDE to update graph.json based on staged changes
echo "Updating graph.json..."
# Your IDE's CLI command here, e.g.:
# cursor-cli run-prompt .ai/prompts/update-graph.md --include-diff
git add .ai/graph.json
```

**Option B — CI step (GitHub Actions example)**

```yaml
# .github/workflows/update-graph.yml
name: Update graph.json
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run AI updater
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          # your script that:
          # 1. reads git diff main...HEAD
          # 2. sends it + current graph.json to Claude/GPT via API
          # 3. receives updated graph.json
          # 4. validates against schema
          # 5. writes file
          node scripts/ai-update-graph.js

      - name: Commit graph.json
        run: |
          git config user.email "ai-agent@company.com"
          git config user.name "AI Agent"
          git add .ai/graph.json
          git diff --staged --quiet || git commit -m "chore: update graph.json"
          git push
```

**Option C — Via an MCP agent (most flexible)**

If your team uses Claude with MCP, an MCP server exposes the `graph.json` read/write tools. Cursor, Copilot, or any MCP-compatible IDE can update it in the commit loop.

---

## Who owns this file?

**QA leads own the schema and the rules.**
**AI owns the day-to-day updates.**
**Reviewers own the verification during PR review.**

If you let developers own it, they'll skip updates when sprint pressure hits. If you let AI run unreviewed, drift creeps in within weeks. Both is the answer — AI writes, humans verify.

---

## Common pitfalls

### 🚫 "We'll build it in a database, not a file"

Files win. A database needs admin access, migration, and permissions. A JSON file in the repo shows up in every PR diff, every reviewer sees it, and AI reads it without credentials.

### 🚫 "One huge graph.json for the whole monorepo"

If your repo has 500+ requirements, split by area: `.ai/graph.auth.json`, `.ai/graph.checkout.json`, etc. Keep each file under 1000 entries so AI can load it in context.

### 🚫 "We don't need coverage numbers in graph.json"

You do. Without coverage, WF8 (Coverage Audit) can't compare sprints. The numbers are what make the file actionable, not just descriptive.

### 🚫 "We'll link to Jira IDs only, not repo files"

Then you've just moved the fragmentation into the repo. The point is to link *both* Jira (for humans) *and* code files (for AI).

### 🚫 "AI keeps hallucinating file paths that don't exist"

This is why Rule 6 in the prompt says "validate against schema before writing" and Rule 1 says "never invent REQ-IDs." Make your AI prompt strict. And have the CI check: every listed file must exist on disk.

---

## What "working" looks like

- [ ] `.ai/graph.json` exists and validates against the schema
- [ ] Every active requirement has an entry
- [ ] Every entry has at least 1 code file and 1 test file (once development starts)
- [ ] The file is updated automatically on PR, not manually
- [ ] Coverage numbers update on every merge to main
- [ ] Your team can ask Cursor/Copilot: *"Show me everything related to REQ-142"* and get a correct answer

---

## What's next

Read **`03-ai-ide-selection.md`** — which AI IDE you should use as the OS for your Project Repository.
