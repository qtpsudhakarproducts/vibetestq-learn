# Chapter 12 — The QA Lead's Guide
### What the Rest of This Book Did Not Cover

---

## What You Will Learn

This chapter is written for QA leads and managers. It covers what you need to know that the individual contributor chapters do not: how to evaluate readiness, build the case, roll out to a team, measure results, and manage the process over time.

---

## 12.1 How to Evaluate Whether Your Team Is Ready

Three questions determine readiness.

**1. Does the team have written conventions?**

Skills encode conventions. If conventions are not written down anywhere, there is nothing to encode. Before building skills, the team needs at least a basic written standard — even a one-page document covers what is needed.

If conventions are not written: spend one session with the team writing them down. Skills are the second step.

**2. Does the team use AI tools consistently?**

If half the team uses AI tools and half does not, skills benefit half the team. This is still worth doing — but the value of team-level skill consistency is only realised when everyone is using the same tools.

If tool adoption is inconsistent: start with the engineers who are already using AI tools. Demonstrate results. The others follow.

**3. Is there capacity to maintain skills?**

A skill system with no maintenance owner becomes a liability within three months. Before committing to repository-level skills, identify who owns each skill and how much time they can give it per quarter.

If there is no maintenance capacity: start with personal skills only. Repository-level skills require a maintenance commitment.

---

## 12.2 Building the Case for AI-Assisted Testing

If you are introducing this to a team that has not used it, you need to make the case. Here is what works.

### What to measure before you start

Pick two metrics that matter to your stakeholders:

1. Convention violation rate — PR comments about standards per week
2. Time from story to first test draft — measured in a sprint planning session

These are the before numbers. Measure them honestly. If they are already low, skills will not move them much. If they are high, the improvement will be visible.

### What to show after one sprint

One sprint with one skill applied to one engineer's work is enough to make the case.

Show: the PR review comments for that engineer that sprint vs the previous sprint.
Show: one example of output produced with the skill vs what was produced without it.

Do not show percentage improvements from a one-sprint sample. The numbers are not meaningful yet. Show the qualitative difference in one concrete example. That is more persuasive than any statistic from limited data.

### How to handle resistance

The most common forms of resistance and honest responses:

**"AI will replace testers."**
Skills help testers write better test cases, not replace the tester who decides what to test. The exploratory insight, the risk judgement, the stakeholder relationships — those remain entirely human.

**"We cannot trust AI-generated code."**
You should not trust unreviewed AI-generated code. You should review it. A skill that enforces your conventions reduces the review burden — it catches the structural errors before the engineer submits. The engineer still reviews. The process becomes faster, not absent.

**"Our conventions are too complex for a skill to capture."**
A skill that captures 70% of your conventions is better than no skill. Start with the 70% that are clear and consistent. The edge cases stay in human review.

---

## 12.3 The Team Rollout Plan

### Phase 1 — Proof of concept (Sprint 1)

- Choose one skill for the most violated convention
- One volunteer engineer uses it for the entire sprint
- At end of sprint: review output quality, PR comments, and any friction

Success criteria: the violation the skill targets does not appear in any PR comment that sprint.

### Phase 2 — Shared skill in repository (Sprint 2)

- Commit the skill to the repository
- Two engineers use it — one experienced, one less experienced
- The less experienced engineer's output is the real test

Success criteria: the less experienced engineer's output follows the convention without being told.

### Phase 3 — Full system (Sprints 3-6)

- Add one skill per sprint until all major task types are covered
- Prioritise by PR comment frequency — highest frequency first
- Assign ownership to each skill before committing

Success criteria: PR comments about covered conventions drop by at least 50%.

### Phase 4 — Maintenance workflow (Ongoing)

- Quarterly skill review is on the team calendar
- Convention changes trigger immediate skill updates
- New engineers are onboarded with "the skills handle the conventions — read them if curious"

---

## 12.4 What to Do When Skills Surface Inconsistencies

When you write a skill, you sometimes discover that the team's conventions are not consistent. Two engineers think "getByRole should be used for all interactive elements" means different things. Three years of "we always do it this way" turns out to be three different ways.

This is a good problem to surface. But address it carefully.

**Do not:** write the skill, pick one interpretation, and commit it. Engineers who work the other way will produce violations the skill catches — and they will blame the skill.

**Do:** use the skill-writing process as a conversation. "I am writing the convention for locators. I want to write it down clearly. Can we agree on exactly what the rule is?"

The skill is the output of an agreement, not the cause of one. Write it after the conversation, not before.

---

## 12.5 Metrics — What Good Looks Like

### After one sprint with one skill

- Target convention: zero violations in PR comments for that convention
- If violations still appear: skill needs improvement (not a team failure)

### After one quarter with the full system

- PR convention comments: down 50% or more
- Time from story to test draft: down 30% or more
- New engineer first-PR quality: noticeably higher than before skills existed

### What success does not look like

- Zero PR comments: skills catch conventions, not logic errors. Some PR comments are always appropriate.
- Identical code from every engineer: skills encode conventions, not style. Engineers should still write differently.
- No learning required for new engineers: skills reduce the convention learning curve, not the domain learning curve.

---

## 12.6 The QA Lead's Own Skills

QA leads have their own repeated tasks that benefit from skills.

### A skill for test strategy documents

```yaml
---
name: test-strategy
description: >
  Write test strategy documents for a feature, release, or project.
  Use when: writing a test strategy, test approach, test plan,
  or testing scope document.
---

# Test Strategy

## Structure
1. Scope — what is being tested and what is explicitly excluded
2. Approach — test types, levels, and priorities
3. Entry criteria — what must be true before testing begins
4. Exit criteria — what must be true before testing is complete
5. Risks — testing risks and mitigations
6. Resources — team, tools, environments

## Each section: 3-5 bullet points. No prose paragraphs.
## Total length: one page maximum.
```

### A skill for sprint test planning

This is the same skill from Chapter 7 but with team-level additions:
- Adds a resource allocation view (who is testing what)
- Adds a risk flag section (stories with insufficient AC or unclear scope)
- Adds a regression recommendation (what previous tests to re-run)

### A skill for risk assessment

```yaml
---
name: risk-assessment
description: >
  Assess testing risk for a feature, sprint, or release.
  Use when: identifying high-risk areas, prioritising testing effort,
  making go/no-go recommendations.
---

# Testing Risk Assessment

## Risk Dimensions

For each area under test, assess:
- Complexity (how complex is the code change?)
- Coverage (how much existing test coverage exists?)
- Business impact (what is the cost of a bug here?)
- Time since last change (has this area changed recently?)

## Risk Rating

High: complex + low coverage + high business impact
Medium: any two of the above
Low: none or one of the above

## Output
Risk matrix table: Area | Complexity | Coverage | Impact | Risk | Recommended Hours
```

---

## 12.7 Managing Skill Ownership Across the Team

Each skill needs one named owner. At team level, ownership is part of the project's operational structure.

**Making ownership explicit:**

Add an owner field to each skill file:

```markdown
## Skill Owner

Owner: [name]
Last reviewed: [date]
Next review due: [date]
```

This makes it visible to everyone who reads the skill who is responsible for it.

**Rotating ownership:**

Skills should not belong to one person permanently. When an engineer moves on, the skill's ownership transfers. Agree on who takes it before the engineer leaves.

**Shared ownership is not ownership:**

"The team owns it" means no one owns it. Every skill needs one person whose job it is to keep it current. Shared ownership produces skills that are nobody's priority to update.

---

## Chapter Summary

| Topic | Key Takeaway |
|-------|-------------|
| Readiness | Written conventions + tool adoption + maintenance capacity |
| Building the case | Measure two metrics before, show one concrete example after |
| Rollout phases | Proof of concept → repository → full system → maintenance |
| Surfacing inconsistencies | Skill-writing as conversation, not unilateral decision |
| Metrics | 50% PR violation reduction, 30% faster test drafts, better first PRs |
| Lead's own skills | Test strategy, sprint planning, risk assessment |
| Ownership | One named owner per skill — not the team |

---

## Three Exercises to Try Today

1. Measure your team's convention violation rate in the last 5 PRs. Count the comments about conventions. That is your baseline.

2. Identify the one convention that would have the biggest impact if enforced automatically. Write it as the first team skill.

3. Assign a named owner to every skill in your project's skill system. If a skill has no clear owner, that is a risk to address.

---

→ [Chapter 13 — What Goes Wrong](13-what-goes-wrong.md)

---

*← [Chapter 11](11-skill-maintenance.md) | [Chapter 13 →](13-what-goes-wrong.md)*
