
import React from 'react';
import { X, Mail, Phone, MapPin, Calendar, Crown, Database, Shield, Zap, Activity, Info } from 'lucide-react';
import { Clinic, ClinicSubscriptionStatus } from '../../types';

interface ClinicDetailsModalProps {
    clinic: Clinic;
    subscription?: ClinicSubscriptionStatus;
    onClose: () => void;
}

const ClinicDetailsModal: React.FC<ClinicDetailsModalProps> = ({ clinic, subscription, onClose }) => {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Visual Header */}
                <div className="relative h-32 bg-slate-950 flex items-center px-10 overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full -ml-10 -mb-20 blur-3xl"></div>

                    <div className="relative z-10 flex items-center gap-6">
                        <div className="w-20 h-20 rounded-3xl bg-emerald-600 flex items-center justify-center text-white text-3xl font-black shadow-2xl shadow-emerald-600/20">
                            {clinic.name?.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{clinic.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Node Cluster</p>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content Area */}
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* System Specs */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Database size={14} className="text-blue-500" /> Instance Specification
                            </h3>
                            <div className="space-y-4">
                                <DetailItem icon={Mail} label="Contact Channel" value={clinic.email} />
                                <DetailItem icon={Phone} label="Network Line" value={clinic.phone || 'DATA_NOT_FOUND'} />
                                <DetailItem icon={MapPin} label="Physical Origin" value={clinic.address || 'GLOBAL_INSTANCE'} />
                                <DetailItem icon={Calendar} label="Initialization" value={new Date(clinic.createdAt).toLocaleDateString()} />
                            </div>
                        </div>

                        {/* Licensing Specs */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Shield size={14} className="text-emerald-500" /> Security & Billing
                            </h3>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 space-y-4">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Service Level</p>
                                    <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                        <Crown size={18} className="text-emerald-500" />
                                        {subscription?.license?.plan?.name || 'Manual Selection'}
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">License Validity</p>
                                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                                                {subscription?.remainingDays || 0} Cycles Remaining
                                            </p>
                                        </div>
                                        <Zap size={16} className="text-blue-500 mb-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Metadata Footer */}
                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-8 items-center">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase">Universal UID</p>
                            <p className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md mt-1">
                                {clinic.id}
                            </p>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl active:scale-95 transition-all"
                            >
                                Close Manifest
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailItem: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-4">
        <div className="mt-1 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-slate-400">
            <Icon size={14} />
        </div>
        <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">{value}</p>
        </div>
    </div>
);

export default ClinicDetailsModal;
