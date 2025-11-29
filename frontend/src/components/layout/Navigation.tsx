import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types';

export const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const navLinkClass = (path: string) =>
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-600 hover:text-white'
    }`;

  const mobileNavLinkClass = (path: string) =>
    `block px-3 py-2 rounded-md text-base font-medium transition-colors ${
      isActive(path)
        ? 'bg-blue-700 text-white'
        : 'text-blue-100 hover:bg-blue-600 hover:text-white'
    }`;

  return (
    <nav className="bg-blue-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center">
            <Link to="/curricula" className="flex items-center">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                />
              </svg>
              <span className="ml-2 text-white text-xl font-bold">AI Learning</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link to="/curricula" className={navLinkClass('/curricula')}>
                Browse Curricula
              </Link>

              {user?.role === UserRole.INSTRUCTOR || user?.role === UserRole.ADMIN ? (
                <>
                  <Link to="/instructor/curricula/new" className={navLinkClass('/instructor')}>
                    Create Curriculum
                  </Link>
                </>
              ) : null}

              {user?.role === UserRole.ADMIN && (
                <Link to="/admin" className={navLinkClass('/admin')}>
                  Admin
                </Link>
              )}

              <Link to="/dashboard" className={navLinkClass('/dashboard')}>
                Dashboard
              </Link>
            </div>
          </div>

          {/* User Menu (Desktop) */}
          <div className="hidden md:block">
            <div className="ml-4 flex items-center md:ml-6">
              <div className="flex items-center space-x-3">
                <span className="text-white text-sm">
                  {user?.first_name} {user?.last_name}
                </span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  {user?.role}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-blue-100 hover:text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              to="/curricula"
              className={mobileNavLinkClass('/curricula')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Browse Curricula
            </Link>

            {user?.role === UserRole.INSTRUCTOR || user?.role === UserRole.ADMIN ? (
              <Link
                to="/instructor/curricula/new"
                className={mobileNavLinkClass('/instructor')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Create Curriculum
              </Link>
            ) : null}

            {user?.role === UserRole.ADMIN && (
              <Link
                to="/admin"
                className={mobileNavLinkClass('/admin')}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Admin
              </Link>
            )}

            <Link
              to="/dashboard"
              className={mobileNavLinkClass('/dashboard')}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dashboard
            </Link>
          </div>

          {/* Mobile user menu */}
          <div className="pt-4 pb-3 border-t border-blue-700">
            <div className="flex items-center px-5">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {user?.first_name?.charAt(0)}
                    {user?.last_name?.charAt(0)}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-white">
                  {user?.first_name} {user?.last_name}
                </div>
                <div className="text-sm font-medium text-blue-200">{user?.email}</div>
              </div>
              <div className="ml-auto">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-600 text-white">
                  {user?.role}
                </span>
              </div>
            </div>
            <div className="mt-3 px-2 space-y-1">
              <button
                onClick={handleLogout}
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-blue-100 hover:text-white hover:bg-blue-700"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
