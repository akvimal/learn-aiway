import { Router } from 'express';
import { profileController } from '../controllers/profile.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All profile routes require authentication
router.use(authMiddleware.authenticate.bind(authMiddleware));

// Profile routes
router.get('/', profileController.getProfile.bind(profileController));
router.patch('/', profileController.updateProfile.bind(profileController));

// Preferences routes
router.get('/preferences', profileController.getPreferences.bind(profileController));
router.patch('/preferences', profileController.updatePreferences.bind(profileController));

export default router;
