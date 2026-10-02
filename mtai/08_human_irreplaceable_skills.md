# Chapter 8: Human-Irreplaceable Skills

## Exploratory Testing
Exploratory testing is simultaneous learning, test design, and execution. It relies on intuition.
*   **The "Smell" Test**: AI follows rules. Humans follow hunches. "This screen loads a bit slow... let me try clicking the button rapidly 10 times." AI rarely "thinks" to do that unless told.
*   **Curiosity**: The desire to "break things" is a human trait.

## UX Testing (User Experience)
*   **Empathy**: AI doesn't get frustrated. A human tester feels annoyances: "This font is too small," "This popup is annoying," "I can't find the logout button."
*   **Emotion**: Software is used by humans. A successful app must feel "good." Only a human can validate "good."

## Accessibility Testing
While AI can scan for technical tags (missing ARIA labels), it struggles with the *context*.
*   *AI*: "Alt text exists." (Pass)
*   *Human*: "The Alt text says 'image123.jpg', which is useless to a blind user. It should say 'Chart showing Q3 profits'." (Fail)

## Impact of Domain Knowledge
*   **Business Logic**: "In Healthcare, a patient over 18 cannot have a pediatrician listed as primary care."
    *   AI might verify the field accepts text.
    *   Human knows the *regulatory rule* behind the field.

## Negative & Chaos Testing
*   **Chaos**: Unplugging the server. Changing the system clock. Simulating a flaky network.
*   **Security**: Understanding the *motivation* of a hacker. AI can run a script, but a human hacker finds creative ways to bypass logic (e.g., social engineering).

## Multi-Tenant SaaS Testing
Testing software that serves multiple companies (tenants) from one codebase.
*   *Sensitivity*: Ensuring Company A cannot see Company B's data.
*   *Configurability*: Company A wants "Blue" theme, Company B wants "Red". AI can test buttons work. Human tests that the *configuration* was respected and the isolation is secure.

**Analogy: The Music Producer**
*   **AI** can play every note perfectly in time (Functionality).
*   **The Human** ensures the song has "soul" and "feeling" that makes people want to listen to it (UX/Value). A robotically perfect song might still be boring.

---

## Security Testing — The Manual Foundation

Security testing is one of the highest-value, most human-dependent forms of testing. AI can scan for patterns; it cannot *reason* like an attacker.

### The OWASP Top 10 — What Every Manual Tester Must Know

The OWASP Top 10 is the industry-standard list of the most critical web application security risks.

| # | Risk | What It Means | Manual Test Action |
|---|------|--------------|-------------------|
| 1 | **Broken Access Control** | Users can access things they shouldn't | Try accessing another user's URL directly; try escalating privileges |
| 2 | **Cryptographic Failures** | Sensitive data transmitted or stored insecurely | Check if passwords/PAN/SSN appear in plain text in API responses or browser storage |
| 3 | **Injection (SQL, XSS, Command)** | Malicious input is executed as code | Enter `' OR '1'='1` in login; enter `<script>alert(1)</script>` in text fields |
| 4 | **Insecure Design** | Security controls were never designed in | Review security requirements; ask "What happens if this token is shared?" |
| 5 | **Security Misconfiguration** | Default configs, verbose errors, open ports | Check if error pages expose stack traces; test with invalid tokens |
| 6 | **Vulnerable Components** | Using libraries with known CVEs | Review dependency list; flag outdated packages (for dev to fix) |
| 7 | **Authentication Failures** | Weak/broken login, session management | Test session token behaviour on logout; test password complexity rules |
| 8 | **Data Integrity Failures** | Untrusted data used directly | Test if unsigned data from cookies/headers can be tampered with |
| 9 | **Logging/Monitoring Failures** | Attacks go undetected | Verify that failed logins are logged; verify no PII in logs |
| 10 | **SSRF** | Server makes requests to unintended destinations | Try inserting internal IP addresses in URL fields |

### Manual Security Test Checklist

**Authentication & Authorization**
- [ ] Can you access a logged-in page without logging in? (Copy URL from logged-in session, open in private browser)
- [ ] After logout, does using the Back button allow access? (Session invalidation)
- [ ] Can a User A access User B's data by changing an ID in the URL? (IDOR — Insecure Direct Object Reference)
- [ ] Can a regular user access admin functions by typing the admin URL directly? (Privilege escalation)
- [ ] Is the account locked after repeated failed login attempts? (Brute-force protection)
- [ ] Does the password reset token expire? Is it single-use?

**Input Validation**
- [ ] Text fields: Try entering `<script>alert('XSS')</script>` — if an alert appears, it's a critical XSS vulnerability.
- [ ] Login fields: Try `' OR '1'='1` as username — if login succeeds, SQL injection is present.
- [ ] File uploads: Try uploading a `.php` or `.js` file instead of an image.
- [ ] Number fields: Try negative numbers, zero, very large numbers (`999999999`).

**Sensitive Data**
- [ ] Open browser DevTools → Network tab. Do API responses include passwords, full card numbers, or SSNs?
- [ ] Open DevTools → Application tab → Local Storage / Session Storage / Cookies. Is any sensitive data stored?
- [ ] Are HTTPS enforced on all pages? Any mixed-content (HTTP resources on HTTPS page)?

**Error Handling**
- [ ] Does the error page reveal the technology stack (e.g., "Java NullPointerException at line 143 in UserService.java")? This is information leakage.
- [ ] Does the login error message distinguish between "wrong username" and "wrong password"? (It should say a generic message to prevent username enumeration.)

### Bug Bounty Mindset

Think like a hacker, not a tester following a script. Ask:
*   "What would happen if I am simultaneously logged in on two sessions and change data in one?"
*   "What if I intercept the API call with a proxy (like Burp Suite) and change the `userId` field?"
*   "What if I complete step 3 of a multi-step flow without completing step 2?"

**AI Assist for Security Testing**:
*   *Prompt*: "You are a penetration tester. Review this API endpoint definition and list the top 10 security test scenarios based on OWASP Top 10."
*   AI generates a list. You execute the tests manually. AI cannot execute or observe — you can.

---

## Performance Testing — The Manual Perspective

Performance testing doesn't always mean running JMeter scripts. Manual performance testing is about *observing* and *evaluating* the real user experience.

### Manual Performance Testing Checklist

**Page Load & Response Time**
- [ ] Use browser DevTools → Network tab → measure Time to First Byte (TTFB) and Total Load Time.
- [ ] Is the page usable before it fully loads? (Progressive loading vs. blank screen)
- [ ] Test on a throttled network (DevTools → Network → Slow 3G) — simulates mobile experience.
- [ ] Does the page handle slow network gracefully (spinner, partial content) or just go blank?

**Heavy Interaction Scenarios**
- [ ] Click a button quickly 5–10 times — does it submit the form once or trigger duplicate actions?
- [ ] Open the same page in 5 different browser tabs simultaneously — does it break?
- [ ] Rapidly navigate back and forth — do any JS errors appear in the console?
- [ ] Search with a term that returns 10,000+ results — does the page hang or paginate correctly?

**File and Data Handling**
- [ ] Upload the largest valid file size allowed — how long does it take? Is there a progress indicator?
- [ ] Try to upload a file slightly over the size limit — is the error immediate or does it wait and then fail?
- [ ] Load a report/export for a very large date range (e.g., 5 years of data) — does it time out?

**Key Metrics to Note (Manual Observation)**

| Metric | Observation Method | Acceptable Threshold (General) |
|--------|-------------------|-------------------------------|
| Page load time | Browser DevTools → Network | < 3 seconds on standard network |
| API response time | DevTools → Network → XHR requests | < 500ms for standard operations |
| Time to interactive | Lighthouse report | < 3.8 seconds |
| Double-click behavior | Manual observation | Debounced (no duplicates) |
| Memory leaks | DevTools → Memory tab before/after heavy use | Stable memory, no continuous growth |

**When to Escalate to Performance Engineering**: If your manual observation reveals response times > 5 seconds, page timeouts, or crashes under basic multi-user conditions — escalate to the performance testing team for load/stress testing with tools.

---

## Exploratory Testing — Advanced Techniques

Beyond the basics, experienced testers use structured exploratory techniques.

### Session-Based Exploratory Testing (SBET)

A disciplined approach to exploratory testing with documentation.

**Structure**:
1.  **Charter**: "Explore ORDER PLACEMENT using COUPON CODES to discover validation and combination issues. (60 minutes)"
2.  **Setup**: Document your starting conditions.
3.  **Explore**: Test freely within the charter. Take notes on observations, questions, bugs.
4.  **Debrief** (at session end):
    *   Bugs found
    *   Coverage achieved
    *   Risks discovered
    *   Open questions for next session

**Time Boxing**: 60–90 minute sessions. Shorter = loss of flow. Longer = fatigue-driven mistakes.

### Persona-Based Exploration

Test as different user personas — each reveals different defects.

| Persona | Who They Are | What They'll Encounter |
|---------|-------------|----------------------|
| New User | First time, no training | Onboarding issues, confusing navigation, unclear labels |
| Power User | Daily user, uses keyboard shortcuts | Shortcut conflicts, edge cases from heavy volume |
| Impatient User | Clicks rapidly, never reads messages | Race conditions, double-submit bugs, ignored warnings |
| Mobile User | Small screen, fat fingers, slow network | Touch target sizes, overlapping elements, timeout handling |
| Accessibility User | Screen reader, keyboard-only navigation | Missing ARIA labels, keyboard traps, focus order issues |

### Risk-Based Exploratory Charters

Generate charters based on risk — highest risk modules get the most exploration time.

**High-risk trigger scenarios**:
*   New code in this sprint
*   Module with highest defect density from last sprint
*   Third-party integration recently updated
*   Feature with complex business rules
*   Anything related to payments, authentication, or data deletion

---

## Test Estimation — A Critical Human Skill

How much time does testing take? This is a judgment call that AI cannot make accurately without human context.

### Estimation Techniques

#### 1. Analogy-Based
Compare with a similar past feature.
*   "The last e-commerce checkout took 16 hours to test. This new checkout is 30% simpler. Estimate: ~11 hours."

#### 2. Three-Point Estimation (PERT)
*   **Optimistic (O)**: Best case, no surprises. 
*   **Pessimistic (P)**: Everything goes wrong.
*   **Most Likely (M)**: Realistic expectation.
*   **Formula**: `E = (O + 4M + P) / 6`

| Scenario | O | M | P | E |
|----------|---|---|---|---|
| Login Feature Testing | 4h | 8h | 16h | **8.3h** |

#### 3. Story Point Poker for QA
In Agile, QA estimates testing effort in relative story points alongside development estimates.
*   Use Fibonacci sequence: 1, 2, 3, 5, 8, 13.
*   Higher = more testing complexity.

### Factors That Affect Testing Effort
*   **Complexity of business logic**: Simple CRUD vs. multi-conditional discount rules.
*   **Quality of requirements**: Clear ACs vs. vague stories.
*   **Test environment stability**: Stable dev environment vs. frequent outages.
*   **Existing test coverage**: Regression already exists vs. starting from zero.
*   **Cross-browser/device matrix**: 1 browser vs. 5 browsers × 3 devices.
*   **Security testing required**: Basic functional vs. OWASP checklist.

**AI Assist for Estimation**: *"Based on these 5 user stories and their acceptance criteria, estimate the testing effort in hours. Consider test case writing, execution, regression impact, and data setup times."* Use AI's estimate as a starting point then adjust with your context.
