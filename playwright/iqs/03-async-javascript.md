# Async JavaScript — Interview Questions

---

## Q: What is asynchronous programming?

**A:** Asynchronous programming means starting an operation — like an HTTP request, a file read, or a database query — and continuing to run other code without waiting for it to finish. When the operation completes, a callback, Promise chain, or `async/await` continuation handles the result. This is essential in JavaScript because it runs on a single thread — blocking on slow operations would freeze everything else.

---

## Q: What is a Promise and what are its three states?

**A:** A Promise is an object that represents an operation which will complete at some point in the future. It has three possible states:
- **Pending** — the operation has started but not yet completed
- **Fulfilled** — the operation completed successfully with a value
- **Rejected** — the operation failed with a reason (error)

Once a Promise settles (fulfils or rejects), it cannot change state. You handle the results using `.then()` for fulfilment and `.catch()` for rejection.

```javascript
fetch('/api/data')
  .then(response => response.json())
  .then(data => console.log(data))
  .catch(error => console.error(error));
```

---

## Q: What is the event loop?

**A:** The event loop is the mechanism that allows JavaScript to perform non-blocking operations on a single thread. JavaScript has one call stack where code executes. When an async operation finishes, it places its callback in a queue (microtask queue for Promises, task queue for timers/I/O). The event loop constantly checks if the call stack is empty, and if it is, picks the next item from the queue and pushes it onto the stack. This is how async code resumes after a `await` or `.then()`.

---

## Q: What happens if you forget to await a Promise?

**A:** The code continues executing immediately without waiting for the Promise to resolve. The Promise runs in the background and its result or error is silently ignored. In tests, this means your assertions may run before an action completes, producing incorrect results or passing tests that should fail. Playwright's strict mode will warn about some floating Promises, but not all — always `await` everything in test code.

```javascript
// Bug: assertion runs before navigation completes
page.goto('/dashboard'); // missing await
expect(page).toHaveURL('/dashboard'); // asserts prematurely
```

---

## Q: What is Promise.all and when do you use it?

**A:** `Promise.all()` takes an array of Promises and returns a single Promise that resolves when **all** of them resolve, with an array of all the resolved values in the same order. If **any** one of them rejects, `Promise.all` rejects immediately with that error — the other Promises are ignored. Use it when you want to run multiple independent async operations in parallel and need all of their results before proceeding.

```javascript
const [users, orders] = await Promise.all([
  api.get('/users'),
  api.get('/orders')
]);
```

---

## Q: What is the difference between Promise.all and Promise.allSettled?

**A:** `Promise.all` rejects as soon as any one Promise rejects. `Promise.allSettled` waits for every Promise to complete regardless of success or failure, then returns an array of result objects. Each object has a `status` field of `"fulfilled"` or `"rejected"` plus the `value` or `reason`. Use `allSettled` when you want results from all operations even if some fail — for example, running cleanup tasks that should all complete even if some encounter errors.

```javascript
const results = await Promise.allSettled([task1(), task2(), task3()]);
results.forEach(r => {
  if (r.status === 'fulfilled') console.log(r.value);
  else console.error(r.reason);
});
```

---

## Q: What is a floating promise?

**A:** A floating promise is a Promise that is created but neither awaited nor handled. The async operation runs in the background with no error handling. In test code, this is a bug — an unawaited assertion or action runs silently, and any failure is ignored. Tests can pass even when they should fail. Always `await` Promises in tests, and add `.catch()` to Promises you intentionally cannot await.

---

## Q: What is a race condition in async code?

**A:** A race condition occurs when two or more async operations run simultaneously and the outcome depends on which one finishes first. Because the order is not guaranteed, the result can differ between runs. In tests, race conditions typically cause intermittent failures — the test sometimes passes and sometimes fails for no obvious reason. Proper sequencing with `await` and avoiding shared mutable state prevents most race conditions in tests.

---

## Q: How do you handle errors in async functions?

**A:** Use `try/catch` inside an `async` function. Any `await`ed Promise that rejects throws an error, which `catch` handles. You can also chain `.catch()` on individual Promises. Always make sure every async code path has error handling — unhandled rejections produce warnings or crashes in Node.js.

```javascript
async function loadData() {
  try {
    const response = await fetch('/api/data');
    return await response.json();
  } catch (error) {
    console.error('Failed to load data:', error.message);
    throw error;
  }
}
```

---

## Q: What is an unhandled promise rejection?

**A:** An unhandled promise rejection occurs when a Promise rejects and there is no `.catch()` handler or `try/catch` block to catch the error. In Node.js, this emits an `unhandledRejection` event. Newer versions of Node.js terminate the process when this happens. In tests, it signals that an async error is being silently swallowed. Always handle rejections, especially in test setup and teardown code.

---
