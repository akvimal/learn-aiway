import { Response, NextFunction } from 'express';
import { AuthMiddleware } from '../../src/api/middleware/auth.middleware';
import { UnauthorizedError, ForbiddenError } from '../../src/utils/errors.util';
import { AuthenticatedRequest, UserRole } from '../../src/types';

jest.mock('../../src/services/auth/jwt.service');

describe('AuthMiddleware', () => {
  let authMiddleware: AuthMiddleware;
  let mockReq: Partial<AuthenticatedRequest>;
  let mockRes: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    authMiddleware = new AuthMiddleware();
    mockReq = {
      headers: {},
      params: {},
      body: {},
    };
    mockRes = {
      json: jest.fn(),
      status: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requireRole', () => {
    it('should allow access when user has required role', () => {
      mockReq.user = {
        userId: '123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = authMiddleware.requireRole(UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should allow access when user has one of multiple required roles', () => {
      mockReq.user = {
        userId: '123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
      };

      const middleware = authMiddleware.requireRole(UserRole.ADMIN, UserRole.INSTRUCTOR);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it('should deny access when user does not have required role', () => {
      mockReq.user = {
        userId: '123',
        email: 'learner@test.com',
        role: UserRole.LEARNER,
      };

      const middleware = authMiddleware.requireRole(UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0] as unknown as ForbiddenError;
      expect(error.message).toContain('Access denied');
      expect(error.message).toContain('admin');
      expect(error.message).toContain('learner');
    });

    it('should deny access when user is not authenticated', () => {
      mockReq.user = undefined;

      const middleware = authMiddleware.requireRole(UserRole.ADMIN);
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(UnauthorizedError));
      const error = mockNext.mock.calls[0][0] as unknown as UnauthorizedError;
      expect(error.message).toBe('Authentication required');
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      mockReq.user = {
        userId: '123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = authMiddleware.requireAdmin();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for non-admin users', () => {
      mockReq.user = {
        userId: '123',
        email: 'learner@test.com',
        role: UserRole.LEARNER,
      };

      const middleware = authMiddleware.requireAdmin();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('requireInstructorOrAdmin', () => {
    it('should allow access for instructor users', () => {
      mockReq.user = {
        userId: '123',
        email: 'instructor@test.com',
        role: UserRole.INSTRUCTOR,
      };

      const middleware = authMiddleware.requireInstructorOrAdmin();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access for admin users', () => {
      mockReq.user = {
        userId: '123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };

      const middleware = authMiddleware.requireInstructorOrAdmin();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access for learner users', () => {
      mockReq.user = {
        userId: '123',
        email: 'learner@test.com',
        role: UserRole.LEARNER,
      };

      const middleware = authMiddleware.requireInstructorOrAdmin();
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
    });
  });

  describe('requireOwnerOrAdmin', () => {
    it('should allow access when user is the owner', () => {
      const userId = '123';
      mockReq.user = {
        userId,
        email: 'user@test.com',
        role: UserRole.LEARNER,
      };
      mockReq.params = { userId };

      const middleware = authMiddleware.requireOwnerOrAdmin('userId');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should allow access when user is admin (not owner)', () => {
      mockReq.user = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: UserRole.ADMIN,
      };
      mockReq.params = { userId: 'other-user-456' };

      const middleware = authMiddleware.requireOwnerOrAdmin('userId');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should deny access when user is neither owner nor admin', () => {
      mockReq.user = {
        userId: 'user-123',
        email: 'user@test.com',
        role: UserRole.LEARNER,
      };
      mockReq.params = { userId: 'other-user-456' };

      const middleware = authMiddleware.requireOwnerOrAdmin('userId');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(expect.any(ForbiddenError));
      const error = mockNext.mock.calls[0][0] as unknown as ForbiddenError;
      expect(error.message).toBe('You can only access your own resources');
    });

    it('should check userId in body if not in params', () => {
      const userId = '123';
      mockReq.user = {
        userId,
        email: 'user@test.com',
        role: UserRole.LEARNER,
      };
      mockReq.params = {};
      mockReq.body = { userId };

      const middleware = authMiddleware.requireOwnerOrAdmin('userId');
      middleware(mockReq as AuthenticatedRequest, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });
  });
});
