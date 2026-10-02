# 09 — Scenario Outline and Data-Driven BDD

## The Problem: Repeated Scenarios

Sometimes you need to test the same behaviour with multiple sets of data.
Without `Scenario Outline`, you would write this:

```gherkin
Scenario: Login with empty username
  Given I am on the login page
  When I enter username "" and password "admin123"
  And I click the login button
  Then I should see the validation message "Required"

Scenario: Login with empty password
  Given I am on the login page
  When I enter username "Admin" and password ""
  And I click the login button
  Then I should see the validation message "Required"

Scenario: Login with both fields empty
  Given I am on the login page
  When I enter username "" and password ""
  And I click the login button
  Then I should see the validation message "Required"
```

Three scenarios with identical structure and only the data changing. This is repetition.
`Scenario Outline` removes that repetition.

---

## Scenario Outline — The Solution

```gherkin
Scenario Outline: Login validation for empty fields
  Given I am on the login page
  When I enter username "<username>" and password "<password>"
  And I click the login button
  Then I should see the validation message "Required"

  Examples:
    | username | password  |
    |          | admin123  |
    | Admin    |           |
    |          |           |
```

Cucumber runs this scenario three times — once per row in the `Examples` table.

On the first run: `username = ""`, `password = "admin123"`
On the second run: `username = "Admin"`, `password = ""`
On the third run: `username = ""`, `password = ""`

---

## How Placeholders Work

Inside a `Scenario Outline`, wrap column names in angle brackets: `<columnName>`.

The column header in the `Examples` table must exactly match the placeholder name.

```gherkin
Scenario Outline: Search for employee by job title
  Given I am logged in as admin
  When I filter the employee list by job title "<jobTitle>"
  Then I should see the employee "<employeeName>"

  Examples:
    | jobTitle     | employeeName    |
    | QA Engineer  | Linda Anderson  |
    | Developer    | Peter Wilson    |
    | Manager      | John Smith      |
```

Step definitions do not change. They already use `{string}` to capture the step value.
Cucumber substitutes the table value into the step before matching.

---

## Step Definitions for Scenario Outline

Step definitions are exactly the same as for regular scenarios. Cucumber handles the
substitution automatically.

```typescript
When('I filter the employee list by job title {string}', async function(
  this: PlaywrightWorld,
  jobTitle: string
) {
  await this.employeePage.filterByJobTitle(jobTitle);
});

Then('I should see the employee {string}', async function(
  this: PlaywrightWorld,
  employeeName: string
) {
  await this.employeePage.verifyEmployeeVisible(employeeName);
});
```

These step definitions work for all three rows in the `Examples` table.

---

## Multiple Examples Blocks

A `Scenario Outline` can have multiple `Examples` blocks. Use this to group data
by category or to apply different tags.

```gherkin
Scenario Outline: Login behaviour
  Given I am on the login page
  When I enter username "<username>" and password "<password>"
  And I click the login button
  Then I should see "<result>"

  @smoke
  Examples: Valid credentials
    | username | password  | result         |
    | Admin    | admin123  | Welcome Admin  |

  @regression
  Examples: Invalid credentials
    | username | password      | result               |
    | Admin    | wrongpassword | Invalid credentials  |
    | unknown  | admin123      | Invalid credentials  |

  @regression
  Examples: Empty fields
    | username | password | result   |
    |          | admin123 | Required |
    | Admin    |          | Required |
```

Cucumber runs each `Examples` block as a separate set of scenarios.
The `@smoke` tag applies only to the first block.

---

## Scenario Outline with Complex Data

You can put any text in an `Examples` table — including URLs, numbers, and multi-word values.

```gherkin
Scenario Outline: Leave request filter by type
  Given I am on the leave list page
  When I filter by leave type "<leaveType>"
  And I filter by year "<year>"
  Then the results should only show "<leaveType>" leave

  Examples:
    | leaveType         | year |
    | Annual            | 2024 |
    | Casual            | 2024 |
    | Medical           | 2023 |
    | Maternity         | 2023 |
```

---

## Scenario Outline vs Multiple Scenarios — When to Use Each

### Use Scenario Outline when:
- The same steps repeat with different data
- There are 3 or more data combinations
- The data variations have a clear pattern (valid/invalid, different roles, different inputs)

### Use separate Scenarios when:
- Each scenario has a meaningfully different story
- The scenarios need different tags
- The data does not fit a simple table (different step sequences per case)

```gherkin
# GOOD use of Scenario Outline — same flow, different data
Scenario Outline: Add employee with different job titles
  Given I am logged in as admin
  When I add employee "Test User" with job title "<jobTitle>"
  Then the employee should be saved with job title "<jobTitle>"

  Examples:
    | jobTitle    |
    | QA Engineer |
    | Developer   |
    | Manager     |

# NOT a good fit — different flows, just using Outline to avoid repeating the name
# Better as two separate scenarios with descriptive names
Scenario: Admin can delete an employee
  ...

Scenario: Admin cannot delete themselves
  ...
```

---

## Real Example: OrangeHRM Login Validation

```gherkin
Feature: Login Validation

  Background:
    Given I am on the OrangeHRM login page

  @smoke
  Scenario: Successful admin login
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should be on the dashboard

  @regression
  Scenario Outline: Login with invalid credentials
    When I enter username "<username>" and password "<password>"
    And I click the login button
    Then I should see the error message "<errorMessage>"

    Examples:
      | username | password      | errorMessage        |
      | Admin    | wrongpassword | Invalid credentials |
      | invalid  | admin123      | Invalid credentials |
      | Admin    | wrong123      | Invalid credentials |

  @regression
  Scenario Outline: Login validation for empty fields
    When I enter username "<username>" and password "<password>"
    And I click the login button
    Then I should see the validation message "Required"

    Examples:
      | username | password  |
      |          | admin123  |
      | Admin    |           |
      |          |           |
```

---

## Scenario Outline in Reports

In the Cucumber HTML report, each row in the `Examples` table appears as a separate
scenario with the data values in the scenario title.

```
Scenario Outline: Login with invalid credentials
  ✓  Admin / wrongpassword / Invalid credentials
  ✓  invalid / admin123 / Invalid credentials
  ✗  Admin / wrong123 / Invalid credentials   ← this row failed
```

This makes it easy to see exactly which data combination failed.

---

## Summary

- `Scenario Outline` removes repetition when the same steps run with different data
- Use `<placeholder>` in steps and provide values in the `Examples` table
- Step definitions do not change — they already use `{string}`, `{int}` etc.
- Multiple `Examples` blocks let you group data and apply different tags
- Use `Scenario Outline` for 3+ data combinations with the same step flow
- Use separate `Scenario` blocks when each case has a different story

Next: [10 — Reports](./14_reports.md)
