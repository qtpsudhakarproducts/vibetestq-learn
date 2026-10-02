# Chapter 1 — What Is an API?

---

## What You Will Learn

- What an API is and why it exists
- How HTTP methods work and when to use each one
- What status codes mean and how to read them
- What JSON is and how data travels between client and server
- REST principles that explain how APIs are designed
- What request headers are and why they matter

---

## 1.1 The Problem APIs Solve

A web application has two sides.

The **frontend** is what the user sees — buttons, forms, tables, and text on a screen. The **backend** is the server that stores data, runs calculations, and applies business rules.

These two sides need to talk to each other. When a user clicks "Add Employee", the browser does not save the data itself. It sends a request to the backend. The backend saves the data and sends a response back.

That communication channel is the **API** — Application Programming Interface.

An API is a contract. The frontend agrees to send requests in a specific format. The backend agrees to respond in a specific format. Both sides follow the contract. Neither side needs to know how the other side works internally.

---

## 1.2 HTTP Methods

API requests travel over **HTTP** — the same protocol your browser uses to load web pages. Every request has a **method** that tells the server what action to take.

| Method | What It Does | Real-World Analogy |
|--------|-------------|-------------------|
| GET | Read data | Looking up a record in a filing cabinet |
| POST | Create new data | Adding a new file to the cabinet |
| PUT | Replace existing data | Swapping an entire file for a new one |
| PATCH | Partially update data | Crossing out one line in a file and writing the new value |
| DELETE | Remove data | Removing a file from the cabinet |

**GET is safe.** It only reads. It never changes anything on the server.

**POST is not idempotent.** Sending the same POST twice creates two records. Sending the same GET twice returns the same data both times.

**PUT is idempotent.** Sending the same PUT request ten times results in the same final state as sending it once. The record is replaced with the same data each time.

**PATCH is for small changes.** You only send the fields you want to update. The server merges them with the existing record. Everything you did not send stays unchanged.

**DELETE is idempotent.** Deleting a record that no longer exists returns a 404 — but the end state is the same: the record is gone.

---

## 1.3 Status Codes

Every response comes with a three-digit **status code**. The first digit tells you the category. The full number tells you the detail.

| Range | Category |
|-------|----------|
| 2xx | Success |
| 4xx | Client error — the request was wrong |
| 5xx | Server error — something broke on the server |

**The codes you will see most often:**

| Code | Name | When You See It |
|------|------|-----------------|
| 200 | OK | GET, PUT, PATCH succeeded |
| 201 | Created | POST created a new resource |
| 204 | No Content | DELETE succeeded — no body returned |
| 400 | Bad Request | Invalid or missing data in the request |
| 401 | Unauthorized | No valid credentials were provided |
| 403 | Forbidden | Credentials are valid but access is denied |
| 404 | Not Found | The resource does not exist |
| 409 | Conflict | Duplicate data — e.g. email already exists |
| 422 | Unprocessable Entity | Data was received but failed business rules |
| 429 | Too Many Requests | Rate limit reached |
| 500 | Internal Server Error | Something broke on the server |

**The most common beginner mistake:** expecting `200` from a POST request. When you create a resource, the server returns `201 Created` — not 200.

---

## 1.4 JSON

Data travels between client and server as **JSON** — JavaScript Object Notation. It is a text format that uses key-value pairs.

```json
{
  "id": "emp-001",
  "firstName": "Sarah",
  "lastName": "Connor",
  "email": "sarah.connor@company.com",
  "department": "Engineering",
  "role": "Senior Engineer",
  "createdAt": "2025-03-10T09:00:00Z"
}
```

Notice `id` and `createdAt`. The client never sends these. The server generates them. This pattern appears in every real API — server-generated fields are created on the server side and returned in the response. Never hardcode them in a test.

JSON always has a **key** (in double quotes) and a **value** (string, number, boolean, array, or object).

---

## 1.5 REST Principles

Most modern APIs follow **REST** — Representational State Transfer. REST is not a standard — it is a set of design principles. Understanding them helps you predict how an API behaves before you even read the documentation.

**Principle 1 — Statelessness**

Each request must contain everything the server needs to process it. The server does not remember previous requests. If a request needs authentication, it must include the credentials every time.

This is why Bearer tokens and API keys are sent on every request — not just the first one.

**Principle 2 — Resources and URLs**

Everything is a resource. Resources have URLs. The URL identifies the resource, not the action.

```
/employees          ← the collection of all employees
/employees/emp-001  ← a specific employee
```

The HTTP method tells the server what action to take on that resource. You do not write `/createEmployee` or `/deleteEmployee` — you write `POST /employees` and `DELETE /employees/emp-001`.

**Principle 3 — Idempotency**

An operation is idempotent if calling it multiple times produces the same result as calling it once. GET, PUT, and DELETE are idempotent. POST is not.

As a tester, idempotency means:
- You can safely retry GET and DELETE in a test without creating side effects.
- You should not retry POST — it creates a new record each time.

---

## 1.6 Request Headers

Headers are metadata that travel with every HTTP request and response. They are key-value pairs that tell the server — or the client — extra information about the request.

**Headers you will see in tests:**

| Header | What It Does |
|--------|-------------|
| `Content-Type: application/json` | Tells the server the request body is JSON |
| `Accept: application/json` | Tells the server what format the client wants back |
| `Authorization: Bearer <token>` | Sends a JWT or OAuth token |
| `X-API-Key: key-abc-123` | Sends an API key |
| `Cache-Control: no-cache` | Tells the server not to return a cached response |
| `X-Request-ID: abc-123` | A unique ID for tracing a request through logs |

When Playwright's `request.post()` is called with `data:`, it automatically sets `Content-Type: application/json`. You do not need to set it manually.

---

## Interview Questions — Chapter 1

**Q1. What is an API?**

An API (Application Programming Interface) is a contract between two programs. It defines how they communicate. In web development, an API lets the frontend (browser) talk to the backend (server). The frontend sends a request in the agreed format. The backend sends a response in the agreed format.

**Q2. What is REST?**

REST (Representational State Transfer) is a set of design principles for building APIs. A REST API organises everything as resources identified by URLs. HTTP methods (GET, POST, PUT, DELETE) define what action to take on a resource. Each request must contain all the information the server needs — the server does not remember previous requests.

**Q3. What is the difference between GET and POST?**

GET reads data from the server. It does not change anything. POST creates a new resource on the server. GET is idempotent — calling it multiple times returns the same result. POST is not idempotent — calling it twice creates two records.

**Q4. What status code does a successful POST return?**

201 Created — not 200. The 200 OK code means a request succeeded. 201 specifically means a new resource was created. Tests that expect 200 from a POST will fail against a correctly built API.

**Q5. What is the difference between 401 and 403?**

401 Unauthorized means the request had no valid credentials — the server does not know who is asking. 403 Forbidden means the server knows who is asking but is refusing the request. The user is authenticated but does not have permission.

**Q6. What does idempotent mean in the context of HTTP methods?**

An operation is idempotent if calling it multiple times produces the same result as calling it once. GET, PUT, and DELETE are idempotent. POST is not — sending the same POST twice creates two resources.

**Q7. What is the difference between PUT and PATCH?**

PUT replaces the entire resource. You must send all fields. Any field you omit becomes undefined in the stored record. PATCH updates only the fields you send. Omitted fields stay unchanged. Use PUT when replacing a full record. Use PATCH when changing one or two specific fields.

**Q8. What is a request header? Give two examples relevant to API testing.**

A request header is metadata sent alongside a request. It gives the server extra information about the request. Two common examples: `Content-Type: application/json` tells the server the body is JSON. `Authorization: Bearer <token>` sends an authentication token with the request.

**Q9. What does statelessness mean in REST?**

Statelessness means the server does not remember previous requests. Each request must include everything the server needs — including authentication credentials. This is why tokens and API keys are sent on every request, not just the first one.

**Q10. What is JSON and why is it used in APIs?**

JSON (JavaScript Object Notation) is a text format for representing data as key-value pairs. It is used in APIs because it is human-readable, lightweight, and supported by every programming language. Both the client and server can parse and generate JSON with built-in tools.

---
