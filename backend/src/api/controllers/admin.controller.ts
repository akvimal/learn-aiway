import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, UserRole } from '../../types';
import { userRepository } from '../../repositories/user.repository';
import { ValidationError, NotFoundError, ForbiddenError } from '../../utils/errors.util';
import { ResponseUtil } from '../../utils/response.util';
import { logger } from '../../config/logger.config';

export class AdminController {
  /**
   * Get all users (admin only)
   * GET /api/v1/admin/users
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { page = 1, limit = 20, role, search } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Invalid pagination parameters');
      }

      const offset = (pageNum - 1) * limitNum;

      const filters: any = {};
      if (role && Object.values(UserRole).includes(role as UserRole)) {
        filters.role = role;
      }
      if (search) {
        filters.search = search;
      }

      const { users, total } = await userRepository.getAllUsers(filters, limitNum, offset);

      const usersWithoutPasswords = users.map((user) => {
        const { password_hash, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });

      logger.info('Admin retrieved user list', {
        adminId: req.user?.userId,
        page: pageNum,
        limit: limitNum,
        total,
      });

      ResponseUtil.success(res, {
        users: usersWithoutPasswords,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID (admin only)
   * GET /api/v1/admin/users/:id
   */
  async getUserById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const user = await userRepository.findById(id);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;

      logger.info('Admin retrieved user details', {
        adminId: req.user?.userId,
        targetUserId: id,
      });

      ResponseUtil.success(res, userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user role (admin only)
   * PATCH /api/v1/admin/users/:id/role
   */
  async updateUserRole(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { role } = req.body;

      // Validate role
      if (!role || !Object.values(UserRole).includes(role)) {
        throw new ValidationError('Invalid role. Must be one of: learner, instructor, admin');
      }

      // Prevent admins from changing their own role
      if (req.user?.userId === id) {
        throw new ForbiddenError('You cannot change your own role');
      }

      // Check if user exists
      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Check if trying to demote the last admin
      if (user.role === UserRole.ADMIN && role !== UserRole.ADMIN) {
        const adminCount = await userRepository.countByRole(UserRole.ADMIN);
        if (adminCount <= 1) {
          throw new ForbiddenError('Cannot demote the last admin user');
        }
      }

      // Update role
      const updatedUser = await userRepository.updateRole(id, role);

      const { password_hash, ...userWithoutPassword } = updatedUser;

      logger.info('Admin updated user role', {
        adminId: req.user?.userId,
        targetUserId: id,
        oldRole: user.role,
        newRole: role,
      });

      ResponseUtil.success(res, {
        user: userWithoutPassword,
        message: `User role updated from ${user.role} to ${role}`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deactivate/activate user (admin only)
   * PATCH /api/v1/admin/users/:id/status
   */
  async updateUserStatus(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { is_active } = req.body;

      if (typeof is_active !== 'boolean') {
        throw new ValidationError('is_active must be a boolean');
      }

      // Prevent admins from deactivating themselves
      if (req.user?.userId === id && !is_active) {
        throw new ForbiddenError('You cannot deactivate your own account');
      }

      const user = await userRepository.findById(id);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      // Prevent deactivating the last admin
      if (user.role === UserRole.ADMIN && !is_active) {
        const adminCount = await userRepository.countByRole(UserRole.ADMIN);
        if (adminCount <= 1) {
          throw new ForbiddenError('Cannot deactivate the last admin user');
        }
      }

      const updatedUser = await userRepository.updateStatus(id, is_active);

      const { password_hash, ...userWithoutPassword } = updatedUser;

      logger.info('Admin updated user status', {
        adminId: req.user?.userId,
        targetUserId: id,
        is_active,
      });

      ResponseUtil.success(res, {
        user: userWithoutPassword,
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user statistics (admin only)
   * GET /api/v1/admin/stats
   */
  async getUserStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await userRepository.getUserStats();

      logger.info('Admin retrieved user statistics', {
        adminId: req.user?.userId,
      });

      ResponseUtil.success(res, stats);
    } catch (error) {
      next(error);
    }
  }
}

export const adminController = new AdminController();
