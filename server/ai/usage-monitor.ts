/**
 * AI API Usage Monitoring and Cost Controls
 * 
 * Provides comprehensive monitoring, rate limiting, and cost management
 * for AI API calls to prevent unexpected charges.
 */

import { ExternalServiceError, ValidationError } from "../error-handling";

// Configuration
const DEFAULT_DAILY_LIMIT = 100; // Maximum API calls per day
const DEFAULT_MONTHLY_LIMIT = 2000; // Maximum API calls per month
const DEFAULT_COST_LIMIT = 50; // Maximum cost in USD per month

// Pricing (approximate, should be updated based on actual API costs)
const PRICING = {
  "gpt-4": {
    input: 0.03, // per 1K tokens
    output: 0.06, // per 1K tokens
  },
  "gpt-3.5-turbo": {
    input: 0.0015, // per 1K tokens
    output: 0.002, // per 1K tokens
  },
  "gpt-5.2": {
    input: 0.05, // per 1K tokens (estimated)
    output: 0.10, // per 1K tokens (estimated)
  },
};

interface UsageRecord {
  timestamp: number;
  endpoint: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  userId?: string;
  requestId: string;
  success: boolean;
  error?: string;
}

interface UsageStats {
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  totalTokens: number;
  totalCost: number;
  dailyCalls: number;
  monthlyCalls: number;
  dailyCost: number;
  monthlyCost: number;
}

interface Limits {
  dailyCalls: number;
  monthlyCalls: number;
  monthlyCost: number;
}

class AIUsageMonitor {
  private static instance: AIUsageMonitor;
  private usageRecords: UsageRecord[] = [];
  private limits: Limits;
  private isEnabled: boolean;

  private constructor() {
    this.limits = {
      dailyCalls: parseInt(process.env.AI_DAILY_CALL_LIMIT || String(DEFAULT_DAILY_LIMIT)),
      monthlyCalls: parseInt(process.env.AI_MONTHLY_CALL_LIMIT || String(DEFAULT_MONTHLY_LIMIT)),
      monthlyCost: parseFloat(process.env.AI_MONTHLY_COST_LIMIT || String(DEFAULT_COST_LIMIT)),
    };
    this.isEnabled = process.env.AI_USAGE_MONITORING !== "false";
  }

  static getInstance(): AIUsageMonitor {
    if (!AIUsageMonitor.instance) {
      AIUsageMonitor.instance = new AIUsageMonitor();
    }
    return AIUsageMonitor.instance;
  }

  private calculateCost(model: string, inputTokens: number, outputTokens: number): number {
    const pricing = PRICING[model as keyof typeof PRICING];
    if (!pricing) {
      // Default to gpt-3.5-turbo pricing if model not found
      const defaultPricing = PRICING["gpt-3.5-turbo"];
      return (inputTokens / 1000) * defaultPricing.input + (outputTokens / 1000) * defaultPricing.output;
    }
    return (inputTokens / 1000) * pricing.input + (outputTokens / 1000) * pricing.output;
  }

  private getUsageStats(timeWindow: "day" | "month"): UsageStats {
    const now = Date.now();
    const windowStart = timeWindow === "day" 
      ? now - (24 * 60 * 60 * 1000) // 24 hours ago
      : now - (30 * 24 * 60 * 60 * 1000); // 30 days ago

    const recentRecords = this.usageRecords.filter(record => record.timestamp >= windowStart);

    const stats: UsageStats = {
      totalCalls: this.usageRecords.length,
      successfulCalls: this.usageRecords.filter(r => r.success).length,
      failedCalls: this.usageRecords.filter(r => !r.success).length,
      totalTokens: this.usageRecords.reduce((sum, r) => sum + r.inputTokens + r.outputTokens, 0),
      totalCost: this.usageRecords.reduce((sum, r) => sum + r.cost, 0),
      dailyCalls: 0,
      monthlyCalls: 0,
      dailyCost: 0,
      monthlyCost: 0,
    };

    if (timeWindow === "day") {
      stats.dailyCalls = recentRecords.length;
      stats.dailyCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
    } else {
      stats.monthlyCalls = recentRecords.length;
      stats.monthlyCost = recentRecords.reduce((sum, r) => sum + r.cost, 0);
    }

    return stats;
  }

  private checkLimits(): void {
    if (!this.isEnabled) return;

    const dailyStats = this.getUsageStats("day");
    const monthlyStats = this.getUsageStats("month");

    // Check daily limit
    if (dailyStats.dailyCalls >= this.limits.dailyCalls) {
      throw new ExternalServiceError("AI Service", `Daily API call limit exceeded (${this.limits.dailyCalls})`);
    }

    // Check monthly call limit
    if (monthlyStats.monthlyCalls >= this.limits.monthlyCalls) {
      throw new ExternalServiceError("AI Service", `Monthly API call limit exceeded (${this.limits.monthlyCalls})`);
    }

    // Check monthly cost limit
    if (monthlyStats.monthlyCost >= this.limits.monthlyCost) {
      throw new ExternalServiceError("AI Service", `Monthly cost limit exceeded ($${this.limits.monthlyCost})`);
    }
  }

  recordUsage(
    endpoint: string,
    model: string,
    inputTokens: number,
    outputTokens: number,
    userId?: string,
    requestId?: string,
    success: boolean = true,
    error?: string
  ): void {
    if (!this.isEnabled) return;

    const cost = this.calculateCost(model, inputTokens, outputTokens);
    const record: UsageRecord = {
      timestamp: Date.now(),
      endpoint,
      model,
      inputTokens,
      outputTokens,
      cost,
      userId,
      requestId: requestId || this.generateRequestId(),
      success,
      error,
    };

    this.usageRecords.push(record);

    // Keep only last 90 days of records
    const cutoffTime = Date.now() - (90 * 24 * 60 * 60 * 1000);
    this.usageRecords = this.usageRecords.filter(r => r.timestamp >= cutoffTime);

    // Log usage
    if (success) {
      console.log(`🤖 AI Usage: ${endpoint} (${model}) - ${inputTokens + outputTokens} tokens, $${cost.toFixed(4)}`);
    } else {
      console.error(`❌ AI Error: ${endpoint} (${model}) - ${error}`);
    }
  }

  checkUsageLimits(): void {
    this.checkLimits();
  }

  getUsageReport(): {
    daily: UsageStats;
    monthly: UsageStats;
    limits: Limits;
    enabled: boolean;
  } {
    return {
      daily: this.getUsageStats("day"),
      monthly: this.getUsageStats("month"),
      limits: this.limits,
      enabled: this.isEnabled,
    };
  }

  getUsageHistory(limit: number = 100): UsageRecord[] {
    return this.usageRecords
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  updateLimits(newLimits: Partial<Limits>): void {
    this.limits = { ...this.limits, ...newLimits };
    console.log("🔄 AI usage limits updated:", this.limits);
  }

  enableMonitoring(): void {
    this.isEnabled = true;
    console.log("✅ AI usage monitoring enabled");
  }

  disableMonitoring(): void {
    this.isEnabled = false;
    console.log("⚠️  AI usage monitoring disabled");
  }

  private generateRequestId(): string {
    return `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Cost estimation for a request before making it
  estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number = 0): number {
    return this.calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
  }

  // Check if a request would exceed limits
  canMakeRequest(
    model: string,
    estimatedInputTokens: number,
    estimatedOutputTokens: number = 0
  ): { allowed: boolean; reason?: string; estimatedCost: number } {
    if (!this.isEnabled) {
      return { allowed: true, estimatedCost: 0 };
    }

    const estimatedCost = this.estimateCost(model, estimatedInputTokens, estimatedOutputTokens);
    const dailyStats = this.getUsageStats("day");
    const monthlyStats = this.getUsageStats("month");

    // Simulate the request
    const simulatedDailyCalls = dailyStats.dailyCalls + 1;
    const simulatedMonthlyCalls = monthlyStats.monthlyCalls + 1;
    const simulatedMonthlyCost = monthlyStats.monthlyCost + estimatedCost;

    if (simulatedDailyCalls >= this.limits.dailyCalls) {
      return {
        allowed: false,
        reason: `Request would exceed daily call limit (${this.limits.dailyCalls})`,
        estimatedCost,
      };
    }

    if (simulatedMonthlyCalls >= this.limits.monthlyCalls) {
      return {
        allowed: false,
        reason: `Request would exceed monthly call limit (${this.limits.monthlyCalls})`,
        estimatedCost,
      };
    }

    if (simulatedMonthlyCost >= this.limits.monthlyCost) {
      return {
        allowed: false,
        reason: `Request would exceed monthly cost limit ($${this.limits.monthlyCost})`,
        estimatedCost,
      };
    }

    return { allowed: true, estimatedCost };
  }
}

// Export singleton instance
export const aiUsageMonitor = AIUsageMonitor.getInstance();

// Decorator for automatic usage tracking
export function trackAIUsage(
  endpoint: string,
  model: string,
  estimatedInputTokens?: number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const requestId = aiUsageMonitor["generateRequestId"]();
      const userId = (this as any).userId || args.find(arg => arg?.userId);

      try {
        // Check limits before making the request
        aiUsageMonitor.checkUsageLimits();

        // Estimate cost if provided
        if (estimatedInputTokens) {
          const canProceed = aiUsageMonitor.canMakeRequest(model, estimatedInputTokens);
          if (!canProceed.allowed) {
            throw new ExternalServiceError("AI Service", canProceed.reason || "Usage limit exceeded");
          }
        }

        // Call the original method
        const result = await method.apply(this, args);

        // Extract token usage from response if available
        const inputTokens = result?.usage?.prompt_tokens || estimatedInputTokens || 0;
        const outputTokens = result?.usage?.completion_tokens || 0;

        // Record successful usage
        aiUsageMonitor.recordUsage(endpoint, model, inputTokens, outputTokens, userId, requestId, true);

        return result;
      } catch (error: unknown) {
        // Record failed usage
        const errorMessage = error instanceof Error ? error.message : String(error);
        aiUsageMonitor.recordUsage(endpoint, model, 0, 0, userId, requestId, false, errorMessage);
        throw error;
      }
    };

    return descriptor;
  };
}

// Middleware for Express routes
export function aiUsageMiddleware(endpoint: string, model: string) {
  return (req: any, res: any, next: any) => {
    const requestId = aiUsageMonitor["generateRequestId"]();
    const userId = req.user?.id;

    // Store request info for later tracking
    req.aiUsage = {
      endpoint,
      model,
      requestId,
      userId,
      startTime: Date.now(),
    };

    // Override res.json to track response
    const originalJson = res.json;
    res.json = function (data: any) {
      try {
        const inputTokens = data?.usage?.prompt_tokens || 0;
        const outputTokens = data?.usage?.completion_tokens || 0;
        
        aiUsageMonitor.recordUsage(
          endpoint,
          model,
          inputTokens,
          outputTokens,
          userId,
          requestId,
          true
        );
      } catch (error) {
        console.error("Failed to track AI usage:", error);
      }
      
      return originalJson.call(this, data);
    };

    next();
  };
}
