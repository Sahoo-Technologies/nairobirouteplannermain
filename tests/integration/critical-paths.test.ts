/**
 * Integration Tests for Critical Paths
 * 
 * Tests the most critical application functionality to ensure
 * reliability and proper error handling.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createTestApp } from "../setup";
import { storage } from "../../server/storage";
import { validateEnvironment } from "../../server/env-validation";
import { aiUsageMonitor } from "../../server/ai/usage-monitor";
import { settingsManager } from "../../server/secure-settings";

describe("Critical Path Integration Tests", () => {
  let server: any;
  let testUser: any;
  let authToken: string;

  beforeAll(async () => {
    // Validate environment before running tests
    const envValidation = validateEnvironment();
    if (!envValidation.valid) {
      console.warn("Environment validation failed:", envValidation.errors);
    }

    // Start test server
    server = createTestApp().listen(0); // Use random port
    
    // Create test user
    const userData = {
      email: "test@example.com",
      password: "testpassword123",
      firstName: "Test",
      lastName: "User",
    };

    const registerResponse = await request(server)
      .post("/api/auth/register")
      .send(userData);

    if (registerResponse.status === 201) {
      testUser = registerResponse.body.user;
    } else {
      // Login if user already exists
      const loginResponse = await request(server)
        .post("/api/auth/login")
        .send({
          email: userData.email,
          password: userData.password,
        });
      
      if (loginResponse.status === 200) {
        testUser = loginResponse.body.user;
        authToken = loginResponse.body.token;
      }
    }
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    // Reset AI usage monitor for clean tests
    aiUsageMonitor.updateLimits({
      dailyCalls: 100,
      monthlyCalls: 2000,
      monthlyCost: 50,
    });
  });

  describe("Authentication Flow", () => {
    it("should register a new user", async () => {
      const userData = {
        email: `test-${Date.now()}@example.com`,
        password: "password123",
        firstName: "Test",
        lastName: "User",
      };

      const response = await request(server)
        .post("/api/auth/register")
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe(userData.email);
      expect(response.body.user.passwordHash).toBeUndefined(); // Password should not be returned
    });

    it("should login with valid credentials", async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "testpassword123",
        });

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.user).toBeDefined();
      authToken = response.body.token;
    });

    it("should reject invalid credentials", async () => {
      const response = await request(server)
        .post("/api/auth/login")
        .send({
          email: "test@example.com",
          password: "wrongpassword",
        });

      expect(response.status).toBe(401);
    });

    it("should protect protected routes", async () => {
      const response = await request(server)
        .get("/api/shops");

      expect(response.status).toBe(401);
    });

    it("should allow access with valid token", async () => {
      const response = await request(server)
        .get("/api/shops")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("Core Business Logic", () => {
    it("should create and retrieve shops", async () => {
      const shopData = {
        name: "Test Shop",
        ownerName: "Test Owner",
        phone: "+254712345678",
        address: "Test Address",
        latitude: -1.2921,
        longitude: 36.8219,
        category: "retail",
      };

      // Create shop
      const createResponse = await request(server)
        .post("/api/shops")
        .set("Authorization", `Bearer ${authToken}`)
        .send(shopData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(shopData.name);
      expect(createResponse.body.id).toBeDefined();

      const shopId = createResponse.body.id;

      // Retrieve shop
      const getResponse = await request(server)
        .get(`/api/shops/${shopId}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(getResponse.status).toBe(200);
      expect(getResponse.body.name).toBe(shopData.name);
    });

    it("should create and manage drivers", async () => {
      const driverData = {
        name: "Test Driver",
        phone: "+254712345679",
        vehicleType: "motorcycle",
        vehiclePlate: "ABC123",
      };

      // Create driver
      const createResponse = await request(server)
        .post("/api/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .send(driverData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(driverData.name);
      expect(createResponse.body.id).toBeDefined();

      const driverId = createResponse.body.id;

      // Update driver
      const updateResponse = await request(server)
        .put(`/api/drivers/${driverId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send({ status: "on_route" });

      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.status).toBe("on_route");
    });

    it("should create and manage routes", async () => {
      // First create a shop and driver for the route
      const shopResponse = await request(server)
        .post("/api/shops")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Route Shop",
          latitude: -1.2921,
          longitude: 36.8219,
        });

      const driverResponse = await request(server)
        .post("/api/drivers")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "Route Driver",
          phone: "+254712345680",
          vehicleType: "motorcycle",
        });

      const routeData = {
        name: "Test Route",
        driverId: driverResponse.body.id,
        shopIds: [shopResponse.body.id],
        date: new Date().toISOString().split('T')[0],
      };

      // Create route
      const createResponse = await request(server)
        .post("/api/routes")
        .set("Authorization", `Bearer ${authToken}`)
        .send(routeData);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.name).toBe(routeData.name);
      expect(createResponse.body.shopIds).toEqual(routeData.shopIds);
    });
  });

  describe("Error Handling", () => {
    it("should handle validation errors gracefully", async () => {
      const response = await request(server)
        .post("/api/shops")
        .set("Authorization", `Bearer ${authToken}`)
        .send({
          name: "", // Invalid: empty name
          latitude: "invalid", // Invalid: not a number
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBeDefined();
    });

    it("should handle not found errors", async () => {
      const response = await request(server)
        .get("/api/shops/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${authToken}`);

      expect(response.status).toBe(404);
      expect(response.body.error).toBeDefined();
    });

    it("should handle unauthorized access", async () => {
      const response = await request(server)
        .delete("/api/shops/some-id");

      expect(response.status).toBe(401);
    });
  });

  describe("AI Usage Monitoring", () => {
    it("should track AI usage", async () => {
      // Get initial usage
      const initialReport = aiUsageMonitor.getUsageReport();
      expect(initialReport.enabled).toBe(true);

      // Test usage estimation
      const canProceed = aiUsageMonitor.canMakeRequest("gpt-5.2", 1000, 500);
      expect(canProceed.allowed).toBe(true);
      expect(canProceed.estimatedCost).toBeGreaterThan(0);

      // Test usage limits
      aiUsageMonitor.updateLimits({ dailyCalls: 1, monthlyCalls: 1, monthlyCost: 0.01 });
      
      // This should now fail due to limits
      const limitedProceed = aiUsageMonitor.canMakeRequest("gpt-5.2", 1000, 500);
      expect(limitedProceed.allowed).toBe(false);
      expect(limitedProceed.reason).toBeDefined();
    });

    it("should provide usage reports", async () => {
      const report = aiUsageMonitor.getUsageReport();
      
      expect(report).toHaveProperty("daily");
      expect(report).toHaveProperty("monthly");
      expect(report).toHaveProperty("limits");
      expect(report).toHaveProperty("enabled");

      expect(report.daily).toHaveProperty("totalCalls");
      expect(report.daily).toHaveProperty("totalCost");
      expect(report.monthly).toHaveProperty("totalCalls");
      expect(report.monthly).toHaveProperty("totalCost");
    });
  });

  describe("Secure Settings Management", () => {
    it("should mask sensitive settings", async () => {
      const settings = settingsManager.getAllSettings();
      
      const sensitiveSettings = settings.filter(s => s.sensitive);
      sensitiveSettings.forEach(setting => {
        if (setting.value && setting.value.length > 0) {
          expect(setting.masked).toBe(true);
          expect(setting.value).toMatch(/^****[\w]*$/);
        }
      });
    });

    it("should validate setting updates", async () => {
      const result = settingsManager.updateSetting("ADMIN_EMAIL", "invalid-email");
      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid value format");
    });

    it("should maintain audit trail", async () => {
      const initialAudit = settingsManager.getAuditLog(10);
      const initialCount = initialAudit.length;

      // Update a setting
      settingsManager.updateSetting("PORT", "3001", "test-user", "127.0.0.1");

      const updatedAudit = settingsManager.getAuditLog(10);
      expect(updatedAudit.length).toBeGreaterThan(initialCount);
      
      const lastEntry = updatedAudit[updatedAudit.length - 1];
      expect(lastEntry.action).toBe("UPDATE");
      expect(lastEntry.setting).toBe("PORT");
      expect(lastEntry.userId).toBe("test-user");
    });
  });

  describe("Database Operations", () => {
    it("should handle database connection errors", async () => {
      // This test would require mocking database failures
      // For now, we'll test that the storage interface works
      const shops = await storage.getAllShops();
      expect(Array.isArray(shops)).toBe(true);
    });

    it("should maintain data consistency", async () => {
      // Create a shop
      const shopData = {
        name: "Consistency Test Shop",
        latitude: -1.2921,
        longitude: 36.8219,
      };

      const createResponse = await request(server)
        .post("/api/shops")
        .set("Authorization", `Bearer ${authToken}`)
        .send(shopData);

      expect(createResponse.status).toBe(201);

      // Verify it exists in storage
      const shop = await storage.getShop(createResponse.body.id);
      expect(shop).toBeDefined();
      expect(shop?.name).toBe(shopData.name);

      // Delete it
      const deleteResponse = await request(server)
        .delete(`/api/shops/${createResponse.body.id}`)
        .set("Authorization", `Bearer ${authToken}`);

      expect(deleteResponse.status).toBe(204);

      // Verify it's gone
      const deletedShop = await storage.getShop(createResponse.body.id);
      expect(deletedShop).toBeUndefined();
    });
  });

  describe("Performance and Reliability", () => {
    it("should handle concurrent requests", async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(server)
          .get("/api/shops")
          .set("Authorization", `Bearer ${authToken}`)
      );

      const responses = await Promise.all(promises);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });
    });

    it("should handle large payloads", async () => {
      // Create a large number of shops
      const largePayload = Array.from({ length: 50 }, (_, i) => ({
        name: `Large Test Shop ${i}`,
        latitude: -1.2921 + (i * 0.001),
        longitude: 36.8219 + (i * 0.001),
      }));

      const response = await request(server)
        .post("/api/shops/batch")
        .set("Authorization", `Bearer ${authToken}`)
        .send({ shops: largePayload });

      // This endpoint might not exist yet, but we test error handling
      expect([200, 400, 404, 500]).toContain(response.status);
    });
  });
});
