# YAML for GitHub Actions
### Everything You Need to Read and Write GitHub Actions Workflows

---

## Table of Contents

- [Part 1 — What YAML Is](#part-1--what-yaml-is)
- [Part 2 — The Golden Rules](#part-2--the-golden-rules)
- [Part 3 — Scalars — Strings, Numbers, Booleans, Null](#part-3--scalars--strings-numbers-booleans-null)
- [Part 4 — Lists](#part-4--lists)
- [Part 5 — Maps — Key Value Pairs](#part-5--maps--key-value-pairs)
- [Part 6 — Nesting — Lists Inside Maps, Maps Inside Lists](#part-6--nesting--lists-inside-maps-maps-inside-lists)
- [Part 7 — Multiline Strings](#part-7--multiline-strings)
- [Part 8 — Comments](#part-8--comments)
- [Part 9 — Anchors and Aliases — Reusing Values](#part-9--anchors-and-aliases--reusing-values)
- [Part 10 — Quoting Rules](#part-10--quoting-rules)
- [Part 11 — Common Mistakes](#part-11--common-mistakes)
- [Part 12 — YAML in GitHub Actions — How It Maps](#part-12--yaml-in-github-actions--how-it-maps)
- [Part 13 — Reading a Full Workflow File](#part-13--reading-a-full-workflow-file)
- [Part 14 — GitHub Actions Expressions](#part-14--github-actions-expressions)
- [Part 15 — Quick Reference](#part-15--quick-reference)

---

## Part 1 — What YAML Is

YAML stands for **YAML Ain't Markup Language**. It is a human-readable data format used for configuration files. GitHub Actions workflows are written in YAML.

YAML represents three things:
- **Scalars** — a single value: a string, number, boolean, or null
- **Lists** — an ordered sequence of values
- **Maps** — a collection of key-value pairs

Everything in a YAML file is one of these three things, nested inside each other.

### YAML vs JSON

The same data can be written in both. YAML is designed for humans to read and write.

**JSON:**
```json
{
  "name": "Alice",
  "age": 30,
  "skills": ["testing", "automation"]
}
```

**YAML:**
```yaml
name: Alice
age: 30
skills:
  - testing
  - automation
```

Same data. YAML uses indentation and dashes instead of braces, brackets, and commas.

---

## Part 2 — The Golden Rules

These rules must be followed exactly. Violating them causes the file to fail.

### Rule 1 — Indentation uses spaces, never tabs

```yaml
# ✅ Correct — spaces
jobs:
  test:
    runs-on: ubuntu-latest

# ❌ Wrong — tab characters will cause a parse error
jobs:
	test:
		runs-on: ubuntu-latest
```

Your editor must be configured to insert spaces when you press Tab. In VS Code: bottom-right corner → click "Spaces: 2" → confirm.

### Rule 2 — Indentation level defines structure

Two items at the same indentation level are siblings. An item indented further is a child of the item above it.

```yaml
parent:
  child1: value1       # child of parent
  child2: value2       # child of parent
sibling: value3        # sibling of parent — same level
```

### Rule 3 — Indentation must be consistent within a block

You can use 2 spaces or 4 spaces — but you must use the same number throughout the same level.

```yaml
# ✅ Consistent 2-space indentation
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

# ❌ Inconsistent — mixing 2 and 4 spaces
jobs:
  test:
      runs-on: ubuntu-latest   # 6 spaces — will break
```

### Rule 4 — Colons need a space after them in maps

```yaml
# ✅ Correct
name: Alice

# ❌ Wrong — no space after colon
name:Alice
```

Exception: colons inside quoted strings are fine — `"http://example.com"`.

### Rule 5 — Case sensitive

`Name`, `name`, and `NAME` are three different keys.

---

## Part 3 — Scalars — Strings, Numbers, Booleans, Null

### Strings

Strings do not need quotes in most cases:

```yaml
name: Alice Johnson
city: New York
command: npx playwright test
```

Strings need quotes when they contain special characters:

```yaml
message: "Hello: World"          # colon inside
tag: "@smoke"                    # starts with @
version: "1.0"                   # looks like a number but is a string
path: "test-results/"            # trailing slash can be ambiguous
empty: ""                        # empty string
```

### Numbers

```yaml
age: 30
workers: 4
timeout: 60
percentage: 98.5
```

YAML automatically treats these as numbers. If you want the string "30" not the number 30:

```yaml
version: "30"
```

### Booleans

```yaml
enabled: true
debug: false
continue-on-error: true
fail-fast: false
```

YAML also accepts `yes`/`no` and `on`/`off` as booleans — but avoid these in GitHub Actions to prevent confusion. Use `true`/`false` only.

### Null

```yaml
value: null
value: ~          # also null
value:            # empty value — also treated as null
```

---

## Part 4 — Lists

### Block style — one item per line with a dash

```yaml
browsers:
  - chromium
  - firefox
  - webkit
```

Each `-` is followed by a space, then the value.

### Flow style — all on one line

```yaml
browsers: [chromium, firefox, webkit]
```

Both are identical. Block style is easier to read for long lists. Flow style is compact for short lists.

### List of numbers

```yaml
shards: [1, 2, 3, 4]
ports: [3000, 8080, 9000]
```

### List with mixed types

```yaml
values:
  - hello
  - 42
  - true
  - null
```

### Empty list

```yaml
items: []
```

---

## Part 5 — Maps — Key Value Pairs

### Basic map

```yaml
person:
  name: Alice
  age: 30
  city: London
```

`person` is the key. Its value is a map with three keys: `name`, `age`, `city`.

### Flow style — all on one line

```yaml
person: {name: Alice, age: 30, city: London}
```

Block style is preferred for readability.

### Nested maps

```yaml
database:
  host: localhost
  port: 5432
  credentials:
    username: admin
    password: secret
```

`database.credentials.username` is `admin`.

### Empty map

```yaml
config: {}
```

---

## Part 6 — Nesting — Lists Inside Maps, Maps Inside Lists

This is where most confusion happens. Read carefully.

### Map inside a list

Each list item is a map. The map keys are indented under the `-`:

```yaml
steps:
  - name: Checkout code
    uses: actions/checkout@v4

  - name: Setup Node
    uses: actions/setup-node@v4
    with:
      node-version: '20'

  - name: Run tests
    run: npx playwright test
```

Each `-` starts a new list item (a new step). The keys `name`, `uses`, `with`, `run` belong to that item.

This is the most common pattern in GitHub Actions workflows.

### List inside a map

```yaml
job:
  runs-on: ubuntu-latest
  browsers:
    - chromium
    - firefox
```

### List inside a map inside a list

```yaml
steps:
  - name: Run tests
    env:
      CI: true
      BROWSERS:
        - chromium
        - firefox
```

### Map inside a map inside a list

```yaml
steps:
  - name: Cache browsers
    uses: actions/cache@v4
    with:
      path: ~/.cache/ms-playwright
      key: playwright-ubuntu
```

`with` is a map nested inside the step map (which is a list item).

---

## Part 7 — Multiline Strings

Two operators handle multiline strings: `|` and `>`.

### `|` — Literal block — preserves newlines

Each line becomes a separate line in the string. Use for shell scripts.

```yaml
- name: Create env file
  run: |
    mkdir -p test-data
    cat > test-data/.env << EOF
    BASE_URL=https://example.com
    USERNAME=admin
    EOF
```

The shell receives three separate commands, each on its own line. Without `|` this would fail.

```yaml
# What the shell receives:
# mkdir -p test-data
# cat > test-data/.env << EOF
# BASE_URL=https://example.com
# USERNAME=admin
# EOF
```

### `>` — Folded block — folds newlines into spaces

Line breaks become spaces. Useful for long single-line values you want to wrap for readability.

```yaml
description: >
  This is a very long description
  that spans multiple lines
  but will be joined into one line.
```

The string becomes: `This is a very long description that spans multiple lines but will be joined into one line.`

### Trailing newline behaviour

| Indicator | Trailing newline |
|-----------|-----------------|
| `|` | Kept (one newline at end) |
| `|-` | Stripped (no newline at end) |
| `|+` | All trailing newlines kept |
| `>` | Kept |
| `>-` | Stripped |

In GitHub Actions `run:` blocks use `|` — the trailing newline is harmless.

### Multiline shell command without `|`

Use `\` to continue a long command on the next line:

```yaml
- name: Run tests
  run: |
    npx playwright test \
      --grep @regression \
      --workers 4 \
      --retries 2
```

---

## Part 8 — Comments

Comments start with `#` and continue to the end of the line. They are ignored by the parser.

```yaml
# This is a full-line comment

name: My Workflow     # This is an inline comment

jobs:
  test:
    # This job runs the full test suite
    runs-on: ubuntu-latest
```

There are no multiline comment blocks in YAML. Prefix each line with `#`.

```yaml
# Line 1 of a long comment
# Line 2 of a long comment
# Line 3 of a long comment
```

---

## Part 9 — Anchors and Aliases — Reusing Values

Anchors let you define a value once and reference it elsewhere. Useful for avoiding repetition in long YAML files.

### Define an anchor with `&`

```yaml
defaults: &defaults
  runs-on: ubuntu-latest
  timeout-minutes: 30
```

`&defaults` names this block `defaults`.

### Reference with `*`

```yaml
jobs:
  smoke:
    <<: *defaults          # merges the defaults map into this map
    steps:
      - run: npx playwright test --grep @smoke

  regression:
    <<: *defaults          # same defaults applied here
    steps:
      - run: npx playwright test --grep @regression
```

`<<:` is the merge key — it merges all key-value pairs from the referenced anchor into the current map.

### Anchor on a scalar value

```yaml
node_version: &node '20'

steps:
  - uses: actions/setup-node@v4
    with:
      node-version: *node    # references the anchor

  - name: Check version
    run: node --version       # *node used in a different context
```

### Anchor on a list

```yaml
common_steps: &common_steps
  - uses: actions/checkout@v4
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
  - run: npm ci

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - *common_steps         # inlines the list here
      - run: npx playwright test
```

> **Note:** GitHub Actions does not support YAML anchors in all contexts. Anchors work within a single workflow file for values, but not across files. For cross-workflow reuse, use reusable workflows instead.

---

## Part 10 — Quoting Rules

### When you must quote

| Situation | Example | Why |
|-----------|---------|-----|
| Contains `: ` | `"Hello: World"` | Would be parsed as a map key |
| Starts with `@` | `"@smoke"` | Special character |
| Starts with `{` or `[` | `"[1,2,3]"` | Would be parsed as flow collection |
| Starts with `*` or `&` | `"*ref"` | Anchor/alias syntax |
| Looks like a boolean | `"true"`, `"yes"`, `"on"` | Would be parsed as boolean |
| Looks like a number | `"20"`, `"1.0"` | Would be parsed as number |
| Contains `#` | `"value # not a comment"` | `#` after space starts a comment |
| Empty string | `""` | Empty value is null without quotes |

### Single quotes vs double quotes

**Single quotes** — literal. No escape sequences processed.

```yaml
path: 'C:\Users\Alice\tests'     # backslashes are literal
message: 'It''s working'         # to include a single quote, double it
```

**Double quotes** — escape sequences processed.

```yaml
path: "C:\\Users\\Alice\\tests"  # \\ becomes \
newline: "Line 1\nLine 2"        # \n becomes a newline
tab: "Column1\tColumn2"          # \t becomes a tab
```

In GitHub Actions, double quotes are most common and most predictable.

---

## Part 11 — Common Mistakes

### Wrong indentation — the most common error

```yaml
# ❌ Wrong — steps is not indented under test
jobs:
  test:
    runs-on: ubuntu-latest
steps:                           # should be indented under test
  - run: npx playwright test

# ✅ Correct
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test
```

### Missing space after dash

```yaml
# ❌ Wrong
steps:
  -name: Run tests               # dash must be followed by a space

# ✅ Correct
steps:
  - name: Run tests
```

### Missing space after colon

```yaml
# ❌ Wrong
name:Alice

# ✅ Correct
name: Alice
```

### Tab instead of spaces

This always causes a parse error. Configure your editor to use spaces.

```yaml
# ❌ Wrong — invisible tab character
    runs-on: ubuntu-latest

# ✅ Correct — spaces
    runs-on: ubuntu-latest
```

### Unquoted special values mistaken for booleans

```yaml
# ❌ Wrong — 'on' is parsed as boolean true in standard YAML
on: push

# ✅ Correct in GitHub Actions — GitHub treats this correctly
# but be careful with similar values in other contexts
```

GitHub Actions specifically handles `on:` as the trigger key — but in other YAML contexts `on`, `yes`, `no`, `off` are all booleans. Use `true`/`false` to be safe.

### Mixing list styles

```yaml
# ❌ Wrong — cannot mix flow and block in the same list
items:
  - one
  - [two, three]     # this is valid YAML but confusing — avoid

# ✅ Consistent
items:
  - one
  - two
  - three
```

### Duplicate keys

```yaml
# ❌ Wrong — duplicate keys: only the last one is kept
name: Alice
name: Bob          # overwrites the first — Alice is lost
```

### Forgetting `|` for multiline shell commands

```yaml
# ❌ Wrong — only the first line runs
- name: Setup
  run:
    mkdir -p test-data
    npm ci

# ✅ Correct
- name: Setup
  run: |
    mkdir -p test-data
    npm ci
```

### Indenting the content of `|` wrong

The content of a literal block must be indented further than the `run:` key:

```yaml
# ❌ Wrong — content at same level as run:
- name: Setup
  run: |
  mkdir -p test-data     # should be indented more

# ✅ Correct
- name: Setup
  run: |
    mkdir -p test-data
```

---

## Part 12 — YAML in GitHub Actions — How It Maps

Understanding how YAML structure maps to GitHub Actions concepts.

### The top-level keys

```yaml
name: ...        # workflow name shown in GitHub UI
on: ...          # trigger configuration — map or scalar
env: ...         # workflow-level environment variables
jobs: ...        # map of job definitions
```

### `on:` — the trigger map

```yaml
on:
  push:                          # event name
    branches: [main]             # filter — list of branch names
  pull_request:
    branches: [main]
    types: [opened, synchronize]
  schedule:
    - cron: '0 0 * * *'         # list of cron schedules
  workflow_dispatch:             # no value needed — just presence
```

`on:` maps event names to their configuration maps.

### `jobs:` — a map of job definitions

```yaml
jobs:
  test:                          # job ID — you choose this name
    runs-on: ubuntu-latest
    steps: ...

  report:                        # another job
    needs: test                  # depends on test job
    runs-on: ubuntu-latest
    steps: ...
```

`jobs:` is a map. Each key is a job ID. Each value is a map describing that job.

### `steps:` — a list of step maps

```yaml
steps:
  - name: Checkout               # step 1 — a map
    uses: actions/checkout@v4

  - name: Install deps           # step 2 — another map
    run: npm ci

  - name: Run tests              # step 3
    run: npx playwright test
    env:                         # nested map inside the step map
      CI: true
```

`steps:` is a list. Each `-` is a new step. Each step is a map with keys like `name`, `uses`, `run`, `with`, `env`, `if`, `id`.

### `with:` — parameters for an action

```yaml
- uses: actions/setup-node@v4
  with:                          # map of parameters
    node-version: '20'
    cache: 'npm'
```

### `env:` — environment variables

```yaml
# Job-level env — available to all steps
jobs:
  test:
    env:
      CI: true
      TEST_ENV: dev

    steps:
      # Step-level env — available to this step only
      - name: Run tests
        run: npx playwright test
        env:
          BASE_URL: ${{ secrets.BASE_URL }}
```

### `strategy.matrix:` — generate multiple jobs

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4]       # list — generates 4 jobs

    steps:
      - run: npx playwright test --shard=${{ matrix.shard }}/4
```

`${{ matrix.shard }}` accesses the current matrix value — 1, 2, 3, or 4 depending on which job is running.

---

## Part 13 — Reading a Full Workflow File

Read this file top to bottom, understanding each section:

```yaml
# ── 1. Workflow name ─────────────────────────────────────────────────────────
name: PR Smoke Check

# ── 2. Triggers ──────────────────────────────────────────────────────────────
# This workflow fires when a PR is opened, updated, or reopened targeting main
on:
  pull_request:
    branches: [main]
    types: [opened, synchronize, reopened]

# ── 3. Concurrency ───────────────────────────────────────────────────────────
# Cancel any in-progress run for the same PR when a new commit is pushed
concurrency:
  group: pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true

# ── 4. Jobs ───────────────────────────────────────────────────────────────────
jobs:

  # ── 4a. Job definition ─────────────────────────────────────────────────────
  smoke:                              # job ID
    runs-on: ubuntu-latest            # machine type
    timeout-minutes: 20               # kill job if it runs too long

    # ── 4b. Steps ──────────────────────────────────────────────────────────
    steps:

      # Step 1 — Checkout source code onto the runner
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2 — Install the correct Node.js version
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'          # parameter to the action
          cache: 'npm'                # built-in npm cache

      # Step 3 — Clean install from package-lock.json
      - name: Install dependencies
        run: npm ci

      # Step 4 — Install only Chromium (faster than all browsers)
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium

      # Step 5 — Write credentials from secrets to a file
      # The | operator means: everything indented below is one multiline string
      - name: Create environment file
        run: |
          mkdir -p test-data
          cat > test-data/.env.dev << EOF
          BASE_URL=${{ secrets.BASE_URL }}
          ADMIN_USERNAME=${{ secrets.ADMIN_USERNAME }}
          ADMIN_PASSWORD=${{ secrets.ADMIN_PASSWORD }}
          EOF

      # Step 6 — Run only @smoke tagged tests
      # env: sets environment variables for this step only
      - name: Run smoke suite
        run: npx playwright test --grep @smoke
        env:
          CI: true
          TEST_ENV: dev

      # Step 7 — Upload report only when tests failed
      # if: failure() means this step is skipped on success
      - name: Upload report on failure
        uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: smoke-failure-pr${{ github.event.pull_request.number }}
          path: playwright-report/
          retention-days: 7
```

Reading this file section by section:
- The workflow is named `PR Smoke Check`
- It fires on pull requests targeting `main`
- Duplicate runs for the same PR are cancelled
- One job called `smoke` runs on Ubuntu with a 20 minute timeout
- The job has 7 steps: checkout, Node setup, install deps, install browsers, write env file, run tests, upload report on failure

---

## Part 14 — GitHub Actions Expressions

GitHub Actions has an expression syntax for dynamic values. Expressions are always wrapped in `${{ }}`.

### Accessing context values

```yaml
${{ github.actor }}                    # user who triggered the run
${{ github.ref_name }}                 # branch name
${{ github.run_number }}               # incrementing run counter
${{ github.sha }}                      # full commit SHA
${{ github.event_name }}               # push, pull_request, schedule, etc.
${{ github.event.pull_request.number}} # PR number
${{ github.repository }}               # org/repo-name
```

### Accessing secrets

```yaml
${{ secrets.MY_SECRET }}
${{ secrets.BASE_URL }}
${{ secrets.ADMIN_PASSWORD }}
```

### Accessing inputs from workflow_dispatch

```yaml
${{ github.event.inputs.environment }}
${{ github.event.inputs.tag }}
```

### Accessing matrix values

```yaml
${{ matrix.shard }}
${{ matrix.browser }}
```

### Accessing step outputs

```yaml
steps:
  - name: Cache browsers
    uses: actions/cache@v4
    id: playwright-cache              # give the step an ID
    with:
      path: ~/.cache/ms-playwright
      key: playwright-${{ runner.os }}

  - name: Install browsers
    if: steps.playwright-cache.outputs.cache-hit != 'true'    # reference by ID
    run: npx playwright install --with-deps chromium
```

### Accessing job results

```yaml
jobs:
  test:
    # ...

  report:
    needs: test
    steps:
      - name: Notify
        run: echo "Test job result was ${{ needs.test.result }}"
        # result is: success, failure, cancelled, or skipped
```

### Conditional expressions

```yaml
if: github.event_name == 'schedule'
if: github.ref == 'refs/heads/main'
if: failure()
if: success()
if: always()
if: steps.my-step.outcome == 'failure'
if: needs.test.result == 'success'
```

### Ternary-style expression

GitHub Actions does not have a ternary operator, but this pattern works:

```yaml
${{ github.event_name == 'schedule' && 'nightly' || 'manual' }}
```

If `github.event_name == 'schedule'` is true, result is `nightly`. Otherwise `manual`.

### hashFiles — cache key from file content

```yaml
key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
```

Generates a hash of the file. Changes when the file changes — invalidates the cache.

### format — string interpolation

```yaml
${{ format('Hello {0}, your PR is #{1}', github.actor, github.event.pull_request.number) }}
```

### toJSON — convert object to JSON string

```yaml
${{ toJSON(github) }}     # dump the entire github context as JSON — useful for debugging
```

### fromJSON — parse JSON string

```yaml
${{ fromJSON('{"key": "value"}').key }}    # returns "value"
```

---

## Part 15 — Quick Reference

### YAML data types

| Type | Example | Notes |
|------|---------|-------|
| String (unquoted) | `hello world` | Fine unless special chars present |
| String (quoted) | `"hello: world"` | Use when value contains `:`, `@`, `#` etc. |
| Integer | `42` | Parsed as number |
| Float | `3.14` | Parsed as number |
| Boolean | `true` / `false` | Use these — avoid yes/no/on/off |
| Null | `null` or `~` or empty | |
| List (block) | `- item` | One item per line |
| List (flow) | `[a, b, c]` | All on one line |
| Map (block) | `key: value` | One pair per line |
| Map (flow) | `{key: value}` | All on one line |
| Multiline literal | `\|` then indented content | Newlines preserved |
| Multiline folded | `>` then indented content | Newlines become spaces |

### Indentation rules at a glance

```yaml
# Root level — no indentation
name: My Workflow
on:
  push:                    # 2 spaces under on:
    branches:              # 4 spaces (2 more)
      - main               # 6 spaces (list under branches)
jobs:
  test:                    # 2 spaces under jobs:
    runs-on: ubuntu-latest # 4 spaces
    steps:                 # 4 spaces
      - name: Step 1       # 6 spaces (list item)
        run: echo hello    # 8 spaces (key inside list item)
```

### Step keys

| Key | Purpose | Example |
|-----|---------|---------|
| `name` | Label shown in UI | `name: Run tests` |
| `uses` | Run a published action | `uses: actions/checkout@v4` |
| `run` | Run a shell command | `run: npm ci` |
| `with` | Parameters for `uses` | `with: node-version: '20'` |
| `env` | Env vars for this step | `env: CI: true` |
| `if` | Condition | `if: failure()` |
| `id` | Reference this step later | `id: cache-step` |
| `continue-on-error` | Don't fail job on error | `continue-on-error: true` |
| `timeout-minutes` | Step timeout | `timeout-minutes: 10` |
| `working-directory` | Run command in this dir | `working-directory: ./app` |

### Job keys

| Key | Purpose |
|-----|---------|
| `runs-on` | Runner OS — `ubuntu-latest`, `windows-latest`, `macos-latest` |
| `steps` | List of steps |
| `needs` | Job dependency |
| `if` | Condition for the whole job |
| `env` | Env vars for all steps |
| `timeout-minutes` | Job timeout |
| `strategy` | Matrix configuration |
| `concurrency` | Cancel duplicate runs |
| `environment` | GitHub Environment name |
| `outputs` | Values this job exposes to others |
| `continue-on-error` | Don't fail workflow if this job fails |

### Expressions quick reference

| Expression | Returns |
|-----------|---------|
| `${{ github.actor }}` | Username |
| `${{ github.run_number }}` | Run counter |
| `${{ github.ref_name }}` | Branch name |
| `${{ github.event_name }}` | Trigger type |
| `${{ secrets.NAME }}` | Secret value |
| `${{ matrix.KEY }}` | Matrix value |
| `${{ steps.ID.outputs.KEY }}` | Step output |
| `${{ needs.JOB.result }}` | Job result |
| `${{ runner.os }}` | Linux / Windows / macOS |
| `${{ hashFiles('file') }}` | Hash of file contents |

### Condition functions

| Function | When it runs |
|----------|-------------|
| `success()` | Previous steps all passed |
| `failure()` | At least one previous step failed |
| `always()` | Regardless of previous step results |
| `cancelled()` | Workflow was cancelled |

---

*YAML Notes — Complete Reference for GitHub Actions*
