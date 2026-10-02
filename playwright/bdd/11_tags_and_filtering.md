# 08 — Tags and Filtering

## What Are Tags?

Tags are labels you attach to scenarios or entire features. They let you run a subset of your
tests — for example, only smoke tests, or everything except slow tests.

Tags start with `@`.

```gherkin
@smoke
Scenario: Successful login
  Given I am on the login page
  When I log in with valid credentials
  Then I should see the dashboard
```

---

## Where to Put Tags

### On a Scenario

```gherkin
@smoke
Scenario: Successful login
  ...

@regression
Scenario: Login with wrong password
  ...
```

### On a Feature

Tagging a feature applies the tag to every scenario inside it.

```gherkin
@login
Feature: Login to OrangeHRM

  Scenario: Successful login
    ...

  Scenario: Login with invalid credentials
    ...
```

Both scenarios above are tagged `@login`.

### On a Scenario Outline — Examples Row

You can tag individual rows in an `Examples` table.

```gherkin
Scenario Outline: Login validation
  Given I am on the login page
  When I enter username "<username>" and password "<password>"
  Then I should see the message "<message>"

  Examples:
    | username | password  | message              |
    | Admin    | admin123  | Welcome              |

  @negative
  Examples:
    | username | password  | message              |
    |          | admin123  | Required             |
    | Admin    |           | Required             |
```

Only the rows in the `@negative` examples block get that tag.

### Multiple Tags

A scenario can have multiple tags.

```gherkin
@smoke @authenticated @employee
Scenario: Search for an employee
  ...
```

---

## Running Tests by Tag

### Run a single tag

```bash
npx cucumber-js --tags @smoke
```

### Run either tag

```bash
npx cucumber-js --tags "@smoke or @regression"
```

### Run both tags (scenario must have both)

```bash
npx cucumber-js --tags "@smoke and @authenticated"
```

### Exclude a tag

```bash
npx cucumber-js --tags "not @slow"
```

### Complex expressions

```bash
npx cucumber-js --tags "(@smoke or @regression) and not @wip"
```

---

## Common Tag Conventions

| Tag | Meaning |
|---|---|
| `@smoke` | Critical path tests — fast, run on every commit |
| `@regression` | Full regression suite — run before releases |
| `@wip` | Work in progress — skip in CI |
| `@slow` | Tests that take a long time — run overnight |
| `@authenticated` | Scenarios that need a logged-in user |
| `@negative` | Tests for error conditions |
| `@api` | Tests that call APIs |
| `@ui` | UI-only tests |

Your team may define different tags. The important thing is that everyone agrees on what
each tag means and uses them consistently.

---

## Tags in package.json Scripts

Add tag-filtered commands to your `package.json` so your team can run them easily.

```json
{
  "scripts": {
    "test:bdd": "cucumber-js",
    "test:smoke": "cucumber-js --tags @smoke",
    "test:regression": "cucumber-js --tags @regression",
    "test:ci": "cucumber-js --tags 'not @wip and not @slow'",
    "test:wip": "cucumber-js --tags @wip"
  }
}
```

Run smoke tests:
```bash
npm run test:smoke
```

Run all tests except work-in-progress and slow:
```bash
npm run test:ci
```

---

## Tags in CI/CD

In a CI pipeline you typically run only smoke tests on every push, and the full regression
suite overnight or before releases.

```yaml
# Example GitHub Actions step
- name: Run smoke tests
  run: npx cucumber-js --tags @smoke

- name: Run regression suite (nightly)
  run: npx cucumber-js --tags @regression
```

---

## Tagged Hooks

You can also use tags to control which hook runs for which scenario.
This is covered in `06_hooks.md` but here is a reminder:

```typescript
// Only runs before @authenticated scenarios
Before({ tags: '@authenticated' }, async function(this: PlaywrightWorld) {
  await this.page.goto('/auth/login');
  await this.page.getByPlaceholder('Username').fill('Admin');
  await this.page.getByPlaceholder('Password').fill('admin123');
  await this.page.getByRole('button', { name: 'Login' }).click();
});
```

---

## Tagging Strategy

A good tagging strategy answers these questions:

1. What runs on every commit? → `@smoke`
2. What runs before a release? → `@regression`
3. What should CI skip? → `@wip`, `@slow`
4. What needs special setup? → `@authenticated`, `@api`

Keep tags simple. A scenario with 5 or more tags is hard to manage. Two or three tags
per scenario is usually enough.

---

## Summary

- Tags are labels starting with `@` applied to scenarios or features
- Tags let you run a subset of tests — smoke, regression, etc.
- Use `--tags` flag with `and`, `or`, `not` for filtering
- Add tag-filtered scripts to `package.json`
- Use tagged hooks to run setup only for tagged scenarios
- Keep your tag vocabulary small and agreed across the team

Next: [09 — Scenario Outline](./12_scenario_outline.md)
