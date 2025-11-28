import { database } from '../config/database.config';
import { User, UserCreateInput, UserRole } from '../types';
import { UserModel } from '../models/user.model';

export class UserRepository {
  async findById(id: string): Promise<UserModel | null> {
    const result = await database.query<User>(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new UserModel(result.rows[0]) : null;
  }

  async findByEmail(email: string): Promise<UserModel | null> {
    const result = await database.query<User>(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] ? new UserModel(result.rows[0]) : null;
  }

  async create(data: UserCreateInput & { password_hash: string }): Promise<UserModel> {
    const result = await database.query<User>(
      `INSERT INTO users (email, password_hash, first_name, last_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        data.email,
        data.password_hash,
        data.first_name,
        data.last_name,
        data.role || UserRole.LEARNER,
      ]
    );
    return new UserModel(result.rows[0]);
  }

  async update(id: string, updates: Partial<User>): Promise<UserModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at') {
        fields.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const result = await database.query<User>(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows[0] ? new UserModel(result.rows[0]) : null;
  }

  async delete(id: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  async findAll(filters?: {
    role?: UserRole;
    is_active?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<UserModel[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.role) {
      conditions.push(`role = $${paramIndex}`);
      values.push(filters.role);
      paramIndex++;
    }

    if (filters?.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(filters.is_active);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const limit = filters?.limit || 100;
    const offset = filters?.offset || 0;

    const query = `
      SELECT * FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await database.query<User>(query, values);
    return result.rows.map((row) => new UserModel(row));
  }

  async verifyEmail(userId: string): Promise<UserModel | null> {
    return this.update(userId, { is_email_verified: true });
  }

  async deactivate(userId: string): Promise<UserModel | null> {
    return this.update(userId, { is_active: false });
  }

  async activate(userId: string): Promise<UserModel | null> {
    return this.update(userId, { is_active: true });
  }

  async saveRefreshToken(userId: string, token: string, expiresAt: Date): Promise<void> {
    await database.query(
      `INSERT INTO refresh_tokens (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, token, expiresAt]
    );
  }

  async findRefreshToken(token: string): Promise<{
    id: string;
    user_id: string;
    token: string;
    expires_at: Date;
    revoked_at: Date | null;
  } | null> {
    const result = await database.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [token]
    );
    return result.rows[0] || null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    await database.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await database.query(
      'UPDATE refresh_tokens SET revoked_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND revoked_at IS NULL',
      [userId]
    );
  }

  async deleteExpiredTokens(): Promise<void> {
    await database.query(
      'DELETE FROM refresh_tokens WHERE expires_at < CURRENT_TIMESTAMP OR revoked_at IS NOT NULL'
    );
  }

  /**
   * Get all users with pagination and filtering (admin only)
   */
  async getAllUsers(
    filters: { role?: string; search?: string },
    limit: number,
    offset: number
  ): Promise<{ users: UserModel[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters.role) {
      conditions.push(`role = $${paramIndex}`);
      values.push(filters.role);
      paramIndex++;
    }

    if (filters.search) {
      conditions.push(`(email ILIKE $${paramIndex} OR first_name ILIKE $${paramIndex} OR last_name ILIKE $${paramIndex})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM users ${whereClause}`;
    const countResult = await database.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get users with pagination
    const query = `
      SELECT * FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await database.query<User>(query, values);
    const users = result.rows.map((row) => new UserModel(row));

    return { users, total };
  }

  /**
   * Update user role (admin only)
   */
  async updateRole(userId: string, newRole: UserRole): Promise<UserModel> {
    const result = await database.query<User>(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [newRole, userId]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return new UserModel(result.rows[0]);
  }

  /**
   * Update user active status (admin only)
   */
  async updateStatus(userId: string, is_active: boolean): Promise<UserModel> {
    const result = await database.query<User>(
      `UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *`,
      [is_active, userId]
    );

    if (!result.rows[0]) {
      throw new Error('User not found');
    }

    return new UserModel(result.rows[0]);
  }

  /**
   * Count users by role
   */
  async countByRole(role: UserRole): Promise<number> {
    const result = await database.query(
      'SELECT COUNT(*) FROM users WHERE role = $1 AND is_active = true',
      [role]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Get user statistics (admin only)
   */
  async getUserStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    active: number;
    inactive: number;
    emailVerified: number;
    emailUnverified: number;
  }> {
    const statsQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE role = 'learner') as learners,
        COUNT(*) FILTER (WHERE role = 'instructor') as instructors,
        COUNT(*) FILTER (WHERE role = 'admin') as admins,
        COUNT(*) FILTER (WHERE is_active = true) as active,
        COUNT(*) FILTER (WHERE is_active = false) as inactive,
        COUNT(*) FILTER (WHERE is_email_verified = true) as email_verified,
        COUNT(*) FILTER (WHERE is_email_verified = false) as email_unverified
      FROM users
    `;

    const result = await database.query(statsQuery);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total, 10),
      byRole: {
        learner: parseInt(stats.learners, 10),
        instructor: parseInt(stats.instructors, 10),
        admin: parseInt(stats.admins, 10),
      },
      active: parseInt(stats.active, 10),
      inactive: parseInt(stats.inactive, 10),
      emailVerified: parseInt(stats.email_verified, 10),
      emailUnverified: parseInt(stats.email_unverified, 10),
    };
  }
}

export const userRepository = new UserRepository();
