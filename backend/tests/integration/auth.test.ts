import request from 'supertest';
import { createApp } from '../../src/app';

describe('Authentication Integration Tests', () => {
  const app = createApp();
  let accessToken: string;

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'TestPass123!',
          first_name: 'Test',
          last_name: 'User',
          role: 'learner',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('id');
      expect(response.body.data.user.email).toContain('test-');
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should reject duplicate email', async () => {
      const email = `duplicate-${Date.now()}@example.com`;

      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'TestPass123!',
          first_name: 'Test',
          last_name: 'User',
        });

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email,
          password: 'TestPass123!',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });

    it('should reject invalid password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: `test-${Date.now()}@example.com`,
          password: 'weak',
          first_name: 'Test',
          last_name: 'User',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/v1/auth/login', () => {
    beforeAll(async () => {
      await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'login-test@example.com',
          password: 'TestPass123!',
          first_name: 'Login',
          last_name: 'Test',
        });
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'TestPass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
      accessToken = response.body.data.accessToken;
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'login-test@example.com',
          password: 'WrongPassword123!',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('login-test@example.com');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/v1/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});
