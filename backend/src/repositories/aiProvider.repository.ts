import { Pool } from 'pg';
import { pool } from '../config/database.config';
import {
  AIProvider,
  AIProviderCreateInput,
  AIProviderUpdateInput,
  AIModel,
  AIModelCreateInput,
  AIUsageLog,
  AIProviderType,
} from '../types';
import { AI_PROVIDER_FIELDS, mapRowToAIProvider } from '../models/aiProvider.model';
import { AI_MODEL_FIELDS, mapRowToAIModel, PREDEFINED_MODELS } from '../models/aiModel.model';
import { encryptText } from '../utils/encryption.util';

export class AIProviderRepository {
  private db: Pool;

  constructor(database: Pool = pool) {
    this.db = database;
  }

  // ============================================================================
  // AI Providers
  // ============================================================================

  async createProvider(
    userId: string,
    data: AIProviderCreateInput
  ): Promise<AIProvider> {
    const encryptedKey = data.api_key ? encryptText(data.api_key) : null;

    // If setting as default, unset other defaults first
    if (data.is_default) {
      await this.db.query(
        'UPDATE ai_providers SET is_default = false WHERE user_id = $1',
        [userId]
      );
    }

    const query = `
      INSERT INTO ai_providers (
        user_id, provider_type, provider_name, api_key_encrypted,
        api_endpoint, is_default, config_metadata
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING ${AI_PROVIDER_FIELDS.join(', ')}
    `;

    const result = await this.db.query(query, [
      userId,
      data.provider_type,
      data.provider_name,
      encryptedKey,
      data.api_endpoint || null,
      data.is_default || false,
      JSON.stringify(data.config_metadata || {}),
    ]);

    const provider = mapRowToAIProvider(result.rows[0]);

    // Auto-create default models for this provider
    await this.createDefaultModelsForProvider(provider.id, data.provider_type);

    return provider;
  }

  async getProviderById(providerId: string, userId: string): Promise<AIProvider | null> {
    const query = `
      SELECT ${AI_PROVIDER_FIELDS.join(', ')}
      FROM ai_providers
      WHERE id = $1 AND user_id = $2
    `;

    const result = await this.db.query(query, [providerId, userId]);
    return result.rows[0] ? mapRowToAIProvider(result.rows[0]) : null;
  }

  async getUserProviders(userId: string, activeOnly: boolean = false): Promise<AIProvider[]> {
    let query = `
      SELECT ${AI_PROVIDER_FIELDS.join(', ')}
      FROM ai_providers
      WHERE user_id = $1
    `;

    if (activeOnly) {
      query += ' AND is_active = true';
    }

    query += ' ORDER BY is_default DESC, created_at ASC';

    const result = await this.db.query(query, [userId]);
    return result.rows.map(mapRowToAIProvider);
  }

  async getDefaultProvider(userId: string): Promise<AIProvider | null> {
    const query = `
      SELECT ${AI_PROVIDER_FIELDS.join(', ')}
      FROM ai_providers
      WHERE user_id = $1 AND is_default = true AND is_active = true
    `;

    const result = await this.db.query(query, [userId]);
    return result.rows[0] ? mapRowToAIProvider(result.rows[0]) : null;
  }

  async updateProvider(
    providerId: string,
    userId: string,
    data: AIProviderUpdateInput
  ): Promise<AIProvider | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.provider_name !== undefined) {
      updates.push(`provider_name = $${paramIndex++}`);
      values.push(data.provider_name);
    }

    if (data.api_key !== undefined) {
      updates.push(`api_key_encrypted = $${paramIndex++}`);
      values.push(data.api_key ? encryptText(data.api_key) : null);
    }

    if (data.api_endpoint !== undefined) {
      updates.push(`api_endpoint = $${paramIndex++}`);
      values.push(data.api_endpoint);
    }

    if (data.is_active !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(data.is_active);
    }

    if (data.is_default !== undefined) {
      if (data.is_default) {
        // Unset other defaults first
        await this.db.query(
          'UPDATE ai_providers SET is_default = false WHERE user_id = $1',
          [userId]
        );
      }
      updates.push(`is_default = $${paramIndex++}`);
      values.push(data.is_default);
    }

    if (data.config_metadata !== undefined) {
      updates.push(`config_metadata = $${paramIndex++}`);
      values.push(JSON.stringify(data.config_metadata));
    }

    if (updates.length === 0) {
      return this.getProviderById(providerId, userId);
    }

    values.push(providerId, userId);

    const query = `
      UPDATE ai_providers
      SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $${paramIndex++} AND user_id = $${paramIndex++}
      RETURNING ${AI_PROVIDER_FIELDS.join(', ')}
    `;

    const result = await this.db.query(query, values);
    return result.rows[0] ? mapRowToAIProvider(result.rows[0]) : null;
  }

  async deleteProvider(providerId: string, userId: string): Promise<boolean> {
    const query = 'DELETE FROM ai_providers WHERE id = $1 AND user_id = $2';
    const result = await this.db.query(query, [providerId, userId]);
    return result.rowCount! > 0;
  }

  // ============================================================================
  // AI Models
  // ============================================================================

  async createModel(data: AIModelCreateInput): Promise<AIModel> {
    // If setting as default, unset other defaults for this provider first
    if (data.is_default) {
      await this.db.query(
        'UPDATE ai_models SET is_default = false WHERE provider_id = $1',
        [data.provider_id]
      );
    }

    const query = `
      INSERT INTO ai_models (
        provider_id, model_id, model_name, model_type,
        capabilities, pricing_info, max_tokens, is_default
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${AI_MODEL_FIELDS.join(', ')}
    `;

    const result = await this.db.query(query, [
      data.provider_id,
      data.model_id,
      data.model_name,
      data.model_type,
      JSON.stringify(data.capabilities || {}),
      JSON.stringify(data.pricing_info || {}),
      data.max_tokens || null,
      data.is_default || false,
    ]);

    return mapRowToAIModel(result.rows[0]);
  }

  async getProviderModels(providerId: string): Promise<AIModel[]> {
    const query = `
      SELECT ${AI_MODEL_FIELDS.join(', ')}
      FROM ai_models
      WHERE provider_id = $1 AND is_available = true
      ORDER BY is_default DESC, created_at ASC
    `;

    const result = await this.db.query(query, [providerId]);
    return result.rows.map(mapRowToAIModel);
  }

  async getDefaultModel(providerId: string): Promise<AIModel | null> {
    const query = `
      SELECT ${AI_MODEL_FIELDS.join(', ')}
      FROM ai_models
      WHERE provider_id = $1 AND is_default = true AND is_available = true
    `;

    const result = await this.db.query(query, [providerId]);
    return result.rows[0] ? mapRowToAIModel(result.rows[0]) : null;
  }

  async setDefaultModel(modelId: string, providerId: string): Promise<boolean> {
    // Unset other defaults for this provider
    await this.db.query(
      'UPDATE ai_models SET is_default = false WHERE provider_id = $1',
      [providerId]
    );

    // Set new default
    const result = await this.db.query(
      'UPDATE ai_models SET is_default = true WHERE id = $1 AND provider_id = $2',
      [modelId, providerId]
    );

    return result.rowCount! > 0;
  }

  // ============================================================================
  // AI Usage Logs
  // ============================================================================

  async logUsage(data: Omit<AIUsageLog, 'id' | 'created_at'>): Promise<void> {
    const query = `
      INSERT INTO ai_usage_logs (
        user_id, provider_id, model_id, session_id,
        request_tokens, response_tokens, total_tokens,
        latency_ms, cost_usd, error_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    await this.db.query(query, [
      data.user_id,
      data.provider_id,
      data.model_id,
      data.session_id || null,
      data.request_tokens,
      data.response_tokens,
      data.total_tokens,
      data.latency_ms || null,
      data.cost_usd || null,
      data.error_message || null,
    ]);
  }

  async getUserUsageStats(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    let query = `
      SELECT
        COUNT(*) as total_requests,
        SUM(total_tokens) as total_tokens,
        SUM(cost_usd) as total_cost,
        AVG(latency_ms) as avg_latency
      FROM ai_usage_logs
      WHERE user_id = $1
    `;

    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate);
      query += ` AND created_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND created_at <= $${params.length}`;
    }

    const result = await this.db.query(query, params);
    return result.rows[0];
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  private async createDefaultModelsForProvider(
    providerId: string,
    providerType: AIProviderType
  ): Promise<void> {
    const predefinedModels = PREDEFINED_MODELS[providerType] || [];

    for (let i = 0; i < predefinedModels.length; i++) {
      const modelData = predefinedModels[i];
      await this.createModel({
        provider_id: providerId,
        ...modelData,
        is_default: i === 0, // First model is default
      });
    }
  }
}
