

export enum LicenseStatus {
  ACTIVE = 'active',
  EXPIRED = 'expired',
  REVOKED = 'revoked',
  PENDING = 'pending',
  PAUSED = 'paused'
}

export type UserRole = 'admin' | 'developer' | 'viewer';

export interface User {
  id: string; // UUID
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  createdAt: string;
  clinicId?: string; // UUID of associated clinic
}


export interface PlanPrice {
  currency: string;
  monthlyPrice: number;
  periodPrice: number;
  yearlyPrice: number;
  discount: number;
  isPrimary: boolean;
}

export interface SubscriptionPlan {
  id: string; // UUID
  name: string;
  durationMonths: number;
  prices: PlanPrice[]; // Multi-currency pricing
  features: any; // JSON
  limits: any; // JSON
  deviceLimit: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  // Legacy fields (optional)
  priceUSD?: number;
  price_monthly?: number;
  price_yearly?: number;
  currency?: string;
}

export interface LicenseKey {
  id: string; // UUID
  serial: string;
  planId: string;
  userName?: string;
  customerName?: string;
  deviceLimit: number;
  activationCount: number;
  hardwareId?: string; // For Device Lock
  activationDate?: string;
  expireDate?: string;
  status: LicenseStatus;
  versionAllowed?: string;
  createdAt: string;
  lastRenewalDate?: string;
  isPaused?: boolean;
}

export interface AppVersion {
  id: string; // UUID
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  forceUpdate: boolean;
  releaseDate: string;
  isActive: boolean;
}

export interface SupportRequest {
  id: string; // UUID
  serial: string;
  hardwareId: string;
  deviceName: string;
  systemVersion: string;
  phoneNumber: string; // Required
  appVersion: string;
  description: string;
  adminReply?: string; // Response from admin
  replyAt?: string;
  createdAt: string;
  status: 'open' | 'in_progress' | 'resolved';
}

export interface Notification {
  id: string; // UUID
  title: string;
  body: string;
  targetSerial?: string; // If null, broadcast to all
  isRead: boolean;
  sentAt: string;
}

export interface CurrencyRate {
  code: string; // IQD, USD, SAR, AED, TRY
  rate: number; // Against USD
  symbol: string; // $, €, د.ع
  lastUpdated: string;
}

export interface RemoteConfig {
  id: string;
  key: string;
  value: any; // JSON value
  description: string;
  updatedAt: string;
}

export interface SystemSettings {
  // General
  appName: string;
  supportEmail: string;
  maintenanceMode: boolean;

  // Security (App Level)
  minPasswordLength: number;
  sessionTimeout: number; // minutes

  // Server Network
  serverHost: string;
  serverPort: number;
  timezone: string;
  corsEnabled: boolean;
  corsOrigins: string;
  rateLimitEnabled: boolean;

  // Database Configuration
  dbHost: string;
  dbPort: number;
  dbName: string;
  dbUser: string;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  logRetentionDays: number;

  // Notification Channels
  enableEmailAlerts: boolean;
  enableTelegramAlerts: boolean;

  // Email Config (SMTP)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;

  // Telegram Config
  telegramBotToken?: string;
  telegramChatId?: string;

  // Backup
  autoBackup: boolean;
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  retentionDays: number;

  // Branding
  primaryColor: string; // Hex Code
  logoUrl?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
  ipAddress: string;
}

// --- ACCOUNTING SYSTEM TYPES ---

export type TransactionType = 'purchase' | 'renewal' | 'refund' | 'adjustment';
export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'cancelled';

export interface Transaction {
  id: string;
  licenseId?: string; // Optional if generic income
  customerName: string;
  planName: string;
  amount: number;
  currency: 'USD' | 'IQD';
  type: TransactionType;
  status: TransactionStatus;
  date: string;
  reference?: string; // Invoice number or payment ID
  notes?: string;
}

export interface ServerHealth {
  cpuUsage: number;
  ramUsage: number;
  diskUsage: number;
  uptimeSeconds: number;
  networkIn: number; // MB/s
  networkOut: number; // MB/s
  activeConnections: number;
  lastUpdated: string;
}

export type ProductType = 'POS' | 'CLINIC';

export enum RegistrationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED'
}

export interface Clinic {
  id: string;
  name: string;
  doctorName?: string;
  email: string;
  phone?: string;
  address?: string;

  systemVersion?: string;
  status: RegistrationStatus;
  licenseId?: string;
  license?: LicenseKey;
  users?: User[]; // Associated users
  createdAt: string;
  updatedAt: string;
}
