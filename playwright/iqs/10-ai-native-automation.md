# AI-Native Automation — Interview Questions

---

## Q: What is Generative AI and how is it relevant to test automation?

**A:** Generative AI is a type of artificial intelligence that produces new content — text, code, images — based on patterns learned from large amounts of training data. In test automation, the most relevant form is large language models (LLMs) that can generate test code, explain failures in plain language, suggest locators, review test quality, and assist with repetitive writing tasks.

---

## Q: What is a Large Language Model (LLM)?

**A:** A Large Language Model is an AI trained on vast amounts of text. It learns patterns in language and code so it can generate coherent, contextually relevant responses. In practice, LLMs power coding assistants (GitHub Copilot, Claude, GPT-4) that can write Playwright tests, explain code, suggest refactors, and answer technical questions. They do not understand code — they predict what text should come next based on learned patterns.

---

## Q: How can AI assist with test automation tasks?

**A:** Generating test scenarios from user stories or feature descriptions. Writing initial Playwright test code from descriptions. Suggesting semantic locators for elements. Explaining what a test does in plain language. Reviewing test code for anti-patterns. Generating test data sets. Creating page object scaffolding. Summarising CI failure logs. Writing parameterised test cases from data tables.

---

## Q: What is prompt engineering?

**A:** Prompt engineering is the practice of designing the input you give an LLM to get the best possible output. A well-constructed prompt provides clear context (the framework, language, file structure), specific instructions (what code to generate), relevant examples (your existing patterns), and the expected output format. Better prompts produce more accurate, usable code.

---

## Q: What is zero-shot prompting?

**A:** Zero-shot prompting means giving the LLM a task without providing any examples — just a description. The model completes the task based solely on its training. `"Write a Playwright test that logs in with a username and password and verifies the dashboard title"` is a zero-shot prompt. It works well for straightforward, common tasks.

---

## Q: What is few-shot prompting?

**A:** Few-shot prompting means providing one or more input-output examples before your actual request. The model learns the pattern from the examples and applies it to your real task. This significantly improves output quality for domain-specific conventions — for example, showing two existing page object examples before asking the model to generate a third.

---

## Q: What is context engineering?

**A:** Context engineering is the discipline of carefully managing what information you include in the AI's context window. Instead of just prompting, you curate which files, documentation, code conventions, and constraints the AI sees. Including your existing `BasePage`, fixture patterns, and naming conventions helps the AI generate code that matches your project rather than generic code.

---

## Q: What is Retrieval-Augmented Generation (RAG)?

**A:** RAG retrieves relevant documents from a knowledge base and adds them to the LLM's context before it generates a response. Instead of relying only on training data, the model uses fresh, project-specific information. For automation, RAG can give an assistant access to your page objects, API contracts, and test standards dynamically, producing outputs that align with your codebase without manual copy-pasting.

---

## Q: What is hallucination in LLMs and why does it matter for automation?

**A:** Hallucination is when an LLM generates content that sounds confident and plausible but is incorrect or fabricated. In automation, it might invent Playwright API methods that don't exist, generate code using outdated syntax, or write tests that pass syntactically but don't actually test the intended behaviour. Always read and run AI-generated code — never commit it without verification.

---

## Q: What are the main risks of AI-generated test code?

**A:** Hallucinated APIs that will throw at runtime. Outdated patterns from old training data. Tests that are syntactically correct but don't verify meaningful behaviour (empty assertions, wrong locators). Security issues from poorly generated credential handling. Anti-patterns like hardcoded waits or overly broad locators. Overconfident code that hides edge cases.

---

## Q: What is an AI agent in the context of test automation?

**A:** An AI agent is a system that can autonomously plan and execute a sequence of actions to complete a goal, not just answer a single question. In testing, an agent might receive a description of a user flow, autonomously navigate the application to understand it, generate test steps, write the test code, run it, observe the result, and fix any failures — all without step-by-step human instruction.

---

## Q: What is an agentic loop?

**A:** An agentic loop is the repeated cycle an AI agent runs through: **Plan** (decide what to do) → **Act** (execute an action using a tool) → **Observe** (check the result) → **Plan** (adapt based on the observation) → repeat. The loop continues until the goal is achieved or the agent determines it cannot proceed. This iterative approach lets agents handle unexpected situations.

---

## Q: What is the planner-executor-validator pattern?

**A:** This is an AI agent architecture that separates three concerns. The **Planner** analyses the goal and decides what steps are needed. The **Executor** carries out each step — running code, calling tools, interacting with browsers. The **Validator** checks whether each step succeeded and whether the overall goal has been met. Separating these roles improves reliability over a single model doing everything.

---

## Q: What is the Model Context Protocol (MCP)?

**A:** MCP (Model Context Protocol) is an open standard created by Anthropic for connecting AI assistants to external tools and data sources. It defines a standard communication layer between an AI model and tool servers. Any MCP-compatible AI client can use any MCP-compatible tool server without custom integration code. It makes AI tooling composable and interoperable.

---

## Q: What is the Playwright MCP server?

**A:** The Playwright MCP server is a tool server that gives AI assistants live, browser-level control through the MCP protocol. The AI can navigate to URLs, click elements, fill forms, take screenshots, and read the page structure — just like a human using a browser. This enables AI agents to explore, test, and interact with web applications autonomously.

---

## Q: What is self-healing test automation?

**A:** Self-healing automation detects when a locator fails to find the intended element and automatically searches for an alternative match using other available attributes — role, text content, proximity, or position. If a match is found, the test continues. The suggested new locator is either applied automatically or flagged for human review. It reduces test maintenance caused by developers renaming elements.

---

## Q: When can self-healing automation hide real bugs?

**A:** When a UI element genuinely disappears, moves to a wrong place, or is replaced by a different element due to a real defect — but self-healing finds a different element and treats it as a match. The test passes even though the intended feature is broken. This is why all self-healed locators should be logged, reviewed, and approved by a human rather than silently accepted.

---

## Q: What is a SKILL file in AI-assisted development?

**A:** A SKILL file is a structured document that encodes a specific capability for an AI agent — the context it needs, the tools it should use, the steps to follow, and the patterns to apply. For Playwright, a SKILL file might define exactly how the agent should write page objects, name fixtures, or handle authentication. It is a form of persistent, reusable prompt engineering that makes agent output consistent with your project's standards.

---

## Q: What is the future direction of AI in test automation?

**A:** AI will progressively take over the boilerplate: generating test skeletons from requirements, updating tests when the UI changes, identifying redundant or low-value tests, and generating test data at scale. The human role in automation will shift toward defining testing strategy, evaluating AI-generated tests for correctness and coverage, and engineering the AI systems themselves. Writing low-level locator code will become increasingly automated.

---

## Q: How do you evaluate the quality of AI-generated tests?

**A:** Run the tests and verify they actually fail when the feature is broken (mutation testing or deliberate breakage). Check that assertions validate meaningful user outcomes, not just element presence. Review for anti-patterns: hardcoded timeouts, XPath selectors, missing awaits. Ensure each test has a clear intent and covers a real scenario. Treat AI-generated tests as a first draft that requires human review before merging.

---
