# Chapter 13 — Capstone Tool: AI Test Case Generator

---

## What You Will Learn

- How to combine Chapters 1–12 into a production-ready tool
- How to turn a requirements document into a structured test case file
- How to output test cases in multiple formats (Markdown, JSON, CSV)
- How to handle edge cases: missing input, empty files, API failures
- How to make the tool usable from the command line with arguments

---

## 13.1 What You Are Building

A command-line tool that takes a requirements file, analyses it, and produces a structured test case document.

```bash
npx tsx src/tools/test-case-generator.ts --input requirements/checkout.txt --format markdown
```

**Output:**

```markdown
# Test Cases: Checkout Module
Generated: 2024-01-15T10:23:00Z
Source: requirements/checkout.txt

## TC-001 — Checkout with Valid Card (Visa)
**Severity:** High
**Precondition:** User is logged in with items in cart
**Steps:**
1. Navigate to checkout
2. Enter valid Visa card number
3. Enter valid expiry date and CVV
4. Click Pay

**Expected Result:** Order is placed successfully and confirmation email is sent

---
```

This is a real tool your team can use today. The output can be pasted into Jira, saved to your test management system, or committed to your repository.

---

## 13.2 Project Structure

```
src/
  tools/
    test-case-generator.ts     ← Main tool
    formats/
      markdown.ts              ← Markdown formatter
      json-output.ts           ← JSON formatter
      csv.ts                   ← CSV formatter
  types/
    test-case.ts               ← Shared TypeScript types
```

---

## 13.3 Defining the Types

```typescript
// src/types/test-case.ts

export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';

export type TestCase = {
  id: string;
  title: string;
  severity: Severity;
  precondition: string;
  steps: string[];
  expectedResult: string;
  tags: string[];
};

export type TestCaseReport = {
  module: string;
  generatedAt: string;
  sourceFile: string;
  testCases: TestCase[];
  totalCount: number;
  coverageNote: string;
};
```

---

## 13.4 The AI Chain

```typescript
// src/tools/test-case-generator.ts
import 'dotenv/config';
import * as fs from 'fs';
import * as path from 'path';
import { ChatOpenAI } from '@langchain/openai';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { z } from 'zod';
import type { TestCaseReport } from '../types/test-case.js';

// ── Schema ─────────────────────────────────────────────────────────────────

const testCaseSchema = z.object({
  id: z.string().describe('Unique ID in format TC-001, TC-002, etc.'),
  title: z.string().describe('Short descriptive title of what is being tested'),
  severity: z
    .enum(['Critical', 'High', 'Medium', 'Low'])
    .describe('Risk level — Critical for data loss/security, High for core features, Medium for secondary flows, Low for cosmetic'),
  precondition: z.string().describe('Required state before executing the test'),
  steps: z
    .array(z.string())
    .describe('Step-by-step actions the tester performs'),
  expectedResult: z
    .string()
    .describe('Observable outcome that confirms the feature works correctly'),
  tags: z
    .array(z.string())
    .describe('Categories like "login", "validation", "payment", "edge-case"'),
});

const reportSchema = z.object({
  module: z.string().describe('Name of the feature module being tested'),
  coverageNote: z
    .string()
    .describe('One sentence about what testing areas are covered'),
  testCases: z.array(testCaseSchema).describe('All generated test cases'),
});

const parser = StructuredOutputParser.fromZodSchema(reportSchema);
const formatInstructions = parser.getFormatInstructions();

// ── Chain ──────────────────────────────────────────────────────────────────

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

const prompt = ChatPromptTemplate.fromMessages([
  [
    'system',
    `You are a senior QA engineer. Generate comprehensive test cases from requirements.
    
    Rules:
    - Cover happy paths, edge cases, and error scenarios
    - Each test case must be independently executable
    - Steps must be clear enough for a junior tester to follow
    - Tag test cases with relevant categories
    - Assign severity based on business impact
    
    {formatInstructions}`,
  ],
  [
    'human',
    `Generate test cases for the following requirements.
    Source file: {sourceFile}
    
    Requirements:
    {requirements}`,
  ],
]);

const chain = prompt.pipe(model).pipe(parser);

// ── Generate ───────────────────────────────────────────────────────────────

export async function generateTestCases(
  requirementsFile: string,
): Promise<TestCaseReport> {
  // Validate input
  if (!fs.existsSync(requirementsFile)) {
    throw new Error(`Requirements file not found: ${requirementsFile}`);
  }

  const requirements = fs.readFileSync(requirementsFile, 'utf-8').trim();

  if (requirements.length === 0) {
    throw new Error('Requirements file is empty.');
  }

  if (requirements.length < 50) {
    throw new Error('Requirements are too short to generate meaningful test cases. Provide at least one complete feature description.');
  }

  console.log(`Generating test cases from: ${requirementsFile}`);
  console.log(`Requirements length: ${requirements.length} characters\n`);

  const result = await chain.invoke({
    formatInstructions,
    sourceFile: path.basename(requirementsFile),
    requirements,
  });

  return {
    ...result,
    generatedAt: new Date().toISOString(),
    sourceFile: requirementsFile,
    totalCount: result.testCases.length,
  };
}
```

---

## 13.5 Output Formatters

```typescript
// src/tools/formats/markdown.ts
import type { TestCaseReport } from '../../types/test-case.js';

export function toMarkdown(report: TestCaseReport): string {
  const lines: string[] = [
    `# Test Cases: ${report.module}`,
    ``,
    `**Generated:** ${report.generatedAt}`,
    `**Source:** ${report.sourceFile}`,
    `**Total Test Cases:** ${report.totalCount}`,
    `**Coverage:** ${report.coverageNote}`,
    ``,
    `---`,
    ``,
  ];

  for (const tc of report.testCases) {
    lines.push(`## ${tc.id} — ${tc.title}`);
    lines.push(``);
    lines.push(`**Severity:** ${tc.severity}`);
    lines.push(`**Tags:** ${tc.tags.join(', ')}`);
    lines.push(`**Precondition:** ${tc.precondition}`);
    lines.push(``);
    lines.push(`**Steps:**`);
    tc.steps.forEach((step, i) => lines.push(`${i + 1}. ${step}`));
    lines.push(``);
    lines.push(`**Expected Result:** ${tc.expectedResult}`);
    lines.push(``);
    lines.push(`---`);
    lines.push(``);
  }

  return lines.join('\n');
}
```

```typescript
// src/tools/formats/csv.ts
import type { TestCaseReport } from '../../types/test-case.js';

export function toCsv(report: TestCaseReport): string {
  const headers = ['ID', 'Title', 'Severity', 'Precondition', 'Steps', 'Expected Result', 'Tags'];
  const rows = report.testCases.map((tc) => [
    tc.id,
    `"${tc.title.replace(/"/g, '""')}"`,
    tc.severity,
    `"${tc.precondition.replace(/"/g, '""')}"`,
    `"${tc.steps.join(' | ').replace(/"/g, '""')}"`,
    `"${tc.expectedResult.replace(/"/g, '""')}"`,
    tc.tags.join(';'),
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}
```

---

## 13.6 CLI Entry Point

```typescript
// src/tools/test-case-generator.ts — add at the bottom

import { toMarkdown } from './formats/markdown.js';
import { toCsv } from './formats/csv.js';

// Parse CLI arguments
const args = process.argv.slice(2);
const inputIndex = args.indexOf('--input');
const formatIndex = args.indexOf('--format');

const inputFile = inputIndex !== -1 ? args[inputIndex + 1] : null;
const format = formatIndex !== -1 ? args[formatIndex + 1] : 'markdown';

if (!inputFile) {
  console.error('Usage: npx tsx src/tools/test-case-generator.ts --input <file> [--format markdown|json|csv]');
  process.exit(1);
}

// Generate
try {
  const report = await generateTestCases(inputFile);

  let output: string;
  let extension: string;

  if (format === 'csv') {
    output = toCsv(report);
    extension = 'csv';
  } else if (format === 'json') {
    output = JSON.stringify(report, null, 2);
    extension = 'json';
  } else {
    output = toMarkdown(report);
    extension = 'md';
  }

  // Save output
  const outputDir = path.join(process.cwd(), 'output');
  fs.mkdirSync(outputDir, { recursive: true });

  const basename = path.basename(inputFile, path.extname(inputFile));
  const outputFile = path.join(outputDir, `${basename}-test-cases.${extension}`);
  fs.writeFileSync(outputFile, output, 'utf-8');

  console.log(`\nGenerated ${report.totalCount} test cases`);
  console.log(`Saved to: ${outputFile}`);
  console.log(`\nModule: ${report.module}`);
  console.log(`Coverage: ${report.coverageNote}`);

  // Print summary table
  console.log('\nTest Case Summary:');
  report.testCases.forEach((tc) => {
    console.log(`  [${tc.severity.padEnd(8)}] ${tc.id} — ${tc.title}`);
  });

} catch (error) {
  if (error instanceof Error) {
    console.error('Error:', error.message);
  }
  process.exit(1);
}
```

---

## 13.7 Running the Tool

```bash
# Create a sample requirements file
mkdir -p requirements
cat > requirements/checkout.txt << 'EOF'
Checkout Module Requirements

Payment Processing:
- Accepted cards: Visa, Mastercard, American Express
- Cards are validated at submission time
- Declined cards show specific error messages with reason codes
- CVV is required for all transactions
- 3D Secure authentication is triggered for high-value transactions over $500

Order Summary:
- Must display item names, quantities, unit prices, and line totals
- Shipping cost is a separate line item
- Tax is itemised by rate
- Total reflects all active discount codes

Discount Codes:
- Users can apply one discount code per order
- Invalid codes show an error message immediately
- Expired codes show "code has expired" message
- Codes are case-insensitive
EOF

# Run the tool
npx tsx src/tools/test-case-generator.ts --input requirements/checkout.txt --format markdown

# Run with JSON output
npx tsx src/tools/test-case-generator.ts --input requirements/checkout.txt --format json

# Run with CSV (for import to test management)
npx tsx src/tools/test-case-generator.ts --input requirements/checkout.txt --format csv
```

---

## 13.8 What This Means for Testers

This tool reduces test case writing from hours to minutes. A QA engineer provides the requirements document; the tool produces a starting point. The output is not a replacement for human review — it is a first draft that covers obvious scenarios, letting the QA engineer focus their time on nuanced edge cases and exploratory testing that the AI cannot identify.

The CSV output integrates directly with tools like TestRail, Zephyr, or Xray. The Markdown output can be committed to a repository alongside the requirements. The JSON output enables further automation — like comparing generated test cases against existing ones to identify gaps.

---

## Interview Questions — Chapter 13

**Q1. Why use `StructuredOutputParser` with Zod for this tool rather than `JsonOutputParser`?**

`StructuredOutputParser` with Zod provides two guarantees: it generates precise format instructions that steer the AI toward the exact schema, and it validates the response against the schema before returning it. `JsonOutputParser` parses JSON but does not enforce field names, required fields, or types. For a production tool that saves test cases to a file, a missing `steps` array or wrong severity value would silently produce bad output. Zod catches these at parse time.

**Q2. What would you change to support multiple requirements files in one run?**

Replace the single `--input` argument with a glob pattern or folder path. Use `DirectoryLoader` to load all matching files. Instead of one report per file, generate a report per file in parallel using `Promise.all`, then merge them into a combined output. The chain itself does not change — it is called once per file.

**Q3. Why is input validation important before calling the AI?**

To fail fast with a clear error message instead of wasting an API call on bad input. If the requirements file is empty or too short, the AI will produce generic or nonsensical test cases and still charge for the API call. Validating first protects against accidental misuse. It also makes the tool safer to integrate into a CI pipeline — the step fails with a clear message rather than silently producing useless output.

**Q4. How would you add a "review" step that checks the generated test cases for quality?**

Add a second chain after the first. The second chain takes the generated test cases as input and reviews them against a quality rubric — checking that each test case has a clear expected result, that all specified requirements have at least one test case, and that the steps are specific enough for a junior tester. This is a two-step chain: generate then review. The review output could flag test cases that need human attention.

**Q5. How would you make this tool work without OpenAI if the team cannot use external APIs?**

Replace `ChatOpenAI` with an Ollama provider pointing to a local model. The only change needed is the import and model instantiation:

```typescript
import { Ollama } from '@langchain/ollama';
const model = new Ollama({ model: 'llama3.2', temperature: 0 });
```

Everything else — the prompt, parser, chain, formatters — stays the same. This is the value of the LangChain abstraction: the AI provider is swappable without touching the rest of the tool.

---
