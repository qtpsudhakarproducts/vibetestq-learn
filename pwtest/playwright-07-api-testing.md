---
# Part 07: API Testing with the request Fixture
> 📂 Playwright Test Framework Notes — Part 07 of 11

## 8. API Testing with the request Fixture

### 8.1 Why API Testing in Playwright?

Playwright isn't just for browser automation — its built-in `request` fixture lets you test REST APIs directly without a browser.

**Use cases in test automation:**
- Test your API endpoints independently (pure API tests)
- Set up test data via API before UI tests (much faster than UI setup)
- Verify API responses after UI actions (double-check data was saved)
- Clean up test data via API after tests

---

### 8.2 The request Fixture

The `request` fixture provides an `APIRequestContext` — similar to `fetch` but with Playwright conveniences like `baseURL` support and automatic cookie handling.

```typescript
import { test, expect } from "@playwright/test";

test("API is reachable", async ({ request }) => {
  // request is automatically available — no setup needed
  const response = await request.get("/api/health");
  expect(response.status()).toBe(200);
});
```

---

### 8.3 GET, POST, PUT, DELETE

```typescript
import { test, expect } from "@playwright/test";

test.describe("Users API", () => {

  // ── GET ───────────────────────────────────────────────────────────────────
  test("GET /api/users returns a list", async ({ request }) => {
    const response = await request.get("/api/users");

    expect(response.status()).toBe(200);
    const users = await response.json();
    expect(Array.isArray(users)).toBe(true);
    expect(users.length).toBeGreaterThan(0);
  });

  test("GET /api/users/:id returns a user", async ({ request }) => {
    const response = await request.get("/api/users/1");

    expect(response.ok()).toBe(true); // ok() = status is 200-299
    const user = await response.json();
    expect(user).toHaveProperty("id", 1);
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("name");
  });

  test("GET /api/users/:id returns 404 for missing user", async ({ request }) => {
    const response = await request.get("/api/users/99999");
    expect(response.status()).toBe(404);
  });

  // ── POST ──────────────────────────────────────────────────────────────────
  test("POST /api/users creates a new user", async ({ request }) => {
    const newUser = {
      name: "Test User",
      email: `test-${Date.now()}@example.com`, // Unique email to avoid conflicts
      role: "user"
    };

    const response = await request.post("/api/users", {
      data: newUser,  // Automatically serialized as JSON with Content-Type header
    });

    expect(response.status()).toBe(201); // 201 Created
    const created = await response.json();
    expect(created.id).toBeDefined();         // Should have an ID now
    expect(created.email).toBe(newUser.email);
    expect(created.name).toBe(newUser.name);
  });

  // POST with form data
  test("POST login with form data", async ({ request }) => {
    const response = await request.post("/api/auth/login", {
      form: {        // Sends as application/x-www-form-urlencoded
        username: "admin",
        password: "password"
      }
    });
    expect(response.ok()).toBe(true);
  });

  // ── PUT / PATCH ───────────────────────────────────────────────────────────
  test("PUT /api/users/:id updates a user", async ({ request }) => {
    const response = await request.put("/api/users/1", {
      data: { name: "Updated Name" }
    });
    expect(response.ok()).toBe(true);
    const updated = await response.json();
    expect(updated.name).toBe("Updated Name");
  });

  test("PATCH /api/users/:id partially updates a user", async ({ request }) => {
    const response = await request.patch("/api/users/1", {
      data: { name: "Partially Updated" }
    });
    expect(response.ok()).toBe(true);
  });

  // ── DELETE ────────────────────────────────────────────────────────────────
  test("DELETE /api/users/:id deletes a user", async ({ request }) => {
    // First create a user to delete
    const createResponse = await request.post("/api/users", {
      data: { name: "To Delete", email: `delete-${Date.now()}@test.com` }
    });
    const { id } = await createResponse.json();

    // Then delete it
    const deleteResponse = await request.delete(`/api/users/${id}`);
    expect(deleteResponse.status()).toBe(204); // 204 No Content

    // Verify it's gone
    const getResponse = await request.get(`/api/users/${id}`);
    expect(getResponse.status()).toBe(404);
  });
});
```

---

### 8.4 Asserting API Responses

```typescript
test("comprehensive response assertions", async ({ request }) => {
  const response = await request.get("/api/users/1");

  // ── Status assertions ──────────────────────────────────────────────────
  expect(response.status()).toBe(200);
  expect(response.ok()).toBe(true);            // True for 200-299 range
  expect(response.statusText()).toBe("OK");

  // ── Header assertions ──────────────────────────────────────────────────
  expect(response.headers()["content-type"]).toContain("application/json");
  expect(response.headers()["x-request-id"]).toBeDefined();

  // ── Body assertions ────────────────────────────────────────────────────
  const body = await response.json();          // Parse as JSON
  const text = await response.text();          // Parse as plain text
  const buffer = await response.body();        // Parse as Buffer

  // Shape assertions
  expect(body).toHaveProperty("id");
  expect(body).toHaveProperty("email");
  expect(body).toMatchObject({               // Partial match — other fields OK
    id: 1,
    email: "user@example.com"
  });

  // Array responses
  const listResponse = await request.get("/api/users");
  const users = await listResponse.json();
  expect(users).toHaveLength(10);
  expect(users[0]).toHaveProperty("id");
  expect(users.every((u: any) => u.email.includes("@"))).toBe(true);
});
```

---

### 8.5 Mixing UI and API in One Test

This is one of the most powerful patterns in Playwright — use API for fast setup, UI for the actual test, API for verification.

```typescript
test("order placed via UI is saved in the database", async ({ page, request }) => {

  // ── SETUP via API (fast — no UI interaction needed) ────────────────────
  // Create a test user account via API
  const userResponse = await request.post("/api/test/users", {
    data: { email: "shopper@test.com", password: "pass123" }
  });
  const { userId } = await userResponse.json();

  // Add a product to the catalog via API
  const productResponse = await request.post("/api/test/products", {
    data: { name: "Test Laptop", price: 999.99, stock: 5 }
  });
  const { productId } = await productResponse.json();

  // ── UI TEST (the actual test scenario) ────────────────────────────────
  // Log in via UI
  await page.goto("/login");
  await page.fill("#email", "shopper@test.com");
  await page.fill("#password", "pass123");
  await page.click("#login-button");
  await page.waitForURL("**/dashboard");

  // Browse to product and add to cart
  await page.goto(`/products/${productId}`);
  await page.click("#add-to-cart");

  // Complete checkout
  await page.goto("/checkout");
  await page.fill("#card-number", "4111111111111111");
  await page.fill("#expiry", "12/26");
  await page.fill("#cvv", "123");
  await page.click("#place-order");

  // Get the order ID from the confirmation page
  await page.waitForURL("**/order-confirmation/**");
  const orderNumberText = await page.locator(".order-number").textContent();
  const orderId = orderNumberText!.replace("Order #", "").trim();

  // ── VERIFY via API (fast — check the data was actually saved) ─────────
  const orderResponse = await request.get(`/api/orders/${orderId}`, {
    headers: { "X-User-Id": userId } // Auth header
  });
  expect(orderResponse.status()).toBe(200);

  const order = await orderResponse.json();
  expect(order.status).toBe("confirmed");
  expect(order.items[0].productId).toBe(productId);
  expect(order.total).toBeCloseTo(999.99, 2);

  // ── CLEANUP via API ────────────────────────────────────────────────────
  await request.delete(`/api/test/orders/${orderId}`);
  await request.delete(`/api/test/products/${productId}`);
  await request.delete(`/api/test/users/${userId}`);
});
```

---

### 8.6 APIRequestContext — Reusable API Client

For larger projects, create a reusable API client as a fixture.

```typescript
// fixtures/apiClient.fixture.ts
import { test as base, APIRequestContext } from "@playwright/test";

class ApiClient {
  constructor(private request: APIRequestContext) {}

  async getUsers() {
    const res = await this.request.get("/api/users");
    expect(res.ok()).toBe(true);
    return res.json();
  }

  async createUser(data: { name: string; email: string }) {
    const res = await this.request.post("/api/users", { data });
    expect(res.status()).toBe(201);
    return res.json();
  }

  async deleteUser(id: string) {
    const res = await this.request.delete(`/api/users/${id}`);
    expect(res.status()).toBe(204);
  }

  async login(email: string, password: string): Promise<string> {
    const res = await this.request.post("/api/auth/login", {
      data: { email, password }
    });
    expect(res.ok()).toBe(true);
    const { token } = await res.json();
    return token;
  }
}

export const test = base.extend<{ api: ApiClient }>({
  api: async ({ request }, use) => {
    await use(new ApiClient(request));
  }
});
```

---


---
← **Previous:** Part 06 — Reporters and Debugging `playwright-06-reporters-and-debugging.md`
→ **Next:** Part 08 — Visual Testing `playwright-08-visual-testing.md`
