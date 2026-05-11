"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobRepository = void 0;
const client_1 = require("@prisma/client");
const db_1 = require("../../../config/db");
const RedisService_1 = require("../../../core/cache/RedisService");
// =========================
// REPOSITORY
// =========================
class JobRepository {
    // =========================
    // CREATE JOB
    // =========================
    static async create(data) {
        try {
            const job = await db_1.db.job.create({
                data,
            });
            // Invalidate cache
            await RedisService_1.CacheService.invalidate('jobs:open:all');
            return job;
        }
        catch (error) {
            console.error('Error creating job:', error);
            throw error;
        }
    }
    // =========================
    // FIND ALL OPEN JOBS
    // =========================
    static async findAllOpen() {
        try {
            const cacheKey = 'jobs:open:all';
            // Try cache first
            const cachedJobs = await RedisService_1.CacheService.get(cacheKey);
            if (cachedJobs) {
                return cachedJobs;
            }
            // Query database
            const jobs = await db_1.db.job.findMany({
                where: {
                    status: client_1.JobStatus.OPEN,
                },
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // Cache result
            await RedisService_1.CacheService.set(cacheKey, jobs, 60);
            return jobs;
        }
        catch (error) {
            console.error('Error fetching open jobs:', error);
            throw error;
        }
    }
    // =========================
    // FIND JOB BY ID
    // =========================
    static async findById(id) {
        try {
            const cacheKey = `job:id:${id}`;
            // Try cache first
            const cachedJob = await RedisService_1.CacheService.get(cacheKey);
            if (cachedJob) {
                return cachedJob;
            }
            // Query database
            const job = await db_1.db.job.findUnique({
                where: {
                    id,
                },
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
            });
            // Cache result
            if (job) {
                await RedisService_1.CacheService.set(cacheKey, job, 300);
            }
            return job;
        }
        catch (error) {
            console.error('Error finding job by ID:', error);
            throw error;
        }
    }
    // =========================
    // PAGINATED JOBS
    // =========================
    static async findPaged(limit, cursor) {
        try {
            const cacheKey = `jobs:paged:${limit}:${cursor || 'first'}`;
            // Try cache first
            const cachedJobs = await RedisService_1.CacheService.get(cacheKey);
            if (cachedJobs) {
                return cachedJobs;
            }
            const jobs = await db_1.db.job.findMany({
                take: limit,
                skip: cursor ? 1 : 0,
                cursor: cursor
                    ? { id: cursor }
                    : undefined,
                where: {
                    status: client_1.JobStatus.OPEN,
                },
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // Cache paginated result
            await RedisService_1.CacheService.set(cacheKey, jobs, 60);
            return jobs;
        }
        catch (error) {
            console.error('Error fetching paged jobs:', error);
            throw error;
        }
    }
    // =========================
    // UPDATE JOB STATUS
    // =========================
    static async updateStatus(id, status) {
        try {
            const updatedJob = await db_1.db.job.update({
                where: {
                    id,
                },
                data: {
                    status,
                },
            });
            // Invalidate caches
            await RedisService_1.CacheService.invalidate(`job:id:${id}`);
            await RedisService_1.CacheService.invalidate('jobs:open:all');
            return updatedJob;
        }
        catch (error) {
            console.error('Error updating job status:', error);
            throw error;
        }
    }
    // =========================
    // UPDATE JOB
    // =========================
    static async update(id, data) {
        try {
            const updatedJob = await db_1.db.job.update({
                where: {
                    id,
                },
                data,
            });
            // Invalidate caches
            await RedisService_1.CacheService.invalidate(`job:id:${id}`);
            await RedisService_1.CacheService.invalidate('jobs:open:all');
            return updatedJob;
        }
        catch (error) {
            console.error('Error updating job:', error);
            throw error;
        }
    }
    // =========================
    // DELETE JOB
    // =========================
    static async delete(id) {
        try {
            await db_1.db.job.delete({
                where: {
                    id,
                },
            });
            // Invalidate caches
            await RedisService_1.CacheService.invalidate(`job:id:${id}`);
            await RedisService_1.CacheService.invalidate('jobs:open:all');
        }
        catch (error) {
            console.error('Error deleting job:', error);
            throw error;
        }
    }
    // =========================
    // FIND JOBS BY EMPLOYER
    // =========================
    static async findByEmployerId(employerId) {
        try {
            const cacheKey = `jobs:employer:${employerId}`;
            // Try cache first
            const cachedJobs = await RedisService_1.CacheService.get(cacheKey);
            if (cachedJobs) {
                return cachedJobs;
            }
            // Query database
            const jobs = await db_1.db.job.findMany({
                where: {
                    employerId,
                },
                include: {
                    employer: {
                        select: {
                            id: true,
                            email: true,
                        },
                    },
                    _count: {
                        select: {
                            applications: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            });
            // Cache result
            await RedisService_1.CacheService.set(cacheKey, jobs, 300);
            return jobs;
        }
        catch (error) {
            console.error('Error finding jobs by employer ID:', error);
            throw error;
        }
    }
}
exports.JobRepository = JobRepository;
