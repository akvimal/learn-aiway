import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { aiContentGeneratorService } from '../../services/aiContentGenerator.service';
import { BadRequestError } from '../../utils/errors.util';

/**
 * Generate a content variation for a topic
 * POST /api/v1/ai/generate/topic-content
 */
export const generateTopicContent = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      topicId,
      topicTitle,
      topicContent,
      difficultyLevel,
      providerId,
      variationType,
    } = req.body;

    // Validation
    if (!topicId || !topicTitle || !topicContent || !difficultyLevel || !providerId || !variationType) {
      throw new BadRequestError('Missing required fields');
    }

    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel)) {
      throw new BadRequestError('Invalid difficulty level');
    }

    const validVariationTypes = ['explanation', 'example', 'analogy', 'summary', 'deep_dive'];
    if (!validVariationTypes.includes(variationType)) {
      throw new BadRequestError('Invalid variation type');
    }

    const content = await aiContentGeneratorService.generateTopicContentVariation(
      {
        topicId,
        topicTitle,
        topicContent,
        difficultyLevel,
        providerId,
        variationType,
      },
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        content,
        variationType,
        difficultyLevel,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate a programming exercise
 * POST /api/v1/ai/generate/exercise
 */
export const generateExercise = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      topicId,
      topicTitle,
      topicContent,
      language,
      difficultyLevel,
      providerId,
      exerciseDescription,
    } = req.body;

    // Validation
    if (!topicId || !topicTitle || !topicContent || !language || !difficultyLevel || !providerId) {
      throw new BadRequestError('Missing required fields');
    }

    const validLanguages = ['javascript', 'java'];
    if (!validLanguages.includes(language)) {
      throw new BadRequestError('Invalid language. Supported: javascript, java');
    }

    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel)) {
      throw new BadRequestError('Invalid difficulty level');
    }

    const exercise = await aiContentGeneratorService.generateExercise(
      {
        topicId,
        topicTitle,
        topicContent,
        language,
        difficultyLevel,
        providerId,
        exerciseDescription,
      },
      userId
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
 * Generate hints for an exercise
 * POST /api/v1/ai/generate/hints
 */
export const generateHints = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      exerciseId,
      exerciseTitle,
      exerciseDescription,
      solutionCode,
      providerId,
      numHints,
    } = req.body;

    // Validation
    if (!exerciseId || !exerciseTitle || !exerciseDescription || !solutionCode || !providerId) {
      throw new BadRequestError('Missing required fields');
    }

    const hints = await aiContentGeneratorService.generateHints(
      {
        exerciseId,
        exerciseTitle,
        exerciseDescription,
        solutionCode,
        providerId,
        numHints: numHints || 3,
      },
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        hints,
        count: hints.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate test cases for an exercise
 * POST /api/v1/ai/generate/test-cases
 */
export const generateTestCases = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      exerciseId,
      exerciseTitle,
      exerciseDescription,
      solutionCode,
      language,
      providerId,
      numTestCases,
    } = req.body;

    // Validation
    if (!exerciseId || !exerciseTitle || !exerciseDescription || !solutionCode || !language || !providerId) {
      throw new BadRequestError('Missing required fields');
    }

    const validLanguages = ['javascript', 'java'];
    if (!validLanguages.includes(language)) {
      throw new BadRequestError('Invalid language. Supported: javascript, java');
    }

    const testCases = await aiContentGeneratorService.generateTestCases(
      {
        exerciseId,
        exerciseTitle,
        exerciseDescription,
        solutionCode,
        language,
        providerId,
        numTestCases: numTestCases || 5,
      },
      userId
    );

    res.status(200).json({
      success: true,
      data: {
        testCases,
        count: testCases.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate topics for a curriculum
 * POST /api/v1/ai/generate/topics
 */
export const generateTopics = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      curriculumId,
      curriculumTitle,
      curriculumDescription,
      difficultyLevel,
      domain,
      providerId,
      numTopics,
    } = req.body;

    // Validation
    if (!curriculumId || !curriculumTitle || !difficultyLevel || !domain) {
      throw new BadRequestError('Missing required fields');
    }

    if (!providerId) {
      throw new BadRequestError('providerId is required');
    }

    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel)) {
      throw new BadRequestError('Invalid difficulty level');
    }

    const topics = await aiContentGeneratorService.generateCurriculumTopics(
      {
        curriculumId,
        curriculumTitle,
        curriculumDescription,
        difficultyLevel,
        domain,
        numTopics: numTopics || 5,
      },
      userId,
      providerId
    );

    res.status(200).json({
      success: true,
      data: {
        topics,
        count: topics.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate learning objectives for a topic
 * POST /api/v1/ai/generate/objectives
 */
export const generateObjectives = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const {
      topicId,
      topicTitle,
      topicDescription,
      topicContent,
      difficultyLevel,
      providerId,
      numObjectives,
    } = req.body;

    // Validation
    if (!topicId || !topicTitle || !difficultyLevel) {
      throw new BadRequestError('Missing required fields');
    }

    if (!providerId) {
      throw new BadRequestError('providerId is required');
    }

    const validDifficultyLevels = ['beginner', 'intermediate', 'advanced'];
    if (!validDifficultyLevels.includes(difficultyLevel)) {
      throw new BadRequestError('Invalid difficulty level');
    }

    const objectives = await aiContentGeneratorService.generateLearningObjectives(
      {
        topicId,
        topicTitle,
        topicDescription: topicDescription || '',
        topicContent: topicContent || '',
        difficultyLevel,
        numObjectives: numObjectives || 5,
      },
      userId,
      providerId
    );

    res.status(200).json({
      success: true,
      data: {
        objectives,
        count: objectives.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the latest review for a topic
 * GET /api/v1/ai/review/topic/:topicId
 */
export const getLatestTopicReview = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { topicId } = req.params;

    if (!topicId) {
      throw new BadRequestError('topicId is required');
    }

    const review = await aiContentGeneratorService.getLatestTopicReview(topicId);

    if (!review) {
      res.status(200).json({
        success: true,
        data: null,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Review topic quality and alignment with AI
 * POST /api/v1/ai/review/topic
 */
export const reviewTopic = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { topicData, providerId } = req.body;

    // Validation
    if (!topicData || !providerId) {
      throw new BadRequestError('Missing required fields: topicData and providerId');
    }

    if (!topicData.topic) {
      throw new BadRequestError('topicData must include topic information');
    }

    const review = await aiContentGeneratorService.reviewTopicQuality(
      topicData,
      providerId,
      userId
    );

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deep dive analysis on a specific finding
 * POST /api/v1/ai/review/finding/deep-dive
 */
export const deepDiveFinding = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { topicData, finding, providerId } = req.body;

    // Validation
    if (!topicData || !finding || !providerId) {
      throw new BadRequestError('Missing required fields: topicData, finding, and providerId');
    }

    const enhancedFinding = await aiContentGeneratorService.deepDiveFinding(
      topicData,
      finding,
      providerId,
      userId
    );

    res.status(200).json({
      success: true,
      data: enhancedFinding,
    });
  } catch (error) {
    next(error);
  }
};
