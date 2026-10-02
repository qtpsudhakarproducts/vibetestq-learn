# Regular Expressions in JavaScript

## What are Regular Expressions?

Regular expressions (often called "regex" or "regexp") are patterns used to match character combinations in strings. Think of them as a powerful search-and-replace tool that can find patterns rather than just exact text.

### Why Regular Expressions Matter

Without regex, simple tasks become complex:
- How do you check if a string is a valid email?
- How do you find all phone numbers in a document?
- How do you replace all dates in one format with another?

Regular expressions solve these problems elegantly.

### Real-World Examples in Test Automation

```javascript
// Validate an email address
/^[\w.-]+@[\w.-]+\.\w{2,}$/.test("user@example.com");  // true

// Extract all numbers from a string
"Order #12345 costs $99.99".match(/\d+/g);  // ["12345", "99", "99"]

// Check if a test ID matches expected format
/^TC-\d{3}$/.test("TC-001");  // true
```

---

## 1. Creating Regular Expressions

There are two ways to create a regex in JavaScript:

### Method 1: Literal Notation (Most Common)

Use forward slashes to wrap the pattern:

```javascript
let pattern = /hello/;
let patternWithFlags = /hello/i;  // 'i' flag for case-insensitive
```

**When to use**: When the pattern is known ahead of time (most cases).

### Method 2: Constructor Notation

Use the `RegExp` constructor:

```javascript
let pattern = new RegExp("hello");
let patternWithFlags = new RegExp("hello", "i");
```

**When to use**: When the pattern is dynamic (built from variables).

```javascript
// Dynamic pattern from user input
let searchTerm = "world";
let dynamicPattern = new RegExp(searchTerm, "gi");

// This allows patterns to be constructed at runtime
let userSearch = getUserInput();  // e.g., "error"
let logPattern = new RegExp(userSearch, "gi");
```

**Important Note**: In constructor notation, backslashes must be escaped:
```javascript
// Literal: /\d+/
// Constructor: new RegExp("\\d+")  // double backslash!
```

---

## 2. Understanding Regex Flags

Flags modify how the pattern matching behaves. They come after the closing slash.

| Flag | Name | Description |
|------|------|-------------|
| `g` | Global | Find ALL matches, not just the first one |
| `i` | Case-Insensitive | Match regardless of uppercase/lowercase |
| `m` | Multiline | `^` and `$` match line beginnings/endings |
| `s` | Dotall | `.` matches newline characters too |
| `u` | Unicode | Enables full Unicode support |

### The `g` (Global) Flag

Without `g`: stops at first match. With `g`: finds all matches.

```javascript
let text = "cat bat rat";

// Without global flag - only first match
console.log(text.match(/at/));   // ["at"] (just the first one)

// With global flag - all matches
console.log(text.match(/at/g));  // ["at", "at", "at"] (all three)
```

### The `i` (Case-Insensitive) Flag

```javascript
let text = "Hello HELLO hello";

// Without 'i' flag - case-sensitive
console.log(text.match(/hello/g));  // ["hello"] (only lowercase)

// With 'i' flag - case-insensitive
console.log(text.match(/hello/gi)); // ["Hello", "HELLO", "hello"] (all of them)
```

### Combining Flags

You can use multiple flags together:

```javascript
let text = "Apple apple APPLE";

// Both global and case-insensitive
console.log(text.match(/apple/gi)); // ["Apple", "apple", "APPLE"]
```

---

## 3. Testing and Matching Methods

JavaScript provides several methods to work with regular expressions:

### test() - Returns true/false

The simplest method. Checks if the pattern exists in the string.

```javascript
let pattern = /hello/i;

console.log(pattern.test("Hello World"));  // true
console.log(pattern.test("Hi there"));     // false
console.log(pattern.test("Say hello"));    // true
```

**Use test() when**: You only need to know YES or NO.

### match() - Returns Matches

Called on a string, returns the matches found.

```javascript
let text = "The rain in Spain falls mainly in the plain";

// Without global flag: detailed info about first match
let firstMatch = text.match(/ain/);
console.log(firstMatch[0]);     // "ain"
console.log(firstMatch.index);  // 5 (position where found)

// With global flag: array of all matches
let allMatches = text.match(/ain/g);
console.log(allMatches);  // ["ain", "ain", "ain", "ain"]
```

### search() - Returns First Match Index

Returns the index of the first match, or -1 if not found.

```javascript
let text = "Hello World";

console.log(text.search(/World/));  // 6
console.log(text.search(/Mars/));   // -1 (not found)
console.log(text.search(/o/));      // 4 (first 'o')
```

### replace() - Replace Matches

Replaces matched text with new text.

```javascript
let text = "Hello World";

// Replace first match
console.log(text.replace(/o/, "0"));    // "Hell0 World"

// Replace all matches (with global flag)
console.log(text.replace(/o/g, "0"));   // "Hell0 W0rld"
```

### exec() - Detailed Match Info (Advanced)

Returns detailed information about each match, useful for iteration.

```javascript
let pattern = /\d+/g;
let text = "Order 123 and Order 456";
let match;

while ((match = pattern.exec(text)) !== null) {
    console.log(`Found "${match[0]}" at position ${match.index}`);
}
// Found "123" at position 6
// Found "456" at position 22
```

---

## 4. Character Classes - Matching Types of Characters

Character classes let you match categories of characters.

### Basic Character Classes

Square brackets `[]` define a set of characters to match:

```javascript
// [abc] - matches 'a' OR 'b' OR 'c'
console.log(/[abc]/.test("apple"));   // true (has 'a')
console.log(/[abc]/.test("dog"));     // false (no a, b, or c)

// [aeiou] - matches any vowel
console.log("hello".match(/[aeiou]/g));  // ["e", "o"]
```

### Range Classes

Use a hyphen for ranges:

```javascript
// [a-z] - any lowercase letter
console.log(/[a-z]/.test("Hello"));  // true

// [A-Z] - any uppercase letter
console.log(/[A-Z]/.test("hello"));  // false

// [0-9] - any digit
console.log(/[0-9]/.test("abc123")); // true

// [a-zA-Z] - any letter (upper or lower)
console.log(/[a-zA-Z]/.test("123")); // false

// [a-zA-Z0-9] - any alphanumeric character
console.log(/[a-zA-Z0-9]/.test("!@#")); // false
```

### Negated Character Classes

Use `^` inside brackets to match anything EXCEPT:

```javascript
// [^abc] - matches any character EXCEPT a, b, or c
console.log(/[^abc]/.test("xyz"));   // true
console.log(/[^abc]/.test("abc"));   // false

// [^0-9] - matches any non-digit
console.log(/[^0-9]/.test("abc"));   // true
console.log(/[^0-9]/.test("123"));   // false
```

---

## 5. Predefined Character Classes (Shortcuts)

JavaScript provides shortcuts for common character classes:

| Shortcut | Meaning | Equivalent |
|----------|---------|------------|
| `\d` | Any digit | `[0-9]` |
| `\D` | Any NON-digit | `[^0-9]` |
| `\w` | Word character | `[a-zA-Z0-9_]` |
| `\W` | NON-word character | `[^a-zA-Z0-9_]` |
| `\s` | Whitespace | `[ \t\n\r\f]` |
| `\S` | NON-whitespace | `[^ \t\n\r\f]` |
| `.` | Any character (except newline) | Almost everything |

### Examples with Shortcuts

```javascript
let text = "Phone: 123-456-7890";

// \d - find digits
console.log(text.match(/\d/g));   // ["1","2","3","4","5","6","7","8","9","0"]
console.log(text.match(/\d+/g));  // ["123", "456", "7890"] (+ means "one or more")

// \w - find word characters
console.log(text.match(/\w+/g));  // ["Phone", "123", "456", "7890"]

// \s - find whitespace
console.log(text.match(/\s/g));   // [" "]

// \D - find non-digits
console.log(text.match(/\D+/g));  // ["Phone: ", "-", "-"]
```

### The Dot (.) - Match Almost Anything

The dot matches any single character except newline:

```javascript
console.log(/h.t/.test("hot"));   // true (h + any char + t)
console.log(/h.t/.test("hat"));   // true
console.log(/h.t/.test("heat"));  // false (two chars between h and t)
console.log(/h..t/.test("heat")); // true (h + any 2 chars + t)
```

---

## 6. Quantifiers - How Many Times?

Quantifiers specify how many times a pattern should match.

| Quantifier | Meaning |
|------------|---------|
| `*` | Zero or more times |
| `+` | One or more times |
| `?` | Zero or one time (optional) |
| `{n}` | Exactly n times |
| `{n,}` | n or more times |
| `{n,m}` | Between n and m times |

### The `*` Quantifier (Zero or More)

```javascript
// go*d matches "gd", "god", "good", "goood", etc.
console.log(/go*d/.test("gd"));     // true (zero o's)
console.log(/go*d/.test("god"));    // true (one o)
console.log(/go*d/.test("good"));   // true (two o's)
console.log(/go*d/.test("goood"));  // true (three o's)
```

### The `+` Quantifier (One or More)

```javascript
// go+d matches "god", "good", "goood", etc. but NOT "gd"
console.log(/go+d/.test("gd"));     // false (needs at least one o)
console.log(/go+d/.test("god"));    // true
console.log(/go+d/.test("good"));   // true
```

### The `?` Quantifier (Optional - Zero or One)

```javascript
// colou?r matches both "color" and "colour"
console.log(/colou?r/.test("color"));   // true (zero u's)
console.log(/colou?r/.test("colour"));  // true (one u)
console.log(/colou?r/.test("colouur")); // false (two u's)

// https? matches both "http" and "https"
console.log(/https?/.test("http://example.com"));   // true
console.log(/https?/.test("https://example.com"));  // true
```

### Exact Counts with `{n}`, `{n,}`, `{n,m}`

```javascript
// \d{3} - exactly 3 digits
console.log(/\d{3}/.test("12"));     // false
console.log(/\d{3}/.test("123"));    // true
console.log(/\d{3}/.test("1234"));   // true (contains 3 digits)

// \d{3,} - 3 or more digits
console.log(/^\d{3,}$/.test("12"));    // false
console.log(/^\d{3,}$/.test("123"));   // true
console.log(/^\d{3,}$/.test("12345")); // true

// \d{2,4} - between 2 and 4 digits
console.log(/^\d{2,4}$/.test("1"));     // false
console.log(/^\d{2,4}$/.test("12"));    // true
console.log(/^\d{2,4}$/.test("1234"));  // true
console.log(/^\d{2,4}$/.test("12345")); // false
```

### Greedy vs Lazy Quantifiers

By default, quantifiers are **greedy** - they match as much as possible.

Add `?` after a quantifier to make it **lazy** - match as little as possible.

```javascript
let text = "<div>Hello</div>";

// Greedy: matches as much as possible
console.log(text.match(/<.*>/));   // ["<div>Hello</div>"]

// Lazy: matches as little as possible
console.log(text.match(/<.*?>/));  // ["<div>"]
```

---

## 7. Anchors - Matching Positions

Anchors don't match characters; they match positions in the string.

| Anchor | Matches |
|--------|---------|
| `^` | Start of string (or line with `m` flag) |
| `$` | End of string (or line with `m` flag) |
| `\b` | Word boundary |
| `\B` | NOT a word boundary |

### Start `^` and End `$` Anchors

```javascript
let text = "Hello World";

// ^ - must start with
console.log(/^Hello/.test(text));  // true
console.log(/^World/.test(text));  // false

// $ - must end with
console.log(/World$/.test(text));  // true
console.log(/Hello$/.test(text));  // false

// Combining ^ and $ - exact match
console.log(/^Hello World$/.test(text)); // true
console.log(/^Hello$/.test(text));       // false (text has more)
```

**Important**: `^` and `$` together mean "the entire string must match":

```javascript
// Validate exact format
console.log(/^\d{3}$/.test("123"));    // true (exactly 3 digits)
console.log(/^\d{3}$/.test("1234"));   // false (4 digits)
console.log(/^\d{3}$/.test("12"));     // false (2 digits)
console.log(/^\d{3}$/.test("12a"));    // false (not all digits)
```

### Word Boundary `\b`

Matches the position between a word character and a non-word character:

```javascript
let text = "cat category catalog";

// Find "cat" as a complete word only
console.log(/\bcat\b/.test("cat"));        // true
console.log(/\bcat\b/.test("category"));   // false
console.log(/\bcat\b/.test("a cat here")); // true

// Without word boundaries
console.log(/cat/.test("category"));  // true (but we might not want this!)
```

---

## 8. Groups and Capturing

Parentheses `()` create groups that can be captured and reused.

### Basic Capturing Groups

```javascript
let text = "John Smith";
let pattern = /(\w+) (\w+)/;
let match = text.match(pattern);

console.log(match[0]);  // "John Smith" (full match)
console.log(match[1]);  // "John" (first group)
console.log(match[2]);  // "Smith" (second group)
```

### Named Capturing Groups

Use `(?<name>pattern)` for named groups (more readable):

```javascript
let text = "2024-01-15";
let pattern = /(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})/;
let match = text.match(pattern);

console.log(match.groups.year);   // "2024"
console.log(match.groups.month);  // "01"
console.log(match.groups.day);    // "15"
```

### Non-Capturing Groups

Use `(?:pattern)` when you need grouping but don't need to capture:

```javascript
// Capturing group - captures "http" or "https"
let pattern1 = /(https?):\/\/(\w+)/;

// Non-capturing group - groups but doesn't capture
let pattern2 = /(?:https?):\/\/(\w+)/;

let match1 = "https://example".match(pattern1);
console.log(match1[1]); // "https"
console.log(match1[2]); // "example"

let match2 = "https://example".match(pattern2);
console.log(match2[1]); // "example" (only the domain is captured)
```

### Backreferences

Reference a captured group later in the same pattern using `\1`, `\2`, etc.:

```javascript
// Find repeated words
let text = "the the quick brown fox";
let pattern = /\b(\w+)\s+\1\b/;

console.log(pattern.test(text));     // true
console.log(text.match(pattern)[0]); // "the the"
console.log(text.match(pattern)[1]); // "the"
```

---

## 9. Alternation - OR Logic

Use the pipe `|` to match one pattern OR another:

```javascript
// Match "cat" OR "dog"
let pattern = /cat|dog/;

console.log(pattern.test("I have a cat"));   // true
console.log(pattern.test("I have a dog"));   // true
console.log(pattern.test("I have a bird"));  // false

// With grouping for complex patterns
let colorPattern = /colou?r (red|green|blue)/;
console.log(colorPattern.test("color red"));    // true
console.log(colorPattern.test("colour green")); // true
console.log(colorPattern.test("color yellow")); // false
```

---

## 10. Lookahead and Lookbehind (Advanced)

These match positions based on what comes before or after, without including it in the match.

### Positive Lookahead `(?=...)`

Match if followed by the pattern:

```javascript
// Find digits followed by "px"
let text = "width: 100px; height: 50em";
let pattern = /\d+(?=px)/g;

console.log(text.match(pattern)); // ["100"]
// Note: "50" not matched because it's followed by "em", not "px"
```

### Negative Lookahead `(?!...)`

Match if NOT followed by the pattern:

```javascript
// Find digits NOT followed by "px"
let text = "width: 100px; height: 50em";
let pattern = /\d+(?!px)/g;

console.log(text.match(pattern)); // ["10", "50"]
// "100" partially matched as "10" (before the "0" that precedes "px")
```

### Positive Lookbehind `(?<=...)`

Match if preceded by the pattern:

```javascript
// Find numbers after "$"
let text = "Price: $100, Tax: $20";
let pattern = /(?<=\$)\d+/g;

console.log(text.match(pattern)); // ["100", "20"]
```

### Negative Lookbehind `(?<!...)`

Match if NOT preceded by the pattern:

```javascript
// Find numbers NOT after "$"
let text = "Price: $100, Quantity: 5";
let pattern = /(?<!\$)\b\d+\b/g;

console.log(text.match(pattern)); // ["5"]
```

---

## 11. Common Regex Patterns for Testing

### Email Validation

```javascript
function isValidEmail(email) {
    let pattern = /^[\w.-]+@[\w.-]+\.\w{2,}$/;
    return pattern.test(email);
}

console.log(isValidEmail("user@example.com"));     // true
console.log(isValidEmail("user.name@domain.org")); // true
console.log(isValidEmail("invalid-email"));        // false
console.log(isValidEmail("missing@domain"));       // false
```

**Pattern breakdown:**
- `^` - start of string
- `[\w.-]+` - one or more word chars, dots, or hyphens (username)
- `@` - literal @ symbol
- `[\w.-]+` - domain name
- `\.` - literal dot
- `\w{2,}` - two or more word chars (extension like "com")
- `$` - end of string

### Phone Number Validation

```javascript
function isValidPhone(phone) {
    // Matches: 123-456-7890, (123) 456-7890, 1234567890
    let pattern = /^(\(\d{3}\)\s?|\d{3}[-.]?)\d{3}[-.]?\d{4}$/;
    return pattern.test(phone);
}

console.log(isValidPhone("123-456-7890"));   // true
console.log(isValidPhone("(123) 456-7890")); // true
console.log(isValidPhone("1234567890"));     // true
console.log(isValidPhone("12345"));          // false
```

### URL Validation

```javascript
function isValidUrl(url) {
    let pattern = /^https?:\/\/[\w.-]+\.\w{2,}(\/\S*)?$/;
    return pattern.test(url);
}

console.log(isValidUrl("https://example.com"));        // true
console.log(isValidUrl("http://sub.domain.org/path")); // true
console.log(isValidUrl("not a url"));                  // false
```

### Date Format Validation (YYYY-MM-DD)

```javascript
function isValidDate(date) {
    let pattern = /^\d{4}-\d{2}-\d{2}$/;
    return pattern.test(date);
}

console.log(isValidDate("2024-01-15")); // true
console.log(isValidDate("2024-1-15"));  // false (needs 2 digits)
console.log(isValidDate("01-15-2024")); // false (wrong format)
```

### Username Validation

```javascript
function isValidUsername(username) {
    // 3-16 characters, letters, numbers, underscores only
    let pattern = /^[a-zA-Z0-9_]{3,16}$/;
    return pattern.test(username);
}

console.log(isValidUsername("john_doe"));    // true
console.log(isValidUsername("user123"));     // true
console.log(isValidUsername("ab"));          // false (too short)
console.log(isValidUsername("invalid-user")); // false (has hyphen)
```

### Password Strength Check

```javascript
function checkPassword(password) {
    let checks = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    let passed = Object.values(checks).filter(Boolean).length;

    return {
        checks,
        score: passed,
        strength: passed < 3 ? "weak" : passed < 5 ? "medium" : "strong"
    };
}

console.log(checkPassword("abc"));        // weak
console.log(checkPassword("Abc12345"));   // medium
console.log(checkPassword("Secure@123")); // strong
```

---

## 12. String Methods with Regex

### replace() with Capturing Groups

```javascript
// Swap first and last name
let name = "John Doe";
let swapped = name.replace(/(\w+) (\w+)/, "$2, $1");
console.log(swapped); // "Doe, John"

// Reformat a date
let date = "2024-01-15";
let formatted = date.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1");
console.log(formatted); // "01/15/2024"
```

### replace() with a Function

```javascript
// Convert prices to double
let text = "Item: $10, Tax: $2";
let doubled = text.replace(/\$(\d+)/g, (match, amount) => {
    return "$" + (parseInt(amount) * 2);
});
console.log(doubled); // "Item: $20, Tax: $4"

// Uppercase all words
let sentence = "hello world";
let upper = sentence.replace(/\b\w/g, char => char.toUpperCase());
console.log(upper); // "Hello World"
```

### split() with Regex

```javascript
// Split on multiple delimiters
let text = "apple,banana;cherry:date";
let fruits = text.split(/[,;:]/);
console.log(fruits); // ["apple", "banana", "cherry", "date"]

// Split on whitespace (handles multiple spaces)
let sentence = "Hello    World   JavaScript";
let words = sentence.split(/\s+/);
console.log(words); // ["Hello", "World", "JavaScript"]
```

---

## 13. Regex Patterns for Test Automation

### Validate Test Case ID

```javascript
function isValidTestCaseId(id) {
    // Format: TC-001 or TC-AUTH-001
    let pattern = /^TC-([A-Z]+-)?\\d{3}$/;
    return pattern.test(id);
}

console.log(isValidTestCaseId("TC-001"));      // true
console.log(isValidTestCaseId("TC-AUTH-001")); // true
console.log(isValidTestCaseId("TC-1"));        // false
```

### Extract Error Codes from Logs

```javascript
function extractErrorCodes(log) {
    let pattern = /ERR-\d+/g;
    return log.match(pattern) || [];
}

let log = "Error [ERR-001]: Failed. Retry [ERR-002]: Timeout";
console.log(extractErrorCodes(log)); // ["ERR-001", "ERR-002"]
```

### Match Dynamic Element IDs

```javascript
function matchDynamicId(pattern, id) {
    // Convert wildcard pattern to regex
    // "user-*-profile" -> /^user-.*-profile$/
    let regexPattern = pattern.replace(/\*/g, ".*");
    return new RegExp(`^${regexPattern}$`).test(id);
}

console.log(matchDynamicId("user-*-profile", "user-12345-profile")); // true
console.log(matchDynamicId("btn-*", "btn-submit"));                   // true
console.log(matchDynamicId("user-*-profile", "admin-123-profile"));   // false
```

### Parse Assertion Error Messages

```javascript
function parseAssertionError(message) {
    let pattern = /Expected '([^']+)' to be (\w+) but was (\w+)/;
    let match = message.match(pattern);

    if (match) {
        return {
            element: match[1],
            expected: match[2],
            actual: match[3]
        };
    }
    return null;
}

let msg = "Expected 'login-btn' to be visible but was hidden";
console.log(parseAssertionError(msg));
// { element: "login-btn", expected: "visible", actual: "hidden" }
```

### Clean and Normalize Text

```javascript
// Remove extra whitespace
function normalizeWhitespace(text) {
    return text.replace(/\s+/g, " ").trim();
}

// Remove non-alphanumeric characters
function alphanumericOnly(text) {
    return text.replace(/[^a-zA-Z0-9\s]/g, "");
}

// Convert camelCase to kebab-case
function camelToKebab(text) {
    return text.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}

console.log(normalizeWhitespace("Hello    World")); // "Hello World"
console.log(alphanumericOnly("Hello, World! 123")); // "Hello World 123"
console.log(camelToKebab("backgroundColor"));        // "background-color"
```

---

## 14. Common Mistakes and Tips

### Mistake 1: Forgetting to Escape Special Characters

```javascript
// WRONG - . matches any character
/example.com/.test("exampleXcom"); // true (oops!)

// RIGHT - \. matches a literal dot
/example\.com/.test("exampleXcom"); // false
/example\.com/.test("example.com"); // true
```

### Mistake 2: Greedy Matching in HTML

```javascript
let html = "<b>one</b> and <b>two</b>";

// WRONG - greedy, matches too much
html.match(/<b>.*<\/b>/);  // ["<b>one</b> and <b>two</b>"]

// RIGHT - lazy, matches each tag separately
html.match(/<b>.*?<\/b>/g); // ["<b>one</b>", "<b>two</b>"]
```

### Mistake 3: Not Using Anchors for Full Validation

```javascript
// WRONG - matches if pattern exists anywhere
/\d{3}/.test("abc123def"); // true (but string isn't just 3 digits)

// RIGHT - anchors ensure full string matches
/^\d{3}$/.test("abc123def"); // false
/^\d{3}$/.test("123");       // true
```

### Tip: Test Your Regex

Always test with multiple inputs:
- Valid inputs that should match
- Invalid inputs that should NOT match
- Edge cases (empty string, special characters, etc.)

```javascript
function testPattern(pattern, testCases) {
    testCases.forEach(({ input, expected }) => {
        let result = pattern.test(input);
        let status = result === expected ? "PASS" : "FAIL";
        console.log(`${status}: "${input}" -> ${result} (expected ${expected})`);
    });
}

testPattern(/^\d{3}-\d{4}$/, [
    { input: "123-4567", expected: true },
    { input: "12-4567", expected: false },
    { input: "123-456", expected: false },
    { input: "abc-defg", expected: false }
]);
```

---

## Summary

### Key Concepts Covered

1. **Creating Regex**: Literal `/pattern/` vs `new RegExp("pattern")`
2. **Flags**: `g` (global), `i` (case-insensitive), `m` (multiline)
3. **Character Classes**: `[abc]`, `[a-z]`, `[^abc]`
4. **Shortcuts**: `\d`, `\w`, `\s`, `.`
5. **Quantifiers**: `*`, `+`, `?`, `{n}`, `{n,m}`
6. **Anchors**: `^`, `$`, `\b`
7. **Groups**: `()`, `(?:)`, `(?<name>)`
8. **Alternation**: `|` for OR logic
9. **Lookahead/Lookbehind**: `(?=)`, `(?!)`, `(?<=)`, `(?<!)`

### Quick Reference

| Pattern | Meaning |
|---------|---------|
| `\d` | Any digit [0-9] |
| `\w` | Word character [a-zA-Z0-9_] |
| `\s` | Whitespace |
| `.` | Any character (except newline) |
| `*` | Zero or more |
| `+` | One or more |
| `?` | Zero or one (optional) |
| `{n}` | Exactly n times |
| `^` | Start of string |
| `$` | End of string |
| `\b` | Word boundary |
| `[abc]` | Any of a, b, or c |
| `[^abc]` | Not a, b, or c |
| `a\|b` | a OR b |
| `()` | Capturing group |
| `(?:)` | Non-capturing group |

### Methods Quick Reference

| Method | Purpose | Returns |
|--------|---------|---------|
| `pattern.test(str)` | Check if matches | Boolean |
| `str.match(pattern)` | Get matches | Array or null |
| `str.search(pattern)` | Find first position | Number (-1 if not found) |
| `str.replace(pattern, new)` | Replace matches | New string |
| `str.split(pattern)` | Split string | Array |

---

**Congratulations!** You now have a solid foundation in regular expressions. Practice with real examples to build confidence!
