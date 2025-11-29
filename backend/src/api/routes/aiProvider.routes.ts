import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import * as aiProviderController from '../controllers/aiProvider.controller';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Provider management routes
router.get('/providers', aiProviderController.getUserProviders);
router.get('/providers/:id', aiProviderController.getProviderById);
router.post('/providers', aiProviderController.createProvider);
router.put('/providers/:id', aiProviderController.updateProvider);
router.delete('/providers/:id', aiProviderController.deleteProvider);

// Provider testing and models
router.post('/providers/:id/test', aiProviderController.testProvider);
router.get('/providers/:id/models', aiProviderController.getProviderModels);
router.put('/providers/:id/models/:modelId/default', aiProviderController.setDefaultModel);

// Chat completion (main AI interaction endpoint)
router.post('/chat/completions', aiProviderController.sendChatCompletion);

// Usage statistics
router.get('/usage/stats', aiProviderController.getUserUsageStats);

export default router;
