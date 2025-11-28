import jwt from 'jsonwebtoken';
import { env } from '../../config/env.config';
import { JwtPayload, TokenPair } from '../../types';
import { UnauthorizedError } from '../../utils/errors.util';

export class JwtService {
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private accessTokenExpiration: string;
  private refreshTokenExpiration: string;

  constructor() {
    this.accessTokenSecret = env.JWT_SECRET;
    this.refreshTokenSecret = env.JWT_REFRESH_SECRET;
    this.accessTokenExpiration = env.JWT_ACCESS_EXPIRATION;
    this.refreshTokenExpiration = env.JWT_REFRESH_EXPIRATION;
  }

  generateAccessToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiration,
      issuer: 'ai-learning-api',
      audience: 'ai-learning-client',
    });
  }

  generateRefreshToken(payload: JwtPayload): string {
    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiration,
      issuer: 'ai-learning-api',
      audience: 'ai-learning-client',
    });
  }

  generateTokenPair(payload: JwtPayload): TokenPair {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload),
    };
  }

  verifyAccessToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'ai-learning-api',
        audience: 'ai-learning-client',
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Access token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid access token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  verifyRefreshToken(token: string): JwtPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'ai-learning-api',
        audience: 'ai-learning-client',
      }) as JwtPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw new UnauthorizedError('Token verification failed');
    }
  }

  decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.decode(token) as JwtPayload;
    } catch {
      return null;
    }
  }

  getTokenExpirationDate(token: string): Date | null {
    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) {
      return null;
    }
    return new Date(decoded.exp * 1000);
  }
}

export const jwtService = new JwtService();
