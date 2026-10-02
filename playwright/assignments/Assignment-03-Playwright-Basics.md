# Assignment: Playwright Basics

**Topics Covered:** Playwright Setup, Locators, Actions, Assertions, Page Object Model Intro  
**Difficulty:** Beginner to Intermediate  
**Estimated Time:** 5-6 hours  
**Reference:** `Week1-Day3-Playwright-Basics.md`  

---

## 📋 Learning Objectives

By completing this assignment, you will:
- ✅ Set up and configure Playwright projects
- ✅ Master all locator strategies (role, text, CSS, XPath)
- ✅ Perform browser actions (click, type, navigate)
- ✅ Write effective assertions
- ✅ Build maintainable test suites
- ✅ Understand Playwright's auto-waiting mechanism

---

## Instructions

- Install Playwright and all browsers
- Use TypeScript for all tests
- Follow Playwright best practices (prefer role-based locators)
- Include meaningful assertions in every test
- Use the TodoMVC demo app: https://demo.playwright.dev/todomvc
- Run tests in different modes (headed, debug, UI)

---

## Part A: Setup & Configuration (20 points)

### Exercise 1: Project Initialization (8 points)

Create a complete Playwright project with proper configuration.

**Implementation:**

```bash
# Initialize project
npm init playwright@latest
# or manually:
npm init -y
npm install -D @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  
  use: {
    baseURL: 'https://demo.playwright.dev/todomvc',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
});
```

**Requirements:**
- Configure baseURL
- Set up 3 browser projects
- Enable trace on retry
- Configure screenshots and videos
- Add timeout settings

---

### Exercise 2: First Test Suite (7 points)

Create your first test with proper structure.

**tests/first.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('TodoMVC First Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display page title', async ({ page }) => {
    await expect(page).toHaveTitle(/TodoMVC/);
  });

  test('should display input placeholder', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toBeVisible();
    await expect(input).toBeEmpty();
  });

  test('should handle navigation timeout', async ({ page }) => {
    // Test timeout handling
    await expect(async () => {
      await page.goto('https://invalid-url-that-does-not-exist.com', {
        timeout: 5000
      });
    }).rejects.toThrow();
  });
});
```

**Requirements:**
- Use test.describe for grouping
- Implement beforeEach for setup
- Add title assertion
- Handle navigation errors
- Test with timeout

---

### Exercise 3: Debug & Execution Modes (5 points)

Document and demonstrate different execution modes.

**Commands to run:**
```bash
# Headless (default)
npx playwright test

# Headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# UI mode
npx playwright test --ui

# Specific browser
npx playwright test --project=chromium

# Specific file
npx playwright test first.spec.ts

# With trace
npx playwright test --trace on
```

**Create a comparison document:**
```typescript
/**
 * EXECUTION MODES COMPARISON
 * 
 * 1. Headless (default):
 *    - Fastest execution
 *    - No browser UI visible
 *    - Best for CI/CD
 *    - Command: npx playwright test
 * 
 * 2. Headed:
 *    - Browser UI visible
 *    - Slower execution
 *    - Good for debugging
 *    - Command: npx playwright test --headed
 * 
 * 3. Debug:
 *    - Pauses on each step
 *    - Inspector opens
 *    - Step-by-step execution
 *    - Command: npx playwright test --debug
 * 
 * 4. UI Mode:
 *    - Interactive test runner
 *    - Watch mode enabled
 *    - Time travel debugging
 *    - Command: npx playwright test --ui
 */
```

---

## Part B: Locator Strategies (30 points)

### Exercise 4: Role-Based Locators (10 points)

Master Playwright's recommended locator strategy.

**tests/locators-role.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Role-Based Locators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should locate elements by role', async ({ page }) => {
    // Heading
    const heading = page.getByRole('heading', { name: 'todos' });
    await expect(heading).toBeVisible();

    // Textbox
    const input = page.getByRole('textbox', { name: 'What needs to be done?' });
    await expect(input).toBeVisible();
    await expect(input).toBeEditable();

    // Add a todo first
    await input.fill('Test todo');
    await input.press('Enter');

    // List item
    const todoItem = page.getByRole('listitem');
    await expect(todoItem).toBeVisible();
    await expect(todoItem).toContainText('Test todo');

    // Checkbox
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toBeVisible();
    await expect(checkbox).not.toBeChecked();

    // Button (after adding todo)
    await input.fill('Second todo');
    await input.press('Enter');
    
    const clearButton = page.getByRole('button', { name: 'Clear completed' });
    // Button might not be visible until a todo is completed
  });

  test('should use role with level for headings', async ({ page }) => {
    const mainHeading = page.getByRole('heading', { level: 1 });
    await expect(mainHeading).toHaveText('todos');
  });

  test('should locate by role with exact name', async ({ page }) => {
    const input = page.getByRole('textbox', { 
      name: 'What needs to be done?',
      exact: true 
    });
    await expect(input).toBeVisible();
  });
});
```

**Requirements:**
- Use getByRole for all elements
- Test heading, textbox, listitem, checkbox, button
- Use name and level options
- Verify locators work after DOM changes

---

### Exercise 5: Text & Placeholder Locators (8 points)

**tests/locators-text.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Text & Placeholder Locators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should locate by placeholder', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toBeVisible();

    // Partial match
    const inputPartial = page.getByPlaceholder(/needs to be/);
    await expect(inputPartial).toBeVisible();
  });

  test('should locate by text', async ({ page }) => {
    // Add todos first
    await page.getByPlaceholder('What needs to be done?').fill('Buy milk');
    await page.getByPlaceholder('What needs to be done?').press('Enter');
    await page.getByPlaceholder('What needs to be done?').fill('Buy eggs');
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    // Exact text
    const todo1 = page.getByText('Buy milk', { exact: true });
    await expect(todo1).toBeVisible();

    // Partial text
    const todo2 = page.getByText(/Buy/);
    await expect(todo2).toBeVisible();

    // Items left counter
    const counter = page.getByText(/items left/);
    await expect(counter).toBeVisible();
  });

  test('should use text with case insensitive', async ({ page }) => {
    await page.getByPlaceholder('What needs to be done?').fill('Test TODO');
    await page.getByPlaceholder('What needs to be done?').press('Enter');

    const todo = page.getByText(/test todo/i);
    await expect(todo).toBeVisible();
  });
});
```

---

### Exercise 6: CSS & XPath Locators (12 points)

**tests/locators-css-xpath.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('CSS & XPath Locators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Add sample todos
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('First task');
    await input.press('Enter');
    await input.fill('Second task');
    await input.press('Enter');
  });

  test('should use CSS selectors', async ({ page }) => {
    // Class selector
    const header = page.locator('.header');
    await expect(header).toBeVisible();

    // ID selector (if available)
    const todoList = page.locator('.todo-list');
    await expect(todoList).toBeVisible();

    // Attribute selector
    const input = page.locator('input[placeholder="What needs to be done?"]');
    await expect(input).toBeVisible();

    // Descendant selector
    const todoItems = page.locator('.todo-list li');
    await expect(todoItems).toHaveCount(2);

    // Pseudo-class
    const firstTodo = page.locator('.todo-list li:first-child');
    await expect(firstTodo).toContainText('First task');
  });

  test('should use XPath selectors', async ({ page }) => {
    // Basic XPath
    const header = page.locator('xpath=//header');
    await expect(header).toBeVisible();

    // XPath with class
    const todoList = page.locator('xpath=//ul[@class="todo-list"]');
    await expect(todoList).toBeVisible();

    // XPath with text
    const todo = page.locator('xpath=//label[contains(text(), "First")]');
    await expect(todo).toBeVisible();

    // XPath with attribute
    const input = page.locator('xpath=//input[@placeholder="What needs to be done?"]');
    await expect(input).toBeVisible();
  });

  test('should chain locators', async ({ page }) => {
    // Find todo list, then first item
    const firstTodo = page.locator('.todo-list').locator('li').first();
    await expect(firstTodo).toContainText('First task');

    // Filter locators
    const completedTodos = page.locator('.todo-list li').filter({ hasText: 'First' });
    await expect(completedTodos).toHaveCount(1);
  });
});
```

---

## Part C: Actions & Interactions (30 points)

### Exercise 7: Input Actions (10 points)

**tests/actions-input.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Input Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should fill input', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Buy groceries');
    await expect(input).toHaveValue('Buy groceries');
  });

  test('should clear input', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Temporary text');
    await input.clear();
    await expect(input).toBeEmpty();
  });

  test('should type slowly (character by character)', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.type('Slow typing', { delay: 100 });
    await expect(input).toHaveValue('Slow typing');
  });

  test('should press keys', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Test task');
    await input.press('Enter');
    
    const todo = page.getByText('Test task');
    await expect(todo).toBeVisible();
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Select all test');
    await input.press('Control+A');
    await input.press('Backspace');
    await expect(input).toBeEmpty();
  });
});
```

---

### Exercise 8: Click Actions (10 points)

**tests/actions-click.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Click Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Add a todo
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Test todo');
    await input.press('Enter');
  });

  test('should single click checkbox', async ({ page }) => {
    const checkbox = page.getByRole('checkbox');
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    
    await checkbox.click();
    await expect(checkbox).not.toBeChecked();
  });

  test('should double click to edit', async ({ page }) => {
    const todoLabel = page.getByText('Test todo');
    
    await todoLabel.dblclick();
    
    // After double-click, input should be in edit mode
    const editInput = page.locator('.todo-list li.editing input.edit');
    await expect(editInput).toBeVisible();
    await expect(editInput).toBeFocused();
  });

  test('should use force click when needed', async ({ page }) => {
    // Sometimes elements might be covered or not ready
    const checkbox = page.getByRole('checkbox');
    
    // Force click bypasses actionability checks
    await checkbox.click({ force: true });
    await expect(checkbox).toBeChecked();
    
    /**
     * Use force: true when:
     * - Element is covered by another element
     * - Element is outside viewport
     * - Testing edge cases
     * 
     * Avoid in normal tests - let Playwright wait naturally
     */
  });

  test('should click with modifiers', async ({ page }) => {
    const todo = page.getByText('Test todo');
    
    // Click with Ctrl (might select multiple in some apps)
    await todo.click({ modifiers: ['Control'] });
  });
});
```

---

### Exercise 9: Navigation Actions (10 points)

**tests/actions-navigation.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Navigation Actions', () => {
  test('should navigate to URL', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    await expect(page).toHaveURL(/todomvc/);
  });

  test('should navigate with options', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc', {
      waitUntil: 'networkidle',
      timeout: 30000
    });
    await expect(page).toHaveTitle(/TodoMVC/);
  });

  test('should use back and forward', async ({ page }) => {
    // Navigate to first page
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Navigate to second page
    await page.goto('https://playwright.dev');
    await expect(page).toHaveURL(/playwright.dev/);
    
    // Go back
    await page.goBack();
    await expect(page).toHaveURL(/todomvc/);
    
    // Go forward
    await page.goForward();
    await expect(page).toHaveURL(/playwright.dev/);
  });

  test('should reload page', async ({ page }) => {
    await page.goto('https://demo.playwright.dev/todomvc');
    
    // Add a todo
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Test reload');
    await input.press('Enter');
    
    // Reload page
    await page.reload();
    
    // Todo should persist (if app uses localStorage)
    // Or disappear (if not persisted)
    await expect(page).toHaveURL(/todomvc/);
  });
});
```

---

## Part D: Assertions (20 points)

### Exercise 10: Element Assertions (10 points)

**tests/assertions-element.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Element Assertions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should assert visibility', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toBeVisible();
    
    const nonExistent = page.getByText('This does not exist');
    await expect(nonExistent).not.toBeVisible();
  });

  test('should assert hidden state', async ({ page }) => {
    // Add todos and filter
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Active todo');
    await input.press('Enter');
    await input.fill('Completed todo');
    await input.press('Enter');
    
    // Complete second todo
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(1).click();
    
    // Click "Active" filter
    await page.getByRole('link', { name: 'Active' }).click();
    
    // Completed todo should be hidden
    const completedTodo = page.getByText('Completed todo');
    await expect(completedTodo).toBeHidden();
  });

  test('should assert element count', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    // Add 3 todos
    for (let i = 1; i <= 3; i++) {
      await input.fill(`Todo ${i}`);
      await input.press('Enter');
    }
    
    const todos = page.locator('.todo-list li');
    await expect(todos).toHaveCount(3);
  });

  test('should assert text content', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Specific text');
    await input.press('Enter');
    
    const todo = page.getByText('Specific text');
    await expect(todo).toHaveText('Specific text');
    await expect(todo).toContainText('Specific');
  });
});
```

---

### Exercise 11: State Assertions (10 points)

**tests/assertions-state.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('State Assertions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should assert checked state', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Check me');
    await input.press('Enter');
    
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).not.toBeChecked();
    
    await checkbox.click();
    await expect(checkbox).toBeChecked();
  });

  test('should assert input value', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Test value');
    await expect(input).toHaveValue('Test value');
    
    await input.clear();
    await expect(input).toHaveValue('');
  });

  test('should assert disabled state', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toBeEnabled();
    await expect(input).toBeEditable();
    
    // Most elements in TodoMVC are not disabled
    // This is an example of how to check
  });

  test('should assert CSS class', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Test todo');
    await input.press('Enter');
    
    const checkbox = page.getByRole('checkbox');
    await checkbox.click();
    
    const todoItem = page.locator('.todo-list li').first();
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('should assert attribute', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    await expect(input).toHaveAttribute('placeholder', 'What needs to be done?');
  });
});
```

---

## Bonus Challenges (30 points)

### Exercise 12: Complete Todo Test Suite (15 points)

**tests/todo-suite.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';

test.describe('Complete Todo Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should add new todo', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    await input.fill('Buy milk');
    await input.press('Enter');
    
    const todo = page.getByText('Buy milk');
    await expect(todo).toBeVisible();
    await expect(input).toBeEmpty();
  });

  test('should mark todo as complete', async ({ page }) => {
    // Add todo
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Complete me');
    await input.press('Enter');
    
    // Mark as complete
    const checkbox = page.getByRole('checkbox');
    await checkbox.click();
    await expect(checkbox).toBeChecked();
    
    // Verify completed class
    const todoItem = page.locator('.todo-list li').first();
    await expect(todoItem).toHaveClass(/completed/);
  });

  test('should delete todo', async ({ page }) => {
    // Add todo
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Delete me');
    await input.press('Enter');
    
    // Hover to show delete button
    const todoItem = page.locator('.todo-list li').first();
    await todoItem.hover();
    
    // Click delete
    const deleteButton = todoItem.locator('button.destroy');
    await deleteButton.click();
    
    // Verify deleted
    const todos = page.locator('.todo-list li');
    await expect(todos).toHaveCount(0);
  });

  test('should edit todo', async ({ page }) => {
    // Add todo
    const input = page.getByPlaceholder('What needs to be done?');
    await input.fill('Edit me');
    await input.press('Enter');
    
    // Double-click to edit
    const todoLabel = page.getByText('Edit me');
    await todoLabel.dblclick();
    
    // Edit the todo
    const editInput = page.locator('.todo-list li.editing input.edit');
    await editInput.fill('Edited todo');
    await editInput.press('Enter');
    
    // Verify edited
    await expect(page.getByText('Edited todo')).toBeVisible();
    await expect(page.getByText('Edit me')).not.toBeVisible();
  });

  test('should filter todos', async ({ page }) => {
    const input = page.getByPlaceholder('What needs to be done?');
    
    // Add active and completed todos
    await input.fill('Active todo');
    await input.press('Enter');
    await input.fill('Completed todo');
    await input.press('Enter');
    
    // Complete second todo
    const checkboxes = page.getByRole('checkbox');
    await checkboxes.nth(1).click();
    
    // Filter active
    await page.getByRole('link', { name: 'Active' }).click();
    await expect(page.getByText('Active todo')).toBeVisible();
    await expect(page.getByText('Completed todo')).toBeHidden();
    
    // Filter completed
    await page.getByRole('link', { name: 'Completed' }).click();
    await expect(page.getByText('Completed todo')).toBeVisible();
    await expect(page.getByText('Active todo')).toBeHidden();
  });
});
```

---

### Exercise 13: Page Object Model (15 points)

**pages/TodoPage.ts:**
```typescript
import { Page, Locator } from '@playwright/test';

export class TodoPage {
  readonly page: Page;
  readonly input: Locator;
  readonly todoItems: Locator;
  readonly activeFilter: Locator;
  readonly completedFilter: Locator;
  readonly allFilter: Locator;

  constructor(page: Page) {
    this.page = page;
    this.input = page.getByPlaceholder('What needs to be done?');
    this.todoItems = page.locator('.todo-list li');
    this.activeFilter = page.getByRole('link', { name: 'Active' });
    this.completedFilter = page.getByRole('link', { name: 'Completed' });
    this.allFilter = page.getByRole('link', { name: 'All' });
  }

  async goto() {
    await this.page.goto('/');
  }

  async addTodo(text: string) {
    await this.input.fill(text);
    await this.input.press('Enter');
  }

  async addMultipleTodos(texts: string[]) {
    for (const text of texts) {
      await this.addTodo(text);
    }
  }

  async completeTodo(index: number) {
    const checkbox = this.todoItems.nth(index).getByRole('checkbox');
    await checkbox.click();
  }

  async deleteTodo(index: number) {
    const todoItem = this.todoItems.nth(index);
    await todoItem.hover();
    await todoItem.locator('button.destroy').click();
  }

  async editTodo(index: number, newText: string) {
    const todoItem = this.todoItems.nth(index);
    await todoItem.locator('label').dblclick();
    const editInput = todoItem.locator('input.edit');
    await editInput.fill(newText);
    await editInput.press('Enter');
  }

  async filterActive() {
    await this.activeFilter.click();
  }

  async filterCompleted() {
    await this.completedFilter.click();
  }

  async filterAll() {
    await this.allFilter.click();
  }

  async getTodoCount(): Promise<number> {
    return await this.todoItems.count();
  }
}
```

**tests/todo-pom.spec.ts:**
```typescript
import { test, expect } from '@playwright/test';
import { TodoPage } from '../pages/TodoPage';

test.describe('Todo Tests with POM', () => {
  let todoPage: TodoPage;

  test.beforeEach(async ({ page }) => {
    todoPage = new TodoPage(page);
    await todoPage.goto();
  });

  test('should add todos using POM', async () => {
    await todoPage.addTodo('First task');
    await todoPage.addTodo('Second task');
    
    const count = await todoPage.getTodoCount();
    expect(count).toBe(2);
  });

  test('should complete and filter using POM', async () => {
    await todoPage.addMultipleTodos(['Active', 'To complete']);
    await todoPage.completeTodo(1);
    
    await todoPage.filterActive();
    const activeCount = await todoPage.getTodoCount();
    expect(activeCount).toBe(1);
    
    await todoPage.filterCompleted();
    const completedCount = await todoPage.getTodoCount();
    expect(completedCount).toBe(1);
  });
});
```

---

## Submission Guidelines

1. Create folder `assignment03_yourname/`
2. Include:
   - `tests/` folder with all test files
   - `pages/` folder with Page Objects
   - `playwright.config.ts`
   - `package.json`
   - `README.md` with:
     - Installation steps
     - How to run tests
     - Test coverage summary
3. Run and verify: `npx playwright test`
4. Generate report: `npx playwright show-report`

---

## Grading Rubric

- **Locator Strategy (30%)**: Stable, maintainable locators
  - Role-based locators (15%)
  - Proper selector usage (15%)

- **Actions & Interactions (30%)**: Correct browser interactions
  - Input actions (10%)
  - Click actions (10%)
  - Navigation (10%)

- **Assertions (25%)**: Comprehensive test validation
  - Element assertions (15%)
  - State assertions (10%)

- **Code Quality (15%)**: Clean, maintainable tests
  - Test structure (8%)
  - POM implementation (7%)

---

## Common Mistakes to Avoid

❌ Using brittle CSS/XPath selectors instead of role-based  
❌ Missing assertions (tests that don't verify anything)  
❌ Hard-coded waits (`page.waitForTimeout()`)  
❌ Tests that depend on execution order  
❌ Not using beforeEach for setup  
❌ Overly complex locators  
❌ Not handling dynamic content properly  
❌ Ignoring Playwright's auto-waiting  

---

## Tips for Success

✅ **Prefer role-based locators** (getByRole, getByLabel, getByPlaceholder)  
✅ **Use Playwright's auto-waiting** - no need for manual waits  
✅ **Keep tests independent** - each test should work alone  
✅ **Use beforeEach** for common setup  
✅ **Write meaningful assertions** - verify actual behavior  
✅ **Use Page Object Model** for maintainability  
✅ **Run in UI mode** for debugging (`--ui`)  
✅ **Use trace viewer** for failed tests  
✅ **Test in multiple browsers** using projects  
✅ **Keep selectors simple** and maintainable  

---

## Quick Reference

### Locator Priority (Best to Worst)
1. `getByRole()` - Most resilient
2. `getByLabel()` - For form fields
3. `getByPlaceholder()` - For inputs
4. `getByText()` - For visible text
5. `getByTestId()` - When you control HTML
6. CSS/XPath - Last resort

### Common Commands
```bash
npx playwright test                 # Run all tests
npx playwright test --headed        # See browser
npx playwright test --debug         # Debug mode
npx playwright test --ui            # UI mode
npx playwright codegen              # Generate tests
npx playwright show-report          # View report
```

---

**Total Points: 100 + 30 Bonus = 130 points**

Master Playwright fundamentals and build reliable browser tests! 🎭
