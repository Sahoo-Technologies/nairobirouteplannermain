import { sql } from "drizzle-orm";
import { pgTable, text, varchar, real, integer, boolean, jsonb, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Export auth models (users and sessions tables for Replit Auth)
export * from "./models/auth";

// Export chat models (conversations and messages tables for AI chat)
export * from "./models/chat";

// ============ CUSTOMER CATEGORIES ============
export const customerCategories = [
  "kiosk", "retail", "wholesale", "wines_and_spirits",
  "bar_and_restaurant", "hotel", "school", "supplier"
] as const;
export type CustomerCategory = typeof customerCategories[number];

// Shops table - retail outlets in the Huruma/Mathare area
export const shops = pgTable("shops", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  ownerName: text("owner_name"),
  phone: text("phone"),
  address: text("address"),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  category: text("category").notNull().default("retail"), // kiosk, retail, wholesale, wines_and_spirits, bar_and_restaurant, hotel, school, supplier
  status: text("status").notNull().default("active"), // active, inactive, pending
  addedBy: varchar("added_by"),
  notes: text("notes"),
  contactPerson: text("contact_person"),
  contactEmail: text("contact_email"),
});

export const insertShopSchema = createInsertSchema(shops).omit({ id: true });
export type InsertShop = z.infer<typeof insertShopSchema>;
export type Shop = typeof shops.$inferSelect;

// Drivers table - fleet management
export const drivers = pgTable("drivers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  vehicleType: text("vehicle_type").notNull(), // motorcycle, van, truck
  vehiclePlate: text("vehicle_plate"),
  status: text("status").notNull().default("available"), // available, on_route, off_duty
  currentLatitude: real("current_latitude"),
  currentLongitude: real("current_longitude"),
});

export const insertDriverSchema = createInsertSchema(drivers).omit({ id: true });
export type InsertDriver = z.infer<typeof insertDriverSchema>;
export type Driver = typeof drivers.$inferSelect;

// Routes table - planned delivery routes
export const routes = pgTable("routes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  driverId: varchar("driver_id"),
  shopIds: text("shop_ids").array().notNull().default(sql`'{}'::text[]`),
  status: text("status").notNull().default("planned"), // planned, in_progress, completed
  estimatedDistance: real("estimated_distance"),
  estimatedTime: integer("estimated_time"), // in minutes
  date: text("date").notNull(),
});

export const insertRouteSchema = createInsertSchema(routes).omit({ id: true });
export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

// Targets table - management targets for drivers
export const targets = pgTable("targets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  targetShops: integer("target_shops").notNull(),
  targetDeliveries: integer("target_deliveries").notNull(),
  completedShops: integer("completed_shops").notNull().default(0),
  completedDeliveries: integer("completed_deliveries").notNull().default(0),
  startDate: text("start_date").notNull(),
  endDate: text("end_date").notNull(),
});

export const insertTargetSchema = createInsertSchema(targets).omit({ id: true });
export type InsertTarget = z.infer<typeof insertTargetSchema>;
export type Target = typeof targets.$inferSelect;

// GeoJSON types for the Huruma/Mathare area
export interface GeoJSONFeature {
  type: "Feature";
  properties: {
    name?: string;
    description?: string;
    [key: string]: unknown;
  };
  geometry: {
    type: "Point" | "LineString" | "Polygon" | "MultiPolygon";
    coordinates: number[] | number[][] | number[][][] | number[][][][];
  };
}

export interface GeoJSONFeatureCollection {
  type: "FeatureCollection";
  features: GeoJSONFeature[];
}

// AI Analytics - Route optimization suggestions
export const routeOptimizations = pgTable("route_optimizations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  routeId: varchar("route_id"),
  originalDistance: real("original_distance"),
  optimizedDistance: real("optimized_distance"),
  timeSaved: integer("time_saved"), // minutes saved
  fuelSaved: real("fuel_saved"), // liters saved
  suggestions: jsonb("suggestions"), // AI-generated route suggestions
  optimizedShopOrder: text("optimized_shop_order").array(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertRouteOptimizationSchema = createInsertSchema(routeOptimizations).omit({ id: true, createdAt: true });
export type InsertRouteOptimization = z.infer<typeof insertRouteOptimizationSchema>;
export type RouteOptimization = typeof routeOptimizations.$inferSelect;

// AI Analytics - Demand forecasts for shops
export const demandForecasts = pgTable("demand_forecasts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  shopId: varchar("shop_id").notNull(),
  forecastDate: text("forecast_date").notNull(),
  predictedDemand: text("predicted_demand").notNull(), // high, medium, low
  confidence: real("confidence"), // 0-100 confidence score
  recommendedDeliveryDate: text("recommended_delivery_date"),
  insights: jsonb("insights"), // AI-generated insights
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDemandForecastSchema = createInsertSchema(demandForecasts).omit({ id: true, createdAt: true });
export type InsertDemandForecast = z.infer<typeof insertDemandForecastSchema>;
export type DemandForecast = typeof demandForecasts.$inferSelect;

// AI Analytics - Driver performance insights
export const driverInsights = pgTable("driver_insights", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  driverId: varchar("driver_id").notNull(),
  period: text("period").notNull(), // daily, weekly, monthly
  efficiencyScore: real("efficiency_score"), // 0-100
  deliverySuccessRate: real("delivery_success_rate"), // percentage
  avgDeliveryTime: integer("avg_delivery_time"), // minutes
  insights: jsonb("insights"), // AI-generated performance insights
  recommendations: jsonb("recommendations"), // AI recommendations for improvement
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDriverInsightSchema = createInsertSchema(driverInsights).omit({ id: true, createdAt: true });
export type InsertDriverInsight = z.infer<typeof insertDriverInsightSchema>;
export type DriverInsight = typeof driverInsights.$inferSelect;

// AI Analytics - Overall analytics reports
export const analyticsReports = pgTable("analytics_reports", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  reportType: text("report_type").notNull(), // route_optimization, demand_forecast, driver_performance, fleet_overview
  title: text("title").notNull(),
  summary: text("summary"),
  data: jsonb("data"), // Report data in JSON format
  insights: jsonb("insights"), // AI-generated insights
  generatedAt: timestamp("generated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertAnalyticsReportSchema = createInsertSchema(analyticsReports).omit({ id: true, generatedAt: true });
export type InsertAnalyticsReport = z.infer<typeof insertAnalyticsReportSchema>;
export type AnalyticsReport = typeof analyticsReports.$inferSelect;

// Backups table - track backup history
export const backups = pgTable("backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  type: text("type").notNull(), // manual, scheduled
  filename: text("filename").notNull(),
  size: integer("size"), // size in bytes
  recordCount: integer("record_count"), // total records backed up
  status: text("status").notNull().default("completed"), // completed, failed
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertBackupSchema = createInsertSchema(backups).omit({ id: true, createdAt: true });
export type InsertBackup = z.infer<typeof insertBackupSchema>;
export type Backup = typeof backups.$inferSelect;

// ============ PRODUCTS / SKU ============
export const products = pgTable("products", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  sku: text("sku").notNull(),
  category: text("category").notNull(), // beverages, snacks, household, etc.
  unitPrice: real("unit_price").notNull(),
  costPrice: real("cost_price").notNull().default(0),
  unit: text("unit").notNull().default("piece"), // piece, case, crate, kg, litre
  description: text("description"),
  supplierId: varchar("supplier_id"),
  reorderLevel: integer("reorder_level").notNull().default(10),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, createdAt: true });
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type Product = typeof products.$inferSelect;

// ============ INVENTORY / STOCK ============
export const inventory = pgTable("inventory", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull().default(0),
  lastUpdated: timestamp("last_updated").default(sql`CURRENT_TIMESTAMP`),
});

export const insertInventorySchema = createInsertSchema(inventory).omit({ id: true, lastUpdated: true });
export type InsertInventory = z.infer<typeof insertInventorySchema>;
export type Inventory = typeof inventory.$inferSelect;

// Stock movements (received, issued)
export const stockMovements = pgTable("stock_movements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  productId: varchar("product_id").notNull(),
  movementType: text("movement_type").notNull(), // received, issued, adjustment
  quantity: integer("quantity").notNull(),
  referenceId: varchar("reference_id"), // order_id or procurement_id
  referenceType: text("reference_type"), // order, procurement, adjustment
  notes: text("notes"),
  performedBy: varchar("performed_by"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertStockMovementSchema = createInsertSchema(stockMovements).omit({ id: true, createdAt: true });
export type InsertStockMovement = z.infer<typeof insertStockMovementSchema>;
export type StockMovement = typeof stockMovements.$inferSelect;

// ============ SUPPLIERS ============
export const suppliers = pgTable("suppliers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  contactPerson: text("contact_person"),
  phone: text("phone"),
  email: text("email"),
  address: text("address"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSupplierSchema = createInsertSchema(suppliers).omit({ id: true, createdAt: true });
export type InsertSupplier = z.infer<typeof insertSupplierSchema>;
export type Supplier = typeof suppliers.$inferSelect;

// ============ PROCUREMENT ============
export const procurements = pgTable("procurements", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  supplierId: varchar("supplier_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitCost: real("unit_cost").notNull(),
  totalCost: real("total_cost").notNull(),
  status: text("status").notNull().default("pending"), // pending, received, cancelled
  stockAtOrder: integer("stock_at_order").default(0), // re-order position
  orderedBy: varchar("ordered_by"),
  receivedAt: timestamp("received_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertProcurementSchema = createInsertSchema(procurements).omit({ id: true, createdAt: true, receivedAt: true });
export type InsertProcurement = z.infer<typeof insertProcurementSchema>;
export type Procurement = typeof procurements.$inferSelect;

// ============ SALESPERSONS ============
export const salespersons = pgTable("salespersons", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertSalespersonSchema = createInsertSchema(salespersons).omit({ id: true, createdAt: true });
export type InsertSalesperson = z.infer<typeof insertSalespersonSchema>;
export type Salesperson = typeof salespersons.$inferSelect;

// ============ ORDERS ============
export const orders = pgTable("orders", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderNumber: text("order_number").notNull(),
  shopId: varchar("shop_id").notNull(),
  salespersonId: varchar("salesperson_id"),
  status: text("status").notNull().default("pending"),
  // pending -> confirmed -> processing -> packed -> dispatched -> delivered -> paid
  totalAmount: real("total_amount").notNull().default(0),
  notes: text("notes"),
  orderImageUrl: text("order_image_url"), // snapshot of order book
  cutoffMet: boolean("cutoff_met").default(false), // received before 4 PM?
  deliveryDate: text("delivery_date"), // next day delivery date
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertOrderSchema = createInsertSchema(orders).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

// Order line items
export const orderItems = pgTable("order_items", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  productId: varchar("product_id").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: real("unit_price").notNull(),
  totalPrice: real("total_price").notNull(),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({ id: true });
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

// ============ DISPATCH ============
export const dispatches = pgTable("dispatches", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  dispatchNumber: text("dispatch_number").notNull(),
  driverId: varchar("driver_id").notNull(),
  routeId: varchar("route_id"),
  status: text("status").notNull().default("packing"),
  // packing (4PM-8AM) -> ready -> flagged_off -> in_transit -> completed
  packingStartedAt: timestamp("packing_started_at"),
  flagOffAt: timestamp("flag_off_at"),
  completedAt: timestamp("completed_at"),
  totalParcels: integer("total_parcels").notNull().default(0),
  totalValue: real("total_value").notNull().default(0),
  date: text("date").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertDispatchSchema = createInsertSchema(dispatches).omit({ id: true, createdAt: true, packingStartedAt: true, flagOffAt: true, completedAt: true });
export type InsertDispatch = z.infer<typeof insertDispatchSchema>;
export type Dispatch = typeof dispatches.$inferSelect;

// Parcels within a dispatch (each order = 1 parcel)
export const parcels = pgTable("parcels", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  parcelNumber: text("parcel_number").notNull(),
  dispatchId: varchar("dispatch_id").notNull(),
  orderId: varchar("order_id").notNull(),
  shopId: varchar("shop_id").notNull(),
  status: text("status").notNull().default("packed"),
  // packed -> in_transit -> delivered -> payment_pending -> payment_confirmed -> released
  customerApproved: boolean("customer_approved").default(false),
  deliveredAt: timestamp("delivered_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertParcelSchema = createInsertSchema(parcels).omit({ id: true, createdAt: true, deliveredAt: true });
export type InsertParcel = z.infer<typeof insertParcelSchema>;
export type Parcel = typeof parcels.$inferSelect;

// ============ PAYMENTS (MPESA) ============
export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id").notNull(),
  parcelId: varchar("parcel_id"),
  amount: real("amount").notNull(),
  mpesaReference: text("mpesa_reference"),
  phone: text("phone"),
  status: text("status").notNull().default("pending"), // pending, received, confirmed, failed
  confirmedBy: varchar("confirmed_by"), // finance dept user
  confirmedAt: timestamp("confirmed_at"),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, confirmedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
