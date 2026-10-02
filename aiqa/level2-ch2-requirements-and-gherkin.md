# Level 2 — Chapter 2: Requirements Analysis & Test Case Design with Gherkin

## What This Chapter Is About

This chapter covers how to use AI to go from a requirement to a ready-to-use Gherkin feature file. It introduces ambiguity detection — one of the highest-value AI applications for QA that most people do not know about — and walks through Gherkin syntax, test case design formats, and the prompts that produce consistently useful output. All examples use the Veg Cart application.

---

## Why It Matters for QA

The most expensive bugs are not the ones found in testing. They are the ones that were built incorrectly from the start because the requirement was ambiguous. A QA engineer who can flag a broken requirement before development starts is worth more than one who finds the same broken feature during testing — because the cost of fixing it has just dropped by an order of magnitude.

AI makes requirement analysis faster and more systematic. You can give Claude a requirement and get back a structured analysis of what is missing, what is ambiguous, and what edge cases are not covered — in seconds. This chapter teaches you how.

---

## Requirements Analysis with AI

### Plain Explanation

Requirements analysis in the traditional QA model happens in planning — a QA engineer reads the requirement, asks clarifying questions, writes test cases, and hopes the gaps they identified are the right ones.

In the AI-assisted model, you give Claude the requirement and ask it to do the systematic analysis: flag undefined terms, identify missing acceptance criteria, surface edge cases the requirement does not cover, and detect contradictions. You review the analysis. You take the findings back to the product manager or business analyst before development starts.

This is not replacing QA judgement. It is augmenting it — a faster first pass that catches the obvious gaps so your review time focuses on the less obvious ones.

### Veg Cart Example

**The requirement as received:**
> "Users can apply a discount code at checkout. Valid codes give an appropriate discount. Invalid codes show an error."

**What this requirement leaves undefined:**
- What does "appropriate discount" mean? Is it a fixed percentage? A fixed amount? Variable?
- What is a "valid" code? How is validity determined?
- What is an "invalid" code? Wrong format? Expired? Already used? Doesn't exist?
- Can multiple codes be applied in the same order?
- Is there a minimum order value for a code to apply?
- What happens to the discount when items are removed from the cart after applying a code?
- Does the discount apply to delivery charges or only the subtotal?
- Can a code be applied after the order is confirmed?

**The requirement after AI analysis:**
Claude flags all of the above. You take the list to the product manager. They clarify: codes are 10% of the subtotal only, not delivery. One code per order. Codes cannot be stacked. Codes expire after 30 days. Used codes cannot be reused.

Now you have a testable requirement. This is the spec gate that separates Type 2 and Type 3 AI SDLC teams from Type 1 teams.

### The Ambiguity Detection Prompt

```
Act as a senior QA engineer reviewing a requirement for testability.

Requirement:
"[paste requirement here]"

Identify:
1. Terms that are ambiguous or have multiple possible interpretations
2. Acceptance criteria that are missing — scenarios the requirement does not address
3. Edge cases not covered — boundary conditions, error states, empty states
4. Questions a developer would reasonably ask before building this
5. Any contradictions with standard application behaviour or previously defined rules

Return as a numbered list under each of the five headings.
```

### QA Analogy

Imagine you are a new QA engineer on your first day. Your manager hands you a requirements document and says "write test cases for the coupon feature." Being new, you do not know what questions to ask. You write test cases for what is explicitly stated — the happy path and the obvious failures.

An experienced QA engineer reads the same requirement and immediately asks: "What counts as valid? What counts as invalid? Can you stack them? Does it apply to delivery?" They have seen enough features break in these ways to know the questions instinctively.

AI has read thousands of requirements and seen thousands of the ways features break. When you ask it to analyse a requirement, it applies the collective experience of those thousands of examples. It catches the questions an experienced QA engineer would ask — systematically, quickly, without forgetting one.

---

## The Requirement to Feature File Pipeline

Requirements do not go directly to automation. They go through a pipeline that ends with a Gherkin .feature file ready for Cucumber in Level 3.

```
Requirement
    ↓
Ambiguity Check (AI flags gaps → QA reviews → PM clarifies)
    ↓
Acceptance Criteria (explicit rules, agreed by stakeholders)
    ↓
Test Scenarios (tabular for Jira OR Gherkin for automation)
    ↓
.feature File (ready for Level 3 Cucumber BDD)
```

This pipeline is not a waterfall. It is a rapid loop — the whole thing can happen in under an hour for a well-scoped feature. The value is not in taking more time. It is in catching gaps before they become bugs.

---

## Test Case Design — Tabular vs Gherkin

### Tabular Format

**What it is:** Test cases structured as a table with columns for ID, scenario name, preconditions, steps, and expected result.

**When to use it:** When test cases will live in Jira, TestRail, or a similar tool. When stakeholders need to review and sign off on test coverage. When the tests will be executed manually.

**Veg Cart example:**

| ID | Scenario | Preconditions | Steps | Expected Result |
|---|---|---|---|---|
| TC-01 | Apply valid coupon SAVE10 | User logged in, cart has items totalling ₹500 | 1. Go to checkout. 2. Enter SAVE10 in coupon field. 3. Click Apply. | Coupon applied. Order total shows ₹450. Discount of ₹50 displayed. |
| TC-02 | Apply already-used coupon | SAVE10 has been used by this account previously | 1. Go to checkout. 2. Enter SAVE10. 3. Click Apply. | Error: "This coupon has already been used on your account." Total unchanged. |
| TC-03 | Apply expired coupon | Coupon EXPIRE30 expired 1 day ago | 1. Go to checkout. 2. Enter EXPIRE30. 3. Click Apply. | Error: "This coupon has expired." Total unchanged. |

**Prompt to generate a tabular test suite:**
```
Act as a senior QA engineer for the Veg Cart application.

Feature: Coupon code application at checkout
Rules:
- Codes give 10% discount on subtotal only (not delivery)
- One code per order, cannot stack
- Codes expire after 30 days
- Already-used codes cannot be reused
- Orders below ₹200 are not eligible

Write 10 test cases covering: happy path, expired code, already-used code,
invalid format, empty field, order below minimum, discount calculation accuracy,
and removing items after code is applied.

Return as a markdown table with columns:
ID | Scenario | Preconditions | Steps | Expected Result | Priority
```

### Gherkin Format

**What it is:** Test cases written in the Given/When/Then syntax of the Gherkin language, stored in `.feature` files, and connected to automation code in Cucumber.

**When to use it:** When test cases will be automated with Cucumber BDD (Level 3). When you want business-readable tests that developers and product managers can review. When you want tests that serve as both documentation and automation.

**Veg Cart example:**

```gherkin
Feature: Coupon Code Application at Veg Cart Checkout

  Background:
    Given I am logged in as a registered user
    And my cart contains items totalling more than ₹200

  Scenario: Apply a valid coupon code
    Given the coupon code "SAVE10" is valid and unused
    When I enter "SAVE10" in the coupon code field at checkout
    And I click the Apply button
    Then the coupon should be applied successfully
    And the subtotal should be reduced by 10%
    And the delivery charge should remain unchanged

  Scenario: Apply an already-used coupon code
    Given the coupon code "SAVE10" has already been used on my account
    When I enter "SAVE10" in the coupon code field at checkout
    And I click the Apply button
    Then I should see the error message "This coupon has already been used on your account"
    And the order total should remain unchanged

  Scenario Outline: Apply invalid coupon codes
    When I enter "<code>" in the coupon code field at checkout
    And I click the Apply button
    Then I should see the error message "<error>"

    Examples:
      | code       | error                          |
      | BADCODE    | This coupon code is not valid  |
      | EXPIRE30   | This coupon has expired        |
      |            | Please enter a coupon code     |
```

**Prompt to generate a Gherkin feature file:**
```
Act as a BDD practitioner writing Gherkin feature files for the Veg Cart application.

Feature: Coupon code application at checkout
Rules:
- Codes give 10% discount on subtotal only (not delivery)
- One code per order, cannot stack
- Codes expire after 30 days
- Already-used codes cannot be reused
- Orders below ₹200 are not eligible for coupons

Write a complete Gherkin .feature file covering:
- Successful coupon application with correct discount calculation
- Expired coupon
- Already-used coupon
- Invalid coupon code
- Empty coupon field
- Order below ₹200 minimum

Use Scenario Outline with Examples table where multiple data sets
apply to the same scenario structure. Include a Background for
common preconditions. Use specific error messages in Then steps.
```

### When to Use Each Format

| Use Case | Format |
|---|---|
| Jira test cases for manual execution | Tabular |
| Stakeholder review and sign-off | Tabular |
| Cucumber BDD automation (Level 3) | Gherkin |
| Developer-readable living documentation | Gherkin |
| Both manual and automated testing | Gherkin (can be executed manually as well) |
| The same test in both | Generate tabular first, convert to Gherkin second |

---

## Gherkin Syntax — Complete Reference

### The Building Blocks

**Feature:** The name of the feature being tested. One feature per file. Appears at the top.

```gherkin
Feature: Veg Cart Coupon Code Application
```

**Background:** Steps that run before every scenario in the file. Used for common preconditions that all scenarios share.

```gherkin
Background:
  Given I am logged in as a registered user
  And my cart contains at least one item
```

**Scenario:** A single test case. Has a name and a sequence of Given/When/Then steps.

```gherkin
Scenario: Successfully apply a valid coupon code
  Given the coupon "SAVE10" is valid and has not been used
  When I apply the coupon "SAVE10" at checkout
  Then the discount of 10% should be applied to the subtotal
```

**Scenario Outline:** A parametrised scenario — the same structure with different input data. Used when multiple test cases differ only in their data, not their steps.

```gherkin
Scenario Outline: Validate quantity limits when adding vegetables
  When I add <quantity> of <vegetable> to my cart
  Then I should see <result>

  Examples:
    | quantity | vegetable | result                    |
    | 1        | Carrot    | 1 carrot added to cart    |
    | 10       | Tomato    | 10 tomatoes added to cart |
    | 11       | Potato    | Error: maximum 10 per item |
    | 0        | Onion     | Error: quantity must be at least 1 |
```

### The Step Keywords

**Given:** Describes the state of the world before the action. This is the precondition.
```gherkin
Given I am on the Veg Cart checkout page
Given the coupon "SAVE10" is valid and unused
Given my cart contains 3 carrots and 2 tomatoes
```

**When:** Describes the action the user takes. This is the trigger.
```gherkin
When I enter "SAVE10" in the coupon field
When I click the Apply button
When I proceed to the payment step
```

**Then:** Describes the expected outcome. This is the assertion.
```gherkin
Then the coupon should be applied
Then the order total should show ₹450
Then I should see the error message "This coupon has expired"
```

**And / But:** Extend a Given, When, or Then when you need multiple steps of the same type. `And` continues the same direction; `But` introduces a contrast.

```gherkin
When I enter "SAVE10" in the coupon field
And I click the Apply button
Then the discount should be applied
And the new total should be ₹450
But the delivery charge should not be discounted
```

### QA Analogy

Given/When/Then maps directly to how experienced QA engineers mentally structure test cases, even when they do not use the Gherkin format:

- **Given** = Precondition — the state before the action. "The user is logged in and has items in the cart."
- **When** = Action — the thing the user does. "The user applies the coupon code SAVE10."
- **Then** = Expected result — what should happen. "The 10% discount should appear on the subtotal."

You have been writing these three parts mentally your entire QA career. Gherkin simply gives them a formal structure that both humans and test automation tools can read.

---

## Reviewing AI-Generated Gherkin

### Common AI Mistakes in Gherkin — What to Look For

AI-generated Gherkin looks clean and correct most of the time. But there are specific mistakes to watch for:

**1. Generic scenario names**

Wrong: `Scenario: Test coupon application`
Right: `Scenario: Apply a valid 10% discount coupon to an eligible order`

The scenario name should describe what is being tested, not just that something is being tested.

**2. Vague Then steps**

Wrong: `Then the page should update`
Right: `Then the order total should show ₹450 and the coupon badge "SAVE10" should be displayed`

Then steps must be specific enough to be automatable. "The page updates" cannot be turned into an assertion. "The order total shows ₹450" can.

**3. Happy-path bias**

AI tends to generate more positive scenarios than negative ones. Always count your negative scenarios. For every "successfully applies" there should be at least one "fails when" — ideally several.

**4. Missing boundary values**

AI generates obvious test data but often misses boundary values. For the 10-item quantity limit: AI generates `quantity = 5` (valid) and `quantity = 15` (invalid). A QA engineer adds `quantity = 10` (exact boundary — valid) and `quantity = 11` (one over — invalid).

**5. Over-specific UI references in steps**

Wrong: `When I click the green "Apply Coupon" button in the checkout sidebar`
Right: `When I apply the coupon code "SAVE10"`

Step definitions should describe behaviour, not UI implementation. UI changes should not break your Gherkin steps.

### The Review Checklist

After generating Gherkin with AI, run through this before accepting:

- [ ] Does every scenario have a specific, descriptive name?
- [ ] Are all Then steps specific enough to become assertions?
- [ ] Are there negative scenarios for every positive scenario?
- [ ] Are boundary values explicitly tested?
- [ ] Is there a test for the empty/null state?
- [ ] Are steps written as behaviour (what the user does) rather than UI implementation (which button)?
- [ ] Does the Scenario Outline cover all the data combinations that matter?
- [ ] Is the Background correct — do all scenarios actually need those preconditions?

---

## Practice Tasks

### Task 1 — Ambiguity detection
Take this requirement from Veg Cart:

> "Users can add vegetables to their cart. The maximum quantity per vegetable type is 10. Users can update quantities in the cart."

Run it through the ambiguity detection prompt from this chapter. Review the gaps AI identifies. Which ones would you have caught yourself? Which ones surprised you?

### Task 2 — Generate tabular test cases
Using the coupon rules from this chapter, generate a tabular test suite with the prompt provided. Review the output:
- Map each test case to a specific rule
- Identify any rules with no test case
- Identify any duplicate scenarios
- Add at least 2 scenarios that AI missed

### Task 3 — Generate a Gherkin feature file
Using the coupon rules, generate a Gherkin .feature file using the prompt provided. Apply the review checklist above. Fix at least 3 issues from the checklist.

### Task 4 — Requirement to feature file pipeline
Take a real requirement from your current project. Run it through the full pipeline:
1. Ambiguity detection → list of gaps
2. Share gaps with the requirement owner (or answer them yourself based on your knowledge)
3. Generate tabular test cases
4. Convert to Gherkin .feature file

Save the .feature file in your Veg Cart project's `/features/` folder.

---

## Key Takeaways

- Ambiguity detection is one of the highest-value AI applications for QA — catching undefined terms and missing acceptance criteria before development starts
- The requirement-to-feature-file pipeline has five stages: Requirement → Ambiguity Check → Acceptance Criteria → Test Scenarios → .feature File
- Tabular format is for Jira and manual execution; Gherkin format is for Cucumber BDD automation and business-readable documentation
- The four Gherkin building blocks are Feature, Background, Scenario, and Scenario Outline
- Given = precondition, When = action, Then = expected result — you have been writing these mentally your whole QA career
- Common AI mistakes in Gherkin: generic scenario names, vague Then steps, happy-path bias, missing boundary values, and over-specific UI references
- Always review AI-generated Gherkin with the checklist before accepting it — well-structured does not mean well-covered
- The .feature files you generate in Level 2 are the exact input files Cucumber BDD uses in Level 3 — you are building the foundation now

---

## Common Questions

**Q: Do I need to know how to write Gherkin before using AI to generate it?**

A: No — but understanding the syntax makes you a much better reviewer of what AI generates. This chapter gives you that understanding. Once you can read Gherkin fluently, you can spot AI mistakes that would otherwise slip through.

**Q: Can I generate Gherkin for features that are already built and in production?**

A: Yes — and this is one of the most valuable uses. If your existing features have no automated tests, generating Gherkin from the existing behaviour is the fastest way to build coverage. Give Claude a description of how the feature currently works and ask it to generate .feature files. In Level 3, these feed directly into Cucumber automation.

**Q: What if the product manager will not answer the ambiguity questions?**

A: Document your assumptions explicitly in the test cases: "This test assumes that used coupons cannot be reused — to be confirmed." When the assumption turns out to be wrong (and it will), you have a record of what was assumed and when. This protects you professionally and creates a paper trail for requirements drift.

**Q: How specific should the Examples table in a Scenario Outline be?**

A: Specific enough to cover the distinct equivalence classes, boundaries, and notable edge cases. You do not need exhaustive combinations — you need the combinations that represent different behaviour. For a quantity field with a max of 10: test 1 (minimum), 5 (valid mid-range), 10 (exact boundary), 11 (one over boundary), and 0 or negative (invalid). Five rows covers the meaningful scenarios.

**Q: The AI generated 15 scenarios for a simple feature. Is that too many?**

A: Check the scenarios for duplicates — AI often generates near-duplicates that differ only in minor wording. Remove true duplicates. For genuine distinct scenarios, more coverage is generally better, but only if each scenario tests something the others do not. A useful metric: can you point to a specific rule or behaviour that each scenario validates? If not, the scenario might be redundant.
