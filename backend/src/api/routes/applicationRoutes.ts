import { Router } from 'express';
import {
  applyToJob,
  getApplicationsForJob,
  getMyApplications,
  getApplicationById,
  getPresignedUrl
} from '../controllers/ApplicationController';
import { authenticate } from '../middlewares/AuthMiddleware';
import { authorize } from '../middlewares/RoleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Protected routes - Candidates only
router.post('/', authenticate, authorize([Role.CANDIDATE]), applyToJob);
router.get('/candidate/my-applications', authenticate, authorize([Role.CANDIDATE]), getMyApplications);

// Protected routes - Employers only
router.get('/job/:jobId', authenticate, authorize([Role.EMPLOYER]), getApplicationsForJob);

// Protected routes - Authenticated users (role-based access in controller)
router.get('/:applicationId', authenticate, getApplicationById);

// Utility routes - Authenticated users
router.get('/upload/presigned-url', authenticate, getPresignedUrl);

export default router;