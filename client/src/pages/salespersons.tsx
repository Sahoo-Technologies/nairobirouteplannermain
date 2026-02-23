import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList } from "@/lib/queryClient";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, AlertTriangle, MoreVertical, Pencil, Trash2, Phone, Mail } from "lucide-react";

function SalespersonForm({ initialData, onSubmit, isLoading }: { initialData?: any; onSubmit: (data: Record<string, unknown>) => void; isLoading: boolean; }) {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    phone: initialData?.phone || "",
    email: initialData?.email || "",
    status: initialData?.status || "active",
  });
  return (
    <form onSubmit={e => { e.preventDefault(); onSubmit(form); }} className="flex flex-col gap-4">
      <div>
        <Label>Full Name</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Full name" required />
      </div>
      <div>
        <Label>Phone Number</Label>
        <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+254..." required />
      </div>
      <div>
        <Label>Email</Label>
        <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" />
      </div>
      <div>
        <Label>Status</Label>
        <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isLoading || !form.name || !form.phone}>
        {isLoading ? "Saving..." : initialData ? "Update Salesperson" : "Add Salesperson"}
      </Button>
    </form>
  );
}

export default function SalespersonsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = useAuth();
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingSalesperson, setEditingSalesperson] = useState<any>(null);

  const { data: salespersons = [], isLoading, isError } = useQuery({
    queryKey: ["/api/salespersons"],
    queryFn: () => fetchList("/api/salespersons"),
  });
  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: () => fetchList("/api/orders"),
  });

  const createSalesperson = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch("/api/salespersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create salesperson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      setDialogOpen(false);
      setEditingSalesperson(null);
      toast({ title: "Salesperson added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add salesperson", variant: "destructive" });
    },
  });
  const updateSalesperson = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Record<string, unknown> }) => {
      const res = await fetch(`/api/salespersons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update salesperson");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      setDialogOpen(false);
      setEditingSalesperson(null);
      toast({ title: "Salesperson updated" });
    },
    onError: () => {
      toast({ title: "Failed to update salesperson", variant: "destructive" });
    },
  });
  const deleteSalesperson = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/salespersons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/salespersons"] });
      toast({ title: "Salesperson deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete salesperson", variant: "destructive" });
    },
  });

  const filtered = salespersons.filter((sp: any) =>
    sp.name?.toLowerCase().includes(search.toLowerCase()) ||
    sp.phone?.toLowerCase().includes(search.toLowerCase()) ||
    sp.email?.toLowerCase().includes(search.toLowerCase())
  );
  const getSalesTotal = (spId: string) =>
    orders.filter((o: any) => o.salespersonId === spId).reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
  const getOrderCount = (spId: string) =>
    orders.filter((o: any) => o.salespersonId === spId).length;

  if (isError) {
    return (
      <div className="flex flex-col gap-6 p-6">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load salespersons.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Salespersons</h1>
          <p className="text-muted-foreground">Manage your sales team members</p>
        </div>
        {(isAdmin || isManager) && (
          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditingSalesperson(null); }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Salesperson</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingSalesperson ? "Edit Salesperson" : "Add Salesperson"}</DialogTitle>
              </DialogHeader>
              <SalespersonForm
                initialData={editingSalesperson}
                onSubmit={data => {
                  if (editingSalesperson) {
                    updateSalesperson.mutate({ id: editingSalesperson.id, data });
                  } else {
                    createSalesperson.mutate(data);
                  }
                }}
                isLoading={createSalesperson.isPending || updateSalesperson.isPending}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search salespersons..."
          className="pl-9"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Total Sales</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Loading...</TableCell></TableRow>
              ) : filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">No salespersons found</TableCell></TableRow>
              ) : (
                filtered.map((sp: any) => (
                  <TableRow key={sp.id}>
                    <TableCell className="font-medium">{sp.name}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {sp.phone}</span>
                    </TableCell>
                    <TableCell>
                      {sp.email ? <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {sp.email}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-right">{getOrderCount(sp.id)}</TableCell>
                    <TableCell className="text-right font-medium">KES {getSalesTotal(sp.id).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={sp.status === "active" ? "default" : "secondary"}>{sp.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setEditingSalesperson(sp); setDialogOpen(true); }}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          {isAdmin && (
                            <DropdownMenuItem className="text-destructive" onClick={() => deleteSalesperson.mutate(sp.id)}>
                              <Trash2 className="h-4 w-4 mr-2" /> Delete
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
