import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { AdminLayout } from "@/components/admin/admin-layout";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchList } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Users,
  Settings,
  Database,
  Shield,
  ArrowRight,
  Activity,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
} from "lucide-react";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
}

interface HealthResponse {
  status: string;
  checks: HealthCheck[];
}

export default function AdminDashboard() {
  const { isAdmin } = useAuth();

  const { data: usersList = [], isLoading } = useQuery<Record<string, unknown>[]>({
    queryKey: ["/api/admin/users"],
    queryFn: () => fetchList<Record<string, unknown>>("/api/admin/users"),
  });

  const stats = {
    total: usersList.length,
    admins: usersList.filter((u) => u.role === "admin").length,
  };

  const { data: health, isLoading: healthLoading } = useQuery<HealthResponse>({
    queryKey: ["/health"],
    queryFn: async () => {
      const res = await fetch("/health", { credentials: "include" });
      if (!res.ok) throw new Error("Health check failed");
      return res.json();
    },
    retry: false,
  });

  const dbCheck = health?.checks?.find((c) => c.name === "database");
  const dbConnected = dbCheck?.status === "healthy";

  return (
    <AdminLayout>
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Administration Overview"
          description="Manage your system, users, and configuration"
        />
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

        {isAdmin && (
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
        )}

        {isAdmin && (
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
        )}
        </div>

        {/* Database connection status */}
        <Card className={!dbConnected ? "border-amber-500/50 bg-amber-500/5" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="h-5 w-5" />
            Database Connection
          </CardTitle>
          {!healthLoading && (
            <Badge
              variant={dbConnected ? "default" : "destructive"}
              className={dbConnected ? "bg-emerald-600" : ""}
            >
              {dbConnected ? (
                <>
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Connected
                </>
              ) : (
                <>
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  In-memory
                </>
              )}
            </Badge>
          )}
        </CardHeader>
        <CardContent>
          {healthLoading ? (
            <Skeleton className="h-12 w-full" />
          ) : dbConnected ? (
            <p className="text-sm text-muted-foreground">
              PostgreSQL is connected. Data persists across restarts.
            </p>
          ) : (
            <div className="space-y-2 text-sm">
              <p className="text-amber-600 dark:text-amber-500">
                Using in-memory storage. Data will be lost when the server restarts.
              </p>
              <p className="text-muted-foreground">
                Add <code className="rounded bg-muted px-1">DATABASE_URL</code> to{" "}
                <code className="rounded bg-muted px-1">.env</code> or{" "}
                <code className="rounded bg-muted px-1">.env.local</code>, then run{" "}
                <code className="rounded bg-muted px-1">npm run drizzle:push</code>.
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link href="/admin/settings">Configure in Settings →</Link>
              </Button>
            </div>
          )}
        </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-2">
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
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link href="/admin/settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Edit Settings
                </Link>
              </Button>
            )}
            {isAdmin && (
              <Button asChild variant="outline" size="sm">
                <Link href="/backup">
                  <Database className="mr-2 h-4 w-4" />
                  Download Backup
                </Link>
              </Button>
            )}
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
              <span>Role-based access control (Admin, Manager, Driver, Salesperson, Finance, Warehouse)</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
              <span>Sensitive settings masked in UI</span>
            </div>
          </CardContent>
        </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
