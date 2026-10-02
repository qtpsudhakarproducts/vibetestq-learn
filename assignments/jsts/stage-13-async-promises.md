# Stage 13 — Async & Promises

---

## Q128. Write a program to create a Promise that resolves and rejects

```js
function fetchUser(id) {
    // A Promise wraps async work — it either resolves (success) or rejects (failure)
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (id > 0) resolve({ id, name: "Alice" }); // success
            else reject("Invalid ID");                    // failure
        }, 300);
    });
}

// .then() handles resolve, .catch() handles reject, .finally() always runs
fetchUser(1)
    .then(user => console.log("User found:", user))
    .catch(err  => console.log("Error:", err))
    .finally(()  => console.log("Request complete.\n"));

fetchUser(-1)
    .then(user => console.log("User found:", user))
    .catch(err  => console.log("Error:", err))
    .finally(()  => console.log("Request complete."));
```

**Output:**
```
User found: { id: 1, name: "Alice" }
Request complete.

Error: Invalid ID
Request complete.
```

---

## Q129. Write a program to chain multiple Promises

```js
function getUser(id)   { return new Promise(r => setTimeout(() => r({ id, name: "Alice" }), 100)); }
function getPosts(user){ return new Promise(r => setTimeout(() => r(user.name + "'s first post"), 100)); }
function getComments(post){ return new Promise(r => setTimeout(() => r(5), 100)); }

// Each .then() receives the resolved value and returns the next Promise
// The chain runs in sequence: getUser → getPosts → getComments
getUser(1)
    .then(user => {
        console.log("Step 1:", user.name);
        return getPosts(user); // return a Promise to chain it
    })
    .then(post => {
        console.log("Step 2:", post);
        return getComments(post);
    })
    .then(count => console.log("Step 3:", count, "comments"));
```

**Output:**
```
Step 1: Alice
Step 2: Alice's first post
Step 3: 5 comments
```

---

## Q130. Write a program to convert a callback-based function to a Promise

```js
// Old callback style: callback(error, result) — Node.js convention
function readFileCb(filename, callback) {
    setTimeout(() => {
        if (filename) callback(null, "Contents of " + filename); // null error = success
        else callback(new Error("No filename"), null);
    }, 200);
}

// Promisified version: wraps the callback function in a Promise
function readFilePromise(filename) {
    return new Promise((resolve, reject) => {
        readFileCb(filename, (err, data) => {
            if (err) reject(err);   // error → reject
            else resolve(data);     // success → resolve
        });
    });
}

// Now we can use .then() instead of nested callbacks
readFilePromise("test.txt").then(d => console.log("Promise:", d));

// Or even cleaner with async/await
async function run() {
    const data = await readFilePromise("test.txt");
    console.log("async/await:", data);
}
run();
```

**Output:**
```
Promise:     Contents of test.txt
async/await: Contents of test.txt
```

---

## Q131. Write a program to use async await with try catch finally

```js
function getConfig(valid) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (valid) resolve({ baseUrl: "https://example.com" });
            else reject(new Error("baseUrl is required"));
        }, 200);
    });
}

async function loadConfig(valid) {
    try {
        // await pauses execution until the Promise resolves or rejects
        // If it rejects, execution jumps to catch
        const config = await getConfig(valid);
        console.log("Config loaded. baseUrl =", config.baseUrl);
    } catch (e) {
        // Catches both Promise rejections AND synchronous errors
        console.log("Error:", e.message);
    } finally {
        // Always runs — perfect for cleanup (close connections, log completion etc.)
        console.log("Config loading complete.\n");
    }
}

loadConfig(true);  // success path
loadConfig(false); // error path
```

**Output:**
```
Config loaded. baseUrl = https://example.com
Config loading complete.

Error: baseUrl is required
Config loading complete.
```

---

## Q132. Write a program to run multiple async operations in parallel using Promise.all

```js
function fetchBrowserStats() { return new Promise(r => setTimeout(() => r({ chromium: 45, firefox: 38 }), 100)); }
function fetchTestResults()  { return new Promise(r => setTimeout(() => r({ passed: 98, failed: 2 }),    300)); }
function fetchEnvInfo()      { return new Promise(r => setTimeout(() => r({ node: "18.0", os: "linux" }), 200)); }

const start = Date.now();

// Promise.all starts ALL three simultaneously — they run in PARALLEL
// Total time ≈ slowest operation (300ms), NOT the sum (600ms)
// If ANY single promise rejects, Promise.all rejects immediately
Promise.all([fetchBrowserStats(), fetchTestResults(), fetchEnvInfo()])
    .then(([stats, results, env]) => {  // destructure the array of results
        console.log("Done in ~" + (Date.now() - start) + "ms"); // ~300ms not 600ms
        console.log("Browser stats:", stats);
        console.log("Test results: ", results);
        console.log("Env info:     ", env);
    });
```

**Output:**
```
Done in ~300ms
Browser stats: { chromium: 45, firefox: 38 }
Test results:  { passed: 98, failed: 2 }
Env info:      { node: "18.0", os: "linux" }
```

---

## Q133. Write a program to use Promise.allSettled to handle mixed resolve and reject

```js
const p1 = Promise.resolve("Data from API 1");
const p2 = Promise.reject(new Error("API 2 is down"));
const p3 = Promise.resolve("Data from API 3");

// allSettled waits for ALL promises to finish regardless of success or failure
// Unlike Promise.all which stops at first rejection
// Each result has: status ("fulfilled" or "rejected"), value or reason
Promise.allSettled([p1, p2, p3]).then(results => {
    results.forEach((r, i) => {
        if (r.status === "fulfilled")
            console.log("Result " + (i+1) + ": fulfilled →", r.value);
        else
            console.log("Result " + (i+1) + ": rejected  →", r.reason.message);
    });
    const passed = results.filter(r => r.status === "fulfilled").length;
    console.log("Summary:", passed, "succeeded,", results.length - passed, "failed");
});
```

**Output:**
```
Result 1: fulfilled → Data from API 1
Result 2: rejected  → API 2 is down
Result 3: fulfilled → Data from API 3
Summary: 2 succeeded, 1 failed
```

---

## Q134. Write a program to use Promise.race to get the first settled promise

```js
// race returns the first promise to settle — whether resolve OR reject
const fast   = new Promise(r => setTimeout(() => r("Fast (100ms)"),   100));
const medium = new Promise(r => setTimeout(() => r("Medium (500ms)"), 500));
const slow   = new Promise(r => setTimeout(() => r("Slow (1000ms)"), 1000));

Promise.race([fast, medium, slow]).then(winner => console.log("Winner:", winner));

// Practical pattern: implement a timeout using race
function withTimeout(promise, ms) {
    const timeout = new Promise((_, reject) =>
        // This promise rejects after ms milliseconds
        setTimeout(() => reject(new Error("Timed out after " + ms + "ms")), ms)
    );
    // Race the actual work against the timeout — whichever finishes first wins
    return Promise.race([promise, timeout]);
}

const longOp = new Promise(r => setTimeout(() => r("done"), 2000));
withTimeout(longOp, 300)
    .then(d => console.log("Done:", d))
    .catch(e => console.log("Error:", e.message));
```

**Output:**
```
Winner: Fast (100ms)
Error: Timed out after 300ms
```

---

## Q135. Write a program to use Promise.any to get the first resolved promise

```js
// Promise.any — returns the FIRST to RESOLVE, ignores rejections
// Different from race: race also reacts to rejection, any ignores them
const fail1   = Promise.reject(new Error("Server 1 down"));
const success = new Promise(r => setTimeout(() => r("Server 2 responded"), 300));
const fail2   = Promise.reject(new Error("Server 3 down"));

Promise.any([fail1, success, fail2])
    .then(result => console.log("First success:", result)) // Server 2 responded
    .catch(e => console.log("All failed"));

// Only fails when ALL promises reject → throws AggregateError
Promise.any([Promise.reject(new Error("A")), Promise.reject(new Error("B"))])
    .catch(e => console.log("AggregateError — all rejected"));
```

**Output:**
```
First success: Server 2 responded
AggregateError — all rejected
```

---

## Q136. Write a program to use setTimeout and setInterval with clearInterval

```js
console.log("Test started");

setTimeout(() => {
    console.log("Running tests...");

    let ticks = 0;
    // setInterval runs the callback repeatedly every N milliseconds
    const interval = setInterval(() => {
        ticks++;
        console.log("tick " + ticks);

        if (ticks === 5) {
            clearInterval(interval); // stop the interval
            console.log("Test run complete");
        }
    }, 200); // fire every 200ms

}, 500); // fire once after 500ms
```

**Output:**
```
Test started
Running tests...
tick 1
tick 2
tick 3
tick 4
tick 5
Test run complete
```

---

## Q137. Write a program to create an async retry function with exponential backoff

```js
async function fetchWithRetry(fn, maxRetries = 3, delayMs = 100) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await fn();
            console.log("Attempt " + attempt + " succeeded!");
            return result;
        } catch (e) {
            console.log("Attempt " + attempt + " failed: " + e.message);
            if (attempt === maxRetries) throw new Error("All attempts failed");
            // Exponential backoff: wait longer before each retry
            // attempt 1 → wait 100ms, attempt 2 → wait 200ms, attempt 3 → wait 300ms
            await new Promise(r => setTimeout(r, delayMs * attempt));
        }
    }
}

let calls = 0;
function flakyApi() {
    return new Promise((resolve, reject) => {
        calls++;
        if (calls < 3) reject(new Error("Connection refused")); // fail first 2 times
        else resolve({ data: "api response" });                  // succeed on 3rd
    });
}

fetchWithRetry(flakyApi)
    .then(r => console.log("Result:", r))
    .catch(e => console.log("Gave up:", e.message));
```

**Output:**
```
Attempt 1 failed: Connection refused
Attempt 2 failed: Connection refused
Attempt 3 succeeded!
Result: { data: "api response" }
```
