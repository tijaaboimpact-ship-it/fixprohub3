/**
 * FixPro Hub — API Service Layer
 * 
 * Centralized service for all backend communication.
 * Uses Axios for HTTP requests with JWT token injection.
 * API base URL is configurable via localStorage or environment variable.
 */

// ── Configuration ───────────────────────────────────────────────────────────
const DEFAULT_API_URL = 'http://localhost:5000/api';

/** Get the current API base URL (configurable at runtime) */
export function getApiBaseUrl(): string {
  return localStorage.getItem('fixpro_api_url') || DEFAULT_API_URL;
}

/** Set a custom API base URL */
export function setApiBaseUrl(url: string): void {
  localStorage.setItem('fixpro_api_url', url.replace(/\/+$/, '')); // strip trailing slash
}

/** Get stored JWT token */
function getToken(): string | null {
  return localStorage.getItem('fixpro_token');
}

/** Store JWT token after login */
export function setToken(token: string): void {
  localStorage.setItem('fixpro_token', token);
}

/** Clear stored token (logout) */
export function clearToken(): void {
  localStorage.removeItem('fixpro_token');
}

// ── Generic Fetch Wrapper ───────────────────────────────────────────────────

interface ApiOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

/**
 * Core API fetch function with automatic JWT injection
 */
async function apiFetch<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method: options.method || 'GET',
    headers,
  };

  if (options.body) {
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || data.message || `API Error: ${response.status}`);
  }

  return data;
}

// ── Auth ─────────────────────────────────────────────────────────────────────
export interface LoginResponse {
  success: boolean;
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

/**
 * POST /login — Technician login with email + password
 * Returns JWT token and user profile
 */
export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/login', {
    method: 'POST',
    body: { email, password },
  });
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

/**
 * POST /auth/signup — Register new technician
 */
export async function signup(name: string, email: string, password: string): Promise<LoginResponse> {
  const data = await apiFetch<LoginResponse>('/auth/signup', {
    method: 'POST',
    body: { name, email, password },
  });
  if (data.token) {
    setToken(data.token);
  }
  return data;
}

/** Logout — clear token from storage */
export function logout(): void {
  clearToken();
}

// ── Repair Requests ─────────────────────────────────────────────────────────
export interface RepairRequest {
  id: number;
  customerName: string;
  phoneNumber: string;
  deviceType: string;
  problemDescription: string;
  status: 'pending' | 'in_progress' | 'done';
  assignedTo: number | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * GET /requests — Fetch all repair requests
 * @param status Optional filter (pending | in_progress | done)
 */
export async function getRepairRequests(status?: string): Promise<RepairRequest[]> {
  const query = status ? `?status=${status}` : '';
  return apiFetch<RepairRequest[]>(`/requests${query}`);
}

/**
 * GET /requests/:id — Fetch a single repair request
 */
export async function getRepairRequest(id: number): Promise<RepairRequest> {
  return apiFetch<RepairRequest>(`/requests/${id}`);
}

/**
 * POST /requests — Create a new repair request
 */
export async function createRepairRequest(data: {
  customerName: string;
  phoneNumber?: string;
  deviceType: string;
  problemDescription: string;
}): Promise<RepairRequest> {
  return apiFetch<RepairRequest>('/requests', {
    method: 'POST',
    body: data,
  });
}

/**
 * PATCH /requests/:id — Update a repair request (status, fields, etc.)
 */
export async function updateRepairRequest(
  id: number,
  updates: Partial<Pick<RepairRequest, 'status' | 'assignedTo' | 'problemDescription' | 'customerName' | 'phoneNumber' | 'deviceType'>>
): Promise<RepairRequest> {
  return apiFetch<RepairRequest>(`/requests/${id}`, {
    method: 'PATCH',
    body: updates,
  });
}

/**
 * DELETE /requests/:id — Delete a repair request
 */
export async function deleteRepairRequest(id: number): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>(`/requests/${id}`, { method: 'DELETE' });
}

// ── Health Check ────────────────────────────────────────────────────────────
export interface HealthStatus {
  status: string;
  uptime: number;
  socketio: boolean;
  timestamp: string;
}

/**
 * GET /health — Check if the backend API is running
 */
export async function checkHealth(): Promise<HealthStatus> {
  return apiFetch<HealthStatus>('/health');
}
