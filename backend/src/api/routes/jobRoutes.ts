import { Router } from 'express';
import {
  createJob,
  getAllJobs,
  getJobById,
  updateJob,
  deleteJob,
  getMyJobs
} from '../controllers/JobController';
import { authenticate } from '../middlewares/AuthMiddleware';
import { authorize } from '../middlewares/RoleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Public routes
router.get('/', getAllJobs);
router.get('/:jobId', getJobById);

// Protected routes - Employers only
router.post('/', authenticate, authorize([Role.EMPLOYER]), createJob);
router.patch('/:jobId', authenticate, authorize([Role.EMPLOYER]), updateJob);
router.delete('/:jobId', authenticate, authorize([Role.EMPLOYER]), deleteJob);

// Protected routes - Authenticated users
router.get('/employer/my-jobs', authenticate, authorize([Role.EMPLOYER]), getMyJobs);

export default router;