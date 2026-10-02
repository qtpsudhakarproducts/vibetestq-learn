# TypeScript Basics - Complete Guide

## 📚 Overview

TypeScript is a statically-typed superset of JavaScript that compiles to plain JavaScript. It adds optional type annotations and advanced features to help catch errors early and improve code quality.

**Created by**: Microsoft  
**First Release**: 2012  
**Current Usage**: React, Angular, Vue, Node.js projects

---

## 🎯 What is TypeScript?

TypeScript = JavaScript + Static Types + Additional Features

### Key Characteristics:
- **Superset of JavaScript**: All valid JavaScript is valid TypeScript
- **Static Typing**: Optional type annotations
- **Compile-time Checking**: Catches errors before runtime
- **Modern Features**: Latest ECMAScript features
- **Better Tooling**: Enhanced IDE support (autocomplete, refactoring)

---

## 🚀 Getting Started

### Installation

```bash
# Install TypeScript globally
npm install -g typescript

# Check version
tsc --version
```

### Running TypeScript

#### Method 1: Compile then Run
```bash
# Compile .ts to .js
tsc filename.ts

# Run the generated JavaScript
node filename.js
```

#### Method 2: Using ts-node
```bash
# Install ts-node
npm install -g ts-node

# Run TypeScript directly
ts-node filename.ts
```

#### Method 3: Node.js Native (Latest Feature)
```bash
# Node.js can now run TypeScript directly
node filename.ts
```

**Note**: For Node.js native execution, set `"type": "module"` in `package.json`

---

## 📘 Basic Types

### 1. Number
Represents both integers and floating-point numbers.

```typescript
let age: number = 25;
let price: number = 99.99;
let hex: number = 0xFF;
let binary: number = 0b1010;
```

### 2. String
Represents text data.

```typescript
let name: string = "John";
let greeting: string = 'Hello';
let message: string = `Welcome, ${name}!`; // Template literal
```

### 3. Boolean
Represents true/false values.

```typescript
let isActive: boolean = true;
let hasPermission: boolean = false;
```

### 4. Array
Two syntaxes available:

```typescript
// Method 1: Type[]
let numbers: number[] = [1, 2, 3, 4, 5];
let names: string[] = ["Alice", "Bob", "Charlie"];

// Method 2: Array<Type>
let scores: Array<number> = [90, 85, 95];
let cities: Array<string> = ["NYC", "LA", "Chicago"];
```

### 5. Tuple
Fixed-length array with specific types:

```typescript
let person: [string, number] = ["John", 30];
let coordinates: [number, number] = [10.5, 20.3];

// Accessing tuple elements
console.log(person[0]); // "John"
console.log(person[1]); // 30
```

### 6. Enum
Named constants:

```typescript
enum Color {
    Red,      // 0
    Green,    // 1
    Blue      // 2
}

let favoriteColor: Color = Color.Green;
console.log(favoriteColor); // 1

// Custom values
enum Status {
    Active = 1,
    Inactive = 0,
    Pending = 2
}
```

### 7. Any
Disables type checking (use sparingly):

```typescript
let value: any = 10;
value = "Hello";  // OK
value = true;     // OK
value = [];       // OK
```

### 8. Void
Represents absence of value (commonly for functions):

```typescript
function logMessage(msg: string): void {
    console.log(msg);
    // No return statement
}
```

### 9. Null and Undefined

```typescript
let n: null = null;
let u: undefined = undefined;
```

### 10. Never
Represents values that never occur:

```typescript
function throwError(message: string): never {
    throw new Error(message);
}

function infiniteLoop(): never {
    while (true) {
        // Never returns
    }
}
```

---

## 🔄 Type Annotations vs Type Inference

### Type Annotation (Explicit)
```typescript
let age: number = 25;
let name: string = "John";
```

### Type Inference (Implicit)
```typescript
let age = 25;        // TypeScript infers: number
let name = "John";   // TypeScript infers: string
```

**Best Practice**: Use inference when type is obvious, annotations when needed for clarity.

---

## 🎭 Union Types

Allow a variable to be one of several types:

```typescript
let id: number | string;
id = 101;        // OK
id = "ABC123";   // OK

function printId(id: number | string) {
    console.log(`ID: ${id}`);
}

printId(42);      // OK
printId("USER1"); // OK
```

---

## 🎯 Type Assertions

Tell TypeScript to treat a value as a specific type:

```typescript
let value: any = "Hello, TypeScript";

// Method 1: as syntax (preferred)
let length1: number = (value as string).length;

// Method 2: angle-bracket syntax
let length2: number = (<string>value).length;

console.log(length1); // 17
```

---

## 📦 Interfaces

Define contracts for objects:

```typescript
interface Person {
    name: string;
    age: number;
    email?: string;  // Optional property
}

let user: Person = {
    name: "Alice",
    age: 30
    // email is optional
};

// With method
interface Calculator {
    add(a: number, b: number): number;
    subtract(a: number, b: number): number;
}
```

---

## 🏗️ Functions in TypeScript

### Basic Function Types

```typescript
// Function declaration
function add(a: number, b: number): number {
    return a + b;
}

// Function expression
let multiply = function(a: number, b: number): number {
    return a * b;
};

// Arrow function
let divide = (a: number, b: number): number => {
    return a / b;
};
```

### Optional Parameters

```typescript
function greet(name: string, greeting?: string): string {
    if (greeting) {
        return `${greeting}, ${name}!`;
    }
    return `Hello, ${name}!`;
}

console.log(greet("John"));              // "Hello, John!"
console.log(greet("John", "Welcome"));   // "Welcome, John!"
```

### Default Parameters

```typescript
function calculateArea(width: number, height: number = 10): number {
    return width * height;
}

console.log(calculateArea(5));      // 50
console.log(calculateArea(5, 20));  // 100
```

### Rest Parameters

```typescript
function sum(...numbers: number[]): number {
    return numbers.reduce((total, num) => total + num, 0);
}

console.log(sum(1, 2, 3));        // 6
console.log(sum(10, 20, 30, 40)); // 100
```

---

## 🎓 Classes in TypeScript

### Basic Class

```typescript
class Animal {
    name: string;
    
    constructor(name: string) {
        this.name = name;
    }
    
    speak(): void {
        console.log(`${this.name} makes a sound.`);
    }
}

let dog = new Animal("Rex");
dog.speak(); // "Rex makes a sound."
```

### Access Modifiers

```typescript
class BankAccount {
    public accountNumber: string;
    private balance: number;
    protected owner: string;
    
    constructor(accountNumber: string, initialBalance: number) {
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
        this.owner = "";
    }
    
    public deposit(amount: number): void {
        this.balance += amount;
    }
    
    public getBalance(): number {
        return this.balance;
    }
}

// public: accessible everywhere
// private: only within class
// protected: within class and subclasses
```

### Inheritance

```typescript
class Animal {
    constructor(public name: string) {}
    
    speak(): void {
        console.log(`${this.name} makes a sound`);
    }
}

class Dog extends Animal {
    constructor(name: string) {
        super(name);
    }
    
    speak(): void {
        console.log(`${this.name} barks`);
    }
}

let dog = new Dog("Rex");
dog.speak(); // "Rex barks"
```

### Getters and Setters

```typescript
class Employee {
    private _age: number = 30;
    
    get age(): number {
        return this._age;
    }
    
    set age(value: number) {
        if (value < 18) {
            console.log("Age must be 18+");
        } else if (value > 65) {
            console.log("Age must be under 65");
        } else {
            this._age = value;
        }
    }
}

let emp = new Employee();
console.log(emp.age);  // 30
emp.age = 25;          // Sets age to 25
emp.age = 70;          // "Age must be under 65"
```

---

## 🔐 Generics

Write reusable, type-safe code:

```typescript
function identity<T>(arg: T): T {
    return arg;
}

let num = identity<number>(42);
let str = identity<string>("Hello");

console.log(num); // 42
console.log(str); // "Hello"

// Generic Array
function getFirstElement<T>(arr: T[]): T {
    return arr[0];
}

let firstNum = getFirstElement<number>([1, 2, 3]);
let firstName = getFirstElement<string>(["Alice", "Bob"]);
```

---

## 📦 Modules

### Exporting

```typescript
// mathUtils.ts
export function add(a: number, b: number): number {
    return a + b;
}

export function subtract(a: number, b: number): number {
    return a - b;
}

export const PI = 3.14159;

// Default export
export default class Calculator {
    // ...
}
```

### Importing

```typescript
// app.ts
import { add, subtract, PI } from './mathUtils';
import Calculator from './mathUtils';

console.log(add(5, 3));      // 8
console.log(subtract(10, 4)); // 6
console.log(PI);              // 3.14159
```

---

## ⚙️ TypeScript Configuration (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "commonjs",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

---

## 🆚 TypeScript vs JavaScript

| Feature | JavaScript | TypeScript |
|---------|-----------|------------|
| **Typing** | Dynamic | Static (optional) |
| **Compilation** | Interpreted | Compiled to JS |
| **Error Detection** | Runtime | Compile-time |
| **Tooling** | Basic | Advanced (autocomplete, refactoring) |
| **Interfaces** | ❌ | ✅ |
| **Generics** | ❌ | ✅ |
| **Access Modifiers** | ❌ | ✅ (public, private, protected) |
| **Learning Curve** | Easier | Steeper |
| **File Extension** | .js | .ts |

---

## ✅ Benefits of TypeScript

1. **Early Error Detection**: Catch errors during development
2. **Better IDE Support**: Autocomplete, refactoring, navigation
3. **Improved Code Quality**: Type safety prevents common bugs
4. **Enhanced Documentation**: Types serve as documentation
5. **Scalability**: Better for large codebases
6. **Modern Features**: Latest JavaScript features
7. **Refactoring Safety**: Rename with confidence

---

## ⚠️ Disadvantages of TypeScript

1. **Compilation Step**: Extra build process
2. **Learning Curve**: More concepts to learn
3. **Verbosity**: More code to write
4. **Browser Compatibility**: Must compile to JavaScript
5. **Third-party Libraries**: May need type definitions
6. **Setup Overhead**: Configuration required

---

## 🎯 When to Use TypeScript

### Use TypeScript When:
✅ Building large applications  
✅ Working in teams  
✅ Maintaining long-term projects  
✅ Need better IDE support  
✅ Want compile-time error checking  
✅ Using frameworks like Angular

### Use JavaScript When:
✅ Small scripts or prototypes  
✅ Quick projects  
✅ Learning web development  
✅ Simple applications  
✅ Maximum flexibility needed

---

## 💡 Best Practices

1. **Enable Strict Mode**: Use `"strict": true` in tsconfig.json
2. **Avoid `any`**: Use specific types whenever possible
3. **Use Interfaces**: Define clear contracts
4. **Leverage Type Inference**: Don't over-annotate
5. **Use Enums**: For fixed sets of values
6. **Document with Types**: Types serve as documentation
7. **Regular Updates**: Keep TypeScript updated

---

## 🔧 Common Commands

```bash
# Compile TypeScript file
tsc filename.ts

# Compile with specific config
tsc --project tsconfig.json

# Watch mode (auto-compile on changes)
tsc --watch

# Initialize tsconfig.json
tsc --init

# Run TypeScript directly
ts-node filename.ts

# Or with modern Node.js
node filename.ts
```

---

## 📝 Example: Complete TypeScript Program

```typescript
// Employee Management System

interface Employee {
    id: number;
    name: string;
    department: string;
    salary: number;
}

class Company {
    private employees: Employee[] = [];
    
    addEmployee(employee: Employee): void {
        this.employees.push(employee);
        console.log(`Added ${employee.name} to ${employee.department}`);
    }
    
    getEmployeesByDepartment(department: string): Employee[] {
        return this.employees.filter(emp => emp.department === department);
    }
    
    getTotalSalary(): number {
        return this.employees.reduce((total, emp) => total + emp.salary, 0);
    }
    
    displayEmployees(): void {
        console.log("All Employees:");
        this.employees.forEach(emp => {
            console.log(`${emp.id}: ${emp.name} - ${emp.department} - $${emp.salary}`);
        });
    }
}

// Usage
const company = new Company();

company.addEmployee({ id: 1, name: "Alice", department: "IT", salary: 75000 });
company.addEmployee({ id: 2, name: "Bob", department: "HR", salary: 60000 });
company.addEmployee({ id: 3, name: "Charlie", department: "IT", salary: 80000 });

company.displayEmployees();
console.log(`Total Salary: $${company.getTotalSalary()}`);

const itEmployees = company.getEmployeesByDepartment("IT");
console.log(`IT Employees: ${itEmployees.length}`);
```

---

## 🎓 Summary

TypeScript extends JavaScript with:
- ✅ Static type checking
- ✅ Interfaces and type aliases
- ✅ Advanced OOP features
- ✅ Generics for reusable code
- ✅ Better tooling and IDE support
- ✅ Compile-time error detection

**Key Takeaway**: TypeScript helps build more robust, maintainable applications by catching errors early and improving code quality.

---

## 🔗 Resources

- **Official Docs**: https://www.typescriptlang.org/docs/
- **Playground**: https://www.typescriptlang.org/play
- **Type Definitions**: https://www.npmjs.com/~types
- **Learning Path**: TypeScript Handbook

---

**Next Steps**: Practice with small projects, explore advanced types, and integrate TypeScript into your workflow!
