# Stage 5 — Loops & Patterns

---

## Q44. Write a program to print numbers from 1 to 5 using for loop, while loop and do while loop

```js
// for loop — best when you know exactly how many times to loop
let forOut = "for loop:   ";
for (let i = 1; i <= 5; i++) { // i++ means i = i + 1
    forOut += i + " ";
}
console.log(forOut);

// while loop — best when you loop until a condition is met
let whileOut = "while loop: ";
let i = 1;
while (i <= 5) {
    whileOut += i + " ";
    i++; // must increment manually or loop runs forever!
}
console.log(whileOut);

// do-while loop — runs the body FIRST, then checks the condition
// Guaranteed to run at least once even if condition is false from the start
let doOut = "do-while:   ";
let j = 1;
do {
    doOut += j + " ";
    j++;
} while (j <= 5);
console.log(doOut);

// Demonstrating do-while runs at least once
let k = 10; // condition k < 5 is already false
do {
    console.log("do-while ran once even though k = " + k);
    k++;
} while (k < 5); // false from the start — but body already ran once
```

**Output:**
```
for loop:   1 2 3 4 5
while loop: 1 2 3 4 5
do-while:   1 2 3 4 5
do-while ran once even though k = 10
```

---

## Q45. Write a program to skip multiples of 3 using continue and stop at 15 using break

```js
for (let i = 1; i <= 20; i++) {
    if (i === 15) {
        console.log("Stopped at 15");
        break; // break exits the entire loop immediately
    }
    if (i % 3 === 0) {
        continue; // continue skips the rest of this iteration and goes to next i
    }
    process.stdout.write(i + " "); // print without newline
}
console.log(); // newline after all numbers
```

**Output:**
```
1 2 4 5 7 8 10 11 13 14
Stopped at 15
```

---

## Q46. Write a program to iterate over a string character by character using for...of loop

```js
// for...of works on any iterable — strings, arrays, Sets, Maps
// For a string it gives one character per iteration
const str = "Playwright";
for (const [index, char] of str.split("").entries()) {
    console.log(index + ": " + char);
}
```

**Output:**
```
0: P
1: l
2: a
3: y
4: w
5: r
6: i
7: g
8: h
9: t
```

---

## Q47. Write a program to iterate over an object using for...in loop

```js
// for...in iterates over the KEYS of an object
// Use the key to access the value: obj[key]
const testConfig = {
    browser:  "chromium",
    headless: true,
    timeout:  30000,
    retries:  2,
    baseUrl:  "https://example.com"
};

for (const key in testConfig) {
    // padEnd(10) aligns the output by padding key to 10 characters
    console.log(key.padEnd(10) + ": " + testConfig[key]);
}
```

**Output:**
```
browser   : chromium
headless  : true
timeout   : 30000
retries   : 2
baseUrl   : https://example.com
```

---

## Q48. Write a program to print a star triangle pattern with 5 rows

```js
// Row 1: 1 star, Row 2: 2 stars ... Row 5: 5 stars
// Outer loop controls the ROW number
// Inner concept: repeat("* ", i) creates i stars separated by spaces
for (let i = 1; i <= 5; i++) {
    // "* ".repeat(i) gives "* " repeated i times, trim() removes trailing space
    console.log("* ".repeat(i).trim());
}
```

**Output:**
```
*
* *
* * *
* * * *
* * * * *
```

---

## Q49. Write a program to print an inverted star triangle with 5 rows

```js
// Row 1: 5 stars, Row 2: 4 stars ... Row 5: 1 star
// Start i at 5 and decrease to 1
for (let i = 5; i >= 1; i--) {
    console.log("* ".repeat(i).trim());
}
```

**Output:**
```
* * * * *
* * * *
* * *
* *
*
```

---

## Q50. Write a program to print a number pattern where each row prints numbers from 1 to the row number

```js
// Row 1: "1"
// Row 2: "1 2"
// Row 3: "1 2 3" ... and so on
for (let i = 1; i <= 5; i++) {
    let line = "";
    // Inner loop goes from 1 to i (the current row number)
    for (let j = 1; j <= i; j++) {
        line += j + " ";
    }
    console.log(line.trim());
}
```

**Output:**
```
1
1 2
1 2 3
1 2 3 4
1 2 3 4 5
```

---

## Q51. Write a program to print Pascal's triangle for 6 rows

```js
// Pascal's triangle: each number = sum of two numbers directly above it
// We use the combination formula nCr = n! / (r! × (n-r)!)
// Row 0: C(0,0)=1
// Row 1: C(1,0)=1, C(1,1)=1
// Row 2: C(2,0)=1, C(2,1)=2, C(2,2)=1

function factorial(n) {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
}

function nCr(n, r) {
    return factorial(n) / (factorial(r) * factorial(n - r));
}

const rows = 6;
for (let i = 0; i < rows; i++) {
    // Indent each row to make it look like a triangle
    let line = " ".repeat((rows - i) * 2);
    for (let j = 0; j <= i; j++) {
        line += nCr(i, j) + "  ";
    }
    console.log(line);
}
```

**Output:**
```
            1
          1  1
        1  2  1
      1  3  3  1
    1  4  6  4  1
  1  5  10  10  5  1
```

---

## Q52. Write a program to print a diamond pattern

```js
const n = 3; // controls the size of the diamond

// Upper half: rows increase from 1 to n stars
for (let i = 1; i <= n; i++) {
    // Spaces before stars: (n-i) spaces to center the stars
    console.log(" ".repeat(n - i) + "* ".repeat(i).trim());
}

// Lower half: rows decrease from n-1 down to 1 (no middle row repeat)
for (let i = n - 1; i >= 1; i--) {
    console.log(" ".repeat(n - i) + "* ".repeat(i).trim());
}
```

**Output:**
```
  *
 * *
* * *
 * *
  *
```

---

## Q53. Write a program to print index and value of each array element using for...of with entries()

```js
// entries() returns [index, value] pairs
// We destructure each pair directly: [index, value]
const browsers = ["chromium", "firefox", "webkit", "edge"];

for (const [index, value] of browsers.entries()) {
    // index + 1 gives human-friendly numbering starting from 1
    console.log("Browser " + (index + 1) + ": " + value);
}
```

**Output:**
```
Browser 1: chromium
Browser 2: firefox
Browser 3: webkit
Browser 4: edge
```

---

## Q54. Write a program to print multiplication table for a given number

```js
function printTable(num) {
    console.log("--- Multiplication Table for " + num + " ---");
    // Loop from 1 to 10 and multiply
    for (let i = 1; i <= 10; i++) {
        console.log(num + " x " + i + " = " + (num * i));
    }
}

printTable(7);
```

**Output:**
```
--- Multiplication Table for 7 ---
7 x 1 = 7
7 x 2 = 14
7 x 3 = 21
7 x 4 = 28
7 x 5 = 35
7 x 6 = 42
7 x 7 = 49
7 x 8 = 56
7 x 9 = 63
7 x 10 = 70
```
