# Chapter 402 — Sharding — Distributed Test Execution

This chapter covers Playwright's sharding system — splitting a test suite
across multiple CI machines to reduce run time from tens of minutes to
single digits. Interviewers ask about sharding to test scale thinking:
a candidate who can design a sharded GitHub Actions workflow with blob
report merging, explain why `fail-fast: false` matters, and describe
when sharding is and is not worth the complexity, is ready for large-scale
test engineering roles.

---

## Q402.1 — What is sharding in Playwright?

Sharding splits your test suite into N equal slices and runs one slice per
machine. Each machine is completely independent — its own browser, its own
workers, its own environment. All machines run in parallel. When they all
finish, their results are merged into a single unified report.

```bash
# 4 machines, each running a quarter of the suite
npx playwright test --shard=1/4   # Machine 1 — tests 1–25%
npx playwright test --shard=2/4   # Machine 2 — tests 26–50%
npx playwright test --shard=3/4   # Machine 3 — tests 51–75%
npx playwright test --shard=4/4   # Machine 4 — tests 76–100%
```

A 28-minute suite on one machine runs in ~7 minutes across 4 shards. The
ceiling is no longer CPU cores on one machine — it is however many machines
your CI budget allows.

---

## Q402.2 — What is the difference between sharding and workers?

They are different levels of parallelism that work together:

**Workers** (`--workers=4`) — parallel test execution within a **single machine**.
Tests run in parallel processes on the same machine's CPUs. Limited by that
machine's CPU count and memory.

**Shards** (`--shard=1/4`) — distributes the suite across **multiple separate machines**.
Each machine is its own independent environment with its own browser install,
its own Node.js process, and its own filesystem.

In a typical setup both are active simultaneously:

```
4 shards × 4 workers each = 16 parallel test processes across 4 machines
```

```typescript
// playwright.config.ts — controls workers per machine
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  // --shard is set via CLI flag, not here — each machine gets a different value
});
```

**Decision rule:**
- Hit the workers ceiling on one machine → add shards (more machines)
- Have only one machine → tune workers (more processes)
- Have both → tune workers per machine AND shard across machines

---

## Q402.3 — How are tests distributed across shards?

Playwright distributes tests by **file**, not by individual test. An entire
test file goes to one shard — the tests within that file run on that machine.

```
Suite: 12 files, --shard=1/4

Shard 1: files 1, 5, 9          (3 files × their tests)
Shard 2: files 2, 6, 10         (3 files × their tests)
Shard 3: files 3, 7, 11         (3 files × their tests)
Shard 4: files 4, 8, 12         (3 files × their tests)
```

The distribution is deterministic — the same test always lands on the
same shard for a given total. This matters for reproducibility: if shard 2
fails, the same tests run on shard 2 when you re-run it.

**Implication:** If one test file has 100 tests and all others have 10,
the shard that gets the large file is much slower than the others. Keep
test files reasonably balanced for even shard durations.

---

## Q402.4 — What is the blob reporter and why is it needed for sharding?

Each shard produces its own results on its own machine. To get a single
unified report covering all shards, each shard outputs a **blob file** —
a binary archive containing the full run data — which is then merged
after all shards complete.

**Step 1 — Configure blob reporter for CI:**

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: process.env.CI
    ? [['blob', { outputDir: 'blob-report' }]]
    : [['html', { open: 'on-failure' }], ['list']],
});
```

**Step 2 — Each shard writes its blob:**

```bash
npx playwright test --shard=1/4   # → blob-report/report-1.zip
npx playwright test --shard=2/4   # → blob-report/report-2.zip
npx playwright test --shard=3/4   # → blob-report/report-3.zip
npx playwright test --shard=4/4   # → blob-report/report-4.zip
```

**Step 3 — Merge all blobs into one HTML report:**

```bash
npx playwright merge-reports --reporter html ./blob-report
```

The merge command reads all `.zip` files in `blob-report/` and produces
`playwright-report/index.html` — one report showing every test, every
browser, every retry, and every trace from all four shards in one place.

---

## Q402.5 — Write the complete GitHub Actions workflow for a sharded Playwright suite.

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on: [push, pull_request]

jobs:
  playwright-shards:
    name: Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false        # ← all shards run even if one fails
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npx playwright install --with-deps

      - name: Run shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env:
          CI: true

      - name: Upload blob report
        uses: actions/upload-artifact@v4
        if: always()            # ← upload even if tests failed
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1    # only needed until the merge job runs

  merge-reports:
    name: Merge Shard Reports
    runs-on: ubuntu-latest
    needs: playwright-shards   # runs after ALL shards finish
    if: always()               # runs even if some shards failed

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Download all blob reports
        uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true

      - name: Merge into HTML report
        run: npx playwright merge-reports --reporter html ./all-blob-reports

      - name: Upload merged HTML report
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

---

## Q402.6 — Why must fail-fast be false in a sharded CI matrix?

Without `fail-fast: false`, GitHub Actions cancels all remaining matrix
jobs the moment any one job fails. With a sharded test run this means:

- Shard 2 fails at t=3 minutes
- GitHub immediately cancels shards 3 and 4
- Shard 1 finishes but shards 3 and 4 never produce their blobs
- The merge job downloads incomplete blob data
- The merged report shows only partial results

With `fail-fast: false`:
- All four shards run to completion
- All four blobs are produced
- The merge job has complete data
- The merged report shows all failures across all shards

You want the full picture of what broke — not just the first shard that
found a failure. `fail-fast: false` is mandatory for sharded test runs.

---

## Q402.7 — Why must the merge job use if: always()?

The merge job depends on (`needs:`) the shard jobs. By default, GitHub
Actions skips a dependent job when its dependencies fail. If any shard
fails, the merge job would be skipped without `if: always()`.

The result: the very run where you have failures — the one where you
most need the report — produces no report at all.

```yaml
merge-reports:
  needs: playwright-shards
  if: always()    # runs even when playwright-shards has failures
```

This same principle applies to uploading the blob artefacts from each
shard — they also need `if: always()` to ensure the blob is uploaded
even when that shard's tests fail:

```yaml
- name: Upload blob report
  uses: actions/upload-artifact@v4
  if: always()    # essential — this is the data the merge job needs
```

---

## Q402.8 — How do you choose the right number of shards?

More shards reduce run time but add overhead and cost. Each shard has
startup cost: checkout, `npm ci`, browser install, process start. For
short suites this overhead dominates.

| Suite run time (1 machine) | Recommended shards |
|----------------------------|--------------------|
| Under 5 minutes            | No sharding needed |
| 5–15 minutes               | 2 shards           |
| 15–30 minutes              | 4 shards           |
| 30–60 minutes              | 4–8 shards         |
| Over 60 minutes            | 8+ shards          |

**Practical guidance:** Start with 4. Measure actual CI time after sharding.
Add more shards only if the time saving justifies the extra CI cost and
workflow complexity. Beyond 8 shards, the overhead-to-saving ratio
deteriorates for most suites.

The goal is **feedback within 10 minutes** for PR checks. Work backwards
from your suite size and per-test average time to find the shard count
that achieves this.

---

## Q402.9 — How do you combine sharding with multiple browser projects?

When the config has multiple projects (chromium, firefox, webkit), sharding
distributes across all of them. Shard 1 might get chromium tests from
files A–G, shard 2 gets firefox tests from files A–G, and so on — Playwright
interleaves projects and files to distribute evenly.

To control which browsers run on which shards, combine `--project` with
`--shard`:

```bash
# Run only chromium, sharded across 2 machines
npx playwright test --project=chromium --shard=1/2
npx playwright test --project=chromium --shard=2/2

# Run Firefox separately on 1 machine (smoke only)
npx playwright test --project=firefox --grep @smoke
```

In GitHub Actions you can set this up with separate job strategies:

```yaml
strategy:
  matrix:
    include:
      - project: chromium
        shardIndex: 1
        shardTotal: 4
      - project: chromium
        shardIndex: 2
        shardTotal: 4
      - project: chromium
        shardIndex: 3
        shardTotal: 4
      - project: chromium
        shardIndex: 4
        shardTotal: 4
      - project: firefox
        shardIndex: 1
        shardTotal: 1  # Firefox on one machine, smoke only
```

---

## Q402.10 — What is browser caching and why does it matter for sharding?

Each shard installs browsers with `npx playwright install --with-deps`.
Without caching, each of 4 shards downloads ~100–300 MB of browser binaries.
At 4 shards, that is 400–1200 MB of redundant downloads per run.

**Cache the browser installation in GitHub Actions:**

```yaml
- name: Cache Playwright browsers
  uses: actions/cache@v4
  id: playwright-cache
  with:
    path: ~/.cache/ms-playwright
    key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}

- name: Install browsers (only if cache miss)
  if: steps.playwright-cache.outputs.cache-hit != 'true'
  run: npx playwright install --with-deps
```

With browser caching:
- First run: installs and caches browsers (~2 minutes per shard)
- Subsequent runs: cache hit, skip install (~10 seconds per shard)

Across 4 shards and 10 CI runs per day, caching saves approximately
80–120 minutes of install time daily. For large teams with many CI runs,
this is significant.

---

## Q402.11 — How does sharding affect test distribution when files are uneven?

Playwright distributes tests by file. If files are very uneven in size,
shards end up uneven in run time:

```
Suite: 4 shards
File A: 100 tests  → goes to Shard 1
Files B–D: 10 each → distributed across Shards 2–4

Result:
Shard 1: 100 tests — 8 minutes
Shard 2: 10 tests  — 1 minute  (idle 7 minutes)
Shard 3: 10 tests  — 1 minute  (idle 7 minutes)
Shard 4: 10 tests  — 1 minute  (idle 7 minutes)

Total CI time: 8 minutes (bottlenecked on Shard 1)
```

With 4 shards but only getting ~2× speedup instead of the expected 4×.

**Fix:** Keep test files roughly equal in size. As a guideline:
- Aim for 15–30 tests per file for balanced sharding
- Split files that grow beyond 50 tests
- Use consistent naming (`auth.spec.ts`, `leave-apply.spec.ts`, etc.) so
  file size is predictable and distributable

---

## Q402.12 — Can you shard without the blob reporter?

Yes — each shard can use any reporter independently. The blob reporter is
just the most convenient path to a unified report. Alternative approaches:

**JUnit XML on each shard:**
```yaml
- run: npx playwright test --shard=${{ matrix.shardIndex }}/4 --reporter=junit
# Upload results/junit-${{ matrix.shardIndex }}.xml as artefact
```

Then configure the CI tool to consume all JUnit files:
```yaml
- task: PublishTestResults@2
  inputs:
    testResultsFiles: 'results/junit-*.xml'  # Azure DevOps picks up all files
```

Azure DevOps, Jenkins, and GitLab CI can all aggregate multiple JUnit
files natively.

**Tradeoff:** JUnit gives you test counts and pass/fail in the CI tool's
native UI. The blob + HTML approach gives you screenshots, videos, traces,
and the full Playwright report experience. For serious debugging, the blob
approach is superior. For simple pass/fail CI integration, JUnit is simpler.

---

## Q402.13 — How does sharding interact with project dependencies?

Project dependencies (auth setup projects) need special handling with
sharding. An auth setup project must run before the test projects that
depend on it — but with sharding, each shard is independent.

The cleanest solution: run auth setup as a separate pre-sharding job:

```yaml
jobs:
  auth-setup:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --project=admin-auth --project=employee-auth
      - uses: actions/upload-artifact@v4
        with:
          name: auth-state
          path: .auth/

  playwright-shards:
    needs: auth-setup
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: auth-state
          path: .auth/
      - run: npx playwright test --shard=${{ matrix.shardIndex }}/4
        # Each shard loads auth state from the downloaded .auth/ directory
```

The auth setup runs once. All shards download the saved auth state and use
it. This is more efficient than each shard independently re-running auth
setup before its tests.

---

## Q402.14 — What is the typical speedup from sharding and how do you measure it?

**Measure the baseline first:**

```bash
# Single machine, record total time
time npx playwright test --workers=4
```

Then measure with shards (simulate locally with sequential runs):

```bash
# Theoretical 4-shard time: run each shard and take the MAX duration
time npx playwright test --shard=1/4 &
time npx playwright test --shard=2/4 &
time npx playwright test --shard=3/4 &
time npx playwright test --shard=4/4 &
wait
```

The bottleneck is always the slowest shard — total CI time equals
the longest shard, not the average.

**Typical speedup curve:**

| Shards | Expected speedup | Actual (overhead included) |
|--------|-----------------|---------------------------|
| 2      | 2×              | 1.7–1.9×                  |
| 4      | 4×              | 3–3.5×                    |
| 8      | 8×              | 5–6×                      |
| 16     | 16×             | 8–10×                     |

Overhead (checkout, install, startup) reduces actual speedup from theoretical.
Beyond 8 shards, the overhead-to-benefit ratio degrades significantly for
most suites unless browsers are well-cached.

---

## Q402.15 — What are the common sharding mistakes and how do you avoid them?

**Mistake 1 — Forgetting `fail-fast: false`:**
One shard failure cancels the others. Incomplete blob data. Merge job fails.
Fix: always add `fail-fast: false` to the matrix strategy.

**Mistake 2 — No `if: always()` on blob upload or merge job:**
Blobs are not uploaded when shards fail. Merge job is skipped when shards
fail. You have no report exactly when you need it.
Fix: add `if: always()` to every step that produces or processes blobs.

**Mistake 3 — Installing browsers on every shard without caching:**
4 shards × 3 browsers × 100MB = 1.2GB downloaded per run.
Fix: cache `~/.cache/ms-playwright` keyed to `package-lock.json` hash.

**Mistake 4 — Not accounting for auth setup:**
Each shard tries to run auth setup independently. 4 shards × 4 login flows
hitting the server simultaneously, each writing to `.auth/admin.json`.
Race condition — all four write different sessions to the same file.
Fix: run auth setup as a separate pre-shard job, upload `.auth/` as an
artefact, download in each shard.

**Mistake 5 — Large test files causing uneven sharding:**
One shard gets a 100-test file and runs for 10 minutes while other shards
finish in 2. The CI time is limited by the slowest shard.
Fix: keep files balanced at 15–30 tests each.

---

## Q402.16 — Write a sharded configuration that runs all browsers efficiently.

```yaml
# .github/workflows/playwright-sharded.yml
name: Playwright Tests — Sharded

on: [push, pull_request]

jobs:
  auth-setup:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - run: npx playwright install chromium --with-deps
      - run: npx playwright test --project=admin-auth --project=employee-auth
        env: { CI: true, BASE_URL: ${{ vars.TEST_BASE_URL }} }
      - uses: actions/upload-artifact@v4
        with:
          name: auth-state
          path: .auth/
          retention-days: 1

  chromium-shards:
    needs: auth-setup
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4]
        shardTotal: [4]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - name: Cache browsers
        uses: actions/cache@v4
        id: cache
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      - if: steps.cache.outputs.cache-hit != 'true'
        run: npx playwright install --with-deps
      - uses: actions/download-artifact@v4
        with: { name: auth-state, path: .auth/ }
      - run: >
          npx playwright test
          --project=chromium
          --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
        env: { CI: true, BASE_URL: ${{ vars.TEST_BASE_URL }} }
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1

  merge-and-smoke-browsers:
    needs: chromium-shards
    runs-on: ubuntu-latest
    if: always()
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'npm' }
      - run: npm ci
      - uses: actions/download-artifact@v4
        with:
          path: all-blob-reports
          pattern: blob-report-*
          merge-multiple: true
      - run: npx playwright merge-reports --reporter html ./all-blob-reports
      - uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      # Run Firefox and Safari smoke tests on the merge machine
      - uses: actions/download-artifact@v4
        with: { name: auth-state, path: .auth/ }
      - run: npx playwright install --with-deps
      - run: npx playwright test --project=firefox --project=webkit --grep @smoke
        env: { CI: true }
```

---

## Q402.17 — When should you NOT use sharding?

Sharding adds complexity: blob reporters, merge jobs, artefact management,
auth-state coordination, browser caching configuration. This complexity
is only worth it when the benefit is clear.

**Do not shard when:**
- The suite runs in under 10 minutes on one machine — the overhead of
  sharding setup may save less time than it costs
- The team lacks CI/CD maintenance experience — a broken shard workflow
  is harder to debug than a slow single-machine run
- The suite is unstable — fixing flakiness first is a better investment
  than distributing flaky tests across more machines

**Shard when:**
- PR check feedback takes longer than 10–15 minutes
- The suite has grown beyond what more workers can fix (you are already
  at `workers: 8` and the machine is saturated)
- CI cost per minute is lower than engineering time spent waiting

A simple rule: if engineers are complaining about CI being slow and
you cannot reduce suite time by 50% just by fixing flakiness and tuning
workers, sharding is the right next step.

---

## Q402.18 — How did you implement sharding in your project?

Our OrangeHRM suite grew from 80 tests to 600 (200 tests × 3 browsers)
over six months. Single-machine CI took 28 minutes. Engineers were pushing
batches of changes to avoid triggering multiple slow runs — a sign the
feedback loop was broken.

**The implementation:**

1. Added the blob reporter to the config behind `process.env.CI`.
2. Created the sharded GitHub Actions workflow with 4 shards and a merge job.
3. Extracted auth setup into a pre-shard job to avoid race conditions on
   `.auth/admin.json`.
4. Added browser caching keyed to `package-lock.json` — this alone saved
   2 minutes per shard per run.
5. Found that one test file had 120 tests (the full employee module) while
   all others had 10–20. Split it into four focused files. Shard balance
   improved from a 3:1 imbalance to near-even.

**Results:**
- CI time: 28 minutes → 9 minutes
- Engineers resumed pushing individual changes without batching
- The merge job's HTML report replaced our previous manual log-trawling
  for cross-shard failures

**The unexpected lesson:** Splitting the large test file into focused files
improved local development even more than CI. Running `npx playwright test tests/pim/add-employee.spec.ts` now takes 90 seconds instead of 15 minutes
for the monolithic file. Sharding forced good file structure discipline
that benefited the whole workflow.

---

## Chapter Summary

- Sharding splits the suite across multiple CI machines via `--shard=N/M` CLI flag.
- Tests are distributed by file — a whole file goes to one shard, not split between shards.
- Blob reporter collects shard results. `npx playwright merge-reports` combines all blobs into one HTML report.
- `fail-fast: false` in the CI matrix — lets all shards run even if one fails.
- `if: always()` on blob upload and the merge job — ensures the report is produced even when tests fail.
- Sharding vs workers: workers parallelize within one machine; shards distribute across machines. Both are used simultaneously.
- Browser caching (key on `package-lock.json` hash) is essential — without it each shard reinstalls browsers redundantly.
- Auth setup should run as a separate pre-shard job — parallel shard auth attempts cause race conditions on `.auth/*.json` files.
- Uneven test files cause uneven shards. Keep files at 15–30 tests each for balanced distribution.
- Start with 4 shards. Only increase after measuring that the time saving justifies the added complexity.
- Do not shard suites that run in under 10 minutes — the overhead negates the benefit.
