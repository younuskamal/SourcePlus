
import React, { useEffect, useState } from 'react';
import ConfirmModal from '../components/ConfirmModal';
import { translations, Language } from '../locales';
import { Save, Terminal, Globe, ToggleLeft, ToggleRight, Mail, HardDrive, Palette, Bell, Check, MessageSquare, Server, Clock, Hash, Database, Shield, Activity, FileText, AlertTriangle, Trash2, Download, Upload, RefreshCw } from 'lucide-react';
import { api } from '../services/api';
import { SystemSettings } from '../types';
import { useAutoRefresh } from '../hooks/useAutoRefresh';

interface SettingsProps {
    currentLang: Language;
    onThemeChange?: (hex: string) => void;
}

const Settings: React.FC<SettingsProps> = ({ currentLang, onThemeChange }) => {
    const t = translations[currentLang];
    const { tick: autoRefreshTick, requestRefresh } = useAutoRefresh();
    const [activeTab, setActiveTab] = useState<'general' | 'server' | 'channels' | 'remote' | 'backup'>('general');
    const [config, setConfig] = useState<any[]>([]);
    const [systemSettings, setSystemSettings] = useState<SystemSettings>({
        appName: '',
        supportEmail: '',
        maintenanceMode: false,
        minPasswordLength: 8,
        sessionTimeout: 60,
        serverHost: '0.0.0.0',
        serverPort: 3001,
        timezone: 'UTC',
        corsEnabled: true,
        corsOrigins: '*',
        rateLimitEnabled: false,
        dbHost: '',
        dbPort: 5432,
        dbName: '',
        dbUser: '',
        logLevel: 'info',
        logRetentionDays: 14,
        enableEmailAlerts: false,
        enableTelegramAlerts: false,
        smtpHost: '',
        smtpPort: 587,
        smtpUser: '',
        smtpPassword: '',
        telegramBotToken: '',
        telegramChatId: '',
        autoBackup: false,
        backupFrequency: 'daily',
        retentionDays: 30,
        primaryColor: '#0ea5e9',
        logoUrl: ''
    });
    const [isSaved, setIsSaved] = useState(false);
    const [isResetModalOpen, setIsResetModalOpen] = useState(false);
    const [backups, setBackups] = useState<{ filename: string; size: number; createdAt: string }[]>([]);
    const [isBackupLoading, setIsBackupLoading] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleReset = async () => {
        try {
            await api.resetSystem();
            setIsResetModalOpen(false);
            window.location.reload();
        } catch (err) {
            console.error(err);
        }
    };

    const loadBackups = async () => {
        try {
            const data = await api.getBackups();
            setBackups(data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateBackup = async () => {
        setIsBackupLoading(true);
        try {
            await api.createBackup();
            await loadBackups();
        } catch (err) {
            console.error(err);
        } finally {
            setIsBackupLoading(false);
        }
    };

    const handleRestoreBackup = async (filename: string) => {
        if (!window.confirm(`Are you sure you want to restore ${filename}? Current data will be replaced.`)) return;
        setIsBackupLoading(true);
        try {
            await api.restoreBackup(filename);
            alert('System restored successfully. Please reload.');
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Restore failed');
        } finally {
            setIsBackupLoading(false);
        }
    };

    const handleDeleteBackup = async (filename: string) => {
        if (!window.confirm(`Delete backup ${filename}?`)) return;
        try {
            await api.deleteBackup(filename);
            await loadBackups();
        } catch (err) {
            console.error(err);
        }
    };

    const handleUploadClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsBackupLoading(true);
        try {
            await api.uploadBackup(file);
            await loadBackups();
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (err) {
            console.error(err);
            alert('Upload failed');
        } finally {
            setIsBackupLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'backup') {
            loadBackups();
        }
    }, [activeTab]);

    useEffect(() => {
        const load = async () => {
            try {
                const [settingsRes, remoteRes] = await Promise.all([
                    api.getSettings().catch(() => ({} as any)),
                    api.getRemoteConfig().catch(() => ({} as any))
                ]);
                if (settingsRes) setSystemSettings(settingsRes as any);
                if (remoteRes) {
                    setConfig(
                        Object.entries(remoteRes).map(([key, value]) => ({
                            id: key,
                            key,
                            value,
                            description: ''
                        }))
                    );
                }
            } catch (err) {
                console.error(err);
            }
        };
        load();
    }, [autoRefreshTick]);

    const handleToggleRemote = async (key: string, currentVal: boolean) => {
        const newValue = !currentVal;
        const next = config.map((item) => (item.key === key ? { ...item, value: newValue } : item));
        setConfig(next);
        try {
            await api.updateRemoteConfig({ [key]: newValue });
            requestRefresh();
        } catch (err) {
            console.error(err);
            setConfig(config);
        }
    };

    const handleSaveSettings = async () => {
        try {
            await api.updateSettings(systemSettings);
            if (onThemeChange && systemSettings.primaryColor) {
                onThemeChange(systemSettings.primaryColor);
            }
            requestRefresh();
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 2000);
        } catch (err) {
            console.error(err);
            setIsSaved(false);
        }
    };

    const tabs = [
        { id: 'general', label: t.tabGeneral, icon: Globe },
        { id: 'server', label: t.tabServer, icon: Server },
        { id: 'channels', label: t.tabChannels, icon: Bell },
        { id: 'backup', label: t.tabBackup, icon: HardDrive },
        { id: 'remote', label: 'System Reset', icon: AlertTriangle },
    ];

    const presetColors = ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#ef4444', '#f97316', '#eab308', '#10b981', '#14b8a6'];

    return (
        <div className="space-y-5 max-w-6xl mx-auto">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t.remoteConfig}</h1>
                </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 border-b border-gray-200 dark:border-slate-700 scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-slate-800'
                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden min-h-[400px]">

                {/* GENERAL TAB */}
                {activeTab === 'general' && (
                    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 uppercase tracking-wide opacity-70">Identity & Security</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.appName}</label>
                                    <input
                                        value={systemSettings.appName}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, appName: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.supportEmail}</label>
                                    <input
                                        value={systemSettings.supportEmail}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, supportEmail: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.minPassLen}</label>
                                        <input
                                            type="number"
                                            value={systemSettings.minPasswordLength}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, minPasswordLength: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">{t.sessionTimeout}</label>
                                        <input
                                            type="number"
                                            value={systemSettings.sessionTimeout}
                                            onChange={(e) => setSystemSettings({ ...systemSettings, sessionTimeout: Number(e.target.value) })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-700 pb-2 uppercase tracking-wide opacity-70 flex items-center gap-2"><Palette size={16} /> Branding</h3>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">{t.primaryColor}</label>
                                    <div className="grid grid-cols-6 gap-2 mb-4">
                                        {presetColors.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => setSystemSettings({ ...systemSettings, primaryColor: color })}
                                                className={`w-8 h-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 shadow-sm border-2 ${systemSettings.primaryColor === color ? 'border-gray-900 dark:border-white' : 'border-transparent'}`}
                                                style={{ backgroundColor: color }}
                                            >
                                                {systemSettings.primaryColor === color && <Check className="text-white drop-shadow-md" size={14} />}
                                            </button>
                                        ))}
                                        <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 dark:border-slate-600 flex items-center justify-center cursor-pointer group">
                                            <input
                                                type="color"
                                                value={systemSettings.primaryColor}
                                                onChange={(e) => setSystemSettings({ ...systemSettings, primaryColor: e.target.value })}
                                                className="absolute inset-0 w-[150%] h-[150%] -top-1/4 -left-1/4 p-0 m-0 cursor-pointer opacity-0"
                                            />
                                            <Palette size={14} className="text-slate-400 group-hover:text-slate-600" />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-sm text-amber-900 dark:text-amber-400">{t.maintenanceMode}</h3>
                                        <p className="text-xs text-amber-700 dark:text-amber-500/80">Block client access temporarily.</p>
                                    </div>
                                    <button
                                        onClick={() => setSystemSettings({ ...systemSettings, maintenanceMode: !systemSettings.maintenanceMode })}
                                        className={`text-2xl transition-colors ${systemSettings.maintenanceMode ? 'text-amber-600' : 'text-slate-300 dark:text-slate-600'}`}
                                    >
                                        {systemSettings.maintenanceMode ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SERVER CONFIG TAB */}
                {activeTab === 'server' && (
                    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Network */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-600"><Globe size={14} /></div>
                                Network Binding
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{t.serverHost}</label>
                                    <input
                                        value={systemSettings.serverHost || '0.0.0.0'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, serverHost: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{t.serverPort}</label>
                                    <input
                                        type="number"
                                        value={systemSettings.serverPort || 3000}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, serverPort: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{t.timezone}</label>
                                    <select
                                        value={systemSettings.timezone || 'Asia/Baghdad'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, timezone: e.target.value })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    >
                                        <option value="UTC">UTC</option>
                                        <option value="Asia/Baghdad">Asia/Baghdad</option>
                                        <option value="Asia/Riyadh">Asia/Riyadh</option>
                                        <option value="Europe/London">Europe/London</option>
                                        <option value="America/New_York">America/New_York</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100 dark:border-slate-700" />

                        {/* Database */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <div className="p-1 bg-sky-100 dark:bg-sky-900/30 rounded text-sky-600"><Database size={14} /></div>
                                {t.dbConnection}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-700/20 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.dbHost}</label>
                                    <input
                                        value={systemSettings.dbHost || 'localhost'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, dbHost: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.dbPort}</label>
                                    <input
                                        type="number"
                                        value={systemSettings.dbPort || 5432}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, dbPort: Number(e.target.value) })}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.dbName}</label>
                                    <input
                                        value={systemSettings.dbName || 'sourceplus_db'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, dbName: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.dbUser}</label>
                                    <input
                                        value={systemSettings.dbUser || 'postgres'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, dbUser: e.target.value })}
                                        className="w-full px-3 py-1.5 border border-gray-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded focus:ring-2 focus:ring-primary-500 outline-none text-sm font-mono"
                                    />
                                </div>
                            </div>
                        </section>

                        <hr className="border-slate-100 dark:border-slate-700" />

                        {/* Security */}
                        <section>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-3">
                                <div className="p-1 bg-emerald-100 dark:bg-emerald-900/30 rounded text-emerald-600"><Shield size={14} /></div>
                                {t.security}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 bg-white dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{t.corsEnabled}</h4>
                                        <p className="text-[10px] text-slate-500">Allow external requests.</p>
                                    </div>
                                    <button
                                        onClick={() => setSystemSettings({ ...systemSettings, corsEnabled: !systemSettings.corsEnabled })}
                                        className={`text-xl transition-colors ${systemSettings.corsEnabled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                                    >
                                        {systemSettings.corsEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>

                                <div className="p-3 bg-white dark:bg-slate-700/30 rounded-lg border border-slate-200 dark:border-slate-600 flex justify-between items-center">
                                    <div>
                                        <h4 className="font-bold text-slate-900 dark:text-white text-xs">{t.rateLimit}</h4>
                                        <p className="text-[10px] text-slate-500">Protect API from abuse.</p>
                                    </div>
                                    <button
                                        onClick={() => setSystemSettings({ ...systemSettings, rateLimitEnabled: !systemSettings.rateLimitEnabled })}
                                        className={`text-xl transition-colors ${systemSettings.rateLimitEnabled ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                                    >
                                        {systemSettings.rateLimitEnabled ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">{t.logLevel}</label>
                                    <select
                                        value={systemSettings.logLevel || 'info'}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, logLevel: e.target.value as any })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    >
                                        <option value="debug">DEBUG</option>
                                        <option value="info">INFO</option>
                                        <option value="warn">WARN</option>
                                        <option value="error">ERROR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Log Retention (Days)</label>
                                    <input
                                        type="number"
                                        value={systemSettings.logRetentionDays || 14}
                                        onChange={(e) => setSystemSettings({ ...systemSettings, logRetentionDays: Number(e.target.value) })}
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-primary-500 outline-none text-sm"
                                    />
                                </div>
                            </div>
                        </section>
                    </div>
                )}

                {/* CHANNELS TAB */}
                {activeTab === 'channels' && (
                    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 gap-6">
                            {/* Email */}
                            <div className={`p-5 rounded-xl border transition-all ${systemSettings.enableEmailAlerts ? 'bg-blue-50/50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                                            <Mail size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Email Notifications</h4>
                                            <p className="text-xs text-slate-500">SMTP Server Configuration</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSystemSettings({ ...systemSettings, enableEmailAlerts: !systemSettings.enableEmailAlerts })}>
                                        {systemSettings.enableEmailAlerts ? <ToggleRight size={40} className="text-blue-500" /> : <ToggleLeft size={40} className="text-slate-300 dark:text-slate-600" />}
                                    </button>
                                </div>

                                {systemSettings.enableEmailAlerts && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-1">
                                        <input value={systemSettings.smtpHost} onChange={(e) => setSystemSettings({ ...systemSettings, smtpHost: e.target.value })} placeholder="Host (e.g. smtp.gmail.com)" className="input-std" />
                                        <input type="number" value={systemSettings.smtpPort} onChange={(e) => setSystemSettings({ ...systemSettings, smtpPort: Number(e.target.value) })} placeholder="Port (e.g. 587)" className="input-std" />
                                        <input value={systemSettings.smtpUser} onChange={(e) => setSystemSettings({ ...systemSettings, smtpUser: e.target.value })} placeholder="Username" className="input-std" />
                                        <input type="password" value={systemSettings.smtpPassword} onChange={(e) => setSystemSettings({ ...systemSettings, smtpPassword: e.target.value })} placeholder="Password" className="input-std" />
                                    </div>
                                )}
                            </div>

                            {/* Telegram */}
                            <div className={`p-5 rounded-xl border transition-all ${systemSettings.enableTelegramAlerts ? 'bg-sky-50/50 dark:bg-sky-900/10 border-sky-200 dark:border-sky-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-600 dark:text-sky-400">
                                            <MessageSquare size={20} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-900 dark:text-white text-sm">Telegram Bot</h4>
                                            <p className="text-xs text-slate-500">Instant Push Alerts</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setSystemSettings({ ...systemSettings, enableTelegramAlerts: !systemSettings.enableTelegramAlerts })}>
                                        {systemSettings.enableTelegramAlerts ? <ToggleRight size={40} className="text-sky-500" /> : <ToggleLeft size={40} className="text-slate-300 dark:text-slate-600" />}
                                    </button>
                                </div>

                                {systemSettings.enableTelegramAlerts && (
                                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-1">
                                        <input value={systemSettings.telegramBotToken} onChange={(e) => setSystemSettings({ ...systemSettings, telegramBotToken: e.target.value })} placeholder="Bot Token" className="input-std font-mono" />
                                        <input value={systemSettings.telegramChatId} onChange={(e) => setSystemSettings({ ...systemSettings, telegramChatId: e.target.value })} placeholder="Chat ID" className="input-std font-mono" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* BACKUP TAB */}
                {activeTab === 'backup' && (
                    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                        {/* Auto Backup Configuration Card */}
                        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                                        <Clock size={24} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg">{t.autoBackup}</h3>
                                        <p className="text-sm text-slate-500">Configure automated cloud backups to ensure data safety.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSystemSettings({ ...systemSettings, autoBackup: !systemSettings.autoBackup })}
                                    className={`transition-colors ${systemSettings.autoBackup ? 'text-emerald-500' : 'text-slate-300 dark:text-slate-600'}`}
                                >
                                    {systemSettings.autoBackup ? <ToggleRight size={48} /> : <ToggleLeft size={48} />}
                                </button>
                            </div>

                            {systemSettings.autoBackup && (
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8 animate-in slide-in-from-top-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{t.backupFreq}</label>
                                        <div className="flex gap-3">
                                            {['daily', 'weekly', 'monthly'].map(freq => (
                                                <button
                                                    key={freq}
                                                    onClick={() => setSystemSettings({ ...systemSettings, backupFrequency: freq as any })}
                                                    className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${systemSettings.backupFrequency === freq
                                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-500 text-emerald-700 dark:text-emerald-400 ring-2 ring-emerald-500/20'
                                                        : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                        }`}
                                                >
                                                    {freq.charAt(0).toUpperCase() + freq.slice(1)}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">{t.retentionDays}</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={systemSettings.retentionDays}
                                                onChange={(e) => setSystemSettings({ ...systemSettings, retentionDays: Number(e.target.value) })}
                                                className="w-full pl-4 pr-12 py-3 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-medium transition-all"
                                            />
                                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">Days</span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Manual Backup & Restore Section */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">System Snapshots</h3>
                                    <p className="text-sm text-slate-500">Create manual backups or restore from previous points.</p>
                                </div>
                                <div className="flex gap-3">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        className="hidden"
                                        accept=".json"
                                    />
                                    <button
                                        onClick={handleUploadClick}
                                        disabled={isBackupLoading}
                                        className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <Upload size={18} />
                                        Upload Backup
                                    </button>
                                    <button
                                        onClick={handleCreateBackup}
                                        disabled={isBackupLoading}
                                        className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg text-sm font-medium hover:opacity-90 transition-all flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {isBackupLoading ? <RefreshCw size={18} className="animate-spin" /> : <HardDrive size={18} />}
                                        Create Snapshot
                                    </button>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
                                {backups.length === 0 ? (
                                    <div className="p-12 flex flex-col items-center justify-center text-center">
                                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                            <Database size={32} />
                                        </div>
                                        <h4 className="text-slate-900 dark:text-white font-medium mb-1">No backups found</h4>
                                        <p className="text-slate-500 text-sm max-w-xs mx-auto">Create a manual backup or wait for the automated schedule to run.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-gray-100 dark:divide-slate-800">
                                        <div className="bg-slate-50/50 dark:bg-slate-800/50 p-3 grid grid-cols-12 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                            <div className="col-span-6 pl-2">Filename</div>
                                            <div className="col-span-3">Size</div>
                                            <div className="col-span-3 text-right pr-2">Actions</div>
                                        </div>
                                        {backups.map((backup) => (
                                            <div key={backup.filename} className="p-4 grid grid-cols-12 items-center hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                                <div className="col-span-6 flex items-center gap-3">
                                                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{backup.filename}</p>
                                                        <p className="text-xs text-slate-500">{new Date(backup.createdAt).toLocaleString()}</p>
                                                    </div>
                                                </div>
                                                <div className="col-span-3">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                                        {(backup.size / 1024).toFixed(2)} KB
                                                    </span>
                                                </div>
                                                <div className="col-span-3 flex items-center justify-end gap-2">
                                                    <a
                                                        href={`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/backup/download/${backup.filename}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-900/20 rounded-lg transition-colors"
                                                        title="Download"
                                                    >
                                                        <Download size={18} />
                                                    </a>
                                                    <button
                                                        onClick={() => handleRestoreBackup(backup.filename)}
                                                        className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-colors"
                                                        title="Restore"
                                                    >
                                                        <RefreshCw size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteBackup(backup.filename)}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* SYSTEM RESET TAB (Formerly Remote) */}
                {activeTab === 'remote' && (
                    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800 rounded-xl p-6">
                            <div className="flex items-start gap-4">
                                <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-full">
                                    <AlertTriangle size={32} />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-bold text-rose-700 dark:text-rose-400">Danger Zone: System Reset</h3>
                                    <p className="text-sm text-rose-600/80 dark:text-rose-300/80 max-w-2xl">
                                        This action will permanently delete all system data, including:
                                        <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                                            <li>All Licenses and Keys</li>
                                            <li>Transaction History</li>
                                            <li>Support Tickets and Messages</li>
                                            <li>Audit Logs</li>
                                            <li>System Notifications</li>
                                        </ul>
                                        <br />
                                        <strong>Users, Plans, and Currencies will be preserved.</strong>
                                    </p>
                                    <button
                                        onClick={() => setIsResetModalOpen(true)}
                                        className="mt-4 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2"
                                    >
                                        <Trash2 size={18} />
                                        Reset System Data
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Actions */}
                <div className="p-4 bg-gray-50 dark:bg-slate-900 border-t border-gray-200 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={handleSaveSettings}
                        disabled={activeTab === 'remote'}
                        className={`flex items-center gap-2 px-6 py-2 rounded-lg transition-colors font-bold text-sm shadow-sm ${activeTab === 'remote' ? 'opacity-0 pointer-events-none' : 'bg-primary-600 hover:bg-primary-700 text-white'}`}
                    >
                        <Save size={16} />
                        {isSaved ? 'Saved!' : t.save}
                    </button>
                </div>

            </div>

            <style>{`
        .input-std {
            @apply w-full px-3 py-2 border border-gray-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm;
        }
      `}</style>
            <ConfirmModal
                isOpen={isResetModalOpen}
                onClose={() => setIsResetModalOpen(false)}
                onConfirm={handleReset}
                title="System Reset"
                message="Are you absolutely sure? This action cannot be undone. All licenses, transactions, and logs will be permanently deleted."
                confirmText="Yes, Reset Everything"
                type="danger"
            />
        </div>
    );
};

export default Settings;
