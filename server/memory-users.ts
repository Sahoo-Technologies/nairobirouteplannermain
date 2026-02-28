/**
 * In-Memory User Management
 * 
 * Provides user authentication and management when database is not available.
 * This is a fallback system for development/testing without a database.
 */

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { users } from "@shared/models/auth";
import type { User } from "@shared/models/auth";

interface MemoryUser {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  profileImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

class MemoryUserStore {
  private users: Map<string, MemoryUser> = new Map();
  private initialized = false;

  constructor() {
    this.initializeDefaultAdmin();
  }

  private async initializeDefaultAdmin() {
    if (this.initialized) return;
    
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.AI_ADMIN_PASSWORD;

    if (adminEmail && adminPassword) {
      try {
        const passwordHash = await bcrypt.hash(adminPassword, 12);
        const adminUser: MemoryUser = {
          id: `admin-${Date.now()}`,
          email: adminEmail.toLowerCase(),
          passwordHash,
          firstName: "Machii",
          lastName: "Jirmo",
          role: "admin",
          profileImageUrl: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        
        this.users.set(adminEmail.toLowerCase(), adminUser);
        console.log("✅ In-memory admin user created successfully");
      } catch (error) {
        console.error("Failed to create in-memory admin user:", error);
      }
    } else {
      console.warn("⚠️  ADMIN_EMAIL or AI_ADMIN_PASSWORD not set - no admin user available");
    }
    
    this.initialized = true;
  }

  async select(fields: any, where: any) {
    // Simple implementation for common queries
    if (where && where.email) {
      const user = this.users.get(where.email.toLowerCase());
      if (user && fields.email) {
        return [{ [fields.email]: user.email }];
      }
    }
    return [];
  }

  async insert(data: any) {
    const user: MemoryUser = {
      id: `user-${Date.now()}-${Math.random()}`,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      firstName: data.firstName || null,
      lastName: data.lastName || null,
      role: data.role || "user",
      profileImageUrl: data.profileImageUrl || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.users.set(user.email, user);
    return [user];
  }

  async update(data: any, where: any) {
    if (where && where.email) {
      const user = this.users.get(where.email.toLowerCase());
      if (user) {
        const updatedUser = { ...user, ...data, updatedAt: new Date() };
        this.users.set(user.email, updatedUser);
        return [updatedUser];
      }
    }
    return [];
  }

  async getUserByEmail(email: string): Promise<MemoryUser | null> {
    return this.users.get(email.toLowerCase()) || null;
  }

  async getUserById(id: string): Promise<MemoryUser | null> {
    for (const user of Array.from(this.users.values())) {
      if (user.id === id) return user;
    }
    return null;
  }

  async getAllUsers(): Promise<MemoryUser[]> {
    return Array.from(this.users.values());
  }

  async deleteUser(email: string): Promise<boolean> {
    return this.users.delete(email.toLowerCase());
  }
}

// Global instance
const memoryUserStore = new MemoryUserStore();

// Database-like interface for compatibility
export const memoryDb = {
  select: (fields: any, table: any, where?: any) => memoryUserStore.select(fields, where),
  insert: (table: any, data: any) => memoryUserStore.insert(data),
  update: (table: any, data: any, where: any) => memoryUserStore.update(data, where),
};

// Helper functions for authentication
export async function getMemoryUserByEmail(email: string): Promise<User | null> {
  const user = await memoryUserStore.getUserByEmail(email);
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as "admin" | "manager" | "user",
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function createMemoryUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<User> {
  const passwordHash = await bcrypt.hash(userData.password, 12);
  const [user] = await memoryUserStore.insert({
    email: userData.email,
    passwordHash,
    firstName: userData.firstName || null,
    lastName: userData.lastName || null,
    role: userData.role || "user",
  });
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as "admin" | "manager" | "user",
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function updateMemoryUser(email: string, updates: {
  password?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
}): Promise<User | null> {
  const data: any = { ...updates };
  if (updates.password) {
    data.passwordHash = await bcrypt.hash(updates.password, 12);
    delete data.password;
  }
  
  const [user] = await memoryUserStore.update(data, { email });
  if (!user) return null;
  
  return {
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as "admin" | "manager" | "user",
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getAllMemoryUsers(): Promise<User[]> {
  const users = await memoryUserStore.getAllUsers();
  return users.map(user => ({
    id: user.id,
    email: user.email,
    passwordHash: user.passwordHash,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role as "admin" | "manager" | "user",
    profileImageUrl: user.profileImageUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  }));
}

export async function deleteMemoryUser(email: string): Promise<boolean> {
  return memoryUserStore.deleteUser(email);
}

export async function deleteMemoryUserById(id: string): Promise<boolean> {
  const user = await memoryUserStore.getUserById(id);
  if (!user) return false;
  return memoryUserStore.deleteUser(user.email);
}
