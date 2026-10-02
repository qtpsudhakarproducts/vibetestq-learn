# Complete GitHub Actions for Test Automation Guide

**Author:** QtpSudhakar  
**Last Updated:** February 2026  
**Difficulty:** Beginner to Advanced  
**Estimated Reading Time:** 50 minutes  
**Hands-On Time:** 3-4 hours

---

## What You'll Build

By the end of this guide, you will have:

- ✅ **GitHub Actions fundamentals** mastered
- ✅ **Automated test workflows** for Playwright/Pytest/Selenium
- ✅ **Multi-browser and multi-OS testing** configured
- ✅ **Scheduled test runs** (nightly/weekly)
- ✅ **Parallel execution** for faster results
- ✅ **Caching strategies** to reduce costs
- ✅ **Secret management** for secure credentials
- ✅ **Self-hosted runners** for advanced scenarios
- ✅ **Flaky test handling** and retry logic
- ✅ **Integration with ReportPortal** for centralized reporting
- ✅ **Production-ready workflows** with best practices

---

# Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [What is GitHub Actions?](#2-what-is-github-actions)
3. [Why GitHub Actions for Test Automation?](#3-why-github-actions-for-test-automation)
4. [Understanding GitHub Actions Architecture](#4-understanding-github-actions-architecture)
5. [Your First Test Workflow](#5-your-first-test-workflow)
6. [Playwright Automation Workflow](#6-playwright-automation-workflow)
7. [Pytest Automation Workflow](#7-pytest-automation-workflow)
8. [Selenium Grid Testing](#8-selenium-grid-testing)
9. [Multi-Browser Testing (Matrix Strategy)](#9-multi-browser-testing-matrix-strategy)
10. [Multi-OS Testing](#10-multi-os-testing)
11. [Scheduled Test Runs](#11-scheduled-test-runs)
12. [Manual Workflow Triggers](#12-manual-workflow-triggers)
13. [Caching Dependencies](#13-caching-dependencies)
14. [Managing Secrets](#14-managing-secrets)
15. [Uploading Test Artifacts](#15-uploading-test-artifacts)
16. [Parallel Execution Strategies](#16-parallel-execution-strategies)
17. [Handling Flaky Tests](#17-handling-flaky-tests)
18. [Self-Hosted Runners](#18-self-hosted-runners)
19. [Advanced Workflow Patterns](#19-advanced-workflow-patterns)
20. [Integration with ReportPortal](#20-integration-with-reportportal)
21. [Notifications and Alerts](#21-notifications-and-alerts)
22. [Cost Optimization](#22-cost-optimization)
23. [Common Issues & Fixes](#23-common-issues--fixes)
24. [Security Best Practices](#24-security-best-practices)
25. [Real-World Example](#25-real-world-example)
26. [Practice Exercise](#26-practice-exercise)

---

# 1. Prerequisites

## Account Requirements

### GitHub Account
- **Free tier:** 2,000 minutes/month for private repos
- **Public repos:** Unlimited free minutes
- **Pro/Team/Enterprise:** More minutes + advanced features

### Repository Access
- Admin or write access to repository
- Ability to create `.github/workflows/` folder
- Permission to manage secrets

## Knowledge Prerequisites

### Essential
- Git basics (clone, commit, push)
- Basic YAML syntax
- Command-line familiarity
- Understanding of your test framework (Playwright/Pytest/Selenium)

### Helpful
- CI/CD concepts
- Docker basics (for self-hosted runners)
- Linux shell commands

## System Requirements (for Self-Hosted Runners)

- **RAM:** 4 GB minimum (8 GB recommended)
- **CPU:** 2 cores minimum (4+ recommended)
- **Disk:** 20 GB free space
- **OS:** Ubuntu 20.04+, Windows Server 2019+, macOS 10.15+

---

# 2. What is GitHub Actions?

## Simple Explanation

GitHub Actions = **Automation platform built into GitHub** that runs code in response to events.

**Common events:**
- Push code → Run tests
- Create pull request → Run linters
- Schedule → Run nightly tests
- Manual trigger → Deploy to production

## Real-World Analogy: The Smart Home

### Without GitHub Actions (Manual Home)
```
You arrive home:
1. Manually turn on lights
2. Manually adjust thermostat
3. Manually unlock door
4. Manually start coffee maker
```

**Result:** Repetitive manual work! 😓

### With GitHub Actions (Smart Home)
```
You arrive home:
   ↓ (door sensor detects you)
   ↓
Automation triggers:
   ✅ Lights turn on automatically
   ✅ Thermostat adjusts to 72°F
   ✅ Door unlocks
   ✅ Coffee maker starts brewing
```

**Result:** Everything happens automatically! 🎯

## How It Maps to Development

### Without GitHub Actions
```
Developer pushes code:
1. Manually run tests locally
2. Manually check lint errors
3. Manually build artifacts
4. Manually deploy
5. Hope nothing breaks! 🤞
```

### With GitHub Actions
```
Developer pushes code:
   ↓ (GitHub detects push)
   ↓
Automation runs:
   ✅ Tests execute automatically
   ✅ Linters check code quality
   ✅ Build creates artifacts
   ✅ Deploy to staging
   ✅ Notify team on Slack
```

---

# 3. Why GitHub Actions for Test Automation?

## Key Benefits

### 1. **Integrated with GitHub**
- No external CI tool needed
- Lives with your code
- Built-in permissions and security

### 2. **Free Tier Generous**
- **Public repos:** Unlimited minutes! 🎉
- **Private repos:** 2,000 minutes/month free
- **Comparison:**
  - CircleCI: 6,000 free minutes/month (all repos)
  - Travis CI: No free tier anymore
  - Jenkins: Self-hosted (costs infrastructure)

### 3. **Matrix Builds**
```yaml
strategy:
  matrix:
    os: [ubuntu, windows, macos]
    browser: [chrome, firefox, safari]
    node: [18, 20, 22]
```

**Result:** 27 test combinations automatically! (3×3×3)

### 4. **Huge Marketplace**
- 20,000+ pre-built actions
- Setup Node.js, Python, Java in one line
- Deploy to AWS, Azure, GCP with actions
- Send Slack notifications easily

### 5. **Parallel Execution**
- Run 20 test jobs simultaneously
- Free tier: 20 concurrent jobs
- Dramatically faster test execution

### 6. **Multiple Operating Systems**
```yaml
runs-on: ubuntu-latest   # Linux (fastest, cheapest)
runs-on: windows-latest  # Windows (testing Windows apps)
runs-on: macos-latest    # macOS (testing Safari, iOS)
```

### 7. **Excellent Documentation**
- Official docs: https://docs.github.com/actions
- Community examples
- Action source code visible

## Comparison: GitHub Actions vs Competitors

| Feature | GitHub Actions | Jenkins | CircleCI | GitLab CI |
|---------|----------------|---------|----------|-----------|
| **Setup Time** | 5 mins | 2 hours | 15 mins | 15 mins |
| **Maintenance** | Zero | High | Low | Low |
| **Cost (Private)** | 2000 min FREE | Self-hosted | 6000 min FREE | 400 min FREE |
| **OS Support** | Linux/Mac/Win | All | Linux/Mac/Win | Linux |
| **Matrix Builds** | ✅ Native | ⚠️ Plugins | ✅ Native | ✅ Native |
| **Secrets Mgmt** | ✅ Built-in | ⚠️ Plugins | ✅ Built-in | ✅ Built-in |

**Verdict:** GitHub Actions wins for GitHub-hosted projects! 🏆

---

# 4. Understanding GitHub Actions Architecture

## Core Concepts

### 1. **Workflow**
A YAML file defining automation process.

**Location:** `.github/workflows/test.yml`

**Analogy:** Recipe for cooking (step-by-step instructions)

### 2. **Event**
Trigger that starts workflow.

**Examples:**
- `push` - Code pushed to branch
- `pull_request` - PR opened/updated
- `schedule` - Cron-based timing
- `workflow_dispatch` - Manual trigger

**Analogy:** Alarm clock that wakes you up

### 3. **Job**
Group of steps running on same runner.

**Example:**
```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
```

**Analogy:** One cook preparing one dish

### 4. **Step**
Individual command or action.

**Examples:**
```yaml
- name: Checkout code
  uses: actions/checkout@v4

- name: Run tests
  run: npm test
```

**Analogy:** Individual cooking step (chop, stir, bake)

### 5. **Runner**
Virtual machine executing jobs.

**Types:**
- **GitHub-hosted:** Ubuntu, Windows, macOS (free/paid)
- **Self-hosted:** Your own servers (free, unlimited minutes)

**Analogy:** Kitchen where cooking happens

### 6. **Action**
Reusable unit of code.

**Examples:**
- `actions/checkout@v4` - Clone repository
- `actions/setup-node@v4` - Install Node.js
- `actions/upload-artifact@v4` - Save files

**Analogy:** Pre-made spice mix (reusable ingredient)

## Workflow Anatomy

```yaml
# .github/workflows/test.yml

name: Test Automation                    # Workflow name (shows in UI)

on:                                      # Events that trigger workflow
  push:                                  # On code push
    branches: [main, develop]            # Only these branches
  pull_request:                          # On pull request
  schedule:                              # On schedule
    - cron: '0 2 * * *'                 # Daily at 2 AM UTC

jobs:                                    # Jobs to run
  test:                                  # Job ID
    runs-on: ubuntu-latest               # Operating system
    
    steps:                               # Steps in this job
      - name: Checkout code              # Step name
        uses: actions/checkout@v4        # Use pre-built action
      
      - name: Install dependencies
        run: npm ci                      # Run shell command
      
      - name: Run tests
        run: npm test
```

## Execution Flow

```
┌─────────────────────────────────────────────────────┐
│  1. Event Occurs (e.g., git push)                   │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  2. GitHub Detects Event                            │
│     - Checks if workflow matches event              │
│     - Validates YAML syntax                         │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  3. Queue Job                                       │
│     - Finds available runner                        │
│     - Waits if all runners busy                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  4. Runner Starts                                   │
│     - Provisions fresh VM (30-60 seconds)           │
│     - OS: Ubuntu/Windows/macOS                      │
│     - Specs: 2-core, 7 GB RAM, 14 GB disk           │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  5. Checkout Code                                   │
│     - Clones repository                             │
│     - Checks out specific commit                    │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  6. Execute Steps Sequentially                      │
│     - Step 1: Install dependencies                  │
│     - Step 2: Run tests                             │
│     - Step 3: Upload results                        │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  7. Job Completes                                   │
│     - Success ✅ (all steps passed)                 │
│     - Failure ❌ (any step failed)                  │
│     - VM destroyed automatically                     │
└────────────────┬────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────┐
│  8. Results Visible in GitHub UI                    │
│     - Green checkmark or red X                      │
│     - Logs available for 90 days                    │
│     - Artifacts stored (default 90 days)            │
└─────────────────────────────────────────────────────┘
```

## Runner Specifications

### GitHub-Hosted Runner Specs

| Operating System | CPU Cores | RAM | Disk | Cost Multiplier |
|------------------|-----------|-----|------|-----------------|
| **Ubuntu** | 2 | 7 GB | 14 GB | 1× (cheapest) |
| **Windows** | 2 | 7 GB | 14 GB | 2× |
| **macOS** | 3 | 14 GB | 14 GB | 10× (most expensive) |

**Pre-installed Software:**
- Git, Docker, docker-compose
- Node.js (multiple versions via nvm)
- Python (multiple versions)
- Java, Ruby, Go, .NET
- Browsers: Chrome, Firefox, Edge (Ubuntu/Windows)
- Safari (macOS only)

**Full list:** https://github.com/actions/runner-images

---

# 5. Your First Test Workflow

## Hello World Workflow

Let's start simple!

### Step 1: Create Workflow File

In your repository:

```bash
mkdir -p .github/workflows
touch .github/workflows/hello.yml
```

### Step 2: Add Workflow Code

```yaml
# .github/workflows/hello.yml

name: Hello World

on: [push]

jobs:
  hello:
    runs-on: ubuntu-latest
    
    steps:
      - name: Say hello
        run: echo "Hello from GitHub Actions!"
      
      - name: Show OS info
        run: |
          echo "OS: $(uname -s)"
          echo "Kernel: $(uname -r)"
          echo "Hostname: $(hostname)"
      
      - name: Show current directory
        run: pwd
      
      - name: List files
        run: ls -la
```

### Step 3: Commit and Push

```bash
git add .github/workflows/hello.yml
git commit -m "Add first GitHub Actions workflow"
git push
```

### Step 4: View Results

1. Go to your GitHub repository
2. Click **Actions** tab
3. You'll see workflow running!
4. Click on workflow name to see logs

**Expected output:**

```
Hello from GitHub Actions!
OS: Linux
Kernel: 5.15.0-1034-azure
Hostname: fv-az123-456
/home/runner/work/my-repo/my-repo
```

## Simple Test Workflow

Now let's run actual tests!

### Step 1: Create Test File

```javascript
// tests/example.test.js

test('adds 1 + 2 to equal 3', () => {
  expect(1 + 2).toBe(3);
});

test('multiplies 2 * 3 to equal 6', () => {
  expect(2 * 3).toBe(6);
});
```

### Step 2: Add package.json

```json
{
  "name": "test-demo",
  "scripts": {
    "test": "jest"
  },
  "devDependencies": {
    "jest": "^29.7.0"
  }
}
```

### Step 3: Create Workflow

```yaml
# .github/workflows/test.yml

name: Run Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run tests
        run: npm test
```

### Step 4: Push and Verify

```bash
git add .
git commit -m "Add test workflow"
git push
```

**Result:** Tests run automatically on every push! ✅

---

# 6. Playwright Automation Workflow

## Complete Playwright Workflow

### Step 1: Project Structure

```
my-playwright-project/
├── .github/
│   └── workflows/
│       └── playwright.yml
├── tests/
│   ├── login.spec.ts
│   ├── checkout.spec.ts
│   └── api.spec.ts
├── playwright.config.ts
├── package.json
└── package-lock.json
```

### Step 2: Create Playwright Workflow

```yaml
# .github/workflows/playwright.yml

name: Playwright Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:     # Manual trigger

jobs:
  playwright-tests:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'  # Cache npm dependencies
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps chromium
      
      - name: Run Playwright tests
        run: npx playwright test
        env:
          CI: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
      
      - name: Upload test artifacts (screenshots, videos)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 7
```

### Step 3: Configure Playwright

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30 * 1000,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,  // Fail if test.only in CI
  retries: process.env.CI ? 2 : 0,  // Retry failed tests in CI
  workers: process.env.CI ? 4 : undefined,
  
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  use: {
    baseURL: 'https://demo.playwright.dev',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
```

### Step 4: Example Test

```typescript
// tests/example.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Example Tests', () => {
  
  test('should load homepage', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('should navigate to Get Started', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/.*intro/);
  });

  test('should search documentation', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByPlaceholder('Search docs').fill('locators');
    await expect(page.getByText('Locators')).toBeVisible();
  });
});
```

### Step 5: Commit and Run

```bash
git add .
git commit -m "Add Playwright workflow"
git push
```

**Result:**
- Tests run automatically on push
- Run daily at 2 AM
- Can trigger manually from Actions tab
- Artifacts saved for 30 days

## Advanced Playwright Configuration

### Sharding Tests (Parallel Execution)

```yaml
# .github/workflows/playwright-parallel.yml

name: Playwright Parallel

on: [push]

jobs:
  playwright:
    runs-on: ubuntu-latest
    
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]  # Split into 4 shards
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run tests (shard ${{ matrix.shard }})
        run: npx playwright test --shard=${{ matrix.shard }}/4
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shard }}
          path: playwright-report/
```

**Result:** Tests complete 4× faster! (75% time reduction)

---

# 7. Pytest Automation Workflow

## Complete Pytest Workflow

### Step 1: Project Structure

```
pytest-automation/
├── .github/
│   └── workflows/
│       └── pytest.yml
├── tests/
│   ├── test_login.py
│   ├── test_api.py
│   └── conftest.py
├── pytest.ini
├── requirements.txt
└── .env.example
```

### Step 2: Create Pytest Workflow

```yaml
# .github/workflows/pytest.yml

name: Pytest Tests

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC

jobs:
  pytest:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'  # Cache pip dependencies
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
      
      - name: Run pytest
        run: |
          pytest \
            --verbose \
            --tb=short \
            --junitxml=test-results/junit.xml \
            --html=test-results/report.html \
            --self-contained-html
        env:
          PYTEST_TIMEOUT: 300
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pytest-results
          path: test-results/
          retention-days: 30
      
      - name: Publish test results
        if: always()
        uses: EnricoMi/publish-unit-test-result-action@v2
        with:
          files: test-results/junit.xml
```

### Step 3: requirements.txt

```txt
pytest==7.4.3
pytest-html==4.1.1
pytest-timeout==2.2.0
pytest-xdist==3.5.0  # Parallel execution
requests==2.31.0
selenium==4.16.0
python-dotenv==1.0.0
```

### Step 4: pytest.ini

```ini
[pytest]
# Test discovery
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*

# Output
addopts = 
    --verbose
    --strict-markers
    --tb=short
    -p no:warnings

# Markers
markers =
    smoke: Smoke test suite
    regression: Full regression tests
    api: API tests
    ui: UI tests
    slow: Tests that take > 1 minute

# Timeout
timeout = 300
```

### Step 5: Example Tests

```python
# tests/test_example.py

import pytest
import requests

@pytest.mark.smoke
def test_api_health_check():
    """Verify API is responding"""
    response = requests.get('https://jsonplaceholder.typicode.com/posts/1')
    assert response.status_code == 200
    assert 'id' in response.json()

@pytest.mark.api
def test_get_users():
    """Test fetching user list"""
    response = requests.get('https://jsonplaceholder.typicode.com/users')
    assert response.status_code == 200
    users = response.json()
    assert len(users) > 0
    assert 'email' in users[0]

@pytest.mark.regression
def test_create_post():
    """Test creating a new post"""
    payload = {
        'title': 'Test Post',
        'body': 'This is a test',
        'userId': 1
    }
    response = requests.post(
        'https://jsonplaceholder.typicode.com/posts',
        json=payload
    )
    assert response.status_code == 201
    data = response.json()
    assert data['title'] == 'Test Post'

@pytest.mark.slow
def test_large_dataset():
    """Test processing large dataset"""
    # This would be a slow test
    import time
    time.sleep(5)
    assert True
```

### Step 6: Parallel Execution

```yaml
# .github/workflows/pytest-parallel.yml

name: Pytest Parallel

on: [push]

jobs:
  pytest:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run tests in parallel (4 workers)
        run: pytest -n 4  # 4 parallel workers
```

---

# 8. Selenium Grid Testing

## Setting Up Selenium with Docker

### Step 1: Docker Compose for Selenium Grid

```yaml
# docker-compose.yml

version: '3'
services:
  selenium-hub:
    image: selenium/hub:latest
    ports:
      - "4444:4444"
  
  chrome:
    image: selenium/node-chrome:latest
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
  
  firefox:
    image: selenium/node-firefox:latest
    depends_on:
      - selenium-hub
    environment:
      - SE_EVENT_BUS_HOST=selenium-hub
      - SE_EVENT_BUS_PUBLISH_PORT=4442
      - SE_EVENT_BUS_SUBSCRIBE_PORT=4443
```

### Step 2: GitHub Actions Workflow

```yaml
# .github/workflows/selenium.yml

name: Selenium Tests

on: [push]

jobs:
  selenium:
    runs-on: ubuntu-latest
    
    services:
      selenium-hub:
        image: selenium/standalone-chrome:latest
        ports:
          - 4444:4444
        options: --shm-size=2gb
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          pip install selenium pytest
      
      - name: Wait for Selenium
        run: |
          timeout 60 bash -c 'until curl -s http://localhost:4444/wd/hub/status | grep "ready"; do sleep 2; done'
      
      - name: Run Selenium tests
        run: pytest tests/selenium/
        env:
          SELENIUM_URL: http://localhost:4444/wd/hub
```

### Step 3: Example Selenium Test

```python
# tests/selenium/test_google.py

import pytest
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import os

@pytest.fixture
def driver():
    """Create Selenium WebDriver"""
    selenium_url = os.getenv('SELENIUM_URL', 'http://localhost:4444/wd/hub')
    
    options = webdriver.ChromeOptions()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    
    driver = webdriver.Remote(
        command_executor=selenium_url,
        options=options
    )
    
    yield driver
    driver.quit()

def test_google_search(driver):
    """Test Google search functionality"""
    driver.get('https://www.google.com')
    
    # Wait for search box
    search_box = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, 'q'))
    )
    
    # Perform search
    search_box.send_keys('Playwright vs Selenium')
    search_box.submit()
    
    # Wait for results
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.ID, 'search'))
    )
    
    # Verify results loaded
    assert 'Playwright' in driver.page_source
```

---

# 9. Multi-Browser Testing (Matrix Strategy)

## Matrix Strategy Explained

**Matrix strategy** = Run same tests across multiple configurations.

**Example:** Test on Chrome, Firefox, Safari

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
```

**Result:** 3 jobs run in parallel!

## Complete Multi-Browser Workflow

```yaml
# .github/workflows/multi-browser.yml

name: Multi-Browser Tests

on: [push, pull_request]

jobs:
  playwright:
    runs-on: ubuntu-latest
    
    strategy:
      fail-fast: false  # Continue other browsers if one fails
      matrix:
        browser: [chromium, firefox, webkit]
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright browsers
        run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run tests on ${{ matrix.browser }}
        run: npx playwright test --project=${{ matrix.browser }}
      
      - name: Upload results - ${{ matrix.browser }}
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report-${{ matrix.browser }}
          path: playwright-report/
```

## Multi-Browser + Multi-Version

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    node-version: [18, 20, 22]
```

**Result:** 9 jobs (3 browsers × 3 Node versions)

## Including/Excluding Specific Combinations

```yaml
strategy:
  matrix:
    browser: [chromium, firefox, webkit]
    os: [ubuntu-latest, windows-latest, macos-latest]
    exclude:
      # WebKit doesn't work well on Windows
      - os: windows-latest
        browser: webkit
      # Exclude Firefox on macOS for cost savings
      - os: macos-latest
        browser: firefox
    include:
      # Add Safari specifically on macOS
      - os: macos-latest
        browser: safari
```

---

# 10. Multi-OS Testing

## Why Test on Multiple Operating Systems?

**Reasons:**
- Path separators differ (Windows: `\`, Linux/Mac: `/`)
- File permissions differ
- Font rendering differs (UI tests)
- Native APIs differ
- User expectations differ

## Multi-OS Workflow

```yaml
# .github/workflows/multi-os.yml

name: Multi-OS Tests

on: [push]

jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: test-results-${{ matrix.os }}
          path: test-results/
```

## OS-Specific Steps

```yaml
steps:
  - uses: actions/checkout@v4
  
  # Linux-specific
  - name: Install Linux dependencies
    if: runner.os == 'Linux'
    run: |
      sudo apt-get update
      sudo apt-get install -y libgtk-3-0
  
  # Windows-specific
  - name: Install Windows dependencies
    if: runner.os == 'Windows'
    run: |
      choco install visualstudio2019buildtools
  
  # macOS-specific
  - name: Install macOS dependencies
    if: runner.os == 'macOS'
    run: |
      brew install cairo
  
  # Run tests (all OS)
  - run: npm test
```

## Cost Considerations

| OS | Relative Cost | Use When |
|----|---------------|----------|
| **Ubuntu** | 1× (cheapest) | Default choice |
| **Windows** | 2× | Testing Windows apps |
| **macOS** | 10× (expensive!) | Testing Safari, iOS apps |

**Strategy:** Run most tests on Ubuntu, selective tests on Windows/macOS.

---

# 11. Scheduled Test Runs

## Cron Syntax Primer

```
* * * * *
│ │ │ │ │
│ │ │ │ └─ Day of week (0-6, Sunday=0)
│ │ │ └─── Month (1-12)
│ │ └───── Day of month (1-31)
│ └─────── Hour (0-23)
└───────── Minute (0-59)
```

## Common Schedules

### Daily at 2 AM UTC

```yaml
on:
  schedule:
    - cron: '0 2 * * *'
```

### Every Monday at 9 AM UTC

```yaml
on:
  schedule:
    - cron: '0 9 * * 1'
```

### Twice Daily (6 AM and 6 PM UTC)

```yaml
on:
  schedule:
    - cron: '0 6,18 * * *'
```

### Every Hour

```yaml
on:
  schedule:
    - cron: '0 * * * *'
```

### Weekdays Only at 8 AM UTC

```yaml
on:
  schedule:
    - cron: '0 8 * * 1-5'
```

## Complete Scheduled Workflow

```yaml
# .github/workflows/nightly.yml

name: Nightly Tests

on:
  schedule:
    # Monday-Friday at 2 AM UTC
    - cron: '0 2 * * 1-5'
  
  workflow_dispatch:  # Also allow manual trigger

jobs:
  nightly:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run full regression suite
        run: npx playwright test --grep @regression
        timeout-minutes: 60
      
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: nightly-report-${{ github.run_number }}
          path: playwright-report/
      
      - name: Send Slack notification
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          webhook-url: ${{ secrets.SLACK_WEBHOOK }}
          payload: |
            {
              "text": "🚨 Nightly tests FAILED!",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "Nightly tests failed. <${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}|View details>"
                  }
                }
              ]
            }
```

## Multiple Schedules

```yaml
on:
  schedule:
    # Smoke tests every 2 hours
    - cron: '0 */2 * * *'
    
    # Full regression nightly at 2 AM
    - cron: '0 2 * * *'
    
    # Weekly performance tests (Sunday 3 AM)
    - cron: '0 3 * * 0'

jobs:
  determine-suite:
    runs-on: ubuntu-latest
    outputs:
      suite: ${{ steps.check-time.outputs.suite }}
    
    steps:
      - id: check-time
        run: |
          HOUR=$(date -u +%H)
          DAY=$(date -u +%u)
          
          if [ "$DAY" = "7" ] && [ "$HOUR" = "3" ]; then
            echo "suite=performance" >> $GITHUB_OUTPUT
          elif [ "$HOUR" = "2" ]; then
            echo "suite=regression" >> $GITHUB_OUTPUT
          else
            echo "suite=smoke" >> $GITHUB_OUTPUT
          fi
  
  run-tests:
    needs: determine-suite
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run ${{ needs.determine-suite.outputs.suite }} tests
        run: npx playwright test --grep @${{ needs.determine-suite.outputs.suite }}
```

---

# 12. Manual Workflow Triggers

## workflow_dispatch Event

Allows manual workflow execution from GitHub UI.

```yaml
on:
  workflow_dispatch:  # Enable manual trigger
```

## Adding Input Parameters

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: 'Environment to test'
        required: true
        default: 'staging'
        type: choice
        options:
          - staging
          - production
          - qa
      
      browser:
        description: 'Browser to test'
        required: false
        default: 'chromium'
        type: choice
        options:
          - chromium
          - firefox
          - webkit
          - all
      
      test-suite:
        description: 'Test suite to run'
        type: string
        default: 'smoke'
      
      enable-debug:
        description: 'Enable debug mode'
        type: boolean
        default: false

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Display inputs
        run: |
          echo "Environment: ${{ inputs.environment }}"
          echo "Browser: ${{ inputs.browser }}"
          echo "Test suite: ${{ inputs.test-suite }}"
          echo "Debug mode: ${{ inputs.enable-debug }}"
      
      - name: Set base URL
        run: |
          if [ "${{ inputs.environment }}" = "production" ]; then
            echo "BASE_URL=https://prod.example.com" >> $GITHUB_ENV
          elif [ "${{ inputs.environment }}" = "staging" ]; then
            echo "BASE_URL=https://staging.example.com" >> $GITHUB_ENV
          else
            echo "BASE_URL=https://qa.example.com" >> $GITHUB_ENV
          fi
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run tests
        run: |
          if [ "${{ inputs.browser }}" = "all" ]; then
            npx playwright test --grep @${{ inputs.test-suite }}
          else
            npx playwright test --grep @${{ inputs.test-suite }} --project=${{ inputs.browser }}
          fi
        env:
          BASE_URL: ${{ env.BASE_URL }}
          DEBUG: ${{ inputs.enable-debug }}
```

## Triggering Manual Workflow

### Via GitHub UI

1. Go to **Actions** tab
2. Select workflow name
3. Click **Run workflow** button
4. Fill in parameters
5. Click **Run workflow**

### Via GitHub CLI

```bash
# Trigger workflow with inputs
gh workflow run playwright.yml \
  -f environment=staging \
  -f browser=chromium \
  -f test-suite=regression \
  -f enable-debug=true
```

### Via API

```bash
curl -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token YOUR_GITHUB_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/workflows/playwright.yml/dispatches \
  -d '{
    "ref": "main",
    "inputs": {
      "environment": "staging",
      "browser": "chromium",
      "test-suite": "smoke",
      "enable-debug": "false"
    }
  }'
```

---

# 13. Caching Dependencies

## Why Cache?

**Without caching:**
```
Job 1: npm install → 2 minutes
Job 2: npm install → 2 minutes
Job 3: npm install → 2 minutes
Total: 6 minutes + $0.60 cost
```

**With caching:**
```
Job 1: npm install → 2 minutes (cache miss)
Job 2: Restore cache → 10 seconds
Job 3: Restore cache → 10 seconds
Total: 2.5 minutes + $0.25 cost (58% savings!)
```

## Caching Node Modules

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'  # Automatically cache npm dependencies
  
  - run: npm ci  # Will use cache if available
```

**Auto-cache key:** Based on `package-lock.json` hash.

## Caching Python Dependencies

```yaml
steps:
  - uses: actions/checkout@v4
  
  - uses: actions/setup-python@v5
    with:
      python-version: '3.11'
      cache: 'pip'  # Cache pip dependencies
  
  - run: pip install -r requirements.txt
```

**Auto-cache key:** Based on `requirements.txt` hash.

## Manual Cache Control

```yaml
steps:
  - uses: actions/checkout@v4
  
  # Cache Playwright browsers
  - name: Cache Playwright browsers
    uses: actions/cache@v4
    with:
      path: ~/.cache/ms-playwright
      key: playwright-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
      restore-keys: |
        playwright-${{ runner.os }}-
  
  - uses: actions/setup-node@v4
    with:
      node-version: '20'
      cache: 'npm'
  
  - run: npm ci
  
  - name: Install Playwright (uses cache)
    run: npx playwright install --with-deps chromium
```

## Multiple Cache Keys

```yaml
- uses: actions/cache@v4
  with:
    path: |
      ~/.npm
      ~/.cache/ms-playwright
      node_modules
    key: ${{ runner.os }}-deps-${{ hashFiles('**/package-lock.json') }}
    restore-keys: |
      ${{ runner.os }}-deps-
      ${{ runner.os }}-
```

## Cache Limits

- **Maximum cache size:** 10 GB per repository
- **Retention:** 7 days (last accessed)
- **Total limit:** Sum of all caches ≤ 10 GB

**Best practice:** Cache only necessary files (node_modules, browsers, build artifacts).

---

# 14. Managing Secrets

## What Are Secrets?

Secrets = **Encrypted environment variables** for sensitive data.

**Examples:**
- API tokens
- Database passwords
- AWS credentials
- Slack webhook URLs

## Adding Secrets to Repository

### Step 1: Navigate to Secrets

1. Go to repository on GitHub
2. Click **Settings**
3. Left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Step 2: Add Secret

```
Name: API_TOKEN
Value: sk_live_1234567890abcdef
```

Click **Add secret**

### Step 3: Use in Workflow

```yaml
steps:
  - name: Run tests with API token
    run: npm test
    env:
      API_TOKEN: ${{ secrets.API_TOKEN }}
```

**Security:** Secrets are masked in logs (`***`)!

## Types of Secrets

### 1. **Repository Secrets**
- Available to all workflows in this repo
- Scope: Single repository

### 2. **Environment Secrets**
- Tied to specific environment (staging, production)
- Can require approval before use

### 3. **Organization Secrets**
- Available to all repos in organization
- Scope: Entire organization

## Environment-Specific Secrets

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production  # Use 'production' environment
    
    steps:
      - run: echo "Deploying to production"
        env:
          PROD_API_KEY: ${{ secrets.PROD_API_KEY }}
```

**Benefit:** Different secrets for dev/staging/prod!

## Best Practices

### ✅ Do

```yaml
# Store secrets in GitHub Secrets
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

### ❌ Don't

```yaml
# Never hardcode secrets!
env:
  API_KEY: sk_live_1234567890abcdef  # BAD!
```

### ✅ Use .env Files (with secrets)

```yaml
steps:
  - name: Create .env file
    run: |
      cat << EOF > .env
      API_KEY=${{ secrets.API_KEY }}
      DB_PASSWORD=${{ secrets.DB_PASSWORD }}
      EOF
  
  - name: Run tests
    run: npm test  # Reads .env file
```

## Accessing Secrets in Actions

```yaml
steps:
  - name: Deploy to AWS
    uses: aws-actions/configure-aws-credentials@v4
    with:
      aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
      aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
      aws-region: us-east-1
```

## Secret Rotation

**Recommended schedule:**
- Critical secrets: Every 30 days
- Regular secrets: Every 90 days
- After employee departure: Immediately

**How to rotate:**
1. Generate new secret value
2. Update in GitHub Secrets
3. Update in application/service
4. Deploy changes
5. Verify old secret no longer works

---

# 15. Uploading Test Artifacts

## What Are Artifacts?

Artifacts = **Files generated during workflow** (test reports, screenshots, logs).

**Examples:**
- HTML test reports
- Screenshots on failure
- Videos of test execution
- Log files
- Coverage reports

## Basic Artifact Upload

```yaml
steps:
  - name: Run tests
    run: npm test
  
  - name: Upload test report
    if: always()  # Upload even if tests fail
    uses: actions/upload-artifact@v4
    with:
      name: test-report
      path: test-results/
      retention-days: 30
```

## Uploading Multiple Artifacts

```yaml
- name: Upload HTML report
  if: always()
  uses: actions/upload-artifact@v4
  with:
    name: html-report
    path: playwright-report/

- name: Upload screenshots
  if: failure()  # Only on failure
  uses: actions/upload-artifact@v4
  with:
    name: screenshots
    path: test-results/**/*.png

- name: Upload videos
  if: failure()
  uses: actions/upload-artifact@v4
  with:
    name: videos
    path: test-results/**/*.webm
```

## Conditional Upload

```yaml
# Upload only on failure
- uses: actions/upload-artifact@v4
  if: failure()
  with:
    name: failure-artifacts
    path: test-results/

# Upload only on success
- uses: actions/upload-artifact@v4
  if: success()
  with:
    name: coverage-report
    path: coverage/

# Always upload (regardless of success/failure)
- uses: actions/upload-artifact@v4
  if: always()
  with:
    name: test-logs
    path: logs/
```

## Downloading Artifacts

### Via GitHub UI

1. Go to **Actions** tab
2. Click on workflow run
3. Scroll to **Artifacts** section
4. Click artifact name to download ZIP

### Via GitHub CLI

```bash
# List artifacts for a run
gh run view 1234567890 --log

# Download artifact
gh run download 1234567890 -n test-report

# Download all artifacts
gh run download 1234567890
```

### Via API

```bash
curl -L \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/repos/OWNER/REPO/actions/runs/RUN_ID/artifacts
```

## Artifact Retention

**Default:** 90 days

**Custom retention:**

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: short-lived-report
    path: report/
    retention-days: 7  # Delete after 7 days
```

**Cost consideration:** Artifacts count toward storage quota!

## Artifact Size Limits

- **Maximum size per artifact:** 10 GB
- **Maximum size per workflow run:** 50 GB
- **Storage quota:** Varies by plan
  - Free: 500 MB
  - Pro: 2 GB
  - Team: 50 GB
  - Enterprise: 200 GB

---

# 16. Parallel Execution Strategies

## Why Parallel Execution?

**Sequential execution:**
```
Test Suite A (10 min)
    ↓
Test Suite B (10 min)
    ↓
Test Suite C (10 min)
Total: 30 minutes
```

**Parallel execution:**
```
Test Suite A (10 min) ⎤
Test Suite B (10 min) ⎬ Running simultaneously
Test Suite C (10 min) ⎦
Total: 10 minutes (66% faster!)
```

## Strategy 1: Job-Level Parallelism

```yaml
jobs:
  test-unit:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:unit
  
  test-integration:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:integration
  
  test-e2e:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:e2e
```

**Result:** All 3 jobs run in parallel!

## Strategy 2: Matrix Parallelism

```yaml
jobs:
  test:
    strategy:
      matrix:
        shard: [1, 2, 3, 4, 5]  # Split into 5 shards
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test --shard=${{ matrix.shard }}/5
```

**Result:** Tests split into 5 parallel jobs!

## Strategy 3: Playwright Native Sharding

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        shardIndex: [1, 2, 3, 4, 5, 6, 7, 8]
        shardTotal: [8]
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run tests (shard ${{ matrix.shardIndex }}/${{ matrix.shardTotal }})
        run: npx playwright test --shard=${{ matrix.shardIndex }}/${{ matrix.shardTotal }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-${{ matrix.shardIndex }}
          path: playwright-report/
          retention-days: 7
```

## Strategy 4: Pytest xdist

```yaml
steps:
  - run: pip install pytest-xdist
  
  # Run with 8 parallel workers
  - run: pytest -n 8
```

## Combining Strategies

```yaml
jobs:
  test:
    strategy:
      matrix:
        os: [ubuntu-latest, windows-latest]
        browser: [chromium, firefox]
        shard: [1, 2, 3, 4]
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      - run: npx playwright test --project=${{ matrix.browser }} --shard=${{ matrix.shard }}/4
```

**Result:** 2 OS × 2 browsers × 4 shards = **16 parallel jobs!** 🚀

---

# 17. Handling Flaky Tests

## What Are Flaky Tests?

**Flaky test** = Test that sometimes passes, sometimes fails (non-deterministic).

**Common causes:**
- Network timeouts
- Race conditions
- Timestamp dependencies
- External API failures
- Resource contention

## Strategy 1: Automatic Retries

### Playwright Configuration

```typescript
// playwright.config.ts

export default defineConfig({
  retries: process.env.CI ? 2 : 0,  // Retry 2 times in CI
  
  use: {
    actionTimeout: 10000,  // Wait 10s for actions
    navigationTimeout: 30000,  // Wait 30s for navigation
  },
});
```

### GitHub Actions Retry

```yaml
- name: Run tests with retries
  uses: nick-fields/retry@v2
  with:
    timeout_minutes: 30
    max_attempts: 3
    command: npx playwright test
```

## Strategy 2: Quarantine Flaky Tests

```typescript
// Mark flaky test
test('flaky test', async ({ page }) => {
  test.fixme(true, 'Known flaky test - quarantined');
  // Test code
});
```

```yaml
# Run only stable tests in CI
- run: npx playwright test --grep-invert @flaky
```

## Strategy 3: Separate Job for Flaky Tests

```yaml
jobs:
  stable-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --grep-invert @flaky
  
  flaky-tests:
    runs-on: ubuntu-latest
    continue-on-error: true  # Don't fail workflow if flaky tests fail
    steps:
      - run: npx playwright test --grep @flaky
```

## Strategy 4: Rerun Failed Tests

```yaml
steps:
  - name: Run tests (first attempt)
    id: first-run
    continue-on-error: true
    run: npx playwright test
  
  - name: Rerun failed tests
    if: steps.first-run.outcome == 'failure'
    run: npx playwright test --only-failed
```

## Strategy 5: Track Flaky Tests

Use ReportPortal to automatically detect flaky tests!

```typescript
// playwright.config.ts
reporter: [
  ['@reportportal/agent-js-playwright', {
    apiKey: process.env.RP_TOKEN,
    endpoint: process.env.RP_ENDPOINT,
    project: process.env.RP_PROJECT,
  }]
],
```

**ReportPortal shows:**
- Tests with < 100% pass rate
- Patterns in failures
- Auto-categorization

---

# 18. Self-Hosted Runners

## Why Self-Hosted Runners?

**Use cases:**
1. **Cost savings:** Free compute (you pay infrastructure)
2. **Access private resources:** Database, internal APIs
3. **Custom hardware:** GPU, high RAM, specific OS
4. **Security:** Data never leaves your network
5. **Unlimited minutes:** No 2000 min/month limit

## Setting Up Self-Hosted Runner

### Step 1: Prepare Server

**Requirements:**
- Ubuntu 20.04+ / Windows Server 2019+ / macOS 10.15+
- 4 GB RAM minimum
- 20 GB disk space
- Docker installed (for containerized builds)

### Step 2: Add Runner to Repository

1. Go to **Settings** → **Actions** → **Runners**
2. Click **New self-hosted runner**
3. Choose OS (Linux/Windows/macOS)
4. Follow instructions shown

### Step 3: Install Runner (Ubuntu Example)

```bash
# Create directory
mkdir actions-runner && cd actions-runner

# Download runner
curl -o actions-runner-linux-x64-2.311.0.tar.gz -L \
  https://github.com/actions/runner/releases/download/v2.311.0/actions-runner-linux-x64-2.311.0.tar.gz

# Extract
tar xzf ./actions-runner-linux-x64-2.311.0.tar.gz

# Configure
./config.sh --url https://github.com/YOUR_ORG/YOUR_REPO --token YOUR_TOKEN

# Run interactively (testing)
./run.sh

# Or install as service (production)
sudo ./svc.sh install
sudo ./svc.sh start
```

### Step 4: Use in Workflow

```yaml
jobs:
  test:
    runs-on: self-hosted  # Use self-hosted runner
    
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

## Runner Labels

Add custom labels to organize runners:

```bash
# Configure with labels
./config.sh --url ... --token ... --labels linux,x64,gpu
```

Use in workflow:

```yaml
jobs:
  gpu-test:
    runs-on: [self-hosted, linux, gpu]  # Requires all labels
    steps:
      - run: python train_model.py
```

## Using Docker on Self-Hosted Runner

```yaml
jobs:
  test:
    runs-on: self-hosted
    
    container:
      image: mcr.microsoft.com/playwright:v1.40.0-jammy
    
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright test
```

## Auto-Scaling Self-Hosted Runners

Use **actions-runner-controller** (ARC) for Kubernetes:

```bash
# Install ARC in Kubernetes cluster
helm repo add actions-runner-controller https://actions-runner-controller.github.io/actions-runner-controller
helm install arc actions-runner-controller/actions-runner-controller

# Configure runner deployment
kubectl apply -f runner-deployment.yaml
```

**runner-deployment.yaml:**

```yaml
apiVersion: actions.summerwind.dev/v1alpha1
kind: RunnerDeployment
metadata:
  name: playwright-runners
spec:
  replicas: 3  # 3 concurrent runners
  template:
    spec:
      repository: your-org/your-repo
      image: mcr.microsoft.com/playwright:v1.40.0-jammy
      resources:
        limits:
          memory: "4Gi"
          cpu: "2"
```

**Result:** Auto-scaling runners based on demand!

## Security Best Practices

### ✅ Do

- Use dedicated machines for runners
- Isolate runners per repository/team
- Regularly update runner software
- Use ephemeral runners (destroy after job)
- Monitor runner activity logs

### ❌ Don't

- Run on developer workstations
- Share runners across untrusted repos
- Allow public repos to use your runners
- Run as root/administrator
- Skip security updates

---

# 19. Advanced Workflow Patterns

## Pattern 1: Dependent Jobs

```yaml
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - uses: actions/upload-artifact@v4
        with:
          name: build-files
          path: dist/
  
  test:
    needs: build  # Wait for build to complete
    runs-on: ubuntu-latest
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: build-files
      - run: npm test
  
  deploy:
    needs: [build, test]  # Wait for both
    runs-on: ubuntu-latest
    steps:
      - run: npm run deploy
```

## Pattern 2: Conditional Jobs

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  
  deploy-staging:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - run: deploy staging
  
  deploy-production:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - run: deploy production
```

## Pattern 3: Reusable Workflows

**reusable-test.yml:**

```yaml
# .github/workflows/reusable-test.yml

name: Reusable Test Workflow

on:
  workflow_call:
    inputs:
      node-version:
        required: true
        type: string
      test-command:
        required: false
        type: string
        default: 'npm test'
    secrets:
      api-token:
        required: true

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ inputs.node-version }}
      - run: npm ci
      - run: ${{ inputs.test-command }}
        env:
          API_TOKEN: ${{ secrets.api-token }}
```

**Using reusable workflow:**

```yaml
# .github/workflows/main.yml

jobs:
  test-node-18:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '18'
      test-command: 'npm run test:unit'
    secrets:
      api-token: ${{ secrets.API_TOKEN }}
  
  test-node-20:
    uses: ./.github/workflows/reusable-test.yml
    with:
      node-version: '20'
      test-command: 'npm run test:integration'
    secrets:
      api-token: ${{ secrets.API_TOKEN }}
```

## Pattern 4: Dynamic Matrix

```yaml
jobs:
  prepare:
    runs-on: ubuntu-latest
    outputs:
      matrix: ${{ steps.set-matrix.outputs.matrix }}
    steps:
      - id: set-matrix
        run: |
          # Generate matrix based on files changed
          echo 'matrix={"project":["chromium","firefox","webkit"]}' >> $GITHUB_OUTPUT
  
  test:
    needs: prepare
    strategy:
      matrix: ${{ fromJson(needs.prepare.outputs.matrix) }}
    runs-on: ubuntu-latest
    steps:
      - run: npx playwright test --project=${{ matrix.project }}
```

## Pattern 5: Approval Gates

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  
  deploy:
    needs: test
    runs-on: ubuntu-latest
    environment: production  # Requires approval
    steps:
      - run: kubectl apply -f deployment.yaml
```

**Setup approval:**
1. Settings → Environments → production
2. Add **required reviewers**
3. Save

**Result:** Deployment pauses until approved! 🛡️

## Pattern 6: Composite Actions

Create reusable action:

```yaml
# .github/actions/setup-test-env/action.yml

name: Setup Test Environment
description: Sets up Node.js and Playwright

inputs:
  node-version:
    required: true
    description: 'Node.js version'

runs:
  using: composite
  steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ inputs.node-version }}
        cache: 'npm'
    
    - run: npm ci
      shell: bash
    
    - run: npx playwright install --with-deps
      shell: bash
```

**Use composite action:**

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-test-env
        with:
          node-version: '20'
      - run: npx playwright test
```

---

# 20. Integration with ReportPortal

## Complete Integration Example

```yaml
# .github/workflows/reportportal.yml

name: Tests with ReportPortal

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 2 * * *'

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      
      - name: Run tests
        run: npx playwright test
        env:
          # ReportPortal configuration
          RP_TOKEN: ${{ secrets.RP_TOKEN }}
          RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
          RP_PROJECT: ${{ secrets.RP_PROJECT }}
          RP_LAUNCH: "GitHub Actions [${{ github.ref_name }}] - Run #${{ github.run_number }}"
          
          # Add useful attributes
          RP_ATTRIBUTES: |
            ci:github-actions
            branch:${{ github.ref_name }}
            event:${{ github.event_name }}
            actor:${{ github.actor }}
            run:${{ github.run_number }}
          
          # Application under test
          BASE_URL: https://demo.playwright.dev
      
      - name: Upload artifacts (fallback)
        if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: test-results/
          retention-days: 7
      
      - name: Comment PR with ReportPortal link
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v7
        with:
          script: |
            const rpUrl = process.env.RP_ENDPOINT.replace('/api/v1', '');
            const rpProject = process.env.RP_PROJECT;
            const launchUrl = `${rpUrl}/ui/#${rpProject}/launches/all`;
            
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: `🎯 Test results: [View in ReportPortal](${launchUrl})`
            });
```

## Playwright Config for ReportPortal

```typescript
// playwright.config.ts

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  
  reporter: [
    ['list'],
    ['html'],
    ['@reportportal/agent-js-playwright', {
      apiKey: process.env.RP_TOKEN,
      endpoint: process.env.RP_ENDPOINT,
      project: process.env.RP_PROJECT,
      launch: process.env.RP_LAUNCH || 'Default Launch',
      description: `Automated tests from GitHub Actions\nBranch: ${process.env.GITHUB_REF || 'unknown'}`,
      
      attributes: process.env.RP_ATTRIBUTES
        ? process.env.RP_ATTRIBUTES.split('\n').map(attr => {
            const [key, value] = attr.split(':');
            return { key: key.trim(), value: value?.trim() || '' };
          })
        : [],
      
      uploadScreenshot: true,
      uploadVideo: true,
      uploadTrace: true,
    }]
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
});
```

## Matrix Tests with ReportPortal

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, windows-latest, macos-latest]
        browser: [chromium, firefox, webkit]
        exclude:
          - os: windows-latest
            browser: webkit
    
    runs-on: ${{ matrix.os }}
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run tests
        run: npx playwright test --project=${{ matrix.browser }}
        env:
          RP_TOKEN: ${{ secrets.RP_TOKEN }}
          RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
          RP_PROJECT: demo-automation
          RP_LAUNCH: "CI [${{ matrix.os }}] [${{ matrix.browser }}] - Run #${{ github.run_number }}"
          RP_ATTRIBUTES: |
            os:${{ matrix.os }}
            browser:${{ matrix.browser }}
            ci:github-actions
```

**Result:** 9 separate launches in ReportPortal (3 OS × 3 browsers)!

---

# 21. Notifications and Alerts

## Slack Notifications

### Step 1: Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create new app
3. Enable **Incoming Webhooks**
4. Create webhook for channel
5. Copy webhook URL

### Step 2: Add to GitHub Secrets

```
Name: SLACK_WEBHOOK_URL
Value: https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXX
```

### Step 3: Add to Workflow

```yaml
steps:
  - name: Run tests
    id: tests
    run: npm test
  
  - name: Slack notification - Success
    if: success()
    uses: slackapi/slack-github-action@v1
    with:
      payload: |
        {
          "text": "✅ Tests passed!",
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "✅ *Tests passed!*\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}\n*Commit:* ${{ github.sha }}"
              }
            },
            {
              "type": "actions",
              "elements": [
                {
                  "type": "button",
                  "text": {"type": "plain_text", "text": "View Run"},
                  "url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
                }
              ]
            }
          ]
        }
    env:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
  
  - name: Slack notification - Failure
    if: failure()
    uses: slackapi/slack-github-action@v1
    with:
      payload: |
        {
          "text": "🚨 Tests failed!",
          "blocks": [
            {
              "type": "section",
              "text": {
                "type": "mrkdwn",
                "text": "🚨 *Tests failed!*\n*Repository:* ${{ github.repository }}\n*Branch:* ${{ github.ref_name }}\n*Triggered by:* ${{ github.actor }}"
              }
            }
          ]
        }
    env:
      SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
      SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

## Email Notifications

### Built-in GitHub Notifications

GitHub sends emails automatically:
- When workflow fails
- When your workflow completes

**Enable:**
1. Settings → Notifications
2. Check **Actions**
3. Choose notification preferences

### Custom Email via SendGrid

```yaml
- name: Send email on failure
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.sendgrid.net
    server_port: 587
    username: apikey
    password: ${{ secrets.SENDGRID_API_KEY }}
    subject: "🚨 Tests Failed - ${{ github.repository }}"
    to: qa-team@company.com
    from: github-actions@company.com
    body: |
      Tests failed in ${{ github.repository }}
      
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
      Actor: ${{ github.actor }}
      
      View details: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}
```

## Microsoft Teams

```yaml
- name: Notify Teams
  if: failure()
  uses: jdcargile/ms-teams-notification@v1.4
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    ms-teams-webhook-uri: ${{ secrets.MS_TEAMS_WEBHOOK }}
    notification-summary: "Tests Failed in ${{ github.repository }}"
    notification-color: dc3545
    timezone: America/New_York
```

## Discord Notifications

```yaml
- name: Discord notification
  if: always()
  uses: sarisia/actions-status-discord@v1
  with:
    webhook: ${{ secrets.DISCORD_WEBHOOK }}
    status: ${{ job.status }}
    title: "Test Results"
    description: |
      Repository: ${{ github.repository }}
      Branch: ${{ github.ref_name }}
      Commit: ${{ github.sha }}
    color: 0x00ff00  # Green
    username: GitHub Actions
```

## Custom Webhook

```yaml
- name: Send custom webhook
  if: failure()
  run: |
    curl -X POST ${{ secrets.CUSTOM_WEBHOOK_URL }} \
      -H "Content-Type: application/json" \
      -d '{
        "status": "failure",
        "repository": "${{ github.repository }}",
        "branch": "${{ github.ref_name }}",
        "commit": "${{ github.sha }}",
        "actor": "${{ github.actor }}",
        "run_url": "${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
      }'
```

---

# 22. Cost Optimization

## Understanding GitHub Actions Pricing

### Free Tier

| Plan | Storage | Minutes/Month | Concurrent Jobs |
|------|---------|---------------|-----------------|
| **Free (Public)** | 500 MB | Unlimited ♾️ | 20 |
| **Free (Private)** | 500 MB | 2,000 | 20 |
| **Pro** | 1 GB | 3,000 | 20 |
| **Team** | 2 GB | 10,000 | 60 |
| **Enterprise** | 50 GB | 50,000 | 500 |

### Minute Multipliers

| Operating System | Multiplier | Example |
|------------------|------------|---------|
| **Linux** | 1× | 10 min = 10 min |
| **Windows** | 2× | 10 min = 20 min |
| **macOS** | 10× | 10 min = 100 min! 💸 |

**Important:** A 10-minute test on macOS consumes **100 minutes** from your quota!

## Cost Optimization Strategies

### Strategy 1: Use Caching

**Without caching:**
```
npm ci → 3 minutes × 10 jobs = 30 minutes
Cost: $0.30 (at $0.008/min for Linux)
```

**With caching:**
```
First job: npm ci → 3 minutes
Jobs 2-10: Restore cache → 15 seconds each
Total: 3 min + (9 × 0.25 min) = 5.25 minutes
Cost: $0.05 (83% savings!)
```

### Strategy 2: Avoid macOS (Unless Required)

**macOS test:**
```
10 minutes runtime = 100 minutes billed
Cost: $0.80
```

**Linux test:**
```
10 minutes runtime = 10 minutes billed
Cost: $0.08 (90% cheaper!)
```

**Best practice:** Run most tests on Linux, only Safari tests on macOS.

### Strategy 3: Use Self-Hosted Runners

**GitHub-hosted:**
```
1000 minutes/month = $8 (after free tier)
100,000 minutes/year = $800
```

**Self-hosted on AWS EC2:**
```
t3.medium (2 vCPU, 4 GB) = $30/month
Benefits: Unlimited minutes, faster (no queue)
Annual cost: $360 (55% cheaper than GitHub-hosted!)
```

### Strategy 4: Cancel Redundant Runs

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true  # Cancel older runs on same branch
```

**Scenario:** Push 3 commits rapidly
- Without cancel: 3 full test runs
- With cancel: Only latest run completes (saves 66% minutes!)

### Strategy 5: Conditional Workflows

```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'tests/**'
      - 'package.json'
```

**Result:** Test only when relevant files change.

**Example:** 
- Change README.md → No tests run ✅
- Change src/app.js → Tests run ✅

### Strategy 6: Smart Matrix Combinations

**Bad (expensive):**
```yaml
strategy:
  matrix:
    os: [ubuntu, windows, macos]
    node: [16, 18, 20, 22]
    browser: [chromium, firefox, webkit]
```

**Result:** 3 OS × 4 Node × 3 browsers = **36 jobs** (expensive!)

**Good (optimized):**
```yaml
strategy:
  matrix:
    include:
      # Comprehensive on Ubuntu (cheap)
      - os: ubuntu-latest
        node: 18
        browser: chromium
      - os: ubuntu-latest
        node: 18
        browser: firefox
      - os: ubuntu-latest
        node: 20
        browser: chromium
      
      # Targeted tests on expensive OS
      - os: macos-latest
        node: 20
        browser: webkit  # Safari only on macOS
```

**Result:** 4 jobs instead of 36 (89% cost reduction!)

### Strategy 7: Reduce Artifact Retention

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: test-report
    path: report/
    retention-days: 7  # Not default 90 days
```

**Savings:** Artifacts count toward storage quota. Shorter retention = lower costs.

## Cost Monitoring

### Calculate Your Usage

```bash
# Install GitHub CLI
gh auth login

# View workflow runs
gh run list --limit 100

# View specific run details
gh run view <run-id>
```

### Monthly Cost Estimate

```
Average test duration: 15 minutes
Tests per day: 20
OS: Linux (1× multiplier)

Daily minutes: 15 × 20 = 300 minutes
Monthly minutes: 300 × 30 = 9,000 minutes

Free tier: 2,000 minutes (private repo)
Billable minutes: 9,000 - 2,000 = 7,000 minutes

Cost: 7,000 × $0.008 = $56/month
```

**Optimization:**
- Use caching → Reduce to 10 min/test → $32/month (43% savings)
- Switch to self-hosted → $0/month (100% savings on minutes)

---

# 23. Common Issues & Fixes

## Issue 1: Workflow Not Triggering

**Symptoms:**
- Push code, but workflow doesn't run
- Scheduled workflow doesn't execute

**Causes & Fixes:**

### Cause 1: Syntax Error in YAML

```yaml
# Bad (syntax error)
on
  push:  # Missing colon

# Good
on:
  push:
```

**Fix:** Validate YAML syntax at https://www.yamllint.com/

### Cause 2: Workflow File Not in Correct Location

```
# Bad
.github/workflow/test.yml  # Missing 's'

# Good
.github/workflows/test.yml
```

### Cause 3: Branch Filter Mismatch

```yaml
on:
  push:
    branches: [main]  # Only triggers on 'main'
  
# Your branch: 'develop' → Won't trigger!
```

**Fix:** Add your branch:

```yaml
on:
  push:
    branches: [main, develop]
```

### Cause 4: Scheduled Workflow on Default Branch

**Problem:** Scheduled workflows only run on **default branch**.

**Fix:**
1. Settings → Branches → Change default branch to where workflow exists
2. Or merge workflow to default branch

---

## Issue 2: Tests Pass Locally, Fail in CI

**Symptoms:**
- `npm test` works on laptop
- Fails in GitHub Actions

**Causes & Fixes:**

### Cause 1: Different Environment Variables

**Local:** .env file loaded
**CI:** No .env file (must use secrets)

**Fix:**

```yaml
steps:
  - name: Create .env
    run: |
      echo "API_KEY=${{ secrets.API_KEY }}" >> .env
      echo "DB_URL=${{ secrets.DB_URL }}" >> .env
  
  - run: npm test
```

### Cause 2: Headless Browser Issues

**Playwright test:**

```javascript
// Works locally (headed)
await page.screenshot({ path: 'screenshot.png' });

// Fails in CI (missing fonts)
```

**Fix:**

```yaml
- name: Install Playwright with deps
  run: npx playwright install --with-deps chromium  # Installs deps!
```

### Cause 3: Timezone Differences

**Local:** Your timezone (e.g., PST)
**CI:** UTC

**Test with date comparison:**

```javascript
// Fails in CI!
expect(new Date().getHours()).toBe(14);
```

**Fix:** Use UTC or mock time:

```javascript
import { setSystemTime } from '@playwright/test';
setSystemTime(new Date('2024-02-08T14:00:00Z'));
```

---

## Issue 3: Playwright Browser Not Found

**Error:**

```
Error: browserType.launch: Executable doesn't exist at /home/runner/.cache/ms-playwright/chromium-1084/chrome-linux/chrome
```

**Cause:** Browsers not installed.

**Fix:**

```yaml
- name: Install Playwright browsers
  run: npx playwright install --with-deps chromium
```

---

## Issue 4: Tests Timeout

**Error:**

```
Error: Test timeout of 30000ms exceeded
```

**Causes & Fixes:**

### Cause 1: Slow CI Environment

**Fix:** Increase timeout:

```typescript
// playwright.config.ts
export default defineConfig({
  timeout: process.env.CI ? 60000 : 30000,  // 60s in CI
});
```

### Cause 2: Waiting for Element That Never Appears

```javascript
// Waits forever
await page.locator('.never-exists').click();
```

**Fix:** Add explicit timeout:

```javascript
await page.locator('.button').click({ timeout: 5000 });
```

---

## Issue 5: Out of Disk Space

**Error:**

```
ENOSPC: no space left on device
```

**Cause:** Test artifacts filling disk.

**Fix 1:** Clean up after tests:

```yaml
- name: Run tests
  run: npm test

- name: Clean up
  if: always()
  run: rm -rf test-results/
```

**Fix 2:** Use cleanup action:

```yaml
- name: Free disk space
  uses: jlumbroso/free-disk-space@main
  with:
    tool-cache: true
    android: true
    dotnet: true
```

---

## Issue 6: Permission Denied

**Error:**

```
Error: EACCES: permission denied, open '/home/runner/work/report.html'
```

**Cause:** File created with wrong permissions.

**Fix:**

```yaml
- name: Generate report
  run: npm run report

- name: Fix permissions
  run: chmod 644 report.html
```

---

## Issue 7: Secrets Not Available in Pull Requests

**Error:**

```
Error: API_KEY is not defined
```

**Cause:** Secrets **not available** in PRs from forks (security).

**Fix 1:** Use environment variables for non-sensitive data:

```yaml
env:
  API_URL: https://api.example.com  # Not a secret
```

**Fix 2:** Require PR approval before accessing secrets:

```yaml
jobs:
  test:
    environment: staging  # Requires approval
    steps:
      - run: npm test
        env:
          API_KEY: ${{ secrets.API_KEY }}
```

---

# 24. Security Best Practices

## 1. Never Hardcode Secrets

### ❌ Bad

```yaml
env:
  DATABASE_URL: postgresql://user:password123@db.example.com/mydb
  API_KEY: sk_live_123456789
```

### ✅ Good

```yaml
env:
  DATABASE_URL: ${{ secrets.DATABASE_URL }}
  API_KEY: ${{ secrets.API_KEY }}
```

---

## 2. Use GITHUB_TOKEN with Minimum Permissions

### ❌ Bad (default permissions)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    # Default: read/write for many resources
```

### ✅ Good (explicit minimal permissions)

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    permissions:
      contents: read  # Read repository only
      checks: write   # Write test results
```

---

## 3. Pin Action Versions to SHA

### ❌ Bad (vulnerable to tag hijacking)

```yaml
- uses: actions/checkout@v4  # Tag can be moved!
```

### ✅ Good (immutable SHA)

```yaml
- uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v4.1.1
```

**How to get SHA:**

```bash
gh api repos/actions/checkout/commits/v4.1.1 --jq .sha
```

---

## 4. Validate Third-Party Actions

**Before using:**
1. Check source code on GitHub
2. Verify number of stars/downloads
3. Check last update date
4. Read security advisories

**Trusted sources:**
- `actions/*` (GitHub official)
- `azure/*` (Microsoft)
- `aws-actions/*` (Amazon)
- `google-github-actions/*` (Google)

---

## 5. Limit Workflow Triggers

### ❌ Bad (allows any branch)

```yaml
on: [push, pull_request]  # Runs on ALL branches
```

### ✅ Good (specific branches)

```yaml
on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
```

---

## 6. Protect Self-Hosted Runners

### ✅ Best Practices

1. **Use ephemeral runners** (destroy after job)
2. **Isolate runners** (one runner per repository)
3. **Don't use for public repositories** (anyone can run code!)
4. **Run in containers** (isolation layer)
5. **Keep software updated** (runner + dependencies)

```yaml
jobs:
  test:
    runs-on: self-hosted
    container:
      image: mcr.microsoft.com/playwright:v1.40.0
```

---

## 7. Scan for Vulnerabilities

```yaml
- name: Run npm audit
  run: npm audit --audit-level=high

- name: Run Snyk
  uses: snyk/actions/node@master
  env:
    SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

---

## 8. Enable Branch Protection

**Settings → Branches → Add rule:**

✅ Require status checks before merging
✅ Require pull request reviews
✅ Require signed commits
✅ Include administrators

**Result:** Can't merge until tests pass! 🛡️

---

# 25. Real-World Example

## Scenario: E-Commerce Test Automation

**Company:** ShopFast Inc.  
**Team:** 8 QA Engineers  
**Application:** Next.js e-commerce platform  
**Tests:** 450 Playwright tests  

### Before GitHub Actions

**Manual Process:**
```
1. Developer pushes code
2. QA manually pulls latest code
3. QA runs tests locally (30 minutes)
4. QA reports results in spreadsheet
5. Repeat for each environment (dev, staging, prod)

Time: 90 minutes per deployment
Frequency: 3 deployments/day
Total: 270 minutes/day = 4.5 hours/day wasted! 😵
```

**Problems:**
- Inconsistent test execution
- Forgot to run some tests
- Results scattered
- No historical data
- Slow feedback loop

### After GitHub Actions

**Automated Process:**

```yaml
# .github/workflows/ecommerce-tests.yml

name: E-Commerce Tests

on:
  push:
    branches: [main, develop]
  pull_request:
  schedule:
    - cron: '0 */4 * * *'  # Every 4 hours

jobs:
  smoke-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      
      - name: Run smoke tests
        run: npx playwright test --grep @smoke
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          API_KEY: ${{ secrets.API_KEY }}
  
  full-regression:
    needs: smoke-tests
    if: github.event_name != 'pull_request'
    
    strategy:
      fail-fast: false
      matrix:
        shard: [1, 2, 3, 4]  # 4 parallel shards
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      
      - name: Run regression (shard ${{ matrix.shard }}/4)
        run: npx playwright test --shard=${{ matrix.shard }}/4
        env:
          BASE_URL: ${{ secrets.STAGING_URL }}
          RP_TOKEN: ${{ secrets.RP_TOKEN }}
          RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
          RP_PROJECT: shopfast-qa
          RP_LAUNCH: "CI Regression [Shard ${{ matrix.shard }}]"
      
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: test-results-shard-${{ matrix.shard }}
          path: test-results/
  
  report:
    needs: full-regression
    if: always()
    runs-on: ubuntu-latest
    
    steps:
      - name: Send Slack notification
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "Test Results",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Test Run Complete*\nBranch: ${{ github.ref_name }}\nStatus: ${{ needs.full-regression.result }}"
                  }
                },
                {
                  "type": "actions",
                  "elements": [
                    {
                      "type": "button",
                      "text": {"type": "plain_text", "text": "View ReportPortal"},
                      "url": "${{ secrets.RP_ENDPOINT }}"
                    }
                  ]
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
          SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

### Results After 3 Months

#### Metrics

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Feedback time** | 90 minutes | 12 minutes | 86% faster ⚡ |
| **Tests per day** | 3 × 450 = 1,350 | 20 × 450 = 9,000 | 566% more coverage 📈 |
| **QA time saved** | 0 | 4.5 hrs/day × 8 QA = 36 hrs/day | $144,000/year saved 💰 |
| **Bugs caught** | 15/month | 47/month | 213% more bugs found 🐛 |
| **Deployment confidence** | 6/10 | 9/10 | +50% confidence 🎯 |

#### Cost Analysis

**GitHub Actions Cost:**
```
450 tests / 4 shards = 112 tests/shard
Time per shard: 12 minutes
Shards: 4 (parallel)
Total time per run: 12 minutes

Runs per day: 20
Daily minutes: 20 runs × 4 shards × 12 min = 960 minutes

Monthly minutes: 960 × 30 = 28,800 minutes
Free tier: 2,000 minutes
Billable: 26,800 minutes

Cost: 26,800 × $0.008 = $214/month
```

**Value Generated:**
```
QA time saved: 36 hours/day × 20 workdays = 720 hours/month
Hourly rate: $50/hour
Value: 720 × $50 = $36,000/month

ROI: ($36,000 - $214) / $214 = 16,714%
Payback period: < 1 day! 🚀
```

#### Team Feedback

**Before GitHub Actions:**
> *"I spend 2-3 hours daily just running tests and compiling results. It's tedious and error-prone."*  
> — Sarah, Senior QA Engineer

**After GitHub Actions:**
> *"Now I focus on exploratory testing and test improvement. The CI handles the repetitive work!"*  
> — Sarah, Senior QA Engineer

> *"We catch bugs in PRs before they reach staging. Deployment confidence is way up!"*  
> — Mike, QA Lead

---

# 26. Practice Exercise

## Hands-On Tutorial: Complete CI/CD Pipeline

**Goal:** Build a complete GitHub Actions workflow for test automation from scratch.

**Time:** 3-4 hours

---

## Part 1: Setup (30 minutes)

### Step 1: Create Repository

```bash
# Create new repository
mkdir my-test-automation
cd my-test-automation
git init
```

### Step 2: Initialize Playwright Project

```bash
npm init -y
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

### Step 3: Create Sample Tests

```typescript
// tests/example.spec.ts

import { test, expect } from '@playwright/test';

test.describe('Example Tests', () => {
  
  test('homepage loads', async ({ page }) => {
    await page.goto('https://demo.playwright.dev');
    await expect(page).toHaveTitle(/Playwright/);
  });

  test('navigation works', async ({ page }) => {
    await page.goto('https://demo.playwright.dev');
    await page.getByRole('link', { name: 'Get started' }).click();
    await expect(page).toHaveURL(/.*intro/);
  });

  test('search functionality', async ({ page }) => {
    await page.goto('https://demo.playwright.dev');
    await page.getByRole('button', { name: 'Search' }).click();
    await page.getByPlaceholder('Search docs').fill('test');
    await expect(page.getByText('Test')).toBeVisible();
  });
});
```

### Step 4: Push to GitHub

```bash
git add .
git commit -m "Initial commit"
gh repo create my-test-automation --public --source=. --remote=origin --push
```

---

## Part 2: Basic Workflow (45 minutes)

### Step 1: Create Workflow File

```yaml
# .github/workflows/tests.yml

name: Playwright Tests

on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npx playwright test
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

### Step 2: Commit and Push

```bash
git add .github/workflows/tests.yml
git commit -m "Add basic workflow"
git push
```

### Step 3: Verify

1. Go to repository on GitHub
2. Click **Actions** tab
3. See workflow running
4. Check results

**Success criteria:**
- ✅ Workflow triggers on push
- ✅ All 3 tests pass
- ✅ Artifacts uploaded

---

## Part 3: Multi-Browser Testing (30 minutes)

### Step 1: Update Workflow

```yaml
jobs:
  test:
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
    
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps ${{ matrix.browser }}
      
      - name: Run tests on ${{ matrix.browser }}
        run: npx playwright test --project=${{ matrix.browser }}
      
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report-${{ matrix.browser }}
          path: playwright-report/
```

### Step 2: Update Playwright Config

```typescript
// playwright.config.ts

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  
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

### Step 3: Push and Verify

```bash
git add .
git commit -m "Add multi-browser support"
git push
```

**Success criteria:**
- ✅ 3 parallel jobs run (chromium, firefox, webkit)
- ✅ All pass
- ✅ 3 separate artifacts uploaded

---

## Part 4: Scheduled Tests (30 minutes)

### Step 1: Add Schedule

```yaml
on:
  push:
    branches: [main]
  pull_request:
  schedule:
    - cron: '0 */6 * * *'  # Every 6 hours
  workflow_dispatch:  # Manual trigger
```

### Step 2: Add Manual Inputs

{% raw %}
```yaml
on:
  workflow_dispatch:
    inputs:
      browser:
        description: 'Browser to test'
        required: true
        default: 'chromium'
        type: choice
        options:
          - chromium
          - firefox
          - webkit
          - all

jobs:
  test:
    strategy:
      matrix:
        browser: ${{ github.event_name == 'workflow_dispatch' && (inputs.browser == 'all' && fromJSON('["chromium","firefox","webkit"]') || fromJSON(format('["{0}"]', inputs.browser))) || fromJSON('["chromium"]') }}
```
{% endraw %}

### Step 3: Test Manual Trigger

1. Go to Actions tab
2. Select workflow
3. Click **Run workflow**
4. Choose browser
5. Click **Run workflow**

**Success criteria:**
- ✅ Can trigger manually
- ✅ Browser selection works
- ✅ "All" option runs 3 browsers

---

## Part 5: Integration with ReportPortal (45 minutes)

### Step 1: Setup ReportPortal (if not already)

```bash
mkdir ~/reportportal && cd ~/reportportal
curl -LO https://raw.githubusercontent.com/reportportal/reportportal/master/docker-compose.yml
docker compose -p reportportal up -d
```

Wait 2 minutes, then open http://localhost:8080

Login: `superadmin` / `erebus`

### Step 2: Install Reporter

```bash
npm install -D @reportportal/agent-js-playwright dotenv
```

### Step 3: Configure Playwright

```typescript
// playwright.config.ts

import { defineConfig } from '@playwright/test';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  // ... existing config
  
  reporter: [
    ['list'],
    ['html'],
    ['@reportportal/agent-js-playwright', {
      apiKey: process.env.RP_TOKEN,
      endpoint: process.env.RP_ENDPOINT,
      project: process.env.RP_PROJECT,
      launch: process.env.RP_LAUNCH || 'Local Tests',
      uploadScreenshot: true,
    }]
  ],
});
```

### Step 4: Add Secrets to GitHub

1. Settings → Secrets → Actions
2. Add secrets:
   - `RP_TOKEN`: (get from ReportPortal Profile → API Keys)
   - `RP_ENDPOINT`: `http://YOUR_SERVER:8080`
   - `RP_PROJECT`: `default_personal`

### Step 5: Update Workflow

```yaml
- name: Run tests
  run: npx playwright test --project=${{ matrix.browser }}
  env:
    RP_TOKEN: ${{ secrets.RP_TOKEN }}
    RP_ENDPOINT: ${{ secrets.RP_ENDPOINT }}
    RP_PROJECT: ${{ secrets.RP_PROJECT }}
    RP_LAUNCH: "CI [${{ matrix.browser }}] - Run #${{ github.run_number }}"
```

### Step 6: Push and Verify

```bash
git add .
git commit -m "Add ReportPortal integration"
git push
```

Check ReportPortal dashboard for results!

**Success criteria:**
- ✅ Tests appear in ReportPortal
- ✅ Screenshots uploaded on failure
- ✅ Each browser creates separate launch

---

## Part 6: Slack Notifications (30 minutes)

### Step 1: Create Slack Webhook

1. Go to https://api.slack.com/apps
2. Create app → From scratch
3. Enable Incoming Webhooks
4. Add webhook for #test-results channel
5. Copy webhook URL

### Step 2: Add to GitHub Secrets

Name: `SLACK_WEBHOOK`
Value: (paste webhook URL)

### Step 3: Add to Workflow

```yaml
- name: Notify Slack
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "${{ job.status == 'success' && '✅' || '🚨' }} Tests ${{ job.status }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Browser:* ${{ matrix.browser }}\n*Branch:* ${{ github.ref_name }}"
            }
          }
        ]
      }
  env:
    SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
    SLACK_WEBHOOK_TYPE: INCOMING_WEBHOOK
```

**Success criteria:**
- ✅ Slack message sent after tests
- ✅ Shows browser and status
- ✅ Link to workflow run

---

## Bonus Challenges

### Challenge 1: Add Flaky Test Handling

Create intentionally flaky test:

```typescript
test('flaky test', async ({ page }) => {
  // Passes 50% of the time
  const random = Math.random();
  expect(random).toBeGreaterThan(0.3);
});
```

Configure retries and observe behavior.

### Challenge 2: Add Performance Budget

```typescript
test('homepage loads fast', async ({ page }) => {
  const start = Date.now();
  await page.goto('https://demo.playwright.dev');
  const duration = Date.now() - start;
  
  expect(duration).toBeLessThan(3000);  // Must load in < 3s
});
```

### Challenge 3: Add Visual Testing

```bash
npm install -D @playwright/test playwright-visual-compare
```

Add visual regression test and fail workflow if screenshots differ.

---

## Verification Checklist

✅ Repository created and pushed to GitHub
✅ Basic workflow runs on push
✅ Multi-browser matrix working
✅ Scheduled tests configured
✅ Manual workflow dispatch with inputs
✅ Caching implemented (npm cache)
✅ ReportPortal integration working
✅ Slack notifications sending
✅ Artifacts uploaded and downloadable
✅ All tests passing consistently

**Congratulations!** 🎉 You've built a production-ready test automation pipeline!

---

## Next Steps

1. **Add more test scenarios**
   - API tests
   - Mobile viewport tests
   - Accessibility tests

2. **Optimize costs**
   - Implement self-hosted runners
   - Reduce macOS usage
   - Optimize caching

3. **Enhance monitoring**
   - Add test coverage reporting
   - Track test execution trends
   - Set up alerting for flaky tests

4. **Scale the pipeline**
   - Add multiple environments (dev/staging/prod)
   - Implement deployment workflows
   - Add approval gates for production

---

## Additional Resources

### Official Documentation
- GitHub Actions: https://docs.github.com/actions
- Playwright: https://playwright.dev/docs/intro
- ReportPortal: https://reportportal.io/docs

### Community
- GitHub Actions Forum: https://github.community/c/actions
- Playwright Discord: https://aka.ms/playwright/discord
- ReportPortal Slack: https://reportportal.io/community

### Blog Posts & Tutorials
- GitHub Actions Best Practices: https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions
- Playwright CI Guide: https://playwright.dev/docs/ci
- Cost Optimization: https://docs.github.com/en/billing/managing-billing-for-github-actions/about-billing-for-github-actions

---

**End of Guide**

**Questions?** Open an issue or reach out to the community!

**Happy Testing!** 🚀
