import { Application } from '@prisma/client';
import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

export class ApplicationRepository {
  static async create(data: {
    candidateId: string;
    jobId: string;
    resumeUrl: string;
  }): Promise<Application> {
    try {
      const application = await db.application.create({
        data: {
          ...data,
          status: 'PENDING',
        },
      });

      // Clear related caches
      await CacheService.invalidate(`applications:job:${data.jobId}`);
      await CacheService.invalidate(`applications:candidate:${data.candidateId}`);

      return application;
    } catch (error) {
      console.error('Error creating application:', error);
      throw error;
    }
  }

  static async findById(id: string): Promise<Application | null> {
    try {
      const cacheKey = `application:id:${id}`;

      // Try cache first
      const cachedApplication = await CacheService.get(cacheKey);
      if (cachedApplication) {
        return cachedApplication;
      }

      // Query database
      const application = await db.application.findUnique({
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
        await CacheService.set(cacheKey, application, 300); // 5 minutes
      }

      return application;
    } catch (error) {
      console.error('Error finding application by ID:', error);
      throw error;
    }
  }

  static async findByJobId(jobId: string): Promise<Application[]> {
    try {
      const cacheKey = `applications:job:${jobId}`;

      // Try cache first
      const cachedApplications = await CacheService.get(cacheKey);
      if (cachedApplications) {
        return cachedApplications;
      }

      // Query database
      const applications = await db.application.findMany({
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
      await CacheService.set(cacheKey, applications, 300); // 5 minutes

      return applications;
    } catch (error) {
      console.error('Error finding applications by job ID:', error);
      throw error;
    }
  }

  static async findByCandidateId(candidateId: string): Promise<Application[]> {
    try {
      const cacheKey = `applications:candidate:${candidateId}`;

      // Try cache first
      const cachedApplications = await CacheService.get(cacheKey);
      if (cachedApplications) {
        return cachedApplications;
      }

      // Query database
      const applications = await db.application.findMany({
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
      await CacheService.set(cacheKey, applications, 300); // 5 minutes

      return applications;
    } catch (error) {
      console.error('Error finding applications by candidate ID:', error);
      throw error;
    }
  }

  static async updateAiScore(id: string, aiScore: number): Promise<Application> {
    try {
      const application = await db.application.update({
        where: { id },
        data: {
          aiScore,
          status: 'COMPLETED',
        },
      });

      // Clear related caches
      await CacheService.invalidate(`application:id:${id}`);
      await CacheService.invalidate(`applications:job:${application.jobId}`);
      await CacheService.invalidate(`applications:candidate:${application.candidateId}`);

      return application;
    } catch (error) {
      console.error('Error updating AI score:', error);
      throw error;
    }
  }
}