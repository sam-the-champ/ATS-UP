import { Router } from 'express';
import { authenticate } from '../middlewares/AuthMiddleware';
import { UserRepository } from '../../modules/users/repos/UserRepository';

const router = Router();

// Protected route: Get authenticated user profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const user = await UserRepository.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user data without sensitive information
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: error.message || 'Failed to fetch profile'
    });
  }
});

export default router;