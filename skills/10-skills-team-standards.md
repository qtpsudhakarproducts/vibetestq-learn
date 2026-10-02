# Chapter 10 — Skills for Team-Wide Quality Standards
### From Personal Tool to Team Infrastructure

---

## 10.1 The Problem — Standards That Live in One Person's Head

Every team has this person. The senior engineer who knows how things are supposed to be done. When they write code, it is correct. When they review PRs, they leave the same comments every sprint. When they are on holiday, the codebase gets inconsistent.

This is not a failure of the junior engineers. It is a failure of the system. The standards exist as knowledge in one person, not as infrastructure anyone can access.

Skills checked into the repository change this. The standard becomes a file. The file loads for everyone. New engineers get it on Day 1. Senior engineers stop leaving the same comments.

---

## 10.2 How Repository-Level Skills Propagate Standards

When a skill is committed to the repository:

1. Every engineer who clones the repo gets the skill automatically
2. Every session any engineer starts loads the standards without setup
3. When the senior engineer updates a rule, everyone benefits on their next session
4. New engineers produce correct output before they know what the conventions are

This is the difference between a convention that lives in a wiki and a convention that is enforced by the AI tool.

Wiki: someone has to find it, read it, remember it, apply it.
Skill: loaded automatically, applied before any output is generated.

---

## 10.3 Designing a Skill System for a Team

### How many skills does a team need

The right number is one skill per concern, not one skill per task.

Too few (one monolithic skill):
```yaml
name: everything
description: Use for all code in this project.
# 800 lines covering POM, fixtures, API tests, CI, test data...
```
Problems: too long, loads too slowly, relevant rules buried under irrelevant ones for any given task.

Too many (one skill per sub-task):
```yaml
playwright-pom-locators
playwright-pom-methods
playwright-pom-verification
playwright-pom-inheritance
# ...20 more
```
Problems: overlapping descriptions, conflicts, maintenance burden.

The right structure: one skill per distinct layer of the project. The five-skill system from Chapter 9 is the right size for a typical Playwright project.

### Naming convention for team skills

Use `[project-name]-[concern]` or `[framework]-[concern]`:
```
orangehrm-pom
orangehrm-fixtures
orangehrm-api-testing
```

Or:
```
playwright-pom
playwright-fixtures
playwright-api-testing
```

The second form works if conventions are framework-level (same across projects). The first form works if conventions are project-specific.

### What goes in a team skill vs a personal skill

| Convention | Team Skill | Personal Skill |
|------------|-----------|---------------|
| Framework locator strategy | ✅ | |
| Project file structure | ✅ | |
| Import rules (basetest vs @playwright) | ✅ | |
| Bug report format | ✅ | |
| Test case Gherkin format | ✅ | |
| Personal seniority preference | | ✅ |
| Personal output verbosity preference | | ✅ |
| Temporary experiment rules | | ✅ |

---

## 10.4 Introducing Skills to a Team

### The three-phase rollout

**Phase 1 — One engineer, one skill, one sprint**

Pick the most motivated engineer. Pick the most violated convention. Write one skill together. Use it for one sprint.

At the end of the sprint, review: did the violation appear? Did output quality improve? Was there any friction using it?

Fix any issues with the skill. This is your proof of concept.

**Phase 2 — Commit to repository, second engineer**

Commit the skill to the repository. Ask a second engineer — ideally a skeptic — to use it for one sprint without any explanation.

If they get correct output without being told the conventions: the skill works.

If they encounter violations: those are your improvement tasks for the skill.

**Phase 3 — Full team, skill system covers all major task types**

Expand from one skill to the full system. Add one skill per sprint until all major task types are covered. Prioritise by which task types produce the most PR comments.

**Phase 4 — Maintenance is part of the regular workflow**

Skills are reviewed when framework versions change, when conventions change, and at the end of each quarter. This is covered in Chapter 11.

### Handling resistance

Some engineers will be skeptical. Common objections and honest responses:

**"This will make everyone's code look the same — no room for creativity."**
Skills encode the boring structural rules: locator strategy, file structure, import patterns. They do not encode architecture decisions, algorithm choices, or how to approach a complex problem. Creativity lives in the parts skills do not touch.

**"I already know these conventions. Why do I need a skill to tell me?"**
You do. The engineer who joined last month does not. The engineer who is focused on a deadline and forgets one rule does not. The skill is not for the expert — it is for the moment when the expert is under pressure or unavailable.

**"What if the skill produces wrong output?"**
Then the skill needs updating. File a bug against the skill the same way you file a bug against code. The skill is infrastructure, not magic.

---

## 10.5 Adapting the Five-Skill System for Other Frameworks

The five-skill structure from Chapter 9 works for any automation framework. The concerns are the same. The specific rules differ.

### Cypress equivalent

```
cypress-page-objects    → Page object conventions (commands vs classes)
cypress-fixtures        → Fixture file structure, cy.fixture() usage
cypress-test-patterns   → describe/it structure, hooks, tags
cypress-api-testing     → cy.request() patterns, auth handling
cypress-debugging       → Common Cypress failure patterns
```

### Selenium + Java equivalent

```
selenium-page-objects   → Page factory vs fluent page objects
selenium-helpers        → WebDriverWait patterns, explicit waits
selenium-test-patterns  → TestNG vs JUnit structure, annotations
selenium-api-testing    → RestAssured patterns, auth
selenium-debugging      → StaleElementException, timeout patterns
```

### Robot Framework equivalent

```
robot-keywords          → Custom keyword conventions
robot-resources         → Resource file structure
robot-test-patterns     → Suite and test structure, tags
robot-variables         → Variable files, environments
robot-debugging         → Common Robot failure patterns
```

The pattern is identical. One skill per layer. Each skill owns its boundary.

---

## 10.6 Measuring Whether Skills Are Helping

Three metrics that show real improvement:

**Metric 1 — Convention violation rate in PRs**

Track: how many PR comments per week mention convention violations?

Before skills: baseline count from last month.
After skills: count after one sprint with skills in place.

A 50% reduction in the first sprint is typical. The remaining violations are usually edge cases the skill has not encountered yet — each one is a skill improvement task.

**Metric 2 — Time from story to first test draft**

Track: how long does it take a tester to go from "story accepted" to "first draft test cases"?

Before skills: 30-45 minutes per story for a manual tester.
After skills: 5-10 minutes per story, with more time available for review and refinement.

**Metric 3 — New engineer ramp-up time**

Track: how long before a new engineer produces code that does not require convention corrections?

Before skills: typically 2-4 weeks of PR review cycles.
After skills: typically 1-2 days — the skill enforces conventions from Day 1.

---

## 10.7 Skill Ownership — Who Is Responsible

Each skill should have one named owner. Not "the team." One person.

The owner is responsible for:
- Reviewing the skill when the framework updates
- Adding rules when new violations appear
- Removing rules that are no longer relevant
- Testing the skill after any changes

Skill ownership rotates with the project. When someone leaves the team, their skills get a new owner. Skills without owners become stale and produce wrong output — which is worse than no skill because it creates false confidence.

A good model: the engineer who works most with a given layer of the project owns that layer's skill. The person who writes the most page objects owns the POM skill. The person who manages CI owns the CI skill.

---

## Chapter Summary

| Concept | Key Takeaway |
|---------|-------------|
| Repository skills | Committed to version control, every engineer gets them automatically |
| Right number of skills | One per concern — not one monolithic, not twenty micro-skills |
| Rollout phases | One engineer → commit → full team → maintenance |
| Handling resistance | Skills encode boring structural rules, not creativity |
| Other frameworks | Same five-layer structure applies to Cypress, Selenium, Robot, etc. |
| Measuring success | PR violation rate, time to first draft, new engineer ramp-up |
| Skill ownership | One named owner per skill, rotates with the project |

---

## Three Exercises to Try Today

1. Count the convention-related PR comments in your last five PRs. Which convention is violated most? That is your first team skill.

2. Write the first team skill for that convention. Commit it to the repository. Ask one other engineer to start a fresh session and write code without any explanation. Check whether the skill worked.

3. Identify who would own each skill in your project's five-skill system. If there is no clear owner for a layer, that layer is at risk of inconsistency.

---

→ [Chapter 11 — Skill Maintenance](11-skill-maintenance.md)

---

*← [Chapter 9](09-skills-automation.md) | [Chapter 11 →](11-skill-maintenance.md)*
