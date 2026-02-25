

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { sql } from 'drizzle-orm';
import { pgTable, varchar, timestamp, jsonb, index } from 'drizzle-orm/pg-core';
import bcrypt from 'bcryptjs';

// Import unused jwt removed


// duplicate users table definition from shared/models/auth.ts
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// sessions table definition to look up session cookie
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

async function requireAdmin(req, res) {
  const sid = req.cookies?.__veew_sid;
  if (!sid) return false;
  // fetch session data
  const [row] = await db.select({ sess: sessions.sess }).from(sessions).where(sessions.sid.eq(sid));
  if (!row || !row.sess || !row.sess.userId) return false;
  const userId = row.sess.userId;
  const [user] = await db.select().from(users).where(users.id.eq(userId)).limit(1);
  return user && user.role === 'admin';
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

export default async function handler(req, res) {
  if (!(await requireAdmin(req, res))) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    // Fetch users from DB
    const allUsers = await db.select().from(users);
    return res.status(200).json({ data: allUsers, pagination: { page: 1, limit: 50, count: allUsers.length, hasMore: false } });
  }

  if (req.method === 'POST') {
    const { email, password, firstName, lastName, role } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Password must contain uppercase, lowercase, and a digit' });
    }
    // Only allow admin role for env admin
    if (role === 'admin' && email.toLowerCase() !== String(process.env.ADMIN_EMAIL).toLowerCase()) {
      return res.status(400).json({ error: 'Only the environment admin can have the admin role' });
    }
    // Check if user exists
    const existing = await db.select().from(users).where(users.email.eq(email.toLowerCase()));
    if (existing.length > 0) return res.status(409).json({ error: 'A user with this email already exists' });
    const passwordHash = await bcrypt.hash(password, 10);
    const [newUser] = await db.insert(users).values({
      email: email.toLowerCase(),
      passwordHash,
      firstName: firstName || null,
      lastName: lastName || null,
      role: (role === 'admin' && email.toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase()) ? 'admin' : (role === 'manager' ? 'manager' : 'user'),
    }).returning();
    const { passwordHash: _, ...userData } = newUser;
    return res.status(201).json(userData);
  }

  res.setHeader('Allow', ['GET', 'POST']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}
