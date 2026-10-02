# Asynchronous JavaScript

## What is Asynchronous Programming?

Asynchronous programming allows JavaScript to perform tasks without blocking the execution of other code. This is essential for operations that take time, such as fetching data from servers, reading files, or waiting for user input.

## Synchronous vs Asynchronous

### Synchronous Code
Code executes line by line, waiting for each operation to complete before moving to the next.

```javascript
console.log("First");
console.log("Second");
console.log("Third");

// Output:
// First
// Second
// Third
```

### Asynchronous Code
Code doesn't wait for long-running operations to complete.

```javascript
console.log("First");

setTimeout(() => {
    console.log("Second");
}, 2000); // Wait 2 seconds

console.log("Third");

// Output:
// First
// Third
// Second (after 2 seconds)
```

## 1. Callbacks

A callback is a function passed as an argument to another function, which is executed after an asynchronous operation completes.

### Simple Callback Example
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

### Asynchronous Callback with setTimeout
```javascript
setTimeout(() => {
    console.log("This message is displayed after 2 seconds");
}, 2000);
```

### Multiple setTimeout Calls
```javascript
setTimeout(() => {
    console.log("This message is displayed after 2 seconds");
}, 2000);

setTimeout(() => {
    console.log("This message is displayed after 3 seconds");
}, 3000);

setTimeout(() => {
    console.log("This message is displayed after 1 second");
}, 1000);

// Output (in order of time):
// "This message is displayed after 1 second"
// "This message is displayed after 2 seconds"
// "This message is displayed after 3 seconds"
```

### Callback with Data Processing
```javascript
function fetchUserData(callback) {
    setTimeout(() => {
        const userData = { id: 1, name: "John Doe", age: 25 };
        console.log("User Data Fetched:", userData);
        callback(userData);
    }, 3000);
}

function updateUserData(userData, callback) {
    setTimeout(() => {
        userData.age += 1;
        console.log("User Data Updated:", userData);
        callback(userData);
    }, 5000);
}

function displayUserData(userData) {
    console.log("Final User Data:", userData);
}

// Using callbacks
fetchUserData((userData) => {
    updateUserData(userData, (updatedData) => {
        displayUserData(updatedData);
    });
});
```

### Callback Hell

When you have multiple nested callbacks, the code becomes hard to read and maintain. This is called "callback hell" or "pyramid of doom".

```javascript
setTimeout(() => {
    console.log("This message is displayed after 2 seconds");
    setTimeout(() => {
        console.log("This message is displayed after 3 more seconds");
        setTimeout(() => {
            console.log("This message is displayed after 1 more second");
        }, 1000);
    }, 3000);
}, 2000);
```

**Problems with Callback Hell:**
- Hard to read and understand
- Difficult to maintain and debug
- Error handling becomes complex
- Code nesting grows horizontally

## 2. Promises

Promises provide a cleaner way to handle asynchronous operations, avoiding callback hell.

### What is a Promise?

A Promise is an object representing the eventual completion (or failure) of an asynchronous operation.

### Promise States

1. **Pending**: Initial state, neither fulfilled nor rejected
2. **Fulfilled**: Operation completed successfully
3. **Rejected**: Operation failed

### Creating a Promise

```javascript
let promise = new Promise(function(resolve, reject) {
    // Asynchronous operation
    if (/* operation successful */) {
        resolve(result); // fulfilled
    } else {
        reject(error);   // rejected
    }
});
```

### Example: Fetching User Data with Promises
```javascript
function fetchUserData() {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const userData = { id: 1, name: "John Doe", age: 25 };
            console.log("User Data Fetched:", userData);
            
            let success = true; // Simulate success or failure
            
            if (success) {
                resolve(userData);
            } else {
                reject(new Error("Failed to fetch user data"));
            }
        }, 3000);
    });
}

function updateUserData(userData) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            userData.age += 1;
            console.log("User Data Updated:", userData);
            resolve(userData);
        }, 5000);
    });
}
```

### Consuming Promises with then() and catch()

```javascript
fetchUserData()
    .then((userData) => {
        return updateUserData(userData);
    })
    .then((updatedData) => {
        console.log("Final User Data:", updatedData);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
```

### Promise Chaining

Promises can be chained to avoid nested callbacks.

```javascript
fetchUserData()
    .then((userData) => updateUserData(userData))
    .then((updatedData) => console.log("Final User Data:", updatedData))
    .catch((error) => console.error("Error:", error));
```

### Benefits of Promises over Callbacks

1. **Better readability**: Chain operations instead of nesting
2. **Error handling**: Single `.catch()` handles all errors
3. **Avoiding callback hell**: Flat structure instead of nested
4. **Easier to maintain**: Clear flow of operations

## 3. Async/Await

Async/Await is modern syntax built on Promises that makes asynchronous code look synchronous.

### The async Keyword

The `async` keyword before a function means the function always returns a Promise.

```javascript
async function myFunction() {
    return "Hello";
}

myFunction().then((result) => {
    console.log(result); // "Hello"
});
```

### The await Keyword

The `await` keyword pauses the execution of an async function until the Promise is resolved or rejected.

**Important:** `await` only works inside `async` functions.

### Example: Using Async/Await
```javascript
async function processUserData() {
    try {
        const userData = await fetchUserData();
        const updatedData = await updateUserData(userData);
        console.log("Final User Data:", updatedData);
    } catch (error) {
        console.error("Error:", error);
    }
}

processUserData();
```

### Async/Await vs Promises

**With Promises:**
```javascript
fetchUserData()
    .then((userData) => {
        return updateUserData(userData);
    })
    .then((updatedData) => {
        console.log("Final User Data:", updatedData);
    })
    .catch((error) => {
        console.error("Error:", error);
    });
```

**With Async/Await:**
```javascript
async function processUserData() {
    try {
        const userData = await fetchUserData();
        const updatedData = await updateUserData(userData);
        console.log("Final User Data:", updatedData);
    } catch (error) {
        console.error("Error:", error);
    }
}

processUserData();
```

### Error Handling with try/catch

```javascript
async function processUserData() {
    try {
        const userData = await fetchUserData();
        const updatedData = await updateUserData(userData);
        console.log("Final User Data:", updatedData);
    } catch (error) {
        console.error("Error occurred:", error);
    }
}
```

### IIFE with Async/Await

You can use an immediately invoked function expression (IIFE) with async/await.

```javascript
(async () => {
    try {
        const userData = await fetchUserData();
        const updatedData = await updateUserData(userData);
        console.log("Final User Data from IIFE:", updatedData);
    } catch (error) {
        console.error("Error in IIFE:", error);
    }
})();
```

## Key Differences Between Callbacks, Promises, and Async/Await

| Feature | Callbacks | Promises | Async/Await |
|---------|-----------|----------|-------------|
| Readability | Poor (nested) | Good (chained) | Excellent (synchronous-like) |
| Error Handling | Complex | `.catch()` | `try/catch` |
| Code Structure | Nested pyramids | Flat chains | Linear |
| Debugging | Difficult | Moderate | Easy |
| Browser Support | All | Modern | Modern |

## When to Use Each

### Use Callbacks When:
- Working with older APIs
- Simple, one-time operations
- No need for chaining

### Use Promises When:
- Multiple asynchronous operations
- Need to chain operations
- Better error handling needed

### Use Async/Await When:
- Want synchronous-looking code
- Complex async logic
- Better debugging experience
- Modern JavaScript environment

## Practical Examples

### Example 1: Sequential Operations
```javascript
async function sequentialOperations() {
    console.log("Starting operations...");
    
    await wait(1000);
    console.log("Operation 1 complete");
    
    await wait(1000);
    console.log("Operation 2 complete");
    
    await wait(1000);
    console.log("All operations complete");
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

sequentialOperations();
```

### Example 2: Error Handling
```javascript
async function fetchData() {
    try {
        const response = await fetch('https://api.example.com/data');
        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Failed to fetch data:", error);
        throw error;
    }
}
```

## Best Practices

1. **Use async/await** for new code (cleaner syntax)
2. **Always handle errors** with try/catch or .catch()
3. **Avoid mixing** callbacks, promises, and async/await unnecessarily
4. **Use Promise.all()** for parallel operations
5. **Keep async functions simple** - break complex logic into smaller functions
6. **Always return promises** from promise-based functions
7. **Use meaningful names** for async functions

## Important Notes

- **Callbacks**: Original way to handle async operations
- **Promises**: Improve upon callbacks, avoid callback hell
- **Async/Await**: Syntactic sugar over Promises, easiest to read
- Async/await makes asynchronous code look and behave like synchronous code
- Test automation tools like Selenium and Playwright handle async operations automatically

## Summary

- **Asynchronous programming** allows non-blocking operations
- **Callbacks** are functions passed to other functions
- **Callback hell** occurs with deeply nested callbacks
- **Promises** represent future values (pending, fulfilled, or rejected)
- **then()** handles successful Promise resolution
- **catch()** handles Promise rejection
- **async** keyword creates functions that return Promises
- **await** keyword pauses execution until Promise resolves
- **try/catch** handles errors in async/await
- Async/await provides the cleanest syntax for async operations
