import { AIProvider, AIProviderType, AIProviderInterface } from '../../types';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { LocalLLMProvider } from './local.provider';
import { decryptText } from '../../utils/encryption.util';

/**
 * Factory to create AI provider instances based on configuration
 */
export class AIProviderFactory {
  /**
   * Create a provider instance from database configuration
   */
  static createProvider(providerConfig: AIProvider): AIProviderInterface {
    // Decrypt API key if present
    const apiKey = providerConfig.api_key_encrypted
      ? decryptText(providerConfig.api_key_encrypted)
      : null;

    const apiEndpoint = providerConfig.api_endpoint;
    const config = providerConfig.config_metadata || {};

    switch (providerConfig.provider_type) {
      case AIProviderType.OPENAI:
        return new OpenAIProvider(apiKey, apiEndpoint, config);

      case AIProviderType.ANTHROPIC:
        return new AnthropicProvider(apiKey, apiEndpoint, config);

      case AIProviderType.OLLAMA:
        if (!apiEndpoint) {
          throw new Error('Ollama requires an API endpoint (e.g., http://localhost:11434)');
        }
        return new LocalLLMProvider(apiEndpoint, config, 'ollama');

      case AIProviderType.LMSTUDIO:
        if (!apiEndpoint) {
          throw new Error('LM Studio requires an API endpoint (e.g., http://localhost:1234)');
        }
        return new LocalLLMProvider(apiEndpoint, config, 'lmstudio');

      default:
        throw new Error(`Unsupported provider type: ${providerConfig.provider_type}`);
    }
  }

  /**
   * Test if a provider configuration is valid
   */
  static async testProvider(providerConfig: AIProvider): Promise<boolean> {
    try {
      const provider = this.createProvider(providerConfig);
      return await provider.testConnection();
    } catch (error) {
      return false;
    }
  }

  /**
   * Get available models from a provider
   */
  static async getProviderModels(providerConfig: AIProvider): Promise<string[]> {
    const provider = this.createProvider(providerConfig);
    return await provider.getAvailableModels();
  }
}
