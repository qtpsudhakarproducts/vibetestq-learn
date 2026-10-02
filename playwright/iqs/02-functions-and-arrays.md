# Functions & Arrays — Interview Questions

---

## Q: What is a closure?

**A:** A closure is when a function remembers and can access variables from the scope where it was created, even after the outer function that created those variables has finished running. The inner function "closes over" those variables — they stay alive as long as the inner function exists. This is how counters, private state, and many callback patterns maintain data between calls.

```javascript
function makeCounter() {
  let count = 0;
  return function () {
    count++;
    return count;
  };
}
const counter = makeCounter();
counter(); // 1
counter(); // 2
```

---

## Q: What is a callback function?

**A:** A callback is a function passed as an argument to another function, to be called later — either synchronously or asynchronously. `arr.forEach(item => console.log(item))` passes a callback to `forEach`. Callbacks are the foundation of asynchronous JavaScript, though `async/await` has largely replaced deeply nested callback chains ("callback hell") in modern code.

---

## Q: What is the difference between arrow functions and regular functions?

**A:** Arrow functions have a shorter syntax and do not create their own `this`, `arguments` object, or `prototype`. Regular functions create a new `this` context based on how they are called. Arrow functions inherit `this` from the enclosing scope at the time they are written. Arrow functions cannot be used as constructors with `new`.

```javascript
// Regular function — this depends on caller
function greet() { console.log(this.name); }

// Arrow function — this is always from outer scope
const greet = () => console.log(this.name);
```

---

## Q: How does the `this` keyword behave differently in arrow functions?

**A:** In a regular function, `this` is determined at call time — it refers to whichever object invoked the function. In an arrow function, `this` is bound lexically — it always refers to the `this` value from the surrounding code where the arrow function was written. This makes arrow functions reliable inside class methods and callbacks where you want `this` to stay consistent.

```javascript
class Timer {
  start() {
    setTimeout(() => {
      this.tick(); // 'this' correctly refers to Timer instance
    }, 1000);
  }
}
```

---

## Q: When should you avoid using arrow functions?

**A:** Avoid arrow functions when you need a dynamic `this`, such as in object method definitions (where `this` should refer to the object), DOM event handlers (where `this` should refer to the element), or constructor functions. Also avoid them when you need to access the `arguments` object or write a generator function.

---

## Q: What is the difference between map, filter, and reduce?

**A:** `map` transforms each element and returns a new array of the same length. `filter` returns a new array containing only elements that pass a condition — the result can be shorter. `reduce` processes all elements and returns a single accumulated value of any type. In test automation: use `map` to extract values from results, `filter` to find matching items, and `reduce` to compute totals or build objects.

```javascript
const prices = [10, 25, 5, 40];
const doubled = prices.map(p => p * 2);          // [20, 50, 10, 80]
const overTen = prices.filter(p => p > 10);       // [25, 40]
const total   = prices.reduce((sum, p) => sum + p, 0); // 80
```

---

## Q: What is the difference between map and forEach?

**A:** `map` returns a new array with the transformed values — use it when you need the result. `forEach` iterates and returns `undefined` — use it when you only need a side effect like logging or accumulating into an external variable. Never use `forEach` when you need the transformed results; always use `map`.

---

## Q: What is array destructuring?

**A:** Destructuring is a shorthand syntax to unpack values from an array into individual variables. Instead of accessing by index, you name them in position order. You can skip elements and collect the remainder with rest syntax.

```javascript
const [first, , third, ...rest] = [1, 2, 3, 4, 5];
// first = 1, third = 3, rest = [4, 5]
```

---

## Q: What is the spread operator?

**A:** The spread operator (`...`) expands an iterable (array, string, or object) into individual elements. Use it to copy arrays, merge arrays, pass array elements as function arguments, or shallow-copy objects.

```javascript
const a = [1, 2];
const b = [3, 4];
const merged = [...a, ...b];        // [1, 2, 3, 4]
const copy   = { ...obj, age: 30 }; // shallow copy with override
Math.max(...a);                      // 2
```

---

## Q: What is the rest parameter?

**A:** The rest parameter (`...name`) collects all remaining arguments passed to a function into a single array. Unlike spread which expands, rest collects. It must be the last parameter in the function signature.

```javascript
function sum(...numbers) {
  return numbers.reduce((total, n) => total + n, 0);
}
sum(1, 2, 3, 4); // 10
```

---
