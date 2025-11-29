import { Topic } from '../types';

export class TopicModel {
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

  constructor(data: Topic) {
    this.id = data.id;
    this.curriculum_id = data.curriculum_id;
    this.parent_topic_id = data.parent_topic_id;
    this.title = data.title;
    this.description = data.description;
    this.content = data.content;
    this.order_index = data.order_index;
    this.estimated_duration_minutes = data.estimated_duration_minutes;
    this.is_required = data.is_required;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON(): Omit<Topic, never> {
    return {
      id: this.id,
      curriculum_id: this.curriculum_id,
      parent_topic_id: this.parent_topic_id,
      title: this.title,
      description: this.description,
      content: this.content,
      order_index: this.order_index,
      estimated_duration_minutes: this.estimated_duration_minutes,
      is_required: this.is_required,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
