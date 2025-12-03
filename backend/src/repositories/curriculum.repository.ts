import { database } from '../config/database.config';
import {
  Curriculum,
  CurriculumCreateInput,
  CurriculumUpdateInput,
  DifficultyLevel,
} from '../types';
import { CurriculumModel } from '../models/curriculum.model';

export class CurriculumRepository {
  /**
   * Find curriculum by ID
   */
  async findById(id: string): Promise<CurriculumModel | null> {
    const result = await database.query<Curriculum>(
      'SELECT * FROM curricula WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new CurriculumModel(result.rows[0]) : null;
  }

  /**
   * Find all curricula with optional filtering
   */
  async findAll(filters?: {
    domain?: string;
    category?: string;
    specialization?: string;
    difficulty_level?: DifficultyLevel;
    is_published?: boolean;
    created_by?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ curricula: CurriculumModel[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (filters?.domain) {
      conditions.push(`domain = $${paramIndex}`);
      values.push(filters.domain);
      paramIndex++;
    }

    if (filters?.category) {
      conditions.push(`category = $${paramIndex}`);
      values.push(filters.category);
      paramIndex++;
    }

    if (filters?.specialization) {
      conditions.push(`specialization = $${paramIndex}`);
      values.push(filters.specialization);
      paramIndex++;
    }

    if (filters?.difficulty_level) {
      conditions.push(`difficulty_level = $${paramIndex}`);
      values.push(filters.difficulty_level);
      paramIndex++;
    }

    if (filters?.is_published !== undefined) {
      conditions.push(`is_published = $${paramIndex}`);
      values.push(filters.is_published);
      paramIndex++;
    }

    if (filters?.created_by) {
      conditions.push(`created_by = $${paramIndex}`);
      values.push(filters.created_by);
      paramIndex++;
    }

    if (filters?.search) {
      conditions.push(
        `(title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`
      );
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM curricula ${whereClause}`;
    const countResult = await database.query(countQuery, values);
    const total = parseInt(countResult.rows[0].count, 10);

    // Get curricula with pagination
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;

    const query = `
      SELECT * FROM curricula
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    values.push(limit, offset);

    const result = await database.query<Curriculum>(query, values);
    const curricula = result.rows.map((row) => new CurriculumModel(row));

    return { curricula, total };
  }

  /**
   * Create a new curriculum
   */
  async create(
    data: CurriculumCreateInput,
    createdBy: string
  ): Promise<CurriculumModel> {
    const query = `
      INSERT INTO curricula (
        title,
        description,
        domain,
        category,
        specialization,
        difficulty_level,
        created_by,
        estimated_duration_hours,
        tags,
        metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    const values = [
      data.title,
      data.description || null,
      data.domain || null,
      data.category || null,
      data.specialization || null,
      data.difficulty_level,
      createdBy,
      data.estimated_duration_hours || null,
      data.tags || null,
      data.metadata ? JSON.stringify(data.metadata) : null,
    ];

    const result = await database.query<Curriculum>(query, values);
    return new CurriculumModel(result.rows[0]);
  }

  /**
   * Update a curriculum
   */
  async update(
    id: string,
    updates: CurriculumUpdateInput
  ): Promise<CurriculumModel | null> {
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

    if (updates.domain !== undefined) {
      fields.push(`domain = $${paramIndex}`);
      values.push(updates.domain);
      paramIndex++;
    }

    if (updates.category !== undefined) {
      fields.push(`category = $${paramIndex}`);
      values.push(updates.category);
      paramIndex++;
    }

    if (updates.specialization !== undefined) {
      fields.push(`specialization = $${paramIndex}`);
      values.push(updates.specialization);
      paramIndex++;
    }

    if (updates.difficulty_level !== undefined) {
      fields.push(`difficulty_level = $${paramIndex}`);
      values.push(updates.difficulty_level);
      paramIndex++;
    }

    if (updates.is_published !== undefined) {
      fields.push(`is_published = $${paramIndex}`);
      values.push(updates.is_published);
      paramIndex++;
    }

    if (updates.estimated_duration_hours !== undefined) {
      fields.push(`estimated_duration_hours = $${paramIndex}`);
      values.push(updates.estimated_duration_hours);
      paramIndex++;
    }

    if (updates.tags !== undefined) {
      fields.push(`tags = $${paramIndex}`);
      values.push(updates.tags);
      paramIndex++;
    }

    if (updates.metadata !== undefined) {
      fields.push(`metadata = $${paramIndex}`);
      values.push(JSON.stringify(updates.metadata));
      paramIndex++;
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    values.push(id);
    const query = `
      UPDATE curricula
      SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await database.query<Curriculum>(query, values);
    return result.rows[0] ? new CurriculumModel(result.rows[0]) : null;
  }

  /**
   * Delete a curriculum
   */
  async delete(id: string): Promise<boolean> {
    const result = await database.query('DELETE FROM curricula WHERE id = $1', [id]);
    return (result.rowCount || 0) > 0;
  }

  /**
   * Publish a curriculum
   */
  async publish(id: string): Promise<CurriculumModel | null> {
    return this.update(id, { is_published: true });
  }

  /**
   * Unpublish a curriculum
   */
  async unpublish(id: string): Promise<CurriculumModel | null> {
    return this.update(id, { is_published: false });
  }

  /**
   * Get curricula by domain
   */
  async findByDomain(domain: string, isPublished: boolean = true): Promise<CurriculumModel[]> {
    const result = await this.findAll({
      domain,
      is_published: isPublished,
    });
    return result.curricula;
  }

  /**
   * Get curricula created by a specific user
   */
  async findByCreator(userId: string): Promise<CurriculumModel[]> {
    const result = await this.findAll({
      created_by: userId,
    });
    return result.curricula;
  }

  /**
   * Search curricula by title or description
   */
  async search(searchTerm: string, isPublished: boolean = true): Promise<CurriculumModel[]> {
    const result = await this.findAll({
      search: searchTerm,
      is_published: isPublished,
    });
    return result.curricula;
  }
}

export const curriculumRepository = new CurriculumRepository();
