# Objects in JavaScript

## What are Objects?

An object is a collection of properties, where each property is an association between a name (key) and a value. Objects are used to store multiple related values in a single variable, representing real-world entities.

## 1. Creating Objects

### Object Literal Syntax (Most Common)
```javascript
let person = {
    name: "Alice",
    age: 25,
    city: "Wonderland"
};

console.log(person);
// { name: 'Alice', age: 25, city: 'Wonderland' }
```

### Empty Object
```javascript
let emptyObj = {};
```

### Object with Different Data Types
```javascript
let user = {
    username: "john_doe",
    age: 30,
    isActive: true,
    email: null
};
```

## 2. Accessing Object Properties

### Dot Notation
```javascript
let person = {
    name: "Alice",
    age: 25,
    city: "Wonderland"
};

console.log(person.name); // "Alice"
console.log(person.age);  // 25
console.log(person.city); // "Wonderland"
```

### Bracket Notation
```javascript
console.log(person["name"]); // "Alice"
console.log(person["age"]);  // 25
```

**When to Use Bracket Notation:**
- Property name has spaces or special characters
- Property name is in a variable
- Property name is dynamic

```javascript
let property = "age";
console.log(person[property]); // 25

let data = {
    "first name": "John",
    "last-name": "Doe"
};

console.log(data["first name"]); // "John"
console.log(data["last-name"]);  // "Doe"
```

## 3. Modifying Object Properties

### Changing Existing Properties
```javascript
let person = {
    name: "Alice",
    age: 25,
    city: "Wonderland"
};

person.age = 26;
person["city"] = "New Wonderland";

console.log(person);
// { name: 'Alice', age: 26, city: 'New Wonderland' }
```

### Adding New Properties
```javascript
person.country = "Fantasy Land";
person["occupation"] = "Developer";

console.log(person);
// { name: 'Alice', age: 26, city: 'New Wonderland', 
//   country: 'Fantasy Land', occupation: 'Developer' }
```

### Deleting Properties
```javascript
delete person.city;

console.log(person);
// { name: 'Alice', age: 26, country: 'Fantasy Land', occupation: 'Developer' }
```

## 4. Objects with Different Data Types

### Mixed Data Types
```javascript
let mixedObject = {
    stringProp: "Hello",
    numberProp: 42,
    booleanProp: true,
    nullProp: null,
    undefinedProp: undefined
};

console.log(mixedObject);
```

### Object with Array Property
```javascript
let person = {
    name: "Bob",
    hobbies: ["Reading", "Traveling", "Gaming"]
};

console.log(person.hobbies);    // ["Reading", "Traveling", "Gaming"]
console.log(person.hobbies[0]); // "Reading"
```

### Nested Objects
```javascript
let company = {
    name: "Tech Corp",
    address: {
        street: "123 Tech Lane",
        city: "Innovation City",
        zip: "45678"
    }
};

console.log(company.address);        // { street: '123 Tech Lane', ... }
console.log(company.address.city);   // "Innovation City"
console.log(company.address.street); // "123 Tech Lane"
```

## 5. Object Methods

Methods are functions defined inside an object.

### Defining Methods
```javascript
let calculator = {
    add: function(a, b) {
        return a + b;
    },
    subtract: function(a, b) {
        return a - b;
    }
};

console.log(calculator.add(5, 3));      // 8
console.log(calculator.subtract(10, 4)); // 6
```

### Shorthand Method Syntax (ES6)
```javascript
let calculator = {
    add(a, b) {
        return a + b;
    },
    subtract(a, b) {
        return a - b;
    }
};
```

## 6. The `this` Keyword

`this` refers to the current object.

### Example
```javascript
let rectangle = {
    width: 10,
    height: 5,
    area: function() {
        return this.width * this.height;
    },
    perimeter: function() {
        return 2 * (this.width + this.height);
    }
};

console.log(rectangle.area());      // 50
console.log(rectangle.perimeter()); // 30
```

### Accessing Other Properties with `this`
```javascript
let person = {
    firstName: "John",
    lastName: "Doe",
    fullName: function() {
        return this.firstName + " " + this.lastName;
    }
};

console.log(person.fullName()); // "John Doe"
```

## 7. Looping Through Object Properties

### for...in Loop
```javascript
let person = {
    name: "Alice",
    age: 25,
    city: "Wonderland"
};

for (let key in person) {
    console.log(key + ": " + person[key]);
}
// Output:
// name: Alice
// age: 25
// city: Wonderland
```

### Object.keys()
Returns an array of property names (keys).

```javascript
let keys = Object.keys(person);
console.log(keys); // ["name", "age", "city"]

// Loop through keys
keys.forEach(key => {
    console.log(key + ": " + person[key]);
});
```

### Object.values()
Returns an array of property values.

```javascript
let values = Object.values(person);
console.log(values); // ["Alice", 25, "Wonderland"]
```

### Object.entries()
Returns an array of [key, value] pairs.

```javascript
let entries = Object.entries(person);
console.log(entries);
// [["name", "Alice"], ["age", 25], ["city", "Wonderland"]]

// Loop through entries
entries.forEach(([key, value]) => {
    console.log(key + ": " + value);
});
```

## 8. JSON (JavaScript Object Notation)

JSON is a text format for storing and transporting data.

### Converting Object to JSON String
```javascript
let person = {
    name: "Charlie",
    age: 30,
    city: "Metropolis"
};

let jsonString = JSON.stringify(person);
console.log(jsonString);
// '{"name":"Charlie","age":30,"city":"Metropolis"}'

console.log(typeof jsonString); // "string"
```

### Converting JSON String to Object
```javascript
let jsonString = '{"name":"Charlie","age":30,"city":"Metropolis"}';

let parsedObject = JSON.parse(jsonString);
console.log(parsedObject);
// { name: 'Charlie', age: 30, city: 'Metropolis' }

console.log(parsedObject.name); // "Charlie"
```

## 9. Object Constructor Function

A constructor is a special function used to create multiple instances of similar objects.

### Syntax
```javascript
function ConstructorName(param1, param2) {
    this.property1 = param1;
    this.property2 = param2;
}
```

### Example: Car Constructor
```javascript
function Car(make, model, year) {
    this.make = make;
    this.model = model;
    this.year = year;
}

let myCar = new Car("Toyota", "Corolla", 2020);
let yourCar = new Car("Honda", "Civic", 2021);

console.log(myCar);
// Car { make: 'Toyota', model: 'Corolla', year: 2020 }

console.log(yourCar.make);  // "Honda"
console.log(yourCar.model); // "Civic"
```

## 10. Object Prototypes

Prototypes allow you to add properties and methods to all instances of a constructor.

### Adding Methods to Prototype
```javascript
function Car(make, model, year) {
    this.make = make;
    this.model = model;
    this.year = year;
}

Car.prototype.getDetails = function() {
    return this.year + " " + this.make + " " + this.model;
};

let myCar = new Car("Toyota", "Corolla", 2020);
console.log(myCar.getDetails()); // "2020 Toyota Corolla"
```

**Benefits of Prototypes:**
- Methods are shared among all instances (memory efficient)
- Can add methods after instances are created
- All instances automatically get the new methods

```javascript
let car1 = new Car("Ford", "Mustang", 2022);
let car2 = new Car("Tesla", "Model 3", 2023);

// Add method to prototype after creating instances
Car.prototype.getAge = function() {
    return new Date().getFullYear() - this.year;
};

console.log(car1.getAge()); // Works on existing instances!
console.log(car2.getAge()); // Works here too!
```

## 11. Checking Properties

### hasOwnProperty()
```javascript
let person = {
    name: "Alice",
    age: 25
};

console.log(person.hasOwnProperty("name"));     // true
console.log(person.hasOwnProperty("salary"));   // false
```

### in Operator
```javascript
console.log("name" in person);   // true
console.log("salary" in person); // false
```

## 12. Object Destructuring

Extract properties from objects into variables.

### Basic Destructuring
```javascript
let person = {
    name: "Alice",
    age: 25,
    city: "Wonderland"
};

let { name, age, city } = person;

console.log(name); // "Alice"
console.log(age);  // 25
console.log(city); // "Wonderland"
```

### Renaming Variables
```javascript
let { name: personName, age: personAge } = person;

console.log(personName); // "Alice"
console.log(personAge);  // 25
```

### Default Values
```javascript
let { name, age, country = "Unknown" } = person;

console.log(country); // "Unknown" (person doesn't have country property)
```

## 13. Copying Objects

### Shallow Copy with Spread Operator
```javascript
let original = {
    name: "Alice",
    age: 25
};

let copy = { ...original };

console.log(copy); // { name: 'Alice', age: 25 }

// Modifying copy doesn't affect original
copy.age = 30;
console.log(original.age); // 25
console.log(copy.age);     // 30
```

### Object.assign()
```javascript
let copy = Object.assign({}, original);
```

## Best Practices

1. **Use object literals** for simple objects
2. **Use meaningful property names**
3. **Use dot notation** when possible for better readability
4. **Use constructor functions or classes** for creating multiple similar objects
5. **Keep objects focused** - each object should represent one thing
6. **Use const for objects** that won't be reassigned
7. **Use destructuring** to extract multiple properties cleanly

## Summary

- Objects store collections of key-value pairs
- Access properties with dot notation (`obj.prop`) or bracket notation (`obj["prop"]`)
- Objects can contain any data type, including arrays and other objects
- Methods are functions defined inside objects
- Use `this` to reference the current object
- Loop through objects with `for...in` or Object.keys/values/entries
- JSON.stringify() converts objects to JSON strings
- JSON.parse() converts JSON strings to objects
- Constructor functions create multiple instances of similar objects
- Prototypes allow sharing methods across all instances
- Object destructuring extracts properties into variables
