# Chapter 26: Prompt Engineering for Testing 🗣️

## The Concept of Prompt Engineering

In the age of AI, your primary language isn't just TypeScript or Python—it's English. **Prompt Engineering** is the art of crafting precise instructions to get high-quality, reliable outputs from an LLM. For testers, this means learning how to describe a bug, a test scenario, or a code refactor in a way the AI perfectly understands.

**Purpose**: This chapter provides a framework (Role-Context-Instruction-Format) for writing prompts that generate production-ready Playwright code and test data.

**Why is it required?**
1. **Quality of Output**: To avoid "AI Hallucinations" where the model generates invalid Playwright methods or nonexistent locators.
2. **Standardization**: To ensure that everyone on the team gets consistent results when using AI for test generation.
3. **Complex Problem Solving**: To learn advanced techniques like "Chain of Thought" (CoT) for building complex test logic using natural language.

## 1. The Art of Speaking to AI

**Prompt Engineering** is the skill of crafting inputs (prompts) to get the best possible output from an LLM. In test automation, the quality of your prompt determines the quality of your test code or test cases.

> **Golden Rule**: "Garbage In, Garbage Out."

---

## 2. Anatomy of a Perfect Prompt

A robust prompt usually contains four key elements:

1.  **Role**: Who should the AI act as?
2.  **Context**: What is the background info?
3.  **Instruction**: What exactly do you want?
4.  **Format**: How should the output look?

### Example: Generating a Playwright Test

**Weak Prompt:**
> "Write a test for login."

**Strong Prompt:**
> **[Role]** Act as a Senior SDET Expert in Playwright and TypeScript.
> **[Context]** We are testing a banking application. The login page has fields `#username`, `#password`, and an ID-less button with text "Sign In".
> **[Instruction]** Write a Playwright test script that performs a successful login. Use the Page Object Model pattern. Ensure you use `getByRole` where possible.
> **[Format]** Output only the TypeScript code block.

---

## 3. Prompting Techniques for Testers

### 3.1 Zero-Shot Prompting
Asking the AI to do something without examples.
*   *Use case:* Simple explanations or standard code generation.
*   *Example:* "Explain `page.evaluate` in Playwright."

### 3.2 Few-Shot Prompting
Providing examples (shots) to guide the AI's style. This is **critical** for code generation to ensure it follows your framework's coding standards.

**Prompt:**
> Convert the following Steps to Playwright code.
>
> Example 1:
> Input: "User clicks the Save button"
> Output: `await this.page.getByRole('button', { name: 'Save' }).click();`
>
> Example 2:
> Input: "User fills the Name field"
> Output: `await this.page.getByLabel('Name').fill('John');`
>
> Task:
> Input: "User checks the 'Agree to Terms' checkbox"
> ...

### 3.3 Chain-of-Thought (CoT)
Asking the AI to "think step-by-step". Use this for complex logic, like generating a test strategy for a complex microservices architecture.

---

## 4. Practical Library of Prompts

### 4.1 For Locator Strategy
> "I have the following HTML snippet: `<div class='custom-dropdown'><span data-id='123'>Select</span></div>`. Suggest 3 robust Playwright locators for this element, prioritized by stability."

### 4.4 For Test Data Generation
> **[Instruction]** Generate a JSON array of 5 user objects for a retail app. 
> **[Context]** Each should have: `email` (valid format), `password` (complex), and `loyaltyTier` (Gold, Silver, or Bronze). 
> **[Format]** Return ONLY the raw JSON array.

---

## 5. Integrating Prompts into Code

Mastery means automating the prompting. Instead of copy-pasting from ChatGPT, use a utility function:

```typescript
async function generateTestData(schema: object): Promise<any> {
  const prompt = `Generate realistic JSON test data based on this schema: ${JSON.stringify(schema)}`;
  // Call OpenAI/Anthropic API here...
  const response = await ai.complete(prompt);
  return JSON.parse(response);
}
```
**Summary**: You've learned how to craft high-quality prompts to generate production-ready code. The next chapter explores the local IDE tools like Cursor and Copilot that bring this AI power directly into your development workflow.
