# Stage 11 — Data Structures

---

## Q116. Write a program to create and use a Map

```js
// Map is like an Object but:
// - Keys can be ANY type (not just strings)
// - Remembers insertion order
// - Has a .size property directly
const testCounts = new Map();

// set(key, value) adds or updates
testCounts.set("chromium", 45);
testCounts.set("firefox", 38);
testCounts.set("webkit", 42);

// get(key) retrieves a value — returns undefined if key not found
console.log("firefox count:", testCounts.get("firefox"));

// has(key) returns true/false — does NOT fetch the value
console.log("Has edge:     ", testCounts.has("edge")); // false — we never added edge

// delete(key) removes an entry, returns true if it existed
testCounts.delete("webkit");

// for...of on a Map gives [key, value] pairs
console.log("After delete:");
for (const [browser, count] of testCounts) {
    console.log(" ", browser, "→", count);
}
```

**Output:**
```
firefox count: 38
Has edge:      false
After delete:
  chromium → 45
  firefox  → 38
```

---

## Q117. Write a program to show the difference between Map and Object

```js
const map = new Map();
map.set("Alice", 95);
map.set("Bob", 87);

const obj = { Alice: 95, Bob: 87 };

// Difference 1: size
console.log("Map size:   ", map.size);                  // built-in .size
console.log("Object size:", Object.keys(obj).length);  // must count manually

// Difference 2: any type as key
const objKey = { id: 1 };
map.set(objKey, "metadata");
console.log("Map with object key:", map.get(objKey));   // works perfectly

// Objects convert non-string keys to "[object Object]" — all collide
const o = {};
o[{ id: 1 }] = "a";
o[{ id: 2 }] = "b"; // overwrites! same key "[object Object]"
console.log("Object keys:", Object.keys(o).length); // 1, not 2!

// Difference 3: inherited keys — Object has prototype keys, Map does not
console.log('"toString" in Object:', "toString" in obj); // true — inherited!
console.log('"toString" in Map:  ', map.has("toString")); // false — clean
```

**Output:**
```
Map size:    2
Object size: 2
Map with object key: metadata
Object keys: 1
"toString" in Object: true
"toString" in Map:    false
```

---

## Q118. Write a program to create and use a Set

```js
// Set stores UNIQUE values — duplicates are silently ignored
const set = new Set([1, 2, 3, 2, 4, 1, 5, 3]); // 2,1,3 are duplicates
console.log("After creation, size:", set.size); // 5, not 8

set.add(6);
console.log("After add(6), size: ", set.size); // 6

set.add(1); // 1 already exists — ignored
console.log("After add(1) again: ", set.size); // still 6

console.log("Has 3:", set.has(3)); // true

set.delete(3); // removes 3

// Collect all values into a string
const values = [];
for (const v of set) values.push(v);
console.log("Values:", values.join(" "));
```

**Output:**
```
After creation, size: 5
After add(6), size:   6
After add(1) again:   6
Has 3: true
Values: 1 2 4 5 6
```

---

## Q119. Write a program to remove duplicates from an array using Set

```js
function removeDuplicates(arr) {
    // new Set(arr) creates a Set from the array — duplicates are automatically dropped
    // [...set] spreads the Set back into a regular array
    return [...new Set(arr)];
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 5]));
console.log(removeDuplicates(["pass", "fail", "pass", "skip", "fail"]));

const browsers = ["chromium", "firefox", "chromium", "webkit", "firefox", "chromium"];
const unique = [...new Set(browsers)];
console.log("Unique browsers:", unique);
console.log("Count:", unique.length);
```

**Output:**
```
[1, 2, 3, 4, 5]
["pass", "fail", "skip"]
Unique browsers: ["chromium", "firefox", "webkit"]
Count: 3
```

---

## Q120. Write a program to convert an object to JSON and parse it back

```js
const data = { name: "Sudhakar", role: "tester", scores: [95, 87, 92] };

// JSON.stringify converts JS object → JSON string
// JSON uses double quotes, no functions, no undefined
const json = JSON.stringify(data);
console.log("JSON string:", json);
console.log("Type:", typeof json); // "string"

// Second argument null = no replacer, third = indentation spaces
console.log("Pretty JSON:");
console.log(JSON.stringify(data, null, 2));

// JSON.parse converts JSON string → JS object
const parsed = JSON.parse(json);
console.log("Type:", typeof parsed);      // "object"
console.log("Name:", parsed.name);        // "Sudhakar"
console.log("scores[1]:", parsed.scores[1]); // 87
```

**Output:**
```
JSON string: {"name":"Sudhakar","role":"tester","scores":[95,87,92]}
Type: string
Pretty JSON:
{
  "name": "Sudhakar",
  "role": "tester",
  "scores": [95, 87, 92]
}
Type: object
Name: Sudhakar
scores[1]: 87
```

---

## Q121. Write a program to safely access deeply nested JSON using optional chaining

```js
const data  = { user: { profile: { address: { city: "Hyderabad" } } } };
const empty = { status: 500 }; // no user property

// Without optional chaining: empty.user.profile would throw TypeError
// With ?. — if any part is undefined/null, the whole expression returns undefined
console.log("city from data: ", data?.user?.profile?.address?.city); // Hyderabad
console.log("city from empty:", empty?.user?.profile?.address?.city); // undefined — no crash

// ?? provides a default when the result is null or undefined
const city1 = data?.user?.profile?.address?.city  ?? "Unknown";
const city2 = empty?.user?.profile?.address?.city ?? "Unknown";
console.log("data city: ", city1); // Hyderabad
console.log("empty city:", city2); // Unknown

// Modify and verify
data.user.profile.address.city = "Bangalore";
console.log("Updated:", data.user.profile.address.city);
```

**Output:**
```
city from data:  Hyderabad
city from empty: undefined
data city:  Hyderabad
empty city: Unknown
Updated: Bangalore
```

---

## Q122. Write a program to use WeakMap and show when to use it over Map

```js
const weakMap = new WeakMap();

let user1 = { name: "Alice" };
let user2 = { name: "Bob" };

// WeakMap keys MUST be objects — primitives not allowed
weakMap.set(user1, { role: "admin",  lastLogin: "2024-01-01" });
weakMap.set(user2, { role: "user",   lastLogin: "2024-01-02" });

console.log("user1 data:", weakMap.get(user1));
console.log("Has user1: ", weakMap.has(user1)); // true

// When the object reference is removed, WeakMap allows garbage collection
// With a regular Map, the entry would PREVENT garbage collection (memory leak)
user1 = null; // entry becomes eligible for GC — Map would hold onto it forever

// Practical use: store private data for class instances without memory leaks
const privateData = new WeakMap();

class Session {
    constructor(token) {
        privateData.set(this, token); // token is truly private
    }
    getToken() {
        return privateData.get(this); // only accessible via this method
    }
}

const s = new Session("abc123xyz");
console.log("token:", s.getToken()); // abc123xyz
console.log("direct:", s.token);     // undefined — truly private
```

**Output:**
```
user1 data: { role: "admin", lastLogin: "2024-01-01" }
Has user1:  true
token: abc123xyz
direct: undefined
```
