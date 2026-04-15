export type UserRole = 'superadmin' | 'admin' | 'jury';

export interface User {
  id: string;
  name: string;
  username: string;
  role: UserRole;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface ApiResponse<T = unknown> {
  success?: boolean;
  error?: string;
  data?: T;
}
