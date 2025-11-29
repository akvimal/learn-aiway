import {
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIProvider,
  AIModel,
} from '../../types';
import { AIProviderRepository } from '../../repositories/aiProvider.repository';
import { AIProviderFactory } from './provider.factory';
import { logger } from '../../config/logger.config';

/**
 * AI Service - Orchestrates AI provider interactions
 * Provides a unified interface for AI operations across different providers
 */
export class AIService {
  private providerRepo: AIProviderRepository;

  constructor() {
    this.providerRepo = new AIProviderRepository();
  }

  /**
   * Send a chat completion request using the user's default or specified provider
   */
  async sendChatCompletion(
    userId: string,
    request: AIChatCompletionRequest,
    providerId?: string
  ): Promise<AIChatCompletionResponse> {
    // Get provider configuration
    let providerConfig: AIProvider | null;

    if (providerId) {
      providerConfig = await this.providerRepo.getProviderById(providerId, userId);
      if (!providerConfig) {
        throw new Error(`Provider ${providerId} not found`);
      }
    } else {
      providerConfig = await this.providerRepo.getDefaultProvider(userId);
      if (!providerConfig) {
        throw new Error(
          'No default AI provider configured. Please configure an AI provider first.'
        );
      }
    }

    if (!providerConfig.is_active) {
      throw new Error(`Provider ${providerConfig.provider_name} is not active`);
    }

    // Get default model if not specified in request
    let modelToUse = request.model;
    if (!modelToUse) {
      const defaultModel = await this.providerRepo.getDefaultModel(providerConfig.id);
      if (defaultModel) {
        modelToUse = defaultModel.model_id;
      }
    }

    // Create provider instance and send request
    const provider = AIProviderFactory.createProvider(providerConfig);
    const startTime = Date.now();

    try {
      const response = await provider.sendChatCompletion({
        ...request,
        model: modelToUse,
      });

      // Log usage
      const models = await this.providerRepo.getProviderModels(providerConfig.id);
      const usedModel = models.find((m) => m.model_id === response.model);

      if (usedModel) {
        await this.providerRepo.logUsage({
          user_id: userId,
          provider_id: providerConfig.id,
          model_id: usedModel.id,
          session_id: null,
          request_tokens: response.usage.prompt_tokens,
          response_tokens: response.usage.completion_tokens,
          total_tokens: response.usage.total_tokens,
          latency_ms: response.latency_ms,
          cost_usd: this.calculateCost(response.usage, usedModel),
          error_message: null,
        });
      }

      logger.info('[AIService] Chat completion successful', {
        userId,
        provider: providerConfig.provider_name,
        model: response.model,
        tokens: response.usage.total_tokens,
        latency: response.latency_ms,
      });

      return response;
    } catch (error: any) {
      logger.error('[AIService] Chat completion failed', {
        userId,
        provider: providerConfig.provider_name,
        error: error.message,
      });

      // Log error usage
      try {
        const models = await this.providerRepo.getProviderModels(providerConfig.id);
        const defaultModel = models.find((m) => m.is_default);

        if (defaultModel) {
          await this.providerRepo.logUsage({
            user_id: userId,
            provider_id: providerConfig.id,
            model_id: defaultModel.id,
            session_id: null,
            request_tokens: 0,
            response_tokens: 0,
            total_tokens: 0,
            latency_ms: Date.now() - startTime,
            cost_usd: null,
            error_message: error.message,
          });
        }
      } catch (logError) {
        // Ignore logging errors
      }

      throw error;
    }
  }

  /**
   * Stream a chat completion
   */
  async *streamChatCompletion(
    userId: string,
    request: AIChatCompletionRequest,
    providerId?: string
  ): AsyncIterable<string> {
    // Get provider configuration (similar to sendChatCompletion)
    let providerConfig: AIProvider | null;

    if (providerId) {
      providerConfig = await this.providerRepo.getProviderById(providerId, userId);
      if (!providerConfig) {
        throw new Error(`Provider ${providerId} not found`);
      }
    } else {
      providerConfig = await this.providerRepo.getDefaultProvider(userId);
      if (!providerConfig) {
        throw new Error(
          'No default AI provider configured. Please configure an AI provider first.'
        );
      }
    }

    if (!providerConfig.is_active) {
      throw new Error(`Provider ${providerConfig.provider_name} is not active`);
    }

    // Get default model if not specified
    let modelToUse = request.model;
    if (!modelToUse) {
      const defaultModel = await this.providerRepo.getDefaultModel(providerConfig.id);
      if (defaultModel) {
        modelToUse = defaultModel.model_id;
      }
    }

    // Create provider and stream
    const provider = AIProviderFactory.createProvider(providerConfig);

    try {
      for await (const chunk of provider.streamChatCompletion({
        ...request,
        model: modelToUse,
      })) {
        yield chunk;
      }

      logger.info('[AIService] Stream completion successful', {
        userId,
        provider: providerConfig.provider_name,
      });
    } catch (error: any) {
      logger.error('[AIService] Stream completion failed', {
        userId,
        provider: providerConfig.provider_name,
        error: error.message,
      });
      throw error;
    }
  }

  /**
   * Test a provider connection
   */
  async testProvider(userId: string, providerId: string): Promise<boolean> {
    const providerConfig = await this.providerRepo.getProviderById(providerId, userId);
    if (!providerConfig) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await AIProviderFactory.testProvider(providerConfig);
  }

  /**
   * Get available models for a provider
   */
  async getProviderModels(userId: string, providerId: string): Promise<string[]> {
    const providerConfig = await this.providerRepo.getProviderById(providerId, userId);
    if (!providerConfig) {
      throw new Error(`Provider ${providerId} not found`);
    }

    return await AIProviderFactory.getProviderModels(providerConfig);
  }

  /**
   * Get user's usage statistics
   */
  async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    return await this.providerRepo.getUserUsageStats(userId, startDate, endDate);
  }

  /**
   * Calculate cost based on usage and pricing info
   */
  private calculateCost(
    usage: { prompt_tokens: number; completion_tokens: number },
    model: AIModel
  ): number | null {
    if (!model.pricing_info || !model.pricing_info.input_per_1k) {
      return null;
    }

    const inputCost = (usage.prompt_tokens / 1000) * model.pricing_info.input_per_1k;
    const outputCost = (usage.completion_tokens / 1000) * (model.pricing_info.output_per_1k || 0);

    return inputCost + outputCost;
  }
}
