// API Base URL
const BASE_URL = 'http://localhost:8080/api';

// ─── Generic fetch helper ────────────────────────────────────────────────────

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ─── Machine API ─────────────────────────────────────────────────────────────

export const machineApi = {
  getAll: () => request<any[]>('/machines'),
  getById: (id: number) => request<any>(`/machines/${id}`),
  create: (data: any) => request<any>('/machines', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: any) => request<any>(`/machines/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: string) =>
    request<any>(`/machines/${id}/status?status=${status}`, { method: 'PATCH' }),
  delete: (id: number) => request<void>(`/machines/${id}`, { method: 'DELETE' }),
};

// ─── Telemetry API ───────────────────────────────────────────────────────────

export const telemetryApi = {
  getLatestByMachine: (machineId: number, limit = 50) =>
    request<any[]>(`/telemetry/machine/${machineId}?limit=${limit}`),
  getLatestSnapshot: (machineId: number) =>
    request<any>(`/telemetry/machine/${machineId}/latest`),
  getRecentAll: (limit = 20) => request<any[]>(`/telemetry/recent?limit=${limit}`),
};

// ─── Alert API ───────────────────────────────────────────────────────────────

export const alertApi = {
  getActive: () => request<any[]>('/alerts/active'),
  getRecent: (limit = 50) => request<any[]>(`/alerts/recent?limit=${limit}`),
  getByMachine: (machineId: number) => request<any[]>(`/alerts/machine/${machineId}`),
  resolve: (alertId: number) => request<any>(`/alerts/${alertId}/resolve`, { method: 'PATCH' }),
  getCounts: () => request<Record<string, number>>('/alerts/counts'),
};

// ─── Dashboard KPI API ───────────────────────────────────────────────────────

export const dashboardApi = {
  getKpi: () => request<Record<string, any>>('/dashboard/kpi'),
};
