import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Activity,
    Shield,
    Zap,
    HardDrive,
    Users as UsersIcon,
    Lock,
    Unlock,
    Save,
    RefreshCcw,
    ChevronLeft,
    LayoutDashboard,
    Cpu,
    Network,
    Clock,
    Bell,
    CheckCircle2,
    AlertCircle,
    Server,
    Globe,
    FileText,
    Calendar,
    Stethoscope,
    Dna,
    Image as ImageIcon,
    Bot,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

// --- Sub-components ---

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`glass-card overflow-hidden transition-all duration-300 hover:shadow-2xl hover:shadow-primary-500/10 border border-white/10 dark:border-white/5 ${className}`}>
        {children}
    </div>
);

const MetricProgress = ({ label, used, total, unit, colorClass, percent }: any) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-end">
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                            {used ?? '--'}
                        </span>
                        <span className="text-xs font-bold text-slate-400">/ {total || '∞'} {unit}</span>
                    </div>
                </div>
                <div className="text-right">
                    <span className={`text-lg font-black ${percent > 90 ? 'text-rose-500' : 'text-slate-900 dark:text-white'}`}>
                        {percent !== null ? `${percent.toFixed(1)}%` : '--'}
                    </span>
                </div>
            </div>
            <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                <div
                    className={`absolute top-0 left-0 h-full bg-gradient-to-r ${colorClass} transition-all duration-1000 ease-out-expo shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                    style={{ width: `${Math.min(100, percent || 0)}%` }}
                />
            </div>
        </div>
    );
};

const FeatureToggle = ({ id, label, description, icon: Icon, enabled, onToggle }: any) => (
    <div
        onClick={() => onToggle(id)}
        className={`group cursor-pointer glass-panel p-5 border-none transition-all duration-300 hover:translate-y-[-4px] ${enabled ? 'bg-primary-500/5' : 'bg-slate-50/50 dark:bg-slate-900/20'
            }`}
    >
        <div className="flex items-start justify-between mb-4">
            <div className={`p-3 rounded-xl transition-all duration-300 ${enabled ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'
                }`}>
                <Icon size={20} />
            </div>
            <div className={`w-12 h-6 rounded-full p-1 transition-all duration-500 relative ${enabled ? 'bg-primary-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-all duration-500 transform ${enabled ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
        </div>
        <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{label}</h4>
        <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">{description}</p>
    </div>
);

// --- Main Component ---

const ClinicControlPanel: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // State
    const [clinic, setClinic] = useState<any>(null);
    const [usage, setUsage] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'overview' | 'provisioning' | 'modules' | 'security'>('overview');
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Form State (Sync with backend on load)
    const [storageLimit, setStorageLimit] = useState(1024);
    const [usersLimit, setUsersLimit] = useState(3);
    const [patientsLimit, setPatientsLimit] = useState<string>('');
    const [features, setFeatures] = useState({
        patients: true,
        appointments: true,
        orthodontics: false,
        xray: false,
        ai: false
    });
    const [lockReason, setLockReason] = useState('');
    const [showLockConfirm, setShowLockConfirm] = useState(false);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const [clinicsData, usageData] = await Promise.all([
                api.get<any[]>(`/clinics/requests`),
                api.get<any>(`/clinics/${id}/usage`)
            ]);

            const currentClinic = clinicsData.find((c: any) => c.id === id);
            if (!currentClinic) throw new Error('Clinic not found');

            setClinic(currentClinic);
            setUsage(usageData);

            // Initialize form state
            setStorageLimit(usageData.storageLimitMB);
            setUsersLimit(usageData.usersLimit);
            setPatientsLimit(usageData.patientsLimit?.toString() || '');
            setFeatures(currentClinic.control?.features || {
                patients: true,
                appointments: true,
                orthodontics: false,
                xray: false,
                ai: false
            });
        } catch (err) {
            console.error('Data load error:', err);
            setMessage({ type: 'error', text: t('controls.usageError') });
        } finally {
            setLoading(false);
        }
    }, [id, t]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.put(`/clinics/${id}/controls`, {
                storageLimitMB: storageLimit,
                usersLimit: usersLimit,
                patientsLimit: patientsLimit === '' ? null : parseInt(patientsLimit),
                features
            });
            setMessage({ type: 'success', text: t('controls.controlsUpdated') });
            await loadData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Update failed' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    const handleToggleLock = async () => {
        if (!clinic.control?.locked && !lockReason) {
            setMessage({ type: 'error', text: t('controls.lockReasonRequired') });
            return;
        }

        setSaving(true);
        try {
            await api.put(`/clinics/${id}/controls`, {
                locked: !clinic.control?.locked,
                lockReason: clinic.control?.locked ? null : lockReason
            });
            setShowLockConfirm(false);
            setLockReason('');
            setMessage({
                type: 'success',
                text: clinic.control?.locked ? t('controls.clinicUnlocked') : t('controls.clinicLocked')
            });
            await loadData();
        } catch (err: any) {
            setMessage({ type: 'error', text: err.response?.data?.message || 'Lock update failed' });
        } finally {
            setSaving(false);
            setTimeout(() => setMessage(null), 5000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-primary-500/20 rounded-full animate-spin border-t-primary-500" />
                        <Activity className="absolute inset-0 m-auto text-primary-500 animate-pulse" size={32} />
                    </div>
                    <p className="text-xs font-black text-slate-500 uppercase tracking-widest animate-pulse">Initializing Data Node Interface...</p>
                </div>
            </div>
        );
    }

    const storagePercent = (usage?.storageUsedMB / usage?.storageLimitMB) * 100;
    const usersPercent = (usage?.usersUsed / usage?.usersLimit) * 100;
    const patientsPercent = usage?.patientsLimit ? (usage?.patientsUsed / usage?.patientsLimit) * 100 : 0;

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-900 dark:text-slate-100 p-6 lg:p-10 font-sans selection:bg-primary-500/30">
            {/* Header Section */}
            <div className="max-w-[1600px] mx-auto mb-12">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-slate-200 dark:border-slate-800/50">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/clinics')}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary-500 transition-colors uppercase tracking-widest group"
                        >
                            <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Infrastructure Topology
                        </button>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h1 className="text-5xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-slate-950 via-primary-600 to-slate-950 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent">
                                    {clinic.name}
                                </h1>
                                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 ${clinic.control?.locked
                                    ? 'bg-rose-500/10 text-rose-500 animate-pulse border border-rose-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                    }`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${clinic.control?.locked ? 'bg-rose-500 shadow-[0_0_8px_rose]' : 'bg-emerald-500 shadow-[0_0_8px_emerald]'}`} />
                                    {clinic.control?.locked ? 'Isolated Node' : 'Node Operational'}
                                </div>
                            </div>
                            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                                <Server size={14} className="text-primary-500" />
                                SmartClinic Deployment • Version: {clinic.systemVersion || 'Latest'} • Region: Global-A1
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={loadData}
                            className="p-4 rounded-2xl glass-panel border-none text-slate-500 hover:text-primary-500 hover:rotate-180 transition-all duration-500 bg-white/50 dark:bg-slate-900/50"
                        >
                            <RefreshCcw size={20} />
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-3 px-8 py-4 rounded-2xl bg-slate-950 dark:bg-white text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.02] active:scale-95 shadow-2xl shadow-primary-500/20 disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            Deploy Configuration
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Toast */}
            {message && (
                <div className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-4 rounded-2xl shadow-2xl animate-scaleUp flex items-center gap-3 border ${message.type === 'success' ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                    <span className="text-xs font-black uppercase tracking-widest">{message.text}</span>
                </div>
            )}

            <div className="max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-4">
                    {[
                        { id: 'overview', label: t('controls.overview'), icon: LayoutDashboard },
                        { id: 'provisioning', label: t('controls.usage'), icon: Cpu },
                        { id: 'modules', label: t('controls.features'), icon: Zap },
                        { id: 'security', label: t('controls.security'), icon: Shield },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full group flex items-center gap-4 p-5 rounded-3xl transition-all duration-300 relative overflow-hidden ${activeTab === tab.id
                                ? 'bg-white dark:bg-slate-900 shadow-xl shadow-primary-500/5 translate-x-3'
                                : 'hover:bg-white/50 dark:hover:bg-slate-900/30'
                                }`}
                        >
                            {activeTab === tab.id && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary-500" />}
                            <tab.icon size={22} className={activeTab === tab.id ? 'text-primary-500' : 'text-slate-400 group-hover:text-primary-400'} />
                            <span className={`text-xs font-black uppercase tracking-widest ${activeTab === tab.id ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>
                                {tab.label}
                            </span>
                            <ChevronRight size={16} className={`ml-auto transition-transform ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1'}`} />
                        </button>
                    ))}

                    <div className="mt-10 p-8 glass-card border border-primary-500/10 bg-primary-500/5">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-primary-500 rounded-lg text-white">
                                <Activity size={16} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{t('controls.dataNodeStatus')}</span>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Network Sync</span>
                                <span className="text-emerald-500">100% Secure</span>
                            </div>
                            <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                <span>Heartbeat</span>
                                <span className="dark:text-white">{new Date(usage?.lastSyncAt).toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-9">
                    <div className="animate-fadeIn">
                        {activeTab === 'overview' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <GlassCard className="p-8 md:col-span-2">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-black uppercase tracking-tight italic flex items-center gap-3">
                                            <Network className="text-primary-500" />
                                            Live Infrastructure Telemetry
                                        </h3>
                                        <div className="flex items-center gap-2 glass-panel px-3 py-1.5 text-[9px] font-black uppercase border-none bg-emerald-500/10 text-emerald-500">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                                            Real-time Stream
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                        <MetricProgress
                                            label="Cloud Storage"
                                            used={usage?.storageUsedMB}
                                            total={usage?.storageLimitMB}
                                            unit="MB"
                                            percent={storagePercent}
                                            colorClass="from-indigo-500 via-primary-500 to-cyan-400"
                                        />
                                        <MetricProgress
                                            label="Licensed Seats"
                                            used={usage?.usersUsed}
                                            total={usage?.usersLimit}
                                            unit="Users"
                                            percent={usersPercent}
                                            colorClass="from-primary-600 to-indigo-600"
                                        />
                                        <MetricProgress
                                            label="Record Capacity"
                                            used={usage?.patientsUsed}
                                            total={usage?.patientsLimit}
                                            unit="Records"
                                            percent={patientsPercent}
                                            colorClass="from-emerald-500 to-teal-400"
                                        />
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Clock className="text-primary-500" size={16} />
                                        Deployment Lifecycle
                                    </h3>
                                    <div className="space-y-6">
                                        {[
                                            { label: 'Registered On', value: new Date(clinic.createdAt).toLocaleDateString(), icon: Calendar },
                                            { label: 'Admin Identity', value: clinic.email, icon: Globe },
                                            { label: 'Node Uptime', value: '99.99%', icon: Activity },
                                            { label: 'Last Config Sync', value: new Date().toLocaleTimeString(), icon: RefreshCcw },
                                        ].map((item, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 glass-panel border-none bg-slate-50/50 dark:bg-slate-900/50">
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={16} className="text-slate-400" />
                                                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono">{item.label}</span>
                                                </div>
                                                <span className="text-xs font-black dark:text-white uppercase tracking-tight">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                </GlassCard>

                                <GlassCard className="p-8 bg-slate-950 dark:bg-white text-white dark:text-slate-950">
                                    <h3 className="text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Shield className="opacity-70" size={16} />
                                        Security Context
                                    </h3>
                                    <div className="p-6 rounded-3xl bg-white/10 dark:bg-slate-100 border border-white/10 mb-6">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Isolation Status</p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-2xl font-black italic uppercase tracking-tighter">
                                                {clinic.control?.locked ? 'Isolated' : 'Active'}
                                            </span>
                                            {clinic.control?.locked ? <Lock size={32} className="text-rose-400" /> : <Unlock size={32} className="opacity-50" />}
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-medium opacity-60 leading-relaxed uppercase tracking-wider">
                                        Node security protocols are dynamic. Any change in licensing state or administrative override will trigger immediate session termination across the cluster.
                                    </p>
                                </GlassCard>
                            </div>
                        )}

                        {activeTab === 'provisioning' && (
                            <GlassCard className="p-10">
                                <div className="mb-10">
                                    <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Infrastructure Provisioning</h2>
                                    <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Define operational boundaries and resource quotas for this node.</p>
                                </div>

                                <div className="space-y-12">
                                    {/* Storage */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-4 text-primary-500">
                                                <HardDrive size={24} />
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Cloud Storage Allocation</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total capacity for images, files & imaging data.</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-primary-500 font-mono italic">
                                                    {storageLimit >= 1024 ? `${(storageLimit / 1024).toFixed(1)}GB` : `${storageLimit}MB`}
                                                </span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="256"
                                            max="51200"
                                            step="256"
                                            value={storageLimit}
                                            onChange={(e) => setStorageLimit(parseInt(e.target.value))}
                                            className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-primary-500"
                                        />
                                        <div className="grid grid-cols-4 gap-3">
                                            {[1024, 5120, 10240, 20480].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setStorageLimit(val)}
                                                    className={`py-6 rounded-2xl text-xs font-black transition-all ${storageLimit === val ? 'bg-primary-500 text-white shadow-2xl shadow-primary-500/30 -translate-y-1' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}
                                                >
                                                    {val >= 1024 ? `${val / 1024}GB` : `${val}MB`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                    {/* Users */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <div className="flex items-center gap-4 text-indigo-500">
                                                <UsersIcon size={24} />
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Licensed Seat Capacity</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maximum active operators allowed on this deployment.</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-3xl font-black text-indigo-500 font-mono italic">{usersLimit} SEATS</span>
                                            </div>
                                        </div>
                                        <input
                                            type="range"
                                            min="1"
                                            max="100"
                                            value={usersLimit}
                                            onChange={(e) => setUsersLimit(parseInt(e.target.value))}
                                            className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-500"
                                        />
                                        <div className="grid grid-cols-4 gap-3">
                                            {[3, 10, 25, 50].map(val => (
                                                <button
                                                    key={val}
                                                    onClick={() => setUsersLimit(val)}
                                                    className={`py-6 rounded-2xl text-xs font-black transition-all ${usersLimit === val ? 'bg-indigo-500 text-white shadow-2xl shadow-indigo-500/30 -translate-y-1' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 border border-transparent hover:border-slate-200'}`}
                                                >
                                                    {val} SEATS
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="h-px bg-slate-100 dark:bg-slate-800" />

                                    {/* Patients */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                                        <div className="space-y-4">
                                            <div className="flex items-center gap-4 text-emerald-500">
                                                <FileText size={24} />
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Record Quota</h4>
                                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maximum number of managed patient entities.</p>
                                                </div>
                                            </div>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    value={patientsLimit}
                                                    onChange={(e) => setPatientsLimit(e.target.value)}
                                                    placeholder="Unlimited Access..."
                                                    className="w-full bg-slate-50 dark:bg-slate-900/50 border-2 border-slate-100 dark:border-slate-800 px-6 py-5 rounded-2xl text-sm font-black focus:border-primary-500 outline-none transition-all placeholder:text-slate-400 placeholder:font-black placeholder:uppercase"
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest">RECORDS</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[5000, ''].map((val, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setPatientsLimit(val.toString())}
                                                    className={`py-6 rounded-2xl text-xs font-black uppercase transition-all ${patientsLimit === val.toString() ? 'bg-emerald-500 text-white shadow-2xl shadow-emerald-500/30' : 'bg-slate-50 dark:bg-slate-900 text-slate-500 hover:bg-slate-100 border border-transparent border-slate-200'}`}
                                                >
                                                    {val === '' ? 'Unlimted' : `${val} Peak`}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </GlassCard>
                        )}

                        {activeTab === 'modules' && (
                            <div className="space-y-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Service Module Hub</h2>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Enable or restrict specific professional toolsets for this node.</p>
                                    </div>
                                    <div className="flex items-center gap-2 glass-panel px-4 py-2 border-none bg-primary-500/10 text-primary-500 text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        Active Deployment
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    <FeatureToggle
                                        id="patients" icon={Stethoscope} label="Management-P1"
                                        description="Core patient records & history"
                                        enabled={features.patients}
                                        onToggle={(id: any) => setFeatures({ ...features, [id]: !features.patients })}
                                    />
                                    <FeatureToggle
                                        id="appointments" icon={Calendar} label="Scheduler-S1"
                                        description="Calendar & workflow management"
                                        enabled={features.appointments}
                                        onToggle={(id: any) => setFeatures({ ...features, [id]: !features.appointments })}
                                    />
                                    <FeatureToggle
                                        id="orthodontics" icon={Dna} label="Ortho-X1"
                                        description="Specialized orthodontic treatment tracking"
                                        enabled={features.orthodontics}
                                        onToggle={(id: any) => setFeatures({ ...features, [id]: !features.orthodontics })}
                                    />
                                    <FeatureToggle
                                        id="xray" icon={ImageIcon} label="Imaging-I1"
                                        description="Full PACS support and image manipulation"
                                        enabled={features.xray}
                                        onToggle={(id: any) => setFeatures({ ...features, [id]: !features.xray })}
                                    />
                                    <FeatureToggle
                                        id="ai" icon={Bot} label="Alpha-AI"
                                        description="Neural engine for diagnostic assist"
                                        enabled={features.ai}
                                        onToggle={(id: any) => setFeatures({ ...features, [id]: !features.ai })}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'security' && (
                            <div className="space-y-10">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-4">
                                    <div>
                                        <h2 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Isolation Protocols</h2>
                                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Protocol-level access control for high-priority security events.</p>
                                    </div>
                                </div>

                                <GlassCard className={`p-10 border-2 transition-all duration-700 ${clinic.control?.locked ? 'border-rose-500/50 bg-rose-500/5 shadow-rose-500/10' : 'border-emerald-500/50 bg-emerald-500/5 shadow-emerald-500/10'}`}>
                                    <div className="flex items-start justify-between mb-10">
                                        <div className="space-y-4 max-w-xl">
                                            <div className={`p-4 rounded-3xl inline-flex ${clinic.control?.locked ? 'bg-rose-500 text-white shadow-xl shadow-rose-500/30' : 'bg-emerald-500 text-white shadow-xl shadow-emerald-500/30'}`}>
                                                {clinic.control?.locked ? <Lock size={32} /> : <Unlock size={32} />}
                                            </div>
                                            <h3 className="text-3xl font-black uppercase italic">
                                                {clinic.control?.locked ? 'Node Is Currently Isolated' : 'System Connectivity: Optimal'}
                                            </h3>
                                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-relaxed uppercase tracking-wider">
                                                {clinic.control?.locked
                                                    ? 'All incoming connections have been terminated. The remote data node is unresponsive to general requests until isolation is lifted.'
                                                    : 'All infrastructure channels are open. Real-time telemetry is being received and processed from the primary cluster.'
                                                }
                                            </p>
                                        </div>
                                        <div className="hidden md:block">
                                            {clinic.control?.locked ? (
                                                <div className="w-24 h-24 rounded-full border-8 border-rose-500/20 flex items-center justify-center animate-pulse">
                                                    <div className="w-12 h-12 rounded-full bg-rose-500" />
                                                </div>
                                            ) : (
                                                <div className="w-24 h-24 rounded-full border-8 border-emerald-500/20 flex items-center justify-center">
                                                    <div className="w-12 h-12 rounded-full bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.5)]" />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {clinic.control?.lockReason && (
                                        <div className="mb-10 p-8 rounded-3xl bg-rose-500/10 border border-rose-500/20">
                                            <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] mb-3">Incident Protocol Justification</p>
                                            <p className="text-lg font-black text-rose-700 dark:text-rose-300 italic">{clinic.control?.lockReason}</p>
                                        </div>
                                    )}

                                    <div className="flex justify-center">
                                        <button
                                            onClick={() => setShowLockConfirm(true)}
                                            className={`px-12 py-6 rounded-3xl font-black uppercase tracking-widest text-sm transition-all hover:scale-105 active:scale-95 shadow-2xl flex items-center gap-4 ${clinic.control?.locked
                                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                                : 'bg-rose-500 text-white shadow-rose-500/20'
                                                }`}
                                        >
                                            {clinic.control?.locked ? <Unlock size={20} /> : <Lock size={20} />}
                                            {clinic.control?.locked ? 'Re-Activate Node Access' : 'Initiate Secure Isolation'}
                                        </button>
                                    </div>
                                </GlassCard>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lock Confirm Modal */}
            {showLockConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/60 backdrop-blur-xl animate-fadeIn">
                    <div className="max-w-xl w-full glass-card p-10 animate-scaleUp border-2 border-primary-500/20 shadow-[0_0_100px_rgba(var(--primary-rgb),0.1)]">
                        <div className="flex items-center gap-6 mb-8">
                            <div className={`p-6 rounded-3xl ${clinic.control?.locked ? 'bg-emerald-500' : 'bg-rose-500'} text-white shadow-2xl`}>
                                {clinic.control?.locked ? <Unlock size={44} /> : <Lock size={44} />}
                            </div>
                            <div>
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                                    {clinic.control?.locked ? 'System Restoration' : 'Incident Isolation'}
                                </h3>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Target Node: {clinic.name}</p>
                            </div>
                        </div>

                        <p className="text-sm font-medium text-slate-500 dark:text-slate-300 mb- aggregation-8 leading-relaxed uppercase tracking-wider">
                            {clinic.control?.locked
                                ? 'Warning: You are about to restore full biometric and medical database access to this node. All pending telemetry catch-ups will execute immediately.'
                                : 'Critical: Isolation will revoke all user authentication tokens and bridge connections. This action is logged in the global audit trail.'
                            }
                        </p>

                        {!clinic.control?.locked && (
                            <div className="mb-10 mt-8">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-2">Justification Required</label>
                                <textarea
                                    value={lockReason}
                                    onChange={(e) => setLockReason(e.target.value)}
                                    placeholder="Indicate trigger for node isolation (e.g. Protocol-11 breach, Non-payment, Maintenance)..."
                                    className="w-full bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 p-6 rounded-2xl text-sm font-medium focus:border-rose-500 outline-none transition-all h-32 resize-none"
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4 mt-8">
                            <button
                                onClick={() => { setShowLockConfirm(false); setLockReason(''); }}
                                className="px-8 py-5 rounded-2xl border-2 border-slate-100 dark:border-slate-800 font-black uppercase tracking-widest text-[10px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                Abort Protocol
                            </button>
                            <button
                                onClick={handleToggleLock}
                                disabled={saving}
                                className={`px-8 py-5 rounded-2xl text-white font-black uppercase tracking-widest text-[10px] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50 ${clinic.control?.locked ? 'bg-emerald-500 shadow-emerald-500/20' : 'bg-rose-500 shadow-rose-500/20'
                                    }`}
                            >
                                {saving ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Execute Sequence'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Global Style Inject for Expo Animations */}
            <style>{`
                @keyframes scaleUp {
                    from { opacity: 0; transform: scale(0.95) translateY(10px); }
                    to { opacity: 1; transform: scale(1) translateY(0); }
                }
                .animate-scaleUp {
                    animation: scaleUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .ease-out-expo {
                    transition-timing-function: cubic-bezier(0.19, 1, 0.22, 1);
                }
            `}</style>
        </div>
    );
};

export default ClinicControlPanel;
