import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clinic } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import {
    Settings,
    XCircle,
    Save,
    HardDrive,
    Users,
    Lock,
    Unlock,
    Zap,
    Loader2,
    RotateCcw,
    AlertTriangle
} from 'lucide-react';

interface ClinicControlsModalProps {
    clinic: Clinic;
    onClose: () => void;
    onSuccess: () => void;
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

const DEFAULT_CONTROLS: ControlsData = {
    storageLimitMB: 1024,
    usersLimit: 3,
    features: {
        patients: true,
        appointments: true,
        orthodontics: false,
        xray: false,
        ai: false
    },
    locked: false,
    lockReason: null
};

const ClinicControlsModal: React.FC<ClinicControlsModalProps> = ({ clinic, onClose, onSuccess }) => {
    const { t } = useTranslation();
    const [controls, setControls] = useState<ControlsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showLockConfirm, setShowLockConfirm] = useState(false);
    const [pendingLock, setPendingLock] = useState(false);

    useEffect(() => {
        loadControls();
    }, [clinic.id]);

    const loadControls = async () => {
        try {
            setLoading(true);
            const data = await api.getClinicControls(clinic.id);
            setControls(data);
        } catch (error) {
            console.error('Failed to load controls:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!controls) return;

        // Check if trying to lock - show confirmation
        if (controls.locked && !pendingLock) {
            setShowLockConfirm(true);
            return;
        }

        try {
            setSaving(true);
            await api.updateClinicControls(clinic.id, controls);
            onSuccess();
            onClose();
        } catch (error: any) {
            alert(error?.message || 'Failed to update controls');
        } finally {
            setSaving(false);
            setPendingLock(false);
        }
    };

    const confirmLock = () => {
        setPendingLock(true);
        setShowLockConfirm(false);
        handleSave();
    };

    const resetToDefaults = () => {
        if (confirm('Are you sure you want to reset all controls to default values?')) {
            setControls(DEFAULT_CONTROLS);
        }
    };

    const updateFeature = (key: keyof ControlsData['features'], value: boolean) => {
        if (!controls) return;
        setControls({
            ...controls,
            features: {
                ...controls.features,
                [key]: value
            }
        });
    };

    if (loading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-8 border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
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
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-rose-500 dark:border-rose-600">
                        <div className="flex flex-col gap-4">
                            <div className="p-3 rounded-full w-fit bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
                                <AlertTriangle size={28} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    ⚠️ Lock Clinic?
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                                    This will <strong>immediately prevent</strong> {clinic.name} from accessing the system.
                                    All users will be logged out and unable to login.
                                </p>
                                {controls.lockReason && (
                                    <div className="mt-3 p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800">
                                        <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">Reason:</p>
                                        <p className="text-sm text-rose-600 dark:text-rose-400 mt-1">{controls.lockReason}</p>
                                    </div>
                                )}
                            </div>
                            <div className="flex items-center gap-3 justify-end mt-2">
                                <button
                                    onClick={() => setShowLockConfirm(false)}
                                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmLock}
                                    className="px-5 py-2 rounded-lg text-white font-bold bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg"
                                >
                                    Yes, Lock Clinic
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Modal */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 max-h-[90vh] flex flex-col">
                    <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg">
                                <Settings size={22} />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    Clinic Control Center
                                    {controls.locked && (
                                        <span className="px-2 py-0.5 text-xs rounded-full bg-rose-600 text-white animate-pulse">
                                            LOCKED
                                        </span>
                                    )}
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400">{clinic.name}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetToDefaults}
                                className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800 text-slate-500 hover:text-emerald-600 transition-colors"
                                title="Reset to Defaults"
                            >
                                <RotateCcw size={18} />
                            </button>
                            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/50 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                                <XCircle size={22} />
                            </button>
                        </div>
                    </div>

                    <div className="p-6 overflow-y-auto space-y-6">
                        {/* Warning Banner if Locked */}
                        {controls.locked && (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 animate-in slide-in-from-top duration-300">
                                <div className="flex items-start gap-3">
                                    <Lock size={20} className="text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-rose-700 dark:text-rose-300">
                                            🔒 This clinic is currently LOCKED
                                        </p>
                                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                            Users cannot access the system. All sessions have been terminated.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Storage Limit */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <HardDrive size={16} className="text-emerald-500" />
                                    {t('controls.storageLimit') || 'Storage Limit (MB)'}
                                </label>
                                <input
                                    type="number"
                                    min={100}
                                    step={100}
                                    value={controls.storageLimitMB}
                                    onChange={(e) => setControls({ ...controls, storageLimitMB: parseInt(e.target.value) || 1024 })}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                                <p className="text-xs text-slate-500">
                                    {(controls.storageLimitMB / 1024).toFixed(2)} GB
                                </p>
                            </div>

                            {/* Users Limit */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    <Users size={16} className="text-emerald-500" />
                                    {t('controls.usersLimit') || 'Users Limit'}
                                </label>
                                <input
                                    type="number"
                                    min={1}
                                    value={controls.usersLimit}
                                    onChange={(e) => setControls({ ...controls, usersLimit: parseInt(e.target.value) || 3 })}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none font-mono"
                                />
                                <p className="text-xs text-slate-500">
                                    Maximum users allowed
                                </p>
                            </div>
                        </div>

                        {/* Features */}
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
                                <Zap size={16} className="text-emerald-500" />
                                {t('controls.features') || 'Features & Modules'}
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {Object.entries(controls.features).map(([key, value]) => (
                                    <label key={key} className="flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-all hover:border-emerald-500 dark:hover:border-emerald-600">
                                        <input
                                            type="checkbox"
                                            checked={value}
                                            onChange={(e) => updateFeature(key as any, e.target.checked)}
                                            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300 capitalize">
                                            {t(`features.${key}`) || key}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Lock Section */}
                        <div className="space-y-3 p-4 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30">
                            <label className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                                {controls.locked ? <Lock size={18} className="text-rose-500" /> : <Unlock size={18} className="text-emerald-500" />}
                                {t('controls.clinicStatus') || 'Clinic Lock Status'}
                            </label>
                            <label className="flex items-start gap-3 p-4 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:bg-white dark:hover:bg-slate-800 cursor-pointer transition-colors">
                                <input
                                    type="checkbox"
                                    checked={controls.locked}
                                    onChange={(e) => setControls({ ...controls, locked: e.target.checked })}
                                    className="h-5 w-5 rounded border-slate-300 text-rose-600 focus:ring-rose-500 mt-0.5"
                                />
                                <div className="flex-1">
                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {controls.locked ? '🔒 Clinic is Locked' : '🔓 Clinic is Active'}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                        {controls.locked
                                            ? 'System is blocked. Users cannot access.'
                                            : 'System is operational and accessible.'}
                                    </div>
                                </div>
                            </label>

                            {/* Lock Reason */}
                            {controls.locked && (
                                <div className="space-y-2 animate-in slide-in-from-top duration-200">
                                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        {t('controls.lockReason') || 'Lock Reason (Optional)'}
                                    </label>
                                    <textarea
                                        value={controls.lockReason || ''}
                                        onChange={(e) => setControls({ ...controls, lockReason: e.target.value || null })}
                                        className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                        rows={2}
                                        placeholder="e.g., Payment overdue, Terms violation, etc."
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between rounded-b-2xl">
                        <p className="text-xs text-slate-500">
                            💡 Changes apply <strong>immediately</strong> to Smart Clinic
                        </p>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {t('common.cancel') || 'Cancel'}
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-6 py-2 rounded-lg text-white font-semibold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {t('common.saving') || 'Saving...'}
                                    </>
                                ) : (
                                    <>
                                        <Save size={16} />
                                        {t('common.save') || 'Save Changes'}
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

export default ClinicControlsModal;
