import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { curriculumService } from '../../services/curriculum.service';
import type {
  CurriculumCreateInput,
  CurriculumUpdateInput,
  DifficultyLevel,
  Topic,
  TopicCreateInput,
} from '../../types';

export const CurriculumEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  // Curriculum form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [domain, setDomain] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState<DifficultyLevel>('beginner' as DifficultyLevel);
  const [estimatedDuration, setEstimatedDuration] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Topics state
  const [topics, setTopics] = useState<Topic[]>([]);
  const [showTopicForm, setShowTopicForm] = useState(false);

  // Topic form state
  const [topicTitle, setTopicTitle] = useState('');
  const [topicDescription, setTopicDescription] = useState('');
  const [topicContent, setTopicContent] = useState('');
  const [topicDuration, setTopicDuration] = useState('');
  const [topicRequired, setTopicRequired] = useState(true);
  const [topicObjectives, setTopicObjectives] = useState<string[]>([]);
  const [objectiveInput, setObjectiveInput] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isEditMode) {
      loadCurriculum();
    }
  }, [id]);

  const loadCurriculum = async () => {
    if (!id) return;

    try {
      setLoading(true);
      const response = await curriculumService.getCurriculumById(id);
      const { curriculum, topics: loadedTopics } = response;

      setTitle(curriculum.title);
      setDescription(curriculum.description || '');
      setDomain(curriculum.domain);
      setDifficultyLevel(curriculum.difficulty_level);
      setEstimatedDuration(curriculum.estimated_duration_hours?.toString() || '');
      setTags(curriculum.tags || []);
      setTopics(loadedTopics);
    } catch (err: any) {
      setError(err.message || 'Failed to load curriculum');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveCurriculum = async () => {
    try {
      setSaving(true);
      setError(null);

      const data: CurriculumCreateInput | CurriculumUpdateInput = {
        title,
        description: description || undefined,
        domain,
        difficulty_level: difficultyLevel,
        estimated_duration_hours: estimatedDuration ? parseInt(estimatedDuration) : undefined,
        tags: tags.length > 0 ? tags : undefined,
      };

      if (isEditMode && id) {
        await curriculumService.updateCurriculum(id, data);
        setSuccessMessage('Curriculum updated successfully');
      } else {
        const response = await curriculumService.createCurriculum(data as CurriculumCreateInput);
        setSuccessMessage('Curriculum created successfully');
        navigate(`/instructor/curricula/edit/${response.curriculum.id}`);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save curriculum');
    } finally {
      setSaving(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleAddObjective = () => {
    if (objectiveInput && !topicObjectives.includes(objectiveInput)) {
      setTopicObjectives([...topicObjectives, objectiveInput]);
      setObjectiveInput('');
    }
  };

  const handleRemoveObjective = (objective: string) => {
    setTopicObjectives(topicObjectives.filter((o) => o !== objective));
  };

  const handleSaveTopic = async () => {
    if (!id || !topicTitle) {
      setError('Topic title is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const topicData: TopicCreateInput = {
        title: topicTitle,
        description: topicDescription || undefined,
        content: topicContent || undefined,
        estimated_duration_minutes: topicDuration ? parseInt(topicDuration) : undefined,
        is_required: topicRequired,
        order_index: topics.length,
      };

      const response = await curriculumService.addTopic(id, topicData);
      const newTopic = response.topic;

      // Add learning objectives
      if (topicObjectives.length > 0) {
        for (let i = 0; i < topicObjectives.length; i++) {
          await curriculumService.addLearningObjective(id, newTopic.id, {
            objective_text: topicObjectives[i],
            order_index: i,
          });
        }
      }

      // Reload curriculum to get updated topics
      await loadCurriculum();

      // Reset form
      resetTopicForm();
      setSuccessMessage('Topic added successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to save topic');
    } finally {
      setSaving(false);
    }
  };

  const resetTopicForm = () => {
    setShowTopicForm(false);
    setTopicTitle('');
    setTopicDescription('');
    setTopicContent('');
    setTopicDuration('');
    setTopicRequired(true);
    setTopicObjectives([]);
  };

  const handleDeleteTopic = async (topicId: string) => {
    if (!id || !window.confirm('Are you sure you want to delete this topic?')) return;

    try {
      setSaving(true);
      await curriculumService.deleteTopic(id, topicId);
      await loadCurriculum();
      setSuccessMessage('Topic deleted successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to delete topic');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!id) return;

    try {
      setSaving(true);
      await curriculumService.publishCurriculum(id);
      await loadCurriculum();
      setSuccessMessage('Curriculum published successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to publish curriculum');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Edit Curriculum' : 'Create New Curriculum'}
            </h1>
            <p className="text-gray-600 mt-1">
              {isEditMode ? 'Update your curriculum details' : 'Build a new learning path'}
            </p>
          </div>
          <button
            onClick={() => navigate('/instructor/curricula')}
            className="text-gray-600 hover:text-gray-900"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
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

        {/* Curriculum Form */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Curriculum Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Introduction to Web Development"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Describe what learners will achieve..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain <span className="text-red-500">*</span>
                </label>
                <select
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select domain</option>
                  <option value="programming">Programming</option>
                  <option value="cloud">Cloud Computing</option>
                  <option value="data-science">Data Science</option>
                  <option value="finance">Finance</option>
                  <option value="business">Business</option>
                  <option value="design">Design</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value as DifficultyLevel)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Duration (hours)
              </label>
              <input
                type="number"
                value={estimatedDuration}
                onChange={(e) => setEstimatedDuration(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., 40"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Add a tag..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm flex items-center gap-2"
                  >
                    {tag}
                    <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleSaveCurriculum}
              disabled={saving || !title || !domain}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Saving...' : isEditMode ? 'Update Curriculum' : 'Create Curriculum'}
            </button>
            {isEditMode && (
              <button
                onClick={handlePublish}
                disabled={saving}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Publish
              </button>
            )}
          </div>
        </div>

        {/* Topics Section (only in edit mode) */}
        {isEditMode && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Topics</h2>
              <button
                onClick={() => setShowTopicForm(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Topic
              </button>
            </div>

            {/* Topic Form */}
            {showTopicForm && (
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">New Topic</h3>
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
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

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Learning Objectives
                    </label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        value={objectiveInput}
                        onChange={(e) => setObjectiveInput(e.target.value)}
                        onKeyPress={(e) =>
                          e.key === 'Enter' && (e.preventDefault(), handleAddObjective())
                        }
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Add learning objective..."
                      />
                      <button
                        onClick={handleAddObjective}
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                      >
                        Add
                      </button>
                    </div>
                    <ul className="space-y-2">
                      {topicObjectives.map((objective, index) => (
                        <li
                          key={index}
                          className="flex items-start gap-2 text-sm bg-white p-2 rounded border border-gray-200"
                        >
                          <span className="flex-1">{objective}</span>
                          <button
                            onClick={() => handleRemoveObjective(objective)}
                            className="text-red-600 hover:text-red-800"
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-4 flex gap-3">
                  <button
                    onClick={handleSaveTopic}
                    disabled={saving || !topicTitle}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save Topic'}
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
            <div className="space-y-3">
              {topics.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No topics yet. Add your first topic to get started.
                </p>
              ) : (
                topics.map((topic, index) => (
                  <div key={topic.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                          <h3 className="text-lg font-semibold text-gray-900">{topic.title}</h3>
                          {topic.is_required && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                              Required
                            </span>
                          )}
                        </div>
                        {topic.description && (
                          <p className="text-gray-600 text-sm mb-2">{topic.description}</p>
                        )}
                        {topic.estimated_duration_minutes && (
                          <p className="text-gray-500 text-sm">
                            {topic.estimated_duration_minutes} minutes
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="text-red-600 hover:text-red-800"
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
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
