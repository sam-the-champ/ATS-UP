import { Router } from 'express';
import { applyToJob } from '../controllers/ApplicationController';
import { authenticate } from '../middlewares/AuthMiddleware';
import { authorize } from '../middlewares/RoleMiddleware';
import { Role } from '@prisma/client';

const router = Router();

router.post('/', authenticate, authorize([Role.CANDIDATE]), applyToJob);

export default router;