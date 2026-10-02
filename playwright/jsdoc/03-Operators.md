# Operators in JavaScript

## What are Operators?

Operators are special symbols or keywords that perform operations on operands (values or variables). They allow you to manipulate data and perform calculations.

## 1. Arithmetic Operators

Arithmetic operators perform mathematical calculations.

### Addition `+`
```javascript
let a = 10;
let b = 5;
console.log("Addition: " + (a + b)); // 15
```

### Subtraction `-`
```javascript
console.log("Subtraction: " + (a - b)); // 5
```

### Multiplication `*`
```javascript
console.log("Multiplication: " + (a * b)); // 50
```

### Division `/`
```javascript
console.log("Division: " + (a / b)); // 2
```

### Modulus `%`
Returns the remainder of division.

```javascript
console.log("Modulus: " + (a % b)); // 0
console.log("Modulus: " + (10 % 3)); // 1
```

### Exponentiation `**`
Raises the first operand to the power of the second operand.

```javascript
console.log("Exponentiation: " + (a ** b)); // 100000 (10^5)
console.log("2 to the power of 3: " + (2 ** 3)); // 8
```

## 2. Assignment Operators

Assignment operators assign values to variables.

### Basic Assignment `=`
```javascript
let c = 10;
```

### Addition Assignment `+=`
Adds and assigns the result.

```javascript
let c = 10;
c += 5; // equivalent to c = c + 5
console.log("Addition Assignment: " + c); // 15
```

### Subtraction Assignment `-=`
```javascript
c -= 3; // equivalent to c = c - 3
console.log("Subtraction Assignment: " + c); // 12
```

### Multiplication Assignment `*=`
```javascript
c *= 2; // equivalent to c = c * 2
console.log("Multiplication Assignment: " + c); // 24
```

### Division Assignment `/=`
```javascript
c /= 4; // equivalent to c = c / 4
console.log("Division Assignment: " + c); // 6
```

### Modulus Assignment `%=`
```javascript
c %= 4; // equivalent to c = c % 4
console.log("Modulus Assignment: " + c); // 2
```

### Exponentiation Assignment `**=`
```javascript
c **= 3; // equivalent to c = c ** 3
console.log("Exponentiation Assignment: " + c); // 8
```

## 3. Comparison Operators

Comparison operators compare two values and return a boolean result (`true` or `false`).

### Equal `==`
Compares values only (performs type coercion).

```javascript
let x = 10;
let y = "10";
console.log("Equal (==): " + (x == y)); // true (compares value)
```

### Strict Equal `===`
Compares both value and type.

```javascript
console.log("Strict Equal (===): " + (x === y)); // false (different types)
```

### Not Equal `!=`
```javascript
console.log("Not Equal (!=): " + (x != y)); // false
```

### Strict Not Equal `!==`
```javascript
console.log("Strict Not Equal (!==): " + (x !== y)); // true
```

### Greater Than `>`
```javascript
console.log("Greater Than (>): " + (x > 5)); // true
```

### Less Than `<`
```javascript
console.log("Less Than (<): " + (x < 15)); // true
```

### Greater Than or Equal `>=`
```javascript
console.log("Greater Than or Equal (>=): " + (x >= 10)); // true
```

### Less Than or Equal `<=`
```javascript
console.log("Less Than or Equal (<=): " + (x <= 20)); // true
```

### Important Difference: `==` vs `===`

```javascript
// == performs type coercion
console.log(5 == "5");   // true
console.log(0 == false); // true
console.log(null == undefined); // true

// === checks type AND value
console.log(5 === "5");   // false
console.log(0 === false); // false
console.log(null === undefined); // false
```

**Best Practice:** Always use `===` and `!==` to avoid unexpected type coercion issues.

## 4. Logical Operators

Logical operators are used to combine or invert boolean values.

### AND `&&`
Returns `true` if both operands are true.

```javascript
let p = true;
let q = false;

console.log("AND (&&): " + (p && q)); // false
console.log("AND (&&): " + (true && true)); // true
```

### OR `||`
Returns `true` if at least one operand is true.

```javascript
console.log("OR (||): " + (p || q)); // true
console.log("OR (||): " + (false || false)); // false
```

### NOT `!`
Inverts the boolean value.

```javascript
console.log("NOT (!): " + !p); // false
console.log("NOT (!): " + !q); // true
```

### Logical Operators with Non-Boolean Values

```javascript
// && returns the first falsy value or the last value
console.log("hello" && "world"); // "world"
console.log("" && "world");      // ""
console.log(5 && 0);             // 0

// || returns the first truthy value or the last value
console.log("hello" || "world"); // "hello"
console.log("" || "world");      // "world"
console.log(0 || 5);             // 5
```

## 5. Ternary Operator

The ternary operator is a shorthand for `if-else` statements. It's the only JavaScript operator that takes three operands.

### Syntax
```javascript
condition ? expressionIfTrue : expressionIfFalse
```

### Example 1: Simple Ternary
```javascript
let age = 18;
let canVote = (age >= 18) ? "Yes" : "No";
console.log("Can vote? " + canVote); // "Yes"
```

### Example 2: With Numbers
```javascript
let score = 75;
let grade = (score >= 60) ? "Pass" : "Fail";
console.log("Grade: " + grade); // "Pass"
```

### Example 3: Nested Ternary (use sparingly)
```javascript
let marks = 85;
let result = (marks >= 90) ? "A" :
             (marks >= 80) ? "B" :
             (marks >= 70) ? "C" : "F";
console.log("Grade: " + result); // "B"
```

## 6. typeof Operator

The `typeof` operator returns the data type of a variable.

```javascript
console.log("Type of 42: " + typeof 42);           // "number"
console.log("Type of 'hello': " + typeof "hello"); // "string"
console.log("Type of true: " + typeof true);       // "boolean"
console.log("Type of []: " + typeof []);           // "object"
console.log("Type of {}: " + typeof {});           // "object"
console.log("Type of function: " + typeof function(){}); // "function"
```

## Operator Precedence

When multiple operators are used in an expression, JavaScript follows an order of precedence (similar to PEMDAS in mathematics).

```javascript
let result = 5 + 10 * 2; // Multiplication happens first
console.log(result); // 25 (not 30)

// Use parentheses to change precedence
let result2 = (5 + 10) * 2;
console.log(result2); // 30
```

### Common Precedence Order (highest to lowest)
1. Parentheses `()`
2. Exponentiation `**`
3. Multiplication `*`, Division `/`, Modulus `%`
4. Addition `+`, Subtraction `-`
5. Comparison operators `<`, `>`, `<=`, `>=`
6. Equality operators `==`, `!=`, `===`, `!==`
7. Logical AND `&&`
8. Logical OR `||`
9. Ternary `? :`
10. Assignment `=`, `+=`, `-=`, etc.

## Increment and Decrement Operators

### Increment `++`
```javascript
let count = 5;
count++;        // Post-increment: count = count + 1
console.log(count); // 6

let count2 = 5;
++count2;       // Pre-increment: count2 = count2 + 1
console.log(count2); // 6
```

### Decrement `--`
```javascript
let num = 10;
num--;          // Post-decrement: num = num - 1
console.log(num); // 9

let num2 = 10;
--num2;         // Pre-decrement: num2 = num2 - 1
console.log(num2); // 9
```

### Difference Between Pre and Post
```javascript
let x = 5;
let y = x++;  // y gets 5, then x becomes 6
console.log(y); // 5
console.log(x); // 6

let a = 5;
let b = ++a;  // a becomes 6, then b gets 6
console.log(b); // 6
console.log(a); // 6
```

## Best Practices

1. **Use `===` instead of `==`** to avoid type coercion issues
2. **Use parentheses** to make complex expressions clearer
3. **Keep ternary operators simple** - for complex logic, use if-else
4. **Be consistent** with spacing around operators for readability
5. **Understand operator precedence** to avoid bugs in calculations

## Summary

- **Arithmetic operators** perform mathematical calculations (+, -, *, /, %, **)
- **Assignment operators** assign values to variables (=, +=, -=, etc.)
- **Comparison operators** compare values and return boolean results (==, ===, !=, !==, <, >, <=, >=)
- **Logical operators** combine boolean values (&&, ||, !)
- **Ternary operator** provides a shorthand for if-else statements
- **typeof operator** returns the data type of a value
- Always use `===` for comparison to avoid type coercion
- Operator precedence determines the order of evaluation in expressions
