
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, SubscriptionPlan, AuditLog, User } from '../types';
import { useTranslation } from '../hooks/useTranslation';
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
    Shield,
    TrendingUp,
    Settings,
    AlertTriangle,
    Mail,
    CreditCard,
    Calendar,
    Clock,
    Activity,
    FileText,
    History,
    MoreVertical,
    RefreshCw,
    Database,
    ShieldCheck,
    Cpu,
    Smartphone
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

interface Props {
    clinicId: string;
    setPage: (page: string) => void;
}

type TabType = 'overview' | 'limits' | 'features' | 'subscription' | 'security' | 'audit';

const ClinicControlPanel: React.FC<Props> = ({ clinicId, setPage }) => {
    const { t } = useTranslation();

    const [clinic, setClinic] = useState<Clinic | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    // Data States
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLockConfirm, setShowLockConfirm] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form States
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

    // Subscription Form
    const [selectedPlanId, setSelectedPlanId] = useState<string>('');
    const [subDuration, setSubDuration] = useState<number>(12);

    useEffect(() => {
        if (clinicId) {
            loadData();
        }
    }, [clinicId]);

    const loadData = async () => {
        if (!clinicId) return;
        try {
            setLoading(true);
            const [clinicData, controlsData, plansData] = await Promise.all([
                api.getClinic(clinicId),
                api.getClinicControls(clinicId),
                api.getPlans()
            ]);

            let usageData: UsageData | null = null;
            try {
                usageData = await api.getClinicUsage(clinicId);
            } catch (e) {
                // Ignore usage error
            }

            setClinic(clinicData);
            setControls(controlsData);
            setUsage(usageData);
            setPlans(plansData);

            // Init form
            setStorageLimitInput(controlsData.storageLimitMB);
            setUsersLimitInput(controlsData.usersLimit);
            setPatientsLimitInput(controlsData.patientsLimit !== null ? controlsData.patientsLimit.toString() : '');
            setFeatures(controlsData.features);
            setLockReason(controlsData.lockReason || '');

            if (clinicData.license?.planId) {
                setSelectedPlanId(clinicData.license.planId);
            }

            // Load audit logs if likely available
            try {
                const logs = await api.getAuditLogs();
                // Filter logs for this clinic if user exists
                setAuditLogs(logs.slice(0, 20)); // Just recent for now
            } catch (e) { }

        } catch (error: any) {
            console.error('Failed to load data:', error);
            showMessage('error', `Failed to load data: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    const handleSaveControls = async () => {
        if (!clinicId) return;
        try {
            setSaving(true);
            const patientsLimitValue = patientsLimitInput.trim() === '' ? null : Number(patientsLimitInput.trim());

            await api.updateClinicControls(clinicId, {
                storageLimitMB: Number(storageLimitInput),
                usersLimit: Number(usersLimitInput),
                patientsLimit: patientsLimitValue,
                features
            });

            await loadData();
            showMessage('success', t('controls.controlsUpdated'));
        } catch (error: any) {
            showMessage('error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateSubscription = async () => {
        if (!clinicId || !selectedPlanId) return;
        try {
            setSaving(true);
            await api.assignClinicLicense(clinicId, {
                planId: selectedPlanId,
                durationMonths: subDuration,
                activateClinic: true
            });
            await loadData();
            showMessage('success', 'Subscription updated successfully');
        } catch (error: any) {
            showMessage('error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async () => {
        if (!clinicId || !controls) return;
        try {
            setSaving(true);
            await api.updateClinicControls(clinicId, {
                locked: !controls.locked,
                lockReason: !controls.locked ? lockReason : null
            });
            await loadData();
            showMessage('success', controls.locked ? 'Clinic Unlocked' : 'Clinic Locked');
            setShowLockConfirm(false);
        } catch (error: any) {
            showMessage('error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const formatSize = (mb: number) => {
        if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
        return `${mb} MB`;
    };

    const healthScore = useMemo(() => {
        if (!usage) return 0;
        let score = 100;
        if ((usage.storageUsedMB / usage.storageLimitMB) > 0.9) score -= 30;
        if ((usage.usersUsed / usage.usersLimit) >= 1) score -= 20;
        if (usage.locked) score = 0;
        return score;
    }, [usage]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <RefreshCw className="animate-spin text-emerald-600 mb-4" size={48} />
            <p className="text-slate-500 font-bold tracking-widest uppercase">Initializing Command Center...</p>
        </div>
    );

    if (!clinic || !controls) return null;

    const featureLabels: Record<string, string> = {
        patients: t('features.patients'),
        appointments: t('features.appointments'),
        orthodontics: t('features.orthodontics'),
        xray: t('features.xray'),
        ai: t('features.ai')
    };

    return (
        <div className="max-w-[1600px] mx-auto flex flex-col h-full bg-slate-50 dark:bg-slate-900/50 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-2xl">
            {/* Header / Info Bar */}
            <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => setPage('manage-clinics')}
                        className="p-3 bg-slate-100 dark:bg-slate-700/50 rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                {clinic.name}
                            </h1>
                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${clinic.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'
                                }`}>
                                {clinic.status}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-xs text-slate-500 font-bold uppercase tracking-wide">
                            <span className="flex items-center gap-1.5"><Mail size={12} className="text-emerald-500" /> {clinic.email}</span>
                            <span className="flex items-center gap-1.5"><Database size={12} className="text-blue-500" /> NODE ID: {clinic.id.slice(0, 8)}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] uppercase font-black text-slate-400">Node Connectivity</p>
                        <p className="text-sm font-bold text-emerald-500 flex items-center justify-end gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            ACTIVE SYNC
                        </p>
                    </div>
                    <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 mx-2 hidden sm:block"></div>
                    <button
                        onClick={loadData}
                        className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Slim Sidebar */}
                <div className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 p-4 space-y-1 overflow-y-auto">
                    {[
                        { id: 'overview', label: 'Overview', icon: Zap },
                        { id: 'subscription', label: 'Licensing', icon: CreditCard },
                        { id: 'limits', label: 'Resources', icon: HardDrive },
                        { id: 'features', label: 'Modules', icon: Settings },
                        { id: 'security', label: 'Access Control', icon: Shield },
                        { id: 'audit', label: 'Audit Logs', icon: History }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-sm font-black uppercase tracking-wider transition-all ${activeTab === tab.id
                                    ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/20 translate-x-1'
                                    : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
                                }`}
                        >
                            <tab.icon size={18} />
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 bg-slate-50/50 dark:bg-slate-900 p-8 overflow-y-auto">
                    {activeTab === 'overview' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-emerald-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Health Status</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{healthScore}%</h3>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs font-bold text-emerald-500">Node Optimized</span>
                                        <Cpu size={16} className="text-emerald-500" />
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                                        <div className="h-full bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${healthScore}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">Storage Usage</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{formatSize(usage?.storageUsedMB || 0)}</h3>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 text-opacity-70">of {formatSize(usage?.storageLimitMB || controls.storageLimitMB)} Allocated</span>
                                        <Database size={16} className="text-blue-500" />
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(((usage?.storageUsedMB || 0) / (usage?.storageLimitMB || controls.storageLimitMB || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-500/5 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mb-1">User Seats</p>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white">{usage?.usersUsed || 0} / {usage?.usersLimit || controls.usersLimit}</h3>
                                    <div className="mt-3 flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500 text-opacity-70">{usage?.remainingSlots || (controls.usersLimit - (usage?.usersUsed || 0))} Slots Remaining</span>
                                        <Smartphone size={16} className="text-purple-500" />
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full mt-4">
                                        <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(((usage?.usersUsed || 0) / (usage?.usersLimit || controls.usersLimit || 1)) * 100, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-8">
                                <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Activity size={18} className="text-emerald-500" /> Detailed Specifications
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Principal Owner</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{clinic.doctorName || 'Not Set'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">System Binary</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">v{clinic.systemVersion || 'Unknown'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Subscription Cycle</p>
                                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{clinic.license?.plan?.name || 'Manual Assignment'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Creation Origin</p>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white">{new Date(clinic.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'subscription' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm">
                                <h2 className="text-xl font-black uppercase text-slate-900 dark:text-white mb-2">License Provisioning</h2>
                                <p className="text-slate-500 text-sm font-bold mb-8">Upgrade or extend the service contract for this node.</p>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Target Service Plan</label>
                                            <select
                                                value={selectedPlanId}
                                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                                className="w-full bg-slate-50 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 text-lg font-black outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
                                            >
                                                <option value="">Select Plan...</option>
                                                {plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Term Duration</label>
                                            <div className="flex gap-4">
                                                {[3, 6, 12, 24].map(m => (
                                                    <button
                                                        key={m}
                                                        onClick={() => setSubDuration(m)}
                                                        className={`flex-1 p-4 rounded-xl font-black text-sm transition-all border ${subDuration === m
                                                                ? 'bg-emerald-600 text-white border-emerald-600'
                                                                : 'bg-white dark:bg-slate-900 text-slate-500 border-slate-200 dark:border-slate-800'
                                                            }`}
                                                    >
                                                        {m} MO
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-2xl flex flex-col justify-center items-center text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                                            <CreditCard size={32} />
                                        </div>
                                        <h4 className="text-sm font-black uppercase text-slate-900 dark:text-white">Active License Found</h4>
                                        <p className="text-xs text-slate-500 font-bold mt-1">Exp: {clinic.license?.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : 'N/A'}</p>

                                        <button
                                            onClick={handleUpdateSubscription}
                                            disabled={saving || !selectedPlanId}
                                            className="w-full mt-6 py-4 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-xs hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                                        >
                                            {saving ? 'Processing...' : 'Provision Subscription'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'limits' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-8 shadow-sm space-y-10">
                                <div className="space-y-4">
                                    <div className="flex justify-between font-black uppercase text-[10px] text-slate-500">
                                        <span className="flex items-center gap-2"><Database size={14} className="text-blue-500" /> Data Storage Allocation</span>
                                        <span className="text-slate-900 dark:text-white text-sm">{formatSize(storageLimitInput)}</span>
                                    </div>
                                    <input
                                        type="range" min="1024" max="102400" step="1024"
                                        value={storageLimitInput}
                                        onChange={(e) => setStorageLimitInput(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-blue-600 cursor-pointer"
                                    />
                                    <p className="text-[10px] text-slate-400 font-bold">Minimum: 1GB | Premium: 100GB+</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between font-black uppercase text-[10px] text-slate-500">
                                        <span className="flex items-center gap-2"><UsersIcon size={14} className="text-purple-500" /> Concurrency (Max Seats)</span>
                                        <span className="text-slate-900 dark:text-white text-sm">{usersLimitInput} USERS</span>
                                    </div>
                                    <input
                                        type="range" min="1" max="100" step="1"
                                        value={usersLimitInput}
                                        onChange={(e) => setUsersLimitInput(Number(e.target.value))}
                                        className="w-full h-2 bg-slate-100 rounded-full appearance-none accent-purple-600 cursor-pointer"
                                    />
                                    <div className="flex gap-2">
                                        {[5, 10, 25, 50, 100].map(v => (
                                            <button key={v} onClick={() => setUsersLimitInput(v)} className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500">{v}</button>
                                        ))}
                                    </div>
                                </div>

                                <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs flex items-center gap-2"
                                    >
                                        <Save size={16} /> Save Resource configuration
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'features' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-bottom-4">
                            {Object.entries(features).map(([key, enabled]) => (
                                <div
                                    key={key}
                                    onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                    className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between group ${enabled ? 'bg-white dark:bg-slate-800 border-emerald-500 shadow-xl shadow-emerald-500/5' : 'bg-slate-50 dark:bg-slate-900/50 border-transparent hover:border-slate-300'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                            <Settings size={20} />
                                        </div>
                                        <div>
                                            <h4 className={`text-sm font-black uppercase tracking-tight ${enabled ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>{featureLabels[key] || key}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{enabled ? 'Licensed' : 'Restricted'}</p>
                                        </div>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full relative transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${enabled ? 'right-1' : 'left-1'}`}></div>
                                    </div>
                                </div>
                            ))}
                            <div className="col-span-full pt-4 flex justify-end">
                                <button onClick={handleSaveControls} className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-xs">Commit Changes</button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className={`p-10 rounded-3xl border-2 transition-all flex flex-col items-center text-center ${controls.locked ? 'bg-rose-50 border-rose-200' : 'bg-white dark:bg-slate-800 border-emerald-100 dark:border-emerald-900/30'}`}>
                                <div className={`w-28 h-28 rounded-full flex items-center justify-center mb-6 shadow-2xl ${controls.locked ? 'bg-rose-600 text-white shadow-rose-600/20' : 'bg-emerald-600 text-white shadow-emerald-600/20'}`}>
                                    {controls.locked ? <Lock size={48} /> : <Unlock size={48} />}
                                </div>
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">
                                    {controls.locked ? 'Network Access Revoked' : 'Operational Status: Secure'}
                                </h2>
                                <p className="text-slate-500 font-bold max-w-md mt-2">
                                    {controls.locked
                                        ? 'This node has been manually locked. All sessions have been terminated and no new logins are permitted.'
                                        : 'the Node is currently accessible by all authorized users. Critical systems monitoring active.'}
                                </p>

                                {!controls.locked && (
                                    <textarea
                                        value={lockReason} onChange={e => setLockReason(e.target.value)}
                                        placeholder="Reason for suspension (required code)..."
                                        className="w-full max-w-md mt-8 p-5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-500"
                                    />
                                )}

                                <button
                                    onClick={handleToggleLock}
                                    className={`mt-8 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl transition-all active:scale-95 ${controls.locked ? 'bg-emerald-600 text-white shadow-emerald-600/20' : 'bg-rose-600 text-white shadow-rose-600/20'
                                        }`}
                                >
                                    {controls.locked ? 'Restore Node Access' : 'Execute Emergency Lockout'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'audit' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                                    <h3 className="text-sm font-black uppercase text-slate-900 dark:text-white flex items-center gap-2">
                                        <History size={18} className="text-blue-500" /> Operational History
                                    </h3>
                                    <button className="text-[10px] font-black uppercase text-slate-400 hover:text-slate-900">Export CSV</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-black uppercase">
                                            <tr>
                                                <th className="px-6 py-4">Timestamp</th>
                                                <th className="px-6 py-4">Identity</th>
                                                <th className="px-6 py-4">Action execute</th>
                                                <th className="px-6 py-4 text-right">Origin</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                            {auditLogs.map(log => (
                                                <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/80 transition-colors">
                                                    <td className="px-6 py-4 font-bold text-slate-500 whitespace-nowrap">{new Date(log.timestamp).toLocaleString()}</td>
                                                    <td className="px-6 py-4 font-black text-slate-900 dark:text-white">{log.userName}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-md font-bold text-[10px] uppercase text-slate-600 dark:text-slate-300">
                                                            {log.action}
                                                        </span>
                                                        <div className="text-[10px] text-slate-400 mt-1 font-medium">{log.details}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-400">{log.ipAddress}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Notifications */}
            {message && (
                <div className={`fixed top-8 right-8 z-[100] p-6 rounded-2xl shadow-2xl border animate-in slide-in-from-right-8 duration-300 flex items-center gap-4 ${message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                    }`}>
                    {message.type === 'success' ? <ShieldCheck size={28} /> : <AlertTriangle size={28} />}
                    <div>
                        <p className="font-black text-xs uppercase tracking-widest">System Message</p>
                        <p className="text-sm font-bold opacity-90">{message.text}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicControlPanel;
