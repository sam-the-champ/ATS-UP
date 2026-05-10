import { Request, Response } from 'express';
import { AuthService } from '../../modules/users/services/AuthService';
import { PrismaClient } from '@prisma/client';
import { PasswordUtils } from '../../utils/PasswordUtils';

const prisma = new PrismaClient();

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, role } = req.body;
    
    // 1. Check if user exists
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: "User already exists" });

    // 2. Create User
    const user = await AuthService.register(email, password, role);
    
    res.status(201).json({ message: "User created", userId: user.id });
  } catch (error) {
    res.status(500).json({ error: "Registration failed" });
  }
};

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await PasswordUtils.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  const accessToken = AuthService.generateAccessToken(user.id, user.role);
  const refreshToken = AuthService.generateRefreshToken(user.id);

  // Store Refresh Token in DB for rotation/revocation
  await prisma.refreshToken.create({
    data: { token: refreshToken, userId: user.id }
  });

  // Send Refresh Token in a Secure Cookie, Access Token in JSON
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.json({ accessToken, role: user.role });
};