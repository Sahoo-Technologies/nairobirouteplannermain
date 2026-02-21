import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Truck, Package, Clock, CheckCircle2, AlertCircle,
  Play, Flag, Search, Plus
} from "lucide-react";

const statusColors: Record<string, string> = {
  packing: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  ready: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  flagged_off: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  in_transit: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

const parcelStatusColors: Record<string, string> = {
  packed: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
  in_transit: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  delivered: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  payment_pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  payment_confirmed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  released: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
};

export default function DispatchPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<any>(null);

  const { data: dispatches = [], isLoading, isError } = useQuery({
    queryKey: ["/api/dispatches"],
    queryFn: () => fetchList("/api/dispatches"),
  });

  const { data: parcels = [] } = useQuery({
    queryKey: ["/api/parcels", selectedDispatch?.id],
    queryFn: () => selectedDispatch ? fetchList(`/api/parcels?dispatchId=${selectedDispatch.id}`) : Promise.resolve([]),
    enabled: !!selectedDispatch,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["/api/drivers"],
    queryFn: () => fetchList("/api/drivers"),
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => fetchList("/api/orders"),
  });

  const createDispatch = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/dispatches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create dispatch");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      setDialogOpen(false);
      toast({ title: "Dispatch created" });
    },
  });

  const updateDispatchStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/dispatches/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/dispatches"] });
      toast({ title: "Dispatch updated" });
    },
  });

  const updateParcelStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const res = await fetch(`/api/parcels/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Failed to update parcel");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/parcels"] });
      toast({ title: "Parcel status updated" });
    },
  });

  const getDriverName = (id: string) => drivers.find((d: any) => d.id === id)?.name || id;

  const filtered = dispatches.filter((d: any) =>
    d.dispatchNumber?.toLowerCase().includes(search.toLowerCase()) ||
    getDriverName(d.driverId).toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    packing: dispatches.filter((d: any) => d.status === "packing").length,
    inTransit: dispatches.filter((d: any) => d.status === "in_transit" || d.status === "flagged_off").length,
    completed: dispatches.filter((d: any) => d.status === "completed").length,
    totalParcels: dispatches.reduce((sum: number, d: any) => sum + (d.totalParcels || 0), 0),
  };

  const packedOrders = orders.filter((o: any) => o.status === "packed" || o.status === "confirmed");

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load dispatches. Please try again later.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dispatch & Delivery</h1>
          <p className="text-muted-foreground">
            Manage packing (4 PM–8 AM), flag-off, and delivery tracking
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> New Dispatch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Dispatch</DialogTitle>
            </DialogHeader>
            <DispatchForm
              drivers={drivers}
              onSubmit={(data) => createDispatch.mutate(data)}
              isLoading={createDispatch.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Timeline Banner */}
      <Card className="bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-950 dark:to-green-950">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <TimelineStep icon={Package} label="Packing" time="4:00 PM" active />
            <div className="h-0.5 flex-1 bg-border min-w-[20px]" />
            <TimelineStep icon={Clock} label="Ready" time="8:00 AM" />
            <div className="h-0.5 flex-1 bg-border min-w-[20px]" />
            <TimelineStep icon={Flag} label="Flag Off" time="8:00 AM" />
            <div className="h-0.5 flex-1 bg-border min-w-[20px]" />
            <TimelineStep icon={Truck} label="In Transit" time="" />
            <div className="h-0.5 flex-1 bg-border min-w-[20px]" />
            <TimelineStep icon={CheckCircle2} label="Delivered" time="" />
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Packing" value={stats.packing} icon={Package} color="text-amber-600" />
        <StatCard label="In Transit" value={stats.inTransit} icon={Truck} color="text-blue-600" />
        <StatCard label="Completed" value={stats.completed} icon={CheckCircle2} color="text-green-600" />
        <StatCard label="Total Parcels" value={stats.totalParcels} icon={Package} color="text-purple-600" />
      </div>

      {/* Filter */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search dispatches..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Dispatches Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dispatch Records</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Dispatch #</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Parcels</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No dispatches found</TableCell>
                </TableRow>
              ) : (
                filtered.map((d: any) => {
                  const nextStatus = getNextDispatchStatus(d.status);
                  return (
                    <TableRow key={d.id} className="cursor-pointer" onClick={() => setSelectedDispatch(d)}>
                      <TableCell className="font-medium">{d.dispatchNumber}</TableCell>
                      <TableCell>{getDriverName(d.driverId)}</TableCell>
                      <TableCell>{d.date}</TableCell>
                      <TableCell>{d.totalParcels}</TableCell>
                      <TableCell>KES {(d.totalValue || 0).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[d.status] || ""}>{d.status.replace(/_/g, " ")}</Badge>
                      </TableCell>
                      <TableCell>
                        {nextStatus && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateDispatchStatus.mutate({ id: d.id, status: nextStatus });
                            }}
                          >
                            → {nextStatus.replace(/_/g, " ")}
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

      {/* Parcel Details */}
      {selectedDispatch && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Package className="h-4 w-4" />
              Parcels for {selectedDispatch.dispatchNumber}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parcel #</TableHead>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Approved</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parcels.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                      No parcels yet
                    </TableCell>
                  </TableRow>
                ) : (
                  parcels.map((p: any) => {
                    const nextParcelStatus = getNextParcelStatus(p.status);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.parcelNumber}</TableCell>
                        <TableCell>{p.orderId?.slice(0, 8)}</TableCell>
                        <TableCell>{p.shopId?.slice(0, 8)}</TableCell>
                        <TableCell>
                          <Badge className={parcelStatusColors[p.status] || ""}>{p.status.replace(/_/g, " ")}</Badge>
                        </TableCell>
                        <TableCell>
                          {p.customerApproved ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-muted-foreground" />
                          )}
                        </TableCell>
                        <TableCell>
                          {nextParcelStatus && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateParcelStatus.mutate({ id: p.id, status: nextParcelStatus })}
                            >
                              → {nextParcelStatus.replace(/_/g, " ")}
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
      )}
    </div>
  );
}

function getNextDispatchStatus(current: string): string | null {
  const flow = ["packing", "ready", "flagged_off", "in_transit", "completed"];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function getNextParcelStatus(current: string): string | null {
  const flow = ["packed", "in_transit", "delivered", "payment_pending", "payment_confirmed", "released"];
  const idx = flow.indexOf(current);
  if (idx === -1 || idx >= flow.length - 1) return null;
  return flow[idx + 1];
}

function TimelineStep({ icon: Icon, label, time, active }: { icon: React.ElementType; label: string; time: string; active?: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`h-8 w-8 rounded-full flex items-center justify-center ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
        <Icon className="h-4 w-4" />
      </div>
      <span className="text-xs font-medium">{label}</span>
      {time && <span className="text-xs text-muted-foreground">{time}</span>}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center">
          <Icon className={`h-4 w-4 ${color}`} />
        </div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-lg font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function DispatchForm({ drivers, onSubmit, isLoading }: { drivers: any[]; onSubmit: (data: Record<string, unknown>) => void; isLoading: boolean }) {
  const [form, setForm] = useState({
    driverId: "",
    date: new Date().toISOString().split("T")[0],
    totalParcels: "",
    totalValue: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...form,
      dispatchNumber: `DSP-${Date.now().toString(36).toUpperCase()}`,
      totalParcels: parseInt(form.totalParcels) || 0,
      totalValue: parseFloat(form.totalValue) || 0,
      status: "packing",
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <Label>Driver</Label>
        <Select value={form.driverId} onValueChange={(v) => setForm({ ...form, driverId: v })}>
          <SelectTrigger><SelectValue placeholder="Select driver" /></SelectTrigger>
          <SelectContent>
            {drivers.map((d: any) => (
              <SelectItem key={d.id} value={d.id}>{d.name} — {d.vehiclePlate}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Date</Label>
        <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </div>
      <div>
        <Label>Number of Parcels</Label>
        <Input type="number" value={form.totalParcels} onChange={(e) => setForm({ ...form, totalParcels: e.target.value })} />
      </div>
      <div>
        <Label>Total Value (KES)</Label>
        <Input type="number" value={form.totalValue} onChange={(e) => setForm({ ...form, totalValue: e.target.value })} />
      </div>
      <Button type="submit" disabled={isLoading || !form.driverId}>
        {isLoading ? "Creating..." : "Create Dispatch"}
      </Button>
    </form>
  );
}
