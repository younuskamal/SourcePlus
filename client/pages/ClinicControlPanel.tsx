
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Clinic, SubscriptionPlan } from '../types';
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
    Clock
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

type TabType = 'overview' | 'limits' | 'features' | 'subscription' | 'security';

const ClinicControlPanel: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [clinic, setClinic] = useState<Clinic | null>(null);
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

    // Data States
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);

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
        if (id) {
            loadData();
        }
    }, [id]);

    const loadData = async () => {
        if (!id) return;
        try {
            setLoading(true);
            const [clinicData, controlsData, plansData] = await Promise.all([
                api.getClinic(id),
                api.getClinicControls(id),
                api.getPlans()
            ]);

            let usageData: UsageData | null = null;
            try {
                usageData = await api.getClinicUsage(id);
            } catch (e) {
                // Ignore usage error, might be new clinic
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
        } catch (error: any) {
            console.error('Failed to load data:', error);
            showMessage('error', `Failed to load clinic data: ${error.message}`);
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
        try {
            setSaving(true);
            const patientsLimitValue = patientsLimitInput.trim() === '' ? null : Number(patientsLimitInput.trim());

            await api.updateClinicControls(id, {
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
        if (!id || !selectedPlanId) return;
        try {
            setSaving(true);
            await api.assignClinicLicense(id, {
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
        if (!id || !controls) return;
        if (!controls.locked && !lockReason.trim()) {
            showMessage('error', t('controls.lockReasonRequired'));
            return;
        }
        try {
            setSaving(true);
            await api.updateClinicControls(id, {
                locked: !controls.locked,
                lockReason: !controls.locked ? lockReason : null
            });
            await loadData();
            showMessage('success', controls.locked ? t('controls.clinicUnlocked') : t('controls.clinicLocked'));
            setShowLockConfirm(false);
            setLockReason('');
        } catch (error: any) {
            showMessage('error', error.message);
        } finally {
            setSaving(false);
        }
    };

    const formatNumber = (val: number | string | null | undefined) => {
        if (val === null || val === undefined) return '0';
        return Number(val).toLocaleString();
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium tracking-wide">LOADING CONTROL PANEL...</p>
            </div>
        );
    }

    if (!clinic || !controls) return null;

    const featureLabels: Record<string, string> = {
        patients: t('features.patients'),
        appointments: t('features.appointments'),
        orthodontics: t('features.orthodontics'),
        xray: t('features.xray'),
        ai: t('features.ai')
    };

    return (
        <div className="w-full h-full flex flex-col bg-slate-50 dark:bg-slate-900">
            {/* Top Notification Toast */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded-lg shadow-xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span className="font-bold">{message.text}</span>
                </div>
            )}

            {/* Header */}
            <header className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/clinic-dashboard')}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                        title="Back to Dashboard"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3 uppercase tracking-tight">
                            {clinic.name}
                            {controls.locked && (
                                <span className="px-2 py-0.5 text-[10px] bg-rose-100 text-rose-700 rounded-full font-bold uppercase flex items-center gap-1 border border-rose-200">
                                    <Lock size={10} /> Locked
                                </span>
                            )}
                        </h1>
                        <div className="text-xs text-slate-500 font-medium flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1"><Mail size={12} /> {clinic.email}</span>
                            <span className="bg-slate-100 dark:bg-slate-700 px-1.5 rounded text-[10px] font-mono tracking-wider">{clinic.id.split('-')[0]}</span>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${clinic.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            clinic.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                        }`}>
                        {clinic.status}
                    </span>
                </div>
            </header>

            {/* Main Layout */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar Navigation */}
                <nav className="w-full md:w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 flex-shrink-0 overflow-y-auto">
                    <div className="p-4 space-y-1">
                        {[
                            { id: 'overview', label: 'Overview', icon: Zap },
                            { id: 'subscription', label: 'Plan & License', icon: CreditCard },
                            { id: 'limits', label: 'Resources & Limits', icon: HardDrive },
                            { id: 'features', label: 'Features & Modules', icon: Settings },
                            { id: 'security', label: 'Security & Access', icon: Shield }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-bold text-sm transition-all ${activeTab === tab.id
                                        ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-l-4 border-emerald-500 shadow-sm'
                                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white border-l-4 border-transparent'
                                    }`}
                            >
                                <tab.icon size={18} />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-900 p-6">
                    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        {/* OVERVIEW TAB */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-6">Clinic Overview</h2>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Storage</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                                    {usage?.storageUsedMB ? (usage.storageUsedMB / 1024).toFixed(2) : 0} <span className="text-sm font-bold text-slate-400">GB</span>
                                                </h3>
                                            </div>
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><HardDrive size={24} /></div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div className="bg-blue-500 h-full transition-all duration-1000" style={{ width: `${Math.min(((usage?.storageUsedMB || 0) / (usage?.storageLimitMB || controls.storageLimitMB || 1)) * 100, 100)}%` }} />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">Of {formatNumber((usage?.storageLimitMB || controls.storageLimitMB) / 1024)} GB Allocated</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Users</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                                    {formatNumber(usage?.usersUsed)} <span className="text-sm font-bold text-slate-400">Seats</span>
                                                </h3>
                                            </div>
                                            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><UsersIcon size={24} /></div>
                                        </div>
                                        <div className="w-full bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                                            <div className="bg-purple-500 h-full transition-all duration-1000" style={{ width: `${Math.min(((usage?.usersUsed || 0) / (usage?.usersLimit || controls.usersLimit || 1)) * 100, 100)}%` }} />
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">Of {formatNumber(usage?.usersLimit || controls.usersLimit)} Seats Allowed</p>
                                    </div>

                                    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex justify-between items-start mb-4">
                                            <div>
                                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patients</p>
                                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mt-1">
                                                    {formatNumber(usage?.patientsUsed)}
                                                </h3>
                                            </div>
                                            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp size={24} /></div>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2 font-medium">
                                            Limit: {controls.patientsLimit ? formatNumber(controls.patientsLimit) : 'Unlimited'} Records
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 uppercase tracking-wide">System Information</h3>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Doctor Name</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{clinic.doctorName || '-'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">System Version</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{clinic.systemVersion || 'Unknown'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Last Sync</p>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{usage?.lastSyncAt ? new Date(usage.lastSyncAt).toLocaleString() : 'Never'}</p>
                                        </div>
                                        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                            <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Current Plan</p>
                                            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{clinic.license?.plan?.name || 'No Plan'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* SUBSCRIPTION TAB */}
                        {activeTab === 'subscription' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Subscription & License</h2>
                                <p className="text-slate-500 font-medium mb-6">Manage the active plan and subscription duration for this clinic.</p>

                                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-bl-full pointer-events-none" />

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Select Plan</label>
                                                <select
                                                    value={selectedPlanId}
                                                    onChange={(e) => setSelectedPlanId(e.target.value)}
                                                    className="w-full p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-lg font-bold focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all"
                                                >
                                                    <option value="" disabled>Select a plan...</option>
                                                    {plans.map(p => (
                                                        <option key={p.id} value={p.id}>{p.name} ({p.price} / mo)</option>
                                                    ))}
                                                </select>
                                                <p className="text-xs text-slate-400">Choose the subscription tier for this clinic.</p>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-bold uppercase text-slate-500 tracking-wider">Duration (Months)</label>
                                                <div className="flex items-center gap-4">
                                                    <button
                                                        onClick={() => setSubDuration(Math.max(1, subDuration - 1))}
                                                        className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-600"
                                                    >-</button>
                                                    <div className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-center font-black text-xl">
                                                        {subDuration} Months
                                                    </div>
                                                    <button
                                                        onClick={() => setSubDuration(subDuration + 1)}
                                                        className="w-12 h-12 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center font-bold text-xl text-slate-600"
                                                    >+</button>
                                                </div>
                                                <div className="flex gap-2 justify-center mt-2">
                                                    {[6, 12, 24].map(m => (
                                                        <button
                                                            key={m}
                                                            onClick={() => setSubDuration(m)}
                                                            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${subDuration === m ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}
                                                        >
                                                            {m} Mo
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col justify-center space-y-6 pl-0 md:pl-8 border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-700 pt-6 md:pt-0">
                                            <div className="bg-emerald-50 dark:bg-emerald-900/20 p-6 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-300 uppercase mb-2">Current Status</h4>
                                                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 mb-1">
                                                    {clinic.license ? 'Active' : 'No License'}
                                                </p>
                                                {clinic.license?.expireDate && (
                                                    <p className="text-sm font-medium text-emerald-700/70 dark:text-emerald-400/70 flex items-center gap-2">
                                                        <Clock size={16} /> Expires: {new Date(clinic.license.expireDate).toLocaleDateString()}
                                                    </p>
                                                )}
                                            </div>

                                            <button
                                                onClick={handleUpdateSubscription}
                                                disabled={saving || !selectedPlanId}
                                                className="w-full py-4 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-widest text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3"
                                            >
                                                {saving ? <Loader2 className="animate-spin" /> : <CheckCircle />}
                                                Update Subscription
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* LIMITS TAB */}
                        {activeTab === 'limits' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Resource Allocation</h2>
                                <p className="text-slate-500 font-medium mb-6">Define the specific operational limits for this clinic.</p>

                                <div className="bg-white dark:bg-slate-800 p-8 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-8">
                                    {/* Storage Slider */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                                <HardDrive size={16} className="text-blue-500" /> Storage Limit
                                            </label>
                                            <span className="text-xl font-black text-slate-900 dark:text-white">{storageLimitInput < 1024 ? `${storageLimitInput} MB` : `${(storageLimitInput / 1024).toFixed(1)} GB`}</span>
                                        </div>
                                        <input
                                            type="range" min="256" max="51200" step="256"
                                            value={storageLimitInput}
                                            onChange={(e) => setStorageLimitInput(Number(e.target.value))}
                                            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                        />
                                        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                            <span>256 MB</span>
                                            <span>50 GB</span>
                                        </div>
                                    </div>

                                    {/* Users Slider */}
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                                <UsersIcon size={16} className="text-purple-500" /> Max Users / Seats
                                            </label>
                                            <span className="text-xl font-black text-slate-900 dark:text-white">{usersLimitInput} Operators</span>
                                        </div>
                                        <input
                                            type="range" min="1" max="50" step="1"
                                            value={usersLimitInput}
                                            onChange={(e) => setUsersLimitInput(Number(e.target.value))}
                                            className="w-full h-3 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                        />
                                        <div className="flex gap-2 mt-2">
                                            {[3, 5, 10, 20].map(u => (
                                                <button key={u} onClick={() => setUsersLimitInput(u)} className="px-2 py-1 bg-slate-100 rounded text-xs font-bold text-slate-600 hover:bg-slate-200">{u}</button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Patients Input */}
                                    <div className="space-y-4">
                                        <label className="text-xs font-bold uppercase text-slate-500 tracking-wider flex items-center gap-2">
                                            <TrendingUp size={16} className="text-emerald-500" /> Patient Records Limit
                                        </label>
                                        <div className="flex gap-4">
                                            <input
                                                type="number"
                                                value={patientsLimitInput}
                                                onChange={(e) => setPatientsLimitInput(e.target.value)}
                                                placeholder="Unlimited"
                                                className="flex-1 p-4 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                                            />
                                            <button
                                                onClick={() => setPatientsLimitInput('')}
                                                className="px-6 py-4 bg-slate-100 hover:bg-slate-200 rounded-xl font-bold text-slate-600 text-sm"
                                            >
                                                Set Unlimited
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-400">Leave blank to authorize unlimited patient records.</p>
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                                        <button
                                            onClick={handleSaveControls}
                                            disabled={saving}
                                            className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                                        >
                                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                            Save Limits
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* FEATURES TAB */}
                        {activeTab === 'features' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Module Configuration</h2>
                                <p className="text-slate-500 font-medium mb-6">Enable or disable specific system capabilities for this clinic.</p>

                                <div className="grid grid-cols-1 gap-4">
                                    {Object.entries(features).map(([key, enabled]) => (
                                        <div
                                            key={key}
                                            onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                            className={`
                                                group relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between
                                                ${enabled
                                                    ? 'bg-white border-emerald-500 shadow-md transform scale-[1.01]'
                                                    : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200'
                                                }
                                            `}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Settings size={24} />
                                                </div>
                                                <div>
                                                    <h3 className={`text-lg font-bold ${enabled ? 'text-slate-900' : 'text-slate-500'}`}>{featureLabels[key] || key}</h3>
                                                    <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{enabled ? 'Active Module' : 'Disabled'}</p>
                                                </div>
                                            </div>

                                            <div className={`w-14 h-8 rounded-full relative transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}>
                                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl flex items-center gap-2 hover:shadow-lg transition-all"
                                    >
                                        {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                                        Save Configuration
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* SECURITY TAB */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Security & Access</h2>
                                <p className="text-slate-500 font-medium mb-6">Manage access control and emergency lockout protocols.</p>

                                <div className={`p-8 rounded-2xl border-2 ${controls.locked ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'} transition-colors`}>
                                    <div className="flex flex-col md:flex-row items-center gap-8">
                                        <div className={`w-32 h-32 rounded-full flex items-center justify-center shrink-0 ${controls.locked ? 'bg-rose-100 text-rose-500' : 'bg-emerald-100 text-emerald-500'}`}>
                                            {controls.locked ? <Lock size={48} /> : <Unlock size={48} />}
                                        </div>

                                        <div className="flex-1 text-center md:text-left">
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">
                                                {controls.locked ? 'CLINIC IS LOCKED' : 'ACCESS GRANTED'}
                                            </h3>
                                            <p className="text-slate-600 mb-4 text-lg">
                                                {controls.locked
                                                    ? 'All access to the system has been revoked. Users cannot log in.'
                                                    : 'The clinic is operational. Authorized users can access the system.'}
                                            </p>

                                            {controls.locked && controls.lockReason && (
                                                <div className="inline-block px-4 py-2 bg-rose-100 text-rose-800 rounded-lg font-medium text-sm border border-rose-200">
                                                    Reason: {controls.lockReason}
                                                </div>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => setShowLockConfirm(true)}
                                            className={`px-8 py-4 rounded-xl font-bold text-white shadow-lg uppercase tracking-wider hover:scale-105 transition-transform ${controls.locked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                                        >
                                            {controls.locked ? 'Unlock Access' : 'Lock Clinic'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Lock Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl max-w-md w-full shadow-2xl scale-100">
                        <h3 className="text-2xl font-black mb-2 text-slate-900 dark:text-white">
                            {controls.locked ? t('dashboard.unlockClinic') : t('dashboard.lockClinic')}
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 mb-6 font-medium">
                            {controls.locked ? "Are you sure you want to restore access?" : "This will immediately prevent all users from accessing this clinic."}
                        </p>

                        {!controls.locked && (
                            <div className="mb-6">
                                <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Reason for Locking</label>
                                <textarea
                                    className="w-full p-4 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 rounded-xl outline-none focus:ring-2 focus:ring-rose-500"
                                    rows={3}
                                    value={lockReason}
                                    onChange={e => setLockReason(e.target.value)}
                                    placeholder="e.g. Non-payment, Maintenance..."
                                />
                            </div>
                        )}

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowLockConfirm(false)}
                                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleLock}
                                className={`flex-1 py-3 text-white rounded-xl font-bold ${controls.locked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicControlPanel;
