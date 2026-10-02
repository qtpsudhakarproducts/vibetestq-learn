# Stage 16 — Node.js Essentials

---

## Q158. Write a program to read a file synchronously and asynchronously using fs module

```js
const fs   = require("fs");
const path = require("path");

// path.join builds a path using the correct separator for the OS (/ on Mac/Linux, \ on Windows)
const filePath = path.join(__dirname, "sample.txt");
// Creates the file if it does not exist, OVERWRITES if it does
fs.writeFileSync(filePath, "Line 1: Hello\nLine 2: World\nLine 3: Node.js");

// Synchronous read
// Synchronous: blocks until file is fully read — simple but blocks other code
const content = fs.readFileSync(filePath, "utf8");
console.log("Sync content:");
console.log(content);

// Async read — non-blocking
// Asynchronous: registers callback and continues — does not block
fs.readFile(filePath, "utf8", (err, data) => {
    if (err) { console.log("Error:", err.message); return; }
    console.log("Async content:");
    console.log(data);
});

console.log("This prints before async result");
```

**Output:**
```
Sync content:
Line 1: Hello
Line 2: World
Line 3: Node.js
This prints before async result
Async content:
Line 1: Hello
Line 2: World
Line 3: Node.js
```

---

## Q159. Write a program to write and append text to a file

```js
const fs = require("fs");

// Creates the file if it does not exist, OVERWRITES if it does
fs.writeFileSync("log.txt", "Test started\n");
// Adds to the END of the file without removing existing content
fs.appendFileSync("log.txt", "Step 1: Navigate to page\n");
// Adds to the END of the file without removing existing content
fs.appendFileSync("log.txt", "Step 2: Login\n");
// Adds to the END of the file without removing existing content
fs.appendFileSync("log.txt", "Test completed\n");

// Synchronous: blocks until file is fully read — simple but blocks other code
const content = fs.readFileSync("log.txt", "utf8");
console.log("File content:");
console.log(content);
```

**Output:**
```
File content:
Test started
Step 1: Navigate to page
Step 2: Login
Test completed
```

---

## Q160. Write a program to read a JSON file and access its contents

```js
const fs = require("fs");

const data = {
    users: [
        { id: 1, name: "Alice" },
        { id: 2, name: "Bob" }
    ],
    version: "1.0"
};
// Creates the file if it does not exist, OVERWRITES if it does
fs.writeFileSync("testdata.json", JSON.stringify(data, null, 2));

// Synchronous: blocks until file is fully read — simple but blocks other code
const raw    = fs.readFileSync("testdata.json", "utf8");
const parsed = JSON.parse(raw);

console.log("Version:     ", parsed.version);
console.log("Second user: ", parsed.users[1].name);
console.log("Total users: ", parsed.users.length);
```

**Output:**
```
Version:      1.0
Second user:  Bob
Total users:  2
```

---

## Q161. Write a program to use the path module

```js
const path = require("path");

// path.join builds a path using the correct separator for the OS (/ on Mac/Linux, \ on Windows)
const joined = path.join("reports", "2024", "january", "summary.pdf");
console.log("Joined:   ", joined);

const full = "/home/sudhakar/projects/automation/tests/login.spec.ts";
console.log("basename: ", path.basename(full));
console.log("no ext:   ", path.basename(full, ".ts"));
console.log("extname:  ", path.extname(full));
console.log("dirname:  ", path.dirname(full));
```

**Output:**
```
Joined:    reports/2024/january/summary.pdf
basename:  login.spec.ts
no ext:    login.spec
extname:   .ts
dirname:   /home/sudhakar/projects/automation/tests
```

---

## Q162. Write a program to read environment variables using process.env

```js
const fs = require("fs");

// Create .env file content
fs.writeFileSync(".env", "APP_NAME=VibeTestQ\nBASE_URL=https://example.com\nBROWSER=chromium\nHEADLESS=true");

// Manual dotenv parsing
// Synchronous: blocks until file is fully read — simple but blocks other code
const envContent = fs.readFileSync(".env", "utf8");
envContent.split("\n").forEach(line => {
    const [key, value] = line.split("=");
    if (key && value) process.env[key.trim()] = value.trim();
});

// process.env gives access to all environment variables as strings
console.log("APP_NAME:", process.env.APP_NAME);
// process.env gives access to all environment variables as strings
console.log("BASE_URL:", process.env.BASE_URL);
// process.env gives access to all environment variables as strings
console.log("BROWSER: ", process.env.BROWSER);
// process.env gives access to all environment variables as strings
console.log("HEADLESS:", process.env.HEADLESS);
```

**Output:**
```
APP_NAME: VibeTestQ
BASE_URL: https://example.com
BROWSER:  chromium
HEADLESS: true
```

---

## Q163. Write a program to list all files in a directory and filter by extension

```js
const fs   = require("fs");
const path = require("path");

["test1.spec.ts","test2.spec.ts","helper.ts","config.json","README.md"]
    .forEach(f => fs.writeFileSync(f, "// " + f));

const all   = fs.readdirSync(".");
const tsFiles = all.filter(f => path.extname(f) === ".ts");
const specFiles = all.filter(f => f.endsWith(".spec.ts"));

console.log("TS files:  ", tsFiles);
console.log("Spec files:", specFiles);
tsFiles.forEach(f => {
    const size = fs.statSync(f).size;
    console.log(" ", f + ":", size, "bytes");
});
```

**Output:**
```
TS files:   ["test1.spec.ts", "test2.spec.ts", "helper.ts"]
Spec files: ["test1.spec.ts", "test2.spec.ts"]
  test1.spec.ts: 16 bytes
  test2.spec.ts: 16 bytes
  helper.ts: 12 bytes
```

---

## Q164. Write a program to create a simple HTTP server

```js
const http = require("http");

const server = http.createServer((req, res) => {
    console.log(req.method + " " + req.url);
    if (req.url === "/") {
        res.writeHead(200, { "Content-Type": "text/plain" });
        res.end("Welcome to the test server!");
    } else if (req.url === "/status") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", time: new Date().toISOString() }));
    } else {
        res.writeHead(404);
        res.end("Not found");
    }
});

server.listen(3000, () => {
    console.log("Server running at http://localhost:3000");
});
```

**Output:**
```
Server running at http://localhost:3000
GET /
GET /status
GET /other
```

---

## Q165. Write a program to make an HTTPS GET request

```js
const https = require("https");

function get(url) {
    return new Promise((resolve, reject) => {
        https.get(url, (res) => {
            let data = "";
            res.on("data", chunk => data += chunk);
            res.on("end", () => resolve(JSON.parse(data)));
        }).on("error", reject);
    });
}

get("https://jsonplaceholder.typicode.com/todos/1").then(data => {
    console.log("id:       ", data.id);
    console.log("title:    ", data.title);
    console.log("completed:", data.completed);
});
```

**Output:**
```
id:        1
title:     delectus aut autem
completed: false
```

---

## Q166. Write a program to create a custom EventEmitter

```js
const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("testStart", name => console.log("▶ Starting:", name));
emitter.on("testPass",  (name, ms) => console.log("✓ Passed: ", name + " (" + ms + "ms)"));
emitter.on("testFail",  (name, err) => console.log("✗ Failed: ", name + " → " + err));
emitter.once("suiteEnd", (p, f) => console.log("Suite complete:", p, "passed,", f, "failed"));

emitter.emit("testStart", "Login test");
emitter.emit("testPass",  "Login test", 125);
emitter.emit("testStart", "Payment test");
emitter.emit("testFail",  "Payment test", "Element not found");
emitter.emit("suiteEnd", 1, 1);
emitter.emit("suiteEnd", 1, 1);  // once — won't fire again
```

**Output:**
```
▶ Starting: Login test
✓ Passed:  Login test (125ms)
▶ Starting: Payment test
✗ Failed:  Payment test → Element not found
Suite complete: 1 passed, 1 failed
```

---

## Q167. Write a program to show npm scripts in package.json for a test automation project

```js
const packageJson = {
    name: "playwright-tests",
    version: "1.0.0",
    scripts: {
        "start":        "node index.js",
        "test":         "playwright test",
        "test:headed":  "playwright test --headed",
        "test:debug":   "playwright test --debug",
        "report":       "playwright show-report",
        "clean":        "rm -rf test-results playwright-report"
    }
};

console.log(JSON.stringify(packageJson.scripts, null, 2));
console.log("\nRun with:");
for (const script of Object.keys(packageJson.scripts)) {
    const cmd = script === "start" || script === "test" ? "npm " + script : "npm run " + script;
    console.log(" ", cmd);
}
```

**Output:**
```
{
  "start":       "node index.js",
  "test":        "playwright test",
  "test:headed": "playwright test --headed",
  "test:debug":  "playwright test --debug",
  "report":      "playwright show-report",
  "clean":       "rm -rf test-results playwright-report"
}

Run with:
  npm start
  npm test
  npm run test:headed
  npm run test:debug
  npm run report
  npm run clean
```
