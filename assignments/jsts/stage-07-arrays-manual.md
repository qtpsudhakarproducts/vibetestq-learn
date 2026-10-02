# Stage 7 — Arrays Without Built-in Methods

---

## Q65. Write a program to reverse an array without using the reverse method

```js
// Method 1: Build a new reversed array
function reverseArray(arr) {
    const result = [];
    // Start from last index and work backwards, pushing each element
    for (let i = arr.length - 1; i >= 0; i--) {
        result.push(arr[i]);
    }
    return result;
}

// Method 2: In-place using two pointers — swap from both ends moving inward
function reverseInPlace(arr) {
    let left  = 0;
    let right = arr.length - 1;
    while (left < right) {
        // Swap arr[left] and arr[right] using destructuring
        let temp    = arr[left];
        arr[left]   = arr[right];
        arr[right]  = temp;
        left++;   // move right pointer
        right--;  // move left pointer
    }
    return arr;
}

console.log(reverseArray([1, 2, 3, 4, 5]));
console.log(reverseArray(["a", "b", "c"]));
console.log(reverseInPlace([1, 2, 3, 4, 5]));
```

**Output:**
```
[5, 4, 3, 2, 1]
["c", "b", "a"]
[5, 4, 3, 2, 1]
```

---

## Q66. Write a program to remove duplicates from an array without using Set or filter

```js
function removeDuplicates(arr) {
    const result = [];
    for (let i = 0; i < arr.length; i++) {
        let found = false;
        // Check if current element already exists in result
        for (let j = 0; j < result.length; j++) {
            if (result[j] === arr[i]) {
                found = true;
                break; // no need to keep checking
            }
        }
        // Only add if not already in result
        if (!found) result.push(arr[i]);
    }
    return result;
}

console.log(removeDuplicates([1, 2, 2, 3, 4, 4, 5]));
console.log(removeDuplicates(["a", "b", "a", "c", "b"]));
```

**Output:**
```
[1, 2, 3, 4, 5]
["a", "b", "c"]
```

---

## Q67. Write a program to find maximum and minimum value in an array without using Math.max or Math.min

```js
function findMax(arr) {
    let max = arr[0]; // assume first element is the max
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] > max) {
            max = arr[i]; // found a bigger number — update max
        }
    }
    return max;
}

function findMin(arr) {
    let min = arr[0]; // assume first element is the min
    for (let i = 1; i < arr.length; i++) {
        if (arr[i] < min) {
            min = arr[i]; // found a smaller number — update min
        }
    }
    return min;
}

const nums = [3, 1, 9, 2, 7, 5];
console.log("Max:", findMax(nums)); // 9
console.log("Min:", findMin(nums)); // 1
```

**Output:**
```
Max: 9
Min: 1
```

---

## Q68. Write a program to sort an array using bubble sort

```js
function bubbleSort(arr) {
    const a = [...arr]; // copy to avoid modifying original
    const n = a.length;

    // Outer loop: n-1 passes through the array
    for (let i = 0; i < n - 1; i++) {
        // Inner loop: compare adjacent pairs
        // After pass i, the largest i+1 elements are at the end
        // So we only need to go up to n-1-i
        for (let j = 0; j < n - 1 - i; j++) {
            if (a[j] > a[j + 1]) {
                // Swap adjacent elements if they are in wrong order
                let temp = a[j];
                a[j]     = a[j + 1];
                a[j + 1] = temp;
                // Larger element "bubbles up" to its correct position
            }
        }
        console.log("After pass " + (i + 1) + ": " + a);
    }
    return a;
}

const result = bubbleSort([64, 34, 25, 12, 22, 11, 90]);
console.log("Final:", result);
```

**Output:**
```
After pass 1: [34, 25, 12, 22, 11, 64, 90]
After pass 2: [25, 12, 22, 11, 34, 64, 90]
After pass 3: [12, 22, 11, 25, 34, 64, 90]
After pass 4: [12, 11, 22, 25, 34, 64, 90]
After pass 5: [11, 12, 22, 25, 34, 64, 90]
After pass 6: [11, 12, 22, 25, 34, 64, 90]
Final: [11, 12, 22, 25, 34, 64, 90]
```

---

## Q69. Write a program to sort an array using selection sort

```js
function selectionSort(arr) {
    const a = [...arr];
    const n = a.length;

    for (let i = 0; i < n - 1; i++) {
        // Assume the current position has the minimum
        let minIdx = i;

        // Scan the rest of the array to find the actual minimum
        for (let j = i + 1; j < n; j++) {
            if (a[j] < a[minIdx]) {
                minIdx = j; // found a smaller element — record its position
            }
        }

        // Swap the found minimum to position i
        if (minIdx !== i) {
            let temp   = a[i];
            a[i]       = a[minIdx];
            a[minIdx]  = temp;
        }
        console.log("Pass " + (i + 1) + ": selected min " + a[i] + " → " + a);
    }
    return a;
}

const result = selectionSort([64, 25, 12, 22, 11]);
console.log("Final:", result);
```

**Output:**
```
Pass 1: selected min 11 → [11, 25, 12, 22, 64]
Pass 2: selected min 12 → [11, 12, 25, 22, 64]
Pass 3: selected min 22 → [11, 12, 22, 25, 64]
Pass 4: selected min 25 → [11, 12, 22, 25, 64]
Final: [11, 12, 22, 25, 64]
```

---

## Q70. Write a program to search for a value in an array using linear search

```js
function linearSearch(arr, target) {
    // Check each element one by one from start to end
    for (let i = 0; i < arr.length; i++) {
        if (arr[i] === target) {
            return i; // found — return the index
        }
    }
    return -1; // not found — convention to return -1
}

const nums = [10, 25, 38, 4, 91, 7];
console.log("Search 38:", linearSearch(nums, 38)); // found at index 2
console.log("Search 99:", linearSearch(nums, 99)); // not found → -1
console.log("Search 10:", linearSearch(nums, 10)); // found at index 0
```

**Output:**
```
Search 38: 2
Search 99: -1
Search 10: 0
```

---

## Q71. Write a program to search for a value in a sorted array using binary search

```js
function binarySearch(arr, target) {
    let left  = 0;
    let right = arr.length - 1;

    // Keep narrowing the search range by half each time
    while (left <= right) {
        const mid = Math.floor((left + right) / 2); // find middle position

        if (arr[mid] === target) {
            return mid; // found!
        } else if (arr[mid] < target) {
            left = mid + 1; // target must be in RIGHT half — discard left half
        } else {
            right = mid - 1; // target must be in LEFT half — discard right half
        }
        // Each iteration cuts the search space in half — very efficient for large arrays
    }

    return -1; // target not found
}

// Array MUST be sorted for binary search to work
const sorted = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
console.log("Search 23:", binarySearch(sorted, 23));  // index 5
console.log("Search 10:", binarySearch(sorted, 10));  // -1
console.log("Search 2: ", binarySearch(sorted, 2));   // index 0
```

**Output:**
```
Search 23: 5
Search 10: -1
Search 2:  0
```

---

## Q72. Write a program to merge two sorted arrays into one sorted array without using sort

```js
function mergeSorted(arr1, arr2) {
    const result = [];
    let i = 0; // pointer for arr1
    let j = 0; // pointer for arr2

    // Compare elements from both arrays — always take the smaller one
    while (i < arr1.length && j < arr2.length) {
        if (arr1[i] <= arr2[j]) {
            result.push(arr1[i++]); // take from arr1, advance arr1 pointer
        } else {
            result.push(arr2[j++]); // take from arr2, advance arr2 pointer
        }
    }

    // Add any remaining elements from arr1 (arr2 is exhausted)
    while (i < arr1.length) result.push(arr1[i++]);

    // Add any remaining elements from arr2 (arr1 is exhausted)
    while (j < arr2.length) result.push(arr2[j++]);

    return result;
}

console.log(mergeSorted([1, 3, 5, 7], [2, 4, 6, 8, 10]));
console.log(mergeSorted([1, 5, 9], [2, 3, 4, 6, 7, 8]));
```

**Output:**
```
[1, 2, 3, 4, 5, 6, 7, 8, 10]
[1, 2, 3, 4, 5, 6, 7, 8, 9]
```
