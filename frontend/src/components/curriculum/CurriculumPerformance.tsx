import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';

interface CurriculumPerformanceProps {
  curriculumId: string;
}

export const CurriculumPerformance: React.FC<CurriculumPerformanceProps> = ({ curriculumId }) => {
  const navigate = useNavigate();
  const [performance, setPerformance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPerformance();
  }, [curriculumId]);

  const loadPerformance = async () => {
    try {
      setLoading(true);
      const data = await quizService.getCurriculumPerformance(curriculumId);
      setPerformance(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load performance data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500">Loading performance...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700 text-sm">{error}</p>
      </div>
    );
  }

  if (!performance || performance.overall.total_quizzes === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-3"
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
        <p className="text-gray-600">No quizzes available yet for this curriculum</p>
      </div>
    );
  }

  const { overall, topics } = performance;

  return (
    <div className="space-y-6">
      {/* Overall Performance Stats */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Overall Quiz Performance</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-blue-600">
              {overall.completed_quizzes}/{overall.total_quizzes}
            </div>
            <div className="text-sm text-gray-600 mt-1">Quizzes Completed</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-green-600">
              {overall.average_score.toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Score</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-purple-600">
              {overall.topics_completed}/{overall.topics_with_quizzes}
            </div>
            <div className="text-sm text-gray-600 mt-1">Topics Mastered</div>
          </div>

          <div className="bg-white rounded-lg p-4 shadow-sm">
            <div className="text-2xl font-bold text-orange-600">
              {overall.completion_percentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Completion</div>
          </div>
        </div>
      </div>

      {/* Topic Breakdown */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900">Performance by Topic</h3>
        </div>
        <div className="p-4 space-y-4">
          {topics.map((topic: any) => {
            const hasQuizzes = topic.total_quizzes > 0;
            const completionRate = hasQuizzes
              ? (topic.completed_quizzes / topic.total_quizzes) * 100
              : 0;
            const isMastered = hasQuizzes && topic.completed_quizzes === topic.total_quizzes;

            return (
              <div
                key={topic.topic_id}
                className={`border rounded-lg p-4 ${
                  isMastered ? 'border-green-300 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{topic.topic_title}</h4>
                      {isMastered && (
                        <span className="px-2 py-1 bg-green-600 text-white text-xs font-medium rounded">
                          ✓ Mastered
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-600">
                      {topic.total_quizzes === 0 ? (
                        <span className="text-gray-500 italic">No quizzes available</span>
                      ) : (
                        <span>
                          {topic.completed_quizzes} of {topic.total_quizzes} quizzes completed
                        </span>
                      )}
                    </div>
                  </div>

                  {hasQuizzes && topic.completed_quizzes > 0 && (
                    <div className="text-right ml-4">
                      <div className="text-2xl font-bold text-blue-600">
                        {topic.average_score.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>
                  )}
                </div>

                {hasQuizzes && (
                  <>
                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{completionRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all ${
                            isMastered ? 'bg-green-600' : 'bg-blue-600'
                          }`}
                          style={{ width: `${completionRate}%` }}
                        />
                      </div>
                    </div>

                    {/* Quiz List */}
                    {topic.quizzes.length > 0 && (
                      <div className="space-y-2 mt-3 pt-3 border-t border-gray-200">
                        <div className="text-sm font-medium text-gray-700 mb-2">Quizzes:</div>
                        {topic.quizzes.map((quiz: any) => (
                          <div
                            key={quiz.quiz_id}
                            className="flex items-center justify-between bg-gray-50 rounded p-3"
                          >
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {quiz.quiz_title}
                                </span>
                                {quiz.passed ? (
                                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">
                                    Passed
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded">
                                    Review
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-500 mt-1">
                                Best: {quiz.best_score.toFixed(1)}% • {quiz.total_attempts}{' '}
                                {quiz.total_attempts === 1 ? 'attempt' : 'attempts'}
                              </div>
                            </div>
                            <button
                              onClick={() => navigate(`/quizzes/${quiz.quiz_id}`)}
                              className="ml-4 px-3 py-1 text-sm text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                            >
                              {quiz.passed ? 'Retake' : 'Try Again'}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
