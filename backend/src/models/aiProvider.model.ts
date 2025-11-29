import { AIProvider, AIProviderType } from '../types';

export const AI_PROVIDER_FIELDS = [
  'id',
  'user_id',
  'provider_type',
  'provider_name',
  'api_key_encrypted',
  'api_endpoint',
  'is_active',
  'is_default',
  'config_metadata',
  'created_at',
  'updated_at',
] as const;

export const mapRowToAIProvider = (row: any): AIProvider => ({
  id: row.id,
  user_id: row.user_id,
  provider_type: row.provider_type as AIProviderType,
  provider_name: row.provider_name,
  api_key_encrypted: row.api_key_encrypted,
  api_endpoint: row.api_endpoint,
  is_active: row.is_active,
  is_default: row.is_default,
  config_metadata: row.config_metadata || {},
  created_at: row.created_at,
  updated_at: row.updated_at,
});
