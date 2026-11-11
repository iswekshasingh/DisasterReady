import { apiClient } from './client';
import {
  AuthResponse,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types/auth.types';

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  async login(payload: LoginPayload): Promise<{ token: string; user: User }> {
    const { data } = await apiClient.post<{
      success: boolean;
      message: string;
      token: string;
      user: User;
    }>('/auth/login', payload);

    return { token: data.token, user: data.user };
  },

  async getMe(): Promise<{ userId: string; role: string }> {
    const { data } = await apiClient.get<{
      success: boolean;
      user: { userId: string; role: string; iat: number; exp: number };
    }>('/auth/me');

    return { userId: data.user.userId, role: data.user.role };
  },

  async getHealth(): Promise<{ status: string; uptime: number; service: string }> {
    const { data } = await apiClient.get<{
      status: string;
      uptime: number;
      service: string;
      timestamp: string;
    }>('/health');
    return data;
  },
};

