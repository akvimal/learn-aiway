import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All admin routes require authentication and admin role
router.use(authMiddleware.authenticate.bind(authMiddleware));
router.use(authMiddleware.requireAdmin());

/**
 * @route   GET /api/v1/admin/users
 * @desc    Get all users with pagination and filtering
 * @access  Admin only
 * @query   page, limit, role, search
 */
router.get('/users', adminController.getAllUsers.bind(adminController));

/**
 * @route   GET /api/v1/admin/users/:id
 * @desc    Get user by ID
 * @access  Admin only
 */
router.get('/users/:id', adminController.getUserById.bind(adminController));

/**
 * @route   PATCH /api/v1/admin/users/:id/role
 * @desc    Update user role
 * @access  Admin only
 * @body    { role: 'learner' | 'instructor' | 'admin' }
 */
router.patch('/users/:id/role', adminController.updateUserRole.bind(adminController));

/**
 * @route   PATCH /api/v1/admin/users/:id/status
 * @desc    Activate or deactivate user
 * @access  Admin only
 * @body    { is_active: boolean }
 */
router.patch('/users/:id/status', adminController.updateUserStatus.bind(adminController));

/**
 * @route   GET /api/v1/admin/stats
 * @desc    Get user statistics
 * @access  Admin only
 */
router.get('/stats', adminController.getUserStats.bind(adminController));

export default router;
