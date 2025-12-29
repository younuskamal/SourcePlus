
import React, { useState, useEffect, useMemo } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import {
    ClinicFilters,
    ClinicCard,
    ClinicDetailsModal,
    ConfirmActionModal,
    ErrorAlert
} from '../components/clinics';
import { useTranslation } from '../hooks/useTranslation';
import {
    Building2, CheckCircle2, Clock, Ban, Loader2, RefreshCw,
    Layers, Users, HardDrive, ShieldAlert, ChevronRight,
    MoreHorizontal, Search, Settings, ExternalLink, Activity,
    Calendar, Mail, Phone, MapPin, Grid, List as ListIcon,
    ArrowUpRight, ShieldCheck, Zap
} from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
    setPage: (page: string) => void;
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'delete';

const Clinics: React.FC<ClinicsProps> = ({ viewMode, setPage }) => {
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
    const [confirmAction, setConfirmAction] = useState<{ type: ActionType; clinic: Clinic } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [displayType, setDisplayType] = useState<'grid' | 'list'>(viewMode === 'manage' ? 'list' : 'grid');

    // Fetch data
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

            // Fetch subscription statuses for approved clinics
            const approvedClinics = clinicsData.filter(c => c.status === RegistrationStatus.APPROVED);
            if (approvedClinics.length > 0) {
                const subs = await Promise.all(
                    approvedClinics.map(async (clinic) => {
                        try {
                            const status = await api.getSubscriptionStatus(clinic.id);
                            return [clinic.id, status] as const;
                        } catch (err) {
                            return null;
                        }
                    })
                );
                const subscriptionsMap = Object.fromEntries(subs.filter(s => s !== null) as any);
                setSubscriptions(subscriptionsMap);
            }

        } catch (error: any) {
            setError(error.message || 'Failed to load clinics data');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (type: ActionType, clinic: Clinic) => {
        if (type === 'reject' && !rejectReason.trim()) return;

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
            alert(`Error: ${error.message}`);
        } finally {
            setProcessing(null);
        }
    };

    const filteredClinics = useMemo(() => {
        return clinics.filter(clinic => {
            const matchesSearch = search === '' ||
                clinic.name?.toLowerCase().includes(search.toLowerCase()) ||
                clinic.email?.toLowerCase().includes(search.toLowerCase()) ||
                clinic.phone?.includes(search);
            const matchesStatus = statusFilter === 'ALL' || clinic.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [clinics, search, statusFilter]);

    const stats = useMemo(() => ({
        total: clinics.length,
        approved: clinics.filter(c => c.status === RegistrationStatus.APPROVED).length,
        pending: clinics.filter(c => c.status === RegistrationStatus.PENDING).length,
        suspended: clinics.filter(c => c.status === RegistrationStatus.SUSPENDED).length,
    }), [clinics]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-emerald-600 mb-4" size={40} />
            <p className="text-slate-500 font-black uppercase text-xs tracking-widest animate-pulse">Synchronizing Node Data...</p>
        </div>
    );

    return (
        <div className="space-y-8 max-w-[1600px] mx-auto pb-12">
            {/* Ultra Modern Header */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/30 rounded-full w-fit mb-2">
                        <Zap size={14} className="text-emerald-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Infrastructure Core</span>
                    </div>
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                        {viewMode === 'requests' ? 'Security Gate' : 'Network Cluster'}
                    </h1>
                    <p className="text-slate-500 font-bold text-sm">
                        {viewMode === 'requests' ? 'Verify and authorize new clinic nodes' : 'Monitor and optimize active infrastructure instances'}
                    </p>
                </div>

                <div className="flex items-center gap-4">
                    <div className="hidden sm:flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                        <button
                            onClick={() => setDisplayType('grid')}
                            className={`p-2 rounded-lg transition-all ${displayType === 'grid' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setDisplayType('list')}
                            className={`p-2 rounded-lg transition-all ${displayType === 'list' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-400 hover:text-slate-900'}`}
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <button
                        onClick={loadData}
                        className="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 text-slate-600 shadow-sm transition-all active:scale-95"
                    >
                        <RefreshCw size={20} />
                    </button>
                </div>
            </div>

            {/* High Performance Stats Strip */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Instances', value: stats.total, icon: Building2, color: 'blue' },
                    { label: 'Active Clusters', value: stats.approved, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Pending Access', value: stats.pending, icon: Clock, color: 'amber' },
                    { label: 'Blocked Nodes', value: stats.suspended, icon: Ban, color: 'rose' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm group hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center justify-between mb-2">
                            <div className={`p-2 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/30 text-${stat.color}-600 dark:text-${stat.color}-400 group-hover:scale-110 transition-transform`}>
                                <stat.icon size={20} />
                            </div>
                            <span className="text-[10px] font-black text-slate-300 group-hover:text-emerald-500/50">NODE_0{i + 1}</span>
                        </div>
                        <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">{stat.label}</p>
                        <p className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Hub */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                <div className="flex-1 w-full relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                    <input
                        type="text" value={search} onChange={e => setSearch(e.target.value)}
                        placeholder="SEARCH NODE IDENTIFIERS, NAMES OR CHANNELS..."
                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all placeholder:text-slate-400"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    {!viewMode.startsWith('requests') && (
                        <select
                            value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
                            className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-black uppercase tracking-widest outline-none cursor-pointer"
                        >
                            <option value="ALL">All States</option>
                            <option value={RegistrationStatus.APPROVED}>Operational</option>
                            <option value={RegistrationStatus.PENDING}>Review</option>
                            <option value={RegistrationStatus.SUSPENDED}>Locked</option>
                        </select>
                    )}
                </div>
            </div>

            {/* Dynamic Content Display */}
            {filteredClinics.length === 0 ? (
                <div className="text-center py-32 bg-white dark:bg-slate-800 rounded-3xl border-2 border-dashed border-slate-100 dark:border-slate-800">
                    <Building2 className="mx-auto text-slate-200 dark:text-slate-700 mb-6" size={80} />
                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Zero Nodes Found</h3>
                    <p className="text-slate-500 font-bold text-sm mt-2">No infrastructure matching your current verification parameters.</p>
                </div>
            ) : displayType === 'list' && viewMode === 'manage' ? (
                /* High Density Management Table */
                <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Instance Identity</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Service Plan</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 hidden lg:table-cell">Resources</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500">Network Status</th>
                                    <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                {filteredClinics.map((clinic) => {
                                    const sub = subscriptions[clinic.id];
                                    const isLocked = clinic.status === RegistrationStatus.SUSPENDED;

                                    return (
                                        <tr key={clinic.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors group">
                                            <td className="px-6 py-6" onClick={() => setSelectedClinic(clinic)}>
                                                <div className="flex items-center gap-4 cursor-pointer">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black transition-all group-hover:scale-110 ${isLocked ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                                                        }`}>
                                                        {clinic.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                                            {clinic.name}
                                                            {sub?.remainingDays !== undefined && sub.remainingDays > 300 && <ShieldCheck size={14} className="text-blue-500" />}
                                                        </h4>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{clinic.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                {sub ? (
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 dark:text-slate-300 uppercase">
                                                            <Layers size={12} className="text-blue-500" />
                                                            {sub.license?.plan?.name || 'CUSTOM_LICENSE'}
                                                        </div>
                                                        <div className={`text-[10px] font-bold uppercase ${sub.remainingDays < 30 ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                                            {sub.remainingDays} DAYS LEFT
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-black text-slate-300 uppercase">NO_LICENSE</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-6 hidden lg:table-cell">
                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-500">
                                                            <Users size={12} /> {sub?.license?.activationCount || 0}/{sub?.license?.deviceLimit || 0}
                                                        </div>
                                                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-blue-500"
                                                                style={{ width: `${Math.min(((sub?.license?.activationCount || 0) / (sub?.license?.deviceLimit || 1)) * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${isLocked ? 'bg-rose-500' : 'bg-emerald-500 animation-pulse'}`}></span>
                                                    <span className={`text-[10px] font-black uppercase tracking-widest ${isLocked ? 'text-rose-500' : 'text-emerald-500'}`}>
                                                        {isLocked ? 'LOCKED_BY_ADMIN' : 'SYNC_STABLE'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-6 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <button
                                                        onClick={() => setPage(`manage-clinics/${clinic.id}`)}
                                                        className="p-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                                                        title="Command Center"
                                                    >
                                                        <Settings size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'delete', clinic })}
                                                        className="p-2.5 bg-rose-500 text-white rounded-xl hover:scale-110 active:scale-95 transition-all shadow-lg"
                                                        title="Purge Node"
                                                    >
                                                        <Ban size={16} />
                                                    </button>
                                                </div>
                                                <div className="group-hover:hidden text-slate-300">
                                                    <MoreHorizontal size={20} />
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                /* Grid View (default for requests) */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredClinics.map((clinic) => (
                        <div key={clinic.id} className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                            {/* Visual Accents */}
                            <div className={`absolute top-0 right-0 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:scale-150 transition-transform duration-700 ${clinic.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-amber-500'
                                }`}></div>

                            <div className="flex items-start justify-between mb-6 relative z-10">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black ${clinic.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                                    }`}>
                                    {clinic.name?.charAt(0)}
                                </div>
                                <div className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${clinic.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'
                                    }`}>
                                    {clinic.status}
                                </div>
                            </div>

                            <div className="space-y-4 relative z-10">
                                <div>
                                    <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter truncate">{clinic.name}</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{clinic.email}</p>
                                </div>

                                <div className="space-y-2.5 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <Phone size={14} className="text-emerald-500" /> {clinic.phone || 'N/A'}
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <MapPin size={14} className="text-emerald-500" /> {clinic.address?.slice(0, 30) || 'LOCATION_UNKNOWN'}...
                                    </div>
                                    <div className="flex items-center gap-3 text-xs font-bold text-slate-500">
                                        <Calendar size={14} className="text-emerald-500" /> REGISTERED: {new Date(clinic.createdAt).toLocaleDateString()}
                                    </div>
                                </div>

                                <div className="pt-4 flex gap-3">
                                    {viewMode === 'requests' ? (
                                        <>
                                            <button
                                                onClick={() => setConfirmAction({ type: 'approve', clinic })}
                                                className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-700 shadow-xl shadow-emerald-600/20 active:scale-95 transition-all"
                                            >
                                                Authorize
                                            </button>
                                            <button
                                                onClick={() => setConfirmAction({ type: 'reject', clinic })}
                                                className="flex-1 py-3 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-rose-600 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-rose-50 transition-all"
                                            >
                                                Deny Access
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                onClick={() => setPage(`manage-clinics/${clinic.id}`)}
                                                className="flex-1 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-xl"
                                            >
                                                Manage Node
                                            </button>
                                            <button
                                                onClick={() => setSelectedClinic(clinic)}
                                                className="p-3 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-xl hover:text-slate-900 transition-all"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Comprehensive Modals Integration */}
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
                    onCancel={() => setConfirmAction(null)}
                    processing={processing !== null}
                />
            )}
        </div>
    );
};

export default Clinics;
