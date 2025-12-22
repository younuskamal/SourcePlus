import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Clinic } from '../types';
import {
    ArrowLeft,
    Building2,
    HardDrive,
    Users as UsersIcon,
    Zap,
    Lock,
    Unlock,
    Save,
    Loader2,
    CheckCircle,
    XCircle,
    Clock,
    Shield,
    TrendingUp,
    Settings,
    AlertTriangle,
    Eye,
    EyeOff
} from 'lucide-react';

interface ControlsData {
    storageLimitMB: number;
    usersLimit: number;
    patientsLimit: number | null;
    features: FeatureToggles;
    locked: boolean;
    lockReason: string | null;
}

interface FeatureToggles {
    patients: boolean;
    appointments: boolean;
    orthodontics: boolean;
    xray: boolean;
    ai: boolean;
}

interface UsageData {
    storageUsedMB: number;
    storageLimitMB: number;
    usersUsed: number;
    usersLimit: number;
    patientsUsed: number | null;
    patientsLimit: number | null;
    filesCount: number;
    locked: boolean;
    lockReason: string | null;
    lastSyncAt: string | null;
}

type TabType = 'overview' | 'limits' | 'features' | 'security';

const ClinicControlPanel: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [clinic, setClinic] = useState<Clinic | null>(null);
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLockConfirm, setShowLockConfirm] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [usageMessage, setUsageMessage] = useState<string | null>(null);

    // Form state
    const [storageLimitInput, setStorageLimitInput] = useState(1024);
    const [usersLimitInput, setUsersLimitInput] = useState(3);
    const [patientsLimitInput, setPatientsLimitInput] = useState<string>('');
    const [features, setFeatures] = useState<FeatureToggles>({
        patients: true,
        appointments: true,
        orthodontics: false,
        xray: false,
        ai: false
    });

    useEffect(() => {
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;

        try {
            setLoading(true);
            setUsageMessage(null);

            const [clinicData, controlsData] = await Promise.all([
                api.getClinic(id),
                api.getClinicControls(id)
            ]);

            let usageData: UsageData | null = null;
            try {
                usageData = await api.getClinicUsage(id);
                setUsageMessage(null);
            } catch (usageError: any) {
                if (usageError?.response?.status === 404) {
                    setUsageMessage('Usage data has not been reported yet from this clinic.');
                } else {
                    console.error('Failed to load usage data:', usageError);
                    setUsageMessage('Unable to load usage data right now.');
                    showMessage('error', `Failed to load usage data: ${usageError.response?.data?.message || usageError.message}`);
                }
            }

            setClinic(clinicData);
            setControls(controlsData);
            setUsage(usageData);

            // Update form state
            setStorageLimitInput(controlsData.storageLimitMB);
            setUsersLimitInput(controlsData.usersLimit);
            setPatientsLimitInput(controlsData.patientsLimit !== null ? controlsData.patientsLimit.toString() : '');
            setFeatures(controlsData.features);
            setLockReason(controlsData.lockReason || '');
        } catch (error: any) {
            console.error('❌ Failed to load data:', error);
            showMessage('error', `Failed to load clinic data: ${error.response?.data?.message || error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveControls = async () => {
        if (!id) return;

        const trimmed = patientsLimitInput.trim();
        const patientsLimitValue = trimmed === '' ? null : Number(trimmed);
        if (patientsLimitValue !== null && (!Number.isFinite(patientsLimitValue) || patientsLimitValue <= 0)) {
            showMessage('error', 'Patients limit must be a positive number or left blank for unlimited');
            return;
        }

        const storageLimitValue = Number(storageLimitInput);
        const usersLimitValue = Number(usersLimitInput);
        if (!Number.isFinite(storageLimitValue) || storageLimitValue <= 0) {
            showMessage('error', 'Storage limit must be a positive number');
            return;
        }
        if (!Number.isFinite(usersLimitValue) || usersLimitValue <= 0) {
            showMessage('error', 'Users limit must be a positive number');
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(id, {
                storageLimitMB: storageLimitValue,
                usersLimit: usersLimitValue,
                patientsLimit: patientsLimitValue,
                features
            });

            await loadData();
            showMessage('success', 'Controls updated successfully');
        } catch (error: any) {
            console.error('Failed to update controls:', error);
            showMessage('error', `Failed to update: ${error.response?.data?.message || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async () => {
        if (!id || !controls) return;

        if (!controls.locked && !lockReason.trim()) {
            showMessage('error', 'Please provide a lock reason');
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(id, {
                locked: !controls.locked,
                lockReason: !controls.locked ? lockReason : null
            });

            await loadData();
            showMessage('success', controls.locked ? 'Clinic unlocked' : 'Clinic locked');
            setShowLockConfirm(false);
            setLockReason('');
        } catch (error: any) {
            console.error('Failed to toggle lock:', error);
            showMessage('error', `Failed: ${error.response?.data?.message || error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center text-slate-600 dark:text-slate-300">
                    <Loader2 size={48} className="animate-spin mx-auto mb-4" />
                    <p className="text-lg font-medium">Loading clinic data…</p>
                </div>
            </div>
        );
    }

    if (!clinic || !controls) {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center">
                <div className="text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 shadow-lg">
                    <AlertTriangle size={48} className="text-amber-500 mx-auto mb-4" />
                    <p className="text-slate-900 dark:text-white text-xl font-bold mb-3">Clinic data not available</p>
                    <p className="text-slate-600 dark:text-slate-400 mb-6">Try refreshing or select another clinic.</p>
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-medium transition-colors"
                    >
                        Back to Clinics
                    </button>
                </div>
            </div>
        );
    }

    const storageLimit = usage?.storageLimitMB ?? controls.storageLimitMB ?? storageLimitInput;
    const storageUsed = usage?.storageUsedMB ?? null;
    const usersLimit = usage?.usersLimit ?? controls.usersLimit ?? usersLimitInput;
    const usersUsed = usage?.usersUsed ?? null;
    const patientsLimit = controls.patientsLimit ?? null;
    const patientsUsed = usage?.patientsUsed ?? null;
    const humanPatientsLimit = patientsLimit !== null ? patientsLimit.toLocaleString() : 'Unlimited';
    const availableSeats = usersUsed !== null && usersLimit
        ? Math.max(usersLimit - usersUsed, 0)
        : null;
    const storagePercentage = storageUsed !== null && storageLimit
        ? Math.min((storageUsed / storageLimit) * 100, 100)
        : null;
    const usersPercentage = usersUsed !== null && usersLimit
        ? Math.min((usersUsed / usersLimit) * 100, 100)
        : null;
    const filesStored = usage?.filesCount ?? null;
    const patientsPercentage = patientsUsed !== null && patientsLimit !== null
        ? Math.min((patientsUsed / patientsLimit) * 100, 100)
        : null;
    const lastSyncDisplay = usage?.lastSyncAt ? new Date(usage.lastSyncAt).toLocaleString() : null;
    const metricIconStyles: Record<string, { bg: string; icon: string }> = {
        storage: { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-600 dark:text-slate-300' },
        users: { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-600 dark:text-slate-300' },
        patients: { bg: 'bg-slate-100 dark:bg-slate-800', icon: 'text-slate-600 dark:text-slate-300' }
    };
    const getBarColor = (metricId: string, percentage: number) => {
        if (metricId === 'users') {
            if (percentage >= 100) return 'bg-rose-500';
            if (percentage > 80) return 'bg-amber-500';
            return 'bg-emerald-500';
        }
        if (metricId === 'storage') {
            if (percentage > 90) return 'bg-rose-500';
            if (percentage > 70) return 'bg-amber-500';
            return 'bg-slate-900 dark:bg-white';
        }
        if (metricId === 'patients') {
            if (percentage >= 100) return 'bg-rose-500';
            if (percentage > 75) return 'bg-amber-500';
            return 'bg-indigo-500';
        }
        return 'bg-slate-900';
    };
    const overviewMetrics = [
        {
            id: 'storage',
            title: 'Storage',
            value: storageUsed !== null ? `${storageUsed.toFixed(2)} MB` : 'Not reported yet',
            limit: storageLimit ? `${storageLimit} MB total` : 'No limit configured',
            percentage: storagePercentage,
            footerLabel: 'Files stored',
            footerValue: filesStored !== null ? filesStored.toLocaleString() : '—',
            icon: HardDrive,
            accent: 'storage'
        },
        {
            id: 'users',
            title: 'Active Users',
            value: usersUsed !== null ? usersUsed.toLocaleString() : 'Not reported yet',
            limit: usersLimit ? `of ${usersLimit} users` : 'No limit configured',
            percentage: usersPercentage,
            footerLabel: 'Available seats',
            footerValue: availableSeats !== null ? availableSeats.toLocaleString() : '—',
            icon: UsersIcon,
            accent: 'users'
        },
        {
            id: 'patients',
            title: 'Patients',
            value: patientsUsed !== null
                ? `${patientsUsed.toLocaleString()} / ${humanPatientsLimit}`
                : humanPatientsLimit,
            limit: patientsUsed !== null ? 'Reported from Smart Clinic' : (patientsLimit !== null ? 'Maximum enforced limit' : 'No limit enforced'),
            percentage: patientsPercentage,
            footerLabel: 'Limit source',
            footerValue: patientsLimit !== null ? 'SourcePlus' : 'Unlimited',
            icon: TrendingUp,
            accent: 'patients'
        }
    ];
    const snapshotRows = [
        {
            label: 'Storage',
            value: storageUsed !== null && storageLimit
                ? `${storageUsed.toFixed(2)} MB / ${storageLimit} MB`
                : 'Usage not reported yet'
        },
        {
            label: 'Active Users',
            value: usersUsed !== null && usersLimit
                ? `${usersUsed} / ${usersLimit}`
                : 'Usage not reported yet'
        },
        {
            label: 'Patients',
            value: patientsUsed !== null
                ? `${patientsUsed.toLocaleString()} / ${humanPatientsLimit}`
                : 'Usage not reported yet'
        },
        {
            label: 'Files Stored',
            value: filesStored !== null ? filesStored.toLocaleString() : '—'
        }
    ];

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: Eye },
        { id: 'limits' as TabType, label: 'Limits & Quotas', icon: TrendingUp },
        { id: 'features' as TabType, label: 'Features', icon: Zap },
        { id: 'security' as TabType, label: 'Security', icon: Shield }
    ];

    const featureLabels: Record<keyof FeatureToggles, string> = {
        patients: 'Patients',
        appointments: 'Appointments',
        orthodontics: 'Orthodontics',
        xray: 'X-Ray',
        ai: 'AI Assistant'
    };

    const formatStatus = (value: string) => value
        .replace(/_/g, ' ')
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto p-6">
                {/* Message Toast */}
                {message && (
                    <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slideDown ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                        } text-white`}>
                        {message.type === 'success' ? <CheckCircle size={24} /> : <XCircle size={24} />}
                        <span className="font-medium">{message.text}</span>
                    </div>
                )}

                {/* Header */}
                <div className="mb-6 space-y-4">
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                        <ArrowLeft size={18} />
                        Back to Clinics
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                                        <Settings size={24} />
                                    </div>
                                    <div>
                                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{clinic.name}</h1>
                                        <p className="text-sm text-slate-500">Control panel with verified usage metrics</p>
                                    </div>
                                </div>
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold border ${controls.locked
                                        ? 'border-rose-200 text-rose-700 bg-rose-50 dark:border-rose-800 dark:text-rose-300 dark:bg-rose-950/30'
                                        : 'border-emerald-200 text-emerald-700 bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:bg-emerald-950/30'
                                    }`}>
                                    {controls.locked ? <Lock size={16} /> : <Unlock size={16} />}
                                    {controls.locked ? 'Locked' : 'Active'}
                                </div>
                            </div>

                            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                <div className="flex justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                                    <span className="text-slate-500">Clinic ID</span>
                                    <span className="font-mono text-slate-900 dark:text-white">{clinic.id.slice(0, 8)}…</span>
                                </div>
                                <div className="flex justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                                    <span className="text-slate-500">Doctor</span>
                                    <span className="text-slate-900 dark:text-white">{clinic.doctorName || '—'}</span>
                                </div>
                                <div className="flex justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                                    <span className="text-slate-500">Email</span>
                                    <span className="text-slate-900 dark:text-white">{clinic.email}</span>
                                </div>
                                <div className="flex justify-between rounded-xl border border-slate-100 dark:border-slate-800 px-4 py-3">
                                    <span className="text-slate-500">System Version</span>
                                    <span className="text-slate-900 dark:text-white">{clinic.systemVersion || 'Not provided'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <p className="text-xs uppercase tracking-wider text-slate-500">Live Usage Snapshot</p>
                                    <p className="text-sm text-slate-900 dark:text-white font-semibold">Real numbers from Smart Clinic</p>
                                </div>
                                <div className="text-right text-xs text-slate-500">
                                    <p>Last sync</p>
                                    <p className="font-medium">
                                        {lastSyncDisplay || 'Not reported yet'}
                                    </p>
                                </div>
                            </div>
                            {usageMessage && (
                                <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50/60 dark:border-amber-800 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                                    {usageMessage}
                                </div>
                            )}
                            <dl className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                {snapshotRows.map((row) => (
                                    <div key={row.label} className="flex items-center justify-between">
                                        <dt>{row.label}</dt>
                                        <dd className="font-semibold text-slate-900 dark:text-white">{row.value}</dd>
                                    </div>
                                ))}
                                {controls.lockReason && (
                                    <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-rose-500">
                                        {controls.lockReason}
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold border transition-colors ${activeTab === tab.id
                                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-900 dark:border-white'
                                            : 'text-slate-500 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <Icon size={20} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Content */}
                <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {overviewMetrics.map((metric) => {
                                    const Icon = metric.icon;
                                    const iconStyle = metricIconStyles[metric.accent] || metricIconStyles.storage;
                                    return (
                                        <div key={metric.id} className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                            <div className="flex items-center justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${iconStyle.bg}`}>
                                                        <Icon size={20} className={iconStyle.icon} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs uppercase tracking-wide text-slate-500">{metric.title}</p>
                                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{metric.title}</h3>
                                                    </div>
                                                </div>
                                                <span className="text-sm font-semibold text-slate-500">
                                                    {metric.percentage !== null ? `${metric.percentage.toFixed(1)}%` : '—'}
                                                </span>
                                            </div>
                                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                                {metric.value}
                                            </p>
                                            <p className="text-sm text-slate-500">{metric.limit}</p>
                                            <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                                                {metric.percentage !== null ? (
                                                    <div
                                                        className={`h-full rounded-full transition-all ${getBarColor(metric.id, metric.percentage)}`}
                                                        style={{ width: `${metric.percentage}%` }}
                                                    />
                                                ) : (
                                                    <div className="h-full rounded-full bg-slate-300/70 dark:bg-slate-700/70" style={{ width: '8%' }} />
                                                )}
                                            </div>
                                            <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                                                <span>{metric.footerLabel}</span>
                                                <span className="font-semibold text-slate-900 dark:text-white">{metric.footerValue}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                                <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            {controls.locked ? <Lock size={20} className="text-rose-500" /> : <Unlock size={20} className="text-emerald-500" />}
                                        </div>
                                        <div>
                                            <p className="text-xs uppercase tracking-wide text-slate-500">Status</p>
                                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{controls.locked ? 'Access locked' : 'Access available'}</h3>
                                        </div>
                                    </div>
                                    <ul className="space-y-3 text-sm text-slate-600 dark:text-slate-300">
                                        <li className="flex justify-between">
                                            <span>Registration state</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{formatStatus(clinic.status)}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Plan</span>
                                            <span className="font-semibold text-slate-900 dark:text-white">{clinic.license?.plan?.name || 'Not assigned'}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>License serial</span>
                                            <span className="font-mono text-xs text-slate-500">{clinic.license?.serial?.slice(0, 10) || '—'}{clinic.license?.serial ? '…' : ''}</span>
                                        </li>
                                        <li className="flex justify-between">
                                            <span>Last data sync</span>
                                            <span className="text-slate-900 dark:text-white">{lastSyncDisplay || 'Not reported yet'}</span>
                                        </li>
                                    </ul>
                                    <p className="mt-4 text-xs text-slate-500">Data source: live users + stored files counts</p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Zap size={18} className="text-amber-500" />
                                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Enabled Features</h3>
                                    </div>
                                    <span className="text-xs text-slate-500">Reflects saved controls</span>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                                    {Object.entries(features).map(([key, enabled]) => {
                                        const typedKey = key as keyof FeatureToggles;
                                        return (
                                            <div
                                                key={key}
                                                className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between text-sm"
                                            >
                                                <span className="font-medium text-slate-900 dark:text-white">{featureLabels[typedKey]}</span>
                                                <span className={`inline-flex items-center gap-1 text-xs font-semibold ${enabled ? 'text-emerald-600' : 'text-slate-400'
                                                    }`}>
                                                    {enabled ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                    {enabled ? 'Enabled' : 'Disabled'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Limits Tab */}
                    {activeTab === 'limits' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Resource Limits & Quotas</h2>

                            <div className="space-y-8">
                                {/* Storage Limit */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        Storage Limit (MB)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={storageLimitInput}
                                            onChange={(e) => setStorageLimitInput(parseInt(e.target.value) || 0)}
                                            min="100"
                                            step="100"
                                            className="flex-1 px-6 py-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent dark:bg-slate-800 dark:text-white"
                                        />
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold">Current Usage:</div>
                                            <div>
                                                {storageUsed !== null ? `${storageUsed.toFixed(2)} MB` : 'Not reported yet'}
                                                {storagePercentage !== null ? ` (${storagePercentage.toFixed(1)}%)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">Maximum storage space allowed for this clinic</p>
                                </div>

                                {/* Users Limit */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        Users Limit
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={usersLimitInput}
                                            onChange={(e) => setUsersLimitInput(parseInt(e.target.value) || 0)}
                                            min="1"
                                            className="flex-1 px-6 py-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent dark:bg-slate-800 dark:text-white"
                                        />
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold">Active Users:</div>
                                            <div>
                                                {usersUsed !== null ? `${usersUsed} users` : 'Not reported yet'}
                                                {usersPercentage !== null ? ` (${usersPercentage.toFixed(1)}%)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">Maximum number of active users allowed</p>
                                </div>

                                {/* Patients Limit */}
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                                        Patients Limit
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={patientsLimitInput}
                                            onChange={(e) => setPatientsLimitInput(e.target.value)}
                                            min="1"
                                            placeholder="Leave blank for unlimited"
                                            className="flex-1 px-6 py-4 text-lg border border-slate-300 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-slate-900 dark:focus:ring-white focus:border-transparent dark:bg-slate-800 dark:text-white"
                                        />
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold">Current Limit:</div>
                                            <div>{patientsLimit !== null ? `${patientsLimit.toLocaleString()} patients` : 'Unlimited'}</div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">
                                        Number of patients Smart Clinic may store before blocking new entries
                                    </p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-sm disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features Tab */}
                    {activeTab === 'features' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Feature Management</h2>

                            <div className="space-y-6">
                                {Object.entries(features).map(([key, enabled]) => (
                                    <div
                                        key={key}
                                        className="flex items-center justify-between p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 transition-all"
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                                                {key}
                                            </h3>
                                            <p className="text-sm text-slate-500 mt-1">
                                                {key === 'patients' && 'Patient records and management'}
                                                {key === 'appointments' && 'Appointment scheduling and calendar'}
                                                {key === 'orthodontics' && 'Orthodontics treatment tracking'}
                                                {key === 'xray' && 'X-ray imaging and analysis'}
                                                {key === 'ai' && 'AI-powered features and insights'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                            className={`relative inline-flex h-8 w-16 items-center rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-9' : 'translate-x-1'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold transition-all flex items-center gap-3 shadow-sm disabled:opacity-50"
                                    >
                                        {saving ? (
                                            <>
                                                <Loader2 className="animate-spin" size={20} />
                                                Saving...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={20} />
                                                Save Changes
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Security Tab */}
                    {activeTab === 'security' && (
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Security & Access Control</h2>

                            <div className="space-y-6">
                                {/* Lock Status */}
                                <div className={`p-6 rounded-xl border-2 ${controls.locked
                                        ? 'border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20'
                                        : 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                                    }`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Clinic Access</h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                                {controls.locked
                                                    ? 'Clinic is currently locked. Users cannot access the system.'
                                                    : 'Clinic is active. All authorized users can access the system.'}
                                            </p>
                                        </div>
                                        <div className={`p-4 rounded-xl ${controls.locked ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                                            {controls.locked ? <Lock size={32} /> : <Unlock size={32} />}
                                        </div>
                                    </div>

                                    {controls.lockReason && (
                                        <div className="mt-4 p-4 bg-white dark:bg-slate-800 rounded-lg">
                                            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">Lock Reason:</p>
                                            <p className="text-slate-600 dark:text-slate-400">{controls.lockReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Lock/Unlock Button */}
                                <div className="flex justify-center">
                                    <button
                                        onClick={() => setShowLockConfirm(true)}
                                        className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3 shadow-sm text-white ${controls.locked
                                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                                : 'bg-rose-600 hover:bg-rose-700'
                                            }`}
                                    >
                                        {controls.locked ? (
                                            <>
                                                <Unlock size={24} />
                                                Unlock Clinic
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={24} />
                                                Lock Clinic
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-4 mb-4">
                            <AlertTriangle className="text-amber-500" size={32} />
                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {controls.locked ? 'Unlock Clinic' : 'Lock Clinic'}
                            </h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            {controls.locked
                                ? 'This will allow the clinic to access their system again.'
                                : 'This will prevent all users from accessing the clinic system.'}
                        </p>

                        {!controls.locked && (
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    Lock Reason <span className="text-rose-500">*</span>
                                </label>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white resize-none"
                                    rows={4}
                                    placeholder="e.g., Payment overdue, Subscription expired, Policy violation..."
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLockConfirm(false)}
                                className="flex-1 px-6 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-all font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleLock}
                                disabled={saving || (!controls.locked && !lockReason.trim())}
                                className={`flex-1 px-6 py-3 rounded-xl text-white transition-all font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${controls.locked
                                        ? 'bg-emerald-500 hover:bg-emerald-600'
                                        : 'bg-rose-500 hover:bg-rose-600'
                                    }`}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        {controls.locked ? <Unlock size={20} /> : <Lock size={20} />}
                                        {controls.locked ? 'Unlock' : 'Lock'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicControlPanel;
