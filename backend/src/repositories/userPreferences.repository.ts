import { database } from '../config/database.config';
import { UserPreferences, UserPreferencesUpdateInput } from '../types';
import { UserPreferencesModel } from '../models/userPreferences.model';
import { NotFoundError } from '../utils/errors.util';

export class UserPreferencesRepository {
  async findByUserId(userId: string): Promise<UserPreferencesModel | null> {
    const result = await database.query<UserPreferences>(
      'SELECT * FROM user_preferences WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new UserPreferencesModel(result.rows[0]);
  }

  async update(
    userId: string,
    updates: UserPreferencesUpdateInput
  ): Promise<UserPreferencesModel> {
    const updateFields = [];
    const values = [];
    let parameterIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      updateFields.push(`${key} = $${parameterIndex}`);
      values.push(value);
      parameterIndex++;
    }

    values.push(userId);

    const query = `
      UPDATE user_preferences
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${parameterIndex}
      RETURNING *
    `;

    const result = await database.query<UserPreferences>(query, values);

    if (result.rows.length === 0) {
      throw new NotFoundError('User preferences not found');
    }

    return new UserPreferencesModel(result.rows[0]);
  }
}

export const userPreferencesRepository = new UserPreferencesRepository();
