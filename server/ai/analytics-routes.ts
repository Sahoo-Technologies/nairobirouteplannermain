import { Express, Request, Response } from "express";
import { z } from "zod";
import { isAuthenticated } from "../auth";
import { optimizeRoute, getRouteOptimizationHistory } from "./route-optimizer";
import { forecastDemand, forecastAllShops, getDemandForecastHistory } from "./demand-forecaster";
import { analyzeDriverPerformance, analyzeAllDrivers, getDriverInsightsHistory } from "./driver-analytics";
import { openai } from "./openai-client";
import { db } from "../db";
import { shops, drivers, routes, targets, analyticsReports } from "@shared/schema";
import { desc } from "drizzle-orm";

const periodSchema = z.enum(["daily", "weekly", "monthly"]).default("weekly");
const reportTypeSchema = z.enum(["fleet_overview", "route_optimization", "demand_forecast", "driver_performance"]).default("fleet_overview");
const uuidSchema = z.string().uuid();
const QUERY_LIMIT = 50;

export function registerAnalyticsRoutes(app: Express): void {
  
  app.post("/api/analytics/optimize-route/:routeId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const routeIdResult = uuidSchema.safeParse(req.params.routeId);
      if (!routeIdResult.success) {
        return res.status(400).json({ error: "Invalid route ID format" });
      }
      const result = await optimizeRoute(routeIdResult.data);
      res.json(result);
    } catch (error) {
      console.error("Route optimization error:", error);
      res.status(500).json({ error: "Failed to optimize route" });
    }
  });

  app.get("/api/analytics/route-optimizations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { routeId } = req.query;
      const validatedRouteId = routeId ? uuidSchema.safeParse(routeId) : null;
      const history = await getRouteOptimizationHistory(
        validatedRouteId?.success ? validatedRouteId.data : undefined,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch optimization history" });
    }
  });

  app.post("/api/analytics/forecast-demand/:shopId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const shopIdResult = uuidSchema.safeParse(req.params.shopId);
      if (!shopIdResult.success) {
        return res.status(400).json({ error: "Invalid shop ID format" });
      }
      const result = await forecastDemand(shopIdResult.data);
      res.json(result);
    } catch (error) {
      console.error("Demand forecast error:", error);
      res.status(500).json({ error: "Failed to forecast demand" });
    }
  });

  app.post("/api/analytics/forecast-all-shops", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const results = await forecastAllShops();
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to forecast demand for shops" });
    }
  });

  app.get("/api/analytics/demand-forecasts", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { shopId } = req.query;
      const validatedShopId = shopId ? uuidSchema.safeParse(shopId) : null;
      const history = await getDemandForecastHistory(
        validatedShopId?.success ? validatedShopId.data : undefined,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch demand forecasts" });
    }
  });

  app.post("/api/analytics/analyze-driver/:driverId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const driverIdResult = uuidSchema.safeParse(req.params.driverId);
      if (!driverIdResult.success) {
        return res.status(400).json({ error: "Invalid driver ID format" });
      }
      const parseResult = z.object({ period: periodSchema }).safeParse(req.body);
      const period = parseResult.success ? parseResult.data.period : "weekly";
      const result = await analyzeDriverPerformance(driverIdResult.data, period);
      res.json(result);
    } catch (error) {
      console.error("Driver analysis error:", error);
      res.status(500).json({ error: "Failed to analyze driver performance" });
    }
  });

  app.post("/api/analytics/analyze-all-drivers", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = z.object({ period: periodSchema }).safeParse(req.body);
      const period = parseResult.success ? parseResult.data.period : "weekly";
      const results = await analyzeAllDrivers(period);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: "Failed to analyze drivers" });
    }
  });

  app.get("/api/analytics/driver-insights", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { driverId } = req.query;
      const validatedDriverId = driverId ? uuidSchema.safeParse(driverId) : null;
      const history = await getDriverInsightsHistory(
        validatedDriverId?.success ? validatedDriverId.data : undefined,
        QUERY_LIMIT
      );
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver insights" });
    }
  });

  app.get("/api/analytics/dashboard", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const allShops = await db.select().from(shops);
      const allDrivers = await db.select().from(drivers);
      const allRoutes = await db.select().from(routes);
      const allTargets = await db.select().from(targets);

      const activeShops = allShops.filter(s => s.status === "active").length;
      const availableDrivers = allDrivers.filter(d => d.status === "available").length;
      const completedRoutes = allRoutes.filter(r => r.status === "completed").length;
      const inProgressRoutes = allRoutes.filter(r => r.status === "in_progress").length;

      const totalDeliveries = allTargets.reduce((sum, t) => sum + t.completedDeliveries, 0);
      const targetDeliveries = allTargets.reduce((sum, t) => sum + t.targetDeliveries, 0);
      const overallProgress = targetDeliveries > 0 ? Math.round((totalDeliveries / targetDeliveries) * 100) : 0;

      const totalDistance = allRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);

      res.json({
        summary: {
          totalShops: allShops.length,
          activeShops,
          totalDrivers: allDrivers.length,
          availableDrivers,
          totalRoutes: allRoutes.length,
          completedRoutes,
          inProgressRoutes,
          overallProgress,
          totalDistance: Math.round(totalDistance * 10) / 10
        },
        shopsByCategory: {
          retail: allShops.filter(s => s.category === "retail").length,
          wholesale: allShops.filter(s => s.category === "wholesale").length,
          kiosk: allShops.filter(s => s.category === "kiosk").length
        },
        driversByStatus: {
          available: availableDrivers,
          onRoute: allDrivers.filter(d => d.status === "on_route").length,
          offDuty: allDrivers.filter(d => d.status === "off_duty").length
        },
        routesByStatus: {
          planned: allRoutes.filter(r => r.status === "planned").length,
          inProgress: inProgressRoutes,
          completed: completedRoutes
        }
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch dashboard data" });
    }
  });

  app.post("/api/analytics/generate-report", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const parseResult = z.object({ reportType: reportTypeSchema }).safeParse(req.body);
      const reportType = parseResult.success ? parseResult.data.reportType : "fleet_overview";
      
      const allShops = await db.select().from(shops);
      const allDrivers = await db.select().from(drivers);
      const allRoutes = await db.select().from(routes);
      const allTargets = await db.select().from(targets);

      const reportData = {
        shops: allShops.length,
        drivers: allDrivers.length,
        routes: allRoutes.length,
        completedDeliveries: allTargets.reduce((sum, t) => sum + t.completedDeliveries, 0),
        targetDeliveries: allTargets.reduce((sum, t) => sum + t.targetDeliveries, 0),
        totalDistance: allRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0)
      };

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [
          {
            role: "system",
            content: "You are an expert business analyst for a distribution company in Nairobi, Kenya. Generate insightful reports based on operational data."
          },
          {
            role: "user",
            content: `Generate a ${reportType} report based on this data:
${JSON.stringify(reportData, null, 2)}

Provide:
1. A concise title
2. An executive summary (2-3 sentences)
3. 5 key insights
4. 3 actionable recommendations

Return as JSON: { "title": "string", "summary": "string", "insights": ["string"], "recommendations": ["string"] }`
          }
        ],
        response_format: { type: "json_object" },
        max_tokens: 600
      });

      let reportContent = {
        title: `${reportType.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())} Report`,
        summary: "Fleet operations are running as expected with opportunities for optimization.",
        insights: ["Data analysis in progress"],
        recommendations: ["Continue monitoring performance"]
      };

      try {
        const content = response.choices[0]?.message?.content || "{}";
        const parsed = JSON.parse(content);
        reportContent = {
          title: parsed.title || reportContent.title,
          summary: parsed.summary || reportContent.summary,
          insights: parsed.insights || reportContent.insights,
          recommendations: parsed.recommendations || reportContent.recommendations
        };
      } catch {}

      const [report] = await db.insert(analyticsReports).values({
        reportType,
        title: reportContent.title,
        summary: reportContent.summary,
        data: reportData,
        insights: reportContent.insights
      }).returning();

      res.json({
        ...report,
        recommendations: reportContent.recommendations
      });
    } catch (error) {
      console.error("Report generation error:", error);
      res.status(500).json({ error: "Failed to generate report" });
    }
  });

  app.get("/api/analytics/reports", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const reports = await db.select().from(analyticsReports).orderBy(desc(analyticsReports.generatedAt)).limit(QUERY_LIMIT);
      res.json(reports);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch reports" });
    }
  });
}
