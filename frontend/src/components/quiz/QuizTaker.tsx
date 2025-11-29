import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { quizService } from '../../services/quiz.service';
import type { QuizWithQuestions, QuizAttempt, QuizQuestion, QuizQuestionOption } from '../../types';

export const QuizTaker: React.FC = () => {
  const { quizId } = useParams<{ quizId: string }>();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState<QuizWithQuestions | null>(null);
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);

  useEffect(() => {
    if (quizId) {
      loadQuiz();
    }
  }, [quizId]);

  const loadQuiz = async () => {
    if (!quizId) return;

    try {
      setLoading(true);
      const data = await quizService.getQuizById(quizId);
      setQuiz(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quiz');
    } finally {
      setLoading(false);
    }
  };

  const handleStartQuiz = async () => {
    if (!quizId) return;

    try {
      const { attempt: newAttempt } = await quizService.startAttempt(quizId);
      setAttempt(newAttempt);
      setStartTime(new Date());
    } catch (err: any) {
      setError(err.message || 'Failed to start quiz');
    }
  };

  const handleAnswerSelect = (questionId: string, optionId: string) => {
    setAnswers(new Map(answers.set(questionId, optionId)));
  };

  const handleSubmitAnswer = async () => {
    if (!attempt || !quiz) return;

    const currentQuestion = quiz.questions[currentQuestionIndex];
    const selectedOptionId = answers.get(currentQuestion.id);

    if (!selectedOptionId) {
      alert('Please select an answer before proceeding');
      return;
    }

    try {
      await quizService.submitAnswer(attempt.id, {
        questionId: currentQuestion.id,
        selectedOptionId,
      });

      // Move to next question or complete quiz
      if (currentQuestionIndex < quiz.questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to submit answer');
    }
  };

  const handleCompleteQuiz = async () => {
    if (!attempt) return;

    if (!confirm('Are you sure you want to submit the quiz? This cannot be undone.')) {
      return;
    }

    try {
      setSubmitting(true);
      const { attempt: completedAttempt } = await quizService.completeAttempt(attempt.id);
      navigate(`/quizzes/attempts/${completedAttempt.id}/results`);
    } catch (err: any) {
      setError(err.message || 'Failed to complete quiz');
    } finally {
      setSubmitting(false);
    }
  };

  const getTimeElapsed = () => {
    if (!startTime) return '0:00';
    const seconds = Math.floor((Date.now() - startTime.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Loading quiz...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
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

  if (!quiz) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Quiz not found</div>
      </div>
    );
  }

  // Quiz intro screen
  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl w-full">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{quiz.quiz.title}</h1>
          {quiz.quiz.description && (
            <p className="text-gray-600 mb-6">{quiz.quiz.description}</p>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-blue-900 mb-3">Quiz Information</h2>
            <ul className="space-y-2 text-sm text-blue-800">
              <li>
                <strong>Questions:</strong> {quiz.questions.length}
              </li>
              <li>
                <strong>Passing Score:</strong> {quiz.quiz.passing_score}%
              </li>
              {quiz.quiz.time_limit_minutes && (
                <li>
                  <strong>Time Limit:</strong> {quiz.quiz.time_limit_minutes} minutes
                </li>
              )}
              {quiz.quiz.max_attempts && (
                <li>
                  <strong>Max Attempts:</strong> {quiz.quiz.max_attempts}
                </li>
              )}
              <li>
                <strong>Retakes Allowed:</strong> {quiz.quiz.allow_retakes ? 'Yes' : 'No'}
              </li>
            </ul>
          </div>

          <button
            onClick={handleStartQuiz}
            className="w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  // Quiz taking screen
  const currentQuestion = quiz.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;
  const answeredCount = answers.size;
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">{quiz.quiz.title}</h1>
            <div className="text-sm text-gray-500">
              Time Elapsed: <span className="font-mono">{getTimeElapsed()}</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>
                Question {currentQuestionIndex + 1} of {quiz.questions.length}
              </span>
              <span>
                Answered: {answeredCount} / {quiz.questions.length}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-sm font-medium rounded">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'point' : 'points'}
              </span>
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              {currentQuestion.question_text}
            </h2>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {currentQuestion.options?.map((option: QuizQuestionOption) => {
              const isSelected = answers.get(currentQuestion.id) === option.id;
              return (
                <label
                  key={option.id}
                  className={`block p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start">
                    <input
                      type="radio"
                      name={currentQuestion.id}
                      value={option.id}
                      checked={isSelected}
                      onChange={() => handleAnswerSelect(currentQuestion.id, option.id)}
                      className="mt-1 mr-3 h-4 w-4 text-blue-600"
                    />
                    <span className="flex-1 text-gray-900">{option.option_text}</span>
                  </div>
                </label>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8">
            <button
              onClick={() => setCurrentQuestionIndex(currentQuestionIndex - 1)}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            {isLastQuestion ? (
              <button
                onClick={handleCompleteQuiz}
                disabled={submitting || answeredCount < quiz.questions.length}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {submitting ? 'Submitting...' : 'Submit Quiz'}
              </button>
            ) : (
              <button
                onClick={handleSubmitAnswer}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next Question
              </button>
            )}
          </div>

          {answeredCount < quiz.questions.length && isLastQuestion && (
            <p className="text-sm text-yellow-600 mt-4 text-center">
              You must answer all questions before submitting the quiz.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
