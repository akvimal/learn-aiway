export enum UserRole {
  LEARNER = 'learner',
  INSTRUCTOR = 'instructor',
  ADMIN = 'admin',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_email_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role?: UserRole;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  role?: UserRole;
  search?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UsersListResponse {
  users: User[];
  pagination: PaginationMeta;
}

export interface UserStats {
  total: number;
  byRole: {
    learner: number;
    instructor: number;
    admin: number;
  };
  active: number;
  inactive: number;
  emailVerified: number;
  emailUnverified: number;
}

export interface UpdateRoleInput {
  role: UserRole;
}

export interface UpdateStatusInput {
  is_active: boolean;
}
