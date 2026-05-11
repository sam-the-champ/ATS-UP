"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_1 = require("../../../config/db");
const RedisService_1 = require("../../../core/cache/RedisService");
class UserRepository {
    static async create(data) {
        try {
            const user = await db_1.db.user.create({
                data,
            });
            return user;
        }
        catch (error) {
            console.error('Error creating user:', error);
            throw error;
        }
    }
    static async findByEmail(email) {
        try {
            const cacheKey = `user:email:${email}`;
            // Try cache first
            const cachedUser = await RedisService_1.CacheService.get(cacheKey);
            if (cachedUser) {
                return cachedUser;
            }
            // Query database
            const user = await db_1.db.user.findUnique({
                where: { email },
            });
            // Cache result (short TTL for security)
            if (user) {
                await RedisService_1.CacheService.set(cacheKey, user, 300); // 5 minutes
            }
            return user;
        }
        catch (error) {
            console.error('Error finding user by email:', error);
            throw error;
        }
    }
    static async findById(id) {
        try {
            const cacheKey = `user:id:${id}`;
            // Try cache first
            const cachedUser = await RedisService_1.CacheService.get(cacheKey);
            if (cachedUser) {
                return cachedUser;
            }
            // Query database
            const user = await db_1.db.user.findUnique({
                where: { id },
            });
            // Cache result
            if (user) {
                await RedisService_1.CacheService.set(cacheKey, user, 300); // 5 minutes
            }
            return user;
        }
        catch (error) {
            console.error('Error finding user by ID:', error);
            throw error;
        }
    }
    static async updateRefreshToken(userId, token) {
        try {
            await db_1.db.refreshToken.create({
                data: {
                    token,
                    userId,
                },
            });
        }
        catch (error) {
            console.error('Error updating refresh token:', error);
            throw error;
        }
    }
    static async revokeRefreshToken(token) {
        try {
            await db_1.db.refreshToken.updateMany({
                where: { token },
                data: { revoked: true },
            });
        }
        catch (error) {
            console.error('Error revoking refresh token:', error);
            throw error;
        }
    }
}
exports.UserRepository = UserRepository;
