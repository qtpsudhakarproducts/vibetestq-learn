# Chapter 511 — Runtime Self-Healing (L10)

This chapter covers the optional runtime self-healing layer — an LLM-powered
locator recovery system built into `WebActions.execute()`. When a locator fails
mid-test, the engine intercepts the `ElementNotFoundError`, snapshots the live
accessibility tree, asks an LLM for a better locator, tries it, and if it works
continues the test while logging the heal for human review.

Interviewers ask about runtime healing to probe whether candidates can
articulate the architectural seam that makes it possible, explain why it is
CI-only and assertion-excluded, and describe the adapter pattern used for
provider-agnosticism. Candidates who confuse runtime healing with the post-run
Healer Agent (Level 9) will be identified immediately.

---

## Q511.1 — What is the difference between runtime self-healing and the Playwright Healer Agent?

**Playwright Healer Agent (Level 9):** Post-execution. The agent runs after
tests finish and fail. It replays failing test steps, inspects the DOM,
patches the source code, and re-runs the test until it passes. It modifies
test files and page object files.

**Runtime Self-Healing (Level 10):** Mid-execution. When a locator fails during
a live test run, the framework intercepts the failure before it becomes a test
failure, asks an LLM for a better locator, and tries it — all within the same
test run. The test continues if healing succeeds. The source files are not
touched; the suggested locator is logged for human review.

They solve different problems:

- Healer Agent: fixes failed tests after the run (changes code)
- Runtime healing: keeps tests running during the run (does not change code)

They complement each other: runtime healing keeps the nightly regression
passing when UI changes break locators; the healer agent can then be run to
apply permanent fixes to source files.

---

## Q511.2 — What is the core architectural insight that makes runtime healing possible?

Every interaction in the framework routes through a single method:
`WebActions.execute()`. This was established as the "single seam" in Level 6
for error classification. At Level 10, it becomes the single seam for healing:

```
Test calls → page object method
                ↓
         WebActions.execute()
                ↓
         Playwright action runs
                ↓
         ElementNotFoundError thrown
                ↓
         HealingEngine.attempt()
           — snapshot accessibility tree
           — ask LLM for better locator
           — try suggested locator
                ↓
         Success → continue test + write to log
         Failure → throw original error
```

Because **all** interactions route through `execute()`, healing is wired in
once and covers every page object in the framework automatically. `OrangeHRMControls`,
`AddUserPage`, `ApplyLeavePage` — none of them need any changes. Add a new
page object with 20 methods and every one of them is automatically covered.

---

## Q511.3 — What are the four design decisions that govern the healing implementation?

**Pipeline only, never local.** `ENABLE_RUNTIME_HEALING=true` is set only in
the CI nightly workflow. Locally, `this.healing` is null, there is zero overhead
and zero LLM calls. Developers see real failures immediately — healing does not
mask them during development.

**Actions only, never assertions.** `AssertionHelpers` calls `expect()` directly —
it never calls `WebActions.execute()`. There is no code path from an assertion
failure to the healing engine. This is structural, not a flag.

**`ElementNotFoundError` only, never `TimeoutError`.** A timeout means the
element exists but the page is slow — a performance or environment problem.
Changing the locator will not fix a slow page. Only missing elements trigger
healing.

**Human review, never auto-commit.** Every successful heal is written to
`healing-log.json`. A human reviews the log, decides which suggestions are
correct, and updates the page objects. The framework never modifies source files
automatically.

---

## Q511.4 — What does the healing file structure look like?

```
helpers/
  healing/
    LLMAdapter.ts          ← interface — the only type WebActions knows about
    AnthropicAdapter.ts    ← Anthropic API implementation
    OpenAIAdapter.ts       ← OpenAI API implementation
    GeminiAdapter.ts       ← Gemini API implementation
    LLMAdapterFactory.ts   ← reads HEAL_LLM_PROVIDER, returns correct adapter
    prompt.ts              ← shared prompt builder — one place to tune the instruction
    HealingEngine.ts       ← orchestrator: snapshot → LLM → try → log
    HealingLogger.ts       ← appends to healing-log.json
    index.ts               ← exports HealingEngine only
```

`WebActions` imports only:
```typescript
import { HealingEngine } from './healing';
```

Adapters, factory, logger, and prompt are internal implementation details.
Nothing outside the `healing/` folder knows they exist.

---

## Q511.5 — Why is the .describe() label on every locator a hard prerequisite for healing?

The LLM receives the locator's `.describe()` label as the element description —
not the locator expression itself:

```typescript
// ✅ Correct — LLM receives "User status dropdown"
private readonly statusDropdown = this.page
  .locator('.oxd-select-text')
  .nth(1)
  .describe('User status dropdown');

// ❌ Wrong — LLM receives "locator('.oxd-select-text').nth(1)"
// Not enough context to reason about what element to find
private readonly statusDropdown = this.page
  .locator('.oxd-select-text')
  .nth(1);
```

Without `.describe()`, the prompt contains only the failed locator expression.
The LLM sees `locator('.oxd-select-text').nth(1)` — which tells it nothing about
what the element is or what it does. Suggestion quality collapses.

With `.describe('User status dropdown')`, the LLM reasons about the semantic
purpose of the element and finds a semantically correct replacement, typically
`getByRole('combobox', { name: 'Status' })`.

This is why `.describe()` is enforced as a STANDARDS.md rule and checked in
the code review checklist. It is simultaneously a debugging aid (Level 6),
an agent prerequisite (Level 9), and a healing prerequisite (Level 10).

---

## Q511.6 — What does the LLMAdapter interface look like and why is it a single method?

```typescript
// helpers/healing/LLMAdapter.ts

export interface LLMAdapter {
  suggestLocator(
    description:       string,
    accessibilityTree: string
  ): Promise<string | null>;
}
```

Single method because healing has exactly one responsibility: given an
element description and a page snapshot, suggest a better locator. Keeping
the interface at one method means:

- Any LLM provider that can answer a text prompt implements it in one function
- Switching providers never changes `WebActions` or `HealingEngine`
- Adding a provider requires only a new adapter class and one switch-case in
  the factory

The interface is the contract between the healing orchestration and the
external AI services. Making it minimal makes it stable.

---

## Q511.7 — What does the shared healing prompt instruct the LLM to do?

```typescript
// helpers/healing/prompt.ts
export function buildPrompt(description: string, accessibilityTree: string): string {
  return `
A Playwright locator failed. The element was described as: "${description}".

Here is the current accessibility tree of the page:
${accessibilityTree}

Return ONLY a single Playwright locator expression for this element.

Rules:
- Use semantic locators only: getByRole, getByLabel, getByPlaceholder, getByText
- No CSS selectors, no XPath, no data-testid unless no semantic option exists
- No explanation, no code block, no backticks
- Just the locator expression on a single line

Example: getByRole('combobox', { name: 'Status' })
  `.trim();
}
```

The prompt is shared across all three providers — one place to tune. The
LLM is instructed to return only the locator expression, never CSS selectors,
and the response validation in `HealingEngine` enforces this:

```typescript
if (!suggestion || !suggestion.startsWith('getBy')) {
  return null;  // reject anything that is not a semantic locator
}
```

---

## Q511.8 — What does the AnthropicAdapter implementation look like?

```typescript
// helpers/healing/AnthropicAdapter.ts
import { LLMAdapter }  from './LLMAdapter';
import { buildPrompt } from './prompt';

export class AnthropicAdapter implements LLMAdapter {

  private readonly apiKey: string;
  private readonly model:  string;

  constructor() {
    this.apiKey = process.env.HEAL_LLM_API_KEY!;
    this.model  = process.env.HEAL_LLM_MODEL ?? 'claude-sonnet-4-20250514';
  }

  async suggestLocator(description: string, tree: string): Promise<string | null> {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model:      this.model,
        max_tokens: 100,
        messages:   [{ role: 'user', content: buildPrompt(description, tree) }],
      }),
    });

    const data = await response.json() as {
      content: Array<{ text: string }>;
    };

    return data.content?.[0]?.text?.trim() ?? null;
  }

}
```

`max_tokens: 100` — a locator expression is short; 100 tokens is more than
enough. Using a small token budget minimises cost and latency. All three adapters
follow the same pattern: constructor reads env vars, `suggestLocator` makes the
API call and extracts the text.

---

## Q511.9 — What does the LLMAdapterFactory look like and why does it fail loudly on unknown providers?

```typescript
// helpers/healing/LLMAdapterFactory.ts
export function createLLMAdapter(): LLMAdapter {
  const provider = process.env.HEAL_LLM_PROVIDER;

  switch (provider) {
    case 'anthropic': return new AnthropicAdapter();
    case 'openai':    return new OpenAIAdapter();
    case 'gemini':    return new GeminiAdapter();
    default:
      throw new Error(
        `HEAL_LLM_PROVIDER "${provider}" is not supported.\n` +
        `Supported values: anthropic, openai, gemini`
      );
  }
}
```

The factory fails loudly for unknown providers rather than silently returning
null or a fallback. If `HEAL_LLM_PROVIDER` is missing or misspelled in the
CI workflow, the failure is immediate — at the start of the test run, with a
clear message — rather than silent for the entire run.

Adding a new provider requires:
1. Create `helpers/healing/YourProviderAdapter.ts` implementing `LLMAdapter`
2. Add one case to the switch
3. Nothing else changes — `WebActions` and `HealingEngine` are untouched

---

## Q511.10 — What does HealingEngine.attempt() do step by step?

```typescript
async attempt<T>(locator: Locator, fn: () => Promise<T>): Promise<T | null> {
  try {
    // Step 1 — Snapshot the live accessibility tree at the point of failure
    const snapshot = await this.page.accessibility.snapshot();
    if (!snapshot) return null;

    const description = locator.toString();  // contains the .describe() label

    // Step 2 — Ask the configured LLM for a better locator
    const suggestion = await this.adapter.suggestLocator(
      description,
      JSON.stringify(snapshot, null, 2)
    );

    // Step 3 — Validate the suggestion
    if (!suggestion || !suggestion.startsWith('getBy')) {
      return null;  // reject non-semantic suggestions
    }

    // Step 4 — Build the healed locator on the live page
    const healedLocator = this.buildLocator(suggestion);
    if (!healedLocator) return null;

    // Step 5 — Re-run the original action with the healed locator
    const result = await this.runWithLocator(fn, healedLocator);

    // Step 6 — Log the successful heal for human review
    this.logger.append({
      description,
      original:  description,
      suggested: suggestion,
      action:    'healed',
      timestamp: new Date().toISOString(),
    });

    console.warn(`[HealingEngine] Healed: ${description} → ${suggestion}`);
    return result;

  } catch {
    return null;  // healing failed — let original error propagate
  }
}
```

The method returns `T` on success or `null` on any failure (snapshot unavailable,
LLM returned null, suggestion is not semantic, healed locator fails). It never
throws — the original error always reaches `execute()` and is thrown from there.

---

## Q511.11 — How is HealingEngine wired into WebActions with minimal change?

Two changes to `WebActions.ts`:

**Constructor** — instantiate `HealingEngine` only when the env flag is set:

```typescript
import { HealingEngine } from './healing';

export class WebActions {
  private readonly page:    Page;
  private readonly waits:   WaitHelpers;
  private readonly healing: HealingEngine | null;  // null locally

  constructor(page: Page) {
    this.page  = page;
    this.waits = new WaitHelpers(page);

    // Null locally — no overhead, no LLM calls
    // Active in CI nightly when ENABLE_RUNTIME_HEALING=true
    this.healing = process.env.ENABLE_RUNTIME_HEALING === 'true'
      ? new HealingEngine(page)
      : null;
  }
```

**execute()** — attempt healing before classifying and throwing:

```typescript
private async execute<T>(action: string, locator: Locator, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const cause    = error as Error;
    const isNotFound =
      cause.message.includes('not found')   ||
      cause.message.includes('not visible') ||
      cause.message.includes('not attached');

    // Attempt healing — CI only, ElementNotFoundError only
    if (isNotFound && this.healing) {
      const healed = await this.healing.attempt(locator, fn);
      if (healed !== null) return healed;  // success — test continues
    }

    // Classify and throw unchanged
    if (cause.message.includes('Timeout') || cause.message.includes('timeout')) {
      throw new TimeoutError(action, locator.toString(), cause);
    }
    if (isNotFound) {
      throw new ElementNotFoundError(action, locator.toString(), cause);
    }
    throw new ActionError(action, locator.toString(), cause);
  }
}
```

Zero changes to page objects. Zero changes to `OrangeHRMControls`. The entire
healing mechanism is contained in `WebActions` constructor + `execute()` + the
`healing/` folder.

---

## Q511.12 — What does the healing log look like and how is it reviewed?

```json
{
  "heals": [
    {
      "description": "locator('.oxd-select-text').nth(1).describe('User status dropdown')",
      "original":    "locator('.oxd-select-text').nth(1).describe('User status dropdown')",
      "suggested":   "getByRole('combobox', { name: 'Status' })",
      "action":      "healed",
      "timestamp":   "2026-03-03T02:14:33Z"
    },
    {
      "description": "getByPlaceholder('Username').describe('Username field on login')",
      "original":    "getByPlaceholder('Username').describe('Username field on login')",
      "suggested":   "getByLabel('Username')",
      "action":      "healed",
      "timestamp":   "2026-03-03T02:15:01Z"
    }
  ]
}
```

The log is uploaded as a CI artifact after each nightly run (30-day retention).

Review process:
1. Download `healing-log-{run_number}` from CI artifacts
2. For each entry — open the relevant page object
3. Replace the `original` locator with the `suggested` locator
4. Run the test locally to confirm the fix
5. Commit and push

The healing log is the bridge between the LLM's suggestion and the source code.
The human always reviews before committing — the framework never writes back
to page objects automatically.

---

## Q511.13 — How is healing added to the CI nightly workflow?

Three environment variables added to the nightly regression step:

```yaml
# .github/workflows/nightly-regression.yml

      - name: Run full regression suite
        run: npx playwright test --grep @regression
        env:
          CI: true
          TEST_ENV: dev
          # Runtime self-healing — nightly only
          ENABLE_RUNTIME_HEALING: 'true'
          HEAL_LLM_PROVIDER:      'anthropic'
          HEAL_LLM_MODEL:         'claude-sonnet-4-20250514'
          HEAL_LLM_API_KEY:       ${{ secrets.HEAL_LLM_API_KEY }}
        continue-on-error: true

      # Upload healing log as artifact for post-run review
      - name: Upload healing log
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name:              healing-log-${{ github.run_number }}
          path:              healing-log.json
          if-no-files-found: ignore
          retention-days:    30
```

The PR check workflow does NOT get these variables. PR checks should fail
fast on real failures — healing would mask regressions that developers need
to see.

Switching providers is two env var changes — nothing else:
```yaml
HEAL_LLM_PROVIDER: 'openai'
HEAL_LLM_MODEL:    'gpt-4o'
```

---

## Q511.14 — Why does healing only fire on ElementNotFoundError and never on TimeoutError?

`ElementNotFoundError` means the locator cannot find the element in the DOM.
The element is absent. The locator is wrong — it pointed to something that no
longer matches any DOM node. This is exactly what changing the locator can fix.

`TimeoutError` means the element is in the DOM but did not become actionable
within the timeout window. Playwright found the element but it was not ready.
This is a timing issue — slow page, unresponsive application, CI environment
latency. Changing the locator will not fix a timing problem. The engine would
waste an LLM call and add latency to an already-slow test.

```typescript
// In execute() — healing only for missing elements
if (isNotFound && this.healing) {
  const healed = await this.healing.attempt(locator, fn);
  if (healed !== null) return healed;
}

// Timeouts pass through without healing — straight to classification
if (cause.message.includes('Timeout') || cause.message.includes('timeout')) {
  throw new TimeoutError(action, locatorDesc, cause);
}
```

The check order matters: timeouts are classified before `ElementNotFoundError`,
and the healing check is inside the `isNotFound` branch only.

---

## Q511.15 — Why is healing disabled locally and what is the design consequence?

**Why disabled locally:**
- Developers need immediate, unmasked feedback. A healing attempt adds LLM call
  latency (hundreds of milliseconds) to a failed interaction
- A developer who breaks a locator should know immediately — not discover it when
  the nightly run heals around it
- Healing costs money (API calls); local runs would make development expensive

**How it is disabled:**

```typescript
this.healing = process.env.ENABLE_RUNTIME_HEALING === 'true'
  ? new HealingEngine(page)
  : null;
```

`ENABLE_RUNTIME_HEALING` is absent from every `.env.*` file. It is never set
locally. `this.healing` is null for every local test run. No conditional branches
need checking at runtime — `null` check is instantaneous.

**Design consequence:** developers who work only locally never see healing in
action. The CI run is the only context where it fires. This is intentional —
healing is a resilience mechanism for CI stability, not a developer convenience.

---

## Q511.16 — How does buildLocator() safely construct a locator from an LLM suggestion?

```typescript
private buildLocator(suggestion: string): Locator | null {
  try {
    // Only allow getBy* methods — validated before this call
    const method = suggestion.match(/^(getBy\w+)/)?.[1];
    if (!method || !(method in this.page)) return null;

    // Build via Function constructor scoped to page — not global eval
    const factory = new Function('page', `return page.${suggestion};`);
    return factory(this.page) as Locator;
  } catch {
    return null;
  }
}
```

The method `new Function('page', ...)` scopes execution to the `page` object.
The safety guard `suggestion.startsWith('getBy')` (checked before `buildLocator`
is called) ensures the LLM cannot inject arbitrary code — only `getBy*` Playwright
methods are permitted.

If the suggestion parses but the resulting locator call throws (bad arguments,
unrecognised method name), the `catch` returns null and healing fails gracefully —
the original error is still thrown.

---

## Q511.17 — What does the complete interaction stack look like at Level 10?

```
Page Objects
    ↓ calls
OrangeHRMControls    (application-specific component sequences)
    ↓ calls
WebActions           (generic interactions + execute() wrapper)
    ↓ on ElementNotFoundError
HealingEngine        (CI only — snapshot → LLM → try → log)
    ↓ calls
LLMAdapter           (interface)
    ↓ implemented by
AnthropicAdapter / OpenAIAdapter / GeminiAdapter
    ↓ selected by
LLMAdapterFactory    (reads HEAL_LLM_PROVIDER from env)
```

Every interaction in the framework passes through `WebActions`. Healing is
wired at that single point. Adding a new page object, a new module, or a new
test requires no healing-specific code — coverage is automatic.

The Adapter pattern insulates `WebActions` and `HealingEngine` from provider
details. The Factory pattern handles provider selection. The engine barrel export
(`index.ts` exporting only `HealingEngine`) hides all implementation details
from `WebActions`.

---

## Q511.18 — What does runtime healing not do?

**Does not run locally** — `ENABLE_RUNTIME_HEALING` absent, `this.healing`
null, zero overhead.

**Does not heal assertions** — `AssertionHelpers` calls `expect()` directly,
never calls `WebActions.execute()`. There is no code path from assertion failure
to healing. Structural enforcement, not a flag.

**Does not heal timeouts** — `TimeoutError` bypasses the healing check.
A timing problem requires a wait, not a different locator.

**Does not commit automatically** — `healing-log.json` is logged and uploaded.
A human reviews before updating source files.

**Does not mask application defects** — if a feature is genuinely removed,
the accessibility tree will not contain the element under any locator. The
LLM returns no useful suggestion, `attempt()` returns null, and the test
fails correctly. Healing cannot work around absent functionality.

**Does not replace the Playwright Healer Agent** — the healer agent patches
source files after test completion. Runtime healing keeps tests moving during
execution. They solve different problems and complement each other.

---

## Chapter Summary

- Runtime self-healing is CI-only, mid-execution locator recovery — distinct from the post-execution Playwright Healer Agent that patches source files.
- The architectural seam is `WebActions.execute()` — the single point all interactions pass through since Level 6; healing is wired here once and covers every page object automatically.
- Four design decisions: pipeline-only (not local), actions-only (not assertions), `ElementNotFoundError`-only (not `TimeoutError`), human-review (not auto-commit).
- File structure: eight files in `helpers/healing/`; only `HealingEngine` is exported; adapters and factory are internal details.
- `.describe()` on every locator is a hard prerequisite — the LLM receives the semantic label, not the locator expression; without it, suggestion quality collapses.
- `LLMAdapter` interface has one method: `suggestLocator(description, accessibilityTree): Promise<string | null>` — minimal contract, provider-agnostic.
- Shared `prompt.ts` instructs the LLM: semantic locators only, single line, no explanation, no code blocks; validated with `suggestion.startsWith('getBy')`.
- Three adapters (Anthropic, OpenAI, Gemini) follow the same pattern; adding a provider requires one new adapter class and one switch-case in `LLMAdapterFactory`.
- `LLMAdapterFactory` fails loudly on unknown providers — immediate error at test start rather than silent failure during the run.
- `HealingEngine.attempt()` six steps: snapshot → ask LLM → validate → build locator → re-run action → log. Returns null on any failure; never throws.
- `buildLocator()` uses `new Function('page', ...)` scoped to `page` — not global eval; safety guard ensures only `getBy*` methods are accepted.
- `WebActions` constructor: `this.healing = ENABLE_RUNTIME_HEALING === 'true' ? new HealingEngine(page) : null`; null check in `execute()` is instantaneous.
- Healing fires only on `isNotFound` — timeouts bypass the check entirely; the order in `execute()` matters.
- CI configuration: three env vars in nightly workflow, healing log uploaded as 30-day artifact; PR check has no healing vars.
- `healing-log.json` records description, original locator, suggested replacement, action, timestamp; human reviews, updates page objects, and commits.
- `if-no-files-found: ignore` on the healing log artifact upload — when no heals occurred, the file does not exist and the upload step should not fail.
