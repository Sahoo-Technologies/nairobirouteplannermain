import { 
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
import { randomUUID } from "crypto";

export interface IStorage {
  // Shops
  getAllShops(): Promise<Shop[]>;
  getShop(id: string): Promise<Shop | undefined>;
  createShop(shop: InsertShop): Promise<Shop>;
  updateShop(id: string, shop: Partial<InsertShop>): Promise<Shop | undefined>;
  deleteShop(id: string): Promise<boolean>;
  
  // Drivers
  getAllDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<InsertDriver>): Promise<Driver | undefined>;
  deleteDriver(id: string): Promise<boolean>;
  
  // Routes
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: string): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: string, route: Partial<InsertRoute>): Promise<Route | undefined>;
  deleteRoute(id: string): Promise<boolean>;
  
  // Targets
  getAllTargets(): Promise<Target[]>;
  getTarget(id: string): Promise<Target | undefined>;
  createTarget(target: InsertTarget): Promise<Target>;
  updateTarget(id: string, target: Partial<InsertTarget>): Promise<Target | undefined>;
  deleteTarget(id: string): Promise<boolean>;

  // Products
  getAllProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;
  deleteProduct(id: string): Promise<boolean>;

  // Inventory
  getAllInventory(): Promise<Inventory[]>;
  getInventoryByProduct(productId: string): Promise<Inventory | undefined>;
  upsertInventory(inv: InsertInventory): Promise<Inventory>;

  // Stock Movements
  getAllStockMovements(): Promise<StockMovement[]>;
  createStockMovement(movement: InsertStockMovement): Promise<StockMovement>;

  // Suppliers
  getAllSuppliers(): Promise<Supplier[]>;
  getSupplier(id: string): Promise<Supplier | undefined>;
  createSupplier(supplier: InsertSupplier): Promise<Supplier>;
  updateSupplier(id: string, supplier: Partial<InsertSupplier>): Promise<Supplier | undefined>;
  deleteSupplier(id: string): Promise<boolean>;

  // Procurements
  getAllProcurements(): Promise<Procurement[]>;
  getProcurement(id: string): Promise<Procurement | undefined>;
  createProcurement(procurement: InsertProcurement): Promise<Procurement>;
  updateProcurement(id: string, procurement: Partial<InsertProcurement>): Promise<Procurement | undefined>;

  // Salespersons
  getAllSalespersons(): Promise<Salesperson[]>;
  getSalesperson(id: string): Promise<Salesperson | undefined>;
  createSalesperson(sp: InsertSalesperson): Promise<Salesperson>;
  updateSalesperson(id: string, sp: Partial<InsertSalesperson>): Promise<Salesperson | undefined>;
  deleteSalesperson(id: string): Promise<boolean>;

  // Orders
  getAllOrders(): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  createOrder(order: InsertOrder): Promise<Order>;
  updateOrder(id: string, order: Partial<InsertOrder>): Promise<Order | undefined>;
  deleteOrder(id: string): Promise<boolean>;

  // Order Items
  getOrderItems(orderId: string): Promise<OrderItem[]>;
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;

  // Dispatches
  getAllDispatches(): Promise<Dispatch[]>;
  getDispatch(id: string): Promise<Dispatch | undefined>;
  createDispatch(dispatch: InsertDispatch): Promise<Dispatch>;
  updateDispatch(id: string, dispatch: Partial<InsertDispatch>): Promise<Dispatch | undefined>;

  // Parcels
  getAllParcels(dispatchId?: string): Promise<Parcel[]>;
  getParcel(id: string): Promise<Parcel | undefined>;
  createParcel(parcel: InsertParcel): Promise<Parcel>;
  updateParcel(id: string, parcel: Partial<InsertParcel>): Promise<Parcel | undefined>;

  // Payments
  getAllPayments(): Promise<Payment[]>;
  getPayment(id: string): Promise<Payment | undefined>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(id: string, payment: Partial<InsertPayment>): Promise<Payment | undefined>;
}

export class MemStorage implements IStorage {
  private shops: Map<string, Shop>;
  private drivers: Map<string, Driver>;
  private routes: Map<string, Route>;
  private targets: Map<string, Target>;
  private products: Map<string, Product>;
  private inventoryMap: Map<string, Inventory>;
  private stockMovementsMap: Map<string, StockMovement>;
  private suppliersMap: Map<string, Supplier>;
  private procurementsMap: Map<string, Procurement>;
  private salespersonsMap: Map<string, Salesperson>;
  private ordersMap: Map<string, Order>;
  private orderItemsMap: Map<string, OrderItem>;
  private dispatchesMap: Map<string, Dispatch>;
  private parcelsMap: Map<string, Parcel>;
  private paymentsMap: Map<string, Payment>;

  constructor() {
    this.shops = new Map();
    this.drivers = new Map();
    this.routes = new Map();
    this.targets = new Map();
    this.products = new Map();
    this.inventoryMap = new Map();
    this.stockMovementsMap = new Map();
    this.suppliersMap = new Map();
    this.procurementsMap = new Map();
    this.salespersonsMap = new Map();
    this.ordersMap = new Map();
    this.orderItemsMap = new Map();
    this.dispatchesMap = new Map();
    this.parcelsMap = new Map();
    this.paymentsMap = new Map();
    
    this.seedData();
  }

  private seedData() {
    const today = new Date().toISOString().split("T")[0];
    
    // Seed some sample shops in Huruma/Mathare area
    const sampleShops: InsertShop[] = [
      { name: "Mama Njeri Kiosk", ownerName: "Grace Njeri", phone: "+254712345678", address: "Huruma Estate Block A", latitude: -1.2585, longitude: 36.8615, category: "kiosk", status: "active" },
      { name: "Mathare General Store", ownerName: "John Kamau", phone: "+254723456789", address: "Mathare 4A", latitude: -1.2565, longitude: 36.8590, category: "retail", status: "active" },
      { name: "Juja Road Wholesale", ownerName: "Peter Ochieng", phone: "+254734567890", address: "Juja Road", latitude: -1.2595, longitude: 36.8650, category: "wholesale", status: "active" },
      { name: "Karibu Mini Mart", ownerName: "Mary Wanjiku", phone: "+254745678901", address: "Huruma Market", latitude: -1.2610, longitude: 36.8600, category: "retail", status: "active" },
      { name: "Baba Junior Shop", ownerName: "James Mwangi", phone: "+254756789012", address: "Mathare North", latitude: -1.2520, longitude: 36.8640, category: "kiosk", status: "pending" },
      { name: "Upendo Store", ownerName: "Elizabeth Akinyi", phone: "+254767890123", address: "Ngei Estate", latitude: -1.2630, longitude: 36.8580, category: "retail", status: "active" },
    ];

    sampleShops.forEach(shop => {
      const id = randomUUID();
      this.shops.set(id, { ...shop, id } as Shop);
    });

    // Seed sample drivers
    const sampleDrivers: InsertDriver[] = [
      { name: "David Omondi", phone: "+254778901234", vehicleType: "motorcycle", vehiclePlate: "KMCA 123A", status: "available", currentLatitude: -1.2590, currentLongitude: 36.8620 },
      { name: "Samuel Kiprop", phone: "+254789012345", vehicleType: "van", vehiclePlate: "KBZ 456B", status: "on_route", currentLatitude: -1.2575, currentLongitude: 36.8605 },
      { name: "Michael Otieno", phone: "+254790123456", vehicleType: "motorcycle", vehiclePlate: "KMCB 789C", status: "available" },
      { name: "Joseph Wafula", phone: "+254701234567", vehicleType: "truck", vehiclePlate: "KCA 012D", status: "off_duty" },
    ];

    const driverIds: string[] = [];
    sampleDrivers.forEach(driver => {
      const id = randomUUID();
      driverIds.push(id);
      this.drivers.set(id, { ...driver, id } as Driver);
    });

    // Seed sample routes
    const shopIds = Array.from(this.shops.keys());
    const sampleRoutes: InsertRoute[] = [
      { name: "Morning Route - Zone A", driverId: driverIds[0], shopIds: shopIds.slice(0, 3), status: "planned", estimatedDistance: 2.5, estimatedTime: 45, date: today },
      { name: "Afternoon Delivery", driverId: driverIds[1], shopIds: shopIds.slice(2, 5), status: "in_progress", estimatedDistance: 3.2, estimatedTime: 55, date: today },
    ];

    sampleRoutes.forEach(route => {
      const id = randomUUID();
      this.routes.set(id, { ...route, id } as Route);
    });

    // Seed sample targets
    const endOfWeek = new Date();
    endOfWeek.setDate(endOfWeek.getDate() + 7);
    const sampleTargets: InsertTarget[] = [
      { driverId: driverIds[0], period: "weekly", targetShops: 30, targetDeliveries: 50, completedShops: 18, completedDeliveries: 32, startDate: today, endDate: endOfWeek.toISOString().split("T")[0] },
      { driverId: driverIds[1], period: "daily", targetShops: 8, targetDeliveries: 15, completedShops: 5, completedDeliveries: 9, startDate: today, endDate: today },
    ];

    sampleTargets.forEach(target => {
      const id = randomUUID();
      this.targets.set(id, { ...target, id } as Target);
    });

    // Seed suppliers
    const supplierIds: string[] = [];
    const sampleSuppliers = [
      { name: "Bidco Africa", contactPerson: "Anne Wambui", phone: "+254711111111", email: "orders@bidco.co.ke", address: "Thika Road", status: "active" as const },
      { name: "EABL Distributors", contactPerson: "Tom Otieno", phone: "+254722222222", email: "supply@eabl.co.ke", address: "Ruaraka", status: "active" as const },
      { name: "Kapa Oil Refineries", contactPerson: "Lucy Njeri", phone: "+254733333333", email: "sales@kapa.co.ke", address: "Limuru Road", status: "active" as const },
    ];
    sampleSuppliers.forEach(s => {
      const id = randomUUID();
      supplierIds.push(id);
      this.suppliersMap.set(id, { ...s, id, createdAt: new Date() } as Supplier);
    });

    // Seed products
    const productIds: string[] = [];
    const sampleProducts = [
      { name: "Kimbo 1kg", sku: "KMB-1KG", category: "cooking_oil", unitPrice: 350, costPrice: 280, unit: "piece", reorderLevel: 20, supplierId: supplierIds[0], status: "active" as const },
      { name: "Tusker Lager 500ml", sku: "TSK-500", category: "beverages", unitPrice: 230, costPrice: 180, unit: "crate", reorderLevel: 50, supplierId: supplierIds[1], status: "active" as const },
      { name: "Cowboy Bread 400g", sku: "CB-400G", category: "bakery", unitPrice: 60, costPrice: 45, unit: "piece", reorderLevel: 100, supplierId: supplierIds[2], status: "active" as const },
      { name: "Elianto 2L", sku: "ELT-2L", category: "cooking_oil", unitPrice: 580, costPrice: 460, unit: "piece", reorderLevel: 15, supplierId: supplierIds[0], status: "active" as const },
      { name: "White Cap Lager 500ml", sku: "WCL-500", category: "beverages", unitPrice: 220, costPrice: 175, unit: "crate", reorderLevel: 40, supplierId: supplierIds[1], status: "active" as const },
    ];
    sampleProducts.forEach(p => {
      const id = randomUUID();
      productIds.push(id);
      this.products.set(id, { ...p, id, createdAt: new Date() } as Product);
    });

    // Seed inventory
    const inventoryQtys = [150, 80, 200, 45, 120];
    productIds.forEach((pid, i) => {
      const id = randomUUID();
      this.inventoryMap.set(id, { id, productId: pid, quantity: inventoryQtys[i], lastUpdated: new Date() } as Inventory);
    });

    // Seed salespersons
    const spIds: string[] = [];
    const sampleSalespersons = [
      { name: "Alice Muthoni", phone: "+254700100100", email: "alice@veew.co.ke", status: "active" as const },
      { name: "Brian Odhiambo", phone: "+254700200200", email: "brian@veew.co.ke", status: "active" as const },
      { name: "Catherine Wanjiru", phone: "+254700300300", email: "catherine@veew.co.ke", status: "active" as const },
    ];
    sampleSalespersons.forEach(sp => {
      const id = randomUUID();
      spIds.push(id);
      this.salespersonsMap.set(id, { ...sp, id, createdAt: new Date() } as Salesperson);
    });

    // Seed orders
    const orderIds: string[] = [];
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];
    const sampleOrders = [
      { orderNumber: "ORD-001", shopId: shopIds[0], salespersonId: spIds[0], status: "confirmed" as const, totalAmount: 3500, cutoffMet: true, deliveryDate: tomorrowStr, notes: "Regular weekly order" },
      { orderNumber: "ORD-002", shopId: shopIds[1], salespersonId: spIds[1], status: "packed" as const, totalAmount: 12000, cutoffMet: true, deliveryDate: tomorrowStr, notes: "Bulk wholesale order" },
      { orderNumber: "ORD-003", shopId: shopIds[2], salespersonId: spIds[0], status: "pending" as const, totalAmount: 5800, cutoffMet: false, deliveryDate: tomorrowStr, notes: "Received after cutoff" },
      { orderNumber: "ORD-004", shopId: shopIds[3], salespersonId: spIds[2], status: "delivered" as const, totalAmount: 2200, cutoffMet: true, deliveryDate: today, notes: "Delivered successfully" },
    ];
    sampleOrders.forEach(o => {
      const id = randomUUID();
      orderIds.push(id);
      this.ordersMap.set(id, { ...o, id, createdAt: new Date(), updatedAt: new Date() } as Order);
    });

    // Seed a dispatch
    const dispatchId = randomUUID();
    this.dispatchesMap.set(dispatchId, {
      id: dispatchId,
      dispatchNumber: "DSP-001",
      driverId: driverIds[0],
      routeId: Array.from(this.routes.keys())[0] || null,
      status: "flagged_off",
      packingStartedAt: new Date(new Date().setHours(16, 0, 0)),
      flagOffAt: new Date(new Date().setHours(8, 0, 0)),
      completedAt: null,
      totalParcels: 2,
      totalValue: 15500,
      date: today,
      createdAt: new Date(),
    } as Dispatch);

    // Seed parcels
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
        deliveredAt: i === 0 ? new Date() : null,
        createdAt: new Date(),
      } as Parcel);
    });

    // Seed a payment
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
      confirmedAt: new Date(),
      createdAt: new Date(),
    } as Payment);

    // Seed procurement
    const procId = randomUUID();
    this.procurementsMap.set(procId, {
      id: procId,
      supplierId: supplierIds[0],
      productId: productIds[0],
      quantity: 100,
      unitCost: 280,
      totalCost: 28000,
      status: "received",
      stockAtOrder: 50,
      orderedBy: "admin",
      receivedAt: new Date(),
      createdAt: new Date(),
    } as Procurement);

    // Seed stock movements
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
      createdAt: new Date(),
    } as StockMovement);
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
      createdAt: new Date(),
    } as StockMovement);
  }

  // Shops
  async getAllShops(): Promise<Shop[]> {
    return Array.from(this.shops.values());
  }

  async getShop(id: string): Promise<Shop | undefined> {
    return this.shops.get(id);
  }

  async createShop(insertShop: InsertShop): Promise<Shop> {
    const id = randomUUID();
    const shop: Shop = { ...insertShop, id } as Shop;
    this.shops.set(id, shop);
    return shop;
  }

  async updateShop(id: string, updates: Partial<InsertShop>): Promise<Shop | undefined> {
    const shop = this.shops.get(id);
    if (!shop) return undefined;
    const updated = { ...shop, ...updates };
    this.shops.set(id, updated);
    return updated;
  }

  async deleteShop(id: string): Promise<boolean> {
    return this.shops.delete(id);
  }

  // Drivers
  async getAllDrivers(): Promise<Driver[]> {
    return Array.from(this.drivers.values());
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    return this.drivers.get(id);
  }

  async createDriver(insertDriver: InsertDriver): Promise<Driver> {
    const id = randomUUID();
    const driver: Driver = { ...insertDriver, id } as Driver;
    this.drivers.set(id, driver);
    return driver;
  }

  async updateDriver(id: string, updates: Partial<InsertDriver>): Promise<Driver | undefined> {
    const driver = this.drivers.get(id);
    if (!driver) return undefined;
    const updated = { ...driver, ...updates };
    this.drivers.set(id, updated);
    return updated;
  }

  async deleteDriver(id: string): Promise<boolean> {
    return this.drivers.delete(id);
  }

  // Routes
  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values());
  }

  async getRoute(id: string): Promise<Route | undefined> {
    return this.routes.get(id);
  }

  async createRoute(insertRoute: InsertRoute): Promise<Route> {
    const id = randomUUID();
    const route: Route = { ...insertRoute, id } as Route;
    this.routes.set(id, route);
    return route;
  }

  async updateRoute(id: string, updates: Partial<InsertRoute>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) return undefined;
    const updated = { ...route, ...updates };
    this.routes.set(id, updated);
    return updated;
  }

  async deleteRoute(id: string): Promise<boolean> {
    return this.routes.delete(id);
  }

  // Targets
  async getAllTargets(): Promise<Target[]> {
    return Array.from(this.targets.values());
  }

  async getTarget(id: string): Promise<Target | undefined> {
    return this.targets.get(id);
  }

  async createTarget(insertTarget: InsertTarget): Promise<Target> {
    const id = randomUUID();
    const target: Target = { ...insertTarget, id } as Target;
    this.targets.set(id, target);
    return target;
  }

  async updateTarget(id: string, updates: Partial<InsertTarget>): Promise<Target | undefined> {
    const target = this.targets.get(id);
    if (!target) return undefined;
    const updated = { ...target, ...updates };
    this.targets.set(id, updated);
    return updated;
  }

  async deleteTarget(id: string): Promise<boolean> {
    return this.targets.delete(id);
  }

  // Products
  async getAllProducts(): Promise<Product[]> {
    return Array.from(this.products.values());
  }
  async getProduct(id: string): Promise<Product | undefined> {
    return this.products.get(id);
  }
  async createProduct(data: InsertProduct): Promise<Product> {
    const id = randomUUID();
    const product = { ...data, id, createdAt: new Date() } as Product;
    this.products.set(id, product);
    return product;
  }
  async updateProduct(id: string, updates: Partial<InsertProduct>): Promise<Product | undefined> {
    const p = this.products.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...updates };
    this.products.set(id, updated);
    return updated;
  }
  async deleteProduct(id: string): Promise<boolean> {
    return this.products.delete(id);
  }

  // Inventory
  async getAllInventory(): Promise<Inventory[]> {
    return Array.from(this.inventoryMap.values());
  }
  async getInventoryByProduct(productId: string): Promise<Inventory | undefined> {
    return Array.from(this.inventoryMap.values()).find(i => i.productId === productId);
  }
  async upsertInventory(data: InsertInventory): Promise<Inventory> {
    const existing = await this.getInventoryByProduct(data.productId);
    if (existing) {
      const updated = { ...existing, quantity: data.quantity, lastUpdated: new Date() } as Inventory;
      this.inventoryMap.set(existing.id, updated);
      return updated;
    }
    const id = randomUUID();
    const inv = { ...data, id, lastUpdated: new Date() } as Inventory;
    this.inventoryMap.set(id, inv);
    return inv;
  }

  // Stock Movements
  async getAllStockMovements(): Promise<StockMovement[]> {
    return Array.from(this.stockMovementsMap.values());
  }
  async createStockMovement(data: InsertStockMovement): Promise<StockMovement> {
    const id = randomUUID();
    const movement = { ...data, id, createdAt: new Date() } as StockMovement;
    this.stockMovementsMap.set(id, movement);
    return movement;
  }

  // Suppliers
  async getAllSuppliers(): Promise<Supplier[]> {
    return Array.from(this.suppliersMap.values());
  }
  async getSupplier(id: string): Promise<Supplier | undefined> {
    return this.suppliersMap.get(id);
  }
  async createSupplier(data: InsertSupplier): Promise<Supplier> {
    const id = randomUUID();
    const supplier = { ...data, id, createdAt: new Date() } as Supplier;
    this.suppliersMap.set(id, supplier);
    return supplier;
  }
  async updateSupplier(id: string, updates: Partial<InsertSupplier>): Promise<Supplier | undefined> {
    const s = this.suppliersMap.get(id);
    if (!s) return undefined;
    const updated = { ...s, ...updates };
    this.suppliersMap.set(id, updated);
    return updated;
  }
  async deleteSupplier(id: string): Promise<boolean> {
    return this.suppliersMap.delete(id);
  }

  // Procurements
  async getAllProcurements(): Promise<Procurement[]> {
    return Array.from(this.procurementsMap.values());
  }
  async getProcurement(id: string): Promise<Procurement | undefined> {
    return this.procurementsMap.get(id);
  }
  async createProcurement(data: InsertProcurement): Promise<Procurement> {
    const id = randomUUID();
    const procurement = { ...data, id, createdAt: new Date(), receivedAt: null } as Procurement;
    this.procurementsMap.set(id, procurement);
    return procurement;
  }
  async updateProcurement(id: string, updates: Partial<InsertProcurement>): Promise<Procurement | undefined> {
    const p = this.procurementsMap.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...updates };
    this.procurementsMap.set(id, updated);
    return updated;
  }

  // Salespersons
  async getAllSalespersons(): Promise<Salesperson[]> {
    return Array.from(this.salespersonsMap.values());
  }
  async getSalesperson(id: string): Promise<Salesperson | undefined> {
    return this.salespersonsMap.get(id);
  }
  async createSalesperson(data: InsertSalesperson): Promise<Salesperson> {
    const id = randomUUID();
    const sp = { ...data, id, createdAt: new Date() } as Salesperson;
    this.salespersonsMap.set(id, sp);
    return sp;
  }
  async updateSalesperson(id: string, updates: Partial<InsertSalesperson>): Promise<Salesperson | undefined> {
    const sp = this.salespersonsMap.get(id);
    if (!sp) return undefined;
    const updated = { ...sp, ...updates };
    this.salespersonsMap.set(id, updated);
    return updated;
  }
  async deleteSalesperson(id: string): Promise<boolean> {
    return this.salespersonsMap.delete(id);
  }

  // Orders
  async getAllOrders(): Promise<Order[]> {
    return Array.from(this.ordersMap.values());
  }
  async getOrder(id: string): Promise<Order | undefined> {
    return this.ordersMap.get(id);
  }
  async createOrder(data: InsertOrder): Promise<Order> {
    const id = randomUUID();
    const order = { ...data, id, createdAt: new Date(), updatedAt: new Date() } as Order;
    this.ordersMap.set(id, order);
    return order;
  }
  async updateOrder(id: string, updates: Partial<InsertOrder>): Promise<Order | undefined> {
    const o = this.ordersMap.get(id);
    if (!o) return undefined;
    const updated = { ...o, ...updates, updatedAt: new Date() };
    this.ordersMap.set(id, updated as Order);
    return updated as Order;
  }
  async deleteOrder(id: string): Promise<boolean> {
    return this.ordersMap.delete(id);
  }

  // Order Items
  async getOrderItems(orderId: string): Promise<OrderItem[]> {
    return Array.from(this.orderItemsMap.values()).filter(i => i.orderId === orderId);
  }
  async createOrderItem(data: InsertOrderItem): Promise<OrderItem> {
    const id = randomUUID();
    const item = { ...data, id } as OrderItem;
    this.orderItemsMap.set(id, item);
    return item;
  }

  // Dispatches
  async getAllDispatches(): Promise<Dispatch[]> {
    return Array.from(this.dispatchesMap.values());
  }
  async getDispatch(id: string): Promise<Dispatch | undefined> {
    return this.dispatchesMap.get(id);
  }
  async createDispatch(data: InsertDispatch): Promise<Dispatch> {
    const id = randomUUID();
    const dispatch = { ...data, id, createdAt: new Date(), packingStartedAt: new Date(), flagOffAt: null, completedAt: null } as Dispatch;
    this.dispatchesMap.set(id, dispatch);
    return dispatch;
  }
  async updateDispatch(id: string, updates: Partial<InsertDispatch>): Promise<Dispatch | undefined> {
    const d = this.dispatchesMap.get(id);
    if (!d) return undefined;
    const updated = { ...d, ...updates };
    this.dispatchesMap.set(id, updated as Dispatch);
    return updated as Dispatch;
  }

  // Parcels
  async getAllParcels(dispatchId?: string): Promise<Parcel[]> {
    const all = Array.from(this.parcelsMap.values());
    if (dispatchId) return all.filter(p => p.dispatchId === dispatchId);
    return all;
  }
  async getParcel(id: string): Promise<Parcel | undefined> {
    return this.parcelsMap.get(id);
  }
  async createParcel(data: InsertParcel): Promise<Parcel> {
    const id = randomUUID();
    const parcel = { ...data, id, createdAt: new Date(), deliveredAt: null } as Parcel;
    this.parcelsMap.set(id, parcel);
    return parcel;
  }
  async updateParcel(id: string, updates: Partial<InsertParcel>): Promise<Parcel | undefined> {
    const p = this.parcelsMap.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...updates };
    this.parcelsMap.set(id, updated as Parcel);
    return updated as Parcel;
  }

  // Payments
  async getAllPayments(): Promise<Payment[]> {
    return Array.from(this.paymentsMap.values());
  }
  async getPayment(id: string): Promise<Payment | undefined> {
    return this.paymentsMap.get(id);
  }
  async createPayment(data: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment = { ...data, id, createdAt: new Date(), confirmedAt: null } as Payment;
    this.paymentsMap.set(id, payment);
    return payment;
  }
  async updatePayment(id: string, updates: Partial<InsertPayment>): Promise<Payment | undefined> {
    const p = this.paymentsMap.get(id);
    if (!p) return undefined;
    const updated = { ...p, ...updates };
    this.paymentsMap.set(id, updated as Payment);
    return updated as Payment;
  }
}

function createStorage(): IStorage {
  if (process.env.DATABASE_URL) {
    // Use real PostgreSQL database in production / when DATABASE_URL is set
    const { DatabaseStorage } = require("./database-storage") as typeof import("./database-storage");
    return new DatabaseStorage();
  }
  // Fallback to in-memory storage for local dev without a database
  return new MemStorage();
}

export const storage: IStorage = createStorage();
