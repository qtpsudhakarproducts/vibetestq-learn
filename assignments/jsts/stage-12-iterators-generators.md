# Stage 12 — Iterators & Generators

---

## Q123. Write a program to create a custom iterable Range class using Symbol.iterator

```js
class Range {
    constructor(start, end) { this.start = start; this.end = end; }

    // Symbol.iterator is the standard protocol for making objects iterable
    // It must return an iterator object with a next() method
    [Symbol.iterator]() {
        let current = this.start;
        const end   = this.end;

        return {
            next() {
                if (current <= end) {
                    return { value: current++, done: false }; // yield next number
                }
                return { value: undefined, done: true }; // signal iteration is complete
            }
        };
    }
}

// Now Range works with for...of, spread, destructuring — all use Symbol.iterator
const result = [];
for (const n of new Range(1, 5)) result.push(n);
console.log("for...of:", result.join(" "));  // 1 2 3 4 5

console.log("spread:  ", [...new Range(3, 7)]);  // [3, 4, 5, 6, 7]

const [a, b, c] = new Range(10, 15); // destructuring also uses the iterator
console.log("a=" + a + " b=" + b + " c=" + c); // 10 11 12
```

**Output:**
```
for...of: 1 2 3 4 5
spread:   [3, 4, 5, 6, 7]
a=10 b=11 c=12
```

---

## Q124. Write a program to use a generator function with yield and next()

```js
// function* declares a generator function
// Generators are "pausable" functions — they pause at yield and resume on .next()
function* stepGenerator() {
    console.log("Before step 1");
    yield "navigate";        // PAUSES here, returns { value: "navigate", done: false }
    console.log("Before step 2");
    yield "fill form";       // PAUSES here
    console.log("Before step 3");
    yield "click submit";    // PAUSES here
    console.log("Done");
    // function ends — next .next() returns { value: undefined, done: true }
}

const gen = stepGenerator();

// Each .next() runs until the next yield, then pauses
console.log(gen.next()); // runs until first yield
console.log(gen.next()); // resumes, runs until second yield
console.log(gen.next()); // resumes, runs until third yield
console.log(gen.next()); // resumes, function ends
```

**Output:**
```
Before step 1
{ value: 'navigate', done: false }
Before step 2
{ value: 'fill form', done: false }
Before step 3
{ value: 'click submit', done: false }
Done
{ value: undefined, done: true }
```

---

## Q125. Write a program to create an infinite sequence generator and take only the first N values

```js
// An infinite generator never returns done: true — it can yield forever
// This is "lazy evaluation" — values are only produced when requested
function* idGenerator(prefix) {
    let n = 1;
    while (true) { // infinite loop is OK in a generator — it only runs when .next() is called
        yield prefix + "-" + String(n++).padStart(3, "0");
    }
}

// Helper: take n values from any generator then stop
function take(gen, n) {
    const result = [];
    for (const val of gen) {
        result.push(val);
        if (result.length === n) break; // stop consuming the generator
    }
    return result;
}

const gen = idGenerator("TEST");
console.log("First 5:", take(gen, 5)); // ["TEST-001"..."TEST-005"]
console.log("Next 3: ", take(gen, 3)); // ["TEST-006"..."TEST-008"] — resumes where it left off
```

**Output:**
```
First 5: ["TEST-001", "TEST-002", "TEST-003", "TEST-004", "TEST-005"]
Next 3:  ["TEST-006", "TEST-007", "TEST-008"]
```

---

## Q126. Write a program to use yield* to delegate from one generator to another

```js
function* loginSteps() {
    yield "open login page";
    yield "enter username";
    yield "enter password";
    yield "click login";
}

function* checkoutSteps() {
    yield "add to cart";
    yield "enter payment";
    yield "confirm order";
}

function* fullTestFlow() {
    // yield* delegates to another generator — all its yields become part of this generator
    // It's like "inline" or "spread" for generators
    yield* loginSteps();
    yield "--- now in checkout ---"; // our own yield between delegations
    yield* checkoutSteps();
}

for (const step of fullTestFlow()) {
    console.log(step);
}
```

**Output:**
```
open login page
enter username
enter password
click login
--- now in checkout ---
add to cart
enter payment
confirm order
```

---

## Q127. Write a program to make a class iterable by implementing Symbol.iterator

```js
class TestSuite {
    constructor(name, tests) {
        this.name  = name;
        this.tests = tests;
    }

    // Adding Symbol.iterator makes this class work with for...of, spread, destructuring
    [Symbol.iterator]() {
        let index = 0;
        const tests = this.tests;
        return {
            next() {
                return index < tests.length
                    ? { value: tests[index++], done: false }
                    : { done: true };
            }
        };
    }
}

const suite = new TestSuite("Smoke Tests", ["Login", "Search", "Checkout", "Logout"]);

// for...of works because Symbol.iterator is implemented
for (const test of suite) console.log(test);

// spread also works
console.log([...suite]);

// destructuring also works
const [first, second] = suite;
console.log("first:", first, "second:", second);
```

**Output:**
```
Login
Search
Checkout
Logout
["Login", "Search", "Checkout", "Logout"]
first: Login second: Search
```
