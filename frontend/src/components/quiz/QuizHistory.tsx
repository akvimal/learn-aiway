import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';

interface QuizAttemptHistory {
  id: string;
  quiz_id: string;
  quiz_title: string;
  quiz_description: string | null;
  passing_score: number;
  topic_title: string;
  topic_id: string;
  curriculum_title: string;
  curriculum_id: string;
  attempt_number: number;
  started_at: string;
  submitted_at: string | null;
  time_taken_seconds: number | null;
  score: number | null;
  points_earned: number | null;
  total_points: number | null;
  passed: boolean | null;
  is_completed: boolean;
  created_at: string;
}

export const QuizHistory: React.FC = () => {
  const navigate = useNavigate();
  const [history, setHistory] = useState<QuizAttemptHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'passed' | 'failed'>('all');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const data = await quizService.getMyQuizHistory();
      setHistory(data.history);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz history');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'N/A';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredHistory = history.filter((attempt) => {
    if (filter === 'all') return true;
    if (filter === 'passed') return attempt.passed === true;
    if (filter === 'failed') return attempt.passed === false;
    return true;
  });

  // Calculate statistics
  const totalAttempts = history.filter(a => a.is_completed).length;
  const passedAttempts = history.filter(a => a.passed === true).length;
  const averageScore =
    totalAttempts > 0
      ? history
          .filter(a => a.is_completed && a.score !== null)
          .reduce((sum, a) => sum + (a.score || 0), 0) / totalAttempts
      : 0;

  // Group by quiz for best scores
  const quizBestScores = history.reduce((acc, attempt) => {
    if (!attempt.is_completed || attempt.score === null) return acc;

    if (!acc[attempt.quiz_id] || (acc[attempt.quiz_id].score || 0) < attempt.score) {
      acc[attempt.quiz_id] = attempt;
    }
    return acc;
  }, {} as Record<string, QuizAttemptHistory>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading quiz history...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Quiz History & Performance</h1>
          <p className="text-gray-600">Track your progress and review past quiz attempts</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-blue-600 mb-2">{totalAttempts}</div>
            <div className="text-sm text-gray-600">Total Completed</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600 mb-2">{passedAttempts}</div>
            <div className="text-sm text-gray-600">Passed</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {averageScore.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Average Score</div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {Object.keys(quizBestScores).length}
            </div>
            <div className="text-sm text-gray-600">Unique Quizzes</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg shadow mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'all'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                All Attempts ({history.length})
              </button>
              <button
                onClick={() => setFilter('passed')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'passed'
                    ? 'border-green-600 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Passed ({passedAttempts})
              </button>
              <button
                onClick={() => setFilter('failed')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                  filter === 'failed'
                    ? 'border-red-600 text-red-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Failed ({totalAttempts - passedAttempts})
              </button>
            </nav>
          </div>
        </div>

        {/* History List */}
        {filteredHistory.length === 0 ? (
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
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No quiz attempts yet</h3>
            <p className="text-gray-600 mb-6">
              Start learning and take quizzes to see your performance here
            </p>
            <button
              onClick={() => navigate('/curricula')}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Browse Curricula
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredHistory.map((attempt) => (
              <div
                key={attempt.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {attempt.quiz_title}
                        </h3>
                        {attempt.passed === true && (
                          <span className="px-3 py-1 bg-green-100 text-green-700 text-sm font-medium rounded-full">
                            Passed
                          </span>
                        )}
                        {attempt.passed === false && (
                          <span className="px-3 py-1 bg-red-100 text-red-700 text-sm font-medium rounded-full">
                            Failed
                          </span>
                        )}
                        {!attempt.is_completed && (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full">
                            In Progress
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          <span className="font-medium">Curriculum:</span> {attempt.curriculum_title} → {attempt.topic_title}
                        </p>
                        <p>
                          <span className="font-medium">Attempt:</span> #{attempt.attempt_number} • {formatDate(attempt.started_at)}
                        </p>
                      </div>
                    </div>

                    {attempt.is_completed && attempt.score !== null && (
                      <div className="ml-6 text-right">
                        <div className={`text-4xl font-bold ${
                          (attempt.passed ? 'text-green-600' : 'text-red-600')
                        }`}>
                          {attempt.score.toFixed(1)}%
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {attempt.points_earned?.toFixed(0)}/{attempt.total_points?.toFixed(0)} points
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Stats Row */}
                  <div className="flex flex-wrap gap-6 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Time: {formatDuration(attempt.time_taken_seconds)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Required: {attempt.passing_score}%</span>
                    </div>
                  </div>

                  {/* Actions */}
                  {attempt.is_completed && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => navigate(`/quizzes/attempts/${attempt.id}/results`)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => navigate(`/quizzes/${attempt.quiz_id}`)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                      >
                        Retake Quiz
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
