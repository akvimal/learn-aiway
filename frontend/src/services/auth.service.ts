import { httpClient } from '../utils/http-client';
import { RegisterInput, LoginInput, AuthResponse, User, ApiResponse } from '../types';

class AuthService {
  async register(data: RegisterInput): Promise<AuthResponse> {
    const response = await httpClient.post<ApiResponse<AuthResponse>>('/auth/register', data);
    if (response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data;
    }
    throw new Error('Registration failed');
  }

  async login(data: LoginInput): Promise<AuthResponse> {
    const response = await httpClient.post<ApiResponse<AuthResponse>>('/auth/login', data);
    if (response.data) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data;
    }
    throw new Error('Login failed');
  }

  async logout(): Promise<void> {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async logoutAll(): Promise<void> {
    try {
      await httpClient.post('/auth/logout-all');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async getProfile(): Promise<User> {
    const response = await httpClient.get<ApiResponse<{ user: User }>>('/auth/profile');
    if (response.data?.user) {
      return response.data.user;
    }
    throw new Error('Failed to get profile');
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await httpClient.post('/auth/change-password', { oldPassword, newPassword });
    localStorage.removeItem('accessToken');
  }

  async refreshToken(): Promise<string> {
    const response = await httpClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh');
    if (response.data?.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return response.data.accessToken;
    }
    throw new Error('Token refresh failed');
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
}

export const authService = new AuthService();
