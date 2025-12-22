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
            <div className="clinic-bg-gradient min-h-screen flex items-center justify-center p-6">
                <div className="glass-card p-12 text-center max-w-md w-full animate-scaleUp">
                    <div className="relative mb-8">
                        <div className="absolute inset-0 bg-purple-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                        <Loader2 size={64} className="animate-spin text-purple-600 mx-auto relative z-10" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-3">
                        Syncing Intelligence
                    </h2>
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Fetching real-time metrics from Smart Clinic...</p>
                    <div className="mt-8 flex gap-2 justify-center">
                        <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0s' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-500 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        <div className="w-2 h-2 rounded-full bg-purple-600 animate-bounce" style={{ animationDelay: '0.4s' }} />
                    </div>
                </div>
            </div>
        );
    }

    if (!clinic || !controls) {
        return (
            <div className="clinic-bg-gradient min-h-screen flex items-center justify-center p-6">
                <div className="glass-card p-12 text-center max-w-md w-full border-rose-500/20 shadow-rose-500/10">
                    <div className="w-20 h-20 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500 mx-auto mb-6">
                        <AlertTriangle size={48} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">Clinic Sync Error</h2>
                    <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                        We couldn't connect to this clinic's data node. Please verify the clinic ID or try again later.
                    </p>
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="w-full glass-button px-6 py-4 font-bold text-slate-700 dark:text-slate-200 flex items-center justify-center gap-3 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Command Center
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
        <div className="clinic-bg-gradient min-h-screen">
            <div className="max-w-7xl mx-auto p-6 animate-fadeIn">
                {/* Message Toast */}
                {message && (
                    <div className={`fixed top-6 right-6 z-50 px-8 py-5 rounded-2xl shadow-2xl flex items-center gap-4 animate-scaleUp ${message.type === 'success' ? 'glass-gradient-emerald text-emerald-900 dark:text-emerald-100' : 'glass-gradient-rose text-rose-900 dark:text-rose-100'
                        } border border-white/20 backdrop-blur-xl`}>
                        {message.type === 'success' ? <CheckCircle size={28} className="text-emerald-600" /> : <XCircle size={28} className="text-rose-600" />}
                        <span className="font-bold text-lg">{message.text}</span>
                    </div>
                )}

                {/* Header Section */}
                <div className="mb-8 flex flex-col gap-6">
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="glass-button w-fit flex items-center gap-2.5 px-6 py-3 text-sm font-bold text-slate-700 dark:text-slate-200 group"
                    >
                        <ArrowLeft size={20} className="group-hover:-translate-x-1.5 transition-transform" />
                        Command Center
                    </button>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 glass-card p-8 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 transition-opacity group-hover:opacity-100 opacity-50" />
                            <div className="relative z-10">
                                <div className="flex flex-wrap items-start justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl blur-xl opacity-40 group-hover:opacity-70 transition-opacity" />
                                            <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-2xl">
                                                <Building2 size={32} />
                                            </div>
                                        </div>
                                        <div>
                                            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent mb-1">{clinic.name}</h1>
                                            <p className="text-slate-600 dark:text-slate-400 font-medium tracking-tight">Enterprise Clinic Management Dashboard</p>
                                        </div>
                                    </div>
                                    <div className={`glass-badge flex items-center gap-3 px-6 py-3 text-sm font-black tracking-widest ${controls.locked
                                        ? 'glass-gradient-rose text-rose-700 dark:text-rose-300'
                                        : 'glass-gradient-emerald text-emerald-700 dark:text-emerald-300'
                                        } ${controls.locked ? 'animate-pulse' : ''}`}>
                                        {controls.locked ? <Lock size={18} /> : <Unlock size={18} />}
                                        {controls.locked ? 'LOCKED' : 'ACTIVE'}
                                    </div>
                                </div>

                                <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="glass-panel flex justify-between items-center px-6 py-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all border-none">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Clinic ID</span>
                                        <span className="font-mono text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded text-xs">{clinic.id.slice(0, 8)}…</span>
                                    </div>
                                    <div className="glass-panel flex justify-between items-center px-6 py-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all border-none">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Principal</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{clinic.doctorName || '—'}</span>
                                    </div>
                                    <div className="glass-panel flex justify-between items-center px-6 py-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all border-none">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Digital Address</span>
                                        <span className="text-slate-900 dark:text-white font-medium">{clinic.email}</span>
                                    </div>
                                    <div className="glass-panel flex justify-between items-center px-6 py-4 hover:bg-white/40 dark:hover:bg-slate-800/40 transition-all border-none">
                                        <span className="text-slate-500 font-bold text-xs uppercase tracking-widest">Protocol Version</span>
                                        <span className="text-slate-900 dark:text-white font-bold">{clinic.systemVersion || 'Not detected'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-8 flex flex-col justify-between group overflow-hidden relative">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl -mb-16 -mr-16 group-hover:opacity-100 opacity-50" />
                            <div className="relative z-10 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500">Live Telemetry</p>
                                        <p className="text-sm text-slate-900 dark:text-white font-black mt-1">Smart Clinic Node</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] uppercase font-bold text-slate-500 opacity-60">Sync state</p>
                                        <p className="text-xs font-black text-emerald-500 flex items-center gap-1 justify-end">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            STABLE
                                        </p>
                                    </div>
                                </div>
                                {usageMessage && (
                                    <div className="mb-6 glass-panel border-amber-500/20 bg-amber-500/5 px-4 py-3 text-xs text-amber-700 dark:text-amber-300 flex items-center gap-3 animate-pulse">
                                        <AlertTriangle size={18} className="shrink-0 text-amber-500" />
                                        <span className="font-medium">{usageMessage}</span>
                                    </div>
                                )}
                                <dl className="space-y-4 flex-1">
                                    {snapshotRows.map((row) => (
                                        <div key={row.label} className="flex items-center justify-between border-b border-white/10 dark:border-slate-800/50 pb-3 group/row">
                                            <dt className="text-slate-500 font-medium text-xs uppercase tracking-wider group-hover/row:text-slate-400 transition-colors">{row.label}</dt>
                                            <dd className="font-black text-slate-900 dark:text-white text-sm">{row.value}</dd>
                                        </div>
                                    ))}
                                </dl>
                                {controls.lockReason && (
                                    <div className="mt-4 pt-4 border-t border-rose-500/20 text-[10px] text-rose-500 flex items-center gap-2 font-bold uppercase tracking-widest animate-pulse">
                                        <Lock size={12} />
                                        {controls.lockReason}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Control Interface */}
                <div className="mb-6 glass-card p-3 shadow-2xl relative z-20">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center justify-center gap-3 rounded-xl px-4 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.id
                                        ? 'glass-gradient-purple text-purple-700 dark:text-purple-300 shadow-xl scale-[1.02] transform'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-800/50'
                                        }`}
                                >
                                    <Icon size={20} className={activeTab === tab.id ? 'animate-pulse' : ''} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Viewports */}
                <div className="space-y-6">
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {overviewMetrics.map((metric) => {
                                    const Icon = metric.icon;
                                    return (
                                        <div key={metric.id} className="glass-card p-8 group hover:scale-[1.03] transition-all duration-500 border-none shadow-xl">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className={`absolute inset-0 bg-gradient-to-br ${metric.id === 'storage' ? 'from-blue-500 to-cyan-500' : metric.id === 'users' ? 'from-emerald-500 to-teal-500' : 'from-purple-500 to-pink-500'} rounded-2xl blur-xl opacity-30 group-hover:opacity-60 transition-opacity`} />
                                                        <div className={`relative w-14 h-14 rounded-2xl bg-gradient-to-br ${metric.id === 'storage' ? 'from-blue-500 to-cyan-500' : metric.id === 'users' ? 'from-emerald-500 to-teal-500' : 'from-purple-500 to-pink-500'} flex items-center justify-center text-white shadow-2xl transform group-hover:rotate-6 transition-transform`}>
                                                            <Icon size={26} />
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">{metric.title}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`text-xl font-black ${metric.percentage && metric.percentage > 90 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                                                        {metric.percentage !== null ? `${metric.percentage.toFixed(0)}%` : '—'}
                                                    </span>
                                                </div>
                                            </div>
                                            <p className="text-3xl font-black bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent mb-1">
                                                {metric.value}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tighter mb-6">{metric.limit}</p>

                                            <div className="relative h-2.5 rounded-full bg-slate-200/50 dark:bg-slate-800/50 overflow-hidden mb-6">
                                                {metric.percentage !== null ? (
                                                    <div
                                                        className={`h-full rounded-full transition-all duration-1000 ease-out-expo ${getBarColor(metric.id, metric.percentage)} shadow-[0_0_12px_rgba(0,0,0,0.1)]`}
                                                        style={{ width: `${metric.percentage}%` }}
                                                    />
                                                ) : (
                                                    <div className="h-full rounded-full bg-slate-400/20 animate-pulse-soft" style={{ width: '10%' }} />
                                                )}
                                            </div>

                                            <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-slate-800/50">
                                                <span className="text-[10px] uppercase font-bold text-slate-500">{metric.footerLabel}</span>
                                                <span className="text-xs font-black text-slate-900 dark:text-white">{metric.footerValue}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="glass-card p-8 group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 rounded-full blur-2xl -mr-16 -mt-16 group-hover:opacity-100 opacity-30 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-4 mb-8">
                                            <div className="relative">
                                                <div className={`absolute inset-0 ${controls.locked ? 'bg-rose-500' : 'bg-emerald-500'} rounded-2xl blur-xl opacity-30`} />
                                                <div className={`relative w-16 h-16 rounded-2xl ${controls.locked ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} flex items-center justify-center text-white shadow-2xl`}>
                                                    {controls.locked ? <Lock size={28} /> : <Unlock size={28} />}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Node Status</p>
                                                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{controls.locked ? 'Access Suspended' : 'Access Fully Verified'}</h3>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="glass-panel p-5 border-none bg-white/30 dark:bg-slate-800/30">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Registration Status</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider italic">{formatStatus(clinic.status)}</p>
                                            </div>
                                            <div className="glass-panel p-5 border-none bg-white/30 dark:bg-slate-800/30">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Service Component</p>
                                                <p className="text-sm font-black text-slate-900 dark:text-white tracking-widest">{clinic.license?.plan?.name || 'GENERIC NODE'}</p>
                                            </div>
                                            <div className="glass-panel p-5 border-none bg-white/30 dark:bg-slate-800/30">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">License Authentication</p>
                                                <p className="font-mono text-[10px] text-slate-500 bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded inline-block">{clinic.license?.serial || 'UNREGISTERED'}</p>
                                            </div>
                                            <div className="glass-panel p-5 border-none bg-white/30 dark:bg-slate-800/30">
                                                <p className="text-[10px] uppercase font-bold text-slate-500 mb-2">Telemetry Uplink</p>
                                                <p className="text-sm font-black text-emerald-500">{lastSyncDisplay || 'SYNC PENDING'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card p-8 group relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl -ml-16 -mt-16 group-hover:opacity-100 opacity-30 transition-opacity" />
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-8">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className="absolute inset-0 bg-amber-500 rounded-2xl blur-xl opacity-30" />
                                                    <div className="relative w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-2xl">
                                                        <Zap size={28} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-500">Core Engine</p>
                                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Active Modules</h3>
                                                </div>
                                            </div>
                                            <span className="glass-badge glass-gradient-purple text-purple-700 dark:text-purple-300 font-black text-[10px] tracking-widest">VERIFIED</span>
                                        </div>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                                            {Object.entries(features).map(([key, enabled]) => {
                                                const typedKey = key as keyof FeatureToggles;
                                                return (
                                                    <div
                                                        key={key}
                                                        className={`glass-panel px-4 py-3 border-none flex items-center justify-between transition-all hover:translate-y-[-2px] group/feat ${enabled ? 'bg-emerald-500/10' : 'bg-slate-100/50 dark:bg-slate-800/30'}`}
                                                    >
                                                        <span className={`text-[11px] font-black uppercase tracking-tight ${enabled ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-400'}`}>{featureLabels[typedKey]}</span>
                                                        <div className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-slate-600'}`} />
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Limits Tab */}
                    {activeTab === 'limits' && (
                        <div className="glass-card p-8 animate-fadeIn">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent mb-6">Resource Limits & Quotas</h2>

                            <div className="space-y-8">
                                {/* Storage Limit */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <HardDrive size={16} className="text-purple-500" />
                                        Storage Limit (MB)
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={storageLimitInput}
                                            onChange={(e) => setStorageLimitInput(parseInt(e.target.value) || 0)}
                                            min="100"
                                            step="100"
                                            className="glass-input flex-1 px-6 py-4 text-lg font-semibold"
                                        />
                                        <div className="glass-panel px-4 py-3 text-sm">
                                            <div className="font-bold text-slate-900 dark:text-white">Current Usage:</div>
                                            <div className="text-slate-600 dark:text-slate-400">
                                                {storageUsed !== null ? `${storageUsed.toFixed(2)} MB` : 'Not reported yet'}
                                                {storagePercentage !== null ? ` (${storagePercentage.toFixed(1)}%)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">Maximum storage space allowed for this clinic</p>
                                </div>

                                {/* Users Limit */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <UsersIcon size={16} className="text-blue-500" />
                                        Users Limit
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={usersLimitInput}
                                            onChange={(e) => setUsersLimitInput(parseInt(e.target.value) || 0)}
                                            min="1"
                                            className="glass-input flex-1 px-6 py-4 text-lg font-semibold"
                                        />
                                        <div className="glass-panel px-4 py-3 text-sm">
                                            <div className="font-bold text-slate-900 dark:text-white">Active Users:</div>
                                            <div className="text-slate-600 dark:text-slate-400">
                                                {usersUsed !== null ? `${usersUsed} users` : 'Not reported yet'}
                                                {usersPercentage !== null ? ` (${usersPercentage.toFixed(1)}%)` : ''}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">Maximum number of active users allowed</p>
                                </div>

                                {/* Patients Limit */}
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                                        <TrendingUp size={16} className="text-emerald-500" />
                                        Patients Limit
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="number"
                                            value={patientsLimitInput}
                                            onChange={(e) => setPatientsLimitInput(e.target.value)}
                                            min="1"
                                            placeholder="Leave blank for unlimited"
                                            className="glass-input flex-1 px-6 py-4 text-lg font-semibold"
                                        />
                                        <div className="glass-panel px-4 py-3 text-sm">
                                            <div className="font-bold text-slate-900 dark:text-white">Current Limit:</div>
                                            <div className="text-slate-600 dark:text-slate-400">{patientsLimit !== null ? `${patientsLimit.toLocaleString()} patients` : 'Unlimited'}</div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 italic">
                                        Number of patients Smart Clinic may store before blocking new entries
                                    </p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
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
                        <div className="glass-card p-8 animate-fadeIn">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent mb-6">Feature Management</h2>

                            <div className="space-y-6">
                                {Object.entries(features).map(([key, enabled]) => (
                                    <div
                                        key={key}
                                        className="glass-panel p-6 flex items-center justify-between hover:scale-102 transition-all group"
                                    >
                                        <div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                                                {key}
                                                {enabled && <span className="glass-badge glass-gradient-emerald text-emerald-700 dark:text-emerald-300 text-xs">ACTIVE</span>}
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                {key === 'patients' && 'Patient records and management'}
                                                {key === 'appointments' && 'Appointment scheduling and calendar'}
                                                {key === 'orthodontics' && 'Orthodontics treatment tracking'}
                                                {key === 'xray' && 'X-ray imaging and analysis'}
                                                {key === 'ai' && 'AI-powered features and insights'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                            className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all duration-300 shadow-lg ${enabled ? 'bg-gradient-to-r from-emerald-500 to-teal-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <span
                                                className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-md transition-transform duration-300 ${enabled ? 'translate-x-11' : 'translate-x-1'
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
                                        className="px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold transition-all flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:transform-none"
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
                        <div className="glass-card p-8 animate-fadeIn">
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-purple-800 to-slate-900 dark:from-white dark:via-purple-300 dark:to-white bg-clip-text text-transparent mb-6">Security & Access Control</h2>

                            <div className="space-y-6">
                                {/* Lock Status */}
                                <div className={`glass-card p-8 border-2 transition-all duration-500 ${controls.locked
                                    ? 'border-rose-500/50 bg-rose-500/10'
                                    : 'border-emerald-500/50 bg-emerald-500/10'
                                    }`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div>
                                            <h3 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                                                {controls.locked ? <Lock size={28} className="text-rose-500" /> : <Unlock size={28} className="text-emerald-500" />}
                                                Clinic Access
                                            </h3>
                                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                                                {controls.locked
                                                    ? 'Clinic is currently locked. Users cannot access the system.'
                                                    : 'Clinic is active. All authorized users can access the system.'}
                                            </p>
                                        </div>
                                        <div className={`p-6 rounded-2xl ${controls.locked ? 'bg-gradient-to-br from-rose-500 to-pink-500' : 'bg-gradient-to-br from-emerald-500 to-teal-500'} text-white shadow-xl`}>
                                            {controls.locked ? <Lock size={40} /> : <Unlock size={40} />}
                                        </div>
                                    </div>

                                    {controls.lockReason && (
                                        <div className="mt-6 glass-panel p-5">
                                            <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-2">Lock Reason:</p>
                                            <p className="text-slate-800 dark:text-slate-200 font-medium">{controls.lockReason}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Lock/Unlock Button */}
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={() => setShowLockConfirm(true)}
                                        className={`px-10 py-5 rounded-2xl text-white font-bold transition-all flex items-center gap-3 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 ${controls.locked
                                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600'
                                            : 'bg-gradient-to-r from-rose-500 to-pink-600'
                                            }`}
                                    >
                                        {controls.locked ? (
                                            <>
                                                <Unlock size={24} />
                                                Unlock Clinic Access
                                            </>
                                        ) : (
                                            <>
                                                <Lock size={24} />
                                                Lock Clinic Access
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
            {
                showLockConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/40 backdrop-blur-md animate-fadeIn">
                        <div className="glass-card p-10 max-w-lg w-full shadow-2xl animate-scaleUp">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`p-4 rounded-xl ${controls.locked ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-lg`}>
                                    {controls.locked ? <Unlock size={32} /> : <Lock size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                                        {controls.locked ? 'Unlock Clinic' : 'Lock Clinic'}
                                    </h3>
                                    <p className="text-slate-600 dark:text-slate-400 font-medium">Action Confirmation</p>
                                </div>
                            </div>

                            <p className="text-lg text-slate-700 dark:text-slate-300 mb-8 leading-relaxed">
                                {controls.locked
                                    ? 'This will allow all authorized users to log in and use the clinic system again.'
                                    : 'This will immediately disconnect all active users and prevent anyone from logging into the clinic system.'}
                            </p>

                            {!controls.locked && (
                                <div className="mb-8">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 ml-1">
                                        Reason for Locking <span className="text-rose-500">*</span>
                                    </label>
                                    <textarea
                                        value={lockReason}
                                        onChange={(e) => setLockReason(e.target.value)}
                                        placeholder="Enter the reason for this action..."
                                        className="glass-input w-full p-6 h-32 resize-none text-base"
                                        required
                                    />
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowLockConfirm(false);
                                        setLockReason('');
                                    }}
                                    className="flex-1 glass-button px-6 py-4 font-bold text-slate-700 dark:text-slate-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleToggleLock}
                                    disabled={saving}
                                    className={`flex-1 px-6 py-4 rounded-xl font-bold text-white shadow-lg transition-all transform hover:-translate-y-1 ${controls.locked
                                        ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                                        : 'bg-gradient-to-r from-rose-500 to-pink-500'
                                        } disabled:opacity-50`}
                                >
                                    {saving ? <Loader2 className="animate-spin mx-auto" size={24} /> : (controls.locked ? 'Unlock Now' : 'Lock Now')}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ClinicControlPanel;
