# Exception Handling in JavaScript

## What is Exception Handling?

Exception handling is a mechanism to handle runtime errors in a controlled manner, allowing the program to continue executing or fail gracefully. It helps prevent your application from crashing when unexpected errors occur.

## Why Do We Need Exception Handling?

1. **Prevent Crashes**: Handle errors without stopping the entire program
2. **Better User Experience**: Show helpful error messages instead of cryptic errors
3. **Debugging**: Easier to identify and fix problems
4. **Graceful Degradation**: Allow the program to continue with alternative logic
5. **Resource Cleanup**: Ensure resources are properly released even when errors occur

## Error Handling Keywords

JavaScript provides several keywords for exception handling:
- **try**: Contains code that may throw an exception
- **catch**: Handles the exception if one occurs
- **finally**: Executes code regardless of whether an exception occurred
- **throw**: Creates custom errors

## Types of Errors in JavaScript

### 1. SyntaxError
Occurs when there is a syntax mistake in the code.

```javascript
// console.log("Hello"; 
// SyntaxError: missing ) after argument list
```

### 2. ReferenceError
Occurs when a non-existent variable is referenced.

```javascript
console.log(nonExistentVariable);
// ReferenceError: nonExistentVariable is not defined
```

### 3. TypeError
Occurs when a value is not of the expected type.

```javascript
let num = 42;
num.toUpperCase();
// TypeError: num.toUpperCase is not a function
```

### 4. RangeError
Occurs when a number is outside the allowable range.

```javascript
let arr = new Array(-1);
// RangeError: Invalid array length
```

### 5. EvalError
Occurs when there is an error in the eval() function (rarely used).

### 6. URIError
Occurs when there is an error in encodeURI() or decodeURI() functions.

```javascript
decodeURIComponent('%');
// URIError: URI malformed
```

### 7. Custom Errors
User-defined errors created using the Error constructor.

## 1. try-catch Block

The basic structure for handling exceptions.

### Syntax
```javascript
try {
    // Code that may throw an exception
} catch (error) {
    // Code to handle the exception
}
```

### Example: Division by Zero
```javascript
function divide(a, b) {
    try {
        if (b === 0) {
            throw new Error("Division by zero is not allowed.");
        }
        let result = a / b;
        console.log(`Result: ${result}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }
}

divide(10, 0); // Error: Division by zero is not allowed.
divide(10, 2); // Result: 5
```

## 2. try-catch-finally Block

The `finally` block executes regardless of whether an exception was thrown or not.

### Syntax
```javascript
try {
    // Code that may throw an exception
} catch (error) {
    // Handle the exception
} finally {
    // Always executes
}
```

### Example
```javascript
function divide(a, b) {
    try {
        if (b === 0) {
            throw new Error("Division by zero is not allowed.");
        }
        let result = a / b;
        console.log(`Result: ${result}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
    } finally {
        console.log("Execution completed.");
    }
}

divide(10, 0);
// Error: Division by zero is not allowed.
// Execution completed.

divide(10, 2);
// Result: 5
// Execution completed.
```

### Common Use Cases for finally

1. **Closing database connections**
2. **Releasing file handles**
3. **Cleaning up resources**
4. **Logging**
5. **Resetting state**

```javascript
function readFile(filename) {
    let file;
    try {
        file = openFile(filename);
        let content = file.read();
        return content;
    } catch (error) {
        console.error("Error reading file:", error.message);
    } finally {
        if (file) {
            file.close(); // Always close the file
        }
    }
}
```

## 3. throw Statement

Use `throw` to create custom errors.

### Syntax
```javascript
throw new Error("Error message");
```

### Example: Age Validation
```javascript
function validateAge(age) {
    if (age < 0 || age > 120) {
        throw new Error("Age must be between 0 and 120.");
    }
    console.log("Valid age:", age);
}

try {
    validateAge(25);  // Valid age: 25
    validateAge(150); // Throws error
} catch (error) {
    console.error(`Error: ${error.message}`);
}
// Valid age: 25
// Error: Age must be between 0 and 120.
```

### Throwing Different Types
```javascript
throw new Error("Something went wrong");
throw "Error string";  // Not recommended
throw 404;             // Not recommended
throw true;            // Not recommended

// Best practice: Always throw Error objects
throw new Error("Descriptive error message");
```

## 4. Custom Error Classes

Create custom error types by extending the Error class.

### Example: ValidationError
```javascript
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

function validateAge(age) {
    if (age < 0 || age > 120) {
        throw new ValidationError("Age must be between 0 and 120.");
    }
    console.log("Valid age:", age);
}

try {
    validateAge(150);
} catch (error) {
    if (error instanceof ValidationError) {
        console.error(`Validation Error: ${error.message}`);
    } else {
        console.error(`Error: ${error.message}`);
    }
}

validateAge(25); // Valid age: 25
```

### Multiple Custom Error Types
```javascript
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = "ValidationError";
    }
}

class DatabaseError extends Error {
    constructor(message) {
        super(message);
        this.name = "DatabaseError";
    }
}

class NetworkError extends Error {
    constructor(message) {
        super(message);
        this.name = "NetworkError";
    }
}

// Using different error types
try {
    throw new NetworkError("Failed to connect to server");
} catch (error) {
    if (error instanceof ValidationError) {
        console.error("Validation failed:", error.message);
    } else if (error instanceof DatabaseError) {
        console.error("Database error:", error.message);
    } else if (error instanceof NetworkError) {
        console.error("Network error:", error.message);
    } else {
        console.error("Unknown error:", error.message);
    }
}
```

## Error Object Properties

### Standard Properties
```javascript
try {
    throw new Error("Something went wrong");
} catch (error) {
    console.log(error.name);    // "Error"
    console.log(error.message); // "Something went wrong"
    console.log(error.stack);   // Stack trace
}
```

### Custom Properties
```javascript
class CustomError extends Error {
    constructor(message, code) {
        super(message);
        this.name = "CustomError";
        this.code = code;
    }
}

try {
    throw new CustomError("Invalid operation", 400);
} catch (error) {
    console.log(error.name);    // "CustomError"
    console.log(error.message); // "Invalid operation"
    console.log(error.code);    // 400
}
```

## Nested try-catch

You can nest try-catch blocks for more granular error handling.

```javascript
try {
    console.log("Outer try block");
    
    try {
        console.log("Inner try block");
        throw new Error("Inner error");
    } catch (innerError) {
        console.error("Caught in inner catch:", innerError.message);
        throw new Error("Re-throwing from inner catch");
    }
    
} catch (outerError) {
    console.error("Caught in outer catch:", outerError.message);
}
```

## Async Exception Handling

### With Promises
```javascript
function fetchData() {
    return new Promise((resolve, reject) => {
        // Simulate async operation
        setTimeout(() => {
            reject(new Error("Failed to fetch data"));
        }, 1000);
    });
}

fetchData()
    .then(data => {
        console.log(data);
    })
    .catch(error => {
        console.error("Error:", error.message);
    });
```

### With Async/Await
```javascript
async function getData() {
    try {
        const data = await fetchData();
        console.log(data);
    } catch (error) {
        console.error("Error:", error.message);
    }
}

getData();
```

## Best Practices

1. **Always use try-catch** for code that might fail
2. **Be specific** in error messages
3. **Use custom error classes** for different error types
4. **Don't catch errors you can't handle**
5. **Use finally** for cleanup operations
6. **Log errors** appropriately
7. **Don't swallow errors** - always do something with them
8. **Throw Error objects**, not strings or numbers
9. **Validate input** before processing
10. **Document** what errors your functions can throw

## Common Patterns

### Pattern 1: Validation
```javascript
function processUser(user) {
    try {
        if (!user) {
            throw new Error("User is required");
        }
        if (!user.email) {
            throw new Error("Email is required");
        }
        // Process user
    } catch (error) {
        console.error("Validation error:", error.message);
        return null;
    }
}
```

### Pattern 2: Resource Cleanup
```javascript
function processFile(filename) {
    let file = null;
    try {
        file = openFile(filename);
        return processFileContent(file);
    } catch (error) {
        console.error("Error processing file:", error.message);
        return null;
    } finally {
        if (file) {
            file.close();
        }
    }
}
```

### Pattern 3: Retry Logic
```javascript
async function retryOperation(operation, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await operation();
        } catch (error) {
            if (i === maxRetries - 1) {
                throw error; // Last retry failed
            }
            console.log(`Retry ${i + 1} failed, retrying...`);
        }
    }
}
```

## What to Avoid

### 1. Empty catch Block
```javascript
// BAD
try {
    riskyOperation();
} catch (error) {
    // Silent failure - no logging, no handling
}

// GOOD
try {
    riskyOperation();
} catch (error) {
    console.error("Operation failed:", error.message);
    // Handle or re-throw
}
```

### 2. Catching Everything
```javascript
// BAD
try {
    doEverything();
} catch (error) {
    // Too broad - can't handle specific errors
}

// GOOD
try {
    validateInput(data);
} catch (error) {
    if (error instanceof ValidationError) {
        showUserError(error.message);
    } else {
        throw error; // Re-throw unexpected errors
    }
}
```

## Summary

- **Exception handling** manages runtime errors gracefully
- **try block** contains code that might throw errors
- **catch block** handles errors that occur
- **finally block** always executes (cleanup code)
- **throw statement** creates custom errors
- **Error types**: SyntaxError, ReferenceError, TypeError, RangeError, etc.
- **Custom error classes** extend the Error class
- **Error object** has name, message, and stack properties
- Use **try-catch** for synchronous code
- Use **catch()** for Promise errors
- Use **try-catch with await** for async/await
- Always handle or log errors - never silently ignore them
- Use specific error types for better error handling
- Clean up resources in finally block
