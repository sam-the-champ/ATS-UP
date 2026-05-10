import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL!);

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  max: 100,

  store: new RedisStore({
    sendCommand: (...args: [string, ...string[]]) =>
      redis.call(args[0], ...args.slice(1)) as Promise<any>,
  }),

  message:
    'Too many requests from this IP, please try again after 15 minutes',
});