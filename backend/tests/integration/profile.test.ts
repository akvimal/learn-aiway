import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { database } from '../../src/config/database.config';
import { userRepository } from '../../src/repositories/user.repository';
import { EncryptionUtil } from '../../src/utils/encryption.util';
import { jwtService } from '../../src/services/auth/jwt.service';
import { UserRole, LearningPace, AIModelPreference } from '../../src/types';

describe('Profile API Integration Tests', () => {
  let app: Application;
  let userToken: string;
  let userId: string;

  beforeAll(async () => {
    app = createApp();

    // Create test user
    const hashedPassword = await EncryptionUtil.hashPassword('Test@123');
    const user = await userRepository.create({
      email: 'testuser@test.com',
      password: 'Test@123',
      password_hash: hashedPassword,
      first_name: 'Test',
      last_name: 'User',
      role: UserRole.LEARNER,
    });
    userId = user.id;
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    userToken = tokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await database.query('DELETE FROM users WHERE email = $1', ['testuser@test.com']);
    await database.close();
  });

  describe('GET /api/v1/profile', () => {
    it('should return current user profile', async () => {
      const response = await request(app)
        .get('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(userId);
      expect(response.body.data.email).toBe('testuser@test.com');
      expect(response.body.data.first_name).toBe('Test');
      expect(response.body.data.last_name).toBe('User');
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .get('/api/v1/profile')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/profile', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          first_name: 'Updated',
          last_name: 'Name',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('Updated');
      expect(response.body.data.last_name).toBe('Name');

      // Verify in database
      const updatedUser = await userRepository.findById(userId);
      expect(updatedUser?.first_name).toBe('Updated');
      expect(updatedUser?.last_name).toBe('Name');
    });

    it('should update only first name', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          first_name: 'OnlyFirst',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.first_name).toBe('OnlyFirst');
      expect(response.body.data.last_name).toBe('Name'); // Should remain unchanged
    });

    it('should reject empty update', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid field values', async () => {
      const response = await request(app)
        .patch('/api/v1/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          first_name: '', // Empty string
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .patch('/api/v1/profile')
        .send({ first_name: 'Test' })
        .expect(401);
    });
  });

  describe('GET /api/v1/profile/preferences', () => {
    it('should return user preferences', async () => {
      const response = await request(app)
        .get('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user_id).toBe(userId);
      expect(response.body.data.learning_pace).toBeDefined();
      expect(response.body.data.preferred_ai_model).toBeDefined();
      expect(response.body.data.daily_study_time_minutes).toBeDefined();
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .get('/api/v1/profile/preferences')
        .expect(401);
    });
  });

  describe('PATCH /api/v1/profile/preferences', () => {
    it('should update learning pace', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          learning_pace: LearningPace.FAST,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.learning_pace).toBe(LearningPace.FAST);
    });

    it('should update preferred AI model', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          preferred_ai_model: AIModelPreference.CLAUDE_3,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.preferred_ai_model).toBe(AIModelPreference.CLAUDE_3);
    });

    it('should update daily study time', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          daily_study_time_minutes: 60,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.daily_study_time_minutes).toBe(60);
    });

    it('should update notification settings', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          enable_email_notifications: false,
          enable_push_notifications: true,
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.enable_email_notifications).toBe(false);
      expect(response.body.data.enable_push_notifications).toBe(true);
    });

    it('should update multiple preferences at once', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          learning_pace: LearningPace.SLOW,
          preferred_ai_model: AIModelPreference.GPT_4,
          daily_study_time_minutes: 45,
          timezone: 'America/New_York',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.learning_pace).toBe(LearningPace.SLOW);
      expect(response.body.data.preferred_ai_model).toBe(AIModelPreference.GPT_4);
      expect(response.body.data.daily_study_time_minutes).toBe(45);
      expect(response.body.data.timezone).toBe('America/New_York');
    });

    it('should reject invalid learning pace', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          learning_pace: 'invalid',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid daily study time (too high)', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          daily_study_time_minutes: 500, // Max is 480
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject invalid daily study time (too low)', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          daily_study_time_minutes: 0, // Min is 1
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should reject empty update', async () => {
      const response = await request(app)
        .patch('/api/v1/profile/preferences')
        .set('Authorization', `Bearer ${userToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should deny access without authentication', async () => {
      await request(app)
        .patch('/api/v1/profile/preferences')
        .send({ learning_pace: LearningPace.FAST })
        .expect(401);
    });
  });
});
