import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../middleware/auth.middleware';
import { quizRepository } from '../../repositories/quiz.repository';
import { quizGenerationService } from '../../services/quizGeneration.service';
import { topicRepository } from '../../repositories/topic.repository';
import { ResponseUtil } from '../../utils/response.util';
import { NotFoundError, ValidationError, UnauthorizedError } from '../../utils/errors.util';
import { logger } from '../../config/logger.config';

class QuizController {
  /**
   * Generate quiz with AI
   * POST /api/v1/quizzes/generate
   */
  async generateQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const {
        topicId,
        providerId,
        numQuestions,
        title,
        passingScore,
      } = req.body;

      if (!topicId || !providerId) {
        throw new ValidationError('topicId and providerId are required');
      }

      // Get topic details
      const topic = await topicRepository.findById(topicId);
      if (!topic) {
        throw new NotFoundError('Topic not found');
      }

      const result = await quizGenerationService.createAIGeneratedQuiz(
        {
          topicId,
          topicTitle: topic.title,
          topicContent: topic.content || undefined,
          difficultyLevel: 'intermediate',
          numQuestions: numQuestions || 5,
          title: title || `Quiz: ${topic.title}`,
          passingScore,
        },
        userId,
        providerId
      );

      logger.info('Generated quiz with AI', { userId, topicId, quizId: result.quiz.id });

      ResponseUtil.success(res, result);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create quiz manually
   * POST /api/v1/quizzes
   */
  async createQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const quizData = {
        ...req.body,
        created_by: userId,
      };

      const quiz = await quizRepository.create(quizData);

      logger.info('Created quiz', { userId, quizId: quiz.id });

      ResponseUtil.success(res, { quiz: quiz.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quiz by ID
   * GET /api/v1/quizzes/:id
   */
  async getQuizById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const quiz = await quizRepository.findById(id);
      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      const questions = await quizRepository.getQuestions(id);

      // Get options for each question
      const questionsWithOptions = await Promise.all(
        questions.map(async (question) => {
          const options = await quizRepository.getQuestionOptions(question.id);
          return {
            ...question.toJSON(),
            options: options.map(opt => opt.toJSON()),
          };
        })
      );

      ResponseUtil.success(res, {
        quiz: quiz.toJSON(),
        questions: questionsWithOptions,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get quizzes by topic
   * GET /api/v1/topics/:topicId/quizzes
   */
  async getQuizzesByTopic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { topicId } = req.params;
      const includeUnpublished = req.user?.role === 'instructor' || req.user?.role === 'admin';

      const quizzes = await quizRepository.findByTopicId(topicId, includeUnpublished);

      ResponseUtil.success(res, {
        quizzes: quizzes.map(q => q.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Start quiz attempt
   * POST /api/v1/quizzes/:id/attempts
   */
  async startAttempt(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { id: quizId } = req.params;

      const quiz = await quizRepository.findById(quizId);
      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      // Check if retakes allowed
      if (!quiz.allow_retakes) {
        const attempts = await quizRepository.getUserAttempts(userId, quizId);
        if (attempts.length > 0) {
          throw new ValidationError('Retakes are not allowed for this quiz');
        }
      }

      // Check max attempts
      if (quiz.max_attempts) {
        const attempts = await quizRepository.getUserAttempts(userId, quizId);
        if (attempts.length >= quiz.max_attempts) {
          throw new ValidationError('Maximum attempts reached');
        }
      }

      const attempt = await quizRepository.startAttempt(userId, quizId);

      logger.info('Started quiz attempt', { userId, quizId, attemptId: attempt.id });

      ResponseUtil.success(res, { attempt: attempt.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Submit answer
   * POST /api/v1/quizzes/attempts/:attemptId/answers
   */
  async submitAnswer(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { attemptId } = req.params;
      const { questionId, selectedOptionId, textAnswer } = req.body;

      if (!questionId) {
        throw new ValidationError('questionId is required');
      }

      await quizRepository.submitAnswer({
        attempt_id: attemptId,
        question_id: questionId,
        selected_option_id: selectedOptionId,
        text_answer: textAnswer,
      });

      ResponseUtil.success(res, { message: 'Answer submitted' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Complete quiz attempt
   * POST /api/v1/quizzes/attempts/:attemptId/complete
   */
  async completeAttempt(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { attemptId } = req.params;

      const attempt = await quizRepository.completeAttempt(attemptId);
      if (!attempt) {
        throw new NotFoundError('Attempt not found');
      }

      logger.info('Completed quiz attempt', { attemptId, score: attempt.score });

      ResponseUtil.success(res, { attempt: attempt.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get attempt results
   * GET /api/v1/quizzes/attempts/:attemptId
   */
  async getAttemptResults(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { attemptId } = req.params;

      const attemptWithAnswers = await quizRepository.getAttemptWithAnswers(attemptId);
      if (!attemptWithAnswers) {
        throw new NotFoundError('Attempt not found');
      }

      ResponseUtil.success(res, attemptWithAnswers);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's quiz history (all attempts)
   * GET /api/v1/quizzes/my/history
   */
  async getMyQuizHistory(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;

      const history = await quizRepository.getUserQuizHistory(userId);

      ResponseUtil.success(res, { history });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get curriculum performance (quiz stats by topic)
   * GET /api/v1/quizzes/curriculum/:curriculumId/performance
   */
  async getCurriculumPerformance(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.user!.userId;
      const { curriculumId } = req.params;

      const performance = await quizRepository.getCurriculumPerformance(userId, curriculumId);

      ResponseUtil.success(res, performance);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update quiz
   * PUT /api/v1/quizzes/:id
   */
  async updateQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const quiz = await quizRepository.findById(id);
      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      if (quiz.created_by !== userId && req.user?.role !== 'admin') {
        throw new UnauthorizedError('Not authorized to update this quiz');
      }

      const updated = await quizRepository.update(id, req.body);

      ResponseUtil.success(res, { quiz: updated?.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete quiz
   * DELETE /api/v1/quizzes/:id
   */
  async deleteQuiz(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user!.userId;

      const quiz = await quizRepository.findById(id);
      if (!quiz) {
        throw new NotFoundError('Quiz not found');
      }

      if (quiz.created_by !== userId && req.user?.role !== 'admin') {
        throw new UnauthorizedError('Not authorized to delete this quiz');
      }

      await quizRepository.delete(id);

      logger.info('Deleted quiz', { userId, quizId: id });

      ResponseUtil.success(res, { message: 'Quiz deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const quizController = new QuizController();
