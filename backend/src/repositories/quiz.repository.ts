import { database } from '../config/database.config';
import { Quiz, QuizQuestion, QuizQuestionOption, QuizAttempt } from '../models/quiz.model';

export class QuizRepository {
  /**
   * Create a new quiz
   */
  async create(quizData: {
    topic_id: string;
    title: string;
    description?: string;
    passing_score?: number;
    time_limit_minutes?: number;
    shuffle_questions?: boolean;
    show_answers_after_completion?: boolean;
    allow_retakes?: boolean;
    max_attempts?: number;
    is_published?: boolean;
    generated_by_ai?: boolean;
    ai_provider_id?: string;
    created_by: string;
  }): Promise<Quiz> {
    const result = await database.query<any>(
      `INSERT INTO quizzes (
        topic_id, title, description, passing_score, time_limit_minutes,
        shuffle_questions, show_answers_after_completion, allow_retakes,
        max_attempts, is_published, generated_by_ai, ai_provider_id, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        quizData.topic_id,
        quizData.title,
        quizData.description,
        quizData.passing_score || 70,
        quizData.time_limit_minutes,
        quizData.shuffle_questions ?? true,
        quizData.show_answers_after_completion ?? true,
        quizData.allow_retakes ?? true,
        quizData.max_attempts,
        quizData.is_published ?? false,
        quizData.generated_by_ai ?? false,
        quizData.ai_provider_id,
        quizData.created_by,
      ]
    );
    return new Quiz(result.rows[0]);
  }

  /**
   * Find quiz by ID
   */
  async findById(id: string): Promise<Quiz | null> {
    const result = await database.query<any>(
      'SELECT * FROM quizzes WHERE id = $1',
      [id]
    );
    return result.rows[0] ? new Quiz(result.rows[0]) : null;
  }

  /**
   * Find all quizzes for a topic
   */
  async findByTopicId(topicId: string, includeUnpublished = false): Promise<Quiz[]> {
    const query = includeUnpublished
      ? 'SELECT * FROM quizzes WHERE topic_id = $1 ORDER BY created_at DESC'
      : 'SELECT * FROM quizzes WHERE topic_id = $1 AND is_published = true ORDER BY created_at DESC';

    const result = await database.query<any>(query, [topicId]);
    return result.rows.map((row) => new Quiz(row));
  }

  /**
   * Update quiz
   */
  async update(id: string, updates: Partial<Quiz>): Promise<Quiz | null> {
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
      `UPDATE quizzes SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount} RETURNING *`,
      values
    );

    return result.rows[0] ? new Quiz(result.rows[0]) : null;
  }

  /**
   * Delete quiz
   */
  async delete(id: string): Promise<boolean> {
    const result = await database.query(
      'DELETE FROM quizzes WHERE id = $1',
      [id]
    );
    return (result.rowCount || 0) > 0;
  }

  /**
   * Add question to quiz
   */
  async addQuestion(questionData: {
    quiz_id: string;
    question_type: string;
    question_text: string;
    explanation?: string;
    points?: number;
    order_index?: number;
    generated_by_ai?: boolean;
  }): Promise<QuizQuestion> {
    const result = await database.query<any>(
      `INSERT INTO quiz_questions (
        quiz_id, question_type, question_text, explanation, points, order_index, generated_by_ai
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [
        questionData.quiz_id,
        questionData.question_type,
        questionData.question_text,
        questionData.explanation,
        questionData.points || 1,
        questionData.order_index ?? 0,
        questionData.generated_by_ai ?? false,
      ]
    );
    return new QuizQuestion(result.rows[0]);
  }

  /**
   * Get all questions for a quiz
   */
  async getQuestions(quizId: string): Promise<QuizQuestion[]> {
    const result = await database.query<any>(
      'SELECT * FROM quiz_questions WHERE quiz_id = $1 ORDER BY order_index ASC',
      [quizId]
    );
    return result.rows.map((row) => new QuizQuestion(row));
  }

  /**
   * Add option to question
   */
  async addQuestionOption(optionData: {
    question_id: string;
    option_text: string;
    is_correct: boolean;
    explanation?: string;
    order_index?: number;
  }): Promise<QuizQuestionOption> {
    const result = await database.query<any>(
      `INSERT INTO quiz_question_options (
        question_id, option_text, is_correct, explanation, order_index
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *`,
      [
        optionData.question_id,
        optionData.option_text,
        optionData.is_correct,
        optionData.explanation,
        optionData.order_index ?? 0,
      ]
    );
    return new QuizQuestionOption(result.rows[0]);
  }

  /**
   * Get options for a question
   */
  async getQuestionOptions(questionId: string): Promise<QuizQuestionOption[]> {
    const result = await database.query<any>(
      'SELECT * FROM quiz_question_options WHERE question_id = $1 ORDER BY order_index ASC',
      [questionId]
    );
    return result.rows.map((row) => new QuizQuestionOption(row));
  }

  /**
   * Start a quiz attempt
   */
  async startAttempt(userId: string, quizId: string): Promise<QuizAttempt> {
    // Get attempt number
    const countResult = await database.query<{ count: string }>(
      'SELECT COUNT(*) as count FROM quiz_attempts WHERE user_id = $1 AND quiz_id = $2',
      [userId, quizId]
    );
    const attemptNumber = parseInt(countResult.rows[0].count) + 1;

    const result = await database.query<any>(
      `INSERT INTO quiz_attempts (quiz_id, user_id, attempt_number)
       VALUES ($1, $2, $3) RETURNING *`,
      [quizId, userId, attemptNumber]
    );
    return new QuizAttempt(result.rows[0]);
  }

  /**
   * Submit answer for quiz attempt
   */
  async submitAnswer(answerData: {
    attempt_id: string;
    question_id: string;
    selected_option_id?: string;
    text_answer?: string;
  }): Promise<void> {
    // Get question details
    const questionResult = await database.query<any>(
      'SELECT points FROM quiz_questions WHERE id = $1',
      [answerData.question_id]
    );
    const questionPoints = questionResult.rows[0]?.points || 0;

    let isCorrect = false;
    let pointsEarned = 0;

    if (answerData.selected_option_id) {
      // Check if selected option is correct
      const optionResult = await database.query<any>(
        'SELECT is_correct FROM quiz_question_options WHERE id = $1',
        [answerData.selected_option_id]
      );
      isCorrect = optionResult.rows[0]?.is_correct || false;
      pointsEarned = isCorrect ? questionPoints : 0;
    }

    await database.query(
      `INSERT INTO quiz_attempt_answers (
        attempt_id, question_id, selected_option_id, text_answer, is_correct, points_earned
      ) VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        selected_option_id = $3,
        text_answer = $4,
        is_correct = $5,
        points_earned = $6`,
      [
        answerData.attempt_id,
        answerData.question_id,
        answerData.selected_option_id,
        answerData.text_answer,
        isCorrect,
        pointsEarned,
      ]
    );
  }

  /**
   * Complete quiz attempt
   */
  async completeAttempt(attemptId: string): Promise<QuizAttempt | null> {
    const result = await database.query<any>(
      `UPDATE quiz_attempts
       SET is_completed = true,
           submitted_at = CURRENT_TIMESTAMP,
           time_taken_seconds = EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - started_at))
       WHERE id = $1 RETURNING *`,
      [attemptId]
    );
    return result.rows[0] ? new QuizAttempt(result.rows[0]) : null;
  }

  /**
   * Get user's quiz attempts
   */
  async getUserAttempts(userId: string, quizId: string): Promise<QuizAttempt[]> {
    const result = await database.query<any>(
      `SELECT * FROM quiz_attempts
       WHERE user_id = $1 AND quiz_id = $2
       ORDER BY attempt_number DESC`,
      [userId, quizId]
    );
    return result.rows.map((row) => new QuizAttempt(row));
  }

  /**
   * Get attempt with answers
   */
  async getAttemptWithAnswers(attemptId: string): Promise<any> {
    const attempt = await database.query<any>(
      'SELECT * FROM quiz_attempts WHERE id = $1',
      [attemptId]
    );

    if (!attempt.rows[0]) return null;

    const answers = await database.query<any>(
      `SELECT qa.*, q.question_text, q.explanation as question_explanation,
              o.option_text, o.explanation as option_explanation
       FROM quiz_attempt_answers qa
       JOIN quiz_questions q ON qa.question_id = q.id
       LEFT JOIN quiz_question_options o ON qa.selected_option_id = o.id
       WHERE qa.attempt_id = $1`,
      [attemptId]
    );

    return {
      ...new QuizAttempt(attempt.rows[0]).toJSON(),
      answers: answers.rows,
    };
  }
}

export const quizRepository = new QuizRepository();
