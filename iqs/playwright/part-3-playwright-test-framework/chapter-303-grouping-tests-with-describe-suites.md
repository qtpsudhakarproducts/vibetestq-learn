# Chapter 303 — Grouping Tests with describe & Suites

This chapter covers `test.describe()` — Playwright's mechanism for grouping
related tests under a shared name. Interviewers ask about grouping because it
is where test structure decisions become visible: how tests share setup, how
configuration is scoped, how reports are organised, and how execution modes
work. Candidates who understand describe deeply write maintainable suites;
those who don't produce flat, unmanageable spec files.

---

## Q303.1 — What is test.describe() and why does it exist?

`test.describe()` groups related tests under a shared name. It does three
distinct things:

**1. Creates hierarchy in reports** — tests appear under their group name,
not as a flat list. When failures occur, you see which feature area broke.

**2. Scopes hooks** — `beforeEach`, `afterEach`, `beforeAll`, `afterAll`
declared inside a describe apply only to tests in that describe. They
do not leak into other groups.

**3. Scopes test.use()** — configuration overrides (viewport, locale,
baseURL) declared inside a describe apply only to tests inside it.

```typescript
test.describe('Login — Standard Authentication', () => {
  test('valid credentials redirect to dashboard @smoke', async ({ page }) => { ... });
  test('invalid password shows error @regression', async ({ page }) => { ... });
});

test.describe('Login — Password Reset', () => {
  test('forgot password link opens reset page @regression', async ({ page }) => { ... });
  test('reset with expired token shows error @regression', async ({ page }) => { ... });
});
```

The CI report now groups failures by feature area. Two failures under
"Password Reset" tell you instantly where the problem is.

---

## Q303.2 — What is the full test title in Playwright?

The full test title is the concatenation of all describe names and the
test name, joined by `>`:

```
[Outer describe] > [Inner describe] > [Test title]
```

```typescript
test.describe('Login', () => {
  test.describe('Password Reset', () => {
    test('sends email for valid address @regression', async ({ page }) => { ... });
  });
});
// Full title: "Login > Password Reset > sends email for valid address @regression"
```

The full title is what:
- `--grep` matches on the CLI
- HTML and JUnit reports display
- Test IDs in parallelism are based on

Keep full titles short enough to read at a glance in a CI failure report.

---

## Q303.3 — How do you use describe to scope hooks in your project?

In our project, describe blocks let different test groups set up their own
starting state without interfering with each other.

```typescript
test.describe('Employee List', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
    // Only runs before tests in this group
  });

  test('shows all employees by default @smoke', async ({ page }) => { ... });
  test('search filters results correctly @regression', async ({ page }) => { ... });
});

test.describe('Add Employee', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees/add');
    // Completely separate setup — does not affect Employee List tests
  });

  test('saves with valid data @smoke', async ({ page }) => { ... });
  test('shows error for duplicate ID @regression', async ({ page }) => { ... });
});
```

Without describe, a file-level `beforeEach` would navigate to `/employees`
before every test — including tests that need to start on `/employees/add`.
Describe makes each group own its own setup.

---

## Q303.4 — What is the hook execution order in nested describes?

Hooks execute from outer to inner on setup, and inner to outer on teardown:

```typescript
test.describe('Outer', () => {
  test.beforeEach(async () => console.log('outer beforeEach'));
  test.afterEach(async ()  => console.log('outer afterEach'));

  test.describe('Inner', () => {
    test.beforeEach(async () => console.log('inner beforeEach'));
    test.afterEach(async ()  => console.log('inner afterEach'));

    test('runs', async () => console.log('test body'));
  });
});
```

Output for the one test:
```
outer beforeEach
inner beforeEach
test body
inner afterEach
outer afterEach
```

This mirrors a "peel the onion" model — outer setup wraps inner setup.
The most common practical use: outer `beforeEach` logs in (shared auth),
inner `beforeEach` navigates to the specific page for that group.

---

## Q303.5 — What does test.use() do inside a describe?

`test.use()` overrides configuration options for all tests inside the
describe. Outside the describe, the original configuration is restored.

```typescript
test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 812 } }); // iPhone 14 viewport

  test('navigation menu collapses on mobile @regression', async ({ page }) => {
    // This test runs with the mobile viewport
  });

  test('footer is visible without scrolling @regression', async ({ page }) => {
    // Also uses the mobile viewport
  });
});

test('checkout is accessible at desktop size @smoke', async ({ page }) => {
  // Back to the global viewport — test.use() only applied inside the describe
});
```

`test.use()` is the correct way to apply locale, baseURL, or viewport
overrides to a subset of tests — without changing the global config
and without duplicating `test.use()` in every individual test.

---

## Q303.6 — What is the difference between test.describe.only and test.only?

`test.only()` marks one test to run exclusively. All other tests — in the
same file and across the entire project — are skipped.

`test.describe.only()` marks one describe group to run exclusively. Tests
outside that group are skipped. Tests inside the group all run normally.

```typescript
test.describe.only('Login', () => {
  // All tests in this describe run
  test('valid credentials @smoke', async ({ page }) => { ... });
  test('invalid password @regression', async ({ page }) => { ... });
});

test.describe('Dashboard', () => {
  // All tests in this describe are skipped
  test('widgets load @smoke', async ({ page }) => { ... });
});
```

Both forms are local debugging tools. Neither should ever be committed.
Both are blocked by `forbidOnly: !!process.env.CI` in `playwright.config.ts`.

---

## Q303.7 — What is test.describe.skip?

`test.describe.skip()` skips all tests inside the group. They appear in
the report as skipped — they are not hidden.

```typescript
test.describe.skip('Recruitment Module', () => {
  // All tests skipped — module not deployed in this environment
  test('post vacancy @smoke', async ({ page }) => { ... });
  test('shortlist candidate @regression', async ({ page }) => { ... });
});
```

This is equivalent to marking every test in the group with `test.skip`,
but in one declaration rather than many. The reason should still be
documented — either in the describe name itself or as a comment.

---

## Q303.8 — What is the difference between describe.skip and describe.fixme?

`test.describe.skip()` — all tests in the group are intentionally disabled.

`test.describe.fixme()` — all tests in the group are broken and need repair.
They appear under the "Fixme" category in the HTML report, not "Skipped".

```typescript
// Skip — module intentionally disabled
test.describe.skip('Beta Feature — Not in Test Environment', () => {
  test('feature works', async ({ page }) => { ... });
});

// Fixme — tests broken after a regression
test.describe.fixme('Leave Management — Broken after v3.0 — ticket #PW-88', () => {
  test('apply leave shows confirmation', async ({ page }) => { ... });
  test('leave balance updates after approval', async ({ page }) => { ... });
});
```

The distinction matters for team communication. A fixme group signals
"this is broken and needs someone to fix it." A skip group signals "this is
off by choice." Both are visible in the report; the categories are separate.

---

## Q303.9 — What is describe.parallel and when should you use it?

`test.describe.configure({ mode: 'parallel' })` makes all tests inside the
describe run concurrently — in separate workers simultaneously, rather than
sequentially in one worker.

```typescript
test.describe('Independent API Tests', () => {
  test.describe.configure({ mode: 'parallel' });

  test('GET /users returns 200', async ({ request }) => { ... });
  test('POST /users creates record', async ({ request }) => { ... });
  test('DELETE /users removes record', async ({ request }) => { ... });
});
```

**Only use parallel mode when tests are fully independent** — they must
not share any state, must not depend on execution order, and must not
modify shared data that other tests in the group read.

By default, Playwright already runs test files in parallel across workers.
`describe.parallel` goes further — it runs tests within one file concurrently.
This is rarely needed unless tests within the file are completely isolated
and the file has many slow tests.

---

## Q303.10 — What is describe.serial and when should you use it?

`test.describe.configure({ mode: 'serial' })` forces all tests inside the
describe to run in the same worker, in order, one at a time. If one test
fails, all subsequent tests in the group are skipped automatically.

```typescript
test.describe('Multi-Step Checkout Wizard', () => {
  test.describe.configure({ mode: 'serial' });

  test('step 1 — cart review', async ({ page }) => { ... });
  test('step 2 — shipping details', async ({ page }) => { ... });
  test('step 3 — payment', async ({ page }) => { ... });
  test('step 4 — confirmation', async ({ page }) => { ... });
});
```

**Use serial only for genuinely sequential workflows** where each step
depends on the previous one completing successfully. This is uncommon —
most test suites should be written so every test is independent.

Serial mode is the opposite of good test design for most scenarios. When you
find yourself reaching for it, ask first: can this be restructured into
independent tests that each set up their own state?

---

## Q303.11 — How deep should you nest describe blocks?

Two levels maximum. A third level is a signal that the spec file is too broad
and should be split into separate files.

```typescript
// ✅ Two levels — clear, maintainable
test.describe('Checkout', () => {
  test.describe('Payment Methods', () => {
    test('credit card payment completes @smoke', ...)
    test('PayPal payment completes @regression', ...)
  });

  test.describe('Shipping Options', () => {
    test('standard shipping calculates correct total @smoke', ...)
    test('express shipping calculates correct total @regression', ...)
  });
});

// ❌ Three levels — too deep, spec file is doing too much
test.describe('Checkout', () => {
  test.describe('Payment Methods', () => {
    test.describe('Credit Card', () => { // split this into its own file
      test('valid card completes payment @smoke', ...)
    });
  });
});
```

The full test title also gets longer with each nesting level. Very deep
nesting produces titles that are too long to read in the CI report.

---

## Q303.12 — What is the difference between a file-level beforeEach and a describe-scoped beforeEach?

A `beforeEach` at the file level (outside any describe) runs before every
test in the entire file.

A `beforeEach` inside a describe runs only before tests inside that describe.

```typescript
// File-level — runs before every test in the file
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@example.com');
  await page.getByLabel('Password').fill('password');
  await page.getByRole('button', { name: 'Sign In' }).click();
});

test.describe('Employee Module', () => {
  // Group-level — runs only before tests in this describe
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
  });

  test('employee list loads @smoke', async ({ page }) => {
    // Two beforeEach ran: file-level (login) then describe-level (navigate)
  });
});

test('dashboard loads after login @smoke', async ({ page }) => {
  // Only the file-level beforeEach ran (login)
  // The describe-level beforeEach did NOT run here
});
```

The two levels compose: outer runs first, inner runs second. The file-level
is for setup that applies everywhere; the describe-level is for setup specific
to that group.

---

## Q303.13 — How do you use test.describe to configure different viewports for different test groups?

```typescript
import { test, expect } from '@playwright/test';

test.describe('Desktop Layout', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('sidebar is visible @smoke', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeVisible();
  });
});

test.describe('Tablet Layout', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('sidebar collapses into hamburger @regression', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('button', { name: 'Menu' })).toBeVisible();
  });
});

test.describe('Mobile Layout', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('sidebar is hidden by default @regression', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page.getByRole('navigation')).toBeHidden();
  });
});
```

Each describe group runs its tests at its own viewport. The global viewport
from `playwright.config.ts` applies everywhere else. No configuration
change is needed between groups — `test.use()` scopes it automatically.

---

## Q303.14 — Write code that uses nested describe with scoped hooks and test.use().

```typescript
import { test, expect } from '@playwright/test';

test.describe('Settings Module', () => {
  // File-level setup — applies to all groups in this file
  test.beforeEach(async ({ page }) => {
    // Assume auth is handled by storageState in the fixture
    await page.goto('/settings');
  });

  test.describe('Profile Settings', () => {
    test('displays current user name @smoke', async ({ page }) => {
      await expect(page.getByTestId('profile-name')).toBeVisible();
    });

    test('saves updated display name @regression', async ({ page }) => {
      await page.getByLabel('Display Name').fill('Alice Updated');
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('alert')).toHaveText('Profile saved');
    });
  });

  test.describe('Notification Settings', () => {
    test.beforeEach(async ({ page }) => {
      // Navigate to the notifications sub-page
      await page.getByRole('link', { name: 'Notifications' }).click();
    });

    test('email notifications are enabled by default @smoke', async ({ page }) => {
      await expect(page.getByLabel('Email notifications')).toBeChecked();
    });

    test('can disable push notifications @regression', async ({ page }) => {
      await page.getByLabel('Push notifications').uncheck();
      await page.getByRole('button', { name: 'Save' }).click();
      await expect(page.getByRole('alert')).toHaveText('Preferences saved');
    });
  });

  test.describe('Accessibility Settings', () => {
    test.use({ colorScheme: 'dark' }); // Dark mode for this group only

    test('dark mode is applied when system preference is dark @regression', async ({ page }) => {
      await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(18, 18, 18)');
    });
  });
});
```

---

## Q303.15 — How do you run only tests in a specific describe group from the CLI?

Use `--grep` with the describe name. The grep pattern matches against the
full test title, which includes the describe prefix:

```bash
# Run all tests in the "Login" describe group
npx playwright test --grep "Login"

# Run only tests in the "Login > Password Reset" group
npx playwright test --grep "Login > Password Reset"

# Combine with tag filtering
npx playwright test --grep "Login.*@smoke"
```

The pattern is a regex, so partial matches work. `--grep "Login"` matches
any full title containing "Login" — including nested describes like
"Login > Password Reset > sends email for valid address @regression".

---

## Q303.16 — What is the one top-level describe per file rule?

Each spec file should have exactly one top-level `test.describe()`. The
describe name should match the file name.

```typescript
// employees.spec.ts
test.describe('Employees', () => {
  // All tests in this file belong here
});

// NOT:
// test.describe('Employees', () => { ... });
// test.describe('Leave', () => { ... }); // <- belongs in leave.spec.ts
```

This rule exists for two reasons:

1. **Parallelism**: Playwright runs spec files in parallel. If a file has
   two unrelated describe groups, they always run in the same worker and
   cannot be parallelised against each other. Separate files can run
   on separate workers simultaneously.

2. **Maintainability**: A file with one feature area is easier to understand,
   faster to search, and cleaner to track in version control. Changes to
   the employees feature only affect `employees.spec.ts`.

---

## Q303.17 — How did your project organise describe structure for a large module?

In our project, the checkout module has 60+ tests covering cart, shipping,
payment, and confirmation. We split them into four files — one per sub-feature.
Each file has one top-level describe. Within each file, we use two levels of
nesting for happy path vs edge case groups.

```
tests/
  checkout/
    cart.spec.ts           # test.describe('Cart')
    shipping.spec.ts       # test.describe('Shipping')
    payment.spec.ts        # test.describe('Payment')
    confirmation.spec.ts   # test.describe('Confirmation')
```

Inside `payment.spec.ts`:
```typescript
test.describe('Payment', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to checkout with a pre-filled cart (via API setup)
    await page.goto('/checkout/payment');
  });

  test.describe('Credit Card', () => {
    test('valid card completes payment @smoke', async ({ page }) => { ... });
    test('expired card shows error @regression', async ({ page }) => { ... });
    test('invalid CVC shows error @regression', async ({ page }) => { ... });
  });

  test.describe('PayPal', () => {
    test('PayPal redirect opens popup @regression', async ({ page }) => { ... });
    test('completed PayPal returns to confirmation @regression', async ({ page }) => { ... });
  });
});
```

Each file runs in its own worker. CI runs all four files in parallel.
A failure in `payment.spec.ts` does not delay results from `shipping.spec.ts`.

---

## Q303.18 — What is describe.configure and how does it differ from describe.parallel?

`test.describe.configure({ mode, retries })` is the explicit, composable
API for setting execution mode and retry count on a describe group.
`test.describe.parallel` is a shorthand alias for `configure({ mode: 'parallel' })`.

```typescript
// These are equivalent
test.describe.parallel('My Group', () => { ... });

test.describe('My Group', () => {
  test.describe.configure({ mode: 'parallel' });
  // ...
});

// configure lets you combine mode and retries in one call
test.describe('Flaky Network Tests', () => {
  test.describe.configure({ mode: 'parallel', retries: 2 });

  test('API call 1 retries on failure', async ({ request }) => { ... });
  test('API call 2 retries on failure', async ({ request }) => { ... });
});
```

**Use `configure()` when you need both a mode override and a retry override**
for the same group. For mode-only changes, `describe.parallel` or
`describe.serial` are more readable.

---

## Chapter Summary

- `test.describe()` creates hierarchy in reports, scopes hooks, and scopes `test.use()` — three distinct purposes.
- The full test title is `[describe] > [test title]`. This is what `--grep` matches and what CI shows.
- Hooks inside a describe only run for tests inside that describe — they do not leak outward.
- `test.use()` inside a describe applies configuration only to that group — viewport, locale, baseURL overrides.
- `describe.only` and `test.only` are local debugging tools. Never commit them — `forbidOnly: !!process.env.CI` is the safety net.
- `describe.skip` disables all tests in the group. `describe.fixme` marks them as broken. Both appear in the report.
- `describe.parallel` runs tests concurrently — only safe when tests are fully independent.
- `describe.serial` runs tests in order in one worker — use only for genuinely sequential workflows.
- Maximum two levels of nesting. Deeper nesting means the file is too broad — split it.
- One top-level describe per file. File name should match the describe name.
