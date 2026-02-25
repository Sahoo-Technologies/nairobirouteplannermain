/**
 * Secure Settings Management
 * 
 * Provides safe access to environment variables with proper masking
 * and audit logging for sensitive operations.
 */

import { existsSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

interface SettingConfig {
  name: string;
  sensitive: boolean;
  editable: boolean;
  description: string;
  validator?: (value: string) => boolean;
}

const SETTINGS_CONFIG: SettingConfig[] = [
  // Core Application
  {
    name: "NODE_ENV",
    sensitive: false,
    editable: true,
    description: "Application environment",
    validator: (value) => ["development", "production", "test"].includes(value),
  },
  {
    name: "PORT",
    sensitive: false,
    editable: true,
    description: "Server port",
    validator: (value) => /^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) < 65536,
  },

  // Database
  {
    name: "DATABASE_URL",
    sensitive: true,
    editable: true,
    description: "Database connection string",
    validator: (value) => value.startsWith("postgresql://") || value.startsWith("postgres://"),
  },

  // Security
  {
    name: "SESSION_SECRET",
    sensitive: true,
    editable: true,
    description: "Session encryption secret",
    validator: (value) => value.length >= 32,
  },
  {
    name: "ADMIN_EMAIL",
    sensitive: false,
    editable: true,
    description: "Admin email address",
    validator: (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
  },
  {
    name: "AI_ADMIN_PASSWORD",
    sensitive: true,
    editable: true,
    description: "Admin password",
    validator: (value) => value.length >= 8,
  },
  {
    name: "CRON_SECRET",
    sensitive: true,
    editable: true,
    description: "Cron job authentication secret",
  },

  // Email
  {
    name: "SMTP_HOST",
    sensitive: false,
    editable: true,
    description: "SMTP server hostname",
  },
  {
    name: "SMTP_PORT",
    sensitive: false,
    editable: true,
    description: "SMTP server port",
    validator: (value) => /^\d+$/.test(value) && parseInt(value) > 0 && parseInt(value) < 65536,
  },
  {
    name: "SMTP_USER",
    sensitive: false,
    editable: true,
    description: "SMTP username",
  },
  {
    name: "SMTP_PASS",
    sensitive: true,
    editable: true,
    description: "SMTP password",
  },
  {
    name: "SMTP_FROM",
    sensitive: false,
    editable: true,
    description: "Sender email address",
  },

  // AI Integration
  {
    name: "AI_INTEGRATIONS_OPENAI_API_KEY",
    sensitive: true,
    editable: true,
    description: "OpenAI API key",
    validator: (value) => value.startsWith("sk-"),
  },
  {
    name: "AI_INTEGRATIONS_OPENAI_BASE_URL",
    sensitive: false,
    editable: true,
    description: "OpenAI API base URL",
  },

  // CORS
  {
    name: "CORS_ORIGIN",
    sensitive: false,
    editable: true,
    description: "CORS allowed origins",
  },
];

export interface SecureSetting {
  name: string;
  value: string;
  description: string;
  sensitive: boolean;
  editable: boolean;
  masked: boolean;
}

export class SecureSettingsManager {
  private static instance: SecureSettingsManager;
  private auditLog: Array<{
    timestamp: string;
    action: string;
    setting: string;
    userId?: string;
    ip?: string;
  }> = [];

  static getInstance(): SecureSettingsManager {
    if (!SecureSettingsManager.instance) {
      SecureSettingsManager.instance = new SecureSettingsManager();
    }
    return SecureSettingsManager.instance;
  }

  private logAudit(action: string, setting: string, userId?: string, ip?: string): void {
    const entry = {
      timestamp: new Date().toISOString(),
      action,
      setting,
      userId,
      ip,
    };
    this.auditLog.push(entry);
    
    // Keep only last 1000 entries
    if (this.auditLog.length > 1000) {
      this.auditLog = this.auditLog.slice(-1000);
    }

    // Log to console for immediate visibility
    console.log(`SETTINGS_AUDIT: ${action} ${setting} by ${userId || 'unknown'} from ${ip || 'unknown'}`);
  }

  private maskValue(value: string, settingName: string): string {
    const config = SETTINGS_CONFIG.find(s => s.name === settingName);
    if (!config?.sensitive) {
      return value;
    }

    if (value.length <= 4) {
      return "****";
    }

    return "****" + value.slice(-2);
  }

  getAllSettings(userId?: string, ip?: string): SecureSetting[] {
    this.logAudit("VIEW_ALL", "settings", userId, ip);

    return SETTINGS_CONFIG.map(config => {
      const value = process.env[config.name] || "";
      const masked = config.sensitive && value.length > 0;

      return {
        name: config.name,
        value: masked ? this.maskValue(value, config.name) : value,
        description: config.description,
        sensitive: config.sensitive,
        editable: config.editable,
        masked,
      };
    });
  }

  getSetting(name: string, userId?: string, ip?: string): SecureSetting | null {
    const config = SETTINGS_CONFIG.find(s => s.name === name);
    if (!config) {
      return null;
    }

    this.logAudit("VIEW", name, userId, ip);

    const value = process.env[name] || "";
    const masked = config.sensitive && value.length > 0;

    return {
      name: config.name,
      value: masked ? this.maskValue(value, name) : value,
      description: config.description,
      sensitive: config.sensitive,
      editable: config.editable,
      masked,
    };
  }

  updateSetting(
    name: string,
    newValue: string,
    userId?: string,
    ip?: string
  ): { success: boolean; error?: string } {
    const config = SETTINGS_CONFIG.find(s => s.name === name);
    if (!config) {
      return { success: false, error: "Setting not found" };
    }

    if (!config.editable) {
      this.logAudit("ATTEMPT_UPDATE_READONLY", name, userId, ip);
      return { success: false, error: "Setting is not editable" };
    }

    // Validate new value
    if (config.validator && !config.validator(newValue)) {
      return { success: false, error: "Invalid value format" };
    }

    // Don't update if value is the same (including masked values)
    const currentValue = process.env[name] || "";
    if (newValue === currentValue) {
      return { success: true };
    }

    // Sanitize input
    const sanitized = newValue.trim().replace(/[\r\n]/g, "");

    // Update in memory
    process.env[name] = sanitized;

    // Log the change
    this.logAudit("UPDATE", name, userId, ip);

    // Persist to .env file
    this.persistToEnvFile(name, sanitized);

    return { success: true };
  }

  private persistToEnvFile(name: string, value: string): void {
    try {
      const envPath = join(process.cwd(), ".env");
      let envContent = "";

      if (existsSync(envPath)) {
        envContent = readFileSync(envPath, "utf-8");
      }

      // Update or add the setting
      const regex = new RegExp(`^${name}=.*$`, "m");
      const line = `${name}=${value}`;

      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, line);
      } else {
        envContent += (envContent.endsWith("\n") ? "" : "\n") + line;
      }

      writeFileSync(envPath, envContent, "utf-8");
    } catch (error) {
      console.error("Failed to persist setting to .env file:", error);
    }
  }

  getAuditLog(limit: number = 100): Array<{
    timestamp: string;
    action: string;
    setting: string;
    userId?: string;
    ip?: string;
  }> {
    return this.auditLog.slice(-limit);
  }

  validateAllSettings(): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    for (const config of SETTINGS_CONFIG) {
      const value = process.env[config.name];
      if (!value) {
        continue; // Skip empty values
      }

      if (config.validator && !config.validator(value)) {
        errors.push(`Invalid value for ${config.name}: ${config.description}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const settingsManager = SecureSettingsManager.getInstance();
