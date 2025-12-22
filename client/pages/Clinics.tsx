import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import {
    StatCard,
    ClinicFilters,
    ClinicCard,
    ClinicDetailsModal,
    ConfirmActionModal,
    ErrorAlert,
    ClinicsHeader
} from '../components/clinics';
import ClinicControlDashboard from '../components/ClinicControlDashboard';
import { useTranslation } from '../hooks/useTranslation';
import { Building2, CheckCircle2, Clock, Ban, Loader2, RefreshCw } from 'lucide-react';

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

    // Fetch data on mount and viewMode change
    useEffect(() => {
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
            <div className="clinic-bg-gradient flex flex-col items-center justify-center min-h-screen">
                <div className="glass-modal p-8 text-center">
                    <Loader2 className="animate-spin text-purple-600 mx-auto mb-4" size={64} />
                    <p className="text-slate-600 dark:text-slate-300 text-lg font-medium">{t('common.loading')}</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-2">{t('clinicDashboard.subtitle')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="clinic-bg-gradient min-h-screen">
            <div className="max-w-[1800px] mx-auto p-6">

                {/* Header with Integrated Switcher */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8 group">
                    <div className="animate-fadeIn">
                        <h1 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] mb-2 px-1">{t('nav.clinicSystem')}</h1>
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full animate-pulse-soft" />
                                <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-2xl">
                                    <Building2 size={24} />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                    {viewMode === 'requests' ? t('clinics.requestsTitle') : t('clinics.manageTitle')}
                                </h1>
                                <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 opacity-70">
                                    {viewMode === 'requests' ? t('clinics.requestsSubtitle').toUpperCase() : t('clinics.manageSubtitle').toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 animate-scaleUp">
                        <button
                            onClick={loadData}
                            className="glass-button p-4 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-90"
                            title="Refresh Uplink"
                        >
                            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {[
                        { title: t('clinicDashboard.total'), value: stats.total, icon: Building2, color: "blue", sub: t('nav.clinicSystem') },
                        { title: t('clinicDashboard.approved'), value: stats.approved, icon: CheckCircle2, color: "green", sub: t('dashboard.active') },
                        { title: t('clinicDashboard.pending'), value: stats.pending, icon: Clock, color: "amber", sub: t('clinics.statusPending') },
                        { title: t('clinics.statusSuspended'), value: stats.suspended, icon: Ban, color: "red", sub: t('dashboard.security') }
                    ].map((stat, i) => (
                        <div key={i} className="animate-scaleUp" style={{ animationDelay: `${i * 100}ms` }}>
                            <StatCard
                                title={stat.title}
                                value={stat.value}
                                icon={stat.icon}
                                color={stat.color as any}
                                subtitle={stat.sub}
                            />
                        </div>
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
                    <ErrorAlert message={error} onRetry={loadData} />
                ) : filteredClinics.length === 0 ? (
                    <div className="glass-card text-center py-16">
                        <div className="relative inline-block mb-6">
                            <div className="absolute inset-0 bg-purple-500/20 rounded-full blur-2xl" />
                            <Building2 className="relative mx-auto text-slate-300 dark:text-slate-600" size={80} />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                            No clinics found
                        </h3>
                        <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                            {search || statusFilter !== 'ALL'
                                ? 'Try adjusting your filters to find what you\'re looking for'
                                : 'No clinics have been registered yet. They will appear here once submitted.'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
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

export default Clinics;
