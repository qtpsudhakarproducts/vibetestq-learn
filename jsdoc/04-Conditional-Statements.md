# Conditional Statements in JavaScript

## What are Conditional Statements?

Conditional statements allow you to execute different blocks of code based on different conditions. They help your program make decisions.

## 1. if Statement

The `if` statement executes a block of code if a specified condition is true.

### Syntax
```javascript
if (condition) {
    // code to execute if condition is true
}
```

### Example: Check if a Number is Even
```javascript
let number = 8;

if (number % 2 === 0) {
    console.log("The number is even.");
}
```

## 2. if-else Statement

The `if-else` statement executes one block of code if the condition is true, and another block if it's false.

### Syntax
```javascript
if (condition) {
    // code if condition is true
} else {
    // code if condition is false
}
```

### Example: Check Odd or Even
```javascript
let number = 7;

if (number % 2 === 0) {
    console.log("The number is even.");
} else {
    console.log("The number is odd.");
}
```

## 3. if-else if-else Statement

Use multiple `else if` clauses to test multiple conditions.

### Syntax
```javascript
if (condition1) {
    // code if condition1 is true
} else if (condition2) {
    // code if condition2 is true
} else if (condition3) {
    // code if condition3 is true
} else {
    // code if none of the conditions are true
}
```

### Example: Find the Largest of Three Numbers
```javascript
let num1 = 10;
let num2 = 25;
let num3 = 15;

if (num1 >= num2 && num1 >= num3) {
    console.log("The largest number is: " + num1);
} else if (num2 >= num1 && num2 >= num3) {
    console.log("The largest number is: " + num2);
} else if (num3 >= num1 && num3 >= num2) {
    console.log("The largest number is: " + num3);
} else if (num1 === num2 && num1 === num3) {
    console.log("All three numbers are equal.");
}
```

### Example: Compare Two Numbers
```javascript
let a = 45;
let b = 30;

if (a > b) {
    console.log(a + " is greater than " + b);
} else if (a < b) {
    console.log(b + " is greater than " + a);
} else {
    console.log("Both numbers are equal.");
}
```

## 4. Nested if Statements

You can nest `if` statements inside other `if` statements.

### Example
```javascript
let age = 20;
let hasLicense = true;

if (age >= 18) {
    if (hasLicense) {
        console.log("You can drive!");
    } else {
        console.log("You need a license to drive.");
    }
} else {
    console.log("You are too young to drive.");
}
```

## 5. Ternary Operator (Conditional Operator)

The ternary operator is a shorthand for simple `if-else` statements.

### Syntax
```javascript
condition ? expressionIfTrue : expressionIfFalse
```

### Example: Find Bigger Number
```javascript
let x = 20;
let y = 20;
let result = (x > y) ? x : (x < y) ? y : "Both numbers are equal";
console.log("The bigger number is: " + result);
```

### Simple Example
```javascript
let age = 18;
let status = (age >= 18) ? "Adult" : "Minor";
console.log(status); // "Adult"
```

### When to Use Ternary Operator
- **Use for simple conditions** with short expressions
- **Avoid for complex logic** - use if-else instead
- Good for assignments based on conditions

## 6. Switch Statement

The `switch` statement selects one of many code blocks to execute based on a single expression value.

### Syntax
```javascript
switch (expression) {
    case value1:
        // code to execute if expression === value1
        break;
    case value2:
        // code to execute if expression === value2
        break;
    case value3:
        // code to execute if expression === value3
        break;
    default:
        // code to execute if expression doesn't match any case
}
```

### Example: Print Day of the Week
```javascript
let dayNumber = 3;
let dayName;

switch (dayNumber) {
    case 1:
        dayName = "Monday";
        break;
    case 2:
        dayName = "Tuesday";
        break;
    case 3:
        dayName = "Wednesday";
        break;
    case 4:
        dayName = "Thursday";
        break;
    case 5:
        dayName = "Friday";
        break;
    case 6:
        dayName = "Saturday";
        break;
    case 7:
        dayName = "Sunday";
        break;
    default:
        dayName = "Invalid day number";
}

console.log("The day is: " + dayName); // "Wednesday"
```

### Example: Grade Calculator
```javascript
let grade = 'B';

switch (grade) {
    case 'A':
        console.log("Excellent!");
        break;
    case 'B':
        console.log("Good job!");
        break;
    case 'C':
        console.log("Well done!");
        break;
    case 'D':
        console.log("You passed!");
        break;
    case 'F':
        console.log("Better try again!");
        break;
    default:
        console.log("Invalid grade");
}
```

### Multiple Cases with Same Code
```javascript
let day = 'Saturday';

switch (day) {
    case 'Monday':
    case 'Tuesday':
    case 'Wednesday':
    case 'Thursday':
    case 'Friday':
        console.log("It's a weekday");
        break;
    case 'Saturday':
    case 'Sunday':
        console.log("It's the weekend!");
        break;
    default:
        console.log("Invalid day");
}
```

### Importance of `break` Statement

The `break` statement exits the switch block. Without it, execution continues to the next case (fall-through behavior).

```javascript
let num = 2;

// Without break
switch (num) {
    case 1:
        console.log("One");
    case 2:
        console.log("Two");    // This executes
    case 3:
        console.log("Three");  // This also executes (fall-through)
    default:
        console.log("Other");  // This also executes
}

// Output:
// Two
// Three
// Other
```

```javascript
// With break
switch (num) {
    case 1:
        console.log("One");
        break;
    case 2:
        console.log("Two");
        break;  // Exits the switch
    case 3:
        console.log("Three");
        break;
    default:
        console.log("Other");
}

// Output:
// Two
```

## Difference Between if-else and switch

### 1. Purpose
- **if-else**: Used for conditional branching based on boolean expressions
- **switch**: Used for selecting one of many values based on a single expression

### 2. Conditions
- **if-else**: Can handle a wide range of conditions, including complex expressions
- **switch**: Limited to discrete values (integers, strings, or enums)

### 3. Readability
- **if-else**: Better for complex conditions with ranges
- **switch**: More efficient and easier to read for multiple discrete values

### 4. Comparison Type
- **if-else**: Can use any comparison operators (==, ===, <, >, etc.)
- **switch**: Uses strict comparison (===) for case values

### 5. Flexibility
- **if-else**: More flexible with different conditions for each branch
- **switch**: Requires exact matches for case values

### When to Use if-else
```javascript
let age = 25;

if (age < 18) {
    console.log("Minor");
} else if (age >= 18 && age < 65) {
    console.log("Adult");
} else {
    console.log("Senior");
}
```

### When to Use switch
```javascript
let color = 'red';

switch (color) {
    case 'red':
        console.log("Stop");
        break;
    case 'yellow':
        console.log("Slow down");
        break;
    case 'green':
        console.log("Go");
        break;
    default:
        console.log("Invalid color");
}
```

## Best Practices

1. **Use curly braces** even for single-line conditions for clarity
2. **Use `===` in conditions** to avoid type coercion issues
3. **Keep conditions simple** - break complex conditions into variables
4. **Use switch for multiple discrete values** instead of many if-else statements
5. **Always include `break`** in switch cases (unless fall-through is intended)
6. **Always include a `default` case** in switch statements
7. **Use ternary operator** only for simple conditions
8. **Keep nested conditions shallow** - deeply nested code is hard to read

## Summary

- **if statement**: Executes code if condition is true
- **if-else statement**: Chooses between two blocks of code
- **if-else if-else**: Tests multiple conditions in sequence
- **Ternary operator**: Shorthand for simple if-else (condition ? true : false)
- **switch statement**: Selects one of many code blocks based on a value
- Use if-else for ranges and complex conditions
- Use switch for multiple discrete values
- Always use `break` in switch cases
- Keep conditions clear and simple for maintainability
