# Loops in JavaScript

## What are Loops?

Loops allow you to execute a block of code repeatedly. They are useful when you need to perform the same task multiple times or iterate through collections of data.

## 1. for Loop

The `for` loop is the most common loop. It repeats a block of code a specific number of times.

### Syntax
```javascript
for (initialization; condition; increment/decrement) {
    // code to execute
}
```

### Parts of a for Loop
1. **Initialization**: Executed once before the loop starts (e.g., `let i = 0`)
2. **Condition**: Checked before each iteration; loop continues if true
3. **Increment/Decrement**: Executed after each iteration

### Example: Print Numbers 1 to 10
```javascript
for (let i = 1; i <= 10; i++) {
    console.log(i);
}
```

### Example: Print Even Numbers from 1 to 20
```javascript
for (let i = 1; i <= 20; i++) {
    if (i % 2 === 0) {
        console.log(i);
    }
}
```

### Example: Print Odd Numbers Without if Condition
```javascript
for (let i = 1; i <= 20; i += 2) {
    console.log(i);
}
```

### Example: Print Multiplication Table
```javascript
for (let i = 1; i <= 10; i++) {
    console.log("5 x " + i + " = " + (5 * i));
}
```

### Example: Reverse Loop (Count Backward)
```javascript
for (let i = 10; i >= 1; i--) {
    console.log(i);
}
```

### Example: Loop with Step
```javascript
// Print even numbers using step of 2
for (let i = 0; i <= 20; i += 2) {
    console.log("Even Number: " + i);
}
```

### Example: Calculate Sum
```javascript
let sum = 0;
for (let i = 1; i <= 100; i++) {
    sum += i;
}
console.log("Sum of numbers from 1 to 100: " + sum); // 5050
```

### Example: Calculate Factorial
```javascript
let number = 6;
let factorial = 1;

for (let i = 1; i <= number; i++) {
    factorial *= i;
}
console.log("Factorial of " + number + " is " + factorial); // 720
```

## 2. for...of Loop

The `for...of` loop iterates over iterable objects like arrays and strings. It gives you the **values** directly.

### Syntax
```javascript
for (let element of iterable) {
    // code to execute
}
```

### Example: Iterate Through Array
```javascript
let fruits = ["Apple", "Banana", "Cherry", "Date"];

for (let fruit of fruits) {
    console.log("Fruit (for...of): " + fruit);
}
// Output:
// Fruit (for...of): Apple
// Fruit (for...of): Banana
// Fruit (for...of): Cherry
// Fruit (for...of): Date
```

### Example: Iterate Through String
```javascript
let name = "JavaScript";

for (let char of name) {
    console.log(char);
}
```

## 3. for...in Loop

The `for...in` loop iterates over the **keys/indices** of an object or array.

### Syntax
```javascript
for (let key in object) {
    // code to execute
}
```

### Example: Iterate Through Array Indices
```javascript
let fruits = ["Apple", "Banana", "Cherry", "Date"];

for (let index in fruits) {
    console.log("Fruit Index (for...in): " + index + ", Fruit: " + fruits[index]);
}
// Output:
// Fruit Index (for...in): 0, Fruit: Apple
// Fruit Index (for...in): 1, Fruit: Banana
// Fruit Index (for...in): 2, Fruit: Cherry
// Fruit Index (for...in): 3, Fruit: Date
```

### Example: Iterate Through Object Properties
```javascript
let person = {
    name: "John",
    age: 30,
    city: "New York"
};

for (let key in person) {
    console.log(key + ": " + person[key]);
}
// Output:
// name: John
// age: 30
// city: New York
```

### for...in vs for...of

```javascript
let arr = ["a", "b", "c"];

// for...in gives indices
for (let index in arr) {
    console.log(index); // 0, 1, 2
}

// for...of gives values
for (let value of arr) {
    console.log(value); // a, b, c
}
```

**Key Difference:**
- `for...in` → Use for **objects** (gives keys)
- `for...of` → Use for **arrays and iterables** (gives values)

## 4. forEach Method

The `forEach()` method executes a function for each array element.

### Syntax
```javascript
array.forEach(function(element, index) {
    // code to execute
});
```

### Example
```javascript
let fruits = ["Apple", "Banana", "Cherry", "Date"];

fruits.forEach(function(fruit, index) {
    console.log("Fruit (forEach): " + fruit + ", Index: " + index);
});
// Output:
// Fruit (forEach): Apple, Index: 0
// Fruit (forEach): Banana, Index: 1
// Fruit (forEach): Cherry, Index: 2
// Fruit (forEach): Date, Index: 3
```

### Arrow Function Syntax
```javascript
fruits.forEach((fruit, index) => {
    console.log(`${index}: ${fruit}`);
});
```

## 5. while Loop

The `while` loop executes code as long as a condition is true. The condition is checked **before** each iteration.

### Syntax
```javascript
while (condition) {
    // code to execute
}
```

### Example: Wait for Bus
```javascript
let busArrived = false;
let waiting = 0;

while (!busArrived) {
    console.log("Waiting for the bus... " + waiting + " minutes");
    waiting++;
    
    if (waiting === 5) {
        busArrived = true;
        console.log("The bus has arrived!");
    }
}
```

### Example: Count to 5
```javascript
let count = 1;

while (count <= 5) {
    console.log("Count: " + count);
    count++;
}
```

## 6. do...while Loop

The `do...while` loop executes code at least once, then repeats while a condition is true. The condition is checked **after** each iteration.

### Syntax
```javascript
do {
    // code to execute
} while (condition);
```

### Example
```javascript
do {
    console.log("This will print at least once.");
} while (false);
```

### Example: Count with do...while
```javascript
let num = 1;

do {
    console.log("Number: " + num);
    num++;
} while (num <= 5);
```

### Difference Between while and do...while

```javascript
// while loop - may not execute at all
let x = 10;
while (x < 5) {
    console.log("This won't print"); // Condition is false, so never executes
}

// do...while loop - executes at least once
let y = 10;
do {
    console.log("This prints once"); // Executes once before checking condition
} while (y < 5);
```

**Key Difference:**
- `while`: Checks condition **before** execution (may not execute at all)
- `do...while`: Checks condition **after** execution (always executes at least once)

## 7. Nested Loops

A loop inside another loop is called a nested loop.

### Example: Nested for Loop
```javascript
for (let i = 1; i <= 3; i++) {
    for (let j = 1; j <= 2; j++) {
        console.log("Outer Loop: " + i + ", Inner Loop: " + j);
    }
}
// Output:
// Outer Loop: 1, Inner Loop: 1
// Outer Loop: 1, Inner Loop: 2
// Outer Loop: 2, Inner Loop: 1
// Outer Loop: 2, Inner Loop: 2
// Outer Loop: 3, Inner Loop: 1
// Outer Loop: 3, Inner Loop: 2
```

### Example: Print a Pattern
```javascript
for (let i = 1; i <= 3; i++) {
    let row = "";
    for (let j = 1; j <= i; j++) {
        row += "* ";
    }
    console.log(row);
}
// Output:
// *
// * *
// * * *
```

## 8. Loop Control Statements

### break Statement

The `break` statement exits the loop immediately.

```javascript
for (let i = 1; i <= 10; i++) {
    if (i === 5) {
        break; // Exit loop when i is 5
    }
    console.log("Number: " + i);
}
// Output: 1, 2, 3, 4
```

### continue Statement

The `continue` statement skips the current iteration and continues with the next one.

```javascript
for (let i = 1; i <= 10; i++) {
    if (i === 5) {
        continue; // Skip when i is 5
    }
    console.log("Number: " + i);
}
// Output: 1, 2, 3, 4, 6, 7, 8, 9, 10 (5 is skipped)
```

### Example: Using Both break and continue
```javascript
for (let i = 1; i <= 10; i++) {
    if (i === 5) {
        continue; // Skip 5
    }
    if (i === 8) {
        break; // Stop at 8
    }
    console.log("Number: " + i);
}
// Output: 1, 2, 3, 4, 6, 7
```

## Loop Comparison Table

| Loop Type | Best Use Case | Example |
|-----------|---------------|---------|
| `for` | When you know number of iterations | Counting, iterating fixed times |
| `for...of` | Iterating array values | Getting each fruit from fruits array |
| `for...in` | Iterating object keys | Getting all properties of an object |
| `forEach` | Array operations | Processing each array element |
| `while` | When iterations depend on condition | Waiting for user input |
| `do...while` | Execute at least once | Menu systems, validation |

## Best Practices

1. **Use `for` loop** when you know the number of iterations
2. **Use `for...of`** for arrays when you need values
3. **Use `for...in`** for objects when you need keys
4. **Use `while`** when the number of iterations is unknown
5. **Use `do...while`** when code must execute at least once
6. **Avoid infinite loops** - always ensure the condition will eventually become false
7. **Use meaningful variable names** for loop counters (not just `i`, `j`, `k` for complex loops)
8. **Be careful with nested loops** - they can impact performance
9. **Use `break` and `continue` sparingly** - they can make code harder to follow

## Common Mistakes to Avoid

### Infinite Loop
```javascript
// BAD - This will never stop!
for (let i = 0; i < 10; i--) {
    console.log(i); // i keeps decreasing, never reaches 10
}

// GOOD
for (let i = 0; i < 10; i++) {
    console.log(i);
}
```

### Off-by-One Error
```javascript
// This loops 11 times (0 to 10), not 10
for (let i = 0; i <= 10; i++) { }

// This loops exactly 10 times (0 to 9)
for (let i = 0; i < 10; i++) { }
```

## Summary

- **for loop**: Best for known number of iterations
- **for...of loop**: Iterates over array values
- **for...in loop**: Iterates over object keys/array indices
- **forEach**: Array method for processing each element
- **while loop**: Repeats while condition is true (checks before)
- **do...while loop**: Executes at least once (checks after)
- **break**: Exits the loop
- **continue**: Skips current iteration
- Choose the right loop for your task
- Always ensure loops will eventually terminate
