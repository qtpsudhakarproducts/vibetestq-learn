# Stage 15 — Working with Dates & Time

---

## Q145. Write a program to create a Date object and read its individual parts

```js
const now = new Date();
console.log("Full date:  ", now.toString());
console.log("Year:       ", now.getFullYear());
// getMonth() returns 0-11 (January=0) — always add 1 for display
console.log("Month:      ", now.getMonth() + 1);  // getMonth() is 0-indexed
console.log("Day:        ", now.getDate());
console.log("Hours:      ", now.getHours());
console.log("Minutes:    ", now.getMinutes());
console.log("Seconds:    ", now.getSeconds());
console.log("Day of week:", now.getDay());         // 0=Sun, 6=Sat
```

**Output:**
```
Full date:   Wed May 07 2025 14:30:45
Year:        2025
Month:       5
Day:         7
Hours:       14
Minutes:     30
Seconds:     45
Day of week: 3
```

---

## Q146. Write a program to format a date as DD-MM-YYYY

```js
function formatDDMMYYYY(date) {
    // Ensure single digit days/months get leading zero: 5 → "05"
    const day   = String(date.getDate()).padStart(2, "0");
    // getMonth() returns 0-11 (January=0) — always add 1 for display
    // Ensure single digit days/months get leading zero: 5 → "05"
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year  = date.getFullYear();
    return day + "-" + month + "-" + year;
}

console.log(formatDDMMYYYY(new Date()));
console.log(formatDDMMYYYY(new Date("2024-01-05")));
console.log(formatDDMMYYYY(new Date("2024-12-25")));
```

**Output:**
```
07-05-2025
05-01-2024
25-12-2024
```

---

## Q147. Write a program to format date and time as YYYY-MM-DD_HH-MM-SS for file naming

```js
function fileNameTimestamp(date) {
    const yyyy = date.getFullYear();
    // getMonth() returns 0-11 (January=0) — always add 1 for display
    // Ensure single digit days/months get leading zero: 5 → "05"
    const mm   = String(date.getMonth() + 1).padStart(2, "0");
    // Ensure single digit days/months get leading zero: 5 → "05"
    const dd   = String(date.getDate()).padStart(2, "0");
    // Ensure single digit days/months get leading zero: 5 → "05"
    const hh   = String(date.getHours()).padStart(2, "0");
    // Ensure single digit days/months get leading zero: 5 → "05"
    const min  = String(date.getMinutes()).padStart(2, "0");
    // Ensure single digit days/months get leading zero: 5 → "05"
    const ss   = String(date.getSeconds()).padStart(2, "0");
    return yyyy + "-" + mm + "-" + dd + "_" + hh + "-" + min + "-" + ss;
}

const ts = fileNameTimestamp(new Date());
console.log("Timestamp:       ", ts);
console.log("Report filename: ", "test-report_" + ts + ".html");
```

**Output:**
```
Timestamp:        2025-05-07_14-30-45
Report filename:  test-report_2025-05-07_14-30-45.html
```

---

## Q148. Write a program to find the difference between two dates in days

```js
function daysBetween(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    // Dates subtract as timestamps (milliseconds since epoch)
    const diffMs = Math.abs(d2 - d1);
    // Convert milliseconds to days: 1000ms × 60s × 60min × 24hr
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

console.log(daysBetween("2024-01-01", "2024-01-15") + " days");
console.log(daysBetween("2024-01-01", "2024-03-15") + " days");
console.log(daysBetween("2024-01-01", "2025-01-01") + " days");
```

**Output:**
```
14 days
74 days
366 days
```

---

## Q149. Write a program to add days to a date

```js
function addDays(date, n) {
    const result = new Date(date);
    result.setDate(result.getDate() + n);
    return result.toISOString().split("T")[0];
}

console.log(addDays(new Date("2024-01-25"), 7));
console.log(addDays(new Date("2024-12-28"), 7));
console.log(addDays(new Date("2024-02-25"), 5));
```

**Output:**
```
2024-02-01
2025-01-04
2024-03-01
```

---

## Q150. Write a program to subtract days from a date

```js
function subtractDays(date, n) {
    const result = new Date(date);
    result.setDate(result.getDate() - n);
    return result.toISOString().split("T")[0];
}

console.log(subtractDays(new Date("2024-03-01"), 5));
console.log(subtractDays(new Date("2024-01-05"), 10));
console.log(subtractDays(new Date("2024-01-01"), 30));
```

**Output:**
```
2024-02-25
2023-12-26
2023-12-02
```

---

## Q151. Write a program to compare two dates

```js
function compareDates(d1, d2) {
    const date1 = new Date(d1);
    const date2 = new Date(d2);
    if (date1 < date2) console.log(d1 + " is EARLIER than " + d2);
    else if (date1 > date2) console.log(d1 + " is LATER than " + d2);
    else console.log(d1 + " and " + d2 + " are the SAME date");
}

function isSameDay(d1, d2) {
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth()    === d2.getMonth()    &&
           d1.getDate()     === d2.getDate();
}

compareDates("2024-01-01", "2024-06-01");
compareDates("2024-06-01", "2024-01-01");
compareDates("2024-01-01", "2024-01-01");

console.log(isSameDay(new Date("2024-01-01T09:00"), new Date("2024-01-01T23:00")));
console.log(isSameDay(new Date("2024-01-01"), new Date("2024-01-02")));
```

**Output:**
```
2024-01-01 is EARLIER than 2024-06-01
2024-06-01 is LATER than 2024-01-01
2024-01-01 and 2024-01-01 are the SAME date
true
false
```

---

## Q152. Write a program to check if a given date falls on a weekend

```js
function isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6;
}

console.log("2024-01-06:", isWeekend("2024-01-06"));  // Saturday
console.log("2024-01-07:", isWeekend("2024-01-07"));  // Sunday
console.log("2024-01-08:", isWeekend("2024-01-08"));  // Monday
console.log("2024-12-25:", isWeekend("2024-12-25"));  // Wednesday
```

**Output:**
```
2024-01-06: true
2024-01-07: true
2024-01-08: false
2024-12-25: false
```

---

## Q153. Write a program to find the day name for a given date

```js
function getDayName(date) {
    const days = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return days[new Date(date).getDay()];
}

console.log(getDayName("2024-12-25"));
console.log(getDayName("2024-01-01"));
console.log(getDayName("2025-05-07"));
```

**Output:**
```
Wednesday
Monday
Wednesday
```

---

## Q154. Write a program to get the first and last day of the current month

```js
function getMonthBoundaries(date) {
    const d = new Date(date);
    const first = new Date(d.getFullYear(), d.getMonth(), 1);
    // getMonth() returns 0-11 (January=0) — always add 1 for display
    const last  = new Date(d.getFullYear(), d.getMonth() + 1, 0);
    const fmt = d => String(d.getDate()).padStart(2,"0") + "-" + String(d.getMonth()+1).padStart(2,"0") + "-" + d.getFullYear();
    console.log("First:", fmt(first), "| Last:", fmt(last));
}

getMonthBoundaries(new Date("2024-02-15"));
getMonthBoundaries(new Date("2024-01-01"));
getMonthBoundaries(new Date("2024-04-20"));
```

**Output:**
```
First: 01-02-2024 | Last: 29-02-2024
First: 01-01-2024 | Last: 31-01-2024
First: 01-04-2024 | Last: 30-04-2024
```

---

## Q155. Write a program to measure how long a function takes using Date.now()

```js
function measureTime(fn, label) {
    const start = Date.now();
    fn();
    const end = Date.now();
    console.log(label + ": took " + (end - start) + "ms");
}

measureTime(() => {
    const arr = Array.from({ length: 100000 }, () => Math.random());
    arr.sort((a, b) => a - b);
}, "Sort 100k numbers");

measureTime(() => {
    let s = "";
    for (let i = 0; i < 10000; i++) s += "x";
}, "String concat 10k");
```

**Output:**
```
Sort 100k numbers: took 45ms
String concat 10k: took 12ms
```

---

// performance.now() gives sub-millisecond precision, unaffected by clock changes
## Q156. Write a program to measure execution time using performance.now() and compare with Date.now()

```js
function measurePrecise(fn, label) {
    // performance.now() gives sub-millisecond precision, unaffected by clock changes
    const t1 = performance.now();
    fn();
    // performance.now() gives sub-millisecond precision, unaffected by clock changes
    const t2 = performance.now();
    console.log(label + ": " + (t2 - t1).toFixed(3) + "ms");
}

function measureRough(fn, label) {
    const t1 = Date.now();
    fn();
    const t2 = Date.now();
    console.log(label + ": " + (t2 - t1) + "ms");
}

const work = () => { let x = 0; for (let i = 0; i < 1000000; i++) x += i; };

measureRough(work,   "Date.now()        ");
// performance.now() gives sub-millisecond precision, unaffected by clock changes
measurePrecise(work, "performance.now() ");
```

**Output:**
```
Date.now():         4ms
// performance.now() gives sub-millisecond precision, unaffected by clock changes
performance.now():  3.821ms
```

---

// console.time/timeEnd is the simplest way to measure a block of code
## Q157. Write a program to measure code execution using console.time and console.timeEnd

```js
// console.time/timeEnd is the simplest way to measure a block of code
console.time("operation-1");
let sum = 0;
for (let i = 0; i < 100000; i++) sum += i;
// console.time/timeEnd is the simplest way to measure a block of code
console.timeEnd("operation-1");

// console.time/timeEnd is the simplest way to measure a block of code
console.time("operation-2");
const arr = Array.from({ length: 10000 }, () => Math.random());
arr.sort((a, b) => a - b);
// console.time/timeEnd is the simplest way to measure a block of code
console.timeEnd("operation-2");

// console.time/timeEnd is the simplest way to measure a block of code
console.time("operation-3");
JSON.parse(JSON.stringify({ a: 1, b: { c: 2, d: [1,2,3] } }));
// console.time/timeEnd is the simplest way to measure a block of code
console.timeEnd("operation-3");
```

**Output:**
```
operation-1: 2.341ms
operation-2: 8.123ms
operation-3: 0.045ms
```
