# 01 — What is BDD?

## The Problem BDD Solves

A developer writes code. A tester writes tests. A business analyst writes requirements.
These three people often work from three different documents. The tests may not match the
requirements. The code may not match what the business wanted. Bugs appear — not because
someone wrote bad code, but because people misunderstood each other.

BDD — Behaviour Driven Development — exists to close that gap.

---

## What BDD Is

BDD is a way of writing tests in plain English so that everyone on the team — developers,
testers, and business stakeholders — can read them and agree on what the system should do.

The tests are called **scenarios**. They are written in a format called **Gherkin**.
Gherkin uses three keywords to describe behaviour:

- **Given** — the starting state
- **When** — the action taken
- **Then** — the expected result

Here is a simple example:

```gherkin
Scenario: Successful login with valid credentials
  Given I am on the OrangeHRM login page
  When I enter username "Admin" and password "admin123"
  And I click the login button
  Then I should see the dashboard
```

A business analyst can read this. A tester can run this. A developer can implement against this.
That is the core idea of BDD.

---

## BDD Is a Communication Tool First

Many teams make the mistake of treating BDD as just another test framework. It is not.

BDD is a **collaboration technique**. The feature files written in Gherkin are the output of
conversations between business, development, and testing. They represent shared understanding —
not just test scripts.

If you write Gherkin scenarios without involving business stakeholders, you lose most of the value.

---

## BDD Is NOT a Replacement for POM

BDD sits **on top of** your existing Page Object Model. It does not replace it.

```
Business Stakeholder
       ↓
Gherkin Feature File (what to test)
       ↓
Step Definitions (connects Gherkin to code)
       ↓
Page Object Model (how to interact with the UI)
       ↓
Playwright (browser automation)
```

Your POM classes stay exactly as they are. Step definitions call your POM methods.
Gherkin describes the business scenario. These are three separate layers.

---

## When BDD Adds Value

BDD adds value when:

- Business stakeholders actively read and review the feature files
- Requirements come from conversations, not documents
- The team wants living documentation — tests that are also specs
- Non-technical people need to understand what is being tested

BDD adds less value when:

- The team is small and all technical
- Stakeholders will never read the feature files
- Tests need to be written quickly without collaboration meetings

---

## The Three Amigos

A key BDD practice is called the **Three Amigos meeting**. Three people come together before
development starts:

1. **Business** — defines what the system should do
2. **Developer** — identifies what to build
3. **Tester** — identifies edge cases and missing scenarios

Together they write the Gherkin scenarios. This shared writing session is where most of
the value of BDD comes from — not from running the tests themselves.

---

## Key Terms

| Term | Meaning |
|---|---|
| BDD | Behaviour Driven Development — a collaboration technique using plain-language tests |
| Gherkin | The plain-English language used to write BDD scenarios |
| Feature file | A `.feature` file containing one or more Gherkin scenarios |
| Scenario | A single test case written in Gherkin |
| Step | One line in a scenario — Given, When, Then, And, But |
| Step Definition | The TypeScript code that runs when a step is executed |
| Cucumber | The test runner that reads feature files and executes step definitions |

---

## Summary

- BDD is a way to write tests that everyone on the team can read and understand
- Gherkin uses Given / When / Then to describe behaviour
- BDD is a communication tool, not just a testing framework
- BDD sits on top of POM — it does not replace it
- The most value comes from writing scenarios together with business stakeholders

Next: [02 — Gherkin Syntax](./02_gherkin_syntax.md)
