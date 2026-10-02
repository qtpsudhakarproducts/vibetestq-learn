# Glossary

---

**401 Unauthorized**
A status code meaning the request had no valid credentials. The server does not know who is asking. Different from 403.

**403 Forbidden**
A status code meaning the caller is authenticated but does not have permission for this resource.

**404 Not Found**
A status code meaning the requested resource does not exist.

**API (Application Programming Interface)**
A contract between two programs that defines how they communicate. In web development, the API lets the frontend talk to the backend. The frontend sends requests in an agreed format. The backend responds in an agreed format.

**API Key**
A static secret string sent on every request to prove the caller is authorised. Can be sent in a request header or as a URL query parameter.

**Basic Auth**
An HTTP authentication scheme where the username and password are Base64-encoded and sent in the `Authorization: Basic ...` header on every request. Requires HTTPS to be secure.

**Base64**
An encoding scheme that converts data into a string of ASCII characters. It is not encryption. Anyone can decode a Base64 string without any key.

**Bearer Token**
A token sent in the `Authorization: Bearer ...` header. The most common type is a JWT.

**Body**
The data payload sent with a request (POST, PUT, PATCH) or returned in a response. Typically formatted as JSON.

**Contract Testing**
A testing approach that verifies an API still returns the exact shape that its consumers depend on. Catches breaking changes before they reach production.

**CMRV**
Create → Modify → Read → Verify. A pattern for testing the full lifecycle of a resource in a single chained API test.

**Cookie**
A small piece of data sent by the server in a `Set-Cookie` response header and stored by the browser. The browser automatically sends it back on subsequent requests to the same domain.

**DELETE**
An HTTP method that removes a resource. Returns 204 No Content on success.

**Endpoint**
A specific URL path that the API exposes. For example, `POST /employees` and `GET /employees/:id` are two endpoints.

**Express.js**
A Node.js web framework for building APIs and web servers.

**Fixture**
A piece of reusable setup code in Playwright that provides a resource to a test and cleans it up afterward. Created with `test.extend()`.

**GET**
An HTTP method that reads data from the server. Does not change any data. Returns 200 on success.

**grant_type**
A parameter in an OAuth token request that specifies the flow to use. Common values: `client_credentials` (machine-to-machine) and `password` (user credentials).

**Header**
Metadata sent alongside an HTTP request or response. Examples: `Content-Type`, `Authorization`, `X-API-Key`.

**HTTP (HyperText Transfer Protocol)**
The protocol that web browsers and APIs use to communicate. Every API request is an HTTP request.

**Idempotent**
An operation that produces the same result when called multiple times as when called once. GET, PUT, and DELETE are idempotent. POST is not.

**In-memory storage**
Storing data in a variable (like a JavaScript array) instead of a database. Data is lost when the server restarts.

**JWT (JSON Web Token)**
A self-contained token in three Base64-encoded parts separated by dots: header, payload, signature. The server signs it with a secret key. The signature prevents tampering.

**JSON (JavaScript Object Notation)**
A text format for representing data as key-value pairs. Used by most web APIs for request and response bodies.

**Middleware**
A function in Express.js that runs on every request before the route handler. Used for authentication, logging, body parsing, and rate limiting.

**OAuth 2.0**
A delegation framework that lets a client application obtain a short-lived access token with specific permissions (scopes). The token is used exactly like a Bearer token.

**Pagination**
Returning API data in pages instead of all at once. Controlled with `limit` and `offset` query parameters. Prevents large payloads.

**PATCH**
An HTTP method that partially updates a resource. Only the fields you send are changed. Omitted fields stay unchanged. Returns 200 on success.

**Path parameter**
A variable part of a URL path that identifies a specific resource. Example: `/employees/emp-001` where `emp-001` is the path parameter.

**Payload**
The data in the body of an HTTP request or response.

**POST**
An HTTP method that creates a new resource. Returns 201 Created on success.

**PUT**
An HTTP method that replaces an entire resource. All fields must be sent. Omitted fields become undefined. Returns 200 on success.

**Query parameter**
A key-value pair appended to a URL after `?`. Used for filtering, sorting, and pagination. Example: `/employees?department=Engineering`.

**rate limiting**
A mechanism that limits how many requests a client can make in a given time window. Returns 429 Too Many Requests when the limit is exceeded.

**`req.body`**
In Express.js, the parsed JSON body of a POST or PUT request. Requires `app.use(express.json())` middleware to populate.

**`req.params`**
In Express.js, the path parameters extracted from the URL. For a route `/employees/:id`, `req.params.id` holds the value.

**`req.query`**
In Express.js, the query string parameters parsed from the URL. For `/employees?department=Engineering`, `req.query.department` is `"Engineering"`.

**refresh token**
A long-lived token returned by some OAuth flows. Used to obtain a new access token when the current one expires, without requiring the user to log in again.

**REST (Representational State Transfer)**
A set of design principles for APIs. Resources are identified by URLs. HTTP methods define the action. Each request is stateless.

**Route**
In Express.js, the combination of an HTTP method and a URL path that maps to a handler function. Example: `app.get('/employees', handler)`.

**Schema**
A definition of the expected structure of a JSON object — its properties, types, required fields, and constraints. Used with Ajv for validation.

**Scope**
In OAuth 2.0, a permission level granted to an access token. Examples: `read`, `write`, `admin`. The token can only do what its scopes allow.

**Session**
Server-side storage of user state after login. Identified by a session ID stored in a cookie. The server looks up the session on every request.

**Sharding**
Splitting a test suite across multiple parallel CI jobs. Each job runs a subset of the tests. Reduces total CI runtime.

**Stateless**
A REST principle meaning the server does not remember previous requests. Each request must include all the information the server needs — including authentication.

**Status code**
A three-digit number in every HTTP response that tells the client what happened. 2xx = success, 4xx = client error, 5xx = server error.

**`test.extend()`**
The Playwright method for creating custom fixtures. Provides a named value to tests and runs cleanup after each test finishes.

---

*End of Glossary*

---

*End of API Testing with Playwright — A Complete Guide*
