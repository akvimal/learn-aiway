import { database } from '../config/database.config';
import {
  UserCurriculumProgress,
  UserTopicProgress,
  TopicStatus,
  UserTopicProgressUpdateInput,
} from '../types';

export class CurriculumProgressRepository {
  /**
   * Get or create user curriculum progress
   */
  async getOrCreateUserCurriculumProgress(
    userId: string,
    curriculumId: string
  ): Promise<UserCurriculumProgress> {
    // Try to find existing progress
    const existingResult = await database.query<UserCurriculumProgress>(
      'SELECT * FROM user_curriculum_progress WHERE user_id = $1 AND curriculum_id = $2',
      [userId, curriculumId]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // Create new progress
    const createResult = await database.query<UserCurriculumProgress>(
      `INSERT INTO user_curriculum_progress (user_id, curriculum_id)
       VALUES ($1, $2)
       RETURNING *`,
      [userId, curriculumId]
    );

    return createResult.rows[0];
  }

  /**
   * Get user's curriculum progress
   */
  async getUserCurriculumProgress(
    userId: string,
    curriculumId: string
  ): Promise<UserCurriculumProgress | null> {
    const result = await database.query<UserCurriculumProgress>(
      'SELECT * FROM user_curriculum_progress WHERE user_id = $1 AND curriculum_id = $2',
      [userId, curriculumId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get all curricula progress for a user
   */
  async getUserAllCurriculaProgress(userId: string): Promise<UserCurriculumProgress[]> {
    const result = await database.query<UserCurriculumProgress>(
      'SELECT * FROM user_curriculum_progress WHERE user_id = $1 ORDER BY last_accessed_at DESC',
      [userId]
    );
    return result.rows;
  }

  /**
   * Update current topic for user in curriculum
   */
  async updateCurrentTopic(
    userId: string,
    curriculumId: string,
    topicId: string
  ): Promise<UserCurriculumProgress> {
    const result = await database.query<UserCurriculumProgress>(
      `UPDATE user_curriculum_progress
       SET current_topic_id = $1, last_accessed_at = CURRENT_TIMESTAMP
       WHERE user_id = $2 AND curriculum_id = $3
       RETURNING *`,
      [topicId, userId, curriculumId]
    );
    return result.rows[0];
  }

  /**
   * Get or create user topic progress
   */
  async getOrCreateUserTopicProgress(
    userId: string,
    topicId: string
  ): Promise<UserTopicProgress> {
    // Try to find existing progress
    const existingResult = await database.query<UserTopicProgress>(
      'SELECT * FROM user_topic_progress WHERE user_id = $1 AND topic_id = $2',
      [userId, topicId]
    );

    if (existingResult.rows.length > 0) {
      return existingResult.rows[0];
    }

    // Create new progress
    const createResult = await database.query<UserTopicProgress>(
      `INSERT INTO user_topic_progress (user_id, topic_id, status)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [userId, topicId, TopicStatus.NOT_STARTED]
    );

    return createResult.rows[0];
  }

  /**
   * Update user topic progress
   */
  async updateUserTopicProgress(
    userId: string,
    topicId: string,
    updates: UserTopicProgressUpdateInput
  ): Promise<UserTopicProgress> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.status !== undefined) {
      fields.push(`status = $${paramIndex}`);
      values.push(updates.status);
      paramIndex++;

      // If marking as completed, set completed_at
      if (updates.status === TopicStatus.COMPLETED) {
        fields.push(`completed_at = CURRENT_TIMESTAMP`);
      }
    }

    if (updates.time_spent_minutes !== undefined) {
      fields.push(`time_spent_minutes = time_spent_minutes + $${paramIndex}`);
      values.push(updates.time_spent_minutes);
      paramIndex++;
    }

    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex}`);
      values.push(updates.notes);
      paramIndex++;
    }

    values.push(userId, topicId);

    const query = `
      UPDATE user_topic_progress
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE user_id = $${paramIndex} AND topic_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await database.query<UserTopicProgress>(query, values);
    return result.rows[0];
  }

  /**
   * Get all topic progress for a user in a curriculum
   */
  async getUserTopicProgressForCurriculum(
    userId: string,
    curriculumId: string
  ): Promise<UserTopicProgress[]> {
    const query = `
      SELECT utp.*
      FROM user_topic_progress utp
      JOIN topics t ON utp.topic_id = t.id
      WHERE utp.user_id = $1 AND t.curriculum_id = $2
      ORDER BY t.order_index ASC
    `;

    const result = await database.query<UserTopicProgress>(query, [userId, curriculumId]);
    return result.rows;
  }

  /**
   * Mark topic as completed
   */
  async markTopicCompleted(userId: string, topicId: string): Promise<UserTopicProgress> {
    return this.updateUserTopicProgress(userId, topicId, {
      status: TopicStatus.COMPLETED,
    });
  }

  /**
   * Mark topic as in progress
   */
  async markTopicInProgress(userId: string, topicId: string): Promise<UserTopicProgress> {
    return this.updateUserTopicProgress(userId, topicId, {
      status: TopicStatus.IN_PROGRESS,
    });
  }

  /**
   * Get completion statistics for a curriculum
   */
  async getCurriculumStats(userId: string, curriculumId: string): Promise<{
    totalTopics: number;
    completedTopics: number;
    inProgressTopics: number;
    notStartedTopics: number;
  }> {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE t.is_required = TRUE) as total_required,
        COUNT(*) FILTER (WHERE utp.status = 'completed' AND t.is_required = TRUE) as completed,
        COUNT(*) FILTER (WHERE utp.status = 'in_progress') as in_progress,
        COUNT(*) FILTER (WHERE utp.status = 'not_started' OR utp.status IS NULL) as not_started
      FROM topics t
      LEFT JOIN user_topic_progress utp ON t.id = utp.topic_id AND utp.user_id = $1
      WHERE t.curriculum_id = $2
    `;

    const result = await database.query(query, [userId, curriculumId]);
    const row = result.rows[0];

    return {
      totalTopics: parseInt(row.total_required, 10),
      completedTopics: parseInt(row.completed, 10),
      inProgressTopics: parseInt(row.in_progress, 10),
      notStartedTopics: parseInt(row.not_started, 10),
    };
  }
}

export const curriculumProgressRepository = new CurriculumProgressRepository();
