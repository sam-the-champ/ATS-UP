import { Request, Response } from 'express';
import { AuthService } from '../../modules/users/services/AuthService';
import { UserRepository } from '../../modules/users/repos/UserRepository';
import { CreateUserDto, LoginDto } from '../../modules/users/dto';
import { PasswordUtils } from '../../utils/PasswordUtils';
import { db } from '../../config/db';

export const register = async (req: Request, res: Response) => {
  try {
    const userData = CreateUserDto.parse(req.body);

    // Check if user already exists
    const existingUser = await UserRepository.findByEmail(userData.email);
    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Create user
    const user = await AuthService.register(
      userData.email,
      userData.password,
      userData.role
    );

    return res.status(201).json({
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });

  } catch (error: any) {
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

export const login = async (req: Request, res: Response) => {
  try {
    const loginData = LoginDto.parse(req.body);

    // Find user
    const user = await UserRepository.findByEmail(loginData.email);
    if (!user || !(await PasswordUtils.compare(loginData.password, user.password))) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken = AuthService.generateAccessToken(user.id, user.role);
    const refreshToken = AuthService.generateRefreshToken(user.id);

    // Save refresh token
    await UserRepository.updateRefreshToken(user.id, refreshToken);

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

  } catch (error: any) {
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

export const refreshToken = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = AuthService.verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Check if token is revoked
    const tokenRecord = await db.refreshToken.findUnique({
      where: { token: refreshToken },
    });

    if (!tokenRecord || tokenRecord.revoked) {
      return res.status(401).json({ message: 'Token revoked' });
    }

    // Generate new tokens
    const user = await UserRepository.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    const newAccessToken = AuthService.generateAccessToken(user.id, user.role);
    const newRefreshToken = AuthService.generateRefreshToken(user.id);

    // Revoke old token and save new one
    await UserRepository.revokeRefreshToken(refreshToken);
    await UserRepository.updateRefreshToken(user.id, newRefreshToken);

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

  } catch (error: any) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

export const logout = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      await UserRepository.revokeRefreshToken(refreshToken);
    }

    // Clear refresh token cookie
    res.clearCookie('refreshToken');

    res.json({ message: 'Logged out successfully' });

  } catch (error: any) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};