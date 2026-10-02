# Chapter 207 — File Uploads & Downloads


This chapter covers how Playwright handles file uploads and downloads.
Interviewers test this topic because file operations involve browser
security boundaries and require patterns (waitForEvent + Promise.all)
that trip up less experienced engineers.

---

## Q207.1 — How does Playwright handle file downloads?

Playwright intercepts downloads at the browser level before they reach the
file system. When a download is triggered, Playwright emits a `download`
event. You listen for this event, then interact with the `Download` object
it provides.

```typescript
// Pattern: start listening BEFORE clicking the download trigger
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Export CSV' }).click();
const download = await downloadPromise;

// Now interact with the download
const filename = download.suggestedFilename(); // 'report-2024.csv'
const path     = await download.path();        // temp file path
const failure  = await download.failure();     // null if successful

// Save to a permanent location
await download.saveAs('./downloads/report.csv');
```

Downloads are stored in a temporary directory and deleted when the browser
context closes. Always `saveAs()` if you need to inspect the file later.

---

## Q207.2 — What is the Download event in Playwright?

The `download` event fires on the `page` object when any download starts.
A `Download` object is passed to the handler.

`Download` object properties:
- `suggestedFilename()` — the filename the server suggested
- `url()` — the URL that triggered the download
- `path()` — async, returns the local temp file path when download completes
- `saveAs(path)` — async, copies the downloaded file to a permanent location
- `failure()` — async, returns null if successful or an error string if failed
- `cancel()` — cancels the in-progress download

```typescript
// Event listener approach (for multiple downloads)
page.on('download', async (download) => {
  console.log('Download started:', download.suggestedFilename());
  await download.saveAs(`./downloads/${download.suggestedFilename()}`);
});

// waitForEvent approach (for one specific download)
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Download' }).click(),
]);
```

---

## Q207.3 — When do you need to test file downloads and uploads in automation?

File download tests are needed for:
- Data export features (CSV, Excel, PDF reports)
- Invoice and receipt generation
- Bulk operations that produce a downloadable result

File upload tests are needed for:
- Profile picture and document uploads
- Bulk data import (CSV import of products, users, records)
- File attachment features (support tickets, notes)

Both are critical business flows. Skipping them in automation means manual
testing for every release — which is exactly the kind of high-risk repetitive
work that automation should cover.

---

## Q207.4 — How does your project handle file uploads and downloads?

In our project, file operations follow standard patterns defined in a helper module.

**Downloads** use the `Promise.all` + `waitForEvent('download')` pattern. The
helper validates both the filename format (using a regex) and the file contents:

```typescript
async function downloadAndVerify(page: Page, buttonName: string) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: buttonName }).click(),
  ]);
  expect(download.failure()).resolves.toBeNull();
  return download;
}
```

**Uploads** use `setInputFiles()` with buffer-based test files for small
uploads and file paths for binary files (PDF, images) stored in `tests/data/`.
We never use absolute paths — always `path.join(__dirname, '../data/file.pdf')`.

---

## Q207.5 — What is waitForEvent and how do you use it with downloads?

`page.waitForEvent(event)` returns a Promise that resolves when the specified
event fires. It is essential for downloads because the download event fires
asynchronously — you must register the listener before triggering the download.

```typescript
// ❌ WRONG — listener registered after click; download may have already started
await page.getByRole('button', { name: 'Download' }).click();
const download = await page.waitForEvent('download'); // might miss the event

// ✅ CORRECT — both start at the same time via Promise.all
const [download] = await Promise.all([
  page.waitForEvent('download'),       // register listener first
  page.getByRole('button', { name: 'Download' }).click(), // then trigger
]);
```

`waitForEvent` is also used for:
- `popup` — new window/tab opened
- `dialog` — alert/confirm/prompt appears
- `filechooser` — file picker dialog opened
- `console` — browser console message

The `Promise.all` pattern is mandatory for all these events. The listener
must be registered before the action that triggers the event.

---

## Q207.6 — How do you set the download path in Playwright?

By default, downloads go to a temporary directory. To redirect downloads:

```typescript
// Option 1 — in playwright.config.ts
use: {
  acceptDownloads: true,          // allow downloads (default in @playwright/test)
}

// Option 2 — custom context (test level)
const context = await browser.newContext({
  acceptDownloads: true,
});

// Option 3 — saveAs after download (most common)
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export' }).click(),
]);
await download.saveAs(path.join(testInfo.outputDir, 'export.csv'));
// testInfo.outputDir is unique per test — no file name collisions in parallel runs
```

Using `testInfo.outputDir` is the best practice for CI. It creates a unique
directory per test, so parallel test runs never collide on filenames.

---

## Q207.7 — What is the difference between page.setInputFiles and dragging a file to an upload area?

`page.setInputFiles()` (or `locator.setInputFiles()`) sets the files on an
`<input type="file">` element directly. It bypasses the native OS file picker
dialog and works in headless mode.

```typescript
await page.getByLabel('Upload Document').setInputFiles('./tests/data/sample.pdf');
```

Dragging a file simulates the HTML5 drag-and-drop upload event, which is
needed when the upload area is a drop zone (no `<input type="file">`).

```typescript
// For a pure drop zone without a file input
const dataTransfer = await page.evaluateHandle(() => {
  const dt = new DataTransfer();
  const file = new File(['content'], 'test.txt', { type: 'text/plain' });
  dt.items.add(file);
  return dt;
});
await page.getByTestId('drop-zone').dispatchEvent('drop', { dataTransfer });
```

**In practice:** most upload areas — even those with a custom drop zone UI —
have a hidden `<input type="file">` underneath. `setInputFiles()` works on
that hidden input. Try `setInputFiles` first; only use the DataTransfer
approach if the upload area has no input element.

---

## Q207.8 — What is the difference between download.path() and download.saveAs()?

`download.path()` — returns the path of the temporary file in Playwright's
temp directory. The file exists only until the browser context closes.
The path is available after the download completes.

`download.saveAs(destination)` — copies the downloaded file from the temp
directory to a permanent location you specify. After `saveAs`, the file
persists after the context closes.

```typescript
const download = await page.waitForEvent('download');

// Just get the temp path (for reading during the test)
const tempPath = await download.path();
const content = fs.readFileSync(tempPath!, 'utf8');
expect(content).toContain('Order,Customer,Total');

// Save permanently (for CI artifacts, post-test inspection)
await download.saveAs('./test-artifacts/report.csv');
```

Use `path()` when you just need to read the file during the test.
Use `saveAs()` when you need the file to persist after the test for CI
artifact collection or manual review.

---

## Q207.9 — What is the difference between waitForEvent('download') and waitForDownload?

There is no `waitForDownload` method in Playwright's core API. The correct
method is `page.waitForEvent('download')`.

`page.waitForEvent('download')` returns a Promise that resolves with the
`Download` object when the download event fires.

```typescript
// Correct — the only download waiting API
const downloadPromise = page.waitForEvent('download');
await page.getByRole('button', { name: 'Download' }).click();
const download = await downloadPromise;
```

Some older Playwright documentation or community examples may reference
`page.waitForDownload()` — this was briefly available in early alpha versions
but was removed. `waitForEvent('download')` is the stable API.

---

## Q207.10 — When should you verify the download content vs just the filename?

**Verify only the filename when:**
- The download is generated dynamically and the filename format confirms the
  correct operation (e.g., `export_2024-01-15_14-30.csv`)
- The content is too large or complex to parse in a test
- A downstream test will validate the imported data

**Verify the content when:**
- The feature being tested is "does this export contain the correct data?"
- The file is a structured format (CSV, JSON) that is easy to parse
- Incorrect content would not be detectable by filename alone

```typescript
// Filename validation only
const filename = download.suggestedFilename();
expect(filename).toMatch(/^orders_\d{4}-\d{2}-\d{2}\.csv$/);

// Content validation
const tempPath = await download.path();
const content  = fs.readFileSync(tempPath!, 'utf8');
const rows     = content.split('\n');
expect(rows[0]).toBe('Order ID,Customer,Total,Status');  // header row
expect(rows.length).toBeGreaterThan(1); // at least one data row
```

Content verification adds real value for exports. A test that only checks
the filename does not verify that the correct data was exported.

---

## Q207.11 — What is wrong with not using Promise.all when triggering a download?

```typescript
// ❌ Race condition — download may fire before the listener is registered
await page.getByRole('button', { name: 'Export' }).click();
const download = await page.waitForEvent('download'); // may miss the event
```

If the click triggers a fast download (immediate response from the server),
the `download` event fires before `waitForEvent` registers the listener.
The listener never fires. The `await waitForEvent` hangs until it times out.

This is a race condition: the event happens before the handler is ready.

```typescript
// ✅ Correct — listener registered before click, both start simultaneously
const [download] = await Promise.all([
  page.waitForEvent('download'),
  page.getByRole('button', { name: 'Export' }).click(),
]);
```

`Promise.all` starts both Promises simultaneously. `waitForEvent` registers
the listener first (before the Promise resolves). The click triggers the
download. The listener catches it.

This pattern is mandatory for downloads, popups, dialogs, and file choosers
— any event that fires as a result of an action.

---

## Q207.12 — How does Playwright file handling compare to Selenium's approach?

| | Playwright | Selenium |
|---|---|---|
| File upload | `setInputFiles(path or buffer)` | `sendKeys(absolutePath)` on input element |
| Generated files | `{ name, mimeType, buffer }` object — no disk file needed | Must create physical file on disk |
| Downloads | `waitForEvent('download')` + `saveAs()` | No built-in download API — use browser preferences or proxy |
| Headless support | Full support | Download path config required |
| Download path | Temp dir, use `saveAs()` | Must configure browser download directory upfront |
| File chooser dialogs | `waitForEvent('filechooser')` | No native support — requires OS automation (AutoIT, Robot Framework) |

Playwright's file handling is significantly cleaner. Selenium's download
testing requires configuring browser download preferences before launch and
waiting with `Thread.sleep()` for files to appear on disk. Playwright's
event-driven model is deterministic — you know exactly when the download is
complete because you awaited the Promise.

---

## Q207.13 — Write code to click a download button and verify the downloaded file

```typescript
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test('orders CSV export contains correct data', async ({ page }, testInfo) => {
  await page.goto('/orders');

  // Filter to show only completed orders before exporting
  await page.getByRole('combobox', { name: 'Status' }).selectOption('completed');
  await page.getByRole('button', { name: 'Apply Filters' }).click();
  await page.waitForResponse(r => r.url().includes('/api/orders') && r.status() === 200);

  // Trigger the download — listener MUST be registered before click
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Export CSV' }).click(),
  ]);

  // Verify the download did not fail
  expect(await download.failure()).toBeNull();

  // Verify filename format — contains today's date
  const filename = download.suggestedFilename();
  expect(filename).toMatch(/^orders-completed-\d{4}-\d{2}-\d{2}\.csv$/);

  // Save and verify content
  const savePath = path.join(testInfo.outputDir, 'orders.csv');
  await download.saveAs(savePath);

  const content = fs.readFileSync(savePath, 'utf8');
  const lines = content.split('\n').filter(l => l.trim().length > 0);

  // Verify header
  expect(lines[0]).toBe('Order ID,Customer,Total,Status,Date');

  // Verify all rows are completed orders
  const dataRows = lines.slice(1);
  for (const row of dataRows) {
    expect(row).toContain('completed');
  }
});
```

---

## Q207.14 — Write code to upload a file to a file input and verify the upload succeeded

```typescript
import { test, expect } from '@playwright/test';
import * as path from 'path';

test('user can upload a profile document', async ({ page }) => {
  await page.goto('/profile/documents');

  // Upload from a file path
  await page.getByLabel('Upload Document').setInputFiles(
    path.join(__dirname, '../data/sample-document.pdf')
  );

  // Click the submit button after selecting the file
  await page.getByRole('button', { name: 'Upload' }).click();

  // Wait for the upload to complete (API response)
  await page.waitForResponse(r =>
    r.url().includes('/api/documents/upload') && r.status() === 200
  );

  // Verify the uploaded file appears in the documents list
  await expect(
    page.getByRole('row').filter({ hasText: 'sample-document.pdf' })
  ).toBeVisible();

  // Alternative: upload a generated buffer (no physical file needed)
  const csvContent = 'Name,Value\nTest,123\n';
  await page.getByLabel('Import CSV').setInputFiles({
    name:     'import-data.csv',
    mimeType: 'text/csv',
    buffer:   Buffer.from(csvContent),
  });
});
```

---

## Q207.15 — Describe a file download or upload test you implemented and a challenge you faced

In our project we tested a bulk import feature where users upload a CSV of
products. The upload had three outcomes: success with a count, partial success
with a list of failed rows, and complete failure.

The initial test just uploaded and checked for the success message. It passed
most of the time but occasionally failed with a timeout on `waitForResponse`.

The root cause: the upload triggered a server-side processing job. The HTTP
response came back immediately with `{ status: "processing", jobId: "123" }`,
but the actual processing happened asynchronously. A polling endpoint at
`/api/import-jobs/123` updated every second.

The original test was waiting for the upload response — which came back in
under a second. But the success message on the page depended on the job
completing, which took 2–8 seconds. We were asserting the success message
before it appeared.

The fix:

```typescript
// Wait for the upload response
const [uploadResponse] = await Promise.all([
  page.waitForResponse(r => r.url().includes('/api/import') && r.status() === 202),
  page.getByRole('button', { name: 'Import Products' }).click(),
]);
const { jobId } = await uploadResponse.json();

// Poll for job completion
await expect.poll(
  async () => {
    const status = await request.get(`/api/import-jobs/${jobId}`).then(r => r.json());
    return status.state;
  },
  { timeout: 15_000, intervals: [1000, 2000, 3000] }
).toBe('completed');

// Now assert the success message
await expect(page.getByRole('alert')).toHaveText(/Import completed: 42 products added/);
```

`expect.poll` retried the job status check with backoff until it read
`'completed'`. The test became reliable across all environments.

---

## Chapter Summary — Key Points for Your Interview

- Always use `Promise.all` with `waitForEvent('download')` before clicking.
  Registering the listener after the click is a race condition.
- `setInputFiles()` bypasses the OS file picker. It accepts a file path, a
  buffer object, or an array of files.
- `download.path()` is the temp file path. `download.saveAs()` copies it
  permanently. Use `testInfo.outputDir` for CI artifacts.
- Verify download content (not just filename) when the feature being tested
  is the correctness of exported data.
- For async processing after upload, use `expect.poll()` rather than a fixed
  `waitForTimeout` — it retries until the condition is met.

---
