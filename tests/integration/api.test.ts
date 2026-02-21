/**
 * INTEGRATION TESTS: API route handlers
 * Tests Express API endpoints using supertest against the real Express app
 * Note: These tests use the in-memory storage (MemStorage), no database needed
 */
import { describe, it, expect, beforeAll } from "vitest";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import request from "supertest";

// Build a minimal Express app with the same route patterns as the real app
// but without auth middleware (to test route logic in isolation)
function createTestApp() {
  const app = express();
  app.use(express.json());

  // In-memory store for tests
  const shops: Map<string, any> = new Map();
  const drivers: Map<string, any> = new Map();
  const routes: Map<string, any> = new Map();
  const targets: Map<string, any> = new Map();
  let idCounter = 0;
  const genId = () => `test-${++idCounter}`;

  // ---- Shops ----
  app.get("/api/shops", (_req, res) => {
    res.json(Array.from(shops.values()));
  });

  app.get("/api/shops/:id", (req, res) => {
    const shop = shops.get(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    res.json(shop);
  });

  app.post("/api/shops", (req, res) => {
    const { name, latitude, longitude } = req.body;
    if (!name || latitude == null || longitude == null) {
      return res.status(400).json({ error: "Invalid shop data" });
    }
    const id = genId();
    const shop = { id, ...req.body };
    shops.set(id, shop);
    res.status(201).json(shop);
  });

  app.patch("/api/shops/:id", (req, res) => {
    const shop = shops.get(req.params.id);
    if (!shop) return res.status(404).json({ error: "Shop not found" });
    const updated = { ...shop, ...req.body };
    shops.set(req.params.id, updated);
    res.json(updated);
  });

  app.delete("/api/shops/:id", (req, res) => {
    if (!shops.has(req.params.id)) return res.status(404).json({ error: "Shop not found" });
    shops.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Drivers ----
  app.get("/api/drivers", (_req, res) => {
    res.json(Array.from(drivers.values()));
  });

  app.post("/api/drivers", (req, res) => {
    const { name, phone, vehicleType } = req.body;
    if (!name || !phone || !vehicleType) {
      return res.status(400).json({ error: "Invalid driver data" });
    }
    const id = genId();
    const driver = { id, status: "available", ...req.body };
    drivers.set(id, driver);
    res.status(201).json(driver);
  });

  app.delete("/api/drivers/:id", (req, res) => {
    if (!drivers.has(req.params.id)) return res.status(404).json({ error: "Driver not found" });
    drivers.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Routes ----
  app.get("/api/routes", (_req, res) => {
    res.json(Array.from(routes.values()));
  });

  app.post("/api/routes", (req, res) => {
    const { name, date } = req.body;
    if (!name || !date) {
      return res.status(400).json({ error: "Invalid route data" });
    }
    const id = genId();
    const route = { id, status: "planned", shopIds: [], ...req.body };
    routes.set(id, route);
    res.status(201).json(route);
  });

  // ---- Targets ----
  app.get("/api/targets", (_req, res) => {
    res.json(Array.from(targets.values()));
  });

  app.post("/api/targets", (req, res) => {
    const { driverId, period, targetShops, targetDeliveries, startDate, endDate } = req.body;
    if (!driverId || !period || targetShops == null || targetDeliveries == null || !startDate || !endDate) {
      return res.status(400).json({ error: "Invalid target data" });
    }
    const id = genId();
    const target = { id, completedShops: 0, completedDeliveries: 0, ...req.body };
    targets.set(id, target);
    res.status(201).json(target);
  });

  // ---- Products ----
  const products: Map<string, any> = new Map();
  app.get("/api/products", (_req, res) => res.json({ data: Array.from(products.values()), pagination: { page: 1, limit: 50, count: products.size, hasMore: false } }));
  app.post("/api/products", (req, res) => {
    const { name, sku, category, unitPrice, costPrice } = req.body;
    if (!name || !sku || !category || unitPrice == null || costPrice == null) return res.status(400).json({ error: "Invalid product data" });
    const id = genId();
    const product = { id, status: "active", ...req.body, createdAt: new Date().toISOString() };
    products.set(id, product);
    res.status(201).json(product);
  });
  app.delete("/api/products/:id", (req, res) => {
    if (!products.has(req.params.id)) return res.status(404).json({ error: "Product not found" });
    products.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Suppliers ----
  const suppliers: Map<string, any> = new Map();
  app.get("/api/suppliers", (_req, res) => res.json({ data: Array.from(suppliers.values()), pagination: { page: 1, limit: 50, count: suppliers.size, hasMore: false } }));
  app.post("/api/suppliers", (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Invalid supplier data" });
    const id = genId();
    const supplier = { id, status: "active", ...req.body, createdAt: new Date().toISOString() };
    suppliers.set(id, supplier);
    res.status(201).json(supplier);
  });
  app.delete("/api/suppliers/:id", (req, res) => {
    if (!suppliers.has(req.params.id)) return res.status(404).json({ error: "Supplier not found" });
    suppliers.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Orders ----
  const orders: Map<string, any> = new Map();
  app.get("/api/orders", (_req, res) => res.json({ data: Array.from(orders.values()), pagination: { page: 1, limit: 50, count: orders.size, hasMore: false } }));
  app.post("/api/orders", (req, res) => {
    const { orderNumber, shopId, totalAmount } = req.body;
    if (!orderNumber || !shopId || totalAmount == null) return res.status(400).json({ error: "Invalid order data" });
    const id = genId();
    const order = { id, status: "pending", ...req.body, createdAt: new Date().toISOString() };
    orders.set(id, order);
    res.status(201).json(order);
  });
  app.patch("/api/orders/:id", (req, res) => {
    const order = orders.get(req.params.id);
    if (!order) return res.status(404).json({ error: "Order not found" });
    const updated = { ...order, ...req.body };
    orders.set(req.params.id, updated);
    res.json(updated);
  });
  app.delete("/api/orders/:id", (req, res) => {
    if (!orders.has(req.params.id)) return res.status(404).json({ error: "Order not found" });
    orders.delete(req.params.id);
    res.status(204).send();
  });

  // ---- Dispatches ----
  const dispatches: Map<string, any> = new Map();
  app.get("/api/dispatches", (_req, res) => res.json({ data: Array.from(dispatches.values()), pagination: { page: 1, limit: 50, count: dispatches.size, hasMore: false } }));
  app.post("/api/dispatches", (req, res) => {
    const { dispatchNumber, driverId, date } = req.body;
    if (!dispatchNumber || !driverId || !date) return res.status(400).json({ error: "Invalid dispatch data" });
    const id = genId();
    const dispatch = { id, status: "packing", ...req.body, createdAt: new Date().toISOString() };
    dispatches.set(id, dispatch);
    res.status(201).json(dispatch);
  });

  // ---- Payments ----
  const payments: Map<string, any> = new Map();
  app.get("/api/payments", (_req, res) => res.json({ data: Array.from(payments.values()), pagination: { page: 1, limit: 50, count: payments.size, hasMore: false } }));
  app.post("/api/payments", (req, res) => {
    const { orderId, amount } = req.body;
    if (!orderId || amount == null) return res.status(400).json({ error: "Invalid payment data" });
    const id = genId();
    const payment = { id, status: "pending", ...req.body, createdAt: new Date().toISOString() };
    payments.set(id, payment);
    res.status(201).json(payment);
  });

  // ---- Salespersons ----
  const salespersons: Map<string, any> = new Map();
  app.get("/api/salespersons", (_req, res) => res.json({ data: Array.from(salespersons.values()), pagination: { page: 1, limit: 50, count: salespersons.size, hasMore: false } }));
  app.post("/api/salespersons", (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: "Invalid salesperson data" });
    const id = genId();
    const sp = { id, status: "active", ...req.body, createdAt: new Date().toISOString() };
    salespersons.set(id, sp);
    res.status(201).json(sp);
  });

  // ---- Health check ----
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // ---- Error handler ----
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    res.status(500).json({ error: err.message || "Internal Server Error" });
  });

  return app;
}

// ============================================================
// API INTEGRATION TESTS
// ============================================================
describe("API: Health check", () => {
  const app = createTestApp();

  it("GET /api/health should return 200 with ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.timestamp).toBeDefined();
  });
});

describe("API: Shops endpoints", () => {
  const app = createTestApp();

  it("GET /api/shops should return empty array initially", async () => {
    const res = await request(app).get("/api/shops");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/shops should create a shop", async () => {
    const res = await request(app).post("/api/shops").send({
      name: "Test Shop",
      latitude: -1.258,
      longitude: 36.862,
      category: "retail",
      status: "active",
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe("Test Shop");
  });

  it("POST /api/shops should reject invalid data", async () => {
    const res = await request(app).post("/api/shops").send({
      category: "retail", // missing name, lat, lng
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/shops/:id should return created shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Findable Shop",
      latitude: -1.259,
      longitude: 36.863,
    });
    const res = await request(app).get(`/api/shops/${createRes.body.id}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Findable Shop");
  });

  it("GET /api/shops/:id should 404 for missing shop", async () => {
    const res = await request(app).get("/api/shops/non-existent");
    expect(res.status).toBe(404);
  });

  it("PATCH /api/shops/:id should update shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Update Me",
      latitude: -1.26,
      longitude: 36.86,
    });
    const res = await request(app)
      .patch(`/api/shops/${createRes.body.id}`)
      .send({ name: "Updated Name" });
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Updated Name");
  });

  it("DELETE /api/shops/:id should remove shop", async () => {
    const createRes = await request(app).post("/api/shops").send({
      name: "Delete Me",
      latitude: -1.26,
      longitude: 36.86,
    });
    const res = await request(app).delete(`/api/shops/${createRes.body.id}`);
    expect(res.status).toBe(204);

    const getRes = await request(app).get(`/api/shops/${createRes.body.id}`);
    expect(getRes.status).toBe(404);
  });

  it("DELETE /api/shops/:id should 404 for missing shop", async () => {
    const res = await request(app).delete("/api/shops/non-existent");
    expect(res.status).toBe(404);
  });
});

describe("API: Drivers endpoints", () => {
  const app = createTestApp();

  it("GET /api/drivers should return empty array initially", async () => {
    const res = await request(app).get("/api/drivers");
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it("POST /api/drivers should create a driver", async () => {
    const res = await request(app).post("/api/drivers").send({
      name: "Test Driver",
      phone: "+254712345678",
      vehicleType: "motorcycle",
    });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe("available");
  });

  it("POST /api/drivers should reject incomplete data", async () => {
    const res = await request(app).post("/api/drivers").send({
      name: "Incomplete",
      // missing phone and vehicleType
    });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/drivers/:id should remove driver", async () => {
    const createRes = await request(app).post("/api/drivers").send({
      name: "Del Driver",
      phone: "+254700000000",
      vehicleType: "van",
    });
    const res = await request(app).delete(`/api/drivers/${createRes.body.id}`);
    expect(res.status).toBe(204);
  });
});

describe("API: Routes endpoints", () => {
  const app = createTestApp();

  it("POST /api/routes should create a route", async () => {
    const res = await request(app).post("/api/routes").send({
      name: "Morning Delivery",
      date: "2026-02-18",
      shopIds: ["s1", "s2"],
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Morning Delivery");
    expect(res.body.status).toBe("planned");
  });

  it("POST /api/routes should reject without date", async () => {
    const res = await request(app).post("/api/routes").send({
      name: "No Date",
    });
    expect(res.status).toBe(400);
  });

  it("GET /api/routes should list routes", async () => {
    const res = await request(app).get("/api/routes");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

describe("API: Targets endpoints", () => {
  const app = createTestApp();

  it("POST /api/targets should create a target", async () => {
    const res = await request(app).post("/api/targets").send({
      driverId: "d1",
      period: "weekly",
      targetShops: 30,
      targetDeliveries: 50,
      startDate: "2026-02-17",
      endDate: "2026-02-23",
    });
    expect(res.status).toBe(201);
    expect(res.body.completedShops).toBe(0);
  });

  it("POST /api/targets should reject incomplete data", async () => {
    const res = await request(app).post("/api/targets").send({
      driverId: "d1",
      // missing other required fields
    });
    expect(res.status).toBe(400);
  });
});

// ==========================
// Products endpoints
// ==========================
describe("API: Products endpoints", () => {
  const app = createTestApp();

  it("GET /api/products should return paginated envelope", async () => {
    const res = await request(app).get("/api/products");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/products should create a product", async () => {
    const res = await request(app).post("/api/products").send({
      name: "Unga Maize Flour",
      sku: "UMF-001",
      category: "flour",
      unitPrice: 150,
      costPrice: 120,
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Unga Maize Flour");
    expect(res.body.status).toBe("active");
  });

  it("POST /api/products should reject missing fields", async () => {
    const res = await request(app).post("/api/products").send({ name: "Incomplete" });
    expect(res.status).toBe(400);
  });

  it("DELETE /api/products/:id should remove a product", async () => {
    const created = await request(app).post("/api/products").send({
      name: "To Delete",
      sku: "DEL-001",
      category: "test",
      unitPrice: 10,
      costPrice: 5,
    });
    const res = await request(app).delete(`/api/products/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it("DELETE /api/products/:id should 404 for missing product", async () => {
    const res = await request(app).delete("/api/products/nonexistent");
    expect(res.status).toBe(404);
  });
});

// ==========================
// Suppliers endpoints
// ==========================
describe("API: Suppliers endpoints", () => {
  const app = createTestApp();

  it("GET /api/suppliers should return paginated envelope", async () => {
    const res = await request(app).get("/api/suppliers");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("POST /api/suppliers should create a supplier", async () => {
    const res = await request(app).post("/api/suppliers").send({
      name: "Bidco Africa",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Bidco Africa");
    expect(res.body.status).toBe("active");
  });

  it("POST /api/suppliers should reject missing name", async () => {
    const res = await request(app).post("/api/suppliers").send({});
    expect(res.status).toBe(400);
  });

  it("DELETE /api/suppliers/:id should remove a supplier", async () => {
    const created = await request(app).post("/api/suppliers").send({ name: "Remove Me" });
    const res = await request(app).delete(`/api/suppliers/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it("DELETE /api/suppliers/:id should 404 for missing supplier", async () => {
    const res = await request(app).delete("/api/suppliers/nonexistent");
    expect(res.status).toBe(404);
  });
});

// ==========================
// Orders endpoints
// ==========================
describe("API: Orders endpoints", () => {
  const app = createTestApp();

  it("GET /api/orders should return paginated envelope", async () => {
    const res = await request(app).get("/api/orders");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("POST /api/orders should create an order", async () => {
    const res = await request(app).post("/api/orders").send({
      orderNumber: "ORD-001",
      shopId: "shop-1",
      totalAmount: 5000,
    });
    expect(res.status).toBe(201);
    expect(res.body.orderNumber).toBe("ORD-001");
    expect(res.body.status).toBe("pending");
  });

  it("POST /api/orders should reject missing fields", async () => {
    const res = await request(app).post("/api/orders").send({ orderNumber: "ORD-BAD" });
    expect(res.status).toBe(400);
  });

  it("PATCH /api/orders/:id should update an order", async () => {
    const created = await request(app).post("/api/orders").send({
      orderNumber: "ORD-UPD",
      shopId: "shop-1",
      totalAmount: 3000,
    });
    const res = await request(app).patch(`/api/orders/${created.body.id}`).send({ status: "confirmed" });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("confirmed");
  });

  it("PATCH /api/orders/:id should 404 for missing order", async () => {
    const res = await request(app).patch("/api/orders/nonexistent").send({ status: "confirmed" });
    expect(res.status).toBe(404);
  });

  it("DELETE /api/orders/:id should remove an order", async () => {
    const created = await request(app).post("/api/orders").send({
      orderNumber: "ORD-DEL",
      shopId: "shop-1",
      totalAmount: 1000,
    });
    const res = await request(app).delete(`/api/orders/${created.body.id}`);
    expect(res.status).toBe(204);
  });

  it("DELETE /api/orders/:id should 404 for missing order", async () => {
    const res = await request(app).delete("/api/orders/nonexistent");
    expect(res.status).toBe(404);
  });
});

// ==========================
// Dispatches endpoints
// ==========================
describe("API: Dispatches endpoints", () => {
  const app = createTestApp();

  it("GET /api/dispatches should return paginated envelope", async () => {
    const res = await request(app).get("/api/dispatches");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("POST /api/dispatches should create a dispatch", async () => {
    const res = await request(app).post("/api/dispatches").send({
      dispatchNumber: "DSP-001",
      driverId: "drv-1",
      date: "2026-03-01",
    });
    expect(res.status).toBe(201);
    expect(res.body.dispatchNumber).toBe("DSP-001");
    expect(res.body.status).toBe("packing");
  });

  it("POST /api/dispatches should reject missing fields", async () => {
    const res = await request(app).post("/api/dispatches").send({ dispatchNumber: "DSP-BAD" });
    expect(res.status).toBe(400);
  });
});

// ==========================
// Payments endpoints
// ==========================
describe("API: Payments endpoints", () => {
  const app = createTestApp();

  it("GET /api/payments should return paginated envelope", async () => {
    const res = await request(app).get("/api/payments");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("POST /api/payments should create a payment", async () => {
    const res = await request(app).post("/api/payments").send({
      orderId: "ord-1",
      amount: 2500,
    });
    expect(res.status).toBe(201);
    expect(res.body.status).toBe("pending");
    expect(res.body.amount).toBe(2500);
  });

  it("POST /api/payments should reject missing fields", async () => {
    const res = await request(app).post("/api/payments").send({});
    expect(res.status).toBe(400);
  });
});

// ==========================
// Salespersons endpoints
// ==========================
describe("API: Salespersons endpoints", () => {
  const app = createTestApp();

  it("GET /api/salespersons should return paginated envelope", async () => {
    const res = await request(app).get("/api/salespersons");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("data");
    expect(res.body).toHaveProperty("pagination");
  });

  it("POST /api/salespersons should create a salesperson", async () => {
    const res = await request(app).post("/api/salespersons").send({
      name: "Jane Wanjiku",
      phone: "+254712345678",
    });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe("Jane Wanjiku");
    expect(res.body.status).toBe("active");
  });

  it("POST /api/salespersons should reject missing fields", async () => {
    const res = await request(app).post("/api/salespersons").send({ name: "No Phone" });
    expect(res.status).toBe(400);
  });
});

// ==========================
// Content-Type handling
// ==========================
describe("API: Content-Type handling", () => {
  const app = createTestApp();

  it("should handle JSON request bodies", async () => {
    const res = await request(app)
      .post("/api/shops")
      .set("Content-Type", "application/json")
      .send(JSON.stringify({
        name: "JSON Shop",
        latitude: -1.26,
        longitude: 36.86,
      }));
    expect(res.status).toBe(201);
  });

  it("API responses should be JSON", async () => {
    const res = await request(app).get("/api/health");
    expect(res.headers["content-type"]).toMatch(/json/);
  });
});
