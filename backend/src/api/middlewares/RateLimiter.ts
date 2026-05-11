import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { CacheService } from '../../core/cache/RedisService';

const redis = CacheService.getRedisClient();

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  store: new (RedisStore as any)({
    client: redis,
    prefix: 'rate-limit:',
  }),
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path === '/api/v1/health';
  },
});