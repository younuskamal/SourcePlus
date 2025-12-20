import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clinic } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import {
    XCircle,
    Building2,
    Activity,
    HardDrive,
    Users as UsersIcon,
    Zap,
    Lock,
    Unlock,
    Calendar,
    Shield,
    FileText,
    Save,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Database,
    UserCheck,
    TrendingUp,
    Settings,
    Eye,
    LogOut,
    AlertCircle
} from 'lucide-react';

interface ClinicControlDashboardProps {
    clinic: Clinic;
    onClose: () => void;
    onUpdate: () => void;
}

interface ControlsData {
    storageLimitMB: number;
    usersLimit: number;
    features: {
        patients: boolean;
        appointments: boolean;
        orthodontics: boolean;
        xray: boolean;
        ai: boolean;
    };
    locked: boolean;
    lockReason: string | null;
}

interface UsageData {
    storageUsedMB: number;
    activeUsersCount: number;
}

interface AuditEntry {
    id: string;
    action: string;
    details: string;
    createdAt: string;
    userId?: string;
    user?: { name: string };
}

type TabType = 'overview' | 'usage' | 'features' | 'subscription' | 'security' | 'audit';

const ClinicControlDashboard: React.FC<ClinicControlDashboardProps> = ({ clinic, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [usage, setUsage] = useState<UsageData>({ storageUsedMB: 0, activeUsersCount: 0 });
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLockConfirm, setShowLockConfirm] = useState(false);

    // Subscription state
    const [subscriptionType, setSubscriptionType] = useState<'monthly' | '6months' | 'yearly'>('monthly');
    const [customEndDate, setCustomEndDate] = useState('');

    useEffect(() => {
        loadData();
    }, [clinic.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [controlsData, auditData] = await Promise.all([
                api.getClinicControls(clinic.id),
                api.getAuditLogs().catch(() => [])
            ]);

            setControls(controlsData);

            // Filter audit logs for this clinic
            const clinicLogs = (auditData as AuditEntry[])
                .filter(log => log.details.includes(clinic.name) || log.details.includes(clinic.id))
                .slice(0, 10);
            setAuditLogs(clinicLogs);

            // Mock usage data (replace with actual API call)
            setUsage({
                storageUsedMB: Math.floor(Math.random() * controlsData.storageLimitMB),
                activeUsersCount: Math.floor(Math.random() * controlsData.usersLimit)
            });
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!controls) return;

        if (controls.locked && !showLockConfirm) {
            setShowLockConfirm(true);
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(clinic.id, controls);
            onUpdate();
            loadData();
        } catch (error: any) {
            alert(error?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
            setShowLockConfirm(false);
        }
    };

    const calculateRemainingDays = () => {
        if (!clinic.license?.expireDate) return null;
        const now = new Date();
        const expire = new Date(clinic.license.expireDate);
        const days = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const updateFeature = (key: keyof ControlsData['features'], value: boolean) => {
        if (!controls) return;
        setControls({
            ...controls,
            features: { ...controls.features, [key]: value }
        });
    };

    const storagePercentage = controls ? (usage.storageUsedMB / controls.storageLimitMB) * 100 : 0;
    const usersPercentage = controls ? (usage.activeUsersCount / controls.usersLimit) * 100 : 0;
    const remainingDays = calculateRemainingDays();

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Building2 },
        { id: 'usage', label: 'Usage & Limits', icon: TrendingUp },
        { id: 'features', label: 'Features', icon: Zap },
        { id: 'subscription', label: 'Subscription', icon: Calendar },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'audit', label: 'Audit Log', icon: FileText }
    ] as const;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8">
                    <Loader2 className="animate-spin text-emerald-500" size={40} />
                </div>
            </div>
        );
    }

    if (!controls) return null;

    return (
        <>
            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border-2 border-rose-500">
                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-full w-fit bg-rose-100 dark:bg-rose-900/30 text-rose-600">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">⚠️ Lock Clinic?</h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    This will immediately prevent {clinic.name} from accessing the system.
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end">
                                <button onClick={() => setShowLockConfirm(false)} className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                                    Cancel
                                </button>
                                <button onClick={handleSave} className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold">
                                    Yes, Lock Clinic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Dashboard */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-6xl max-h-[95vh] flex flex-col">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {clinic.name}
                                    {controls.locked && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-rose-600 text-white animate-pulse">
                                            🔒 LOCKED
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">Clinic Control Dashboard</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800">
                            <XCircle size={24} className="text-slate-400" />
                        </button>
                    </div>

                    {/* Overview Banner (Always Visible) */}
                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Status</p>
                                <div className="flex items-center gap-2">
                                    {controls.locked ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center gap-1">
                                            <Lock size={12} /> Locked
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> Active
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Clinic ID</p>
                                <p className="text-sm font-mono text-slate-900 dark:text-white">{clinic.id.substring(0, 8)}...</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Remaining Days</p>
                                <p className="text-sm font-bold text-slate-900 dark:text-white">
                                    {remainingDays !== null ? `${remainingDays} days` : 'No license'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Registration</p>
                                <p className="text-sm text-slate-900 dark:text-white">
                                    {new Date(clinic.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
                        <div className="flex px-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto p-6">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Building2 size={18} className="text-emerald-500" />
                                            Clinic Information
                                        </h3>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Name:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Email:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.email}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Phone:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Address:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                            <Activity size={18} className="text-emerald-500" />
                                            Quick Stats
                                        </h3>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-500">Storage</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {usage.storageUsedMB}MB / {controls.storageLimitMB}MB
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${storagePercentage > 80 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-slate-500">Users</span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {usage.activeUsersCount} / {controls.usersLimit}
                                                    </span>
                                                </div>
                                                <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all ${usersPercentage >= 100 ? 'bg-rose-500' : usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3">Enabled Features</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(controls.features).map(([key, enabled]) => (
                                            enabled && (
                                                <span key={key} className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 capitalize">
                                                    {key}
                                                </span>
                                            )
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Usage & Limits Tab */}
                        {activeTab === 'usage' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <HardDrive size={20} className="text-emerald-500" />
                                        Storage Usage
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Used Storage</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {usage.storageUsedMB}MB / {controls.storageLimitMB}MB ({storagePercentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${storagePercentage > 80 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                />
                                            </div>
                                            {storagePercentage > 80 && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    Storage usage is critical! Consider increasing the limit.
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                Storage Limit (MB)
                                            </label>
                                            <input
                                                type="number"
                                                min={100}
                                                step={100}
                                                value={controls.storageLimitMB}
                                                onChange={(e) => setControls({ ...controls, storageLimitMB: parseInt(e.target.value) || 1024 })}
                                                className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">{(controls.storageLimitMB / 1024).toFixed(2)} GB</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <UsersIcon size={20} className="text-emerald-500" />
                                        Users Management
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">Active Users</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {usage.activeUsersCount} / {controls.usersLimit} ({usersPercentage.toFixed(0)}%)
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all ${usersPercentage >= 100 ? 'bg-rose-500' : usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                                />
                                            </div>
                                            {usersPercentage >= 100 && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    User limit reached! No new users can be added.
                                                </p>
                                            )}
                                        </div>

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                Users Limit
                                            </label>
                                            <input
                                                type="number"
                                                min={1}
                                                value={controls.usersLimit}
                                                onChange={(e) => setControls({ ...controls, usersLimit: parseInt(e.target.value) || 3 })}
                                                className="w-full max-w-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                            />
                                            <p className="text-xs text-slate-500 mt-1">Remaining slots: {Math.max(0, controls.usersLimit - usage.activeUsersCount)}</p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2">
                                                <Eye size={16} />
                                                View All Users
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Features Tab */}
                        {activeTab === 'features' && (
                            <div className="space-y-4">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Zap size={20} className="text-emerald-500" />
                                        Features & Modules Control
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                        Enable or disable features for this clinic. Changes apply instantly.
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {Object.entries(controls.features).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => updateFeature(key as any, e.target.checked)}
                                                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-900 dark:text-white capitalize">{key}</div>
                                                    <div className="text-xs text-slate-500">
                                                        {value ? 'Enabled' : 'Disabled'}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subscription Tab */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-emerald-500" />
                                        Subscription Duration Control
                                    </h3>

                                    {clinic.license ? (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400">Activation Date</label>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                                        {new Date(clinic.license.activationDate || clinic.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400">Expiration Date</label>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white mt-1">
                                                        {clinic.license.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500 dark:text-slate-400">Remaining Days</label>
                                                    <p className={`text-sm font-bold mt-1 ${(remainingDays || 0) < 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {remainingDays !== null ? `${remainingDays} days` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                                                    Quick Extend
                                                </label>
                                                <div className="flex gap-3">
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium">
                                                        +1 Month
                                                    </button>
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium">
                                                        +6 Months
                                                    </button>
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium">
                                                        +1 Year
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                    Custom End Date
                                                </label>
                                                <input
                                                    type="date"
                                                    value={customEndDate}
                                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-slate-500">
                                            No active license. Please assign a license first.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        {controls.locked ? <Lock size={20} className="text-rose-500" /> : <Unlock size={20} className="text-emerald-500" />}
                                        Clinic Access Control
                                    </h3>

                                    {controls.locked && (
                                        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                            <p className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                                <Lock size={16} />
                                                This clinic is currently LOCKED
                                            </p>
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                                Users cannot access the system. All sessions are terminated.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={controls.locked}
                                                onChange={(e) => setControls({ ...controls, locked: e.target.checked })}
                                                className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 dark:text-white">
                                                    {controls.locked ? '🔒 Clinic is Locked' : '🔓 Clinic is Active'}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {controls.locked ? 'System blocked. Users cannot access.' : 'System operational and accessible.'}
                                                </div>
                                            </div>
                                        </label>

                                        {controls.locked && (
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                                    Lock Reason
                                                </label>
                                                <textarea
                                                    value={controls.lockReason || ''}
                                                    onChange={(e) => setControls({ ...controls, lockReason: e.target.value || null })}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                                    rows={3}
                                                    placeholder="e.g., Payment overdue, Terms violation, etc."
                                                />
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <button className="px-4 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-sm font-medium flex items-center gap-2">
                                                <LogOut size={16} />
                                                Force Logout All Users
                                            </button>
                                            <p className="text-xs text-slate-500 mt-2">Immediately terminates all active sessions</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Audit Log Tab */}
                        {activeTab === 'audit' && (
                            <div className="space-y-4">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-emerald-500" />
                                        Recent Activity (Last 10 Actions)
                                    </h3>
                                    {auditLogs.length === 0 ? (
                                        <p className="text-sm text-slate-500 text-center py-8">No audit logs found for this clinic</p>
                                    ) : (
                                        <div className="space-y-3">
                                            {auditLogs.map(log => (
                                                <div key={log.id} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700">
                                                    <div className="flex items-start justify-between gap-2">
                                                        <div className="flex-1">
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{log.action}</p>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">{log.details}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-slate-500">{new Date(log.createdAt).toLocaleDateString()}</p>
                                                            {log.user && (
                                                                <p className="text-xs text-slate-400">by {log.user.name}</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between rounded-b-2xl">
                        <p className="text-xs text-slate-500">
                            💡 Changes apply <strong>immediately</strong> to Smart Clinic
                        </p>
                        <div className="flex gap-3">
                            <button onClick={onClose} className="px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800">
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold hover:from-emerald-600 hover:to-teal-700 shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        Save All Changes
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClinicControlDashboard;
