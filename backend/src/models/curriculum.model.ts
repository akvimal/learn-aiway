import { Curriculum, DifficultyLevel } from '../types';

export class CurriculumModel {
  id: string;
  title: string;
  description: string | null;
  domain?: string | null;
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

  constructor(data: Curriculum) {
    this.id = data.id;
    this.title = data.title;
    this.description = data.description;
    this.domain = data.domain;
    this.category = data.category;
    this.specialization = data.specialization;
    this.difficulty_level = data.difficulty_level;
    this.created_by = data.created_by;
    this.is_published = data.is_published;
    this.estimated_duration_hours = data.estimated_duration_hours;
    this.tags = data.tags;
    this.metadata = data.metadata;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON(): Omit<Curriculum, never> {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      domain: this.domain,
      category: this.category,
      specialization: this.specialization,
      difficulty_level: this.difficulty_level,
      created_by: this.created_by,
      is_published: this.is_published,
      estimated_duration_hours: this.estimated_duration_hours,
      tags: this.tags,
      metadata: this.metadata,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
