import { Request, Response } from 'express';
import { AuthService } from '../../modules/users/services/AuthService';
import { PasswordUtils } from '../../utils/PasswordUtils';
import { db } from '../../config/db';

export const register = async (req: Request, res: Response) => {
  try {

    const { email, password, role } = req.body;

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({
        message: 'User already exists',
      });
    }

    // Create user
    const user = await AuthService.register(
      email,
      password,
      role
    );

    return res.status(201).json({
      message: 'User created successfully',
      userId: user.id,
    });

  } catch (error) {

    console.error('Registration error:', error);

    return res.status(500).json({
      error: 'Registration failed',
    });
  }
};

export const login = async (req: Request, res: Response) => {

  try {

    const { email, password } = req.body;

    // Find user
    const user = await db.user.findUnique({
      where: { email },
    });

    if (
      !user ||
      !(await PasswordUtils.compare(password, user.password))
    ) {
      return res.status(401).json({
        message: 'Invalid credentials',
      });
    }

    // Generate tokens
    const accessToken =
      AuthService.generateAccessToken(
        user.id,
        user.role
      );

    const refreshToken =
      AuthService.generateRefreshToken(user.id);

    // Save refresh token
    await db.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
      },
    });

    // Store refresh token securely
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
      accessToken,
      role: user.role,
    });

  } catch (error) {

    console.error('Login error:', error);

    return res.status(500).json({
      error: 'Login failed',
    });
  }
};