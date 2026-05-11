"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const zod_1 = require("zod");
const envSchema = zod_1.z.object({
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    PORT: zod_1.z.coerce.number().default(5000),
    DATABASE_URL: zod_1.z.string().url('Invalid DATABASE_URL'),
    DATABASE_POOL_MIN: zod_1.z.coerce.number().default(5),
    DATABASE_POOL_MAX: zod_1.z.coerce.number().default(20),
    REDIS_URL: zod_1.z.string().url().default('redis://localhost:6379'),
    ACCESS_TOKEN_SECRET: zod_1.z.string().min(32, 'ACCESS_TOKEN_SECRET must be at least 32 characters'),
    REFRESH_TOKEN_SECRET: zod_1.z.string().min(32, 'REFRESH_TOKEN_SECRET must be at least 32 characters'),
    ACCESS_TOKEN_EXPIRY: zod_1.z.string().default('15m'),
    REFRESH_TOKEN_EXPIRY: zod_1.z.string().default('7d'),
    AWS_REGION: zod_1.z.string().default('us-east-1'),
    AWS_ACCESS_KEY_ID: zod_1.z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
    AWS_SECRET_ACCESS_KEY: zod_1.z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
    AWS_BUCKET_NAME: zod_1.z.string().min(1, 'AWS_BUCKET_NAME is required'),
    GEMINI_API_KEY: zod_1.z.string().min(1, 'GEMINI_API_KEY is required'),
    CORS_ORIGIN: zod_1.z.string().default('http://localhost:3000'),
    LOG_LEVEL: zod_1.z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});
exports.env = envSchema.parse(process.env);
