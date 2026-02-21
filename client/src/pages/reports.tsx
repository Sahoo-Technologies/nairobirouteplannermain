import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Package, ShoppingCart, DollarSign, TrendingUp,
  ArrowUpRight, ArrowDownRight, BarChart3, Users,
  Truck, Store, Layers, AlertTriangle
} from "lucide-react";

export default function ReportsPage() {
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["/api/products"],
    queryFn: async () => {
      const res = await fetch("/api/products", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ["/api/inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: stockMovements = [] } = useQuery({
    queryKey: ["/api/stock-movements"],
    queryFn: async () => {
      const res = await fetch("/api/stock-movements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: procurements = [] } = useQuery({
    queryKey: ["/api/procurements"],
    queryFn: async () => {
      const res = await fetch("/api/procurements", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["/api/suppliers"],
    queryFn: async () => {
      const res = await fetch("/api/suppliers", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: payments = [] } = useQuery({
    queryKey: ["/api/payments"],
    queryFn: async () => {
      const res = await fetch("/api/payments", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: salespersons = [] } = useQuery({
    queryKey: ["/api/salespersons"],
    queryFn: async () => {
      const res = await fetch("/api/salespersons", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["/api/shops"],
    queryFn: async () => {
      const res = await fetch("/api/shops", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: routes = [] } = useQuery({
    queryKey: ["/api/routes"],
    queryFn: async () => {
      const res = await fetch("/api/routes", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: targets = [] } = useQuery({
    queryKey: ["/api/targets"],
    queryFn: async () => {
      const res = await fetch("/api/targets", { credentials: "include" });
      if (!res.ok) return [];
      return res.json();
    },
  });

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Daily Reports</h1>
          <p className="text-muted-foreground">Stores, Procurement, Sales & Finance reports</p>
        </div>
        <Input
          type="date"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className="w-[180px]"
        />
      </div>

      <Tabs defaultValue="stores" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="stores" className="flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> Stores
          </TabsTrigger>
          <TabsTrigger value="procurement" className="flex items-center gap-1">
            <ShoppingCart className="h-3.5 w-3.5" /> Procurement
          </TabsTrigger>
          <TabsTrigger value="sales" className="flex items-center gap-1">
            <BarChart3 className="h-3.5 w-3.5" /> Sales
          </TabsTrigger>
          <TabsTrigger value="finance" className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5" /> Finance
          </TabsTrigger>
        </TabsList>

        {/* ============ STORES REPORT ============ */}
        <TabsContent value="stores" className="flex flex-col gap-4 mt-4">
          <h2 className="text-lg font-semibold">Stores Report</h2>

          {/* Stock Position */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1.1 Stock Position</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead className="text-right">Opening Stock</TableHead>
                    <TableHead className="text-right">Received</TableHead>
                    <TableHead className="text-right">Issued</TableHead>
                    <TableHead className="text-right">Closing Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No products</TableCell>
                    </TableRow>
                  ) : (
                    products.map((p: any) => {
                      const inv = inventory.find((i: any) => i.productId === p.id);
                      const received = stockMovements
                        .filter((m: any) => m.productId === p.id && m.movementType === "received")
                        .reduce((s: number, m: any) => s + m.quantity, 0);
                      const issued = stockMovements
                        .filter((m: any) => m.productId === p.id && m.movementType === "issued")
                        .reduce((s: number, m: any) => s + m.quantity, 0);
                      const closing = (inv?.quantity || 0);
                      const opening = closing - received + issued;
                      const lowStock = closing <= (p.reorderLevel || 10);

                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell><Badge variant="outline">{p.sku}</Badge></TableCell>
                          <TableCell className="text-right">{opening}</TableCell>
                          <TableCell className="text-right text-green-600">+{received}</TableCell>
                          <TableCell className="text-right text-red-600">-{issued}</TableCell>
                          <TableCell className="text-right font-bold">{closing}</TableCell>
                          <TableCell>
                            {lowStock ? (
                              <Badge variant="destructive" className="text-xs flex items-center gap-1 w-fit">
                                <AlertTriangle className="h-3 w-3" /> Low
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-green-600 text-xs">OK</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Stock Movement */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">1.2 Stock Movement</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead>Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockMovements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No movements</TableCell>
                    </TableRow>
                  ) : (
                    stockMovements.map((m: any) => {
                      const prod = products.find((p: any) => p.id === m.productId);
                      return (
                        <TableRow key={m.id}>
                          <TableCell>{prod?.name || m.productId}</TableCell>
                          <TableCell>
                            <Badge className={m.movementType === "received" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                              {m.movementType === "received" ? <ArrowDownRight className="h-3 w-3 mr-1" /> : <ArrowUpRight className="h-3 w-3 mr-1" />}
                              {m.movementType}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">{m.quantity}</TableCell>
                          <TableCell>{m.referenceType ? `${m.referenceType}` : "—"}</TableCell>
                          <TableCell className="text-muted-foreground">{m.notes || "—"}</TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ PROCUREMENT REPORT ============ */}
        <TabsContent value="procurement" className="flex flex-col gap-4 mt-4">
          <h2 className="text-lg font-semibold">Procurement Report</h2>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SKU</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead className="text-right">Qty Procured</TableHead>
                    <TableHead className="text-right">Unit Cost</TableHead>
                    <TableHead className="text-right">Total Cost</TableHead>
                    <TableHead className="text-right">Stock at Order</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {procurements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-6 text-muted-foreground">No procurements</TableCell>
                    </TableRow>
                  ) : (
                    procurements.map((pr: any) => {
                      const prod = products.find((p: any) => p.id === pr.productId);
                      const sup = suppliers.find((s: any) => s.id === pr.supplierId);
                      return (
                        <TableRow key={pr.id}>
                          <TableCell><Badge variant="outline">{prod?.sku || "—"}</Badge></TableCell>
                          <TableCell className="font-medium">{prod?.name || pr.productId}</TableCell>
                          <TableCell>{sup?.name || pr.supplierId}</TableCell>
                          <TableCell className="text-right">{pr.quantity}</TableCell>
                          <TableCell className="text-right">KES {(pr.unitCost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right font-bold">KES {(pr.totalCost || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-right">{pr.stockAtOrder ?? "—"}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={pr.status === "received" ? "text-green-600" : "text-yellow-600"}>
                              {pr.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ SALES REPORT ============ */}
        <TabsContent value="sales" className="flex flex-col gap-4 mt-4">
          <h2 className="text-lg font-semibold">Sales Report</h2>

          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <ReportStat
              label="Daily Sales"
              value={`KES ${orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <ReportStat
              label="Total Orders"
              value={orders.length}
              icon={ShoppingCart}
            />
            <ReportStat
              label="Avg Order Value"
              value={`KES ${orders.length > 0 ? Math.round(orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0) / orders.length).toLocaleString() : 0}`}
              icon={TrendingUp}
            />
            <ReportStat
              label="Salespersons"
              value={salespersons.length}
              icon={Users}
            />
          </div>

          {/* 3.2 Actual vs Target */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3.2 Actual Sales vs Sales Target</CardTitle>
            </CardHeader>
            <CardContent>
              {targets.length === 0 ? (
                <p className="text-muted-foreground text-sm">No targets configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Target Deliveries</TableHead>
                      <TableHead className="text-right">Completed</TableHead>
                      <TableHead className="text-right">Achievement %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {targets.map((t: any) => {
                      const pct = t.targetDeliveries > 0 ? Math.round((t.completedDeliveries / t.targetDeliveries) * 100) : 0;
                      return (
                        <TableRow key={t.id}>
                          <TableCell className="capitalize">{t.period}</TableCell>
                          <TableCell className="text-right">{t.targetDeliveries}</TableCell>
                          <TableCell className="text-right">{t.completedDeliveries}</TableCell>
                          <TableCell className="text-right">
                            <Badge className={pct >= 80 ? "bg-green-100 text-green-800" : pct >= 50 ? "bg-yellow-100 text-yellow-800" : "bg-red-100 text-red-800"}>
                              {pct}%
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 3.4 Sales per Salesperson */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">3.4 Sales per Salesperson</CardTitle>
            </CardHeader>
            <CardContent>
              {salespersons.length === 0 ? (
                <p className="text-muted-foreground text-sm">No salespersons registered</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Salesperson</TableHead>
                      <TableHead className="text-right">Orders</TableHead>
                      <TableHead className="text-right">Total Sales</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {salespersons.map((sp: any) => {
                      const spOrders = orders.filter((o: any) => o.salespersonId === sp.id);
                      const totalSales = spOrders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
                      return (
                        <TableRow key={sp.id}>
                          <TableCell className="font-medium">{sp.name}</TableCell>
                          <TableCell className="text-right">{spOrders.length}</TableCell>
                          <TableCell className="text-right font-bold">KES {totalSales.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ FINANCE REPORT ============ */}
        <TabsContent value="finance" className="flex flex-col gap-4 mt-4">
          <h2 className="text-lg font-semibold">Finance Report</h2>

          {/* 4.1 Gross Profit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <ReportStat
              label="Total Revenue"
              value={`KES ${orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0).toLocaleString()}`}
              icon={DollarSign}
            />
            <ReportStat
              label="Total Procurement Cost"
              value={`KES ${procurements.reduce((s: number, p: any) => s + (p.totalCost || 0), 0).toLocaleString()}`}
              icon={ShoppingCart}
            />
            <ReportStat
              label="Gross Profit"
              value={`KES ${(
                orders.reduce((s: number, o: any) => s + (o.totalAmount || 0), 0) -
                procurements.reduce((s: number, p: any) => s + (p.totalCost || 0), 0)
              ).toLocaleString()}`}
              icon={TrendingUp}
            />
          </div>

          {/* 4.2 Route Profitability */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4.2 Route Profitability</CardTitle>
            </CardHeader>
            <CardContent>
              {routes.length === 0 ? (
                <p className="text-muted-foreground text-sm">No routes configured</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Route</TableHead>
                      <TableHead>Shops</TableHead>
                      <TableHead className="text-right">Est. Distance</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {routes.map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell>{r.shopIds?.length || 0} shops</TableCell>
                        <TableCell className="text-right">{r.estimatedDistance || 0} km</TableCell>
                        <TableCell><Badge variant="outline">{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 4.3 Supplier Account Reconciliation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4.3 Suppliers Account Reconciliation</CardTitle>
            </CardHeader>
            <CardContent>
              {suppliers.length === 0 ? (
                <p className="text-muted-foreground text-sm">No suppliers</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Total Supplied</TableHead>
                      <TableHead className="text-right">Pending</TableHead>
                      <TableHead className="text-right">Received</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers.map((s: any) => {
                      const supProc = procurements.filter((p: any) => p.supplierId === s.id);
                      const total = supProc.reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0);
                      const pending = supProc.filter((p: any) => p.status === "pending").reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0);
                      const received = supProc.filter((p: any) => p.status === "received").reduce((sum: number, p: any) => sum + (p.totalCost || 0), 0);
                      return (
                        <TableRow key={s.id}>
                          <TableCell className="font-medium">{s.name}</TableCell>
                          <TableCell className="text-right">KES {total.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-yellow-600">KES {pending.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-green-600">KES {received.toLocaleString()}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 4.5 Sales Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">4.5 Sales Breakdown</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {/* Per Salesperson */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" /> 4.5.1 Per Salesperson (Agent)
                </h4>
                {salespersons.map((sp: any) => {
                  const total = orders.filter((o: any) => o.salespersonId === sp.id).reduce((s: number, o: any) => s + (o.totalAmount || 0), 0);
                  return (
                    <div key={sp.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                      <span>{sp.name}</span>
                      <span className="font-medium">KES {total.toLocaleString()}</span>
                    </div>
                  );
                })}
                {salespersons.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
              </div>

              {/* Per Route */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Truck className="h-3.5 w-3.5" /> 4.5.2 Per Route
                </h4>
                {routes.map((r: any) => (
                  <div key={r.id} className="flex justify-between text-sm py-1 border-b last:border-0">
                    <span>{r.name}</span>
                    <span className="font-medium">{r.shopIds?.length || 0} shops</span>
                  </div>
                ))}
                {routes.length === 0 && <p className="text-sm text-muted-foreground">No data</p>}
              </div>

              {/* Per Category */}
              <div>
                <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> 4.5.4 Per Category
                </h4>
                {(() => {
                  const cats = shops.reduce((acc: Record<string, number>, s: any) => {
                    const cat = s.category || "other";
                    const shopOrders = orders.filter((o: any) => o.shopId === s.id);
                    acc[cat] = (acc[cat] || 0) + shopOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
                    return acc;
                  }, {} as Record<string, number>);
                  const entries = Object.entries(cats).filter(([_, v]) => (v as number) > 0);
                  if (entries.length === 0) return <p className="text-sm text-muted-foreground">No data</p>;
                  return entries.map(([cat, val]) => (
                    <div key={cat} className="flex justify-between text-sm py-1 border-b last:border-0 capitalize">
                      <span>{cat.replace(/_/g, " ")}</span>
                      <span className="font-medium">KES {(val as number).toLocaleString()}</span>
                    </div>
                  ));
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Payments */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">MPESA Payments</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>MPESA Ref</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">No payments</TableCell>
                    </TableRow>
                  ) : (
                    payments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.mpesaReference || "—"}</TableCell>
                        <TableCell>{p.phone || "—"}</TableCell>
                        <TableCell className="text-right">KES {(p.amount || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={p.status === "confirmed" ? "text-green-600" : "text-yellow-600"}>
                            {p.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ReportStat({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
