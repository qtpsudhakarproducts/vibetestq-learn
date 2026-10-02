# Stage 6 — Arrays Using Built-in Methods

---

## Q55. Write a program to print each value from an array using forEach

```js
const scores = [85, 92, 78, 95, 60, 88];

// forEach runs a callback for each element
// callback receives: (currentValue, index, array)
scores.forEach((score, index) => {
    const label = score >= 75 ? "Pass" : "Fail"; // ternary: condition ? ifTrue : ifFalse
    console.log((index + 1) + ". " + score + " → " + label);
});
```

**Output:**
```
1. 85 → Pass
2. 92 → Pass
3. 78 → Pass
4. 95 → Pass
5. 60 → Fail
6. 88 → Pass
```

---

## Q56. Write a program to transform an array using map

```js
const prices = [100, 250, 80, 320, 150];

// map creates a NEW array by applying a function to each element
// The original array is NEVER changed
const discounted = prices.map(p => p * 0.9);          // multiply each by 0.9
const formatted  = discounted.map(p => "$" + p.toFixed(2)); // format as "$90.00"

console.log("Original:  ", prices);
console.log("After 10%: ", discounted);
console.log("Formatted: ", formatted);
```

**Output:**
```
Original:   [100, 250, 80, 320, 150]
After 10%:  [90, 225, 72, 288, 135]
Formatted:  ["$90.00", "$225.00", "$72.00", "$288.00", "$135.00"]
```

---

## Q57. Write a program to get only even numbers from an array using filter

```js
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

// filter returns a NEW array containing only elements where the callback returns true
// Elements where callback returns false are excluded
console.log("Even numbers:   ", numbers.filter(n => n % 2 === 0));
console.log("Greater than 5: ", numbers.filter(n => n > 5));
console.log("Divisible by 3: ", numbers.filter(n => n % 3 === 0));
```

**Output:**
```
Even numbers:    [2, 4, 6, 8, 10]
Greater than 5:  [6, 7, 8, 9, 10]
Divisible by 3:  [3, 6, 9]
```

---

## Q58. Write a program to find sum and product of array elements using reduce

```js
const numbers = [1, 2, 3, 4, 5];

// reduce processes each element and accumulates a single result
// callback(accumulator, currentValue) — accumulator holds the running total
// Second argument is the initial value of accumulator
const sum     = numbers.reduce((acc, n) => acc + n, 0); // start at 0
const product = numbers.reduce((acc, n) => acc * n, 1); // start at 1

// reduce can also find max: compare each element with current max
const max = numbers.reduce((acc, n) => n > acc ? n : acc, numbers[0]);

console.log("Sum:    ", sum);     // 1+2+3+4+5 = 15
console.log("Product:", product); // 1×2×3×4×5 = 120
console.log("Max:    ", max);     // 5
```

**Output:**
```
Sum:     15
Product: 120
Max:     5
```

---

## Q59. Write a program to search in an array using find and findIndex

```js
const users = [
    { id: 1, name: "Alice", role: "admin" },
    { id: 2, name: "Bob",   role: "user"  },
    { id: 3, name: "Carol", role: "user"  },
    { id: 4, name: "Dave",  role: "admin" }
];

// find returns the FIRST element where callback returns true (or undefined if none)
const firstAdmin = users.find(u => u.role === "admin"); // stops at Alice

// findIndex returns the INDEX of the first matching element (or -1 if none)
const indexOfId3 = users.findIndex(u => u.id === 3); // returns 2 (0-indexed)

const startsWithC = users.find(u => u.name.startsWith("C"));

console.log("First admin:   ", firstAdmin);
console.log("Index of id 3: ", indexOfId3);
console.log("Name starts C: ", startsWithC);
```

**Output:**
```
First admin:    { id: 1, name: "Alice", role: "admin" }
Index of id 3:  2
Name starts C:  { id: 3, name: "Carol", role: "user" }
```

---

## Q60. Write a program to use every and some to test array conditions

```js
const durations = [120, 340, 89, 560, 200, 450]; // test durations in ms

// every returns true only if ALL elements pass the test
// Returns false as soon as it finds ONE that fails
console.log("All under 1000ms?", durations.every(d => d < 1000)); // true
console.log("All under 300ms? ", durations.every(d => d < 300));  // false — 340 fails

// some returns true if AT LEAST ONE element passes the test
// Returns true as soon as it finds ONE that passes
console.log("Any over 500ms?  ", durations.some(d => d > 500));   // true — 560
console.log("Any under 100ms? ", durations.some(d => d < 100));   // true — 89
```

**Output:**
```
All under 1000ms? true
All under 300ms?  false
Any over 500ms?   true
Any under 100ms?  true
```

---

## Q61. Write a program to flatten a nested array using flat and flatMap

```js
const nested = [1, [2, 3], [4, [5, 6]], [7, [8, [9]]]];

// flat(depth) flattens nested arrays up to the given depth level
console.log("flat(1):       ", nested.flat());           // 1 level deep
console.log("flat(2):       ", nested.flat(2));          // 2 levels deep
console.log("flat(Infinity):", nested.flat(Infinity));   // all levels

// flatMap is equivalent to .map().flat(1) — map then flatten one level
const sentences = ["Hello World", "Test Automation", "JavaScript"];
const words = sentences.flatMap(s => s.split(" ")); // split each sentence into words and flatten
console.log("flatMap words: ", words);
```

**Output:**
```
flat(1):        [1, 2, 3, 4, [5, 6], 7, [8, [9]]]
flat(2):        [1, 2, 3, 4, 5, 6, 7, 8, [9]]
flat(Infinity): [1, 2, 3, 4, 5, 6, 7, 8, 9]
flatMap words:  ["Hello", "World", "Test", "Automation", "JavaScript"]
```

---

## Q62. Write a program to sort an array of strings and numbers correctly

```js
const names = ["Zara", "Alice", "Mango", "Bob", "Carol"];
const nums  = [10, 2, 30, 5, 1, 20];

// sort() without a compare function converts elements to STRINGS then sorts
// This is correct for strings but WRONG for numbers!
console.log("Names sorted:         ", [...names].sort());

// Default sort of numbers gives wrong order because "10" < "2" alphabetically
console.log("Default sort (wrong): ", [...nums].sort());

// For numbers, always provide a compare function
// compare(a, b): return negative = a first, positive = b first, 0 = equal
console.log("Numbers ascending:    ", [...nums].sort((a, b) => a - b)); // a-b puts smaller first
console.log("Numbers descending:   ", [...nums].sort((a, b) => b - a)); // b-a puts larger first
```

**Output:**
```
Names sorted:          ["Alice", "Bob", "Carol", "Mango", "Zara"]
Default sort (wrong):  [1, 10, 2, 20, 30, 5]
Numbers ascending:     [1, 2, 5, 10, 20, 30]
Numbers descending:    [30, 20, 10, 5, 2, 1]
```

---

## Q63. Write a program to show the difference between slice and splice

```js
const fruits = ["apple", "banana", "cherry", "date", "elderberry"];

// slice(start, end) — returns a NEW array, DOES NOT modify original
// end index is NOT included
const sliced = fruits.slice(1, 4);
console.log("slice(1, 4):  ", sliced);   // ["banana", "cherry", "date"]
console.log("After slice:  ", fruits);   // unchanged!

// splice(start, deleteCount, ...insertItems) — MODIFIES the original array
// Returns removed elements as an array
const fruits2  = ["apple", "banana", "cherry", "date", "elderberry"];
const removed  = fruits2.splice(1, 2, "mango", "kiwi"); // remove 2 at index 1, insert mango & kiwi
console.log("Removed:      ", removed);  // ["banana", "cherry"] — what was taken out
console.log("After splice: ", fruits2);  // original is changed!
```

**Output:**
```
slice(1, 4):   ["banana", "cherry", "date"]
After slice:   ["apple", "banana", "cherry", "date", "elderberry"]
Removed:       ["banana", "cherry"]
After splice:  ["apple", "mango", "kiwi", "date", "elderberry"]
```

---

## Q64. Write a program to create arrays using Array.from

```js
// Array.from(arrayLike, mapFunction) creates a new array from any iterable

// Create [1,2,3,4,5] using length — _ is the unused element, i is the index
const range = Array.from({ length: 5 }, (_, i) => i + 1);
console.log("Range 1-5:", range);

// Create array from a string — each character becomes an element
const chars = Array.from("hello");
console.log("From string:", chars);

// Create from a Set — useful for removing duplicates
const unique = Array.from(new Set([1, 2, 2, 3, 3, 4]));
console.log("No duplicates:", unique);

// Create squares of 1 to 5 — (i+1)² for each position
const squares = Array.from({ length: 5 }, (_, i) => (i + 1) ** 2);
console.log("Squares:", squares);
```

**Output:**
```
Range 1-5:     [1, 2, 3, 4, 5]
From string:   ["h", "e", "l", "l", "o"]
No duplicates: [1, 2, 3, 4]
Squares:       [1, 4, 9, 16, 25]
```
