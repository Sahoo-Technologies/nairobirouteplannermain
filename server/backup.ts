import { db } from "./db";
import { shops, drivers, routes, targets, backups, routeOptimizations, demandForecasts, driverInsights, analyticsReports, users, sessions, passwordResetTokens } from "@shared/schema";
import { desc } from "drizzle-orm";

interface BackupData {
  version: string;
  createdAt: string;
  type: "manual" | "scheduled";
  data: {
    users: any[];
    sessions: any[];
    passwordResetTokens: any[];
    shops: any[];
    drivers: any[];
    routes: any[];
    targets: any[];
    routeOptimizations: any[];
    demandForecasts: any[];
    driverInsights: any[];
    analyticsReports: any[];
    backups: any[];
  };
  metadata: {
    totalRecords: number;
    tables: { [key: string]: number };
  };
}

export async function createBackup(type: "manual" | "scheduled" = "manual"): Promise<BackupData> {
  const allUsers = await db.select({
    id: users.id,
    email: users.email,
    firstName: users.firstName,
    lastName: users.lastName,
    role: users.role,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt,
  }).from(users);
  const allSessions = await db.select().from(sessions);
  const allPasswordResetTokens = await db.select({
    id: passwordResetTokens.id,
    userId: passwordResetTokens.userId,
    expiresAt: passwordResetTokens.expiresAt,
    used: passwordResetTokens.used,
    createdAt: passwordResetTokens.createdAt,
  }).from(passwordResetTokens);
  const allShops = await db.select().from(shops);
  const allDrivers = await db.select().from(drivers);
  const allRoutes = await db.select().from(routes);
  const allTargets = await db.select().from(targets);
  const allRouteOptimizations = await db.select().from(routeOptimizations);
  const allDemandForecasts = await db.select().from(demandForecasts);
  const allDriverInsights = await db.select().from(driverInsights);
  const allAnalyticsReports = await db.select().from(analyticsReports);
  const allBackups = await db.select().from(backups);

  const tables = {
    users: allUsers.length,
    sessions: allSessions.length,
    passwordResetTokens: allPasswordResetTokens.length,
    shops: allShops.length,
    drivers: allDrivers.length,
    routes: allRoutes.length,
    targets: allTargets.length,
    routeOptimizations: allRouteOptimizations.length,
    demandForecasts: allDemandForecasts.length,
    driverInsights: allDriverInsights.length,
    analyticsReports: allAnalyticsReports.length,
    backups: allBackups.length,
  };

  const totalRecords = Object.values(tables).reduce((sum, count) => sum + count, 0);

  const backup: BackupData = {
    version: "1.0",
    createdAt: new Date().toISOString(),
    type,
    data: {
      users: allUsers,
      sessions: allSessions,
      passwordResetTokens: allPasswordResetTokens,
      shops: allShops,
      drivers: allDrivers,
      routes: allRoutes,
      targets: allTargets,
      routeOptimizations: allRouteOptimizations,
      demandForecasts: allDemandForecasts,
      driverInsights: allDriverInsights,
      analyticsReports: allAnalyticsReports,
      backups: allBackups,
    },
    metadata: {
      totalRecords,
      tables,
    },
  };

  const filename = `veew_backup_${type}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  const jsonString = JSON.stringify(backup, null, 2);
  const size = Buffer.byteLength(jsonString, "utf8");

  await db.insert(backups).values({
    type,
    filename,
    size,
    recordCount: totalRecords,
    status: "completed",
  });

  return backup;
}

export async function getBackupHistory(limit: number = 20) {
  return db.select().from(backups).orderBy(desc(backups.createdAt)).limit(limit);
}

let schedulerInterval: NodeJS.Timeout | null = null;

export function startBackupScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
  }

  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  schedulerInterval = setInterval(async () => {
    try {
      console.log("Running scheduled backup...");
      await createBackup("scheduled");
      console.log("Scheduled backup completed successfully");
    } catch (error) {
      console.error("Scheduled backup failed:", error);
    }
  }, TWENTY_FOUR_HOURS);

  console.log("Backup scheduler started - daily backups enabled");
}

export function stopBackupScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log("Backup scheduler stopped");
  }
}
