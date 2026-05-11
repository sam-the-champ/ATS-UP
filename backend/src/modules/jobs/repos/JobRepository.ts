import {
  Job,
  JobStatus,
  Prisma,
} from '@prisma/client';

import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

// =========================
// TYPES
// =========================
type JobWithRelations =
  Prisma.JobGetPayload<{
    include: {
      employer: {
        select: {
          id: true;
          email: true;
        };
      };

      _count: {
        select: {
          applications: true;
        };
      };
    };
  }>;

// =========================
// REPOSITORY
// =========================
export class JobRepository {

  // =========================
  // CREATE JOB
  // =========================
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

      // Invalidate cache
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

  // =========================
  // FIND ALL OPEN JOBS
  // =========================
  static async findAllOpen():
    Promise<JobWithRelations[]> {

    try {

      const cacheKey =
        'jobs:open:all';

      // Try cache first
      const cachedJobs =
        await CacheService.get(cacheKey);

      if (cachedJobs) {
        return cachedJobs;
      }

      // Query database
      const jobs =
        await db.job.findMany({

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

  // =========================
  // FIND JOB BY ID
  // =========================
  static async findById(
    id: string
  ): Promise<JobWithRelations | null> {

    try {

      const cacheKey =
        `job:id:${id}`;

      // Try cache first
      const cachedJob =
        await CacheService.get(cacheKey);

      if (cachedJob) {
        return cachedJob;
      }

      // Query database
      const job =
        await db.job.findUnique({

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

        await CacheService.set(
          cacheKey,
          job,
          300
        );
      }

      return job;

    } catch (error) {

      console.error(
        'Error finding job by ID:',
        error
      );

      throw error;
    }
  }

  // =========================
  // PAGINATED JOBS
  // =========================
  static async findPaged(
    limit: number,
    cursor?: string
  ): Promise<JobWithRelations[]> {

    try {

      const cacheKey =
        `jobs:paged:${limit}:${cursor || 'first'}`;

      // Try cache first
      const cachedJobs =
        await CacheService.get(cacheKey);

      if (cachedJobs) {
        return cachedJobs;
      }

      const jobs =
        await db.job.findMany({

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

  // =========================
  // UPDATE JOB STATUS
  // =========================
  static async updateStatus(
    id: string,
    status: JobStatus
  ): Promise<Job> {

    try {

      const updatedJob =
        await db.job.update({

          where: {
            id,
          },

          data: {
            status,
          },
        });

      // Invalidate caches
      await CacheService.invalidate(
        `job:id:${id}`
      );

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

  // =========================
  // UPDATE JOB
  // =========================
  static async update(
    id: string,
    data: Prisma.JobUpdateInput
  ): Promise<Job> {

    try {

      const updatedJob =
        await db.job.update({

          where: {
            id,
          },

          data,
        });

      // Invalidate caches
      await CacheService.invalidate(
        `job:id:${id}`
      );

      await CacheService.invalidate(
        'jobs:open:all'
      );

      return updatedJob;

    } catch (error) {

      console.error(
        'Error updating job:',
        error
      );

      throw error;
    }
  }

  // =========================
  // DELETE JOB
  // =========================
  static async delete(
    id: string
  ): Promise<void> {

    try {

      await db.job.delete({

        where: {
          id,
        },
      });

      // Invalidate caches
      await CacheService.invalidate(
        `job:id:${id}`
      );

      await CacheService.invalidate(
        'jobs:open:all'
      );

    } catch (error) {

      console.error(
        'Error deleting job:',
        error
      );

      throw error;
    }
  }

  // =========================
  // FIND JOBS BY EMPLOYER
  // =========================
  static async findByEmployerId(
    employerId: string
  ): Promise<JobWithRelations[]> {

    try {

      const cacheKey =
        `jobs:employer:${employerId}`;

      // Try cache first
      const cachedJobs =
        await CacheService.get(cacheKey);

      if (cachedJobs) {
        return cachedJobs;
      }

      // Query database
      const jobs =
        await db.job.findMany({

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
      await CacheService.set(
        cacheKey,
        jobs,
        300
      );

      return jobs;

    } catch (error) {

      console.error(
        'Error finding jobs by employer ID:',
        error
      );

      throw error;
    }
  }
}