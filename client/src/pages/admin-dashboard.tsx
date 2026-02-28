import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchList } from "@/lib/queryClient";
import {
  Users,
  Settings,
  Database,
  Shield,
  ArrowRight,
  Activity,
  CheckCircle2,
} from "lucide-react";

export default function AdminDashboard() {
  const { data: usersList = [], isLoading } = useQuery({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetchList("/api/admin/users"),
  });

  const stats = {
    total: usersList.length,
    admins: usersList.filter((u: { role?: string }) => u.role === "admin").length,
  };

  return (
    <AdminLayout
      title="Administration Overview"
      description="Manage your system, users, and configuration"
    >
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="transition-colors hover:border-primary/50 hover:bg-muted/30 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">User Management</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <div className="text-2xl font-bold">{stats.total}</div>
              )}
              <p className="text-xs text-muted-foreground">
                {stats.admins} admin{stats.admins !== 1 ? "s" : ""} • Manage accounts
              </p>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                Manage users
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/settings">
          <Card className="transition-colors hover:border-primary/50 hover:bg-muted/30 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Settings</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Environment</div>
              <p className="text-xs text-muted-foreground">
                Database, Auth, AI, Email config
              </p>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                Configure
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>

        <Link href="/backup">
          <Card className="transition-colors hover:border-primary/50 hover:bg-muted/30 cursor-pointer h-full">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Data Backup</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Backup</div>
              <p className="text-xs text-muted-foreground">
                Manual & automated backups
              </p>
              <Button variant="ghost" size="sm" className="mt-2 -ml-2">
                Backup data
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common administration tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/users">
                <Users className="mr-2 h-4 w-4" />
                Create User
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/settings">
                <Settings className="mr-2 h-4 w-4" />
                Edit Settings
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/backup">
                <Database className="mr-2 h-4 w-4" />
                Download Backup
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Security
            </CardTitle>
            <CardDescription>System security status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span>Session-based authentication active</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span>Role-based access control (Admin, Manager, User)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span>Sensitive settings masked in UI</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
