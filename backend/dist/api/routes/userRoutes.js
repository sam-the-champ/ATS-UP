"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthMiddleware_1 = require("../middlewares/AuthMiddleware");
const UserRepository_1 = require("../../modules/users/repos/UserRepository");
const router = (0, express_1.Router)();
// Protected route: Get authenticated user profile
router.get('/profile', AuthMiddleware_1.authenticate, async (req, res) => {
    try {
        const userId = req.user.userId;
        const user = await UserRepository_1.UserRepository.findById(userId);
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
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            error: error.message || 'Failed to fetch profile'
        });
    }
});
exports.default = router;
