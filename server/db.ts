import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please provide your Supabase database connection string.",
  );
}

const isStaging = process.env.NODE_ENV == 'staging';
// Optimized Supabase connection configuration for production stability
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: isStaging ? false : { rejectUnauthorized: false },
  max: 20, // Reduced pool size for Supabase free tier (prevents connection exhaustion)
  min: 2, // Lower minimum to conserve connections
  idleTimeoutMillis: 30000, // Increased idle timeout to reduce reconnections
  connectionTimeoutMillis: 10000, // Increased connection timeout for reliability
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
  query_timeout: 30000, // Add query timeout to prevent hanging queries
  statement_timeout: 30000 // Prevent long-running statements
});

export const db = drizzle(pool, { schema });
