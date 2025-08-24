import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database connection string.",
  );
}

const isStaging = process.env.NODE_ENV == 'staging';
// Optimized Supabase connection configuration for faster queries
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: isStaging ? false : { rejectUnauthorized: false },
  max: 10, // Reduced pool size for better connection reuse
  min: 2, // Keep minimum connections warm
  idleTimeoutMillis: 10000, // Reduced idle timeout
  connectionTimeoutMillis: 5000, // Increased connection timeout
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000 // Start keep-alive after 10 seconds
});

export const db = drizzle(pool, { schema });
