# Security Model Documentation

**Last Updated:** October 2025
**Project:** Ezras Nashim

## Overview

This document outlines the security approach for the Ezras Nashim application, including authentication, authorization, data protection, and database security.

## Authentication Model

### No User Authentication Required

The Ezras Nashim app operates **without user authentication** for the primary user experience:

- **Public Access**: Torah content, prayers, and donation features are available to all users
- **Anonymous Usage**: Users can access all content without creating accounts
- **Session Tracking**: Anonymous sessions tracked via client-side IDs for analytics only
- **No Personal Data Collection**: App doesn't collect or store personal user information

### Admin Authentication

Admin endpoints use a simple bearer token authentication:

- **Environment Variable**: `ADMIN_PASSWORD` configured in deployment
- **Bearer Token**: Admins include `Authorization: Bearer <ADMIN_PASSWORD>` header
- **Protected Endpoints**: Content management, analytics, and administrative functions
- **Limitations**: Single shared password (not multi-user)

**Security Considerations:**
- Admin password should be rotated regularly
- Use HTTPS for all admin operations
- Consider implementing proper admin auth system for production (Auth0, Supabase Auth, etc.)

## Database Security

### Current Approach: Application-Level Security

The application uses **application-level security** rather than Row Level Security (RLS):

**Why No RLS:**
1. **No User Accounts**: App doesn't have user authentication, so no user context for RLS
2. **Public Read Access**: Most content is publicly readable
3. **Admin Write Access**: Write operations restricted at application layer via `requireAdminAuth` middleware
4. **Simplified Model**: Appropriate for the app's use case

**Security Measures:**
- Direct PostgreSQL connection through Neon/Supabase
- All write endpoints protected by admin authentication
- Input validation with Zod schemas
- SQL injection prevention through Drizzle ORM parameterized queries

### Database Connection Security

```typescript
// Secure connection configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Production uses SSL
  max: 15, // Connection pooling limits
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 10000
});
```

**Best Practices:**
- Connection string stored in environment variables
- SSL enabled for production connections
- Connection pooling prevents resource exhaustion
- Query timeouts prevent hanging operations

## API Security

### Rate Limiting

Multi-tier rate limiting protects against abuse:

```javascript
// General API: 2000 requests per minute (supports 50+ concurrent users)
generalApiLimiter: {
  windowMs: 60000,
  max: 2000
}

// Auth endpoints: 10 attempts per 15 minutes per IP
authLimiter: {
  windowMs: 900000,
  max: 10
}

// Expensive operations: 30 requests per minute per IP
expensiveLimiter: {
  windowMs: 60000,
  max: 30
}
```

### Content Security Policy (CSP)

Helmet.js implements strict CSP headers:

```javascript
{
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "https://www.hebcal.com", ...],
  styleSrc: ["'self'", "'unsafe-inline'", ...],
  connectSrc: ["'self'", "https://api.stripe.com", ...],
  frameSrc: ["'self'", "https://js.stripe.com"]
}
```

### CORS Protection

Strict origin validation:

```javascript
allowedOrigins: [
  'https://ezrasnashim.app',
  'https://api.ezrasnashim.app',
  'https://staging.ezrasnashim.app',
  /\.replit\.dev$/,
  // Development origins...
]
```

## Input Validation

### Zod Schema Validation

All API inputs validated with Zod:

```typescript
// Example: Daily Torah content
export const insertDailyHalachaSchema = createInsertSchema(dailyHalacha).omit({
  id: true,
  createdAt: true,
});

// Used in routes:
const validated = insertDailyHalachaSchema.parse(req.body);
```

**Benefits:**
- Type-safe input validation
- Automatic SQL injection prevention
- Consistent error messages
- Runtime and compile-time safety

## Payment Security

### Stripe Integration

Secure payment processing:

- **Client-Side**: Uses Stripe.js for tokenization (PCI-compliant)
- **Server-Side**: Processes payments with Stripe Secret Key
- **Webhooks**: Validates webhook signatures with `STRIPE_WEBHOOK_SECRET`
- **No Card Storage**: Card details never touch our servers

```typescript
// Webhook signature validation
const sig = req.headers['stripe-signature'];
const event = stripe.webhooks.constructEvent(
  req.body,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## Environment Variables

### Required Variables

Validated at startup with Zod schema:

```typescript
const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  STRIPE_SECRET_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'staging']),
  // ... more
});
```

**Security Best Practices:**
- Never commit `.env` files
- Rotate secrets regularly
- Use different keys for staging/production
- Validate all required variables at startup

## Data Protection

### Personal Data Handling

Minimal personal data collection:

- **Donations**: Optional donor name and email (for receipts)
- **Tehillim Names**: Hebrew names for prayer (auto-expire after 18 days)
- **Push Subscriptions**: Anonymous device tokens (can be revoked)
- **Analytics**: Aggregated, anonymous session data

### Data Retention

```typescript
// Auto-cleanup of expired data
setInterval(async () => {
  await storage.cleanupExpiredNames(); // Removes old Tehillim names
}, 60 * 60 * 1000); // Every hour
```

## Infrastructure Security

### Production Deployment

- **AWS ECS**: Container orchestration
- **CloudFront + S3**: Static asset delivery with DDoS protection
- **SSL/TLS**: All traffic encrypted in transit
- **Docker**: Containerized deployment for consistency

### Secrets Management

- **GitHub Secrets**: CI/CD secrets stored securely
- **Environment Variables**: Runtime secrets injected at deployment
- **No Hardcoded Secrets**: All sensitive values from environment

## Monitoring & Incident Response

### Error Handling

```typescript
app.use((err, req, res, next) => {
  const status = err?.status || 500;
  console.error('Express Error Handler:', {
    error: err,
    status,
    url: req.url,
    timestamp: new Date().toISOString()
  });
  res.status(status).json({ message: err.message });
});
```

### Logging

- **Development**: Verbose logging for debugging
- **Production**: Essential errors only (avoid exposing sensitive data)
- **No Sensitive Data**: Never log passwords, tokens, or PII

## Security Recommendations

### Immediate Improvements

1. **Admin Auth**: Implement proper multi-user admin authentication
2. **Error Monitoring**: Add Sentry or similar service
3. **Audit Logging**: Track admin actions for accountability
4. **Dependency Scanning**: Automate security vulnerability checks

### Long-term Considerations

1. **User Accounts** (if needed): Implement Supabase Auth or Auth0
2. **Row Level Security**: Enable if user accounts are added
3. **API Versioning**: Add version prefix for backward compatibility
4. **Security Headers**: Review and tighten CSP further

## Compliance

### GDPR Considerations

- Minimal data collection
- Optional donation information
- No tracking without consent
- Push notifications opt-in only
- Right to deletion supported (contact admin)

### PCI Compliance

- **Stripe**: Handles all payment processing (PCI Level 1 certified)
- **No Card Storage**: Application never stores payment details
- **Tokenization**: Client-side tokenization via Stripe.js

## Security Contact

For security concerns or to report vulnerabilities:
- **Email**: [Configure security contact email]
- **Process**: Private disclosure preferred before public announcement

## Audit History

- **October 2025**: Initial security documentation and environment validation
- **[Future]**: Regular security audits recommended quarterly
