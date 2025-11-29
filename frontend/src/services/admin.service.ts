import { httpClient } from '../utils/http-client';
import {
  ApiResponse,
  PaginationParams,
  UsersListResponse,
  User,
  UserStats,
  UpdateRoleInput,
  UpdateStatusInput,
} from '../types';

class AdminService {
  /**
   * Get all users with pagination and filtering
   */
  async getAllUsers(params?: PaginationParams): Promise<UsersListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.role) queryParams.append('role', params.role);
    if (params?.search) queryParams.append('search', params.search);

    const response = await httpClient.get<ApiResponse<UsersListResponse>>(
      `/admin/users?${queryParams.toString()}`
    );

    if (response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch users');
  }

  /**
   * Get user by ID
   */
  async getUserById(id: string): Promise<User> {
    const response = await httpClient.get<ApiResponse<User>>(`/admin/users/${id}`);

    if (response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch user');
  }

  /**
   * Update user role
   */
  async updateUserRole(id: string, role: UpdateRoleInput): Promise<User> {
    const response = await httpClient.patch<ApiResponse<{ user: User; message: string }>>(
      `/admin/users/${id}/role`,
      role
    );

    if (response.data?.user) {
      return response.data.user;
    }
    throw new Error('Failed to update user role');
  }

  /**
   * Update user status (activate/deactivate)
   */
  async updateUserStatus(id: string, status: UpdateStatusInput): Promise<User> {
    const response = await httpClient.patch<ApiResponse<{ user: User; message: string }>>(
      `/admin/users/${id}/status`,
      status
    );

    if (response.data?.user) {
      return response.data.user;
    }
    throw new Error('Failed to update user status');
  }

  /**
   * Get user statistics
   */
  async getUserStats(): Promise<UserStats> {
    const response = await httpClient.get<ApiResponse<UserStats>>('/admin/stats');

    if (response.data) {
      return response.data;
    }
    throw new Error('Failed to fetch user statistics');
  }
}

export const adminService = new AdminService();
