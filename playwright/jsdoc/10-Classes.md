# Classes in JavaScript

## What are Classes?

Classes are templates for creating objects. They encapsulate data (properties) and behavior (methods) that work on that data. Classes make it easier to create multiple objects with similar structure and functionality.

**Note:** JavaScript classes are built on prototypes but provide cleaner, more intuitive syntax (introduced in ES6).

## 1. Defining a Class

### Basic Class Syntax
```javascript
class ClassName {
    constructor(parameters) {
        // Initialize properties
    }
    
    // Methods
    methodName() {
        // Method code
    }
}
```

### Example: Person Class
```javascript
class Person {
    constructor(name, age) {
        this.name = name; // instance variable/property
        this.age = age;   // instance variable/property
    }
    
    // Method
    greet() {
        console.log(`Hello, my name is ${this.name} and I am ${this.age} years old.`);
    }
}

// Creating an object (instance)
const john = new Person("John", 30);
john.greet(); // Hello, my name is John and I am 30 years old.
```

## 2. Constructor

The constructor is a special method called when creating a new instance of a class.

### Types of Constructors

#### 1. Default Constructor
If no constructor is defined, JavaScript provides a default constructor automatically.

```javascript
class Animal {
    // No constructor defined - default constructor is used
}

const animal = new Animal();
```

#### 2. Parameterized Constructor
A constructor that accepts parameters to initialize object properties.

```javascript
class Car {
    constructor(brand, model) {
        this.brand = brand;
        this.model = model;
    }
}

const myCar = new Car("Toyota", "Corolla");
console.log(`My car is a ${myCar.brand} ${myCar.model}.`);
// My car is a Toyota Corolla.
```

## 3. Private Fields

Private fields are declared with a `#` prefix and are only accessible within the class.

```javascript
class BankAccount {
    #balance; // Private field

    constructor(initialBalance) {
        this.#balance = initialBalance;
    }
    
    deposit(amount) {
        this.#balance += amount;
    }
    
    getBalance() {
        return this.#balance;
    }
}

const myAccount = new BankAccount(1000);
myAccount.deposit(500);
console.log(`My account balance is $${myAccount.getBalance()}.`);
// My account balance is $1500.

// console.log(myAccount.#balance); 
// ERROR: Private field '#balance' must be declared in an enclosing class
```

## 4. Static Methods and Properties

Static members belong to the class itself, not to instances.

### Static Methods
Static methods are called on the class, not on instances.

```javascript
class MathUtil {
    static add(a, b) {
        return a + b;
    }
    
    static multiply(a, b) {
        return a * b;
    }
}

console.log(MathUtil.add(5, 10));      // 15
console.log(MathUtil.multiply(3, 4));  // 12

// Cannot call on instance
// const math = new MathUtil();
// math.add(5, 10); // ERROR: math.add is not a function
```

### Static Properties
```javascript
class Counter {
    static count = 0; // Static property
    
    constructor() {
        Counter.count++;
    }
}

const c1 = new Counter();
const c2 = new Counter();
const c3 = new Counter();

console.log(`Number of Counter instances: ${Counter.count}`); 
// Number of Counter instances: 3
```

## 5. Getters and Setters

Getters and setters provide controlled access to object properties.

### Getter
A getter is called when accessing a property.

```javascript
class Rectangle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    
    get area() {
        return this.width * this.height;
    }
}

const rect = new Rectangle(10, 5);
console.log(`Area of Rectangle: ${rect.area}`); // 50 (called like a property)
```

### Setter
A setter is called when modifying a property.

```javascript
class Rectangle {
    constructor(width, height) {
        this.width = width;
        this.height = height;
    }
    
    get area() {
        return this.width * this.height;
    }
    
    set area(value) {
        // Set width based on area (keeping height constant)
        this.width = value / this.height;
    }
}

const rect = new Rectangle(10, 5);
console.log(`Area: ${rect.area}`); // 50

rect.area = 100; // Calls setter
console.log(`New width: ${rect.width}`); // 20
```

## 6. Inheritance

Inheritance allows a class to inherit properties and methods from another class.

### extends Keyword
```javascript
class Animal {
    speak() {
        console.log("Animal speaks");
    }
}

class Dog extends Animal {
    speak() {
        console.log("Dog barks");
    }
}

const myDog = new Dog();
myDog.speak(); // Dog barks
```

### super Keyword
The `super` keyword is used to call methods from the parent class.

```javascript
class Cat extends Animal {
    speak() {
        super.speak(); // Call parent method
        console.log("Cat meows");
    }
}

const myCat = new Cat();
myCat.speak();
// Output:
// Animal speaks
// Cat meows
```

### Calling Parent Constructor
```javascript
class Employee extends Person {
    constructor(name, age, position) {
        super(name, age); // Call parent constructor
        this.position = position;
    }
    
    getDetails() {
        return `${this.name}, Age: ${this.age}, Position: ${this.position}`;
    }
}

const emp = new Employee("Alice", 28, "Developer");
console.log(emp.getDetails()); 
// Alice, Age: 28, Position: Developer
```

### instanceof Operator
Check if an object is an instance of a class.

```javascript
console.log(emp instanceof Employee); // true
console.log(emp instanceof Person);   // true
console.log(emp instanceof Animal);   // false
```

## 7. Method Overriding

A subclass can provide its own implementation of a parent class method.

```javascript
class Parent {
    showMessage() {
        console.log("Message from Parent");
    }
}

class Child extends Parent {
    showMessage() { // Overriding the method
        console.log("Message from Child");
    }
}

const child = new Child();
child.showMessage(); // Message from Child
```

## 8. Encapsulation with Getters and Setters

Encapsulation means restricting direct access to properties and providing controlled access through methods.

```javascript
class Employee {
    #age; // Private field

    constructor() {
        this.#age = 30;
    }
    
    // Getter
    get Age() {
        return this.#age;
    }
    
    // Setter with validation
    set Age(age) {
        if (age > 65) {
            console.log("Employee age must be less than 65");
        } else if (age < 18) {
            console.log("Employee age must be greater than 18");
        } else {
            this.#age = age;
            console.log("Employee age updated");
        }
    }
}

let e1 = new Employee();
console.log(e1.Age); // 30

e1.Age = 10; // Employee age must be greater than 18
e1.Age = 20; // Employee age updated
e1.Age = 66; // Employee age must be less than 65

console.log(e1.Age); // 20
```

## 9. Class Fields

Class fields allow you to define properties directly in the class body.

```javascript
class User {
    role = "guest";  // Public field
    #password;       // Private field
    
    constructor(username, password) {
        this.username = username;
        this.#password = password;
    }
    
    getPassword() {
        return this.#password;
    }
}

const user = new User("admin", "secret");
console.log(`Username: ${user.username}, Role: ${user.role}`);
// Username: admin, Role: guest

console.log(`Password: ${user.getPassword()}`); // Password: secret
```

## 10. Static Blocks

Static blocks allow complex initialization of static properties.

```javascript
class Config {
    static settings;
    
    static {
        // Complex initialization logic
        this.settings = {
            apiUrl: "https://api.example.com",
            timeout: 5000
        };
    }
}

console.log(Config.settings);
// { apiUrl: 'https://api.example.com', timeout: 5000 }
```

## Method Overloading

JavaScript doesn't support traditional method overloading, but you can simulate it.

### Using Default Parameters
```javascript
class Calculator {
    add(a, b, c = 0) { // c is optional
        return a + b + c;
    }
}

const calc = new Calculator();
console.log(calc.add(5, 10));     // 15
console.log(calc.add(5, 10, 15)); // 30
```

## Best Practices

1. **Use classes for object blueprints** - when you need multiple similar objects
2. **Keep constructors simple** - initialize properties only
3. **Use private fields** (`#`) for sensitive data
4. **Use getters/setters** for controlled property access
5. **Use static methods** for utility functions that don't need instance data
6. **Follow single responsibility** - each class should do one thing well
7. **Use meaningful class names** - nouns that represent entities (User, Product, Employee)
8. **Keep inheritance hierarchies shallow** - deep inheritance is hard to maintain

## Classes vs Constructor Functions

### Old Way (Constructor Functions)
```javascript
function Car(make, model) {
    this.make = make;
    this.model = model;
}

Car.prototype.getDetails = function() {
    return this.make + " " + this.model;
};
```

### Modern Way (Classes)
```javascript
class Car {
    constructor(make, model) {
        this.make = make;
        this.model = model;
    }
    
    getDetails() {
        return this.make + " " + this.model;
    }
}
```

**Benefits of Classes:**
- Cleaner, more readable syntax
- Built-in inheritance with `extends`
- Private fields support
- Static members are clearer
- Easier to understand for developers from other languages

## Summary

- **Classes** are templates for creating objects
- **Constructor** initializes object properties
- **Methods** are functions inside classes
- **Private fields** use `#` prefix for encapsulation
- **Static members** belong to the class, not instances
- **Getters** provide controlled read access (`get propertyName()`)
- **Setters** provide controlled write access (`set propertyName(value)`)
- **Inheritance** uses `extends` keyword
- **super** keyword calls parent class methods
- **Method overriding** allows subclasses to provide their own implementation
- Classes provide cleaner syntax than constructor functions
- Use classes for object-oriented programming in JavaScript
