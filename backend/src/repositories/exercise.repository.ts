import { database } from '../config/database.config';
import { Exercise, ExerciseHint, ExerciseTestCase } from '../models/exercise.model';

export class ExerciseRepository {
  /**
   * Create a new exercise
   */
  async create(exerciseData: {
    topic_id: string;
    title: string;
    description: string;
    instructions: string;
    language: string;
    difficulty_level: string;
    starter_code?: string;
    solution_code?: string;
    explanation?: string;
    order_index?: number;
    points?: number;
    time_limit_seconds?: number;
    is_published?: boolean;
    created_by: string;
  }): Promise<Exercise> {
    const result = await database.query<any>(
      `INSERT INTO exercises (
        topic_id, title, description, instructions, language, difficulty_level,
        starter_code, solution_code, explanation, order_index, points,
        time_limit_seconds, is_published, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        exerciseData.topic_id,
        exerciseData.title,
        exerciseData.description,
        exerciseData.instructions,
        exerciseData.language,
        exerciseData.difficulty_level,
        exerciseData.starter_code,
        exerciseData.solution_code,
        exerciseData.explanation,
        exerciseData.order_index ?? 0,
        exerciseData.points ?? 10,
        exerciseData.time_limit_seconds ?? 300,
        exerciseData.is_published ?? false,
        exerciseData.created_by,
      ]
    );
    return new Exercise(result.rows[0]);
  }

  /**
   * Find exercise by ID
   */
  async findById(id: string): Promise<Exercise | null> {
    const result = await database.query<any>(
      'SELECT * FROM exercises WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new Exercise(result.rows[0]) : null;
  }

  /**
   * Find exercises by topic
   */
  async findByTopicId(topicId: string, includeUnpublished = false): Promise<Exercise[]> {
    const query = includeUnpublished
      ? 'SELECT * FROM exercises WHERE topic_id = $1 ORDER BY order_index ASC'
      : 'SELECT * FROM exercises WHERE topic_id = $1 AND is_published = true ORDER BY order_index ASC';

    const result = await database.query<any>(query, [topicId]);
    return result.rows.map((row) => new Exercise(row));
  }

  /**
   * Update exercise
   */
  async update(id: string, updates: Partial<Exercise>): Promise<Exercise | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    Object.entries(updates).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'created_at' && key !== 'updated_at') {
        fields.push(`${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
    });

    if (fields.length === 0) return this.findById(id);

    values.push(id);
    const result = await database.query<any>(
      `UPDATE exercises SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] ? new Exercise(result.rows[0]) : null;
  }

  /**
   * Delete exercise
   */
  async delete(id: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM exercises WHERE id = $1',
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Add hint to exercise
   */
  async addHint(hintData: {
    exercise_id: string;
    hint_level: number;
    hint_text: string;
    reveals_solution?: boolean;
    generated_by_ai?: boolean;
    created_by: string;
  }): Promise<ExerciseHint> {
    const result = await database.query<any>(
      `INSERT INTO exercise_hints (
        exercise_id, hint_level, hint_text, reveals_solution, generated_by_ai, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *`,
      [
        hintData.exercise_id,
        hintData.hint_level,
        hintData.hint_text,
        hintData.reveals_solution ?? false,
        hintData.generated_by_ai ?? false,
        hintData.created_by,
      ]
    );
    return new ExerciseHint(result.rows[0]);
  }

  /**
   * Get hints for exercise
   */
  async getHints(exerciseId: string): Promise<ExerciseHint[]> {
    const result = await database.query<any>(
      'SELECT * FROM exercise_hints WHERE exercise_id = $1 ORDER BY hint_level ASC',
      [exerciseId]
    );
    return result.rows.map((row) => new ExerciseHint(row));
  }

  /**
   * Delete hint
   */
  async deleteHint(hintId: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM exercise_hints WHERE id = $1',
      [hintId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Add test case to exercise
   */
  async addTestCase(testCaseData: {
    exercise_id: string;
    test_name: string;
    test_type?: string;
    input_data?: any;
    expected_output?: any;
    stdin?: string;
    expected_stdout?: string;
    points?: number;
    is_hidden?: boolean;
    timeout_ms?: number;
    order_index?: number;
    generated_by_ai?: boolean;
    created_by: string;
  }): Promise<ExerciseTestCase> {
    const result = await database.query<any>(
      `INSERT INTO exercise_test_cases (
        exercise_id, test_name, test_type, input_data, expected_output,
        stdin, expected_stdout, points, is_hidden, timeout_ms, order_index,
        generated_by_ai, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        testCaseData.exercise_id,
        testCaseData.test_name,
        testCaseData.test_type || 'public',
        testCaseData.input_data,
        testCaseData.expected_output,
        testCaseData.stdin,
        testCaseData.expected_stdout,
        testCaseData.points ?? 1,
        testCaseData.is_hidden ?? false,
        testCaseData.timeout_ms ?? 5000,
        testCaseData.order_index ?? 0,
        testCaseData.generated_by_ai ?? false,
        testCaseData.created_by,
      ]
    );
    return new ExerciseTestCase(result.rows[0]);
  }

  /**
   * Get test cases for exercise
   */
  async getTestCases(exerciseId: string, includeHidden = false): Promise<ExerciseTestCase[]> {
    const query = includeHidden
      ? 'SELECT * FROM exercise_test_cases WHERE exercise_id = $1 ORDER BY order_index ASC'
      : 'SELECT * FROM exercise_test_cases WHERE exercise_id = $1 AND is_hidden = false ORDER BY order_index ASC';

    const result = await database.query<any>(query, [exerciseId]);
    return result.rows.map((row) => new ExerciseTestCase(row));
  }

  /**
   * Delete test case
   */
  async deleteTestCase(testCaseId: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM exercise_test_cases WHERE id = $1',
      [testCaseId]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Get exercise with hints and test cases
   */
  async getExerciseWithDetails(exerciseId: string, includeHiddenTests = false): Promise<any> {
    const exercise = await this.findById(exerciseId);
    if (!exercise) return null;

    const hints = await this.getHints(exerciseId);
    const testCases = await this.getTestCases(exerciseId, includeHiddenTests);

    return {
      ...exercise.toJSON(),
      hints: hints.map(h => h.toJSON()),
      test_cases: testCases.map(tc => tc.toJSON()),
    };
  }

  /**
   * Track hint usage
   */
  async trackHintUsage(userId: string, hintId: string): Promise<void> {
    await database.query(
      `INSERT INTO user_hint_usage (user_id, exercise_id, hint_id)
       SELECT $1, exercise_id, $2
       FROM exercise_hints
       WHERE id = $2
       ON CONFLICT (user_id, hint_id) DO NOTHING`,
      [userId, hintId]
    );
  }

  /**
   * Get hint usage for user
   */
  async getHintUsage(userId: string, exerciseId: string): Promise<string[]> {
    const result = await database.query<{ hint_id: string }>(
      `SELECT hint_id FROM user_hint_usage WHERE user_id = $1 AND exercise_id = $2`,
      [userId, exerciseId]
    );
    return result.rows.map(row => row.hint_id);
  }

  /**
   * Link exercise to learning objectives
   */
  async linkToObjectives(exerciseId: string, objectiveIds: string[]): Promise<void> {
    // Remove existing links
    await database.query(
      'DELETE FROM exercise_objectives WHERE exercise_id = $1',
      [exerciseId]
    );

    // Add new links
    if (objectiveIds.length > 0) {
      const values = objectiveIds.map((objId, index) =>
        `($1, $${index + 2})`
      ).join(', ');

      await database.query(
        `INSERT INTO exercise_objectives (exercise_id, objective_id)
         VALUES ${values}
         ON CONFLICT (exercise_id, objective_id) DO NOTHING`,
        [exerciseId, ...objectiveIds]
      );
    }
  }

  /**
   * Get learning objectives for an exercise
   */
  async getLinkedObjectives(exerciseId: string): Promise<any[]> {
    const result = await database.query(
      `SELECT lo.*
       FROM learning_objectives lo
       JOIN exercise_objectives eo ON lo.id = eo.objective_id
       WHERE eo.exercise_id = $1
       ORDER BY lo.order_index`,
      [exerciseId]
    );
    return result.rows;
  }

  /**
   * Get exercises for a specific learning objective
   */
  async findByObjectiveId(objectiveId: string): Promise<Exercise[]> {
    const result = await database.query<any>(
      `SELECT e.*
       FROM exercises e
       JOIN exercise_objectives eo ON e.id = eo.exercise_id
       WHERE eo.objective_id = $1
       ORDER BY e.order_index`,
      [objectiveId]
    );
    return result.rows.map((row) => new Exercise(row));
  }
}

export const exerciseRepository = new ExerciseRepository();
