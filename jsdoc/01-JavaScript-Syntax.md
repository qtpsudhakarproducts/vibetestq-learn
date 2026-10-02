# JavaScript Syntax

## Overview
JavaScript syntax refers to the set of rules that define how JavaScript programs are written and interpreted. Understanding these basic rules is essential for writing correct JavaScript code.

## Comments

Comments are used to add notes or explanations to your code. They are ignored by the JavaScript engine.

### Single-line Comments
```javascript
// This is a single-line comment
let x = 10; // This comment explains the variable
```

### Multi-line Comments
```javascript
/*
  This is a multi-line comment
  It can span multiple lines
  Useful for longer explanations
*/
```

## Statement Termination

### Semicolons
Semicolons (`;`) are used to terminate statements. While they are optional in JavaScript due to automatic semicolon insertion (ASI), it's recommended to use them for clarity and to avoid potential issues.

```javascript
let name = "John";
let age = 30;
console.log(name);
```

## Case Sensitivity

JavaScript is **case sensitive**, meaning uppercase and lowercase letters are treated as different characters.

```javascript
let myVariable = 10;
let MyVariable = 20; // This is a different variable
let MYVARIABLE = 30; // This is also different

console.log(myVariable); // 10
console.log(MyVariable); // 20
console.log(MYVARIABLE); // 30
```

## Special Characters and Their Uses

### Curly Braces `{ }`
Used to define blocks of code, such as in functions, loops, and conditional statements.

```javascript
function greet() {
    console.log("Hello!");
}

if (true) {
    console.log("This is a code block");
}
```

### Parentheses `( )`
Used in function calls and control flow statements.

```javascript
console.log("Hello");     // Function call
if (x > 10) { }           // Conditional statement
for (let i = 0; i < 5; i++) { } // Loop
```

### Square Brackets `[ ]`
Used for arrays.

```javascript
let fruits = ["Apple", "Banana", "Orange"];
console.log(fruits[0]); // "Apple"
```

### Dot Notation `.`
Used to access properties and methods of objects.

```javascript
let person = { name: "John", age: 30 };
console.log(person.name); // "John"
```

### Comma `,`
Used to separate items in lists.

```javascript
let x = 1, y = 2, z = 3;
let arr = [1, 2, 3, 4, 5];
```

### Colon `:`
Used in object literals to separate keys and values.

```javascript
let person = {
    name: "John",
    age: 30
};
```

## Operators

### Assignment Operator `=`
```javascript
let x = 10;
let name = "Alice";
```

### Comparison Operators
```javascript
x == y   // Equal to (compares value)
x === y  // Strict equal (compares value and type)
x != y   // Not equal
x !== y  // Strict not equal
```

### Arithmetic Operators
```javascript
+  // Addition
-  // Subtraction
*  // Multiplication
/  // Division
```

### Logical Operators
```javascript
&&  // AND
||  // OR
!   // NOT
```

### Comparison Operators
```javascript
<   // Less than
>   // Greater than
<=  // Less than or equal
>=  // Greater than or equal
```

## JavaScript Keywords

Keywords are reserved words that have special meaning in JavaScript and cannot be used as variable names.

### Variable Declaration
- `let` - Declares a block-scoped variable
- `const` - Declares a block-scoped constant
- `var` - Declares a function-scoped variable (older style)

### Conditional Statements
- `if` - Executes code if condition is true
- `else` - Executes code if condition is false
- `switch` - Multi-way branch statement

### Loops
- `for` - Creates a loop
- `while` - Executes code while condition is true
- `do` - Executes code at least once, then repeats while condition is true

### Functions
- `function` - Declares a function
- `return` - Returns a value from a function

### Loop Control
- `break` - Exits a loop
- `continue` - Skips to next iteration of a loop

### Error Handling
- `try` - Tests a block of code for errors
- `catch` - Handles errors
- `finally` - Executes code after try/catch regardless of result

### Object-Oriented Programming
- `class` - Declares a class
- `extends` - Creates a subclass
- `super` - Calls parent class methods

## Naming Conventions

### camelCase
The standard convention for naming variables and functions in JavaScript is **camelCase**, where the first word is lowercase and subsequent words start with uppercase letters.

```javascript
let firstName = "John";
let lastName = "Doe";
let myFunctionName = function() {
    console.log("This is a function");
};

// Calling the function
myFunctionName();
```

### Examples of Good Variable Names
```javascript
let userName = "Alice";
let userAge = 25;
let isLoggedIn = true;
let calculateTotalPrice = function() { };
```

### Examples of Bad Variable Names (avoid these)
```javascript
let x; // Not descriptive
let UserName; // Should be camelCase
let user_name; // JavaScript uses camelCase, not snake_case
```

## Best Practices

1. **Use semicolons** to terminate statements for clarity
2. **Use meaningful variable names** in camelCase
3. **Add comments** to explain complex logic
4. **Be consistent** with your coding style
5. **Use proper indentation** to make code readable
6. **Avoid using reserved keywords** as variable names

## Summary

- JavaScript has clear syntax rules for writing code
- Comments help document your code
- JavaScript is case-sensitive
- Special characters have specific purposes
- Keywords are reserved and have special meanings
- Use camelCase for naming variables and functions
