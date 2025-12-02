import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exerciseService } from '../../services/exercise.service';
import { curriculumService } from '../../services/curriculum.service';
import { ExerciseEditor } from './ExerciseEditor';

export const ExerciseEditorWrapper: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState<any | null>(null);
  const [topic, setTopic] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadExercise();
  }, [exerciseId]);

  const loadExercise = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);
      const exerciseData = await exerciseService.getExerciseById(exerciseId);
      setExercise(exerciseData);

      // Load topic data
      if (exerciseData.topic_id) {
        const topicData = await curriculumService.getTopicSummary(exerciseData.topic_id);
        setTopic(topicData);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    if (exercise?.topic_id) {
      navigate(`/topics/${exercise.topic_id}/exercises`);
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Exercise not found'}</p>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 text-purple-600 hover:text-purple-800 font-medium"
        >
          ← Go Back
        </button>
      </div>
    );
  }

  return (
    <ExerciseEditor
      exerciseId={exercise.id}
      topicId={exercise.topic_id}
      topicTitle={topic?.title || 'Unknown Topic'}
      topicContent={topic?.content || ''}
      initialData={{
        title: exercise.title,
        description: exercise.description,
        instructions: exercise.instructions,
        language: exercise.language,
        difficultyLevel: exercise.difficulty_level,
        starterCode: exercise.starter_code || '',
        solutionCode: exercise.solution_code || '',
        points: exercise.points,
        isPublished: exercise.is_published,
      }}
      initialTestCases={exercise.test_cases || []}
      initialHints={exercise.hints || []}
      onComplete={handleComplete}
    />
  );
};
