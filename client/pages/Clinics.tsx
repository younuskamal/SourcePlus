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
    RefreshCw,
    Trash2,
    Eye,
    Landmark,
    FileText
} from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [processing, setProcessing] = useState<string | null>(null);

    // Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        type: 'approve' | 'suspend' | 'activate' | 'delete';
        clinicId: string;
        clinicName: string;
    } | null>(null);

    const [detailsModal, setDetailsModal] = useState<Clinic | null>(null);

    // Initial Fetch
    const fetchClinics = async () => {
        try {
            setLoading(true);
            const data = await api.getClinicRequests();
            setClinics(data);
        } catch (e) {
            console.error('Failed to fetch clinics', e);
        } finally {
            setLoading(false);
            setProcessing(null);
        }
    };

    useEffect(() => {
        fetchClinics();
    }, [viewMode]);

    // Action Handlers
    const onApproveClick = (clinic: Clinic) => setConfirmModal({ isOpen: true, type: 'approve', clinicId: clinic.id, clinicName: clinic.name });
    const onToggleClick = (clinic: Clinic) => {
        const type = clinic.status === RegistrationStatus.SUSPENDED ? 'activate' : 'suspend';
        setConfirmModal({ isOpen: true, type, clinicId: clinic.id, clinicName: clinic.name });
    };
    const onDeleteClick = (clinic: Clinic) => setConfirmModal({ isOpen: true, type: 'delete', clinicId: clinic.id, clinicName: clinic.name });

    const performAction = async () => {
        if (!confirmModal) return;
        const { type, clinicId } = confirmModal;

        try {
            setProcessing(clinicId);
            setConfirmModal(null);

            if (type === 'approve') await api.approveClinic(clinicId);
            else if (type === 'delete') await api.deleteClinic(clinicId);
            else await api.toggleClinicStatus(clinicId);

            setTimeout(() => fetchClinics(), 500);
        } catch (e) {
            alert(`Failed to ${type} clinic`);
            console.error(e);
            setProcessing(null);
        }
    };

    // Filter Logic
    const filtered = clinics.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.email.toLowerCase().includes(search.toLowerCase()) ||
            c.doctorName?.toLowerCase().includes(search.toLowerCase());

        if (!matchesSearch) return false;

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

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    const pageTitle = viewMode === 'requests' ? 'Clinic Requests' : 'Manage Clinics';
    const pageIcon = viewMode === 'requests' ? Stethoscope : LayoutDashboard;

    return (
        <div className="space-y-6 relative">
            {/* --- Confirmation Modal --- */}
            {confirmModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 scale-100 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className={`p-4 rounded-full ${confirmModal.type === 'delete' || confirmModal.type === 'suspend'
                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {confirmModal.type === 'delete' ? <Trash2 size={32} /> :
                                    confirmModal.type === 'suspend' ? <Ban size={32} /> : <CheckCircle2 size={32} />}
                            </div>

                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                    {confirmModal.type} Clinic?
                                </h3>
                                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm leading-relaxed">
                                    Are you sure you want to <strong>{confirmModal.type}</strong> "<span>{confirmModal.clinicName}</span>"?
                                    {confirmModal.type === 'delete' && <span className="block mt-1 text-rose-600 dark:text-rose-400 font-bold">This cannot be undone. All data and licenses will be lost.</span>}
                                </p>
                            </div>

                            <div className="flex items-center gap-3 w-full mt-2">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={performAction}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-white font-bold shadow-lg transition-transform active:scale-95 ${confirmModal.type === 'delete' || confirmModal.type === 'suspend'
                                        ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/25'
                                        : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/25'
                                        }`}
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- Details Modal --- */}
            {detailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-700 scale-100 animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 dark:text-emerald-400">
                                    <Landmark size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{detailsModal.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm">Clinic Details & Configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-slate-600">
                                <XCircle size={24} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto space-y-6 flex-1">
                            {/* Status Badge */}
                            <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                                <div className="text-sm font-medium text-slate-500 dark:text-slate-400">Current Status</div>
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(detailsModal.status)}`}>
                                    {detailsModal.status}
                                </span>
                            </div>

                            {/* Details Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Column 1: Contact */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Mail size={16} className="text-emerald-500" /> Contact Info
                                    </h4>
                                    <div className="space-y-3 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2">
                                        <div>
                                            <div className="text-xs text-slate-400">Doctor Name</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">Dr. {detailsModal.doctorName || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">Email Address</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{detailsModal.email}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">Phone Number</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{detailsModal.phone || 'N/A'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">Address</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{detailsModal.address || 'N/A'}</div>
                                        </div>
                                    </div>
                                </div>

                                {/* Column 2: System */}
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Cpu size={16} className="text-emerald-500" /> System Info
                                    </h4>
                                    <div className="space-y-3 pl-2 border-l-2 border-slate-100 dark:border-slate-800 ml-2">

                                        <div>
                                            <div className="text-xs text-slate-400">System Version</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">v{detailsModal.systemVersion || '1.0.0'}</div>
                                        </div>
                                        <div>
                                            <div className="text-xs text-slate-400">Registration Date</div>
                                            <div className="text-sm font-medium text-slate-700 dark:text-slate-300">{formatDate(detailsModal.createdAt)}</div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* License Section */}
                            {detailsModal.license && (
                                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-4">
                                        <Key size={16} className="text-emerald-500" /> Active License
                                    </h4>
                                    <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/20">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-mono text-emerald-700 dark:text-emerald-400">{detailsModal.license.serial}</span>
                                            <span className="text-xs text-emerald-600 dark:text-emerald-500 font-bold">{detailsModal.license.status}</span>
                                        </div>
                                        <div className="text-xs text-emerald-600/70 dark:text-emerald-400/70 flex items-center gap-1">
                                            <Calendar size={12} /> Expires: {formatDate(detailsModal.license.expireDate)}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end gap-3 rounded-b-2xl">
                            <button
                                onClick={() => setDetailsModal(null)}
                                className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                            >
                                Close
                            </button>
                            {/* Shortcut Action Buttons inside Detail Modal */}
                            {detailsModal.status === RegistrationStatus.PENDING ? (
                                <button
                                    onClick={() => { setDetailsModal(null); onApproveClick(detailsModal); }}
                                    className="px-4 py-2 bg-emerald-500 text-white text-sm font-bold rounded-lg hover:bg-emerald-600 transition-colors shadow-sm"
                                >
                                    Approve Now
                                </button>
                            ) : (
                                <button
                                    onClick={() => { setDetailsModal(null); onToggleClick(detailsModal); }}
                                    className={`px-4 py-2 text-white text-sm font-bold rounded-lg transition-colors shadow-sm ${detailsModal.status === 'SUSPENDED' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
                                        }`}
                                >
                                    {detailsModal.status === 'SUSPENDED' ? 'Activate Clinic' : 'Suspend Clinic'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                                            {formatDate(clinic.license.expireDate || '')}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">No License Linked</span>
                                                )}
                                            </td>
                                        )}

                                        <td className="px-6 py-4">
                                            <div className="space-y-1 text-slate-600 dark:text-slate-400">
                                                {clinic.systemVersion ? <div className="text-xs">v{clinic.systemVersion}</div> : <span className="text-xs italic">Web App</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(clinic.status)}`}>
                                                {clinic.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">

                                                {/* View Details Action (Everyone has this) */}
                                                <button
                                                    onClick={() => setDetailsModal(clinic)}
                                                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </button>

                                                {/* Approve Action (Only Requests) */}
                                                {clinic.status === RegistrationStatus.PENDING && (
                                                    <button
                                                        onClick={() => onApproveClick(clinic)}
                                                        disabled={!!processing}
                                                        className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/10"
                                                        title="Approve & Generate License"
                                                    >
                                                        {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <div className="flex items-center gap-2"><CheckCircle2 size={18} /></div>}
                                                    </button>
                                                )}

                                                {/* Toggle Status (Only Manage) */}
                                                {(clinic.status === RegistrationStatus.APPROVED || clinic.status === RegistrationStatus.SUSPENDED) && (
                                                    <button
                                                        onClick={() => onToggleClick(clinic)}
                                                        disabled={!!processing}
                                                        className={`p-2 rounded-lg transition-colors border ${clinic.status === RegistrationStatus.SUSPENDED
                                                            ? 'text-emerald-500 hover:bg-emerald-500/10 border-emerald-500/10'
                                                            : 'text-amber-500 hover:bg-amber-500/10 border-amber-500/10'
                                                            }`}
                                                        title={clinic.status === RegistrationStatus.SUSPENDED ? 'Activate' : 'Suspend'}
                                                    >
                                                        {processing === clinic.id ?
                                                            <Loader2 size={18} className="animate-spin" /> :
                                                            (clinic.status === RegistrationStatus.SUSPENDED ? <PlayCircle size={18} /> : <Ban size={18} />)
                                                        }
                                                    </button>
                                                )}

                                                {/* Delete Action (Only for Rejected or Suspended/Pending requests in manage view or simple cleanup) 
                                                    Let's allow delete for everyone but with heavy warning. 
                                                */}
                                                <button
                                                    onClick={() => onDeleteClick(clinic)}
                                                    className="p-2 text-rose-400 hover:bg-rose-500/10 hover:text-rose-500 rounded-lg transition-colors border border-transparent hover:border-rose-200 dark:hover:border-rose-900/30"
                                                    title="Delete Clinic"
                                                >
                                                    <Trash2 size={18} />
                                                </button>

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
