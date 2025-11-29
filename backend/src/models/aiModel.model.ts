import { AIModel, AIModelType } from '../types';

export const AI_MODEL_FIELDS = [
  'id',
  'provider_id',
  'model_id',
  'model_name',
  'model_type',
  'capabilities',
  'pricing_info',
  'max_tokens',
  'is_available',
  'is_default',
  'created_at',
  'updated_at',
] as const;

export const mapRowToAIModel = (row: any): AIModel => ({
  id: row.id,
  provider_id: row.provider_id,
  model_id: row.model_id,
  model_name: row.model_name,
  model_type: row.model_type as AIModelType,
  capabilities: row.capabilities || {},
  pricing_info: row.pricing_info || {},
  max_tokens: row.max_tokens,
  is_available: row.is_available,
  is_default: row.is_default,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

// Predefined model configurations for different providers
export const PREDEFINED_MODELS = {
  openai: [
    {
      model_id: 'gpt-4-turbo-preview',
      model_name: 'GPT-4 Turbo',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: true, vision: false, json_mode: true },
      pricing_info: { input_per_1k: 0.01, output_per_1k: 0.03 },
      max_tokens: 128000,
    },
    {
      model_id: 'gpt-4',
      model_name: 'GPT-4',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: true, vision: false, json_mode: false },
      pricing_info: { input_per_1k: 0.03, output_per_1k: 0.06 },
      max_tokens: 8192,
    },
    {
      model_id: 'gpt-3.5-turbo',
      model_name: 'GPT-3.5 Turbo',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: true, vision: false, json_mode: true },
      pricing_info: { input_per_1k: 0.0005, output_per_1k: 0.0015 },
      max_tokens: 16385,
    },
  ],
  anthropic: [
    {
      model_id: 'claude-3-opus-20240229',
      model_name: 'Claude 3 Opus',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: true, vision: true, json_mode: false },
      pricing_info: { input_per_1k: 0.015, output_per_1k: 0.075 },
      max_tokens: 200000,
    },
    {
      model_id: 'claude-3-sonnet-20240229',
      model_name: 'Claude 3 Sonnet',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: true, vision: true, json_mode: false },
      pricing_info: { input_per_1k: 0.003, output_per_1k: 0.015 },
      max_tokens: 200000,
    },
    {
      model_id: 'claude-3-haiku-20240307',
      model_name: 'Claude 3 Haiku',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: false, vision: true, json_mode: false },
      pricing_info: { input_per_1k: 0.00025, output_per_1k: 0.00125 },
      max_tokens: 200000,
    },
  ],
  ollama: [
    {
      model_id: 'llama2',
      model_name: 'Llama 2',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: false, vision: false, json_mode: false },
      pricing_info: {},
      max_tokens: 4096,
    },
    {
      model_id: 'mistral',
      model_name: 'Mistral',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: false, vision: false, json_mode: false },
      pricing_info: {},
      max_tokens: 8192,
    },
    {
      model_id: 'codellama',
      model_name: 'Code Llama',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: false, vision: false, json_mode: false },
      pricing_info: {},
      max_tokens: 16384,
    },
  ],
  lmstudio: [
    {
      model_id: 'local-model',
      model_name: 'Local Model',
      model_type: AIModelType.CHAT,
      capabilities: { function_calling: false, vision: false, json_mode: false },
      pricing_info: {},
      max_tokens: 4096,
    },
  ],
};
