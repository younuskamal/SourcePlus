import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clinic } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import ClinicInformationPanel from './ClinicInformationPanel';
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
    Database,
    TrendingUp,
    Eye,
    LogOut,
    AlertCircle,
    ChevronRight,
    Clock,
    Info
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

    useEffect(() => {
        loadData();
    }, [clinic.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [controlsData, usageData, auditData] = await Promise.all([
                api.getClinicControls(clinic.id),
                api.getClinicUsage(clinic.id).catch(() => ({ activeUsersCount: 0, storageUsedMB: 0, lastUpdated: new Date().toISOString() })),
                api.getAuditLogs().catch(() => [])
            ]);

            setControls(controlsData);
            setUsage({
                storageUsedMB: usageData.storageUsedMB,
                activeUsersCount: usageData.activeUsersCount
            });

            const clinicLogs = (auditData as AuditEntry[])
                .filter(log => log.details.includes(clinic.name) || log.details.includes(clinic.id))
                .slice(0, 10);
            setAuditLogs(clinicLogs);
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
        { id: 'overview', label: t('dashboard.overview'), icon: Building2 },
        { id: 'usage', label: t('dashboard.usage'), icon: TrendingUp },
        { id: 'features', label: t('dashboard.features'), icon: Zap },
        { id: 'subscription', label: t('dashboard.subscription'), icon: Calendar },
        { id: 'security', label: t('dashboard.security'), icon: Shield },
        { id: 'audit', label: t('dashboard.audit'), icon: FileText }
    ] as const;

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl">
                    <Loader2 className="animate-spin text-emerald-500 mx-auto" size={40} />
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-4">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    if (!controls) return null;

    return (
        <>
            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 border-2 border-rose-500 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-full w-fit bg-rose-100 dark:bg-rose-900/30 text-rose-600">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    ⚠️ {t('dashboard.lockConfirmTitle')}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    {t('dashboard.lockConfirmMessage').replace('{clinicName}', clinic.name)}
                                </p>
                            </div>
                            <div className="flex gap-3 justify-end mt-2">
                                <button
                                    onClick={() => setShowLockConfirm(false)}
                                    className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {t('dashboard.cancel')}
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-5 py-2 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700 transition-colors shadow-lg"
                                >
                                    {t('dashboard.yesLock')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Dashboard */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-6xl max-h-[95vh] flex flex-col animate-in zoom-in-95 duration-200">

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 dark:from-emerald-950/30 dark:via-teal-950/30 dark:to-cyan-950/30">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-lg">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    {clinic.name}
                                    {controls.locked && (
                                        <span className="px-2 py-1 text-xs rounded-full bg-rose-600 text-white animate-pulse flex items-center gap-1">
                                            <Lock size={12} /> {t('dashboard.locked')}
                                        </span>
                                    )}
                                </h2>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.title')}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800 transition-colors">
                            <XCircle size={24} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" />
                        </button>
                    </div>

                    {/* Overview Banner */}
                    <div className="p-6 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800/50 dark:to-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1 group cursor-pointer">
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Activity size={14} className="group-hover:text-emerald-500 transition-colors" />
                                    {t('dashboard.status')}
                                </p>
                                <div className="flex items-center gap-2">
                                    {controls.locked ? (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 flex items-center gap-1">
                                            <Lock size={12} /> {t('dashboard.locked')}
                                        </span>
                                    ) : (
                                        <span className="px-2 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center gap-1">
                                            <CheckCircle size={12} /> {t('dashboard.active')}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1 group cursor-pointer">
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Building2 size={14} className="group-hover:text-emerald-500 transition-colors" />
                                    {t('dashboard.clinicId')}
                                </p>
                                <p className="text-sm font-mono text-slate-900 dark:text-white truncate">{clinic.id.substring(0, 12)}...</p>
                            </div>
                            <div className="space-y-1 group cursor-pointer">
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Clock size={14} className="group-hover:text-emerald-500 transition-colors" />
                                    {t('dashboard.remainingDays')}
                                </p>
                                <p className={`text-sm font-bold ${(remainingDays || 0) < 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                    {remainingDays !== null ? `${remainingDays} ${t('clinics.days')}` : 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1 group cursor-pointer">
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Calendar size={14} className="group-hover:text-emerald-500 transition-colors" />
                                    {t('dashboard.registration')}
                                </p>
                                <p className="text-sm text-slate-900 dark:text-white">
                                    {new Date(clinic.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 overflow-x-auto">
                        <div className="flex px-6">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all duration-200 whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-white dark:bg-slate-800'
                                        : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span className="font-medium text-sm">{tab.label}</span>
                                    {activeTab === tab.id && <ChevronRight size={16} className="animate-pulse" />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content - سأستكمل في الجزء التالي */}
                    <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                {/* Clinic Information Panel - الجزء الجديد */}
                                <ClinicInformationPanel
                                    clinic={clinic}
                                    controls={controls}
                                    usage={usage}
                                />

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Clinic Info Card */}
                                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 group">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 group-hover:scale-110 transition-transform">
                                                <Building2 size={18} />
                                            </div>
                                            {t('dashboard.clinicInfo')}
                                        </h3>
                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <span className="text-slate-500">{t('clinics.tableClinic')}:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.name}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <span className="text-slate-500">{t('login.email')}:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.email}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <span className="text-slate-500">{t('support.phone')}:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.phone || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center p-2 rounded hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                                <span className="text-slate-500">{t('clinics.tableClinic')}:</span>
                                                <span className="font-medium text-slate-900 dark:text-white">{clinic.address || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Stats Card */}
                                    <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300 group">
                                        <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 group-hover:scale-110 transition-transform">
                                                <Activity size={18} />
                                            </div>
                                            {t('dashboard.quickStats')}
                                        </h3>
                                        <div className="space-y-4">
                                            {/* Storage Progress */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <HardDrive size={14} />
                                                        {t('dashboard.storageUsage')}
                                                    </span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {usage.storageUsedMB}MB / {controls.storageLimitMB}MB
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${storagePercentage > 80 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{storagePercentage.toFixed(1)}% used</p>
                                            </div>

                                            {/* Users Progress */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-slate-500 flex items-center gap-1">
                                                        <UsersIcon size={14} />
                                                        {t('dashboard.activeUsers')}
                                                    </span>
                                                    <span className="font-bold text-slate-900 dark:text-white">
                                                        {usage.activeUsersCount} / {controls.usersLimit}
                                                    </span>
                                                </div>
                                                <div className="h-2.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${usersPercentage >= 100 ? 'bg-rose-500' : usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                            }`}
                                                        style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                <p className="text-xs text-slate-500 mt-1">{usersPercentage.toFixed(0)}% used</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Enabled Features */}
                                <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Zap size={18} className="text-emerald-500" />
                                        {t('dashboard.enabledFeatures')}
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(controls.features).map(([key, enabled]) => (
                                            enabled && (
                                                <span key={key} className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 capitalize flex items-center gap-1.5 hover:scale-105 transition-transform">
                                                    <CheckCircle size={14} />
                                                    {key}
                                                </span>
                                            )
                                        ))}
                                        {Object.values(controls.features).every(v => !v) && (
                                            <span className="text-sm text-slate-500">No features enabled</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Usage & Limits Tab */}
                        {activeTab === 'usage' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                {/* Storage Section */}
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <HardDrive size={20} className="text-emerald-500" />
                                        {t('dashboard.storageUsage')}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.usedStorage')}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {usage.storageUsedMB}MB / {controls.storageLimitMB}MB ({storagePercentage.toFixed(1)}%)
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${storagePercentage > 80 ? 'bg-rose-500' : storagePercentage > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                />
                                            </div>
                                            {storagePercentage > 80 && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {t('dashboard.storageCritical')}
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

                                {/* Users Section */}
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <UsersIcon size={20} className="text-emerald-500" />
                                        {t('dashboard.usersManagement')}
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <div className="flex justify-between mb-2">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">{t('dashboard.activeUsers')}</span>
                                                <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                    {usage.activeUsersCount} / {controls.usersLimit}
                                                </span>
                                            </div>
                                            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full transition-all duration-500 ${usersPercentage >= 100 ? 'bg-rose-500' : usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                    style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                                />
                                            </div>
                                            {usersPercentage >= 100 && (
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 flex items-center gap-1">
                                                    <AlertCircle size={14} />
                                                    {t('dashboard.usersLimitReached')}
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
                                            <p className="text-xs text-slate-500 mt-1">
                                                {t('dashboard.remainingSlots')}: {Math.max(0, controls.usersLimit - usage.activeUsersCount)}
                                            </p>
                                        </div>

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <button className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-sm font-medium flex items-center gap-2 transition-colors">
                                                <Eye size={16} />
                                                {t('dashboard.viewAllUsers')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Features Tab */}
                        {activeTab === 'features' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Zap size={20} className="text-emerald-500" />
                                        {t('dashboard.featuresControl')}
                                    </h3>
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
                                        {t('dashboard.featureDescription')}
                                    </p>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {Object.entries(controls.features).map(([key, value]) => (
                                            <label key={key} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all hover:border-emerald-500 dark:hover:border-emerald-600 group">
                                                <input
                                                    type="checkbox"
                                                    checked={value}
                                                    onChange={(e) => updateFeature(key as any, e.target.checked)}
                                                    className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-slate-900 dark:text-white capitalize flex items-center gap-2">
                                                        {key}
                                                        {value && <CheckCircle size={14} className="text-emerald-500" />}
                                                    </div>
                                                    <div className={`text-xs mt-0.5 ${value ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500'}`}>
                                                        {value ? t('dashboard.enabled') : t('dashboard.disabled')}
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
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <Calendar size={20} className="text-emerald-500" />
                                        {t('dashboard.subscriptionControl')}
                                    </h3>

                                    {clinic.license ? (
                                        <div className="space-y-4">
                                            <div className="grid md:grid-cols-3 gap-4">
                                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                                                        <Calendar size={12} />
                                                        {t('dashboard.activationDate')}
                                                    </label>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {new Date(clinic.license.activationDate || clinic.createdAt).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                                                        <Calendar size={12} />
                                                        {t('dashboard.expirationDate')}
                                                    </label>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                        {clinic.license.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <div className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                                                    <label className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-2">
                                                        <Clock size={12} />
                                                        {t('dashboard.remainingDays')}
                                                    </label>
                                                    <p className={`text-xl font-bold ${(remainingDays || 0) < 30 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                                        {remainingDays !== null ? `${remainingDays} ${t('clinics.days')}` : 'N/A'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 block">
                                                    {t('dashboard.quickExtend')}
                                                </label>
                                                <div className="flex flex-wrap gap-3">
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors flex items-center gap-2">
                                                        <Calendar size={16} />
                                                        {t('dashboard.extendMonth')}
                                                    </button>
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors flex items-center gap-2">
                                                        <Calendar size={16} />
                                                        {t('dashboard.extend6Months')}
                                                    </button>
                                                    <button className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900/50 text-sm font-medium transition-colors flex items-center gap-2">
                                                        <Calendar size={16} />
                                                        {t('dashboard.extendYear')}
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                                                    {t('dashboard.customEndDate')}
                                                </label>
                                                <input
                                                    type="date"
                                                    className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-12">
                                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                                                <AlertCircle size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400">{t('dashboard.noLicense')}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        {controls.locked ? <Lock size={20} className="text-rose-500" /> : <Unlock size={20} className="text-emerald-500" />}
                                        {t('dashboard.accessControl')}
                                    </h3>

                                    {controls.locked && (
                                        <div className="mb-6 p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 animate-in slide-in-from-top duration-200">
                                            <p className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                                <Lock size={16} />
                                                {t('dashboard.clinicLocked')}
                                            </p>
                                            <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                                {t('dashboard.lockMessage')}
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <label className="flex items-start gap-3 p-4 rounded-xl border-2 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group">
                                            <input
                                                type="checkbox"
                                                checked={controls.locked}
                                                onChange={(e) => setControls({ ...controls, locked: e.target.checked })}
                                                className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                                            />
                                            <div className="flex-1">
                                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {controls.locked ? (
                                                        <>
                                                            <Lock size={16} className="text-rose-500" />
                                                            {t('dashboard.lockClinic')}
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Unlock size={16} className="text-emerald-500" />
                                                            {t('dashboard.clinicActive')}
                                                        </>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 mt-0.5">
                                                    {controls.locked ? t('dashboard.lockMessage') : t('dashboard.clinicActiveDesc')}
                                                </div>
                                            </div>
                                        </label>

                                        {controls.locked && (
                                            <div className="space-y-2 animate-in slide-in-from-top duration-200">
                                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                    <Info size={14} />
                                                    {t('dashboard.lockReason')}
                                                </label>
                                                <textarea
                                                    value={controls.lockReason || ''}
                                                    onChange={(e) => setControls({ ...controls, lockReason: e.target.value || null })}
                                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500 outline-none"
                                                    rows={3}
                                                    placeholder="e.g., Payment overdue, Terms violation, etc."
                                                />
                                            </div>
                                        )}

                                        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                            <button className="px-4 py-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-sm font-medium flex items-center gap-2 transition-colors">
                                                <LogOut size={16} />
                                                {t('dashboard.forceLogoutAll')}
                                            </button>
                                            <p className="text-xs text-slate-500 mt-2">{t('dashboard.forceLogoutDesc')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Audit Log Tab */}
                        {activeTab === 'audit' && (
                            <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-all duration-300">
                                    <h3 className="font-semibold text-lg text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                        <FileText size={20} className="text-emerald-500" />
                                        {t('dashboard.recentActivity')}
                                    </h3>
                                    {auditLogs.length === 0 ? (
                                        <div className="text-center py-12">
                                            <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                                                <FileText size={40} className="text-slate-400" />
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{t('dashboard.noAuditLogs')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            {auditLogs.map((log, index) => (
                                                <div
                                                    key={log.id}
                                                    className="p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group"
                                                    style={{ animationDelay: `${index * 50}ms` }}
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                                                    <Activity size={14} />
                                                                </div>
                                                                <p className="text-sm font-semibold text-slate-900 dark:text-white">{log.action}</p>
                                                            </div>
                                                            <p className="text-xs text-slate-600 dark:text-slate-400 ml-8">{log.details}</p>
                                                        </div>
                                                        <div className="text-right flex-shrink-0">
                                                            <p className="text-xs text-slate-500 flex items-center gap-1">
                                                                <Clock size={12} />
                                                                {new Date(log.createdAt).toLocaleDateString()}
                                                            </p>
                                                            {log.user && (
                                                                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                                                    <UsersIcon size={10} />
                                                                    {log.user.name}
                                                                </p>
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

                    {/* Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-950/50 flex items-center justify-between rounded-b-2xl">
                        <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Info size={14} />
                            💡 {t('dashboard.changesApply')}
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors text-slate-600 dark:text-slate-300"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-semibold hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {t('dashboard.saveChanges')}
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
