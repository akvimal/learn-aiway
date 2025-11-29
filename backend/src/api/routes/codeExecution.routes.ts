import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as codeExecutionController from '../controllers/codeExecution.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Code submission routes
router.post('/exercises/:exerciseId/submit/javascript', codeExecutionController.submitJavaScript);
router.post('/exercises/:exerciseId/submit/java', codeExecutionController.submitJava);

// Submission history and details
router.get('/exercises/:exerciseId/submissions', codeExecutionController.getSubmissionHistory);
router.get('/submissions/:submissionId', codeExecutionController.getSubmissionDetails);

export default router;
