/**
 * @file client.ts
 * @description Centralized API client for communicating with the Express backend.
 * Handles connection detection, retries, and offline fallback.
 */

const API_BASE = `http://${window.location.hostname}:3001/api`;

export type ConnectionStatus = 'online' | 'offline' | 'syncing';

interface ApiError {
  error: string;
}

// ─── Token Management ─────────────────────────────────────────────
let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

// ─── Core Fetch Wrapper ───────────────────────────────────────────

async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retries = 2
): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (options.headers) {
    if (options.headers instanceof Headers) {
      options.headers.forEach((value, key) => {
        headers[key] = value;
      });
    } else if (Array.isArray(options.headers)) {
      options.headers.forEach(([key, value]) => {
        headers[key] = value;
      });
    } else {
      Object.assign(headers, options.headers as Record<string, string>);
    }
  }

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({
          error: `HTTP ${response.status}`,
        }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      if (attempt === retries) throw err;
      // Wait before retry (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, 500 * (attempt + 1)));
    }
  }

  throw new Error('Request failed after retries');
}

// ─── Health Check ─────────────────────────────────────────────────

export interface HealthResponse {
  status: 'connected' | 'offline';
  database: string;
  timestamp: string;
}

export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health', {}, 0);
}

// ─── Verification API ─────────────────────────────────────────────

import type { Verification } from '../types';

export interface FetchVerificationsParams {
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  sort?: 'newest' | 'oldest' | 'urgency';
}

export async function fetchVerifications(
  params?: FetchVerificationsParams
): Promise<Verification[]> {
  const query = new URLSearchParams();
  if (params?.status) query.set('status', params.status);
  if (params?.search) query.set('search', params.search);
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  if (params?.sort) query.set('sort', params.sort);

  const qs = query.toString();
  return apiFetch<Verification[]>(`/verifications${qs ? `?${qs}` : ''}`);
}

export async function fetchVerificationById(id: string): Promise<Verification> {
  return apiFetch<Verification>(`/verifications/${id}`);
}

export async function fetchVerificationByToken(token: string): Promise<Verification> {
  return apiFetch<Verification>(`/verifications/by-token/${token}`);
}

export async function submitVerificationByToken(
  token: string,
  updates: { selfieData: string | null; idImageData: string | null; idType: string }
): Promise<Verification> {
  return apiFetch<Verification>(`/verifications/by-token/${token}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

export async function createVerification(
  data: Verification
): Promise<Verification> {
  return apiFetch<Verification>('/verifications', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateVerificationApi(
  id: string,
  updates: Partial<Verification>
): Promise<Verification> {
  return apiFetch<Verification>(`/verifications/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });
}

// ─── Audit Events API ─────────────────────────────────────────────

import type { AuditEvent } from '../types';

export async function fetchAuditEvents(
  verificationId?: string
): Promise<AuditEvent[]> {
  const qs = verificationId ? `?verificationId=${verificationId}` : '';
  return apiFetch<AuditEvent[]>(`/audit-events${qs}`);
}

export async function createAuditEvent(data: AuditEvent): Promise<AuditEvent> {
  return apiFetch<AuditEvent>('/audit-events', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ─── Stats API ────────────────────────────────────────────────────

import type { DashboardStats } from '../types';

export async function fetchStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/stats');
}

// ─── Seed / Sync / Export ─────────────────────────────────────────

export interface SeedPayload {
  verifications: Verification[];
  auditEvents: AuditEvent[];
}

export async function seedData(payload: SeedPayload): Promise<{ success: boolean }> {
  return apiFetch('/seed', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function syncData(payload: SeedPayload): Promise<{ success: boolean }> {
  return apiFetch('/sync', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface ExportPayload {
  exportedAt: string;
  verifications: Verification[];
  auditEvents: AuditEvent[];
}

export async function exportData(): Promise<ExportPayload> {
  return apiFetch<ExportPayload>('/export');
}

export async function login(username: string, password: string): Promise<{ token: string; user: { username: string; role: string; name?: string; email?: string; phone?: string; avatarUrl?: string; propertyName?: string } }> {
  return apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  }, 0);
}

export async function updateProfile(profile: { name: string; email: string; phone: string; avatarUrl: string; propertyName: string }): Promise<any> {
  return apiFetch('/auth/profile', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
}

export async function fetchProfile(): Promise<{ username: string; role: string; name?: string; email?: string; phone?: string; avatarUrl?: string; propertyName?: string }> {
  return apiFetch('/auth/profile');
}

