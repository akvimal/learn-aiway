import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import { ExerciseManager } from './ExerciseManager';
import type { Topic } from '../../types';

export const ExerciseManagerWrapper: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTopic();
  }, [topicId]);

  const loadTopic = async () => {
    if (!topicId) return;

    try {
      setLoading(true);
      const topicData = await curriculumService.getTopicSummary(topicId);
      setTopic(topicData);
    } catch (err: any) {
      setError(err.message || 'Failed to load topic');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    navigate(`/topics/${topicId}/exercises`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !topic) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Topic not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <ExerciseManager
      topicId={topicId!}
      topicTitle={topic.title}
      topicContent={topic.content || ''}
      onComplete={handleComplete}
    />
  );
};
