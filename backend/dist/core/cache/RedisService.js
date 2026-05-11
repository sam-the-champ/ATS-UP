"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
const env_1 = require("../../config/env");
// Singleton Redis instance
const redis = new ioredis_1.default(env_1.env.REDIS_URL, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
    },
});
redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});
redis.on('connect', () => {
    console.log('✓ Redis connected');
});
class CacheService {
    static async get(key) {
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        }
        catch (error) {
            console.error(`Cache get error for key ${key}:`, error);
            return null;
        }
    }
    static async set(key, value, ttlSeconds = 60) {
        try {
            await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        }
        catch (error) {
            console.error(`Cache set error for key ${key}:`, error);
        }
    }
    static async invalidate(key) {
        try {
            await redis.del(key);
        }
        catch (error) {
            console.error(`Cache invalidate error for key ${key}:`, error);
        }
    }
    // Export redis instance for use in other services
    static getRedisClient() {
        return redis;
    }
}
exports.CacheService = CacheService;
