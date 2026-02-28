import type { Express, Request, Response, NextFunction } from "express";
import express from "express";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db } from "./db";
import { users, passwordResetTokens } from "@shared/models/auth";
import type { User } from "@shared/models/auth";
import { memoryDb, getMemoryUserByEmail, createMemoryUser, updateMemoryUser, getAllMemoryUsers, deleteMemoryUserById } from "./memory-users";
import { and, gt, isNull } from "drizzle-orm";
import { pool } from "./db";
import { sendPasswordResetEmail, isEmailConfigured } from "./email";

// connect-pg-simple exports a function(session) that returns the Store class
const PgSessionStore = typeof connectPg === "function" ? connectPg(session) : ((connectPg as any).default ?? connectPg)(session);

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

  // Choose session store based on database availability
  let sessionStore;
  if (isDatabaseAvailable()) {
    try {
      // PostgreSQL session store required for serverless (Vercel); MemoryStore loses sessions across instances
      sessionStore = new PgSessionStore({
        pool,
        tableName: "sessions",
        createTableIfMissing: true, // Ensure table exists (connect-pg-simple creates sid, sess, expire)
      });
      console.log("✅ Using PostgreSQL session store");
    } catch (error) {
      console.error("⚠️  Failed to create PostgreSQL session store, falling back to memory:", error);
      // In production/serverless, memory store will cause 401 on cold starts - warn loudly
      if (process.env.NODE_ENV === "production" || process.env.VERCEL) {
        console.error("⚠️  PRODUCTION WARNING: MemoryStore will not persist sessions across serverless invocations. Admin/auth requests may return 401 on cold starts.");
      }
      sessionStore = new (await import('express-session')).MemoryStore();
      console.log("⚠️  Using in-memory session store (sessions will be lost on restart)");
    }
  } else {
    // Use memory store when no database
    sessionStore = new (await import('express-session')).MemoryStore();
    console.log("⚠️  Using in-memory session store (no DATABASE_URL provided)");
  }

  app.use(
    session({
      store: sessionStore,
      name: "__veew_sid", // Custom cookie name (avoid default connect.sid fingerprinting)
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
  // Public registration endpoint
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }
      const existing = await getUserByEmail(email.toLowerCase());
      if (existing) {
        return res.status(409).json({ error: "User already exists" });
      }
      const newUser = await createUser({ email, password, firstName, lastName });
      // Do not expose passwordHash
      const { passwordHash, ...userData } = newUser as any;
      res.status(201).json({ user: userData });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  // Login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required" });
      }

      // Find user by email
      const user = await getUserByEmail(email.toLowerCase());

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

      // Regenerate session to prevent session fixation attacks
      const oldSession = req.session;
      req.session.regenerate((err) => {
        if (err) {
          console.error("Session regeneration error:", err);
          return res.status(500).json({ error: "Login failed" });
        }
        req.session.userId = user.id;
        req.session.save((saveErr) => {
          if (saveErr) {
            console.error("Session save error:", saveErr);
            return res.status(500).json({ error: "Login failed" });
          }
          // Return user data without password hash
          const { passwordHash, ...userData } = user;
          res.json(userData);
        });
      });
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
      res.clearCookie("__veew_sid");
      res.json({ success: true });
    });
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req: Request, res: Response) => {
    try {
      if (!req.session.userId) {
        return res.status(401).json({ error: "Not authenticated" });
      }

      // For memory users, we need to search by ID
      let user = null;
      if (isDatabaseAvailable()) {
        try {
          const [dbUser] = await db
            .select()
            .from(users)
            .where(eq(users.id, req.session.userId))
            .limit(1);
          user = dbUser;
        } catch (error) {
          console.error("Database error, falling back to memory:", error);
        }
      }
      
      // If database failed or not available, try memory
      if (!user) {
        const allUsers = await getAllUsers();
        user = allUsers.find(u => u.id === req.session.userId) || null;
      }

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

      // Password complexity: min 8 chars, at least 1 uppercase, 1 lowercase, 1 digit
      if (password.length < 8) {
        return res.status(400).json({ error: "Password must be at least 8 characters" });
      }
      if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        return res.status(400).json({ error: "Password must contain uppercase, lowercase, and a digit" });
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

  // ============ DATA SUBJECT RIGHTS (Kenya DPA 2019) ============

  // Export all personal data (Right of Access / Portability — Sections 26-28)
  app.get("/api/auth/my-data", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = req.session.userId;

      // Fetch user profile (excluding password hash)
      const [user] = await db
        .select({
          id: users.id,
          email: users.email,
          firstName: users.firstName,
          lastName: users.lastName,
          role: users.role,
          profileImageUrl: users.profileImageUrl,
          createdAt: users.createdAt,
          updatedAt: users.updatedAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({
        exportDate: new Date().toISOString(),
        dataController: "Veew Distributors",
        dataSubject: user,
        note: "This export contains all personal data held about you in compliance with the Kenya Data Protection Act 2019.",
      });
    } catch (error) {
      console.error("Data export error:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Delete account (Right to Erasure — Section 26(d))
  app.delete("/api/auth/delete-account", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }
    try {
      const userId = req.session.userId;

      // Check user exists and is not the last admin
      const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (user.role === "admin") {
        // Ensure at least one admin remains
        const allAdmins = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.role, "admin"));
        if (allAdmins.length <= 1) {
          return res.status(400).json({ error: "Cannot delete the last admin account" });
        }
      }

      // Delete password reset tokens for this user
      await db.delete(passwordResetTokens).where(eq(passwordResetTokens.userId, userId));

      // Delete the user
      await db.delete(users).where(eq(users.id, userId));

      // Destroy session
      req.session.destroy(() => {});
      res.clearCookie("__veew_sid");

      res.json({ success: true, message: "Account and personal data deleted" });
    } catch (error) {
      console.error("Account deletion error:", error);
      res.status(500).json({ error: "Failed to delete account" });
    }
  });
}

export function isAuthenticated(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

/** Get user role by ID — checks both database and memory (for when DB unavailable) */
async function getUserRole(userId: string): Promise<string | null> {
  if (isDatabaseAvailable()) {
    try {
      const [row] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);
      if (row) return row.role;
    } catch {
      // Database failed, fall through to memory
    }
  }
  const allUsers = await getAllUsers();
  const user = allUsers.find((u) => u.id === userId);
  return user?.role ?? null;
}

export async function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const role = await getUserRole(req.session.userId);
    if (role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }
    next();
  } catch {
    res.status(500).json({ error: "Authorization check failed" });
  }
}

// Helper function to hash password
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Helper function to check if database is available
function isDatabaseAvailable(): boolean {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL.length > 0;
}

// Helper function to get user (database or memory)
async function getUserByEmail(email: string): Promise<User | null> {
  if (isDatabaseAvailable()) {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, email.toLowerCase()))
        .limit(1);
      return user || null;
    } catch (error) {
      console.error("Database error, falling back to memory:", error);
      return await getMemoryUserByEmail(email);
    }
  } else {
    return await getMemoryUserByEmail(email);
  }
}

// Helper function to create user (database or memory)
async function createUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<User> {
  if (isDatabaseAvailable()) {
    try {
      const passwordHash = await hashPassword(userData.password);
      const [user] = await db
        .insert(users)
        .values({
          email: userData.email.toLowerCase(),
          passwordHash,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          role: userData.role || "user",
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Database error, falling back to memory:", error);
      return await createMemoryUser(userData);
    }
  } else {
    return await createMemoryUser(userData);
  }
}

// Helper function to update user (database or memory)
async function updateUser(email: string, updates: {
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<User | null> {
  if (isDatabaseAvailable()) {
    try {
      const data: any = { ...updates, updatedAt: new Date() };
      if (updates.password) {
        data.passwordHash = await hashPassword(updates.password);
        delete data.password;
      }
      
      const [user] = await db
        .update(users)
        .set(data)
        .where(eq(users.email, email.toLowerCase()))
        .returning();
      return user || null;
    } catch (error) {
      console.error("Database error, falling back to memory:", error);
      return await updateMemoryUser(email, updates);
    }
  } else {
    return await updateMemoryUser(email, updates);
  }
}

// Helper function to get all users (database or memory)
async function getAllUsers(): Promise<User[]> {
  if (isDatabaseAvailable()) {
    try {
      return await db.select().from(users);
    } catch (error) {
      console.error("Database error, falling back to memory:", error);
      return await getAllMemoryUsers();
    }
  } else {
    return await getAllMemoryUsers();
  }
}

// Helper function to create/update admin user
export async function ensureAdminUser(email: string, password: string) {
  try {
    // Check if user exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      // Only update if password changed or role isn't admin (avoid unnecessary writes)
      const passwordMatch = existingUser.passwordHash
        ? await bcrypt.compare(password, existingUser.passwordHash)
        : false;
      if (!passwordMatch || existingUser.role !== "admin") {
        await updateUser(email, {
          password,
          firstName: "Machii",
          lastName: "Jirmo",
          role: "admin",
        });
      }
    } else {
      await createUser({
        email,
        password,
        firstName: "Machii",
        lastName: "Jirmo",
        role: "admin",
      });
    }
  } catch (error) {
    console.error("Failed to ensure admin user:", error);
    // Don't crash the server - log the error and continue
    throw new Error(`Admin user setup failed: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function isManager(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  try {
    const role = await getUserRole(req.session.userId);
    if (role !== "manager" && role !== "admin") {
      return res.status(403).json({ error: "Manager or admin access required" });
    }
    next();
  } catch {
    res.status(500).json({ error: "Authorization check failed" });
  }
}

// Helper function to delete user by ID (database or memory)
async function deleteUserById(userId: string): Promise<boolean> {
  if (isDatabaseAvailable()) {
    try {
      const [deleted] = await db.delete(users).where(eq(users.id, userId)).returning();
      return !!deleted;
    } catch {
      return await deleteMemoryUserById(userId);
    }
  }
  return await deleteMemoryUserById(userId);
}

// Export hybrid user management functions
export { getUserByEmail, createUser, updateUser, getAllUsers, deleteUserById };
