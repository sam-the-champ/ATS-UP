"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const JobRepository_1 = require("../repos/JobRepository");
class JobService {
    static async createJob(employerId, jobData) {
        try {
            return await JobRepository_1.JobRepository.create({
                ...jobData,
                employerId,
            });
        }
        catch (error) {
            console.error('Error in JobService.createJob:', error);
            throw new Error('Failed to create job');
        }
    }
    static async getAllJobs() {
        try {
            return await JobRepository_1.JobRepository.findAllOpen();
        }
        catch (error) {
            console.error('Error in JobService.getAllJobs:', error);
            throw new Error('Failed to fetch jobs');
        }
    }
    static async getJobById(jobId) {
        try {
            return await JobRepository_1.JobRepository.findById(jobId);
        }
        catch (error) {
            console.error('Error in JobService.getJobById:', error);
            throw new Error('Failed to fetch job');
        }
    }
    static async updateJob(jobId, employerId, updateData) {
        try {
            // First check if job exists and belongs to employer
            const job = await JobRepository_1.JobRepository.findById(jobId);
            if (!job) {
                throw new Error('Job not found');
            }
            if (job.employerId !== employerId) {
                throw new Error('Unauthorized to update this job');
            }
            return await JobRepository_1.JobRepository.update(jobId, updateData);
        }
        catch (error) {
            console.error('Error in JobService.updateJob:', error);
            throw error;
        }
    }
    static async deleteJob(jobId, employerId) {
        try {
            // First check if job exists and belongs to employer
            const job = await JobRepository_1.JobRepository.findById(jobId);
            if (!job) {
                throw new Error('Job not found');
            }
            if (job.employerId !== employerId) {
                throw new Error('Unauthorized to delete this job');
            }
            await JobRepository_1.JobRepository.delete(jobId);
        }
        catch (error) {
            console.error('Error in JobService.deleteJob:', error);
            throw error;
        }
    }
    static async getJobsByEmployer(employerId) {
        try {
            return await JobRepository_1.JobRepository.findByEmployerId(employerId);
        }
        catch (error) {
            console.error('Error in JobService.getJobsByEmployer:', error);
            throw new Error('Failed to fetch employer jobs');
        }
    }
}
exports.JobService = JobService;
