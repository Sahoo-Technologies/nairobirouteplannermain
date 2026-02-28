import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import { storage } from "./storage";
import { settingsManager } from "./secure-settings";
import { healthCheck, readinessCheck, livenessCheck } from "./health-checks";
import { 
  adminDebugMiddleware, 
  adminFixMiddleware, 
  adminTestMiddleware, 
  adminResetPasswordMiddleware 
} from "./admin-debug";
import { AdminRouteValidator } from "./admin-route-validator";
import { insertShopSchema, insertDriverSchema, insertRouteSchema, insertTargetSchema,
  insertProductSchema, insertSupplierSchema, insertProcurementSchema,
  insertSalespersonSchema, insertOrderSchema, insertOrderItemSchema,
  insertDispatchSchema, insertParcelSchema, insertPaymentSchema,
  insertStockMovementSchema, insertInventorySchema
} from "@shared/schema";
import { setupAuth, registerAuthRoutes, ensureAdminUser, isAuthenticated, isAdmin, isManager, hashPassword } from "./auth";
import { getAllUsers, createUser, updateUser, deleteUserById } from "./auth";
import { registerAnalyticsRoutes } from "./ai/analytics-routes";
import { createBackup, getBackupHistory } from "./backup";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
import { transporter } from "./emails";

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
): Promise<void> {
  
  // Health check endpoints (no authentication required)
  app.get("/health", healthCheck);
  app.get("/ready", readinessCheck);
  app.get("/live", livenessCheck);

  // Admin debugging endpoints (development only)
  if (process.env.NODE_ENV !== "production") {
    app.get("/debug/admin", adminDebugMiddleware);
    app.post("/debug/admin/fix", adminFixMiddleware);
    app.post("/debug/admin/test", adminTestMiddleware);
    app.post("/debug/admin/reset-password", adminResetPasswordMiddleware);
    
    // Route validation endpoints
    app.get("/debug/routes", (req, res) => {
      try {
        const analysis = AdminRouteValidator.analyzeRoutes();
        res.json(analysis);
      } catch (error) {
        res.status(500).json({
          error: "Failed to analyze routes",
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
    
    app.get("/debug/routes/validate", (req, res) => {
      try {
        const validation = AdminRouteValidator.validateRouteConsistency();
        res.json(validation);
      } catch (error) {
        res.status(500).json({
          error: "Failed to validate routes",
          message: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }

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
  const isProd = process.env.NODE_ENV === "production";
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: isProd ? ["'self'"] : ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
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
      strictTransportSecurity: {
        maxAge: 63072000, // 2 years
        includeSubDomains: true,
        preload: true,
      },
    })
  );

  // Permissions-Policy: restrict sensitive browser features
  app.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
    );
    next();
  });

  // Rate limiting
  app.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: "Too many login attempts, try again later" } }));
  app.use("/api/auth/forgot-password", rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: { error: "Too many reset requests, try again later" } }));
  app.use("/api/", rateLimit({ windowMs: 60 * 1000, max: 120, message: { error: "Rate limit exceeded" } }));

  registerAuthRoutes(app);
  
  // Ensure admin user exists with correct credentials
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.AI_ADMIN_PASSWORD;
  if (adminPassword && adminEmail) {
    try {
      await ensureAdminUser(adminEmail, adminPassword);
      console.log("✅ Admin user setup completed successfully");
    } catch (error) {
      console.error("⚠️  Admin user setup failed:", error instanceof Error ? error.message : String(error));
      console.log("⚠️  Admin features may not work properly until admin user is configured");
    }
  } else {
    console.warn("⚠️  ADMIN_EMAIL or AI_ADMIN_PASSWORD not set - admin features disabled");
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

  // Bulk create shops - useful for performance / large payload tests
  app.post("/api/shops/batch", isAuthenticated, async (req, res) => {
    try {
      const { shops } = req.body;
      if (!Array.isArray(shops)) {
        return res.status(400).json({ error: "Invalid shops payload" });
      }
      const created: any[] = [];
      for (const s of shops) {
        const parsed = insertShopSchema.safeParse(s);
        if (!parsed.success) continue; // skip invalid entries
        const shop = await storage.createShop(parsed.data);
        created.push(shop);
      }
      res.json({ data: created });
    } catch (error) {
      res.status(500).json({ error: "Batch create failed" });
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
      const allUsers = await getAllUsers();
      res.json(paginatedResponse(allUsers, page, limit));
    } catch { res.status(500).json({ error: "Failed to fetch users" }); }
  });

  app.post("/api/admin/users", isAdmin, async (req, res) => {
    // Only admins can create users (changed from isManager for consistency)
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      // Password complexity: min 8, uppercase, lowercase, digit
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a digit" });
      }

      // Prevent creation of any admin except the environment admin
      if (role === "admin" && email.toLowerCase() !== String(process.env.ADMIN_EMAIL).toLowerCase()) {
        return res.status(400).json({ error: "Only the environment admin can have the admin role" });
      }

      // Check if user already exists
      const allUsersForCheck = await getAllUsers();
      const existing = allUsersForCheck.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (existing) return res.status(409).json({ error: "A user with this email already exists" });

      const newUser = await createUser({
        email,
        password,
        firstName: firstName || null,
        lastName: lastName || null,
        role: (role === "admin" && email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase()) ? "admin" : (role === "manager" ? "manager" : "user"),
      });

      // Send credentials email
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Your Veew Distributors Account",
            html: `
              <h2>Welcome to Veew Distributors!</h2>
              <p>Your account has been created with the following credentials:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p>Please log in and change your password as soon as possible.</p>
              <p><a href="${process.env.CORS_ORIGIN || 'http://localhost:5000'}/login">Login to Veew Distributors</a></p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }

      const { passwordHash: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch { res.status(500).json({ error: "Failed to create user" }); }
  });

  // Manager route for creating users (limited to non-admin roles)
  app.post("/api/manager/users", isManager, async (req, res) => {
    // Managers can create users but not admins
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

      // Managers cannot create admin users
      if (role === "admin") {
        return res.status(403).json({ error: "Managers cannot create admin users" });
      }

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
        role: role === "manager" ? "manager" : "user",
      }).returning();

      // Send credentials email
      if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && transporter) {
        try {
          await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: email,
            subject: "Your Veew Distributors Account",
            html: `
              <h2>Welcome to Veew Distributors!</h2>
              <p>Your account has been created with the following credentials:</p>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
              <p>Please log in and change your password as soon as possible.</p>
              <p><a href="${process.env.CORS_ORIGIN || 'http://localhost:5000'}/login">Login to Veew Distributors</a></p>
            `,
          });
        } catch (emailError) {
          console.error("Failed to send welcome email:", emailError);
        }
      }

      const { passwordHash: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch { res.status(500).json({ error: "Failed to create user" }); }
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, role, password } = req.body;
      const updates: Record<string, any> = { updatedAt: new Date() };
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;

      // Prevent updating any user to admin except the environment admin
      if (role !== undefined) {
        // Get the user's email
        const allUsers = await getAllUsers();
        const targetUser = allUsers.find(u => u.id === req.params.id);
        if (!targetUser) return res.status(404).json({ error: "User not found" });
        if (role === "admin" && (targetUser.email?.toLowerCase() !== String(process.env.ADMIN_EMAIL).toLowerCase())) {
          return res.status(400).json({ error: "Only the environment admin can have the admin role" });
        }
        updates.role = (role === "admin" && targetUser.email?.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase()) ? "admin" : (role === "manager" ? "manager" : "user");
      }
      if (password) updates.password = password;

      // Get the user again for the update call
      const allUsersForUpdate = await getAllUsers();
      const userForUpdate = allUsersForUpdate.find((u) => u.id === req.params.id);
      if (!userForUpdate) return res.status(404).json({ error: "User not found" });
      
      const updated = await updateUser(userForUpdate.email, updates);
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
      const deleted = await deleteUserById(req.params.id);
      if (!deleted) return res.status(404).json({ error: "User not found" });
      res.status(204).send();
    } catch { res.status(500).json({ error: "Failed to delete user" }); }
  });

  // ============ ADMIN: SETTINGS (SECURE) ============
  app.get("/api/admin/settings", isAdmin, (req, res) => {
    try {
      const userId = req.session.userId;
      const ip = req.ip;
      const settingsArray = settingsManager.getAllSettings(userId, ip);
      // Client expects { keys: string[], settings: Record<string, string> }
      const keys = settingsArray.map((s) => s.name);
      const settings = Object.fromEntries(settingsArray.map((s) => [s.name, s.value]));
      res.json({ keys, settings });
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.put("/api/admin/settings", isAdmin, (req, res) => {
    try {
      const userId = req.session.userId;
      const ip = req.ip;
      const updates = req.body as Record<string, string>;
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ error: "Invalid request body" });
      }
      const applied: string[] = [];
      for (const [name, value] of Object.entries(updates)) {
        if (typeof value !== "string") continue;
        // Skip masked placeholders — client sends "****" or "****xx" for unchanged secrets
        if (value.startsWith("****")) continue;
        const result = settingsManager.updateSetting(name, value, userId, ip);
        if (result.success) applied.push(name);
      }
      res.json({ success: true, applied });
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.get("/api/admin/settings/audit", isAdmin, (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const auditLog = settingsManager.getAuditLog(limit);
      res.json({ auditLog });
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
  });

  app.get("/api/admin/settings/:name", isAdmin, (req, res) => {
    try {
      const { name } = req.params;
      const userId = req.session.userId;
      const ip = req.ip;
      const setting = settingsManager.getSetting(name, userId, ip);

      if (!setting) {
        return res.status(404).json({ error: "Setting not found" });
      }

      res.json({ setting });
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ error: "Failed to fetch setting" });
    }
  });

  app.put("/api/admin/settings/:name", isAdmin, (req, res) => {
    try {
      const { name } = req.params;
      const { value } = req.body;
      const userId = req.session.userId;
      const ip = req.ip;

      const result = settingsManager.updateSetting(name, value, userId, ip);

      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }

      res.json({ success: true, message: "Setting updated successfully" });
    } catch (error) {
      console.error("Error updating setting:", error);
      res.status(500).json({ error: "Failed to update setting" });
    }
  });

  app.get("/api/admin/settings/audit", isAdmin, (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const auditLog = settingsManager.getAuditLog(limit);
      res.json({ auditLog });
    } catch (error) {
      console.error("Error fetching audit log:", error);
      res.status(500).json({ error: "Failed to fetch audit log" });
    }
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
