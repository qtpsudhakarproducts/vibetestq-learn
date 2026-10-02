# 👥 GitHub Team Workflow Guide for QA Engineers
### How Real Teams Work Together Daily — Permissions · Branch Rules · PR Reviews · CI/CD · Merge Flow

---

## Part 1 — Team Structure & GitHub Roles

Every person on a GitHub repository has a role. The role controls exactly what actions they can and cannot take.

### The Roles Explained

**Owner**
There is one owner per repository or organization. The owner has unrestricted access to everything — settings, billing, deleting the repo, overriding any rule. In most companies this is a tech lead or engineering manager. Day to day they work like everyone else and do not abuse this access.

**Admin**
Admins manage the repository configuration. They set up branch protection rules, add or remove team members, configure GitHub Actions secrets, and manage integrations. In a QA team, the QA Lead is typically an Admin. Admins can also merge PRs and push branches.

**Maintainer** (Organisation repos only)
Can manage issues, PRs, labels, and milestones. Can merge approved PRs. Cannot change repository settings or manage team members. A senior QA engineer who owns a particular test suite is often a Maintainer.

**Write (Collaborator)**
The standard role for every QA engineer and developer on the team. Can clone, create branches, push branches, open PRs, and review other people's PRs. Cannot change repository settings. Cannot merge into a protected branch without meeting all the required conditions.

**Read / Triage**
Can view code, clone, comment on issues and PRs. Cannot push anything. Typically used for stakeholders, product managers, or external contractors who need visibility but not write access.

### How a Typical QA Team is Set Up

| Person | GitHub Role | What They Do Daily |
|--------|-------------|-------------------|
| QA Lead | Admin | Reviews PRs, merges to main, manages CI config, sets branch rules |
| Senior QA Engineer | Maintainer | Reviews PRs, writes tests, can merge after approval |
| QA Engineer | Write | Writes tests, opens PRs, reviews peers' PRs |
| Developer (on same repo) | Write | Reviews QA PRs for technical accuracy |
| Product Manager | Read | Views test results and CI status for visibility |

---

## Part 2 — Repository Setup by the Admin

Before the team starts working, the Admin sets up the repository once. This setup is what makes the entire safe workflow possible.

### Step 1 — Create the Repository

The Admin creates the repository on GitHub, sets it to Private, and does the initial push of the project skeleton (Playwright config, folder structure, `.gitignore`, CI workflow file).

### Step 2 — Add Team Members

**GitHub → Repository → Settings → Collaborators and teams → Add people**

The Admin invites each team member by their GitHub username and assigns their role. Each person receives an email invitation they must accept before they can access the repo.

### Step 3 — Set Up Secrets for CI

**GitHub → Repository → Settings → Secrets and variables → Actions**

The Admin adds the credentials that GitHub Actions needs to run tests against staging. These are stored encrypted and are never visible to anyone after being saved — not even Admins.

| Secret | Purpose |
|--------|---------|
| `STAGING_BASE_URL` | The URL of the staging environment tests run against |
| `TEST_USERNAME` | The test account username |
| `TEST_PASSWORD` | The test account password |

QA engineers reference these in their tests via `process.env.TEST_USERNAME`. They never see the actual values.

### Step 4 — Set Up Branch Protection Rules

This is the most important step. See Part 3 for full detail.

### Step 5 — Set Up CODEOWNERS (Optional but Recommended)

A `CODEOWNERS` file tells GitHub who must review changes to specific parts of the repository. Create this file at `.github/CODEOWNERS`:

```
# The QA Lead must review any changes to the CI workflow
.github/workflows/   @qa-lead-username

# The lead must review changes to the Playwright config
playwright.config.ts  @qa-lead-username

# Any QA engineer can review test files
tests/               @qa-engineer-1 @qa-engineer-2 @qa-lead-username
```

When a PR touches these files, GitHub automatically requests a review from the listed people. The PR cannot be merged without their approval.

---

## Part 3 — Branch Protection Rules on Main

Branch protection rules are the technical enforcement of the team's policy that no one pushes directly to main and all changes are reviewed and tested before merging.

### How to Set Them Up

**GitHub → Repository → Settings → Branches → Add branch protection rule**

Set Branch name pattern to: `main`

### The Rules and What Each One Does

**Require a pull request before merging**
Nobody — not even the Admin or Owner — can push commits directly to main. Every change must come through a PR. If someone tries `git push origin main` directly, GitHub will reject it with an error.

**Require approvals — set to 1 or 2**
The PR cannot be merged until the required number of team members have formally approved it. A comment saying "looks good" does not count — the reviewer must click the green Approve button on the PR review screen.

**Dismiss stale pull request approvals when new commits are pushed**
If a reviewer approves a PR and then the author pushes more commits, the approval is automatically removed. The PR must be re-reviewed. This prevents the situation where someone approves early and the author sneaks in changes after approval.

**Require status checks to pass before merging**
The merge button stays locked until all specified CI checks have completed successfully. You select which checks must pass — typically the Playwright test job. If tests fail, the merge button is greyed out and shows "Some checks were not successful."

**Require branches to be up to date before merging**
The PR branch must include all the latest commits from main before it can be merged. This prevents a situation where two PRs both pass CI independently but would break each other if merged together.

**Do not allow bypassing the above settings**
By default Admins can bypass protection rules. Enabling this setting means even Admins must follow the same PR and review process. Good teams enable this so the lead cannot accidentally push directly to main either.

**Lock branch (optional)**
Makes the branch completely read-only. Used temporarily during a release freeze period when no changes should go in.

### What These Rules Look Like in Practice

When all rules are active, the PR merge button behaves as follows:

```
PR opened
    │
    ▼
CI runs automatically
    │
    ├── CI fails → merge button locked with message "Required checks have not passed"
    │
    └── CI passes ✅
            │
            ▼
    Awaiting required reviews
            │
            ├── Not enough approvals → merge button locked with "Review required"
            │
            └── Approved ✅
                    │
                    ▼
            Branch up to date with main?
                    │
                    ├── Behind main → merge button shows "Update branch" — must sync first
                    │
                    └── Up to date ✅
                            │
                            ▼
                    ✅ Merge button is green and active
```

---

## Part 4 — Daily Team Workflow End to End

This is what a normal working day looks like for the whole team from the moment a QA engineer starts a task to the moment it is live in main.

### The Full Cycle

```
QA Lead assigns a task to a QA Engineer
        │
        ▼
QA Engineer pulls latest main
        │
        ▼
QA Engineer creates a feature branch
        │
        ▼
QA Engineer writes tests, commits, pushes branch
        │
        ▼
QA Engineer opens a Pull Request on GitHub
        │
        ▼
GitHub automatically triggers CI (GitHub Actions)
        │
        ├── CI runs Playwright tests on the branch
        │
        ├── CI posts results back to the PR
        │
        └── CI either locks or unlocks the merge button
        │
        ▼
GitHub requests review from the right people (via CODEOWNERS or manual assignment)
        │
        ▼
Reviewer reads the code, runs tests if needed, leaves comments or approves
        │
        ├── Reviewer requests changes → QA Engineer fixes and pushes → CI re-runs → Review repeats
        │
        └── Reviewer approves ✅
        │
        ▼
All conditions met (CI green + approved + branch up to date)
        │
        ▼
QA Lead or Maintainer clicks Merge
        │
        ▼
Branch is merged into main
        │
        ▼
GitHub Actions may trigger again on main (nightly regression, deployment, notifications)
        │
        ▼
Branch is deleted
```

---

## Part 5 — The Pull Request in Detail

A Pull Request (PR) is not just a button to merge code. It is the central communication hub for the entire review cycle.

### What a PR Contains

When a QA engineer opens a PR, GitHub shows:

**The description** — written by the author. Should explain what tests were added, what scenarios are covered, and any context reviewers need. A good PR description saves the reviewer time.

**The diff (Files changed tab)** — a line-by-line view of exactly what changed. Green lines were added, red lines were removed. Reviewers read this to understand the changes.

**The Commits tab** — every individual commit on the branch. Reviewers can see the progression of work.

**The Checks tab** — live status of every CI job running on this PR. Shows which steps passed, which failed, and links to the full logs.

**The conversation** — all review comments, replies, and the timeline of events (who approved, when CI ran, when the branch was updated).

### Writing a Good PR Description

A PR description that helps reviewers:

```
## What this PR does
Adds end-to-end tests for the user registration flow.

## Scenarios covered
- Happy path: valid email and password → account created
- Duplicate email: existing account → error message shown
- Missing required fields: empty form submission → inline validation errors
- Weak password: below minimum strength → rejection with guidance

## How to test locally
1. Pull this branch
2. Run: npx playwright test tests/e2e/registration.spec.ts
3. All 8 tests should pass

## Notes
The duplicate email test uses a seeded test account (see fixtures/users.ts).
Do not delete that account from staging.
```

### Assigning Reviewers

The PR author can manually assign reviewers in the right sidebar of the PR. If CODEOWNERS is set up, GitHub assigns them automatically. The QA lead should always be a reviewer on PRs that touch the CI config or `playwright.config.ts`.

### Draft PRs

A Draft PR can be opened before the work is finished. It signals to the team "I am working on this, please do not review yet." GitHub blocks merging of draft PRs. When ready, the author clicks "Ready for review" and the normal review process begins.

Draft PRs are useful when you want early feedback on an approach, or want CI to run while you are still writing tests.

---

## Part 6 — Code Review — What Reviewers Actually Do

### The Reviewer's Responsibilities

When you are assigned to review a PR, you are responsible for checking:

**Test coverage** — Do the tests actually cover the scenarios described in the PR? Are there obvious missing cases?

**Test quality** — Are locators stable? Are hardcoded waits used instead of proper Playwright waiting strategies? Are assertions meaningful?

**Page Object Model** — Are new pages or components correctly modelled? Is there duplication that should be abstracted?

**Naming** — Are test and function names clear and descriptive?

**No committed artifacts** — Are there any `test-results/`, screenshots, or `.env` files accidentally included?

**CI is green** — Do not approve a PR with failing CI unless there is a documented reason why the failure is unrelated.

### How to Leave a Review on GitHub

1. Go to the PR and click the **Files changed** tab
2. Hover over any line and click the **+** button to leave an inline comment
3. For general comments not tied to a specific line, use the conversation tab
4. When done reading, click **Review changes** (top right of Files changed)
5. Choose one of three options:

**Comment** — leaves feedback without approving or rejecting. Use for minor suggestions that should not block the merge.

**Approve** — confirms the code is ready to merge. This counts toward the required approval count.

**Request changes** — blocks the PR from merging. The author must address your feedback and re-request a review before the PR can proceed.

### What Happens After "Request Changes"

The PR is marked as "Changes requested." The merge button stays locked even if CI passes. The author reads the comments, makes fixes, pushes new commits, and then re-requests a review from the same reviewer. The reviewer re-reads the changes and either approves or requests more changes.

### What Happens After Approval

If "Dismiss stale reviews on push" is enabled, a new commit after approval removes the approval and the reviewer must re-approve. This is the safe setting. Without it, an author could approve early, then push a completely different version and merge it — nobody would catch it.

---

## Part 7 — GitHub Actions CI — How It Runs and What It Reports

### What Triggers CI on a PR

When a QA engineer pushes a commit to their branch or opens a PR, GitHub Actions automatically starts the workflow defined in `.github/workflows/playwright.yml`. This happens without anyone manually triggering it.

The workflow triggers are configured like this:

```yaml
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
```

This means CI runs whenever a commit is pushed to any branch that has an open PR targeting main, and again when anything is merged into main.

### What CI Does Step by Step

When GitHub Actions picks up the trigger, it spins up a fresh virtual machine (Ubuntu by default) and runs each step in the workflow in sequence:

```
Fresh Ubuntu machine starts
        │
        ▼
Step 1: Checkout repository
        Downloads your branch's code onto the machine
        │
        ▼
Step 2: Set up Node.js
        Installs the correct Node version
        │
        ▼
Step 3: npm ci
        Installs all Playwright dependencies from package-lock.json
        │
        ▼
Step 4: npx playwright install
        Downloads Chromium, Firefox, and WebKit browser binaries
        │
        ▼
Step 5: npx playwright test
        Runs all test files in the tests/ folder
        Injects secrets as environment variables (BASE_URL, TEST_USERNAME, etc.)
        Records screenshots and traces on failure
        │
        ▼
Step 6: Upload HTML report
        Saves the full Playwright HTML report as a downloadable artifact
        even when tests fail — so you can download and inspect failures
        │
        ▼
Machine shuts down and is destroyed
```

Every run is on a clean machine. There is no carry-over state from previous runs. This is why CI catches environment-dependent failures that might not show locally.

### Where to See CI Results

**On the PR page** — a checks summary appears below the conversation showing pass/fail for each job. Click "Details" to see the full log output.

**In the Actions tab** — every workflow run is listed with its status. You can drill into any run to see step-by-step logs.

**In your terminal** — if you have GitHub CLI installed:

```bash
# See recent CI runs
gh run list --limit 5

# Watch a run in real time after you push
gh run watch

# See the full log of a specific run
gh run view <run-id> --log
```

### What the CI Report Shows on the PR

GitHub posts a status check back to the PR with one of these states:

**Queued** — CI job is waiting for a runner to become available. This is normal during busy periods.

**In progress** — the job is actively running. You can click Details to watch it live.

**Success** ✅ — all tests passed. The merge requirement for this check is satisfied.

**Failure** ❌ — one or more tests failed. The merge button becomes locked. GitHub shows exactly which step failed.

**Cancelled** — the run was manually cancelled, or a newer push cancelled a previous run.

---

## Part 8 — How CI Results Control the Merge Button

This is the part that confuses most people. The merge button is not just a button — its state is a live reflection of all the branch protection conditions.

### The Merge Button States

**Fully green — all conditions met:**

```
✅ 2 approving reviews
✅ All checks have passed  (Playwright Tests · 4m 32s)
✅ Branch is up to date with main
─────────────────────────────────
[  Merge pull request  ]   ← Green, clickable
```

**Blocked — CI failing:**

```
❌ Required checks have not passed
   Playwright Tests — 2 tests failed
─────────────────────────────────────
[  Merge pull request  ]   ← Greyed out, not clickable
```

**Blocked — awaiting review:**

```
⚠️  Review required
    At least 1 approving review is required
─────────────────────────────────────────────
[  Merge pull request  ]   ← Greyed out, not clickable
```

**Blocked — branch behind main:**

```
⚠️  This branch is out-of-date with the base branch
    [  Update branch  ]   ← Author must click this first (or rebase)
─────────────────────────────────────────────────────
[  Merge pull request  ]   ← Greyed out until synced
```

**All blocked at once:**

```
❌ 3 blocking conditions:
   • Required checks have not passed
   • 1 more approving review required
   • Branch is out of date with base branch
──────────────────────────────────────────
[  Merge pull request  ]   ← Greyed out
```

### Who Can Actually Click Merge

Once the button is green, anyone with Write access or above can click it. In most teams the QA lead does this. Some teams configure additional restrictions so only Maintainers or Admins can merge — this is done by enabling "Restrict who can push to matching branches" in the branch protection settings.

### What Happens the Moment Merge is Clicked

1. GitHub creates the merge commit combining the PR branch and main
2. The PR status changes to "Merged" (purple)
3. GitHub Actions triggers again on main (if configured)
4. The PR branch is flagged for deletion (a button appears: "Delete branch")
5. All other open PRs targeting main are now potentially behind — they will need to update their branch before they can merge

---

## Part 9 — Real Daily Scenarios

These are the situations QA engineers face every working day and exactly what happens in each one.

---

### Scenario A — Normal Day: Write Tests, Open PR, Get Reviewed, Merge

**The QA engineer's side:**

```bash
# Start the day — get latest main
git checkout main
git pull

# Create branch for the task
git checkout -b test/password-reset-flow

# Write tests in VS Code
# ... tests/e2e/password-reset.spec.ts ...

# Run locally to confirm passing
npx playwright test tests/e2e/password-reset.spec.ts

# Commit and push
git add .
git commit -m "Add password reset flow tests — email sent, link valid, password updated"
git push -u origin test/password-reset-flow

# Open PR
gh pr create --title "E2E tests: password reset flow" --body "Covers email dispatch, link expiry, and successful password update"
```

**What GitHub does automatically:**
- Detects the new PR
- Triggers the GitHub Actions Playwright workflow
- Requests review from the assigned reviewers or CODEOWNERS
- Posts CI status updates back to the PR in real time

**The reviewer's side:**
- Receives a notification (email or GitHub notification bell)
- Opens the PR, reads the description
- Clicks Files changed, reads the test code
- Leaves inline comments if anything needs changing
- Clicks "Review changes" → Approve (if happy) or Request changes

**If approved and CI passes:**
- QA lead clicks Merge
- Branch is deleted
- Tests are now in main and will run in every nightly regression

---

### Scenario B — CI Fails on Your PR

You push your branch, open a PR, and the CI check comes back red.

**What you see on the PR:**

```
❌ Playwright Tests — failed after 3m 12s
   Details →
```

**What you do:**

```bash
# Click Details on the PR to read the CI log
# Identify which test failed and why

# Fix the issue in VS Code
# ... edit the test ...

# Commit the fix and push
git add .
git commit -m "Fix password reset test — update selector for new email input ID"
git push
```

Pushing the new commit automatically triggers CI again. You do not need to close and reopen the PR. The new run appears in the PR checks. If it passes this time, the check turns green.

---

### Scenario C — Reviewer Requests Changes

Your PR has two reviewer comments: one asking you to rename a function, one asking you to add a missing edge case test.

**What you see on GitHub:**
The PR is marked "Changes requested." The merge button is locked.

**What you do:**

```bash
# Make the requested changes in VS Code

# Run the tests again locally
npx playwright test tests/e2e/password-reset.spec.ts

# Commit and push
git add .
git commit -m "Address review feedback — rename helper function and add expired link test"
git push
```

**What happens next:**
- If "Dismiss stale reviews on push" is on — the previous approval is removed and the reviewer must re-review
- The reviewer receives a notification that new commits were pushed
- The reviewer re-reads the changes and approves

---

### Scenario D — Your Branch Falls Behind Main

While you were working on your branch, two other PRs were merged into main. GitHub now shows:

```
⚠️  This branch is out-of-date with the base branch
```

The merge button is greyed out until you sync.

**What you do:**

```bash
git fetch origin
git rebase origin/main
# If there are conflicts: resolve them in VS Code, then:
# git add .
# git rebase --continue

git push --force-with-lease
# --force-with-lease is safer than --force
# It only force pushes if nobody else has pushed to your branch since your last pull
```

After the push, GitHub detects your branch now includes all of main's latest commits. The "out of date" warning disappears. CI re-runs on the updated branch.

---

### Scenario E — Two QA Engineers Work on Related Tests Simultaneously

Engineer A is writing login tests. Engineer B is writing registration tests. Both branched from the same point on main. Engineer A's PR merges first. Engineer B's branch is now behind main and has a conflict in `pages/AuthPage.ts` because both engineers modified it.

**Engineer B's experience:**

```
⚠️  This branch has conflicts that must be resolved
```

**What Engineer B does:**

```bash
git fetch origin
git rebase origin/main

# Git pauses at the conflict in pages/AuthPage.ts
# VS Code shows the conflict markers — Engineer B resolves them manually
# keeping both sets of changes

git add pages/AuthPage.ts
git rebase --continue

git push --force-with-lease
```

CI re-runs. If tests pass and the reviewer re-approves, the PR can merge.

---

### Scenario F — The QA Lead Needs to Hotfix a Broken Test on Main

A test on main broke overnight. CI is failing on every new PR because the nightly run left main in a red state. The QA lead needs to fix it fast.

Even the QA lead cannot push directly to main — branch protection prevents it. They follow the same process but with urgency:

```bash
git checkout main
git pull
git checkout -b fix/login-test-broken-after-deploy

# Fix the broken test

git add .
git commit -m "Fix login test — update selector after deploy changed button ID"
git push -u origin fix/login-test-broken-after-deploy

gh pr create --title "Hotfix: broken login test post-deploy"
```

Because this is urgent, the lead asks a colleague to review immediately. Once approved and CI passes, the lead merges. The whole cycle can be done in under 15 minutes if the fix is small and a reviewer is available.

---

### Scenario G — A QA Engineer Accidentally Pushes to Main

Even with branch protection, a QA engineer might try:

```bash
git push origin main
```

GitHub rejects it immediately:

```
remote: error: GH006: Protected branch update failed for refs/heads/main.
remote: error: Required status check "Playwright Tests" is expected.
remote: error: At least 1 approving review is required.
To https://github.com/your-org/ecommerce-automation.git
 ! [remote rejected] main -> main (protected branch hook declined)
error: failed to push some refs
```

Nothing happens to main. The engineer simply creates a branch and opens a PR normally.

---

## Part 10 — What Can Go Wrong and How Teams Handle It

### CI Passes Locally but Fails in CI

This is very common. The most frequent causes are:

**Environment variables missing** — locally your `.env` file has the credentials, but CI is missing a secret. Fix: check the GitHub Secrets configuration and make sure every variable used in the tests is stored there.

**Timing differences** — CI machines can be slower than local. A test that passes locally with a fast connection might time out on CI. Fix: increase timeouts in `playwright.config.ts` for CI, or replace hardcoded waits with proper Playwright waiting strategies.

**Browser version differences** — locally you might be on a newer browser. Fix: `npx playwright install` in the CI workflow ensures CI always uses the officially supported version.

**Test order dependency** — tests pass locally because you always run them in a certain order, but CI runs them in a different order or in parallel. Fix: ensure every test is fully independent and cleans up its own data.

---

### A Test Passes CI but the PR Is Still Blocked

Check the PR page carefully. There are usually multiple conditions. CI passing is only one of them. Common reasons it is still blocked:

- Not enough approvals yet
- An existing approval was dismissed because new commits were pushed
- The branch is behind main
- A CODEOWNERS reviewer has not yet approved

Read the exact messages GitHub shows on the PR — they are specific about what is missing.

---

### Someone Merges a PR That Breaks Main

Occasionally a PR passes CI but breaks an integration with another part of the system. The nightly regression then fails.

The team's response:

1. The QA lead or first person to notice creates a `fix/` branch immediately
2. They open a PR with "Hotfix" in the title to signal urgency
3. They ask a teammate to review as fast as possible
4. They merge the fix
5. After the crisis they discuss in retrospect how to prevent it — usually by adding the missing test coverage

---

### A QA Engineer Is Waiting Too Long for a Review

PRs should not sit unreviewed for more than one working day. If a PR is stuck:

- The author pings the reviewer directly (Slack or Teams)
- If the primary reviewer is unavailable, the QA lead can review instead
- If the team is consistently slow at reviews, the lead sets up GitHub notifications or Slack integration so reviewers are alerted automatically when a PR is assigned to them

---

*Last updated: February 2026 — Written for QA Engineering Teams using GitHub*
