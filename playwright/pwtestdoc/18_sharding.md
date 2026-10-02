# 17 — Sharding

## The Scenario

Your Playwright suite has grown to 600 tests across three browsers — 200 tests × 3 projects. On a single CI machine with 4 workers it takes 28 minutes. Your team pushes code several times a day. Waiting 28 minutes for feedback is too slow.

You cannot simply add more workers. The CI machine has 8 CPUs — beyond that, you hit diminishing returns from contention. The bottleneck is not the machine, it is the single machine.

Sharding solves this by splitting the suite across multiple machines running in parallel. Four machines each running a quarter of the suite brings 28 minutes down to 7. Eight machines bring it to under 4.

---

## What Sharding Is

Sharding divides your test suite into N equal slices (shards) and runs one slice per machine. Each machine is independent — it has its own browser, its own workers, its own output. When all machines finish, their results are merged into a single report.

Sharding is a CI-level concern. It is not configured in `playwright.config.ts` — it is controlled via the CLI flag `--shard` passed to each machine.

```bash
# Machine 1 runs tests 1–25% of suite
npx playwright test --shard=1/4

# Machine 2 runs tests 26–50%
npx playwright test --shard=2/4

# Machine 3 runs tests 51–75%
npx playwright test --shard=3/4

# Machine 4 runs tests 76–100%
npx playwright test --shard=4/4
```

Each machine runs `npx playwright test` with a different `--shard` value. Playwright distributes tests deterministically — the same test always lands on the same shard for a given total.

---

## How Tests Are Distributed

Playwright distributes tests by file, not by individual test. If a file has 20 tests and the suite has 4 shards, that entire file goes to one shard — the 20 tests within it still run sequentially on that shard (or in parallel within it if `fullyParallel` is enabled).

This means shard balance depends on how evenly your test files are sized. A single file with 100 tests will make one shard much slower than the others. Keep test files reasonably balanced in size for even sharding.

---

## The Blob Reporter — Collecting Results from All Shards

Each shard produces its own results. To get a single unified report, each shard outputs a blob file — a binary artefact containing the full test run data — which is merged afterwards.

### Step 1 — Configure the blob reporter

```typescript
// playwright.config.ts
export default defineConfig({
  reporter: process.env.CI
    ? [['blob', { outputDir: 'blob-report' }]]
    : [['html', { open: 'on-failure' }], ['list']],
});
```

Each shard writes its blob to `blob-report/`. Locally you still get the HTML reporter.

### Step 2 — Run each shard

```bash
npx playwright test --shard=1/4   # produces blob-report/report-1.zip
npx playwright test --shard=2/4   # produces blob-report/report-2.zip
npx playwright test --shard=3/4   # produces blob-report/report-3.zip
npx playwright test --shard=4/4   # produces blob-report/report-4.zip
```

### Step 3 — Merge all blobs into one HTML report

```bash
npx playwright merge-reports --reporter html ./blob-report
```

This reads all `.zip` files in `blob-report/` and produces a single `playwright-report/index.html` combining results from all four shards — showing every test, every browser, every retry, and every trace in one place.

---

## GitHub Actions — Full Sharding Setup

```yaml
# .github/workflows/playwright.yml
name: Playwright Tests

on: [push, pull_request]

jobs:
  playwright-shards:
    name: Shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false          # continue other shards even if one fails
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
        if: always()
        with:
          name: blob-report-${{ matrix.shardIndex }}
          path: blob-report/
          retention-days: 1    # only needed until merge job runs

  merge-reports:
    name: Merge Shard Reports
    runs-on: ubuntu-latest
    needs: playwright-shards    # runs after all shards finish
    if: always()                # runs even if some shards failed

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

**Key decisions in this workflow:**

`fail-fast: false` — without this, GitHub cancels all remaining shards the moment one fails. You want all shards to finish so you get the full picture of what broke, not just the first failure.

`if: always()` on the merge job — the merge job must run even when shards fail. If it only ran on success, you would have no report when you need it most.

`retention-days: 1` on blob artefacts — blobs are only needed until the merge job runs. Keep retention short to save storage. The merged HTML report uses `retention-days: 30`.

Each shard is named `blob-report-1`, `blob-report-2`, etc. The `merge-multiple: true` option on the download step combines them all into one directory for the merge command.

---

## Choosing the Right Number of Shards

More shards is not always better. Each shard has startup cost — cloning the repo, installing Node, installing browsers (unless cached), and the Playwright process launch overhead. For short suites this overhead dominates.

| Suite duration (1 machine) | Recommended shards |
|----------------------------|--------------------|
| Under 5 minutes            | No sharding needed |
| 5–15 minutes               | 2 shards           |
| 15–30 minutes              | 4 shards           |
| 30–60 minutes              | 4–8 shards         |
| Over 60 minutes            | 8+ shards          |

Start with 4. Measure the actual CI time. Add shards only if the time saving justifies the added complexity and CI cost.

---

## Sharding vs Workers — What is the Difference

These are different levels of parallelism that work together, not instead of each other.

**Workers** (`--workers=4`) — parallel test execution within a single machine. Tests run in parallel processes on the same machine's CPUs. Limited by the machine's CPU count.

**Shards** (`--shard=1/4`) — splits the suite across multiple separate machines. Each machine is a completely independent process with its own environment.

In a typical setup both are active simultaneously: 4 shards each running with 4 workers = 16 parallel test processes across 4 machines.

```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 2 : 4,
  // workers per machine — shards are set via CLI flag, not in config
});
```

---

## Sharding with Multiple Projects

When your config has multiple projects (chromium, firefox, webkit), sharding distributes across all of them. Shard 1 might get chromium tests from files A–G, shard 2 gets firefox tests from files A–G, and so on — Playwright interleaves projects and files evenly.

If you want to control which projects run on which shards, use `--project` in combination with `--shard`:

```bash
# Run only chromium, sharded across 2 machines
npx playwright test --project=chromium --shard=1/2
npx playwright test --project=chromium --shard=2/2
```

---

## Key Points

- Sharding splits the test suite across multiple CI machines — each runs a slice via `--shard=N/M`
- Tests are distributed by file — a whole file goes to one shard, not split across shards
- `--shard` is a CLI flag, not a config option — each CI machine receives a different value
- Blob reporter — each shard writes a `.zip` file; `npx playwright merge-reports` combines them into one HTML report
- `fail-fast: false` in the CI matrix — lets all shards finish even when one fails
- Merge job uses `if: always()` — runs even when shards report failures
- Blob retention can be short (1 day) — blobs are only needed until the merge job runs
- Sharding vs workers — workers parallelize within one machine, shards distribute across machines; both are active simultaneously
- Start with 4 shards; only add more after measuring actual time savings
- Uneven file sizes cause uneven shard durations — keep test files balanced
