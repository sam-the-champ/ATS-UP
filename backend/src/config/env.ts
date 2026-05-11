import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string().url('Invalid DATABASE_URL'),
  DATABASE_POOL_MIN: z.coerce.number().default(5),
  DATABASE_POOL_MAX: z.coerce.number().default(20),
  REDIS_URL: z.string().url().default('redis://localhost:6379'),
  ACCESS_TOKEN_SECRET: z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
  REFRESH_TOKEN_SECRET: z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
  ACCESS_TOKEN_EXPIRY: z.string().default('15m'),
  REFRESH_TOKEN_EXPIRY: z.string().default('7d'),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
  AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
  AWS_BUCKET_NAME: z.string().min(1, 'AWS_BUCKET_NAME is required'),
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

export type Env = z.infer<typeof envSchema>;
export const env = envSchema.parse(process.env);