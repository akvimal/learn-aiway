import request from 'supertest';
import { Application } from 'express';
import { createApp } from '../../src/app';
import { database } from '../../src/config/database.config';
import { userRepository } from '../../src/repositories/user.repository';
import { EncryptionUtil } from '../../src/utils/encryption.util';
import { jwtService } from '../../src/services/auth/jwt.service';
import { UserRole } from '../../src/types';

describe('Admin API Integration Tests', () => {
  let app: Application;
  let adminToken: string;
  let learnerToken: string;
  let adminUserId: string;
  let learnerUserId: string;

  beforeAll(async () => {
    app = createApp();

    // Create admin user
    const adminHashedPassword = await EncryptionUtil.hashPassword('Admin@123');
    const adminUser = await userRepository.create({
      email: 'admin@test.com',
      password: 'Admin@123',
      password_hash: adminHashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: UserRole.ADMIN,
    });
    adminUserId = adminUser.id;
    const adminTokens = jwtService.generateTokenPair({
      userId: adminUser.id,
      email: adminUser.email,
      role: adminUser.role,
    });
    adminToken = adminTokens.accessToken;

    // Create learner user
    const learnerHashedPassword = await EncryptionUtil.hashPassword('Learner@123');
    const learnerUser = await userRepository.create({
      email: 'learner@test.com',
      password: 'Learner@123',
      password_hash: learnerHashedPassword,
      first_name: 'Learner',
      last_name: 'User',
      role: UserRole.LEARNER,
    });
    learnerUserId = learnerUser.id;
    const learnerTokens = jwtService.generateTokenPair({
      userId: learnerUser.id,
      email: learnerUser.email,
      role: learnerUser.role,
    });
    learnerToken = learnerTokens.accessToken;
  });

  afterAll(async () => {
    // Clean up test data
    await database.query('DELETE FROM users WHERE email IN ($1, $2)', [
      'admin@test.com',
      'learner@test.com',
    ]);
    await database.close();
  });

  describe('GET /api/v1/admin/users', () => {
    it('should return list of users for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.users).toBeInstanceOf(Array);
      expect(response.body.data.users.length).toBeGreaterThan(0);
      expect(response.body.data.pagination).toBeDefined();
      expect(response.body.data.pagination.page).toBe(1);

      // Verify no passwords are returned
      response.body.data.users.forEach((user: any) => {
        expect(user.password_hash).toBeUndefined();
      });
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.data.users.length).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    it('should support role filtering', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users?role=admin')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      response.body.data.users.forEach((user: any) => {
        expect(user.role).toBe('admin');
      });
    });

    it('should deny access for non-admin users', async () => {
      const response = await request(app)
        .get('/api/v1/admin/users')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Access denied');
    });

    it('should deny access for unauthenticated requests', async () => {
      await request(app)
        .get('/api/v1/admin/users')
        .expect(401);
    });
  });

  describe('GET /api/v1/admin/users/:id', () => {
    it('should return user details for admin', async () => {
      const response = await request(app)
        .get(`/api/v1/admin/users/${learnerUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(learnerUserId);
      expect(response.body.data.email).toBe('learner@test.com');
      expect(response.body.data.password_hash).toBeUndefined();
    });

    it('should return 404 for non-existent user', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      await request(app)
        .get(`/api/v1/admin/users/${fakeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });
  });

  describe('PATCH /api/v1/admin/users/:id/role', () => {
    it('should update user role for admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.INSTRUCTOR })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe(UserRole.INSTRUCTOR);
      expect(response.body.data.message).toContain('learner');
      expect(response.body.data.message).toContain('instructor');

      // Verify in database
      const updatedUser = await userRepository.findById(learnerUserId);
      expect(updatedUser?.role).toBe(UserRole.INSTRUCTOR);

      // Revert back to learner for other tests
      await userRepository.updateRole(learnerUserId, UserRole.LEARNER);
    });

    it('should reject invalid role', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: 'invalid_role' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('Invalid role');
    });

    it('should prevent admin from changing their own role', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/role`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ role: UserRole.LEARNER })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error.message).toContain('cannot change your own role');
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .patch(`/api/v1/admin/users/${learnerUserId}/role`)
        .set('Authorization', `Bearer ${learnerToken}`)
        .send({ role: UserRole.ADMIN })
        .expect(403);
    });
  });

  describe('PATCH /api/v1/admin/users/:id/status', () => {
    it('should deactivate user for admin', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${learnerUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.is_active).toBe(false);

      // Reactivate for other tests
      await userRepository.updateStatus(learnerUserId, true);
    });

    it('should activate user for admin', async () => {
      // First deactivate
      await userRepository.updateStatus(learnerUserId, false);

      const response = await request(app)
        .patch(`/api/v1/admin/users/${learnerUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: true })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.is_active).toBe(true);
    });

    it('should prevent admin from deactivating themselves', async () => {
      const response = await request(app)
        .patch(`/api/v1/admin/users/${adminUserId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ is_active: false })
        .expect(403);

      expect(response.body.error.message).toContain('cannot deactivate your own account');
    });
  });

  describe('GET /api/v1/admin/stats', () => {
    it('should return user statistics for admin', async () => {
      const response = await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBeGreaterThan(0);
      expect(response.body.data.byRole).toBeDefined();
      expect(response.body.data.byRole.admin).toBeGreaterThan(0);
      expect(response.body.data.active).toBeDefined();
      expect(response.body.data.inactive).toBeDefined();
    });

    it('should deny access for non-admin users', async () => {
      await request(app)
        .get('/api/v1/admin/stats')
        .set('Authorization', `Bearer ${learnerToken}`)
        .expect(403);
    });
  });
});
