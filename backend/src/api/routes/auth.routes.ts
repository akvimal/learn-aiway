import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';
import { env } from '../../config/env.config';

const router = Router();

// Rate limiting for auth endpoints (more lenient in development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === 'development' ? 100 : 5, // 100 in dev, 5 in production
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: env.NODE_ENV === 'development' ? 50 : 3, // 50 in dev, 3 in production
  message: 'Too many registration attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes
router.post('/register', registerLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh', authController.refreshToken.bind(authController));
router.post('/logout', authController.logout.bind(authController));

// Protected routes
router.get(
  '/profile',
  authMiddleware.authenticate.bind(authMiddleware),
  authController.getProfile.bind(authController)
);

router.post(
  '/logout-all',
  authMiddleware.authenticate.bind(authMiddleware),
  authController.logoutAll.bind(authController)
);

router.post(
  '/change-password',
  authMiddleware.authenticate.bind(authMiddleware),
  authController.changePassword.bind(authController)
);

export default router;
