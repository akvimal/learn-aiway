import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { userRepository } from '../../repositories/user.repository';
import { userPreferencesRepository } from '../../repositories/userPreferences.repository';
import { ResponseUtil } from '../../utils/response.util';
import { NotFoundError } from '../../utils/errors.util';
import { updateProfileSchema, updatePreferencesSchema } from '../validators/profile.validators';
import { logger } from '../../config/logger.config';

export class ProfileController {
  /**
   * Get current user's profile
   * GET /api/v1/profile
   */
  async getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new NotFoundError('User not found');
      }

      const user = await userRepository.findById(userId);

      if (!user) {
        throw new NotFoundError('User not found');
      }

      const { password_hash, ...userWithoutPassword } = user;

      logger.info('User retrieved profile', { userId });

      ResponseUtil.success(res, userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's profile
   * PATCH /api/v1/profile
   */
  async updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new NotFoundError('User not found');
      }

      const validatedData = updateProfileSchema.parse(req.body);
      const updatedUser = await userRepository.updateProfile(userId, validatedData);
      const { password_hash, ...userWithoutPassword } = updatedUser;

      logger.info('User updated profile', {
        userId,
        updates: Object.keys(validatedData),
      });

      ResponseUtil.success(res, userWithoutPassword);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get current user's preferences
   * GET /api/v1/profile/preferences
   */
  async getPreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new NotFoundError('User not found');
      }

      const preferences = await userPreferencesRepository.findByUserId(userId);

      if (!preferences) {
        throw new NotFoundError('User preferences not found');
      }

      logger.info('User retrieved preferences', { userId });

      ResponseUtil.success(res, preferences.toJSON());
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update current user's preferences
   * PATCH /api/v1/profile/preferences
   */
  async updatePreferences(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        throw new NotFoundError('User not found');
      }

      const validatedData = updatePreferencesSchema.parse(req.body);
      const updatedPreferences = await userPreferencesRepository.update(userId, validatedData);

      logger.info('User updated preferences', {
        userId,
        updates: Object.keys(validatedData),
      });

      ResponseUtil.success(res, updatedPreferences.toJSON());
    } catch (error) {
      next(error);
    }
  }
}

export const profileController = new ProfileController();
