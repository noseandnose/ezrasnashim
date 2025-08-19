"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.pool = void 0;
var pg_1 = require("pg");
var node_postgres_1 = require("drizzle-orm/node-postgres");
var schema = require("@shared/schema");
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set. Please provide your Supabase database connection string.");
}
var isStaging = process.env.NODE_ENV == 'staging';
// Supabase connection configuration
exports.pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: isStaging ? false : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
exports.db = (0, node_postgres_1.drizzle)(exports.pool, { schema: schema });
