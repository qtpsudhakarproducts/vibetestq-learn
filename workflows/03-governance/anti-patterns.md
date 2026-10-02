# Anti-Patterns — How These Workflows Fail

> Every workflow in this guide has failure modes that look like success. Learn to spot them before they rot your pipeline.

---

## The meta-anti-pattern

> **A green pipeline is not a working pipeline.**

AI workflows can produce beautiful dashboards while silently breaking. Every anti-pattern below shares this trait: it looks healthy until production disagrees.

---

## 1. Silent heals hide regressions (WF7)

### What it looks like
Tests are flaky. You add self-healing. Suddenly the suite is green. Everyone celebrates.

### What's actually happening
AI is rewriting locators and assertions at runtime. The UI might have genuinely regressed — but the "heal" made the test pass against the new broken UI. You've automated *denial*.

### How to detect
- Heal log shows healing on the same tests repeatedly
- Heal count climbing week over week
- Post-heal assertion strength decreased
- Production bugs recur that match areas with frequent heals

### How to reverse
1. Audit the heal log weekly — every heal gets reviewed
2. Add the 5-heals-per-week escalation rule (see WF7)
3. Require a structured heal entry for every auto-fix
4. If you find silent heals, revert them and file proper bugs

---

## 2. AI test count ≠ coverage

### What it looks like
"We generated 500 tests last sprint!" Test count chart goes up and to the right. Management is thrilled.

### What's actually happening
The 500 tests have weak assertions (`expect(page).toBeTruthy()`), validate trivial paths, or duplicate each other. Real coverage barely moved. Fewer bugs are caught, not more.

### How to detect
- Assertion strength ratio declining over time (WF5 measurement)
- Coverage percentage climbing but bug escape rate unchanged
- Test review catch rate approaching zero (humans rubber-stamping)
- New tests disproportionately happy-path; few edge cases or error states

### How to reverse
1. Measure assertion strength, not test count
2. Tighten the WF5 prompt: require edge cases and error states explicitly
3. Require human review to catch ≥1 issue per 10 generated tests
4. Fail PRs that reduce assertion specificity (WF10 rule)

---

## 3. Two disconnected AI streams

### What it looks like
Dev uses Cursor. QA uses Copilot. Dev generates code from Jira stories. QA generates tests from Confluence specs. Both teams "use AI."

### What's actually happening
Two parallel AI streams with no shared context. Dev generates a feature that doesn't match QA's test scenarios. The disconnect that existed before AI is now happening at generation speed — faster and at greater volume.

### How to detect
- `graph.json` doesn't exist, or it's maintained by only one side
- Tests routinely miss scenarios that were in the requirements
- Dev and QA use different IDEs, different prompt files, different context
- Releases keep surfacing "I thought you were covering that"

### How to reverse
1. Establish the Project Repository as the shared context layer
2. Enforce `graph.json` updates from both Dev and QA commits
3. Move to shared `.ai/project-context.md` — one source for both streams
4. Ideally: both streams in the same AI IDE, or at least pointing at the same repo metadata

---

## 4. Capture quality degrades over sprints

### What it looks like
Sprint 1: beautiful structured exploration notes with decisions, findings, severities. Sprint 5: "tested, looks ok." Sprint 10: empty files.

### What's actually happening
Capture discipline decays under sprint pressure. Nobody enforces the structure. The workflow files still exist but they're empty shells. WF11 can't correlate; WF8 can't find past findings; the compound intelligence evaporates.

### How to detect
- Exploration files under a threshold character count
- "Things NOT explored" section empty
- Findings without severity or reproduction steps
- Structure becomes free-text prose instead of template

### How to reverse
1. Weekly capture audit by QA lead — flag every empty file
2. Treat empty capture files as bugs — they block the sprint
3. Re-brief the team on the structure quarterly
4. Make the template auto-generated (so it can't be skipped)

---

## 5. Auto-closing duplicates

### What it looks like
Bug triage workflow is clean. Duplicates are closed automatically. Ticket count stays low.

### What's actually happening
AI matched two bugs as duplicates based on surface features (similar title, shared stack frame). But they're distinct root causes. Closing one hides a real issue.

### How to detect
- Post-mortem of closed "duplicates" — are they really the same root cause?
- Production incidents matching issues previously auto-closed as dupes
- Users re-filing the same bug report (indicates their report was dismissed)

### How to reverse
1. **Never auto-close.** Always link.
2. Require a human to merge linked bugs after review
3. Quarterly audit: sample closed duplicates, verify they really were
4. Tighten the similarity threshold — better to under-link than over-close

---

## 6. Severity drift toward too-low

### What it looks like
AI triage looks reasonable. Most bugs get P2 or P3. Team backlog is manageable.

### What's actually happening
AI systematically underrates severity because it doesn't feel user pain. P1s get labeled P2; P0s get labeled P1. Later, real incidents explode that should have been flagged earlier.

### How to detect
- Post-incident analysis: was the bug originally triaged at the right severity?
- Production P0/P1 incidents linked to bugs originally filed as P2/P3
- Severity distribution skews low (e.g., 80% P2/P3)

### How to reverse
1. Weekly severity calibration — sample 5 bugs, QA lead verifies severity
2. Update triage rules with concrete examples: "like this bug = P1"
3. Post-mortem enhancement (see WF4) — every closed bug re-evaluates the triage

---

## 7. Green tests feel safe

### What it looks like
Suite passes. CI is green. Readiness check says READY.

### What's actually happening
The tests validate the paths that *work*. The real bugs are in paths the tests don't touch. Coverage audit (WF8) is either not running or flagged gaps that nobody closed.

### How to detect
- Production bugs in code areas reporting high "coverage"
- WF8 gap tickets older than 2 sprints
- Readiness reliability (features marked READY that had P0/P1 within 30 days) >15%

### How to reverse
1. Trust WF8 more than coverage percent
2. Require WF8 gap closure before release (not PR)
3. Add adversarial tests — deliberately break edge cases, see what fails
4. Production feedback loop (WF11) must be active, not decorative

---

## 8. Graph.json becomes stale

### What it looks like
`graph.json` exists. File is in the repo. Everyone claims it's the source of truth.

### What's actually happening
Nobody's updating it. Links rot. Tests point to deleted code. Code points to nonexistent tests. WF6, WF8, WF11 all produce garbage because their input is garbage.

### How to detect
- File last-modified timestamp — if it hasn't changed in a week, it's dead
- Links to nonexistent files (validate in CI)
- Orphan files (code or tests not mentioned anywhere)
- AI giving wrong answers to *"what tests cover REQ-X?"*

### How to reverse
1. Automate updates — never rely on manual edits
2. WF10 rule: merges must update graph.json
3. Daily CI job: validate all file paths in graph.json still exist
4. Report orphan files weekly to the QA lead

---

## 9. Override becomes the norm

### What it looks like
WF10 gate is deployed. Most PRs merge fine.

### What's actually happening
Developers apply `wf10-override` on 15–30% of PRs because "the gate is wrong" or "we're in a hurry." The gate is theatre. Code ships unchecked.

### How to detect
- Override rate >2% of PRs
- Overrides clustered around specific teams or times of day
- Overrides rarely correlate with post-merge fixes (nobody's fixing what the gate warned about)

### How to reverse
1. Audit every override weekly — was the override justified?
2. Tighten override permissions — only QA lead can apply the label
3. Require a written reason for every override (not "hotfix" or "urgent")
4. If override rate stays high, the gate rules are wrong — fix the rules, don't remove the gate

---

## 10. Prompt rot

### What it looks like
AI outputs start drifting. Scenarios are blander. Triage is less accurate. Coverage audits miss things.

### What's actually happening
Your `.ai/prompts/*.md` files were written 6 months ago. The product has evolved. Prompts reference stale context, outdated rules, deprecated tools. AI does its best with bad instructions.

### How to detect
- Quarterly prompt audit: are the rules still accurate?
- Output quality regression on stable metrics
- Prompts referencing files or tools no longer in use

### How to reverse
1. Quarterly prompt review — QA lead reads every prompt, verifies rules match current reality
2. Treat prompts as code — version control, PR review on changes
3. A/B new prompts before deploying
4. Log prompt versions in every AI output for traceability

---

## 11. Readiness theater

### What it looks like
WF9 produces READY reports. Features ship. Release manager is confident.

### What's actually happening
The criteria have quietly loosened over time. "All gaps closed" became "most gaps acknowledged." "Performance verified" became "performance tested somewhere." READY means less than it used to.

### How to detect
- Criteria in `.ai/conventions/readiness-criteria.md` haven't changed — but interpretations have
- Conditional-accept rate climbing
- Readiness reliability (READY-without-incident) dropping

### How to reverse
1. Quarterly criteria review — are all items still mandatory?
2. Track conditional-accept rate; if >40%, fix the criteria
3. Post-release retrospective: features with incidents → was WF9 clear about the risk?

---

## 12. Agent lies kindly

### What it looks like
Agent outputs look confident. Triage reports read well. Readiness checks are comprehensive.

### What's actually happening
The AI is optimistic by default. When uncertain, it guesses plausibly instead of saying "I don't know." Over time, plausible guesses become repeated facts the team trusts.

### How to detect
- Cross-check 5 agent outputs per week — how often does ground truth disagree?
- Post-incident: did the agent fail to warn about something it should have?
- Outputs never say "I don't know" or "insufficient context"

### How to reverse
1. Require every prompt to permit "unknown" or "insufficient context" as valid output
2. Penalize false confidence in prompt rules: *"if you're unsure, say so — do not guess"*
3. Weekly: sample 5 agent verdicts, verify ground truth, update prompts based on errors

---

## How to build defense against anti-patterns

### Rule 1: Measure the right things
See `measurement.md`. Track leading indicators, not just lagging dashboards.

### Rule 2: Weekly audits, not quarterly
Quarterly is too slow. Most anti-patterns decay a workflow within 4-6 weeks if unchecked.

### Rule 3: Review quality, not just volume
100 generated tests with weak assertions is worse than 10 with strong ones. Make review depth a measured input.

### Rule 4: Keep humans in the judgment loop
Every anti-pattern above gets worse when humans stop reviewing. Automation handles volume; humans judge quality.

### Rule 5: Document failures
When an anti-pattern bites you, write it up. Update `.ai/known-pitfalls.md`. Add to WF4's triage rules. Make the pain teach the system.

---

## The one principle

> **Trust the workflow. Verify the output.**

Every anti-pattern above comes from trusting without verifying. AI is powerful precisely because it works at volume — which means it fails at volume too. Human review is not overhead; it's the whole point.

---

## Next

- Read `04-appendix/glossary.md` for terms used throughout this guide
- Read `04-appendix/tools-reference.md` for the tool comparison matrix
- Revisit your workflow files — each has "Common pitfalls" tuned to that workflow
