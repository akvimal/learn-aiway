import { httpClient } from '../utils/http-client';
import type {
  ApiResponse,
  AIProvider,
  AIProviderCreateInput,
  AIProviderUpdateInput,
  AIModelsResponse,
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIUsageStats,
} from '../types';

class AIService {
  private basePath = '/ai';

  // Provider Management
  async getUserProviders(): Promise<AIProvider[]> {
    const response = await httpClient.get<ApiResponse<AIProvider[]>>(
      `${this.basePath}/providers`
    );
    return response.data || [];
  }

  async createProvider(input: AIProviderCreateInput): Promise<AIProvider> {
    const response = await httpClient.post<ApiResponse<AIProvider>>(
      `${this.basePath}/providers`,
      input
    );
    if (!response.data) {
      throw new Error('Failed to create provider');
    }
    return response.data;
  }

  async updateProvider(id: string, input: AIProviderUpdateInput): Promise<AIProvider> {
    const response = await httpClient.put<ApiResponse<AIProvider>>(
      `${this.basePath}/providers/${id}`,
      input
    );
    if (!response.data) {
      throw new Error('Failed to update provider');
    }
    return response.data;
  }

  async deleteProvider(id: string): Promise<void> {
    await httpClient.delete<ApiResponse>(
      `${this.basePath}/providers/${id}`
    );
  }

  async testProviderConnection(id: string): Promise<boolean> {
    const response = await httpClient.post<ApiResponse<{ valid: boolean }>>(
      `${this.basePath}/providers/${id}/test`
    );
    return response.data?.valid || false;
  }

  // Model Management
  async getProviderModels(providerId: string): Promise<AIModelsResponse> {
    const response = await httpClient.get<ApiResponse<AIModelsResponse>>(
      `${this.basePath}/providers/${providerId}/models`
    );
    return response.data || { configured: [], available: [] };
  }

  async setDefaultModel(providerId: string, modelId: string): Promise<void> {
    await httpClient.put<ApiResponse>(
      `${this.basePath}/providers/${providerId}/models/${modelId}/default`
    );
  }

  // Chat Completions
  async sendChatCompletion(
    request: AIChatCompletionRequest
  ): Promise<AIChatCompletionResponse> {
    const response = await httpClient.post<ApiResponse<AIChatCompletionResponse>>(
      `${this.basePath}/chat/completions`,
      request
    );
    if (!response.data) {
      throw new Error('Failed to get chat completion');
    }
    return response.data;
  }

  // Usage Statistics
  async getUserUsageStats(): Promise<AIUsageStats> {
    const response = await httpClient.get<ApiResponse<AIUsageStats>>(
      `${this.basePath}/usage/stats`
    );
    return response.data || {
      total_requests: '0',
      total_tokens: '0',
      total_cost: null,
      avg_latency: '0',
    };
  }

  // Content Generation
  async generateTopics(input: {
    curriculumId: string;
    curriculumTitle: string;
    curriculumDescription: string;
    difficultyLevel: string;
    domain: string;
    providerId: string;
    numTopics?: number;
  }): Promise<{
    topics: Array<{
      title: string;
      description: string;
      suggestedContent?: string;
      estimatedDurationMinutes?: number;
    }>;
  }> {
    const response = await httpClient.post<
      ApiResponse<{
        topics: Array<{
          title: string;
          description: string;
          suggestedContent?: string;
          estimatedDurationMinutes?: number;
        }>;
      }>
    >(`${this.basePath}/generate/topics`, input);
    if (!response.data) {
      throw new Error('Failed to generate topics');
    }
    return response.data;
  }

  async generateObjectives(input: {
    topicId: string;
    topicTitle: string;
    topicDescription: string;
    topicContent: string;
    difficultyLevel: string;
    providerId: string;
    numObjectives?: number;
  }): Promise<{
    objectives: string[];
  }> {
    const response = await httpClient.post<
      ApiResponse<{
        objectives: string[];
      }>
    >(`${this.basePath}/generate/objectives`, input);
    if (!response.data) {
      throw new Error('Failed to generate objectives');
    }
    return response.data;
  }
}

export const aiService = new AIService();
