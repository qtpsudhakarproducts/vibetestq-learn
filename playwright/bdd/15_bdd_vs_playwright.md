# 11 — BDD vs Plain Playwright Tests

## The Question

When should you use Cucumber BDD feature files instead of plain Playwright tests?

This is one of the most debated questions in test automation. The answer depends on your
team, your project, and who reads your tests.

---

## What Plain Playwright Tests Look Like

```typescript
// tests/login.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Login', () => {

  test('successful login with valid credentials @smoke', async ({ page }) => {
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('admin123');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page).toHaveURL(/dashboard/);
  });

  test('login with wrong password shows error @regression', async ({ page }) => {
    await page.goto('/web/index.php/auth/login');
    await page.getByPlaceholder('Username').fill('Admin');
    await page.getByPlaceholder('Password').fill('wrongpassword');
    await page.getByRole('button', { name: 'Login' }).click();
    await expect(page.getByText('Invalid credentials')).toBeVisible();
  });

});
```

---

## What BDD Feature Files Look Like

```gherkin
Feature: Login to OrangeHRM

  Background:
    Given I am on the OrangeHRM login page

  @smoke
  Scenario: Successful login with valid credentials
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should be on the dashboard

  @regression
  Scenario: Login with wrong password shows error
    When I enter username "Admin" and password "wrongpassword"
    And I click the login button
    Then I should see the error message "Invalid credentials"
```

Both test the same thing. The difference is who can read them and how they are maintained.

---

## When BDD Adds Real Value

### Business stakeholders actively read the tests
If a product manager, client, or business analyst regularly reviews what is being tested,
BDD gives them tests they can read. Plain Playwright tests require TypeScript knowledge.

### Requirements come from conversations
BDD is most powerful when feature files are written **before** development starts, in
a Three Amigos meeting. The Gherkin scenarios become the shared definition of done.

### You need living documentation
A BDD report shows exactly what the system does in business language. After a release,
stakeholders can open the report and see which scenarios passed — essentially a list of
verified behaviours.

### The team has a dedicated tester who is not a developer
Business analysts and manual testers can write Gherkin without knowing TypeScript.
Developers then implement the step definitions.

### Compliance and audit trails
Some industries (finance, healthcare, insurance) require documented test evidence.
A Cucumber HTML report showing Gherkin scenarios is easier to present to auditors
than a Playwright HTML report showing TypeScript function names.

---

## When Plain Playwright Tests Are Better

### Small, fully technical team
If everyone on the team writes TypeScript, plain Playwright tests are faster to write,
easier to debug, and have less overhead. BDD adds a layer without adding value.

### Stakeholders will never read the tests
If no one outside the engineering team ever reads the tests, the effort of maintaining
Gherkin and step definitions is overhead with no benefit.

### Tests change rapidly
In an early-stage project where requirements change weekly, maintaining Gherkin feature
files in sync with step definitions and POM classes adds friction.

### You need powerful debugging
Playwright's trace viewer, video recording, and step-level debugging are far more
powerful than anything Cucumber offers. For debugging complex failures, plain Playwright
tests are easier to work with.

### Speed matters more than readability
Playwright tests run faster and have less setup. If you need a quick, maintainable
regression suite and stakeholder communication is not a priority, plain tests win.

---

## The Cost of BDD

BDD has real costs. Know them before committing.

| Cost | Detail |
|---|---|
| More files | Feature file + step definition file for every feature |
| More maintenance | Gherkin and TypeScript must stay in sync |
| Slower to write | More files to create and connect for each test |
| Harder to debug | No trace viewer, no step-by-step replay |
| Setup overhead | World, hooks, and config to set up |
| Training | Team must learn Gherkin syntax and Cucumber concepts |

If stakeholders are actively engaged and reading feature files, this cost is worth it.
If no one outside engineering reads the Gherkin, the cost produces no return.

---

## The Right Decision Framework

Ask these questions before choosing BDD:

1. **Will business stakeholders read the feature files?**
   - Yes → strong case for BDD
   - No → use plain Playwright

2. **Do you write scenarios before development starts?**
   - Yes → BDD supports this workflow directly
   - No → BDD adds overhead without the core benefit

3. **Does your team have non-technical testers?**
   - Yes → BDD lets them contribute
   - No → plain Playwright is simpler

4. **Do you need business-readable test reports?**
   - Yes → Cucumber HTML reports are well-suited
   - No → Playwright reports are sufficient

5. **Are requirements stable or changing frequently?**
   - Stable → BDD works well
   - Changing rapidly → BDD maintenance cost is high

---

## Can You Use Both?

Yes. Some teams use a hybrid:

- **BDD** for end-to-end user journey tests that stakeholders care about
- **Plain Playwright** for technical regression tests, edge cases, and debugging

This gives you the living documentation of BDD where it matters, and the speed and
debuggability of plain Playwright for everything else.

---

## Summary Comparison

| | BDD with Cucumber | Plain Playwright |
|---|---|---|
| Readable by stakeholders | Yes | Only by developers |
| Writing speed | Slower | Faster |
| Debugging | Harder | Easier (trace viewer) |
| Maintenance overhead | Higher | Lower |
| Living documentation | Yes | No |
| Best for | Teams with active stakeholder involvement | Technical teams |
| Three Amigos process | Supported directly | Not applicable |
| Report quality for business | Excellent | Poor |
| Report quality for engineers | Poor | Excellent |

---

## Final Recommendation

Use BDD when stakeholders are actively involved in writing and reading scenarios.
Do not use BDD just because it sounds more professional — the overhead is real.

Plain Playwright tests are not a lesser choice. For most technical teams, they are the
right choice. BDD is a specific tool for a specific context: cross-functional collaboration
where business language tests are valuable.

The best teams know when to use each. Many mature projects use both.

---

## Further Reading

- [01 — What is BDD](./01_what_is_bdd.md) — revisit the fundamentals
- [07 — POM Integration](./10_pom_integration.md) — how BDD and POM work together
- [10 — Reports](./14_reports.md) — Cucumber vs Playwright reports compared

---

*End of Cucumber BDD with Playwright — Notes Series*
