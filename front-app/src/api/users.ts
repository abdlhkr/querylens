import api from './client';
import type { ApiResponse, UserProfile, CreateUserRequest } from '../types';

export const usersApi = {
  getMe: () =>
    api.get<ApiResponse<UserProfile>>('/api/users/me'),

  createUser: (data: CreateUserRequest) =>
    api.post<ApiResponse<UserProfile>>('/api/users', data),

  updateUser: (data: CreateUserRequest) =>
    api.put<ApiResponse<UserProfile>>('/api/users', data),

  deleteUser: () =>
    api.delete<ApiResponse<null>>('/api/users'),
};
