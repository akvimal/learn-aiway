import { database } from '../config/database.config';
import { LearningObjective, LearningObjectiveCreateInput } from '../types';
import { LearningObjectiveModel } from '../models/learningObjective.model';

export class LearningObjectiveRepository {
  /**
   * Find learning objective by ID
   */
  async findById(id: string): Promise<LearningObjectiveModel | null> {
    const result = await database.query<LearningObjective>(
      'SELECT * FROM learning_objectives WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new LearningObjectiveModel(result.rows[0]) : null;
  }

  /**
   * Find all learning objectives for a topic
   */
  async findByTopicId(topicId: string): Promise<LearningObjectiveModel[]> {
    const result = await database.query<LearningObjective>(
      'SELECT * FROM learning_objectives WHERE topic_id = $1 ORDER BY order_index ASC',
      [topicId]
    );
    return result.rows.map((row) => new LearningObjectiveModel(row));
  }

  /**
   * Create a new learning objective
   */
  async create(data: LearningObjectiveCreateInput): Promise<LearningObjectiveModel> {
    const query = `
      INSERT INTO learning_objectives (
        topic_id,
        objective_text,
        order_index,
        requires_exercise
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const values = [
      data.topic_id,
      data.objective_text,
      data.order_index,
      data.requires_exercise ?? true,
    ];

    const result = await database.query<LearningObjective>(query, values);
    return new LearningObjectiveModel(result.rows[0]);
  }

  /**
   * Update a learning objective
   */
  async update(
    id: string,
    updates: Partial<LearningObjectiveCreateInput>
  ): Promise<LearningObjectiveModel | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.objective_text !== undefined) {
      fields.push(`objective_text = $${paramIndex}`);
      values.push(updates.objective_text);
      paramIndex++;
    }

    if (updates.order_index !== undefined) {
      fields.push(`order_index = $${paramIndex}`);
      values.push(updates.order_index);
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE learning_objectives
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query<LearningObjective>(query, values);
    return result.rows[0] ? new LearningObjectiveModel(result.rows[0]) : null;
  }

  /**
   * Delete a learning objective
   */
  async delete(id: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM learning_objectives WHERE id = $1',
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Delete all learning objectives for a topic
   */
  async deleteByTopicId(topicId: string): Promise<number> {
    const result = await database.query(
      'DELETE FROM learning_objectives WHERE topic_id = $1',
      [topicId]
    );
    return result.rowCount || 0;
  }

  /**
   * Get the next available order_index for a topic
   */
  async getNextOrderIndex(topicId: string): Promise<number> {
    const result = await database.query<{ max: number | null }>(
      'SELECT COALESCE(MAX(order_index), -1) + 1 as max FROM learning_objectives WHERE topic_id = $1',
      [topicId]
    );
    return result.rows[0]?.max || 0;
  }

  /**
   * Create multiple learning objectives for a topic
   */
  async createMany(
    topicId: string,
    objectives: string[]
  ): Promise<LearningObjectiveModel[]> {
    const createPromises = objectives.map((objective, index) =>
      this.create({
        topic_id: topicId,
        objective_text: objective,
        order_index: index,
      })
    );

    return Promise.all(createPromises);
  }

  /**
   * Reorder learning objectives for a topic
   */
  async reorder(objectiveIds: string[], startOrder: number = 0): Promise<void> {
    const updatePromises = objectiveIds.map((objectiveId, index) =>
      this.update(objectiveId, { order_index: startOrder + index })
    );
    await Promise.all(updatePromises);
  }

  /**
   * Count learning objectives for a topic
   */
  async countByTopicId(topicId: string): Promise<number> {
    const result = await database.query(
      'SELECT COUNT(*) FROM learning_objectives WHERE topic_id = $1',
      [topicId]
    );
    return parseInt(result.rows[0].count, 10);
  }
}

export const learningObjectiveRepository = new LearningObjectiveRepository();
