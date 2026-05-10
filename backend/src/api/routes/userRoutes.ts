import { Router } from 'express';
import { authenticate } from '../middlewares/AuthMiddleware';

const router = Router();

// This route is protected. Only logged-in users can reach it.
router.get('/me', authenticate, (req, res) => {
  res.json({
    message: "Authenticated successfully",
    user: req.user
  });
});

export default router;