/**
 * Centralized Error Handling Middleware
 * 
 * Provides consistent error handling, logging, and response formatting
 * across the entire application.
 */

import { type Request, type Response, type NextFunction } from "express";
import { log } from "./index";

export interface ApiError extends Error {
  statusCode?: number;
  status?: number;
  code?: string;
  details?: any;
  isOperational?: boolean;
}

export class AppError extends Error implements ApiError {
  public statusCode: number;
  public status: number;
  public code: string;
  public details?: any;
  public isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_ERROR",
    details?: any,
    isOperational: boolean = true
  ) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.status = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown
    Error.captureStackTrace(this, AppError);
  }
}

// Predefined error types
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "AUTHENTICATION_ERROR");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Insufficient permissions") {
    super(message, 403, "AUTHORIZATION_ERROR");
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, "CONFLICT_ERROR", details);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = "Rate limit exceeded") {
    super(message, 429, "RATE_LIMIT_ERROR");
  }
}

export class DatabaseError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, "DATABASE_ERROR", details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string = "External service unavailable") {
    super(`${service}: ${message}`, 502, "EXTERNAL_SERVICE_ERROR", { service });
  }
}

// Error logging utility
export function logError(error: ApiError, req: Request): void {
  const isProduction = process.env.NODE_ENV === "production";
  const errorInfo = {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
    userId: (req as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      stack: isProduction ? undefined : error.stack,
      details: error.details,
    },
  };

  // Log structured error for better monitoring
  if (error.statusCode && error.statusCode >= 500) {
    console.error("SERVER_ERROR:", JSON.stringify(errorInfo, null, 2));
  } else {
    console.warn("CLIENT_ERROR:", JSON.stringify(errorInfo, null, 2));
  }
}

// Development error response
function sendDevelopmentError(error: ApiError, res: Response): void {
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      code: error.code || "INTERNAL_ERROR",
      message: error.message,
      details: error.details,
      stack: error.stack,
    },
  });
}

// Production error response
function sendProductionError(error: ApiError, res: Response): void {
  // Operational, trusted error: send message to client
  if (error.isOperational) {
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        code: error.code || "INTERNAL_ERROR",
        message: error.message,
        ...(error.details && { details: error.details }),
      },
    });
  } else {
    // Programming or other unknown error: don't leak error details
    console.error("PROGRAMMING_ERROR:", error);
    res.status(500).json({
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Something went wrong",
      },
    });
  }
}

// Main error handling middleware
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logError(error, req);

  // Handle headers already sent
  if (res.headersSent) {
    return next(error);
  }

  // Ensure statusCode is set
  error.statusCode = error.statusCode || error.status || 500;

  // Send appropriate response based on environment
  if (process.env.NODE_ENV === "production") {
    sendProductionError(error, res);
  } else {
    sendDevelopmentError(error, res);
  }
}

// Async error wrapper for route handlers
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

// 404 handler
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const error = new NotFoundError(`${req.method} ${req.originalUrl}`);
  next(error);
}

// Global unhandled promise rejection handler
export function setupUnhandledRejectionHandler(): void {
  process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
    console.error("UNHANDLED_REJECTION:", {
      reason: reason?.message || reason,
      stack: reason?.stack,
      promise: promise.toString(),
    });
    // Don't exit the process in production, just log it
    if (process.env.NODE_ENV !== "production") {
      process.exit(1);
    }
  });

  process.on("uncaughtException", (error: Error) => {
    console.error("UNCAUGHT_EXCEPTION:", {
      message: error.message,
      stack: error.stack,
    });
    // Graceful shutdown
    console.log("Shutting down due to uncaught exception...");
    process.exit(1);
  });
}
