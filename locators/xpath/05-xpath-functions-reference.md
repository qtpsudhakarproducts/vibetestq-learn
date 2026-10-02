## Chapter 5: XPath Functions Reference

### 5.1 String Functions
**text()**
```text
//button[text()='Submit']
//div[text()='Welcome User']
```
**normalize-space()**
```text
//div[normalize-space()='Welcome']
//div[normalize-space(text())='Welcome']
```
**contains()**
```text
//div[contains(text(),'Welcome')]
//input[contains(@class,'form-control')]
//div[contains(concat(' ', @class, ' '), ' active ')]  // Exact class match
```
**starts-with()**
```text
//input[starts-with(@id,'user')]
//div[starts-with(@class,'btn-')]
```
**concat()**
```text
//div[contains(concat(' ', @class, ' '), ' active ')]
```
**string-length()**
```text
//input[string-length(@value) > 10]
```
**substring()**
```text
//div[substring(@id, 1, 4)='user']
```
**translate()**
```text
//div[translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')='submit']
```

### 5.2 Node Functions
**count()**
```text
//table[count(tr)=5]
//div[count(*)=3]  // Has exactly 3 children
```
**position()**
```text
//div[position()=2]
//div[position() mod 2 = 1]  // Odd positioned elements
```
**last()**
```text
//div[last()]
//div[position()=last()]
```

### 5.3 Boolean Functions
**boolean()**
```text
//input[boolean(@disabled)]
```
**not()**
```text
//input[not(@disabled)]
//div[not(contains(@class,'hidden'))]
```
**true() and false()**
```text
//input[@disabled=true()]
```

### 5.4 Number Functions
**number()**
```text
//div[number(text()) > 100]
```
**sum()**
```text
//table[sum(tr/td) > 1000]
```
**ceiling(), floor(), round()**
```text
//div[ceiling(number(@data-price)) = 100]
```

---
