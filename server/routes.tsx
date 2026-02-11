import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertShopSchema, insertDriverSchema, insertRouteSchema, insertTargetSchema } from "@shared/schema";
import { setupAuth, registerAuthRoutes, ensureAdminUser, isAuthenticated } from "./auth";
import { registerAnalyticsRoutes } from "./ai/analytics-routes";
import { createBackup, getBackupHistory } from "./backup";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Set up authentication BEFORE other routes
  await setupAuth(app);
  registerAuthRoutes(app);
  
  // Ensure admin user exists with correct credentials
  const adminEmail = process.env.ADMIN_EMAIL || "hertlock3@gmail.com";
  const adminPassword = process.env.AI_ADMIN_PASSWORD;
  if (adminPassword) {
    await ensureAdminUser(adminEmail, adminPassword);
  }
  
  // ============ SHOPS ============
  app.get("/api/shops", isAuthenticated, async (_req, res) => {
    try {
      const shops = await storage.getAllShops();
      res.json(shops);
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
      const shop = await storage.updateShop(req.params.id, req.body);
      if (!shop) {
        return res.status(404).json({ error: "Shop not found" });
      }
      res.json(shop);
    } catch (error) {
      res.status(500).json({ error: "Failed to update shop" });
    }
  });

  app.delete("/api/shops/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/drivers", isAuthenticated, async (_req, res) => {
    try {
      const drivers = await storage.getAllDrivers();
      res.json(drivers);
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
      const driver = await storage.updateDriver(req.params.id, req.body);
      if (!driver) {
        return res.status(404).json({ error: "Driver not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to update driver" });
    }
  });

  app.delete("/api/drivers/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/routes", isAuthenticated, async (_req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
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
      const route = await storage.updateRoute(req.params.id, req.body);
      if (!route) {
        return res.status(404).json({ error: "Route not found" });
      }
      res.json(route);
    } catch (error) {
      res.status(500).json({ error: "Failed to update route" });
    }
  });

  app.delete("/api/routes/:id", isAuthenticated, async (req, res) => {
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
  app.get("/api/targets", isAuthenticated, async (_req, res) => {
    try {
      const targets = await storage.getAllTargets();
      res.json(targets);
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
      const target = await storage.updateTarget(req.params.id, req.body);
      if (!target) {
        return res.status(404).json({ error: "Target not found" });
      }
      res.json(target);
    } catch (error) {
      res.status(500).json({ error: "Failed to update target" });
    }
  });

  app.delete("/api/targets/:id", isAuthenticated, async (req, res) => {
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

  // ============ BACKUP ============
  app.post("/api/backup", isAuthenticated, async (_req, res) => {
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

    if (authHeader !== expected) {
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

  app.get("/api/backup/history", isAuthenticated, async (_req, res) => {
    try {
      const history = await getBackupHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backup history" });
    }
  });

  return httpServer;
}
