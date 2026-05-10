import { PrismaClient } from '@prisma/client';
import { Queue } from 'bullmq';

import {
  S3Client,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const prisma = new PrismaClient();

const scoringQueue = new Queue('scoring-queue', {
  connection: {
    host: 'localhost',
    port: 6379
  }
});

const s3 = new S3Client({
  region: process.env.AWS_REGION,

  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export class ApplicationService {

  // =========================
  // APPLY FOR JOB
  // =========================
  static async apply(
    candidateId: string,
    jobId: string,
    resumeUrl: string
  ) {

    // 1. Create application in DB
    const application = await prisma.application.create({
      data: {
        candidateId,
        jobId,
        resumeUrl,
        status: "PROCESSING"
      },

      include: {
        job: true
      }
    });

    // 2. Add resume to AI scoring queue
    await scoringQueue.add('analyze-resume', {
      applicationId: application.id,

      // later you'll extract actual PDF text
      resumeText: "Extracted text from PDF...",

      jobDescription: application.job.description
    });

    return application;
  }

  // =========================
  // GENERATE PRESIGNED URL
  // =========================
  static async getPresignedUrl(
    fileName: string,
    fileType: string
  ) {

    const key = `resumes/${Date.now()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      {
        expiresIn: 60 * 5 // 5 minutes
      }
    );

    return {
      uploadUrl,
      key,
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.amazonaws.com/${key}`
    };
  }
}