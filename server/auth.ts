import type { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { users, passwordResetTokens } from "@shared/models/auth";
import { eq, and, gt, isNull } from "drizzle-orm";
import { pool } from "./db";
import { sendPasswordResetEmail, isEmailConfigured } from "./email";

const PgSession = connectPgSimple(session);

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export async function setupAuth(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  app.set("trust proxy", 1);

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: "sessions",
        createTableIfMissing: false,
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        sameSite: "lax",
      },
    })
  );
}

export function registerAuthRoutes(app: Express) {
  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Check if user has a password set
      if (!user.passwordHash) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Verify password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      // Set session
      req.session.userId = user.id;

      // Return user data without password hash
      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Logout endpoint
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, req.session.userId))
        .limit(1);

      if (!user) {
        return res.status(401).json({ error: "User not found" });
      }

      // Return user data without password hash
      const { passwordHash, ...userData } = user;
      res.json(userData);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to get user" });
    }
  });

  // Request password reset
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Find user by email
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);

      // Always return success even if user not found (security)
      if (!user) {
        return res.json({ success: true, message: "If your email exists, you will receive a reset link" });
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Invalidate any existing tokens for this user
      await db
        .update(passwordResetTokens)
        .set({ used: new Date() })
        .where(eq(passwordResetTokens.userId, user.id));

      // Save hashed token to database
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token: tokenHash,
        expiresAt,
      });

      // Build reset URL
      const protocol = req.secure ? "https" : "http";
      const host = req.get("host");
      const resetUrl = `${protocol}://${host}/reset-password?token=${token}`;

      // Check if email is configured
      if (isEmailConfigured()) {
        const sent = await sendPasswordResetEmail(user.email!, resetUrl);
        if (!sent) {
          console.error("Failed to send reset email");
        }
      } else if (process.env.NODE_ENV !== "production") {
        // Only log token in development (never in production)
        console.log("========================================");
        console.log("PASSWORD RESET TOKEN (email not configured)");
        console.log(`Email: ${user.email}`);
        console.log(`Reset URL: ${resetUrl}`);
        console.log("========================================");
      }

      res.json({ success: true, message: "If your email exists, you will receive a reset link" });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Failed to process request" });
    }
  });

  // Verify reset token
  app.get("/api/auth/verify-reset-token", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ valid: false, error: "Token is required" });
      }

      // Hash the incoming token to compare with stored hash
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.used)
          )
        )
        .limit(1);

      if (!resetToken) {
        return res.json({ valid: false, error: "Invalid or expired token" });
      }

      res.json({ valid: true });
    } catch (error) {
      console.error("Verify token error:", error);
      res.status(500).json({ valid: false, error: "Failed to verify token" });
    }
  });

  // Reset password with token
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res.status(400).json({ error: "Token and password are required" });
      }

      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }

      // Hash the incoming token to compare with stored hash
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      // Find valid token
      const [resetToken] = await db
        .select()
        .from(passwordResetTokens)
        .where(
          and(
            eq(passwordResetTokens.token, tokenHash),
            gt(passwordResetTokens.expiresAt, new Date()),
            isNull(passwordResetTokens.used)
          )
        )
        .limit(1);

      if (!resetToken) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }

      // Hash new password
      const passwordHash = await hashPassword(password);

      // Update user password
      await db
        .update(users)
        .set({ passwordHash, updatedAt: new Date() })
        .where(eq(users.id, resetToken.userId));

      // Mark token as used
      await db
        .update(passwordResetTokens)
        .set({ used: new Date() })
        .where(eq(passwordResetTokens.id, resetToken.id));

      res.json({ success: true, message: "Password reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Failed to reset password" });
    }
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

export function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  // Look up user role from the database
  const userId = req.session.userId;
  db.select({ role: users.role }).from(users).where(eq(users.id, userId)).then((rows) => {
    if (!rows.length || rows[0].role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  }).catch(() => {
    res.status(500).json({ error: "Authorization check failed" });
  });
}

// Helper function to hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper function to create/update admin user
export async function ensureAdminUser(email: string, password: string) {
  const passwordHash = await hashPassword(password);
  
  // Check if user exists
  const [existingUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  if (existingUser) {
    // Update existing user with password and admin role
    await db
      .update(users)
      .set({ 
        passwordHash, 
        role: "admin",
        updatedAt: new Date()
      })
      .where(eq(users.email, email.toLowerCase()));
  } else {
    // Create new admin user
    await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName: "Admin",
      lastName: "User",
      role: "admin",
    });
  }
}
