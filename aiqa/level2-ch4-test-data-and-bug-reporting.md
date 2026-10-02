# Level 2 — Chapter 4: Test Data Generation & Bug Reporting

## What This Chapter Is About

This chapter covers two of the most time-consuming manual QA tasks — generating test data and writing bug reports — and shows how to do both faster and better with AI. It introduces synthetic data as the responsible alternative to using real user records, covers the DPDP Act implications for QA professionals in India, and walks through the AI-powered workflows for bug reporting, root cause analysis, and defect pattern recognition. All examples use Veg Cart.

---

## Why It Matters for QA

Test data and bug reports are two things every QA engineer produces constantly. And they are both areas where quality varies enormously between engineers — not because of skill, but because of time.

A QA engineer under deadline pressure writes a rushed bug report that a developer cannot reproduce. Another engineer with more time writes a detailed report with steps, environment, expected vs actual, and a root cause hypothesis — and the developer fixes it on the first attempt.

AI can produce the detailed report in the same time it takes to write the rushed one. The same applies to test data: generating realistic, constraint-respecting, boundary-covering test data manually takes time. AI does it in seconds.

---

## Test Data Generation

### The Problem with Manual Test Data

Manual test data creation suffers from three common problems:

**It is not realistic:** QA engineers under time pressure use placeholder values — `test@test.com`, `password123`, `123 Test Street`. This data does not surface real-world failure modes. A real user entering a name in mixed script (English and Telugu) might break a field that `TestUser` never would.

**It misses boundaries:** Test data is only valuable if it covers the right values — boundaries, invalid formats, maximum lengths, minimum values. Manual data creation often covers the obvious cases and misses the ones that matter.

**It uses real data:** Some teams copy production data for testing. This is a privacy violation, increasingly illegal, and unnecessary — AI can generate synthetic data that is indistinguishable from real data in structure while containing no real information.

### Synthetic Data — What It Is and Why It Matters

**Synthetic data** is AI-generated data that matches the structure and constraints of real data without being real data. It has realistic names, valid email formats, actual-looking phone numbers, and plausible addresses — but none of it belongs to a real person.

### QA Analogy

Imagine training a new cashier using a mock cash register with fake currency. The fake notes look exactly like real ones — same size, same design, same denominations. The cashier learns every procedure they would need for real transactions. But no real money is involved, no real transactions occur, and there is no risk.

Synthetic test data is the fake currency. Structurally identical to the real thing. Functionally valid for testing. No real users are exposed.

### The DPDP Act — Critical for India

India's Digital Personal Data Protection Act (2023) — the DPDP Act — creates legal obligations that directly affect how QA teams handle test data.

**What it says, in practical terms:**
- Personal data of Indian residents has legal protections
- Processing personal data without a lawful basis (such as valid consent) is prohibited
- Using production customer data as test data — a common practice — is a potential DPDP violation

**What this means for QA teams in India:**
- You must not copy real customer records into test databases
- You must not paste real user data into AI prompts
- Test environments should use synthetic data that matches the structure of production data but contains no real records
- If your organisation is already using production data for testing, this is a compliance gap that needs to be addressed

**The solution:** Generate all test data synthetically. AI makes this fast and easy. The synthetic data is better for testing (you control the values) and legal (no real personal data involved).

### Generating JSON Test Data for Veg Cart

**Prompt:**
```
Act as a QA data engineer for the Veg Cart application — an online
vegetable ordering platform used in India.

Generate a JSON array of 10 vegetable product records with these fields:
- id (integer, sequential starting from 1)
- name (vegetable name in English)
- price_per_kg (decimal, realistic price in Indian rupees, range ₹20–₹200)
- category (one of: leafy, root, fruit-vegetable, exotic)
- stock_quantity (integer, some should be 0 to test out-of-stock)
- unit (either "per kg" or "per bunch")

Include at least one out-of-stock item and one exotic vegetable.
All data should be synthetic — no real product pricing.
```

**Sample output:**
```json
[
  {
    "id": 1,
    "name": "Carrot",
    "price_per_kg": 45.00,
    "category": "root",
    "stock_quantity": 150,
    "unit": "per kg"
  },
  {
    "id": 2,
    "name": "Tomato",
    "price_per_kg": 30.00,
    "category": "fruit-vegetable",
    "stock_quantity": 0,
    "unit": "per kg"
  },
  {
    "id": 3,
    "name": "Purple Basil",
    "price_per_kg": 180.00,
    "category": "exotic",
    "stock_quantity": 12,
    "unit": "per bunch"
  }
]
```

### Generating CSV Test Data for User Accounts

**Prompt:**
```
Act as a QA data engineer for Veg Cart — an Indian vegetable delivery application.

Generate a CSV file with 10 synthetic user records for testing checkout flows.
Fields: user_id, full_name, email, mobile_number, delivery_address, city, pincode

Requirements:
- All data must be entirely synthetic — no real people
- Names should be realistic Indian names (mix of South Indian and North Indian)
- Mobile numbers should be valid 10-digit Indian mobile format (starting with 6-9)
- Email addresses should use test domains (@vegcarttest.com or @testmail.in)
- Addresses should be realistic but fictional Bangalore addresses
- Pincodes should be valid Bangalore pincode format (560xxx)
- Include 1 user with a very long name (to test field length limits)
- Include 1 user with a hyphenated surname
```

### Generating SQL Seed Data for Coupons

**Prompt:**
```
Generate SQL INSERT statements to seed the Veg Cart coupons table
with test data for the following scenarios:

Table: coupons (code VARCHAR, discount_percent INT, expires_at DATE,
                 used_by_user_id INT NULLABLE, is_active BOOLEAN)

Create records for:
1. A valid, unused, active coupon (SAVE10 — 10% discount, expires 6 months from now)
2. An expired coupon (EXPIRE30 — 15% discount, expired 1 day ago)
3. A coupon already used by user_id 1 (USED50 — 50% discount, still in date)
4. A deactivated coupon (DEACT20 — 20% discount, is_active = false)
5. A coupon that expires today (LASTDAY — 5% discount, expires today)

Use realistic future/past dates, not placeholder values.
```

### Data Contracts — Keeping Synthetic Data Useful

Synthetic data is only useful for testing if it matches the **shape and constraints** of real data. If your database has a NOT NULL constraint on the mobile field, synthetic data without mobile numbers will fail on insert, not because of the feature you are testing but because of the data.

A **data contract** is the set of constraints your synthetic data must respect to be valid for testing:

- Field lengths (varchar(50) means names cannot exceed 50 characters)
- Required fields (NOT NULL means every record needs a value)
- Format constraints (email must match email pattern)
- Range constraints (price cannot be negative)
- Foreign key constraints (user_id must reference an existing user record)

**Best practice:** Before generating test data, list the constraints. Include them in your prompt. Ask AI to generate data that passes all constraints.

---

## Bug Reporting with AI

### The Bug Report Quality Problem

A poor bug report wastes everyone's time. The developer cannot reproduce it. They ask for more information. QA spends another hour providing it. The fix is delayed by a day.

A good bug report is a complete package: the developer reads it, reproduces the issue in minutes, understands what is wrong, and fixes it on the first attempt.

The difference is almost entirely in the detail and structure of the report. AI can produce the detailed, structured version in the same time it takes you to write the rushed version.

### The Bug Report Prompt

```
Act as an experienced QA engineer writing a professional Jira bug report.

Issue observed:
[Describe what you observed in plain language — does not need to be formal yet]

Application: Veg Cart (vegetable ordering platform)
Environment: [Chrome/Firefox/etc], [device], [staging/production], [logged-in/guest]

Write a complete bug report with these sections:
- Summary (one line, starts with the affected feature)
- Environment (browser, OS, environment, test account used)
- Steps to Reproduce (numbered, specific enough to reproduce from zero)
- Expected Result (what should happen according to the business rules)
- Actual Result (what actually happens)
- Severity (Critical/High/Medium/Low with a one-sentence justification)
- Root Cause Hypothesis (your educated guess at what is wrong technically)
- Additional Notes (screenshots to attach, related issues, frequency of occurrence)
```

### Veg Cart Example

**What you observed (rough notes):**
```
Applied the SAVE10 coupon on a cart worth ₹199. It should have rejected it
because minimum order is ₹200 for coupons to work. But it actually applied
the coupon and gave the discount anyway. Total went from ₹239 (with delivery)
to ₹219.10 (with 10% off subtotal). Delivery was ₹40.
```

**What AI produces:**
```
Summary: Coupon code SAVE10 applies below the ₹200 minimum order threshold

Environment:
- Browser: Chrome 122 on macOS Ventura
- Environment: Staging
- Account: test@vegcarttest.com (registered user)
- Date: 2025-01-15

Steps to Reproduce:
1. Log in with a registered account
2. Browse to vegetables and add items totalling ₹199 (e.g. 3 carrots at ₹45 each = ₹135, 1 spinach at ₹64 = ₹199)
3. Proceed to checkout
4. In the coupon field, enter: SAVE10
5. Click Apply

Expected Result:
The application should reject the coupon with an error: "Minimum order of ₹200 required to use this coupon." The order total should remain unchanged at ₹239.

Actual Result:
The coupon is applied successfully. The subtotal is reduced by 10% from ₹199 to ₹179.10. The order total becomes ₹219.10 (₹179.10 subtotal + ₹40 delivery). No minimum order validation error is shown.

Severity: High
Justification: Financial impact — customers can receive discounts they are not eligible for. Depending on coupon volume, this represents direct revenue loss.

Root Cause Hypothesis:
The coupon validation function likely checks only whether the code is valid (exists, not expired, not already used) but does not verify the minimum order threshold before applying the discount. The minimum order check may be missing from the server-side validation, or the ₹200 threshold may not be correctly configured.

Additional Notes:
- Screenshot of successful coupon application attached
- Also observed: coupon is not automatically removed when items are removed from cart to bring the total below ₹200 post-application
- Recommend adding a regression test for this scenario once fixed
- Related: check if other coupon codes with minimum order requirements have the same issue
```

This is a dramatically better bug report than the rough notes. The developer can reproduce it immediately, understands the financial severity, and has a starting point for the fix.

### Bug Report Review Checklist

After generating a bug report with AI, confirm:

- [ ] Steps to Reproduce: can you follow them from scratch and reproduce the issue?
- [ ] Expected Result: does it correctly state the business rule (not just "it should work")?
- [ ] Actual Result: does it describe exactly what happens, including any text, messages, or values shown?
- [ ] Severity: is the justification based on business impact, not technical complexity?
- [ ] Root Cause Hypothesis: does it point to a plausible technical explanation (not just "it doesn't work")?
- [ ] Are there screenshots attached?

---

## Root Cause Analysis with AI

### Plain Explanation

Root cause analysis is the process of identifying the underlying technical reason for a bug — not just what it does wrong, but why it does wrong. Good root cause hypotheses help developers find the issue faster and fix it more completely.

AI is surprisingly effective at root cause analysis because it has seen thousands of bug patterns and knows which technical causes produce which observable symptoms.

### Veg Cart RCA Prompt

```
Act as a senior QA engineer doing root cause analysis.

Bug: On the Veg Cart checkout page, when the coupon SAVE10 is applied
to an order below the ₹200 minimum, the coupon applies successfully
instead of showing an error.

Error log (from browser console):
POST /api/coupons/validate 200
{"valid": true, "discount": 10, "applied": true}

Given this observable behaviour and API response, what are the most likely
root causes? List them in order of probability with a brief explanation for each.
```

**AI output (excerpt):**
```
Most likely root causes, in order of probability:

1. Missing server-side minimum order validation (most likely)
   The /api/coupons/validate endpoint returns valid:true and applies the discount
   without checking the order total. The minimum order check is either missing
   from the validation logic or the order total is not being passed to the
   validation function.

2. Validation check uses subtotal before delivery, with wrong threshold
   The check may exist but compare against ₹160 (subtotal after discount)
   rather than ₹199 (pre-discount subtotal), causing it to pass incorrectly
   for some values.

3. Feature flag or config value misconfiguration
   The minimum order threshold for coupons (₹200) may be a configurable value
   that has been accidentally set to 0 or null in the staging environment.
```

This helps the developer know exactly where to look.

---

## Defect Pattern Analysis

### Plain Explanation

After enough bugs are raised on a project, patterns emerge. Multiple tickets that look unrelated often share the same underlying cause. Recognising these patterns helps you identify systemic issues rather than just individual bugs.

AI can analyse a set of bug reports and identify patterns — similar root causes, the same area of the application recurring, the same developer's code appearing repeatedly in fixes.

### Defect Clustering

**Defect clustering** is identifying that multiple distinct bug reports are symptoms of the same underlying problem. AI can read your bug reports and flag clusters.

**Veg Cart example prompt:**
```
Review these 5 bug reports from Veg Cart and identify:
1. Which bugs share a common root cause or affected area
2. What the common underlying issue appears to be
3. Which bugs could be fixed with a single code change

Bug 1: Coupon applies below minimum order threshold
Bug 2: Free delivery coupon still charges delivery on orders over ₹500
Bug 3: Bulk discount coupon shows negative total on 1-item orders
Bug 4: Coupon field accepts the same code twice in one session
Bug 5: Coupon discount is recalculated when items are added after application

[Paste full bug report details]
```

AI identifies: Bugs 1, 2, 3, and 5 all relate to the coupon validation function — it appears to have multiple gaps in its business rule enforcement. One comprehensive fix to the validation logic would likely resolve all four.

### Bug Report Quality Scoring

Before raising a bug, you can ask AI to assess the completeness of your report:

```
Act as a developer reviewing a bug report for reproducibility and completeness.
Score this bug report on:
1. Reproducibility: can you reproduce it from the Steps alone? (1-5)
2. Clarity of Expected vs Actual: is the difference clearly stated? (1-5)
3. Severity justification: is the business impact explained? (1-5)
4. Root cause: is there a hypothesis that gives a starting point? (1-5)

Identify specifically what is missing or unclear.

[Paste bug report here]
```

This is especially useful for newer QA engineers — it provides specific feedback on what to improve before the report goes to the developer.

---

## The Connected Day 4 Workflow

Everything in this chapter connects into a single workflow:

```
Generate test data (JSON/CSV/SQL)
        ↓
Use it to test Veg Cart features
        ↓
Find a bug (e.g. coupon below minimum works)
        ↓
AI structures your rough notes into a professional bug report
        ↓
AI generates a root cause hypothesis from the behaviour and logs
        ↓
Bug raised in Jira with complete information
        ↓
After enough bugs, AI clusters them and identifies systemic issues
        ↓
Test cases for the bug's scenario added to the automation backlog
        ↓
Data, reports, and findings saved to the repository
```

---

## Practice Tasks

### Task 1 — Generate test data for Veg Cart
Use the prompts from this chapter to generate:
- `vegetables.json` — 10 product records with the specified fields
- `users.csv` — 10 synthetic user records
- `coupons.sql` — seed data for 5 coupon scenarios

Save all three to your project's `/test-data/` folder.

### Task 2 — Write a bug report from rough notes
During your exploration session from Chapter 3, you likely found at least one unexpected behaviour. Take your rough observation notes and use the bug report prompt to generate a professional Jira-ready report.

Apply the bug report review checklist. Fix any gaps before considering the report complete.

### Task 3 — Root cause analysis
Take the bug from Task 2 and use the RCA prompt to generate a root cause hypothesis. Is the hypothesis plausible? Could you point a developer to the right area of the codebase based on it?

### Task 4 — Defect pattern review
If you have more than 3 bugs from your Level 2 testing sessions, use the defect clustering prompt to see if AI identifies any common patterns or shared root causes.

### Task 5 — Data contract exercise
Choose the `users.csv` data you generated. List the database constraints your user table would have (NOT NULL fields, format constraints, length limits). Check your synthetic data against each constraint. Generate a new prompt that incorporates those constraints and regenerate the data.

---

## Key Takeaways

- Manual test data creation is slow, misses boundaries, and often uses real data — AI-generated synthetic data is faster, more complete, and legally safe
- Synthetic data matches the structure of real data without containing real records — it is the DPDP-compliant solution for all test data needs
- The DPDP Act (India 2023) makes using real production data for testing a legal compliance risk — start using synthetic data now
- Data contracts — the structural and format constraints your data must meet — should be included in your data generation prompts
- AI bug report generation from rough notes produces significantly more complete, reproducible reports than time-pressured manual writing
- Root cause hypothesis is one of the most valuable parts of a bug report — AI can suggest probable causes from observable symptoms and error logs
- Defect clustering identifies when multiple bugs share a common root cause — one fix for what looks like four separate issues
- All test data, bug reports, and RCA notes should be saved in the repository — they become quality intelligence that compounds over time

---

## Common Questions

**Q: How do I know if my synthetic data is realistic enough?**

A: Check it against two criteria: would it pass your database's constraints (length, format, NOT NULL)? And does it represent the range of values your real users would enter? If both are yes, it is good enough. The second criterion is where most teams underinvest — generating only happy-path data when boundary and edge-case data is where the bugs hide.

**Q: My organisation requires real data for performance testing. Does DPDP apply?**

A: DPDP applies to any processing of personal data of Indian residents — including in test and performance environments. If you need realistic volumes for performance testing, work with your data engineering team to generate synthetic data at volume, or use anonymisation tools that replace real values with synthetic equivalents while preserving the statistical distribution.

**Q: Should I always include a root cause hypothesis in a bug report?**

A: Yes — always include one, even if it is stated as uncertain ("possibly related to..."). A hypothesis gives the developer a starting point. A bug report with no hypothesis puts the full burden of diagnosis on the developer. A wrong hypothesis is less harmful than no hypothesis — it gives the developer something to confirm or rule out.

**Q: Can AI generate test data for non-standard field formats specific to our application?**

A: Yes — describe the format in your prompt. "Our order reference numbers follow the format VC-YYYYMM-NNNNN (e.g. VC-202501-00001)" gives AI everything it needs to generate valid values. For very complex custom formats, provide an example in the prompt.

**Q: What if I do not have access to the error logs when writing a bug report?**

A: Write the bug report without the logs and note that logs should be attached by the developer when investigating. Include what you can observe in the browser (network tab, console errors visible without developer access). A good bug report with partial information is better than a delayed one waiting for complete information.
