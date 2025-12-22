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
    Save,
    Loader2,
    AlertTriangle,
    CheckCircle,
    Eye,
    Clock,
    Shield,
    TrendingUp,
    FileText
} from 'lucide-react';

interface ClinicControlDashboardProps {
    clinic: Clinic;
    onClose: () => void;
    onUpdate: () => void;
}

interface ControlsData {
    storageLimitMB: number;
    usersLimit: number;
    patientsLimit: number | null;
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
    lastUpdated: string;
}

type TabType = 'overview' | 'limits' | 'features' | 'security';

const ClinicControlDashboard: React.FC<ClinicControlDashboardProps> = ({ clinic, onClose, onUpdate }) => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<TabType>('overview');
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [usage, setUsage] = useState<UsageData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLockConfirm, setShowLockConfirm] = useState(false);
    const [lockReason, setLockReason] = useState('');
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Form state
    const [storageLimitMB, setStorageLimitMB] = useState(1024);
    const [usersLimit, setUsersLimit] = useState(3);
    const [patientsLimit, setPatientsLimit] = useState<string>('');
    const [features, setFeatures] = useState({
        patients: true,
        appointments: true,
        orthodontics: false,
        xray: false,
        ai: false
    });

    useEffect(() => {
        loadData();
    }, [clinic.id]);

    const loadData = async () => {
        try {
            setLoading(true);

            console.log('🔍 Loading clinic controls and usage for:', clinic.id, clinic.name);

            const [controlsData, usageData] = await Promise.all([
                api.getClinicControls(clinic.id),
                api.getClinicUsage(clinic.id)
            ]);

            console.log('✅ Clinic Controls Data:', controlsData);
            console.log('✅ Clinic Usage Data:', usageData);
            console.log('📊 Storage:', usageData.storageUsedMB, 'MB /', controlsData.storageLimitMB, 'MB');
            console.log('👥 Users:', usageData.activeUsersCount, '/', controlsData.usersLimit);

            setControls(controlsData);
            setUsage(usageData);

            // Update form state
            setStorageLimitMB(controlsData.storageLimitMB);
            setUsersLimit(controlsData.usersLimit);
            setPatientsLimit(controlsData.patientsLimit !== null ? controlsData.patientsLimit.toString() : '');
            setFeatures(controlsData.features);
            setLockReason(controlsData.lockReason || '');
        } catch (error: any) {
            console.error('❌ Failed to load clinic data:', error);
            console.error('Error details:', {
                message: error.message,
                response: error.response,
                status: error.response?.status
            });
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
        const trimmed = patientsLimit.trim();
        const patientsLimitValue = trimmed === '' ? null : Number(trimmed);
        if (patientsLimitValue !== null && (!Number.isFinite(patientsLimitValue) || patientsLimitValue <= 0)) {
            showMessage('error', 'Patients limit must be a positive number or left blank for unlimited');
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(clinic.id, {
                storageLimitMB,
                usersLimit,
                patientsLimit: patientsLimitValue,
                features
            });

            await loadData();
            showMessage('success', 'Controls updated successfully');
            onUpdate();
        } catch (error) {
            console.error('Failed to update controls:', error);
            showMessage('error', 'Failed to update controls');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleLock = async () => {
        if (!controls) return;

        if (!controls.locked && !lockReason.trim()) {
            showMessage('error', 'Please provide a lock reason');
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(clinic.id, {
                locked: !controls.locked,
                lockReason: !controls.locked ? lockReason : null
            });

            await loadData();
            showMessage('success', controls.locked ? 'Clinic unlocked' : 'Clinic locked');
            setShowLockConfirm(false);
            setLockReason('');
            onUpdate();
        } catch (error) {
            console.error('Failed to toggle lock:', error);
            showMessage('error', 'Failed to update lock status');
        } finally {
            setSaving(false);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Eye },
        { id: 'limits', label: 'Limits', icon: HardDrive },
        { id: 'features', label: 'Features', icon: Zap },
        { id: 'security', label: 'Security', icon: Shield }
    ];

    if (loading || !controls) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-8 shadow-2xl">
                    <Loader2 size={48} className="animate-spin text-emerald-500 mx-auto" />
                    <p className="mt-4 text-slate-600 dark:text-slate-300">Loading clinic data...</p>
                </div>
            </div>
        );
    }

    const storagePercentage = usage ? Math.min((usage.storageUsedMB / storageLimitMB) * 100, 100) : 0;
    const usersPercentage = usage ? Math.min((usage.activeUsersCount / usersLimit) * 100, 100) : 0;

    return (
        <>
            {/* Lock Confirmation Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl">
                        <div className="flex items-center gap-3 mb-4">
                            <AlertTriangle className="text-amber-500" size={32} />
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                {controls.locked ? 'Unlock Clinic' : 'Lock Clinic'}
                            </h3>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 mb-4">
                            {controls.locked
                                ? 'This will allow the clinic to access their system again.'
                                : 'This will prevent all users from accessing the clinic system.'}
                        </p>

                        {!controls.locked && (
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                    Lock Reason *
                                </label>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-700 dark:text-white"
                                    rows={3}
                                    placeholder="e.g., Payment overdue, Subscription expired..."
                                />
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLockConfirm(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleToggleLock}
                                disabled={saving}
                                className={`flex-1 px-4 py-2 rounded-lg text-white transition-colors ${controls.locked
                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-rose-500 hover:bg-rose-600'
                                    }`}
                            >
                                {saving ? <Loader2 className="animate-spin mx-auto" size={20} /> : controls.locked ? 'Unlock' : 'Lock'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Dashboard */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-5xl my-8">
                    {/* Message Toast */}
                    {message && (
                        <div className={`absolute top-4 right-4 px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 z-10 ${message.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                            } text-white`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
                            <span>{message.text}</span>
                        </div>
                    )}

                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-500 to-cyan-600 text-white rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                                <Building2 size={28} />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h2 className="text-2xl font-bold">{clinic.name}</h2>
                                    {controls.locked && (
                                        <span className="px-3 py-1 text-xs rounded-full bg-rose-500 animate-pulse flex items-center gap-1">
                                            <Lock size={14} /> LOCKED
                                        </span>
                                    )}
                                </div>
                                <p className="text-emerald-100 text-sm mt-1">Control Panel</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg hover:bg-white/20 transition-all"
                        >
                            <XCircle size={28} />
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex border-b border-slate-200 dark:border-slate-700 px-6 gap-2 overflow-x-auto">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                                    : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-emerald-600'
                                    }`}
                            >
                                <tab.icon size={18} />
                                <span className="font-medium">{tab.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {/* Overview Tab */}
                        {activeTab === 'overview' && (
                            <div className="space-y-6">
                                {/* Stats Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                    {/* Storage */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-blue-500 text-white">
                                                <HardDrive size={20} />
                                            </div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Storage</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    {usage?.storageUsedMB || 0} MB / {storageLimitMB} MB
                                                </span>
                                                <span className="font-bold text-blue-600">{storagePercentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                <div
                                                    className={`h-full rounded-full transition-all ${storagePercentage > 90 ? 'bg-rose-500' : storagePercentage > 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                        }`}
                                                    style={{ width: `${storagePercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Users */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-emerald-500 text-white">
                                                <UsersIcon size={20} />
                                            </div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Users</p>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-slate-600 dark:text-slate-300">
                                                    {usage?.activeUsersCount || 0} / {usersLimit}
                                                </span>
                                                <span className="font-bold text-emerald-600">{usersPercentage.toFixed(1)}%</span>
                                            </div>
                                            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                                                <div
                                                    className={`h-full rounded-full transition-all ${usersPercentage >= 100 ? 'bg-rose-500' : usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                        }`}
                                                    style={{ width: `${usersPercentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Patients */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="p-2 rounded-lg bg-amber-500 text-white">
                                                <TrendingUp size={20} />
                                            </div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Patients</p>
                                        </div>
                                        <p className="text-lg font-bold text-slate-900 dark:text-white">
                                            {controls.patientsLimit !== null ? controls.patientsLimit.toLocaleString() : 'Unlimited'}
                                        </p>
                                        <p className="text-sm text-slate-600 dark:text-slate-300">Enforced limit</p>
                                    </div>

                                    {/* Status */}
                                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className={`p-2 rounded-lg ${controls.locked ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                                                {controls.locked ? <Lock size={20} /> : <Unlock size={20} />}
                                            </div>
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">Status</p>
                                        </div>
                                        <p className={`text-lg font-bold ${controls.locked ? 'text-rose-600' : 'text-emerald-600'}`}>
                                            {controls.locked ? 'LOCKED' : 'Active'}
                                        </p>
                                        {usage?.lastUpdated && (
                                            <div className="mt-2 space-y-1">
                                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                                    <Clock size={12} />
                                                    Data: {new Date(usage.lastUpdated).toLocaleString()}
                                                </p>
                                                <p className="text-xs text-emerald-600 font-medium flex items-center gap-1">
                                                    <CheckCircle size={12} />
                                                    Real-time from Smart Clinic
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Features Overview */}
                                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 flex items-center gap-2">
                                        <Zap size={20} className="text-amber-500" />
                                        Enabled Features
                                    </h3>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                        {Object.entries(features).map(([key, enabled]) => (
                                            <div
                                                key={key}
                                                className={`p-3 rounded-lg text-center ${enabled
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                                    }`}
                                            >
                                                <p className="text-sm font-medium capitalize">{key}</p>
                                                <p className="text-xs mt-1">{enabled ? 'Enabled' : 'Disabled'}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Lock Reason */}
                                {controls.locked && controls.lockReason && (
                                    <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                        <p className="font-semibold text-rose-700 dark:text-rose-300 mb-2">Lock Reason:</p>
                                        <p className="text-slate-700 dark:text-slate-300">{controls.lockReason}</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Limits Tab */}
                        {activeTab === 'limits' && (
                            <div className="space-y-6">
                                {/* Storage Limit */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Storage Limit (MB)
                                    </label>
                                    <input
                                        type="number"
                                        value={storageLimitMB}
                                        onChange={(e) => setStorageLimitMB(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                                        min="0"
                                        step="512"
                                    />
                                    <p className="text-sm text-slate-500 mt-1">
                                        Currently using: {usage?.storageUsedMB || 0} MB ({storagePercentage.toFixed(1)}%)
                                    </p>
                                </div>

                                {/* Users Limit */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Users Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={usersLimit}
                                        onChange={(e) => setUsersLimit(parseInt(e.target.value) || 0)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                                        min="1"
                                        step="1"
                                    />
                                    <p className="text-sm text-slate-500 mt-1">
                                        Active users: {usage?.activeUsersCount || 0} ({usersPercentage.toFixed(1)}%)
                                    </p>
                                </div>

                                {/* Patients Limit */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Patients Limit
                                    </label>
                                    <input
                                        type="number"
                                        value={patientsLimit}
                                        onChange={(e) => setPatientsLimit(e.target.value)}
                                        className="w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
                                        min="1"
                                        placeholder="Leave blank for unlimited"
                                    />
                                    <p className="text-sm text-slate-500 mt-1">
                                        Current limit: {controls.patientsLimit !== null ? `${controls.patientsLimit} patients` : 'Unlimited'}
                                    </p>
                                </div>

                                {/* Save Button */}
                                <button
                                    onClick={handleSaveControls}
                                    disabled={saving}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {saving ? 'Saving...' : 'Save Limits'}
                                </button>
                            </div>
                        )}

                        {/* Features Tab */}
                        {activeTab === 'features' && (
                            <div className="space-y-4">
                                {Object.entries(features).map(([key, enabled]) => (
                                    <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                                        <div>
                                            <p className="font-medium text-slate-900 dark:text-white capitalize">{key}</p>
                                            <p className="text-sm text-slate-500">
                                                {key === 'patients' && 'Patient management module'}
                                                {key === 'appointments' && 'Appointments scheduling'}
                                                {key === 'orthodontics' && 'Orthodontics treatment tracking'}
                                                {key === 'xray' && 'X-Ray imaging integration'}
                                                {key === 'ai' && 'AI-powered features'}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => setFeatures({ ...features, [key]: !enabled })}
                                            className={`relative w-14 h-7 rounded-full transition-colors ${enabled ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                                                }`}
                                        >
                                            <div
                                                className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform ${enabled ? 'translate-x-7' : 'translate-x-0'
                                                    }`}
                                            />
                                        </button>
                                    </div>
                                ))}

                                <button
                                    onClick={handleSaveControls}
                                    disabled={saving}
                                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 mt-6"
                                >
                                    {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                                    {saving ? 'Saving...' : 'Save Features'}
                                </button>
                            </div>
                        )}

                        {/* Security Tab */}
                        {activeTab === 'security' && (
                            <div className="space-y-6">
                                <div className="p-6 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                    <div className="flex items-start gap-4">
                                        <div className={`p-3 rounded-xl ${controls.locked ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                                            {controls.locked ? <Lock size={28} /> : <Unlock size={28} />}
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                                                Clinic Access Control
                                            </h3>
                                            <p className="text-slate-600 dark:text-slate-300 mb-4">
                                                {controls.locked
                                                    ? 'This clinic is currently locked. Users cannot access the system.'
                                                    : 'This clinic has full access to their system.'}
                                            </p>

                                            {controls.locked && controls.lockReason && (
                                                <div className="p-3 rounded-lg bg-rose-100 dark:bg-rose-900/30 mb-4">
                                                    <p className="text-sm font-semibold text-rose-700 dark:text-rose-300 mb-1">
                                                        Lock Reason:
                                                    </p>
                                                    <p className="text-sm text-slate-700 dark:text-slate-300">{controls.lockReason}</p>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => setShowLockConfirm(true)}
                                                className={`px-6 py-3 rounded-lg font-medium text-white transition-colors ${controls.locked
                                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                                    : 'bg-rose-500 hover:bg-rose-600'
                                                    }`}
                                            >
                                                {controls.locked ? 'Unlock Clinic' : 'Lock Clinic'}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Info */}
                                <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-800 dark:text-blue-200">
                                        <strong>Note:</strong> Locking a clinic will immediately prevent all users from accessing the system.
                                        This action is logged in the audit trail.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
};

export default ClinicControlDashboard;
