import { jwtService } from '../../src/services/auth/jwt.service';
import { JwtPayload, UserRole } from '../../src/types';
import { UnauthorizedError } from '../../src/utils/errors.util';

describe('JwtService', () => {
  const mockPayload: JwtPayload = {
    userId: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    role: UserRole.LEARNER,
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = jwtService.generateAccessToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockPayload);
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = jwtService.generateTokenPair(mockPayload);
      expect(tokens.accessToken).toBeDefined();
      expect(tokens.refreshToken).toBeDefined();
      expect(tokens.accessToken).not.toBe(tokens.refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwtService.verifyAccessToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => jwtService.verifyAccessToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = jwtService.generateRefreshToken(mockPayload);
      const decoded = jwtService.verifyRefreshToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      expect(() => jwtService.verifyRefreshToken(invalidToken)).toThrow(UnauthorizedError);
    });
  });

  describe('decodeToken', () => {
    it('should decode a token without verification', () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const decoded = jwtService.decodeToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('should return null for invalid token', () => {
      const decoded = jwtService.decodeToken('invalid');
      expect(decoded).toBeNull();
    });
  });

  describe('getTokenExpirationDate', () => {
    it('should return expiration date for valid token', () => {
      const token = jwtService.generateAccessToken(mockPayload);
      const expirationDate = jwtService.getTokenExpirationDate(token);

      expect(expirationDate).toBeInstanceOf(Date);
      expect(expirationDate!.getTime()).toBeGreaterThan(Date.now());
    });

    it('should return null for invalid token', () => {
      const expirationDate = jwtService.getTokenExpirationDate('invalid');
      expect(expirationDate).toBeNull();
    });
  });
});
