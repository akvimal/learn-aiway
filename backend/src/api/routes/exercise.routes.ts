import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../types';
import * as exerciseController from '../controllers/exercise.controller';

const router = Router();

/**
 * Exercise CRUD routes
 */

// Create exercise for a topic (instructors and admins only)
router.post(
  '/topics/:topicId/exercises',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.createExercise
);

// Get exercises for a topic
router.get(
  '/topics/:topicId/exercises',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getExercisesByTopic
);

// Get exercise by ID
router.get(
  '/exercises/:exerciseId',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getExercise
);

// Update exercise (instructors and admins only)
router.patch(
  '/exercises/:exerciseId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.updateExercise
);

// Delete exercise (instructors and admins only)
router.delete(
  '/exercises/:exerciseId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.deleteExercise
);

/**
 * Test Case routes
 */

// Add test case to exercise (instructors and admins only)
router.post(
  '/exercises/:exerciseId/test-cases',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.addTestCase
);

// Get test cases for exercise
router.get(
  '/exercises/:exerciseId/test-cases',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getTestCases
);

// Delete test case (instructors and admins only)
router.delete(
  '/test-cases/:testCaseId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.deleteTestCase
);

/**
 * Hint routes
 */

// Add hint to exercise (instructors and admins only)
router.post(
  '/exercises/:exerciseId/hints',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.addHint
);

// Get hints for exercise
router.get(
  '/exercises/:exerciseId/hints',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getHints
);

// Request a hint (learners - tracks usage)
router.post(
  '/exercises/:exerciseId/hints/:hintLevel/request',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.requestHint
);

// Get hint usage for current user
router.get(
  '/exercises/:exerciseId/hints/usage',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getHintUsage
);

// Delete hint (instructors and admins only)
router.delete(
  '/hints/:hintId',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.deleteHint
);

/**
 * Exercise-Objective Linking routes
 */

// Link exercise to learning objectives (instructors and admins only)
router.post(
  '/exercises/:exerciseId/objectives',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  exerciseController.linkToObjectives
);

// Get linked objectives for exercise
router.get(
  '/exercises/:exerciseId/objectives',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getLinkedObjectives
);

// Get exercises for a learning objective
router.get(
  '/objectives/:objectiveId/exercises',
  authMiddleware.authenticate.bind(authMiddleware),
  exerciseController.getExercisesByObjective
);

export default router;
