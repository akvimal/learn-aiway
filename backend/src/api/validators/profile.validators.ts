import { z } from 'zod';
import { LearningPace, AIModelPreference } from '../../types';

export const updateProfileSchema = z.object({
  first_name: z.string().min(1, 'First name is required').max(100).optional(),
  last_name: z.string().min(1, 'Last name is required').max(100).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});

export const updatePreferencesSchema = z.object({
  learning_pace: z.nativeEnum(LearningPace).optional(),
  preferred_ai_model: z.nativeEnum(AIModelPreference).optional(),
  daily_study_time_minutes: z.number().min(1).max(480).optional(),
  enable_email_notifications: z.boolean().optional(),
  enable_push_notifications: z.boolean().optional(),
  timezone: z.string().max(50).optional(),
  language: z.string().length(2).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: 'At least one field must be provided',
});
