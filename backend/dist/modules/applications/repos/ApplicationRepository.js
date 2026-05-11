"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationRepository = void 0;
const db_1 = require("../../../config/db");
const RedisService_1 = require("../../../core/cache/RedisService");
class ApplicationRepository {
    static async create(data) {
        try {
            const application = await db_1.db.application.create({
                data: {
                    ...data,
                    status: 'PENDING',
                },
            });
            // Clear related caches
            await RedisService_1.CacheService.invalidate(`applications:job:${data.jobId}`);
            await RedisService_1.CacheService.invalidate(`applications:candidate:${data.candidateId}`);
            return application;
        }
        catch (error) {
            console.error('Error creating application:', error);
            throw error;
        }
    }
    static async findById(id) {
        try {
            const cacheKey = `application:id:${id}`;
            // Try cache first
            const cachedApplication = await RedisService_1.CacheService.get(cacheKey);
            if (cachedApplication) {
                return cachedApplication;
            }
            // Query database
            const application = await db_1.db.application.findUnique({
                where: { id },
                include: {
                    job: true,
                    candidate: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
            });
            // Cache result
            if (application) {
                await RedisService_1.CacheService.set(cacheKey, application, 300); // 5 minutes
            }
            return application;
        }
        catch (error) {
            console.error('Error finding application by ID:', error);
            throw error;
        }
    }
    static async findByJobId(jobId) {
        try {
            const cacheKey = `applications:job:${jobId}`;
            // Try cache first
            const cachedApplications = await RedisService_1.CacheService.get(cacheKey);
            if (cachedApplications) {
                return cachedApplications;
            }
            // Query database
            const applications = await db_1.db.application.findMany({
                where: { jobId },
                include: {
                    candidate: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                },
                orderBy: {
                    aiScore: 'desc', // Highest scores first
                },
            });
            // Cache result
            await RedisService_1.CacheService.set(cacheKey, applications, 300); // 5 minutes
            return applications;
        }
        catch (error) {
            console.error('Error finding applications by job ID:', error);
            throw error;
        }
    }
    static async findByCandidateId(candidateId) {
        try {
            const cacheKey = `applications:candidate:${candidateId}`;
            // Try cache first
            const cachedApplications = await RedisService_1.CacheService.get(cacheKey);
            if (cachedApplications) {
                return cachedApplications;
            }
            // Query database
            const applications = await db_1.db.application.findMany({
                where: { candidateId },
                include: {
                    job: {
                        select: {
                            id: true,
                            title: true,
                            location: true,
                            status: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // Cache result
            await RedisService_1.CacheService.set(cacheKey, applications, 300); // 5 minutes
            return applications;
        }
        catch (error) {
            console.error('Error finding applications by candidate ID:', error);
            throw error;
        }
    }
    static async updateAiScore(id, aiScore) {
        try {
            const application = await db_1.db.application.update({
                where: { id },
                data: {
                    aiScore,
                    status: 'COMPLETED',
                },
            });
            // Clear related caches
            await RedisService_1.CacheService.invalidate(`application:id:${id}`);
            await RedisService_1.CacheService.invalidate(`applications:job:${application.jobId}`);
            await RedisService_1.CacheService.invalidate(`applications:candidate:${application.candidateId}`);
            return application;
        }
        catch (error) {
            console.error('Error updating AI score:', error);
            throw error;
        }
    }
}
exports.ApplicationRepository = ApplicationRepository;
