import React, { useState } from 'react';
import { Clinic } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import {
    Building2,
    User,
    Mail,
    Phone,
    Calendar,
    Clock,
    Database,
    Users,
    Shield,
    Copy,
    Check,
    AlertCircle,
    CheckCircle,
    XCircle,
    Info
} from 'lucide-react';

interface ClinicInformationPanelProps {
    clinic: Clinic;
    controls?: {
        storageLimitMB: number;
        usersLimit: number;
        locked: boolean;
        lockReason: string | null;
    };
    usage?: {
        storageUsedMB: number;
        activeUsersCount: number;
    };
}

const ClinicInformationPanel: React.FC<ClinicInformationPanelProps> = ({ clinic, controls, usage }) => {
    const { t } = useTranslation();
    const [copiedCode, setCopiedCode] = useState(false);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const calculateRemainingDays = () => {
        if (!clinic.license?.expireDate) return null;
        const now = new Date();
        const expire = new Date(clinic.license.expireDate);
        const days = Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        return days > 0 ? days : 0;
    };

    const getSubscriptionStatus = () => {
        const remainingDays = calculateRemainingDays();
        if (controls?.locked) return 'suspended';
        if (remainingDays === null) return 'inactive';
        if (remainingDays <= 0) return 'expired';
        return 'active';
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            active: {
                bg: 'bg-emerald-100 dark:bg-emerald-900/30',
                text: 'text-emerald-700 dark:text-emerald-300',
                icon: <CheckCircle size={14} />,
                label: t('dashboard.active')
            },
            expired: {
                bg: 'bg-rose-100 dark:bg-rose-900/30',
                text: 'text-rose-700 dark:text-rose-300',
                icon: <XCircle size={14} />,
                label: t('dashboard.expired')
            },
            suspended: {
                bg: 'bg-amber-100 dark:bg-amber-900/30',
                text: 'text-amber-700 dark:text-amber-300',
                icon: <AlertCircle size={14} />,
                label: t('dashboard.suspended')
            },
            inactive: {
                bg: 'bg-slate-100 dark:bg-slate-800',
                text: 'text-slate-600 dark:text-slate-400',
                icon: <Info size={14} />,
                label: t('dashboard.notAvailable')
            }
        };

        return badges[status as keyof typeof badges] || badges.inactive;
    };

    const status = getSubscriptionStatus();
    const statusBadge = getStatusBadge(status);
    const remainingDays = calculateRemainingDays();

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border-2 border-slate-200 dark:border-slate-700 overflow-hidden shadow-xl">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                            <Building2 size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">{clinic.name}</h2>
                            <p className="text-emerald-100 text-sm mt-1">{t('dashboard.clinicInfo')}</p>
                        </div>
                    </div>
                    <div className={`px-4 py-2 rounded-full ${statusBadge.bg} ${statusBadge.text} flex items-center gap-2 font-bold`}>
                        {statusBadge.icon}
                        {statusBadge.label}
                    </div>
                </div>
            </div>

            {/* Content Grid */}
            <div className="p-6 grid md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* 1. Identity & Account */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide flex items-center gap-2">
                        <Shield size={16} />
                        {t('dashboard.identityAccount')}
                    </h3>

                    <div className="space-y-3">
                        {/* Clinic Name */}
                        <InfoField
                            label={t('clinics.tableClinic')}
                            value={clinic.name}
                            icon={<Building2 size={14} />}
                        />

                        {/* Clinic ID with Copy */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Info size={12} />
                                    {t('dashboard.clinicId')}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(clinic.id)}
                                    className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors text-slate-600 dark:text-slate-300"
                                    title={t('dashboard.copyCode')}
                                >
                                    {copiedCode ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                                </button>
                            </div>
                            <p className="text-xs font-mono text-slate-900 dark:text-white break-all">{clinic.id}</p>
                        </div>

                        {/* Registration/Account Code - VERY IMPORTANT */}
                        <div className="p-3 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-2 border-emerald-300 dark:border-emerald-700">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                                    <Shield size={12} />
                                    {t('dashboard.accountCode')}
                                </span>
                                <button
                                    onClick={() => copyToClipboard(clinic.registrationCode || clinic.id)}
                                    className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1"
                                >
                                    {copiedCode ? <Check size={12} /> : <Copy size={12} />}
                                    {copiedCode ? t('dashboard.copied') : t('dashboard.copyCode')}
                                </button>
                            </div>
                            <p className="text-sm font-mono font-bold text-emerald-900 dark:text-emerald-100">
                                {clinic.registrationCode || clinic.id.substring(0, 12).toUpperCase()}
                            </p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                                Share this code with the clinic
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Ownership & Contact */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wide flex items-center gap-2">
                        <User size={16} />
                        {t('dashboard.ownershipContact')}
                    </h3>

                    <div className="space-y-3">
                        <InfoField
                            label={t('dashboard.ownerName')}
                            value={clinic.doctorName || clinic.name}
                            icon={<User size={14} />}
                        />
                        <InfoField
                            label={t('login.email')}
                            value={clinic.email}
                            icon={<Mail size={14} />}
                            copyable
                        />
                        <InfoField
                            label={t('support.phone')}
                            value={clinic.phone || t('dashboard.notAvailable')}
                            icon={<Phone size={14} />}
                            copyable={!!clinic.phone}
                        />
                    </div>
                </div>

                {/* 3. Dates & Lifecycle */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide flex items-center gap-2">
                        <Calendar size={16} />
                        {t('dashboard.datesLifecycle')}
                    </h3>

                    <div className="space-y-3">
                        <InfoField
                            label={t('dashboard.registration')}
                            value={new Date(clinic.createdAt).toLocaleDateString()}
                            icon={<Calendar size={14} />}
                        />
                        <InfoField
                            label={t('dashboard.lastUpdated')}
                            value={new Date(clinic.updatedAt).toLocaleDateString()}
                            icon={<Clock size={14} />}
                        />
                        <InfoField
                            label={t('dashboard.subscriptionStart')}
                            value={clinic.license?.activationDate ? new Date(clinic.license.activationDate).toLocaleDateString() : t('dashboard.notAvailable')}
                            icon={<Calendar size={14} />}
                        />
                        <InfoField
                            label={t('dashboard.subscriptionEnd')}
                            value={clinic.license?.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : t('dashboard.notAvailable')}
                            icon={<Calendar size={14} />}
                        />

                        {/* Remaining Days Highlight */}
                        {remainingDays !== null && (
                            <div className={`p-3 rounded-lg border-2 ${remainingDays <= 7 ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700' :
                                    remainingDays <= 30 ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-300 dark:border-amber-700' :
                                        'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                                }`}>
                                <div className="text-xs font-semibold mb-1 flex items-center gap-1 text-slate-600 dark:text-slate-300">
                                    <Clock size={12} />
                                    {t('dashboard.remainingDays')}
                                </div>
                                <p className={`text-2xl font-bold ${remainingDays <= 7 ? 'text-rose-600' :
                                        remainingDays <= 30 ? 'text-amber-600' :
                                            'text-emerald-600'
                                    }`}>
                                    {remainingDays} {t('clinics.days')}
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* 4. Usage Summary & System State */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wide flex items-center gap-2">
                        <Database size={16} />
                        {t('dashboard.usageSummary')}
                    </h3>

                    <div className="space-y-3">
                        {/* Users */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Users size={12} />
                                    {t('dashboard.usersUsed')}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {usage?.activeUsersCount || 0} / {controls?.usersLimit || 0}
                                </span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-purple-500 transition-all"
                                    style={{ width: `${Math.min(((usage?.activeUsersCount || 0) / (controls?.usersLimit || 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Storage */}
                        <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <Database size={12} />
                                    {t('dashboard.storageUsed')}
                                </span>
                                <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {usage?.storageUsedMB || 0} / {controls?.storageLimitMB || 0} MB
                                </span>
                            </div>
                            <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-cyan-500 transition-all"
                                    style={{ width: `${Math.min(((usage?.storageUsedMB || 0) / (controls?.storageLimitMB || 1)) * 100, 100)}%` }}
                                />
                            </div>
                        </div>

                        {/* Lock Status */}
                        <div className={`p-3 rounded-lg border-2 ${controls?.locked
                                ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700'
                                : 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                            }`}>
                            <div className="text-xs font-semibold mb-1 flex items-center gap-1">
                                <Shield size={12} />
                                {t('dashboard.lockStatus')}
                            </div>
                            <p className={`text-sm font-bold ${controls?.locked ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {controls?.locked ? `🔒 ${t('dashboard.yes')}` : `🔓 ${t('dashboard.no')}`}
                            </p>
                            {controls?.locked && controls.lockReason && (
                                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">
                                    {controls.lockReason}
                                </p>
                            )}
                        </div>

                        {/* Last Seen / Heartbeat */}
                        <InfoField
                            label={t('dashboard.lastSeen')}
                            value={t('dashboard.notAvailable')}
                            icon={<Clock size={14} />}
                            small
                        />
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="px-6 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <Info size={14} />
                    <span>
                        This information is <strong>read-only</strong>. Use the Control Dashboard to modify settings.
                    </span>
                </p>
            </div>
        </div>
    );
};

// Helper Component
const InfoField: React.FC<{
    label: string;
    value: string;
    icon?: React.ReactNode;
    copyable?: boolean;
    small?: boolean;
}> = ({ label, value, icon, copyable, small }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className={`${small ? 'p-2' : 'p-3'} rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 group hover:shadow-md transition-all`}>
            <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    {icon}
                    {label}
                </span>
                {copyable && (
                    <button
                        onClick={handleCopy}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-slate-600 dark:text-slate-300"
                    >
                        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                    </button>
                )}
            </div>
            <p className={`${small ? 'text-xs' : 'text-sm'} font-medium text-slate-900 dark:text-white break-words`}>
                {value}
            </p>
        </div>
    );
};

export default ClinicInformationPanel;
