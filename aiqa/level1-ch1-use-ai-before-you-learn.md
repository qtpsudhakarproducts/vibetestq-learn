# Level 1 — Chapter 1: Use AI Before You Learn About It

## What This Chapter Is About

This chapter does something unusual — it asks you to use AI before anyone explains how it works. That is intentional. The goal of this chapter is not to give you a definition of an LLM. The goal is to get you a useful output from AI on your first day, and then use that experience to build your understanding from the inside out. By the end of this chapter, you will know what an LLM is, why it sometimes gets things wrong, and how to think about AI as a collaborator rather than an answer machine.

---

## Why It Matters for QA

Every QA professional has encountered a new tool or a new application with no documentation. What do you do? You open it and start exploring. You form hypotheses. You notice what works and what breaks. You understand by doing.

This chapter applies that same instinct to AI itself. You are not here to study AI — you are here to use it in your QA work. The fastest path to confidence is not reading about AI. It is getting a useful output and then asking yourself: why did that work? Why did that fail?

---

## What is an LLM?

### Plain Explanation

LLM stands for Large Language Model. It is the technology behind Claude, ChatGPT, and GitHub Copilot. An LLM is a system that has been trained on enormous amounts of text — books, articles, code, documentation, Q&A forums, and much more. Through that training, it learned patterns in language: which words follow which other words, how ideas connect, how questions are typically answered.

When you type a prompt, the model does not look anything up. It does not search the internet. It does not check a database. It generates a response by predicting — based on everything it learned during training — what the most useful and coherent reply would be.

### QA Analogy

Think of an LLM as a brilliant new QA joiner who has read every test strategy document, every bug report template, every automation framework guide, and every QA blog post ever written — but has never actually opened your application.

They know what a login page typically looks like. They know the common failure modes of a checkout flow. They know how to write a Gherkin scenario. But they do not know your application. They do not know your team's conventions. They do not know what your users actually do.

That is both the power and the limit of an LLM. Their breadth of knowledge is extraordinary. Their knowledge of your specific context is zero — until you give it to them.

### What This Means in Practice

| What an LLM knows well | What an LLM does not know |
|---|---|
| General testing patterns and techniques | Your specific application's features |
| How to write Gherkin, test cases, bug reports | Your team's naming conventions |
| Common edge cases for login, checkout, forms | Your users' real behaviour |
| Playwright, Selenium, JUnit, and other frameworks | What changed in your app last week |
| How to structure a test strategy document | Your organisation's risk tolerance |

### What to Watch Out For

The LLM will sound confident even when it is wrong. It generates responses that are coherent and well-structured regardless of whether the underlying content is accurate. This is not the model being dishonest — it is simply the nature of how it works. It has no internal signal that says "I am not sure about this." Your judgement is what provides that signal.

---

## Hallucination — What It Is and Why It Happens

### Plain Explanation

Hallucination is the term used when an LLM generates information that is plausible-sounding but incorrect or entirely fabricated. The model produces text that looks right — properly formatted, confidently stated, logically structured — but is factually wrong.

This happens because the model is not retrieving facts. It is generating text based on statistical patterns. It has no internal fact-checking mechanism. When it encounters a gap in its training data, it does not say "I don't know." It fills the gap with a plausible-sounding continuation.

### QA Analogy

Imagine that brilliant new QA joiner again. You ask them to write test cases for the checkout page. They have never seen your app, but they have read about hundreds of e-commerce checkout flows. So they write ten test cases — formatted perfectly, with Given/When/Then structure, covering the happy path and several negative scenarios.

Then you open the test cases and notice:

- Three of them reference a "Save for Later" button that your checkout page does not have
- Two reference a guest checkout option — your app requires account registration
- One tests a loyalty points field that was removed six months ago

The new joiner did not lie. They drew on everything they had read and produced what a checkout page *typically* looks like. But your checkout page is not typical — it is specific. And they had no way of knowing the difference.

### A Real QA Example

**The prompt:** "Write test cases for a registration form."

**What AI might produce:** Ten well-formatted test cases including a test for a phone number field, a date of birth field, and a profile picture upload.

**The reality:** Your registration form only has email, password, and username. There is no phone number field, no date of birth, and no profile picture upload.

**Why it happened:** The model has seen thousands of registration forms. Many of them have those fields. It generated a registration form test suite based on what registration forms typically look like — not yours.

**How to catch it:** Compare every test case against your actual application. Does this field exist? Does this button exist? Is this behaviour actually implemented?

### Why Human Verification Matters

This is not a reason to distrust AI. It is a reason to use AI the way you would use a very capable but very new team member — with oversight and review.

A spell-checker does not make you a worse writer. It frees you to focus on ideas while it handles the mechanical work. But you still read the output before sending it. You catch the cases where it changed a word in a way that altered the meaning.

AI is your spell-checker for test design. It handles the mechanical work of generating scenarios, formatting, structuring. You catch the cases where it generated something that does not match your application.

> **The rule:** Never ship AI-generated test cases without checking them against your actual application. This is not optional. It is your job.

---

## AI as Collaborator, Not Answer Machine

### The Two Mindsets

There are two ways people approach AI tools. One leads to frustration and bad outcomes. The other leads to productivity and quality results.

**The Answer Machine Mindset:** You ask a question, you get an answer, you copy it. If the answer is wrong, the tool is broken. You use it once, it fails you, you stop using it.

**The Collaborator Mindset:** You give context, ask for a draft, review it with your expertise, refine it, and get something better than you could have produced alone in the same time. If the output is off, you give more context and ask again.

### QA Analogy

Think about how you work with a developer when you find a bug. You do not send one message and expect the bug to be fixed. You describe the issue, the developer asks a clarifying question, you provide more context, they investigate, they fix it, you retest. It is a loop — not a one-shot transaction.

Working with AI is the same loop. The first response is the first attempt. Your review is the clarifying question. Your follow-up prompt is the additional context. The refined response is closer to what you need.

### Side-by-Side Comparison

| Answer Machine Mindset | Collaborator Mindset |
|---|---|
| "Write my test cases." → copy-paste | "Here is the requirement. Here is my app's context. Draft test cases. I'll review." |
| Trust the output because it looks professional | Review every scenario against the actual application |
| One prompt, one response, done | Prompt → review → refine → review again |
| "The AI got it wrong. AI is useless." | "The AI got it wrong. I need to give it more context." |
| Use AI to replace thinking | Use AI to do the first draft — your thinking improves it |

### The Practical Rule

The right question to ask when you receive AI output is not "is this good?" It is "what would I change, and why?" That question forces you to engage your domain knowledge. The answer to that question is the feedback you give in your next prompt. That is how the collaborator loop works.

---

## Practice Tasks

### Task 1 — Your first AI interaction
Open Claude.ai. Type this prompt exactly:

```
I am a QA engineer. We have a login page with email and password fields.
Failed login attempts show an error message. After 3 failed attempts, the
account is locked for 15 minutes.

Write 8 test cases covering positive, negative, and boundary scenarios.
Return as a numbered list with: Test ID, Scenario, Steps, Expected Result.
```

When you get the response:
- Count the test cases
- Check each one: does it match the behaviour described?
- Identify any that seem wrong, duplicated, or missing
- Note what you would add

### Task 2 — Find the hallucination
Modify the prompt above to describe a feature your application has but did not mention in the prompt. See if AI invents behaviour that was not described.

### Task 3 — The collaborator loop
Take the test cases from Task 1. Write a follow-up prompt:

```
Review the test cases you just generated.
What negative scenarios are missing?
What boundary values did you not test?
Add 3 more scenarios that cover these gaps.
```

Notice how the output improves when you treat it as a loop rather than a one-shot response.

---

## Key Takeaways

- An LLM generates responses by predicting what comes next based on patterns learned during training — it does not retrieve facts or search the internet
- An LLM knows general patterns very well but knows nothing about your specific application until you tell it
- Hallucination is when AI produces plausible-sounding but incorrect output — always review AI-generated test cases against your actual application
- The right mindset is collaborator, not answer machine — the first response is a draft, not a final answer
- Your domain knowledge, testing instinct, and application-specific expertise are what AI cannot replicate — they are exactly what makes your review valuable
- AI is a force multiplier for QA thinking, not a replacement for it

---

## Common Questions

**Q: If AI gets things wrong, why use it at all?**

A: Because a well-prompted AI generates a useful first draft in seconds that would take you 30 minutes to write manually. Even if you correct 3 out of 10 test cases, you saved significant time. The value is in the speed of the first draft — your value is in the quality of the review.

**Q: How do I know when AI is hallucinating?**

A: You often cannot tell from the output itself — hallucinated content looks identical to correct content. The only reliable method is to check each assertion against your actual application or your actual knowledge. This is why domain expertise matters more in the AI era, not less.

**Q: Will AI replace QA engineers?**

A: AI replaces the mechanical parts of QA work — the typing of test cases, the formatting of bug reports, the generation of test data. It does not replace domain knowledge, testing instinct, risk judgement, or the ability to notice when something that looks right is actually wrong. The QA professionals who get replaced are those who did only the mechanical parts and nothing else.

**Q: What is the difference between Claude, ChatGPT, and Copilot?**

A: They are all LLMs — the same fundamental technology with different training data, fine-tuning, and interfaces. Claude (Anthropic), ChatGPT (OpenAI), and Copilot (GitHub/Microsoft) all work on the same basic principle. For this program we use Claude because of its strong capability for structured outputs, its context window, and its MCP support in Level 2.

**Q: Is it safe to paste our test cases and requirements into AI?**

A: That depends on whether the information is sensitive. Public requirements and generic test cases are generally fine. Internal product details, real user data, and proprietary business logic should not be shared with external AI tools without checking your organisation's data policy. We cover this in detail in Chapter 3 on AI Ethics.
