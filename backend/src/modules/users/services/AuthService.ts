import { Role } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { PasswordUtils } from '../../../utils/PasswordUtils';
import { db } from '../../../config/db';

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

  static async register(
    email: string,
    pass: string,
    role: Role
  ) {

    const hashedPassword = await PasswordUtils.hash(pass);

    return await db.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    });
  }
}