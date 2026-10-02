# Stage 8 — Functions

---

## Q73. Write a program to show default parameter values in a function

```js
// Default values are used when the argument is undefined or not passed
function greet(name = "Guest", greeting = "Hello") {
    console.log(greeting + ", " + name + "!");
}

greet();                    // both default
greet("Sudhakar");          // greeting uses default
greet("Alice", "Welcome"); // both provided, no defaults used
greet(undefined, "Hi");    // undefined explicitly triggers default for name
```

**Output:**
```
Hello, Guest!
Hello, Sudhakar!
Welcome, Alice!
Hi, Guest!
```

---

## Q74. Write a program to use rest parameter to accept any number of values and return their sum

```js
// ...numbers collects ALL arguments into a real array
// This replaces the old 'arguments' object
function sum(...numbers) {
    // reduce adds all elements together starting from 0
    return numbers.reduce((acc, n) => acc + n, 0);
}

// Rest can be combined with named parameters — rest MUST be last
function log(label, ...items) {
    console.log(label + ": " + items.join(", "));
}

console.log(sum(1, 2));
console.log(sum(1, 2, 3, 4, 5));
console.log(sum()); // no args → empty array → reduce returns 0
log("Browsers", "chromium", "firefox", "webkit");
```

**Output:**
```
3
15
0
Browsers: chromium, firefox, webkit
```

---

## Q75. Write a program to destructure an object directly in the function parameter

```js
// Instead of receiving the whole object and then accessing properties,
// we extract the properties we need directly in the parameter list
function printUser({ name, age, role }) {
    // name, age, role are available directly as variables
    console.log("Name: " + name + " | Age: " + age + " | Role: " + role);
}

printUser({ name: "Alice", age: 25, role: "tester" });
printUser({ name: "Bob",   age: 30, role: "developer" });
```

**Output:**
```
Name: Alice | Age: 25 | Role: tester
Name: Bob   | Age: 30 | Role: developer
```

---

## Q76. Write a program to destructure an array directly in the function parameter

```js
// [first, second] in the parameter list extracts elements by position
function getTopTwo([first, second]) {
    console.log("First: " + first + ", Second: " + second);
}

getTopTwo([95, 87, 72, 60]);  // first=95, second=87
getTopTwo([100, 99, 98, 97]); // first=100, second=99
getTopTwo([42]);               // first=42, second=undefined (only 1 element)
```

**Output:**
```
First: 95, Second: 87
First: 100, Second: 99
First: 42, Second: undefined
```

---

## Q77. Write a program to return multiple values from a function as an object

```js
function analyseArray(arr) {
    const min     = Math.min(...arr);
    const max     = Math.max(...arr);
    const sum     = arr.reduce((a, b) => a + b, 0);
    const average = sum / arr.length;
    // Return all values packed into one object
    return { min, max, sum, average };
}

// Destructure the returned object to get each value by name
const { min, max, sum, average } = analyseArray([3, 1, 4, 1, 5, 9, 2, 6]);
console.log("min:    ", min);
console.log("max:    ", max);
console.log("sum:    ", sum);
console.log("average:", average);
```

**Output:**
```
min:     1
max:     9
sum:     31
average: 3.875
```

---

## Q78. Write a program to return multiple values from a function as an array

```js
function splitName(fullName) {
    const parts = fullName.split(" ");
    // Return [firstName, lastName] as an array
    return [parts[0], parts.slice(1).join(" ")];
}

// Destructure the returned array by position
const [firstName, lastName] = splitName("Sudhakar Kakunuri");
console.log("First:", firstName);
console.log("Last: ", lastName);
```

**Output:**
```
First: Sudhakar
Last:  Kakunuri
```

---

## Q79. Write a program to use destructuring with default values in a config object parameter

```js
// The = {} at the end means: if NO argument is passed, use an empty object
// Without = {} calling createServer() would throw: "Cannot destructure undefined"
function createServer({ host = "localhost", port = 3000, secure = false, timeout = 5000 } = {}) {
    console.log("host: " + host + " | port: " + port + " | secure: " + secure + " | timeout: " + timeout);
}

createServer();                              // all defaults
createServer({ port: 8080 });               // only port overridden, rest are defaults
createServer({ host: "prod.com", secure: true }); // two overridden
```

**Output:**
```
host: localhost | port: 3000 | secure: false | timeout: 5000
host: localhost | port: 8080 | secure: false | timeout: 5000
host: prod.com  | port: 3000 | secure: true  | timeout: 5000
```

---

## Q80. Write a program to show the difference between arguments object and rest parameters

```js
// OLD WAY: arguments object — available in all regular functions
function oldSum() {
    let total = 0;
    // arguments looks like an array but is NOT a real array
    // It has no array methods like .map, .filter, .reduce
    for (let i = 0; i < arguments.length; i++) {
        total += arguments[i];
    }
    return total;
}

// NEW WAY: rest parameters — a real array with all array methods
function newSum(...nums) {
    return nums.reduce((acc, n) => acc + n, 0); // map/filter/reduce all work
}

console.log("Old sum:", oldSum(1, 2, 3, 4, 5));  // 15
console.log("New sum:", newSum(1, 2, 3, 4, 5));  // 15

// arguments doesn't work in arrow functions at all
// rest works in all function types
const arrowSum = (...nums) => nums.reduce((a, b) => a + b, 0);
console.log("Arrow sum:", arrowSum(10, 20, 30)); // 60
```

**Output:**
```
Old sum: 15
New sum: 15
Arrow sum: 60
```

---

## Q81. Write a program to combine destructuring and default values in function parameters

```js
// This pattern is very common in test automation frameworks
// All fields are optional — if not passed, defaults are used
function setupTest({
    browser  = "chromium",
    headless = true,
    baseUrl  = "http://localhost:3000",
    timeout  = 30000
} = {}) {
    console.log("browser: " + browser + " | headless: " + headless +
                " | baseUrl: " + baseUrl + " | timeout: " + timeout);
}

setupTest();                                           // all defaults
setupTest({ browser: "firefox", timeout: 60000 });    // partial override
setupTest({ browser: "webkit", headless: false, baseUrl: "https://prod.com" });
```

**Output:**
```
browser: chromium | headless: true  | baseUrl: http://localhost:3000 | timeout: 30000
browser: firefox  | headless: true  | baseUrl: http://localhost:3000 | timeout: 60000
browser: webkit   | headless: false | baseUrl: https://prod.com      | timeout: 30000
```

---

## Q82. Write a program to create a private counter using closure

```js
// A closure is a function that "closes over" (remembers) variables from its outer scope
// count is defined in createCounter but stays alive because the returned methods use it
// count is PRIVATE — nothing outside can access it directly
function createCounter(start = 0) {
    let count = start; // this variable is private to the closure

    return {
        increment() { count++; console.log("Count:", count); },
        decrement() { count--; console.log("Count:", count); },
        reset()     { count = start; console.log("Reset to:", count); },
    };
}

const counter = createCounter(0);
counter.increment(); // Count: 1
counter.increment(); // Count: 2
counter.increment(); // Count: 3
counter.decrement(); // Count: 2
counter.reset();     // Reset to: 0

// count is not accessible from outside — it is truly private
console.log("Direct access:", counter.count); // undefined
```

**Output:**
```
Count: 1
Count: 2
Count: 3
Count: 2
Reset to: 0
Direct access: undefined
```

---

## Q83. Write a program to calculate Fibonacci numbers using loop and recursion

```js
// Fibonacci sequence: 0, 1, 1, 2, 3, 5, 8, 13...
// Each number = sum of the two before it

// Loop approach — efficient, no redundant calculations
function fibLoop(n) {
    if (n <= 1) return n;
    let a = 0, b = 1;
    for (let i = 2; i <= n; i++) {
        [a, b] = [b, a + b]; // a becomes b, b becomes a+b
    }
    return b;
}

// Recursive approach — clean but slow for large n (recalculates same values many times)
function fibRecursive(n) {
    if (n <= 1) return n; // base case
    return fibRecursive(n - 1) + fibRecursive(n - 2); // recursive case
}

for (let i = 0; i <= 9; i++) {
    console.log("fib(" + i + ") = loop:" + fibLoop(i) + "  recursive:" + fibRecursive(i));
}
```

**Output:**
```
fib(0) = loop:0  recursive:0
fib(1) = loop:1  recursive:1
fib(2) = loop:1  recursive:1
fib(3) = loop:2  recursive:2
fib(4) = loop:3  recursive:3
fib(5) = loop:5  recursive:5
```

---

## Q84. Write a program to show the difference between arrow function and regular function with this

```js
const person = {
    name: "Sudhakar",

    // Regular function: 'this' refers to the OBJECT that calls the method
    greetRegular: function () {
        console.log("Regular:", this.name); // 'this' = person → "Sudhakar"
    },

    // Arrow function: 'this' is inherited from the SURROUNDING scope (not the calling object)
    // At the object literal level, 'this' is the global object or undefined (strict mode)
    greetArrow: () => {
        console.log("Arrow:", typeof this === "undefined" ? "undefined" : this.name);
    }
};

person.greetRegular(); // works — this = person
person.greetArrow();   // fails — arrow has no own 'this'
```

**Output:**
```
Regular: Sudhakar
Arrow: undefined
```

---

## Q85. Write a program to demonstrate IIFE (Immediately Invoked Function Expression)

```js
// IIFE: wrap function in () then immediately call it with ()
// The function runs once at definition time without being named or called explicitly
(function () {
    console.log("Basic IIFE runs immediately!");
})();

// Arrow function IIFE
(() => {
    console.log("Arrow IIFE runs too!");
})();

// IIFE that accepts parameters and returns a value
const result = (function (a, b) {
    return a + b;
})(10, 20);
console.log("IIFE result:", result); // 30

// KEY USE: IIFE creates a private scope — variables inside don't leak to global scope
(function () {
    const secret = "hidden value";
    console.log("Inside IIFE:", secret);
})();

try {
    console.log(secret); // ReferenceError — secret doesn't exist outside
} catch (e) {
    console.log("Outside IIFE:", e.constructor.name);
}
```

**Output:**
```
Basic IIFE runs immediately!
Arrow IIFE runs too!
IIFE result: 30
Inside IIFE: hidden value
Outside IIFE: ReferenceError
```

---

## Q86. Write a program to create a higher order function that accepts a function as parameter

```js
// A higher-order function takes a function as an argument or returns one
function applyOperation(a, b, fn) {
    return fn(a, b); // call the passed-in function with a and b
}

// Pass different operations as the third argument
console.log(applyOperation(10, 5, (a, b) => a + b));    // 15
console.log(applyOperation(10, 5, (a, b) => a - b));    // 5
console.log(applyOperation(10, 5, (a, b) => a * b));    // 50
console.log(applyOperation(2, 10, (a, b) => a ** b));   // 1024

// applyToAll is also higher-order: it takes a function and applies it to each element
function applyToAll(arr, fn) {
    const result = [];
    for (const item of arr) result.push(fn(item));
    return result;
}

console.log(applyToAll([1, 2, 3, 4], x => x * x)); // squares: [1,4,9,16]
```

**Output:**
```
15
5
50
1024
[1, 4, 9, 16]
```

---

## Q87. Write a program to create a function that returns another function (multiplier)

```js
// A function that returns a function is one form of CURRYING
// multiplier(2) returns a function — we store that function as 'double'
// Then we call double(5) which remembers factor=2 from its closure
function multiplier(factor) {
    // 'factor' is captured by the inner function's closure
    return function (number) {
        return number * factor;
    };
}

const double   = multiplier(2);  // factor=2 is locked in
const triple   = multiplier(3);  // factor=3 is locked in
const tenTimes = multiplier(10); // factor=10 is locked in

console.log("double(5):   ", double(5));    // 5 * 2 = 10
console.log("triple(5):   ", triple(5));    // 5 * 3 = 15
console.log("tenTimes(5): ", tenTimes(5));  // 5 * 10 = 50
```

**Output:**
```
double(5):    10
triple(5):    15
tenTimes(5):  50
```

---

## Q88. Write a program to create a general curry function

```js
// curry converts fn(a, b) into fn(a)(b)
// The returned function from the first call "remembers" the first argument
function curry(fn) {
    return function (a) {       // first call captures 'a'
        return function (b) {   // second call captures 'b' and calls fn
            return fn(a, b);
        };
    };
}

const curriedAdd      = curry((a, b) => a + b);
const curriedMultiply = curry((a, b) => a * b);

console.log(curriedAdd(2)(3));       // 5
console.log(curriedAdd(10)(20));     // 30
console.log(curriedMultiply(3)(4));  // 12
```

**Output:**
```
5
30
12
```

---

## Q89. Write a program to create a memoize function that caches results

```js
function memoize(fn) {
    const cache = {}; // stores previously computed results

    return function (...args) {
        const key = JSON.stringify(args); // create a unique key from arguments

        if (key in cache) {
            console.log("Cache hit for:", key); // result already computed!
            return cache[key];
        }

        console.log("Calculating for:", key); // first time — compute it
        const result = fn(...args);
        cache[key] = result; // store result for future calls with same args
        return result;
    };
}

function heavyCalc(n) { return n * n; }

const fastCalc = memoize(heavyCalc);
console.log(fastCalc(10)); // computes: 100
console.log(fastCalc(10)); // from cache: 100 — no recalculation!
console.log(fastCalc(20)); // computes: 400
console.log(fastCalc(20)); // from cache: 400
```

**Output:**
```
Calculating for: [10]
100
Cache hit for: [10]
100
Calculating for: [20]
400
Cache hit for: [20]
400
```

---

## Q90. Write a program to create a debounce function

```js
// Debounce: delays execution until the user STOPS calling for 'delay' ms
// Useful for: search boxes (don't call API on every keystroke)
function debounce(fn, delay) {
    let timer; // stores the pending timeout

    return function (...args) {
        clearTimeout(timer); // cancel any previously scheduled call
        // Schedule fn to run after 'delay' ms
        // If called again before delay expires, timer resets (previous call cancelled)
        timer = setTimeout(() => fn(...args), delay);
    };
}

function search(query) {
    console.log("Searching for:", query);
}

const debouncedSearch = debounce(search, 300);

// Simulate rapid typing — each call resets the timer
// Only the LAST call fires (after 300ms of silence)
debouncedSearch("j");
debouncedSearch("ja");
debouncedSearch("jav");
debouncedSearch("javascript"); // ← only this one runs after 300ms
```

**Output:**
```
Searching for: javascript
```

---

## Q91. Write a program to create a throttle function

```js
// Throttle: allows fn to run at most ONCE per 'limit' ms regardless of how often called
// Useful for: scroll/resize handlers (limit expensive calculations)
// Difference: debounce waits for silence, throttle fires at regular intervals
function throttle(fn, limit) {
    let lastCall = 0; // timestamp of last execution

    return function (...args) {
        const now = Date.now();
        if (now - lastCall >= limit) {
            lastCall = now; // update last call time
            fn(...args);    // execute the function
        } else {
            console.log("Throttled — too soon");
        }
    };
}

function handleScroll() {
    console.log("Scroll handled at:", Date.now());
}

const throttledScroll = throttle(handleScroll, 1000);

// All 3 calls happen almost instantly — only first one within 1000ms executes
throttledScroll(); // executes
throttledScroll(); // throttled
throttledScroll(); // throttled
```

**Output:**
```
Scroll handled at: 1234567890
Throttled — too soon
Throttled — too soon
```
