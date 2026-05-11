import { db } from '../../../config/db';
import { Queue } from 'bullmq';
import { AIService } from '../../../utils/AIService';
import { ApplicationRepository } from '../repos/ApplicationRepository';

import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

// =========================
// REDIS / BULLMQ QUEUE
// =========================
const scoringQueue = new Queue('scoring-queue', {
  connection: {
    host: process.env.REDIS_HOST || 'localhost',
    port: Number(process.env.REDIS_PORT) || 6379,
  },
});

// =========================
// S3 CLIENT
// =========================
const s3 = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// =========================
// SERVICE LAYER
// =========================
export class ApplicationService {

  // =========================
  // APPLY FOR JOB
  // =========================
  static async apply(
    candidateId: string,
    jobId: string,
    resumeUrl: string
  ) {

    // Verify job exists and is open
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.status !== 'OPEN') {
      throw new Error('Job not found or not accepting applications');
    }

    // Check if candidate already applied
    const existingApplication = await db.application.findFirst({
      where: {
        candidateId,
        jobId,
      },
    });

    if (existingApplication) {
      throw new Error('You have already applied for this job');
    }

    const application = await ApplicationRepository.create({
      candidateId,
      jobId,
      resumeUrl,
    });

    // Queue AI scoring job
    await scoringQueue.add('analyze-resume', {
      applicationId: application.id,
      resumeUrl: application.resumeUrl,
      jobDescription: job.description,
    });

    return application;
  }

  // =========================
  // GET APPLICATIONS FOR JOB (Employer)
  // =========================
  static async getApplicationsForJob(jobId: string, employerId: string) {
    // Verify employer owns the job
    const job = await db.job.findUnique({
      where: { id: jobId },
    });

    if (!job || job.employerId !== employerId) {
      throw new Error('Unauthorized to view applications for this job');
    }

    return await ApplicationRepository.findByJobId(jobId);
  }

  // =========================
  // GET APPLICATIONS BY CANDIDATE
  // =========================
  static async getApplicationsByCandidate(candidateId: string) {
    return await ApplicationRepository.findByCandidateId(candidateId);
  }

  // =========================
  // GET APPLICATION BY ID
  // =========================
  static async getApplicationById(applicationId: string, userId: string, userRole: string) {
    const application = await ApplicationRepository.findById(applicationId);

    if (!application) {
      throw new Error('Application not found');
    }

    // Check permissions
    if (userRole === 'CANDIDATE' && application.candidateId !== userId) {
      throw new Error('Unauthorized to view this application');
    }

    if (userRole === 'EMPLOYER') {
      const job = await db.job.findUnique({
        where: { id: application.jobId },
      });
      if (!job || job.employerId !== userId) {
        throw new Error('Unauthorized to view this application');
      }
    }

    return application;
  }

  // =========================
  // PRESIGNED URL GENERATION
  // =========================
  static async getPresignedUrl(
    fileName: string,
    fileType: string
  ) {

    const key = `resumes/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const signedUrl = await getSignedUrl(s3, command, {
      expiresIn: 3600, // 1 hour
    });

    return {
      signedUrl,
      key,
    };
  }
}