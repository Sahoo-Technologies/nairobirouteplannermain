import { openai } from "./openai-client";
import { db } from "../db";
import { shops, demandForecasts, routes } from "@shared/schema";
import { eq } from "drizzle-orm";

interface DemandForecastResult {
  shopId: string;
  shopName: string;
  predictedDemand: "high" | "medium" | "low";
  confidence: number;
  recommendedDeliveryDate: string;
  insights: string[];
}

export async function forecastDemand(shopId: string): Promise<DemandForecastResult> {
  const [shop] = await db.select().from(shops).where(eq(shops.id, shopId));
  if (!shop) throw new Error("Shop not found");
  
  const allRoutes = await db.select().from(routes);
  const shopRoutes = allRoutes.filter(r => r.shopIds?.includes(shopId));
  const deliveryFrequency = shopRoutes.length;
  const recentDeliveries = shopRoutes.filter(r => r.status === "completed").length;
  
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today);
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a demand forecasting expert for distribution operations in Nairobi, Kenya. Analyze shop data and delivery patterns to predict restocking needs. Provide actionable forecasts.`
      },
      {
        role: "user",
        content: `Forecast demand for this shop:
Shop: ${shop.name}
Category: ${shop.category}
Location: ${shop.address || "Huruma/Mathare area"}
Status: ${shop.status}
Total routes assigned: ${deliveryFrequency}
Completed deliveries: ${recentDeliveries}

Based on this data, predict:
1. Demand level (high, medium, low)
2. Confidence score (0-100)
3. Recommended next delivery date (choose from: ${today.toISOString().split('T')[0]}, ${tomorrow.toISOString().split('T')[0]}, ${dayAfter.toISOString().split('T')[0]})
4. 3 insights about this shop's demand patterns

Return as JSON: { "demand": "high|medium|low", "confidence": number, "deliveryDate": "YYYY-MM-DD", "insights": ["insight1", "insight2", "insight3"] }`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 400
  });
  
  let result = {
    demand: "medium" as "high" | "medium" | "low",
    confidence: 75,
    deliveryDate: tomorrow.toISOString().split('T')[0],
    insights: ["Regular delivery schedule recommended", "Monitor stock levels", "Consider category-specific patterns"]
  };
  
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    result = {
      demand: parsed.demand || "medium",
      confidence: parsed.confidence || 75,
      deliveryDate: parsed.deliveryDate || result.deliveryDate,
      insights: parsed.insights || result.insights
    };
  } catch {}
  
  await db.insert(demandForecasts).values({
    shopId,
    forecastDate: today.toISOString().split('T')[0],
    predictedDemand: result.demand,
    confidence: result.confidence,
    recommendedDeliveryDate: result.deliveryDate,
    insights: result.insights
  });
  
  return {
    shopId,
    shopName: shop.name,
    predictedDemand: result.demand,
    confidence: result.confidence,
    recommendedDeliveryDate: result.deliveryDate,
    insights: result.insights
  };
}

export async function forecastAllShops(): Promise<DemandForecastResult[]> {
  const allShops = await db.select().from(shops);
  const results: DemandForecastResult[] = [];
  
  for (const shop of allShops) {
    try {
      const forecast = await forecastDemand(shop.id);
      results.push(forecast);
    } catch (err) {
      console.error(`Failed to forecast for shop ${shop.id}:`, err);
    }
  }
  
  return results;
}

export async function getDemandForecastHistory(shopId?: string, limit: number = 50) {
  if (shopId) {
    return db.select().from(demandForecasts).where(eq(demandForecasts.shopId, shopId)).limit(limit);
  }
  return db.select().from(demandForecasts).limit(limit);
}
