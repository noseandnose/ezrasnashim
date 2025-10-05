import { z } from 'zod';

const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'staging']).default('development'),
  PORT: z.string().default('5000'),

  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Stripe
  STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // VAPID (Push Notifications)
  VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_EMAIL: z.string().email().optional(),

  // Admin
  ADMIN_PASSWORD: z.string().optional(),

  // Google Cloud Storage (optional)
  GOOGLE_CLOUD_PROJECT_ID: z.string().optional(),
  GOOGLE_CLOUD_BUCKET_NAME: z.string().optional(),

  // Proxy configuration
  TRUST_PROXY_HOPS: z.string().optional(),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(): Env {
  try {
    const validated = envSchema.parse(process.env);

    // Warn about optional but recommended variables
    if (!validated.ADMIN_PASSWORD) {
      console.warn('⚠️  ADMIN_PASSWORD not set - admin endpoints will be unavailable');
    }

    if (!validated.VAPID_PUBLIC_KEY || !validated.VAPID_PRIVATE_KEY || !validated.VAPID_EMAIL) {
      console.warn('⚠️  VAPID keys not configured - push notifications will be disabled');
    }

    return validated;
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment validation failed:');
      error.errors.forEach((err) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
      throw new Error('Invalid environment configuration');
    }
    throw error;
  }
}

// Validate immediately on import (fail fast)
export const env = validateEnv();
