import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCallback } from 'react';
import { RootState, AppDispatch } from '../store';
import {
  register as registerAction,
  login as loginAction,
  logout as logoutAction,
  getProfile as getProfileAction,
  changePassword as changePasswordAction,
  clearError,
} from '../store/slices/auth.slice';
import { RegisterInput, LoginInput, UserRole } from '../types';

export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, isAuthenticated, isLoading, error } = useSelector((state: RootState) => state.auth);

  const register = useCallback(
    async (data: RegisterInput) => {
      const result = await dispatch(registerAction(data));
      if (registerAction.fulfilled.match(result)) {
        const user = result.payload;
        if (user.role === UserRole.ADMIN) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    },
    [dispatch, navigate]
  );

  const login = useCallback(
    async (data: LoginInput) => {
      const result = await dispatch(loginAction(data));
      if (loginAction.fulfilled.match(result)) {
        const user = result.payload;
        if (user.role === UserRole.ADMIN) {
          navigate('/admin');
        } else {
          navigate('/dashboard');
        }
      }
    },
    [dispatch, navigate]
  );

  const logout = useCallback(async () => {
    await dispatch(logoutAction());
    navigate('/login');
  }, [dispatch, navigate]);

  const getProfile = useCallback(async () => {
    await dispatch(getProfileAction());
  }, [dispatch]);

  const changePassword = useCallback(
    async (oldPassword: string, newPassword: string) => {
      const result = await dispatch(changePasswordAction({ oldPassword, newPassword }));
      if (changePasswordAction.fulfilled.match(result)) {
        navigate('/login');
      }
    },
    [dispatch, navigate]
  );

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    register,
    login,
    logout,
    getProfile,
    changePassword,
    clearError: clearAuthError,
  };
};
