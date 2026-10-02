# Chapter 108 — Strings & Regular Expressions

This chapter covers string manipulation and regex. Interviewers test this
because extracting values from URLs, normalising text, and validating
formats are everyday tasks in test automation. Questions move from string
basics through the key methods to short practical code.

---

## Q108.1 — What is a string in JavaScript?

A string is a sequence of characters used to represent text. Strings are
**immutable** — any method that "changes" a string returns a new string;
the original is never modified.

```javascript
let s = "hello";
s.toUpperCase(); // returns "HELLO" — s is still "hello"
s = s.toUpperCase(); // reassign to keep the result
console.log(s); // "HELLO"
```

---

## Q108.2 — What are template literals and why are they useful?

Template literals use backticks `` ` `` and support embedding expressions
with `${ }` and multi-line text without `\n`.

```javascript
const name    = "Alice";
const timeout = 5000;

// Without template literal — messy concatenation
const msg1 = "Hello " + name + ", timeout is " + timeout + "ms";

// With template literal — cleaner
const msg2 = `Hello ${name}, timeout is ${timeout}ms`;

// Multi-line
const sql = `
  SELECT *
  FROM users
  WHERE role = 'admin'
`;
```

---

## Q108.3 — When do you use string manipulation in test automation?

- Building URLs from base and path: `` `${baseUrl}/orders/${id}` ``
- Normalising text from the page before asserting (trim, lowercase)
- Extracting an ID or token from a redirect URL
- Generating unique test data: `` `user+${Date.now()}@test.com` ``
- Validating that a value matches an expected format with regex

---

## Q108.4 — How do you use strings and regex in your automation project?

We use template literals for all URL and message construction. We have a
`normalise()` helper that trims and lowercases text before any assertion
— this prevents false failures from invisible whitespace.

For extracting IDs from redirect URLs after form submissions, we use a
short regex with a capture group and `match()`.

---

## Q108.5 — What are the most useful string methods for test automation?

| Method | What it does |
|---|---|
| `trim()` | Remove leading/trailing whitespace |
| `toLowerCase()` | Convert to lowercase |
| `includes(sub)` | Returns true if substring exists |
| `startsWith(s)` | Check beginning |
| `endsWith(s)` | Check end |
| `replace(a, b)` | Replace first match |
| `replaceAll(a, b)` | Replace all matches |
| `split(sep)` | Split into array |
| `slice(s, e)` | Extract substring |

```javascript
"  Hello World  ".trim()          // "Hello World"
"Hello".toLowerCase()             // "hello"
"order-123".includes("123")       // true
"https://".startsWith("https")    // true
"report.pdf".endsWith(".pdf")     // true
"a,b,c".split(",")                // ["a", "b", "c"]
"ORD-123456".slice(4)             // "123456"
```

---

## Q108.6 — What is a regular expression?

A regular expression (regex) is a pattern used to match text. In
JavaScript, written between forward slashes: `/pattern/flags`.

```javascript
const email = "test@example.com";
/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); // true

const id = "ORD-00456";
id.match(/ORD-(\d+)/)[1]; // "00456"
```

Common flags: `i` (case-insensitive), `g` (find all matches).

---

## Q108.7 — How do you use regex to validate test data or page content?

Use regex when the value has a variable part (digits, timestamps, IDs).

```javascript
const orderId = "ORD-123456";
/^ORD-\d{6}$/.test(orderId);   // true

const date = "15/01/2024";
/^\d{2}\/\d{2}\/\d{4}$/.test(date); // true

const price = "£29.99";
/^[£$€]\d+\.\d{2}$/.test(price); // true
```

---

## Q108.8 — What is the difference between test, match, and replace with regex?

`regex.test(str)` — returns `true` or `false`. Use to check existence.

`str.match(regex)` — returns match array or `null`. Use to extract values.

`str.replace(regex, newStr)` — returns new string with replacements.

```javascript
/\d+/.test("abc123");          // true
"abc123".match(/\d+/);         // ["123"]
"abc123".match(/(\d+)/)[1];    // "123" — capture group
"hello world".replace(/o/g, "0"); // "hell0 w0rld"
```

---

## Q108.9 — What is the difference between includes, startsWith, and endsWith?

All three check for a substring — they differ in where they look.

```javascript
const url = "https://staging.example.com/orders";

url.includes("staging");          // true — anywhere
url.startsWith("https");          // true — beginning
url.endsWith("/orders");          // true — end
url.startsWith("http://");        // false
```

All return `boolean`. Use them over regex when the match is a fixed string
— simpler and more readable.

---

## Q108.10 — When is regex the right tool and when is it overkill?

Use regex when the pattern has variable parts — digits, optional segments,
unknown lengths.

Avoid regex when a simple string method works:

```javascript
// ❌ Overkill
if (/staging/.test(url)) { }

// ✅ Simpler
if (url.includes("staging")) { }

// ✅ Regex is correct here — dynamic digits
if (/ORD-\d{6}/.test(orderId)) { }
```

Rule: reach for regex when there is structure or variation in the pattern.
Use string methods for fixed substrings.

---

## Q108.11 — What is wrong with hardcoded string comparisons — show the anti-pattern?

```javascript
// ❌ Brittle — fails if whitespace or case differs
const text = "  Active  ";
text === "Active" // false — whitespace causes mismatch

// ❌ Brittle — fails if currency symbol changes
const price = "$29.99";
price === "£29.99"; // false
```

```javascript
// ✅ Normalise before comparing
text.trim() === "Active" // true

// ✅ Regex for variable parts
/^[£$€]29\.99$/.test(price); // true for any currency
```

---

## Q108.12 — What is the difference between slice, substring, and substr?

`slice(start, end)` — extracts from start to end (exclusive). Supports
negative indices (counts from end).

`substring(start, end)` — same as slice but no negative index support.

`substr` — deprecated. Do not use.

```javascript
"order-123".slice(6);      // "123" — from index 6 to end
"order-123".slice(-3);     // "123" — last 3 characters
"order-123".slice(0, 5);   // "order"

"order-123".substring(6);  // "123"
"order-123".substring(-3); // "order-123" — negative treated as 0
```

Use `slice` — it handles negative indices and `substr` is deprecated.

---

## Q108.13 — Write code to extract an order ID from a URL using regex

```javascript
function extractOrderId(url) {
  const match = url.match(/\/orders\/(ORD-\d+)/);
  return match ? match[1] : null;
}

console.log(extractOrderId("https://example.com/orders/ORD-123456"));
// "ORD-123456"

console.log(extractOrderId("https://example.com/dashboard"));
// null
```

`match()` returns an array: index 0 is the full match, index 1 is the
first capture group `(ORD-\d+)`.

---

## Q108.14 — Write a string helper that normalises text before assertion

```javascript
function normalise(raw) {
  if (raw == null) return "";
  return raw
    .replace(/\u00A0/g, " ") // non-breaking space → regular space
    .replace(/\s+/g, " ")    // collapse multiple spaces
    .trim()
    .toLowerCase();
}

normalise("  Active  ");              // "active"
normalise("Hello\u00A0World");        // "hello world"
normalise(null);                      // ""
```

Without this, invisible whitespace and inconsistent casing cause false
failures in text assertions.

---

## Q108.15 — Describe a regex pattern you wrote to solve a real automation problem

In our project, export filenames were generated with a timestamp:
`export_2024-01-15_14-32-07.csv`. The exact timestamp was always different
— we couldn't hardcode it.

```javascript
const EXPORT_PATTERN = /^export_\d{4}-\d{2}-\d{2}_\d{2}-\d{2}-\d{2}\.csv$/;

const filename = download.suggestedFilename();
expect(EXPORT_PATTERN.test(filename)).toBe(true);
```

The pattern validated the structure without caring about the specific
timestamp. A wrong filename (like `export.csv` or `data-export.csv`)
would fail immediately.

---

## Chapter Summary — Key Points for Your Interview

- Strings are immutable. String methods return new strings — always assign
  the result.
- Template literals with `${}` replace concatenation. Always use them.
- `trim()`, `toLowerCase()`, `includes()`, `split()`, `slice()` — know
  these cold.
- `regex.test()` returns boolean. `str.match()` returns the match array.
- Normalise text before asserting — trim and lowercase prevent false failures.
- Use `slice` not `substr` (deprecated). Use regex for variable patterns,
  string methods for fixed substrings.
