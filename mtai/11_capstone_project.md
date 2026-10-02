# Chapter 10: Capstone Project

## Capstone Overview
The Capstone is your "Proof of Mastery." It is a comprehensive project where you apply everything: Manual Testing + AI Generation + HITL validation.

## Scenario Selection
Choose a domain rich in logic:
1.  **E-Commerce**: Product search, Cart, Checkout, Payments, Returns.
2.  **Banking**: Account creation, Transfer funds (Domestic/International), Bill Pay.
3.  **Healthcare**: Patient registration, Appointment booking, Insurance claims.

*Recommendation*: Choose **E-Commerce** if fresh, **Banking** if experienced (more complex rules).

## Project Phases & Workflow

### Phase 1: Planning (Day 1)
*   **Input**: High-level requirements (e.g., "Build a Shopping Cart").
*   **AI Task**: "Generate a generic Test Strategy for an E-com Cart."
*   **HITL**: Customize it. Add "Browser Compatibility" and "Mobile Responsiveness."

### Phase 2: Design (Day 2)
*   **AI Task**: "Create a Scenario Matrix for Checkout Process (Guest, Registered, Prime Member) vs (Credit Card, PayPal, Failed Payment)."
*   **HITL**: Review the matrix. Add an edge case: "Payment fails then succeeds on retry."

### Phase 3: Data (Day 3)
*   **AI Task**: "Generate 20 rows of JSON test data for the scenarios."
*   **HITL**: Check that credit card numbers follow the Luhn algorithm (valid format).

### Phase 4: Execution & Reporting (Day 4)
*   **Task**: Pretend to execute (or execute on a demo site like `saucedemo.com`).
*   **AI Task**: "I found a bug where the cart empties on refresh. Write a Jira Bug Report for this."
*   **HITL**: Add a screenshot. Set Priority.

## Deliverables Checklist
1.  **Test Plan**: Strategy document (AI-drafted, Human-refined).
2.  **Test Suite**: Excel/Jira export of test cases.
3.  **Prompt Library**: A text file containing the exact prompts you used (Evidence of engineering).
4.  **Defect Report**: 3-5 sample bugs.
5.  **HITL Log**: A simple document: "AI suggested X, I changed it to Y because Z."

**The Golden Rule**: The value is not just the artifacts, but the *story* of how you built them using AI efficiency.
