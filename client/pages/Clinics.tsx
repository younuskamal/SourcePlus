import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import {
    StatCard,
    ClinicFilters,
    ClinicCard,
    ClinicDetailsModal,
    ConfirmActionModal,
    ErrorAlert
} from '../components/clinics';
import { Building2, CheckCircle2, Clock, Ban, Loader2 } from 'lucide-react';
import { RefreshCw } from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {

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
                api.getPlans() // Fixed: was getSubscriptionPlans
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
                    await api.updateClinicStatus(clinic.id, RegistrationStatus.SUSPENDED);
                    break;
                case 'reactivate':
                    await api.updateClinicStatus(clinic.id, RegistrationStatus.APPROVED);
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
            <div className="flex flex-col items-center justify-center h-screen">
                <Loader2 className="animate-spin text-purple-600 mb-4" size={64} />
                <p className="text-slate-600 dark:text-slate-300 text-lg">Loading clinics...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900">
            <div className="max-w-[1800px] mx-auto p-6">

                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-6">
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
                            className="px-5 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all flex items-center gap-2 shadow-sm font-medium"
                        >
                            <RefreshCw className={loading ? 'animate-spin' : ''} size={20} />
                            Refresh
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard title="Total Clinics" value={stats.total} icon={Building2} color="blue" />
                        <StatCard title="Approved" value={stats.approved} icon={CheckCircle2} color="green" />
                        <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
                        <StatCard title="Suspended" value={stats.suspended} icon={Ban} color="red" />
                    </div>
                </div>

                {/* Filters */}
                <ClinicFilters
                    search={search}
                    setSearch={setSearch}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    totalCount={clinics.length}
                    filteredCount={filteredClinics.length}
                    hideStatusFilter={viewMode === 'requests'} // Hide in Requests, show in Manage
                />

                {/* Content */}
                {error ? (
                    <ErrorAlert message={error} onRetry={loadData} />
                ) : filteredClinics.length === 0 ? (
                    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
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
                                onControls={() => console.log('Navigate to clinic control:', clinic.id)}
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
