import { Job, JobStatus } from '@prisma/client';
import { JobRepository } from '../repos/JobRepository';
import { CreateJobDtoType, UpdateJobDtoType } from '../dto';

export class JobService {
  static async createJob(
    employerId: string,
    jobData: CreateJobDtoType
  ): Promise<Job> {
    try {
      return await JobRepository.create({
        ...jobData,
        employerId,
      });
    } catch (error) {
      console.error('Error in JobService.createJob:', error);
      throw new Error('Failed to create job');
    }
  }

  static async getAllJobs(): Promise<Job[]> {
    try {
      return await JobRepository.findAllOpen();
    } catch (error) {
      console.error('Error in JobService.getAllJobs:', error);
      throw new Error('Failed to fetch jobs');
    }
  }

  static async getJobById(jobId: string): Promise<Job | null> {
    try {
      return await JobRepository.findById(jobId);
    } catch (error) {
      console.error('Error in JobService.getJobById:', error);
      throw new Error('Failed to fetch job');
    }
  }

  static async updateJob(
    jobId: string,
    employerId: string,
    updateData: UpdateJobDtoType
  ): Promise<Job> {
    try {
      // First check if job exists and belongs to employer
      const job = await JobRepository.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.employerId !== employerId) {
        throw new Error('Unauthorized to update this job');
      }

      return await JobRepository.update(jobId, updateData);
    } catch (error) {
      console.error('Error in JobService.updateJob:', error);
      throw error;
    }
  }

  static async deleteJob(jobId: string, employerId: string): Promise<void> {
    try {
      // First check if job exists and belongs to employer
      const job = await JobRepository.findById(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      if (job.employerId !== employerId) {
        throw new Error('Unauthorized to delete this job');
      }

      await JobRepository.delete(jobId);
    } catch (error) {
      console.error('Error in JobService.deleteJob:', error);
      throw error;
    }
  }

  static async getJobsByEmployer(employerId: string): Promise<Job[]> {
    try {
      return await JobRepository.findByEmployerId(employerId);
    } catch (error) {
      console.error('Error in JobService.getJobsByEmployer:', error);
      throw new Error('Failed to fetch employer jobs');
    }
  }
}