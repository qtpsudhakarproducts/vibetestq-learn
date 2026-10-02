# Functions in JavaScript

## What are Functions?

A function is a reusable block of code designed to perform a specific task. Functions help organize code, reduce repetition, and make programs more modular and maintainable.

## 1. Function Declaration (Named Function)

### Syntax
```javascript
function functionName(parameters) {
    // code to execute
    return value; // optional
}
```

### Example: Simple Addition
```javascript
function add(a, b) {
    return a + b;
}

console.log(add(5, 3)); // 8
console.log(add(10, 20)); // 30
```

### Example: Function Without Return
```javascript
function greet(name) {
    console.log("Hello, " + name + "!");
}

greet("Alice"); // Hello, Alice!
```

## 2. Function Expression (Anonymous Function)

A function can be assigned to a variable.

### Syntax
```javascript
let variableName = function(parameters) {
    // code to execute
    return value;
};
```

### Example
```javascript
let multiply = function(a, b) {
    return a * b;
};

console.log(multiply(5, 3)); // 15
console.log(multiply(4, 7)); // 28
```

### Difference Between Declaration and Expression

```javascript
// Function Declaration - can be called before declaration (hoisting)
greet("Alice"); // Works!
function greet(name) {
    console.log("Hello, " + name);
}

// Function Expression - cannot be called before assignment
// sayHi("Bob"); // ERROR: Cannot access 'sayHi' before initialization
let sayHi = function(name) {
    console.log("Hi, " + name);
};
sayHi("Bob"); // Works!
```

## 3. Arrow Functions (ES6)

Arrow functions provide a shorter syntax for writing functions.

### Syntax
```javascript
let functionName = (parameters) => {
    // code to execute
    return value;
};
```

### Example: Basic Arrow Function
```javascript
let subtract = (a, b) => {
    return a - b;
};

console.log(subtract(10, 3)); // 7
```

### Shorthand Syntax (Single Expression)
When the function body has only one expression, you can omit the curly braces and `return` keyword.

```javascript
let divide = (a, b) => a / b;

console.log(divide(10, 2)); // 5
```

### Single Parameter (No Parentheses Needed)
```javascript
let square = x => x * x;

console.log(square(4)); // 16
console.log(square(7)); // 49
```

### No Parameters
```javascript
let sayHello = () => console.log("Hello!");

sayHello(); // Hello!
```

### Multiple Parameters
```javascript
let power = (base, exponent) => Math.pow(base, exponent);

console.log(power(2, 3)); // 8
console.log(power(5, 2)); // 25
```

### Multi-line Arrow Function
```javascript
let cube = x => {
    let result = x * x * x;
    return result;
};

console.log(cube(3)); // 27
```

## 4. Function Parameters

### Default Parameters
Provide default values for parameters if no argument is passed.

```javascript
function greet(name = "Guest") {
    return "Hello, " + name + "!";
}

console.log(greet());        // "Hello, Guest!"
console.log(greet("Alice")); // "Hello, Alice!"
```

### Multiple Default Parameters
```javascript
function createUser(name = "Anonymous", age = 18, city = "Unknown") {
    console.log(`Name: ${name}, Age: ${age}, City: ${city}`);
}

createUser();                          // Name: Anonymous, Age: 18, City: Unknown
createUser("John");                    // Name: John, Age: 18, City: Unknown
createUser("Alice", 25);               // Name: Alice, Age: 25, City: Unknown
createUser("Bob", 30, "New York");     // Name: Bob, Age: 30, City: New York
```

### Rest Parameters
Collect all remaining arguments into an array using `...` (rest operator).

```javascript
function sumAll(...numbers) {
    let sum = 0;
    for (let num of numbers) {
        sum += num;
    }
    return sum;
}

console.log(sumAll(1, 2, 3));           // 6
console.log(sumAll(1, 2, 3, 4, 5));     // 15
console.log(sumAll(10, 20, 30, 40));    // 100
```

**Important:** Rest parameter must be the last parameter.

```javascript
function displayInfo(name, age, ...hobbies) {
    console.log("Name: " + name);
    console.log("Age: " + age);
    console.log("Hobbies: " + hobbies.join(", "));
}

displayInfo("Alice", 25, "Reading", "Swimming", "Coding");
// Name: Alice
// Age: 25
// Hobbies: Reading, Swimming, Coding
```

### Spread Operator
Pass array elements as individual arguments using `...` (spread operator).

```javascript
let numbers = [1, 2, 3, 4, 5];
console.log(sumAll(...numbers)); // 15

// Equivalent to: sumAll(1, 2, 3, 4, 5)
```

**Rest vs Spread:**
- **Rest** (`...`) in function definition: Collects arguments into an array
- **Spread** (`...`) in function call: Spreads array into individual arguments

```javascript
// Rest - in function definition
function sum(...nums) { } // Collects arguments

// Spread - in function call
let arr = [1, 2, 3];
sum(...arr); // Spreads array into arguments
```

## 5. Callback Functions

A callback is a function passed as an argument to another function.

### Example: Simple Callback
```javascript
function greet(name, callback) {
    console.log("Hello, " + name + "!");
    callback();
}

function sayGoodbye() {
    console.log("Goodbye!");
}

greet("Alice", sayGoodbye);
// Output:
// Hello, Alice!
// Goodbye!
```

### Example: Calculator with Callbacks
```javascript
function calculate(a, b, operation) {
    return operation(a, b);
}

function add(x, y) {
    return x + y;
}

function multiply(x, y) {
    return x * y;
}

console.log(calculate(10, 5, add));      // 15
console.log(calculate(10, 5, multiply)); // 50

// Using anonymous function
console.log(calculate(10, 5, function(a, b) {
    return a - b;
})); // 5

// Using arrow function
console.log(calculate(10, 5, (a, b) => a / b)); // 2
```

## 6. IIFE (Immediately Invoked Function Expression)

A function that runs immediately after it's defined.

### Syntax
```javascript
(function() {
    // code to execute
})();
```

### Example: Basic IIFE
```javascript
(function() {
    console.log("This runs immediately!");
})();
```

### IIFE with Parameters
```javascript
(function(name) {
    console.log("Hello from IIFE, " + name + "!");
})("Developer");
```

### Arrow Function IIFE
```javascript
(() => {
    console.log("Arrow IIFE!");
})();
```

### Why Use IIFE?
- Creates a new scope to avoid polluting the global namespace
- Useful for initialization code that should run once
- Protects variables from being accessed outside

```javascript
(function() {
    let privateVar = "I'm private";
    console.log(privateVar); // Accessible here
})();

// console.log(privateVar); // ERROR: privateVar is not defined
```

## 7. Recursive Functions

A function that calls itself is called a recursive function.

### Example: Factorial
```javascript
function factorial(n) {
    if (n === 0 || n === 1) {
        return 1; // Base case
    } else {
        return n * factorial(n - 1); // Recursive call
    }
}

console.log(factorial(5)); // 120
// 5! = 5 × 4 × 3 × 2 × 1 = 120
```

### Example: Countdown
```javascript
function countdown(num) {
    if (num < 0) {
        return; // Base case
    }
    console.log(num);
    countdown(num - 1); // Recursive call
}

countdown(5);
// Output: 5, 4, 3, 2, 1, 0
```

### Important: Always Have a Base Case
Without a base case, recursion will continue infinitely and cause a stack overflow error.

```javascript
// BAD - Infinite recursion
function badRecursion(n) {
    return badRecursion(n - 1); // No base case!
}

// GOOD - Has base case
function goodRecursion(n) {
    if (n <= 0) return; // Base case
    goodRecursion(n - 1);
}
```

## 8. Return Statement

The `return` statement ends function execution and specifies a value to be returned.

### Example: With Return
```javascript
function add(a, b) {
    return a + b;
}

let result = add(5, 3);
console.log(result); // 8
```

### Example: Without Return
```javascript
function greet(name) {
    console.log("Hello, " + name);
    // No return statement
}

let result = greet("Alice");
console.log(result); // undefined
```

### Early Return
```javascript
function checkAge(age) {
    if (age < 0) {
        return "Invalid age"; // Exit function early
    }
    if (age < 18) {
        return "Minor";
    }
    return "Adult";
}

console.log(checkAge(-5));  // "Invalid age"
console.log(checkAge(15));  // "Minor"
console.log(checkAge(25));  // "Adult"
```

## 9. Function Scope

Variables defined inside a function are not accessible outside.

```javascript
function myFunction() {
    let localVar = "I'm local";
    console.log(localVar); // Accessible here
}

myFunction();
// console.log(localVar); // ERROR: localVar is not defined
```

## Best Practices

1. **Use descriptive names** - function names should describe what they do
2. **Keep functions small** - each function should do one thing well
3. **Use arrow functions** for short, simple functions
4. **Use default parameters** instead of checking for undefined
5. **Prefer pure functions** - functions that don't modify external state
6. **Document complex functions** with comments
7. **Avoid too many parameters** - consider using an object if you need many parameters
8. **Use consistent naming** - verbs for functions (calculateTotal, getUserData)

## Summary

- **Function Declaration**: `function name() { }`
- **Function Expression**: `let name = function() { }`
- **Arrow Function**: `let name = () => { }`
- **Default Parameters**: Provide default values for parameters
- **Rest Parameters**: `...args` - collect all remaining arguments
- **Spread Operator**: `...array` - spread array into individual arguments
- **Callback Functions**: Functions passed as arguments to other functions
- **IIFE**: Functions that execute immediately `(function() { })()`
- **Recursive Functions**: Functions that call themselves
- **Return Statement**: Ends execution and returns a value
- Functions help organize code and reduce repetition
