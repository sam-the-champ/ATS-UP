import { Worker, Queue } from 'bullmq';
import { db } from '../../../config/db';
import { AIService } from '../../../utils/AIService';
import { ApplicationRepository } from '../repos/ApplicationRepository';

const redis = require('../../../core/cache/RedisService').CacheService.getRedisClient();

// Create queue instance
export const scoringQueue = new Queue('scoring-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 50,
    removeOnFail: 20,
  },
});

// This worker processes the scoring queue
export const scoringWorker = new Worker(
  'scoring-queue',
  async (job) => {
    const {
      applicationId,
      resumeUrl,
      jobDescription,
    } = job.data;

    console.log(
      `Scoring application ${applicationId}...`
    );

    try {
      // TODO: Extract text from resume PDF
      // For now, using placeholder text
      const resumeText = `
        Experienced software engineer with 5+ years in full-stack development.
        Proficient in Node.js, React, TypeScript, and cloud technologies.
        Strong background in building scalable web applications.
        Experience with databases, APIs, and modern development practices.
      `;

      // Call Gemini AI for scoring
      const aiScore = await AIService.scoreCandidate(
        resumeText,
        jobDescription
      );

      // Update application with AI score
      await ApplicationRepository.updateAiScore(
        applicationId,
        aiScore
      );

      console.log(
        `Application ${applicationId} scored: ${aiScore}`
      );
    } catch (error) {
      console.error(`Error scoring application ${applicationId}:`, error);

      // Update status to failed
      await db.application.update({
        where: { id: applicationId },
        data: { status: 'FAILED' },
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 2,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);