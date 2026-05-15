import api from './client';
import type { AccountStatus, AuthResponse } from '../types';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: number;
}

export const authApi = {
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),

  verifyLogin: (data: VerifyCodeRequest) =>
    api.post<AuthResponse>('/auth/login/verify', data),

  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),

  verifyRegister: (data: VerifyCodeRequest) =>
    api.post<AuthResponse>('/auth/register/verify', data),

  forgotPassword: (email: string) =>
    api.post<AuthResponse>('/auth/forgot-password', { email }),

  resetPassword: (email: string, code: number, newPassword: string) =>
    api.post<AuthResponse>('/auth/forgot-password/reset', { email, code, newPassword }),

  logout: () =>
    api.post<AuthResponse>('/auth/logout'),

  refresh: () =>
    api.post<AuthResponse>('/auth/refresh'),

  /** Google OAuth yönlendirmesi — direkt href kullan */
  getGoogleAuthUrl: () => `${import.meta.env.VITE_API_URL ?? 'http://localhost:8080'}/oauth2/authorization/google`,

  // ─── Account Management ──────────────────────────────────────────────────
  getAccountStatus: () =>
    api.get<AccountStatus>('/auth/account/status'),

  sendSetPasswordCode: () =>
    api.post<AuthResponse>('/auth/account/send-set-password-code'),

  setPassword: (data: { code: string; newPassword: string; confirmPassword: string }) =>
    api.post<AuthResponse>('/auth/account/set-password', data),

  sendChangeEmailCode: () =>
    api.post<AuthResponse>('/auth/account/send-change-email-code'),

  changeEmail: (data: { code: string; newEmail: string }) =>
    api.post<AuthResponse>('/auth/account/change-email', data),

  sendDeleteAccountCode: () =>
    api.post<AuthResponse>('/auth/account/send-delete-account-code'),

  deleteAccount: (code: number) =>
    api.delete<AuthResponse>('/auth/account', { data: { code } }),
};
