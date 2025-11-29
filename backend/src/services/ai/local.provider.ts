import axios, { AxiosInstance } from 'axios';
import { BaseAIProvider } from './base.provider';
import {
  AIChatCompletionRequest,
  AIChatCompletionResponse,
  AIChatMessage,
} from '../../types';

/**
 * Local LLM Provider for Ollama and LM Studio
 * Both support OpenAI-compatible API endpoints
 */
export class LocalLLMProvider extends BaseAIProvider {
  private client: AxiosInstance;
  private providerType: 'ollama' | 'lmstudio';

  constructor(
    apiEndpoint: string,
    config: Record<string, any> = {},
    providerType: 'ollama' | 'lmstudio' = 'ollama'
  ) {
    super(null, apiEndpoint, config, providerType === 'ollama' ? 'Ollama' : 'LM Studio');

    if (!apiEndpoint) {
      throw new Error(`${this.providerName} API endpoint is required`);
    }

    this.providerType = providerType;
    this.client = axios.create({
      baseURL: apiEndpoint,
      timeout: config.timeout || 120000, // Local models may be slower
      headers: {
        'Content-Type': 'application/json',
      },
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

      let response;

      if (this.providerType === 'ollama') {
        // Use Ollama's native API format
        const model = request.model || this.config.defaultModel;
        if (!model) {
          throw new Error('No model specified. Please configure a default model for this provider.');
        }

        response = await this.client.post('/api/chat', {
          model,
          messages,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.max_tokens,
          },
        });

        const latency = Date.now() - startTime;
        const content = response.data.message?.content || '';

        // Ollama native API format
        const promptText = messages.map((m: any) => m.content).join(' ');
        const promptTokens = response.data.prompt_eval_count || this.estimateTokens(promptText);
        const completionTokens = response.data.eval_count || this.estimateTokens(content);

        this.logInfo('sendChatCompletion', 'Completed successfully', {
          model: response.data.model,
          tokens: promptTokens + completionTokens,
          latency_ms: latency,
        });

        return {
          content,
          model: response.data.model || model,
          usage: {
            prompt_tokens: promptTokens,
            completion_tokens: completionTokens,
            total_tokens: promptTokens + completionTokens,
          },
          finish_reason: response.data.done ? 'stop' : 'length',
          latency_ms: latency,
        };
      } else {
        // Use OpenAI-compatible API format for LM Studio
        response = await this.client.post('/v1/chat/completions', {
          model: request.model || this.config.defaultModel || 'local-model',
          messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.max_tokens,
          stream: false,
        });

        const latency = Date.now() - startTime;

        const choice = response.data.choices[0];
        if (!choice || !choice.message) {
          throw new Error(`No response from ${this.providerName}`);
        }

        // Local models may not provide token counts, estimate them
        const promptText = messages.map((m: any) => m.content).join(' ');
        const promptTokens = this.estimateTokens(promptText);
        const completionTokens = this.estimateTokens(choice.message.content);

        this.logInfo('sendChatCompletion', 'Completed successfully', {
          model: response.data.model,
          estimated_tokens: promptTokens + completionTokens,
          latency_ms: latency,
        });

        return {
          content: choice.message.content || '',
          model: response.data.model || request.model || 'local-model',
          usage: {
            prompt_tokens: response.data.usage?.prompt_tokens || promptTokens,
            completion_tokens: response.data.usage?.completion_tokens || completionTokens,
            total_tokens:
              response.data.usage?.total_tokens || promptTokens + completionTokens,
          },
          finish_reason: choice.finish_reason || 'stop',
          latency_ms: latency,
        };
      }
    } catch (error: any) {
      this.logError('sendChatCompletion', error);

      // Extract error message from various formats
      let errorMessage = error.message;
      if (error.response?.data) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data.error === 'object') {
          errorMessage = error.response.data.error.message || JSON.stringify(error.response.data.error);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      throw new Error(`${this.providerName} request failed: ${errorMessage}`);
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

      const model = request.model || this.config.defaultModel;
      if (!model) {
        throw new Error('No model specified. Please configure a default model for this provider.');
      }

      const endpoint = this.providerType === 'ollama' ? '/api/chat' : '/v1/chat/completions';
      const payload = this.providerType === 'ollama'
        ? {
            model,
            messages,
            stream: true,
            options: {
              temperature: request.temperature ?? 0.7,
              num_predict: request.max_tokens,
            },
          }
        : {
            model,
            messages,
            temperature: request.temperature ?? 0.7,
            max_tokens: request.max_tokens,
            stream: true,
          };

      const response = await this.client.post(endpoint, payload, {
        responseType: 'stream',
      });

      const stream = response.data;
      let buffer = '';

      for await (const chunk of stream) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') {
              break;
            }

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                yield content;
              }
            } catch (e) {
              // Ignore parse errors for streaming chunks
            }
          }
        }
      }

      this.logInfo('streamChatCompletion', 'Stream completed successfully');
    } catch (error: any) {
      this.logError('streamChatCompletion', error);

      // Extract error message from various formats
      let errorMessage = error.message;
      if (error.response?.data) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data.error === 'object') {
          errorMessage = error.response.data.error.message || JSON.stringify(error.response.data.error);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      throw new Error(`${this.providerName} streaming failed: ${errorMessage}`);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (this.providerType === 'ollama') {
        // Ollama has a tags endpoint to list models
        await this.client.get('/api/tags');
      } else {
        // LM Studio uses OpenAI-compatible /v1/models
        await this.client.get('/v1/models');
      }

      this.logInfo('testConnection', 'Connection test successful');
      return true;
    } catch (error: any) {
      this.logError('testConnection', error);
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      let models: string[] = [];

      if (this.providerType === 'ollama') {
        // Ollama API format - returns models with 'name' field
        const response = await this.client.get('/api/tags');
        models = response.data.models?.map((m: any) => m.name || m.model) || [];
      } else {
        // LM Studio uses OpenAI format - returns models with 'id' field
        const response = await this.client.get('/v1/models');
        models = response.data.data?.map((m: any) => m.id) || [];
      }

      this.logInfo('getAvailableModels', `Found ${models.length} models`);
      return models;
    } catch (error: any) {
      this.logError('getAvailableModels', error);

      // Extract error message from various formats
      let errorMessage = error.message;
      if (error.response?.data) {
        if (typeof error.response.data.error === 'string') {
          errorMessage = error.response.data.error;
        } else if (typeof error.response.data.error === 'object') {
          errorMessage = error.response.data.error.message || JSON.stringify(error.response.data.error);
        } else if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        }
      }

      throw new Error(`Failed to fetch ${this.providerName} models: ${errorMessage}`);
    }
  }
}
