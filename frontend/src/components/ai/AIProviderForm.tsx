import React, { useState } from 'react';
import { aiService } from '../../services/ai.service';
import type {
  AIProvider,
  AIProviderType,
  AIProviderCreateInput,
  AIProviderUpdateInput,
} from '../../types';

interface AIProviderFormProps {
  provider?: AIProvider | null;
  onSuccess: () => void;
  onCancel: () => void;
}

export const AIProviderForm: React.FC<AIProviderFormProps> = ({
  provider,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    provider_type: (provider?.provider_type || 'openai') as AIProviderType,
    provider_name: provider?.provider_name || '',
    api_key: '',
    api_endpoint: provider?.api_endpoint || 'https://api.openai.com/v1',
    is_default: provider?.is_default || false,
    default_model: provider?.config_metadata?.defaultModel || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providerTypes: { value: AIProviderType; label: string; description: string }[] = [
    {
      value: 'openai',
      label: 'OpenAI',
      description: 'GPT-4, GPT-3.5, and other OpenAI models'
    },
    {
      value: 'anthropic',
      label: 'Anthropic (Claude)',
      description: 'Claude 3 Opus, Sonnet, and Haiku models'
    },
    {
      value: 'ollama',
      label: 'Ollama',
      description: 'Self-hosted open-source models (Llama, Mistral, etc.)'
    },
    {
      value: 'lmstudio',
      label: 'LM Studio',
      description: 'Local LLM runtime for open models'
    },
  ];

  const getDefaultEndpoint = (type: AIProviderType): string => {
    const endpoints = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com',
      ollama: 'http://host.docker.internal:11434',
      lmstudio: 'http://localhost:1234',
    };
    return endpoints[type] || '';
  };

  const getDefaultModel = (type: AIProviderType): string => {
    const defaults = {
      openai: '',
      anthropic: '',
      ollama: 'llama3.2',
      lmstudio: 'local-model',
    };
    return defaults[type] || '';
  };

  const handleTypeChange = (type: AIProviderType) => {
    setFormData({
      ...formData,
      provider_type: type,
      api_endpoint: getDefaultEndpoint(type),
      default_model: getDefaultModel(type),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (provider) {
        // Update existing provider
        const updateData: AIProviderUpdateInput = {
          provider_name: formData.provider_name,
          is_default: formData.is_default,
        };

        if (formData.api_key) {
          updateData.api_key = formData.api_key;
        }

        if (formData.api_endpoint !== provider.api_endpoint) {
          updateData.api_endpoint = formData.api_endpoint;
        }

        // Update default model in config_metadata for local providers
        if (formData.default_model && (formData.provider_type === 'ollama' || formData.provider_type === 'lmstudio')) {
          updateData.config_metadata = {
            ...provider.config_metadata,
            defaultModel: formData.default_model,
          };
        }

        await aiService.updateProvider(provider.id, updateData);
      } else {
        // Create new provider
        const createData: AIProviderCreateInput = {
          provider_type: formData.provider_type,
          provider_name: formData.provider_name,
          is_default: formData.is_default,
        };

        if (formData.api_key) {
          createData.api_key = formData.api_key;
        }

        if (formData.api_endpoint) {
          createData.api_endpoint = formData.api_endpoint;
        }

        // Add default model to config_metadata for local providers
        if (formData.default_model && (formData.provider_type === 'ollama' || formData.provider_type === 'lmstudio')) {
          createData.config_metadata = {
            defaultModel: formData.default_model,
          };
        }

        await aiService.createProvider(createData);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save provider');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Provider Type - Only for new providers */}
      {!provider && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select AI Provider *
          </label>
          <div className="grid grid-cols-1 gap-3">
            {providerTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => handleTypeChange(type.value)}
                className={`p-4 border-2 rounded-lg text-left transition-colors ${
                  formData.provider_type === type.value
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="font-semibold text-gray-900">{type.label}</div>
                <div className="text-sm text-gray-600 mt-1">
                  {type.description}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Provider Name */}
      <div>
        <label htmlFor="provider_name" className="block text-sm font-medium text-gray-700 mb-1">
          Provider Name *
        </label>
        <input
          type="text"
          id="provider_name"
          value={formData.provider_name}
          onChange={(e) => setFormData({ ...formData, provider_name: e.target.value })}
          placeholder="e.g., My OpenAI Account, Local Ollama"
          required
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* API Key - Optional for local providers */}
      {(formData.provider_type === 'openai' || formData.provider_type === 'anthropic') && (
        <div>
          <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
            API Key {!provider && '*'}
          </label>
          <input
            type="password"
            id="api_key"
            value={formData.api_key}
            onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
            placeholder={provider ? 'Leave blank to keep existing key' : 'Enter your API key'}
            required={!provider}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          {provider ? (
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to keep the existing API key
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Your API key will be encrypted and stored securely
            </p>
          )}
        </div>
      )}

      {(formData.provider_type === 'ollama' || formData.provider_type === 'lmstudio') && (
        <>
          <div>
            <label htmlFor="api_key" className="block text-sm font-medium text-gray-700 mb-1">
              API Key (Optional)
            </label>
            <input
              type="password"
              id="api_key"
              value={formData.api_key}
              onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
              placeholder={provider ? 'Leave blank to keep existing key' : 'Leave blank if not required'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Most local LLM servers don't require an API key
            </p>
          </div>

          <div>
            <label htmlFor="default_model" className="block text-sm font-medium text-gray-700 mb-1">
              Default Model *
            </label>
            <input
              type="text"
              id="default_model"
              value={formData.default_model}
              onChange={(e) => setFormData({ ...formData, default_model: e.target.value })}
              placeholder={formData.provider_type === 'ollama' ? 'e.g., llama3.2, mistral, codellama' : 'e.g., local-model'}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              {formData.provider_type === 'ollama'
                ? 'Model name as shown in "ollama list" (must be pulled first)'
                : 'Model ID available in LM Studio'}
            </p>
          </div>
        </>
      )}

      {/* API Endpoint */}
      {(formData.provider_type === 'ollama' || formData.provider_type === 'lmstudio') ? (
        <div>
          <label htmlFor="api_endpoint" className="block text-sm font-medium text-gray-700 mb-1">
            API Endpoint *
          </label>
          <input
            type="text"
            id="api_endpoint"
            value={formData.api_endpoint}
            onChange={(e) => setFormData({ ...formData, api_endpoint: e.target.value })}
            placeholder={getDefaultEndpoint(formData.provider_type)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <p className="text-xs text-gray-500 mt-1">
            {formData.provider_type === 'ollama'
              ? 'Default: http://host.docker.internal:11434 (or your Ollama server URL)'
              : 'Default: http://localhost:1234 (or your LM Studio server URL)'}
          </p>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <div className="text-blue-500 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 font-medium">
                API Endpoint
              </p>
              <p className="text-sm text-gray-600 font-mono mt-1">
                {formData.api_endpoint || getDefaultEndpoint(formData.provider_type)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Automatically configured for {formData.provider_type === 'openai' ? 'OpenAI' : 'Anthropic'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Is Default */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="is_default"
          checked={formData.is_default}
          onChange={(e) => setFormData({ ...formData, is_default: e.target.checked })}
          className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label htmlFor="is_default" className="ml-2 block text-sm text-gray-700">
          Set as default provider
        </label>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="text-blue-500 mt-0.5">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-blue-700">
              <strong>What happens next:</strong>
            </p>
            {(formData.provider_type === 'openai' || formData.provider_type === 'anthropic') ? (
              <ul className="text-sm text-blue-600 mt-1 space-y-1 list-disc list-inside">
                <li>Your API key will be encrypted and stored securely</li>
                <li>Default models will be automatically configured</li>
                <li>You can start using AI features immediately</li>
              </ul>
            ) : (
              <ul className="text-sm text-blue-600 mt-1 space-y-1 list-disc list-inside">
                <li>Make sure your {formData.provider_type === 'ollama' ? 'Ollama' : 'LM Studio'} server is running</li>
                <li>Default models will be auto-configured (you can pull more models later)</li>
                <li>No API key needed for local models</li>
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : provider ? 'Update Provider' : 'Create Provider'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};
