
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
        setSearch('');
        setStatusFilter(viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL');
        loadData();
    }, [viewMode]);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);

            const [clinicsData, plansData] = await Promise.all([
                api.getClinics(),
                api.getPlans()
            ]);

            setClinics(clinicsData);
            setPlans(plansData);

            const subs = await Promise.all(
                clinicsData
                    .filter(c => c.status === RegistrationStatus.APPROVED)
                    .map(async (clinic) => {
                        try {
                            const status = await api.getSubscriptionStatus(clinic.id);
                            return [clinic.id, status] as const;
                        } catch (err) {
                            console.warn(`Failed to load subscription for clinic ${clinic.id}: `, err);
                            return null;
                        }
                    })
            );

            const subscriptionsMap = Object.fromEntries(subs.filter(s => s !== null));
            setSubscriptions(subscriptionsMap);

        } catch (error: any) {
            console.error('Failed to load clinics data:', error);
            setError(error.message || 'Failed to load clinics data');
        } finally {
            setLoading(false);
        }
    };

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

    const handleAction = async (type: ActionType, clinic: Clinic) => {
        if (type === 'reject' && !rejectReason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }

        try {
            setProcessing(clinic.id);
            switch (type) {
                case 'approve': await api.approveClinic(clinic.id); break;
                case 'reject': await api.rejectClinic(clinic.id, rejectReason); break;
                case 'suspend': await api.suspendClinic(clinic.id); break;
                case 'reactivate': await api.reactivateClinic(clinic.id); break;
                case 'delete': await api.deleteClinic(clinic.id); break;
            }
            setConfirmAction(null);
            setRejectReason('');
            await loadData();
        } catch (error: any) {
            alert(`Failed to ${type} clinic: ${error.response?.data?.message || error.message}`);
        } finally {
            setProcessing(null);
        }
    };

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
            <div className="flex flex-col items-center justify-center p-12">
                <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
                <p className="text-slate-500 font-medium">Loading Data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        {viewMode === 'requests' ? 'Registration Requests' : 'Clinic Management'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        {viewMode === 'requests' ? 'Manage new clinic signups' : 'Overview of all registered clinics'}
                    </p>
                </div>
                <button
                    onClick={loadData}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                >
                    <RefreshCw size={20} />
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md"><Building2 size={24} /></div>
                    <div><p className="text-sm text-slate-500">Total</p><p className="text-2xl font-bold dark:text-white">{stats.total}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md"><CheckCircle2 size={24} /></div>
                    <div><p className="text-sm text-slate-500">Active</p><p className="text-2xl font-bold dark:text-white">{stats.approved}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md"><Clock size={24} /></div>
                    <div><p className="text-sm text-slate-500">Pending</p><p className="text-2xl font-bold dark:text-white">{stats.pending}</p></div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                    <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-md"><Ban size={24} /></div>
                    <div><p className="text-sm text-slate-500">Suspended</p><p className="text-2xl font-bold dark:text-white">{stats.suspended}</p></div>
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
                hideStatusFilter={viewMode === 'requests'}
            />

            {/* Content */}
            {error ? (
                <ErrorAlert message={error} onRetry={loadData} />
            ) : filteredClinics.length === 0 ? (
                <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                    <Building2 className="mx-auto text-slate-300 dark:text-slate-600 mb-4" size={64} />
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">No clinics found</h3>
                    <p className="text-slate-500">Try adjusting your filters.</p>
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
