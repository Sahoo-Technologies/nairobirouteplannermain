import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AdminLayout } from "@/components/admin/admin-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Download,
  Database,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  HardDrive,
  Archive,
  Shield,
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Backup {
  id: string;
  type: string;
  filename: string;
  size: number;
  recordCount: number;
  status: string;
  createdAt: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString();
}

export default function BackupPage() {
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  const { data: backupHistory = [], isLoading: historyLoading } = useQuery<Backup[]>({
    queryKey: ["/api/backup/history"],
  });

  const downloadBackup = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/backup", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to create backup");
      }

      const backup = await response.json();
      const blob = new Blob([JSON.stringify(backup, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `veew_backup_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: "Backup Created",
        description: `Successfully backed up ${backup.metadata?.totalRecords ?? 0} records`,
      });
    } catch {
      toast({
        title: "Backup Failed",
        description: "Failed to create backup. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <AdminLayout
      title="Data Backup"
      description="Download and manage your data backups"
    >
      <div className="space-y-6">
        {/* Action Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card
            className="transition-colors hover:border-primary/50"
            data-testid="card-manual-backup"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Manual Backup</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Download className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-xs text-muted-foreground">
                Download a complete backup of all data including shops, drivers, routes,
                targets, and analytics.
              </p>
              <Button
                onClick={downloadBackup}
                disabled={isDownloading}
                className="w-full"
                data-testid="button-download-backup"
              >
                {isDownloading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Download Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card
            className="transition-colors hover:border-primary/50"
            data-testid="card-auto-backup"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Automated Backups</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <Clock className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
              </div>
            </CardHeader>
            <CardContent>
              <Badge variant="default" className="mb-2 bg-emerald-600">
                Active
              </Badge>
              <p className="text-xs text-muted-foreground">
                Daily automated backups are enabled. The system backs up your data every 24
                hours.
              </p>
            </CardContent>
          </Card>

          <Card
            className="transition-colors hover:border-primary/50"
            data-testid="card-backup-stats"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Statistics</CardTitle>
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                <HardDrive className="h-5 w-5 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-backup-count">
                {backupHistory.length}
              </div>
              <p className="text-xs text-muted-foreground">Total backups created</p>
            </CardContent>
          </Card>
        </div>

        {/* History Table */}
        <Card data-testid="card-backup-history">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup History
            </CardTitle>
            <CardDescription>View all previous backups created</CardDescription>
          </CardHeader>
          <CardContent>
            {historyLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : backupHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Archive className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
                <p className="font-medium">No backups yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Click &quot;Download Backup&quot; to create your first backup
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Records</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {backupHistory.map((backup) => (
                    <TableRow key={backup.id} data-testid={`row-backup-${backup.id}`}>
                      <TableCell className="font-medium">
                        {formatDate(backup.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={backup.type === "manual" ? "outline" : "secondary"}
                        >
                          {backup.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {backup.recordCount?.toLocaleString() ?? 0}
                      </TableCell>
                      <TableCell>{formatBytes(backup.size ?? 0)}</TableCell>
                      <TableCell>
                        {backup.status === "completed" ? (
                          <Badge variant="default" className="bg-emerald-600">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Failed
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Backup Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="mb-2 font-medium">What&apos;s included?</h4>
              <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                <li>User accounts (passwords excluded for security)</li>
                <li>All shops and their details</li>
                <li>Driver information and assignments</li>
                <li>Route configurations and history</li>
                <li>Target settings and progress</li>
                <li>AI analytics data</li>
                <li>Generated reports</li>
              </ul>
            </div>
            <div>
              <h4 className="mb-2 font-medium">How to restore?</h4>
              <p className="text-sm text-muted-foreground">
                To restore data from a backup file, contact support with your backup JSON
                file. The technical team will handle the restoration to ensure data
                integrity.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
