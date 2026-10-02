# Chapter 507 — Reusable Web Action Helpers (L6)

This chapter covers the five helper classes — `WaitHelpers`, `WebActions`,
`OrangeHRMControls`, `AssertionHelpers`, and `DateHelpers` — that eliminate
duplicated interaction patterns across page objects. Interviewers ask about
helpers to distinguish engineers who understand composition from those who
default to inheritance, and to probe whether candidates can explain why
a single seam like `WebActions` matters for cross-cutting concerns like
self-healing and error classification. The `execute()` wrapper pattern and
the three custom error classes are particularly strong differentiators at
senior level.

---

## Q507.1 — What problem does the helper layer solve?

After Level 5, page objects each implement their own version of the same
interaction patterns. The OrangeHRM dropdown interaction appears three times
across `AddUserPage`, `ApplyLeavePage`, and `PersonalDetailsPage`:

```typescript
// AddUserPage.ts
async selectUserRole(role: 'Admin' | 'ESS'): Promise<void> {
  await this.userRoleDropdown.click();
  await this.page.getByRole('option', { name: role }).click();
}

// ApplyLeavePage.ts
async selectLeaveType(leaveType: string): Promise<void> {
  await this.leaveTypeDropdown.click();
  await this.page.getByRole('option', { name: leaveType }).click();
}
```

Identical pattern, three copies. The same duplication exists for autocomplete
fields, date inputs, table row actions, and confirmation dialogs.

When OrangeHRM upgrades its Vue component library and the dropdown selector
changes from `.oxd-select-option` to something else, every page object with
a dropdown needs updating. The helper layer reduces that to a single change
in `OrangeHRMControls`.

---

## Q507.2 — What are the five helpers and what does each one own?

| Helper | Responsibility |
|--------|---------------|
| `WaitHelpers` | Targeted waits for OrangeHRM's async UI patterns — spinner, toast, dropdown, autocomplete, URL change |
| `WebActions` | Generic browser interactions — click, fill, check, hover, upload, scroll — with centralised error classification via `execute()` |
| `OrangeHRMControls` | Application-specific UI components — custom dropdown, autocomplete, date input, confirmation dialog, table row action, file upload |
| `AssertionHelpers` | Composite assertions — table row count, table cell content with soft assertions, dropdown value, toast message, form validation errors |
| `DateHelpers` | Date formatting — converts between ISO (`yyyy-mm-dd`) and OrangeHRM's expected format (`yyyy-dd-mm`) |

The interaction stack:
```
Page Objects
    ↓ calls
OrangeHRMControls   ← OrangeHRM-specific sequences
    ↓ calls
WebActions          ← generic interactions + error classification
    ↓ calls
Playwright API      ← browser automation
```

`WebActions` is the single seam between the framework and the browser.
Any cross-cutting concern — error classification, logging, self-healing —
added here benefits every page object automatically.

---

## Q507.3 — Why do helpers use composition instead of inheritance?

**Inheritance** — the class IS-A base class (`LoginPage extends BasePage`).
Use when the child is a more specific version of the parent.

**Composition** — the class HAS-A helper (`AddUserPage` has a `WebActions`).
Use when the child uses something as a tool rather than categorically being it.

```typescript
// Inheritance — LoginPage IS-A BasePage
export class LoginPage extends BasePage { ... }

// Composition — AddUserPage HAS-A WebActions
export class AddUserPage extends BasePage {
  private readonly actions:  WebActions;
  private readonly controls: OrangeHRMControls;

  constructor(page: Page) {
    super(page);
    this.actions  = new WebActions(page);     // tool, not a base class
    this.controls = new OrangeHRMControls(page);
  }
}
```

A page object is a page — it IS-A `BasePage`. It is not a `WebActions`.
`WebActions` is a tool it uses. Inheriting from `WebActions` would mean
"a page is a kind of action set", which is not true. Composition expresses
the right relationship and avoids the rigidity of deep inheritance chains.

TypeScript only allows single inheritance — a class that extends `BasePage`
cannot also extend `WebActions`. Composition removes this constraint:
a page object can use any combination of helpers regardless of inheritance.

---

## Q507.4 — What is the execute() wrapper in WebActions and why does it matter?

`execute()` is a private generic method that every public `WebActions` method
routes through. It provides centralised error classification:

```typescript
// helpers/WebActions.ts
private async execute<T>(
  action:  string,
  locator: Locator,
  fn:      () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const cause       = error as Error;
    const locatorDesc = locator.toString();

    if (cause.message.includes('Timeout') || cause.message.includes('timeout')) {
      throw new TimeoutError(action, locatorDesc, cause);
    }
    if (
      cause.message.includes('not found')   ||
      cause.message.includes('not visible') ||
      cause.message.includes('not attached')
    ) {
      throw new ElementNotFoundError(action, locatorDesc, cause);
    }
    throw new ActionError(action, locatorDesc, cause);
  }
}

// Usage — every public method uses execute()
async click(locator: Locator): Promise<void> {
  await this.execute('click', locator, () => locator.click());
}

async fill(locator: Locator, value: string): Promise<void> {
  await this.execute('fill', locator, async () => {
    await locator.clear();
    await locator.fill(value);
  });
}
```

Without `execute()`, each page object and helper method would need its
own try/catch. With it, error classification is defined once and applied
everywhere automatically.

---

## Q507.5 — What are the three custom error classes and why does each one matter?

```typescript
// helpers/errors.ts

// Base class — preserves the original Playwright stack trace
export class ActionError extends Error {
  constructor(
    public readonly action:  string,
    public readonly locator: string,
    public readonly cause:   Error,
  ) {
    super(`[${action}] failed on "${locator}": ${cause.message}`);
    this.name  = 'ActionError';
    this.stack = cause.stack;  // preserves original trace — not the rethrow trace
  }
}

// Thrown when Playwright's action timeout expires
export class TimeoutError extends ActionError {
  constructor(action: string, locator: string, cause: Error) {
    super(action, locator, cause);
    this.name = 'TimeoutError';
  }
}

// Thrown when the locator cannot find the element in the DOM
export class ElementNotFoundError extends ActionError {
  constructor(action: string, locator: string, cause: Error) {
    super(action, locator, cause);
    this.name = 'ElementNotFoundError';
  }
}
```

Why three classes matter:

**For debugging:** `ElementNotFoundError` means the locator is wrong — check
the selector. `TimeoutError` means the element exists but the page is slow —
check timing or add a wait. A generic `Error` tells you neither.

**For self-healing (Level 9):** when the healer sees `ElementNotFoundError`
it looks for a new locator. When it sees `TimeoutError` it suggests increasing
the timeout. Different error types drive different healing strategies.

**For Allure reporting:** categories can be configured to separate
`ElementNotFoundError` failures (locator defects) from `TimeoutError`
failures (environment issues) in the report — keeping them visually distinct.

---

## Q507.6 — What does WaitHelpers provide and why is it built first?

`WaitHelpers` is built first because both `WebActions` and `OrangeHRMControls`
depend on it. The key methods:

```typescript
// Waits for OrangeHRM's loading spinner to disappear
async waitForSpinnerToDisappear(timeout = 10_000): Promise<void> {
  const spinner = this.page.locator('.oxd-loading-spinner');
  try {
    await spinner.waitFor({ state: 'hidden', timeout });
  } catch {
    // Spinner was not in the DOM at all — that is fine
  }
}

// Waits for table rows OR the "No Records Found" message — whichever comes first
async waitForTableToLoad(tableLocator: Locator, timeout = 10_000): Promise<void> {
  await this.waitForSpinnerToDisappear(timeout);
  const noRecords = this.page.getByText('No Records Found');
  await Promise.race([
    tableLocator.locator('role=row').first().waitFor({ state: 'visible', timeout }),
    noRecords.waitFor({ state: 'visible', timeout }),
  ]).catch(() => {});  // if neither appears, proceed — assertion will catch it
}

// Returns the toast locator so callers can chain assertions
async waitForToastToAppear(timeout = 10_000): Promise<Locator> {
  const toast = this.page.locator('.oxd-toast-content');
  await toast.waitFor({ state: 'visible', timeout });
  return toast;
}

// Waits for dropdown options to become visible after a dropdown is clicked
async waitForDropdownOptionsToAppear(timeout = 10_000): Promise<void> {
  await this.page.locator('.oxd-select-options').waitFor({ state: 'visible', timeout });
}

// Waits for the URL to change — useful after form submissions with unpredictable redirects
async waitForURLChange(timeout = 10_000): Promise<void> {
  const currentURL = this.page.url();
  await this.page.waitForFunction(
    (url: string) => window.location.href !== url,
    currentURL,
    { timeout }
  );
}
```

`BasePage.waitForPageLoad()` uses `networkidle` — it waits for all network
traffic to stop. `WaitHelpers` provides targeted waits tied to specific UI
elements, which is faster and more reliable on OrangeHRM's shared demo site.

---

## Q507.7 — What does OrangeHRMControls cover and how does the dropdown flow work?

```typescript
// helpers/OrangeHRMControls.ts

// Custom Vue dropdown — NOT a native <select>
async selectDropdown(dropdownLocator: Locator, optionText: string): Promise<void> {
  await this.actions.click(dropdownLocator);              // 1. open
  await this.waits.waitForDropdownOptionsToAppear();      // 2. wait for options
  const option = this.page
    .locator('.oxd-select-option')
    .filter({ hasText: optionText })
    .describe(`"${optionText}" option in dropdown`);
  await this.actions.click(option);                      // 3. select
  await this.waits.waitForDropdownOptionsToDisappear();  // 4. confirm closed
}

// Autocomplete field — types, waits for suggestions, clicks first match
async fillAutocomplete(inputLocator: Locator, searchText: string): Promise<void> {
  await this.actions.fill(inputLocator, searchText);
  await this.waits.waitForAutocompleteToAppear();
  const firstOption = this.page.locator('.oxd-autocomplete-option').first();
  await this.actions.click(firstOption);
  await this.waits.waitForAutocompleteToDisappear();
}

// Date input — fills then presses Tab (OrangeHRM reverts without Tab)
// Verifies the value was accepted (OrangeHRM clears invalid dates silently)
async fillDateInput(inputLocator: Locator, formattedDate: string): Promise<void> {
  await this.actions.fill(inputLocator, formattedDate);
  await this.actions.pressKey(inputLocator, 'Tab');
  const actualValue = await inputLocator.inputValue();
  if (!actualValue) {
    throw new Error(
      `fillDateInput: date field rejected "${formattedDate}". ` +
      `OrangeHRM expects format yyyy-dd-mm. ` +
      `Use DateHelpers.formatToOrangeHRM() to produce the correct string.`
    );
  }
}

// Confirmation dialog — waits for modal, clicks confirm, waits for modal to close
async handleConfirmationDialog(confirmButtonName = 'Ok'): Promise<void> {
  const modal = this.page.locator('.oxd-dialog-container');
  await modal.waitFor({ state: 'visible' });
  const confirmButton = modal.getByRole('button', { name: confirmButtonName });
  await this.actions.click(confirmButton);
  await modal.waitFor({ state: 'hidden' });
}

// Table row action — scopes button to the correct row by row identifier
async clickTableRowAction(
  tableLocator: Locator, rowIdentifier: string, actionName: string
): Promise<void> {
  const row = tableLocator
    .getByRole('row', { name: new RegExp(rowIdentifier, 'i') });
  await this.actions.scrollIntoView(row);
  await this.actions.click(row.getByRole('button', { name: actionName }));
}
```

---

## Q507.8 — How does DateHelpers handle OrangeHRM's non-standard date format?

OrangeHRM date inputs expect `yyyy-dd-mm` — day and month are swapped
compared to standard ISO 8601 (`yyyy-mm-dd`). This is a source of silent
failures: filling `2025-01-15` when the field expects `2025-15-01` causes
OrangeHRM to silently clear the field with no error message.

```typescript
// helpers/DateHelpers.ts

// JavaScript Date → OrangeHRM format
static formatToOrangeHRM(date: Date): string {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${day}-${month}`;  // ← day before month
}

// ISO string → OrangeHRM format
static fromISO(isoDateString: string): string {
  const [year, month, day] = isoDateString.split('-');
  if (!year || !month || !day) {
    throw new Error(`DateHelpers.fromISO: "${isoDateString}" is not a valid ISO date.`);
  }
  return `${year}-${day}-${month}`;  // ← swap day and month
}

// Validates a string is in OrangeHRM's format (with calendar-aware day checking)
static isValidOrangeHRMDate(dateString: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return false;
  const [year, day, month] = dateString.split('-').map(Number);
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31)     return false;
  const maxDays = new Date(year, month, 0).getDate();  // last day of month
  return day <= maxDays;
}
```

Usage in a page object that accepts ISO dates from the test:
```typescript
// PersonalDetailsPage.ts
async fillDateOfBirth(isoDate: string): Promise<void> {
  const orangeHRMDate = DateHelpers.fromISO(isoDate);  // '2025-01-15' → '2025-15-01'
  await this.controls.fillDateInput(this.dobInput, orangeHRMDate);
}
```

The test passes ISO format (human-readable). The page object converts it
to OrangeHRM format before filling. The conversion happens in exactly one
place; tests never think about date format details.

---

## Q507.9 — What does AssertionHelpers provide and when should you use soft assertions?

```typescript
// helpers/AssertionHelpers.ts

// Composite table row assertion using soft assertions
async assertTableRowContains(
  tableLocator:   Locator,
  rowIdentifier:  string,
  expectedValues: Record<string, string>
): Promise<void> {
  await this.waits.waitForTableToLoad(tableLocator);
  const row = tableLocator
    .getByRole('row', { name: new RegExp(rowIdentifier, 'i') });
  await expect(row).toBeVisible();

  for (const [key, value] of Object.entries(expectedValues)) {
    await expect.soft(
      row.getByText(value),
      `Expected row "${rowIdentifier}" to contain ${key}: "${value}"`
    ).toBeVisible();
  }
}

// Toast message assertion — checks text, not just visibility
async assertToastMessage(expectedMessage: string): Promise<void> {
  const toast = await this.waits.waitForToastToAppear();
  await expect(toast.locator('.oxd-toast-content-text')).toHaveText(expectedMessage);
}

// Form validation error — finds error by field label
async assertFormValidationError(fieldLabel: string, expectedError: string): Promise<void> {
  const formGroup = this.page
    .locator('.oxd-input-group')
    .filter({ has: this.page.getByText(fieldLabel) });
  const errorMessage = formGroup.locator('.oxd-input-field-error-message');
  await expect(errorMessage).toHaveText(expectedError);
}
```

**When to use `expect.soft()`:** when verifying multiple independent fields
on the same page — form values, table cell contents, profile details. If
the first field fails, `expect.soft()` continues and reports all failures
together. Use standard `expect()` for sequential steps where a failure on
step 1 makes step 2 meaningless.

```typescript
// Standard — stops at first failure
await expect(firstNameInput).toHaveValue('Alice');    // fails → test stops
await expect(lastNameInput).toHaveValue('Johnson');   // never reached

// Soft — all run, all reported
await expect.soft(firstNameInput).toHaveValue('Alice');
await expect.soft(lastNameInput).toHaveValue('Johnson');
await expect.soft(employeeIdInput).toHaveValue('EMP-001');
// All three failures shown in the report simultaneously
```

---

## Q507.10 — How do page objects use helpers through composition?

Page objects that need generic and OrangeHRM-specific interactions use
both `WebActions` and `OrangeHRMControls`:

```typescript
// pages/admin/AddUserPage.ts
export class AddUserPage extends BasePage {

  private readonly actions:  WebActions;
  private readonly controls: OrangeHRMControls;
  private readonly waits:    WaitHelpers;

  constructor(page: Page) {
    super(page);
    this.actions  = new WebActions(page);
    this.controls = new OrangeHRMControls(page);
    this.waits    = new WaitHelpers(page);
  }

  // Generic text input — uses WebActions directly
  async fillUsername(username: string): Promise<void> {
    await this.actions.fill(this.usernameInput, username);
  }

  // OrangeHRM custom dropdown — uses OrangeHRMControls
  async selectUserRole(role: 'Admin' | 'ESS'): Promise<void> {
    await this.controls.selectDropdown(this.userRoleDropdown, role);
  }

  // OrangeHRM autocomplete — uses OrangeHRMControls
  async fillEmployeeName(employeeName: string): Promise<void> {
    await this.controls.fillAutocomplete(this.employeeNameInput, employeeName);
  }
}
```

The rule: generic interactions (`fill`, `click`, `check`) go through
`actions`. OrangeHRM-specific components (dropdown, autocomplete, date,
dialog) go through `controls`.

---

## Q507.11 — How does the refactored AddUserPage compare to Level 3?

**Level 3 — inline interaction logic:**
```typescript
async selectUserRole(role: 'Admin' | 'ESS'): Promise<void> {
  await this.userRoleDropdown.click();
  await this.page.getByRole('option', { name: role }).click();
  // No wait for dropdown to close — intermittent failures
}

async fillEmployeeName(employeeName: string): Promise<void> {
  await this.employeeNameInput.fill(employeeName);
  await this.page.locator('.oxd-autocomplete-option').first().click();
  // No wait for suggestions to appear — race condition risk
}
```

**Level 6 — single-line delegations:**
```typescript
async selectUserRole(role: 'Admin' | 'ESS'): Promise<void> {
  await this.controls.selectDropdown(this.userRoleDropdown, role);
  // OrangeHRMControls: opens → waits → selects → waits for close
}

async fillEmployeeName(employeeName: string): Promise<void> {
  await this.controls.fillAutocomplete(this.employeeNameInput, employeeName);
  // OrangeHRMControls: fills → waits for suggestions → clicks first → waits for close
}
```

The page object methods become single-line delegations. The interaction
logic — with all its waiting and error handling — lives in one place.
A race condition in the autocomplete is fixed once in `OrangeHRMControls`
and the fix applies to every page object that uses autocomplete.

---

## Q507.12 — What does PersonalDetailsPage look like fully using the helper layer?

```typescript
// pages/pim/PersonalDetailsPage.ts
import { BasePage }           from '../BasePage';
import { WebActions }         from '../../helpers/WebActions';
import { OrangeHRMControls }  from '../../helpers/OrangeHRMControls';
import { WaitHelpers }        from '../../helpers/WaitHelpers';
import { DateHelpers }        from '../../helpers/DateHelpers';

export class PersonalDetailsPage extends BasePage {

  private readonly actions:  WebActions;
  private readonly controls: OrangeHRMControls;
  private readonly waits:    WaitHelpers;

  constructor(page: Page) {
    super(page);
    this.actions  = new WebActions(page);
    this.controls = new OrangeHRMControls(page);
    this.waits    = new WaitHelpers(page);
    // locators...
  }

  async goto(empNumber: string): Promise<void> {
    await this.navigate(`/web/index.php/pim/viewPersonalDetails/empNumber/${empNumber}`);
  }

  // Test passes ISO date ('2025-01-15') → DateHelpers converts → OrangeHRMControls fills
  async fillDateOfBirth(isoDate: string): Promise<void> {
    const orangeHRMDate = DateHelpers.fromISO(isoDate);
    await this.controls.fillDateInput(this.dobInput, orangeHRMDate);
  }

  // OrangeHRM custom dropdown
  async selectNationality(nationality: string): Promise<void> {
    await this.controls.selectDropdown(this.nationalityDropdown, nationality);
  }

  // Gender radio button — generic interaction via WebActions
  async selectGender(gender: 'Male' | 'Female'): Promise<void> {
    const radio = gender === 'Male' ? this.genderMaleRadio : this.genderFemaleRadio;
    await this.actions.check(radio);
  }

  // File upload with preview confirmation
  async uploadProfilePhoto(filePath: string): Promise<void> {
    await this.controls.uploadFile(this.photoUploadInput, filePath);
  }

  async savePersonalDetails(): Promise<void> {
    await this.actions.click(this.saveButton);
    await this.waits.waitForToastToAppear();
  }
}
```

This page object uses four helpers in one class. The helpers are invisible
to the test — tests see only `fillDateOfBirth('2025-01-15')`, `selectGender('Female')`,
and `uploadProfilePhoto('test-data/photos/profile.jpg')`.

---

## Q507.13 — What is the helpers/index.ts barrel export and why does it matter?

```typescript
// helpers/index.ts
export { WaitHelpers }        from './WaitHelpers';
export { WebActions }         from './WebActions';
export { OrangeHRMControls }  from './OrangeHRMControls';
export { AssertionHelpers }   from './AssertionHelpers';
export { DateHelpers }        from './DateHelpers';
export { ActionError, TimeoutError, ElementNotFoundError } from './errors';
```

Without the barrel export, page objects import from individual files:
```typescript
import { WebActions }        from '../../helpers/WebActions';
import { OrangeHRMControls } from '../../helpers/OrangeHRMControls';
import { WaitHelpers }       from '../../helpers/WaitHelpers';
```

With the barrel export, they import from one path:
```typescript
import { WebActions, OrangeHRMControls, WaitHelpers } from '../../helpers';
```

If `WebActions.ts` is ever renamed or moved, updating the barrel export
fixes all page objects. Without it, every page object's import path must
be updated individually.

---

## Q507.14 — Why is WebActions application-agnostic while OrangeHRMControls is not?

**`WebActions`** covers Playwright browser interactions — clicking, filling,
checking, uploading. These work on any web application. Nothing in `WebActions`
knows about OrangeHRM's Vue component library, class names, or behaviour.

**`OrangeHRMControls`** covers OrangeHRM-specific components — `.oxd-select-option`,
`.oxd-autocomplete-option`, `.oxd-dialog-container`. These class names are
OrangeHRM-specific. If you move to a different application, `WebActions`
is unchanged; `OrangeHRMControls` is replaced with `NewAppControls`.

The separation means: when OrangeHRM upgrades its component library and
`.oxd-select-option` changes, only `OrangeHRMControls` needs updating.
`WebActions`, all page objects, and all tests are untouched.

---

## Q507.15 — How does WebActions.fill() differ from calling locator.fill() directly?

```typescript
// Direct Playwright call — no error classification, no consistent clearing
await this.usernameInput.fill(username);

// WebActions.fill() — clears first, then fills, with error classification
async fill(locator: Locator, value: string): Promise<void> {
  await this.execute('fill', locator, async () => {
    await locator.clear();
    await locator.fill(value);
  });
}
```

Differences:

**Clear before fill:** `WebActions.fill()` always clears the field first.
Calling `fill()` directly on a field with existing content appends in some
OrangeHRM inputs. Clearing first ensures consistent behaviour.

**Error classification:** if the field is not found, `ElementNotFoundError`
is thrown with the field name and action. If the fill times out, `TimeoutError`
is thrown. A direct call throws Playwright's raw error — less descriptive.

**Single responsibility:** all fill logic — clear, fill, error handling —
lives in one place. When a clearing issue is discovered on a specific input
type, the fix goes in `WebActions.fill()` and applies everywhere.

---

## Q507.16 — How does waitForTableToLoad() prevent intermittent test failures?

OrangeHRM tables load asynchronously after search. Asserting on the table
immediately after triggering a search risks an assertion against an empty,
still-loading table:

```typescript
// Fragile — asserts before table finishes loading
await employeeListPage.searchByEmployeeName('Alice');
await expect(tableBody.getByRole('row')).toHaveCount(1);  // intermittent fail

// Stable — waits for table OR "No Records Found" before asserting
async waitForTableToLoad(tableLocator: Locator, timeout = 10_000): Promise<void> {
  await this.waitForSpinnerToDisappear(timeout);
  const noRecords = this.page.getByText('No Records Found');
  await Promise.race([
    tableLocator.locator('role=row').first().waitFor({ state: 'visible', timeout }),
    noRecords.waitFor({ state: 'visible', timeout }),
  ]).catch(() => {});
}
```

`Promise.race()` resolves as soon as either the first row appears or the
no-records message appears. This handles both cases: a successful search
(rows appear) and an empty search (no-records message appears). The test
never asserts against a mid-load empty state.

---

## Q507.17 — What changes at the page object level but not at the test level?

Page objects are refactored to use helpers; tests are not changed at all.
This is a fundamental property of the POM pattern: the "HOW" of interaction
lives in page objects (and now in helpers); the "WHAT" of the scenario lives
in tests.

Before refactoring (Level 5 test):
```typescript
test('admin can add user', async ({ addUserPage }) => {
  await addUserPage.addUser(user);
  await addUserPage.assertUserSavedSuccessfully();
});
```

After refactoring (Level 6 test — identical):
```typescript
test('admin can add user', async ({ addUserPage }) => {
  await addUserPage.addUser(user);
  await addUserPage.assertUserSavedSuccessfully();
});
```

The test cannot tell whether `addUser()` calls `this.page.getByRole().click()`
directly or delegates through `OrangeHRMControls.selectDropdown()`. It does
not need to know. The helper refactoring is invisible to tests — this is
the correct signal that the abstraction boundary is in the right place.

---

## Q507.18 — What does Level 6 not solve?

Level 6 eliminates duplicated interaction patterns. The remaining problems:

**No test organisation at scale:** with the full framework in place the
suite has 40+ tests. When 10 fail in CI there is no immediate way to see
whether they are smoke tests, all in one module, or all related to one
component. Level 7 introduces tagging by module and severity, structured
subset runs (`@smoke`, `@regression`, `@pim`), and custom reporters
producing output shaped for different audiences.

**No Allure integration:** the error class hierarchy (`ElementNotFoundError`,
`TimeoutError`) is defined but not yet wired to Allure's failure
categorisation. Level 7 configures Allure to map error types to categories
and adds the Allure reporter alongside the HTML reporter.

---

## Chapter Summary

- The helper layer eliminates duplicated interaction patterns — the same dropdown selection logic had three copies before Level 6; after, it lives once in `OrangeHRMControls`.
- Helpers use **composition** (page object HAS-A helper) not inheritance — helpers are tools, not categories; TypeScript's single-inheritance limit makes composition the only viable option for using multiple helpers.
- `WebActions` is application-agnostic; `OrangeHRMControls` knows OrangeHRM's Vue component class names — separating them means `WebActions` is reusable across applications.
- `execute()` in `WebActions` is the central seam — all interactions route through it; cross-cutting concerns (error classification, logging, self-healing) are added once and apply everywhere.
- Three error classes: `ElementNotFoundError` (wrong locator), `TimeoutError` (element exists but slow), `ActionError` (base catch-all); each drives a different debugging and self-healing strategy.
- `WaitHelpers` provides targeted waits (`waitForSpinnerToDisappear`, `waitForTableToLoad`, `waitForToastToAppear`) — more targeted than `networkidle`, avoiding intermittent failures on OrangeHRM's async tables.
- `OrangeHRMControls.selectDropdown()` four-step sequence: click → wait for options → click option → wait for close; each step routes through `WebActions` for error classification.
- `OrangeHRMControls.fillDateInput()` presses `Tab` after fill and verifies the value — OrangeHRM silently clears invalid dates and reverts without Tab.
- `DateHelpers` converts between ISO (`yyyy-mm-dd`) and OrangeHRM's format (`yyyy-dd-mm`) — day and month are swapped; tests always pass ISO, page objects convert before filling.
- `AssertionHelpers` uses `expect.soft()` for independent field checks — all failures reported together; uses `expect()` for sequential dependencies.
- `helpers/index.ts` barrel export — page objects import from `'../helpers'` not individual files; a single location to update if files move.
- `PersonalDetailsPage` is the showcase: uses `WebActions`, `OrangeHRMControls`, `WaitHelpers`, and `DateHelpers` in one class.
- Tests do not change at Level 6 — the refactoring is completely invisible to the test layer; this confirms the abstraction boundary is in the right place.
- Level 6 solves interaction duplication; it leaves test organisation (Level 7) and Allure failure categorisation (Level 7) for the next level.
