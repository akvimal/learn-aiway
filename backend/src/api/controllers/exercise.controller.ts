import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { exerciseService } from '../../services/exercise.service';
import { BadRequestError } from '../../utils/errors.util';

/**
 * Create a new exercise
 * POST /api/v1/topics/:topicId/exercises
 */
export const createExercise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    const userId = req.user!.userId;
    const {
      title,
      description,
      instructions,
      language,
      difficultyLevel,
      starterCode,
      solutionCode,
      explanation,
      points,
      timeLimitSeconds,
      isPublished,
    } = req.body;

    const exercise = await exerciseService.createExercise(
      {
        topicId,
        title,
        description,
        instructions,
        language,
        difficultyLevel,
        starterCode,
        solutionCode,
        explanation,
        points,
        timeLimitSeconds,
        isPublished,
      },
      userId
    );

    res.status(201).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exercise by ID
 * GET /api/v1/exercises/:exerciseId
 */
export const getExercise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const exercise = await exerciseService.getExercise(exerciseId, userId, userRole);

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exercises for a topic
 * GET /api/v1/topics/:topicId/exercises
 */
export const getExercisesByTopic = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;
    const userRole = req.user!.role;

    const exercises = await exerciseService.getExercisesByTopic(topicId, userRole);

    res.status(200).json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update exercise
 * PATCH /api/v1/exercises/:exerciseId
 */
export const updateExercise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    const exercise = await exerciseService.updateExercise(
      exerciseId,
      req.body,
      userId,
      userRole
    );

    res.status(200).json({
      success: true,
      data: exercise,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete exercise
 * DELETE /api/v1/exercises/:exerciseId
 */
export const deleteExercise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    await exerciseService.deleteExercise(exerciseId, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Exercise deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add test case to exercise
 * POST /api/v1/exercises/:exerciseId/test-cases
 */
export const addTestCase = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;
    const testCaseData = req.body;

    const testCase = await exerciseService.addTestCase(
      exerciseId,
      testCaseData,
      userId
    );

    res.status(201).json({
      success: true,
      data: testCase,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get test cases for exercise
 * GET /api/v1/exercises/:exerciseId/test-cases
 */
export const getTestCases = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userRole = req.user!.role;

    const testCases = await exerciseService.getTestCases(exerciseId, userRole);

    res.status(200).json({
      success: true,
      data: testCases,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete test case
 * DELETE /api/v1/test-cases/:testCaseId
 */
export const deleteTestCase = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { testCaseId } = req.params;

    await exerciseService.deleteTestCase(testCaseId);

    res.status(200).json({
      success: true,
      message: 'Test case deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add hint to exercise
 * POST /api/v1/exercises/:exerciseId/hints
 */
export const addHint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;
    const hintData = req.body;

    const hint = await exerciseService.addHint(exerciseId, hintData, userId);

    res.status(201).json({
      success: true,
      data: hint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hints for exercise
 * GET /api/v1/exercises/:exerciseId/hints
 */
export const getHints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;

    const hints = await exerciseService.getHints(exerciseId);

    res.status(200).json({
      success: true,
      data: hints,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Request a hint (learner endpoint - tracks usage)
 * POST /api/v1/exercises/:exerciseId/hints/:hintLevel/request
 */
export const requestHint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId, hintLevel } = req.params;
    const userId = req.user!.userId;

    const hint = await exerciseService.requestHint(
      exerciseId,
      parseInt(hintLevel),
      userId
    );

    if (!hint) {
      throw new BadRequestError('Hint not found at this level');
    }

    res.status(200).json({
      success: true,
      data: hint,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get hint usage for current user
 * GET /api/v1/exercises/:exerciseId/hints/usage
 */
export const getHintUsage = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const userId = req.user!.userId;

    const hintIds = await exerciseService.getHintUsage(exerciseId, userId);

    res.status(200).json({
      success: true,
      data: hintIds,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete hint
 * DELETE /api/v1/hints/:hintId
 */
export const deleteHint = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { hintId } = req.params;

    await exerciseService.deleteHint(hintId);

    res.status(200).json({
      success: true,
      message: 'Hint deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Link exercise to learning objectives
 * POST /api/v1/exercises/:exerciseId/objectives
 */
export const linkToObjectives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;
    const { objectiveIds } = req.body;
    const userId = req.user!.userId;
    const userRole = req.user!.role;

    if (!Array.isArray(objectiveIds)) {
      throw new BadRequestError('objectiveIds must be an array');
    }

    await exerciseService.linkToObjectives(exerciseId, objectiveIds, userId, userRole);

    res.status(200).json({
      success: true,
      message: 'Exercise linked to objectives successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get linked learning objectives for exercise
 * GET /api/v1/exercises/:exerciseId/objectives
 */
export const getLinkedObjectives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { exerciseId } = req.params;

    const objectives = await exerciseService.getLinkedObjectives(exerciseId);

    res.status(200).json({
      success: true,
      data: objectives,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get exercises for a learning objective
 * GET /api/v1/objectives/:objectiveId/exercises
 */
export const getExercisesByObjective = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { objectiveId } = req.params;

    const exercises = await exerciseService.getExercisesByObjective(objectiveId);

    res.status(200).json({
      success: true,
      data: exercises,
    });
  } catch (error) {
    next(error);
  }
};
