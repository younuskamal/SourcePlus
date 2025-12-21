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

    // Form state
    const [storageLimitMB, setStorageLimitMB] = useState(1024);
    const [usersLimit, setUsersLimit] = useState(3);
    const [features, setFeatures] = useState({
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

            console.log('🔍 Loading clinic data for:', id);

            const [clinicData, controlsData, usageData] = await Promise.all([
                api.getClinic(id),
                api.getClinicControls(id),
                api.getClinicUsage(id)
            ]);

            console.log('✅ Clinic:', clinicData);
            console.log('✅ Controls:', controlsData);
            console.log('✅ Usage:', usageData);

            setClinic(clinicData);
            setControls(controlsData);
            setUsage(usageData);

            // Update form state
            setStorageLimitMB(controlsData.storageLimitMB);
            setUsersLimit(controlsData.usersLimit);
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

        try {
            setSaving(true);
            await api.updateClinicControls(id, {
                storageLimitMB,
                usersLimit,
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
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 size={64} className="animate-spin text-purple-600 mx-auto mb-4" />
                    <p className="text-slate-600 dark:text-slate-300 text-lg">Loading clinic data...</p>
                </div>
            </div>
        );
    }

    if (!clinic || !controls || !usage) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertTriangle size={64} className="text-rose-500 mx-auto mb-4" />
                    <p className="text-slate-900 dark:text-white text-xl font-bold mb-2">Clinic not found</p>
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-all"
                    >
                        Back to Clinics
                    </button>
                </div>
            </div>
        );
    }

    const storagePercentage = Math.min((usage.storageUsedMB / storageLimitMB) * 100, 100);
    const usersPercentage = Math.min((usage.activeUsersCount / usersLimit) * 100, 100);

    const tabs = [
        { id: 'overview' as TabType, label: 'Overview', icon: Eye },
        { id: 'limits' as TabType, label: 'Limits & Quotas', icon: TrendingUp },
        { id: 'features' as TabType, label: 'Features', icon: Zap },
        { id: 'security' as TabType, label: 'Security', icon: Shield }
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
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
                <div className="mb-6">
                    <button
                        onClick={() => navigate('/manage-clinics')}
                        className="mb-4 flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                    >
                        <ArrowLeft size={20} />
                        <span className="font-medium">Back to Clinics</span>
                    </button>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                                <Settings size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                                    {clinic.name}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">
                                    Clinic Control Panel - Full Management Access
                                </p>
                            </div>
                        </div>

                        <div className={`px-6 py-3 rounded-xl font-bold text-lg ${controls.locked
                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                            }`}>
                            {controls.locked ? (
                                <span className="flex items-center gap-2">
                                    <Lock size={20} />
                                    LOCKED
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Unlock size={20} />
                                    ACTIVE
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-2 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex gap-2">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${activeTab === tab.id
                                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                                            : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
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
                            {/* Stats Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Storage Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-blue-500 text-white">
                                            <HardDrive size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Storage</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justifybetween items-end">
                                            <div>
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                                    {usage.storageUsedMB.toFixed(2)}
                                                </p>
                                                <p className="text-sm text-slate-500">of {storageLimitMB} MB</p>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-600">{storagePercentage.toFixed(1)}%</p>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                            <div
                                                className={`h-full rounded-full transition-all ${storagePercentage > 90 ? 'bg-rose-500' :
                                                        storagePercentage > 70 ? 'bg-amber-500' : 'bg-blue-500'
                                                    }`}
                                                style={{ width: `${storagePercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Users Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="p-3 rounded-xl bg-emerald-500 text-white">
                                            <UsersIcon size={24} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">Active Users</h3>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                                    {usage.activeUsersCount}
                                                </p>
                                                <p className="text-sm text-slate-500">of {usersLimit} users</p>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-600">{usersPercentage.toFixed(1)}%</p>
                                        </div>
                                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                                            <div
                                                className={`h-full rounded-full transition-all ${usersPercentage >= 100 ? 'bg-rose-500' :
                                                        usersPercentage > 80 ? 'bg-amber-500' : 'bg-emerald-500'
                                                    }`}
                                                style={{ width: `${usersPercentage}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Status Card */}
                                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-3 rounded-xl ${controls.locked ? 'bg-rose-500' : 'bg-emerald-500'} text-white`}>
                                            {controls.locked ? <Lock size={24} /> : <Unlock size={24} />}
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">System Status</h3>
                                    </div>
                                    <p className={`text-2xl font-bold mb-3 ${controls.locked ? 'text-rose-600' : 'text-emerald-600'}`}>
                                        {controls.locked ? 'LOCKED' : 'ACTIVE'}
                                    </p>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-slate-500">
                                            <Clock size={14} />
                                            <span>Data: {new Date(usage.lastUpdated).toLocaleString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
                                            <CheckCircle size={14} />
                                            <span>Real-time from Smart Clinic</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Features Overview */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-lg border border-slate-200 dark:border-slate-700">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Zap size={24} className="text-amber-500" />
                                    Enabled Features
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                                    {Object.entries(features).map(([key, enabled]) => (
                                        <div
                                            key={key}
                                            className={`p-4 rounded-xl text-center font-medium transition-all ${enabled
                                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                                                    : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                                                }`}
                                        >
                                            <div className="capitalize text-lg">{key}</div>
                                            <div className="text-sm mt-1">{enabled ? '✓ Enabled' : '✗ Disabled'}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Limits Tab */}
                    {activeTab === 'limits' && (
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
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
                                            value={storageLimitMB}
                                            onChange={(e) => setStorageLimitMB(parseInt(e.target.value) || 0)}
                                            min="100"
                                            step="100"
                                            className="flex-1 px-6 py-4 text-lg border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold">Current Usage:</div>
                                            <div>{usage.storageUsedMB.toFixed(2)} MB ({storagePercentage.toFixed(1)}%)</div>
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
                                            value={usersLimit}
                                            onChange={(e) => setUsersLimit(parseInt(e.target.value) || 0)}
                                            min="1"
                                            className="flex-1 px-6 py-4 text-lg border border-slate-300 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-slate-700 dark:text-white"
                                        />
                                        <div className="text-sm text-slate-500 dark:text-slate-400">
                                            <div className="font-semibold">Active Users:</div>
                                            <div>{usage.activeUsersCount} users ({usersPercentage.toFixed(1)}%)</div>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm text-slate-500">Maximum number of active users allowed</p>
                                </div>

                                {/* Save Button */}
                                <div className="flex justify-end pt-4">
                                    <button
                                        onClick={handleSaveControls}
                                        disabled={saving}
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
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
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
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
                                        className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl font-semibold transition-all flex items-center gap-3 shadow-lg disabled:opacity-50"
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
                        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-slate-200 dark:border-slate-700">
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
                                        className={`px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center gap-3 shadow-lg ${controls.locked
                                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                                : 'bg-rose-500 hover:bg-rose-600 text-white'
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
