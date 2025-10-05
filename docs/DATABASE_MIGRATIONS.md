# Database Migrations Guide

**Last Updated:** October 2025
**Project:** Ezras Nashim

## Overview

This project uses **Drizzle ORM** for database schema management and migrations. Migrations track all database schema changes and can be applied reliably across environments.

## Setup

### Configuration

The migration configuration is defined in `drizzle.config.ts`:

```typescript
export default defineConfig({
  out: "./migrations",           // Migration files output directory
  schema: "./shared/schema.ts",  // Source of truth for schema
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL
  },
});
```

### Schema Definition

The database schema is defined in `/shared/schema.ts` (687 lines):
- 40+ tables for content, analytics, donations, and more
- Zod validation schemas for type-safe inserts
- Proper indexing on frequently queried columns
- TypeScript types exported for client/server use

## Migration Workflow

### 1. Generating Migrations

When you modify `/shared/schema.ts`, generate a migration:

```bash
npm run db:generate
```

This creates a new migration file in `/migrations/` folder with:
- Timestamped filename
- SQL statements to update schema
- Automatic detection of schema changes

### 2. Reviewing Migrations

**Always review generated migrations before applying:**

```bash
# Check generated SQL in migrations/ folder
cat migrations/<timestamp>_migration_name.sql
```

Look for:
- Correct column types
- Proper indexes
- Data preservation (no unwanted DROP statements)
- Foreign key relationships

### 3. Applying Migrations

#### Development

```bash
# Push schema directly to development database
npm run db:push
```

`db:push` is faster for development but **doesn't create migration files**.

#### Production

```bash
# Apply pending migrations
npm run db:migrate
```

`db:migrate` applies all pending migrations from `/migrations/` folder.

## Migration Best Practices

### 1. Never Modify Applied Migrations

Once a migration is applied to any environment, never edit it:
- ✅ Create a new migration to fix issues
- ❌ Edit existing migration files

### 2. Safe Schema Changes

**Safe (non-destructive):**
- Adding new tables
- Adding new columns with defaults
- Adding indexes
- Adding constraints (if data already valid)

**Unsafe (potential data loss):**
- Dropping columns
- Changing column types
- Dropping tables
- Renaming columns/tables (appears as drop + add)

### 3. Data Migrations

For complex changes requiring data transformation:

```sql
-- migrations/20251005_transform_data.sql

-- Step 1: Add new column
ALTER TABLE users ADD COLUMN full_name TEXT;

-- Step 2: Migrate data
UPDATE users SET full_name = first_name || ' ' || last_name;

-- Step 3: Clean up old columns (optional)
-- ALTER TABLE users DROP COLUMN first_name;
-- ALTER TABLE users DROP COLUMN last_name;
```

### 4. Testing Migrations

Before applying to production:

1. **Backup database** (critical!)
2. Apply to staging environment first
3. Verify application functionality
4. Check data integrity
5. Then apply to production

## Current State

### No Migration History

The project currently has **no migrations folder** because:
- Schema defined but never migrated formally
- Database tables created via `db:push` or manually
- All tables exist in production but no migration history

### Initial Migration Setup

To establish migration baseline:

```bash
# 1. Generate initial migration from current schema
npm run db:generate

# This creates migrations/0000_initial_schema.sql

# 2. If production DB already has tables, mark as applied:
# - Insert migration record manually in drizzle_migrations table
# - Or use drizzle-kit to handle this

# 3. Future changes: always use npm run db:generate
```

## Database Schema Overview

### Content Tables (Daily/Weekly)
- `daily_recipes`, `daily_halacha`, `daily_emuna`, `daily_chizuk`
- `parsha_vorts`, `table_inspirations`, `featured_content`
- `pirkei_avot`, `pirkei_avot_progress`

### Prayer Tables (Tefilla)
- `mincha_prayers`, `maariv_prayers`, `morning_prayers`
- `birkat_hamazon_prayers`, `after_brochas_prayers`
- `brochas`, `nishmas_text`, `womens_prayers`
- `tehillim`, `tehillim_names`, `tehillim_progress`, `global_tehillim_progress`, `perakim_texts`

### Tzedaka Tables
- `campaigns`, `donations`, `acts`
- `sponsors`

### Content Management
- `shop_items`, `messages`, `inspirational_quotes`
- `community_impact`, `discount_promotions`

### System Tables
- `push_subscriptions`, `push_notifications`
- `analytics_events`, `daily_stats`

## Environment-Specific Considerations

### Development (Replit)

```bash
# .env.replit
DATABASE_URL=postgresql://...
```

Use `db:push` for rapid iteration:
- No migration files created
- Instant schema sync
- Good for experimentation

### Staging

```bash
# Apply migrations like production
npm run db:migrate
```

Test migrations here before production.

### Production

```bash
# Always use migrations
npm run db:migrate

# NEVER use db:push in production!
```

Migrations provide:
- Audit trail of schema changes
- Rollback capability
- Coordinated deploys across instances

## Rollback Strategy

### Automatic Rollback

Drizzle doesn't have built-in rollback. To rollback:

1. **Write reverse migration manually:**

```sql
-- migrations/20251005_rollback_column.sql
ALTER TABLE users DROP COLUMN IF EXISTS new_column;
```

2. **Or restore from backup:**
```bash
# Restore database from pre-migration backup
pg_restore -d database_name backup_file.dump
```

### Prevention

Best rollback strategy is prevention:
- Test migrations in staging
- Always backup before major changes
- Write reversible migrations when possible
- Keep migration files small and focused

## Common Migration Tasks

### Adding a Column

```typescript
// shared/schema.ts
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  // Add new column:
  createdAt: timestamp("created_at").defaultNow()
});
```

```bash
npm run db:generate
# Review generated SQL
npm run db:migrate
```

### Adding an Index

```typescript
export const users = pgTable("users", {
  // ... columns
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));
```

### Creating a New Table

```typescript
export const newFeature = pgTable("new_feature", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertNewFeatureSchema = createInsertSchema(newFeature).omit({
  id: true,
  createdAt: true,
});
```

## Troubleshooting

### Migration Conflicts

**Error: "Table already exists"**

Solution: Database out of sync with migrations.

```bash
# Option 1: Mark migration as applied manually
# Option 2: Drop and recreate (dev only!)
# Option 3: Use db:push to sync
```

### Schema Drift

**Error: Schema doesn't match database**

```bash
# Check differences
npm run db:push -- --dry-run

# Apply changes
npm run db:push
```

### Connection Issues

**Error: "DATABASE_URL not set"**

Ensure environment variable is set:
```bash
echo $DATABASE_URL
# Should output connection string
```

## Additional Resources

- [Drizzle ORM Docs](https://orm.drizzle.team/docs/overview)
- [Drizzle Kit Migrations](https://orm.drizzle.team/kit-docs/overview)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Neon Database Docs](https://neon.tech/docs/introduction)

## Next Steps

1. **Generate initial migration** to establish baseline
2. **Document schema** in this file or separate schema docs
3. **Set up backup strategy** before production migrations
4. **Create staging environment** to test migrations
5. **Automate migrations** in CI/CD pipeline
