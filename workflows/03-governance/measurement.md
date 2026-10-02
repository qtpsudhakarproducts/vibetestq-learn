# Measurement — How to Know the Workflows Are Working

> Not vanity metrics. Evidence-based signals that tell you the pipeline is healthy — or silently decaying.

---

## The philosophy

> **Measure what tells you the truth. Not what makes charts look good.**

Most QA metrics (tests passing, test count, coverage percent) are lagging indicators. They tell you the state *after* something went wrong, not before.

This guide focuses on signals that catch drift early — when the pipeline is starting to lie, not after production breaks.

---

## What to measure per workflow

Every workflow has its own set of signals. Pick the ones that matter for your maturity.

### WF1 — Requirements → Scenarios

**Time to approved scenarios.** From requirement creation to QA-approved scenarios file.
- Healthy: hours, not days
- Warning: >3 days average
- Critical: WF1 not running on >20% of new requirements

**Ambiguity hit rate.** % of WF1 runs that flag ambiguities.
- Healthy: 30–60% (real requirements are often ambiguous)
- Warning: <10% (AI is being too lenient; prompt is too permissive)

**Scenario approval turnaround.** From AI-generated to human-approved.
- Healthy: <24 hours
- Warning: >1 week (approval is a bottleneck)

### WF2 — Exploratory Planning

**Capture completeness.** % of exploration files with all sections filled.
- Healthy: >80%
- Critical: <50% (workflow is decaying)

**"Things NOT explored" non-empty rate.** % of exploration files where this section is filled.
- Healthy: 90%+
- Warning: <60% (testers aren't reflecting on dark corners)

**Findings-per-hour.** Findings captured per hour of exploration.
- Healthy: varies by feature, but should stabilize within a team range
- Warning: dropping over time (fatigue, or feature maturing — investigate)

### WF3 — Test Data Design

**Fixture safety check pass rate.** % of fixtures passing TEST_ prefix and PII checks.
- Healthy: 100%
- Critical: anything below 100% — safety violations are non-negotiable

**Cleanup success rate.** % of test runs where cleanup completed.
- Healthy: >99%
- Warning: cleanup failing intermittently — stale data accumulates

### WF4 — Bug Triage

**AI triage acceptance rate.** % of AI-proposed triages accepted without change.
- Healthy: >70% (if too high, humans aren't reviewing carefully)
- Warning: <50% (prompts or rules need tuning)

**Time-to-owner-acknowledgement.** From bug filed to owner team responds.
- Healthy: <4 hours for P0/P1; <24h for P2
- Warning: any trend upward

**Duplicate detection accuracy.** Of bugs flagged as duplicates, how many actually were.
- Healthy: >90%
- Critical: false-duplicate closures (never auto-close — only link)

### WF5 — Automation Generation

**Dry-run pass rate.** % of AI-generated tests that pass dry-run on first try.
- Healthy: 60–80% (100% is suspicious — are tests too shallow?)
- Warning: <40% (generation quality is poor)

**Assertion strength over time.** Ratio of specific assertions (`toBe`, `toEqual`) vs weak assertions (`toBeTruthy`).
- Healthy: stable or increasing ratio of specific assertions
- Critical: ratio declining — tests are weakening

**Human-review catch rate.** Issues found during human review per 10 generated tests.
- Healthy: 1+ per 10 (meaningful review is happening)
- Warning: 0 per 10 (rubber-stamping)

### WF6 — Test Maintenance

**Maintenance PR review SLA.** Time from maintenance PR opened to reviewed.
- Healthy: within the same sprint
- Critical: maintenance PRs >2 weeks old (stacking up)

**Silent-heal rate.** Tests that passed after AI changed assertions.
- Healthy: 0%
- Critical: anything above 0% — tests were gutted to stay green

**Maintenance-to-merge ratio.** Maintenance PRs per production merge.
- Healthy: 0.5–2.0 (proportional to change volume)
- Warning: 0 (not running or detecting nothing)

### WF7 — Self-Healing

**Heal count trend.** Weekly heal count.
- Healthy: flat or declining
- Critical: climbing week-over-week — UI drift accelerating

**Repeat-heal rate.** Same selector healing multiple times in a week.
- Healthy: <5 per selector per week (triggers the escalation rule)
- Critical: a single selector healing daily — broken, not healing

**Post-heal pass rate.** % of heals that actually made the test pass.
- Healthy: >95%
- Warning: <80% — AI is proposing wrong selectors

### WF8 — Coverage Audit

**Coverage drift per PR.** Net change in linked-coverage percentage.
- Healthy: 0 or positive
- Warning: -2% or worse per PR (excluding acknowledged exceptions)

**Gap-close rate.** % of WF8 gap tickets closed within one sprint.
- Healthy: >80%
- Critical: <50% — gaps piling up, audit is performative

**High-risk area coverage.** Linked-coverage % for auth, payments, permissions.
- Healthy: >90%
- Critical: any drop — high-risk areas get priority

### WF9 — Feature Readiness Gate

**READY verdict reliability.** Of features marked READY, how many had post-release incidents within 30 days.
- Healthy: <5%
- Critical: >15% — readiness criteria are too loose

**Conditional-accept rate.** % of features shipped with "conditional" status.
- Healthy: 10–25%
- Warning: >40% — criteria too strict OR process broken

**Time from NOT_READY to READY.** How long features linger in NOT_READY.
- Healthy: predictable by feature size
- Warning: increasing average — blockers aren't being addressed

### WF10 — CI Quality Gate

**Gate block rate.** % of PRs blocked by the gate.
- Healthy: 5–15%
- Warning: <2% (rules too loose) or >25% (rules too strict)

**Override rate.** % of gate blocks overridden.
- Healthy: <2%
- Critical: >10% — gate isn't respected

**False-block rate.** Gate blocks that were wrong, measured by post-merge audit.
- Healthy: <5%
- Warning: >15% — developer frustration rising

**Gate-to-prod correlation.** % of production incidents traceable to rules the gate caught (but was overridden) or rules that didn't exist.
- Healthy: gate catches most; overrides correlate with incidents
- Critical: no correlation — gate measures wrong things

### WF11 — Production Feedback Loop

**Event-to-analysis time.** From incident to WF11 analysis complete.
- Healthy: <1 hour for P0/P1
- Warning: >4 hours — observability-to-QA pipeline slow

**Scenario approval rate.** % of WF11-proposed scenarios approved.
- Healthy: 60–85%
- Warning: <40% (AI is noisy) or >95% (humans are rubber-stamping)

**Regression prevention rate.** % of added regression tests that catch the recurrence.
- Healthy: >80% verified by controlled replay
- Critical: tests pass but issue recurs — tests are wrong

**Repeat-incident rate.** Same production issue recurring after WF11 scenario was added.
- Healthy: approaching 0%
- Critical: same issue 3+ times — loop is broken

---

## Cross-workflow signals

These measure the *pipeline*, not individual workflows.

### Traceability completeness

> What % of production code is linked to a REQ-ID in `graph.json`?

- Healthy: >90%
- Warning: 70–90% (orphan code)
- Critical: <70% (graph.json is stale)

### graph.json freshness

> Time since last update. Is the file breathing?

- Healthy: hours (every commit updates it)
- Warning: days (automation is broken somewhere)
- Critical: weeks (file is dead)

### Release confidence

> Of the last 10 releases marked READY, how many shipped without P0/P1 in the first week?

- Healthy: 9–10
- Warning: 7–8
- Critical: ≤6 — readiness signals unreliable

### Time saved vs time spent

> Estimated hours saved by AI workflows minus hours spent maintaining them (prompts, rules, reviews).

- Healthy: strongly positive
- Warning: break-even (workflows are overhead, not leverage)
- Critical: negative (abandon workflows that don't earn their maintenance)

---

## Review cadence

Not every metric needs weekly review. Spread the load:

### Daily
- WF7 escalation alerts (repeat heals)
- WF10 override reviews
- Production incident → WF11 analysis check

### Weekly (QA lead)
- WF1 time-to-approval
- WF2 capture completeness
- WF5 human-review catch rate
- WF6 maintenance PR SLA
- WF7 heal count trend
- WF8 gap-close rate
- WF10 block and override rates

### Sprintly
- Coverage drift (net per sprint)
- Feature readiness reliability
- High-risk area coverage

### Quarterly (QA + engineering leadership)
- Full cross-workflow audit
- Readiness-to-reality correlation
- Anti-pattern detection (see `anti-patterns.md`)
- Time saved vs time spent calculation
- Recalibration of rules, thresholds, criteria

---

## Red flags — drop-everything signals

If any of these hit, stop and investigate immediately:

- 🚨 **`graph.json` hasn't updated in 7+ days** — automation is broken
- 🚨 **Heal count doubles week-over-week** — UI/framework catastrophic change
- 🚨 **WF11 scenario approval rate >95%** — humans are rubber-stamping
- 🚨 **Silent heal rate > 0** — tests are being gutted
- 🚨 **Override rate >10%** — gate is not respected
- 🚨 **Same production bug recurs 3 times** — WF11 loop is broken
- 🚨 **Assertion strength ratio declining** — test quality is degrading

---

## What NOT to measure

Some metrics look useful but mislead:

- ❌ **Test count** — more tests ≠ more quality
- ❌ **Code coverage %** alone — without scenario coverage, meaningless
- ❌ **AI prompt word count** — irrelevant
- ❌ **Time spent in AI IDE** — not a signal of anything
- ❌ **Lines of test code** — correlates with nothing you care about

---

## Building your dashboard

Minimum viable dashboard:

1. **graph.json health** (freshness, completeness, orphans)
2. **Per-workflow pass rates** (trend, not snapshot)
3. **Release confidence** (last 10 releases — stability after READY)
4. **Red flag alerts** (real-time)

Build these before prettifying anything else.

---

## Next

- Read `anti-patterns.md` for the failure modes these metrics detect
- Revisit your workflow files — each has success criteria that feed these measurements
- Revisit `02-matching/workflow-to-sdlc-type.md` — your type determines which metrics matter most
