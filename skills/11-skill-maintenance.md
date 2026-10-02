# Chapter 11 — Keeping Skills Current Over Time
### Skills Go Stale. Here Is What to Do About It.

---

## 11.1 Why Skills Need Maintenance

A skill written today is correct for today's conventions. Six months from now:

- The framework may have released a new version with changed APIs
- The team may have decided to change the locator strategy
- New engineers may have revealed gaps in what the skill explains
- The project may have added new modules the skill does not cover

A stale skill is worse than no skill. A missing skill means the model uses its defaults — generic but at least neutral. A stale skill means the model confidently produces output based on outdated conventions — wrong and authoritative.

Skill maintenance is not optional overhead. It is part of owning a skill.

---

## 11.2 The Three Events That Make a Skill Stale

### Event 1 — Framework Update

Playwright, Cypress, or your testing framework releases a new major version.

What changes: APIs, best practices, deprecated methods, new recommended patterns.

Example: Playwright deprecates `waitForNavigation`. Skills that encode the old pattern will produce code using deprecated APIs. Tests will get deprecation warnings and eventually break.

Trigger: any major framework version bump.

### Event 2 — Convention Change

The team decides to change how something is done.

Example: the team decides to move from Gherkin to table-format test cases. The test-case-writing skill still produces Gherkin. Every test case written with the skill needs manual conversion.

Trigger: any team decision that changes a written or unwritten standard.

### Event 3 — Team Growth Revealing Gaps

A new engineer uses the skill and produces output that violates a convention the skill does not mention.

This is not a failure of the engineer. It means the convention exists as assumed knowledge that was never written into the skill. The new engineer's work reveals what the senior engineers forgot to document.

Trigger: any PR comment on skill-generated code about a convention not in the skill.

---

## 11.3 How to Test a Skill

Before deciding whether a skill needs updating, test it first. Three tests cover most cases.

### Test 1 — The Fresh Session Test

Open a completely new session with no other context. Type a matching request and nothing else:

```
Write a page object for the Profile page. Elements: name input, email input, save button.
```

Check every line of output against your current conventions. Any violation is a skill gap.

### Test 2 — The Edge Case Test

Ask for the least common task the skill covers:

```
Write a page object for a page that has a dynamic table where rows are added by the user.
```

If the skill only has examples of simple form pages, it may not handle dynamic elements correctly. Edge case tests find this.

### Test 3 — The New Engineer Simulation Test

Ask a colleague who does not know the project conventions to start a fresh session with the skill and produce a page object or test case. Tell them nothing about the conventions first.

Watch what they produce. Any violation they produce that the skill should have prevented is a skill gap.

This test is the most valuable because it simulates exactly the scenario the skill is meant to address.

---

## 11.4 How to Update a Skill

### Small addition — a new rule or example

When a single convention is violated that the skill does not cover:

1. Identify exactly which rule is missing
2. Add it to the most relevant section
3. Add a ✅/❌ example if the rule is not obvious
4. Test the skill again

Do not restructure the whole skill for one addition. Find the right section and add the rule there.

### Convention change — updating an existing rule

When a team decision changes an existing convention:

1. Find every place the old convention appears in the skill
2. Update each occurrence
3. Remove any examples that show the old pattern
4. Add examples that show the new pattern
5. Update the description if the change affects what requests the skill handles

Do not leave the old convention in the skill alongside the new one. Mixed conventions produce random output.

### Framework update — partial or full rewrite

When a major framework version changes core APIs:

1. Read the framework's migration guide
2. List every API the skill mentions that has changed
3. Update each one
4. Add new patterns introduced in the new version that are relevant
5. Remove deprecated patterns

If more than 30% of the skill needs changing, consider a full rewrite rather than patching. A heavily patched skill becomes inconsistent and hard to maintain.

### When to split one skill into two

Split when:
- The skill body exceeds 500 lines
- Two distinct audiences use the skill and need different things
- The description has to cover too many different scenarios to stay focused

Example: a combined `playwright-pom-and-helpers` skill that covers both page objects and helper methods may need to split into two when each part grows beyond 250 lines and engineers start finding the wrong section for their task.

### When to retire a skill entirely

Retire when:
- The framework it covers is no longer used in the project
- The conventions it enforces have been replaced by a better approach
- The skill is consistently producing wrong output despite multiple updates

A retired skill should be deleted, not left in the repository as commented-out content. A disabled skill that still appears in the folder may be accidentally triggered.

---

## 11.5 Versioning Skills

### Simple changelog in the skill file

Add a changelog section at the bottom of the skill:

```markdown
## Changelog

### 2026-03 (v1.2)
- Added .describe() requirement for all locators
- Updated locator priority order (getByRole before getByLabel)
- Removed waitForNavigation — deprecated in Playwright v1.40

### 2026-01 (v1.1)
- Added worker-scoped auth pattern to fixtures section
- Added flakiness detection to afterEach template

### 2025-11 (v1.0)
- Initial version
```

This takes 5 minutes to write and gives any engineer reading the skill a clear picture of how it has evolved.

### Git history as skill version history

When skills are committed to the repository, git history tracks every change automatically. Write meaningful commit messages:

```
✅ git commit -m "skill: add .describe() requirement to playwright-pom"
✅ git commit -m "skill: remove waitForNavigation — deprecated in v1.40"
❌ git commit -m "update skill"
```

The commit message is the version note. Write it for the engineer who will read it six months from now.

---

## 11.6 Skill Review Cadence

### Scheduled reviews

**Quarterly:** review all team skills. Does each one still reflect current conventions? Has anything changed in the last three months?

A quarterly review takes 30 minutes for a five-skill system. The engineer reads each skill, runs the fresh session test, and notes any gaps. Gaps become tasks on the backlog.

**After major framework releases:** review all skills that touch the affected framework. Run the edge case test for each one.

### Triggered reviews

Beyond scheduled reviews, certain events should immediately trigger a skill review:

| Event | Skills to Review |
|-------|-----------------|
| PR comment about a violation the skill should prevent | The skill for that layer |
| New engineer produces incorrect code | All skills they used |
| Framework major version release | All skills mentioning that framework |
| Team convention change | The skill encoding that convention |
| Skill produces wrong output on multiple sessions | Immediate review and fix |

---

## 11.7 Signs a Skill Needs Updating vs a Fundamental Rethink

### Signs it needs an update (targeted fixes)

- One or two specific conventions are consistently violated
- Output is mostly correct but has one recurring problem
- A new pattern exists that the skill does not cover
- One section is outdated while others are still current

### Signs it needs a fundamental rethink

- Output quality has declined across the board
- The skill's description no longer matches what the project needs
- Engineers regularly ask "is the skill working?" — uncertainty is a signal
- More than 30% of the rules have been updated since the last full review
- The skill was written for a different version of the project and never updated

A skill that needs a rethink should be rewritten from scratch, not patched. Start with the current conventions, not with the old skill. Use the old skill as a reference for what to include, not as the starting point.

---

## Chapter Summary

| Concept | Key Takeaway |
|---------|-------------|
| Why skills go stale | Framework updates, convention changes, team growth |
| Three tests | Fresh session, edge case, new engineer simulation |
| Update approach | Small addition, convention change, framework update — each has a different process |
| When to retire | No longer used, replaced, consistently wrong |
| Versioning | Changelog in the file + meaningful git commits |
| Review cadence | Quarterly scheduled + event-triggered |

---

## Three Exercises to Try Today

1. Run the fresh session test on one skill you currently use. How many violations appear? Each one is an update task.

2. Look at your git history for the last month. Were any changes made to skill files? Were the commit messages meaningful enough to understand the change?

3. Identify which of your skills has not been updated in the longest time. Is it still current? Run the fresh session test to find out.

---

→ [Chapter 12 — The QA Lead's Guide](12-qa-leads-guide.md)

---

*← [Chapter 10](10-skills-team-standards.md) | [Chapter 12 →](12-qa-leads-guide.md)*
