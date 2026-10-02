# Chapter 9: API Testing

## What is API Testing?

An **API (Application Programming Interface)** is a contract between two software systems. It defines how a client can request data or trigger actions on a server — without needing to know anything about the server's internal implementation.

**API testing** is the process of verifying that this contract is honoured: that the API returns the correct data, in the correct format, with the correct status codes, under all expected and unexpected conditions.

> **Why it matters for manual testers**: Most modern applications are built on APIs. Even if you only ever test through a UI, the UI is calling APIs behind the scenes. Understanding APIs gives you direct access to the application logic — bypassing the UI entirely. This makes your testing faster, deeper, and more reliable.

---

## HTTP Fundamentals

Every API call uses the **HTTP protocol**. Understanding HTTP is non-negotiable for API testing.

### HTTP Request Structure

```
METHOD  /path  HTTP/1.1
Host: api.example.com
Authorization: Bearer <token>
Content-Type: application/json

{ "key": "value" }
```

| Part | Description | Example |
|---|---|---|
| **Method** | The action being requested | `GET`, `POST`, `PUT`, `PATCH`, `DELETE` |
| **URL / Path** | The resource being targeted | `/api/v1/users/42` |
| **Headers** | Metadata about the request | `Authorization`, `Content-Type`, `Accept` |
| **Query Params** | Filters/options appended to URL | `?page=1&limit=20&status=active` |
| **Request Body** | Data sent to the server (POST/PUT/PATCH) | JSON payload |

### HTTP Methods

| Method | Purpose | Has Body? | Idempotent? |
|---|---|---|---|
| **GET** | Retrieve a resource | No | Yes |
| **POST** | Create a new resource | Yes | No |
| **PUT** | Replace an entire resource | Yes | Yes |
| **PATCH** | Partially update a resource | Yes | No |
| **DELETE** | Remove a resource | No | Yes |

> **Idempotent** means calling it multiple times produces the same result. Calling `DELETE /users/42` twice still results in the user being deleted — no double-effect.

### HTTP Response Structure

```
HTTP/1.1 200 OK
Content-Type: application/json

{
  "id": 42,
  "name": "Jane Smith",
  "email": "jane@example.com"
}
```

---

## HTTP Status Codes

Status codes are the most immediate signal of whether an API call succeeded or failed.

| Range | Category | Common Codes |
|---|---|---|
| **2xx** | Success | `200 OK`, `201 Created`, `204 No Content` |
| **3xx** | Redirection | `301 Moved Permanently`, `304 Not Modified` |
| **4xx** | Client Error | `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`, `422 Unprocessable Entity`, `429 Too Many Requests` |
| **5xx** | Server Error | `500 Internal Server Error`, `502 Bad Gateway`, `503 Service Unavailable` |

### Status Code Testing Checklist

- ✅ `200` returned for valid GET requests
- ✅ `201` returned when a resource is successfully created (POST)
- ✅ `204` returned when a resource is deleted (no body expected)
- ✅ `400` returned for malformed request body (missing required fields, wrong data types)
- ✅ `401` returned when no token is provided
- ✅ `403` returned when a valid token lacks permission
- ✅ `404` returned for non-existent resource IDs
- ✅ `409` returned when a duplicate resource is created
- ✅ `422` returned when data fails business validation
- ✅ `500` is never returned for expected error scenarios (it should always be a 4xx if the client caused it)

---

## REST vs GraphQL vs gRPC

| | REST | GraphQL | gRPC |
|---|---|---|---|
| **Data Format** | JSON / XML | JSON | Protocol Buffers (binary) |
| **Endpoints** | One URL per resource (`/users`, `/orders`) | Single endpoint (`/graphql`) | Service methods |
| **Request Style** | Verb + URL | Query / Mutation language | Remote Procedure Call |
| **Over-fetching** | Common (returns full object) | Eliminated (request exact fields) | Eliminated |
| **When used** | Standard web APIs | Complex frontends, mobile (save bandwidth) | High-performance microservices |
| **Testing Tool** | Postman, Bruno, curl | Postman, Insomnia, GraphiQL | Postman, grpcurl, BloomRPC |

---

## API Testing Tools

### Postman

Postman is the industry-standard GUI tool for API testing. Key features for testers:

| Feature | How to use it |
|---|---|
| **Collections** | Group related requests (e.g., all User API requests in one folder) |
| **Environments** | Switch between Dev/QA/Prod URLs and tokens without editing requests |
| **Pre-request scripts** | Run JavaScript before a request (e.g., generate a timestamp, set a variable) |
| **Test scripts** | Write assertions in JavaScript that run after every response |
| **Collection Runner** | Execute all requests in a collection sequentially — basic regression testing |
| **Mock Servers** | Simulate an API before it's built — useful for testing in parallel with development |

**Basic Postman test script example:**

```javascript
// Test: Status code is 200
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

// Test: Response time is under 500ms
pm.test("Response time < 500ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(500);
});

// Test: Response body has expected fields
pm.test("User object has required fields", function () {
    const json = pm.response.json();
    pm.expect(json).to.have.property('id');
    pm.expect(json).to.have.property('email');
    pm.expect(json.email).to.be.a('string');
});

// Test: Save token for use in next request
const token = pm.response.json().access_token;
pm.environment.set("auth_token", token);
```

### Bruno

Bruno is an open-source, offline-first alternative to Postman. Collections are stored as plain files in your repository — no cloud sync required. Gaining rapid adoption in enterprise teams due to data privacy concerns with Postman's cloud model.

### curl (Command Line)

```bash
# GET request with auth header
curl -H "Authorization: Bearer <token>" https://api.example.com/users/42

# POST request with JSON body
curl -X POST https://api.example.com/users \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane", "email": "jane@example.com"}'
```

---

## Authentication & Authorisation Testing

Authentication (who are you?) and authorisation (what are you allowed to do?) are the most security-critical areas of API testing.

### Auth Patterns

| Pattern | How it works | How to test |
|---|---|---|
| **API Key** | Secret key sent in header or query param | Test with missing key, invalid key, expired key |
| **Basic Auth** | `Base64(username:password)` in Authorization header | Test with wrong credentials, empty credentials |
| **Bearer Token (JWT)** | JWT sent as `Authorization: Bearer <token>` | Test with expired token, tampered token, no token |
| **OAuth 2.0** | Access token obtained via separate auth flow | Test token expiry, scope restrictions, refresh flow |
| **Session Cookie** | Server-side session, cookie sent with each request | Test session expiry, cross-user access with stolen cookie |

### Auth Test Cases — Must Have

- Request with no auth header → `401 Unauthorized`
- Request with invalid/fake token → `401 Unauthorized`
- Request with expired token → `401 Unauthorized`
- Request with valid token but insufficient permissions → `403 Forbidden`
- User A's token accessing User B's resource → `403 Forbidden` (IDOR test)
- Admin-only endpoint accessed with a regular user token → `403 Forbidden`

---

## Anatomy of a Good API Test Case

| Field | What to include |
|---|---|
| **Test ID** | TC-API-001 |
| **Endpoint** | `POST /api/v1/users` |
| **Method** | POST |
| **Headers** | `Authorization: Bearer <valid_token>`, `Content-Type: application/json` |
| **Request Body** | `{ "name": "Test User", "email": "test@example.com", "role": "viewer" }` |
| **Expected Status** | `201 Created` |
| **Expected Response** | Body contains `id` (integer), `name` matches input, `email` matches input, `createdAt` is present |
| **Notes** | Token must have `users:create` scope |

---

## Types of API Tests

### 1. Functional Testing
Verify the API does what the contract says.

- **Happy path**: Valid inputs → correct output + correct status code
- **Negative path**: Invalid/missing inputs → correct error status + meaningful error message
- **Edge cases**: Empty strings, null values, maximum field lengths, special characters

### 2. Contract Testing
Verify the API response matches the agreed schema — field names, data types, required vs optional fields, and nested structure.

**Schema validation checklist:**
- ✅ All required fields are present in every response
- ✅ Field data types match the contract (`id` is integer, not string)
- ✅ Nullable fields are handled (`address` can be null, not absent)
- ✅ Arrays are correctly typed (array of objects, not array of strings)
- ✅ No undocumented extra fields are leaking (data exposure risk)

### 3. Negative Testing
Deliberately send bad data to test how the API handles it.

| Test Scenario | Input | Expected |
|---|---|---|
| Missing required field | POST body without `email` | `400` with error message naming the field |
| Wrong data type | `"age": "twenty"` instead of integer | `400` or `422` |
| Oversized input | String of 10,000 characters in a `name` field | `400` or `422`, not `500` |
| SQL injection in field | `"name": "'; DROP TABLE users;"` | `400` or sanitised — never a `500` |
| XSS in field | `"bio": "<script>alert(1)</script>"` | Stored as escaped string, not executed |
| Negative number | `"quantity": -5` | `400` or `422` with validation message |

### 4. Boundary Testing
Apply boundary value analysis to API fields:

- Min/max string lengths
- Min/max numeric values
- Date ranges (past, today, future, far future)
- Array size limits (0 items, 1 item, max items, max+1 items)
- Pagination: `page=0`, `page=1`, `page=last`, `page=last+1`

### 5. Chained Request Testing
Real user flows require multiple API calls in sequence. Test the full chain:

```
1. POST /auth/login          → save access_token
2. POST /api/orders          → create order, save order_id
3. GET  /api/orders/{id}     → verify order was created correctly
4. PATCH /api/orders/{id}    → update order status
5. DELETE /api/orders/{id}   → delete order
6. GET  /api/orders/{id}     → verify 404 after deletion
```

In Postman: use environment variables to pass IDs and tokens between requests in a Collection Runner.

### 6. Performance Smoke Testing
While full load testing requires dedicated tools (k6, JMeter), include basic response time checks in your API tests:

- Simple GET requests: < 200ms
- Search/filter queries: < 500ms
- Complex aggregations: < 2,000ms
- Any endpoint: > 5,000ms is a bug to raise

---

## API Testing with AI

AI tools dramatically accelerate API testing. Here's how:

### Generate Test Cases from API Docs

**Prompt template:**
```
You are a senior QA engineer. Given the following API endpoint specification:

Endpoint: POST /api/v1/orders
Request body:
{
  "productId": integer (required),
  "quantity": integer (required, min: 1, max: 100),
  "deliveryDate": string (required, ISO 8601 format, must be future date),
  "couponCode": string (optional, max 20 chars)
}

Generate a comprehensive test case table with:
- Happy path cases (3)
- Boundary value cases for quantity and deliveryDate (6)
- Negative/validation cases (8)
- Security test cases (3)

Format as a markdown table: ID | Method | Input Summary | Expected Status | Expected Response
```

### Generate Postman Test Scripts

**Prompt template:**
```
Generate a Postman test script (JavaScript) for a GET /users/{id} endpoint that:
1. Asserts status code is 200
2. Asserts response time < 300ms
3. Asserts response body has: id (integer), email (string), name (string), createdAt (ISO date string)
4. Saves the email to an environment variable called "last_user_email"
5. Asserts the id in the response matches the id in the URL path variable
```

### Analyse Response Body for Defects

**Prompt template:**
```
I called GET /api/users/42 and got this response:
[paste response]

The API documentation says the response should contain:
[paste schema]

Identify any discrepancies, missing fields, wrong data types, or unexpected fields.
List as a bug report table: Field | Expected | Actual | Severity
```

### Generate Negative Test Data

**Prompt template:**
```
For a user registration API (POST /users) with fields: name (string, max 100), email (email format), age (integer, 18-120), password (min 8 chars, must have uppercase + number):

Generate 15 invalid input combinations designed to test all validation rules.
Explain what each case is testing and what the expected error message should be.
```

---

## API Testing in the AI-Native SDLC

AI tools integrate directly with API testing workflows:

| Stage | AI Action | Human Action |
|---|---|---|
| **Test design** | Generate test cases from OpenAPI/Swagger spec | Review for business logic gaps |
| **Test data creation** | Generate realistic request payloads (valid + invalid) | Validate data matches real-world constraints |
| **Script writing** | Generate Postman/Bruno test scripts | Review for correctness, add edge cases |
| **Response analysis** | Compare actual vs expected schema, flag anomalies | Investigate root cause of failures |
| **Documentation** | Draft API testing guide from test results | Review accuracy |
| **Regression** | Suggest which tests to run based on changed endpoints | Decide final scope |

### Using MCP for API Testing

With the **Filesystem MCP** server and GitHub Copilot, you can:

```
"Read the OpenAPI spec at docs/api/openapi.yaml and generate a 
Postman collection with test scripts for all GET endpoints. 
Include both happy path and 404 cases."
```

This generates a ready-to-import Postman collection directly from your API specification.

---

## Common API Defects to Look For

| Defect Type | Example | How to Find |
|---|---|---|
| **Wrong status code** | Returns `200` instead of `404` for missing resource | Negative test cases |
| **Missing error message** | `400` with empty body — no explanation | Validation test cases |
| **Data leakage** | Response includes `passwordHash`, `internalId`, or PII not in spec | Schema contract test |
| **IDOR vulnerability** | User A can access User B's data with User B's ID | Auth/authz test cases |
| **Inconsistent field naming** | `userId` in one response, `user_id` in another | Schema consistency check |
| **Missing pagination** | `/users` returns 50,000 records with no limit | Load/large data test |
| **No rate limiting** | Can call `/auth/login` 10,000 times with no throttle | Security test |
| **Verbose error messages** | `500` response includes stack trace or DB query | Error handling test |
| **Stale cache** | GET after DELETE still returns the deleted resource | Chained test cases |
| **Incorrect content-type** | Returns HTML in a JSON endpoint on error | Negative/error test |

---

## Hands-On Exercise

**Scenario**: You are testing a Book Library API. The API documentation says:

`GET /api/books/{id}` — Returns a book by ID
- Response: `{ "id": int, "title": string, "author": string, "isbn": string, "available": boolean }`
- Auth: Bearer token required
- Errors: `401` (no/invalid token), `404` (book not found)

**Tasks**:
1. Write 10 test cases covering: happy path, auth failures, not found, and schema validation
2. Write a Postman test script for the happy path case that validates all 5 response fields
3. Use AI to generate 5 negative test cases for the `id` path parameter (e.g., string ID, 0, -1, very large number, SQL injection)
4. Identify which of the common defect types above are most likely to appear in a GET endpoint
