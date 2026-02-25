/**
 * Robust M-Pesa Integration with Error Handling and Retries
 * 
 * Features:
 * - Exponential backoff retry strategy
 * - Circuit breaker pattern for external service failures
 * - Comprehensive error logging and monitoring
 * - Request timeout handling
 * - Rate limiting
 */

import { initiateSTKPush as baseInitiateSTKPush, getAccessToken as baseGetAccessToken, StkPushRequest, StkPushResponse, isMpesaConfigured } from "./mpesa";
import { ExternalServiceError, ValidationError } from "../error-handling";

// Configuration
const DEFAULT_TIMEOUT = 30000; // 30 seconds
const MAX_RETRIES = 3;
const BASE_DELAY = 1000; // 1 second
const CIRCUIT_BREAKER_THRESHOLD = 5; // Failures before opening circuit
const CIRCUIT_BREAKER_TIMEOUT = 60000; // 1 minute to reset

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: "CLOSED" | "OPEN" | "HALF_OPEN";
}

const circuitBreaker: CircuitBreakerState = {
  failures: 0,
  lastFailureTime: 0,
  state: "CLOSED",
};

// Request metrics
interface RequestMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequestTime: number;
}

const metrics: RequestMetrics = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  averageResponseTime: 0,
  lastRequestTime: 0,
};

// Retry configuration
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultRetryConfig: RetryConfig = {
  maxRetries: MAX_RETRIES,
  baseDelay: BASE_DELAY,
  maxDelay: 30000, // 30 seconds max delay
  backoffMultiplier: 2,
};

// Utility functions
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.baseDelay * Math.pow(config.backoffMultiplier, attempt - 1);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter to prevent thundering herd
  return Math.min(delay + jitter, config.maxDelay);
}

function shouldRetry(error: any, attempt: number, config: RetryConfig): boolean {
  if (attempt >= config.maxRetries) return false;
  
  // Don't retry on client errors (4xx)
  if (error.status && error.status >= 400 && error.status < 500) return false;
  
  // Retry on server errors (5xx) and network errors
  return true;
}

function updateCircuitBreaker(success: boolean): void {
  if (success) {
    circuitBreaker.failures = 0;
    circuitBreaker.state = "CLOSED";
  } else {
    circuitBreaker.failures++;
    circuitBreaker.lastFailureTime = Date.now();
    
    if (circuitBreaker.failures >= CIRCUIT_BREAKER_THRESHOLD) {
      circuitBreaker.state = "OPEN";
    }
  }
}

function isCircuitBreakerOpen(): boolean {
  if (circuitBreaker.state === "CLOSED") return false;
  
  if (circuitBreaker.state === "OPEN") {
    const timeSinceLastFailure = Date.now() - circuitBreaker.lastFailureTime;
    if (timeSinceLastFailure >= CIRCUIT_BREAKER_TIMEOUT) {
      circuitBreaker.state = "HALF_OPEN";
      return false;
    }
    return true;
  }
  
  return false; // HALF_OPEN
}

function updateMetrics(success: boolean, responseTime: number): void {
  metrics.totalRequests++;
  metrics.lastRequestTime = Date.now();
  
  if (success) {
    metrics.successfulRequests++;
  } else {
    metrics.failedRequests++;
  }
  
  // Update average response time
  const totalResponseTime = metrics.averageResponseTime * (metrics.totalRequests - 1) + responseTime;
  metrics.averageResponseTime = totalResponseTime / metrics.totalRequests;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeout: number = DEFAULT_TIMEOUT): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new ExternalServiceError("M-Pesa", "Request timeout");
    }
    throw error;
  }
}

async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  context: string = "operation"
): Promise<T> {
  const finalConfig = { ...defaultRetryConfig, ...config };
  let lastError: any;

  for (let attempt = 1; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();
      if (attempt > 1) {
        console.log(`✅ ${context} succeeded on attempt ${attempt}`);
      }
      return result;
    } catch (error: unknown) {
      lastError = error;
      
      if (!shouldRetry(error, attempt, finalConfig)) {
        console.error(`❌ ${context} failed on attempt ${attempt}, not retryable:`, error instanceof Error ? error.message : String(error));
        throw error;
      }
      
      if (attempt < finalConfig.maxRetries) {
        const delay = calculateDelay(attempt, finalConfig);
        console.warn(`⚠️  ${context} failed on attempt ${attempt}, retrying in ${delay}ms:`, error instanceof Error ? error.message : String(error));
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`❌ ${context} failed after ${finalConfig.maxRetries} attempts`);
  throw lastError;
}

// Enhanced API functions
export async function getAccessToken(): Promise<string> {
  if (!isMpesaConfigured()) {
    throw new ValidationError("M-Pesa credentials not configured");
  }

  if (isCircuitBreakerOpen()) {
    throw new ExternalServiceError("M-Pesa", "Circuit breaker is open - service temporarily unavailable");
  }

  const startTime = Date.now();
  
  try {
    const token = await retryWithBackoff(
      () => baseGetAccessToken(),
      { maxRetries: 2 }, // Fewer retries for auth
      "M-Pesa OAuth"
    );
    
    const responseTime = Date.now() - startTime;
    updateMetrics(true, responseTime);
    updateCircuitBreaker(true);
    
    return token;
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    updateMetrics(false, responseTime);
    updateCircuitBreaker(false);
    
    if (error instanceof ExternalServiceError) {
      throw error;
    }
    
    throw new ExternalServiceError("M-Pesa OAuth", `Failed to get access token: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function initiateSTKPush(request: StkPushRequest): Promise<StkPushResponse> {
  if (!isMpesaConfigured()) {
    throw new ValidationError("M-Pesa credentials not configured");
  }

  // Validate request
  if (!request.phone || !request.amount || !request.accountReference) {
    throw new ValidationError("Missing required fields: phone, amount, accountReference");
  }

  if (request.amount <= 0) {
    throw new ValidationError("Amount must be greater than 0");
  }

  if (isCircuitBreakerOpen()) {
    throw new ExternalServiceError("M-Pesa", "Circuit breaker is open - service temporarily unavailable");
  }

  const startTime = Date.now();
  
  try {
    const response = await retryWithBackoff(
      () => baseInitiateSTKPush(request),
      defaultRetryConfig,
      "M-Pesa STK Push"
    );
    
    const responseTime = Date.now() - startTime;
    updateMetrics(true, responseTime);
    updateCircuitBreaker(true);
    
    // Log successful request (without sensitive data)
    console.log(`✅ M-Pesa STK Push initiated for account: ${request.accountReference.slice(0, 4)}****`);
    
    return response;
  } catch (error: unknown) {
    const responseTime = Date.now() - startTime;
    updateMetrics(false, responseTime);
    updateCircuitBreaker(false);
    
    // Log failed request (without sensitive data)
    console.error(`❌ M-Pesa STK Push failed for account: ${request.accountReference.slice(0, 4)}****:`, error instanceof Error ? error.message : String(error));
    
    if (error instanceof ExternalServiceError || error instanceof ValidationError) {
      throw error;
    }
    
    throw new ExternalServiceError("M-Pesa STK Push", `Failed to initiate payment: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// Health check and monitoring
export function getMpesaHealth(): {
  healthy: boolean;
  circuitBreaker: CircuitBreakerState;
  metrics: RequestMetrics;
  configured: boolean;
} {
  return {
    healthy: circuitBreaker.state === "CLOSED" && isMpesaConfigured(),
    circuitBreaker: { ...circuitBreaker },
    metrics: { ...metrics },
    configured: isMpesaConfigured(),
  };
}

export function resetMpesaCircuitBreaker(): void {
  circuitBreaker.failures = 0;
  circuitBreaker.state = "CLOSED";
  circuitBreaker.lastFailureTime = 0;
  console.log("🔄 M-Pesa circuit breaker reset manually");
}

// Rate limiting
const requestTimestamps: number[] = [];
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100; // Max 100 requests per minute

function checkRateLimit(): void {
  const now = Date.now();
  const recentRequests = requestTimestamps.filter(timestamp => now - timestamp < RATE_LIMIT_WINDOW);
  
  if (recentRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    throw new ExternalServiceError("M-Pesa", "Rate limit exceeded - too many requests");
  }
  
  // Clean old timestamps and add new one
  requestTimestamps.length = 0;
  requestTimestamps.push(...recentRequests, now);
}

// Export enhanced functions with rate limiting
export async function initiateSTKPushWithRateLimit(request: StkPushRequest): Promise<StkPushResponse> {
  checkRateLimit();
  return initiateSTKPush(request);
}

// Test function for development
export async function testMpesaConnection(): Promise<{ success: boolean; message: string }> {
  try {
    await getAccessToken();
    return { success: true, message: "M-Pesa connection successful" };
  } catch (error: unknown) {
    return { success: false, message: `M-Pesa connection failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}
