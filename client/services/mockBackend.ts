import { 
  LicenseKey, 
  LicenseStatus, 
  SubscriptionPlan, 
  SupportRequest, 
  CurrencyRate, 
  AppVersion, 
  RemoteConfig,
  User,
  UserRole,
  Notification,
  SystemSettings,
  AuditLog,
  Transaction,
  TransactionType,
  TransactionStatus,
  ServerHealth
} from '../types';

// --- SEED DATA ---

const SEED_USERS: User[] = [
  {
    id: 'u1',
    name: 'Admin User',
    email: 'admin@sourceplus.com',
    role: 'admin',
    createdAt: new Date().toISOString()
  },
  {
    id: 'u2',
    name: 'Ali Developer',
    email: 'ali@sourceplus.com',
    role: 'developer',
    createdAt: new Date().toISOString()
  }
];

const SEED_PLANS: SubscriptionPlan[] = [
    {
        id: 'plan-free-trial',
        name: 'Free Trial',
        durationMonths: 1,
        priceUSD: 0,
        alternativePrices: [],
        features: ['Full Access', '1 Device', '30 Days Trial', 'Basic Support'],
        deviceLimit: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        id: 'plan-standard',
        name: 'Standard License',
        durationMonths: 12,
        priceUSD: 150,
        alternativePrices: [
            { currency: 'IQD', amount: 225000 }
        ],
        features: ['Full Access', 'Unlimited Devices', 'Priority Support'],
        deviceLimit: 99,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

const SEED_CURRENCIES: CurrencyRate[] = [
  { code: 'USD', rate: 1, symbol: '$', lastUpdated: new Date().toISOString() },
  { code: 'IQD', rate: 1480, symbol: 'د.ع', lastUpdated: new Date().toISOString() }
];

const SEED_CONFIG: RemoteConfig[] = [
    { id: 'c1', key: 'maintenance_mode', value: false, description: 'Toggle system-wide maintenance', updatedAt: new Date().toISOString() },
    { id: 'c2', key: 'enable_beta_features', value: false, description: 'Enable beta features for all clients', updatedAt: new Date().toISOString() },
];

const SEED_NOTIFICATIONS: Notification[] = [
    {
        id: 'notif-1',
        title: 'Welcome to SourcePlus',
        body: 'System initialized successfully. You can clear this history.',
        isRead: false,
        sentAt: new Date().toISOString()
    }
];

// --- BACKEND SERVICE SIMULATION ---

class BackendService {
  private users = SEED_USERS;
  private plans = SEED_PLANS;
  private licenses: LicenseKey[] = [];
  private versions: AppVersion[] = [];
  private currencies = SEED_CURRENCIES;
  private config: RemoteConfig[] = SEED_CONFIG;
  private tickets: SupportRequest[] = [];
  private notifications: Notification[] = SEED_NOTIFICATIONS;
  private auditLogs: AuditLog[] = [];
  private transactions: Transaction[] = []; // Financial System
  
  private systemSettings: SystemSettings = {
    appName: 'SourcePlus Server',
    supportEmail: 'support@sourceplus.com',
    maintenanceMode: false,
    minPasswordLength: 8,
    sessionTimeout: 60,
    
    // Server Config
    serverHost: '0.0.0.0',
    serverPort: 3000,
    timezone: 'Asia/Baghdad',
    corsEnabled: true,
    corsOrigins: '*',
    rateLimitEnabled: true,

    // Database
    dbHost: 'localhost',
    dbPort: 5432,
    dbName: 'sourceplus_db',
    dbUser: 'postgres',

    // Logging
    logLevel: 'info',
    logRetentionDays: 14,

    // Notification Channels
    enableEmailAlerts: false,
    enableTelegramAlerts: false,
    
    // SMTP Defaults
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: 30,
    primaryColor: '#0ea5e9' // Sky-500
  };

  private currentUser: User | null = null;
  private serverStartTime = new Date();

  constructor() {
    // Generate some mock history for charts if empty
    if (this.auditLogs.length === 0) {
        this.generateMockAuditLogs();
    }
    // Generate some mock licenses
    if (this.licenses.length === 0) {
        this.generateLicense(this.plans[0].id, 'Demo User 1', 1);
        this.generateLicense(this.plans[1].id, 'Super Market LLC', 1);
    }
    
    // Generate mock financial history
    if (this.transactions.length <= 2) {
       this.generateMockTransactions();
    }
  }

  private generateMockAuditLogs() {
      const actions = ['LOGIN', 'GENERATE_LICENSE', 'UPDATE_CONFIG', 'VIEW_REPORTS'];
      for(let i=0; i<10; i++) {
          this.logAction('u1', actions[Math.floor(Math.random() * actions.length)], 'System auto-generated log');
      }
  }

  private generateMockTransactions() {
      // Create some past transactions
      const now = new Date();
      for (let i = 0; i < 20; i++) {
         const date = new Date(now);
         date.setDate(date.getDate() - Math.floor(Math.random() * 60)); // Past 60 days
         
         const plan = this.plans[1]; // Paid plan
         this.transactions.push({
             id: crypto.randomUUID(),
             customerName: `Mock Client ${i}`,
             planName: plan.name,
             amount: plan.priceUSD,
             currency: 'USD',
             type: 'purchase',
             status: 'completed',
             date: date.toISOString(),
             reference: `INV-${date.getFullYear()}-${Math.floor(Math.random()*10000)}`
         });
      }
      this.transactions.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // --- SERVER HEALTH SIMULATION ---
  getServerHealth(): ServerHealth {
      // Fluctuate values slightly to look alive
      return {
          cpuUsage: Math.floor(10 + Math.random() * 15), // 10-25%
          ramUsage: Math.floor(35 + Math.random() * 5),  // 35-40%
          diskUsage: 42, // Static 42%
          uptimeSeconds: Math.floor((new Date().getTime() - this.serverStartTime.getTime()) / 1000),
          networkIn: parseFloat((Math.random() * 2).toFixed(1)), // 0-2 MB/s
          networkOut: parseFloat((Math.random() * 5).toFixed(1)), // 0-5 MB/s
          activeConnections: 12 + Math.floor(Math.random() * 5),
          lastUpdated: new Date().toISOString()
      };
  }

  // --- LOGGING ---
  private logAction(userId: string, action: string, details: string) {
    const user = this.users.find(u => u.id === userId);
    const newLog: AuditLog = {
      id: crypto.randomUUID(),
      userId,
      userName: user ? user.name : 'System',
      action,
      details,
      timestamp: new Date().toISOString(),
      ipAddress: '127.0.0.1'
    };
    this.auditLogs = [newLog, ...this.auditLogs];
  }

  // --- FINANCIALS ---
  private recordTransaction(
    licenseId: string, 
    customerName: string, 
    planName: string, 
    amount: number, 
    type: TransactionType
  ) {
      if (amount <= 0) return; // Don't record free transactions
      
      const newTx: Transaction = {
          id: crypto.randomUUID(),
          licenseId,
          customerName,
          planName,
          amount,
          currency: 'USD',
          type,
          status: 'completed',
          date: new Date().toISOString(),
          reference: `INV-${new Date().getFullYear()}-${Math.floor(Math.random() * 100000)}`
      };
      this.transactions = [newTx, ...this.transactions];
  }

  getTransactions() { return this.transactions; }

  getFinancialStats() {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0,0,0,0);

      const totalRevenue = this.transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

      const dailyRevenue = this.transactions
        .filter(t => t.status === 'completed' && new Date(t.date) >= today)
        .reduce((sum, t) => sum + t.amount, 0);
        
      const monthlyRevenue = this.transactions
        .filter(t => t.status === 'completed' && new Date(t.date) >= thisMonth)
        .reduce((sum, t) => sum + t.amount, 0);

      return { totalRevenue, dailyRevenue, monthlyRevenue };
  }

  // --- AUTH ---
  login(email: string): User | null {
    const user = this.users.find(u => u.email === email) || null;
    if (user) {
        this.currentUser = user;
        this.logAction(user.id, 'LOGIN', `User ${user.email} logged in successfully`);
    }
    return user;
  }
  
  // --- METHODS ---
  getUsers() { return this.users; }
  addUser(name: string, email: string, role: UserRole, password?: string) {
    // In a real backend, password would be hashed and stored.
    const newUser: User = { id: crypto.randomUUID(), name, email, role, createdAt: new Date().toISOString() };
    this.users = [...this.users, newUser];
    if (this.currentUser) this.logAction(this.currentUser.id, 'CREATE_USER', `Created user ${email} as ${role} (PWD set)`);
  }
  deleteUser(id: string) { 
    const target = this.users.find(u => u.id === id);
    this.users = this.users.filter(u => u.id !== id); 
    if (this.currentUser && target) this.logAction(this.currentUser.id, 'DELETE_USER', `Deleted user ${target.email}`);
  }

  getPlans() { return this.plans; }
  addPlan(plan: Omit<SubscriptionPlan, 'id' | 'createdAt' | 'updatedAt' | 'isActive'>) {
    const newPlan: SubscriptionPlan = {
      id: crypto.randomUUID(),
      ...plan,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    this.plans = [...this.plans, newPlan];
    if (this.currentUser) this.logAction(this.currentUser.id, 'CREATE_PLAN', `Created plan ${plan.name} ($${plan.priceUSD})`);
  }
  updatePlan(id: string, updates: Partial<SubscriptionPlan>) {
    this.plans = this.plans.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p);
    if (this.currentUser) this.logAction(this.currentUser.id, 'UPDATE_PLAN', `Updated plan details for ID: ${id}`);
  }
  deletePlan(id: string) {
    this.plans = this.plans.filter(p => p.id !== id);
    if (this.currentUser) this.logAction(this.currentUser.id, 'DELETE_PLAN', `Deleted plan ID: ${id}`);
  }

  getLicenses() { return this.licenses; }
  
  generateLicense(planId: string, userName: string, quantity: number = 1): LicenseKey[] {
    const plan = this.plans.find(p => p.id === planId);
    if (!plan) throw new Error("Plan not found");

    const newLicenses: LicenseKey[] = [];
    const today = new Date();
    
    // Logic for Serial Prefix: TR for Trial (Free), SP for Paid
    const prefix = plan.priceUSD === 0 ? 'TR' : 'SP';
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; 
    const generateSegment = (length: number) => {
        let result = '';
        for (let i = 0; i < length; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }

    for (let i = 0; i < quantity; i++) {
        // Format: PRE-YEAR-XXXX-XXXX-XXXX
        const serial = `${prefix}-${today.getFullYear()}-${generateSegment(4)}-${generateSegment(4)}-${generateSegment(4)}`;
        
        const newLicense: LicenseKey = {
          id: crypto.randomUUID(),
          serial: serial,
          planId,
          userName,
          deviceLimit: plan.deviceLimit,
          activationCount: 0,
          status: LicenseStatus.PENDING, 
          createdAt: today.toISOString(),
          expireDate: this.addMonths(today, plan.durationMonths).toISOString()
        };
        newLicenses.push(newLicense);
        
        // Record Financial Transaction per license
        this.recordTransaction(
            newLicense.id,
            userName,
            plan.name,
            plan.priceUSD,
            'purchase'
        );
    }
    
    this.licenses = [...newLicenses, ...this.licenses];
    
    if (this.currentUser) {
        if (quantity === 1) {
             this.logAction(this.currentUser.id, 'GENERATE_LICENSE', `Generated ${newLicenses[0].serial} for ${userName}`);
        } else {
             this.logAction(this.currentUser.id, 'BULK_GENERATE', `Generated ${quantity} licenses for ${userName} (${plan.name})`);
        }
    }
    return newLicenses;
  }

  private addMonths(date: Date, months: number) {
      const d = new Date(date);
      d.setMonth(d.getMonth() + months);
      return d;
  }
  
  updateLicense(id: string, updates: Partial<LicenseKey>) {
    const license = this.licenses.find(l => l.id === id);
    if (!license) return;
    
    this.licenses = this.licenses.map(l => l.id === id ? { ...l, ...updates } : l);
    
    if (this.currentUser) {
        const details = [];
        if(updates.userName) details.push(`Name changed to ${updates.userName}`);
        this.logAction(this.currentUser.id, 'UPDATE_LICENSE', `Updated license ${license.serial}: ${details.join(', ')}`);
    }
  }

  revokeLicense(id: string) {
    const license = this.licenses.find(l => l.id === id);
    this.licenses = this.licenses.map(l => l.id === id ? { ...l, status: LicenseStatus.REVOKED } : l);
    if (this.currentUser && license) this.logAction(this.currentUser.id, 'REVOKE_LICENSE', `Revoked license ${license.serial}`);
  }

  togglePauseLicense(id: string) {
      const license = this.licenses.find(l => l.id === id);
      if (!license) return;
      
      const newStatus = license.status === LicenseStatus.PAUSED ? LicenseStatus.ACTIVE : LicenseStatus.PAUSED;
      
      this.licenses = this.licenses.map(l => l.id === id ? { ...l, status: newStatus } : l);
      if (this.currentUser) this.logAction(this.currentUser.id, 'TOGGLE_PAUSE', `${newStatus === LicenseStatus.PAUSED ? 'Paused' : 'Resumed'} license ${license.serial}`);
  }
  
  deleteLicense(id: string) {
    const license = this.licenses.find(l => l.id === id);
    this.licenses = this.licenses.filter(l => l.id !== id);
    if (this.currentUser && license) this.logAction(this.currentUser.id, 'DELETE_LICENSE', `Deleted license ${license.serial}`);
  }

  renewLicense(id: string, monthsToAdd: number) {
    const license = this.licenses.find(l => l.id === id);
    if (!license) return;
    
    const plan = this.plans.find(p => p.id === license.planId);
    
    let newExpireDate = new Date();
    // If not expired, add to current expiry
    if (license.expireDate && new Date(license.expireDate) > new Date()) {
        newExpireDate = new Date(license.expireDate);
    }
    newExpireDate.setMonth(newExpireDate.getMonth() + monthsToAdd);
    
    this.licenses = this.licenses.map(l => l.id === id ? {
        ...l,
        status: LicenseStatus.ACTIVE,
        expireDate: newExpireDate.toISOString(),
        lastRenewalDate: new Date().toISOString()
    } : l);

    // Calculate pro-rated or fixed cost for renewal
    // Simple logic: (Price / Duration) * New Months
    let renewalCost = 0;
    if (plan && plan.priceUSD > 0 && plan.durationMonths > 0) {
        renewalCost = Math.round((plan.priceUSD / plan.durationMonths) * monthsToAdd);
        this.recordTransaction(
            license.id,
            license.userName,
            `${plan.name} (Renewal)`,
            renewalCost,
            'renewal'
        );
    }

    if (this.currentUser) this.logAction(this.currentUser.id, 'RENEW_LICENSE', `Renewed ${license.serial} for ${monthsToAdd} months`);
  }

  getTickets() { return this.tickets; }
  replyToTicket(id: string, reply: string) {
    this.tickets = this.tickets.map(t => 
      t.id === id ? { ...t, status: 'in_progress', adminReply: reply, replyAt: new Date().toISOString() } : t
    );
    if (this.currentUser) this.logAction(this.currentUser.id, 'REPLY_TICKET', `Replied to ticket ${id}`);
  }
  resolveTicket(id: string) {
    this.tickets = this.tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t);
    if (this.currentUser) this.logAction(this.currentUser.id, 'RESOLVE_TICKET', `Resolved ticket ${id}`);
  }

  getNotifications() { return this.notifications; }
  sendNotification(title: string, body: string, targetSerial?: string) {
    const newNotif: Notification = {
      id: crypto.randomUUID(),
      title,
      body,
      targetSerial,
      isRead: false,
      sentAt: new Date().toISOString()
    };
    this.notifications = [newNotif, ...this.notifications];
    
    // Logic to send via Telegram if enabled
    if (this.systemSettings.enableTelegramAlerts && this.systemSettings.telegramBotToken) {
       console.log('Dispatching to Telegram Bot:', this.systemSettings.telegramBotToken);
       // In real app: axios.post(`https://api.telegram.org/bot${token}/sendMessage`, ...)
    }

    if (this.currentUser) this.logAction(this.currentUser.id, 'SEND_NOTIFICATION', `Sent: ${title} to ${targetSerial || 'ALL'}`);
  }
  deleteNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    if (this.currentUser) this.logAction(this.currentUser.id, 'DELETE_NOTIFICATION', `Deleted notification ID ${id}`);
  }
  clearNotifications() {
    this.notifications = [];
    if (this.currentUser) this.logAction(this.currentUser.id, 'CLEAR_NOTIFICATIONS', `Cleared all notifications history`);
  }

  getCurrencies() { return this.currencies; }
  addCurrency(code: string, rate: number, symbol: string) {
    if (this.currencies.find(c => c.code === code)) return;
    this.currencies = [...this.currencies, { code, rate, symbol, lastUpdated: new Date().toISOString() }];
    if (this.currentUser) this.logAction(this.currentUser.id, 'ADD_CURRENCY', `Added currency ${code} (${symbol})`);
  }
  updateRate(code: string, rate: number) {
    this.currencies = this.currencies.map(c => c.code === code ? { ...c, rate, lastUpdated: new Date().toISOString() } : c);
    if (this.currentUser) this.logAction(this.currentUser.id, 'UPDATE_RATE', `Updated ${code} rate to ${rate}`);
  }
  deleteCurrency(code: string) { 
    this.currencies = this.currencies.filter(c => c.code !== code); 
    if (this.currentUser) this.logAction(this.currentUser.id, 'DELETE_CURRENCY', `Deleted currency ${code}`);
  }
  syncCurrencyRates() {
      // Simulation of fetching live rates API
      this.currencies = this.currencies.map(c => {
          if (c.code === 'USD') return c; // Base currency
          // Random fluctuation between -2% and +2%
          const fluctuation = 1 + ((Math.random() * 0.04) - 0.02);
          const newRate = Math.floor(c.rate * fluctuation);
          return {
              ...c,
              rate: newRate,
              lastUpdated: new Date().toISOString()
          };
      });
      if (this.currentUser) this.logAction(this.currentUser.id, 'SYNC_RATES', 'Synchronized currency rates from external API');
  }

  getVersions() { return this.versions; }
  addVersion(version: Partial<AppVersion>) {
    this.versions = [{ 
      id: crypto.randomUUID(), 
      version: version.version!, 
      releaseNotes: version.releaseNotes || '', 
      downloadUrl: version.downloadUrl || '', 
      forceUpdate: version.forceUpdate || false, 
      releaseDate: new Date().toISOString(), 
      isActive: true 
    }, ...this.versions];
    if (this.currentUser) this.logAction(this.currentUser.id, 'PUBLISH_VERSION', `Published version ${version.version}`);
  }
  updateVersion(id: string, updates: Partial<AppVersion>) {
      this.versions = this.versions.map(v => v.id === id ? { ...v, ...updates } : v);
      if (this.currentUser) this.logAction(this.currentUser.id, 'UPDATE_VERSION', `Updated version details for ${id}`);
  }
  deleteVersion(id: string) {
    const v = this.versions.find(ver => ver.id === id);
    this.versions = this.versions.filter(ver => ver.id !== id);
    if (this.currentUser && v) this.logAction(this.currentUser.id, 'DELETE_VERSION', `Deleted version ${v.version}`);
  }
  
  getConfig() { return this.config; }
  updateConfig(key: string, value: any) {
    this.config = this.config.map(c => c.key === key ? { ...c, value, updatedAt: new Date().toISOString() } : c);
    if (this.currentUser) this.logAction(this.currentUser.id, 'UPDATE_CONFIG', `Updated config key: ${key}`);
  }

  getSystemSettings() { return this.systemSettings; }
  updateSystemSettings(newSettings: Partial<SystemSettings>) {
    this.systemSettings = { ...this.systemSettings, ...newSettings };
    if (this.currentUser) this.logAction(this.currentUser.id, 'UPDATE_SETTINGS', `Updated System Settings`);
  }

  getAuditLogs() { return this.auditLogs; }
  
  clearAuditLogs() {
    this.auditLogs = [];
    if (this.currentUser) {
        // We re-add one log entry so the list isn't completely confusingly empty
        const newLog: AuditLog = {
            id: crypto.randomUUID(),
            userId: this.currentUser.id,
            userName: this.currentUser.name,
            action: 'CLEAR_LOGS',
            details: 'Admin manually purged all audit logs',
            timestamp: new Date().toISOString(),
            ipAddress: '127.0.0.1'
        };
        this.auditLogs.push(newLog);
    }
  }

  // --- ANALYTICS & DASHBOARD HELPERS ---

  getStats() {
    const now = new Date();
    const expiringSoon = this.licenses.filter(l => {
        if (!l.expireDate || l.status !== LicenseStatus.ACTIVE) return false;
        const exp = new Date(l.expireDate);
        const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return diffDays > 0 && diffDays <= 30;
    });

    const activeCount = this.licenses.filter(l => l.status === LicenseStatus.ACTIVE).length;
    
    // Revenue calculated from transactions for precision
    const revenue = this.transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + t.amount, 0);

    return {
      activeLicenses: activeCount,
      expiredLicenses: this.licenses.filter(l => l.status === LicenseStatus.EXPIRED).length,
      expiringSoonCount: expiringSoon.length,
      totalRevenueUSD: revenue,
      openTickets: this.tickets.filter(t => t.status === 'open').length,
      totalCustomers: new Set(this.licenses.map(l => l.userName)).size // Unique names
    };
  }
  
  getRevenueHistory(period: 'year' | '6months' = 'year') {
    const months: {[key: string]: number} = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    const today = new Date();
    const count = period === 'year' ? 11 : 5; 

    for (let i = count; i >= 0; i--) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = monthNames[d.getMonth()];
        months[key] = 0;
    }

    // Use transactions for precise history
    this.transactions.forEach(t => {
        if(t.status !== 'completed') return;
        const d = new Date(t.date);
        const key = monthNames[d.getMonth()];
        // Only verify if the transaction falls within our range roughly (year check omitted for simplicity in mock)
        if (months.hasOwnProperty(key)) {
             months[key] += t.amount;
        }
    });

    const data = Object.keys(months).map(name => ({
        name,
        revenue: months[name]
    }));

    return data;
  }
}

export const backend = new BackendService();