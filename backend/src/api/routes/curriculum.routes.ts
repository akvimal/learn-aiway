import { Router } from 'express';
import { curriculumController } from '../controllers/curriculum.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../types';

const router = Router();

// ============================================================================
// Public Routes
// ============================================================================

/**
 * @route   GET /api/v1/curricula/search
 * @desc    Search curricula by title or description
 * @access  Public
 * @query   q - search term
 */
router.get('/search', curriculumController.searchCurricula.bind(curriculumController));

/**
 * @route   GET /api/v1/curricula/domain/:domain
 * @desc    Get all curricula for a specific domain
 * @access  Public
 * @params  domain - domain name (e.g., 'programming', 'cloud', 'finance')
 */
router.get(
  '/domain/:domain',
  curriculumController.getCurriculaByDomain.bind(curriculumController)
);

/**
 * @route   GET /api/v1/curricula/:id/stats
 * @desc    Get curriculum statistics
 * @access  Public
 * @params  id - curriculum ID
 */
router.get('/:id/stats', curriculumController.getCurriculumStats.bind(curriculumController));

/**
 * @route   GET /api/v1/curricula/:id
 * @desc    Get curriculum by ID with topics and learning objectives
 * @access  Public (published) / Private (unpublished - owner only)
 * @params  id - curriculum ID
 * @query   include_progress - if true, include user's progress
 */
router.get('/:id', curriculumController.getCurriculumById.bind(curriculumController));

/**
 * @route   GET /api/v1/curricula
 * @desc    Get all curricula with filtering and pagination
 * @access  Public
 * @query   page, limit, domain, difficulty_level, is_published, search
 */
router.get('/', curriculumController.getAllCurricula.bind(curriculumController));

// ============================================================================
// Authenticated Routes
// ============================================================================

/**
 * @route   GET /api/v1/curricula/my
 * @desc    Get curricula created by current user
 * @access  Private (Instructor/Admin)
 */
router.get(
  '/my',
  authMiddleware.authenticate.bind(authMiddleware),
  curriculumController.getMyCurricula.bind(curriculumController)
);

/**
 * @route   GET /api/v1/curricula/progress
 * @desc    Get user's progress across all curricula
 * @access  Private
 */
router.get(
  '/progress',
  authMiddleware.authenticate.bind(authMiddleware),
  curriculumController.getMyProgress.bind(curriculumController)
);

/**
 * @route   POST /api/v1/curricula
 * @desc    Create a new curriculum
 * @access  Private (Instructor/Admin)
 */
router.post(
  '/',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.createCurriculum.bind(curriculumController)
);

/**
 * @route   PUT /api/v1/curricula/:id
 * @desc    Update a curriculum
 * @access  Private (Owner/Admin)
 */
router.put(
  '/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.updateCurriculum.bind(curriculumController)
);

/**
 * @route   DELETE /api/v1/curricula/:id
 * @desc    Delete a curriculum
 * @access  Private (Owner/Admin)
 */
router.delete(
  '/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.deleteCurriculum.bind(curriculumController)
);

/**
 * @route   POST /api/v1/curricula/:id/publish
 * @desc    Publish a curriculum
 * @access  Private (Owner/Admin)
 */
router.post(
  '/:id/publish',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.publishCurriculum.bind(curriculumController)
);

/**
 * @route   POST /api/v1/curricula/:id/unpublish
 * @desc    Unpublish a curriculum
 * @access  Private (Owner/Admin)
 */
router.post(
  '/:id/unpublish',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.unpublishCurriculum.bind(curriculumController)
);

// ============================================================================
// Topic Management Routes
// ============================================================================

/**
 * @route   POST /api/v1/curricula/:id/topics
 * @desc    Add a topic to a curriculum
 * @access  Private (Owner/Admin)
 */
router.post(
  '/:id/topics',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.addTopic.bind(curriculumController)
);

/**
 * @route   PUT /api/v1/curricula/:curriculumId/topics/:topicId
 * @desc    Update a topic
 * @access  Private (Owner/Admin)
 */
router.put(
  '/:curriculumId/topics/:topicId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.updateTopic.bind(curriculumController)
);

/**
 * @route   DELETE /api/v1/curricula/:curriculumId/topics/:topicId
 * @desc    Delete a topic
 * @access  Private (Owner/Admin)
 */
router.delete(
  '/:curriculumId/topics/:topicId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.deleteTopic.bind(curriculumController)
);

// ============================================================================
// Learning Objective Management Routes
// ============================================================================

/**
 * @route   POST /api/v1/curricula/:curriculumId/topics/:topicId/objectives
 * @desc    Add a learning objective to a topic
 * @access  Private (Owner/Admin)
 */
router.post(
  '/:curriculumId/topics/:topicId/objectives',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.addLearningObjective.bind(curriculumController)
);

/**
 * @route   PUT /api/v1/curricula/:curriculumId/topics/:topicId/objectives/:objectiveId
 * @desc    Update a learning objective
 * @access  Private (Owner/Admin)
 */
router.put(
  '/:curriculumId/topics/:topicId/objectives/:objectiveId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.updateLearningObjective.bind(curriculumController)
);

/**
 * @route   DELETE /api/v1/curricula/:curriculumId/topics/:topicId/objectives/:objectiveId
 * @desc    Delete a learning objective
 * @access  Private (Owner/Admin)
 */
router.delete(
  '/:curriculumId/topics/:topicId/objectives/:objectiveId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  curriculumController.deleteLearningObjective.bind(curriculumController)
);

export default router;
