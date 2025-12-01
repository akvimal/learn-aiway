import { exerciseRepository } from '../repositories/exercise.repository';
import { Exercise, ExerciseHint, ExerciseTestCase } from '../models/exercise.model';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.util';
import { logger } from '../config/logger.config';

export interface CreateExerciseRequest {
  topicId: string;
  title: string;
  description: string;
  instructions: string;
  language: 'javascript' | 'java' | 'python';
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  starterCode?: string;
  solutionCode?: string;
  explanation?: string;
  points?: number;
  timeLimitSeconds?: number;
  isPublished?: boolean;
}

export interface CreateTestCaseRequest {
  testName: string;
  testType?: 'public' | 'hidden' | 'edge_case';
  inputData?: any;
  expectedOutput?: any;
  stdin?: string;
  expectedStdout?: string;
  points?: number;
  isHidden?: boolean;
  orderIndex?: number;
}

export interface CreateHintRequest {
  hintLevel: number;
  hintText: string;
  revealsSolution?: boolean;
}

export class ExerciseService {
  /**
   * Create a new exercise
   */
  async createExercise(
    data: CreateExerciseRequest,
    userId: string
  ): Promise<Exercise> {
    try {
      // Validate required fields
      if (!data.title || !data.description || !data.instructions) {
        throw new BadRequestError('Title, description, and instructions are required');
      }

      if (!data.solutionCode) {
        throw new BadRequestError('Solution code is required');
      }

      const exercise = await exerciseRepository.create({
        topic_id: data.topicId,
        title: data.title,
        description: data.description,
        instructions: data.instructions,
        language: data.language,
        difficulty_level: data.difficultyLevel,
        starter_code: data.starterCode,
        solution_code: data.solutionCode,
        explanation: data.explanation,
        points: data.points ?? 10,
        time_limit_seconds: data.timeLimitSeconds ?? 300,
        is_published: data.isPublished ?? false,
        created_by: userId,
      });

      logger.info('Exercise created', {
        exerciseId: exercise.id,
        topicId: data.topicId,
        userId,
      });

      return exercise;
    } catch (error) {
      logger.error('Failed to create exercise', error);
      throw error;
    }
  }

  /**
   * Get exercise by ID
   */
  async getExercise(exerciseId: string, userId: string, userRole: string): Promise<any> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // Check if user can access unpublished exercises
    const includeHiddenTests = userRole === 'instructor' || userRole === 'admin';

    return exerciseRepository.getExerciseWithDetails(exerciseId, includeHiddenTests);
  }

  /**
   * Get exercises for a topic
   */
  async getExercisesByTopic(
    topicId: string,
    userRole: string
  ): Promise<Exercise[]> {
    const includeUnpublished = userRole === 'instructor' || userRole === 'admin';
    return exerciseRepository.findByTopicId(topicId, includeUnpublished);
  }

  /**
   * Update exercise
   */
  async updateExercise(
    exerciseId: string,
    updates: Partial<CreateExerciseRequest>,
    userId: string,
    userRole: string
  ): Promise<Exercise> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // Only creator, instructors, or admins can update
    if (exercise.created_by !== userId && userRole !== 'instructor' && userRole !== 'admin') {
      throw new ForbiddenError('You do not have permission to update this exercise');
    }

    const updateData: any = {};
    if (updates.title) updateData.title = updates.title;
    if (updates.description) updateData.description = updates.description;
    if (updates.instructions) updateData.instructions = updates.instructions;
    if (updates.language) updateData.language = updates.language;
    if (updates.difficultyLevel) updateData.difficulty_level = updates.difficultyLevel;
    if (updates.starterCode !== undefined) updateData.starter_code = updates.starterCode;
    if (updates.solutionCode !== undefined) updateData.solution_code = updates.solutionCode;
    if (updates.explanation !== undefined) updateData.explanation = updates.explanation;
    if (updates.points !== undefined) updateData.points = updates.points;
    if (updates.timeLimitSeconds !== undefined) updateData.time_limit_seconds = updates.timeLimitSeconds;
    if (updates.isPublished !== undefined) updateData.is_published = updates.isPublished;

    const updated = await exerciseRepository.update(exerciseId, updateData);

    if (!updated) {
      throw new NotFoundError('Exercise not found after update');
    }

    logger.info('Exercise updated', {
      exerciseId,
      userId,
    });

    return updated;
  }

  /**
   * Delete exercise
   */
  async deleteExercise(
    exerciseId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // Only creator, instructors, or admins can delete
    if (exercise.created_by !== userId && userRole !== 'instructor' && userRole !== 'admin') {
      throw new ForbiddenError('You do not have permission to delete this exercise');
    }

    await exerciseRepository.delete(exerciseId);

    logger.info('Exercise deleted', {
      exerciseId,
      userId,
    });
  }

  /**
   * Add test case to exercise
   */
  async addTestCase(
    exerciseId: string,
    testCaseData: CreateTestCaseRequest,
    userId: string
  ): Promise<ExerciseTestCase> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    const testCase = await exerciseRepository.addTestCase({
      exercise_id: exerciseId,
      test_name: testCaseData.testName,
      test_type: testCaseData.testType || 'public',
      input_data: testCaseData.inputData,
      expected_output: testCaseData.expectedOutput,
      stdin: testCaseData.stdin,
      expected_stdout: testCaseData.expectedStdout,
      points: testCaseData.points ?? 1,
      is_hidden: testCaseData.isHidden ?? false,
      order_index: testCaseData.orderIndex,
      created_by: userId,
    });

    logger.info('Test case added', {
      exerciseId,
      testCaseId: testCase.id,
      userId,
    });

    return testCase;
  }

  /**
   * Get test cases for exercise
   */
  async getTestCases(
    exerciseId: string,
    userRole: string
  ): Promise<ExerciseTestCase[]> {
    const includeHidden = userRole === 'instructor' || userRole === 'admin';
    return exerciseRepository.getTestCases(exerciseId, includeHidden);
  }

  /**
   * Delete test case
   */
  async deleteTestCase(testCaseId: string): Promise<void> {
    const deleted = await exerciseRepository.deleteTestCase(testCaseId);
    if (!deleted) {
      throw new NotFoundError('Test case not found');
    }
  }

  /**
   * Add hint to exercise
   */
  async addHint(
    exerciseId: string,
    hintData: CreateHintRequest,
    userId: string
  ): Promise<ExerciseHint> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    const hint = await exerciseRepository.addHint({
      exercise_id: exerciseId,
      hint_level: hintData.hintLevel,
      hint_text: hintData.hintText,
      reveals_solution: hintData.revealsSolution ?? false,
      created_by: userId,
    });

    logger.info('Hint added', {
      exerciseId,
      hintId: hint.id,
      userId,
    });

    return hint;
  }

  /**
   * Get hints for exercise
   */
  async getHints(exerciseId: string): Promise<ExerciseHint[]> {
    return exerciseRepository.getHints(exerciseId);
  }

  /**
   * Request a hint (tracks usage)
   */
  async requestHint(
    exerciseId: string,
    hintLevel: number,
    userId: string
  ): Promise<ExerciseHint | null> {
    const hints = await exerciseRepository.getHints(exerciseId);
    const hint = hints.find(h => h.hint_level === hintLevel);

    if (!hint) {
      return null;
    }

    // Track hint usage
    await exerciseRepository.trackHintUsage(userId, hint.id);

    logger.info('Hint requested', {
      exerciseId,
      hintId: hint.id,
      hintLevel,
      userId,
    });

    return hint;
  }

  /**
   * Get hint usage for user
   */
  async getHintUsage(exerciseId: string, userId: string): Promise<string[]> {
    return exerciseRepository.getHintUsage(userId, exerciseId);
  }

  /**
   * Delete hint
   */
  async deleteHint(hintId: string): Promise<void> {
    const deleted = await exerciseRepository.deleteHint(hintId);
    if (!deleted) {
      throw new NotFoundError('Hint not found');
    }
  }

  /**
   * Link exercise to learning objectives
   */
  async linkToObjectives(
    exerciseId: string,
    objectiveIds: string[],
    userId: string,
    userRole: string
  ): Promise<void> {
    const exercise = await exerciseRepository.findById(exerciseId);

    if (!exercise) {
      throw new NotFoundError('Exercise not found');
    }

    // Only creator, instructors, or admins can link objectives
    if (exercise.created_by !== userId && userRole !== 'instructor' && userRole !== 'admin') {
      throw new ForbiddenError('You do not have permission to modify this exercise');
    }

    await exerciseRepository.linkToObjectives(exerciseId, objectiveIds);

    logger.info('Exercise linked to objectives', {
      exerciseId,
      objectiveIds,
      userId,
    });
  }

  /**
   * Get linked learning objectives for an exercise
   */
  async getLinkedObjectives(exerciseId: string): Promise<any[]> {
    return exerciseRepository.getLinkedObjectives(exerciseId);
  }

  /**
   * Get exercises for a learning objective
   */
  async getExercisesByObjective(objectiveId: string): Promise<any[]> {
    const exercises = await exerciseRepository.findByObjectiveId(objectiveId);
    return exercises.map(e => e.toJSON());
  }
}

export const exerciseService = new ExerciseService();
