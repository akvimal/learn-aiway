import { database } from '../config/database.config';
import { Topic, TopicCreateInput, TopicUpdateInput } from '../types';
import { TopicModel } from '../models/topic.model';

export class TopicRepository {
  /**
   * Find topic by ID
   */
  async findById(id: string): Promise<TopicModel | null> {
    const result = await database.query<Topic>('SELECT * FROM topics WHERE id = $1', [id]);
    return result.rows[0] ? new TopicModel(result.rows[0]) : null;
  }

  /**
   * Find all topics for a curriculum
   */
  async findByCurriculumId(curriculumId: string): Promise<TopicModel[]> {
    const result = await database.query<Topic>(
      'SELECT * FROM topics WHERE curriculum_id = $1 ORDER BY order_index ASC',
      [curriculumId]
    );
    return result.rows.map((row) => new TopicModel(row));
  }

  /**
   * Find subtopics of a parent topic
   */
  async findByParentTopicId(parentTopicId: string): Promise<TopicModel[]> {
    const result = await database.query<Topic>(
      'SELECT * FROM topics WHERE parent_topic_id = $1 ORDER BY order_index ASC',
      [parentTopicId]
    );
    return result.rows.map((row) => new TopicModel(row));
  }

  /**
   * Find top-level topics (topics without parent) for a curriculum
   */
  async findTopLevelTopics(curriculumId: string): Promise<TopicModel[]> {
    const result = await database.query<Topic>(
      'SELECT * FROM topics WHERE curriculum_id = $1 AND parent_topic_id IS NULL ORDER BY order_index ASC',
      [curriculumId]
    );
    return result.rows.map((row) => new TopicModel(row));
  }

  /**
   * Create a new topic
   */
  async create(data: TopicCreateInput): Promise<TopicModel> {
    const query = `
      INSERT INTO topics (
        curriculum_id,
        parent_topic_id,
        title,
        description,
        content,
        order_index,
        estimated_duration_minutes,
        is_required
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      data.curriculum_id,
      data.parent_topic_id || null,
      data.title,
      data.description || null,
      data.content || null,
      data.order_index,
      data.estimated_duration_minutes || null,
      data.is_required !== undefined ? data.is_required : true,
    ];

    const result = await database.query<Topic>(query, values);
    return new TopicModel(result.rows[0]);
  }

  /**
   * Update a topic
   */
  async update(id: string, updates: TopicUpdateInput): Promise<TopicModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex}`);
      values.push(updates.title);
      paramIndex++;
    }

    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex}`);
      values.push(updates.description);
      paramIndex++;
    }

    if (updates.content !== undefined) {
      fields.push(`content = $${paramIndex}`);
      values.push(updates.content);
      paramIndex++;
    }

    if (updates.order_index !== undefined) {
      fields.push(`order_index = $${paramIndex}`);
      values.push(updates.order_index);
      paramIndex++;
    }

    if (updates.estimated_duration_minutes !== undefined) {
      fields.push(`estimated_duration_minutes = $${paramIndex}`);
      values.push(updates.estimated_duration_minutes);
      paramIndex++;
    }

    if (updates.is_required !== undefined) {
      fields.push(`is_required = $${paramIndex}`);
      values.push(updates.is_required);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE topics
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query<Topic>(query, values);
    return result.rows[0] ? new TopicModel(result.rows[0]) : null;
  }

  /**
   * Delete a topic (will cascade delete subtopics and learning objectives)
   */
  async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM topics WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get topic hierarchy for a curriculum
   * Returns topics with their children in a nested structure
   */
  async getTopicHierarchy(curriculumId: string): Promise<any[]> {
    // Get all topics for the curriculum
    const allTopics = await this.findByCurriculumId(curriculumId);

    // Build hierarchy
    const topicMap = new Map<string, any>();
    const rootTopics: any[] = [];

    // First pass: create map of all topics
    allTopics.forEach((topic) => {
      topicMap.set(topic.id, {
        ...topic.toJSON(),
        children: [],
      });
    });

    // Second pass: build hierarchy
    allTopics.forEach((topic) => {
      const topicData = topicMap.get(topic.id);
      if (topic.parent_topic_id) {
        const parent = topicMap.get(topic.parent_topic_id);
        if (parent) {
          parent.children.push(topicData);
        }
      } else {
        rootTopics.push(topicData);
      }
    });

    return rootTopics;
  }

  /**
   * Count total topics in a curriculum
   */
  async countByCurriculumId(curriculumId: string): Promise<number> {
    const result = await database.query(
      'SELECT COUNT(*) FROM topics WHERE curriculum_id = $1',
      [curriculumId]
    );
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Reorder topics
   */
  async reorder(topicIds: string[], startOrder: number = 0): Promise<void> {
    const updatePromises = topicIds.map((topicId, index) =>
      this.update(topicId, { order_index: startOrder + index })
    );
    await Promise.all(updatePromises);
  }

  /**
   * Get topic with full details (learning objectives, exercises, quizzes)
   */
  async getTopicWithDetails(topicId: string, includeHiddenTests: boolean = false): Promise<any> {
    const topic = await this.findById(topicId);
    if (!topic) return null;

    // Get learning objectives
    const objectivesQuery = await database.query(
      `SELECT * FROM learning_objectives
       WHERE topic_id = $1
       ORDER BY order_index ASC`,
      [topicId]
    );

    // Get exercises
    const exercisesQuery = await database.query(
      `SELECT id, title, description, instructions, language, difficulty_level,
              starter_code, points, time_limit_seconds, is_published, order_index, created_at
       FROM exercises
       WHERE topic_id = $1
       ORDER BY order_index ASC`,
      [topicId]
    );

    // Get quizzes (if they exist)
    const quizzesQuery = await database.query(
      `SELECT id, title, description, difficulty_level, time_limit_minutes,
              passing_score, is_published, order_index, created_at
       FROM quizzes
       WHERE topic_id = $1
       ORDER BY order_index ASC`,
      [topicId]
    );

    // For each exercise, get test case count
    const exercisesWithDetails = await Promise.all(
      exercisesQuery.rows.map(async (exercise) => {
        const testCaseQuery = await database.query(
          `SELECT COUNT(*) as total_tests,
                  COUNT(*) FILTER (WHERE is_hidden = false) as public_tests
           FROM exercise_test_cases
           WHERE exercise_id = $1`,
          [exercise.id]
        );

        const hints = await database.query(
          `SELECT COUNT(*) as hint_count FROM exercise_hints WHERE exercise_id = $1`,
          [exercise.id]
        );

        return {
          ...exercise,
          total_tests: parseInt(testCaseQuery.rows[0].total_tests, 10),
          public_tests: parseInt(testCaseQuery.rows[0].public_tests, 10),
          hint_count: parseInt(hints.rows[0].hint_count, 10),
        };
      })
    );

    return {
      ...topic.toJSON(),
      learning_objectives: objectivesQuery.rows,
      exercises: exercisesWithDetails,
      quizzes: quizzesQuery.rows,
    };
  }

  /**
   * Get topic summary with counts (for curriculum overview)
   */
  async getTopicSummary(topicId: string): Promise<any> {
    const topic = await this.findById(topicId);
    if (!topic) return null;

    const countsQuery = await database.query(
      `SELECT
        (SELECT COUNT(*) FROM learning_objectives WHERE topic_id = $1) as objective_count,
        (SELECT COUNT(*) FROM exercises WHERE topic_id = $1 AND is_published = true) as exercise_count,
        (SELECT COUNT(*) FROM quizzes WHERE topic_id = $1 AND is_published = true) as quiz_count
      `,
      [topicId]
    );

    return {
      ...topic.toJSON(),
      objective_count: parseInt(countsQuery.rows[0].objective_count, 10),
      exercise_count: parseInt(countsQuery.rows[0].exercise_count, 10),
      quiz_count: parseInt(countsQuery.rows[0].quiz_count, 10),
    };
  }
}

export const topicRepository = new TopicRepository();
