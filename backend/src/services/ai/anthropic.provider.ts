import Anthropic from '@anthropic-ai/sdk';
import { BaseAIProvider } from './base.provider';
import {
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIChatMessage,
} from '../../types';

export class AnthropicProvider extends BaseAIProvider {
  private client: Anthropic;

  constructor(
    apiKey: string | null,
    apiEndpoint: string | null = null,
    config: Record<string, any> = {}
  ) {
    super(apiKey, apiEndpoint, config, 'Anthropic');

    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    this.client = new Anthropic({
      apiKey,
      baseURL: apiEndpoint || undefined,
      timeout: config.timeout || 120000, // 2 minutes for longer responses
      maxRetries: config.maxRetries || 2,
    });
  }

  async sendChatCompletion(
    request: AIChatCompletionRequest
  ): Promise<AIChatCompletionResponse> {
    this.validateRequest(request);

    const startTime = Date.now();

    try {
      // Anthropic requires separating system messages from user/assistant messages
      const systemMessage = request.messages.find((msg) => msg.role === 'system');
      const conversationMessages = request.messages
        .filter((msg) => msg.role !== 'system')
        .map((msg: AIChatMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const response = await this.client.messages.create({
        model: request.model || this.config.defaultModel || 'claude-3-sonnet-20240229',
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages,
      });

      const latency = Date.now() - startTime;

      if (!response.content || response.content.length === 0) {
        throw new Error('No response from Anthropic');
      }

      const textContent = response.content.find((block) => block.type === 'text');
      if (!textContent || textContent.type !== 'text') {
        throw new Error('No text content in Anthropic response');
      }

      this.logInfo('sendChatCompletion', 'Completed successfully', {
        model: response.model,
        tokens: response.usage.input_tokens + response.usage.output_tokens,
        latency_ms: latency,
      });

      return {
        content: textContent.text,
        model: response.model,
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
        finish_reason: response.stop_reason || 'end_turn',
        latency_ms: latency,
      };
    } catch (error: any) {
      this.logError('sendChatCompletion', error);
      throw new Error(`Anthropic request failed: ${error.message}`);
    }
  }

  async *streamChatCompletion(
    request: AIChatCompletionRequest
  ): AsyncIterable<string> {
    this.validateRequest(request);

    try {
      const systemMessage = request.messages.find((msg) => msg.role === 'system');
      const conversationMessages = request.messages
        .filter((msg) => msg.role !== 'system')
        .map((msg: AIChatMessage) => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content,
        }));

      const stream = await this.client.messages.create({
        model: request.model || this.config.defaultModel || 'claude-3-sonnet-20240229',
        max_tokens: request.max_tokens || 4096,
        temperature: request.temperature ?? 0.7,
        system: systemMessage?.content,
        messages: conversationMessages,
        stream: true,
      });

      for await (const event of stream) {
        if (
          event.type === 'content_block_delta' &&
          event.delta.type === 'text_delta'
        ) {
          yield event.delta.text;
        }
      }

      this.logInfo('streamChatCompletion', 'Stream completed successfully');
    } catch (error: any) {
      this.logError('streamChatCompletion', error);
      throw new Error(`Anthropic streaming failed: ${error.message}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      // Simple test: send a minimal message
      await this.client.messages.create({
        model: this.config.defaultModel || 'claude-3-haiku-20240307', // Use cheapest model for test
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });

      this.logInfo('testConnection', 'Connection test successful');
      return true;
    } catch (error: any) {
      this.logError('testConnection', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    // Anthropic doesn't have a models list API, so we return known models
    const knownModels = [
      'claude-3-opus-20240229',
      'claude-3-sonnet-20240229',
      'claude-3-haiku-20240307',
      'claude-2.1',
      'claude-2.0',
    ];

    this.logInfo('getAvailableModels', `Returning ${knownModels.length} known models`);
    return knownModels;
  }
}
