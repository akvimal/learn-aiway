import { Router } from 'express';
import { authenticate, requireInstructorOrAdmin } from '../middleware/auth.middleware';
import * as aiContentGeneratorController from '../controllers/aiContentGenerator.controller';

const router = Router();

// All routes require authentication AND instructor/admin role
// AI content generation is for designers (instructors/admins) only
router.use(authenticate);
router.use(requireInstructorOrAdmin());

// Content generation endpoints
router.post('/generate/topic-content', aiContentGeneratorController.generateTopicContent);
router.post('/generate/exercise', aiContentGeneratorController.generateExercise);
router.post('/generate/hints', aiContentGeneratorController.generateHints);
router.post('/generate/test-cases', aiContentGeneratorController.generateTestCases);

// Curriculum content generation
router.post('/generate/topics', aiContentGeneratorController.generateTopics);
router.post('/generate/objectives', aiContentGeneratorController.generateObjectives);

export default router;
