import { Request, Response } from 'express';
import { ApplicationService } from '../../modules/applications/services/ApplicationService';

export const applyToJob = async (req: Request, res: Response) => {
  try {
    const { jobId, resumeUrl } = req.body;
    const candidateId = req.user!.userId;

    const application = await ApplicationService.apply(candidateId, jobId, resumeUrl);

    // Return 202 Accepted (Standard for async tasks)
    res.status(202).json({
      message: "Application submitted and is being processed by AI",
      applicationId: application.id
    });
  } catch (error) {
    res.status(500).json({ error: "Application failed" });
  }
};