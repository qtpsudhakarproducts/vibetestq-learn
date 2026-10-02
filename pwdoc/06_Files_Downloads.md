# Chapter 06: Handling Downloads & Uploads (Complete Guide)

## The Concept of File Operations

Web browser security (sandboxing) makes interacting with the local file system difficult for automation tools. System dialogs (like the "Open File" window) are not part of the web page and cannot be automated with normal CSS selectors. Playwright solves this by **intercepting** the browser's file events.

**Purpose**: This chapter provides a reliable pattern for uploading files and tracking downloads, ensuring these critical business flows are fully automated.

**Why is it required?**
1. **End-to-End Coverage**: To test applications that rely on document management, profile picture updates, or data exports (CSV/PDF).
2. **Environment Independence**: To ensure file-related tests run identically on Windows, Mac, Linux, and Headless CI environments.
3. **Reliability**: To avoid common timing issues where a test proceeds before a large file has finished downloading or uploading.

## The Challenge of File Handling

In modern web applications, file operations are critical paths. Whether it's uploading a profile picture, importing a CSV, or downloading a PDF invoice, these reliable actions are often brittle in traditional automation tools.

**Why is it hard in other tools?**
- System dialogs (File Explorer) are outside the browser's control context.
- Downloads happen silently in the background.
- Timing issues (when is the download *actually* finished?).

**How Playwright Solves It:**
- **Bypasses System Dialogs**: It intercepts the "file chooser" event and injects the file directly.
- **Download Event**: It provides a specific event listener for downloads that includes the file stream.
- **Sandbox Friendly**: Works perfectly in Headless mode and CI environments (Docker).

---

## File Uploads Deep Dive

### The Standard Upload (`input` element)

When the generic HTML `<input type="file">` is present, Playwright makes uploading trivial.

```typescript
test('standard file upload', async ({ page }) => {
  await page.goto('/profile/edit');
  
  // Method 1: Direct Locator Action (Easiest)
  // This looks for an input[type="file"] and sets the path
  await page.locator('#avatar-upload').setInputFiles('test-data/avatar.png');
  
  // Method 2: Label (Accessibility Friendly)
  await page.getByLabel('Upload Profile Picture').setInputFiles('test-data/avatar.png');
});
```

### Uploading Multiple Files

Many modern inputs allow multi-select.

```typescript
test('upload multiple documents', async ({ page }) => {
  await page.goto('/documents/upload');
  
  await page.getByLabel('Select Documents').setInputFiles([
    'test-data/report-q1.pdf',
    'test-data/report-q2.pdf',
    'test-data/images/chart.png'
  ]);
  
  // Validation
  await expect(page.locator('.file-list-item')).toHaveCount(3);
});
```

### Removing Uploaded Files

To clear a file input (simulate a user clicking "Remove" or resetting the form), pass an empty array.

```typescript
await page.locator('#upload').setInputFiles([]);
await expect(page.locator('.preview')).toBeHidden();
```

---

## Advanced Upload Techniques

### Handling Non-Standard Inputs (Hidden Inputs)

Modern UI frameworks (React, Vue) often hide the ugly native `<input>` element and show a styled `<div>` or `<button>` instead.

**Strategy:** Playwright is smart enough to find the associated input if you interact with the label, but sometimes you need to target the hidden input directly.

```typescript
test('upload to hidden input', async ({ page }) => {
  // Option 1: Target the hidden input directly (might fail visibility checks)
  // Fix: Force the action? No, setInputFiles doesn't need force usually.
  
  // Option 2: Use the FileChooser Event (The Robust Way)
  // This works even if the input is completely dynamic or hidden
  
  // 1. Setup the listener BEFORE the click
  const fileChooserPromise = page.waitForEvent('filechooser');
  
  // 2. Click the visible "Upload" button (which triggers the native dialog)
  await page.getByRole('button', { name: 'Upload Files' }).click();
  
  // 3. Wait for the dialog event interception
  const fileChooser = await fileChooserPromise;
  
  // 4. Set the files
  await fileChooser.setFiles('test-data/large-dataset.csv');
});
```

### Buffer Uploads (In-Memory Files)

Sometimes you don't want to create physical files on your disk just for a test (e.g., testing dynamic content). You can upload raw buffers.

```typescript
test('upload dynamic text file', async ({ page }) => {
  const fileContent = 'This is a test file generated at ' + Date.now();
  
  await page.getByLabel('Upload Log').setInputFiles({
    name: 'dynamic-log.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from(fileContent)
  });
});
```

### Drag and Drop Uploads

Some apps use a "Drop Zone". `setInputFiles` usually works on the input inside the drop zone, but if you strictly need to simulate the *Drag* event:

```typescript
test('drag and drop file', async ({ page }) => {
  await page.goto('/upload-dnd');
  
  // Evaluate code in browser to construct a DataTransfer object
  // This is a complex workaround for strict Drag-n-Drop events
  const dataTransfer = await page.evaluateHandle(() => {
    const dt = new DataTransfer();
    const file = new File(['content'], 'test.txt', { type: 'text/plain' });
    dt.items.add(file);
    return dt;
  });

  // Dispatch the event
  await page.dispatchEvent('#drop-zone', 'drop', { dataTransfer });
});
```
*Note: Prefer `setInputFiles` whenever possible. It's much more stable.*

---

## File Downloads Deep Dive

Downloads in Playwright are event-driven. You don't guess usually; you *await* the `download` event.

### The Download Pattern

```typescript
test('download invoice', async ({ page }) => {
  await page.goto('/orders/123');
  
  // 1. Setup the Promise
  const downloadPromise = page.waitForEvent('download');
  
  // 2. Perform the action
  await page.getByRole('button', { name: 'Download PDF' }).click();
  
  // 3. Await the download
  const download = await downloadPromise;
  
  // 4. Assert basics
  expect(download.suggestedFilename()).toBe('invoice-123.pdf');
});
```

---

## Managing Downloaded Files

Files downloaded by Playwright are stored in a temporary directory and are **deleted** when the browser context closes. You *must* save them if you want to keep them or inspect them.

### Saving to Disk

```typescript
// Save to a specific path
await download.saveAs('downloads/invoice-123.pdf');

// Save inside the test-results folder (good for CI artifacts)
import path from 'path';
await download.saveAs(path.join(testInfo.outputDir, 'invoice.pdf'));
```

### Handling Download Failures

Sometimes downloads fail (network error, server error).

```typescript
const failure = await download.failure();
if (failure) {
  console.error(`Download failed: ${failure}`);
  // 'canceled', 'net-error', 'iot-issue'
}
```

---

## Testing File Content

Downloading the file is step one. Verifying it is step two.

### Text/CSV Files

```typescript
import fs from 'fs';

test('verify csv content', async ({ page }) => {
  // ... download code ...
  const download = await downloadPromise;
  const filePath = await download.path();
  
  // Read file
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Verify
  expect(content).toContain('Header,Value');
  expect(content).toContain('Row1,100');
});
```

### PDF Files (Basic)

Playwright doesn't parse PDFs natively. You can use libraries like `pdf-parse`.

```typescript
import pdf from 'pdf-parse';

test('verify pdf text', async ({ page }) => {
  // ... download code ...
  const path = await download.path();
  const dataBuffer = fs.readFileSync(path);
  
  const pdfData = await pdf(dataBuffer);
  expect(pdfData.text).toContain('Total: $500.00');
});
```

### Excel Files

Use `xlsx` library to read Excel files.

```typescript
import XLSX from 'xlsx';

test('verify excel', async ({ page }) => {
  // ... download code ...
  const path = await download.path();
  const workbook = XLSX.readFile(path);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  
  expect(sheet['A1'].v).toBe('Employee ID');
});
```

---

## Common Pitfalls & Troubleshooting

### 1. The "Click and Wait" Race Condition

**Wrong:**
```typescript
await page.click('#download');
// If download completes instantly before next line, you miss the event!
const download = await page.waitForEvent('download'); 
```

**Right:**
```typescript
const downloadPromise = page.waitForEvent('download'); // Listener attached
await page.click('#download'); // Triggers event
const download = await downloadPromise; // Resolves promise
```

### 2. Download opens in new tab instead of downloading

If a PDF opens in the browser, it's not a `download` event; it's a `page` or `popup` event.
However, Playwright allows changing this behavior.

```typescript
// Browsers usually handle this, but you can force headers in network mocking
// or just handle the new page:
const [newPage] = await Promise.all([
  page.context().waitForEvent('page'),
  page.click('a[href$=".pdf"]')
]);
await expect(newPage).toHaveURL(/.*\.pdf/);
```

### 3. File Path Issues in CI

Never use absolute paths like `C:\Users\Name\`.
Always use:
- `path.join(__dirname, 'data/file.txt')`
- Or relative paths `'./data/file.txt'`

---

## Best Practices

| Best Practice | Why? |
|---------------|------|
| **Use `waitForEvent` pattern** | Prevents race conditions where downloads finish before you listen. |
| **Clean up files?** | Not needed! Playwright's temp files auto-delete. Only clean up files you manually `saveAs`. |
| **Validate Contents** | Don't just check the filename. A 0-byte file named "report.pdf" is a bug. |
| **Use `buffer` for inputs** | Keeps repo clean. No need to commit 50 binary files if you can generate them in code. |
| **Set `acceptDownloads: true`** | In `playwright.config.ts`, ensuring the context is ready for downloads. |

**Summary**: You've learned how to bypass system dialogs and reliably handle file uploads and downloads. The next chapter explores the lifecycle of navigation and how to manage multiple tabs and windows.
