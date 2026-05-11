import { Worker } from 'bullmq';
import { db } from '../../../config/db';

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
  },

  {
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }
);