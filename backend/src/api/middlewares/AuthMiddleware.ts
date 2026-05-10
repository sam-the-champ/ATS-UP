import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  // 1. Check if the Bearer token exists
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      userId: string;
      role: any;
    };

    // 3. Inject user data into request object
    req.user = decoded;
    
    // 4. Move to the next function/middleware
    next();
  } catch (error) {
    res.status(403).json({ message: "Invalid or expired token." });
  }
};