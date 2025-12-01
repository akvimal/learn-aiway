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

    const response: any = await httpClient.get(url);
    return response.data;
  }

  /**
   * Get curriculum by ID with topics and learning objectives
   */
  async getCurriculumById(id: string, includeProgress = false): Promise<CurriculumWithDetails> {
    const url = includeProgress
      ? `${this.BASE_URL}/${id}?include_progress=true`
      : `${this.BASE_URL}/${id}`;
    const response: any = await httpClient.get(url);
    return response.data;
  }

  /**
   * Get curricula by domain
   */
  async getCurriculaByDomain(domain: string): Promise<{ curricula: Curriculum[] }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/domain/${domain}`);
    return response.data;
  }

  /**
   * Search curricula
   */
  async searchCurricula(query: string): Promise<{ curricula: Curriculum[] }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  }

  /**
   * Get my curricula (created by current user)
   */
  async getMyCurricula(): Promise<{ curricula: Curriculum[] }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/my`);
    return response.data;
  }

  /**
   * Get user's progress across all curricula
   */
  async getMyProgress(): Promise<{
    progress: Array<UserCurriculumProgress & { curriculum: Curriculum; stats: CurriculumStats }>;
  }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/progress`);
    return response.data;
  }

  /**
   * Get curriculum statistics
   */
  async getCurriculumStats(id: string): Promise<{ curriculumId: string; stats: CurriculumStats }> {
    const response: any = await httpClient.get(`${this.BASE_URL}/${id}/stats`);
    return response.data;
  }

  /**
   * Create a new curriculum
   */
  async createCurriculum(data: CurriculumCreateInput): Promise<{ curriculum: Curriculum }> {
    const response: any = await httpClient.post(this.BASE_URL, data);
    return response.data;
  }

  /**
   * Update a curriculum
   */
  async updateCurriculum(id: string, data: CurriculumUpdateInput): Promise<{ curriculum: Curriculum }> {
    const response: any = await httpClient.put(`${this.BASE_URL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete a curriculum
   */
  async deleteCurriculum(id: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`${this.BASE_URL}/${id}`);
    return response.data;
  }

  /**
   * Publish a curriculum
   */
  async publishCurriculum(id: string): Promise<{ curriculum: Curriculum }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/${id}/publish`);
    return response.data;
  }

  /**
   * Unpublish a curriculum
   */
  async unpublishCurriculum(id: string): Promise<{ curriculum: Curriculum }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/${id}/unpublish`);
    return response.data;
  }

  /**
   * Add a topic to a curriculum
   */
  async addTopic(curriculumId: string, data: TopicCreateInput): Promise<{ topic: Topic }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/${curriculumId}/topics`, data);
    return response.data;
  }

  /**
   * Update a topic
   */
  async updateTopic(
    curriculumId: string,
    topicId: string,
    data: TopicUpdateInput
  ): Promise<{ topic: Topic }> {
    const response: any = await httpClient.put(`${this.BASE_URL}/${curriculumId}/topics/${topicId}`, data);
    return response.data;
  }

  /**
   * Delete a topic
   */
  async deleteTopic(curriculumId: string, topicId: string): Promise<{ message: string }> {
    const response: any = await httpClient.delete(`${this.BASE_URL}/${curriculumId}/topics/${topicId}`);
    return response.data;
  }

  /**
   * Add a learning objective to a topic
   */
  async addLearningObjective(
    curriculumId: string,
    topicId: string,
    data: LearningObjectiveCreateInput
  ): Promise<{ objective: LearningObjective }> {
    const response: any = await httpClient.post(`${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives`, data);
    return response.data;
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
    const response: any = await httpClient.put(
      `${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives/${objectiveId}`,
      data
    );
    return response.data;
  }

  /**
   * Delete a learning objective
   */
  async deleteLearningObjective(
    curriculumId: string,
    topicId: string,
    objectiveId: string
  ): Promise<{ message: string }> {
    const response: any = await httpClient.delete(
      `${this.BASE_URL}/${curriculumId}/topics/${topicId}/objectives/${objectiveId}`
    );
    return response.data;
  }

  /**
   * Get topic details with exercises and quizzes
   */
  async getTopicDetails(curriculumId: string, topicId: string): Promise<any> {
    const response: any = await httpClient.get(
      `${this.BASE_URL}/${curriculumId}/topics/${topicId}/details`
    );
    return response.data;
  }

  /**
   * Get topic summary with counts
   */
  async getTopicSummary(topicId: string): Promise<any> {
    const response: any = await httpClient.get(`/topics/${topicId}/summary`);
    return response.data;
  }
}

export const curriculumService = new CurriculumService();
