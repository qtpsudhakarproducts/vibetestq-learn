# 02 — Gherkin Syntax

## What is Gherkin?

Gherkin is the language used to write BDD feature files. It uses plain English with a small
set of keywords. Gherkin is designed to be readable by anyone — not just developers.

Feature files use the `.feature` extension. Every `.feature` file contains one Feature and one
or more Scenarios.

---

## Feature

The `Feature` keyword starts every feature file. It names the feature and gives a short
description of its business purpose.

```gherkin
Feature: Login to OrangeHRM
  As an HR Manager
  I want to log in to OrangeHRM
  So that I can manage employee information
```

The three lines after `Feature:` follow the **User Story** format:
- `As a` — who the user is
- `I want to` — what they want to do
- `So that` — the business reason

This is optional but highly recommended. It helps readers understand the purpose of the feature.

---

## Scenario

A `Scenario` is a single test case. It has a title and a series of steps.

```gherkin
Scenario: Successful login with valid credentials
  Given I am on the OrangeHRM login page
  When I enter username "Admin" and password "admin123"
  And I click the login button
  Then I should see the dashboard
```

Each line in a scenario is a **step**. Steps start with `Given`, `When`, `Then`, `And`, or `But`.

---

## The Core Keywords

### Given
Sets up the starting state. Describes the context before the action happens.

```gherkin
Given I am on the OrangeHRM login page
Given the employee "John Smith" exists in the system
Given I am logged in as admin
```

### When
Describes the action the user takes.

```gherkin
When I enter username "Admin" and password "admin123"
When I click the login button
When I search for employee "John Smith"
```

### Then
Describes the expected outcome. This is where assertions live.

```gherkin
Then I should see the dashboard
Then I should see the error message "Invalid credentials"
Then the employee list should show 5 results
```

### And
Continues the previous step type. Avoids repeating Given / When / Then.

```gherkin
Given I am on the login page
And the system is available          ← another Given

When I enter my username
And I enter my password              ← another When
And I click the login button         ← another When

Then I should see the dashboard
And I should see my name in the header  ← another Then
```

### But
Same as `And` — used to add a contrasting condition.

```gherkin
Then I should see the dashboard
But I should not see the admin panel
```

---

## Background

`Background` runs the same steps before every scenario in the feature file. Use it to
avoid repeating common setup steps.

```gherkin
Feature: Employee Management

  Background:
    Given I am on the OrangeHRM login page
    And I log in with username "Admin" and password "admin123"
    And I navigate to the employee list

  Scenario: Search by name
    When I search for "Linda Anderson"
    Then I should see 1 result

  Scenario: Reset search
    When I click the Reset button
    Then I should see more than 5 results
```

`Background` steps run before each scenario — not just once. Think of it like `beforeEach`.

---

## Scenario Outline

`Scenario Outline` lets you run the same scenario with multiple sets of data.
Use `<placeholders>` in the steps and provide values in the `Examples` table.

```gherkin
Scenario Outline: Login validation for empty fields
  Given I am on the OrangeHRM login page
  When I enter username "<username>" and password "<password>"
  And I click the login button
  Then I should see the validation message "Required"

  Examples:
    | username | password  |
    |          | admin123  |
    | Admin    |           |
    |          |           |
```

Cucumber runs this scenario three times — once for each row in the `Examples` table.
Column headers in the table match the `<placeholder>` names in the steps.

---

## Tags

Tags let you mark scenarios with labels. You can then run only the tagged scenarios.

```gherkin
Feature: Login

  @smoke
  Scenario: Successful login
    Given I am on the login page
    When I log in with valid credentials
    Then I should see the dashboard

  @regression
  Scenario: Login with wrong password
    Given I am on the login page
    When I enter an incorrect password
    Then I should see an error message
```

Tags can be applied to:
- A single scenario
- An entire feature (applies to all scenarios in the file)
- An `Examples` table row in a `Scenario Outline`

Run only smoke tests:
```bash
npx cucumber-js --tags @smoke
```

Run smoke and regression but not slow:
```bash
npx cucumber-js --tags "@smoke or @regression"
npx cucumber-js --tags "not @slow"
```

---

## Comments

Add comments with `#`. Comments are ignored by Cucumber.

```gherkin
# This scenario was added after the bug report in sprint 12
Scenario: Login with expired session
  Given my session has expired
  When I try to access the dashboard
  Then I should be redirected to the login page
```

---

## String Parameters

Use double quotes in steps to pass string values to step definitions.

```gherkin
When I enter username "Admin" and password "admin123"
Then I should see the error message "Invalid credentials"
```

In the step definition, `{string}` captures these values:

```typescript
When('I enter username {string} and password {string}', async function(username, password) {
  // username = "Admin", password = "admin123"
});
```

---

## Number Parameters

Use `{int}` or `{float}` for numeric values.

```gherkin
When I add 3 employees to the list
Then I should see 3 results
```

```typescript
When('I add {int} employees to the list', async function(count: number) {
  // count = 3
});
```

---

## Doc Strings

Use triple quotes to pass multi-line text to a step.

```gherkin
When I send the following message:
  """
  Hello,
  Please approve my leave request.
  Thanks
  """
```

---

## Data Tables

Pass a table of data to a step.

```gherkin
When I add the following employees:
  | firstName | lastName | jobTitle     |
  | John      | Smith    | QA Engineer  |
  | Jane      | Doe      | Developer    |
```

---

## Feature File Structure

A complete, well-structured feature file looks like this:

```gherkin
Feature: Login to OrangeHRM
  As an HR Manager
  I want to log in to OrangeHRM
  So that I can manage employee information

  Background:
    Given I am on the OrangeHRM login page

  @smoke
  Scenario: Successful admin login
    When I enter username "Admin" and password "admin123"
    And I click the login button
    Then I should be on the dashboard
    And I should see the welcome message

  @regression
  Scenario: Login with invalid credentials
    When I enter username "Admin" and password "wrongpassword"
    And I click the login button
    Then I should see the error message "Invalid credentials"

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

## Summary

| Keyword | Purpose |
|---|---|
| `Feature` | Names the feature and its business purpose |
| `Background` | Steps that run before every scenario in the file |
| `Scenario` | A single test case |
| `Scenario Outline` | A data-driven scenario with an Examples table |
| `Given` | Sets up starting state |
| `When` | Describes the user action |
| `Then` | Describes the expected outcome |
| `And` / `But` | Continues the previous step type |
| `@tag` | Labels a scenario for filtering |
| `Examples` | Data table for Scenario Outline |

Next: [03 — Project Setup](./03_project_setup.md)
