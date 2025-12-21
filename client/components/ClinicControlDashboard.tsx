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
    TrendingUp,
    Eye,
    LogOut,
    AlertCircle,
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
                                    className="px-4 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-slate-700 dark:text-slate-300 font-medium"
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gradient-to-br from-black/40 via-black/60 to-black/80 backdrop-blur-md animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/50 dark:border-slate-700/50 w-full max-w-7xl max-h-[96vh] flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">

                    {/* Enhanced Header */}
                    <div className="relative flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm shadow-lg">
                                <Building2 size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">{clinic.name}</h2>
                                    {controls.locked && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-rose-500 text-white animate-pulse flex items-center gap-1.5 font-bold">
                                            <Lock size={14} /> {t('dashboard.locked')}
                                        </span>
                                    )}
                                </div>
                                <p className="text-emerald-100 text-sm mt-1 font-medium">{t('dashboard.title')}</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/20 backdrop-blur-sm transition-all hover:rotate-90 duration-300"
                        >
                            <XCircle size={28} className="text-white" />
                        </button>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="border-b border-slate-200 dark:border-slate-700 bg-gradient-to-b from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 overflow-x-auto">
                        <div className="flex px-6 gap-1">
                            {tabs.map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as TabType)}
                                    className={`flex items-center gap-2 px-5 py-3.5 border-b-3 transition-all duration-200 whitespace-nowrap font-medium text-sm ${activeTab === tab.id
                                            ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 rounded-t-lg'
                                            : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-t-lg'
                                        }`}
                                >
                                    <tab.icon size={18} />
                                    <span>{tab.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
                        <div className="p-6 max-w-6xl mx-auto">

                            {/* Overview Tab */}
                            {activeTab === 'overview' && (
                                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                    <ClinicInformationPanel
                                        clinic={clinic}
                                        controls={controls}
                                        usage={usage}
                                    />
                                </div>
                            )}

                            {/* Usage & Limits Tab */}
                            {activeTab === 'usage' && (
                                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                    {/* Storage Card */}
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                                                <HardDrive size={22} className="text-emerald-600 dark:text-emerald-400" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.storageUsage')}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-2.5">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.usedStorage')}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {usage.storageUsedMB}MB / {controls.storageLimitMB}MB <span className="text-slate-500">({storagePercentage.toFixed(1)}%)</span>
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-500 shadow-sm ${storagePercentage > 80 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                                                                storagePercentage > 60 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                                                    'bg-gradient-to-r from-emerald-500 to-teal-500'
                                                            }`}
                                                        style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                                                    />
                                                </div>
                                                {storagePercentage > 80 && (
                                                    <div className="mt-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                                        <p className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                                                            <AlertCircle size={14} />
                                                            {t('dashboard.storageCritical')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                                    {t('dashboard.storageUsage')} (MB)
                                                </label>
                                                <input
                                                    type="number"
                                                    min={100}
                                                    step={100}
                                                    value={controls.storageLimitMB}
                                                    onChange={(e) => setControls({ ...controls, storageLimitMB: parseInt(e.target.value) || 1024 })}
                                                    className="w-full max-w-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{(controls.storageLimitMB / 1024).toFixed(2)} GB</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Users Card */}
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg hover:shadow-xl transition-shadow">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                                                <UsersIcon size={22} className="text-purple-600 dark:text-purple-400" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.usersManagement')}</h3>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between mb-2.5">
                                                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.activeUsers')}</span>
                                                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                        {usage.activeUsersCount} / {controls.usersLimit}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                                                    <div
                                                        className={`h-full transition-all duration-500 ${usersPercentage >= 100 ? 'bg-gradient-to-r from-rose-500 to-rose-600' :
                                                                usersPercentage > 80 ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
                                                                    'bg-gradient-to-r from-purple-500 to-pink-500'
                                                            }`}
                                                        style={{ width: `${Math.min(usersPercentage, 100)}%` }}
                                                    />
                                                </div>
                                                {usersPercentage >= 100 && (
                                                    <div className="mt-2.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                                        <p className="text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 font-medium">
                                                            <AlertCircle size={14} />
                                                            {t('dashboard.usersLimitReached')}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">
                                                    {t('dashboard.usersManagement')}
                                                </label>
                                                <input
                                                    type="number"
                                                    min={1}
                                                    value={controls.usersLimit}
                                                    onChange={(e) => setControls({ ...controls, usersLimit: parseInt(e.target.value) || 3 })}
                                                    className="w-full max-w-xs rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                                                />
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">
                                                    {t('dashboard.remainingSlots')}: <span className="font-bold text-purple-600 dark:text-purple-400">{Math.max(0, controls.usersLimit - usage.activeUsersCount)}</span>
                                                </p>
                                            </div>

                                            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 hover:from-slate-200 hover:to-slate-300 dark:hover:from-slate-600 dark:hover:to-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold flex items-center gap-2 transition-all shadow-sm hover:shadow">
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
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                                                <Zap size={22} className="text-amber-600 dark:text-amber-400" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.featuresControl')}</h3>
                                                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">{t('dashboard.featureDescription')}</p>
                                            </div>
                                        </div>

                                        <div className="grid md:grid-cols-2 gap-4 mt-6">
                                            {Object.entries(controls.features).map(([key, value]) => (
                                                <label
                                                    key={key}
                                                    className={`group flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all duration-200 ${value
                                                            ? 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700 shadow-sm'
                                                            : 'bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700'
                                                        }`}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={value}
                                                        onChange={(e) => updateFeature(key as any, e.target.checked)}
                                                        className="h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-2 focus:ring-emerald-500 transition-all"
                                                    />
                                                    <div className="flex-1">
                                                        <div className="font-semibold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                                                            {key}
                                                            {value && <CheckCircle size={16} className="text-emerald-600 dark:text-emerald-400" />}
                                                        </div>
                                                        <div className={`text-xs mt-0.5 font-medium ${value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
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
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                                                <Calendar size={22} className="text-blue-600 dark:text-blue-400" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.subscriptionControl')}</h3>
                                        </div>

                                        {clinic.license ? (
                                            <div className="space-y-5">
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Calendar size={14} className="text-slate-500" />
                                                            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.activationDate')}</label>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {new Date(clinic.license.activationDate || clinic.createdAt).toLocaleDateString()}
                                                        </p>
                                                    </div>

                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-slate-700">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Calendar size={14} className="text-slate-500" />
                                                            <label className="text-xs text-slate-600 dark:text-slate-400 font-medium">{t('dashboard.expirationDate')}</label>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                                                            {clinic.license.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : 'N/A'}
                                                        </p>
                                                    </div>

                                                    <div className={`p-4 rounded-xl border-2 ${(remainingDays || 0) < 7 ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-300 dark:border-rose-700' :
                                                            (remainingDays || 0) < 30 ? 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-300 dark:border-amber-700' :
                                                                'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700'
                                                        }`}>
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Clock size={14} />
                                                            <label className="text-xs font-medium">{t('dashboard.remainingDays')}</label>
                                                        </div>
                                                        <p className={`text-2xl font-bold ${(remainingDays || 0) < 7 ? 'text-rose-600 dark:text-rose-400' :
                                                                (remainingDays || 0) < 30 ? 'text-amber-600 dark:text-amber-400' :
                                                                    'text-emerald-600 dark:text-emerald-400'
                                                            }`}>
                                                            {remainingDays !== null ? `${remainingDays} ${t('clinics.days')}` : 'N/A'}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 block">{t('dashboard.quickExtend')}</label>
                                                    <div className="flex flex-wrap gap-3">
                                                        {[
                                                            { label: t('dashboard.extendMonth'), icon: Calendar },
                                                            { label: t('dashboard.extend6Months'), icon: Calendar },
                                                            { label: t('dashboard.extendYear'), icon: Calendar }
                                                        ].map((btn, i) => (
                                                            <button
                                                                key={i}
                                                                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 text-emerald-700 dark:text-emerald-300 hover:from-emerald-200 hover:to-teal-200 dark:hover:from-emerald-900/50 dark:hover:to-teal-900/50 text-sm font-semibold transition-all shadow-sm hover:shadow flex items-center gap-2"
                                                            >
                                                                <btn.icon size={16} />
                                                                {btn.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 block">{t('dashboard.customEndDate')}</label>
                                                    <input
                                                        type="date"
                                                        className="rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                                                    <AlertCircle size={40} className="text-slate-400" />
                                                </div>
                                                <p className="text-slate-500 dark:text-slate-400 font-medium">{t('dashboard.noLicense')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Security Tab */}
                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-in slide-in-from-right duration-300">
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                                        <div className="flex items-center gap-3 mb-5">
                                            {controls.locked ?
                                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30">
                                                    <Lock size={22} className="text-rose-600 dark:text-rose-400" />
                                                </div>
                                                :
                                                <div className="p-2.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                                                    <Unlock size={22} className="text-emerald-600 dark:text-emerald-400" />
                                                </div>
                                            }
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.accessControl')}</h3>
                                        </div>

                                        {controls.locked && (
                                            <div className="mb-6 p-4 rounded-xl bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-2 border-rose-300 dark:border-rose-700 animate-in slide-in-from-top duration-200">
                                                <p className="text-sm font-bold text-rose-700 dark:text-rose-300 flex items-center gap-2">
                                                    <Lock size={16} />
                                                    {t('dashboard.clinicLocked')}
                                                </p>
                                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1.5 font-medium">
                                                    {t('dashboard.lockMessage')}
                                                </p>
                                            </div>
                                        )}

                                        <div className="space-y-5">
                                            <label className={`flex items-start gap-3 p-5 rounded-xl cursor-pointer transition-all border-2 ${controls.locked
                                                    ? 'bg-gradient-to-br from-rose-50 to-red-50 dark:from-rose-900/20 dark:to-red-900/20 border-rose-300 dark:border-rose-700'
                                                    : 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-300 dark:border-emerald-700'
                                                } hover:shadow-md`}>
                                                <input
                                                    type="checkbox"
                                                    checked={controls.locked}
                                                    onChange={(e) => setControls({ ...controls, locked: e.target.checked })}
                                                    className={`h-5 w-5 rounded border-slate-300 mt-0.5 focus:ring-2 transition-all ${controls.locked ? 'text-rose-600 focus:ring-rose-500' : 'text-emerald-600 focus:ring-emerald-500'
                                                        }`}
                                                />
                                                <div className="flex-1">
                                                    <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                        {controls.locked ? (
                                                            <>
                                                                <Lock size={18} className="text-rose-600 dark:text-rose-400" />
                                                                {t('dashboard.lockClinic')}
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Unlock size={18} className="text-emerald-600 dark:text-emerald-400" />
                                                                {t('dashboard.clinicActive')}
                                                            </>
                                                        )}
                                                    </div>
                                                    <div className="text-xs text-slate-600 dark:text-slate-400 mt-1 font-medium">
                                                        {controls.locked ? t('dashboard.lockMessage') : t('dashboard.clinicActiveDesc')}
                                                    </div>
                                                </div>
                                            </label>

                                            {controls.locked && (
                                                <div className="space-y-2 animate-in slide-in-from-top duration-200">
                                                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                                        <Info size={14} />
                                                        {t('dashboard.lockReason')}
                                                    </label>
                                                    <textarea
                                                        value={controls.lockReason || ''}
                                                        onChange={(e) => setControls({ ...controls, lockReason: e.target.value || null })}
                                                        className="w-full rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all"
                                                        rows={3}
                                                        placeholder="e.g., Payment overdue, Terms violation, etc."
                                                    />
                                                </div>
                                            )}

                                            <div className="pt-5 border-t border-slate-200 dark:border-slate-700">
                                                <button className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-100 to-red-100 dark:from-rose-900/30 dark:to-red-900/30 text-rose-700 dark:text-rose-300 hover:from-rose-200 hover:to-red-200 dark:hover:from-rose-900/50 dark:hover:to-red-900/50 text-sm font-bold flex items-center gap-2 transition-all shadow-sm hover:shadow">
                                                    <LogOut size={16} />
                                                    {t('dashboard.forceLogoutAll')}
                                                </button>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 font-medium">{t('dashboard.forceLogoutDesc')}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Audit Tab */}
                            {activeTab === 'audit' && (
                                <div className="space-y-4 animate-in slide-in-from-right duration-300">
                                    <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
                                        <div className="flex items-center gap-3 mb-5">
                                            <div className="p-2.5 rounded-lg bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/30 dark:to-purple-900/30">
                                                <FileText size={22} className="text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t('dashboard.recentActivity')}</h3>
                                        </div>

                                        {auditLogs.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800 w-fit mx-auto mb-4">
                                                    <FileText size={40} className="text-slate-400" />
                                                </div>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('dashboard.noAuditLogs')}</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                {auditLogs.map((log, index) => (
                                                    <div
                                                        key={log.id}
                                                        className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all duration-200 group"
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                    >
                                                        <div className="flex items-start justify-between gap-3">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1.5">
                                                                    <div className="p-1.5 rounded-lg bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30">
                                                                        <Activity size={14} className="text-emerald-600 dark:text-emerald-400" />
                                                                    </div>
                                                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{log.action}</p>
                                                                </div>
                                                                <p className="text-xs text-slate-600 dark:text-slate-400 ml-8 font-medium">{log.details}</p>
                                                            </div>
                                                            <div className="text-right flex-shrink-0">
                                                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                                                    <Clock size={12} />
                                                                    <span className="font-medium">{new Date(log.createdAt).toLocaleDateString()}</span>
                                                                </div>
                                                                {log.user && (
                                                                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center gap-1 justify-end">
                                                                        <UsersIcon size={10} />
                                                                        <span className="font-medium">{log.user.name}</span>
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
                    </div>

                    {/* Enhanced Footer */}
                    <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 flex items-center justify-between rounded-b-3xl">
                        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                                <Info size={14} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <span className="font-medium">💡 {t('dashboard.changesApply')}</span>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="px-5 py-2.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-700 dark:text-slate-300 font-semibold"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 text-white font-bold hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-700 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={18} className="animate-spin" />
                                        {t('common.loading')}
                                    </>
                                ) : (
                                    <>
                                        <Save size={18} />
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
