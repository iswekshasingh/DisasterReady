import { apiClient } from './client';
import { User, HealthStatus } from '@/types';

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  fullName?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthSuccessResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

export const authApi = {
  async register(payload: RegisterPayload) {
    const { data } = await apiClient.post<{ success: boolean; message: string; user: User }>(
      '/auth/register',
      payload
    );
    return data;
  },

  async login(payload: LoginPayload): Promise<AuthSuccessResponse> {
    const { data } = await apiClient.post<AuthSuccessResponse>('/auth/login', payload);
    return data;
  },

  async getMe(): Promise<{ userId: string; role: string }> {
    const { data } = await apiClient.get<{ success: boolean; user: { userId: string; role: string } }>(
      '/auth/me'
    );
    return data.user;
  },

  async checkHealth(): Promise<HealthStatus> {
    const { data } = await apiClient.get<HealthStatus>('/health');
    return data;
  },
};

