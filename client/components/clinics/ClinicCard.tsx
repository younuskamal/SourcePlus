import React from 'react';
import {
    CheckCircle2, XCircle, Clock, Ban, Mail, Phone, MapPin,
    Calendar, Eye, Settings, Loader2, PlayCircle, Trash2, Crown,
    TrendingUp, Building2, Sparkles
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
            badge: 'glass-gradient-emerald text-emerald-700 dark:text-emerald-300',
            icon: CheckCircle2,
            gradient: 'from-emerald-500 to-teal-500',
            glow: 'rgba(16, 185, 129, 0.3)'
        },
        [RegistrationStatus.PENDING]: {
            badge: 'glass-gradient-amber text-amber-700 dark:text-amber-300',
            icon: Clock,
            gradient: 'from-amber-500 to-orange-500',
            glow: 'rgba(245, 158, 11, 0.3)'
        },
        [RegistrationStatus.SUSPENDED]: {
            badge: 'glass-gradient-rose text-rose-700 dark:text-rose-300',
            icon: Ban,
            gradient: 'from-rose-500 to-pink-500',
            glow: 'rgba(244, 63, 94, 0.3)'
        },
        [RegistrationStatus.REJECTED]: {
            badge: 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
            icon: XCircle,
            gradient: 'from-slate-500 to-slate-600',
            glow: 'rgba(100, 116, 139, 0.3)'
        }
    };

    const config = statusConfig[clinic.status];
    const StatusIcon = config.icon;

    return (
        <div className="glass-card p-6 group relative overflow-hidden">
            {/* Animated Gradient Border on Hover */}
            <div
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${config.glow}, transparent)`,
                    zIndex: 0
                }}
            />

            <div className="relative z-10">
                <div className="flex items-start gap-4">
                    {/* Left: Clinic Avatar with Gradient */}
                    <div className="flex-shrink-0">
                        <div className="relative group/avatar">
                            {/* Glow Effect */}
                            <div
                                className={`absolute inset-0 rounded-xl bg-gradient-to-br ${config.gradient} blur-md opacity-50 group-hover/avatar:opacity-75 transition-opacity`}
                            />

                            {/* Avatar */}
                            <div className={`relative w-16 h-16 rounded-xl bg-gradient-to-br ${config.gradient} flex items-center justify-center text-white text-2xl font-bold shadow-lg transform transition-transform group-hover/avatar:scale-110`}>
                                {clinic.name ? clinic.name.charAt(0).toUpperCase() : <Building2 size={28} />}
                            </div>
                        </div>
                    </div>

                    {/* Middle: Clinic Info */}
                    <div className="flex-1 min-w-0">
                        {/* Name & Status Badge */}
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                                {clinic.name || 'Unknown Clinic'}
                            </h3>
                            <span className={`glass-badge ${config.badge} flex items-center gap-1.5 px-3 py-1`}>
                                <StatusIcon size={14} strokeWidth={2.5} />
                                <span className="font-semibold text-xs uppercase tracking-wide">
                                    {clinic.status}
                                </span>
                            </span>
                        </div>

                        {/* Contact Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                            {/* Email */}
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 group/item">
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/30 transition-colors">
                                    <Mail size={14} className="text-slate-500 group-hover/item:text-purple-600 transition-colors" />
                                </div>
                                <span className="truncate">{clinic.email || 'No email'}</span>
                            </div>

                            {/* Phone */}
                            {clinic.phone && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/30 transition-colors">
                                        <Phone size={14} className="text-slate-500 group-hover/item:text-purple-600 transition-colors" />
                                    </div>
                                    <span>{clinic.phone}</span>
                                </div>
                            )}

                            {/* Address */}
                            {clinic.address && (
                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 group/item">
                                    <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/30 transition-colors">
                                        <MapPin size={14} className="text-slate-500 group-hover/item:text-purple-600 transition-colors" />
                                    </div>
                                    <span className="truncate">{clinic.address}</span>
                                </div>
                            )}

                            {/* Registration Date */}
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 group/item">
                                <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 group-hover/item:bg-purple-100 dark:group-hover/item:bg-purple-900/30 transition-colors">
                                    <Calendar size={14} className="text-slate-500 group-hover/item:text-purple-600 transition-colors" />
                                </div>
                                <span>{new Date(clinic.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* Subscription Info */}
                        {subscription && clinic.status === RegistrationStatus.APPROVED && (
                            <div className="glass-panel px-3 py-2 flex flex-wrap items-center gap-3 text-sm">
                                <div className="flex items-center gap-2">
                                    <Crown size={16} className="text-amber-500" />
                                    <span className="text-slate-600 dark:text-slate-300">
                                        <span className="font-semibold text-slate-900 dark:text-white">{subscription.planName}</span>
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${subscription.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                                    <span className={subscription.isActive ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                                        {subscription.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                {subscription.expiresAt && (
                                    <span className="text-slate-600 dark:text-slate-400">
                                        Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right: Action Buttons */}
                    <div className="flex flex-col sm:flex-row items-end sm:items-center gap-2">
                        {/* View Details Button */}
                        <button
                            onClick={() => onSelect(clinic)}
                            className="glass-button p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-all"
                            title="View Details"
                        >
                            <Eye size={18} />
                        </button>

                        {/* Controls Button (for approved clinics) */}
                        {clinic.status === RegistrationStatus.APPROVED && (
                            <button
                                onClick={onControls}
                                className="glass-button p-2.5 bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 text-purple-600 dark:text-purple-400 transition-all group/controls"
                                title="Manage Controls"
                            >
                                <Settings size={18} className="group-hover/controls:rotate-90 transition-transform duration-300" />
                            </button>
                        )}

                        {/* Status-specific Action Buttons */}
                        {viewMode === 'requests' && clinic.status === RegistrationStatus.PENDING && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => onAction('approve')}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                                >
                                    {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                    Approve
                                </button>
                                <button
                                    onClick={() => onAction('reject')}
                                    disabled={processing}
                                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
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
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                                Suspend
                            </button>
                        )}

                        {viewMode === 'manage' && clinic.status === RegistrationStatus.SUSPENDED && (
                            <button
                                onClick={() => onAction('reactivate')}
                                disabled={processing}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <PlayCircle size={16} />}
                                Reactivate
                            </button>
                        )}

                        {/* Delete Button (danger zone) */}
                        {viewMode === 'manage' && (
                            <button
                                onClick={() => onAction('delete')}
                                disabled={processing}
                                className="glass-button p-2.5 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-all disabled:opacity-50"
                                title="Delete Clinic"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ClinicCard;
