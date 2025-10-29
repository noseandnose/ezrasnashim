# Production Environment Variables

This document lists all environment variables required for the Ezras Nashim application to run in production.

## ✅ CRITICAL - Required (Application will crash without these)

### `DATABASE_URL`
PostgreSQL connection string for Supabase database.
```
DATABASE_URL=postgresql://user:password@host:port/database
```

### `ADMIN_PASSWORD`
Password for accessing the admin panel at `/admin`.
```
ADMIN_PASSWORD=your-secure-password
```

### `AWS_S3_BUCKET`
AWS S3 bucket name for object storage (images, media files).
```
AWS_S3_BUCKET=your-bucket-name
```

## ⚠️  HIGHLY RECOMMENDED - Payment & Push Notifications

### `STRIPE_SECRET_KEY`
Stripe secret key for processing donations. Without this, all donation endpoints will return 503 errors.
```
STRIPE_SECRET_KEY=sk_live_...
```

### `STRIPE_WEBHOOK_SECRET`
Stripe webhook secret for verifying payment webhooks.
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### `VAPID_PUBLIC_KEY`
VAPID public key for web push notifications.
```
VAPID_PUBLIC_KEY=your-public-key
```

### `VAPID_PRIVATE_KEY`
VAPID private key for web push notifications.
```
VAPID_PRIVATE_KEY=your-private-key
```

### `VAPID_EMAIL`
Contact email for VAPID (mailto: format).
```
VAPID_EMAIL=contact@yourdomain.com
```

## 📦 Optional - AWS & CDN

### `AWS_ACCESS_KEY_ID`
AWS access key ID for S3 operations. If not provided, will use IAM roles.
```
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
```

### `AWS_SECRET_ACCESS_KEY`
AWS secret access key for S3 operations. If not provided, will use IAM roles.
```
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

### `AWS_REGION`
AWS region for S3 bucket. Defaults to `us-east-1`.
```
AWS_REGION=us-east-1
```

### `CDN_BASE_URL`
CDN base URL for serving static assets (e.g., CloudFront).
```
CDN_BASE_URL=https://cdn.example.com
```

## ⚙️  System Configuration

### `NODE_ENV`
Application environment mode. Should be `production` for live deployment.
```
NODE_ENV=production
```

### `PORT`
Server port. Defaults to 5000.
```
PORT=5000
```

### `TRUST_PROXY_HOPS`
Number of proxy hops for IP forwarding. Defaults to 2 in production, 1 in development.
```
TRUST_PROXY_HOPS=2
```

## 🔍 Production Issue Resolution

The recent production API failures were caused by missing `STRIPE_SECRET_KEY`, which previously caused the entire server to crash at startup. 

**Fix Applied:** Stripe is now optional - the server will start without it, but donation endpoints will return proper 503 errors if the key is missing.

To restore full functionality:
1. Add `STRIPE_SECRET_KEY` to production environment
2. Add `STRIPE_WEBHOOK_SECRET` for payment verification
3. Redeploy the application

Without Stripe configured, the following endpoints will be unavailable:
- `/api/stripe-test` - Test Stripe connection
- `/api/create-session-checkout` - Create payment sessions
- `/api/webhooks/stripe` - Process payment webhooks
- `/api/donations/update-status` - Update donation status (partial functionality)
