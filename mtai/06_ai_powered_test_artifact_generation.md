# Chapter 6: AI-Powered Test Artifact Generation

## Scenario Generation with AI
A **Scenario** is a high-level description of a test (e.g., "User buys a product"). A **Test Case** is the step-by-step detail.
*   **The AI Advantage**: AI is excellent at expansion. You give it 1 seed idea ("Buy Product") and ask for variations ("Buy with coupon," "Buy as guest," "Buy with expired card").
*   **Scenario Matrix**: You can ask AI to generate a matrix crossing User Roles (Admin, User, Guest) with Actions (View, Edit, Delete) to ensure you don't miss any permission combination.

## Test Case Generation with AI
*   **Happy Path**: The sunny day scenarios. AI generates these easily.
*   **Negative Path**: The rainy days. AI is creative here. "What if the internet cuts out during payment?"
*   **Edge Cases**: "What if the user enters 1 million characters in the comment box?"

**The "Self-Reference" Technique**:
Feed the AI its own output.
1.  "Generate 10 test cases."
2.  "Now review these 10 cases. Are any redundant? Are any missing? Critique your work."
3.  "Generate the final list based on your critique."

## Test Data Generation with AI
Historical problem: Using real customer data is a privacy risk (GDPR/HIPAA). Creating fake data manually is boring (John Doe 1, John Doe 2...).
*   **GenAI Solution**: "Generate 50 fictitious patient records. Detailed JSON format. Include realistic names, varied addresses, valid ICD-10 medical codes, and ensure no personally identifiable information (PII) matches real people."
*   **Benefits**: Instant, unlimited, compliant, and structurally correct data.

## Documentation Generation with AI
*   **Test Strategy**: Getting started on a new project? Ask AI: "Draft a Test Strategy for a Mobile Banking App focus on security and performance." It gives you a template you can just fill in.
*   **RTM (Requirement Traceability Matrix)**: "Map these 5 User Stories to these 20 Test Cases in a table."

## API Testing using GenAI & MCP (NO CODE)
Traditionally, API testing required knowing Postman or coding in RestAssured.
*   **The GenAI Shift**: You can now test APIs using Natural Language.
    *   *Input*: "Here is the Swagger/OpenAPI documentation."
    *   *Prompt*: "Test the 'Create User' endpoint. First run a successful creation. Then try to create a user with a missing email. Then try with a duplicate username."
    *   *Mechanism*: The MCP agent makes the HTTP calls for you, analyzes the JSON response, and tells you: "Test Failed. Expected 400 Bad Request but got 500 Internal Server Error."
*   **Democratization**: This allows Manual Testers to perform comprehensive API testing without writing a single line of code.

**Analogy: The Universal Fabricator**
*   **Manual**: Making a chair by hand (carving wood, sewing cushion).
*   **AI generation**: Star Trek Replicator. "Computer, create a chair, Victorian style, red velvet." It appears. Your job is to sit in it and check if it wobbles (Validation).

---

## Acceptance Criteria Generation

Vague user stories produce vague tests. AI can transform rough stories into tight acceptance criteria.

**Prompt Template**:
```
You are a Business Analyst and QA expert.
Here is a user story: "[As a registered user, I want to reset my password so that I can regain access if I forget it.]"
Generate detailed Acceptance Criteria using the Given/When/Then format.
Cover: happy path, alternative flows, error conditions, security requirements, and edge cases.
```

**Sample Output Structure**:
*   **Scenario 1 (Happy Path)**: Given a registered account, when the user requests a reset link, then a time-limited link is sent to the registered email within 60 seconds.
*   **Scenario 2 (Expired Link)**: Given a reset link older than 24 hours, when the user clicks it, then an "expired" message is shown and no password change is permitted.
*   **Scenario 3 (Unknown Email)**: Given an unregistered email address, when a reset is requested, then the system responds with a generic message (preventing email enumeration).
*   **Scenario 4 (Reuse)**: Given a used reset link, when visited again, then the link is invalidated.

**HITL Check**: AI may miss security-sensitive acceptance criteria (like the generic response to prevent email enumeration). A human with security awareness adds these.

---

## Gherkin / BDD Feature File Generation

BDD (Behavior-Driven Development) bridges the gap between business requirements and automated tests.

**Structure of a Feature File**:
```gherkin
Feature: [Feature Name]
  As a [role]
  I want [feature]
  So that [benefit]

  Background:
    Given [common precondition for all scenarios]

  Scenario: [Happy Path name]
    Given [initial state]
    When [action]
    Then [expected result]

  Scenario Outline: [Data-driven scenario name]
    Given I am on the login page
    When I enter "<username>" and "<password>"
    Then I should see "<result>"

    Examples:
      | username        | password    | result         |
      | valid@email.com | correctPass | Dashboard page |
      | valid@email.com | wrongPass   | Error message  |
      | invalid         | any         | Validation error |
```

**AI Workflow**:
1.  Prompt: "Convert this acceptance criteria to a Gherkin feature file."
2.  AI generates the `.feature` file.
3.  HITL: Review that each `Then` maps to a specific, testable assertion.
4.  Import into Cucumber / BDD framework.

---

## Requirements Traceability Matrix (RTM) Generation

An RTM maps every requirement to its test cases. Manually building one is tedious — AI does it in seconds.

**Prompt**:
```
Here are my requirements:
REQ-101: User can log in with email and password.
REQ-102: System locks account after 5 failed login attempts.
REQ-103: User can reset password via email.

Here are my test case IDs and descriptions:
TC-001: Login with valid credentials.
TC-002: Login with incorrect password.
TC-003: Login with empty email field.
TC-004: 5th consecutive failed login locks account.
TC-005: 6th attempt on locked account shows locked message.
TC-006: Reset password - valid email.
TC-007: Reset password - unregistered email.
TC-008: Reset link expires after 24 hours.

Generate a Requirements Traceability Matrix table:
Columns: Requirement ID | Requirement Description | Linked Test Case IDs | Coverage Status
Flag any requirements with zero test cases.
```

---

## Test Execution Reports (AI-Assisted)

After test execution, AI can transform raw numbers into narrative reports.

**Input to AI**:
```
Here is my test execution data for Sprint 14:
Stories in scope: 8
Test cases: 62 written, 58 executed, 0 not run, 4 blocked
Results: 48 passed, 10 failed
Bugs raised: 12 (2 Critical, 4 High, 5 Medium, 1 Low)
Bugs resolved: 8. Still open: 4 (0 Critical, 1 High, 3 Medium)
Blocked reason: Test environment for payment gateway was unavailable.

Generate a Test Execution Report with:
1. Executive summary (2-3 sentences for stakeholders)
2. Test coverage table
3. Defect summary table
4. Blocked items and impact
5. Go/No-Go recommendation with rationale
```

---

## Release Notes Generation

Release notes communicate *what changed* to end users and stakeholders.

**Prompt**:
```
Based on these Sprint 14 user stories and bug fixes:

Stories completed:
- Password reset via email (PROJ-201)
- Multi-currency support (PROJ-202)

Bugs fixed:
- Cart total incorrect with discount code (BUG-445)
- Search results missing on Safari (BUG-448)

Generate Release Notes for:
1. Technical audience (developers/ops) — include story IDs.
2. End-user audience — plain language, no jargon.
```

---

## Risk Assessment Matrix Generation

**Prompt**:
```
I am testing a Payments module in an E-Commerce application.
Features included: Credit card payment, PayPal, gift card redemption, order cancellation refund.

Generate a Risk Assessment Matrix with:
- Module/Feature
- Identified Risk
- Probability (High/Medium/Low)
- Business Impact (High/Medium/Low)
- Overall Risk Rating
- Mitigation / Testing Focus

Output as a table sorted by overall risk rating descending.
```

---

## Complete Artifact Generation Workflow Example

Here is an end-to-end workflow using AI to generate *all* artifacts for a single user story:

**Input**: User Story — "As a registered customer, I want to add items to a wishlist so I can save them for later."

| Step | AI Task | Human Review |
|------|---------|-------------|
| 1 | Generate detailed acceptance criteria | Check business rules are complete and correct |
| 2 | Generate Gherkin feature file from criteria | Verify Then clauses are specific and testable |
| 3 | Generate full test suite (happy + negative + edge) | Remove duplicates; add any missed edge cases |
| 4 | Generate 20 rows of test data (user types, product types) | Verify data is realistic and covers key partitions |
| 5 | Update RTM to include new test cases | Check all criteria have at least 1 test case |
| 6 | After execution: generate defect-free execution report | Sign off on Go/No-Go |

**Time comparison**:
*   Manual only: ~6–8 hours
*   AI-assisted + HITL review: ~1.5–2 hours
*   Time savings: ~70% — and the human spend is all on *judgment*, not data entry.
