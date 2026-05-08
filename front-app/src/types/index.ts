// ─── Generic API Envelope ──────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T | null;
}

export interface AuthResponse {
  message: string;
}

// ─── User ──────────────────────────────────────────────────────────────────
export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface UserProfile {
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  age: number;
  gender: Gender;
}

// ─── Devices ───────────────────────────────────────────────────────────────
export interface DeviceRegistration {
  registryId: string;
}

export type DbType = 'POSTGRESQL' | 'MYSQL' | 'MSSQL' | 'ORACLE';
export type ConnectionStatus = 'PENDING' | 'VERIFIED' | 'FAILED';

export interface CreateDatabaseRequest {
  host: string;
  port: number;
  databaseName: string;
  username: string;
  dbType: DbType;
  displayName?: string;
}

export interface DatabaseConnection {
  id: string;
  deviceId: string;
  host: string;
  port: number;
  databaseName: string;
  username: string;
  dbType: DbType;
  status: ConnectionStatus;
  displayName: string | null;
  lastError: string | null;
  createdAt: string;
  verifiedAt: string | null;
  lastUsedAt: string | null;
}

// ─── Queries ───────────────────────────────────────────────────────────────
export type QueryErrorCode = 'AGENT_DISCONNECTED' | 'TIMEOUT' | 'QUERY_ERROR' | 'UNKNOWN';

export interface QueryResult {
  requestId: string;
  databaseId: string;
  originalQuery: string;
  success: boolean;
  data: Record<string, unknown>[] | null;
  rowCount: number;
  executionTimeMs: number;
  error: string | null;
  errorCode: QueryErrorCode | null;
}

export interface NaturalLanguageQueryResult extends QueryResult {
  question: string;
  generatedSql: string;
  responseType?: 'sql' | 'unavailable' | 'general' | null;
  aiMessage?: string | null;
  suggestedQuestion?: string | null;
}

export interface NaturalLanguageRequest {
  question: string;
}

// ─── Chart Visualization ────────────────────────────────────────────────────
export type ChartType = 'bar' | 'line' | 'pie' | 'area';

export interface ChartRecommendRequest {
  question: string;
  columns: string[];
  sampleRows: Record<string, unknown>[];
}

export interface ChartRecommendResponse {
  chartType: ChartType;
  keyField: string;
  valueFields: string[];
  reason: string;
}
