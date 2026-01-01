import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import {
    StatCard,
    ClinicFilters,
    ClinicCard,
    ConfirmActionModal,
    ErrorAlert,
    ClinicsHeader
} from '../components/clinics';
import ClinicControlDashboard from '../components/ClinicControlDashboard';
import { useTranslation } from '../hooks/useTranslation';
import { Building2, CheckCircle2, Clock, Ban, Loader2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {
    const { t } = useTranslation();
    const navigate = useNavigate();

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
    const [confirmAction, setConfirmAction] = useState<{ type: ActionType; clinic: Clinic } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState<string | null>(null);

    // Fetch data on mount and viewMode change
    useEffect(() => {
        // Reset filters when switching views to ensure "Clear Filters" doesn't show up on first entry
        setSearch('');
        setStatusFilter(viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL');

        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            console.log('🔍 Loading clinics data...');


            const [clinicsData, plansData] = await Promise.all([
                api.getClinics(),
                api.getPlans()
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

            // Fetch subscriptions for approved clinics
            console.log('🔍 Loading subscription statuses...');
            const subs = await Promise.all(
                clinicsData
                    .filter(c => c.status === RegistrationStatus.APPROVED)
                    .map(async (clinic) => {
                        try {
                            const status = await api.getSubscriptionStatus(clinic.id);
                            return [clinic.id, status] as const;
                        } catch (err) {
                            console.warn(`⚠️ Failed to load subscription for clinic ${clinic.id}: `, err);
                            return null;
                        }
                    })
            );

            const subscriptionsMap = Object.fromEntries(subs.filter(s => s !== null));
            setSubscriptions(subscriptionsMap);

            console.log(`✅ Loaded ${Object.keys(subscriptionsMap).length} subscription statuses`);

        } catch (error: any) {
            console.error('❌ Failed to load clinics data:', error);

            let errorMessage = 'Failed to load clinics data';

            if (error.response) {
                errorMessage = error.response.data?.message || `Server error: ${error.response.status} `;
            } else if (error.message) {
                errorMessage = error.message;
            }

            setError(errorMessage);
            setClinics([]);
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
                (clinic.name && clinic.name.toLowerCase().includes(search.toLowerCase())) ||
                (clinic.email && clinic.email.toLowerCase().includes(search.toLowerCase())) ||
                (clinic.phone && clinic.phone.includes(search)) ||
                (clinic.address && clinic.address.toLowerCase().includes(search.toLowerCase()));

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

            console.log(`🔄 Executing ${type} action for clinic: `, clinic.name);

            switch (type) {
                case 'approve':
                    await api.approveClinic(clinic.id);
                    break;
                case 'reject':
                    await api.rejectClinic(clinic.id, rejectReason);
                    break;
                case 'suspend':
                    await api.suspendClinic(clinic.id);
                    break;
                case 'reactivate':
                    await api.reactivateClinic(clinic.id);
                    break;
                case 'delete':
                    await api.deleteClinic(clinic.id);
                    break;
            }

            console.log(`✅ ${type} action completed successfully`);

            setConfirmAction(null);
            setRejectReason('');
            await loadData(); // Reload data

        } catch (error: any) {
            console.error(`❌ Failed to ${type} clinic: `, error);
            alert(`Failed to ${type} clinic: ${error.response?.data?.message || error.message} `);
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
            <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] flex flex-col items-center justify-center p-6">
                <div className="w-full max-w-sm">
                    <div className="relative h-1 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div className="absolute top-0 left-0 h-full bg-primary-600 dark:bg-primary-500 animate-[shimmer_1.5s_infinite] w-1/3 rounded-full" />
                    </div>
                    <div className="mt-8 text-center space-y-2">
                        <p className="text-xl font-medium text-slate-900 dark:text-white">{t('common.loading')}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-light tracking-wide">Syncing with secure infrastructure...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0f172a] selection:bg-primary-500/30">
            {/* Background Accents (Subtle, non-moving) */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden opacity-40 dark:opacity-20">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-400/20 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-400/10 blur-[120px] rounded-full" />
            </div>

            <div className="relative max-w-[1600px] mx-auto p-6 lg:p-10">

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-primary-700 dark:text-primary-300">
                            <Building2 size={14} className="text-primary-500" />
                            <span className="text-[11px] font-bold uppercase tracking-wider">{t('clinics.infrastructure')}</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                            {viewMode === 'requests' ? t('clinics.provisioning') : t('clinics.topology')}
                        </h1>
                        <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl font-light">
                            {viewMode === 'requests'
                                ? t('clinics.requestsSubtitle')
                                : t('clinics.globalNetwork')}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:border-primary-500/50 hover:shadow-lg transition-all active:scale-95 group font-semibold"
                        >
                            <RefreshCw size={18} className={`${loading ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'}`} />
                            <span>Refresh Data</span>
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    {[
                        { title: t('clinicDashboard.total'), value: stats.total, icon: Building2, color: "blue", sub: "Total Registrations" },
                        { title: t('clinicDashboard.approved'), value: stats.approved, icon: CheckCircle2, color: "green", sub: "Active Nodes" },
                        { title: t('clinicDashboard.pending'), value: stats.pending, icon: Clock, color: "amber", sub: "Awaiting Review" },
                        { title: t('clinics.statusSuspended'), value: stats.suspended, icon: Ban, color: "red", sub: "Security Holds" }
                    ].map((stat, i) => (
                        <StatCard
                            key={i}
                            title={stat.title}
                            value={stat.value}
                            icon={stat.icon}
                            color={stat.color as any}
                            subtitle={stat.sub}
                        />
                    ))}
                </div>

                {/* Filters Section */}
                <div className="animate-fadeIn" style={{ animationDelay: '400ms' }}>
                    <ClinicFilters
                        search={search}
                        setSearch={setSearch}
                        statusFilter={statusFilter}
                        setStatusFilter={setStatusFilter}
                        totalCount={clinics.length}
                        filteredCount={filteredClinics.length}
                        hideStatusFilter={viewMode === 'requests'}
                    />
                </div>

                {/* Content */}
                {error ? (
                    <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-3xl p-12 text-center">
                        <Ban className="mx-auto text-rose-500 mb-4" size={48} />
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Connectivity Error</h3>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">{error}</p>
                        <button onClick={loadData} className="px-6 py-2 bg-rose-600 text-white rounded-xl hover:bg-rose-700 transition-colors">Retry Connection</button>
                    </div>
                ) : filteredClinics.length === 0 ? (
                    <div className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-[2rem] text-center py-32">
                        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Building2 className="text-slate-400" size={40} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 tracking-tight">
                            No Clinics Found
                        </h3>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto font-light">
                            {search || statusFilter !== 'ALL'
                                ? 'No clinics match your current filter settings. Try clearing them.'
                                : 'The registry is empty. New registrations will automatically appear here.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 pb-20">
                        {filteredClinics.map((clinic) => (
                            <ClinicCard
                                key={clinic.id}
                                clinic={clinic}
                                subscription={subscriptions[clinic.id]}
                                onSelect={(c) => navigate(`/clinics/${c.id}/details`)}
                                onAction={(type) => setConfirmAction({ type, clinic })}
                                onControls={() => navigate(`/clinics/${clinic.id}/control`)}
                                processing={processing === clinic.id}
                                viewMode={viewMode}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Modals */}


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

export default Clinics;
