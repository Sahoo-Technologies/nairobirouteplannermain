import { openai } from "./openai-client";
import { db } from "../db";
import { routes, shops, routeOptimizations } from "@shared/schema";
import { eq } from "drizzle-orm";

interface ShopLocation {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
}

interface RouteOptimizationResult {
  optimizedOrder: string[];
  originalDistance: number;
  optimizedDistance: number;
  timeSaved: number;
  fuelSaved: number;
  suggestions: string[];
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function calculateTotalDistance(shopList: ShopLocation[]): number {
  let total = 0;
  for (let i = 0; i < shopList.length - 1; i++) {
    total += calculateDistance(
      shopList[i].latitude, shopList[i].longitude,
      shopList[i + 1].latitude, shopList[i + 1].longitude
    );
  }
  return total;
}

function nearestNeighborOptimization(shopList: ShopLocation[]): ShopLocation[] {
  if (shopList.length <= 2) return shopList;
  
  const optimized: ShopLocation[] = [shopList[0]];
  const remaining = [...shopList.slice(1)];
  
  while (remaining.length > 0) {
    const current = optimized[optimized.length - 1];
    let nearestIdx = 0;
    let nearestDist = Infinity;
    
    for (let i = 0; i < remaining.length; i++) {
      const dist = calculateDistance(
        current.latitude, current.longitude,
        remaining[i].latitude, remaining[i].longitude
      );
      if (dist < nearestDist) {
        nearestDist = dist;
        nearestIdx = i;
      }
    }
    
    optimized.push(remaining[nearestIdx]);
    remaining.splice(nearestIdx, 1);
  }
  
  return optimized;
}

export async function optimizeRoute(routeId: string): Promise<RouteOptimizationResult> {
  const [route] = await db.select().from(routes).where(eq(routes.id, routeId));
  if (!route) throw new Error("Route not found");
  
  const shopIds = route.shopIds || [];
  if (shopIds.length < 2) {
    return {
      optimizedOrder: shopIds,
      originalDistance: 0,
      optimizedDistance: 0,
      timeSaved: 0,
      fuelSaved: 0,
      suggestions: ["Route has too few stops for optimization"]
    };
  }
  
  const allShops = await db.select().from(shops);
  const routeShops = shopIds
    .map(id => allShops.find(s => s.id === id))
    .filter((s): s is ShopLocation => s !== undefined);
  
  const originalDistance = calculateTotalDistance(routeShops);
  const optimizedShops = nearestNeighborOptimization(routeShops);
  const optimizedDistance = calculateTotalDistance(optimizedShops);
  const distanceSaved = originalDistance - optimizedDistance;
  const timeSaved = Math.round(distanceSaved * 3);
  const fuelSaved = Math.round(distanceSaved * 0.1 * 10) / 10;
  
  const response = await openai.chat.completions.create({
    model: "gpt-5.2",
    messages: [
      {
        role: "system",
        content: `You are a route optimization expert for delivery operations in Nairobi, Kenya's Huruma/Mathare area. Analyze delivery routes and provide actionable suggestions for improvement. Be concise and practical.`
      },
      {
        role: "user",
        content: `Analyze this delivery route optimization:
Route: ${route.name}
Original stops order: ${routeShops.map(s => s.name).join(" → ")}
Optimized stops order: ${optimizedShops.map(s => s.name).join(" → ")}
Original distance: ${originalDistance.toFixed(2)} km
Optimized distance: ${optimizedDistance.toFixed(2)} km
Distance saved: ${distanceSaved.toFixed(2)} km
Estimated time saved: ${timeSaved} minutes

Provide 3-5 specific suggestions for further route optimization, considering Nairobi traffic patterns, delivery windows, and fuel efficiency. Format as a JSON array of strings.`
      }
    ],
    response_format: { type: "json_object" },
    max_tokens: 500
  });
  
  let suggestions: string[] = [];
  try {
    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content);
    suggestions = parsed.suggestions || parsed.recommendations || [];
  } catch {
    suggestions = ["Consider traffic patterns during peak hours", "Group nearby shops together", "Schedule deliveries during off-peak times"];
  }
  
  await db.insert(routeOptimizations).values({
    routeId,
    originalDistance,
    optimizedDistance,
    timeSaved,
    fuelSaved,
    suggestions,
    optimizedShopOrder: optimizedShops.map(s => s.id)
  });
  
  return {
    optimizedOrder: optimizedShops.map(s => s.id),
    originalDistance,
    optimizedDistance,
    timeSaved,
    fuelSaved,
    suggestions
  };
}

export async function getRouteOptimizationHistory(routeId?: string, limit: number = 50) {
  if (routeId) {
    return db.select().from(routeOptimizations).where(eq(routeOptimizations.routeId, routeId)).limit(limit);
  }
  return db.select().from(routeOptimizations).limit(limit);
}
