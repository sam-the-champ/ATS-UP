import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().default('5000'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  ACCESS_TOKEN_SECRET: z.string().min(32),
  REFRESH_TOKEN_SECRET: z.string().min(32),
  OPENAI_API_KEY: z.string(),
  AWS_S3_BUCKET: z.string(), // New for Resume storage
});

export const env = envSchema.parse(process.env);