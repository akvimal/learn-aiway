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
