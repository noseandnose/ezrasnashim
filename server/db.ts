import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";

// Skip database connection for now - just export a mock
console.log('Skipping database connection for WebContainer compatibility');

// Create a mock pool that won't try to connect
export const pool = {
  query: () => Promise.resolve({ rows: [] }),
  end: () => Promise.resolve()
};

// Create a mock db that won't crash
export const db = {
  select: () => ({
    from: () => ({
      where: () => Promise.resolve([]),
      limit: () => Promise.resolve([])
    })
  }),
  insert: () => ({
    into: () => ({
      values: () => Promise.resolve({ insertId: 1 })
    })
  })
};
