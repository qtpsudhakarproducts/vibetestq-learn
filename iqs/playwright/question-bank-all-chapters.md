# Cracking Playwright Interviews — Complete Question Bank
# All 85 Chapters | Questions Only | No Answers
# Version 1.0 — For Review & Finalisation

> **How to use this document:**
> Review question by question. Mark any question with:
> - ✅ Keep as-is
> - ✏️ Rephrase — add your preferred wording
> - ❌ Remove — with reason
> - ➕ Add — write the new question inline
> - Once finalised, answers will be written for every approved question.


---

# PART 1 — JavaScript & TypeScript for Test Automation
*Chapters 101–112 | ~172 Questions*

---

## Chapter 101 JS for Automation — Introduction & History


---

## Chapter 102 Variables, Scope & Data Types


---

## Chapter 103 Operators & Conditionals


---

## Chapter 104 Loops & Iteration


---

## Chapter 105 Arrays & Collections


---

## Chapter 106 Functions & Arrow Functions


---

## Chapter 107 Objects & Prototypes


---

## Chapter 108 Strings & Regular Expressions


---

## Chapter 109 Async JS — Promises & async/await


---

## Chapter 110 Classes, Modules & Scopes


---

## Chapter 111 Exception Handling


---

## Chapter 112 TypeScript for Test Automation


---


---

# PART 2 — Playwright Core
*Chapters 201–210 | ~167 Questions*

---

## Chapter 201 Introduction to Playwright & Architecture


---

## Chapter 202 Installation & Directory Structure


---

## Chapter 203 BrowserContext — Isolated Environments


---

## Chapter 204 Locators & Auto-Waiting


---

## Chapter 205 Actions — Clicks, Typing & Checkboxes


---

## Chapter 206 Advanced Actions — Drag, Hover & Keys


---

## Chapter 207 File Uploads & Downloads


---

## Chapter 208 Dialogs — Alerts, Confirms & Prompts


---

## Chapter 209 iFrames — frameLocator & Frames


---

## Chapter 210 Windows — Multiple Pages & Tabs


---


---

# PART 3 — Playwright Test Framework
*Chapters 301–316 | ~226 Questions*

---

## Chapter 301 Getting Started with Playwright Test

Q301.1 — What is @playwright/test?
Q301.2 — What is the difference between the Playwright library and the Playwright test runner?
Q301.3 — When would you use the Playwright library without @playwright/test?
Q301.4 — How is @playwright/test set up in your project?
Q301.5 — What does a basic Playwright test file look like?
Q301.6 — What does the test function provide — what is in the fixtures parameter?
Q301.7 — What is the difference between page, browser, and context fixtures?
Q301.8 — What happens when a test fails — what does Playwright report?
Q301.9 — What is the difference between @playwright/test and Jest or Mocha?
Q301.10 — What does @playwright/test provide that a plain test runner does not?
Q301.11 — What is wrong with importing page from playwright instead of using the page fixture?
Q301.12 — How does @playwright/test compare to Cypress's test runner?
Q301.13 — Write a complete first test file for a login page
Q301.14 — Write a test that uses the request fixture for an API call alongside a page test

---

## Chapter 302 Defining Tests — Structure & Syntax


---

## Chapter 303 Grouping Tests with describe & Suites


---

## Chapter 304 Test Steps — Step-by-Step Execution


---

## Chapter 305 Hooks — before/after Lifecycle


---

## Chapter 306 Annotations — skip, only, fail, fixme


---

## Chapter 307 Tags & Test Filtering


---

## Chapter 308 TestInfo Object


---

## Chapter 309 Parameterized Tests


---

## Chapter 310 Fixtures — Built-in & Custom


---

## Chapter 311 Configuration & playwright.config.ts


---

## Chapter 312 Projects — Multi-browser & Multi-env


---

## Chapter 313 Global Setup & Teardown


---

## Chapter 314 Assertions & Expect API


---

## Chapter 315 Screenshots, Video & Tracing

Q315.1 — What screenshot capabilities does Playwright provide?
Q315.2 — What is the Playwright trace viewer?
Q315.3 — When do you enable screenshots and video in CI?
Q315.4 — How does your project use screenshots, video, and traces for debugging?
Q315.5 — How do you configure screenshot capture in playwright.config.ts?
Q315.6 — What is the difference between screenshot: 'on', 'off', and 'only-on-failure'?
Q315.7 — How do you record a trace and how do you open it?
Q315.8 — What information does a trace contain?
Q315.9 — What is the difference between page.screenshot() and toHaveScreenshot()?
Q315.10 — What is the difference between video: 'on' and video: 'retain-on-failure'?
Q315.11 — What is wrong with enabling trace: 'on' for all tests in CI?
Q315.12 — How does Playwright tracing compare to Selenium's test recording tools?
Q315.13 — Write configuration for on-failure screenshots and trace capture
Q315.14 — Write code to manually capture a screenshot and attach it to the test report
Q315.15 — Describe a time when the trace viewer helped you diagnose a test failure

---

## Chapter 316 Reporters — HTML, JSON, Allure & Custom


---


---

# PART 4 — Execution, CLI & CI/CD
*Chapters 401–407 | ~105 Questions*

---

## Chapter 401 Parallelism — Workers & Execution Model


---

## Chapter 402 Sharding — Distributed Test Execution


---

## Chapter 403 Retries — Flakiness & Recovery


---

## Chapter 404 Timeouts — Global, Test & Action Level


---

## Chapter 405 CLI — Running & Filtering Tests


---

## Chapter 406 Reporters & Output — Deep Dive

Q406.1 — What is the Playwright HTML report and what does it contain?
Q406.2 — How do you open the HTML report after a test run?
Q406.3 — When do you use JSON reporter vs HTML reporter vs blob reporter?
Q406.4 — How does your team consume test reports in CI?
Q406.5 — What is the difference between list, dot, and line reporters for terminal output?
Q406.6 — What is the blob reporter and how does it work with sharding?
Q406.7 — How do you merge blob reports from multiple shards?
Q406.8 — What information does the HTML report show for a failed test?
Q406.9 — What is the difference between the HTML report and Allure for enterprise reporting?
Q406.10 — When should you build a custom reporter?
Q406.11 — What is wrong with using only the dot reporter in CI?
Q406.12 — How does the Playwright HTML report compare to Cypress's dashboard?
Q406.13 — Write a playwright.config.ts that uses multiple reporters simultaneously
Q406.14 — Write a custom reporter that outputs test results as a Slack message payload
Q406.15 — Describe how your team shares test results with stakeholders

---

## Chapter 407 CI/CD & Docker Integration


---


---

# PART 5 — POM & Framework Design
*Chapters 501–511 | ~179 Questions*

---

## Chapter 501 POM Theory & Design Principles (L0)


---

## Chapter 502 Basic Page Objects (L1)


---

## Chapter 503 BasePage & Inheritance (L2)


---

## Chapter 504 Fixtures & Shared State (L3)


---

## Chapter 505 Test Independence & State Setup (L4)


---

## Chapter 506 Test Data Management (L5)


---

## Chapter 507 Reusable Web Action Helpers (L6)


---

## Chapter 508 Reporting & Test Organisation (L7)


---

## Chapter 509 CI/CD Integration & Execution Strategy (L8)


---

## Chapter 510 AI Agents & Standard-Driven Test Generation (L9)


---

## Chapter 511 Runtime Self-Healing (L10)


---


---

# PART 6 — BDD with Cucumber & Playwright
*Chapters 601–605 | ~75 Questions*

---

## Chapter 601 BDD with Cucumber & Playwright — Overview


---

## Chapter 602 Gherkin Feature Files & Cucumber Profiles


---

## Chapter 603 Custom World, Hooks & Lifecycle


---

## Chapter 604 Step Definitions & POM in BDD


---

## Chapter 605 Reporting, Configuration & CI/CD in BDD


---


---

# PART 7 — API Testing, Network & Authentication
*Chapters 701–706 | ~96 Questions*

---

## Chapter 701 API Testing with Playwright


---

## Chapter 702 Network Interception & Routing


---

## Chapter 703 Network Mocking Strategies


---

## Chapter 704 Authentication — Basics


---

## Chapter 705 Authentication — Advanced


---

## Chapter 706 Mobile Emulation & Cross-Browser


---


---

# PART 8 — Visual & Accessibility Testing
*Chapters 801–806 | ~90 Questions*

---

## Chapter 801 Visual Testing Fundamentals


---

## Chapter 802 Playwright Visual Comparisons


---

## Chapter 803 Advanced Visual Testing


---

## Chapter 804 Accessibility Testing Fundamentals


---

## Chapter 805 Accessibility Testing with Playwright


---

## Chapter 806 Best Practices — Visual & Accessibility


---


---

# PART 9 — AI-Native Test Automation
*Chapters 901–912 | ~193 Questions*

---

## Chapter 901 GenAI Fundamentals for Testers


---

## Chapter 902 Prompt Engineering for Test Automation


---

## Chapter 903 Context Engineering for Test Automation


---

## Chapter 904 Agent Skills & SKILL Files


---

## Chapter 905 AI IDEs for Test Automation


---

## Chapter 906 MCP Protocol Fundamentals


---

## Chapter 907 Playwright MCP Server


---

## Chapter 908 Playwright CLI & SKILLs


---

## Chapter 909 MCP vs CLI — Choosing the Right Approach


---

## Chapter 910 Playwright AI Agents


---

## Chapter 911 Testing AI Applications


---

## Chapter 912 Runtime Self-Healing & AI Strategy Capstone


---