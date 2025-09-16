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
  max: 25, // Increased pool size to handle more concurrent users
  min: 5, // Keep more connections warm
  idleTimeoutMillis: 30000, // Increased idle timeout to reduce reconnections
  connectionTimeoutMillis: 10000, // Increased connection timeout for reliability
  keepAlive: true, // Keep connections alive
  keepAliveInitialDelayMillis: 10000, // Start keep-alive after 10 seconds
  query_timeout: 30000, // Add query timeout to prevent hanging queries
  statement_timeout: 30000 // Prevent long-running statements
});

export const db = drizzle(pool, { schema });
