import { User, Role } from '@prisma/client';
import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

export class UserRepository {
  static async create(data: {
    email: string;
    password: string;
    role: Role;
  }): Promise<User> {
    try {
      const user = await db.user.create({
        data,
      });

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  static async findByEmail(email: string): Promise<User | null> {
    try {
      const cacheKey = `user:email:${email}`;

      // Try cache first
      const cachedUser = await CacheService.get(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      // Query database
      const user = await db.user.findUnique({
        where: { email },
      });

      // Cache result (short TTL for security)
      if (user) {
        await CacheService.set(cacheKey, user, 300); // 5 minutes
      }

      return user;
    } catch (error) {
      console.error('Error finding user by email:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const cacheKey = `user:id:${id}`;

      // Try cache first
      const cachedUser = await CacheService.get(cacheKey);
      if (cachedUser) {
        return cachedUser;
      }

      // Query database
      const user = await db.user.findUnique({
        where: { id },
      });

      // Cache result
      if (user) {
        await CacheService.set(cacheKey, user, 300); // 5 minutes
      }

      return user;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      throw error;
    }
  }

  static async updateRefreshToken(userId: string, token: string): Promise<void> {
    try {
      await db.refreshToken.create({
        data: {
          token,
          userId,
        },
      });
    } catch (error) {
      console.error('Error updating refresh token:', error);
      throw error;
    }
  }

  static async revokeRefreshToken(token: string): Promise<void> {
    try {
      await db.refreshToken.updateMany({
        where: { token },
        data: { revoked: true },
      });
    } catch (error) {
      console.error('Error revoking refresh token:', error);
      throw error;
    }
  }
}