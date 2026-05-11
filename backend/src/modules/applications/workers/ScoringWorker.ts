import { Worker } from 'bullmq';
import { db } from '../../../config/db';
import { CacheService } from '../../../core/cache/RedisService';

const redis = CacheService.getRedisClient();

// This worker processes the scoring queue
export const scoringWorker = new Worker(
  'scoring-queue',
  async (job) => {
    const {
      applicationId,
      resumeText,
      jobDescription,
    } = job.data;

    console.log(
      `Scoring application ${applicationId}...`
    );

    try {
      // TODO:
      // Replace this mock logic with Gemini/OpenAI scoring later

      const mockScore =
        Math.floor(Math.random() * 100);

      // Update application with AI score
      await db.application.update({
        where: {
          id: applicationId,
        },

        data: {
          aiScore: mockScore,
          status: 'SCORED',
        },
      });

      console.log(
        `Application ${applicationId} scored: ${mockScore}`
      );
    } catch (error) {
      console.error(`Error scoring application ${applicationId}:`, error);
      throw error;
    }
  },
  {
    connection: redis,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
    },
  }
);