"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refreshToken = exports.login = exports.register = void 0;
const AuthService_1 = require("../../modules/users/services/AuthService");
const UserRepository_1 = require("../../modules/users/repos/UserRepository");
const dto_1 = require("../../modules/users/dto");
const PasswordUtils_1 = require("../../utils/PasswordUtils");
const db_1 = require("../../config/db");
const register = async (req, res) => {
    try {
        const userData = dto_1.CreateUserDto.parse(req.body);
        // Check if user already exists
        const existingUser = await UserRepository_1.UserRepository.findByEmail(userData.email);
        if (existingUser) {
            return res.status(400).json({
                message: 'User already exists',
            });
        }
        // Create user
        const user = await AuthService_1.AuthService.register(userData.email, userData.password, userData.role);
        return res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                createdAt: user.createdAt,
            },
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Invalid input data',
                details: error.errors,
            });
        }
        return res.status(500).json({
            error: 'Registration failed',
        });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const loginData = dto_1.LoginDto.parse(req.body);
        // Find user
        const user = await UserRepository_1.UserRepository.findByEmail(loginData.email);
        if (!user || !(await PasswordUtils_1.PasswordUtils.compare(loginData.password, user.password))) {
            return res.status(401).json({
                message: 'Invalid credentials',
            });
        }
        // Generate tokens
        const accessToken = AuthService_1.AuthService.generateAccessToken(user.id, user.role);
        const refreshToken = AuthService_1.AuthService.generateRefreshToken(user.id);
        // Save refresh token
        await UserRepository_1.UserRepository.updateRefreshToken(user.id, refreshToken);
        // Store refresh token securely
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        return res.status(200).json({
            message: 'Login successful',
            accessToken,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        if (error.name === 'ZodError') {
            return res.status(400).json({
                error: 'Invalid input data',
                details: error.errors,
            });
        }
        return res.status(500).json({
            error: 'Login failed',
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token required' });
        }
        // Verify refresh token
        const decoded = AuthService_1.AuthService.verifyRefreshToken(refreshToken);
        if (!decoded) {
            return res.status(401).json({ message: 'Invalid refresh token' });
        }
        // Check if token is revoked
        const tokenRecord = await db_1.db.refreshToken.findUnique({
            where: { token: refreshToken },
        });
        if (!tokenRecord || tokenRecord.revoked) {
            return res.status(401).json({ message: 'Token revoked' });
        }
        // Generate new tokens
        const user = await UserRepository_1.UserRepository.findById(decoded.userId);
        if (!user) {
            return res.status(401).json({ message: 'User not found' });
        }
        const newAccessToken = AuthService_1.AuthService.generateAccessToken(user.id, user.role);
        const newRefreshToken = AuthService_1.AuthService.generateRefreshToken(user.id);
        // Revoke old token and save new one
        await UserRepository_1.UserRepository.revokeRefreshToken(refreshToken);
        await UserRepository_1.UserRepository.updateRefreshToken(user.id, newRefreshToken);
        // Set new refresh token cookie
        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.json({
            accessToken: newAccessToken,
        });
    }
    catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};
exports.refreshToken = refreshToken;
const logout = async (req, res) => {
    try {
        const { refreshToken } = req.cookies;
        if (refreshToken) {
            await UserRepository_1.UserRepository.revokeRefreshToken(refreshToken);
        }
        // Clear refresh token cookie
        res.clearCookie('refreshToken');
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Logout failed' });
    }
};
exports.logout = logout;
