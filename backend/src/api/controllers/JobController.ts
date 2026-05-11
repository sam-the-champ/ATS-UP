import { Request, Response } from 'express';
import { JobService } from '../../modules/jobs/services/JobService';
import { CreateJobDto, UpdateJobDto } from '../../modules/jobs/dto';

export const createJob = async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.userId;
    const jobData = CreateJobDto.parse(req.body);

    const job = await JobService.createJob(employerId, jobData);

    res.status(201).json({
      message: 'Job created successfully',
      job,
    });
  } catch (error: any) {
    console.error('Create job error:', error);
    res.status(400).json({
      error: error.message || 'Failed to create job'
    });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  try {
    const jobs = await JobService.getAllJobs();
    res.json({
      data: jobs,
      count: jobs.length,
    });
  } catch (error: any) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch jobs'
    });
  }
};

export const getJobById = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const job = await JobService.getJobById(String(jobId));

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error: any) {
    console.error('Get job error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch job'
    });
  }
};

export const updateJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user!.userId;
    const updateData = UpdateJobDto.parse(req.body);

    const job = await JobService.updateJob(String(jobId), employerId, updateData);

    res.json({
      message: 'Job updated successfully',
      job,
    });
  } catch (error: any) {
    console.error('Update job error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'Failed to update job'
    });
  }
};

export const deleteJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user!.userId;

    await JobService.deleteJob(String(jobId), employerId);

    res.json({
      message: 'Job deleted successfully'
    });
  } catch (error: any) {
    console.error('Delete job error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'Failed to delete job'
    });
  }
};

export const getMyJobs = async (req: Request, res: Response) => {
  try {
    const employerId = req.user!.userId;
    const jobs = await JobService.getJobsByEmployer(employerId);

    res.json({
      data: jobs,
      count: jobs.length,
    });
  } catch (error: any) {
    console.error('Get my jobs error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch your jobs'
    });
  }
};