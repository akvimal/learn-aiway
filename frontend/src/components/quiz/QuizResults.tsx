import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';
import type { QuizAttemptWithAnswers } from '../../types';

export const QuizResults: React.FC = () => {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();

  const [results, setResults] = useState<QuizAttemptWithAnswers | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAnswers, setShowAnswers] = useState(false);

  useEffect(() => {
    if (attemptId) {
      loadResults();
    }
  }, [attemptId]);

  const loadResults = async () => {
    if (!attemptId) return;

    try {
      setLoading(true);
      const data = await quizService.getAttemptResults(attemptId);
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading results...</div>
      </div>
    );
  }

  if (error || !results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error || 'Results not found'}</p>
          <button
            onClick={() => navigate(-1)}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const scorePercentage = results.score || 0;
  const passed = results.passed || false;
  const timeTakenMinutes = results.time_taken_seconds
    ? Math.floor(results.time_taken_seconds / 60)
    : 0;
  const timeTakenSeconds = results.time_taken_seconds
    ? results.time_taken_seconds % 60
    : 0;

  const correctAnswers = results.answers.filter(a => a.is_correct).length;
  const totalQuestions = results.answers.length;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Results Header */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="text-center">
            {/* Pass/Fail Badge */}
            <div className="mb-6">
              {passed ? (
                <div className="inline-flex items-center px-6 py-3 bg-green-100 text-green-700 rounded-full">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xl font-bold">Passed!</span>
                </div>
              ) : (
                <div className="inline-flex items-center px-6 py-3 bg-red-100 text-red-700 rounded-full">
                  <svg
                    className="w-6 h-6 mr-2"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-xl font-bold">Did Not Pass</span>
                </div>
              )}
            </div>

            {/* Score */}
            <h1 className="text-5xl font-bold text-gray-900 mb-2">
              {scorePercentage.toFixed(1)}%
            </h1>
            <p className="text-gray-600 mb-6">Your Score</p>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-blue-900">
                  {correctAnswers}/{totalQuestions}
                </div>
                <div className="text-sm text-blue-700 mt-1">Correct Answers</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-purple-900">
                  {timeTakenMinutes}:{timeTakenSeconds.toString().padStart(2, '0')}
                </div>
                <div className="text-sm text-purple-700 mt-1">Time Taken</div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-3xl font-bold text-gray-900">
                  {results.points_earned?.toFixed(0)}/{results.total_points?.toFixed(0)}
                </div>
                <div className="text-sm text-gray-700 mt-1">Points Earned</div>
              </div>
            </div>
          </div>
        </div>

        {/* Answer Review Toggle */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <button
            onClick={() => setShowAnswers(!showAnswers)}
            className="w-full flex items-center justify-between text-left"
          >
            <span className="text-lg font-semibold text-gray-900">
              Review Your Answers
            </span>
            <svg
              className={`w-5 h-5 text-gray-600 transition-transform ${
                showAnswers ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
        </div>

        {/* Answer Review */}
        {showAnswers && (
          <div className="space-y-6 mb-6">
            {results.answers.map((answer, index) => (
              <div
                key={answer.id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  answer.is_correct
                    ? 'border-green-500'
                    : 'border-red-500'
                }`}
              >
                {/* Question Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm font-medium text-gray-500">
                        Question {index + 1}
                      </span>
                      {answer.is_correct ? (
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded">
                          Correct
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded">
                          Incorrect
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {answer.question_text}
                    </h3>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium text-gray-900">
                      {answer.points_earned} pts
                    </div>
                  </div>
                </div>

                {/* Your Answer */}
                {answer.option_text && (
                  <div className="mb-3">
                    <div className="text-sm font-medium text-gray-700 mb-1">
                      Your Answer:
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        answer.is_correct
                          ? 'bg-green-50 border border-green-200'
                          : 'bg-red-50 border border-red-200'
                      }`}
                    >
                      <p
                        className={
                          answer.is_correct ? 'text-green-900' : 'text-red-900'
                        }
                      >
                        {answer.option_text}
                      </p>
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {answer.option_explanation && (
                  <div className="mt-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="text-sm font-medium text-blue-900 mb-1">
                      Explanation:
                    </div>
                    <p className="text-sm text-blue-800">
                      {answer.option_explanation}
                    </p>
                  </div>
                )}

                {answer.question_explanation && (
                  <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      Question Explanation:
                    </div>
                    <p className="text-sm text-gray-700">
                      {answer.question_explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <button
            onClick={() => navigate(-2)}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Quiz
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};
