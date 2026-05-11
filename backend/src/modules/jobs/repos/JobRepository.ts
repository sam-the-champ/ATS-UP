import { JobStatus } from '@prisma/client';
import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

export class JobRepository {

  static async create(data: {
    title: string;
    description: string;
    location: string;
    employerId: string;
  }) {

    const job = await db.job.create({
      data,
    });

    // Clear stale cache after creating a new job
    await CacheService.invalidate('jobs:open:all');

    return job;
  }

  static async findAllOpen() {

    const cacheKey = 'jobs:open:all';

    // 1. Try Redis cache first
    const cachedJobs =
      await CacheService.get(cacheKey);

    if (cachedJobs) {
      return cachedJobs;
    }

    // 2. Query database if cache miss
    const jobs = await db.job.findMany({

      where: {
        status: JobStatus.OPEN,
      },

      include: {
        employer: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });

    // 3. Store in cache for 60 seconds
    await CacheService.set(
      cacheKey,
      jobs,
      60
    );

    return jobs;
  }

  static async findById(id: string) {

    return await db.job.findUnique({

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

        applications: true,
      },
    });
  }

  static async findPaged(
    limit: number,
    cursor?: string
  ) {

    return await db.job.findMany({

      take: limit,

      skip: cursor ? 1 : 0,

      cursor: cursor
        ? { id: cursor }
        : undefined,

      where: {
        status: JobStatus.OPEN,
      },

      include: {
        employer: {
          select: {
            id: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  static async updateStatus(
    jobId: string,
    status: JobStatus
  ) {

    const updatedJob =
      await db.job.update({

        where: {
          id: jobId,
        },

        data: {
          status,
        },
      });

    // Invalidate cache after status update
    await CacheService.invalidate('jobs:open:all');

    return updatedJob;
  }

  static async delete(jobId: string) {

    const deletedJob =
      await db.job.delete({

        where: {
          id: jobId,
        },
      });

    // Invalidate cache after deletion
    await CacheService.invalidate('jobs:open:all');

    return deletedJob;
  }
}