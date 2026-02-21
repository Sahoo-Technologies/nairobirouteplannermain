import { eq, desc } from "drizzle-orm";
import { db } from "./db";
import {
  shops, drivers, routes, targets,
  products, inventory, stockMovements, suppliers,
  procurements, salespersons, orders, orderItems,
  dispatches, parcels, payments,
  type Shop, type InsertShop,
  type Driver, type InsertDriver,
  type Route, type InsertRoute,
  type Target, type InsertTarget,
  type Product, type InsertProduct,
  type Inventory, type InsertInventory,
  type StockMovement, type InsertStockMovement,
  type Supplier, type InsertSupplier,
  type Procurement, type InsertProcurement,
  type Salesperson, type InsertSalesperson,
  type Order, type InsertOrder,
  type OrderItem, type InsertOrderItem,
  type Dispatch, type InsertDispatch,
  type Parcel, type InsertParcel,
  type Payment, type InsertPayment,
} from "@shared/schema";
import type { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // ============ SHOPS ============
  async getAllShops(): Promise<Shop[]> {
    return db.select().from(shops);
  }
  async getShop(id: string): Promise<Shop | undefined> {
    const [row] = await db.select().from(shops).where(eq(shops.id, id)).limit(1);
    return row;
  }
  async createShop(data: InsertShop): Promise<Shop> {
    const [row] = await db.insert(shops).values(data).returning();
    return row;
  }
  async updateShop(id: string, updates: Partial<InsertShop>): Promise<Shop | undefined> {
    const [row] = await db.update(shops).set(updates).where(eq(shops.id, id)).returning();
    return row;
  }
  async deleteShop(id: string): Promise<boolean> {
    const result = await db.delete(shops).where(eq(shops.id, id)).returning();
    return result.length > 0;
  }

  // ============ DRIVERS ============
  async getAllDrivers(): Promise<Driver[]> {
    return db.select().from(drivers);
  }
  async getDriver(id: string): Promise<Driver | undefined> {
    const [row] = await db.select().from(drivers).where(eq(drivers.id, id)).limit(1);
    return row;
  }
  async createDriver(data: InsertDriver): Promise<Driver> {
    const [row] = await db.insert(drivers).values(data).returning();
    return row;
  }
  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const [row] = await db.update(drivers).set(updates).where(eq(drivers.id, id)).returning();
    return row;
  }
  async deleteDriver(id: string): Promise<boolean> {
    const result = await db.delete(drivers).where(eq(drivers.id, id)).returning();
    return result.length > 0;
  }

  // ============ ROUTES ============
  async getAllRoutes(): Promise<Route[]> {
    return db.select().from(routes);
  }
  async getRoute(id: string): Promise<Route | undefined> {
    const [row] = await db.select().from(routes).where(eq(routes.id, id)).limit(1);
    return row;
  }
  async createRoute(data: InsertRoute): Promise<Route> {
    const [row] = await db.insert(routes).values(data).returning();
    return row;
  }
  async updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route | undefined> {
    const [row] = await db.update(routes).set(updates).where(eq(routes.id, id)).returning();
    return row;
  }
  async deleteRoute(id: string): Promise<boolean> {
    const result = await db.delete(routes).where(eq(routes.id, id)).returning();
    return result.length > 0;
  }

  // ============ TARGETS ============
  async getAllTargets(): Promise<Target[]> {
    return db.select().from(targets);
  }
  async getTarget(id: string): Promise<Target | undefined> {
    const [row] = await db.select().from(targets).where(eq(targets.id, id)).limit(1);
    return row;
  }
  async createTarget(data: InsertTarget): Promise<Target> {
    const [row] = await db.insert(targets).values(data).returning();
    return row;
  }
  async updateTarget(id: string, updates: Partial<InsertTarget>): Promise<Target | undefined> {
    const [row] = await db.update(targets).set(updates).where(eq(targets.id, id)).returning();
    return row;
  }
  async deleteTarget(id: string): Promise<boolean> {
    const result = await db.delete(targets).where(eq(targets.id, id)).returning();
    return result.length > 0;
  }

  // ============ PRODUCTS ============
  async getAllProducts(): Promise<Product[]> {
    return db.select().from(products);
  }
  async getProduct(id: string): Promise<Product | undefined> {
    const [row] = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return row;
  }
  async createProduct(data: InsertProduct): Promise<Product> {
    const [row] = await db.insert(products).values(data).returning();
    return row;
  }
  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const [row] = await db.update(products).set(updates).where(eq(products.id, id)).returning();
    return row;
  }
  async deleteProduct(id: string): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id)).returning();
    return result.length > 0;
  }

  // ============ INVENTORY ============
  async getAllInventory(): Promise<Inventory[]> {
    return db.select().from(inventory);
  }
  async getInventoryByProduct(productId: string): Promise<Inventory | undefined> {
    const [row] = await db.select().from(inventory).where(eq(inventory.productId, productId)).limit(1);
    return row;
  }
  async upsertInventory(data: InsertInventory): Promise<Inventory> {
    const existing = await this.getInventoryByProduct(data.productId);
    if (existing) {
      const [row] = await db.update(inventory)
        .set({ quantity: data.quantity })
        .where(eq(inventory.id, existing.id))
        .returning();
      return row;
    }
    const [row] = await db.insert(inventory).values(data).returning();
    return row;
  }

  // ============ STOCK MOVEMENTS ============
  async getAllStockMovements(): Promise<StockMovement[]> {
    return db.select().from(stockMovements).orderBy(desc(stockMovements.createdAt));
  }
  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const [row] = await db.insert(stockMovements).values(data).returning();
    return row;
  }

  // ============ SUPPLIERS ============
  async getAllSuppliers(): Promise<Supplier[]> {
    return db.select().from(suppliers);
  }
  async getSupplier(id: string): Promise<Supplier | undefined> {
    const [row] = await db.select().from(suppliers).where(eq(suppliers.id, id)).limit(1);
    return row;
  }
  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const [row] = await db.insert(suppliers).values(data).returning();
    return row;
  }
  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const [row] = await db.update(suppliers).set(updates).where(eq(suppliers.id, id)).returning();
    return row;
  }
  async deleteSupplier(id: string): Promise<boolean> {
    const result = await db.delete(suppliers).where(eq(suppliers.id, id)).returning();
    return result.length > 0;
  }

  // ============ PROCUREMENTS ============
  async getAllProcurements(): Promise<Procurement[]> {
    return db.select().from(procurements).orderBy(desc(procurements.createdAt));
  }
  async getProcurement(id: string): Promise<Procurement | undefined> {
    const [row] = await db.select().from(procurements).where(eq(procurements.id, id)).limit(1);
    return row;
  }
  async createProcurement(data: InsertProcurement): Promise<Procurement> {
    const [row] = await db.insert(procurements).values(data).returning();
    return row;
  }
  async updateProcurement(id: string, updates: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const [row] = await db.update(procurements).set(updates).where(eq(procurements.id, id)).returning();
    return row;
  }

  // ============ SALESPERSONS ============
  async getAllSalespersons(): Promise<Salesperson[]> {
    return db.select().from(salespersons);
  }
  async getSalesperson(id: string): Promise<Salesperson | undefined> {
    const [row] = await db.select().from(salespersons).where(eq(salespersons.id, id)).limit(1);
    return row;
  }
  async createSalesperson(data: InsertSalesperson): Promise<Salesperson> {
    const [row] = await db.insert(salespersons).values(data).returning();
    return row;
  }
  async updateSalesperson(id: string, updates: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    const [row] = await db.update(salespersons).set(updates).where(eq(salespersons.id, id)).returning();
    return row;
  }
  async deleteSalesperson(id: string): Promise<boolean> {
    const result = await db.delete(salespersons).where(eq(salespersons.id, id)).returning();
    return result.length > 0;
  }

  // ============ ORDERS ============
  async getAllOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async getOrder(id: string): Promise<Order | undefined> {
    const [row] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    return row;
  }
  async createOrder(data: InsertOrder): Promise<Order> {
    const [row] = await db.insert(orders).values(data).returning();
    return row;
  }
  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const [row] = await db.update(orders).set({ ...updates, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return row;
  }
  async deleteOrder(id: string): Promise<boolean> {
    const result = await db.delete(orders).where(eq(orders.id, id)).returning();
    return result.length > 0;
  }

  // ============ ORDER ITEMS ============
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return db.select().from(orderItems).where(eq(orderItems.orderId, orderId));
  }
  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const [row] = await db.insert(orderItems).values(data).returning();
    return row;
  }

  // ============ DISPATCHES ============
  async getAllDispatches(): Promise<Dispatch[]> {
    return db.select().from(dispatches).orderBy(desc(dispatches.createdAt));
  }
  async getDispatch(id: string): Promise<Dispatch | undefined> {
    const [row] = await db.select().from(dispatches).where(eq(dispatches.id, id)).limit(1);
    return row;
  }
  async createDispatch(data: InsertDispatch): Promise<Dispatch> {
    const [row] = await db.insert(dispatches).values(data).returning();
    return row;
  }
  async updateDispatch(id: string, updates: Partial<InsertDispatch>): Promise<Dispatch | undefined> {
    const [row] = await db.update(dispatches).set(updates).where(eq(dispatches.id, id)).returning();
    return row;
  }

  // ============ PARCELS ============
  async getAllParcels(dispatchId?: string): Promise<Parcel[]> {
    if (dispatchId) {
      return db.select().from(parcels).where(eq(parcels.dispatchId, dispatchId));
    }
    return db.select().from(parcels);
  }
  async getParcel(id: string): Promise<Parcel | undefined> {
    const [row] = await db.select().from(parcels).where(eq(parcels.id, id)).limit(1);
    return row;
  }
  async createParcel(data: InsertParcel): Promise<Parcel> {
    const [row] = await db.insert(parcels).values(data).returning();
    return row;
  }
  async updateParcel(id: string, updates: Partial<InsertParcel>): Promise<Parcel | undefined> {
    const [row] = await db.update(parcels).set(updates).where(eq(parcels.id, id)).returning();
    return row;
  }

  // ============ PAYMENTS ============
  async getAllPayments(): Promise<Payment[]> {
    return db.select().from(payments).orderBy(desc(payments.createdAt));
  }
  async getPayment(id: string): Promise<Payment | undefined> {
    const [row] = await db.select().from(payments).where(eq(payments.id, id)).limit(1);
    return row;
  }
  async createPayment(data: InsertPayment): Promise<Payment> {
    const [row] = await db.insert(payments).values(data).returning();
    return row;
  }
  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const [row] = await db.update(payments).set(updates).where(eq(payments.id, id)).returning();
    return row;
  }
}
