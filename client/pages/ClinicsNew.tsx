import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, ClinicSubscriptionStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
import ClinicControlDashboard from '../components/ClinicControlDashboard';
import {
    Building2, Search, Loader2, CheckCircle2, XCircle, Clock,
    Mail, Phone, MapPin, Calendar, Settings,
    AlertCircle, RefreshCw, Ban, PlayCircle, Trash2, Filter, X
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
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>(
        viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL'
    );
    const [processing, setProcessing] = useState<string | null>(null);
    const [activeClinicId, setActiveClinicId] = useState<string | null>(null);
    const [controlsModal, setControlsModal] = useState<Clinic | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: ActionType; clinic: Clinic } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [lastUpdated, setLastUpdated] = useState<string | null>(null);

    // Fetch data
    useEffect(() => {
        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null); // Clear previous errors

            console.log('🔍 Loading clinics data...');

            const clinicsData = await api.getClinics();

            // Validate response
            if (!Array.isArray(clinicsData)) {
                throw new Error('❌ Clinics data is not in correct format');
            }
            console.log(`✅ Loaded ${clinicsData.length} clinics`);

            setClinics(clinicsData);

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
            setLastUpdated(new Date().toISOString());

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

    useEffect(() => {
        if (filteredClinics.length === 0) {
            setActiveClinicId(null);
            return;
        }
        if (!activeClinicId || !filteredClinics.some(c => c.id === activeClinicId)) {
            setActiveClinicId(filteredClinics[0].id);
        }
    }, [filteredClinics, activeClinicId]);

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

    const activeClinic = activeClinicId
        ? filteredClinics.find(c => c.id === activeClinicId) || null
        : filteredClinics[0] || null;
    const activeSubscription = activeClinic ? subscriptions[activeClinic.id] : undefined;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-950">
                <Loader2 className="animate-spin text-slate-500 dark:text-slate-300" size={40} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
            <div className="max-w-7xl mx-auto p-6 space-y-6">

                {/* Header */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center shadow-sm">
                                <Building2 size={24} />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                                    {viewMode === 'requests' ? 'Clinic Requests' : 'Clinics Management'}
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
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
                            className="px-4 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 text-sm font-medium"
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
                            color="slate"
                        />
                        <StatCard
                            title="Approved"
                            value={stats.approved}
                            icon={CheckCircle2}
                            color="emerald"
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
                            color="rose"
                        />
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800">
                    <div className="flex flex-wrap gap-3">
                        {/* Search */}
                        <div className="flex-1 min-w-[300px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Search by name, email, phone, or address..."
                                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
                                />
                            </div>
                        </div>

                        {/* Status Filter */}
                        <div className="flex items-center gap-2">
                            <Filter size={20} className="text-slate-400" />
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-4 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-slate-900 dark:focus:ring-white"
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
                                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 text-sm font-medium"
                            >
                                <X size={16} />
                                <span>Clear</span>
                            </button>
                        )}
                    </div>

                    {/* Results Count */}
                    <div className="mt-3 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
                        Showing <span className="font-semibold text-slate-900 dark:text-white">{filteredClinics.length}</span> of {clinics.length} clinics
                    </div>
                </div>

                {/* Clinics Grid */}
                {error ? (
                    <div className="bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-800 rounded-2xl p-8">
                        <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                                <AlertCircle className="text-rose-500" size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
                                    Unable to load clinics
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                                    {error}
                                </p>
                                <div className="flex gap-3">
                                    <button
                                        onClick={loadData}
                                        className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition-colors"
                                    >
                                        Retry
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                    >
                                        Refresh Page
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : filteredClinics.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <Building2 className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={48} />
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                            No clinics found
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {search || statusFilter !== 'ALL'
                                ? 'Try adjusting your filters'
                                : 'No clinics have been registered yet'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 px-5 py-4">
                                <div>
                                    <p className="text-sm font-semibold text-slate-900 dark:text-white">
                                        {viewMode === 'requests' ? 'Incoming Requests' : 'Active Clinics'}
                                    </p>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Showing {filteredClinics.length} of {clinics.length} synced from backend
                                    </p>
                                </div>
                                <div className="text-xs text-slate-500 dark:text-slate-400">
                                    Last synced:{' '}
                                    {lastUpdated ? new Date(lastUpdated).toLocaleString() : 'Loading...'}
                                </div>
                            </div>
                            <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                                {filteredClinics.map((clinic) => (
                                    <ClinicListRow
                                        key={clinic.id}
                                        clinic={clinic}
                                        subscription={subscriptions[clinic.id]}
                                        isActive={activeClinic?.id === clinic.id}
                                        onSelect={() => setActiveClinicId(clinic.id)}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-4">
                            {activeClinic ? (
                                <ClinicDetailPanel
                                    clinic={activeClinic}
                                    subscription={activeSubscription}
                                    viewMode={viewMode}
                                    lastUpdated={lastUpdated}
                                    onOpenControls={() => setControlsModal(activeClinic)}
                                    onTriggerAction={(type) => setConfirmAction({ type, clinic: activeClinic })}
                                    isProcessing={processing === activeClinic.id}
                                />
                            ) : (
                                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-500 dark:text-slate-400">
                                    Select a clinic from the list to view full details
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
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
    color: 'slate' | 'emerald' | 'amber' | 'rose';
}> = ({ title, value, icon: Icon, color }) => {
    const palette = {
        slate: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-200',
        emerald: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300',
        amber: 'text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300',
        rose: 'text-rose-700 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300'
    };

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">{title}</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold ${palette[color]}`}>
                    <Icon size={20} />
                </div>
            </div>
        </div>
    );
};

const listStatusStyles: Record<RegistrationStatus, string> = {
    [RegistrationStatus.APPROVED]: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
    [RegistrationStatus.PENDING]: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
    [RegistrationStatus.SUSPENDED]: 'bg-rose-50 text-rose-700 dark:bg-rose-900/20 dark:text-rose-300',
    [RegistrationStatus.REJECTED]: 'bg-slate-100 text-slate-600 dark:bg-slate-800/70 dark:text-slate-200'
};

const ClinicListRow: React.FC<{
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    isActive: boolean;
    onSelect: () => void;
}> = ({ clinic, subscription, isActive, onSelect }) => {
    const planName = subscription?.planName || clinic.license?.plan?.name || 'Unassigned';
    const remaining = subscription?.remainingDays;
    const location = clinic.address || 'Location not provided';

    return (
        <button
            onClick={onSelect}
            className={`w-full text-left px-5 py-4 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 ${
                isActive ? 'bg-slate-50 dark:bg-slate-800/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/30'
            }`}
        >
            <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-white truncate">{clinic.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{clinic.email}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${listStatusStyles[clinic.status]}`}>
                    {clinic.status}
                </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                <span>Plan: <span className="text-slate-900 dark:text-white font-medium">{planName}</span></span>
                <span>Created: {new Date(clinic.createdAt).toLocaleDateString()}</span>
                <span>{location}</span>
                {typeof remaining === 'number' && <span>Remaining: {remaining} days</span>}
            </div>
        </button>
    );
};

const ClinicDetailPanel: React.FC<{
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    viewMode: ClinicsProps['viewMode'];
    lastUpdated: string | null;
    onOpenControls: () => void;
    onTriggerAction: (type: ActionType) => void;
    isProcessing: boolean;
}> = ({ clinic, subscription, viewMode, lastUpdated, onOpenControls, onTriggerAction, isProcessing }) => {
    const userCount = clinic.users?.length ?? 0;
    const planName = subscription?.planName || clinic.license?.plan?.name || 'Unassigned';
    const licenseSerial = subscription?.license?.serial || clinic.license?.serial;
    const expireDate = subscription?.license?.expireDate || clinic.license?.expireDate;
    const subscriptionStatus = subscription ? (subscription.isActive ? 'Active' : 'Inactive') : 'No subscription';
    const planDuration = subscription?.license?.plan?.durationMonths ?? clinic.license?.plan?.durationMonths;

    const summaryStats = [
        { label: 'Active users', value: String(userCount) },
        { label: 'Plan term', value: planDuration ? `${planDuration} months` : 'Not assigned' },
        { label: 'Force logout', value: subscription?.forceLogout ? 'Enabled' : 'Normal' }
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">Clinic Overview</p>
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{clinic.name}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Doctor: <span className="font-medium text-slate-900 dark:text-white">{clinic.doctorName || 'Not provided'}</span>
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Synced {lastUpdated ? new Date(lastUpdated).toLocaleString() : '...'}
                    </p>
                </div>
                <button
                    onClick={onOpenControls}
                    className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                    <Settings size={16} />
                    Control Panel
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {summaryStats.map((stat) => (
                    <DetailStat key={stat.label} label={stat.label} value={stat.value} />
                ))}
            </div>

            <DetailSection title="Contact Information">
                <DetailRow label="Email" value={clinic.email} />
                <DetailRow label="Phone" value={clinic.phone || 'No phone provided'} />
                <DetailRow label="Address" value={clinic.address || 'No address provided'} />
                <DetailRow label="Registered" value={new Date(clinic.createdAt).toLocaleString()} />
            </DetailSection>

            <DetailSection title="Subscription & License">
                <DetailRow label="Plan" value={planName} />
                <DetailRow label="Status" value={subscriptionStatus} />
                {typeof subscription?.remainingDays === 'number' && (
                    <DetailRow label="Remaining days" value={`${subscription.remainingDays} days`} />
                )}
                <DetailRow label="License Serial" value={licenseSerial || 'Not issued'} mono />
                <DetailRow label="Expires" value={expireDate ? new Date(expireDate).toLocaleDateString() : 'Not scheduled'} />
            </DetailSection>

            <DetailSection title="System">
                <DetailRow label="System Version" value={clinic.systemVersion || 'Not provided'} />
                <DetailRow label="Last Updated" value={new Date(clinic.updatedAt).toLocaleString()} />
            </DetailSection>

            <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Actions</p>
                {viewMode === 'requests' && clinic.status === RegistrationStatus.PENDING && (
                    <div className="flex flex-wrap gap-3">
                        <button
                            onClick={() => onTriggerAction('approve')}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                        >
                            Approve
                        </button>
                        <button
                            onClick={() => onTriggerAction('reject')}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 disabled:opacity-50"
                        >
                            Reject
                        </button>
                    </div>
                )}
                {viewMode === 'manage' && (
                    <div className="flex flex-wrap gap-3">
                        {clinic.status === RegistrationStatus.APPROVED && (
                            <button
                                onClick={() => onTriggerAction('suspend')}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-lg bg-amber-600 text-white text-sm font-semibold hover:bg-amber-500 disabled:opacity-50"
                            >
                                Suspend
                            </button>
                        )}
                        {clinic.status === RegistrationStatus.SUSPENDED && (
                            <button
                                onClick={() => onTriggerAction('reactivate')}
                                disabled={isProcessing}
                                className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-500 disabled:opacity-50"
                            >
                                Reactivate
                            </button>
                        )}
                        <button
                            onClick={() => onTriggerAction('delete')}
                            disabled={isProcessing}
                            className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-500 disabled:opacity-50"
                        >
                            Delete
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const DetailSection: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div>
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-2">{title}</p>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-200 dark:divide-slate-800">
            {children}
        </div>
    </div>
);

const DetailRow: React.FC<{ label: string; value: React.ReactNode; mono?: boolean }> = ({ label, value, mono }) => (
    <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-slate-500 dark:text-slate-400">{label}</span>
        <span className={`text-slate-900 dark:text-white font-medium text-right ml-6 ${mono ? 'font-mono text-xs' : ''}`}>
            {value ?? '—'}
        </span>
    </div>
);

const DetailStat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
        <p className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</p>
        <p className="text-xl font-semibold text-slate-900 dark:text-white mt-1">{value}</p>
    </div>
);


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
        approve: { title: 'Approve Clinic', accent: 'emerald', icon: CheckCircle2 },
        reject: { title: 'Reject Clinic', accent: 'rose', icon: XCircle },
        suspend: { title: 'Suspend Clinic', accent: 'amber', icon: Ban },
        reactivate: { title: 'Reactivate Clinic', accent: 'emerald', icon: PlayCircle },
        delete: { title: 'Delete Clinic', accent: 'rose', icon: Trash2 }
    } as const;

    const accentStyles = {
        emerald: {
            pill: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-300',
            button: 'bg-emerald-600 hover:bg-emerald-500'
        },
        rose: {
            pill: 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-300',
            button: 'bg-rose-600 hover:bg-rose-500'
        },
        amber: {
            pill: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-300',
            button: 'bg-amber-600 hover:bg-amber-500'
        }
    };

    const config = actionConfig[action.type];
    const palette = accentStyles[config.accent];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-xl ${palette.pill}`}>
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
                        className={`flex-1 px-4 py-2 rounded-lg ${palette.button} text-white font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2`}
                    >
                        {processing ? <Loader2 className="animate-spin" size={16} /> : <Icon size={16} />}
                        {processing ? 'Processing...' : config.title.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Clinics;
