"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApplicationService = void 0;
const db_1 = require("../../../config/db");
const bullmq_1 = require("bullmq");
const ApplicationRepository_1 = require("../repos/ApplicationRepository");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
// =========================
// REDIS / BULLMQ QUEUE
// =========================
const scoringQueue = new bullmq_1.Queue('scoring-queue', {
    connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: Number(process.env.REDIS_PORT) || 6379,
    },
});
// =========================
// S3 CLIENT
// =========================
const s3 = new client_s3_1.S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});
// =========================
// SERVICE LAYER
// =========================
class ApplicationService {
    // =========================
    // APPLY FOR JOB
    // =========================
    static async apply(candidateId, jobId, resumeUrl) {
        // Verify job exists and is open
        const job = await db_1.db.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.status !== 'OPEN') {
            throw new Error('Job not found or not accepting applications');
        }
        // Check if candidate already applied
        const existingApplication = await db_1.db.application.findFirst({
            where: {
                candidateId,
                jobId,
            },
        });
        if (existingApplication) {
            throw new Error('You have already applied for this job');
        }
        const application = await ApplicationRepository_1.ApplicationRepository.create({
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
    static async getApplicationsForJob(jobId, employerId) {
        // Verify employer owns the job
        const job = await db_1.db.job.findUnique({
            where: { id: jobId },
        });
        if (!job || job.employerId !== employerId) {
            throw new Error('Unauthorized to view applications for this job');
        }
        return await ApplicationRepository_1.ApplicationRepository.findByJobId(jobId);
    }
    // =========================
    // GET APPLICATIONS BY CANDIDATE
    // =========================
    static async getApplicationsByCandidate(candidateId) {
        return await ApplicationRepository_1.ApplicationRepository.findByCandidateId(candidateId);
    }
    // =========================
    // GET APPLICATION BY ID
    // =========================
    static async getApplicationById(applicationId, userId, userRole) {
        const application = await ApplicationRepository_1.ApplicationRepository.findById(applicationId);
        if (!application) {
            throw new Error('Application not found');
        }
        // Check permissions
        if (userRole === 'CANDIDATE' && application.candidateId !== userId) {
            throw new Error('Unauthorized to view this application');
        }
        if (userRole === 'EMPLOYER') {
            const job = await db_1.db.job.findUnique({
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
    static async getPresignedUrl(fileName, fileType) {
        const key = `resumes/${Date.now()}-${fileName}`;
        const command = new client_s3_1.PutObjectCommand({
            Bucket: process.env.AWS_BUCKET_NAME,
            Key: key,
            ContentType: fileType,
        });
        const signedUrl = await (0, s3_request_presigner_1.getSignedUrl)(s3, command, {
            expiresIn: 3600, // 1 hour
        });
        return {
            signedUrl,
            key,
        };
    }
}
exports.ApplicationService = ApplicationService;
