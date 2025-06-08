# Supabase Database Setup Guide

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/log in
2. Click "New Project"
3. Choose your organization and enter project details:
   - Name: `ezras-nashim-app`
   - Database Password: (create a strong password and save it)
   - Region: Choose closest to your users
4. Click "Create new project"

## Step 2: Get Database Connection String

1. In your Supabase project dashboard, click "Settings" in the sidebar
2. Go to "Database"
3. Scroll down to "Connection string" section
4. Copy the URI from "Connection pooling" -> "Transaction pooler"
5. Replace `[YOUR-PASSWORD]` with your database password

The connection string should look like:
```
postgresql://postgres.xxxxx:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

## Step 3: Add Database URL to Environment

1. In your Replit project, go to the "Secrets" tab
2. Add a new secret:
   - Key: `DATABASE_URL`
   - Value: Your Supabase connection string (with password filled in)

## Step 4: Push Database Schema

Run this command to create all tables in Supabase:
```bash
npm run db:push
```

## Step 5: Verify Setup

1. Check the Supabase dashboard -> "Table Editor" to see your tables
2. The app should now connect to Supabase instead of in-memory storage
3. All Tehillim progress and data will persist between sessions

## Database Tables Created

- `users` - User accounts
- `content` - Torah content, recipes, etc.
- `jewish_times` - Daily zmanim
- `calendar_events` - Jewish calendar events
- `shop_items` - Shop products
- `tehillim_names` - Names for Tehillim dedication
- `global_tehillim_progress` - Shared Tehillim cycle progress
- `mincha_prayers` - Prayer texts in Hebrew/English
- `perakim_texts` - Tehillim chapter texts

## Benefits of Supabase

- Real-time data synchronization
- Automatic backups
- Scalable PostgreSQL database
- Built-in authentication (if needed later)
- Real-time subscriptions for live updates
- Professional database management