/**
 * Configuration Management
 * 
 * Centralizes all application configuration with environment variable
 * defaults and validation. Moves hardcoded values to configurable
 * environment variables.
 */

interface DatabaseConfig {
  url: string;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
  allowExitOnIdle: boolean;
}

interface ServerConfig {
  port: number;
  host: string;
  nodeEnv: string;
  requestTimeout: number;
  bodyLimit: string;
}

interface SecurityConfig {
  sessionSecret: string;
  sessionMaxAge: number;
  bcryptRounds: number;
  corsOrigins?: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

interface PaymentConfig {
  mpesa: {
    consumerKey?: string;
    consumerSecret?: string;
    shortcode?: string;
    passkey?: string;
    callbackUrl?: string;
    environment: "sandbox" | "production";
    timeout: number;
    maxRetries: number;
  };
}

interface AIConfig {
  openai: {
    apiKey?: string;
    baseUrl?: string;
    model: string;
    timeout: number;
    maxRetries: number;
  };
  usage: {
    dailyCallLimit: number;
    monthlyCallLimit: number;
    monthlyCostLimit: number;
    enabled: boolean;
  };
}

interface EmailConfig {
  smtp: {
    host?: string;
    port: number;
    secure: boolean;
    user?: string;
    pass?: string;
    from?: string;
  };
}

interface MonitoringConfig {
  healthCheck: {
    enabled: boolean;
    interval: number;
  };
  metrics: {
    enabled: boolean;
    retentionDays: number;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    structured: boolean;
  };
}

interface AppConfig {
  database: DatabaseConfig;
  server: ServerConfig;
  security: SecurityConfig;
  payment: PaymentConfig;
  ai: AIConfig;
  email: EmailConfig;
  monitoring: MonitoringConfig;
}

class ConfigManager {
  private static instance: ConfigManager;
  private config: AppConfig;

  private constructor() {
    this.config = this.loadConfig();
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): AppConfig {
    return {
      database: this.loadDatabaseConfig(),
      server: this.loadServerConfig(),
      security: this.loadSecurityConfig(),
      payment: this.loadPaymentConfig(),
      ai: this.loadAIConfig(),
      email: this.loadEmailConfig(),
      monitoring: this.loadMonitoringConfig(),
    };
  }

  private loadDatabaseConfig(): DatabaseConfig {
    return {
      url: this.env("DATABASE_URL", ""), // Allow empty in development
      maxConnections: this.parseIntEnv("DB_MAX_CONNECTIONS", 10),
      idleTimeoutMillis: this.parseIntEnv("DB_IDLE_TIMEOUT_MS", 30000),
      connectionTimeoutMillis: this.parseIntEnv("DB_CONNECTION_TIMEOUT_MS", 10000),
      allowExitOnIdle: this.parseBoolEnv("DB_ALLOW_EXIT_ON_IDLE", true),
    };
  }

  private loadServerConfig(): ServerConfig {
    return {
      port: this.parseIntEnv("PORT", 5000),
      host: this.env("HOST", "0.0.0.0"),
      nodeEnv: this.env("NODE_ENV", "development"),
      requestTimeout: this.parseIntEnv("REQUEST_TIMEOUT_MS", 30000),
      bodyLimit: this.env("BODY_LIMIT", "1mb"),
    };
  }

  private loadSecurityConfig(): SecurityConfig {
    const corsOrigins = this.env("CORS_ORIGIN");
    return {
      sessionSecret: this.requiredEnv("SESSION_SECRET"),
      sessionMaxAge: this.parseIntEnv("SESSION_MAX_AGE_MS", 7 * 24 * 60 * 60 * 1000), // 7 days
      bcryptRounds: this.parseIntEnv("BCRYPT_ROUNDS", 10),
      corsOrigins: corsOrigins ? corsOrigins.split(",").map(o => o.trim()) : undefined,
      rateLimitWindowMs: this.parseIntEnv("RATE_LIMIT_WINDOW_MS", 900000), // 15 minutes
      rateLimitMaxRequests: this.parseIntEnv("RATE_LIMIT_MAX_REQUESTS", 100),
    };
  }

  private loadPaymentConfig(): PaymentConfig {
    return {
      mpesa: {
        consumerKey: this.env("MPESA_CONSUMER_KEY"),
        consumerSecret: this.env("MPESA_CONSUMER_SECRET"),
        shortcode: this.env("MPESA_SHORTCODE"),
        passkey: this.env("MPESA_PASSKEY"),
        callbackUrl: this.env("MPESA_CALLBACK_URL"),
        environment: (this.env("MPESA_ENVIRONMENT", "sandbox") as "sandbox" | "production"),
        timeout: this.parseIntEnv("MPESA_TIMEOUT_MS", 30000),
        maxRetries: this.parseIntEnv("MPESA_MAX_RETRIES", 3),
      },
    };
  }

  private loadAIConfig(): AIConfig {
    return {
      openai: {
        apiKey: this.env("AI_INTEGRATIONS_OPENAI_API_KEY"),
        baseUrl: this.env("AI_INTEGRATIONS_OPENAI_BASE_URL", "https://api.openai.com"),
        model: this.env("AI_MODEL", "gpt-5.2"),
        timeout: this.parseIntEnv("AI_TIMEOUT_MS", 60000),
        maxRetries: this.parseIntEnv("AI_MAX_RETRIES", 2),
      },
      usage: {
        dailyCallLimit: this.parseIntEnv("AI_DAILY_CALL_LIMIT", 100),
        monthlyCallLimit: this.parseIntEnv("AI_MONTHLY_CALL_LIMIT", 2000),
        monthlyCostLimit: this.parseFloatEnv("AI_MONTHLY_COST_LIMIT", 50),
        enabled: this.parseBoolEnv("AI_USAGE_MONITORING", true),
      },
    };
  }

  private loadEmailConfig(): EmailConfig {
    return {
      smtp: {
        host: this.env("SMTP_HOST"),
        port: this.parseIntEnv("SMTP_PORT", 587),
        secure: this.parseBoolEnv("SMTP_SECURE", false),
        user: this.env("SMTP_USER"),
        pass: this.env("SMTP_PASS"),
        from: this.env("SMTP_FROM"),
      },
    };
  }

  private loadMonitoringConfig(): MonitoringConfig {
    return {
      healthCheck: {
        enabled: this.parseBoolEnv("HEALTH_CHECK_ENABLED", true),
        interval: this.parseIntEnv("HEALTH_CHECK_INTERVAL_MS", 30000),
      },
      metrics: {
        enabled: this.parseBoolEnv("METRICS_ENABLED", true),
        retentionDays: this.parseIntEnv("METRICS_RETENTION_DAYS", 90),
      },
      logging: {
        level: (this.env("LOG_LEVEL", "info") as "debug" | "info" | "warn" | "error"),
        structured: this.parseBoolEnv("STRUCTURED_LOGGING", false),
      },
    };
  }

  // Helper methods
  private env(key: string, defaultValue?: string): string {
    return process.env[key] || defaultValue || "";
  }

  private requiredEnv(key: string): string {
    const value = process.env[key];
    if (!value) {
      throw new Error(`Required environment variable ${key} is not set`);
    }
    return value;
  }

  private parseIntEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid integer value for ${key}: ${value}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return parsed;
  }

  private parseFloatEnv(key: string, defaultValue: number): number {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const parsed = parseFloat(value);
    if (isNaN(parsed)) {
      console.warn(`Invalid float value for ${key}: ${value}, using default: ${defaultValue}`);
      return defaultValue;
    }
    return parsed;
  }

  private parseBoolEnv(key: string, defaultValue: boolean): boolean {
    const value = process.env[key];
    if (!value) return defaultValue;
    
    const lower = value.toLowerCase();
    if (["true", "1", "yes", "on"].includes(lower)) return true;
    if (["false", "0", "no", "off"].includes(lower)) return false;
    
    console.warn(`Invalid boolean value for ${key}: ${value}, using default: ${defaultValue}`);
    return defaultValue;
  }

  // Public getters
  get appConfig(): AppConfig {
    return this.config;
  }

  get database(): DatabaseConfig {
    return this.config.database;
  }

  get server(): ServerConfig {
    return this.config.server;
  }

  get security(): SecurityConfig {
    return this.config.security;
  }

  get payment(): PaymentConfig {
    return this.config.payment;
  }

  get ai(): AIConfig {
    return this.config.ai;
  }

  get email(): EmailConfig {
    return this.config.email;
  }

  get monitoring(): MonitoringConfig {
    return this.config.monitoring;
  }

  // Validation
  validate(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate critical configurations
    if (this.config.server.nodeEnv === "production" && !this.config.database.url) {
      errors.push("Database URL is required in production");
    }

    if (!this.config.security.sessionSecret || this.config.security.sessionSecret.length < 32) {
      errors.push("Session secret must be at least 32 characters");
    }

    if (this.config.server.port < 1 || this.config.server.port > 65535) {
      errors.push("Server port must be between 1 and 65535");
    }

    // Validate optional configurations
    if (this.config.payment.mpesa.consumerKey && !this.config.payment.mpesa.consumerSecret) {
      errors.push("M-Pesa consumer secret is required when consumer key is provided");
    }

    if (this.config.ai.openai.apiKey && !this.config.ai.openai.baseUrl) {
      errors.push("OpenAI base URL is required when API key is provided");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // Reload configuration (useful for runtime updates)
  reload(): void {
    this.config = this.loadConfig();
    console.log("Configuration reloaded");
  }

  // Export configuration for debugging
  exportSafe(): Omit<AppConfig, "security" | "payment" | "ai" | "email"> & {
    security: Omit<SecurityConfig, "sessionSecret">;
    payment: Omit<PaymentConfig, "mpesa">;
    ai: Omit<AIConfig, "openai">;
    email: Omit<EmailConfig, "smtp">;
  } {
    return {
      database: this.config.database,
      server: this.config.server,
      security: {
        sessionMaxAge: this.config.security.sessionMaxAge,
        bcryptRounds: this.config.security.bcryptRounds,
        corsOrigins: this.config.security.corsOrigins,
        rateLimitWindowMs: this.config.security.rateLimitWindowMs,
        rateLimitMaxRequests: this.config.security.rateLimitMaxRequests,
      },
      payment: {
        mpesa: {
          environment: this.config.payment.mpesa.environment,
          timeout: this.config.payment.mpesa.timeout,
          maxRetries: this.config.payment.mpesa.maxRetries,
        },
      },
      ai: {
        openai: {
          model: this.config.ai.openai.model,
          timeout: this.config.ai.openai.timeout,
          maxRetries: this.config.ai.openai.maxRetries,
        },
        usage: this.config.ai.usage,
      },
      email: {
        smtp: {
          port: this.config.email.smtp.port,
          secure: this.config.email.smtp.secure,
        },
      },
      monitoring: this.config.monitoring,
    };
  }
}

export const configManager = ConfigManager.getInstance();
