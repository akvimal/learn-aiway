import { Response, NextFunction } from 'express';
import { jwtService } from '../../services/auth/jwt.service';
import { UnauthorizedError, ForbiddenError } from '../../utils/errors.util';
import { AuthenticatedRequest, UserRole } from '../../types';

export class AuthMiddleware {
  authenticate(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
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

  optional(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
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

  /**
   * Middleware to require specific roles
   * Usage: authMiddleware.requireRole(UserRole.ADMIN, UserRole.INSTRUCTOR)
   */
  requireRole(...allowedRoles: UserRole[]) {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        const userRole = req.user.role;

        if (!allowedRoles.includes(userRole)) {
          throw new ForbiddenError(
            `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${userRole}`
          );
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }

  /**
   * Middleware to require admin role
   * Usage: authMiddleware.requireAdmin()
   */
  requireAdmin() {
    return this.requireRole(UserRole.ADMIN);
  }

  /**
   * Middleware to require instructor or admin role
   * Usage: authMiddleware.requireInstructorOrAdmin()
   */
  requireInstructorOrAdmin() {
    return this.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN);
  }

  /**
   * Middleware to check if user is the resource owner or admin
   * Usage: authMiddleware.requireOwnerOrAdmin('userId')
   */
  requireOwnerOrAdmin(userIdParam: string = 'userId') {
    return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
      try {
        if (!req.user) {
          throw new UnauthorizedError('Authentication required');
        }

        const userId = req.params[userIdParam] || req.body[userIdParam];
        const isOwner = req.user.userId === userId;
        const isAdmin = req.user.role === UserRole.ADMIN;

        if (!isOwner && !isAdmin) {
          throw new ForbiddenError('You can only access your own resources');
        }

        next();
      } catch (error) {
        next(error);
      }
    };
  }
}

export const authMiddleware = new AuthMiddleware();

// Export middleware functions for direct use
export const authenticate = authMiddleware.authenticate.bind(authMiddleware);
export const optional = authMiddleware.optional.bind(authMiddleware);
export const requireRole = authMiddleware.requireRole.bind(authMiddleware);
export const requireAdmin = authMiddleware.requireAdmin.bind(authMiddleware);
export const requireInstructorOrAdmin = authMiddleware.requireInstructorOrAdmin.bind(authMiddleware);
export const requireOwnerOrAdmin = authMiddleware.requireOwnerOrAdmin.bind(authMiddleware);
