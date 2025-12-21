import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import ClinicControlDashboard from '../components/ClinicControlDashboard';
import {
    Building2, Search, Loader2, CheckCircle2, XCircle, Clock,
    Mail, Phone, MapPin, Calendar, Settings, Eye, Lock, Unlock,
    AlertCircle, Crown, TrendingUp, Users, HardDrive, Zap,
    RefreshCw, Ban, PlayCircle, Trash2, Filter, X
} from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {
    const { t } = useTranslation();

    // State
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [subscriptions, setSubscriptions] = useState<Record<string, ClinicSubscriptionStatus>>({});
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>(
        viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL'
    );
    const [processing, setProcessing] = useState<string | null>(null);
    const [selectedClinic, setSelectedClinic] = useState<Clinic | null>(null);
    const [controlsModal, setControlsModal] = useState<Clinic | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: ActionType; clinic: Clinic } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors

            console.log('🔍 Loading clinics data...');

            const [clinicsData, plansData] = await Promise.all([
                api.getClinics(),
                api.getSubscriptionPlans()
            ]);

            // Validate response
            if (!Array.isArray(clinicsData)) {
                throw new Error('❌ Clinics data is not in correct format');
            }

            if (!Array.isArray(plansData)) {
                throw new Error('❌ Plans data is not in correct format');
            }

            console.log(`✅ Loaded ${clinicsData.length} clinics and ${plansData.length} plans`);

            setClinics(clinicsData);
            setPlans(plansData);

            // Fetch subscriptions
            console.log('🔍 Loading subscription statuses...');
            const subs = await Promise.all(
                clinicsData.map(async (clinic) => {
                    try {
                        const status = await api.getSubscriptionStatus(clinic.id);
                        return [clinic.id, status] as const;
                    } catch (err) {
                        console.warn(`⚠️ Failed to load subscription for clinic ${clinic.id}:`, err);
                        return null;
                    }
                })
            );

            const subscriptionsMap = Object.fromEntries(subs.filter(s => s !== null));
            setSubscriptions(subscriptionsMap);

            console.log(`✅ Loaded ${Object.keys(subscriptionsMap).length} subscription statuses`);

        } catch (error: any) {
            console.error('❌ Failed to load clinics data:', error);

            // Determine user-friendly error message
            let errorMessage = 'Failed to load clinics data';

            if (error.response) {
                errorMessage = error.response.data?.message || `Server error: ${error.response.status}`;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            setClinics([]); // Clear clinics on error
            setPlans([]);

            console.error('📊 Error details:', {
                message: errorMessage,
                response: error.response,
                stack: error.stack
            });

        } finally {
            setLoading(false);
        }
    };

    // Filtered clinics
    const filteredClinics = useMemo(() => {
        return clinics.filter(clinic => {
            const matchesSearch = search === '' ||
                clinic.name.toLowerCase().includes(search.toLowerCase()) ||
                clinic.email.toLowerCase().includes(search.toLowerCase()) ||
                clinic.phone?.includes(search) ||
                clinic.address?.toLowerCase().includes(search.toLowerCase());

            const matchesStatus = statusFilter === 'ALL' || clinic.status === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [clinics, search, statusFilter]);

    // Actions
    const handleAction = async (type: ActionType, clinic: Clinic) => {
        if (type === 'reject' && !rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessing(clinic.id);

            switch (type) {
                case 'approve':
                    await api.approveClinic(clinic.id);
                    break;
                case 'reject':
                    await api.rejectClinic(clinic.id, rejectReason);
                    break;
                case 'suspend':
                    await api.updateClinicStatus(clinic.id, RegistrationStatus.SUSPENDED);
                    break;
                case 'reactivate':
                    await api.updateClinicStatus(clinic.id, RegistrationStatus.APPROVED);
                    break;
                case 'delete':
                    await api.deleteClinic(clinic.id);
                    break;
            }

            setConfirmAction(null);
            setRejectReason('');
            await loadData();
        } catch (error) {
            console.error(`Failed to ${type} clinic:`, error);
            alert(`Failed to ${type} clinic`);
        } finally {
            setProcessing(null);
        }
    };

    // Stats
    const stats = useMemo(() => {
        return {
            total: clinics.length,
            approved: clinics.filter(c => c.status === RegistrationStatus.APPROVED).length,
            pending: clinics.filter(c => c.status === RegistrationStatus.PENDING).length,
            suspended: clinics.filter(c => c.status === RegistrationStatus.SUSPENDED).length,
        };
    }, [clinics]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="animate-spin text-purple-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <div className="max-w-[1800px] mx-auto p-6">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg">
                                <Building2 size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                                    {viewMode === 'requests' ? 'Clinic Requests' : 'Clinics Management'}
                                </h1>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">
                                    {viewMode === 'requests'
                                        ? 'Review and approve clinic registration requests'
                                        : 'Manage all registered clinics and their subscriptions'
                                    }
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={loadData}
                            disabled={loading}
                            className="px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                            <span className="font-medium">Refresh</span>
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <StatCard
                            title="Total Clinics"
                            value={stats.total}
                            icon={Building2}
                            color="blue"
                        />
                        <StatCard
                            title="Approved"
                            value={stats.approved}
                            icon={CheckCircle2}
                            color="green"
                        />
                        <StatCard
                            title="Pending"
                            value={stats.pending}
                            icon={Clock}
                            color="amber"
                        />
                        <StatCard
                            title="Suspended"
                            value={stats.suspended}
                            icon={Ban}
                            color="red"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="mb-6 bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border border-slate-200 dark:border-slate-700">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name, email, phone, or address..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white"
                            >
                                <option value="ALL">All Status</option>
                                <option value={RegistrationStatus.PENDING}>Pending</option>
                                <option value={RegistrationStatus.APPROVED}>Approved</option>
                                <option value={RegistrationStatus.SUSPENDED}>Suspended</option>
                                <option value={RegistrationStatus.REJECTED}>Rejected</option>
                            </select>
                        </div>

                        {/* Clear Filters */}
                        {(search || statusFilter !== 'ALL') && (
                            <button
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('ALL');
                                }}
                                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-all flex items-center gap-2"
                            >
                                <X size={16} />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                        Showing <span className="font-semibold text-purple-600">{filteredClinics.length}</span> of {clinics.length} clinics
                    </div>
                </div>

                {/* Clinics Grid */}
                {error ? (
                    <div className="bg-rose-50 dark:bg-rose-900/20 border-2 border-rose-200 dark:border-rose-800 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <AlertCircle className="text-rose-600 dark:text-rose-400" size={48} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-bold text-rose-900 dark:text-rose-200 mb-2">
                                    ⚠️ Error Loading Clinics
                                </h3>
                                <p className="text-rose-700 dark:text-rose-300 mb-6 text-lg">
                                    {error}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={loadData}
                                        className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        <RefreshCw size={20} />
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-xl font-medium transition-all flex items-center gap-2 shadow-sm"
                                    >
                                        Refresh Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : filteredClinics.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                        <Building2 className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                            No clinics found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400">
                            {search || statusFilter !== 'ALL'
                                ? 'Try adjusting your filters'
                                : 'No clinics have been registered yet'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {filteredClinics.map((clinic) => (
                            <ClinicCard
                                key={clinic.id}
                                clinic={clinic}
                                subscription={subscriptions[clinic.id]}
                                onSelect={setSelectedClinic}
                                onAction={(type) => setConfirmAction({ type, clinic })}
                                onControls={() => setControlsModal(clinic)}
                                processing={processing === clinic.id}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedClinic && (
                <ClinicDetailsModal
                    clinic={selectedClinic}
                    subscription={subscriptions[selectedClinic.id]}
                    onClose={() => setSelectedClinic(null)}
                />
            )}

            {controlsModal && (
                <ClinicControlDashboard
                    clinic={controlsModal}
                    onClose={() => setControlsModal(null)}
                    onUpdate={loadData}
                />
            )}

            {confirmAction && (
                <ConfirmActionModal
                    action={confirmAction}
                    rejectReason={rejectReason}
                    setRejectReason={setRejectReason}
                    onConfirm={() => handleAction(confirmAction.type, confirmAction.clinic)}
                    onCancel={() => {
                        setConfirmAction(null);
                        setRejectReason('');
                    }}
                    processing={processing !== null}
                />
            )}
        </div>
    );
};

// Stat Card Component
const StatCard: React.FC<{
    title: string;
    value: number;
    icon: React.ElementType;
    color: 'blue' | 'green' | 'amber' | 'red';
}> = ({ title, value, icon: Icon, color }) => {
    const colors = {
        blue: 'from-blue-500 to-cyan-500',
        green: 'from-emerald-500 to-teal-500',
        amber: 'from-amber-500 to-orange-500',
        red: 'from-rose-500 to-pink-500'
    };

    return (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
                <div className={`p-4 rounded-xl bg-gradient-to-br ${colors[color]} text-white`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    );
};

// Clinic Card Component
const ClinicCard: React.FC<{
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    onSelect: (clinic: Clinic) => void;
    onAction: (type: ActionType) => void;
    onControls: () => void;
    processing: boolean;
    viewMode: 'requests' | 'manage';
}> = ({ clinic, subscription, onSelect, onAction, onControls, processing, viewMode }) => {

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
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 hover:shadow-md transition-all">
            <div className="flex items-start justify-between gap-4">
                {/* Left: Clinic Info */}
                <div className="flex-1">
                    <div className="flex items-start gap-4">
                        {/* Logo/Icon */}
                        <div className="flex-shrink-0">
                            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-2xl font-bold">
                                {clinic.name.charAt(0).toUpperCase()}
                            </div>
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate">
                                    {clinic.name}
                                </h3>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${statusColors[clinic.status]}`}>
                                    <StatusIcon size={14} />
                                    {clinic.status}
                                </span>
                            </div>

                            {/* Info Grid */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Mail size={16} className="text-slate-400" />
                                    <span className="truncate">{clinic.email}</span>
                                </div>

                                {clinic.phone && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <Phone size={16} className="text-slate-400" />
                                        <span>{clinic.phone}</span>
                                    </div>
                                )}

                                {clinic.address && (
                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                        <MapPin size={16} className="text-slate-400" />
                                        <span className="truncate">{clinic.address}</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                                    <Calendar size={16} className="text-slate-400" />
                                    <span>{new Date(clinic.createdAt).toLocaleDateString()}</span>
                                </div>
                            </div>

                            {/* Subscription Info */}
                            {subscription && clinic.status === RegistrationStatus.APPROVED && (
                                <div className="mt-3 flex items-center gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Crown size={16} className="text-amber-500" />
                                        <span className="text-slate-600 dark:text-slate-300">
                                            Plan: <span className="font-semibold text-slate-900 dark:text-white">{subscription.planName}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <TrendingUp size={16} className={subscription.isActive ? "text-emerald-500" : "text-rose-500"} />
                                        <span className={subscription.isActive ? "text-emerald-600 font-semibold" : "text-rose-600 font-semibold"}>
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
                <div className="flex items-center gap-2">
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
                        <>
                            <button
                                onClick={() => onAction('approve')}
                                disabled={processing}
                                className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
                                Approve
                            </button>
                            <button
                                onClick={() => onAction('reject')}
                                disabled={processing}
                                className="px-4 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {processing ? <Loader2 className="animate-spin" size={16} /> : <XCircle size={16} />}
                                Reject
                            </button>
                        </>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.APPROVED && (
                        <button
                            onClick={() => onAction('suspend')}
                            disabled={processing}
                            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="animate-spin" size={16} /> : <Ban size={16} />}
                            Suspend
                        </button>
                    )}

                    {viewMode === 'manage' && clinic.status === RegistrationStatus.SUSPENDED && (
                        <button
                            onClick={() => onAction('reactivate')}
                            disabled={processing}
                            className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-medium transition-all disabled:opacity-50 flex items-center gap-2"
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

// Clinic Details Modal
const ClinicDetailsModal: React.FC<{
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    onClose: () => void;
}> = ({ clinic, subscription, onClose }) => {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-2xl font-bold">
                                {clinic.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{clinic.name}</h2>
                                <p className="text-white/80">Clinic Details</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-all"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Basic Info */}
                    <Section title="Basic Information">
                        <InfoRow label="Clinic Name" value={clinic.name} />
                        <InfoRow label="Email" value={clinic.email} icon={Mail} />
                        <InfoRow label="Phone" value={clinic.phone || '-'} icon={Phone} />
                        <InfoRow label="Address" value={clinic.address || '-'} icon={MapPin} />
                        <InfoRow label="Status" value={clinic.status} badge />
                        <InfoRow label="Registered" value={new Date(clinic.createdAt).toLocaleString()} icon={Calendar} />
                    </Section>

                    {/* Subscription Info */}
                    {subscription && (
                        <Section title="Subscription Details">
                            <InfoRow label="Plan" value={subscription.planName} icon={Crown} />
                            <InfoRow label="Status" value={subscription.isActive ? 'Active' : 'Inactive'} badge />
                            {subscription.expiresAt && (
                                <InfoRow label="Expires" value={new Date(subscription.expiresAt).toLocaleString()} />
                            )}
                        </Section>
                    )}

                    {/* IDs Section */}
                    <Section title="System IDs">
                        <InfoRow label="Clinic ID" value={clinic.id} mono />
                        {clinic.licenseSerial && (
                            <InfoRow label="License Serial" value={clinic.licenseSerial} mono />
                        )}
                    </Section>
                </div>
            </div>
        </div>
    );
};

// Confirm Action Modal
const ConfirmActionModal: React.FC<{
    action: { type: ActionType; clinic: Clinic };
    rejectReason: string;
    setRejectReason: (reason: string) => void;
    onConfirm: () => void;
    onCancel: () => void;
    processing: boolean;
}> = ({ action, rejectReason, setRejectReason, onConfirm, onCancel, processing }) => {
    const actionConfig = {
        approve: { title: 'Approve Clinic', color: 'emerald', icon: CheckCircle2 },
        reject: { title: 'Reject Clinic', color: 'rose', icon: XCircle },
        suspend: { title: 'Suspend Clinic', color: 'amber', icon: Ban },
        reactivate: { title: 'Reactivate Clinic', color: 'emerald', icon: PlayCircle },
        delete: { title: 'Delete Clinic', color: 'rose', icon: Trash2 }
    };

    const config = actionConfig[action.type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl bg-${config.color}-100 dark:bg-${config.color}-900/30 text-${config.color}-600`}>
                        <Icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{config.title}</h3>
                </div>

                <p className="text-slate-600 dark:text-slate-300 mb-4">
                    Are you sure you want to {action.type} <strong>{action.clinic.name}</strong>?
                </p>

                {action.type === 'reject' && (
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                            Rejection Reason *
                        </label>
                        <textarea
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            placeholder="Please provide a reason for rejection..."
                            className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-slate-700 dark:text-white resize-none"
                            rows={3}
                        />
                    </div>
                )}

                <div className="flex gap-3">
                    <button
                        onClick={onCancel}
                        disabled={processing}
                        className="flex-1 px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white font-medium transition-all disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={processing}
                        className={`flex-1 px-4 py-2 rounded-lg bg-${config.color}-500 hover:bg-${config.color}-600 text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
                        {processing ? 'Processing...' : config.title.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
};

// Helper Components
const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
        <div className="space-y-2">
            {children}
        </div>
    </div>
);

const InfoRow: React.FC<{
    label: string;
    value: string;
    icon?: React.ElementType;
    badge?: boolean;
    mono?: boolean;
}> = ({ label, value, icon: Icon, badge, mono }) => (
    <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-700 last:border-0">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 flex items-center gap-2">
            {Icon && <Icon size={16} />}
            {label}
        </span>
        {badge ? (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                {value}
            </span>
        ) : (
            <span className={`text-sm text-slate-900 dark:text-white ${mono ? 'font-mono text-xs' : ''}`}>
                {value}
            </span>
        )}
    </div>
);

export default Clinics;
