import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    Server,
    ChevronLeft,
    ExternalLink,
    Activity,
    Clock,
    Globe,
    User,
    CheckCircle2,
    XCircle,
    Copy,
    RefreshCcw,
    Loader2,
    FileText,
    Dna,
    Stethoscope,
    ImageIcon,
    Zap
} from 'lucide-react';
import api from '../services/api';
import { useTranslation } from '../hooks/useTranslation';

// --- Sub-components ---

const GlassCard = ({ children, className = "", title, icon: Icon }: { children: React.ReactNode, className?: string, title?: string, icon?: any }) => (
    <div className={`glass-card overflow-hidden border border-white/10 dark:border-white/5 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl transition-all duration-500 hover:shadow-primary-500/5 ${className}`}>
        {title && (
            <div className="px-10 pt-10 pb-6 flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/50 mb-6">
                {Icon && <div className="p-3 bg-primary-500/10 rounded-2xl text-primary-500"><Icon size={20} /></div>}
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">{title}</h3>
            </div>
        )}
        <div className={title ? "px-10 pb-10" : ""}>
            {children}
        </div>
    </div>
);

const DataRow = ({ label, value, icon: Icon, mono = false, copyable = false }: any) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="group flex flex-col sm:flex-row sm:items-center justify-between py-5 border-b border-slate-100 dark:border-slate-800 last:border-0">
            <div className="flex items-center gap-3 mb-2 sm:mb-0">
                {Icon && <Icon size={16} className="text-slate-400 group-hover:text-primary-500 transition-colors" />}
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{label}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className={`text-sm font-bold text-slate-900 dark:text-white ${mono ? 'font-mono bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs' : ''}`}>
                    {value || 'Not Configured'}
                </span>
                {copyable && value && (
                    <button onClick={handleCopy} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-500 transition-all">
                        {copied ? <CheckCircle2 size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main Component ---

const ClinicDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { t } = useTranslation();

    const [clinic, setClinic] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            const data = await api.get<any>(`/clinics/requests`);
            const found = data.find((c: any) => c.id === id);

            if (!found) throw new Error('System node not found in registry.');

            setClinic(found);
            setError(null);
        } catch (err: any) {
            setError(err.message || 'Interstellar link failure.');
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] dark:bg-[#020617]">
                <div className="text-center group">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                        <div className="absolute inset-0 border-4 border-primary-500/20 rounded-full animate-spin border-t-primary-500" />
                        <div className="absolute inset-4 border-4 border-indigo-500/10 rounded-full animate-spin-slow border-b-indigo-500" />
                        <Server className="absolute inset-0 m-auto text-primary-500 animate-pulse" size={32} />
                    </div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] font-mono">Syncing with Node {id?.substring(0, 8)}...</p>
                </div>
            </div>
        );
    }

    if (error || !clinic) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
                <XCircle size={64} className="text-rose-500 mb-6 animate-bounce" />
                <h2 className="text-2xl font-black uppercase tracking-tighter mb-2 italic">Node Unreachable</h2>
                <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest mb-8">{error}</p>
                <button
                    onClick={() => navigate('/clinics')}
                    className="px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all shadow-xl shadow-primary-500/10"
                >
                    Return to Topology
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] dark:bg-[#020617] text-slate-950 dark:text-slate-100 font-sans selection:bg-primary-500/30">
            {/* Ambient Lighting */}
            <div className="fixed top-0 right-0 w-[50%] h-[50%] bg-primary-500/5 blur-[150px] pointer-events-none" />
            <div className="fixed bottom-0 left-0 w-[50%] h-[50%] bg-indigo-500/5 blur-[150px] pointer-events-none" />

            <div className="relative max-w-[1400px] mx-auto p-6 md:p-12 lg:p-16">
                {/* Top Nav */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
                    <div className="space-y-6">
                        <button
                            onClick={() => navigate('/clinics')}
                            className="flex items-center gap-2 text-[10px] font-black text-slate-400 hover:text-primary-500 transition-all uppercase tracking-widest group"
                        >
                            <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Infrastructure Registry
                        </button>
                        <div>
                            <div className="flex items-baseline gap-4 mb-3">
                                <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic bg-gradient-to-r from-slate-950 via-primary-600 to-slate-950 dark:from-white dark:via-primary-400 dark:to-white bg-clip-text text-transparent leading-tight">
                                    {clinic.name}
                                </h1>
                                <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl border ${clinic.status === 'APPROVED'
                                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                    {clinic.status}
                                </div>
                            </div>
                            <p className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-[0.25em]">
                                <Globe size={14} className="text-primary-500" />
                                Assigned Node ID: <span className="text-slate-900 dark:text-white font-mono">{clinic.id}</span>
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => navigate(`/clinics/${clinic.id}/control`)}
                            className="flex items-center gap-3 px-8 py-5 bg-primary-500 text-white rounded-3xl font-black uppercase tracking-widest text-xs transition-all hover:scale-[1.05] active:scale-95 shadow-2xl shadow-primary-500/30 group"
                        >
                            <Zap size={18} className="group-hover:animate-pulse" />
                            Control Panel
                        </button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left Column: Identity & Access */}
                    <div className="lg:col-span-12 xl:col-span-8 space-y-10">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Identity Section */}
                            <GlassCard title="Identity & Contact" icon={User}>
                                <div className="space-y-2">
                                    <DataRow label="Node Manager" value={clinic.doctorName || 'N/A'} icon={User} />
                                    <DataRow label="Gateway Email" value={clinic.email} icon={Mail} copyable />
                                    <DataRow label="Terminal Phone" value={clinic.phone} icon={Phone} />
                                    <DataRow label="Physical Deployment" value={clinic.address} icon={MapPin} />
                                </div>
                            </GlassCard>

                            {/* Lifecycle Section */}
                            <GlassCard title="Node Lifecycle" icon={Calendar}>
                                <div className="space-y-2">
                                    <DataRow label="Commissioned" value={new Date(clinic.createdAt).toLocaleDateString()} icon={Calendar} />
                                    <DataRow label="Last Uplink" value={new Date(clinic.updatedAt).toLocaleString()} icon={Clock} />
                                    <DataRow label="System Version" value={clinic.systemVersion || 'v1.0.0-stable'} icon={Server} mono />
                                    <DataRow label="Deployment Region" value="Global-Alpha / West-1" icon={Globe} />
                                </div>
                            </GlassCard>
                        </div>

                        {/* Feature Permissions */}
                        <GlassCard title="Provisioned Service Modules" icon={Shield}>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 pt-4">
                                {[
                                    { label: 'Management', icon: Stethoscope, enabled: clinic.control?.features?.patients },
                                    { label: 'Scheduler', icon: Calendar, enabled: clinic.control?.features?.appointments },
                                    { label: 'Ortho-X', icon: Dna, enabled: clinic.control?.features?.orthodontics },
                                    { label: 'Imaging', icon: ImageIcon, enabled: clinic.control?.features?.xray },
                                    { label: 'Alpha-AI', icon: Zap, enabled: clinic.control?.features?.ai },
                                ].map((module, i) => (
                                    <div key={i} className={`flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-500 ${module.enabled
                                            ? 'border-primary-500/30 bg-primary-500/5 text-primary-500 shadow-lg shadow-primary-500/5'
                                            : 'border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-400'
                                        }`}>
                                        <div className={`p-4 rounded-2xl mb-4 ${module.enabled ? 'bg-primary-500 text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>
                                            <module.icon size={20} />
                                        </div>
                                        <span className="text-[9px] font-black uppercase tracking-widest">{module.label}</span>
                                        <div className={`text-[8px] font-black uppercase mt-2 px-2 py-0.5 rounded-full ${module.enabled ? 'bg-primary-500/20 text-primary-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                            {module.enabled ? 'Enabled' : 'Locked'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* Right Column: Licensing & Health */}
                    <div className="lg:col-span-12 xl:col-span-4 space-y-10">
                        {/* Status Card */}
                        <div className={`relative p-10 rounded-[3rem] overflow-hidden shadow-2xl transition-all duration-700 ${clinic.status === 'APPROVED'
                                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                                : 'bg-rose-500 text-white shadow-rose-500/20'
                            }`}>
                            <div className="absolute top-0 right-0 p-12 opacity-10">
                                {clinic.status === 'APPROVED' ? <CheckCircle2 size={160} /> : <XCircle size={160} />}
                            </div>
                            <div className="relative z-10">
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-4">Node Health Level</h3>
                                <div className="flex items-center gap-4 mb-8">
                                    <Activity size={32} className="animate-pulse" />
                                    <span className="text-4xl font-black italic uppercase tracking-tighter">
                                        {clinic.status === 'APPROVED' ? 'Operational' : 'Restricted'}
                                    </span>
                                </div>
                                <div className="space-y-4 p-6 rounded-3xl bg-black/10 border border-white/10 backdrop-blur-sm">
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                        <span>Node Isolation</span>
                                        <span>{clinic.control?.locked ? 'Active' : 'Standby'}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full bg-white transition-all duration-1000 ${clinic.status === 'APPROVED' ? 'w-[100%]' : 'w-[20%]'}`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* License Card */}
                        <GlassCard title="Licensing Contract" icon={FileText}>
                            {clinic.license ? (
                                <div className="space-y-6">
                                    <div className="p-6 rounded-3xl bg-primary-500/5 border border-primary-500/10">
                                        <p className="text-[9px] font-black text-primary-500 uppercase tracking-widest mb-1">Active Entitlement</p>
                                        <p className="text-xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white">
                                            {clinic.license.plan?.name || 'Standard License'}
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <DataRow label="Contract Serial" value={clinic.license.serial} mono copyable />
                                        <DataRow label="Entitlement Expiry" value={clinic.license.expireDate ? new Date(clinic.license.expireDate).toLocaleDateString() : 'Perpetual'} />
                                        <DataRow label="Device Allocation" value={`${clinic.license.deviceLimit} Multi-Node`} />
                                    </div>
                                    <button
                                        onClick={() => navigate('/licenses')}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-slate-100 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all group"
                                    >
                                        Review Global Licenses
                                        <ExternalLink size={14} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText className="text-slate-400" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">No Active License Detected</p>
                                </div>
                            )}
                        </GlassCard>

                        {/* Quick Insights */}
                        <div className="p-10 rounded-[3.5rem] bg-slate-950 text-white shadow-2xl relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4">
                                <RefreshCcw size={16} className="opacity-20 group-hover:rotate-180 transition-transform duration-1000" />
                            </div>
                            <h4 className="text-[9px] font-black uppercase tracking-[0.4em] text-primary-500 mb-6 italic">Protocol Metadata</h4>
                            <div className="space-y-2 font-mono text-[10px] opacity-60">
                                <p>// Node status verified {new Date().toLocaleTimeString()}</p>
                                <p>// SSL Encryption: active_tls_1.3</p>
                                <p>// Data Integrity: 100% match</p>
                                <p>// Regional Latency: 12ms</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Global Style Inject */}
            <style>{`
                @keyframes spin-slow {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(-360deg); }
                }
                .animate-spin-slow {
                    animation: spin-slow 8s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default ClinicDetails;
