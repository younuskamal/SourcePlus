
import React from 'react';
import {
    CheckCircle2, XCircle, Clock, Ban, Mail, Phone, MapPin,
    Calendar, Eye, Settings, Loader2, PlayCircle, Trash2, Crown,
    Database, Smartphone, Zap
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
    const isApproved = clinic.status === RegistrationStatus.APPROVED;
    const isPending = clinic.status === RegistrationStatus.PENDING;
    const isSuspended = clinic.status === RegistrationStatus.SUSPENDED;

    return (
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
            {/* Visual Accents */}
            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${isApproved ? 'bg-emerald-500' : 'bg-amber-500'
                }`}></div>

            <div className="flex items-start justify-between mb-6 relative z-10">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${isApproved ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                    {clinic.name?.charAt(0)}
                </div>
                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${isApproved ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
                    }`}>
                    {clinic.status}
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {clinic.name || 'UNNAMED_NODE'}
                    </h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate">{clinic.email || 'NO_IDENTIFIER'}</p>
                </div>

                {/* Status Bar for active clinics */}
                {subscription && isApproved && (
                    <div className="flex items-center gap-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-1.5 overflow-hidden">
                            <Crown size={14} className="text-amber-500 shrink-0" />
                            <span className="text-[10px] font-black uppercase text-slate-700 dark:text-slate-300 truncate">{subscription.license?.plan?.name || 'CUSTOM'}</span>
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700"></div>
                        <div className="flex items-center gap-1.5">
                            <Smartphone size={14} className="text-blue-500 shrink-0" />
                            <span className="text-[10px] font-black text-slate-500">{subscription.license?.activationCount || 0}/{subscription.license?.deviceLimit || 0}</span>
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <MapPin size={12} className="text-emerald-500" /> {clinic.address?.slice(0, 24) || 'GLOBAL_INSTANCE'}...
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase">
                        <Calendar size={12} className="text-emerald-500" /> SYNCED: {new Date(clinic.createdAt).toLocaleDateString()}
                    </div>
                </div>

                <div className="pt-4 flex gap-2">
                    {isApproved && (
                        <button
                            onClick={onControls}
                            className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10"
                        >
                            Node Control
                        </button>
                    )}

                    {isPending && viewMode === 'requests' && (
                        <>
                            <button
                                onClick={() => onAction('approve')}
                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 active:scale-95 transition-all shadow-lg shadow-emerald-600/20"
                            >
                                Authorize
                            </button>
                            <button
                                onClick={() => onAction('reject')}
                                className="flex-1 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-all active:scale-95"
                            >
                                Deny
                            </button>
                        </>
                    )}

                    {!isPending && (
                        <button
                            onClick={() => onSelect(clinic)}
                            className="p-3 bg-slate-100 dark:bg-slate-700/50 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl transition-all"
                        >
                            <Eye size={18} />
                        </button>
                    )}

                    {viewMode === 'manage' && (
                        <div className="flex gap-2">
                            {isApproved ? (
                                <button
                                    onClick={() => onAction('suspend')}
                                    className="p-3 bg-amber-50 text-amber-600 rounded-xl hover:bg-amber-100 transition-all"
                                    title="Revoke Access"
                                >
                                    <Ban size={18} />
                                </button>
                            ) : isSuspended ? (
                                <button
                                    onClick={() => onAction('reactivate')}
                                    className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-all"
                                    title="Restore Access"
                                >
                                    <PlayCircle size={18} />
                                </button>
                            ) : null}
                            <button
                                onClick={() => onAction('delete')}
                                className="p-3 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition-all"
                                title="Purge Node"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicCard;
