import { z } from 'zod';

const envSchema = z.object({
  // Infrastructure
  PORT: z.string().default('4000').transform(Number),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),

  // Auth & Security
  JWT_SECRET: z.string().min(32, "JWT_SECRET must be at least 32 characters"),
  CORS_ORIGIN: z.string().default('*'),
  
  // Monitoring
  SENTRY_DSN: z.string().url(),
  POSTHOG_API_KEY: z.string(),
  POSTHOG_HOST: z.string().url().default('https://us.i.posthog.com'),

  // Payments
  RAZORPAY_KEY_ID: z.string(),
  RAZORPAY_KEY_SECRET: z.string(),

  // Storage
  R2_ACCESS_KEY_ID: z.string(),
  R2_SECRET_ACCESS_KEY: z.string(),
  R2_BUCKET_NAME: z.string(),
  R2_ENDPOINT: z.string().url(),
  R2_PUBLIC_URL: z.string().url(),

  // Firebase Admin (Production Grade)
  FIREBASE_PROJECT_ID: z.string(),
  FIREBASE_CLIENT_EMAIL: z.string().email(),
  FIREBASE_PRIVATE_KEY: z.string(),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error('❌ Invalid backend environment variables:');
  const formatted = _env.error.format();
  
  // Log each error specifically to help debugging in Vercel/Docker logs
  for (const key in formatted) {
    if (key !== '_errors') {
      const errorDetail = formatted[key as keyof typeof formatted];
      console.error(`  - ${key}: ${JSON.stringify(errorDetail)}`);
    }
  }
  
  process.exit(1); // Stop the server if config is broken
}

export const env = _env.data;
