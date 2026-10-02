# Chapter 14 — AI Bug Report Analyser

---

## What You Will Learn

- How to build a tool that analyses raw bug descriptions and produces structured reports
- How to classify bugs by severity and component automatically
- How to extract reproduction steps from unstructured tester notes
- How to suggest likely root causes and related areas to retest
- How to process multiple bug reports in batch

---

## 14.1 The Problem

A tester writes in Slack:

> "checkout is broken again, i added something to cart and went to pay but the page just shows a blank screen, this only happens when i use a discount code, tried it 3 times same result, chrome latest, also happens in firefox"

This is useful information. But it is buried in informal text. Your bug tracker needs:
- A title that can be searched
- Severity level
- Steps to reproduce (numbered)
- Expected vs actual behaviour
- Environment
- Affected component

Someone has to extract all of this from the Slack message and format it. That takes 5–10 minutes per bug. With 20 bugs a day, that is 100–200 minutes of busywork.

The AI Bug Report Analyser does this in seconds.

---

## 14.2 What the Tool Produces

Given the Slack message above, the tool outputs:

```json
{
  "title": "Checkout page shows blank screen when discount code is applied",
  "severity": "Critical",
  "component": "Checkout / Discount Code Processing",
  "priority": "P1",
  "environment": {
    "browser": "Chrome (latest), Firefox",
    "os": "Not specified"
  },
  "reproducible": true,
  "reproductionRate": "3/3 attempts",
  "stepsToReproduce": [
    "Add an item to the cart",
    "Navigate to checkout",
    "Apply a discount code",
    "Proceed to payment"
  ],
  "actualResult": "Checkout page shows a blank screen",
  "expectedResult": "Checkout page should display the payment form",
  "suggestedRootCause": "Likely a JavaScript error triggered during discount code validation in the checkout flow, or a failed API call when applying the discount",
  "relatedAreasToRetest": [
    "Checkout without discount code",
    "Discount code validation on cart page",
    "Payment page load after cart update"
  ],
  "originalReport": "checkout is broken again..."
}
```

---

## 14.3 The Schema and Chain

```typescript
// src/tools/bug-analyser.ts
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';

// ── Schema ─────────────────────────────────────────────────────────────────

const bugReportSchema = z.object({
  title: z
    .string()
    .describe('Short, specific bug title suitable for a bug tracker — max 80 characters'),
  severity: z
    .enum(['Critical', 'High', 'Medium', 'Low'])
    .describe(
      'Critical: app crash/data loss. High: core feature broken. Medium: workaround exists. Low: cosmetic',
    ),
  priority: z
    .enum(['P1', 'P2', 'P3', 'P4'])
    .describe('P1: fix today. P2: fix this sprint. P3: fix next sprint. P4: backlog'),
  component: z
    .string()
    .describe('Affected area of the application, e.g. "User Authentication", "Checkout"'),
  environment: z
    .object({
      browser: z.string().describe('Browser(s) mentioned, or "Not specified"'),
      os: z.string().describe('Operating system mentioned, or "Not specified"'),
    })
    .describe('Environment details from the report'),
  reproducible: z.boolean().describe('Whether the bug is reproducible based on the report'),
  reproductionRate: z
    .string()
    .describe('How often it reproduces, e.g. "3/3 attempts", "Intermittent", "Unknown"'),
  stepsToReproduce: z
    .array(z.string())
    .describe('Numbered steps to reproduce, inferred from the description'),
  actualResult: z.string().describe('What actually happens — the bug behaviour'),
  expectedResult: z.string().describe('What should happen if the software worked correctly'),
  suggestedRootCause: z
    .string()
    .describe(
      'Hypothesis about the technical cause — be specific about what might be failing',
    ),
  relatedAreasToRetest: z
    .array(z.string())
    .describe('Areas that should be retested after this bug is fixed'),
  originalReport: z.string().describe('The original raw report text, unchanged'),
});

type BugReport = z.infer<typeof bugReportSchema>;

// ── Chain ──────────────────────────────────────────────────────────────────

const parser = StructuredOutputParser.fromZodSchema(bugReportSchema);
const formatInstructions = parser.getFormatInstructions();

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a senior QA engineer analysing bug reports.
    
    Your job is to:
    1. Extract and structure all information from the raw report
    2. Infer missing details where reasonable (mark inferred data clearly)
    3. Suggest a likely root cause based on the symptoms described
    4. Identify related areas that should be regression-tested after the fix
    
    Be specific and technical. Vague root causes like "something broke" are not acceptable.
    
    {formatInstructions}`,
  ],
  [
    'human',
    `Analyse this bug report and produce a structured bug ticket:

    {rawReport}`,
  ],
]);

const chain = prompt.pipe(model).pipe(parser);

// ── Analyse function ───────────────────────────────────────────────────────

export async function analyseBugReport(rawReport: string): Promise<BugReport> {
  if (rawReport.trim().length < 20) {
    throw new Error('Report is too short to analyse. Provide more detail.');
  }

  return await chain.invoke({ formatInstructions, rawReport });
}
```

---

## 14.4 Batch Processing

Real teams have many bugs to process. Here is a batch processor that handles multiple reports:

```typescript
// src/tools/bug-analyser-batch.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { analyseBugReport } from './bug-analyser.js';

type BatchResult = {
  index: number;
  success: boolean;
  report?: Awaited<ReturnType<typeof analyseBugReport>>;
  error?: string;
  originalText: string;
};

async function processBatch(reports: string[]): Promise<BatchResult[]> {
  const results: BatchResult[] = [];

  for (let i = 0; i < reports.length; i++) {
    const rawReport = reports[i];
    console.log(`Processing report ${i + 1}/${reports.length}...`);

    try {
      const report = await analyseBugReport(rawReport);
      results.push({ index: i + 1, success: true, report, originalText: rawReport });

      // Brief pause between API calls to respect rate limits
      if (i < reports.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error) {
      results.push({
        index: i + 1,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        originalText: rawReport,
      });
    }
  }

  return results;
}

// ── Sample batch run ───────────────────────────────────────────────────────

const sampleReports = [
  'checkout is broken again, i added something to cart and went to pay but the page just shows a blank screen, this only happens when i use a discount code, tried it 3 times same result, chrome latest',

  'the search doesnt work on mobile, if you type something and press search nothing happens, but desktop works fine',

  'when i export the test results as pdf some of the table rows are cut off at the bottom of the page, happened on 2 different reports, not all rows just the last few on each page',
];

const results = await processBatch(sampleReports);

// Print summary
console.log('\n══════ BATCH RESULTS ══════\n');
results.forEach((r) => {
  if (r.success && r.report) {
    console.log(`[${r.index}] ✓ ${r.report.title}`);
    console.log(`     Severity: ${r.report.severity} | Priority: ${r.report.priority} | Component: ${r.report.component}`);
  } else {
    console.log(`[${r.index}] ✗ Failed: ${r.error}`);
    console.log(`     Original: ${r.originalText.slice(0, 60)}...`);
  }
});

// Save JSON output
const outputPath = path.join(process.cwd(), 'output', 'bug-reports.json');
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(results, null, 2), 'utf-8');
console.log(`\nFull results saved to: ${outputPath}`);
```

---

## 14.5 Formatting for Jira

If your team uses Jira, you can generate Jira-formatted descriptions directly:

```typescript
import type { BugReport } from './bug-analyser.js';

export function toJiraDescription(report: BugReport): string {
  return `
h3. Environment
* Browser: ${report.environment.browser}
* OS: ${report.environment.os}

h3. Steps to Reproduce
${report.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join('\n')}

h3. Actual Result
${report.actualResult}

h3. Expected Result
${report.expectedResult}

h3. Reproduction Rate
${report.reproductionRate}

h3. Suggested Root Cause
${report.suggestedRootCause}

h3. Related Areas to Retest
${report.relatedAreasToRetest.map((a) => `* ${a}`).join('\n')}

----
_Original report: ${report.originalReport}_
`.trim();
}
```

---

## 14.6 What This Means for Testers

Bug report analysis is one of the highest-value AI QA tools because it eliminates repetitive formatting work and adds analytical value (root cause, retest areas) that testers might skip under time pressure.

The tool is especially useful when integrated into a Slack bot or ticketing webhook — a tester writes a message in a channel, the tool automatically analyses it and creates a formatted Jira ticket. The tester reviews it, makes any corrections, and submits.

---

## Interview Questions — Chapter 14

**Q1. Why is `temperature: 0` important for this specific tool?**

Bug analysis needs to be deterministic. If two analysts run the same bug report through the tool, they should get the same severity, same component, and the same steps. Temperature 0 ensures the model picks the most likely interpretation consistently. Higher temperature would introduce variation — the same report might be classified as Critical on one run and High on another, which undermines the value of automated analysis.

**Q2. How does the tool handle missing information in the original report?**

The Zod schema fields use descriptions that tell the model what to do when information is absent — for example, `"browser: string, or 'Not specified'"`. The model fills in what it can from context and explicitly marks missing fields. The `suggestedRootCause` field asks for a hypothesis rather than a confirmed cause, so the model can reason about what is likely even without definitive information.

**Q3. What is the risk of the AI adding incorrect information to a bug report?**

Hallucination risk. The AI might infer steps that were not in the original report, suggest a root cause that is entirely wrong, or assign a severity that does not match the actual impact. The tool should be used as a first draft — a QA engineer must review the output before submitting to the bug tracker. The `originalReport` field in the output preserves the raw text so the reviewer can always compare what was said vs what the AI extracted.

**Q4. How would you add a severity validation step — checking that Critical bugs are really Critical?**

Add a second AI call: a review chain that takes the generated bug report and a severity rubric, then returns a boolean `confirmed` and a `reviewNote`. If the review disagrees with the initial severity, flag it for human review. This two-chain pattern — generate then validate — applies to any AI-generated artefact where accuracy is important.

**Q5. How would this tool integrate with a CI pipeline?**

You can hook it into a GitHub Action that watches a `bug-reports/` folder. When a new plain-text file is pushed (a tester writes a raw report and commits it), the action runs the analyser and opens a Jira ticket via the Jira API with the structured output. The action could also post a summary to Slack. The tool reads from stdin or a file and outputs JSON, making it compatible with any shell-based pipeline.

---
