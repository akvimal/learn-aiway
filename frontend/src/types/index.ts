export enum UserRole {
  LEARNER = 'learner',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
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
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse {
  users: User[];
  pagination: PaginationMeta;
}

export interface UserStats {
  total: number;
  byRole: {
    learner: number;
    instructor: number;
    admin: number;
  };
  active: number;
  inactive: number;
  emailVerified: number;
  emailUnverified: number;
}

export interface UpdateRoleInput {
  role: UserRole;
}

export interface UpdateStatusInput {
  is_active: boolean;
}

// Curriculum Management Types
export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
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
  domain: string;
  difficulty_level: DifficultyLevel;
  created_by: string;
  is_published: boolean;
  estimated_duration_hours: number | null;
  tags: string[] | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
  children?: Topic[];
  learning_objectives?: LearningObjective[];
}

export interface LearningObjective {
  id: string;
  topic_id: string;
  objective_text: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface CurriculumWithDetails {
  curriculum: Curriculum;
  topics: Topic[];
  progress: UserCurriculumProgress | null;
}

export interface UserCurriculumProgress {
  id: string;
  user_id: string;
  curriculum_id: string;
  current_topic_id: string | null;
  completed_at: string | null;
  last_accessed_at: string;
  created_at: string;
  updated_at: string;
}

export interface UserTopicProgress {
  id: string;
  user_id: string;
  topic_id: string;
  status: TopicStatus;
  time_spent_minutes: number;
  notes: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CurriculumStats {
  totalTopics: number;
  completedTopics: number;
  inProgressTopics: number;
  notStartedTopics: number;
}

export interface CurriculumCreateInput {
  title: string;
  description?: string;
  domain: string;
  difficulty_level: DifficultyLevel;
  estimated_duration_hours?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CurriculumUpdateInput {
  title?: string;
  description?: string;
  domain?: string;
  difficulty_level?: DifficultyLevel;
  estimated_duration_hours?: number;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface TopicCreateInput {
  parent_topic_id?: string;
  title: string;
  description?: string;
  content?: string;
  order_index?: number;
  estimated_duration_minutes?: number;
  is_required?: boolean;
}

export interface TopicUpdateInput {
  parent_topic_id?: string;
  title?: string;
  description?: string;
  content?: string;
  order_index?: number;
  estimated_duration_minutes?: number;
  is_required?: boolean;
}

export interface LearningObjectiveCreateInput {
  objective_text: string;
  order_index?: number;
}

export interface LearningObjectiveUpdateInput {
  objective_text?: string;
  order_index?: number;
}

export interface CurriculaListResponse {
  curricula: Curriculum[];
  pagination: PaginationMeta;
}

export interface CurriculumFilters {
  page?: number;
  limit?: number;
  domain?: string;
  difficulty_level?: DifficultyLevel;
  is_published?: boolean;
  search?: string;
}

// AI Provider Types
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
  created_at: string;
  updated_at: string;
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
  created_at: string;
  updated_at: string;
}

export interface AIProviderCreateInput {
  provider_type: AIProviderType;
  provider_name: string;
  api_key?: string;
  api_endpoint?: string;
  is_default?: boolean;
  config_metadata?: Record<string, any>;
}

export interface AIProviderUpdateInput {
  provider_name?: string;
  api_key?: string;
  api_endpoint?: string;
  is_active?: boolean;
  is_default?: boolean;
  config_metadata?: Record<string, any>;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatCompletionRequest {
  model?: string;
  messages: AIChatMessage[];
  temperature?: number;
  max_tokens?: number;
  providerId?: string;
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

export interface AIUsageStats {
  total_requests: string;
  total_tokens: string;
  total_cost: number | null;
  avg_latency: string;
}

export interface AIModelsResponse {
  configured: AIModel[];
  available: string[];
}
