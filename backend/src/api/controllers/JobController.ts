import { Request, Response } from 'express';
import { JobRepository } from '../../modules/jobs/repos/JobRepository';

export const createJob = async (req: Request, res: Response) => {
  try {
    const { title, description, location } = req.body;
    
    // req.user was populated by our authenticate middleware
    const employerId = req.user!.userId; 

    const job = await JobRepository.create({
      title,
      description,
      location,
      employerId
    });

    res.status(201).json(job);
  } catch (error) {
    res.status(500).json({ error: "Failed to create job" });
  }
};

export const getAllJobs = async (req: Request, res: Response) => {
  const jobs = await JobRepository.findAllOpen();
  res.json(jobs);
};