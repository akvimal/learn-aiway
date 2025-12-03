import { LearningObjective } from '../types';

export class LearningObjectiveModel {
  id: string;
  topic_id: string;
  objective_text: string;
  order_index: number;
  requires_exercise: boolean;
  created_at: Date;
  updated_at: Date;

  constructor(data: LearningObjective) {
    this.id = data.id;
    this.topic_id = data.topic_id;
    this.objective_text = data.objective_text;
    this.order_index = data.order_index;
    this.requires_exercise = data.requires_exercise ?? true;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  toJSON(): Omit<LearningObjective, never> {
    return {
      id: this.id,
      topic_id: this.topic_id,
      objective_text: this.objective_text,
      order_index: this.order_index,
      requires_exercise: this.requires_exercise,
      created_at: this.created_at,
      updated_at: this.updated_at,
    };
  }
}
