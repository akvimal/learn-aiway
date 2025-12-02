import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { exerciseService, type ExerciseWithDetails } from '../../services/exercise.service';
import { CodeEditor } from './CodeEditor';

export const ExerciseSolver: React.FC = () => {
  const { exerciseId } = useParams<{ exerciseId: string }>();
  const navigate = useNavigate();

  const [exercise, setExercise] = useState<ExerciseWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showHints, setShowHints] = useState(false);
  const [requestedHints, setRequestedHints] = useState<Set<number>>(new Set());
  const [submissionComplete, setSubmissionComplete] = useState(false);

  useEffect(() => {
    loadExercise();
    loadHintUsage();
  }, [exerciseId]);

  const loadExercise = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);
      setError(null);
      const data = await exerciseService.getExerciseById(exerciseId);
      setExercise(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load exercise');
    } finally {
      setLoading(false);
    }
  };

  const loadHintUsage = async () => {
    if (!exerciseId) return;

    try {
      const hintIds = await exerciseService.getHintUsage(exerciseId);
      // Convert hint IDs to hint levels
      if (exercise) {
        const levels = new Set(
          exercise.hints
            .filter((h) => hintIds.includes(h.id))
            .map((h) => h.hint_level)
        );
        setRequestedHints(levels);
      }
    } catch (err) {
      console.error('Failed to load hint usage:', err);
    }
  };

  const handleRequestHint = async (hintLevel: number) => {
    if (!exerciseId || requestedHints.has(hintLevel)) return;

    try {
      await exerciseService.requestHint(exerciseId, hintLevel);
      setRequestedHints((prev) => new Set(prev).add(hintLevel));
    } catch (err: any) {
      console.error('Failed to request hint:', err);
    }
  };

  const handleSubmissionComplete = (result: any) => {
    setSubmissionComplete(true);
    // Show success message or navigate back
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

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
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
      </div>
    );
  }

  // Filter test cases - only show public ones to learners before submission
  const publicTestCases = exercise.test_cases.filter((tc) => !tc.is_hidden);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-2 flex items-center text-purple-600 hover:text-purple-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Learning
          </button>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{exercise.title}</h1>
            <span
              className={`px-3 py-1 text-sm font-medium rounded ${getDifficultyColor(
                exercise.difficulty_level
              )}`}
            >
              {exercise.difficulty_level}
            </span>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
              {exercise.language}
            </span>
            <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-medium rounded">
              {exercise.points} points
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Instructions and Hints */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Description</h2>
              <p className="text-gray-700">{exercise.description}</p>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Instructions</h2>
              <div className="prose max-w-none text-gray-700 whitespace-pre-wrap">
                {exercise.instructions}
              </div>
            </div>

            {/* Explanation (if available and submission complete) */}
            {submissionComplete && exercise.explanation && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-green-900 mb-3">Explanation</h2>
                <p className="text-green-800">{exercise.explanation}</p>
              </div>
            )}

            {/* Hints */}
            {exercise.hints.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Hints ({requestedHints.size}/{exercise.hints.length})
                  </h2>
                  <button
                    onClick={() => setShowHints(!showHints)}
                    className="text-sm text-purple-600 hover:text-purple-800"
                  >
                    {showHints ? 'Hide' : 'Show'} Hints
                  </button>
                </div>

                {showHints && (
                  <div className="space-y-3">
                    {exercise.hints
                      .sort((a, b) => a.hint_level - b.hint_level)
                      .map((hint) => {
                        const isRequested = requestedHints.has(hint.hint_level);
                        return (
                          <div
                            key={hint.id}
                            className={`border rounded-lg p-4 ${
                              isRequested
                                ? 'bg-yellow-50 border-yellow-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <h3 className="font-medium text-gray-900 mb-2">
                                  Hint {hint.hint_level}
                                  {hint.reveals_solution && (
                                    <span className="ml-2 text-xs text-red-600">
                                      (Reveals Solution)
                                    </span>
                                  )}
                                </h3>
                                {isRequested ? (
                                  <p className="text-gray-700">{hint.hint_text}</p>
                                ) : (
                                  <button
                                    onClick={() => handleRequestHint(hint.hint_level)}
                                    className="text-sm text-purple-600 hover:text-purple-800"
                                  >
                                    Click to reveal
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Code Editor */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-white rounded-lg shadow p-6">
              <CodeEditor
                exerciseId={exercise.id}
                starterCode={exercise.starter_code || '// Start coding here\n'}
                language={exercise.language}
                testCases={publicTestCases}
                onSubmissionComplete={handleSubmissionComplete}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
