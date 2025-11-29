-- Migration: AI Configuration Tables
-- Description: Tables for managing AI provider configurations and model settings

-- AI Providers table: Stores configured AI providers (OpenAI, Anthropic, Local LLMs)
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('openai', 'anthropic', 'ollama', 'lmstudio')),
    provider_name VARCHAR(100) NOT NULL, -- User-friendly name (e.g., "My OpenAI", "Local Llama")
    api_key_encrypted TEXT, -- Encrypted API key (null for local LLMs)
    api_endpoint TEXT, -- Custom endpoint (e.g., for local LLMs or custom proxies)
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    config_metadata JSONB DEFAULT '{}', -- Provider-specific configuration (timeout, max_tokens, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create unique index for default provider per user
CREATE UNIQUE INDEX idx_unique_default_provider_per_user
    ON ai_providers(user_id) WHERE is_default = true;

-- AI Models table: Available models for each provider
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    model_id VARCHAR(100) NOT NULL, -- Model identifier (e.g., "gpt-4", "claude-3-opus")
    model_name VARCHAR(100) NOT NULL, -- User-friendly name
    model_type VARCHAR(50) NOT NULL CHECK (model_type IN ('chat', 'completion', 'embedding')),
    capabilities JSONB DEFAULT '{}', -- Model capabilities (function_calling, vision, etc.)
    pricing_info JSONB DEFAULT '{}', -- Cost per token info (optional)
    max_tokens INTEGER, -- Maximum context window
    is_available BOOLEAN NOT NULL DEFAULT true,
    is_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Ensure unique model per provider
    CONSTRAINT unique_model_per_provider UNIQUE (provider_id, model_id)
);

-- Create unique index for default model per provider
CREATE UNIQUE INDEX idx_unique_default_model_per_provider
    ON ai_models(provider_id) WHERE is_default = true;

-- AI Usage Log table: Track AI API usage for analytics and cost tracking
CREATE TABLE IF NOT EXISTS ai_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
    model_id UUID NOT NULL REFERENCES ai_models(id) ON DELETE CASCADE,
    session_id UUID, -- Optional: link to learning session
    request_tokens INTEGER NOT NULL DEFAULT 0,
    response_tokens INTEGER NOT NULL DEFAULT 0,
    total_tokens INTEGER NOT NULL DEFAULT 0,
    latency_ms INTEGER, -- Response time in milliseconds
    cost_usd DECIMAL(10, 6), -- Calculated cost (if available)
    error_message TEXT, -- Error if request failed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX idx_ai_providers_user_id ON ai_providers(user_id);
CREATE INDEX idx_ai_providers_user_active ON ai_providers(user_id, is_active) WHERE is_active = true;
CREATE INDEX idx_ai_models_provider_id ON ai_models(provider_id);
CREATE INDEX idx_ai_models_provider_available ON ai_models(provider_id, is_available) WHERE is_available = true;
CREATE INDEX idx_ai_usage_logs_user_id ON ai_usage_logs(user_id);
CREATE INDEX idx_ai_usage_logs_created_at ON ai_usage_logs(created_at);
CREATE INDEX idx_ai_usage_logs_session_id ON ai_usage_logs(session_id) WHERE session_id IS NOT NULL;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default AI models for reference (users will configure their own providers)
-- These are templates/suggestions when users add providers
COMMENT ON TABLE ai_providers IS 'Stores user-configured AI provider credentials and settings';
COMMENT ON TABLE ai_models IS 'Available AI models for each configured provider';
COMMENT ON TABLE ai_usage_logs IS 'Tracks AI API usage for analytics and cost monitoring';
