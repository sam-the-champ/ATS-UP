import { Request, Response } from 'express';
import { ApplicationService } from '../../modules/applications/services/ApplicationService';
import { CreateApplicationDto } from '../../modules/applications/dto';

export const applyToJob = async (req: Request, res: Response) => {
  try {
    const candidateId = req.user!.userId;
    const applicationData = CreateApplicationDto.parse(req.body);

    const application = await ApplicationService.apply(
      candidateId,
      applicationData.jobId,
      applicationData.resumeUrl
    );

    // Return 202 Accepted (Standard for async tasks)
    res.status(202).json({
      message: "Application submitted and is being processed by AI",
      applicationId: application.id,
      status: application.status,
    });
  } catch (error: any) {
    console.error('Apply to job error:', error);

    if (error.message.includes('already applied')) {
      return res.status(409).json({ error: error.message });
    }

    if (error.message.includes('not found') || error.message.includes('not accepting')) {
      return res.status(404).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'Application failed'
    });
  }
};

export const getApplicationsForJob = async (req: Request, res: Response) => {
  try {
    const { jobId } = req.params;
    const employerId = req.user!.userId;

    const applications = await ApplicationService.getApplicationsForJob(String(jobId), employerId);

    res.json({
      data: applications,
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Get applications for job error:', error);

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'Failed to fetch applications'
    });
  }
};

export const getMyApplications = async (req: Request, res: Response) => {
  try {
    const candidateId = req.user!.userId;

    const applications = await ApplicationService.getApplicationsByCandidate(candidateId);

    res.json({
      data: applications,
      count: applications.length,
    });
  } catch (error: any) {
    console.error('Get my applications error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch applications'
    });
  }
};

export const getApplicationById = async (req: Request, res: Response) => {
  try {
    const { applicationId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const application = await ApplicationService.getApplicationById(
      String(applicationId),
      userId,
      userRole
    );

    res.json({ application });
  } catch (error: any) {
    console.error('Get application by ID error:', error);

    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    if (error.message.includes('Unauthorized')) {
      return res.status(403).json({ error: error.message });
    }

    res.status(500).json({
      error: error.message || 'Failed to fetch application'
    });
  }
};

export const getPresignedUrl = async (req: Request, res: Response) => {
  try {
    const { fileName, fileType } = req.query;

    if (!fileName || !fileType) {
      return res.status(400).json({
        error: 'fileName and fileType query parameters are required'
      });
    }

    const result = await ApplicationService.getPresignedUrl(
      fileName as string,
      fileType as string
    );

    res.json({
      signedUrl: result.signedUrl,
      key: result.key,
    });
  } catch (error: any) {
    console.error('Get presigned URL error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate upload URL'
    });
  }
};