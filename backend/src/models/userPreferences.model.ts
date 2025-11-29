import {
  UserPreferences,
  LearningPace,
  AIModelPreference,
} from '../types';

export class UserPreferencesModel implements UserPreferences {
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

  constructor(data: UserPreferences) {
    this.id = data.id;
    this.user_id = data.user_id;
    this.learning_pace = data.learning_pace;
    this.preferred_ai_model = data.preferred_ai_model;
    this.daily_study_time_minutes = data.daily_study_time_minutes;
    this.enable_email_notifications = data.enable_email_notifications;
    this.enable_push_notifications = data.enable_push_notifications;
    this.timezone = data.timezone;
    this.language = data.language;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON(): Omit<UserPreferences, never> {
    return {
      id: this.id,
      user_id: this.user_id,
      learning_pace: this.learning_pace,
      preferred_ai_model: this.preferred_ai_model,
      daily_study_time_minutes: this.daily_study_time_minutes,
      enable_email_notifications: this.enable_email_notifications,
      enable_push_notifications: this.enable_push_notifications,
      timezone: this.timezone,
      language: this.language,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
