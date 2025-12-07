import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus } from '../types';
import {
    CheckCircle2,
    XCircle,
    Ban,
    PlayCircle,
    Search,
    Loader2,
    Stethoscope,
    Mail,
    Phone,
    MapPin,
    Cpu,
    LayoutDashboard,
    Key,
    Calendar,
    RefreshCw
} from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    const fetchClinics = async () => {
        try {
            setLoading(true);
            // We fetch all requests. In a real large-scale app, we might pass ?status=X to the API.
            // For now, the API returns everything and we filter client-side for immediate UI transitions.
            const { data } = await api.get('/api/clinics/requests');
            setClinics(data);
        } catch (e) {
            console.error('Failed to fetch clinics', e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClinics();
    }, [viewMode]);

    const handleApprove = async (id: string) => {
        if (!confirm('Are you sure you want to approve this clinic? This will generate a new license.')) return;
        try {
            setProcessing(id);
            await api.post(`/api/clinics/${id}/approve`);
            await fetchClinics();
        } catch (e) {
            alert('Failed to approve clinic');
            console.error(e);
        } finally {
            setProcessing(null);
        }
    };

    const handleToggle = async (id: string, currentStatus: RegistrationStatus) => {
        const action = currentStatus === RegistrationStatus.SUSPENDED ? 'activate' : 'suspend';
        if (!confirm(`Are you sure you want to ${action} this clinic?`)) return;

        try {
            setProcessing(id);
            await api.post(`/api/clinics/${id}/toggle-status`);
            await fetchClinics();
        } catch (e) {
            alert(`Failed to ${action} clinic`);
            console.error(e);
        } finally {
            setProcessing(null);
        }
    };

    const filtered = clinics.filter(c => {
        // Search Filter
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.doctorName?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

        // View Mode Filter
        if (viewMode === 'requests') {
            return c.status === RegistrationStatus.PENDING || c.status === RegistrationStatus.REJECTED;
        } else {
            return c.status === RegistrationStatus.APPROVED || c.status === RegistrationStatus.SUSPENDED;
        }
    });

    const getStatusColor = (status: RegistrationStatus) => {
        switch (status) {
            case RegistrationStatus.APPROVED: return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case RegistrationStatus.PENDING: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case RegistrationStatus.SUSPENDED: return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString();
    };

    const pageTitle = viewMode === 'requests' ? 'Clinic Requests' : 'Manage Clinics';
    const pageIcon = viewMode === 'requests' ? Stethoscope : LayoutDashboard;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        {React.createElement(pageIcon, { className: "text-emerald-500" })}
                        {pageTitle}
                    </h1>
                    <p className="text-slate-500 mt-1">
                        {viewMode === 'requests'
                            ? 'Review and approve incoming registration requests.'
                            : 'Monitor active clinics, license details, and status.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchClinics}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search clinics..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading && clinics.length === 0 ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        {search ? "No clinics found matching your search." : (
                            viewMode === 'requests'
                                ? "No pending registration requests."
                                : "No active clinics found."
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Clinic Info</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Contact</th>

                                    {/* Conditional Columns for Manage View */}
                                    {viewMode === 'manage' && (
                                        <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">License Info</th>
                                    )}

                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">System Info</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">Status</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filtered.map((clinic) => (
                                    <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-bold text-slate-900 dark:text-white text-base">{clinic.name}</p>
                                                {clinic.doctorName && (
                                                    <p className="text-slate-500 text-xs flex items-center gap-1 mt-1">
                                                        Dr. {clinic.doctorName}
                                                        <span className="mx-1">•</span>
                                                        <span className='text-[10px]'>{formatDate(clinic.createdAt)}</span>
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                    <Mail size={14} />
                                                    <span>{clinic.email}</span>
                                                </div>
                                                {clinic.phone && (
                                                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                                        <Phone size={14} />
                                                        <span>{clinic.phone}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        {/* License Data Column for Manage View */}
                                        {viewMode === 'manage' && (
                                            <td className="px-6 py-4">
                                                {clinic.license ? (
                                                    <div className="space-y-1 text-slate-600 dark:text-slate-400">
                                                        <div className="flex items-center gap-2 font-mono text-xs text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-900 px-2 py-1 rounded border border-slate-200 dark:border-slate-700 w-fit">
                                                            <Key size={12} className="text-emerald-500" />
                                                            {clinic.license.serial}
                                                        </div>
                                                        <div className={`flex items-center gap-2 text-xs ${new Date(clinic.license.expireDate || '') < new Date()
                                                                ? 'text-rose-500 font-bold'
                                                                : 'text-slate-500'
                                                            }`}>
                                                            <Calendar size={12} />
                                                            Example: {formatDate(clinic.license.expireDate || '')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No License Linked</span>
                                                )}
                                            </td>
                                        )}

                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-slate-600 dark:text-slate-400">
                                                <div className="flex items-center gap-2" title="Hardware ID">
                                                    <Cpu size={14} />
                                                    <span className="font-mono text-xs">{clinic.hwid.substring(0, 8)}...</span>
                                                </div>
                                                {clinic.systemVersion && <div className="text-xs">v{clinic.systemVersion}</div>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(clinic.status)}`}>
                                                {clinic.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                {clinic.status === RegistrationStatus.PENDING && (
                                                    <button
                                                        onClick={() => handleApprove(clinic.id)}
                                                        disabled={!!processing}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/10"
                                                        title="Approve & Generate License"
                                                    >
                                                        {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <div className="flex items-center gap-2"><CheckCircle2 size={18} /> <span className="text-xs font-bold">Approve</span></div>}
                                                    </button>
                                                )}

                                                {(clinic.status === RegistrationStatus.APPROVED || clinic.status === RegistrationStatus.SUSPENDED) && (
                                                    <button
                                                        onClick={() => handleToggle(clinic.id, clinic.status)}
                                                        disabled={!!processing}
                                                        className={`p-2 rounded-lg transition-colors border ${clinic.status === RegistrationStatus.SUSPENDED
                                                            ? 'text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/10'
                                                            : 'text-rose-500 hover:bg-rose-500/10 border-rose-500/10'
                                                            }`}
                                                        title={clinic.status === RegistrationStatus.SUSPENDED ? 'Activate' : 'Suspend'}
                                                    >
                                                        {processing === clinic.id ?
                                                            <Loader2 size={18} className="animate-spin" /> :
                                                            (clinic.status === RegistrationStatus.SUSPENDED ? <PlayCircle size={18} /> : <Ban size={18} />)
                                                        }
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Clinics;
