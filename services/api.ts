import { LicenseKey, LicenseStatus, SubscriptionPlan, CurrencyRate, Notification, SupportRequest, AppVersion, SystemSettings, AuditLog, Transaction, User } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getStorage = () => ({
  accessToken: localStorage.getItem('sp_access_token'),
  refreshToken: localStorage.getItem('sp_refresh_token')
});

const setTokens = (access: string, refresh?: string) => {
  localStorage.setItem('sp_access_token', access);
  if (refresh) localStorage.setItem('sp_refresh_token', refresh);
};

const clearTokens = () => {
  localStorage.removeItem('sp_access_token');
  localStorage.removeItem('sp_refresh_token');
};

const doRequest = async <T>(path: string, options: RequestInit = {}, retry = true): Promise<T> => {
  const { accessToken, refreshToken } = getStorage();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined)
  };
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401 && refreshToken && retry) {
    // try refresh
    const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    if (refreshRes.ok) {
      const data = await refreshRes.json();
      if (data.accessToken) {
        setTokens(data.accessToken);
        return doRequest<T>(path, options, false);
      }
    }
    clearTokens();
    throw new Error('Unauthorized');
  }
  if (!res.ok) {
    const message = await res.text();
    throw new Error(message || res.statusText);
  }
  return res.status === 204 ? (undefined as T) : await res.json();
};

export const api = {
  clearTokens,
  async login(email: string, password: string) {
    const data = await doRequest<{
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    setTokens(data.accessToken, data.refreshToken);
    return data.user;
  },
  async me() {
    return doRequest<User>('/auth/me');
  },
  async logout() {
    clearTokens();
  },

  // Licenses
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

  // Plans
  getPlans() {
    return doRequest<SubscriptionPlan[]>('/plans');
  },
  createPlan(payload: any) {
    return doRequest<SubscriptionPlan>('/plans', { method: 'POST', body: JSON.stringify(payload) });
  },
  updatePlan(id: string, payload: any) {
    return doRequest<SubscriptionPlan>(`/plans/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  deletePlan(id: string) {
    return doRequest<void>(`/plans/${id}`, { method: 'DELETE' });
  },

  // Currencies
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

  // Notifications
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

  // Tickets
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

  // Versions
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

  // Settings
  getSettings() {
    return doRequest<SystemSettings>('/settings');
  },
  updateSettings(payload: Record<string, any>) {
    return doRequest('/settings', { method: 'PUT', body: JSON.stringify(payload) });
  },
  getRemoteConfig() {
    return doRequest<Record<string, any>>('/settings/remote');
  },
  updateRemoteConfig(payload: Record<string, any>) {
    return doRequest('/settings/remote', { method: 'PUT', body: JSON.stringify(payload) });
  },

  // Audit
  getAuditLogs() {
    return doRequest<AuditLog[]>('/audit-logs');
  },
  clearAuditLogs() {
    return doRequest<void>('/audit-logs', { method: 'DELETE' });
  },

  // Analytics & Financials
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

  // Users (Team)
  getUsers() {
    return doRequest<User[]>('/users');
  },
  createUser(payload: any) {
    return doRequest<User>('/users', { method: 'POST', body: JSON.stringify(payload) });
  },
  deleteUser(id: string) {
    return doRequest<void>(`/users/${id}`, { method: 'DELETE' });
  },

  // System Reset
  resetSystem() {
    return doRequest<{ message: string }>('/settings/reset', { method: 'POST' });
  },

  // Backup
  getBackups() {
    return doRequest<{ filename: string; size: number; createdAt: string }[]>('/backup');
  },
  createBackup() {
    return doRequest<{ filename: string }>('/backup', { method: 'POST' });
  },
  restoreBackup(filename: string) {
    return doRequest<void>(`/backup/${filename}/restore`, { method: 'POST' });
  },
  deleteBackup(filename: string) {
    return doRequest<void>(`/backup/${filename}`, { method: 'DELETE' });
  },
  uploadBackup(file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const { accessToken } = {
      accessToken: localStorage.getItem('sp_access_token'),
      refreshToken: localStorage.getItem('sp_refresh_token')
    };
    const headers: Record<string, string> = {};
    if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
    
    return fetch(`${API_URL}/backup/upload`, {
      method: 'POST',
      headers,
      body: formData
    }).then(res => res.ok ? res.json() : Promise.reject(new Error(res.statusText)));
  }
};
