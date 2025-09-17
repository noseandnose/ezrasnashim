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
  max: 15, // Conservative pool size for Supabase free tier
  min: 0, // Allow pool to shrink to zero when not in use
  idleTimeoutMillis: 10000, // Close idle connections after 10 seconds
  connectionTimeoutMillis: 10000, // Connection timeout for reliability
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
  query_timeout: 30000, // Add query timeout to prevent hanging queries
  statement_timeout: 30000, // Prevent long-running statements
  allowExitOnIdle: true // Allow process to exit when idle
});

export const db = drizzle(pool, { schema });
