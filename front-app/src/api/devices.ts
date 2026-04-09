import api from './client';
import type {
  ApiResponse,
  DeviceRegistration,
  DatabaseConnection,
  CreateDatabaseRequest,
  QueryResult,
  NaturalLanguageQueryResult,
  NaturalLanguageRequest,
} from '../types';

export const devicesApi = {
  // ─── Device ───────────────────────────────────────────────────────────────
  registerDevice: () =>
    api.post<ApiResponse<DeviceRegistration>>('/api/devices/register', {}),

  checkDevice: () =>
    api.get<ApiResponse<boolean>>('/api/devices/check'),

  // ─── Databases ────────────────────────────────────────────────────────────
  getDatabases: () =>
    api.get<ApiResponse<DatabaseConnection[]>>('/api/devices/databases'),

  getDatabase: (id: string) =>
    api.get<ApiResponse<DatabaseConnection>>(`/api/devices/databases/${id}`),

  createDatabase: (data: CreateDatabaseRequest) =>
    api.post<ApiResponse<DatabaseConnection>>('/api/devices/databases', data),

  updateDatabase: (id: string, data: CreateDatabaseRequest) =>
    api.put<ApiResponse<DatabaseConnection>>(`/api/devices/databases/${id}`, data),

  deleteDatabase: (id: string) =>
    api.delete<ApiResponse<null>>(`/api/devices/databases/${id}`),

  // ─── Queries ──────────────────────────────────────────────────────────────
  executeQuery: (databaseId: string, sql: string) =>
    api.post<ApiResponse<QueryResult>>(
      `/api/devices/queries/execute?databaseId=${databaseId}`,
      sql,
      { headers: { 'Content-Type': 'text/plain' } }
    ),

  naturalLanguageQuery: (databaseId: string, data: NaturalLanguageRequest) =>
    api.post<ApiResponse<NaturalLanguageQueryResult>>(
      `/api/devices/queries/natural-language?databaseId=${databaseId}`,
      data
    ),

  testConnection: (databaseId: string) =>
    api.post<ApiResponse<QueryResult>>(`/api/devices/queries/test/${databaseId}`),
};
