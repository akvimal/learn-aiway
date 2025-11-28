-- Migration: Create user_preferences table
-- Description: Store user learning preferences and settings

CREATE TYPE learning_pace AS ENUM ('slow', 'medium', 'fast');
CREATE TYPE ai_model_preference AS ENUM ('gpt-4', 'gpt-3.5-turbo', 'claude-3', 'claude-2');

CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  learning_pace learning_pace DEFAULT 'medium',
  preferred_ai_model ai_model_preference DEFAULT 'gpt-4',
  daily_study_time_minutes INTEGER DEFAULT 30 CHECK (daily_study_time_minutes > 0 AND daily_study_time_minutes <= 480),
  enable_email_notifications BOOLEAN DEFAULT TRUE,
  enable_push_notifications BOOLEAN DEFAULT FALSE,
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(10) DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- Trigger to update updated_at timestamp
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically create default preferences when a new user is created
CREATE TRIGGER create_user_preferences_on_user_creation
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_user_preferences();
