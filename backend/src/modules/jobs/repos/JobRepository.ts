import {
  Job,
  JobStatus,
} from '@prisma/client';

import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

export class JobRepository {

  static async create(data: {
    title: string;
    description: string;
    location: string;
    employerId: string;
  }): Promise<Job> {

    try {

      const job = await db.job.create({
        data,
      });

      // Clear stale cache
      await CacheService.invalidate(
        'jobs:open:all'
      );

      return job;

    } catch (error) {

      console.error(
        'Error creating job:',
        error
      );

      throw error;
    }
  }

  static async findAllOpen(): Promise<Job[]> {

    try {

      const cacheKey = 'jobs:open:all';

      // Try cache first
      const cachedJobs =
        await CacheService.get(cacheKey);

      if (cachedJobs) {
        return cachedJobs;
      }

      // Query database
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
      await CacheService.set(
        cacheKey,
        jobs,
        60
      );

      return jobs;

    } catch (error) {

      console.error(
        'Error fetching open jobs:',
        error
      );

      throw error;
    }
  }

  static async findById(
    id: string
  ): Promise<Job | null> {

    try {

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

          _count: {
            select: {
              applications: true,
            },
          },
        },
      });

    } catch (error) {

      console.error(
        'Error fetching job by ID:',
        error
      );

      throw error;
    }
  }

  static async findPaged(
    limit: number,
    cursor?: string
  ): Promise<Job[]> {

    try {

      const cacheKey =
        `jobs:paged:${limit}:${cursor || 'first'}`;

      // Try paginated cache
      const cachedJobs =
        await CacheService.get(cacheKey);

      if (cachedJobs) {
        return cachedJobs;
      }

      const jobs = await db.job.findMany({

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
      await CacheService.set(
        cacheKey,
        jobs,
        60
      );

      return jobs;

    } catch (error) {

      console.error(
        'Error fetching paged jobs:',
        error
      );

      throw error;
    }
  }

  static async updateStatus(
    jobId: string,
    status: JobStatus
  ): Promise<Job> {

    try {

      const updatedJob =
        await db.job.update({

          where: {
            id: jobId,
          },

          data: {
            status,
          },
        });

      // Invalidate stale cache
      await CacheService.invalidate(
        'jobs:open:all'
      );

      return updatedJob;

    } catch (error) {

      console.error(
        'Error updating job status:',
        error
      );

      throw error;
    }
  }

  static async delete(
    jobId: string
  ): Promise<Job> {

    try {

      const deletedJob =
        await db.job.delete({

          where: {
            id: jobId,
          },
        });

      // Invalidate stale cache
      await CacheService.invalidate(
        'jobs:open:all'
      );

      return deletedJob;

    } catch (error) {

      console.error(
        'Error deleting job:',
        error
      );

      throw error;
    }
  }
}