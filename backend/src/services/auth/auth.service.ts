import { userRepository } from '../../repositories/user.repository';
import { EncryptionUtil } from '../../utils/encryption.util';
import {
  ConflictError,
  UnauthorizedError,
  ValidationError,
} from '../../utils/errors.util';
import {
  User,
  UserCreateInput,
  UserLoginInput,
  JwtPayload,
  TokenPair,
  UserRole,
} from '../../types';
import { jwtService } from './jwt.service';
import { UserModel } from '../../models/user.model';
import { logger } from '../../config/logger.config';

export class AuthService {
  async register(data: UserCreateInput): Promise<{
    user: Omit<User, 'password_hash'>;
    tokens: TokenPair;
  }> {
    // Validate input
    this.validateRegistrationInput(data);

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const password_hash = await EncryptionUtil.hashPassword(data.password);

    // Create user
    const user = await userRepository.create({
      ...data,
      password_hash,
      role: data.role || UserRole.LEARNER,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    const expiresAt = jwtService.getTokenExpirationDate(tokens.refreshToken);
    if (expiresAt) {
      await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);
    }

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async login(data: UserLoginInput): Promise<{
    user: Omit<User, 'password_hash'>;
    tokens: TokenPair;
  }> {
    // Find user by email
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new UnauthorizedError('Account is deactivated. Please contact support.');
    }

    // Verify password
    const isPasswordValid = await EncryptionUtil.comparePassword(
      data.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Save refresh token
    const expiresAt = jwtService.getTokenExpirationDate(tokens.refreshToken);
    if (expiresAt) {
      await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);
    }

    return {
      user: user.toJSON(),
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    // Verify refresh token
    const payload = jwtService.verifyRefreshToken(refreshToken);

    // Check if token exists in database
    const tokenRecord = await userRepository.findRefreshToken(refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Check if token is revoked
    if (tokenRecord.revoked_at) {
      throw new UnauthorizedError('Refresh token has been revoked');
    }

    // Check if token is expired
    if (new Date(tokenRecord.expires_at) < new Date()) {
      throw new UnauthorizedError('Refresh token expired');
    }

    // Get user
    const user = await userRepository.findById(payload.userId);
    if (!user || !user.is_active) {
      throw new UnauthorizedError('User not found or inactive');
    }

    // Revoke old refresh token
    await userRepository.revokeRefreshToken(refreshToken);

    // Generate new tokens
    const tokens = this.generateTokens(user);

    // Save new refresh token
    const expiresAt = jwtService.getTokenExpirationDate(tokens.refreshToken);
    if (expiresAt) {
      await userRepository.saveRefreshToken(user.id, tokens.refreshToken, expiresAt);
    }

    logger.info('Tokens refreshed successfully', { userId: user.id });

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await userRepository.revokeRefreshToken(refreshToken);
    logger.info('User logged out successfully');
  }

  async logoutAll(userId: string): Promise<void> {
    await userRepository.revokeAllUserTokens(userId);
    logger.info('All user sessions logged out', { userId });
  }

  async verifyEmail(userId: string): Promise<UserModel> {
    const user = await userRepository.verifyEmail(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }
    logger.info('Email verified successfully', { userId });
    return user;
  }

  async changePassword(
    userId: string,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Get user
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new ValidationError('User not found');
    }

    // Verify old password
    const isPasswordValid = await EncryptionUtil.comparePassword(
      oldPassword,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    // Validate new password
    this.validatePassword(newPassword);

    // Hash new password
    const password_hash = await EncryptionUtil.hashPassword(newPassword);

    // Update password
    await userRepository.update(userId, { password_hash });

    // Revoke all refresh tokens (force re-login)
    await userRepository.revokeAllUserTokens(userId);

    logger.info('Password changed successfully', { userId });
  }

  private generateTokens(user: UserModel): TokenPair {
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };

    return jwtService.generateTokenPair(payload);
  }

  private validateRegistrationInput(data: UserCreateInput): void {
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      throw new ValidationError('Invalid email format');
    }

    // Validate password
    this.validatePassword(data.password);

    // Validate names
    if (!data.first_name || data.first_name.trim().length === 0) {
      throw new ValidationError('First name is required');
    }

    if (!data.last_name || data.last_name.trim().length === 0) {
      throw new ValidationError('Last name is required');
    }
  }

  private validatePassword(password: string): void {
    if (password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      throw new ValidationError('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      throw new ValidationError('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      throw new ValidationError('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      throw new ValidationError('Password must contain at least one special character');
    }
  }

  async cleanupExpiredTokens(): Promise<void> {
    await userRepository.deleteExpiredTokens();
    logger.info('Expired tokens cleaned up');
  }
}

export const authService = new AuthService();
