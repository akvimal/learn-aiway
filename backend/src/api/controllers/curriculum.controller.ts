import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, DifficultyLevel } from '../../types';
import { curriculumRepository } from '../../repositories/curriculum.repository';
import { topicRepository } from '../../repositories/topic.repository';
import { learningObjectiveRepository } from '../../repositories/learningObjective.repository';
import { curriculumProgressRepository } from '../../repositories/curriculumProgress.repository';
import { ValidationError, NotFoundError } from '../../utils/errors.util';
import { ResponseUtil } from '../../utils/response.util';
import { logger } from '../../config/logger.config';

export class CurriculumController {
  /**
   * Get all curricula with filtering and pagination
   * GET /api/v1/curricula
   */
  async getAllCurricula(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        page = 1,
        limit = 20,
        domain,
        difficulty_level,
        is_published,
        search,
      } = req.query;

      const pageNum = parseInt(page as string, 10);
      const limitNum = parseInt(limit as string, 10);

      if (pageNum < 1 || limitNum < 1 || limitNum > 100) {
        throw new ValidationError('Invalid pagination parameters');
      }

      const offset = (pageNum - 1) * limitNum;

      const filters: any = {};

      if (domain) {
        filters.domain = domain as string;
      }

      if (difficulty_level) {
        if (!Object.values(DifficultyLevel).includes(difficulty_level as DifficultyLevel)) {
          throw new ValidationError('Invalid difficulty level');
        }
        filters.difficulty_level = difficulty_level as DifficultyLevel;
      }

      // Only show published curricula to learners
      if (req.user?.role === 'learner') {
        filters.is_published = true;
      } else if (is_published !== undefined) {
        filters.is_published = is_published === 'true';
      }

      if (search) {
        filters.search = search as string;
      }

      filters.limit = limitNum;
      filters.offset = offset;

      const { curricula, total } = await curriculumRepository.findAll(filters);

      logger.info('Retrieved curricula list', {
        userId: req.user?.userId,
        count: curricula.length,
        total,
      });

      ResponseUtil.success(res, {
        curricula: curricula.map((c) => c.toJSON()),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get curriculum by ID with topics and learning objectives
   * GET /api/v1/curricula/:id
   */
  async getCurriculumById(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const { include_progress } = req.query;

      const curriculum = await curriculumRepository.findById(id);

      if (!curriculum) {
        throw new NotFoundError('Curriculum not found');
      }

      // Check if user can access unpublished curriculum
      if (
        !curriculum.is_published &&
        req.user?.role === 'learner' &&
        curriculum.created_by !== req.user?.userId
      ) {
        throw new NotFoundError('Curriculum not found');
      }

      // Get topic hierarchy
      const topics = await topicRepository.getTopicHierarchy(id);

      // Get learning objectives for each topic
      const topicsWithObjectives = await Promise.all(
        topics.map(async (topic) => {
          const objectives = await learningObjectiveRepository.findByTopicId(topic.id);
          return {
            ...topic,
            learning_objectives: objectives.map((o) => o.toJSON()),
          };
        })
      );

      // Get user progress if requested
      let progress = null;
      if (include_progress === 'true' && req.user?.userId) {
        progress = await curriculumProgressRepository.getUserCurriculumProgress(
          req.user.userId,
          id
        );
      }

      logger.info('Retrieved curriculum details', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, {
        curriculum: curriculum.toJSON(),
        topics: topicsWithObjectives,
        progress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get curricula by domain
   * GET /api/v1/curricula/domain/:domain
   */
  async getCurriculaByDomain(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { domain } = req.params;
      const isPublished = req.user?.role === 'learner';

      const curricula = await curriculumRepository.findByDomain(domain, isPublished);

      logger.info('Retrieved curricula by domain', {
        userId: req.user?.userId,
        domain,
        count: curricula.length,
      });

      ResponseUtil.success(res, {
        curricula: curricula.map((c) => c.toJSON()),
        domain,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get my curricula (created by current user)
   * GET /api/v1/curricula/my
   */
  async getMyCurricula(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new ValidationError('User ID not found');
      }

      const curricula = await curriculumRepository.findByCreator(req.user.userId);

      logger.info('Retrieved user curricula', {
        userId: req.user.userId,
        count: curricula.length,
      });

      ResponseUtil.success(res, {
        curricula: curricula.map((c) => c.toJSON()),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user's progress across all curricula
   * GET /api/v1/curricula/progress
   */
  async getMyProgress(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new ValidationError('User ID not found');
      }

      const progressList = await curriculumProgressRepository.getUserAllCurriculaProgress(
        req.user.userId
      );

      // Enrich with curriculum details
      const enrichedProgress = await Promise.all(
        progressList.map(async (progress) => {
          const curriculum = await curriculumRepository.findById(progress.curriculum_id);
          const stats = await curriculumProgressRepository.getCurriculumStats(
            req.user!.userId,
            progress.curriculum_id
          );

          return {
            ...progress,
            curriculum: curriculum?.toJSON(),
            stats,
          };
        })
      );

      logger.info('Retrieved user progress', {
        userId: req.user.userId,
        count: progressList.length,
      });

      ResponseUtil.success(res, {
        progress: enrichedProgress,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get curriculum statistics
   * GET /api/v1/curricula/:id/stats
   */
  async getCurriculumStats(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      const curriculum = await curriculumRepository.findById(id);
      if (!curriculum) {
        throw new NotFoundError('Curriculum not found');
      }

      const totalTopics = await topicRepository.countByCurriculumId(id);

      const stats = req.user?.userId
        ? await curriculumProgressRepository.getCurriculumStats(req.user.userId, id)
        : {
            totalTopics,
            completedTopics: 0,
            inProgressTopics: 0,
            notStartedTopics: totalTopics,
          };

      logger.info('Retrieved curriculum statistics', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, {
        curriculumId: id,
        stats,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Search curricula
   * GET /api/v1/curricula/search?q=term
   */
  async searchCurricula(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q } = req.query;

      if (!q || typeof q !== 'string') {
        throw new ValidationError('Search query is required');
      }

      const isPublished = req.user?.role === 'learner';
      const curricula = await curriculumRepository.search(q, isPublished);

      logger.info('Searched curricula', {
        userId: req.user?.userId,
        query: q,
        count: curricula.length,
      });

      ResponseUtil.success(res, {
        curricula: curricula.map((c) => c.toJSON()),
        query: q,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new curriculum
   * POST /api/v1/curricula
   */
  async createCurriculum(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user?.userId) {
        throw new ValidationError('User ID not found');
      }

      const {
        title,
        description,
        domain,
        difficulty_level,
        estimated_duration_hours,
        tags,
        metadata,
      } = req.body;

      if (!title || !domain) {
        throw new ValidationError('Title and domain are required');
      }

      const curriculum = await curriculumRepository.create(
        {
          title,
          description,
          domain,
          difficulty_level,
          estimated_duration_hours,
          tags,
          metadata,
        },
        req.user.userId
      );

      logger.info('Created curriculum', {
        userId: req.user.userId,
        curriculumId: curriculum.id,
      });

      ResponseUtil.success(res, { curriculum: curriculum.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a curriculum
   * PUT /api/v1/curricula/:id
   */
  async updateCurriculum(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to update this curriculum');
      }

      const curriculum = await curriculumRepository.update(id, updates);

      logger.info('Updated curriculum', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, { curriculum: curriculum?.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a curriculum
   * DELETE /api/v1/curricula/:id
   */
  async deleteCurriculum(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to delete this curriculum');
      }

      await curriculumRepository.delete(id);

      logger.info('Deleted curriculum', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, { message: 'Curriculum deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Publish a curriculum
   * POST /api/v1/curricula/:id/publish
   */
  async publishCurriculum(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to publish this curriculum');
      }

      const curriculum = await curriculumRepository.update(id, {
        is_published: true,
      });

      logger.info('Published curriculum', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, { curriculum: curriculum?.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Unpublish a curriculum
   * POST /api/v1/curricula/:id/unpublish
   */
  async unpublishCurriculum(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to unpublish this curriculum');
      }

      const curriculum = await curriculumRepository.update(id, {
        is_published: false,
      });

      logger.info('Unpublished curriculum', {
        userId: req.user?.userId,
        curriculumId: id,
      });

      ResponseUtil.success(res, { curriculum: curriculum?.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a topic to a curriculum
   * POST /api/v1/curricula/:id/topics
   */
  async addTopic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const {
        parent_topic_id,
        title,
        description,
        content,
        order_index,
        estimated_duration_minutes,
        is_required,
      } = req.body;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(id);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to add topics to this curriculum');
      }

      if (!title) {
        throw new ValidationError('Title is required');
      }

      const topic = await topicRepository.create({
        curriculum_id: id,
        parent_topic_id,
        title,
        description,
        content,
        order_index,
        estimated_duration_minutes,
        is_required,
      });

      logger.info('Added topic to curriculum', {
        userId: req.user?.userId,
        curriculumId: id,
        topicId: topic.id,
      });

      ResponseUtil.success(res, { topic: topic.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a topic
   * PUT /api/v1/curricula/:curriculumId/topics/:topicId
   */
  async updateTopic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { curriculumId, topicId } = req.params;
      const updates = req.body;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(curriculumId);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to update topics in this curriculum');
      }

      const topic = await topicRepository.update(topicId, updates);
      if (!topic) {
        throw new NotFoundError('Topic not found');
      }

      logger.info('Updated topic', {
        userId: req.user?.userId,
        curriculumId,
        topicId,
      });

      ResponseUtil.success(res, { topic: topic.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a topic
   * DELETE /api/v1/curricula/:curriculumId/topics/:topicId
   */
  async deleteTopic(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { curriculumId, topicId } = req.params;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(curriculumId);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError('You do not have permission to delete topics from this curriculum');
      }

      await topicRepository.delete(topicId);

      logger.info('Deleted topic', {
        userId: req.user?.userId,
        curriculumId,
        topicId,
      });

      ResponseUtil.success(res, { message: 'Topic deleted successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Add a learning objective to a topic
   * POST /api/v1/curricula/:curriculumId/topics/:topicId/objectives
   */
  async addLearningObjective(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { curriculumId, topicId } = req.params;
      const { objective_text, order_index } = req.body;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(curriculumId);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError(
          'You do not have permission to add learning objectives to this curriculum'
        );
      }

      if (!objective_text) {
        throw new ValidationError('Objective text is required');
      }

      const objective = await learningObjectiveRepository.create({
        topic_id: topicId,
        objective_text,
        order_index,
      });

      logger.info('Added learning objective', {
        userId: req.user?.userId,
        curriculumId,
        topicId,
        objectiveId: objective.id,
      });

      ResponseUtil.success(res, { objective: objective.toJSON() }, 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a learning objective
   * PUT /api/v1/curricula/:curriculumId/topics/:topicId/objectives/:objectiveId
   */
  async updateLearningObjective(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { curriculumId, objectiveId } = req.params;
      const updates = req.body;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(curriculumId);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError(
          'You do not have permission to update learning objectives in this curriculum'
        );
      }

      const objective = await learningObjectiveRepository.update(objectiveId, updates);
      if (!objective) {
        throw new NotFoundError('Learning objective not found');
      }

      logger.info('Updated learning objective', {
        userId: req.user?.userId,
        curriculumId,
        objectiveId,
      });

      ResponseUtil.success(res, { objective: objective.toJSON() });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a learning objective
   * DELETE /api/v1/curricula/:curriculumId/topics/:topicId/objectives/:objectiveId
   */
  async deleteLearningObjective(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { curriculumId, objectiveId } = req.params;

      // Check if curriculum exists and user has permission
      const existing = await curriculumRepository.findById(curriculumId);
      if (!existing) {
        throw new NotFoundError('Curriculum not found');
      }

      if (
        req.user?.role !== 'admin' &&
        existing.created_by !== req.user?.userId
      ) {
        throw new ValidationError(
          'You do not have permission to delete learning objectives from this curriculum'
        );
      }

      await learningObjectiveRepository.delete(objectiveId);

      logger.info('Deleted learning objective', {
        userId: req.user?.userId,
        curriculumId,
        objectiveId,
      });

      ResponseUtil.success(res, { message: 'Learning objective deleted successfully' });
    } catch (error) {
      next(error);
    }
  }
}

export const curriculumController = new CurriculumController();
