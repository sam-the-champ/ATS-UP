import { Router } from 'express';
import { createJob, getAllJobs } from '../controllers/JobController';
import { authenticate } from '../middlewares/AuthMiddleware';
import { authorize } from '../middlewares/RoleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

// Public route: Candidates and Employers can see jobs
router.get('/', getAllJobs);

// Protected route: ONLY Employers can post
router.post('/', authenticate, authorize([Role.EMPLOYER]), createJob);

export default router;