import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LoginForm } from './components/auth/LoginForm';
import { RegisterForm } from './components/auth/RegisterForm';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';
import { UserRole } from './types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">AI Learning Platform</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {user?.role}
              </span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
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
      </main>
    </div>
  );
};

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex-shrink-0">
              <h1 className="text-xl font-bold text-gray-900">
                AI Learning Platform - Admin
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                Welcome, {user?.first_name} {user?.last_name}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                {user?.role}
              </span>
              <button
                onClick={() => logout()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Admin Dashboard</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-red-900 mb-2">
                Admin Access
              </h3>
              <p className="text-sm text-red-700">
                This is the admin dashboard. Only users with the 'admin' role can access this
                page.
              </p>
            </div>
          </div>
        </div>
      </main>
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
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
