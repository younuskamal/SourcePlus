import { LicenseKey, SubscriptionPlan, CurrencyRate, Notification, SupportRequest, AppVersion, SystemSettings, AuditLog, Transaction, User } from '../types';

const API_URL =
  import.meta.env.VITE_API_URL ||
  'https://sourceplus.onrender.com';

const getStorage = () => {
  const localAccess = localStorage.getItem('sp_access_token');
  if (localAccess) {
    return {
      accessToken: localAccess,
      refreshToken: localStorage.getItem('sp_refresh_token'),
      isLocal: true
    };
  }
  return {
    accessToken: sessionStorage.getItem('sp_access_token'),
    refreshToken: sessionStorage.getItem('sp_refresh_token'),
    isLocal: false
  };
};

const setTokens = (access: string, refresh?: string | null, remember: boolean = false) => {
  // Clear both first to ensure no duplicates
  localStorage.removeItem('sp_access_token');
  localStorage.removeItem('sp_refresh_token');
  sessionStorage.removeItem('sp_access_token');
  sessionStorage.removeItem('sp_refresh_token');

  const storage = remember ? localStorage : sessionStorage;
  storage.setItem('sp_access_token', access);
  if (refresh) storage.setItem('sp_refresh_token', refresh);
};

const clearTokens = () => {
  localStorage.removeItem('sp_access_token');
  localStorage.removeItem('sp_refresh_token');
  sessionStorage.removeItem('sp_access_token');
  sessionStorage.removeItem('sp_refresh_token');
};

const doRequest = async <T>(path: string, options: RequestInit = {}, retry = true): Promise<T> => {
  const { accessToken, refreshToken, isLocal } = getStorage();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> | undefined)
  };
  const hasBody = options.body !== undefined && options.body !== null;
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;
  if (hasBody && !isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401 && refreshToken && retry) {
    try {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });

      if (refreshRes.ok) {
        const data = await refreshRes.json();
        if (data.accessToken) {
          // Keep old refresh token if new one not provided
          const newRefresh = data.refreshToken || refreshToken;
          setTokens(data.accessToken, newRefresh, isLocal);
          return doRequest<T>(path, options, false);
        }
      }
    } catch (e) {
      console.error('Failed to refresh token', e);
    }
    // If we get here, refresh failed
    clearTokens();
    window.location.reload();
    throw new Error('Session expired');
  }

  if (!res.ok) {
    const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // ignore
    }

    if (json && json.message) {
      throw new Error(json.message);
    }
    throw new Error(text || res.statusText);
  }
  return res.status === 204 ? (undefined as T) : await res.json();
};

export const api = {
  clearTokens,
  async login(email: string, password: string, rememberMe: boolean = false) {
    const data = await doRequest<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    setTokens(data.accessToken, data.refreshToken, rememberMe);
    return data.user;
  },
  async me() {
    return doRequest<User>('/auth/me');
  },
  async logout() {
    clearTokens();
  },
  async ping() {
    return doRequest<{ healthy: boolean }>('/health', {}, false);
  },
  getLicenses() {
    return doRequest<(LicenseKey & { plan?: SubscriptionPlan })[]>('/licenses');
  },
  generateLicense(planId: string, customerName: string, quantity = 1) {
    return doRequest<LicenseKey[]>('/licenses/generate', {
      method: 'POST',
      body: JSON.stringify({ planId, customerName, quantity })
    });
  },
  updateLicense(id: string, payload: Partial<LicenseKey>) {
    return doRequest<LicenseKey>(`/licenses/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  renewLicense(id: string, months: number) {
    return doRequest<LicenseKey>(`/licenses/${id}/renew`, { method: 'POST', body: JSON.stringify({ months }) });
  },
  togglePause(id: string) {
    return doRequest<LicenseKey>(`/licenses/${id}/pause`, { method: 'POST' });
  },
  revoke(id: string) {
    return doRequest<LicenseKey>(`/licenses/${id}/revoke`, { method: 'POST' });
  },
  deleteLicense(id: string) {
    return doRequest<void>(`/licenses/${id}`, { method: 'DELETE' });
  },
  getPlans() {
    return doRequest<any[]>('/plans');
  },
  createPlan(payload: any) {
    return doRequest<any>('/plans', { method: 'POST', body: JSON.stringify(payload) });
  },
  updatePlan(id: string, payload: any) {
    return doRequest<any>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  },
  deletePlan(id: string) {
    return doRequest<void>(`/plans/${id}`, { method: 'DELETE' });
  },
  togglePlanStatus(id: string, action: 'activate' | 'deactivate') {
    return doRequest<any>(`/plans/${id}/${action}`, { method: 'PATCH' });
  },
  getCurrencies() {
    return doRequest<CurrencyRate[]>('/currencies');
  },
  createCurrency(payload: any) {
    return doRequest<CurrencyRate>('/currencies', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateCurrency(id: string, payload: any) {
    return doRequest<CurrencyRate>(`/currencies/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteCurrency(id: string) {
    return doRequest<void>(`/currencies/${id}`, { method: 'DELETE' });
  },
  syncCurrencies() {
    return doRequest<{ updated: number }>('/currencies/sync', { method: 'POST' });
  },
  getNotifications() {
    return doRequest<Notification[]>('/notifications');
  },
  sendNotification(payload: any) {
    return doRequest<Notification>('/notifications', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteNotification(id: string) {
    return doRequest<void>(`/notifications/${id}`, { method: 'DELETE' });
  },
  clearNotifications() {
    return doRequest<void>('/notifications', { method: 'DELETE' });
  },
  getTickets() {
    return doRequest<SupportRequest[]>('/tickets');
  },
  createTicket(payload: any) {
    return doRequest<SupportRequest>('/tickets', { method: 'POST', body: JSON.stringify(payload) });
  },
  replyTicket(id: string, message: string) {
    return doRequest(`/tickets/${id}/reply`, { method: 'POST', body: JSON.stringify({ message }) });
  },
  resolveTicket(id: string) {
    return doRequest(`/tickets/${id}/resolve`, { method: 'POST' });
  },
  deleteTicket(id: string) {
    return doRequest<void>(`/tickets/${id}`, { method: 'DELETE' });
  },
  getVersions() {
    return doRequest<AppVersion[]>('/versions');
  },
  createVersion(payload: any) {
    return doRequest<AppVersion>('/versions', { method: 'POST', body: JSON.stringify(payload) });
  },
  updateVersion(id: string, payload: any) {
    return doRequest<AppVersion>(`/versions/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deleteVersion(id: string) {
    return doRequest<void>(`/versions/${id}`, { method: 'DELETE' });
  },
  getLatestVersion() {
    return doRequest<AppVersion | {}>('/versions/latest');
  },
  getSettings() {
    return doRequest<SystemSettings>('/settings');
  },
  updateSettings(payload: Record<string, any>) {
    return doRequest('/settings', { method: 'PUT', body: JSON.stringify(payload) });
  },
  resetSystem() {
    return doRequest<{ message: string }>('/settings/reset', { method: 'POST' });
  },
  getRemoteConfig() {
    return doRequest<Record<string, any>>('/settings/remote');
  },
  updateRemoteConfig(payload: Record<string, any>) {
    return doRequest('/settings/remote', { method: 'PUT', body: JSON.stringify(payload) });
  },
  getAuditLogs() {
    return doRequest<AuditLog[]>('/audit-logs');
  },
  clearAuditLogs() {
    return doRequest<void>('/audit-logs', { method: 'DELETE' });
  },
  getStats() {
    return doRequest<any>('/analytics/stats');
  },
  getServerHealth() {
    return doRequest<any>('/analytics/server-health');
  },
  getTransactions() {
    return doRequest<Transaction[]>('/analytics/transactions');
  },
  getFinancialStats() {
    return doRequest('/analytics/financial-stats');
  },
  getRevenueHistory() {
    return doRequest<{ name: string; revenue: number }[]>('/analytics/revenue-history');
  },
  getUsers() {
    return doRequest<User[]>('/users');
  },
  createUser(payload: any) {
    return doRequest<User>('/users', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteUser(id: string) {
    return doRequest<void>(`/users/${id}`, { method: 'DELETE' });
  },
  getBackups() {
    return doRequest<{ filename: string; size: number; createdAt: string }[]>('/backup');
  },
  createBackup() {
    return doRequest<{ message: string; filename: string }>('/backup', { method: 'POST' });
  },
  restoreBackup(filename: string) {
    return doRequest<{ message: string }>(`/backup/restore/${filename}`, { method: 'POST' });
  },
  deleteBackup(filename: string) {
    return doRequest<{ message: string }>(`/backup/${filename}`, { method: 'DELETE' });
  },
  uploadBackup(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return doRequest<{ message: string; filename: string }>('/backup/upload', { method: 'POST', body: formData });
  },
  getTrafficLogs(params?: any) {
    const queryString = params ? '?' + new URLSearchParams(params).toString() : '';
    return doRequest<any>(`/traffic${queryString}`);
  },
  getTrafficLogDetails(id: string) {
    return doRequest<any>(`/traffic/${id}`);
  },
  clearTrafficLogs() {
    return doRequest<void>('/traffic/clear', { method: 'POST' });
  }
};
