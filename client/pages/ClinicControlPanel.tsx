
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Clinic } from '../types';
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
    Info,
    Calendar,
    Mail
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
    usersLimit: number; // Max users allowed
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
    const { t } = useTranslation();

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
            } catch (usageError: any) {
                if (usageError?.response?.status === 404) {
                    setUsageMessage(t('controls.noUsageData'));
                } else {
                    console.error('Failed to load usage data:', usageError);
                    setUsageMessage(t('controls.usageError'));
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

        const trimmed = patientsLimitInput.trim();
        const patientsLimitValue = trimmed === '' ? null : Number(trimmed);

        if (patientsLimitValue !== null && (!Number.isFinite(patientsLimitValue) || patientsLimitValue <= 0)) {
            showMessage('error', t('controls.patientsLimitError'));
            return;
        }

        const storageLimitValue = Number(storageLimitInput);
        const usersLimitValue = Number(usersLimitInput);

        if (!Number.isFinite(storageLimitValue) || storageLimitValue <= 0) {
            showMessage('error', t('controls.storageLimitError'));
            return;
        }
        if (!Number.isFinite(usersLimitValue) || usersLimitValue <= 0) {
            showMessage('error', t('controls.usersLimitError'));
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
            showMessage('success', t('controls.controlsUpdated'));
        } catch (error: any) {
            console.error('Failed to update controls:', error);
            showMessage('error', `Failed to update: ${error.message}`);
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
            console.error('Failed to toggle lock:', error);
            showMessage('error', `Failed: ${error.message}`);
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
            <div className="flex flex-col items-center justify-center min-h-screen">
                <Loader2 className="animate-spin text-emerald-600 mb-4" size={48} />
                <p className="text-slate-500 font-medium">Loading Clinic Data...</p>
            </div>
        );
    }

    if (!clinic || !controls) {
        return (
            <div className="p-8 text-center text-rose-500">
                <AlertTriangle size={48} className="mx-auto mb-4" />
                <h2 className="text-xl font-bold">Error Loading Clinic</h2>
                <button onClick={() => navigate('/manage-clinics')} className="mt-4 text-blue-500 hover:underline">
                    Back to List
                </button>
            </div>
        );
    }

    const featureLabels: Record<string, string> = {
        patients: t('features.patients'),
        appointments: t('features.appointments'),
        orthodontics: t('features.orthodontics'),
        xray: t('features.xray'),
        ai: t('features.ai')
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6">
            {/* Toast Message */}
            {message && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-4 rounded shadow-lg border flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                    }`}>
                    {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                            {clinic.name}
                            {controls.locked && (
                                <span className="px-2 py-1 text-xs bg-rose-100 text-rose-700 rounded font-bold uppercase flex items-center gap-1">
                                    <Lock size={12} /> Locked
                                </span>
                            )}
                        </h1>
                        <div className="text-sm text-slate-500 flex items-center gap-3 mt-1">
                            <span className="flex items-center gap-1"><Mail size={12} /> {clinic.email}</span>
                            <span className="font-mono bg-slate-100 dark:bg-slate-900 px-1.5 rounded text-xs">{clinic.id.split('-')[0]}...</span>
                        </div>
                    </div>
                </div>
                <div>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${clinic.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            clinic.status === 'SUSPENDED' ? 'bg-rose-100 text-rose-800' :
                                'bg-slate-100 text-slate-800'
                        }`}>
                        {clinic.status}
                    </span>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700 flex gap-6">
                {[
                    { id: 'overview', label: 'Overview', icon: Zap },
                    { id: 'limits', label: 'Analysis & Limits', icon: HardDrive },
                    { id: 'features', label: 'Features', icon: Settings },
                    { id: 'security', label: 'Security', icon: Shield }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Content */}
            <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-[400px] p-6">

                {/* OVERVIEW */}
                {activeTab === 'overview' && (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Metric Cards */}
                            <div className="p-4 rounded border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-100 text-blue-600 rounded"><HardDrive size={20} /></div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Storage</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {usage?.storageUsedMB ? usage.storageUsedMB.toFixed(1) : 0} MB
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    of {formatNumber(usage?.storageLimitMB || controls.storageLimitMB)} MB
                                </div>
                                {/* Progress */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-blue-500 h-full"
                                        style={{ width: `${Math.min(((usage?.storageUsedMB || 0) / (usage?.storageLimitMB || controls.storageLimitMB || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-purple-100 text-purple-600 rounded"><UsersIcon size={20} /></div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Users</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(usage?.usersUsed)}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    of {formatNumber(usage?.usersLimit || controls.usersLimit)} Seats
                                </div>
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-3 overflow-hidden">
                                    <div
                                        className="bg-purple-500 h-full"
                                        style={{ width: `${Math.min(((usage?.usersUsed || 0) / (usage?.usersLimit || controls.usersLimit || 1)) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            <div className="p-4 rounded border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-emerald-100 text-emerald-600 rounded"><TrendingUp size={20} /></div>
                                    <span className="font-semibold text-slate-700 dark:text-slate-300">Patients</span>
                                </div>
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {formatNumber(usage?.patientsUsed)}
                                </div>
                                <div className="text-sm text-slate-500 mt-1">
                                    Limit: {controls.patientsLimit ? formatNumber(controls.patientsLimit) : 'Unlimited'}
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">Clinic Information</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 text-sm">Doctor Name</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{clinic.doctorName || '-'}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 text-sm">System Version</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{clinic.systemVersion || 'Unknown'}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 text-sm">Last Sync</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{usage?.lastSyncAt ? new Date(usage.lastSyncAt).toLocaleString() : 'Never'}</span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded border border-slate-100 dark:border-slate-700">
                                    <span className="text-slate-500 text-sm">Plan</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{clinic.license?.plan?.name || 'No Plan'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* LIMITS - DEFINING RESOURCES */}
                {activeTab === 'limits' && (
                    <div className="max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Resource Allocation</h2>
                            <p className="text-slate-500 text-sm">Define the limits and quotas for this clinic license.</p>
                        </div>

                        <div className="space-y-6">
                            {/* Storage */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <span>Storage Allocation (MB)</span>
                                    <span className="text-blue-600 font-bold">{storageLimitInput} MB</span>
                                </label>
                                <input
                                    type="range"
                                    min="256"
                                    max="51200"
                                    step="256"
                                    value={storageLimitInput}
                                    onChange={(e) => setStorageLimitInput(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                                />
                                <div className="flex gap-2">
                                    {[1024, 5120, 10240, 20480].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setStorageLimitInput(val)}
                                            className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 rounded text-slate-600 dark:text-slate-300"
                                        >
                                            {val} MB
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Users */}
                            <div className="space-y-2">
                                <label className="flex items-center justify-between text-sm font-medium text-slate-700 dark:text-slate-300">
                                    <span>Max Users/Seats</span>
                                    <span className="text-purple-600 font-bold">{usersLimitInput} Users</span>
                                </label>
                                <input
                                    type="range"
                                    min="1"
                                    max="100"
                                    step="1"
                                    value={usersLimitInput}
                                    onChange={(e) => setUsersLimitInput(parseInt(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                />
                            </div>

                            {/* Patients */}
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                    Max Patient Records
                                </label>
                                <div className="flex gap-3">
                                    <input
                                        type="number"
                                        value={patientsLimitInput}
                                        onChange={(e) => setPatientsLimitInput(e.target.value)}
                                        placeholder="Leave empty for Unlimited"
                                        className="flex-1 p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent"
                                    />
                                    <button
                                        onClick={() => setPatientsLimitInput('')}
                                        className="px-4 py-2 border border-slate-300 rounded hover:bg-slate-50"
                                    >
                                        Unlimited
                                    </button>
                                </div>
                                <p className="text-xs text-slate-500">Number of patient files allowed. Empty means unlimited.</p>
                            </div>

                            <button
                                onClick={handleSaveControls}
                                disabled={saving}
                                className="mt-6 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-medium flex items-center gap-2"
                            >
                                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                Save Limits
                            </button>
                        </div>
                    </div>
                )}

                {/* FEATURES */}
                {activeTab === 'features' && (
                    <div className="max-w-3xl">
                        <div className="mb-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Feature Toggles</h2>
                            <p className="text-slate-500 text-sm">Enable or disable specific modules for this clinic.</p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(features).map(([key, enabled]) => (
                                <div key={key} className={`p-4 rounded border ${enabled ? 'border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10' : 'border-slate-200 bg-white dark:border-slate-700'}`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="font-bold capitalize text-slate-800 dark:text-slate-200">{key}</span>
                                        <button
                                            onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                            className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`}
                                        >
                                            <span className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">
                                        {featureLabels[key]}
                                    </p>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={handleSaveControls}
                            disabled={saving}
                            className="mt-6 px-6 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded font-medium flex items-center gap-2"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            Save Features
                        </button>
                    </div>
                )}

                {/* SECURITY */}
                {activeTab === 'security' && (
                    <div className="max-w-2xl">
                        <div className={`p-6 rounded-lg border-2 ${controls.locked ? 'border-rose-200 bg-rose-50' : 'border-emerald-200 bg-emerald-50'} mb-6`}>
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-full ${controls.locked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                    {controls.locked ? <Lock size={32} /> : <Unlock size={32} />}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        {controls.locked ? 'Clinic is Locked' : 'Clinic is Active'}
                                    </h3>
                                    <p className="text-slate-600 text-sm">
                                        {controls.locked ? 'Access to this clinic is currently restricted.' : 'Authorized users can access the system.'}
                                    </p>
                                </div>
                            </div>
                            {controls.lockReason && (
                                <div className="mt-4 p-3 bg-white/50 rounded text-sm text-rose-800">
                                    <strong>Reason:</strong> {controls.lockReason}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-center">
                            <button
                                onClick={() => setShowLockConfirm(true)}
                                className={`px-6 py-3 rounded-lg font-bold text-white shadow-sm ${controls.locked ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'}`}
                            >
                                {controls.locked ? 'Unlock Clinic Access' : 'Lock Clinic Access'}
                            </button>
                        </div>
                    </div>
                )}
            </div>
            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg max-w-md w-full shadow-2xl">
                        <h3 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
                            {controls.locked ? t('dashboard.unlockClinic') : t('dashboard.lockClinic')}
                        </h3>
                        <p className="text-slate-600 dark:text-slate-300 mb-6">
                            {controls.locked ? "Are you sure you want to restore access?" : "This will prevent all users from accessing this clinic."}
                        </p>

                        {!controls.locked && (
                            <div className="mb-6">
                                <label className="block text-sm font-bold mb-2">Lock Reason</label>
                                <textarea
                                    className="w-full p-2 border rounded"
                                    rows={3}
                                    value={lockReason}
                                    onChange={e => setLockReason(e.target.value)}
                                    placeholder="Reason for locking..."
                                />
                            </div>
                        )}

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowLockConfirm(false)}
                                className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleLock}
                                className="px-4 py-2 bg-slate-900 text-white rounded hover:bg-slate-800"
                            >
                                Confirm
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClinicControlPanel;
