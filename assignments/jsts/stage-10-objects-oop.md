# Stage 10 — Objects & OOP

---

## Q101. Write a program to create an object and access properties using dot and bracket notation

```js
const testConfig = {
    browser:    "chromium",
    headless:   true,
    timeout:    30000,
    "base url": "https://example.com" // key with space must be quoted
};

// Dot notation — simple, clean, most common
console.log(testConfig.browser);

// Bracket notation — required for keys with spaces or special characters
console.log(testConfig["headless"]);
console.log(testConfig["base url"]); // only works with brackets, not dot notation

// Bracket notation with a variable — access property dynamically
const key = "timeout";
console.log(testConfig[key]); // 30000

// Add a new property dynamically
testConfig.retries = 3;
console.log("After adding retries:", testConfig.retries);

// Delete a property
delete testConfig.headless;
console.log("After deleting headless:", "headless" in testConfig); // false
```

**Output:**
```
chromium
true
https://example.com
30000
After adding retries: 3
After deleting headless: false
```

---

## Q102. Write a program to destructure an object with renaming and default values

```js
const user = { name: "Alice", age: 25, role: "tester", city: "Hyderabad" };

// Basic destructuring: create variables matching property names
const { name, age } = user;
console.log(name, age); // Alice 25

// Rename during destructuring: propertyName: newVariableName
const { name: userName, age: userAge } = user;
console.log(userName, userAge); // Alice 25

// Default value: used when property doesn't exist on the object
const { country = "India" } = user; // user has no 'country', so default kicks in
console.log("country:", country); // India

// Nested destructuring: go into nested objects in one step
const profile = { address: { city: "NYC", zip: "10001" } };
const { address: { city } } = profile; // extract city from inside address
console.log("city:", city); // NYC
```

**Output:**
```
Alice 25
Alice 25
country: India
city: NYC
```

---

## Q103. Write a program to show the difference between shallow copy and deep copy

```js
const original = { name: "Alice", scores: [90, 85], address: { city: "NYC" } };

// SHALLOW copy using spread — only top-level is copied
// Nested objects and arrays still share the same memory reference
const shallow = { ...original };
shallow.name = "Bob";               // primitive — creates new value, original unaffected
shallow.scores.push(100);           // array is SHARED — modifies original too!
shallow.address.city = "LA";        // object is SHARED — modifies original too!

console.log("After shallow copy changes:");
console.log("original.name:   ", original.name);           // Alice — OK
console.log("original.scores: ", original.scores);         // [90,85,100] — CHANGED!
console.log("original.city:   ", original.address.city);   // LA — CHANGED!

// DEEP copy using JSON — creates completely independent copy
// Limitation: doesn't copy functions, undefined, Date objects
const original2 = { name: "Alice", scores: [90, 85], address: { city: "NYC" } };
const deep = JSON.parse(JSON.stringify(original2));
deep.scores.push(999);
deep.address.city = "Tokyo";

console.log("After deep copy changes:");
console.log("original2.scores:", original2.scores);        // [90,85] — unchanged
console.log("original2.city:  ", original2.address.city);  // NYC — unchanged
```

**Output:**
```
After shallow copy changes:
original.name:    Alice
original.scores:  [90, 85, 100]
original.city:    LA
After deep copy changes:
original2.scores: [90, 85]
original2.city:   NYC
```

---

## Q104. Write a program to use optional chaining and nullish coalescing

```js
const user1 = { name: "Alice", address: { city: "Hyderabad" } };
const user2 = { name: "Bob" }; // no address property

// Without optional chaining: user2.address.city would throw TypeError
// With ?. — returns undefined instead of throwing if the chain breaks
console.log("user1 city: ", user1?.address?.city);  // Hyderabad
console.log("user2 city: ", user2?.address?.city);  // undefined — no crash

// ?? (nullish coalescing): use right side when left is null or undefined
// Different from || which also triggers for 0, false, ""
console.log("user1 city: ", user1?.address?.city ?? "Unknown");  // Hyderabad
console.log("user2 city: ", user2?.address?.city ?? "Unknown");  // Unknown
console.log("user1 phone:", user1?.phone ?? "No phone");          // No phone
```

**Output:**
```
user1 city:  Hyderabad
user2 city:  undefined
user1 city:  Hyderabad
user2 city:  Unknown
user1 phone: No phone
```

---

## Q105. Write a program to iterate over an object using Object.keys, Object.values and Object.entries

```js
const scores = { Alice: 95, Bob: 87, Carol: 92, Dave: 78 };

console.log("Keys:  ", Object.keys(scores));   // array of property names
console.log("Values:", Object.values(scores)); // array of property values

// Object.entries gives [key, value] pairs — great for iteration with destructuring
for (const [name, score] of Object.entries(scores)) {
    console.log(name + ": " + score);
}

// Find top scorer using reduce on entries
const top = Object.entries(scores).reduce((max, [n, s]) => s > max[1] ? [n, s] : max);
console.log("Top scorer:", top[0], "with", top[1]);
```

**Output:**
```
Keys:   ["Alice", "Bob", "Carol", "Dave"]
Values: [95, 87, 92, 78]
Alice: 95
Bob: 87
Carol: 92
Dave: 78
Top scorer: Alice with 95
```

---

## Q106. Write a program to merge two config objects using spread and show which value wins

```js
const defaults  = { host: "localhost", port: 3000, timeout: 5000, retries: 3 };
const overrides = { port: 8080, retries: 5, headless: true };

// Spread merging: later properties override earlier ones
// {...defaults, ...overrides} → overrides' values win when keys clash
const merged = { ...defaults, ...overrides };

console.log("host:    ", merged.host,     "← from defaults (no override)");
console.log("port:    ", merged.port,     "← overrides wins (8080 not 3000)");
console.log("timeout: ", merged.timeout,  "← from defaults (no override)");
console.log("retries: ", merged.retries,  "← overrides wins (5 not 3)");
console.log("headless:", merged.headless, "← only in overrides");
```

**Output:**
```
host:     localhost ← from defaults (no override)
port:     8080      ← overrides wins (8080 not 3000)
timeout:  5000      ← from defaults (no override)
retries:  5         ← overrides wins (5 not 3)
headless: true      ← only in overrides
```

---

## Q107. Write a program to use rest syntax in destructuring to separate known fields from the rest

```js
const testResult = { name: "Login test", status: "pass", duration: 120, browser: "chromium", retries: 0 };

// Extract known fields, collect everything else into 'details' object
// ...details captures all remaining properties not explicitly destructured
const { name, status, ...details } = testResult;

console.log("name:   ", name);
console.log("status: ", status);
console.log("details:", details); // { duration: 120, browser: "chromium", retries: 0 }
```

**Output:**
```
name:    Login test
status:  pass
details: { duration: 120, browser: "chromium", retries: 0 }
```

---

## Q108. Write a program to create a class with a constructor and methods

```js
class Animal {
    // constructor runs when 'new Animal(...)' is called
    constructor(name, sound) {
        this.name  = name;  // 'this' refers to the new instance being created
        this.sound = sound;
    }

    // Methods are shared across all instances (defined on prototype)
    speak() {
        console.log(this.name + " says " + this.sound);
    }

    describe() {
        return "I am a " + this.name;
    }
}

const dog = new Animal("Dog", "Woof");
const cat = new Animal("Cat", "Meow");
dog.speak();
cat.speak();
console.log(dog.describe());
```

**Output:**
```
Dog says Woof
Cat says Meow
I am a Dog
```

---

## Q109. Write a program to implement inheritance using extends and super

```js
class Animal {
    constructor(name, sound) { this.name = name; this.sound = sound; }
    speak() { console.log(this.name + " says " + this.sound); }
}

class Dog extends Animal {
    constructor(name, breed) {
        super(name, "Woof"); // MUST call super() before using 'this'
                              // super() calls the parent class constructor
        this.breed = breed;  // then add Dog-specific properties
    }

    fetch(item) {
        console.log(this.name + " fetches the " + item + "!");
    }

    // Override parent method — Dog's speak is different from generic Animal's speak
    speak() {
        super.speak();  // call parent version first
        console.log(this.name + " also wags its tail!");
    }
}

const dog = new Dog("Buddy", "Labrador");
dog.speak();
dog.fetch("ball");
// instanceof checks inheritance chain
console.log("instanceof Dog:   ", dog instanceof Dog);    // true
console.log("instanceof Animal:", dog instanceof Animal); // also true!
```

**Output:**
```
Buddy says Woof
Buddy also wags its tail!
Buddy fetches the ball!
instanceof Dog:    true
instanceof Animal: true
```

---

## Q110. Write a program to use private fields in a class

```js
class BankAccount {
    #balance; // # prefix makes this field PRIVATE — inaccessible outside the class

    constructor(initial) {
        this.#balance = initial;
    }

    deposit(amount) {
        this.#balance += amount;
        console.log("Deposited " + amount + ". Balance: " + this.#balance);
    }

    withdraw(amount) {
        if (amount > this.#balance) { console.log("Insufficient funds"); return; }
        this.#balance -= amount;
        console.log("Withdrew " + amount + ". Balance: " + this.#balance);
    }

    getBalance() { return this.#balance; }
}

const acc = new BankAccount(1000);
acc.deposit(500);
acc.withdraw(200);
acc.withdraw(2000);
console.log("Balance:", acc.getBalance());

// Trying to access #balance directly gives undefined (not an error with bracket notation)
console.log("Direct access:", acc["#balance"]); // undefined
```

**Output:**
```
Deposited 500. Balance: 1500
Withdrew 200. Balance: 1300
Insufficient funds
Balance: 1300
Direct access: undefined
```

---

## Q111. Write a program to use getters and setters in a class

```js
class Person {
    constructor(firstName, lastName) {
        this.firstName = firstName;
        this.lastName  = lastName;
    }

    // getter: accessed like a property (no parentheses)
    // p.fullName — looks like property access but runs the function
    get fullName() {
        return this.firstName + " " + this.lastName;
    }

    // setter: called when you assign to the property
    // p.fullName = "Jane Smith" — looks like assignment but runs the function
    set fullName(name) {
        const parts   = name.split(" ");
        this.firstName = parts[0];
        this.lastName  = parts.slice(1).join(" ");
    }
}

const p = new Person("John", "Doe");
console.log(p.fullName);       // getter called: "John Doe"

p.fullName = "Jane Smith";     // setter called: splits and assigns
console.log(p.firstName);      // Jane
console.log(p.lastName);       // Smith
console.log(p.fullName);       // getter called: "Jane Smith"
```

**Output:**
```
John Doe
Jane
Smith
Jane Smith
```

---

## Q112. Write a program to use static methods in a class

```js
class MathHelper {
    // static methods belong to the CLASS itself, not to instances
    // Call as MathHelper.max(...) not new MathHelper().max(...)
    static max(...nums)     { return nums.reduce((a, b) => a > b ? a : b); }
    static min(...nums)     { return nums.reduce((a, b) => a < b ? a : b); }
    static average(...nums) { return nums.reduce((a, b) => a + b, 0) / nums.length; }
}

console.log("max:", MathHelper.max(3, 1, 9, 2, 7));   // 9
console.log("min:", MathHelper.min(3, 1, 9, 2, 7));   // 1
console.log("avg:", MathHelper.average(10, 20, 30));  // 20
```

**Output:**
```
max: 9
min: 1
avg: 20
```

---

## Q113. Write a program to implement method chaining using a QueryBuilder class

```js
class QueryBuilder {
    constructor(table) {
        this.table       = table;
        this.fields      = ["*"];
        this.conditions  = [];
        this.orderByField = null;
        this.limitValue  = null;
    }

    // Each method modifies the instance and returns 'this'
    // Returning 'this' allows the next method to be called immediately on the result
    select(...fields)  { this.fields = fields; return this; }
    where(condition)   { this.conditions.push(condition); return this; }
    orderBy(field)     { this.orderByField = field; return this; }
    limit(n)           { this.limitValue = n; return this; }

    build() {
        let q = "SELECT " + this.fields.join(", ") + " FROM " + this.table;
        if (this.conditions.length) q += " WHERE " + this.conditions.join(" AND ");
        if (this.orderByField)      q += " ORDER BY " + this.orderByField;
        if (this.limitValue)        q += " LIMIT " + this.limitValue;
        return q;
    }
}

// Each call returns 'this' so we can chain: builder.select().where().limit()
const query = new QueryBuilder("users")
    .select("name", "email", "role")
    .where("active = true")
    .where("age > 18")
    .orderBy("name")
    .limit(10)
    .build();

console.log(query);
```

**Output:**
```
SELECT name, email, role FROM users WHERE active = true AND age > 18 ORDER BY name LIMIT 10
```

---

## Q114. Write a program to simulate an abstract class that throws error when instantiated directly

```js
class Shape {
    constructor() {
        // new.target is the constructor that was directly invoked with 'new'
        // If someone calls 'new Shape()' directly, new.target === Shape — throw error
        // If a subclass calls super(), new.target is the subclass — allow it
        if (new.target === Shape) {
            throw new Error("Cannot instantiate abstract class Shape");
        }
    }
    // Subclasses MUST override this — calling super version throws
    area()      { throw new Error("area() must be implemented"); }
    perimeter() { throw new Error("perimeter() must be implemented"); }
}

class Circle extends Shape {
    constructor(r) { super(); this.r = r; }
    area()      { return (Math.PI * this.r ** 2).toFixed(2); }
    perimeter() { return (2 * Math.PI * this.r).toFixed(2); }
}

try { new Shape(); } catch (e) { console.log(e.message); }
console.log("Circle area:      ", new Circle(5).area());
console.log("Circle perimeter: ", new Circle(5).perimeter());
```

**Output:**
```
Cannot instantiate abstract class Shape
Circle area:       78.54
Circle perimeter:  31.42
```

---

## Q115. Write a program to create a test data factory class

```js
class UserFactory {
    static #counter = 0; // private static — shared across all calls, not per instance

    static defaults = {
        name:   "Test User",
        email:  "test@example.com",
        role:   "user",
        active: true
    };

    static create(overrides = {}) {
        this.#counter++;
        // Spread defaults first, then overrides — overrides win on conflict
        return { id: this.#counter, ...this.defaults, ...overrides };
    }
}

console.log(UserFactory.create());                     // all defaults, id=1
console.log(UserFactory.create({ role: "admin" }));   // role overridden, id=2
console.log(UserFactory.create({ name: "Alice", active: false })); // id=3
```

**Output:**
```
{ id: 1, name: "Test User", email: "test@example.com", role: "user",  active: true }
{ id: 2, name: "Test User", email: "test@example.com", role: "admin", active: true }
{ id: 3, name: "Alice",     email: "test@example.com", role: "user",  active: false }
```
