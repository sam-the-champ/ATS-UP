import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const authorize = (roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Forbidden: This action requires one of the following roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};