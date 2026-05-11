import Redis from 'ioredis';
import { env } from '../../config/env';

// Singleton Redis instance
const redis = new Redis(env.REDIS_URL, {
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

export class CacheService {
  static async get(key: string) {
    try {
      const data = await redis.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null;
    }
  }

  static async set(key: string, value: any, ttlSeconds = 60) {
    try {
      await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
    }
  }

  static async invalidate(key: string) {
    try {
      await redis.del(key);
    } catch (error) {
      console.error(`Cache invalidate error for key ${key}:`, error);
    }
  }

  // Export redis instance for use in other services
  static getRedisClient() {
    return redis;
  }
}