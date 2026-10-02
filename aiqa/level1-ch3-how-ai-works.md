# Level 1 — Chapter 3: How AI Works & Responsible Use

## What This Chapter Is About

This chapter explains just enough about how AI works to make you a confident and effective user. You do not need to understand the mathematics of neural networks. You do not need to know what a transformer architecture is. You need to understand three things: how the model learned what it knows, why it forgets things between conversations, and why there are limits to how much you can give it at once. You also need to understand the different types of AI you will encounter, and how to use all of them responsibly in a QA context.

---

## Why It Matters for QA

The frustrating moments with AI — when it gives a generic answer, forgets what you said earlier, or seems to have no idea what your application does — all have explanations. Once you understand the explanation, you know how to fix it. Context window is why it forgets. Training cutoff is why it does not know your app. Token limits are why you cannot paste your entire requirements document. Understanding these three things will make you a dramatically better AI user.

---

## LLM Training — How the Model Learned

### Plain Explanation

An LLM learns through a process called training. Before the model you use existed, Anthropic (for Claude), OpenAI (for ChatGPT), or Microsoft/GitHub (for Copilot) collected enormous amounts of text from the internet, books, code repositories, academic papers, and many other sources. The model was then trained on this data — essentially shown billions of examples of text and taught to predict what comes next.

Through this process, the model develops a deep representation of language, concepts, and their relationships. It learns that test cases usually have steps and expected results. It learns that Gherkin scenarios follow Given/When/Then. It learns that login pages typically have email and password fields. None of this was explicitly programmed — it emerged from patterns in the training data.

After training, the model's knowledge is frozen. It knows what it learned. It cannot learn new things from your conversations. Each conversation is read-only — the model processes your input and generates a response, but the underlying model does not change.

### QA Analogy

Imagine a QA engineer who spent five years studying every publicly available test strategy document, every automation framework tutorial, every bug report best practice guide, and every testing conference talk — before their first day of work. They absorb all of this. On their first day, they are extraordinary at general QA knowledge.

But their preparation had a cutoff date — the day they started work. They do not know what happened in your organisation after that date. They do not know your application. They do not know your team's way of working. All of that must be provided in the briefing you give them each morning.

That briefing is your prompt. That cutoff date is the training cutoff of the model.

### What This Means for QA

- AI knows general testing patterns, frameworks, and techniques extremely well
- AI does not know your specific application — you must describe it in every relevant prompt
- AI's knowledge has a training cutoff — it may not know about very recent library versions, recent framework changes, or recent industry developments
- AI cannot learn from your feedback in real time — if you correct it in one conversation, it will not remember that correction in the next conversation

---

## Context Window — AI's Working Memory

### Plain Explanation

Every time you open a new conversation with Claude or ChatGPT, the AI starts completely fresh. It has no memory of previous conversations. Within a single conversation, it can remember everything that has been said — but only up to a limit called the context window.

The context window is the maximum amount of text that the model can process at one time. Think of it as a workspace. Everything in the workspace — your prompts, the AI's responses, any documents you pasted — is visible to the model when it generates its next response. When the conversation becomes too long, older parts of the conversation start to fall outside the context window and are no longer visible to the model.

### QA Analogy

Imagine you are assigned to test a new feature. Your manager gives you a Jira ticket with no description, no attachments, no acceptance criteria, no links to related tickets, and no history of what was decided in planning. Just a title: "Test the checkout flow."

You have no context. You would have to guess what checkout means for this application, what the expected behaviour is, what edge cases matter. You might produce something — but it would be generic, based on how you have seen checkout flows work before, not how this one actually works.

That is exactly what happens when you start a conversation with AI and provide no context. It produces something generic, based on the training data, not your specific situation.

Now imagine you get a comprehensive brief: the checkout has three steps, payments are Visa and Mastercard only, guest checkout is supported, there is no PayPal, discount codes are applied at step two, and delivery slots are selected at step three. Your Jira ticket has all of this attached.

Suddenly you can write very specific, accurate, useful test cases. That comprehensive brief is what good context in a prompt does.

### The Post-it Note Desk

Another way to think about the context window: imagine a desk covered in post-it notes. Each note contains something you told the AI during this conversation. The model can read all the notes on the desk when generating a response.

But the desk has a maximum capacity. When it fills up, old notes fall off to make room for new ones. If you had a crucial piece of information in an early message and the conversation has grown very long, that information might no longer be on the desk.

This is why:
- Very long conversations can produce worse results than shorter, focused ones
- You should re-state critical context if a conversation has gone long
- Skills.md files (covered in Chapter 5) solve this by providing context automatically at the start of every conversation

### Practical Implications

| Situation | What Happens | What To Do |
|---|---|---|
| New conversation, no context | AI uses generic patterns from training | Always provide application context in your prompt |
| Long conversation | Early context may fall off the context window | Summarise or re-state key context if results worsen |
| Pasting a very long document | May exceed token limits or crowd out your actual question | Summarise documents; paste only the relevant section |
| Asking a follow-up question | AI remembers the full conversation so far | You can refer to earlier messages without repeating them |

---

## Tokens — Why There Are Limits

### Plain Explanation

When you type a message to an AI, it does not process it word by word. It processes it in units called tokens. A token is roughly three to four characters of text — not exactly a word, but close. The word "testing" might be two tokens: "test" and "ing". The word "a" is one token. "Playwright" is one or two tokens.

Everything in the context window — your messages, the AI's responses, any pasted documents — is measured in tokens. Models have a maximum context window measured in tokens. Claude's context window is very large, but it is not infinite.

### QA Analogy

Think of a test execution log with a maximum file size. Once the log file reaches its size limit, the system either stops recording or starts overwriting older entries. You can fit a lot in that log, but you cannot fit everything.

When you try to paste your entire 200-page requirements document into a single prompt, two things happen: you likely exceed reasonable limits, and even if you do not, the sheer volume of text makes it much harder for the model to find and focus on what is relevant to your question.

### What This Means for QA

- You cannot paste your entire requirements document, your full test plan, and your complete bug history into one prompt
- You do not need to — you need the relevant section, not everything
- Summarise large documents before pasting them
- Give 1–2 representative examples rather than 50 examples of the same pattern
- For repetitive tasks (like generating test cases for 20 features), do them in batches — one feature per conversation, or a few per conversation

> **Practical tip:** Instead of pasting your entire regression test suite and asking AI to add new tests, paste 3–5 representative examples and say: "Follow this exact pattern and write test cases for [new feature]." The examples give AI everything it needs to match your style — the full suite is unnecessary.

---

## Types of AI: Generative AI, ML Models, and Agents

### Plain Explanation

Not all AI is the same. In your QA work, you will encounter three distinct types. Understanding the difference helps you know what to expect from each.

### Generative AI

**What it is:** AI that creates new content — text, code, images, data — from your instructions. Claude, ChatGPT, and GitHub Copilot are all generative AI tools.

**What it does for QA:** Writes test cases, generates Gherkin scenarios, drafts bug reports, explains code, creates test data, suggests edge cases, writes automation scripts.

**How it works:** You give it instructions (a prompt). It generates output. You review, refine, and use it.

**QA example:** "Act as a senior QA engineer. Our registration form has email, password, and username fields. Write 8 test cases covering all validation rules."

### ML Models

**What it is:** Machine learning models that learn patterns from data to make predictions or classifications. These are typically built for specific tasks rather than general conversation.

**What it does for QA:** Predicts which tests are likely to fail based on the code changes in a commit (test selection). Classifies bug severity based on description and history. Detects flaky tests by analysing historical result patterns.

**How it works:** Trained on historical data from your project. Makes predictions based on that specific history. Does not generate new content — predicts or classifies existing content.

**QA example:** A CI system that analyses which tests have historically failed after changes to a particular module, and automatically prioritises those tests in the next run.

### AI Agents

**What it is:** AI systems that can take actions — browse applications, execute commands, call APIs, write files, and make decisions — rather than just generate text.

**What it does for QA:** Explores your live application and reports findings. Generates automation from exploration results. Fixes broken test locators automatically (self-healing). Runs targeted regression and analyses the results.

**How it works:** Given a goal or a charter, the agent plans its approach, executes steps autonomously, and reports results. You direct the agent — you do not manually execute each step.

**QA example:** "Explore the Veg Cart checkout flow. Test all coupon code scenarios. Report any unexpected behaviour with screenshots."

### Which Type You Use When

| Type | You Use It When | Examples in This Program |
|---|---|---|
| Generative AI | Generating any content: test cases, feature files, bug reports, test data | Claude.ai, GitHub Copilot — Level 1 and 2 |
| ML Models | Your CI system predicts test priority | CI pipeline intelligence — Level 3 |
| AI Agents | Exploring apps, generating automation, self-healing | Playwright MCP Agent, Planner/Generator/Healer — Level 2 and 3 |

> **Key point for Level 1 and 2:** Most of your AI interactions will be with Generative AI — Claude.ai and GitHub Copilot. AI Agents become central in Level 2 (exploratory testing) and Level 3 (automation generation).

---

## AI Ethics, Responsible Use & Data Privacy

### Plain Explanation

Using AI tools comes with real responsibilities. These are not theoretical concerns — they are practical rules that protect your clients, your organisation, and yourself.

### What You Must Never Share with AI

**Real user data:** Names, email addresses, phone numbers, account IDs, transaction histories, health information — any data that belongs to real people. This is a privacy violation regardless of whether the AI provider stores it.

**Client application credentials:** URLs, API keys, login credentials for client systems. Pasting these into an external AI tool is a security risk.

**Proprietary business logic:** Details about how your client's system works that give them competitive advantage. This is confidential information.

**Production test data:** Database exports, real customer records used as test fixtures. Even if you think it is "just test data," if it contains real records, it is real data.

### QA Analogy

You would not email your client's user database to a freelance contractor you hired for one day. The same professional standard applies to AI tools. The fact that you are typing it into a chat interface rather than emailing a file does not change the nature of what you are sharing or who can potentially access it.

### The DPDP Act — Relevant for India

India's Digital Personal Data Protection Act (2023) creates legal obligations around the handling of personal data. For QA professionals in India, this means:

- Test data containing real Indian residents' personal information cannot be shared with AI tools without proper consent and processing agreements
- Organisations processing personal data must ensure their AI tool usage complies with data minimisation principles
- Using real production data as test data — a common practice — is increasingly problematic from a legal standpoint

The practical solution is synthetic data — AI-generated test data that matches the structure of real data without containing any real records. We cover this in Level 2, Chapter 4.

### Responsible Use Rules for QA

| Do | Do Not |
|---|---|
| Use synthetic or anonymised test data | Paste real user records into AI prompts |
| Describe application behaviour in general terms | Paste live application credentials or URLs |
| Use AI to generate and review, then verify yourself | Ship AI output without human review |
| Check your organisation's AI usage policy | Assume all AI interactions are private and deleted |
| Generate test data using AI instead of copying production data | Use production data exports as test fixtures |
| Disclose when a deliverable was AI-assisted | Represent AI-generated work as entirely your own without disclosure |

### How to Handle Sensitive Context

Sometimes you need to give AI enough context to be useful — but the context is sensitive. Here is how to handle the most common cases:

**Application URL:** Describe the application's purpose and key features in plain text instead of providing the URL. "We are testing an online vegetable ordering platform with a three-step checkout" gives AI useful context without exposing your client's application.

**Real user behaviour:** Anonymise or generalise. "Our users frequently add 8–10 items to the cart before checkout" is better than pasting actual session logs with user IDs.

**Business rules:** Describe the rule abstractly. "Discount codes are limited to one per order and expire after 30 days" is fine. Pasting your discount code database is not.

---

## Practice Tasks

### Task 1 — Context window experiment
Start a new conversation with Claude. Ask: "Write 5 test cases for a login page." Notice how generic they are with no context.

Now start a fresh conversation. Before asking the same question, spend two sentences describing your application: what it does, who uses it, and one specific behaviour of the login page. Ask the same question. Compare the two outputs.

### Task 2 — Token limit awareness
Take a requirements document from your current project. Count how many pages it is. Write a 3-paragraph summary of the most important requirements. Ask AI to generate test scenarios from the summary rather than the full document. Notice that the output is more focused.

### Task 3 — Identify the AI type
For each of the following, identify whether it is Generative AI, an ML Model, or an AI Agent:
- Claude generating a bug report from your notes
- A CI system automatically selecting which tests to run based on the files changed in a commit
- Playwright MCP Agent browsing your application and reporting what it found
- GitHub Copilot suggesting the next line of your automation script
- A tool that classifies incoming bug reports as High/Medium/Low based on historical patterns

### Task 4 — Synthetic data practice
Think of a feature in your current or most recent project that required test data. Instead of using real data or making up data manually, write a prompt to generate synthetic test data for that feature. Ensure the data is realistic and matches your field constraints.

---

## Key Takeaways

- LLM training is how the model learned everything it knows — but knowledge was frozen at the training cutoff and cannot be updated by your conversations
- The context window is the model's working memory for a single conversation — start each conversation with the context the model needs, because it remembers nothing from previous conversations
- Tokens are how the model measures content — use focused, relevant input rather than pasting everything you have
- Three types of AI matter for QA: Generative AI (creates content), ML Models (predicts/classifies), and AI Agents (takes actions) — you will use all three across the four levels
- Never share real user data, client credentials, or proprietary business logic with external AI tools
- Synthetic data — AI-generated data that matches the structure of real data — is the correct solution for test data needs
- India's DPDP Act creates legal obligations around personal data that directly affect how QA professionals should use AI tools

---

## Common Questions

**Q: If AI has a training cutoff, how do I use it for recent frameworks or libraries?**

A: For general concepts and patterns, the training data is usually sufficient even if slightly dated. For specific recent features or version-specific syntax, you can paste the relevant documentation section into your prompt and say "given this documentation, help me write a test." The model can reason from documentation you provide even if it was not in the training data.

**Q: How do I know what the context window limit is for Claude?**

A: Claude has a very large context window — large enough that in normal QA workflows you will rarely hit it. The more practical concern is quality degradation: very long conversations sometimes produce less focused responses, not because the window is exceeded but because the relevant signal is diluted. If you notice quality dropping in a long conversation, start a fresh one with a focused context summary.

**Q: Is everything I type to Claude stored and used for training?**

A: Anthropic's privacy policy determines data handling — it is worth reading it for your specific use case. For enterprise and API users, there are options for data not to be used for training. For general professional use, the safe practice is to follow the same rule as any external tool: do not share data you would not be comfortable with a third party having access to.

**Q: What is the difference between an AI agent and a bot?**

A: A bot typically follows a predefined script — if this, do that. It has no judgement and cannot handle situations not anticipated in its programming. An AI agent uses an LLM to reason, plan, and make decisions — it can handle novel situations, change approach based on what it encounters, and report observations that were not anticipated. The Playwright MCP Agent used in Level 2 is an AI agent: it browses your application and reports what it finds, adapting its exploration based on what it encounters.

**Q: Can I use AI to help me understand code I do not understand?**

A: Absolutely — this is one of the most immediately practical uses for QA engineers who need to review automation code. Paste a code block into Claude and ask: "Explain what this code does in plain English. What is it testing? What assertions are being made?" This is covered in depth in Level 3.
