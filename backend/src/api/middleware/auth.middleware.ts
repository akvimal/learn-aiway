import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../../services/auth/jwt.service';
import { UnauthorizedError } from '../../utils/errors.util';
import { AuthenticatedRequest, UserRole } from '../../types';

export class AuthMiddleware {
  authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      // Get token from Authorization header
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedError('No token provided');
      }

      const token = authHeader.substring(7);

      // Verify token
      const payload = jwtService.verifyAccessToken(token);

      // Attach user to request
      req.user = payload;

      next();
    } catch (error) {
      next(error);
    }
  }

  optional(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
      const authHeader = req.headers.authorization;

      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        const payload = jwtService.verifyAccessToken(token);
        req.user = payload;
      }

      next();
    } catch (error) {
      // If token is invalid, just proceed without user
      next();
    }
  }
}

export const authMiddleware = new AuthMiddleware();
