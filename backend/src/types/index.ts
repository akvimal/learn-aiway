import { Request } from 'express';

export enum UserRole {
  LEARNER = 'learner',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserCreateInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface UserLoginInput {
  email: string;
  password: string;
}

export interface JwtPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export enum LearningPace {
  SLOW = 'slow',
  MEDIUM = 'medium',
  FAST = 'fast',
}

export enum AIModelPreference {
  GPT_4 = 'gpt-4',
  GPT_3_5_TURBO = 'gpt-3.5-turbo',
  CLAUDE_3 = 'claude-3',
  CLAUDE_2 = 'claude-2',
}

export interface UserPreferences {
  id: string;
  user_id: string;
  learning_pace: LearningPace;
  preferred_ai_model: AIModelPreference;
  daily_study_time_minutes: number;
  enable_email_notifications: boolean;
  enable_push_notifications: boolean;
  timezone: string;
  language: string;
  created_at: Date;
  updated_at: Date;
}

export interface UserProfileUpdateInput {
  first_name?: string;
  last_name?: string;
}

export interface UserPreferencesUpdateInput {
  learning_pace?: LearningPace;
  preferred_ai_model?: AIModelPreference;
  daily_study_time_minutes?: number;
  enable_email_notifications?: boolean;
  enable_push_notifications?: boolean;
  timezone?: string;
  language?: string;
}

// Curriculum Management Types

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
  EXPERT = 'expert',
}

export enum TopicStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export interface Curriculum {
  id: string;
  title: string;
  description: string | null;
  domain?: string | null; // Deprecated: kept for backward compatibility
  category: string | null;
  specialization: string | null;
  difficulty_level: DifficultyLevel;
  created_by: string;
  is_published: boolean;
  estimated_duration_hours: number | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  created_at: Date;
  updated_at: Date;
}

export interface CurriculumCreateInput {
  title: string;
  description?: string;
  domain?: string; // Deprecated: kept for backward compatibility
  category?: string;
  specialization?: string;
  difficulty_level: DifficultyLevel;
  estimated_duration_hours?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CurriculumUpdateInput {
  title?: string;
  description?: string;
  domain?: string; // Deprecated: kept for backward compatibility
  category?: string;
  specialization?: string;
  difficulty_level?: DifficultyLevel;
  is_published?: boolean;
  estimated_duration_hours?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface Topic {
  id: string;
  curriculum_id: string;
  parent_topic_id: string | null;
  title: string;
  description: string | null;
  content: string | null;
  order_index: number;
  estimated_duration_minutes: number | null;
  is_required: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface TopicCreateInput {
  curriculum_id: string;
  parent_topic_id?: string | null;
  title: string;
  description?: string;
  content?: string;
  order_index: number;
  estimated_duration_minutes?: number;
  is_required?: boolean;
}

export interface TopicUpdateInput {
  title?: string;
  description?: string;
  content?: string;
  order_index?: number;
  estimated_duration_minutes?: number;
  is_required?: boolean;
}

export interface LearningObjective {
  id: string;
  topic_id: string;
  objective_text: string;
  order_index: number;
  requires_exercise: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LearningObjectiveCreateInput {
  topic_id: string;
  objective_text: string;
  order_index: number;
  requires_exercise?: boolean;
}

export interface UserCurriculumProgress {
  id: string;
  user_id: string;
  curriculum_id: string;
  current_topic_id: string | null;
  completion_percentage: number;
  started_at: Date;
  last_accessed_at: Date;
  completed_at: Date | null;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: TopicStatus;
  time_spent_minutes: number;
  notes: string | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export interface UserTopicProgressUpdateInput {
  status?: TopicStatus;
  time_spent_minutes?: number;
  notes?: string;
}

// AI Model Integration Types

export enum AIProviderType {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  OLLAMA = 'ollama',
  LMSTUDIO = 'lmstudio',
}

export enum AIModelType {
  CHAT = 'chat',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding',
}

export interface AIProvider {
  id: string;
  user_id: string;
  provider_type: AIProviderType;
  provider_name: string;
  api_key_encrypted: string | null;
  api_endpoint: string | null;
  is_active: boolean;
  is_default: boolean;
  config_metadata: Record<string, any>;
  created_at: Date;
  updated_at: Date;
}

export interface AIProviderCreateInput {
  provider_type: AIProviderType;
  provider_name: string;
  api_key?: string; // Plain text, will be encrypted
  api_endpoint?: string;
  is_default?: boolean;
  config_metadata?: Record<string, any>;
}

export interface AIProviderUpdateInput {
  provider_name?: string;
  api_key?: string; // Plain text, will be encrypted
  api_endpoint?: string;
  is_active?: boolean;
  is_default?: boolean;
  config_metadata?: Record<string, any>;
}

export interface AIModel {
  id: string;
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: AIModelType;
  capabilities: Record<string, any>;
  pricing_info: Record<string, any>;
  max_tokens: number | null;
  is_available: boolean;
  is_default: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AIModelCreateInput {
  provider_id: string;
  model_id: string;
  model_name: string;
  model_type: AIModelType;
  capabilities?: Record<string, any>;
  pricing_info?: Record<string, any>;
  max_tokens?: number;
  is_default?: boolean;
}

export interface AIUsageLog {
  id: string;
  user_id: string;
  provider_id: string;
  model_id: string;
  session_id: string | null;
  request_tokens: number;
  response_tokens: number;
  total_tokens: number;
  latency_ms: number | null;
  cost_usd: number | null;
  error_message: string | null;
  created_at: Date;
}

// AI Chat Completion Types

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatCompletionRequest {
  messages: AIChatMessage[];
  model?: string; // Optional: use default if not specified
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface AIChatCompletionResponse {
  content: string;
  model: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  finish_reason: string;
  latency_ms: number;
}

export interface AIProviderInterface {
  sendChatCompletion(request: AIChatCompletionRequest): Promise<AIChatCompletionResponse>;
  streamChatCompletion(request: AIChatCompletionRequest): AsyncIterable<string>;
  testConnection(): Promise<boolean>;
  getAvailableModels(): Promise<string[]>;
}
