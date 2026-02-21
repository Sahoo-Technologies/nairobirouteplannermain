import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, ClipboardList, Clock, Package, CheckCircle2,
  Truck, CreditCard, Search, Filter
} from "lucide-react";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  confirmed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  processing: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  packed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  dispatched: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const statusFlow = ["pending", "confirmed", "processing", "packed", "dispatched", "delivered", "paid"];

export default function OrdersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: async () => {
      const res = await fetch("/api/orders", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch orders");
      return res.json();
    },
  });

  const { data: shops = [] } = useQuery({
    queryKey: ["/api/shops"],
    queryFn: async () => {
      const res = await fetch("/api/shops", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch shops");
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

  const createOrder = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      setDialogOpen(false);
      toast({ title: "Order created successfully" });
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update order");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({ title: "Order status updated" });
    },
  });

  const filtered = orders.filter((o: any) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(search.toLowerCase()) ||
      o.shopId?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const now = new Date();
  const cutoffHour = 16; // 4 PM
  const isCutoffPassed = now.getHours() >= cutoffHour;

  const stats = {
    total: orders.length,
    pending: orders.filter((o: any) => o.status === "pending").length,
    processing: orders.filter((o: any) => ["confirmed", "processing", "packed"].includes(o.status)).length,
    delivered: orders.filter((o: any) => o.status === "delivered" || o.status === "paid").length,
    totalValue: orders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0),
  };

  const getShopName = (shopId: string) => {
    const shop = shops.find((s: any) => s.id === shopId);
    return shop?.name || shopId;
  };

  const getSalespersonName = (spId: string) => {
    const sp = salespersons.find((s: any) => s.id === spId);
    return sp?.name || spId || "—";
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders Management</h1>
          <p className="text-muted-foreground">
            Track orders from salesperson through delivery
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCutoffPassed && (
            <Badge variant="destructive" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Past 4 PM Cutoff
            </Badge>
          )}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                New Order
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Order</DialogTitle>
              </DialogHeader>
              <OrderForm
                shops={shops}
                salespersons={salespersons}
                onSubmit={(data) => createOrder.mutate(data)}
                isLoading={createOrder.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatMini label="Total Orders" value={stats.total} icon={ClipboardList} />
        <StatMini label="Pending" value={stats.pending} icon={Clock} />
        <StatMini label="Processing" value={stats.processing} icon={Package} />
        <StatMini label="Delivered" value={stats.delivered} icon={CheckCircle2} />
        <StatMini label="Total Value" value={`KES ${stats.totalValue.toLocaleString()}`} icon={CreditCard} />
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusFlow.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s}
              </SelectItem>
            ))}
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Orders Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order #</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Salesperson</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Date</TableHead>
                <TableHead>Cutoff</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Loading orders...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No orders found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((order: any) => {
                  const nextStatus = getNextStatus(order.status);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.orderNumber}</TableCell>
                      <TableCell>{getShopName(order.shopId)}</TableCell>
                      <TableCell>{getSalespersonName(order.salespersonId)}</TableCell>
                      <TableCell>KES {(order.totalAmount || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[order.status] || ""}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{order.deliveryDate || "—"}</TableCell>
                      <TableCell>
                        {order.cutoffMet ? (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Met
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-red-600">
                            <Clock className="h-3 w-3 mr-1" /> Missed
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {nextStatus && order.status !== "cancelled" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateStatus.mutate({ id: order.id, status: nextStatus })}
                          >
                            → {nextStatus}
                          </Button>
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
    </div>
  );
}

function getNextStatus(current: string): string | null {
  const flow = ["pending", "confirmed", "processing", "packed", "dispatched", "delivered", "paid"];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function StatMini({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
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

function OrderForm({
  shops,
  salespersons,
  onSubmit,
  isLoading,
}: {
  shops: any[];
  salespersons: any[];
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    shopId: "",
    salespersonId: "",
    totalAmount: "",
    notes: "",
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const cutoffMet = now.getHours() < 16;
    onSubmit({
      ...form,
      totalAmount: parseFloat(form.totalAmount) || 0,
      orderNumber: `ORD-${Date.now().toString(36).toUpperCase()}`,
      cutoffMet,
      status: "pending",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Customer (Shop)</Label>
        <Select value={form.shopId} onValueChange={(v) => setForm({ ...form, shopId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select customer" />
          </SelectTrigger>
          <SelectContent>
            {shops.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name} ({s.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Salesperson</Label>
        <Select value={form.salespersonId} onValueChange={(v) => setForm({ ...form, salespersonId: v })}>
          <SelectTrigger>
            <SelectValue placeholder="Select salesperson" />
          </SelectTrigger>
          <SelectContent>
            {salespersons.map((s: any) => (
              <SelectItem key={s.id} value={s.id}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Total Amount (KES)</Label>
        <Input
          type="number"
          value={form.totalAmount}
          onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
          placeholder="0"
        />
      </div>
      <div>
        <Label>Delivery Date</Label>
        <Input
          type="date"
          value={form.deliveryDate}
          onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
        />
      </div>
      <div>
        <Label>Notes</Label>
        <Textarea
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Order details, special instructions..."
        />
      </div>
      <Button type="submit" disabled={isLoading || !form.shopId}>
        {isLoading ? "Creating..." : "Create Order"}
      </Button>
    </form>
  );
}
