/**
 * Health Checks and Monitoring System
 * 
 * Provides comprehensive health monitoring for all system components
 * including database, external services, and application metrics.
 */

import { Request, Response } from "express";
import { db } from "./db";
import { storage } from "./storage";
import { aiUsageMonitor } from "./ai/usage-monitor";
import { settingsManager } from "./secure-settings";
import { testMpesaConnection, getMpesaHealth } from "./payments/robust-mpesa";
import { validateEnvironment } from "./env-validation";
import { log } from "./index";

interface HealthCheck {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  message: string;
  responseTime?: number;
  details?: any;
  timestamp: string;
}

interface SystemHealth {
  status: "healthy" | "degraded" | "unhealthy";
  checks: HealthCheck[];
  uptime: number;
  version: string;
  timestamp: string;
}

class HealthMonitor {
  private static instance: HealthMonitor;
  private startTime: number;
  private version: string;

  private constructor() {
    this.startTime = Date.now();
    this.version = process.env.npm_package_version || "1.0.0";
  }

  static getInstance(): HealthMonitor {
    if (!HealthMonitor.instance) {
      HealthMonitor.instance = new HealthMonitor();
    }
    return HealthMonitor.instance;
  }

  private async measureResponseTime<T>(
    operation: () => Promise<T>,
    name: string
  ): Promise<{ result: T; responseTime: number }> {
    const startTime = Date.now();
    try {
      const result = await operation();
      const responseTime = Date.now() - startTime;
      return { result, responseTime };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      throw error;
    }
  }

  async checkDatabase(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          // Simple database connectivity test using pool query
          const pool = (db as any).$client;
          await pool.query('SELECT 1 as health_check');
          return true;
        },
        "database"
      );

      return {
        name: "database",
        status: "healthy",
        message: "Database connection successful",
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "database",
        status: "unhealthy",
        message: `Database connection failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkStorage(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          // Test storage operations
          await storage.getAllShops();
          return true;
        },
        "storage"
      );

      return {
        name: "storage",
        status: "healthy",
        message: "Storage operations successful",
        responseTime,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "storage",
        status: "unhealthy",
        message: `Storage operations failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkEnvironment(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          const validation = validateEnvironment();
          return validation;
        },
        "environment"
      );

      const validation = result as any;
      const status = validation.valid ? "healthy" : 
                     validation.errors.length > 0 ? "unhealthy" : "degraded";

      return {
        name: "environment",
        status,
        message: validation.valid ? "Environment variables valid" : 
                validation.errors.length > 0 ? "Environment validation failed" : "Environment warnings present",
        responseTime,
        details: {
          valid: validation.valid,
          errors: validation.errors || [],
          warnings: validation.warnings || [],
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "environment",
        status: "unhealthy",
        message: `Environment check failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkAIServices(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          const report = aiUsageMonitor.getUsageReport();
          return report;
        },
        "ai-services"
      );

      const report = result as any;
      const status = report.enabled ? "healthy" : "degraded";

      return {
        name: "ai-services",
        status,
        message: report.enabled ? "AI services operational" : "AI services disabled",
        responseTime,
        details: {
          enabled: report.enabled,
          dailyCalls: report.daily.totalCalls,
          monthlyCost: report.monthly.totalCost,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "ai-services",
        status: "unhealthy",
        message: `AI services check failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkPaymentServices(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          const health = getMpesaHealth();
          return health;
        },
        "payment-services"
      );

      const health = result as any;
      let status: "healthy" | "degraded" | "unhealthy" = "healthy";
      let message = "Payment services operational";

      if (!health.configured) {
        status = "degraded";
        message = "Payment services not configured";
      } else if (!health.healthy) {
        status = "unhealthy";
        message = "Payment services unhealthy";
      }

      return {
        name: "payment-services",
        status,
        message,
        responseTime,
        details: {
          configured: health.configured,
          healthy: health.healthy,
          circuitBreaker: health.circuitBreaker,
          metrics: health.metrics,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "payment-services",
        status: "unhealthy",
        message: `Payment services check failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async checkSettings(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    try {
      const { result, responseTime } = await this.measureResponseTime(
        async () => {
          const validation = settingsManager.validateAllSettings();
          return validation;
        },
        "settings"
      );

      const validation = result as any;
      const status = validation.valid ? "healthy" : "degraded";

      return {
        name: "settings",
        status,
        message: validation.valid ? "Settings valid" : "Settings validation warnings",
        responseTime,
        details: validation,
        timestamp: new Date().toISOString(),
      };
    } catch (error: unknown) {
      const responseTime = Date.now() - startTime;
      const message = error instanceof Error ? error.message : String(error);
      
      return {
        name: "settings",
        status: "unhealthy",
        message: `Settings check failed: ${message}`,
        responseTime,
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const checks = await Promise.all([
      this.checkDatabase(),
      this.checkStorage(),
      this.checkEnvironment(),
      this.checkAIServices(),
      this.checkPaymentServices(),
      this.checkSettings(),
    ]);

    // Determine overall system status
    const unhealthyCount = checks.filter(c => c.status === "unhealthy").length;
    const degradedCount = checks.filter(c => c.status === "degraded").length;

    let overallStatus: "healthy" | "degraded" | "unhealthy";
    if (unhealthyCount > 0) {
      overallStatus = "unhealthy";
    } else if (degradedCount > 0) {
      overallStatus = "degraded";
    } else {
      overallStatus = "healthy";
    }

    return {
      status: overallStatus,
      checks,
      uptime: Date.now() - this.startTime,
      version: this.version,
      timestamp: new Date().toISOString(),
    };
  }

  // Express middleware for health check endpoint
  healthCheckMiddleware() {
    return async (req: Request, res: Response) => {
      try {
        const health = await this.getSystemHealth();
        
        // Set appropriate HTTP status code
        const statusCode = health.status === "healthy" ? 200 :
                          health.status === "degraded" ? 200 : 503;
        
        res.status(statusCode).json(health);
      } catch (error) {
        console.error("Health check failed:", error);
        res.status(503).json({
          status: "unhealthy",
          checks: [],
          uptime: Date.now() - this.startTime,
          version: this.version,
          timestamp: new Date().toISOString(),
          error: "Health check failed",
        });
      }
    };
  }

  // Readiness check (for Kubernetes/Docker)
  readinessCheckMiddleware() {
    return async (req: Request, res: Response) => {
      try {
        // Check critical components only
        const criticalChecks = await Promise.all([
          this.checkDatabase(),
          this.checkStorage(),
        ]);

        const allHealthy = criticalChecks.every(check => check.status === "healthy");
        
        if (allHealthy) {
          res.status(200).json({
            status: "ready",
            checks: criticalChecks,
            timestamp: new Date().toISOString(),
          });
        } else {
          res.status(503).json({
            status: "not ready",
            checks: criticalChecks,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        console.error("Readiness check failed:", error);
        res.status(503).json({
          status: "not ready",
          error: "Readiness check failed",
          timestamp: new Date().toISOString(),
        });
      }
    };
  }

  // Liveness check (for Kubernetes/Docker)
  livenessCheckMiddleware() {
    return (req: Request, res: Response) => {
      // Simple liveness check - if we can respond, we're alive
      res.status(200).json({
        status: "alive",
        uptime: Date.now() - this.startTime,
        timestamp: new Date().toISOString(),
      });
    };
  }
}

export const healthMonitor = HealthMonitor.getInstance();

// Export middleware functions
export const healthCheck = healthMonitor.healthCheckMiddleware();
export const readinessCheck = healthMonitor.readinessCheckMiddleware();
export const livenessCheck = healthMonitor.livenessCheckMiddleware();
