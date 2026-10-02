# Working with Strings in JavaScript

## What are Strings?

Strings are one of the most fundamental data types in JavaScript. A **string** is a sequence of characters used to represent text. Characters can include letters, numbers, symbols, spaces, and special characters.

### Why Strings Matter in Test Automation

In test automation, strings are everywhere:
- **Element selectors**: `"#login-button"`, `"[data-testid='submit']"`
- **Assertion messages**: `"Expected 'Welcome' but got 'Error'"`
- **Test data**: Usernames, emails, URLs, file paths
- **Log parsing**: Extracting error codes, timestamps, status messages
- **API responses**: Parsing JSON text, validating response bodies

Understanding string manipulation is essential for writing robust, maintainable tests.

---

## Understanding String Immutability

One of the most important concepts to understand is that **strings in JavaScript are immutable**. This means once a string is created, it cannot be changed. Any operation that appears to modify a string actually creates a brand new string.

```javascript
let greeting = "Hello";
greeting.toUpperCase();  // Returns "HELLO" but doesn't change greeting
console.log(greeting);   // Still "Hello" - original unchanged!

// To get the uppercase version, you must assign it to a variable
let upperGreeting = greeting.toUpperCase();
console.log(upperGreeting); // "HELLO"
```

**Why does this matter?**
- String methods always return new strings
- The original string is never modified
- You must capture the return value to use the result

```javascript
// Common mistake
let text = "  hello  ";
text.trim();           // This does nothing useful!
console.log(text);     // Still "  hello  "

// Correct approach
text = text.trim();    // Reassign the result
console.log(text);     // "hello"
```

---

## 1. Creating Strings

JavaScript provides three ways to create strings, each with different capabilities.

### String Literals - Three Ways

```javascript
// Method 1: Single Quotes
let singleQuotes = 'Hello World';

// Method 2: Double Quotes
let doubleQuotes = "Hello World";

// Method 3: Backticks (Template Literals)
let backticks = `Hello World`;

// All three produce the same result
console.log(singleQuotes); // "Hello World"
console.log(doubleQuotes); // "Hello World"
console.log(backticks);    // "Hello World"
```

### When to Use Which?

| Quote Type | Best For | Special Feature |
|------------|----------|-----------------|
| Single `'...'` | Simple strings, JSON-like syntax | None |
| Double `"..."` | Strings containing apostrophes | None |
| Backticks `` `...` `` | Dynamic content, multi-line | String interpolation |

```javascript
// Use single quotes when string contains double quotes
let html = '<button class="primary">Click</button>';

// Use double quotes when string contains apostrophes
let message = "It's a beautiful day";

// Use backticks for dynamic content
let name = "Alice";
let greeting = `Hello, ${name}!`;  // "Hello, Alice!"
```

### Template Literals - The Modern Approach

Template literals (backticks) are the most powerful way to work with strings in modern JavaScript.

**Feature 1: String Interpolation (Embedding Variables)**
```javascript
let userName = "John";
let userAge = 25;
let userCity = "New York";

// Old way - concatenation (hard to read)
let intro1 = "My name is " + userName + ", I am " + userAge + " years old, from " + userCity + ".";

// New way - template literals (clean and readable)
let intro2 = `My name is ${userName}, I am ${userAge} years old, from ${userCity}.`;

console.log(intro2); // "My name is John, I am 25 years old, from New York."
```

**Feature 2: Expressions Inside Strings**
```javascript
let price = 19.99;
let quantity = 3;

// You can put any JavaScript expression inside ${}
let total = `Total: $${price * quantity}`;
console.log(total); // "Total: $59.97"

// Even function calls work
let name = "alice";
let formatted = `Welcome, ${name.toUpperCase()}!`;
console.log(formatted); // "Welcome, ALICE!"
```

**Feature 3: Multi-line Strings**
```javascript
// Old way - requires escape characters
let oldPoem = "Roses are red,\nViolets are blue,\nJavaScript is great,\nAnd so are you!";

// New way - just press Enter
let newPoem = `Roses are red,
Violets are blue,
JavaScript is great,
And so are you!`;

// Both produce the same multi-line output
```

---

## 2. String Properties

### The length Property

The `length` property tells you how many characters are in a string. This is crucial for validation and looping.

```javascript
let text = "Hello World";
console.log(text.length); // 11

// Spaces count as characters!
let spaced = "Hi There";
console.log(spaced.length); // 8 (including the space)

// Empty string has length 0
let empty = "";
console.log(empty.length); // 0

// Special characters count as one character each
let special = "Hello!\n";
console.log(special.length); // 7 (! counts, \n counts as 1)
```

**Practical Use: Validation**
```javascript
function validatePassword(password) {
    if (password.length < 8) {
        return "Password must be at least 8 characters";
    }
    if (password.length > 50) {
        return "Password must not exceed 50 characters";
    }
    return "Password length is valid";
}

console.log(validatePassword("abc"));        // Too short
console.log(validatePassword("securePass1")); // Valid
```

---

## 3. Accessing Characters

Strings are like arrays of characters. Each character has a position called an **index**, starting from 0.

### Understanding String Indices

```
String:  H  e  l  l  o     W  o  r  l  d
Index:   0  1  2  3  4  5  6  7  8  9  10
```

**Important**: Indexing starts at 0, not 1!

### Bracket Notation

The most common way to access characters:

```javascript
let text = "JavaScript";

console.log(text[0]);  // "J" - first character
console.log(text[1]);  // "a" - second character
console.log(text[4]);  // "S" - fifth character (index 4)

// Accessing the last character
console.log(text[text.length - 1]); // "t"

// What happens with invalid indices?
console.log(text[100]); // undefined (out of bounds)
console.log(text[-1]);  // undefined (no negative indexing like Python)
```

### charAt() Method

An alternative to bracket notation:

```javascript
let text = "JavaScript";

console.log(text.charAt(0));   // "J"
console.log(text.charAt(4));   // "S"
console.log(text.charAt(100)); // "" (empty string, not undefined)
```

**Difference between bracket notation and charAt():**
- `text[100]` returns `undefined`
- `text.charAt(100)` returns `""` (empty string)

### charCodeAt() - Getting Character Codes

Every character has a numeric code (Unicode/ASCII). This is useful for character comparisons and encoding.

```javascript
let text = "ABC abc";

console.log(text.charCodeAt(0)); // 65 (code for 'A')
console.log(text.charCodeAt(1)); // 66 (code for 'B')
console.log(text.charCodeAt(4)); // 97 (code for 'a')

// Useful for checking if character is uppercase
function isUpperCase(char) {
    let code = char.charCodeAt(0);
    return code >= 65 && code <= 90; // A-Z are 65-90
}

console.log(isUpperCase("A")); // true
console.log(isUpperCase("a")); // false
```

---

## 4. Searching in Strings

Finding text within strings is one of the most common operations.

### indexOf() - Find First Position

Returns the **index** (position) where the substring first appears, or **-1** if not found.

```javascript
let text = "Hello World, Hello Universe";
//          0123456789...

console.log(text.indexOf("Hello"));     // 0 (starts at beginning)
console.log(text.indexOf("World"));     // 6 (starts at index 6)
console.log(text.indexOf("Universe"));  // 20
console.log(text.indexOf("Mars"));      // -1 (not found!)

// Case-sensitive!
console.log(text.indexOf("hello"));     // -1 (lowercase not found)
console.log(text.indexOf("HELLO"));     // -1 (uppercase not found)
```

**Starting Search from a Position:**
```javascript
let text = "Hello World, Hello Universe";

// Find first "Hello" - starts at 0
console.log(text.indexOf("Hello"));      // 0

// Find "Hello" starting from index 5
console.log(text.indexOf("Hello", 5));   // 13 (finds the second one)

// Find "Hello" starting from index 15
console.log(text.indexOf("Hello", 15));  // -1 (no more after that)
```

### lastIndexOf() - Find Last Position

Searches from the end of the string:

```javascript
let text = "Hello World, Hello Universe";

console.log(text.lastIndexOf("Hello")); // 13 (last occurrence)
console.log(text.lastIndexOf("o"));     // 22 (last 'o' in Universe)
console.log(text.indexOf("o"));         // 4 (first 'o' in Hello)
```

### includes() - Check if Exists (Boolean)

Returns `true` or `false` - simpler when you just need to know if something exists.

```javascript
let text = "The quick brown fox jumps over the lazy dog";

console.log(text.includes("quick"));  // true
console.log(text.includes("slow"));   // false

// Case-sensitive
console.log(text.includes("Quick")); // false
console.log(text.includes("quick")); // true

// With starting position
console.log(text.includes("The", 0));  // true (check from start)
console.log(text.includes("The", 5));  // false (not found after index 5)
```

**When to use indexOf() vs includes():**
```javascript
let email = "user@example.com";

// Use includes() for simple existence check
if (email.includes("@")) {
    console.log("Contains @ symbol");
}

// Use indexOf() when you need the position
let atPosition = email.indexOf("@");
let domain = email.slice(atPosition + 1);
console.log(domain); // "example.com"
```

### startsWith() and endsWith()

Check if a string begins or ends with specific text:

```javascript
let url = "https://www.example.com/api/users";
let filename = "report_2024.pdf";

// startsWith()
console.log(url.startsWith("https"));    // true
console.log(url.startsWith("http://"));  // false
console.log(url.startsWith("https://www", 0)); // true

// endsWith()
console.log(filename.endsWith(".pdf"));  // true
console.log(filename.endsWith(".doc"));  // false
console.log(url.endsWith("/users"));     // true
```

**Practical Examples:**
```javascript
// Validate URL protocol
function isSecureUrl(url) {
    return url.startsWith("https://");
}

// Check file type
function isImageFile(filename) {
    return filename.endsWith(".jpg") ||
           filename.endsWith(".png") ||
           filename.endsWith(".gif");
}

// Check for JavaScript/TypeScript files
function isCodeFile(filename) {
    return filename.endsWith(".js") || filename.endsWith(".ts");
}
```

---

## 5. Extracting Substrings

Getting a portion of a string is called "slicing" or "extracting a substring."

### slice(start, end) - The Most Common Method

Extracts from `start` index up to (but NOT including) `end` index.

```javascript
let text = "Hello World";
//          01234567890

console.log(text.slice(0, 5));   // "Hello" (index 0 to 4)
console.log(text.slice(6, 11));  // "World" (index 6 to 10)
console.log(text.slice(6));      // "World" (index 6 to end)
console.log(text.slice(0, 1));   // "H" (just first character)
```

**Using Negative Indices:**
Negative numbers count from the end of the string.

```javascript
let text = "Hello World";
//                -5-4-3-2-1

console.log(text.slice(-5));      // "World" (last 5 characters)
console.log(text.slice(-5, -1));  // "Worl" (from -5 to -2, excluding -1)
console.log(text.slice(-1));      // "d" (last character)
```

**Visual Guide:**
```
String:  H  e  l  l  o     W  o  r  l  d
Index:   0  1  2  3  4  5  6  7  8  9  10
Negative:                 -5 -4 -3 -2 -1
```

### substring(start, end)

Similar to slice, but with key differences:

```javascript
let text = "Hello World";

console.log(text.substring(0, 5)); // "Hello"
console.log(text.substring(6));    // "World"

// Difference 1: No negative indices
console.log(text.substring(-5));   // "Hello World" (treats -5 as 0)

// Difference 2: Swaps if start > end
console.log(text.substring(5, 0)); // "Hello" (swapped to 0, 5)
console.log(text.slice(5, 0));     // "" (empty - no swapping)
```

**When to use slice() vs substring():**
- **slice()**: Use this most of the time. Supports negative indices.
- **substring()**: Use when you might have start > end and want auto-swap.

---

## 6. Transforming Strings

### Case Conversion

```javascript
let text = "Hello World";

// Convert to uppercase
console.log(text.toUpperCase()); // "HELLO WORLD"

// Convert to lowercase
console.log(text.toLowerCase()); // "hello world"

// Remember: original is unchanged!
console.log(text); // "Hello World"
```

**Practical Use: Case-Insensitive Comparison**
```javascript
function compareIgnoreCase(str1, str2) {
    return str1.toLowerCase() === str2.toLowerCase();
}

console.log(compareIgnoreCase("Hello", "hello")); // true
console.log(compareIgnoreCase("HELLO", "hello")); // true
console.log(compareIgnoreCase("Hello", "World")); // false
```

### Trimming Whitespace

Removes unwanted spaces from strings - essential for processing user input.

```javascript
let userInput = "   Hello World   ";

// trim() - removes from both ends
console.log(userInput.trim());      // "Hello World"

// trimStart() - removes from beginning only
console.log(userInput.trimStart()); // "Hello World   "

// trimEnd() - removes from end only
console.log(userInput.trimEnd());   // "   Hello World"
```

**Important**: trim() removes ALL whitespace characters:
- Spaces
- Tabs (`\t`)
- Newlines (`\n`)
- Carriage returns (`\r`)

```javascript
let messyInput = "\n\t  Hello World  \n\t";
console.log(messyInput.trim()); // "Hello World"
```

### Replace - Single Occurrence

```javascript
let text = "Hello World, Hello Universe";

// Replace first occurrence only
let newText = text.replace("Hello", "Hi");
console.log(newText); // "Hi World, Hello Universe"
// Note: Only the first "Hello" was replaced!

// Original unchanged
console.log(text); // "Hello World, Hello Universe"
```

### replaceAll() - All Occurrences

```javascript
let text = "Hello World, Hello Universe, Hello Galaxy";

// Replace ALL occurrences
let newText = text.replaceAll("Hello", "Hi");
console.log(newText); // "Hi World, Hi Universe, Hi Galaxy"

// Useful for sanitization
let dirty = "apple--banana--cherry";
let clean = dirty.replaceAll("--", "-");
console.log(clean); // "apple-banana-cherry"
```

### Padding Strings

Add characters to reach a desired length:

```javascript
// padStart - add to beginning
let num = "5";
console.log(num.padStart(3, "0")); // "005"
console.log(num.padStart(5, "0")); // "00005"

// padEnd - add to end
console.log(num.padEnd(3, "0"));   // "500"

// Useful for formatting
let id = "42";
let formattedId = id.padStart(6, "0");
console.log(formattedId); // "000042"

// Can use any padding character
let text = "Hi";
console.log(text.padStart(6, "-")); // "----Hi"
console.log(text.padEnd(6, "."));   // "Hi...."
```

### Repeating Strings

```javascript
let star = "*";
console.log(star.repeat(5));  // "*****"

let dash = "-";
console.log(dash.repeat(20)); // "--------------------"

// Practical: Create a separator line
function createSeparator(length) {
    return "=".repeat(length);
}
console.log(createSeparator(30));
// "=============================="
```

---

## 7. Splitting and Joining

Converting between strings and arrays is extremely common.

### split() - String to Array

Breaks a string into an array based on a separator:

```javascript
// Split by comma
let csv = "apple,banana,cherry";
let fruits = csv.split(",");
console.log(fruits); // ["apple", "banana", "cherry"]

// Split by space
let sentence = "The quick brown fox";
let words = sentence.split(" ");
console.log(words); // ["The", "quick", "brown", "fox"]

// Split into individual characters
let word = "Hello";
let chars = word.split("");
console.log(chars); // ["H", "e", "l", "l", "o"]

// Split by newline
let multiline = "Line 1\nLine 2\nLine 3";
let lines = multiline.split("\n");
console.log(lines); // ["Line 1", "Line 2", "Line 3"]
```

**Limiting the Split:**
```javascript
let data = "a,b,c,d,e,f";

// Only split into 3 parts
let limited = data.split(",", 3);
console.log(limited); // ["a", "b", "c"]
```

### join() - Array to String

Combines array elements into a string:

```javascript
let fruits = ["apple", "banana", "cherry"];

console.log(fruits.join(", ")); // "apple, banana, cherry"
console.log(fruits.join("-"));  // "apple-banana-cherry"
console.log(fruits.join(" | ")); // "apple | banana | cherry"
console.log(fruits.join(""));   // "applebananacherry" (no separator)
```

### Common Pattern: Split, Process, Join

```javascript
// Capitalize each word
let sentence = "hello world from javascript";

let result = sentence
    .split(" ")                                    // ["hello", "world", "from", "javascript"]
    .map(word => word[0].toUpperCase() + word.slice(1)) // ["Hello", "World", "From", "Javascript"]
    .join(" ");                                    // "Hello World From Javascript"

console.log(result);
```

---

## 8. String Concatenation

Joining strings together can be done multiple ways:

### Method 1: Plus Operator (+)
```javascript
let firstName = "John";
let lastName = "Doe";

let fullName = firstName + " " + lastName;
console.log(fullName); // "John Doe"
```

### Method 2: concat() Method
```javascript
let str1 = "Hello";
let str2 = "World";

let result = str1.concat(" ", str2, "!");
console.log(result); // "Hello World!"
```

### Method 3: Template Literals (Recommended)
```javascript
let firstName = "John";
let lastName = "Doe";

let fullName = `${firstName} ${lastName}`;
console.log(fullName); // "John Doe"
```

**Why Template Literals are Best:**
- More readable
- Easier to maintain
- Support expressions
- Handle multi-line naturally

---

## 9. Escape Characters

Some characters have special meaning and need escaping with a backslash (`\`):

| Escape | Character | Description |
|--------|-----------|-------------|
| `\n` | Newline | Moves to next line |
| `\t` | Tab | Horizontal tab space |
| `\\` | Backslash | Literal backslash |
| `\'` | Single quote | Use in single-quoted strings |
| `\"` | Double quote | Use in double-quoted strings |
| `\r` | Carriage return | Returns to start of line |

```javascript
// Newline
console.log("Line 1\nLine 2");
// Line 1
// Line 2

// Tab
console.log("Name:\tJohn");
// Name:    John

// Backslash (common in Windows paths)
console.log("C:\\Users\\Documents");
// C:\Users\Documents

// Quotes
console.log('It\'s working');  // It's working
console.log("He said \"Hi\""); // He said "Hi"
```

---

## 10. String Comparison

### Equality Comparison
```javascript
// Strict equality (recommended)
console.log("hello" === "hello"); // true
console.log("Hello" === "hello"); // false (case-sensitive!)
console.log("hello" === "hello "); // false (space matters!)

// Never use == for strings (type coercion issues)
console.log("5" == 5);   // true (problematic!)
console.log("5" === 5);  // false (correct behavior)
```

### Alphabetical Comparison
```javascript
// Strings are compared character by character
console.log("apple" < "banana");  // true (a comes before b)
console.log("Apple" < "apple");   // true (uppercase before lowercase)
console.log("abc" < "abd");       // true (c comes before d)
```

### localeCompare() - Proper String Sorting
```javascript
let str1 = "apple";
let str2 = "banana";

// Returns: -1 (str1 before str2), 0 (equal), or 1 (str1 after str2)
console.log(str1.localeCompare(str2)); // -1

// Case-insensitive comparison
console.log("Apple".localeCompare("apple", undefined, { sensitivity: 'base' })); // 0
```

---

## 11. Practical Patterns for Test Automation

### Validate Non-Empty String
```javascript
function isNotEmpty(str) {
    return str !== null && str !== undefined && str.trim() !== "";
}

console.log(isNotEmpty("Hello"));  // true
console.log(isNotEmpty("   "));    // false (only whitespace)
console.log(isNotEmpty(""));       // false
console.log(isNotEmpty(null));     // false
```

### Capitalize First Letter
```javascript
function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

console.log(capitalize("hello")); // "Hello"
console.log(capitalize("WORLD")); // "World"
console.log(capitalize("jOHN"));  // "John"
```

### Title Case (Capitalize Each Word)
```javascript
function titleCase(str) {
    return str
        .toLowerCase()
        .split(" ")
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

console.log(titleCase("hello world"));           // "Hello World"
console.log(titleCase("THE QUICK BROWN FOX"));   // "The Quick Brown Fox"
```

### Reverse a String
```javascript
function reverseString(str) {
    return str.split("").reverse().join("");
}

console.log(reverseString("Hello"));     // "olleH"
console.log(reverseString("JavaScript")); // "tpircSavaJ"
```

### Truncate with Ellipsis
```javascript
function truncate(str, maxLength) {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength - 3) + "...";
}

console.log(truncate("Hello World", 8));  // "Hello..."
console.log(truncate("Hi", 10));          // "Hi" (no truncation needed)
console.log(truncate("This is a very long sentence", 15)); // "This is a ve..."
```

### Normalize Text for Comparison
```javascript
function normalizeText(str) {
    return str
        .toLowerCase()
        .trim()
        .replace(/\s+/g, " ");  // Multiple spaces to single space
}

let text1 = "  Hello   World  ";
let text2 = "hello world";

console.log(normalizeText(text1) === normalizeText(text2)); // true
```

### Build Dynamic CSS Selector
```javascript
function buildSelector(type, value) {
    return `[data-${type}="${value}"]`;
}

console.log(buildSelector("testid", "submit-btn"));
// '[data-testid="submit-btn"]'

console.log(buildSelector("cy", "login-form"));
// '[data-cy="login-form"]'
```

### Extract Domain from Email
```javascript
function extractDomain(email) {
    const atIndex = email.indexOf("@");
    if (atIndex === -1) return null;
    return email.slice(atIndex + 1);
}

console.log(extractDomain("user@example.com"));   // "example.com"
console.log(extractDomain("admin@company.org")); // "company.org"
```

---

## Summary

### Key Concepts Covered

1. **String Creation**: Single quotes, double quotes, and template literals (backticks)
2. **Immutability**: Strings cannot be changed; methods return new strings
3. **Properties**: `length` gives the character count
4. **Accessing Characters**: Use `[index]` or `charAt(index)`, starting from 0
5. **Searching**: `indexOf()`, `lastIndexOf()`, `includes()`, `startsWith()`, `endsWith()`
6. **Extracting**: `slice(start, end)` and `substring(start, end)`
7. **Transforming**: `toUpperCase()`, `toLowerCase()`, `trim()`, `replace()`, `replaceAll()`
8. **Padding**: `padStart()`, `padEnd()` for formatting
9. **Split/Join**: Convert between strings and arrays
10. **Escape Characters**: `\n`, `\t`, `\\`, `\'`, `\"`

### Quick Reference Table

| Method | Purpose | Returns |
|--------|---------|---------|
| `length` | Get character count | Number |
| `charAt(i)` | Get character at index | String |
| `indexOf(str)` | Find first position | Number (-1 if not found) |
| `includes(str)` | Check if contains | Boolean |
| `startsWith(str)` | Check beginning | Boolean |
| `endsWith(str)` | Check ending | Boolean |
| `slice(start, end)` | Extract portion | String |
| `toUpperCase()` | Convert to uppercase | String |
| `toLowerCase()` | Convert to lowercase | String |
| `trim()` | Remove whitespace | String |
| `replace(old, new)` | Replace first match | String |
| `replaceAll(old, new)` | Replace all matches | String |
| `split(separator)` | String to array | Array |
| `padStart(len, char)` | Pad beginning | String |
| `repeat(count)` | Repeat string | String |

---

**Next Topic**: Regular Expressions - Learn powerful pattern matching for advanced string operations.
