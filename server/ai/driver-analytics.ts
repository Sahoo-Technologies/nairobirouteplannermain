import { openai } from "./openai-client";
import { db } from "../db";
import { drivers, routes, targets, driverInsights } from "@shared/schema";
import { eq } from "drizzle-orm";

interface DriverPerformanceResult {
  driverId: string;
  driverName: string;
  efficiencyScore: number;
  deliverySuccessRate: number;
  avgDeliveryTime: number;
  insights: string[];
  recommendations: string[];
}

export async function analyzeDriverPerformance(driverId: string, period: "daily" | "weekly" | "monthly" = "weekly"): Promise<DriverPerformanceResult> {
  const [driver] = await db.select().from(drivers).where(eq(drivers.id, driverId));
  if (!driver) throw new Error("Driver not found");
  
  const allRoutes = await db.select().from(routes);
  const driverRoutes = allRoutes.filter(r => r.driverId === driverId);
  const completedRoutes = driverRoutes.filter(r => r.status === "completed");
  const inProgressRoutes = driverRoutes.filter(r => r.status === "in_progress");
  
  const allTargets = await db.select().from(targets).where(eq(targets.driverId, driverId));
  const periodTargets = allTargets.filter(t => t.period === period);
  
  const totalDeliveries = periodTargets.reduce((sum, t) => sum + t.completedDeliveries, 0);
  const targetDeliveries = periodTargets.reduce((sum, t) => sum + t.targetDeliveries, 0);
  const deliverySuccessRate = targetDeliveries > 0 ? (totalDeliveries / targetDeliveries) * 100 : 0;
  
  const totalDistance = driverRoutes.reduce((sum, r) => sum + (r.estimatedDistance || 0), 0);
  const totalTime = driverRoutes.reduce((sum, r) => sum + (r.estimatedTime || 0), 0);
  const avgDeliveryTime = driverRoutes.length > 0 ? Math.round(totalTime / driverRoutes.length) : 0;
  
  const efficiencyScore = Math.min(100, Math.round(
    (deliverySuccessRate * 0.4) +
    (completedRoutes.length > 0 ? 30 : 0) +
    (driver.status === "available" ? 20 : 10) +
    (avgDeliveryTime < 60 ? 10 : 5)
  ));
  
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a fleet performance analyst for a distribution company in Nairobi, Kenya. Analyze driver performance data and provide actionable insights and recommendations for improvement.`
      },
      {
        role: "user",
        content: `Analyze this driver's performance:
Driver: ${driver.name}
Vehicle: ${driver.vehicleType} (${driver.vehiclePlate || "No plate"})
Status: ${driver.status}
Period: ${period}

Performance Metrics:
- Total routes assigned: ${driverRoutes.length}
- Completed routes: ${completedRoutes.length}
- In-progress routes: ${inProgressRoutes.length}
- Delivery success rate: ${deliverySuccessRate.toFixed(1)}%
- Average delivery time: ${avgDeliveryTime} minutes
- Total distance covered: ${totalDistance.toFixed(1)} km
- Efficiency score: ${efficiencyScore}/100

Provide:
1. 3 key insights about this driver's performance
2. 3 specific recommendations for improvement

Return as JSON: { "insights": ["insight1", "insight2", "insight3"], "recommendations": ["rec1", "rec2", "rec3"] }`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });
  
  let aiResult = {
    insights: ["Consistent delivery performance", "Good route completion rate", "Room for efficiency improvement"],
    recommendations: ["Optimize route planning", "Consider peak hour avoidance", "Regular vehicle maintenance"]
  };
  
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    aiResult = {
      insights: parsed.insights || aiResult.insights,
      recommendations: parsed.recommendations || aiResult.recommendations
    };
  } catch {}
  
  await db.insert(driverInsights).values({
    driverId,
    period,
    efficiencyScore,
    deliverySuccessRate,
    avgDeliveryTime,
    insights: aiResult.insights,
    recommendations: aiResult.recommendations
  });
  
  return {
    driverId,
    driverName: driver.name,
    efficiencyScore,
    deliverySuccessRate,
    avgDeliveryTime,
    insights: aiResult.insights,
    recommendations: aiResult.recommendations
  };
}

export async function analyzeAllDrivers(period: "daily" | "weekly" | "monthly" = "weekly"): Promise<DriverPerformanceResult[]> {
  const allDrivers = await db.select().from(drivers);
  const results: DriverPerformanceResult[] = [];
  
  for (const driver of allDrivers) {
    try {
      const analysis = await analyzeDriverPerformance(driver.id, period);
      results.push(analysis);
    } catch (err) {
      console.error(`Failed to analyze driver ${driver.id}:`, err);
    }
  }
  
  return results;
}

export async function getDriverInsightsHistory(driverId?: string, limit: number = 50) {
  if (driverId) {
    return db.select().from(driverInsights).where(eq(driverInsights.driverId, driverId)).limit(limit);
  }
  return db.select().from(driverInsights).limit(limit);
}
