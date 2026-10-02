# Stage 14 — Error Handling

---

## Q138. Write a program to show try catch finally execution order

```js
function run(shouldThrow) {
    console.log("--- shouldThrow:", shouldThrow, "---");
    try {
        console.log("1. try block starts");
        // throw creates an Error and immediately jumps to catch block
        if (shouldThrow) throw new Error("Something went wrong!");
        console.log("2. try block ends normally");
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        console.log("3. catch:", e.message);
    // finally runs ALWAYS — whether error was thrown or not
    } finally {
        console.log("4. finally always runs");
    }
    console.log("5. code after try/catch\n");
}

run(false);
run(true);
```

**Output:**
```
--- shouldThrow: false ---
1. try block starts
2. try block ends normally
4. finally always runs
5. code after try/catch

--- shouldThrow: true ---
1. try block starts
3. catch: Something went wrong!
4. finally always runs
5. code after try/catch
```

---

## Q139. Write a program to create a custom error class

```js
class ValidationError extends Error {
    constructor(field, message) {
        super(message);
        // Override default "Error" name for better error messages
        this.name = "ValidationError";
        // Custom property to store which field caused the error
        this.field = field;
    }
}

function validateUser(user) {
    if (!user.name) throw new ValidationError("name", "Name cannot be empty");
    if (user.age < 0) throw new ValidationError("age", "Age must be a positive number");
    if (!user.email.includes("@")) throw new ValidationError("email", "Invalid email format");
}

const invalid = { name: "", age: -5, email: "notanemail" };
const fields = [
    { ...invalid, name: "" },
    { name: "Alice", age: -5, email: "test@x.com" },
    { name: "Alice", age: 25, email: "notanemail" }
];

for (const user of fields) {
    try {
        validateUser(user);
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        if (e instanceof ValidationError) {
            console.log("ValidationError! Field:", e.field, "| Message:", e.message);
        }
    }
}
```

**Output:**
```
ValidationError! Field: name  | Message: Name cannot be empty
ValidationError! Field: age   | Message: Age must be a positive number
ValidationError! Field: email | Message: Invalid email format
```

---

## Q140. Write a program to identify and handle TypeError, RangeError and ReferenceError

```js
function causeTypeError() {
    try { null.toString(); }
    catch (e) { console.log(e.constructor.name + ":", e.message); }
}

function causeRangeError() {
    try { new Array(-1); }
    catch (e) { console.log(e.constructor.name + ":", e.message); }
}

function causeReferenceError() {
    try { console.log(undeclaredVariable); }
    catch (e) { console.log(e.constructor.name + ":", e.message); }
}

causeTypeError();
causeRangeError();
causeReferenceError();
```

**Output:**
```
TypeError: Cannot read properties of null (reading 'toString')
RangeError: Invalid array length
ReferenceError: undeclaredVariable is not defined
```

---

## Q141. Write a program to re-throw an error after partial handling

```js
function level3() {
    throw new Error("Database connection failed");
}

function level2() {
    try {
        level3();
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        console.log("level2: caught →", e.message);
        console.log("level2: logging to error tracker...");
        throw e;
    }
}

function level1() {
    try {
        level2();
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        console.log("level1: final handler →", e.message);
        console.log("level1: showing user message: Something went wrong. Please try again.");
    }
}

level1();
```

**Output:**
```
level2: caught → Database connection failed
level2: logging to error tracker...
level1: final handler → Database connection failed
level1: showing user message: Something went wrong. Please try again.
```

---

## Q142. Write a program to create a safe JSON parser that returns null on failure

```js
// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
function safeJsonParse(str, fallback = null) {
    try {
        return JSON.parse(str);
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        return fallback;
    }
}

// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
console.log(safeJsonParse('{"name":"Alice"}'));
// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
console.log(safeJsonParse("not json"));
// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
console.log(safeJsonParse("{invalid}", []));
// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
console.log(safeJsonParse("[1,2,3]"));
// Wrap JSON.parse in try/catch to prevent crashes on invalid JSON
console.log(safeJsonParse("", { default: true }));
```

**Output:**
```
{ name: "Alice" }
null
[]
[1, 2, 3]
{ default: true }
```

---

## Q143. Write a program to handle uncaught exceptions and unhandled rejections in Node.js

```js
process.on("uncaughtException", (err) => {
    console.log("[uncaughtException] Error:", err.message);
    console.log("Shutting down gracefully...");
});

process.on("unhandledRejection", (reason) => {
    console.log("[unhandledRejection] Reason:", reason.message || reason);
});

// Trigger unhandledRejection
Promise.reject(new Error("Forgotten promise rejection"));

// Trigger uncaughtException
setTimeout(() => {
    throw new Error("Unexpected crash!");
}, 100);
```

**Output:**
```
[unhandledRejection] Reason: Forgotten promise rejection
[uncaughtException] Error: Unexpected crash!
Shutting down gracefully...
```

---

## Q144. Write a program to show what happens when async errors are not caught and how to fix it

```js
async function riskyOperation() {
    throw new Error("riskyOperation failed");
}

// Right way 1 — try/catch
async function runGood() {
    try {
        await riskyOperation();
    // catch receives the thrown Error object as parameter e
    } catch (e) {
        console.log("try/catch caught:", e.message);
    }
}

// Right way 2 — .catch() on the awaited call
async function runWithCatch() {
    const result = await riskyOperation().catch(e => {
        console.log(".catch() caught:", e.message);
        return null;
    });
    console.log("Result with fallback:", result);
}

runGood();
runWithCatch();
```

**Output:**
```
try/catch caught: riskyOperation failed
.catch() caught: riskyOperation failed
Result with fallback: null
```
