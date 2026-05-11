import { db } from '../../../config/db';
import { Queue } from 'bullmq';

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

    const application = await db.application.create({
      data: {
        candidateId,
        jobId,
        resumeUrl,
        status: "PROCESSING",
      },

      include: {
        job: true,
      },
    });

    await scoringQueue.add('analyze-resume', {
      applicationId: application.id,
      resumeText: "Extracted text from PDF...",
      jobDescription: application.job.description,
    });

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

    const uploadUrl = await getSignedUrl(
      s3,
      command,
      { expiresIn: 300 }
    );

    return {
      uploadUrl,
      key,

      // safer approach than hardcoding S3 URL
      fileUrl: `https://${process.env.AWS_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`,
    };
  }
}