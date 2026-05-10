import { Worker } from 'bullmq';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This worker processes the 'scoring-queue'
const scoringWorker = new Worker('scoring-queue', async (job) => {
  const { applicationId, resumeText, jobDescription } = job.data;

  console.log(`Scoring application ${applicationId}...`);

  // SIMULATION: In production, you'd call OpenAI here
  // const score = await OpenAI.analyze(resumeText, jobDescription);
  const mockScore = Math.floor(Math.random() * 100);

  // Update the database with the AI result
  await prisma.application.update({
    where: { id: applicationId },
    data: { 
      aiScore: mockScore,
      status: "SCORED" 
    }
  });

  console.log(`Application ${applicationId} scored: ${mockScore}`);
}, {
  connection: { host: 'localhost', port: 6379 }
});