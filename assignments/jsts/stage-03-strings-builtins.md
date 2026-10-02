# Stage 3 — Strings Using Built-in Methods

---

## Q23. Write a program to find the length of a given string

```js
const str = "JavaScript";
console.log("String:", str);
console.log("Length:", str.length);       // .length gives total character count
console.log("First character:", str[0]);   // index starts at 0
console.log("Last character:", str[str.length - 1]); // last index = length - 1
console.log("Character at index 4:", str[4]);
```

**Output:**
```
String: JavaScript
Length: 10
First character: J
Last character: t
Character at index 4: S
```

---

## Q24. Write a program to convert a string to upper case and lower case

```js
const str = "Hello World from JavaScript";
console.log("Original:  ", str);
console.log("Uppercase: ", str.toUpperCase()); // converts every letter to uppercase
console.log("Lowercase: ", str.toLowerCase()); // converts every letter to lowercase

// Practical use — case-insensitive comparison
// "HELLO" and "hello" are different strings, but same when both lowercased
const input    = "HELLO";
const expected = "hello";
console.log("Direct match:", input === expected);                   // false
console.log("Ignore case: ", input.toLowerCase() === expected);    // true
```

**Output:**
```
Original:   Hello World from JavaScript
Uppercase:  HELLO WORLD FROM JAVASCRIPT
Lowercase:  hello world from javascript
Direct match: false
Ignore case:  true
```

---

## Q25. Write a program to check if a string starts with, ends with and includes a given substring

```js
const str = "Hello beautiful World";

// startsWith checks the beginning of the string
console.log('Starts with "Hello"    :', str.startsWith("Hello"));   // true

// endsWith checks the end of the string
console.log('Ends with "World"      :', str.endsWith("World"));     // true

// includes checks anywhere in the string
console.log('Includes "beautiful"   :', str.includes("beautiful")); // true

// All three are case-sensitive
console.log('Starts with "hello"    :', str.startsWith("hello"));   // false — different case

// To do case-insensitive check, convert both to same case first
console.log('Case insensitive check :', str.toLowerCase().includes("hello")); // true
```

**Output:**
```
Starts with "Hello"    : true
Ends with "World"      : true
Includes "beautiful"   : true
Starts with "hello"    : false
Case insensitive check : true
```

---

## Q26. Write a program to replace the first occurrence and all occurrences of a word in a string

```js
const str = "I have a cat. The cat sat on the mat.";
console.log("Original:      ", str);

// replace() replaces only the FIRST match
console.log("Replace first: ", str.replace("cat", "dog"));

// replaceAll() replaces ALL matches
console.log("Replace all:   ", str.replaceAll("cat", "dog"));

// Using regex with 'g' flag also replaces all — /pattern/g means global
// [aeiou] is a character class matching any vowel
console.log("Replace vowels:", str.replace(/[aeiou]/g, "*"));
```

**Output:**
```
Original:       I have a cat. The cat sat on the mat.
Replace first:  I have a dog. The cat sat on the mat.
Replace all:    I have a dog. The dog sat on the mat.
Replace vowels: * h*v* * c*t. Th* c*t s*t *n th* m*t.
```

---

## Q27. Write a program to trim whitespace and pad a string

```js
const str = "   Hello   ";
console.log("Original:    |" + str + "|");
console.log("trim():      |" + str.trim() + "|");       // removes both ends
console.log("trimStart(): |" + str.trimStart() + "|");  // removes left side only
console.log("trimEnd():   |" + str.trimEnd() + "|");    // removes right side only

// padStart(targetLength, padChar) — pads on the LEFT side
// Used to format numbers like: 1 → "001", 42 → "042"
const id = "42";
console.log("padStart(8,'0'):", id.padStart(8, "0")); // "00000042"

// padEnd(targetLength, padChar) — pads on the RIGHT side
console.log("padEnd(8,'-'):  ", id.padEnd(8, "-"));   // "42------"

// Practical: format test IDs as 001, 002, 003...
for (let i = 1; i <= 5; i++) {
    console.log(String(i).padStart(3, "0"));
}
```

**Output:**
```
Original:    |   Hello   |
trim():      |Hello|
trimStart(): |Hello   |
trimEnd():   |   Hello|
padStart(8,'0'): 00000042
padEnd(8,'-'):   42------
001
002
003
004
005
```

---

## Q28. Write a program to split a string into an array and join it back with a different separator

```js
const str = "apple,banana,mango,orange";

// split(delimiter) breaks the string at every delimiter and returns an array
const fruits = str.split(",");
console.log("Original:       ", str);
console.log("After split:    ", fruits);

// join(separator) combines all array elements into one string with separator between them
console.log("Join with ' | ':", fruits.join(" | "));

// split with limit — only splits up to limit times
console.log("Split limit 2:  ", str.split(",", 2));

// split("") — splits into individual characters
console.log("Split to chars: ", "hello".split(""));
```

**Output:**
```
Original:        apple,banana,mango,orange
After split:     ["apple", "banana", "mango", "orange"]
Join with ' | ': apple | banana | mango | orange
Split limit 2:   ["apple", "banana"]
Split to chars:  ["h", "e", "l", "l", "o"]
```

---

## Q29. Write a program to extract a substring using slice and substring and show the difference with negative index

```js
const str = "Hello World";

// slice(start, end) — end index is NOT included
console.log("slice(6, 11):     ", str.slice(6, 11));     // "World"

// substring(start, end) — also end index is NOT included
console.log("substring(6, 11): ", str.substring(6, 11)); // "World"

// KEY DIFFERENCE: negative indexes
// slice(-5) counts 5 characters from the END → last 5 chars
console.log("slice(-5):        ", str.slice(-5));         // "World"

// substring(-5) treats negative as 0 → same as substring(0) → whole string
console.log("substring(-5):    ", str.substring(-5));     // "Hello World"

console.log("slice(0, 5):      ", str.slice(0, 5));       // "Hello"
```

**Output:**
```
slice(6, 11):      World
substring(6, 11):  World
slice(-5):         World
substring(-5):     Hello World
slice(0, 5):       Hello
```

---

## Q30. Write a program to count the number of words in a sentence

```js
function countWords(sentence) {
    const trimmed = sentence.trim(); // remove leading/trailing spaces first
    if (trimmed === "") return 0;    // empty or spaces-only string has 0 words

    // \s+ is a regex that matches one or more whitespace characters
    // Splitting by \s+ handles multiple spaces between words correctly
    return trimmed.split(/\s+/).length;
}

console.log(countWords("Hello World"));          // 2
console.log(countWords("  Hello   World  "));    // 2 — extra spaces handled
console.log(countWords("The quick brown fox"));  // 4
console.log(countWords(""));                     // 0
console.log(countWords("OneWord"));              // 1
```

**Output:**
```
2
2
4
0
1
```

---

## Q31. Write a program to count how many times each character appears in a string

```js
function charFrequency(str) {
    const count = {};

    // Loop through each character and count occurrences
    for (const char of str) {
        if (char !== " ") { // ignore spaces
            // If char not seen before, set to 0 first, then add 1
            count[char] = (count[char] || 0) + 1;
        }
    }

    // Sort entries by frequency (highest first) and print
    const sorted = Object.entries(count).sort((a, b) => b[1] - a[1]);
    for (const [char, freq] of sorted) {
        console.log(char + " → " + freq);
    }
}

charFrequency("javascript");
```

**Output:**
```
a → 2
j → 1
v → 1
s → 1
c → 1
r → 1
i → 1
p → 1
t → 1
```

---

## Q32. Write a program to validate an email address using a regular expression

```js
function isValidEmail(email) {
    // Regex breakdown:
    // ^                 → start of string
    // [a-zA-Z0-9._%+-]+ → one or more valid characters before @
    // @                 → literal @ symbol
    // [a-zA-Z0-9.-]+   → domain name (letters, digits, dots, hyphens)
    // \.                → literal dot (escaped with \)
    // [a-zA-Z]{2,}     → top-level domain like .com, .org (2+ letters)
    // $                 → end of string
    const pattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return pattern.test(email); // test() returns true if pattern matches
}

const emails = [
    "user@example.com",
    "user.name@domain.org",
    "invalid-email",       // no @
    "@domain.com",         // no local part
    "user@domain",         // no TLD
];

for (const email of emails) {
    console.log(email + " → " + (isValidEmail(email) ? "Valid" : "Invalid"));
}
```

**Output:**
```
user@example.com     → Valid
user.name@domain.org → Valid
invalid-email        → Invalid
@domain.com          → Invalid
user@domain          → Invalid
```

---

## Q33. Write a program to extract all numbers from a string using a regular expression

```js
function extractNumbers(str) {
    // \d+ matches one or more digits
    // The 'g' flag means find ALL matches, not just the first
    const matches = str.match(/\d+/g);
    if (!matches) return [];
    return matches.map(Number); // convert string digits to actual numbers
}

console.log(extractNumbers("abc123def456ghi789"));   // [123, 456, 789]
console.log(extractNumbers("I have 2 cats and 3 dogs")); // [2, 3]
console.log(extractNumbers("Version 2.0 released"));     // [2, 0]
console.log(extractNumbers("no numbers here"));           // []
```

**Output:**
```
[123, 456, 789]
[2, 3]
[2, 0]
[]
```
