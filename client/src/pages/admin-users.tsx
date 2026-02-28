import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchList, apiRequest } from "@/lib/queryClient";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  UserPlus,
  Search,
  Trash2,
  Pencil,
  MoreHorizontal,
  AlertCircle,
  Key,
  Shield,
  User,
  Truck,
  UserCheck,
  Wallet,
  Warehouse,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

const ROLE_CONFIG: Record<string, { label: string; icon: LucideIcon; color: string }> = {
  admin:       { label: "Admin",        icon: Shield,    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
  manager:     { label: "Manager",      icon: Users,     color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200" },
  driver:      { label: "Driver",       icon: Truck,     color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200" },
  salesperson: { label: "Salesperson",   icon: UserCheck, color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
  finance:     { label: "Finance",      icon: Wallet,    color: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200" },
  warehouse:   { label: "Warehouse",    icon: Warehouse, color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200" },
  user:        { label: "User",         icon: User,      color: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
};

function RoleBadge({ role }: { role: string }) {
  const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
  const Icon = cfg.icon;
  return (
    <Badge className={`gap-1 ${cfg.color}`}>
      <Icon className="h-3 w-3" />
      {cfg.label}
    </Badge>
  );
}

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { user: currentUser, isAdmin, canManageUsers } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [createOpen, setCreateOpen] = useState(false);
  const [editUser, setEditUser] = useState<Record<string, unknown> | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; email: string } | null>(null);

  const { data: usersList = [], isLoading, isError } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetchList<Record<string, unknown>>("/api/admin/users"),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to create user");
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setCreateOpen(false);
      toast({ title: "User created successfully" });
      if (data?.email) {
        toast({
          title: `Credentials sent to ${data.email}`,
          description: "The new user has received their login details by email.",
        });
      }
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; [key: string]: unknown }) => {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setEditUser(null);
      toast({ title: "User updated" });
    },
    onError: (err: Error) => {
      toast({ title: err.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest("DELETE", `/api/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      setDeleteTarget(null);
      toast({ title: "User deleted" });
    },
    onError: () => {
      toast({ title: "Failed to delete user", variant: "destructive" });
    },
  });

  const filtered = useMemo(
    () =>
      usersList.filter((u) => {
        const email = String(u.email ?? "").toLowerCase();
        const first = String(u.firstName ?? "").toLowerCase();
        const last = String(u.lastName ?? "").toLowerCase();
        const q = search.toLowerCase();
        const matchSearch = email.includes(q) || first.includes(q) || last.includes(q);
        const matchRole = roleFilter === "all" || u.role === roleFilter;
        return matchSearch && matchRole;
      }),
    [usersList, search, roleFilter]
  );

  const stats = useMemo(() => {
    const byRole: Record<string, number> = {};
    for (const u of usersList) {
      const r = String(u.role || "user");
      byRole[r] = (byRole[r] || 0) + 1;
    }
    return { total: usersList.length, byRole };
  }, [usersList]);

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col gap-6">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              Failed to load users. Make sure you have admin or manager access.
            </AlertDescription>
          </Alert>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="User Management"
          description="Create and manage user accounts with role-based access"
        >
          {canManageUsers && (
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create User
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create New User</DialogTitle>
                </DialogHeader>
                <CreateUserForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  isLoading={createMutation.isPending}
                  isAdmin={isAdmin}
                />
              </DialogContent>
            </Dialog>
          )}
        </PageHeader>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Users" value={stats.total} icon={Users} />
          {Object.entries(stats.byRole)
            .sort(([a], [b]) => {
              const order = ["admin", "manager", "driver", "salesperson", "finance", "warehouse", "user"];
              return order.indexOf(a) - order.indexOf(b);
            })
            .slice(0, 3)
            .map(([role, count]) => {
              const cfg = ROLE_CONFIG[role] || ROLE_CONFIG.user;
              return (
                <StatCard
                  key={role}
                  title={cfg.label + "s"}
                  value={count}
                  icon={cfg.icon}
                />
              );
            })}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by email or name..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.entries(ROLE_CONFIG).map(([val, cfg]) => (
                <SelectItem key={val} value={val}>{cfg.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="hidden md:table-cell">Created</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i} className="transition-colors hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-9 w-9 rounded-full" />
                          <div className="space-y-2">
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-28" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                      <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  ))
                ) : filtered.length === 0 ? (
                  <TableRow className="transition-colors hover:bg-muted/50">
                    <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                      No users found. {search ? "Try a different search." : "Create your first user."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((u: Record<string, unknown>) => {
                    const name =
                      [u.firstName, u.lastName].filter(Boolean).join(" ") || "—";
                    const initials = name !== "—"
                      ? `${String(u.firstName || "")[0] || ""}${String(u.lastName || "")[0] || ""}`.toUpperCase()
                      : String(u.email || "U")[0].toUpperCase();
                    const isSelf = u.id === currentUser?.id;
                    const isTargetAdmin = u.role === "admin";
                    const canEdit = isAdmin || !isTargetAdmin;
                    const canDelete = !isSelf && (isAdmin || !isTargetAdmin);

                    return (
                      <TableRow key={String(u.id)} className="transition-colors hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium">{String(u.email)}</p>
                              <p className="text-sm text-muted-foreground">{name}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RoleBadge role={String(u.role || "user")} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground md:table-cell text-sm">
                          {u.createdAt
                            ? new Date(String(u.createdAt)).toLocaleDateString()
                            : "—"}
                        </TableCell>
                        <TableCell>
                          {canManageUsers && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {canEdit && (
                                  <DropdownMenuItem onClick={() => setEditUser(u)}>
                                    <Pencil className="mr-2 h-4 w-4" />
                                    Edit
                                  </DropdownMenuItem>
                                )}
                                {canDelete && (
                                  <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() =>
                                      setDeleteTarget({
                                        id: String(u.id),
                                        email: String(u.email),
                                      })
                                    }
                                  >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
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

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && setEditUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User — {editUser?.email as string}</DialogTitle>
          </DialogHeader>
          {editUser && (
            <EditUserForm
              user={editUser}
              isSelf={editUser.id === currentUser?.id}
              isAdmin={isAdmin}
              onSubmit={(data) =>
                updateMutation.mutate({ id: String(editUser.id), ...data })
              }
              isLoading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete user?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the account for{" "}
              <strong>{deleteTarget?.email}</strong>. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}

function CreateUserForm({
  onSubmit,
  isLoading,
  isAdmin,
}: {
  onSubmit: (data: Record<string, string>) => void;
  isLoading: boolean;
  isAdmin: boolean;
}) {
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    role: "user",
  });

  const availableRoles = isAdmin
    ? Object.entries(ROLE_CONFIG)
    : Object.entries(ROLE_CONFIG).filter(([key]) => key !== "admin");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="space-y-2">
        <Label>Email *</Label>
        <Input
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="user@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label>Password *</Label>
        <Input
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="Min 8 chars, uppercase, lowercase & digit"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map(([val, cfg]) => (
              <SelectItem key={val} value={val}>
                <span className="flex items-center gap-2">
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {!isAdmin && (
          <p className="text-xs text-muted-foreground">
            As a manager, you can assign: Manager, Driver, Salesperson, Finance, Warehouse, or User roles.
          </p>
        )}
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !form.email || !form.password}
      >
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating...</>
        ) : (
          "Create User"
        )}
      </Button>
    </form>
  );
}

function EditUserForm({
  user,
  isSelf,
  isAdmin,
  onSubmit,
  isLoading,
}: {
  user: Record<string, unknown>;
  isSelf: boolean;
  isAdmin: boolean;
  onSubmit: (data: Record<string, unknown>) => void;
  isLoading: boolean;
}) {
  const [form, setForm] = useState({
    firstName: String(user.firstName || ""),
    lastName: String(user.lastName || ""),
    role: String(user.role || "user"),
    password: "",
  });

  const availableRoles = isAdmin
    ? Object.entries(ROLE_CONFIG)
    : Object.entries(ROLE_CONFIG).filter(([key]) => key !== "admin");

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const data: Record<string, unknown> = {
          firstName: form.firstName,
          lastName: form.lastName,
          role: form.role,
        };
        if (form.password) data.password = form.password;
        onSubmit(data);
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>First Name</Label>
          <Input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Last Name</Label>
          <Input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Role</Label>
        <Select
          value={form.role}
          onValueChange={(v) => setForm({ ...form, role: v })}
          disabled={isSelf}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {availableRoles.map(([val, cfg]) => (
              <SelectItem key={val} value={val}>
                <span className="flex items-center gap-2">
                  <cfg.icon className="h-3.5 w-3.5" />
                  {cfg.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {isSelf && (
          <p className="text-xs text-muted-foreground">You cannot change your own role</p>
        )}
      </div>
      <div className="space-y-2">
        <Label>New Password</Label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="password"
            className="pl-9"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Leave blank to keep current"
          />
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? (
          <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
        ) : (
          "Save Changes"
        )}
      </Button>
    </form>
  );
}
