# Chapter 17: Parallelism & Sharding (Complete Guide)

## The Concept of Parallelism & Sharding

Speed is the ultimate metric for a successful automation suite. If a test suite takes 2 hours to run, developers won't wait for the results. **Parallelism** allows you to run multiple tests simultaneously on one machine, while **Sharding** allows you to split tests across multiple machines.

**Purpose**: This chapter explains how Playwright's worker-based architecture enables massive speed gains and how to manage the challenges of isolated test execution.

**Why is it required?**
1. **Fast Feedback**: To reduce the execution time of a suite from hours to minutes, enabling continuous integration.
2. **Resource Optimization**: To fully utilize the CPU/Memory of your local machine or CI server.
3. **Global Scale**: To run thousands of tests simultaneously using a distributed grid or cloud environment.

## The Speed of Playwright

Playwright is fast because it runs tests in **Parallel**.
- **By Default**: Parallelism is per-file. (e.g., `login.spec.ts` on Worker 1, `signup.spec.ts` on Worker 2).
- **Fully Parallel**: Parallelism is per-test. (e.g., `test('A')` inside `login.spec.ts` runs on Worker 1, `test('B')` on Worker 2).

---

## Workers vs Processes

A **Worker** is an OS Node.js process.
- Each worker starts a **Browser Instance**.
- Workers **never** share memory or variables. `global.foo = 'bar'` in Worker 1 is invisible to Worker 2.
- Workers are reused between tests (same Browser, but new Context/Page) to save startup time.

### Controlling Workers

```typescript
// playwright.config.ts
export default defineConfig({
  // CI usually has 2 cores. Local machines have 8+.
  // Playwright defaults to 50% of cores.
  workers: process.env.CI ? 2 : '50%',
});
```

---

## Fully Parallel Mode

The goal: **Run everything at once.**

```typescript
// playwright.config.ts
export default defineConfig({
  fullyParallel: true, // Enable test-level parallelism
});
```

**Why isn't it on by default?**
Because historically, users wrote tests in a single file assuming they run in order (`test 1` creates data, `test 2` edits it). `fullyParallel` breaks that assumption.

---

## The Isolation Challenge

When 4 tests run at the exact same millisecond:
1. **Database Collisions**: If `Test A` edits "User 1" and `Test B` deletes "User 1", one will fail randomly.
2. **Visual Collisions**: Not an issue (Browsers are isolated).

**Solution**:
1. **Isolate Data**: Each test creates its *own* user/item. (e.g., `User_${Date.now()}_${WorkerId}`).
2. **Worker Index**: Use `testInfo.workerIndex` to namespace resources.

```typescript
test('isolated test', async ({ page }, testInfo) => {
  const uniqueId = `user_${testInfo.workerIndex}_${testInfo.testId}`;
  await createUser(uniqueId);
  // ...
});
```

---

## Sharding: Scaling to Infinity

If you have 10,000 tests, even 8 workers on one machine takes hours.
**Sharding** splits tests across *multiple machines*.

### How Sharding Works
You tell Playwright: "You are machine 1 of 4. Run your slice."

```bash
# Machine 1
npx playwright test --shard=1/4

# Machine 2
npx playwright test --shard=2/4
```

### GitHub Actions Matrix Example

```yaml
jobs:
  test:
    matrix:
      shard: [1, 2, 3, 4]
    steps:
      - name: Run Shard
        run: npx playwright test --shard=${{ matrix.shard }}/4
      
      - name: Upload Blob Report
        uses: actions/upload-artifact@v3
        with:
          name: blob-report-${{ matrix.shard }}
          path: blob-report
```

*Note: Sharding produces unconnected reports. You must merge them (See Ch. 15).*

---

## Best Practices

| Strategy | Recommendation |
|----------|----------------|
| **Do use `fullyParallel`** | Refactor tests to be independent. The speed gain is worth it. |
| **Worker count** | Don't set `workers: 100`. It will crash your CPU/Memory. 1 worker per CPU core is usually the max efficient limit. |
| **Serial Mode** | If a file *must* run sequentially (e.g., specific CRUD flow), use `test.describe.configure({ mode: 'serial' })`. |
| **Database** | Never use a single shared seed data set for parallel parallel tests. Tests *will* step on each other's toes. |

**Summary**: You now know how to run tests in parallel to achieve maximum speed. The next chapter covers the most important design pattern in test automation: the Page Object Model (POM).
