var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc4) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc4 = __getOwnPropDesc(from, key)) || desc4.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// shared/models/auth.ts
import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar } from "drizzle-orm/pg-core";
var sessions, users, passwordResetTokens;
var init_auth = __esm({
  "shared/models/auth.ts"() {
    "use strict";
    sessions = pgTable(
      "sessions",
      {
        sid: varchar("sid").primaryKey(),
        sess: jsonb("sess").notNull(),
        expire: timestamp("expire").notNull()
      },
      (table) => [index("IDX_session_expire").on(table.expire)]
    );
    users = pgTable("users", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      email: varchar("email").unique(),
      passwordHash: varchar("password_hash"),
      firstName: varchar("first_name"),
      lastName: varchar("last_name"),
      profileImageUrl: varchar("profile_image_url"),
      role: varchar("role").default("user").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
      updatedAt: timestamp("updated_at").defaultNow()
    });
    passwordResetTokens = pgTable("password_reset_tokens", {
      id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
      userId: varchar("user_id").notNull(),
      token: varchar("token").notNull().unique(),
      expiresAt: timestamp("expires_at").notNull(),
      used: timestamp("used"),
      createdAt: timestamp("created_at").defaultNow()
    });
  }
});

// shared/models/chat.ts
import { pgTable as pgTable2, serial, integer, text, timestamp as timestamp2 } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { sql as sql2 } from "drizzle-orm";
var conversations, messages, insertConversationSchema, insertMessageSchema;
var init_chat = __esm({
  "shared/models/chat.ts"() {
    "use strict";
    conversations = pgTable2("conversations", {
      id: serial("id").primaryKey(),
      title: text("title").notNull(),
      createdAt: timestamp2("created_at").default(sql2`CURRENT_TIMESTAMP`).notNull()
    });
    messages = pgTable2("messages", {
      id: serial("id").primaryKey(),
      conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
      role: text("role").notNull(),
      content: text("content").notNull(),
      createdAt: timestamp2("created_at").default(sql2`CURRENT_TIMESTAMP`).notNull()
    });
    insertConversationSchema = createInsertSchema(conversations).omit({
      id: true,
      createdAt: true
    });
    insertMessageSchema = createInsertSchema(messages).omit({
      id: true,
      createdAt: true
    });
  }
});

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  analyticsReports: () => analyticsReports,
  backups: () => backups,
  conversations: () => conversations,
  customerCategories: () => customerCategories,
  demandForecasts: () => demandForecasts,
  dispatches: () => dispatches,
  driverInsights: () => driverInsights,
  drivers: () => drivers,
  insertAnalyticsReportSchema: () => insertAnalyticsReportSchema,
  insertBackupSchema: () => insertBackupSchema,
  insertConversationSchema: () => insertConversationSchema,
  insertDemandForecastSchema: () => insertDemandForecastSchema,
  insertDispatchSchema: () => insertDispatchSchema,
  insertDriverInsightSchema: () => insertDriverInsightSchema,
  insertDriverSchema: () => insertDriverSchema,
  insertInventorySchema: () => insertInventorySchema,
  insertMessageSchema: () => insertMessageSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertParcelSchema: () => insertParcelSchema,
  insertPaymentSchema: () => insertPaymentSchema,
  insertProcurementSchema: () => insertProcurementSchema,
  insertProductSchema: () => insertProductSchema,
  insertRouteOptimizationSchema: () => insertRouteOptimizationSchema,
  insertRouteSchema: () => insertRouteSchema,
  insertSalespersonSchema: () => insertSalespersonSchema,
  insertShopSchema: () => insertShopSchema,
  insertStockMovementSchema: () => insertStockMovementSchema,
  insertSupplierSchema: () => insertSupplierSchema,
  insertTargetSchema: () => insertTargetSchema,
  inventory: () => inventory,
  messages: () => messages,
  orderItems: () => orderItems,
  orders: () => orders,
  parcels: () => parcels,
  passwordResetTokens: () => passwordResetTokens,
  payments: () => payments,
  procurements: () => procurements,
  products: () => products,
  routeOptimizations: () => routeOptimizations,
  routes: () => routes,
  salespersons: () => salespersons,
  sessions: () => sessions,
  shops: () => shops,
  stockMovements: () => stockMovements,
  suppliers: () => suppliers,
  targets: () => targets,
  users: () => users
});
import { sql as sql3 } from "drizzle-orm";
import { pgTable as pgTable3, text as text2, varchar as varchar2, real, integer as integer2, boolean, jsonb as jsonb2, timestamp as timestamp3 } from "drizzle-orm/pg-core";
import { createInsertSchema as createInsertSchema2 } from "drizzle-zod";
var customerCategories, shops, insertShopSchema, drivers, insertDriverSchema, routes, insertRouteSchema, targets, insertTargetSchema, routeOptimizations, insertRouteOptimizationSchema, demandForecasts, insertDemandForecastSchema, driverInsights, insertDriverInsightSchema, analyticsReports, insertAnalyticsReportSchema, backups, insertBackupSchema, products, insertProductSchema, inventory, insertInventorySchema, stockMovements, insertStockMovementSchema, suppliers, insertSupplierSchema, procurements, insertProcurementSchema, salespersons, insertSalespersonSchema, orders, insertOrderSchema, orderItems, insertOrderItemSchema, dispatches, insertDispatchSchema, parcels, insertParcelSchema, payments, insertPaymentSchema;
var init_schema = __esm({
  "shared/schema.ts"() {
    "use strict";
    init_auth();
    init_chat();
    customerCategories = [
      "kiosk",
      "retail",
      "wholesale",
      "wines_and_spirits",
      "bar_and_restaurant",
      "hotel",
      "school",
      "supplier"
    ];
    shops = pgTable3("shops", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      ownerName: text2("owner_name"),
      phone: text2("phone"),
      address: text2("address"),
      latitude: real("latitude").notNull(),
      longitude: real("longitude").notNull(),
      category: text2("category").notNull().default("retail"),
      // kiosk, retail, wholesale, wines_and_spirits, bar_and_restaurant, hotel, school, supplier
      status: text2("status").notNull().default("active"),
      // active, inactive, pending
      addedBy: varchar2("added_by"),
      notes: text2("notes"),
      contactPerson: text2("contact_person"),
      contactEmail: text2("contact_email")
    });
    insertShopSchema = createInsertSchema2(shops).omit({ id: true });
    drivers = pgTable3("drivers", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      phone: text2("phone").notNull(),
      vehicleType: text2("vehicle_type").notNull(),
      // motorcycle, van, truck
      vehiclePlate: text2("vehicle_plate"),
      status: text2("status").notNull().default("available"),
      // available, on_route, off_duty
      currentLatitude: real("current_latitude"),
      currentLongitude: real("current_longitude")
    });
    insertDriverSchema = createInsertSchema2(drivers).omit({ id: true });
    routes = pgTable3("routes", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      driverId: varchar2("driver_id"),
      shopIds: text2("shop_ids").array().notNull().default(sql3`'{}'::text[]`),
      status: text2("status").notNull().default("planned"),
      // planned, in_progress, completed
      estimatedDistance: real("estimated_distance"),
      estimatedTime: integer2("estimated_time"),
      // in minutes
      date: text2("date").notNull()
    });
    insertRouteSchema = createInsertSchema2(routes).omit({ id: true });
    targets = pgTable3("targets", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      driverId: varchar2("driver_id").notNull(),
      period: text2("period").notNull(),
      // daily, weekly, monthly
      targetShops: integer2("target_shops").notNull(),
      targetDeliveries: integer2("target_deliveries").notNull(),
      completedShops: integer2("completed_shops").notNull().default(0),
      completedDeliveries: integer2("completed_deliveries").notNull().default(0),
      startDate: text2("start_date").notNull(),
      endDate: text2("end_date").notNull()
    });
    insertTargetSchema = createInsertSchema2(targets).omit({ id: true });
    routeOptimizations = pgTable3("route_optimizations", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      routeId: varchar2("route_id"),
      originalDistance: real("original_distance"),
      optimizedDistance: real("optimized_distance"),
      timeSaved: integer2("time_saved"),
      // minutes saved
      fuelSaved: real("fuel_saved"),
      // liters saved
      suggestions: jsonb2("suggestions"),
      // AI-generated route suggestions
      optimizedShopOrder: text2("optimized_shop_order").array(),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertRouteOptimizationSchema = createInsertSchema2(routeOptimizations).omit({ id: true, createdAt: true });
    demandForecasts = pgTable3("demand_forecasts", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      shopId: varchar2("shop_id").notNull(),
      forecastDate: text2("forecast_date").notNull(),
      predictedDemand: text2("predicted_demand").notNull(),
      // high, medium, low
      confidence: real("confidence"),
      // 0-100 confidence score
      recommendedDeliveryDate: text2("recommended_delivery_date"),
      insights: jsonb2("insights"),
      // AI-generated insights
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertDemandForecastSchema = createInsertSchema2(demandForecasts).omit({ id: true, createdAt: true });
    driverInsights = pgTable3("driver_insights", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      driverId: varchar2("driver_id").notNull(),
      period: text2("period").notNull(),
      // daily, weekly, monthly
      efficiencyScore: real("efficiency_score"),
      // 0-100
      deliverySuccessRate: real("delivery_success_rate"),
      // percentage
      avgDeliveryTime: integer2("avg_delivery_time"),
      // minutes
      insights: jsonb2("insights"),
      // AI-generated performance insights
      recommendations: jsonb2("recommendations"),
      // AI recommendations for improvement
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertDriverInsightSchema = createInsertSchema2(driverInsights).omit({ id: true, createdAt: true });
    analyticsReports = pgTable3("analytics_reports", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      reportType: text2("report_type").notNull(),
      // route_optimization, demand_forecast, driver_performance, fleet_overview
      title: text2("title").notNull(),
      summary: text2("summary"),
      data: jsonb2("data"),
      // Report data in JSON format
      insights: jsonb2("insights"),
      // AI-generated insights
      generatedAt: timestamp3("generated_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertAnalyticsReportSchema = createInsertSchema2(analyticsReports).omit({ id: true, generatedAt: true });
    backups = pgTable3("backups", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      type: text2("type").notNull(),
      // manual, scheduled
      filename: text2("filename").notNull(),
      size: integer2("size"),
      // size in bytes
      recordCount: integer2("record_count"),
      // total records backed up
      status: text2("status").notNull().default("completed"),
      // completed, failed
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertBackupSchema = createInsertSchema2(backups).omit({ id: true, createdAt: true });
    products = pgTable3("products", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      sku: text2("sku").notNull(),
      category: text2("category").notNull(),
      // beverages, snacks, household, etc.
      unitPrice: real("unit_price").notNull(),
      costPrice: real("cost_price").notNull().default(0),
      unit: text2("unit").notNull().default("piece"),
      // piece, case, crate, kg, litre
      description: text2("description"),
      supplierId: varchar2("supplier_id"),
      reorderLevel: integer2("reorder_level").notNull().default(10),
      status: text2("status").notNull().default("active"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertProductSchema = createInsertSchema2(products).omit({ id: true, createdAt: true });
    inventory = pgTable3("inventory", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      productId: varchar2("product_id").notNull(),
      quantity: integer2("quantity").notNull().default(0),
      lastUpdated: timestamp3("last_updated").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertInventorySchema = createInsertSchema2(inventory).omit({ id: true, lastUpdated: true });
    stockMovements = pgTable3("stock_movements", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      productId: varchar2("product_id").notNull(),
      movementType: text2("movement_type").notNull(),
      // received, issued, adjustment
      quantity: integer2("quantity").notNull(),
      referenceId: varchar2("reference_id"),
      // order_id or procurement_id
      referenceType: text2("reference_type"),
      // order, procurement, adjustment
      notes: text2("notes"),
      performedBy: varchar2("performed_by"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertStockMovementSchema = createInsertSchema2(stockMovements).omit({ id: true, createdAt: true });
    suppliers = pgTable3("suppliers", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      contactPerson: text2("contact_person"),
      phone: text2("phone"),
      email: text2("email"),
      address: text2("address"),
      status: text2("status").notNull().default("active"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertSupplierSchema = createInsertSchema2(suppliers).omit({ id: true, createdAt: true });
    procurements = pgTable3("procurements", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      supplierId: varchar2("supplier_id").notNull(),
      productId: varchar2("product_id").notNull(),
      quantity: integer2("quantity").notNull(),
      unitCost: real("unit_cost").notNull(),
      totalCost: real("total_cost").notNull(),
      status: text2("status").notNull().default("pending"),
      // pending, received, cancelled
      stockAtOrder: integer2("stock_at_order").default(0),
      // re-order position
      orderedBy: varchar2("ordered_by"),
      receivedAt: timestamp3("received_at"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertProcurementSchema = createInsertSchema2(procurements).omit({ id: true, createdAt: true, receivedAt: true });
    salespersons = pgTable3("salespersons", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      name: text2("name").notNull(),
      phone: text2("phone").notNull(),
      email: text2("email"),
      status: text2("status").notNull().default("active"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertSalespersonSchema = createInsertSchema2(salespersons).omit({ id: true, createdAt: true });
    orders = pgTable3("orders", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      orderNumber: text2("order_number").notNull(),
      shopId: varchar2("shop_id").notNull(),
      salespersonId: varchar2("salesperson_id"),
      status: text2("status").notNull().default("pending"),
      // pending -> confirmed -> processing -> packed -> dispatched -> delivered -> paid
      totalAmount: real("total_amount").notNull().default(0),
      notes: text2("notes"),
      orderImageUrl: text2("order_image_url"),
      // snapshot of order book
      cutoffMet: boolean("cutoff_met").default(false),
      // received before 4 PM?
      deliveryDate: text2("delivery_date"),
      // next day delivery date
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`),
      updatedAt: timestamp3("updated_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertOrderSchema = createInsertSchema2(orders).omit({ id: true, createdAt: true, updatedAt: true });
    orderItems = pgTable3("order_items", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      orderId: varchar2("order_id").notNull(),
      productId: varchar2("product_id").notNull(),
      quantity: integer2("quantity").notNull(),
      unitPrice: real("unit_price").notNull(),
      totalPrice: real("total_price").notNull()
    });
    insertOrderItemSchema = createInsertSchema2(orderItems).omit({ id: true });
    dispatches = pgTable3("dispatches", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      dispatchNumber: text2("dispatch_number").notNull(),
      driverId: varchar2("driver_id").notNull(),
      routeId: varchar2("route_id"),
      status: text2("status").notNull().default("packing"),
      // packing (4PM-8AM) -> ready -> flagged_off -> in_transit -> completed
      packingStartedAt: timestamp3("packing_started_at"),
      flagOffAt: timestamp3("flag_off_at"),
      completedAt: timestamp3("completed_at"),
      totalParcels: integer2("total_parcels").notNull().default(0),
      totalValue: real("total_value").notNull().default(0),
      date: text2("date").notNull(),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertDispatchSchema = createInsertSchema2(dispatches).omit({ id: true, createdAt: true, packingStartedAt: true, flagOffAt: true, completedAt: true });
    parcels = pgTable3("parcels", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      parcelNumber: text2("parcel_number").notNull(),
      dispatchId: varchar2("dispatch_id").notNull(),
      orderId: varchar2("order_id").notNull(),
      shopId: varchar2("shop_id").notNull(),
      status: text2("status").notNull().default("packed"),
      // packed -> in_transit -> delivered -> payment_pending -> payment_confirmed -> released
      customerApproved: boolean("customer_approved").default(false),
      deliveredAt: timestamp3("delivered_at"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertParcelSchema = createInsertSchema2(parcels).omit({ id: true, createdAt: true, deliveredAt: true });
    payments = pgTable3("payments", {
      id: varchar2("id").primaryKey().default(sql3`gen_random_uuid()`),
      orderId: varchar2("order_id").notNull(),
      parcelId: varchar2("parcel_id"),
      amount: real("amount").notNull(),
      mpesaReference: text2("mpesa_reference"),
      phone: text2("phone"),
      status: text2("status").notNull().default("pending"),
      // pending, received, confirmed, failed
      confirmedBy: varchar2("confirmed_by"),
      // finance dept user
      confirmedAt: timestamp3("confirmed_at"),
      createdAt: timestamp3("created_at").default(sql3`CURRENT_TIMESTAMP`)
    });
    insertPaymentSchema = createInsertSchema2(payments).omit({ id: true, createdAt: true, confirmedAt: true });
  }
});

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
var rawUrl, isSupabase, connectionString, pool, db;
var init_db = __esm({
  "server/db.ts"() {
    "use strict";
    init_schema();
    rawUrl = process.env.DATABASE_URL ?? "";
    isSupabase = rawUrl.includes("supabase");
    connectionString = rawUrl.replace(
      /[?&]sslmode=[^&]*/g,
      (m) => m.startsWith("?") ? "?" : ""
    ).replace(/\?&/, "?").replace(/\?$/, "");
    pool = new pg.Pool({
      connectionString,
      ssl: isSupabase ? { rejectUnauthorized: false } : void 0,
      // Production pool hardening
      max: 10,
      // max connections (Supabase pooler default limit)
      idleTimeoutMillis: 3e4,
      // close idle clients after 30s
      connectionTimeoutMillis: 1e4,
      // fail fast if DB unreachable
      allowExitOnIdle: true
      // let Node.js exit if pool is idle (important for serverless)
    });
    pool.on("error", (err) => {
      console.error("Unexpected database pool error:", err.message);
    });
    db = drizzle(pool, { schema: schema_exports });
  }
});

// server/database-storage.ts
var database_storage_exports = {};
__export(database_storage_exports, {
  DatabaseStorage: () => DatabaseStorage
});
import { eq, desc } from "drizzle-orm";
var DatabaseStorage;
var init_database_storage = __esm({
  "server/database-storage.ts"() {
    "use strict";
    init_db();
    init_schema();
    DatabaseStorage = class {
      // ============ SHOPS ============
      async getAllShops() {
        return db.select().from(shops);
      }
      async getShop(id) {
        const [row] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
        return row;
      }
      async createShop(data) {
        const [row] = await db.insert(shops).values(data).returning();
        return row;
      }
      async updateShop(id, updates) {
        const [row] = await db.update(shops).set(updates).where(eq(shops.id, id)).returning();
        return row;
      }
      async deleteShop(id) {
        const result = await db.delete(shops).where(eq(shops.id, id)).returning();
        return result.length > 0;
      }
      // ============ DRIVERS ============
      async getAllDrivers() {
        return db.select().from(drivers);
      }
      async getDriver(id) {
        const [row] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
        return row;
      }
      async createDriver(data) {
        const [row] = await db.insert(drivers).values(data).returning();
        return row;
      }
      async updateDriver(id, updates) {
        const [row] = await db.update(drivers).set(updates).where(eq(drivers.id, id)).returning();
        return row;
      }
      async deleteDriver(id) {
        const result = await db.delete(drivers).where(eq(drivers.id, id)).returning();
        return result.length > 0;
      }
      // ============ ROUTES ============
      async getAllRoutes() {
        return db.select().from(routes);
      }
      async getRoute(id) {
        const [row] = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
        return row;
      }
      async createRoute(data) {
        const [row] = await db.insert(routes).values(data).returning();
        return row;
      }
      async updateRoute(id, updates) {
        const [row] = await db.update(routes).set(updates).where(eq(routes.id, id)).returning();
        return row;
      }
      async deleteRoute(id) {
        const result = await db.delete(routes).where(eq(routes.id, id)).returning();
        return result.length > 0;
      }
      // ============ TARGETS ============
      async getAllTargets() {
        return db.select().from(targets);
      }
      async getTarget(id) {
        const [row] = await db.select().from(targets).where(eq(targets.id, id)).limit(1);
        return row;
      }
      async createTarget(data) {
        const [row] = await db.insert(targets).values(data).returning();
        return row;
      }
      async updateTarget(id, updates) {
        const [row] = await db.update(targets).set(updates).where(eq(targets.id, id)).returning();
        return row;
      }
      async deleteTarget(id) {
        const result = await db.delete(targets).where(eq(targets.id, id)).returning();
        return result.length > 0;
      }
      // ============ PRODUCTS ============
      async getAllProducts() {
        return db.select().from(products);
      }
      async getProduct(id) {
        const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
        return row;
      }
      async createProduct(data) {
        const [row] = await db.insert(products).values(data).returning();
        return row;
      }
      async updateProduct(id, updates) {
        const [row] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
        return row;
      }
      async deleteProduct(id) {
        const result = await db.delete(products).where(eq(products.id, id)).returning();
        return result.length > 0;
      }
      // ============ INVENTORY ============
      async getAllInventory() {
        return db.select().from(inventory);
      }
      async getInventoryByProduct(productId) {
        const [row] = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
        return row;
      }
      async upsertInventory(data) {
        const existing = await this.getInventoryByProduct(data.productId);
        if (existing) {
          const [row2] = await db.update(inventory).set({ quantity: data.quantity }).where(eq(inventory.id, existing.id)).returning();
          return row2;
        }
        const [row] = await db.insert(inventory).values(data).returning();
        return row;
      }
      // ============ STOCK MOVEMENTS ============
      async getAllStockMovements() {
        return db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
      }
      async createStockMovement(data) {
        const [row] = await db.insert(stockMovements).values(data).returning();
        return row;
      }
      // ============ SUPPLIERS ============
      async getAllSuppliers() {
        return db.select().from(suppliers);
      }
      async getSupplier(id) {
        const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
        return row;
      }
      async createSupplier(data) {
        const [row] = await db.insert(suppliers).values(data).returning();
        return row;
      }
      async updateSupplier(id, updates) {
        const [row] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
        return row;
      }
      async deleteSupplier(id) {
        const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
        return result.length > 0;
      }
      // ============ PROCUREMENTS ============
      async getAllProcurements() {
        return db.select().from(procurements).orderBy(desc(procurements.createdAt));
      }
      async getProcurement(id) {
        const [row] = await db.select().from(procurements).where(eq(procurements.id, id)).limit(1);
        return row;
      }
      async createProcurement(data) {
        const [row] = await db.insert(procurements).values(data).returning();
        return row;
      }
      async updateProcurement(id, updates) {
        const [row] = await db.update(procurements).set(updates).where(eq(procurements.id, id)).returning();
        return row;
      }
      // ============ SALESPERSONS ============
      async getAllSalespersons() {
        return db.select().from(salespersons);
      }
      async getSalesperson(id) {
        const [row] = await db.select().from(salespersons).where(eq(salespersons.id, id)).limit(1);
        return row;
      }
      async createSalesperson(data) {
        const [row] = await db.insert(salespersons).values(data).returning();
        return row;
      }
      async updateSalesperson(id, updates) {
        const [row] = await db.update(salespersons).set(updates).where(eq(salespersons.id, id)).returning();
        return row;
      }
      async deleteSalesperson(id) {
        const result = await db.delete(salespersons).where(eq(salespersons.id, id)).returning();
        return result.length > 0;
      }
      // ============ ORDERS ============
      async getAllOrders() {
        return db.select().from(orders).orderBy(desc(orders.createdAt));
      }
      async getOrder(id) {
        const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
        return row;
      }
      async createOrder(data) {
        const [row] = await db.insert(orders).values(data).returning();
        return row;
      }
      async updateOrder(id, updates) {
        const [row] = await db.update(orders).set({ ...updates, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
        return row;
      }
      async deleteOrder(id) {
        const result = await db.delete(orders).where(eq(orders.id, id)).returning();
        return result.length > 0;
      }
      // ============ ORDER ITEMS ============
      async getOrderItems(orderId) {
        return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
      }
      async createOrderItem(data) {
        const [row] = await db.insert(orderItems).values(data).returning();
        return row;
      }
      // ============ DISPATCHES ============
      async getAllDispatches() {
        return db.select().from(dispatches).orderBy(desc(dispatches.createdAt));
      }
      async getDispatch(id) {
        const [row] = await db.select().from(dispatches).where(eq(dispatches.id, id)).limit(1);
        return row;
      }
      async createDispatch(data) {
        const [row] = await db.insert(dispatches).values(data).returning();
        return row;
      }
      async updateDispatch(id, updates) {
        const [row] = await db.update(dispatches).set(updates).where(eq(dispatches.id, id)).returning();
        return row;
      }
      // ============ PARCELS ============
      async getAllParcels(dispatchId) {
        if (dispatchId) {
          return db.select().from(parcels).where(eq(parcels.dispatchId, dispatchId));
        }
        return db.select().from(parcels);
      }
      async getParcel(id) {
        const [row] = await db.select().from(parcels).where(eq(parcels.id, id)).limit(1);
        return row;
      }
      async createParcel(data) {
        const [row] = await db.insert(parcels).values(data).returning();
        return row;
      }
      async updateParcel(id, updates) {
        const [row] = await db.update(parcels).set(updates).where(eq(parcels.id, id)).returning();
        return row;
      }
      // ============ PAYMENTS ============
      async getAllPayments() {
        return db.select().from(payments).orderBy(desc(payments.createdAt));
      }
      async getPayment(id) {
        const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
        return row;
      }
      async createPayment(data) {
        const [row] = await db.insert(payments).values(data).returning();
        return row;
      }
      async updatePayment(id, updates) {
        const [row] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
        return row;
      }
    };
  }
});

// server/vercel-entry.ts
import express from "express";

// server/routes.ts
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import cors from "cors";
import crypto2 from "crypto";

// server/storage.ts
import { randomUUID } from "crypto";
var MemStorage = class {
  shops;
  drivers;
  routes;
  targets;
  products;
  inventoryMap;
  stockMovementsMap;
  suppliersMap;
  procurementsMap;
  salespersonsMap;
  ordersMap;
  orderItemsMap;
  dispatchesMap;
  parcelsMap;
  paymentsMap;
  constructor() {
    this.shops = /* @__PURE__ */ new Map();
    this.drivers = /* @__PURE__ */ new Map();
    this.routes = /* @__PURE__ */ new Map();
    this.targets = /* @__PURE__ */ new Map();
    this.products = /* @__PURE__ */ new Map();
    this.inventoryMap = /* @__PURE__ */ new Map();
    this.stockMovementsMap = /* @__PURE__ */ new Map();
    this.suppliersMap = /* @__PURE__ */ new Map();
    this.procurementsMap = /* @__PURE__ */ new Map();
    this.salespersonsMap = /* @__PURE__ */ new Map();
    this.ordersMap = /* @__PURE__ */ new Map();
    this.orderItemsMap = /* @__PURE__ */ new Map();
    this.dispatchesMap = /* @__PURE__ */ new Map();
    this.parcelsMap = /* @__PURE__ */ new Map();
    this.paymentsMap = /* @__PURE__ */ new Map();
    this.seedData();
  }
  seedData() {
    const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
    const sampleShops = [
      { name: "Mama Njeri Kiosk", ownerName: "Grace Njeri", phone: "+254712345678", address: "Huruma Estate Block A", latitude: -1.2585, longitude: 36.8615, category: "kiosk", status: "active" },
      { name: "Mathare General Store", ownerName: "John Kamau", phone: "+254723456789", address: "Mathare 4A", latitude: -1.2565, longitude: 36.859, category: "retail", status: "active" },
      { name: "Juja Road Wholesale", ownerName: "Peter Ochieng", phone: "+254734567890", address: "Juja Road", latitude: -1.2595, longitude: 36.865, category: "wholesale", status: "active" },
      { name: "Karibu Mini Mart", ownerName: "Mary Wanjiku", phone: "+254745678901", address: "Huruma Market", latitude: -1.261, longitude: 36.86, category: "retail", status: "active" },
      { name: "Baba Junior Shop", ownerName: "James Mwangi", phone: "+254756789012", address: "Mathare North", latitude: -1.252, longitude: 36.864, category: "kiosk", status: "pending" },
      { name: "Upendo Store", ownerName: "Elizabeth Akinyi", phone: "+254767890123", address: "Ngei Estate", latitude: -1.263, longitude: 36.858, category: "retail", status: "active" }
    ];
    sampleShops.forEach((shop) => {
      const id = randomUUID();
      this.shops.set(id, { ...shop, id });
    });
    const sampleDrivers = [
      { name: "David Omondi", phone: "+254778901234", vehicleType: "motorcycle", vehiclePlate: "KMCA 123A", status: "available", currentLatitude: -1.259, currentLongitude: 36.862 },
      { name: "Samuel Kiprop", phone: "+254789012345", vehicleType: "van", vehiclePlate: "KBZ 456B", status: "on_route", currentLatitude: -1.2575, currentLongitude: 36.8605 },
      { name: "Michael Otieno", phone: "+254790123456", vehicleType: "motorcycle", vehiclePlate: "KMCB 789C", status: "available" },
      { name: "Joseph Wafula", phone: "+254701234567", vehicleType: "truck", vehiclePlate: "KCA 012D", status: "off_duty" }
    ];
    const driverIds = [];
    sampleDrivers.forEach((driver) => {
      const id = randomUUID();
      driverIds.push(id);
      this.drivers.set(id, { ...driver, id });
    });
    const shopIds = Array.from(this.shops.keys());
    const sampleRoutes = [
      { name: "Morning Route - Zone A", driverId: driverIds[0], shopIds: shopIds.slice(0, 3), status: "planned", estimatedDistance: 2.5, estimatedTime: 45, date: today },
      { name: "Afternoon Delivery", driverId: driverIds[1], shopIds: shopIds.slice(2, 5), status: "in_progress", estimatedDistance: 3.2, estimatedTime: 55, date: today }
    ];
    sampleRoutes.forEach((route) => {
      const id = randomUUID();
      this.routes.set(id, { ...route, id });
    });
    const endOfWeek = /* @__PURE__ */ new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const sampleTargets = [
      { driverId: driverIds[0], period: "weekly", targetShops: 30, targetDeliveries: 50, completedShops: 18, completedDeliveries: 32, startDate: today, endDate: endOfWeek.toISOString().split("T")[0] },
      { driverId: driverIds[1], period: "daily", targetShops: 8, targetDeliveries: 15, completedShops: 5, completedDeliveries: 9, startDate: today, endDate: today }
    ];
    sampleTargets.forEach((target) => {
      const id = randomUUID();
      this.targets.set(id, { ...target, id });
    });
    const supplierIds = [];
    const sampleSuppliers = [
      { name: "Bidco Africa", contactPerson: "Anne Wambui", phone: "+254711111111", email: "orders@bidco.co.ke", address: "Thika Road", status: "active" },
      { name: "EABL Distributors", contactPerson: "Tom Otieno", phone: "+254722222222", email: "supply@eabl.co.ke", address: "Ruaraka", status: "active" },
      { name: "Kapa Oil Refineries", contactPerson: "Lucy Njeri", phone: "+254733333333", email: "sales@kapa.co.ke", address: "Limuru Road", status: "active" }
    ];
    sampleSuppliers.forEach((s) => {
      const id = randomUUID();
      supplierIds.push(id);
      this.suppliersMap.set(id, { ...s, id, createdAt: /* @__PURE__ */ new Date() });
    });
    const productIds = [];
    const sampleProducts = [
      { name: "Kimbo 1kg", sku: "KMB-1KG", category: "cooking_oil", unitPrice: 350, costPrice: 280, unit: "piece", reorderLevel: 20, supplierId: supplierIds[0], status: "active" },
      { name: "Tusker Lager 500ml", sku: "TSK-500", category: "beverages", unitPrice: 230, costPrice: 180, unit: "crate", reorderLevel: 50, supplierId: supplierIds[1], status: "active" },
      { name: "Cowboy Bread 400g", sku: "CB-400G", category: "bakery", unitPrice: 60, costPrice: 45, unit: "piece", reorderLevel: 100, supplierId: supplierIds[2], status: "active" },
      { name: "Elianto 2L", sku: "ELT-2L", category: "cooking_oil", unitPrice: 580, costPrice: 460, unit: "piece", reorderLevel: 15, supplierId: supplierIds[0], status: "active" },
      { name: "White Cap Lager 500ml", sku: "WCL-500", category: "beverages", unitPrice: 220, costPrice: 175, unit: "crate", reorderLevel: 40, supplierId: supplierIds[1], status: "active" }
    ];
    sampleProducts.forEach((p) => {
      const id = randomUUID();
      productIds.push(id);
      this.products.set(id, { ...p, id, createdAt: /* @__PURE__ */ new Date() });
    });
    const inventoryQtys = [150, 80, 200, 45, 120];
    productIds.forEach((pid, i) => {
      const id = randomUUID();
      this.inventoryMap.set(id, { id, productId: pid, quantity: inventoryQtys[i], lastUpdated: /* @__PURE__ */ new Date() });
    });
    const spIds = [];
    const sampleSalespersons = [
      { name: "Alice Muthoni", phone: "+254700100100", email: "alice@veew.co.ke", status: "active" },
      { name: "Brian Odhiambo", phone: "+254700200200", email: "brian@veew.co.ke", status: "active" },
      { name: "Catherine Wanjiru", phone: "+254700300300", email: "catherine@veew.co.ke", status: "active" }
    ];
    sampleSalespersons.forEach((sp) => {
      const id = randomUUID();
      spIds.push(id);
      this.salespersonsMap.set(id, { ...sp, id, createdAt: /* @__PURE__ */ new Date() });
    });
    const orderIds = [];
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const sampleOrders = [
      { orderNumber: "ORD-001", shopId: shopIds[0], salespersonId: spIds[0], status: "confirmed", totalAmount: 3500, cutoffMet: true, deliveryDate: tomorrowStr, notes: "Regular weekly order" },
      { orderNumber: "ORD-002", shopId: shopIds[1], salespersonId: spIds[1], status: "packed", totalAmount: 12e3, cutoffMet: true, deliveryDate: tomorrowStr, notes: "Bulk wholesale order" },
      { orderNumber: "ORD-003", shopId: shopIds[2], salespersonId: spIds[0], status: "pending", totalAmount: 5800, cutoffMet: false, deliveryDate: tomorrowStr, notes: "Received after cutoff" },
      { orderNumber: "ORD-004", shopId: shopIds[3], salespersonId: spIds[2], status: "delivered", totalAmount: 2200, cutoffMet: true, deliveryDate: today, notes: "Delivered successfully" }
    ];
    sampleOrders.forEach((o) => {
      const id = randomUUID();
      orderIds.push(id);
      this.ordersMap.set(id, { ...o, id, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() });
    });
    const dispatchId = randomUUID();
    this.dispatchesMap.set(dispatchId, {
      id: dispatchId,
      dispatchNumber: "DSP-001",
      driverId: driverIds[0],
      routeId: Array.from(this.routes.keys())[0] || null,
      status: "flagged_off",
      packingStartedAt: new Date((/* @__PURE__ */ new Date()).setHours(16, 0, 0)),
      flagOffAt: new Date((/* @__PURE__ */ new Date()).setHours(8, 0, 0)),
      completedAt: null,
      totalParcels: 2,
      totalValue: 15500,
      date: today,
      createdAt: /* @__PURE__ */ new Date()
    });
    [0, 1].forEach((i) => {
      const id = randomUUID();
      this.parcelsMap.set(id, {
        id,
        parcelNumber: `PCL-00${i + 1}`,
        dispatchId,
        orderId: orderIds[i],
        shopId: shopIds[i],
        status: i === 0 ? "delivered" : "in_transit",
        customerApproved: i === 0,
        deliveredAt: i === 0 ? /* @__PURE__ */ new Date() : null,
        createdAt: /* @__PURE__ */ new Date()
      });
    });
    const payId = randomUUID();
    this.paymentsMap.set(payId, {
      id: payId,
      orderId: orderIds[3],
      parcelId: null,
      amount: 2200,
      mpesaReference: "SHK7891234",
      phone: "+254712345678",
      status: "confirmed",
      confirmedBy: "finance",
      confirmedAt: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    });
    const procId = randomUUID();
    this.procurementsMap.set(procId, {
      id: procId,
      supplierId: supplierIds[0],
      productId: productIds[0],
      quantity: 100,
      unitCost: 280,
      totalCost: 28e3,
      status: "received",
      stockAtOrder: 50,
      orderedBy: "admin",
      receivedAt: /* @__PURE__ */ new Date(),
      createdAt: /* @__PURE__ */ new Date()
    });
    const mvId1 = randomUUID();
    this.stockMovementsMap.set(mvId1, {
      id: mvId1,
      productId: productIds[0],
      movementType: "received",
      quantity: 100,
      referenceId: procId,
      referenceType: "procurement",
      notes: "Delivery from Bidco",
      performedBy: "stores",
      createdAt: /* @__PURE__ */ new Date()
    });
    const mvId2 = randomUUID();
    this.stockMovementsMap.set(mvId2, {
      id: mvId2,
      productId: productIds[0],
      movementType: "issued",
      quantity: 10,
      referenceId: orderIds[0],
      referenceType: "order",
      notes: "Packed for ORD-001",
      performedBy: "stores",
      createdAt: /* @__PURE__ */ new Date()
    });
  }
  // Shops
  async getAllShops() {
    return Array.from(this.shops.values());
  }
  async getShop(id) {
    return this.shops.get(id);
  }
  async createShop(insertShop) {
    const id = randomUUID();
    const shop = { ...insertShop, id };
    this.shops.set(id, shop);
    return shop;
  }
  async updateShop(id, updates) {
    const shop = this.shops.get(id);
    if (!shop) return void 0;
    const updated = { ...shop, ...updates };
    this.shops.set(id, updated);
    return updated;
  }
  async deleteShop(id) {
    return this.shops.delete(id);
  }
  // Drivers
  async getAllDrivers() {
    return Array.from(this.drivers.values());
  }
  async getDriver(id) {
    return this.drivers.get(id);
  }
  async createDriver(insertDriver) {
    const id = randomUUID();
    const driver = { ...insertDriver, id };
    this.drivers.set(id, driver);
    return driver;
  }
  async updateDriver(id, updates) {
    const driver = this.drivers.get(id);
    if (!driver) return void 0;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }
  async deleteDriver(id) {
    return this.drivers.delete(id);
  }
  // Routes
  async getAllRoutes() {
    return Array.from(this.routes.values());
  }
  async getRoute(id) {
    return this.routes.get(id);
  }
  async createRoute(insertRoute) {
    const id = randomUUID();
    const route = { ...insertRoute, id };
    this.routes.set(id, route);
    return route;
  }
  async updateRoute(id, updates) {
    const route = this.routes.get(id);
    if (!route) return void 0;
    const updated = { ...route, ...updates };
    this.routes.set(id, updated);
    return updated;
  }
  async deleteRoute(id) {
    return this.routes.delete(id);
  }
  // Targets
  async getAllTargets() {
    return Array.from(this.targets.values());
  }
  async getTarget(id) {
    return this.targets.get(id);
  }
  async createTarget(insertTarget) {
    const id = randomUUID();
    const target = { ...insertTarget, id };
    this.targets.set(id, target);
    return target;
  }
  async updateTarget(id, updates) {
    const target = this.targets.get(id);
    if (!target) return void 0;
    const updated = { ...target, ...updates };
    this.targets.set(id, updated);
    return updated;
  }
  async deleteTarget(id) {
    return this.targets.delete(id);
  }
  // Products
  async getAllProducts() {
    return Array.from(this.products.values());
  }
  async getProduct(id) {
    return this.products.get(id);
  }
  async createProduct(data) {
    const id = randomUUID();
    const product = { ...data, id, createdAt: /* @__PURE__ */ new Date() };
    this.products.set(id, product);
    return product;
  }
  async updateProduct(id, updates) {
    const p = this.products.get(id);
    if (!p) return void 0;
    const updated = { ...p, ...updates };
    this.products.set(id, updated);
    return updated;
  }
  async deleteProduct(id) {
    return this.products.delete(id);
  }
  // Inventory
  async getAllInventory() {
    return Array.from(this.inventoryMap.values());
  }
  async getInventoryByProduct(productId) {
    return Array.from(this.inventoryMap.values()).find((i) => i.productId === productId);
  }
  async upsertInventory(data) {
    const existing = await this.getInventoryByProduct(data.productId);
    if (existing) {
      const updated = { ...existing, quantity: data.quantity, lastUpdated: /* @__PURE__ */ new Date() };
      this.inventoryMap.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const inv = { ...data, id, lastUpdated: /* @__PURE__ */ new Date() };
    this.inventoryMap.set(id, inv);
    return inv;
  }
  // Stock Movements
  async getAllStockMovements() {
    return Array.from(this.stockMovementsMap.values());
  }
  async createStockMovement(data) {
    const id = randomUUID();
    const movement = { ...data, id, createdAt: /* @__PURE__ */ new Date() };
    this.stockMovementsMap.set(id, movement);
    return movement;
  }
  // Suppliers
  async getAllSuppliers() {
    return Array.from(this.suppliersMap.values());
  }
  async getSupplier(id) {
    return this.suppliersMap.get(id);
  }
  async createSupplier(data) {
    const id = randomUUID();
    const supplier = { ...data, id, createdAt: /* @__PURE__ */ new Date() };
    this.suppliersMap.set(id, supplier);
    return supplier;
  }
  async updateSupplier(id, updates) {
    const s = this.suppliersMap.get(id);
    if (!s) return void 0;
    const updated = { ...s, ...updates };
    this.suppliersMap.set(id, updated);
    return updated;
  }
  async deleteSupplier(id) {
    return this.suppliersMap.delete(id);
  }
  // Procurements
  async getAllProcurements() {
    return Array.from(this.procurementsMap.values());
  }
  async getProcurement(id) {
    return this.procurementsMap.get(id);
  }
  async createProcurement(data) {
    const id = randomUUID();
    const procurement = { ...data, id, createdAt: /* @__PURE__ */ new Date(), receivedAt: null };
    this.procurementsMap.set(id, procurement);
    return procurement;
  }
  async updateProcurement(id, updates) {
    const p = this.procurementsMap.get(id);
    if (!p) return void 0;
    const updated = { ...p, ...updates };
    this.procurementsMap.set(id, updated);
    return updated;
  }
  // Salespersons
  async getAllSalespersons() {
    return Array.from(this.salespersonsMap.values());
  }
  async getSalesperson(id) {
    return this.salespersonsMap.get(id);
  }
  async createSalesperson(data) {
    const id = randomUUID();
    const sp = { ...data, id, createdAt: /* @__PURE__ */ new Date() };
    this.salespersonsMap.set(id, sp);
    return sp;
  }
  async updateSalesperson(id, updates) {
    const sp = this.salespersonsMap.get(id);
    if (!sp) return void 0;
    const updated = { ...sp, ...updates };
    this.salespersonsMap.set(id, updated);
    return updated;
  }
  async deleteSalesperson(id) {
    return this.salespersonsMap.delete(id);
  }
  // Orders
  async getAllOrders() {
    return Array.from(this.ordersMap.values());
  }
  async getOrder(id) {
    return this.ordersMap.get(id);
  }
  async createOrder(data) {
    const id = randomUUID();
    const order = { ...data, id, createdAt: /* @__PURE__ */ new Date(), updatedAt: /* @__PURE__ */ new Date() };
    this.ordersMap.set(id, order);
    return order;
  }
  async updateOrder(id, updates) {
    const o = this.ordersMap.get(id);
    if (!o) return void 0;
    const updated = { ...o, ...updates, updatedAt: /* @__PURE__ */ new Date() };
    this.ordersMap.set(id, updated);
    return updated;
  }
  async deleteOrder(id) {
    return this.ordersMap.delete(id);
  }
  // Order Items
  async getOrderItems(orderId) {
    return Array.from(this.orderItemsMap.values()).filter((i) => i.orderId === orderId);
  }
  async createOrderItem(data) {
    const id = randomUUID();
    const item = { ...data, id };
    this.orderItemsMap.set(id, item);
    return item;
  }
  // Dispatches
  async getAllDispatches() {
    return Array.from(this.dispatchesMap.values());
  }
  async getDispatch(id) {
    return this.dispatchesMap.get(id);
  }
  async createDispatch(data) {
    const id = randomUUID();
    const dispatch = { ...data, id, createdAt: /* @__PURE__ */ new Date(), packingStartedAt: /* @__PURE__ */ new Date(), flagOffAt: null, completedAt: null };
    this.dispatchesMap.set(id, dispatch);
    return dispatch;
  }
  async updateDispatch(id, updates) {
    const d = this.dispatchesMap.get(id);
    if (!d) return void 0;
    const updated = { ...d, ...updates };
    this.dispatchesMap.set(id, updated);
    return updated;
  }
  // Parcels
  async getAllParcels(dispatchId) {
    const all = Array.from(this.parcelsMap.values());
    if (dispatchId) return all.filter((p) => p.dispatchId === dispatchId);
    return all;
  }
  async getParcel(id) {
    return this.parcelsMap.get(id);
  }
  async createParcel(data) {
    const id = randomUUID();
    const parcel = { ...data, id, createdAt: /* @__PURE__ */ new Date(), deliveredAt: null };
    this.parcelsMap.set(id, parcel);
    return parcel;
  }
  async updateParcel(id, updates) {
    const p = this.parcelsMap.get(id);
    if (!p) return void 0;
    const updated = { ...p, ...updates };
    this.parcelsMap.set(id, updated);
    return updated;
  }
  // Payments
  async getAllPayments() {
    return Array.from(this.paymentsMap.values());
  }
  async getPayment(id) {
    return this.paymentsMap.get(id);
  }
  async createPayment(data) {
    const id = randomUUID();
    const payment = { ...data, id, createdAt: /* @__PURE__ */ new Date(), confirmedAt: null };
    this.paymentsMap.set(id, payment);
    return payment;
  }
  async updatePayment(id, updates) {
    const p = this.paymentsMap.get(id);
    if (!p) return void 0;
    const updated = { ...p, ...updates };
    this.paymentsMap.set(id, updated);
    return updated;
  }
};
function createStorage() {
  if (process.env.DATABASE_URL) {
    const { DatabaseStorage: DatabaseStorage2 } = (init_database_storage(), __toCommonJS(database_storage_exports));
    return new DatabaseStorage2();
  }
  return new MemStorage();
}
var storage = createStorage();

// server/routes.ts
init_schema();

// server/auth.ts
init_db();
init_auth();
init_db();
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq as eq2, and, gt, isNull } from "drizzle-orm";

// server/emails.ts
import nodemailer from "nodemailer";
var transporter = null;
function initializeEmailTransporter() {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM || smtpUser;
  if (!smtpHost || !smtpUser || !smtpPass) {
    console.warn("SMTP credentials not configured. Password reset emails will not be sent.");
    return null;
  }
  transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass
    }
  });
  console.log("Email transporter initialized");
  return transporter;
}
async function sendPasswordResetEmail(email, resetUrl) {
  if (!transporter) {
    console.error("Email transporter not configured");
    return false;
  }
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: "Veew Distributors - Password Reset Request",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your Veew Distributors account.</p>
          <p>Click the button below to reset your password. This link will expire in 1 hour.</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #2563eb; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 6px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p style="color: #666; font-size: 14px;">
            If you didn't request this reset, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="color: #999; font-size: 12px;">
            Veew Distributors - Route Optimization System
          </p>
        </div>
      `,
      text: `
        Password Reset Request
        
        You requested a password reset for your Veew Distributors account.
        
        Click this link to reset your password (expires in 1 hour):
        ${resetUrl}
        
        If you didn't request this reset, you can safely ignore this email.
        
        Veew Distributors - Route Optimization System
      `
    });
    console.log("Password reset email sent successfully");
    return true;
  } catch (error) {
    console.error("Failed to send password reset email:", error);
    return false;
  }
}
function isEmailConfigured() {
  return transporter !== null;
}

// server/auth.ts
var PgSession = connectPgSimple(session);
async function setupAuth(app2) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  app2.set("trust proxy", 1);
  app2.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: false
      }),
      name: "__veew_sid",
      // Custom cookie name (avoid default connect.sid fingerprinting)
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1e3,
        // 7 days
        sameSite: "lax"
      }
    })
  );
}
function registerAuthRoutes(app2) {
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const [user] = await db.select().from(users).where(eq2(users.email, email.toLowerCase())).limit(1);
      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      if (!user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }
      const oldSession = req.session;
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Login failed" });
          }
          const { passwordHash, ...userData } = user;
          res.json(userData);
        });
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("__veew_sid");
      res.json({ success: true });
    });
  });
  app2.get("/api/auth/user", async (req, res) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      const [user] = await db.select().from(users).where(eq2(users.id, req.session.userId)).limit(1);
      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }
      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });
  app2.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }
      const [user] = await db.select().from(users).where(eq2(users.email, email.toLowerCase())).limit(1);
      if (!user) {
        return res.json({ success: true, message: "If your email exists, you will receive a reset link" });
      }
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await db.update(passwordResetTokens).set({ used: /* @__PURE__ */ new Date() }).where(eq2(passwordResetTokens.userId, user.id));
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt
      });
      const protocol = req.secure ? "https" : "http";
      const host = req.get("host");
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;
      if (isEmailConfigured()) {
        const sent = await sendPasswordResetEmail(user.email, resetUrl);
        if (!sent) {
          console.error("Failed to send reset email");
        }
      } else if (process.env.NODE_ENV !== "production") {
        console.log("========================================");
        console.log("PASSWORD RESET TOKEN (email not configured)");
        console.log(`Email: ${user.email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("========================================");
      }
      res.json({ success: true, message: "If your email exists, you will receive a reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });
  app2.get("/api/auth/verify-reset-token", async (req, res) => {
    try {
      const { token } = req.query;
      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, error: "Token is required" });
      }
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const [resetToken] = await db.select().from(passwordResetTokens).where(
        and(
          eq2(passwordResetTokens.token, tokenHash),
          gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date()),
          isNull(passwordResetTokens.used)
        )
      ).limit(1);
      if (!resetToken) {
        return res.json({ valid: false, error: "Invalid or expired token" });
      }
      res.json({ valid: true });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ valid: false, error: "Failed to verify token" });
    }
  });
  app2.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a digit" });
      }
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const [resetToken] = await db.select().from(passwordResetTokens).where(
        and(
          eq2(passwordResetTokens.token, tokenHash),
          gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date()),
          isNull(passwordResetTokens.used)
        )
      ).limit(1);
      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      const passwordHash = await hashPassword(password);
      await db.update(users).set({ passwordHash, updatedAt: /* @__PURE__ */ new Date() }).where(eq2(users.id, resetToken.userId));
      await db.update(passwordResetTokens).set({ used: /* @__PURE__ */ new Date() }).where(eq2(passwordResetTokens.id, resetToken.id));
      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
  app2.get("/api/auth/my-data", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = req.session.userId;
      const [user] = await db.select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        profileImageUrl: users.profileImageUrl,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt
      }).from(users).where(eq2(users.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({
        exportDate: (/* @__PURE__ */ new Date()).toISOString(),
        dataController: "Veew Distributors",
        dataSubject: user,
        note: "This export contains all personal data held about you in compliance with the Kenya Data Protection Act 2019."
      });
    } catch (error) {
      console.error("Data export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });
  app2.delete("/api/auth/delete-account", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = req.session.userId;
      const [user] = await db.select({ role: users.role }).from(users).where(eq2(users.id, userId)).limit(1);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      if (user.role === "admin") {
        const allAdmins = await db.select({ id: users.id }).from(users).where(eq2(users.role, "admin"));
        if (allAdmins.length <= 1) {
          return res.status(400).json({ error: "Cannot delete the last admin account" });
        }
      }
      await db.delete(passwordResetTokens).where(eq2(passwordResetTokens.userId, userId));
      await db.delete(users).where(eq2(users.id, userId));
      req.session.destroy(() => {
      });
      res.clearCookie("__veew_sid");
      res.json({ success: true, message: "Account and personal data deleted" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
}
function isAuthenticated(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}
function isAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const userId = req.session.userId;
  db.select({ role: users.role }).from(users).where(eq2(users.id, userId)).then((rows) => {
    if (!rows.length || rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }).catch(() => {
    res.status(500).json({ error: "Authorization check failed" });
  });
}
async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}
async function ensureAdminUser(email, password) {
  const [existingUser] = await db.select().from(users).where(eq2(users.email, email.toLowerCase())).limit(1);
  if (existingUser) {
    const passwordMatch = existingUser.passwordHash ? await bcrypt.compare(password, existingUser.passwordHash) : false;
    if (!passwordMatch || existingUser.role !== "admin") {
      const passwordHash = await hashPassword(password);
      await db.update(users).set({
        passwordHash,
        role: "admin",
        updatedAt: /* @__PURE__ */ new Date()
      }).where(eq2(users.email, email.toLowerCase()));
    }
  } else {
    const passwordHash = await hashPassword(password);
    await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin"
    });
  }
}

// server/ai/analytics-routes.ts
import { z } from "zod";

// server/ai/openai-client.ts
import OpenAI from "openai";
var openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL
});

// server/ai/route-optimizer.ts
init_db();
init_schema();
import { eq as eq3 } from "drizzle-orm";
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}
function calculateTotalDistance(shopList) {
  let total = 0;
  for (let i = 0; i < shopList.length - 1; i++) {
    total += calculateDistance(
      shopList[i].latitude,
      shopList[i].longitude,
      shopList[i + 1].latitude,
      shopList[i + 1].longitude
    );
  }
  return total;
}
function nearestNeighborOptimization(shopList) {
  if (shopList.length <= 2) return shopList;
  const optimized = [shopList[0]];
  const remaining = [...shopList.slice(1)];
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistance(
        current.latitude,
        current.longitude,
        remaining[i].latitude,
        remaining[i].longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }
  return optimized;
}
async function optimizeRoute(routeId) {
  const [route] = await db.select().from(routes).where(eq3(routes.id, routeId));
  if (!route) throw new Error("Route not found");
  const shopIds = route.shopIds || [];
  if (shopIds.length < 2) {
    return {
      optimizedOrder: shopIds,
      originalDistance: 0,
      optimizedDistance: 0,
      timeSaved: 0,
      fuelSaved: 0,
      suggestions: ["Route has too few stops for optimization"]
    };
  }
  const allShops = await db.select().from(shops);
  const routeShops = shopIds.map((id) => allShops.find((s) => s.id === id)).filter((s) => s !== void 0);
  const originalDistance = calculateTotalDistance(routeShops);
  const optimizedShops = nearestNeighborOptimization(routeShops);
  const optimizedDistance = calculateTotalDistance(optimizedShops);
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = Math.round(distanceSaved * 3);
  const fuelSaved = Math.round(distanceSaved * 0.1 * 10) / 10;
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a route optimization expert for delivery operations in Nairobi, Kenya's Huruma/Mathare area. Analyze delivery routes and provide actionable suggestions for improvement. Be concise and practical.`
      },
      {
        role: "user",
        content: `Analyze this delivery route optimization:
Route: ${route.name}
Original stops order: ${routeShops.map((s) => s.name).join(" \u2192 ")}
Optimized stops order: ${optimizedShops.map((s) => s.name).join(" \u2192 ")}
Original distance: ${originalDistance.toFixed(2)} km
Optimized distance: ${optimizedDistance.toFixed(2)} km
Distance saved: ${distanceSaved.toFixed(2)} km
Estimated time saved: ${timeSaved} minutes

Provide 3-5 specific suggestions for further route optimization, considering Nairobi traffic patterns, delivery windows, and fuel efficiency. Format as a JSON array of strings.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });
  let suggestions = [];
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    suggestions = parsed.suggestions || parsed.recommendations || [];
  } catch {
    suggestions = ["Consider traffic patterns during peak hours", "Group nearby shops together", "Schedule deliveries during off-peak times"];
  }
  await db.insert(routeOptimizations).values({
    routeId,
    originalDistance,
    optimizedDistance,
    timeSaved,
    fuelSaved,
    suggestions,
    optimizedShopOrder: optimizedShops.map((s) => s.id)
  });
  return {
    optimizedOrder: optimizedShops.map((s) => s.id),
    originalDistance,
    optimizedDistance,
    timeSaved,
    fuelSaved,
    suggestions
  };
}
async function getRouteOptimizationHistory(routeId, limit = 50) {
  if (routeId) {
    return db.select().from(routeOptimizations).where(eq3(routeOptimizations.routeId, routeId)).limit(limit);
  }
  return db.select().from(routeOptimizations).limit(limit);
}

// server/ai/demand-forecaster.ts
init_db();
init_schema();
import { eq as eq4 } from "drizzle-orm";
async function forecastDemand(shopId) {
  const [shop] = await db.select().from(shops).where(eq4(shops.id, shopId));
  if (!shop) throw new Error("Shop not found");
  const allRoutes = await db.select().from(routes);
  const shopRoutes = allRoutes.filter((r) => r.shopIds?.includes(shopId));
  const deliveryFrequency = shopRoutes.length;
  const recentDeliveries = shopRoutes.filter((r) => r.status === "completed").length;
  const today = /* @__PURE__ */ new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a demand forecasting expert for distribution operations in Nairobi, Kenya. Analyze shop data and delivery patterns to predict restocking needs. Provide actionable forecasts.`
      },
      {
        role: "user",
        content: `Forecast demand for this shop:
Shop: ${shop.name}
Category: ${shop.category}
Location: ${shop.address || "Huruma/Mathare area"}
Status: ${shop.status}
Total routes assigned: ${deliveryFrequency}
Completed deliveries: ${recentDeliveries}

Based on this data, predict:
1. Demand level (high, medium, low)
2. Confidence score (0-100)
3. Recommended next delivery date (choose from: ${today.toISOString().split("T")[0]}, ${tomorrow.toISOString().split("T")[0]}, ${dayAfter.toISOString().split("T")[0]})
4. 3 insights about this shop's demand patterns

Return as JSON: { "demand": "high|medium|low", "confidence": number, "deliveryDate": "YYYY-MM-DD", "insights": ["insight1", "insight2", "insight3"] }`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 400
  });
  let result = {
    demand: "medium",
    confidence: 75,
    deliveryDate: tomorrow.toISOString().split("T")[0],
    insights: ["Regular delivery schedule recommended", "Monitor stock levels", "Consider category-specific patterns"]
  };
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    result = {
      demand: parsed.demand || "medium",
      confidence: parsed.confidence || 75,
      deliveryDate: parsed.deliveryDate || result.deliveryDate,
      insights: parsed.insights || result.insights
    };
  } catch {
  }
  await db.insert(demandForecasts).values({
    shopId,
    forecastDate: today.toISOString().split("T")[0],
    predictedDemand: result.demand,
    confidence: result.confidence,
    recommendedDeliveryDate: result.deliveryDate,
    insights: result.insights
  });
  return {
    shopId,
    shopName: shop.name,
    predictedDemand: result.demand,
    confidence: result.confidence,
    recommendedDeliveryDate: result.deliveryDate,
    insights: result.insights
  };
}
async function forecastAllShops() {
  const allShops = await db.select().from(shops);
  const results = [];
  for (const shop of allShops) {
    try {
      const forecast = await forecastDemand(shop.id);
      results.push(forecast);
    } catch (err) {
      console.error(`Failed to forecast for shop ${shop.id}:`, err);
    }
  }
  return results;
}
async function getDemandForecastHistory(shopId, limit = 50) {
  if (shopId) {
    return db.select().from(demandForecasts).where(eq4(demandForecasts.shopId, shopId)).limit(limit);
  }
  return db.select().from(demandForecasts).limit(limit);
}

// server/ai/driver-analytics.ts
init_db();
init_schema();
import { eq as eq5 } from "drizzle-orm";
async function analyzeDriverPerformance(driverId, period = "weekly") {
  const [driver] = await db.select().from(drivers).where(eq5(drivers.id, driverId));
  if (!driver) throw new Error("Driver not found");
  const allRoutes = await db.select().from(routes);
  const driverRoutes = allRoutes.filter((r) => r.driverId === driverId);
  const completedRoutes = driverRoutes.filter((r) => r.status === "completed");
  const inProgressRoutes = driverRoutes.filter((r) => r.status === "in_progress");
  const allTargets = await db.select().from(targets).where(eq5(targets.driverId, driverId));
  const periodTargets = allTargets.filter((t) => t.period === period);
  const totalDeliveries = periodTargets.reduce((sum, t) => sum + t.completedDeliveries, 0);
  const targetDeliveries = periodTargets.reduce((sum, t) => sum + t.targetDeliveries, 0);
  const deliverySuccessRate = targetDeliveries > 0 ? totalDeliveries / targetDeliveries * 100 : 0;
  const totalDistance = driverRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);
  const totalTime = driverRoutes.reduce((sum, r) => sum + (r.estimatedTime || 0), 0);
  const avgDeliveryTime = driverRoutes.length > 0 ? Math.round(totalTime / driverRoutes.length) : 0;
  const efficiencyScore = Math.min(100, Math.round(
    deliverySuccessRate * 0.4 + (completedRoutes.length > 0 ? 30 : 0) + (driver.status === "available" ? 20 : 10) + (avgDeliveryTime < 60 ? 10 : 5)
  ));
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a fleet performance analyst for a distribution company in Nairobi, Kenya. Analyze driver performance data and provide actionable insights and recommendations for improvement.`
      },
      {
        role: "user",
        content: `Analyze this driver's performance:
Driver: ${driver.name}
Vehicle: ${driver.vehicleType} (${driver.vehiclePlate || "No plate"})
Status: ${driver.status}
Period: ${period}

Performance Metrics:
- Total routes assigned: ${driverRoutes.length}
- Completed routes: ${completedRoutes.length}
- In-progress routes: ${inProgressRoutes.length}
- Delivery success rate: ${deliverySuccessRate.toFixed(1)}%
- Average delivery time: ${avgDeliveryTime} minutes
- Total distance covered: ${totalDistance.toFixed(1)} km
- Efficiency score: ${efficiencyScore}/100

Provide:
1. 3 key insights about this driver's performance
2. 3 specific recommendations for improvement

Return as JSON: { "insights": ["insight1", "insight2", "insight3"], "recommendations": ["rec1", "rec2", "rec3"] }`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });
  let aiResult = {
    insights: ["Consistent delivery performance", "Good route completion rate", "Room for efficiency improvement"],
    recommendations: ["Optimize route planning", "Consider peak hour avoidance", "Regular vehicle maintenance"]
  };
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    aiResult = {
      insights: parsed.insights || aiResult.insights,
      recommendations: parsed.recommendations || aiResult.recommendations
    };
  } catch {
  }
  await db.insert(driverInsights).values({
    driverId,
    period,
    efficiencyScore,
    deliverySuccessRate,
    avgDeliveryTime,
    insights: aiResult.insights,
    recommendations: aiResult.recommendations
  });
  return {
    driverId,
    driverName: driver.name,
    efficiencyScore,
    deliverySuccessRate,
    avgDeliveryTime,
    insights: aiResult.insights,
    recommendations: aiResult.recommendations
  };
}
async function analyzeAllDrivers(period = "weekly") {
  const allDrivers = await db.select().from(drivers);
  const results = [];
  for (const driver of allDrivers) {
    try {
      const analysis = await analyzeDriverPerformance(driver.id, period);
      results.push(analysis);
    } catch (err) {
      console.error(`Failed to analyze driver ${driver.id}:`, err);
    }
  }
  return results;
}
async function getDriverInsightsHistory(driverId, limit = 50) {
  if (driverId) {
    return db.select().from(driverInsights).where(eq5(driverInsights.driverId, driverId)).limit(limit);
  }
  return db.select().from(driverInsights).limit(limit);
}

// server/ai/analytics-routes.ts
init_db();
init_schema();
import { desc as desc2 } from "drizzle-orm";
var periodSchema = z.enum(["daily", "weekly", "monthly"]).default("weekly");
var reportTypeSchema = z.enum(["fleet_overview", "route_optimization", "demand_forecast", "driver_performance"]).default("fleet_overview");
var uuidSchema = z.string().uuid();
var QUERY_LIMIT = 50;
function registerAnalyticsRoutes(app2) {
  app2.post("/api/analytics/optimize-route/:routeId", isAuthenticated, async (req, res) => {
    try {
      const routeIdResult = uuidSchema.safeParse(req.params.routeId);
      if (!routeIdResult.success) {
        return res.status(400).json({ error: "Invalid route ID format" });
      }
      const result = await optimizeRoute(routeIdResult.data);
      res.json(result);
    } catch (error) {
      console.error("Route optimization error:", error);
      res.status(500).json({ error: "Failed to optimize route" });
    }
  });
  app2.get("/api/analytics/route-optimizations", isAuthenticated, async (req, res) => {
    try {
      const { routeId } = req.query;
      const validatedRouteId = routeId ? uuidSchema.safeParse(routeId) : null;
      const history = await getRouteOptimizationHistory(
        validatedRouteId?.success ? validatedRouteId.data : void 0,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch optimization history" });
    }
  });
  app2.post("/api/analytics/forecast-demand/:shopId", isAuthenticated, async (req, res) => {
    try {
      const shopIdResult = uuidSchema.safeParse(req.params.shopId);
      if (!shopIdResult.success) {
        return res.status(400).json({ error: "Invalid shop ID format" });
      }
      const result = await forecastDemand(shopIdResult.data);
      res.json(result);
    } catch (error) {
      console.error("Demand forecast error:", error);
      res.status(500).json({ error: "Failed to forecast demand" });
    }
  });
  app2.post("/api/analytics/forecast-all-shops", isAuthenticated, async (req, res) => {
    try {
      const results = await forecastAllShops();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to forecast demand for shops" });
    }
  });
  app2.get("/api/analytics/demand-forecasts", isAuthenticated, async (req, res) => {
    try {
      const { shopId } = req.query;
      const validatedShopId = shopId ? uuidSchema.safeParse(shopId) : null;
      const history = await getDemandForecastHistory(
        validatedShopId?.success ? validatedShopId.data : void 0,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch demand forecasts" });
    }
  });
  app2.post("/api/analytics/analyze-driver/:driverId", isAuthenticated, async (req, res) => {
    try {
      const driverIdResult = uuidSchema.safeParse(req.params.driverId);
      if (!driverIdResult.success) {
        return res.status(400).json({ error: "Invalid driver ID format" });
      }
      const parseResult = z.object({ period: periodSchema }).safeParse(req.body);
      const period = parseResult.success ? parseResult.data.period : "weekly";
      const result = await analyzeDriverPerformance(driverIdResult.data, period);
      res.json(result);
    } catch (error) {
      console.error("Driver analysis error:", error);
      res.status(500).json({ error: "Failed to analyze driver performance" });
    }
  });
  app2.post("/api/analytics/analyze-all-drivers", isAuthenticated, async (req, res) => {
    try {
      const parseResult = z.object({ period: periodSchema }).safeParse(req.body);
      const period = parseResult.success ? parseResult.data.period : "weekly";
      const results = await analyzeAllDrivers(period);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze drivers" });
    }
  });
  app2.get("/api/analytics/driver-insights", isAuthenticated, async (req, res) => {
    try {
      const { driverId } = req.query;
      const validatedDriverId = driverId ? uuidSchema.safeParse(driverId) : null;
      const history = await getDriverInsightsHistory(
        validatedDriverId?.success ? validatedDriverId.data : void 0,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver insights" });
    }
  });
  app2.get("/api/analytics/dashboard", isAuthenticated, async (req, res) => {
    try {
      const allShops = await db.select().from(shops);
      const allDrivers = await db.select().from(drivers);
      const allRoutes = await db.select().from(routes);
      const allTargets = await db.select().from(targets);
      const activeShops = allShops.filter((s) => s.status === "active").length;
      const availableDrivers = allDrivers.filter((d) => d.status === "available").length;
      const completedRoutes = allRoutes.filter((r) => r.status === "completed").length;
      const inProgressRoutes = allRoutes.filter((r) => r.status === "in_progress").length;
      const totalDeliveries = allTargets.reduce((sum, t) => sum + t.completedDeliveries, 0);
      const targetDeliveries = allTargets.reduce((sum, t) => sum + t.targetDeliveries, 0);
      const overallProgress = targetDeliveries > 0 ? Math.round(totalDeliveries / targetDeliveries * 100) : 0;
      const totalDistance = allRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);
      res.json({
        summary: {
          totalShops: allShops.length,
          activeShops,
          totalDrivers: allDrivers.length,
          availableDrivers,
          totalRoutes: allRoutes.length,
          completedRoutes,
          inProgressRoutes,
          overallProgress,
          totalDistance: Math.round(totalDistance * 10) / 10
        },
        shopsByCategory: {
          retail: allShops.filter((s) => s.category === "retail").length,
          wholesale: allShops.filter((s) => s.category === "wholesale").length,
          kiosk: allShops.filter((s) => s.category === "kiosk").length
        },
        driversByStatus: {
          available: availableDrivers,
          onRoute: allDrivers.filter((d) => d.status === "on_route").length,
          offDuty: allDrivers.filter((d) => d.status === "off_duty").length
        },
        routesByStatus: {
          planned: allRoutes.filter((r) => r.status === "planned").length,
          inProgress: inProgressRoutes,
          completed: completedRoutes
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });
  app2.post("/api/analytics/generate-report", isAuthenticated, async (req, res) => {
    try {
      const parseResult = z.object({ reportType: reportTypeSchema }).safeParse(req.body);
      const reportType = parseResult.success ? parseResult.data.reportType : "fleet_overview";
      const allShops = await db.select().from(shops);
      const allDrivers = await db.select().from(drivers);
      const allRoutes = await db.select().from(routes);
      const allTargets = await db.select().from(targets);
      const reportData = {
        shops: allShops.length,
        drivers: allDrivers.length,
        routes: allRoutes.length,
        completedDeliveries: allTargets.reduce((sum, t) => sum + t.completedDeliveries, 0),
        targetDeliveries: allTargets.reduce((sum, t) => sum + t.targetDeliveries, 0),
        totalDistance: allRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0)
      };
      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: "You are an expert business analyst for a distribution company in Nairobi, Kenya. Generate insightful reports based on operational data."
          },
          {
            role: "user",
            content: `Generate a ${reportType} report based on this data:
${JSON.stringify(reportData, null, 2)}

Provide:
1. A concise title
2. An executive summary (2-3 sentences)
3. 5 key insights
4. 3 actionable recommendations

Return as JSON: { "title": "string", "summary": "string", "insights": ["string"], "recommendations": ["string"] }`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 600
      });
      let reportContent = {
        title: `${reportType.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())} Report`,
        summary: "Fleet operations are running as expected with opportunities for optimization.",
        insights: ["Data analysis in progress"],
        recommendations: ["Continue monitoring performance"]
      };
      try {
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        reportContent = {
          title: parsed.title || reportContent.title,
          summary: parsed.summary || reportContent.summary,
          insights: parsed.insights || reportContent.insights,
          recommendations: parsed.recommendations || reportContent.recommendations
        };
      } catch {
      }
      const [report] = await db.insert(analyticsReports).values({
        reportType,
        title: reportContent.title,
        summary: reportContent.summary,
        data: reportData,
        insights: reportContent.insights
      }).returning();
      res.json({
        ...report,
        recommendations: reportContent.recommendations
      });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });
  app2.get("/api/analytics/reports", isAuthenticated, async (req, res) => {
    try {
      const reports = await db.select().from(analyticsReports).orderBy(desc2(analyticsReports.generatedAt)).limit(QUERY_LIMIT);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });
}

// server/backup.ts
init_db();
init_schema();
import { desc as desc3 } from "drizzle-orm";
async function createBackup(type = "manual") {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  }).from(users);
  const allShops = await db.select().from(shops);
  const allDrivers = await db.select().from(drivers);
  const allRoutes = await db.select().from(routes);
  const allTargets = await db.select().from(targets);
  const allRouteOptimizations = await db.select().from(routeOptimizations);
  const allDemandForecasts = await db.select().from(demandForecasts);
  const allDriverInsights = await db.select().from(driverInsights);
  const allAnalyticsReports = await db.select().from(analyticsReports);
  const allBackups = await db.select().from(backups);
  const tables = {
    users: allUsers.length,
    shops: allShops.length,
    drivers: allDrivers.length,
    routes: allRoutes.length,
    targets: allTargets.length,
    routeOptimizations: allRouteOptimizations.length,
    demandForecasts: allDemandForecasts.length,
    driverInsights: allDriverInsights.length,
    analyticsReports: allAnalyticsReports.length,
    backups: allBackups.length
  };
  const totalRecords = Object.values(tables).reduce((sum, count) => sum + count, 0);
  const backup = {
    version: "1.0",
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    type,
    data: {
      users: allUsers,
      shops: allShops,
      drivers: allDrivers,
      routes: allRoutes,
      targets: allTargets,
      routeOptimizations: allRouteOptimizations,
      demandForecasts: allDemandForecasts,
      driverInsights: allDriverInsights,
      analyticsReports: allAnalyticsReports,
      backups: allBackups
    },
    metadata: {
      totalRecords,
      tables
    }
  };
  const filename = `veew_backup_${type}_${(/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-")}.json`;
  const jsonString = JSON.stringify(backup, null, 2);
  const size = Buffer.byteLength(jsonString, "utf8");
  await db.insert(backups).values({
    type,
    filename,
    size,
    recordCount: totalRecords,
    status: "completed"
  });
  return backup;
}
async function getBackupHistory(limit = 20) {
  return db.select().from(backups).orderBy(desc3(backups.createdAt)).limit(limit);
}

// server/routes.ts
init_db();
init_auth();
import { eq as eq6 } from "drizzle-orm";
import { writeFileSync, readFileSync, existsSync } from "fs";
import { join } from "path";
function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
function paginatedResponse(data, page, limit) {
  return {
    data: data.slice(0, limit),
    pagination: { page, limit, count: data.length, hasMore: data.length > limit }
  };
}
async function registerRoutes(httpServer, app2) {
  await setupAuth(app2);
  const allowedOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim()) : void 0;
  if (allowedOrigins) {
    app2.use(cors({ origin: allowedOrigins, credentials: true }));
  }
  const isProd = process.env.NODE_ENV === "production";
  app2.use(
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
          upgradeInsecureRequests: []
        }
      },
      crossOriginEmbedderPolicy: false,
      // needed for map tile images
      referrerPolicy: { policy: "strict-origin-when-cross-origin" },
      strictTransportSecurity: {
        maxAge: 63072e3,
        // 2 years
        includeSubDomains: true,
        preload: true
      }
    })
  );
  app2.use((_req, res, next) => {
    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()"
    );
    next();
  });
  app2.use("/api/auth/login", rateLimit({ windowMs: 15 * 60 * 1e3, max: 10, message: { error: "Too many login attempts, try again later" } }));
  app2.use("/api/auth/forgot-password", rateLimit({ windowMs: 15 * 60 * 1e3, max: 5, message: { error: "Too many reset requests, try again later" } }));
  app2.use("/api/", rateLimit({ windowMs: 60 * 1e3, max: 120, message: { error: "Rate limit exceeded" } }));
  registerAuthRoutes(app2);
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.AI_ADMIN_PASSWORD;
  if (adminPassword) {
    await ensureAdminUser(adminEmail, adminPassword);
  }
  app2.get("/api/shops", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allShops = await storage.getAllShops();
      res.json(paginatedResponse(allShops, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch shops" });
    }
  });
  app2.get("/api/shops/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/shops", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/shops/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/shops/:id", isAdmin, async (req, res) => {
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
  app2.get("/api/drivers", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allDrivers = await storage.getAllDrivers();
      res.json(paginatedResponse(allDrivers, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });
  app2.get("/api/drivers/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/drivers", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/drivers/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/drivers/:id", isAdmin, async (req, res) => {
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
  app2.get("/api/routes", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allRoutes = await storage.getAllRoutes();
      res.json(paginatedResponse(allRoutes, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch routes" });
    }
  });
  app2.get("/api/routes/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/routes", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/routes/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/routes/:id", isAdmin, async (req, res) => {
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
  app2.get("/api/targets", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      const allTargets = await storage.getAllTargets();
      res.json(paginatedResponse(allTargets, page, limit));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch targets" });
    }
  });
  app2.get("/api/targets/:id", isAuthenticated, async (req, res) => {
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
  app2.post("/api/targets", isAuthenticated, async (req, res) => {
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
  app2.patch("/api/targets/:id", isAuthenticated, async (req, res) => {
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
  app2.delete("/api/targets/:id", isAdmin, async (req, res) => {
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
  registerAnalyticsRoutes(app2);
  app2.get("/api/products", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllProducts(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.get("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const p = await storage.getProduct(req.params.id);
      if (!p) return res.status(404).json({ error: "Product not found" });
      res.json(p);
    } catch {
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });
  app2.post("/api/products", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProductSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createProduct(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create product" });
    }
  });
  app2.patch("/api/products/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProductSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateProduct(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Product not found" });
      res.json(p);
    } catch {
      res.status(500).json({ error: "Failed to update product" });
    }
  });
  app2.delete("/api/products/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteProduct(req.params.id)) return res.status(404).json({ error: "Product not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete product" });
    }
  });
  app2.get("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllInventory(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch inventory" });
    }
  });
  app2.post("/api/inventory", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertInventorySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.json(await storage.upsertInventory(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to update inventory" });
    }
  });
  app2.get("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllStockMovements(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch stock movements" });
    }
  });
  app2.post("/api/stock-movements", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertStockMovementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createStockMovement(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create stock movement" });
    }
  });
  app2.get("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllSuppliers(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch suppliers" });
    }
  });
  app2.post("/api/suppliers", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createSupplier(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create supplier" });
    }
  });
  app2.patch("/api/suppliers/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSupplierSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const s = await storage.updateSupplier(req.params.id, parsed.data);
      if (!s) return res.status(404).json({ error: "Supplier not found" });
      res.json(s);
    } catch {
      res.status(500).json({ error: "Failed to update supplier" });
    }
  });
  app2.delete("/api/suppliers/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteSupplier(req.params.id)) return res.status(404).json({ error: "Supplier not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete supplier" });
    }
  });
  app2.get("/api/procurements", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllProcurements(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch procurements" });
    }
  });
  app2.post("/api/procurements", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProcurementSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createProcurement(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create procurement" });
    }
  });
  app2.patch("/api/procurements/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertProcurementSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateProcurement(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Procurement not found" });
      res.json(p);
    } catch {
      res.status(500).json({ error: "Failed to update procurement" });
    }
  });
  app2.get("/api/salespersons", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllSalespersons(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch salespersons" });
    }
  });
  app2.post("/api/salespersons", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSalespersonSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createSalesperson(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create salesperson" });
    }
  });
  app2.patch("/api/salespersons/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertSalespersonSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const sp = await storage.updateSalesperson(req.params.id, parsed.data);
      if (!sp) return res.status(404).json({ error: "Salesperson not found" });
      res.json(sp);
    } catch {
      res.status(500).json({ error: "Failed to update salesperson" });
    }
  });
  app2.delete("/api/salespersons/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteSalesperson(req.params.id)) return res.status(404).json({ error: "Salesperson not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete salesperson" });
    }
  });
  app2.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllOrders(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const o = await storage.getOrder(req.params.id);
      if (!o) return res.status(404).json({ error: "Order not found" });
      res.json(o);
    } catch {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  app2.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createOrder(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create order" });
    }
  });
  app2.patch("/api/orders/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const o = await storage.updateOrder(req.params.id, parsed.data);
      if (!o) return res.status(404).json({ error: "Order not found" });
      res.json(o);
    } catch {
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  app2.delete("/api/orders/:id", isAdmin, async (req, res) => {
    try {
      if (!await storage.deleteOrder(req.params.id)) return res.status(404).json({ error: "Order not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete order" });
    }
  });
  app2.get("/api/orders/:id/items", isAuthenticated, async (req, res) => {
    try {
      res.json(await storage.getOrderItems(req.params.id));
    } catch {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });
  app2.post("/api/order-items", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertOrderItemSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createOrderItem(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create order item" });
    }
  });
  app2.get("/api/dispatches", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllDispatches(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch dispatches" });
    }
  });
  app2.get("/api/dispatches/:id", isAuthenticated, async (req, res) => {
    try {
      const d = await storage.getDispatch(req.params.id);
      if (!d) return res.status(404).json({ error: "Dispatch not found" });
      res.json(d);
    } catch {
      res.status(500).json({ error: "Failed to fetch dispatch" });
    }
  });
  app2.post("/api/dispatches", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDispatchSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createDispatch(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create dispatch" });
    }
  });
  app2.patch("/api/dispatches/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertDispatchSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const d = await storage.updateDispatch(req.params.id, parsed.data);
      if (!d) return res.status(404).json({ error: "Dispatch not found" });
      res.json(d);
    } catch {
      res.status(500).json({ error: "Failed to update dispatch" });
    }
  });
  app2.get("/api/parcels", isAuthenticated, async (req, res) => {
    try {
      const dispatchId = req.query.dispatchId;
      res.json(await storage.getAllParcels(dispatchId));
    } catch {
      res.status(500).json({ error: "Failed to fetch parcels" });
    }
  });
  app2.post("/api/parcels", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertParcelSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createParcel(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create parcel" });
    }
  });
  app2.patch("/api/parcels/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertParcelSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updateParcel(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Parcel not found" });
      res.json(p);
    } catch {
      res.status(500).json({ error: "Failed to update parcel" });
    }
  });
  app2.get("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const { page, limit } = parsePagination(req);
      res.json(paginatedResponse(await storage.getAllPayments(), page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  });
  app2.post("/api/payments", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertPaymentSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      res.status(201).json(await storage.createPayment(parsed.data));
    } catch {
      res.status(500).json({ error: "Failed to create payment" });
    }
  });
  app2.patch("/api/payments/:id", isAuthenticated, async (req, res) => {
    try {
      const parsed = insertPaymentSchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Invalid data", details: parsed.error.errors });
      const p = await storage.updatePayment(req.params.id, parsed.data);
      if (!p) return res.status(404).json({ error: "Payment not found" });
      res.json(p);
    } catch {
      res.status(500).json({ error: "Failed to update payment" });
    }
  });
  app2.get("/api/admin/users", isAdmin, async (req, res) => {
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
        updatedAt: users.updatedAt
      }).from(users);
      res.json(paginatedResponse(allUsers, page, limit));
    } catch {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });
  app2.post("/api/admin/users", isAdmin, async (req, res) => {
    try {
      const { email, password, firstName, lastName, role } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
      if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a digit" });
      }
      const [existing] = await db.select().from(users).where(eq6(users.email, email.toLowerCase())).limit(1);
      if (existing) return res.status(409).json({ error: "A user with this email already exists" });
      const passwordHash = await hashPassword(password);
      const [newUser] = await db.insert(users).values({
        email: email.toLowerCase(),
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        role: role === "admin" ? "admin" : "user"
      }).returning();
      const { passwordHash: _, ...userData } = newUser;
      res.status(201).json(userData);
    } catch (error) {
      console.error("Create user error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  app2.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const { firstName, lastName, role, password } = req.body;
      const updates = { updatedAt: /* @__PURE__ */ new Date() };
      if (firstName !== void 0) updates.firstName = firstName;
      if (lastName !== void 0) updates.lastName = lastName;
      if (role !== void 0) updates.role = role === "admin" ? "admin" : "user";
      if (password) updates.passwordHash = await hashPassword(password);
      const [updated] = await db.update(users).set(updates).where(eq6(users.id, req.params.id)).returning();
      if (!updated) return res.status(404).json({ error: "User not found" });
      const { passwordHash: _, ...userData } = updated;
      res.json(userData);
    } catch {
      res.status(500).json({ error: "Failed to update user" });
    }
  });
  app2.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      if (req.session.userId === req.params.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }
      const [deleted] = await db.delete(users).where(eq6(users.id, req.params.id)).returning();
      if (!deleted) return res.status(404).json({ error: "User not found" });
      res.status(204).send();
    } catch {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });
  const ENV_KEYS = [
    "DATABASE_URL",
    "SESSION_SECRET",
    "ADMIN_EMAIL",
    "AI_ADMIN_PASSWORD",
    "CRON_SECRET",
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USER",
    "SMTP_PASS",
    "SMTP_FROM",
    "AI_INTEGRATIONS_OPENAI_API_KEY",
    "AI_INTEGRATIONS_OPENAI_BASE_URL",
    "CORS_ORIGIN"
  ];
  app2.get("/api/admin/settings", isAdmin, (_req, res) => {
    const settings = {};
    for (const key of ENV_KEYS) {
      const val = process.env[key];
      if (val && ["DATABASE_URL", "SESSION_SECRET", "AI_ADMIN_PASSWORD", "SMTP_PASS", "AI_INTEGRATIONS_OPENAI_API_KEY", "CRON_SECRET"].includes(key)) {
        settings[key] = val.length > 4 ? "****" + val.slice(-4) : "****";
      } else {
        settings[key] = val || "";
      }
    }
    res.json({ keys: ENV_KEYS, settings });
  });
  app2.put("/api/admin/settings", isAdmin, (req, res) => {
    try {
      const updates = req.body;
      const applied = [];
      for (const [key, value] of Object.entries(updates)) {
        if (!ENV_KEYS.includes(key)) continue;
        if (typeof value === "string" && value.startsWith("****")) continue;
        if (typeof value === "string" && value.trim() !== "") {
          const sanitized = value.trim().replace(/[\r\n]/g, "");
          process.env[key] = sanitized;
          applied.push(key);
        }
      }
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
      } catch {
      }
      res.json({ success: true, applied });
    } catch {
      res.status(500).json({ error: "Failed to save settings" });
    }
  });
  app2.post("/api/backup", isAdmin, async (_req, res) => {
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
  app2.post("/api/backup/cron", async (req, res) => {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return res.status(500).json({ error: "CRON_SECRET not configured" });
    }
    const authHeader = req.header("authorization") || "";
    const expected = `Bearer ${cronSecret}`;
    const authBuf = Buffer.from(authHeader);
    const expectedBuf = Buffer.from(expected);
    if (authBuf.length !== expectedBuf.length || !crypto2.timingSafeEqual(authBuf, expectedBuf)) {
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
  app2.get("/api/backup/history", isAdmin, async (_req, res) => {
    try {
      const history = await getBackupHistory();
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backup history" });
    }
  });
  return httpServer;
}

// server/vercel-entry.ts
import { createServer } from "http";
var app = express();
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: false, limit: "1mb" }));
var initialized = false;
var initPromise = (async () => {
  if (initialized) return;
  initialized = true;
  initializeEmailTransporter();
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Internal Server Error:", err);
    if (!res.headersSent) {
      res.status(status).json({ message });
    }
  });
})();
async function handler(req, res) {
  await initPromise;
  app(req, res);
}
export {
  handler as default
};
