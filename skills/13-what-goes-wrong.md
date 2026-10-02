# Chapter 13 — What Goes Wrong and How to Fix It
### The Honest Chapter

---

> *"AI tools fail in specific, predictable ways.  
> Knowing the patterns means you fix in minutes, not hours."*

---

## Why This Chapter Exists

Every chapter before this one showed what works when done correctly. This chapter shows what fails when something goes wrong — and exactly what to do about it.

These are not edge cases. Every engineer using AI tools for more than a week will encounter most of these. Knowing them in advance means you spend two minutes fixing the problem instead of two hours wondering why the tool has stopped working.

---

## Failure Mode 1 — The Skill Does Not Trigger

**What it looks like:**
You ask for a page object. The output does not follow your conventions. You check the skill. The skill exists. It should have triggered. It did not.

**Why it happens:**

The description was too narrow. The way you phrased your request did not match the description.

Example:
- Description: "Use when writing page objects for the OrangeHRM project"
- Your request: "Write a POM class for the employee list"

"POM class" and "page objects" are different phrases. The description did not cover "POM class."

**How to diagnose:**

Read your description. Read your request. Find the phrase in your request that does not appear in the description. That is the gap.

**How to fix:**

Add the missing phrase to the description under "Triggers include:":

```yaml
description: >
  Create or extend Page Object Model classes in this project.
  Use when: writing page objects, writing a POM class, adding a page class,
  creating a page model, extending BasePage...
```

Then test with a fresh session using the exact phrasing that failed.

---

## Failure Mode 2 — Skill Triggers But Output Ignores the Rules

**What it looks like:**
The skill loads (you can tell because output has some conventions). But one or two rules are consistently ignored — CSS selectors still appear, or fixture import is wrong, or Then steps are still vague.

**Why it happens:**

Three causes — usually one of them:

1. **The rule is buried.** It is on line 180 of the skill body. The model read it but it did not make a strong impression. More prominent rules override it.

2. **The rule is too abstract.** "Use descriptive locators" is not a rule the model can apply — it requires interpretation. "Use getByRole, getByLabel, or getByPlaceholder — never CSS selectors or XPath" is a rule the model can apply.

3. **Contradictory context.** The session has pasted code that uses the old pattern. The model learned from the pasted code, not the skill.

**How to fix:**

For buried rules: move the violated rule to the Critical Rule section at the top.

For abstract rules: replace the abstract statement with a ✅/❌ example:

```markdown
❌ page.locator('.save-btn').click()
✅ this.saveButton = this.page.getByRole('button', { name: 'Save' }).describe('Save button')
```

For contradictory context: start a fresh session. Do not paste code that uses the old pattern.

---

## Failure Mode 3 — Output Is Correct for 10 Turns Then Drifts

**What it looks like:**
The first three page objects are perfect. By the eighth, CSS selectors have crept back in. The skill is loaded. The conventions are there. But something changed.

**Why it happens:**

Context pollution — covered in Chapter 3. The skill instructions loaded at the start of the session have been pushed down by the conversation history. The model is now giving more weight to the recent turns (which contain the partially correct output) than to the skill instructions.

**How to fix:**

Add the 10-turn reminder from Chapter 3 to your session workflow:

```
Reminder: OrangeHRM project. Playwright TypeScript. BasePage inheritance.
getByRole locators. Custom fixtures. @smoke and @regression tags.
```

If drift continues after the reminder: start a new session. A session that has drifted significantly is faster to restart than to correct.

**Prevention:** the 10-turn reminder is not optional for sessions longer than 20 turns.

---

## Failure Mode 4 — The Model Produces Code That Looks Correct But Is Wrong

**What it looks like:**
The output is plausible TypeScript. It follows conventions. It compiles. You add it to the project. The test fails at runtime with an error that makes no sense.

**Why it happens:**

The model generated code based on patterns from its training that are similar but not identical to your project. The method name is correct. The class structure is correct. But a specific detail — an argument order, a return type, a method that does not exist in your version — is wrong.

This is called hallucination. The model is confident. The code looks right. It is wrong.

**How to reduce it:**

1. Paste the actual BasePage class into the skill's reference files. The model cannot invent methods that are explicitly shown.
2. Paste one working page object as a concrete example. The model follows the example more reliably than abstract rules.
3. Run the code before accepting it. Always. No AI-generated code should go into the project unexecuted.

**How to catch it:**

Read the output before accepting it. Specifically check: does this method actually exist in BasePage? Does this import path match the actual file structure? Does this fixture name match the actual fixture definition?

A 30-second review catches 90% of hallucinations. No review catches zero.

---

## Failure Mode 5 — Two Skills Conflict With Each Other

**What it looks like:**
Output randomly uses table format for test cases sometimes and Gherkin sometimes. Or it randomly uses fixtures sometimes and direct page imports sometimes. The inconsistency has no pattern.

**Why it happens:**

Two skills are giving contradictory instructions. A global skill says one thing. A project skill says another. The model picks randomly because both instructions are in context simultaneously.

**How to diagnose:**

Check your global skills and your project skills for any overlapping rules. The conflict is usually in a rule that appears in both.

**How to fix:**

1. Identify the conflicting rule in both skills
2. Remove it from the level that should not own it (usually the global skill)
3. Keep it only in the more specific level (usually the project skill)
4. If both levels need a version of the rule, make them complementary rather than contradictory

---

## Failure Mode 6 — The Skill Works in Claude But Not in Cursor

**What it looks like:**
In Claude, your skill produces correct output. In Cursor, the same type of request ignores the conventions. The skill file exists. The tool is connected to the project.

**Why it happens:**

Claude and Cursor load skills differently. A SKILL.md file in `/mnt/skills/user/` is read by Claude. Cursor reads `.cursor/rules/*.mdc` files. The same content in the wrong location is invisible to the tool.

Also: Cursor rules use the same YAML frontmatter structure but may have slightly different triggering behaviour. A description that triggers reliably in Claude may need adjustment for Cursor.

**How to fix:**

1. Ensure the skill content exists in the format each tool expects:
   - Claude: SKILL.md in the correct directory
   - Cursor: .mdc file in `.cursor/rules/`
   - Copilot: content in `.github/copilot-instructions.md`

2. If the description triggers in Claude but not Cursor: test with a simpler, more direct description in the Cursor rule. Cursor rule descriptions sometimes need to be more literal.

3. Cross-check: copy the skill content to both formats. Maintain them together or use a build step that generates one from the other.

---

## Failure Mode 7 — The Model Refuses to Follow a Convention Repeatedly

**What it looks like:**
You have a rule in the skill. You have corrected the model three times. It keeps producing the same violation. The rule is clear. The model ignores it.

**Why it happens:**

The convention as written is ambiguous to the model even if it is clear to you.

Example: "Use descriptive locators" — what does "descriptive" mean? To the model, a CSS class name like `.save-btn` might seem descriptive. You mean getByRole with a name attribute.

**How to fix:**

Replace the abstract rule with the exact pattern:

```markdown
# Instead of:
Use descriptive locators.

# Write:
Locators must use getByRole, getByLabel, or getByPlaceholder.
Never use CSS selectors (.class-name) or XPath (//element).

✅ this.page.getByRole('button', { name: 'Save' })
✅ this.page.getByLabel('Username')
❌ this.page.locator('.save-btn')
❌ this.page.locator('//button[@id="save"]')
```

The concrete example removes all ambiguity. If the model still violates the rule after seeing both patterns: the rule needs to move to the Critical Rule section.

---

## What AI Genuinely Cannot Do in Testing

Beyond tool failures, there are genuine limitations that no skill or prompt can fix.

**Visual regression without tooling:**
AI can generate test cases that say "the button should appear in the top right." It cannot look at a rendered page and judge whether it looks right. Visual regression testing requires dedicated tooling — Percy, Applitools, or Playwright's built-in screenshot comparison.

**Accessibility feel:**
AI can check that an ARIA label exists. It cannot judge whether the screen reader experience is natural, whether the tab order makes sense in context, or whether the colour contrast technically passes but is unpleasant to read. Accessibility testing beyond attribute presence requires human judgement and assistive technology.

**Novel exploratory edge cases:**
AI finds edge cases by reasoning about patterns. It misses edge cases that require deep business domain knowledge — the exception a long-tenured employee knows from years of experience but never wrote down. These require a tester who understands the business.

**Judgement calls under uncertainty:**
"Is this a bug or a feature?" "Should we test this now or after the architecture change?" "Is this risk worth a test?" These require context, relationships, and judgement that AI tools do not have.

The honest position: use AI for what it is genuinely good at — repeatable, structured, convention-dependent work. Keep human judgement where it is irreplaceable — novel discovery, business context, stakeholder relationships.

---

## Chapter Summary

| Failure Mode | Quick Diagnosis | Quick Fix |
|-------------|----------------|-----------|
| Skill does not trigger | Phrase in request not in description | Add trigger phrase to description |
| Rule ignored | Rule buried or too abstract | Move to Critical Rule section + add ✅/❌ example |
| Output drifts after 10 turns | Context pollution | 10-turn reminder + new session if needed |
| Code looks right but is wrong | Hallucination | Paste actual reference files + run the code |
| Random output between two patterns | Two conflicting skills | Remove rule from one level, keep in most specific |
| Works in Claude not Cursor | Wrong file location/format | Create tool-specific file in correct location |
| Convention ignored repeatedly | Rule is ambiguous | Replace abstract statement with concrete ✅/❌ example |

---

## Three Exercises to Try Today

1. Go through this chapter's failure modes. For each one, decide: have I encountered this? If yes, what did I do? Was it the fix from this chapter?

2. Take your most important skill. Test it against all seven failure modes. Which ones have you not tested for?

3. Identify one AI limitation from the last section that affected your testing work. Was it correctly identified as a limitation, or did you spend time trying to make AI do something it cannot?

---

→ [Chapter 14 — Quick Reference](14-quick-reference.md)

---

*← [Chapter 12](12-qa-leads-guide.md) | [Chapter 14 →](14-quick-reference.md)*
