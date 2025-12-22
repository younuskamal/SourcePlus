import { LicenseKey, SubscriptionPlan, CurrencyRate, Notification, SupportRequest, AppVersion, SystemSettings, AuditLog, Transaction, User, ProductType, Clinic, RegistrationStatus, ClinicSubscriptionStatus } from '../types';
const API_URL =
  import.meta.env.VITE_API_URL ||
  (window.location.hostname === 'localhost' ? 'http://localhost:3001' : 'https://sourceplus.onrender.com');

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
  if (accessToken) headers.Authorization = `Bearer ${accessToken} `;

  const res = await fetch(`${API_URL}${path} `, { ...options, headers });

  if (res.status === 401 && refreshToken && retry) {
    try {
      const refreshRes = await fetch(`${API_URL} /api/auth / refresh`, {
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
    }>('/api/auth/admin-login', { method: 'POST', body: JSON.stringify({ email, password }) }, false);
    setTokens(data.accessToken, data.refreshToken, rememberMe);
    return data.user;
  },
  async me() {
    return doRequest<User>('/api/auth/me');
  },
  async logout() {
    clearTokens();
  },
  async register(name: string, email: string, password: string, role: 'admin' | 'developer' | 'viewer' = 'viewer') {
    return doRequest<User>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password, role })
    });
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
    return doRequest<LicenseKey>(`/ licenses / ${id} `, { method: 'PATCH', body: JSON.stringify(payload) });
  },
  renewLicense(id: string, months: number) {
    return doRequest<LicenseKey>(`/ licenses / ${id}/renew`, { method: 'POST', body: JSON.stringify({ months }) });
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
    return doRequest<SubscriptionPlan[]>('/plans');
  },
  createPlan(payload: any) {
    return doRequest<SubscriptionPlan>('/plans', { method: 'POST', body: JSON.stringify(payload) });
  },
  updatePlan(id: string, payload: any) {
    return doRequest<SubscriptionPlan>(`/plans/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
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
  getNotifications(productType?: ProductType) {
    const q = productType ? `?productType=${productType}` : '';
    return doRequest<Notification[]>(`/notifications${q}`);
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
  getTickets(productType?: ProductType) {
    const q = productType ? `?productType=${productType}` : '';
    return doRequest<SupportRequest[]>(`/tickets${q}`);
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
  getAuditLogs(productType?: ProductType) {
    const q = productType ? `?productType=${productType}` : '';
    return doRequest<AuditLog[]>(`/audit-logs${q}`);
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
  },

  // -- Clinics --
  getClinics(status?: RegistrationStatus) {
    const q = status ? `?status=${status}` : '';
    return doRequest<Clinic[]>(`/api/clinics/requests${q}`);
  },
  getClinic(id: string) {
    return doRequest<Clinic>(`/api/clinics/${id}`);
  },
  approveClinic(id: string, payload?: { planId?: string; durationMonths?: number }) {
    return doRequest<Clinic>(`/api/clinics/${id}/approve`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined
    });
  },
  rejectClinic(id: string, reason?: string) {
    return doRequest<Clinic>(`/api/clinics/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    });
  },
  suspendClinic(id: string) {
    return doRequest<Clinic>(`/api/clinics/${id}/suspend`, { method: 'POST' });
  },
  reactivateClinic(id: string, payload?: { planId?: string; durationMonths?: number }) {
    return doRequest<Clinic>(`/api/clinics/${id}/reactivate`, {
      method: 'POST',
      body: payload ? JSON.stringify(payload) : undefined
    });
  },
  assignClinicLicense(id: string, payload: { planId: string; durationMonths?: number; activateClinic?: boolean }) {
    return doRequest<Clinic>(`/api/clinics/${id}/license`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  forceLogoutClinic(id: string) {
    return doRequest<{ success: boolean }>(`/api/clinics/${id}/force-logout`, { method: 'POST' });
  },
  deleteClinic(id: string) {
    return doRequest<{ success: boolean }>(`/api/clinics/${id}`, { method: 'DELETE' });
  },
  getSubscriptionStatus(clinicId?: string) {
    const q = clinicId ? `?clinicId=${clinicId}` : '';
    return doRequest<ClinicSubscriptionStatus>(`/api/subscription/status${q}`);
  },
  getClinicControls(id: string) {
    return doRequest<{
      storageLimitMB: number;
      usersLimit: number;
      patientsLimit: number | null;
      features: {
        patients: boolean;
        appointments: boolean;
        orthodontics: boolean;
        xray: boolean;
        ai: boolean;
      };
      locked: boolean;
      lockReason: string | null;
    }>(`/api/clinics/${id}/controls`);
  },
  updateClinicControls(id: string, payload: {
    storageLimitMB?: number;
    usersLimit?: number;
    patientsLimit?: number | null;
    features?: {
      patients?: boolean;
      appointments?: boolean;
      orthodontics?: boolean;
      xray?: boolean;
      ai?: boolean;
    };
    locked?: boolean;
    lockReason?: string | null;
  }) {
    return doRequest<{
      storageLimitMB: number;
      usersLimit: number;
      patientsLimit: number | null;
      features: any;
      locked: boolean;
      lockReason: string | null;
    }>(`/api/clinics/${id}/controls`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
  },
  getClinicUsage(id: string) {
    return doRequest<{
      activeUsersCount: number;
      storageUsedMB: number;
      storageLimitMB: number;
      usersLimit: number;
      storagePercentage: number;
      usersPercentage: number;
      filesCount: number;
      locked: boolean;
      lockReason: string | null;
      lastUpdated: string;
    }>(`/api/clinics/${id}/usage`);
  },


  // -- Support Messages (Conversations) --
  getSupportMessages(params?: { status?: string; clinicId?: string; search?: string; priority?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return doRequest<{
      messages: Array<{
        id: string;
        clinicId: string;
        clinicName: string;
        accountCode?: string;
        subject: string;
        message: string;
        source: string;
        status: 'NEW' | 'READ' | 'CLOSED';
        priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
        assignedTo?: string;
        assignedUser?: { id: string; name: string; email: string };
        readAt?: string;
        closedAt?: string;
        createdAt: string;
        updatedAt: string;
        replies?: Array<{
          id: string;
          messageId: string;
          senderId?: string;
          senderName: string;
          content: string;
          isFromAdmin: boolean;
          createdAt: string;
        }>;
        _count?: { replies: number };
      }>;
      unreadCount: number;
    }>(`/api/support/messages${query ? `?${query}` : ''}`);
  },


  getSupportMessage(id: string) {
    return doRequest<{
      id: string;
      clinicId: string;
      clinicName: string;
      accountCode?: string;
      subject: string;
      message: string;
      source: string;
      status: 'NEW' | 'READ' | 'CLOSED';
      priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
      assignedTo?: string;
      assignedUser?: { id: string; name: string; email: string };
      readAt?: string;
      closedAt?: string;
      createdAt: string;
      updatedAt: string;
      replies: Array<{
        id: string;
        messageId: string;
        senderId?: string;
        senderName: string;
        content: string;
        isFromAdmin: boolean;
        createdAt: string;
      }>;
      _count?: { replies: number };
    }>(`/api/support/messages/${id}`);
  },

  addSupportReply(messageId: string, content: string) {
    return doRequest(`/api/support/messages/${messageId}/replies`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  },

  updateSupportMessageStatus(id: string, status: 'NEW' | 'READ' | 'CLOSED') {
    return doRequest(`/api/support/messages/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    });
  },

  assignSupportMessage(id: string, assignedTo: string | null) {
    return doRequest(`/api/support/messages/${id}/assign`, {
      method: 'PATCH',
      body: JSON.stringify({ assignedTo })
    });
  },

  updateSupportPriority(id: string, priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT') {
    return doRequest(`/api/support/messages/${id}/priority`, {
      method: 'PATCH',
      body: JSON.stringify({ priority })
    });
  },

  deleteSupportMessage(id: string) {
    return doRequest(`/api/support/messages/${id}`, {
      method: 'DELETE'
    });
  },

  // -- Messages --
  getConversations() {
    return doRequest<any[]>('/api/messages/conversations');
  },
  getConversation(id: string) {
    return doRequest<any>(`/api/messages/conversations/${id}`);
  },
  sendMessage(conversationId: string, message: string) {
    return doRequest<any>(`/api/messages/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ message })
    });
  },
  createConversation(clinicId: string, subject?: string, initialMessage?: string) {
    return doRequest<any>('/api/messages/conversations', {
      method: 'POST',
      body: JSON.stringify({ clinicId, subject, initialMessage })
    });
  },
  archiveConversation(id: string) {
    return doRequest<any>(`/api/messages/conversations/${id}/archive`, { method: 'PATCH' });
  },
  unarchiveConversation(id: string) {
    return doRequest<any>(`/api/messages/conversations/${id}/unarchive`, { method: 'PATCH' });
  },
  deleteConversation(id: string) {
    return doRequest<void>(`/api/messages/conversations/${id}`, { method: 'DELETE' });
  },
  getUnreadCount() {
    return doRequest<{ unreadCount: number }>('/api/messages/conversations/unread/count');
  }
};
