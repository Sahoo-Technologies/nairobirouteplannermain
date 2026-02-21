import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import { storage } from "./storage";
import { insertShopSchema, insertDriverSchema, insertRouteSchema, insertTargetSchema,
  insertProductSchema, insertSupplierSchema, insertProcurementSchema,
  insertSalespersonSchema, insertOrderSchema, insertOrderItemSchema,
  insertDispatchSchema, insertParcelSchema, insertPaymentSchema,
  insertStockMovementSchema, insertInventorySchema
} from "@shared/schema";
import { setupAuth, registerAuthRoutes, ensureAdminUser, isAuthenticated, isAdmin, hashPassword } from "./auth";
import { registerAnalyticsRoutes } from "./ai/analytics-routes";
import { createBackup, getBackupHistory } from "./backup";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";

// ============ PAGINATION HELPER ============
function parsePagination(req: Request): { page: number; limit: number; offset: number } {
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

function paginatedResponse<T>(data: T[], page: number, limit: number) {
  return {
    data: data.slice(0, limit),
    pagination: { page, limit, count: data.length, hasMore: data.length > limit },
  };
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication BEFORE other routes
  await setupAuth(app);

  // CORS — restrict to same-origin in production
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
    : undefined; // undefined = same-origin only (no CORS header sent)
  if (allowedOrigins) {
    app.use(cors({ origin: allowedOrigins, credentials: true }));
  }

  // Security headers with Content Security Policy
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // needed for Vite HMR in dev
          styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
          fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
          imgSrc: ["'self'", "data:", "https:", "blob:"],
          connectSrc: ["'self'", "https:", "wss:"],
          frameSrc: ["'none'"],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          upgradeInsecureRequests: [],
        },
      },
      crossOriginEmbedderPolicy: false, // needed for map tile images
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
    })
  );

  // Rate limiting
  app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many login attempts, try again later" } }));
  app.use("/api/auth/forgot-password", rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: "Too many reset requests, try again later" } }));
  app.use("/api/", rateLimit({ windowMs: 60 * 1000, max: 120, message: { error: "Rate limit exceeded" } }));

  registerAuthRoutes(app);
  
  // Ensure admin user exists with correct credentials
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.AI_ADMIN_PASSWORD;
  if (adminPassword) {
    await ensureAdminUser(adminEmail, adminPassword);
  }
  
  // ============ SHOPS ============
  app.get("/api/shops", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allShops = await storage.getAllShops();
      res.json(paginatedResponse(allShops, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shops" });
    }
  });

  app.get("/api/shops/:id", isAuthenticated, async (req, res) => {
    try {
      const shop = await storage.getShop(req.params.id);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shop" });
    }
  });

  app.post("/api/shops", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertShopSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid shop data", details: parsed.error.errors });
      }
      const shop = await storage.createShop(parsed.data);
      res.status(201).json(shop);
    } catch (error) {
      res.status(500).json({ error: "Failed to create shop" });
    }
  });

  app.patch("/api/shops/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertShopSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const shop = await storage.updateShop(req.params.id, parsed.data);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shop" });
    }
  });

  app.delete("/api/shops/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteShop(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete shop" });
    }
  });

  // ============ DRIVERS ============
  app.get("/api/drivers", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allDrivers = await storage.getAllDrivers();
      res.json(paginatedResponse(allDrivers, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/drivers/:id", isAuthenticated, async (req, res) => {
    try {
      const driver = await storage.getDriver(req.params.id);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver" });
    }
  });

  app.post("/api/drivers", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDriverSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid driver data", details: parsed.error.errors });
      }
      const driver = await storage.createDriver(parsed.data);
      res.status(201).json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to create driver" });
    }
  });

  app.patch("/api/drivers/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDriverSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const driver = await storage.updateDriver(req.params.id, parsed.data);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteDriver(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete driver" });
    }
  });

  // ============ ROUTES ============
  app.get("/api/routes", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allRoutes = await storage.getAllRoutes();
      res.json(paginatedResponse(allRoutes, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });

  app.get("/api/routes/:id", isAuthenticated, async (req, res) => {
    try {
      const route = await storage.getRoute(req.params.id);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch route" });
    }
  });

  app.post("/api/routes", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRouteSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid route data", details: parsed.error.errors });
      }
      const route = await storage.createRoute(parsed.data);
      res.status(201).json(route);
    } catch (error) {
      res.status(500).json({ error: "Failed to create route" });
    }
  });

  app.patch("/api/routes/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertRouteSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const route = await storage.updateRoute(req.params.id, parsed.data);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(500).json({ error: "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteRoute(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete route" });
    }
  });

  // ============ TARGETS ============
  app.get("/api/targets", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allTargets = await storage.getAllTargets();
      res.json(paginatedResponse(allTargets, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch targets" });
    }
  });

  app.get("/api/targets/:id", isAuthenticated, async (req, res) => {
    try {
      const target = await storage.getTarget(req.params.id);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch target" });
    }
  });

  app.post("/api/targets", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertTargetSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({ error: "Invalid target data", details: parsed.error.errors });
      }
      const target = await storage.createTarget(parsed.data);
      res.status(201).json(target);
    } catch (error) {
      res.status(500).json({ error: "Failed to create target" });
    }
  });

  app.patch("/api/targets/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertTargetSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const target = await storage.updateTarget(req.params.id, parsed.data);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      res.status(500).json({ error: "Failed to update target" });
    }
  });

  app.delete("/api/targets/:id", isAdmin, async (req, res) => {
    try {
      const deleted = await storage.deleteTarget(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: "Failed to delete target" });
    }
  });

  // Register AI Analytics routes
  registerAnalyticsRoutes(app);

  // ============ PRODUCTS ============
  app.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllProducts(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch products" }); }
  });
  app.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const p = await storage.getProduct(req.params.id);
      if (!p) return res.status(404).json({ error: "Product not found" });
      res.json(p);
    } catch { res.status(500).json({ error: "Failed to fetch product" }); }
  });
  app.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createProduct(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create product" }); }
  });
  app.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProductSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateProduct(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Product not found" });
      res.json(p);
    } catch { res.status(500).json({ error: "Failed to update product" }); }
  });
  app.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteProduct(req.params.id)) return res.status(404).json({ error: "Product not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete product" }); }
  });

  // ============ INVENTORY ============
  app.get("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllInventory(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch inventory" }); }
  });
  app.post("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertInventorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.json(await storage.upsertInventory(parsed.data));
    } catch { res.status(500).json({ error: "Failed to update inventory" }); }
  });

  // ============ STOCK MOVEMENTS ============
  app.get("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllStockMovements(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch stock movements" }); }
  });
  app.post("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertStockMovementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createStockMovement(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create stock movement" }); }
  });

  // ============ SUPPLIERS ============
  app.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllSuppliers(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch suppliers" }); }
  });
  app.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createSupplier(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create supplier" }); }
  });
  app.patch("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const s = await storage.updateSupplier(req.params.id, parsed.data);
      if (!s) return res.status(404).json({ error: "Supplier not found" });
      res.json(s);
    } catch { res.status(500).json({ error: "Failed to update supplier" }); }
  });
  app.delete("/api/suppliers/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteSupplier(req.params.id)) return res.status(404).json({ error: "Supplier not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete supplier" }); }
  });

  // ============ PROCUREMENTS ============
  app.get("/api/procurements", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllProcurements(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch procurements" }); }
  });
  app.post("/api/procurements", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProcurementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createProcurement(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create procurement" }); }
  });
  app.patch("/api/procurements/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProcurementSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateProcurement(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Procurement not found" });
      res.json(p);
    } catch { res.status(500).json({ error: "Failed to update procurement" }); }
  });

  // ============ SALESPERSONS ============
  app.get("/api/salespersons", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllSalespersons(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch salespersons" }); }
  });
  app.post("/api/salespersons", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSalespersonSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createSalesperson(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create salesperson" }); }
  });
  app.patch("/api/salespersons/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSalespersonSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const sp = await storage.updateSalesperson(req.params.id, parsed.data);
      if (!sp) return res.status(404).json({ error: "Salesperson not found" });
      res.json(sp);
    } catch { res.status(500).json({ error: "Failed to update salesperson" }); }
  });
  app.delete("/api/salespersons/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteSalesperson(req.params.id)) return res.status(404).json({ error: "Salesperson not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete salesperson" }); }
  });

  // ============ ORDERS ============
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllOrders(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch orders" }); }
  });
  app.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const o = await storage.getOrder(req.params.id);
      if (!o) return res.status(404).json({ error: "Order not found" });
      res.json(o);
    } catch { res.status(500).json({ error: "Failed to fetch order" }); }
  });
  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createOrder(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create order" }); }
  });
  app.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const o = await storage.updateOrder(req.params.id, parsed.data);
      if (!o) return res.status(404).json({ error: "Order not found" });
      res.json(o);
    } catch { res.status(500).json({ error: "Failed to update order" }); }
  });
  app.delete("/api/orders/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteOrder(req.params.id)) return res.status(404).json({ error: "Order not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete order" }); }
  });

  // Order Items
  app.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try { res.json(await storage.getOrderItems(req.params.id)); }
    catch { res.status(500).json({ error: "Failed to fetch order items" }); }
  });
  app.post("/api/order-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createOrderItem(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create order item" }); }
  });

  // ============ DISPATCHES ============
  app.get("/api/dispatches", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllDispatches(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch dispatches" }); }
  });
  app.get("/api/dispatches/:id", isAuthenticated, async (req, res) => {
    try {
      const d = await storage.getDispatch(req.params.id);
      if (!d) return res.status(404).json({ error: "Dispatch not found" });
      res.json(d);
    } catch { res.status(500).json({ error: "Failed to fetch dispatch" }); }
  });
  app.post("/api/dispatches", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDispatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createDispatch(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create dispatch" }); }
  });
  app.patch("/api/dispatches/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDispatchSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const d = await storage.updateDispatch(req.params.id, parsed.data);
      if (!d) return res.status(404).json({ error: "Dispatch not found" });
      res.json(d);
    } catch { res.status(500).json({ error: "Failed to update dispatch" }); }
  });

  // ============ PARCELS ============
  app.get("/api/parcels", isAuthenticated, async (req, res) => {
    try {
      const dispatchId = req.query.dispatchId as string | undefined;
      res.json(await storage.getAllParcels(dispatchId));
    } catch { res.status(500).json({ error: "Failed to fetch parcels" }); }
  });
  app.post("/api/parcels", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertParcelSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createParcel(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create parcel" }); }
  });
  app.patch("/api/parcels/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertParcelSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateParcel(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Parcel not found" });
      res.json(p);
    } catch { res.status(500).json({ error: "Failed to update parcel" }); }
  });

  // ============ PAYMENTS ============
  app.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllPayments(), page, limit));
    }
    catch { res.status(500).json({ error: "Failed to fetch payments" }); }
  });
  app.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertPaymentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createPayment(parsed.data));
    } catch { res.status(500).json({ error: "Failed to create payment" }); }
  });
  app.patch("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertPaymentSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updatePayment(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Payment not found" });
      res.json(p);
    } catch { res.status(500).json({ error: "Failed to update payment" }); }
  });

  // ============ ADMIN: USER MANAGEMENT ============
  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allUsers = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
      }).from(users);
      res.json(paginatedResponse(allUsers, page, limit));
    } catch { res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      // Password complexity: min 8, uppercase, lowercase, digit
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a digit" });
      }

      // Check if user already exists
      const [existing] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
      if (existing) return res.status(409).json({ error: "A user with this email already exists" });

      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role === "admin" ? "admin" : "user",
      }).returning();

      const { passwordHash: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, role, password } = req.body;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (role !== undefined) updates.role = role === "admin" ? "admin" : "user";
      if (password) updates.passwordHash = await hashPassword(password);

      const [updated] = await db.update(users).set(updates).where(eq(users.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "User not found" });

      const { passwordHash: _, ...userData } = updated;
      res.json(userData);
    } catch { res.status(500).json({ error: "Failed to update user" }); }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      // Prevent self-deletion
      if (req.session.userId === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const [deleted] = await db.delete(users).where(eq(users.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "User not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete user" }); }
  });

  // ============ ADMIN: SETTINGS (ENV KEYS) ============
  const ENV_KEYS = [
    "DATABASE_URL", "SESSION_SECRET", "ADMIN_EMAIL", "AI_ADMIN_PASSWORD",
    "CRON_SECRET", "SMTP_HOST", "SMTP_PORT", "SMTP_USER", "SMTP_PASS", "SMTP_FROM",
    "AI_INTEGRATIONS_OPENAI_API_KEY", "AI_INTEGRATIONS_OPENAI_BASE_URL", "CORS_ORIGIN",
  ];

  app.get("/api/admin/settings", isAdmin, (_req, res) => {
    const settings: Record<string, string> = {};
    for (const key of ENV_KEYS) {
      const val = process.env[key];
      // Mask secrets — only show last 4 chars
      if (val && ["DATABASE_URL", "SESSION_SECRET", "AI_ADMIN_PASSWORD", "SMTP_PASS", "AI_INTEGRATIONS_OPENAI_API_KEY", "CRON_SECRET"].includes(key)) {
        settings[key] = val.length > 4 ? "****" + val.slice(-4) : "****";
      } else {
        settings[key] = val || "";
      }
    }
    res.json({ keys: ENV_KEYS, settings });
  });

  app.put("/api/admin/settings", isAdmin, (req, res) => {
    try {
      const updates: Record<string, string> = req.body;
      const applied: string[] = [];

      for (const [key, value] of Object.entries(updates)) {
        if (!ENV_KEYS.includes(key)) continue;
        // Skip masked values (unchanged)
        if (typeof value === "string" && value.startsWith("****")) continue;
        if (typeof value === "string" && value.trim() !== "") {
          // Sanitize: strip newlines/carriage returns to prevent env injection
          const sanitized = value.trim().replace(/[\r\n]/g, "");
          process.env[key] = sanitized;
          applied.push(key);
        }
      }

      // Persist to .env file if possible
      try {
        const envPath = join(process.cwd(), ".env");
        let envContent = "";
        if (existsSync(envPath)) {
          envContent = readFileSync(envPath, "utf-8");
        }
        for (const key of applied) {
          const regex = new RegExp(`^${key}=.*$`, "m");
          const line = `${key}=${process.env[key]}`;
          if (regex.test(envContent)) {
            envContent = envContent.replace(regex, line);
          } else {
            envContent += (envContent.endsWith("\n") || envContent === "" ? "" : "\n") + line + "\n";
          }
        }
        writeFileSync(envPath, envContent);
      } catch { /* .env write is best-effort */ }

      res.json({ success: true, applied });
    } catch { res.status(500).json({ error: "Failed to save settings" }); }
  });

  // ============ BACKUP ============
  app.post("/api/backup", isAdmin, async (_req, res) => {
    try {
      const backup = await createBackup("manual");
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${backup.createdAt.replace(/[:.]/g, "-")}_veew_backup.json"`);
      res.json(backup);
    } catch (error) {
      console.error("Backup creation error:", error);
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  // Vercel Cron (or any external scheduler) endpoint
  // Protect with CRON_SECRET: Authorization: Bearer <CRON_SECRET>
  app.post("/api/backup/cron", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(500).json({ error: "CRON_SECRET not configured" });
    }

    const authHeader = req.header("authorization") || "";
    const expected = `Bearer ${cronSecret}`;

    // Timing-safe comparison to prevent timing attacks
    const authBuf = Buffer.from(authHeader);
    const expectedBuf = Buffer.from(expected);
    if (authBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(authBuf, expectedBuf)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const backup = await createBackup("scheduled");
      res.json({ success: true, createdAt: backup.createdAt, recordCount: backup.metadata.totalRecords });
    } catch (error) {
      console.error("Cron backup error:", error);
      res.status(500).json({ error: "Failed to create scheduled backup" });
    }
  });

  app.get("/api/backup/history", isAdmin, async (_req, res) => {
    try {
      const history = await getBackupHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backup history" });
    }
  });

  return httpServer;
}
