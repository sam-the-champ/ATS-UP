import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: 6379,
});

export class CacheService {
  static async get(key: string) {
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  static async set(key: string, value: any, ttlSeconds = 60) {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  static async invalidate(key: string) {
    await redis.del(key);
  }
}