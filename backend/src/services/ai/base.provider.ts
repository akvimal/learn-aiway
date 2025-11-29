import {
  AIProviderInterface,
  AIChatCompletionRequest,
  AIChatCompletionResponse,
} from '../../types';
import { logger } from '../../config/logger.config';

export abstract class BaseAIProvider implements AIProviderInterface {
  protected apiKey: string | null;
  protected apiEndpoint: string | null;
  protected config: Record<string, any>;
  protected providerName: string;

  constructor(
    apiKey: string | null,
    apiEndpoint: string | null,
    config: Record<string, any> = {},
    providerName: string
  ) {
    this.apiKey = apiKey;
    this.apiEndpoint = apiEndpoint;
    this.config = config;
    this.providerName = providerName;
  }

  /**
   * Send a chat completion request to the AI provider
   */
  abstract sendChatCompletion(
    request: AIChatCompletionRequest
  ): Promise<AIChatCompletionResponse>;

  /**
   * Stream chat completion responses
   */
  abstract streamChatCompletion(
    request: AIChatCompletionRequest
  ): AsyncIterable<string>;

  /**
   * Test connection to the AI provider
   */
  abstract testConnection(): Promise<boolean>;

  /**
   * Get list of available models from the provider
   */
  abstract getAvailableModels(): Promise<string[]>;

  /**
   * Log error with provider context
   */
  protected logError(method: string, error: any): void {
    logger.error(`[${this.providerName}] ${method} failed:`, {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Log info with provider context
   */
  protected logInfo(method: string, message: string, meta?: any): void {
    logger.info(`[${this.providerName}] ${method}: ${message}`, meta);
  }

  /**
   * Calculate token usage estimate (rough approximation)
   * Real implementations should use provider-specific tokenizers
   */
  protected estimateTokens(text: string): number {
    // Rough estimate: ~4 characters per token for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Validate request parameters
   */
  protected validateRequest(request: AIChatCompletionRequest): void {
    if (!request.messages || request.messages.length === 0) {
      throw new Error('Messages array is required and cannot be empty');
    }

    for (const message of request.messages) {
      if (!message.role || !message.content) {
        throw new Error('Each message must have a role and content');
      }
      if (!['system', 'user', 'assistant'].includes(message.role)) {
        throw new Error(`Invalid message role: ${message.role}`);
      }
    }

    if (request.temperature !== undefined) {
      if (request.temperature < 0 || request.temperature > 2) {
        throw new Error('Temperature must be between 0 and 2');
      }
    }

    if (request.max_tokens !== undefined) {
      if (request.max_tokens < 1) {
        throw new Error('max_tokens must be greater than 0');
      }
    }
  }
}
