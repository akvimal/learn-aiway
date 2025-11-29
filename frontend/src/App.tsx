import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { UserManagement } from './components/admin/UserManagement';
import { CurriculumBrowser } from './components/curriculum/CurriculumBrowser';
import { CurriculumDetail } from './components/curriculum/CurriculumDetail';
import { TopicNavigation } from './components/curriculum/TopicNavigation';
import { CurriculumEditor } from './components/curriculum/CurriculumEditor';
import { InstructorCurricula } from './components/curriculum/InstructorCurricula';
import { TopicManager } from './components/curriculum/TopicManager';
import { AIProviderManagement } from './components/ai/AIProviderManagement';
import { AIChat } from './components/ai/AIChat';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">Profile</h3>
              <p className="text-sm text-blue-700">
                <strong>Name:</strong> {user?.first_name} {user?.last_name}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Email:</strong> {user?.email}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Role:</strong> {user?.role}
              </p>
              <p className="text-sm text-blue-700">
                <strong>Status:</strong>{' '}
                {user?.is_active ? (
                  <span className="text-green-600">Active</span>
                ) : (
                  <span className="text-red-600">Inactive</span>
                )}
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Authentication
              </h3>
              <p className="text-sm text-green-700 mb-2">
                You are successfully authenticated with JWT tokens!
              </p>
              <p className="text-sm text-green-700">
                Your access token is automatically refreshed when needed.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                Role-Based Access
              </h3>
              <p className="text-sm text-purple-700">
                Your role is: <strong>{user?.role}</strong>
              </p>
              <p className="text-sm text-purple-700 mt-2">
                Different features will be available based on your role.
              </p>
            </div>
          </div>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-900 mb-2">
              Next Steps
            </h3>
            <ul className="list-disc list-inside text-sm text-yellow-700 space-y-1">
              <li>Curriculum Management System</li>
              <li>AI Model Integration Layer</li>
              <li>Learning Session Management</li>
              <li>AI-Powered Learning Interactions</li>
              <li>Evaluation and Assessment System</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const [activeView, setActiveView] = React.useState<'dashboard' | 'users'>('dashboard');

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex gap-6">
          {/* Sidebar Navigation */}
          <aside className="w-64 bg-white shadow rounded-lg p-4 h-fit">
            <nav className="space-y-2">
              <button
                onClick={() => setActiveView('dashboard')}
                className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'dashboard'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setActiveView('users')}
                className={`w-full text-left px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeView === 'users'
                    ? 'bg-blue-100 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                User Management
              </button>
            </nav>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            {activeView === 'dashboard' && (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-red-900 mb-2">
                    Admin Access
                  </h3>
                  <p className="text-sm text-red-700 mb-4">
                    This is the admin dashboard. Only users with the 'admin' role can access this
                    page.
                  </p>
                  <div className="mt-4">
                    <h4 className="font-semibold text-red-900 mb-2">Available Features:</h4>
                    <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                      <li>View and manage all users</li>
                      <li>Update user roles (learner, instructor, admin)</li>
                      <li>Activate or deactivate user accounts</li>
                      <li>View user statistics</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
            {activeView === 'users' && (
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">User Management</h2>
                <UserManagement />
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const { getProfile, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      getProfile();
    }
  }, [isAuthenticated, getProfile]);

  return (
    <Routes>
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Dashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <AppLayout>
              <AdminDashboard />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Curriculum Routes */}
      <Route
        path="/curricula"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CurriculumBrowser />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/curricula/:id"
        element={
          <ProtectedRoute>
            <AppLayout>
              <CurriculumDetail />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/curricula/:id/learn"
        element={
          <ProtectedRoute>
            <TopicNavigation />
          </ProtectedRoute>
        }
      />

      {/* Instructor Routes */}
      <Route
        path="/instructor/curricula"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <InstructorCurricula />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/curricula/new"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <CurriculumEditor />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/curricula/:id/edit"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <CurriculumEditor />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/instructor/curricula/:id/topics"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <TopicManager />
            </AppLayout>
          </ProtectedRoute>
        }
      />

      {/* AI Provider Routes - Designer (Instructor/Admin) Only */}
      <Route
        path="/ai/providers"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <AIProviderManagement />
            </AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/ai/chat"
        element={
          <ProtectedRoute requiredRoles={[UserRole.INSTRUCTOR, UserRole.ADMIN]}>
            <AppLayout>
              <div className="h-[calc(100vh-4rem)]">
                <AIChat />
              </div>
            </AppLayout>
          </ProtectedRoute>
        }
      />

      <Route path="/" element={<Navigate to="/curricula" replace />} />
    </Routes>
  );
};

export default App;
