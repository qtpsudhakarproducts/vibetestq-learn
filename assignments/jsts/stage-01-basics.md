# Stage 1 — Absolute Basics

---

## Q1. Write a program to print Hello World

```js
// console.log() prints output to the terminal
console.log("Hello World");
```

**Output:**
```
Hello World
```

---

## Q2. Write a program to find whether a given number is odd or even

```js
function isOddOrEven(num) {
    // % is the modulo operator — gives the remainder after division
    // Any number divided by 2 with remainder 0 is even
    if (num % 2 === 0) {
        console.log(num + " is Even");
    } else {
        console.log(num + " is Odd");
    }
}

isOddOrEven(4);
isOddOrEven(7);
isOddOrEven(0);
isOddOrEven(-3);
isOddOrEven(15);
```

**Output:**
```
4 is Even
7 is Odd
0 is Even
-3 is Odd
15 is Odd
```

---

## Q3. Write a program to perform addition, subtraction, multiplication and division using switch case

```js
function calculate(num1, num2, operation) {
    let result;
    // switch checks the value of 'operation' and jumps to the matching case
    switch (operation) {
        case "add":
            result = num1 + num2;
            break; // break stops execution from falling into the next case
        case "sub":
            result = num1 - num2;
            break;
        case "mul":
            result = num1 * num2;
            break;
        case "div":
            if (num2 === 0) {
                console.log("Cannot divide by zero");
                return; // exit the function early
            }
            result = num1 / num2;
            break;
        default:
            // default runs when no case matches
            console.log("Unknown operation: " + operation);
            return;
    }
    console.log(num1 + " " + operation + " " + num2 + " = " + result);
}

calculate(10, 5, "add");
calculate(10, 5, "sub");
calculate(10, 5, "mul");
calculate(10, 5, "div");
calculate(10, 0, "div");
calculate(10, 5, "mod");
```

**Output:**
```
10 add 5 = 15
10 sub 5 = 5
10 mul 5 = 50
10 div 5 = 2
Cannot divide by zero
Unknown operation: mod
```

---

## Q4. Write a program to generate a random number between a given range

```js
function randomBetween(min, max) {
    // Math.random() gives a decimal between 0 and 1 (e.g. 0.73)
    // Multiply by (max - min + 1) to scale the range
    // Math.floor() removes the decimal to get a whole number
    // Adding min shifts the range to start from min
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

console.log("5 random numbers between 1 and 10:");
for (let i = 1; i <= 5; i++) {
    console.log(randomBetween(1, 10));
}

console.log("3 random numbers between 50 and 100:");
for (let i = 1; i <= 3; i++) {
    console.log(randomBetween(50, 100));
}
```

**Output:**
```
5 random numbers between 1 and 10:
7  (values differ each run)
3
9
1
6
3 random numbers between 50 and 100:
72
58
91
```

---

## Q5. Write a program to find whether a given year is a leap year

```js
function isLeapYear(year) {
    // Rule 1: divisible by 4 → leap year
    // Rule 2: but divisible by 100 → NOT a leap year
    // Rule 3: unless also divisible by 400 → IS a leap year
    // So 2000 = leap (400), 1900 = not leap (100 but not 400), 2024 = leap (4)
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) {
        console.log(year + " is a Leap Year");
    } else {
        console.log(year + " is not a Leap Year");
    }
}

isLeapYear(2000);
isLeapYear(1900);
isLeapYear(2024);
isLeapYear(2023);
isLeapYear(1600);
isLeapYear(2100);
```

**Output:**
```
2000 is a Leap Year
1900 is not a Leap Year
2024 is a Leap Year
2023 is not a Leap Year
1600 is a Leap Year
2100 is not a Leap Year
```

---

## Q6. Write a program to show the difference between Math.floor, Math.ceil, Math.round and Math.trunc

```js
const numbers = [4.7, 4.2, 4.5, -4.7, -4.2, -4.5];

console.log("Number  floor  ceil   round  trunc");
console.log("------  -----  ----   -----  -----");

for (const n of numbers) {
    // floor  → always rounds DOWN toward negative infinity
    // ceil   → always rounds UP toward positive infinity
    // round  → rounds to nearest, 0.5 goes UP
    // trunc  → removes decimal part, rounds toward ZERO
    console.log(
        String(n).padEnd(7),
        String(Math.floor(n)).padEnd(6),
        String(Math.ceil(n)).padEnd(6),
        String(Math.round(n)).padEnd(6),
        String(Math.trunc(n))
    );
}
```

**Output:**
```
Number  floor  ceil   round  trunc
------  -----  ----   -----  -----
4.7     4      5      5      4
4.2     4      5      4      4
4.5     4      5      5      4
-4.7    -5     -4     -5     -4
-4.2    -5     -4     -4     -4
-4.5    -5     -4     -4     -4
```

---

## Q7. Write a program to show the difference between == and ===

```js
// == checks VALUE only — JavaScript converts types before comparing (type coercion)
// === checks VALUE AND TYPE — no conversion, strict comparison

console.log("5 == '5'          →", 5 == "5");    // true  — "5" converted to number 5
console.log("5 === '5'         →", 5 === "5");   // false — number vs string, different types
console.log("0 == false        →", 0 == false);  // true  — false converts to 0
console.log("0 === false       →", 0 === false); // false — number vs boolean
console.log("null == undefined →", null == undefined);  // true  — special JS rule
console.log("null === undefined→", null === undefined); // false — different types
console.log("'' == false       →", "" == false);  // true  — both convert to 0
console.log("'' === false      →", "" === false); // false — string vs boolean
console.log("1 == true         →", 1 == true);   // true  — true converts to 1
console.log("1 === true        →", 1 === true);  // false — number vs boolean
```

**Output:**
```
5 == '5'          → true
5 === '5'         → false
0 == false        → true
0 === false       → false
null == undefined → true
null === undefined→ false
'' == false       → true
'' === false      → false
1 == true         → true
1 === true        → false
```

---

## Q8. Write a program to show the difference between null, undefined and NaN

```js
let a = null;      // null means intentionally empty — developer set it to nothing
let b;             // undefined means declared but never assigned a value
let c = NaN;       // NaN means "Not a Number" — result of invalid number operation

console.log("null:", a);
console.log("undefined:", b);
console.log("NaN:", c);

// typeof reveals an important JS quirk — null returns "object" not "null"
console.log("typeof null:", typeof a);       // "object" ← known JS bug from 1995
console.log("typeof undefined:", typeof b);  // "undefined"
console.log("typeof NaN:", typeof c);        // "number" ← NaN is technically a number type

// NaN is the only value in JS that is not equal to itself
console.log("NaN === NaN:", NaN === NaN);    // false ← use isNaN() instead
console.log("isNaN(NaN):", isNaN(NaN));      // true

// Correct ways to check each
console.log("Check null:", a === null);           // true
console.log("Check undefined:", b === undefined); // true
console.log("Check NaN:", isNaN(c));              // true
```

**Output:**
```
null: null
undefined: undefined
NaN: NaN
typeof null: object
typeof undefined: undefined
typeof NaN: number
NaN === NaN: false
isNaN(NaN): true
Check null: true
Check undefined: true
Check NaN: true
```

---

## Q9. Write a program to print typeof for all data types

```js
// typeof returns a string describing the type of a value
console.log(typeof "hello");           // string
console.log(typeof 42);               // number
console.log(typeof 3.14);             // number  ← integers and decimals are both "number"
console.log(typeof true);             // boolean
console.log(typeof undefined);        // undefined
console.log(typeof null);             // object   ← famous JS quirk, should be "null"
console.log(typeof {});               // object
console.log(typeof []);               // object   ← arrays are objects in JS
console.log(typeof function() {});    // function
console.log(typeof Symbol("id"));     // symbol
console.log(typeof 9007199254740991n);// bigint   ← n suffix makes it a BigInt

// Since typeof null gives "object", use === null to correctly check for null
const val = null;
console.log("Is null:", val === null); // true
```

**Output:**
```
string
number
number
boolean
undefined
object
object
object
function
symbol
bigint
Is null: true
```

---

## Q10. Write a program to show that primitives are passed by value and objects are passed by reference

```js
// PRIMITIVES (number, string, boolean) — a COPY is passed
// Changes inside the function do NOT affect the original
function changeNumber(n) {
    n = 100; // only the local copy changes
}
let num = 10;
changeNumber(num);
console.log("num after call:", num); // still 10 — original unchanged

// OBJECTS — the SAME memory address is passed (reference)
// Changes inside the function DO affect the original
function changeName(obj) {
    obj.name = "Changed"; // modifies the actual object in memory
}
let person = { name: "Original" };
changeName(person);
console.log("person.name after call:", person.name); // "Changed" — original modified

// ARRAYS — also passed by reference (arrays are objects)
function addToArray(arr) {
    arr.push(99); // modifies the actual array in memory
}
let numbers = [1, 2, 3];
addToArray(numbers);
console.log("numbers after call:", numbers); // [1, 2, 3, 99] — original modified
```

**Output:**
```
num after call: 10
person.name after call: Changed
numbers after call: [1, 2, 3, 99]
```

---

## Q11. Write a program to show how hoisting works with var, let and function declarations

```js
// HOISTING: JavaScript moves declarations to the top of their scope before running
// var declarations are hoisted but their VALUE is not — so you get undefined
console.log("a before declaration:", a); // undefined — not an error
var a = 10;
console.log("a after declaration:", a);  // 10

// Function DECLARATIONS are fully hoisted — you can call them before they appear
sayHello(); // works perfectly
function sayHello() {
    console.log("Hello from sayHello!");
}

// let and const are hoisted but stay in a "temporal dead zone"
// Accessing them before declaration throws a ReferenceError
try {
    console.log("b before declaration:", b); // ReferenceError
} catch (e) {
    console.log("b before declaration:", e.constructor.name);
}
let b = 20;

// Function EXPRESSIONS assigned to var are NOT fully hoisted
// The variable is hoisted as undefined, not as a function
try {
    greet(); // TypeError — greet is undefined at this point
} catch (e) {
    console.log("greet before declaration:", e.constructor.name);
}
var greet = function () {
    console.log("Hi from greet!");
};
```

**Output:**
```
a before declaration: undefined
Hello from sayHello!
b before declaration: ReferenceError
greet before declaration: TypeError
```

---

## Q12. Write a program to convert Celsius to Fahrenheit and Fahrenheit to Celsius

```js
// Formula: F = (C × 9/5) + 32
function celsiusToFahrenheit(c) {
    const f = (c * 9 / 5) + 32;
    console.log(c + "°C = " + f + "°F");
}

// Formula: C = (F - 32) × 5/9
function fahrenheitToCelsius(f) {
    const c = (f - 32) * 5 / 9;
    // toFixed(1) rounds to 1 decimal place
    console.log(f + "°F = " + c.toFixed(1) + "°C");
}

celsiusToFahrenheit(0);    // freezing point of water
celsiusToFahrenheit(100);  // boiling point of water
celsiusToFahrenheit(37);   // human body temperature
fahrenheitToCelsius(32);
fahrenheitToCelsius(212);
fahrenheitToCelsius(98.6);
```

**Output:**
```
0°C = 32°F
100°C = 212°F
37°C = 98.6°F
32°F = 0.0°C
212°F = 100.0°C
98.6°F = 37.0°C
```
