# Chapter 8 — Tools

---

## What You Will Learn

- What a Tool is and why AI needs them
- How to create a custom Tool that calls a function
- How to give an AI the ability to read files, call APIs, and run checks
- How to build a QA toolkit with multiple tools
- How tools differ from regular chain steps

---

## 8.1 The Problem

Your AI assistant can generate test cases perfectly. But a tester asks:

> "Can you read the requirements file in our project and generate test cases from it?"

The AI cannot do this. It can only work with text you paste into the prompt. It has no ability to read your file system, call your API, query your database, or run any code.

You could pre-read the file and paste it in yourself, but that defeats the purpose of an assistant. And what about checking if a Jira ticket exists? Or calling an internal test data service? Every integration requires you to manually do the work and paste the result.

Tools let the AI do this work itself. You define a function, you give it to the AI, and the AI decides when and how to call it.

---

## 8.2 What a Tool Is

**A Tool is a named function that the AI can choose to call.**

The AI receives a description of each tool — what it does, what parameters it needs. When processing a request, the AI decides if it needs to call a tool to complete the task. If it does, it generates a structured call request. Your code executes the actual function and returns the result. The AI uses the result to form its final response.

The QA equivalent: a test suite with utility functions. The test does not re-implement file reading — it calls `readFixture('user.json')`. The tool is that utility function, and the AI is the test that decides when to call it.

---

## 8.3 Creating a Tool

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// A tool that reads a file from the project's docs folder
const readRequirementsFile = tool(
  // The function that runs when the AI calls this tool
  async ({ filename }: { filename: string }): Promise<string> => {
    const filePath = path.join(process.cwd(), 'requirements', filename);
    if (!fs.existsSync(filePath)) {
      return `Error: File '${filename}' not found in requirements folder.`;
    }
    return fs.readFileSync(filePath, 'utf-8');
  },
  {
    // The name the AI uses to identify this tool
    name: 'read_requirements_file',
    // The description tells the AI when to use this tool
    description:
      'Reads a requirements document from the project requirements folder. ' +
      'Use this when the user refers to a file by name.',
    // Zod schema defines the parameters the AI must provide
    schema: z.object({
      filename: z.string().describe('The filename to read, e.g. checkout-requirements.txt'),
    }),
  },
);
```

Three things define a tool:
1. **The function** — actual code that does work. Returns a string result.
2. **The name** — how the AI identifies it. Use underscores, no spaces.
3. **The description** — this is critical. The AI reads this to decide when to call the tool. Write it in plain English. Be specific about when to use it and what it returns.

---

## 8.4 A QA Toolkit — Multiple Tools

Real tools need more than one capability. Here is a toolkit with four tools a QA assistant might need:

```typescript
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

// Tool 1: Read a file
const readFile = tool(
  async ({ filename }: { filename: string }): Promise<string> => {
    try {
      const filePath = path.join(process.cwd(), filename);
      return fs.readFileSync(filePath, 'utf-8');
    } catch {
      return `Error: Could not read file '${filename}'.`;
    }
  },
  {
    name: 'read_file',
    description:
      'Reads the contents of a file. Use when the user mentions a specific file to analyse.',
    schema: z.object({
      filename: z.string().describe('Relative path to the file from the project root'),
    }),
  },
);

// Tool 2: List files in a folder
const listFiles = tool(
  async ({ folder }: { folder: string }): Promise<string> => {
    try {
      const folderPath = path.join(process.cwd(), folder);
      const files = fs.readdirSync(folderPath);
      return `Files in '${folder}':\n${files.join('\n')}`;
    } catch {
      return `Error: Could not list folder '${folder}'.`;
    }
  },
  {
    name: 'list_files',
    description: 'Lists all files in a folder. Use to find what files are available.',
    schema: z.object({
      folder: z.string().describe('Relative path to the folder, e.g. "requirements"'),
    }),
  },
);

// Tool 3: Check if a URL responds
const checkUrl = tool(
  async ({ url }: { url: string }): Promise<string> => {
    try {
      const response = await fetch(url, { method: 'HEAD', signal: AbortSignal.timeout(5000) });
      return `URL '${url}' responded with status ${response.status}.`;
    } catch {
      return `URL '${url}' is unreachable or timed out.`;
    }
  },
  {
    name: 'check_url',
    description:
      'Checks if a URL is reachable and returns its HTTP status code. ' +
      'Use to verify that an application URL is accessible before testing.',
    schema: z.object({
      url: z.string().describe('The full URL to check, e.g. https://example.com/login'),
    }),
  },
);

// Tool 4: Save content to a file
const saveToFile = tool(
  async ({ filename, content }: { filename: string; content: string }): Promise<string> => {
    try {
      const filePath = path.join(process.cwd(), 'output', filename);
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, content, 'utf-8');
      return `Saved to output/${filename}`;
    } catch {
      return `Error: Could not save file '${filename}'.`;
    }
  },
  {
    name: 'save_to_file',
    description:
      'Saves content to a file in the output folder. ' +
      'Use when the user asks to save, export, or write test cases to a file.',
    schema: z.object({
      filename: z.string().describe('The filename to create, e.g. test-cases.md'),
      content: z.string().describe('The full text content to write to the file'),
    }),
  },
);

// Collect all tools
export const qaTools = [readFile, listFiles, checkUrl, saveToFile];
```

---

## 8.5 Binding Tools to a Model

Tools are bound to the model, not to the chain. The model uses the tool descriptions to decide which tool to call.

```typescript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { qaTools } from './qa-tools.js';

const model = new ChatOpenAI({ model: 'gpt-4o', temperature: 0 });

// Bind tools to the model
const modelWithTools = model.bindTools(qaTools);

// The model can now generate tool call requests
const response = await modelWithTools.invoke(
  'List the files in the requirements folder.',
);

console.log(response.tool_calls);
// Output:
// [{ name: 'list_files', args: { folder: 'requirements' } }]
```

The model does not execute the tool. It returns a `tool_calls` array describing which tool to call and with what arguments. Your code executes the actual function and returns the result. This separation is intentional — the AI decides what to do, your code controls what actually runs.

The full execution loop — where the model's tool calls are executed and the results fed back — is handled by Agents, which are covered in the next chapter.

---

## 8.6 Inspecting Tool Calls

Understanding what the model is asking for helps you debug tool behaviour:

```typescript
const response = await modelWithTools.invoke(
  'Read the file checkout-requirements.txt and then save a test plan to test-plan.md',
);

// The model might request multiple tool calls
console.log(response.tool_calls);
// [
//   { name: 'read_file', args: { filename: 'checkout-requirements.txt' } },
//   { name: 'save_to_file', args: { filename: 'test-plan.md', content: '...' } }
// ]
```

If the model is calling the wrong tool or with wrong arguments, the fix is almost always in the tool description. Make the description more specific about what the tool does and when to use it.

---

## 8.7 Security Considerations

Tools execute real code on your system. Apply these rules:

**Validate file paths** — Prevent directory traversal attacks. A user could ask the AI to read `../../etc/passwd`. Always use `path.join` and restrict access to specific folders:

```typescript
const ALLOWED_FOLDER = path.join(process.cwd(), 'requirements');

async ({ filename }: { filename: string }) => {
  const filePath = path.join(ALLOWED_FOLDER, filename);
  // Ensure the resolved path is inside the allowed folder
  if (!filePath.startsWith(ALLOWED_FOLDER)) {
    return 'Error: Access denied. Only files in the requirements folder are allowed.';
  }
  return fs.readFileSync(filePath, 'utf-8');
};
```

**Do not expose credentials** — Never pass API keys, database passwords, or tokens through tool parameters. If a tool needs auth, hardcode the credentials inside the function where the AI cannot see them.

**Sandbox destructive operations** — Tools that write, delete, or execute should require explicit confirmation or be restricted to safe sandbox locations.

---

## 8.8 What This Means for Testers

Tools are the bridge between the AI and your test environment. Without tools, the AI can only process text you give it. With tools, it can read your requirements folder, check if endpoints are up, look up test data from an API, and save its output to files your CI pipeline can consume.

Every tool is just a TypeScript function. If you can write a function that does something useful, you can make it a tool the AI can call.

---

## Interview Questions — Chapter 8

**Q1. What is a Tool in LangChain?**

A Tool is a named function that the AI can choose to call when processing a request. The AI receives the tool's name and description, decides whether calling the tool would help it complete the task, and generates a structured call request. The actual code runs in your application — not inside the AI — and the result is returned to the AI to use in its final response.

**Q2. What are the three required elements when defining a Tool?**

(1) The function — the TypeScript code that runs when the tool is called. (2) The name — a unique identifier the AI uses to refer to the tool. (3) The description — plain-English text that tells the AI when to use the tool and what it returns. The description is the most important element: the AI reads it to decide when to call the tool, so vague descriptions lead to wrong tool selection.

**Q3. Does the AI execute a Tool directly?**

No. The AI generates a tool call request — a structured object with the tool name and arguments. Your application code receives that request, executes the actual function, and returns the result. The AI then uses the result to continue. This separation means the AI can suggest calling a tool without being able to directly access your file system, database, or network.

**Q4. How do you fix a model that keeps calling the wrong tool?**

Improve the tool description. The description is the only signal the model has for deciding which tool to use. If two tools have similar descriptions, the model may choose incorrectly. Make each description specific about what the tool does, what inputs it expects, and when to prefer it over similar tools. If two tools overlap in purpose, consider merging them or making one a fallback.

**Q5. What security risks exist when building LangChain tools?**

The main risk is that a malicious prompt could instruct the AI to call a tool with dangerous arguments — reading sensitive files, deleting data, or calling an unintended endpoint. Mitigate this by: (1) validating all tool inputs inside the function, (2) restricting file access to specific allowed folders using path validation, (3) never exposing credentials through tool parameters, (4) limiting what tools are bound to the model to the minimum needed for the task.

---
