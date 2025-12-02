import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import { aiService } from '../../services/ai.service';
import type { Topic, Curriculum, AIProvider } from '../../types';

export const TopicManager: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Curriculum state
  const [curriculum, setCurriculum] = useState<Curriculum | null>(null);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicCounts, setTopicCounts] = useState<Record<string, { exercises: number; quizzes: number; objectives: number }>>({});

  // AI provider state
  const [providers, setProviders] = useState<AIProvider[]>([]);
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Topic form state
  const [showTopicForm, setShowTopicForm] = useState(false);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [topicDuration, setTopicDuration] = useState('');
  const [topicRequired, setTopicRequired] = useState(true);

  // Learning objectives state
  const [showObjectivesFor, setShowObjectivesFor] = useState<Set<string>>(new Set());
  const [objectiveInput, setObjectiveInput] = useState<Record<string, string>>({});

  // AI generation state
  const [generatingTopics, setGeneratingTopics] = useState(false);
  const [generatingObjectives, setGeneratingObjectives] = useState<string | null>(null);

  useEffect(() => {
    loadData();
    loadProviders();
  }, [id]);

  const loadData = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await curriculumService.getCurriculumById(id);
      setCurriculum(response.curriculum);
      setTopics(response.topics || []);

      // Load counts for each topic
      await loadTopicCounts(response.topics || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const loadTopicCounts = async (topicsList: Topic[]) => {
    const counts: Record<string, { exercises: number; quizzes: number; objectives: number }> = {};

    for (const topic of topicsList) {
      try {
        const summary = await curriculumService.getTopicSummary(topic.id);
        counts[topic.id] = {
          exercises: summary.exercise_count || 0,
          quizzes: summary.quiz_count || 0,
          objectives: summary.objective_count || 0,
        };
      } catch (err) {
        console.error(`Failed to load counts for topic ${topic.id}:`, err);
        counts[topic.id] = { exercises: 0, quizzes: 0, objectives: 0 };
      }
    }

    setTopicCounts(counts);
  };

  const loadProviders = async () => {
    try {
      const userProviders = await aiService.getUserProviders();
      setProviders(userProviders);

      // Auto-select if there's only one provider
      if (userProviders.length === 1) {
        setSelectedProviderId(userProviders[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load AI providers:', err);
    }
  };

  const handleGenerateTopics = async () => {
    if (!id || !curriculum) return;

    if (!selectedProviderId) {
      setError('Please select an AI provider first');
      return;
    }

    try {
      setGeneratingTopics(true);
      setError(null);

      const response = await aiService.generateTopics({
        curriculumId: id,
        curriculumTitle: curriculum.title,
        curriculumDescription: curriculum.description || '',
        difficultyLevel: curriculum.difficulty_level,
        domain: curriculum.domain,
        providerId: selectedProviderId,
        numTopics: 5,
      });

      // Create topics from AI response
      const generatedTopics = response.topics;
      for (let i = 0; i < generatedTopics.length; i++) {
        const topic = generatedTopics[i];
        await curriculumService.addTopic(id, {
          title: topic.title,
          description: topic.description,
          content: topic.suggestedContent || undefined,
          estimated_duration_minutes: topic.estimatedDurationMinutes || undefined,
          is_required: true,
          order_index: topics.length + i,
        });
      }

      await loadData();
      setSuccessMessage(`Generated ${generatedTopics.length} topics successfully!`);
    } catch (err: any) {
      setError(err.message || 'Failed to generate topics');
    } finally {
      setGeneratingTopics(false);
    }
  };

  const handleGenerateObjectives = async (topicId: string) => {
    if (!id) return;

    if (!selectedProviderId) {
      setError('Please select an AI provider first');
      return;
    }

    const topic = topics.find((t) => t.id === topicId);
    if (!topic) return;

    try {
      setGeneratingObjectives(topicId);
      setError(null);

      // Delete existing objectives for this topic before generating new ones
      const existingObjectives = topic.learning_objectives || [];
      for (const obj of existingObjectives) {
        await curriculumService.deleteLearningObjective(id, topicId, obj.id);
      }

      const response = await aiService.generateObjectives({
        topicId,
        topicTitle: topic.title,
        topicDescription: topic.description || '',
        topicContent: topic.content || '',
        difficultyLevel: curriculum?.difficulty_level || 'beginner',
        providerId: selectedProviderId,
        numObjectives: 5,
      });

      // Add new objectives
      const objectives = response.objectives;
      for (let i = 0; i < objectives.length; i++) {
        await curriculumService.addLearningObjective(id, topicId, {
          objective_text: objectives[i],
          order_index: i,
        });
      }

      await loadData();
      setSuccessMessage(`Generated ${objectives.length} learning objectives!`);
      setShowObjectivesFor((prev) => new Set(prev).add(topicId));
    } catch (err: any) {
      setError(err.message || 'Failed to generate objectives');
    } finally {
      setGeneratingObjectives(null);
    }
  };

  const handleAddTopic = async () => {
    if (!id || !topicTitle) {
      setError('Topic title is required');
      return;
    }

    try {
      setError(null);

      if (editingTopic) {
        // Update existing topic
        await curriculumService.updateTopic(id, editingTopic.id, {
          title: topicTitle,
          description: topicDescription || undefined,
          content: topicContent || undefined,
          estimated_duration_minutes: topicDuration ? parseInt(topicDuration) : undefined,
          is_required: topicRequired,
        });
        setSuccessMessage('Topic updated successfully');
      } else {
        // Create new topic
        await curriculumService.addTopic(id, {
          title: topicTitle,
          description: topicDescription || undefined,
          content: topicContent || undefined,
          estimated_duration_minutes: topicDuration ? parseInt(topicDuration) : undefined,
          is_required: topicRequired,
          order_index: topics.length,
        });
        setSuccessMessage('Topic added successfully');
      }

      await loadData();
      resetTopicForm();
    } catch (err: any) {
      setError(err.message || 'Failed to save topic');
    }
  };

  const handleEditTopic = (topic: Topic) => {
    setEditingTopic(topic);
    setTopicTitle(topic.title);
    setTopicDescription(topic.description || '');
    setTopicContent(topic.content || '');
    setTopicDuration(topic.estimated_duration_minutes?.toString() || '');
    setTopicRequired(topic.is_required);
    setShowTopicForm(true);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this topic?')) return;

    try {
      await curriculumService.deleteTopic(id, topicId);
      await loadData();
      setSuccessMessage('Topic deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete topic');
    }
  };

  const handleAddObjective = async (topicId: string) => {
    const input = objectiveInput[topicId];
    if (!id || !input) return;

    try {
      const topic = topics.find((t) => t.id === topicId);
      const currentObjectives = topic?.learning_objectives || [];

      await curriculumService.addLearningObjective(id, topicId, {
        objective_text: input,
        order_index: currentObjectives.length,
      });

      await loadData();
      setObjectiveInput((prev) => ({ ...prev, [topicId]: '' }));
      setSuccessMessage('Learning objective added');
    } catch (err: any) {
      setError(err.message || 'Failed to add objective');
    }
  };

  const handleDeleteObjective = async (topicId: string, objectiveId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this learning objective?')) {
      return;
    }

    try {
      await curriculumService.deleteLearningObjective(id, topicId, objectiveId);
      await loadData();
      setSuccessMessage('Learning objective deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete objective');
    }
  };

  const resetTopicForm = () => {
    setShowTopicForm(false);
    setEditingTopic(null);
    setTopicTitle('');
    setTopicDescription('');
    setTopicContent('');
    setTopicDuration('');
    setTopicRequired(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!curriculum) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Curriculum not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate('/instructor/curricula')}
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
            Back to My Curricula
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Topics</h1>
            <p className="text-gray-600 mt-1">
              {curriculum.title} - Define and organize your learning topics
            </p>
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

        {/* AI Generation Options */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>

          {/* AI Provider Selection */}
          {providers.length > 1 && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI Provider
              </label>
              <select
                value={selectedProviderId || ''}
                onChange={(e) => setSelectedProviderId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">Select a provider...</option>
                {providers.map((provider) => (
                  <option key={provider.id} value={provider.id}>
                    {provider.provider_name} ({provider.provider_type})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* No providers warning */}
          {providers.length === 0 && (
            <div className="mb-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                No AI providers configured. Please{' '}
                <a
                  href="/ai/providers"
                  className="underline font-medium hover:text-yellow-900"
                >
                  add an AI provider
                </a>{' '}
                to use AI generation features.
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleGenerateTopics}
              disabled={generatingTopics || topics.length > 0 || !selectedProviderId || providers.length === 0}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              {generatingTopics ? 'Generating Topics...' : 'Generate Topics with AI'}
            </button>
            <button
              onClick={() => setShowTopicForm(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
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
              Add Topic Manually
            </button>
          </div>
          {topics.length > 0 && (
            <p className="mt-3 text-sm text-gray-600">
              💡 You already have topics. AI generation is disabled to prevent duplicates.
            </p>
          )}
        </div>

        {/* Topic Form */}
        {showTopicForm && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingTopic ? 'Edit Topic' : 'New Topic'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Topic title..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={topicDescription}
                  onChange={(e) => setTopicDescription(e.target.value)}
                  rows={2}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Brief description..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
                <textarea
                  value={topicContent}
                  onChange={(e) => setTopicContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Main topic content..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={topicDuration}
                    onChange={(e) => setTopicDuration(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., 60"
                  />
                </div>

                <div className="flex items-center">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={topicRequired}
                      onChange={(e) => setTopicRequired(e.target.checked)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Required Topic</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-3">
              <button
                onClick={handleAddTopic}
                disabled={!topicTitle}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {editingTopic ? 'Update Topic' : 'Add Topic'}
              </button>
              <button
                onClick={resetTopicForm}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Topics List */}
        {topics.length > 0 && (
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Topics ({topics.length})</h2>
            <div className="flex gap-2">
              <button
                onClick={() => setShowObjectivesFor(new Set(topics.map((t) => t.id)))}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Show All Objectives
              </button>
              <button
                onClick={() => setShowObjectivesFor(new Set())}
                className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Hide All Objectives
              </button>
            </div>
          </div>
        )}
        <div className="space-y-4">
          {topics.length === 0 ? (
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
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No topics yet</h3>
              <p className="text-gray-600 mb-6">
                Generate topics with AI or add them manually to get started
              </p>
            </div>
          ) : (
            topics.map((topic, index) => (
              <div key={topic.id} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-1 bg-gray-200 text-gray-700 text-sm font-medium rounded">
                        #{index + 1}
                      </span>
                      <h3 className="text-xl font-semibold text-gray-900">{topic.title}</h3>
                      {topic.is_required && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          Required
                        </span>
                      )}
                    </div>
                    {/* Content Stats */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`flex items-center gap-1 text-xs font-medium ${topicCounts[topic.id]?.objectives > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {topicCounts[topic.id]?.objectives || 0} Objectives
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${topicCounts[topic.id]?.exercises > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                        </svg>
                        {topicCounts[topic.id]?.exercises || 0} Exercises
                      </span>
                      <span className={`flex items-center gap-1 text-xs font-medium ${topicCounts[topic.id]?.quizzes > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        {topicCounts[topic.id]?.quizzes || 0} Quizzes
                      </span>
                    </div>
                    {topic.description && (
                      <p className="text-gray-600 mb-2">{topic.description}</p>
                    )}
                    {topic.estimated_duration_minutes && (
                      <p className="text-gray-500 text-sm">
                        Duration: {topic.estimated_duration_minutes} minutes
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/topics/${topic.id}/exercises`)}
                      className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      Exercises
                    </button>
                    <button
                      onClick={() => navigate(`/topics/${topic.id}/quizzes`)}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      Quizzes
                    </button>
                    <button
                      onClick={() => navigate(`/topics/${topic.id}/review`)}
                      className="px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm flex items-center gap-1"
                      title="Quality review"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Review
                    </button>
                    <button
                      onClick={() => handleEditTopic(topic)}
                      className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteTopic(topic.id)}
                      className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Learning Objectives Section */}
                <div className="mt-4 border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">
                      Learning Objectives
                      {topic.learning_objectives && topic.learning_objectives.length > 0 && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {topic.learning_objectives.length}
                        </span>
                      )}
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGenerateObjectives(topic.id)}
                        disabled={generatingObjectives !== null}
                        className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700 disabled:opacity-50 flex items-center gap-1"
                      >
                        {generatingObjectives === topic.id ? (
                          <>
                            <svg
                              className="w-4 h-4 animate-spin"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            Generating...
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-4 h-4"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M13 10V3L4 14h7v7l9-11h-7z"
                              />
                            </svg>
                            Generate with AI
                          </>
                        )}
                      </button>
                      <button
                        onClick={() =>
                          setShowObjectivesFor((prev) => {
                            const newSet = new Set(prev);
                            if (newSet.has(topic.id)) {
                              newSet.delete(topic.id);
                            } else {
                              newSet.add(topic.id);
                            }
                            return newSet;
                          })
                        }
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm hover:bg-gray-300 flex items-center gap-1"
                      >
                        {showObjectivesFor.has(topic.id) ? (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                            </svg>
                            Hide
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                            Show
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {showObjectivesFor.has(topic.id) && (
                    <div className="space-y-2">
                      {topic.learning_objectives && topic.learning_objectives.length > 0 ? (
                        <ul className="space-y-2">
                          {topic.learning_objectives.map((obj) => (
                            <li
                              key={obj.id}
                              className="flex items-start gap-2 text-sm bg-gray-50 p-3 rounded hover:bg-gray-100"
                            >
                              <span className="text-blue-600">•</span>
                              <span className="flex-1">{obj.objective_text}</span>
                              <button
                                onClick={() => handleDeleteObjective(topic.id, obj.id)}
                                className="px-2 py-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded text-xs"
                                title="Delete objective"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500 text-sm">No objectives yet</p>
                      )}

                      <div className="flex gap-2 mt-3">
                        <input
                          type="text"
                          value={objectiveInput[topic.id] || ''}
                          onChange={(e) =>
                            setObjectiveInput((prev) => ({
                              ...prev,
                              [topic.id]: e.target.value,
                            }))
                          }
                          onKeyPress={(e) =>
                            e.key === 'Enter' && handleAddObjective(topic.id)
                          }
                          className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Add learning objective..."
                        />
                        <button
                          onClick={() => handleAddObjective(topic.id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
