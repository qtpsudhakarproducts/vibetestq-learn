# Stage 2 — Numbers & Math

---

## Q13. Write a program to find the factorial of a given number using a loop

```js
function factorial(n) {
    let result = 1;
    // Multiply result by each number from 2 up to n
    // We start at 2 because multiplying by 1 changes nothing
    for (let i = 2; i <= n; i++) {
        result *= i; // same as result = result * i
    }
    return result;
    // factorial(0) = 1 because the loop never runs, result stays 1
}

console.log("factorial(0)  =", factorial(0));
console.log("factorial(1)  =", factorial(1));
console.log("factorial(5)  =", factorial(5));
console.log("factorial(10) =", factorial(10));
```

**Output:**
```
factorial(0)  = 1
factorial(1)  = 1
factorial(5)  = 120
factorial(10) = 3628800
```

---

## Q14. Write a program to find the factorial of a given number using recursion

```js
function factorial(n) {
    // Base case: factorial of 0 or 1 is always 1
    // Without a base case the function would call itself forever
    if (n === 0 || n === 1) return 1;

    // Recursive case: n! = n × (n-1)!
    // Each call reduces n by 1 until it hits the base case
    return n * factorial(n - 1);
}

// How factorial(5) works step by step:
// factorial(5) = 5 × factorial(4)
// factorial(4) = 4 × factorial(3)
// factorial(3) = 3 × factorial(2)
// factorial(2) = 2 × factorial(1)
// factorial(1) = 1  ← base case, starts returning
// Back up: 2×1=2, 3×2=6, 4×6=24, 5×24=120

console.log("factorial(5)  =", factorial(5));
console.log("factorial(10) =", factorial(10));
```

**Output:**
```
factorial(5)  = 120
factorial(10) = 3628800
```

---

## Q15. Write a program to print all odd numbers between 1 and 20 without using modulo operator

```js
// Odd numbers are 1, 3, 5, 7...
// Instead of checking each number with %, start at 1 and jump by 2 each time
// This naturally lands on every odd number
for (let i = 1; i <= 20; i += 2) { // i += 2 means i = i + 2
    process.stdout.write(i + " "); // write without newline
}
console.log(); // add newline at the end
```

**Output:**
```
1 3 5 7 9 11 13 15 17 19
```

---

## Q16. Write a program to find the sum of digits of a given number

```js
function sumOfDigits(n) {
    let sum = 0;
    n = Math.abs(n); // handle negative numbers — Math.abs(-1234) = 1234

    while (n > 0) {
        sum += n % 10;          // n % 10 extracts the LAST digit
                                 // e.g. 1234 % 10 = 4
        n = Math.floor(n / 10); // Math.floor(n/10) removes the LAST digit
                                 // e.g. Math.floor(1234/10) = 123
    }
    // Trace for 1234:
    // step 1: sum = 0+4=4,  n = 123
    // step 2: sum = 4+3=7,  n = 12
    // step 3: sum = 7+2=9,  n = 1
    // step 4: sum = 9+1=10, n = 0 → loop ends
    return sum;
}

console.log("sumOfDigits(1234) =", sumOfDigits(1234)); // 10
console.log("sumOfDigits(9999) =", sumOfDigits(9999)); // 36
console.log("sumOfDigits(100)  =", sumOfDigits(100));  // 1
```

**Output:**
```
sumOfDigits(1234) = 10
sumOfDigits(9999) = 36
sumOfDigits(100)  = 1
```

---

## Q17. Write a program to reverse a number without converting it to a string

```js
function reverseNumber(n) {
    let reversed = 0;
    let isNegative = n < 0;
    n = Math.abs(n); // work with positive version first

    while (n > 0) {
        // Extract the last digit using modulo
        // Then shift reversed left by one position (×10) and add the digit
        // e.g. n=1234: last digit=4, reversed = 0×10+4 = 4
        // e.g. n=123:  last digit=3, reversed = 4×10+3 = 43
        // e.g. n=12:   last digit=2, reversed = 43×10+2 = 432
        // e.g. n=1:    last digit=1, reversed = 432×10+1 = 4321
        reversed = reversed * 10 + (n % 10);
        n = Math.floor(n / 10); // remove last digit
    }

    return isNegative ? -reversed : reversed;
}

console.log("reverseNumber(1234) =", reverseNumber(1234)); // 4321
console.log("reverseNumber(1000) =", reverseNumber(1000)); // 1
console.log("reverseNumber(-567) =", reverseNumber(-567)); // -765
```

**Output:**
```
reverseNumber(1234) = 4321
reverseNumber(1000) = 1
reverseNumber(-567) = -765
```

---

## Q18. Write a program to check whether a given number is an Armstrong number

```js
function isArmstrong(n) {
    const digits = String(n).split(""); // split number into array of digit characters
    const power  = digits.length;       // number of digits determines the power

    // Sum each digit raised to the power of total digit count
    // e.g. 153 → digits=["1","5","3"], power=3
    // sum = 1³ + 5³ + 3³ = 1 + 125 + 27 = 153
    const sum = digits.reduce((acc, d) => acc + Math.pow(Number(d), power), 0);

    if (sum === n) {
        console.log(n + " is an Armstrong number");
    } else {
        console.log(n + " is not an Armstrong number");
    }
}

isArmstrong(153);  // 1³+5³+3³ = 153 ✓
isArmstrong(370);  // 3³+7³+0³ = 370 ✓
isArmstrong(100);  // 1³+0³+0³ = 1 ✗
```

**Output:**
```
153 is an Armstrong number
370 is an Armstrong number
100 is not an Armstrong number
```

---

## Q19. Write a program to print all Armstrong numbers between 1 and 500

```js
function isArmstrong(n) {
    const digits = String(n).split("");
    const power  = digits.length;
    const sum    = digits.reduce((acc, d) => acc + Math.pow(Number(d), power), 0);
    return sum === n;
}

// Check every number from 1 to 500
const result = [];
for (let i = 1; i <= 500; i++) {
    if (isArmstrong(i)) result.push(i);
}
console.log("Armstrong numbers between 1 and 500:");
console.log(result.join(", "));
```

**Output:**
```
Armstrong numbers between 1 and 500:
1, 2, 3, 4, 5, 6, 7, 8, 9, 153, 370, 371, 407
```

---

## Q20. Write a program to check whether a given number is a perfect number

```js
function isPerfect(n) {
    if (n <= 1) {
        console.log(n + " is not a Perfect Number");
        return;
    }
    let sum = 1; // 1 is always a factor of any number > 1

    // Only check up to square root — factors come in pairs
    // e.g. for 28: 2×14, 4×7 — finding 2 also finds 14
    for (let i = 2; i <= Math.sqrt(n); i++) {
        if (n % i === 0) {
            sum += i;           // add the smaller factor
            if (i !== n / i) {  // avoid adding square root twice
                sum += n / i;   // add the paired larger factor
            }
        }
    }

    if (sum === n) {
        console.log(n + " is a Perfect Number");
    } else {
        console.log(n + " is not a Perfect Number");
    }
}

isPerfect(6);   // factors: 1+2+3 = 6 ✓
isPerfect(28);  // factors: 1+2+4+7+14 = 28 ✓
isPerfect(12);  // factors: 1+2+3+4+6 = 16 ✗
```

**Output:**
```
6 is a Perfect Number
28 is a Perfect Number
12 is not a Perfect Number
```

---

## Q21. Write a program to find GCD and LCM of two numbers

```js
function gcd(a, b) {
    // Euclidean algorithm: GCD(a,b) = GCD(b, a%b)
    // Keep replacing a with b and b with a%b until b becomes 0
    // Whatever a is at that point is the GCD
    // e.g. gcd(48, 18): 48%18=12 → gcd(18,12): 18%12=6 → gcd(12,6): 12%6=0 → return 6
    while (b !== 0) {
        let temp = b;
        b = a % b; // remainder when a is divided by b
        a = temp;
    }
    return a;
}

function lcm(a, b) {
    // Formula: LCM = (a × b) / GCD
    // Dividing by GCD first avoids large number overflow
    return (a * b) / gcd(a, b);
}

const pairs = [[12, 18], [48, 18], [4, 6], [15, 25]];
for (const [a, b] of pairs) {
    console.log("GCD(" + a + "," + b + ")=" + gcd(a,b) + "  LCM(" + a + "," + b + ")=" + lcm(a,b));
}
```

**Output:**
```
GCD(12,18)=6  LCM(12,18)=36
GCD(48,18)=6  LCM(48,18)=144
GCD(4,6)=2    LCM(4,6)=12
GCD(15,25)=5  LCM(15,25)=75
```

---

## Q22. Write a program to generate 10 unique random numbers between 1 and 100

```js
function uniqueRandomNumbers(count, min, max) {
    const result = new Set(); // Set automatically rejects duplicate values

    // Keep generating random numbers until we have enough unique ones
    while (result.size < count) {
        const num = Math.floor(Math.random() * (max - min + 1)) + min;
        result.add(num); // if num already exists in Set, it is silently ignored
    }

    return [...result]; // spread Set into an array
}

const numbers = uniqueRandomNumbers(10, 1, 100);
console.log("10 unique random numbers:");
console.log(numbers);
console.log("Count:", numbers.length);
```

**Output:**
```
10 unique random numbers:
[23, 7, 45, 91, 3, 67, 12, 55, 38, 80]  (values differ each run)
Count: 10
```
