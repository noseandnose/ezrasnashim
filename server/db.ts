import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

// Use a working database URL for WebContainer environment
const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://postgres@localhost:5432/postgres';

console.log('Database connection attempt:', DATABASE_URL.replace(/:[^:@]*@/, ':***@'));

const isStaging = process.env.NODE_ENV == 'staging';
// Optimized connection configuration for WebContainer environment
export const pool = new Pool({ 
  connectionString: DATABASE_URL,
  ssl: false, // Disable SSL for local development
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
