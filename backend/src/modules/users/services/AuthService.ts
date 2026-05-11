import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PasswordUtils } from '../../../utils/PasswordUtils';
import { UserRepository } from '../repos/UserRepository';

export class AuthService {

  static generateAccessToken(userId: string, role: Role) {
    return jwt.sign(
      { userId, role },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '15m' }
    );
  }

  static generateRefreshToken(userId: string) {
    return jwt.sign(
      { userId },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );
  }

  static verifyRefreshToken(token: string): { userId: string } | null {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET!) as { userId: string };
    } catch (error) {
      return null;
    }
  }

  static async register(
    email: string,
    password: string,
    role: Role
  ) {
    const hashedPassword = await PasswordUtils.hash(password);

    return await UserRepository.create({
      email,
      password: hashedPassword,
      role,
    });
  }

  static async validateCredentials(email: string, password: string) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      return null;
    }

    const isValidPassword = await PasswordUtils.compare(password, user.password);

    if (!isValidPassword) {
      return null;
    }

    return user;
  }
}