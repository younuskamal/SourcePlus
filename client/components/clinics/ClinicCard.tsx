import React from 'react';
import {
    CheckCircle2, XCircle, Clock, Ban, Mail, Phone, MapPin,
    Calendar, Eye, Settings, Loader2, PlayCircle, Trash2, Crown, TrendingUp
} from 'lucide-react';
import { Clinic, RegistrationStatus, ClinicSubscriptionStatus } from '../../types';

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

interface ClinicCardProps {
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    onSelect: (clinic: Clinic) => void;
    onAction: (type: ActionType) => void;
    onControls: () => void;
    processing: boolean;
    viewMode: 'requests' | 'manage';
}

const ClinicCard: React.FC<ClinicCardProps> = ({
    clinic,
    subscription,
    onSelect,
    onAction,
    onControls,
    processing,
    viewMode
}) => {
    const statusColors = {
        [RegistrationStatus.APPROVED]: 'bg-emerald-500 text-white',
        [RegistrationStatus.PENDING]: 'bg-amber-500 text-white',
        [RegistrationStatus.SUSPENDED]: 'bg-rose-500 text-white',
        [RegistrationStatus.REJECTED]: 'bg-slate-500 text-white'
    };

    const statusIcons = {
        [RegistrationStatus.APPROVED]: CheckCircle2,
        [RegistrationStatus.PENDING]: Clock,
        [RegistrationStatus.SUSPENDED]: Ban,
        [RegistrationStatus.REJECTED]: XCircle
    };

    const StatusIcon = statusIcons[clinic.status];

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
            <div className="flex items-start justify-between gap-4">
                {/* Left: Clinic Info */}
                <div className="flex-1">
                    <div className="flex items-start gap-4">
                        {/* Logo/Avatar */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {clinic.name ? clinic.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {clinic.name || 'Unknown Clinic'}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusColors[clinic.status]}`}>
                                    <StatusIcon size={14} />
                                    {clinic.status}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Mail size={16} className="text-slate-400 flex-shrink-0" />
                                    <span className="truncate">{clinic.email || 'No email'}</span>
                                </div>

                                {clinic.phone && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Phone size={16} className="text-slate-400 flex-shrink-0" />
                                        <span>{clinic.phone}</span>
                                    </div>
                                )}

                                {clinic.address && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                                        <span className="truncate">{clinic.address}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Calendar size={16} className="text-slate-400 flex-shrink-0" />
                                    <span>{new Date(clinic.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Subscription Info */}
                            {subscription && clinic.status === RegistrationStatus.APPROVED && (
                                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Crown size={16} className="text-amber-500" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Plan: <span className="font-semibold text-slate-900 dark:text-white">{subscription.planName}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className={subscription.isActive ? "text-emerald-500" : "text-rose-500"} />
                                        <span className={subscription.isActive ? "text-emerald-600 dark:text-emerald-400 font-semibold" : "text-rose-600 dark:text-rose-400 font-semibold"}>
                                            {subscription.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    {subscription.expiresAt && (
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                            Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right: Actions */}
                <div className="flex flex-col sm:flex-row items-center gap-2">
                    {/* View Details */}
                    <button
                        onClick={() => onSelect(clinic)}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>

                    {/* Controls (for approved clinics) */}
                    {clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={onControls}
                            className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 transition-all"
                            title="Manage Controls"
                        >
                            <Settings size={18} />
                        </button>
                    )}

                    {/* Status-specific actions */}
                    {viewMode === 'requests' && clinic.status === RegistrationStatus.PENDING && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onAction('approve')}
                                disabled={processing}
                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Approve
                            </button>
                            <button
                                onClick={() => onAction('reject')}
                                disabled={processing}
                                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                Reject
                            </button>
                        </div>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={() => onAction('suspend')}
                            disabled={processing}
                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {processing ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                            Suspend
                        </button>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.SUSPENDED && (
                        <button
                            onClick={() => onAction('reactivate')}
                            disabled={processing}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-sm"
                        >
                            {processing ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                            Reactivate
                        </button>
                    )}

                    {/* Delete (danger zone) */}
                    {viewMode === 'manage' && (
                        <button
                            onClick={() => onAction('delete')}
                            disabled={processing}
                            className="p-2 rounded-lg bg-rose-100 dark:bg-rose-900/30 hover:bg-rose-200 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all disabled:opacity-50"
                            title="Delete Clinic"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicCard;
