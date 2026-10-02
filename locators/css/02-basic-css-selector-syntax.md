## Chapter 2: Basic CSS Selector Syntax

### 2.1 Standard CSS Selector Patterns

**Universal Selector**
```css
* /* Selects all elements */
```

**Type Selector (Tag Name)**
```css
input       /* All input elements */
button      /* All button elements */
div         /* All div elements */
```

**ID Selector**
```css
#username   /* Element with id="username" */
#loginBtn   /* Element with id="loginBtn" */
```
Note: IDs should be unique on a page. The `#` symbol is highly specific and fast.

**Class Selector**
```css
.btn        /* Elements with class="btn" */
.error      /* Elements with class="error" */
.nav-item   /* Elements with class="nav-item" */
```

### 2.2 Combining Selectors

**Element with Class**
```css
button.primary      /* Button with class="primary" */
div.container       /* Div with class="container" */
```

**Element with ID**
```css
input#username      /* Input with id="username" */
button#submit       /* Button with id="submit" */
```

**Element with Multiple Classes**
```css
div.card.active     /* Div with both "card" and "active" classes */
button.btn.btn-lg   /* Button with both "btn" and "btn-lg" classes */
```

**Multiple Selectors (Grouping)**
```css
input, button, select   /* All inputs, buttons, and selects */
.error, .warning        /* All elements with "error" or "warning" class */
```

### 2.3 Attribute Selectors

**Exact Attribute Match**
```css
[type="text"]           /* Elements with type="text" */
[name="username"]       /* Elements with name="username" */
[data-testid="submit"]  /* Elements with data-testid="submit" */
```

**Element with Attribute**
```css
input[type="text"]      /* Input with type="text" */
button[disabled]        /* Button with disabled attribute */
a[href]                 /* Anchor with href attribute */
```

**Attribute Exists**
```css
[required]              /* Elements with required attribute */
[disabled]              /* Elements with disabled attribute */
```

### 2.4 HTML + UI Examples

**HTML**
```html
<div class="login-form">
  <label for="username">Username</label>
  <input id="username" type="text" class="form-control" placeholder="Enter username">
  <label for="password">Password</label>
  <input id="password" type="password" class="form-control">
  <button id="loginBtn" class="btn btn-primary" type="submit">Login</button>
</div>
```

**UI (simplified)**
```text
+---------------------------+
| Username [_____________]  |
| Password [_____________]  |
|        [ Login ]          |
+---------------------------+
```

**CSS Selector Examples for the UI**
```css
#username                   /* Username input by ID */
input[type="password"]      /* Password input by type */
button#loginBtn             /* Login button by ID */
.btn.btn-primary            /* Login button by classes */
input.form-control          /* All form inputs */
.login-form button          /* Button inside login form */
```

---
