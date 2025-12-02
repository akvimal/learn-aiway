import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';
import type { QuizWithQuestions, QuizQuestion } from '../../types';

export const QuizReview: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<any | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadQuizData();
  }, [quizId]);

  const loadQuizData = async () => {
    if (!quizId) return;

    try {
      setLoading(true);
      setError(null);

      // Load quiz with questions
      const response = await quizService.getQuizById(quizId);

      // QuizWithQuestions has structure: { quiz: Quiz, questions: QuizQuestion[] }
      setQuiz(response.quiz);
      setQuestions(response.questions || []);

      // Expand all questions by default
      setExpandedQuestions(new Set((response.questions || []).map((q) => q.id)));
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const toggleAllQuestions = () => {
    if (expandedQuestions.size === questions.length) {
      setExpandedQuestions(new Set());
    } else {
      setExpandedQuestions(new Set(questions.map((q) => q.id)));
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'true_false':
        return 'True/False';
      case 'short_answer':
        return 'Short Answer';
      default:
        return type;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !quiz) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Quiz not found'}</p>
        </div>
      </div>
    );
  }

  const multipleChoiceCount = questions.filter((q) => q.question_type === 'multiple_choice').length;
  const trueFalseCount = questions.filter((q) => q.question_type === 'true_false').length;
  const shortAnswerCount = questions.filter((q) => q.question_type === 'short_answer').length;
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 font-medium"
          >
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Quiz Manager
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{quiz.title}</h1>
              {quiz.description && (
                <p className="text-gray-600 mt-2">{quiz.description}</p>
              )}
            </div>
            <button
              onClick={() => navigate(`/topics/${quiz.topic_id}/quizzes`)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Edit Quiz
            </button>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quiz Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-blue-600">{questions.length}</div>
              <div className="text-sm text-blue-800">Total Questions</div>
            </div>
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">{multipleChoiceCount}</div>
              <div className="text-sm text-green-800">Multiple Choice</div>
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-yellow-600">{trueFalseCount}</div>
              <div className="text-sm text-yellow-800">True/False</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-purple-600">{shortAnswerCount}</div>
              <div className="text-sm text-purple-800">Short Answer</div>
            </div>
            <div className="bg-indigo-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-indigo-600">{totalPoints}</div>
              <div className="text-sm text-indigo-800">Total Points</div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Passing Score: {quiz.passing_score}%
            </span>
            {quiz.time_limit_minutes && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Time Limit: {quiz.time_limit_minutes} minutes
              </span>
            )}
            <span className={`flex items-center gap-1 ${quiz.is_published ? 'text-green-600' : 'text-gray-600'}`}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d={quiz.is_published ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} clipRule="evenodd" />
              </svg>
              {quiz.is_published ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">All Questions</h2>
          <button
            onClick={toggleAllQuestions}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
          >
            {expandedQuestions.size === questions.length ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Questions List */}
        {questions.length === 0 ? (
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
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No questions yet</h3>
            <p className="text-gray-600">Add questions to this quiz to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {questions.map((question, index) => {
              const isExpanded = expandedQuestions.has(question.id);
              return (
                <div key={question.id} className="bg-white rounded-lg shadow">
                  {/* Question Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50"
                    onClick={() => toggleQuestion(question.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded">
                            Q{index + 1}
                          </span>
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {getQuestionTypeLabel(question.question_type)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded ${getDifficultyColor(question.difficulty)}`}>
                            {question.difficulty}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                            {question.points} pts
                          </span>
                          {question.generated_by_ai && (
                            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">
                              AI Generated
                            </span>
                          )}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">{question.question_text}</h3>
                      </div>
                      <svg
                        className={`w-5 h-5 text-gray-400 transition-transform ${
                          isExpanded ? 'transform rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                  {/* Question Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-gray-200 pt-4">
                      {/* Multiple Choice Options */}
                      {question.question_type === 'multiple_choice' && question.options && (
                        <div className="space-y-2 mb-4">
                          <h4 className="font-medium text-gray-700 text-sm mb-2">Answer Options:</h4>
                          {question.options.map((option, optIndex) => {
                            const isCorrect = option.is_correct;
                            return (
                              <div
                                key={option.id}
                                className={`p-3 rounded-lg border-2 ${
                                  isCorrect
                                    ? 'bg-green-50 border-green-500'
                                    : 'bg-gray-50 border-gray-200'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <span className={`px-2 py-1 text-xs font-medium rounded ${
                                    isCorrect ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'
                                  }`}>
                                    {String.fromCharCode(65 + optIndex)}
                                  </span>
                                  <span className="text-gray-900">{option.option_text}</span>
                                  {isCorrect && (
                                    <span className="ml-auto flex items-center gap-1 text-green-700 text-sm font-medium">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                      </svg>
                                      Correct Answer
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* True/False Answer */}
                      {question.question_type === 'true_false' && question.options && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 text-sm mb-2">Correct Answer:</h4>
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border-2 border-green-500 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <span className="font-semibold text-green-800">
                              {question.options.find(opt => opt.is_correct)?.option_text || 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Short Answer */}
                      {question.question_type === 'short_answer' && question.options && (
                        <div className="mb-4">
                          <h4 className="font-medium text-gray-700 text-sm mb-2">Expected Answer:</h4>
                          <div className="p-3 bg-green-50 border-2 border-green-500 rounded-lg">
                            <p className="text-gray-900">
                              {question.options.find(opt => opt.is_correct)?.option_text || 'N/A'}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Explanation */}
                      {question.explanation && (
                        <div>
                          <h4 className="font-medium text-gray-700 text-sm mb-2">Explanation:</h4>
                          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-gray-700 text-sm">{question.explanation}</p>
                          </div>
                        </div>
                      )}

                      {/* Edit Button */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/topics/${quiz.topic_id}/quizzes`);
                          }}
                          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                        >
                          Edit this question →
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
