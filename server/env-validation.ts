/**
 * Environment Variable Validation
 * 
 * Validates all required environment variables at startup
 * and provides clear error messages for missing configuration.
 */

interface EnvVarConfig {
  name: string;
  required: boolean;
  description: string;
  productionOnly?: boolean;
  validator?: (value: string) => boolean;
}

const ENV_VARS: EnvVarConfig[] = [
  // Core Application
  {
    name: "NODE_ENV",
    required: false,
    description: "Application environment (development, production)",
    validator: (value) => ["development", "production", "test"].includes(value),
  },
  {
    name: "PORT",
    required: false,
    description: "Server port (default: 5000)",
    validator: (value) => /^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) < 65536,
  },

  // Database
  {
    name: "DATABASE_URL",
    required: true,
    productionOnly: true,
    description: "PostgreSQL connection string",
    validator: (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
  },

  // Authentication & Security
  {
    name: "SESSION_SECRET",
    required: true,
    description: "Secret key for session encryption (min 32 chars)",
    validator: (value) => value.length >= 32,
  },
  {
    name: "ADMIN_EMAIL",
    required: true,
    description: "Admin user email address",
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  },
  {
    name: "AI_ADMIN_PASSWORD",
    required: true,
    description: "Admin user password (min 8 chars)",
    validator: (value) => value.length >= 8,
  },
  {
    name: "CRON_SECRET",
    required: false,
    description: "Secret for cron job authentication",
  },

  // Email Configuration
  {
    name: "SMTP_HOST",
    required: false,
    description: "SMTP server hostname",
  },
  {
    name: "SMTP_PORT",
    required: false,
    description: "SMTP server port (default: 587)",
    validator: (value) => /^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) < 65536,
  },
  {
    name: "SMTP_USER",
    required: false,
    description: "SMTP username",
  },
  {
    name: "SMTP_PASS",
    required: false,
    description: "SMTP password or app password",
  },
  {
    name: "SMTP_FROM",
    required: false,
    description: "Sender email address (default: SMTP_USER)",
  },

  // AI Integration
  {
    name: "AI_INTEGRATIONS_OPENAI_API_KEY",
    required: false,
    description: "OpenAI API key for AI features",
    validator: (value) => value.startsWith("sk-"),
  },
  {
    name: "AI_INTEGRATIONS_OPENAI_BASE_URL",
    required: false,
    description: "OpenAI API base URL (default: https://api.openai.com)",
  },

  // Payment Processing
  {
    name: "MPESA_CONSUMER_KEY",
    required: false,
    description: "M-Pesa consumer key",
  },
  {
    name: "MPESA_CONSUMER_SECRET",
    required: false,
    description: "M-Pesa consumer secret",
  },
  {
    name: "MPESA_SHORTCODE",
    required: false,
    description: "M-Pesa shortcode",
  },
  {
    name: "MPESA_PASSKEY",
    required: false,
    description: "M-Pesa passkey",
  },
  {
    name: "MPESA_CALLBACK_URL",
    required: false,
    description: "M-Pesa callback URL",
  },
  {
    name: "MPESA_ENVIRONMENT",
    required: false,
    description: "M-Pesa environment (sandbox, production)",
    validator: (value) => ["sandbox", "production"].includes(value),
  },

  // CORS
  {
    name: "CORS_ORIGIN",
    required: false,
    description: "Comma-separated list of allowed CORS origins",
  },
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const isProduction = process.env.NODE_ENV === "production";

  for (const envVar of ENV_VARS) {
    const value = process.env[envVar.name];
    const isRequired = envVar.required && (!envVar.productionOnly || isProduction);

    // Check if required variable is missing
    if (isRequired && !value) {
      errors.push(`Required environment variable ${envVar.name} is missing: ${envVar.description}`);
      continue;
    }

    // Skip validation if variable is not set and not required
    if (!value) {
      continue;
    }

    // Run custom validator if provided
    if (envVar.validator && !envVar.validator(value)) {
      if (isRequired) {
        errors.push(`Invalid value for ${envVar.name}: ${envVar.description}`);
      } else {
        warnings.push(`Invalid value for ${envVar.name}: ${envVar.description}`);
      }
    }
  }

  // Production-specific warnings
  if (isProduction) {
    // Warn about optional but recommended variables
    const recommendedInProduction = [
      "SMTP_HOST",
      "SMTP_USER", 
      "SMTP_PASS",
      "AI_INTEGRATIONS_OPENAI_API_KEY",
      "CRON_SECRET"
    ];

    for (const varName of recommendedInProduction) {
      if (!process.env[varName]) {
        warnings.push(`Recommended environment variable ${varName} is not set in production`);
      }
    }

    // Warn about development-only configurations
    if (process.env.CORS_ORIGIN === "*") {
      warnings.push("CORS_ORIGIN is set to '*' in production - this may be insecure");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function printEnvironmentValidation(result: ValidationResult): void {
  if (result.errors.length > 0) {
    console.error("\n❌ Environment Validation Failed:");
    console.error("=====================================");
    result.errors.forEach((error, index) => {
      console.error(`${index + 1}. ${error}`);
    });
    console.error("\nApplication cannot start with these errors.\n");
    process.exit(1);
  }

  if (result.warnings.length > 0) {
    console.warn("\n⚠️  Environment Validation Warnings:");
    console.warn("======================================");
    result.warnings.forEach((warning, index) => {
      console.warn(`${index + 1}. ${warning}`);
    });
    console.warn();
  }

  console.log("✅ Environment validation passed");
}

export function getRequiredEnvVars(): string[] {
  return ENV_VARS.filter(env => env.required).map(env => env.name);
}

export function getAllEnvVars(): EnvVarConfig[] {
  return ENV_VARS;
}
