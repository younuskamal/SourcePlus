
import React from 'react';
import {
    CheckCircle2, XCircle, Clock, Ban, Mail, Phone, MapPin,
    Calendar, Eye, Settings, Loader2, PlayCircle, Trash2, Crown
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
        [RegistrationStatus.APPROVED]: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400',
        [RegistrationStatus.PENDING]: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400',
        [RegistrationStatus.SUSPENDED]: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400',
        [RegistrationStatus.REJECTED]: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400'
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">

                {/* Info Section */}
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {clinic.name || 'Unknown Clinic'}
                        </h3>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${statusColors[clinic.status]}`}>
                            {clinic.status}
                        </span>
                    </div>

                    <div className="text-sm text-slate-500 dark:text-slate-400 space-y-1">
                        <div className="flex flex-wrap gap-4">
                            <span className="flex items-center gap-1">
                                <Mail size={14} /> {clinic.email || 'No email'}
                            </span>
                            {clinic.phone && (
                                <span className="flex items-center gap-1">
                                    <Phone size={14} /> {clinic.phone}
                                </span>
                            )}
                            {clinic.address && (
                                <span className="flex items-center gap-1">
                                    <MapPin size={14} /> {clinic.address}
                                </span>
                            )}
                            <span className="flex items-center gap-1">
                                <Calendar size={14} /> {new Date(clinic.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                    </div>

                    {/* Resources / Subscription Info */}
                    {subscription && clinic.status === RegistrationStatus.APPROVED && (
                        <div className="mt-3 flex items-center gap-4 text-sm bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                                <Crown size={14} className="text-amber-500" />
                                {subscription.license?.plan?.name || 'No Plan'}
                            </div>
                            <div className="text-slate-500">
                                {subscription.license?.activationCount || 0} / {subscription.license?.deviceLimit || 0} Devices
                            </div>
                            {subscription.remainingDays !== undefined && (
                                <div className={`${subscription.remainingDays < 30 ? 'text-rose-500' : 'text-emerald-600'} font-medium`}>
                                    {subscription.remainingDays} days remaining
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions Section */}
                <div className="flex items-center gap-2 mt-4 md:mt-0">
                    <button
                        onClick={() => onSelect(clinic)}
                        className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors"
                        title="View Details"
                    >
                        <Eye size={18} />
                    </button>

                    {clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={onControls}
                            className="p-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                            title="Manage Controls"
                        >
                            <Settings size={18} />
                        </button>
                    )}

                    {viewMode === 'requests' && clinic.status === RegistrationStatus.PENDING && (
                        <>
                            <button
                                onClick={() => onAction('approve')}
                                disabled={processing}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1"
                            >
                                {processing ? <Loader2 className="animate-spin" size={14} /> : <CheckCircle2 size={14} />}
                                Approve
                            </button>
                            <button
                                onClick={() => onAction('reject')}
                                disabled={processing}
                                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-sm font-medium rounded transition-colors flex items-center gap-1"
                            >
                                {processing ? <Loader2 className="animate-spin" size={14} /> : <XCircle size={14} />}
                                Reject
                            </button>
                        </>
                    )}

                    {viewMode === 'manage' && (
                        <>
                            {clinic.status === RegistrationStatus.APPROVED && (
                                <button
                                    onClick={() => onAction('suspend')}
                                    disabled={processing}
                                    className="p-2 text-amber-600 hover:text-amber-700 transition-colors"
                                    title="Suspend"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={18} /> : <Ban size={18} />}
                                </button>
                            )}

                            {clinic.status === RegistrationStatus.SUSPENDED && (
                                <button
                                    onClick={() => onAction('reactivate')}
                                    disabled={processing}
                                    className="p-2 text-emerald-600 hover:text-emerald-700 transition-colors"
                                    title="Reactivate"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={18} /> : <PlayCircle size={18} />}
                                </button>
                            )}

                            <button
                                onClick={() => onAction('delete')}
                                disabled={processing}
                                className="p-2 text-rose-500 hover:text-rose-700 transition-colors"
                                title="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClinicCard;
