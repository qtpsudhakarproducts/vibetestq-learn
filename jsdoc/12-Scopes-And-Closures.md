# Scopes and Closures in JavaScript

## What is Scope?

Scope determines the accessibility and visibility of variables, objects, and functions in different parts of your code. It defines where variables can be accessed or referenced.

## Types of Scopes

JavaScript has three main types of scopes:

### 1. Global Scope

Variables declared outside any function or block are in the global scope. They can be accessed from anywhere in the code.

```javascript
let globalVar = "I am a global variable";

function showGlobalVar() {
    console.log(globalVar); // Accessible here
}

showGlobalVar(); // "I am a global variable"
console.log(globalVar); // "I am a global variable"
```

**Characteristics:**
- Accessible everywhere in your code
- Created when script starts, destroyed when script ends
- Can lead to naming conflicts
- Should be used sparingly

### 2. Local Scope (Function Scope)

Variables declared within a function are in the local scope of that function. They cannot be accessed from outside the function.

```javascript
function localScopeExample() {
    let localVar = "I am a local variable";
    console.log(localVar); // Accessible here
}

localScopeExample(); // "I am a local variable"

// console.log(localVar); 
// ERROR: Uncaught ReferenceError: localVar is not defined
```

**Characteristics:**
- Only accessible within the function
- Created when function is called
- Destroyed when function completes
- Each function call creates a new scope

### 3. Block Scope

Variables declared with `let` or `const` inside a block (`{ }`) are in the block scope. They are only accessible within that block.

```javascript
if (true) {
    let blockVar = "I am a block-scoped variable";
    const blockConst = "I am also block-scoped";
    console.log(blockVar);   // Accessible here
    console.log(blockConst); // Accessible here
}

// console.log(blockVar); 
// ERROR: Uncaught ReferenceError: blockVar is not defined

// console.log(blockConst); 
// ERROR: Uncaught ReferenceError: blockConst is not defined
```

**Block Scope Examples:**
```javascript
// if block
if (true) {
    let x = 10;
}

// for loop
for (let i = 0; i < 5; i++) {
    let temp = i * 2;
}

// while loop
while (condition) {
    let data = getData();
}

// Code block
{
    let isolated = "I'm in a block";
}
```

## var vs let vs const

### var (Function Scope)
```javascript
function testVar() {
    if (true) {
        var x = 10; // function scoped
    }
    console.log(x); // 10 - accessible outside if block
}

testVar();
```

### let and const (Block Scope)
```javascript
function testLet() {
    if (true) {
        let y = 10; // block scoped
    }
    // console.log(y); // ERROR: y is not defined
}

testLet();
```

### Comparison Table

| Feature | var | let | const |
|---------|-----|-----|-------|
| Scope | Function | Block | Block |
| Reassignment | Yes | Yes | No |
| Redeclaration | Yes | No | No |
| Hoisting | Yes (undefined) | Yes (TDZ) | Yes (TDZ) |
| Best Practice | Avoid | Use | Prefer |

**Note on TDZ (Temporal Dead Zone):**  
`let` and `const` are hoisted, but they cannot be accessed before their declaration line runs.  
That period from the start of the scope to the declaration is called the TDZ, and accessing the variable there throws a `ReferenceError`.  
`var` is hoisted too, but it is initialized to `undefined`, so accessing it early does not throw an error.

## Scope Chain

When JavaScript looks for a variable, it searches in this order:
1. Current scope
2. Parent scope
3. Grandparent scope
4. ... continues up to global scope

```javascript
let global = "global";

function outer() {
    let outerVar = "outer";
    
    function inner() {
        let innerVar = "inner";
        console.log(innerVar);  // Found in current scope
        console.log(outerVar);  // Found in parent scope
        console.log(global);    // Found in global scope
    }
    
    inner();
}

outer();
```

## Closures

### What is a Closure?

A closure is a function that has access to variables from its outer (enclosing) scope, even after the outer function has finished executing.

**Key Points:**
- A closure is a function inside another function
- The inner function can access variables from outer scope
- The inner function remembers the environment in which it was created

### Basic Closure Example

```javascript
function initCounter() {
    let x = 0;
    
    return function demo() {  // This is a closure
        return ++x;
    }
}

let counter = initCounter();
console.log(counter()); // 1
console.log(counter()); // 2
console.log(counter()); // 3
```

**Why is this useful?**
- `x` is not accessible from outside `initCounter()`
- But the inner function `demo` can still access it
- This creates a "private" variable

### Multiple Closures Example

```javascript
function initCounter() {
    let x = 0;
    
    return function() {
        return ++x;
    }
}

let orangeCounter = initCounter();
console.log(orangeCounter()); // 1
console.log(orangeCounter()); // 2

let appleCounter = initCounter();
console.log(appleCounter());  // 1 (separate counter)
console.log(appleCounter());  // 2

console.log(orangeCounter()); // 3 (original counter continues)
```

**Each call to `initCounter()` creates a new closure with its own `x` variable.**

### Practical Closure Example: Private Variables

```javascript
function createBankAccount(initialBalance) {
    let balance = initialBalance; // Private variable
    
    return {
        deposit: function(amount) {
            balance += amount;
            return balance;
        },
        withdraw: function(amount) {
            if (amount <= balance) {
                balance -= amount;
                return balance;
            } else {
                return "Insufficient funds";
            }
        },
        getBalance: function() {
            return balance;
        }
    };
}

let myAccount = createBankAccount(1000);
console.log(myAccount.deposit(500));   // 1500
console.log(myAccount.withdraw(200));  // 1300
console.log(myAccount.getBalance());   // 1300

// Cannot directly access balance
// console.log(myAccount.balance); // undefined
```

### Closure in Loops (Common Pitfall)

**Problem with var:**
```javascript
for (var i = 1; i <= 3; i++) {
    setTimeout(function() {
        console.log(i); // 4, 4, 4
    }, 1000);
}
```

**Solution 1: Use let (block scope)**
```javascript
for (let i = 1; i <= 3; i++) {
    setTimeout(function() {
        console.log(i); // 1, 2, 3
    }, 1000);
}
```

**Solution 2: Use closure**
```javascript
for (var i = 1; i <= 3; i++) {
    (function(j) {
        setTimeout(function() {
            console.log(j); // 1, 2, 3
        }, 1000);
    })(i);
}
```

## Closure Benefits

1. **Data Privacy**: Create private variables
2. **Function Factories**: Generate specialized functions
3. **Maintain State**: Remember values between function calls
4. **Event Handlers**: Access variables when event occurs later
5. **Callbacks**: Pass functions that remember their context

## Closure Use Cases

### 1. Counter
```javascript
function makeCounter() {
    let count = 0;
    return function() {
        return ++count;
    };
}

let counter = makeCounter();
```

### 2. Function Factory
```javascript
function makeMultiplier(factor) {
    return function(number) {
        return number * factor;
    };
}

let double = makeMultiplier(2);
let triple = makeMultiplier(3);

console.log(double(5));  // 10
console.log(triple(5));  // 15
```

### 3. Module Pattern
```javascript
let calculator = (function() {
    let result = 0; // private variable
    
    return {
        add: function(x) {
            result += x;
            return result;
        },
        subtract: function(x) {
            result -= x;
            return result;
        },
        getResult: function() {
            return result;
        }
    };
})();

calculator.add(10);      // 10
calculator.subtract(3);  // 7
calculator.getResult();  // 7
```

## Modern Alternative: Classes

With ES6 classes, you can achieve encapsulation using private fields instead of closures.

### Using Closures (Old Way)
```javascript
function Counter() {
    let count = 0;
    
    this.increment = function() {
        count++;
        return count;
    };
    
    this.getCount = function() {
        return count;
    };
}
```

### Using Classes (Modern Way)
```javascript
class Counter {
    #count = 0; // private field
    
    increment() {
        this.#count++;
        return this.#count;
    }
    
    getCount() {
        return this.#count;
    }
}
```

## Best Practices

1. **Understand scope** before writing code
2. **Use let and const** instead of var
3. **Keep global scope clean** - minimize global variables
4. **Use closures for privacy** - when you need private data
5. **Be aware of memory** - closures keep references to outer variables
6. **Use classes for OOP** - cleaner than closure-based patterns
7. **Document complex scopes** - help others understand your code

## Common Mistakes

### 1. Accidental Global Variables
```javascript
function test() {
    x = 10; // Oops! Global variable (no let/const/var)
}
```

### 2. Loop Variable Issues
```javascript
// Wrong
for (var i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100); // 3, 3, 3
}

// Right
for (let i = 0; i < 3; i++) {
    setTimeout(() => console.log(i), 100); // 0, 1, 2
}
```

### 3. Closure Memory Leaks
```javascript
// Be careful with closures holding large objects
function processLargeData() {
    let largeArray = new Array(1000000);
    
    return function() {
        // This closure keeps largeArray in memory
        return largeArray.length;
    };
}
```

## Summary

- **Scope** determines variable accessibility
- **Global Scope**: Accessible everywhere
- **Function Scope**: Accessible only within function
- **Block Scope**: Accessible only within block (let/const)
- **Scope Chain**: JavaScript searches from inner to outer scope
- **Closures**: Functions that remember their outer scope
- **Closures** enable private variables and data encapsulation
- **Use let/const** for block scope
- **Avoid var** in modern JavaScript
- **Classes with private fields** are modern alternative to closure patterns
- Understanding scope prevents bugs and improves code quality
