import React from 'react';
import {
    CheckCircle2, XCircle, Clock, Ban, Mail, Phone, MapPin,
    Eye, Settings, Loader2, PlayCircle, Trash2, Building2
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
    const statusConfig = {
        [RegistrationStatus.APPROVED]: {
            bg: 'bg-emerald-50 dark:bg-emerald-950/20',
            text: 'text-emerald-700 dark:text-emerald-400',
            border: 'border-emerald-200 dark:border-emerald-800/50',
            icon: CheckCircle2,
            dot: 'bg-emerald-500'
        },
        [RegistrationStatus.PENDING]: {
            bg: 'bg-amber-50 dark:bg-amber-950/20',
            text: 'text-amber-700 dark:text-amber-400',
            border: 'border-amber-200 dark:border-amber-800/50',
            icon: Clock,
            dot: 'bg-amber-500'
        },
        [RegistrationStatus.SUSPENDED]: {
            bg: 'bg-rose-50 dark:bg-rose-950/20',
            text: 'text-rose-700 dark:text-rose-400',
            border: 'border-rose-200 dark:border-rose-800/50',
            icon: Ban,
            dot: 'bg-rose-500'
        },
        [RegistrationStatus.REJECTED]: {
            bg: 'bg-slate-50 dark:bg-slate-900/40',
            text: 'text-slate-700 dark:text-slate-400',
            border: 'border-slate-200 dark:border-slate-800/50',
            icon: XCircle,
            dot: 'bg-slate-400'
        }
    };

    const config = statusConfig[clinic.status] || statusConfig[RegistrationStatus.PENDING];
    const StatusIcon = config.icon;

    return (
        <div className="group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[1.5rem] overflow-hidden hover:shadow-2xl hover:shadow-primary-500/5 hover:border-primary-500/30 transition-all duration-300">
            {/* Top Identity Bar */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between p-6 gap-6">
                <div className="flex items-center gap-5">
                    {/* Visual ID */}
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl ${config.bg} border ${config.border} flex items-center justify-center text-2xl font-black ${config.text} group-hover:scale-105 transition-transform duration-500`}>
                            {clinic.name ? clinic.name.charAt(0).toUpperCase() : <Building2 size={24} />}
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-4 border-white dark:border-slate-900 ${config.dot}`} />
                    </div>

                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                                {clinic.name || 'Unnamed Clinic'}
                            </h3>
                            <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest ${config.bg} ${config.text} border ${config.border}`}>
                                {clinic.status}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-sm">
                            <MapPin size={14} />
                            <span>{clinic.address || 'Address not listed'}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats Grid within Card */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 lg:py-0">
                    <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Registered</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">{new Date(clinic.createdAt).toLocaleDateString()}</p>
                    </div>
                    {subscription && (
                        <>
                            <div className="px-4 py-2 rounded-2xl bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-800/30">
                                <p className="text-[10px] font-bold text-indigo-400 dark:text-indigo-400 uppercase tracking-widest">Plan</p>
                                <p className="font-semibold text-indigo-700 dark:text-indigo-300">{subscription.license.plan.name}</p>
                            </div>
                            <div className="px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/30">
                                <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">Expires</p>
                                <p className="font-semibold text-emerald-700 dark:text-emerald-300">
                                    {subscription.expiresAt ? new Date(subscription.expiresAt).toLocaleDateString() : 'Lifetime'}
                                </p>
                            </div>
                        </>
                    )}
                    <div className="px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800/50">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Users</p>
                        <p className="font-semibold text-slate-700 dark:text-slate-200">Active Seat</p>
                    </div>
                </div>

                {/* Master Actions */}
                <div className="flex items-center gap-2 ml-auto">
                    <button
                        onClick={() => onSelect(clinic)}
                        className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500 transition-all font-bold"
                        title="Overview Details"
                    >
                        <Eye size={20} />
                    </button>

                    {clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={onControls}
                            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/20 transition-all font-bold text-sm tracking-tight"
                        >
                            <Settings size={18} />
                            <span>Control Panel</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content & Hidden Integration Area */}
            <div className="px-6 pb-6 pt-2 border-t border-slate-50 dark:border-slate-800/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-2 group/contact cursor-pointer">
                        <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/contact:text-primary-500 transition-colors">
                            <Mail size={14} />
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover/contact:text-slate-900 dark:group-hover/contact:text-white transition-colors">{clinic.email || 'N/A'}</span>
                    </div>
                    {clinic.phone && (
                        <div className="flex items-center gap-2 group/contact cursor-pointer">
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover/contact:text-emerald-500 transition-colors">
                                <Phone size={14} />
                            </div>
                            <span className="text-sm text-slate-600 dark:text-slate-400 font-medium group-hover/contact:text-slate-900 dark:group-hover/contact:text-white transition-colors">{clinic.phone}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {viewMode === 'requests' && clinic.status === RegistrationStatus.PENDING && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => onAction('approve')}
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Accept Node
                            </button>
                            <button
                                onClick={() => onAction('reject')}
                                disabled={processing}
                                className="px-6 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 font-bold text-sm transition-all disabled:opacity-50"
                            >
                                Reject Request
                            </button>
                        </div>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={() => onAction('suspend')}
                            disabled={processing}
                            className="px-6 py-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/20 font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <Ban size={16} />
                            Suspend Access
                        </button>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.SUSPENDED && (
                        <button
                            onClick={() => onAction('reactivate')}
                            disabled={processing}
                            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            <PlayCircle size={16} />
                            Restore Service
                        </button>
                    )}

                    {viewMode === 'manage' && (
                        <button
                            onClick={() => onAction('delete')}
                            disabled={processing}
                            className="p-2.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all"
                            title="Purge Node"
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
