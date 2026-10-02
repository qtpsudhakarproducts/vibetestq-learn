# Modules in JavaScript

## What are Modules?

Modules allow you to break up your code into separate files, making it more organized, reusable, and maintainable. Each module can export functions, classes, or variables that other modules can import and use.

## Why Use Modules?

1. **Code Organization**: Split large programs into smaller, manageable files
2. **Reusability**: Use the same code in multiple places
3. **Encapsulation**: Keep implementation details private
4. **Maintainability**: Easier to find and fix bugs
5. **Avoid Name Conflicts**: Each module has its own scope

## Module Systems

JavaScript has two main module systems:
1. **CommonJS** (older, used in Node.js)
2. **ES6 Modules** (modern, standard)

## CommonJS (Node.js Traditional)

### Exporting (module.exports)
```javascript
// mathUtils.js
function add(a, b) {
    return a + b;
}

function subtract(a, b) {
    return a - b;
}

module.exports = { add, subtract };
```

### Importing (require)
```javascript
// app.js
const { add, subtract } = require('./mathUtils.js');

console.log(add(5, 3));      // 8
console.log(subtract(10, 4)); // 6
```

## ES6 Modules (Modern JavaScript)

To use ES6 modules in Node.js, add `"type": "module"` to your `package.json` file.

```json
{
  "type": "module"
}
```

### Named Exports

#### Exporting Individual Items
```javascript
// Module1.js

// Export a function
export function greet(name) {
    return `Hello, ${name}!`;
}

// Export a constant
export const PI = 3.14159;

// Export a class
export class Circle {
    constructor(radius) {
        this.radius = radius;
    }
    
    area() {
        return PI * this.radius * this.radius;
    }
}

// Export a variable
export let counter = 0;

export function incrementCounter() {
    counter++;
}
```

#### Importing Named Exports
```javascript
// ReuseModule.js
import { greet } from './Module1.js';

const message = greet('World');
console.log(message); // Hello, World!
```

#### Importing Multiple Named Exports
```javascript
import { PI, Circle, incrementCounter, counter } from './Module1.js';

console.log(`Value of PI: ${PI}`); // Value of PI: 3.14159

const myCircle = new Circle(5);
console.log(`Area of circle: ${myCircle.area()}`); // Area of circle: 78.53975

incrementCounter();
console.log(`Counter value: ${counter}`); // Counter value: 1
```

**Important:** File extensions (`.js`) are required in ES6 module imports.

### Exporting at the End

You can also export multiple items at once at the end of the file.

```javascript
// Module1.js
const E = 2.71828;
const GOLDEN_RATIO = 1.61803;

const mathConstants = {
    E,
    GOLDEN_RATIO
};

export { E, GOLDEN_RATIO, mathConstants };
```

### Export with Aliases
```javascript
// Module1.js
export { greet as sayHello, Circle as ShapeCircle };
```

```javascript
// ReuseModule.js
import { sayHello, ShapeCircle } from './Module1.js';
```

### Default Exports

Each module can have **one** default export.

#### Exporting Default
```javascript
// Module1.js
export default function farewell(name) {
    return `Goodbye, ${name}!`;
}
```

#### Importing Default Export
You can import a default export with any name you choose.

```javascript
// ReuseModule.js
import farewell from './Module1.js';

const goodbyeMessage = farewell('World');
console.log(goodbyeMessage); // Goodbye, World!
```

### Combining Named and Default Exports
```javascript
// Module1.js
export const API_KEY = "abc123";
export const BASE_URL = "https://api.example.com";

export default function fetchData(endpoint) {
    return fetch(BASE_URL + endpoint);
}
```

```javascript
// ReuseModule.js
import fetchData, { API_KEY, BASE_URL } from './Module1.js';

console.log(API_KEY);
console.log(BASE_URL);
fetchData('/users');
```

### Import All Exports
Import all exports from a module as an object.

```javascript
// ReuseModule.js
import * as Module1 from './Module1.js';

console.log(Module1.PI);
console.log(Module1.mathConstants);
const circle = new Module1.Circle(10);
```

### Import for Side Effects Only
Sometimes you just want to execute a module's code without importing anything.

```javascript
// logger.js
console.log("Logger initialized");

// main.js
import './logger.js'; // Just runs the code
```

## Async Functions in Modules

Modules can export async functions.

```javascript
// Module1.js
export async function fetchData(url) {
    const response = await fetch(url);
    return response.json();
}
```

```javascript
// ReuseModule.js
import { fetchData } from './Module1.js';

fetchData('https://api.example.com/data')
    .then(data => console.log(data))
    .catch(error => console.error('Error:', error));
```

## Differences: CommonJS vs ES6 Modules

| Feature | CommonJS | ES6 Modules |
|---------|----------|-------------|
| Syntax | `require()` / `module.exports` | `import` / `export` |
| File Extension | `.js` | `.js` or `.mjs` |
| Loading | Synchronous | Asynchronous |
| Static Analysis | No | Yes (better optimization) |
| Node.js | Default | Needs `"type": "module"` |
| Browser | No | Yes (with `<script type="module">`) |
| Dynamic Import | `require()` | `import()` |

### Key Differences

#### 1. Syntax
```javascript
// CommonJS
const { add } = require('./math.js');

// ES6 Modules
import { add } from './math.js';
```

#### 2. Loading
- **CommonJS**: Synchronous (blocking)
- **ES6 Modules**: Asynchronous, supports better optimization

#### 3. Static Analysis
- **ES6 Modules** can be analyzed at compile time
- Allows for tree-shaking (removing unused code)
- Better for bundlers like webpack

## Named Export vs Default Export

### Named Exports
- Can have multiple per module
- Must import with the exact name
- Use curly braces: `import { name } from './module.js'`
- Good for utility functions and constants

```javascript
// math.js
export const add = (a, b) => a + b;
export const subtract = (a, b) => a - b;

// app.js
import { add, subtract } from './math.js';
```

### Default Exports
- Only one per module
- Can import with any name
- No curly braces: `import anything from './module.js'`
- Good for main class or component

```javascript
// User.js
export default class User {
    constructor(name) {
        this.name = name;
    }
}

// app.js
import User from './User.js';
// or
import MyUser from './User.js'; // Any name works
```

## Module Best Practices

1. **Use ES6 modules** for new projects (modern and standard)
2. **One module, one purpose** - keep modules focused
3. **Use named exports** for multiple utilities
4. **Use default export** for the main export of a module
5. **Keep modules small** - easier to test and maintain
6. **Use clear file names** that match exported content
7. **Group related functionality** in the same module
8. **Avoid circular dependencies** - Module A imports Module B, which imports Module A

## Re-exporting

You can export items from another module.

```javascript
// AllExports.js
export * as ms8 from "./ModuleSample.js";
export * as ms10 from "./ModuleSampleDefault.js";
```

```javascript
// ImportAll.js
import * as am from "./AllExports.js";

let emp1 = new am.ms8.Employee();
```

## Dynamic Imports

Import modules dynamically at runtime.

```javascript
// Dynamic import (returns a Promise)
async function loadModule() {
    const module = await import('./myModule.js');
    module.myFunction();
}

// Or with .then()
import('./myModule.js')
    .then(module => {
        module.myFunction();
    })
    .catch(error => {
        console.error('Error loading module:', error);
    });
```

## Summary

- **Modules** organize code into separate, reusable files
- **ES6 Modules** use `import` and `export` keywords
- **CommonJS** uses `require()` and `module.exports`
- **Named exports** allow multiple exports per module
- **Default exports** allow one main export per module
- File extensions are required in ES6 imports
- Use `"type": "module"` in package.json for Node.js ES6 modules
- ES6 modules support static analysis and tree-shaking
- `import * as name` imports all exports as an object
- Default exports can be imported with any name
- Named exports must be imported with exact names (or aliased)
- Modules help avoid global namespace pollution
- Each module has its own scope
