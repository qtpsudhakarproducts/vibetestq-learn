# Variables and Data Types in JavaScript

## What are Variables?

Variables are containers for storing data values. They allow you to label and store data in memory so you can use it later in your program.

## Variable Declaration

### Using `let`
`let` declares a block-scoped variable that can be reassigned.

```javascript
let name = "John";
let age = 30;
age = 31; // Can be reassigned
```

### Using `const`
`const` declares a block-scoped constant that cannot be reassigned.

```javascript
const PI = 3.14159;
const country = "USA";
// PI = 3.14; // ERROR: Cannot reassign a const variable
```

### Using `var` (older style)
`var` declares a function-scoped variable. It's an older way and `let` or `const` are preferred.

```javascript
var city = "New York";
```

### Declaring Without Keywords (not recommended)
```javascript
// Without strict mode
isStudent = false; // Becomes a global variable

// This is dangerous and should be avoided!
```

## Strict Mode

### What is "use strict"?

`"use strict"` is a directive that enforces stricter parsing and error handling in JavaScript. It helps catch common coding mistakes.

```javascript
"use strict";

// Now you must declare variables
x = 10; // ERROR: x is not defined

let x = 10; // Correct way
```

### Advantages of Strict Mode
1. Prevents accidental global variables
2. Throws errors for unsafe actions
3. Disables confusing features
4. Makes code more secure

### Disadvantages of Strict Mode
1. May be incompatible with older browsers
2. Some third-party libraries may not work
3. Requires more careful coding
4. Can cause errors in legacy code

### Recommendation
It's generally recommended to use `"use strict"` for better code quality, especially in larger projects.

## Data Types in JavaScript

JavaScript has two categories of data types: **Primitive** and **Non-Primitive**.

### Primitive Data Types

Primitive data types are the basic building blocks of data in JavaScript.

#### 1. String
Represents text data (sequence of characters).

```javascript
let str = "Hello, World!";
let name = "Alice";
let message = 'Single quotes work too';
```

#### 2. Number
Represents both integers and floating-point numbers.

```javascript
let age = 30;
let price = 19.99;
let negative = -5;
```

#### 3. Boolean
Represents logical values: `true` or `false`.

```javascript
let isStudent = true;
let hasLicense = false;
```

#### 4. Undefined
A variable that has been declared but not assigned a value.

```javascript
let undef;
console.log(undef); // undefined
```

#### 5. Null
Represents intentional absence of any value.

```javascript
let emptyValue = null;
```

#### 6. Symbol
Represents a unique identifier (ES6 feature).

```javascript
let sym = Symbol("unique");
```

#### 7. BigInt
Represents integers larger than 2^53 - 1.

```javascript
let bigIntNum = 9007199254740991n; // Note the 'n' at the end
```

### Non-Primitive Data Types

Non-primitive data types are objects that can hold collections of values.

#### 1. Array
Ordered collection of values.

```javascript
let arr = [1, 2, 3, 4, 5];
let fruits = ["Apple", "Banana", "Orange"];
```

#### 2. Object
Collection of key-value pairs.

```javascript
let person = {
    firstName: "John",
    lastName: "Doe",
    age: 30
};
```

#### 3. Function
A reusable block of code.

```javascript
function greet() {
    console.log("Hello!");
}
```

## Checking Data Types

Use the `typeof` operator to check the type of a variable.

```javascript
let str = "Hello";
let num = 42;
let bool = true;
let undef;
let nul = null;
let sym = Symbol("unique");
let bigIntNum = 9007199254740991n;
let arr = [1, 2, 3];
let obj = { name: "John" };
function greet() { }

console.log(typeof str);       // "string"
console.log(typeof num);       // "number"
console.log(typeof bool);      // "boolean"
console.log(typeof undef);     // "undefined"
console.log(typeof nul);       // "object" (this is a known quirk!)
console.log(typeof sym);       // "symbol"
console.log(typeof bigIntNum); // "bigint"
console.log(typeof arr);       // "object"
console.log(typeof obj);       // "object"
console.log(typeof greet);     // "function"
```

**Note:** `typeof null` returns "object". This is a known bug in JavaScript that exists for historical reasons.

## Type Coercion

JavaScript automatically converts types when needed. This is called **type coercion**.

```javascript
// String concatenation
let result1 = "5" + 10;    // "510" (number converted to string)
let result2 = "Hello" + 5; // "Hello5"

// Arithmetic operations
let result3 = "5" - 2;     // 3 (string converted to number)
let result4 = "5" * "2";   // 10 (both strings converted to numbers)
let result5 = "10" / 2;    // 5 (string converted to number)

console.log(result1); // "510"
console.log(result2); // "Hello5"
console.log(result3); // 3
console.log(result4); // 10
console.log(result5); // 5
```

**Key Rules:**
- When using `+` with a string, other values are converted to strings
- Other arithmetic operators (`-`, `*`, `/`) convert strings to numbers

## Type Conversion

You can explicitly convert between types using conversion functions.

### String to Number
```javascript
let strToNum = Number("123");
console.log(strToNum);        // 123
console.log(typeof strToNum); // "number"
```

### Number to String
```javascript
let numToStr = String(456);
console.log(numToStr);        // "456"
console.log(typeof numToStr); // "string"
```

### Boolean to String
```javascript
let boolToStr = String(true);
console.log(boolToStr);       // "true"
console.log(typeof boolToStr); // "string"
```

### Number to Boolean
```javascript
let numToBool1 = Boolean(1);  // true
let numToBool2 = Boolean(0);  // false

console.log(numToBool1); // true
console.log(numToBool2); // false
```

### String to Boolean
```javascript
let strToBool1 = Boolean("");      // false (empty string)
let strToBool2 = Boolean("Hello"); // true (non-empty string)

console.log(strToBool1); // false
console.log(strToBool2); // true
```

## Best Practices

1. **Use `const` by default**, only use `let` when you need to reassign
2. **Avoid `var`** - use `let` or `const` instead
3. **Always declare variables** - never create implicit globals
4. **Use strict mode** (`"use strict"`) for better error checking
5. **Use meaningful variable names** that describe the data
6. **Be aware of type coercion** when mixing types in operations
7. **Use explicit type conversion** when you need specific types

## Summary

- Variables store data values
- Use `let` for variables that change, `const` for constants
- JavaScript has 7 primitive types and 3 main non-primitive types
- Use `typeof` to check data types
- JavaScript performs automatic type coercion
- You can explicitly convert types using `Number()`, `String()`, and `Boolean()`
- Use strict mode for better code quality
