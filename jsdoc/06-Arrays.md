# Arrays in JavaScript

## What are Arrays?

Arrays are used to store multiple values in a single variable. They are ordered collections of items that can hold any data type.

## 1. Creating Arrays

### Array Literal Syntax
```javascript
let fruits = ["Apple", "Banana", "Cherry"];
let numbers = [1, 2, 3, 4, 5];
let mixedArray = ["Hello", 42, true, null];

console.log(fruits);     // ["Apple", "Banana", "Cherry"]
console.log(numbers);    // [1, 2, 3, 4, 5]
console.log(mixedArray); // ["Hello", 42, true, null]
```

### Array Constructor (less common)
```javascript
let cars = new Array("Toyota", "Honda", "Ford");
```

## 2. Accessing Array Elements

Array indices start at 0 (zero-based indexing).

```javascript
let fruits = ["Apple", "Banana", "Cherry", "Date"];

console.log(fruits[0]); // "Apple" (first element)
console.log(fruits[1]); // "Banana" (second element)
console.log(fruits[2]); // "Cherry" (third element)
console.log(fruits[3]); // "Date" (fourth element)
```

### Accessing Last Element
```javascript
let lastFruit = fruits[fruits.length - 1];
console.log(lastFruit); // "Date"
```

## 3. Modifying Array Elements

You can change array elements by accessing them via their index.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
fruits[1] = "Blueberry"; // Change "Banana" to "Blueberry"

console.log(fruits); // ["Apple", "Blueberry", "Cherry"]
```

## 4. Array Properties

### length Property
Returns the number of elements in an array.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
console.log(fruits.length); // 3
```

## 5. Array Methods

### Adding Elements

#### push() - Add to End
Adds one or more elements to the end of an array.

```javascript
let fruits = ["Apple", "Banana"];
fruits.push("Cherry");
console.log(fruits); // ["Apple", "Banana", "Cherry"]

fruits.push("Date", "Elderberry");
console.log(fruits); // ["Apple", "Banana", "Cherry", "Date", "Elderberry"]
```

#### unshift() - Add to Beginning
Adds one or more elements to the beginning of an array.

```javascript
let fruits = ["Banana", "Cherry"];
fruits.unshift("Apple");
console.log(fruits); // ["Apple", "Banana", "Cherry"]
```

### Removing Elements

#### pop() - Remove from End
Removes the last element and returns it.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
let lastFruit = fruits.pop();

console.log(lastFruit); // "Cherry"
console.log(fruits);    // ["Apple", "Banana"]
```

#### shift() - Remove from Beginning
Removes the first element and returns it.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
let firstFruit = fruits.shift();

console.log(firstFruit); // "Apple"
console.log(fruits);     // ["Banana", "Cherry"]
```

### Finding Elements

#### indexOf() - Find Index of Element
Returns the first index where element is found, or -1 if not found.

```javascript
let fruits = ["Apple", "Banana", "Cherry", "Banana"];
let index = fruits.indexOf("Cherry");

console.log(index); // 2

let notFound = fruits.indexOf("Mango");
console.log(notFound); // -1
```

#### includes() - Check if Element Exists
Returns true if element exists, false otherwise.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
let hasApple = fruits.includes("Apple");
let hasMango = fruits.includes("Mango");

console.log(hasApple); // true
console.log(hasMango); // false
```

### Array Transformation Methods

#### map() - Transform Each Element
Creates a new array by applying a function to each element.

```javascript
let numbers = [1, 2, 3, 4, 5];
let squaredNumbers = numbers.map(function(num) {
    return num * num;
});

console.log(squaredNumbers); // [1, 4, 9, 16, 25]
```

**With Arrow Function:**
```javascript
let doubled = numbers.map(num => num * 2);
console.log(doubled); // [2, 4, 6, 8, 10]
```

#### filter() - Filter Elements
Creates a new array with elements that pass a test.

```javascript
let numbers = [1, 2, 3, 4, 5, 6, 7, 8];
let evenNumbers = numbers.filter(function(num) {
    return num % 2 === 0;
});

console.log(evenNumbers); // [2, 4, 6, 8]
```

**With Arrow Function:**
```javascript
let oddNumbers = numbers.filter(num => num % 2 !== 0);
console.log(oddNumbers); // [1, 3, 5, 7]
```

#### reduce() - Reduce to Single Value
Reduces array to a single value by applying a function.

```javascript
let numbers = [1, 2, 3, 4, 5];
let sum = numbers.reduce(function(accumulator, currentValue) {
    return accumulator + currentValue;
}, 0);

console.log(sum); // 15
```

**With Arrow Function:**
```javascript
let product = numbers.reduce((acc, num) => acc * num, 1);
console.log(product); // 120
```

### String Conversion Methods

#### join() - Array to String
Joins all elements into a string with a separator.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];
let fruitsString = fruits.join(", ");
console.log(fruitsString); // "Apple, Banana, Cherry"

let withDash = fruits.join(" - ");
console.log(withDash); // "Apple - Banana - Cherry"
```

#### split() - String to Array
Splits a string into an array (string method, but creates arrays).

```javascript
let fruitsString = "Apple, Banana, Cherry";
let fruitsArray = fruitsString.split(", ");
console.log(fruitsArray); // ["Apple", "Banana", "Cherry"]
```

### Sorting and Reversing

#### sort() - Sort Array
Sorts array elements (modifies original array).

```javascript
let fruits = ["Cherry", "Apple", "Banana"];
fruits.sort();
console.log(fruits); // ["Apple", "Banana", "Cherry"]

// Sorting numbers (need comparison function)
let numbers = [5, 2, 9, 1, 5, 6];
numbers.sort(function(a, b) {
    return a - b; // Ascending order
});
console.log(numbers); // [1, 2, 5, 5, 6, 9]
```

**Descending Order:**
```javascript
numbers.sort((a, b) => b - a);
console.log(numbers); // [9, 6, 5, 5, 2, 1]
```

#### reverse() - Reverse Array
Reverses the order of elements (modifies original array).

```javascript
let numbers = [1, 2, 3, 4, 5];
numbers.reverse();
console.log(numbers); // [5, 4, 3, 2, 1]
```

## 6. Looping Through Arrays

### Traditional for Loop
```javascript
let fruits = ["Apple", "Banana", "Cherry"];

for (let i = 0; i < fruits.length; i++) {
    console.log(fruits[i]);
}
```

### for...of Loop
```javascript
for (let fruit of fruits) {
    console.log(fruit);
}
```

### forEach Method
```javascript
fruits.forEach(function(fruit, index) {
    console.log("Index " + index + ": " + fruit);
});
```

## 7. Multidimensional Arrays

Arrays can contain other arrays, creating a matrix or grid structure.

### 2D Array (Matrix)
```javascript
let matrix = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
];

// Accessing elements
console.log(matrix[0][0]); // 1
console.log(matrix[1][2]); // 6
console.log(matrix[2][1]); // 8
```

### Looping Through 2D Array
```javascript
for (let i = 0; i < matrix.length; i++) {
    for (let j = 0; j < matrix[i].length; j++) {
        console.log("Element at (" + i + "," + j + "): " + matrix[i][j]);
    }
}
```

## 8. Finding Max and Min

### Using Math.max() and Math.min()
```javascript
let numbers = [5, 2, 9, 1, 7];

let maxNumber = Math.max(...numbers);
let minNumber = Math.min(...numbers);

console.log("Max: " + maxNumber); // 9
console.log("Min: " + minNumber); // 1
```

The `...` is the spread operator that expands the array.

## 9. Array Destructuring

Extract values from arrays into variables.

```javascript
let fruits = ["Apple", "Banana", "Cherry"];

let [fruit1, fruit2, fruit3] = fruits;

console.log(fruit1); // "Apple"
console.log(fruit2); // "Banana"
console.log(fruit3); // "Cherry"
```

### Skipping Elements
```javascript
let [first, , third] = fruits;
console.log(first);  // "Apple"
console.log(third);  // "Cherry"
```

### Rest Pattern
```javascript
let numbers = [1, 2, 3, 4, 5];
let [first, second, ...rest] = numbers;

console.log(first);  // 1
console.log(second); // 2
console.log(rest);   // [3, 4, 5]
```

## 10. Spread Operator

The spread operator `...` expands an array.

### Copying Arrays
```javascript
let original = [1, 2, 3];
let copy = [...original];

console.log(copy); // [1, 2, 3]
```

### Combining Arrays
```javascript
let arr1 = [1, 2, 3];
let arr2 = [4, 5, 6];
let combined = [...arr1, ...arr2];

console.log(combined); // [1, 2, 3, 4, 5, 6]
```

## 11. Common Array Patterns

### Remove Duplicates
```javascript
let numbers = [1, 2, 2, 3, 4, 4, 5];
let unique = [...new Set(numbers)];
console.log(unique); // [1, 2, 3, 4, 5]
```

### Flatten Array
```javascript
let nested = [[1, 2], [3, 4], [5, 6]];
let flattened = nested.flat();
console.log(flattened); // [1, 2, 3, 4, 5, 6]
```

### Check if All Elements Pass Test
```javascript
let numbers = [2, 4, 6, 8];
let allEven = numbers.every(num => num % 2 === 0);
console.log(allEven); // true
```

### Check if Any Element Passes Test
```javascript
let numbers = [1, 3, 5, 8];
let hasEven = numbers.some(num => num % 2 === 0);
console.log(hasEven); // true
```

## Best Practices

1. **Use `const` for arrays** that won't be reassigned (you can still modify contents)
2. **Use array methods** (map, filter, reduce) instead of loops when possible
3. **Don't create sparse arrays** - arrays with missing indices
4. **Use meaningful names** for arrays (plural nouns like `users`, `products`)
5. **Check array length** before accessing elements to avoid undefined
6. **Use spread operator** for copying arrays to avoid reference issues
7. **Be careful with sort()** - it converts to strings by default

## Summary

- Arrays store multiple values in a single variable
- Access elements using zero-based indices: `array[0]`
- Common methods: `push()`, `pop()`, `shift()`, `unshift()`
- Searching: `indexOf()`, `includes()`
- Transformation: `map()`, `filter()`, `reduce()`
- Sorting: `sort()`, `reverse()`
- Conversion: `join()` (array to string), `split()` (string to array)
- Loop methods: `forEach()`, for...of loop
- Use spread operator `...` for copying and combining arrays
- Arrays can contain any data type, including other arrays
