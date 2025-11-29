import { Router } from 'express';
import { quizController } from '../controllers/quiz.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { UserRole } from '../../types';

const router = Router();

// Generate quiz with AI (instructor only)
router.post(
  '/generate',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  quizController.generateQuiz.bind(quizController)
);

// Create quiz manually (instructor only)
router.post(
  '/',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  quizController.createQuiz.bind(quizController)
);

// Get quizzes by topic ID
router.get(
  '/topic/:topicId',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.getQuizzesByTopic.bind(quizController)
);

// Get user's quiz history
router.get(
  '/my/history',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.getMyQuizHistory.bind(quizController)
);

// Get quiz by ID
router.get(
  '/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.getQuizById.bind(quizController)
);

// Update quiz (instructor only)
router.put(
  '/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  quizController.updateQuiz.bind(quizController)
);

// Delete quiz (instructor only)
router.delete(
  '/:id',
  authMiddleware.authenticate.bind(authMiddleware),
  authMiddleware.requireRole(UserRole.INSTRUCTOR, UserRole.ADMIN).bind(authMiddleware),
  quizController.deleteQuiz.bind(quizController)
);

// Start quiz attempt (learner)
router.post(
  '/:id/attempts',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.startAttempt.bind(quizController)
);

// Submit answer (learner)
router.post(
  '/attempts/:attemptId/answers',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.submitAnswer.bind(quizController)
);

// Complete attempt (learner)
router.post(
  '/attempts/:attemptId/complete',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.completeAttempt.bind(quizController)
);

// Get attempt results
router.get(
  '/attempts/:attemptId',
  authMiddleware.authenticate.bind(authMiddleware),
  quizController.getAttemptResults.bind(quizController)
);

export default router;
