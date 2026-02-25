/**
 * Admin Access Debugging Tool
 * 
 * Comprehensive debugging utilities for admin authentication and access issues.
 */

import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { hashPassword } from "./auth";

interface AdminDebugInfo {
  environment: {
    adminEmail: string | undefined;
    adminPasswordSet: boolean;
    sessionSecretSet: boolean;
    nodeEnv: string;
  };
  databaseUser: {
    exists: boolean;
    email: string | null;
    role: string | null;
    hasPassword: boolean;
    passwordHashLength: number | null;
    createdAt: string | null;
    updatedAt: string | null;
  };
  issues: string[];
  recommendations: string[];
}

export class AdminDebugger {
  static async getDebugInfo(): Promise<AdminDebugInfo> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Check environment variables
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.AI_ADMIN_PASSWORD;
    const sessionSecret = process.env.SESSION_SECRET;
    const nodeEnv = process.env.NODE_ENV || "development";

    if (!adminEmail) {
      issues.push("ADMIN_EMAIL environment variable is not set");
      recommendations.push("Set ADMIN_EMAIL to the admin user's email address");
    }

    if (!adminPassword) {
      issues.push("AI_ADMIN_PASSWORD environment variable is not set");
      recommendations.push("Set AI_ADMIN_PASSWORD to the admin user's password");
    }

    if (!sessionSecret) {
      issues.push("SESSION_SECRET environment variable is not set");
      recommendations.push("Set SESSION_SECRET to a secure 32+ character string");
    } else if (sessionSecret.length < 32) {
      issues.push("SESSION_SECRET is too short (minimum 32 characters)");
      recommendations.push("Use a longer, more secure SESSION_SECRET");
    }

    // Check database user
    let databaseUser = {
      exists: false,
      email: null as string | null,
      role: null as string | null,
      hasPassword: false,
      passwordHashLength: null as number | null,
      createdAt: null as string | null,
      updatedAt: null as string | null,
    };

    if (adminEmail) {
      try {
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, adminEmail.toLowerCase()))
          .limit(1);

        if (user) {
          databaseUser = {
            exists: true,
            email: user.email,
            role: user.role,
            hasPassword: !!user.passwordHash,
            passwordHashLength: user.passwordHash ? user.passwordHash.length : null,
            createdAt: user.createdAt?.toISOString() || null,
            updatedAt: user.updatedAt?.toISOString() || null,
          };

          // Validate user configuration
          if (!databaseUser.hasPassword) {
            issues.push("Admin user exists but has no password set");
            recommendations.push("Set a password for the admin user");
          }

          if (databaseUser.role !== "admin") {
            issues.push(`Admin user has incorrect role: ${databaseUser.role} (should be 'admin')`);
            recommendations.push("Update the admin user's role to 'admin'");
          }

          if (adminPassword && databaseUser.hasPassword) {
            const passwordMatch = await bcrypt.compare(adminPassword, user.passwordHash!);
            if (!passwordMatch) {
              issues.push("Admin user password does not match environment variable");
              recommendations.push("Update the admin user's password to match AI_ADMIN_PASSWORD");
            }
          }
        } else {
          issues.push(`No user found with email: ${adminEmail}`);
          recommendations.push("Create the admin user or check the email address");
        }
      } catch (error) {
        issues.push(`Database error when checking admin user: ${error instanceof Error ? error.message : String(error)}`);
        recommendations.push("Check database connection and permissions");
      }
    }

    // Additional checks
    if (nodeEnv === "production" && (!adminEmail || !adminPassword || !sessionSecret)) {
      issues.push("Production environment requires all admin configuration variables");
      recommendations.push("Set all required environment variables for production");
    }

    return {
      environment: {
        adminEmail,
        adminPasswordSet: !!adminPassword,
        sessionSecretSet: !!sessionSecret,
        nodeEnv,
      },
      databaseUser,
      issues,
      recommendations,
    };
  }

  static async fixAdminUser(): Promise<{ success: boolean; message: string; actions: string[] }> {
    const actions: string[] = [];
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.AI_ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      return {
        success: false,
        message: "ADMIN_EMAIL and AI_ADMIN_PASSWORD must be set",
        actions: [],
      };
    }

    try {
      // Check if user exists
      const [existingUser] = await db
        .select()
        .from(users)
        .where(eq(users.email, adminEmail.toLowerCase()))
        .limit(1);

      if (existingUser) {
        // Update existing user
        const updates: any = {
          role: "admin",
          updatedAt: new Date(),
        };

        // Update password if needed
        const passwordMatch = existingUser.passwordHash
          ? await bcrypt.compare(adminPassword, existingUser.passwordHash)
          : false;

        if (!passwordMatch) {
          updates.passwordHash = await hashPassword(adminPassword);
          actions.push("Updated admin user password");
        }

        // Update role if needed
        if (existingUser.role !== "admin") {
          actions.push("Updated admin user role to 'admin'");
        }

        // Update name if missing
        if (!existingUser.firstName || !existingUser.lastName) {
          updates.firstName = "Machii";
          updates.lastName = "Jirmo";
          actions.push("Updated admin user name");
        }

        await db
          .update(users)
          .set(updates)
          .where(eq(users.email, adminEmail.toLowerCase()));

        return {
          success: true,
          message: "Admin user updated successfully",
          actions,
        };
      } else {
        // Create new user
        const passwordHash = await hashPassword(adminPassword);
        await db.insert(users).values({
          email: adminEmail.toLowerCase(),
          passwordHash,
          firstName: "Machii",
          lastName: "Jirmo",
          role: "admin",
        });

        actions.push("Created new admin user");
        return {
          success: true,
          message: "Admin user created successfully",
          actions,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: `Failed to fix admin user: ${error instanceof Error ? error.message : String(error)}`,
        actions,
      };
    }
  }

  static async testAdminLogin(email: string, password: string): Promise<{
    success: boolean;
    message: string;
    steps: string[];
  }> {
    const steps: string[] = [];

    try {
      steps.push("Starting admin login test...");

      // Find user
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        steps.push(`User not found: ${email}`);
        return {
          success: false,
          message: "User not found",
          steps,
        };
      }

      steps.push(`Found user: ${user.email}, role: ${user.role}`);

      // Check role
      if (user.role !== "admin") {
        steps.push(`User role is not admin: ${user.role}`);
        return {
          success: false,
          message: "User is not an admin",
          steps,
        };
      }

      steps.push("User role is admin ✓");

      // Check password
      if (!user.passwordHash) {
        steps.push("User has no password set");
        return {
          success: false,
          message: "User has no password",
          steps,
        };
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        steps.push("Password verification failed");
        return {
          success: false,
          message: "Invalid password",
          steps,
        };
      }

      steps.push("Password verification ✓");
      steps.push("Admin login test passed ✓");

      return {
        success: true,
        message: "Admin login test successful",
        steps,
      };
    } catch (error) {
      steps.push(`Error during test: ${error instanceof Error ? error.message : String(error)}`);
      return {
        success: false,
        message: "Test failed with error",
        steps,
      };
    }
  }

  static async resetAdminPassword(newPassword: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!adminEmail) {
      return {
        success: false,
        message: "ADMIN_EMAIL environment variable is not set",
      };
    }

    try {
      const passwordHash = await hashPassword(newPassword);
      const result = await db
        .update(users)
        .set({
          passwordHash,
          updatedAt: new Date(),
        })
        .where(eq(users.email, adminEmail.toLowerCase()))
        .returning({ id: users.id });

      if (result.length === 0) {
        return {
          success: false,
          message: "Admin user not found",
        };
      }

      return {
        success: true,
        message: "Admin password reset successfully",
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to reset password: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }
}

// Express middleware for admin debugging
export function adminDebugMiddleware() {
  return async (req: any, res: any) => {
    try {
      const debugInfo = await AdminDebugger.getDebugInfo();
      res.json(debugInfo);
    } catch (error) {
      res.status(500).json({
        error: "Failed to get debug info",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

// Express route to fix admin user
export function adminFixMiddleware() {
  return async (req: any, res: any) => {
    try {
      const result = await AdminDebugger.fixAdminUser();
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to fix admin user",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

// Express route to test admin login
export function adminTestMiddleware() {
  return async (req: any, res: any) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({
          error: "Email and password are required",
        });
      }

      const result = await AdminDebugger.testAdminLogin(email, password);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to test admin login",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}

// Express route to reset admin password
export function adminResetPasswordMiddleware() {
  return async (req: any, res: any) => {
    try {
      const { newPassword } = req.body;
      
      if (!newPassword) {
        return res.status(400).json({
          error: "New password is required",
        });
      }

      if (newPassword.length < 8) {
        return res.status(400).json({
          error: "Password must be at least 8 characters long",
        });
      }

      const result = await AdminDebugger.resetAdminPassword(newPassword);
      res.json(result);
    } catch (error) {
      res.status(500).json({
        error: "Failed to reset admin password",
        message: error instanceof Error ? error.message : String(error),
      });
    }
  };
}
