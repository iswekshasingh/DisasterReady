export type UserRole = 'USER' | 'TRAINER' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string | null;
  role: UserRole;
  totalPoints?: number;
  level?: number;
  badges?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: User;
}

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

export interface DecodedAuthToken {
  userId: string;
  role: UserRole;
  iat: number;
  exp: number;
}
