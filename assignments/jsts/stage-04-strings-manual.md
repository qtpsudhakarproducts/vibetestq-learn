# Stage 4 — Strings Without Built-in Methods

---

## Q34. Write a program to find the length of a string without using .length property

```js
function strLength(str) {
    let count = 0;
    // for...of iterates one character at a time
    // We simply count each iteration
    for (const char of str) {
        count++;
    }
    return count;
}

console.log(strLength("JavaScript")); // 10
console.log(strLength(""));           // 0 — loop never runs
console.log(strLength("Hello"));      // 5
```

**Output:**
```
10
0
5
```

---

## Q35. Write a program to reverse a string without using split, reverse or join

```js
function reverseStr(str) {
    let reversed = "";
    // Start from the last character and work backwards
    // Concatenate each character to build the reversed string
    for (let i = str.length - 1; i >= 0; i--) {
        reversed += str[i];
    }
    return reversed;
}

console.log(reverseStr("JavaScript")); // tpircSavaJ
console.log(reverseStr("hello"));      // olleh
console.log(reverseStr("12345"));      // 54321
```

**Output:**
```
tpircSavaJ
olleh
54321
```

---

## Q36. Write a program to check whether a string is a palindrome without using reverse

```js
function isPalindrome(str) {
    // Normalize: remove spaces and convert to lowercase for fair comparison
    str = str.toLowerCase().replace(/\s/g, "");

    // Two pointer technique: compare characters from both ends moving inward
    // If any pair doesn't match, it's not a palindrome
    let left  = 0;
    let right = str.length - 1;

    while (left < right) {
        if (str[left] !== str[right]) {
            console.log('"' + str + '" is NOT a Palindrome');
            return;
        }
        left++;  // move right
        right--; // move left
    }
    // If we finish the loop without mismatch, it's a palindrome
    console.log('"' + str + '" is a Palindrome');
}

isPalindrome("racecar");
isPalindrome("hello");
isPalindrome("madam");
isPalindrome("A man a plan a canal Panama"); // after removing spaces → palindrome
```

**Output:**
```
"racecar" is a Palindrome
"hello" is NOT a Palindrome
"madam" is a Palindrome
"amanaplanacanalpanama" is a Palindrome
```

---

## Q37. Write a program to count how many times a character appears in a string without using split, filter or match

```js
function countChar(str, char) {
    let count = 0;
    // Loop through each character position manually
    // Compare lowercase versions so counting is case-insensitive
    for (let i = 0; i < str.length; i++) {
        if (str[i].toLowerCase() === char.toLowerCase()) {
            count++;
        }
    }
    return count;
}

console.log(countChar("sudhakar", "a"));    // 3 — s,u,d,H,A,k,A,R → 3 a's
console.log(countChar("JavaScript", "a"));  // 2 — jAVAscript → 2 a's
console.log(countChar("Hello World", "l")); // 3 — heLLo worLd → 3 l's
```

**Output:**
```
3
2
3
```

---

## Q38. Write a program to convert a string to uppercase without using toUpperCase — use character codes

```js
function toUpperManual(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
        const code = str.charCodeAt(i); // get ASCII code of character

        // Lowercase letters a-z have ASCII codes 97-122
        // Uppercase letters A-Z have ASCII codes 65-90
        // Difference is always 32 — subtracting 32 converts lowercase to uppercase
        if (code >= 97 && code <= 122) {
            result += String.fromCharCode(code - 32); // convert to uppercase
        } else {
            result += str[i]; // leave non-letters unchanged
        }
    }
    return result;
}

// ASCII reference: 'a'=97, 'z'=122, 'A'=65, 'Z'=90
console.log(toUpperManual("hello"));             // HELLO
console.log(toUpperManual("javascript"));        // JAVASCRIPT
console.log(toUpperManual("hello world 123"));   // HELLO WORLD 123
```

**Output:**
```
HELLO
JAVASCRIPT
HELLO WORLD 123
```

---

## Q39. Write a program to remove all spaces from a string without using replace, split or filter

```js
function removeSpaces(str) {
    let result = "";
    // Go through each character one by one
    // Only add it to result if it is NOT a space
    for (let i = 0; i < str.length; i++) {
        if (str[i] !== " ") {
            result += str[i];
        }
    }
    return result;
}

console.log(removeSpaces("Hello World"));             // HelloWorld
console.log(removeSpaces("Quick Test Pro"));          // QuickTestPro
console.log(removeSpaces("  spaces  everywhere  ")); // spaceseverywhere
```

**Output:**
```
HelloWorld
QuickTestPro
spaceseverywhere
```

---

## Q40. Write a program to find the first non-repeating character in a string

```js
function firstNonRepeating(str) {
    const count = {};

    // Pass 1: count how many times each character appears
    for (const char of str) {
        count[char] = (count[char] || 0) + 1;
    }

    // Pass 2: go through the string again in ORDER
    // Return the first character whose count is exactly 1
    // We need two passes because we can't know if a char repeats until we've seen the whole string
    for (const char of str) {
        if (count[char] === 1) return char;
    }

    return null; // all characters repeat
}

// "aabbcde" → a:2, b:2, c:1, d:1, e:1 → first with count 1 is "c"
console.log(firstNonRepeating("aabbcde"));   // c
console.log(firstNonRepeating("aabb"));      // null
console.log(firstNonRepeating("stress"));    // t — s:3,t:1,r:1,e:1 → first unique is t
```

**Output:**
```
c
null
t
```

---

## Q41. Write a program to check if two strings are anagrams without using sort

```js
function isAnagram(str1, str2) {
    // Anagrams must have the same length
    if (str1.length !== str2.length) {
        console.log('"' + str1 + '" and "' + str2 + '" are NOT Anagrams');
        return;
    }

    const count = {};

    // Count characters in first string — increment
    for (const char of str1.toLowerCase()) {
        count[char] = (count[char] || 0) + 1;
    }

    // Subtract using second string — decrement
    // If a character from str2 is not in count, strings aren't anagrams
    for (const char of str2.toLowerCase()) {
        if (!count[char]) {
            console.log('"' + str1 + '" and "' + str2 + '" are NOT Anagrams');
            return;
        }
        count[char]--;
    }

    // If all counts zeroed out, every character matched
    console.log('"' + str1 + '" and "' + str2 + '" are Anagrams');
}

isAnagram("listen", "silent");    // same letters, different order → Anagram
isAnagram("hello", "world");      // different letters → Not Anagram
isAnagram("triangle", "integral"); // same letters rearranged → Anagram
```

**Output:**
```
"listen" and "silent" are Anagrams
"hello" and "world" are NOT Anagrams
"triangle" and "integral" are Anagrams
```

---

## Q42. Write a program to compress a string — aaabbbcc should become a3b3c2

```js
function compress(str) {
    if (str.length === 0) return str;
    let result = "";
    let count  = 1;

    // Compare each character to the next one
    // When they differ, append the character and count (if > 1)
    for (let i = 1; i <= str.length; i++) {
        if (i < str.length && str[i] === str[i - 1]) {
            count++; // same character as previous — increase count
        } else {
            // Different character (or end of string) — write out the accumulated group
            result += str[i - 1] + (count > 1 ? count : ""); // omit count if 1
            count = 1; // reset count for next group
        }
    }

    // Only return compressed version if it is actually shorter
    return result.length < str.length ? result : str;
}

// "aaabbbcc" → a appears 3 times, b appears 3 times, c appears 2 times → "a3b3c2"
console.log(compress("aaabbbcc"));   // a3b3c2
console.log(compress("aabcccdddd")); // a2bc3d4 — single b gets no number
console.log(compress("abcd"));       // abcd — compressed "a1b1c1d1" is longer, return original
console.log(compress("aaaa"));       // a4
```

**Output:**
```
a3b3c2
a2bc3d4
abcd
a4
```

---

## Q43. Write a program to find the longest word in a sentence without using sort

```js
function longestWord(sentence) {
    const words = sentence.trim().split(" ");
    let longest = "";

    // Track the longest word seen so far
    // Replace it whenever a longer word is found
    for (const word of words) {
        if (word.length > longest.length) {
            longest = word;
        }
    }

    return longest;
}

console.log(longestWord("The quick brown fox"));              // quick (5 chars)
console.log(longestWord("I love JavaScript"));               // JavaScript (10 chars)
console.log(longestWord("The best test automation course")); // automation (10 chars)
```

**Output:**
```
quick
JavaScript
automation
```
