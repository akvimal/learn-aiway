import { httpClient } from '../utils/http-client';
import type {
  Curriculum,
  CurriculaListResponse,
  CurriculumWithDetails,
  CurriculumFilters,
  CurriculumCreateInput,
  CurriculumUpdateInput,
  CurriculumStats,
  Topic,
  TopicCreateInput,
  TopicUpdateInput,
  LearningObjective,
  LearningObjectiveCreateInput,
  LearningObjectiveUpdateInput,
  UserCurriculumProgress,
} from '../types';

class CurriculumService {
  private readonly BASE_URL = '/curricula';

  /**
   * Get all curricula with filtering and pagination
   */
  async getAllCurricula(filters?: CurriculumFilters): Promise<CurriculaListResponse> {
    const params = new URLSearchParams();

    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    if (filters?.domain) params.append('domain', filters.domain);
    if (filters?.difficulty_level) params.append('difficulty_level', filters.difficulty_level);
    if (filters?.is_published !== undefined) params.append('is_published', filters.is_published.toString());
    if (filters?.search) params.append('search', filters.search);

    const queryString = params.toString();
    const url = queryString ? `${this.BASE_URL}?${queryString}` : this.BASE_URL;

    return httpClient.get(url);
  }

  /**
   * Get curriculum by ID with topics and learning objectives
   */
  async getCurriculumById(id: string, includeProgress = false): Promise<CurriculumWithDetails> {
    const url = includeProgress
      ? `${this.BASE_URL}/${id}?include_progress=true`
      : `${this.BASE_URL}/${id}`;
    return httpClient.get(url);
  }

  /**
   * Get curricula by domain
   */
  async getCurriculaByDomain(domain: string): Promise<{ curricula: Curriculum[] }> {
    return httpClient.get(`${this.BASE_URL}/domain/${domain}`);
  }

  /**
   * Search curricula
   */
  async searchCurricula(query: string): Promise<{ curricula: Curriculum[] }> {
    return httpClient.get(`${this.BASE_URL}/search?q=${encodeURIComponent(query)}`);
  }

  /**
   * Get my curricula (created by current user)
   */
  async getMyCurricula(): Promise<{ curricula: Curriculum[] }> {
    return httpClient.get(`${this.BASE_URL}/my`);
  }

  /**
   * Get user's progress across all curricula
   */
  async getMyProgress(): Promise<{
    progress: Array<UserCurriculumProgress & { curriculum: Curriculum; stats: CurriculumStats }>;
  }> {
    return httpClient.get(`${this.BASE_URL}/progress`);
  }

  /**
   * Get curriculum statistics
   */
  async getCurriculumStats(id: string): Promise<{ curriculumId: string; stats: CurriculumStats }> {
    return httpClient.get(`${this.BASE_URL}/${id}/stats`);
  }

  /**
   * Create a new curriculum
   */
  async createCurriculum(data: CurriculumCreateInput): Promise<{ curriculum: Curriculum }> {
    return httpClient.post(this.BASE_URL, data);
  }

  /**
   * Update a curriculum
   */
  async updateCurriculum(id: string, data: CurriculumUpdateInput): Promise<{ curriculum: Curriculum }> {
    return httpClient.put(`${this.BASE_URL}/${id}`, data);
  }

  /**
   * Delete a curriculum
   */
  async deleteCurriculum(id: string): Promise<{ message: string }> {
    return httpClient.delete(`${this.BASE_URL}/${id}`);
  }

  /**
   * Publish a curriculum
   */
  async publishCurriculum(id: string): Promise<{ curriculum: Curriculum }> {
    return httpClient.post(`${this.BASE_URL}/${id}/publish`);
  }

  /**
   * Unpublish a curriculum
   */
  async unpublishCurriculum(id: string): Promise<{ curriculum: Curriculum }> {
    return httpClient.post(`${this.BASE_URL}/${id}/unpublish`);
  }

  /**
   * Add a topic to a curriculum
   */
  async addTopic(curriculumId: string, data: TopicCreateInput): Promise<{ topic: Topic }> {
    return httpClient.post(`${this.BASE_URL}/${curriculumId}/topics`, data);
  }

  /**
   * Update a topic
   */
  async updateTopic(
    curriculumId: string,
    topicId: string,
    data: TopicUpdateInput
  ): Promise<{ topic: Topic }> {
    return httpClient.put(`${this.BASE_URL}/${curriculumId}/topics/${topicId}`, data);
  }

  /**
   * Delete a topic
   */
  async deleteTopic(curriculumId: string, topicId: string): Promise<{ message: string }> {
    return httpClient.delete(`${this.BASE_URL}/${curriculumId}/topics/${topicId}`);
  }

  /**
   * Add a learning objective to a topic
   */
  async addLearningObjective(
    curriculumId: string,
    topicId: string,
    data: LearningObjectiveCreateInput
  ): Promise<{ objective: LearningObjective }> {
    return httpClient.post(`${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives`, data);
  }

  /**
   * Update a learning objective
   */
  async updateLearningObjective(
    curriculumId: string,
    topicId: string,
    objectiveId: string,
    data: LearningObjectiveUpdateInput
  ): Promise<{ objective: LearningObjective }> {
    return httpClient.put(
      `${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives/${objectiveId}`,
      data
    );
  }

  /**
   * Delete a learning objective
   */
  async deleteLearningObjective(
    curriculumId: string,
    topicId: string,
    objectiveId: string
  ): Promise<{ message: string }> {
    return httpClient.delete(
      `${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives/${objectiveId}`
    );
  }
}

export const curriculumService = new CurriculumService();
