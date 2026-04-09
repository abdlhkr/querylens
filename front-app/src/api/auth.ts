import api from './client';
import type { AuthResponse } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  logout: () =>
    api.post<AuthResponse>('/auth/logout'),

  refresh: () =>
    api.post<AuthResponse>('/auth/refresh'),

  /** Google OAuth yönlendirmesi — direkt href kullan */
  getGoogleAuthUrl: () => `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/oauth2/authorization/google`,
};
