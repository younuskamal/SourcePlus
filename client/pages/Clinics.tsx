import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from '../services/api';
import { Clinic, RegistrationStatus, SubscriptionPlan, ClinicSubscriptionStatus } from '../types';
import { useTranslation } from '../hooks/useTranslation';
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
    Eye,
    EyeOff,
    Landmark,
    FileText,
    LogOut,
    ShieldAlert,
    KeyRound,
    Trash2
} from 'lucide-react';

interface ClinicsProps {
    viewMode: 'requests' | 'manage';
}

type ActionType = 'approve' | 'reject' | 'suspend' | 'reactivate' | 'force-logout' | 'delete';

const statusOptions: { label: string; value: RegistrationStatus | 'ALL' }[] = [
    { label: 'clinics.statusAll', value: 'ALL' },
    { label: 'clinics.statusPending', value: RegistrationStatus.PENDING },
    { label: 'clinics.statusApproved', value: RegistrationStatus.APPROVED },
    { label: 'clinics.statusSuspended', value: RegistrationStatus.SUSPENDED },
    { label: 'clinics.statusRejected', value: RegistrationStatus.REJECTED }
];

const statusBadge = (status: RegistrationStatus) => {
    switch (status) {
        case RegistrationStatus.APPROVED: return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
        case RegistrationStatus.PENDING: return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
        case RegistrationStatus.SUSPENDED: return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
        case RegistrationStatus.REJECTED: return 'bg-slate-500/10 text-slate-600 dark:text-slate-300 border-slate-500/20';
        default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
};

const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const Clinics: React.FC<ClinicsProps> = ({ viewMode }) => {
    const { t } = useTranslation();
    const [clinics, setClinics] = useState<Clinic[]>([]);
    const [subscriptions, setSubscriptions] = useState<Record<string, ClinicSubscriptionStatus>>({});
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<RegistrationStatus | 'ALL'>(viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL');
    const [processing, setProcessing] = useState<string | null>(null);
    const [confirmAction, setConfirmAction] = useState<{ type: ActionType; clinic: Clinic } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [detailsModal, setDetailsModal] = useState<Clinic | null>(null);
    const [showClinicId, setShowClinicId] = useState(false);
    const [assignModal, setAssignModal] = useState<{ clinic: Clinic; planId?: string; durationMonths?: number; activateClinic?: boolean } | null>(null);
    const [loadingPlans, setLoadingPlans] = useState(false);

    const pageTitle = viewMode === 'requests' ? t('clinics.requestsTitle') : t('clinics.manageTitle');
    const pageIcon = viewMode === 'requests' ? Stethoscope : LayoutDashboard;

    const clinicPlans = useMemo(() => {
        const matchProductType = (plan: SubscriptionPlan) => {
            const productType = ((plan.limits as any)?.productType || (plan.features as any)?.productType || '').toString().toUpperCase();
            if (productType === 'CLINIC') return true;
            return plan.name.toLowerCase().includes('clinic');
        };
        const filtered = plans.filter(matchProductType);
        return filtered.length > 0 ? filtered : plans;
    }, [plans]);

    const fetchSubscriptions = async (items: Clinic[]) => {
        const results = await Promise.all(items.map(async (clinic) => {
            try {
                const status = await api.getSubscriptionStatus(clinic.id);
                return [clinic.id, status] as const;
            } catch {
                return null;
            }
        }));
        const map: Record<string, ClinicSubscriptionStatus> = {};
        results.forEach(item => {
            if (item) map[item[0]] = item[1];
        });
        setSubscriptions(map);
    };

    const fetchClinics = useCallback(async () => {
        try {
            setLoading(true);
            const defaultStatus = viewMode === 'requests' ? RegistrationStatus.PENDING : undefined;
            const data = await api.getClinics(defaultStatus);
            setClinics(data);
            await fetchSubscriptions(data);
        } catch (e) {
            console.error('Failed to fetch clinics', e);
        } finally {
            setLoading(false);
            setProcessing(null);
        }
    }, [viewMode]);

    useEffect(() => {
        fetchClinics();
    }, [viewMode, fetchClinics]);

    useEffect(() => {
        const timer = setInterval(() => {
            fetchClinics();
        }, 15000);
        return () => clearInterval(timer);
    }, [fetchClinics]);

    useEffect(() => {
        setStatusFilter(viewMode === 'requests' ? RegistrationStatus.PENDING : 'ALL');
    }, [viewMode]);

    useEffect(() => {
        if (assignModal && !assignModal.planId && clinicPlans.length > 0) {
            setAssignModal({ ...assignModal, planId: clinicPlans[0].id });
        }
    }, [clinicPlans, assignModal]);

    const fetchPlans = async () => {
        if (plans.length > 0 || loadingPlans) return;
        try {
            setLoadingPlans(true);
            const data = await api.getPlans();
            setPlans(data);
        } finally {
            setLoadingPlans(false);
        }
    };

    const filtered = useMemo(() => {
        return clinics.filter((clinic) => {
            const matchesView = viewMode === 'requests'
                ? clinic.status === RegistrationStatus.PENDING || clinic.status === RegistrationStatus.REJECTED
                : true;
            if (!matchesView) return false;

            const matchesStatus = statusFilter === 'ALL' ? true : clinic.status === statusFilter;
            if (!matchesStatus) return false;

            const term = search.toLowerCase().trim();
            if (!term) return true;

            return (
                clinic.name.toLowerCase().includes(term) ||
                clinic.email.toLowerCase().includes(term) ||
                clinic.doctorName?.toLowerCase().includes(term) ||
                clinic.id.toLowerCase().includes(term) ||
                clinic.phone?.toLowerCase().includes(term) ||
                clinic.address?.toLowerCase().includes(term)
            );
        });
    }, [clinics, search, statusFilter, viewMode]);

    const remainingDays = (clinic: Clinic) => {
        const sub = subscriptions[clinic.id];
        if (sub) return sub.remainingDays;
        if (clinic.license?.expireDate) {
            const now = new Date();
            const expire = new Date(clinic.license.expireDate);
            return Math.max(0, Math.ceil((expire.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
        }
        return null;
    };

    const handleAction = async () => {
        if (!confirmAction) return;
        const { clinic, type } = confirmAction;
        setProcessing(clinic.id);
        try {
            if (type === 'approve') await api.approveClinic(clinic.id);
            if (type === 'reject') await api.rejectClinic(clinic.id, rejectReason);
            if (type === 'suspend') await api.suspendClinic(clinic.id);
            if (type === 'reactivate') await api.reactivateClinic(clinic.id);
            if (type === 'force-logout') await api.forceLogoutClinic(clinic.id);
            if (type === 'delete') await api.deleteClinic(clinic.id);
            await fetchClinics();
        } catch (err: any) {
            alert(err?.message || 'Action failed');
            setProcessing(null);
        } finally {
            setConfirmAction(null);
        }
    };

    const openRejectModal = (clinic: Clinic) => {
        setRejectReason('');
        setConfirmAction({ type: 'reject', clinic });
    };

    const openAssignModal = (clinic: Clinic) => {
        fetchPlans();
        setAssignModal({
            clinic,
            planId: clinic.license?.plan?.id || clinicPlans[0]?.id,
            durationMonths: clinic.license?.plan?.durationMonths || undefined,
            activateClinic: clinic.status !== RegistrationStatus.APPROVED
        });
    };

    const submitAssign = async () => {
        if (!assignModal || !assignModal.planId) return;
        try {
            setProcessing(assignModal.clinic.id);
            await api.assignClinicLicense(assignModal.clinic.id, {
                planId: assignModal.planId,
                durationMonths: assignModal.durationMonths,
                activateClinic: assignModal.activateClinic
            });
            setAssignModal(null);
            await fetchClinics();
        } catch (err: any) {
            alert(err?.message || 'Failed to assign license');
            setProcessing(null);
        }
    };

    const subscriptionFor = (clinic: Clinic) => subscriptions[clinic.id];

    return (
        <div className="space-y-6 relative">
            {/* Confirmation Modal */}
            {confirmAction && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700 animate-in zoom-in-95 duration-200">
                        <div className="flex flex-col gap-4">
                            <div className={`p-3 rounded-full w-fit ${['suspend', 'force-logout', 'reject', 'delete'].includes(confirmAction.type)
                                ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                                : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                }`}>
                                {confirmAction.type === 'approve' && <CheckCircle2 size={26} />}
                                {confirmAction.type === 'reject' && <XCircle size={26} />}
                                {confirmAction.type === 'suspend' && <Ban size={26} />}
                                {confirmAction.type === 'reactivate' && <PlayCircle size={26} />}
                                {confirmAction.type === 'force-logout' && <LogOut size={26} />}
                                {confirmAction.type === 'delete' && <Trash2 size={26} />}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white capitalize">
                                    {t('clinics.confirmTitle', { action: t(`clinics.action.${confirmAction.type}` as any), clinic: confirmAction.clinic.name })}
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                    {t('clinics.confirmSubtitle', { name: confirmAction.clinic.name })}
                                </p>
                            </div>
                            {confirmAction.type === 'reject' && (
                                <div className="space-y-2">
                                    <label className="text-sm text-slate-600 dark:text-slate-300">{t('clinics.reason')}</label>
                                    <textarea
                                        value={rejectReason}
                                        onChange={(e) => setRejectReason(e.target.value)}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                                        rows={3}
                                        placeholder={t('clinics.reasonPlaceholder')}
                                    />
                                </div>
                            )}
                            <div className="flex items-center gap-3 justify-end">
                                <button
                                    onClick={() => setConfirmAction(null)}
                                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={handleAction}
                                    className="px-4 py-2 rounded-lg text-white font-semibold bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
                                >
                                    {t('common.confirm')}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign License Modal */}
            {assignModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 dark:border-slate-700 p-6 space-y-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                <KeyRound size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">{t('clinics.assignTitle')}</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">{assignModal.clinic.name}</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">{t('clinics.plan')}</label>
                                <select
                                    value={assignModal.planId || ''}
                                    onChange={(e) => setAssignModal({ ...assignModal, planId: e.target.value })}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                >
                                    {loadingPlans && <option>{t('common.loading')}</option>}
                                    {clinicPlans.map(plan => (
                                        <option key={plan.id} value={plan.id}>{plan.name} ({plan.durationMonths}m)</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1 block">{t('clinics.duration')}</label>
                                <input
                                    type="number"
                                    min={1}
                                    placeholder={t('clinics.durationPlaceholder')}
                                    value={assignModal.durationMonths || ''}
                                    onChange={(e) => setAssignModal({ ...assignModal, durationMonths: e.target.value ? Number(e.target.value) : undefined })}
                                    className="w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                                />
                            </div>
                            <label className="inline-flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                                <input
                                    type="checkbox"
                                    checked={!!assignModal.activateClinic}
                                    onChange={(e) => setAssignModal({ ...assignModal, activateClinic: e.target.checked })}
                                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                                />
                                {t('clinics.activateAfter')}
                            </label>
                        </div>
                        <div className="flex items-center justify-end gap-3">
                            <button
                                onClick={() => setAssignModal(null)}
                                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={submitAssign}
                                className="px-4 py-2 rounded-lg text-white font-semibold bg-emerald-500 hover:bg-emerald-600 transition-colors shadow-sm"
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {detailsModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                                    <Landmark size={22} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{detailsModal.name}</h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{detailsModal.email}</p>
                                </div>
                            </div>
                            <button onClick={() => setDetailsModal(null)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600">
                                <XCircle size={22} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto space-y-6">
                            <div className="flex items-center gap-3">
                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${statusBadge(detailsModal.status)}`}>
                                    {t(`clinics.statusLabel.${detailsModal.status.toLowerCase()}` as any)}
                                </span>
                                {subscriptionFor(detailsModal)?.forceLogout && (
                                    <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold text-rose-600 bg-rose-100 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800">
                                        <ShieldAlert size={14} /> {t('clinics.forceLogoutActive')}
                                    </span>
                                )}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Mail size={16} className="text-emerald-500" /> Contact
                                    </h4>
                                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2"><FileText size={14} /> {t('clinics.doctorPrefix')} {detailsModal.doctorName || 'N/A'}</div>
                                        <div className="flex items-center gap-2"><Mail size={14} /> {detailsModal.email}</div>
                                        <div className="flex items-center gap-2"><Phone size={14} /> {detailsModal.phone || t('clinics.na')}</div>
                                        <div className="flex items-center gap-2"><MapPin size={14} /> {detailsModal.address || t('clinics.na')}</div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                        <Cpu size={16} className="text-emerald-500" /> System
                                    </h4>
                                    <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-2">
                                            <span className="text-slate-500">{t('clinics.clinicId')}:</span>
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono">
                                                    {showClinicId ? detailsModal.id : '••••••••-••••-••••-••••-••••••••••••'}
                                                </span>
                                                <button
                                                    onClick={() => setShowClinicId(!showClinicId)}
                                                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    title={showClinicId ? "Hide ID" : "Show ID"}
                                                >
                                                    {showClinicId ? <EyeOff size={14} /> : <Eye size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2"><span className="text-slate-500">{t('clinics.version')}:</span> v{detailsModal.systemVersion || '1.0.0'}</div>
                                        <div className="flex items-center gap-2"><span className="text-slate-500">{t('clinics.createdAt')}:</span> {formatDate(detailsModal.createdAt)}</div>
                                    </div>
                                </div>
                            </div>

                            {detailsModal.users && detailsModal.users.length > 0 && (
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                                    <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-3">
                                        <FileText size={16} className="text-emerald-500" /> {t('clinics.users')} ({detailsModal.users.length})
                                    </h4>
                                    <div className="grid gap-3">
                                        {detailsModal.users.map(user => (
                                            <div key={user.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                                                <div>
                                                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{user.name}</div>
                                                    <div className="text-xs text-slate-500">{user.email}</div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">{user.role}</span>
                                                    {user.status && (
                                                        <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">{user.status}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                                <h4 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                    <Key size={16} className="text-emerald-500" /> License & Subscription
                                </h4>
                                {detailsModal.license ? (
                                    <div className="p-4 rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/50 dark:bg-emerald-900/10 space-y-2">
                                        <div className="flex items-center justify-between text-xs font-mono text-emerald-700 dark:text-emerald-300">
                                            <span>{detailsModal.license.serial}</span>
                                            <span className="font-semibold">{detailsModal.license.status}</span>
                                        </div>
                                        <div className="text-sm text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                            <Calendar size={14} /> {t('clinics.expires')}: {formatDate(detailsModal.license.expireDate)}
                                        </div>
                                        <div className="text-sm text-slate-700 dark:text-slate-200">
                                            {t('clinics.plan')}: {detailsModal.license.plan?.name || t('clinics.na')} · {t('clinics.deviceLimit')}: {detailsModal.license.deviceLimit}
                                        </div>
                                        {subscriptionFor(detailsModal) && (
                                            <div className="text-sm text-slate-600 dark:text-slate-300">
                                                {t('clinics.remainingDays')}: <span className="font-semibold">{subscriptionFor(detailsModal)?.remainingDays}</span>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="text-sm text-slate-500">{t('clinics.noLicense')}</div>
                                )}
                            </div>
                        </div>

                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-wrap gap-3 justify-end rounded-b-2xl">
                            <button
                                onClick={() => setDetailsModal(null)}
                                className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                onClick={() => openAssignModal(detailsModal)}
                                className="px-4 py-2 rounded-lg text-white bg-sky-500 hover:bg-sky-600 transition-colors text-sm font-semibold"
                            >
                                {t('clinics.assignCta')}
                            </button>
                            {detailsModal.status === RegistrationStatus.PENDING && (
                                <>
                                    <button
                                        onClick={() => setConfirmAction({ type: 'reject', clinic: detailsModal })}
                                        className="px-4 py-2 rounded-lg text-white bg-rose-500 hover:bg-rose-600 text-sm font-semibold"
                                    >
                                        Reject
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction({ type: 'approve', clinic: detailsModal })}
                                        className="px-4 py-2 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
                                    >
                                        Approve
                                    </button>
                                </>
                            )}
                            {detailsModal.status === RegistrationStatus.APPROVED && (
                                <>
                                    <button
                                        onClick={() => setConfirmAction({ type: 'suspend', clinic: detailsModal })}
                                        className="px-4 py-2 rounded-lg text-white bg-amber-500 hover:bg-amber-600 text-sm font-semibold"
                                    >
                                        Suspend
                                    </button>
                                    <button
                                        onClick={() => setConfirmAction({ type: 'force-logout', clinic: detailsModal })}
                                        className="px-4 py-2 rounded-lg text-white bg-rose-500 hover:bg-rose-600 text-sm font-semibold"
                                    >
                                        Force Logout
                                    </button>
                                </>
                            )}
                            {detailsModal.status === RegistrationStatus.SUSPENDED && (
                                <button
                                    onClick={() => setConfirmAction({ type: 'reactivate', clinic: detailsModal })}
                                    className="px-4 py-2 rounded-lg text-white bg-emerald-500 hover:bg-emerald-600 text-sm font-semibold"
                                >
                                    Reactivate
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
                            ? t('clinics.requestsSubtitle')
                            : t('clinics.manageSubtitle')}
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder={t('clinics.searchPlaceholder')}
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-10 pr-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-72"
                        />
                    </div>
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as RegistrationStatus | 'ALL')}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                        {statusOptions.map(opt => (
                            <option key={opt.value} value={opt.value}>{t(opt.label)}</option>
                        ))}
                    </select>
                    <button
                        onClick={fetchClinics}
                        disabled={loading}
                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                        title="Refresh Data"
                    >
                        <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <span className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                        {t('clinics.autoRefresh')}
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                {loading && clinics.length === 0 ? (
                    <div className="p-12 flex justify-center">
                        <Loader2 className="animate-spin text-emerald-500" size={32} />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="p-12 text-center text-slate-500">
                        {search ? t('clinics.noResults') : t('clinics.noClinics')}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{t('clinics.tableClinic')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{t('clinics.tableStatus')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{t('clinics.tablePlan')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{t('clinics.tableRemaining')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{t('clinics.tableCreated')}</th>
                                    <th className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300 text-right">{t('common.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                {filtered.map((clinic) => {
                                    const sub = subscriptions[clinic.id];
                                    const days = remainingDays(clinic);
                                    return (
                                        <tr key={clinic.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                                                    {clinic.name}
                                                    {sub?.forceLogout && (
                                                        <span className="px-2 py-0.5 text-[11px] rounded bg-rose-100 dark:bg-rose-900/40 text-rose-600 border border-rose-200 dark:border-rose-800">{t('clinics.forceLogoutActive')}</span>
                                                    )}
                                                </div>
                                                <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                                    <span className="font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/40">
                                                        {clinic.id.substring(0, 8)}...
                                                    </span>
                                                    <span>{clinic.email}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusBadge(clinic.status)}`}>
                                                    {t(`clinics.statusLabel.${clinic.status.toLowerCase()}` as any)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-slate-700 dark:text-slate-200">
                                                    {clinic.license?.plan?.name || '—'}
                                                </div>
                                                {clinic.license && (
                                                    <div className="text-xs text-slate-500 flex items-center gap-1">
                                                        <Key size={12} /> {clinic.license.serial.substring(0, 10)}...
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                                                {days !== null ? `${days} ${t('clinics.days')}` : '—'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-700 dark:text-slate-200">
                                                {formatDate(clinic.createdAt)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => {
                                                            setDetailsModal(clinic);
                                                            setShowClinicId(false);
                                                        }}
                                                        className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-600"
                                                        title={t('clinics.viewDetails')}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openAssignModal(clinic)}
                                                        className="p-2 text-sky-500 hover:bg-sky-500/10 rounded-lg transition-colors border border-sky-500/20"
                                                        title={t('clinics.assignCta')}
                                                    >
                                                        <KeyRound size={18} />
                                                    </button>
                                                    {clinic.status === RegistrationStatus.PENDING && (
                                                        <>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'approve', clinic })}
                                                                disabled={processing === clinic.id}
                                                                className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                                                                title={t('clinics.approve')}
                                                            >
                                                                {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <CheckCircle2 size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => openRejectModal(clinic)}
                                                                disabled={processing === clinic.id}
                                                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
                                                                title={t('clinics.reject')}
                                                            >
                                                                {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <XCircle size={18} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    {clinic.status === RegistrationStatus.APPROVED && (
                                                        <>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'suspend', clinic })}
                                                                disabled={processing === clinic.id}
                                                                className="p-2 text-amber-500 hover:bg-amber-500/10 rounded-lg transition-colors border border-amber-500/20"
                                                                title={t('clinics.suspend')}
                                                            >
                                                                {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <Ban size={18} />}
                                                            </button>
                                                            <button
                                                                onClick={() => setConfirmAction({ type: 'force-logout', clinic })}
                                                                disabled={processing === clinic.id}
                                                                className="p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
                                                                title={t('clinics.forceLogout')}
                                                            >
                                                                {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <LogOut size={18} />}
                                                            </button>
                                                        </>
                                                    )}
                                                    {clinic.status === RegistrationStatus.SUSPENDED && (
                                                        <button
                                                            onClick={() => setConfirmAction({ type: 'reactivate', clinic })}
                                                            disabled={processing === clinic.id}
                                                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors border border-emerald-500/20"
                                                            title={t('clinics.reactivate')}
                                                        >
                                                            {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <PlayCircle size={18} />}
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => setConfirmAction({ type: 'delete', clinic })}
                                                        disabled={processing === clinic.id}
                                                        className="p-2 text-rose-600 hover:bg-rose-500/10 rounded-lg transition-colors border border-rose-500/20"
                                                        title={t('clinics.delete')}
                                                    >
                                                        {processing === clinic.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Clinics;
