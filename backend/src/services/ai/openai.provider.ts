import OpenAI from 'openai';
import { BaseAIProvider } from './base.provider';
import {
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIChatMessage,
} from '../../types';

export class OpenAIProvider extends BaseAIProvider {
  private client: OpenAI;

  constructor(
    apiKey: string | null,
    apiEndpoint: string | null = null,
    config: Record<string, any> = {}
  ) {
    super(apiKey, apiEndpoint, config, 'OpenAI');

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({
      apiKey,
      baseURL: apiEndpoint || undefined,
      timeout: config.timeout || 60000,
      maxRetries: config.maxRetries || 2,
    });
  }

  async sendChatCompletion(
    request: AIChatCompletionRequest
  ): Promise<AIChatCompletionResponse> {
    this.validateRequest(request);

    const startTime = Date.now();

    try {
      const messages = request.messages.map((msg: AIChatMessage) => ({
        role: msg.role,
        content: msg.content,
      }));

      const completion = await this.client.chat.completions.create({
        model: request.model || this.config.defaultModel || 'gpt-3.5-turbo',
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
        stream: false,
      });

      const latency = Date.now() - startTime;

      const choice = completion.choices[0];
      if (!choice || !choice.message) {
        throw new Error('No response from OpenAI');
      }

      this.logInfo('sendChatCompletion', 'Completed successfully', {
        model: completion.model,
        tokens: completion.usage?.total_tokens,
        latency_ms: latency,
      });

      return {
        content: choice.message.content || '',
        model: completion.model,
        usage: {
          prompt_tokens: completion.usage?.prompt_tokens || 0,
          completion_tokens: completion.usage?.completion_tokens || 0,
          total_tokens: completion.usage?.total_tokens || 0,
        },
        finish_reason: choice.finish_reason || 'stop',
        latency_ms: latency,
      };
    } catch (error: any) {
      this.logError('sendChatCompletion', error);
      throw new Error(`OpenAI request failed: ${error.message}`);
    }
  }

  async *streamChatCompletion(
    request: AIChatCompletionRequest
  ): AsyncIterable<string> {
    this.validateRequest(request);

    try {
      const messages = request.messages.map((msg: AIChatMessage) => ({
        role: msg.role,
        content: msg.content,
      }));

      const stream = await this.client.chat.completions.create({
        model: request.model || this.config.defaultModel || 'gpt-3.5-turbo',
        messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.max_tokens,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      this.logInfo('streamChatCompletion', 'Stream completed successfully');
    } catch (error: any) {
      this.logError('streamChatCompletion', error);
      throw new Error(`OpenAI streaming failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test: list models
      await this.client.models.list();
      this.logInfo('testConnection', 'Connection test successful');
      return true;
    } catch (error: any) {
      this.logError('testConnection', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.models.list();
      const models = response.data
        .filter((model) => model.id.startsWith('gpt'))
        .map((model) => model.id);

      this.logInfo('getAvailableModels', `Found ${models.length} models`);
      return models;
    } catch (error: any) {
      this.logError('getAvailableModels', error);
      throw new Error(`Failed to fetch OpenAI models: ${error.message}`);
    }
  }
}
