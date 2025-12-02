import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exerciseService, type Exercise } from '../../services/exercise.service';
import { curriculumService, type Topic } from '../../services/curriculum.service';

export const ExerciseList: React.FC = () => {
  const { topicId } = useParams<{ topicId: string }>();
  const navigate = useNavigate();

  const [topic, setTopic] = useState<Topic | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [topicId]);

  const loadData = async () => {
    if (!topicId) return;

    try {
      setLoading(true);
      setError(null);

      // Load topic summary
      const topicData = await curriculumService.getTopicSummary(topicId);

      if (!topicData) {
        throw new Error('Topic data is null or undefined');
      }

      setTopic(topicData);

      // Load exercises for this topic
      const exercisesData = await exerciseService.getExercisesByTopic(topicId);
      setExercises(exercisesData);
    } catch (err: any) {
      setError(err.message || 'Failed to load exercises');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    if (!window.confirm('Are you sure you want to delete this exercise? This will also delete all test cases, hints, and student submissions.')) {
      return;
    }

    try {
      await exerciseService.deleteExercise(exerciseId);
      setSuccessMessage('Exercise deleted successfully');
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to delete exercise');
    }
  };

  const handleTogglePublish = async (exercise: Exercise) => {
    try {
      await exerciseService.updateExercise(exercise.id, {
        isPublished: !exercise.is_published,
      });
      setSuccessMessage(`Exercise ${exercise.is_published ? 'unpublished' : 'published'} successfully`);
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Failed to update exercise');
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLanguageIcon = (language: string) => {
    const icons: Record<string, string> = {
      javascript: '📜',
      java: '☕',
      python: '🐍',
      cpp: '⚙️',
      sql: '🗄️',
    };
    return icons[language] || '💻';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Topic not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          {topic && topic.curriculum_id && (
            <button
              onClick={() => navigate(`/instructor/curricula/${topic.curriculum_id}/topics`)}
              className="mb-4 flex items-center text-purple-600 hover:text-purple-800 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Topic Management
            </button>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Exercises</h1>
            <p className="text-gray-600 mt-1">{topic.title}</p>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        {successMessage && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-green-800">{successMessage}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Quick Actions</h2>
            <button
              onClick={() => navigate(`/topics/${topicId}/exercises/create`)}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Create New Exercise
            </button>
          </div>
        </div>

        {/* Exercises List */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Exercises ({exercises.length})
          </h2>
        </div>

        <div className="space-y-4">
          {exercises.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No exercises yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first exercise to provide hands-on practice for learners
              </p>
              <button
                onClick={() => navigate(`/topics/${topicId}/exercises/create`)}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 inline-flex items-center gap-2"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create Your First Exercise
              </button>
            </div>
          ) : (
            exercises.map((exercise, index) => (
              <div key={exercise.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded">
                        #{index + 1}
                      </span>
                      <span className="text-2xl">{getLanguageIcon(exercise.language)}</span>
                      <h3 className="text-xl font-semibold text-gray-900">{exercise.title}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(exercise.difficulty_level)}`}>
                        {exercise.difficulty_level}
                      </span>
                      {exercise.is_published ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded flex items-center gap-1">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                          Published
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                          Draft
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{exercise.description}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Language: {exercise.language}</span>
                      <span>•</span>
                      <span>Points: {exercise.points}</span>
                      {exercise.time_limit_seconds && (
                        <>
                          <span>•</span>
                          <span>Time Limit: {exercise.time_limit_seconds}s</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleTogglePublish(exercise)}
                      className={`px-3 py-2 ${
                        exercise.is_published
                          ? 'bg-gray-600 hover:bg-gray-700'
                          : 'bg-green-600 hover:bg-green-700'
                      } text-white rounded-lg text-sm`}
                      title={exercise.is_published ? 'Unpublish' : 'Publish'}
                    >
                      {exercise.is_published ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/exercises/${exercise.id}/edit`)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteExercise(exercise.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
